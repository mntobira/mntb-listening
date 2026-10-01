import { describe, expect, it } from 'vitest';
import { applyQuizResult, blockCount, blockWords, buildQuiz, quizComment } from '../src/data/vocabQuiz';
import { streakDoors, tobiraMood } from '../src/data/tobiraMood';
import { bonusMissionsForDate, BONUS_MISSIONS_PER_DAY } from '../src/battle/core/growth';

const mk = (i: number) => ({
  id: `w${i}`, word: `word${i}`, level: 'basic',
  questions: [
    { id: `w${i}:e2j`, prompt: '', options: ['a', 'b', 'c', 'd'], answerIndex: 0 },
    { id: `w${i}:j2e`, prompt: '', options: ['a', 'b', 'c', 'd'], answerIndex: 1 },
  ],
}) as never;
const words = Array.from({ length: 250 }, (_, i) => mk(i + 1));

describe('英単語の4択', () => {
  it('10問・重複なし・間違えた語が先頭', () => {
    const q = buildQuiz(words, { missed: ['w7', 'w9'], seed: 3 });
    expect(q).toHaveLength(10);
    expect(new Set(q.map(x => x.wordId)).size).toBe(10);
    expect(q.slice(0, 2).map(x => x.wordId).sort()).toEqual(['w7', 'w9']);
  });
  it('向きを指定できる', () => {
    expect(buildQuiz(words, { dir: 'j2e', seed: 1 }).every(x => x.dir === 'j2e')).toBe(true);
    expect(buildQuiz(words, { dir: 'e2j', seed: 1 }).every(x => x.dir === 'e2j')).toBe(true);
  });
  it('100語ブロック', () => {
    expect(blockCount(words, 'basic')).toBe(3);
    expect(blockWords(words, 'basic', 2)).toHaveLength(50);
  });
  it('記録: 正解で復習から外れ、最高点は下がらない', () => {
    let r = { version: 1 as const, missed: ['w1'], best: {} as Record<string, number> };
    r = applyQuizResult(r, [{ wordId: 'w1', correct: true }, { wordId: 'w2', correct: false }], 'basic:0');
    expect(r.missed).toEqual(['w2']);
    expect(r.best['basic:0']).toBe(1);
    r = applyQuizResult(r, [{ wordId: 'w2', correct: false }], 'basic:0');
    expect(r.best['basic:0']).toBe(1);
  });
  it('0点でも次の一手を言う', () => {
    expect(quizComment(0)).toMatch(/単語帳/);
    expect(quizComment(10)).toMatch(/次の100語/);
  });
});

describe('とびら君の気分', () => {
  it('状態ごとに変わる', () => {
    expect(tobiraMood({ screen: 'home', firstVisit: true }).mood).toBe('first');
    expect(tobiraMood({ screen: 'home', daysAway: 5 }).mood).toBe('away');
    expect(tobiraMood({ screen: 'home', dueCount: 2 }).mood).toBe('review');
    expect(tobiraMood({ screen: 'home', streak: 4 }).mood).toBe('streak');
    expect(tobiraMood({ screen: 'result', outcome: 'lose', margin: -60 }).mood).toBe('close');
    expect(tobiraMood({ screen: 'result', outcome: 'lose', margin: -600 }).mood).toBe('lose');
    expect(tobiraMood({ screen: 'result', outcome: 'win' }).mood).toBe('win');
  });
  it('連続日数は扉7枚まで', () => {
    expect(streakDoors(3)).toEqual({ doors: 3, extra: 0 });
    expect(streakDoors(10)).toEqual({ doors: 7, extra: 3 });
  });
});

describe('ボーナスミッション', () => {
  it('毎日5つ・英単語を含む・重複なし', () => {
    for (const d of ['2026-10-01', '2026-10-02', '2026-12-31']) {
      const m = bonusMissionsForDate(d);
      expect(m).toHaveLength(BONUS_MISSIONS_PER_DAY);
      expect(new Set(m.map(x => x.id)).size).toBe(5);
      expect(m.some(x => x.kind.startsWith('vocab_'))).toBe(true);
    }
  });
});
