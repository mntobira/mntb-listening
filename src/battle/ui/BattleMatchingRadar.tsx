/**
 * マッチング待ちのレーダー演出（外へ広がる輪3つ・回る走査線・中心のアイコン）（C-21）。
 * BattleMatching.tsx から JSX をそのまま移した（クラス名・style・aria 属性は1文字も変えていない）。
 * 状態を持たない見た目だけの部品なので、部品に切り出しても動きは変わらない。
 */
import type { CSSProperties } from 'react';
import { Radar } from 'lucide-react';

export function BattleMatchingRadar({ theme }: { theme: { accent: string } }) {
  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      {['0s', '0.8s', '1.6s'].map((delay) => (
        <span
          key={delay}
          className="battle-radar-ring absolute inset-0 rounded-full border-2"
          style={
            {
              borderColor: `${theme.accent}55`,
              '--ring-delay': delay,
            } as CSSProperties
          }
        />
      ))}

      {/* 走査線（円錐グラデーションの扇形） */}
      <span
        className="battle-radar-sweep absolute inset-3 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, ${theme.accent}00 0deg, ${theme.accent}00 300deg, ${theme.accent}3D 350deg, ${theme.accent}66 360deg)`,
        }}
        aria-hidden
      />

      {/* 中心 */}
      <span
        className="relative flex h-16 w-16 items-center justify-center rounded-full border-2"
        style={{
          background: '#FFFFFF',
          borderColor: `${theme.accent}77`,
          boxShadow: `0 4px 0 ${theme.accent}22`,
        }}
      >
        <Radar size={30} style={{ color: theme.accent }} />
      </span>
    </div>
  );
}
