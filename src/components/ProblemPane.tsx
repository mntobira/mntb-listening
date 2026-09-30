/**
 * =====================================================================
 * 問題文ペイン（画面の左側／スマホでは上側）
 * =====================================================================
 * ■ なぜ Quiz.tsx から切り出したのか
 *   Quiz.tsx の JSX は約 1,300 行あり、その中でこの問題文ペインだけで
 *   508 行（コメント込み）を占めていた。「問題文の表示」と「解答の入力」は
 *   関心がまったく別なので、ファイルを分けて読めるようにした。
 *
 * ■ 動きも見た目も 1 ピクセルも変えていない
 *   className・高さの取り合い（listeningMobileSplit）・左右比 58%/42%・
 *   図の出し方、すべて Quiz.tsx にあったときと同一の文字列。
 *   state は 1 つも持たず、必要な値と更新関数を props で受け取るだけ。
 *
 * ■ ここを触るときの注意
 *   高さの上限（max-h-[50%] など）は実測して決めた値で、
 *   コメントに「なぜその値なのか」の経緯を残している。
 *   数字だけを見て「キリのいい値」に直すと、解答欄が画面外へ
 *   押し出される不具合が再発する。
 */
import React, { useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatText } from '../utils/textFormatter';
import { buildSubQuestionList, cleanQuestionText, findSubQuestionSentence, splitQuestionLabel, type InlineQuestionRows } from '../utils/questionDisplay';
import { getFigureNumber } from '../utils/figureNumbering';
import { stepLabelOf } from '../utils/listeningSteps';
import { QuestionFigure } from './QuestionFigure';
import { IonizationEnergyChart } from './IonizationEnergyChart';
import { ListeningAudioPlayer } from './ListeningAudioPlayer';
import { ExplanationBody } from './ExplanationBody';
import { ListeningMaterials } from './ListeningMaterials';

export interface ProblemPaneProps {
  /** いま表示している大問。 */
  currentQuestion: any;
  currentQuestionIndex: number;
  /** PC 表示か（true なら高さの分岐が変わる）。 */
  isDesktop: boolean;
  /** 問題文ペインを画面いっぱいに広げているか。 */
  isProblemExpanded: boolean;
  setIsProblemExpanded: (v: boolean) => void;
  /** 問題文を「見出しだけ」にたたんでいるか。 */
  isProblemCollapsed: boolean;
  setIsProblemCollapsed: (v: boolean) => void;
  /** ソフトウェアキーボードが出ているか（出ていれば問題文を縮める）。 */
  keyboardVisible: boolean;
  /** リスニング（音声トラックあり）か。 */
  listeningUnified: boolean;
  /** リスニングのスマホ表示で、高さの取り合いを逆向きにするか。 */
  listeningMobileSplit: boolean;
  /** リスニングのスマホ表示で図が無い場合のレイアウト分岐。 */
  listeningMobileNoFigure: boolean;
  listeningMaterialsMobile?: boolean;
  selectedAnswerSub?: any;
  listeningSteps: any[];
  safeStepIndex: number;
  activeStepSub: any;
  listeningTracks: any[];
  hasTrackFor: (sq: any) => boolean;
  /** 英文（散文）として折り返すか。 */
  isEnglishProse: boolean;
  /** 数式フォントを当てるか。 */
  questionNeedsMathPalette: boolean;
  /** 図番号 → 表示番号 の対応表。 */
  figureNumberMap: Map<string, number> | any;
  /** 設問文に出す強調語（ユーザー選択＋自動抽出）。 */
  combinedHighlights: string[];
  highlights: string[];
  setHighlights: (v: string[]) => void;
  /** 設問文を指でなぞったときに強調語を拾う。 */
  handleTextSelection: () => void;
  /** 問題文の中に埋め込む小問の行（スマホのみ。PC では null）。 */
  inlineQuestionRows: InlineQuestionRows | null;
  /** 小問一覧が問題文と重複していて隠すべきか。 */
  hideRedundantSubQuestionList: boolean;
  /** ペインのスクロール位置を Quiz 側から操作するための ref。 */
  problemScrollRef: React.RefObject<HTMLDivElement | null>;
}

