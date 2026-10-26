/**
 * ===================================================================
 * 塾向け：課題配信と「選んだ理由」の純粋ロジック（Firestore を触らない）
 * ===================================================================
 *
 * ■ 課題（class_assignments）
 *   先生が「この単元を、この日までに」と配る。中身は章IDの並びと締切だけ。
 *   生徒が「やったか」は課題側に書かず、study_progress の solved
 *   （`章ID::大問ID` → 初めて解いた時刻ms）から数える。
 *   → 生徒の書き込みは増えない。先生が読めるのは study_access がある生徒だけ（同意の仕組みのまま）。
 *
 * ■ 状況の決め方（1人×1課題）
 *   done        … 締切までに全部の大問を解いた
 *   late        … 全部解いたが、最後の1問が締切を過ぎてから
 *   in_progress … 1問以上解いたが、まだ全部ではない
 *   not_started … 1問も解いていない
 *   ※締切前から解いてあった大問も「解いた」に数える（もう出来ている問題をやり直させない）。
 *
 * ■ 選んだ理由（answer_reasons）
 *   ドキュメントIDは `${classId}_${uid}_${章ID}__${大問ID}`（使えない文字は - に置き換える）。
 *   1人1問1件に決まるので、書き直しは上書きになる。
 */
import type { SolvedMap } from './studySyncCore';

export const ASSIGNMENT_TITLE_MAX = 40;
export const ASSIGNMENT_MAX_CHAPTERS = 10;
export const REASON_MAX = 200;

export type ClassPlan = 'free' | 'juku';

/** plan が無い・知らない値なら 'free'（ルールの get('plan','free') と同じ） */
export function normalizePlan(value: unknown): ClassPlan {
  return value === 'juku' ? 'juku' : 'free';
}

export function isJukuPlan(value: unknown): boolean {
  return normalizePlan(value) === 'juku';
}

export interface AssignmentDoc {
  id: string;
  classId: string;
  teacherUid: string;
  title: string;
  chapterIds: string[];
  /** 締切（ms）。その日の 23:59:59.999（端末の時刻帯） */
  dueAt: number;
  createdAt?: unknown;
}

export interface AssignmentInput {
  title: string;
  chapterIds: string[];
  /** 'YYYY-MM-DD'（<input type="date"> の値） */
  dueDate: string;
}

export interface AssignmentValidation {
  ok: boolean;
  message: string;
}

/** 'YYYY-MM-DD' → その日の終わり（端末の時刻帯）の ms。形が違えば NaN */
export function dueDateToMs(dueDate: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((dueDate || '').trim());
  if (!m) return Number.NaN;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const date = new Date(y, mo, d, 23, 59, 59, 999);
  if (date.getFullYear() !== y || date.getMonth() !== mo || date.getDate() !== d) return Number.NaN;
  return date.getTime();
}

/** ms → 'M/D（曜）' */
export function formatDue(ms: number): string {
  if (!Number.isFinite(ms)) return '';
  const date = new Date(ms);
  const w = '日月火水木金土'[date.getDay()];
  return `${date.getMonth() + 1}/${date.getDate()}（${w}）`;
}

export function validateAssignmentInput(input: AssignmentInput, now: number = Date.now()): AssignmentValidation {
  const title = (input.title || '').trim();
  if (!title) return { ok: false, message: '課題の名前を入れてください。' };
  if (title.length > ASSIGNMENT_TITLE_MAX) return { ok: false, message: `課題の名前は${ASSIGNMENT_TITLE_MAX}文字までです。` };
  const chapters = uniqueChapters(input.chapterIds);
  if (chapters.length === 0) return { ok: false, message: '単元を1つ以上選んでください。' };
  if (chapters.length > ASSIGNMENT_MAX_CHAPTERS) return { ok: false, message: `単元は${ASSIGNMENT_MAX_CHAPTERS}個までです。` };
  const due = dueDateToMs(input.dueDate);
  if (!Number.isFinite(due)) return { ok: false, message: '締切の日付を選んでください。' };
  if (due < now) return { ok: false, message: '締切は今日以降の日付にしてください。' };
  return { ok: true, message: '' };
}

