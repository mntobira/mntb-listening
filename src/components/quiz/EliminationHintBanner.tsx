/**
 * 選択肢の上の「消去法の操作説明」（開いた説明／閉じた「?操作説明」ボタン）（C-19）。
 * MultipleChoiceControl.tsx から JSX をそのまま移した（DOM・クラス名・aria-* 属性・文言は1文字も変えていない）。
 * 部品ではなく描画関数にして、選択肢の並び（React の木）を1段も変えない。
 */
import { HelpCircle } from 'lucide-react';

export function renderEliminationHint({ elimHintOpen, dismissElimHint, setElimHintOpen }: {
  elimHintOpen: boolean;
  dismissElimHint: () => void;
  setElimHintOpen: (open: boolean) => void;
}) {
  return elimHintOpen ? (
    /*
      ★ご指摘「(ア)(イ)とかのボタンが欠けてる」の真因はここだった★

      この操作説明は初見ユーザーには既定で開いている。
      PC では横1行に収まるが、スマホ幅（360〜390px）では
      「タップで選択 → もう一度で斜線 → さらにタップで元に戻る
        ／長押しでこの設問の斜線をまとめて消す」が4行に折り返し、
      実測で約150px を占有していた。

      解答ペインの高さは端末と問題文の長さで決まる有限値なので、
      その150px はそのまま選択肢の取り分から引かれる。
      結果 (ア)(イ)(ウ)(エ) が下部ナビの下に押し出され、
      初見ユーザーの画面には選択肢が1つも映らない状態になっていた
      （実測：c5_7[0] 390x664 で 見えている選択肢 0/4）。

      ★直し方の方針★
        説明を消すのではなく、スマホだけ「見本＋2文字」に圧縮する。
        見本チップ（白／青／斜線）は残すので
        「斜線という段階がある」という肝心の気づきは失われない。
        md 以上は一切変更しない（PC の見た目は元のまま）。
    */
    <div className="order-2 md:order-none flex flex-wrap items-center gap-x-1.5 md:gap-x-2 gap-y-1 text-xs font-bold leading-snug text-gray-500 rounded-lg border border-gray-200 bg-gray-50/80 px-2 py-1 md:px-2.5 md:py-2">
      <span className="inline-flex items-center gap-1">
        <span className="inline-block rounded-md border-2 border-gray-200 bg-white px-1.5 py-0.5 text-gray-600">ア</span>
        <span className="hidden md:inline">タップで選択</span>
        <span className="md:hidden">選ぶ</span>
      </span>
      <span aria-hidden="true" className="text-gray-300">→</span>
      <span className="inline-flex items-center gap-1">
        <span className="inline-block rounded-md border-2 border-[#A9CCE3] bg-[#A9CCE3] px-1.5 py-0.5 text-white">ア</span>
        <span className="hidden md:inline">もう一度で斜線</span>
        <span className="md:hidden">斜線</span>
      </span>
      <span aria-hidden="true" className="text-gray-300">→</span>
      <span className="inline-flex items-center gap-1">
        <span className="inline-block rounded-md border-2 border-gray-200 bg-gray-100 px-1.5 py-0.5 text-gray-400 line-through decoration-2 decoration-[#E8A87C]">ア</span>
        <span className="hidden md:inline">さらにタップで元に戻る</span>
        <span className="md:hidden">戻す</span>
      </span>
      {/* 長押しの補足はスマホでは省く（「?」から開いた PC 幅でだけ出す）。
          肝心の3段階はチップの見本で伝わっている。 */}
      <span className="hidden md:inline text-gray-400">／長押しでこの設問の斜線をまとめて消す</span>
      <button
        type="button"
        onClick={dismissElimHint}
        className="ml-auto -my-1 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md px-2 text-xs font-bold text-gray-600 underline underline-offset-2 hover:bg-gray-100"
        aria-label="操作説明を閉じる（以降は ? ボタンで表示）"
      >
        閉じる
      </button>
    </div>
  ) : (
    // 折りたたみ状態（「?操作説明」だけ）もスマホでは選択肢の後ろへ。
    <div className="order-2 md:order-none flex justify-end">
      <button
        type="button"
        onClick={() => setElimHintOpen(true)}
        className="inline-flex min-h-11 items-center gap-1 px-2 text-xs font-bold text-gray-500 hover:text-gray-700"
        aria-label="選択肢の操作説明を表示"
        title="タップで選択→もう一度で斜線（消去法）の説明を見る"
      >
        <HelpCircle size={13} />
        操作説明
      </button>
    </div>
  );
}
