# 2台で同時に対戦しているところを録画する（スマホ＝ハル / PC＝ソラ）。
#   python3 store-assets/_tools/record_duo.py <出力dir>
# ・本物のアプリ（エミュレータに接続したビルド）を 2つのブラウザで同時に動かし、全国対戦で実際にマッチングさせる。
#   本番の Firebase には一切つながない（demo- プロジェクト＋ローカルのエミュレータ。録画のたびに中身を消す）。
#   準備：npx firebase emulators:start --only auth,firestore --project demo-manatobi-listening
#         VITE_USE_EMULATORS=true npx vite build --outDir .tmpwork/dist_emu && npx vite preview --outDir .tmpwork/dist_emu --port 4174
# ・2人とも実際に問題を見て押す。ハルが少し早く正解、ソラはときどき遅れる／1問まちがえる（本当の早押し勝負に見えるように）。
# ・画面は CDP screencast で時刻つきで撮り、2本とも同じ t=0 にそろえる（編集で横に並べる）。
import asyncio, base64, json, os, random, subprocess, sys, time, urllib.request
from playwright.async_api import async_playwright

URL = os.environ.get('APP_URL_EMU', 'http://localhost:4174')
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
PROJECT = 'demo-manatobi-listening'
ANSWERS = json.load(open(os.path.join(os.path.dirname(__file__), 'grammar_answers.json')))
random.seed(7)

TAP_CSS = """.__tap{position:fixed;z-index:2147483647;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;
 background:rgba(255,255,255,.55);border:3px solid rgba(34,74,140,.9);pointer-events:none;animation:__tap .55s ease-out forwards}
@keyframes __tap{0%{transform:scale(.4);opacity:1}100%{transform:scale(1.35);opacity:0}}"""
PICK_JS = """(answers)=>{
  const norm=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
  const btns=[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&b.closest('.grid')&&!b.disabled);
  if(btns.length<2) return null;
  const key=btns.map(b=>norm(b.innerText)).sort().join('|');
  const body=norm(document.body.innerText);
  const hits=answers.filter(r=>r[1]===key);
  const best=hits.find(r=>r[0].length>8&&body.includes(r[0]))||hits[0];
  const right=best?best[2]:btns[0].innerText.trim();
  return {right, all: btns.map(b=>b.innerText.trim())} }"""

def btn(text):
  t = json.dumps(text)
  return f"[...document.querySelectorAll('button,[role=tab],a')].filter(b=>b.offsetParent&&b.innerText.replace(/\\s+/g,' ').includes({t}))[0]"

def reset_emulator():
  for u in [f'http://127.0.0.1:9099/emulator/v1/projects/{PROJECT}/accounts',
            f'http://127.0.0.1:8080/emulator/v1/projects/{PROJECT}/databases/(default)/documents']:
    urllib.request.urlopen(urllib.request.Request(u, method='DELETE')).read()

async def click(pg, js, wait=1000):
  await pg.evaluate(f"({js}).click()"); await pg.wait_for_timeout(wait)

async def tap(pg, js, rec, who, wait=600):
  box = await pg.evaluate("""(js)=>{const el=(new Function('return '+js))(); if(!el) return null; const r=el.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}}""", js)
  if not box: return False
  await pg.evaluate("""([x,y])=>{const d=document.createElement('div');d.className='__tap';d.style.left=x+'px';d.style.top=y+'px';document.body.appendChild(d);setTimeout(()=>d.remove(),700)}""", [box['x'], box['y']])
  await pg.wait_for_timeout(150)
  rec['taps'].append([who, round(time.time() - rec['wall0'], 3)])
  await pg.mouse.click(box['x'], box['y']); await pg.wait_for_timeout(wait)
  return True

