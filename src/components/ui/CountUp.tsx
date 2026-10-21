import { useEffect, useRef, useState } from 'react';

/**
 * 数字のカウントアップ（2026-10-01、2026-10-16 拡張、2026-10-17 L-02 軽量化）。
 *   ・値が増えたときは、前の値から数え上げる（従来どおり）
 *   ・fromZero を付けると、最初の表示でも 0 から数え上げる（インフォグラフィック用）
 *   ・減ったとき・動きを減らす設定のときは、そのまま表示する
 *   ・幅は最終値（data-final）で先に確保するので、数えている間に周りが揺れない
 *   ・数え終わりに小さく弾む（data-done → motion.css）
 *
 * ★L-02：数えている途中は React の state を更新しない★
 *   以前は requestAnimationFrame の中で毎フレーム setShown していた。ホームだけで 6〜7 個が同時に数えるので
 *   60fps × 6 = 毎秒 360 回の再レンダーがメインスレッドを埋め、入場中の CSS アニメまで止まっていた。
 *   いまは途中の数字を「React が持っている文字ノード」の nodeValue へ直接書き、
 *   数え終わった1回だけ state を更新する（再レンダーは 1 回）。
 *   ・文字ノードは差し替えずに中身だけ書き換えるので、React が持つ参照とずれない
 *   ・DOM（要素・属性・data-counting / data-done の付き方）は従来と同じ
 */
export function CountUp({ value, duration = 600, delay = 0, fromZero = false, format = (n: number) => n.toLocaleString('ja-JP') }: {
  value: number; duration?: number; delay?: number; fromZero?: boolean; format?: (n: number) => string;
}) {
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // shown は「React が描く数字」。数えている間は開始値のまま（途中の数字は DOM へ直接書く）
  const [shown, setShown] = useState(fromZero && !reduce && value > 0 ? 0 : value);
  const [done, setDone] = useState(false);
  const prev = useRef(fromZero && !reduce ? 0 : value);
  const textRef = useRef<HTMLSpanElement>(null);
  const formatRef = useRef(format); formatRef.current = format;
  useEffect(() => {
    const from = prev.current; prev.current = value;
    if (value <= from || reduce) { setShown(value); return; }
    let raf = 0; let t0 = 0;
    const write = (n: number) => {
      const node = textRef.current?.firstChild;
      if (node && node.nodeType === 3) node.nodeValue = formatRef.current(n);
    };
    const step = (t: number) => {
      if (!t0) t0 = t;
      const k = Math.min(1, (t - t0) / duration);
      if (k < 1) {
        write(Math.round(from + (value - from) * (1 - (1 - k) ** 3)));
        raf = requestAnimationFrame(step);
      } else {
        // 数え終わりの1回だけ React に渡す（setShown と setDone は1回の描画にまとまる）
        setShown(value); setDone(true);
      }
    };
    setDone(false);
    const timer = setTimeout(() => { raf = requestAnimationFrame(step); }, delay);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
    // reduce は描画中に変わらない前提（設定が変わったら次の値から反映）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, delay]);
  return <span className="mt-countup" data-final={format(value)} data-counting={shown !== value || undefined} data-done={done || undefined}><span ref={textRef}>{format(shown)}</span></span>;
}
