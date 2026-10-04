// 宣伝用の単独ページ「学びの扉」（/message）— 2026-10-05
// アプリ本体（Firebase・BGM・ガチャなど）は読み込まず、理念ページだけを表示する。
// 中身はアプリ内と同じ PhilosophyPage を使うので、文章や見た目を直すと両方に反映される。
import './utils/polyfills';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PhilosophyPage } from './components/PhilosophyPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PhilosophyPage standalone onBack={() => { window.location.href = '/'; }} backLabel="マナトビを開く" />
  </StrictMode>,
);
