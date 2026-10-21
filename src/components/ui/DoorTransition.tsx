import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './door-transition.css';

/**
 * 扉が開くページ切り替え（2026-10-19）。
 * 主要な画面どうしを移るときだけ、左右の扉が中央から外へ開く（0.36秒）。
 * - 演習・解説など頻繁に切り替わる画面では出さない（MAIN_SCREENS 以外）
 * - 動かすのは transform（scaleX）と opacity だけ。押せなくならないよう pointer-events: none
 * - 初回表示・動きを減らす設定では出さない
 */
export const MAIN_SCREENS = new Set(['home', 'study', 'battle', 'growth', 'settings', 'leaderboard', 'study_hub', 'foundation']);

export function shouldPlayDoor(prev: string | null, next: string, reduced: boolean): boolean {
  if (reduced || prev === null || prev === next) return false;
  return MAIN_SCREENS.has(prev) && MAIN_SCREENS.has(next);
}

export function DoorTransition({ screen }: { screen: string }) {
  const prev = useRef<string | null>(null);
  const [run, setRun] = useState(0);
  // 描画の前に扉を閉じておく（useEffect だと新しい画面が1フレーム見えてから扉が出てチラつく）
  useLayoutEffect(() => {
    let reduced = false;
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* 古いブラウザは動かす */ }
    if (shouldPlayDoor(prev.current, screen, reduced)) setRun(n => n + 1);
    prev.current = screen;
  }, [screen]);
  useEffect(() => {
    if (!run) return;
    const t = window.setTimeout(() => setRun(0), 520);
    return () => window.clearTimeout(t);
  }, [run]);
  if (!run) return null;
  return <div key={run} className="door-transition" aria-hidden="true"><i className="door-transition-l" /><i className="door-transition-r" /></div>;
}
