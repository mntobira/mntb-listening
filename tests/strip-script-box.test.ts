import { it, expect } from 'vitest';
import { englishGrammarData } from '../src/data/englishGrammarData';
import { englishListeningData } from '../src/data/englishListeningData';
import { stripScriptBox } from '../src/utils/listeningExplanation';

// 答え合わせでは英文（スクリプト）を上に出すので、詳しい解説の中の同じ英文の枠は外す（2026-10-04）
it('removes the duplicated script / answer box from every English explanation but keeps the rest', () => {
  let n = 0;
  for (const d of [englishGrammarData as any, englishListeningData as any]) for (const c of d.parts.flatMap((p: any) => p.chapters)) for (const p of [...c.practiceProblems, ...c.miniTest]) {
    const t: string = p.explanation; if (typeof t !== 'string' || !t.includes('background-color:#F2FBFA')) continue; n++;
    const s = stripScriptBox(t);
    expect(s).not.toMatch(/完成した英文|実際に流れた英文/);
    expect(s.length).toBeGreaterThan(t.length * 0.2);
  }
  expect(n).toBeGreaterThan(300);
});
