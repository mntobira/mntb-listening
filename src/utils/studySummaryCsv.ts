/**
 * 先生向けの CSV 出力（エスケープ・BOM・CRLF・列の並び）（C-20）。
 * studySummary.ts から移した。中身は1文字も変えていない。studySummary.ts からも再エクスポートしている。
 */
import type { StudentSummary } from './studySummaryTypes';

// ===================================================================
// CSV 出力
// ===================================================================

/**
 * CSV のセルを安全にエスケープする。
 *
 * ⚠️ セキュリティ上の注意（CSV インジェクション）
 * Excel は先頭が = + - @ のセルを数式として解釈するため、
 * 生徒の入力（ニックネーム等）がそのまま入ると意図しない実行につながる。
 * 先頭に ' を付けて無効化する。学校へ配る成果物なので、ここは必須。
 */
export function escapeCsvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  const neutralized = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  if (/[",\r\n]/.test(neutralized)) {
    return `"${neutralized.replace(/"/g, '""')}"`;
  }
  return neutralized;
}

/**
 * ★重複していたので1つにまとめた組み立て★
 *
 * CSV の「外側の骨組み」は3か所（buildStudentCsv / buildChapterCsv /
 * kantenReport.ts の buildKantenCsv）にまったく同じ形で書かれていた。
 *   1. 見出し行を escapeCsvCell に通して , で連結
 *   2. 各行も同じように連結
 *   3. 行区切りは CRLF、最後にも改行を1つ付ける
 *   4. withBom なら先頭に BOM を付ける
 *
 * これは見た目の重複ではなく、**間違えると実害が出る部分**なので
 * 1か所にまとめる必要があった。
 *   - BOM を落とすと Excel で日本語が文字化けする（現場で最も多い躓き）
 *   - escapeCsvCell を通し忘れると CSV インジェクションが通る
 *     （先頭が = + - @ のセルを Excel が数式として実行してしまう）
 *   - 改行が LF だと古い Excel で1行に潰れる
 * 3か所に散らしたままだと、片方だけ直して片方が穴のまま、という
 * いちばん危ない状態になりうる。学校へ配る成果物なのでここは統一する。
 *
 * ※ 中身（どの列を出すか）は3つでまったく違うため、
 *   まとめたのは骨組みだけである。列の並びは各関数に残している。
 */
export function buildCsvText(
  headers: readonly unknown[],
  rows: readonly unknown[][],
  withBom = true,
): string {
  const lines: string[] = [];
  lines.push(headers.map(escapeCsvCell).join(','));
  rows.forEach((row) => {
    lines.push(row.map(escapeCsvCell).join(','));
  });
  const body = `${lines.join('\r\n')}\r\n`;
  return withBom ? `\uFEFF${body}` : body;
}

export const STUDENT_CSV_HEADERS = [
  '生徒名',
  '解いた大問数',
  '直近14日の学習日数',
  '最終学習日',
  '復習リスト件数',
  '未処理の復習',
  '定着した問題数',
  '間違えた回数',
  '解き直した回数',
  '立て直し率',
  '取り組み度',
  '内訳:継続',
  '内訳:立て直し',
  '内訳:未処理',
] as const;

/**
 * 先生がそのまま Excel で開ける CSV を作る。
 *
 * BOM を付けるのは、Excel が UTF-8 を自動判別せず
 * 日本語が文字化けするため（現場で最も多い躓きどころ）。
 */
export function buildStudentCsv(rows: StudentSummary[], withBom = true): string {
  // 骨組み（見出し・CRLF・BOM・エスケープ）は buildCsvText に任せ、
  // ここは「どの列をどの順で出すか」だけを持つ。
  return buildCsvText(
    STUDENT_CSV_HEADERS,
    rows.map((row) => [
      row.displayName,
      row.solvedTotal,
      row.activeDaysIn14,
      row.lastStudiedAt ?? '未学習',
      row.review.total,
      row.review.overdue,
      row.review.mastered,
      row.review.wrongCount,
      row.review.retryCount,
      `${Math.round(row.review.recoveryRate * 100)}%`,
      row.engagement.score,
      row.engagement.breakdown.continuity,
      row.engagement.breakdown.recovery,
      row.engagement.breakdown.upkeep,
    ]),
    withBom,
  );
}

export const CHAPTER_CSV_HEADERS = ['単元', '大問数', 'クラス平均到達率(%)', '未処理の復習(合計)'] as const;
