import { TrendingUp, AlertTriangle } from 'lucide-react';
import type { computeWeakAreas } from './explanationLogic';

/**
 * スマホの結果画面（compactResult）に出す「分析結果：復習推奨エリア」。
 * Explanation.tsx から切り出した。DOM・クラス・文言は以前と同じ。
 */
export function CompactWeakAreas({ weakAreas }: { weakAreas: ReturnType<typeof computeWeakAreas> }) {
  return (
    <div className="mt-3 pt-3 border-t border-[#F4D03F]/40">
      <div className="flex items-center gap-1.5 mb-2">
        <TrendingUp className="w-4 h-4 text-[#D9A0A0]" />
        <span className="text-xs font-bold text-[#1B2631]">分析結果：復習推奨エリア</span>
      </div>
      {/* 件数が多い単元でも下の解説を押し出さないよう、必要なときだけ内部スクロールする */}
      <div className="space-y-1.5 max-h-[38vh] overflow-y-auto overscroll-contain pr-0.5">
        {weakAreas.map((area) => (
          <div key={area.category} className="bg-white/80 border border-white rounded-xl px-2.5 py-1.5 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 min-w-0">
                <AlertTriangle className="w-3 h-3 shrink-0 text-[#D9A0A0]" />
                <span className="text-xs font-bold text-[#1B2631] truncate">{area.category}</span>
              </div>
              <span className="font-mono font-bold text-xs text-[#D9A0A0] tabular-nums shrink-0">
                {area.percentage}<span className="text-xs ml-0.5">%</span>
              </span>
            </div>
            <div className="relative h-1.5 mt-1 rounded-full overflow-hidden bg-gray-200/70">
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#D9A0A0] to-[#FFB7B2] transition-all duration-1000 ease-out"
                style={{ width: `${area.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-[#4B5563]/70 mt-1.5 text-right">
        ※ 記述問題は自己採点チェックを入れるとスコアに反映されます
      </p>
    </div>
  );
}
