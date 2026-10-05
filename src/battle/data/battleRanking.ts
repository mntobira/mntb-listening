import { leagueOf, leagueProgress } from '../core/leagues';
/**
 * ===================================================================
 * 対戦モード: レート（Elo）と対戦ランキング
 * ===================================================================
 *
 * ■ 既存のランキングとは完全に別のコレクションにしている
 * 既存の leaderboard_* は「学習で稼いだポイント」の集計であり、
 * 集計ロジック・インデックス・ルールが確立している。
 * ★対戦の勝敗をそこに混ぜると既存ランキングの意味が壊れる★
 * （コツコツ学習した人と、対戦で稼いだ人が同じ表に並ぶ）。
 * そこで battle_ranking を新設し、既存には一切触らない。
 *
 * -------------------------------------------------------------------
 * ■ なぜ Elo なのか（勝ち数ランキングにしない理由）
 * -------------------------------------------------------------------
 * 勝ち数・勝率で並べると、次の2つが必ず起きる。
 *   ・試合数が多い人が上に来るだけになる（時間のある人が強い）
 *   ・弱い相手を選んで戦うのが最適戦略になる（狩り）
 * Elo は「自分より強い相手に勝つと大きく上がる／
 * 弱い相手に勝ってもほとんど上がらない」ので、
 * ★強い相手に挑むのが得な設計★ になる。
 *
 * -------------------------------------------------------------------
 * ■ 不正への構え
 * -------------------------------------------------------------------
 * Cloud Functions が使えないので、レートの書き込みは
 * 各自が自分のドキュメントに行う。
 * 「自分で好きな値を書けるのでは？」という懸念に対しては
 *
 *   1. ルールで ★1回の変化量を上限内に制限★ する（|差| <= 60）
 *      → 一発で 9999 にはできない。
 *   2. ルールで ★その部屋が実在することを get() で確かめる★
 *      （firestore.rules の battleRoomProof）
 *      次を全部満たさないと書けない。
 *        ・lastRoomId の部屋が実在する
 *        ・自分がその部屋の参加者である
 *        ・2人部屋である（1人部屋の自作自演を防ぐ）
 *        ・status == 'finished'（決着している）
 *        ・自分の申告（attest）が入っている
 *      → 架空の試合・他人の試合・未決着の試合では書けない。
 *   3. 同じ部屋IDで2回書けない（lastRoomId を検査）
 *      → 1試合で何度も上げられない。
 *   4. 勝敗数の増加が ★ちょうど1★
 *      → 勝敗を増やさずにレートだけ盛ることができない。
 *
 * これで「大量の実際の対戦をこなす」以外の方法では上がらなくなる。
 * 完全な防止は Cloud Functions が必要だが、
 * ★手間をかけても正攻法より速くならない★ 水準には到達している。
 *
 * -------------------------------------------------------------------
 * ■ ★このコメントは一度「嘘」だった（記録として残す）★
 * -------------------------------------------------------------------
 * 以前ここには
 *     「2. ルールで試合の相互確認が済んだ部屋IDを要求する
 *       → 架空の試合では書けない」
 * と書かれていたが、★ルール側にその検査は実装されていなかった★。
 * 実際に見ていたのは「lastRoomId が前回と違う」だけだったので、
 *   fake_a → fake_b → fake_a → …
 * と架空のIDを交互に書くだけで、1試合もせずに
 * 上限（4000）まで到達できた。
 * 変化量の上限（60）は「1回あたり」しか縛らないので、
 * ★回数を止めていなければ意味が無い★。
 *
 * コメントは実行されないので、
 * 「書いてあること」ではなく「テストが赤くなること」で確かめる。
 * tests/battle.exploit.test.ts の【手口8】がこの手口を再現している。
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type Timestamp,
} from '../../utils/firestoreMetered';

import { auth, db } from '../../firebase';
import { resolveNickname } from '../../utils/leaderboard';
import { nextRating, RATING_INITIAL } from '../core/battleCore';
import type { BattleOutcome } from '../core/types';
import { COL_RANKING } from './battle';

/** レート1回あたりの変化量の上限（ルール側と必ず同じ値にすること） */
export const RATING_MAX_DELTA = 60;

export interface BattleRankingRow {
  uid: string;
  nickname: string;
  photoURL: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  /** 直前に反映した部屋ID（同じ試合の二重反映を防ぐ） */
  lastRoomId: string;
  updatedAt?: Timestamp | null;
}

export interface RatingChange {
  before: number;
  after: number;
}

/**
 * レートを動かしてよい相手か（AI・ボット相手は練習扱いで常に動かさない）。
 * 相手 uid が空のとき（古い呼び出し）は判定できないので true。
 */
export function isRatedOpponent(opponentUid: string | null | undefined): boolean {
  const uid = String(opponentUid || '');
  return !(uid.startsWith('ai:') || uid.startsWith('bot'));
}

/**
 * 対戦結果をレートに反映する。
 *
 * ★トランザクションにする理由★
 * 「読んで、計算して、書く」の間に別の試合が終わると、
 * 古い値を元にした計算で上書きしてしまう
 * （2試合連続で勝ったのに1試合ぶんしか上がらない）。
 *
 * @param roomId       試合の部屋ID（二重反映の判定に使う）
 * @param opponentRating 試合開始時点の相手のレート（部屋に焼き込んだ値）
 * @param outcome      自分から見た結果
 * @param forfeit      不戦勝／不戦敗か（変化量を半分にする）
 */
