/**
 * ===================================================================
 * battleAudio — 対戦専用の BGM と効果音（WebAudio で合成）
 * ===================================================================
 *
 * ■ なぜ音源ファイルではなく合成なのか
 *   ・音源ファイルを増やすと初回読み込みが重くなる（既存の BGM は 1 曲で数MB）
 *   ・ライセンスの確認が要る
 *   ・「残り3問でテンポを上げる」「最終問題で強める」を、同じ素材の
 *     パラメータ（テンポ・音程・音色）を変えるだけで作れる
 *   短い音階のループを OscillatorNode で鳴らすので、ファイルは 0 個。
 *   長時間聞いても疲れないよう、音量は控えめ・音色は柔らかい三角波/正弦波にし、
 *   高音の連打を避けている。
 *
 * ■ 既存の BGM（App.tsx の <audio>）との関係
 *   既存の BGM とは独立した AudioContext を持つ。
 *   対戦中に両方鳴ると混ざるので、App.tsx 側で appState==='battle' のときは
 *   既存 BGM を止める（App.tsx の変更点を参照）。
 *
 * ■ ブラウザの自動再生制限
 *   AudioContext はユーザー操作（タップ）の後でしか鳴らない。
 *   対戦は「はじめる」「教科をえらぶ」などのタップを必ず経るので、
 *   そこで unlock() を呼んで resume する。鳴らせないときは黙って何もしない
 *   （音が出ないだけで対戦は成立する）。
 *
 * ■ このファイルは React を import しない
 *   フックは hooks/useBattleAudio.ts。ここは単体で動くクラス。
 */

import type { BattleAudioSettings, BattleBgmTrack } from '../core/audioSettings';
import { DEFAULT_BATTLE_AUDIO } from '../core/audioSettings';
import { playSample, preloadSamples } from './sfxSamples';
import { BGM_FILES, bgmFileKeyOf, introDelaySec, introOffsetSec, type BgmFileKey } from './bgmFiles';

/** 効果音ファイルの再生音量（ファイルはピーク約 -1dB で作ってあるので下げて合成音と揃える） */
const SAMPLE_GAIN = 0.5;

/** 効果音の種類 */
export type BattleSfx =
  | 'tap'            // 選択肢を押した
  | 'correct'        // 自分が正解
  | 'wrong'          // 自分が不正解
  | 'opponent-answered' // 相手が答えた（小さな合図）
  | 'opponent-correct'  // 相手が正解
  | 'combo'          // 連続正解
  | 'overtake'       // 逆転
  | 'overtaken'      // 逆転された
  | 'caught-up'      // 同点に追いついた
  | 'timeup'         // 答える前に時間切れ
  | 'matched'        // 相手が見つかった／部屋に入ってきた
  | 'hurry'          // 残り3秒（控えめ）
  | 'countdown'      // 3・2・1
  | 'start'          // START!
  | 'final'          // 最終問題の合図
  | 'win'
  | 'lose'
  | 'draw';

type Ctx = AudioContext;

/** 半音 → 周波数（A4=440） */
function hz(semitoneFromA4: number): number {
  return 440 * Math.pow(2, semitoneFromA4 / 12);
}

/** トラックごとの譜面（半音・A4基準）とテンポ */
interface TrackSpec {
  bpm: number;
  /** 1ループぶんの音列。null は休符 */
  melody: (number | null)[];
  /** ベース（メロディの半分のテンポで鳴る） */
  bass: (number | null)[];
  type: OscillatorType;
  /** 全体の相対音量 */
  gain: number;
}

const TRACKS: Record<Exclude<BattleBgmTrack, null>, TrackSpec> = {
  // 期待感：ゆったり、明るいメジャー
  matching: {
    bpm: 96,
    melody: [0, 4, 7, 12, 7, 4, 0, null, 2, 5, 9, 12, 9, 5, 2, null],
    bass: [-24, null, -17, null, -22, null, -17, null],
    type: 'triangle',
    gain: 0.55,
  },
  // 通常：テンポよく、でも同じ音を繰り返す（読解を邪魔しない）
  normal: {
    bpm: 112,
    melody: [0, null, 7, null, 5, null, 7, null, 0, null, 7, null, 9, null, 7, null],
    bass: [-24, -24, -19, -19, -24, -24, -17, -17],
    type: 'triangle',
    gain: 0.5,
  },
  // 残り3問：半音上げ、少し速く、マイナー寄り
  closing: {
    bpm: 124,
    melody: [1, null, 8, null, 6, null, 8, null, 1, null, 8, null, 10, 8, 6, null],
    bass: [-23, -23, -18, -18, -23, -23, -16, -16],
    type: 'triangle',
    gain: 0.55,
  },
  // 最終問題：さらに上げ、ベースを刻む
  final: {
    bpm: 136,
    melody: [3, null, 10, 8, 10, null, 3, null, 3, null, 10, 12, 10, 8, 6, null],
    bass: [-21, -21, -21, -21, -16, -16, -14, -14],
    type: 'square',
    gain: 0.42,
  },
};

