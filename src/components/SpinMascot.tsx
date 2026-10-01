import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * ホームのとびら君を「回せる」ようにする（2026-10-01 D：モンストのキャラ回転のイメージ）。
 *
 *   - 左右にドラッグ（スワイプ）すると、その方向に Y 軸で回る。離すと慣性でくるくる回り、正面で止まる。
 *   - 速く弾くと何回転もする。止まる直前に「ぽよん」と弾む。
 *   - 裏側は、絵を左右反転して暗くした「扉の背中」（2Dの絵なので本当の背面は無い）。
 *   - ちょんと押しただけ（動かしていない）ならタップ扱い → 今までどおり着せ替えを開く。
 *   - 動きを減らす設定では回さない（タップだけ）。
 * 絵（img・アクセサリ）は children で受け取り、表と裏に同じものを描く。
 */
const TAP_PX = 8;
const FRICTION = 0.94;      // 1フレームごとの減速
const SNAP_SPEED = 0.6;     // これより遅くなったら正面へ寄せる（度/フレーム）

export function SpinMascot({ children, onTap, label, className = '' }: { children: ReactNode; onTap?: () => void; label: string; className?: string }) {
  const [angle, setAngle] = useState(0);
  const [settling, setSettling] = useState(false);
  const st = useRef({ down: false, x: 0, last: 0, lastT: 0, v: 0, moved: 0, raf: 0, angle: 0 });
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => () => cancelAnimationFrame(st.current.raf), []);
  const set = (a: number) => { st.current.angle = a; setAngle(a); };

  const spin = () => {
    const s = st.current;
    cancelAnimationFrame(s.raf);
    const step = () => {
      s.v *= FRICTION;
      if (Math.abs(s.v) < SNAP_SPEED) {
        // 正面（360の倍数）へ、近い方向に寄せる。CSS の transition で「ぽよん」と止める
        const target = Math.round(s.angle / 360) * 360;
        setSettling(true); set(target);
        window.setTimeout(() => { setSettling(false); s.angle = 0; setAngle(0); }, 520);
        return;
      }
      set(s.angle + s.v);
      s.raf = requestAnimationFrame(step);
    };
    s.raf = requestAnimationFrame(step);
  };

  return <div
    className={`spin-mascot ${className}`}
    role="button" tabIndex={0} aria-label={label}
    data-spinning={Math.abs(angle % 360) > 1 || undefined}
    data-settling={settling || undefined}
    onKeyDown={e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap?.(); }
      if (!reduce && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { st.current.v = e.key === 'ArrowLeft' ? -24 : 24; spin(); }
    }}
    onPointerDown={e => {
      const s = st.current; cancelAnimationFrame(s.raf); setSettling(false);
      s.down = true; s.x = e.clientX; s.last = e.clientX; s.lastT = performance.now(); s.v = 0; s.moved = 0;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    }}
    onPointerMove={e => {
      const s = st.current; if (!s.down || reduce) return;
      const dx = e.clientX - s.last; const now = performance.now();
      s.moved += Math.abs(dx);
      s.v = (dx * 0.9) / Math.max(1, (now - s.lastT) / 16.7);
      s.last = e.clientX; s.lastT = now;
      if (s.moved > TAP_PX) set(s.angle + dx * 0.9);
    }}
    onPointerUp={e => {
      const s = st.current; if (!s.down) return; s.down = false;
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      if (s.moved <= TAP_PX) { onTap?.(); return; }
      s.v = Math.max(-45, Math.min(45, s.v));
      if (Math.abs(s.v) < 2) s.v = s.v < 0 ? -2 : 2;
      spin();
    }}
    onPointerCancel={() => { st.current.down = false; spin(); }}
  >
    <span className="spin-mascot-stage" style={{ transform: `rotateY(${angle}deg)` }}>
      <span className="spin-mascot-face spin-mascot-front">{children}</span>
      <span className="spin-mascot-face spin-mascot-back" aria-hidden="true">{children}</span>
    </span>
    <span className="spin-mascot-shadow" aria-hidden="true" style={{ transform: `scaleX(${0.55 + 0.45 * Math.abs(Math.cos(angle * Math.PI / 180))})` }} />
  </div>;
}
