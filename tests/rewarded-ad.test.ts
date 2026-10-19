import { afterEach, expect, it } from 'vitest';
import { registerRewardedAdProvider, rewardedAdAvailable, showRewardedAd } from '../src/ads/rewardedAd';
import { AD_CONFIG } from '../src/ads/adConfig';

afterEach(() => registerRewardedAdProvider(null));

it('ads are off by default, so the free gacha keeps using the in-app clip', async () => {
  expect(AD_CONFIG.rewarded.enabled).toBe(false);
  // 2026-10-14：バナーの「場所」は Web 版でもアプリ版と同じく空ける（実際の広告を出すのはアプリ版だけ）
  expect(AD_CONFIG.banner.enabled).toBe(true);
  registerRewardedAdProvider({ load: async () => true, show: async () => ({ status: 'rewarded' }) });
  expect(rewardedAdAvailable()).toBe(false);
  expect(await showRewardedAd()).toEqual({ status: 'unavailable', reason: 'not-configured' });
});

it('web never calls the native banner (only the space is reserved)', async () => {
  const src = (await import('node:fs')).readFileSync('src/utils/adService.ts', 'utf-8');
  expect(src).toMatch(/if \(!Capacitor\.isNativePlatform\(\) \|\| !AD_TOGGLES\.enableBottomBanner\)/);
});

it('banner hides on quiz / explanation / live battle screens', () => {
  for (const s of ['quiz', 'explanation', 'battle_live']) expect(AD_CONFIG.banner.hiddenOn).toContain(s);
});
