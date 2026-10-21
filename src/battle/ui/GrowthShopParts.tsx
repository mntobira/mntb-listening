/**
 * GrowthShopParts — 持ちもの（称号・バッジ）と目標のカード部品（C-19）。
 * GrowthParts.tsx から移した。中身は1文字も変えていない。GrowthParts.tsx からも再エクスポートしているので、
 * 既存の import { BadgeChip } from './GrowthParts' などはそのまま使える。
 * （仕様書の名前に合わせてこのファイル名にした。ショップの交換画面そのものは GrowthHub / Shop 側にある）
 */
import type { CSSProperties, ReactNode } from 'react';
import { Check, Flag, Lock } from 'lucide-react';
import { badgeById, badgeProgress, badgeTierColor, equippedTitleLabel, nearestBadgeGoal, nextBadgeGoals, nextLevelUnlock, type GrowthProgress } from '../core/growth';
import { ratingTitle } from '../data/battleRanking';
import { AMBER, GOLD, INK, INK_SUB, LINE } from './BattleParts';

/** 希少度の日本語（★の数の代わりに言葉で） */
const TIER_LABEL: Record<1 | 2 | 3, string> = { 1: 'ブロンズ', 2: 'シルバー', 3: 'ゴールド' };

// ============================================================
// 称号（バッジ称号 or レート称号）
// ============================================================

export function TitleChip({ progress, rating, size = 'sm' }: { progress: GrowthProgress; rating: number; size?: 'sm' | 'md' }) {
  const custom = equippedTitleLabel(progress);
  const cls = size === 'md' ? 'px-2.5 py-1 text-[12px]' : 'px-2 py-0.5 text-xs';
  if (custom) {
    const b = badgeById(progress.equipped.title);
    const color = badgeTierColor(b?.tier ?? 1);
    return (
      <span className={`inline-flex items-center gap-1 rounded-full font-black ${cls}`} style={{ background: `${color}1F`, color, border: `1px solid ${color}55` }}>
        <span aria-hidden>{b?.emoji}</span>
        {custom}
      </span>
    );
  }
  const t = ratingTitle(rating);
  return (
    <span className={`rounded-full font-black ${cls}`} style={{ background: `${t.color}26`, color: t.color }}>
      {t.label}
    </span>
  );
}

// ============================================================
// バッジ
// ============================================================

