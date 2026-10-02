import assert from 'node:assert/strict';
const {chromium} = await import('playwright').catch(()=>import('../.tmp_ui/node_modules/playwright/index.mjs'));
const browser = await chromium.launch();
const base = process.env.REVISION_TEST_URL || 'http://127.0.0.1:3000';
const errors = [];
async function open(width,height,mobile=false) {
  const context = await browser.newContext({viewport:{width,height},hasTouch:mobile,isMobile:mobile});
  await context.addInitScript(()=>{
    localStorage.setItem('savedAppState','home');localStorage.setItem('savedIsGuest','true');
    const Native = window.AudioContext;
    window.AudioContext = class extends Native {
      createMediaElementSource(audio) {
        const source=super.createMediaElementSource(audio);const connect=source.connect.bind(source);
        source.connect=(destination,...args)=>{if(audio.src.includes('tanjou')){window.__titleGain=destination;window.__titleContext=this;}return connect(destination,...args);};
        return source;
      }
    };
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:120000});
  await page.locator('.launch-emblem').waitFor({timeout:120000});
  assert.equal(await page.locator('.launch-emblem h1').textContent(),'対戦する力を聞く力へ');
  await page.locator('.launch-start').click();
  await page.locator('.launch-announcement').waitFor();
  assert.match(await page.locator('.launch-countdown').innerText(),/共通テストまで.*日/s);
  await page.getByRole('button',{name:'見てみる',exact:true}).click();
  await page.getByText('音量と学習の入口を整えました',{exact:true}).waitFor();
  await page.getByRole('button',{name:'お知らせを閉じる',exact:true}).click();
  await page.locator('.launch-announcement-actions').getByRole('button',{name:'閉じる',exact:true}).click();
  await page.locator('.game-home').waitFor();
  return {context,page};
}
async function fit(page,selector,name) {
  const result=await page.evaluate(sel=>{
    const root=document.querySelector(sel), d=document.scrollingElement;
    const elements=[...root.querySelectorAll('*')].filter(e=>e.getClientRects().length && getComputedStyle(e).visibility!=='hidden' && !e.closest('details:not([open]) :not(summary)'));
    const text=elements.filter(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&parseFloat(getComputedStyle(e).fontSize)<12).map(e=>e.textContent.slice(0,30));
    const controls=elements.filter(e=>e.matches('button,input,select,a[href]')).filter(e=>{const r=e.getBoundingClientRect();return r.width<43.5||r.height<43.5;}).map(e=>e.textContent.slice(0,30));
    const overlaps=[];const buttons=elements.filter(e=>e.matches('button')&&!e.disabled);
    for(let i=0;i<buttons.length;i++) for(let j=i+1;j<buttons.length;j++) {
      const a=buttons[i].getBoundingClientRect(),b=buttons[j].getBoundingClientRect();
      if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>3 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>3)overlaps.push([buttons[i].textContent,buttons[j].textContent]);
    }
    return {doc:d.scrollHeight-d.clientHeight,horizontal:d.scrollWidth-d.clientWidth,text,controls,overlaps};
  },selector);
  console.log(name,result);assert.ok(result.doc<=2);assert.ok(result.horizontal<=2);assert.deepEqual(result.text,[]);assert.deepEqual(result.controls,[]);assert.deepEqual(result.overlaps,[]);
}
try {
  for(const [w,h] of [[320,568],[375,667],[390,844],[1280,800]]) {
    const {context,page}=await open(w,h);
    await fit(page,'.game-home',`${w} home`);
    const pair=await page.locator('.home-review-rush > button').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right};}));
    assert.equal(pair.length,2);assert.ok(Math.abs(pair[0].top-pair[1].top)<2);assert.ok(pair[0].right<=pair[1].left);
    assert.equal(await page.locator('.game-home-utility > button').count(),3);
    assert.equal(await page.locator('.spin-mascot.tb-idle').count(),0);
    await page.getByRole('button',{name:'ガチャ画面へ移動',exact:true}).click();
    await page.locator('.compact-gacha').waitFor();await fit(page,'.compact-gacha',`${w} gacha`);
    assert.equal(await page.locator('.gacha-my-prints').count(),0);
    assert.equal(await page.locator('[data-gacha-hero]').count(),1,'weekly UR hero must remain');
    assert.equal(await page.locator('[data-gacha-featured-item]').count(),0,'remove only secondary SR/SR/R cards');
    const nav=await page.locator('.app-bottom-nav').boundingBox();
    for(const button of await page.locator('[data-gacha-pulls] button').all()) {
      const limit = nav && nav.height < nav.width ? nav.y : h;
      const r=await button.boundingBox();assert.ok(r && r.y+r.height<=limit+1,'pull controls hidden behind navigation');
    }
    await page.screenshot({path:`shots/d-gacha-${w}.png`});
    assert.equal(await page.locator('[data-gacha-showcase] .gacha-preview-info > span').innerText().then(t=>t.split(' / ')[1].split(' ')[0]),'10','showcase must list 10 curated UR');
    await page.getByRole('button',{name:'マイページへ移動',exact:true}).click();
    await page.locator('[data-mypage-overview]').waitFor();
    await fit(page,'.mypage-hub',`${w} mypage`);
    assert.equal(await page.locator('.mypage-menu').count(),0,'duplicate menu grid removed');
    assert.equal(await page.locator('.mypage-parts [data-part]').count(),7);
    await page.locator('.mypage-parts [data-part=hat]').click();
    assert.equal(await page.locator('.collection-kind select').inputValue(),'hat');
    await page.getByRole('button',{name:'マイページ',exact:true}).click();
    await page.locator('.mypage-more').getByRole('button',{name:'称号'}).click();
    await page.locator('[data-profile-standalone=badges]').waitFor();
    assert.equal(await page.getByText('とびら君のマイページ').count(),0);assert.equal(await page.locator('#battle-shell').count(),0);
    await page.screenshot({path:`shots/d-mypage-badges-${w}.png`});
    await page.getByRole('button',{name:'マイページにもどる'}).click();await page.locator('[data-mypage-overview]').waitFor();
    await page.screenshot({path:`shots/d-mypage-${w}.png`});
    await page.getByRole('button',{name:'オンライン対戦へ移動',exact:true}).click();await page.locator('.arena-menu').waitFor();
    await fit(page,'.arena-menu',`${w} battle`);
    assert.deepEqual(await page.locator('.arena-menu-links button').allTextContents(),['対戦履歴']);
    await page.screenshot({path:`shots/d-battle-${w}.png`});
    await page.getByRole('button',{name:'ホーム画面へ移動',exact:true}).click();
    await page.getByRole('button',{name:'設定画面へ移動',exact:true}).click();
    const slider=page.getByRole('slider',{name:'BGM音量'});await slider.scrollIntoViewIfNeeded();
    assert.equal(await page.getByRole('slider').count(),1,'duplicate volume controls');
    const r=await slider.boundingBox();
    await page.mouse.move(r.x+r.width*.5,r.y+r.height*.5);await page.mouse.down();await page.mouse.move(r.x+r.width*.8,r.y+r.height*.5,{steps:10});await page.mouse.up();
    const value=Number(await slider.inputValue());assert.ok(value>.75 && value<.9,'pointer drag did not move volume');
    await page.waitForTimeout(600);
    const title=await page.evaluate(()=>({gain:window.__titleGain.gain.value,state:window.__titleContext.state,volume:JSON.parse(localStorage.getItem('battle_audio_settings')).volume}));
    const factor=10**((-22+13.4)/20);
    assert.ok(Math.abs(title.gain-value*factor)<1e-7);assert.equal(title.volume,value);assert.equal(title.state,'running');
    await slider.focus();await slider.press('Home');await page.waitForTimeout(600);assert.equal(await page.evaluate(()=>window.__titleGain.gain.value),0);
    await slider.press('End');await slider.press('ArrowLeft');await page.waitForTimeout(600);assert.equal(await slider.inputValue(),'0.99');
    await page.getByRole('button',{name:'オンライン対戦へ移動',exact:true}).click();await page.waitForTimeout(800);
    const engine=await page.evaluate(async()=>{const url=performance.getEntriesByType('resource').find(r=>r.name.includes('/src/battle/audio/battleAudio.ts'))?.name;const {battleAudio}=await import(url);const e=battleAudio();return {volume:e.getSettings().volume,master:e.master.gain.value,track:e.track};});
    assert.equal(engine.volume,.99);assert.ok(Math.abs(engine.master-.99)<1e-6);assert.equal(engine.track,'matching');
    await context.close();
  }
  const {context,page}=await open(390,844,true);
  await page.getByRole('button',{name:'設定画面へ移動',exact:true}).click();
  const slider=page.getByRole('slider',{name:'BGM音量'});await slider.scrollIntoViewIfNeeded();
  const r=await slider.boundingBox(), client=await context.newCDPSession(page);
  const touch=async(type,x)=>client.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y:r.y+r.height/2,id:1}]});
  const from=r.x+11+(r.width-22)*Number(await slider.inputValue()),to=r.x+11+(r.width-22)*.2;
  await touch('touchStart',from);for(let i=1;i<=8;i++)await touch('touchMove',from+(to-from)*i/8);await touch('touchEnd',to);
  await page.waitForTimeout(600);assert.ok(Math.abs(Number(await slider.inputValue())-.2)<.03,'touch drag did not move slider');
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('.launch-start').click();await page.locator('.launch-announcement-actions').getByRole('button',{name:'閉じる',exact:true}).click();
  await page.locator('.game-home').waitFor();await page.getByRole('button',{name:'設定画面へ移動',exact:true}).click();
  await page.getByRole('slider',{name:'BGM音量'}).waitFor();assert.ok(Math.abs(Number(await page.getByRole('slider',{name:'BGM音量'}).inputValue())-.2)<.03,'volume not retained after reload');
  await context.close();assert.deepEqual(errors,[]);console.log('D acceptance passed: startup, notices, four viewports, pointer/touch/keyboard, real gain, shared battle volume, reload.');
} finally {await browser.close();}
