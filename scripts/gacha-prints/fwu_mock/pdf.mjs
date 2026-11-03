// HTML → A4 PDF（Chromium）。render.py から呼ぶ：node pdf.mjs <in.html> <out.pdf> <ヘッダーの文字>
// Playwright は、入っていればそれを使い、無ければコード図鑑の道具置き場（docs/code_guide/.work/pw。update.sh が入れる）を使う。
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
let pw;
try {
  pw = createRequire(import.meta.url)('playwright');
} catch {
  pw = createRequire(path.join(root, 'docs/code_guide/.work/pw/package.json'))('playwright');
}

const [, , htmlPath, pdfPath, label = ''] = process.argv;
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
const browser = await pw.chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: `<div style="font-size:7px;width:100%;text-align:right;padding:0 16mm;color:#555;font-family:'Noto Sans CJK JP',sans-serif">${esc(label)}</div>`,
  footerTemplate: `<div style="font-size:8px;width:100%;text-align:center;color:#333;font-family:'Noto Serif CJK JP',serif">— <span class="pageNumber"></span> —</div>`,
  margin: { top: '17mm', bottom: '17mm', left: '16mm', right: '16mm' },
});
await browser.close();
