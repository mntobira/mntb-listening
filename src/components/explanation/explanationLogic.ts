import type { NodeData } from '../InteractiveTree';
/*
 * 図データは図データのファイル（chemistryTreeData）から直接読む（元の Explanation.tsx と同じ読み方）。
 */
import { substanceTreeData, separationTreeData, thermalMotionTreeData, atomicStructureTreeData, ionTreeData, ionGenerationTreeData, ionSizeTreeData, chemicalBondTreeData } from '../../data/chemistryTreeData';
import { isAnswerCorrect } from '../../utils/answerJudge';
import { gradingCriteriaProgress } from '../../utils/gradingCriteria';
import { listeningQuestionNumberOf } from '../../utils/listeningExplanation';
import { sliceListeningQuestionBlock } from '../../utils/listeningOptions';
import { textTracksOf } from './helpers';

/**
 * 解答・解説画面の「画面に依存しない計算」。
 * 2026-10-14 のリファクタリングで Explanation.tsx から切り出した。本体は元のコードのまま
 * （インデントだけ1段浅くした）。useMemo / useCallback と依存配列は呼び出し側に残しているので、
 * 再計算されるタイミング・フックの順番は変わらない。
 */

/** 大問1つの正答率（%）。グループ化された小問はまとめて1問と数える。 */
export function computeQuestionScore(question: any, answers: Record<string, any>, selfGrades: Record<string, boolean>) {
  let totalScore = 0;
  
  // Group subquestions to see how many effective tasks there are
  const groups: Record<string, { sqs: any[], allCorrect: boolean }> = {};
  let singleQuestionsCount = 0;

  (question.subQuestions || []).forEach((sq: any) => {
    const isCorrect = sq.type === 'descriptive'
      ? false // grading criteria handles descriptive
      : isAnswerCorrect(sq, answers[sq.id]);

    if (sq.group) {
      if (!groups[sq.group]) {
        groups[sq.group] = { sqs: [], allCorrect: true };
      }
      groups[sq.group].sqs.push(sq);
      if (!isCorrect) {
        groups[sq.group].allCorrect = false;
      }
    } else {
      singleQuestionsCount++;
      if (sq.type === 'descriptive') {
        totalScore += gradingCriteriaProgress(sq, selfGrades).ratio;
      } else {
        if (isCorrect) {
          totalScore += 1;
        }
      }
    }
  });

  const groupCounts = Object.keys(groups).length;
  const maxScore = singleQuestionsCount + groupCounts;

  Object.values(groups).forEach(g => {
    if (g.allCorrect) {
      totalScore += 1;
    }
  });

  if (maxScore === 0) return 0;
  return Math.round((totalScore / maxScore) * 100);
}

