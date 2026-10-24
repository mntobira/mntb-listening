# 英単語・英熟語の告知動画用：実際のアプリを操作して録画する（2026-10-24）
#   python3 store-assets/_tools/record_vocab.py <出力dir> [場面名...]
#   REC_DEVICE=pc で PC 版（1920×1080）。既定はスマホ実寸（430×932・2倍密度 → 860×1864）
#
# 場面（1本の道筋：覚える → 演習 → 長文で使う → 対戦）
#   wordbook  英単語帳：目標（共通6〜8割）→ 単語・共通テスト6割〜 → 100語の一覧をめくる → 意味を隠す → ✓ をつける
#   idiom     英単語帳：熟語・共通テスト6割〜 の一覧
#   quiz      英単語・英熟語の4択：10問はじめる → 正解を選び続ける（データから正解を引く）
#   reading   英文解釈：Lv1「The Library Cat」第1段落を読む → 問1 → 正解 → 解説
#   battle    AI と対戦（英単語・英熟語・5問）：カウントダウン → 早押し → 勝利
# ・record_scenes.py と同じ仕組み（CDP の screencast で 2倍密度のコマを時刻つきで保存）。広告なし・ゲスト（個人情報なし）。
import asyncio, base64, json, os, subprocess, sys, time, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
BASE = os.environ.get('APP_URL', 'http://localhost:4175')
DEVICE = os.environ.get('REC_DEVICE', 'phone')
VIEW = {'phone': dict(width=430, height=932, scale=2, mobile=True), 'pc': dict(width=1920, height=1080, scale=1, mobile=False)}[DEVICE]
OUT = sys.argv[1]; ONLY = set(sys.argv[2:]); os.makedirs(OUT, exist_ok=True)
random.seed(7)

# 4択の正解：単語データの「問題（label）→ 正解の文字」
_src = json.load(open(os.path.join(ROOT, 'src/data/listeningVocabularySource.json')))
ANS = {}
for q in _src['questions']: ANS.setdefault(q['label'], set()).add(q['options'][q['answerIndex']])
ANS = {k: sorted(v) for k, v in ANS.items()}

TAP_CSS = """
.__tap{position:fixed;z-index:2147483647;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;
 background:rgba(255,255,255,.55);border:3px solid rgba(34,74,140,.9);pointer-events:none;animation:__tap .55s ease-out forwards}
@keyframes __tap{0%{transform:scale(.4);opacity:1}100%{transform:scale(1.35);opacity:0}}
"""
DEMO_STORAGE = {'hasCompletedOnboarding': 'true', 'savedIsGuest': 'true'}

def now(pg): return round(asyncio.get_event_loop().time() - pg._t0, 3)

async def tap_box(pg, box, pause):
  await pg.evaluate("""([x,y]) => { const d=document.createElement('div'); d.className='__tap'; d.style.left=x+'px'; d.style.top=y+'px';
    document.body.appendChild(d); setTimeout(()=>d.remove(), 700); }""", [box['x'], box['y']])
  await pg.wait_for_timeout(180)
  pg._taps.append(now(pg))
  await pg.mouse.click(box['x'], box['y'])
  await pg.wait_for_timeout(pause)

async def tap(pg, js, pause=900):
  box = await pg.evaluate("""(js) => { const el = (new Function('return ' + js))(); if (!el) return null;
    el.scrollIntoView({block:'nearest'}); const r = el.getBoundingClientRect(); return {x:r.left+r.width/2, y:r.top+r.height/2}; }""", js)
  if not box: raise RuntimeError('not found: ' + js[:120])
  await tap_box(pg, box, pause)

def btn(text, sel='button,[role=tab],[role=radio],a'):
  t = json.dumps(text)
  return f"[...document.querySelectorAll('{sel}')].filter(b=>b.offsetParent&&b.innerText.replace(/\\s+/g,' ').includes({t}))[0]"

async def smooth_scroll(pg, sel, dy, steps=30, wait=25):
  for _ in range(steps):
    await pg.evaluate("([s,d])=>{const e=document.querySelector(s); if(e) e.scrollBy(0,d)}", [sel, dy / steps]); await pg.wait_for_timeout(wait)

async def open_study(pg, item):
  await tap(pg, btn('学習'), 1100)
  await tap(pg, btn(item), 1500)

