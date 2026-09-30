/**
 * 「解答と解説を見る」を押した瞬間の採点処理
 * ────────────────────────────────────────────────────────────────
 * Quiz.tsx の L964〜L1100（137行）をそのまま持ってきたもの。
 * 中身は一字も変えていない。
 *
 * ★ここにフックは1つも無い★
 * 元のコードも useState / useEffect / useMemo を一切含まない
 * ただの関数だったので、切り出してもフックの呼び出し順は変わらない。
 * （実測：この区間のフック呼び出しは0件）
 *
 * ★なぜ「関数を作る関数」の形にしたか★
 * 中の処理が currentQuestion / run / answers など14個の値を
 * 参照している。引数14個の関数にすると呼び出し側が読みにくく、
 * 渡し忘れ・順番違いの事故も起きる。そこで依存をまとめて受け取り、
 * 元と同じ名前のクロージャを返す形にした。こうすると移してきた
 * 137行を書き換えずに済む。
 *
 * ★変えてはいけない設計（元のコメントもそのまま残してある）★
 * ・1問ずつモード（リスニング）の記録は perQuestion に入れない。
 *   perQuestion のキーは「大問ID」前提で進捗計算が数えているので、
 *   小問単位のキーを混ぜると進捗が分母を超える。
 * ・学習台帳（solved_problems_v1_*）のキーは `章ID::大問ID` のまま。
 *   小問単位に変えると過去の学習記録が全部「未着手」に戻る。
 */
import { auth } from '../firebase';
import {
  scoreProblem,
  calcMaxCombo,
  comboMultiplier,
  type ScoreBreakdown,
} from './scoring';
import { captureWrongAnswers, type WrongAnswerInput } from './reviewList';
import { markProblemSolved } from './progress';
import { recordUnitResult } from './unitStats';
import { schedulePush } from './studySync';
import { isAnswerCorrect, isDescriptive } from './answerJudge';
import { stepScoreKey } from './listeningSteps';
import { saveRun, type ChapterRunState } from './quizRunState';

export interface QuizScoringDeps {
  /** いま表示している大問 */
  currentQuestion: any;
  /** リスニングの「1画面＝1問」モードか */
  perStep: boolean;
  /** 1問ずつモードで、いま表示している小問（先頭） */
  activeStepSub: any;
  /**
   * 1問ずつモードで、いま表示しているステップの小問全部。
   * 第4問以降は「音声1本に複数の解答欄」なのでこちらを採点する。
   * 省略時は activeStepSub 1つとみなす（第1〜3問は从来と同じ）。
   */
  activeStepSubs?: any[];
  /** 章の途中経過（点数・コンボ・所要時間） */
  run: ChapterRunState;
  setRun: (next: ChapterRunState) => void;
  /** 二重採点を防ぐためのガード（採点済みキーを覚えておく） */
  lastScoredQuestionRef: { current: string | null };
  /** タイマーから250msごとに通知される最新の経過秒 */
  timeUsedRef: { current: number };
  answers: Record<string, string>;
  questionTimeLimit: number;
  chapter: { id: string; title: string; [k: string]: any };
  mode: string;
  isGuest?: boolean;
  currentQuestionIndex: number;
  onScored?: (
    breakdown: ScoreBreakdown,
    meta: { timeLimit: number; timeUsed: number; questionId: string },
  ) => void;
}

export interface QuizScoringResult {
  breakdown: ScoreBreakdown;
  nextRun: ChapterRunState;
  addedScore: number;
}

/**
 * 採点関数を作って返す。
 * Quiz.tsx では
 *   const scoreCurrentQuestionIfNeeded = createScoreCurrentQuestion({ ... });
 * と書いており、以降の呼び出し方は切り出す前とまったく同じ。
 */
