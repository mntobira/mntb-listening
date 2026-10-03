// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppWallpaper } from './components/AppWallpaper';
import { installChunkRecovery } from './utils/chunkRecovery';

installChunkRecovery();

// PWA Service Worker 登録（パート8で sw.js を用意）
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        // 画面を開いたまま新しい版が出たときも、戻ってきたときに更新を確認する
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') reg.update().catch(() => undefined);
        });
      })
      .catch((err) => console.warn('[SW] registration failed:', err));
  });
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
