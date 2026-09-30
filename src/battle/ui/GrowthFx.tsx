/**
 * GrowthFx — 成長システムの「祝い」と「手触り」の部品
 *
 *   Confetti        … 紙吹雪（勝ち・レベルアップ・段位アップで 1 回だけ）
 *   CountUp         … 数字が前の値から今の値へ刻んで進む（レート）
 *   RatingTierBar   … 段位（入門→初級→…→達人）の中での位置と、つぎの段位まで
 *   LoginBonusSheet … ログインボーナスの受け取りシート
 *   ShareButton     … 結果を共有（Web Share API → 無ければクリップボード）
 *
 * ★どれも情報を持つ演出だけ★。祝いは 1 回、動きは 2 秒以内、
 *   prefers-reduced-motion では index.css の 5. で止まる。
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Check, Coins, Flame, Gift, Share2, Sparkles } from 'lucide-react';
import { levelOf, loginBonusFor, ratingTierOf, type GrowthProgress, type LoginBonus } from '../core/growth';
import { ratingTitle } from '../data/battleRanking';
import { AMBER, GOLD, INK, INK_SUB, LINE } from './BattleParts';
import { GrowthAvatar } from './GrowthParts';
import { play, primeAudio } from './feedback';

// ============================================================
// 紙吹雪
// ============================================================

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * 紙吹雪。マウント時に 1 回だけ降って、2 秒後に自分で消える。
 * @param hues 色相（既定：金・琥珀・青・緑）
 */
export function Confetti({ count = 18, hues = [45, 38, 205, 150] }: { count?: number; hues?: number[] }) {
  const [alive, setAlive] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setAlive(false), 2200);
    return () => clearTimeout(t);
  }, []);
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        cx: `${(i / count) * 100 + (i % 3) * 2}vw`,
        dx: `${((i % 5) - 2) * 6}vw`,
        hue: hues[i % hues.length],
        delay: `${(i % 6) * 0.07}s`,
      })),
    [count, hues],
  );
  if (!alive || prefersReducedMotion()) return null;
  return (
    <div className="growth-confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <i
          key={i}
          style={{ '--cx': p.cx, '--dx': p.dx, '--hue': p.hue, '--delay': p.delay } as CSSProperties}
        />
      ))}
    </div>
  );
}

// ============================================================
// 数字のカウントアップ
// ============================================================

/**
 * from → to へ 0.9 秒で刻む。刻みごとに小さな音（tick）を最大 8 回。
 * 差が 0 ならそのまま出す。reduced-motion なら即 to。
 */
