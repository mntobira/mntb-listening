import './step-explanation.css';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, BookOpen, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { auth } from '../firebase';

import type { ReviewNav } from './explanation/types';
import { ExtrasSection } from './explanation/ExtrasSection';
import { ReasonBox } from './explanation/ReasonBox';
import { MobileAnswerNav, ReviewBottomBar } from './explanation/BottomBars';


import { ResultScoreCard, ResultStage, ResultSummaryActions, WeakAreasPanel, ResultPager } from './explanation/ResultSummary';
import { renderExplanationAnswerItem } from './explanation/ExplanationAnswerItem';
import { ExplanationHeader } from './explanation/ExplanationHeader';
import { ProblemStatement } from './explanation/ProblemStatement';


import { ReviewTopNav } from './explanation/ReviewTopNav';

import { CompactWeakAreas } from './explanation/CompactWeakAreas';
import { computeQuestionScore, computeWeakAreas, buildResultPages, scopeQuestionsToFocus } from './explanation/explanationLogic';
// 画面に依存しない小さな関数（isAttempted / textTracksOf / formatResultTime / pictureCellOf）
import { isAttempted, textTracksOf } from './explanation/helpers';
import './listening-explanation.css';
import { buildFigureNumberMap } from '../utils/figureNumbering';
import { isAnswerCorrect } from '../utils/answerJudge';
import {
} from '../utils/explanationFormat';

import { useIsMobile } from '../hooks/useMediaQuery';
import { applyOverviewViewport } from '../utils/viewportControl';

interface ExplanationProps {
  mode: 'mini_test' | 'practice';
  chapter: Chapter;
  answers: Record<string, string>;
  onBack: () => void;
  onReturnToBattle?: () => void;
  isGuest: boolean;
  singleQuestionIndex?: number;
  onNextQuestion?: () => void;
  isLastQuestion?: boolean;
  isMobileView?: boolean;
  totalScore?: number;
  resultTotalScore?: number;
  resultTotalCorrect?: number;
  resultTotalJudgeable?: number;
  resultTotalTimeSec?: number;
  /**
   * 結果画面の「次にすること」。
   *   onRetryWrong … 間違えた小問だけを解き直す（大問ごとに間違えた小問の id を渡す）
   *   onNextChapter … 同じ科目の次の単元へ進む（全問正解のときの主操作）
   * 以前は結果画面の出口が「単元選択に戻る」だけで、
   * 復習するには一覧で同じ単元を探し直す必要があった。
   */
  onRetryWrong?: (targets: ReviewTargetItem[]) => void;
  onNextChapter?: () => void;
  nextChapterTitle?: string;
  /**
   * 結果画面で振り返る範囲（両端を含む・章内の通し番号）。
   *
   * ■ 何のために足したのか（ご要望）
   *   英語リスニングは「第1問A のページ → 第1回演習〜第14回演習」の形にしたので、
   *   1回分だけを解いて結果画面に来ることがある。
   *   そのとき章の14回分すべてが結果に並ぶと、解いていない回まで
   *   「答え合わせ」に出てきてしまい、自分がどこまでやったのか分からない。
   *   そこで「今回解いた範囲だけ」を振り返れるようにする。
   *
   *   省略時は章の全問を振り返る。
   */
  questionRange?: { startIndex: number; endIndex: number } | null;
  /**
   * 「いま解いた1問（小問）」のID。
   *
   * ■ 何のために足したのか（ご要望）
   *   「問1で1つの進捗、問2で1つの進捗みたいな感じにしてほしい。だから解説も修正な」
   *
   *   リスニングは1画面＝1問（問1だけ／問2だけ）にしたので、
   *   その直後の解説にも問1〜問4の答えが全部並んでいると、
   *   まだ解いていない問2以降の正解まで見えてしまい、
   *   進捗を1問ずつに分けた意味が無くなる。
   *   このIDが渡されたときは、その小問だけを
   *   ・設問一覧
   *   ・音源（復習用スクリプト）
   *   ・採点結果／解説アコーディオン
   *   に絞り込む。
   *
   *   省略時は大問まるごとの解説。
   */
  focusSubQuestionId?: string | null;
  /** 結果の「詳しい結果」画面の下に置く「ホームに戻る」 */
  onHome?: () => void;
  /** 結果の「詳しい結果」から開いたとき：上に問題の切り替え、下に「ホーム／単元選択／間違えた問題」を出す */
  reviewNav?: ReviewNav;
}

import { saveQuestionNote } from '../utils/questionNote';
import { useGrowthProgress } from '../hooks/useGrowthProgress';
import { logRejection } from '../utils/reportError';
import { notify } from '../utils/dialog';
import type { ReviewTargetItem } from '../utils/reviewFocus';
import type { Chapter, Problem, SubQuestion } from '../types/curriculum';



