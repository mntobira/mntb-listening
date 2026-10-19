/**
 * 音の鳴らし方を端末ごとに変えるための判定（2026-10-16「Google Play 版で BGM が音割れする」）。
 *
 * ※主な原因はネイティブ側（Capacitor 内蔵サーバーの Range 応答）で、
 *   android/app/src/main/java/com/manatobi/listening/RangeAwareWebViewClient.java で直している。
 *   ここは「Web Audio のバッファが小さい」ことによる音割れを避ける補助の対策。
 *
 * ■ なぜ Android だけ分けるのか
 *   Android の WebView（Chrome）は、AudioContext を既定の latencyHint='interactive' で作ると
 *   出力バッファをとても小さく取る。画面の切り替え・アニメーション・React の再描画で
 *   メインスレッドが少し詰まるだけでバッファが空になり（アンダーラン）、
 *   「バチバチ・ザザッ」という音割れになる。音源ファイルの音量は原因ではない
 *   （全曲ピーク -5.9dBFS 以下・効果音と重ねても 0dBFS を超えない。ffmpeg で実測）。
 *
 *   ・Android：バッファを大きく取る 'playback' にする（BGM が主役で、数十ms の遅れは気にならない）
 *   ・Android：タイトル曲（<audio>）は Web Audio に通さず、<audio>.volume で音量を変える。
 *     Web Audio に通しているのは「iOS Safari が volume を無視する」ためで、Android には不要。
 *     通さなければ、タイトル曲はメディアプレーヤー側の大きなバッファで鳴り、音割れしない。
 *   ・iOS・PC：これまでどおり（iOS の音量対策・効果音の反応の速さを変えない）
 */
export function isAndroidAudio(): boolean {
  // ★Google Play 版（Capacitor のネイティブ Android）だけ★
  //   Android の Chrome で開く Web 版は音割れしない（ご報告）ので、Web 版の鳴らし方は変えない。
  //   @capacitor/core を import せず window.Capacitor を見る（この判定を音声まわりの葉に保つため）。
  try {
    const cap = (typeof window !== 'undefined' ? (window as Window & { Capacitor?: { getPlatform?: () => string; isNativePlatform?: () => boolean } }).Capacitor : undefined);
    return !!cap && cap.getPlatform?.() === 'android' && cap.isNativePlatform?.() !== false;
  } catch {
    return false; // 判定できないときは従来どおりの鳴らし方にする
  }
}
