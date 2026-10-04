/**
 * 英文法 第1〜20章（4択1163問）の取り込み検査
 *   第1〜16章 729問（2026-10-03 改訂版）＋第17〜19章 290問・会話表現 144問（2026-10-04 追加）
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { EG_V3_ITEMS } from '../src/data/egV3Items.generated';
import { getAllGrammarChapters } from '../src/data/englishGrammarData';
import { loadPool } from '../src/battle/data/battlePool';

const MARKS = ['①', '②', '③', '④'];

describe('英文法 改訂版（第1〜20章）', () => {
  it('6つの納品の全1163問が章ごとに入っている', () => {
    expect(EG_V3_ITEMS).toHaveLength(1163);
    const count = (c: number) => EG_V3_ITEMS.filter((x) => x.c === c).length;
    expect([1, 2, 3, 4, 5, 6, 7].map(count)).toEqual([41, 15, 47, 39, 40, 29, 34]);
    expect([8, 9, 10, 11].map(count)).toEqual([58, 72, 74, 83]);
    expect([12, 13, 14, 15, 16].map(count)).toEqual([58, 24, 59, 42, 14]);
    // 2026-10-04 追加：17章 動詞の語法／18章 形容詞・副詞の語法／19章 名詞の語法／20章 会話表現
    expect([17, 18, 19, 20].map(count)).toEqual([175, 70, 45, 144]);
  });

  it('追加章は PART に正しく入る（17〜19章＝語法、20章＝イディオム・表現）', () => {
    const all = getAllGrammarChapters();
    const part = (id: string) => all.find((c) => c.id === id)?.questionGroup;
    expect([17, 18, 19].map((n) => part(`eg6_${n}`))).toEqual(['語法', '語法', '語法']);
    expect(part('eg6_20')).toBe('表現');
    expect(part('eg6_16')).toBe('文法');
  });

  it('どの問題も 4択・正解1つ・選択肢の重複なし・空所1つ・完成文と和訳あり', () => {
    for (const x of EG_V3_ITEMS) {
      expect(new Set(x.o).size).toBe(4);
      expect(x.a).toBeGreaterThanOrEqual(0);
      expect(x.a).toBeLessThan(4);
      expect(x.s.split('______')).toHaveLength(2);
      expect(x.f).not.toContain('______');
      expect(x.tr.trim().length).toBeGreaterThan(0);
    }
  });

  it('解説は全章同じ形：【ポイント】→【選択肢】①〜④（正解だけ ○）', () => {
    for (const x of EG_V3_ITEMS) {
      const i = x.cm.indexOf('【選択肢】');
      expect(x.cm.some((l) => l.startsWith('【ポイント】'))).toBe(true);
      expect(i).toBeGreaterThan(0);
      const rows = x.cm.slice(i + 1, i + 5);
      rows.forEach((row, k) => {
        expect(row.startsWith(`${MARKS[k]} ${x.o[k]}　${k === x.a ? '○' : '×'} `)).toBe(true);
        expect(row.length).toBeGreaterThan(`${MARKS[k]} ${x.o[k]}　○ `.length);
      });
      // 旧形式の見出しが残っていない
      expect(x.cm.join('\n')).not.toMatch(/【訳】|【注意】/);
    }
  });

  it('内部用の番号対応表（教科書番号）はアプリに入っていない', () => {
    // 通し番号は章ごとに 1 から。教科書の番号（例：第8〜11章の 179〜385）や Point 番号は持たない
    //   1〜7章：通し 1〜245 ／ 8〜11章：章ごとに 1〜 ／ 12〜16章：通し 1〜197
    const nos = (from: number, to: number) => EG_V3_ITEMS.filter((x) => x.c >= from && x.c <= to).map((x) => x.n);
    expect(Math.max(...nos(1, 7))).toBe(245);
    expect(Math.max(...nos(8, 11))).toBe(83);
    expect(Math.max(...nos(12, 16))).toBe(197);
    //   17章：通し 1〜175 ／ 18・19章：章ごとに 1〜 ／ 20章（会話表現）：1〜144 に振り直し（教材の 246〜389 は持たない）
    expect(Math.max(...nos(17, 17))).toBe(175);
    expect(Math.max(...nos(18, 18))).toBe(70);
    expect(Math.max(...nos(19, 19))).toBe(45);
    expect(Math.max(...nos(20, 20))).toBe(144);
    for (const x of EG_V3_ITEMS) expect(Object.keys(x)).not.toContain('point');
    const src = readFileSync('src/data/egV3Items.generated.ts', 'utf8');
    expect(src).not.toMatch(/対応表|原番号|Point\s*\d{3}/);
    expect(readdirSync('scripts/data/grammar_v3').some((f) => /対応表|非公開|内部用/.test(f))).toBe(false);
  });

  it('演習：1回5問・1問ずつ進む・完成文の正解部分に1か所だけマーカー', () => {
    const chapters = getAllGrammarChapters().filter((c) => c.id.startsWith('eg6_'));
    expect(chapters).toHaveLength(20);
    let subs = 0;
    for (const c of chapters) {
      for (const p of c.practiceProblems as any[]) {
        expect(p.stepwise).toBe(true);
        expect(p.audioTracks).toBeUndefined();
        expect(p.subQuestions.length).toBeLessThanOrEqual(5);
        for (const sq of p.subQuestions) {
          subs += 1;
          const body = (p.explanation.split(`<!--sq:${sq.id}-->`)[1] || '').split('<!--sq:')[0];
          expect(body.match(/<mark /g) || []).toHaveLength(1);
          expect(body).toContain('【選択肢】');
        }
      }
    }
    expect(subs).toBe(1163);
  });

  it('対戦：全1163問が元の制限時間と試合後の1行解答つきで出る', async () => {
    const pool = (await loadPool('english_grammar')).filter((q) => q.chapterId.startsWith('eg6_'));
    expect(pool).toHaveLength(1163);
    for (const q of pool) {
      expect([15, 20, 25]).toContain(q.timeLimit);
      expect(q.options).toHaveLength(4);
    }
    const answers = readFileSync('src/battle/data/answer.english_grammar.generated.ts', 'utf8');
    expect(answers).toContain('1163 問');
  });
});
