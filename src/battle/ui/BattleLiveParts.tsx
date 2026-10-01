/**
 * ===================================================================
 * BattleLiveParts — 「相手の存在を感じる」ための画面部品
 * ===================================================================
 *
 * ■ ここに置くもの
 *   LiveScoreboard … 上部の得点表（🔵自分／🔴相手、数字が滑らかに増える、相手の状態）
 *   LiveFeed       … 小さな実況ログ（下から上へ流れて消える）
 *   LiveToast      … 「CORRECT!」「COMBO ×3」「逆転！」の短い演出
 *   Countdown      … 3 → 2 → 1 → START!
 *   FinalBanner    … 「FINAL QUESTION」
 *
 * ■ 見た目の方針
 *   既存の対戦画面（BattleParts）と同じ材料（アイボリー地・琥珀・ゴールドは面だけ）。
 *   自分＝青（#2E86C1、既存のナビの色）／相手＝赤（#C0392B、既存の WRONG）で
 *   一目で左右を区別する。
 *
 * ■ 邪魔をしない
 *   実況は最大3行・3.2秒で消える。トーストは 1.4 秒で消え、
 *   ★pointer-events: none★ で選択肢のタップを遮らない。
 *   prefers-reduced-motion では動きを止める（index.css）。
 */

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Check, Flame, Hourglass, Pencil, FileText, X } from 'lucide-react';

import { maskNickname } from '../../utils/nicknamePrivacy';
import {
  formatScore,
  SCORE_TWEEN_MS,
  tweenScore,
  type FeedEntry,
  type OpponentStatus,
} from '../core/battleLive';
import type { LiveToast as LiveToastData } from '../hooks/useBattleLive';
import { INK, INK_SUB, LINE, WRONG } from './BattleParts';

/** 自分の色（既存の下ナビの選択色） */
export const ME_BLUE = '#2E86C1';
/** 相手の色（既存の WRONG と同じ赤） */
export const OPP_RED = WRONG;
/** 正解の緑（BattleQuestionView の CORRECT と同じ） */
const GREEN = '#1E7D46';

// ============================================================
// 数字が滑らかに増える
// ============================================================

/**
 * 目標値が変わるたびに、前の表示値から目標へ ease-out で近づける。
 * 増えた瞬間に「+120」を小さく浮かせる。
 */
export function useTweenedScore(target: number): { shown: number; delta: number | null } {
  const [shown, setShown] = useState(target);
  const [delta, setDelta] = useState<number | null>(null);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const diff = target - from;
    setDelta(diff);
    const startedAt = performance.now();
    const tick = (now: number) => {
      const v = tweenScore(from, target, now - startedAt, SCORE_TWEEN_MS);
      setShown(v);
      if (v !== target) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
        rafRef.current = null;
      }
    };
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    const clear = window.setTimeout(() => setDelta(null), SCORE_TWEEN_MS + 500);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      window.clearTimeout(clear);
      // 途中で目標が変わったら、いまの表示値から続ける
      fromRef.current = shown;
    };
    // shown は「途中で切り替わったときの出発点」にだけ使う
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return { shown, delta };
}

// ============================================================
// 得点表
// ============================================================

