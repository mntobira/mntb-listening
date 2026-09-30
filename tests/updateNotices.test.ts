import { describe, it, expect } from 'vitest';
import { parseRemoteNotice, mergeNotices } from '../src/utils/updateNotices';

describe('remote notices (Firestore app_notices)', () => {
  it('accepts a well-formed notice and fills defaults', () => {
    expect(parseRemoteNotice('2026-10-01-01', { date: '2026-10-01', title: ' 新しい回を追加 ', items: ['第3問 第15回', 3, ''] }))
      .toEqual({ id: '2026-10-01-01', date: '2026-10-01', time: '00:00', kind: 'improve', title: '新しい回を追加', items: ['第3問 第15回'] });
  });
  it('rejects broken or unpublished values', () => {
    expect(parseRemoteNotice('x', null)).toBeNull();
    expect(parseRemoteNotice('x', { date: '10/1', title: 'a' })).toBeNull();
    expect(parseRemoteNotice('x', { date: '2026-10-01', title: '' })).toBeNull();
    expect(parseRemoteNotice('bad id!', { date: '2026-10-01', title: 'a' })).toBeNull();
    expect(parseRemoteNotice('x', { date: '2026-10-01', title: 'a', published: false })).toBeNull();
  });
  it('remote overrides bundled notices with the same id', () => {
    const local = [{ id: 'a', date: '2026-01-01', time: '10:00', kind: 'fix' as const, title: 'old', items: [] }];
    const remote = [{ id: 'a', date: '2026-01-01', time: '10:00', kind: 'fix' as const, title: 'new', items: [] }, { id: 'b', date: '2026-02-01', time: '10:00', kind: 'feature' as const, title: 'b', items: [] }];
    expect(mergeNotices(local, remote).map(n => n.title)).toEqual(['new', 'b']);
  });
});
