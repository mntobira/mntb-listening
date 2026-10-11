import { Capacitor } from '@capacitor/core';
import { BannerAdOptions, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';
import { AD_TOGGLES, ADMOB_IDS, getEffectiveBannerId, getEffectiveRewardedId } from '../utils/adConfig';

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
const on = (v: string | undefined, defaultVal: boolean) => (v != null ? v === '1' || v === 'true' : defaultVal);

export type BannerPosition = 'top' | 'bottom' | 'both';

const isIos = Capacitor.getPlatform() === 'ios';

export const AD_CONFIG = {
  rewarded: {
    /** true にすると「動画で1回」が広告になる（アプリ版または環境変数で有効） */
    enabled: on(env.VITE_ADS_REWARDED, Capacitor.isNativePlatform() && AD_TOGGLES.enableRewarded),
    unitId: getEffectiveRewardedId(isIos ? 'ios' : 'android'),
    dailyLimit: 5,
  },
  banner: {
    /** true にすると画面の上／下にバナーの場所を空け、ネイティブバナーを表示（初回は OFF） */
    enabled: on(env.VITE_ADS_BANNER, Capacitor.isNativePlatform() && AD_TOGGLES.enableBottomBanner),
    position: ((env.VITE_ADS_BANNER_POSITION as BannerPosition) || 'bottom') as BannerPosition,
    unitId: getEffectiveBannerId(isIos ? 'ios' : 'android'),
    height: 50,
    /** バナーを出さない画面（問題を解いている最中・対戦中・解説など）。学習の邪魔をしない */
    hiddenOn: ['quiz', 'explanation', 'battle_live', 'onboarding', 'launch'] as string[],
  },
} as const;

export const adsActive = () => AD_CONFIG.rewarded.enabled || AD_CONFIG.banner.enabled;
