import React, { useMemo } from 'react';

interface SakuraPetalsProps {
  /** 花びらの枚数（デフォルト18枚） */
  count?: number;
  className?: string;
}

/**
 * 桜の花びらを降らせる装飾コンポーネント。
 * - 純粋なCSSアニメーションで描画（パフォーマンス配慮）
 * - pointer-events-none で操作を妨げない
 * - prefers-reduced-motion 環境では index.css 側でアニメーションが抑制される
 */
export function SakuraPetals({ count = 18, className = '' }: SakuraPetalsProps) {
  const petals = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const left = Math.random() * 100; // 0〜100%
      const size = 8 + Math.random() * 10; // 8〜18px
      const duration = 8 + Math.random() * 9; // 8〜17s
      const delay = Math.random() * 12; // 0〜12s
      const sway = 20 + Math.random() * 40; // 横揺れ量
      const opacity = 0.5 + Math.random() * 0.45;
      // 花びらの色（淡いピンク〜濃いめのピンク）
      const colors = ['#FBD0DC', '#F8C2D4', '#F4A9C4', '#FADCE6'];
      const color = colors[i % colors.length];
      return { left, size, duration, delay, sway, opacity, color, key: i };
    });
  }, [count]);

  return (
    <div className={`sakura-container pointer-events-none ${className}`} aria-hidden="true">
      {petals.map((p) => (
        <span
          key={p.key}
          className="sakura-petal"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 0.85}px`,
            opacity: p.opacity,
            background: p.color,
            // CSS変数でアニメーションパラメータを渡す
            '--fall-duration': `${p.duration}s`,
            '--fall-delay': `${p.delay}s`,
            '--sway': `${p.sway}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
