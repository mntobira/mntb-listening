/**
 * 演習で「今回解く範囲」を決める（C-02: Quiz.tsx から分離。計算は分離前と同じ）。
 *
 * ■ 設計の要点：問題の配列は章の全問のまま据え置く
 *   currentQuestionIndex は「章の中の通し番号」であり、
 *     ・localStorage の quiz_idx_*
 *     ・解説画面へ渡す singleQuestionIndex
 *     ・図版の通し番号（図1・図2…）
 *   がすべてこの番号を前提にしている。配列そのものを切り出すと番号の意味がズレて、
 *   「解説に別の問題が出る」「図番号が飛ぶ」といった不具合になる。
 *   そこで配列は切らず、「どこからどこまでを1回とみなすか」だけを持つ。
 *
 * ■ 値の丸め方
 *   データ追加・削除で範囲が配列の外を指しても落ちないよう、必ず 0〜(最終問) に収める。
 *   範囲指定が無ければ章の全問が範囲。
 */
export type QuizRangeView = {
  /** 範囲の先頭（章内の通し番号） */
  rangeStart: number;
  /** 範囲の最後（両端を含む） */
  rangeEnd: number;
  /** 範囲内の問題数（進捗ピルの分母） */
  rangeCount: number;
  /** 範囲内での現在位置（1始まり・進捗ピルの分子） */
  rangePosition: number;
};

export function resolveQuizRange(
  questionCount: number,
  questionRange: { startIndex: number; endIndex: number } | null | undefined,
  currentQuestionIndex: number,
): QuizRangeView {
  const lastIndex = Math.max(0, questionCount - 1);
  const rangeStart = questionRange
    ? Math.min(Math.max(0, questionRange.startIndex), lastIndex)
    : 0;
  const rangeEnd = questionRange
    ? Math.min(Math.max(rangeStart, questionRange.endIndex), lastIndex)
    : lastIndex;
  const rangeCount = rangeEnd - rangeStart + 1;
  const rangePosition = Math.min(
    rangeCount,
    Math.max(1, currentQuestionIndex - rangeStart + 1),
  );
  return { rangeStart, rangeEnd, rangeCount, rangePosition };
}