# ---------------- 場面 ----------------
async def scene_wordbook(pg):
  await open_study(pg, '英単語帳')
  pg._mark = now(pg)
  await pg.wait_for_timeout(600)
  await tap(pg, btn('2次＋追加'), 1100)          # 目標を切り替えると語数が増える（5,713語＝全部）
  await tap(pg, btn('共通6〜8割'), 1000)
  await tap(pg, btn('1,185語'), 1700)            # 単語・共通テスト6割〜
  pg._list = now(pg)
  await smooth_scroll(pg, '.fd-list', 520, 44, 30); await pg.wait_for_timeout(500)
  await smooth_scroll(pg, '.fd-list', -520, 30, 25); await pg.wait_for_timeout(400)
  # 読み上げ（スピーカー）→ 覚えたら ✓
  for i in range(4):
    await tap(pg, f"document.querySelectorAll('.fd-list .fd-mark')[{i}]", 380)
  pg._hide = now(pg)
  await tap(pg, btn('意味', '[role=radio],button'), 1300)   # 意味を隠して自分テスト
  await tap(pg, "document.querySelectorAll('.fd-list .fd-word-main')[5]", 1300)
  await tap(pg, btn('なし', '[role=radio],button'), 900)
  pg._next = now(pg)
  await tap(pg, "document.querySelector('.fd-pager button:last-child')", 1500)  # 次の100語へ
  await pg.wait_for_timeout(500)

async def scene_idiom(pg):
  await open_study(pg, '英単語帳')
  pg._mark = now(pg)
  await tap(pg, btn('1,524語'), 1700)            # 熟語・共通テスト6割〜
  await smooth_scroll(pg, '.fd-list', 600, 50, 30); await pg.wait_for_timeout(900)

PICK_JS = """(ans)=>{
  const label=(document.querySelector('.vq-label')||{}).innerText; if(!label) return -1;
  const ok=ans[label.trim()]||[]; const bs=[...document.querySelectorAll('.vq-options button')];
  return bs.findIndex(b=>ok.includes(b.querySelector('span').innerText.trim())) }"""

async def scene_quiz(pg):
  await open_study(pg, '英単語・英熟語')
  pg._mark = now(pg)
  await pg.wait_for_timeout(700)
  await tap(pg, btn('10問はじめる'), 1300)
  pg._answers = []
  n = int(os.environ.get('QUIZ_N', '6'))
  for k in range(n):
    await pg.wait_for_timeout(700 + random.randint(0, 400))
    i = await pg.evaluate(PICK_JS, ANS)
    if i < 0: i = 0
    pg._answers.append(now(pg) + 0.18)
    await tap(pg, f"document.querySelectorAll('.vq-options button')[{i}]", 900)
    if k < n - 1: await tap(pg, "document.querySelector('.vq-next')", 500)
  await pg.wait_for_timeout(800)

async def scene_reading(pg):
  await open_study(pg, '英文解釈')
  pg._mark = now(pg)
  await pg.wait_for_timeout(600)
  await tap(pg, btn('次の文章を解く'), 1500)
  pg._para = now(pg)
  await pg.wait_for_timeout(4200)                # 第1段落を読む（編集で単語を光らせる）
  if DEVICE == 'phone': await tap(pg, btn('問1へ'), 1400)
  pg._q = now(pg)
  await pg.wait_for_timeout(1200)
  pg._answers = [now(pg) + 0.18]
  await tap(pg, btn('雨の日に自分から入ってきて'), 1500)
  pg._ex = now(pg)
  if DEVICE == 'phone' and await pg.evaluate(f"!!({btn('解説')})"):
    await tap(pg, btn('解説'), 1200)
  await pg.wait_for_timeout(2600)

BATTLE_PICK = """(ans)=>{
  const bs=[...document.querySelectorAll('.grid button')].filter(b=>b.offsetParent&&!b.disabled); if(bs.length<2) return null;
  const txt=document.body.innerText; let best=null;
  for(const [k,v] of Object.entries(ans)){ if(k.length<2) continue; if(!txt.includes(k)) continue;
    const b=bs.find(b=>v.includes(b.innerText.trim())); if(b && (!best||k.length>best[0].length)) best=[k,bs.indexOf(b)]; }
  return best?best[1]:0 }"""

async def scene_battle(pg):
  await tap(pg, btn('対戦'), 1400)
  pg._mark = now(pg)
  await tap(pg, btn('AIと対戦'), 1200)
  await tap(pg, btn('5 さっと'), 800)
  await tap(pg, btn('英単語・英熟語'), 1200)
  await tap(pg, btn('全単元から出題'), 1200)
  await tap(pg, btn('マナボ（受験生）'), 1100)
  await tap(pg, btn('はじめる'), 400)
  pg._start = now(pg)
  await pg.wait_for_timeout(8300)
  pg._answers = []
  for q in range(5):
    for _ in range(40):
      if await pg.evaluate("()=>[...document.querySelectorAll('.grid button')].filter(b=>b.offsetParent&&!b.disabled).length>=2"): break
      await pg.wait_for_timeout(200)
    await pg.wait_for_timeout(1100 + random.randint(0, 600))
    i = await pg.evaluate(BATTLE_PICK, ANS)
    if i is None: break
    pg._answers.append(now(pg) + 0.18)
    await tap(pg, f"[...document.querySelectorAll('.grid button')].filter(b=>b.offsetParent&&!b.disabled)[{i}]", 2400)
  await pg.wait_for_timeout(11000)

