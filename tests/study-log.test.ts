import { describe, it, expect, beforeEach } from 'vitest';
import { recordStudyLog, loadStudyLog, groupStudyLogByDay } from '../src/utils/studyLog';

const store: Record<string, string> = {};
beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  (globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; } };
});

describe('study log (recent 3 days, study + battle)', () => {
  it('merges sub-questions of the same problem and keeps only the last 3 days', () => {
    const now = new Date(2026, 9, 10, 12).getTime();
    recordStudyLog('u', { key: 's:c:q', kind: 'study', at: now - 1000, title: '第1章', items: [{ id: 'q_1', label: '問1', correct: true }] }, now);
    recordStudyLog('u', { key: 's:c:q', kind: 'study', at: now, title: '第1章', items: [{ id: 'q_2', label: '問2', correct: false, answer: '②' }] }, now);
    recordStudyLog('u', { key: 'b:1', kind: 'battle', at: now - 4 * 86400000, title: '古い対戦', items: [] }, now - 4 * 86400000);
    const list = loadStudyLog('u', now);
    expect(list).toHaveLength(1);
    expect(list[0].items.map(i => i.id)).toEqual(['q_1', 'q_2']);
    const days = groupStudyLogByDay(list, now);
    expect(days[0]).toMatchObject({ label: '今日', solved: 2, wrong: 1 });
  });
});