export function Explanation({ mode: initialMode, chapter, answers, onBack, onReturnToBattle, isGuest, singleQuestionIndex, onNextQuestion, isLastQuestion, isMobileView, totalScore, resultTotalScore, resultTotalCorrect, resultTotalJudgeable, resultTotalTimeSec, questionRange, onRetryWrong, onNextChapter, nextChapterTitle, focusSubQuestionId, onHome, reviewNav }: ExplanationProps) {
  const isPracticeMode = initialMode === 'practice';
  const { progress: growth } = useGrowthProgress();

  const [openExplanationBySq, setOpenExplanationBySq] = useState<Record<string, boolean>>({});
  const [openThinkingBySq, setOpenThinkingBySq] = useState<Record<string, boolean>>({});
  const [savingNote, setSavingNote] = useState<Record<string, boolean>>({});
  // スマホ/PC判定は共有フックに一元化（md=768px 未満をスマホとみなす）。
  // isMobileView が渡された場合（スマホプレビュー枠）はそれを優先する。
  const isMobile = useIsMobile(isMobileView);

  // ─── スマホ専用（1問ごとの答え合わせ）の表示状態 ───
  // ご要望：「全ての問いのあってるか間違ってるかだけ出して、その正誤ボタンを
  //          押したらその問の解答と解説が出るようにしてほしい。
  //          問題文は上・解答は下（演習画面と同じ2画面）。PC版は変えない。」
  /** 正誤一覧でいま選ばれている小問ID（null＝未選択。既定は最初の不正解） */
  const [selectedSqId, setSelectedSqId] = useState<string | null>(null);
  /** スマホ：問題文ペインを見出しだけにたたむ（演習画面と同じ操作感） */
  const [mobileProblemCollapsed, setMobileProblemCollapsed] = useState(false);


  const allQuestions: Problem[] = initialMode === 'mini_test' ? chapter.miniTest : (chapter.practiceProblems || []);
  /**
   * 結果画面で並べる範囲の先頭（章内の通し番号）。
   * 1回分だけを解いたときに、その回だけを振り返れるようにするためのもの。
   * 範囲指定が無ければ 0（＝章の先頭から全部）で従来と同じ。
   */
  const rangeOffset = useMemo(() => {
    if (!questionRange) return 0;
    const last = Math.max(0, allQuestions.length - 1);
    return Math.min(Math.max(0, questionRange.startIndex), last);
  }, [questionRange, allQuestions.length]);

  // ★結果画面のページ送り（2026-10-04）★ 対戦の「詳しい結果」と同じく、解いた問題を矢印・番号で1問ずつ切り替える。
  //   スクロールで全問を縦に並べない。中身の描き方（一人で学ぶの解説）はそのまま使い、表示する1問を絞るだけ。
  const [resultPage, setResultPage] = useState(0);
  /** 演習の結果は2画面：'summary'＝結果（1画面）→「詳しい結果を確認する」→ 'detail'＝矢印で1問ずつ答え合わせ（対戦と同じ流れ） */
  const [resultStep, setResultStep] = useState<'summary' | 'detail'>('summary');
  // 一人で学ぶでもらったマナコイン・XP（この単元を開いてからの合計）。ゲストはもらえないので案内だけ
  const [studyReward, setStudyReward] = useState<{ coins: number; xp: number; count: number } | null>(null);
  useEffect(() => {
    if (singleQuestionIndex !== undefined) return;
    let off = () => {};
    let alive = true;
    void import('../battle/data/growthStore').then(({ currentStudySession, subscribeStudySession }) => {
      if (!alive) return;
      setStudyReward(currentStudySession());
      off = subscribeStudySession(setStudyReward);
    }).catch(logRejection('growth.subscribeStudySession'));
    return () => { alive = false; off(); };
  }, [singleQuestionIndex]);
  const baseQuestions = useMemo(() => {
    if (singleQuestionIndex !== undefined) return [allQuestions[singleQuestionIndex]];
    if (!questionRange) return allQuestions;
    const last = Math.max(0, allQuestions.length - 1);
    const end = Math.min(Math.max(rangeOffset, questionRange.endIndex), last);
    return allQuestions.slice(rangeOffset, end + 1);
  }, [allQuestions, singleQuestionIndex, questionRange, rangeOffset]);
  /** ページ送りの1件＝小問1つ（音源1本に複数の小問がある第4問以降は、その音源の先頭の小問だけ） */
  const resultPages = useMemo(() => {
    return buildResultPages(baseQuestions, singleQuestionIndex);
  }, [baseQuestions, singleQuestionIndex]);
  const pagerOn = resultPages.length > 1;
  const pageState = (pg: { sq: SubQuestion }) => { const v = answers[pg.sq?.id]; return !isAttempted(v) ? 'skip' : isAnswerCorrect(pg.sq, v) ? 'ok' : 'ng'; };
  const firstWrongPage = resultPages.findIndex((pg) => pageState(pg) === 'ng');
  const wrongCount = resultPages.filter((pg) => pageState(pg) === 'ng').length;
  const safeResultPage = Math.min(resultPage, Math.max(0, resultPages.length - 1));
  const effectiveFocusId: string | null = focusSubQuestionId
    ?? (pagerOn ? String(resultPages[safeResultPage]?.sq?.id ?? '') || null : null);

  const questions = useMemo(() => {
    const focusSubQuestionId = effectiveFocusId;
    const picked = (() => {
      if (singleQuestionIndex !== undefined) return [allQuestions[singleQuestionIndex]];
      if (!questionRange) return allQuestions;
      const last = Math.max(0, allQuestions.length - 1);
      const end = Math.min(Math.max(rangeOffset, questionRange.endIndex), last);
      return allQuestions.slice(rangeOffset, end + 1);
    })();

    /*
      ご要望「問1で1つの進捗、問2で1つの進捗…だから解説も修正な」への対応。
      ─────────────────────────────────────────────────────────
      focusSubQuestionId が指定されているときは、
      「いま解いた1問」だけを持つ大問オブジェクトに差し替える。
      subQuestions を絞るだけなので、解説本文・音源・図など
      他のフィールドは元のまま。解説の描画コードは全て
      question.subQuestions を辿るので、ここ1か所で
        ・設問一覧
        ・採点結果（正解 n / 不正解 n）
        ・小問アコーディオン
        ・復習用の音源リスト
      がすべて「その問だけ」に揃う。
      該当IDが無い場合は絞り込まない（安全側に倒す）。
    */
    // 絞り込みの本体は explanation/explanationLogic.ts（元のコードのまま）
    return scopeQuestionsToFocus(picked, focusSubQuestionId);
  }, [allQuestions, singleQuestionIndex, questionRange, rangeOffset, effectiveFocusId]);


  /**
   * ★ご要望8「解説と問題のフォントが違うところがあるのでそれを直したい」★
   *
   * ■ 実測でわかった本当の原因（推測ではなく Playwright の computed style）
   *   スマホ 390x664 / 数学 m1_1[0] の解説画面で
   *     問題文 : font-size 16.95px  line-height 34.75px
   *     解説   : font-size 18.08px  line-height 37.06px
   *   と 1px 強ずれていた。数式（分数・√）は文字サイズで見た目が大きく変わるので、
   *   同じ問題の問題文と解説で分数の高さが違って見えていた。
   *
   *   ずれの発生源は .math-content（src/index.css）である。
   *     .math-content { font-size: 1.13em; line-height: 2.05; }
   *   これは @layer に入っていない素の CSS なので、Tailwind の
   *   `text-sm`（@layer utilities）より詳細度で勝ってしまう。
   *   つまり解説側に書いてあった `text-sm md:text-base` は無効で、
   *   実際のサイズは常に「親の font-size × 1.13」になる。
   *     ・問題文  … 親ペインが text-[15px] → 15 × 1.13 = 16.95px
   *     ・解説    … 親が既定の 16px        → 16 × 1.13 = 18.08px
   *   同じクラスを書いていたのに親が違ったせいでずれていた、というのが真相。
   *
   * ■ 直し方
   *   .math-content が「親の em」で決まる以上、同じ要素に text-[15px] を
   *   足しても効かない（実測済み：足しても 18.08px のまま）。
   *   なので *親* の基準サイズをそろえる。
   *   問題文が 15px 基準なのは親ペインに text-[15px] があるからなので、
   *   解説本文も「.math-content が付いた要素の親」を 15px 基準にする。
   *   ＝ MOBILE_BODY_BASE を包む側に置き、
   *     MOBILE_BODY_FONT（文字サイズ指定なし）を .math-content 側に置く。
   *   これで数学（1.13em）でも非数学（そのまま継承）でも
   *   問題文と解説がまったく同じ計算式になる。
   *
   * ■ PC は変えない（ご要望「パソコン版は何も変更しないでね」）
   *   reorderMobile（スマホの1問ごと答え合わせ）のときだけ適用し、
   *   PC・結果画面は従来の text-xs md:text-sm / text-sm md:text-base をそのまま使う。
   */
  // 親側に置く基準サイズ（問題文ペインの text-[15px] leading-[1.85] と同一）
  const MOBILE_BODY_BASE = 'text-[15px] leading-[1.85]';
  const DESKTOP_BODY_FONT = 'text-xs md:text-sm leading-relaxed';
  /**
   * ★ご要望「化学基礎・化学含め様々な科目で解答解説と問題のフォントが
   *   あっていないので問題のフォントに合わせて。」★
   *
   * ■ 実測（Playwright の getComputedStyle）
   *   ・390x844 / 英語リスニング 第1問A（前回対応ぶん）
   *       問題画面 … ゴシック（Inter）／解説画面 … 手書き（Yomogi）
   *   ・390x844 / 化学基礎「物質の分離と精製(1. ろ過)」（今回の指摘）
   *       問題画面 … Inter, "Hiragino Sans", "Yu Gothic", sans-serif  16px
   *       解説画面 … Yomogi, "Klee One", …, cursive
   *     ＝まったく同じ問題文が、画面をまたぐと別書体で出ていた。
   *
   * ■ 直し方は「問題画面に合わせる」（ご指示どおりの向き）
   *   問題画面（Quiz.tsx）の本文は、科目に関係なく
   *     questionNeedsMathPalette ? 'font-math math-content' : 'font-modern'
   *   の2択しかない。つまり
   *     数学 → 数式書体 / それ以外 → ゴシック
   *   が「問題のフォント」。解説側もこれと同じ式にする。
   *   以前は英語だけをゴシックへ寄せていたが、
   *   化学・生物でも同じずれが起きていたので、条件そのものを撤去して
   *   「非数学はすべてゴシック」に統一する。
   *
   * ■ 手書き体（Yomogi）は本文から外すが、消しはしない
   *   ロジックツリー・フローチャート・スコア表示など
   *   「図やバッジの装飾」では従来どおり使う。
   *   本文＝問題文と読み比べる文字だけをゴシックにそろえる。
   *
   * ■ PC / スマホで分岐しない
   *   書体のずれは画面幅と無関係（PC でも同じ問題文が別書体で出る）。
   *   ここで reorderMobile を挟むと「PC だけ直らない」不具合が残るので、
   *   端末に依らず同じ式にする。レイアウト（余白・段組み）は一切触っていない。
   *
   * ■ isEnglishChapter は書体判定以外（prose 判定など）で今も使うので残す。
   *   英文の音源（audioTracks）を持つ問題があるかという
   *   問題データそのものの事実で判定する（科目名で分岐しない）。
   */
  const isEnglishChapter = useMemo(() => {
    return allQuestions.some((q) => {
      return textTracksOf(q).length > 0;
    });
  }, [allQuestions]);

  const BODY_FONT_FAMILY = 'font-modern';

  /**
   * 解説カード全体の既定書体（下位はこれを継承する）。
   *
   * ここを変えると、プレーヤーのスクリプト欄のように
   * 「自前で書体を持たない箇所」までまとめてそろう。
   * 実測で分かったとおり、本文の書体は CSS の継承でカード最上位から
   * 降りてくるので、BODY_FONT_FAMILY だけ直しても取りこぼしが出る。
   *
   * 数学は本文側（BODY_FONT_FAMILY）で font-math を当てるので、
   * カード全体はゴシックにしておく
   * （カードごと数式書体にすると見出しやボタンまで変わってしまう）。
   */
  const CARD_FONT_FAMILY = 'font-modern';

  /**
   * 要件①のアコーディオン本体。
   * ・単元につき1回だけ描画する（呼び出し側で最初の大問にのみ差し込む）
   * ・配置は「採点結果」の直後
   * ・初期状態は閉じる（画面を圧迫させず、必要な人だけ開ける）
   */
  /**
   * ★PC版のリスニング解答・解説（2026-10-12 PC大改訂）★
   *   「スクロールをできるだけ減らす」「スマホでは畳んでいたもの（本当は1画面に置きたかったもの）を
   *     PCでは1画面に出す」ためのフラグ。
   *   ・左：音源＋読み方つきスクリプト（従来どおり）
   *   ・右：問題画面と同じ選択肢に正誤（スマホと同じ形）＋解説を最初から開いて表示
   *         画面が広い（1280px〜）ときは右をさらに2列にし、
   *         「大問の流れ・共通ポイント」「この単元の思考の型」「周辺知識・深掘り」を右列に開いて並べる
   *   ・右側にあった2つ目の再生帯は、左の音源と重複するので出さない（UI原則2：同じものを2つ置かない）
   */
  const pcListening = !isMobile && singleQuestionIndex !== undefined && questions.length === 1 && textTracksOf(questions[0]).length > 0;


  // 章内の図版へ通し番号（図1・図2 …）を割り当てるマップ。
  // 単問表示でも通し番号が一貫するよう、章の全問題（allQuestions）を基準に採番する。
  const figureNumberMap = useMemo(() => buildFigureNumberMap(allQuestions), [allQuestions]);


  const baseDisplayScore = totalScore ?? resultTotalScore;
  const displayTotalScore = baseDisplayScore != null ? baseDisplayScore : null;
  const isResultView = singleQuestionIndex === undefined;

  // 【俯瞰UI（width=1024 の縮小表示）はタブレット以上のみ】
  // 以前はスマホでも解答解説を俯瞰UIで表示していたが、
  // 「解答と解説の文字が小さい。問題のところと同じぐらいの大きさにしたい」
  // というご指摘のとおり初期表示が極小になるため、スマホでは適用しない。
  // スマホは通常の device-width viewport のまま、スマホ専用レイアウト
  // （下の reorderMobile 分岐）で表示する。ピンチズームは引き続き可能。
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!isMobile) {
      applyOverviewViewport();
    }
  }, [singleQuestionIndex, chapter.id, isMobile]);

  // スマホの1問ごとの答え合わせ：問題が変わったら表示状態をリセットし、
  // 「最初の不正解の問」を自動で開く（どこを間違えたかへ最短で辿り着く）。
  // 全問正解なら何も開かず、緑一色の正誤一覧で達成感を出す。
  useEffect(() => {
    if (!isMobile || isResultView) return;
    const q: Problem | undefined = questions[0];
    const subs: SubQuestion[] = (q?.subQuestions || []);
    const firstIncorrect = subs.find(
      (sq) => isAttempted(answers[sq.id]) && !isAnswerCorrect(sq, answers[sq.id]),
    );
    setSelectedSqId(firstIncorrect ? firstIncorrect.id : null);
    setMobileProblemCollapsed(false);
    // 問題が替わったときだけ開く問を選び直す（解答や表示状態の更新では選び直さない）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singleQuestionIndex, chapter.id, isMobile]);

  const handleSaveNote = async (question: Problem, index: number) => {
    // 範囲を切り出して表示しているときは、切り出しの先頭ぶんを足して
    // 「章の中での本当の番号」に戻す（ノートに出る Q番号がズレないようにする）。
    const displayIndex = singleQuestionIndex !== undefined ? singleQuestionIndex : rangeOffset + index;
    /*
      ★ゲストもノートを保存できるようにする★
      学習ノート画面（StudyHub）は `notes_guest` を読んでゲストにも
      「マイノート」タブと「解説ページのノートに保存から追加できます」という
      案内を出しているのに、ここで保存を拒んでいたため、
      案内どおりに押しても「使用できません」と言われる行き止まりになっていた。
      復習リスト（review_list_guest）と同じく端末内に保存する。
    */
    setSavingNote(prev => ({ ...prev, [question.id]: true }));
    try {
      saveQuestionNote({
        uid: auth.currentUser?.uid || 'guest',
        question,
        chapter,
        questionIndex: displayIndex + 1,
      });
      
      notify(isGuest
        ? 'ノートに保存しました！（ゲスト利用のため、この端末にだけ保存されます）'
        : 'ノートに保存しました！');
    } catch (error) {
      console.error('保存エラー:', error);
      notify('保存に失敗しました。');
    } finally {
      setSavingNote(prev => ({ ...prev, [question.id]: false }));
    }
  };

  const weakAreas = useMemo(() => {
    return computeWeakAreas(baseQuestions, answers);
  }, [baseQuestions, answers]);

  /**
   * 解き直す対象：間違えた（＝解答したが不正解の）小問を、大問ごとにまとめたもの。
   * 未解答は「間違えた」に数えない（isAttempted と同じ考え方）。
   * 1問ずつの解説（singleQuestionIndex あり）では出さない。
   */
  const wrongTargets = useMemo<ReviewTargetItem[]>(() => {
    if (singleQuestionIndex !== undefined) return [];
    return baseQuestions.flatMap((q) => {
      const ids = (q.subQuestions || [])
        .filter((sq) => isAttempted(answers[sq.id]) && !isAnswerCorrect(sq, answers[sq.id]))
        .map((sq) => String(sq.id));
      return ids.length > 0 ? [{ questionId: String(q.id), subQuestionIds: ids }] : [];
    });
  }, [baseQuestions, answers, singleQuestionIndex]);

  if (questions.length === 0) {
    return (
      <div className="w-full text-center">
        <button onClick={onBack} className="bg-[#1B2631] text-white px-6 py-3 rounded-xl font-bold w-full sm:w-auto">
          戻る
        </button>
      </div>
    );
  }

  const calculateScore = useCallback((question: Problem) => {
    return computeQuestionScore(question, answers);
  }, [answers]);

  // スマホの1問ごとの答え合わせ（!isResultView）だけ、縦積みの上下2ペイン（問題文 → 採点結果）にする。
  const reorderMobile = isMobile && !isResultView;

  // ご要望8のフォント統一：解説本文の className をここ1本に集約する。
  // スマホでは文字サイズを指定しない（＝親の explBodyBaseClass から継承する）。
  // .math-content は 1.13em なので、親をそろえない限り一致しないため。
  // PC・結果画面は従来の指定をそのまま使う（PCの見た目は不変）。
  const explBodyFontClass = `${BODY_FONT_FAMILY} ${reorderMobile ? '' : DESKTOP_BODY_FONT}`;
  // 解説本文を包む側に付ける基準サイズ（PCでは何も足さない）
  const explBodyBaseClass = reorderMobile ? MOBILE_BODY_BASE : '';
  // 「正解 / あなたの解答」欄も同じ数式を出す場所なので同じ基準にそろえる。
  // （問題文の (1) ∫x^4 dx と 正解 x^5/5+C で分数の大きさが変わって見えていた）
  const answerBoxBaseClass = reorderMobile ? MOBILE_BODY_BASE : '';

  // 【スマホの結果画面：スコアと復習推奨エリアを1画面に収める】
  // 以前は「RESULT SCORE カード（＋ランキング＋ご意見）」の後ろに
  // 「分析結果：復習推奨エリア」が大きなカード群で続いていたため、
  // どこが弱点かを見るのにスクロールが必要だった。
  // スマホの結果表示では、スコア行を小さくまとめ、その直下に
  // 復習推奨エリアを1行ずつの薄いバーで並べて同じ画面に収める。
  // 2026-10-04：PCもスマホと同じく「成績・弱点・解き直し」を1枚のカードにまとめる（結果を1画面で見渡す）
  const compactResult = isResultView;

  // スマホ結果画面用：復習推奨エリアのコンパクト表示（1行＝カテゴリ名＋％＋細いバー）
  const compactWeakAreas = compactResult && weakAreas.length > 0 ? <CompactWeakAreas weakAreas={weakAreas} /> : null;

  // ★詳しい結果（2026-10-04 ご指摘）★ 1問ずつの答え合わせと「同じ画面」を使う（問題・スクリプト・解説が1画面に揃う）。
  //   独自のレイアウトを作らず、解いた直後の解答・解説画面をそのまま再利用して UI を一貫させる。
  if (isResultView && resultStep === 'detail' && resultPages.length > 0) {
    const pg = resultPages[safeResultPage];
    const qIdx = rangeOffset + (pg?.qIndex ?? 0);
    return (
      <React.Fragment key={`review-${qIdx}-${pg?.sq?.id}`}><Explanation
        mode={initialMode}
        chapter={chapter}
        answers={answers}
        onBack={onBack}
        isGuest={isGuest}
        singleQuestionIndex={qIdx}
        isMobileView={isMobileView}
        focusSubQuestionId={pg?.sq?.id != null ? String(pg.sq.id) : null}
        reviewNav={{
          pages: resultPages.map((x) => ({ state: pageState(x) })),
          current: safeResultPage,
          onPage: setResultPage,
          onSummary: () => setResultStep('summary'),
          onHome,
          onChapters: onBack,
          onRetryWrong: wrongTargets.length > 0 && onRetryWrong ? () => onRetryWrong(wrongTargets) : undefined,
          retryLabel: '間違えた問題だけ解き直す',
          onNext: onNextChapter,
          nextLabel: nextChapterTitle ? (/^第\d+回$/.test(nextChapterTitle) ? `次の回へ（${nextChapterTitle}）` : `次の単元へ`) : '次へ進む',
        }}
      /></React.Fragment>
    );
  }

  const content = (
    <div
      // C6: 解答後に表示される解説領域をスクリーンリーダーが読み上げられるよう、
      // ライブリージョンとして宣言する。
      role="region"
      aria-live="polite"
      aria-label="解答と解説"
      className={isMobile
      // 【スマホ:自然フィット + 縦スクロール】
      // 画面幅に自然にフィットする通常サイズのレイアウトで表示し、
      // 収まりきらない場合は通常の縦スクロールで閲覧できるようにする。
      // ※ 1問ごとの答え合わせ（!isResultView）でも結果表示（isResultView）でも、
      //   スマホでは同一の「縦スクロール可能」なオーバーレイにする。
      //   iOS Safari では position:fixed + height:100% だとスクロールが効かない
      //   ことがあるため、動的ビューポート高さ(h-dvh)と慣性スクロールを明示する。
      ? `fixed inset-0 w-full h-[100dvh] flex flex-col bg-[#FDFBF7] overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] z-50`
      : isResultView
        ? `fixed inset-0 w-full h-full flex flex-col bg-[#FDFBF7] overflow-y-auto z-50`
        : `fixed inset-0 w-full h-full flex flex-col bg-[#FDFBF7] overflow-hidden z-50`
    }>
      {onReturnToBattle && <button type="button" onClick={onReturnToBattle} className="sticky top-0 z-[55] min-h-11 shrink-0 border-b border-blue-200 bg-blue-50 px-3 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-2 text-sm font-bold text-blue-900">バトル結果・解説に戻る</button>}
      {reviewNav && <ReviewTopNav reviewNav={reviewNav} />}
      <div className={isMobile ? "w-full min-h-full flex flex-col" : (isResultView ? "w-full min-h-full flex flex-col" : reviewNav ? "w-full flex-1 min-h-0 flex flex-col" : "w-full h-full flex flex-col")}>
        {/*
          ★ご要望「解答解説と問題のフォントがあっていないので
            問題のフォントに合わせて」の本体はここ★

          ■ 実測で分かった、書体がずれる本当の原因
            解説カードの最上位に font-handwriting（Yomogi）が付いていて、
            中身は全部それを *継承* していた。
            そのため下位で BODY_FONT_FAMILY を font-modern にしても、
            プレーヤーのスクリプト欄など「自前で書体を持たない箇所」は
            Yomogi のまま残っていた。
            実測：
              英語リスニング … 問題画面 Inter 15px / 解説画面 Yomogi 13px
              化学基礎ろ過   … 問題画面 Inter 16px / 解説画面 Yomogi
            ＝同じ文が画面をまたぐと別書体で出ていた。

          ■ 直し方
            この最上位（CARD_FONT_FAMILY）を font-modern にする。
            継承なので、これ1か所でスクリプト・訳・語句・解説まで
            まとめて問題画面と同じゴシックにそろう。
            以前は英語だけを対象にしていたが、化学・生物でも同じずれが
            起きていたので科目の条件を外した（＝問題画面と同じ規則）。

          ■ 手書き体（Yomogi）自体は消していない
            ロジックツリー・フローチャート・スコア表示などの装飾では
            従来どおり使う。ここで統一するのは
            「問題文と読み比べる本文の書体」だけ。
        */}
        <div className={isMobile 
          ? `w-full flex flex-col ${isResultView || reviewNav ? 'flex-1' : ''} ${CARD_FONT_FAMILY} relative ${
              'bg-white text-gray-800'
            }`
          : `${isResultView ? 'w-full flex-1' : 'w-full h-full'} flex flex-col ${CARD_FONT_FAMILY} relative ${
              'bg-white text-gray-800'
            }`
        }>
      {/* Background effects */}
      

      {/* Header（結果画面ではスクロールしても常に「単元選択に戻る」やスコアが見えるよう上部に固定）
          ★詳しい結果（reviewNav）では出さない：上の切り替えバーが見出しの代わり。
            「答え合わせ / Q1 / 正答率」や上の「単元選択に戻る」は不要（2026-10-04 ご指摘）。 */}
      {!reviewNav && (
      <ExplanationHeader chapter={chapter} questions={questions} singleQuestionIndex={singleQuestionIndex} reorderMobile={reorderMobile} isResultView={isResultView} savingNote={savingNote} handleSaveNote={handleSaveNote} calculateScore={calculateScore} onBack={onBack} onNextQuestion={onNextQuestion} isLastQuestion={isLastQuestion} />
      )}

      {isResultView && displayTotalScore != null && resultStep === 'summary' && (
        <ResultScoreCard
          compactResult={compactResult}
          resultTotalCorrect={resultTotalCorrect}
          resultTotalJudgeable={resultTotalJudgeable}
          resultTotalTimeSec={resultTotalTimeSec}
          growth={growth}
          compactWeakAreas={compactWeakAreas}
          chapter={chapter}
         
          displayTotalScore={displayTotalScore}
        />
      )}

      {/* ★結果のステージ（2026-10-04 ご要望）★ カードと下のボタンの間の空きに、とびらくんと今回もらったマナコインを大きく出す */}
      {isResultView && resultStep === 'summary' && (
        <ResultStage resultTotalJudgeable={resultTotalJudgeable} resultTotalCorrect={resultTotalCorrect} studyReward={studyReward} isGuest={isGuest} />
      )}

      {/* ★結果（1画面目）の下のバー：主操作は「詳しい結果を確認する」1つだけ。親指の届く画面の下に置く★ */}
      {isResultView && resultStep === 'summary' && (
        <ResultSummaryActions
          onOpenDetail={() => { setResultStep('detail'); setResultPage(firstWrongPage >= 0 ? firstWrongPage : 0); }}
          wrongCount={wrongCount}
        />
      )}

      {!(isResultView && resultStep === 'summary') && (
      <div className={isMobile
        ? reorderMobile
          // スマホの1問ごとの答え合わせ：問題文ペインを sticky で上部に
          // 固定するため、外側の余白は付けない（全幅の上下2ペイン）。
          ? `relative z-10 ${'bg-white'}`
          : `p-4 md:p-6 relative z-10 space-y-6 md:space-y-8 ${'bg-white'}`
        : isResultView
          ? `p-4 md:p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] relative z-10 space-y-6 md:space-y-8 ${'bg-white'}`
          : `p-4 md:p-6 relative z-10 flex-1 overflow-hidden flex flex-col ${'bg-white'}`
      }>
      {/* Weak Areas Analysis
          ★ 修正：問題数が多い場合（弱点エリアが多数）に desktop で潜在的にはみ出してスクロールできなかった不具合を解消。
            - ブロック自体は flex-none（縮まない）
            - 見出しは固定し、カードのグリッド部分だけを max-height 付きで縦スクロール可能にする */}
        {/* ★スマホの結果画面（compactResult）では、この大きな復習推奨エリアは
            上のスコアカード内にコンパクト表示へ移したので重複表示しない。 */}
        {singleQuestionIndex === undefined && weakAreas.length > 0 && !compactResult && (
          <WeakAreasPanel weakAreas={weakAreas} isMobile={isMobile} />
        )}

        {/* ★解いた問題のページ送り（2026-10-04）★ 対戦の「1問ずつのけっか」と同じ操作。番号の色で正誤が分かる */}
        {isResultView && resultStep === 'detail' && resultPages.length > 0 && (
          <ResultPager
            resultPages={resultPages}
            safeResultPage={safeResultPage}
            pageState={pageState}
            setResultPage={setResultPage}
            onBackToSummary={() => setResultStep('summary')}
          />
        )}

        {/* Unified Explanation Area
            ★ 修正：結果表示（isResultView）では固定高さ＋overflow-hidden を付けず、
              ページ自体を自然に縦スクロールさせる（PC・スマホともに全問が見えるように）。
              1問ごとの解説表示（!isResultView）のときだけ、2カラムの固定高さレイアウトにする。 */}
        <div className={isMobile
          ? reorderMobile
            // 1問ごとの答え合わせ（スマホ）：問題文ペインを sticky にするため
            // 枠・角丸を付けず全幅で使う。
            ? `${'bg-white'}`
            : `rounded-2xl shadow-lg border ${'bg-white border-gray-200'}`
          : isResultView
            // 結果表示（全問の解答・解説一覧）はページ全体スクロールに任せる。
            // ここで flex-1 / h-full / overflow-hidden を付けると、スコアパネルに圧迫されて
            // 解答・解説エリアが潰れ、スクロールできず内容が見えなくなる不具合が起きていた。
            ? `border-none shadow-none`
            : `border-none shadow-none flex-1 flex flex-col h-full min-h-0 overflow-hidden`
        }>
          <div className={reorderMobile
            // スマホの1問ごとの答え合わせ：
            // 「問題文（上・sticky）→ 正誤一覧＋解説（下）」の上下2ペイン。
            // 演習画面と同じ「上＝問題文 / 下＝解答」の並びで迷わない。
            ? "flex flex-col"
            : isMobile
            ? "grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 sm:p-6 md:p-8"
            : isResultView
              ? "grid grid-cols-1 lg:grid-cols-[minmax(0,1.38fr)_minmax(0,1fr)] gap-6 p-0 items-start"
              : pcListening
                ? "grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.6fr)] gap-6 p-0 h-full flex-1 overflow-hidden"
                : "grid grid-cols-1 lg:grid-cols-[minmax(0,1.38fr)_minmax(0,1fr)] gap-6 p-0 h-full flex-1 overflow-hidden"
          }>
            
            {/* LEFT COLUMN: Problem statements
                結果表示では独自スクロール（lg:h-full/overflow-y-auto）を付けず、
                ページ全体のスクロールに任せる。
                ★スマホの1問ごとの答え合わせ（reorderMobile）では、演習画面と同じ
                  「上＝問題文ペイン」として sticky で画面上部に固定する。
                  下の解説をスクロールしても問題文が常に見える（ご要望
                  「解答と解説・問題は一緒に一画面で見える状態で出したい」）。 */}
            <div className={reorderMobile
              ? `sticky ${reviewNav ? 'top-[calc(57px+env(safe-area-inset-top,0px))]' : 'top-[env(safe-area-inset-top,0px)]'} z-20 min-w-0 bg-white border-b-2 border-gray-200 shadow-md flex flex-col`
              : `space-y-6 pb-8 min-w-0 ${isResultView ? 'lg:pr-4' : 'lg:overflow-y-auto lg:h-full lg:pr-4'}`}>
              {/* スマホ：問題文ペインのヘッダー（演習画面と同じ「たたむ」付き） */}
              {reorderMobile && (
                <div className="lx-problem-head flex items-center justify-between px-3 py-1 border-b border-gray-100 bg-blue-50/30">
                  <span className="font-bold text-[#2C3E50] text-sm flex items-center gap-2">
                    <BookOpen size={15} className="text-[#A9CCE3]" />
                    問題文
                  </span>
                  <button
                    onClick={() => setMobileProblemCollapsed(v => !v)}
                    aria-expanded={!mobileProblemCollapsed}
                    className="flex min-h-[44px] items-center gap-0.5 rounded-md px-2 text-xs font-bold text-gray-600 active:bg-gray-50 whitespace-nowrap"
                  >
                    {mobileProblemCollapsed ? (
                      <>問題文を表示<ChevronDown size={12} /></>
                    ) : (
                      <>たたむ<ChevronUp size={12} /></>
                    )}
                  </button>
                </div>
              )}
              {singleQuestionIndex === undefined && (
                <h3 className={`text-base md:text-lg font-bold mb-4 md:mb-6 flex items-center gap-2 ${'text-emerald-700'}`}>
                  <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
                  <span>答え合わせ</span>
                </h3>
              )}
              
              <div className={reorderMobile
                // 問題文本体：高さ上限つきの独自スクロール。演習画面の問題文と
                // 同じ文字サイズ（15px・行間1.85）で表示する。
                ? `${mobileProblemCollapsed ? 'hidden' : ''} max-h-[34dvh] overflow-y-auto overscroll-contain p-3 text-[15px] leading-[1.85]`
                : "space-y-8 md:space-y-12"}>
              {questions.length > 0 ? (
                questions.map((question, qIndex: number) => {
                const scorePercentage = calculateScore(question);
                return (
                  <ProblemStatement key={question.id} question={question} qIndex={qIndex} scorePercentage={scorePercentage} singleQuestionIndex={singleQuestionIndex} rangeOffset={rangeOffset} pagerOn={pagerOn} resultPages={resultPages} safeResultPage={safeResultPage} savingNote={savingNote} handleSaveNote={handleSaveNote} reorderMobile={reorderMobile} isEnglishChapter={isEnglishChapter} figureNumberMap={figureNumberMap} />
                );
              })
              ) : null}
              </div>
              
            </div>

            {/* RIGHT COLUMN: Answers, grading, and explanations
                （スマホの1問ごとの答え合わせでは問題文ペインの下＝下ペインとして表示） */}
            <div className={`space-y-6 lg:pl-4 lg:pr-4 min-w-0 ${reorderMobile
              // 下部固定ナビ（問題に戻る/次の問題へ）に最後のカードが隠れない
              // よう、下余白を大きめに取る。
              ? 'order-2 px-3 pt-3 pb-[calc(6rem+env(safe-area-inset-bottom))]'
              : 'pb-8'} ${isResultView ? '' : 'lg:overflow-y-auto lg:h-full'}${pcListening ? ' lx-pc-right' : ''}`}>
              {questions.length > 0 ? (
                questions.map((question, qIndex: number) => {
                return (
                  <div key={`right-${question.id}`} className={reorderMobile ? 'space-y-2' : pcListening ? 'space-y-6 lx-pc-flat' : 'space-y-6'}>
                    <div className={reorderMobile ? 'space-y-2' : pcListening ? 'space-y-6 md:space-y-8 lx-pc-flat' : 'space-y-6 md:space-y-8'}>
                      {/* 大問1つぶんの採点結果・解説。中身は explanation/ExplanationAnswerItem.tsx（元の JSX のまま・C-03） */}
                      {renderExplanationAnswerItem({
                        question, answers, allQuestions, reorderMobile, pcListening, focusSubQuestionId,
                        isMobile, isPracticeMode, isEnglishChapter, answerBoxBaseClass, explBodyBaseClass, explBodyFontClass,
                        openExplanationBySq, openThinkingBySq, setOpenExplanationBySq, setOpenThinkingBySq,
                        selectedSqId, setSelectedSqId,
                      })}
                      {/* 塾クラスの生徒だけ：選んだ理由を先生に送る（それ以外は何も描かない） */}
                      {!isGuest && <ReasonBox chapterId={chapter.id} questionId={question.id} correct={calculateScore(question) === 100} qNo={(singleQuestionIndex !== undefined ? singleQuestionIndex : rangeOffset + (pagerOn ? (resultPages[safeResultPage]?.qIndex ?? qIndex) : qIndex)) + 1} />}
                    </div>

                  </div>
                );
              })
            ) : (
              <div className={`p-12 text-center rounded-2xl border-2 border-dashed ${'bg-gray-50 border-gray-200 text-gray-500'}`}>
                <div className="flex flex-col items-center gap-4">
                  <AlertCircle size={48} className="text-amber-500" />
                  <p className="text-lg font-bold">問題がありません。</p>
                </div>
              </div>
            )}

          {/* Surrounding Knowledge / Deep Dive (from all questions) */}
          <ExtrasSection
            wrapClassName={reorderMobile ? 'lx-extra-wrap pb-3 space-y-2' : pcListening ? 'lx-pc-side' : 'p-4 sm:p-6 md:p-8 space-y-8'}
            questions={questions}
           
            isEnglishChapter={isEnglishChapter}
            foldable={reorderMobile || pcListening}
            openByDefault={pcListening}
            qNumberOf={(qIndex) => (singleQuestionIndex !== undefined ? singleQuestionIndex : rangeOffset + (pagerOn ? (resultPages[safeResultPage]?.qIndex ?? qIndex) : qIndex)) + 1}
          />
        </div>

        {/* ★スマホ：下部固定ナビ（問題に戻る / 次の問題へ）。
            演習画面の「前へ / 解答と解説を見る」と同じ位置・同じ操作感にして、
            親指だけで「解く→答え合わせ→次を解く」を回せるようにする。 */}
        {reorderMobile && onNextQuestion && (
          <MobileAnswerNav onBack={onBack} onNextQuestion={onNextQuestion} isLastQuestion={isLastQuestion} />
        )}
      </div>
      </div>
      </div>
      )}
      </div>
      </div>
        {/* ★詳しい結果の下のバー（2026-10-04）★ 問題・スクリプト・解説の下に、次にすることをまとめる */}
        {reviewNav && <ReviewBottomBar reviewNav={reviewNav} />}

    </div>
  );

  // 結果・解説画面は全画面オーバーレイとして表示するため、
  // transform を持つ祖先要素の影響を受けないよう document.body 直下に
  // ポータルで描画する。これにより背後に前画面（ホーム等）が透けて見える
  // 問題を防ぎ、結果表示画面を単体の画面として成立させる。
  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }
  return content;
}

// 既存の import { ReviewNav } from './Explanation' のため再公開する（定義は explanation/types.ts）
export type { ReviewNav } from './explanation/types';
