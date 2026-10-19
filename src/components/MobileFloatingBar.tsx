/**
 * =====================================================================
 * スマホの下部固定バー（2本）
 * =====================================================================
 * ■ 何が入っているか
 *   1本目 … 「前へ / 解答と解説を見る」のナビゲーションバー
 *   2本目 … 穴埋めを打っている最中だけ出る
 *            「(ア) 前へ 1/9 次へ 完了」の入力バー
 *   どちらも position: fixed で画面下端に置く。
 *
 * ■ なぜ Quiz.tsx から切り出したのか
 *   ProblemPane / AnswerPane / QuizHeader と同じ考え方。
 *   Quiz.tsx の JSX に残っていた最後の 125 行分。
 *
 * ■ ★消してはいけないもの★
 *   「(ア) 前へ 1/9 次へ 完了」バーは「必要」と明言されたもの。
 *   ここを整理するときに消すと要件違反になる。
 *   条件は focusedSub 基準のままにしておくこと
 *   （keyboardVisible で隠す条件を足すと、必要なものが消える）。
 *
 * ■ 動きも見た目も 1 ピクセルも変えていない
 *   JSX は Quiz.tsx にあったものをそのまま移しただけ。
 */
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Problem, SubQuestion } from '../types/curriculum';
import { formatText } from '../utils/textFormatter';
import { answerCardMarker } from '../utils/questionDisplay';
import { isShortAnswerType } from '../utils/quizBlanks';

export interface MobileFloatingBarProps {
  /** いま表示している大問。 */
  currentQuestion: Problem;
  /** 画面幅が PC 相当か（true ならこのバーは出さない）。 */
  isDesktop: boolean;
  /** 問題文を全画面表示している最中か（true なら1本目は出さない）。 */
  isProblemExpanded: boolean;
  /** スマホでソフトキーボードが出ているか。 */
  keyboardVisible: boolean;
  /** キーボードに隠れないよう持ち上げる高さ（px）。 */
  keyboardOffset: number;
  /** いま入力している設問。null なら1本目のナビが出る。 */
  focusedSub: SubQuestion | null | undefined;
  /** その設問ID。 */
  focusedSubId: string | null;
  setFocusedSubId: (v: string | null) => void;
  /** 入力欄を行き来する並び。 */
  inputNavSubs: SubQuestion[];
  /** その並びの中のいまの位置。 */
  focusedIndex: number;
  /** 入力欄のフォーカスを前後に動かす。 */
  moveFocus: (delta: number) => void;
  /** 入力欄の ref をまとめて持つ箱。 */
  inputRefs: React.MutableRefObject<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>;
  /** この大問が数式パレットを要るか。 */
  questionNeedsMathPalette: boolean;
  /** 「前へ」が押せるか。 */
  canGoPrevious: boolean;
  handlePrevious: () => void;
  handleNext: () => void;
}

