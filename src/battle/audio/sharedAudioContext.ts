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
    return shared;
  } catch {
    return null;
  }
}

/** テスト用：共有コンテキストを捨てる（本番では呼ばない） */
export function resetSharedAudioContextForTest(): void {
  shared = null;
}
