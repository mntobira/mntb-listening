/**
 * ===================================================================
 * クラス機能の Firestore 層（先生がクラスを作り、生徒が参加する）
 * ===================================================================
 *
 * -------------------------------------------------------------------
 * ■ Firestore のデータ形
 * -------------------------------------------------------------------
 *   classrooms/{classId} = {
 *     teacherUid, schoolName, className, joinCode, subject, joinOpen, ...
 *   }
 *
 *   class_codes/{joinCode} = { classId, teacherUid }
 *     ↑ 参加コードの逆引きインデックス（friend_codes と同じ発想）
 *
 *   class_members/{classId}_{studentUid} = {
 *     classId, uid, displayName, rosterName?, joinedAt
 *   }
 *     ↑ ドキュメントIDを固定することで「1クラス1生徒1行」を保証する。
 *       サブコレクションにしないのは、生徒側から「自分が入っている
 *       クラス」を1クエリで引けるようにするため。
 *
 * -------------------------------------------------------------------
 * ■ なぜ class_codes に list を許可しないのか
 * -------------------------------------------------------------------
 * firestore.rules に既に記録されている通り、Firestore のルールは
 * 「クエリが必ず条件を満たすと静的に証明できるか」で判定される。
 * where('joinCode','==',x) を許可すると classrooms 全体を
 * 読ませることになり、全国の学校のクラス名が吸い出せてしまう。
 * コードを知っている人だけが get で1件引ける形にする。
 *
 * -------------------------------------------------------------------
 * ■ 個人情報の扱い（学校へ出す前提での配慮）
 * -------------------------------------------------------------------
 *   - 生徒の学習データ本体（study_progress）は生徒本人の所有物のまま。
 *     先生は「自分のクラスに在籍している生徒の分だけ」読める。
 *   - 生徒には「どのクラスに参加しているか」が常に見える状態にする
 *     （知らないうちに先生に見られている、という状態を作らない）。
 *   - 生徒は自分でクラスから抜けられる。
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from './firestoreMetered';
import { db } from '../firebase';

import { generateJoinCode, isValidJoinCode, validateClassroomInput, validateJoinCodeInput, resolveRosterName, ROSTER_NAME_MAX, type ClassroomDoc, type ClassroomInput } from './classroomCore';
import { sanitizeNickname } from '../features/safety/nicknameFilter';
import { type ErrorLike } from './errorLike';
import { CLASSROOMS_COLLECTION, CLASS_CODES_COLLECTION, CLASS_MEMBERS_COLLECTION, STUDY_ACCESS_COLLECTION, studyAccessDocId, memberDocId, toFriendlyError, requireUid } from './classroomShared';
import { saveSchoolBrand, clearSchoolBrandFor } from './classroomAnalytics';
export { fetchClassSummaries, fetchClassRawProgress, KANTEN_MASTERED_BOX, fetchMyMembershipDetails, saveSchoolBrand, loadSchoolBrand, clearSchoolBrandFor } from './classroomAnalytics';
export type { StudentRawProgress, MembershipDetail } from './classroomAnalytics';
export { CLASSROOMS_COLLECTION, CLASS_CODES_COLLECTION, CLASS_MEMBERS_COLLECTION, STUDY_ACCESS_COLLECTION, studyAccessDocId, memberDocId, fetchMyMemberships, fetchClassMembers } from './classroomShared';

// ===================================================================
// 先生：クラスを作る
// ===================================================================

/**
 * 参加コードの重複を避けてクラスを作る。
 *
 * コードは 27^6 ≒ 3.8億通りあるので実際上まず衝突しないが、
 * 衝突すると**別のクラスに生徒が入ってしまう**という最悪の事故に
 * なるため、必ず存在確認してから確定する（最大5回まで再試行）。
 */
