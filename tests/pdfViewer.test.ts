import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetPdfViewer, closePdf, openPdf, pdfViewerStore } from '../src/utils/pdfViewer';
import { AD_CONFIG } from '../src/ads/adConfig';

/** history / popstate をまねる（戻るボタン＝history.back で popstate が来る） */
function fakeBrowser() {
  const stack: unknown[] = [null]; let i = 0; const pop: (() => void)[] = [];
  const history = {
    get state() { return stack[i]; },
    pushState(st: unknown) { stack.splice(i + 1); stack.push(st); i++; },
    back() { if (i > 0) { i--; queueMicrotask(() => pop.forEach(f => f())); } },
  };
  const win = { location: { href: 'https://app.example/', origin: 'https://app.example' }, addEventListener: (t: string, f: () => void) => { if (t === 'popstate') pop.push(f); } };
  vi.stubGlobal('history', history); vi.stubGlobal('window', win);
  return { history, depth: () => i };
}

describe('アプリ内の PDF ビュー', () => {
  beforeEach(() => __resetPdfViewer());
  afterEach(() => { vi.unstubAllGlobals(); });

  it('開くと履歴を1つ積み、「もどる」で元の画面に戻る（履歴も元どおり）', async () => {
    const b = fakeBrowser();
    openPdf('/prints/a.pdf', '化学 プリント');
    expect(pdfViewerStore.get()).toMatchObject({ url: '/prints/a.pdf', title: '化学 プリント', fileName: '化学_プリント.pdf' });
    expect(b.depth()).toBe(1);
    closePdf();
    await Promise.resolve();
    expect(pdfViewerStore.get()).toBeNull();
    expect(b.depth()).toBe(0);
  });

  it('Android の戻るボタン（＝履歴を戻る）でも閉じる', async () => {
    const b = fakeBrowser();
    const seen: unknown[] = []; pdfViewerStore.subscribe(d => seen.push(d));
    openPdf('/prints/a.pdf', 'A');
    b.history.back();
    await Promise.resolve();
    expect(pdfViewerStore.get()).toBeNull();
    expect(seen.at(-1)).toBeNull();
  });

  it('外のサイトや PDF 以外は開かない', () => {
    fakeBrowser();
    openPdf('https://evil.example/x.pdf', 'x');
    openPdf('/prints/a.html', 'x');
    expect(pdfViewerStore.get()).toBeNull();
  });

  it('PDF を開いている間はバナー広告を出さない画面として扱う', () => {
    expect(AD_CONFIG.banner.hiddenOn).toContain('pdf');
  });
});
