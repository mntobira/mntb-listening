/** growth.ts から分割（growthLevel）。外部からは従来どおり growth.ts 経由で import できる。 */
import type { BattleOutcome, BattlePlayerScore } from './types';

// ============================================================
// 経験値（XP）
// ============================================================

/** 参加しただけで入る経験値（負けても0にしない） */
export const XP_PARTICIPATION = 20;
/** 正解1問あたり */
export const XP_PER_CORRECT = 10;
/** 勝利ボーナス */
export const XP_WIN = 50;
/** 引き分けボーナス */
export const XP_DRAW = 25;
/** 3連続正解以上を1回でも作った */
export const XP_STREAK_BONUS = 15;
/** 全問正解 */
export const XP_PERFECT_BONUS = 30;
/** Reward budget for the local progression system. */
export const XP_PER_MATCH_MAX = 400;
/** Reward budget for the local progression system. */
export const XP_PER_WRITE_MAX = 600;
/** Reward budget for the local progression system. */
export const COINS_PER_WRITE_MAX = 200;

/** 1試合ぶんの経験値の内訳 */
export interface XpBreakdown {
  participation: number;
  correct: number;
  outcome: number;
  streak: number;
  perfect: number;
  total: number;
}

/**
 * 1試合ぶんの経験値を計算する。
 *
 * @param score   自分の採点結果（battleCore.scoreBattlePlayer の出力）
 * @param outcome 自分から見た勝敗
 * @param forfeit 不戦勝／不戦敗（勝利ボーナスは半分にする。
 *                相手が来なかった試合で満額入ると「待つだけで稼げる」）
 */
export function xpForMatch(
  score: BattlePlayerScore,
  outcome: BattleOutcome,
  forfeit = false,
): XpBreakdown {
  const total = score.perQuestion.length;
  const participation = XP_PARTICIPATION;
  const correct = score.correctCount * XP_PER_CORRECT;
  let outcomeXp = outcome === 'win' ? XP_WIN : outcome === 'draw' ? XP_DRAW : 0;
  if (forfeit) outcomeXp = Math.floor(outcomeXp / 2);
  const streak = score.maxStreak >= 3 ? XP_STREAK_BONUS : 0;
  const perfect = total > 0 && score.correctCount === total ? XP_PERFECT_BONUS : 0;
  const sum = Math.min(XP_PER_MATCH_MAX, participation + correct + outcomeXp + streak + perfect);
  return { participation, correct, outcome: outcomeXp, streak, perfect, total: sum };
}

// ============================================================
// レベル
// ============================================================

/** レベル上限（これ以上は経験値だけ積む） */
export const LEVEL_MAX = 99;

/**
 * レベル n に到達するのに必要な★累積★経験値。
 *
 * ■ 曲線の選び方
 *   序盤は1〜2試合で上がり（Lv2=60, Lv3=241, Lv5=520前後）、
 *   Lv10 で約2,400（≒15試合）、Lv30 で約14,000（≒100試合）。
 *   「毎日1〜2試合の人が3ヶ月で Lv30 前後」を目標にした。
 *   二次曲線（n^2）にすると後半が急すぎて止まるので、1.6乗にしている。
 */
export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(60 * Math.pow(level - 1, 1.6) + 50 * (level - 2));
}

export interface LevelInfo {
  level: number;
  /** いまのレベルに入ってから稼いだ経験値 */
  into: number;
  /** つぎのレベルまでに必要な経験値（最大レベルなら 0） */
  span: number;
  /** 0〜1 の進捗 */
  ratio: number;
}

/** 累積経験値 → レベル情報 */
export function levelOf(xp: number): LevelInfo {
  const safe = Number.isFinite(xp) && xp > 0 ? Math.floor(xp) : 0;
  let level = 1;
  while (level < LEVEL_MAX && safe >= xpRequiredForLevel(level + 1)) level += 1;
  const base = xpRequiredForLevel(level);
  const next = level >= LEVEL_MAX ? base : xpRequiredForLevel(level + 1);
  const span = Math.max(0, next - base);
  const into = safe - base;
  return {
    level,
    into,
    span,
    ratio: span === 0 ? 1 : Math.max(0, Math.min(1, into / span)),
  };
}
