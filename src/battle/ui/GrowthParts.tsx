/**
 * ===================================================================
 * GrowthParts — 成長表示の共通部品（レベル・扉くん・称号・バッジ・ミッション・目標）
 * ===================================================================
 *
 * ★色は BattleParts の4色＋バッジの希少度色だけを使う★
 * 対戦モードは「同じノートの1ページ」なので、地色は変えない。
 *
 * ★動きは「情報を持つもの」だけ★（src/index.css 4b）
 *   レベルバーは「前の値 → 今の値」へ伸びる。増えた量を長さで言い直すため、
 *   初回描画で 0 から伸ばすのではなく、★前の値から★ 伸ばす。
 */

import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Check, Coins, Flag, Lock, Sparkles } from 'lucide-react';
import { TobiraAccessories } from './TobiraAccessories';
import {
  badgeById,
  badgeProgress,
  badgeTierColor,
  equippedFrameColor,
  equippedFramePattern,
  equippedPoseSrc,
  equippedAccessory,
  equippedTitleLabel,
  levelOf,
  missionById,
  nearestBadgeGoal,
  nextBadgeGoals,
  nextLevelUnlock,
  type GrowthProgress,
} from '../core/growth';
import { ratingTitle } from '../data/battleRanking';
import { AMBER, GOLD, INK, INK_SUB, LINE } from './BattleParts';

/** 希少度の日本語（★の数の代わりに言葉で） */
const TIER_LABEL: Record<1 | 2 | 3, string> = { 1: 'ブロンズ', 2: 'シルバー', 3: 'ゴールド' };

// ============================================================
// 扉くん（装備を反映した姿）
// ============================================================

/**
 * 装備（ポーズ・枠）を反映した扉くん。
 *
 * ★既存の DoorMascot（豆知識の吹き出し付き）とは別物★
 * あちらは学習画面の相棒。ここは「自分の分身」を見せる部品で、
 * 相手やフレンドの扉くんも同じ部品で描く。
 */
export function GrowthAvatar({
  progress,
  size = 64,
  showLevel = true,
  celebrate = false,
}: {
  progress: GrowthProgress;
  size?: number;
  showLevel?: boolean;
  /** レベルアップ直後などに1回だけ跳ねさせる */
  celebrate?: boolean;
}) {
  const frame = equippedFrameColor(progress);
  const level = levelOf(progress.xp).level;
  const badgeSize = size >= 56 ? 'text-xs px-1.5' : 'text-[10px] px-1'; // 小さいアバター（56px未満）だけは枠に収めるため例外
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="flex h-full w-full items-end justify-center overflow-hidden rounded-2xl border-[3px]"
        data-frame-pattern={equippedFramePattern(progress)}
        style={{
          borderColor: frame,
          background: `linear-gradient(180deg, ${frame}14 0%, ${frame}30 100%)`,
          boxShadow: `inset 0 -6px 12px -8px ${frame}AA`,
        }}
      >
        <span className="tobira-with-parts relative flex w-[94%] items-end justify-center" style={{ height: equippedAccessory(progress, 'hat') ? '80%' : '94%' }}>
          <img
            src={equippedPoseSrc(progress)}
            alt="とびら君"
            draggable={false}
            className="h-full w-full object-contain object-bottom drop-shadow select-none"
          />
          <TobiraAccessories progress={progress} align="bottom" />
        </span>
      </div>
      {showLevel && (
        <span
          className={`absolute -bottom-1.5 -right-1.5 rounded-full border-2 font-black tabular-nums ${badgeSize} ${celebrate ? 'growth-hop' : ''}`}
          style={{ background: GOLD, borderColor: '#FFFFFF', color: INK, boxShadow: '0 1px 0 #D9A72E' }}
        >
          Lv.{level}
        </span>
      )}
    </div>
  );
}

// ============================================================
// レベルバー
// ============================================================

/**
 * レベルバー。
 *
 * @param xp        いまの累積経験値
 * @param gained    この試合で増えたぶん（渡すと「前の値 → 今の値」へ伸びる）
 * @param leveledUp レベルが上がった（バーを一度満タンまで伸ばしてから新しい段を見せる）
 */
