/**
 * 古い端末（iOS 15.0〜15.3 / 古い Android WebView）でも落ちないための最小限の補い（2026-10-03）。
 *
 * Vite は「書き方（構文）」は古いブラウザ向けに直すが、「新しい関数」は足さない。
 * 次の3つはアプリの中心（マッチング・ガチャ・成長記録）で使っており、
 * 無い端末では押した瞬間に TypeError で止まっていた。
 *   - crypto.randomUUID           … iOS 15.4+／さらに https でしか使えない
 *   - Array.prototype.at          … iOS 15.4+
 *   - AbortSignal.throwIfAborted  … iOS 15.4+
 * 本物がある端末では何もしない。
 */

function fillRandomUUID(): void {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (!c || typeof c.randomUUID === 'function') return;
  const make = (): `${string}-${string}-${string}-${string}-${string}` => {
    const b = new Uint8Array(16);
    if (typeof c.getRandomValues === 'function') c.getRandomValues(b);
    else for (let i = 0; i < 16; i += 1) b[i] = Math.floor(Math.random() * 256);
    b[6] = ((b[6] ?? 0) & 0x0f) | 0x40;
    b[8] = ((b[8] ?? 0) & 0x3f) | 0x80;
    const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  };
  try {
    Object.defineProperty(c, 'randomUUID', { value: make, configurable: true, writable: true });
  } catch { /* 書き換えられない環境では諦める */ }
}

function fillArrayAt(): void {
  if (typeof Array.prototype.at === 'function') return;
  Object.defineProperty(Array.prototype, 'at', {
    configurable: true,
    writable: true,
    value: function at<T>(this: T[], index: number): T | undefined {
      const n = Math.trunc(index) || 0;
      const i = n < 0 ? this.length + n : n;
      return i < 0 || i >= this.length ? undefined : this[i];
    },
  });
}

function fillThrowIfAborted(): void {
  if (typeof AbortSignal === 'undefined' || typeof AbortSignal.prototype.throwIfAborted === 'function') return;
  Object.defineProperty(AbortSignal.prototype, 'throwIfAborted', {
    configurable: true,
    writable: true,
    value: function throwIfAborted(this: AbortSignal) {
      if (!this.aborted) return;
      const reason = (this as { reason?: unknown }).reason;
      if (reason !== undefined) throw reason;
      const err = new Error('This operation was aborted');
      err.name = 'AbortError';
      throw err;
    },
  });
}

export function installPolyfills(): void {
  try { fillRandomUUID(); } catch { /* noop */ }
  try { fillArrayAt(); } catch { /* noop */ }
  try { fillThrowIfAborted(); } catch { /* noop */ }
}

installPolyfills();
