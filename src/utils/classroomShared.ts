/**
 * クラス機能の土台（C-15: classroom.ts から分離）。コレクション名・ドキュメント ID・エラー文言と、
 * 在籍の読み出し（fetchMyMemberships / fetchClassMembers）。
 *   classroom.ts（作成・参加・退出）と classroomAnalytics.ts（進捗集計・校名）の両方がここを使う。
 *   依存は classroom → classroomAnalytics → classroomShared の一方向（循環なし）。
 *   中身は分離前と1文字も変えていない。export は classroom.ts からも従来どおり取れる。
 */
import { collection, getDocs, query, where } from './firestoreMetered';
import { db, auth } from '../firebase';
import { type ClassMemberDoc } from './classroomCore';
import { REVIEW_INTERVALS_DAYS } from './reviewList';
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
export const MASTERED_BOX = REVIEW_INTERVALS_DAYS.length - 1;

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
export function toFriendlyError(rawError: unknown, fallback: string): Error {
  return toFriendlyFirestoreError(rawError, fallback, CLASSROOM_ERROR_MESSAGES);
}

export function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('ログインが必要です。Googleログインしてからお試しください。');
  return uid;
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
