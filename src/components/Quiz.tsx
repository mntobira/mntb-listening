import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
// 記号パレット（解答入力の補助キーボード）は components/SymbolPalette.tsx にある。
// 実際に置いているのは解答ペイン（AnswerPane.tsx）なので、
// このファイルは「どの設問に出すか」の判定（questionNeedsMathPalette）だけを持つ。
// 並べ替え（sorting）の解答UIは components/SortingControl.tsx に切り出した。
import { SortingControl } from './SortingControl';
import { MultipleChoiceControl } from './MultipleChoiceControl';
// 消去法（斜線）のしくみ一式は hooks/useElimination.ts に集約
import { useElimination } from '../hooks/useElimination';
// 設問から作る表示用の派生値（useMemo 17個）は hooks/useQuestionDerived.ts へ
import { useQuestionDerived } from '../hooks/useQuestionDerived';
// 問題文ペイン（左58%／スマホ上）の JSX は components/ProblemPane.tsx へ
import { ProblemPane } from './ProblemPane';
// 解答ペイン（右42%／スマホ下）の JSX は components/AnswerPane.tsx へ
import { AnswerPane } from './AnswerPane';
// ヘッダー帯（単元名・スコア・順位・進捗）は components/QuizHeader.tsx へ
import { QuizHeader } from './QuizHeader';
// スマホ下部の固定バー2本（ナビ／入力）は components/MobileFloatingBar.tsx へ
import { MobileFloatingBar } from './MobileFloatingBar';
// 図・音源プレイヤー・イオン化エネルギーのグラフは、いずれも
// 問題文ペイン（ProblemPane.tsx）が直接 import して描画している。
// このファイルは「何番の図か」の対応表を作って渡すだけ。
import { buildFigureNumberMap } from '../utils/figureNumbering';
// 解答解説の画面（早期 return の JSX 50行）は components/ExplanationScreen.tsx へ
import { ExplanationScreen } from './ExplanationScreen';
// リスニングの「問題の説明ページ」（早期 return の JSX 64行）は
// components/ListeningBriefing.tsx へ
import { ListeningBriefing } from './ListeningBriefing';
// 「解答と解説を見る」を押した瞬間の採点処理（137行）は utils/quizScoring.ts へ
import { createScoreCurrentQuestion } from '../utils/quizScoring';
import { QuizTimerBar } from './QuizTimerBar';
import { FloatingScoreAnimation } from './FloatingScoreAnimation';
import { calcQuestionTimeLimit, type ScoreBreakdown } from '../utils/scoring';
import { submitChapterScore } from '../utils/leaderboard';
import {
  parseStoredNonNegativeInteger,
  parseStoredStringRecord,
} from '../utils/progress';
// 章 × モードごとの保存キー名は utils/quizStorageKeys.ts が唯一の定義
import {
  quizAnswersKey,
  quizExplKey,
  quizIndexKey,
  quizStepKey,
} from '../utils/quizStorageKeys';
// 章の途中経過（点数・コンボ・所要時間）の型と読み書きは utils/quizRunState.ts に集約
import { clearRun, loadRun, type ChapterRunState } from '../utils/quizRunState';
// 記号パレットを「この設問に出すか」の判定ルールは utils/quizPaletteRules.ts に集約。
// 実際に呼ぶのは派生値フック（hooks/useQuestionDerived.ts）なので、
// このファイルからは import しなくなった。
// スマホでソフトウェアキーボードに入力欄が隠れないようにするスクロール調整。
// focus 時の調整（handleInputFocusScroll）は入力欄を持つ AnswerPane.tsx 側。
import { scrollInputIntoView } from '../utils/quizInputScroll';
// 設問ラベルからの空欄トークン推定と短答判定（純関数）
import { isShortAnswerType } from '../utils/quizBlanks';
// cleanQuestionText は解説画面（Explanation.tsx）と同じ実装が必要なので
// questionDisplay.ts の1つだけを使う。呼ぶ場所は派生値フックへ移った。
import { buildListeningSteps, isPerSubQuestionListening, stepSubQuestions } from '../utils/listeningSteps';
import { useIsDesktop } from '../hooks/useMediaQuery';
import { asMobileChoiceSub, useMathChoices } from '../utils/mathMobileChoices';
import { mathCourseOfChapter } from '../data/mathNavigation';
import { safeSetItem } from '../utils/storageGuard';

interface QuizProps {
  mode: 'mini_test' | 'practice';
  chapter: any;
  onFinish: (answers: Record<string, string>, result?: ChapterRunState) => void;
  onBack: () => void;
  onReturnToBattle?: () => void;
  isGuest: boolean;
  isMobileView?: boolean;
  onExplanationChange?: (isExplanation: boolean) => void;
  onScored?: (breakdown: ScoreBreakdown, meta: { timeLimit: number; timeUsed: number; questionId: string }) => void;
  /**
   * 「この範囲だけを1回の演習として解く」ときの範囲（両端を含む・章内の通し番号）。
   *
   * ■ 何のために足したのか（ご要望）
   *   英語リスニングは、これまで「第1問A」を開くと収録14回分が
   *   ひとつの通し番号（進捗 1/14）でつながっていた。
   *   そのため「第3回だけ解く」ことができず、必ず頭から通しでしか解けなかった。
   *   「第1問A のページ → 第1回演習〜第14回演習のボタンが並ぶ」形にするため、
   *   選ばれた1回だけを1セットとして扱えるようにする。
   *
   * ■ 章IDを分けなかった理由（とても大事）
   *   回ごとに新しい章IDを作ると、保存キー（quiz_answers_ / quiz_run_ など）や
   *   進捗台帳・ランキングの宛先が変わり、今まで解いてくれた記録が
   *   まるごと迷子になる。だから章IDは今のまま据え置き、
   *   「章の中のどこからどこまでを1回とみなすか」だけをここで受け取る。
   *
   * 省略（undefined）時は従来どおり章の全問を通しで解く。
   */
  questionRange?: { startIndex: number; endIndex: number } | null;
}

/**
 * 章の途中経過（点数・コンボ・所要時間）の型と localStorage 読み書きは
 * utils/quizRunState.ts に集約した（この画面の描画とは無関係な下請け処理）。
 * 保存キーは従来どおり quizStorageKeys.ts の quizRunKey を使う。
 */

/**
 * 記号パレットを出すかどうかの判定（answerNeedsPalette / requiresChemicalSymbols /
 * requiresMathSymbols）は utils/quizPaletteRules.ts に集約した。
 * 画面の描き方に依存しない純関数なので、単体で確かめられる場所に置く。
 */

/**
 * ソフトウェアキーボードで入力欄が隠れないようにするスクロール調整
 * （scrollInputIntoView / handleInputFocusScroll）は
 * utils/quizInputScroll.ts に切り出した。
 *
 * 設問ラベルからの空欄トークン推定と短答判定
 * （extractBlankToken / blankHighlightVariants / isShortAnswerType）は
 * utils/quizBlanks.ts に切り出した。
 */
