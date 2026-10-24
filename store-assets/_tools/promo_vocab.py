# 英単語・英熟語の告知動画（リール 9:16 ／ ストーリーズ 9:16 ／ YouTube 16:9）2026-10-24
#   python3 store-assets/_tools/promo_vocab.py <出力dir> [reel] [story] [youtube] [--draft] [--sheet]
#
# ■ 伝えること（利用者の指定）
#   ・英単語は覚えるのがしんどい。「1冊を極めるか、次の単語帳へ行くか」の論争もある
#   ・マナトビは、市販の単語帳の単語を網羅した独自の単語帳（全5,713語）。ゲーム感覚でこなすだけで全部に届く
#   ・覚える → 演習 → 長文で使う → 対戦 までが「1本の道」
# ■ 素材：record_vocab.py で録った本物のアプリ画面だけ（動画生成AIは使わない）
# ■ BGM：アプリに入っている4曲すべて
#   夕凪（waiting.mp3）… 冒頭の「しんどい・迷う」
#   誕生（tanjou.mp3） … 答え（5,713語）で広がる → 最後のしめ・ロゴ
#   風の列車（battle.mp3）… 覚える・演習・長文（曲頭7秒の盛り上がりを STEP1 の頭に合わせる）
#   カナリアスキップ（battle2.mp3）… 対戦（曲頭7秒のサビを START! に合わせる。アプリと同じ）
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from promo_engine import *  # noqa: F401,F403

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
REC = os.environ.get('PROMO_REC') or os.path.join(ROOT, 'store-assets', '_footage')
args = [a for a in sys.argv[1:] if not a.startswith('--')]
OUT = args[0]; WHICH = args[1:] or ['reel', 'story', 'youtube']
DRAFT = '--draft' in sys.argv
TMP = os.path.join(OUT, '_work'); os.makedirs(TMP, exist_ok=True)
A = lambda *p: os.path.join(ROOT, *p)
PH, PC = os.path.join(REC, 'vrec_ph'), os.path.join(REC, 'vrec_pc')
def mp4(d, n): return os.path.join(d, n + '.mp4')
def meta(d, n): return json.load(open(os.path.join(d, n + '.json')))
SFX = lambda n: A('public/sfx/battle', n + '.mp3')
TANJOU, WAITING, TRAIN, CANARY = A('public/tanjou.mp3'), A('public/bgm/battle/waiting.mp3'), A('public/bgm/battle/battle.mp3'), A('public/bgm/battle/battle2.mp3')
PHONE_SRC, PC_SRC = (860, 1864), (1920, 1080)
GREEN = (46, 160, 96)

# ---------------- 録画の中の時刻（record_vocab.py の json と、画面の変化から測ったもの） ----------------
WB, QZ, RD, BT = meta(PH, 'wordbook'), meta(PH, 'quiz'), meta(PH, 'reading'), meta(PH, 'battle')
WBp, QZp, RDp, BTp = meta(PC, 'wordbook'), meta(PC, 'quiz'), meta(PC, 'reading'), meta(PC, 'battle')
QZ_OK = [a + 0.33 for a in QZ['answers']]
QZp_OK = [a + 0.35 for a in QZp['answers']]
RD_OK, RDp_OK = RD['answers'][0] + 0.28, RDp['answers'][0] + 0.32
B = dict(ticks=[10.17, 11.13, 12.13, 13.13, 14.2, 15.23], start=16.33, ok=[a + 0.94 for a in BT['answers']], final=45.0, finish=52.6, win=54.8, mission=56.43)
Bp = dict(ticks=[10.07, 11.17, 12.13, 13.17, 14.17, 15.2], start=16.23, ok=[a + 0.92 for a in BTp['answers']], final=51.1, finish=58.37, win=60.73, mission=62.4)
RECT = json.load(open(os.path.join(PH, 'reading_rects.json'))); RECTp = json.load(open(os.path.join(PC, 'reading_rects.json')))
_vd = json.load(open(A('public/data/listeningVocabulary.json'))); _n = {}; WORDNO = {}
for w in _vd['words']:
  _n[w['level']] = _n.get(w['level'], 0) + 1; WORDNO.setdefault(w['word'], (w['level'], _n[w['level']], w['meaning'].split('／')[0]))
HL = [('public', 'public'), ('unusual', 'unusual'), ('staff', 'staff'), ('refused', 'refuse'), ('librarians', 'librarian')]
N_ALL = len(_vd['words']); N_WORD = sum(1 for w in _vd['words'] if w['level'].startswith('lv')); N_IDIOM = N_ALL - N_WORD
LV_ROWS = [('単語', '共通テスト6割〜', 'lv1'), ('単語', '共通テスト8割〜', 'lv2'), ('単語', '2次試験レベル', 'lv3'), ('単語', '2次試験の追加語彙', 'lv4'),
           ('熟語', '共通テスト6割〜', 'ilv1'), ('熟語', '共通テスト8割〜', 'ilv2'), ('熟語', '2次試験レベル', 'ilv3')]
LV_N = {k: sum(1 for w in _vd['words'] if w['level'] == k) for _, _, k in LV_ROWS}

LAYOUTS = {
  # 縦は「上に道のり＋見出しの帯、その下にアプリの画面（角丸のカード）」。見出しが画面の文字にかぶらない
  'reel': dict(W=1080, H=1920, road_y=56, cap_y=196, cap=52, card=92, screen=(40, 400, 1000, 1480)),
  'story': dict(W=1080, H=1920, road_y=250, cap_y=384, cap=50, card=92, screen=(70, 560, 940, 1130)),
  'youtube': dict(W=1920, H=1080, road_y=20, cap_y=118, cap=46, card=86, screen=(249, 140, 1422, 800)),
}

def fit(roi, dw, dh, sw, sh):
  x0, y0, x1, y1 = roi; a = dw / dh
  cw = min(max(x1 - x0, (y1 - y0) * a), sw, sh * a); ch = cw / a
  cx = min(max((x0 + x1) / 2, cw / 2), sw - cw / 2); cy = min(max((y0 + y1) / 2, ch / 2), sh - ch / 2)
  return (cx, cy, cw)
def cams(keys, dest, src): return [(t, fit(r, dest[2], dest[3], *src)) for t, r in keys]

_BG = {}
def _bg(L, key, top, bottom, glow):
  k = (key, L['W'], L['H'])
  if k not in _BG: _BG[k] = gradient(L['W'], L['H'], top, bottom, glow=(L['W'] * 0.5, L['H'] * glow[0], max(L['W'], L['H']) * glow[1], glow[2], glow[3]))
  return _BG[k]
def bg_navy(L): return _bg(L, 'navy', (20, 34, 58), (12, 20, 36), (0.42, 0.45, BLUE, 0.55))
def bg_blue(L): return _bg(L, 'blue', BLUE, BLUE_D, (0.40, 0.50, (80, 140, 225), 0.55))
def bg_dusk(L): return _bg(L, 'dusk', (38, 42, 56), (16, 18, 26), (0.62, 0.38, (70, 76, 100), 0.5))
def bg_cream(L): return _bg(L, 'cream', CREAM, CREAM_D, (0.5, 0.5, CREAM, 0.0))

