/**
 * 起動エンブレム〜タイトルの効果音（2026-10-17・宣伝動画の冒頭と同じ3つの音）。
 *
 *   open_shimmer … エンブレムが出たときの「きらきら」
 *   title_swell  … タイトルへ向かって盛り上がる「すーっ」（最後の 1.3 秒がピーク）
 *   title_bloom  … タイトルが出た瞬間の「ふわっ」（「誕生」と同じ E の和音）
 *
 * 音源は public/sfx/launch/*.mp3。store-assets/_tools/promo_sfx.py が numpy の数式だけで作った音
 * （素材・AI なし → 商用可・表記不要。public/sfx/launch/LICENSE_SFX.md）。
 *
 * ★勝手に大きな音を出さない★
 *   - タイトル画面の「BGM ON/OFF」が OFF なら鳴らさない（呼び出し側で判定）。
 *   - 音量は設定の音量（BGM と同じスライダー）に合わせる。
 *   - ブラウザが自動再生を止めている（AudioContext が running でない）ときは、その音は飛ばす。
 *     あとからまとめて鳴らす（＝タップした瞬間に3つが重なる）ことはしない。
 *     アプリ（Capacitor）はユーザー操作なしで鳴らせる設定なので、起動と同時に鳴る。
 */
import { sharedAudioContext } from './sharedAudioContext';

export const LAUNCH_SFX = ['open_shimmer', 'title_swell', 'title_bloom'] as const;
export type LaunchSfx = (typeof LAUNCH_SFX)[number];

/** 「すーっ」の長さ（この分だけタイトルより前に鳴らし始めると、ピークがタイトルに重なる） */
export const SWELL_LEAD_MS = 1300;

/**
 * いつ何を鳴らすか（純粋関数・テスト用）。
 * @param titleAtMs エンブレムが出てからタイトル画面に切り替わるまで（ms）
 *   - きらきら：エンブレムと同時
 *   - すーっ：タイトルの 1.3 秒前（それより前に余裕がなければ鳴らさない）
 *   - ふわっ：タイトルが出た瞬間
 */
export function launchCueSchedule(titleAtMs: number): { name: LaunchSfx; at: number }[] {
  const out: { name: LaunchSfx; at: number }[] = [{ name: 'open_shimmer', at: 0 }];
  if (titleAtMs - SWELL_LEAD_MS >= 600) out.push({ name: 'title_swell', at: titleAtMs - SWELL_LEAD_MS });
  out.push({ name: 'title_bloom', at: titleAtMs });
  return out;
}

const buffers = new Map<LaunchSfx, AudioBuffer>();
let loading: Promise<void> | null = null;

/** 3つの音を読み込む（何度呼んでも1回だけ）。失敗しても投げない */
export function preloadLaunchSfx(): Promise<void> {
  if (loading) return loading;
  const ctx = sharedAudioContext();
  if (!ctx || typeof fetch !== 'function') return Promise.resolve();
  loading = Promise.all(LAUNCH_SFX.map(name => fetch(`/sfx/launch/${name}.mp3`)
    .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.arrayBuffer(); })
    .then(b => ctx.decodeAudioData(b))
    .then(ab => { buffers.set(name, ab); })
    .catch(() => { /* 読めない音は鳴らさないだけ */ }))).then(() => {
      // 1つでも読めなかったら、次に呼ばれたとき読み直せるようにする
      if (buffers.size < LAUNCH_SFX.length) loading = null;
    });
  return loading;
}

const live = new Set<{ src: AudioBufferSourceNode; gain: GainNode }>();

/**
 * 1つ鳴らす。読み込み済み・AudioContext が running のときだけ鳴って true。
 * @param volume 0〜1（設定の音量）
 */
export function playLaunchSfx(name: LaunchSfx, volume: number): boolean {
  const ctx = sharedAudioContext();
  const buf = buffers.get(name);
  if (!ctx || !buf || ctx.state !== 'running') return false;
  const v = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 0;
  if (v <= 0) return false;
  try {
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buf;
    gain.gain.value = v;
    src.connect(gain).connect(ctx.destination);
    const node = { src, gain };
    live.add(node);
    src.onended = () => { live.delete(node); try { gain.disconnect(); } catch { /* 切断済み */ } };
    src.start();
    return true;
  } catch {
    return false;
  }
}

/** 鳴っている起動音をすっと消す（「はじめる」で次の画面へ進んだときなど。「誕生」と重ねない） */
export function fadeOutLaunchSfx(ms = 400): void {
  const ctx = sharedAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  for (const { src, gain } of live) {
    try {
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0, t + ms / 1000);
      src.stop(t + ms / 1000 + 0.02);
    } catch { /* すでに止まっている */ }
  }
}