async def login_once(ctx, pg, name, email):
  await pg.goto(URL + '/?no_ads=1&screenshot=1', wait_until='domcontentloaded', timeout=240000)
  await pg.wait_for_function('!!window.__ENTER_APP__', timeout=240000); await pg.evaluate("window.__ENTER_APP__()"); await pg.wait_for_timeout(1200)
  await pg.evaluate("window.__SET_APP_STATE__('onboarding')"); await pg.wait_for_timeout(1200)
  async with ctx.expect_page() as pp:
    await click(pg, btn('Google アカウントで続ける'), 100)
  pop = await pp.value; await pop.wait_for_load_state(); await pop.wait_for_timeout(800)
  await pop.get_by_text('Add new account').click(); await pop.wait_for_timeout(600)
  await pop.fill('#email-input', email); await pop.fill('#display-name-input', name); await pop.wait_for_timeout(400)
  b = pop.get_by_role('button', name='Sign in with Google.com'); await b.scroll_into_view_if_needed(); await b.click()
  await pg.wait_for_timeout(800)
  if not pop.is_closed(): await pop.evaluate("[...document.querySelectorAll('button')].find(x=>/Sign in with/.test(x.innerText))?.click()")
  for _ in range(60):
    if await pg.evaluate("!document.body.innerText.includes('連携中')"): break
    await pg.wait_for_timeout(300)
  await pg.wait_for_timeout(1200)
  # ログインのポップアップが出ると元の画面は「裏」扱いになり、描画（＝録画のコマ）が止まる。前に戻す
  await pg.bring_to_front(); await pg.wait_for_timeout(300)
  print(name, 'visible:', await pg.evaluate("document.visibilityState"), flush=True)
  await pg.evaluate("window.__SET_APP_STATE__('home')"); await pg.wait_for_timeout(1500)
  await pg.add_style_tag(content=TAP_CSS)

async def login(ctx, pg, name, email):
  """ログインして対戦ロビーまで。ロビーに「相手を見つける」が出ない（＝ログインできていない）ときはやり直す"""
  for attempt in range(3):
    try:
      await login_once(ctx, pg, name, email if attempt == 0 else email.replace('@', f'+{attempt}@'))
      await click(pg, btn('対戦する'), 1800)
      ok = await pg.evaluate(f"!!({btn('相手を見つける')}) && !document.body.innerText.includes('ログインすると遊べる')")
    except Exception as e:
      print(name, 'login error', str(e)[:100], flush=True); ok = False
    print(name, 'lobby ready:', ok, flush=True)
    if ok: return
  raise SystemExit(f'{name}: ログインできませんでした')

async def start_cast(ctx, pg, fdir, nth=1):
  os.makedirs(fdir, exist_ok=True)
  for f in os.listdir(fdir): os.remove(os.path.join(fdir, f))
  stamps = []; cdp = await ctx.new_cdp_session(pg); live = {'on': True}
  async def on_frame(ev):
    if not live['on']: return
    i = len(stamps); stamps.append(ev['metadata']['timestamp'])
    open(f'{fdir}/{i:05d}.jpg', 'wb').write(base64.b64decode(ev['data']))
    with open(f'{fdir}/stamps.txt', 'a') as fh: fh.write(f"{i} {ev['metadata']['timestamp']}\n")
    try: await cdp.send('Page.screencastFrameAck', {'sessionId': ev['sessionId']})
    except Exception: pass
  cdp.on('Page.screencastFrame', lambda ev: asyncio.ensure_future(on_frame(ev)))
  await cdp.send('Page.startScreencast', {'format': 'jpeg', 'quality': 85, 'everyNthFrame': nth})
  return stamps, cdp, live

def to_mp4(stamps, fdir, wall0, end, out):
  rows = [(st - wall0, f'{fdir}/{i:05d}.jpg') for i, st in enumerate(stamps)]
  before = [r for r in rows if r[0] < 0]
  rows = ([(0.0, before[-1][1])] if before else []) + [r for r in rows if r[0] >= 0]
  lst = out + '.txt'
  with open(lst, 'w') as fh:
    for k, (st, path) in enumerate(rows):
      nxt = rows[k + 1][0] if k + 1 < len(rows) else end
      fh.write(f"file '{os.path.abspath(path)}'\nduration {max(0.001, nxt - st):.4f}\n")
    fh.write(f"file '{os.path.abspath(rows[-1][1])}'\n")
  subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-vf', 'fps=30,format=yuv420p',
                  '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-threads', '1', out], check=True)

