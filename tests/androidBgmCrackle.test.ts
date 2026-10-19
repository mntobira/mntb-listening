/**
 * Google Play 版（ネイティブ Android）の BGM 音割れ対策（2026-10-16）の機械検査。
 *  ・Android では共有 AudioContext を latencyHint:'playback'（大きい出力バッファ）で作る
 *  ・Android ではタイトル曲を Web Audio に通さず <audio>.volume で鳴らす
 *  ・iOS・PC はこれまでどおり（Web Audio 経由・既定の latencyHint）
 *  ・音源ファイル（BGM）のピークは 0dBFS に届かない＝ファイル側の音割れではない
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36';
const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';

function setup(ua: string, platform: 'android' | 'ios' | 'web' = /Android/.test(ua) ? 'android' : 'ios') {
  const options: unknown[] = []; let sources = 0;
  class Context {
    state = 'running'; destination = {}; currentTime = 0;
    constructor(opt?: unknown) { options.push(opt); }
    createGain() { return { gain: { value: 1, cancelScheduledValues() {}, setTargetAtTime(v: number) { this.value = v; } }, connect() {} }; }
    createMediaElementSource() { sources++; return { connect() {} }; }
    resume() { return Promise.resolve(); }
  }
  vi.stubGlobal('navigator', { userAgent: ua });
  vi.stubGlobal('window', { AudioContext: Context, Capacitor: platform === 'web' ? undefined : { getPlatform: () => platform, isNativePlatform: () => true } });
  return { options, sources: () => sources };
}

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe('Android の BGM 音割れ対策', () => {
  it('Android：AudioContext は playback（大きいバッファ）で作る', async () => {
    const env = setup(ANDROID_UA);
    const { sharedAudioContext, resetSharedAudioContextForTest } = await import('../src/battle/audio/sharedAudioContext');
    resetSharedAudioContextForTest();
    expect(sharedAudioContext()).not.toBeNull();
    expect(env.options).toEqual([{ latencyHint: 'playback' }]);
  });

  it('Android の Chrome（Web 版）：従来どおり（Web 版では音割れしないため変えない）', async () => {
    const env = setup(ANDROID_UA, 'web');
    const { sharedAudioContext, resetSharedAudioContextForTest } = await import('../src/battle/audio/sharedAudioContext');
    resetSharedAudioContextForTest();
    sharedAudioContext();
    expect(env.options).toEqual([undefined]);
  });

  it('iOS：AudioContext は従来どおり既定値で作る', async () => {
    const env = setup(IOS_UA);
    const { sharedAudioContext, resetSharedAudioContextForTest } = await import('../src/battle/audio/sharedAudioContext');
    resetSharedAudioContextForTest();
    sharedAudioContext();
    expect(env.options).toEqual([undefined]);
  });

  it('Android：タイトル曲は Web Audio に通さず volume で音量を変える', async () => {
    const env = setup(ANDROID_UA);
    const { setTitleBgmVolume } = await import('../src/battle/audio/titleMediaAudio');
    const audio = { volume: 1 } as HTMLMediaElement;
    setTitleBgmVolume(audio, 0.3);
    expect(audio.volume).toBeCloseTo(0.3);
    setTitleBgmVolume(audio, 2);
    expect(audio.volume).toBe(1);
    expect(env.sources()).toBe(0);
  });

  it('iOS：タイトル曲は Web Audio（gain）で音量を変える（volume は 1 のまま）', async () => {
    const env = setup(IOS_UA);
    const { setTitleBgmVolume } = await import('../src/battle/audio/titleMediaAudio');
    const audio = { volume: 1 } as HTMLMediaElement;
    setTitleBgmVolume(audio, 0.3);
    expect(env.sources()).toBe(1);
    expect(audio.volume).toBe(1);
  });

  it.skipIf(!existsSync('/usr/bin/ffmpeg'))('BGM ファイルのピークは 0dBFS 未満（ファイル側の音割れではない）', () => {
    for (const f of ['public/tanjou.mp3', 'public/bgm/battle/waiting.mp3', 'public/bgm/battle/battle.mp3', 'public/bgm/battle/battle2.mp3']) {
      // volumedetect の結果は stderr に出る
      const { stderr } = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', f, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
      const m = /max_volume: (-?[\d.]+) dB/.exec(stderr);
      expect(m, f).not.toBeNull();
      expect(Number(m![1])).toBeLessThan(-0.5);
    }
  }, 30000);
});
