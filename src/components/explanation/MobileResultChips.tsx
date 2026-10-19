import React from 'react';
import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import { formatText } from '../../utils/textFormatter';
import { isAnswerCorrect } from '../../utils/answerJudge';
import { answerCardMarker } from '../../utils/questionDisplay';
import { isAttempted } from './helpers';
import type { Problem, SubQuestion } from '../../types/curriculum';

/**
 * スマホの1問ごとの答え合わせ（リスニング以外）：小問の正誤チップを4列で並べる。
 * 「全ての問いのあってるか間違ってるかだけ出して、その正誤ボタンを押したらその問の解答と解説が出る」（ご要望）。
 * 緑＝正解・赤＝不正解・灰＝未解答。押した問は selectedSqId になり、親が詳細カードを下に出す。
 * 2026-10-13 のリファクタリングで Explanation.tsx から切り出した。JSX・クラス名・文言は元のまま。
 * 状態（selectedSqId / openExplanationBySq）は親が持ったまま、setter を受け取って呼ぶだけ。
 */
export function MobileResultChips({ question, objectiveSqs, answers, selectedSqId, setSelectedSqId, setOpenExplanationBySq }: {
  question: Problem;
  objectiveSqs: SubQuestion[];
  answers: Record<string, string>;
  selectedSqId: string | null;
  setSelectedSqId: React.Dispatch<React.SetStateAction<string | null>>;
  setOpenExplanationBySq: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  return (
                                    <div className="grid grid-cols-4 gap-2">
                                      {objectiveSqs.map((sq) => {
                                        const ok = isAnswerCorrect(sq, answers[sq.id]);
                                        const attempted = isAttempted(answers[sq.id]);
                                        const active = selectedSqId === sq.id;
                                        const sqIdx = (question?.subQuestions || []).indexOf(sq);
                                        const marker = answerCardMarker(sq, sqIdx < 0 ? 0 : sqIdx, question);
                                        // マーカーが長い場合（係数グループなど）は先頭だけ出す
                                        const shortMarker = marker.length > 7 ? `${marker.slice(0, 6)}…` : marker;
                                        return (
                                          <button
                                            key={`chip-${sq.id}`}
                                            type="button"
                                            onClick={() => {
                                              if (active) {
                                                setSelectedSqId(null);
                                              } else {
                                                setSelectedSqId(sq.id);
                                                // 「解答と解説が出るように」：チップを押したら
                                                // 解説アコーディオンも開いた状態で表示する。
                                                setOpenExplanationBySq(prev => ({ ...prev, [sq.id]: true }));
                                              }
                                            }}
                                            aria-pressed={active}
                                            aria-label={`${marker} ${!attempted ? '未解答' : ok ? '正解' : '不正解'}の解答・解説を${active ? '閉じる' : '見る'}`}
                                            className={`flex flex-col items-center justify-center gap-0.5 rounded-xl border-2 px-1 py-2 min-h-[3.25rem] transition-all ${
                                              !attempted
                                                ? (active ? 'bg-gray-200 border-gray-400' : 'bg-gray-50 border-gray-200')
                                                : ok
                                                  ? (active ? 'bg-emerald-100 border-emerald-500 shadow-sm' : 'bg-emerald-50 border-emerald-200')
                                                  : (active ? 'bg-red-100 border-red-500 shadow-sm' : 'bg-red-50 border-red-200')
                                            }`}
                                          >
                                            <span className={`font-bold text-[13px] leading-tight break-all ${
                                              !attempted ? 'text-gray-500' : ok ? 'text-emerald-700' : 'text-red-600'
                                            }`}>
                                              {formatText(shortMarker)}
                                            </span>
                                            {!attempted
                                              ? <Circle size={16} className="text-gray-400" />
                                              : ok
                                                ? <CheckCircle2 size={16} className="text-emerald-600" />
                                                : <XCircle size={16} className="text-red-500" />}
                                          </button>
                                        );
                                      })}
                                    </div>
  );
}
