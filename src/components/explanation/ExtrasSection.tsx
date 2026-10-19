import React from 'react';
import { BookOpen, ChevronDown, Lightbulb, Search } from 'lucide-react';
import { formatText } from '../../utils/textFormatter';
import { InlineAdSlot } from '../InlineAdSlot';
import { textTracksOf } from './helpers';
import type { Problem } from '../../types/curriculum';

/**
 * 周辺知識・深掘り（全大問ぶん）＋ 末尾のインライン広告枠。
 * 2026-10-13 のリファクタリングで Explanation.tsx から切り出した。JSX・クラス名・文言・並び順は元のまま。
 *
 *   wrapClassName … 外枠のクラス（スマホ／PCリスニング／その他で親が決める。元の三項をそのまま親に残した）
 *   qNumberOf     … 見出し「Q◯」の番号（元の式は親の変数を多く使うので、親で計算した関数を受け取る）
 *   foldable      … スマホ or PC のリスニング（＝周辺知識を折りたたみの details で包む条件の前半）
 *   openByDefault … PC のリスニング（details を最初から開く）
 */
export function ExtrasSection({ wrapClassName, questions, isEnglishChapter, foldable, openByDefault, qNumberOf }: {
  wrapClassName: string;
  questions: Problem[];
  isEnglishChapter: boolean;
  foldable: boolean;
  openByDefault: boolean;
  qNumberOf: (qIndex: number) => number;
}) {
  return (
          <div className={wrapClassName}>
            {/* PC のリスニング：この単元の思考の型は右列の先頭に（開いた状態で） */}
            {questions.map((question, qIndex: number) => {
              const hasKnowledge = question.surroundingKnowledge && question.surroundingKnowledge.length > 0;
              const hasDeepDive = question.deepDiveTopics && question.deepDiveTopics.length > 0;
              
              if (!hasKnowledge && !hasDeepDive) return null;

              // ★スマホのリスニング解説：周辺知識・深掘りも「押したら開く」（1画面で完結させる）
              const foldExtras = foldable && textTracksOf(question).length > 0;
              // 折りたたむときは <details>/<div>、折りたたまないときは <div>/<Fragment> で包む（属性はそれぞれ下で出し分ける）
              const ExtraWrap: React.ElementType = foldExtras ? 'details' : 'div';
              const ExtraInner: React.ElementType = foldExtras ? 'div' : React.Fragment;
              return (
                <ExtraWrap key={`extra-${question.id}`} className={foldExtras ? 'lx-fold lx-fold-extra' : 'space-y-6'} {...(foldExtras && openByDefault ? { open: true } : {})}>
                  {foldExtras && <summary><BookOpen size={16} aria-hidden="true" /><span className="lx-lbl-long">周辺知識・深掘り</span><span className="lx-lbl-short">周辺知識</span><ChevronDown size={18} aria-hidden="true" /></summary>}
                  <ExtraInner {...(foldExtras ? { className: 'lx-fold-body space-y-6' } : {})}>
                  <div className={`flex items-center gap-3 border-b pb-2 ${'border-gray-200'}`}>
                    <div className={`font-bold px-2 py-0.5 rounded text-xs shadow-sm border ${'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                      Q{qNumberOf(qIndex)}
                    </div>
                    <h4 className={`font-bold text-sm md:text-base ${'text-gray-800'}`}>
                      周辺知識・深掘り
                    </h4>
                  </div>

                  {hasKnowledge && (
                    <div>
                      <h5 className={`font-bold text-xs md:text-sm mb-3 md:mb-4 flex items-center gap-1.5 md:gap-2 ${'text-blue-600'}`}>
                        <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
                        <span>周辺知識・類似問題</span>
                      </h5>
                      <div className="space-y-3 md:space-y-4">
                        {question.surroundingKnowledge.map((k: string, idx: number) => {
                          const titleMatch = k.match(/^(【.*?】)(.*)/s);
                          if (titleMatch) {
                            return (
                              <div key={idx} className={`p-4 md:p-5 rounded-xl border shadow-sm relative overflow-hidden ${'bg-blue-50 border-blue-200'}`}>
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${'bg-blue-400'}`}></div>
                                <div className={`inline-flex items-center gap-1.5 text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-md mb-3 border ${'bg-white text-blue-600 border-blue-200'}`}>
                                  <BookOpen size={14} />
                                  {/* 見出しバッジも prose 対象。英語では見出しに英単語が
                                      そのまま入ることがあり、ここを素の formatText に
                                      すると見出しだけセリフ体に化けてしまう。 */}
                                  {formatText(titleMatch[1].replace(/[【】]/g, ''), [], { prose: isEnglishChapter })}
                                </div>
                                <div className={`text-xs md:text-sm leading-relaxed whitespace-pre-wrap ${'text-gray-700'}`}>
                                  {/* 英語は prose で組む（英単語がセリフ体の化学式に化けるのを防ぐ） */}
                                  {formatText(titleMatch[2].trim(), [], { prose: isEnglishChapter })}
                                </div>
                              </div>
                            );
                          }
                          return (
                            <div key={idx} className={`p-4 md:p-5 rounded-xl border shadow-sm text-xs md:text-sm leading-relaxed whitespace-pre-wrap ${'bg-gray-50 border-gray-200 text-gray-700'}`}>
                              {formatText(k, [], { prose: isEnglishChapter })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {hasDeepDive && (
                    <div className="mt-6 md:mt-8">
                      <h5 className={`font-bold text-xs md:text-sm mb-3 md:mb-4 flex items-center gap-1.5 md:gap-2 ${'text-amber-600'}`}>
                        <Search className="w-4 h-4 md:w-5 md:h-5" />
                        <span>さらに深掘り</span>
                      </h5>
                      <div className="space-y-3 md:space-y-4">
                        {question.deepDiveTopics.map((topic: string, idx: number) => {
                          const titleMatch = topic.match(/^(【.*?】)(.*)/s);
                          let title = "";
                          let content = topic;
                          
                          if (titleMatch) {
                            title = titleMatch[1].replace(/[【】]/g, '');
                            content = titleMatch[2].trim();
                          } else {
                            const parts = topic.split('\n');
                            title = parts[0];
                            content = parts.slice(1).join('\n');
                          }

                          return (
                            <div key={idx} className={`p-4 md:p-5 rounded-xl border shadow-sm relative overflow-hidden ${'bg-amber-50 border-amber-200'}`}>
                              <div className={`absolute top-0 left-0 w-1.5 h-full ${'bg-amber-400'}`}></div>
                              <div className={`inline-flex items-center gap-1.5 text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-md mb-3 border ${'bg-white text-amber-600 border-amber-200'}`}>
                                <Lightbulb size={14} />
                                {/* 【】が無い深掘りでは title = 1行目まるごとになり、
                                    英文（usually / on weekdays など）を含みうる。
                                    そのためここも prose で組む。 */}
                                {formatText(title, [], { prose: isEnglishChapter })}
                              </div>
                              <div className={`text-xs md:text-sm leading-relaxed whitespace-pre-wrap ${'text-gray-700'}`}>
                                {formatText(content, [], { prose: isEnglishChapter })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  </ExtraInner>
                  </ExtraWrap>
                );
              })
            }
            {/* 妙案3: 解説画面スクロール末尾のインライン広告枠 */}
            <InlineAdSlot />
          </div>
  );
}
