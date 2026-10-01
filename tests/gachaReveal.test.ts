import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { RARITY_STARS, burstSfx, revealSteps, revealTotalMs } from '../src/components/gachaRevealSteps';

describe('ガチャの確定演出（青→金→虹→大当たり）', () => {
  it('引いたレア度の色で止まり、それより上の色は出さない', () => {
    expect(revealSteps('N').map(s => s.stage)).toEqual(['blue']);
    expect(revealSteps('R').map(s => s.stage)).toEqual(['blue', 'gold']);
    expect(revealSteps('SR').map(s => s.stage)).toEqual(['blue', 'gold', 'rainbow']);
    expect(revealSteps('UR').map(s => s.stage)).toEqual(['blue', 'gold', 'rainbow', 'ur']);
  });
  it('大当たりほど長く、どれも動画の安全装置（8秒）より短い', () => {
    const t = (['N', 'R', 'SR', 'UR'] as const).map(revealTotalMs);
    expect(t).toEqual([...t].sort((a, b) => a - b));
    for (const ms of t) expect(ms).toBeLessThan(8000);
    expect(t[0]).toBeLessThan(1500);
  });
  it('星の数と弾けたときの音', () => {
    expect([RARITY_STARS.N, RARITY_STARS.R, RARITY_STARS.SR, RARITY_STARS.UR]).toEqual([2, 3, 4, 5]);
    expect(burstSfx('UR')).toBe('jackpot'); expect(burstSfx('SR')).toBe('jackpot'); expect(burstSfx('N')).toBe('gacha');
  });
  it('ガチャ画面が確定演出を使い、「結果を見る」で飛ばせる', () => {
    const room = readFileSync('src/components/GachaRoom.tsx', 'utf8');
    expect(room).toContain('<GachaReveal');
    expect(readFileSync('src/components/GachaReveal.tsx', 'utf8')).toContain('結果を見る');
  });
});
