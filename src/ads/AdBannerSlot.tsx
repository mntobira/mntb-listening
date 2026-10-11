import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { AD_CONFIG } from './adConfig';
import { showNativeBottomBanner, hideNativeBottomBanner } from '../utils/adService';
import './ads.css';

/**
 * バナー広告の「場所」およびネイティブバナーの制御
 * =====================================================================
 * AD_TOGGLES.enableBottomBanner（または AD_CONFIG.banner.enabled）で管理。
 * - 有効時:
 *     --ad-bottom-h に 50px がセットされ、HTMLに [data-ad-banner] 属性が付与される。
 *     CSS により、下部ナビや各画面のフッターが 50px 分自動で持ち上がり、
 *     ネイティブバナー（AdMob）を表示する。
 * - 無効時（または quiz, explanation 等の学習集中画面時）:
 *     --ad-bottom-h は 0px になり、ネイティブバナーは即座に非表示/削除され、
 *     一切の余白・枠が解除される。
 */
export function AdBannerSlot({ screen }: { screen: string }) {
  const { enabled, position, height, hiddenOn } = AD_CONFIG.banner;
  const show = enabled && !hiddenOn.includes(screen);
  const top = show && (position === 'top' || position === 'both');
  const bottom = show && (position === 'bottom' || position === 'both');

  useEffect(() => {
    const root = document.documentElement.style;
    if (show && bottom) {
      const isAndroid = Capacitor.getPlatform() === 'android';
      root.setProperty('--ad-bottom-h', `${height}px`);
      root.setProperty('--ad-gap', isAndroid ? '18px' : '10px');
      document.documentElement.setAttribute('data-ad-banner', 'true');
      window.dispatchEvent(new Event('resize'));

      const navEl = document.querySelector('.app-bottom-nav');
      const safeBottom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-safe-bottom')) || 0;
      const navPureHeight = navEl ? Math.round(navEl.getBoundingClientRect().height - safeBottom) : 72;
      // Android 専用：ナビバーの枠線との接触を防ぎつつ、上部ボタンとの余白を最大化するため4pxの適正マージンを設定（iOSは変更なし）
      const extraMargin = isAndroid ? 4 : 0;
      const margin = (navPureHeight >= 40 && navPureHeight <= 140 ? navPureHeight : 72) + extraMargin;

      showNativeBottomBanner(margin).catch(() => {});
    } else {
      root.setProperty('--ad-bottom-h', '0px');
      root.setProperty('--ad-gap', '0px');
      document.documentElement.setAttribute('data-ad-banner', 'false');
      window.dispatchEvent(new Event('resize'));
      hideNativeBottomBanner().catch(() => {});
    }

    if (top) {
      root.setProperty('--ad-top-h', `${height}px`);
    } else {
      root.setProperty('--ad-top-h', '0px');
    }

    return () => {
      root.setProperty('--ad-top-h', '0px');
      root.setProperty('--ad-bottom-h', '0px');
      root.setProperty('--ad-gap', '0px');
      document.documentElement.setAttribute('data-ad-banner', 'false');
      window.dispatchEvent(new Event('resize'));
      hideNativeBottomBanner().catch(() => {});
    };
  }, [show, top, bottom, height]);

  if (!show) return null;

  return (
    <>
      {top && <div className="ad-banner-slot is-top" aria-hidden="true" data-ad-slot="top" />}
      {bottom && <div className="ad-banner-slot is-bottom" aria-hidden="true" data-ad-slot="bottom" />}
    </>
  );
}
