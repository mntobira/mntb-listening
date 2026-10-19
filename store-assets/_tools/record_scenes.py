# Instagram 用：実際のアプリを操作している画面を、場面ごとに録画する。
#   python3 store-assets/_tools/record_scenes.py <出力dir> [場面名...]
# ・動画生成AIは使わない。Playwright で本物のアプリ（vite preview のビルド）を操作し、画面をそのまま録る。
# ・スマホ実寸（430×932・2倍密度）／ REC_DEVICE=pc で PC 版（1920×1080）。広告なし（?no_ads=1）・スクショモード（?screenshot=1）。個人情報は映らない（ゲスト）。
# ・タップした場所に丸い印（タップ表示）を出す。これは録画用に一時的に差し込む見た目だけで、アプリのコードは変えない。
import asyncio, base64, json, os, subprocess, sys, random, time
from playwright.async_api import async_playwright

BASE = os.environ.get('APP_URL', 'http://localhost:4173')
# REC_DEVICE=pc で PC 版（1920×1080）。既定はスマホ実寸（430×932・2倍密度 → 860×1864）
DEVICE = os.environ.get('REC_DEVICE', 'phone')
VIEW = {'phone': dict(width=430, height=932, scale=2, mobile=True), 'pc': dict(width=1920, height=1080, scale=1, mobile=False)}[DEVICE]
OUT = sys.argv[1]
ONLY = set(sys.argv[2:])
os.makedirs(OUT, exist_ok=True)
ANSWERS = json.load(open(os.path.join(os.path.dirname(__file__), 'grammar_answers.json')))

TAP_CSS = """
.__tap{position:fixed;z-index:2147483647;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;
 background:rgba(255,255,255,.55);border:3px solid rgba(34,74,140,.9);pointer-events:none;
 animation:__tap .55s ease-out forwards}
@keyframes __tap{0%{transform:scale(.4);opacity:1}100%{transform:scale(1.35);opacity:0}}
"""

# デモ用の進み具合（この録画用ブラウザの中だけ。本番データには触れない）
DEMO_STORAGE = {
  'hasCompletedOnboarding': 'true',
  'savedIsGuest': 'true',   # 「ゲストではじめる」を選んだ状態（実際の利用者と同じ。ログインはしない）
}

async def tap(pg, locator_js, pause=900):
  """画面上の要素を探して、タップ表示を出してから押す"""
  box = await pg.evaluate("""(js) => { const el = (new Function('return ' + js))(); if (!el) return null;
    el.scrollIntoView({block:'nearest'}); const r = el.getBoundingClientRect(); return {x:r.left+r.width/2, y:r.top+r.height/2}; }""", locator_js)
  if not box: raise RuntimeError('not found: ' + locator_js)
  await pg.evaluate("""([x,y]) => { const d=document.createElement('div'); d.className='__tap'; d.style.left=x+'px'; d.style.top=y+'px';
    document.body.appendChild(d); setTimeout(()=>d.remove(), 700); }""", [box['x'], box['y']])
  await pg.wait_for_timeout(180)
  if hasattr(pg, '_t0'): pg._taps.append(round(asyncio.get_event_loop().time() - pg._t0, 3))  # 編集でタップ音を置く時刻
  await pg.mouse.click(box['x'], box['y'])
  await pg.wait_for_timeout(pause)

def btn(text):
  t = json.dumps(text)
  return f"[...document.querySelectorAll('button,[role=tab],a')].filter(b=>b.offsetParent&&b.innerText.replace(/\\s+/g,' ').includes({t}))[0]"

async def smooth_scroll(pg, selector, dy, steps=30, wait=25):
  for _ in range(steps):
    await pg.evaluate("([s,d])=>{const e=document.querySelector(s)||document.scrollingElement; e.scrollBy(0,d)}", [selector, dy/steps])
    await pg.wait_for_timeout(wait)

# ---------------- 場面 ----------------
async def scene_home(pg):
  await pg.wait_for_timeout(3500)

