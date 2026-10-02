/**
 * 解答解説の画面（Quiz の早期 return ブロック）
 * ────────────────────────────────────────────────────────────────
 * Quiz.tsx の `if (showingExplanation) { ... }` の中身（50行）を
 * そのまま持ってきたもの。JSX は一字も変えていない。
 *
 * ★ここにフックは1つも無い★
 * 元も useState / useEffect を含まない、ただの JSX だった
 * （実測：この区間のフック呼び出しは0件）。よって切り出しても
 * フックの呼び出し順には影響しない。
 *
 */
import { Explanation } from './Explanation';
import { FloatingScoreAnimation } from './FloatingScoreAnimation';
import { CorrectBurst } from './fx/CorrectBurst';
import { stepScoreKey } from '../utils/listeningSteps';
import type { ChapterRunState } from '../utils/quizRunState';
import type { ScoreBreakdown } from '../utils/scoring';

export interface ExplanationScreenProps {
  /** ★実測で判明した型★ Explanation 側が 'mini_test' | 'practice' の
   *  リテラル型で受け取るので、ここを string にすると型が通らない。 */
  mode: 'mini_test' | 'practice';
  chapter: any;
  answers: Record<string, string>;
  isGuest?: boolean;
  currentQuestion: any;
  currentQuestionIndex: number;
  /** リスニングの「1画面＝1問」モードか */
  perStep: boolean;
  /** 1問ずつモードで、いま表示している小問 */
  activeStepSub: any;
  run: ChapterRunState;
  isLastQuestion: boolean;
  isMobileForExplanation?: boolean;
  handleNext: () => void;
  onReturnToBattle?: () => void;
  /** 解説画面を閉じる（Quiz.tsx 側で setShowingExplanation(false) と
   *  onExplanationChange(false) の両方を行う） */
  onBackFromExplanation: () => void;
  scoreAnimationData: { breakdown: ScoreBreakdown; totalScore: number } | null;
  showScoreAnimation: boolean;
}

export function ExplanationScreen({
  mode,
  chapter,
  answers,
  isGuest,
  currentQuestion,
  currentQuestionIndex,
  perStep,
  activeStepSub,
  run,
  isLastQuestion,
  isMobileForExplanation,
  handleNext,
  onReturnToBattle,
  onBackFromExplanation,
  scoreAnimationData,
  showScoreAnimation,
}: ExplanationScreenProps) {
  // Quiz.tsx にあったときの呼び名をそのまま残す（下の JSX を書き換えないため）。
  const setShowingExplanation = (_v: boolean) => onBackFromExplanation();
  const onExplanationChange: ((v: boolean) => void) | undefined = undefined;
  /*
    解説に渡すスコア。
    ─────────────────────────────────────────────
    1問ずつモード（リスニング）では、採点も「問ごと」に
    run.perStep へ記録している（run.perQuestion は大問単位の台帳のまま）。
    解説画面のスコア表示もその問の記録を出さないと、
    「問2を解いたのに問1の点数が出る」ことになる。
  */
  const stored = perStep && activeStepSub
    ? run.perStep?.[stepScoreKey(currentQuestion.id, activeStepSub.id)]
    : run.perQuestion[currentQuestion?.id];
  return (
    <>
      <Explanation
        onReturnToBattle={onReturnToBattle} 
        mode={mode} 
        chapter={chapter} 
        answers={answers} 
        onBack={() => { setShowingExplanation(false); if (onExplanationChange) onExplanationChange(false); }} 
        isGuest={isGuest}
        singleQuestionIndex={currentQuestionIndex}
        onNextQuestion={handleNext}
        isLastQuestion={isLastQuestion}
        isMobileView={isMobileForExplanation}
        /* ご要望「だから解説も修正な」：1問ずつ解いたのだから、
           解説もその問だけに絞る（問2以降の正解が先に見えないようにする）。 */
        focusSubQuestionId={perStep && activeStepSub ? activeStepSub.id : null}
        scoreBreakdown={stored || null}
        scoreMeta={stored ? { timeLimit: stored.timeLimit, timeUsed: stored.timeUsed } : null}
        totalScore={run.totalScore}
        runningCombo={run.runningCombo}
      />
      {/* ★正解したら全画面の演出（2026-10-01）★ 解説の表示は隠さない（触れない・1.2秒で抜ける） */}
      {scoreAnimationData && showScoreAnimation && scoreAnimationData.breakdown.basePoints > 0 && (
        <CorrectBurst burstKey={`${currentQuestion?.id}:${activeStepSub?.id ?? ''}:${run.totalScore}`} combo={run.runningCombo ?? 0} />
      )}
      {scoreAnimationData && (
        <FloatingScoreAnimation
          breakdown={scoreAnimationData.breakdown}
          totalScore={scoreAnimationData.totalScore}
          isVisible={showScoreAnimation}
        />
      )}
    </>
  );
}
