import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { CHAPTER_SIZE, chapterState, groupBlocks, nextChapter, splitChapters } from '../src/data/vocabChapters';

const ids = Array.from({ length: 1185 }, (_, i) => `w${i + 1}`);

describe('英単語の分け方（レベル → 100語 → 20語の章）', () => {
  it('20語ずつの章に分け、最後の章は端数', () => {
    const ch = splitChapters(ids, new Set());
    expect(CHAPTER_SIZE).toBe(20);
    expect(ch.length).toBe(60);
    expect(ch[0]).toMatchObject({ index: 0, from: 1, to: 20 });
    expect(ch[59]).toMatchObject({ from: 1181, to: 1185 });
    expect(ch.flatMap(c => c.ids)).toEqual(ids);
  });
  it('5章（100語）ずつのまとまりにする', () => {
    const b = groupBlocks(splitChapters(ids, new Set()));
    expect(b.length).toBe(12);
    expect(b[0]).toMatchObject({ from: 1, to: 100, total: 100 });
    expect(b[11]).toMatchObject({ from: 1101, to: 1185, total: 85 });
  });
  it('「続きから」は覚えきっていない最初の章', () => {
    const known = new Set(ids.slice(0, 45));
    const ch = splitChapters(ids, known);
    expect(nextChapter(ch)).toBe(2);
    expect(chapterState(ch[0])).toBe('done');
    expect(chapterState(ch[2])).toBe('doing');
    expect(chapterState(ch[3])).toBe('new');
    expect(nextChapter(splitChapters(ids.slice(0, 40), new Set(ids)))).toBe(1);
  });
  it('単語画面が章の地図を使う（「第154章」のような通し番号の一覧にしない）', () => {
    const src = readFileSync('src/components/FoundationWords.tsx', 'utf8');
    expect(src).toContain('splitChapters');
    expect(src).toContain('data-fd-map');
    expect(src).toContain('続きから');
  });
});