export function LevelBar({
  xp,
  gained,
  leveledUp = false,
  compact = false,
}: {
  xp: number;
  gained?: number;
  leveledUp?: boolean;
  compact?: boolean;
}) {
  const info = levelOf(xp);
  const before = gained ? levelOf(Math.max(0, xp - gained)) : null;
  /**
   * 表示する幅（0〜1）。
   *   段が変わっていない … 前の割合 → 今の割合
   *   段が変わった       … 前の割合 → 100% → （段を切り替えて）0 → 今の割合
   */
  const [phase, setPhase] = useState<'before' | 'full' | 'reset' | 'now'>(gained ? 'before' : 'now');
  useEffect(() => {
    if (!gained || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setPhase('now'); return; }
    setPhase('before');
    const timers: number[] = [];
    if (leveledUp && before) {
      timers.push(window.setTimeout(() => setPhase('full'), 60));
      timers.push(window.setTimeout(() => setPhase('reset'), 760));
      timers.push(window.setTimeout(() => setPhase('now'), 820));
    } else {
      timers.push(window.setTimeout(() => setPhase('now'), 60));
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [gained, leveledUp, xp]);

  const ratio =
    phase === 'before' && before ? before.ratio
    : phase === 'full' ? 1
    : phase === 'reset' ? 0
    : info.ratio;
  const shownLevel = phase === 'before' || phase === 'full' ? (before?.level ?? info.level) : info.level;
  const noTransition = phase === 'reset';

  return (
    <div>
      <div
        className={`mb-1 flex items-baseline justify-between ${compact ? 'text-xs' : 'text-xs'} font-bold`}
        style={{ color: INK_SUB }}
      >
        <span className="flex items-baseline gap-1.5">
          <span className="font-black tabular-nums" style={{ color: INK }}>
            Lv.{shownLevel}
          </span>
          {gained !== undefined && gained > 0 && (
            <span className="growth-bump inline-block tabular-nums font-black" style={{ color: AMBER }}>
              +{gained} XP
            </span>
          )}
        </span>
        <span className="tabular-nums">
          {info.span === 0 ? '最大レベル' : `つぎまで ${(info.span - info.into).toLocaleString()} XP`}
        </span>
      </div>
      <div
        className={`${compact ? 'h-2' : 'h-2.5'} w-full overflow-hidden rounded-full`}
        style={{ background: '#E8E2D6', boxShadow: 'inset 0 1px 2px rgba(44,62,80,0.08)' }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(info.ratio * 100)}
        aria-label={`レベル${info.level}の進捗`}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${ratio * 100}%`,
            background: `linear-gradient(90deg, ${AMBER} 0%, ${GOLD} 100%)`,
            transition: noTransition ? 'none' : 'width 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </div>
    </div>
  );
}

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
// ミッション1行
// ============================================================

/**
 * コインが「うけとる」ボタンから画面上（マナコインの残高）へ飛ぶ（2026-10-01 D）。
 * 見た目だけ。報酬の加算は claimMissionReward が行う。動きを減らす設定では何もしない。
 */
export function flyCoins(from: HTMLElement, coins: number) {
  if (typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const r = from.getBoundingClientRect();
  const target = document.querySelector('[data-mana-coins], .gacha-balance, [data-coin-target]')?.getBoundingClientRect();
  const tx = target ? target.left + target.width / 2 : window.innerWidth - 40;
  const ty = target ? target.top + target.height / 2 : 24;
  const n = Math.min(8, Math.max(4, Math.round(coins / 8)));
  for (let i = 0; i < n; i += 1) {
    const c = document.createElement('i');
    c.className = 'mission-coin-fly';
    const x = r.left + r.width / 2 - 11 + (i - n / 2) * 6; const y = r.top + r.height / 2 - 11;
    c.style.left = `${x}px`; c.style.top = `${y}px`;
    c.style.setProperty('--dx', `${tx - x - 11}px`); c.style.setProperty('--dy', `${ty - y - 11}px`);
    c.style.animationDelay = `${i * 55}ms`;
    document.body.appendChild(c);
    window.setTimeout(() => c.remove(), 900 + i * 55);
  }
}

export function MissionRow({
  id,
  progress,
  claimed,
  onClaim,
  claiming,
  justClaimed = false,
}: {
  id: string;
  progress: number;
  claimed: boolean;
  onClaim?: () => void;
  claiming?: boolean;
  /** 直前に受け取った行（報酬を強調する） */
  justClaimed?: boolean;
  key?: string;
}) {
  const m = missionById(id);
  if (!m) return null;
  const done = progress >= m.goal;
  const ratio = Math.min(1, progress / m.goal);
  const state = claimed ? 'claimed' : done ? 'ready' : 'going';
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5 ${justClaimed ? 'mission-claimed-fx' : ''} ${state === 'ready' ? 'mission-ready' : ''}`}
      data-mission-state={state}
      style={{
        borderColor: state === 'ready' ? `${GOLD}CC` : LINE,
        background: state === 'ready' ? `${GOLD}16` : '#FFFFFF',
        opacity: state === 'claimed' ? 0.75 : 1,
        boxShadow: state === 'ready' ? `0 2px 0 ${GOLD}66` : undefined,
      }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{
          background: state === 'claimed' ? '#EEF1F3' : state === 'ready' ? GOLD : `${GOLD}2E`,
          color: state === 'claimed' ? INK_SUB : INK,
        }}
        aria-hidden
      >
        {state === 'claimed' ? <Check size={16} /> : <Flag size={16} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center justify-between gap-2 text-[13px] font-black" style={{ color: claimed ? INK_SUB : INK }}>
          <span className={claimed ? 'line-through' : ''}>{m.label}</span>
          <span className="shrink-0 tabular-nums text-xs font-bold" style={{ color: done ? AMBER : INK_SUB }}>
            {Math.min(progress, m.goal)}/{m.goal}
          </span>
        </p>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full" style={{ background: '#E8E2D6' }}>
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${ratio * 100}%`, background: claimed ? '#C9CED4' : `linear-gradient(90deg, ${AMBER}, ${GOLD})` }}
          />
        </div>
        <p className={`mt-1 flex items-center gap-2 text-xs font-bold ${justClaimed ? 'growth-bump' : ''}`} style={{ color: justClaimed ? AMBER : INK_SUB }}>
          <span className="inline-flex items-center gap-0.5">
            <Sparkles size={10} /> +{m.rewardXp} XP
          </span>
          <span className="inline-flex items-center gap-0.5">
            <Coins size={10} /> +{m.rewardCoins}
          </span>
          {justClaimed && <span>うけとりました</span>}
        </p>
      </div>
      {state === 'claimed' ? null : state === 'ready' && onClaim ? (
        <button
          type="button"
          onClick={(e) => { flyCoins(e.currentTarget, m.rewardCoins); onClaim(); }}
          disabled={claiming}
          className="min-h-11 shrink-0 rounded-xl border-2 px-3 text-[13px] font-black transition active:translate-y-[1px] disabled:opacity-50"
          style={{ background: GOLD, borderColor: '#E5B93C', color: INK, boxShadow: '0 2px 0 #D9A72E' }}
        >
          {claiming ? '…' : 'うけとる'}
        </button>
      ) : null}
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
