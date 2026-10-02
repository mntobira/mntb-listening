/** Safari on iOS ignores HTMLMediaElement.volume. Control the title through
 * Web Audio like battle music, without changing the licensed source file.
 * Retain one media source per element (also across StrictMode effects).
 */
type Route = { context: AudioContext; gain: GainNode; source: MediaElementAudioSourceNode };
const routes = new WeakMap<HTMLMediaElement, Route>();

export function setTitleBgmVolume(audio: HTMLMediaElement, volume: number): void {
  const value = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 0;
  let route = routes.get(audio);
  if (!route) {
    const Constructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Constructor) {
      const context = new Constructor();
      try {
        const gain = context.createGain();
        const source = context.createMediaElementSource(audio);
        gain.gain.value = value; // Set BEFORE connecting: never leak a full-volume frame.
        source.connect(gain);
        gain.connect(context.destination);
        route = { context, gain, source };
        routes.set(audio, route);
      } catch {
        void context.close().catch(() => {});
      }
    }
  }
  if (route) {
    audio.volume = 1; // Only the gain node attenuates (no accidental double correction).
    route.gain.gain.value = value;
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
