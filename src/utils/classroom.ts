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
import { db, auth } from '../firebase';

import {
  generateJoinCode,
  isValidJoinCode,
  validateClassroomInput,
  validateJoinCodeInput,
  resolveRosterName,
  parseSchoolBrand,
  SCHOOL_BRAND_KEY,
  ROSTER_NAME_MAX,
  type ClassroomDoc,
  type ClassMemberDoc,
  type ClassroomInput,
  type SchoolBrand,
} from './classroomCore';
import { STUDY_PROGRESS_COLLECTION } from './studySync';
import { fromSyncedReviewItems, type SolvedMap } from './studySyncCore';
import { REVIEW_INTERVALS_DAYS, type ReviewItem } from './reviewList';
import { buildStudentSummary, type StudentSummary } from './studySummary';
import { sanitizeNickname } from '../features/safety/nicknameFilter';
import { type ErrorLike } from './errorLike';
import { toFriendlyFirestoreError, type FirestoreErrorMessages } from './firestoreErrors';

export const CLASSROOMS_COLLECTION = 'classrooms';
export const CLASS_CODES_COLLECTION = 'class_codes';
export const CLASS_MEMBERS_COLLECTION = 'class_members';

/**
 * 「この生徒が、この先生に学習データの閲覧を許可した」という記録。
 *
 * -------------------------------------------------------------------
 * ■ なぜ専用のコレクションが必要なのか（セキュリティルールの制約）
 * -------------------------------------------------------------------
 * 先生が study_progress/{生徒uid} を読めるようにしたい。しかし
 * Firestore のルールでは**繰り返し処理が書けない**ため、
 * 「先生が担当する全クラスを走査して、その生徒が在籍しているか」を
 * 判定できない（クラス数が可変なので exists() を並べられない）。
 *
 * そこで「生徒uid + 先生uid」をドキュメントIDにした許可レコードを置き、
 * ルールでは **exists() 1回**で判定できる形にする。
 *
 *   study_access/{生徒uid}_{先生uid} = { studentUid, teacherUid, classId }
 *
 * -------------------------------------------------------------------
 * ■ この設計が同時に満たす「同意」の考え方
 * -------------------------------------------------------------------
 * このレコードを作れるのは**生徒本人だけ**（ルールで強制）。
 * つまり先生が勝手に生徒のデータを覗くことは原理的にできず、
 * 生徒がクラスに参加する行為＝閲覧を許可する行為になる。
 * 生徒がクラスを抜ければ許可も消える。
 *
 * 学校へ提供する際に必ず問われる「誰が何を見られるのか」に対して、
 * 仕組みで答えられる形にしてある。
 */
export const STUDY_ACCESS_COLLECTION = 'study_access';

/** study_access のドキュメントID */
export function studyAccessDocId(studentUid: string, teacherUid: string): string {
  return `${studentUid}_${teacherUid}`;
}

/** 「定着した」とみなす box（最終段階 = 60日間隔まで到達） */
const MASTERED_BOX = REVIEW_INTERVALS_DAYS.length - 1;

/** class_members のドキュメントID（1クラス1生徒1行を保証） */
export function memberDocId(classId: string, uid: string): string {
  return `${classId}_${uid}`;
}

/** classroom.ts 用の Firestore エラー文言（コード → 表示文）。 */
const CLASSROOM_ERROR_MESSAGES: FirestoreErrorMessages = {
  'permission-denied':
    'この操作は許可されていません。Firestore のセキュリティルールが古い可能性があります。管理者は firestore.rules をデプロイしてください（docs/DEPLOY_FIRESTORE_RULES.md 参照）。',
  unauthenticated: 'ログインの有効期限が切れています。もう一度ログインしてください。',
  unavailable: '通信できませんでした。オンラインに戻ってからお試しください。',
  'failed-precondition': '通信できませんでした。オンラインに戻ってからお試しください。',
  'not-found': '対象が見つかりませんでした。画面を更新してお試しください。',
  'already-exists': 'すでに登録されています。画面を更新してご確認ください。',
};

/**
 * Firestore のエラーを、現場の人に意味が伝わる日本語へ変換する。
 * friends.ts と同じ方針（「Missing or insufficient permissions」を出さない）。実体は firestoreErrors.ts。
 */
