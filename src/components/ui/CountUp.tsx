import { useEffect, useRef, useState } from 'react';

/**
 * 数字のカウントアップ（2026-10-01）。値が増えたときだけ、前の値から 0.6 秒で数え上げる。
 * 最初の表示・減ったとき・動きを減らす設定のときは、そのまま表示する。
 */
export function CountUp({ value, duration = 600, format = (n: number) => n.toLocaleString('ja-JP') }: { value: number; duration?: number; format?: (n: number) => string }) {
  const [shown, setShown] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current; prev.current = value;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (value <= from || reduce) { setShown(value); return; }
    let raf = 0; const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / duration);
      setShown(Math.round(from + (value - from) * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className="mt-countup" data-counting={shown !== value || undefined}>{format(shown)}</span>;
}
