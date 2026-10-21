import { describe, expect, it } from 'vitest';
import { reviewLaunchOf } from '../src/utils/reviewTarget';

/** 復習ノート・学習記録から問題へ飛ぶときの「始め方」（App の handleReviewNote から切り出した判定） */
describe('解き直しの始め方', () => {
  const t = { chapterId: 'el1_A', questionIndex: 4 };
  it('学習記録の「解きなおす」は大問まるごと', () => {
    expect(reviewLaunchOf({ questionId: 'q5', wholeQuestion: true, subQuestionIds: ['a'] }, t)).toEqual({ kind: 'whole', chapterId: 'el1_A', questionIndex: 4 });
  });
  it('間違えた小問の一覧があれば、その小問だけ', () => {
    expect(reviewLaunchOf({ questionId: 'q5', subQuestionIds: ['a', 'b'] }, t))
      .toEqual({ kind: 'focused', chapterId: 'el1_A', targets: [{ questionId: 'q5', subQuestionIds: ['a', 'b'] }] });
  });
  it('小問1つだけのリンクも、大問IDがあればその小問だけ', () => {
    expect(reviewLaunchOf({ questionId: 'q5', subQuestionId: 'c' }, t))
      .toEqual({ kind: 'focused', chapterId: 'el1_A', targets: [{ questionId: 'q5', subQuestionIds: ['c'] }] });
  });
  it('大問IDが無いとき・空の一覧のときは、その問題から', () => {
    expect(reviewLaunchOf({ subQuestionId: 'c' }, t)).toEqual({ kind: 'from', chapterId: 'el1_A', questionIndex: 4 });
    expect(reviewLaunchOf({ questionId: 'q5', subQuestionIds: [] }, t)).toEqual({ kind: 'from', chapterId: 'el1_A', questionIndex: 4 });
    expect(reviewLaunchOf({ wholeQuestion: true }, t)).toEqual({ kind: 'from', chapterId: 'el1_A', questionIndex: 4 });
  });
});
