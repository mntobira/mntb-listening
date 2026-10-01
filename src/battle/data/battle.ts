/**
 * ===================================================================
 * 対戦モード: Firestore とのやりとり
 * ===================================================================
 *
 * ■ このファイルの責務
 * 「部屋を作る・入る・答えを出す・結果を確定する」だけ。
 * 点数の計算は一切しない（core/battleCore.ts が担当）。
 *
 * -------------------------------------------------------------------
 * ■ コレクション設計
 * -------------------------------------------------------------------
 *
 *   battle_rooms/{roomId}
 *     1試合＝1ドキュメント。★これが設計の中心★
 *     両者はこの1件だけを onSnapshot で購読する。
 *     問題ごとにドキュメントを分けると読み取り回数が問題数倍になり、
 *     無料枠（1日5万読み取り）で1日あたり数十試合しかできなくなる。
 *     1件にまとめれば1試合あたり約80読み取りで済む（約600試合/日）。
 *
 *   battle_codes/{joinCode}
 *     フレンド対戦の合言葉 → 部屋IDの逆引き。
 *     部屋を where 検索する設計にすると、ルール上
 *     battle_rooms 全体の list を開放することになり、
 *     他人の対戦を全部覗けてしまうので採用しない
 *     （既存の friend_codes と同じ考え方）。
 *
 *   battle_queue/{uid}
 *     全国ランダムマッチの待機列。1人1件。
 *     ★フレンド対戦が主役なので、こちらは副次的な入口★
 *
 *   battle_ranking/{uid}
 *     レート（Elo）と戦績。既存の leaderboard_* とは完全に別物。
 *     既存ランキングの集計・ルールには一切触らない。
 *
 *   battle_history/{uid}/items/{roomId}
 *     自分の対戦履歴。相手には書けない（自分の下にだけ書く）。
 *
 * -------------------------------------------------------------------
 * ■ 不正対策の考え方（Cloud Functions が使えない前提）
 * -------------------------------------------------------------------
 * 無料枠なのでサーバ側で判定するコードが置けない。
 * 「クライアントを信用しない」ではなく
 * ★クライアントが嘘をついても得をしない構造★ にする。
 *
 *   1. 点数を Firestore に保存しない
 *      保存するのは「何番を押したか」と「押した時刻」だけ。
 *      点数は両者が同じ純関数で計算する。
 *      → 点数を書き換える攻撃が、そもそも書く場所がない。
 *
 *   2. 時刻はサーバ時刻で刻む
 *      answeredAt には request.time（サーバ時刻）しか書けないよう
 *      ルールで縛る。端末の時計を巻き戻しても無意味。
 *
 *   3. 締切を過ぎた解答は書き込めない
 *      ルールで request.time < deadlineAt を要求する。
 *      「あとから答えを入れる」ができない。
 *
 *   4. 問題は部屋作成時に確定し、以後変更不可
 *      questionIds はルールで更新禁止。
 *      さらに部屋IDを種にした決定論的抽選なので、
 *      相手側で「この並びは本当にこの部屋の種から出たか」を検算できる。
 *
 *   5. 結果は両者の申告が一致したときだけ採用（相互確認）
 *      食い違ったら無効試合にしてレートを動かさない。
 *      片方が嘘をついても、相手のレートを下げられない。
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
  type Unsubscribe,
} from '../../utils/firestoreMetered';

import { auth, db } from '../../firebase';
import { resolveNickname } from '../../utils/leaderboard';
import {
  buildQuestionOrder,
  RATING_INITIAL,
} from '../core/battleCore';
import { normalizeRule } from '../core/battleRules';
import { arenaRule, nationalRoomMatches } from '../core/arenaRules';
import type {
  BattleAnswerFormat,
  BattleAttestation,
  BattlePlayer,
  BattleRoom,
  BattleRule,
} from '../core/types';
import { answerKeyOf } from '../core/types';
import {
  observeLowerBound,
  observeRoundTrip,
  serverNow,
  toMillis,
} from '../core/serverClock';
import { isTransientError, retryDelayMs, smoothRtt } from '../core/connection';
import { isStaleQueueTicket } from '../core/matchFallback';
import { noteServerError, rememberRating } from './serverHealth';
import { loadPool, poolIdsOf } from './battlePool';
import { blockedUidSet } from '../../features/safety/userSafety';

// ============================================================
// コレクション名（1箇所にまとめる）
// ============================================================

export const COL_ROOMS = 'battle_rooms';
export const COL_CODES = 'battle_codes';
export const COL_QUEUE = 'battle_queue';
export const COL_RANKING = 'battle_ranking';
export const COL_HISTORY = 'battle_history';

/**
 * 合言葉の文字集合。
 *
 * ★紛らわしい文字を外している★
 * 0/O、1/I/L は口頭やスクショで伝えるときに必ず取り違える。
 * 「入れたのに部屋が無い」という問い合わせの大半がこれなので、
 * 最初から候補に入れない。
 */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 4;

/** 合言葉の有効時間（分）。放置された部屋を掃除する目安 */
export const ROOM_STALE_MINUTES = 30;

// ============================================================
// 小さなヘルパ
// ============================================================

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    // ゲスト参加は仕様として不可（uid が無いとルールで守れない）
    throw new Error('対戦にはGoogleアカウントでのログインが必要です。');
  }
  return uid;
}

function myProfile(rating: number): BattlePlayer {
  const user = auth.currentUser;
  return {
    uid: user?.uid || '',
    nickname: resolveNickname(),
    photoURL: user?.photoURL || '',
    rating,
  };
}

function randomCode(): string {
  let out = '';
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    // bytes[i] は Uint8Array の範囲内なので必ず存在する。
    // ?? 0 は型の都合（noUncheckedIndexedAccess）で置いているだけで、
    // 実行時に効くことはない。
    out += CODE_ALPHABET[(bytes[i] ?? 0) % CODE_ALPHABET.length];
  }
  return out;
}

/** Firestore の権限エラーを利用者向けの日本語にする */
function friendlyError(error: unknown, fallback: string): Error {
  const code = (error as { code?: string })?.code || '';
  noteServerError(error);
  if (code === 'resource-exhausted') {
    return Object.assign(new Error('サーバーが混み合っています（無料枠の上限）。しばらくしてからもう一度お試しください。'), { code });
  }
  if (code === 'permission-denied') {
    return new Error('この操作は許可されていません。部屋がすでに閉じている可能性があります。');
  }
  if (code === 'unavailable' || code === 'deadline-exceeded') {
    return Object.assign(new Error('通信が不安定です。電波の良い場所でもう一度お試しください。'), { code });
  }
  // ★索引不足のときに英語のままだった問題への対処★
  //
  // 本番で利用者に
  //   「The query requires an index. You can create it here: https://…」
  // という英語のメッセージがそのまま表示された。
  // これは Firestore が failed-precondition で返すもので、
  // ・利用者には意味が分からない
  // ・管理用の URL（コンソールへのリンク）を利用者に見せてしまう
  // という二重に良くない状態だった。
  // 原因の詳細は console に残し、画面には日本語の案内だけを出す。
  if (code === 'failed-precondition') {
    console.error('[battle] Firestore の索引が不足しています', error);
    return new Error(
      '対戦の準備がまだ整っていません。少し待ってからもう一度お試しください。',
    );
  }
  if (error instanceof Error && error.message) return error;
  return Object.assign(new Error(fallback), { code });
}

