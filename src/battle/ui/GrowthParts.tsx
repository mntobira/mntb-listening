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
import { Check, ChevronRight, Coins, Flag, Sparkles } from 'lucide-react';
import { TobiraAccessories } from './TobiraAccessories';
import { equippedFrameColor, equippedFramePattern, equippedPoseSrc, equippedAccessory, levelOf, missionById, missionDestination, MISSION_DESTINATION_LABEL, type MissionDestination, type GrowthProgress } from '../core/growth';
import { AMBER, GOLD, INK, INK_SUB, LINE } from './BattleParts';
export { TitleChip, BadgeChip, NextGoals, StatCard, NextBadgeHint } from './GrowthShopParts';

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
  const badgeSize = size >= 56 ? 'text-xs px-1.5' : 'text-xs px-1'; // 小さいアバター（56px未満）だけは枠に収めるため例外
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
  onGo,
}: {
  id: string;
  progress: number;
  claimed: boolean;
  onClaim?: () => void;
  /** 未達成のとき「○○へ」ボタンで該当の画面へ（2026-10-05） */
  onGo?: (to: MissionDestination) => void;
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
      ) : state === 'going' && onGo ? (
        <button
          type="button"
          onClick={() => onGo(missionDestination(m.kind))}
          data-mission-go={missionDestination(m.kind)}
          aria-label={`${m.label}：${MISSION_DESTINATION_LABEL[missionDestination(m.kind)]}`}
          className="inline-flex min-h-11 shrink-0 items-center gap-0.5 rounded-xl border-2 px-2.5 text-[13px] font-black transition active:translate-y-[1px]"
          style={{ background: '#FFFFFF', borderColor: LINE, color: INK }}
        >
          {MISSION_DESTINATION_LABEL[missionDestination(m.kind)]}<ChevronRight size={14} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
