/**
 * ===================================================================
 * 復習アイテム → 科目の判定・集計・表示用テキスト
 * ===================================================================
 *
 * ■ なぜこのファイルが必要か
 *   「忘却曲線と定着度」ダッシュボードは、全科目の復習問題を1本の
 *   リストに混ぜて表示していた。化学基礎の問題と英語リスニングの問題が
 *   隣に並ぶため、「どの科目の復習なのか」が色も見出しも無いまま
 *   ユーザーの読解に委ねられていた。
 *
 *   科目ごとに分けて表示したいが、ReviewItem（src/utils/reviewList.ts）は
 *   chapterId しか持っておらず、subject フィールドが無い。
 *   すでに端末の localStorage に保存されている既存データにも当然無い。
 *
 *   そこで「保存済みデータをマイグレーションせずに」科目を復元できるよう、
 *   chapterId から科目を逆引きする関数をここに集約した。
 *   ReviewItem のスキーマを変更しないので、
 *   既存ユーザーの復習リストはそのまま使え、Firestore 同期の
 *   マージ処理（studySyncCore）にも影響しない。
 *
 * ■ 判定の根拠（chapterId の命名規則）
 *   実データの章IDは科目ごとに接頭辞が分かれている（リスニング el… / 英文法 eg…）。
 *   形は教科の登録簿（data/subjects.ts の chapterIdPattern）が持つ。
 *   どれにも合わなければ「その他」として扱う（旧版の化学などのデータも捨てない）。
 */

import { REVIEW_INTERVALS_DAYS, type ReviewItem } from './reviewList';
import { stripHtmlToText } from './sanitizeHtml';

import { SUBJECT_REGISTRY, subjectOfChapterId as registrySubjectOf, type SubjectKey } from '../data/subjects';
import type { ReviewSubjectStyle } from '../data/subjects';
export type { ReviewSubjectStyle } from '../data/subjects';

/** 復習アイテムが属しうる科目（教科の登録簿の教科） */
export type ReviewSubjectId = SubjectKey;

export const UNKNOWN_SUBJECT = 'other' as const;

export type ReviewSubjectKey = ReviewSubjectId | typeof UNKNOWN_SUBJECT;

/** 「すべて」タブのID（科目IDと衝突しない値にしている） */
export const ALL_SUBJECTS = 'all' as const;

export type SubjectTabId = typeof ALL_SUBJECTS | ReviewSubjectKey;

const OTHER_STYLE: ReviewSubjectStyle = {
  textClass: 'text-slate-600',
  bgClass: 'bg-slate-100',
  borderClass: 'border-slate-200',
  activeClass: 'bg-slate-600 text-white border-slate-600',
  stripeClass: 'bg-slate-400',
};

/** 科目の表示名（登録簿から作る。判定できないものは「その他」） */
export const REVIEW_SUBJECT_LABELS = {
  ...Object.fromEntries(SUBJECT_REGISTRY.map((s) => [s.id, s.label])),
  other: 'その他',
} as Record<ReviewSubjectKey, string>;

/** タブに出す短い表示名 */
export const REVIEW_SUBJECT_SHORT_LABELS = {
  ...Object.fromEntries(SUBJECT_REGISTRY.map((s) => [s.id, s.shortLabel])),
  other: 'その他',
} as Record<ReviewSubjectKey, string>;

const SUBJECT_STYLES = {
  ...Object.fromEntries(SUBJECT_REGISTRY.map((s) => [s.id, s.reviewStyle])),
  other: OTHER_STYLE,
} as Record<ReviewSubjectKey, ReviewSubjectStyle>;

export function reviewSubjectStyle(subject: ReviewSubjectKey): ReviewSubjectStyle {
  return SUBJECT_STYLES[subject] || SUBJECT_STYLES.other;
}

// ============================================================
// chapterId → 科目
// ============================================================

