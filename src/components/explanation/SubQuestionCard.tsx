import React from 'react';
import { AlertCircle, BookOpen, CheckCircle2, ChevronDown, Circle, KeyRound, Target, XCircle } from 'lucide-react';
import { formatText } from '../../utils/textFormatter';
import { answerCardMarker } from '../../utils/questionDisplay';
import { isScriptFirstExplanation, stripScriptBox } from '../../utils/listeningExplanation';
import { ExplanationBody } from '../ExplanationBody';
import { isAttempted, pictureCellOf, resolveChoiceOptionText } from './helpers';
import type { AudioTrack, Problem, SubQuestion } from '../../types/curriculum';

/**
 * 小問1つぶんの答え合わせカード（正誤・あなたの解答・正解・解説・思考手順・部分点）。
 * 2026-10-13 のリファクタリングで Explanation.tsx の renderSq（約270行の内側関数）を切り出した。
 * JSX・クラス名・文言・並び順は元のまま。
 *
 * ★あえて「コンポーネント（<SubQuestionCard />）」ではなく「関数（renderSubQuestionCard(...)）」にしている★
 *   元は renderSq(sq, isCorrect) という関数呼び出しで、戻り値の <div key={sq.id}> の key を React が読んでいた。
 *   <SubQuestionCard /> にすると React の要素ツリーに1段増え、key の付き方も変わる。
 *   DOM は同じでも、再描画のときの差分の取り方（＝挙動）がわずかに変わる余地があるため、
 *   元と同じ「関数を呼んで要素を返す」形のまま外に出した。
 *   開閉などの状態は、元どおりすべて親（Explanation）が持つ。ここは受け取った値で描くだけ。
 */
export interface SubQuestionCardContext {
  question: Problem;
  answers: Record<string, string>;
  isMobile: boolean;
  isPracticeMode: boolean;
  isEnglishChapter: boolean;
  noMath?: boolean;
  singleObjectiveSq?: boolean;
  listeningTracks: AudioTrack[];
  answerBoxBaseClass: string;
  explBodyBaseClass: string;
  explBodyFontClass: string;
  openExplanationBySq: Record<string, boolean>;
  openThinkingBySq: Record<string, boolean>;
  setOpenExplanationBySq: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setOpenThinkingBySq: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  sliceForSq: (sq: SubQuestion) => string;
}

