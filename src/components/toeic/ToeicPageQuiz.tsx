/**
 * TOEIC Part 5 の演習画面：1ページに複数問・マーク式（2026-10-28）
 *
 * 紙の問題集に近い並び（問題番号・英文・(A)〜(D) を2×2）で、各選択肢の頭のマーク（丸）を塗って答える。
 * 採点はページ単位（「このページを採点する」）。最後のページを採点したら既存の結果画面へ進む。
 *
 * 既存の仕組みをそのまま使う（新しい保存形式は作らない）
 *   ・選んだ答え      … quizAnswersKey（Quiz と同じ保存先）。離脱しても消さない＝再開で復元する
 *   ・ページ位置      … quizStepKey（ページ先頭の問の番号を入れる）
 *   ・採点記録・XP    … createScoreCurrentQuestion（リスニング第4問以降の「1つの採点に複数の小問」と同じ使い方）
 *                       キーは「大問ID::ページ先頭の小問ID」。採点済みのページはここから分かる
 *   ・結果画面へ      … createQuizStepActions の終了処理（ステージ記録・章ベスト送信・onFinish）
 * 共通の ProblemPane / AnswerPane / MultipleChoiceControl / QuizHeader は使わない（リスニング・英文法に影響させない）。
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMountEffect } from '../../hooks/useMountEffect';
import { ArrowLeft, Bookmark, BookmarkCheck, Check, CheckCircle2, ChevronLeft, ChevronRight, FileText, ListChecks, MinusCircle, Settings, XCircle } from 'lucide-react';
import type { Chapter, Problem, SubQuestion } from '../../types/curriculum';
import type { ScoreBreakdown } from '../../utils/scoring';
import { ToeicTimer } from './ToeicTimer';
import { StemWithBlank, ToeicExplanationPanel } from './ToeicExplanationPanel';
import { isToeicNoteSaved, saveToeicNote } from './toeicNote';
import { auth } from '../../firebase';
import { notify } from '../../utils/dialog';
import { FloatingScoreAnimation } from '../FloatingScoreAnimation';
import { createScoreCurrentQuestion } from '../../utils/quizScoring';
import { createQuizStepActions } from '../../utils/quizNavigationActions';
import { loadRun, type ChapterRunState } from '../../utils/quizRunState';
import { resolveQuizRange } from '../../utils/quizRange';
import { quizAnswersKey, quizIndexKey, quizStepKey } from '../../utils/quizStorageKeys';
import { parseStoredNonNegativeInteger, parseStoredStringRecord } from '../../utils/progress';
import { safeGetItem, safeRemoveItem } from '../../utils/safeLocalStorage';
import { safeSetItem } from '../../utils/storageGuard';
import { isAnswerCorrect } from '../../utils/answerJudge';
import { formatText } from '../../utils/textFormatter';
import {
  buildToeicPageBudgets, formatToeicBudgetDelta, formatToeicBudgetTime,
  TOEIC_TIME_PRESETS, type ToeicTimePresetId,
} from './toeicTimeBudget';
import {
  QUESTIONS_PER_PAGE, countUnanswered, pageFromStoredStep, pageScoreKey, prefersSingleColumn, splitPages, toeicExplanationFor,
} from './toeicPageModel';
import './toeic-page.css';

export interface ToeicPageQuizProps {
  mode: 'mini_test' | 'practice';
  chapter: Chapter;
  onFinish: (answers: Record<string, string>, result?: ChapterRunState) => void;
  onBack: () => void;
  onReturnToBattle?: () => void;
  isGuest: boolean;
  onExplanationChange?: (isExplanation: boolean) => void;
  onScored?: (breakdown: ScoreBreakdown, meta: { timeLimit: number; timeUsed: number; questionId: string }) => void;
  questionRange?: { startIndex: number; endIndex: number } | null;
}

/** キー → 選択肢の位置（A〜D と 1〜4） */
const MARK_KEYS: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, '1': 0, '2': 1, '3': 2, '4': 3 };
const markLetter = (mark: string) => mark.replace(/[()]/g, '');
const noop = () => undefined;
const TIME_GUIDE_STORAGE_KEY = 'toeic_part5_time_guide_v1';

