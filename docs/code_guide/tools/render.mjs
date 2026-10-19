// 図鑑の画像・PDF を作り、ブラウザで動作を確かめる（Playwright）
//   node tools/render.mjs            … poster.png / file-guide.pdf / maps/*.png を作る
//   node tools/render.mjs --check    … 上に加えて interactive.html を 1280px・390px で操作して確かめる
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const G = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORK = path.join(G, '.work');
// playwright は .work/pw にだけ入れる（アプリの依存は増やさない）
const req = createRequire(path.join(WORK, 'pw', 'package.json'));
const { chromium } = req('playwright');
const url = (f) => pathToFileURL(f).href;
const asOf = JSON.parse(fs.readFileSync(path.join(G, 'data', 'stats.json'), 'utf8')).asOf;

const b = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const fail = [];

// 1枚絵
{
  const p = await b.newPage({ viewport: { width: 1800, height: 1200 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await p.goto(url(path.join(WORK, 'poster.html'))); await p.waitForTimeout(800);
  await p.screenshot({ path: path.join(G, 'poster.png'), fullPage: true });
  await p.close(); console.log('poster.png');
}
// 手引き PDF
{
  const p = await b.newPage();
  await p.goto(url(path.join(WORK, 'file-guide.html'))); await p.waitForTimeout(800);
  await p.pdf({ path: path.join(G, 'file-guide.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true,
    displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: `<div style="font-size:8pt;color:#5a6b7e;width:100%;padding:0 13mm;display:flex;justify-content:space-between;font-family:sans-serif"><span>マナトビ リスニング ファイルの手引き（${asOf}）</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>` });
  await p.close(); console.log('file-guide.pdf');
}
// コード地図（.work/maps/*.html → maps/*.png）。箱が減ったときの古い絵は消す
{
  const src = path.join(WORK, 'maps'), dir = path.join(G, 'maps'); fs.mkdirSync(dir, { recursive: true });
  const pages = fs.existsSync(src) ? fs.readdirSync(src).filter((x) => x.endsWith('.html')).sort() : [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.png'))) if (!pages.includes(f.replace(/\.png$/, '.html'))) fs.unlinkSync(path.join(dir, f));
  const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  for (const f of pages) {
    await p.goto(url(path.join(src, f))); await p.waitForTimeout(200);
    await p.screenshot({ path: path.join(dir, f.replace(/\.html$/, '.png')), fullPage: true });
  }
  await p.close(); console.log('maps', pages.length);
}

if (process.argv.includes('--check')) {
  for (const rm of ['no-preference', 'reduce']) for (const [w, h] of [[1280, 800], [390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: rm });
    const p = await ctx.newPage(); const errs = [], ext = [];
    p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    p.on('request', (r) => { if (!/^(file|data):/.test(r.url())) ext.push(r.url()); });
    await p.goto(url(path.join(G, 'interactive.html'))); await p.waitForTimeout(1500);
    await p.locator('.node[data-sys="battle"]:visible').first().click(); await p.waitForTimeout(600);
    const st1 = await p.locator('#status').innerText();
    await p.locator('.node[data-sys="battle"]:visible').first().click();
    await p.fill('#q', '復習'); await p.waitForTimeout(400);
    await p.locator('.item').first().click(); await p.waitForTimeout(600); await p.keyboard.press('Escape');
    await p.fill('#q', ''); await p.locator('.step[data-flow="compete"]').click(); await p.waitForTimeout(400);
    await p.locator('.audience button[data-aud="eng"]').click(); await p.waitForTimeout(400);
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const r = { w, rm, errs: errs.length, ext: ext.length, overflowX: ov, battle: st1 };
    console.log(JSON.stringify(r));
    if (errs.length || ext.length || ov > 0) fail.push(r);
    await ctx.close();
  }
}
await b.close();
if (fail.length) { console.error('NG', JSON.stringify(fail)); process.exit(1); }
