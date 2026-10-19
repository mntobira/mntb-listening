import type { SubjectKey } from '../data/allChapters';

type Problem = { id: string; subQuestions?: { id: string }[] };
type Chapter = { id: string; abstractTitle?: string; realTitle?: string; practiceProblems?: Problem[] };
type Subject = { id: SubjectKey; parts: { chapters: Chapter[] }[] };
export type ReviewLocator = {
  chapterId?: string;
  chapterTitle?: string;
  questionId?: string;
  /** 小問IDだけを持つリンク（ロジックツリーの「確認問題」など）からも問題を引けるようにする */
  subQuestionId?: string;
  questionIndex?: number;
};

/**
 * 「解き直す」ボタンから演習画面へ渡す依頼（App の handleReviewNote が受け取る）。
 *
 * 呼び出し元は3つある：
 *   ・復習ノート／学習ノート（StudyHub・NoteDetail）… 保存したノートや復習アイテムそのもの
 *   ・学習記録（StudyLog の「解きなおす」）       … wholeQuestion / subQuestionIds を明示
 *   ・復習アイテムのまとめ（GroupCard）            … subQuestionIds に間違えた小問をまとめる
 */
export type ReviewRequest = ReviewLocator & {
  /** この小問だけを解き直す（間違えた問題だけ） */
  subQuestionIds?: readonly string[];
  /** 大問1つを、小問ぜんぶで解き直す */
  wholeQuestion?: boolean;
};

/** Never fall back to an unrelated first question when a saved ID is missing. */
export function resolveReviewTarget(note: ReviewLocator, subjects: Subject[]) {
  const entries = subjects.flatMap(subject => subject.parts.flatMap(part => part.chapters.map(chapter => ({
    subject: subject.id, chapter,
  }))));
  const hasSub = (q: Problem) => !!note.subQuestionId && !!q.subQuestions?.some(sq => sq.id === note.subQuestionId);
  const candidates = entries.filter(({ chapter }) => {
    if (note.chapterId) return chapter.id === note.chapterId;
    if (note.questionId) return chapter.practiceProblems?.some(q => q.id === note.questionId);
    if (note.subQuestionId) return chapter.practiceProblems?.some(hasSub);
    return !!note.chapterTitle && [chapter.abstractTitle, chapter.realTitle].includes(note.chapterTitle);
  });
  if (candidates.length !== 1) return null;
  const entry = candidates[0];
  const questions = entry.chapter.practiceProblems || [];
  const questionIndex = note.questionId
    ? questions.findIndex(q => q.id === note.questionId)
    : note.subQuestionId
      ? questions.findIndex(hasSub)
      : Number.isSafeInteger(note.questionIndex) ? note.questionIndex! - 1 : -1;
  if (questionIndex < 0 || questionIndex >= questions.length) return null;
  return { subject: entry.subject, chapterId: entry.chapter.id, questionIndex };
}
