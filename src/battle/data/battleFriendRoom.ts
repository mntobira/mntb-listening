/**
 * フレンド対戦（合言葉の部屋）の作成・入室・再戦用の次の部屋・合言葉の返却。
 * 2026-10-15 のリファクタリングで battle.ts（1,420行）から機能ごとに切り出した。中身は元のまま。
 * 依存の向き: battleShared ← battleTransport / battleRuleOverrides ← battleFriendRoom / battleMatchmaking ← battleRoomActions
 * 呼び出し側は従来どおり './battle'（再公開）から import してよい。
 */
import { auth, db } from '../../firebase';
import { collection, deleteDoc, doc, getDoc, runTransaction, serverTimestamp } from '../../utils/firestoreMetered';
import { arenaRule } from '../core/arenaRules';
import { normalizeRule } from '../core/battleRules';
import type { BattlePlayer, BattleRule } from '../core/types';
import { COL_CODES, COL_ROOMS, drawQuestionIds, fetchMyRating, friendlyError, myProfile, requireUid } from './battleShared';
import { loadRuleSync } from './battleRuleOverrides';
import { withRetry } from './battleTransport';

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

      issuedCodes.set(roomRef.id, joinCode);
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
  requireUid();
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
  // ★フレンド対戦はフレンドどうしだけ（2026-10-03）★
  //   判定の本体はルール（相互フレンド、またはクラン交流戦の相手クラン）。
  //   クライアントで先に断ると交流戦に入れなくなるので、ここでは断らず、ルールの拒否を分かりやすい文言にする。
  return joinRoomById(roomId);
}

/** フレンドでない相手の部屋に入ろうとしたときの案内（画面でも同じ文言を使う） */
export const NOT_FRIEND_MESSAGE = 'フレンド対戦は、フレンドどうしだけで遊べます。先に「設定 → フレンド」で相手とフレンドになってください。';


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
    // ルールの拒否（permission-denied）＝フレンドでない／部屋が閉じた。フレンドでない可能性を先に伝える
    if ((error as { code?: string }).code === 'permission-denied') throw new Error(`${NOT_FRIEND_MESSAGE}（部屋が閉じている場合もあります）`);
    throw friendlyError(error, '部屋に入れませんでした。');
  }

  return roomId;
}

/**
 * ★部屋主が部屋を離れたら合言葉を返す★
 *   合言葉は 31^4 ≒ 92万通りしかなく、作るたびに1つ使う。
 *   以前は一度も消していなかったので、利用者が増えるほど
 *   「合言葉が使われていて引き直し」が増え、最後は部屋が作れなくなる。
 *   また消えた部屋を指す合言葉が残ると「入れない部屋」が見つかってしまう。
 *   消せるのは部屋主だけ（ルール）。失敗しても試合には影響しない。
 */
export async function releaseJoinCode(roomId: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  const code = issuedCodes.get(roomId);
  if (!uid || !code) return;
  issuedCodes.delete(roomId);
  try { await deleteDoc(doc(db, COL_CODES, code)); } catch { /* 部屋主でない・既に消えている */ }
}

/** この端末で作った部屋の合言葉（部屋ID → 合言葉）。部屋を離れたときに返すために覚えておく */
const issuedCodes = new Map<string, string>();
/** 試合が終わった・部屋が閉じたときに呼ぶ（部屋主でなければ何もしない） */
export function releaseRoomCode(roomId: string): void { void releaseJoinCode(roomId); }