async def scene_practice(pg):
  await pg.wait_for_timeout(900)
  await tap(pg, btn('演習する'), 1300)
  await tap(pg, btn('英語リスニング'), 1600)
  await tap(pg, btn('第1回演習'), 1500)
  await tap(pg, btn('問題をはじめる'), 1500)
  # 再生を押して問題の音声を流す（録画は無音。編集でこの時刻に同じ音源 el1A_set1_q1.mp3 を重ねる）
  pg._play = asyncio.get_event_loop().time() + 0.18
  await tap(pg, "[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&b.innerText.trim()==='再生')[0]", 4300)
  await tap(pg, btn('The speaker does not have'), 1300)
  await tap(pg, btn('解答と解説を見る'), 3800)

async def scene_explain(pg):
  # 解説画面をゆっくり下へ（強弱・和訳・語句）
  await tap(pg, btn('演習する'), 900)
  await tap(pg, btn('英語リスニング'), 1100)
  await tap(pg, btn('第1回演習'), 1100)
  await tap(pg, btn('問題をはじめる'), 1400)
  await tap(pg, btn('The speaker does not have'), 900)
  await tap(pg, btn('解答と解説を見る'), 3200)
  sc = await pg.evaluate("""()=>{const c=[...document.querySelectorAll('*')].filter(e=>{const s=getComputedStyle(e);return (s.overflowY=='auto'||s.overflowY=='scroll')&&e.scrollHeight>e.clientHeight+50&&e.clientHeight>300});
     c.sort((a,b)=>b.clientHeight-a.clientHeight); if(!c[0])return null; c[0].setAttribute('data-rec-scroll','1'); return true}""")
  if sc:
    await smooth_scroll(pg, '[data-rec-scroll]', 420, 40, 30); await pg.wait_for_timeout(1600)
    await smooth_scroll(pg, '[data-rec-scroll]', 420, 40, 30); await pg.wait_for_timeout(1800)

async def scene_review(pg):
  # 本物の流れ：わざと1問まちがえる → 復習ノートに自動で入る（作り物のデータは入れない）
  await tap(pg, btn('演習する'), 700)
  await tap(pg, btn('英語リスニング'), 900)
  await tap(pg, btn('第2回演習'), 900)
  await tap(pg, btn('問題をはじめる'), 1300)
  await tap(pg, "[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&/^[①②③④]/.test(b.innerText.trim()))[3]", 700)
  await tap(pg, btn('解答と解説を見る'), 2400)
  pg._mark = asyncio.get_event_loop().time()   # ここから下を使う（編集で頭を切る）
  await tap(pg, "document.querySelector('[aria-label*=\"ホーム\"],[aria-label*=\"戻る\"]')||" + btn('問題に戻る'), 900)
  await pg.evaluate("window.__SET_APP_STATE__('home')"); await pg.wait_for_timeout(1300)
  await tap(pg, btn('復習ノート'), 2600)
  for t in ['苦手リスト', '今日']:
    await tap(pg, btn(t), 1200)
  await pg.wait_for_timeout(800)

async def scene_battle(pg):
  await tap(pg, btn('対戦する'), 1500)
  await tap(pg, btn('AIと対戦'), 1300)
  await tap(pg, btn('5 さっと'), 900)
  await tap(pg, btn('英文法'), 1300)
  await tap(pg, btn('全単元から出題'), 1300)
  await tap(pg, btn('マナボ（受験生）'), 1300)
  await tap(pg, btn('はじめる'), 500)
  await pg.wait_for_timeout(8500)  # カウントダウン
  for q in range(5):
    # 問題文から正解を引き当てて押す（見つからなければ1つ目）
    for _ in range(30):
      ready = await pg.evaluate("()=>!!document.querySelector('[data-choice-row], .grid button')")
      if ready: break
      await pg.wait_for_timeout(300)
    await pg.wait_for_timeout(1600 + random.randint(0, 900))
    pick = await pick_answer(pg)
    if not pick: break
    await tap(pg, f"[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&b.closest('.grid')&&b.innerText.trim()==={json.dumps(pick)})[0]", 2600)
  await pg.wait_for_timeout(5000)

