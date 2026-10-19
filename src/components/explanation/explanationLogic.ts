import { isAnswerCorrect } from '../../utils/answerJudge';
import { listeningQuestionNumberOf } from '../../utils/listeningExplanation';
import { sliceListeningQuestionBlock } from '../../utils/listeningOptions';
import { textTracksOf } from './helpers';
import type { Problem, SubQuestion } from '../../types/curriculum';

/** 小問ID → 入力した解答 */
type Answers = Record<string, string | undefined>;

/** 結果画面のページ送り1件 */
export interface ResultPage {
  qIndex: number;
  sq: SubQuestion;
}

/**
 * 解答・解説画面の「画面に依存しない計算」。
 * useMemo / useCallback と依存配列は呼び出し側（Explanation.tsx）に置いている。
 *
 * 2026-10-14：統合版（化学・数学）由来の「記述問題の自己採点」「係数のグループ完答」
 * 「化学ロジックツリーの節探し」を外した。リスニング版の収録データ（選択式 1717 問）は
 * どれも使っていなかったので、計算結果は変わらない。
 */

/** 大問1つの正答率（%） */
export function computeQuestionScore(question: Problem, answers: Answers) {
  const subs: SubQuestion[] = question.subQuestions || [];
  if (subs.length === 0) return 0;
  const correct = subs.filter((sq) => isAnswerCorrect(sq, answers[sq.id])).length;
  return Math.round((correct / subs.length) * 100);
}

/** 復習推奨エリア（カテゴリごとの正答率・100%未満を低い順） */
export function computeWeakAreas(baseQuestions: Problem[], answers: Answers) {
  const analysis: Record<string, { total: number; correct: number }> = {};

  baseQuestions.forEach((q) => {
    const category = q.category || 'その他';
    if (!analysis[category]) {
      analysis[category] = { total: 0, correct: 0 };
    }
    q.subQuestions.forEach((sq) => {
      analysis[category].total += 1;
      if (isAnswerCorrect(sq, answers[sq.id])) {
        analysis[category].correct += 1;
      }
    });
  });

  return Object.entries(analysis)
    .map(([category, stats]) => ({
      category,
      percentage: Math.round((stats.correct / stats.total) * 100)
    }))
    .filter(item => item.percentage < 100)
    .sort((a, b) => a.percentage - b.percentage);
}

/** 結果画面のページ送りの一覧（小問1つ＝1ページ。音源1本に複数の小問がある場合はその先頭だけ） */
export function buildResultPages(baseQuestions: Problem[], singleQuestionIndex: number | undefined): ResultPage[] {
  if (singleQuestionIndex !== undefined) return [];
  const out: ResultPage[] = [];
  baseQuestions.forEach((q, qIndex: number) => {
    const covered = new Set<string>();
    const tracks = textTracksOf(q);
    (q?.subQuestions || []).forEach((sq) => {
      const id = String(sq?.id);
      if (covered.has(id)) return;
      const t = tracks.find((tr) => Array.isArray(tr?.subIds) && tr.subIds.map(String).includes(id));
      if (t) t.subIds?.forEach((x) => covered.add(String(x)));
      out.push({ qIndex, sq });
    });
  });
  return out;
}

/** focusSubQuestionId があるとき、大問を「いま解いた問（と同じ音源の問）」だけに絞る */
export function scopeQuestionsToFocus(picked: Problem[], focusSubQuestionId: string | null): Problem[] {
  if (!focusSubQuestionId) return picked;
  return picked.map((q): Problem => {
    const subs: SubQuestion[] = Array.isArray(q?.subQuestions) ? q.subQuestions : [];
    const hasAudio = Array.isArray(q?.audioTracks) && q.audioTracks.length > 0;
    const tracks = textTracksOf(q);
    // ★第4問以降：音源1本に複数の小問（問18〜21 など）★
    //   その音源（subIds）に属する小問は全部まとめて解いたので、解説も全部出す。
    //   第1〜3問は subIds が無いので従来どおり1問だけ。
    const focusedTracks = tracks.filter(
      (t) =>
        t?.subId === focusSubQuestionId ||
        (Array.isArray(t?.subIds) && t.subIds.includes(focusSubQuestionId)),
    );
    const focusIds = new Set<string>([focusSubQuestionId]);
    focusedTracks.forEach((t) => {
      if (Array.isArray(t?.subIds)) t.subIds.forEach((id) => focusIds.add(String(id)));
    });
    const hit = subs.filter((sq) => focusIds.has(String(sq?.id)));
    if (hit.length === 0) return q;
    // ★問題文も「いま見ている問のブロックだけ」に絞る（ご指摘：
    //   「左側も問題をなぜ問4まで乗せるの？問ごとに切ってるんだから
    //     解答と解説の方も対応させないと」）。
    //   問N の区切りを持たないデータでは全文のまま（安全側）。
    const focusNo = listeningQuestionNumberOf(hit[0]);
    const scopedText = focusNo !== null
      ? sliceListeningQuestionBlock(String(q?.text || ''), focusNo)
      : q?.text;
    return {
      ...q,
      text: scopedText,
      subQuestions: hit,
      // 音源も「その問のトラックだけ」にする。復習で問1〜問4の
      // スクリプトが全部開けると、未着手の問の答えが読めてしまう。
      ...(hasAudio
        ? { audioTracks: focusedTracks.length > 0 ? focusedTracks : tracks }
        : { explanationTracks: focusedTracks.length > 0 ? focusedTracks : tracks }),
    };
  });
}
