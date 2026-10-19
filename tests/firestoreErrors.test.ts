import { describe, expect, it } from 'vitest';
import { isPermissionDenied, toFriendlyFirestoreError } from '../src/utils/firestoreErrors';

/**
 * R-01: friends.ts / classroom.ts の Firestore エラー変換を共通化した。
 * 共通化しても「表にあるコード → 表の文言」「表に無いコード → fallback（＋message）」が
 * 以前の switch 文と同じになることを確かめる。
 */
describe('firestoreErrors: Firestore エラーの日本語化（共通処理）', () => {
  const table = { 'permission-denied': 'だめです', unavailable: 'つながりません' };

  it('表にあるコードは表の文言になる', () => {
    expect(toFriendlyFirestoreError({ code: 'permission-denied', message: 'x' }, 'FB', table).message).toBe('だめです');
    expect(toFriendlyFirestoreError({ code: 'unavailable' }, 'FB', table).message).toBe('つながりません');
  });

  it('表に無いコードは fallback（message があれば括弧で添える）', () => {
    expect(toFriendlyFirestoreError({ code: 'aborted', message: 'boom' }, 'FB', table).message).toBe('FB（boom）');
    expect(toFriendlyFirestoreError({ code: 'aborted' }, 'FB', table).message).toBe('FB');
    expect(toFriendlyFirestoreError(null, 'FB', table).message).toBe('FB');
    expect(toFriendlyFirestoreError(undefined, 'FB', table).message).toBe('FB');
  });

  it('Object.prototype のキー（toString など）は表の文言扱いしない', () => {
    expect(toFriendlyFirestoreError({ code: 'toString' }, 'FB', table).message).toBe('FB');
  });

  it('isPermissionDenied は permission-denied のときだけ true', () => {
    expect(isPermissionDenied({ code: 'permission-denied' })).toBe(true);
    expect(isPermissionDenied({ code: 'unavailable' })).toBe(false);
    expect(isPermissionDenied(null)).toBe(false);
  });
});
