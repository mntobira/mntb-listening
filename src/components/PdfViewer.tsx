import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Download, Minus, Plus, Printer, RotateCw } from 'lucide-react';
import { pdfViewerStore, closePdf, isSafeSameOriginPdfPath, type OpenPdf } from '../utils/pdfViewer';
import { isNativeApp, printPdf, savePdf } from '../utils/pdfShare';
import './pdf-viewer.css';

/**
 * アプリの中で PDF を見る画面（2026-10-17）。
 *
 * ■ なぜ作ったか（ご指摘「PDF 開いたら元に戻れない」「PDF 開いた時に広告が出る」）
 *   以前は <a href=… target="_blank"> で開いていた。アプリ（Capacitor）ではこれが
 *     ・同じ WebView のまま PDF のページへ移ってしまい、アプリの画面（戻るボタン・下のナビ）が消える
 *     ・下のバナー広告（ネイティブの部品）だけが PDF の上に残る
 *   という状態になり、戻る手段がなかった。
 *   そこで、PDF はアプリの中の全画面ビューで描く（pdf.js でページを画像にする）。
 *     ・左上の「‹ もどる」、Android の戻るボタン、ブラウザの戻る、Esc のどれでも閉じる
 *     ・開いている間は広告を出さない（AdBannerSlot が 'pdf' の画面として隠す）
 *     ・保存したい人には「保存」ボタン（ダウンロード）
 */
export function PdfViewerHost() {
  const [doc, setDoc] = useState<OpenPdf | null>(pdfViewerStore.get());
  useEffect(() => pdfViewerStore.subscribe(setDoc), []);
  if (!doc || !isSafeSameOriginPdfPath(doc.url)) return null;
  return <PdfViewer key={doc.url} doc={doc} />;
}

type PdfJs = typeof import('pdfjs-dist');
let pdfjsPromise: Promise<PdfJs> | null = null;
/** pdf.js は PDF を開いた時だけ読み込む（最初の起動を重くしない） */
function loadPdfJs(): Promise<PdfJs> {
  pdfjsPromise ??= Promise.all([
    import('pdfjs-dist/legacy/build/pdf.min.mjs') as unknown as Promise<PdfJs>,
    import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
  ]).then(([lib, worker]) => {
    lib.GlobalWorkerOptions.workerSrc = (worker as { default: string }).default;
    return lib;
  }).catch(e => { pdfjsPromise = null; throw e; });
  return pdfjsPromise;
}