export class BattleAudioEngine {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private settings: BattleAudioSettings = { ...DEFAULT_BATTLE_AUDIO };

  private track: BattleBgmTrack = null;
  private bgmTimer: number | null = null;
  private step = 0;
  private nextNoteAt = 0;

  /** AudioContext を作れる環境か */
  static supported(): boolean {
    return typeof window !== 'undefined' && Boolean(window.AudioContext || (window as any).webkitAudioContext);
  }

  /** ユーザー操作の中で呼ぶ（自動再生制限を解く） */
  unlock(): void {
    const ctx = this.ensure();
    if (ctx && ctx.state === 'suspended') void ctx.resume().catch(() => {});
    if (ctx) preloadSamples(ctx);
    if (ctx) this.preloadBgmFiles();
  }

  setSettings(next: BattleAudioSettings): void {
    this.settings = next;
    if (this.master) this.master.gain.value = next.volume;
    if (!next.bgm) this.stopBgm();
  }

  getSettings(): BattleAudioSettings {
    return this.settings;
  }

  // ------------------------------------------------------------
  // BGM
  // ------------------------------------------------------------

  /**
   * トラックを切り替える。同じトラックなら何もしない。
   * 切り替え時は前の音を止めて即座に次を始める（ループ位置は引き継ぐので
   * 「途中から違う曲」ではなく「同じ曲のテンポと調が変わった」ように聞こえる）。
   */
  playBgm(track: BattleBgmTrack, opts: { startInMs?: number } = {}): void {
    if (!this.settings.bgm) track = null;
    if (track === this.track) return;
    const prev = this.track;
    this.track = track;
    // ★音源ファイル（bgmFiles.ts に登録があるとき）★
    //   normal→closing→final は同じ battle 曲を流しっぱなしにする（曲を切らない）。
    const fileKey = track ? bgmFileKeyOf(track) : null;
    if (fileKey && BGM_FILES[fileKey] && prev && this.fileKey === fileKey && this.fileSource) return;
    this.clearBgmTimer();
    this.stopFile();
    if (!track) return;
    const ctx = this.ensure();
    if (!ctx) return;
    if (fileKey && BGM_FILES[fileKey]) {
      this.playFile(fileKey, opts.startInMs);
      return;
    }
    this.nextNoteAt = ctx.currentTime + 0.05;
    this.schedule();
  }

  stopBgm(): void {
    this.track = null;
    this.clearBgmTimer();
    this.stopFile();
  }

  // ------------------------------------------------------------
  // 音源ファイルのBGM（bgmFiles.ts）
  // ------------------------------------------------------------
  private fileKey: BgmFileKey | null = null;
  private fileSource: AudioBufferSourceNode | null = null;
  private fileEnv: GainNode | null = null;
  private fileBuffers = new Map<BgmFileKey, Promise<AudioBuffer | null>>();
  private fileRequest = 0;

  private loadFile(key: BgmFileKey): Promise<AudioBuffer | null> {
    const ctx = this.ctx;
    const spec = BGM_FILES[key];
    if (!ctx || !spec || typeof fetch !== 'function') return Promise.resolve(null);
    let p = this.fileBuffers.get(key);
    if (!p) {
      p = fetch(spec.url)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
        .then((b) => ctx.decodeAudioData(b))
        .catch(() => { this.fileBuffers.delete(key); return null; });
      this.fileBuffers.set(key, p);
    }
    return p;
  }

  /** 待合室にいるあいだに battle 曲を先読みしておく（カウントダウン頭で待たせない） */
  preloadBgmFiles(): void {
    if (!this.ensure()) return;
    (Object.keys(BGM_FILES) as BgmFileKey[]).forEach((k) => void this.loadFile(k));
  }

