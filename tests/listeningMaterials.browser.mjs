// Run against Vite: TMPDIR=$PWD/.tmpwork node tests/listeningMaterials.browser.mjs
// Mount the real Quiz with the real dataset; no test-only application route is needed.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ headless: true });
let checks = 0;
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.QUIZ_TEST_URL || 'http://localhost:3000');
  await page.evaluate(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const dom = await import('/node_modules/.vite/deps/react-dom_client.js');
    const { Quiz } = await import('/src/components/Quiz.tsx');
    const data = await import('/src/data/englishListeningQ4to6Problems.ts');
    document.getElementById('root').style.display = 'none';
    const host = document.createElement('div'); document.body.append(host);
    const createRoot = dom.createRoot || dom.default.createRoot;
    window.mountListening = (name, index = 0, step = 0) => {
      window.quizRoot?.unmount();
      localStorage.clear();
      localStorage.setItem('quiz_step_materialqa_practice', String(step));
      window.quizRoot = createRoot(host);
      window.quizRoot.render(React.createElement(Quiz, {
        chapter: { id: 'materialqa', title: name, practiceProblems: [data[name][index]] },
        mode: 'practice', isGuest: true, onFinish: () => {}, onBack: () => {},
      }));
    };
    window.listeningCases = Object.entries(data).filter(([name]) => name.endsWith('_PROBLEMS'))
      .flatMap(([name, problems]) => problems.flatMap((problem, index) =>
        problem.audioTracks.map((_, step) => ({ name, index, step }))));
  });
  const mount = async (name, index = 0, step = 0) => {
    await page.evaluate(args => window.mountListening(...args), [name, index, step]);
    // Briefing is set by an effect after the first render; wait for it to settle.
    await page.waitForTimeout(200);
    const start = page.getByRole('button', { name: '問題をはじめる', exact: true });
    if (await start.count()) await start.click();
    try {
      await page.locator('[data-listening-material-pane]').waitFor({ timeout: 5000 });
    } catch (error) {
      console.error({ name, index, step, errors, body: (await page.locator('body').innerText()).slice(0, 1000) });
      throw error;
    }
  };
  const check = async label => {
    const result = await page.evaluate(() => {
      const material = document.querySelector('[data-listening-material-pane]');
      const answer = document.querySelector('[data-listening-answer-pane]');
      const scroll = document.querySelector('[aria-label="資料をスクロール"]');
      const audio = document.querySelector('[data-listening-audio]');
      const m = material.getBoundingClientRect(), a = answer.getBoundingClientRect(), u = audio.getBoundingClientRect();
      return { materialHeight: m.height, answerHeight: a.height, readableHeight: scroll.clientHeight,
        overlap: m.bottom - a.top, answerBottom: a.bottom, viewport: innerHeight,
        audioVisible: u.top >= m.top && u.bottom <= m.bottom,
        textSize: parseFloat(getComputedStyle(document.querySelector('[data-listening-material]')).fontSize),
        overflow: document.documentElement.scrollWidth > innerWidth,
        options: [...answer.querySelectorAll('button[aria-pressed]')].map(b => b.getBoundingClientRect().height) };
    });
    assert.ok(result.readableHeight >= 100, `${label}: readable material area ${JSON.stringify(result)}`);
    assert.ok(result.answerHeight >= 170, `${label}: answer area`);
    assert.ok(Math.abs(result.overlap) <= 1 && result.audioVisible, `${label}: overlap or hidden audio`);
    assert.ok(result.answerBottom <= result.viewport - 65, `${label}: footer overlap`);
    assert.ok(result.textSize >= 16 && !result.overflow, `${label}: text size/overflow`);
    assert.ok(result.options.length >= 4 && result.options.every(h => h >= 44), `${label}: tap targets`);
    // Every choice must be reachable without scrolling/collapsing the material panel.
    const options = page.locator('[data-listening-answer-pane] button[aria-pressed]');
    const first = await page.locator('[data-listening-material-pane]').boundingBox();
    await options.last().scrollIntoViewIfNeeded();
    const last = await options.last().boundingBox();
    assert.ok(last.y + last.height <= result.answerBottom + 1, `${label}: last option unreachable`);
    assert.deepEqual(await page.locator('[data-listening-material-pane]').boundingBox(), first);
    checks++;
  };
  const cases = await page.evaluate(() => window.listeningCases);
  assert.equal(cases.length, 120);
  for (const c of cases) { await mount(c.name, c.index, c.step); await check(JSON.stringify(c)); }
  for (const viewport of [{ width: 360, height: 640 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(viewport);
    for (const c of cases.filter(c => c.index === 0)) { await mount(c.name, c.index, c.step); await check(JSON.stringify({ ...c, viewport })); }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await mount('EL5_PROBLEMS');
  await page.locator('[data-listening-audio] button').first().click();
  await page.waitForFunction(() => document.querySelector('[data-listening-audio] audio')?.currentTime > 0.1);
  await page.evaluate(() => { window.originalAudio = document.querySelector('[data-listening-audio] audio'); window.audioTime = window.originalAudio.currentTime; });
  const next = page.getByRole('button', { name: '次の解答欄へ', exact: true });
  for (let n = 28; n <= 31; n++) {
    await next.click();
    assert.equal(await page.locator('[data-material-blank][aria-current="true"]').getAttribute('data-material-blank'), String(n));
    assert.ok(await page.locator('[data-material-blank][aria-current="true"]').evaluate(e => {
      const r = e.getBoundingClientRect(), p = e.closest('[aria-label="資料をスクロール"]').getBoundingClientRect();
      return r.top >= p.top && r.bottom <= p.bottom;
    }));
    await page.locator('[data-listening-answer-pane] button[aria-pressed]').first().click();
  }
  assert.ok(await page.evaluate(() => window.originalAudio === document.querySelector('[data-listening-audio] audio') && !window.originalAudio.paused && window.originalAudio.currentTime >= window.audioTime));
  await page.getByRole('button', { name: '全画面で読む', exact: true }).click();
  assert.equal(await page.locator('[data-listening-answer-pane]').count(), 0);
  await page.getByRole('button', { name: '選択肢に戻る', exact: true }).click();
  assert.ok(await page.evaluate(() => window.originalAudio === document.querySelector('[data-listening-audio] audio') && !window.originalAudio.paused));
  await page.evaluate(() => { window.originalAudio.currentTime = window.originalAudio.duration - 0.1; });
  await page.waitForFunction(() => document.querySelector('[data-listening-audio] button')?.disabled);
  await page.getByRole('button', { name: '前の解答欄へ', exact: true }).click();
  assert.equal(await page.locator('[data-listening-audio] button').first().isDisabled(), true);
  await mount('EL6_B_PROBLEMS');
  await next.click();
  assert.equal(await page.locator('[data-listening-answer-pane] img').count(), 0);
  assert.equal(await page.locator('[data-material-graph] img').count(), 4);
  // 2026-10-21：グラフ4枚はスクロールせずに資料欄へ収まる
  assert.ok(await page.locator('[data-material-figure-tap]').evaluateAll(list => list.every(e => {
    const r = e.getBoundingClientRect(), p = e.closest('[aria-label="資料をスクロール"]').getBoundingClientRect();
    return r.top >= p.top - 1 && r.bottom <= p.bottom + 1 && r.width > 100;
  })));
  await page.setViewportSize({ width: 1280, height: 800 });
  await mount('EL5_PROBLEMS');
  assert.equal(await page.locator('[data-listening-answer-pane]').count(), 0);
  assert.equal(await page.locator('[data-material-blank]').count(), 5);
  assert.ok((await page.locator('[data-listening-material-pane]').boundingBox()).width > 600);
  assert.deepEqual(errors, []);
  console.log(`PASS: ${checks} full-Quiz mobile layouts; shared MP3 playback, worksheet paging, play-once lock, fullscreen and desktop.`);
} finally { await browser.close(); }
