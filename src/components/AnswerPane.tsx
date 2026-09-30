/**
 * =====================================================================
 * 解答ペイン（画面の右側／スマホでは下側）
 * =====================================================================
 * ■ なぜ Quiz.tsx から切り出したのか
 *   Quiz.tsx の JSX のうち 503 行をこのペインが占めていて、
 *   「どこを直せばどこが変わるのか」が追いにくくなっていた。
 *   問題文ペイン（ProblemPane.tsx）と同じ考え方で、見た目だけを
 *   このファイルに預け、状態と判定は Quiz.tsx に残している。
 *
 * ■ 動きも見た目も 1 ピクセルも変えていない
 *   JSX は Quiz.tsx にあったものをそのまま移しただけ。
 *   props の名前も Quiz.tsx 側の呼び名と同じにして、
 *   下の JSX を書き換えなくて済むようにしている。
 *
 * ■ ここを触るときの注意
 *   幅（lg:w-[42%]）や余白（px-2 / px-4 / md:p-8）、
 *   スマホの「1設問ずつ見せるページャー」の条件分岐は、
 *   実際の端末で測って決めた値。問題によって長さが違うので、
 *   キリのいい値に直すと特定の問題だけ崩れる。
 *   ・PC（md: / lg:）の指定は変更しないこと
 *   ・数値を「それらしい値」に丸めないこと
 */
import React, { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Edit3 } from 'lucide-react';
import { formatText } from '../utils/textFormatter';
import { answerCardMarker } from '../utils/questionDisplay';
import { ChemistryPalette, MathPalette } from './SymbolPalette';
import { requiresChemicalSymbols, requiresMathSymbols } from '../utils/quizPaletteRules';
import { handleInputFocusScroll } from '../utils/quizInputScroll';

export interface AnswerPaneProps {
  /** いま表示している大問。 */
  currentQuestion: any;
  /** 画面幅が PC 相当かどうか（true なら右ペイン、false ならスマホの下ペイン）。 */
  isDesktop: boolean;
  /** 解答（設問ID → 文字列 or 文字列配列）。 */
  answers: Record<string, any>;
  /** 入力欄の値が変わったときに呼ぶ。 */
  handleTextChange: (sqId: string, value: string) => void;
  /** 入力欄の ref を設問ごとに配る関数。 */
  getInputRef: (sqId: string) => any;
  /** 入力欄の ref をまとめて持つ箱（フォーカス移動に使う）。 */
  inputRefs: React.MutableRefObject<Record<string, any>>;
  /** リスニングで「音源がある」状態か。 */
  listeningUnified: boolean;
  /** リスニングのスマホ2分割表示か。 */
  listeningMobileSplit: boolean;
  /** リスニングのスマホ2分割で、かつ図が無い状態か（余りを解答側がもらう）。 */
  listeningMobileNoFigure: boolean;
  listeningMaterialsMobile?: boolean;
  /** いまフォーカスしている設問ID（スマホの入力バーと連動）。 */
  focusedSubId: string | null;
  setFocusedSubId: (v: string | null) => void;
  /** スマホでページャー表示する設問の並び。 */
  mobileAnswerSubs: any[];
  /** ページャーのいまの位置（範囲外にならないよう丸めた値）。 */
  safeMobileAnsIdx: number;
  /** ページャーを1つ進める／戻す。 */
  goMobileAns: (delta: number) => void;
  /** スマホのカードでキー操作したときの扱い。 */
  handleMobileCardKeyDown: (sq: any) => (e: React.KeyboardEvent) => void;
  /** その設問が「入力の並びの最後」かどうか（Enter を done にするため）。 */
  isLastNavSub: (sq: any) => boolean;
  /** PC で設問をグループ分けして並べた結果。 */
  renderedAnswerGroups: any;
  /** 選択式の解答UI（実体は MultipleChoiceControl.tsx）。 */
  renderMultipleChoiceControl: (sq: any) => React.ReactNode;
  /** スマホの数学で、入力の設問を 4択にしたもの（作れなければ null → 入力のまま） */
  mobileChoiceSub?: (sq: any) => any | null;
  /** 並べ替えの解答UI（実体は SortingControl.tsx）。 */
  renderSortingControl: (sq: any) => React.ReactNode;
  /** この大問が数式パレットを要るかどうか。 */
  questionNeedsMathPalette: boolean;
  /** 問題文を全画面表示している最中か。 */
  isProblemExpanded: boolean;
  /** 「前へ」が押せるか。 */
  canGoPrevious: boolean;
  handlePrevious: () => void;
  handleNext: () => void;
}