/** 復習推奨エリア（カテゴリごとの正答率・100%未満を低い順） */
export function computeWeakAreas(baseQuestions: any[], answers: Record<string, any>, selfGrades: Record<string, boolean>) {
  const analysis: Record<string, { total: number; correct: number }> = {};

  baseQuestions.forEach((q: any) => {
    const category = q.category || 'その他';
    if (!analysis[category]) {
      analysis[category] = { total: 0, correct: 0 };
    }

    q.subQuestions.forEach((sq: any) => {
      analysis[category].total += 1;

      if (sq.type === 'descriptive') {
         // 記述問題は自己採点チェックの達成率をそのまま得点扱いにする。
         // （基準が string / 未設定のデータでも安全に 0〜1 の比率が返る）
         analysis[category].correct += gradingCriteriaProgress(sq, selfGrades).ratio;
      } else {
        if (isAnswerCorrect(sq, answers[sq.id])) {
          analysis[category].correct += 1;
        }
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

/** 小問に対応するロジックツリーの節（無ければ logic_thought の Step）。chapterId は元の chapter?.id */
export function findRelatedSteps(sqId: string, currentQuestion: any, chapter: any) {
  const steps: { step: number | string | null, label: string, id: string }[] = [];
  
  // Always check logic trees first as they are the primary logic structures
  const findInTree = (node: NodeData) => {
    if (node.relatedQuestions?.some(q => q.id === sqId)) {
      steps.push({ step: node.step, label: node.label, id: node.id });
    }
    if (node.children) {
      node.children.forEach(findInTree);
    }
  };
  
  if (chapter?.id === 'c1_2_A' && separationTreeData) findInTree(separationTreeData);
  else if (chapter?.id === 'c1_3' && thermalMotionTreeData) findInTree(thermalMotionTreeData);
  else if (chapter?.id === 'c2_1' && atomicStructureTreeData) findInTree(atomicStructureTreeData);
  else if (chapter?.id === 'c2_2' && ionTreeData) findInTree(ionTreeData);
  else if (chapter?.id === 'c2_3' && ionGenerationTreeData) findInTree(ionGenerationTreeData);
  else if (chapter?.id === 'c2_4' && ionSizeTreeData) findInTree(ionSizeTreeData);
  else if (chapter?.id === 'c3_1' && chemicalBondTreeData) findInTree(chemicalBondTreeData);
  else if (substanceTreeData) findInTree(substanceTreeData);
  
  if (steps.length > 0) return steps;

  // Fallback to logic_thought JSON in the current question's explanation
  if (!currentQuestion.explanation) return [];
  try {
    const parsed = JSON.parse(currentQuestion.explanation);
    if (parsed.type === 'logic_thought' && parsed.phase2 && parsed.phase2.explanations) {
      return parsed.phase2.explanations
        .filter((ex: any) => ex.subQuestionIds.includes(sqId))
        .map((ex: any) => {
          const stepMatch = ex.step.match(/Step (\d+)/);
          return {
            step: stepMatch ? stepMatch[1] : ex.step,
            label: ex.tag,
            id: ex.step
          };
        });
    }
  } catch (e) {
    // Not JSON
  }
  return [];
}

/** 結果画面のページ送りの一覧（小問1つ＝1ページ。音源1本に複数の小問がある場合はその先頭だけ） */
export function buildResultPages(baseQuestions: any[], singleQuestionIndex: number | undefined) {
  if (singleQuestionIndex !== undefined) return [] as { qIndex: number; sq: any }[];
  const out: { qIndex: number; sq: any }[] = [];
  baseQuestions.forEach((q: any, qIndex: number) => {
    const covered = new Set<string>();
    const tracks: any[] = textTracksOf(q);
    (q?.subQuestions || []).forEach((sq: any) => {
      const id = String(sq?.id);
      if (covered.has(id)) return;
      const t = tracks.find((tr: any) => Array.isArray(tr?.subIds) && tr.subIds.map(String).includes(id));
      if (t) t.subIds.forEach((x: any) => covered.add(String(x)));
      out.push({ qIndex, sq });
    });
  });
  return out;
}

/** focusSubQuestionId があるとき、大問を「いま解いた問（と同じ音源の問）」だけに絞る */
export function scopeQuestionsToFocus(picked: any[], focusSubQuestionId: string | null) {
  if (!focusSubQuestionId) return picked;
  return picked.map((q: any) => {
    const subs: any[] = Array.isArray(q?.subQuestions) ? q.subQuestions : [];
    const hasAudio = Array.isArray(q?.audioTracks) && q.audioTracks.length > 0;
    const tracks: any[] = textTracksOf(q);
    // ★第4問以降：音源1本に複数の小問（問18〜21 など）★
    //   その音源（subIds）に属する小問は全部まとめて解いたので、解説も全部出す。
    //   第1〜3問は subIds が無いので従来どおり1問だけ。
    const focusedTracks = tracks.filter(
      (t: any) =>
        t?.subId === focusSubQuestionId ||
        (Array.isArray(t?.subIds) && t.subIds.includes(focusSubQuestionId)),
    );
    const focusIds = new Set<string>([focusSubQuestionId]);
    focusedTracks.forEach((t: any) => {
      if (Array.isArray(t?.subIds)) t.subIds.forEach((id: string) => focusIds.add(String(id)));
    });
    const hit = subs.filter((sq: any) => focusIds.has(String(sq?.id)));
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