PICK_JS = """(answers)=>{
  const norm=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
  const btns=[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&b.closest('.grid'));
  if(btns.length<2) return null;
  const key=btns.map(b=>norm(b.innerText)).sort().join('|');
  const body=norm(document.body.innerText);
  const hits=answers.filter(r=>r[1]===key);
  const best=hits.find(r=>r[0].length>8&&body.includes(r[0]))||hits[0];
  const a=best?best[2]:btns[0].innerText.trim();
  return btns.find(b=>b.innerText.trim()===a)?a:btns[0].innerText.trim() }"""

async def pick_answer(pg):
  return await pg.evaluate(PICK_JS, ANSWERS)

async def play_battle(pg, questions=5, think=(1600, 900), after=5000):
  """AI 対戦：はじめる → カウントダウン → 5問とも正解を押す → 結果画面まで"""
  await tap(pg, btn('はじめる'), 500)
  pg._start = asyncio.get_event_loop().time()   # 「はじめる」を押した時刻（START! はこの約7秒後）
  await pg.wait_for_timeout(8500)
  pg._answers = []
  for q in range(questions):
    for _ in range(40):
      if await pg.evaluate("()=>[...document.querySelectorAll('.grid button')].filter(b=>b.offsetParent&&!b.disabled).length>=2"): break
      await pg.wait_for_timeout(250)
    await pg.wait_for_timeout(think[0] + random.randint(0, think[1]))
    pick = await pick_answer(pg)
    if not pick: break
    pg._answers.append(round(asyncio.get_event_loop().time() - pg._t0 + 0.18, 3))
    await tap(pg, f"[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&b.closest('.grid')&&b.innerText.trim()==={json.dumps(pick)})[0]", 2600)
  await pg.wait_for_timeout(after)

async def scene_launch(pg):
  """起動：白 → エンブレム（ロゴ＋コピー）→ 白へ消える → タイトル（とびら君の登場動画）→ はじめる → お知らせ → ホーム"""
  await pg.wait_for_timeout(7800)
  await tap(pg, btn('はじめる'), 1800)
  await tap(pg, btn('閉じる'), 2600)

async def scene_readalong(pg):
  """解説のスクリプト：再生すると、いま読まれている単語が光る"""
  await tap(pg, btn('演習する'), 900)
  await tap(pg, btn('英語リスニング'), 1100)
  await tap(pg, btn('第1回演習'), 1100)
  await tap(pg, btn('問題をはじめる'), 1400)
  await tap(pg, btn('The speaker does not have'), 900)
  await tap(pg, btn('解答と解説を見る'), 2600)
  # スクリプト（読み方つき）を画面の中ほどへ
  await pg.evaluate("""()=>{const w=[...document.querySelectorAll('button')].find(b=>b.offsetParent&&b.innerText.trim()==='umbrella,'); if(w) w.scrollIntoView({block:'center',behavior:'smooth'})}""")
  await pg.wait_for_timeout(1500)
  pg._play = asyncio.get_event_loop().time() + 0.18
  # スマホは「再生」、PC は復習用プレーヤーの「問1」
  await tap(pg, "[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&(b.innerText.trim()==='再生'||/^問1\\s/.test(b.innerText.trim())))[0]", 300)
  pg._src = await pg.evaluate("()=>[...document.querySelectorAll('audio')].filter(a=>!a.paused).map(a=>a.currentSrc).join(',')")
  await pg.wait_for_timeout(6500)

