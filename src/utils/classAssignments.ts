/**
 * ===================================================================
 * 塾向け：課題配信と「選んだ理由」の Firestore 層
 * ===================================================================
 *   class_assignments/{自動ID}                     … 先生が作る課題（plan == 'juku' のクラスだけ）
 *   answer_reasons/{classId}_{uid}_{章}__{大問}    … 生徒が「先生に送る」を押した理由
 *
 *   判定（担任か・在籍か・juku か）はすべて firestore.rules が行う。
 *   ここは読み書きと、生徒の端末に「自分が入っている塾クラス」を覚えておく係。
 *   純粋な計算は classAssignmentsCore.ts。
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from './firestoreMetered';
import { db } from '../firebase';
import { toFriendlyError, requireUid } from './classroomShared';
import {
  dueDateToMs,
  normalizeReason,
  reasonDocId,
  uniqueChapters,
  validateAssignmentInput,
  type AnswerReasonDoc,
  type AssignmentDoc,
  type AssignmentInput,
} from './classAssignmentsCore';
import { readJsonArray, safeRemoveItem } from './safeLocalStorage';
import { safeSetItem } from './storageGuard';

export const CLASS_ASSIGNMENTS_COLLECTION = 'class_assignments';
export const ANSWER_REASONS_COLLECTION = 'answer_reasons';

// ===================================================================
// 課題
// ===================================================================

/** 先生：課題を作る（クラスが plan == 'juku' でなければルールが拒否する） */
export async function createAssignment(classId: string, input: AssignmentInput): Promise<AssignmentDoc> {
  const teacherUid = requireUid();
  const check = validateAssignmentInput(input);
  if (!check.ok) throw new Error(check.message);
  const payload = {
    classId,
    teacherUid,
    title: input.title.trim(),
    chapterIds: uniqueChapters(input.chapterIds),
    dueAt: dueDateToMs(input.dueDate),
  };
  try {
    const ref = await addDoc(collection(db, CLASS_ASSIGNMENTS_COLLECTION), {
      ...payload,
      createdAt: serverTimestamp(),
    });
    return { ...payload, id: ref.id };
  } catch (error) {
    throw toFriendlyError(error, '課題の作成に失敗しました。');
  }
}

/** 先生・在籍生徒：クラスの課題一覧 */
export async function fetchAssignments(classId: string): Promise<AssignmentDoc[]> {
  requireUid();
  try {
    const snapshot = await getDocs(
      query(collection(db, CLASS_ASSIGNMENTS_COLLECTION), where('classId', '==', classId)),
    );
    return snapshot.docs.map((row) => ({ ...(row.data() as Omit<AssignmentDoc, 'id'>), id: row.id }));
  } catch (error) {
    throw toFriendlyError(error, '課題の取得に失敗しました。');
  }
}

/** 先生：課題を消す */
export async function deleteAssignment(assignmentId: string): Promise<void> {
  requireUid();
  try {
    await deleteDoc(doc(db, CLASS_ASSIGNMENTS_COLLECTION, assignmentId));
  } catch (error) {
    throw toFriendlyError(error, '課題の削除に失敗しました。');
  }
}

// ===================================================================
// 選んだ理由
// ===================================================================

export interface ReasonTarget {
  classId: string;
  teacherUid: string;
  chapterId: string;
  questionId: string;
}

/** 生徒：理由を送る（同じ問題なら上書き） */
export async function submitAnswerReason(target: ReasonTarget, text: string, correct?: boolean, qNo?: number): Promise<void> {
  const uid = requireUid();
  const reason = normalizeReason(text);
  if (!reason) throw new Error('理由を書いてから送ってください。');
  const data: Record<string, unknown> = {
    classId: target.classId,
    uid,
    teacherUid: target.teacherUid,
    chapterId: target.chapterId,
    questionId: target.questionId,
    reason,
    updatedAt: serverTimestamp(),
  };
  if (typeof correct === 'boolean') data.correct = correct;
  if (typeof qNo === 'number' && Number.isInteger(qNo) && qNo >= 1 && qNo <= 999) data.qNo = qNo;
  try {
    await setDoc(doc(db, ANSWER_REASONS_COLLECTION, reasonDocId(target.classId, uid, target.chapterId, target.questionId)), data);
  } catch (error) {
    throw toFriendlyError(error, '理由を送れませんでした。');
  }
}

