/** Safari on iOS ignores HTMLMediaElement.volume. Control the title through
 * Web Audio like battle music, without changing the licensed source file.
 * Retain one media source per element (also across StrictMode effects).
 */
// AudioContext.resume() はユーザー操作の前にブラウザが拒むのが通常。次の操作・再生で再び resume するので、
// このファイルの `.resume().catch(() => {})` は意図して捨てている。
import { sharedAudioContext } from './sharedAudioContext';
import { isAndroidAudio } from './audioPlatform';

type Route = { context: AudioContext; gain: GainNode; source: MediaElementAudioSourceNode };
const routes = new WeakMap<HTMLMediaElement, Route>();

export function setTitleBgmVolume(audio: HTMLMediaElement, volume: number): void {
  const value = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 0;
  let route = routes.get(audio);
  // Android は volume が効くので Web Audio に通さない（通すと音割れしやすい。audioPlatform.ts）
  if (!route && isAndroidAudio()) { audio.volume = value; return; }
  if (!route) {
    const context = sharedAudioContext();
    if (context) {
      try {
        const gain = context.createGain();
        const source = context.createMediaElementSource(audio);
        gain.gain.value = value; // Set BEFORE connecting: never leak a full-volume frame.
        source.connect(gain);
        gain.connect(context.destination);
        route = { context, gain, source };
        routes.set(audio, route);
      } catch {
        /* つなげない環境では audio.volume で代用（共有コンテキストは閉じない） */
      }
    }
  }
  if (route) {
    audio.volume = 1; // Only the gain node attenuates (no accidental double correction).
    // 値を飛ばさず短時間でなめらかに寄せる（音量変更・再開時のプツッを防ぐ）
    const t = route.context.currentTime;
    try { route.gain.gain.cancelScheduledValues(t); route.gain.gain.setTargetAtTime(value, t, 0.02); }
    catch { route.gain.gain.value = value; }
  } else {
    audio.volume = value; // Older browsers without Web Audio.
  }
}

/** Call during a gesture as well as playback effects to recover interruptions. */
export function unlockTitleBgm(audio: HTMLMediaElement, volume: number): void {
  setTitleBgmVolume(audio, volume);
  const context = routes.get(audio)?.context;
  if (context && context.state !== 'running' && context.state !== 'closed') void context.resume().catch(() => {});
}