async def scene_q2(pg):
  """第2問（対話に合うイラストを選ぶ）第1回 問1：再生 → 対話を聞く → ②（ミルク入りのホットコーヒー）を選ぶ → 解答・解説
  音源 /listening_audio/el2_set1_q1.mp3（13.8秒・M/W の対話＋設問）。録画は無音なので、編集で play の時刻に重ねる。"""
  await tap(pg, btn('演習する'), 1100)
  await tap(pg, btn('英語リスニング'), 1300)
  await tap(pg, btn('第2問'), 1300)
  await tap(pg, btn('第1回演習'), 1400)
  await tap(pg, btn('問題をはじめる'), 1800)
  pg._play = asyncio.get_event_loop().time() + 0.18
  await tap(pg, "[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&b.innerText.trim()==='再生')[0]", 300)
  pg._src = await pg.evaluate("()=>[...document.querySelectorAll('audio')].filter(a=>!a.paused).map(a=>a.currentSrc).join(',')")
  await pg.wait_for_timeout(9800)   # 対話（〜約10秒）を聞き終えたところで答える
  await tap(pg, "[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&b.innerText.trim()==='②')[0]", 1300)
  pg._answer = asyncio.get_event_loop().time()
  await tap(pg, btn('解答と解説を見る'), 4200)
  # 解説を少しだけ下へ（決め手のスクリプトが見えるところまで）
  sc = await pg.evaluate("""()=>{const c=[...document.querySelectorAll('*')].filter(e=>{const s=getComputedStyle(e);return (s.overflowY=='auto'||s.overflowY=='scroll')&&e.scrollHeight>e.clientHeight+50&&e.clientHeight>300});
     c.sort((a,b)=>b.clientHeight-a.clientHeight); if(!c[0])return null; c[0].setAttribute('data-rec-scroll','1'); return true}""")
  if sc:
    await smooth_scroll(pg, '[data-rec-scroll]', 360, 36, 30); await pg.wait_for_timeout(2400)

async def scene_q2_read(pg):
  """第2問 第1回 問1 の解説：音源を流すと、スクリプトの「いま読まれている単語」が光る"""
  await tap(pg, btn('演習する'), 900)
  await tap(pg, btn('英語リスニング'), 1100)
  await tap(pg, btn('第2問'), 1100)
  await tap(pg, btn('第1回演習'), 1100)
  await tap(pg, btn('問題をはじめる'), 1500)
  await tap(pg, "[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&b.innerText.trim()==='②')[0]", 900)
  await tap(pg, btn('解答と解説を見る'), 3400)
  # スクリプト（読み方つき）を画面の中ほどへ
  await pg.evaluate("""()=>{const w=[...document.querySelectorAll('button')].find(b=>b.offsetParent&&/^sandwich/.test(b.innerText.trim())); if(w) w.scrollIntoView({block:'center',behavior:'smooth'})}""")
  await pg.wait_for_timeout(1600)
  pg._mark = asyncio.get_event_loop().time() - 0.6
  pg._play = asyncio.get_event_loop().time() + 0.18
  # スマホは問題文の「再生」、PC は復習用プレーヤーの「問1」
  play = "[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&(/^問1\\s/.test(b.innerText.trim())||b.innerText.trim()==='再生'))[0]"
  box = await pg.evaluate("(js)=>{const el=(new Function('return '+js))(); if(!el) return null; const r=el.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}}", play)
  if not box: raise RuntimeError('play button not found')
  await pg.evaluate("""([x,y]) => { const d=document.createElement('div'); d.className='__tap'; d.style.left=x+'px'; d.style.top=y+'px'; document.body.appendChild(d); setTimeout(()=>d.remove(), 700); }""", [box['x'], box['y']])
  await pg.wait_for_timeout(180); pg._taps.append(round(asyncio.get_event_loop().time() - pg._t0, 3))
  await pg.mouse.click(box['x'], box['y'])   # スクロールさせずに押す（スクリプトを画面に残す）
  pg._src = await pg.evaluate("()=>[...document.querySelectorAll('audio')].filter(a=>!a.paused).map(a=>a.currentSrc).join(',')")
  await pg.wait_for_timeout(11500)