export function MobileFloatingBar({
  currentQuestion,
  isDesktop,
  isProblemExpanded,
  keyboardVisible,
  keyboardOffset,
  focusedSub,
  focusedSubId,
  setFocusedSubId,
  inputNavSubs,
  focusedIndex,
  moveFocus,
  inputRefs,
  questionNeedsMathPalette,
  canGoPrevious,
  handlePrevious,
  handleNext,
}: MobileFloatingBarProps) {
  return (
    <>
    {/*
      スマホ版・下部固定ナビゲーションバー（要件1）
      ─────────────────────────────────────────────
      「前へ」「解答と解説を見る（次へ）」ボタンを画面下部に固定表示する。
      - 解答欄の内容量に関わらず常に同じ位置に表示され、位置ズレしない。
      - 問題の移動はこのボタンのみで行う（スワイプ／ページスクロールでの
        問題送りは実装しない。ページ自体は fixed + overflow-hidden で固定）。
      - 問題文の全画面表示中（isProblemExpanded）は非表示。
      - ソフトキーボード表示中（keyboardVisible）は、穴埋め移動用の
        フローティング解答バーを優先するため非表示にして重なりを防ぐ。
    */}
    {!isDesktop && !isProblemExpanded && !focusedSub && (
      <div
        className="fixed left-0 right-0 bottom-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.10)] px-3 pt-2.5 pb-[calc(0.6rem+env(safe-area-inset-bottom))]"
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            title="前の問題へ"
            aria-label="前の問題へ"
            className={`flex items-center justify-center p-3 rounded-xl font-bold transition-all duration-200 border-2 shrink-0 cursor-pointer
              ${!canGoPrevious
                ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50/50'
                : 'border-[#A9CCE3] text-[#A9CCE3] active:bg-[#A9CCE3] active:text-white bg-white shadow-sm'}`}
          >
            <ChevronLeft size={18} className="stroke-[2.5]" aria-hidden="true" />
            <span className="ml-1 text-xs">前へ</span>
          </button>

          <button
            onClick={handleNext}
            className="flex shadow-md active:translate-y-0.5 items-center justify-center gap-1.5 px-5 py-3 rounded-xl font-bold tracking-wider transition-all duration-200 text-sm bg-[#2C3E50] text-white active:bg-[#1B2631] flex-1 cursor-pointer"
          >
            <span>解答と解説を見る</span>
            <ChevronRight size={16} className="stroke-[2.5]" />
          </button>
        </div>
      </div>
    )}

    {/*
      空欄ナビバー（スマホ・テキスト入力中のみ）
      ─────────────────────────────────────────────
      ★ここには入力欄を置かない（ご指摘対応）
      ご指摘：「タップしたらなんで重複して解答欄が出てくるかわからん。
               普通に入力できるようにしてよ。」
      以前はこのバーに「複製の入力欄＋記号パレット」を出していたため、
      カードの解答欄と合わせて同じ設問の欄が2つ見えていた。
      いまは入力はカード内の欄に直接行うので、このバーは
        ・いまどの空欄を入力中か（マーカー）
        ・前へ/次へ（空欄の移動。(ア)→(イ)→… を指1本で進める）
        ・完了（キーボードを閉じる）
      だけの細い1行にする。キーボードの上端に追従して表示する。
      選択式・並べ替えはカード内で直接タップするので、このバーは出ない。
    */}
    {!isDesktop && focusedSub && (isShortAnswerType(focusedSub) || focusedSub.type === 'descriptive') && (
      <div
        id="floating-answer-bar"
        className="fixed left-0 right-0 z-[60] bg-white border-t-2 border-[#A9CCE3]/60 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] px-3 pt-2 transition-[bottom] duration-150"
        style={{
          bottom: keyboardOffset,
          // キーボード非表示時（オフセット0）はセーフエリア分の余白を確保
          paddingBottom: keyboardOffset > 0 ? '0.5rem' : 'calc(0.5rem + env(safe-area-inset-bottom))',
        }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          {/* いま入力中の設問マーカー（設問文は問題文欄・入力はカード内の欄で行う）。
              枝番（①②）まで含めて、どの空欄に書いているかをひと目で示す。 */}
          <span className={`font-bold text-[#2C3E50] text-[13px] bg-blue-50/60 border border-[#A9CCE3]/40 px-3 py-1.5 rounded-lg truncate ${questionNeedsMathPalette ? 'font-math' : ''}`}>
            {formatText(answerCardMarker(focusedSub, focusedIndex, currentQuestion))}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {inputNavSubs.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => moveFocus(-1)}
                  disabled={focusedIndex <= 0}
                  aria-label="前の空欄へ"
                  // 空欄移動は入力中に最も多く押すボタン。44px 相当の高さを確保する。
                  className={`flex items-center justify-center gap-0.5 px-3 py-2.5 min-h-[2.75rem] rounded-lg text-[13px] font-bold border transition-colors ${
                    focusedIndex <= 0
                      ? 'border-gray-200 text-gray-300 bg-gray-50'
                      : 'border-[#A9CCE3] text-[#2C3E50] bg-white active:bg-[#A9CCE3]/20'
                  }`}
                >
                  <ChevronLeft size={16} className="stroke-[2.5]" />
                  前へ
                </button>
                <span className="text-xs text-gray-400 font-bold tabular-nums">
                  {focusedIndex + 1}/{inputNavSubs.length}
                </span>
                <button
                  type="button"
                  onClick={() => moveFocus(1)}
                  disabled={focusedIndex >= inputNavSubs.length - 1}
                  aria-label="次の空欄へ"
                  className={`flex items-center justify-center gap-0.5 px-3 py-2.5 min-h-[2.75rem] rounded-lg text-[13px] font-bold border transition-colors ${
                    focusedIndex >= inputNavSubs.length - 1
                      ? 'border-gray-200 text-gray-300 bg-gray-50'
                      : 'border-[#A9CCE3] text-[#2C3E50] bg-white active:bg-[#A9CCE3]/20'
                  }`}
                >
                  次へ
                  <ChevronRight size={16} className="stroke-[2.5]" />
                </button>
              </>
            )}
            {/* 完了：キーボードを閉じ、下部ナビ（前へ/解答と解説）へ戻す */}
            <button
              type="button"
              onClick={() => {
                const el = focusedSubId ? inputRefs.current[focusedSubId] : null;
                el?.blur();
                setFocusedSubId(null);
              }}
              className="flex items-center justify-center px-4 py-2.5 min-h-[2.75rem] rounded-lg text-[13px] font-bold border border-[#2C3E50] bg-[#2C3E50] text-white active:bg-[#1B2631]"
            >
              完了
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
