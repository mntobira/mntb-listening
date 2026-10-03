/**
 * feedback — 対戦モードの「手触り」：効果音と振動
 *
 * ■ 音源
 *   public/sfx/battle/*.mp3（scripts/sfx/gen_battle_sfx.py で合成したオリジナル音・商用利用可）
 *   を優先して鳴らす。読み込み前・失敗時は下の SFX 表から WebAudio でその場で合成する。
 *   ・読み込み待ちが無い（結果画面が出た瞬間に鳴る）
 *   ・バンドルが増えない
 *   ・ライセンスの心配が無い
 *
 * ■ ★勝手に鳴らさない★
 *   ユーザーの操作（ボタン）か、操作の直後（結果表示）でしか呼ばない。
 *   AudioContext はユーザー操作の中で最初に作る。iOS は操作外だと鳴らない。
 *   設定は localStorage `battle_sfx`（'on' | 'off'、既定 on）。
 *   既存の BGM 設定（`bgm_enabled`）とは独立。
 *
 * ■ 振動
 *   navigator.vibrate が使える端末のみ（Android Chrome）。iOS は無視される。
 *   長い振動は使わない（最長 40ms）。
 *
 * ■ 純粋な「パターン表」は下の SFX に置く。UI から呼ぶのは play() だけ。
 */

import { readAudioPreferences, writeAudioPreferences } from '../audio/audioPreferences';
import { playSample, preloadSamples } from '../audio/sfxSamples';
import { sharedAudioContextResumed } from '../audio/sharedAudioContext';

export type SfxName =
  | 'tap' // ボタン
  | 'correct' // 正解
  | 'wrong' // 不正解
  | 'win' // 勝ち
  | 'lose' // 負け
  | 'draw' // 引き分け
  | 'levelup' // レベルアップ
  | 'badge' // 新称号
  | 'coin' // 報酬受け取り
  | 'rankup' // 段位アップ
  | 'chest' // 宝箱オープン
  | 'jackpot' // 宝箱の大当たり
  | 'gacha' // ガチャの結果
  | 'tick'; // カウントアップの刻み

type Note = { f: number; t: number; d: number; type?: OscillatorType; g?: number };

/** 各音の「周波数・開始(ms)・長さ(ms)」 */
const SFX: Record<SfxName, Note[]> = {
  tap: [{ f: 880, t: 0, d: 30, type: 'square', g: 0.05 }],
  tick: [{ f: 1320, t: 0, d: 18, type: 'square', g: 0.03 }],
  correct: [
    { f: 880, t: 0, d: 70 },
    { f: 1320, t: 70, d: 110 },
  ],
  wrong: [{ f: 220, t: 0, d: 160, type: 'sawtooth', g: 0.08 }],
  win: [
    { f: 659, t: 0, d: 90 },
    { f: 784, t: 90, d: 90 },
    { f: 988, t: 180, d: 90 },
    { f: 1319, t: 270, d: 260 },
  ],
  lose: [
    { f: 392, t: 0, d: 160 },
    { f: 330, t: 160, d: 260, type: 'triangle' },
  ],
  draw: [
    { f: 523, t: 0, d: 120 },
    { f: 523, t: 160, d: 200 },
  ],
  levelup: [
    { f: 523, t: 0, d: 80 },
    { f: 659, t: 80, d: 80 },
    { f: 784, t: 160, d: 80 },
    { f: 1047, t: 240, d: 160 },
    { f: 1319, t: 400, d: 320 },
  ],
  badge: [
    { f: 1047, t: 0, d: 60 },
    { f: 1568, t: 60, d: 200 },
  ],
  coin: [
    { f: 1568, t: 0, d: 50, type: 'square', g: 0.06 },
    { f: 2093, t: 50, d: 120, type: 'square', g: 0.06 },
  ],
  rankup: [
    { f: 784, t: 0, d: 100 },
    { f: 988, t: 100, d: 100 },
    { f: 1175, t: 200, d: 100 },
    { f: 1568, t: 300, d: 400 },
    { f: 1976, t: 300, d: 400, g: 0.05 },
  ],
  chest: [
    { f: 784, t: 0, d: 80 },
    { f: 1047, t: 80, d: 80 },
    { f: 1568, t: 160, d: 240 },
  ],
  jackpot: [
    { f: 1047, t: 0, d: 70 },
    { f: 1319, t: 70, d: 70 },
    { f: 1568, t: 140, d: 70 },
    { f: 2093, t: 210, d: 400 },
  ],
  gacha: [
    { f: 1319, t: 0, d: 40, type: 'square', g: 0.04 },
    { f: 1480, t: 90, d: 40, type: 'square', g: 0.04 },
    { f: 2093, t: 220, d: 260 },
  ],
};

const VIBE: Partial<Record<SfxName, number | number[]>> = {
  tap: 8,
  correct: 20,
  wrong: [30, 30, 30],
  win: [30, 40, 30, 40, 60],
  lose: 40,
  levelup: [20, 30, 20, 30, 40],
  badge: [20, 40, 20],
  coin: 15,
  rankup: [30, 30, 30, 30, 80],
  chest: [20, 30, 40],
  jackpot: [30, 30, 30, 30, 80],
  gacha: [15, 40, 30],
};

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  // アプリ全体で1つの AudioContext を使う（sharedAudioContext.ts の説明を参照）
  ctx = sharedAudioContextResumed();
  return ctx;
}

export function sfxEnabled(): boolean { return readAudioPreferences().sfx; }
export function setSfxEnabled(on: boolean): void { writeAudioPreferences({ sfx: on }); }

/** ユーザー操作の中で先に呼ぶと、あとの音が iOS でも確実に鳴る */
export function primeAudio(): void {
  if (!sfxEnabled()) return;
  const ac = context();
  if (ac) preloadSamples(ac);
}

/**
 * 効果音＋振動。失敗しても何も投げない。
 * @param vibrate 振動も出すか（既定 true）
 */
export function play(name: SfxName, vibrate = true): void {
  if (!sfxEnabled()) return;
  const ac = context();
  // 効果音ファイルが読めていればそれを鳴らす（音量は対戦の音量設定に合わせる）
  if (ac && playSample(ac, ac.destination, name, 0.5 * readAudioPreferences().volume)) {
    /* 鳴らせた */
  } else if (ac) {
    try {
      const now = ac.currentTime;
      for (const n of SFX[name]) {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = n.type ?? 'sine';
        osc.frequency.value = n.f;
        const start = now + n.t / 1000;
        const end = start + n.d / 1000;
        const peak = n.g ?? 0.09;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(peak, start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
        osc.connect(gain).connect(ac.destination);
        osc.start(start);
        osc.stop(end + 0.02);
      }
    } catch {
      /* 音は無くても進む */
    }
  }
  if (vibrate) {
    const pattern = VIBE[name];
    if (pattern && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch {
        /* 無視 */
      }
    }
  }
}
