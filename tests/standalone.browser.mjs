import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const url = process.env.PRODUCTION_TEST_URL || 'http://localhost:4173';
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const errors = [];
  const missing = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith(url) && response.status() === 404 && !response.url().endsWith('/sw.js')) missing.push(response.url());
  });
  await page.route('**/*', route => route.request().url().startsWith(url) ? route.continue() : route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('savedAppState', 'home');
    localStorage.setItem('savedIsGuest', 'true');
    localStorage.setItem('savedSelectedSubject', 'math'); // A stale integrated-app value must not reopen math.
    localStorage.setItem('bgm_enabled', 'off');
  });

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  assert.equal(await page.title(), 'マナトビ リスニング');
  await page.locator('.launch-start').click();
  await page.locator('[data-listening-home]').waitFor();
  await page.locator('.lh-unit').first().waitFor();
  assert.equal(await page.locator('.lh-unit').count(), 9);
  assert.match(await page.locator('.lh-guest-note').innerText(), /ゲスト体験版/);
  assert.equal(await page.getByRole('button', { name: 'まとめプリント', exact: true }).count(), 0);
  for (const [width, height] of [[320, 568], [390, 844], [1280, 900]]) {
    await page.setViewportSize({ width, height });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `horizontal overflow at ${width}px`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: '音声を試聴する' }).click();
  await page.waitForFunction(() => document.querySelector('.lh-preview-player audio')?.currentTime > 0.1);
  await page.getByRole('button', { name: '大問を選ぶ', exact: true }).click();
  await page.getByRole('button', { name: /第1回演習/ }).first().waitFor();
  await page.getByRole('button', { name: /第1回演習/ }).first().click();
  const briefing = page.getByRole('button', { name: '問題をはじめる', exact: true });
  if (await briefing.count()) await briefing.click();
  await page.locator('audio[src*="listening"]').first().waitFor({ state: 'attached' });

  // Quiz deliberately hides the navigation; reload the saved home for the AI battle.
  await page.goto(url);
  await page.locator('.launch-start').click();
  await page.locator('[data-listening-home]').waitFor();
  await page.getByRole('button', { name: /AI対戦へ移動|オンライン対戦へ移動/ }).click();
  assert.equal(await page.getByRole('button', { name: '相手を見つける' }).count(), 0);
  await page.getByRole('button', { name: 'AIと対戦する', exact: true }).click();
  const listening = page.getByRole('button', { name: /英語リスニング/ });
  await listening.waitFor();
  assert.equal(await page.getByRole('button', { name: /英単語・英熟語|化学基礎|地理総合/ }).count(), 0);
  await listening.click();
  await page.locator('[data-battle-unit="all"]').click();
  await page.locator('#battle-ai-easy').click();
  await page.getByRole('button', { name: 'はじめる', exact: true }).click();
  await page.locator('.battle-listening-audio audio').waitFor({ state: 'attached', timeout: 20000 });
  await page.waitForFunction(() => document.querySelector('.battle-listening-audio audio')?.currentTime > 0.1);
  assert.deepEqual(errors, []);
  assert.deepEqual(missing, []);
  console.log('PASS: guest studio, responsive layout, audio preview, practice and AI listening battle.');
} finally {
  await browser.close();
}
