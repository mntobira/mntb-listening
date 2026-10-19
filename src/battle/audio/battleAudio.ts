/**
 * ===================================================================
 * battleAudio — 対戦専用の BGM と効果音（音源ファイル MP3 再生）
 * ===================================================================
 *
 * ■ 音源について
 *   BGM（waiting, battle, battle2）および効果音（public/sfx/battle/*.mp3）は
 *   すべて実ファイルから読み込んで再生する。
 *   ピコピコ合成音へのフォールバックは廃止済み。
 *
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

// AudioContext.resume() はユーザー操作の前にブラウザが拒むのが通常。次の操作・再生で再び resume するので、
// このファイルの `.resume().catch(() => {})` は意図して捨てている。
import type { BattleAudioSettings, BattleBgmTrack } from '../core/audioSettings';
import { DEFAULT_BATTLE_AUDIO } from '../core/audioSettings';
import { playSample, preloadSamples } from './sfxSamples';
import { BGM_FILES, bgmFileKeyOf, introDelaySec, introOffsetSec, pickBattleVariant, isBattleVariantKey, BATTLE_BGM_VARIANTS, type BattleBgmVariant, type BgmFileKey } from './bgmFiles';
import { BATTLE_BGM_BUS_GAIN } from './bgmLoudness';
import { sharedAudioContext } from './sharedAudioContext';

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

export class BattleAudioEngine {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private settings: BattleAudioSettings = { ...DEFAULT_BATTLE_AUDIO };

  // Screen-owned requests prevent an outgoing screen from stopping the incoming screen.
  private owners = new Map<symbol, { track: BattleBgmTrack; priority: number; startInMs?: number }>();
  setBgmOwner(owner: symbol, track: BattleBgmTrack, priority = 10, startInMs?: number): void {
    this.owners.set(owner, { track, priority, startInMs });
    this.reconcileBgm();
  }
  releaseBgmOwner(owner: symbol): void {
    this.owners.delete(owner);
    // React runs all unmount cleanups before the next screen's effects.
    // Let the new screen claim the SAME source before deciding to stop it.
    queueMicrotask(() => this.reconcileBgm());
  }
  private reconcileBgm(): void {
    let request: { track: BattleBgmTrack; priority: number; startInMs?: number } | undefined;
    for (const next of this.owners.values()) if (!request || next.priority >= request.priority) request = next;
    this.playBgm(request?.track ?? null, { startInMs: request?.startInMs });
  }
  private track: BattleBgmTrack = null;

  /** AudioContext を作れる環境か */
  static supported(): boolean {
    return typeof window !== 'undefined' && Boolean(window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  }

  /** ユーザー操作の中で呼ぶ（自動再生制限を解く） */
  unlock(): void {
    const ctx = this.ensure();
    if (ctx && ctx.state !== 'running' && ctx.state !== 'closed') void ctx.resume().catch(() => {});
    if (ctx) preloadSamples(ctx);
    if (ctx) this.preloadBgmFiles();
    if (this.owners.size) this.reconcileBgm();
  }

  setSettings(next: BattleAudioSettings): void {
    const changed = this.settings.bgm !== next.bgm;
    this.settings = next;
    if (this.master) this.master.gain.value = next.volume;
    if (changed) this.reconcileBgm();
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
    // A closed context invalidates its sources, even when the requested track is unchanged.
    // Recreate BEFORE setting this.track: ensure() clears the old context's playback state.
    if (track && !this.ensure()) { this.track = null; return; }
    if (track === this.track) {
      if (track && this.ctx && this.ctx.state !== 'running' && this.ctx.state !== 'closed') void this.ctx.resume().catch(() => {});
      return;
    }
    const prev = this.track;
    this.track = track;
    // ★音源ファイル（bgmFiles.ts に登録があるとき）★
    //   normal→closing→final は同じ battle 曲を流しっぱなしにする（曲を切らない）。
    //   対戦曲は2曲（風の列車・カナリアスキップ）から★試合の頭で1回だけ★選ぶ。
    //   直前も対戦中（normal/closing/final）なら同じ曲のまま。待合室・停止から入ったときだけ選び直す。
    const inBattle = (t: BattleBgmTrack) => t === 'normal' || t === 'closing' || t === 'final';
    if (inBattle(track) && !inBattle(prev)) {
      this.battleVariant = this.upcomingVariant();
      this.nextVariant = null;
    } else if (!inBattle(track) && inBattle(prev)) {
      // 試合が終わった → 次の試合の曲を決めて、待合室にいるあいだに先読みする
      this.nextVariant = pickBattleVariant(this.random());
      if (this.ctx) this.preloadBgmFiles();
    }
    const fileKey = track ? bgmFileKeyOf(track, this.battleVariant) : null;
    if (fileKey && BGM_FILES[fileKey] && prev && this.fileKey === fileKey) return;
    this.stopFile();
    if (!track) return;
    const ctx = this.ensure();
    if (!ctx) { this.track = null; return; }
    if (ctx.state !== 'running') void ctx.resume().catch(() => {});
    if (fileKey && BGM_FILES[fileKey]) {
      this.playFile(fileKey, opts.startInMs);
      return;
    }
  }

  stopBgm(): void {
    this.track = null;
    this.stopFile();
  }

  // ------------------------------------------------------------
  // 音源ファイルのBGM（bgmFiles.ts）
  // ------------------------------------------------------------
  private fileKey: BgmFileKey | null = null;
  /** この試合の対戦曲（playBgm で試合の頭に決まる） */
  private battleVariant: BattleBgmVariant = 'battle';
  /** 次の試合の対戦曲（先読みする曲を1曲に絞るため、待合室にいるうちに決めておく） */
  private nextVariant: BattleBgmVariant | null = null;
  private upcomingVariant(): BattleBgmVariant {
    if (!this.nextVariant) this.nextVariant = pickBattleVariant(this.random());
    return this.nextVariant;
  }
  /** 乱数（テストで差し替える） */
  random: () => number = () => Math.random();
  /** いま選ばれている対戦曲（テスト・デバッグ用） */
  currentBattleVariant(): BattleBgmVariant { return this.battleVariant; }
  private fileSource: AudioBufferSourceNode | null = null;
  private fileEnv: GainNode | null = null;
  private fileBuffers = new Map<BgmFileKey, Promise<AudioBuffer | null>>();
  private fileRequest = 0;

  private loadFile(key: BgmFileKey): Promise<AudioBuffer | null> {
    const ctx = this.ctx;
    const spec = BGM_FILES[key];
    if (!ctx || !spec) return Promise.resolve(null);
    let p = this.fileBuffers.get(key);
    if (!p) {
      const url = spec.url;
      const getArrayBuffer = async (): Promise<ArrayBuffer> => {
        try {
          if (typeof fetch === 'function') {
            const r = await fetch(url);
            if (r.ok) return await r.arrayBuffer();
          }
        } catch { /* fetch が失敗した場合は XHR で再試行 */ }

        // WKWebView で fetch が失敗した場合に備えて XHR で再試行
        return new Promise<ArrayBuffer>((resolve, reject) => {
          if (typeof XMLHttpRequest === 'undefined') {
            return reject(new Error(`fetch failed for ${url} and XMLHttpRequest is unavailable`));
          }
          const xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.responseType = 'arraybuffer';
          xhr.onload = () => {
            if ((xhr.status >= 200 && xhr.status < 300) || (xhr.status === 0 && xhr.response)) {
              resolve(xhr.response as ArrayBuffer);
            } else {
              reject(new Error(`XHR ${xhr.status} fetching ${url}`));
            }
          };
          xhr.onerror = (e) => reject(e);
          xhr.send();
        });
      };

      p = getArrayBuffer()
        .then((b) => {
          return new Promise<AudioBuffer>((resolve, reject) => {
            const copy = b.slice(0);
            let settled = false;
            const ok = (ab: AudioBuffer) => { if (!settled) { settled = true; resolve(ab); } };
            const fail = (err: unknown) => { if (!settled) { settled = true; reject(err); } };
            try {
              const res = ctx.decodeAudioData(copy, ok, fail);
              if (res && typeof res.then === 'function') {
                res.then(ok).catch(fail);
              }
            } catch (e) {
              fail(e);
            }
          });
        })
        .catch((err) => {
          console.error(`[battleAudio] ❌ BGMロード失敗: "${key}" (${spec.url}):`, err);
          this.fileBuffers.delete(key);
          return null;
        });
      this.fileBuffers.set(key, p);
    }
    return p;
  }

  /** 待合室にいるあいだに battle 曲を先読みしておく（カウントダウン頭で待たせない） */
  preloadBgmFiles(): void {
    if (!this.ensure()) return;
    // ★対戦曲は「次に使う1曲」だけ★ 3分半の曲をデコードすると 70MB を超えるため、
    //   使わない対戦曲を抱えたままにしない（古い iPhone でタブが落ちるのを防ぐ）。
    const inBattle = this.track === 'normal' || this.track === 'closing' || this.track === 'final';
    const want = inBattle ? this.battleVariant : this.upcomingVariant();
    for (const k of BATTLE_BGM_VARIANTS) {
      if (k !== want && k !== this.fileKey) this.fileBuffers.delete(k);
    }
    (['waiting', want] as BgmFileKey[]).forEach((k) => { if (BGM_FILES[k]) void this.loadFile(k); });
  }

  private playFile(key: BgmFileKey, startInMs?: number): void {
    const spec = BGM_FILES[key]!;
    const req = ++this.fileRequest;
    this.fileKey = key;
    // ★経過は壁時計で測る★ iPhone では AudioContext が止まっている間 currentTime が進まず、
    //   読み込み待ちの時間を数えられないため、サビが START! より遅れていた（2026-10-05）
    const requestedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
    void this.loadFile(key).then((buffer) => {
      const ctx = this.ctx;
      if (req !== this.fileRequest || !ctx || !this.bgmGain || !this.track) return;
      if (!buffer) {
        // ロード失敗時は無音にする。ピコピコ音へのフォールバックは完全削除。
        console.error(`[battleAudio] ❌ BGM "${key}" (${spec.url}) のバッファ取得失敗。フォールバックは無効化されているため再生しません。`);
        this.fileKey = null;
        return;
      }
      console.log(`[battleAudio] 🎵 BGMファイル "${key}" (${spec.url}) 再生開始`);
      // 読み込みにかかった時間ぶん、カウントダウンは進んでいる
      const waited = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - requestedAt;
      const remainMs = startInMs == null ? null : startInMs - waited;
      // 試合が始まってから入った（再接続・カウントダウンが無い）ときは、前奏ではなくサビから鳴らす
      const offset = remainMs == null ? (isBattleVariantKey(key) ? spec.dropSec : 0) : introOffsetSec(spec.dropSec, remainMs);
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

  // ------------------------------------------------------------
  // 効果音
  // ------------------------------------------------------------

  play(sfx: BattleSfx): void {
    if (!this.settings.sfx) return;
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain) return;
    if (ctx.state !== 'running' && ctx.state !== 'closed') void ctx.resume().catch(() => {});
    playSample(ctx, this.sfxGain, sfx, SAMPLE_GAIN);
  }

  // ------------------------------------------------------------
  // 内部
  // ------------------------------------------------------------

  private ensure(): Ctx | null {
    if (this.ctx && this.ctx.state !== 'closed') return this.ctx;
    if (this.ctx) { this.stopBgm(); this.ctx = null; this.fileBuffers.clear(); }
    try {
      // タイトル曲と同じ1つのコンテキストを使う（sharedAudioContext.ts の理由を参照）
      const ctx = sharedAudioContext();
      if (!ctx) return null;
      const master = ctx.createGain();
      master.gain.value = this.settings.volume;
      master.connect(ctx.destination);
      const bgm = ctx.createGain();
      bgm.gain.value = BATTLE_BGM_BUS_GAIN;
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

  dispose(): void {
    this.stopBgm();
    // 共有コンテキストは閉じない（タイトル曲も同じものを使っている）
    try { this.master?.disconnect(); } catch { /* noop */ }
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