/** 生徒：自分が送った理由（無ければ null） */
export async function fetchMyAnswerReason(target: ReasonTarget): Promise<AnswerReasonDoc | null> {
  const uid = requireUid();
  try {
    const snapshot = await getDoc(doc(db, ANSWER_REASONS_COLLECTION, reasonDocId(target.classId, uid, target.chapterId, target.questionId)));
    return snapshot.exists() ? (snapshot.data() as AnswerReasonDoc) : null;
  } catch {
    return null;
  }
}

/** 生徒：送った理由を取り消す */
export async function deleteMyAnswerReason(target: ReasonTarget): Promise<void> {
  const uid = requireUid();
  try {
    await deleteDoc(doc(db, ANSWER_REASONS_COLLECTION, reasonDocId(target.classId, uid, target.chapterId, target.questionId)));
  } catch (error) {
    throw toFriendlyError(error, '取り消せませんでした。');
  }
}

/** 先生：クラスに届いた理由の一覧（plan == 'juku' のときだけルールが許す） */
export async function fetchClassReasons(classId: string): Promise<AnswerReasonDoc[]> {
  requireUid();
  try {
    const snapshot = await getDocs(
      query(collection(db, ANSWER_REASONS_COLLECTION), where('classId', '==', classId)),
    );
    return snapshot.docs.map((row) => row.data() as AnswerReasonDoc);
  } catch (error) {
    throw toFriendlyError(error, '選んだ理由の取得に失敗しました。');
  }
}

// ===================================================================
// 生徒の端末に「入っている塾クラス」を覚えておく
//   解説画面（理由の入力欄）と広告の出し分けが、Firestore を読まずに判断できるようにする。
//   クラス画面を開いたとき・参加したとき・抜けたときに書き直す。
//   ★ここはあくまで表示の目安★ 送れるかどうかはルールが決める（書き換えても得は無い）。
// ===================================================================

export interface JukuMembership {
  classId: string;
  teacherUid: string;
  className: string;
  subject: string;
}

const JUKU_KEY_PREFIX = 'juku_memberships_v1_';

function jukuKey(uid: string): string {
  return `${JUKU_KEY_PREFIX}${uid}`;
}

function isJukuMembership(v: unknown): v is JukuMembership {
  if (!v || typeof v !== 'object') return false;
  const r = v as Record<string, unknown>;
  return typeof r.classId === 'string' && typeof r.teacherUid === 'string' && typeof r.className === 'string' && typeof r.subject === 'string';
}

export function saveJukuMemberships(uid: string, rows: JukuMembership[]): void {
  if (!uid) return;
  if (rows.length === 0) {
    safeRemoveItem(jukuKey(uid));
  } else {
    safeSetItem(jukuKey(uid), JSON.stringify(rows));
  }
  notifyJukuChanged();
}

export function loadJukuMemberships(uid: string | null | undefined): JukuMembership[] {
  if (!uid) return [];
  return readJsonArray(jukuKey(uid)).filter(isJukuMembership);
}

/** 解説の章が属する教科の塾クラス（同じ教科で複数入っていたら最初の1つ） */
export function jukuClassForSubject(uid: string | null | undefined, subject: string | null | undefined): JukuMembership | null {
  if (!subject) return null;
  return loadJukuMemberships(uid).find((row) => row.subject === subject) || null;
}

const listeners = new Set<() => void>();
export function subscribeJukuMemberships(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function notifyJukuChanged(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* 表示の更新だけなので失敗は無視 */
    }
  });
}
