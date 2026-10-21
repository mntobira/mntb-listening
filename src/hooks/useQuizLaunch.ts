/**
 * ===================================================================
 * 演習の始め方（C-01: App.tsx から分離）
 * ===================================================================
 *   単元を選ぶ・対戦のリザルトから演習へ・解き終わって解説へ・間違えた問題だけ解き直す・
 *   復習ノートから解き直す、の5つの入口。どれも「どの章のどこから、どのモードで」を決めて
 *   画面を演習へ移すだけで、App.tsx にあったときと中身は1行も変えていない。
 *
 *   ・reviewBusy / reviewRequest … 問題データを読み込んでいる間に別のボタンが押されたり、
 *     画面が変わったりしたら、古い読み込みの結果は捨てる（後勝ち）。画面が変わるたびに番号を進める。
 */
import { useEffect, useRef } from 'react';
import { auth } from '../firebase';
import type { AppMode, AppState } from '../appState';
import type { SubjectId } from '../data/subjectLabels';
import { isSubjectEnabled } from '../config/features';
import { setReviewFocus, type ReviewTargetItem } from '../utils/reviewFocus';
import { resolveReviewTarget, reviewLaunchOf, type ReviewRequest } from '../utils/reviewTarget';
import type { ChapterRunState } from '../utils/quizRunState';
import { readJsonArray, safeRemoveItem } from '../utils/safeLocalStorage';
import { safeSetItem } from '../utils/storageGuard';
import { notify } from '../utils/dialog';
import { completedKey } from '../utils/userStorageKeys';
import { quizAnswersKey, quizRunKey, quizExplKey, quizIndexKey, quizStepKey } from '../utils/quizStorageKeys';
import { resolveBattlePractice } from '../utils/battlePracticeBridge';
import type { QuizRange } from './useAppPersistence';

export type QuizLaunchDeps = {
  appState: AppState;
  appMode: AppMode;
  isGuest: boolean;
  selectedChapterId: string | null;
  setAppState: (s: AppState) => void;
  setAppMode: (m: AppMode) => void;
  setSelectedChapterId: (id: string | null) => void;
  setQuizRange: (r: QuizRange | null) => void;
  setQuizAnswers: (a: Record<string, string>) => void;
  setSelectedSubject: (s: SubjectId) => void;
  setLastQuizResult: (r: ChapterRunState | null) => void;
  setBattleReturnActive: (v: boolean) => void;
  rememberBattleScroll: () => void;
};