async def scene_battle_full(pg):
  """AI 対戦を最後（勝利の動画・結果）まで"""
  await tap(pg, btn('対戦する'), 1500)
  await tap(pg, btn('AIと対戦'), 1300)
  await tap(pg, btn('5 さっと'), 900)
  await tap(pg, btn('英文法'), 1300)
  await tap(pg, btn('全単元から出題'), 1300)
  await tap(pg, btn('マナボ（受験生）'), 1300)
  await play_battle(pg, after=11000)

async def scene_gacha_draw(pg):
  """ガチャ：動画で1回（アプリ内の応援動画を最後まで）→ 扉が光る演出 → 結果 → つける"""
  await tap(pg, btn('ガチャ'), 2200)
  await tap(pg, btn('動画で1回'), 1200)
  await tap(pg, btn('再生／再開'), 300)
  pg._mark = asyncio.get_event_loop().time() + 2.4   # 応援動画が終わるころから使う
  await pg.wait_for_timeout(9000)
  # 当たったのが装飾ならつける（プリントのときはボタンが無いので、そのまま結果を見せる）
  if await pg.evaluate(f"!!({btn('この装飾をつける')})"): await tap(pg, btn('この装飾をつける'), 2600)
  else: await pg.wait_for_timeout(2600)

async def scene_missions(pg):
  await tap(pg, btn('ミッション'), 3200)
  await smooth_scroll(pg, 'main', 500, 40, 35); await pg.wait_for_timeout(1500)

async def scene_mypage(pg):
  await tap(pg, btn('マイページ'), 2400)
  await tap(pg, btn('持ちもの'), 2600)

async def scene_gacha(pg):
  await tap(pg, btn('ガチャ'), 3500)

SCENES = [('home', scene_home), ('practice', scene_practice), ('explain', scene_explain), ('review', scene_review),
          ('battle', scene_battle), ('missions', scene_missions), ('mypage', scene_mypage), ('gacha', scene_gacha),
          ('launch', scene_launch), ('readalong', scene_readalong), ('battle_full', scene_battle_full), ('gacha_draw', scene_gacha_draw),
          ('q2', scene_q2), ('q2_read', scene_q2_read)]
# 起動の場面だけは、タイトル画面を飛ばさず（?screenshot=1 なし）、読み込みの前から録る
LAUNCH_SCENES = {'launch'}