def cap_img(text, size, hl=None, step=None):
  t = Image.fromarray(cv2.cvtColor(text_img(text, size, WHITE, hl=hl, hl_mode='color', pad=round(size * 0.42)), cv2.COLOR_BGRA2RGBA))
  sp = Image.fromarray(cv2.cvtColor(pill_img(step, round(size * 0.5), fg=NAVY, bg=ORANGE), cv2.COLOR_BGRA2RGBA)) if step else None
  top = sp.height // 2 + 4 if sp else 0
  W = max(t.width, sp.width if sp else 0) + 8; H = t.height + top + 4
  im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); x = (W - t.width) // 2
  ImageDraw.Draw(im).rounded_rectangle([x, top, x + t.width - 1, top + t.height - 1], round(size * 0.45), fill=(16, 28, 46, 226))
  im.alpha_composite(t, (x, top))
  if sp: im.alpha_composite(sp, ((W - sp.width) // 2, 0))
  return pil_to_bgra(im)

def caption(L, text, at=0.15, until=None, hl=None, step=None, y=None, size=None, x=None):
  return Sprite(cap_img(text, size or L['cap'], hl, step), x or L['W'] / 2, y if y is not None else L['cap_y'], at=at, until=until, anim='up', dur=0.4, anchor='top')

ROAD = ['覚える', '演習', '長文', '対戦']
_ROAD = {}
def road_img(L, k):
  """1本の道：覚える → 演習 → 長文 → 対戦。k 番目がいま（オレンジ）、それより前は済み（✓）"""
  key = (L['W'], k)
  if key in _ROAD: return _ROAD[key]
  wide = L['W'] > L['H']; w = 760 if wide else 900; h = 104 if wide else 118; r = 22 if wide else 26
  im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
  d.rounded_rectangle([0, 0, w - 1, h - 1], h // 2, fill=(14, 24, 40, 215))
  xs = [w * (0.14 + 0.24 * i) for i in range(4)]; cy = h * 0.38
  d.line([xs[0], cy, xs[-1], cy], fill=(90, 104, 130, 255), width=6)
  if k > 0: d.line([xs[0], cy, xs[min(k, 3)], cy], fill=ORANGE + (255,), width=6)
  f = font(FONT_BLACK, 22 if wide else 25)
  for i, x in enumerate(xs):
    col = ORANGE if i == k else (GREEN if i < k else (90, 104, 130))
    d.ellipse([x - r, cy - r, x + r, cy + r], fill=col + (255,), outline=(255, 255, 255, 255) if i == k else None, width=4)
    t = '✓' if i < k else str(i + 1)
    ff = font(FONT_BLACK, 22 if wide else 26); tw = d.textlength(t, font=ff); d.text((x - tw / 2, cy - r * 0.66), t, font=ff, fill=WHITE if i != k else NAVY)
    tw = d.textlength(ROAD[i], font=f); d.text((x - tw / 2, h - (34 if wide else 38)), ROAD[i], font=f, fill=WHITE if i <= k else (150, 160, 180))
  _ROAD[key] = pil_to_bgra(im); return _ROAD[key]

def road(L, k, at=0.0, anim='fade', x=None):
  return Sprite(road_img(L, k), x or L['W'] / 2, L['road_y'], at=at, anim=anim, dur=0.35, anchor='top')

def label(text, x, y, orange=False, at=0.1, size=30):
  return Sprite(pill_img(text, size, fg=NAVY if orange else WHITE, bg=ORANGE if orange else (16, 28, 46)), x, y, at=at, anim='fade', dur=0.3, anchor='tl')

def V(path, t0, dest, src, roi=None, speed=1.0, at=0.0, until=None, device=None, ev=(), **kw):
  v = Video(path, t0, dest, cam=cams(roi, dest, src) if roi else None, speed=speed, at=at, until=until, device=device, **kw)
  v.ev = list(ev); return v

_SHADOW = {}
def screen_shadow(w, h, r):
  k = (w, h, r)
  if k not in _SHADOW:
    pad = 40; im = Image.new('RGBA', (w + pad * 2, h + pad * 2), (0, 0, 0, 0)); m = Image.new('L', im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([pad, pad + 14, pad + w, pad + h + 14], r, fill=170)
    im.paste((4, 8, 18, 255), (0, 0), m.filter(ImageFilter.GaussianBlur(18)))
    ImageDraw.Draw(im).rounded_rectangle([pad - 3, pad - 3, pad + w + 3, pad + h + 3], r + 3, outline=(255, 255, 255, 60), width=3)
    _SHADOW[k] = (pil_to_bgra(im), pad)
  return _SHADOW[k]

def full(L, path, t0, t1, src, roi=None, speed=1.0, ev=(), layers=(), xin=0.25, kind='fade', punch=(), flash=(), shake=(), zoom=None, name='', freeze=None):
  rk = [(0, roi)] if roi and not isinstance(roi, list) else roi
  rk = rk or [(0, (0, 0, src[0], src[1]))]
  if 'screen' in L:   # 縦：アプリの画面は角丸のカードに入れ、上の帯に道のりと見出し
    x, y, w, h = L['screen']; r = 40; sh, pad = screen_shadow(w, h, r)
    v = V(path, t0, (x, y, w, h), src, roi=rk, speed=speed, ev=ev, freeze=freeze, radius=r)
    under = Sprite(sh, x - pad, y - pad, anim=None, anchor='tl')
    return Shot((t1 - t0) / speed, [under, v, *layers], bg_navy(L), xin=xin, kind=kind, punch=punch, flash=flash, shake=shake, zoom=zoom, name=name)
  v = V(path, t0, (0, 0, L['W'], L['H']), src, roi=rk, speed=speed, ev=ev, freeze=freeze)
  return Shot((t1 - t0) / speed, [v, *layers], bg_cream(L), xin=xin, kind=kind, punch=punch, flash=flash, shake=shake, zoom=zoom, name=name)

def to_out(t, t0, speed=1.0): return (t - t0) / speed

def mascot(path, h, x, y, at=0.1, anim='pop', bob=(9, 2.6), alpha=1.0):
  return Sprite(load_sprite(path, h=h), x, y, at=at, anim=anim, dur=0.7, bob=bob, alpha=alpha)

def lines_up(L, lines, y, size, hl=None, at=0.25, step=0.55, cx=None, color=WHITE, fnt=FONT_BLACK):
  out = []; cx = cx or L['W'] / 2
  for i, ln in enumerate(lines):
    img = text_img(ln, size, color, fnt=fnt, hl=hl, hl_mode='color', shadow=(0, 5, (8, 14, 30, 130)))
    out.append(Sprite(img, cx, y, at=at + i * step, anim='up', dur=0.55, anchor='top', drift=(0, -4, 0))); y += img.shape[0] * 0.9
  return out, y

def logo_pill(width):
  lg = Image.open(A('public/brand/manatobi-logo.png')).convert('RGBA'); s = width / lg.width
  lg = lg.resize((round(lg.width * s), round(lg.height * s)), Image.LANCZOS); pad = round(width * 0.09)
  pill = Image.new('RGBA', (lg.width + pad * 2, lg.height + pad * 2), (0, 0, 0, 0))
  ImageDraw.Draw(pill).rounded_rectangle([0, 0, pill.width - 1, pill.height - 1], pill.height // 2, fill=WHITE)
  pill.alpha_composite(lg, (pad, pad)); return pil_to_bgra(pill)

# ---------------- 場面（どの形でも使う部品） ----------------
def sc_pain(L, dur, name='pain'):
  """しんどい：暗い背景・降ってくる単語・ねむるとびら君"""
  W, H = L['W'], L['H']; wide = W > H; S = L['card']
  cx = W * (0.40 if wide else 0.5)
  lay, y = lines_up(L, ['英単語って、', '覚えるの、しんどい。'], H * (0.26 if wide else 0.27), S, hl='しんどい', cx=cx, at=0.2, step=0.6)
  rnd = np.random.RandomState(3)
  ws = ['abandon', 'consequence', 'inevitable', 'make up for', 'nevertheless', 'derive', 'cumulative',
        'take ~ for granted', 'substantial', 'deteriorate', 'put up with', 'ambiguous', 'reluctant', 'carry out']
  for i, wd in enumerate(ws):
    img = text_img(wd, int(rnd.randint(30, 46)), (150, 162, 190), fnt=FONT_BOLD)
    x = rnd.uniform(0.08, 0.92) * W; y0 = rnd.uniform(-0.1, 0.25) * H
    lay.insert(0, Sprite(img, x, y0, at=0.05 + i * 0.12, anim='fade', dur=0.6, alpha=0.5, drift=(0, rnd.uniform(70, 140), 0)))
  mh = round(H * (0.22 if not wide else 0.36))
  lay.append(mascot(A('public/mascots/sleeping.webp'), mh, W * (0.5 if not wide else 0.80), H * (0.72 if not wide else 0.64), at=0.5, anim='up', bob=(5, 3.2)))
  return Shot(dur, lay, bg_dusk(L), xin=0, name=name)

def sc_debate(L, dur, name='debate', xin=0.3):
  """論争：1冊を極める vs 何冊も回す → どれが正解？"""
  W, H = L['W'], L['H']; wide = W > H; S = L['card']
  lay, _ = lines_up(L, ['単語帳、どう使うのが正解？'], H * (0.14 if not wide else 0.12), round(S * (0.72 if not wide else 0.8)), hl='正解', at=0.1)
  a = pill_img('1冊を極めてから次へ', round(S * 0.52), fg=NAVY, bg=WHITE, padx=40, pady=22)
  b = pill_img('何冊も回して覚える', round(S * 0.52), fg=WHITE, bg=(200, 70, 70), padx=40, pady=22)
  vs = pill_img('VS', round(S * 0.6), fg=NAVY, bg=ORANGE, padx=26, pady=10)
  if wide:
    lay += [Sprite(a, W * 0.27, H * 0.44, at=0.45, anim='left', dur=0.5), Sprite(b, W * 0.73, H * 0.44, at=0.75, anim='right', dur=0.5),
            Sprite(vs, W * 0.5, H * 0.44, at=1.0, anim='pop', dur=0.4)]
    qs = [('今のままでいい？', 0.20, 0.68), ('もう1冊買う？', 0.50, 0.76), ('終わる気がしない…', 0.80, 0.68)]
  else:
    lay += [Sprite(a, W * 0.5, H * 0.33, at=0.45, anim='left', dur=0.5), Sprite(vs, W * 0.5, H * 0.415, at=1.0, anim='pop', dur=0.4),
            Sprite(b, W * 0.5, H * 0.50, at=0.75, anim='right', dur=0.5)]
    qs = [('今のままでいい？', 0.28, 0.62), ('もう1冊買う？', 0.72, 0.66), ('終わる気がしない…', 0.36, 0.72)]
  for i, (t, x, yy) in enumerate(qs):
    lay.append(Sprite(text_img(t, round(S * 0.42), (205, 214, 232), fnt=FONT_BOLD), W * x, H * yy, at=1.35 + i * 0.25, anim='pop', dur=0.4, bob=(5, 2.2 + i * 0.3)))
  lay.append(mascot(A('public/mascots/thinking.webp'), round(H * (0.16 if not wide else 0.26)), W * (0.78 if not wide else 0.91), H * (0.85 if not wide else 0.84), at=0.6, anim='up'))
  return Shot(dur, lay, bg_dusk(L), xin=xin, kind='fade', name=name)

def sc_answer(L, dur, name='answer', xin=0.12, table=False):
  """答え：市販の単語帳の単語を網羅した、独自の単語帳。5,713語のカウンター"""
  W, H = L['W'], L['H']; wide = W > H; S = L['card']
  cx = W * (0.32 if (wide and table) else 0.5)
  lay = []
  kick = pill_img('マナトビの単語帳', round(S * 0.42), fg=NAVY, bg=ORANGE)
  y = H * (0.15 if not wide else 0.12)
  lay.append(Sprite(kick, cx, y, at=0.05, anim='pop', dur=0.4, anchor='top')); y += kick.shape[0] + 26
  t, y = lines_up(L, ['市販の単語帳の単語を、', '網羅した。'], y, round(S * (0.74 if not wide else 0.64)), hl='網羅', at=0.2, step=0.45, cx=cx)
  lay += t; y += 30
  num_y = y; big = round(S * (2.3 if not wide else 1.7)); unit = text_img('語', round(big * 0.42), WHITE)
  cache = {}
  def counter(cv, lt):
    u = ease_out(clamp01((lt - 0.9) / 1.6)); n = int(round(N_ALL * u))
    if n not in cache: cache.clear(); cache[n] = text_img(f'{n:,}', big, ORANGE, shadow=(0, 8, (6, 10, 24, 150)), pad=10)
    img = cache[n]; tw = img.shape[1] + unit.shape[1]; x0 = cx - tw / 2
    a = smooth((lt - 0.8) / 0.3); blit(cv, img, x0, num_y, a); blit(cv, unit, x0 + img.shape[1] - 6, num_y + img.shape[0] - unit.shape[0] - big * 0.12, a)
  lay.append(Func(counter))
  y = num_y + big * 1.35
  sub = text_img(f'単語 {N_WORD:,}　／　熟語 {N_IDIOM:,}', round(S * 0.42), (255, 230, 190), fnt=FONT_BOLD)
  lay.append(Sprite(sub, cx, y, at=2.2, anim='fade', dur=0.5, anchor='top')); y += sub.shape[0] + 14
  sub2 = text_img('共通テスト〜2次試験まで、マナトビ独自の1冊に', round(S * 0.36), (220, 228, 244), fnt=FONT_BOLD)
  lay.append(Sprite(sub2, cx, y, at=2.5, anim='fade', dur=0.5, anchor='top'))
  if table:
    tx = W * 0.72; ty = H * 0.17; f = round(S * 0.34)
    for i, (kind, nm, k) in enumerate(LV_ROWS):
      row = Image.new('RGBA', (580, 72), (0, 0, 0, 0)); d = ImageDraw.Draw(row)
      d.rounded_rectangle([0, 0, 579, 71], 18, fill=(255, 255, 255, 238))
      d.rounded_rectangle([12, 14, 92, 58], 12, fill=(222, 234, 252, 255) if kind == '単語' else (255, 236, 210, 255))
      fk = font(FONT_BLACK, 26); d.text((52 - d.textlength(kind, font=fk) / 2, 16), kind, font=fk, fill=BLUE if kind == '単語' else (170, 100, 20))
      d.text((110, 17), nm, font=font(FONT_BOLD, f), fill=NAVY)
      s = f'{LV_N[k]:,}語'; fb = font(FONT_BLACK, f); d.text((560 - d.textlength(s, font=fb), 15), s, font=fb, fill=NAVY)
      lay.append(Sprite(pil_to_bgra(row), tx, ty + i * 84, at=1.0 + i * 0.16, anim='right', dur=0.4, anchor='top'))
  else:
    lay.append(mascot(A('public/mascots/good.webp'), round(H * 0.19), W * 0.5, H * 0.85, at=0.6))
  return Shot(dur, lay, bg_blue(L), xin=xin, kind='flash', flash=[0.0], name=name)

def sc_roadmap(L, dur, name='roadmap', xin=0.3):
  """1本の道：覚えて → 演習して → 長文で使って → 対戦まで"""
  W, H = L['W'], L['H']; wide = W > H; S = L['card']
  lay, y = lines_up(L, ['ゲーム感覚で、', 'こなすだけ。'], H * (0.13 if not wide else 0.10), round(S * 0.86), hl='ゲーム感覚', at=0.1, step=0.4)
  steps = [('覚える', '単語帳'), ('演習', '4択'), ('長文', '英文解釈'), ('対戦', 'AI・全国')]
  for i, (a, b) in enumerate(steps):
    cw = 360 if not wide else 330
    card = Image.new('RGBA', (cw, 150), (0, 0, 0, 0)); d = ImageDraw.Draw(card)
    d.rounded_rectangle([0, 0, cw - 1, 149], 30, fill=(255, 255, 255, 242))
    d.ellipse([18, 37, 94, 113], fill=ORANGE + (255,)); fn = font(FONT_BLACK, 40); n = str(i + 1); d.text((56 - d.textlength(n, font=fn) / 2, 44), n, font=fn, fill=NAVY)
    d.text((112, 22), a, font=font(FONT_BLACK, 48), fill=NAVY); d.text((114, 92), b, font=font(FONT_BOLD, 28), fill=(90, 100, 120))
    img = pil_to_bgra(card)
    if wide: x, yy = W * (0.13 + 0.248 * i), H * 0.52
    else: x, yy = W * (0.30 if i % 2 == 0 else 0.70), y + 110 + i * 190
    lay.append(Sprite(img, x, yy, at=0.6 + i * 0.32, anim='pop', dur=0.45))
    if i < 3:
      ar = text_img('→' if wide else ('↘' if i % 2 == 0 else '↙'), 54, ORANGE)
      lay.append(Sprite(ar, (x + W * 0.124) if wide else W * 0.5, yy if wide else yy + 96, at=0.75 + i * 0.32, anim='fade', dur=0.3))
  bottom = text_img('1本の道で、全部の単語を。', round(S * 0.62), WHITE, hl='全部の単語', hl_mode='color')
  lay.append(Sprite(bottom, W / 2, H * (0.86 if not wide else 0.80), at=0.6 + 4 * 0.32, anim='up', dur=0.5))
  return Shot(dur, lay, bg_navy(L), xin=xin, kind='zoom', name=name)

def reading_hl(L, rects, src, cam_roi, start, step=0.42, scale=1.0, panel_y=0.50, panel_x=None, panel_w=0.88):
  """長文の中で、単語帳に載っている語を順に光らせ、下の空いた所に「単語帳の番号と意味」を1行ずつ出す"""
  dx, dy, dw, dh = L.get('screen', (0, 0, L['W'], L['H']))
  cx, cy, cw = fit(cam_roi, dw, dh, *src); s = dw / cw; ox = cx - cw / 2 - dx / s; oy = cy - (dh / s) / 2 - dy / s
  items = []
  for i, (surf, base) in enumerate(HL):
    if surf not in rects or base not in WORDNO: continue
    x, y, w, h = rects[surf][0]; lv, no, ja = WORDNO[base]
    items.append(((x - ox) * s, (y - oy) * s, w * s, h * s, start + i * step, base, lv, no, ja))
  # 下のパネル：見出し＋1語1行
  pw = round(dw * panel_w); fs = round(34 * scale); rh = round(fs * 1.75)
  head = text_img('この長文に出てくる「単語帳の語」', round(fs * 0.86), NAVY, fnt=FONT_BLACK, pad=6)
  rows = []
  for (_, _, _, _, _, base, lv, no, ja) in items:
    im = Image.new('RGBA', (pw - 40, rh - 10), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, im.width - 1, im.height - 1], 14, fill=(255, 244, 222, 255))
    tag = ('単語' if lv.startswith('lv') else '熟語') + {'lv1': '・共通6割', 'lv2': '・共通8割', 'lv3': '・2次', 'lv4': '・2次追加'}.get(lv, '')
    f1 = font(FONT_BLACK, fs); f2 = font(FONT_BOLD, round(fs * 0.8)); f3 = font(FONT_BOLD, round(fs * 0.62))
    d.text((16, (im.height - fs) / 2 - fs * 0.12), f'No.{no}', font=f3, fill=(170, 100, 20))
    d.text((round(fs * 3.3), (im.height - fs) / 2 - fs * 0.18), base, font=f1, fill=NAVY)
    d.text((round(fs * 3.3) + d.textlength(base, font=f1) + 22, (im.height - fs * 0.8) / 2 - fs * 0.12), ja, font=f2, fill=(80, 90, 110))
    tw = d.textlength(tag, font=f3); d.rounded_rectangle([im.width - tw - 34, im.height / 2 - fs * 0.5, im.width - 12, im.height / 2 + fs * 0.5], 10, fill=(222, 234, 252, 255))
    d.text((im.width - tw - 23, im.height / 2 - fs * 0.42), tag, font=f3, fill=BLUE)
    rows.append(pil_to_bgra(im))
  ph = head.shape[0] + 30 + rh * len(rows); bg = panel_img(pw, ph, 26, (255, 255, 255, 246))
  px = dx + (dw - pw) / 2 if panel_x is None else dx + dw * panel_x; py = dy + dh * panel_y
  def fn(cv, lt):
    for (x, y, w, h, t0, *_ ) in items:
      u = smooth((lt - t0) / 0.25)
      if u <= 0: continue
      x0, y0, x1, y1 = int(x - 5), int(y - 1), int(x + w + 5), int(y + h + 1)
      sub = cv[max(0, y0):y1, max(0, x0):x1]
      if sub.size:
        over = np.empty_like(sub); over[:] = (80, 200, 255)
        sub[:] = cv2.addWeighted(sub, 1 - 0.45 * u, over, 0.45 * u, 0)
        cv2.rectangle(cv, (x0, y1 - max(3, int(4 * scale))), (int(x0 + (x1 - x0) * u), y1), (31, 154, 242), -1)
    a0 = smooth((lt - start + 0.35) / 0.35)
    if a0 > 0:
      blit(cv, bg, px, py + 30 * (1 - a0), a0); blit(cv, head, px + 22, py + 16 + 30 * (1 - a0), a0)
    for i, ((*_, t0, base, lv, no, ja), im) in enumerate(zip(items, rows)):
      u = ease_out(clamp01((lt - t0) / 0.35))
      if u > 0: blit(cv, im, px + 20 + 40 * (1 - u), py + head.shape[0] + 24 + i * rh, u)
  return Func(fn)

def outro(L, dur, qr=False, credits=None, name='outro', xin=0.6):
  W, H = L['W'], L['H']; wide = W > H; S = L['card']; lay = []
  cx = W * (0.5 if not wide else 0.36)
  y = H * (0.17 if not wide else 0.10)
  t = text_img(f'英単語・英熟語 {N_ALL:,}語', round(S * 0.6), (255, 230, 190), fnt=FONT_BOLD)
  lay.append(Sprite(t, cx, y, at=0.1, anim='up', dur=0.5, anchor='top')); y += t.shape[0] + 6
  t = text_img('覚える・解く・読む・勝つ。', round(S * 0.78), WHITE, hl='勝つ', hl_mode='color')
  lay.append(Sprite(t, cx, y, at=0.25, anim='up', dur=0.5, anchor='top')); y += t.shape[0] + 30
  lp = logo_pill(round(W * (0.46 if not wide else 0.27)))
  lay.append(Sprite(lp, cx, y + lp.shape[0] / 2, at=0.45, anim='zoom', dur=0.7)); y += lp.shape[0] + 40
  t2 = text_img('App Store・Google Play で\n「マナトビ」と検索', round(S * 0.5), WHITE, fnt=FONT_BOLD, hl='マナトビ', hl_mode='color')
  lay.append(Sprite(t2, cx, y, at=0.9, anim='up', dur=0.5, anchor='top')); y += t2.shape[0] + 6
  lay.append(Sprite(pill_img('無料（広告表示あり）', round(S * 0.36), fg=NAVY, bg=WHITE), cx, y + 8, at=1.2, anim='fade', dur=0.5, anchor='top'))
  if qr:
    qs = round(H * 0.22)
    for i, (p, lab) in enumerate((('docs/business_overview/img/qr_appstore.png', 'App Store'), ('docs/business_overview/img/qr_googleplay.png', 'Google Play'))):
      q = Image.open(A(p)).convert('RGBA').resize((qs, qs), Image.LANCZOS)
      bx = Image.new('RGBA', (qs + 24, qs + 64), (0, 0, 0, 0)); ImageDraw.Draw(bx).rounded_rectangle([0, 0, bx.width - 1, bx.height - 1], 18, fill=WHITE)
      bx.alpha_composite(q, (12, 12)); d = ImageDraw.Draw(bx); f = font(FONT_BOLD, 26); tw = d.textlength(lab, font=f); d.text(((bx.width - tw) / 2, qs + 18), lab, font=f, fill=NAVY)
      lay.append(Sprite(pil_to_bgra(bx), W * 0.70 + i * (qs + 60), H * 0.30, at=1.4 + i * 0.15, anim='pop', dur=0.5))
    lay.append(mascot(A('public/mascots/trophy.webp'), round(H * 0.30), W * 0.80, H * 0.66, at=0.5))
  else:
    lay.append(mascot(A('public/mascots/trophy.webp'), round(H * 0.20), W * 0.5, H * 0.80, at=0.5))
  if credits:
    c = text_img(credits, 22 if wide else 24, (220, 228, 240), fnt=FONT_BOLD, line_gap=1.45, pad=10)
    lay.append(Sprite(c, W / 2, H - c.shape[0] - 6, at=1.6, anim='fade', dur=0.6, anchor='top'))
  return Shot(dur, lay, bg_blue(L), xin=xin, name=name)

def message(L, lines, dur, hl, name='message', xin=0.6, sub=None):
  W, H = L['W'], L['H']; wide = W > H
  lay, y = lines_up(L, lines, H * (0.28 if not wide else 0.26), L['card'], hl=hl, at=0.3, step=0.7, cx=W * (0.5 if not wide else 0.40))
  if sub: lay.append(Sprite(text_img(sub, round(L['card'] * 0.42), (255, 230, 190), fnt=FONT_BOLD), W * (0.5 if not wide else 0.40), y + 24, at=0.3 + len(lines) * 0.7, anim='fade', dur=0.6, anchor='top'))
  lay.append(mascot(A('public/mascots/happy.webp'), round(H * (0.24 if not wide else 0.52)), W * (0.5 if not wide else 0.80), H * (0.76 if not wide else 0.56), at=0.2))
  return Shot(dur, lay, bg_navy(L), xin=xin, name=name)

def ev_quiz(oks, taps=()):
  return [(t, 'tap', 0.4) for t in taps] + [(t, 'correct', 0.8) for t in oks] + [(t + 0.05, 'combo', 0.45) for t in oks[1:]]
def ev_battle(b, answers):
  e = [(t, 'countdown', 0.5) for t in b['ticks']] + [(b['start'], 'start', 0.8)]
  e += [(a, 'tap', 0.45) for a in answers] + [(t, 'correct', 0.85) for t in b['ok']] + [(t + 0.05, 'combo', 0.45) for t in b['ok'][1:]]
  e += [(b['final'], 'final', 0.65), (b['finish'], 'timeup', 0.5), (b['win'], 'win', 0.8), (b['mission'], 'badge', 0.6)]
  return e

# ---------------- 台本：リール（9:16・約75秒） ----------------
def reel(L):
  W, H = L['W'], L['H']; S = []
  S.append(sc_pain(L, 4.4))
  S.append(sc_debate(L, 4.4))
  S.append(sc_answer(L, 4.8))
  S.append(sc_roadmap(L, 4.2))
  ph, qz, rd, bt = mp4(PH, 'wordbook'), mp4(PH, 'quiz'), mp4(PH, 'reading'), mp4(PH, 'battle')
  # STEP1 覚える
  S.append(full(L, ph, 3.5, 8.6, PHONE_SRC, roi=[(0, (0, 100, 860, 1700)), (3.4, (0, 120, 860, 1500))], speed=1.45, ev=[(t, 'tap', 0.45) for t in WB['taps'][1:5]],
                layers=[road(L, 0), caption(L, '目標を選んで、100語ずつ', hl='100語ずつ', step='STEP 1  覚える')], xin=0.25, kind='slide', name='s1a'))
  S.append(full(L, ph, 12.45, 18.6, PHONE_SRC, roi=[(0, (0, 140, 860, 1640)), (4.4, (0, 140, 860, 1300))], speed=1.35,
                ev=[(t, 'coin', 0.5) for t in WB['taps'][5:9]] + [(t, 'tap', 0.45) for t in WB['taps'][9:12]],
                layers=[road(L, 0, anim=None), caption(L, '覚えたら✓ 意味を隠して自分テスト', hl='自分テスト', step='STEP 1  覚える', at=-1)], xin=0.15, name='s1b'))
  # STEP2 演習
  S.append(full(L, qz, 6.6, 12.1, PHONE_SRC, roi=[(0, (0, 140, 860, 1700))], ev=ev_quiz(QZ_OK[:2], QZ['taps'][2:4]),
                layers=[road(L, 1), caption(L, '4択で、テンポよく', hl='テンポよく', step='STEP 2  演習')],
                punch=[to_out(QZ_OK[0], 6.6), to_out(QZ_OK[1], 6.6)], xin=0.25, kind='slide', name='s2a'))
  S.append(full(L, qz, 14.6, 26.2, PHONE_SRC, roi=[(0, (0, 140, 860, 1700)), (4.8, (40, 200, 820, 1400))], speed=2.4, ev=ev_quiz(QZ_OK[2:]),
                layers=[road(L, 1, anim=None), caption(L, '正解を重ねて、コンボ', hl='コンボ', step='STEP 2  演習', at=-1)],
                punch=[to_out(t, 14.6, 2.4) for t in QZ_OK[2:]], xin=0.1, name='s2b'))
  # STEP3 長文
  rroi = (0, 120, 860, 1640)
  S.append(full(L, rd, 5.9, 10.15, PHONE_SRC, roi=[(0, rroi)], freeze=10.1,
                layers=[road(L, 2), caption(L, '覚えた単語が、長文に出てくる', hl='長文', step='STEP 3  長文'),
                        reading_hl(L, RECT, PHONE_SRC, rroi, 0.9, step=0.5, scale=1.15)], xin=0.25, kind='slide', name='s3a'))
  S.append(full(L, rd, 10.15, 15.6, PHONE_SRC, roi=[(0, rroi)], speed=1.25, ev=[(10.25, 'tap', 0.45), (RD['answers'][0], 'tap', 0.45), (RD_OK, 'correct', 0.85)],
                layers=[road(L, 2, anim=None), caption(L, '読めたら、内容一致の4択', hl='内容一致', step='STEP 3  長文', at=-1)],
                punch=[to_out(RD_OK, 10.15, 1.25)], xin=0.15, name='s3b'))
  # STEP4 対戦
  broi = (0, 0, 860, 1520)
  S.append(full(L, bt, 3.4, 9.7, PHONE_SRC, roi=[(0, (0, 100, 860, 1700))], speed=2.0, ev=[(t, 'tap', 0.45) for t in BT['taps'][1:7]],
                layers=[road(L, 3), caption(L, '覚えた単語で、勝負', hl='勝負', step='STEP 4  対戦')], xin=0.25, kind='slide', name='s4a'))
  S.append(full(L, bt, 12.9, B['start'] + 0.05, PHONE_SRC, roi=[(0, (0, 150, 860, 1400))], ev=ev_battle(B, BT['answers']),
                layers=[road(L, 3, anim=None)], xin=0.15, name='countdown'))
  S.append(full(L, bt, B['start'] + 0.55, 23.0, PHONE_SRC, roi=[(0, broi), (5.0, (30, 0, 830, 1350))], speed=1.25, ev=ev_battle(B, BT['answers']),
                layers=[road(L, 3, anim=None), caption(L, '早押し4択', hl='早押し', step='STEP 4  対戦')], kind='flash', xin=0.12, flash=[0.0],
                punch=[0.0, to_out(B['ok'][0], B['start'] + 0.55, 1.25)], name='b1'))
  for i, (a, b) in enumerate([(27.9, 29.7), (34.5, 36.2), (40.8, 42.5)]):
    S.append(full(L, bt, a, b, PHONE_SRC, roi=[(0, broi), (b - a, (40, 40, 820, 1400))], ev=ev_battle(B, BT['answers']), xin=0.08,
                  kind='flash' if i == 0 else 'fade', punch=[to_out(B['ok'][i + 1], a)], name=f'mont{i}'))
  S.append(full(L, bt, 44.6, 48.6, PHONE_SRC, roi=[(0, broi)], speed=1.15, ev=ev_battle(B, BT['answers']), xin=0.1, kind='flash', flash=[0.0],
                punch=[to_out(B['ok'][4], 44.6, 1.15)], layers=[road(L, 3, anim=None), caption(L, 'ラスト1問', hl='ラスト', step='STEP 4  対戦')], name='finalq'))
  S.append(full(L, bt, 52.25, 54.7, PHONE_SRC, roi=[(0, broi)], ev=ev_battle(B, BT['answers']), xin=0.1,
                shake=[to_out(B['finish'], 52.25)], flash=[to_out(B['finish'], 52.25)], name='finish'))
  S.append(full(L, bt, 54.7, 59.2, PHONE_SRC, roi=[(0, (0, 0, 860, 1700)), (4.5, (40, 0, 820, 1450))], ev=ev_battle(B, BT['answers']), xin=0.15,
                layers=[road(L, 4, anim=None), caption(L, '勝てたら、ミッションも達成', hl='ミッション', at=1.9)], name='victory'))
  S.append(message(L, ['こなすだけで、', '全部の単語へ。'], 4.6, '全部の単語', sub='もう、単語帳選びで迷わない。'))
  S.append(outro(L, 5.8, xin=0.5))
  return S

# ---------------- 台本：ストーリーズ（9:16・約28秒・上下は UI の分だけあける） ----------------
def story(L):
  W, H = L['W'], L['H']; S = []
  S.append(sc_pain(L, 2.9))
  S.append(sc_answer(L, 3.9))
  ph, qz, rd, bt = mp4(PH, 'wordbook'), mp4(PH, 'quiz'), mp4(PH, 'reading'), mp4(PH, 'battle')
  rroi = (0, 120, 860, 1640)
  S.append(full(L, ph, 12.45, 16.6, PHONE_SRC, roi=[(0, (0, 140, 860, 1640))], speed=1.6, ev=[(t, 'coin', 0.5) for t in WB['taps'][5:9]],
                layers=[road(L, 0), caption(L, '覚える', step='STEP 1')], xin=0.2, kind='slide', name='s1'))
  S.append(full(L, qz, 6.9, 12.0, PHONE_SRC, roi=[(0, (0, 140, 860, 1700))], speed=1.8, ev=ev_quiz(QZ_OK[:2]),
                layers=[road(L, 1), caption(L, '4択で演習', hl='演習', step='STEP 2')], punch=[to_out(QZ_OK[0], 6.9, 1.8), to_out(QZ_OK[1], 6.9, 1.8)], xin=0.12, name='s2'))
  S.append(full(L, rd, 6.4, 9.2, PHONE_SRC, roi=[(0, rroi)], layers=[road(L, 2), caption(L, '長文で使う', hl='長文', step='STEP 3'),
                reading_hl(L, RECT, PHONE_SRC, rroi, 0.2, step=0.32, scale=1.15)], xin=0.12, name='s3'))
  S.append(full(L, bt, 14.4, B['start'] + 0.05, PHONE_SRC, roi=[(0, (0, 150, 860, 1400))], ev=ev_battle(B, BT['answers']),
                layers=[road(L, 3), caption(L, '対戦で勝つ', hl='勝つ', step='STEP 4')], xin=0.12, name='countdown'))
  S.append(full(L, bt, 47.0, 48.6, PHONE_SRC, roi=[(0, (0, 0, 860, 1520))], ev=ev_battle(B, BT['answers']), xin=0.08, kind='flash', flash=[0.0],
                punch=[to_out(B['ok'][4], 47.0)], name='b1'))
  S.append(full(L, bt, 52.3, 54.4, PHONE_SRC, roi=[(0, (0, 0, 860, 1520))], ev=ev_battle(B, BT['answers']), xin=0.08,
                shake=[to_out(B['finish'], 52.3)], flash=[to_out(B['finish'], 52.3)], name='finish'))
  S.append(full(L, bt, 54.7, 57.3, PHONE_SRC, roi=[(0, (0, 0, 860, 1700))], ev=ev_battle(B, BT['answers']), xin=0.12, name='victory'))
  S.append(outro(L, 4.8, xin=0.4))
  return S

# ---------------- 台本：YouTube（16:9・パソコン版を中心に） ----------------
def youtube(L):
  W, H = L['W'], L['H']; S = []
  S.append(sc_pain(L, 4.6))
  S.append(sc_debate(L, 5.0))
  S.append(sc_answer(L, 6.4, table=True))
  S.append(sc_roadmap(L, 4.6))
  pw, pq, pr, pb = mp4(PC, 'wordbook'), mp4(PC, 'quiz'), mp4(PC, 'reading'), mp4(PC, 'battle')
  app = (430, 0, 1490, 1080)
  S.append(full(L, pw, 3.4, 8.5, PC_SRC, roi=[(0, app), (4.0, (440, 0, 1300, 480))], speed=1.2, ev=[(t, 'tap', 0.45) for t in WBp['taps'][1:5]],
                layers=[road(L, 0), caption(L, '目標を選ぶだけで、範囲が決まる', hl='目標を選ぶ', step='STEP 1  覚える', y=H - 128)], xin=0.3, kind='slide', name='s1a'))
  S.append(full(L, pw, 8.6, 15.4, PC_SRC, roi=[(0, app), (3.6, (440, 60, 1270, 520)), (6.8, (440, 60, 1270, 520))], speed=1.1,
                ev=[(t, 'coin', 0.5) for t in WBp['taps'][5:9]],
                layers=[road(L, 0, anim=None), caption(L, '100語ずつめくって、覚えたら✓', hl='100語ずつ', step='STEP 1  覚える', at=-1, y=H - 128)], xin=0.15, name='s1b'))
  ph_i = V(mp4(PH, 'idiom'), 5.2, (1350, 160, 400, 867), PHONE_SRC, device='phone')
  pc_h = V(pw, 15.0, (100, 200, 1140, 641), PC_SRC, roi=[(0, (430, 0, 1490, 600))], device='pc')
  S.append(Shot(4.2, [pc_h, ph_i, road(L, 0, anim=None), label('意味を隠して自分テスト', 110, 146), label(f'熟語も {N_IDIOM:,}語', 1350, 106, orange=True),
                      caption(L, 'パソコンでも、スマホでも', hl='スマホ', y=H - 110)], bg_navy(L), xin=0.25, name='s1c'))
  pcq = V(pq, 6.8, (80, 180, 1180, 664), PC_SRC, roi=[(0, (440, 0, 1500, 600))], device='pc', speed=1.25, ev=ev_quiz(QZp_OK[:4]))
  phq = V(mp4(PH, 'quiz'), 6.6, (1390, 150, 390, 845), PHONE_SRC, device='phone', speed=1.25)
  S.append(Shot((20.0 - 6.8) / 1.25, [pcq, phq, road(L, 1), caption(L, '4択で、テンポよく。正解でコンボ', hl='コンボ', step='STEP 2  演習', y=H - 120, x=W * 0.36)], bg_navy(L),
                xin=0.3, kind='slide', punch=[to_out(t, 6.8, 1.25) for t in QZp_OK[:4]], name='s2'))
  rroi = (440, 90, 1290, 560)
  S.append(full(L, pr, 5.9, 10.0, PC_SRC, roi=[(0, rroi)], freeze=9.95,
                layers=[road(L, 2), caption(L, '覚えた単語が、長文に出てくる', hl='長文', step='STEP 3  長文', y=H - 128),
                        reading_hl(L, RECTp, PC_SRC, rroi, 0.8, step=0.45, scale=0.78, panel_x=0.545, panel_w=0.44, panel_y=0.04)], xin=0.3, kind='slide', name='s3a'))
  S.append(full(L, pr, 10.0, 15.6, PC_SRC, roi=[(0, (430, 60, 1300, 560)), (2.0, (430, 60, 1300, 560)), (3.2, app)], ev=[(RDp['answers'][0], 'tap', 0.45), (RDp_OK, 'correct', 0.85)],
                layers=[road(L, 2, anim=None), caption(L, '内容一致の4択。解説に根拠の英文と和訳', hl='根拠の英文', step='STEP 3  長文', at=-1, y=H - 128)],
                punch=[to_out(RDp_OK, 10.0)], xin=0.15, name='s3b'))
  S.append(full(L, pb, 1.9, 9.4, PC_SRC, roi=[(0, app)], speed=1.8, ev=[(t, 'tap', 0.45) for t in BTp['taps'][1:7]],
                layers=[road(L, 3), caption(L, '英単語・英熟語で、AI・友だち・全国と対戦', hl='対戦', step='STEP 4  対戦', y=H - 128)], xin=0.3, kind='slide', name='s4a'))
  S.append(full(L, pb, 12.8, Bp['start'] + 0.05, PC_SRC, roi=[(0, (430, 60, 1650, 1000))], ev=ev_battle(Bp, BTp['answers']), layers=[road(L, 3, anim=None)], xin=0.15, name='countdown'))
  S.append(full(L, pb, Bp['start'] + 0.6, 23.0, PC_SRC, roi=[(0, (380, 120, 1700, 960)), (5.5, (420, 200, 1660, 900))], speed=1.15, ev=ev_battle(Bp, BTp['answers']),
                kind='flash', xin=0.12, flash=[0.0], punch=[0.0, to_out(Bp['ok'][0], Bp['start'] + 0.6, 1.15)],
                layers=[caption(L, '早押し4択・全5問', hl='早押し', y=H - 128)], name='b1'))
  for i, (a, b) in enumerate([(29.6, 31.9), (36.9, 39.1), (45.4, 47.6)]):
    S.append(full(L, pb, a, b, PC_SRC, roi=[(0, (420, 200, 1660, 900)), (b - a, (470, 230, 1610, 870))], ev=ev_battle(Bp, BTp['answers']), xin=0.08,
                  kind='flash' if i == 0 else 'fade', punch=[to_out(Bp['ok'][i + 1], a)], name=f'mont{i}'))
  S.append(full(L, pb, 50.7, 54.1, PC_SRC, roi=[(0, (420, 200, 1660, 900))], ev=ev_battle(Bp, BTp['answers']), xin=0.1, kind='flash', flash=[0.0],
                punch=[to_out(Bp['ok'][4], 50.7)], layers=[caption(L, 'ラスト1問', hl='ラスト', y=H - 128)], name='finalq'))
  S.append(full(L, pb, 58.0, 60.6, PC_SRC, roi=[(0, (420, 160, 1660, 900))], ev=ev_battle(Bp, BTp['answers']), xin=0.1, shake=[to_out(Bp['finish'], 58.0)], flash=[to_out(Bp['finish'], 58.0)], name='finish'))
  pv = V(pb, 60.6, (90, 180, 1180, 664), PC_SRC, roi=[(0, app)], device='pc', ev=ev_battle(Bp, BTp['answers']))
  phv = V(mp4(PH, 'battle'), 54.7, (1390, 150, 390, 845), PHONE_SRC, device='phone')
  S.append(Shot(5.4, [pv, phv, caption(L, '勝てたら、ミッションも達成', hl='ミッション', y=H - 110, at=1.6)], bg_navy(L), xin=0.15, name='victory'))
  S.append(message(L, ['こなすだけで、', '全部の単語へ。'], 5.2, '全部の単語', sub='もう、単語帳選びで迷わない。'))
  S.append(outro(L, 10.5, qr=True, credits=CREDITS_LINE, xin=0.5))
  return S

CREDITS_LINE = ('BGM：「誕生」（マナトビ）／「夕凪」作曲 やっすん・「風の列車」作曲 坂田白　配布元：創作堂さくら紅葉 https://yukizakura.net/\n'
                '「カナリアスキップ」作曲 まんぼう二等兵（OpenTracks）　効果音：マナトビ')

# ---------------- 音 ----------------
def collect(shots):
  sfx = []
  for s in shots:
    for Lr in s.layers:
      if not isinstance(Lr, Video): continue
      end_local = Lr.until if Lr.until is not None else s.dur
      src_end = Lr.t0 + (end_local - Lr.at) * Lr.speed
      for (st, n, g) in getattr(Lr, 'ev', []):
        if Lr.t0 <= st < src_end: sfx.append((s.start + Lr.at + (st - Lr.t0) / Lr.speed, SFX(n), g))
  return sorted(sfx)

def by(shots, name): return next(s for s in shots if s.name == name)

def music_plan(shots, total):
  """4曲：夕凪（しんどい）→ 誕生（答え）→ 風の列車（覚える〜長文）→ カナリアスキップ（対戦）→ 誕生（しめ）"""
  m = []
  ans = by(shots, 'answer'); first_step = next(s for s in shots if s.name.startswith('s1'))
  cd = by(shots, 'countdown'); start_at = cd.start + cd.dur
  fin = by(shots, 'finish'); out = by(shots, 'outro')
  m.append(dict(f=WAITING, src=0.0, at=0.0, dur=ans.start + 0.35, gain=1.5, fi=0.4, fo=0.45))
  t_end1 = first_step.start + 0.6
  m.append(dict(f=TANJOU, src=22.95, at=ans.start, dur=t_end1 - ans.start, gain=0.85, fi=0.04, fo=0.8))
  tr_at = first_step.start - 1.6; tr_end = cd.start + 0.4
  m.append(dict(f=TRAIN, src=7.0 - 1.6, at=tr_at, dur=tr_end - tr_at, gain=1.55, fi=1.2, fo=0.9))
  c_at = max(cd.start, start_at - 7.0); c_end = fin.start + fin.dur + 0.6
  m.append(dict(f=CANARY, src=7.0 - (start_at - c_at), at=c_at, dur=c_end - c_at, gain=1.75, fi=0.5, fo=1.0))
  s_at = c_end - 1.2; src2 = max(0.0, 123.1 - (out.start + 0.45 - s_at))
  m.append(dict(f=TANJOU, src=src2, at=s_at, dur=min(total - s_at, 134.8 - src2), gain=0.75, fi=1.2, fo=1.6))
  return m

def sheet(name, L, shots, step=1.0):
  total = layout(shots); ims = []; T = 0.0; w = 216
  while T < total:
    act = [s for s in shots if s.start <= T < s.start + s.dur][-1]
    fr = act.render(T - act.start, L['W'], L['H']); h = round(L['H'] * w / L['W'])
    im = cv2.resize(fr, (w, h), interpolation=cv2.INTER_AREA); cv2.putText(im, f'{T:.1f}', (4, 22), 0, 0.7, (0, 0, 255), 2)
    ims.append(im); T += step
  cols = 10 if L['H'] > L['W'] else 8; rows = (len(ims) + cols - 1) // cols; h = ims[0].shape[0]
  out = np.full((rows * h, cols * w, 3), 128, np.uint8)
  for i, im in enumerate(ims): out[(i // cols) * h:(i // cols + 1) * h, (i % cols) * w:(i % cols + 1) * w] = im
  cv2.imwrite(os.path.join(TMP, name + '_sheet.jpg'), out, [cv2.IMWRITE_JPEG_QUALITY, 80])
  for s in shots: s.close()
  print('sheet', name, f'{total:.1f}s', ' '.join(f'{s.name}@{s.start:.1f}' for s in shots), flush=True)

def build(name, kind, L, shots):
  if '--sheet' in sys.argv: return sheet(name, L, shots, float(os.environ.get('SHEET_STEP', '1')))
  total = layout(shots)
  print(name, f'{total:.1f}s', ' '.join(f'{s.name}@{s.start:.1f}' for s in shots), flush=True)
  sfx = collect(shots); music = music_plan(shots, total)
  vid = os.path.join(TMP, name + '_v.mp4'); aud = os.path.join(TMP, name + '_a.m4a')
  if '--audio-only' in sys.argv and os.path.exists(vid): print('  映像はそのまま（音だけ作り直し）', flush=True)
  else: render_video(shots, L['W'], L['H'], vid, crf=21 if DRAFT else 17, preset='veryfast' if DRAFT else 'medium')
  js = mix_audio(total, music, [], sfx, aud, TMP)
  final = os.path.join(OUT, name + '.mp4'); mux(vid, aud, final)
  if kind == 'youtube':
    titles = {'pain': 'オープニング：英単語、しんどい？', 'answer': '市販の単語帳を網羅した、独自の単語帳', 's1a': 'STEP1 覚える（英単語帳）',
              's2': 'STEP2 演習（4択）', 's3a': 'STEP3 長文（英文解釈）', 'countdown': 'STEP4 対戦（英単語・英熟語）', 'message': 'エンディング'}
    rows = [(s.start, titles[s.name]) for s in shots if s.name in titles]; rows[0] = (0.0, rows[0][1]); keep = [rows[0]]
    for r in rows[1:]:
      if r[0] - keep[-1][0] >= 10 and total - r[0] >= 10: keep.append(r)
    open(os.path.join(OUT, name + '_CHAPTERS.txt'), 'w').write(''.join(f'{int(t // 60)}:{int(t % 60):02d} {n}\n' for t, n in keep))
  json.dump(dict(total=total, chapters=[(s.start, s.name) for s in shots], music=music, sfx=[(a, os.path.basename(f), g) for a, f, g in sfx], loudness=js),
            open(os.path.join(TMP, name + '_timeline.json'), 'w'), ensure_ascii=False, indent=1)
  print('done', final, round(total, 2), flush=True)

FR = os.environ.get('FRAMES')
if FR:
  ts = [float(x) for x in FR.split(',')]
  for k, fn in (('reel', reel), ('story', story), ('youtube', youtube)):
    if k not in WHICH: continue
    L = LAYOUTS[k]; shots = fn(L); layout(shots); out = []
    for T in ts:
      act = [s for s in shots if s.start <= T < s.start + s.dur][-1]
      out.append(cv2.resize(act.render(T - act.start, L['W'], L['H']), (L['W'] // 2, L['H'] // 2), interpolation=cv2.INTER_AREA))
    for s in shots: s.close()
    cv2.imwrite(os.path.join(TMP, k + '_frames.jpg'), np.hstack(out), [cv2.IMWRITE_JPEG_QUALITY, 85])
  raise SystemExit
if 'reel' in WHICH: build('vocab_reel_9x16', 'reel', LAYOUTS['reel'], reel(LAYOUTS['reel']))
if 'story' in WHICH: build('vocab_story_9x16', 'story', LAYOUTS['story'], story(LAYOUTS['story']))
if 'youtube' in WHICH: build('vocab_youtube_16x9', 'youtube', LAYOUTS['youtube'], youtube(LAYOUTS['youtube']))
