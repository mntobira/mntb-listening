import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { formatText } from '../../utils/textFormatter';

/**
 * つまずきポイント（logic_thought 形式の解説に入っている phase2.stumblingPoints）。
 * 2026-10-13 のリファクタリングで Explanation.tsx から切り出した。JSX・クラス名・文言は元のまま。
 *
 * mode は呼び出し元（Explanation）で常に 'mini_test' に固定されている。
 * 元の三項（mode === 'mini_test' ? 明色 : 暗色）をそのまま残すため、同じ値を受け取る。
 */
export function StumblingPoints({ deepThoughtData, mode }: { deepThoughtData: any; mode: string }) {
  if (!(deepThoughtData && deepThoughtData.phase2.stumblingPoints && deepThoughtData.phase2.stumblingPoints.length > 0)) return null;
  return (
            <div className={`p-4 sm:p-6 md:p-8 border-b ${'border-gray-200 bg-gray-50'}`}>
              <h4 className={`font-bold mb-4 text-base md:text-lg flex items-center gap-2 ${'text-red-600'}`}>
                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />
                つまずきポイント
              </h4>
              {/* 【横幅確保のため縦積み1カラムに統一】
                  つまずきポイントはこのブロック自体が右カラム（俯瞰レイアウト時は
                  全幅の42% ≈ 430px）の中に置かれるため、さらに2カラムへ分割すると
                  1カラムあたり約200pxしかなく、文章が縦に細長く折り返されて
                  非常に読みにくくなっていた。カードを縦積み1カラムにして
                  1カラムあたりの横幅を十分に確保し、俯瞰の縮小表示でも
                  文章の形が把握できる可読性を保つ。 */}
              <div className="grid grid-cols-1 gap-4 md:gap-5">
                {deepThoughtData.phase2.stumblingPoints.map((point: any, idx: number) => (
                  <div key={idx} className={`p-5 sm:p-6 pl-6 sm:pl-7 rounded-2xl border shadow-sm relative overflow-hidden ${'bg-red-50 border-red-200'}`}>
                    <div className={`absolute top-0 left-0 w-2 h-full ${'bg-red-500'}`}></div>
                    <div className="flex items-center flex-wrap gap-2 mb-2.5">
                      <div className={`text-xs md:text-sm font-bold px-2.5 py-1 rounded-lg border ${'bg-red-100 text-red-700 border-red-200'}`}>
                        {formatText(String(point.step))}
                      </div>
                      <h5 className={`font-bold text-base md:text-lg leading-snug ${'text-red-700'}`}>{formatText(point.type || point.point)}</h5>
                    </div>
                    <div className={`text-sm md:text-base leading-relaxed md:leading-loose whitespace-pre-wrap ${'text-gray-700'}`}>
                      {formatText(point.content || point.reason)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
  );
}