// ============================================================
// レート（読み取りだけ。書き込みは battleRanking.ts）
// ============================================================

/**
 * 自分のレートを読む。無ければ初期値。
 *
 * ★部屋に rating を焼き込む理由★
 * 対戦後にレートを計算するとき、相手のレートが必要になる。
 * そのとき battle_ranking を読みに行くと、
 *   ・相手のドキュメントが読める権限が必要になる
 *   ・試合中に相手が別の試合でレートを変えると計算がズレる
 * ので、★試合開始時点の値を部屋にコピーして固定する★。
 */
export async function fetchMyRating(): Promise<number> {
  const uid = auth.currentUser?.uid;
  if (!uid) return RATING_INITIAL;
  try {
    const snap = await getDoc(doc(db, COL_RANKING, uid));
    const value = snap.exists() ? Number(snap.get('rating')) : NaN;
    const rating = Number.isFinite(value) ? value : RATING_INITIAL;
    rememberRating(uid, rating);
    return rating;
  } catch (error) {
    noteServerError(error);
    // レートが読めなくても対戦自体はできるようにする
    return RATING_INITIAL;
  }
}

// ============================================================
// 出題の抽選
// ============================================================

/**
 * 部屋IDを種にして出題を決める。
 *
 * ★同じ小問から作られた別形式を混ぜない★
 * プールには1つの小問から「語句選択」と「文字パネル」の
 * 2問が作られているものがある。そのまま抽選すると
 * 同じ問いが1試合に2回出るので、グループキーで間引く
 * （battleCore.buildQuestionOrder の groupOf）。
 *
 * ★選択式とかな入力（みんはや方式）を混ぜる★
 * ルールの kanaShare（既定 0.3 = 10問中3問）だけをかな入力にする。
 * 「どの問題がかな入力か」はプール本体を見ないと分からないので、
 * ここで形式表を作って battleCore に渡している
 * （battleCore は葉モジュールなのでプールを読めない）。
 */
export async function drawQuestionIds(
  subject: string,
  rules: BattleRule,
  seed: string,
  chapterId?: string,
): Promise<string[]> {
  const eligible = await poolIdsOf(subject, rules.formats as BattleAnswerFormat[]);
  const chapterIds = chapterId ? new Set((await loadPool(subject))
    .filter(q => q.chapterId === chapterId).map(q => q.id)) : null;
  // Filter BEFORE deterministic drawing. An unknown unit returns no questions;
  // never silently fall back to the entire subject.
  const ids = chapterIds ? eligible.filter(id => chapterIds.has(id)) : eligible;
  if (ids.length === 0) return [];

  const pool = await loadPool(subject);
  const groupById = new Map<string, string>();
  const kanaIds = new Set<string>();
  for (const q of pool) {
    groupById.set(q.id, `${q.chapterId}:${q.subQuestionId}`);
    if (q.format === 'kana') kanaIds.add(q.id);
  }

  return buildQuestionOrder(
    ids,
    rules.questionCount,
    seed,
    (id) => groupById.get(id) || id,
    { isKana: (id) => kanaIds.has(id), kanaShare: rules.kanaShare },
  );
}

/** その教科で対戦が成立するか（問題数が足りているか） */
export async function canPlaySubject(subject: string, rules: BattleRule): Promise<boolean> {
  const ids = await poolIdsOf(subject, rules.formats as BattleAnswerFormat[]);
  return ids.length >= Math.min(rules.questionCount, 3);
}

// ============================================================
// フレンド対戦（★これが主役の入口★）
// ============================================================

export interface CreatedRoom {
  roomId: string;
  joinCode: string;
}

/**
 * フレンド対戦の部屋を作る。
 *
 * ★合言葉方式にした理由★
 * フレンド一覧から相手を選んで招待を送る方式は、
 *   ・相手が通知に気づくまで待つ
 *   ・相手が別の画面にいると届かない
 * ので「今すぐ一緒にやる」用途に向かない。
 * 目の前にいる友達・通話中の友達と遊ぶには、
 * 4文字を口で伝えるのが一番速い。
 * フレンド登録済みかどうかも問わないので、
 * 「クラスの子と今すぐ1戦」ができる。
 */
/**
 * ★同じ相手との再戦・部屋での設定変更に使う「次の部屋の合言葉」★
 *
 * 前の部屋IDから決まった手順で4文字を作る。2人とも前の部屋IDを知っているので、
 * 相手は合言葉を打たずに battle_codes/{合言葉} を get するだけで次の部屋を見つけられる。
 * ★Firestore のルールは変えていない★（合言葉の作成・get は従来どおりの権限で足りる）。
 * 衝突したときのために attempt 0〜(SUCCESSOR_ATTEMPTS-1) を順に使う。
 */
export const SUCCESSOR_ATTEMPTS = 4;
export function successorCode(prevRoomId: string, attempt: number): string {
  let h = 0x811c9dc5;
  const src = `${prevRoomId}#next#${attempt}`;
  for (let i = 0; i < src.length; i += 1) { h ^= src.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  let out = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    out += CODE_ALPHABET[h % CODE_ALPHABET.length];
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0;
  }
  return out;
}

/**
 * 前の部屋の続きの部屋（同じ部屋主が作った waiting の部屋）を探す。見つからなければ null。
 * 探すのは get だけ（list 検索はしない）ので、読み取りは最大 SUCCESSOR_ATTEMPTS 件。
 */
export async function findSuccessorRoom(prevRoomId: string, hostUid: string): Promise<string | null> {
  for (let attempt = 0; attempt < SUCCESSOR_ATTEMPTS; attempt += 1) {
    const snap = await getDoc(doc(db, COL_CODES, successorCode(prevRoomId, attempt)));
    if (!snap.exists()) continue;
    if (snap.get('hostUid') !== hostUid) continue;
    const roomId = String(snap.get('roomId') || '');
    if (roomId && roomId !== prevRoomId) return roomId;
  }
  return null;
}

