import { trackEvent } from './analytics';
/**
 * アプリ内の PDF ビューの開け閉め（どの画面からでも openPdf() で開く）。PdfViewer.tsx を参照。
 *
 * ■ 戻るボタンで閉じる
 *   開くときに履歴を1つ積む（history.pushState）。
 *   Android の戻るボタン（Capacitor は WebView の「戻る」を呼ぶ）・ブラウザの戻る・スワイプで戻る
 *   のどれでも popstate が来るので、そこで閉じる。アプリの画面は動かない（元の画面のまま）。
 *   「‹ もどる」ボタン・Esc で閉じたときは、積んだ履歴を自分で1つ戻して数をそろえる。
 */
export interface OpenPdf { url: string; title: string; fileName: string }

type Listener = (doc: OpenPdf | null) => void;
let current: OpenPdf | null = null;
const listeners = new Set<Listener>();
const MARK = '__manatobiPdf';
let popInstalled = false;

function emit() { listeners.forEach(l => l(current)); }

function installPop() {
  if (popInstalled || typeof window === 'undefined') return;
  popInstalled = true;
  window.addEventListener('popstate', () => {
    // 戻る操作で PDF の履歴から離れた → 閉じる（履歴はもう戻っているので触らない）
    if (current && !(history.state && history.state[MARK])) { current = null; emit(); }
  });
}

export const pdfViewerStore = {
  get: () => current,
  subscribe(l: Listener) { listeners.add(l); return () => { listeners.delete(l); }; },
};

/** 同じサイト内の PDF だけ開く（外のサイトは開かない） */
export function openPdf(url: string, title: string, fileName?: string): void {
  if (typeof window === 'undefined') return;
  let safe: URL;
  try { safe = new URL(url, window.location.href); } catch { return; }
  if (safe.origin !== window.location.origin || !/\.pdf$/i.test(safe.pathname)) return;
  trackEvent('pdf_open');
  installPop();
  const name = fileName ?? `${title.replace(/[\\/:*?"<>|\s]+/g, '_')}.pdf`;
  const wasOpen = !!current;
  current = { url: safe.pathname, title, fileName: name };
  try {
    if (!wasOpen) history.pushState({ ...(history.state ?? {}), [MARK]: true }, '');
  } catch { /* 履歴に積めなくても、もどるボタン・Esc で閉じられる */ }
  emit();
}

/** 閉じる（「もどる」ボタン・Esc）。積んだ履歴を1つ戻す → popstate で閉じる */
export function closePdf(): void {
  if (!current) return;
  if (typeof window !== 'undefined' && history.state && history.state[MARK]) {
    try { history.back(); return; } catch { /* 戻れなければ下でそのまま閉じる */ }
  }
  current = null; emit();
}

/** テスト用 */
export function __resetPdfViewer(): void { current = null; listeners.clear(); popInstalled = false; }
