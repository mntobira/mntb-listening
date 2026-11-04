import { afterEach, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { isAdFree, setAdFree } from '../src/ads/adFree';
import { registerRewardedAdProvider, rewardedAdAvailable } from '../src/ads/rewardedAd';

// 2026-11-04：塾クラスの生徒には広告を出さない
afterEach(() => { setAdFree(false); registerRewardedAdProvider(null); });

it('ふだんは広告あり、塾クラスの生徒になると広告なし', () => {
  expect(isAdFree()).toBe(false);
  setAdFree(true);
  expect(isAdFree()).toBe(true);
});

it('広告なしの間はリワード広告にしない（応援動画で引く）', () => {
  registerRewardedAdProvider({ load: async () => true, show: async () => ({ status: 'rewarded' }) });
  setAdFree(true);
  expect(rewardedAdAvailable()).toBe(false);
});

it('バナーは広告なしの人には場所も空けない・App が塾クラスの判定をつなぐ', () => {
  expect(readFileSync('src/ads/AdBannerSlot.tsx', 'utf8')).toMatch(/enabled && !adFree && !hiddenOn\.includes\(screen\)/);
  expect(readFileSync('src/App.tsx', 'utf8')).toMatch(/useJukuAdFree\(\)/);
  const hook = readFileSync('src/hooks/useJukuAdFree.ts', 'utf8');
  expect(hook).toMatch(/loadJukuMemberships\(uid\)\.length > 0/);
  expect(hook).toMatch(/plan === 'juku'/);
});
