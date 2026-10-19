import {
  AdMob,
  BannerAdOptions,
  BannerAdPosition,
  BannerAdSize,
  RewardAdPluginEvents,
} from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { AD_TOGGLES, getEffectiveBannerId, getEffectiveInterstitialId, getEffectiveRewardedId } from './adConfig';
import { registerRewardedAdProvider } from '../ads/rewardedAd';

let isInitialized = false;
let isBannerShowing = false;

/**
 * AdMobの初期化（アプリ起動時に一度実行）
 */
export async function initializeAdMob(): Promise<void> {
  if (!Capacitor.isNativePlatform() || isInitialized) return;
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
    const isTesting = env.VITE_ADS_TESTING === 'true' || env.MODE !== 'production' || Boolean(env.DEV);

    if (Capacitor.getPlatform() === 'ios') {
      try {
        await AdMob.requestTrackingAuthorization();
      } catch (e) {
        console.warn('[AdMob] requestTrackingAuthorization error:', e);
      }
    }
    await AdMob.initialize({
      initializeForTesting: isTesting,
    });
    isInitialized = true;

    // リワード広告プロバイダーの登録（AD_TOGGLES.enableRewarded が有効な場合）
    if (AD_TOGGLES.enableRewarded) {
      registerRewardedAdProvider({
        async load(adId: string) {
          try {
            const isIos = Capacitor.getPlatform() === 'ios';
            const unitId = adId || getEffectiveRewardedId(isIos ? 'ios' : 'android');
            await AdMob.prepareRewardVideoAd({ adId: unitId, isTesting });
            return true;
          } catch (e) {
            console.warn('[AdMob] prepareRewardVideoAd error:', e);
            return false;
          }
        },
        async show(adId: string) {
          return new Promise((resolve) => {
            let rewarded = false;
            const rewardSub = AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
              rewarded = true;
            });
            const dismissSub = AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
              // リスナーの解除失敗はプラグイン側の問題で、結果の通知には影響しない（下も同じ）
              rewardSub.then((s) => s.remove()).catch(() => {});
              dismissSub.then((s) => s.remove()).catch(() => {});
              resolve(rewarded ? { status: 'rewarded' } : { status: 'dismissed' });
            });
            AdMob.showRewardVideoAd().catch((e) => {
              rewardSub.then((s) => s.remove()).catch(() => {}); // 解除失敗は結果の通知に影響しない
              dismissSub.then((s) => s.remove()).catch(() => {}); // 同上
              resolve({ status: 'unavailable', reason: String(e) });
            });
          });
        },
      });
    }

    // インタースティシャル広告の初回事前読み込み
    if (AD_TOGGLES.enableInterstitial) {
      preloadInterstitial();
    }
  } catch (error) {
    console.warn('[AdMob] Initialization failed:', error);
  }
}

/**
 * インタースティシャルのユニットIDを取得
 */
export function getInterstitialUnitId(): string {
  const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
  return getEffectiveInterstitialId(platform);
}

/**
 * Google公式のデモ用テストIDかどうかを判定
 */
export function isDemoAdId(unitId: string): boolean {
  return unitId.includes('3940256099942544');
}

/**
 * インタースティシャル広告の事前ロード
 */
export async function preloadInterstitial(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !AD_TOGGLES.enableInterstitial) return;
  try {
    const adId = getInterstitialUnitId();
    const isDemo = isDemoAdId(adId);

    await AdMob.prepareInterstitial({
      adId,
      isTesting: isDemo,
    });
  } catch (error) {
    console.warn('[AdMob] Preload interstitial failed:', error);
  }
}

const BREAKPOINT_COUNT_KEY = 'manatobi_interstitial_breakpoint_count';
const LAST_SHOWN_TIME_KEY = 'manatobi_interstitial_last_shown';
const MIN_INTERVAL_MS = 3 * 60 * 1000; // 3分

/**
 * 区切り（対戦・演習の結果後）でインタースティシャル広告の表示を試みる。
 * - Demo ID使用時: 即座に表示（テスト・確認用）
 * - 本番ID使用時（テストデバイス含む）: 本番の出しすぎ防止ルールを厳格に適用
 *   - 初回2回はスキップ（3回目の区切りから対象）
 *   - 3回の区切りに1回（count % 3 === 0）
 *   - 前回表示から3分以上あける
 * - 読み込み失敗時は待たずに通過
 */
export async function showInterstitialAtBreakpoint(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !AD_TOGGLES.enableInterstitial) return;

  try {
    const unitId = getInterstitialUnitId();
    const isDemo = isDemoAdId(unitId);

    // 本番IDの場合は頻度制限（3回に1回・3分間隔）を適用
    // Demo IDの場合は検証のため即座に表示
    if (!isDemo) {
      let count = 0;
      try {
        const stored = localStorage.getItem(BREAKPOINT_COUNT_KEY);
        count = (stored ? parseInt(stored, 10) : 0) + 1;
        localStorage.setItem(BREAKPOINT_COUNT_KEY, String(count));
      } catch {
        count = 1;
      }

      // 初回2回は出さない（3回目から判定） & 3回の区切りに1回
      if (count < 3 || count % 3 !== 0) {
        return;
      }

      const now = Date.now();
      let lastShown = 0;
      try {
        const storedLast = localStorage.getItem(LAST_SHOWN_TIME_KEY);
        lastShown = storedLast ? parseInt(storedLast, 10) : 0;
      } catch {
        lastShown = 0;
      }

      if (now - lastShown < MIN_INTERVAL_MS) {
        return;
      }
    }

    await AdMob.showInterstitial();
    try {
      localStorage.setItem(LAST_SHOWN_TIME_KEY, String(Date.now()));
    } catch {
      // 表示時刻を保存できない環境では、頻度制限なしで続ける（広告の表示自体は成功している）
    }
    preloadInterstitial();
  } catch (error) {
    console.warn('[AdMob] Interstitial show at breakpoint failed/skipped:', error);
    preloadInterstitial();
  }
}

/**
 * 互換性のための既存関数（頻度制限付きの区切り処理を呼び出す）
 */
export async function showInterstitialAd(): Promise<void> {
  return showInterstitialAtBreakpoint();
}

/**
 * 妙案2: 画面下部バナー広告の表示（ナビバーのすぐ上に出す）
 * @param margin ナビバーの上端に合わせるためのボトムマージン（pt/dp、既定72）
 */
export async function showNativeBottomBanner(margin = 72): Promise<void> {
  if (!Capacitor.isNativePlatform() || !AD_TOGGLES.enableBottomBanner) {
    hideNativeBottomBanner();
    return;
  }
  if (isBannerShowing) return;

  try {
    const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
    const adId = getEffectiveBannerId(platform);
    const isDemo = isDemoAdId(adId);

    const options: BannerAdOptions = {
      adId,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin,
      isTesting: isDemo,
    };

    await AdMob.showBanner(options);
    isBannerShowing = true;
  } catch (error) {
    console.warn('[AdMob] Show banner failed:', error);
  }
}

/**
 * 妙案2: 画面下部バナー広告の非表示・削除
 */
export async function hideNativeBottomBanner(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    if (isBannerShowing) {
      await AdMob.hideBanner();
      await AdMob.removeBanner();
      isBannerShowing = false;
    }
  } catch (error) {
    console.warn('[AdMob] Hide banner failed:', error);
  }
}