export function LiveScoreboard({
  meNickname,
  opponentNickname,
  maskOpponent,
  myScore,
  opponentScore,
  myAnswered,
  myStreak,
  opponent,
  lead,
  compactStatus = false,
}: {
  meNickname: string;
  opponentNickname: string;
  maskOpponent: boolean;
  /** 確定した点（見せてよい範囲の合計） */
  myScore: number;
  opponentScore: number;
  myAnswered: boolean;
  myStreak: number;
  opponent: OpponentStatus;
  lead: 'me' | 'opponent' | 'tie';
  compactStatus?: boolean;
}) {
  const me = useTweenedScore(myScore);
  const op = useTweenedScore(opponentScore);
  const oppName = maskOpponent ? maskNickname(opponentNickname) : opponentNickname;

  return (
    <section
      id="battle-live-scoreboard"
      className="mb-2 rounded-2xl border-2 px-3 py-2"
      style={{ borderColor: LINE, background: '#FFFFFF' }}
      aria-live="polite"
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {/* 自分 */}
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-xs font-black" style={{ color: ME_BLUE }}>
            <span aria-hidden>🔵</span>
            <span className="truncate">あなた</span>
            {lead === 'me' && <LeadTag color={ME_BLUE} />}
          </p>
          <p className="relative flex items-baseline gap-1">
            <strong className="text-2xl font-black tabular-nums leading-none" style={{ color: INK }}>
              {formatScore(me.shown)}
            </strong>
            <span className="text-xs font-bold" style={{ color: INK_SUB }}>pt</span>
            {me.delta != null && me.delta !== 0 && (
              <span
                className="battle-live-delta absolute -top-3 left-0 text-xs font-black tabular-nums"
                style={{ color: me.delta > 0 ? GREEN : WRONG }}
              >
                {me.delta > 0 ? `+${me.delta}` : me.delta}
              </span>
            )}
          </p>
          <p className="mt-0.5 flex h-4 items-center gap-1 text-xs font-bold" style={{ color: INK_SUB }}>
            {myStreak >= 2 ? (
              <span className="flex items-center gap-0.5" style={{ color: '#E67E22' }}>
                <Flame size={11} /> {myStreak}連続
              </span>
            ) : myAnswered ? (
              <span className="flex items-center gap-0.5" style={{ color: GREEN }}>
                <Check size={11} /> 回答ずみ
              </span>
            ) : (
              <span className="flex items-center gap-0.5">
                <Pencil size={11} /> 解答中
              </span>
            )}
          </p>
        </div>

        {/* VS */}
        <span
          className="battle-vs-pulse rounded-md px-1.5 py-0.5 text-xs font-black"
          style={{ background: '#F4D03F', color: INK }}
        >
          VS
        </span>

        {/* 相手 */}
        <div className="min-w-0 text-right">
          <p className="flex items-center justify-end gap-1 text-xs font-black" style={{ color: OPP_RED }}>
            {lead === 'opponent' && <LeadTag color={OPP_RED} />}
            <span className="truncate">{oppName}</span>
            <span aria-hidden>🔴</span>
          </p>
          <p className="relative flex items-baseline justify-end gap-1">
            {op.delta != null && op.delta !== 0 && (
              <span
                className="battle-live-delta absolute -top-3 right-0 text-xs font-black tabular-nums"
                style={{ color: op.delta > 0 ? OPP_RED : INK_SUB }}
              >
                {op.delta > 0 ? `+${op.delta}` : op.delta}
              </span>
            )}
            <strong className="text-2xl font-black tabular-nums leading-none" style={{ color: INK }}>
              {formatScore(op.shown)}
            </strong>
            <span className="text-xs font-bold" style={{ color: INK_SUB }}>pt</span>
          </p>
          <p className="mt-0.5 flex h-4 min-w-0 items-center justify-end gap-1 overflow-hidden whitespace-nowrap text-xs font-bold">
            <OpponentActivityLabel status={opponent} compact={compactStatus} />
          </p>
        </div>
      </div>
    </section>
  );
}

function LeadTag({ color }: { color: string }) {
  return (
    <span
      className="rounded-full px-1.5 py-px text-xs font-black leading-none"
      style={{ background: `${color}1A`, color }}
    >
      LEAD
    </span>
  );
}

/**
 * 相手の状態。★何を選んだかは絶対に出さない★（OpponentStatus が持っていない）。
 * 正誤は reveal 後にしか 'correct' / 'wrong' にならない（core/battleLive）。
 */
export function OpponentActivityLabel({ status, compact }: { status: OpponentStatus; compact?: boolean }) {
  const n = status.index + 1;
  if (status.activity === 'offline') {
    return (
      <span className="flex items-center gap-0.5" style={{ color: INK_SUB }}>
        <Hourglass size={11} /> 通信待ち（相手の状態が届いていません）
      </span>
    );
  }
  if (status.activity === 'thinking') {
    return (
      <span className="flex items-center gap-0.5" style={{ color: INK_SUB }}>
        <Hourglass size={11} className="animate-pulse" />
        {compact ? `第${n}問` : <>第{n}問<span className="bl-long">を考え中</span></>}
        <span className="battle-dot" style={{ '--dot-delay': '0s' } as CSSProperties}>.</span>
        <span className="battle-dot" style={{ '--dot-delay': '0.2s' } as CSSProperties}>.</span>
        <span className="battle-dot" style={{ '--dot-delay': '0.4s' } as CSSProperties}>.</span>
      </span>
    );
  }
  if (status.activity === 'answered') {
    return (
      <span className="battle-live-pop flex items-center gap-0.5" style={{ color: OPP_RED }}>
        <Pencil size={11} /> 第{n}問に回答！
      </span>
    );
  }
  if (status.activity === 'correct') {
    return (
      <span className="battle-live-pop flex items-center gap-0.5" style={{ color: GREEN }}>
        <Check size={11} /> 第{n}問 正解
        {status.streak >= 2 && (
          <span className="ml-1 flex items-center" style={{ color: '#E67E22' }}>
            <Flame size={11} />{status.streak}
          </span>
        )}
      </span>
    );
  }
  return (
    <span className="battle-live-pop flex items-center gap-0.5" style={{ color: INK_SUB }}>
      <X size={11} /> 第{n}問 ミス
    </span>
  );
}

// ============================================================
// 実況ログ
// ============================================================

export function LiveFeed({ entries }: { entries: FeedEntry[] }) {
  if (entries.length === 0) return <div className="h-[18px]" aria-hidden />;
  return (
    <ol
      id="battle-live-feed"
      className="mb-1 flex flex-col items-start gap-0.5 overflow-hidden"
      aria-live="polite"
      aria-label="対戦の実況"
    >
      {entries.map((e) => (
        <li
          key={e.id}
          className="battle-live-feed-in max-w-full truncate rounded-full px-2 py-px text-xs font-bold leading-4"
          style={feedStyle(e)}
        >
          {feedIcon(e)} {e.text}
        </li>
      ))}
    </ol>
  );
}

