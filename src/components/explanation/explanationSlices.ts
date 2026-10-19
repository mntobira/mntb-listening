import {
  sliceEnhancedByQuestion,
  sliceEnhancedBySubQuestion,
  questionGroupKey,
} from '../../utils/explanationFormat';
import {
  listeningQuestionNumberOf,
  scopeListeningCommonToQuestion,
} from '../../utils/listeningExplanation';
import type { Problem, SubQuestion } from '../../types/curriculum';

/**
 * 大問の解説本文を「小問ごとの本文」と「大問全体の共通部分」に切り分ける（画面に依存しない純粋な計算）。
 * 2026-10-13 のリファクタリングで Explanation.tsx の右カラム内（大問ごとのループの中）から移した。
 * 計算の中身・順番・戻り値は元のまま。
 *
 * ─────────────────────────────────────────────
 * 各小問は、常時表示する採点結果の直下に
 *   1. 解説
 *   2. 思考手順・答えの核心
 * の独立したアコーディオンを並べる。
 *
 * 解説本文は既存の機械可読マーカーで切り分けるだけで、
 * 教材本文の表現や順番は変更しない。小問固有の本文は各「解説」へ、
 * common/shared は大問末尾へ1回だけ配置し、重複と情報欠落を防ぐ。
 */
export function buildExplanationSlices(question: Problem, focusSubQuestionId: string | null | undefined) {
                        const enhancedText: string =
                          question.explanationSupplement || question.explanation || '';
                        const questionSlices = sliceEnhancedByQuestion(enhancedText);
                        // 小問（(ア)/(1)/a …）単位の切り出し。
                        // 教材データのラベルは「問N」形式が少数派で、これが無いと
                        // 全174大問のうち9割でアコーディオンを開いても解説が出てこなかった。
                        const subSlices = sliceEnhancedBySubQuestion(enhancedText);
                        const sliceForSq = (sq: SubQuestion): string => {
                          // 小問マーカーがある教材では、その小問自身の本文だけを返す。
                          // common/shared は下で1回だけ表示し、各小問へ重複させない。
                          if (subSlices) {
                            const key = String(sq?.id ?? '');
                            return subSlices.subs
                              .filter((item) => item.id === key)
                              .map((item) => item.body)
                              .join('\n');
                          }

                          // 旧形式の「問N」マーカーにも対応する。
                          if (questionSlices) {
                            const key = questionGroupKey(sq?.label);
                            if (!key) return '';
                            return questionSlices.groups
                              .filter((group) => group.key === key)
                              .map((group) => group.text)
                              .join('\n');
                          }

                          // マーカーを持たない従来教材は、本文を削らずそのまま解説へ入れる。
                          return enhancedText;
                        };

                        const sharedExplanationRaw = subSlices
                          ? [subSlices.common, subSlices.shared].filter((part) => part.trim()).join('\n')
                          : questionSlices?.common || '';
                        // ★問ごと表示（focusSubQuestionId）のときは、共通解説の
                        //   「解 答」一覧から他の問の答えを除く（ネタバレ防止）。
                        //   ご指摘：「問1の問題なのになぜ右側の共通ポイントの
                        //   ところに問4までの答えがあるのか」
                        const sharedExplanation = focusSubQuestionId
                          ? scopeListeningCommonToQuestion(
                              sharedExplanationRaw,
                              listeningQuestionNumberOf((question.subQuestions || [])[0]),
                            )
                          : sharedExplanationRaw;

  return { sliceForSq, sharedExplanation };
}
