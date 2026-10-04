import { describe, expect, it, vi } from 'vitest';

class MemStorage {
  data = new Map<string, string>();
  limit = 3;
  get length() { return this.data.size; }
  key(i: number) { return [...this.data.keys()][i] ?? null; }
  getItem(k: string) { return this.data.get(k) ?? null; }
  removeItem(k: string) { this.data.delete(k); }
  setItem(k: string, v: string) {
    if (!this.data.has(k) && this.data.size >= this.limit) {
      const e = new Error('full'); e.name = 'QuotaExceededError'; throw e;
    }
    this.data.set(k, v);
  }
}

describe('localStorage の容量オーバーで落ちない', () => {
  it('容量オーバーでも例外を投げず、捨ててよいキャッシュを消して保存する', async () => {
    vi.stubGlobal('Storage', MemStorage);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { installStorageGuard, storageWriteFailures, safeSetItem } = await import('../src/utils/storageGuard');
    installStorageGuard();
    const s = new MemStorage() as unknown as Storage;
    s.setItem('a', '1'); s.setItem('cache_x', '2'); s.setItem('b', '3');
    expect(() => s.setItem('c', '4')).not.toThrow();
    expect(s.getItem('c')).toBe('4');
    expect(s.getItem('cache_x')).toBeNull();
    // 捨てられるものが無い → 例外のまま（報酬の二重付与・保存できたふりを防ぐ）
    expect(() => s.setItem('d', '5')).toThrow();
    expect(s.getItem('d')).toBeNull();
    // 画面状態用の safeSetItem は投げずに false
    vi.stubGlobal('localStorage', s);
    expect(safeSetItem('e', '6')).toBe(false);
    expect(storageWriteFailures()).toBe(1);
    vi.unstubAllGlobals();
  });
});