function readTimeGuideSettings(): { enabled: boolean; preset: ToeicTimePresetId } {
  try {
    const value = JSON.parse(safeGetItem(TIME_GUIDE_STORAGE_KEY) || 'null') as { enabled?: unknown; preset?: unknown } | null;
    return {
      enabled: typeof value?.enabled === 'boolean' ? value.enabled : true,
      preset: value?.preset === 'slow' || value?.preset === 'advanced' ? value.preset : 'standard',
    };
  } catch {
    return { enabled: true, preset: 'standard' };
  }
}

function budgetPositionStyle(seconds: number, totalSec: number): React.CSSProperties {
  return { left: `${Math.min(100, seconds / totalSec * 100)}%` };
}

/** 問の英文（空所 ______ のまま）。元データから引けないときは問題文の「問N　…」の行から取る */
function stemOf(problem: Problem, sq: SubQuestion): string {
  const ex = toeicExplanationFor(sq);
  if (ex) return ex.sentence;
  const label = String(sq.label || '');
  const line = String(problem.text || '').split('\n').find((l) => l.startsWith(`${label}　`));
  return line ? line.slice(label.length + 1) : '';
}

/** 問題番号（1〜30）。復習ノートの解き直しで間違えた問だけに絞られても、元の番号（問N）を出す */
function questionNumber(sq: SubQuestion, fallback: number): number {
  const m = String(sq.label || '').match(/(\d+)/);
  return m ? Number(m[1]) : fallback;
}

