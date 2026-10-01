/**
 * マナトビ 共通UI部品（2026-10-01 C20）。見た目は styles/system.css・styles/tokens.css。
 *
 *   新しい画面・新しい教科を足すときは、まずここの部品で組む。
 *   画面ごとの CSS は「その機能の世界観」（色の差し色・イラスト）だけにする。
 *
 *   AppHeader / BottomNavigation（./BottomNavigation）/ PrimaryButton / SecondaryButton / Card /
 *   SectionHeader / Tabs / ListItem・ListGroup / Dialog / Badge / RarityBadge / ItemCard / Loading / Toast
 */
import React, { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
export { BottomNavigation, type BottomNavItem, type BottomNavId } from './BottomNavigation';

type Rarity = 'N' | 'R' | 'SR' | 'UR';
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/** 画面の見出し：［戻る］＋ kicker（英字の小見出し）・タイトル・補足 ＋ 右の操作 */
export function AppHeader({ title, kicker, subtitle, backLabel, onBack, actions, as = 'h1', className }: {
  title: React.ReactNode; kicker?: string; subtitle?: React.ReactNode; backLabel?: string; onBack?: () => void;
  actions?: React.ReactNode; as?: 'h1' | 'h2'; className?: string;
}) {
  const H = as;
  return (
    <header className={cx('mt-app-header', className)}>
      {onBack && <BackButton label={backLabel ?? '戻る'} onClick={onBack} />}
      <div className="mt-app-header-title">
        {kicker && <span className="mt-kicker">{kicker}</span>}
        <H>{title}</H>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="mt-app-header-actions">{actions}</div>}
    </header>
  );
}
export function BackButton({ label, onClick, className }: { label: string; onClick: () => void; className?: string }) {
  return <button type="button" className={cx('mt-back', className)} onClick={onClick} aria-label={`${label}に戻る`}><ChevronLeft size={18} aria-hidden="true" /><span>{label}</span></button>;
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { block?: boolean; size?: 'md' | 'lg'; icon?: React.ReactNode };
function Btn({ variant, block, size = 'md', icon, className, children, type = 'button', ...rest }: BtnProps & { variant: string }) {
  return <button type={type} className={cx('mt-btn', `mt-btn-${variant}`, block && 'mt-btn-block', size === 'lg' && 'mt-btn-lg', className)} {...rest}>{icon}{children}</button>;
}
/** 主ボタン（1画面に1つ）。tone="gold" はガチャ・ごほうび系の主ボタン */
export function PrimaryButton({ tone, ...p }: BtnProps & { tone?: 'brand' | 'gold' | 'accent' }) {
  return <Btn variant={tone === 'gold' ? 'gold' : tone === 'accent' ? 'accent' : 'primary'} {...p} />;
}
export function SecondaryButton(p: BtnProps) { return <Btn variant="secondary" {...p} />; }

export function Card({ tone, as: As = 'section', className, children, ...rest }: React.HTMLAttributes<HTMLElement> & { tone?: 'gold' | 'sky' | 'lilac' | 'plain'; as?: 'section' | 'div' | 'article' }) {
  return <As className={cx('mt-card', className)} data-tone={tone} {...rest}>{children}</As>;
}

export function SectionHeader({ title, note, aside, size = 'md', as: H = 'h2', id }: {
  title: React.ReactNode; note?: React.ReactNode; aside?: React.ReactNode; size?: 'md' | 'sm'; as?: 'h2' | 'h3'; id?: string;
}) {
  return <div className="mt-section-header" data-size={size}><H id={id}>{title}</H>{note && <small>{note}</small>}{aside && <span className="mt-section-aside">{aside}</span>}</div>;
}

/** タブ（切り替え）。aria-pressed / aria-current のどちらでも見た目は同じ */
export function Tabs<T extends string>({ items, value, onChange, label, mode = 'pressed', className }: {
  items: { id: T; label: React.ReactNode; icon?: React.ReactNode; disabled?: boolean }[];
  value: T; onChange: (id: T) => void; label: string; mode?: 'pressed' | 'current'; className?: string;
}) {
  return <div className={cx('mt-tabs', className)} role="group" aria-label={label}>
    {items.map(it => <button key={it.id} type="button" disabled={it.disabled} onClick={() => onChange(it.id)}
      aria-pressed={mode === 'pressed' ? value === it.id : undefined} aria-current={mode === 'current' && value === it.id ? 'page' : undefined}>{it.icon}{it.label}</button>)}
  </div>;
}

/** 設定などの一覧の行。onClick / href のどちらか。end に右端（値・矢印）を出す */
export function ListItem({ icon, title, sub, end, onClick, href, tone, disabled, chevron = !!(onClick || href), external }: {
  icon?: React.ReactNode; title: React.ReactNode; sub?: React.ReactNode; end?: React.ReactNode; onClick?: () => void; href?: string;
  tone?: 'danger'; disabled?: boolean; chevron?: boolean; external?: boolean;
}) {
  const inner = <>
    {icon && <span className="mt-list-icon" aria-hidden="true">{icon}</span>}
    <span className="mt-list-text"><span>{title}</span>{sub && <small>{sub}</small>}</span>
    {(end || chevron) && <span className="mt-list-end">{end}{chevron && <ChevronRight size={16} aria-hidden="true" />}</span>}
  </>;
  if (href) return <a className="mt-list-item" href={href} data-tone={tone} target={external ? '_blank' : undefined} rel={external ? 'noopener' : undefined}>{inner}</a>;
  if (onClick) return <button type="button" className="mt-list-item" data-tone={tone} onClick={onClick} disabled={disabled}>{inner}</button>;
  return <div className="mt-list-item" data-tone={tone} style={{ cursor: 'default' }}>{inner}</div>;
}
export function ListGroup({ title, note, children, id }: { title?: string; note?: React.ReactNode; children: React.ReactNode; id?: string }) {
  return <section className="mt-list-group" aria-labelledby={title ? id : undefined}>
    {title && <SectionHeader title={title} size="sm" as="h3" id={id} note={note} />}
    <div className="mt-list">{children}</div>
  </section>;
}

export function Badge({ tone, children }: { tone?: 'new' | 'gold' | 'muted'; children: React.ReactNode }) {
  return <span className="mt-badge" data-tone={tone}>{children}</span>;
}
const RARITY_NAME: Record<Rarity, string> = { UR: 'ウルトラレア', SR: 'スーパーレア', R: 'レア', N: 'ノーマル' };
/** レア度の札。N→R→SR→UR で色・枠の太さ・装飾（✦・王冠）が段階的に増える */
export function RarityBadge({ rarity, size, label }: { rarity: Rarity; size?: 'lg' | 'xl'; label?: string }) {
  return <span className="mt-rarity" data-rarity={rarity} data-size={size} aria-label={label ?? RARITY_NAME[rarity]}>{rarity}</span>;
}

/** アイテムの札（画像＋名前＋補足）。ガチャの注目・結果・コレクションで共通 */
export function ItemCard({ rarity, art, title, sub, isNew, owned, children, className, as: As = 'div', ...rest }: React.HTMLAttributes<HTMLElement> & {
  rarity: Rarity; art: React.ReactNode; title: React.ReactNode; sub?: React.ReactNode; isNew?: boolean; owned?: boolean; as?: 'div' | 'li';
}) {
  return <As className={cx('mt-item-card', className)} data-rarity={rarity} data-owned={owned === undefined ? undefined : String(owned)} {...rest}>
    <span className="mt-item-tags"><RarityBadge rarity={rarity} />{isNew && <Badge tone="new">NEW</Badge>}</span>
    <span className="mt-item-art">{art}</span>
    <strong>{title}</strong>
    {sub && <small>{sub}</small>}
    {children}
  </As>;
}

/** モーダル（ネイティブ dialog）。open が true の間だけ表示 */
export function Dialog({ open, onClose, title, children, className }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const d = ref.current; if (!d) return; if (open && !d.open) d.showModal(); if (!open && d.open) d.close(); }, [open]);
  return <dialog ref={ref} className={cx('mt-dialog', className)} onClose={onClose} aria-label={title}>
    <header><h2>{title}</h2><SecondaryButton onClick={onClose} autoFocus>閉じる</SecondaryButton></header>
    <div className="mt-dialog-body">{children}</div>
  </dialog>;
}
export const Modal = Dialog;

export function Loading({ label = '読み込み中…' }: { label?: string }) {
  return <div className="mt-loading" role="status"><i aria-hidden="true" />{label}</div>;
}
export function Toast({ message }: { message: string | null }) {
  return message ? <div className="mt-toast" role="status">{message}</div> : null;
}
