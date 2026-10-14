import React from 'react';
import { CheckCircle2, ChevronDown, Circle, XCircle } from 'lucide-react';
import { formatText } from '../../utils/textFormatter';
import { isAnswerCorrect } from '../../utils/answerJudge';
import { answerCardMarker } from '../../utils/questionDisplay';
import { getDifficulty, isAttempted } from './helpers';

/**
 * 学習フローチャート（PracticeExplanationTree）の中に出す、小問の答え合わせ（たたんだ行 / 開いたカード）。
 * 2026-10-13 のリファクタリングで Explanation.tsx の renderSubQuestionCheck を切り出した。
 * JSX・クラス名・文言は元のまま。
 *
 * ★フローチャートは統合版の化学の章（c1〜c6）にだけある★
 *   このリスニング版の単元（第1問〜第6問・英文法）では表示されないので、
 *   DOM 比較の検証ではここは通らない。中身は1文字も変えず、変数名の置き換えも行っていない。
 *
 * ★関数のまま外に出している★ PracticeExplanationTree は
 *   renderSubQuestionCheck(sq, parentQuestion) => ReactElement という「関数」を受け取る作りなので、
 *   コンポーネントにはせず、元と同じ呼び出し形の関数を親が作って渡す。
 */
export interface FlowchartSubQuestionCheckContext {
  /** 親で常に 'mini_test' に固定されている値（元の三項をそのまま残すため受け取る） */
  mode: string;
  answers: Record<string, string>;
  expandedSq: string | null;
  setExpandedSq: React.Dispatch<React.SetStateAction<string | null>>;
  isPracticeMode: boolean;
  mathBodyClass: string;
  getRelatedSteps: (sqId: string, currentQuestion: any) => { step: number | string | null; label: string; id: string }[];
  isGroupAllCorrect: (sq: any, currentQuestion: any) => boolean;
}

export function renderFlowchartSubQuestionCheck(ctx: FlowchartSubQuestionCheckContext, sq: any, currentQuestion: any) {
  const { mode, answers, expandedSq, setExpandedSq, isPracticeMode, mathBodyClass, getRelatedSteps, isGroupAllCorrect } = ctx;
    const isMiniTest = mode === 'mini_test';
    const isCorrect = sq.type === 'descriptive' ? false : isAnswerCorrect(sq, answers[sq.id]);
    // 未解答（手を付けていない）は不正解の赤✕ではなく灰色の○で区別する。
    const isUnanswered = sq.type !== 'descriptive' && !isAttempted(answers[sq.id]);
    const isExpanded = expandedSq === sq.id;
    // ※元のコードのまま。この値は下で使われていない（削除候補として報告）。呼び出しの有無を変えないため残している。
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
}