export function ToeicPageQuiz({
  mode, chapter, onFinish, onBack, onReturnToBattle, isGuest, onExplanationChange, onScored, questionRange,
}: ToeicPageQuizProps) {
  const questions: Problem[] = mode === 'mini_test' ? (chapter.miniTest || []) : (chapter.practiceProblems || []);
  const [run, setRun] = useState<ChapterRunState>(() => loadRun(chapter.id, mode));
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    parseStoredStringRecord(safeGetItem(quizAnswersKey(chapter.id, mode))));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() =>
    parseStoredNonNegativeInteger(safeGetItem(quizIndexKey(chapter.id, mode)), Math.max(0, questions.length - 1)));
  const { rangeStart, rangeEnd } = resolveQuizRange(questions.length, questionRange, currentQuestionIndex);
  const currentQuestion = questions[currentQuestionIndex];
  const subs: SubQuestion[] = useMemo(() => currentQuestion?.subQuestions || [], [currentQuestion]);
  const pages = useMemo(() => splitPages(subs, QUESTIONS_PER_PAGE), [subs]);
  const [pageIndex, setPageIndex] = useState(() => pageFromStoredStep(
    parseStoredNonNegativeInteger(safeGetItem(quizStepKey(chapter.id, mode))),
    Math.ceil(Math.max(1, subs.length) / QUESTIONS_PER_PAGE),
  ));
  const safePage = Math.min(Math.max(0, pageIndex), Math.max(0, pages.length - 1));
  const page = useMemo(() => pages[safePage] || [], [pages, safePage]);
  const [timeGuide, setTimeGuide] = useState(readTimeGuideSettings);
  const pageBudgets = useMemo(() => buildToeicPageBudgets(
    pages.map((items) => items.map((sq) => ({ skill: sq.skill || toeicExplanationFor(sq)?.skill }))),
    timeGuide.preset,
    Number(currentQuestion?.timeLimitSec) > 0 ? Math.round(Number(currentQuestion?.timeLimitSec)) : 600,
  ), [pages, timeGuide.preset, currentQuestion?.timeLimitSec]);
  const pageBudget = pageBudgets[safePage] || buildToeicPageBudgets([page], timeGuide.preset)[0];
  const isScored = (i: number) => !!(currentQuestion && pages[i] && run.perStep?.[pageScoreKey(currentQuestion, pages[i])]);
  const pageScored = isScored(safePage);
  const allScored = pages.length > 0 && pages.every((_, i) => isScored(i));
  const isLastPage = safePage >= pages.length - 1;
  const hasNextRound = currentQuestionIndex < rangeEnd;
  const pageScoreRecord = currentQuestion && page.length > 0
    ? run.perStep?.[pageScoreKey(currentQuestion, page)]
    : undefined;
  const answeredCount = subs.filter((sq) => !!answers[sq.id]).length;
  const unanswered = countUnanswered(page, answers);
  const pageCorrect = page.filter((sq) => isAnswerCorrect(sq, answers[sq.id] || '')).length;
  // 結果の帯の「分野別」：このページの問題を分野ごとに数える（並びはページに出てきた順）
  const pageSkills = (() => {
    const map = new Map<string, { c: number; n: number }>();
    for (const sq of page) {
      const k = String(sq.skill || 'その他');
      const row = map.get(k) || { c: 0, n: 0 };
      row.n += 1;
      if (isAnswerCorrect(sq, answers[sq.id] || '')) row.c += 1;
      map.set(k, row);
    }
    return [...map.entries()];
  })();

  // 保存（Quiz と同じキー）
  useEffect(() => { safeSetItem(quizAnswersKey(chapter.id, mode), JSON.stringify(answers)); }, [answers, chapter.id, mode]);
  useEffect(() => { safeSetItem(quizStepKey(chapter.id, mode), String(safePage * QUESTIONS_PER_PAGE)); }, [safePage, chapter.id, mode]);
  useEffect(() => { safeSetItem(quizIndexKey(chapter.id, mode), String(currentQuestionIndex)); }, [currentQuestionIndex, chapter.id, mode]);
  useEffect(() => { safeSetItem(TIME_GUIDE_STORAGE_KEY, JSON.stringify(timeGuide)); }, [timeGuide]);
  // App 側の「解説表示中」は使わない（この画面の中で解説を開く）。開いた時に1回だけ伝える
  //   親の関数は描画ごとに作り直されるので、マウント時の1回だけでよい（useMountEffect＝useEffect(fn, []) と同じ動き・R-23）
  useMountEffect(() => { onExplanationChange?.(false); });

  // 時間：上には回の通し（現行の10分）を出す。ページの採点には「前の採点からの経過」を渡す
  const elapsedRef = useRef(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const pageStartRef = useRef(0);
  const timeUsedRef = useRef(0);
  const lastScoredQuestionRef = useRef<string | null>(null);
  const roundLimit = Number(currentQuestion?.timeLimitSec) > 0 ? Math.round(Number(currentQuestion?.timeLimitSec)) : 600;
  const pageLimit = Math.max(30, Math.round(roundLimit * (page.length / Math.max(1, subs.length))));
  const guidePageLimitSec = pageBudgets.length > 0 ? roundLimit / pageBudgets.length : roundLimit;
  const [pageFeedback, setPageFeedback] = useState('');
  const pageFeedbackRef = useRef<Record<number, string>>({});
  useEffect(() => {
    if (!pageFeedback) return undefined;
    const timer = window.setTimeout(() => setPageFeedback(''), 3600);
    return () => window.clearTimeout(timer);
  }, [pageFeedback]);

  const feedbackForPage = (index: number, elapsed: number): string => {
    const budget = pageBudgets[index];
    if (!budget) return '';
    const used = Math.max(0, Math.round(elapsed));
    if (used > guidePageLimitSec) return '少し遅れ';
    if (used < budget.targetSec) return `予定より ${formatToeicBudgetDelta(budget.targetSec - used)} 早い`;
    if (used === budget.targetSec) return '予定どおり';
    return '余白を使用中';
  };

  // 点数の演出（従来の1問ごとの演出を、ページを採点するたびに1回出す）
  const [scoreFx, setScoreFx] = useState<{ breakdown: ScoreBreakdown; totalScore: number } | null>(null);
  const [showFx, setShowFx] = useState(false);
  useEffect(() => {
    if (!showFx) return undefined;
    const t = window.setTimeout(() => setShowFx(false), 3500);
    return () => window.clearTimeout(t);
  }, [showFx]);

  // 「未回答」の印は、採点ボタンを押したあとだけ出す（開いた直後に全問へ警告が並ばないように）
  const [attempted, setAttempted] = useState<Record<number, boolean>>({});
  const listRef = useRef<HTMLDivElement | null>(null);
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollTop = () => listRef.current?.scrollTo({ top: 0 });

  // 解説の開閉：誤答・未回答は最初から開く、正解は閉じる（利用者が開け閉めしたらそれを優先）
  const [openEx, setOpenEx] = useState<Record<string, boolean>>({});
  // ノートに保存（1問ずつ・同じ問題は1件だけ）
  const noteUid = auth.currentUser?.uid || 'guest';
  const [savedNotes, setSavedNotes] = useState<Record<string, boolean>>({});
  const isSaved = (id: string) => savedNotes[id] ?? isToeicNoteSaved(noteUid, id);
  const roundNo = (() => { const m = String(currentQuestion?.id || '').match(/_r(\d+)$/); return m ? Number(m[1]) : currentQuestionIndex + 1; })();
  const saveNote = (sq: SubQuestion, no: number) => {
    const ex = toeicExplanationFor(sq);
    if (!ex || !currentQuestion || isSaved(sq.id)) return;
    try {
      saveToeicNote({ uid: noteUid, chapter, problem: currentQuestion, sq, ex, questionNo: no, roundNo });
      setSavedNotes((prev) => ({ ...prev, [sq.id]: true }));
      notify(isGuest ? 'ノートに保存しました！（ゲスト利用のため、この端末にだけ保存されます）' : 'ノートに保存しました！');
    } catch (e) {
      console.error('保存エラー:', e);
      notify('保存に失敗しました。');
    }
  };
  const jumpTo = (id: string) => {
    const el = document.getElementById(`tp-item-${id}`);
    el?.scrollIntoView({ block: 'start', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    groupRefs.current[id]?.focus({ preventScroll: true });
  };

  const scorePage = createScoreCurrentQuestion({
    currentQuestion, perStep: true, activeStepSub: page[0] ?? null, activeStepSubs: page,
    run, setRun, lastScoredQuestionRef, timeUsedRef, answers, questionTimeLimit: pageLimit,
    chapter, mode, isGuest, currentQuestionIndex, onScored,
  });

  // 結果画面へ（既存の終了処理をそのまま使う：ステージ記録・章ベスト送信・ランの片づけ・onFinish）
  const { handleNext: finishRound } = createQuizStepActions({
    chapter, mode, isGuest, questions, answers, questionRange, rangeStart, rangeEnd,
    currentQuestionIndex, perStep: false, isLastStep: true, isLastQuestion: true, safeStepIndex: 0, showingExplanation: true,
    scoreCurrentQuestionIfNeeded: () => null, setScoreAnimationData: noop, setShowScoreAnimation: noop,
    setShowingExplanation: noop, setStepIndex: noop, setCurrentQuestionIndex, onExplanationChange,
    onFinish: (finalAnswers, result) => {
      // 同じ回をもう一度開いたとき、終わった回の答えとページが残らないようにする
      safeRemoveItem(quizAnswersKey(chapter.id, mode));
      safeRemoveItem(quizStepKey(chapter.id, mode));
      onFinish(finalAnswers, result);
    },
  });

  const select = (sq: SubQuestion, mark: string) => {
    if (pageScored) return; // 採点後は変えられない
    setAnswers((prev) => {
      const next = { ...prev };
      if (next[sq.id] === mark) delete next[sq.id]; // 選んだ答えをもう一度押すと外す
      else next[sq.id] = mark;
      return next;
    });
  };

  const handleScore = () => {
    if (pageScored || page.length === 0) return;
    setAttempted((prev) => ({ ...prev, [safePage]: true }));
    // 未回答があっても確認せずに採点する（ご要望で確認の注意書きを外した。未回答は不正解として数える）
    timeUsedRef.current = Math.max(0, elapsedRef.current - pageStartRef.current);
    const feedback = feedbackForPage(safePage, timeUsedRef.current);
    pageFeedbackRef.current[safePage] = feedback;
    setPageFeedback(feedback);
    const scored = scorePage();
    pageStartRef.current = elapsedRef.current;
    if (scored) {
      setScoreFx({ breakdown: scored.breakdown, totalScore: scored.addedScore });
      setShowFx(true);
    }
    scrollTop();
  };

  const goPage = (i: number) => {
    setPageIndex(Math.min(Math.max(0, i), Math.max(0, pages.length - 1)));
    scrollTop();
  };

  const handleForward = () => {
    if (!pageScored) { handleScore(); return; }
    if (!isLastPage) {
      setPageFeedback(pageFeedbackRef.current[safePage] || '');
      goPage(safePage + 1);
      return;
    }
    if (hasNextRound) {
      // 範囲が複数の回にまたがるとき（復習ノートからの解き直しなど）は次の回の1ページ目へ
      pageStartRef.current = 0;
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setPageIndex(0);
      lastScoredQuestionRef.current = null;
      scrollTop();
      return;
    }
    finishRound();
  };

  // キーボード：問題の枠にフォーカスがあるとき A〜D（1〜4）で選ぶ／↑↓で前後の問題へ
  const onGroupKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, sq: SubQuestion, idx: number) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k in MARK_KEYS) {
      const mark = sq.options[MARK_KEYS[k]];
      if (mark) { e.preventDefault(); select(sq, mark); }
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const target = page[idx + (e.key === 'ArrowDown' ? 1 : -1)];
      if (target) { e.preventDefault(); groupRefs.current[target.id]?.focus(); }
    }
  };

  if (!currentQuestion || subs.length === 0) {
    return (
      <div className="tp-root" data-toeic-page-quiz>
        <p className="tp-empty">この回の問題は準備中です。</p>
        <button type="button" className="tp-btn tp-btn-sub" onClick={onBack}>戻る</button>
      </div>
    );
  }

  const forwardLabel = !pageScored ? 'このページを採点する' : !isLastPage ? '次のページ' : hasNextRound ? '次の回へ' : '結果を見る';
  const pageElapsedSec = Math.max(0, elapsedSec - Math.floor(pageStartRef.current));
  const pagePaceStatus = pageElapsedSec > guidePageLimitSec
    ? '少し遅れ'
    : pageElapsedSec < pageBudget.targetSec
      ? `予定より ${formatToeicBudgetDelta(pageBudget.targetSec - pageElapsedSec)} 早い`
      : pageElapsedSec === pageBudget.targetSec
        ? '予定どおり'
        : '余白を使用中';
  const totalSlackSec = pageBudgets[pageBudgets.length - 1]?.targetRemainingSec ?? 0;
  const totalSlackLabel = totalSlackSec >= 0
    ? `全体の余白 ${formatToeicBudgetTime(totalSlackSec)}`
    : `全体の余白 不足 ${formatToeicBudgetTime(-totalSlackSec)}`;
  const targetPosition = pageBudget.targetSec / guidePageLimitSec * 100;
  const targetBarStyle = budgetPositionStyle(pageBudget.targetSec, guidePageLimitSec);
  const slackBandStyle = {
    left: `${Math.min(100, targetPosition)}%`,
    width: `${Math.max(0, Math.min(100, 100 - targetPosition))}%`,
  };

  return (
    <div className="tp-root" data-toeic-page-quiz>
      {onReturnToBattle && <button type="button" onClick={onReturnToBattle} className="tp-battle-return">バトル結果・解説に戻る</button>}
      <header className="tp-head" data-quiz-header>
        <button type="button" className="tp-back" onClick={onBack} aria-label="単元選択に戻る" title="単元選択に戻る">
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        <span className="tp-mode">{mode === 'mini_test' ? '小テスト' : '演習'}</span>
        <h2 className="tp-title">{chapter.abstractTitle}</h2>
        <dl className="tp-stats">
          <div title="いまのページ／全ページ">
            <dt><FileText size={14} aria-hidden="true" /><span className="tp-sr">ページ</span></dt>
            <dd data-toeic-page-pos><b>{safePage + 1}</b>/{pages.length}<small>ページ</small></dd>
          </div>
          <div title="答えた問題／全問題">
            <dt><ListChecks size={14} aria-hidden="true" /><span className="tp-sr">回答済み</span></dt>
            <dd data-toeic-answered><b>{answeredCount}</b>/{subs.length}<small>問</small></dd>
          </div>
        </dl>
      </header>
      <div className="tp-time-row">
        <ToeicTimer timeLimit={roundLimit} running={!allScored} finished={allScored} onTick={(e) => { elapsedRef.current = e; setElapsedSec(Math.floor(e)); }}
          guideStatus={timeGuide.enabled ? totalSlackLabel : undefined} resetKey={`${chapter.id}_${currentQuestionIndex}`} />
        <details className="tp-budget-settings">
          <summary aria-label="時間ガイド設定" title="時間ガイド設定"><Settings size={18} aria-hidden="true" /><span className="tp-sr">時間ガイド設定</span></summary>
          <div className="tp-budget-settings-body">
            <label><input type="checkbox" checked={timeGuide.enabled} onChange={(event) => setTimeGuide((prev) => ({ ...prev, enabled: event.currentTarget.checked }))} />時間ガイドを表示</label>
            <label htmlFor="tp-budget-preset">目安</label>
            <select id="tp-budget-preset" value={timeGuide.preset} onChange={(event) => setTimeGuide((prev) => ({ ...prev, preset: event.currentTarget.value as ToeicTimePresetId }))}>
              {(Object.keys(TOEIC_TIME_PRESETS) as ToeicTimePresetId[]).map((key) => <option key={key} value={key}>{TOEIC_TIME_PRESETS[key].label}</option>)}
            </select>
          </div>
        </details>
      </div>
      {timeGuide.enabled && <section className="tp-budget" data-toeic-time-budget data-enabled>
        <div className="tp-budget-headline">
          <p className="tp-budget-feedback" role="status" data-toeic-page-feedback>{pageFeedback || pagePaceStatus}</p>
          <ol className="tp-budget-pages" aria-label={`${pages.length}ページ中${safePage + 1}ページ目`} data-toeic-page-progress>
            {Array.from({ length: 5 }, (_, index) => <li key={`page-${index}`} data-progress={index < safePage ? 'done' : index === safePage ? 'current' : 'future'} aria-current={index === safePage ? 'step' : undefined} aria-label={`ページ${index + 1}${index < safePage ? '完了' : index === safePage ? '現在' : '未着手'}`}>
              <span aria-hidden="true">{index < safePage ? '✓' : index + 1}</span>
            </li>)}
          </ol>
        </div>
        <div className="tp-budget-track" role="group" aria-label={`このページの限界時間 ${formatToeicBudgetTime(guidePageLimitSec)}、目標 ${formatToeicBudgetTime(pageBudget.targetSec)}。${pages.length}ページ中${safePage + 1}ページ目`} data-toeic-budget-track>
          <span className="tp-budget-band" style={slackBandStyle} aria-hidden="true" />
          <span className="tp-budget-target-label" data-toeic-page-target style={targetBarStyle} data-near-start={targetPosition < 18 || undefined} data-near-end={targetPosition > 82 || undefined} aria-hidden="true">目標 {formatToeicBudgetTime(pageBudget.targetSec)}</span>
          <span className="tp-budget-tick tp-budget-tick-target" style={targetBarStyle} aria-hidden="true" />
        </div>
      </section>}

      <div className="tp-scroll" ref={listRef}>
        {pageScored && (
          <section className="tp-result" aria-label="このページの結果" data-toeic-page-result data-perfect={pageCorrect === page.length || undefined}>
            <p className="tp-result-score" role="status">
              <CheckCircle2 size={20} aria-hidden="true" />
              <span>このページ</span><b>{pageCorrect}</b><span>/{page.length}問正解</span>
            </p>
            {timeGuide.enabled && <p className="tp-result-time" data-toeic-page-time-result>
              時間：かかった {formatToeicBudgetTime(pageScoreRecord?.timeUsed ?? 0)} / 目標 {formatToeicBudgetTime(pageBudget.targetSec)} / 限界 {formatToeicBudgetTime(guidePageLimitSec)}
            </p>}
            <ol className="tp-result-marks" aria-label="問題ごとの正誤（押すとその問題へ移動）">
              {page.map((sq) => {
                const no = questionNumber(sq, subs.indexOf(sq) + 1);
                const chosen = answers[sq.id] || '';
                const st = !chosen ? 'blank' : isAnswerCorrect(sq, chosen) ? 'correct' : 'wrong';
                return (
                  <li key={sq.id}>
                    <button type="button" className="tp-result-mark" data-result={st} data-toeic-jump={no} onClick={() => jumpTo(sq.id)}
                      aria-label={`問${no} ${st === 'correct' ? '正解' : st === 'wrong' ? '不正解' : '未回答'}`}>
                      <span className="tp-result-no">{no}</span>
                      <span className="tp-result-sym" aria-hidden="true">{st === 'correct' ? '○' : st === 'wrong' ? '×' : '−'}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="tp-result-skills" data-toeic-page-skills>
              <span className="tp-sr">分野別：</span>
              {pageSkills.map(([k, v]) => <span key={k} className="tp-result-skill"><span>{k}</span><b>{v.c}/{v.n}</b></span>)}
            </p>
          </section>
        )}
        <div className={`tp-list${pageScored ? ' is-scored' : ''}`} data-toeic-page={safePage + 1}>
          {page.map((sq, idx) => {
            const no = questionNumber(sq, subs.indexOf(sq) + 1);
            const chosen = answers[sq.id] || '';
            const texts = sq.optionTexts || [];
            const ok = pageScored && isAnswerCorrect(sq, chosen);
            const status = !pageScored
              ? (chosen ? 'answered' : attempted[safePage] ? 'unanswered' : 'todo')
              : !chosen ? 'blank' : ok ? 'correct' : 'wrong';
            const filled = chosen ? (texts[sq.options.indexOf(chosen)] ?? '') : '';
            const ex = pageScored ? toeicExplanationFor(sq) : null;
            const labelId = `tp-q-${sq.id}`;
            return (
              <article key={sq.id} id={`tp-item-${sq.id}`} className="tp-item" data-status={status} data-toeic-question={no}>
                <p className="tp-sentence" id={labelId}>
                  <span className="tp-no" aria-hidden="true">{no}</span>
                  <span className="tp-sr">問{no}　</span>
                  <StemWithBlank stem={stemOf(currentQuestion, sq)} filled={filled}
                    result={pageScored && chosen ? (ok ? 'right' : 'wrong') : undefined} cues={ex?.cues} />
                  {(status === 'unanswered' || status === 'blank') && <span className="tp-tag" data-toeic-unanswered>未回答</span>}
                </p>
                <div
                  role="radiogroup"
                  aria-labelledby={labelId}
                  aria-disabled={pageScored || undefined}
                  tabIndex={0}
                  ref={(el) => { groupRefs.current[sq.id] = el; }}
                  onKeyDown={(e) => onGroupKeyDown(e, sq, idx)}
                  className={`tp-choices${prefersSingleColumn(texts) ? ' is-single' : ''}${pageScored ? ' is-scored' : ''}`}
                >
                  {sq.options.map((mark, i) => {
                    const checked = chosen === mark;
                    const isRight = pageScored && mark === sq.correctAnswer;
                    const isWrongPick = pageScored && checked && !isRight;
                    return (
                      <div
                        key={mark}
                        role="radio"
                        aria-checked={checked}
                        aria-disabled={pageScored || undefined}
                        aria-label={`${mark} ${texts[i] ?? ''}${isRight && checked ? '（あなたの答え・正解）' : isRight ? '（正解）' : isWrongPick ? '（あなたの答え）' : ''}`}
                        tabIndex={-1}
                        className="tp-choice"
                        data-checked={checked || undefined}
                        data-result={isRight ? 'right' : isWrongPick ? 'wrong' : undefined}
                        onClick={() => select(sq, mark)}
                      >
                        <span className="tp-bubble" aria-hidden="true">{markLetter(mark)}</span>
                        <span className="tp-choice-body" aria-hidden="true">
                          <span className="tp-choice-text">{formatText(texts[i] ?? mark, [], { prose: true })}</span>
                        </span>
                        {/* 「あなた・正解」のバッジ（英文法の答え合わせと同じ形）。選択肢の幅を食わないよう枠の右上に重ねる */}
                        {(isRight || isWrongPick) && (
                          <span className="tp-choice-badge" data-tone={isRight ? 'right' : 'wrong'} data-toeic-badge aria-hidden="true">
                            {isRight && checked ? 'あなた・正解' : isRight ? '正解' : 'あなた'}
                          </span>
                        )}
                        {checked && !pageScored && <Check size={18} strokeWidth={3} className="tp-choice-check" aria-hidden="true" />}
                      </div>
                    );
                  })}
                </div>
                {pageScored && (
                  <div className="tp-meta" data-toeic-meta>
                    <p className="tp-judge" data-result={status}>
                      {status === 'correct' ? <CheckCircle2 size={18} aria-hidden="true" /> : status === 'wrong' ? <XCircle size={18} aria-hidden="true" /> : <MinusCircle size={18} aria-hidden="true" />}
                      <span>{status === 'correct' ? '正解' : status === 'wrong' ? `不正解（正解は ${sq.correctAnswer}）` : `未回答（正解は ${sq.correctAnswer}）`}</span>
                    </p>
                    {ex && <span className="tp-skill" data-toeic-skill>{ex.skill}<small>{ex.subType}</small></span>}
                    {ex && (
                      <button type="button" className="tp-save" data-toeic-save data-saved={isSaved(sq.id) || undefined}
                        onClick={() => saveNote(sq, no)} disabled={isSaved(sq.id)}
                        aria-label={isSaved(sq.id) ? `問${no}はノートに保存済み` : `問${no}をノートに保存`}>
                        {isSaved(sq.id) ? <BookmarkCheck size={16} aria-hidden="true" /> : <Bookmark size={16} aria-hidden="true" />}
                        <span>{isSaved(sq.id) ? '保存済み' : 'ノートに保存'}</span>
                      </button>
                    )}
                  </div>
                )}
                {ex && (
                  <ToeicExplanationPanel ex={ex} correctText={ex.choices.find((c) => c.correct)?.text ?? ''}
                    open={openEx[sq.id] ?? status !== 'correct'}
                    onToggle={(next) => setOpenEx((prev) => ({ ...prev, [sq.id]: next }))} />
                )}
              </article>
            );
          })}
        </div>
      </div>

      <footer className="tp-foot">
        <button type="button" className="tp-btn tp-btn-sub" onClick={() => goPage(safePage - 1)} disabled={safePage === 0}>
          <ChevronLeft size={18} aria-hidden="true" /><span>前のページ</span>
        </button>
        {/* 採点後の「正解 n/6問」は上の結果の帯に出すので、下には出さない（同じものを2つ置かない） */}
        {!pageScored && (
          <span className="tp-unanswered" aria-live="polite" data-toeic-unanswered-count>
            {unanswered > 0 ? `未回答 ${unanswered}問` : 'すべて回答済み'}
          </span>
        )}
        <button type="button" className="tp-btn tp-btn-main" onClick={handleForward} data-toeic-forward>
          <span>{forwardLabel}</span><ChevronRight size={18} aria-hidden="true" />
        </button>
      </footer>

      {scoreFx && <FloatingScoreAnimation breakdown={scoreFx.breakdown} totalScore={scoreFx.totalScore} isVisible={showFx} />}
    </div>
  );
}
