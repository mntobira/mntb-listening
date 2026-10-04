/**
 * ===================================================================
 * クラス（学校・先生・生徒）のデータモデル：純粋ロジック層
 * ===================================================================
 *
 * -------------------------------------------------------------------
 * ■ 目的
 * -------------------------------------------------------------------
 * 先生が「自分の担当クラスの生徒だけ」の学習状況を見られるようにする。
 * これが無いと、教材として学校へ提供する話が始まらない
 * （先生が生徒の状況を見る手段が現状ゼロ）。
 *
 * -------------------------------------------------------------------
 * ■ 参加コード方式を採る理由
 * -------------------------------------------------------------------
 * 学校で使う際、最大の障壁は「生徒アカウントの登録作業」である。
 * 先生に40人分のメールアドレスを入力させると、その時点で導入は止まる。
 *
 * そこで、既にこのアプリで実績のある**フレンドコードと同じ方式**を使う。
 *
 *     先生がクラスを作る → 参加コードが発行される
 *     → 黒板に書く／配る → 生徒が入力して参加
 *
 * 先生の作業は「コードを1つ共有する」だけになる。
 *
 * -------------------------------------------------------------------
 * ■ コード設計（friend_codes の教訓を引き継ぐ）
 * -------------------------------------------------------------------
 * firestore.rules に既に書かれている重要な知見：
 *
 *   > Firestore のルールは「クエリ結果」ではなく「クエリが必ず条件を
 *   > 満たすと静的に証明できるか」で判定される。
 *
 * つまり where('joinCode','==',code) の検索を許可すると
 * クラス一覧を全部読めてしまう。よって friend_codes と同様に
 *
 *     class_codes/{joinCode} -> { classId, teacherUid }
 *
 * という逆引きインデックスを作り、get のみ許可・list は禁止にする。
 *
 * コードは 6 文字。紛らわしい文字（0/O、1/I/L）を除いた 28 文字から選ぶ。
 * 黒板に書いて読み間違えられると現場で確実に事故るため、これは必須。
 * 28^6 ≒ 4.8億通り。総当りは list 禁止で防ぐ。
 */

// 教科IDの型は data/allChapters.ts の SubjectKey が唯一の定義。
// import type なのでコンパイル時に消え、実行時の依存は増えない。
import type { SubjectKey } from '../data/allChapters';

/**
 * 参加コードに使う文字集合。
 * 除外：0 O（ゼロとオー）、1 I L（イチとアイとエル）、
 *       U V（手書きで混同）、8 B（同様）
 * 読み上げても書き写しても間違えにくい組み合わせを残している。
 */
export const JOIN_CODE_ALPHABET = 'ACDEFGHJKMNPQRSTWXYZ2345679';

export const JOIN_CODE_LENGTH = 6;

/** 参加コードの形（例: MNTB-A3K9DF の後半6文字部分） */
export const JOIN_CODE_PATTERN = /^[ACDEFGHJKMNPQRSTWXYZ2345679]{6}$/;

/**
 * 参加コードを生成する。
 *
 * @param random 0以上1未満を返す関数（テストで固定するため差し替え可能）
 */
/**
 * 既定の乱数は暗号論的乱数（crypto.getRandomValues）。
 * ★Math.random は内部状態を数個の出力から推定できる★ため、
 *   先生がクラスを作った直後のコードを第三者に予測されないようにする。
 */
export function secureRandom(): number {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.getRandomValues) {
    const buf = new Uint32Array(1);
    c.getRandomValues(buf);
    return (buf[0] ?? 0) / 0x1_0000_0000;
  }
  return Math.random();
}

export function generateJoinCode(random: () => number = secureRandom): string {
  let code = '';
  for (let i = 0; i < JOIN_CODE_LENGTH; i += 1) {
    const index = Math.floor(random() * JOIN_CODE_ALPHABET.length) % JOIN_CODE_ALPHABET.length;
    code += JOIN_CODE_ALPHABET[index];
  }
  return code;
}

/**
 * 生徒が入力したコードを正規化する。
 *
 * 現場で必ず起きる入力ゆれを吸収する：
 *   - 小文字で打つ            → 大文字化
 *   - 空白やハイフンを挟む    → 除去
 *   - ゼロとオーの打ち間違い  → O に寄せる（0 は使わない文字なので安全に変換できる）
 *   - イチとアイの打ち間違い  → 1 → J ではなく、あえて変換しない
 *
 * ⚠️ 0→O の変換は「0 がコード文字集合に含まれない」ことが前提。
 *    含まれる文字を書き換えると別の有効コードに化けてしまうため、
 *    除外文字からの寄せ替えだけを行う。
 */
