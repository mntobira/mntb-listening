/**
 * 対戦のレート（Elo）計算（C-08: battleCore.ts から分離）。
 *   定数と式は分離前と1文字も変えていない。battleCore.ts から全て re-export している
 *   （import { nextRating } from './battleCore' は従来どおり動く）。
 */
import type { BattleOutcome } from './types';

// ============================================================
// レート（Elo）
// ============================================================

/** レートの初期値。1500 は Elo で広く使われる基準値 */
export const RATING_INITIAL = 1500;

/**
 * レート変動の係数（K値）。
 *
 * 大きいほど1試合の増減が激しくなる。
 * 学習アプリなので「負けても大きく落ちない」ことを重視して控えめの 24 にした。
 * （チェスの一般的な設定は 10〜40）
 */
export const RATING_K = 24;

/** レートの下限（これ以下には下がらない。心理的な歯止め） */
export const RATING_FLOOR = 800;

/**
 * 切断・放棄で勝ったときのレート増加の割合。
 *
 * ★なぜ半分にするのか★
 * 「勝てそうにない試合をわざと切断する」ことを防ぐのと同時に、
 * 「相手を切断させて稼ぐ」ことも防ぎたい。
 * 放棄勝ちの価値を下げると、どちらの動機も弱くなる。
 */
export const FORFEIT_RATING_RATIO = 0.5;

/**
 * Elo で新しいレートを計算する。
 *
 * 期待勝率 E = 1 / (1 + 10^((相手 − 自分)/400))
 * 新レート  = 自分 + K × (実際の結果 − E)
 *   実際の結果: 勝ち 1 / 引き分け 0.5 / 負け 0
 *
 * @param forfeit 放棄・切断による決着なら true（増減を半分にする）
 */
export function nextRating(
  myRating: number,
  opponentRating: number,
  outcome: BattleOutcome,
  forfeit = false,
): number {
  const expected = 1 / (1 + Math.pow(10, (opponentRating - myRating) / 400));
  const actual = outcome === 'win' ? 1 : outcome === 'draw' ? 0.5 : 0;
  const k = forfeit ? RATING_K * FORFEIT_RATING_RATIO : RATING_K;
  const raw = myRating + k * (actual - expected);
  return Math.max(RATING_FLOOR, Math.round(raw));
}