ANSWERED_JS = "()=>{const t=document.body.innerText; const g=[...document.querySelectorAll('.grid button')].filter(b=>b.offsetParent); return t.includes('あいてを まっています')||t.includes('正解！')||t.includes('不正解')||(g.length>0&&g.every(b=>b.disabled))}"

async def player(pg, who, rec, plan):
  """1人分の対戦：問題が出たら、plan の通りの間合いで押す。押せていなければ押し直す"""
  q = 0; seen = None
  deadline = time.time() + 150
  while time.time() < deadline and q < plan['n']:
    try:
      info = await pg.evaluate(PICK_JS, ANSWERS)
    except Exception:
      return
    if info and info['all'] != seen:
      delay, wrong = plan['moves'][min(q, len(plan['moves']) - 1)]
      await pg.wait_for_timeout(delay)
      choice = info['right']
      if wrong:
        others = [a for a in info['all'] if a != info['right']]
        if others: choice = others[0]
      js = f"[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&b.closest('.grid')&&!b.disabled&&b.innerText.trim()==={json.dumps(choice)})[0]"
      done = False
      for attempt in range(6):
        if await tap(pg, js, rec, who, 350) and await pg.evaluate(ANSWERED_JS):
          done = True; break
        await pg.wait_for_timeout(300)
      if done:
        seen = info['all']
        rec['answers'].append([who, q + 1, round(time.time() - rec['wall0'], 3), choice == info['right']])
        print(who, 'Q', q + 1, round(time.time() - rec['wall0'], 1), 'frames', len(rec['stamps'][who]), flush=True)
        q += 1
    await pg.wait_for_timeout(200)

