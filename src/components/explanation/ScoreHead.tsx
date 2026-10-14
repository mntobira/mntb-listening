import React from 'react';
import { CheckCircle2, Network } from 'lucide-react';

/**
 * 右カラムの見出し「採点結果」（正解・不正解・未解答の内訳＋スマホのフローチャート切り替え）。
 * 2026-10-14 のリファクタリングで Explanation.tsx から切り出した。JSX・クラス名・文言・条件は元のまま。
 * 状態（showFlowchart）は親が持ち、値と setter を受け取る。
 */
export interface ScoreHeadProps {
  reorderMobile: boolean;
  listeningTracks: any[];
  objectiveSqs: any[];
  correctSqs: any[];
  incorrectSqs: any[];
  unansweredSqs: any[];
  mode: string;
  flowchartBlock: React.ReactNode;
  showFlowchart: boolean;
  setShowFlowchart: (fn: (v: boolean) => boolean) => void;
}

export function ScoreHead({ reorderMobile, listeningTracks, objectiveSqs, correctSqs, incorrectSqs, unansweredSqs, mode, flowchartBlock, showFlowchart, setShowFlowchart }: ScoreHeadProps) {
  return (
                                <div data-score-head className={`flex items-center justify-between gap-2 ${reorderMobile ? '' : 'flex-wrap'}`} data-lx-single={(reorderMobile && listeningTracks.length > 0 && objectiveSqs.length <= 1) || undefined}>
                                  <h4 className={`font-bold flex items-center ${reorderMobile ? 'min-w-0 gap-1.5 text-[13px]' : 'gap-2'} ${'text-gray-700'}`}>
                                    <CheckCircle2 size={reorderMobile ? 15 : 18} className={`${reorderMobile ? 'shrink-0 ' : ''}${'text-emerald-600'}`} />
                                    <span className={reorderMobile ? 'truncate' : ''}>採点結果</span>
                                  </h4>
                                  <div className={`flex items-center ${reorderMobile ? 'shrink-0 gap-1.5' : 'gap-2'}`}>
                                    {/* 問が1つだけのリスニングでは、下の「問1 不正解 ①→②」と同じ内容になるので出さない（同じものを2つ置かない） */}
                                    {!(reorderMobile && listeningTracks.length > 0 && objectiveSqs.length <= 1) && <span className={`font-bold ${reorderMobile ? 'whitespace-nowrap text-xs' : 'text-xs'} ${'text-gray-500'}`}>
                                      <span className={'text-emerald-600'}>正解 {correctSqs.length}</span>
                                      <span className="mx-1 opacity-50">/</span>
                                      <span className={'text-red-500'}>不正解 {incorrectSqs.length}</span>
                                      {unansweredSqs.length > 0 && (
                                        <>
                                          <span className="mx-1 opacity-50">/</span>
                                          <span className={'text-gray-400'}>未解答 {unansweredSqs.length}</span>
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
  );
}
