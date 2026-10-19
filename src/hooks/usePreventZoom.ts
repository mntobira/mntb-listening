import { useEffect } from 'react';

/** 2回目のタップをダブルタップとみなす間隔（ms）。iOS Safari のダブルタップズーム判定に合わせる */
export const DOUBLE_TAP_WINDOW_MS = 300;

/** 標準のタッチ挙動を残す要素（入力欄・ボタン・リンク） */
export const NATIVE_CONTROLS_SELECTOR = 'input, select, button, a';

export interface PreventZoomOptions {
  /** false の間はリスナーを登録しない */
  enabled: boolean;
  /** 2本指の touchmove（ピンチ）を止める */
  blockPinchTouch?: boolean;
  /** iOS の gesturestart / gesturechange（ピンチ）を止める */
  blockGesture?: boolean;
  /** この CSS セレクタに一致する要素（の子孫）へのタッチは止めない。null なら除外しない */
  ignoreSelector?: string | null;
}

/**
 * ダブルタップ判定だけを取り出した純関数（テスト用に公開）。
 * 前回の touchend から DOUBLE_TAP_WINDOW_MS 以内なら true。
 */
export function isDoubleTap(now: number, lastTouchEnd: number): boolean {
  return now - lastTouchEnd <= DOUBLE_TAP_WINDOW_MS;
}

function isIgnoredTarget(target: EventTarget | null, selector: string | null | undefined): boolean {
  return Boolean(selector) && target instanceof Element && target.closest(selector!) !== null;
}

/**
 * ピンチズーム・ダブルタップズームを抑止する（document にリスナーを登録）。
 *
 * 以前は App.tsx と Quiz.tsx にほぼ同じ処理が別々に書かれていた。処理はここに1つだけ置き、
 * 呼び出し側は「どこで・何を止めるか」をオプションで指定する。
 */
export function usePreventZoom({ enabled, blockPinchTouch = false, blockGesture = false, ignoreSelector = null }: PreventZoomOptions): void {
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    let lastTouchEnd = 0;
    const onTouchEnd = (e: TouchEvent) => {
      if (isIgnoredTarget(e.target, ignoreSelector)) return;
      const now = Date.now();
      if (isDoubleTap(now, lastTouchEnd)) e.preventDefault();
      lastTouchEnd = now;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isIgnoredTarget(e.target, ignoreSelector)) return;
      if (e.touches.length > 1) e.preventDefault();
    };
    const onGesture = (e: Event) => { e.preventDefault(); };

    const listenerOptions = { passive: false } as const;
    document.addEventListener('touchend', onTouchEnd, listenerOptions);
    if (blockPinchTouch) document.addEventListener('touchmove', onTouchMove, listenerOptions);
    if (blockGesture) {
      document.addEventListener('gesturestart', onGesture, listenerOptions);
      document.addEventListener('gesturechange', onGesture, listenerOptions);
    }
    return () => {
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('gesturestart', onGesture);
      document.removeEventListener('gesturechange', onGesture);
    };
  }, [enabled, blockPinchTouch, blockGesture, ignoreSelector]);
}
