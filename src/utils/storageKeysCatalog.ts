/**
 * ===================================================================
 * 端末に保存する「固定名」のキーの一覧（C-17）
 * ===================================================================
 *
 * ■ なぜこのファイルがあるのか
 *   'savedAppState' や 'screenshot_mode' のような生の文字列が、App.tsx・adConfig.ts などに
 *   散らばって手書きされていた。キー名は「いまユーザーの端末に入っている値の在り処」なので、
 *   1文字違うだけで保存したはずのデータが消えたように見える（しかもエラーは出ない）。
 *   固定名のキーはここで1回だけ書き、呼ぶ側は定数で参照する。
 *
 * ■ 置き場所の決まり
 *   ・uid を含むキー        … utils/userStorageKeys.ts
 *   ・章 × モードのキー      … utils/quizStorageKeys.ts
 *   ・それ以外の固定名のキー … ここ
 *
 * ■ 変えてはいけないこと
 *   値（文字列そのもの）は既存の端末データの在り処なので、絶対に変えない。
 *   tests/storageKeysCatalog.test.ts が値を固定している。
 *   このファイルは他の src を import しない葉モジュール。
 */
export const STORAGE_KEYS = {
  /** 最後に開いていた画面（AppState） */
  appState: 'savedAppState',
  /** 最後の学び方（AppMode） */
  appMode: 'savedAppMode',
  /** 最後に開いた単元 ID */
  selectedChapterId: 'savedSelectedChapterId',
  /** 「この回だけ」を解いている範囲（{ startIndex, endIndex } の JSON） */
  quizRange: 'savedQuizRange',
  /** 最後に採点した解答（設問 ID → 文字列 の JSON） */
  quizAnswers: 'savedQuizAnswers',
  /** 旧：ゲストで使っているか（'true' / 'false'）。2026-10-19 のログイン必須化で読まなくなった（掃除のためだけに残す） */
  isGuest: 'savedIsGuest',
  /** ログインできずに「この端末だけで続ける」を選んだ印（ゲスト入口の廃止後の逃げ道・2026-10-19） */
  loginFallbackLocal: 'login_fallback_local_v1',
  /** 選んでいる科目 */
  selectedSubject: 'savedSelectedSubject',
  /** 最後にいた学習画面（戻り先） */
  lastLearnState: 'savedLastLearnState',
  /** 初回の案内を終えたか（'true'） */
  hasCompletedOnboarding: 'hasCompletedOnboarding',
  /** 画面検証（スクリーンショット）用の起動（'true'） */
  screenshotMode: 'screenshot_mode',
  /** 広告を出さない（'1'） */
  noAds: 'no_ads',
  /** 演習する：選んだ科目 */
  studyCatalogSubject: 'study_catalog_subject_v1',
  /** 演習する：前回開いたコンテンツ */
  studyCatalogLast: 'study_catalog_last_v1',
} as const;

export type StorageKeyName = keyof typeof STORAGE_KEYS;