/** 前の部屋の続きに入る（見つかるまで intervalMs ごとに探す。signal で中止） */
export async function followSuccessorRoom(prevRoomId: string, hostUid: string, opts: { timeoutMs?: number; intervalMs?: number; signal?: AbortSignal } = {}): Promise<string | null> {
  const until = Date.now() + (opts.timeoutMs ?? 30_000);
  while (Date.now() < until) {
    opts.signal?.throwIfAborted();
    try {
      const next = await findSuccessorRoom(prevRoomId, hostUid);
      if (next) { await joinRoomById(next); return next; }
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') throw e;
    }
    await new Promise((r) => setTimeout(r, opts.intervalMs ?? 2500));
  }
  return null;
}

export async function createFriendRoom(
  subject: string,
  ruleOverride?: Partial<BattleRule>,
  chapterId?: string,
  /** 同じ相手との再戦・設定変更のときの前の部屋ID（合言葉をそこから作る） */
  successorOf?: string,
  /** フレンド対戦のモード（friendModes.ts）。リスニングは音源の長さがあるので時間は変えない */
  modeRules?: Partial<Pick<BattleRule, 'pointsSpeedMax' | 'timeLimitOverride'>>,
): Promise<CreatedRoom> {
  const uid = requireUid();
  const arena = arenaRule(normalizeRule(subject, { ...loadRuleSync(subject), ...ruleOverride }));
  const rules: BattleRule = modeRules
    ? { ...arena, ...(modeRules.pointsSpeedMax != null ? { pointsSpeedMax: modeRules.pointsSpeedMax } : {}),
        ...(modeRules.timeLimitOverride != null && subject !== 'english_listening' ? { timeLimitOverride: modeRules.timeLimitOverride } : {}) }
    : arena;
  const rating = await fetchMyRating();

  // 合言葉が既に使われていたら引き直す。
  // 31^4 = 約92万通りなので、同時に開いている部屋が数百でも衝突はまれ。
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const joinCode = successorOf && attempt < SUCCESSOR_ATTEMPTS ? successorCode(successorOf, attempt) : randomCode();
    const roomRef = doc(collection(db, COL_ROOMS));
    const codeRef = doc(db, COL_CODES, joinCode);

    const questionIds = await drawQuestionIds(subject, rules, roomRef.id, chapterId);
    if (questionIds.length === 0) {
      throw new Error('この教科は対戦できる問題がまだ足りません。');
    }

    try {
      await runTransaction(db, async (tx) => {
        const existing = await tx.get(codeRef);
        if (existing.exists()) throw new Error('CODE_TAKEN');

        const room: Record<string, unknown> = {
          id: roomRef.id,
          status: 'waiting',
          mode: 'friend',
          subject,
          joinCode,
          hostUid: uid,
          players: [uid],
          profiles: { [uid]: myProfile(rating) },
          questionIds,
          rules,
          currentIndex: 0,
          deadlineAt: null,
          answers: { [uid]: {} },
          attest: {},
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        tx.set(roomRef, room);
        tx.set(codeRef, {
          roomId: roomRef.id,
          hostUid: uid,
          subject,
          createdAt: serverTimestamp(),
        });
      });

      return { roomId: roomRef.id, joinCode };
    } catch (error) {
      if ((error as Error).message === 'CODE_TAKEN') continue;
      throw friendlyError(error, '部屋を作れませんでした。');
    }
  }

  throw new Error('部屋を作れませんでした。もう一度お試しください。');
}

/**
 * 合言葉で部屋に入る。
 *
 * ★トランザクションにする理由★
 * 3人目が同時に入ろうとしたとき、単純な update だと
 * players が3人になって試合が壊れる。
 * トランザクションの中で人数を確認してから追加する。
 */
export async function joinRoomByCode(rawCode: string): Promise<string> {
  const uid = requireUid();
  const joinCode = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (joinCode.length !== CODE_LENGTH) {
    throw new Error(`合言葉は${CODE_LENGTH}文字です。`);
  }

  const codeSnap = await withRetry(() => getDoc(doc(db, COL_CODES, joinCode)), 8_000).catch((error) => {
    throw friendlyError(error, '合言葉を確かめられませんでした。');
  });
  if (!codeSnap.exists()) {
    throw new Error('その合言葉の部屋は見つかりませんでした。');
  }
  const roomId = String(codeSnap.get('roomId') || '');
  if (!roomId) throw new Error('その合言葉の部屋は見つかりませんでした。');
  return joinRoomById(roomId);
}

/** 部屋IDで入室する（合言葉の入力なし。再戦・設定変更の追従で使う） */
export async function joinRoomById(roomId: string): Promise<string> {
  const uid = requireUid();
  const rating = await fetchMyRating();

  try {
    // ★入室は何度やり直しても同じ結果になる（入っていればそのまま通す）ので、一時的な失敗は再送する★
    await withRetry(() => runTransaction(db, async (tx) => {
      const roomRef = doc(db, COL_ROOMS, roomId);
      const snap = await tx.get(roomRef);
      if (!snap.exists()) throw new Error('ROOM_GONE');

      const players: string[] = (snap.get('players') as string[]) || [];
      const status = String(snap.get('status') || '');

      // すでに入っている（再入室）ならそのまま通す
      if (players.includes(uid)) return;

      if (status !== 'waiting') throw new Error('ROOM_STARTED');
      if (players.length >= 2) throw new Error('ROOM_FULL');

      const profiles = (snap.get('profiles') as Record<string, BattlePlayer>) || {};
      const answers = (snap.get('answers') as Record<string, object>) || {};

      tx.update(roomRef, {
        players: [...players, uid],
        profiles: { ...profiles, [uid]: myProfile(rating) },
        // ★空のマップで場所だけ作る（配列ではない）★
        //   回答は後から `answers.{uid}.q0` のパス指定で1問ずつ足していく。
        answers: { ...answers, [uid]: {} },
        updatedAt: serverTimestamp(),
      });
    }), 12_000);
  } catch (error) {
    const message = (error as Error).message;
    if (message === 'ROOM_GONE') throw new Error('その部屋はもう存在しません。');
    if (message === 'ROOM_FULL') throw new Error('その部屋はもう満員です。');
    if (message === 'ROOM_STARTED') throw new Error('その部屋はもう対戦が始まっています。');
    throw friendlyError(error, '部屋に入れませんでした。');
  }

  return roomId;
}

// ============================================================
// 全国ランダムマッチ（副次的な入口）
// ============================================================

/**
 * ランダムマッチ。
 *
 * ★仕組み★
 *   1. 自分と同じ教科で待っている人を1人探す
 *   2. 見つかったら、その人の待機票を消して部屋を作る（トランザクション）
 *   3. 見つからなければ自分の待機票を置いて待つ
 *
 * ★待機票を「消してから部屋を作る」順にする理由★
 * 逆にすると、2人が同時に相手を見つけて部屋を2つ作り、
 * 片方が誰も来ない部屋で待ち続ける。
 * 待機票の削除をトランザクションの成立条件にすれば、
 * 先に消せた側だけが部屋を作れる。
 */
