import React from 'react';
import { BookOpen, Gift, Home as HomeIcon, Settings, Swords, Trophy } from 'lucide-react';

/**
 * C19 下部ナビ（スマホ）／サイドバー（PC）。全画面でこの1つだけを使う（2026-10-01）。
 * 見た目は styles/nav.css。どの項目も同じ大きさ・同じ文字・同じアイコン線幅で、現在地だけを強調する。
 * 遷移の中身（どこへ行くか）は App 側の onClick に任せ、ここは並びと見た目だけを持つ。
 */
export type BottomNavId = 'home' | 'study' | 'battle' | 'gacha' | 'ranking' | 'settings';
export interface BottomNavItem {
  id: BottomNavId;
  label: string;
  ariaLabel: string;
  current: boolean;
  onClick: () => void;
  /** 右上の数字（フレンド申請など）。0 なら出さない */
  badge?: number;
  hidden?: boolean;
}
const ICONS: Record<BottomNavId, React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>> = {
  home: HomeIcon, study: BookOpen, battle: Swords, gacha: Gift, ranking: Trophy, settings: Settings,
};

export const BottomNavigation = React.forwardRef<HTMLElement, { items: BottomNavItem[] }>(function BottomNavigation({ items }, ref) {
  return (
    <nav ref={ref} aria-label="メインナビゲーション"
      className="app-bottom-nav fixed bottom-0 left-0 right-0 flex justify-around items-center px-2 md:px-10 pt-3 pb-[calc(0.9rem+env(safe-area-inset-bottom))] z-[60] backdrop-blur-md border-t shadow-sm">
      {items.filter(i => !i.hidden).map(item => {
        const Icon = ICONS[item.id];
        return (
          <button key={item.id} type="button" data-nav={item.id} onClick={item.onClick}
            aria-label={item.ariaLabel} aria-current={item.current ? 'page' : undefined}
            className="relative flex flex-col items-center justify-center min-w-0 flex-1 gap-1.5 min-h-[44px] transition-colors">
            <span className="app-nav-icon relative" aria-hidden="true">
              <Icon className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
              {!!item.badge && item.badge > 0 && <i className="app-nav-badge">{item.badge > 9 ? '9+' : item.badge}</i>}
            </span>
            <span className="app-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
});
