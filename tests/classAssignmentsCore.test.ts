import { describe, expect, it } from 'vitest';
import {
  computeAssignmentProgress,
  countStatuses,
  dueDateToMs,
  groupReasonsByQuestion,
  isJukuPlan,
  normalizePlan,
  normalizeReason,
  reasonDocId,
  reasonHeading,
  sortAssignments,
  uniqueChapters,
  validateAssignmentInput,
  REASON_MAX,
} from '../src/utils/classAssignmentsCore';

const DUE = new Date(2026, 10, 1, 23, 59, 59, 999).getTime();
const totals = { a: 2, b: 1 };

describe('plan', () => {
  it("無い・知らない値は 'free'", () => {
    expect(normalizePlan(undefined)).toBe('free');
    expect(normalizePlan('pro')).toBe('free');
    expect(normalizePlan('juku')).toBe('juku');
    expect(isJukuPlan('juku')).toBe(true);
    expect(isJukuPlan(null)).toBe(false);
  });
});

describe('締切', () => {
  it('その日の終わりの時刻にする・存在しない日は NaN', () => {
    expect(dueDateToMs('2026-11-01')).toBe(DUE);
    expect(dueDateToMs('2026-02-30')).toBeNaN();
    expect(dueDateToMs('11/1')).toBeNaN();
  });

  it('入力の検証', () => {
    const now = new Date(2026, 9, 26).getTime();
    expect(validateAssignmentInput({ title: '', chapterIds: ['a'], dueDate: '2026-11-01' }, now).ok).toBe(false);
    expect(validateAssignmentInput({ title: 'x', chapterIds: [], dueDate: '2026-11-01' }, now).ok).toBe(false);
    expect(validateAssignmentInput({ title: 'x', chapterIds: ['a'], dueDate: '2026-10-01' }, now).ok).toBe(false);
    expect(validateAssignmentInput({ title: 'x', chapterIds: Array.from({ length: 11 }, (_, i) => `c${i}`), dueDate: '2026-11-01' }, now).ok).toBe(false);
    expect(validateAssignmentInput({ title: '週末課題', chapterIds: ['a', 'a', 'b'], dueDate: '2026-11-01' }, now).ok).toBe(true);
    expect(uniqueChapters(['a', ' a', 'b', ''])).toEqual(['a', 'b']);
  });
});

describe('課題の進み具合', () => {
  const asg = { chapterIds: ['a', 'b'], dueAt: DUE };
  it('未着手・取り組み中・期限内・期限後', () => {
    expect(computeAssignmentProgress(asg, {}, totals)).toEqual({ status: 'not_started', solved: 0, total: 3 });
    expect(computeAssignmentProgress(asg, { 'a::1': DUE - 10 }, totals).status).toBe('in_progress');
    expect(computeAssignmentProgress(asg, { 'a::1': DUE - 10, 'a::2': DUE - 5, 'b::1': DUE }, totals).status).toBe('done');
    expect(computeAssignmentProgress(asg, { 'a::1': DUE - 10, 'a::2': DUE - 5, 'b::1': DUE + 1 }, totals).status).toBe('late');
  });
  it('対象外の章は数えず、大問数を超えて数えない', () => {
    const p = computeAssignmentProgress(asg, { 'z::1': 1, 'a::1': 1, 'a::2': 1, 'a::old': 1, 'b::1': 1 }, totals);
    expect(p.solved).toBe(3);
    expect(p.status).toBe('done');
  });
  it('集計', () => {
    const c = countStatuses([
      computeAssignmentProgress(asg, {}, totals),
      computeAssignmentProgress(asg, { 'a::1': 1 }, totals),
    ]);
    expect(c).toEqual({ done: 0, late: 0, in_progress: 1, not_started: 1 });
  });
  it('並び：締切が近い順、過ぎたものは後ろ', () => {
    const now = 1000;
    const out = sortAssignments([{ dueAt: 500 }, { dueAt: 3000 }, { dueAt: 2000 }, { dueAt: 900 }], now);
    expect(out.map((r) => r.dueAt)).toEqual([2000, 3000, 900, 500]);
  });
});

describe('選んだ理由', () => {
  it('ドキュメントID はルールの形に合う', () => {
    const id = reasonDocId('C1', 'U1', 'el1_A', 'q.el/1');
    expect(id).toBe('C1_U1_el1_A__q-el-1');
    expect(/^C1_U1_[A-Za-z0-9_-]{1,160}$/.test(id)).toBe(true);
  });
  it('理由の整形（前後の空白・上限）', () => {
    expect(normalizeReason('  abc \r\n')).toBe('abc');
    expect(normalizeReason('あ'.repeat(300)).length).toBe(REASON_MAX);
  });
  it('問題ごとにまとめ、多い順', () => {
    const base = { classId: 'c', teacherUid: 't', chapterId: 'a', reason: 'r' };
    const g = groupReasonsByQuestion([
      { ...base, uid: '1', questionId: 'q1' },
      { ...base, uid: '1', questionId: 'q2' },
      { ...base, uid: '2', questionId: 'q2' },
    ]);
    expect(g.map((x) => [x.questionId, x.rows.length])).toEqual([['q2', 2], ['q1', 1]]);
    expect(reasonHeading({ qNo: 3, questionId: 'q2' })).toBe('Q3');
    expect(reasonHeading({ questionId: 'q2' })).toBe('q2');
  });
});
