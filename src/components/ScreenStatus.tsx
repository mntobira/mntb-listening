import './screen-loading.css';

/**
 * 画面の読み込み中（2026-10-19）：文字だけだったのを「扉が少しずつ開く」小さな絵に。
 * 扉の開き閉じは transform（rotateY）だけ。動きを減らす設定では止まった半開きの扉。
 * 0.3秒より早く読み込めたときは出さない（チラつき防止）。
 */
export function ScreenLoading() {
  return <section role="status" aria-live="polite" className="screen-loading notebook-paper p-6 text-center font-handwriting text-[#2C3E50]">
    <span className="screen-loading-door" aria-hidden="true"><i /></span>
    <p className="font-bold">読み込んでいます…</p>
    <p className="mt-2 text-sm">そのままお待ちください。</p>
  </section>;
}

export function ScreenUnavailable({ message, onBack, backLabel = '単元一覧へ戻る' }: {
  message: string; onBack: () => void; backLabel?: string;
}) {
  return <section role="alert" className="notebook-paper p-6 text-center font-handwriting text-[#2C3E50]">
    <p className="font-bold">この画面を開けませんでした</p>
    <p className="mt-2 text-sm">{message}</p>
    <button type="button" onClick={onBack} className="mt-4 min-h-[44px] rounded-xl bg-[#2C3E50] px-5 py-3 font-bold text-white">{backLabel}</button>
  </section>;
}
