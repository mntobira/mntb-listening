import { describe, it, expect } from 'vitest';
import { readCode } from './helpers/sourceScan';

/**
 * Quiz の Rules of Hooks（フックは毎回同じ数・同じ順で呼ぶ）を固定する。
 *
 * 以前は「問題が0件なら return」がフック呼び出しの途中にあり、
 * 問題が空 → 非空に変わるとフックの数が変わって React がクラッシュする構造だった。
 * 早期 return より後ろにフック呼び出しが1つも無いことを、コメントを除いたコードで確かめる。
 */
describe('Quiz のフック呼び出し順', () => {
  const code = readCode('src/components/Quiz.tsx');
  const body = code.slice(code.indexOf('export function Quiz('));
  const earlyReturn = body.indexOf('if (questions.length === 0)');

  it('問題が0件のときの早期 return がある', () => {
    expect(earlyReturn).toBeGreaterThan(0);
  });

  it('早期 return より後ろでフックを呼んでいない', () => {
    const after = body.slice(earlyReturn);
    const hookCall = /\buse[A-Z][A-Za-z]*\s*\(/g;
    expect(after.match(hookCall) ?? []).toEqual([]);
  });

  it('早期 return より前にすべてのフックが並んでいる（主要なものが前にある）', () => {
    const before = body.slice(0, earlyReturn);
    for (const hook of ['useQuestionDerived(', 'usePreventZoom(', 'currentQuestionRef = useRef']) {
      expect(before, hook).toContain(hook);
    }
  });
});
