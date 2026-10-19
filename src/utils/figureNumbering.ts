/**
 * figureNumbering
 * ------------------------------------------------------------------
 * 章（chapter）内の問題群に含まれる図版へ、安定した通し番号（図1・図2 …）を
 * 割り当てるためのユーティリティ。
 *
 * 番号は「章の問題配列を先頭から走査し、imageUrl を持つ問題に出現順で採番する」
 * という単純な規則で決める。これにより、演習画面（Quiz）でも結果・解説画面
 * （Explanation）でも同じ問題には常に同じ図番号が表示される。
 */

interface QuestionLike {
  id?: string;
  imageUrl?: string;
}

/**
 * 問題配列から「問題ID → 図番号」のマップを作る。
 * imageUrl を持たない問題は含まれない。
 */
export function buildFigureNumberMap(questions: QuestionLike[]): Record<string, number> {
  const map: Record<string, number> = {};
  if (!Array.isArray(questions)) return map;
  let n = 0;
  for (const q of questions) {
    if (q && q.imageUrl && q.id) {
      n += 1;
      map[q.id] = n;
    }
  }
  return map;
}

/**
 * 指定した問題の図番号を取得する。無ければ undefined。
 */
export function getFigureNumber(
  figureMap: Record<string, number>,
  questionId?: string
): number | undefined {
  if (!questionId) return undefined;
  return figureMap[questionId];
}
