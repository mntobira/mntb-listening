/**
 * ガチャの「確定演出」の段取り（モンスト・パズドラ風）。
 *
 * 光の色が 青 → 金 → 虹 → 大当たり（黒金）と段階的に上がっていき、
 * 引いたレア度の色で止まったら、白く弾けて結果画面へ移る。
 * 途中の色は「そのレア度以上が確定」の合図なので、実際のレア度より上の色は出さない（煽りの嘘をつかない）。
 */
import type { GachaRarity } from '../battle/core/growth';
import type { SfxName } from '../battle/ui/feedback';

export type RevealStage = 'blue' | 'gold' | 'rainbow' | 'ur';

export type RevealStep = { stage: RevealStage; ms: number; caption: string; sfx: SfxName; vibrate: boolean };

const ORDER: RevealStage[] = ['blue', 'gold', 'rainbow', 'ur'];
const TOP: Record<GachaRarity, RevealStage> = { N: 'blue', R: 'gold', SR: 'rainbow', UR: 'ur' };

const STEP: Record<RevealStage, Omit<RevealStep, 'stage'>> = {
  blue: { ms: 800, caption: 'とびらが光りはじめた…', sfx: 'chest', vibrate: false },
  gold: { ms: 850, caption: '金色に変わった！ R以上確定！', sfx: 'coin', vibrate: false },
  rainbow: { ms: 950, caption: '虹色…！？ SR以上確定！！', sfx: 'levelup', vibrate: true },
  ur: { ms: 1300, caption: '確定演出！！ 大当たり UR！！', sfx: 'rankup', vibrate: true },
};

/** 光が弾けてから結果が出るまで */
export const REVEAL_BURST_MS = 450;

/** 引いたレア度までの段取り。N なら青だけ、UR なら4段階すべて。 */
export function revealSteps(rarity: GachaRarity): RevealStep[] {
  const last = ORDER.indexOf(TOP[rarity]);
  return ORDER.slice(0, last + 1).map(stage => ({ stage, ...STEP[stage] }));
}

/** 演出全体の長さ（ms）。CinematicClip の安全装置（8秒）より短い。 */
export function revealTotalMs(rarity: GachaRarity): number {
  return revealSteps(rarity).reduce((n, s) => n + s.ms, 0) + REVEAL_BURST_MS;
}

/** 結果に出す星の数 */
export const RARITY_STARS: Record<GachaRarity, number> = { N: 2, R: 3, SR: 4, UR: 5 };

/** 弾けたときの音 */
export function burstSfx(rarity: GachaRarity): SfxName {
  return rarity === 'UR' || rarity === 'SR' ? 'jackpot' : 'gacha';
}