export function CountUp({
  from,
  to,
  duration = 900,
  delay = 200,
  tick = true,
  className,
  style,
}: {
  from: number;
  to: number;
  duration?: number;
  delay?: number;
  tick?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const [value, setValue] = useState(from);
  const lastTick = useRef(-1);
  useEffect(() => {
    if (from === to || prefersReducedMotion()) {
      setValue(to);
      return;
    }
    let raf = 0;
    let start = 0;
    const timer = setTimeout(() => {
      const step = (now: number) => {
        if (!start) start = now;
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const v = Math.round(from + (to - from) * eased);
        setValue(v);
        const bucket = Math.floor(t * 8);
        if (tick && bucket !== lastTick.current && t < 1) {
          lastTick.current = bucket;
          play('tick', false);
        }
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [from, to, duration, delay, tick]);
  return (
    <span className={className} style={style}>
      {value}
    </span>
  );
}

// ============================================================
// 段位バー
// ============================================================

/**
 * いまの段位の中でどこにいるか、つぎの段位まであと何点か。
 * 前の値から今の値へ伸びる（結果画面）。段位が上がったら光が走る。
 */
export function RatingTierBar({ before, after }: { before: number; after: number }) {
  const tierNow = ratingTierOf(after);
  const color = ratingTitle(after).color;
  const span = tierNow.next ? tierNow.next - tierNow.min : 200;
  const ratioOf = (r: number) => Math.max(0, Math.min(1, (r - tierNow.min) / span));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 250);
    return () => clearTimeout(t);
  }, []);
  const tierUp = ratingTierOf(before).min < tierNow.min;
  const tierDown = ratingTierOf(before).min > tierNow.min;
  const startRatio = tierUp ? 0 : tierDown ? 1 : ratioOf(before);
  const remain = tierNow.next ? tierNow.next - after : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-black" style={{ color: INK_SUB }}>
        <span style={{ color }}>{tierNow.label}</span>
        {tierNow.next ? (
          <span>
            つぎ：{ratingTierOf(tierNow.next).label} まで あと{' '}
            <span className="tabular-nums" style={{ color: INK }}>
              {remain}
            </span>
          </span>
        ) : (
          <span>最高段位</span>
        )}
      </div>
      <div
        className={`h-2 overflow-hidden rounded-full ${tierUp ? 'growth-shine' : ''}`}
        style={{ background: '#EEE9DD' }}
        role="progressbar"
        aria-valuemin={tierNow.min}
        aria-valuemax={tierNow.next ?? after}
        aria-valuenow={after}
      >
        <div
          className="h-full rounded-full transition-[width] duration-[900ms] ease-out"
          style={{ width: `${(ready ? ratioOf(after) : startRatio) * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ============================================================
// ログインボーナス
// ============================================================

/**
 * 対戦モードを開いたとき、今日はじめてなら出る。
 * 7 日分の並びで「いま何日目」を見せ、タップで閉じる。
 */
export function LoginBonusSheet({
  bonus,
  progress,
  onClose,
}: {
  bonus: LoginBonus;
  progress: GrowthProgress;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const button = dialogRef.current?.querySelector('button');
    button?.focus();
    return () => previous?.focus();
  }, []);
  useEffect(() => {
    play(bonus.milestone ? 'levelup' : 'coin');
  }, [bonus.milestone]);
  const dayInCycle = ((bonus.streak - 1) % 7) + 1;
  const level = levelOf(progress.xp).level;
  return (
    <div
      className="growth-sheet-backdrop fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-3 sm:items-center"
      ref={dialogRef}
      role="dialog"
      onKeyDown={(event) => {
        if (event.key === 'Escape') { event.preventDefault(); onClose(); }
        if (event.key === 'Tab') {
          event.preventDefault();
          dialogRef.current?.querySelector('button')?.focus();
        }
      }}
      aria-modal="true"
      aria-labelledby="login-bonus-title"
      onClick={onClose}
    >
      {bonus.milestone && <Confetti />}
      <div
        className="growth-sheet max-h-[90dvh] overflow-y-auto w-full max-w-sm rounded-3xl border-2 p-5"
        style={{ background: '#FFFDF7', borderColor: `${GOLD}AA`, boxShadow: '0 12px 40px -12px rgba(0,0,0,0.35)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <GrowthAvatar progress={progress} size={56} celebrate />
          <div className="min-w-0 flex-1">
            <p id="login-bonus-title" className="flex items-center gap-1.5 text-base font-black" style={{ color: INK }}>
              <Gift size={18} style={{ color: AMBER }} />
              {bonus.milestone ? '7日連続！ボーナス' : 'きょうのログインボーナス'}
            </p>
            <p className="flex items-center gap-1 text-xs font-bold" style={{ color: INK_SUB }}>
              <Flame size={13} style={{ color: '#E67E22' }} />
              {bonus.streak}日連続 ・ Lv.{level}
            </p>
          </div>
        </div>

        {/* 7日の並び */}
        <ol className="mt-4 grid grid-cols-7 gap-1" aria-label="7日間のボーナス">
          {Array.from({ length: 7 }, (_, i) => i + 1).map((d) => {
            const b = loginBonusFor(d);
            const done = d < dayInCycle;
            const today = d === dayInCycle;
            return (
              <li
                key={d}
                className={`flex flex-col items-center gap-0.5 rounded-xl border py-1.5 ${today ? 'growth-bump' : ''}`}
                style={{
                  borderColor: today ? AMBER : done ? `${AMBER}55` : LINE,
                  background: today ? `${GOLD}33` : done ? `${GOLD}14` : '#FFFFFF',
                  opacity: done ? 0.8 : 1,
                }}
              >
                <span className="text-xs font-black" style={{ color: INK_SUB }}>
                  {d}日
                </span>
                {done ? (
                  <Check size={14} style={{ color: AMBER }} />
                ) : (
                  <Coins size={14} style={{ color: d === 7 ? '#E67E22' : AMBER }} />
                )}
                <span className="text-xs font-black tabular-nums" style={{ color: INK }}>
                  {b.coins}
                </span>
              </li>
            );
          })}
        </ol>

        <div
          className="mt-4 flex items-center justify-center gap-4 rounded-2xl px-3 py-2.5"
          style={{ background: `${GOLD}22`, border: `1px solid ${GOLD}66` }}
        >
          <span className="flex items-center gap-1 text-lg font-black tabular-nums" style={{ color: AMBER }}>
            <Coins size={18} />+{bonus.coins}
          </span>
          <span className="flex items-center gap-1 text-lg font-black tabular-nums" style={{ color: INK }}>
            <Sparkles size={18} style={{ color: AMBER }} />+{bonus.xp} XP
          </span>
        </div>
        <p className="mt-2 text-center text-xs font-bold" style={{ color: INK_SUB }}>
          {bonus.milestone ? 'あしたから また1日目。毎日つづけると7日目が大きい' : `7日目で 50コイン。あと${7 - dayInCycle}日`}
        </p>

        <button
          type="button"
          onClick={() => {
            primeAudio();
            play('tap');
            onClose();
          }}
          className="growth-press mt-4 w-full rounded-2xl border-2 py-3 text-base font-black transition"
          style={{ background: GOLD, color: INK, borderColor: '#E5B93C', boxShadow: '0 3px 0 #D9A72E' }}
        >
          受け取りました・閉じる
        </button>
      </div>
    </div>
  );
}

// ============================================================
// 共有
// ============================================================

/**
 * 結果を共有。navigator.share があればシート、無ければクリップボードにコピー。
 */
export function ShareButton({ text, onShared }: { text: string; onShared?: (how: 'share' | 'copy') => void }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  useEffect(() => {
    if (state === 'idle') return;
    const t = setTimeout(() => setState('idle'), 1800);
    return () => clearTimeout(t);
  }, [state]);
  const run = async () => {
    primeAudio();
    play('tap');
    const url = typeof location !== 'undefined' ? location.origin : '';
    const full = url ? `${text}\n${url}` : text;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ text: full });
        onShared?.('share');
        return;
      }
      await navigator.clipboard.writeText(full);
      setState('copied');
      onShared?.('copy');
    } catch (e) {
      // 共有シートを閉じただけなら何も出さない
      if ((e as { name?: string })?.name !== 'AbortError') setState('failed');
    }
  };
  return (
    <button
      type="button"
      onClick={() => void run()}
      className="growth-press flex w-full items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-black transition"
      style={{ background: '#FFFFFF', color: INK, borderColor: LINE }}
    >
      {state === 'copied' ? <Check size={16} style={{ color: AMBER }} /> : <Share2 size={16} />}
      {state === 'copied' ? 'コピーしました' : state === 'failed' ? '共有できませんでした' : '結果を共有する'}
    </button>
  );
}
