/**
 * ===================================================================
 * 演習画面の「移動」の操作（C-02: Quiz.tsx から分離）
 * ===================================================================
 *   ・入力欄のフォーカス移動（前へ／次へ）・スマホの解答欄ページ送り・Enter キー
 *   ・次へ／前へ（採点 → 解説 → 次の問 → 次の回 → 結果）と、章が終わったときの送信
 *
 * ★ここにフックは1つも無い★（tests/quizHookOrder.test.ts が見張っている）
 *   元のコードも useState / useEffect を一切含まない「毎回の描画で作り直される関数」だった。
 *   切り出しても Quiz のフックの数・順番は変わらない。
 *
 * ★「関数を作る関数」の形にした理由（utils/quizScoring.ts と同じ作法）★
 *   中の処理が Quiz の値・setter を 30 個近く参照している。依存をまとめて受け取り、
 *   元と同じ名前のクロージャを返すので、移した本体は1行も書き換えていない。
 */
import type React from 'react';
import { auth } from '../firebase';
import { submitChapterScore } from './leaderboard';
import { clearRun, loadRun, type ChapterRunState } from './quizRunState';
import { isShortAnswerType } from './quizBlanks';
import { buildListeningSteps, isPerSubQuestionListening } from './listeningSteps';
import { stageKey } from './stageRecords';
import { recordStagePlayAndSync } from './stagePlay';
import type { ScoreBreakdown } from './scoring';
import type { Chapter, Problem, SubQuestion } from '../types/curriculum';

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;
type Scored = { breakdown: ScoreBreakdown; addedScore: number } | null | undefined;

/** フォーカス移動・スマホのページ送りに要る値 */
export type QuizFocusDeps = {
  inputNavSubs: SubQuestion[];
  mobileAnswerSubs: { sq: SubQuestion }[];
  focusedSubId: string | null;
  focusedIndex: number;
  safeMobileAnsIdx: number;
  pendingFocusIdRef: React.MutableRefObject<string | null>;
  setFocusedSubId: SetState<string | null>;
  setMobileAnsIdx: SetState<number>;
};

