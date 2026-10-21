import { isLitePerf } from '../utils/devicePerf';

/**
 * 押した瞬間の波紋（2026-10-16、2026-10-17 L-03 軽量化）。
 *   アプリ全体で1つだけ pointerdown を聞き、押されたボタンの真上に「同じ大きさ・同じ角丸」の
 *   透明な枠（position:fixed）を重ねて、その中で波紋を広げる（0.65秒で消える）。
 *   ・ボタンの中に要素を差し込まない／ボタンの CSS（position・overflow）を変えない
 *     → どの画面のレイアウトも崩さずに、全部のボタンに同じ手応えを付けられる
 *   ・動きを減らす設定、無効のボタン、data-no-ripple の中、小さすぎる部品では何もしない
 *   ・枠は pointer-events:none なので、押す・離すの判定は元のボタンのまま
 *
 * ★L-03：押した瞬間の「強制同期レイアウト」を減らす★
 *   ・getComputedStyle（全プロパティの計算が走る重い呼び出し）は要素ごとに1回だけ。
 *     角丸と文字色は WeakMap に覚えておく（要素が消えれば一緒に消える）
 *   ・DOM の追加は次のフレーム（requestAnimationFrame）へ回し、:active の沈み込みの初動を詰まらせない
 *   ・低スペック端末（data-perf=lite）では波紋を出さず、各ボタンの CSS の :active（沈み込み）だけにする
 */
const SELECTOR = 'button, [role=button], .mt-list-item, a.mt-btn';

type RippleLook = { radius: string; color: string };
const lookCache = new WeakMap<Element, RippleLook>();

/** 角丸と文字色（波紋の色）。同じボタンは2回目から getComputedStyle を呼ばない */
export function rippleLookOf(el: Element, read: (el: Element) => Pick<CSSStyleDeclaration, 'borderRadius' | 'color'> = getComputedStyle): RippleLook {
  const hit = lookCache.get(el);
  if (hit) return hit;
  const cs = read(el);
  const look = { radius: cs.borderRadius, color: cs.color };
  lookCache.set(el, look);
  return look;
}

export function installRipple(root: Document = document): () => void {
  if (typeof window === 'undefined' || typeof matchMedia !== 'function') return () => {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fn: FrameRequestCallback) => window.setTimeout(() => fn(0), 0);
  const onDown = (e: PointerEvent) => {
    if (reduce.matches || e.button !== 0 || isLitePerf()) return;
    const el = (e.target as Element | null)?.closest?.(SELECTOR) as HTMLElement | null;
    if (!el || (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true' || el.closest('[data-no-ripple]')) return;
    const r = el.getBoundingClientRect();
    if (r.width < 28 || r.height < 28) return;
    const { radius, color } = rippleLookOf(el);
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    raf(() => {
      const clip = document.createElement('span');
      clip.className = 'mo-ripple-clip';
      clip.setAttribute('aria-hidden', 'true');
      Object.assign(clip.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, borderRadius: radius, color });
      const dot = document.createElement('span');
      dot.className = 'mo-ripple';
      dot.style.setProperty('--mo-r', `${Math.hypot(r.width, r.height) * 2}px`);
      dot.style.setProperty('--mo-x', `${x}px`);
      dot.style.setProperty('--mo-y', `${y}px`);
      clip.appendChild(dot);
      document.body.appendChild(clip);
      window.setTimeout(() => clip.remove(), 650);
    });
  };
  root.addEventListener('pointerdown', onDown, { passive: true });
  return () => root.removeEventListener('pointerdown', onDown);
}