export function uniqueChapters(ids: string[] | null | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  (ids || []).forEach((id) => {
    const v = String(id || '').trim();
    if (v && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  });
  return out;
}

export type AssignmentStatus = 'done' | 'late' | 'in_progress' | 'not_started';

export interface AssignmentProgress {
  status: AssignmentStatus;
  solved: number;
  total: number;
}

/**
 * 1人の solved マップから、課題の進み具合を出す。
 * @param totals 章ID → その章の大問数（chapterCatalog の totalProblems）
 */
export function computeAssignmentProgress(
  assignment: Pick<AssignmentDoc, 'chapterIds' | 'dueAt'>,
  solved: SolvedMap | null | undefined,
  totals: Record<string, number>,
): AssignmentProgress {
  const targets = new Set(assignment.chapterIds);
  let total = 0;
  assignment.chapterIds.forEach((id) => {
    total += Math.max(0, Math.floor(totals[id] || 0));
  });
  let count = 0;
  let lastAt = 0;
  Object.entries(solved || {}).forEach(([key, at]) => {
    const chapterId = key.split('::')[0];
    if (!chapterId || !targets.has(chapterId)) return;
    count += 1;
    const t = typeof at === 'number' ? at : 0;
    if (t > lastAt) lastAt = t;
  });
  // 章の大問数より多く数えない（データの入れ替えで古いキーが残っていても 100% を超えない）
  const solvedCount = total > 0 ? Math.min(count, total) : count;
  let status: AssignmentStatus;
  if (solvedCount === 0) status = 'not_started';
  else if (total > 0 && solvedCount >= total) status = lastAt > assignment.dueAt ? 'late' : 'done';
  else status = 'in_progress';
  return { status, solved: solvedCount, total };
}

export const STATUS_LABELS: Record<AssignmentStatus, string> = {
  done: '期限内に完了',
  late: '期限後に完了',
  in_progress: '取り組み中',
  not_started: '未着手',
};

/** クラス全体の集計（先生の一覧の見出し用） */
export function countStatuses(rows: AssignmentProgress[]): Record<AssignmentStatus, number> {
  const out: Record<AssignmentStatus, number> = { done: 0, late: 0, in_progress: 0, not_started: 0 };
  rows.forEach((r) => {
    out[r.status] += 1;
  });
  return out;
}

/** 締切が近い順。締切を過ぎたものは後ろ（新しい順） */
export function sortAssignments<T extends Pick<AssignmentDoc, 'dueAt'>>(rows: T[], now: number = Date.now()): T[] {
  return [...rows].sort((a, b) => {
    const aPast = a.dueAt < now;
    const bPast = b.dueAt < now;
    if (aPast !== bPast) return aPast ? 1 : -1;
    return aPast ? b.dueAt - a.dueAt : a.dueAt - b.dueAt;
  });
}

// ===================================================================
// 選んだ理由
// ===================================================================

export interface AnswerReasonDoc {
  classId: string;
  uid: string;
  teacherUid: string;
  chapterId: string;
  questionId: string;
  /** 章の中での Q番号（先生の画面の見出し用。無ければ questionId を出す） */
  qNo?: number;
  reason: string;
  correct?: boolean;
  updatedAt?: unknown;
}

function safeIdPart(value: string): string {
  return String(value || '').replace(/[^A-Za-z0-9_-]/g, '-');
}

/** answer_reasons のドキュメントID（ルールの '^classId_uid_[A-Za-z0-9_-]{1,160}$' に合う形） */
export function reasonDocId(classId: string, uid: string, chapterId: string, questionId: string): string {
  const tail = `${safeIdPart(chapterId)}__${safeIdPart(questionId)}`.slice(0, 160);
  return `${classId}_${uid}_${tail}`;
}

export function normalizeReason(text: string): string {
  return String(text || '').replace(/\r\n?/g, '\n').trim().slice(0, REASON_MAX);
}

export interface ReasonGroup {
  chapterId: string;
  questionId: string;
  qNo?: number;
  rows: AnswerReasonDoc[];
}

/** 先生の画面の見出し：「Q3」。番号が無い古いデータは大問ID */
export function reasonHeading(g: Pick<ReasonGroup, 'qNo' | 'questionId'>): string {
  return g.qNo && g.qNo > 0 ? `Q${g.qNo}` : g.questionId;
}

/** 先生の画面用：問題ごとにまとめる（理由が多く集まった問題を上に） */
export function groupReasonsByQuestion(rows: AnswerReasonDoc[]): ReasonGroup[] {
  const map = new Map<string, ReasonGroup>();
  rows.forEach((row) => {
    const key = `${row.chapterId}::${row.questionId}`;
    const hit = map.get(key);
    if (hit) {
      hit.rows.push(row);
      if (!hit.qNo && row.qNo) hit.qNo = row.qNo;
    } else map.set(key, { chapterId: row.chapterId, questionId: row.questionId, qNo: row.qNo, rows: [row] });
  });
  return [...map.values()].sort((a, b) => b.rows.length - a.rows.length || a.questionId.localeCompare(b.questionId));
}
