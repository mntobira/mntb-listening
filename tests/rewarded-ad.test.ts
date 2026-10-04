import { afterEach, expect, it } from 'vitest';
import { registerRewardedAdProvider, rewardedAdAvailable, showRewardedAd } from '../src/ads/rewardedAd';
import { AD_CONFIG } from '../src/ads/adConfig';

afterEach(() => registerRewardedAdProvider(null));

it('ads are off by default, so the free gacha keeps using the in-app clip', async () => {
  expect(AD_CONFIG.rewarded.enabled).toBe(false);
  expect(AD_CONFIG.banner.enabled).toBe(false);
  registerRewardedAdProvider({ load: async () => true, show: async () => ({ status: 'rewarded' }) });
  expect(rewardedAdAvailable()).toBe(false);
  expect(await showRewardedAd()).toEqual({ status: 'unavailable', reason: 'not-configured' });
});

it('banner hides on quiz / explanation / live battle screens', () => {
  for (const s of ['quiz', 'explanation', 'battle_live']) expect(AD_CONFIG.banner.hiddenOn).toContain(s);
});