async def main():
  reset_emulator()
  async with async_playwright() as p:
    # 2台は別々のブラウザ（別プロセス）で動かす。1つのブラウザに詰めると、1GB の環境ではタブが落ちることがある
    args = ['--disable-dev-shm-usage', '--disable-gpu', '--mute-audio', '--renderer-process-limit=1']
    b = await p.chromium.launch(args=args + ['--force-device-scale-factor=2'])
    b2 = await p.chromium.launch(args=args + ['--force-device-scale-factor=1'])
    # スマホ（ハル）は 2倍密度、PC（ソラ）は 1600×900 の 1倍で撮る
    c1 = await b.new_context(viewport={'width': 430, 'height': 932}, device_scale_factor=2, is_mobile=True, has_touch=True)
    c2 = await b2.new_context(viewport={'width': 1600, 'height': 900}, device_scale_factor=1)   # PC 版のレイアウト（1100px 以上）。1GB の環境で2台同時に録るため 1600×900
    for c in (c1, c2): await c.add_init_script("localStorage.setItem('hasCompletedOnboarding','true')")
    p1 = await c1.new_page(); p2 = await c2.new_page()
    for who, pg in (('phone', p1), ('pc', p2)):
      pg.set_default_timeout(60000)
      pg.on('crash', lambda *_ , w=who: print('CRASH', w, flush=True))
    await login(c1, p1, 'ハル', 'haru@example.com')
    await login(c2, p2, 'ソラ', 'sora@example.com')

    rec = {'taps': [], 'answers': []}
    s1 = await start_cast(c1, p1, f'{OUT}/_frames_duo_phone')
    s2 = await start_cast(c2, p2, f'{OUT}/_frames_duo_pc', nth=3)
    await p1.wait_for_timeout(500)
    rec['wall0'] = time.time(); open(f'{OUT}/wall0.txt', 'w').write(str(rec['wall0'])); rec['stamps'] = {'phone': s1[0], 'pc': s2[0]}
    # ハル（スマホ）が先に待機票を置き、3秒後にソラ（PC）が探しに来る（＝ソラがハルを見つけて部屋を作る）
    await tap(p1, btn('相手を見つける'), rec, 'phone', 900); await tap(p1, btn('英文法'), rec, 'phone', 300)
    await p2.wait_for_timeout(2200)
    await tap(p2, btn('相手を見つける'), rec, 'pc', 900); await tap(p2, btn('英文法'), rec, 'pc', 300)
    rec['matched'] = None
    for _ in range(120):
      if await p1.evaluate("document.body.innerText.includes('BATTLE READY')") and await p2.evaluate("document.body.innerText.includes('BATTLE READY')"):
        rec['matched'] = round(time.time() - rec['wall0'], 3); break
      await p1.wait_for_timeout(150)
    # AI の代役（20秒待っても人が来ないときに出る）になっていないか：お互いの名前（ハ＊ / ソ＊）が見えているか
    await p1.wait_for_timeout(9000)
    t1 = await p1.evaluate("document.body.innerText"); t2 = await p2.evaluate("document.body.innerText")
    rec['paired'] = ('ソ' in t1) and ('ハ' in t2) and ('AI' not in t1[:400])
    print('matched', rec['matched'], 'paired', rec['paired'], flush=True)
    if not rec['paired']:
      for br in (b, b2):
        try: await br.close()
        except Exception: pass
      raise SystemExit('2台がお互いにマッチしませんでした（やり直してください）')
    # 10問。ハルはだいたい速く正解、ソラは2問だけ先に取り、1問まちがえる
    n = 10
    plan_phone = {'n': n, 'moves': [(1300, False), (1500, False), (2600, False), (1200, False), (1400, False), (2400, False), (1300, False), (1100, False), (1500, False), (1000, False)]}
    plan_pc = {'n': n, 'moves': [(1900, False), (2100, False), (1600, False), (1800, True), (2000, False), (1500, False), (2200, False), (1700, False), (2100, False), (1600, False)]}
    async def stop(st):
      st[2]['on'] = False
      try: await asyncio.wait_for(st[1].send('Page.stopScreencast'), 3)
      except Exception: pass
    async def result_shown(pg):
      try: return await pg.evaluate("/\\b(WIN|LOSE|DRAW)\\b/.test(document.body.innerText)")
      except Exception: return False
    async def pc_side():
      # PC（ソラ）：最後の問題に答えて 3 秒で止め、ブラウザごと閉じる。
      #   1GB の環境では、2台同時に FINISH → WIN の演出（全画面の動画）に入るとタブが落ちるため、
      #   勝ったスマホ側に余裕を残す（PC の結果画面は使わない）
      await player(p2, 'pc', rec, plan_pc)
      await asyncio.sleep(3.0)
      rec['end_pc'] = time.time() - rec['wall0']; await stop(s2)
      try: await asyncio.wait_for(b2.close(), 8)
      except Exception: pass
    async def phone_side():
      # スマホ（ハル）：FINISH → WIN → MISSION CLEAR → 勝利の動画 → 結果
      await player(p1, 'phone', rec, plan_phone)
      for _ in range(80):
        if await result_shown(p1): break
        await asyncio.sleep(0.25)
      await asyncio.sleep(9)
      rec['end_phone'] = time.time() - rec['wall0']; await stop(s1)
    await asyncio.gather(phone_side(), pc_side())
    end = max(rec.get('end_phone', 0), rec.get('end_pc', 0))
    try: await asyncio.wait_for(b.close(), 8)
    except Exception: pass
  to_mp4(s1[0], f'{OUT}/_frames_duo_phone', rec['wall0'], rec['end_phone'], f'{OUT}/duo_phone.mp4')
  to_mp4(s2[0], f'{OUT}/_frames_duo_pc', rec['wall0'], rec['end_pc'], f'{OUT}/duo_pc.mp4')
  rec['end'] = end; rec.pop('wall0'); rec.pop('stamps')
  json.dump(rec, open(f'{OUT}/duo.json', 'w'), ensure_ascii=False, indent=1)
  print('rec duo', round(end, 2), 'matched', rec['matched'], 'answers', rec['answers'], flush=True)

asyncio.run(main())
