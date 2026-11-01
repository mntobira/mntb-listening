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

import { resolveReviewTarget } from '../src/utils/reviewTarget';
// E7（2026-10-30）「対応する問題を見つけられませんでした」を減らす
describe('復習ノートから問題を探す（ID が変わっても見つける）', () => {
  const longText = 'I have been waiting for over an hour, but the delivery has not arrived ______.';
  const subjects = [{
    id: 'english_grammar' as never,
    parts: [{ chapters: [
      { id: 'eg6_1', practiceProblems: [{ id: 'q_eg6_1_set1', text: 'A', subQuestions: [{ id: 'a1' }] }, { id: 'q_eg6_1_set2', text: longText, subQuestions: [{ id: 'a2' }, { id: 'a3' }] }] },
      { id: 'eg6_2', practiceProblems: [{ id: 'q_eg6_2_set1', text: 'B', subQuestions: [{ id: 'b1' }] }] },
    ] }],
  }];
  it('いままでどおり：単元と大問 ID で見つかる', () => {
    expect(resolveReviewTarget({ chapterId: 'eg6_1', questionId: 'q_eg6_1_set2' }, subjects)).toEqual({ subject: 'english_grammar', chapterId: 'eg6_1', questionIndex: 1 });
  });
  it('大問 ID が変わっても、同じ単元の小問 ID で見つかる', () => {
    expect(resolveReviewTarget({ chapterId: 'eg6_1', questionId: 'old_id', subQuestionId: 'a3' }, subjects)?.questionIndex).toBe(1);
  });
  it('単元 ID も大問 ID も変わっても、問題文が同じなら見つかる', () => {
    expect(resolveReviewTarget({ chapterId: 'eg1_1', questionId: 'q_eg1_1_set3', questionText: ` ${longText.toUpperCase()} ` }, subjects))
      .toEqual({ subject: 'english_grammar', chapterId: 'eg6_1', questionIndex: 1 });
  });
  it('大問 ID を持っているのに見つからないとき、番号だけで別の問題へ飛ばさない', () => {
    expect(resolveReviewTarget({ chapterId: 'eg6_2', questionId: 'gone', questionIndex: 1 }, subjects)).toBeNull();
  });
  it('短い問題文では探さない（取り違え防止）', () => {
    expect(resolveReviewTarget({ chapterId: 'gone', questionId: 'gone', questionText: 'B' }, subjects)).toBeNull();
  });
  it('大問 ID を持たない古いノートは、同じ単元の同じ番号', () => {
    expect(resolveReviewTarget({ chapterId: 'eg6_1', questionIndex: 2 }, subjects)?.questionIndex).toBe(1);
  });
});
