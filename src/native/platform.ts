import { Capacitor } from '@capacitor/core';

/**
 * アプリの中（iOS / Android ネイティブ環境）で動作しているかを判定する。
 * Web ブラウザ（PC / スマホ）では常に false。
 */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * 現在のプラットフォームを返す（'ios' | 'android' | 'web'）
 */
export function getAppPlatform(): 'ios' | 'android' | 'web' {
  const p = Capacitor.getPlatform();
  if (p === 'ios') return 'ios';
  if (p === 'android') return 'android';
  return 'web';
}