function feedIcon(e: FeedEntry): string {
  if (e.who === 'me') return '🔵';
  if (e.who === 'opponent') return '🔴';
  if (e.kind === 'overtake' || e.kind === 'overtaken') return '🔄';
  if (e.kind === 'final') return '⚡';
  if (e.kind === 'closing') return '⏳';
  return '▶';
}

function feedStyle(e: FeedEntry): CSSProperties {
  if (e.who === 'me') return { background: `${ME_BLUE}14`, color: ME_BLUE };
  if (e.who === 'opponent') return { background: `${OPP_RED}12`, color: OPP_RED };
  if (e.kind === 'final') return { background: '#2C3E50', color: '#F4D03F' };
  return { background: '#F4F1EA', color: INK_SUB };
}

// ============================================================
// トースト（短い演出）
// ============================================================

export function LiveToast({ toast }: { toast: LiveToastData | null }) {
  if (!toast) return null;
  // ★自分の正解・コンボは BattleLiveStage の全画面演出（CorrectBurst）が出すので、ここでは出さない（2026-10-01）★
  if (toast.kind === 'correct' || toast.kind === 'combo') return null;
  const conf = TOAST_STYLE[toast.kind];
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[38%] z-40 flex justify-center px-6"
      aria-live="assertive"
    >
      <div
        key={toast.id}
        className="battle-live-toast flex flex-col items-center rounded-2xl px-6 py-2.5 shadow-lg"
        style={{ background: conf.bg, color: conf.fg, border: `2px solid ${conf.border}` }}
      >
        {toast.sub && (
          <span className="text-xs font-black tracking-widest opacity-80">{toast.sub}</span>
        )}
        <span className="text-2xl font-black tracking-wide">{conf.icon} {toast.text}</span>
      </div>
    </div>
  );
}

const TOAST_STYLE: Record<LiveToastData['kind'], { bg: string; fg: string; border: string; icon: string }> = {
  correct: { bg: '#FFFFFF', fg: GREEN, border: `${GREEN}66`, icon: '⚡' },
  wrong: { bg: '#FFFFFF', fg: INK_SUB, border: LINE, icon: '' },
  combo: { bg: '#FFF7E6', fg: '#E67E22', border: '#E67E2266', icon: '🔥' },
  overtake: { bg: '#2C3E50', fg: '#F4D03F', border: '#F4D03F', icon: '🔥' },
  overtaken: { bg: '#FFFFFF', fg: OPP_RED, border: `${OPP_RED}55`, icon: '🔄' },
  'caught-up': { bg: '#FFFFFF', fg: ME_BLUE, border: `${ME_BLUE}66`, icon: '🔵' },
  caught: { bg: '#FFFFFF', fg: OPP_RED, border: `${OPP_RED}55`, icon: '🔴' },
  'opponent-correct': { bg: '#FFFFFF', fg: OPP_RED, border: `${OPP_RED}44`, icon: '🔴' },
};

// ============================================================
// カウントダウン
// ============================================================

export function CountdownOverlay({ label }: { label: string | null }) {
  if (!label) return null;
  const isStart = label === 'START!';
  return <section className="battle-ready-screen" aria-label="対戦開始の準備">
    <span className="battle-ready-kicker">BATTLE READY</span>
    <div className="battle-ready-tools" aria-hidden="true"><FileText /><Pencil /></div>
    <h2>紙と筆記用具を<br />用意してください</h2>
    <p>計算やメモの準備をして、スタートを待とう。</p>
    <div key={label} className={`battle-live-count battle-ready-count ${isStart ? 'is-start' : ''}`} role="timer" aria-live="polite" aria-atomic="true" aria-label={isStart ? '対戦開始' : `開始まで${label}秒`}><span>{label}</span></div>
    <div className="battle-ready-dots" aria-hidden="true">{Array.from({length:7},(_,i)=><i key={i} className={isStart || i >= Number(label) ? 'elapsed' : ''}/>)}</div>
    <small>問題はカウントダウンが終わってから表示されます。</small>
  </section>;
}

// ============================================================
// 最終問題
// ============================================================

export function FinalBanner() {
  return (
    <div
      id="battle-final-banner"
      className="battle-live-final mb-2 flex items-center justify-center gap-2 rounded-xl px-3 py-1.5"
      style={{ background: '#2C3E50', color: '#F4D03F' }}
      role="status"
    >
      <span className="h-px flex-1" style={{ background: '#F4D03F66' }} aria-hidden />
      <span className="text-xs font-black tracking-[0.2em]">⚡ FINAL QUESTION</span>
      <span className="h-px flex-1" style={{ background: '#F4D03F66' }} aria-hidden />
    </div>
  );
}

/** 残り3問の小さな帯 */
export function ClosingBanner({ remain }: { remain: number }) {
  return (
    <p
      className="bl-closing mb-2 text-center text-xs font-black tracking-wider"
      style={{ color: '#E67E22' }}
      role="status"
    >
      ⏳ のこり {remain} 問
    </p>
  );
}

/** 点差の一言（リードされている側にだけ出る） */
export function GapHint({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="mb-1 text-center text-xs font-black" style={{ color: ME_BLUE }} role="status">
      💪 {message}
    </p>
  );
}
