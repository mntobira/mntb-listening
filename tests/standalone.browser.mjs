import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const url=process.env.PRODUCTION_TEST_URL || 'http://localhost:4173';
const browser=await chromium.launch({args:['--disable-dev-shm-usage']});
try {
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const errors=[];const missing=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(url)&&r.status()===404&&!r.url().endsWith('/sw.js'))missing.push(r.url());});
  await page.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
  await page.addInitScript(()=>{
    localStorage.setItem('savedAppState','home');localStorage.setItem('savedIsGuest','true');
    localStorage.setItem('savedSelectedSubject','math');localStorage.setItem('bgm_enabled','off');
  });
  await page.goto(url);assert.equal(await page.title(),'マナトビ リスニング');
  await page.locator('.launch-start').click();await page.locator('.game-home').waitFor();
  for(const [width,height] of [[320,568],[390,844],[1280,900]]) {
    await page.setViewportSize({width,height});
    // 統合版と同じ1画面ホーム。科目のプルダウンは無く、下の帯に［科目］［英文法・英単語を固める］
    assert.equal(await page.locator('select[aria-label="学習する科目"]').count(),0);
    assert.equal(await page.locator('[data-home-foundation]').count(),1);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2),'home fits one screen at '+width+'x'+height);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.getByRole('button',{name:'まとめプリント',exact:true}).count(),0);
  await page.locator('[data-home-foundation]').click();
  await page.locator('[data-listening-subjects]').waitFor();
  await page.locator('[data-subject-id="english_listening"]').click();
  await page.getByRole('button',{name:/第1回演習/}).first().waitFor();
  await page.getByRole('button',{name:/第1回演習/}).first().click();
  await page.waitForTimeout(500);
  const briefing=page.getByRole('button',{name:'問題をはじめる',exact:true});
  if(await briefing.count())await briefing.click();
  await page.locator('audio[src*="listening"]').first().waitFor({state:'attached'});
  // Quiz deliberately hides the main navigation. Reload the seeded home for the battle scenario.
  await page.goto(url);await page.locator('.launch-start').click();await page.locator('.game-home').waitFor();
  await page.getByRole('button',{name:'オンライン対戦へ移動',exact:true}).click();
  await page.getByRole('button',{name:'AIと対戦する',exact:true}).click();
  const listening=page.getByRole('button',{name:/英語リスニング/});
  await listening.waitFor();
  assert.equal(await page.getByRole('button',{name:/英単語・英熟語|化学基礎|地理総合/}).count(),0);
  await listening.click();await page.locator('[data-battle-unit="all"]').click();
  await page.locator('#battle-ai-easy').click();
  await page.getByRole('button',{name:'はじめる',exact:true}).click();
  await page.locator('.battle-listening-audio audio').waitFor({state:'attached',timeout:20000});
  assert.equal(await page.locator('[data-listening-evidence]').count(),0);
  await page.waitForFunction(()=>document.querySelector('.battle-listening-audio audio')?.currentTime>.1);
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  console.log('PASS: listening-only home, foreign subject fallback, 3 viewports, practice entry, AI battle and actual audio playback; no page errors or missing assets.');
} finally {await browser.close();}
