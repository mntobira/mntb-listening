/**
 * アプリ内広告の統合設定（AdMob / Capacitor）
 * =========================================================
 * ここにあるフラグ（true / false）を切り替えるだけで、
 * 各広告の表示・非表示、および画面余白の確保/解除が即座に反映されます。
 *
 * 【スクリーンショット撮影時の完全非表示保証】
 * - URLクエリ (?no_ads=1 または ?screenshot=1)
 * - localStorage (no_ads === '1' または screenshot_mode === 'true')
 * - 環境変数 (VITE_DISABLE_ADS === 'true')
 * のいずれかが指定された場合、すべての広告・枠・余白が自動で完全無効化されます。
 */

function isAdDisabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
    if (env.VITE_DISABLE_ADS === 'true' || env.VITE_DISABLE_ADS === '1') return true;
    if ((window as Window & { __SCREENSHOT_MODE__?: unknown }).__SCREENSHOT_MODE__) return true;
    const params = new URLSearchParams(window.location.search);
    if (params.get('no_ads') === '1' || params.get('screenshot') === '1') return true;
    if (localStorage.getItem('no_ads') === '1' || localStorage.getItem('screenshot_mode') === 'true') return true;
  } catch {
    // URL・localStorage を読めない環境では広告の無効化指定なしとして扱う
  }
  return false;
}

/**
 * インタースティシャル広告フラグ（演習終了・結果画面遷移時）
 * - false: 一時非表示（最初の大々的な告知までは引っこめる）
 * - true : 表示（いつでも true に切り替えるだけで元通りに復活します）
 */
export const ENABLE_INTERSTITIAL_AD = false;

/**
 * 解説画面末尾のインライン広告枠フラグ
 * - false: 完全非表示（DOM自体レンダリングされません）
 * - true : 表示（いつでもtrueに切り替えるだけで元通りに復活します）
 */
export const ENABLE_INLINE_AD = false;

export const AD_TOGGLES = {
  /** 妙案1: インタースティシャル広告（演習終了・結果画面遷移時） */
  get enableInterstitial(): boolean { return ENABLE_INTERSTITIAL_AD && !isAdDisabled(); },

  /** 妙案2: 画面下部バナー広告（CSS変数でフッター・ナビを自動押し上げ） */
  get enableBottomBanner(): boolean { return !isAdDisabled(); },

  /** 妙案3: 解説画面の末尾インライン広告枠（Phase2/3検討用。ENABLE_INLINE_ADで制御） */
  get enableInlineAd(): boolean { return ENABLE_INLINE_AD && !isAdDisabled(); },

  /** リワード広告（ガチャ等の動画で1回） */
  get enableRewarded(): boolean { return !isAdDisabled(); },
};

// テスト用デモ広告ユニットID（Google公式 AdMob テストID）
export const ADMOB_IDS = {
  android: {
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
    native: 'ca-app-pub-3940256099942544/2247696110', // Google公式テスト用ネイティブ広告ID
  },
  ios: {
    banner: 'ca-app-pub-3940256099942544/2934735716',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
    native: 'ca-app-pub-3940256099942544/3986624511', // Google公式テスト用ネイティブ広告ID
  },
};

// 本番リリース用広告ユニットID
export const ADMOB_RELEASE_IDS = {
  android: {
    banner: 'ca-app-pub-9838177330528377/9177790439', // 本番 Android バナー広告ID
    interstitial: 'ca-app-pub-9838177330528377/9055424941', // 本番 Android インタースティシャル広告ID
    rewarded: 'ca-app-pub-9838177330528377/1176934923', // 本番 Android リワード広告ID（Phase 2予定）
    native: 'ca-app-pub-9838177330528377/9314270237', // 本番 Android ネイティブ アドバンス広告ID（Phase 2/3検討用）
  },
  ios: {
    banner: 'ca-app-pub-9838177330528377/8564913897', // 本番 iOS バナー広告ID
    interstitial: 'ca-app-pub-9838177330528377/7060260538', // 本番 iOS インタースティシャル広告ID
    rewarded: 'ca-app-pub-9838177330528377/1014650376', // 本番 iOS リワード広告ID（Phase 2予定）
    native: 'ca-app-pub-9838177330528377/4062777702', // 本番 iOS ネイティブ アドバンス広告ID（Phase 2/3検討用）
  },
};

/**
 * 実行環境（デバッグ / リリース）に応じたバナー広告ユニットIDを取得
 * - VITE_ADS_TESTING=true の場合は常にGoogle公式テストIDを使用
 * - 環境変数 VITE_ADS_BANNER_UNIT_ID の指定があれば最優先
 * - リリースビルド時は本番用IDを使用
 */
export function getEffectiveBannerId(platform: 'ios' | 'android'): string {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  if (env.VITE_ADS_TESTING === 'true') {
    return ADMOB_IDS[platform].banner;
  }
  if (env.VITE_ADS_BANNER_UNIT_ID) {
    return env.VITE_ADS_BANNER_UNIT_ID;
  }
  // リリースビルド（本番）は本番用ID、開発・デバッグ環境ではテスト用ID
  return env.MODE === 'production' && !env.DEV
    ? ADMOB_RELEASE_IDS[platform].banner
    : ADMOB_IDS[platform].banner;
}

/**
 * 実行環境（デバッグ / リリース）に応じたインタースティシャル広告ユニットIDを取得
 * - VITE_ADS_TESTING=true の場合は常にGoogle公式テストIDを使用
 * - 環境変数 VITE_ADS_INTERSTITIAL_UNIT_ID の指定があれば最優先
 * - リリースビルド時は本番用IDを使用
 */
export function getEffectiveInterstitialId(platform: 'ios' | 'android'): string {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  if (env.VITE_ADS_TESTING === 'true') {
    return ADMOB_IDS[platform].interstitial;
  }
  if (env.VITE_ADS_INTERSTITIAL_UNIT_ID) {
    return env.VITE_ADS_INTERSTITIAL_UNIT_ID;
  }
  // リリースビルド（本番）は本番用ID、開発・デバッグ環境ではテスト用ID
  return env.MODE === 'production' && !env.DEV
    ? ADMOB_RELEASE_IDS[platform].interstitial
    : ADMOB_IDS[platform].interstitial;
}

/**
 * 実行環境（デバッグ / リリース）に応じたリワード広告ユニットIDを取得
 * - VITE_ADS_TESTING=true の場合は常にGoogle公式テストIDを使用
 * - 環境変数 VITE_ADS_REWARDED_UNIT_ID の指定があれば最優先
 * - リリースビルド時は本番用IDを使用（Phase 2: ガチャの「動画で1回」等）
 */
export function getEffectiveRewardedId(platform: 'ios' | 'android'): string {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  if (env.VITE_ADS_TESTING === 'true') {
    return ADMOB_IDS[platform].rewarded;
  }
  if (env.VITE_ADS_REWARDED_UNIT_ID) {
    return env.VITE_ADS_REWARDED_UNIT_ID;
  }
  // リリースビルド（本番）は本番用ID、開発・デバッグ環境ではテスト用ID
  return env.MODE === 'production' && !env.DEV
    ? ADMOB_RELEASE_IDS[platform].rewarded
    : ADMOB_IDS[platform].rewarded;
}


