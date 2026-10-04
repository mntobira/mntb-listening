/**
 * 広告（収益化）の設定 — 2026-10-05
 * =====================================================================
 * アプリ（iOS / Android）として出すときに広告を入れる予定。今は **すべて OFF**。
 * Web 版では広告を出さない（「動画で1回」はアプリ内の応援動画のまま）。
 *
 * ■ 入れる予定の広告は2種類
 *   1. リワード広告 … ガチャの「動画で1回」。最後まで見たら無料で1回引ける。
 *   2. バナー広告   … 画面の上下（カサニマロさんの案）。UI を少し詰める必要がある。
 *
 * ■ 公開するときにやること（コードの書き換えはここと rewardedAd.ts の2か所だけ）
 *   1. Capacitor 等でアプリ化し、AdMob などの SDK を入れる
 *      （例：npm i @capacitor-community/admob）
 *   2. 下の AD_CONFIG を本番の値にする（または VITE_ 環境変数で渡す）
 *        rewarded.enabled = true / unitId = 本番の広告ユニットID
 *        banner.enabled   = true / position = 'bottom' など
 *   3. rewardedAd.ts の registerRewardedAdProvider() に SDK を渡す（main.tsx から1回）
 *   4. 利用規約（src/features/legal/legalText.ts）の「動画で1回は広告ではありません」を書き換える
 *   5. ATT（iOS のトラッキング許可）・プライバシーポリシー・ストアの「広告あり」申告
 *
 * ■ バナー広告を入れても画面が崩れないように
 *   すべての画面は CSS 変数 --ad-top-h / --ad-bottom-h（既定 0px）で上下の余白を取る。
 *   バナーを有効にすると AdBannerSlot がこの値を入れ、下のナビ（--app-nav-h）もその分だけ上がる。
 *   今は 0px なので見た目は一切変わらない。
 */

import { VIDEO_GACHA_DAILY_LIMIT } from '../battle/core/arenaEconomy';

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
const on = (v: string | undefined) => v === '1' || v === 'true';

export type BannerPosition = 'top' | 'bottom' | 'both';

export const AD_CONFIG = {
  rewarded: {
    /** true にすると「動画で1回」が広告になる（SDK が登録されていないときは応援動画に戻る） */
    enabled: on(env.VITE_ADS_REWARDED),
    /** AdMob のリワード広告ユニットID（未設定ならテストID） */
    unitId: env.VITE_ADS_REWARDED_UNIT_ID || 'ca-app-pub-3940256099942544/5224354917',
    /** 1日に見られる回数（ガチャの上限と同じ値を使う） */
    dailyLimit: VIDEO_GACHA_DAILY_LIMIT,
  },
  banner: {
    /** true にすると画面の上／下にバナーの場所を空ける */
    enabled: on(env.VITE_ADS_BANNER),
    position: (env.VITE_ADS_BANNER_POSITION as BannerPosition) || 'bottom',
    unitId: env.VITE_ADS_BANNER_UNIT_ID || 'ca-app-pub-3940256099942544/6300978111',
    /** スマホの標準バナー（320×50）。アダプティブバナーなら SDK から実寸を受け取って上書きする */
    height: 50,
    /** バナーを出さない画面（問題を解いている最中・対戦中・解説）。学習の邪魔をしない */
    hiddenOn: ['quiz', 'explanation', 'battle_live', 'onboarding', 'launch'] as string[],
  },
} as const;

export const adsActive = () => AD_CONFIG.rewarded.enabled || AD_CONFIG.banner.enabled;