export function useQuizLaunch({
  appState, appMode, isGuest, selectedChapterId,
  setAppState, setAppMode, setSelectedChapterId, setQuizRange, setQuizAnswers,
  setSelectedSubject, setLastQuizResult, setBattleReturnActive, rememberBattleScroll,
}: QuizLaunchDeps) {
  const reviewRequest = useRef(0);
  const reviewBusy = useRef(false);
  useEffect(() => { reviewRequest.current += 1; reviewBusy.current = false; }, [appState]);

  const handleSelectChapter = (
    chapterId: string,
    questionIndex = 0,
    resume = false,
    /**
     * 「この範囲だけを1回として解く」ときの範囲（両端を含む）。
     * 英語リスニングの「第N回演習」ボタンから渡す。
     * 省略時は範囲なし＝章の全問を通しで解く（化学基礎・化学は従来のまま）。
     */
    range: { startIndex: number; endIndex: number } | null = null,
    targetMode: AppMode = appMode,
  ) => {
    // 通常の演習を始めるときは、復習ノートの「間違えた小問だけ」の絞り込みを外す（復習ノートからは後で付け直す）
    setReviewFocus(null);
    setSelectedChapterId(chapterId);
    setQuizRange(range);
    setAppState('quiz');
    setLastQuizResult(null);

    if (!resume) {
      setQuizAnswers({});
      safeRemoveItem(quizAnswersKey(chapterId, targetMode));
      safeRemoveItem(quizRunKey(chapterId, targetMode));
      safeRemoveItem(quizExplKey(chapterId, targetMode));
      safeRemoveItem(quizStepKey(chapterId, targetMode));
      safeSetItem(quizIndexKey(chapterId, targetMode), questionIndex.toString());
    }
  };

  /**
   * ★対戦のリザルトから、その単元の演習へ移る（請求⑦-A）★
   *
   * -------------------------------------------------------------------
   * ■ これが「① 対戦 ⇒ ② 演習」の橋である
   * -------------------------------------------------------------------
   * 対戦は「表側＝楽しい」を担い、演習は「裏側＝つまずきを直す」を担う。
   * 負けた直後・間違えた直後がいちばん学ぶ気になっている瞬間なので、
   * リザルト画面からワンタップでその単元の演習に入れるようにする。
   *
   * -------------------------------------------------------------------
   * ■ ★教科も一緒に切り替える理由★
   * -------------------------------------------------------------------
   * 対戦の教科は、アプリで選んでいる教科（selectedSubject）と違うことがある
   * （化学基礎を選んだまま、対戦だけ生物基礎で遊ぶ、など）。
   * 章IDだけ渡して演習に飛ばすと、教科が食い違って
   * ★単元選択に戻ったときに別教科の一覧が出る★ という迷子になる。
   * 章と教科は必ずセットで切り替える。
   *
   * -------------------------------------------------------------------
   * ■ 演習モード（practice）に固定する理由
   * -------------------------------------------------------------------
   * 対戦で出しているのは演習問題（practiceProblems）を割ったものなので、
   * 対応する問題があるのは演習モードである。
   * ミニテストに飛ばすと「対戦で間違えた問題が出てこない」ことになる。
   * 既存の復習ノートからの遷移（handleReviewNote）と同じ扱いにしている。
   */
  const handlePracticeFromBattle = async (subject: string, chapterId: string, problemId?: string, subQuestionId?: string) => {
    if (reviewBusy.current) return;
    reviewBusy.current = true;
    const request = ++reviewRequest.current;
    try {
      // 章・問題の位置を決めるのは utils/battlePracticeBridge.ts（文言・探し方は分離前と同じ）
      const target = await resolveBattlePractice(subject, chapterId, problemId, subQuestionId);
      if (request !== reviewRequest.current) return;
      rememberBattleScroll();
      setBattleReturnActive(true);
      setSelectedSubject(target.subject);
      setAppMode(target.mode);
      handleSelectChapter(target.chapterId, target.index, false, target.range, target.mode);
    } catch (error) {
      if (request === reviewRequest.current) notify(error instanceof Error ? error.message : '演習を読み込めませんでした。もう一度お試しください。');
    } finally {
      if (request === reviewRequest.current) reviewBusy.current = false;
    }
  };

  const handleFinishQuiz = (answers: Record<string, string>, result?: ChapterRunState) => {
    setQuizAnswers(answers);
    setLastQuizResult(result || null);
    setAppState('explanation');
    
    // Track chapter completion if not guest
    if (!isGuest && auth.currentUser && selectedChapterId) {
      const uid = auth.currentUser.uid;
      const key = completedKey(uid);
      try {
        const completed = readJsonArray<string>(key);
        if (!completed.includes(selectedChapterId)) {
          completed.push(selectedChapterId);
          safeSetItem(key, JSON.stringify(completed));
        }
      } catch (e) {
        console.error('Failed to save completion:', e);
      }
    }
  };

  const handleBackToChapters = () => {
    setAppState('chapters');
    setSelectedChapterId(null);
  };

  /**
   * 「間違えた問題だけ解き直す」を始める。
   * 演習画面には、間違いを含む大問（それぞれ間違えた小問だけ）の並びが渡るので、
   * 位置は先頭・範囲指定なしで開始する（範囲は絞り込み前の通し番号なので使えない）。
   */
  const startFocusedRetry = (chapterId: string, targets: ReviewTargetItem[], targetMode: AppMode) => {
    if (targets.length === 0) return;
    handleSelectChapter(chapterId, 0, false, null, targetMode);
    setReviewFocus({ chapterId, targets });
  };

  /**
   * 学習ノートの問題項目から、対応する演習問題へ遷移する（要件5）。
   * ノートに保存された chapterId / questionId を優先して問題位置を特定し、
   * 見つからなければ questionIndex（1始まり表示番号）でフォールバックする。
   */
  const handleReviewNote = async (note: ReviewRequest | null | undefined) => {
    if (!note || reviewBusy.current) return;
    reviewBusy.current = true;
    const request = ++reviewRequest.current;
    try {
      // 問題本体は押されたときだけ読む。全科目を起動時には読み込まない。
      const { SUBJECTS, getPartsOfSubject } = await import('../data/allChapters');
      if (request !== reviewRequest.current) return;
      const target = resolveReviewTarget(note, SUBJECTS
        .filter(entry => isSubjectEnabled(entry.id))
        .map(entry => ({ id: entry.id, parts: getPartsOfSubject(entry.id) })));
      if (!target) {
        notify(note.subQuestionId && !note.chapterId && !note.questionId
          ? 'この確認問題は現在の教材に見つかりませんでした。問題が差し替えられた可能性があります。'
          : '対応する問題を見つけられませんでした。教材が更新された可能性があります。ノートはそのまま残しています。');
        return;
      }
      setSelectedSubject(target.subject);
      setAppMode('practice');
      // どう解き直すか（大問まるごと／間違えた小問だけ／その問題から）は utils/reviewTarget.ts の reviewLaunchOf が決める
      const launch = reviewLaunchOf(note, target);
      if (launch.kind === 'whole') {
        setReviewFocus(null);
        handleSelectChapter(launch.chapterId, launch.questionIndex, false, { startIndex: launch.questionIndex, endIndex: launch.questionIndex }, 'practice');
      } else if (launch.kind === 'focused') {
        startFocusedRetry(launch.chapterId, launch.targets, 'practice');
      } else {
        handleSelectChapter(launch.chapterId, launch.questionIndex, false, null, 'practice');
      }
    } catch {
      if (request === reviewRequest.current) {
        notify('問題データの読み込みに失敗しました。通信状況を確認して、もう一度お試しください。');
      }
    } finally {
      if (request === reviewRequest.current) reviewBusy.current = false;
    }
  };

  return { handleSelectChapter, handlePracticeFromBattle, handleFinishQuiz, handleBackToChapters, startFocusedRetry, handleReviewNote };
}
