/**
 * ===================================================================
 * 対戦のリザルト → その単元の演習 への橋（C-01: App.tsx の handlePracticeFromBattle から分離）
 * ===================================================================
 *
 * ■ これが「① 対戦 ⇒ ② 演習」の橋
 *   負けた直後・間違えた直後がいちばん学ぶ気になっている瞬間なので、
 *   リザルト画面からワンタップでその単元の演習に入れるようにする。
 *
 * ■ ここがやること（画面遷移はしない純粋な非同期関数）
 *   科目・章・問題・小問の ID から「どのモードの何問目を開くか」を決めるだけ。
 *   画面を移す（setAppState など）のは App.tsx の仕事として残している。
 *
 * ■ 決まり（分離前と同じ）
 *   ・英単語・英熟語（外部科目）は対戦専用。演習画面が無いので止める
 *   ・まず演習問題（practiceProblems）から探し、無ければミニテストから探す
 *   ・問題 ID を渡されたのに見つからない、小問が見つからない → 教材が更新された可能性として止める
 *   ・問題データ（data/allChapters）は押されたときだけ読む（起動時に全科目を読まない）
 *   エラーの文言は利用者にそのまま出すので、分離前と1文字も変えていない。
 */
import { isExternalSubject } from '../data/externalSubjects';
import { isSubjectId, type SubjectId } from '../data/subjectLabels';

export type BattlePracticeTarget = {
  subject: SubjectId;
  chapterId: string;
  mode: 'practice' | 'mini_test';
  /** 開く問題の位置（そのモードの問題列の中の通し番号） */
  index: number;
  /** 1問だけを解く範囲（問題 ID を渡されたとき）。渡されなければ null＝章の全問 */
  range: { startIndex: number; endIndex: number } | null;
};

export async function resolveBattlePractice(
  subject: string,
  chapterId: string,
  problemId?: string,
  subQuestionId?: string,
): Promise<BattlePracticeTarget> {
  if (isExternalSubject(subject)) {
    // 英単語・英熟語は対戦専用（本体に演習画面が無い）。
    // リザルトは onPractice を渡されても vocab では出さない（BattleResult 側で判定）が、
    // 履歴など別経路から来たときのためにここでも止める。
    throw new Error('この科目は対戦専用です。答えはリザルトの解答欄で確認できます。');
  }
  const { getPartsOfSubject, miniTestProblemsOf } = await import('../data/allChapters');
  if (!isSubjectId(subject)) throw new Error('対応する科目が見つかりません。');
  const parts = getPartsOfSubject(subject);
  const part = parts.find((p) => p.chapters.some((c) => c.id === chapterId));
  const chapter = part?.chapters.find((c) => c.id === chapterId);
  if (!chapter) throw new Error('対応する単元が見つかりません。');
  let mode: 'practice' | 'mini_test' = 'practice';
  let problems = chapter.practiceProblems || [];
  let index = problemId ? problems.findIndex((p) => p.id === problemId) : 0;
  if (problemId && index < 0) {
    mode = 'mini_test';
    problems = miniTestProblemsOf(chapter);
    index = problems.findIndex((p) => p.id === problemId);
  }
  if (!problems[index] || (subQuestionId && !problems[index].subQuestions?.some((q) => q.id === subQuestionId))) {
    throw new Error('対応する問題が見つかりません。教材が更新された可能性があります。');
  }
  return { subject, chapterId, mode, index, range: problemId ? { startIndex: index, endIndex: index } : null };
}