export function BadgeChip({
  id,
  earned = true,
  onClick,
  selected,
  progress,
  delay,
}: {
  id: string;
  earned?: boolean;
  onClick?: () => void;
  selected?: boolean;
  /** 渡すと未獲得バッジに「あと n」と進捗バーを出す */
  progress?: GrowthProgress;
  /** 順に現れる演出の遅延（秒） */
  delay?: number;
  /** ★@types/react が無いので、一覧で使うために key を props として受ける★（BattleWeakness と同じ対処） */
  key?: string;
}) {
  const b = badgeById(id);
  if (!b) return null;
  const color = badgeTierColor(b.tier);
  const goal = !earned && progress ? badgeProgress(progress, id) : null;
  const body = (
    <>
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg leading-none"
        aria-hidden
        style={{
          background: earned ? `${color}1A` : '#F4F1EA',
          filter: earned ? undefined : 'grayscale(1)',
          opacity: earned ? 1 : 0.55,
        }}
      >
        {b.emoji}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[12px] font-black" style={{ color: earned ? INK : INK_SUB }}>
            {b.label}
          </span>
          <span className="shrink-0 rounded-full px-1.5 py-[1px] text-xs font-black" style={{ background: `${color}1A`, color }}>
            {TIER_LABEL[b.tier]}
          </span>
        </span>
        <span className="block truncate text-xs font-bold" style={{ color: INK_SUB }}>
          {b.desc}
        </span>
        {goal && goal.goal > 1 && (
          <span className="mt-1 flex items-center gap-1.5">
            <span className="h-1 flex-1 overflow-hidden rounded-full" style={{ background: '#E8E2D6' }}>
              <span className="block h-full rounded-full" style={{ width: `${goal.ratio * 100}%`, background: `${color}AA` }} />
            </span>
            <span className="shrink-0 text-xs font-black tabular-nums" style={{ color: INK_SUB }}>
              {goal.current}/{goal.goal}
            </span>
          </span>
        )}
      </span>
      {!earned && !goal && <Lock size={12} style={{ color: INK_SUB }} />}
      {earned && selected && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: GOLD, color: INK }}>
          <Check size={13} />
        </span>
      )}
    </>
  );
  const style: CSSProperties = {
    borderColor: earned ? (selected ? AMBER : `${color}55`) : LINE,
    background: earned ? `${color}0C` : '#FFFFFF',
    ...(delay !== undefined ? ({ '--reveal-delay': `${delay}s` } as CSSProperties) : {}),
  };
  const cls = `flex min-h-12 w-full items-center gap-2.5 rounded-2xl border-2 px-2.5 py-1.5 text-left ${delay !== undefined ? 'growth-reveal' : ''}`;
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${cls} transition active:scale-[0.98]`} style={style} aria-pressed={selected}>
        {body}
      </button>
    );
  }
  return (
    <div className={cls} style={style}>
      {body}
    </div>
  );
}

// ============================================================
// つぎの目標（バッジまでの残り・つぎの解放）
// ============================================================

/**
 * 「つぎの目標」カード。
 *
 * ★なぜ入口とプロフィールに置くか★
 * 経験値もレベルも「増える」だけでは目標にならない。
 * 「あと2勝で『十勝』」「Lv.5 で『勉強中』のポーズ」のように
 * 残りが見えると、次の1試合をする理由になる（エグゼクティブサマリ §2 成長要素）。
 */
export function NextGoals({ progress, max = 3, compact = false }: { progress: GrowthProgress; max?: number; compact?: boolean }) {
  const goals = nextBadgeGoals(progress, max);
  const unlock = nextLevelUnlock(progress);
  if (goals.length === 0 && !unlock) return null;
  return (
    <section className="rounded-2xl border px-3 py-2.5" style={{ borderColor: LINE, background: '#FAF8F3' }} aria-label="つぎの目標">
      <h3 className="mb-1.5 flex items-center gap-1 text-xs font-black" style={{ color: INK_SUB }}>
        <Flag size={11} style={{ color: AMBER }} />
        つぎの目標
      </h3>
      <ul className="grid gap-1.5">
        {goals.map((g) => {
          const b = badgeById(g.id);
          if (!b) return null;
          const color = badgeTierColor(b.tier);
          return (
            <li key={g.id} className="flex items-center gap-2">
              <span className="shrink-0 text-sm leading-none" aria-hidden>{b.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className={`truncate ${compact ? 'text-xs' : 'text-xs'} font-black`} style={{ color: INK }}>
                    {b.label}
                    <span className="ml-1 font-bold" style={{ color: INK_SUB }}>{b.desc}</span>
                  </span>
                  <span className="shrink-0 text-xs font-black tabular-nums" style={{ color }}>
                    あと {g.remain}
                  </span>
                </span>
                <span className="mt-0.5 block h-1 w-full overflow-hidden rounded-full" style={{ background: '#E8E2D6' }}>
                  <span className="block h-full rounded-full" style={{ width: `${g.ratio * 100}%`, background: color }} />
                </span>
              </span>
            </li>
          );
        })}
        {unlock && (
          <li className="flex items-center gap-2 pt-0.5 text-xs font-bold" style={{ color: INK_SUB }}>
            <Lock size={11} className="shrink-0" />
            <span>
              Lv.{unlock.level} で とびら君の「{unlock.item.label}」が解放
            </span>
          </li>
        )}
      </ul>
    </section>
  );
}

// ============================================================
// 小さな数字カード
// ============================================================

export function StatCard({ label, value, sub, color = INK }: { label: string; value: ReactNode; sub?: string; color?: string }) {
  return (
    <div className="rounded-2xl px-2 py-2.5 text-center" style={{ background: '#FFFFFF', border: `1px solid ${LINE}` }}>
      <p className="text-xs font-black" style={{ color: INK_SUB }}>
        {label}
      </p>
      <p className="text-xl font-black tabular-nums leading-tight" style={{ color }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs font-bold" style={{ color: INK_SUB }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ============================================================
// あと少し（結果画面の1行）
// ============================================================

/** 結果画面に置く「称号『○○』まで あと N」の1行。近い目標が無ければ何も出さない。 */
export function NextBadgeHint({ progress, prefer, className = '' }: { progress: GrowthProgress; prefer?: string; className?: string }) {
  const g = nearestBadgeGoal(progress, prefer);
  const b = g ? badgeById(g.id) : undefined;
  if (!g || !b) return null;
  return (
    <p className={`flex items-center justify-center gap-1 text-xs font-bold ${className}`} style={{ color: INK_SUB }} data-next-badge-hint role="status">
      <Flag size={13} aria-hidden="true" className="shrink-0" style={{ color: AMBER }} />
      <span className="min-w-0 truncate">称号「<b style={{ color: INK }}>{b.label}</b>」まで <b style={{ color: AMBER }}>あと {g.remain}</b>（{b.desc}）</span>
    </p>
  );
}
