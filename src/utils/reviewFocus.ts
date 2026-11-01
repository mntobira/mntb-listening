/**
 * 「間違えた問題だけ解き直す」の対象（2026-10-04 ご要望 / 2026-10-16 複数大問に対応）。
 *
 * 問1〜5のうち問4だけ間違えたなら、解き直しで出すのは問4だけにする。
 * 結果画面から押したときは、間違いを含む大問すべて（それぞれ間違えた小問だけ）を出す。
 * 演習画面（Quiz）と結果画面は、この対象があるとき問題の並びをそれに絞って受け取る。
 * 画面をまたいで残すため sessionStorage に置き、通常の演習を始めるときに消す。
 */
export interface ReviewTargetItem { questionId: string; subQuestionIds: string[] }
export interface ReviewFocus { chapterId: string; targets: ReviewTargetItem[] }
const KEY = 'review_focus_v1';

function normalizeItem(v: unknown): ReviewTargetItem | null {
  const o = v as { questionId?: unknown; subQuestionIds?: unknown } | null;
  if (!o || typeof o.questionId !== 'string' || !Array.isArray(o.subQuestionIds)) return null;
  const subs = o.subQuestionIds.map(String).filter(Boolean);
  return subs.length > 0 ? { questionId: o.questionId, subQuestionIds: subs } : null;
}

/** 保存値を検証して返す。旧形式（questionId / subQuestionIds を直接持つ1大問）も読む。 */
export function normalizeReviewFocus(v: unknown): ReviewFocus | null {
  const o = v as { chapterId?: unknown; targets?: unknown } | null;
  if (!o || typeof o.chapterId !== 'string') return null;
  const raw = Array.isArray(o.targets) ? o.targets : [o];
  const targets = raw.map(normalizeItem).filter((t): t is ReviewTargetItem => t !== null);
  return targets.length > 0 ? { chapterId: o.chapterId, targets } : null;
}

export function setReviewFocus(f: ReviewFocus | null): void {
  const value = f ? normalizeReviewFocus(f) : null;
  try { if (value) sessionStorage.setItem(KEY, JSON.stringify(value)); else sessionStorage.removeItem(KEY); } catch { /* sessionStorage が使えない環境では絞り込みなしで続ける（意図して捨てている） */ }
}
export function readReviewFocus(): ReviewFocus | null {
  try { return normalizeReviewFocus(JSON.parse(sessionStorage.getItem(KEY) || 'null')); } catch { return null; }
}

/** その大問で解き直す小問の id（対象外なら null） */
export function focusedSubIds(focus: ReviewFocus | null, chapterId: string, questionId: string): string[] | null {
  if (!focus || focus.chapterId !== chapterId) return null;
  return focus.targets.find(t => t.questionId === questionId)?.subQuestionIds ?? null;
}

/**
 * 対象の大問だけを、小問を「間違えたもの」に絞った写しで返す（元データは書き換えない）。
 * 対象外の大問は出さない。教材の差し替えで1つも見つからなければ、元の並びをそのまま返す。
 */
type TrackLike = { subId?: unknown; subIds?: readonly unknown[] };

/**
 * ★2026-10-30 E6★ 小問を絞るとき、音源（audioTracks）も残した小問のぶんだけにする。
 *   以前は音源を全部写していたので、問4だけの解き直しでも解説に「再生・2回・0.75倍・標準」が
 *   4問ぶん並んでいた。どの小問にも結びつかない音源（subId も subIds も無い）は残す。
 */
function narrowTracks(tracks: unknown, keep: string[]): unknown {
  if (!Array.isArray(tracks)) return tracks;
  const out = (tracks as TrackLike[]).filter((t) => {
    const ids = Array.isArray(t?.subIds) && t.subIds.length > 0 ? t.subIds.map(String) : t?.subId != null ? [String(t.subId)] : [];
    return ids.length === 0 || ids.some((id) => keep.includes(id));
  });
  return out.length > 0 ? out : tracks;
}

export function applyReviewFocus<T extends { id: string; subQuestions?: readonly { id?: unknown }[] }>(problems: T[], chapterId: string, focus: ReviewFocus | null): T[] {
  if (!focus || focus.chapterId !== chapterId) return problems;
  const out: T[] = [];
  for (const p of problems) {
    const ids = focusedSubIds(focus, chapterId, p.id);
    if (!ids || !Array.isArray(p.subQuestions)) continue;
    const subs = p.subQuestions.filter(sq => ids.includes(String(sq?.id)));
    if (subs.length === 0) continue;
    const keep = subs.map((sq) => String(sq?.id));
    const tracks = (p as { audioTracks?: unknown }).audioTracks;
    out.push({ ...p, subQuestions: subs, ...(tracks !== undefined ? { audioTracks: narrowTracks(tracks, keep) } : {}), reviewFocus: true });
  }
  return out.length > 0 ? out : problems;
}