export function AnswerPane({
  currentQuestion,
  isDesktop,
  answers,
  handleTextChange,
  getInputRef,
  inputRefs,
  listeningUnified,
  listeningMobileSplit,
  listeningMobileNoFigure,
  listeningMaterialsMobile = false,
  focusedSubId,
  setFocusedSubId,
  mobileAnswerSubs,
  safeMobileAnsIdx,
  goMobileAns,
  handleMobileCardKeyDown,
  isLastNavSub,
  renderedAnswerGroups,
  renderMultipleChoiceControl,
  mobileChoiceSub,
  renderSortingControl,
  questionNeedsMathPalette,
  isProblemExpanded,
  canGoPrevious,
  handlePrevious,
  handleNext,
}: AnswerPaneProps) {
  const answerScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (listeningMaterialsMobile && answerScrollRef.current) answerScrollRef.current.scrollTop = 0;
  }, [listeningMaterialsMobile, safeMobileAnsIdx, currentQuestion.id]);
  return (
    <>
    {/* Section 2: Answers Area
        スマホ（!isDesktop）では、下部の「前へ / 解答と解説を見る」ナビゲーションを
        画面下に固定バーとして常時表示する（要件1）。そのぶん、解答欄の内容が
        固定バーに隠れないよう下部余白を大きめに確保する。
        ページ全体は fixed inset-0 + overflow-hidden で固定され、スワイプ/ページ
        スクロールでの問題送りは発生しない。問題送りは固定バーの前へ/次へのみ。 */}
    {/* 下部余白：フローティングバーは「マーカー＋前へ/次へ＋完了」だけの
        細い1行になった（入力欄・パレットは撤去）ので、9rem → 6.5rem に戻す。
        解答欄も1設問ずつの固定表示（ページャー）になり、縦に長く
        スクロールすることは基本なくなった。 */}
    {/*
      ★リスニング（スマホ）だけ、このペインを「中身の高さ」にする★
      ------------------------------------------------------------------
      ご指摘：「選択肢の下に空白合って無駄」

      原因はここの flex-1 だった。①〜④ の4ボタンしか無いのに
      余った高さを全部受け取るので、カードの下に何も無い空白が
      そのまま残っていた。

      リスニングでは flex-none にして中身のぶんだけ確保する。
      余った高さは上の問題文ペイン（flex-1）＝図に回るので、
        ・選択肢カードが画面下（下部ナビの真上）まで下がる
        ・カード下の無駄な空白が消える
        ・図が切れずに大きく出る
      が一度に達成できる。paddingBottom も、リスニングでは
      「下部ナビの高さぶん」だけに絞る（余計な空白を作らない）。

      化学など（listeningUnified=false）は flex-1 のままで、
      長い記述欄をスクロールできる従来の挙動を保つ。
    */}
    {/*
      ★図が無い大問（第1問A・第3問・第2問）はここが余りを受け取る★
      ------------------------------------------------------------------
      ご要望：「他の大問のUIも変えてくれない？第1問Aも第3問も
               これから入る予定の第2問とその他も」

      第1問B 用の配り方（問題文ペイン＝flex-1）をそのまま流用すると、
      図が無いぶんの高さが「再生ボタンの下の巨大な空白」になり、
      消したはずの無駄な空白が場所を変えて再発してしまう。

      そこで図が無いときは受け取り手を入れ替える。
        ・flex-1        … 余った高さをこのペインがもらう
        ・justify-end   … 選択肢カードを下端（下部ナビの真上）に寄せる
                          ＝親指の届く位置。ご要望「もっと下にもってきて」
      もらった高さは、下の auto-rows-fr で選択肢の背を伸ばすのに使う。
    */}
    {/* ★B-1：選択肢の本文幅を稼ぐため、リスニングのスマホだけ左右余白を詰める★
        px-4（16px×2）→ px-2（8px×2）で 16px を本文に回す。
        対象を listeningMobileSplit に限るのは、化学など従来の問題では
        解答欄が小さなチップの集まりで、余白を詰めると窮屈になるため。
        md 以上（PC）は md:p-8 が後ろで上書きするので影響しない。 */}
    <div ref={answerScrollRef} data-listening-answer-pane={listeningMaterialsMobile || undefined}
      className={`lg:w-[42%] min-h-0 overflow-y-auto bg-gray-50/50 ${
        listeningMobileSplit ? 'px-2' : 'px-4'
      } md:p-8 ${
        /*
          ★資料つきリスニング（スマホ）の高さ配分★
          ご指摘：「リスニングがまだ一画面に映ってない（後半パート）。見にくい」
          以前は資料ペインも解答ペインも flex-[1_1_0%]（きっちり半々）だった。
          実測（375x740）：
            第4問A … 解答の中身 437px に対して枠 298px → ⑤ が隠れる
            第4問B … 解答の中身 230px しか無いのに枠 298px → 下 70px が空白、
                     一方で資料（条件＋表 525px）は 188px しか見えない
          つまり「解答が足りない問」と「解答が余っている問」が同時に起きていた。
          そこで解答ペインは「中身のぶんだけ・上限 58%」にし、残りを全部資料へ渡す。
            ・中身が小さい問（第4問B・第6問 問37）… 余りが資料の高さになる
            ・中身が大きい問（第4問A・第5問・第6問A）… 58% まで伸びて選択肢が
              ほぼ全部見える（残りは従来どおりこのペイン内でスクロール）
          資料ペイン側は flex-[1_1_0%] のままなので、常に「解答が取らなかった分」を受け取る。
        */
        listeningMaterialsMobile ? 'flex-[0_1_auto] max-h-[58%] pt-0 overscroll-contain' : listeningMobileNoFigure
          ? 'flex-1 flex flex-col justify-end pt-2'
          : listeningMobileSplit ? 'flex-none pt-2' : 'flex-1 pt-4'
      } ${listeningMaterialsMobile ? 'pb-2' : isDesktop
        ? 'pb-8'
        : listeningMobileSplit
          // 下部ナビ（前へ/解答と解説を見る）の高さぶんだけ空ける。
          ? 'pb-[calc(4.75rem+env(safe-area-inset-bottom))]'
          : 'pb-[calc(6.5rem+env(safe-area-inset-bottom))]'
      } relative ${!isDesktop && isProblemExpanded
          ? 'hidden'
          // 図が無い大問は flex で高さの連鎖を通す（block だと切れる）。
          : listeningMobileNoFigure ? 'z-10' : 'block z-10'}`}>
      {/* 図が無い大問では、この内側ラッパにも flex/min-h-0 を通しておく。
          ここで連鎖が切れると下の auto-rows-fr が伸びる先を失う。 */}
      <div className={`max-w-2xl mx-auto md:space-y-6 ${listeningMobileSplit ? 'space-y-2' : 'space-y-4'} ${
        listeningMobileNoFigure ? 'flex min-h-0 flex-1 flex-col' : ''
      }`}>
        {/* 「解答入力」見出しはスマホでは出さない（ご指摘：「左上にある
            解答入力というボタンでスペースなくなってるから消してほしい」）。
            各カードの先頭に (ア) や 問2 のマーカーがあるので、
            見出しがなくても「ここが解答欄」と分かる。浮いた縦幅は
            選択肢・入力欄の表示に回す。PC は余白が十分なので従来どおり。 */}
        <h3 className="hidden lg:block font-bold text-gray-400 text-sm md:text-base mb-2 md:mb-4">解答入力</h3>
        {/* スマホ：解答欄ページャー（要望：スクロールをやめ、1設問ずつ固定表示。
            左右の黒い小さな矢印で表示する解答欄を切り替える）。
            位置表示（n / 全体）で「あといくつ解答欄があるか」も分かるようにする。 */}
        {!isDesktop && !listeningMaterialsMobile && mobileAnswerSubs.length > 1 && (
          <div className="text-center text-[11px] font-bold text-gray-400 tracking-widest select-none -mb-1">
            {safeMobileAnsIdx + 1} / {mobileAnswerSubs.length}
          </div>
        )}
        {/*
          ★スマホ：解答欄ページャーの矢印は「切り替える先があるとき」だけ置く★
          ─────────────────────────────────────────────────────────────
          ご指摘（B-1）：
            「選択肢の文章の幅が狭い。画面の幅に合わせ、④も見えるようにしたい。」

          ■ 何が起きていたか（390px 幅で実測・積算）
            以前は !isDesktop なら常にこの矢印を描き、行き先が無いときは
            invisible で「見えないが場所は取る」状態にしていた。
            w-7（28px）が左右で 56px ＝ 画面幅 390px の 14% を、
            解答欄が1つしか無い問でも占め続けていた。

            横幅の内訳（390px・図なしリスニング）：
              解答ペイン px-4          -32px
              ページャー矢印 w-7 ×2    -56px  ← ★これ★
              カード p-3.5             -28px
              選択肢ボタン px-4        -32px
              ①と本文の gap-2.5        -10px
              マーク①                  -18px
              ────────────────────────────
              英文に残る幅              214px（画面幅の 55%）

            英文が 55% の幅に押し込められて行数が増え、
            その増えた行数のぶんだけ ④ が下へ押し出されて切れていた。
            （④ が切れていたのは左右ではなく上下方向。原因は「幅」）

          ■ 直し方
            すぐ上の「n / 全体」表示と同じ条件（length > 1）でガードする。
            解答欄が1つの問では矢印を描かないので 56px がそのまま本文に回る。
            2つ以上ある問では従来どおり出る（切り替え手段は失わせない）。
            invisible を残さないのは、「見えないのに場所を取る」ことが
            今回の幅不足の直接原因だったため。
          PC（isDesktop）は contents のままで、見た目は一切変わらない。
        */}
        {listeningMaterialsMobile && (
          /*
            ★問N を固定バーに出す★
            ご指摘：「選択肢が1画面に入らないところはスクロールできるが、その時に
            問〜のところがスクロールで上に隠れていかないように左上に固定できない？」
            以前はカードの中に 問34 の札があり、選択肢を下へスクロールすると
            この sticky なバーの下に潜って見えなくなっていた。
            いま見ている小問の 問N（＋空所の見出し）をこのバーの左に置き、
            カード側の札はスマホでは出さない（重複を避ける）。
          */
          <nav aria-label="小問の切り替え" className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b bg-gray-50 py-0.5">
            <span className="flex min-w-0 items-baseline gap-1.5 text-xs font-bold text-gray-600">
              {(() => {
                const cur = mobileAnswerSubs[safeMobileAnsIdx]?.sq;
                const idx = cur ? ((currentQuestion?.subQuestions || []) as any[]).indexOf(cur) : -1;
                const marker = cur ? answerCardMarker(cur, idx < 0 ? safeMobileAnsIdx : idx, currentQuestion) : '';
                return (
                  <>
                    {marker && (
                      <span className="shrink-0 rounded-md bg-[#2C3E50] px-2 py-0.5 text-[12px] text-white">
                        {formatText(marker)}
                      </span>
                    )}
                    {cur?.blankHint && (
                      <span className="min-w-0 truncate text-[12px] text-[#2C3E50] font-modern">
                        {formatText(String(cur.blankHint), [], { prose: true })}
                      </span>
                    )}
                    <span className="shrink-0 tabular-nums text-gray-500">{safeMobileAnsIdx + 1}/{mobileAnswerSubs.length}</span>
                  </>
                );
              })()}
            </span>
            <div className="flex shrink-0 gap-1">
              <button type="button" aria-label="前の解答欄へ" disabled={safeMobileAnsIdx === 0}
                onClick={() => goMobileAns(-1)} className="min-h-11 min-w-11 rounded border bg-white px-2 text-xs font-bold disabled:opacity-30">前の小問</button>
              <button type="button" aria-label="次の解答欄へ" disabled={safeMobileAnsIdx >= mobileAnswerSubs.length - 1}
                onClick={() => goMobileAns(1)} className="min-h-11 min-w-11 rounded border bg-white px-2 text-xs font-bold disabled:opacity-30">次の小問</button>
            </div>
          </nav>
        )}
        <div className={isDesktop ? 'contents' : 'flex items-stretch gap-1'}>
          {!isDesktop && !listeningMaterialsMobile && mobileAnswerSubs.length > 1 && (
            <button
              type="button"
              onClick={() => goMobileAns(-1)}
              onMouseDown={(e) => e.preventDefault()}
              aria-label="前の解答欄へ"
              className={`shrink-0 flex items-center justify-center w-7 text-gray-900 active:bg-gray-200/60 rounded-lg cursor-pointer ${safeMobileAnsIdx <= 0 ? 'invisible' : ''}`}
            >
              <ChevronLeft size={20} className="stroke-[2.75]" aria-hidden="true" />
            </button>
          )}
          <div className={isDesktop ? 'contents' : 'flex-1 min-w-0 space-y-4'}>
        {renderedAnswerGroups.map((g: any, gIdx: number) => {
          if (g.type === 'group') {
            return (
              <div key={`group-${gIdx}`} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:border-[#A9CCE3]/50 transition-all duration-250 flex flex-col gap-4">
                <span className="font-bold text-[#2C3E50] text-sm text-left bg-blue-50/50 border border-[#A9CCE3]/30 py-2.5 px-4 rounded-xl leading-relaxed shadow-xs w-full block">
                  {formatText(g.groupName)}
                </span>

                {/*
                  空欄グリッドの列数（スマホ入力UI改善）
                  ─────────────────────────────────────────────
                  以前は grid-cols-3（＋効いていない xs:grid-cols-4）で、375px 幅の
                  端末では 1 セルが約 90px しかなく、タップ・視認ともに窮屈だった。
                  スマホでは 2 列に減らして 1 セルあたりの幅を約 1.5 倍に広げる。
                  sm 以上は従来どおり列数を増やし、PC の見た目は変えない。
                */}
                <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-6 gap-2.5 sm:gap-3 w-full">
                  {g.items.map((sq: any) => {
                    const isFocusedBlank = focusedSubId === sq.id;
                    return (
                    <div
                      key={sq.id}
                      className={`flex flex-col gap-1.5 min-w-[50px] p-2.5 sm:p-2 border rounded-xl shadow-2xs transition-colors ${
                        isFocusedBlank
                          ? 'bg-[#A9CCE3]/20 border-[#A9CCE3] ring-2 ring-[#A9CCE3]/40'
                          : 'bg-stone-50/80 border-stone-200/60'
                      }`}
                    >
                      <span className="font-bold text-stone-500 text-[13px] sm:text-xs text-center border-b border-stone-200/60 pb-1.5 sm:pb-1 select-none font-sans">
                        {sq.label}
                      </span>
                      {isDesktop ? (
                        <input
                          type="text"
                          value={answers[sq.id] || ''}
                          onChange={(e) => handleTextChange(sq.id, e.target.value)}
                          onFocus={(e) => { setFocusedSubId(sq.id); handleInputFocusScroll(e); }}
                          placeholder="..."
                          className="w-full py-1 text-center text-sm font-bold text-stone-800 border-none outline-none focus:ring-0 leading-none bg-transparent"
                        />
                      ) : (
                        // スマホ：この欄に直接入力する（ご指摘：「タップしたらなんで
                        // 重複して解答欄が出てくるかわからん。普通に入力できる
                        // ようにしてよ」）。
                        //
                        // 以前は「カード＝表示専用チップ／実入力＝下部バーの複製
                        // 入力欄」の2段構えで、同じ設問の解答欄が画面に2つ見えて
                        // いた。タップ＝その場でキーボードが開き、打った文字は
                        // その欄にそのまま入る、という普通の入力に戻す。
                        // タップ領域は 48px 以上・文字 16px（iOS の自動ズーム防止）。
                        <input
                          ref={(el) => { inputRefs.current[sq.id] = el; }}
                          id={`ans-card-${sq.id}`}
                          type="text"
                          value={answers[sq.id] || ''}
                          onChange={(e) => handleTextChange(sq.id, e.target.value)}
                          onFocus={(e) => { setFocusedSubId(sq.id); handleInputFocusScroll(e); }}
                          onKeyDown={handleMobileCardKeyDown(sq)}
                          enterKeyHint={isLastNavSub(sq) ? 'done' : 'next'}
                          placeholder="解答"
                          aria-label={`${sq.label} の解答を入力`}
                          className={`w-full min-h-[3rem] px-2 py-1.5 text-center text-[16px] font-bold text-stone-800 leading-snug rounded-lg border outline-none transition-colors ${
                            isFocusedBlank
                              ? 'bg-white border-[#A9CCE3] ring-2 ring-[#A9CCE3]/30'
                              : 'bg-white/70 border-stone-200/70'
                          }`}
                        />
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          const sq = g.items[0];
          // 要件1：全形式でカードをタップ→固定パネル表示に統一するため、
          // フォーカス中カードのハイライトも全形式で有効にする。
          const isFocusedCard = !isDesktop && focusedSubId === sq.id;
          // 表示ルール3：右側の解答欄カードには設問文自体は含めず、
          // 設問マーカー（(ア)/(1)/問2 など）のみを表示する。
          const sqAllIndex = ((currentQuestion?.subQuestions || []) as any[]).indexOf(sq);
          // (1) の中が ①② に分かれている設問では "(1)①" のように枝番まで出す。
          // そうしないと解答欄に "(1)" が並び、今どれを入力中か分からなくなる。
          const sqMarker = answerCardMarker(sq, sqAllIndex < 0 ? gIdx : sqAllIndex, currentQuestion);
          return (
            <div key={sq.id} className={`flex flex-col gap-4 bg-white rounded-2xl shadow-sm border transition-all duration-250 ${
              // 図が無い大問はカード自身も余り高さを受け取り、
              // 中の選択肢を伸ばせるようにする（内側余白も少し詰める）。
              /* ★B-1：カード内側も詰めて本文幅を稼ぐ★
                 p-3.5（14px×2）→ px-2 py-3 で左右 12px を英文に回す。
                 縦（py-3）は詰めない。縦を削ると1行あたりの余裕が減って
                 かえって読みにくくなり、④ が見えない問題も解決しないため。 */
              listeningMaterialsMobile ? 'px-2 py-2' : listeningMobileNoFigure
                ? 'min-h-0 flex-1 max-h-full px-2 py-3'
                : listeningMobileSplit
                  /*
                    ★図がある大問（第1問B）だけ、カードの余白を図に譲る★
                    ご要望「画像のある問題の画像が小さいので確認して」

                    ■ 実測（390x844・第1問B・900x900 の4コマ）
                        図は 298x298。横幅は 366px 空いているのに
                        298px 止まりで、原因は「高さが尽きている」こと。
                        高さの内訳を測ると
                          画面 844
                          − ヘッダー 80 − 下部ナビ 76
                          − 見出し行 40 − 音源バー 44 − 図の上余白 12
                          − キャプション 28
                          − 解答ペイン 278（うちカード p-5 の上下 40）
                        ＝ 図に残るのは 298px で、余りは 0px（実測で確認）。
                        つまり図を大きくするには、どこかから高さを
                        もらう以外に方法がない。

                    ■ もらう先は「選択肢そのもの」ではなくカードの余白
                        ①〜④ のボタン高さ（52px）と行間は既出のご要望
                        「選択肢のスペースに当てて／タップしやすく」で
                        確保したものなので削らない。
                        代わりに p-5（上下 40px）を py-3.5（上下 28px）に
                        するだけにする。これは純粋な余白なので、
                        タップ領域を一切減らさずに 12px を図へ回せる。
                        左右も px-3 にして 16px を選択肢の幅に回す。

                    ■ PC・化学は対象外
                        listeningMobileSplit はスマホかつ音源つきのときだけ
                        真になるので、PC（isDesktop）と化学・数学
                        （listeningUnified=false）は従来の p-5 のまま。
                  */
                  ? 'px-3 py-3.5'
                  : 'p-5'
            } ${
              isFocusedCard ? 'border-[#A9CCE3] ring-2 ring-[#A9CCE3]/30' : 'border-gray-200 hover:border-[#A9CCE3]/50'
            }`}>
              {/*
                ★リスニング：この解答カードには「解答」だけを置く
                ------------------------------------------------------------
                ご指摘：
                  「再生ボタンはさ、左の問題の文章のところにおいてほしいよね。
                    何で解答の方に置くの？第１問の図も何で解答の方にあるの？
                    問題の方（左側）においてっていったよね」

                そこで音源・図・設問文はすべて問題文ペイン（左側）へ移した。
                ここに残すのは 問N のマーカーと選択肢（①〜④）だけ。
                化学など従来の問題は listeningUnified=false なので、
                これまでどおり設問マーカー＋入力UIの形のまま。
              */}
              <div className={`flex flex-col ${listeningMaterialsMobile ? 'gap-2' : 'gap-3.5'} w-full min-w-0 ${
                // 図が無い大問：ここも連鎖に加える（切ると選択肢が伸びない）。
                listeningMobileNoFigure ? 'min-h-0 flex-1' : ''
              }`}>
                {/* 設問マーカー（(ア)/(1)/問2 など）。
                    ★リスニングでは出さない（ご指摘：「解答のところの問4とかって
                      書いてあるのは問題のところに書いてあるのでいらない。
                      もっと選択肢と問題を一画面に出すイメージで」）。
                    左の問題ペインの見出しに 問N（全4問中N問目）が常にあるので、
                    解答カード側の 問N は重複。浮いた縦幅は選択肢・図に回す。
                    化学など（listeningUnified=false）は (ア)/(1) の目印が
                    入力に必須なので従来どおり表示する。 */}
                {!listeningUnified && (
                  <span className={`font-bold text-[#2C3E50] text-sm text-left bg-blue-50/45 border border-[#A9CCE3]/25 py-2 px-4 rounded-xl leading-relaxed shadow-xs w-fit block ${questionNeedsMathPalette ? 'font-math math-content' : ''}`}>
                    {formatText(sqMarker)}
                  </span>
                )}
                {/*
                  ★第4問以降：1画面に解答欄が複数並ぶので、欄ごとに「問N＋空所の見出し」を出す★
                  ------------------------------------------------------------
                  第1〜3問は 1画面＝1問 なので左の問題ペインの見出しで足りるが、
                  第4問以降は 問18〜21 の4欄が同じ画面に並ぶ。マークだけの
                  ①〜⑤ が4段並ぶと「どの欄が問19か」が分からないので、
                  欄の先頭に 問N と空所の見出し（1st step / Monday …）を小さく出す。
                  この見出しは renderedAnswerGroups に小問が2つ以上あるときだけ出る
                  （第1〜3問の見た目は変わらない）。
                */}
                {listeningUnified && !listeningMaterialsMobile && (renderedAnswerGroups.length > 1 || mobileAnswerSubs.length > 1) && (
                  <span className="flex items-baseline gap-2 text-[13px] font-bold text-[#2C3E50]">
                    <span className="shrink-0 rounded-md bg-[#2C3E50] px-2 py-0.5 text-[12px] text-white">
                      {formatText(sqMarker)}
                    </span>
                    {sq.blankHint && (
                      <span className="min-w-0 text-gray-600 font-modern break-words [overflow-wrap:anywhere]">
                        {formatText(String(sq.blankHint), [], { prose: true })}
                      </span>
                    )}
                  </span>
                )}

                {!isDesktop && sq.type === 'short_answer' && mobileChoiceSub?.(sq) ? (
                  // ★スマホの数学は4択★（選んだ文字列をそのまま答えとして採点する。PC は入力のまま）
                  <div className="w-full" data-math-mobile-choice>
                    {renderMultipleChoiceControl(mobileChoiceSub(sq))}
                  </div>
                ) : sq.type === 'multiple_choice' ? (
                  // ★全教科・全端末で選択肢をカード内に直接表示する。
                  //   以前のスマホは「カード＝表示専用チップ → タップで下部
                  //   固定パネルにもう1つ選択UIが出る」2段構えで、同じ設問の
                  //   解答欄が重複して見えていた（ご指摘：「タップしたらなんで
                  //   重複して解答欄が出てくるかわからん」）。
                  //   選択肢はタップ1回で確定する操作なので、遷移を挟まず
                  //   その場で押せるのが最も手数が少ない。
                  renderMultipleChoiceControl(sq)
                ) : sq.type === 'sorting' ? (
                  // ★並べ替えもカード内に直接表示（重複解答欄の解消）。
                  //   renderSortingControl はタッチ端末向けの
                  //   タップ入れ替え＋◀▶移動ボタン UI を内蔵している。
                  renderSortingControl(sq)
                ) : sq.type === 'descriptive' ? (
                  <div className="flex-grow flex flex-col gap-2 w-full">
                    {isDesktop ? (
                      <>
                        <div className="relative w-full">
                          <Edit3 className="absolute left-3 top-3 text-gray-400" size={16} />
                          <textarea
                            ref={(el) => { inputRefs.current[sq.id] = el; }}
                            value={answers[sq.id] || ''}
                            onChange={(e) => handleTextChange(sq.id, e.target.value)}
                            onFocus={(e) => { setFocusedSubId(sq.id); handleInputFocusScroll(e); }}
                            placeholder="解答を入力...（改行可）"
                            rows={3}
                            className="w-full pl-9 pr-4 py-2 md:py-2.5 text-[16px] md:text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#A9CCE3] focus:border-[#A9CCE3] outline-none transition-all font-modern resize-none bg-gray-50 focus:bg-white leading-relaxed"
                          />
                        </div>
                        {/* 化学記号パレット（反応式・化学式の記述が必要な問題のみ表示） */}
                        {requiresChemicalSymbols(sq) && (
                          <ChemistryPalette
                            value={answers[sq.id] || ''}
                            onChange={(next) => handleTextChange(sq.id, next)}
                            inputRef={getInputRef(sq.id)}
                          />
                        )}
                        {/* 数学記号パレット（数III積分など requiresMathPalette の問題のみ） */}
                        {requiresMathSymbols(sq) && (
                          <MathPalette
                            value={answers[sq.id] || ''}
                            onChange={(next) => handleTextChange(sq.id, next)}
                            inputRef={getInputRef(sq.id)}
                          />
                        )}
                      </>
                    ) : (
                      // スマホ：この欄に直接入力する（ご指摘：「タップしたらなんで
                      // 重複して解答欄が出てくるかわからん」）。
                      // 以前は表示専用チップ→下部バーの複製 textarea という
                      // 2段構えだった。タップ＝キーボードが開きここにそのまま書ける。
                      // 記号パレットはフォーカス中のみこの下（同じカード内）に出す。
                      <>
                        <div className="relative w-full">
                          <Edit3 className="absolute left-3 top-3 text-gray-400" size={16} />
                          <textarea
                            ref={(el) => { inputRefs.current[sq.id] = el; }}
                            id={`ans-card-${sq.id}`}
                            value={answers[sq.id] || ''}
                            onChange={(e) => handleTextChange(sq.id, e.target.value)}
                            onFocus={(e) => { setFocusedSubId(sq.id); handleInputFocusScroll(e); }}
                            placeholder="解答を入力...（改行可）"
                            rows={3}
                            className="w-full pl-9 pr-4 py-3 text-[16px] rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#A9CCE3] focus:border-[#A9CCE3] outline-none transition-all font-modern resize-none bg-gray-50 focus:bg-white leading-relaxed"
                          />
                        </div>
                        {/* 化学・数学記号パレット：フォーカス中の設問にだけ出す
                            （常時表示だとカードが縦に伸びて他の設問が埋もれる）。 */}
                        {focusedSubId === sq.id && requiresChemicalSymbols(sq) && (
                          <ChemistryPalette
                            value={answers[sq.id] || ''}
                            onChange={(next) => handleTextChange(sq.id, next)}
                            inputRef={getInputRef(sq.id)}
                          />
                        )}
                        {focusedSubId === sq.id && requiresMathSymbols(sq) && (
                          <MathPalette
                            value={answers[sq.id] || ''}
                            onChange={(next) => handleTextChange(sq.id, next)}
                            inputRef={getInputRef(sq.id)}
                          />
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex-grow flex flex-col gap-2 w-full">
                    {isDesktop ? (
                      <>
                        <div className="relative w-full">
                          <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input
                            ref={(el) => { inputRefs.current[sq.id] = el; }}
                            type="text"
                            value={answers[sq.id] || ''}
                            onChange={(e) => handleTextChange(sq.id, e.target.value)}
                            onFocus={(e) => { setFocusedSubId(sq.id); handleInputFocusScroll(e); }}
                            placeholder="解答を入力..."
                            className="w-full pl-9 pr-4 py-2.5 md:py-2.5 text-[16px] md:text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#A9CCE3] focus:border-[#A9CCE3] outline-none transition-all font-modern bg-gray-50 focus:bg-white shadow-sm leading-relaxed"
                          />
                        </div>
                        {/* 化学記号パレット（必要な問題のみ表示・カーソル位置に挿入） */}
                        {requiresChemicalSymbols(sq) && (
                          <ChemistryPalette
                            value={answers[sq.id] || ''}
                            onChange={(next) => handleTextChange(sq.id, next)}
                            inputRef={getInputRef(sq.id)}
                          />
                        )}
                        {/* 数学記号パレット（requiresMathPalette の問題のみ・カーソル位置に挿入） */}
                        {requiresMathSymbols(sq) && (
                          <MathPalette
                            value={answers[sq.id] || ''}
                            onChange={(next) => handleTextChange(sq.id, next)}
                            inputRef={getInputRef(sq.id)}
                          />
                        )}
                      </>
                    ) : (
                      // スマホ：この欄に直接入力する（重複解答欄の解消）。
                      // Enter＝次の空欄へ移動（最後なら確定）。
                      <>
                        <div className="relative w-full">
                          <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input
                            ref={(el) => { inputRefs.current[sq.id] = el; }}
                            id={`ans-card-${sq.id}`}
                            type="text"
                            value={answers[sq.id] || ''}
                            onChange={(e) => handleTextChange(sq.id, e.target.value)}
                            onFocus={(e) => { setFocusedSubId(sq.id); handleInputFocusScroll(e); }}
                            onKeyDown={handleMobileCardKeyDown(sq)}
                            enterKeyHint={isLastNavSub(sq) ? 'done' : 'next'}
                            placeholder="解答を入力..."
                            className="w-full pl-9 pr-4 py-3 min-h-[3.25rem] text-[16px] rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#A9CCE3] focus:border-[#A9CCE3] outline-none transition-all font-modern bg-gray-50 focus:bg-white shadow-sm leading-relaxed"
                          />
                        </div>
                        {/* 記号パレットはフォーカス中の設問にだけ出す。 */}
                        {focusedSubId === sq.id && requiresChemicalSymbols(sq) && (
                          <ChemistryPalette
                            value={answers[sq.id] || ''}
                            onChange={(next) => handleTextChange(sq.id, next)}
                            inputRef={getInputRef(sq.id)}
                          />
                        )}
                        {focusedSubId === sq.id && requiresMathSymbols(sq) && (
                          <MathPalette
                            value={answers[sq.id] || ''}
                            onChange={(next) => handleTextChange(sq.id, next)}
                            inputRef={getInputRef(sq.id)}
                          />
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
          </div>
          {/* 右矢印も左と同じ条件でガードする（B-1）。
              片側だけ残すと解答欄が中央からずれるので必ず対で揃える。 */}
          {!isDesktop && !listeningMaterialsMobile && mobileAnswerSubs.length > 1 && (
            <button
              type="button"
              onClick={() => goMobileAns(1)}
              onMouseDown={(e) => e.preventDefault()}
              aria-label="次の解答欄へ"
              className={`shrink-0 flex items-center justify-center w-7 text-gray-900 active:bg-gray-200/60 rounded-lg cursor-pointer ${safeMobileAnsIdx >= mobileAnswerSubs.length - 1 ? 'invisible' : ''}`}
            >
              <ChevronRight size={20} className="stroke-[2.75]" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Answer submission action button and back button at the bottom of the answers column
            （PC版のみ：解答欄カラムの末尾にインライン表示。
            　スマホ版では下部固定ナビゲーションバーに置き換える＝要件1） */}
        {isDesktop && (
          <div className="pt-6 border-t border-gray-200/60 flex items-center justify-between gap-3">
            <button
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              title="前の問題へ（←キー）"
              aria-label="前の問題へ"
              className={`flex h-11 w-11 items-center justify-center rounded-xl font-bold transition-all duration-200 border-2 shrink-0 cursor-pointer
                ${!canGoPrevious 
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50/50' 
                  : 'border-[#A9CCE3] text-[#A9CCE3] hover:bg-[#A9CCE3] hover:text-white bg-white shadow-sm'}`}
            >
              <ChevronLeft size={16} className="stroke-[2.5]" aria-hidden="true" />
            </button>

            <button
              onClick={handleNext}
              className="flex shadow-md hover:shadow-lg hover:-translate-y-0.5 items-center justify-center gap-1.5 px-5 min-h-11 rounded-xl font-bold tracking-wider transition-all duration-300 text-xs md:text-sm bg-[#2C3E50] text-white hover:bg-[#1B2631] flex-1 sm:flex-none sm:w-[180px] cursor-pointer"
            >
              <span>解答と解説を見る</span>
              <ChevronRight size={14} className="stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