  private playFile(key: BgmFileKey, startInMs?: number): void {
    const spec = BGM_FILES[key]!;
    const req = ++this.fileRequest;
    this.fileKey = key;
    const requestedAt = this.ctx?.currentTime ?? 0;
    void this.loadFile(key).then((buffer) => {
      const ctx = this.ctx;
      if (req !== this.fileRequest || !ctx || !this.bgmGain || !this.track) return;
      if (!buffer) {
        // 読めなかった → 従来の合成音で鳴らす（無音にしない）
        this.fileKey = null;
        this.nextNoteAt = ctx.currentTime + 0.05;
        this.schedule();
        return;
      }
      // 読み込みにかかった時間ぶん、カウントダウンは進んでいる
      const waited = (ctx.currentTime - requestedAt) * 1000;
      const remainMs = startInMs == null ? null : startInMs - waited;
      const offset = remainMs == null ? 0 : introOffsetSec(spec.dropSec, remainMs);
      const delay = remainMs == null ? 0 : introDelaySec(spec.dropSec, remainMs);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      src.loopStart = spec.loopStartSec;
      src.loopEnd = spec.loopEndSec ?? buffer.duration;
      const env = ctx.createGain();
      const at = ctx.currentTime + 0.03 + delay;
      env.gain.setValueAtTime(0.0001, at);
      env.gain.exponentialRampToValueAtTime(Math.max(0.0002, spec.gain), at + 0.6);
      src.connect(env);
      env.connect(this.bgmGain);
      src.start(at, Math.min(offset, Math.max(0, buffer.duration - 0.05)));
      this.fileSource = src;
      this.fileEnv = env;
    });
  }

  private stopFile(): void {
    this.fileRequest += 1;
    this.fileKey = null;
    const ctx = this.ctx;
    const src = this.fileSource;
    const env = this.fileEnv;
    this.fileSource = null;
    this.fileEnv = null;
    if (!ctx || !src || !env) return;
    try {
      // ぷつっと切れないよう 0.4 秒で絞ってから止める
      const t = ctx.currentTime;
      env.gain.cancelScheduledValues(t);
      env.gain.setValueAtTime(Math.max(0.0002, env.gain.value), t);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      src.stop(t + 0.45);
    } catch { /* 止められなくても次の曲は鳴る */ }
  }

