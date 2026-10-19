import { describe, it, expect, beforeEach } from 'vitest';
import { recordStagePlayAndSync } from '../src/utils/stagePlay';
import { readStageRecords } from '../src/utils/stageRecords';

describe('recordStagePlayAndSync（保存と送信の予約を分けた入口）', () => {
  beforeEach(() => {
    const mem = new Map<string, string>();
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k), clear: () => mem.clear(), key: () => null, length: 0,
    };
  });

  it('従来の recordStagePlay と同じ記録を返し、端末に保存する', () => {
    const r = recordStagePlayAndSync('guest', 'el1_A::q1', '第1問A 第1回', 4, 4, 1000);
    expect(r).toEqual({ p: 1, n: 1, b: 100, t: 1000 });
    expect(readStageRecords('guest')['el1_A::q1']).toEqual({ p: 1, n: 1, b: 100, t: 1000 });
  });

  it('採点できる問題が0なら記録しない（null）', () => {
    expect(recordStagePlayAndSync('guest', 'k', 't', 0, 0)).toBeNull();
  });
});
