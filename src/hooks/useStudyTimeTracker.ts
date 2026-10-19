import { useEffect } from 'react';
import { auth } from '../firebase';
import { activeStudySeconds, addStudySeconds } from '../utils/studyTime';
import { toDateKey } from '../utils/studySummary';

/** 学習時間を足す間隔（ms） */
export const STUDY_TICK_MS = 15_000;

/** 操作とみなすイベント */
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'];

/**
 * リスニングの音声・読み上げが鳴っているか（鳴っている間は操作ありとみなす）。
 * BGM（loop のついた <audio>）は数えない。
 */
function isStudyMediaPlaying(): boolean {
  const media = [...document.querySelectorAll<HTMLMediaElement>('audio, video')];
  return media.some((m) => !m.loop && !m.paused && !m.ended)
    || (typeof speechSynthesis !== 'undefined' && speechSynthesis.speaking);
}

/**
 * ★学習時間（設定のプロフィールカード）★ 計算・保存は utils/studyTime.ts。
 * active の間（演習・解説の画面）だけ、タブが前面にあるときに15秒ごとに足す。
 * 1分間なにも操作がなければ数えない（2026-10-11）。止めるとき（画面を離れたとき）に端数も足す。
 *
 * 以前は App.tsx の中に直接書かれていた（2026-10-15 にフックへ移した。挙動は同じ）。
 */
export function useStudyTimeTracker(active: boolean, screenKey: string): void {
  // screenKey（画面の名前）が変わるたびに区切って足し直す（演習 → 解説へ移った瞬間にも端数を足す。従来どおり）
  useEffect(() => {
    if (!active) return;
    let last = Date.now();
    let lastActive = last;
    const markActive = () => { lastActive = Date.now(); };
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, markActive, { passive: true, capture: true }));

    const tick = () => {
      const now = Date.now();
      if (isStudyMediaPlaying()) lastActive = now;
      if (document.visibilityState === 'visible') {
        addStudySeconds(auth.currentUser?.uid || 'guest', activeStudySeconds(last, now, lastActive), toDateKey(now));
      }
      last = now;
    };
    const id = window.setInterval(tick, STUDY_TICK_MS);
    return () => {
      window.clearInterval(id);
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, markActive, { capture: true }));
      tick();
    };
  }, [active, screenKey]);
}