async def record(b, name, fn):
  """CDP の画面配信（screencast）で 2倍密度（860×1864）のフレームを時刻つきで保存し、30fps の動画にする。
  ※ Playwright 標準の録画は CSS px（430×932）でしか撮れず、拡大するとぼやけるため使わない。"""
  ctx = await b.new_context(viewport={'width': VIEW['width'], 'height': VIEW['height']}, device_scale_factor=VIEW['scale'],
                            is_mobile=VIEW['mobile'], has_touch=VIEW['mobile'])
  await ctx.add_init_script("try{" + "".join(f"localStorage.setItem({json.dumps(k)},{json.dumps(v)});" for k, v in DEMO_STORAGE.items()) + "}catch(e){}")
  pg = await ctx.new_page(); pg.set_default_timeout(30000)
  launch = name in LAUNCH_SCENES
  if launch:
    # 先にアプリを1回読み込んでキャッシュを温める（録画に長い白画面が入らないように）→ 白い画面から録り始める
    await pg.goto(BASE + '/?no_ads=1', wait_until='load', timeout=240000)
    await pg.wait_for_timeout(1500)
    await pg.goto('about:blank'); await pg.evaluate("document.documentElement.style.background='#fff'")
  else:
    await pg.goto(BASE + '/?no_ads=1&screenshot=1', wait_until='domcontentloaded', timeout=240000)
    await pg.wait_for_function('!!window.__ENTER_APP__', timeout=240000)
    await pg.evaluate("window.__ENTER_APP__()")
    await pg.add_style_tag(content=TAP_CSS)
    await pg.wait_for_timeout(1800)

  fdir = f'{OUT}/_frames_{name}'; os.makedirs(fdir, exist_ok=True)
  for f in os.listdir(fdir): os.remove(os.path.join(fdir, f))
  stamps = []; cdp = await ctx.new_cdp_session(pg); live = {'on': True}
  async def on_frame(ev):
    if not live['on']: return
    i = len(stamps); stamps.append(ev['metadata']['timestamp'])
    open(f'{fdir}/{i:05d}.jpg', 'wb').write(base64.b64decode(ev['data']))
    try: await cdp.send('Page.screencastFrameAck', {'sessionId': ev['sessionId']})
    except Exception: pass  # 閉じる直前の ACK は失敗してよい
  cdp.on('Page.screencastFrame', lambda ev: asyncio.ensure_future(on_frame(ev)))
  await cdp.send('Page.startScreencast', {'format': 'jpeg', 'quality': 90, 'everyNthFrame': 1})
  await pg.wait_for_timeout(400)
  t0 = asyncio.get_event_loop().time(); wall0 = time.time()
  pg._t0 = t0; pg._taps = []
  ok = True
  try:
    if launch:
      await pg.goto(BASE + '/?no_ads=1', wait_until='commit', timeout=240000)
      await pg.wait_for_function("!!document.querySelector('.launch-emblem')", timeout=240000)
      pg._mark = asyncio.get_event_loop().time()      # エンブレムが出た瞬間から使う
      await pg.add_style_tag(content=TAP_CSS)
    await fn(pg)
  except Exception as e:
    ok = False; print('FAIL', name, str(e)[:200], flush=True)
  await pg.wait_for_timeout(300)
  end = asyncio.get_event_loop().time() - t0
  live['on'] = False
  try: await cdp.send('Page.stopScreencast')
  except Exception: pass
  await ctx.close()

  # フレームの時刻（壁時計）→ 動画の時刻。t=0 は fn() を始めた瞬間
  base = wall0
  rows = [(st - base, f'{fdir}/{i:05d}.jpg') for i, st in enumerate(stamps)]
  before = [r for r in rows if r[0] < 0]
  rows = ([(0.0, before[-1][1])] if before else []) + [r for r in rows if r[0] >= 0]  # t=0 の時点の画面から始める
  lst = f'{OUT}/_frames_{name}.txt'
  with open(lst, 'w') as fh:
    for k, (st, path) in enumerate(rows):
      nxt = rows[k + 1][0] if k + 1 < len(rows) else end
      fh.write(f"file '{os.path.abspath(path)}'\nduration {max(0.001, nxt - st):.4f}\n")
    fh.write(f"file '{os.path.abspath(rows[-1][1])}'\n")
  subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-vf', 'fps=30,format=yuv420p',
                  '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', f'{OUT}/{name}.mp4'], check=True)
  mark = getattr(pg, '_mark', None)
  start = (mark - t0) if mark is not None else 0.0
  play = getattr(pg, '_play', None)
  rel = lambda v: (v - t0) if v is not None else None
  json.dump({'start': start, 'end': end, 'ok': ok, 'taps': pg._taps, 'play': rel(play), 'frames': len(rows), 'device': DEVICE,
             'size': [VIEW['width'] * VIEW['scale'], VIEW['height'] * VIEW['scale']],
             'battle_start': rel(getattr(pg, '_start', None)), 'answer_at': rel(getattr(pg, '_answer', None)), 'answers': getattr(pg, '_answers', []), 'audio_src': getattr(pg, '_src', None)},
            open(f'{OUT}/{name}.json', 'w'))
  print('rec', name, round(start, 2), round(end, 2), ok, len(rows), 'frames', flush=True)

async def main():
  async with async_playwright() as p:
    b = await p.chromium.launch(args=['--disable-dev-shm-usage', '--disable-gpu', '--mute-audio', '--renderer-process-limit=1',
                                      f'--force-device-scale-factor={VIEW["scale"]}', '--autoplay-policy=no-user-gesture-required'])
    for name, fn in SCENES:
      if ONLY and name not in ONLY: continue
      await record(b, name, fn)
    await b.close()

asyncio.run(main())
