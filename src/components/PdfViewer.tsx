import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Download, Minus, Plus } from 'lucide-react';
import { pdfViewerStore, closePdf, type OpenPdf } from '../utils/pdfViewer';
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
  if (!doc) return null;
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
    setState('loading');
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
        if (n === 1 && !cancelled) setState('ready');
      }
    }).catch(() => { if (!cancelled) setState('error'); });
    // 閉じた後の片付け（destroy）の失敗は表示に関係ないので捨てる
    return () => { cancelled = true; void task?.destroy().catch(() => { /* 片付けの失敗は無視してよい */ }); };
  }, [doc.url, doc.title, zoom]);

  return <div className="pdfv" role="dialog" aria-modal="true" aria-label={`${doc.title}（PDF）`} data-pdf-viewer>
    <header className="pdfv-bar">
      <button type="button" className="pdfv-back" onClick={closePdf} data-pdf-close autoFocus><ChevronLeft size={18} aria-hidden="true" />もどる</button>
      <p className="pdfv-title"><strong>{doc.title}</strong>{pageCount > 0 && <small>{pageCount}ページ</small>}</p>
      <div className="pdfv-tools">
        <button type="button" aria-label="小さくする" disabled={zoom <= 1} onClick={() => setZoom(z => Math.max(1, z - 0.5))}><Minus size={18} aria-hidden="true" /></button>
        <button type="button" aria-label="大きくする" disabled={zoom >= 2.5} onClick={() => setZoom(z => Math.min(2.5, z + 0.5))}><Plus size={18} aria-hidden="true" /></button>
        <a href={doc.url} download={doc.fileName} aria-label="この PDF を保存する"><Download size={18} aria-hidden="true" /><span>保存</span></a>
      </div>
    </header>
    <div className="pdfv-scroll" data-zoom={zoom > 1 || undefined}>
      {state === 'loading' && <p className="pdfv-status" role="status">PDF を開いています…</p>}
      {state === 'error' && <div className="pdfv-status" role="alert">
        <p>PDF を表示できませんでした。接続を確認して、もう一度開いてください。</p>
        <button type="button" onClick={closePdf}>もどる</button>
      </div>}
      <div className="pdfv-pages" ref={pagesRef} />
    </div>
  </div>;
}