function PdfViewer({ doc }: { doc: OpenPdf } & React.Attributes) {
  const pagesRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [pageCount, setPageCount] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [fallback, setFallback] = useState(!isNativeApp());
  const [busy, setBusy] = useState<'' | 'print' | 'save'>('');
  const [note, setNote] = useState('');

  // Esc で閉じる
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); closePdf(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 描画（幅に合わせて、端末の画素密度まで。拡大を変えたら描き直す）
  useEffect(() => {
    let cancelled = false;
    let task: { destroy: () => Promise<void> } | null = null;
    const box = pagesRef.current;
    if (!box) return;
    box.replaceChildren();
    if (!isNativeApp()) {
      // Webではpdf.jsのworkerで止まる環境があるため、最初からブラウザ標準ビューアーを使う。
      setFallback(true);
      setState('ready');
      return () => { cancelled = true; };
    }
    setState('loading');
    setFallback(false);
    // pdf.js が一部のブラウザ環境で停止しても、標準PDFビューアーへ切り替えて
    // 「PDFを開いています…」のままにならないようにする。
    let shown = false;
    const watchdog = window.setTimeout(() => {
      if (cancelled || shown) return;
      cancelled = true; void task?.destroy().catch(() => { /* 片付けの失敗は無視 */ });
      setFallback(true);
      setState('ready');
    }, 8000);
    loadPdfJs().then(async lib => {
      // 1ファイル 1MB 以下なので分割読み込みはしない（アプリの WebView の Range 応答に頼らない）
      const loading = lib.getDocument({ url: doc.url, isEvalSupported: false, disableRange: true, disableStream: true });
      task = loading;
      const pdf = await loading.promise;
      if (cancelled) return;
      setPageCount(pdf.numPages);
      const width = Math.min(box.clientWidth || window.innerWidth, 900) * zoom;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n);
        if (cancelled) return;
        const base = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: (width / base.width) * dpr });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(vp.width); canvas.height = Math.floor(vp.height);
        canvas.style.width = `${Math.floor(vp.width / dpr)}px`;
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', `${doc.title} ${n}ページ目`);
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        box.appendChild(canvas);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        if (n === 1 && !cancelled) { shown = true; window.clearTimeout(watchdog); setState('ready'); }
      }
    }).catch(() => { window.clearTimeout(watchdog); if (!cancelled) { pdfjsPromise = null; setState('error'); } });
    // 閉じた後の片付け（destroy）の失敗は表示に関係ないので捨てる
    return () => { cancelled = true; window.clearTimeout(watchdog); void task?.destroy().catch(() => { /* 片付けの失敗は無視してよい */ }); };
  }, [doc.url, doc.title, zoom, attempt]);

  const run = (kind: 'print' | 'save') => {
    if (busy) return;
    setBusy(kind); setNote('');
    (kind === 'print' ? printPdf(doc.url, doc.fileName, doc.title) : savePdf(doc.url, doc.fileName, doc.title))
      .then(msg => { if (msg) setNote(msg); })
      .catch(() => setNote(kind === 'print' ? '印刷を始められませんでした。もう一度お試しください。' : '保存できませんでした。もう一度お試しください。'))
      .finally(() => setBusy(''));
  };

  return <div className="pdfv" role="dialog" aria-modal="true" aria-label={`${doc.title}（PDF）`} data-pdf-viewer>
    <header className="pdfv-bar">
      <button type="button" className="pdfv-back" onClick={closePdf} data-pdf-close autoFocus><ChevronLeft size={18} aria-hidden="true" />もどる</button>
      <p className="pdfv-title"><strong>{doc.title}</strong>{pageCount > 0 && <small>{pageCount}ページ</small>}</p>
      <div className="pdfv-tools">
        <button type="button" aria-label="小さくする" disabled={zoom <= 1} onClick={() => setZoom(z => Math.max(1, z - 0.5))}><Minus size={18} aria-hidden="true" /></button>
        <button type="button" aria-label="大きくする" disabled={zoom >= 2.5} onClick={() => setZoom(z => Math.min(2.5, z + 0.5))}><Plus size={18} aria-hidden="true" /></button>
        <button type="button" aria-label="この PDF を印刷する" data-pdf-print disabled={busy !== ''} onClick={() => run('print')}><Printer size={18} aria-hidden="true" /><span>印刷</span></button>
        <button type="button" aria-label="この PDF を保存する" data-pdf-save disabled={busy !== ''} onClick={() => run('save')}><Download size={18} aria-hidden="true" /><span>保存</span></button>
      </div>
    </header>
    <div className="pdfv-scroll" data-zoom={zoom > 1 || undefined}>
      {note && <p className="pdfv-note" role="status">{note}</p>}
      {state === 'loading' && !fallback && <p className="pdfv-status" role="status">PDF を開いています…{attempt > 0 && <><br /><small>読み込みを再試行しています</small></>}</p>}
      {fallback && <p className="pdfv-note" role="status">ブラウザ標準のPDF表示を使用しています。表示されない場合は <a href={doc.url} target="_blank" rel="noopener noreferrer">PDFを別タブで開く</a> をお試しください。</p>}
      {state === 'error' && <div className="pdfv-status" role="alert">
        <p>PDF を表示できませんでした。接続を確認して、もう一度お試しください。</p>
        <div className="pdfv-status-actions">
          <button type="button" onClick={() => { setState('loading'); setAttempt(a => a + 1); }}><RotateCw size={16} aria-hidden="true" />もう一度</button>
          <button type="button" onClick={closePdf}>もどる</button>
        </div>
      </div>}
      {fallback
        ? <iframe className="pdfv-native" src={doc.url} title={`${doc.title}（PDF）`} />
        : <div className="pdfv-pages" ref={pagesRef} />}
    </div>
  </div>;
}