/**
 * 記号パレット（PaletteButton / SymbolPalette / ChemistryPalette / MathPalette）は
 * components/SymbolPalette.tsx に切り出した。
 * 解答入力欄のカーソル位置に文字を挿入するだけの独立した部品で、
 * クイズの進行（採点・タイマー・ページ送り）とはやり取りしない。
 */

export function Quiz({ mode, chapter, onFinish, onBack, onReturnToBattle, isGuest, isMobileView, onExplanationChange, onScored, questionRange }: QuizProps) {
  // ===== タイマー & スコア用 state =====
  const [run, setRun] = useState<ChapterRunState>(() => loadRun(chapter.id, mode));
  const timeUsedRef = useRef(0); // タイマーから250msごとに通知される最新値
  const lastScoredQuestionRef = useRef<string | null>(null);
  // 記述/短答入力欄の参照を sub-question id 単位で保持（化学記号パレットの
  // カーソル位置挿入に使用）。
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});
  // 「前へ/次へ」やキーボードの「次へ(next)」でフォーカスを移すとき、
  // 再レンダー後に描画前（同期）で確実に .focus() するための一時保持。
  // iOS でソフトキーボードが一瞬閉じてしまう不具合の防止に用いる。
  const pendingFocusIdRef = useRef<string | null>(null);
  // 問題文ペインのスクロールコンテナ。スマホでキーボード表示中に
  // 「いま入力している穴抜きのカッコ」（黄色ハイライト）へ自動スクロール
  // させるために使う（ご要望：「問題(穴抜きなどのカッコの場所)は見えるようにしたい」）。
  const problemScrollRef = useRef<HTMLDivElement | null>(null);
  const getInputRef = (sqId: string): React.RefObject<HTMLInputElement | HTMLTextAreaElement | null> => ({
    get current() {
      return inputRefs.current[sqId] ?? null;
    },
    set current(el: HTMLInputElement | HTMLTextAreaElement | null) {
      inputRefs.current[sqId] = el;
    },
  });

  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    parseStoredStringRecord(localStorage.getItem(quizAnswersKey(chapter.id, mode))),
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => {
    const questionCount = mode === 'mini_test'
      ? (chapter.miniTest || []).length
      : (chapter.practiceProblems || []).length;
    return parseStoredNonNegativeInteger(
      localStorage.getItem(quizIndexKey(chapter.id, mode)),
      Math.max(0, questionCount - 1),
    );
  });
  const [showingExplanation, setShowingExplanation] = useState(() => {
    return localStorage.getItem(quizExplKey(chapter.id, mode)) === 'true';
  });

  /**
   * リスニングで「いま大問（回）の中の何問目を解いているか」（0始まり）。
   *
   * ご要望：
   *   > 問1で1つの進捗、問2で1つの進捗みたいな感じにしてほしい。
   *
   * 大問そのもの（第N回演習）は分割していないので `currentQuestionIndex` は
   * これまでどおり「回」を指す。その中の何問目かをこの state が持つ。
   * 中断して戻ってきたときに問1からやり直しにならないよう端末に保存する。
   */
  const [stepIndex, setStepIndex] = useState(() =>
    parseStoredNonNegativeInteger(localStorage.getItem(quizStepKey(chapter.id, mode))),
  );

  useEffect(() => {
    safeSetItem(quizAnswersKey(chapter.id, mode), JSON.stringify(answers));
  }, [answers, chapter.id, mode]);

  useEffect(() => {
    safeSetItem(quizStepKey(chapter.id, mode), stepIndex.toString());
  }, [stepIndex, chapter.id, mode]);

  useEffect(() => {
    safeSetItem(quizIndexKey(chapter.id, mode), currentQuestionIndex.toString());
  }, [currentQuestionIndex, chapter.id, mode]);

  useEffect(() => {
    safeSetItem(quizExplKey(chapter.id, mode), showingExplanation.toString());
  }, [showingExplanation, chapter.id, mode]);

  // ────────────────────────────────────────────────────────────────
  // 消去法（選択肢に斜線を引く）
  // ────────────────────────────────────────────────────────────────
  // 消去状態・端末への保存・斜線を引く／戻す・長押しでまとめて戻す・
  // 操作説明の初回表示、という一連の部品は hooks/useElimination.ts に
  // まとめた（Quiz.tsx で約 110 行を占めていた）。
  //
  // ★変えてはいけない設計：消去状態は採点対象の解答（answers）とは
  //   完全に別に持つ。混ぜると「消したつもりが解答になっていた」という
  //   取り違えが起きる。採点は answers のみを見る。
  const {
    eliminated,
    isEliminated,
    restoreOption,
    clearEliminated,
    strikeOptionAnimated,
    justStruck,
    beginLongPress,
    endLongPress,
    longPressFired,
    elimHintOpen,
    setElimHintOpen,
    dismissElimHint,
  } = useElimination(chapter.id, mode);

  // New state for layout and highlighting
  const [isProblemExpanded, setIsProblemExpanded] = useState(false);
  // ★スマホ：問題文ペインを「見出しだけ」にたたむトグル（ご要望）。
  // 長い問題文が画面上半分を占領して解答欄が狭くなる問題への対策。
  // たたむと下の解答ペインがほぼ全画面になり、入力に集中できる。
  // 短い問題（もともと h-auto で収まる）には影響しない。
  const [isProblemCollapsed, setIsProblemCollapsed] = useState(false);
  const [highlights, setHighlights] = useState<string[]>([]);
  // 現在フォーカス中の短答穴埋め設問ID（フローティング入力欄・空欄ハイライト用）
  const [focusedSubId, setFocusedSubId] = useState<string | null>(null);
  // スマホ：解答欄に「いま表示する1設問」のインデックス（ページ送り方式）。
  // ご指摘：「上下スクロールして(1)、(2)っていう入力欄を押して入力してく
  //         じゃん？それやめよう。(1)の入力欄を下半分に最初固定した状態に
  //         して。解答欄の右と左に黒の小さな矢印を置いて、固定する解答欄を
  //         変えるようにしてくれない？解答欄のスクロールがすごいうざい」
  // スマホでは全設問を縦に並べず、1設問ずつこの番号の欄だけを表示する。
  const [mobileAnsIdx, setMobileAnsIdx] = useState(0);
  // リスニング：問題の説明ページ（ブリーフィング）を表示中か。
  // ご要望：「これらの問題の説明は第1回演習とかのボタンを押した後に、
  //          問題を出すまえに問題の説明のページを作ってそこに書いてほしい」
  // 流れ：回を選ぶ → 説明ページ → 問1 → 問1の解説 → 問2 → …
  // 解答中の画面からはリード文（毎回同じ説明）を撤去し、
  // その分のスペースを選択肢・図の表示に当てる。
  const [showingBriefing, setShowingBriefing] = useState(false);
  // ソフトキーボードが表示されているか（visualViewport で推定）。
  // 表示中のみ、短答穴埋め用のフローティング入力バーを画面下部に出す。
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  // フローティング入力バーをキーボード上端に追従させるためのオフセット（px）。
  // visualViewport から算出した「画面下端からキーボード上端までの距離」。
  // iOS Safari では position:fixed + bottom:0 がキーボードに隠れるため、
  // ここで動的に bottom 値を与えてキーボードに貼り付くようにする。
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // スマホ（タッチ）並べ替え用：タップで選択中の要素インデックス。
  // 「1つ目タップで選択 → 2つ目タップで位置を入れ替え」に使う。
  // sqId 単位で管理し、別設問へ移ったら選択解除する。
  const [tapSortSelect, setTapSortSelect] = useState<{ sqId: string; index: number } | null>(null);
  // Score animation state
  const [showScoreAnimation, setShowScoreAnimation] = useState(false);
  const [scoreAnimationData, setScoreAnimationData] = useState<{
    breakdown: ScoreBreakdown;
    totalScore: number;
  } | null>(null);
  // スマホ/PC判定は共有フックに一元化（lg=1024px 以上をPCとみなす）。
  // isMobileView が渡された場合（スマホプレビュー枠）はそれを優先する。
  const isDesktop = useIsDesktop(isMobileView !== undefined ? !isMobileView : undefined);
  // 解答解説ページに渡すスマホ判定。
  // 【俯瞰UIの廃止】以前はスマホでも PC 版レイアウトを縮小表示（俯瞰UI）して
  // いたが、「解答と解説の文字が小さい」というご指摘のとおり初期表示が極小に
  // なるため廃止。スマホでは Explanation 側のスマホ専用レイアウト
  // （問題文を上部に固定＋正誤一覧→タップで解説）で表示する。
  // isMobileView が未指定なら Explanation 自身のメディアクエリ判定に任せる。
  const isMobileForExplanation = isMobileView;

  // 直前に表示していた問題のインデックスを保持（離脱した問題の回答リセット用）
  const prevQuestionIndexRef = useRef(currentQuestionIndex);

  /**
   * 指定インデックスの問題に入力された回答を消去する。
   * ただし、その問題が既に採点済みの場合は保持する
   * （採点済みの解答は解説表示の答え合わせに必要なため）。
   * 「一度離れた未提出の問題の回答」だけをリセットし、不正な得点（解答の使い回し）を防ぐ。
   *
   * ★採点済みの判定は perQuestion と perStep の両方を見る★
   *   リスニングの1問ずつモードの採点記録は run.perQuestion ではなく
   *   run.perStep（キーは「大問ID::小問ID」）に入る。
   *   以前は perQuestion しか見ていなかったため、リスニングで大問を
   *   移動した瞬間に「採点済みの解答」まで削除され、結果画面で
   *   解いたはずの問が全部「未解答→不正解」になるバグがあった。
   *   （ご報告「一問しか解いてないのに他のが全部不正解扱いになる」の原因）
   */
  const clearAnswersForQuestionIfUnscored = (qIndex: number) => {
    const q = questions[qIndex];
    if (!q) return;
    const scoredAsQuestion = !!run.perQuestion[q.id];
    const scoredAsStep = Object.keys(run.perStep || {}).some(
      (key) => key.startsWith(`${q.id}::`),
    );
    if (scoredAsQuestion || scoredAsStep) return; // 採点済みは残す
    const subIds: string[] = (q.subQuestions || []).map((sq: any) => sq.id);
    if (subIds.length === 0) return;
    setAnswers(prev => {
      let changed = false;
      const next = { ...prev };
      subIds.forEach(id => {
        if (id in next) {
          delete next[id];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  };

  // Clear highlights on new question
  useEffect(() => {
    setHighlights([]);
    timeUsedRef.current = 0;
    lastScoredQuestionRef.current = null;

    // 問題が切り替わったら、離れた（前の）問題の未提出回答をリセットする
    const leftIndex = prevQuestionIndexRef.current;
    if (leftIndex !== currentQuestionIndex) {
      clearAnswersForQuestionIfUnscored(leftIndex);
      prevQuestionIndexRef.current = currentQuestionIndex;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex]);

  // showingExplanation の状態を App 側（isExplanationView）へ同期する。
  //
  // 【俯瞰UI化に伴う修正】viewport の制御は App.tsx の shouldForceDesktopUI
  // effect に一元化したため、解説表示中かどうかを App が正確に把握できる
  // 必要がある。従来は各ハンドラ内でのみ onExplanationChange を呼んでいたため、
  // localStorage から showingExplanation=true で復元された場合（リロード/再開時）
  // に App 側と状態がズレ、初回表示だけレイアウトと viewport の組み合わせが
  // 不整合になる問題があった。effect で常に同期させて確実に一致させる。
  useEffect(() => {
    if (onExplanationChange) onExplanationChange(showingExplanation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showingExplanation]);

  // 問題解答画面ではズーム（ピンチ／ダブルタップ）を一切禁止する。
  //
  // 【要件2・利便性向上】
  // - iOS Safari は meta viewport の maximum-scale を後から変えても効かない場合があるため、
  //   gesturestart / gesturechange（ピンチ）と、300ms以内の連続タップ（ダブルタップ）
  //   を JS で明示的に抑止し、確実にズームさせない。
  //
  // 【俯瞰UI化に伴う修正】従来はここで meta viewport も直接書き換えていたが、
  // App / Explanation と 3箇所で競合して初回表示時のスクロール不能の原因と
  // なっていたため廃止し、viewport 制御は App.tsx に一元化した。
  // （解説表示中は上の同期 effect 経由で App が俯瞰用 viewport を適用する）
  useEffect(() => {
    // ピンチズーム（iOS の gesture イベント）を抑止
    const preventGesture = (e: Event) => { e.preventDefault(); };
    // ダブルタップズームを抑止（前回タップから300ms以内の2回目タップをキャンセル）
    let lastTouchEnd = 0;
    const preventDoubleTapZoom = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    if (showingExplanation) {
      // 解説へ移る瞬間: スクロール位置を最上部へ（viewport は App 側が制御）
      window.scrollTo(0, 0);
    } else {
      // 解答中のみズーム抑止リスナーを登録する
      document.addEventListener('gesturestart', preventGesture, { passive: false });
      document.addEventListener('gesturechange', preventGesture, { passive: false });
      document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });
    }

    return () => {
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('touchend', preventDoubleTapZoom);
    };
  }, [showingExplanation]);

  useEffect(() => {
    if (!showingExplanation) {
      window.scrollTo(0, 0);
    }
  }, [currentQuestionIndex, showingExplanation]);

  // ソフトキーボードの表示/非表示を visualViewport の高さ変化で推定する。
  // キーボードが閉じたら、フローティング入力欄も閉じて「問題文全体＋入力欄」を
  // 同時に見られる通常表示に戻す（要件1）。
  useEffect(() => {
    const vv = (window as any).visualViewport as VisualViewport | undefined;
    if (!vv) return;
    // 初期のフル高さ。キーボード表示で vv.height はこれより小さくなる。
    const baseline = () => Math.max(vv.height, window.innerHeight || 0);
    let base = baseline();
    const onResize = () => {
      const full = Math.max(base, window.innerHeight || 0);
      // 可視領域が 15% 以上縮んだらキーボード表示とみなす。
      const shrink = full - vv.height;
      const visible = shrink > full * 0.15;
      setKeyboardVisible(visible);
      if (visible) {
        // キーボード上端の位置（レイアウトビューポート下端からの距離）。
        // layout viewport の高さ - (visualViewport の可視下端) がキーボード高さに相当。
        // offsetTop はページスクロール分、height は可視高さ。
        const layoutH = window.innerHeight || full;
        const kbTopFromBottom = Math.max(0, layoutH - (vv.height + vv.offsetTop));
        setKeyboardOffset(kbTopFromBottom);
      } else {
        setKeyboardOffset(0);
        // キーボードが閉じたらフォーカス状態も解除（通常表示へ）。
        // ただし選択式・並べ替え等のテキスト非入力設問は元々キーボードを
        // 開かないため、この resize 起因の解除対象から除外する
        // （除外しないと固定パネルが即座に閉じてしまう）。
        setFocusedSubId((prev) => {
          if (!prev) return prev;
          const cur = (currentQuestionRef.current?.subQuestions || []).find(
            (sq: any) => sq.id === prev
          );
          const isText = cur && (isShortAnswerType(cur) || cur.type === 'descriptive');
          return isText ? null : prev;
        });
      }
    };
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, []);

  // 問題が切り替わったらフォーカス・キーボード状態・並べ替えの選択をリセット
  useEffect(() => {
    setFocusedSubId(null);
    setTapSortSelect(null);
    // 新しい問題では最初の設問（(1)・(ア) など）の解答欄から始める。
    setMobileAnsIdx(0);
    // 問題が変わったら「問題文をたたむ」状態は解除する。
    // 新しい問題の本文を読まずに解き始めてしまう事故を防ぐ。
    setIsProblemCollapsed(false);
    // 消去法の操作説明は「初回のみ」。1問でも先へ進んだら既読として
    // 自動で閉じる（閉じるボタンを押し忘れても2問目からは出ない）。
    if (currentQuestionIndex > 0 && elimHintOpen) {
      try {
        if (localStorage.getItem('quiz_elim_hint_seen') !== 'true') {
          safeSetItem('quiz_elim_hint_seen', 'true');
          setElimHintOpen(false);
        }
      } catch { /* 保存不可の環境ではそのまま */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex]);

  // 「次へ/前へ」やキーボードの next キーによる移動時は、再レンダー直後・描画前に
  // 同期でフォーカスを移す（useLayoutEffect）。iOS はユーザー操作に続く同期的な
  // focus 移動であればソフトキーボードを閉じないため、「次へ」で入力状態が一瞬
  // 解除される不具合を防げる（課題2）。
  useLayoutEffect(() => {
    if (isDesktop) return;
    if (!focusedSubId) return;
    if (pendingFocusIdRef.current !== focusedSubId) return;
    pendingFocusIdRef.current = null;
    // テキスト非入力（選択式・並べ替え）はキーボードを開かないため
    // フォーカス移動は不要。
    {
      const cur = (currentQuestionRef.current?.subQuestions || []).find((sq: any) => sq.id === focusedSubId);
      const isText = cur && (isShortAnswerType(cur) || cur.type === 'descriptive');
      if (!isText) return;
    }
    // ★入力欄は「カード内の実入力欄」1つだけ（ご指摘「タップしたらなんで
    //   重複して解答欄が出てくるかわからん」への対応で、下部バーの複製
    //   入力欄を廃止した）。前へ/次へでの移動先もカード内の入力欄になる。
    const el = inputRefs.current[focusedSubId] ?? null;
    if (el) {
      el.focus({ preventScroll: true });
      try {
        const len = (el.value || '').length;
        (el as any).setSelectionRange?.(len, len);
      } catch {
        /* noop */
      }
    }
  }, [focusedSubId, isDesktop]);

  // 選択中の空欄（focusedSubId）が変わったら、そのカード内の入力欄へ
  // 実フォーカスを移してソフトキーボードを開く。
  //
  // ★入力欄は「カード内」の1か所だけ（ご指摘対応）
  // ─────────────────────────────────────────────
  // ご指摘：「タップしたらなんで重複して解答欄が出てくるかわからん。
  //          普通に入力できるようにしてよ。」
  // 以前は「カード＝表示専用チップ／実入力＝下部バーの複製入力欄」の
  // 2段構えで、同じ設問の解答欄が画面に2つ見えていた。
  // いまはカード内の入力欄に直接書き込む方式なので、フォーカスも
  // カード内の入力欄（inputRefs）へ移すだけでよい。
  // （移動由来の pendingFocus は上の useLayoutEffect が処理済みなのでスキップ）
  useEffect(() => {
    if (isDesktop) return;
    if (!focusedSubId) return;
    // テキスト非入力（選択式・並べ替え）はキーボードを開かないため、
    // カードのスクロールのみ行いフォーカス移動はしない。
    const curSub = (currentQuestionRef.current?.subQuestions || []).find((sq: any) => sq.id === focusedSubId);
    const isTextFocus = curSub && (isShortAnswerType(curSub) || curSub.type === 'descriptive');
    if (!isTextFocus) {
      const card = document.getElementById(`ans-card-${focusedSubId}`);
      if (card) {
        const raf = requestAnimationFrame(() => setTimeout(() => scrollInputIntoView(card), 150));
        return () => cancelAnimationFrame(raf);
      }
      return;
    }
    const raf = requestAnimationFrame(() => {
      const el = inputRefs.current[focusedSubId] ?? null;
      // すでにフォーカス済み（useLayoutEffect で処理済み・ユーザーの直接タップ等）
      // なら二重処理しない
      if (el && document.activeElement !== el) {
        el.focus({ preventScroll: true });
        try {
          const len = (el.value || '').length;
          (el as any).setSelectionRange?.(len, len);
        } catch {
          /* noop */
        }
      }
      // 選択中の入力欄がキーボード・下部バーに隠れないようスクロール
      if (el) setTimeout(() => scrollInputIntoView(el), 320);
    });
    return () => cancelAnimationFrame(raf);
  }, [focusedSubId, isDesktop]);

  // ─────────────────────────────────────────────
  // G-3：キーボード表示中でも「いま入力している穴抜きのカッコ」が見えるようにする
  // ─────────────────────────────────────────────
  // ご要望：「文字の入力欄を出す時に、全体が上に上がりすぎて問題が見えなく
  //          なるので、うまいこと工夫して問題(穴抜きなどのカッコの場所)は
  //          見えるようにしたい」
  // キーボード表示中は問題ペインが max-h-[24vh] に縮むが、縮んだだけでは
  // 該当の空欄が画面外（スクロール下）にあることが多い。そこで、
  // フォーカス中の空欄に対応する黄色ハイライト（<mark>）を問題ペイン内で
  // 探し、ペインのスクロール位置をそのハイライトが中央に来るよう合わせる。
  // ハイライトの描画（combinedHighlights 反映）後に走らせたいので
  // 少し遅延させる。ページ全体は fixed なので window は動かない。
  useEffect(() => {
    if (isDesktop) return;
    if (!focusedSubId) return;
    const timer = setTimeout(() => {
      const pane = problemScrollRef.current;
      if (!pane) return;
      const mark = pane.querySelector('mark');
      if (!mark) return;
      const paneRect = pane.getBoundingClientRect();
      const markRect = (mark as HTMLElement).getBoundingClientRect();
      // ペイン内でのハイライトの相対位置 → ペインの中央に来る scrollTop
      const offsetInPane = markRect.top - paneRect.top + pane.scrollTop;
      const target = Math.max(0, offsetInPane - pane.clientHeight / 2 + markRect.height / 2);
      pane.scrollTo({ top: target, behavior: 'smooth' });
    }, 200);
    return () => clearTimeout(timer);
  }, [focusedSubId, isDesktop]);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim();
      if (selectedText.length > 0 && selectedText.length <= 100) {
        setHighlights(prev => Array.from(new Set([...prev, selectedText])));
        selection.removeAllRanges();
      }
    }
  };

  const handleOptionSelect = (sqId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [sqId]: option }));
  };

  const handleTextChange = (sqId: string, text: string) => {
    setAnswers(prev => ({ ...prev, [sqId]: text }));
  };

  // ────────────────────────────────────────────────────────────────
  // 解答コントロールの共通描画（要件1）
  // 選択式（multiple_choice）・並べ替え（sorting）の入力UIを関数化し、
  // PC版はインラインで、スマホ版は下部固定パネル内で同じUIを再利用する。
  // これにより「問題形式によらず解答欄を固定表示・前へ/次へで遷移」を満たす。
  // ────────────────────────────────────────────────────────────────

  /**
   * 選択式（単一・複数）の解答UIは components/MultipleChoiceControl.tsx に切り出した。
   * 消去法（斜線）・長押しでまとめて戻す・リスニングの選択肢本文表示などを
   * 抱えて 359 行あったため、独立したファイルへ移した。
   * state（eliminated / elimHintOpen）は問題切り替え時のリセットや
   * localStorage 保存が Quiz 側にあるので動かさず、props で渡している。
   */
  /**
   * ★スマホの数学は4択★（PC は今までどおり入力）。
   * 記号パレットで式を打つのはスマホだと時間がかかり、計算より入力で疲れてしまう。
   * 選択肢が用意できない設問だけは、スマホでも入力のままにする。
   */
  const mathMobileChoices = useMathChoices(!isDesktop && mathCourseOfChapter(String(chapter.id)) != null);
  const mobileChoiceSub = (sq: any) => (mathMobileChoices ? asMobileChoiceSub(sq, mathMobileChoices) : null);

  const renderMultipleChoiceControl = (sq: any) => (
    <MultipleChoiceControl
      sq={sq}
      answers={answers}
      onSelect={handleOptionSelect}
      eliminated={eliminated}
      isEliminated={isEliminated}
      restoreOption={restoreOption}
      strikeOptionAnimated={strikeOptionAnimated}
      beginLongPress={beginLongPress}
      endLongPress={endLongPress}
      elimHintOpen={elimHintOpen}
      setElimHintOpen={setElimHintOpen}
      dismissElimHint={dismissElimHint}
      listeningOptionTexts={listeningOptionTexts}
      isEnglishProse={isEnglishProse}
      justStruck={justStruck}
      longPressFired={longPressFired}
      listeningMobileNoFigure={listeningMobileNoFigure}
      /*
        図つきのスマホ（第1問B・第2問など）では、マークだけの選択肢を
        4列×1行にして、浮いた約60pxを図の高さに回す。
        listeningMobileNoFigure の裏返しなので、両方が同時に真になることはない。
      */
      listeningMaterialsMobile={listeningMaterialsMobile}
      listeningMobileWithFigure={listeningMobileSplit && !listeningMobileNoFigure}
    />
  );

  /**
   * 並べ替え（sorting）の解答UIは components/SortingControl.tsx に切り出した。
   * ドラッグ＆ドロップ（PC）とタップ入れ替え（スマホ）の2系統を抱えて
   * 188 行あったため、独立したファイルへ移した。
   * state（draggingIndex / dragOverIndex / tapSortSelect）は
   * 問題切り替え時のリセットが下の useEffect にあるので Quiz 側に残し、
   * props で渡している。
   */
  const renderSortingControl = (sq: any) => (
    <SortingControl
      sq={sq}
      answers={answers}
      onSelect={handleOptionSelect}
      isDesktop={isDesktop}
      draggingIndex={draggingIndex}
      setDraggingIndex={setDraggingIndex}
      dragOverIndex={dragOverIndex}
      setDragOverIndex={setDragOverIndex}
      tapSortSelect={tapSortSelect}
      setTapSortSelect={setTapSortSelect}
    />
  );

  /** 選択式の現在の選択内容を「表示専用チップ」用の文字列にする。 */
  const describeChoiceAnswer = (sq: any): string => {
    return answers[sq.id] || '';
  };

  const questions = mode === 'mini_test' ? chapter.miniTest : (chapter.practiceProblems || []);

  // 章内の図版へ通し番号（図1・図2 …）を割り当てるためのマップ。
  const figureNumberMap = useMemo(() => buildFigureNumberMap(questions), [questions]);

  /**
   * 今回解く範囲（両端を含む）。
   *
   * ■ 設計の要点：`questions` は章の全問のまま据え置く
   *   `currentQuestionIndex` は「章の中の通し番号」であり、
   *     ・localStorage の `quiz_idx_*`
   *     ・解説画面へ渡す singleQuestionIndex
   *     ・図版の通し番号（図1・図2…）
   *   がすべてこの番号を前提にしている。
   *   ここで配列そのものを切り出すと番号の意味がズレて、
   *   「解説に別の問題が出る」「図番号が飛ぶ」といった不具合になる。
   *   そこで配列は切らず、「どこからどこまでを1回とみなすか」だけを持つ。
   *
   * ■ 値の丸め方
   *   データ追加・削除で範囲が配列の外を指しても落ちないよう、
   *   必ず 0〜(最終問) に収める。範囲指定が無ければ章の全問が範囲。
   */
  const lastIndex = Math.max(0, questions.length - 1);
  const rangeStart = questionRange
    ? Math.min(Math.max(0, questionRange.startIndex), lastIndex)
    : 0;
  const rangeEnd = questionRange
    ? Math.min(Math.max(rangeStart, questionRange.endIndex), lastIndex)
    : lastIndex;
  /** 範囲内の問題数（進捗ピルの分母） */
  const rangeCount = rangeEnd - rangeStart + 1;
  /** 範囲内での現在位置（1始まり・進捗ピルの分子） */
  const rangePosition = Math.min(
    rangeCount,
    Math.max(1, currentQuestionIndex - rangeStart + 1),
  );

  if (questions.length === 0) {
    return (
      <div className="w-full bg-white rounded-2xl shadow-xl p-6 md:p-12 border border-gray-100 text-center relative">
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 md:top-6 md:left-6 flex items-center gap-2 text-gray-500 hover:text-[#2C3E50] transition-colors font-bold bg-gray-50 px-4 py-2 rounded-full shadow-sm"
        >
          <ArrowLeft size={20} />
          <span>戻る</span>
        </button>
        <h2 className="text-xl md:text-2xl font-modern font-bold text-gray-800 mb-4 mt-12 md:mt-8">
          {chapter.abstractTitle}
        </h2>
        <p className="text-sm md:text-base text-gray-500 font-modern mb-8">
          この単元の問題はまだ追加されていません。
        </p>
        <button
          onClick={onBack}
          className="bg-[#1B2631] text-white px-6 py-3 rounded-xl font-bold w-full sm:w-auto"
        >
          単元選択に戻る
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  // ────────────────────────────────────────────────────────────────
  // リスニング：1画面＝1問（ご要望「問1で1つの進捗、問2で1つの進捗」）
  // ────────────────────────────────────────────────────────────────
  //
  // `perStep` が true のときは、大問（回）の中の小問を1問ずつ見せる。
  // 化学など音源を持たない問題は false になり、これまでどおり
  // 大問まるごと1画面（(1)〜(4)を並べて表示）のまま。
  const perStep = isPerSubQuestionListening(currentQuestion);
  const listeningSteps = perStep ? buildListeningSteps(currentQuestion) : [];
  /** 範囲外を指さないよう丸めた、いま表示している問の位置 */
  const safeStepIndex = perStep
    ? Math.min(Math.max(0, stepIndex), Math.max(0, listeningSteps.length - 1))
    : 0;
  /**
   * いま表示しているステップの小問一覧（1問ずつモードのときだけ中身が入る）。
   *
   * 第1〜3問は常に1つ。第4問以降は「音声1本に複数の解答欄」なので
   * 2〜5つになる（例：問18〜21）。ステップの位置（index）ではなく
   * ステップが持つ subQuestionIds から引く。以前の「subQuestions[safeStepIndex]」は
   * ステップ数＝小問数のときしか成り立たなかった。
   */
  const activeStepSubs: any[] = perStep
    ? stepSubQuestions(currentQuestion, listeningSteps[safeStepIndex])
    : [];
  /** いま表示している小問（先頭）。音源・採点キー・解説の絞り込みはこれをキーにする */
  const activeStepSub = perStep ? (activeStepSubs[0] ?? null) : null;
  /** この回の最後の問まで来たか */
  const isLastStep = !perStep || safeStepIndex >= listeningSteps.length - 1;

  /**
   * 進捗ピルの分子・分母。
   *
   * ・1問ずつモード（リスニング）… その回の中の「問」を数える（例 2/4）
   * ・従来モード（化学など）      … 範囲内の「大問」を数える（例 3/14）
   *
   * 回をまたぐ通し番号にはしていない。1回＝4問と短いので、
   * 「この回のどこまで来たか」が分かるほうが達成感につながる。
   */
  const progressTotal = perStep ? listeningSteps.length : rangeCount;
  const progressPosition = perStep ? safeStepIndex + 1 : rangePosition;

  /**
   * 「前へ」を押せるか。
   *
   * 1問ずつモードでは、回の先頭（問1）にいても
   * まだ前の回が範囲内にあるなら戻れる。逆に範囲の先頭の問1では
   * 戻る先が無いのでボタンを無効にする（押しても何も起きないボタンを
   * 押せる状態にしておくと、壊れているように見えるため）。
   */
  const canGoPrevious = showingExplanation
    ? true
    : (perStep && safeStepIndex > 0) || currentQuestionIndex > rangeStart;

  // 「最後の問題か」＝範囲の終わりに来たか。
  // 章の最終問ではなく範囲の終わりで判定することで、
  // 1回分（例：第3回演習）を解き終えた時点でちゃんと結果画面へ進める。
  // 1問ずつモードでは「範囲の最後の回」かつ「その回の最後の問」で完了とする。
  const isLastQuestion = currentQuestionIndex >= rangeEnd && isLastStep;

  // visualViewport の resize ハンドラ（マウント時登録・依存なし）から
  // 最新の currentQuestion を参照するための ref。
  const currentQuestionRef = useRef<any>(currentQuestion);
  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
  }, [currentQuestion]);

  // この問題の制限時間を計算（メモ化）
  const questionTimeLimit = useMemo(() => {
    if (!currentQuestion) return 60;
    // 問題側で明示された制限時間（リスニング第4問以降：音声長＋解答時間）を優先
    const explicit = Number((currentQuestion as any).timeLimitSec);
    if (Number.isFinite(explicit) && explicit > 0) return Math.round(explicit);
    return calcQuestionTimeLimit(currentQuestion.subQuestions || []);
  }, [currentQuestion]);

  // ────────────────────────────────────────────────────────────────
  // 設問から作る「表示用の派生値」は hooks/useQuestionDerived.ts へ
  // ────────────────────────────────────────────────────────────────
  // ここに 308 行ぶんの useMemo（17個）が並んでいた。すべて
  // currentQuestion から表示に必要な値を計算するだけで、state も
  // 副作用も持っていなかったので、まとめてフックへ移した。
  //
  // ★この呼び出し位置は動かさないこと★
  // React はフックを「呼ばれた順番」で対応付ける。元の 17 個が
  // あった場所でそのまま1回呼んでいるので、全体の呼び出し順は
  // 切り出す前と完全に同じになっている。上下に動かすと順番が
  // 変わって、別の問題の状態を読み違える形で静かに壊れる。
  const {
    mobileAnswerSubs,
    safeMobileAnsIdx,
    renderedAnswerGroups,
    questionNeedsMathPalette,
    isEnglishProse,
    combinedHighlights,
    inlineQuestionRows,
    hideRedundantSubQuestionList,
    inputNavSubs,
    listeningTracks,
    hasTrackFor,
    listeningOptionTexts,
    listeningUnified,
    listeningMobileSplit,
    listeningMobileNoFigure,
    listeningMaterialsMobile,
  } = useQuestionDerived({
    currentQuestion,
    perStep,
    activeStepSub,
    activeStepSubs,
    focusedSubId,
    highlights,
    isDesktop,
    isProblemExpanded,
    isProblemCollapsed,
    keyboardVisible,
    mobileAnsIdx,
  });

  // ────────────────────────────────────────────────────────────────
  // リスニング：回のはじまりに「問題の説明ページ」を出す
  // ────────────────────────────────────────────────────────────────
  // ご要望：「これらの問題の説明は第1回演習とかのボタンを押した後に、
  //          問題を出すまえに問題の説明のページを作ってそこに書いて欲しい。
  //          例) 第1回演習のボタンを押す→問題の説明のページを出す
  //              →問1のページに行く→問1の解説のページに行く」
  // Quiz は回（演習）を選ぶたびにマウントされるので、マウント時に
  // リスニングの回であれば説明ページから始める。化学などは従来どおり。
  useEffect(() => {
    if (listeningTracks.length > 0) setShowingBriefing(true);
    // 回のマウント時のみ（問の移動では再表示しない）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 現在フォーカス中の設問オブジェクト（全形式対象）。
  const focusedSub = useMemo(() => {
    if (!focusedSubId) return null;
    return inputNavSubs.find((sq: any) => sq.id === focusedSubId) || null;
  }, [focusedSubId, inputNavSubs]);

  // inputNavSubs 内での現在フォーカスのインデックス（前へ/次へ判定用）。
  const focusedIndex = useMemo(() => {
    if (!focusedSubId) return -1;
    return inputNavSubs.findIndex((sq: any) => sq.id === focusedSubId);
  }, [focusedSubId, inputNavSubs]);

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
  const isLastNavSub = (sq: any) => {
    const idx = inputNavSubs.findIndex((s: any) => s.id === sq.id);
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
  const handleMobileCardKeyDown = (sq: any) => (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key !== 'Enter') return;
    if (sq.type === 'descriptive') return; // 記述は改行を許可
    e.preventDefault();
    const idx = inputNavSubs.findIndex((s: any) => s.id === sq.id);
    if (idx >= 0 && idx < inputNavSubs.length - 1) {
      moveFocus(1);
    } else {
      (e.currentTarget as HTMLElement).blur();
      setFocusedSubId(null);
    }
  };

  /**
   * 現在の問題を採点して run state を更新する。
   * 解説画面に入る瞬間 = 解答提出の瞬間 として扱う。
   * 同じ問題を2度採点しないよう lastScoredQuestionRef でガード。
   */
  // ────────────────────────────────────────────────────────────────
  // 採点処理の本体は utils/quizScoring.ts へ
  // ────────────────────────────────────────────────────────────────
  // ここに 137 行の採点コードが並んでいた。フックを1つも含まない
  // ただの関数だったので（実測：フック呼び出し0件）、切り出しても
  // フックの呼び出し順には影響しない。
  //
  // 呼び出し方は切り出す前とまったく同じ（scoreCurrentQuestionIfNeeded()）。
  const scoreCurrentQuestionIfNeeded = createScoreCurrentQuestion({
    currentQuestion, perStep, activeStepSub, activeStepSubs,
    run, setRun, lastScoredQuestionRef, timeUsedRef,
    answers, questionTimeLimit, chapter, mode, isGuest,
    currentQuestionIndex, onScored,
  });

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
      const currentQuestion = questions[currentQuestionIndex];
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

  // C6: キーボードで問題を送り/戻しできるようにする（→ / ←）。
  // 入力欄（input/textarea/contenteditable）にフォーカス中や修飾キー併用時は
  // テキスト編集・ショートカットを妨げないよう無効化する。
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName?.toLowerCase();
      const isEditable =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        (el?.isContentEditable ?? false);
      if (isEditable) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // handleNext/handlePrevious は毎レンダー再生成されるため依存に含める。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showingExplanation, currentQuestionIndex, answers]);

  /**
   * クイズから離脱（単元選択に戻る）するときのハンドラ。
   * 解説表示中でない＝まだ採点していない現在の問題に入力された回答は、
   * 離脱時にリセットして「離れた問題の回答の使い回し」による不正得点を防ぐ。
   */
  const handleExit = () => {
    if (!showingExplanation) {
      clearAnswersForQuestionIfUnscored(currentQuestionIndex);
    }
    onBack();
  };

  // ────────────────────────────────────────────────────────────────
  // 解答解説の画面の JSX は components/ExplanationScreen.tsx へ
  // ────────────────────────────────────────────────────────────────
  // ここに 50 行の JSX が並んでいた。フックを1つも含まない
  // ただの JSX だったので（実測：フック呼び出し0件）、
  // 切り出してもフックの呼び出し順には影響しない。
  // 2026-10-02 夜：一度入れた別カード（StepExplanation）はやめ、元の
  // 「問題は固定・選択肢の場所に正誤＋スクリプト＋解説」を1画面で見せる形に戻した（ご指摘）。
  if (showingExplanation) {
    return (
      <ExplanationScreen
        onReturnToBattle={onReturnToBattle}
        mode={mode}
        chapter={chapter}
        answers={answers}
        isGuest={isGuest}
        currentQuestion={currentQuestion}
        currentQuestionIndex={currentQuestionIndex}
        perStep={perStep}
        activeStepSub={activeStepSub}
        run={run}
        isLastQuestion={isLastQuestion}
        isMobileForExplanation={isMobileForExplanation}
        handleNext={handleNext}
        onBackFromExplanation={() => {
          setShowingExplanation(false);
          if (onExplanationChange) onExplanationChange(false);
        }}
        scoreAnimationData={scoreAnimationData}
        showScoreAnimation={showScoreAnimation}
      />
    );
  }

  /*
    リスニング：問題の説明ページ（ブリーフィング）
    ─────────────────────────────────────────────
    ご要望：「これらの問題の説明は第1回演習とかのボタンを押した後に、
             問題を出すまえに問題の説明のページを作ってそこに書いて欲しい。
             例) 第1回演習のボタンを押す→問題の説明のページを出す
                 →問1のページに行く→問1の解説のページに行く」

    回を選んだ直後に1枚だけ表示する。ここに
      ・回のタイトル（第1回　第1問 A（4問・2回読み） など）
      ・「短い英文が2回読まれます。…①〜④のうちから1つ選びなさい」の説明
      ・難易度
    をまとめ、解答中の画面からはこれらを撤去する。
    そのぶん解答画面は「問題＋選択肢が1画面に収まる」表示になる。
  */
  // ────────────────────────────────────────────────────────────────
  // リスニングの「問題の説明ページ」の JSX は components/ListeningBriefing.tsx へ
  // ────────────────────────────────────────────────────────────────
  // ここに 64 行の JSX が並んでいた。フックを1つも含まない
  // ただの JSX だったので（実測：フック呼び出し0件）、
  // 切り出してもフックの呼び出し順には影響しない。
  if (showingBriefing && listeningUnified && currentQuestion) {
    return (
      <ListeningBriefing
        onReturnToBattle={onReturnToBattle}
        currentQuestion={currentQuestion}
        chapterAbstractTitle={chapter.abstractTitle}
        mode={mode}
        handleExit={handleExit}
        onStart={() => setShowingBriefing(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 w-full flex flex-col bg-gray-50 overflow-hidden z-40">
      {onReturnToBattle && <button type="button" onClick={onReturnToBattle} className="min-h-11 shrink-0 border-b border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-900">バトル結果・解説に戻る</button>}
      
      {/* ヘッダー帯（単元名・スコア・順位・進捗）の JSX は
          components/QuizHeader.tsx へ切り出した。
          「入力中だけ隠す」条件もあちらが持っている（PC には掛からない）。 */}
      <QuizHeader
        chapterAbstractTitle={chapter.abstractTitle}
        mode={mode}
        isDesktop={isDesktop}
        keyboardVisible={keyboardVisible}
        handleExit={handleExit}
        run={run}
        progressPosition={progressPosition}
        progressTotal={progressTotal}
        topics={Array.isArray(chapter.topics) ? chapter.topics : []}
      />


      {/* タイマーバー（ヘッダー直下、問題本文の上） ー 控えめな細いバー
          ★B-3：入力中は隠す（3%）★
            計測は running のまま続くので、隠しても時間の進みは変わらない。
            表示だけを止めている（＝止めたら不正になる、を避ける）。 */}
      <div className={`flex-none bg-white border-b border-gray-100 ${
        !isDesktop && keyboardVisible ? 'hidden' : ''
      }`}>
        <QuizTimerBar
          timeLimit={questionTimeLimit}
          running={!showingExplanation}
          onTick={(e) => { timeUsedRef.current = e; }}
          resetKey={`${chapter.id}_${currentQuestionIndex}`}
        />
      </div>

      {/* Score Animation Overlay（演習では出さない：2026-10-02 D2） */}
      {false && scoreAnimationData && (
        <FloatingScoreAnimation
          breakdown={scoreAnimationData.breakdown}
          totalScore={scoreAnimationData.totalScore}
          isVisible={showScoreAnimation}
        />
      )}

      {/* Main Content Area (Split on Desktop, Stacked on Mobile)

          ★スマホは全教科とも「問題文が上・解答が下」に統一する（ご要望）
          ------------------------------------------------------------------
          ご指摘：
            「問題文と解答入力を逆にして。(リスニングの話)
              選択肢を見せるということに気が取られて問題が見えない
              スクロールがしにくい　図も見えない。」

          以前はリスニングだけ上下反転（col-reverse）で解答ペインを上に
          出していたが、問題文が「下からせり出すカード」になってしまい
          ・問題文・図が見えない
          ・下のカードの中をスクロールする操作が難しい
          という本末転倒な状態だった。
          そこで自然な読み順（上＝問題 → 下＝解答）へ戻す。
          「問題と選択肢を同時に見る」は、リスニング時の問題ペインの
          高さ上限（下記 max-h-[40vh]）と再生ボタンのスリム化で満たす。
          PC は従来どおり「問題＝左 / 解答＝右」。 */}
      <div className={`flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden relative ${listeningMaterialsMobile ? 'pb-[calc(4.75rem+env(safe-area-inset-bottom))]' : ''}`}>

        {/*
          Section 1: 問題文ペイン（左 58% ／スマホでは上）
          実体は components/ProblemPane.tsx に切り出した。
          高さの取り合い（listeningMobileSplit）や max-h の根拠コメントも
          そちらに一緒に移してある。
        */}
        <ProblemPane
          currentQuestion={currentQuestion}
          currentQuestionIndex={currentQuestionIndex}
          isDesktop={isDesktop}
          isProblemExpanded={isProblemExpanded}
          setIsProblemExpanded={setIsProblemExpanded}
          isProblemCollapsed={isProblemCollapsed}
          setIsProblemCollapsed={setIsProblemCollapsed}
          keyboardVisible={keyboardVisible}
          listeningUnified={listeningUnified}
          listeningMobileSplit={listeningMobileSplit}
          listeningMobileNoFigure={listeningMobileNoFigure}
          listeningMaterialsMobile={listeningMaterialsMobile}
          listeningSteps={listeningSteps}
          safeStepIndex={safeStepIndex}
          activeStepSub={activeStepSub}
          selectedAnswerSub={mobileAnswerSubs[safeMobileAnsIdx]?.sq}
          listeningTracks={listeningTracks}
          hasTrackFor={hasTrackFor}
          isEnglishProse={isEnglishProse}
          questionNeedsMathPalette={questionNeedsMathPalette}
          figureNumberMap={figureNumberMap}
          combinedHighlights={combinedHighlights}
          highlights={highlights}
          setHighlights={setHighlights}
          handleTextSelection={handleTextSelection}
          inlineQuestionRows={inlineQuestionRows}
          hideRedundantSubQuestionList={hideRedundantSubQuestionList}
          problemScrollRef={problemScrollRef}
        />

        {/* 解答ペイン（右42%／スマホ下）の JSX は components/AnswerPane.tsx へ切り出した。
            渡しているのは「状態」と「判定」だけで、見た目はあちらが持っている。 */}
        <AnswerPane
          currentQuestion={currentQuestion}
          isDesktop={isDesktop}
          answers={answers}
          handleTextChange={handleTextChange}
          getInputRef={getInputRef}
          inputRefs={inputRefs}
          listeningUnified={listeningUnified}
          listeningMobileSplit={listeningMobileSplit}
          listeningMobileNoFigure={listeningMobileNoFigure}
          listeningMaterialsMobile={listeningMaterialsMobile}
          focusedSubId={focusedSubId}
          setFocusedSubId={setFocusedSubId}
          mobileAnswerSubs={mobileAnswerSubs}
          safeMobileAnsIdx={safeMobileAnsIdx}
          goMobileAns={goMobileAns}
          handleMobileCardKeyDown={handleMobileCardKeyDown}
          isLastNavSub={isLastNavSub}
          renderedAnswerGroups={renderedAnswerGroups}
          renderMultipleChoiceControl={renderMultipleChoiceControl}
          mobileChoiceSub={mobileChoiceSub}
          renderSortingControl={renderSortingControl}
          questionNeedsMathPalette={questionNeedsMathPalette}
          isProblemExpanded={isProblemExpanded}
          canGoPrevious={canGoPrevious}
          handlePrevious={handlePrevious}
          handleNext={handleNext}
        />
      </div>

      {/* スマホの下部固定バー2本（ナビ／入力）の JSX は
          components/MobileFloatingBar.tsx へ切り出した。
          「(ア) 前へ 1/9 次へ 完了」バーは必要と明言されたもの。消さないこと。 */}
      <MobileFloatingBar
        currentQuestion={currentQuestion}
        isDesktop={isDesktop}
        isProblemExpanded={isProblemExpanded}
        keyboardVisible={keyboardVisible}
        keyboardOffset={keyboardOffset}
        focusedSub={focusedSub}
        focusedSubId={focusedSubId}
        setFocusedSubId={setFocusedSubId}
        inputNavSubs={inputNavSubs}
        focusedIndex={focusedIndex}
        moveFocus={moveFocus}
        inputRefs={inputRefs}
        questionNeedsMathPalette={questionNeedsMathPalette}
        canGoPrevious={canGoPrevious}
        handlePrevious={handlePrevious}
        handleNext={handleNext}
      />
    </div>
  );
}
