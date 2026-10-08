import './step-explanation.css';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, CheckCircle2, XCircle, Lightbulb, BookOpen, AlertCircle, CheckSquare, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Edit3, Save, Search, Network, Circle, Trophy, KeyRound, ListOrdered, Target, ChevronLeft, ChevronRight, Coins, Home } from 'lucide-react';
import { motion } from 'motion/react';
import { formatText } from '../utils/textFormatter';
import { ExplanationBody } from './ExplanationBody';
import { auth } from '../firebase';
import { FeedbackButton } from './FeedbackButton';
import { QuestionFigure } from './QuestionFigure';
import { ListeningAudioPlayer, ListeningEvidenceScript } from './ListeningAudioPlayer';
import { LISTENING_PICTURE_ASPECT } from '../data/listeningPictureAspect';
import './listening-explanation.css';
import { buildFigureNumberMap, getFigureNumber } from '../utils/figureNumbering';
import { isAnswerCorrect } from '../utils/answerJudge';
import { gradingCriteriaProgress, resolveGradingCriteria } from '../utils/gradingCriteria';
// cleanQuestionText は演習画面（Quiz.tsx）と同じ実装が必要なので
// questionDisplay.ts の1つだけを使う（以前はここにも同じ実装があった）。
import { answerCardMarker, buildSubQuestionList, isSubQuestionListRedundant, extractInlineQuestionRows, extractListeningQuestionRows, cleanQuestionText, findSubQuestionSentence, optionCircledMark } from '../utils/questionDisplay';
import {
  buildUnitKataBlock,
  sliceEnhancedByQuestion,
  sliceEnhancedBySubQuestion,
  questionGroupKey,
} from '../utils/explanationFormat';
import {
  isScriptFirstExplanation,
  stripScriptBox,
  listeningQuestionNumberOf,
  scopeListeningCommonToQuestion,
} from '../utils/listeningExplanation';
import { sliceListeningQuestionBlock, buildListeningOptionTexts } from '../utils/listeningOptions';
import { getUnitTeaching } from '../data/unitTeaching';
import { useIsMobile } from '../hooks/useMediaQuery';
import type { ScoreBreakdown } from '../utils/scoring';
import { applyOverviewViewport } from '../utils/viewportControl';

/**
 * その小問に「解答が入力されているか」（＝手を付けたか）。
 *
 * 結果画面で「解いていない問」と「解いたが間違えた問」を区別するための判定。
 * 以前はどちらも isAnswerCorrect が false になるため一律「不正解」と
 * 表示されており、「一問しか解いてないのに他のが全部不正解扱いになる」
 * というご指摘につながった。空文字・空白のみは未解答として扱う。
 */
function isAttempted(answer: string | undefined | null): boolean {
  return String(answer ?? '').trim().length > 0;
}

interface ExplanationProps {
  mode: 'mini_test' | 'practice';
  chapter: any;
  answers: Record<string, string>;
  onBack: () => void;
  onReturnToBattle?: () => void;
  isGuest: boolean;
  singleQuestionIndex?: number;
  onNextQuestion?: () => void;
  isLastQuestion?: boolean;
  isMobileView?: boolean;
  scoreBreakdown?: ScoreBreakdown | null;
  scoreMeta?: { timeLimit: number; timeUsed: number } | null;
  totalScore?: number;
  runningCombo?: number;
  resultTotalScore?: number;
  resultTotalCorrect?: number;
  resultTotalJudgeable?: number;
  resultTotalTimeSec?: number;
  /**
   * 結果画面の「次にすること」。
   *   onRetryWrong … 間違えた最初の問題から同じ単元を解き直す（章内の通し番号を渡す）
   *   onNextChapter … 同じ科目の次の単元へ進む（全問正解のときの主操作）
   * 以前は結果画面の出口が「単元選択に戻る」だけで、
   * 復習するには一覧で同じ単元を探し直す必要があった。
   */
  onRetryWrong?: (firstWrongIndex: number) => void;
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
   *   省略時は従来どおり章の全問を振り返る（化学基礎・化学は従来のまま）。
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
   *   省略時は従来どおり大問まるごとの解説（化学基礎・化学はこちら）。
   */
  focusSubQuestionId?: string | null;
  /** 結果の「詳しい結果」画面の下に置く「ホームに戻る」 */
  onHome?: () => void;
  /** 結果の「詳しい結果」から開いたとき：上に問題の切り替え、下に「ホーム／単元選択／間違えた問題」を出す */
  reviewNav?: ReviewNav;
}

import { NodeData } from './InteractiveTree';
/*
 * 図データは図データのファイル（chemistryTreeData）から直接読む。
 * chemistryData 経由だと、この画面がここで必要としていない
 * 問題データまで全部ついてきてしまう。
 * 再公開しているだけなので、直接読んでも同一オブジェクトが得られる
 * （17 ツリーすべて `===` で同一参照であることを確認済み）。
 */
import { substanceTreeData, separationTreeData, thermalMotionTreeData, atomicStructureTreeData, ionTreeData, ionGenerationTreeData, ionSizeTreeData, chemicalBondTreeData } from '../data/chemistryTreeData';
// 「その章にフローチャートがあるか」の判定は data/chapterTreeMap.ts の対応表に集約している
import { hasChapterTree } from '../data/chapterTreeMap';
import { PracticeExplanationTree } from './PracticeExplanationTree';
import { IonizationEnergyChart } from './IonizationEnergyChart';
import { readJsonArray } from '../utils/safeLocalStorage';
import { useGrowthProgress } from '../hooks/useGrowthProgress';
import { NextBadgeHint } from '../battle/ui/GrowthParts';

// Substance Tree Data for Chapter 1 (Moved to chemistryData.ts)

// ここには filterTree（ツリーを関連ノードだけに絞る関数）があったが、
// 自分自身の再帰以外どこからも呼ばれていなかったため削除した。
// utils/logicTreeUtils.ts にも export の有無以外まったく同一のコピーが
// あり、そちらも未使用だったので同時に消してある。
// ツリーの絞り込みが再び必要になった場合は logicTreeUtils.ts に
// 1つだけ置くこと（画面側に実装を戻さない）。

const getDifficulty = (sqId: string) => {
  const id = sqId.replace(/^q/, 'p');
  const level1 = ['p1_a', 'p1_i', 'p1_u', 'p1_e', 'p1_o', 'p1_ki', 'p1_ku', 'p2_1', 'p2_2', 'p2_3', 'p2_5', 'p2_6', 'p2_8', 'p2_11', 'p2_14'];
  const level2 = ['p1_ka', 'p1_ke', 'p1_ko', 'p2_4', 'p2_7', 'p2_9', 'p2_10', 'p2_12', 'p2_13', 'p2_15'];
  const level3 = ['p3_1', 'p3_2', 'p3_3', 'p3_4', 'p3_5', 'p3_6', 'p3_7', 'p3_8', 'p3_9', 'p3_10'];
  
  if (level1.includes(id)) return 1;
  if (level2.includes(id)) return 2;
  if (level3.includes(id)) return 3;
  return 1;
};

/**
 * 解説の1画面表示（結果 → 英文 → 解説）に使う英文トラック。
 * リスニングは音源つき（audioTracks）、英文法は音を出さない文字だけ（explanationTracks）。
 */
function textTracksOf(q: any): any[] {
  if (Array.isArray(q?.audioTracks) && q.audioTracks.length) return q.audioTracks;
  return Array.isArray(q?.explanationTracks) ? q.explanationTracks : [];
}

/** 結果の所要時間（例：45秒 / 3分20秒） */
function formatResultTime(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return s < 60 ? `${s}秒` : `${Math.floor(s / 60)}分${s % 60 ? `${s % 60}秒` : ''}`;
}

export interface ReviewNav {
  pages: { state: string }[];
  current: number;
  onPage: (i: number) => void;
  onSummary: () => void;
  onHome?: () => void;
  onChapters: () => void;
  onRetryWrong?: () => void;
  retryLabel?: string;
  onNext?: () => void;
  nextLabel?: string;
}

/**
 * 絵の問題（第1問B・第2問）：問題のイラストは ①〜④ の4コマが 2×2 に並んだ1枚の絵。
 * 選択肢 oi のコマを背景の位置で切り出す（画像を新しく作らずに、同じ絵を使い回す）。
 */
