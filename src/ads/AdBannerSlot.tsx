import { useEffect } from 'react';
import { AD_CONFIG } from './adConfig';
import './ads.css';

/**
 * バナー広告の「場所」— 2026-10-05（今は描画しない）
 * =====================================================================
 * カサニマロさんの案「上下にバナー広告を入れる」に備えた受け皿。
 *   - AD_CONFIG.banner.enabled が false の間は何も描かず、--ad-top-h / --ad-bottom-h は 0px のまま。
 *   - true にすると、画面の上／下に高さぶんの枠を確保し、CSS 変数で全画面の余白を詰める。
 *     実際の広告はネイティブ SDK（AdMob の Banner）が、この枠の上に重ねて表示する想定。
 *   - 問題を解いている最中・対戦中・解説など（hiddenOn）は枠ごと消して学習の邪魔をしない。
 */
export function AdBannerSlot({ screen }: { screen: string }) {
  const { enabled, position, height, hiddenOn } = AD_CONFIG.banner;
  const show = enabled && !hiddenOn.includes(screen);
  const top = show && (position === 'top' || position === 'both');
  const bottom = show && (position === 'bottom' || position === 'both');
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--ad-top-h', top ? `${height}px` : '0px');
    root.setProperty('--ad-bottom-h', bottom ? `${height}px` : '0px');
    document.documentElement.toggleAttribute('data-ad-banner', top || bottom);
    return () => { root.setProperty('--ad-top-h', '0px'); root.setProperty('--ad-bottom-h', '0px'); document.documentElement.removeAttribute('data-ad-banner'); };
  }, [top, bottom, height]);
  if (!show) return null;
  return <>
    {top && <div className="ad-banner-slot is-top" aria-hidden="true" data-ad-slot="top" />}
    {bottom && <div className="ad-banner-slot is-bottom" aria-hidden="true" data-ad-slot="bottom" />}
  </>;
}
