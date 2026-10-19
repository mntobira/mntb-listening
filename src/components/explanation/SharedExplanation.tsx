import React from 'react';
import { Lightbulb, ChevronDown } from 'lucide-react';
import { ExplanationBody } from '../ExplanationBody';
import type { AudioTrack } from '../../types/curriculum';

/**
 * 右カラムの「大問全体の流れ・共通ポイント」。
 *   リスニング（スマホ・PCの3列）では折りたたみ（details）、それ以外は枠付きの箱で出す。
 * 2026-10-14 のリファクタリングで Explanation.tsx から切り出した。JSX・クラス名・文言・条件は元のまま。
 * 2つの分岐は元どおり「それぞれ独立した条件」で並べている（Fragment で返す）。
 */
export interface SharedExplanationProps {
  sharedExplanation: string;
  reorderMobile: boolean;
  pcListening: boolean;
  listeningTracks: AudioTrack[];
  isEnglishChapter: boolean;
  explBodyBaseClass: string;
  explBodyFontClass: string;
}

export function SharedExplanation({ sharedExplanation, reorderMobile, pcListening, listeningTracks, isEnglishChapter, explBodyBaseClass, explBodyFontClass }: SharedExplanationProps) {
  return (
    <>
                            {sharedExplanation.trim() && (reorderMobile || pcListening) && listeningTracks.length > 0 && (
                              <details className="lx-fold lx-fold-shared" open={pcListening || undefined}>
                                <summary><Lightbulb size={16} aria-hidden="true" /><span className="lx-lbl-long">大問全体の流れ・共通ポイント</span><span className="lx-lbl-short">大問の流れ</span><ChevronDown size={18} aria-hidden="true" /></summary>
                                <div className={`lx-fold-body ${explBodyBaseClass}`}>
                                  <ExplanationBody text={sharedExplanation} tone="light" prose={isEnglishChapter} className={`${explBodyFontClass} text-gray-700`} />
                                </div>
                              </details>
                            )}
                            {sharedExplanation.trim() && !((reorderMobile || pcListening) && listeningTracks.length > 0) && (
                              <div className={`mt-6 rounded-xl border p-4 md:p-5 ${explBodyBaseClass} ${'bg-gray-50 border-gray-200'}`}>
                                <h4 className={`text-sm md:text-base mb-3 flex items-center gap-2 border-b-2 pb-2 ${'text-emerald-700 border-emerald-200'}`}>
                                  <Lightbulb className={`w-4 h-4 ${'text-amber-500'}`} />
                                  <span>大問全体の流れ・共通ポイント</span>
                                </h4>
                                <ExplanationBody
                                  text={sharedExplanation}
                                  tone={'light'}
                                  prose={isEnglishChapter}
                                  className={`${explBodyFontClass} ${'text-gray-700'}`}
                                />
                              </div>
                            )}
    </>
  );
}