export function createQuizFocusActions({
  inputNavSubs, mobileAnswerSubs, focusedSubId, focusedIndex, safeMobileAnsIdx,
  pendingFocusIdRef, setFocusedSubId, setMobileAnsIdx,
}: QuizFocusDeps) {
  /**
   * フローティング入力バーの 前へ/次へ で、フォーカスする設問を移動する。
   * dir=-1 で前、dir=1 で次。移動後は該当入力欄へ実フォーカスも移す。
   * 対象は入力欄を持つ全設問（短答穴埋め・記述/計算）。
   */
  const moveFocus = (dir: -1 | 1) => {
    if (inputNavSubs.length === 0) return;
    let idx = focusedIndex;
    if (idx < 0) idx = 0;
    else idx = Math.min(inputNavSubs.length - 1, Math.max(0, idx + dir));
    const target = inputNavSubs[idx];
    if (!target) return;
    if (target.id === focusedSubId) return;
    // iOS でソフトキーボードを閉じさせないために、ここでは blur せず
    // 「次にフォーカスすべき設問」を記録して state を更新するだけにする。
    // 実際の .focus() は再レンダー直後の useLayoutEffect（描画前・同期）で行う。
    // これにより「次へ」押下時にフォーカス（入力状態）が一瞬解除される不具合を防ぐ。
    pendingFocusIdRef.current = target.id;
    setFocusedSubId(target.id);
    // スマホは「1ページ＝1解答欄」の固定表示なので、フォーカス移動先の
    // 入力欄が実際に描画されるよう、ページ（mobileAnsIdx）も同じ設問に合わせる。
    // （ページを合わせないと、フォーカス先の input が未マウントで移動できない）
    const pageIdx = mobileAnswerSubs.findIndex((m) => m.sq.id === target.id);
    if (pageIdx >= 0) setMobileAnsIdx(pageIdx);
  };

  /**
   * スマホの解答欄ページ送り（解答欄の左右に置いた黒の小さな矢印）。
   * dir=-1 で前の設問、dir=1 で次の設問へ。
   * ご要望：「(1)の入力欄を下半分に最初固定した状態にして、右と左の矢印で
   *          固定する解答欄を変える。解答欄のスクロールがすごいうざい」
   * テキスト入力中（キーボード表示中）に矢印で移動した場合は、
   * 移動先がテキスト設問ならフォーカスを引き継いでキーボードを維持する。
   */
  const goMobileAns = (dir: -1 | 1) => {
    if (mobileAnswerSubs.length === 0) return;
    const next = Math.min(mobileAnswerSubs.length - 1, Math.max(0, safeMobileAnsIdx + dir));
    if (next === safeMobileAnsIdx) return;
    setMobileAnsIdx(next);
    const target = mobileAnswerSubs[next]?.sq;
    const targetIsText = target && (isShortAnswerType(target) || target.type === 'descriptive');
    if (focusedSubId && targetIsText) {
      // キーボードを閉じさせないため blur せず、次フォーカス先を予約して
      // 再レンダー直後の useLayoutEffect で実 .focus() する（moveFocus と同じ方式）。
      pendingFocusIdRef.current = target.id;
      setFocusedSubId(target.id);
    } else if (focusedSubId) {
      // 移動先が選択式など入力欄なしの設問なら、入力状態は終了する。
      setFocusedSubId(null);
    }
  };

  /** この設問がテキスト入力ナビ（前へ/次へ）の最後か。Enter キーのヒントに使う。 */
  const isLastNavSub = (sq: SubQuestion) => {
    const idx = inputNavSubs.findIndex((s) => s.id === sq.id);
    return idx < 0 || idx >= inputNavSubs.length - 1;
  };

  /**
   * スマホのカード内入力欄の Enter キー処理。
   * ・短答（input）    : Enter＝次の空欄へ移動。最後の空欄なら入力を確定して閉じる。
   * ・記述（textarea） : Enter＝通常の改行。最後の設問でも改行を優先する
   *                      （長い答案の途中で誤って閉じない）。
   * 入力欄はカード内の1か所だけなので、ここで移動すれば
   * 「解答欄が2つ出る」ことはない（ご指摘対応）。
   */
  const handleMobileCardKeyDown = (sq: SubQuestion) => (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key !== 'Enter') return;
    if (sq.type === 'descriptive') return; // 記述は改行を許可
    e.preventDefault();
    const idx = inputNavSubs.findIndex((s) => s.id === sq.id);
    if (idx >= 0 && idx < inputNavSubs.length - 1) {
      moveFocus(1);
    } else {
      (e.currentTarget as HTMLElement).blur();
      setFocusedSubId(null);
    }
  };

  return { moveFocus, goMobileAns, isLastNavSub, handleMobileCardKeyDown };
}

/** 次へ／前へに要る値 */
export type QuizStepDeps = {
  chapter: Chapter;
  mode: string;
  isGuest: boolean;
  questions: Problem[];
  answers: Record<string, string>;
  questionRange?: { startIndex: number; endIndex: number } | null;
  rangeStart: number;
  rangeEnd: number;
  currentQuestionIndex: number;
  perStep: boolean;
  isLastStep: boolean;
  isLastQuestion: boolean;
  safeStepIndex: number;
  showingExplanation: boolean;
  scoreCurrentQuestionIfNeeded: () => Scored;
  setScoreAnimationData: (d: { breakdown: ScoreBreakdown; totalScore: number }) => void;
  setShowScoreAnimation: (v: boolean) => void;
  setShowingExplanation: (v: boolean) => void;
  setStepIndex: (i: number) => void;
  setCurrentQuestionIndex: SetState<number>;
  onExplanationChange?: (showing: boolean) => void;
  onFinish: (answers: Record<string, string>, result: ChapterRunState) => void;
};

