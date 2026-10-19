import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyQuizResult, buildRangeQuiz, clampRange, COUNT_OPTIONS, DEFAULT_PREFS, rangeWords, readQuizPrefs, readQuizRecord, wordNumbers, writeQuizPrefs } from '../src/data/vocabQuiz';
import { launchCueSchedule, SWELL_LEAD_MS } from '../src/battle/audio/launchSfx';

/** e2j しか無い語（熟語レベルと同じ）を混ぜて、向きの指定で語が抜けないことも確かめる */
const mk = (i: number, level = 'lv1', both = true) => ({
  id: `${level}:${i}`, word: `word${i}`, level,
  questions: [
    { id: `${level}:${i}:e2j`, prompt: '', label: `word${i}`, options: ['a', 'b', 'c', 'd'], answerIndex: 0 },
    ...(both ? [{ id: `${level}:${i}:j2e`, prompt: '', label: `意味${i}`, options: ['a', 'b', 'c', 'd'], answerIndex: 1 }] : []),
  ],
}) as never;
const words = [...Array.from({ length: 205 }, (_, i) => mk(i + 1, 'lv1', i % 3 !== 0)), ...Array.from({ length: 30 }, (_, i) => mk(i + 1, 'lv2'))];

describe('英単語：出題の設定（範囲・問題数・順番・出す語）', () => {
  afterEach(() => { vi.unstubAllGlobals(); });
  const block = rangeWords(words, 'lv1', 1, 100);
  const ids = (q: { wordId: string }[]) => q.map(x => x.wordId);

  it('番号はレベルごとに 1 から、データの並びのまま', () => {
    const no = wordNumbers(words);
    expect(no.get('lv1:1')).toBe(1);
    expect(no.get('lv1:205')).toBe(205);
    expect(no.get('lv2:1')).toBe(1);
  });

  it('範囲 No.◯〜◯ を取り出す（逆・はみ出しは直す）', () => {
    expect(rangeWords(words, 'lv1', 11, 20).map((w: { id: string }) => w.id)).toEqual(Array.from({ length: 10 }, (_, i) => `lv1:${i + 11}`));
    expect(clampRange(300, 150, 205)).toEqual([150, 205]);
    expect(clampRange(0, 5, 205)).toEqual([1, 5]);
  });

  it('問題数を選べる（10/20/30/50/100/全部）', () => {
    expect(COUNT_OPTIONS).toEqual([10, 20, 30, 50, 100, 'all']);
    for (const c of [10, 20, 30, 50, 100] as const) expect(buildRangeQuiz(block, { count: c, order: 'random', only: 'all' }, { seed: 3 }).items).toHaveLength(c);
    expect(buildRangeQuiz(rangeWords(words, 'lv1', 1, 205), { count: 'all', order: 'number', only: 'all' }).items).toHaveLength(205);
    // 範囲より多い問題数は範囲の語数まで
    expect(buildRangeQuiz(rangeWords(words, 'lv1', 1, 15), { count: 50, order: 'random', only: 'all' }, { seed: 1 }).items).toHaveLength(15);
  });

  it('番号順 × まだの語だけ：解くたびに続きの番号から出て、100語に抜けが出ない', () => {
    let rec = { version: 1 as const, missed: [] as string[], best: {}, mastered: [] as string[] };
    const seen = new Set<string>();
    for (let round = 0; round < 5; round++) {
      const { items } = buildRangeQuiz(block, { count: 20, order: 'number', only: 'unlearned' }, { mastered: new Set(rec.mastered), seed: round + 1 });
      expect(items.map(x => x.wordId)).toEqual(Array.from({ length: 20 }, (_, i) => `lv1:${round * 20 + i + 1}`));
      items.forEach(x => seen.add(x.wordId));
      rec = applyQuizResult(rec, items.map(x => ({ wordId: x.wordId, correct: true })), 'lv1:1-100');
    }
    expect(seen.size).toBe(100);
    // 全部覚えたら、すべての語から出す
    const done = buildRangeQuiz(block, { count: 10, order: 'number', only: 'unlearned' }, { mastered: new Set(rec.mastered) });
    expect(done.allLearned).toBe(true);
    expect(done.items).toHaveLength(10);
  });

  it('間違えた語は ✓ が外れて、次の番号順でまた先頭に出る', () => {
    let rec = { version: 1 as const, missed: [] as string[], best: {}, mastered: [] as string[] };
    const first = buildRangeQuiz(block, { count: 10, order: 'number', only: 'unlearned' }).items;
    rec = applyQuizResult(rec, first.map((x, i) => ({ wordId: x.wordId, correct: i !== 3 })), 'k');
    const next = buildRangeQuiz(block, { count: 10, order: 'number', only: 'unlearned' }, { mastered: new Set(rec.mastered) }).items;
    expect(next[0]!.wordId).toBe('lv1:4');
    expect(next[1]!.wordId).toBe('lv1:11');
    expect(rec.missed).toEqual(['lv1:4']);
  });

  it('ランダムは重複なし・範囲の中だけ', () => {
    const q = buildRangeQuiz(rangeWords(words, 'lv1', 51, 100), { count: 30, order: 'random', only: 'all' }, { seed: 7 }).items;
    expect(new Set(ids(q)).size).toBe(30);
    expect(q.every(x => { const n = Number(x.wordId.split(':')[1]); return n >= 51 && n <= 100; })).toBe(true);
  });

  it('向きを指定しても、その向きの問題が無い語を飛ばさない', () => {
    const list = rangeWords(words, 'lv1', 1, 10);
    for (const dir of ['mix', 'e2j', 'j2e'] as const) {
      const q = buildRangeQuiz(list, { count: 'all', order: 'number', only: 'all' }, { dir, seed: 2 }).items;
      expect(ids(q)).toEqual(list.map((w: { id: string }) => w.id));
      if (dir === 'j2e') expect(q.filter(x => x.dir === 'j2e').length).toBeGreaterThan(0);
    }
  });

  it('番号が問題に付く', () => {
    const q = buildRangeQuiz(rangeWords(words, 'lv1', 11, 20), { count: 'all', order: 'random', only: 'all' }, { seed: 4, numbers: wordNumbers(words) }).items;
    expect(q.map(x => x.no).sort((a, b) => a! - b!)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  });

  it('設定は保存され、壊れた値は既定に戻る', () => {
    const records = new Map<string, string>();
    const store = { getItem: (k: string) => records.get(k) ?? null, setItem: (k: string, v: string) => { records.set(k, v); }, removeItem: (k: string) => { records.delete(k); } };
    vi.stubGlobal('localStorage', store); vi.stubGlobal('window', { localStorage: store });
    expect(readQuizPrefs('u')).toEqual(DEFAULT_PREFS);
    writeQuizPrefs('u', { count: 30, order: 'random', only: 'all', ranges: { lv1: [101, 200] } });
    expect(readQuizPrefs('u')).toEqual({ count: 30, order: 'random', only: 'all', ranges: { lv1: [101, 200] } });
    records.set('vocab_quiz_prefs_v1_u', JSON.stringify({ count: 7, order: 'x', ranges: { lv1: ['a', 2] } }));
    expect(readQuizPrefs('u')).toEqual(DEFAULT_PREFS);
  });

  it('古い記録（mastered が無い）も読める', () => {
    const records = new Map([['vocab_quiz_v1_old', JSON.stringify({ version: 1, missed: ['a'], best: { 'lv1:0': 7 } })]]);
    const store = { getItem: (k: string) => records.get(k) ?? null, setItem: (k: string, v: string) => { records.set(k, v); }, removeItem: (k: string) => { records.delete(k); } };
    vi.stubGlobal('localStorage', store); vi.stubGlobal('window', { localStorage: store });
    expect(readQuizRecord('old')).toEqual({ version: 1, missed: ['a'], best: { 'lv1:0': 7 }, mastered: [] });
  });
});

describe('起動の効果音のタイミング', () => {
  it('きらきら → タイトルの1.3秒前に すーっ → タイトルで ふわっ', () => {
    expect(launchCueSchedule(3400)).toEqual([
      { name: 'open_shimmer', at: 0 }, { name: 'title_swell', at: 3400 - SWELL_LEAD_MS }, { name: 'title_bloom', at: 3400 },
    ]);
  });
  it('間が短いとき（動きを減らす設定）は すーっ を省く', () => {
    expect(launchCueSchedule(1100).map(c => c.name)).toEqual(['open_shimmer', 'title_bloom']);
  });
});
