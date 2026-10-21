/**
 * 先生向けの生徒の進捗集計と、校名ブランドの保存（C-15: classroom.ts から分離）。
 *   classroom.ts はクラスの作成・参加・退出（CRUD）だけを持つ。
 *   中身は分離前と1文字も変えていない。export は classroom.ts からも従来どおり取れる。
 */
import { doc, getDoc } from './firestoreMetered';
import { db } from '../firebase';
import { resolveRosterName, parseSchoolBrand, SCHOOL_BRAND_KEY, type ClassroomDoc, type SchoolBrand } from './classroomCore';
import { STUDY_PROGRESS_COLLECTION } from './studySync';
import { fromSyncedReviewItems, type SolvedMap } from './studySyncCore';
import { type ReviewItem } from './reviewList';
import { buildStudentSummary, type StudentSummary } from './studySummary';
import { CLASSROOMS_COLLECTION, MASTERED_BOX, fetchMyMemberships, fetchClassMembers } from './classroomShared';
import { requireLocalStorage, setItemOrThrow } from './safeLocalStorage';

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
    setItemOrThrow(SCHOOL_BRAND_KEY, JSON.stringify({ schoolName: trimmed, classId }));
  } catch {
    // localStorage が使えない環境でも学習自体は続けられるので黙って諦める
  }
}

/** 保存された学校名を読む（無ければ null） */
export function loadSchoolBrand(): SchoolBrand | null {
  try {
    return parseSchoolBrand(requireLocalStorage().getItem(SCHOOL_BRAND_KEY));
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
    requireLocalStorage().removeItem(SCHOOL_BRAND_KEY);
  } catch {
    // 同上
  }
}
