# 画面の中の「文字の位置」（録画の画素）を取る：長文の単語を光らせる場所を決める
#   python3 store-assets/_tools/text_rects.py > store-assets/_footage/vrec_ph/reading_rects.json
#   REC_DEVICE=pc python3 store-assets/_tools/text_rects.py > store-assets/_footage/vrec_pc/reading_rects.json
#   APP_URL（既定 http://localhost:4175）・WORDS（カンマ区切り）・STEPS（押すボタンの文字、カンマ区切り）で変えられる
import asyncio, json, os, sys


from playwright.async_api import async_playwright
DEV = os.environ.get('REC_DEVICE', 'phone')
V = {'phone': dict(width=430, height=932, scale=2, mobile=True), 'pc': dict(width=1920, height=1080, scale=1, mobile=False)}[DEV]
WORDS = os.environ.get('WORDS', 'public,unusual,staff,refused,librarians,did not have the heart to').split(',')
STEPS = os.environ.get('STEPS', '学習,英文解釈,次の文章を解く').split(',')
BASE = os.environ.get('APP_URL', 'http://localhost:4175')
async def main():
  async with async_playwright() as p:
    b = await p.chromium.launch(args=['--disable-dev-shm-usage'])
    ctx = await b.new_context(viewport={'width': V['width'], 'height': V['height']}, device_scale_factor=V['scale'], is_mobile=V['mobile'], has_touch=V['mobile'])
    await ctx.add_init_script("localStorage.setItem('hasCompletedOnboarding','true');localStorage.setItem('savedIsGuest','true');")
    pg = await ctx.new_page()
    await pg.goto(BASE + '/?no_ads=1&screenshot=1', wait_until='domcontentloaded', timeout=120000)
    await pg.wait_for_function('!!window.__ENTER_APP__', timeout=120000); await pg.evaluate("window.__ENTER_APP__()"); await pg.wait_for_timeout(2000)
    for t in STEPS:
      await pg.evaluate("(t)=>[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&b.innerText.includes(t))[0].click()", t); await pg.wait_for_timeout(1500)
    r = await pg.evaluate("""(ws)=>{const out={}; const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
      let n; while(n=walker.nextNode()){ const s=n.textContent; for(const w of ws){ const i=s.indexOf(w); if(i<0||out[w]) continue;
        const rg=document.createRange(); rg.setStart(n,i); rg.setEnd(n,i+w.length); out[w]=[...rg.getClientRects()].map(c=>[c.left,c.top,c.width,c.height]); } } return out}""", WORDS)
    sc = V['scale']; print(json.dumps({k: [[round(x*sc) for x in c] for c in v] for k, v in r.items()}))
    await b.close()
asyncio.run(main())