/** 章IDから科目を判定する。判定できなければ null（形は登録簿の chapterIdPattern）。実体は data/subjects.ts。 */
export { subjectOfChapterId } from '../data/subjects';

/** 復習アイテムの科目キー（判定できないものは 'other'） */
export function subjectOfReviewItem(item: ReviewItem): ReviewSubjectKey {
  return registrySubjectOf(item.chapterId) ?? UNKNOWN_SUBJECT;
}

// ============================================================
// 定着度
// ============================================================

/** box（間隔反復の段階）から定着度(0〜1)を求める */
export function retentionOf(item: ReviewItem): number {
  const steps = REVIEW_INTERVALS_DAYS.length - 1;
  if (steps <= 0) return 0;
  return Math.max(0, Math.min(1, item.box / steps));
}

/** 定着度の平均をパーセント（整数）で返す。空配列なら 0。 */
export function averageRetentionPercent(items: ReviewItem[]): number {
  if (!items || items.length === 0) return 0;
  const sum = items.reduce((s, it) => s + retentionOf(it), 0);
  return Math.round((sum / items.length) * 100);
}

// ============================================================
// 科目ごとの集計
// ============================================================

export interface SubjectSummary {
  subject: ReviewSubjectKey;
  label: string;
  shortLabel: string;
  items: ReviewItem[];
  /** 総数 */
  total: number;
  /** いま復習すべき件数（dueAt <= now） */
  dueCount: number;
  /** 平均定着度（%） */
  avgRetention: number;
}

/** 表示順（登録簿の並び → その他）を固定する */
const SUBJECT_ORDER: ReviewSubjectKey[] = [...SUBJECT_REGISTRY.map((s) => s.id), UNKNOWN_SUBJECT];

/**
 * 復習アイテムを科目ごとにまとめ、件数と平均定着度を集計する。
 * アイテムが1件も無い科目はタブを増やしても意味がないので返さない。
 */
export function summarizeBySubject(items: ReviewItem[], now: number = Date.now()): SubjectSummary[] {
  const buckets = new Map<ReviewSubjectKey, ReviewItem[]>();
  for (const it of items || []) {
    const key = subjectOfReviewItem(it);
    const arr = buckets.get(key);
    if (arr) arr.push(it);
    else buckets.set(key, [it]);
  }

  return SUBJECT_ORDER.filter((key) => (buckets.get(key)?.length ?? 0) > 0).map((key) => {
    const list = buckets.get(key) as ReviewItem[];
    return {
      subject: key,
      label: REVIEW_SUBJECT_LABELS[key],
      shortLabel: REVIEW_SUBJECT_SHORT_LABELS[key],
      items: list,
      total: list.length,
      dueCount: list.reduce((n, it) => (it.dueAt <= now ? n + 1 : n), 0),
      avgRetention: averageRetentionPercent(list),
    };
  });
}

/** 選択中のタブに対応するアイテムだけを取り出す */
export function filterBySubjectTab(items: ReviewItem[], tab: SubjectTabId): ReviewItem[] {
  if (tab === ALL_SUBJECTS) return items || [];
  return (items || []).filter((it) => subjectOfReviewItem(it) === tab);
}

// ============================================================
// カード表示用テキスト
// ============================================================

/**
 * カード1行目の「出題範囲」を組み立てる。
 *
 * 科目によって questionIndex の意味が違うため、表記を分けている。
 *   リスニング … 1つの大問（第1問Aなど）に複数セットがあるので
 *                「第N回 第1問 A」と読ませる（例: 第2回 第1問 A）
 *   化学系     … 章の中のN番目の問題なので「1章 物質の状態と平衡 第3問」
 *
 * chapterTitle が無い古いデータでも空文字を返さないよう、
 * 章IDを最後の手掛かりとして使う。
 */
