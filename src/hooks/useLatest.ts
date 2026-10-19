import { useLayoutEffect, useRef } from 'react';

/**
 * 「いつでも最新の値」を読める ref を返す。
 *
 * effect の中で、毎回作り直される関数（親から来た onXxx など）を呼びたいが、
 * その関数が変わっただけでは effect を動かし直したくないときに使う。
 * 依存配列に ref を書けば exhaustive-deps を止めずに済む（R-23）。
 *
 * 描画のたびに layout effect で書き換えるので、ふつうの effect からは
 * 必ずその描画の最新値が見える。
 */
export function useLatest<T>(value: T): { readonly current: T } {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
