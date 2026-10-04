import { describe, it, expect, beforeEach } from 'vitest';
import { groupReviewItems, captureWrongAnswers, loadReviewList, applyReviewRetry } from '../src/utils/reviewList';

const store: Record<string, string> = {};
beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  (globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; } };
});

describe('review note groups wrong sub-questions per problem (2026-10-04)', () => {
  it('keeps only the wrong sub-questions and puts them on one card', () => {
    captureWrongAnswers('u', [5, 2, 3].map(n => ({ chapterId: 'eg6_1', questionId: 'q1', subQuestionId: `q1_${n}`, subLabel: `問${n}` })));
    captureWrongAnswers('u', [{ chapterId: 'eg6_1', questionId: 'q2', subQuestionId: 'q2_4', subLabel: '問4' }]);
    const groups = groupReviewItems(loadReviewList('u'));
    expect(groups).toHaveLength(2);
    expect(groups[0].subQuestionIds).toEqual(['q1_2', 'q1_3', 'q1_5']);
    expect(groups[1].subQuestionIds).toEqual(['q2_4']);
  });
  it('moves the sub-questions answered correctly in the retry forward', () => {
    captureWrongAnswers('u', [1, 2].map(n => ({ chapterId: 'c', questionId: 'q', subQuestionId: `q_${n}` })));
    applyReviewRetry('u', 'c', 'q', [{ subQuestionId: 'q_1', correct: true }, { subQuestionId: 'q_2', correct: false }]);
    const byId = Object.fromEntries(loadReviewList('u').map(it => [it.subQuestionId, it]));
    expect(byId.q_1.box).toBe(1);
    expect(byId.q_2.box).toBe(0);
  });
});

import { applyReviewFocus } from '../src/utils/reviewFocus';
describe('review focus narrows the problem to the wrong sub-questions only', () => {
  it('keeps only 問4 of 問1〜5', () => {
    const problems = [{ id: 'q1', subQuestions: [1, 2, 3, 4, 5].map(n => ({ id: `q1_${n}` })) }, { id: 'q2', subQuestions: [{ id: 'q2_1' }] }];
    const out = applyReviewFocus(problems, 'c', { chapterId: 'c', questionId: 'q1', subQuestionIds: ['q1_4'] });
    expect(out[0].subQuestions!.map(s => s.id)).toEqual(['q1_4']);
    expect(out[1]).toBe(problems[1]);
    expect(problems[0].subQuestions).toHaveLength(5);
  });
});