/**
 * 待機列を「古い順」で取り出す。
 *
 * ★複合索引が無い／構築中でも動くようにする★
 * まず索引を使う速い形で試し、索引が無いと言われたときだけ
 * 索引の要らない形（等式1つだけ）で引き直して手元で並べ替える。
 *
 * 索引不足を表す Firestore のエラーコードは 'failed-precondition'。
 * ★それ以外のエラー（権限など）は握り潰さずに投げ直す★
 * ここで全部飲み込むと、別の原因の不具合が
 * 「なぜかマッチしない」に化けて原因が追えなくなる。
 */
async function fetchWaitingQueue(subject: string) {
  // ★条件は「教科が一致」の1つだけ★
  //
  //   以前は where('subject') + orderBy('createdAt') と書いていた。
  //   これは「等式 + 並べ替え」の組み合わせなので複合索引が必須で、
  //   索引を宣言していなかったため本番で
  //   「The query requires an index.」が出て全国対戦が動かなかった。
  //
  //   Firestore は ★条件が1つだけの検索なら索引を自動で作る★
  //   （単一フィールド索引。`==` も `array-contains` も対象）。
  //   手で用意しないといけないのは組み合わせた検索だけである。
  //   参考: https://firebase.google.com/docs/firestore/query-data/index-overview
  //
  //   そこで組み合わせをやめ、並べ替えは手元で行う形にした。
  //   これなら ★索引を一切デプロイしなくても動く★。
  //
  // ★「まず索引つきで試して、失敗したら retry」にしなかった理由★
  //   索引を作らない運用だと毎回1回目が必ず失敗するので、
  //   通信が毎回2往復になり、待ち時間とエラーログが無駄に増える。
  //   最初から索引の要らない形で投げるほうが速く、確実。
  //
  // ★手元で並べ替えても問題にならない理由★
  //   ここで扱うのは「今この教科で待っている人」だけ。
  //   同時に待つ人数はごく少数（多くて数人）なので、
  //   20件取って手元で並べても負荷にならない。
  const snap = await getDocs(
    query(collection(db, COL_QUEUE), where('subject', '==', subject), limit(20)),
  );

  // ★「古い順」に並べ直す★
  //   長く待っている人から先にマッチさせるため。
  //   ここを崩すと、後から来た人が先に対戦できてしまい、
  //   混雑時に待ち続ける人が出る。
  return [...snap.docs]
    .sort((a, b) => {
      const at = toMillis(a.get('createdAt') as Timestamp | null) || 0;
      const bt = toMillis(b.get('createdAt') as Timestamp | null) || 0;
      return at - bt; // 古い順（待っている人が先）
    })
    .slice(0, 5);
}

