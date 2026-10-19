import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { AudioTrack, SubQuestion } from '../../types/curriculum';

/**
 * 右カラムの見出し「採点結果」（正解・不正解・未解答の内訳）。
 * 2026-10-14 のリファクタリングで Explanation.tsx から切り出した。JSX・クラス名・文言・条件は元のまま。
 */
export interface ScoreHeadProps {
  reorderMobile: boolean;
  listeningTracks: AudioTrack[];
  objectiveSqs: SubQuestion[];
  correctSqs: SubQuestion[];
  incorrectSqs: SubQuestion[];
  unansweredSqs: SubQuestion[];
}

export function ScoreHead({ reorderMobile, listeningTracks, objectiveSqs, correctSqs, incorrectSqs, unansweredSqs }: ScoreHeadProps) {
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
                                  </div>
                                </div>
  );
}
