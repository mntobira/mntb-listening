/**
 * 単語帳の読み方表示（2026-11-03）
 *   ・vocabPron.json の全語が正しい形で、発音記号に直せる
 *   ・強く読む音節は音節の範囲内。音節をつなぐと見出し語に戻る
 *   ・4択の解説に 🔊（英→日・日→英どちらも）
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseVocabPron, pronOf } from '../src/utils/vocabPron';

const vocab = JSON.parse(readFileSync('public/data/listeningVocabulary.json', 'utf8')) as { words: { id: string; word: string }[] };
const table = parseVocabPron(JSON.parse(readFileSync('public/data/vocabPron.json', 'utf8')));

describe('単語帳の読み方データ', () => {
  it('ほぼ全語にある（辞書に無い語は表示しないだけ）', () => {
    const n = vocab.words.filter(w => table[w.id]).length;
    expect(n).toBeGreaterThan(vocab.words.length * 0.99);
  });
  it('どの語も発音記号に直せて、音節と強勢がそろっている', () => {
    for (const w of vocab.words) {
      if (!table[w.id]) continue;
      const p = pronOf(table, w.id, w.word)!;
      expect(p, w.word).not.toBeNull();
      expect(p.ipa.length, w.word).toBeGreaterThan(0);
      expect(p.syl.join(''), w.word).toBe(w.word);
      if (p.stress >= 0) expect(p.stress, w.word).toBeLessThan(p.syl.length);
    }
  });
  it('代表的な語', () => {
    const get = (word: string) => { const w = vocab.words.find(x => x.word === word)!; return pronOf(table, w.id, w.word)!; };
    expect(get('population').syl).toEqual(['pop', 'u', 'la', 'tion']);
    expect(get('population').stress).toBe(2);
    expect(get('conference').stress).toBe(0);
    expect(get('will').ipa).toBe('wɪl');
  });
  it('壊れたデータは空として扱う', () => {
    expect(parseVocabPron(null)).toEqual({});
    expect(parseVocabPron({ words: { a: [1, 2, 3] } })).toEqual({});
  });
});

describe('画面', () => {
  it('4択の解説に、向きに関係なく発音ボタンがある', () => {
    const src = readFileSync('src/components/VocabQuiz.tsx', 'utf8');
    expect(src).toMatch(/className="vq-say"[^>]*onClick=\{\(\) => sayWord\(it\.wordId, it\.word\)\}/);
  });
  it('単語帳は読み方を出す（強勢の下線・音節・発音記号）', () => {
    const src = readFileSync('src/components/FoundationWords.tsx', 'utf8');
    expect(src).toContain('data-vocab-pron');
    expect(src).toContain('fd-acc');
    const css = readFileSync('src/components/foundation.css', 'utf8');
    expect(css).toMatch(/\.vq-say \{[^}]*min-height: 44px/);
  });
});
