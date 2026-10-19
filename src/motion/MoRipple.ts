/**
 * 押した瞬間の波紋（2026-10-16）。
 *   アプリ全体で1つだけ pointerdown を聞き、押されたボタンの真上に「同じ大きさ・同じ角丸」の
 *   透明な枠（position:fixed）を重ねて、その中で波紋を広げる（0.65秒で消える）。
 *   ・ボタンの中に要素を差し込まない／ボタンの CSS（position・overflow）を変えない
 *     → どの画面のレイアウトも崩さずに、全部のボタンに同じ手応えを付けられる
 *   ・動きを減らす設定、無効のボタン、data-no-ripple の中、小さすぎる部品では何もしない
 *   ・枠は pointer-events:none なので、押す・離すの判定は元のボタンのまま
 */
const SELECTOR = 'button, [role=button], .mt-list-item, a.mt-btn';

export function installRipple(root: Document = document): () => void {
  if (typeof window === 'undefined' || typeof matchMedia !== 'function') return () => {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const onDown = (e: PointerEvent) => {
    if (reduce.matches || e.button !== 0) return;
    const el = (e.target as Element | null)?.closest?.(SELECTOR) as HTMLElement | null;
    if (!el || (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true' || el.closest('[data-no-ripple]')) return;
    const r = el.getBoundingClientRect();
    if (r.width < 28 || r.height < 28) return;
    const cs = getComputedStyle(el);
    const clip = document.createElement('span');
    clip.className = 'mo-ripple-clip';
    clip.setAttribute('aria-hidden', 'true');
    Object.assign(clip.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, borderRadius: cs.borderRadius, color: cs.color });
    const dot = document.createElement('span');
    dot.className = 'mo-ripple';
    dot.style.setProperty('--mo-r', `${Math.hypot(r.width, r.height) * 2}px`);
    dot.style.setProperty('--mo-x', `${e.clientX - r.left}px`);
    dot.style.setProperty('--mo-y', `${e.clientY - r.top}px`);
    clip.appendChild(dot);
    document.body.appendChild(clip);
    window.setTimeout(() => clip.remove(), 650);
  };
  root.addEventListener('pointerdown', onDown, { passive: true });
  return () => root.removeEventListener('pointerdown', onDown);
}
