/**
 * Firebase（Firestore）の1日の無料枠の上限に達したとき、全国対戦が AI プレイヤーにつながるか。
 *   resource-exhausted を一度でも見たら端末に覚え、次のマッチングは待たずに AI へ切り替える。
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { QUOTA_COOLDOWN_MS, fallbackDecision } from '../src/battle/core/matchFallback';
import { clearQuotaBlock, isQuotaBlocked, noteServerError } from '../src/battle/data/serverHealth';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: () => null,
  length: 0,
} as Storage;

const base = { elapsedSec: 0, failures: 0, lastErrorCode: null, online: true };

describe('無料枠の上限（resource-exhausted）→ AI プレイヤー', () => {
  beforeEach(() => store.clear());

  it('上限エラーを見る前はふつうに人を探す', () => {
    expect(isQuotaBlocked()).toBe(false);
    expect(fallbackDecision({ ...base, quotaBlocked: isQuotaBlocked() })).toBeNull();
  });

  it('上限エラーを見た瞬間（その画面）も、次の画面からも、0秒で AI に切り替わる', () => {
    // その場：エラーコードで即切り替え
    expect(fallbackDecision({ ...base, lastErrorCode: 'resource-exhausted', quotaBlocked: false })).toBe('server');
    // 端末に記録 → 次のマッチングでは Firestore に行かずに即 AI
    noteServerError({ code: 'resource-exhausted' });
    expect(isQuotaBlocked()).toBe(true);
    expect(fallbackDecision({ ...base, quotaBlocked: isQuotaBlocked() })).toBe('server');
  });

  it('ほかのエラーでは記録しない／15分たてば人との対戦に戻る', () => {
    noteServerError({ code: 'permission-denied' });
    expect(isQuotaBlocked()).toBe(false);
    noteServerError({ code: 'resource-exhausted' });
    expect(isQuotaBlocked(Date.now() + QUOTA_COOLDOWN_MS + 1000)).toBe(false);
    clearQuotaBlock();
    expect(isQuotaBlocked()).toBe(false);
  });
});
