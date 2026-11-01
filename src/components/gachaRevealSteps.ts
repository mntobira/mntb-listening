/**
 * ガチャの「確定演出」の段取り（モンスト・パズドラ風）。
 *
 * 光の色が 青 → 金 → 虹 → 大当たり（黒金）→ 伝説（深紅と金・LR）と段階的に上がっていき、
 * 引いたレア度の色で止まったら、白く弾けて結果画面へ移る。
 * 途中の色は「そのレア度以上が確定」の合図なので、実際のレア度より上の色は出さない（煽りの嘘をつかない）。
 */
import type { GachaRarity } from '../battle/core/growth';
import type { SfxName } from '../battle/ui/feedback';

export type RevealStage = 'blue' | 'gold' | 'rainbow' | 'ur' | 'lr';

export type RevealStep = { stage: RevealStage; ms: number; caption: string; sfx: SfxName; vibrate: boolean };

const ORDER: RevealStage[] = ['blue', 'gold', 'rainbow', 'ur', 'lr'];
const TOP: Record<GachaRarity, RevealStage> = { N: 'blue', R: 'gold', SR: 'rainbow', UR: 'ur', LR: 'lr' };

/**
 * ★2026-10-30 E1：もう少し楽しめるように各段を長く★（以前は 0.8〜1.5秒）
 *   いちばん下（青）は「力が集まる」溜めを含めて長め。上の段ほど長い。
 */
const STEP: Record<RevealStage, Omit<RevealStep, 'stage'>> = {
  blue: { ms: 1300, caption: 'とびらに光が集まっていく…', sfx: 'chest', vibrate: false },
  gold: { ms: 1200, caption: '金色に変わった！ R以上確定！', sfx: 'coin', vibrate: false },
  rainbow: { ms: 1300, caption: '虹色…！？ SR以上確定！！', sfx: 'levelup', vibrate: true },
  ur: { ms: 1600, caption: '確定演出！！ 大当たり UR！！', sfx: 'rankup', vibrate: true },
  lr: { ms: 1800, caption: 'まさかの…伝説降臨！！ LR！！！', sfx: 'jackpot', vibrate: true },
};

/**
 * ★E1★ 最後の段のあとの「溜め」。次の段のゲージがチカチカ光りかけて…止まる。
 *   次の段の「色」は出さない（ゲージが点滅するだけ）ので、実際より上のレア度を見せる嘘にはならない。
 *   LR はいちばん上なので溜めはない。
 */
export const REVEAL_TEASE_MS = 900;
export const REVEAL_TEASE_CAPTION = 'さらに光る…！？';
/** ゲージは毎回5本（引いたレア度の段数だけ並べると、最初から結果が分かってしまうため） */
export const REVEAL_ORDER: readonly RevealStage[] = ORDER;
export function hasTease(rarity: GachaRarity): boolean { return rarity !== 'LR'; }

/** 光が弾けてから結果が出るまで */
export const REVEAL_BURST_MS = 450;

/** 引いたレア度までの段取り。N なら青だけ、LR なら5段階すべて。 */
export function revealSteps(rarity: GachaRarity): RevealStep[] {
  const last = ORDER.indexOf(TOP[rarity]);
  return ORDER.slice(0, last + 1).map(stage => ({ stage, ...STEP[stage] }));
}

/** 演出全体の長さ（ms）。CinematicClip の安全装置（8秒）より短い。 */
export function revealTotalMs(rarity: GachaRarity): number {
  return revealSteps(rarity).reduce((n, s) => n + s.ms, 0) + (hasTease(rarity) ? REVEAL_TEASE_MS : 0) + REVEAL_BURST_MS;
}

/** 結果に出す星の数 */
export const RARITY_STARS: Record<GachaRarity, number> = { N: 2, R: 3, SR: 4, UR: 5, LR: 6 };

/** 弾けたときの音 */
export function burstSfx(rarity: GachaRarity): SfxName {
  return rarity === 'LR' || rarity === 'UR' || rarity === 'SR' ? 'jackpot' : 'gacha';
}
