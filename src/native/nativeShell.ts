import { Capacitor } from '@capacitor/core';

/**
 * アプリのネイティブシェル設定（ステータスバー・戻るボタン等）
 */
export async function initializeNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  // 将来のプラグイン（StatusBar, App 等）連携用エントリポイント
}
