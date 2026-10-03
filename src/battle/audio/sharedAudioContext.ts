/**
 * アプリ全体で1つだけの AudioContext（2026-10-02）。
 *
 * ■ なぜ1つにまとめたか（「画面を変えたときに壊れたCDみたいになる」不具合）
 *   以前はタイトル曲（<audio> → MediaElementSource）と対戦の曲・効果音が
 *   別々の AudioContext を持っていた。iOS Safari は
 *     ・2つ目のコンテキストを作る／再開するたびに音声出力を組み直す
 *     ・<audio> が再生中なのに、つないだコンテキストだけ止まると
 *       同じ短いバッファを繰り返して「ガガガ」と鳴る
 *   ため、画面遷移（片方が止まり片方が鳴る）の瞬間に音が崩れていた。
 *   1つにすれば、出力の組み直しも片側だけの停止も起きない。
 */
let shared: AudioContext | null = null;

export function sharedAudioContext(): AudioContext | null {
  if (shared && shared.state !== 'closed') return shared;
  try {
    const AC = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    shared = new AC();
    installResumeGuards();
    return shared;
  } catch {
    return null;
  }
}

/**
 * 止まっていたら鳴らせる状態に戻す（タップの中で呼ぶと確実）。
 *
 * ★iOS の 'interrupted' も戻す★
 *   電話・Siri・アラーム・別アプリの音・画面ロックのあと、iOS Safari は
 *   コンテキストを 'interrupted' という独自の状態にする（'suspended' ではない）。
 *   `state === 'suspended'` だけを見て resume すると、この状態から戻らず
 *   アプリを開き直すまで無音になる（OS の更新で増えたケース）。
 */
export function resumeSharedAudio(): void {
  const ctx = shared;
  if (!ctx) return;
  const state = ctx.state as AudioContextState | 'interrupted';
  if (state === 'running' || state === 'closed') return;
  void ctx.resume().catch(() => {});
}

let guardsInstalled = false;
function installResumeGuards(): void {
  if (guardsInstalled || typeof window === 'undefined') return;
  guardsInstalled = true;
  // 画面に戻ってきたとき・最初のタップのたびに、止まっていれば戻す。
  // （iOS は「ユーザー操作の中」でしか resume を許さないことがあるので、タップでも試す）
  // ★見張りを付けられない環境（一部の WebView・テスト）でも音そのものは返す★
  try {
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') resumeSharedAudio(); });
    }
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('pageshow', resumeSharedAudio);
      window.addEventListener('pointerdown', resumeSharedAudio, { passive: true, capture: true });
      window.addEventListener('keydown', resumeSharedAudio, { capture: true });
    }
  } catch { /* 見張りが無くても、各再生の直前に resume する */ }
}

/** テスト用：共有コンテキストを捨てる（本番では呼ばない） */
export function resetSharedAudioContextForTest(): void {
  shared = null;
  guardsInstalled = false;
}

/** 効果音などの短い音用：共有コンテキストを返し、止まっていれば戻す */
export function sharedAudioContextResumed(): AudioContext | null {
  const ctx = sharedAudioContext();
  resumeSharedAudio();
  return ctx;
}
