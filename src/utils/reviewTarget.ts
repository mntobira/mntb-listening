import type { SubjectKey } from '../data/allChapters';

type Problem = { id: string; text?: string; subQuestions?: { id: string }[] };
type Chapter = { id: string; abstractTitle?: string; realTitle?: string; practiceProblems?: Problem[] };
type Subject = { id: SubjectKey; parts: { chapters: Chapter[] }[] };
export type ReviewLocator = {
  chapterId?: string;
  chapterTitle?: string;
  questionId?: string;
  /** 小問IDだけを持つリンク（ロジックツリーの「確認問題」など）からも問題を引けるようにする */
  subQuestionId?: string;
  questionIndex?: number;
  /** 登録した時点の問題文（復習アイテムが持っている）。ID が変わったときの手がかり */
  questionText?: string;
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

/** 問題文の比べ方：空白・記号・大小文字の違いは無視する（整形し直しただけで別物にしない） */
function normText(t: string | undefined): string {
  return String(t || '').replace(/<[^>]+>/g, '').toLowerCase().replace(/[\s　、。,.!?！？「」『』（）()［］\[\]_＿-]/gu, '');
}

/**
 * 保存した ID から問題の場所を引く。
 * ★2026-10-30 E7★ 「対応する問題を見つけられませんでした」を減らすため、ID で見つからないときは
 *   ① 同じ単元の中を小問 ID で探す（大問の並べ替え・分割で大問 ID だけ変わった）
 *   ② 全教材を、登録した時点の問題文で探す（ID の付け直し）
 *   ③ 同じ単元の同じ番号（questionIndex）
 * の順に探す。関係のない問題（別の単元の先頭など）には決して飛ばさない。
 */
export function resolveReviewTarget(note: ReviewLocator, subjects: Subject[]) {
  const entries = subjects.flatMap(subject => subject.parts.flatMap(part => part.chapters.map(chapter => ({
    subject: subject.id, chapter,
  }))));
  const hasSub = (q: Problem) => !!note.subQuestionId && !!q.subQuestions?.some(sq => sq.id === note.subQuestionId);
  const found = (entry: typeof entries[number], questionIndex: number) => ({ subject: entry.subject, chapterId: entry.chapter.id, questionIndex });

  // 1) 単元 → 大問 ID（いままでどおり）
  const candidates = entries.filter(({ chapter }) => {
    if (note.chapterId) return chapter.id === note.chapterId;
    if (note.questionId) return chapter.practiceProblems?.some(q => q.id === note.questionId);
    if (note.subQuestionId) return chapter.practiceProblems?.some(hasSub);
    return !!note.chapterTitle && [chapter.abstractTitle, chapter.realTitle].includes(note.chapterTitle);
  });
  const entry = candidates.length === 1 ? candidates[0] : null;
  if (entry) {
    const questions = entry.chapter.practiceProblems || [];
    let questionIndex = note.questionId ? questions.findIndex(q => q.id === note.questionId) : -1;
    // ① 同じ単元の中を小問 ID で
    if (questionIndex < 0 && note.subQuestionId) questionIndex = questions.findIndex(hasSub);
    if (questionIndex >= 0) return found(entry, questionIndex);
  }

  // ② 全教材を問題文で（20文字以上のときだけ。短い文は取り違えの元）
  const text = normText(note.questionText);
  if (text.length >= 20) {
    for (const e of entries) {
      const i = (e.chapter.practiceProblems || []).findIndex(q => normText(q.text) === text);
      if (i >= 0) return found(e, i);
    }
  }

  // ③ 大問 ID を持たないリンク（古いノートなど）だけ、同じ単元の同じ番号。
  //    大問 ID を持っているのに見つからないときは、番号だけで別の問題へ飛ばさない
  if (entry && !note.questionId && !note.subQuestionId) {
    const questions = entry.chapter.practiceProblems || [];
    const i = Number.isSafeInteger(note.questionIndex) ? note.questionIndex! - 1 : -1;
    if (i >= 0 && i < questions.length) return found(entry, i);
  }
  return null;
}

/**
 * 解き直しの始め方（App の handleReviewNote から切り出した。判定は以前と同じ）。
 *   whole   … 学習記録の「解きなおす」（2026-10-11）：その大問1つだけを、小問ぜんぶで
 *   focused … 間違えた小問だけ（2026-10-04 ご要望）：その大問1つだけを範囲にして、小問も間違えた分に絞る。
 *             絞り込み後の並びはその大問だけになるので、先頭から・範囲なしで始める
 *   from    … その問題から（範囲なし）
 */
export type ReviewLaunch =
  | { kind: 'whole'; chapterId: string; questionIndex: number }
  | { kind: 'focused'; chapterId: string; targets: { questionId: string; subQuestionIds: string[] }[] }
  | { kind: 'from'; chapterId: string; questionIndex: number };

export function reviewLaunchOf(
  note: ReviewRequest,
  target: { chapterId: string; questionIndex: number },
): ReviewLaunch {
  const subIds: string[] = Array.isArray(note.subQuestionIds) ? note.subQuestionIds.map(String)
    : note.subQuestionId && note.questionId ? [String(note.subQuestionId)] : [];
  if (note.wholeQuestion && note.questionId) {
    return { kind: 'whole', chapterId: target.chapterId, questionIndex: target.questionIndex };
  }
  if (subIds.length > 0 && note.questionId) {
    return { kind: 'focused', chapterId: target.chapterId, targets: [{ questionId: String(note.questionId), subQuestionIds: subIds }] };
  }
  return { kind: 'from', chapterId: target.chapterId, questionIndex: target.questionIndex };
}