export function createScoreCurrentQuestion({
  currentQuestion,
  perStep,
  activeStepSub,
  activeStepSubs,
  run,
  setRun,
  lastScoredQuestionRef,
  timeUsedRef,
  answers,
  questionTimeLimit,
  chapter,
  mode,
  isGuest,
  currentQuestionIndex,
  onScored,
}: QuizScoringDeps): () => QuizScoringResult | null {
  const scoreCurrentQuestionIfNeeded = () => {
    if (!currentQuestion) return null;

    // ────────────────────────────────────────────────────────────────
    // 採点の単位（ご要望「問1で1つの進捗、問2で1つの進捗」）
    // ────────────────────────────────────────────────────────────────
    //
    // ・1問ずつモード（リスニング）… いま表示している1問だけを採点する。
    //     「解答と解説を見る」を押すたびにその問の点が出るので、
    //     4問まとめて採点されて何が合っていたのか分からない状態を解消する。
    // ・従来モード（化学など）      … 大問の全小問をまとめて採点する。
    //
    // 二重採点のガードも単位に合わせる。大問IDだけで見ていると、
    // 1問ずつモードでは問1を採点した時点で問2〜問4が
    // 「もう採点済み」と判定されて0点のまま飛ばされてしまう。
    const scoringKey = perStep && activeStepSub
      ? stepScoreKey(currentQuestion.id, activeStepSub.id)
      : currentQuestion.id;

    if (perStep) {
      if (run.perStep?.[scoringKey]) return null;
    } else if (run.perQuestion[scoringKey]) {
      return null;
    }
    if (lastScoredQuestionRef.current === scoringKey) return null;
    lastScoredQuestionRef.current = scoringKey;

    // 採点対象の小問。1問ずつモードでは表示中の1問だけ。
    const subQuestions = perStep && activeStepSub
      ? (activeStepSubs && activeStepSubs.length > 0 ? activeStepSubs : [activeStepSub])
      : (currentQuestion.subQuestions || []);
    const timeUsed = Math.max(0, Math.round(timeUsedRef.current));
    const maxCombo = calcMaxCombo(subQuestions, answers);
    const breakdown = scoreProblem(subQuestions, answers, {
      timeLimit: questionTimeLimit,
      timeUsed,
      maxCombo,
      runningCombo: run.runningCombo,
    });

    // 章コンボ倍率を適用
    const multiplier = comboMultiplier(run.runningCombo);
    const boostedScore = Math.floor(breakdown.finalScore * multiplier);
    const finalBreakdown: ScoreBreakdown = { ...breakdown, finalScore: boostedScore };

    // 章全体の状態を更新
    const isAllCorrect =
      breakdown.judgeableCount > 0 && breakdown.correctCount === breakdown.judgeableCount;
    const nextRunningCombo = isAllCorrect ? run.runningCombo + 1 : 0;

    // 採点済みの記録先。
    //
    // ★1問ずつモードの記録は perQuestion に入れない★
    //   perQuestion のキーは「大問ID」であることを前提に、
    //   進捗の引き継ぎ処理（progress.ts の backfillLegacyProgress）が
    //   キーをそのまま大問IDとして数えている。ここに小問単位のキーを混ぜると
    //   存在しない大問を「解いた」と数えて進捗が分母を超えてしまう。
    //   そのため小問単位は perStep という別の入れ物に分ける。
    const scoreRecord = { ...finalBreakdown, timeLimit: questionTimeLimit, timeUsed };
    const nextRun: ChapterRunState = {
      ...run,
      totalScore: run.totalScore + boostedScore,
      runningCombo: nextRunningCombo,
      totalCorrect: run.totalCorrect + breakdown.correctCount,
      totalJudgeable: run.totalJudgeable + breakdown.judgeableCount,
      totalTimeSec: run.totalTimeSec + timeUsed,
      perQuestion: perStep
        ? run.perQuestion
        : { ...run.perQuestion, [scoringKey]: scoreRecord },
      perStep: perStep
        ? { ...(run.perStep || {}), [scoringKey]: scoreRecord }
        : run.perStep,
    };
    setRun(nextRun);
    saveRun(chapter.id, mode, nextRun);

    // ===== 学習進捗の記録（1点でも取れた大問は「解いた」として永続化） =====
    // run state（quiz_run_*）は章を解き終えた時点で削除され、
    // quiz_answers_* も章に入り直すと消えるため、
    // 「採点したこの瞬間」に別台帳（solved_problems_v1_*）へ追記しておく。
    // こうしないと、やり切った章ほど進捗から消えるという逆転が起きる。
    //
    // ★1問ずつモードでも記録の単位は「大問（回）」のまま★
    //   画面の進み方を問単位にしても、台帳のキーは `章ID::大問ID` を変えない。
    //   ここを小問単位に変えると、ホームの分母（章あたり14問・15問）と
    //   分子の単位が食い違い、これまでの学習記録も全部「未着手」に戻ってしまう。
    //   ご要望は「解き方・見え方」の話なので、記録の互換性は保つ。
    try {
      const uid = auth.currentUser?.uid || (isGuest ? 'guest' : null);
      markProblemSolved(uid, chapter.id, currentQuestion.id, boostedScore);
      // 単元カードの「正解率」用（採点できた小問だけを数える）
      recordUnitResult(uid, chapter.id, breakdown.correctCount, breakdown.judgeableCount);
      // とびら君の成長（XP・マナコイン・ミッション）。同じ大問は1日1回。学習の保存とは独立で、失敗しても学習を止めない。
      if (uid && Number.isFinite(boostedScore) && boostedScore >= 1) {
        const key = `${chapter.id}::${currentQuestion.id}`;
        void import('../battle/data/growthStore').then(({ recordStudyGrowth }) => recordStudyGrowth(uid, key)).catch(() => {});
      } else if (uid) {
        // 0点だった → 演習の「れんぞく正解」ミッションの連続を切る
        void import('../battle/data/growthStore').then(({ breakStudyStreak }) => breakStudyStreak()).catch(() => {});
      }

      // localStorage への記録が済んだので、クラウドへの送信を予約する。
      // 1問ごとに通信すると1授業で数千書き込みになるため、
      // studySync 側でまとめて（デバウンスして）送る。
      // 通信できなくても localStorage には残っているので学習は続く。
      schedulePush();
    } catch (e) {
      // 進捗記録の失敗で学習そのものを止めない
      console.error('[Quiz] markProblemSolved failed:', e);
    }

    // 復習リスト：この問題で間違えた設問（自動採点可能なもの）をキャプチャする。
    // 記述式（descriptive）は自動採点不可なため対象外。
    try {
      const uid = auth.currentUser?.uid || (isGuest ? 'guest' : null);
      if (uid) {
        const questionIndex = currentQuestionIndex + 1;
        const wrongInputs: WrongAnswerInput[] = subQuestions
          .filter((sq: any) => !isDescriptive(sq))
          .filter((sq: any) => !isAnswerCorrect(sq, answers[sq.id]))
          .map((sq: any) => ({
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            questionIndex,
            questionId: currentQuestion.id,
            subQuestionId: sq.id,
            subLabel: sq.label,
            questionText: currentQuestion.text,
            correctAnswer: sq.correctAnswer,
            wrongAnswer: (answers[sq.id] || '').trim(),
          }));
        if (wrongInputs.length > 0) captureWrongAnswers(uid, wrongInputs);
      }
    } catch (e) {
      console.error('[Quiz] captureWrongAnswers failed:', e);
    }

    if (onScored) {
      onScored(finalBreakdown, {
        timeLimit: questionTimeLimit,
        timeUsed,
        questionId: currentQuestion.id,
      });
    }

    return { breakdown: finalBreakdown, nextRun, addedScore: boostedScore };
  };
  return scoreCurrentQuestionIfNeeded;
}
