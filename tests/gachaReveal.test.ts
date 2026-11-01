import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { RARITY_STARS, burstSfx, revealSteps, revealTotalMs } from '../src/components/gachaRevealSteps';

describe('ガチャの確定演出（青→金→虹→大当たり）', () => {
  it('引いたレア度の色で止まり、それより上の色は出さない', () => {
    expect(revealSteps('N').map(s => s.stage)).toEqual(['blue']);
    expect(revealSteps('R').map(s => s.stage)).toEqual(['blue', 'gold']);
    expect(revealSteps('SR').map(s => s.stage)).toEqual(['blue', 'gold', 'rainbow']);
    expect(revealSteps('UR').map(s => s.stage)).toEqual(['blue', 'gold', 'rainbow', 'ur']);
    expect(revealSteps('LR').map(s => s.stage)).toEqual(['blue', 'gold', 'rainbow', 'ur', 'lr']);
  });
  it('大当たりほど長く、どれも動画の安全装置（8秒）より短い', () => {
    const t = (['N', 'R', 'SR', 'UR', 'LR'] as const).map(revealTotalMs);
    expect(t).toEqual([...t].sort((a, b) => a - b));
    for (const ms of t) expect(ms).toBeLessThan(8000);
    // E1（2026-10-30）：短すぎたので長く。いちばん短い N でも2秒以上
    expect(t[0]).toBeGreaterThanOrEqual(2000);
  });
  it('星の数と弾けたときの音', () => {
    expect([RARITY_STARS.N, RARITY_STARS.R, RARITY_STARS.SR, RARITY_STARS.UR, RARITY_STARS.LR]).toEqual([2, 3, 4, 5, 6]);
    expect(burstSfx('LR')).toBe('jackpot'); expect(burstSfx('UR')).toBe('jackpot'); expect(burstSfx('SR')).toBe('jackpot'); expect(burstSfx('N')).toBe('gacha');
  });
  it('ガチャ画面が確定演出を使い、「結果を見る」で飛ばせる', () => {
    const room = readFileSync('src/components/GachaRoom.tsx', 'utf8');
    expect(room).toContain('<GachaReveal');
    expect(readFileSync('src/components/GachaReveal.tsx', 'utf8')).toContain('結果を見る');
  });
});

describe('E1：ゲージで結果が先に分からない（2026-10-30）', () => {
  it('ゲージは毎回5本並べる（引いたレア度の段数だけ並べない）', () => {
    const src = readFileSync('src/components/GachaReveal.tsx', 'utf8');
    expect(src).toContain('REVEAL_ORDER.map(');
    expect(src).not.toContain('steps.map((s, i) => <li');
  });
  it('LR 以外は最後に溜めがある', async () => {
    const { hasTease } = await import('../src/components/gachaRevealSteps');
    expect(hasTease('N')).toBe(true); expect(hasTease('UR')).toBe(true); expect(hasTease('LR')).toBe(false);
  });
});
