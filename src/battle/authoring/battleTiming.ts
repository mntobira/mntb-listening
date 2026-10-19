/**
 * 対戦の制限時間（秒）の見積り。
 *
 * ★1人用（src/utils/scoring.ts の calcSubQuestionTimeLimit）から独立させている★
 *
 * 以前は生成スクリプトが 1人用の見積りをそのまま圧縮していた。
 * そのため 1人用の「短文記入」の秒数を伸ばした変更（87ff989）が、
 * 対戦プールを再生成するたびに かな入力問題の締切を 18秒→29秒 のように
 * 勝手に変えてしまっていた（関係ない生物基礎・化学・化学基礎の差分が出る原因）。
 *
 * 対戦の締切は対戦のバランスそのものなので、ここで式を固定する。
 * 1人用を調整しても対戦は変わらない。対戦を変えたいときはここを直し、
 * `npm run gen:battle-pool` で再生成すること。
 */

export interface BattleTimingInput {
  type?: string;
  label?: string;
  correctAnswer?: string;
  options?: string[];
  items?: string[];
}

/** 対戦の下限・上限（秒）。締切は必ず60秒未満（AGENTS.md）。 */
export const BATTLE_TIME_MIN = 8;
export const BATTLE_TIME_MAX = 30;
/** 1人でじっくり解く前提の見積りを対戦用に縮める比率 */
export const BATTLE_TIME_RATIO = 0.42;

/** 圧縮前の「読む+考える+操作」の見積り（秒）。対戦用に固定した式。 */
export function battleBaseSeconds(sq: BattleTimingInput): number {
  const type = sq.type || 'text';
  const labelLen = (sq.label || '').length;
  let base: number;
  switch (type) {
    case 'multiple_choice': {
      const optCount = sq.options?.length ?? 4;
      const optLen = (sq.options || []).reduce((s, o) => s + o.length, 0);
      base = 22 + optCount * 4 + Math.min(optLen * 0.4, 30);
      break;
    }
    case 'sorting': {
      const itemCount = sq.items?.length ?? 4;
      base = 40 + itemCount * 8;
      break;
    }
    case 'descriptive': {
      const answerLen = (sq.correctAnswer || '').length || 25;
      base = 60 + Math.min(answerLen * 2.5, 120);
      break;
    }
    case 'text':
    default: {
      const answerLen = (sq.correctAnswer || '').length || 4;
      base = 28 + Math.min(answerLen * 3, 30);
      break;
    }
  }
  if (labelLen > 40) base += Math.min((labelLen - 40) * 0.3, 20);
  return Math.round(Math.min(Math.max(base, 20), 240));
}

/** 対戦の制限時間（秒）= clamp(round(見積り × 比率), 下限, 上限) */
export function battleTimeLimitOf(sq: BattleTimingInput): number {
  const scaled = Math.round(battleBaseSeconds(sq) * BATTLE_TIME_RATIO);
  return Math.min(BATTLE_TIME_MAX, Math.max(BATTLE_TIME_MIN, scaled));
}
