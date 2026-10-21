import { ArrowLeft } from 'lucide-react';

/**
 * 単元に問題がまだ1問も無いときの画面（C-02: Quiz.tsx の早期 return の JSX をそのまま移した）。
 * フックを持たない表示だけの部品。DOM・文言は分離前と同じ。
 */
export function QuizEmptyState({ abstractTitle, onBack }: { abstractTitle: string; onBack: () => void }) {
  return (
    <div className="w-full bg-white rounded-2xl shadow-xl p-6 md:p-12 border border-gray-100 text-center relative">
      <button 
        onClick={onBack}
        className="absolute top-[calc(1rem+env(safe-area-inset-top,0px))] left-4 md:top-6 md:left-6 flex items-center gap-2 text-gray-500 hover:text-[#2C3E50] transition-colors font-bold bg-gray-50 px-4 py-2 rounded-full shadow-sm"
      >
        <ArrowLeft size={20} />
        <span>戻る</span>
      </button>
      <h2 className="text-xl md:text-2xl font-modern font-bold text-gray-800 mb-4 mt-12 md:mt-8">
        {abstractTitle}
      </h2>
      <p className="text-sm md:text-base text-gray-500 font-modern mb-8">
        この単元の問題はまだ追加されていません。
      </p>
      <button
        onClick={onBack}
        className="bg-[#1B2631] text-white px-6 py-3 rounded-xl font-bold w-full sm:w-auto"
      >
        単元選択に戻る
      </button>
    </div>
  );
}
