import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
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
 *   ・★下の空いている所にトビラ君が飛び込んでくる（2026-10-01 夜）★
 *     左右どちらか（問題ごとに交互になりやすいよう burstKey から決める）から跳ねて入り、
 *     ガッツポーズで1回弾んで、反対側へ抜ける。コンボ中はトロフィーのトビラ君。
 *
 * key（burstKey）が変わるたびに1回鳴る。combo を渡すと「COMBO ×n」を添えて金色に。
 */
function sideOf(key: string | number): 'left' | 'right' {
  const s = String(key);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h & 1) === 0 ? 'left' : 'right';
}

export function CorrectBurst({ burstKey, combo = 0, label = '正解！', sub = 'CORRECT!', extra }: { burstKey: string | number; combo?: number; label?: string; sub?: string; extra?: string }) {
  const hot = combo >= 2;
  const bits = Array.from({ length: 28 }, (_, i) => i);
  // ★body 直下に出す（2026-10-04）★ iPhone（Safari）では、親に transform / will-change があると
  //   position: fixed が画面ではなく親の箱基準になり、スクロールした解説画面では演出が画面外に出て見えなかった。
  const node = (
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
      <div className="cb-tobira" data-from={sideOf(burstKey)} data-cb-tobira>
        <img src={hot ? '/mascots/trophy.webp' : '/mascots/cheering.webp'} alt="" draggable={false} decoding="async" />
        <i className="cb-tobira-shadow" />
      </div>
      <div className="cb-stamp">
        <small>{sub}</small>
        <strong>{label}</strong>
        {hot && <em>COMBO ×{combo}</em>}
        {extra && <em data-extra>{extra}</em>}
      </div>
    </div>
  );
  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}