export function createQuizStepActions({
  chapter, mode, isGuest, questions, answers, questionRange, rangeStart, rangeEnd,
  currentQuestionIndex, perStep, isLastStep, isLastQuestion, safeStepIndex, showingExplanation,
  scoreCurrentQuestionIfNeeded, setScoreAnimationData, setShowScoreAnimation, setShowingExplanation,
  setStepIndex, setCurrentQuestionIndex, onExplanationChange, onFinish,
}: QuizStepDeps) {

  /**
   * 章のラン全体が終わった時に Firestore へ章ベストを送る
   */
  const finalizeChapterRun = async (latestRun: ChapterRunState) => {
    if (isGuest) return; // ゲストは同期しない
    try {
      const correctRate =
        latestRun.totalJudgeable > 0 ? latestRun.totalCorrect / latestRun.totalJudgeable : 0;
      await submitChapterScore({
        chapterId: chapter.id,
        score: latestRun.totalScore,
        correctRate,
        totalCorrect: latestRun.totalCorrect,
        totalQuestions: latestRun.totalJudgeable,
        timeUsedSec: latestRun.totalTimeSec,
      });
    } catch (e) {
      console.error('[Quiz] submitChapterScore failed:', e);
    }
  };

  const handleNext = () => {
    if (!showingExplanation) {
      // 解答提出 → 採点して解説へ
      const scored = scoreCurrentQuestionIfNeeded();
      
      // スコアアニメーションのデータを取得
      if (scored) {
        const scoreData = scored.breakdown;
        setScoreAnimationData({
          breakdown: scoreData,
          totalScore: scored.addedScore,
        });
        setShowScoreAnimation(true);
        // アニメーション終了後に自動的に非表示に
        setTimeout(() => setShowScoreAnimation(false), 3500);
      }
      
      setShowingExplanation(true);
      if (onExplanationChange) onExplanationChange(true);
    } else {
      // ★1問ずつモード：まず同じ回の次の問へ進む★
      // 問1の解説 →「次へ」→ 問2 → … と進み、その回の4問を終えてから
      // 次の回（または結果画面）へ移る。
      if (perStep && !isLastStep) {
        setStepIndex(safeStepIndex + 1);
        setShowingExplanation(false);
        if (onExplanationChange) onExplanationChange(false);
      } else if (!isLastQuestion) {
        setCurrentQuestionIndex(prev => prev + 1);
        // 次の回は必ず問1から始める。
        setStepIndex(0);
        setShowingExplanation(false);
        if (onExplanationChange) onExplanationChange(false);
      } else {
        // 章全体が完了 → ランキング送信
        // run state は React 更新が非同期なので、ここでは保存済みの最新を取り直す
        const latest = loadRun(chapter.id, mode);
        // ステージの挑戦記録（満点3回で達成・利用履歴）。回だけを選んだときはその回、それ以外は単元。
        try {
          const single = questionRange && rangeStart === rangeEnd ? questions[rangeStart] : null;
          const unitTitle = String(chapter.abstractTitle || chapter.title || chapter.id);
          recordStagePlayAndSync(auth.currentUser?.uid || 'guest', stageKey(chapter.id, single?.id),
            single ? `${unitTitle} ${single.title || `第${rangeStart + 1}回`}` : unitTitle,
            latest.totalCorrect, latest.totalJudgeable);
        } catch { /* 記録の失敗で学習を止めない */ }
        finalizeChapterRun(latest);
        // 新たな挑戦のためにラン状態リセット
        clearRun(chapter.id, mode);
        onFinish(answers, latest);
        if (onExplanationChange) onExplanationChange(false);
      }
    }
  };

  const handlePrevious = () => {
    if (showingExplanation) {
      setShowingExplanation(false);
      if (onExplanationChange) onExplanationChange(false);
    } else if (perStep && safeStepIndex > 0) {
      // ★1問ずつモード：同じ回の1つ前の問（の解説）へ戻る★
      // 問3を解いている途中で「問2の答えをもう一度見たい」という戻り方を
      // 回をまたがずにできるようにする。
      setStepIndex(safeStepIndex - 1);
      setShowingExplanation(true);
      if (onExplanationChange) onExplanationChange(true);
    } else if (currentQuestionIndex > rangeStart) {
      // 「前へ」で今回の範囲より前（別の回）へは戻さない。
      // 選んだ回だけを解いているのに前の回が出てくると、
      // どの回を解いているのか分からなくなるため。
      setCurrentQuestionIndex(prev => prev - 1);
      // 前の回に戻るときは、その回の最後の問から見えるようにする。
      const prevQuestion = questions[currentQuestionIndex - 1];
      const prevSteps = isPerSubQuestionListening(prevQuestion)
        ? buildListeningSteps(prevQuestion)
        : [];
      setStepIndex(prevSteps.length > 0 ? prevSteps.length - 1 : 0);
      setShowingExplanation(true);
      if (onExplanationChange) onExplanationChange(true);
    }
  };

  return { finalizeChapterRun, handleNext, handlePrevious };
}
