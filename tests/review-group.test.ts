import { describe, it, expect, beforeEach } from 'vitest';
import { groupReviewItems, captureWrongAnswers, loadReviewList, applyReviewRetry } from '../src/utils/reviewList';

const store: Record<string, string> = {};
beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  (globalThis as { localStorage?: unknown }).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; } };
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
    const out = applyReviewFocus(problems, 'c', { chapterId: 'c', targets: [{ questionId: 'q1', subQuestionIds: ['q1_4'] }] });
    expect(out[0].subQuestions!.map(s => s.id)).toEqual(['q1_4']);
    expect(out).toHaveLength(1);
    expect(problems[0].subQuestions).toHaveLength(5);
  });
});

import { focusedSubIds, normalizeReviewFocus } from '../src/utils/reviewFocus';
describe('「間違えた問題だけ解き直す」は間違えた大問・小問だけを出す（2026-10-16 不具合修正）', () => {
  const problems = [
    { id: 'q1', subQuestions: [{ id: 'q1_1' }, { id: 'q1_2' }] },
    { id: 'q2', subQuestions: [{ id: 'q2_1' }] },
    { id: 'q3', subQuestions: [{ id: 'q3_1' }, { id: 'q3_2' }, { id: 'q3_3' }] },
  ];
  const focus = { chapterId: 'c', targets: [
    { questionId: 'q1', subQuestionIds: ['q1_2'] },
    { questionId: 'q3', subQuestionIds: ['q3_1', 'q3_3'] },
  ] };
  it('全部正解の大問は出さず、間違えた小問だけに絞る', () => {
    const out = applyReviewFocus(problems, 'c', focus);
    expect(out.map(p => p.id)).toEqual(['q1', 'q3']);
    expect(out[0].subQuestions!.map(s => s.id)).toEqual(['q1_2']);
    expect(out[1].subQuestions!.map(s => s.id)).toEqual(['q3_1', 'q3_3']);
  });
  it('別の単元には効かない／対象が見つからなければ元の並び', () => {
    expect(applyReviewFocus(problems, 'other', focus)).toBe(problems);
    expect(applyReviewFocus(problems, 'c', { chapterId: 'c', targets: [{ questionId: 'gone', subQuestionIds: ['x'] }] })).toBe(problems);
  });
  it('旧形式の保存値も読める・空の対象は捨てる', () => {
    expect(normalizeReviewFocus({ chapterId: 'c', questionId: 'q1', subQuestionIds: ['q1_1'] }))
      .toEqual({ chapterId: 'c', targets: [{ questionId: 'q1', subQuestionIds: ['q1_1'] }] });
    expect(normalizeReviewFocus({ chapterId: 'c', targets: [{ questionId: 'q1', subQuestionIds: [] }] })).toBeNull();
    expect(focusedSubIds(focus, 'c', 'q3')).toEqual(['q3_1', 'q3_3']);
    expect(focusedSubIds(focus, 'c', 'q2')).toBeNull();
  });
});

describe('E6（2026-10-30）解き直しは音源も間違えた小問のぶんだけ', () => {
  it('問4だけなら音源も問4だけ。まとめ音源（subIds）は含む小問があれば残す', () => {
    const problems = [{
      id: 'q1',
      subQuestions: [1, 2, 3, 4].map(n => ({ id: `q1_${n}` })),
      audioTracks: [{ subId: 'q1_1' }, { subId: 'q1_2' }, { subId: 'q1_3' }, { subId: 'q1_4' }, { subIds: ['q1_3', 'q1_4'] }],
    }];
    const out = applyReviewFocus(problems, 'c', { chapterId: 'c', targets: [{ questionId: 'q1', subQuestionIds: ['q1_4'] }] });
    expect((out[0] as typeof problems[0]).audioTracks).toEqual([{ subId: 'q1_4' }, { subIds: ['q1_3', 'q1_4'] }]);
    expect(problems[0].audioTracks).toHaveLength(5);
  });
});