SCENES = [('wordbook', scene_wordbook), ('idiom', scene_idiom), ('quiz', scene_quiz), ('reading', scene_reading), ('battle', scene_battle)]

async def record(b, name, fn):
  ctx = await b.new_context(viewport={'width': VIEW['width'], 'height': VIEW['height']}, device_scale_factor=VIEW['scale'],
                            is_mobile=VIEW['mobile'], has_touch=VIEW['mobile'])
  await ctx.add_init_script("try{" + "".join(f"localStorage.setItem({json.dumps(k)},{json.dumps(v)});" for k, v in DEMO_STORAGE.items()) + "}catch(e){}")
  pg = await ctx.new_page(); pg.set_default_timeout(30000)
  await pg.goto(BASE + '/?no_ads=1&screenshot=1', wait_until='domcontentloaded', timeout=240000)
  await pg.wait_for_function('!!window.__ENTER_APP__', timeout=240000)
  await pg.evaluate("window.__ENTER_APP__()"); await pg.add_style_tag(content=TAP_CSS)
  await pg.wait_for_timeout(2200)
  fdir = f'{OUT}/_frames_{name}'; os.makedirs(fdir, exist_ok=True)
  for f in os.listdir(fdir): os.remove(os.path.join(fdir, f))
  stamps = []; cdp = await ctx.new_cdp_session(pg); live = {'on': True}
  async def on_frame(ev):
    if not live['on']: return
    i = len(stamps); stamps.append(ev['metadata']['timestamp'])
    open(f'{fdir}/{i:05d}.jpg', 'wb').write(base64.b64decode(ev['data']))
    try: await cdp.send('Page.screencastFrameAck', {'sessionId': ev['sessionId']})
    except Exception: pass
  cdp.on('Page.screencastFrame', lambda ev: asyncio.ensure_future(on_frame(ev)))
  await cdp.send('Page.startScreencast', {'format': 'jpeg', 'quality': 90, 'everyNthFrame': 1})
  await pg.wait_for_timeout(400)
  pg._t0 = asyncio.get_event_loop().time(); wall0 = time.time(); pg._taps = []
  ok = True
  try: await fn(pg)
  except Exception as e: ok = False; print('FAIL', name, str(e)[:300], flush=True)
  await pg.wait_for_timeout(300)
  end = now(pg); live['on'] = False
  try: await cdp.send('Page.stopScreencast')
  except Exception: pass
  await ctx.close()
  rows = [(st - wall0, f'{fdir}/{i:05d}.jpg') for i, st in enumerate(stamps)]
  before = [r for r in rows if r[0] < 0]
  rows = ([(0.0, before[-1][1])] if before else []) + [r for r in rows if r[0] >= 0]
  lst = f'{OUT}/_frames_{name}.txt'
  with open(lst, 'w') as fh:
    for k, (st, path) in enumerate(rows):
      nxt = rows[k + 1][0] if k + 1 < len(rows) else end
      fh.write(f"file '{os.path.abspath(path)}'\nduration {max(0.001, nxt - st):.4f}\n")
    fh.write(f"file '{os.path.abspath(rows[-1][1])}'\n")
  subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-vf', 'fps=30,format=yuv420p',
                  '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', f'{OUT}/{name}.mp4'], check=True)
  meta = {k[1:]: getattr(pg, k) for k in ('_mark', '_list', '_hide', '_next', '_para', '_q', '_ex', '_start', '_answers') if hasattr(pg, k)}
  meta.update(ok=ok, end=end, taps=pg._taps, frames=len(rows), device=DEVICE, size=[VIEW['width'] * VIEW['scale'], VIEW['height'] * VIEW['scale']])
  json.dump(meta, open(f'{OUT}/{name}.json', 'w'))
  print('rec', name, ok, round(end, 2), len(rows), 'frames', json.dumps(meta)[:300], flush=True)

async def main():
  async with async_playwright() as p:
    b = await p.chromium.launch(args=['--disable-dev-shm-usage', '--disable-gpu', '--mute-audio', '--renderer-process-limit=1',
                                      f'--force-device-scale-factor={VIEW["scale"]}'])
    for name, fn in SCENES:
      if ONLY and name not in ONLY: continue
      await record(b, name, fn)
    await b.close()

asyncio.run(main())
