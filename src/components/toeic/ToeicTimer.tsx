/**
 * TOEIC Part 5 の演習画面の時間表示（2026-10-29）
 *
 * 共通の QuizTimerBar（リスニング・英文法が使う）は変えずに、TOEIC 用に見た目だけ控えめにした複製。
 * 時間の数え方（止める・再開する・resetKey で0に戻す・onTick で経過秒を渡す）は QuizTimerBar と同じ。
 *
 * 見た目の決まり
 *   ・線は 2px の細い線。色は紺→残り2割で琥珀。全幅の太いオレンジ線は出さない
 *   ・目安の時間を過ぎても止めない（既存の仕様のまま）。赤や点滅は使わず、灰色で「目安を過ぎました ＋m:ss」と出す
 *   ・全ページを採点したら、かかった時間を灰色で出す
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { useLatest } from '../../hooks/useLatest';

function fmt(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function ToeicTimer({ timeLimit, running, finished, onTick, resetKey, guideStatus }: {
  timeLimit: number;
  running: boolean;
  /** 全ページの採点が済んだか（済んだら、かかった時間を出す） */
  finished: boolean;
  onTick?: (elapsedSec: number) => void;
  resetKey: string | number;
  /** Part 5の時間予算ガイド。未指定なら従来どおりの表示 */
  guideStatus?: string;
}) {
  const [elapsed, setElapsed] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);
  const onTickRef = useLatest(onTick);

  useEffect(() => {
    accumulatedRef.current = 0;
    startedAtRef.current = null;
    setElapsed(0);
    onTickRef.current?.(0);
  }, [resetKey, onTickRef]);

  useEffect(() => {
    if (!running) {
      if (startedAtRef.current != null) {
        accumulatedRef.current += (Date.now() - startedAtRef.current) / 1000;
        startedAtRef.current = null;
        setElapsed(accumulatedRef.current);
        onTickRef.current?.(accumulatedRef.current);
      }
      return undefined;
    }
    if (startedAtRef.current == null) startedAtRef.current = Date.now();
    const id = window.setInterval(() => {
      if (startedAtRef.current == null) return;
      const e = accumulatedRef.current + (Date.now() - startedAtRef.current) / 1000;
      setElapsed(e);
      onTickRef.current?.(e);
    }, 250);
    return () => window.clearInterval(id);
  }, [running, resetKey, onTickRef]);

  const limit = Math.max(1, timeLimit);
  const remaining = limit - elapsed;
  const state = finished ? 'done' : remaining < 0 ? 'over' : remaining < limit * 0.2 ? 'low' : 'run';
  const pct = Math.max(0, Math.min(100, (elapsed / limit) * 100));
  const label = state === 'done'
    ? `かかった時間 ${fmt(elapsed)}`
    : state === 'over'
      ? `目安の${fmt(limit)}を過ぎました ＋${fmt(-remaining)}`
      : `残り ${fmt(remaining)}`;

  // 棒の長さは ref で直接書き換える（JSX にインラインの style を直書きしない：cssTokens の見張り）
  const fillRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { if (fillRef.current) fillRef.current.style.width = `${pct}%`; }, [pct]);

  return (
    <div className="tp-timer" role="timer" aria-label={guideStatus ? `${label}。${guideStatus}` : label} data-state={state} data-toeic-timer>
      <p className="tp-timer-text">
        <Clock size={13} aria-hidden="true" />
        <span>{label}</span>
        {state !== 'done' && state !== 'over' && <span className="tp-timer-limit">／ {fmt(limit)}</span>}
        {guideStatus && <span className="tp-timer-guide-status" data-toeic-timer-guide-status>{guideStatus}</span>}
      </p>
      <div className="tp-timer-track" aria-hidden="true">
        <div className="tp-timer-fill" ref={fillRef} />
      </div>
    </div>
  );
}