function toFriendlyError(rawError: unknown, fallback: string): Error {
  return toFriendlyFirestoreError(rawError, fallback, CLASSROOM_ERROR_MESSAGES);
}

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('ログインが必要です。Googleログインしてからお試しください。');
  return uid;
}

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

/** 生徒：自分が参加しているクラス一覧（「見られている」ことを明示するため必須） */
export async function fetchMyMemberships(): Promise<ClassMemberDoc[]> {
  const uid = requireUid();
  try {
    const snapshot = await getDocs(
      query(collection(db, CLASS_MEMBERS_COLLECTION), where('uid', '==', uid)),
    );
    return snapshot.docs.map((row) => row.data() as ClassMemberDoc);
  } catch (error) {
    throw toFriendlyError(error, '参加クラスの取得に失敗しました。');
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

// ===================================================================
// 先生：クラスの学習状況を集める
// ===================================================================

/** クラスの在籍者一覧 */
export async function fetchClassMembers(classId: string): Promise<ClassMemberDoc[]> {
  requireUid();
  try {
    const snapshot = await getDocs(
      query(collection(db, CLASS_MEMBERS_COLLECTION), where('classId', '==', classId)),
    );
    return snapshot.docs.map((row) => row.data() as ClassMemberDoc);
  } catch (error) {
    throw toFriendlyError(error, '在籍者の取得に失敗しました。');
  }
}

/**
 * クラス全員の学習サマリーを取る。
 *
 * ⚠️ 読み取り回数について
 * 生徒1人につき study_progress を1回読むので、40人クラスで 40 read。
 * Firestore の無料枠は1日5万 read なので、40人×先生10人が
 * 1日10回開いても 4,000 read で収まる。1人1ドキュメントに
 * まとめた設計がここで効いている。
 *
 * 1人分の取得が失敗しても全体を止めない（欠けた生徒は「未同期」扱い）。
 */
export async function fetchClassSummaries(classId: string): Promise<StudentSummary[]> {
  const members = await fetchClassMembers(classId);
  if (members.length === 0) return [];

  const results = await Promise.all(
    members.map(async (member): Promise<StudentSummary> => {
      const displayName = resolveRosterName(member);
      try {
        const snapshot = await getDoc(doc(db, STUDY_PROGRESS_COLLECTION, member.uid));
        const data = snapshot.exists() ? snapshot.data() || {} : {};
        const solved = (data.solved && typeof data.solved === 'object' ? data.solved : {}) as SolvedMap;
        const reviewItems: ReviewItem[] = fromSyncedReviewItems(data.reviewItems);
        return buildStudentSummary({
          uid: member.uid,
          displayName,
          solved,
          reviewItems,
          masteredBox: MASTERED_BOX,
        });
      } catch {
        // 読めなかった生徒は「データなし」として並べる（画面を落とさない）
        return buildStudentSummary({
          uid: member.uid,
          displayName,
          solved: {},
          reviewItems: [],
          masteredBox: MASTERED_BOX,
        });
      }
    }),
  );

  // 気になる生徒（未処理の復習が多い順）を上に出す
  return results.sort((a, b) => b.review.overdue - a.review.overdue);
}

// ===================================================================
// 観点別評価レポート用：生の学習データを取る
// ===================================================================

/**
 * 生徒1人分の「生の」学習データ（サマリーに潰す前の形）。
 *
 * fetchClassSummaries が返す StudentSummary は一覧表示用に
 * 集計済みで、章別の到達状況（観点別評価の「知識・技能」の材料）を
 * 復元できない。観点別レポートは solved マップそのものが必要なので、
 * 別の取得口を用意する。
 *
 * ⚠️ 読み取り回数は fetchClassSummaries と同じ（生徒1人 = 1 read）。
 *    同じ study_progress ドキュメントを読むだけで、
 *    Firestore 側に新しいコレクションは増えない。
 */
export interface StudentRawProgress {
  uid: string;
  displayName: string;
  solved: SolvedMap;
  reviewItems: ReviewItem[];
}

/**
 * クラス全員分の生データを取る（観点別評価タブが使う）。
 * 1人分の取得が失敗しても全体を止めない方針は fetchClassSummaries と同じ。
 */
export async function fetchClassRawProgress(classId: string): Promise<StudentRawProgress[]> {
  const members = await fetchClassMembers(classId);
  if (members.length === 0) return [];

  const results = await Promise.all(
    members.map(async (member): Promise<StudentRawProgress> => {
      const displayName = resolveRosterName(member);
      try {
        const snapshot = await getDoc(doc(db, STUDY_PROGRESS_COLLECTION, member.uid));
        const data = snapshot.exists() ? snapshot.data() || {} : {};
        const solved = (data.solved && typeof data.solved === 'object' ? data.solved : {}) as SolvedMap;
        return { uid: member.uid, displayName, solved, reviewItems: fromSyncedReviewItems(data.reviewItems) };
      } catch {
        return { uid: member.uid, displayName, solved: {}, reviewItems: [] };
      }
    }),
  );

  // 名簿順（名前の五十音順）で返す。所見を書く作業は名簿と突き合わせるため、
  // 「未処理が多い順」ではなく毎回同じ並びのほうが使いやすい。
  return results.sort((a, b) => a.displayName.localeCompare(b.displayName, 'ja'));
}

/** 「定着した」とみなす box（観点別レポートの画面からも同じ基準を使う） */
export const KANTEN_MASTERED_BOX = MASTERED_BOX;

/** 参加コードが形式的に正しいか（画面の即時バリデーション用に再公開） */
export { isValidJoinCode, validateJoinCodeInput, resolveRosterName };

// ===================================================================
// 生徒：自分の参加状況を「見える化」する
// ===================================================================

/**
 * 参加しているクラスの詳細（生徒に見せる用）。
 *
 * class_members だけでは classId しか分からず、生徒には
 * 「誰に、どの名前で見られているのか」が伝わらない。
 * 学校名・クラス名・担当教員を必ず添えて返す。
 */
export interface MembershipDetail {
  classId: string;
  teacherUid: string;
  schoolName: string;
  className: string;
  subject: ClassroomDoc['subject'];
  /** 先生の画面に出ている自分の名前（名簿名が設定済みならそれ） */
  rosterName: string;
}

/**
 * 参加クラスを、生徒に説明できる形まで膨らませて返す。
 *
 * クラスが消えている（先生が削除した）場合はその行を落とす。
 * 「存在しないクラスに見られている」ように表示するほうが不誠実なため。
 */
export async function fetchMyMembershipDetails(): Promise<MembershipDetail[]> {
  const memberships = await fetchMyMemberships();
  if (memberships.length === 0) return [];

  const details = await Promise.all(
    memberships.map(async (member): Promise<MembershipDetail | null> => {
      try {
        const snapshot = await getDoc(doc(db, CLASSROOMS_COLLECTION, member.classId));
        if (!snapshot.exists()) return null;
        const room = snapshot.data() as ClassroomDoc;
        return {
          classId: member.classId,
          teacherUid: String(room.teacherUid || ''),
          schoolName: String(room.schoolName || ''),
          className: String(room.className || ''),
          subject: room.subject,
          rosterName: resolveRosterName(member),
        };
      } catch {
        return null;
      }
    }),
  );

  return details.filter((row): row is MembershipDetail => row !== null);
}

/**
 * ホワイトレーベル：学校名をローカルに焼き付ける／消す。
 *
 * 参加時に保存し、退出時に（その学校由来なら）消す。
 * 複数クラスに入っている場合は最初に見つかった学校名を使う
 * ——同じ生徒が別の学校のクラスに入るケースは想定していない。
 */
export function saveSchoolBrand(schoolName: string, classId: string): void {
  try {
    const trimmed = (schoolName || '').trim();
    if (!trimmed) return;
    localStorage.setItem(SCHOOL_BRAND_KEY, JSON.stringify({ schoolName: trimmed, classId }));
  } catch {
    // localStorage が使えない環境でも学習自体は続けられるので黙って諦める
  }
}

/** 保存された学校名を読む（無ければ null） */
export function loadSchoolBrand(): SchoolBrand | null {
  try {
    return parseSchoolBrand(localStorage.getItem(SCHOOL_BRAND_KEY));
  } catch {
    return null;
  }
}

/** そのクラス由来の学校名を消す（別クラス由来なら残す） */
export function clearSchoolBrandFor(classId: string): void {
  try {
    const current = loadSchoolBrand();
    if (!current) return;
    if (current.classId && current.classId !== classId) return;
    localStorage.removeItem(SCHOOL_BRAND_KEY);
  } catch {
    // 同上
  }
}