export function normalizeJoinCode(input: string): string {
  const upper = (input || '').toUpperCase().replace(/[\s\-_]/g, '');
  return upper
    .replace(/0/g, 'O') // ゼロ → オー（O も除外文字だが下の検証で弾かれる）
    .replace(/1/g, 'I') // イチ → アイ（同上）
    .replace(/[^A-Z0-9]/g, '');
}

/** コードが有効な形式か */
export function isValidJoinCode(code: string): boolean {
  return JOIN_CODE_PATTERN.test(code);
}

// ===================================================================
// クラス・在籍のデータ形
// ===================================================================

export interface ClassroomDoc {
  /** クラスID（Firestore のドキュメントID） */
  id: string;
  /** 担当教員の uid */
  teacherUid: string;
  /** 学校名（ホワイトレーベル表示にも使う） */
  schoolName: string;
  /** クラス名（例：2年A組 化学基礎） */
  className: string;
  /** 参加コード */
  joinCode: string;
  /** 対象科目 */
  subject: SubjectKey;
  /** 参加を受け付けているか（学期終了後に閉じられる） */
  joinOpen: boolean;
  /** 在籍数（表示用のキャッシュ。厳密な数は members を数える） */
  memberCount?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ClassMemberDoc {
  /** 生徒の uid（ドキュメントIDにもする） */
  uid: string;
  classId: string;
  /**
   * 先生の画面に出す名前。
   * ⚠️ ニックネームだと誰か分からないため、先生が出席番号や本名を
   *    後から設定できるようにする（生徒側からは変更させない）。
   */
  displayName: string;
  /** 先生が付ける表示名（出席番号など）。未設定なら displayName を使う */
  rosterName?: string;
  joinedAt?: unknown;
}

/**
 * 先生の画面に出す名前を決める。
 * 先生が設定した rosterName を優先し、無ければ生徒のニックネーム、
 * それも無ければ「（名前未設定）」を出す。
 */
export function resolveRosterName(member: Pick<ClassMemberDoc, 'displayName' | 'rosterName'>): string {
  const roster = (member.rosterName || '').trim();
  if (roster) return roster;
  const display = (member.displayName || '').trim();
  if (display) return display;
  return '（名前未設定）';
}

// ===================================================================
// 入力の検証
// ===================================================================

export const SCHOOL_NAME_MAX = 40;
export const CLASS_NAME_MAX = 40;
export const ROSTER_NAME_MAX = 24;

export interface ClassroomInput {
  schoolName: string;
  className: string;
  subject: ClassroomDoc['subject'];
}

export interface ValidationResult {
  ok: boolean;
  /** 画面に出すエラー文（ok なら空） */
  message: string;
}

/**
 * クラス作成入力の検証。
 * Firestore ルール側でも同じ上限を掛けるが、
 * ユーザーには通信前に日本語で返したいのでクライアントでも検証する。
 */
export function validateClassroomInput(input: ClassroomInput): ValidationResult {
  const school = (input.schoolName || '').trim();
  const className = (input.className || '').trim();

  if (!school) return { ok: false, message: '学校名を入力してください。' };
  if (school.length > SCHOOL_NAME_MAX) {
    return { ok: false, message: `学校名は${SCHOOL_NAME_MAX}文字以内で入力してください。` };
  }
  if (!className) return { ok: false, message: 'クラス名を入力してください。' };
  if (className.length > CLASS_NAME_MAX) {
    return { ok: false, message: `クラス名は${CLASS_NAME_MAX}文字以内で入力してください。` };
  }
  if (
    ![
      'chemistry_basic',
      'chemistry',
      'english_listening',
      'english_grammar',
      'math',
      'biology_basic',
      'geography',
    ].includes(
      input.subject,
    )
  ) {
    return { ok: false, message: '対象科目を選んでください。' };
  }
  return { ok: true, message: '' };
}

/**
 * 参加コード入力の検証（生徒側）。
 * 「なぜ弾かれたか」が分かる文言にする。
 * 現場で最も多いのは桁数間違いと、除外文字（O/I など）の打ち間違い。
 */
export function validateJoinCodeInput(rawInput: string): ValidationResult & { code: string } {
  const code = normalizeJoinCode(rawInput);

  if (!code) {
    return { ok: false, message: '参加コードを入力してください。', code };
  }
  if (code.length !== JOIN_CODE_LENGTH) {
    return {
      ok: false,
      message: `参加コードは${JOIN_CODE_LENGTH}文字です。先生に確認してください。`,
      code,
    };
  }
  if (!isValidJoinCode(code)) {
    return {
      ok: false,
      message: '参加コードに使えない文字が含まれています。似ている文字（O と 0、I と 1）を確認してください。',
      code,
    };
  }
  return { ok: true, message: '', code };
}

// ===================================================================
// クラス集計（先生ダッシュボードの上段）
// ===================================================================

export interface ClassAggregate {
  /** 在籍数 */
  memberCount: number;
  /** 直近7日に1度でも学習した生徒数 */
  activeIn7: number;
  /** 一度も学習していない生徒数（最初に声を掛けるべき対象） */
  neverStudied: number;
  /** クラス平均の解いた大問数 */
  avgSolved: number;
  /** クラス平均の取り組み度 */
  avgEngagement: number;
  /** 未処理の復習が多い順に上位の生徒（気になる子を先生へ提示） */
  needsAttention: Array<{ uid: string; displayName: string; overdue: number }>;
}

export interface AggregatableStudent {
  uid: string;
  displayName: string;
  solvedTotal: number;
  activeDaysIn14: number;
  lastStudiedAt: string | null;
  review: { overdue: number };
  engagement: { score: number };
}

/**
 * クラス全体を集計する。
 *
 * 「平均」だけを出すと、一部の頑張っている生徒に隠れて
 * 手が止まっている生徒が見えなくなる。先生が本当に知りたいのは
 * **誰に声を掛けるべきか**なので、neverStudied と needsAttention を
 * 必ず併せて返す。
 */
export function aggregateClass(
  students: AggregatableStudent[],
  now: number = Date.now(),
): ClassAggregate {
  const list = Array.isArray(students) ? students : [];
  const count = list.length;

  if (count === 0) {
    return {
      memberCount: 0,
      activeIn7: 0,
      neverStudied: 0,
      avgSolved: 0,
      avgEngagement: 0,
      needsAttention: [],
    };
  }

  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  let activeIn7 = 0;
  let neverStudied = 0;
  let solvedSum = 0;
  let engagementSum = 0;

  list.forEach((student) => {
    solvedSum += Number(student.solvedTotal) || 0;
    engagementSum += Number(student.engagement?.score) || 0;

    if (!student.lastStudiedAt) {
      neverStudied += 1;
      return;
    }
    const last = new Date(`${student.lastStudiedAt}T00:00:00`).getTime();
    if (Number.isFinite(last) && last >= sevenDaysAgo) activeIn7 += 1;
  });

  const needsAttention = list
    .filter((student) => (Number(student.review?.overdue) || 0) > 0)
    .sort((a, b) => (b.review?.overdue || 0) - (a.review?.overdue || 0))
    .slice(0, 5)
    .map((student) => ({
      uid: student.uid,
      displayName: student.displayName,
      overdue: Number(student.review?.overdue) || 0,
    }));

  return {
    memberCount: count,
    activeIn7,
    neverStudied,
    avgSolved: Math.round((solvedSum / count) * 10) / 10,
    avgEngagement: Math.round(engagementSum / count),
    needsAttention,
  };
}

// ===================================================================
// ホワイトレーベル（学校名の差し替え）
// ===================================================================

/**
 * 生徒が所属する学校名の保存キー。
 *
 * ■ なぜ localStorage に持つのか
 * 学校名は「アプリを開いた瞬間」に出したい情報である。
 * 起動時に Firestore を読んでから描画すると、
 *   ①一瞬デフォルトのブランド名が出てから学校名に差し替わる
 *   ②オフラインだと学校名が消える
 * という、ホワイトレーベルとして最も避けたい見え方になる。
 * そこでクラス参加時に取得した学校名をローカルに焼き付け、
 * 次回以降は即座に表示する（Firestore は裏で確認するだけ）。
 */
export const SCHOOL_BRAND_KEY = 'school_brand_v1';

export interface SchoolBrand {
  /** 学校名（表示する主役） */
  schoolName: string;
  /** どのクラス由来か（クラスを抜けたときに消すため） */
  classId: string;
}

/**
 * 保存されたブランド情報を読む。
 * 壊れた JSON や空文字は「未設定」として扱い、既定のブランドへ戻す
 * （学校名の表示は装飾なので、失敗しても画面を落としてはいけない）。
 */
export function parseSchoolBrand(raw: string | null | undefined): SchoolBrand | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SchoolBrand>;
    const schoolName = String(parsed?.schoolName || '').trim();
    if (!schoolName) return null;
    return {
      schoolName: schoolName.slice(0, SCHOOL_NAME_MAX),
      classId: String(parsed?.classId || ''),
    };
  } catch {
    return null;
  }
}

/**
 * 画面に出す組織名を決める。
 *
 * 学校名が設定されていればそれを主役にし、無ければ既定名に戻す。
 * 「〇〇高校 × マナトビ」のような併記にしないのは、
 * 学校に配るときに「うちの教材」として見えるほうが導入されやすいため。
 */
export function resolveBrandLabel(brand: SchoolBrand | null, fallback = 'マナトビ'): string {
  const name = brand?.schoolName?.trim();
  return name ? name : fallback;
}
