import assert from 'node:assert/strict';
const { chromium } = await import('playwright').catch(() => import('../.tmp_ui/node_modules/playwright/index.mjs'));
const base = process.env.REVISION_TEST_URL || 'http://127.0.0.1:3000';
const browser = await chromium.launch();
const sizes = [[320,568],[375,667],[390,844],[1280,800]];
const errors = [];
async function open(width, height) {
  const context = await browser.newContext({ viewport: { width, height } });
  await context.addInitScript(() => { localStorage.setItem('savedAppState','home'); localStorage.setItem('savedIsGuest','true'); });
  const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
  await page.goto(base); await page.locator('.launch-start').click({ timeout: 120000 }); await page.locator('.game-home').waitFor();
  await page.evaluate(async () => {
    const { emptyProgress, ITEMS } = await import('/src/battle/core/growth.ts');
    const p = emptyProgress('guest'); p.coins = 5000; p.owned.push(ITEMS.find(i=>i.kind==='print').id);
    localStorage.setItem('battle_growth_local_v1_guest', JSON.stringify({version:1,progress:p,receipts:[],day:''}));
  });
  return { context, page };
}
async function measure(page, name, root) {
  await page.waitForTimeout(300);
  const result = await page.evaluate(selector => {
    const d = document.scrollingElement;
    const visible = [...document.querySelector(selector).querySelectorAll('*')].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden');
    return { docOverflow: d.scrollHeight-d.clientHeight, horizontal: d.scrollWidth-d.clientWidth,
      smallText: visible.filter(e => [...e.childNodes].some(n=>n.nodeType===3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize)<12).map(e=>e.textContent.slice(0,40)),
      smallControls: visible.filter(e=>e.matches('button,input,select,a[href]')).filter(e=>{const r=e.getBoundingClientRect();return r.height<43.5||r.width<43.5;}).map(e=>[e.textContent.slice(0,30),Math.round(e.getBoundingClientRect().width),Math.round(e.getBoundingClientRect().height)]) };
  }, root);
  console.log(name, JSON.stringify(result));
  assert.ok(result.docOverflow <= 2, `${name}: document scroll`); assert.ok(result.horizontal <= 2, `${name}: horizontal overflow`);
  assert.deepEqual(result.smallText, [], `${name}: text below 12px`);
  assert.deepEqual(result.smallControls, [], `${name}: controls below 44px`);
}
try {
  for (const [w,h] of sizes) {
    const { context, page } = await open(w,h);
    await page.getByRole('button',{name:'マイページへ移動',exact:true}).click(); await page.locator('[data-mypage]').waitFor();
    await measure(page, `${w}x${h} mypage`, '[data-mypage]');
    await page.locator('.mypage-tabs').getByRole('button',{name:'マイPDF',exact:true}).click();
    await page.locator('.collection-grid a').first().waitFor(); await measure(page, `${w}x${h} PDF`, '[data-mypage]');
    const href = await page.locator('.collection-grid a').first().getAttribute('href');
    const pdf = await context.request.get(new URL(href,base).href); assert.equal(pdf.status(),200); assert.match(pdf.headers()['content-type'],/pdf/);
    await page.locator('.mypage-tabs').getByRole('button',{name:'ショップ',exact:true}).click();
    await measure(page, `${w}x${h} shop`, '[data-mypage]');
    page.once('dialog',d=>d.accept()); await page.locator('.collection-grid button:not([disabled])').first().click();
    await page.getByText('購入して装備しました。',{exact:true}).waitFor();
    await page.getByRole('button',{name:'ガチャ画面へ移動',exact:true}).click();
    await page.getByRole('button',{name:'ランキング',exact:true}).click(); await page.locator('[data-rating-ranking]').waitFor();
    await measure(page, `${w}x${h} ranking`, '[data-rating-ranking]');
    assert.equal(await page.locator('.league-filter option').count(),6);
    await page.screenshot({path:`shots/revision-ranking-${w}.png`});
    await context.close();
  }
  const {context,page} = await open(390,844);
  await page.getByRole('button',{name:'ガチャ画面へ移動',exact:true}).click(); await page.locator('[data-video-gacha]').click();
  await page.getByRole('dialog',{name:'動画を見て1回引く'}).waitFor(); await page.getByRole('button',{name:'閉じる',exact:true}).click();
  assert.match(await page.locator('[data-video-gacha]').innerText(),/あと5/);
  await page.locator('[data-video-gacha]').click(); await page.getByRole('button',{name:'再生／再開',exact:true}).click();
  await page.locator('dialog[aria-label="動画を見て1回引く"]').waitFor({state:'detached',timeout:15000});
  const left = await page.evaluate(async()=>{const m=await import('/src/battle/data/growthStore.ts');return m.videoGachaPlaysLeft();});
  assert.equal(left,4); console.log('video cancel/full-watch: passed');
  await context.close();
  const audioRun = await open(390,844); const ap = audioRun.page;
  // Vite adds HMR timestamps: inspect the exact module used by React, not a second singleton.
  await ap.evaluate(() => { window.__audioModuleUrl = performance.getEntriesByType('resource').find(r=>r.name.includes('/src/battle/audio/battleAudio.ts'))?.name; });
  await ap.getByRole('button',{name:'オンライン対戦へ移動',exact:true}).click();
  await ap.getByRole('button',{name:'AIと対戦する',exact:true}).click();
  await ap.locator('[data-question-count="5"]').click();
  await ap.getByRole('button',{name:/英文法/}).first().click();
  await ap.locator('[data-battle-unit="all"]').click(); await ap.locator('#battle-ai-easy').click();
  await ap.getByRole('button',{name:'はじめる',exact:true}).click();
  const audioState = () => ap.evaluate(async () => {
    const {battleAudio} = await import(window.__audioModuleUrl); const e = battleAudio();
    if(e.fileKey==='battle' && e.fileSource && !window.__battleSource) window.__battleSource=e.fileSource;
    return {track:e.track,key:e.fileKey,running:e.ctx?.state,same:!window.__battleSource||e.fileSource===window.__battleSource,hasSource:!!e.fileSource};
  });
  const phases = new Set(); const deadline = Date.now()+100000;
  while(Date.now()<deadline && !await ap.locator('#battle-outcome-hero').isVisible().catch(()=>false)) {
    const state=await audioState();
    if(state.key==='battle' && state.hasSource) { assert.equal(state.same,true,'battle phases restart source'); phases.add(state.track); }
    const answer=ap.locator('.arena-live-stage button[class*="min-h-[58px]"]:not([disabled])').first();
    if(await answer.count()) await answer.click();
    await ap.waitForTimeout(350);
  }
  await ap.locator('#battle-outcome-hero').waitFor(); await ap.waitForTimeout(500);
  assert.ok(phases.has('normal') && phases.has('closing') && phases.has('final'), `missing phases: ${[...phases]}`);
  assert.deepEqual(await audioState(),{track:'matching',key:'waiting',running:'running',same:false,hasSource:true});
  await ap.evaluate(async()=>{const {battleAudio}=await import(window.__audioModuleUrl);window.__reviewSource=battleAudio().fileSource;});
  await ap.getByRole('button',{name:/復習する|復習リストを見る/}).click(); await ap.waitForTimeout(700);
  assert.equal(await ap.evaluate(async()=>{const {battleAudio}=await import(window.__audioModuleUrl);const e=battleAudio();return e.fileKey==='waiting'&&e.fileSource===window.__reviewSource;}),true,'result/review music continuity');
  await ap.getByRole('button',{name:'ホーム画面へ移動',exact:true}).click(); await ap.waitForTimeout(700);
  assert.equal((await audioState()).hasSource,false,'hidden battle music leaks into home');
  await audioRun.context.close(); console.log('BGM normal/closing/final/result/review/home: passed');
  assert.deepEqual(errors,[]); console.log('Revision browser verification passed.');
} finally { await browser.close(); }
