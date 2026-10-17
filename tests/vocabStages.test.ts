import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyQuizResult, blockStages, blockWords, buildQuiz, buildStageQuiz, nextStage, readQuizRecord, STAGE_SIZE, wordNumbers } from '../src/data/vocabQuiz';
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

describe('英単語：番号順のステージ（抜けなく覚える）', () => {
  afterEach(() => { vi.unstubAllGlobals(); });
  it('番号はレベルごとに 1 から、データの並びのまま', () => {
    const no = wordNumbers(words);
    expect(no.get('lv1:1')).toBe(1);
    expect(no.get('lv1:205')).toBe(205);
    expect(no.get('lv2:1')).toBe(1);
  });

  it('100語＝10ステージ。No.1〜10, 11〜20 … と番号順', () => {
    const st = blockStages(blockWords(words, 'lv1', 0), 0, new Set());
    expect(st).toHaveLength(10);
    expect(st.map(s => [s.from, s.to])).toEqual(Array.from({ length: 10 }, (_, i) => [i * 10 + 1, i * 10 + 10]));
    // 2つ目のまとまりは No.101 から
    expect(blockStages(blockWords(words, 'lv1', 1), 1, new Set())[0]).toMatchObject({ from: 101, to: 110 });
    // 端数のまとまり（201〜205）
    expect(blockStages(blockWords(words, 'lv1', 2), 2, new Set())).toEqual([expect.objectContaining({ from: 201, to: 205 })]);
  });

  it('ステージは10語を必ず全部出す（どの向きでも・何度でも）', () => {
    const list = blockWords(words, 'lv1', 0).slice(0, STAGE_SIZE);
    for (const dir of ['mix', 'e2j', 'j2e'] as const) for (let seed = 1; seed <= 30; seed++) {
      const q = buildStageQuiz(list, { dir, seed });
      expect(q).toHaveLength(10);
      expect(new Set(q.map(x => x.wordId))).toEqual(new Set(list.map((w: { id: string }) => w.id)));
    }
  });

  it('ステージを順に解けば 100語すべてに出会う（ランダム10問だけでは残る語がある）', () => {
    const block = blockWords(words, 'lv1', 0);
    const seen = new Set<string>();
    for (let s = 0; s < 10; s++) buildStageQuiz(block.slice(s * 10, s * 10 + 10), { seed: s + 1 }).forEach(x => seen.add(x.wordId));
    expect(seen.size).toBe(100);
    const randomSeen = new Set<string>();
    for (let s = 0; s < 10; s++) buildQuiz(block, { seed: s + 1 }).forEach(x => randomSeen.add(x.wordId));
    expect(randomSeen.size).toBeLessThan(100);
  });

  it('番号が問題に付く', () => {
    const list = blockWords(words, 'lv1', 0).slice(10, 20);
    const q = buildStageQuiz(list, { seed: 4, numbers: wordNumbers(words) });
    expect(q.map(x => x.no).sort((a, b) => a! - b!)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  });

  it('正解で ✓、間違えると ✓ が外れる。10語とも ✓ でクリア、続きは次のステージ', () => {
    let rec = readQuizRecord('test-nobody');
    expect(rec.mastered).toEqual([]);
    const block = blockWords(words, 'lv1', 0);
    const first = block.slice(0, 10).map((w: { id: string }) => w.id);
    rec = applyQuizResult(rec, first.map((id, i) => ({ wordId: id, correct: i !== 3 })), 'lv1:0:s0');
    let st = blockStages(block, 0, new Set(rec.mastered));
    expect(st[0]).toMatchObject({ learned: 9, cleared: false });
    expect(nextStage(st)).toBe(0);
    expect(rec.missed).toEqual([first[3]]);
    rec = applyQuizResult(rec, [{ wordId: first[3]!, correct: true }], 'lv1:0:s0');
    st = blockStages(block, 0, new Set(rec.mastered));
    expect(st[0]!.cleared).toBe(true);
    expect(nextStage(st)).toBe(1);
    rec = applyQuizResult(rec, [{ wordId: first[0]!, correct: false }], 'lv1:0');
    expect(blockStages(block, 0, new Set(rec.mastered))[0]!.cleared).toBe(false);
  });

  it('ランダム10問は ✓ がまだの語を先に出す', () => {
    const block = blockWords(words, 'lv1', 0);
    const notYet = block.slice(90).map((w: { id: string }) => w.id);
    const q = buildQuiz(block, { prefer: notYet, seed: 9 });
    expect(new Set(q.map(x => x.wordId))).toEqual(new Set(notYet));
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