export function renderSubQuestionCard(ctx: SubQuestionCardContext, sq: SubQuestion, isCorrect: boolean) {
  const {
    question, answers, isMobile, isPracticeMode, isEnglishChapter, noMath, singleObjectiveSq, listeningTracks,
    answerBoxBaseClass, explBodyBaseClass, explBodyFontClass,
    openExplanationBySq, openThinkingBySq, setOpenExplanationBySq, setOpenThinkingBySq,
    sliceForSq,
  } = ctx;
                        // 手を付けていない問は「不正解」ではなく「未解答」として
                        // 灰色系の落ち着いた表示にする（赤い✕を出さない）。
                        const attempted = isAttempted(answers[sq.id]);
                        const isUnanswered = !attempted;
                        // ★PC（画面に余裕がある）またはスマホでも1問だけ表示中（詳しい解説・単問答え合わせ）は最初から開いておく★
                        //   閉じたら閉じたまま（利用者の操作を優先）。
                        const explanationOpen = openExplanationBySq[sq.id] ?? (!isMobile || Boolean(singleObjectiveSq));
                        const thinkingOpen = openThinkingBySq[sq.id] ?? !isMobile;
                        // ★スクリプト（英文＋和訳）を上に出しているときは、解説の中の同じ英文の枠は出さない（2026-10-04 ご要望）★
                        const sqSliceRaw = sliceForSq(sq);
                        const isScriptFirst = isScriptFirstExplanation(sqSliceRaw);
                        const sqSlice = listeningTracks.length > 0 ? stripScriptBox(sqSliceRaw) : sqSliceRaw;
                        const sqIndex = (question?.subQuestions || []).indexOf(sq);
                        const displayLabel = answerCardMarker(sq, sqIndex < 0 ? 0 : sqIndex, question);
                        const hasThinking = Boolean(
                          sq.detailedExplanation?.theme ||
                          (!isScriptFirst && isPracticeMode && sq.detailedExplanation?.steps?.length),
                        );
                        const fmtOpts = { prose: isEnglishChapter, noMath };
                        const userOptionText = resolveChoiceOptionText(sq, answers[sq.id]);
                        const correctOptionText = resolveChoiceOptionText(sq, sq.correctAnswer);

                        const thinkingBody = hasThinking ? (
                          <div className={`border-t p-4 md:p-5 space-y-4 ${'border-amber-200 bg-amber-50/40'}`}>
                            {sq.detailedExplanation?.theme && (
                              <div>
                                <h5 className={`font-bold mb-1.5 flex items-center gap-1.5 ${'text-amber-700'}`}>
                                  <KeyRound size={15} />
                                  <span>答えの核心（ここだけは押さえる）</span>
                                </h5>
                                <p className={`font-bold leading-relaxed ${'text-gray-800'}`}>
                                  {formatText(sq.detailedExplanation.theme, [], fmtOpts)}
                                </p>
                              </div>
                            )}

                            {!isScriptFirst && isPracticeMode && sq.detailedExplanation?.steps?.length > 0 && (
                              <div>
                                <h5 className={`font-bold mb-2 flex items-center gap-1.5 ${'text-emerald-700'}`}>
                                  <Target size={15} />
                                  <span>正解までの道すじ</span>
                                </h5>
                                <ol className="list-none space-y-2">
                                  {sq.detailedExplanation.steps.map((step: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2.5">
                                      <span className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${'bg-emerald-100 text-emerald-700 border border-emerald-300'}`}>
                                        {idx + 1}
                                      </span>
                                      {/* 書体は直書きせず土台から継承する（(C) 書体統一） */}
                                      <span className="leading-relaxed min-w-0">{formatText(step, [], fmtOpts)}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}

                          </div>
                        ) : null;

                        return (
                          <div
                            id={`sq-${sq.id}`}
                            key={sq.id}
                            data-verdict={isCorrect ? 'ok' : isUnanswered ? 'skip' : 'ng'}
                            className={`ex-sq-card rounded-2xl border overflow-hidden ${
                              isCorrect
                                  ? ('border-emerald-200')
                                  : isUnanswered
                                    ? ('border-[#E3D9C8]')
                                    : ('border-red-200')
                            }`}
                          >
                            {/* 正誤・自分の解答・正解は、アコーディオンに入れず常に表示する。 */}
                            <div className={`p-3 md:p-4 space-y-3 ${answerBoxBaseClass} ${
                              isCorrect
                                  ? ('bg-emerald-50/85')
                                  : isUnanswered
                                    ? ('bg-[#FAF5EB]')
                                    : ('bg-red-50/85')
                            }`}>
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`font-bold text-xs md:text-sm px-2.5 py-1 rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_0_#e6dccb] ${'text-[#2C3E50] bg-white border-[#E3D9C8]'}`}>
                                    {formatText(displayLabel, [], fmtOpts)}
                                  </div>
                                  {isUnanswered ? (
                                    <div className={`flex items-center gap-1.5 font-bold text-sm ${'text-gray-500'}`}>
                                      <Circle size={17} />
                                      <span>未解答</span>
                                    </div>
                                  ) : (
                                    <div className={`flex items-center gap-1.5 font-bold text-sm ${isCorrect ? ('text-emerald-700') : ('text-red-600')}`}>
                                      {isCorrect ? <CheckCircle2 size={17} /> : <XCircle size={17} />}
                                      <span>{isCorrect ? '正解！' : '不正解'}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2.5">
                                <div className="min-w-0">
                                  <div className={`text-xs mb-1 font-bold ${'text-gray-500'}`}>あなたの解答</div>
                                  <div className={`font-bold text-sm md:text-base px-2.5 py-2 rounded-lg border break-words whitespace-pre-wrap ${
                                    isCorrect
                                        ? ('bg-white border-emerald-200 text-emerald-700')
                                        : isUnanswered
                                          ? ('bg-white border-gray-200 text-gray-400')
                                          : ('bg-white border-red-200 text-red-600 line-through opacity-85')
                                  }`}>
                                    <span>{formatText(answers[sq.id] || '未解答', [], fmtOpts)}</span>
                                    {userOptionText && (
                                      <span className="ml-1.5 font-semibold">{formatText(userOptionText, [], fmtOpts)}</span>
                                    )}
                                    {/* 2026-10-08 絵の問題：選んだ絵のコマも出す（記号だけでは復習で何の絵か分からない） */}
                                    {(() => { const oi = Array.isArray(sq.options) ? sq.options.indexOf(String(answers[sq.id] ?? '')) : -1; const pic = pictureCellOf(sq, oi, sq.options?.length ?? 0); return pic ? <span className="lx-answer-pic" role="img" aria-label="あなたが選んだイラスト" style={pic} /> : null; })()}
                                  </div>
                                </div>
                                <div className="min-w-0">
                                  <div className={`text-xs mb-1 font-bold ${'text-gray-500'}`}>正解</div>
                                  <div className={`font-bold text-sm md:text-base px-2.5 py-2 rounded-lg border break-words ${'text-emerald-700 bg-white border-emerald-200'}`}>
                                    <span>{formatText(sq.correctAnswer, [], fmtOpts)}</span>
                                    {correctOptionText && (
                                      <span className="ml-1.5 font-semibold">{formatText(correctOptionText, [], fmtOpts)}</span>
                                    )}
                                    {(() => { const oi = Array.isArray(sq.options) ? sq.options.indexOf(String(sq.correctAnswer ?? '')) : -1; const pic = pictureCellOf(sq, oi, sq.options?.length ?? 0); return pic ? <span className="lx-answer-pic" role="img" aria-label="正解のイラスト" style={pic} /> : null; })()}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className={`border-t p-2.5 space-y-2 ${'bg-[#FFFDF9] border-[#E6DCCB]'}`}>
                              <button
                                type="button"
                                onClick={() => setOpenExplanationBySq(prev => ({ ...prev, [sq.id]: !explanationOpen }))}
                                aria-expanded={explanationOpen}
                                className={`ex-fold-btn w-full flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left font-bold ${'bg-[#EEF6FB] border-[#C5DDF0] text-[#1D5480] hover:bg-[#E3F0FA]'}`}
                              >
                                <span className="flex items-center gap-2"><BookOpen size={16} />解説</span>
                                <ChevronDown size={18} className={`transition-transform ${explanationOpen ? 'rotate-180' : ''}`} />
                              </button>
                              {explanationOpen && (
                                <div className={`rounded-xl border p-3 md:p-4 ${explBodyBaseClass} ${'bg-white border-[#DCE9F3]'}`}>
                                  {sqSlice.trim() ? (
                                    <ExplanationBody
                                      text={sqSlice}
                                      tone={'light'}
                                      prose={isEnglishChapter}
                                      noMath={noMath}
                                      className={`${explBodyFontClass} ${'text-gray-700'}`}
                                    />
                                  ) : (
                                    <p className="text-xs text-[#7A6A4C]">この小問の解説は「思考手順・答えの核心」にまとめています。</p>
                                  )}
                                </div>
                              )}

                              {hasThinking && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setOpenThinkingBySq(prev => ({ ...prev, [sq.id]: !thinkingOpen }))}
                                    aria-expanded={thinkingOpen}
                                    className={`ex-fold-btn w-full flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left font-bold ${'bg-[#FFF8E4] border-[#EDD493] text-[#8A5A00] hover:bg-[#FFF2CF]'}`}
                                  >
                                    <span className="flex items-center gap-2"><KeyRound size={16} />思考手順・答えの核心</span>
                                    <ChevronDown size={18} className={`transition-transform ${thinkingOpen ? 'rotate-180' : ''}`} />
                                  </button>
                                  {thinkingOpen && thinkingBody}
                                </>
                              )}
                            </div>

                            {sq.partialCreditCriteria && (
                              <div className={`border-t text-xs md:text-xs p-3 flex items-start gap-2 ${'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                <AlertCircle className="shrink-0 mt-0.5 w-4 h-4" />
                                <span className="leading-relaxed">{formatText(sq.partialCreditCriteria, [], fmtOpts)}</span>
                              </div>
                            )}
                          </div>
                        );
}
