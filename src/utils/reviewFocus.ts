/**
 * 復習ノートからの「間違えた問題だけ解き直す」の対象（2026-10-04 ご要望）。
 *
 * 問1〜5のうち問4だけ間違えたなら、解き直しで出すのは問4だけにする。
 * 演習画面（Quiz）はこの対象があるとき、その大問の小問を絞って出す。
 * 画面をまたいで残すため sessionStorage に置き、通常の演習を始めるときに消す。
 */
export interface ReviewFocus { chapterId: string; questionId: string; subQuestionIds: string[] }
const KEY = 'review_focus_v1';

export function setReviewFocus(f: ReviewFocus | null): void {
  try { if (f) sessionStorage.setItem(KEY, JSON.stringify(f)); else sessionStorage.removeItem(KEY); } catch { /* noop */ }
}
export function readReviewFocus(): ReviewFocus | null {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    return v && typeof v.chapterId === 'string' && typeof v.questionId === 'string' && Array.isArray(v.subQuestionIds) && v.subQuestionIds.length > 0 ? v : null;
  } catch { return null; }
}

/** 対象の大問だけ、小問を「間違えたもの」に絞った写しを返す（元データは書き換えない） */
export function applyReviewFocus<T extends { id: string; subQuestions?: any[] }>(problems: T[], chapterId: string, focus: ReviewFocus | null): T[] {
  if (!focus || focus.chapterId !== chapterId) return problems;
  return problems.map(p => {
    if (p.id !== focus.questionId || !Array.isArray(p.subQuestions)) return p;
    const subs = p.subQuestions.filter(sq => focus.subQuestionIds.includes(String(sq?.id)));
    return subs.length > 0 ? { ...p, subQuestions: subs, reviewFocus: true } : p;
  });
}
