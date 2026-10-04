/**
 * リワード広告の差し替え口 — 2026-10-05
 * =====================================================================
 * ガチャの「動画で1回」は、ここを通して「最後まで見たか」を受け取る。
 *   - いま（Web・アプリ未公開）… provider が無いので、アプリ内の応援動画（RewardVideo）を使う
 *   - アプリ公開後 … AdMob などの SDK を registerRewardedAdProvider() で登録すると、広告に切り替わる
 *
 * ガチャ側（GachaRoom）は「広告か動画か」を知らなくてよい。結果は
 *   { status: 'rewarded' } … 最後まで見た → 1回引ける
 *   { status: 'dismissed' } … 途中で閉じた → 回数は消費しない
 *   { status: 'unavailable', reason } … 広告が用意できない → 応援動画で代わりに見られる
 * のどれかで返る。
 */
import { AD_CONFIG } from './adConfig';

export type RewardedResult =
  | { status: 'rewarded' }
  | { status: 'dismissed' }
  | { status: 'unavailable'; reason: string };

/** SDK（AdMob 等）を包む最小のインターフェース。アプリ化するときに実装して登録する */
export interface RewardedAdProvider {
  /** 広告を読み込む（表示の少し前に呼ぶ。失敗したら false） */
  load(unitId: string): Promise<boolean>;
  /** 広告を表示し、最後まで見たかを返す */
  show(unitId: string): Promise<RewardedResult>;
}

let provider: RewardedAdProvider | null = null;
let preloaded: Promise<boolean> | null = null;

/**
 * アプリ化したときに main.tsx から1回だけ呼ぶ。例（@capacitor-community/admob）：
 *
 *   import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';
 *   registerRewardedAdProvider({
 *     async load(adId) { try { await AdMob.prepareRewardVideoAd({ adId }); return true; } catch { return false; } },
 *     async show() {
 *       return new Promise(resolve => {
 *         let rewarded = false;
 *         AdMob.addListener(RewardAdPluginEvents.Rewarded, () => { rewarded = true; });
 *         AdMob.addListener(RewardAdPluginEvents.Dismissed, () => resolve(rewarded ? { status: 'rewarded' } : { status: 'dismissed' }));
 *         AdMob.showRewardVideoAd().catch(e => resolve({ status: 'unavailable', reason: String(e) }));
 *       });
 *     },
 *   });
 */
export function registerRewardedAdProvider(p: RewardedAdProvider | null): void { provider = p; preloaded = null; }

/** 広告として出せるか（設定が ON で、SDK が登録済み） */
export function rewardedAdAvailable(): boolean { return AD_CONFIG.rewarded.enabled && provider !== null; }

/** ガチャ画面を開いたときに先に読み込んでおく（押してから待たせない） */
export function preloadRewardedAd(): void {
  if (!rewardedAdAvailable() || preloaded) return;
  preloaded = provider!.load(AD_CONFIG.rewarded.unitId).catch(() => false);
}

/** 広告を見せる。出せないときは unavailable（呼び出し側は応援動画に切り替える） */
export async function showRewardedAd(): Promise<RewardedResult> {
  if (!rewardedAdAvailable()) return { status: 'unavailable', reason: 'not-configured' };
  try {
    const ready = await (preloaded ?? provider!.load(AD_CONFIG.rewarded.unitId));
    preloaded = null;
    if (!ready) return { status: 'unavailable', reason: 'load-failed' };
    const r = await provider!.show(AD_CONFIG.rewarded.unitId);
    preloadRewardedAd();
    return r;
  } catch (e) {
    preloaded = null;
    return { status: 'unavailable', reason: e instanceof Error ? e.message : 'error' };
  }
}
