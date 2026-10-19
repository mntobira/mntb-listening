import { useEffect, useRef, useState } from 'react';

/**
 * 数字のカウントアップ（2026-10-01、2026-10-16 拡張）。
 *   ・値が増えたときは、前の値から数え上げる（従来どおり）
 *   ・fromZero を付けると、最初の表示でも 0 から数え上げる（インフォグラフィック用）
 *   ・減ったとき・動きを減らす設定のときは、そのまま表示する
 *   ・幅は最終値（data-final）で先に確保するので、数えている間に周りが揺れない
 *   ・数え終わりに小さく弾む（data-done → motion.css）
 */
export function CountUp({ value, duration = 600, delay = 0, fromZero = false, format = (n: number) => n.toLocaleString('ja-JP') }: {
  value: number; duration?: number; delay?: number; fromZero?: boolean; format?: (n: number) => string;
}) {
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [shown, setShown] = useState(fromZero && !reduce && value > 0 ? 0 : value);
  const [done, setDone] = useState(false);
  const prev = useRef(fromZero && !reduce ? 0 : value);
  useEffect(() => {
    const from = prev.current; prev.current = value;
    if (value <= from || reduce) { setShown(value); return; }
    let raf = 0; let t0 = 0;
    const step = (t: number) => {
      if (!t0) t0 = t;
      const k = Math.min(1, (t - t0) / duration);
      setShown(Math.round(from + (value - from) * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(step); else setDone(true);
    };
    setDone(false);
    const timer = setTimeout(() => { raf = requestAnimationFrame(step); }, delay);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
    // reduce は描画中に変わらない前提（設定が変わったら次の値から反映）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, delay]);
  return <span className="mt-countup" data-final={format(value)} data-counting={shown !== value || undefined} data-done={done || undefined}><span>{format(shown)}</span></span>;
}