/**
 * 一覧カード用に文字列を切り詰める。
 *
 * 以前は復習リスト画面（ReviewList.tsx）と忘却曲線ダッシュボード
 * （StudyHub.tsx）に同じ実装が2つあった。この2画面は「同じ復習
 * アイテム」を並べるため、片方だけ直すと同じ問題の見え方が食い違う。
 * 実装は1つだけにしてある。
 *
 * max は呼び出し側が用途ごとに指定する（既定90／StudyHub は 160・70・60）。
 * 文字数は String.length（UTF-16 コード単位）で数える。移動前と
 * まったく同じ数え方にしてあるので、絵文字を含む問題文でも
 * 切れる位置は変わらない。
 */
export function truncate(text: string, max = 90): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

/**
 * 次の復習予定日を日本語の短い表記にする。
 *
 * これも上記 truncate と同じ理由で、以前は ReviewList.tsx と
 * StudyHub.tsx に同じ実装が2つあった。「明日」と出るか「1日後」と
 * 出るかが画面によって違う、という状態を構造的に作らないために
 * 1つにまとめている。
 *
 *   期限を過ぎている（差が0以下）… 「復習可能」
 *   1日以内                      … 「明日」
 *   それ以降                      … 「N日後」（Math.ceil で切り上げ）
 */
export function formatDue(dueAt: number, now: number): string {
  const diff = dueAt - now;
  if (diff <= 0) return '復習可能';
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
  if (days <= 1) return '明日';
  return `${days}日後`;
}

export function formatScope(item: ReviewItem): string {
  const subject = subjectOfReviewItem(item);
  const title = (item.chapterTitle || '').trim();
  const index = item.questionIndex;

  if (subject === 'english_listening') {
    const round = typeof index === 'number' && index > 0 ? `第${index}回` : '';
    const parts = [round, title].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
  } else {
    const q = typeof index === 'number' && index > 0 ? `第${index}問` : '';
    const parts = [title, q].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
  }

  return title || item.chapterId || '出題範囲不明';
}

/**
 * 設問の要約（カード2行目）。
 *
 * 以前は問題文の冒頭90文字をそのまま出していたため、
 * カードの高さが3〜4行に膨らみ一覧性を損なっていた。
 * ここでは「最初の1文」だけを取り出して短く整える。
 *
 *   - HTMLタグを落とす（stripHtmlToText と同じ安全な実装を使う）
 *   - 改行・連続空白を1つの空白に畳む
 *   - 句点（。．.！？!?）で切って最初の1文にする
 *   - それでも長い場合は max 文字で切って末尾に省略記号を付ける
 */
export function summarizeQuestion(raw: string | null | undefined, max = 44): string {
  const text = stripHtmlToText(raw || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '（問題文なし）';

  // 最初の文末記号までを1文とみなす。記号自体は残す（「。」で終わると自然）。
  const match = text.match(/^[\s\S]*?[。．.!?！？]/u);
  let sentence = (match ? match[0] : text).trim();

  // 1文が極端に短い（「次の問いに答えよ。」の前置きだけ等）場合は
  // 情報量が足りないので、元テキストの先頭から取り直す。
  if (sentence.length < 12 && text.length > sentence.length) {
    sentence = text;
  }

  if (sentence.length > max) return sentence.slice(0, max).trimEnd() + '…';
  return sentence;
}

/**
 * カード3行目のバッジ。要件どおり最大2つに絞る。
 *
 * ReviewItem は「難易度」を保持していない（問題データ側の属性で、
 * 復習リストには写していない）。そこで代わりに、復習の判断に直接
 * 効く2つだけを出す:
 *   1) 苦手度 … 何回間違えたか。2回以上で「苦手」として強調する
 *   2) 定着度 … box から求めた定着率。次にやるべきかの目安になる
 * それ以外（正答・自分の解答・復習正解回数・予定日）は
 * カードを開いたときの詳細に回す。
 */
export interface ReviewBadge {
  /** バッジの種類（テストとスタイル分岐で使う） */
  kind: 'weak' | 'retention' | 'mastered';
  label: string;
}

