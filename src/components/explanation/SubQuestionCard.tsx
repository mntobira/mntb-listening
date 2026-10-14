import React from 'react';
import { AlertCircle, BookOpen, CheckCircle2, CheckSquare, ChevronDown, Circle, Edit3, KeyRound, Network, Target, XCircle } from 'lucide-react';
import { formatText } from '../../utils/textFormatter';
import { resolveGradingCriteria } from '../../utils/gradingCriteria';
import { answerCardMarker } from '../../utils/questionDisplay';
import { isScriptFirstExplanation, stripScriptBox } from '../../utils/listeningExplanation';
import { ExplanationBody } from '../ExplanationBody';
import { getDifficulty, isAttempted, pictureCellOf } from './helpers';

/**
 * 小問1つぶんの答え合わせカード（正誤・あなたの解答・正解・自己採点・解説・思考手順・部分点）。
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
  /** 親で常に 'mini_test' に固定されている値（元の三項をそのまま残すため受け取る） */
  mode: string;
  question: any;
  answers: Record<string, string>;
  isMobile: boolean;
  isPracticeMode: boolean;
  isEnglishChapter: boolean;
  listeningTracks: any[];
  mathBodyClass: string;
  answerBoxBaseClass: string;
  explBodyBaseClass: string;
  explBodyFontClass: string;
  selfGrades: Record<string, boolean>;
  openExplanationBySq: Record<string, boolean>;
  openThinkingBySq: Record<string, boolean>;
  setOpenExplanationBySq: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setOpenThinkingBySq: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setExpandedNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  setExpandedStep: React.Dispatch<React.SetStateAction<string | null>>;
  setScrollTrigger: React.Dispatch<React.SetStateAction<number>>;
  sliceForSq: (sq: any) => string;
  getRelatedSteps: (sqId: string, currentQuestion: any) => { step: number | string | null; label: string; id: string }[];
  isGroupAllCorrect: (sq: any, currentQuestion: any) => boolean;
  toggleGrade: (criteriaId: string) => void;
}

export function renderSubQuestionCard(ctx: SubQuestionCardContext, sq: any, isCorrect: boolean) {
  const {
    mode, question, answers, isMobile, isPracticeMode, isEnglishChapter, listeningTracks,
    mathBodyClass, answerBoxBaseClass, explBodyBaseClass, explBodyFontClass,
    selfGrades, openExplanationBySq, openThinkingBySq, setOpenExplanationBySq, setOpenThinkingBySq,
    setExpandedNodeId, setExpandedStep, setScrollTrigger,
    sliceForSq, getRelatedSteps, isGroupAllCorrect, toggleGrade,
  } = ctx;
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
}
