import { Plus, School } from 'lucide-react';

// ===================================================================
// クラスが1つも無いとき
// ===================================================================

export function EmptyState({ onCreate, accent }: { onCreate: () => void; accent: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E0E1DD] p-7 text-center">
      <School className="w-11 h-11 mx-auto mb-3" style={{ color: accent }} />
      <h2 className="text-lg font-bold text-[#1B2631] mb-2">まずはクラスを1つ作りましょう</h2>
      <p className="text-sm text-[#4B5563] leading-relaxed mb-5">
        クラスを作ると<strong>6文字の参加コード</strong>が発行されます。
        <br />
        黒板やプリントにそのコードを書いて生徒に入力してもらうだけで、
        <br />
        学習の様子がこの画面に集まります。
      </p>
      <div className="text-left text-xs text-[#6B7280] bg-[#FAF8F2] border border-[#E8E5DC] rounded-xl p-3.5 mb-5 leading-relaxed">
        <p className="font-bold text-[#4B5563] mb-1">生徒のデータが見えるしくみ</p>
        生徒が参加コードを入力したときにだけ、その生徒の学習記録を見る許可が作られます。
        先生の側から生徒を勝手に追加することはできません。生徒はいつでもクラスから抜けられ、
        抜けた時点で見られなくなります。
      </div>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-transform active:scale-95"
        style={{ backgroundColor: accent }}
      >
        <Plus className="w-4 h-4" />
        クラスを作る
      </button>
    </div>
  );
}
