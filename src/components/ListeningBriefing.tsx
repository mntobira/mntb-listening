/**
 * リスニング：問題の説明ページ（ブリーフィング）
 * ────────────────────────────────────────────────────────────────
 * Quiz.tsx の早期 return ブロック（64行）をそのまま持ってきたもの。
 * JSX は一字も変えていない。
 *
 * ★ここにフックは1つも無い★
 * 元も useState / useEffect を含まない、ただの JSX だった
 * （実測：この区間のフック呼び出しは0件）。よって切り出しても
 * フックの呼び出し順には影響しない。
 *
 * ★元のコメント（設計意図）もそのまま残す★
 * ご要望：「これらの問題の説明は第1回演習とかのボタンを押した後に、
 *          問題を出すまえに問題の説明のページを作ってそこに書いて欲しい。
 *          例) 第1回演習のボタンを押す→問題の説明のページを出す
 *              →問1のページに行く→問1の解説のページに行く」
 *
 * 回を選んだ直後に1枚だけ表示する。ここに
 *   ・回のタイトル（第1回　第1問 A（4問・2回読み） など）
 *   ・「短い英文が2回読まれます。…①〜④のうちから1つ選びなさい」の説明
 *   ・難易度
 * をまとめ、解答中の画面からはこれらを撤去する。
 * そのぶん解答画面は「問題＋選択肢が1画面に収まる」表示になる。
 */
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { ExplanationBody } from './ExplanationBody';
import {
  buildListeningLeadText,
  extractListeningDifficulty,
  stripListeningDifficulty,
} from '../utils/listeningOptions';

export interface ListeningBriefingProps {
  currentQuestion: any;
  /** 章（単元）の表示名。Quiz.tsx では chapter.abstractTitle を渡している。
   *  （chapter.title ではないので注意。取り違えると見出しが変わる） */
  chapterAbstractTitle: string;
  mode: string;
  /** 「戻る」＝単元選択へ */
  handleExit: () => void;
  onReturnToBattle?: () => void;
  /** 「問題をはじめる」で説明ページを閉じる */
  onStart: () => void;
}

export function ListeningBriefing({
  currentQuestion,
  chapterAbstractTitle,
  mode,
  handleExit,
  onReturnToBattle,
  onStart,
}: ListeningBriefingProps) {
  // Quiz.tsx にあったときの呼び名をそのまま残す（下の JSX を書き換えないため）。
  const chapter = { abstractTitle: chapterAbstractTitle };
  const setShowingBriefing = (_v: boolean) => onStart();
  const lead = buildListeningLeadText(currentQuestion.text);
  const difficulty = extractListeningDifficulty(lead);
  return (
    <div className="fixed inset-0 w-full flex flex-col bg-gray-50 overflow-hidden z-40">
      {onReturnToBattle && <button type="button" onClick={onReturnToBattle} className="min-h-11 shrink-0 bg-blue-50 px-3 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-2 text-sm font-bold text-blue-900 border-b border-blue-200">バトル結果・解説に戻る</button>}
      {/* ヘッダー（戻る＝単元選択へ） */}
      <div className={`flex-none flex items-center gap-2 md:gap-4 px-3 pb-3 md:px-4 md:pb-4 ${onReturnToBattle ? 'pt-3 md:pt-4' : 'pt-[calc(0.75rem+env(safe-area-inset-top,0px))] md:pt-[calc(1rem+env(safe-area-inset-top,0px))]'} bg-white border-b border-gray-200`}>
        <button
          onClick={handleExit}
          title="単元選択に戻る"
          aria-label="単元選択に戻る"
          className="flex items-center justify-center p-1.5 md:p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors shrink-0"
        >
          <ArrowLeft size={18} className="md:w-5 md:h-5" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm md:text-xl font-handwriting text-[#2C3E50] font-bold truncate">
            {chapter.abstractTitle}
          </h2>
          <div className="text-[10px] md:text-xs text-gray-500 font-bold mt-0.5">
            {mode === 'mini_test' ? '小テスト' : '演習問題'}
          </div>
        </div>
      </div>

      {/* 説明本文 */}
      <div className="flex-1 overflow-y-auto p-5 md:p-10">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-bold text-white text-xs bg-[#A9CCE3] py-1 px-3 rounded-full">
                この回の説明
              </span>
              {difficulty && (
                <span className="text-[11px] font-bold text-gray-400">
                  難易度：{difficulty}
                </span>
              )}
            </div>
            <div className="text-[15px] md:text-base leading-[1.9] text-gray-800 font-modern break-words [overflow-wrap:anywhere]">
              <ExplanationBody text={stripListeningDifficulty(lead)} />
            </div>
            <p className="mt-5 text-xs text-gray-400 leading-relaxed">
              この説明は解答中の画面には出ません。落ち着いて読んでから始めてください。
            </p>
          </div>
        </div>
      </div>

      {/* 開始ボタン（下部固定・親指で押しやすい位置） */}
      <div className="flex-none bg-white border-t border-gray-200 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setShowingBriefing(false)}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold tracking-wider text-sm bg-[#2C3E50] text-white active:bg-[#1B2631] hover:bg-[#1B2631] shadow-md transition-all duration-200 cursor-pointer"
          >
            <span>問題をはじめる</span>
            <ChevronRight size={16} className="stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
