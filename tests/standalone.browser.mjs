const { chromium } = await import('playwright').catch(()=>import('../.tmp_ui/node_modules/playwright/index.mjs'));
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
  await page.locator('.launch-start').click();await page.locator('.launch-announcement-actions').getByRole('button',{name:'閉じる',exact:true}).click();await page.locator('.game-home').waitFor();
  for(const [width,height] of [[320,568],[390,844],[1280,900]]) {
    await page.setViewportSize({width,height});
    // 1画面ホーム（B1）。3本柱：演習する／対戦する（同じ大きさ）＋横長の復習ノート
    assert.equal(await page.locator('select[aria-label="学習する科目"]').count(),0);
    assert.equal(await page.locator('[data-home-practice]').count(),1);
    assert.equal(await page.locator('[data-home-battle]').count(),1);
    assert.equal(await page.locator('[data-home-review]').count(),1);
    assert.equal(await page.locator('[data-home-foundation]').count(),0);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2),'home fits one screen at '+width+'x'+height);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.getByRole('button',{name:'まとめプリント',exact:true}).count(),0);
  // 演習する → （科目は英語だけなので科目選択は出さない 2026-10-01）コンテンツ → 英単語は下のナビを残した1画面のページ。
  await page.locator('[data-home-practice]').click();
  await page.locator('[data-study-catalog=contents]').waitFor();
  assert.equal(await page.locator('[data-study-catalog=subjects]').count(),0,'no subject picker when English is the only subject');
  assert.equal(await page.locator('[data-study-card=english_listening_grammar]').count(),0,'listening grammar is removed');
  assert.ok(await page.locator('[data-study-card=english_vocab_quiz]').count()===1,'vocabulary can be solved as 4-choice questions');
  assert.ok(await page.locator('[data-study-card]').count()>=4,'english has its contents as shared cards');
  await page.locator('[data-study-card=english_vocabulary]').click();
  await page.locator('[data-foundation]').waitFor();
  assert.equal(await page.locator('.app-bottom-nav').isVisible(),true,'foundation page keeps the bottom nav');
  // 2026-10-01 夜：暗記帳は単語の中のタブで分けず別ページ（「覚える」枠）。問題（4択）は単元と同じ列。
  assert.equal(await page.locator('.fd-tabs').count(),0,'wordbook page has no tabs');
  await page.locator('.fd-word').nth(2).waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2),'foundation fits one screen');
  await page.locator('.fd-back').click();
  await page.locator('[data-study-section=memorize]').waitFor();
  await page.locator('[data-study-card=english_listening]').click();
  await page.getByRole('button',{name:/第1回演習/}).first().waitFor();
  await page.getByRole('button',{name:/第1回演習/}).first().click();
  await page.waitForTimeout(500);
  const briefing=page.getByRole('button',{name:'問題をはじめる',exact:true});
  if(await briefing.count())await briefing.click();
  await page.locator('audio[src*="listening"]').first().waitFor({state:'attached'});
  // Quiz deliberately hides the main navigation. Reload the seeded home for the battle scenario.
  await page.goto(url);await page.locator('.launch-start').click();await page.locator('.launch-announcement-actions').getByRole('button',{name:'閉じる',exact:true}).click();await page.locator('.game-home').waitFor();
  await page.getByRole('button',{name:'オンライン対戦へ移動',exact:true}).click();
  await page.getByRole('button',{name:'AIと対戦する',exact:true}).click();
  const listening=page.getByRole('button',{name:/英語リスニング/});
  await listening.waitFor();
  // 対戦の科目は英語3つ（リスニング・英文法・英単語／英熟語）。英単語は対戦で残す（2026-09-30 決定）。
  // 統合版の科目（化学基礎・地理など）は出さない。
  assert.equal(await page.getByRole('button',{name:/化学基礎|地理総合|生物基礎|数学/}).count(),0);
  assert.ok(await page.getByRole('button',{name:/英単語・英熟語/}).count()>=1,'英単語・英熟語 is kept as a battle subject');
  assert.ok(await page.getByRole('button',{name:/英文法/}).count()>=1,'英文法 is a battle subject');
  await listening.click();await page.locator('[data-battle-unit="all"]').click();
  await page.locator('#battle-ai-easy').click();
  await page.getByRole('button',{name:'はじめる',exact:true}).click();
  await page.locator('.battle-listening-audio audio').waitFor({state:'attached',timeout:20000});
  assert.equal(await page.locator('[data-listening-evidence]').count(),0);
  await page.waitForFunction(()=>document.querySelector('.battle-listening-audio audio')?.currentTime>.1);
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  console.log('PASS: listening-only home, foreign subject fallback, 3 viewports, practice entry, AI battle and actual audio playback; no page errors or missing assets.');
} finally {await browser.close();}