export async function findOrEnqueue(
  subject: string,
  sessionId = '',
  signal?: AbortSignal,
): Promise<{ roomId: string | null }> {
  const uid = requireUid();
  const rules = arenaRule(normalizeRule(subject, loadRuleSync(subject)));
  const queueSubject = `${subject}:speed2`;
  const rating = await fetchMyRating();
  signal?.throwIfAborted();

  // ===================================================================
  // ★手順：「先に自分の待機票を置く → 探す → 双方の票を1つの
  //   トランザクションで確認して消す → 部屋を作る」★
  // ===================================================================
  //
  // ■ 以前の手順（探す → いなければ置く）で起きていた不具合
  //   2人がほぼ同時に「相手をさがす」を押すと、
  //     A が探す（誰もいない）→ B が探す（誰もいない）
  //     → A が票を置く → B が票を置く
  //   となり、★両方が「拾われるのを待つ側」になって永遠に待つ★。
  //   独立検証（同時待機×5回）で再現した。
  //
  // ■ 今の手順で解決する理由
  //   先に票を置いてから探すので、上の順序でも
  //   B が探す時点で A の票が必ず見える。
  //   さらに部屋を作る側は「自分の票」と「相手の票」の★両方★を
  //   同じトランザクションで確認して消す。
  //   A と B が互いを同時に拾おうとしても、
  //   片方のトランザクションが先に票を消すので、もう片方は
  //   「票が無い」で失敗し、部屋は★ちょうど1つ★しかできない。
  //
  // ■ 索引について
  //   検索条件は「教科が一致」の1つだけ（fetchWaitingQueue）。
  //   等式1つなら Firestore が索引を自動で作るので、
  //   複合索引のデプロイは要らない。並べ替えは手元で行う。
  //
  // ■ 代償
  //   すぐ相手が見つかる場合にも、待機票の書き込みが1回発生する。
  //   （書き込み1回 ＝ 1試合あたりの書き込み約35回に対して無視できる）

  const roomRef = doc(collection(db, COL_ROOMS));
  const questionIds = await drawQuestionIds(subject, rules, roomRef.id);
  if (questionIds.length === 0) {
    throw new Error('この教科は対戦できる問題がまだ足りません。');
  }

  const ownRef = doc(db, COL_QUEUE, uid);
  signal?.throwIfAborted();
  if (auth.currentUser?.uid !== uid) throw new Error("ログイン状態が変わりました。");

  // 1. 先に自分の待機票を置く
  try {
    await setDoc(ownRef, {
      uid,
      subject: queueSubject,
      profile: { ...myProfile(rating), matchSessionId: sessionId },
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    throw friendlyError(error, '待機列に入れませんでした。');
  }

  if (signal?.aborted) { await leaveQueue(sessionId, uid); signal.throwIfAborted(); }

  // 2. 待っている人を探す（自分以外・同じ教科・古い順）
  let waitingDocs;
  try {
    waitingDocs = await fetchWaitingQueue(queueSubject);
  } catch (error) {
    // 探せなかったときは票だけ残さない（次に来た人が幽霊とマッチする）
    void leaveQueue(sessionId, uid);
    throw friendlyError(error, 'マッチングに失敗しました。');
  }
  // ブロックした相手とは組まない（App Store 1.2。端末のブロック一覧で判定）
  const blocked = blockedUidSet();
  // ★古い待機票（3分以上前）は相手にしない★
  //   画面を閉じた・電池が切れた人の票が残っていると、その人と部屋ができて試合が始まらない。
  //   相手の時刻はサーバー時刻なので、端末の時計ではなく serverNow() と比べる。
  const nowMs = serverNow();
  const candidate = waitingDocs.find((d) => d.id !== uid && !blocked.has(d.id)
    && !isStaleQueueTicket(toMillis(d.get('createdAt') as Timestamp | null), nowMs));
  if (!candidate) {
    // 誰もいない。票を置いたまま、拾われるのを待つ（watchMatched）
    return { roomId: null };
  }

  // 3. 双方の票を同じトランザクションで確認・消費し、部屋を作る
  const otherRef = doc(db, COL_QUEUE, candidate.id);
  try {
    const matched = await runTransaction(db, async (tx) => {
      const mine = await tx.get(ownRef);
      const other = await tx.get(otherRef);
      // 自分の票が無い … 相手が先に自分を拾った（相手が部屋を作る）
      // 相手の票が無い … 別の誰かが先に相手を拾った
      // 教科が違う    … 票が差し替わっていた
      if (!mine.exists() || !other.exists()) return false;
      if (signal?.aborted || auth.currentUser?.uid !== uid) return false;
      if (mine.get('profile')?.matchSessionId !== sessionId) return false;
      if (mine.get('subject') !== queueSubject || other.get('subject') !== queueSubject) return false;

      const opponentUid = other.id;
      const opponentProfile = other.get('profile') as BattlePlayer | undefined;

      tx.delete(ownRef);
      tx.delete(otherRef);
      tx.set(roomRef, {
        id: roomRef.id,
        status: 'waiting',
        mode: 'random',
        subject,
        joinCode: '',
        hostUid: uid,
        players: [uid, opponentUid],
        profiles: {
          [uid]: { ...myProfile(rating), matchSessionId: sessionId },
          [opponentUid]: opponentProfile || {
            uid: opponentUid,
            nickname: '対戦相手',
            photoURL: '',
            rating: RATING_INITIAL,
          },
        },
        questionIds,
        rules,
        currentIndex: 0,
        deadlineAt: null,
        answers: { [uid]: {}, [opponentUid]: {} },
        attest: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return true;
    });

    // 拾えなかった場合、自分の票は（相手に拾われていなければ）残っているので
    // そのまま拾われるのを待つ。相手に拾われていれば watchMatched が部屋を見つける。
    return { roomId: matched ? roomRef.id : null };
  } catch (error) {
    throw friendlyError(error, 'マッチングに失敗しました。');
  }
}

/** 待機をやめる（画面を離れるときは必ず呼ぶ） */
export async function leaveQueue(sessionId?: string, uid = auth.currentUser?.uid): Promise<void> {
  if (!uid) return;
  try {
    const ref = doc(db, COL_QUEUE, uid);
    if (sessionId) await runTransaction(db, async tx => {
      const row = await tx.get(ref);
      if (row.exists() && row.get("profile")?.matchSessionId === sessionId) tx.delete(ref);
    });
    else await deleteDoc(ref);
  } catch {
    // 消せなくても致命的ではない（相手が拾った時に消える）
  }
}

/**
 * 待機中に「誰かが自分を拾って作った部屋」を待ち受ける。
 *
 * ★players に自分が入っている部屋を購読する★
 * 相手が部屋を作る側なので、自分は部屋IDを知らない。
 * array-contains で自分が含まれる待機中の部屋を購読する。
 *
 * ===================================================================
 * ★以前この関数が原因で「全国対戦が永遠にマッチしない」状態になった★
 * ===================================================================
 *
 * 元の実装は
 *     where('players','array-contains', uid)
 *   + where('status','==','waiting')
 *   + orderBy('createdAt','desc')
 * という組み合わせだった。これは Firestore の複合索引が必須で、
 * firestore.indexes.json が空だったため索引が存在せず、
 * 購読が failed-precondition で即座に落ちていた。
 *
 * さらに悪いことに、エラー側のコールバックが空
 *     () => { /* 待機画面を壊さない *\/ }
 * だったので、★画面には何も出ないまま黙って壊れた★。
 * 「エラーを出さない」ことが「不具合を隠す」ことになっていた。
 *
 * ■ 今回の直し方（2段構え）
 *
 *   1. 索引を firestore.indexes.json に宣言した（本筋の修正）
 *
 *   2. ★それでも索引に頼らない形に変えた★
 *      理由: 索引はデプロイして構築が終わるまで数分効かない。
 *            また将来ルールやクエリを触った人が索引の追加を
 *            忘れると、また同じ「黙って壊れる」に戻る。
 *      具体的には orderBy を外し、status の絞り込みも
 *      クライアント側で行う。array-contains の1条件だけなら
 *      ★単一フィールド索引（自動作成）で動く★ので、
 *      複合索引が無くても、構築中でも機能する。
 *      待機中の自分の部屋は多くて1〜2件なので、
 *      並べ替えと絞り込みを手元でやっても負荷にならない。
 *
 *   3. エラーを握り潰すのをやめ、呼び出し側に伝えられるようにした。
 *      画面を壊さない配慮は残しつつ、原因が分かるようにする。
 */
export function watchMatched(
  onMatched: (roomId: string) => void,
  onError?: (error: unknown) => void,
  expected?: { subject: string; sessionId: string },
): Unsubscribe {
  const uid = auth.currentUser?.uid;
  if (!uid) return () => {};

  return onSnapshot(
    query(
      collection(db, COL_ROOMS),
      // ★条件は array-contains の1つだけ★
      //   これなら複合索引が要らない（上の解説を参照）。
      where('players', 'array-contains', uid),
      // 過去のフレンド部屋で上限が埋まらないよう、セッションで絞る。

    ),
    (snap) => {
      // status と作成時刻の判定は手元で行う。
      const rooms = snap.docs
        .filter((d) => expected && nationalRoomMatches(d.data(), uid, expected.subject, expected.sessionId))
        .sort((a, b) => {
          const at = toMillis(a.get('createdAt') as Timestamp | null) || 0;
          const bt = toMillis(b.get('createdAt') as Timestamp | null) || 0;
          return bt - at; // 新しい順
        });
      const first = rooms[0];
      if (first) onMatched(first.id);
    },
    (error) => {
      // 待機画面自体は壊さないが、★黙って捨てない★。
      // 以前ここが空だったため、索引不足に気付けなかった。
      console.error('[battle] 待機中の購読に失敗しました', error);
      onError?.(error);
    },
  );
}

// ============================================================
// 試合の進行
// ============================================================

/**
 * 対戦を開始する（部屋主だけが呼ぶ）。
 *
 * ★deadlineAt を1回だけ書く理由★
 * 「残り時間」を秒ごとに書き込むと、1問10秒で
 * 1試合あたり100回の書き込みになり無料枠を食い潰す。
 * 締切時刻を1回書いて、あとは各端末が自分の時計で引き算する。
 * 書き込みは1問1回（進行のときだけ）に収まる。
 */
export async function startBattle(roomId: string, firstTimeLimitSec: number): Promise<void> {
  requireUid();
  try {
    // 開始は再送してよい（2回目以降の permission-denied は「最初の送信で既に始まっている」）
    await resilientWrite(() =>
      updateDoc(doc(db, COL_ROOMS, roomId), {
        status: 'playing',
        currentIndex: 0,
        deadlineAt: deadlineFromNow(firstTimeLimitSec),
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
      { budgetMs: 15_000, acceptDeniedAfterRetry: true, attemptTimeoutMs: 6_000 },
    );
  } catch (error) {
    throw friendlyError(error, '対戦を開始できませんでした。');
  }
}

/**
 * 締切時刻を作る。
 *
 * ★サーバ時刻ではなく「推定サーバ時刻＋秒数」で作る理由★
 * serverTimestamp() は「書き込んだ瞬間のサーバ時刻」しか作れず、
 * 「サーバ時刻＋10秒」は表現できない（Cloud Functions が無いため）。
 * そこで端末側で作るしかないが、★Date.now() を直接使ってはいけない★。
 *
 * かつてここは Date.now() を使っており、
 * 「両者が同じ deadlineAt を見るので不公平は生じない」と書いていた。
 * これは誤りだった。実際には次の2つが壊れる:
 *
 *   ① ルールは「締切は request.time（サーバ時刻）より未来で、
 *      かつ60秒以内」しか許さない。
 *      部屋主の時計が1分以上ずれていると★この書き込みが必ず拒否される★。
 *      利用者に出るのは「この操作は許可されていません」だけで、
 *      対戦が始まらない理由が誰にも分からない。
 *
 *   ② 残り時間は各端末が「締切 − 自分の時計」で出している。
 *      時計が遅れている側は「残り3秒」と見えている時点で
 *      サーバ上ではもう締切を過ぎており、
 *      ★答えたのに解答が消える★。
 *
 * serverNow() は既存の通信から推定したサーバ時刻を返すので、
 * 端末の時計がずれていても正しい締切が書ける。
 * 受付の可否はルール側で request.time と比べて決まるため、
 * 端末時計を操作して締切を伸ばすことはできない（安全性は変わらない）。
 */
function deadlineFromNow(seconds: number): Date {
  // 通信の往復ぶん（両者への配信遅延）を少しだけ足す。
  // これが無いと、電波の悪い側が毎回わずかに不利になる。
  const NETWORK_GRACE_MS = 700;
  return new Date(serverNow() + seconds * 1000 + NETWORK_GRACE_MS);
}

/**
 * 書き込みの往復からサーバ時刻を観測する。
 *
 * ★専用の通信を足さない★
 * 時刻合わせのために読み書きを増やすと無料枠を食う。
 * 対戦の書き込みはどれも updatedAt: serverTimestamp() を含んでいるので、
 * 「書いた直後にその1件を読む」のではなく、
 * ★送信前後の端末時刻だけを測っておき、
 *   購読（onSnapshot）で返ってくるサーバ時刻と突き合わせる★。
 * これで追加の通信は0のまま観測できる。
 *
 * ここでは送信の前後を測る部分だけを受け持つ。
 */
/**
 * ★書き込みの待ち時間の上限★
 * Firestore の書き込みは圏外だと「送信待ち」のまま Promise が返ってこない。
 * 以前は「はじめる」を押しても何も起きず、ずっと待っているように見えた
 * （フレンド対戦でカウントダウンが始まらない不具合の原因の1つ）。
 * 上限を過ぎたら 'deadline-exceeded' として投げ、画面に再試行を出す。
 */
export const WRITE_TIMEOUT_MS = 12_000;
function withWriteTimeout<T>(promise: Promise<T>, ms = WRITE_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'deadline-exceeded' })), ms);
    promise.then((v) => { clearTimeout(timer); resolve(v); }, (e) => { clearTimeout(timer); reject(e); });
  });
}

