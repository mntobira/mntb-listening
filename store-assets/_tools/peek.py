# 下見用：主要画面をスマホ実寸で撮る（python3 store-assets/_tools/peek.py OUT KEY...）
import asyncio, sys, os
from playwright.async_api import async_playwright
OUT=sys.argv[1]; KEYS=sys.argv[2:]; os.makedirs(OUT, exist_ok=True)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--disable-dev-shm-usage','--disable-gpu','--mute-audio','--renderer-process-limit=1'])
    for key in KEYS:
      ctx=await b.new_context(viewport={'width':430,'height':932}, device_scale_factor=1, is_mobile=True, has_touch=True, reduced_motion='reduce')
      pg=await ctx.new_page(); pg.set_default_timeout(120000)
      await pg.goto('http://localhost:5173/?no_ads=1&screenshot=1', wait_until='domcontentloaded', timeout=240000)
      await pg.wait_for_function('!!window.__ENTER_APP__', timeout=240000)
      await pg.evaluate("window.__ENTER_APP__()"); await pg.wait_for_timeout(1500)
      if key.startswith('quiz_'): await pg.evaluate(f"window.__SELECT_CHAPTER__('{key[5:]}',0)")
      elif key.startswith('expl_'):
        await pg.evaluate(f"window.__SELECT_CHAPTER__('{key[5:]}',0)"); await pg.wait_for_timeout(2500); await pg.evaluate("window.__SET_APP_STATE__('explanation')")
      elif key.startswith('growth:'):
        await pg.evaluate("window.__SET_APP_STATE__('growth')"); await pg.wait_for_timeout(800); await pg.evaluate(f"window.__SET_GROWTH_PAGE__('{key[7:]}')")
      elif key.startswith('chapters:'):
        await pg.evaluate(f"localStorage.setItem('savedSelectedSubject','{key[9:]}')"); await pg.evaluate("window.__SET_APP_STATE__('chapters')")
      elif key!='home': await pg.evaluate(f"window.__SET_APP_STATE__('{key}')")
      await pg.wait_for_timeout(2500)
      await pg.screenshot(path=f"{OUT}/{key.replace(':','-')}.png")
      print('ok', key, flush=True)
      await ctx.close()
    await b.close()
asyncio.run(main())