function pictureCellOf(sq: any, oi: number, n: number): React.CSSProperties | null {
  const url: string | undefined = sq?.imageUrl;
  if (!url || n !== 4 || oi < 0 || oi > 3 || !/^\/listening_(q1b|q2)\//.test(url)) return null;
  const col = oi % 2, row = Math.floor(oi / 2);
  const aspect = LISTENING_PICTURE_ASPECT[url] ?? 1;
  return { backgroundImage: `url("${url}")`, backgroundSize: '200% 200%', backgroundPosition: `${col * 100}% ${row * 100}%`, aspectRatio: String(aspect) };
}

export function Explanation({ mode: initialMode, chapter, answers, onBack, onReturnToBattle, isGuest, singleQuestionIndex, onNextQuestion, isLastQuestion, isMobileView, scoreBreakdown, scoreMeta, totalScore, runningCombo, resultTotalScore, resultTotalCorrect, resultTotalJudgeable, resultTotalTimeSec, questionRange, onRetryWrong, onNextChapter, nextChapterTitle, focusSubQuestionId, onHome, reviewNav }: ExplanationProps) {
  const isPracticeMode = initialMode === 'practice';
  const { progress: growth } = useGrowthProgress();
  // Virtual mode is always 'mini_test' for bright style choices!
  const mode = 'mini_test';

  const [selfGrades, setSelfGrades] = useState<Record<string, boolean>>({});
  const [descriptiveScoreDelta, setDescriptiveScoreDelta] = useState(0);
  const prevDescriptiveScore = useRef(0);
  const [scorePulse, setScorePulse] = useState(false);
  const [expandedSq, setExpandedSq] = useState<string | null>(null);
  const [openExplanationBySq, setOpenExplanationBySq] = useState<Record<string, boolean>>({});
  const [openThinkingBySq, setOpenThinkingBySq] = useState<Record<string, boolean>>({});
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);
  const [scrollTrigger, setScrollTrigger] = useState<number>(0);
  const [expandedCorrectQuestions, setExpandedCorrectQuestions] = useState<Record<string, boolean>>({});
  // 要件①「この単元の思考の型」は単元につき1回だけ・採点結果の直後・折りたたみで出す。
  // 初期状態は閉じる（画面を圧迫させず、必要な人だけ開ける）。
  const [kataOpen, setKataOpen] = useState(false);
  const [savingNote, setSavingNote] = useState<Record<string, boolean>>({});
  // スマホ/PC判定は共有フックに一元化（md=768px 未満をスマホとみなす）。
  // isMobileView が渡された場合（スマホプレビュー枠）はそれを優先する。
  const isMobile = useIsMobile(isMobileView);

  // ─── スマホ専用（1問ごとの答え合わせ）の表示状態 ───
  // ご要望：「全ての問いのあってるか間違ってるかだけ出して、その正誤ボタンを
  //          押したらその問の解答と解説が出るようにしてほしい。
  //          フローチャートは邪魔にならない位置に切り替えボタンを設置。
  //          問題文は上・解答は下（演習画面と同じ2画面）。PC版は変えない。」
  /** 正誤一覧でいま選ばれている小問ID（null＝未選択。既定は最初の不正解） */
  const [selectedSqId, setSelectedSqId] = useState<string | null>(null);
  /** スマホ：問題文ペインを見出しだけにたたむ（演習画面と同じ操作感） */
  const [mobileProblemCollapsed, setMobileProblemCollapsed] = useState(false);
  /** スマホ：解答・解説エリアを学習フローチャート表示に切り替える */
  const [showFlowchart, setShowFlowchart] = useState(false);


  const allQuestions = initialMode === 'mini_test' ? chapter.miniTest : (chapter.practiceProblems || []);
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
    }).catch(() => {});
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
  }, [baseQuestions, singleQuestionIndex]);
  const pagerOn = resultPages.length > 1;
  const pageState = (pg: { sq: any }) => { const v = answers[pg.sq?.id]; return pg.sq?.type === 'descriptive' ? 'self' : !isAttempted(v) ? 'skip' : isAnswerCorrect(pg.sq, v) ? 'ok' : 'ng'; };
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
  }, [allQuestions, singleQuestionIndex, questionRange, rangeOffset, effectiveFocusId]);

  // 数学の章か（requiresMathPalette を立てた小問を含むか）。
  // 数学のときは解説・解答を数式フォント＋一回り大きい表示（.math-content）で描画し、
  // ∫Σ√分数などが教科書と同じ形で読めるようにする。
  const isMathChapter = useMemo(() => {
    return allQuestions.some((q: any) =>
      (q?.subQuestions || []).some((sq: any) => sq?.requiresMathPalette)
    );
  }, [allQuestions]);
  // 数学のときだけ付け足すクラス（非数学は空文字＝従来と完全に同じ見た目）
  const mathBodyClass = isMathChapter ? ' font-math math-content' : '';

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
  const DESKTOP_BODY_FONT = isMathChapter ? 'text-sm md:text-base leading-relaxed' : 'text-xs md:text-sm leading-relaxed';
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
    return allQuestions.some((q: any) => {
      return textTracksOf(q).length > 0;
    });
  }, [allQuestions]);

  const BODY_FONT_FAMILY = isMathChapter ? 'font-math math-content' : 'font-modern';

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

  // 要件①：「この単元の思考の型」の本文。単元（章）に紐づくので問題ごとには作らない。
  // 内容・表現・順番・解説は従来と1文字も変えていない（エンジン側の buildUnitKataBlock がそのまま組む）。
  const unitKataBlock = useMemo(() => buildUnitKataBlock(getUnitTeaching(chapter.id)), [chapter.id]);

  /**
   * 要件①のアコーディオン本体。
   * ・単元につき1回だけ描画する（呼び出し側で最初の大問にのみ差し込む）
   * ・配置は「採点結果」の直後
   * ・初期状態は閉じる（画面を圧迫させず、必要な人だけ開ける）
   */
  /**
   * ★ご要望8「この単元の思考の型 …も無くすのではなくて、小さくコンパクトにする」★
   *
   * reorderMobile は下（L864）で定義されるためここでは使えないので、
   * 同じ条件（スマホ かつ 1問表示＝結果画面ではない）をそのまま書く。
   *   reorderMobile === isMobile && !isResultView
   *   isResultView  === (singleQuestionIndex === undefined)
   * つまり isMobile && singleQuestionIndex !== undefined。
   *
   * コンパクト化の中身（消さずに詰める）
   *   ・「（この単元の全問に共通・必要なときだけ開く）」の副題を隠す
   *     … 42文字ぶんが折り返して2行になり、閉じた状態でも高さを食っていた
   *   ・「開く／閉じる」の文字を落として山型アイコンだけにする
   *   ・上下 padding を py-2.5 → py-1.5、アイコンを 16 → 13 に縮める
   *   見出し「この単元の思考の型」と本文は従来のまま（内容は削らない）。
   * PC は md: 指定と非スマホ分岐で従来の見た目を維持する。
   */
  const kataCompact = isMobile && singleQuestionIndex !== undefined;

  const kataAccordion = unitKataBlock ? (
    <div className={`rounded-xl border overflow-hidden ${mode === 'mini_test' ? 'border-pink-200 bg-pink-50/40' : 'border-[#D9466E]/40 bg-[#D9466E]/10'}`}>
      <button
        type="button"
        onClick={() => setKataOpen(prev => !prev)}
        aria-expanded={kataOpen}
        aria-label={`この単元の思考の型を${kataOpen ? '閉じる' : '開く'}`}
        className={`w-full flex items-center justify-between text-left transition-colors ${kataCompact ? 'gap-2 px-2.5 py-1.5' : 'gap-3 px-3 py-2.5 md:px-4 md:py-3'} ${mode === 'mini_test' ? 'hover:bg-pink-100/70' : 'hover:bg-[#D9466E]/20'}`}
      >
        <span className={`font-bold flex items-center flex-wrap ${kataCompact ? 'gap-1.5 text-[11px]' : 'gap-2 text-xs md:text-sm'} ${mode === 'mini_test' ? 'text-[#B03A5B]' : 'text-[#F4A9C4]'}`}>
          <BookOpen size={kataCompact ? 13 : 16} className="shrink-0" />
          <span>この単元の思考の型</span>
          {!kataCompact && (
            <span className={`font-normal text-[10px] md:text-xs ${mode === 'mini_test' ? 'text-[#B03A5B]/70' : 'text-[#F4A9C4]/70'}`}>
              （この単元の全問に共通・必要なときだけ開く）
            </span>
          )}
        </span>
        <span className={`flex items-center gap-1 shrink-0 font-bold ${kataCompact ? 'text-[10px]' : 'text-[10px] md:text-xs'} ${mode === 'mini_test' ? 'text-[#B03A5B]' : 'text-[#F4A9C4]'}`}>
          {!kataCompact && <span>{kataOpen ? '閉じる' : '開く'}</span>}
          <ChevronDown size={kataCompact ? 14 : 16} className={`transition-transform duration-300 ${kataOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {kataOpen && (
        <div className={`px-3 pb-3 md:px-4 md:pb-4 border-t ${mode === 'mini_test' ? 'border-pink-200 bg-white' : 'border-[#D9466E]/30 bg-[#0B132B]/50'}`}>
          <ExplanationBody
            text={unitKataBlock}
            tone={mode === 'mini_test' ? 'light' : 'dark'}
            /* 本文なので、問題画面と同じゴシック（font-modern）にそろえる。
               ここだけ手書き体で残すと、同じ解説画面の中で書体が2種類になる。 */
            className={`font-modern text-xs md:text-sm leading-relaxed pt-3 ${mode === 'mini_test' ? 'text-gray-700' : 'text-[#E0E1DD]/90'}`}
          />
        </div>
      )}
    </div>
  ) : null;

  // 章内の図版へ通し番号（図1・図2 …）を割り当てるマップ。
  // 単問表示でも通し番号が一貫するよう、章の全問題（allQuestions）を基準に採番する。
  const figureNumberMap = useMemo(() => buildFigureNumberMap(allQuestions), [allQuestions]);

  // \u81ea\u5df1\u63a1\u70b9\u306e\u30c1\u30a7\u30c3\u30af\u6570\u304b\u3089\u30dc\u30fc\u30ca\u30b9\u70b9\u3092\u30ea\u30a2\u30eb\u30bf\u30a4\u30e0\u8a08\u7b97
  const selfGradeBonus = useMemo(() => {
    let bonus = 0;
    baseQuestions.forEach((q: any) => {
      (q.subQuestions || []).forEach((sq: any) => {
        if (sq.type === 'descriptive') {
          // gradingCriteria が string で書かれたデータ（旧 ⑤-7 二段階滴定）でも
          // 例外を出さないよう、必ず配列へ正規化してから集計する。
          const { ratio } = gradingCriteriaProgress(sq, selfGrades);
          // 1\u9805\u76ee\u6e80\u70b9\u3092MAX 10\u70b9\u3068\u3057\u3066\u6bd4\u4f8b\u914d\u5206
          bonus += Math.round(ratio * 10);
        }
      });
    });
    return bonus;
  }, [selfGrades, baseQuestions]);

  const baseDisplayScore = totalScore ?? resultTotalScore;
  const displayTotalScore = baseDisplayScore != null ? baseDisplayScore + selfGradeBonus : null;
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
    const q: any = questions[0];
    const subs: any[] = (q?.subQuestions || []);
    const firstIncorrect = subs.find(
      (sq: any) => sq.type !== 'descriptive' && isAttempted(answers[sq.id]) && !isAnswerCorrect(sq, answers[sq.id]),
    );
    setSelectedSqId(firstIncorrect ? firstIncorrect.id : null);
    setShowFlowchart(false);
    setMobileProblemCollapsed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singleQuestionIndex, chapter.id, isMobile]);

  const handleSaveNote = async (question: any, index: number) => {
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
    const notesKey = `notes_${auth.currentUser?.uid || 'guest'}`;
    setSavingNote(prev => ({ ...prev, [question.id]: true }));
    try {
      const newNote = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        uid: auth.currentUser?.uid || 'guest',
        question: question.text,
        answer: question.subQuestions.map((sq: any) => sq.correctAnswer).join(', '),
        explanation: question.explanation,
        chapterTitle: chapter.abstractTitle || chapter.realTitle || '',
        questionIndex: displayIndex + 1,
        // 復習用リンク（要件5）：ノートから該当の演習問題へ戻れるよう
        // 章IDと問題IDを保持する。
        chapterId: chapter.id,
        questionId: question.id,
        memo: '',
        createdAt: new Date().toISOString(),
        isImportant: false,
        reviewCount: 0,
        tags: [],
        lastReviewedAt: null
      };
      
      const existingNotes = readJsonArray<any>(notesKey);
      existingNotes.push(newNote);
      localStorage.setItem(notesKey, JSON.stringify(existingNotes));
      
      alert(isGuest
        ? 'ノートに保存しました！（ゲスト利用のため、この端末にだけ保存されます）'
        : 'ノートに保存しました！');
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました。');
    } finally {
      setSavingNote(prev => ({ ...prev, [question.id]: false }));
    }
  };

  const handleQuestionClick = (questionId: string) => {
    // Map q_id to p_id for practice mode
    const idMap: Record<string, string> = {
      'q1_a': 'p1_a', 'q1_b': 'p1_i', 'q1_c': 'p1_u', 'q1_d': 'p1_e', 'q1_e': 'p1_o', 'q1_f': 'p1_ka',
      'q2_1': 'p2_1', 'q2_2': 'p2_2', 'q2_3': 'p2_3', 'q2_4': 'p2_4', 'q2_5': 'p2_5', 'q2_6': 'p2_6',
      'q3_1': 'p3_1', 'q3_2': 'p3_2', 'q3_3': 'p3_3', 'q3_4': 'p3_4',
      'q4_1': 'p4_1', 'q4_2': 'p4_2', 'q4_3': 'p4_3',
    };

    const reverseIdMap: Record<string, string> = Object.entries(idMap).reduce((acc, [k, v]) => {
      acc[v] = k;
      return acc;
    }, {} as Record<string, string>);

    let targetId = questionId;
    if (isPracticeMode) {
      targetId = idMap[questionId] || questionId.replace(/^q/, 'p');
    } else if (mode === 'mini_test') {
      targetId = reverseIdMap[questionId] || questionId.replace(/^p/, 'q');
    }
    
    setExpandedSq(targetId);
    
    setTimeout(() => {
      const element = document.getElementById(`sq-${targetId}`);
      if (element) {
        // Calculate the exact Y position to center the element in the viewport
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetY = rect.top + scrollTop - (window.innerHeight / 2) + (rect.height / 2);
        
        try {
          window.scrollTo({ top: targetY, behavior: 'smooth' });
        } catch (e) {
          window.scrollTo(0, targetY);
        }
        
        // Secondary fallback using scrollIntoView just in case
        setTimeout(() => {
          const newRect = element.getBoundingClientRect();
          if (newRect.top < 0 || newRect.bottom > window.innerHeight) {
            try {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } catch (e) {
              element.scrollIntoView();
            }
          }
        }, 100);
        
        // Add a temporary highlight effect
        const originalTransition = element.style.transition;
        element.style.transition = 'all 0.5s ease';
        element.style.boxShadow = '0 0 0 4px rgba(91, 192, 190, 0.5)';
        setTimeout(() => {
          element.style.boxShadow = '';
          setTimeout(() => {
            element.style.transition = originalTransition;
          }, 500);
        }, 2000);
      }
    }, 400);
  };

  const toggleGrade = (criteriaId: string) => {
    setSelfGrades(prev => {
      const next = { ...prev, [criteriaId]: !prev[criteriaId] };
      // リアルタイムスコア更新のためのシグナル
      setTimeout(() => setScorePulse(p => !p), 0);
      return next;
    });
  };

  const weakAreas = useMemo(() => {
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
  }, [baseQuestions, answers, selfGrades]);

  /**
   * 間違えた（＝解答したが不正解の）小問を含む最初の問題の、章内の通し番号。
   * 未解答は「間違えた」に数えない（isAttempted と同じ考え方）。
   * 記述問題は自己採点なので対象外。無ければ -1。
   */
  const firstWrongQuestionIndex = useMemo(() => {
    if (singleQuestionIndex !== undefined) return -1;
    const idx = baseQuestions.findIndex((q: any) =>
      (q.subQuestions || []).some((sq: any) =>
        sq.type !== 'descriptive' && isAttempted(answers[sq.id]) && !isAnswerCorrect(sq, answers[sq.id])));
    return idx < 0 ? -1 : rangeOffset + idx;
  }, [baseQuestions, answers, singleQuestionIndex, rangeOffset]);

  const deepThoughtData = useMemo(() => {
    for (const q of questions) {
      try {
        const parsed = JSON.parse(q.explanation);
        if (parsed && parsed.type === 'logic_thought') {
          return parsed;
        }
      } catch (e) {
        // ignore
      }
    }
    return null;
  }, [questions]);

  const getRelatedSteps = (sqId: string, currentQuestion: any) => {
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
  };

  const isGroupAllCorrect = (sq: any, currentQuestion: any) => {
    if (!sq.group || !currentQuestion) return false;
    const sameGroupSqs = (currentQuestion.subQuestions || []).filter((item: any) => item.group === sq.group);
    return sameGroupSqs.every((item: any) => isAnswerCorrect(item, answers[item.id]));
  };

  const renderSubQuestionCheck = (sq: any, currentQuestion: any) => {
    const isMiniTest = mode === 'mini_test';
    const isCorrect = sq.type === 'descriptive' ? false : isAnswerCorrect(sq, answers[sq.id]);
    // 未解答（手を付けていない）は不正解の赤✕ではなく灰色の○で区別する。
    const isUnanswered = sq.type !== 'descriptive' && !isAttempted(answers[sq.id]);
    const isExpanded = expandedSq === sq.id;
    const relatedSteps = getRelatedSteps(sq.id, currentQuestion);

    // 表示ルール3：右側（解答欄・採点結果）には設問文自体は含めず、
    // 設問マーカー（(ア)/(1)/問2 など）のみを表示する。
    const sqIndex = ((currentQuestion?.subQuestions || []) as any[]).indexOf(sq);
    const displayLabel = answerCardMarker(sq, sqIndex < 0 ? 0 : sqIndex, currentQuestion);

    if (!isExpanded) {
      return (
        <button 
          key={sq.id}
          onClick={() => setExpandedSq(sq.id)}
          className={`w-full flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 gap-3 rounded-xl border transition-colors ${sq.type === 'descriptive' ? 'bg-[#A9CCE3]/10 border-[#A9CCE3]/30' : (isCorrect ? 'bg-[#5BC0BE]/10 border-[#5BC0BE]/30' : isUnanswered ? 'bg-[#0B132B]/20 border-[#3A506B]/40' : 'bg-[#D9A0A0]/10 border-[#D9A0A0]/30')}`}
        >
          <div className="flex flex-col md:flex-row md:items-start gap-3 w-full min-w-0 text-left flex-1">
            {displayLabel.length > 20 ? (
              <div className={`font-bold ${isMiniTest ? 'text-gray-800' : 'text-[#E0E1DD]'} text-xs md:text-sm leading-relaxed w-full min-w-0 break-words whitespace-normal block py-1.5`}>
                {formatText(displayLabel)}
              </div>
            ) : (
              <div className={`font-bold text-[#E0E1DD] text-xs md:text-sm bg-[#0B132B]/50 px-3 py-1.5 rounded-xl border border-[#3A506B]/50 leading-relaxed max-w-full break-words whitespace-normal inline-block`}>
                {formatText(displayLabel)}
              </div>
            )}
            {sq.type !== 'descriptive' && (
              <div className="shrink-0 pt-1.5 md:pt-0">
                {isCorrect ? <CheckCircle2 className="text-[#5BC0BE] w-5 h-5" /> : isUnanswered ? <Circle className="text-[#7A8B99] w-5 h-5" /> : <XCircle className="text-[#D9A0A0] w-5 h-5" />}
              </div>
            )}
          </div>
          <ChevronDown className="text-[#7A8B99] shrink-0 self-end md:self-center" size={20} />
        </button>
      );
    }

    return (
      <div id={`sq-${sq.id}`} key={sq.id} className={`w-full ${isMiniTest ? 'bg-white' : 'bg-[#1C2541]'} rounded-xl border ${isMiniTest ? 'border-gray-200' : 'border-[#3A506B]'} shadow-lg p-4 md:p-6`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4 gap-3 min-w-0">
          {displayLabel.length > 20 ? (
            <div className={`font-bold ${isMiniTest ? 'text-gray-800' : 'text-[#E0E1DD]'} text-sm md:text-base leading-relaxed break-words whitespace-normal flex-1 min-w-0`}>
              {formatText(displayLabel)}
            </div>
          ) : (
            <div className={`font-bold ${isMiniTest ? 'text-gray-800' : 'text-[#E0E1DD]'} text-sm ${isMiniTest ? 'bg-gray-100' : 'bg-[#0B132B]'} px-3 py-1 rounded border ${isMiniTest ? 'border-gray-200' : 'border-[#3A506B]'}`}>
              {formatText(displayLabel)}
            </div>
          )}
          <button onClick={() => setExpandedSq(null)} className="text-[#7A8B99] hover:text-[#E0E1DD] shrink-0">
            <XCircle size={24} />
          </button>
        </div>

        {/* Content with Grid Layout */}
        <div className="space-y-6">
          <div className="space-y-4">
            {/* Related Steps Badge */}
            {/* Removed related steps badge for all modes */}

            <div>
              <div className="text-xs text-[#7A8B99] mb-1">
                {sq.type === 'descriptive' ? '📝 自己採点記入内容' : 'あなたの解答'}
              </div>
              <div className={`p-3 rounded-lg border ${sq.type === 'descriptive' ? (mode === 'mini_test' ? 'bg-blue-50 border-blue-200' : 'bg-[#A9CCE3]/10 border-[#A9CCE3]/30 text-[#A9CCE3]') : (isCorrect ? 'bg-[#5BC0BE]/10 border-[#5BC0BE]/30 text-[#5BC0BE]' : isUnanswered ? 'bg-[#0B132B]/30 border-[#3A506B]/40 text-[#7A8B99]' : 'bg-[#D9A0A0]/10 border-[#D9A0A0]/30 text-[#D9A0A0]')}`}>
                {formatText(answers[sq.id] || '未解答')}
              </div>
            </div>
            {sq.detailedExplanation ? (
              <div className={`p-4 rounded-lg border text-sm ${mode === 'mini_test' ? 'bg-gray-50 border-gray-200 text-gray-800' : 'bg-[#0B132B]/60 border-[#3A506B]/50 text-[#E0E1DD]'}`}>
                <h5 className={`font-bold ${mode === 'mini_test' ? 'text-emerald-700' : 'text-[#5BC0BE]'} mb-2`}>【{formatText(sq.detailedExplanation.theme)}】</h5>
                {isPracticeMode && (
                  <p className="text-xs text-[#7A8B99] mb-2">【難易度】: {'★'.repeat(getDifficulty(sq.id)) + '☆'.repeat(5 - getDifficulty(sq.id))}</p>
                )}
                
                {isPracticeMode && (
                  // 書体は直書きせず土台から継承する（(C) 書体統一）。
                  <ol className={`list-decimal list-inside space-y-1${mathBodyClass}`}>
                    {sq.detailedExplanation.steps.map((step: string, idx: number) => (
                      <li key={idx}>{formatText(step)}</li>
                    ))}
                  </ol>
                )}

                {sq.type !== 'descriptive' && (
                  <p className={`font-bold ${isMiniTest ? 'text-emerald-700' : 'text-[#5BC0BE]'} mt-3`}>【解答】<span className={mathBodyClass.trim()}>{formatText(sq.correctAnswer)}</span></p>
                )}

                {sq.type === 'descriptive' && (
                  <div className="mt-3 pt-2 border-t border-[#A9CCE3]/30 flex items-center gap-2">
                    <span className="text-[#A9CCE3] bg-[#A9CCE3]/10 px-3 py-2 rounded border border-[#A9CCE3]/30 text-sm font-bold">
                      📝 自己採点欄 - 上の記入内容を確認してください
                    </span>
                  </div>
                )}

                {sq.group && (
                  <div className="mt-3 pt-2 border-t border-gray-200/20 text-xs font-semibold flex items-center gap-2">
                    {isGroupAllCorrect(sq, currentQuestion) ? (
                      <span className="text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                        ✨ この式全体の係数はすべて正解です（完答○）
                      </span>
                    ) : (
                      <span className="text-amber-500 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                        ⚠️ 反応式のすべての係数が一致したときのみ完答となります
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-[#7A8B99] mb-1">正解</div>
                  {/* 数学章では正解も数式フォント＋拡大表示（問題文と表記を揃える） */}
                  <div className={`p-3 rounded-lg border bg-[#5BC0BE]/10 border-[#5BC0BE]/30 text-[#5BC0BE]${mathBodyClass}`}>
                    {formatText(sq.correctAnswer)}
                  </div>
                </div>

                {sq.group && (
                  <div className="mt-2 text-xs font-semibold flex items-center gap-2">
                    {isGroupAllCorrect(sq, currentQuestion) ? (
                      <span className="text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                        ✨ この式全体の係数はすべて正解です（完答○）
                      </span>
                    ) : (
                      <span className="text-amber-500 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                        ⚠️ 反応式のすべての係数が一致したときのみ完答となります
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Logic Tree (Below) */}
          {/* Removed logic tree from bottom of subquestion */}
        </div>
      </div>
    );
  };

  if (questions.length === 0) {
    return (
      <div className="w-full text-center">
        <button onClick={onBack} className="bg-[#1B2631] text-white px-6 py-3 rounded-xl font-bold w-full sm:w-auto">
          戻る
        </button>
      </div>
    );
  }

  const calculateScore = useCallback((question: any) => {
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
  }, [answers, selfGrades]);

  const toggleCorrectExpanded = (id: string) => {
    setExpandedCorrectQuestions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // 学習フローチャート（ロジックツリー）ブロック。
  // ・PC/結果表示: 左カラムの問題文の下に表示する。
  // ・スマホの「1問ごとの答え合わせ（!isResultView）」: 縦積み1カラムで
  //   「問題文 → 採点結果 → 学習フローチャート」の順にするため、
  //   採点結果より後ろ（order-3）に配置し直す。
  // 「その章にフローチャートがあるか」は data/chapterTreeMap.ts の対応表から導く。
  // （以前はここに17章ぶんの章IDを直接並べた3つめのコピーがあり、
  //   章を追加したときに「ツリーはあるのにブロックが出ない」という
  //   食い違いが起きうる状態だった）
  const hasFlowchart = hasChapterTree(chapter?.id);
  const flowchartBlock = hasFlowchart ? (
    <div className="mt-6 border-t pt-4 border-gray-200">
      <PracticeExplanationTree
        deepThoughtData={deepThoughtData}
        chapter={chapter}
        questions={questions}
        handleQuestionClick={handleQuestionClick}
        expandedStep={expandedStep}
        setExpandedStep={setExpandedStep}
        expandedNodeId={expandedNodeId}
        scrollTrigger={scrollTrigger}
        isMobile={isMobile}
        renderSubQuestionCheck={renderSubQuestionCheck}
        zoom={isMobile ? 'normal' : 'far'}
        collapsible
      />
    </div>
  ) : null;

  // スマホの1問ごとの答え合わせ（!isResultView）だけ、縦積みの並び順を
  // 「問題文 → 採点結果 → 学習フローチャート」に組み替える。
  // それ以外（PC、結果表示画面）は従来どおり左カラム内にフローチャートを表示する。
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
  const compactWeakAreas = compactResult && weakAreas.length > 0 ? (
    <div className="mt-3 pt-3 border-t border-[#F4D03F]/40">
      <div className="flex items-center gap-1.5 mb-2">
        <TrendingUp className="w-4 h-4 text-[#D9A0A0]" />
        <span className="text-xs font-bold text-[#1B2631]">分析結果：復習推奨エリア</span>
      </div>
      {/* 件数が多い単元でも下の解説を押し出さないよう、必要なときだけ内部スクロールする */}
      <div className="space-y-1.5 max-h-[38vh] overflow-y-auto overscroll-contain pr-0.5">
        {weakAreas.map((area) => (
          <div key={area.category} className="bg-white/80 border border-white rounded-xl px-2.5 py-1.5 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 min-w-0">
                <AlertTriangle className="w-3 h-3 shrink-0 text-[#D9A0A0]" />
                <span className="text-[11px] font-bold text-[#1B2631] truncate">{area.category}</span>
              </div>
              <span className="font-mono font-bold text-xs text-[#D9A0A0] tabular-nums shrink-0">
                {area.percentage}<span className="text-[9px] ml-0.5">%</span>
              </span>
            </div>
            <div className="relative h-1.5 mt-1 rounded-full overflow-hidden bg-gray-200/70">
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#D9A0A0] to-[#FFB7B2] transition-all duration-1000 ease-out"
                style={{ width: `${area.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-[#4B5563]/70 mt-1.5 text-right">
        ※ 記述問題は自己採点チェックを入れるとスコアに反映されます
      </p>
    </div>
  ) : null;

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
          onRetryWrong: firstWrongQuestionIndex >= 0 && onRetryWrong ? () => onRetryWrong(firstWrongQuestionIndex) : undefined,
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
      {onReturnToBattle && <button type="button" onClick={onReturnToBattle} className="sticky top-0 z-[55] min-h-11 shrink-0 border-b border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-900">バトル結果・解説に戻る</button>}
      {reviewNav && (
        <nav className="practice-pager is-review" aria-label="解いた問題を切り替える" data-practice-pager>
          <div className="practice-pager-row">
            <button type="button" className="practice-pager-back" onClick={reviewNav.onSummary} aria-label="結果にもどる"><ChevronLeft size={16} aria-hidden="true" />結果</button>
            <button type="button" className="practice-pager-arrow" aria-label="前の問題" disabled={reviewNav.current === 0}
              onClick={() => reviewNav.onPage(Math.max(0, reviewNav.current - 1))}><ChevronLeft size={20} /></button>
            <ol className="practice-pager-chips">
              {reviewNav.pages.map((pg, i) => (
                <li key={i}>
                  <button type="button" data-state={pg.state} aria-current={i === reviewNav.current || undefined}
                    aria-label={`${i + 1}問目（${pg.state === 'ok' ? '正解' : pg.state === 'ng' ? '不正解' : pg.state === 'skip' ? '未解答' : '自己採点'}）`}
                    onClick={() => reviewNav.onPage(i)}>{i + 1}</button>
                </li>
              ))}
            </ol>
            <button type="button" className="practice-pager-arrow" aria-label="次の問題" disabled={reviewNav.current >= reviewNav.pages.length - 1}
              onClick={() => reviewNav.onPage(Math.min(reviewNav.pages.length - 1, reviewNav.current + 1))}><ChevronRight size={20} /></button>
          </div>
        </nav>
      )}
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
              mode === 'mini_test' 
                ? 'bg-white text-gray-800' 
                : 'bg-[#0B132B] text-[#E0E1DD]'
            }`
          : `${isResultView ? 'w-full flex-1' : 'w-full h-full'} flex flex-col ${CARD_FONT_FAMILY} relative ${
              mode === 'mini_test' 
                ? 'bg-white text-gray-800' 
                : 'bg-[#0B132B] text-[#E0E1DD]'
            }`
        }>
      {/* Background effects */}
      {mode !== 'mini_test' && (
        <>
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle at 50% 0%, #3A506B 0%, transparent 70%)'
          }}></div>
          <div className="absolute inset-0 opacity-15 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(#1C2541 1px, transparent 1px)',
            backgroundSize: '100% 2rem'
          }}></div>
        </>
      )}

      {/* Header（結果画面ではスクロールしても常に「単元選択に戻る」やスコアが見えるよう上部に固定）
          ★詳しい結果（reviewNav）では出さない：上の切り替えバーが見出しの代わり。
            「答え合わせ / Q1 / 正答率」や上の「単元選択に戻る」は不要（2026-10-04 ご指摘）。 */}
      {!reviewNav && (
      <div className={`p-4 md:p-6 border-b-2 z-30 flex items-start justify-between gap-4 flex-none ${
        // ★スマホの1問ごとの答え合わせ（reorderMobile）では、
        //   「解答・解説 / 章名」の右横に Score・答え合わせ・Q番号・ノートに保存・正答率を
        //   横並びで置き、縦方向の占有を減らす（上部の1行に集約する）。
        reorderMobile ? 'flex-row' : 'flex-col md:flex-row md:items-center'
      } ${
        isResultView ? 'sticky top-0 backdrop-blur-md' : 'relative'
      } ${
        mode === 'mini_test' ? 'bg-white/95 border-gray-100' : 'bg-[#0B132B]/95 border-[#1C2541]'
      }`}>
        <div className={`flex flex-1 min-w-0 ${
          reorderMobile
            ? 'flex-row items-start justify-between gap-2 w-full'
            : 'flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto'
        }`}>
          <div className="flex-shrink-0">
            <h3 className={`font-bold tracking-wider ${reorderMobile ? 'text-base' : 'text-lg md:text-xl'} ${
              mode === 'mini_test' ? 'text-[#2C3E50]' : 'text-[#5BC0BE]'
            }`}>
              解答・解説
            </h3>
            <div className={`mt-0.5 md:mt-1 ${reorderMobile ? 'text-[10px]' : 'text-xs md:text-sm'} ${
              mode === 'mini_test' ? 'text-gray-500' : 'text-[#7A8B99]'
            }`}>
              {chapter.realTitle}
            </div>
          </div>

          {/* ★スマホの1問ごとの答え合わせでは、Score とメタ情報（答え合わせ / Q番号 /
              カテゴリ / ノートに保存 / 正答率）を右寄せの1ブロックにまとめる。
              PC・結果表示では従来のレイアウトを崩さないよう display:contents で素通しする。

              ★ご要望「解答と解説って書いてあるところの右のトロフィーとか
                ☑️答え合わせとかをもう少し横に並べる感じに」★

              ■ 実測（Playwright / 390x844・化学基礎「ろ過」の解答・解説）
                ヘッダーの高さ 106px。右側のチップが3段に折り返していた。
                  y=16 … 🏆0pt
                  y=40 … ☑答え合わせ / Q1 / カテゴリ
                  y=67 … ノートに保存 / 正答率
                合計幅は 50+84+30+92+47+カテゴリ ≒ 380px あり、
                右側に使える幅（約265px）に対して flex-wrap が2回折り返していた。

              ■ 直し方＝「並べる」ために幅を削る（要素は消さない）
                折り返しを禁止（flex-nowrap）したうえで、
                スマホでは文字ラベルを落としてアイコン＋数値だけにする。
                  ☑答え合わせ → ☑（アイコンのみ・aria-label で読み上げは維持）
                  ノートに保存 → 💾（同上）
                  正答率: 0%   → 0%（「正答率:」の見出しを省く）
                これで 50+24+30+30+26+カテゴリ ≒ 240px になり1行に収まる。
                カテゴリだけは可変なので min-w-0 + truncate で余りに合わせて縮む。
                PC（reorderMobile=false）はラベルもレイアウトも従来のまま。 */}
          <div className={reorderMobile
            ? 'flex flex-nowrap items-center justify-end gap-1 min-w-0 flex-1'
            : 'contents'
          }>
          {/* 固定ヘッダーの Score 表示は削除。
              結果表示画面（isResultView）では下部の「RESULT SCORE」カード内にのみ Score を表示し、
              固定ヘッダーには「単元選択に戻る」ボタンのみを残す。
              1問ごとの答え合わせ（!isResultView）でのみ、進行中スコアを従来どおりヘッダーに表示する。 */}
          {/* 2026-10-02：演習ではポイントを出さない */}
          {false && !isResultView && displayTotalScore != null && (
            <motion.div
              key={scorePulse ? 'a' : 'b'}
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`flex items-center border shadow-sm ${
                // スマホでは小さめのピル型にして、右横に並べても窮屈にならないようにする
                reorderMobile ? 'shrink-0 gap-0.5 px-1.5 py-0.5 rounded-full' : 'gap-2 px-3 py-2 rounded-2xl'
              } ${
                mode === 'mini_test'
                  ? 'bg-[#F4D03F]/15 text-[#1B2631] border-[#F4D03F]/40'
                  : 'bg-[#F4D03F]/20 text-[#F9E79F] border-[#F4D03F]/40'
              }`}
            >
              <Trophy size={reorderMobile ? 12 : 16} className="text-[#D4A017]" />
              {reorderMobile ? (
                <div className="font-handwriting font-bold text-xs tabular-nums leading-none">
                  {displayTotalScore}
                  <span className="text-xs ml-0.5 opacity-70">pt</span>
                </div>
              ) : (
                <div className="leading-none">
                  <div className="text-[10px] font-bold opacity-70 font-modern">Score</div>
                  <div className="font-handwriting font-bold text-base md:text-lg tabular-nums">
                    {displayTotalScore}
                    <span className="text-[10px] ml-1 opacity-70">pt</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {singleQuestionIndex !== undefined && questions[0] && (
            <div className={reorderMobile
              ? 'flex flex-nowrap items-center justify-end gap-1 min-w-0 flex-1'
              : `flex flex-wrap items-center gap-2 sm:gap-3 sm:border-l sm:pl-4 md:pl-6 lg:pl-8 ${
                  mode === 'mini_test' ? 'border-gray-200' : 'border-[#3A506B]/50'
                } w-full sm:w-auto`
            }>
              {/* 「答え合わせ」チップ。
                  スマホでは文字を落としてチェックアイコンだけにする
                  （aria-label を付けるので読み上げは「答え合わせ」のまま）。 */}
              <div
                aria-label="答え合わせ"
                title="答え合わせ"
                className={`flex items-center font-bold rounded-full border shrink-0 ${
                  reorderMobile ? 'gap-0 text-[10px] px-1 py-0.5' : 'gap-1 text-[11px] md:text-xs px-2.5 py-1'
                } ${
                mode === 'mini_test' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-[#5BC0BE]/20 text-[#5BC0BE] border-[#5BC0BE]/30'
              }`}>
                <CheckCircle2 className={reorderMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                {!reorderMobile && <span>答え合わせ</span>}
              </div>

              <div className={`font-bold rounded-full shadow-sm border shrink-0 ${
                reorderMobile ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-0.5'
              } ${
                mode === 'mini_test' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-[#5BC0BE]/20 text-[#5BC0BE] border-[#5BC0BE]/30'
              }`}>
                Q{singleQuestionIndex + 1}
              </div>

              {/* カテゴリだけは長さが可変なので、1行に収める調整役にする。
                  min-w-0 + truncate で「余った幅ぶんだけ表示」になる。 */}
              <div className={`font-bold truncate ${
                reorderMobile ? 'text-[10px] min-w-0 flex-1' : 'text-xs md:text-sm max-w-[120px] sm:max-w-[200px]'
              } ${
                mode === 'mini_test' ? 'text-gray-800' : 'text-[#E0E1DD]'
              }`}>
                {questions[0].category || '問題'}
              </div>

              {/* 「ノートに保存」も同様に、スマホではアイコンだけにする。 */}
              <button
                onClick={(e) => { e.stopPropagation(); handleSaveNote(questions[0], singleQuestionIndex); }}
                aria-label={savingNote[questions[0].id] ? 'ノートに保存中' : 'ノートに保存'}
                title={savingNote[questions[0].id] ? '保存中...' : 'ノートに保存'}
                className={`flex items-center rounded-full font-bold transition-colors border shrink-0 ${
                  reorderMobile ? 'gap-0 text-[10px] px-1 py-0.5' : 'gap-1 text-[11px] px-2.5 py-1'
                } ${
                  savingNote[questions[0].id] 
                    ? (mode === 'mini_test' ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-[#1C2541] text-[#7A8B99] border-[#1C2541]') 
                    : (mode === 'mini_test' ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' : 'bg-[#F9E79F]/20 text-[#F9E79F] border-[#F9E79F]/30 hover:bg-[#F9E79F]/30')
                }`}
                disabled={savingNote[questions[0].id]}
              >
                <Save size={reorderMobile ? 12 : 12} />
                {!reorderMobile && <span>{savingNote[questions[0].id] ? '保存中...' : 'ノートに保存'}</span>}
              </button>

              {(() => {
                const scorePercentage = calculateScore(questions[0]);
                return (
                  <div
                    className={`flex items-center gap-1 shrink-0 ${reorderMobile ? '' : 'ml-auto sm:ml-0'}`}
                    aria-label={`正答率 ${scorePercentage}%`}
                    title={`正答率 ${scorePercentage}%`}
                  >
                    {/* スマホでは「正答率:」の見出しを省き、数値だけを出す
                        （aria-label / title で意味は残す）。 */}
                    {!reorderMobile && (
                      <span className={`font-bold text-[10px] md:text-xs ${mode === 'mini_test' ? 'text-gray-500' : 'text-[#7A8B99]'}`}>正答率:</span>
                    )}
                    <span className={`font-mono font-bold ${reorderMobile ? 'text-[11px]' : 'text-xs md:text-sm'} ${
                      scorePercentage >= 80 
                        ? (mode === 'mini_test' ? 'text-emerald-600' : 'text-[#5BC0BE]') 
                        : scorePercentage <= 40 
                          ? (mode === 'mini_test' ? 'text-red-500' : 'text-[#D9A0A0]') 
                          : (mode === 'mini_test' ? 'text-amber-500' : 'text-[#F9E79F]')
                    }`}>
                      {scorePercentage}%
                    </span>
                  </div>
                );
              })()}
            </div>
          )}
          </div>
        </div>
        {singleQuestionIndex !== undefined && onNextQuestion ? (
          // ★スマホの1問ごとの答え合わせでは、このボタン行は画面下部の
          //   固定ナビ（親指の届く位置・演習画面と同じ操作感）に移すため隠す。
          <div className={`${reorderMobile ? 'hidden' : 'flex'} items-center gap-3 w-full md:w-auto`}>
            <button 
              onClick={onBack}
              className={`flex items-center gap-2 transition-colors font-bold px-4 py-2 rounded-full border flex-1 md:flex-none justify-center ${
                mode === 'mini_test' 
                  ? 'text-gray-500 hover:text-[#2C3E50] border-gray-200 hover:border-[#2C3E50] bg-gray-50' 
                  : 'text-[#7A8B99] hover:text-[#5BC0BE] border-[#1C2541] hover:border-[#5BC0BE] bg-[#1C2541]/50'
              }`}
            >
              <ArrowLeft size={18} />
              <span>問題に戻る</span>
            </button>
            <button 
              onClick={onNextQuestion}
              className={`flex items-center gap-2 transition-colors font-bold px-4 py-2 rounded-full border flex-1 md:flex-none justify-center ${
                mode === 'mini_test' 
                  ? 'text-white bg-[#2C3E50] hover:bg-[#1a252f] border-[#2C3E50]' 
                  : 'text-[#0B132B] bg-[#5BC0BE] hover:bg-[#4A9D9C] border-[#5BC0BE]'
              }`}
            >
              <span>{isLastQuestion ? '結果を見る' : '次の問題へ'}</span>
              <ArrowLeft size={18} className="rotate-180" />
            </button>
          </div>
        ) : isResultView ? null : (
          <button 
            onClick={onBack}
            className={`flex items-center gap-2 transition-colors font-bold px-4 py-2 rounded-full border w-full md:w-auto justify-center ${
              mode === 'mini_test' 
                ? 'text-gray-500 hover:text-[#2C3E50] border-gray-200 hover:border-[#2C3E50] bg-gray-50' 
                : 'text-[#7A8B99] hover:text-[#5BC0BE] border-[#1C2541] hover:border-[#5BC0BE] bg-[#1C2541]/50'
            }`}
          >
            <ArrowLeft size={18} />
            <span>単元選択に戻る</span>
          </button>
        )}
      </div>
      )}

      {isResultView && displayTotalScore != null && resultStep === 'summary' && (
        <div className={`relative z-10 ${compactResult ? 'px-3 pt-3' : 'px-4 md:px-6 pt-4'}`}>
          <div className={`bg-gradient-to-br from-[#FFF8E1] via-white to-[#E8F4FD] border border-[#F4D03F]/60 shadow-lg ${
            compactResult ? 'rounded-2xl p-3' : 'rounded-3xl p-5 md:p-6'
          }`}>
            {/* スマホ（compactResult）ではスコアと Correct/Rate/Time を1行に圧縮して、
                直下の「復習推奨エリア」まで同じ画面に収める。 */}
            {/* 2026-10-02：演習ではポイントを出さない（対戦と分ける）。正解数・正答率・時間だけ */}
            <div className="practice-result-summary" data-practice-result>
              <div className="practice-result-main">
                <span className="practice-result-badge">演習の結果</span>
                <p><strong>{resultTotalCorrect ?? 0}</strong><span>/ {resultTotalJudgeable ?? 0} 問 正解</span></p>
              </div>
              <dl className="practice-result-stats">
                <div><dt>正答率</dt><dd>{resultTotalJudgeable ? Math.round(((resultTotalCorrect ?? 0) / resultTotalJudgeable) * 100) : 0}%</dd></div>
                <div><dt>時間</dt><dd>{formatResultTime(resultTotalTimeSec ?? 0)}</dd></div>
              </dl>
            </div>
            {/* あと少し：演習でもらえる称号のうち近いもの（無ければ出さない） */}
            <NextBadgeHint progress={growth} prefer="b_study" className="mt-2" />

            {/* ===== 次にすること =====
                点数の直下に主操作を1つ置く。間違いがあれば「間違えた問題を解き直す」、
                全問正解なら「次の単元へ」。どちらも無ければ何も出さない
                （従来どおりヘッダーの「単元選択に戻る」を使う）。 */}
            {/* 「間違えた問題を解き直す／次の回へ」は詳しい結果の下へ移した（2026-10-04 ご指摘） */}

            {/* ★スマホ：スコアの直下に復習推奨エリア（コンパクト版）を出し、
                1画面で「点数」と「どこを復習すべきか」が同時に見えるようにする。 */}
            {compactWeakAreas}



            {/* ===== この単元についてのご意見（結果画面の意見収集入口）=====
                解いた直後は「ここが分かりにくい」が一番鮮明なタイミングなので、
                スコアカードの直下に常設する。単元ID・スコア・正答数を自動で添付する。 */}
            <div className="mt-4 pt-4 border-t border-[#F4D03F]/40 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <p className="text-[11px] text-[#4B5563]/80 font-modern leading-snug flex-1">
                この単元の問題文・解説で気づいたこと（分かりにくい、誘導が欲しい、誤字・表示崩れなど）をお寄せください。
              </p>
              <FeedbackButton
                screen="chapter_result"
                variant="inline"
                label="この単元にご意見"
                description={`${chapter.title || chapter.id}の問題・解説についてのご意見をお聞かせください`}
                context={{
                  chapterId: chapter.id,
                  chapterTitle: chapter.title || '',
                  mode,
                  totalScore: displayTotalScore,
                  correct: resultTotalCorrect ?? 0,
                  judgeable: resultTotalJudgeable ?? 0,
                  timeSec: resultTotalTimeSec ?? 0,
                }}
                className="shrink-0 self-start sm:self-auto"
              />
            </div>
          </div>
        </div>
      )}

      {/* ★結果のステージ（2026-10-04 ご要望）★ カードと下のボタンの間の空きに、とびらくんと今回もらったマナコインを大きく出す */}
      {isResultView && resultStep === 'summary' && (() => {
        const judge = resultTotalJudgeable ?? 0; const correct = resultTotalCorrect ?? 0;
        const rate = judge ? correct / judge : 0;
        const pose = judge > 0 && correct === judge ? 'trophy' : rate >= 0.6 ? 'happy' : rate > 0 ? 'cheering' : 'thinking';
        const line = judge > 0 && correct === judge ? '全問正解！この調子で次の回へ行こう！'
          : rate >= 0.6 ? 'いい感じ！まちがえた所だけ見直せば完ぺき！'
          : rate > 0 ? 'ナイスチャレンジ！解説で「解くカギ」を確認しよう'
          : 'ここからが伸びしろ！詳しい結果で1問ずつ確かめよう';
        const coins = studyReward?.coins ?? 0;
        return (
          <section className="practice-stage" aria-label="とびらくんと今回のごほうび" data-practice-stage data-pose={pose}>
            <div className="practice-stage-bubble" role="status">{line}</div>
            <img className="practice-stage-tobira" src={`/mascots/${pose}.webp`} alt="" width={160} height={160} draggable={false} />
            <div className="practice-stage-reward" data-practice-reward>
              <Coins size={22} aria-hidden="true" />
              {isGuest
                ? <span>ログインすると、正解した問題ごとにマナコインがもらえます</span>
                : coins > 0
                  ? <><span>今回のごほうび</span><b>＋{coins}</b><span>マナコイン</span>{studyReward?.xp ? <small>＋{studyReward.xp}XP</small> : null}</>
                  : <span>正解した問題ごとに<b className="is-inline">＋3</b>マナコイン<small>（同じ問題は1日1回）</small></span>}
            </div>
          </section>
        );
      })()}

      {/* ★結果（1画面目）の下のバー：主操作は「詳しい結果を確認する」1つだけ。親指の届く画面の下に置く★ */}
      {isResultView && resultStep === 'summary' && <div className="practice-bottom-spacer" aria-hidden="true" />}
      {isResultView && resultStep === 'summary' && (
        <div className="practice-bottom-bar" data-practice-summary-actions>
          <button type="button" className="practice-detail-open" data-practice-open-detail
            onClick={() => { setResultStep('detail'); setResultPage(firstWrongPage >= 0 ? firstWrongPage : 0); }}>
            <ListOrdered size={18} aria-hidden="true" />詳しい結果を確認する{wrongCount > 0 ? `（まちがい${wrongCount}問）` : ''}
          </button>
        </div>
      )}

      {!(isResultView && resultStep === 'summary') && (
      <div className={isMobile
        ? reorderMobile
          // スマホの1問ごとの答え合わせ：問題文ペインを sticky で上部に
          // 固定するため、外側の余白は付けない（全幅の上下2ペイン）。
          ? `relative z-10 ${mode === 'mini_test' ? 'bg-white' : ''}`
          : `p-4 md:p-6 relative z-10 space-y-6 md:space-y-8 ${mode === 'mini_test' ? 'bg-white' : ''}`
        : isResultView
          ? `p-4 md:p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] relative z-10 space-y-6 md:space-y-8 ${mode === 'mini_test' ? 'bg-white' : ''}`
          : `p-4 md:p-6 relative z-10 flex-1 overflow-hidden flex flex-col ${mode === 'mini_test' ? 'bg-white' : ''}`
      }>
      {/* Weak Areas Analysis
          ★ 修正：問題数が多い場合（弱点エリアが多数）に desktop で潜在的にはみ出してスクロールできなかった不具合を解消。
            - ブロック自体は flex-none（縮まない）
            - 見出しは固定し、カードのグリッド部分だけを max-height 付きで縦スクロール可能にする */}
        {/* ★スマホの結果画面（compactResult）では、この大きな復習推奨エリアは
            上のスコアカード内にコンパクト表示へ移したので重複表示しない。 */}
        {singleQuestionIndex === undefined && weakAreas.length > 0 && !compactResult && (
          <div className={`rounded-2xl p-5 md:p-6 shadow-lg border relative flex flex-col flex-none ${
            mode === 'mini_test' ? 'bg-gray-50 border-gray-100' : 'bg-[#1C2541]/50 border-[#3A506B]/50'
          }`}>
            <h3 className={`text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2 flex-none ${
              mode === 'mini_test' ? 'text-[#2C3E50]' : 'text-[#D9A0A0]'
            }`}>
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
              <span>分析結果：復習推奨エリア</span>
            </h3>
            
            <div className={isMobile
              // スマホでは内部スクロール（40vh固定）を設けず、全カードをそのまま並べて
              // ページ全体の縦スクロールで閲覧できるようにする（途中でクリップしない）。
              ? "grid grid-cols-1 gap-4"
              : "grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 overflow-y-auto max-h-[40vh] md:max-h-[34vh] pr-1 -mr-1"}>
              {weakAreas.map((area) => (
                <div key={area.category} className={`p-4 md:p-5 rounded-xl border shadow-sm ${
                  mode === 'mini_test' ? 'bg-white border-gray-100' : 'bg-[#0B132B]/80 border-[#1C2541]'
                }`}>
                  <div className="flex justify-between items-end mb-2 md:mb-3">
                    <div className={`flex items-center gap-1.5 md:gap-2 font-bold text-sm md:text-base ${
                      mode === 'mini_test' ? 'text-[#2C3E50]' : 'text-[#E0E1DD]'
                    }`}>
                      <AlertTriangle className={`w-4 h-4 md:w-[18px] md:h-[18px] ${
                        mode === 'mini_test' ? 'text-[#D9A0A0]' : 'text-[#D9A0A0]'
                      }`} />
                      <span>{area.category}</span>
                    </div>
                    <span className={`font-mono font-bold text-xl md:text-2xl ${
                      mode === 'mini_test' ? 'text-[#D9A0A0]' : 'text-[#D9A0A0]'
                    }`}>
                      {area.percentage}<span className="text-xs md:text-sm ml-0.5">%</span>
                    </span>
                  </div>
                  
                  {/* Gauge/Slider UI */}
                  <div className={`relative h-3 md:h-4 rounded-full overflow-hidden shadow-inner ${
                    mode === 'mini_test' ? 'bg-gray-100' : 'bg-[#1C2541]'
                  }`}>
                    <div 
                      className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${
                        mode === 'mini_test' ? 'bg-gradient-to-r from-[#D9A0A0] to-[#FFB7B2]' : 'bg-gradient-to-r from-[#D9A0A0] to-[#FFB7B2]'
                      }`}
                      style={{ width: `${area.percentage}%` }}
                    />
                    <div className="absolute inset-0 opacity-30" 
                         style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.2) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.2) 50%,rgba(255,255,255,.2) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }} 
                    />
                  </div>
                  <div className={`flex justify-between mt-1 text-[10px] md:text-xs font-mono ${
                    mode === 'mini_test' ? 'text-gray-400' : 'text-[#7A8B99]'
                  }`}>
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              ))}
            </div>
            <p className={`text-xs md:text-sm mt-4 text-right ${
              mode === 'mini_test' ? 'text-gray-400' : 'text-[#7A8B99]'
            }`}>
              ※ 記述問題は自己採点チェックを入れるとスコアに反映されます
            </p>
          </div>
        )}

        {/* ★解いた問題のページ送り（2026-10-04）★ 対戦の「1問ずつのけっか」と同じ操作。番号の色で正誤が分かる */}
        {isResultView && resultStep === 'detail' && resultPages.length > 0 && (
          <nav className="practice-pager" aria-label="解いた問題を切り替える" data-practice-pager>
            <p className="practice-pager-title">
              <button type="button" className="practice-pager-back" onClick={() => setResultStep('summary')} aria-label="結果にもどる"><ChevronLeft size={16} aria-hidden="true" />結果</button>
              <span>1問ずつの答え合わせ</span><b>{safeResultPage + 1} / {resultPages.length}</b>
            </p>
            <div className="practice-pager-row">
              <button type="button" className="practice-pager-arrow" aria-label="前の問題" disabled={safeResultPage === 0}
                onClick={() => setResultPage(Math.max(0, safeResultPage - 1))}><ChevronLeft size={20} /></button>
              <ol className="practice-pager-chips">
                {resultPages.map((pg, i) => {
                  const st = pageState(pg);
                  return (
                    <li key={`${pg.qIndex}-${pg.sq?.id}`}>
                      <button type="button" data-state={st} aria-current={i === safeResultPage || undefined}
                        aria-label={`${i + 1}問目（${st === 'ok' ? '正解' : st === 'ng' ? '不正解' : st === 'skip' ? '未解答' : '自己採点'}）`}
                        onClick={() => setResultPage(i)}>{i + 1}</button>
                    </li>
                  );
                })}
              </ol>
              <button type="button" className="practice-pager-arrow" aria-label="次の問題" disabled={safeResultPage >= resultPages.length - 1}
                onClick={() => setResultPage(Math.min(resultPages.length - 1, safeResultPage + 1))}><ChevronRight size={20} /></button>
            </div>
          </nav>
        )}

        {/* Unified Explanation Area
            ★ 修正：結果表示（isResultView）では固定高さ＋overflow-hidden を付けず、
              ページ自体を自然に縦スクロールさせる（PC・スマホともに全問が見えるように）。
              1問ごとの解説表示（!isResultView）のときだけ、2カラムの固定高さレイアウトにする。 */}
        <div className={isMobile
          ? reorderMobile
            // 1問ごとの答え合わせ（スマホ）：問題文ペインを sticky にするため
            // 枠・角丸を付けず全幅で使う。
            ? `${mode === 'mini_test' ? 'bg-white' : 'bg-[#1C2541]/40'}`
            : `rounded-2xl shadow-lg border ${mode === 'mini_test' ? 'bg-white border-gray-200' : 'bg-[#1C2541]/40 border-[#3A506B]/50'}`
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
              : "grid grid-cols-1 lg:grid-cols-[minmax(0,1.38fr)_minmax(0,1fr)] gap-6 p-0 h-full flex-1 overflow-hidden"
          }>
            
            {/* LEFT COLUMN: Problem statements and flowcharts
                結果表示では独自スクロール（lg:h-full/overflow-y-auto）を付けず、
                ページ全体のスクロールに任せる。
                ★スマホの1問ごとの答え合わせ（reorderMobile）では、演習画面と同じ
                  「上＝問題文ペイン」として sticky で画面上部に固定する。
                  下の解説をスクロールしても問題文が常に見える（ご要望
                  「解答と解説・問題は一緒に一画面で見える状態で出したい」）。 */}
            <div className={reorderMobile
              ? `sticky ${reviewNav ? 'top-[57px]' : 'top-0'} z-20 min-w-0 bg-white border-b-2 border-gray-200 shadow-md flex flex-col`
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
                <h3 className={`text-base md:text-lg font-bold mb-4 md:mb-6 flex items-center gap-2 ${mode === 'mini_test' ? 'text-emerald-700' : 'text-[#5BC0BE]'}`}>
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
                questions.map((question: any, qIndex: number) => {
                const scorePercentage = calculateScore(question);
                return (
                  <div key={question.id} className="space-y-4 md:space-y-6">
                    {singleQuestionIndex === undefined && (
                      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${mode === 'mini_test' ? 'border-gray-200' : 'border-[#3A506B]/30'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`font-bold px-3 py-1 rounded-full text-xs md:text-sm shadow-sm border ${mode === 'mini_test' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[#5BC0BE]/20 text-[#5BC0BE] border-[#5BC0BE]/30'}`}>
                            Q{(singleQuestionIndex !== undefined ? singleQuestionIndex : rangeOffset + (pagerOn ? (resultPages[safeResultPage]?.qIndex ?? qIndex) : qIndex)) + 1}
                          </div>
                          <div className={`text-left font-bold text-sm md:text-base ${mode === 'mini_test' ? 'text-gray-800' : 'text-[#E0E1DD]'}`}>
                            {question.category || '問題'}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSaveNote(question, qIndex); }}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-colors border ${savingNote[question.id] ? (mode === 'mini_test' ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-[#1C2541] text-[#7A8B99] border-[#1C2541]') : (mode === 'mini_test' ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' : 'bg-[#F9E79F]/20 text-[#F9E79F] border-[#F9E79F]/30 hover:bg-[#F9E79F]/30')}`}
                            disabled={savingNote[question.id]}
                          >
                            <Save size={14} />
                            {savingNote[question.id] ? '保存中...' : 'ノートに保存'}
                          </button>
                          <div className="flex flex-col items-end">
                            <div className={`text-[10px] md:text-xs font-bold mb-0.5 ${mode === 'mini_test' ? 'text-gray-500' : 'text-[#7A8B99]'}`}>あなたの正答率</div>
                            <div className={`font-mono font-bold text-base md:text-lg ${scorePercentage >= 80 ? (mode === 'mini_test' ? 'text-emerald-600' : 'text-[#5BC0BE]') : scorePercentage <= 40 ? (mode === 'mini_test' ? 'text-red-500' : 'text-[#D9A0A0]') : (mode === 'mini_test' ? 'text-amber-500' : 'text-[#F9E79F]')}`}>
                              {scorePercentage}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Problem Restatement
                        表示ルール1・2：左側の「問題文」欄には共通リード文に加えて、
                        続く全小問の設問文を順番に表示する（左側だけで全問いが理解できる）。 */}
                    {/* ★数学章では問題文にも font-math math-content を当てる（ご指摘：
                        「問題文と解答解説での数式の表記が異なっている」）。
                        演習画面（Quiz）の問題文は数式フォント＋拡大表示なのに、
                        解説画面の同じ問題文だけ通常フォントで分数・√の見た目が
                        変わってしまっていた。非数学章は空文字なので従来と同じ見た目。 */}
                    <div className={`${reorderMobile
                      // スマホの1問ごとの答え合わせ：枠なし・演習画面と同じ文字サイズ
                      //（親ペインの text-[15px] leading-[1.85] を継承）。
                      ? ''
                      : 'p-4 rounded-lg border text-sm md:text-base leading-relaxed'}${mathBodyClass} ${
                      mode === 'mini_test' ? (reorderMobile ? 'text-gray-800' : 'bg-white border-gray-200 text-gray-800') : 'bg-[#0B132B]/60 border-[#3A506B]/50 text-[#E0E1DD]/90'
                    }`}>
                      {/* ★英語リスニング：復習用の音源をここに置く。
                          採点直後の画面なので、「聞き取れなかった箇所を
                          スクリプト・和訳つきで聞き直す」導線として最重要の位置。
                          mode='review' でスクリプト／和訳／語句を開けるようにする。 */}
                      {/*
                        ★ご要望8（スマホ・リスニングの解説）★
                          「音源は問題みたいに上の端に寄せて。音源のボタンと問題が上。
                            下は合ってるか間違ってるかとスクリプトを載せて、
                            解説は問1のボタンを押すと出てくる感じで。」

                        ■ 実測した不具合（390x664・el1_A[0]）
                          パネル型（variant='panel' / mode='review'）の
                          「復習用の音源を聞く」が見出し＋説明文＋速度切替＋
                          問Nボタン＋もう1回＋スクリプト＋2回続けて…を
                          縦に積むため、問題文ペインだけで約430px を占有し、
                          ・スクリプトのボタンがペインの折り目で切れる
                          ・採点結果が top=377（画面のほぼ下端）に押し出される
                          ・この単元の思考の型は画面外（測定値 null）
                          という状態だった。

                        ■ 直し方（スマホのみ／PCは従来のパネルのまま）
                          上（問題文ペイン）は横帯の inline に変えて
                          「再生ボタンと問題」だけにする＝上端に寄る。
                          スクリプトは下（採点結果の側）の review プレーヤーへ移す。
                          ご要望どおり「上＝音源＋問題／下＝正誤＋スクリプト」になる。

                        ■ 情報は消さない
                          実測で確認したとおり、選択肢①〜④は問題文の中にしか
                          無いので問題文は削らない（削ると答え合わせができない）。
                          スクリプトも消さず、下に移すだけ。
                      */}
                      {Array.isArray((question as any).audioTracks) &&
                        (question as any).audioTracks.length > 0 && (
                          <ListeningAudioPlayer
                            tracks={(question as any).audioTracks}
                            // スマホは「聞き直す」ボタンだけの横帯（スクリプトは下へ）
                            mode={reorderMobile ? 'practice' : 'review'}
                            variant={reorderMobile ? 'inline' : 'panel'}
                            orientation={reorderMobile ? 'horizontal' : 'vertical'}
                            tone={mode === 'mini_test' ? 'light' : 'dark'}
                            readCount={(question as any).readCount || 2}
                            /* ★ご要望11「パソコン版の方も、スクリプトとかは
                                 絶対に出して欲しい。今たたまれとるけど」★
                               PC はここがパネル型なので、ここを常時展開にする。
                               スマホ側はこの上帯には出さず、下（採点結果の下）の
                               プレーヤーで出す（ご要望「☑️採点結果のしたはスクリプト」）。 */
                            alwaysOpenScript={!reorderMobile}
                            className={reorderMobile ? 'mb-2' : 'mb-4'}
                          />
                        )}
                      {/* 問題文にも Markdown テーブル（実験結果の表など）が含まれるため
                          ExplanationBody を通して本物の <table> で描画する。 */}
                      {/* ★スマホ：小問行を横並びにする（ご要望8）
                          「(1)から4問縦書きになってるけど、横書きにしたら
                            1画面に収まるくない？」

                          解説画面でも演習画面とまったく同じ判定・同じ見た目にする。
                          （実測で、解説画面では (4) が画面外に切れていた）
                          条件は extractInlineQuestionRows に集約してあり、
                          科目ではなく「その問題自身が短いか」で決まる。
                          条件を満たさない問題は null が返るので、下の
                          ExplanationBody（従来の縦積み）にそのまま落ちる。 */}
                      {(() => {
                        /**
                         * ★ご要望11（スマホ・リスニングの解説）★
                         *   「第1問Aではから続く文章は要らんくて、
                         *     問題ページの^問題はいらないよね。
                         *     ここには上半分に音源(ボタン小さくして)と問題を入れて」
                         *   「一画面に収める＋受験生は何をみたいか
                         *     → 文章(スクリプト・正誤)をまずみたい
                         *       (選択肢は問題に戻れば見れる・
                         *        選択肢まで解説の方に書くとおそらく文字が収まりきらない)
                         *     → その後に解説を読みたい」
                         *
                         * ■ 何を出さないか（＝ここで削るもの）
                         *   (a) 「第1問 A では、短い英文が2回読まれます。…」の形式説明
                         *       … 解いた直後の人が読み返す情報ではない。
                         *   (b) 「【音源の聞き方】…」の操作説明
                         *       … 音源ボタンはすぐ上にあるので、説明は要らない。
                         *   (c) 選択肢 ①〜④ の一覧
                         *       … ご指摘どおり、選択肢を解説側に全部書くと
                         *         4問×4択＝16行になり1画面に収まらない。
                         *         選択肢は「問題に戻れば見れる」のでここには出さない。
                         *
                         * ■ 何を残すか
                         *   各問の設問文（問1 傘について、話者の状況に最も近い英文）だけ。
                         *   これは「何を問われたか」の思い出しに必要で、かつ1行に収まる。
                         *   スクリプト・正誤・解説は下（採点結果以降）が担当する。
                         *
                         * ■ 科目名で決め打ちしない
                         *   「英文の音源を持つ問題（audioTracks）で、かつ
                         *     問題文が『問N ＋ ①〜④』の形をしている」という
                         *   問題データ自身の形で判定する。
                         *   形が違う問題（第1問Bの図選択など）はこの分岐に入らず、
                         *   従来どおりの描画にそのまま落ちる。
                         */
                        const listeningRows = reorderMobile && isEnglishChapter
                          ? extractListeningQuestionRows(question)
                          : null;
                        if (listeningRows) {
                          return (
                            <ul className="flex flex-col gap-1">
                              {listeningRows.map((row, ri) => {
                                // 英文法：設問名（「be 動詞以外の SVC」）より、空所つきの英文そのものを出す
                                const sentence = findSubQuestionSentence(question, (question.subQuestions || [])[ri]);
                                return (
                                <li key={row.marker} className="flex items-baseline gap-1.5">
                                  <span className="shrink-0 font-bold text-gray-500">
                                    {row.marker}
                                  </span>
                                  <span className="min-w-0 whitespace-pre-line break-words [overflow-wrap:anywhere]">
                                    {formatText(sentence || row.body, [], { prose: true })}
                                  </span>
                                </li>
                                );
                              })}
                            </ul>
                          );
                        }
                        const inline = reorderMobile
                          ? extractInlineQuestionRows(cleanQuestionText(question.text))
                          : null;
                        if (!inline) {
                          return (
                            <ExplanationBody
                              text={cleanQuestionText(question.text)}
                              tone={mode === 'mini_test' ? 'light' : 'dark'}
                              prose={isEnglishChapter}
                            />
                          );
                        }
                        return (
                          <div className="flex flex-col gap-1.5">
                            {inline.lead && (
                              <ExplanationBody
                                text={inline.lead}
                                tone={mode === 'mini_test' ? 'light' : 'dark'}
                                prose={isEnglishChapter}
                              />
                            )}
                            {/* grid ではなく flex-wrap（想定より長い項目が来ても
                                折り返すだけで、はみ出し・文字切れにならない） */}
                            <ul className="flex flex-wrap gap-x-2 gap-y-1.5">
                              {inline.rows.map((row, rIdx) => (
                                <li
                                  key={rIdx}
                                  className="flex min-w-0 grow basis-[calc(50%-0.25rem)] items-baseline gap-1"
                                >
                                  {row.marker && (
                                    <span className="shrink-0 font-bold text-gray-500">
                                      {formatText(row.marker)}
                                    </span>
                                  )}
                                  {/* 英語は散文として組む（化学式扱いのセリフ体を避ける） */}
                                  <span className="min-w-0">{formatText(row.body, [], { prose: isEnglishChapter })}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })()}
                      {question.text.includes('図6') && (
                        <div className="mt-4">
                          <IonizationEnergyChart showDetails={true} />
                        </div>
                      )}
                      {/* 問題に付随する図・イラスト（PDF由来の図版など） */}
                      {(question as any).imageUrl && (
                        <QuestionFigure
                          src={(question as any).imageUrl}
                          caption={(question as any).imageCaption}
                          figureNumber={getFigureNumber(figureNumberMap, (question as any).id)}
                          tone={mode === 'mini_test' ? 'light' : 'dark'}
                          className="mt-4"
                        />
                      )}

                      {/*
                        全小問の設問文一覧。

                        ★ご要望「設問一覧と問題が同じなので、同じやつはもう設問一覧いらない」★
                        ただし「数学なら消す」という決め打ちはしない。
                        全306問を走査すると、重複の有無は科目では決まらなかった
                        （数学にも重複しない問題が6件、化学基礎にも完全重複が30件ある）。
                        いちばん危険なのは「一部だけ重複」41件で、一覧ごと消すと
                        問題文に載っていない設問が読めなくなる。
                        そこで isSubQuestionListRedundant() で
                        「一覧の全項目が問題文にある問題」だけを対象にする。

                        またスマホ限定にする（PC は従来どおり一覧を出す）。
                        スマホは高さが足りないので重複を削る価値が大きいが、
                        PC は横に余裕があり、ご要望も「パソコン版は何も変更しないでね」。
                      */}
                      {(() => {
                        const sqList = buildSubQuestionList(question);
                        if (sqList.length === 0) return null;
                        if (reorderMobile && isSubQuestionListRedundant(question)) return null;
                        /* ★ご要望11★ スマホのリスニングでは、上の「問題」ブロックが
                           すでに同じ設問文（問1 傘について…）を出しているので、
                           ここで「設問一覧」を出すと同じ文字が2回並ぶ。
                           「一画面に収める」ためにも、重複する側を出さない。 */
                        if (reorderMobile && isEnglishChapter && extractListeningQuestionRows(question)) return null;
                        return (
                          <div className={`mt-4 pt-3 border-t border-dashed ${mode === 'mini_test' ? 'border-gray-300' : 'border-[#3A506B]'}`}>
                            <div className={`text-[11px] font-bold mb-2 flex items-center gap-1.5 ${mode === 'mini_test' ? 'text-gray-500' : 'text-[#7A8B99]'}`}>
                              <ListOrdered size={13} />
                              <span>設問一覧</span>
                            </div>
                            <ol className="space-y-2">
                              {sqList.map((item, sIdx) => (
                                <li key={sIdx} className="flex items-start gap-2">
                                  {item.marker && (
                                    <span className={`shrink-0 font-bold text-xs px-2 py-0.5 rounded-md border mt-0.5 ${
                                      mode === 'mini_test' ? 'bg-gray-50 text-gray-600 border-gray-200' : 'bg-[#0B132B] text-[#A9CCE3] border-[#3A506B]'
                                    }`}>
                                      {formatText(item.marker)}
                                    </span>
                                  )}
                                  <span className="min-w-0 leading-relaxed">
                                    {formatText(item.body, [], { prose: isEnglishChapter })}
                                  </span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })
              ) : null}
              </div>
              
              {/* Flowchart (Logical Tree) - 問題文の下に表示（左カラム内）。
                  ※ 専用のフローチャートが用意されている章のみ表示する。
                     （c5 酸と塩基 / c6 酸化還元 などは専用ツリーが無いため、別単元のツリーを誤表示しない）
                  ※ スマホの1問ごとの答え合わせ（reorderMobile）では、採点結果の後ろ（order-3）に
                     別途表示するため、ここ（左カラム内）では表示しない。 */}
              {!reorderMobile && flowchartBlock}
            </div>

            {/* RIGHT COLUMN: Answers, grading, and explanations
                （スマホの1問ごとの答え合わせでは問題文ペインの下＝下ペインとして表示） */}
            <div className={`space-y-6 lg:pl-4 lg:pr-4 min-w-0 ${reorderMobile
              // 下部固定ナビ（問題に戻る/次の問題へ）に最後のカードが隠れない
              // よう、下余白を大きめに取る。
              ? 'order-2 px-3 pt-3 pb-[calc(6rem+env(safe-area-inset-bottom))]'
              : 'pb-8'} ${isResultView ? '' : 'lg:overflow-y-auto lg:h-full'}`}>
              {questions.length > 0 ? (
                questions.map((question: any, qIndex: number) => {
                return (
                  <div key={`right-${question.id}`} className={reorderMobile ? 'space-y-2' : 'space-y-6'}>
                    <div className={reorderMobile ? 'space-y-2' : 'space-y-6 md:space-y-8'}>
                      {(() => {
                        const selfGradeSqs = question.subQuestions.filter((sq: any) => sq.type === 'descriptive');
                        // 客観問題は「元の並び順（ア→イ→ウ…）」のまま表示する。
                        // （以前は間違いを上・正解を折りたたみにしていたが、丸付けは上から順に行うため自然な並び順に統一）
                        const objectiveSqs = question.subQuestions.filter((sq: any) => sq.type !== 'descriptive');

                        /* ★B-2：音源・スクリプトを変数に束ねる（描く場所を出し分けるため）★
                           スマホでは正誤ボタンの後、PC では従来位置で描く。
                           中身はそのまま。詳しくは下の使用箇所のコメントを参照。 */
                        const listeningTracks: any[] = textTracksOf(question);
                        const optionTextsBySq = buildListeningOptionTexts(allQuestions.find((q: any) => q?.id === question?.id) ?? question);
                        const audioPlayerBlock = Array.isArray((question as any).audioTracks) &&
                                  (question as any).audioTracks.length > 0 && (
                                    <ListeningAudioPlayer
                                      tracks={(question as any).audioTracks}
                                      mode={reorderMobile ? 'review' : 'practice'}
                                      variant={reorderMobile ? 'panel' : 'inline'}
                                      /* ★スマホだけ compact★
                                         panel をそのまま出すと約430px あり、
                                         採点結果の下にこれが入るだけで
                                         問Nチップ（top=746）と「この単元の思考の型」が
                                         画面外に落ちていた（実測）。
                                         compact はスクリプトを残したまま
                                         バッジ・サブ文・もう1回・2回続けて行を省く。
                                         PC は compact を渡さないので不変。 */
                                      compact={reorderMobile}
                                      orientation="horizontal"
                                      tone={mode === 'mini_test' ? 'light' : 'dark'}
                                      readCount={(question as any).readCount || 2}
                                      /* ★ご要望11「スクリプトを押さなくても直で下に出てるようにしたい」
                                           「☑️採点結果のしたはスクリプトってことね」★
                                         スマホはここが採点結果の直下なので、
                                         ボタンを押さずに最初からスクリプトを見せる。
                                         受験生が最初に見たいのは「読まれた英文そのもの」であり、
                                         そこが1タップ隠れているのは順序が逆だった、というご指摘への対応。 */
                                      alwaysOpenScript={reorderMobile}
                                    />
                                  );
                        // 「解いていない問」を「不正解」に混ぜない。
                        // 未解答＝手を付けていないだけであり、間違えたわけではない。
                        const correctSqs = objectiveSqs.filter((sq: any) => isAnswerCorrect(sq, answers[sq.id]));
                        const incorrectSqs = objectiveSqs.filter(
                          (sq: any) => isAttempted(answers[sq.id]) && !isAnswerCorrect(sq, answers[sq.id]),
                        );
                        const unansweredSqs = objectiveSqs.filter((sq: any) => !isAttempted(answers[sq.id]));

                        // ─────────────────────────────────────────────
                        // 各小問は、常時表示する採点結果の直下に
                        //   1. 解説
                        //   2. 思考手順・答えの核心
                        // の独立したアコーディオンを並べる。
                        //
                        // 解説本文は既存の機械可読マーカーで切り分けるだけで、
                        // 教材本文の表現や順番は変更しない。小問固有の本文は各「解説」へ、
                        // common/shared は大問末尾へ1回だけ配置し、重複と情報欠落を防ぐ。
                        const enhancedText: string =
                          (question as any).explanationSupplement || question.explanation || '';
                        const questionSlices = sliceEnhancedByQuestion(enhancedText);
                        // 小問（(ア)/(1)/a …）単位の切り出し。
                        // 教材データのラベルは「問N」形式が少数派で、これが無いと
                        // 全174大問のうち9割でアコーディオンを開いても解説が出てこなかった。
                        const subSlices = sliceEnhancedBySubQuestion(enhancedText);
                        const sliceForSq = (sq: any): string => {
                          // 小問マーカーがある教材では、その小問自身の本文だけを返す。
                          // common/shared は下で1回だけ表示し、各小問へ重複させない。
                          if (subSlices) {
                            const key = String(sq?.id ?? '');
                            return subSlices.subs
                              .filter((item) => item.id === key)
                              .map((item) => item.body)
                              .join('\n');
                          }

                          // 旧形式の「問N」マーカーにも対応する。
                          if (questionSlices) {
                            const key = questionGroupKey(sq?.label);
                            if (!key) return '';
                            return questionSlices.groups
                              .filter((group) => group.key === key)
                              .map((group) => group.text)
                              .join('\n');
                          }

                          // マーカーを持たない従来教材は、本文を削らずそのまま解説へ入れる。
                          return enhancedText;
                        };

                        const sharedExplanationRaw = subSlices
                          ? [subSlices.common, subSlices.shared].filter((part) => part.trim()).join('\n')
                          : questionSlices?.common || '';
                        // ★問ごと表示（focusSubQuestionId）のときは、共通解説の
                        //   「解 答」一覧から他の問の答えを除く（ネタバレ防止）。
                        //   ご指摘：「問1の問題なのになぜ右側の共通ポイントの
                        //   ところに問4までの答えがあるのか」
                        const sharedExplanation = focusSubQuestionId
                          ? scopeListeningCommonToQuestion(
                              sharedExplanationRaw,
                              listeningQuestionNumberOf((question.subQuestions || [])[0]),
                            )
                          : sharedExplanationRaw;

                        const renderSq = (sq: any, isCorrect: boolean) => {
                        // 手を付けていない問は「不正解」ではなく「未解答」として
                        // 灰色系の落ち着いた表示にする（赤い✕を出さない）。
                        const attempted = isAttempted(answers[sq.id]);
                        const isUnanswered = sq.type !== 'descriptive' && !attempted;
                        // ★PC（画面に余裕がある）では最初から開いておく（2026-10-04 ご要望）★
                        //   閉じたら閉じたまま（利用者の操作を優先）。スマホは従来どおり閉じて始める。
                        const explanationOpen = openExplanationBySq[sq.id] ?? !isMobile;
                        const thinkingOpen = openThinkingBySq[sq.id] ?? !isMobile;
                        // ★スクリプト（英文＋和訳）を上に出しているときは、解説の中の同じ英文の枠は出さない（2026-10-04 ご要望）★
                        const sqSliceRaw = sliceForSq(sq);
                        const isScriptFirst = isScriptFirstExplanation(sqSliceRaw);
                        const sqSlice = listeningTracks.length > 0 ? stripScriptBox(sqSliceRaw) : sqSliceRaw;
                        const relatedSteps = getRelatedSteps(sq.id, question);
                        const sqIndex = ((question?.subQuestions || []) as any[]).indexOf(sq);
                        const displayLabel = answerCardMarker(sq, sqIndex < 0 ? 0 : sqIndex, question);
                        const hasThinking = Boolean(
                          sq.detailedExplanation?.theme ||
                          sq.detailedExplanation?.steps?.length ||
                          relatedSteps.length > 0,
                        );

                        const thinkingBody = hasThinking ? (
                          <div className={`border-t p-4 md:p-5 space-y-4 ${mode === 'mini_test' ? 'border-amber-200 bg-amber-50/40' : 'border-[#F9E79F]/30 bg-[#F9E79F]/5'}`}>
                            {sq.detailedExplanation?.theme && (
                              <div>
                                <h5 className={`font-bold mb-1.5 flex items-center gap-1.5 ${mode === 'mini_test' ? 'text-amber-700' : 'text-[#F9E79F]'}`}>
                                  <KeyRound size={15} />
                                  <span>答えの核心（ここだけは押さえる）</span>
                                  {isPracticeMode && (
                                    <span className="ml-auto text-[10px] font-bold opacity-80">
                                      難易度 {'★'.repeat(getDifficulty(sq.id)) + '☆'.repeat(5 - getDifficulty(sq.id))}
                                    </span>
                                  )}
                                </h5>
                                <p className={`font-bold leading-relaxed ${mode === 'mini_test' ? 'text-gray-800' : 'text-[#E0E1DD]'}`}>
                                  {formatText(sq.detailedExplanation.theme)}
                                </p>
                              </div>
                            )}

                            {!isScriptFirst && isPracticeMode && sq.detailedExplanation?.steps?.length > 0 && (
                              <div>
                                <h5 className={`font-bold mb-2 flex items-center gap-1.5 ${mode === 'mini_test' ? 'text-emerald-700' : 'text-[#5BC0BE]'}`}>
                                  <Target size={15} />
                                  <span>正解までの道すじ</span>
                                </h5>
                                <ol className="list-none space-y-2">
                                  {sq.detailedExplanation.steps.map((step: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2.5">
                                      <span className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${mode === 'mini_test' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-[#5BC0BE]/20 text-[#5BC0BE] border border-[#5BC0BE]/40'}`}>
                                        {idx + 1}
                                      </span>
                                      {/* 書体は直書きせず土台から継承する（(C) 書体統一）。
                                          数式の単元では mathBodyClass が font-math を足す。 */}
                                      <span className={`leading-relaxed min-w-0${mathBodyClass}`}>{formatText(step)}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}

                            {!isCorrect && isPracticeMode && relatedSteps.length > 0 && (
                              <div className={`p-3 rounded-lg border ${mode === 'mini_test' ? 'bg-blue-50/60 border-blue-200' : 'bg-[#A9CCE3]/10 border-[#A9CCE3]/30'}`}>
                                <h5 className={`font-bold mb-2 text-xs ${mode === 'mini_test' ? 'text-blue-700' : 'text-[#A9CCE3]'}`}>
                                  間違えた原因はここ — 関連ステップを復習
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {relatedSteps.map((stepInfo, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        setExpandedNodeId(stepInfo.id);
                                        setExpandedStep(stepInfo.label);
                                        setScrollTrigger(prev => prev + 1);
                                      }}
                                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-slate-300 flex items-center gap-1 cursor-pointer"
                                    >
                                      <Network size={14} className="text-[#34495E]" />
                                      {formatText(stepInfo.step ? `Step ${stepInfo.step}の「${stepInfo.label}」を復習する` : `「${stepInfo.label}」を復習する`)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : null;

                        return (
                          <div
                            id={`sq-${sq.id}`}
                            key={sq.id}
                            className={`rounded-xl border overflow-hidden shadow-sm ${
                              sq.type === 'descriptive'
                                ? (mode === 'mini_test' ? 'border-blue-200' : 'border-[#A9CCE3]/30')
                                : isCorrect
                                  ? (mode === 'mini_test' ? 'border-emerald-200' : 'border-[#5BC0BE]/30')
                                  : isUnanswered
                                    ? (mode === 'mini_test' ? 'border-gray-200' : 'border-[#3A506B]/40')
                                    : (mode === 'mini_test' ? 'border-red-200' : 'border-[#D9A0A0]/30')
                            }`}
                          >
                            {/* 正誤・自分の解答・正解は、アコーディオンに入れず常に表示する。 */}
                            <div className={`p-3 md:p-4 space-y-3 ${answerBoxBaseClass} ${
                              sq.type === 'descriptive'
                                ? (mode === 'mini_test' ? 'bg-blue-50' : 'bg-[#A9CCE3]/10')
                                : isCorrect
                                  ? (mode === 'mini_test' ? 'bg-emerald-50' : 'bg-[#5BC0BE]/10')
                                  : isUnanswered
                                    ? (mode === 'mini_test' ? 'bg-gray-50' : 'bg-[#0B132B]/30')
                                    : (mode === 'mini_test' ? 'bg-red-50' : 'bg-[#D9A0A0]/10')
                            }`}>
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`font-bold text-xs md:text-sm px-3 py-1.5 rounded-xl border shadow-xs ${mode === 'mini_test' ? 'text-gray-700 bg-white border-gray-200' : 'text-[#E0E1DD] bg-[#0B132B]/50 border-[#3A506B]/50'}`}>
                                    {formatText(displayLabel)}
                                  </div>
                                  {sq.type === 'descriptive' ? (
                                    <div className={`text-xs md:text-sm font-bold flex items-center gap-1 ${mode === 'mini_test' ? 'text-blue-600' : 'text-[#A9CCE3]'}`}>
                                      <Edit3 size={16} />
                                      <span>記述問題</span>
                                    </div>
                                  ) : isUnanswered ? (
                                    <div className={`flex items-center gap-1.5 font-bold text-sm ${mode === 'mini_test' ? 'text-gray-500' : 'text-[#7A8B99]'}`}>
                                      <Circle size={18} />
                                      <span>未解答 — まだ解いていない問です</span>
                                    </div>
                                  ) : (
                                    <div className={`flex items-center gap-1.5 font-bold text-sm ${isCorrect ? (mode === 'mini_test' ? 'text-emerald-700' : 'text-[#5BC0BE]') : (mode === 'mini_test' ? 'text-red-600' : 'text-[#D9A0A0]')}`}>
                                      {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                                      <span>{isCorrect ? '正解！' : '不正解 — ここが伸びしろ'}</span>
                                    </div>
                                  )}
                                </div>
                                <div className={`font-bold text-sm md:text-base${mathBodyClass} ${mode === 'mini_test' ? 'text-gray-800' : 'text-[#E0E1DD]'}`}>
                                  <span className={`text-xs mr-1 font-modern ${mode === 'mini_test' ? 'text-gray-500' : 'text-[#7A8B99]'}`}>
                                    {sq.type === 'descriptive' ? '模範解答:' : '正解:'}
                                  </span>
                                  {formatText(sq.correctAnswer)}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <div className={`text-[10px] md:text-xs mb-1 ${mode === 'mini_test' ? 'text-gray-500' : 'text-[#7A8B99]'}`}>あなたの解答</div>
                                  <div className={`font-bold text-sm md:text-base p-3 rounded-lg border break-words whitespace-pre-wrap ${
                                    sq.type === 'descriptive'
                                      ? (mode === 'mini_test' ? 'bg-white border-blue-200 text-gray-800' : 'bg-[#1C2541]/50 border-[#A9CCE3]/30 text-[#E0E1DD]')
                                      : isCorrect
                                        ? (mode === 'mini_test' ? 'bg-white border-emerald-200 text-emerald-700' : 'bg-[#5BC0BE]/10 border-[#5BC0BE]/30 text-[#5BC0BE]')
                                        : isUnanswered
                                          ? (mode === 'mini_test' ? 'bg-white border-gray-200 text-gray-400' : 'bg-[#0B132B]/40 border-[#3A506B]/40 text-[#7A8B99]')
                                          : (mode === 'mini_test' ? 'bg-white border-red-200 text-red-600 line-through opacity-80' : 'bg-[#D9A0A0]/10 border-[#D9A0A0]/30 text-[#D9A0A0] line-through opacity-80')
                                  }${mathBodyClass}`}>
                                    {formatText(answers[sq.id] || '未解答')}
                                    {/* 2026-10-08 絵の問題：選んだ絵のコマも出す（記号だけでは復習で何の絵か分からない） */}
                                    {(() => { const oi = Array.isArray(sq.options) ? sq.options.indexOf(String(answers[sq.id] ?? '')) : -1; const pic = pictureCellOf(sq, oi, sq.options?.length ?? 0); return pic ? <span className="lx-answer-pic" role="img" aria-label="あなたが選んだイラスト" style={pic} /> : null; })()}
                                  </div>
                                </div>
                                <div>
                                  <div className={`text-[10px] md:text-xs mb-1 ${mode === 'mini_test' ? 'text-gray-500' : 'text-[#7A8B99]'}`}>{sq.type === 'descriptive' ? '模範解答' : '正解'}</div>
                                  {/*
                                    ★「正解」と「自分の解答」で書体が違っていた★
                                    ご要望「化学基礎・化学含め様々な科目で解答解説と
                                            問題のフォントがあっていないので
                                            問題のフォントに合わせて。」

                                    実測（390x844・化学基礎「ろ過」）で、この2つは
                                    左右に並んでいるのに
                                      自分の解答 … Inter（mathBodyClass が '' で継承）
                                      正解       … STIX Two Math（font-math を直書き）
                                    と別書体だった。「固体と液体の混合物」という
                                    日本語の記述解答が数式書体（セリフ体）で出ていた。

                                    直書きをやめて、隣の「自分の解答」と同じ
                                    mathBodyClass に揃える。数式の単元だけ font-math が
                                    付き、それ以外は土台（font-modern）を継承する。
                                  */}
                                  <div className={`font-bold text-sm md:text-base p-3 rounded-lg border break-words${mathBodyClass} ${mode === 'mini_test' ? 'text-emerald-700 bg-white border-emerald-200' : 'text-[#5BC0BE] bg-[#5BC0BE]/10 border-[#5BC0BE]/30'}`}>
                                    {formatText(sq.correctAnswer)}
                                    {(() => { const oi = Array.isArray(sq.options) ? sq.options.indexOf(String(sq.correctAnswer ?? '')) : -1; const pic = pictureCellOf(sq, oi, sq.options?.length ?? 0); return pic ? <span className="lx-answer-pic" role="img" aria-label="正解のイラスト" style={pic} /> : null; })()}
                                  </div>
                                </div>
                              </div>

                              {sq.group && (
                                <div className="text-xs font-semibold">
                                  {isGroupAllCorrect(sq, question) ? (
                                    <span className="text-emerald-600">この式全体の係数はすべて正解です（完答○）</span>
                                  ) : (
                                    <span className="text-amber-600">反応式のすべての係数が一致したときのみ完答となります</span>
                                  )}
                                </div>
                              )}
                            </div>

                            {sq.type === 'descriptive' && (
                              <div className={`p-3 md:p-4 border-t ${mode === 'mini_test' ? 'bg-white border-blue-200' : 'bg-[#1C2541]/50 border-[#A9CCE3]/30'}`}>
                                <div className={`text-xs md:text-sm font-bold mb-3 flex items-center gap-2 ${mode === 'mini_test' ? 'text-blue-600' : 'text-[#A9CCE3]'}`}>
                                  <CheckSquare size={16} />
                                  <span>自己採点チェック（部分点基準）</span>
                                </div>
                                <div className="space-y-2">
                                  {resolveGradingCriteria(sq).map((criteria: string, cIdx: number) => {
                                    const criteriaId = `${sq.id}_${cIdx}`;
                                    const isChecked = selfGrades[criteriaId] || false;
                                    return (
                                      <label key={cIdx} className="flex items-start gap-2 cursor-pointer group py-1" onClick={() => toggleGrade(criteriaId)}>
                                        <span className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isChecked ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}`}>
                                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                        </span>
                                        <span className={`text-xs md:text-sm leading-tight ${isChecked ? (mode === 'mini_test' ? 'text-gray-800' : 'text-[#E0E1DD]') : 'text-[#7A8B99]'}`}>
                                          {formatText(criteria)}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <div className={`border-t p-2.5 space-y-2 ${mode === 'mini_test' ? 'bg-white border-gray-200' : 'bg-[#0B132B]/30 border-[#3A506B]/30'}`}>
                              <button
                                type="button"
                                onClick={() => setOpenExplanationBySq(prev => ({ ...prev, [sq.id]: !explanationOpen }))}
                                aria-expanded={explanationOpen}
                                className={`w-full flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left font-bold ${mode === 'mini_test' ? 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100' : 'bg-[#A9CCE3]/15 border-[#A9CCE3]/30 text-[#A9CCE3]'}`}
                              >
                                <span className="flex items-center gap-2"><BookOpen size={16} />解説</span>
                                <ChevronDown size={18} className={`transition-transform ${explanationOpen ? 'rotate-180' : ''}`} />
                              </button>
                              {explanationOpen && (
                                <div className={`rounded-lg border p-3 md:p-4 ${explBodyBaseClass} ${mode === 'mini_test' ? 'bg-sky-50/40 border-sky-100' : 'bg-[#0B132B]/60 border-[#A9CCE3]/20'}`}>
                                  {sqSlice.trim() ? (
                                    <ExplanationBody
                                      text={sqSlice}
                                      tone={mode === 'mini_test' ? 'light' : 'dark'}
                                      prose={isEnglishChapter}
                                      className={`${explBodyFontClass} ${mode === 'mini_test' ? 'text-gray-700' : 'text-[#E0E1DD]/90'}`}
                                    />
                                  ) : (
                                    <p className="text-xs text-gray-500">この小問の解説は「思考手順・答えの核心」にまとめています。</p>
                                  )}
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => setOpenThinkingBySq(prev => ({ ...prev, [sq.id]: !thinkingOpen }))}
                                aria-expanded={thinkingOpen}
                                className={`w-full flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left font-bold ${mode === 'mini_test' ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' : 'bg-[#F9E79F]/10 border-[#F9E79F]/30 text-[#F9E79F]'}`}
                              >
                                <span className="flex items-center gap-2"><KeyRound size={16} />思考手順・答えの核心</span>
                                <ChevronDown size={18} className={`transition-transform ${thinkingOpen ? 'rotate-180' : ''}`} />
                              </button>
                              {thinkingOpen && (thinkingBody || (
                                <div className="border-t p-4 text-xs text-gray-500">詳しい解説は上の「解説」にまとめています。</div>
                              ))}
                            </div>

                            {sq.partialCreditCriteria && (
                              <div className={`border-t text-[10px] md:text-xs p-3 flex items-start gap-2 ${mode === 'mini_test' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-[#F9E79F]/10 text-[#F9E79F] border-[#F9E79F]/30'}`}>
                                <AlertCircle className="shrink-0 mt-0.5 w-4 h-4" />
                                <span className="leading-relaxed">{formatText(sq.partialCreditCriteria)}</span>
                              </div>
                            )}
                          </div>
                        );
                        };

                        return (
                          <>
                            {selfGradeSqs.length > 0 && (
                              <div className="space-y-3 md:space-y-4">
                                <h4 className={`font-bold flex items-center gap-2 ${mode === 'mini_test' ? 'text-blue-600' : 'text-[#A9CCE3]'}`}>
                                  <Edit3 size={18} />
                                  <span>記述問題（自己採点）</span>
                                </h4>
                                {selfGradeSqs.map(sq => renderSq(sq, false))}
                              </div>
                            )}

                            {/* 客観問題が無い大問（記述のみ）でも、要件①の型は必ず1回出す */}
                            {qIndex === 0 && objectiveSqs.length === 0 && kataAccordion && (
                              <div className="mt-6">{kataAccordion}</div>
                            )}

                            {objectiveSqs.length > 0 && (
                              <div className={`${reorderMobile ? 'space-y-2' : 'space-y-3 md:space-y-4'} ${reorderMobile && textTracksOf(question).length > 0 ? 'mt-0' : 'mt-6'}`}>
                                {/*
                                  見出し：採点結果（正誤の内訳を小さく併記）

                                  ★ご要望8★
                                    「採点結果みたいなところと正解不正解とかも
                                      無くすのではなくて、小さくコンパクトにする」
                                    「☑️採点結果の右に、正解・不正解・未解答・
                                      フローチャートのボタンを持ってくる」

                                  右側の並び（正解/不正解/未解答＋フローチャート）は
                                  すでにこの1行に入っている。スマホではさらに
                                    ・flex-wrap を外して必ず1行に収める（min-w-0＋truncate）
                                    ・見出し 16px→13px、アイコン 18→15
                                    ・内訳 text-xs→text-[10px]
                                  として高さを詰める。項目は1つも消さない。
                                  PC（!reorderMobile）は従来のクラスをそのまま使う。
                                */}
                                <div data-score-head className={`flex items-center justify-between gap-2 ${reorderMobile ? '' : 'flex-wrap'}`} data-lx-single={(reorderMobile && listeningTracks.length > 0 && objectiveSqs.length <= 1) || undefined}>
                                  <h4 className={`font-bold flex items-center ${reorderMobile ? 'min-w-0 gap-1.5 text-[13px]' : 'gap-2'} ${mode === 'mini_test' ? 'text-gray-700' : 'text-[#E0E1DD]'}`}>
                                    <CheckCircle2 size={reorderMobile ? 15 : 18} className={`${reorderMobile ? 'shrink-0 ' : ''}${mode === 'mini_test' ? 'text-emerald-600' : 'text-[#5BC0BE]'}`} />
                                    <span className={reorderMobile ? 'truncate' : ''}>採点結果</span>
                                  </h4>
                                  <div className={`flex items-center ${reorderMobile ? 'shrink-0 gap-1.5' : 'gap-2'}`}>
                                    {/* 問が1つだけのリスニングでは、下の「問1 不正解 ①→②」と同じ内容になるので出さない（同じものを2つ置かない） */}
                                    {!(reorderMobile && listeningTracks.length > 0 && objectiveSqs.length <= 1) && <span className={`font-bold ${reorderMobile ? 'whitespace-nowrap text-xs' : 'text-xs'} ${mode === 'mini_test' ? 'text-gray-500' : 'text-[#7A8B99]'}`}>
                                      <span className={mode === 'mini_test' ? 'text-emerald-600' : 'text-[#5BC0BE]'}>正解 {correctSqs.length}</span>
                                      <span className="mx-1 opacity-50">/</span>
                                      <span className={mode === 'mini_test' ? 'text-red-500' : 'text-[#D9A0A0]'}>不正解 {incorrectSqs.length}</span>
                                      {unansweredSqs.length > 0 && (
                                        <>
                                          <span className="mx-1 opacity-50">/</span>
                                          <span className={mode === 'mini_test' ? 'text-gray-400' : 'text-[#7A8B99]'}>未解答 {unansweredSqs.length}</span>
                                        </>
                                      )}
                                    </span>}
                                    {/* ★スマホ：学習フローチャートの切り替えボタン。
                                        「フローチャートは消したくない＋邪魔にならない位置に
                                          切り替えのボタンを設置」（ご要望）。
                                        常設表示はせず、このチップで開閉する。 */}
                                    {reorderMobile && flowchartBlock && (
                                      <button
                                        type="button"
                                        onClick={() => setShowFlowchart(v => !v)}
                                        aria-expanded={showFlowchart}
                                        aria-label={`学習フローチャートを${showFlowchart ? '閉じる' : '開く'}`}
                                        /* コンパクト化：ラベルは残し、余白と字だけ詰める。
                                           「正解/不正解/未解答」と同じ行に必ず収めたい。 */
                                        className={`flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap transition-colors ${
                                          showFlowchart
                                            ? 'bg-[#2C3E50] border-[#2C3E50] text-white'
                                            : 'bg-white border-gray-300 text-gray-600 active:bg-gray-50'
                                        }`}
                                      >
                                        <Network size={12} />
                                        フローチャート
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* 要件①：「この単元の思考の型」を採点結果の直後に1回だけ（折りたたみ） */}
                                {qIndex === 0 && kataAccordion}

                                {/* ★リスニング：採点結果のすぐ下でも音声を聞き直せるようにする
                                    （ご要望「解答等解説のところで、音声が聞けるようにボタンを用意してほしい」）。
                                    左の問題文ペインにもプレーヤーはあるが、スマホでは
                                    解説（右カラム相当）が先に表示され、左まで戻るのが遠い。
                                    答え合わせ→もう一度聞く、の動線を1タップにする。
                                    horizontal の帯型なので縦スペースをほぼ取らない。 */}
                                {/*
                                  ★ご要望8：スクリプトは「下」に置く★
                                    「下は合ってるか間違ってるかとスクリプトを載せて」

                                  スマホでは上の問題文ペインを inline（再生ボタンだけ）に
                                  したので、スクリプト・和訳はこちらの review プレーヤーが
                                  受け持つ。パネル型にすると採点結果の直下で
                                  スクリプトを開けるようになり、
                                  「正誤 → スクリプトで確認」が同じ場所で完結する。
                                  PC は従来どおり横帯の practice（上のパネルが review）。
                                */}
                                {/*
                                  ★B-2：音源・スクリプトの「置く場所」だけをスマホで下げる★
                                  ─────────────────────────────────────────────────────
                                  ご指摘：
                                    「採点結果のところ → 問3 って書いてあるところに
                                      問3◯ を持ってきてコンパクトにする」

                                  ■ 何が起きていたか（スマホの並び順）
                                    1. 採点結果（正解0 / 不正解0 / 未解答1）
                                    2. 音源・スクリプト（★ここがいちばん背が高い★）
                                    3. 問3 ○ の正誤ボタン
                                    4. 「上の正誤ボタンをタップすると…」の案内文

                                    採点結果と正誤ボタンの間に、最も背の高いブロックが
                                    丸ごと挟まっていた。そのため
                                      ・採点結果を見てから正誤ボタンを押すまでにスクロールが必要
                                      ・案内文が「上の正誤ボタン」と書いているのに、
                                        その"上"が画面外にある
                                    という状態になっていた。

                                  ■ 直し方（★PC を壊さないための形★）
                                    JSX を変数 audioPlayerBlock に束ね、
                                      ・スマホ（reorderMobile）… 正誤ボタンの「後」で描く
                                      ・PC                      … 従来どおり「ここ」で描く
                                    と描く場所だけを出し分ける。

                                    ここを単純に移動させると、移動先が reorderMobile の
                                    true 分岐の中なので PC 版でプレーヤーが消えてしまう
                                    （＝「パソコン版は何も変更しない」に反する）。
                                    実際に一度その形にしてしまい、PC で消えることに
                                    気づいたのでこの形に直している。

                                    プレーヤーに渡す設定（compact / alwaysOpenScript など）は
                                    一切変えていない。並べ替えだけで、項目は1つも消していない。
                                */}
                                {!reorderMobile && audioPlayerBlock}

                                {/* ★スマホの1問ごとの答え合わせ：
                                      「全ての問いのあってるか間違ってるかだけ出して、
                                       その正誤ボタンを押したらその問の解答と解説が出る」
                                    （ご要望）。緑＝正解・赤＝不正解（従来どおりの色）・
                                    灰＝未解答のチップを一覧で並べ、タップした問だけ
                                    詳細カード（解答・解説）を下に表示する。
                                    一覧は常に見えるので「どこを間違えたか」がひと目で分かる。 */}
                                {reorderMobile && listeningTracks.length > 0 ? (
                                  /* ★リスニングの解説（スマホ）：1画面で完結させる（2026-09-30 利用者の要望）★
                                     「上に再生があるのに下にもう一度再生ボタンは要らない。
                                       この1画面に解説とスクリプトを持ってきたい。詳細解説はボタンで伸びればいい」
                                     ・再生は上の帯だけ（下の2つ目のプレーヤーは出さない）
                                     ・問ごとに「○×・あなたの答え→正解」を1行で出す
                                     ・その下にスクリプトと和訳を直接出す（押さなくても読める）
                                     ・解説／思考手順／押さえたい表現はタップで開く */
                                  <div className="lx-compact" data-listening-explanation>
                                    {/* ★2026-10-02 夜（ご指摘）：問題画面と同じ選択肢の並びの上に、
                                         正解（緑）・自分が選んだ不正解（赤）を直接つける。
                                         「問題は固定で、今の選択肢のところに合ってるか間違ってるか」 */}
                                    {objectiveSqs.map((sq: any) => {
                                      const ok = isAnswerCorrect(sq, answers[sq.id]);
                                      const attempted = isAttempted(answers[sq.id]);
                                      const sqIdx = ((question?.subQuestions || []) as any[]).indexOf(sq);
                                      const marker = answerCardMarker(sq, sqIdx < 0 ? 0 : sqIdx, question);
                                      const status = !attempted ? 'none' : ok ? 'ok' : 'ng';
                                      const options: string[] = Array.isArray(sq.options) ? sq.options : [];
                                      const texts = optionTextsBySq.get(sq.id);
                                      const mine = String(answers[sq.id] ?? '');
                                      const right = String(sq.correctAnswer ?? '');
                                      const hasImages = Array.isArray(sq.optionImages);
                                      return (
                                        <section key={`lx-${sq.id}`} className="lx-choices" data-status={status} aria-label={`${marker} の答え合わせ`}>
                                          <header className="lx-choices-head">
                                            <span className="lx-result-mark" aria-hidden="true">{status === 'none' ? <Circle size={18} /> : ok ? <CheckCircle2 size={18} /> : <XCircle size={18} />}</span>
                                            <span className="lx-result-label">{formatText(marker)}</span>
                                            <span className="lx-result-verdict">{status === 'none' ? '未解答' : ok ? '正解' : '不正解'}</span>
                                          </header>
                                          {options.length > 0 && !hasImages ? (
                                            <ol className={`lx-choice-list${pictureCellOf(sq, 0, options.length) ? ' is-pics' : ''}`}>
                                              {options.map((opt, oi) => {
                                                const isRight = opt.trim() === right.trim();
                                                const isMine = attempted && opt.trim() === mine.trim();
                                                const tone = isRight ? 'right' : isMine ? 'wrong' : 'plain';
                                                const body = texts?.[oi];
                                                const mark = optionCircledMark(opt, oi);
                                                // ★2026-10-08 絵の問題（第1問B・第2問）★ 選択肢は①〜④の記号だけなので、
                                                //   復習のときに「どんな問題だったか」が分からなかった。
                                                //   問題のイラスト（2×2 の4コマ）から、その選択肢の1コマを切り出して並べる。
                                                const pic = pictureCellOf(sq, oi, options.length);
                                                return (
                                                  <li key={opt + oi} className={`lx-choice${pic ? ' has-pic' : ''}`} data-tone={tone} data-mine={isMine || undefined}>
                                                    {pic && <span className="lx-choice-pic" role="img" aria-label={`${mark || opt} のイラスト`} style={pic} />}
                                                    <span className="lx-choice-mark">{mark ? `${mark} ` : ''}{formatText(opt)}</span>
                                                    {body && <span className="lx-choice-text">{formatText(body, [], { prose: true })}</span>}
                                                    {(isRight || isMine) && (
                                                      <span className="lx-choice-tag">{isRight && isMine ? 'あなた・正解' : isRight ? '正解' : 'あなた'}</span>
                                                    )}
                                                  </li>
                                                );
                                              })}
                                            </ol>
                                          ) : (
                                            <p className="lx-result-answers">
                                              {attempted && !ok && <><span className="lx-yours">{formatText(mine)}</span><span aria-hidden="true">→</span></>}
                                              <span className="lx-right" aria-label={`正解 ${right}`}>{formatText(right)}</span>
                                            </p>
                                          )}
                                        </section>
                                      );
                                    })}
                                    {listeningTracks.map((track: any) => (
                                      <section key={`lx-script-${track.subId}`} className="lx-script" aria-label={`${track.label} のスクリプト`}>
                                        {listeningTracks.length > 1 && <h5>{track.label}</h5>}
                                        <ListeningEvidenceScript track={track} collapsiblePhrases showHint={false} />
                                      </section>
                                    ))}
                                    {objectiveSqs.map((sq: any) => {
                                      const slice = stripScriptBox(sliceForSq(sq));
                                      const open = openExplanationBySq[sq.id] || false;
                                      const sqIdx = ((question?.subQuestions || []) as any[]).indexOf(sq);
                                      const marker = answerCardMarker(sq, sqIdx < 0 ? 0 : sqIdx, question);
                                      const theme = sq.detailedExplanation?.theme;
                                      const steps: string[] = sq.detailedExplanation?.steps || [];
                                      return (
                                        <div key={`lx-ex-${sq.id}`} className="lx-fold">
                                          <button type="button" onClick={() => setOpenExplanationBySq(prev => ({ ...prev, [sq.id]: !open }))} aria-expanded={open}>
                                            <BookOpen size={16} aria-hidden="true" />
                                            <span>{objectiveSqs.length > 1 ? <>{formatText(marker)} の</> : null}詳しい解説</span>
                                            <ChevronDown size={18} aria-hidden="true" className={open ? 'rotate-180' : ''} />
                                          </button>
                                          {open && (
                                            <div className={`lx-fold-body ${explBodyBaseClass}`}>
                                              {theme && <p className="lx-core"><KeyRound size={14} aria-hidden="true" />{formatText(theme)}</p>}
                                              {slice.trim()
                                                ? <ExplanationBody text={slice} tone="light" prose={isEnglishChapter} className={`${explBodyFontClass} text-gray-700`} />
                                                : !theme && <p className="text-xs text-gray-500">この問の解説は下の「共通ポイント」にまとめています。</p>}
                                              {steps.length > 0 && isPracticeMode && (
                                                <ol className="lx-steps">{steps.map((step, i) => <li key={i}><b>{i + 1}</b><span>{formatText(step)}</span></li>)}</ol>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : reorderMobile ? (
                                  <>
                                    <div className="grid grid-cols-4 gap-2">
                                      {objectiveSqs.map((sq: any) => {
                                        const ok = isAnswerCorrect(sq, answers[sq.id]);
                                        const attempted = isAttempted(answers[sq.id]);
                                        const active = selectedSqId === sq.id;
                                        const sqIdx = ((question?.subQuestions || []) as any[]).indexOf(sq);
                                        const marker = answerCardMarker(sq, sqIdx < 0 ? 0 : sqIdx, question);
                                        // マーカーが長い場合（係数グループなど）は先頭だけ出す
                                        const shortMarker = marker.length > 7 ? `${marker.slice(0, 6)}…` : marker;
                                        return (
                                          <button
                                            key={`chip-${sq.id}`}
                                            type="button"
                                            onClick={() => {
                                              if (active) {
                                                setSelectedSqId(null);
                                              } else {
                                                setSelectedSqId(sq.id);
                                                // 「解答と解説が出るように」：チップを押したら
                                                // 解説アコーディオンも開いた状態で表示する。
                                                setOpenExplanationBySq(prev => ({ ...prev, [sq.id]: true }));
                                              }
                                            }}
                                            aria-pressed={active}
                                            aria-label={`${marker} ${!attempted ? '未解答' : ok ? '正解' : '不正解'}の解答・解説を${active ? '閉じる' : '見る'}`}
                                            className={`flex flex-col items-center justify-center gap-0.5 rounded-xl border-2 px-1 py-2 min-h-[3.25rem] transition-all ${
                                              !attempted
                                                ? (active ? 'bg-gray-200 border-gray-400' : 'bg-gray-50 border-gray-200')
                                                : ok
                                                  ? (active ? 'bg-emerald-100 border-emerald-500 shadow-sm' : 'bg-emerald-50 border-emerald-200')
                                                  : (active ? 'bg-red-100 border-red-500 shadow-sm' : 'bg-red-50 border-red-200')
                                            }`}
                                          >
                                            <span className={`font-bold text-[13px] leading-tight break-all ${
                                              !attempted ? 'text-gray-500' : ok ? 'text-emerald-700' : 'text-red-600'
                                            }`}>
                                              {formatText(shortMarker)}
                                            </span>
                                            {!attempted
                                              ? <Circle size={16} className="text-gray-400" />
                                              : ok
                                                ? <CheckCircle2 size={16} className="text-emerald-600" />
                                                : <XCircle size={16} className="text-red-500" />}
                                          </button>
                                        );
                                      })}
                                    </div>
                                    {/* タップした問だけ詳細カード（解答・解説）を出す */}
                                    {(() => {
                                      const sel = objectiveSqs.find((sq: any) => sq.id === selectedSqId);
                                      if (!sel) return (
                                        <p className="text-xs text-gray-400 font-bold text-center py-1">
                                          上の正誤ボタンをタップすると、その問の解答・解説が開きます
                                        </p>
                                      );
                                      return renderSq(sel, isAnswerCorrect(sel, answers[sel.id]));
                                    })()}

                                    {/* ★B-2：スマホは音源・スクリプトを正誤ボタンより「下」で描く★
                                        これで並び順が
                                          採点結果 → 問N○ の正誤ボタン → 案内文 → 音源・スクリプト
                                        になり、「採点結果」と「問3○」が隣接する。
                                        案内文の「上の正誤ボタン」も、実際に真上を指すようになる。 */}
                                    {audioPlayerBlock}
                                  </>
                                ) : (
                                  /* PC・結果表示：元の並び順（ア→イ→ウ…）のまま、正誤の色分けだけ行って上から表示 */
                                  objectiveSqs.map(sq => renderSq(sq, isAnswerCorrect(sq, answers[sq.id])))
                                )}
                              </div>
                            )}

                            {sharedExplanation.trim() && reorderMobile && listeningTracks.length > 0 && (
                              <details className="lx-fold lx-fold-shared">
                                <summary><Lightbulb size={16} aria-hidden="true" /><span className="lx-lbl-long">大問全体の流れ・共通ポイント</span><span className="lx-lbl-short">大問の流れ</span><ChevronDown size={18} aria-hidden="true" /></summary>
                                <div className={`lx-fold-body ${explBodyBaseClass}`}>
                                  <ExplanationBody text={sharedExplanation} tone="light" prose={isEnglishChapter} className={`${explBodyFontClass} text-gray-700`} />
                                </div>
                              </details>
                            )}
                            {sharedExplanation.trim() && !(reorderMobile && listeningTracks.length > 0) && (
                              <div className={`mt-6 rounded-xl border p-4 md:p-5 ${explBodyBaseClass} ${mode === 'mini_test' ? 'bg-gray-50 border-gray-200' : 'bg-[#0B132B]/80 border-[#3A506B]/50'}`}>
                                <h4 className={`text-sm md:text-base mb-3 flex items-center gap-2 border-b-2 pb-2 ${mode === 'mini_test' ? 'text-emerald-700 border-emerald-200' : 'text-[#5BC0BE] border-[#3A506B]/50'}`}>
                                  <Lightbulb className={`w-4 h-4 ${mode === 'mini_test' ? 'text-amber-500' : 'text-[#F9E79F]'}`} />
                                  <span>大問全体の流れ・共通ポイント</span>
                                </h4>
                                <ExplanationBody
                                  text={sharedExplanation}
                                  tone={mode === 'mini_test' ? 'light' : 'dark'}
                                  prose={isEnglishChapter}
                                  className={`${explBodyFontClass} ${mode === 'mini_test' ? 'text-gray-700' : 'text-[#E0E1DD]/90'}`}
                                />
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>

                  </div>
                );
              })
            ) : (
              <div className={`p-12 text-center rounded-2xl border-2 border-dashed ${mode === 'mini_test' ? 'bg-gray-50 border-gray-200 text-gray-500' : 'bg-[#1C2541]/30 border-[#3A506B]/50 text-[#7A8B99]'}`}>
                <div className="flex flex-col items-center gap-4">
                  <AlertCircle size={48} className="text-amber-500" />
                  <p className="text-lg font-bold">問題がありません。</p>
                </div>
              </div>
            )}

          {/* Stumbling Points (from logic_thought) */}
          {deepThoughtData && deepThoughtData.phase2.stumblingPoints && deepThoughtData.phase2.stumblingPoints.length > 0 && (
            <div className={`p-4 sm:p-6 md:p-8 border-b ${mode === 'mini_test' ? 'border-gray-200 bg-gray-50' : 'border-[#3A506B]/50 bg-[#1C2541]/20'}`}>
              <h4 className={`font-bold mb-4 text-base md:text-lg flex items-center gap-2 ${mode === 'mini_test' ? 'text-red-600' : 'text-[#D9A0A0]'}`}>
                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />
                つまずきポイント
              </h4>
              {/* 【横幅確保のため縦積み1カラムに統一】
                  つまずきポイントはこのブロック自体が右カラム（俯瞰レイアウト時は
                  全幅の42% ≈ 430px）の中に置かれるため、さらに2カラムへ分割すると
                  1カラムあたり約200pxしかなく、文章が縦に細長く折り返されて
                  非常に読みにくくなっていた。カードを縦積み1カラムにして
                  1カラムあたりの横幅を十分に確保し、俯瞰の縮小表示でも
                  文章の形が把握できる可読性を保つ。 */}
              <div className="grid grid-cols-1 gap-4 md:gap-5">
                {deepThoughtData.phase2.stumblingPoints.map((point: any, idx: number) => (
                  <div key={idx} className={`p-5 sm:p-6 pl-6 sm:pl-7 rounded-2xl border shadow-sm relative overflow-hidden ${mode === 'mini_test' ? 'bg-red-50 border-red-200' : 'bg-[#D9A0A0]/10 border-[#D9A0A0]/30'}`}>
                    <div className={`absolute top-0 left-0 w-2 h-full ${mode === 'mini_test' ? 'bg-red-500' : 'bg-[#D9A0A0]'}`}></div>
                    <div className="flex items-center flex-wrap gap-2 mb-2.5">
                      <div className={`text-xs md:text-sm font-bold px-2.5 py-1 rounded-lg border ${mode === 'mini_test' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-[#D9A0A0]/20 text-[#D9A0A0] border-[#D9A0A0]/30'}`}>
                        {formatText(String(point.step))}
                      </div>
                      <h5 className={`font-bold text-base md:text-lg leading-snug ${mode === 'mini_test' ? 'text-red-700' : 'text-[#D9A0A0]'}`}>{formatText(point.type || point.point)}</h5>
                    </div>
                    <div className={`text-sm md:text-base leading-relaxed md:leading-loose whitespace-pre-wrap ${mode === 'mini_test' ? 'text-gray-700' : 'text-[#E0E1DD]/90'}`}>
                      {formatText(point.content || point.reason)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Surrounding Knowledge / Deep Dive (from all questions) */}
          <div className={reorderMobile ? 'lx-extra-wrap pb-3 space-y-2' : 'p-4 sm:p-6 md:p-8 space-y-8'}>
            {questions.map((question: any, qIndex: number) => {
              const hasKnowledge = question.surroundingKnowledge && question.surroundingKnowledge.length > 0;
              const hasDeepDive = question.deepDiveTopics && question.deepDiveTopics.length > 0;
              
              if (!hasKnowledge && !hasDeepDive) return null;

              // ★スマホのリスニング解説：周辺知識・深掘りも「押したら開く」（1画面で完結させる）
              const foldExtras = reorderMobile && textTracksOf(question).length > 0;
              const ExtraWrap: any = foldExtras ? 'details' : 'div';
              const ExtraInner: any = foldExtras ? 'div' : React.Fragment;
              return (
                <ExtraWrap key={`extra-${question.id}`} className={foldExtras ? 'lx-fold lx-fold-extra' : 'space-y-6'}>
                  {foldExtras && <summary><BookOpen size={16} aria-hidden="true" /><span className="lx-lbl-long">周辺知識・深掘り</span><span className="lx-lbl-short">周辺知識</span><ChevronDown size={18} aria-hidden="true" /></summary>}
                  <ExtraInner {...(foldExtras ? { className: 'lx-fold-body space-y-6' } : {})}>
                  <div className={`flex items-center gap-3 border-b pb-2 ${mode === 'mini_test' ? 'border-gray-200' : 'border-[#3A506B]/30'}`}>
                    <div className={`font-bold px-2 py-0.5 rounded text-xs shadow-sm border ${mode === 'mini_test' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[#5BC0BE]/20 text-[#5BC0BE] border-[#5BC0BE]/30'}`}>
                      Q{(singleQuestionIndex !== undefined ? singleQuestionIndex : rangeOffset + (pagerOn ? (resultPages[safeResultPage]?.qIndex ?? qIndex) : qIndex)) + 1}
                    </div>
                    <h4 className={`font-bold text-sm md:text-base ${mode === 'mini_test' ? 'text-gray-800' : 'text-[#E0E1DD] opacity-80'}`}>
                      周辺知識・深掘り
                    </h4>
                  </div>

                  {hasKnowledge && (
                    <div>
                      <h5 className={`font-bold text-xs md:text-sm mb-3 md:mb-4 flex items-center gap-1.5 md:gap-2 ${mode === 'mini_test' ? 'text-blue-600' : 'text-[#A9CCE3]'}`}>
                        <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
                        <span>周辺知識・類似問題</span>
                      </h5>
                      <div className="space-y-3 md:space-y-4">
                        {question.surroundingKnowledge.map((k: string, idx: number) => {
                          const titleMatch = k.match(/^(【.*?】)(.*)/s);
                          if (titleMatch) {
                            return (
                              <div key={idx} className={`p-4 md:p-5 rounded-xl border shadow-sm relative overflow-hidden ${mode === 'mini_test' ? 'bg-blue-50 border-blue-200' : 'bg-[#1C2541]/50 border-[#A9CCE3]/30'}`}>
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${mode === 'mini_test' ? 'bg-blue-400' : 'bg-[#A9CCE3]'}`}></div>
                                <div className={`inline-flex items-center gap-1.5 text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-md mb-3 border ${mode === 'mini_test' ? 'bg-white text-blue-600 border-blue-200' : 'bg-[#A9CCE3]/10 text-[#A9CCE3] border-[#A9CCE3]/20'}`}>
                                  <BookOpen size={14} />
                                  {/* 見出しバッジも prose 対象。英語では見出しに英単語が
                                      そのまま入ることがあり、ここを素の formatText に
                                      すると見出しだけセリフ体に化けてしまう。 */}
                                  {formatText(titleMatch[1].replace(/[【】]/g, ''), [], { prose: isEnglishChapter })}
                                </div>
                                <div className={`text-xs md:text-sm leading-relaxed whitespace-pre-wrap ${mode === 'mini_test' ? 'text-gray-700' : 'text-[#E0E1DD]/90'}`}>
                                  {/* 英語は prose で組む（英単語がセリフ体の化学式に化けるのを防ぐ） */}
                                  {formatText(titleMatch[2].trim(), [], { prose: isEnglishChapter })}
                                </div>
                              </div>
                            );
                          }
                          return (
                            <div key={idx} className={`p-4 md:p-5 rounded-xl border shadow-sm text-xs md:text-sm leading-relaxed whitespace-pre-wrap ${mode === 'mini_test' ? 'bg-gray-50 border-gray-200 text-gray-700' : 'bg-[#1C2541]/50 border-[#3A506B]/50 text-[#E0E1DD]/90'}`}>
                              {formatText(k, [], { prose: isEnglishChapter })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {hasDeepDive && (
                    <div className="mt-6 md:mt-8">
                      <h5 className={`font-bold text-xs md:text-sm mb-3 md:mb-4 flex items-center gap-1.5 md:gap-2 ${mode === 'mini_test' ? 'text-amber-600' : 'text-[#D9A0A0]'}`}>
                        <Search className="w-4 h-4 md:w-5 md:h-5" />
                        <span>さらに深掘り</span>
                      </h5>
                      <div className="space-y-3 md:space-y-4">
                        {question.deepDiveTopics.map((topic: string, idx: number) => {
                          const titleMatch = topic.match(/^(【.*?】)(.*)/s);
                          let title = "";
                          let content = topic;
                          
                          if (titleMatch) {
                            title = titleMatch[1].replace(/[【】]/g, '');
                            content = titleMatch[2].trim();
                          } else {
                            const parts = topic.split('\n');
                            title = parts[0];
                            content = parts.slice(1).join('\n');
                          }

                          return (
                            <div key={idx} className={`p-4 md:p-5 rounded-xl border shadow-sm relative overflow-hidden ${mode === 'mini_test' ? 'bg-amber-50 border-amber-200' : 'bg-[#D9A0A0]/10 border-[#D9A0A0]/30'}`}>
                              <div className={`absolute top-0 left-0 w-1.5 h-full ${mode === 'mini_test' ? 'bg-amber-400' : 'bg-[#D9A0A0]'}`}></div>
                              <div className={`inline-flex items-center gap-1.5 text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-md mb-3 border ${mode === 'mini_test' ? 'bg-white text-amber-600 border-amber-200' : 'bg-[#D9A0A0]/20 text-[#D9A0A0] border-[#D9A0A0]/30'}`}>
                                <Lightbulb size={14} />
                                {/* 【】が無い深掘りでは title = 1行目まるごとになり、
                                    英文（usually / on weekdays など）を含みうる。
                                    そのためここも prose で組む。 */}
                                {formatText(title, [], { prose: isEnglishChapter })}
                              </div>
                              <div className={`text-xs md:text-sm leading-relaxed whitespace-pre-wrap ${mode === 'mini_test' ? 'text-gray-700' : 'text-[#E0E1DD]/90'}`}>
                                {formatText(content, [], { prose: isEnglishChapter })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  </ExtraInner>
                  </ExtraWrap>
                );
              })
            }
          </div>
        </div>

        {/* 学習フローチャート（スマホの1問ごとの答え合わせのみ）
            縦積み順を「問題文 → 採点結果 → 学習フローチャート」にするため、
            order-3 として採点結果（RIGHT COLUMN）の後ろに配置する。 */}
        {/* ★スマホでは常設せず、採点結果ヘッダーの「フローチャート」チップで
            開閉する（ご要望「邪魔にならない位置に切り替えのボタンを設置」）。
            表示時は画面全幅を使えるので、縮小2カラム時代より読みやすい。 */}
        {reorderMobile && flowchartBlock && showFlowchart && (
          <div className="order-3 min-w-0 px-3 pb-4">
            {flowchartBlock}
          </div>
        )}

        {/* ★スマホ：下部固定ナビ（問題に戻る / 次の問題へ）。
            演習画面の「前へ / 解答と解説を見る」と同じ位置・同じ操作感にして、
            親指だけで「解く→答え合わせ→次を解く」を回せるようにする。 */}
        {reorderMobile && onNextQuestion && (
          <div className="order-4 fixed left-0 right-0 bottom-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.10)] px-3 pt-2.5 pb-[calc(0.6rem+env(safe-area-inset-bottom))]">
            <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
              <button
                onClick={onBack}
                title="問題に戻る"
                aria-label="問題に戻る"
                className="flex items-center justify-center p-3 rounded-xl font-bold transition-all duration-200 border-2 shrink-0 cursor-pointer border-[#A9CCE3] text-[#2C3E50] active:bg-[#A9CCE3] active:text-white bg-white shadow-sm"
              >
                <ArrowLeft size={18} className="stroke-[2.5]" aria-hidden="true" />
                <span className="ml-1 text-xs">問題に戻る</span>
              </button>
              <button
                onClick={onNextQuestion}
                className="flex shadow-md active:translate-y-0.5 items-center justify-center gap-1.5 px-5 py-3 rounded-xl font-bold tracking-wider transition-all duration-200 text-sm bg-[#2C3E50] text-white active:bg-[#1B2631] flex-1 cursor-pointer"
              >
                <span>{isLastQuestion ? '結果を見る' : '次の問題へ'}</span>
                <ArrowLeft size={16} className="rotate-180 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
      </div>
      )}
      </div>
      </div>
        {/* ★詳しい結果の下のバー（2026-10-04）★ 問題・スクリプト・解説の下に、次にすることをまとめる */}
        {reviewNav && <div className="practice-bottom-spacer is-review" aria-hidden="true" />}
        {reviewNav && (
          <div className="practice-bottom-bar is-review" data-review-actions>
            {reviewNav.onRetryWrong
              ? <button type="button" className="pbb-main" onClick={reviewNav.onRetryWrong}><Target size={17} aria-hidden="true" />{reviewNav.retryLabel}</button>
              : reviewNav.onNext && <button type="button" className="pbb-main" onClick={reviewNav.onNext}><ChevronRight size={17} aria-hidden="true" />{reviewNav.nextLabel}</button>}
            <div className="pbb-sub">
              <button type="button" onClick={reviewNav.onChapters}><ListOrdered size={16} aria-hidden="true" />単元選択に戻る</button>
              {reviewNav.onHome && <button type="button" onClick={reviewNav.onHome}><Home size={16} aria-hidden="true" />ホームに戻る</button>}
            </div>
          </div>
        )}

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