async function timedWrite(run: () => Promise<void>): Promise<void> {
  const sentAt = Date.now();
  await withWriteTimeout(run());
  // 応答が返った時刻を覚えておく。サーバが刻んだ時刻そのものは
  // 購読側（watchRoom）で受け取るので、そこで突き合わせる。
  const ackAt = Date.now();
  lastWrite = { sentAt, ackAt };
  reportRtt(ackAt - sentAt);
}

/**
 * ★通信が一瞬切れても諦めない書き込み★
 *
 * 市販の対戦ゲームは、電波が1〜2秒途切れても操作が消えない。
 * 以前は1回失敗するとそのまま「送信できませんでした」になり、
 * 開始・解答・進行・結果の申告が失われて試合が止まることがあった。
 *
 *   ・やり直して通る見込みがある失敗（unavailable / deadline-exceeded など）だけ再送する
 *   ・0.4秒→0.8秒→1.6秒…と間隔を伸ばす（揺らぎつき）
 *   ・全体の締切（budgetMs）を過ぎたら諦める（締切後の解答はどうせ拒否される）
 *   ・再送のあとの permission-denied は「最初の送信が実は届いていた」ことが多い。
 *     acceptDeniedAfterRetry のときは成功として扱う（解答の二重送信はルールが止める）
 */
