import './screen-loading.css';

/**
 * 画面の読み込み中（2026-10-19）：文字だけだったのを「扉が少しずつ開く」小さな絵に。
 * 扉の開き閉じは transform（rotateY）だけ。動きを減らす設定では止まった半開きの扉。
 * 0.3秒より早く読み込めたときは出さない（チラつき防止）。
 */
export function ScreenLoading() {
  return (
    <div className="screen-status-shell">
      <section role="status" aria-live="polite" className="screen-loading screen-status-card">
        <span className="screen-loading-door" aria-hidden="true"><i /></span>
        <p className="screen-status-title">読み込んでいます…</p>
        <p className="screen-status-sub">そのままお待ちください。</p>
      </section>
    </div>
  );
}

export function ScreenUnavailable({ message, onBack, backLabel = '単元一覧へ戻る' }: {
  message: string; onBack: () => void; backLabel?: string;
}) {
  return (
    <div className="screen-status-shell">
      <section role="alert" className="screen-status-card screen-unavailable">
        <p className="screen-status-title">この画面を開けませんでした</p>
        <p className="screen-status-sub">{message}</p>
        <button type="button" onClick={onBack} className="mt-btn mt-btn-primary screen-status-btn">{backLabel}</button>
      </section>
    </div>
  );
}
