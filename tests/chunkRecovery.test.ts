import { describe, expect, it } from 'vitest';
import { isChunkLoadError, shouldReloadForChunk } from '../src/utils/chunkRecovery';

const memory = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };

describe('配信直後の部品読み込み失敗', () => {
  it('ブラウザごとの文言を見分ける', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: https://x/assets/a.js'))).toBe(true);
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true);
    expect(isChunkLoadError(new Error('error loading dynamically imported module'))).toBe(true);
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false);
  });
  it('再読み込みは60秒に1回まで（圏外などで無限に読み直さない）', () => {
    const s = memory();
    expect(shouldReloadForChunk(1_000_000, s)).toBe(true);
    expect(shouldReloadForChunk(1_030_000, s)).toBe(false);
    expect(shouldReloadForChunk(1_061_000, s)).toBe(true);
  });
});
