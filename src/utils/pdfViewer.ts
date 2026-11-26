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
/** 「もどる」で自分から閉じたあと、積んだ履歴を戻すときの popstate を1回だけ無視する */
let skipPop = 0;

function emit() { listeners.forEach(l => l(current)); }

function installPop() {
  if (popInstalled || typeof window === 'undefined') return;
  popInstalled = true;
  window.addEventListener('popstate', () => {
    if (skipPop > 0) { skipPop--; return; }
    // 戻る操作で PDF の履歴から離れた → 閉じる（履歴はもう戻っているので触らない）
    if (current && !(history.state && history.state[MARK])) { current = null; emit(); }
  });
}

export const pdfViewerStore = {
  get: () => current,
  subscribe(l: Listener) { listeners.add(l); return () => { listeners.delete(l); }; },
};

/** 同一オリジン内の安全な相対 PDF パスか判定する（`//` プロトコル相対・`..`・制御文字を拒否） */
export function isSafeSameOriginPdfPath(path: string | null | undefined): boolean {
  if (!path || typeof path !== 'string' || path.length > 512) return false;
  if (!path.startsWith('/') || path.startsWith('//')) return false;
  if (/[\u0000-\u001F\u007F\\]|\.\./.test(path)) return false;
  return /\.pdf$/i.test(path);
}

/** 同じサイト内の PDF だけ開く（外のサイトは開かない） */
export function openPdf(url: string, title: string, fileName?: string): void {
  if (typeof window === 'undefined') return;
  let safe: URL;
  try { safe = new URL(url, window.location.href); } catch { return; }
  if (safe.origin !== window.location.origin || !isSafeSameOriginPdfPath(safe.pathname)) return;
  trackEvent('pdf_open');
  installPop();
  const safeBase = (fileName ?? `${title}.pdf`).replace(/[\u0000-\u001F\u007F\\/:*?"<>|\s]+/g, '_').replace(/^\.+/, '');
  const name = /\.pdf$/i.test(safeBase) ? safeBase : `${safeBase || 'document'}.pdf`;
  const wasOpen = !!current;
  current = { url: safe.pathname, title, fileName: name };
  try {
    if (!wasOpen) history.pushState({ ...(history.state ?? {}), [MARK]: true }, '');
  } catch { /* 履歴に積めなくても、もどるボタン・Esc で閉じられる */ }
  emit();
}

/**
 * 閉じる（「もどる」ボタン・Esc）。2026-10-21：読み込み中でも必ずすぐ閉じる。
 *   以前は history.back() → popstate を待って閉じていたが、アプリ（iOS の WebView）では
 *   popstate が来ないことがあり「読み込み中のまま戻れない」になっていた。先に閉じてから履歴をそろえる。
 */
export function closePdf(): void {
  if (!current) return;
  current = null; emit();
  if (typeof window !== 'undefined' && history.state && history.state[MARK]) {
    try { skipPop++; history.back(); setTimeout(() => { skipPop = 0; }, 1000); } catch { skipPop = 0; }
  }
}

/** テスト用 */
export function __resetPdfViewer(): void { current = null; listeners.clear(); popInstalled = false; skipPop = 0; }
