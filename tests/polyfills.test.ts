import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('古い端末向けの補い（polyfills）', () => {
  it('無い環境では randomUUID / Array.at / throwIfAborted を足す', async () => {
    const c = globalThis.crypto as any;
    const savedUUID = c.randomUUID;
    const savedAt = Array.prototype.at;
    const savedThrow = AbortSignal.prototype.throwIfAborted;
    try {
      Object.defineProperty(c, 'randomUUID', { value: undefined, configurable: true, writable: true });
      // @ts-expect-error テストで消す
      delete Array.prototype.at;
      // @ts-expect-error テストで消す
      delete AbortSignal.prototype.throwIfAborted;
      const { installPolyfills } = await import('../src/utils/polyfills');
      installPolyfills();
      const id = c.randomUUID();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(c.randomUUID()).not.toBe(id);
      expect([1, 2, 3].at(-1)).toBe(3);
      expect([1, 2, 3].at(0)).toBe(1);
      expect([1, 2, 3].at(5)).toBeUndefined();
      const ac = new AbortController();
      expect(() => ac.signal.throwIfAborted()).not.toThrow();
      ac.abort();
      expect(() => ac.signal.throwIfAborted()).toThrow();
    } finally {
      Object.defineProperty(c, 'randomUUID', { value: savedUUID, configurable: true, writable: true });
      Object.defineProperty(Array.prototype, 'at', { value: savedAt, configurable: true, writable: true });
      Object.defineProperty(AbortSignal.prototype, 'throwIfAborted', { value: savedThrow, configurable: true, writable: true });
    }
  });
  it('main.tsx の最初で読み込む', () => {
    const main = readFileSync('src/main.tsx', 'utf8');
    const first = main.split('\n').find((l) => l.startsWith('import'));
    expect(first).toBe("import './utils/polyfills';");
  });
});