async function resilientWrite(
  run: () => Promise<void>,
  opts: { budgetMs?: number; acceptDeniedAfterRetry?: boolean; attemptTimeoutMs?: number } = {},
): Promise<void> {
  const started = Date.now();
  const budget = opts.budgetMs ?? 20_000;
  for (let attempt = 0; ; attempt += 1) {
    try {
      const sentAt = Date.now();
      await withWriteTimeout(run(), Math.max(1_000, Math.min(opts.attemptTimeoutMs ?? WRITE_TIMEOUT_MS, budget - (sentAt - started))));
      const ackAt = Date.now();
      lastWrite = { sentAt, ackAt };
      reportRtt(ackAt - sentAt);
      return;
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (attempt > 0 && code === 'permission-denied' && opts.acceptDeniedAfterRetry) return;
      const wait = retryDelayMs(attempt);
      if (!isTransientError(error) || Date.now() - started + wait >= budget) throw error;
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

/** 読み取り・やり直しても同じ結果になる処理を、一時的な失敗のときだけ再試行する */
async function withRetry<T>(run: () => Promise<T>, budgetMs: number): Promise<T> {
  const started = Date.now();
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await withWriteTimeout(run(), Math.max(1_500, Math.min(WRITE_TIMEOUT_MS, budgetMs - (Date.now() - started))));
    } catch (error) {
      const wait = retryDelayMs(attempt);
      if (!isTransientError(error) || Date.now() - started + wait >= budgetMs) throw error;
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

// ---- 往復時間（アンテナ表示用）----
let rttMs: number | null = null;
const rttListeners = new Set<(ms: number) => void>();
function reportRtt(sample: number) {
  rttMs = smoothRtt(rttMs, sample);
  for (const fn of rttListeners) { try { fn(rttMs); } catch { /* isolate */ } }
}
/** 直近の往復時間（ms、なめらか済み）。まだ測れていなければ null */
export function currentRttMs(): number | null { return rttMs; }
export function subscribeRtt(fn: (ms: number) => void): () => void {
  rttListeners.add(fn);
  return () => { rttListeners.delete(fn); };
}

/**
 * 直近の書き込みの送信・応答時刻。
 * watchRoom がサーバ時刻を受け取ったときに突き合わせて使う。
 */
let lastWrite: { sentAt: number; ackAt: number } | null = null;

/**
 * 解答を記録する。
 *
 * ★点数を送らない★
 * 送るのは「何番を押したか（choice）」「どの順に押したか（panel）」だけ。
 * 正解かどうかも送らない。両者が同じ関数で判定する。
 */
export async function submitAnswer(
  roomId: string,
  index: number,
  payload: { choice: number; panel: number[] },
  answered: boolean,
  opts?: { budgetMs?: number },
): Promise<void> {
  const uid = requireUid();

  // 同じ問題に2回答えるのを防ぐ（連打・再描画対策）。
  // ★これは通信を無駄にしないための予防で、防御の本体ではない★
  //   本体は Firestore ルール側（すでに q{index} があれば書き込み拒否）。
  //   ここだけに頼ると、開発者ツールから直接呼ばれた時に防げない。
  if (answered) return;

  try {
    // ★1問ぶんを「1フィールド」として書く★
    //
    // パス指定（`answers.{uid}.q{index}`）で書くと、
    // ・同じマップ内の他の問題（q0, q1 …）はサーバ側で保持される
    //   → 相手や自分の他の回答を消さずに済む
    // ・answeredAt が配列の中に入らない
    //   → serverTimestamp() が使える（配列の中では使えない）
    //
    // ここを配列（`answers.{uid}` に配列を丸ごと入れる）でやっていたときは、
    //   serverTimestamp() is not currently supported inside arrays
    // で必ず例外になり、★1問も回答できなかった★。
    // ★解答は締切まで再送する★（一瞬の圏外で解答が消えないように）。
    //   締切を過ぎたらルールが拒否するので、それ以上は送らない。
    //   再送後の permission-denied は「最初の送信が届いていた」（二重解答の拒否）とみなす。
    await resilientWrite(() =>
      updateDoc(doc(db, COL_ROOMS, roomId), {
        [`answers.${uid}.${answerKeyOf(index)}`]: {
          index,
          choice: payload.choice,
          panel: payload.panel,
          // ★時刻はサーバに刻ませる★（端末時計を信用しない）
          //   ルール側で `== request.time` を強制しているので、
          //   ここを固定値に書き換えても書き込みが通らない。
          answeredAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      }),
      { budgetMs: Math.max(1_500, opts?.budgetMs ?? 8_000), acceptDeniedAfterRetry: true, attemptTimeoutMs: 4_000 },
    );
  } catch (error) {
    throw friendlyError(error, '解答を送信できませんでした。');
  }
}

/**
 * 次の問題に進める。
 *
 * ★両者が呼んでも壊れない形にする★
 * 「部屋主だけが進める」設計にすると、部屋主の回線が切れた瞬間に
 * 試合が永久に止まる。そこで
 *   ・進める条件（次の番号が今より大きい）をルールで縛り
 *   ・両者が呼べるようにする
 * 二人が同時に呼んでも、同じ値を書くだけなので結果は同じになる。
 */
export async function advanceQuestion(
  roomId: string,
  nextIndex: number,
  nextTimeLimitSec: number,
): Promise<void> {
  requireUid();
  try {
    await resilientWrite(() =>
      updateDoc(doc(db, COL_ROOMS, roomId), {
        currentIndex: nextIndex,
        deadlineAt: deadlineFromNow(nextTimeLimitSec),
        updatedAt: serverTimestamp(),
      }),
      { budgetMs: 10_000, acceptDeniedAfterRetry: true, attemptTimeoutMs: 5_000 },
    );
  } catch (error) {
    // 相手が先に進めていた場合の競合は無視してよい（同じ状態になる）
    if ((error as { code?: string }).code !== 'permission-denied') {
      throw friendlyError(error, '次の問題に進めませんでした。');
    }
  }
}

/**
 * 自分が計算した結果を申告する（相互確認）。
 *
 * ★両者の申告が一致したときだけレートを動かす★
 * 片方が「自分の勝ち」と嘘をついても、相手の申告と食い違うので
 * 無効試合になる。相手のレートを下げることはできない。
 */
export async function attestResult(
  roomId: string,
  attestation: BattleAttestation,
): Promise<void> {
  const uid = requireUid();
  try {
    await resilientWrite(() =>
      updateDoc(doc(db, COL_ROOMS, roomId), {
        [`attest.${uid}`]: {
          myScore: attestation.myScore,
          opponentScore: attestation.opponentScore,
          outcome: attestation.outcome,
          at: serverTimestamp(),
        },
        status: 'finished',
        updatedAt: serverTimestamp(),
      }),
      { budgetMs: 30_000, acceptDeniedAfterRetry: true },
    );
  } catch (error) {
    throw friendlyError(error, '結果を送信できませんでした。');
  }
}

/**
 * 部屋を購読する（★1試合＝1ドキュメント＝購読1本★）
 *
 * @param onConnection 通信の状態が分かったときに呼ばれる。
 *   ★これを渡す理由★
 *   Firestore は圏外でも端末内の控えを返して購読を続けるので、
 *   画面だけ見ていると通信が切れたことに気付けない。
 *   気付けないまま解答すると、書き込みは端末に溜まり、
 *   通信が戻ったときには締切を過ぎていてルールに拒否される
 *   （＝答えたのに消える）。
 *   そこでスナップショットが端末内の控えかどうか（fromCache）を
 *   そのまま上に伝え、画面で「通信が切れています」と出せるようにする。
 */
export function watchRoom(
  roomId: string,
  onChange: (room: BattleRoom | null) => void,
  onError?: (error: Error) => void,
  onConnection?: (state: 'online' | 'offline') => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, COL_ROOMS, roomId),
    { includeMetadataChanges: true },
    (snap) => {
      // ★通信の状態を先に伝える★
      //
      // fromCache は「この内容は端末内の控えで、サーバとは同期していない」印。
      // 圏外・機内モード・通信の一時停止で真になる。
      // hasPendingWrites は「自分の書き込みがまだサーバに届いていない」印で、
      // これ自体は通常の書き込み直後にも立つので、切断の判断には使わない。
      //
      // ★metadata を先に取り出しておく理由★
      // exists() は型を絞り込む述語なので、否定側（存在しない場合）では
      // 型が never になり snap.metadata を参照できない。
      // 判定より前に控えておく。
      const fromCache = snap.metadata.fromCache;
      const hasPendingWrites = snap.metadata.hasPendingWrites;
      onConnection?.(fromCache ? 'offline' : 'online');

      if (!snap.exists()) {
        // ★端末内の控えが空なだけの可能性がある★
        // 圏外で購読を始めた直後は控えが無いので「無い」と返ってくる。
        // これを「部屋が消えた」と扱うと、電波が悪いだけで
        // 対戦から追い出されてしまう。控えの場合は判断を保留する。
        if (fromCache) return;
        onChange(null);
        return;
      }
      const data = snap.data() as { updatedAt?: unknown };

      // ★ここでサーバ時刻を観測する（追加の通信は0）★
      //
      // 部屋への書き込みはすべて updatedAt: serverTimestamp() を含んでいるので、
      // 届いたスナップショットにはサーバが刻んだ時刻が乗っている。
      // これと端末時刻を突き合わせれば、時計のずれが分かる。
      //
      // ただし ★保留状態（fromCache / hasPendingWrites）のスナップショットは使えない★。
      // 自分の書き込みが反映される前の段階では updatedAt がまだ
      // 端末側の推定値（null や直前の値）なので、これを採用すると
      // 「自分の時計を自分で確認する」ことになり、ずれが永久に消えない。
      const settled = !hasPendingWrites && !fromCache;
      const serverMs = settled ? toMillis(data.updatedAt) : null;

      if (serverMs != null) {
        const pending = lastWrite;
        if (pending && serverMs >= pending.sentAt - 1) {
          // 自分の書き込みが返ってきた場合。送信と応答の間に
          // サーバが刻んだと分かるので、往復から誤差を絞れる（本命）。
          observeRoundTrip(serverMs, pending.sentAt, pending.ackAt);
          lastWrite = null;
        } else {
          // 相手の書き込みが届いた場合。いつ送られたかは分からないので
          // 「サーバ時刻はこれ以上」という下限としてだけ使う。
          // 数分単位の大きなずれはこれで最初の1通で見つかる。
          observeLowerBound(serverMs, Date.now());
        }
      }

      onChange({ id: snap.id, ...(snap.data() as object) } as BattleRoom);
    },
    (error) => onError?.(friendlyError(error, '対戦の通信が切れました。')),
  );
}

/**
 * 部屋を離脱する（相手には不戦勝として見える）。
 *
 * ★待機中の退出は部屋そのものを閉じる（status: 'aborted'）★
 *
 * 以前は left.{自分} を書くだけだった。すると待機中（waiting）に
 * 部屋主が「部屋をでる」を押しても部屋は waiting のまま残り、
 * 合言葉を知っている人が★もう誰もいない部屋★に入れてしまった
 * （独立検証で再現。入った側は「相手を待っています…」のまま止まる）。
 * 待機中なら相手はまだ試合を始めていないので、閉じても失うものが無い。
 *
 * ★トランザクションにした理由★
 * 「部屋をでる」を押した瞬間に相手が「はじめる」を押していると、
 * 読んだときは waiting でも書くときには playing になっている。
 * その場合に aborted を書くと、始まった試合を消してしまう。
 * 読み直してから書くことで、始まっていたら left だけを残す
 * （＝相手の不戦勝になる）。
 *
 * 進行中（playing）の退出は従来どおり left だけを書く。
 * 勝敗は残った側が left を見て決める（useBattleRoom の explicitForfeit）。
 */
export async function abortRoom(roomId: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  try {
    await runTransaction(db, async (tx) => {
      const ref = doc(db, COL_ROOMS, roomId);
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const room = snap.data() as BattleRoom;
      // 参加者でない／もう退出済み／決着済み・中断済み なら何もしない
      if (!room.players.includes(uid)) return;
      if (room.left?.[uid]) return;
      if (room.status !== 'waiting' && room.status !== 'playing') return;

      tx.update(ref, {
        ...(room.status === 'waiting' ? { status: 'aborted' } : {}),
        [`left.${uid}`]: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  } catch {
    // 離脱の記録に失敗しても、相手側は無応答から不戦勝を判定できる
  }
}

// ============================================================
// ルール（Firestore で上書きできるようにする）
// ============================================================

/**
 * ルールの上書き値を覚えておく場所。
 *
 * ★同期版を用意する理由★
 * 部屋を作る処理の中でルールが必要になるが、
 * そこで毎回 Firestore を読むと待ち時間が増える。
 * 起動時に1回だけ読んで、以後はここから同期的に取る。
 */
const ruleCache = new Map<string, Partial<BattleRule>>();
let ruleLoaded = false;

function loadRuleSync(subject: string): Partial<BattleRule> {
  return ruleCache.get(subject) || {};
}

/**
 * ルールの上書きを読み込む（起動時に1回だけ）。
 *
 * ★なぜ Firestore からルールを読むのか★
 * 「1試合の問題数」「配点」は運用しながら調整したい値である。
 * コードに埋めるとアプリの更新が必要になり、
 * 更新前後の端末で違うルールの試合が起きてしまう。
 * Firestore に置けば、全員が同じ値を即座に共有できる。
 *
 * 読めなかった場合はコード側の既定値で動く（対戦が止まらないこと優先）。
 */
export async function loadBattleRuleOverrides(): Promise<void> {
  if (ruleLoaded) return;
  ruleLoaded = true;
  try {
    const snap = await getDocs(collection(db, 'battle_rules'));
    for (const d of snap.docs) {
      ruleCache.set(d.id, d.data() as Partial<BattleRule>);
    }
  } catch {
    // 既定値のまま動かす
  }
}

/** 教科の実効ルール（Firestore の上書きを反映した最終形） */
export function effectiveRule(subject: string): BattleRule {
  return normalizeRule(subject, loadRuleSync(subject));
}

// ============================================================
// 履歴
// ============================================================

export interface BattleHistoryItem {
  roomId: string;
  subject: string;
  outcome: string;
  myScore: number;
  opponentScore: number;
  opponentNickname: string;
  ratingBefore: number;
  ratingAfter: number;
  playedAt?: Timestamp | null;
}

/** 自分の履歴に1件書く（自分の下にしか書けない） */
export async function saveHistory(item: BattleHistoryItem): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  try {
    await setDoc(
      doc(db, COL_HISTORY, uid, 'items', item.roomId),
      { ...item, uid, playedAt: serverTimestamp() },
      { merge: true },
    );
  } catch {
    // 履歴は補助情報なので、失敗しても対戦結果には影響させない
  }
}

/** 自分の履歴を新しい順に読む */
export async function fetchHistory(max = 20): Promise<BattleHistoryItem[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  try {
    const snap = await getDocs(
      query(
        collection(db, COL_HISTORY, uid, 'items'),
        orderBy('playedAt', 'desc'),
        limit(max),
      ),
    );
    return snap.docs.map((d) => ({ roomId: d.id, ...(d.data() as object) } as BattleHistoryItem));
  } catch {
    return [];
  }
}
