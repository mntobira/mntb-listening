import type { CSSProperties } from 'react';
import './correct-burst.css';

/**
 * ★正解した瞬間の「うわ、正解したぜ」演出（2026-10-01）★
 * 利用者の指摘「正解の演出が画面の上だけ。結果を見るのに邪魔にならない範囲で、もっと派手に」。
 *
 *   ・画面のふち全体が光る（中身にはかぶらない）
 *   ・左右の下から紙吹雪が画面いっぱいに上がる（小さい粒なので文字は読める）
 *   ・真ん中に大きな「正解！」スタンプ → 0.9秒で小さくなって消える（結果の表示を隠し続けない）
 *   ・pointer-events: none なので、演出中も次のボタンは押せる
 *   ・prefers-reduced-motion では、ふちの光と小さなスタンプだけ
 *
 * key（burstKey）が変わるたびに1回鳴る。combo を渡すと「COMBO ×n」を添えて金色に。
 */
export function CorrectBurst({ burstKey, combo = 0, label = '正解！', sub = 'CORRECT!', extra }: { burstKey: string | number; combo?: number; label?: string; sub?: string; extra?: string }) {
  const hot = combo >= 2;
  const bits = Array.from({ length: 28 }, (_, i) => i);
  return (
    <div key={burstKey} className="cb-root" data-correct-burst data-hot={hot || undefined} aria-hidden="true">
      <i className="cb-edge" />
      <i className="cb-rays" />
      <div className="cb-confetti">
        {bits.map((i) => {
          const left = i % 2 === 0;
          const style = {
            '--x': `${(left ? 1 : -1) * (30 + ((i * 37) % 60))}vw`,
            '--y': `${-(40 + ((i * 53) % 50))}vh`,
            '--r': `${(i * 97) % 720 - 360}deg`,
            '--d': `${(i % 7) * 0.03}s`,
            '--c': ['#3e8e63', '#f6b93b', '#2458a6', '#e85d75', '#7cd992', '#ffd36b'][i % 6],
            left: left ? '-2%' : 'auto',
            right: left ? 'auto' : '-2%',
          } as CSSProperties;
          return <b key={i} style={style} data-shape={i % 3} />;
        })}
      </div>
      <div className="cb-stamp">
        <small>{sub}</small>
        <strong>{label}</strong>
        {hot && <em>COMBO ×{combo}</em>}
        {extra && <em data-extra>{extra}</em>}
      </div>
    </div>
  );
}
