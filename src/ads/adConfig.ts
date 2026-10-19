import { Capacitor } from '@capacitor/core';
import { AD_TOGGLES, getEffectiveBannerId, getEffectiveRewardedId } from '../utils/adConfig';

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
    /**
     * true にすると画面の上／下にバナーの場所を空ける。
     * ★2026-10-14：Web 版でもアプリ版と同じ場所を空ける（画面の見え方・余白をそろえる）★
     *   実際の広告（AdMob）を出すのはアプリ版だけ（showNativeBottomBanner が Web では何もしない）。
     *   Web で枠を消したいときは ?no_ads=1 か VITE_ADS_BANNER=0。
     */
    enabled: on(env.VITE_ADS_BANNER, AD_TOGGLES.enableBottomBanner),
    position: ((env.VITE_ADS_BANNER_POSITION as BannerPosition) || 'bottom') as BannerPosition,
    unitId: getEffectiveBannerId(isIos ? 'ios' : 'android'),
    height: 50,
    /** バナーを出さない画面（問題を解いている最中・対戦中・解説など）。学習の邪魔をしない */
    // 'pdf' … アプリ内の PDF ビューを開いている間（PDF の上に広告を重ねない・2026-10-17）
    hiddenOn: ['quiz', 'explanation', 'battle_live', 'onboarding', 'launch', 'pdf'] as string[],
  },
} as const;

export const adsActive = () => AD_CONFIG.rewarded.enabled || AD_CONFIG.banner.enabled;