export async function createClassroom(input: ClassroomInput): Promise<ClassroomDoc> {
  const teacherUid = requireUid();

  const validation = validateClassroomInput(input);
  if (!validation.ok) throw new Error(validation.message);

  const classId = doc(collection(db, CLASSROOMS_COLLECTION)).id;

  let joinCode = '';
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateJoinCode();
    try {
      const existing = await getDoc(doc(db, CLASS_CODES_COLLECTION, candidate));
      if (!existing.exists()) {
        joinCode = candidate;
        break;
      }
    } catch (error) {
      throw toFriendlyError(error, '参加コードの確認に失敗しました。');
    }
  }
  if (!joinCode) {
    throw new Error('参加コードの発行に失敗しました。もう一度お試しください。');
  }

  const payload = {
    id: classId,
    teacherUid,
    schoolName: input.schoolName.trim(),
    className: input.className.trim(),
    joinCode,
    subject: input.subject,
    joinOpen: true,
    memberCount: 0,
  };

  try {
    await setDoc(doc(db, CLASSROOMS_COLLECTION, classId), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    // 逆引きインデックスは classrooms の作成が成功してから作る
    // （先にコードだけ存在して中身が無い状態を避ける）
    await setDoc(doc(db, CLASS_CODES_COLLECTION, joinCode), {
      classId,
      teacherUid,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    throw toFriendlyError(error, 'クラスの作成に失敗しました。');
  }

  return payload as ClassroomDoc;
}

/** 先生：自分が担当しているクラスの一覧 */
export async function fetchMyClassrooms(): Promise<ClassroomDoc[]> {
  const teacherUid = requireUid();
  try {
    const snapshot = await getDocs(
      query(collection(db, CLASSROOMS_COLLECTION), where('teacherUid', '==', teacherUid)),
    );
    return snapshot.docs.map((row) => ({ ...(row.data() as ClassroomDoc), id: row.id }));
  } catch (error) {
    throw toFriendlyError(error, 'クラス一覧の取得に失敗しました。');
  }
}

/** 先生：参加の受付を開く／閉じる（学期末に閉じる想定） */
export async function setJoinOpen(classId: string, joinOpen: boolean): Promise<void> {
  requireUid();
  try {
    await updateDoc(doc(db, CLASSROOMS_COLLECTION, classId), {
      joinOpen,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw toFriendlyError(error, '参加受付の変更に失敗しました。');
  }
}

/**
 * 先生：生徒の表示名（出席番号など）を設定する。
 *
 * ニックネームだけでは誰か分からず、成績処理に使えないため。
 * 生徒側からは変更できない（先生の名簿を生徒に書き換えさせない）。
 */
export async function setRosterName(classId: string, studentUid: string, rosterName: string): Promise<void> {
  requireUid();
  const trimmed = (rosterName || '').trim().slice(0, ROSTER_NAME_MAX);
  try {
    await updateDoc(doc(db, CLASS_MEMBERS_COLLECTION, memberDocId(classId, studentUid)), {
      rosterName: trimmed,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw toFriendlyError(error, '名前の設定に失敗しました。');
  }
}

// ===================================================================
// 生徒：クラスに参加する
// ===================================================================

export interface JoinResult {
  classroom: ClassroomDoc;
  alreadyJoined: boolean;
}

/**
 * 参加コードでクラスに入る。
 *
 * 手順：
 *   ① コードを正規化・検証（打ち間違いをここで弾く）
 *   ② class_codes から classId を引く（get のみ。列挙は不可）
 *   ③ classrooms を読み、受付中か確認
 *   ④ class_members に自分の行を作る
 */
export async function joinClassroomByCode(rawCode: string, displayName: string): Promise<JoinResult> {
  const uid = requireUid();

  const validation = validateJoinCodeInput(rawCode);
  if (!validation.ok) throw new Error(validation.message);
  const code = validation.code;

  try {
    const codeSnapshot = await getDoc(doc(db, CLASS_CODES_COLLECTION, code));
    if (!codeSnapshot.exists()) {
      throw new Error('そのコードのクラスは見つかりませんでした。先生に確認してください。');
    }
    const classId = String((codeSnapshot.data() as { classId?: unknown } | undefined)?.classId || '');
    if (!classId) {
      throw new Error('クラス情報が壊れています。先生に連絡してください。');
    }

    const classSnapshot = await getDoc(doc(db, CLASSROOMS_COLLECTION, classId));
    if (!classSnapshot.exists()) {
      throw new Error('クラスが見つかりませんでした。すでに削除された可能性があります。');
    }
    const classroom = { ...(classSnapshot.data() as ClassroomDoc), id: classId };

    if (classroom.joinOpen === false) {
      throw new Error('このクラスは現在、参加を受け付けていません。');
    }

    const memberRef = doc(db, CLASS_MEMBERS_COLLECTION, memberDocId(classId, uid));
    const existing = await getDoc(memberRef);
    if (existing.exists()) {
      // すでに参加済みでも学校名は焼き直す（端末を変えた直後はローカルが空）
      saveSchoolBrand(classroom.schoolName, classId);
      return { classroom, alreadyJoined: true };
    }

    await setDoc(memberRef, {
      classId,
      uid,
      displayName: sanitizeNickname((displayName || '').trim().slice(0, ROSTER_NAME_MAX), '（名前未設定）'),
      joinedAt: serverTimestamp(),
    });

    // 生徒本人の操作として「担任に学習状況の閲覧を許可する」記録を作る。
    // これが無いと先生は study_progress を読めない（ルールで拒否される）。
    await setDoc(doc(db, STUDY_ACCESS_COLLECTION, studyAccessDocId(uid, classroom.teacherUid)), {
      studentUid: uid,
      teacherUid: classroom.teacherUid,
      classId,
      grantedAt: serverTimestamp(),
    });

    // ホワイトレーベル：以後この端末では学校名を主役に表示する
    saveSchoolBrand(classroom.schoolName, classId);

    return { classroom, alreadyJoined: false };
  } catch (error) {
    // 自分で投げた日本語エラーはそのまま通す
    if (error instanceof Error && !(error as ErrorLike).code) throw error;
    throw toFriendlyError(error, 'クラスへの参加に失敗しました。');
  }
}

/**
 * 生徒：クラスから抜ける（自分の意思で抜けられる状態を保つ）。
 *
 * 在籍レコードと同時に、担任への閲覧許可も取り消す。
 * 「抜けたのにまだ見られている」状態を残さないため、
 * teacherUid が分かる場合は必ず study_access も消す。
 */
export async function leaveClassroom(classId: string, teacherUid?: string): Promise<void> {
  const uid = requireUid();
  try {
    await deleteDoc(doc(db, CLASS_MEMBERS_COLLECTION, memberDocId(classId, uid)));

    let teacher = teacherUid;
    if (!teacher) {
      // 呼び出し側が知らない場合はクラスから引く（失敗しても退出は成立させる）
      try {
        const snapshot = await getDoc(doc(db, CLASSROOMS_COLLECTION, classId));
        teacher = snapshot.exists() ? String((snapshot.data() as { teacherUid?: unknown } | undefined)?.teacherUid || '') : '';
      } catch {
        teacher = '';
      }
    }
    if (teacher) {
      await deleteDoc(doc(db, STUDY_ACCESS_COLLECTION, studyAccessDocId(uid, teacher)));
    }

    // 抜けたクラス由来の学校名表示は取り下げる（在籍していない学校名を掲げ続けない）
    clearSchoolBrandFor(classId);
  } catch (error) {
    throw toFriendlyError(error, 'クラスからの退出に失敗しました。');
  }
}

/** 参加コードが形式的に正しいか（画面の即時バリデーション用に再公開） */
export { isValidJoinCode, validateJoinCodeInput, resolveRosterName };