export function ProblemPane({
  currentQuestion,
  currentQuestionIndex,
  isDesktop,
  isProblemExpanded,
  setIsProblemExpanded,
  isProblemCollapsed,
  setIsProblemCollapsed,
  keyboardVisible,
  listeningUnified,
  listeningMobileSplit,
  listeningMobileNoFigure,
  listeningMaterialsMobile = false,
  selectedAnswerSub,
  listeningSteps,
  safeStepIndex,
  activeStepSub,
  listeningTracks,
  hasTrackFor,
  isEnglishProse,
  questionNeedsMathPalette,
  figureNumberMap,
  combinedHighlights,
  highlights,
  setHighlights,
  handleTextSelection,
  inlineQuestionRows,
  hideRedundantSubQuestionList,
  problemScrollRef,
}: ProblemPaneProps) {
  // Quiz.tsx にあったときの呼び名をそのまま残す（下の JSX を書き換えないため）
  const tracks = (currentQuestion as any)?.audioTracks;

  const materialTrack = listeningTracks.find(t => t.subId === activeStepSub?.id);
  useEffect(() => {
    const pane = problemScrollRef.current;
    if (!pane || !materialTrack?.material || isDesktop) return;
    // Move only the document scroller. Never remount or seek the shared audio player.
    const number = selectedAnswerSub?.id?.match(/_(\d+)$/)?.[1];
    const target = selectedAnswerSub?.optionImages?.length
      ? pane.querySelector('[data-material-graph]')
      : number && !materialTrack.material.images?.length
        ? pane.querySelector(`[data-material-blank="${number}"]`)
        : null;
    if (target) {
      const view = pane.getBoundingClientRect();
      const rect = target.getBoundingClientRect();
      if (rect.top < view.top || rect.bottom > view.bottom) {
        pane.scrollTop += rect.top - view.top - 12;
      }
    } else {
      pane.scrollTop = 0;
    }
  }, [selectedAnswerSub?.id, materialTrack?.subId, isDesktop]);

  if (listeningUnified && materialTrack?.material) {
    return (
      <section data-listening-material-pane aria-label="問題の資料"
        className={`lg:w-[58%] flex min-h-0 flex-col border-b lg:border-r border-gray-200 bg-white ${
          isDesktop ? 'h-full' : isProblemExpanded ? 'absolute inset-0 z-30' :
          listeningMaterialsMobile ? 'flex-[1_1_0%]' : 'max-h-[50%] flex-none'
        }`}>
        {isDesktop ? (
          <>
            <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3">
              <span className="text-sm font-bold text-[#2C3E50]">{materialTrack.label} · 資料</span>
            </div>
            <div data-listening-audio className="shrink-0 border-b bg-white px-3 py-1">
              <ListeningAudioPlayer tracks={listeningTracks} focusSubId={activeStepSub.id}
                variant="inline" orientation="horizontal" mode="practice" tone="light"
                readCount={currentQuestion.readCount || 2} playOnce={!!currentQuestion.playOnce} />
            </div>
          </>
        ) : (
          /*
            ★スマホ：見出し行と音源行を1行に統合する★
            ご指摘：「リスニングがまだ一画面に映ってない（後半パート）。見にくい」
            実測（375x740・第4問A）では
              見出し「問18〜21 · 資料 / 全画面で読む」 45px
              音源「▶再生（1回のみ）/ 0.75倍 / 標準」   53px
            の2段で 98px を使い、資料の読める高さが 188px しか残っていなかった。
            ［問18〜21］［▶再生］［0.75倍］［標準］［全画面］を1段（約46px）に
            まとめて、浮いた約50px をそのまま資料と選択肢に回す。
            ・「· 資料」は省く（この段の中身が資料であることは見れば分かる）
            ・「講義（問27〜31）」は「問27〜31」に縮める（幅を再生ボタンに譲る）
            ・全画面ボタンは aria-label で従来の名前（全画面で読む／選択肢に戻る）を保つ
            PC（isDesktop）は従来の2段のまま。
          */
          <div className="flex shrink-0 items-center gap-1.5 border-b bg-white px-2 py-1">
            <span className="max-w-[4.5rem] shrink-0 truncate text-xs font-bold leading-tight text-[#2C3E50]">
              {String(materialTrack.label).replace(/^講義（([^）]+)）$/u, '$1')}
            </span>
            <div data-listening-audio className="min-w-0 flex-1">
              <ListeningAudioPlayer tracks={listeningTracks} focusSubId={activeStepSub.id}
                variant="inline" orientation="horizontal" mode="practice" tone="light"
                readCount={currentQuestion.readCount || 2} playOnce={!!currentQuestion.playOnce} />
            </div>
            <button type="button"
              onClick={() => { setIsProblemExpanded(!isProblemExpanded); setIsProblemCollapsed(false); }}
              aria-label={isProblemExpanded ? '選択肢に戻る' : '全画面で読む'}
              className="min-h-11 min-w-11 shrink-0 rounded-lg border border-gray-200 bg-white px-1.5 text-xs font-bold text-gray-600">
              {isProblemExpanded ? '選択肢へ' : '全画面'}
            </button>
          </div>
        )}
        <div ref={problemScrollRef} tabIndex={0} aria-label="資料をスクロール"
          className={`min-h-0 flex-1 overflow-auto overscroll-contain px-3 md:px-6 ${isDesktop ? 'py-3' : 'py-2'}`}>
          <ListeningMaterials material={materialTrack.material}
            activeSubId={!isDesktop ? selectedAnswerSub?.id : undefined} />
          {materialTrack.hint && <details className="mt-3 text-sm leading-relaxed text-gray-600">
            <summary className="cursor-pointer py-2 font-bold">状況・場面を確認</summary>
            <p>{materialTrack.hint}</p>
          </details>}
        </div>
      </section>
    );
  }

  return (
    <>
    {/* Section 1: Problem Text
        ★左右比は従来どおり 58% / 42%（勝手に変えない、というご指摘に対応）。 */}
    {/* スマホの高さ制御（ご要望「問題文が占領しすぎて入力しづらい」対策）：
        ・通常は max-h-[50%]（親＝ペインを分け合う箱の半分）。
          変遷：50vh → 42dvh → 50%。
            50vh  … iOS Safari の vh は URLバー込みの「最大の画面高さ」
                    基準なので、実表示領域では半分を大きく超えていた。
            42dvh … 実表示高さ基準にはなったが、基準がビューポート全体の
                    ままだったので、ヘッダーと下部ナビを引いた「実際に
                    ペインが分け合える高さ」に対しては 54〜56% を先取り
                    してしまい、解答欄が下部ナビの下へ押し出された。
            50%   … 基準を親に変更。ヘッダー・ナビを自動的に除いた上で
                    ちょうど半分になるので、ビューポートが変わっても、
                    問題文が18文字でも1031文字でも取り分が変わらない。
          短い問題は h-auto なので半分も使わず、余りは解答側に回る。
        ・ソフトキーボード表示中は max-h-[24vh] に自動で縮め、
          入力欄と入力内容がキーボードの上に必ず見えるようにする
        ・「たたむ」で見出しだけにして解答欄を最大化できる */}
    {/*
      ★リスニング（スマホ）は「高さの取り合い」を逆向きにする★
      ------------------------------------------------------------------
      ご指摘：
        「選択肢のところが固定されてるけど、選択肢の下に空白合って
          無駄だから、まず固定するならもっと下にもってきて、
          図が隠れてるのを防いでほしい」

      ■ 何が起きていたか
        以前は
          ・問題文ペイン … max-h-[40vh]（上限を先に決める）
          ・解答ペイン   … flex-1（余った高さを全部もらう）
        だった。すると
          ・問題文ペインは 40vh で打ち切られ、第1問B の
            4コマイラストが下半分から切れる（ご指摘「図が隠れてる」）
          ・一方で解答ペインは ①〜④ の4ボタンしか無いのに
            余り高さを全部受け取るので、選択肢カードの下に
            大きな空白が残る（ご指摘「選択肢の下に空白合って無駄」）
        という、高さの配り方が完全に逆の状態だった。

      ■ どう直したか（listeningMobileSplit）
        取り合いを入れ替える。
          ・解答ペイン   … flex-none（中身のぶんだけ）＋ 画面下に寄せる
          ・問題文ペイン … flex-1（余った高さを全部もらう）
        これで
          ・選択肢カードは下部ナビの真上まで下がる（＝もっと下に）
          ・カード下の空白が消える（中身の高さしか取らないため）
          ・浮いた高さはそのまま問題文ペイン＝図に回る
        の3つが同時に成立する。

      化学・数学など（listeningUnified=false）は従来どおり
      「問題文に上限・解答に残り」のままで、見た目は変わらない。
    */}
    <div className={`
      lg:w-[58%] flex flex-col bg-white border-b lg:border-b-0 lg:border-r border-gray-200 transition-all duration-300
      ${listeningMobileSplit && !listeningMobileNoFigure ? 'flex-1 min-h-0' : 'flex-none'}
      ${isDesktop
        ? 'h-full'
        : isProblemExpanded
          ? 'absolute inset-0 z-30 h-full shadow-lg'
          : isProblemCollapsed
            ? 'h-auto shadow-md relative z-20'
            : keyboardVisible
              /*
                ★B-3：入力中の問題文の取り分★
                ヘッダー・タイマー・見出しを隠して空いた約126px を、
                問題文と解答欄で分け合う。ここを 24vh のままにすると
                浮いた高さの大半が問題文側に流れてしまうため、
                上限は据え置きにして余りは解答欄（flex-1）へ渡す。
                ＝打っている欄と、直前に読んだ問題文の両方が見える。
              */
              ? 'max-h-[24vh] h-auto shadow-md relative z-20'
              : listeningMobileNoFigure
                // 図が無い大問（第1問A・第3問・第2問）は中身のぶんだけ。
                // 余った高さは下の解答ペインに渡して選択肢を押しやすくする。
                ? 'h-auto max-h-[46dvh] shadow-md relative z-20'
                : listeningMobileSplit
                  ? 'shadow-md relative z-20'
                  /*
                    ★ご指摘「問題によって問題文の長さが違うから、コードで形式的に
                      作ると問題によっておかしくなる可能性がある」への修正★

                    以前は max-h-[42dvh]。名前は「画面の42%」だが、実際に
                    ペインが分け合えるのはヘッダーと下部ナビを引いた残りだけ。
                      360x600 → 使える高さ 453px なのに 42dvh = 252px（＝56%）
                      390x664 → 使える高さ 517px なのに 42dvh = 279px（＝54%）
                    つまり「42%」と書きながら実質は毎回 55% 前後を先取りしていた。
                    残り 201px しか無い解答ペインに 285px の解答カードが入らず、
                    (ア)(イ)(ウ)(エ) が下部ナビの下へ押し出されていた
                    （実測：c5_7[0] 360x600 で 見えている選択肢 0/4）。

                    ★直し方★ 基準をビューポートから「親（ペインを分け合う箱）」に
                    変える。max-h-[50%] は親の高さの50%なので、ヘッダーと
                    ナビを自動的に除いた上でのちょうど半分になる。
                    解答ペインは flex-1 なので必ず残り半分以上を受け取る。
                    これで問題文が18文字でも1031文字でも取り分は変わらない
                    （＝問題ごとに壊れない）。短い問題は h-auto なので
                    半分も使わず、余りは解答側に回る。
                  */
                  : 'max-h-[50%] h-auto shadow-md relative z-20'}
    `}>
      {/* 問題ペインの見出し行（Q1・問題文・たたむ・全画面で読む）。
          ★B-3：入力中は隠す（5%）★
            打っている間は「たたむ」「全画面で読む」を押さないし、
            Q1 の表示も読む必要がない。浮いた高さは問題文と解答欄に回る。
            「完了」でキーボードが閉じれば元に戻るので、機能は失われない。
            PC（isDesktop）は対象外。 */}
      <div className={`flex items-center justify-between px-2 py-0 md:p-4 border-b border-gray-100 bg-blue-50/30 ${
        !isDesktop && keyboardVisible ? 'hidden' : ''
      }`}>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#A9CCE3]/20 text-[#5d8fb0] font-bold flex items-center justify-center text-xs md:text-sm border-2 border-[#A9CCE3]">
            Q{currentQuestionIndex + 1}
          </div>
          <span className="font-bold text-[#2C3E50] text-sm md:text-base">問題文</span>

          {highlights.length > 0 && (
            <button 
              onClick={() => setHighlights([])} 
              className="min-h-11 text-xs text-amber-700 bg-amber-50 px-2 rounded border border-amber-200 hover:bg-amber-100 transition-colors whitespace-nowrap"
            >
              ハイライト消去
            </button>
          )}
        </div>

        {!isDesktop && (
          <div className="flex items-center gap-1.5">
            {/* 問題文を見出しだけにたたむ／戻す。高校生が迷わないよう
                チップ型ボタン＋矢印で「押せる」ことを明示する。 */}
            {!isProblemExpanded && (
              <button
                onClick={() => setIsProblemCollapsed(!isProblemCollapsed)}
                aria-expanded={!isProblemCollapsed}
                className="flex min-h-11 items-center gap-0.5 rounded-md px-2 text-xs font-bold text-gray-600 hover:bg-gray-50 whitespace-nowrap"
              >
                {isProblemCollapsed ? (
                  <>問題文を表示<ChevronDown size={12} /></>
                ) : (
                  <>たたむ<ChevronUp size={12} /></>
                )}
              </button>
            )}
            <button
              onClick={() => {
                setIsProblemExpanded(!isProblemExpanded);
                setIsProblemCollapsed(false);
              }}
              className="flex min-h-11 items-center rounded-md px-2 text-xs font-bold text-gray-600 hover:bg-gray-50 whitespace-nowrap"
            >
              {isProblemExpanded ? '閉じる' : '全画面で読む'}
            </button>
          </div>
        )}
      </div>

      {/*
        ★リスニング（スマホ）は、この中も「高さの連鎖」を通す★
        図を「余った高さいっぱい」に伸ばすには、
          問題文ペイン（flex-1）
            → このスクロール枠（flex-1 min-h-0）
              → 内側ラッパ（flex flex-col min-h-0）
                → 問ブロック（flex flex-col min-h-0）
                  → QuestionFigure fill
        の全段で flex と min-h-0 が繋がっている必要がある。
        どこか1段でも高さ auto があると <img> の max-height:100% が
        none 扱いになり、図が原寸で伸びて枠からはみ出す（＝隠れる）。
        余白も p-4 → px-3 pt-2 に詰めて、そのぶんを図に回す。
      */}
      <div 
        ref={problemScrollRef}
        className={`${!isDesktop && !isProblemExpanded && isProblemCollapsed ? 'hidden' : ''} flex-1 min-h-0 overflow-y-auto md:p-8 text-[15px] leading-[1.85] md:text-base md:leading-relaxed text-gray-800 break-words [overflow-wrap:anywhere] ${
          listeningMobileSplit ? 'flex flex-col px-3 pt-2 pb-3' : 'p-4'
        } ${
          // 数学の問題（requiresMathPalette 付き）は、数式が/や^の
          // 生テキストではなく教科書と同じ形で出るため、
          // 数式フォント＋一回り大きい表示（.math-content）で読みやすくする。
          questionNeedsMathPalette ? 'font-math math-content' : 'font-modern'
        }`}
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
        title="テキストを選択するとハイライトできます"
      >
        <div className={`max-w-prose md:max-w-none ${listeningMobileSplit ? 'flex min-h-0 flex-1 flex-col' : ''}`}>
          {/* 問題文に含まれる Markdown テーブル（実験結果の表など）は
              ExplanationBody を通して本物の <table> として描画する。

              ★英語リスニング：ここに出すのは「共通のリード文」だけ。
                問1〜問4のブロックは落とす。

                ■ 不具合だった点（ご指摘：「全部の問いがまとまってて
                  どの問いを解いているかが分からない」）
                  以前は cleanQuestionText を先に通していた。これは
                  「行頭の 問N を消す」処理なので、切り落とす目印である
                  問N が先に消えてしまい、問1〜問4が全部残っていた。
                  buildListeningLeadText が正しい順序
                  （問Nで切る → 定型ブロックを落とす）を保証する。
                いま解いている問の見出し・音源・図は、このリード文より
                「上」に出す（下記）。
                リスニング以外（listeningUnified=false）は従来どおり全文。 */}

          {/*
            ★英語リスニング：いま解いている問の「問題」をペインの先頭に出す
            ------------------------------------------------------------------
            ご指摘：
              「再生ボタンはさ、左の問題の文章のところにおいてほしいよね。
                何で解答の方に置くの？第１問の図も何で解答の方にあるの？
                問題の方（左側）においてっていったよね」

            そこで
              ・いま解いている問の見出し（問2 …）
              ・その問の音源（再生／2回／速度）
              ・その問の図（第1問B のイラスト）
            をすべて問題文ペイン＝左側にまとめる。
            右の解答ペインには選択肢（①〜④）だけが残るので、
            「どの問を解いているのか」も左を見れば必ず分かる。

            さらに、毎回同じ指示文（リード文）より前に置く。
            後ろに置くと「スクロールしてから再生を押す」ことになり、
            ご要望「スクロールしてわざわざ答えるのめんどい」に反する。
          */}
          {listeningUnified && activeStepSub && (() => {
            /*
              ★第4問以降：1ステップに複数の小問（問18〜21 など）★
              見出しはステップ側のラベル（'問18〜21'）を使い、設問文の代わりに
              音源トラックの hint（場面の日本語）を出す。個々の空所の見出しは
              解答欄側（AnswerPane）が欄ごとに出すので、ここでは繰り返さない。
              第1〜3問（ステップ＝小問1つ）は従来どおり小問のラベルから作る。
            */
            const currentStep = listeningSteps[safeStepIndex];
            const grouped = !!currentStep && currentStep.subQuestionIds.length > 1;
            const stepTrack = listeningTracks.find((t: any) => t?.subId === activeStepSub.id);
            const stepMarker = grouped && currentStep
              ? currentStep.label
              : stepLabelOf(activeStepSub, safeStepIndex);
            const { body: labelBody } = splitQuestionLabel(activeStepSub.label || '', stepMarker);
            const body = grouped ? String(stepTrack?.hint || '') : labelBody;
            /*
              ★短い設問文は見出しと同じ行に載せる（ご要望）★
              ------------------------------------------------------------
              ご指摘：
                「発話に合うイラストっていう文字をさ、問4（全4問中4問目）の
                  右にもってこれば、もう少し図を上にできるでしょ」

              第1問B の設問文は「発話に合うイラスト」の一言だけなのに、
              見出し行の下に独立した <p> として置かれていた。
              そのため
                ・見出し行（問4 …）
                ・設問文行（発話に合うイラスト）
              で2行ぶんの高さを使い、そのぶん図が下に押し出されて
              画面外で切れていた。

              そこで「1行に収まる短さ（全角20文字相当まで）」の設問文だけ
              見出し行へ寄せ、丸ごと1行ぶん節約して図を上げる。

              ★長い設問文（第1問A・第3問の英文の問い）は従来どおり
                下の段落に置く★
                「話者がマイクに伝えたい内容に最も近い英文」のような
                長い設問文まで見出し行に押し込むと、逆に見出し行が
                2〜3行に折り返して高さが増えてしまう（本末転倒）。
            */
            /*
              ★「20文字」を「見た目の幅20文字ぶん」に改める★
              ------------------------------------------------------------
              ご指摘（手書きの指示書）：第2問の図が小さすぎる。

              ■ 何が起きていたか（390x664・第2問・問1 で実測）
                第2問の設問文は英語の一言
                  「What will the man drink?」
                で、日本語なら一目で1行と分かる短さなのに、
                body.length は★24★。しきい値20を超えるので
                blockBody（見出しの下の独立した段落）に落ちていた。
                その結果
                  見出し 32px ＋ 設問文 24px ＋ 下余白 12px
                と2行ぶんを使い、図の取り分が 36px 減っていた
                （実測：第1問B の図 134px に対し第2問は 96px）。

              ■ 直し方：文字数ではなく「表示上の幅」で測る
                英数字・記号は日本語のほぼ半分の幅しか取らない。
                そこで ASCII は 0.5 文字、それ以外は 1 文字として
                合計幅を出し、これが 20 以下なら見出し行に載せる。
                  「What will the man drink?」 → 幅 12 → 見出し行へ
                  「発話に合うイラスト」        → 幅 9  → 見出し行へ（従来どおり）
                  長い英文の問い（60文字超）    → 幅 30〜 → 従来どおり段落へ
                しきい値そのもの（20）は動かさないので、
                日本語の設問文の振り分けは一切変わらない。
            */
            const displayWidthOf = (t: string) =>
              [...t].reduce((w, ch) => w + (ch.charCodeAt(0) < 0x80 ? 0.5 : 1), 0);
            const inlineBody = body && displayWidthOf(body) <= 20 ? body : '';
            const blockBody = inlineBody ? '' : body;
            /*
              ★英文法：英文そのものを必ず出す（ご要望11）★
              ------------------------------------------------------------
              ご指摘（原文）：
                「英文法は普通に英文ないと問題成立しやんのやけど
                  音声のボタンを少し小さくした上で、英文しっかり載せて。」

              ■ なぜ英文が消えていたのか
                英文法の問題は音源（audioTracks）を持つので、この画面は
                リスニングと同じ扱い（listeningUnified = true）になる。
                その結果、下の
                  {!listeningUnified && ( …question.text を描画… )}
                の分岐で question.text が丸ごと描画されなくなっていた。
                リスニングは「英文は音声にしか無い・本文はリード文だけ」なので
                これが正しいのだが、英文法は question.text の中の
                  問1　I ______ to Kyoto three times, so I can show you around.
                が唯一の英文なので、消すと空所補充なのに空所のある文が無い、
                つまり問題として成立しない状態になっていた。
                代わりに出ている設問文（label）は「経験の現在完了」という
                文法項目名だけで、英文はどこにも含まれない（全20問で実測）。

              ■ 科目で分岐しない
                ご指摘「コードで形式的に作ると問題によっておかしくなる
                可能性がある」を踏まえ、「英文法なら出す」ではなく
                「その問題の本文に、その小問番号の英文が実在するなら出す」
                という問題ごとの判定にする。
                実測では英文法20問すべてで英文が取れ、
                リスニング44問すべてで取れない（＝自動的に無効になる）。
                将来データが変わっても、英文がある問題だけで有効になる。
            */
            const stepSentence = findSubQuestionSentence(currentQuestion, activeStepSub);
            return (
              <div className={listeningMobileSplit ? 'flex min-h-0 flex-1 flex-col' : 'mb-4'}>
                {/* いま解いている問の見出し。回の中で迷子にならないよう
                    「問2 / 全4問」まで添える。 */}
                <div className={`flex items-center gap-2 flex-wrap ${
                  // 図つきのスマホでは、この 8px も図に回す。
                  listeningMobileSplit ? 'mb-1.5' : inlineBody ? 'mb-2' : 'mb-2.5'
                }`}>
                  <span className="font-bold text-white text-sm bg-[#2C3E50] py-1.5 px-3.5 rounded-lg shadow-sm shrink-0">
                    {formatText(stepMarker)}
                  </span>
                  {listeningSteps.length > 1 && (
                    <span className="text-xs font-bold text-gray-500 shrink-0">
                      （全{listeningSteps.length}問中 {safeStepIndex + 1}問目）
                    </span>
                  )}
                  {/* 短い設問文はここ（問N の右）に置く。行を増やさない。 */}
                  {inlineBody && (
                    <span className="min-w-0 text-[14px] md:text-base font-bold leading-snug text-gray-800 font-modern break-words [overflow-wrap:anywhere]">
                      {formatText(inlineBody, combinedHighlights, { prose: isEnglishProse })}
                    </span>
                  )}
                </div>

                {blockBody && (
                  <p className="text-[15px] md:text-base leading-relaxed text-gray-800 font-modern break-words [overflow-wrap:anywhere] mb-3">
                    {formatText(blockBody, combinedHighlights, { prose: isEnglishProse })}
                  </p>
                )}

                {/*
                  ★英文法の英文（空所つき）★
                  これが「解く対象」そのものなので、設問文（文法項目名）より
                  目立たせ、音源ボタンより上＝いちばん先に目に入る位置に置く。
                  薄い枠の箱にして「ここが読むべき英文」と分かるようにする。
                  prose: true で組むので、英単語がセリフ体に化けない。
                */}
                {stepSentence && (
                  <p className="mb-2.5 rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2 text-[16px] md:text-base font-bold leading-relaxed text-gray-900 font-modern break-words [overflow-wrap:anywhere]">
                    {formatText(stepSentence, combinedHighlights, { prose: true })}
                  </p>
                )}

                {/* この問の音源。問題文のすぐ下＝「問題のところ」に横帯で置く。
                    横帯なのでボタンはどれも 44px 以上あり、指で押しやすい。
                    ★枠つきの箱には入れない（ご指摘：「再生ボタンも置くのは
                      いいけどそのせいで問題と選択肢のボタンが見えなくなってる」）。
                      箱の枠と余白のぶん縦幅を食っていたので、ボタン列だけの
                      スリムな1行にして、設問文・図・選択肢に高さを譲る。 */}
                {hasTrackFor(activeStepSub.id) && (
                  <ListeningAudioPlayer
                    tracks={listeningTracks}
                    focusSubId={activeStepSub.id}
                    variant="inline"
                    orientation="horizontal"
                    mode="practice"
                    tone="light"
                    readCount={(currentQuestion as any).readCount || 2}
                    /* 第4問以降：本番どおり1回だけ再生（データ側の playOnce） */
                    playOnce={!!(currentQuestion as any).playOnce}
                  />
                )}

                {/*
                  この問の図（第1問B のイラスト①〜④）。
                  選択肢の中ではなく問題側に置く（ご要望）。

                  ★スマホの高さ上限をやめる（ご指摘「図が隠れてる」）★
                  以前は max-h-[22vh] で頭打ちにしていた。問題文ペインが
                  40vh で固定だった時代に「見出し＋音源＋図」を無理に
                  押し込むための数字だったが、
                    ・4コマイラストは縦にも情報があるので 22vh では
                      下2コマがほぼ潰れる
                    ・親側が overflow-y-auto なので、はみ出した分は
                      スクロールしないと見えない＝実質「隠れている」
                  という状態になっていた。

                  いまは問題文ペインが flex-1（余り高さを全部もらう）に
                  なったので、図は fill で「もらえた高さいっぱい」まで
                  伸ばす。縦を基準に縮小されるので、4コマ全体が
                  1画面に収まる。

                  ★ご要望「画像のある問題の画像が小さいので確認して。
                    クリックしてズーム機能はいらない。」★
                  これまでは「小さくてもタップで拡大できる」前提で
                  max-h-[22vh]（390x844 で 186px）という強い上限を
                  掛けていた。拡大機能を外すので、この上限だと
                  4コマの文字が読めなくなる。
                  上限自体は「音源・選択肢と同時に見える」ために必要なので、
                  22vh → 42vh（=354px、ほぼ横幅と同じ）まで緩める。
                */}
                {activeStepSub.imageUrl && (
                  <QuestionFigure
                    src={activeStepSub.imageUrl}
                    /*
                      ★スマホの図つきリスニングでは図の説明を出さない★
                      ご指摘（手書きの指示書）：
                        「図の説明はいらない」「なにもなし」

                      実測（390x664・第2問）で、figcaption
                      「問1 の選択肢イラスト（①〜④の4枚）」は 20px を
                      占めていた。図の中身（①〜④のイラスト）を見れば
                      「選択肢のイラストが4枚ある」ことは自明なので、
                      この20pxは説明として払う価値がない。
                      figure は fill（余り高さいっぱい）なので、
                      消した20pxはそのまま図の高さに変わる。

                      ★データ側（imageCaption）は消さない★
                        解説画面（Explanation.tsx）や PC では図が小さく
                        並ぶので説明が要る。ここで渡さないだけにして、
                        影響範囲をこの画面に閉じる。

                      ★alt は必ず明示する★
                        QuestionFigure は alt が無いとき caption を
                        代わりに使う実装なので、caption を落とすだけだと
                        スクリーンリーダー向けの説明も同時に消えてしまう。
                        画面には出さず、alt にだけ残す。
                    */
                    caption={listeningMobileSplit ? undefined : activeStepSub.imageCaption}
                    alt={activeStepSub.imageCaption || undefined}
                    tone="light"
                    // 図が高さ上限に張り付いている（実測で余り 0px）ので、
                    // 上余白も 12px → 8px に詰めて図の取り分に回す。
                    // 図は「余り高さいっぱい」なので、上余白を削ったぶんは
                    // そのまま図の高さに変わる。8px → 4px。
                    className={listeningMobileSplit ? 'mt-1' : 'mt-3'}
                    fill={listeningMobileSplit}
                    imgClassName={
                      listeningMobileSplit ? '' : 'max-h-[42vh] md:max-h-[52vh] object-contain'
                    }
                  />
                )}

              </div>
            );
          })()}

          {/* ★リスニング：毎回同じリード文（回の説明）は解答中の画面には出さない。
              ご要望：「第一問Aでは・・・のところいらない。ここのスペースを
                      解答の選択肢のスペースに当てて」
              回の説明は、回を選んだ直後の「問題の説明ページ」（showingBriefing）で
              一度だけ読む。解答中の左ペインは「いま解いている問の見出し・
              設問文・音源・図」だけになり、浮いた縦幅は選択肢・図の表示に回る。
              化学など（listeningUnified=false）は従来どおり全文を出す。 */}
          {!listeningUnified && (
            inlineQuestionRows ? (
              /*
                スマホ・横並び表示（ご要望8）
                ─────────────────────────────────────────
                「(1)から4問縦書きになってるけど、横書きにしたら
                  1画面に収まるくない？」

                リード文（次の不定積分を求めよ…）はそのまま1行で出し、
                (1)〜(4) だけを 2 列に並べる。4 問なら 4 行 → 2 行になり、
                浮いた高さが解答欄に回る。

                ★grid ではなく flex-wrap を使う理由
                  grid は列幅を固定するので、想定より長い項目が来ると
                  はみ出す/文字が切れる。flex-wrap なら「入らなければ
                  次の行に折り返す」だけなので、判定をすり抜けた
                  長い項目が来ても崩れない（二重の安全網）。
                  basis-[calc(50%-0.25rem)] で通常は 2 列、
                  min-w-0 で長い数式も折り返せるようにする。
              */
              <div className="flex flex-col gap-1.5">
                {inlineQuestionRows.lead && (
                  <ExplanationBody
                    text={inlineQuestionRows.lead}
                    highlights={combinedHighlights}
                  />
                )}
                <ul className="flex flex-wrap gap-x-2 gap-y-1.5">
                  {inlineQuestionRows.rows.map((row, rIdx) => (
                    <li
                      key={rIdx}
                      className="flex min-w-0 grow basis-[calc(50%-0.25rem)] items-baseline gap-1"
                    >
                      {row.marker && (
                        <span className="shrink-0 font-bold text-gray-500">
                          {formatText(row.marker)}
                        </span>
                      )}
                      <span className="min-w-0">
                        {formatText(row.body, combinedHighlights)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <ExplanationBody
                text={cleanQuestionText(currentQuestion.text)}
                highlights={combinedHighlights}
                /* ★問題文の「【会話文】」「【資料2 …】」を四角囲みにする（スマホのみ）★
                   実物の共通テスト冊子と同じく、資料のかたまりを枠で
                   本文から切り離して読みやすくする。PC は md: で
                   枠を打ち消すため従来と同じ見た目。 */
                boxedSections
              />
            )
          )}
          {currentQuestion.text.includes('図6') && (
            <div className="mt-4">
              <IonizationEnergyChart showDetails={false} />
            </div>
          )}
          {/* 問題に付随する図・イラスト（PDF由来の図版など） */}
          {currentQuestion.imageUrl && (
            <QuestionFigure
              src={currentQuestion.imageUrl}
              caption={currentQuestion.imageCaption}
              figureNumber={getFigureNumber(figureNumberMap, currentQuestion.id)}
              tone="light"
              className="mt-5"
            />
          )}
          {/* 表示ルール1・2：左側の「問題文」欄には共通リード文に加えて、
              続く全小問の設問文（問1、問2、…）を順番に表示する。
              左側だけ読めば全設問が理解できるようにする。

              ★ただし英語リスニングのように「選択肢本文を解答カードに移した」
                問題では、設問一覧を出すと設問文が左右2か所に分かれてしまう。
                ご要望「問題文と解答欄を分離しないで」に反するため、
                その場合は設問一覧を出さず、解答カード側に一本化する。 */}
          {(() => {
            if (listeningUnified) return null;
            /* ★スマホ：設問一覧が問題文の丸写しなら出さない（ご要望8）
                 「設問一覧と問題が同じなので、同じやつはもう設問一覧いらない」
               数学の (1)〜(4) のように、設問一覧が上の問題文と一字一句
               同じ問題では、同じ数式が1画面に2回出て縦幅を二重に食う。
               科目では決めず「一覧の全項目が問題文に含まれるか」で判定し、
               1項目でも欠ける問題では一覧を残す（情報を消さない）。
               PC は横幅に余裕があるので従来どおり両方出す。 */
            if (hideRedundantSubQuestionList) return null;
            const sqList = buildSubQuestionList(currentQuestion);
            if (sqList.length === 0) return null;
            return (
              <div className="mt-4 pt-3 border-t border-dashed border-gray-300">
                <div className="text-xs font-bold mb-2 text-gray-500">設問一覧</div>
                <ol className="space-y-2">
                  {sqList.map((item, sIdx) => (
                    <li key={sIdx} className="flex items-start gap-2">
                      {item.marker && (
                        <span className="shrink-0 font-bold text-xs px-2 py-0.5 rounded-md border mt-0.5 bg-gray-50 text-gray-600 border-gray-200">
                          {formatText(item.marker)}
                        </span>
                      )}
                      <span className="min-w-0 leading-relaxed">
                        {formatText(item.body, combinedHighlights)}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })()}
          {/* 問題解答画面（回答入力中）にはロジックツリーを表示しない。
              ロジックツリーは「単元選択・学習フローチャート」画面と
              「解答解説ページ」にのみ表示する。 */}
        </div>
      </div>
    </div>
    </>
  );
}
