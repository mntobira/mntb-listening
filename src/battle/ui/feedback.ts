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
  // 効果音ファイル（public/sfx/battle/*.mp3）を鳴らす
  if (ac) {
    playSample(ac, ac.destination, name, 0.5 * readAudioPreferences().volume);
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
