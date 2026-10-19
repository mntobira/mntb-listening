/**
 * 対戦の Firestore 層で共有する土台（コレクション名・ログイン確認・エラー文言・レート読み取り・出題の抽選）。
 * 2026-10-15 のリファクタリングで battle.ts（1,420行）から機能ごとに切り出した。中身は元のまま。
 * 依存の向き: battleShared ← battleTransport / battleRuleOverrides ← battleFriendRoom / battleMatchmaking ← battleRoomActions
 * 呼び出し側は従来どおり './battle'（再公開）から import してよい。
 */
import { auth, db } from '../../firebase';
import { doc, getDoc } from '../../utils/firestoreMetered';
import { resolveNickname } from '../../utils/leaderboard';
import { buildQuestionOrder, RATING_INITIAL } from '../core/battleCore';
import type { BattleAnswerFormat, BattlePlayer, BattleRule } from '../core/types';
import { questionInScope } from '../core/vocabRanges';
import { loadPool, poolIdsOf } from './battlePool';
import { noteServerError, rememberRating } from './serverHealth';

// ============================================================
// コレクション名（1箇所にまとめる）
// ============================================================

export const COL_ROOMS = 'battle_rooms';
export const COL_CODES = 'battle_codes';
export const COL_QUEUE = 'battle_queue';
export const COL_RANKING = 'battle_ranking';
export const COL_HISTORY = 'battle_history';

/** 合言葉の有効時間（分）。放置された部屋を掃除する目安 */
export const ROOM_STALE_MINUTES = 30;

// ============================================================
// 小さなヘルパ
// ============================================================

export function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    // ゲスト参加は仕様として不可（uid が無いとルールで守れない）
    throw new Error('対戦にはGoogleアカウントでのログインが必要です。');
  }
  return uid;
}

export function myProfile(rating: number): BattlePlayer {
  const user = auth.currentUser;
  return {
    uid: user?.uid || '',
    nickname: resolveNickname(),
    photoURL: user?.photoURL || '',
    rating,
  };
}

/** Firestore の権限エラーを利用者向けの日本語にする */
export function friendlyError(error: unknown, fallback: string): Error {
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
    .filter(q => questionInScope(q, chapterId)).map(q => q.id)) : null;
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