  private clearBgmTimer(): void {
    if (this.bgmTimer != null) {
      window.clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  /** 先読みスケジューリング（100ms ごとに次の 200ms ぶんを予約する） */
  private schedule(): void {
    const ctx = this.ctx;
    const track = this.track;
    if (!ctx || !track || !this.bgmGain) return;
    const spec = TRACKS[track];
    const beat = 60 / spec.bpm / 2; // 8分音符
    const horizon = ctx.currentTime + 0.25;

    while (this.nextNoteAt < horizon) {
      const m = spec.melody[this.step % spec.melody.length];
      const b = spec.bass[Math.floor(this.step / 2) % spec.bass.length];
      if (m != null) this.tone(this.bgmGain, hz(m), this.nextNoteAt, beat * 0.9, spec.type, 0.18 * spec.gain);
      if (this.step % 2 === 0 && b != null) {
        this.tone(this.bgmGain, hz(b), this.nextNoteAt, beat * 1.6, 'sine', 0.22 * spec.gain);
      }
      this.nextNoteAt += beat;
      this.step += 1;
    }
    this.bgmTimer = window.setTimeout(() => this.schedule(), 100);
  }

  // ------------------------------------------------------------
  // 効果音
  // ------------------------------------------------------------

  play(sfx: BattleSfx): void {
    if (!this.settings.sfx) return;
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain) return;
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
    const t = ctx.currentTime;
    const g = this.sfxGain;

    // 効果音ファイル（public/sfx/battle）が読み込めていればそれを鳴らす。
    // まだなら下の合成音で代わりに鳴らす。
    if (playSample(ctx, g, sfx, SAMPLE_GAIN)) return;

    switch (sfx) {
      case 'tap':
        this.tone(g, 880, t, 0.04, 'sine', 0.12);
        break;
      case 'correct':
        // 明るい上昇2音
        this.tone(g, hz(3), t, 0.09, 'triangle', 0.3);
        this.tone(g, hz(10), t + 0.09, 0.16, 'triangle', 0.3);
        break;
      case 'wrong':
        // 低い下降
        this.tone(g, 220, t, 0.12, 'sawtooth', 0.12);
        this.tone(g, 165, t + 0.1, 0.18, 'sawtooth', 0.1);
        break;
      case 'opponent-answered':
        // 相手の合図は控えめな1音（頻繫に鳴るので小さく・短く）
        this.tone(g, 660, t, 0.05, 'sine', 0.1);
        break;
      case 'opponent-correct':
        this.tone(g, hz(-2), t, 0.08, 'triangle', 0.18);
        this.tone(g, hz(3), t + 0.08, 0.1, 'triangle', 0.16);
        break;
      case 'combo':
        // 3音アルペジオ
        this.tone(g, hz(0), t, 0.07, 'triangle', 0.26);
        this.tone(g, hz(4), t + 0.07, 0.07, 'triangle', 0.26);
        this.tone(g, hz(7), t + 0.14, 0.16, 'triangle', 0.28);
        break;
      case 'overtake':
        this.tone(g, hz(-5), t, 0.08, 'square', 0.12);
        this.tone(g, hz(2), t + 0.08, 0.08, 'square', 0.12);
        this.tone(g, hz(7), t + 0.16, 0.2, 'square', 0.14);
        break;
      case 'overtaken':
        this.tone(g, hz(7), t, 0.12, 'triangle', 0.16);
        this.tone(g, hz(-2), t + 0.12, 0.24, 'triangle', 0.14);
        break;
      case 'caught-up':
        this.tone(g, hz(5), t, 0.08, 'triangle', 0.22);
        this.tone(g, hz(12), t + 0.08, 0.16, 'triangle', 0.24);
        break;
      case 'timeup':
        this.tone(g, hz(0), t, 0.16, 'triangle', 0.2);
        this.tone(g, hz(-12), t + 0.16, 0.3, 'triangle', 0.18);
        break;
      case 'matched':
        // 見つかった！ 明るい上昇3音
        this.tone(g, hz(0), t, 0.08, 'triangle', 0.26);
        this.tone(g, hz(5), t + 0.08, 0.08, 'triangle', 0.26);
        this.tone(g, hz(12), t + 0.16, 0.24, 'triangle', 0.3);
        break;
      case 'hurry':
        // 残り3秒の「コッ」。1秒ごとに鳴るので小さく短く
        this.tone(g, 520, t, 0.035, 'square', 0.06);
        break;
      case 'countdown':
        this.tone(g, 740, t, 0.1, 'sine', 0.24);
        break;
      case 'start':
        this.tone(g, 1100, t, 0.28, 'sine', 0.3);
        this.tone(g, 1480, t + 0.02, 0.26, 'triangle', 0.14);
        break;
      case 'final':
        this.tone(g, hz(-9), t, 0.14, 'square', 0.12);
        this.tone(g, hz(-9), t + 0.18, 0.14, 'square', 0.12);
        this.tone(g, hz(3), t + 0.36, 0.34, 'square', 0.14);
        break;
      case 'win':
        [0, 4, 7, 12].forEach((s, i) => this.tone(g, hz(s), t + i * 0.11, 0.14, 'triangle', 0.3));
        this.tone(g, hz(12), t + 0.44, 0.5, 'triangle', 0.32);
        this.tone(g, hz(7), t + 0.44, 0.5, 'sine', 0.2);
        break;
      case 'lose':
        [7, 5, 3, 0].forEach((s, i) => this.tone(g, hz(s - 12), t + i * 0.16, 0.2, 'triangle', 0.22));
        break;
      case 'draw':
        this.tone(g, hz(0), t, 0.18, 'triangle', 0.22);
        this.tone(g, hz(0), t + 0.22, 0.3, 'triangle', 0.22);
        break;
    }
  }

  // ------------------------------------------------------------
  // 内部
  // ------------------------------------------------------------

  private ensure(): Ctx | null {
    if (this.ctx) return this.ctx;
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      const ctx: Ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = this.settings.volume;
      master.connect(ctx.destination);
      const bgm = ctx.createGain();
      bgm.gain.value = 0.5;
      bgm.connect(master);
      const sfx = ctx.createGain();
      sfx.gain.value = 1;
      sfx.connect(master);
      this.ctx = ctx;
      this.master = master;
      this.bgmGain = bgm;
      this.sfxGain = sfx;
      return ctx;
    } catch {
      return null;
    }
  }

  /** 1音。アタック/リリースを付けてクリックノイズを避ける */
  private tone(
    out: GainNode,
    freq: number,
    at: number,
    dur: number,
    type: OscillatorType,
    peak: number,
  ): void {
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, at);
      env.gain.setValueAtTime(0.0001, at);
      env.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), at + 0.012);
      env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.connect(env);
      env.connect(out);
      osc.start(at);
      osc.stop(at + dur + 0.02);
    } catch {
      /* 音が出ないだけ */
    }
  }

  dispose(): void {
    this.stopBgm();
    if (this.ctx && this.ctx.state !== 'closed') void this.ctx.close().catch(() => {});
    this.ctx = null;
    this.master = null;
    this.bgmGain = null;
    this.sfxGain = null;
  }
}

/** アプリ内で1つだけ使う */
let shared: BattleAudioEngine | null = null;
export function battleAudio(): BattleAudioEngine {
  if (!shared) shared = new BattleAudioEngine();
  return shared;
}
