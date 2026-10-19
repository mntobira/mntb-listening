import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAX_RECENT, clearRecentErrors, getRecentErrors, logRejection, reportError } from '../src/utils/reportError';

afterEach(() => { clearRecentErrors(); vi.restoreAllMocks(); });

describe('reportError：握りつぶしていた失敗を記録する', () => {
  it('場所・要約・時刻を残す（Firestore の code は先頭に付ける）', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const e = Object.assign(new Error('Missing or insufficient permissions.'), { code: 'permission-denied' });
    reportError('ranking.ensureEntry', e, 1000);
    expect(getRecentErrors()).toEqual([{ scope: 'ranking.ensureEntry', message: 'permission-denied: Missing or insufficient permissions.', at: 1000 }]);
  });

  it('Error 以外（文字列・オブジェクト・文字列化できない値）でも落ちない', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const cyclic: Record<string, unknown> = {}; cyclic.self = cyclic;
    reportError('a', 'text');
    reportError('b', { reason: 'x' });
    reportError('c', cyclic);
    reportError('d', undefined);
    expect(getRecentErrors().map(r => r.message)).toEqual(['text', '{"reason":"x"}', '[object Object]', 'undefined']);
  });

  it(`記録は直近 ${MAX_RECENT} 件だけ（古いものから捨てる）`, () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (let i = 0; i < MAX_RECENT + 5; i++) reportError(`s${i}`, new Error(String(i)));
    const list = getRecentErrors();
    expect(list).toHaveLength(MAX_RECENT);
    expect(list[0].scope).toBe('s5');
    expect(list[MAX_RECENT - 1].scope).toBe(`s${MAX_RECENT + 4}`);
  });

  it('開発ビルドでは console.warn にも出す', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const e = new Error('boom');
    reportError('chunk.prefetch', e);
    expect(warn).toHaveBeenCalledWith('[chunk.prefetch]', e);
  });
});

describe('logRejection：.catch(() => {}) の置き換え', () => {
  it('拒否された Promise を undefined で解決し（従来と同じ）、失敗は記録する', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const value = await Promise.reject(new Error('offline')).catch(logRejection('feedback.flush'));
    expect(value).toBeUndefined();
    expect(getRecentErrors().map(r => [r.scope, r.message])).toEqual([['feedback.flush', 'offline']]);
  });

  it('成功した Promise には何もしない', async () => {
    await expect(Promise.resolve(42).catch(logRejection('x'))).resolves.toBe(42);
    expect(getRecentErrors()).toEqual([]);
  });
});
