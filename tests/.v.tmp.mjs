const {chromium} = await import('/home/user/webapp/.tmp_ui/node_modules/playwright/index.mjs');
const b=await chromium.launch();
for (const w of [320,390,1280]) {
const c=await b.newContext({viewport:{width:w,height:844},deviceScaleFactor:2});
await c.addInitScript(()=>{localStorage.setItem('savedAppState','home');localStorage.setItem('savedIsGuest','true');});
const p=await c.newPage();
await p.goto('http://127.0.0.1:3000',{waitUntil:'domcontentloaded',timeout:120000});await p.locator('.launch-start').click({timeout:120000});
await p.locator('.launch-announcement-actions').getByRole('button',{name:'閉じる',exact:true}).click();await p.locator('.game-home').waitFor();await p.waitForTimeout(700);
await p.locator('.home-review-rush').screenshot({path:`shots/rr-${w}.png`});
console.log(w, await p.evaluate(()=>[...document.querySelectorAll('.home-review-rush > button')].map(b=>[b.scrollWidth>b.clientWidth, [...b.querySelectorAll('*')].some(e=>{const r=e.getBoundingClientRect(),q=b.getBoundingClientRect();return r.right>q.right+1||r.left<q.left-1})])));
await c.close();}
await b.close();
