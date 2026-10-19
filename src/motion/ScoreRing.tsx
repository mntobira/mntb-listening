/**
 * 正答率の輪（インフォグラフィック、2026-10-16）。
 *   円の線の長さで割合を見せる。数字は横の文字（正答率 ○%）がそのまま正なので、輪は aria-hidden の飾り。
 *   pathLength=1 にして、割合をそのまま stroke-dashoffset に入れる（描かれる動きは motion.css）。
 */
export function ScoreRing({ rate, size = 44, stroke = 6, tone = 'brand' }: { rate: number; size?: number; stroke?: number; tone?: 'brand' | 'done' | 'warn' }) {
  const r = (size - stroke) / 2;
  const v = Math.max(0, Math.min(1, rate));
  const color = tone === 'done' ? 'var(--mt-done, #2f7a52)' : tone === 'warn' ? 'var(--mt-danger, #c0392b)' : 'var(--mt-brand, #2458a6)';
  return (
    <svg className="mo-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" style={{ rotate: '-90deg', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--mt-line, #e3d9c8)" strokeWidth={stroke} />
      <circle className="mo-ring-fg" cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - v} />
    </svg>
  );
}
