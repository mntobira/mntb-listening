import { useEffect, type EffectCallback } from 'react';

/**
 * 画面に出たとき（マウント時）に1回だけ動かす effect。
 *
 * `useEffect(fn, [])` と完全に同じ動き。各画面に
 * 「eslint-disable-next-line react-hooks/exhaustive-deps」を散らばらせず、
 * 「わざと1回だけ」という意図をこの名前で表すために置いている（R-23）。
 * 値が変わるたびに動かしたいときは、普通の useEffect に依存を書くこと。
 */
export function useMountEffect(effect: EffectCallback): void {
  // わざと1回だけ（この関数の目的そのもの）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, []);
}
