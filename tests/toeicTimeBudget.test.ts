import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  buildToeicPageBudgets,
  calcToeicPageElapsedProgress,
  classifyToeicSkill,
  formatToeicBudgetTime,
  TOEIC_TIME_PRESETS,
} from '../src/components/toeic/toeicTimeBudget';

describe('TOEIC Part 5 page time budgets', () => {
  it('calculates target and limit lines from each page composition', () => {
    const pageKinds = [
      ['語彙', '語彙', '品詞', '文法', '文法', '文法'],
      ['語彙', '語彙', '品詞', '文法', '文法', '文法'],
      ['語彙', '語彙', '品詞', '品詞', '文法', '文法'],
      ['語彙', '語彙', '品詞', '文法', '文法', '文法'],
      ['語彙', '語彙', '品詞', '文法', '文法', '文法'],
    ];
    const budgets = buildToeicPageBudgets(pageKinds.map((page) => page.map((skill) => ({ skill }))));

    expect(budgets.map((page) => page.targetSec)).toEqual([104, 104, 100, 104, 104]);
    expect(budgets.map((page) => formatToeicBudgetTime(page.targetRemainingSec))).toEqual(['8:16', '6:32', '4:52', '3:08', '1:24']);
    expect(budgets.map((page) => formatToeicBudgetTime(page.limitRemainingSec))).toEqual(['8:00', '6:00', '4:00', '2:00', '0:00']);
    expect(budgets.reduce((sum, page) => sum + page.counts.語彙, 0)).toBe(10);
    expect(budgets.reduce((sum, page) => sum + page.counts.品詞, 0)).toBe(6);
    expect(budgets.reduce((sum, page) => sum + page.counts.文法, 0)).toBe(14);
  });

  it('recalculates total slack when page one contains six part-of-speech questions', () => {
    const pageKinds = [
      Array(6).fill('品詞'),
      ['語彙', '品詞', '文法', '文法', '文法', '文法'],
      ['語彙', '語彙', '語彙', '品詞', '文法', '文法'],
      ['語彙', '語彙', '語彙', '品詞', '文法', '文法'],
      ['語彙', '語彙', '品詞', '文法', '文法', '文法'],
    ];
    const budgets = buildToeicPageBudgets(pageKinds.map((page) => page.map((skill) => ({ skill }))));
    const totalTarget = budgets.reduce((sum, page) => sum + page.targetSec, 0);
    const overallSlack = budgets[budgets.length - 1]?.targetRemainingSec;

    expect(budgets[0]?.counts).toEqual({ 品詞: 6, 文法: 0, 語彙: 0 });
    expect(budgets[0]?.targetSec).toBe(48);
    expect(totalTarget).toBe(482);
    expect(overallSlack).toBe(118);
    expect(formatToeicBudgetTime(overallSlack ?? 0)).toBe('1:58');
  });

  it('treats missing and other existing labels as grammar', () => {
    expect(classifyToeicSkill(undefined)).toBe('文法');
    expect(classifyToeicSkill('未登録の分類')).toBe('文法');
    for (const label of ['動詞の形', '前置詞', '接続詞', '代名詞', '関係詞', '比較']) {
      expect(classifyToeicSkill(label)).toBe('文法');
    }
    expect(classifyToeicSkill('句動詞・コロケーション')).toBe('語彙');
  });

  it('keeps the configured standard rates and labels provisional presets clearly', () => {
    expect(TOEIC_TIME_PRESETS.standard.seconds).toEqual({ 品詞: 8, 文法: 12, 語彙: 30 });
    expect(TOEIC_TIME_PRESETS.standard.label).toContain('800点前後を想定した目安');
    expect(TOEIC_TIME_PRESETS.slow.label).toContain('仮');
    expect(TOEIC_TIME_PRESETS.advanced.label).toContain('仮');
  });

  it('calculates current elapsed progress percentage and pace tone for the page bar', () => {
    const start = calcToeicPageElapsedProgress(0, 104, 120);
    expect(start).toMatchObject({ elapsedSec: 0, elapsedPct: 0, tone: 'ahead' });
    expect(start.targetPct).toBeCloseTo((104 / 120) * 100, 4);
    expect(start.slackWidthPct).toBeCloseTo((16 / 120) * 100, 4);

    const mid = calcToeicPageElapsedProgress(60, 104, 120);
    expect(mid).toMatchObject({ elapsedSec: 60, elapsedPct: 50, tone: 'ahead' });

    const slack = calcToeicPageElapsedProgress(110, 104, 120);
    expect(slack.tone).toBe('slack');
    expect(slack.elapsedPct).toBeCloseTo((110 / 120) * 100, 4);

    const over = calcToeicPageElapsedProgress(150, 104, 120);
    expect(over).toMatchObject({ elapsedSec: 150, elapsedPct: 100, tone: 'over' });
  });

  it('renders elapsed time readout, fill bar, and current position markers in TOEIC timers', () => {
    const timer = readFileSync(new URL('../src/components/toeic/ToeicTimer.tsx', import.meta.url), 'utf8');
    const quiz = readFileSync(new URL('../src/components/toeic/ToeicPageQuiz.tsx', import.meta.url), 'utf8');
    const css = readFileSync(new URL('../src/components/toeic/toeic-page.css', import.meta.url), 'utf8');

    expect(timer).toContain('data-toeic-timer-elapsed');
    expect(timer).toContain('data-toeic-timer-head');
    expect(quiz).toContain('data-toeic-page-elapsed');
    expect(quiz).toContain('data-toeic-budget-progress');
    expect(quiz).toContain('data-toeic-budget-now');

    const sizes = [...css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1]));
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(12);
  });
});
