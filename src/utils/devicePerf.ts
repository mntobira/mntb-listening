/**
 * ===================================================================
 * 端末スペックの自動判定（アダプティブ・パフォーマンス層）L-08
 * ===================================================================
 *
 * ■ なぜ要るのか
 *   これまでの切り替えは prefers-reduced-motion（動き 0 か 100 か）だけだった。
 *   「設定は標準のまま・でも端末は格安 Android／古い iPad」という生徒のスマホでは
 *   フル負荷の演出（1文字ずつのぼかし・画面より大きいマスク回転・大量の紙吹雪）が走り、
 *   1フレーム 16.6ms に収まらずに数百 ms 固まってから最後のコマへ飛ぶ（＝止まって見える）。
 *
 * ■ やること
 *   起動時に1回だけ判定し、低スペックなら <html data-perf="lite"> を付ける。
 *   lite のときも **動き自体は止めない**。重いもの（blur・巨大マスク・多量の粒・
 *   背景の常時ループ）だけを CSS 側（src/styles/perf-lite.css）で省き、主役の動きを 60fps で通す。
 *
 * ■ 判定（どれか1つで lite）
 *   1. ハードウェア指標：deviceMemory <= 4（GB）、または hardwareConcurrency <= 4
 *      ※ iOS の WebKit は hardwareConcurrency を指紋対策で丸めて返すため、
 *        iOS（iPhone/iPad）では hardwareConcurrency を判定に使わない（全 iPhone が lite になってしまう）
 *   2. 実測：起動直後の requestAnimationFrame の間隔を測り、平均が 24ms を超える（40fps 未満）
 *   3. 省データ設定（navigator.connection.saveData）
 *
 * ■ 意図的にこうしている点
 *   ・判定は純粋関数（classifyDevicePerf / isSlowFrameSample）に分け、DOM なしで単体テストできる
 *   ・一度 lite になったら同じ起動中は戻さない（ちらつき防止）
 *   ・タブが裏にある間は rAF が止まる／間引かれるので、見えているときだけ測る
 *   ・例外は一切外に出さない（判定に失敗しても既定の full で起動が続く）
 */

export type PerfTier = 'full' | 'lite';

/** 判定に使う端末の指標（テストで差し替えられるよう、navigator から切り離した形） */
export interface DeviceSignals {
  /** navigator.deviceMemory（GB。Chrome 系だけ。無ければ undefined） */
  deviceMemory?: number;
  /** navigator.hardwareConcurrency（論理コア数） */
  hardwareConcurrency?: number;
  /** iOS / iPadOS の WebKit か（コア数が丸められるので判定から外す） */
  isAppleMobile?: boolean;
  /** 省データ設定 */
  saveData?: boolean;
}

/** lite と見なすメモリ（GB）とコア数の上限 */
export const LITE_MEMORY_GB = 4;
export const LITE_CORES = 4;
/** 平均フレーム間隔がこれを超えたら lite（24ms ≒ 40fps 未満） */
export const SLOW_FRAME_MS = 24;
/** 実測するフレーム数（最初の数コマは起動処理で乱れるので捨てる） */
export const SAMPLE_FRAMES = 30;
export const WARMUP_FRAMES = 5;

/** ハードウェア指標だけで判定する（実測の前に即決できる分） */
export function classifyDevicePerf(s: DeviceSignals): PerfTier {
  if (s.saveData) return 'lite';
  if (typeof s.deviceMemory === 'number' && s.deviceMemory > 0 && s.deviceMemory <= LITE_MEMORY_GB) return 'lite';
  if (!s.isAppleMobile && typeof s.hardwareConcurrency === 'number' && s.hardwareConcurrency > 0 && s.hardwareConcurrency <= LITE_CORES) return 'lite';
  return 'full';
}