export async function applyRatingResult(
  roomId: string,
  opponentRating: number,
  outcome: BattleOutcome,
  forfeit = false,
  opponentUid = '',
): Promise<RatingChange | null> {
  const user = auth.currentUser;
  if (!user) return null;
  // ★AI との試合はレートを動かさない（2026-10-05 ご指示）★
  if (!isRatedOpponent(opponentUid) || roomId.startsWith('ai:')) return null;

  const ref = doc(db, COL_RANKING, user.uid);
  const nickname = resolveNickname();
  const photoURL = user.photoURL || '';

  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const before = snap.exists() ? Number(snap.get('rating')) : RATING_INITIAL;
      const current = Number.isFinite(before) ? before : RATING_INITIAL;

      // 同じ試合を二重に反映しない（再読み込み・戻る操作の対策）
      if (snap.exists() && String(snap.get('lastRoomId') || '') === roomId) {
        return { before: current, after: current };
      }

      const after = nextRating(current, opponentRating, outcome, forfeit);

      const wins = Number(snap.get('wins') || 0) + (outcome === 'win' ? 1 : 0);
      const losses = Number(snap.get('losses') || 0) + (outcome === 'lose' ? 1 : 0);
      const draws = Number(snap.get('draws') || 0) + (outcome === 'draw' ? 1 : 0);

      tx.set(
        ref,
        {
          uid: user.uid,
          nickname,
          photoURL,
          rating: after,
          wins,
          losses,
          draws,
          lastRoomId: roomId,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      return { before: current, after };
    });
  } catch {
    // レートが書けなくても対戦結果の表示は成立させる
    return null;
  }
}

/**
 * 対戦ランキングに自分を登録する（0戦でも載せる）。
 *
 * ★参加登録を分けている理由★
 * 「1戦もしていないと自分の名前が出ない」と、
 * ランキングが自分に関係ない表に見えてしまう。
 * 既存の leaderboard も同じ理由で0ptでも掲載している。
 */
export async function ensureBattleRankingEntry(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  const ref = doc(db, COL_RANKING, user.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) return;
    await runTransaction(db, async (tx) => {
      const again = await tx.get(ref);
      if (again.exists()) return;
      tx.set(ref, {
        uid: user.uid,
        nickname: resolveNickname(),
        photoURL: user.photoURL || '',
        rating: RATING_INITIAL,
        wins: 0,
        losses: 0,
        draws: 0,
        lastRoomId: '',
        updatedAt: serverTimestamp(),
      });
    });
  } catch {
    // 登録に失敗しても対戦自体はできる
  }
}

/** 自分の戦績 */
export async function fetchMyRankingRow(): Promise<BattleRankingRow | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, COL_RANKING, uid));
    if (!snap.exists()) return null;
    return { uid, ...(snap.data() as object) } as BattleRankingRow;
  } catch {
    return null;
  }
}

/** 対戦ランキング（レート上位） */
export async function fetchBattleRanking(max = 50, range?: { min: number; max?: number }): Promise<BattleRankingRow[]> {
  try {
    const snap = await getDocs(
      query(collection(db, COL_RANKING), orderBy('rating', 'desc'), ...(range ? [where('rating', '>=', range.min), ...(range.max == null ? [] : [where('rating', '<', range.max)])] : []), limit(max)),
    );
    return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as object) } as BattleRankingRow));
  } catch (error) {
    throw error;
  }
}

/**
 * フレンドの中での対戦ランキング。
 *
 * ★uid の in 検索は10件までなので分割する★
 * Firestore の制約。フレンドが多い人でも動くように、
 * 10人ずつに分けて問い合わせてから結合する。
 */
export async function fetchFriendBattleRanking(
  friendUids: readonly string[],
): Promise<BattleRankingRow[]> {
  const uid = auth.currentUser?.uid;
  const targets = [...new Set([...(uid ? [uid] : []), ...friendUids])];
  if (targets.length === 0) return [];

  const chunks: string[][] = [];
  for (let i = 0; i < targets.length; i += 10) chunks.push(targets.slice(i, i + 10));

  const rows: BattleRankingRow[] = [];
  for (const chunk of chunks) {
    try {
      const snap = await getDocs(
        query(collection(db, COL_RANKING), where('uid', 'in', chunk)),
      );
      for (const d of snap.docs) {
        rows.push({ uid: d.id, ...(d.data() as object) } as BattleRankingRow);
      }
    } catch {
      // 一部が読めなくても、読めた分だけ表示する
    }
  }

  return rows.sort((a, b) => (b.rating || 0) - (a.rating || 0));
}

/**
 * レートから称号を出す。
 *
 * ★数字だけを見せない理由★
 * 1500 という数字だけでは、自分が強いのか弱いのか分からない。
 * 段位があれば「次は◯◯」という目標になり、
 * 負けて下がったときの落差も数字より受け止めやすい。
 */
export function ratingTitle(rating: number): { label: string; color: string } {
  const league = leagueOf(rating);
  return { label: league.label, color: league.color };
}
export function ratingProgress(rating: number): { next: string; remain: number; ratio: number } {
  const p = leagueProgress(rating);
  return { next: p.next?.label ?? 'マナトビ', remain: p.remain, ratio: p.ratio };
}
