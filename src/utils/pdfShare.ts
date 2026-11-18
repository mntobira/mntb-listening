import { Capacitor } from '@capacitor/core';
import { closePdf, isSafeSameOriginPdfPath } from './pdfViewer';

/**
 * PDF の印刷・保存（2026-10-21 ご指摘「PDF が印刷できない」）
 *
 * ■ アプリ（iOS / Android）
 *   WebView では window.print() も <a download> も効かない（何も起きない）。
 *   そこで PDF を端末のキャッシュに書き出し、OS の共有シートを開く。
 *   共有シートには「プリント」「"ファイル"に保存」「AirDrop」などが並ぶので、そこから印刷・保存できる。
 * ■ ブラウザ
 *   印刷：PDF画面を離れず、表示中のPDFをブラウザの印刷機能へ送る。
 *   保存：ダウンロード。
 * 戻り値：画面に出す一言（なければ空）
 */
export const isNativeApp = () => Capacitor.isNativePlatform();

async function fetchPdf(url: string): Promise<Blob> {
  if (!isSafeSameOriginPdfPath(url)) throw new Error('unsafe pdf url');
  const r = await fetch(url, { cache: 'force-cache', credentials: 'same-origin' });
  if (!r.ok) throw new Error(`pdf ${r.status}`);
  return r.blob();
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result).replace(/^data:[^,]*,/, ''));
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(blob);
  });
}

/** アプリ：キャッシュに書き出して共有シートを開く */
async function shareNative(url: string, fileName: string, title: string, closeAfter = false): Promise<string> {
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')]);
  const data = await toBase64(await fetchPdf(url));
  const cleanName = fileName.replace(/[\u0000-\u001F\u007F\\/:*?"<>|]+/g, '_').replace(/^\.+/, '') || 'document.pdf';
  const path = `pdf/${cleanName}`;
  const res = await Filesystem.writeFile({ path, data, directory: Directory.Cache, recursive: true });
  try {
    await Share.share({ title, files: [res.uri], dialogTitle: '印刷・保存' });
  } catch (e) {
    // 共有シートを閉じただけ（キャンセル）はエラー扱いにしない
    if (/cancel/i.test(String((e as Error)?.message ?? e))) {
      if (closeAfter) closePdf();
      return '';
    }
    throw e;
  }
  // 共有シートを閉じてアプリに戻ったら、PDF表示を閉じて元の画面へ戻す。
  if (closeAfter) closePdf();
  return '';
}

export async function printPdf(url: string, fileName: string, title: string): Promise<string> {
  if (isNativeApp()) return shareNative(url, fileName, title);
  // 現在のPDFビューを印刷する。別タブへ遷移しないため、印刷後も戻るボタンのある画面に留まれる。
  try {
    window.focus();
    window.print();
    return '';
  } catch {
    return '印刷を開始できませんでした。ブラウザの印刷機能をお試しください。';
  }
}

export async function savePdf(url: string, fileName: string, title: string): Promise<string> {
  if (isNativeApp()) return shareNative(url, fileName, title, true);
  // PDF URLへの通常リンクは一部ブラウザで download 属性が無視され、
  // PDFだけの画面へ遷移してしまう。Blob URLから保存を開始してそれを避ける。
  const blobUrl = URL.createObjectURL(await fetchPdf(url));
  const a = document.createElement('a');
  a.href = blobUrl; a.download = fileName; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  // ダウンロードを開始したあと、PDFビューを閉じて元の画面へ戻す。
  closePdf();
  return '';
}
