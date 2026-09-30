/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 問題下部に控えめに表示するタイマーバー。
 * - 制限時間内は緑→黄→橙とグラデーション、残時間に応じて段階変色
 * - 制限時間を超えたら「+XX秒」を表示し、バーは赤色 + 控えめなパルス
 * - 問題の邪魔にならないよう、画面下に絶対配置、高さは2〜4pxの細いバー
 */

import React, { useEffect, useState, useRef } from 'react';
import { Clock } from 'lucide-react';

interface QuizTimerBarProps {
  /** 制限時間（秒） */
  timeLimit: number;
  /** タイマーが動作中か（解説表示中は止める） */
  running: boolean;
  /** 現在の経過秒数を上位に通知（採点用）。停止/再開で正確な値が必要なので */
  onTick?: (elapsedSec: number) => void;
  /** リセットキー: これが変わるとタイマーが0からやり直す */
  resetKey: string | number;
}

function formatSec(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m > 0) return `${m}:${r.toString().padStart(2, '0')}`;
  return `${r}秒`;
}

export function QuizTimerBar({ timeLimit, running, onTick, resetKey }: QuizTimerBarProps) {
  const [elapsed, setElapsed] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);
  const intervalRef = useRef<number | null>(null);

  // resetKey 変化時は完全リセット
  useEffect(() => {
    accumulatedRef.current = 0;
    startedAtRef.current = null;
    setElapsed(0);
    if (onTick) onTick(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(() => {
    // running が true なら開始 / false なら停止
    if (running) {
      if (startedAtRef.current == null) startedAtRef.current = Date.now();

      intervalRef.current = window.setInterval(() => {
        if (startedAtRef.current == null) return;
        const now = Date.now();
        const e = accumulatedRef.current + (now - startedAtRef.current) / 1000;
        setElapsed(e);
        if (onTick) onTick(e);
      }, 250) as unknown as number;
    } else {
      // 停止：経過分を accumulated に積む
      if (startedAtRef.current != null) {
        accumulatedRef.current += (Date.now() - startedAtRef.current) / 1000;
        startedAtRef.current = null;
        setElapsed(accumulatedRef.current);
        if (onTick) onTick(accumulatedRef.current);
      }
      if (intervalRef.current != null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current != null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, resetKey]);

  const remaining = timeLimit - elapsed;
  const isOver = remaining < 0;
  const overSec = isOver ? Math.floor(-remaining) : 0;
  const pct = isOver ? 100 : Math.max(0, Math.min(100, (elapsed / timeLimit) * 100));

  // 色判定
  let barColor = 'bg-emerald-400';
  let textColor = 'text-emerald-700';
  if (isOver) {
    barColor = 'bg-rose-500';
    textColor = 'text-rose-600';
  } else if (remaining < timeLimit * 0.2) {
    barColor = 'bg-orange-400';
    textColor = 'text-orange-600';
  } else if (remaining < timeLimit * 0.5) {
    barColor = 'bg-amber-400';
    textColor = 'text-amber-600';
  }

  return (
    <div
      className="pointer-events-none select-none"
      aria-label={isOver ? `制限時間を${overSec}秒超過` : `残り${formatSec(remaining)}`}
      role="timer"
    >
      <div className="flex items-center justify-between px-3 md:px-4 pt-1 pb-0.5">
        <div className={`flex items-center gap-1.5 text-xs font-bold font-mono ${textColor} transition-colors`}>
          <Clock size={12} className="md:w-3.5 md:h-3.5" />
          {isOver ? (
            <span className="tabular-nums">
              <span className="opacity-70">時間超過</span>
              <span className="ml-1">+{formatSec(overSec)}</span>
            </span>
          ) : (
            <span className="tabular-nums">
              <span className="opacity-70">残り</span>
              <span className="ml-1">{formatSec(remaining)}</span>
              <span className="opacity-40 ml-1">/ {formatSec(timeLimit)}</span>
            </span>
          )}
        </div>
      </div>
      <div className="h-1 md:h-1.5 w-full bg-gray-100/80 overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-200 ease-linear ${isOver ? 'animate-pulse' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
