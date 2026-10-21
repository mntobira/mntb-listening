import { describe, it, expect } from 'vitest';
import { resolveQuizRange } from '../src/utils/quizRange';
import { readCode } from './helpers/sourceScan';

/** C-02：Quiz.tsx から移した「今回解く範囲」の計算（分離前と同じ丸め方） */
describe('resolveQuizRange', () => {
  it('範囲なし＝章の全問', () => {
    expect(resolveQuizRange(14, null, 3)).toEqual({ rangeStart: 0, rangeEnd: 13, rangeCount: 14, rangePosition: 4 });
  });
  it('1回だけ（第3回）', () => {
    expect(resolveQuizRange(14, { startIndex: 2, endIndex: 2 }, 2)).toEqual({ rangeStart: 2, rangeEnd: 2, rangeCount: 1, rangePosition: 1 });
  });
  it('配列の外を指す範囲は丸める（データが減っても落ちない）', () => {
    expect(resolveQuizRange(5, { startIndex: 9, endIndex: 20 }, 0)).toEqual({ rangeStart: 4, rangeEnd: 4, rangeCount: 1, rangePosition: 1 });
    expect(resolveQuizRange(5, { startIndex: -3, endIndex: 1 }, 1)).toEqual({ rangeStart: 0, rangeEnd: 1, rangeCount: 2, rangePosition: 2 });
    expect(resolveQuizRange(0, null, 0)).toEqual({ rangeStart: 0, rangeEnd: 0, rangeCount: 1, rangePosition: 1 });
  });
  it('位置は 1〜範囲内の問題数に収める', () => {
    expect(resolveQuizRange(10, { startIndex: 3, endIndex: 5 }, 9).rangePosition).toBe(3);
    expect(resolveQuizRange(10, { startIndex: 3, endIndex: 5 }, 0).rangePosition).toBe(1);
  });
});

describe('quizNavigationActions はフックを持たない（Quiz のフックの数・順を変えない）', () => {
  it('use〇〇( の呼び出しが無い', () => {
    expect(readCode('src/utils/quizNavigationActions.ts').match(/\buse[A-Z][A-Za-z]*\s*\(/g) ?? []).toEqual([]);
  });
});