/**
 * rAF のタイムスタンプ列から「遅い端末か」を判定する。
 * 先頭 WARMUP_FRAMES 個は捨て、残りの間隔の平均で見る。
 * 1つだけ極端に長い間隔（GC・タブ切り替え）は 100ms で頭打ちにして、平均を引きずらないようにする。
 */
export function isSlowFrameSample(stamps: readonly number[], warmup = WARMUP_FRAMES, threshold = SLOW_FRAME_MS): boolean {
  const xs = stamps.slice(warmup);
  if (xs.length < 2) return false;
  let sum = 0;
  for (let i = 1; i < xs.length; i++) sum += Math.min(100, Math.max(0, xs[i] - xs[i - 1]));
  return sum / (xs.length - 1) > threshold;
}

/** 実行中のブラウザから指標を読む（読めない項目は undefined） */
export function readDeviceSignals(): DeviceSignals {
  try {
    const nav = (globalThis as { navigator?: Navigator }).navigator as
      | (Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } })
      | undefined;
    if (!nav) return {};
    const ua = nav.userAgent || '';
    // iPadOS 13+ は Mac を名乗るので、タッチ点数で見分ける
    const isAppleMobile = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && (nav.maxTouchPoints ?? 0) > 1);
    return {
      deviceMemory: nav.deviceMemory,
      hardwareConcurrency: nav.hardwareConcurrency,
      isAppleMobile,
      saveData: nav.connection?.saveData === true,
    };
  } catch {
    return {}; // 指標が読めない端末は既定（full）のまま
  }
}

let current: PerfTier = 'full';
const listeners = new Set<(tier: PerfTier) => void>();

/** いまの判定（lite / full）。CSS は html[data-perf=lite]、JS はこれで分岐する */
export function getPerfTier(): PerfTier {
  return current;
}
export function isLitePerf(): boolean {
  return current === 'lite';
}
/** 判定が変わったとき（実測で lite になったとき）に呼ばれる。戻り値で解除 */
export function onPerfTierChange(fn: (tier: PerfTier) => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function apply(tier: PerfTier, root?: HTMLElement): void {
  if (current === 'lite' || tier === current) return; // 一度 lite になったら戻さない
  current = tier;
  try {
    if (root) root.dataset.perf = tier;
  } catch {
    /* DOM に書けなくても JS 側の判定は使える */
  }
  listeners.forEach((fn) => fn(tier));
}

/**
 * 起動時に1回だけ呼ぶ（main.tsx）。
 *   1) 指標で即決 → lite なら即 data-perf="lite"
 *   2) full なら、見えている間に rAF を SAMPLE_FRAMES コマ測り、遅ければ lite に落とす
 * 戻り値で計測を止められる（テスト・HMR 用）。
 */
export function installDevicePerf(doc: Document | undefined = (globalThis as { document?: Document }).document): () => void {
  if (!doc) return () => {};
  const root = doc.documentElement;
  const byHardware = classifyDevicePerf(readDeviceSignals());
  if (byHardware === 'lite') { apply('lite', root); return () => {}; }
  try { root.dataset.perf = 'full'; } catch { /* 書けなくても続行 */ }
  if (typeof requestAnimationFrame !== 'function') return () => {};

  let raf = 0;
  let stamps: number[] = [];
  let stopped = false;
  const tick = (t: number) => {
    if (stopped) return;
    if (doc.hidden) { stamps = []; raf = requestAnimationFrame(tick); return; } // 裏にいる間の値は使わない
    stamps.push(t);
    if (stamps.length < SAMPLE_FRAMES + WARMUP_FRAMES) { raf = requestAnimationFrame(tick); return; }
    stopped = true;
    if (isSlowFrameSample(stamps)) apply('lite', root);
  };
  raf = requestAnimationFrame(tick);
  return () => { stopped = true; cancelAnimationFrame(raf); };
}

/** テスト用：状態を初期化する */
export function __resetDevicePerfForTest(): void {
  current = 'full';
  listeners.clear();
}
