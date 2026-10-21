// src/main.tsx
// ★必ず最初に読む★（古い iOS で無い関数を、他のモジュールが使う前に補う）
import './utils/polyfills';
// localStorage の容量オーバーで画面が止まらないようにする（setItem を1回だけ包む）
import './utils/storageGuard';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// 低スペック端末の軽量化（html[data-perf=lite] のときだけ効く）。各画面の CSS より後に読む
import './styles/perf-lite.css';
// モーション層（キネティック・タイポ／UIの動き／インフォグラフィック）。index.css の後に読む
import { installRipple } from './motion';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppWallpaper } from './components/AppWallpaper';
import { installChunkRecovery } from './utils/chunkRecovery';
import { installDevicePerf } from './utils/devicePerf';
import { initializeAdMob } from './utils/adService';

import { isNativeApp, getAppPlatform } from './native/platform';

installChunkRecovery();
// 端末スペックを判定して <html data-perf> を付ける（波紋・見出しの動きより先に）
installDevicePerf();
installRipple();
initializeAdMob();
if (typeof document !== 'undefined') {
  document.documentElement.dataset.platform = getAppPlatform();
}

// PWA Service Worker 登録（アプリの中では使わない）
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  if (isNativeApp()) {
    // アプリ版では旧 Service Worker を外すだけ。外せなくても起動は続ける
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    }).catch(() => {}); // 外せなくても起動は続ける
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then((reg) => {
          // 画面を開いたまま新しい版が出たときも、戻ってきたときに更新を確認する
          document.addEventListener('visibilitychange', () => {
            // 更新確認の失敗（オフライン）は次に戻ってきたときに再確認する
            if (document.visibilityState === 'visible') reg.update().catch(() => undefined);
          });
        })
        .catch((err) => console.warn('[SW] registration failed:', err));
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
      <AppWallpaper />
    </ThemeProvider>
    {/*
      Vercel Web Analytics（画面には何も描画されず、計測用スクリプトだけを注入する）
      - Vercel にデプロイされている場合のみデータが収集される
      - 本アプリは URL が変化しない SPA のため、既定ではページビューが常に "/" に集約される
    */}

  </StrictMode>
);
