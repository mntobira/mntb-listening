# 宣伝動画の台本（Instagram リール 9:16 ／ フィード 4:5 ／ YouTube 16:9）
#   python3 store-assets/_tools/promo_cut.py <出力dir> [reel] [feed] [youtube] [--draft] [--sheet]
#
# ■ 構成（「盛り上がる所」と「感動する所」を分ける）
#   1. 起動（感動・静）  アプリを開いた時のエンブレムが消えていく → タイトル。BGM「誕生」の静かな前奏 → タイトルで曲が広がる
#   2. ひとこと（感動）  「イヤホンをつけて、1問だけ聞いてみよう。」
#   3. 第2問を解く       スマホ（YouTube はパソコンとスマホ並べて）で第2問。問題の音声＋英語字幕（単語が読まれた順に光る）
#   4. 解説の読み上げ     音声に合わせて英文が光る画面
#   5. 全国対戦（盛り上がり）スマホ（ハル）とパソコン（ソラ）の2台で本当に対戦した録画。
#        相手さがし・カウントダウン = 待ち時間の曲「夕凪」→ START! と同時に「カナリアスキップ」のサビ
#   6. 決着               FINAL QUESTION → FINISH → 勝利・ミッション達成
#   7. しめ（感動）       「誕生」の静かな間で「『聞き取れた！』を、毎日ひとつずつ。」→ 曲がもう一度広がる所でロゴ
#
# ■ 素材：record_scenes.py / record_duo.py で録った本物の操作画面だけ（動画生成AIは使っていない）
#   音：問題の音声 public/listening_audio/el2_set1_q1.mp3、効果音 public/sfx/battle（自作）、
#       BGM public/tanjou.mp3「誕生」／ public/bgm/battle/waiting.mp3「夕凪」／ battle2.mp3「カナリアスキップ」
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from promo_engine import *  # noqa: F401,F403

ROOT = os.environ.get('MNTB_ROOT') or os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
REC = os.environ.get('PROMO_REC') or os.path.join(ROOT, 'store-assets', '_footage')
args = [a for a in sys.argv[1:] if not a.startswith('--')]
OUT = args[0]; WHICH = args[1:] or ['reel', 'feed', 'youtube']
DRAFT = '--draft' in sys.argv
TMP = os.path.join(OUT, '_work'); os.makedirs(TMP, exist_ok=True)

P3, PCD, DU = (os.path.join(REC, d) for d in ('scenes3', 'scenes_pc', 'scenes_duo'))
def meta(d, n): return json.load(open(os.path.join(d, n + '.json')))
def mp4(d, n): return os.path.join(d, n + '.mp4')
A = lambda *p: os.path.join(ROOT, *p)
SFX = lambda n: A('public/sfx/battle', n + '.mp3')
VOICE = A('public/listening_audio/el2_set1_q1.mp3'); VOICE_DUR = 13.7
TANJOU, WAITING, BATTLE2 = A('public/tanjou.mp3'), A('public/bgm/battle/waiting.mp3'), A('public/bgm/battle/battle2.mp3')
PHONE_SRC, PC_SRC, DUO_PC_SRC = (860, 1864), (1920, 1080), (1600, 900)

# ---------------- 録画の中の時刻（record_*.json と、画面の変化から測ったもの） ----------------
LA = meta(P3, 'launch'); Q2 = meta(P3, 'q2'); QR = meta(P3, 'q2_read')
LAP = meta(PCD, 'launch'); Q2P = meta(PCD, 'q2'); QRP = meta(PCD, 'q2_read'); GAP = meta(PCD, 'gacha_draw')
DUO = meta(DU, 'duo')
q2_play, q2_pick, q2_ans = Q2['play'], Q2['taps'][-2], Q2['taps'][-1]       # 8.73 / ②19.05 / 解答 20.60
q2_ok = 21.47                                                                  # 正解の演出（緑の枠）
qr_play = QR['play']                                                           # 13.89（解説の再生）
p_play, p_pick, p_ans, p_ok = Q2P['play'], Q2P['taps'][-2], Q2P['taps'][-1], 21.83
pr_play = QRP['play']
# 2台対戦（同じ時計）
D_MATCHED, D_START = 7.63, 17.17
D_TICKS = [9.0, 10.07, 11.03, 12.03, 13.03, 14.03, 15.03, 16.03]               # 7 → 1（START の丸は 16.2）
PH_OK = [22.67, 29.27, 38.40, 45.43, 51.77, 59.77, 67.13, 73.40, 82.17, 88.13]  # スマホ：正解の演出が出た時刻
PC_OK = [22.53, 29.37, 37.77, 50.77, 58.60, 65.23, 71.37, 79.67, 85.43]          # パソコン（4問目は不正解）
PH_ANS = [a[2] for a in DUO['answers'] if a[0] == 'phone']; PC_ANS = [a[2] for a in DUO['answers'] if a[0] == 'pc']
D_FINALQ, D_FINISH, D_RESULT, D_MISSION = 82.7, 89.2, 89.8, 90.85

# 問題の音声の単語の時刻（public/read_along/listening_audio/el2_set1_q1.json）
_ra = json.load(open(A('public/read_along/listening_audio/el2_set1_q1.json')))
JP = ['サンドイッチと一緒に、何かお飲み物はいかがですか？', 'コーヒーをお願いします。砂糖なしで、ミルクは入れて。',
      'アイスですか、ホットですか？', 'ホットでお願いします。']
KARAOKE = [(ln['who'], [(w[0], w[1] / 1000, w[2] / 1000) for w in ln['w']], JP[i]) for i, ln in enumerate(_ra['lines'])]

# ---------------- レイアウト ----------------
LAYOUTS = {
  'reel': dict(W=1080, H=1920, cap_y=118, cap=64, card=88, kara_y=1492, kara_w=1000,
               split=dict(pc=(60, 360, 960, 540), ph=(337, 1010, 406, 880), vs=(540, 960), lab_pc=(70, 312), lab_ph=(90, 1380)),
               pc_big=(20, 560, 1040, 760), focus=(30, 640, 1020, 600)),
  'feed': dict(W=1080, H=1350, cap_y=40, cap=54, card=76, kara_y=1035, kara_w=1000,
               split=dict(pc=(28, 420, 716, 500), ph=(780, 300, 280, 607), vs=(748, 300), lab_pc=(38, 370), lab_ph=(800, 925)),
               pc_big=(20, 200, 1040, 760), focus=(30, 330, 1020, 560)),
  'youtube': dict(W=1920, H=1080, cap_y=34, cap=50, card=84, kara_y=900, kara_w=1240,
                  split=dict(pc=(90, 170, 1180, 664), ph=(1440, 150, 381, 826), vs=(1352, 520), lab_pc=(100, 118), lab_ph=(1440, 100)),
                  pc_big=(0, 0, 1920, 1080), focus=(160, 170, 1600, 780)),
}

def fit(roi, dw, dh, sw, sh):
  """roi（元動画の画素の箱）が収まり、dest を埋める切り抜き (cx, cy, cw)"""
  x0, y0, x1, y1 = roi; a = dw / dh
  cw = min(max(x1 - x0, (y1 - y0) * a), sw, sh * a); ch = cw / a
  cx = min(max((x0 + x1) / 2, cw / 2), sw - cw / 2); cy = min(max((y0 + y1) / 2, ch / 2), sh - ch / 2)
  return (cx, cy, cw)

def cams(keys, dest, src): return [(t, fit(r, dest[2], dest[3], *src)) for t, r in keys]

_BG = {}
def bg_blue(L):
  k = ('blue', L['W'], L['H'])
  if k not in _BG: _BG[k] = gradient(L['W'], L['H'], BLUE, BLUE_D, glow=(L['W'] * 0.5, L['H'] * 0.42, L['W'] * 0.55, (70, 130, 215), 0.55))
  return _BG[k]
def bg_navy(L):
  k = ('navy', L['W'], L['H'])
  if k not in _BG: _BG[k] = gradient(L['W'], L['H'], (22, 40, 66), NAVY, glow=(L['W'] * 0.5, L['H'] * 0.45, L['W'] * 0.6, BLUE, 0.6))
  return _BG[k]
def bg_cream(L):
  k = ('cream', L['W'], L['H'])
  if k not in _BG: _BG[k] = gradient(L['W'], L['H'], CREAM, CREAM_D)
  return _BG[k]
def bg_black(L): return np.zeros((L['H'], L['W'], 3), np.uint8)

def cap_img(text, size, hl=None, step=None):
  """見出し：濃紺の半透明の板＋白い文字（hl はオレンジ）。step があれば上にオレンジの札"""
  t = Image.fromarray(cv2.cvtColor(text_img(text, size, WHITE, hl=hl, hl_mode='color', pad=round(size * 0.42)), cv2.COLOR_BGRA2RGBA))
  sp = Image.fromarray(cv2.cvtColor(pill_img(step, round(size * 0.5), fg=NAVY, bg=ORANGE), cv2.COLOR_BGRA2RGBA)) if step else None
  top = sp.height // 2 + 4 if sp else 0
  W = max(t.width, sp.width if sp else 0) + 8; H = t.height + top + 4
  im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); x = (W - t.width) // 2
  ImageDraw.Draw(im).rounded_rectangle([x, top, x + t.width - 1, top + t.height - 1], round(size * 0.45), fill=(16, 28, 46, 222))
  im.alpha_composite(t, (x, top))
  if sp: im.alpha_composite(sp, ((W - sp.width) // 2, 0))
  return pil_to_bgra(im)

def caption(L, text, at=0.15, until=None, hl=None, step=None, y=None, size=None):
  img = cap_img(text, size or L['cap'], hl, step)
  return Sprite(img, L['W'] / 2, y if y is not None else L['cap_y'], at=at, until=until, anim='up', dur=0.4, anchor='top')

def label(text, x, y, orange=False, at=0.1, size=30):
  img = pill_img(text, size, fg=NAVY if orange else WHITE, bg=ORANGE if orange else (16, 28, 46), border=None)
  return Sprite(img, x, y, at=at, anim='fade', dur=0.3, anchor='tl')

# ---------------- ショットを作る道具 ----------------
def V(path, t0, dest, src, roi=None, speed=1.0, at=0.0, until=None, device=None, ev=(), voice=None, **kw):
  cam = cams(roi, dest, src) if roi else None
  v = Video(path, t0, dest, cam=cam, speed=speed, at=at, until=until, device=device, **kw)
  v.ev = list(ev); v.voice = voice
  return v

def ev_duo(t0, t1, phone=True, pc=True, ph_gain=1.0, pc_gain=0.6):
  """2台対戦の効果音（元動画の時刻で）"""
  e = []
  if phone:
    e += [(t + 0.05, 'tap', 0.5 * ph_gain) for t in PH_ANS]
    e += [(t, 'correct', 0.8 * ph_gain) for t in PH_OK]
    e += [(t + 0.05, 'combo', 0.45 * ph_gain) for t in PH_OK[1:]]
  if pc:
    e += [(t + 0.05, 'tap', 0.45 * pc_gain) for t in PC_ANS]
    e += [(t, 'correct', 0.8 * pc_gain) for t in PC_OK]
    e += [(42.75, 'wrong', 0.6 * pc_gain)]
  e += [(D_MATCHED, 'matched', 0.6)] + [(t, 'countdown', 0.5) for t in D_TICKS] + [(16.2, 'start', 0.75)]
  e += [(D_FINALQ, 'final', 0.65), (D_FINISH, 'win', 0.75), (D_MISSION, 'badge', 0.6)]
  return [x for x in e if t0 <= x[0] < t1]

def duo_split(L, t0, t1, speed=1.0, text=None, hl=None, ev_phone=True, ev_pc=True, punch=(), flash=(), xin=0.25, kind='fade', name=''):
  s = L['split']; dur = (t1 - t0) / speed
  pc = V(mp4(DU, 'duo_pc'), t0, s['pc'], DUO_PC_SRC, roi=[(0, (290, 40, 1470, 880) if s['pc'][2] / s['pc'][3] > 1.3 else (300, 30, 1460, 880))], speed=speed, device='pc', ev=ev_duo(t0, t1, phone=ev_phone, pc=ev_pc))
  ph = V(mp4(DU, 'duo_phone'), t0, s['ph'], PHONE_SRC, speed=speed, device='phone')
  layers = [pc, ph,
            label('ソラ・パソコン', *s['lab_pc']), label('ハル・スマホ', *s['lab_ph'], orange=True),
            Sprite(pill_img('VS', 40, fg=NAVY, bg=ORANGE, padx=22, pady=8), *s['vs'], at=0.05, anim='pop', dur=0.4)]
  if text: layers.append(caption(L, text, hl=hl, y=L['cap_y'] + (60 if L['H'] > 1500 else 0)))
  return Shot(dur, layers, bg_navy(L), xin=xin, kind=kind, punch=punch, flash=flash, name=name)

def to_out(t_src, t0, speed): return (t_src - t0) / speed

def card(L, lines, dur, mascot_path=None, hl=None, xin=0.5, kind='fade', bg=None, name='', sub=None, mascot_h=None):
  """ひとことの画面：行が順に浮かぶ＋とびら君がふわふわ"""
  W, H = L['W'], L['H']; tall = H > W * 1.3; wide = W > H
  layers = []; size = L['card']
  y = H * (0.30 if tall else 0.22 if not wide else 0.30)
  for i, ln in enumerate(lines):
    img = text_img(ln, size, WHITE, hl=hl, hl_mode='color', stroke=0, shadow=(0, 5, (10, 20, 40, 120)))
    cx = W * (0.5 if not wide else 0.40)
    layers.append(Sprite(img, cx, y, at=0.25 + i * 0.7, anim='up', dur=0.6, anchor='top', drift=(0, -4, 0)))
    y += img.shape[0] * 0.92
  if sub:
    img = text_img(sub, round(size * 0.46), (255, 230, 190), fnt=FONT_BOLD)
    layers.append(Sprite(img, W * (0.5 if not wide else 0.40), y + 20, at=0.25 + len(lines) * 0.7, anim='fade', dur=0.6, anchor='top'))
  if mascot_path:
    mh = mascot_h or (round(H * 0.33) if tall else round(H * 0.42) if not wide else round(H * 0.62))
    m = load_sprite(mascot_path, h=mh)
    mx, my = (W * 0.5, H - mh * 0.55 - (180 if tall else 30)) if not wide else (W * 0.78, H * 0.55)
    layers.append(Sprite(m, mx, my, at=0.1, anim='pop', dur=0.7, bob=(9, 2.6)))
  return Shot(dur, layers, bg if bg is not None else bg_blue(L), xin=xin, kind=kind, name=name)

def logo_pill(width):
  lg = Image.open(A('public/brand/manatobi-logo.png')).convert('RGBA'); s = width / lg.width
  lg = lg.resize((round(lg.width * s), round(lg.height * s)), Image.LANCZOS); pad = round(width * 0.09)
  pill = Image.new('RGBA', (lg.width + pad * 2, lg.height + pad * 2), (0, 0, 0, 0))
  ImageDraw.Draw(pill).rounded_rectangle([0, 0, pill.width - 1, pill.height - 1], pill.height // 2, fill=WHITE)
  pill.alpha_composite(lg, (pad, pad)); return pil_to_bgra(pill)

def outro(L, dur, qr=False, credits=None, name='outro', xin=0.6):
  W, H = L['W'], L['H']; wide = W > H; tall = H > W * 1.3; layers = []
  cx = W * (0.5 if not wide else 0.40)
  y = H * (0.20 if tall else 0.10 if not wide else 0.12)
  t = text_img('共通テストの\n英語リスニング', round(L['card'] * 0.95), WHITE, hl='リスニング', hl_mode='color')
  layers.append(Sprite(t, cx, y, at=0.1, anim='up', dur=0.6, anchor='top')); y += t.shape[0] + 10
  lp = logo_pill(round(W * (0.40 if not wide else 0.26)))
  layers.append(Sprite(lp, cx, y + lp.shape[0] / 2, at=0.0, anim='zoom', dur=0.7)); y += lp.shape[0] + 40
  t2 = text_img('App Store・Google Play で\n「マナトビ」と検索', round(L['card'] * 0.5), WHITE, fnt=FONT_BOLD, hl='マナトビ', hl_mode='color')
  layers.append(Sprite(t2, cx, y, at=0.7, anim='up', dur=0.5, anchor='top')); y += t2.shape[0]
  t3 = pill_img('無料（広告表示あり）', round(L['card'] * 0.36), fg=NAVY, bg=WHITE)
  layers.append(Sprite(t3, cx, y + 10, at=1.0, anim='fade', dur=0.5, anchor='top')); y += t3.shape[0] + 30
  if qr:  # 横長：右の列に QR を2つ
    qs = round(H * 0.24)
    for i, (p, lab) in enumerate((('docs/business_overview/img/qr_appstore.png', 'App Store'), ('docs/business_overview/img/qr_googleplay.png', 'Google Play'))):
      q = Image.open(A(p)).convert('RGBA').resize((qs, qs), Image.LANCZOS)
      bx = Image.new('RGBA', (qs + 24, qs + 64), (0, 0, 0, 0)); ImageDraw.Draw(bx).rounded_rectangle([0, 0, bx.width - 1, bx.height - 1], 18, fill=WHITE)
      bx.alpha_composite(q, (12, 12))
      d = ImageDraw.Draw(bx); f = font(FONT_BOLD, 28); tw = d.textlength(lab, font=f); d.text(((bx.width - tw) / 2, qs + 16), lab, font=f, fill=NAVY)
      layers.append(Sprite(pil_to_bgra(bx), W * 0.70 + i * (qs + 60), H * 0.42, at=1.3 + i * 0.15, anim='pop', dur=0.5))
  m = load_sprite(A('public/mascots/walking.webp'), h=round(H * (0.27 if tall else 0.30 if not wide else 0.62)))
  mx, my = (W * 0.5, H - m.shape[0] * 0.5 - (170 if tall else 20)) if not wide else (W * 0.80, H * 0.56)
  if wide and qr: m = load_sprite(A('public/mascots/walking.webp'), h=round(H * 0.30)); mx, my = W * 0.79, H * 0.73
  layers.append(Sprite(m, mx, my, at=0.3, anim='pop', dur=0.7, bob=(8, 2.4)))
  if credits:
    c = text_img(credits, 24, (220, 228, 240), fnt=FONT_BOLD, line_gap=1.45, pad=10)
    layers.append(Sprite(c, W / 2, H - c.shape[0] - 8, at=1.6, anim='fade', dur=0.6, anchor='top'))
  return Shot(dur, layers, bg_blue(L), xin=xin, name=name)

def phone_full(L, path, t0, t1, roi=None, speed=1.0, ev=(), voice=None, layers=(), xin=0.25, kind='fade', punch=(), flash=(), shake=(),
               zoom=None, name='', freeze=None):
  dur = (t1 - t0) / speed
  rk = [(0, r) for r in [roi]] if roi and not isinstance(roi, list) else roi
  v = V(path, t0, (0, 0, L['W'], L['H']), PHONE_SRC, roi=rk or [(0, (0, 0, 860, 1864))], speed=speed, ev=ev, voice=voice, freeze=freeze)
  return Shot(dur, [v, *layers], bg_cream(L), xin=xin, kind=kind, punch=punch, flash=flash, shake=shake, zoom=zoom, name=name)

def phone_device(L, path, t0, t1, speed=1.0, ev=(), voice=None, layers=(), xin=0.25, kind='fade', punch=(), name='', h=None, x=None, freeze=None):
  """16:9 用：スマホの枠を大きく真ん中に"""
  H = h or round(L['H'] * 0.86); w = round(H * 860 / 1864); X = x if x is not None else (L['W'] - w) // 2
  v = V(path, t0, (X, (L['H'] - H) // 2 + 10, w, H), PHONE_SRC, speed=speed, device='phone', ev=ev, voice=voice, freeze=freeze)
  return Shot((t1 - t0) / speed, [v, *layers], bg_navy(L), xin=xin, kind=kind, punch=punch, name=name)

def pc_big(L, path, t0, t1, src, roi=None, speed=1.0, ev=(), voice=None, layers=(), xin=0.25, kind='fade', punch=(), name='', device=True):
  card_mode = device and L['W'] < L['H'] * 1.2
  d = L['pc_big'] if card_mode else (0, 0, L['W'], L['H'])
  rk = [(0, roi)] if roi and not isinstance(roi, list) else roi
  v = V(path, t0, d, src, roi=rk, speed=speed, ev=ev, voice=voice, radius=28 if card_mode else 0)
  return Shot((t1 - t0) / speed, [v, *layers], bg_navy(L) if card_mode else bg_cream(L), xin=xin, kind=kind, punch=punch, name=name)


PROMO_SFX = os.path.join(TMP, 'sfx')  # promo_sfx.py で作る冒頭の効果音（無ければここで作る）
if not os.path.exists(os.path.join(PROMO_SFX, 'title_bloom.wav')):
  import subprocess as _sp
  _sp.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'promo_sfx.py'), PROMO_SFX], check=True)
def psfx(n): return os.path.join(PROMO_SFX, n + '.wav')

def philo(L, path, t0, src, dur, speed, freeze, lines, hl=None, kicker=None, sub=None, xin=0.4, kind='fade', name=''):
  """対戦をつくった理由：対戦メニューの本物の画面をゆっくり見せ、暗くした上に短い言葉"""
  W, H = L['W'], L['H']; wide = W > H
  full = (0, 0, src[0], src[1])
  tight = (src[0] * 0.06, src[1] * 0.04, src[0] * 0.94, src[1] * 0.92)
  v = V(path, t0, (0, 0, W, H), src, roi=[(0, full), (dur, tight)], speed=speed, freeze=freeze)
  def blur(cv, t):  # 本物の画面はぼかして奥に（文字を読みやすく）
    k = 1 + 2 * int(round(10 * smooth(t / 0.6)))
    if k > 1: cv[:] = cv2.GaussianBlur(cv, (k * 2 + 1, k * 2 + 1), 0)
  layers = [v, Func(blur), Fill(NAVY, lambda t: 0.80 * smooth(t / 0.6))]
  size = round(L['card'] * (0.72 if not wide else 0.78))
  imgs = [text_img(ln, size, WHITE, hl=hl, hl_mode='color', shadow=(0, 4, (8, 16, 30, 140))) for ln in lines]
  kimg = pill_img(kicker, round(size * 0.52), fg=NAVY, bg=ORANGE) if kicker else None
  simg = text_img(sub, round(size * 0.50), (255, 230, 190), fnt=FONT_BOLD) if sub else None
  hsum = sum(i.shape[0] * 0.92 for i in imgs) + (kimg.shape[0] + 24 if kimg is not None else 0) + (simg.shape[0] + 20 if simg is not None else 0)
  y = H * 0.46 - hsum / 2 + 12
  if kimg is not None:
    layers.append(Sprite(kimg, W / 2, y, at=0.15, anim='fade', dur=0.4, anchor='top')); y += kimg.shape[0] + 24
  for i, im in enumerate(imgs):
    layers.append(Sprite(im, W / 2, y, at=0.35 + i * 0.6, anim='up', dur=0.6, anchor='top', drift=(0, -3, 0))); y += im.shape[0] * 0.92
  if simg is not None:
    layers.append(Sprite(simg, W / 2, y + 20, at=0.35 + len(imgs) * 0.6, anim='fade', dur=0.6, anchor='top'))
  # 文字の下に横長の帯（はっきり読ませる）
  pw = round(max(i.shape[1] for i in imgs + ([simg] if simg is not None else [])) + 80); ph = round(hsum + 90)
  band = panel_img(min(pw, W - 20), ph, 36, (12, 22, 38, 150))
  layers.insert(3, Sprite(band, W / 2, H * 0.46, at=0.1, anim='fade', dur=0.5))
  return Shot(dur, layers, bg_navy(L), xin=xin, kind=kind, name=name)

PHILO1 = dict(kicker='対戦をつくった理由', lines=['一人で落ち着いて解く力と、', '相手がいる中で聞き取る力は、', '別の力。'], hl='別の力')
PHILO2 = dict(lines=['紙の問題集では作れない', '「本番の緊張感」を、', 'スマホの中に。'], hl='本番の緊張感',
              sub='AI・友だち・全国と、リスニング・英文法・英単語で')

def opening_sfx(shot, title_src, start_src):
  """起動画面の音：エンブレムのきらきら → タイトルへ「すーっ」→ タイトルで「ふわっ」"""
  t_title = title_src - start_src
  shot.sfx = [(0.05, psfx('open_shimmer'), 0.9), (t_title - 1.30, psfx('title_swell'), 0.55), (t_title - 0.03, psfx('title_bloom'), 0.85)]
  shot.title_src, shot.start_src = title_src, start_src

# ---------------- 台本：Instagram（リール・フィード） ----------------
def insta(L):
  W, H = L['W'], L['H']; tall = H > 1500; S = []
  # 1. 起動：エンブレムが出て消える → タイトル（とびら君・「聞いて、解いて、競って、これ1本で。」）
  LR = [(0, (0, 60, 860, 1800)), (6.6, (40, 200, 820, 1500))] if tall else [(0, (0, 380, 860, 1480)), (3.6, (0, 380, 860, 1480)), (4.2, (0, 0, 860, 1180)), (6.6, (40, 20, 820, 1060))]
  S.append(phone_full(L, mp4(P3, 'launch'), 0.55, 6.9, roi=LR, xin=0, name='launch')); opening_sfx(S[-1], 4.45, 0.55)
  # 2. ひとこと
  S.append(card(L, ['イヤホンをつけて、', '1問だけ、聞いてみよう。'], 3.6, A('public/mascots/listening.webp'), hl='1問だけ', name='invite'))
  # 3. 第2問
  S.append(phone_full(L, mp4(P3, 'q2'), 6.75, 8.6, roi=(0, 150, 860, 1250), speed=1.2,
                      layers=[caption(L, '共通テスト形式の第2問', hl='第2問', step='STEP 1')], name='q2_intro'))
  kara = dict(cx=W / 2, y=L['kara_y'], maxw=L['kara_w'], size=44 if tall else 40, jp_size=30)
  S.append(phone_full(L, mp4(P3, 'q2'), 8.6, 15.45, roi=[(0, (0, 40, 860, 1200)), (6.8, (20, 200, 840, 1180))],
                      voice=(VOICE, q2_play), ev=[(q2_play, 'tap', 0.5)],
                      layers=[caption(L, '英語を聞いて、\n合うイラストを選ぶ', hl='合うイラスト', step='STEP 1'),
                              Karaoke(KARAOKE, audio_at=(q2_play - 8.6), **kara)], xin=0.2, name='q2_listen'))
  S.append(phone_full(L, mp4(P3, 'q2'), 15.95, 18.6, roi=(20, 200, 840, 1180), voice=(VOICE, q2_play),
                      layers=[caption(L, '英語を聞いて、\n合うイラストを選ぶ', hl='合うイラスト', step='STEP 1', at=-1),
                              Karaoke(KARAOKE, audio_at=0, audio_from=15.95 - q2_play, **kara)], xin=0.12, name='q2_listen2'))
  S.append(phone_full(L, mp4(P3, 'q2'), 18.7, 24.0, roi=[(0, (0, 300, 860, 1864)), (1.8, (0, 300, 860, 1864)), (2.5, (0, 80, 860, 1500))],
                      speed=1.15, ev=[(q2_pick + 0.05, 'tap', 0.55), (q2_ans + 0.05, 'tap', 0.55), (q2_ok, 'correct', 0.85)],
                      layers=[caption(L, '答えたら、すぐ採点', hl='すぐ採点', step='STEP 2')],
                      punch=[to_out(q2_ok, 18.7, 1.15)], name='q2_answer'))
  # 4. 解説：読み上げに合わせて英文が光る（手元を大きく）
  f = L['focus']
  focus = V(mp4(P3, 'q2_read'), 14.25, f, PHONE_SRC, roi=[(0, (0, 740, 860, 1180))], radius=30, voice=(VOICE, qr_play), slide=(0, 60, 0.5))
  dim = Fill(NAVY, lambda t: 0.72 * smooth(t / 0.4))
  base = V(mp4(P3, 'q2_read'), 14.25, (0, 0, W, H), PHONE_SRC, roi=[(0, (0, 0, 860, 1864))])
  S.append(Shot(19.6 - 14.25, [base, dim, focus, caption(L, '解説では、音声に合わせて\n英文が光る', hl='英文が光る', step='STEP 3',
                                                          y=f[1] - 260 if tall else 40)],
                bg_cream(L), xin=0.3, name='readalong'))
  # 5. 全国対戦（2台）
  BF = mp4(P3, 'battle_full')
  S.append(philo(L, BF, 0.75, PHONE_SRC, 4.3, 0.30, 2.0, xin=0.6, name='philo1', **PHILO1))
  S.append(philo(L, BF, 2.55, PHONE_SRC, 4.6, 0.25, 3.6, xin=0.45, name='philo2', **PHILO2))
  S.append(duo_split(L, 1.9, 8.95, speed=1.4, text='2台で、本当に対戦', hl='2台', name='match'))
  S.append(duo_split(L, 8.75, D_START, speed=1.6, text='カウントダウン', xin=0.2, name='countdown'))
  S.append(duo_split(L, D_START, 23.6, speed=1.15, text='早押し4択・全10問', hl='早押し', xin=0.12, kind='flash',
                     punch=[0.0, to_out(22.6, D_START, 1.15)], flash=[0.0], name='q1'))
  # 盛り上がり：交互に大きく（どちらの端末も本物）
  mont = [('ph', 28.8, 30.35), ('pc', 37.3, 38.75), ('ph', 51.35, 52.9), ('pc', 58.15, 59.7), ('ph', 66.7, 68.1)]
  for i, (dev, a, b) in enumerate(mont):
    if dev == 'ph':
      S.append(phone_full(L, mp4(DU, 'duo_phone'), a, b, roi=(0, 0, 860, 1700), ev=ev_duo(a, b, pc=False), xin=0.08, kind='flash' if i == 0 else 'fade',
                          punch=[to_out(next(t for t in PH_OK if a <= t < b), a, 1)], zoom=[(0, (1.0,)), (b - a, (1.05,))],
                          layers=[label('ハル・スマホ', 40, H - (230 if tall else 110), orange=True)], name=f'mont{i}'))
    else:
      S.append(pc_big(L, mp4(DU, 'duo_pc'), a, b, DUO_PC_SRC, roi=[(0, (300, 40, 1460, 880)), (b - a, (360, 90, 1400, 830))],
                      ev=ev_duo(a, b, phone=False, pc_gain=1.0), xin=0.08,
                      punch=[to_out(next(t for t in PC_OK if a <= t < b), a, 1)],
                      layers=[label('ソラ・パソコン', 40, L['pc_big'][1] - 66)], name=f'mont{i}'))
  S.append(duo_split(L, 82.35, 84.2, text='ラスト1問', hl='ラスト', xin=0.1, kind='flash', flash=[0.0], name='finalq'))
  S.append(phone_full(L, mp4(DU, 'duo_phone'), 87.75, 90.8, roi=(0, 0, 860, 1800), ev=ev_duo(87.7, 90.8, pc=False), xin=0.12,
                      punch=[to_out(88.13, 87.75, 1)], shake=[to_out(D_FINISH, 87.75, 1)], flash=[to_out(D_FINISH, 87.75, 1)], name='finish'))
  # 6. 勝利・ミッション達成
  S.append(phone_full(L, mp4(DU, 'duo_phone'), 90.8, 95.4, roi=[(0, (0, 0, 860, 1864)), (4.6, (40, 0, 820, 1500))] if tall else [(0, (0, 380, 860, 1300)), (1.2, (0, 380, 860, 1300)), (4.6, (0, 560, 860, 1450))],
                      ev=ev_duo(90.8, 95.4, pc=False), xin=0.15, layers=[caption(L, '勝てたら、ミッションも達成', hl='ミッション', at=1.1, y=L['cap_y'] if tall else L['H'] - 130)], name='victory'))
  # 7. しめ
  S.append(card(L, ['「聞き取れた！」を、', '毎日ひとつずつ。'], 5.3, A('public/mascots/happy.webp'), hl='毎日ひとつずつ', xin=0.8, name='message'))
  S.append(outro(L, 6.4, qr=False, xin=0.5))
  return S

# ---------------- 台本：YouTube（横・パソコン版を中心に） ----------------
def youtube(L):
  W, H = L['W'], L['H']; S = []
  S.append(pc_big(L, mp4(PCD, 'launch'), 0.55, 6.9, PC_SRC, roi=[(0, (0, 0, 1920, 1080)), (6.6, (160, 90, 1760, 990))], xin=0, device=False, name='launch'))
  opening_sfx(S[-1], 4.27, 0.55)
  S.append(card(L, ['イヤホンをつけて、', '1問だけ、聞いてみよう。'], 3.8, A('public/mascots/listening.webp'), hl='1問だけ', name='invite'))
  S.append(card(L, ['第2問', 'イラストを選ぶ問題'], 2.2, None, hl='第2問', bg=bg_navy(L), xin=0.4, name='ch_q2',
                sub='パソコンでも、スマホでも、同じ問題'))
  # 第2問：パソコンとスマホを並べて、同じ時刻に（録画どうしの再生のずれ 0.04 秒を合わせる）
  sp = L['split']; dt = q2_play - p_play
  pc = V(mp4(PCD, 'q2'), 6.6, (90, 150, 1170, 658), PC_SRC, device='pc', voice=(VOICE, p_play), ev=[(p_play, 'tap', 0.5)])
  ph = V(mp4(P3, 'q2'), 6.6 + dt, (1440, 128, 381, 826), PHONE_SRC, device='phone')
  kara = dict(cx=675, y=L['kara_y'] - 10, maxw=1240, size=40, jp_size=28)
  S.append(Shot(18.55 - 6.6, [pc, ph, label('パソコン', 100, 100), label('スマホ', 1440, 72, orange=True),
                               Karaoke(KARAOKE, audio_at=(p_play - 6.6), **kara)], bg_navy(L), xin=0.4, name='q2_listen'))
  S.append(pc_big(L, mp4(PCD, 'q2'), 18.65, 25.5, PC_SRC, device=False,
                  roi=[(0, (880, 100, 1600, 420)), (1.9, (880, 100, 1600, 420)), (3.0, (0, 0, 1920, 1080))],
                  ev=[(p_pick + 0.05, 'tap', 0.55), (p_ans + 0.05, 'tap', 0.55), (p_ok, 'correct', 0.85)],
                  punch=[to_out(p_ok, 18.65, 1)], layers=[caption(L, '答えたら、すぐ採点と解説', hl='すぐ採点', at=0.2)], name='q2_answer'))
  S.append(pc_big(L, mp4(PCD, 'q2_read'), 14.1, 23.6, PC_SRC, device=False, voice=(VOICE, pr_play),
                  roi=[(0, (0, 90, 1300, 820)), (2.0, (0, 200, 900, 720)), (9.5, (0, 220, 860, 720))],
                  layers=[caption(L, '音声に合わせて、英文が光る', hl='英文が光る', at=0.3, until=4.5)], name='readalong'))
  # 全国対戦
  BFP = mp4(PCD, 'battle_full')
  S.append(philo(L, BFP, 0.75, PC_SRC, 4.6, 0.28, 2.0, xin=0.6, name='philo1', **PHILO1))
  S.append(philo(L, BFP, 2.55, PC_SRC, 4.8, 0.22, 3.55, xin=0.45, name='philo2', **PHILO2))
  S.append(duo_split(L, 0.2, 8.95, speed=1.4, text='スマホ（ハル）vs パソコン（ソラ）、2台で本当に対戦', hl='2台', name='match'))
  S.append(duo_split(L, 11.9, D_START, text=None, xin=0.2, name='countdown'))
  S.append(duo_split(L, D_START, 39.0, text='早押し4択・全10問', hl='早押し', xin=0.12, kind='flash',
                     punch=[0.0, to_out(22.6, D_START, 1), to_out(29.3, D_START, 1), to_out(37.8, D_START, 1)], flash=[0.0], name='q1'))
  mont = [('ph', 44.9, 46.4), ('pc', 50.3, 51.75), ('ph', 59.3, 60.8), ('pc', 64.8, 66.2), ('ph', 66.7, 68.1), ('pc', 70.95, 72.35), ('ph', 72.95, 74.35)]
  for i, (dev, a, b) in enumerate(mont):
    if dev == 'ph':
      S.append(phone_device(L, mp4(DU, 'duo_phone'), a, b, ev=ev_duo(a, b, pc=False), xin=0.08,
                            punch=[to_out(next(t for t in PH_OK if a <= t < b), a, 1)], layers=[label('ハル・スマホ', 520, 60, orange=True)], name=f'mont{i}'))
    else:
      S.append(pc_big(L, mp4(DU, 'duo_pc'), a, b, DUO_PC_SRC, device=False, roi=[(0, (0, 0, 1600, 900)), (b - a, (80, 45, 1520, 855))],
                      ev=ev_duo(a, b, phone=False, pc_gain=1.0), xin=0.08, punch=[to_out(next(t for t in PC_OK if a <= t < b), a, 1)],
                      layers=[label('ソラ・パソコン', 40, 30)], name=f'mont{i}'))
  S.append(duo_split(L, 82.2, 85.9, text='ラスト1問', hl='ラスト', xin=0.1, kind='flash', flash=[0.0], name='finalq'))
  S.append(phone_device(L, mp4(DU, 'duo_phone'), 87.75, 90.8, ev=ev_duo(87.7, 90.8, pc=False), xin=0.12,
                        punch=[to_out(88.13, 87.75, 1)], name='finish'))
  S[-1].shake = [to_out(D_FINISH, 87.75, 1)]; S[-1].flash = [to_out(D_FINISH, 87.75, 1)]
  S.append(phone_device(L, mp4(DU, 'duo_phone'), 90.8, 96.0, ev=ev_duo(90.8, 96.0, pc=False), xin=0.15,
                        layers=[caption(L, '勝てたら、ミッションも達成', hl='ミッション', at=1.2)], name='victory'))
  # ほかにも（パソコン版）
  S.append(card(L, ['続けたくなる', 'しかけも。'], 1.9, None, hl='しかけ', bg=bg_navy(L), xin=0.4, name='ch_more'))
  S.append(pc_big(L, mp4(PCD, 'gacha_draw'), 6.9, 13.6, PC_SRC, speed=1.25, device=False, roi=[(0, (0, 0, 1920, 1080)), (3.4, (380, 0, 1540, 652)), (5.4, (380, 0, 1540, 652))],
                  ev=[(7.1, 'gacha', 0.7), (11.15, 'jackpot', 0.8)], punch=[to_out(11.15, 6.9, 1.25)],
                  layers=[caption(L, 'ごほうびガチャ', hl='ガチャ', at=0.2, until=4.0)], name='gacha'))
  S.append(pc_big(L, mp4(PCD, 'review'), 11.6, 15.0, PC_SRC, device=False, roi=[(0, (0, 0, 1920, 1080)), (3.4, (100, 50, 1500, 840))], xin=0.2, kind='slide',
                  layers=[caption(L, '間違えた問題は、復習ノートに', hl='復習ノート', at=0.2)], name='review'))
  S.append(pc_big(L, mp4(PCD, 'missions'), 0.9, 4.1, PC_SRC, device=False, roi=[(0, (0, 0, 1920, 1080)), (3.2, (160, 0, 1760, 900))], xin=0.2, kind='slide',
                  layers=[caption(L, '毎日のミッション', hl='ミッション', at=0.2)], name='missions'))
  S.append(card(L, ['「聞き取れた！」を、', '毎日ひとつずつ。'], 5.3, A('public/mascots/happy.webp'), hl='毎日ひとつずつ', xin=0.8, name='message'))
  S.append(outro(L, 11.2, qr=True, xin=0.5, credits=CREDITS_LINE))
  return S

CREDITS_LINE = ('BGM：「誕生」（マナトビ）／「夕凪」作曲 やっすん　配布元：創作堂さくら紅葉 https://yukizakura.net/\n'
                '「カナリアスキップ」作曲 まんぼう二等兵（OpenTracks）　効果音：マナトビ')

# ---------------- 音の割りつけ ----------------
def collect(shots):
  sfx, voice = [], []
  for s in shots:
    for (lt, f, g) in getattr(s, 'sfx', []): sfx.append((s.start + lt, f, g))
    for Lr in s.layers:
      if not isinstance(Lr, Video): continue
      end_local = Lr.until if Lr.until is not None else s.dur
      src_end = Lr.t0 + (end_local - Lr.at) * Lr.speed
      for (st, n, g) in getattr(Lr, 'ev', []):
        if Lr.t0 <= st < src_end: sfx.append((s.start + Lr.at + (st - Lr.t0) / Lr.speed, SFX(n), g))
      if getattr(Lr, 'voice', None):
        f, play = Lr.voice; a = max(Lr.t0, play)
        if a < src_end:
          vs = a - play; d = min(src_end - a, VOICE_DUR - vs)
          if d > 0.05: voice.append(dict(f=f, src=vs, at=s.start + Lr.at + (a - Lr.t0) / Lr.speed, dur=d, gain=1.0, fi=0.02, fo=0.12))
  return sorted(sfx), voice

def by(shots, name): return next(s for s in shots if s.name == name)

def music_plan(shots, total):
  launch, match, cd, finish, victory, message, out = (by(shots, n) for n in ('launch', 'match', 'countdown', 'finish', 'victory', 'message', 'outro'))
  first_battle = by(shots, 'philo1')
  title_at = launch.start + (launch.title_src - launch.start_src)   # タイトルが出る瞬間 = 「誕生」が広がる 22.95 秒
  m = []
  t1_end = first_battle.start + 0.9
  # 冒頭は効果音だけ（きらきら → すーっ → タイトルでふわっ）。ふわっの響きが引いていく所で、
  # 「誕生」を曲の頭から始めて（途中から割り込まない・無音の間も作らない）、そのまま次の画面へ
  enter = title_at + 0.95
  m.append(dict(f=TANJOU, src=0.0, at=enter, dur=t1_end - enter, gain=0.80, fi=0.05, fo=1.8))
  # 夕凪：理念 → 相手さがし → カウントダウン。START! の直前で引く（対戦の曲とは重ねない）
  w_at = first_battle.start - 0.5; start_at = cd.start + cd.dur
  m.append(dict(f=WAITING, src=0.0, at=w_at, dur=start_at - w_at - 0.05, gain=1.45, fi=1.4, fo=0.7))
  # カナリアスキップ：START! の瞬間にサビ（曲頭7秒）から
  b_at = start_at - 0.03; fin = finish.start + to_out(D_FINISH, 87.75, 1)
  m.append(dict(f=BATTLE2, src=7.0 - 0.03, at=b_at, dur=fin - b_at + 1.2, gain=1.9, fi=0.03, fo=1.4))
  # 誕生（後半）：静かな間（117.8〜123.1）＝ひとこと、もう一度広がる 123.1 ＝ ロゴ
  s2_at = finish.start + finish.dur - 0.4
  src2 = 117.8 - (message.start + 0.3 - s2_at)
  # 途中に「ほかにも」がある YouTube はロゴの瞬間を 123.1 に合わせる（静かな間は message の頭から）
  m.append(dict(f=TANJOU, src=src2, at=s2_at, dur=min(total - s2_at, 134.8 - src2), gain=0.62, fi=1.6, fo=2.4 if total - s2_at < 134.8 - src2 else 0.5))
  return m

def sheet(name, L, shots, step=1.0):
  total = layout(shots); ims = []; T = 0.0
  while T < total:
    act = [s for s in shots if s.start <= T < s.start + s.dur][-1]
    fr = act.render(T - act.start, L['W'], L['H']); w = 270; h = round(L['H'] * w / L['W'])
    im = cv2.resize(fr, (w, h), interpolation=cv2.INTER_AREA); cv2.putText(im, f'{T:.1f}', (4, 22), 0, 0.7, (0, 0, 255), 2)
    ims.append(im); T += step
  cols = 10; rows = (len(ims) + cols - 1) // cols; h = ims[0].shape[0]
  out = np.full((rows * h, cols * 270, 3), 128, np.uint8)
  for i, im in enumerate(ims): out[(i // cols) * h:(i // cols + 1) * h, (i % cols) * 270:(i % cols + 1) * 270] = im
  cv2.imwrite(os.path.join(TMP, name + '_sheet.jpg'), out, [cv2.IMWRITE_JPEG_QUALITY, 80])
  for s in shots: s.close()
  print('sheet', name, f'{total:.1f}s', ' '.join(f'{s.name}@{s.start:.1f}' for s in shots))

def build(name, L, shots):
  if '--sheet' in sys.argv: return sheet(name, L, shots, float(os.environ.get('SHEET_STEP', '1')))
  total = layout(shots)
  print(name, f'{total:.1f}s', ' '.join(f'{s.name}@{s.start:.1f}' for s in shots), flush=True)
  sfx, voice = collect(shots)
  music = music_plan(shots, total)
  vid = os.path.join(TMP, name + '_v.mp4'); aud = os.path.join(TMP, name + '_a.m4a')
  if '--audio-only' in sys.argv and os.path.exists(vid): print('  映像はそのまま（音だけ作り直し）', flush=True)
  else: render_video(shots, L['W'], L['H'], vid, crf=20 if DRAFT else 17, preset='veryfast' if DRAFT else 'medium')
  js = mix_audio(total, music, voice, sfx, aud, TMP)
  final = os.path.join(OUT, name + '.mp4'); mux(vid, aud, final)
  chapters = [(s.start, s.name) for s in shots]
  if name.startswith('youtube'):  # YouTube のチャプター（0:00 から・各10秒以上）
    titles = {'launch': 'オープニング', 'ch_q2': '第2問を解いてみる（パソコン・スマホ）', 'q2_answer': '採点と解説',
              'philo1': '全国対戦（スマホ vs パソコン）', 'q1': '早押し4択・全10問', 'finalq': 'ラスト1問・決着',
              'ch_more': 'ガチャ・復習ノート・ミッション', 'message': 'エンディング'}
    rows = [(s.start, titles[s.name]) for s in shots if s.name in titles]; rows[0] = (0.0, rows[0][1])
    keep = [rows[0]]
    for r in rows[1:]:
      if r[0] - keep[-1][0] >= 10 and total - r[0] >= 10: keep.append(r)
    open(os.path.join(OUT, name + '_CHAPTERS.txt'), 'w').write(''.join(f'{int(t // 60)}:{int(t % 60):02d} {n}\n' for t, n in keep))
  json.dump(dict(total=total, chapters=chapters, music=music, voice=voice, sfx=[(a, os.path.basename(f), g) for a, f, g in sfx], loudness=js),
            open(os.path.join(TMP, name + '_timeline.json'), 'w'), ensure_ascii=False, indent=1)
  print('done', final, round(total, 2), flush=True)


def frames_at(name, L, shots, times):
  layout(shots); out = []
  for T in times:
    act = [s for s in shots if s.start <= T < s.start + s.dur][-1]
    out.append(cv2.resize(act.render(T - act.start, L['W'], L['H']), (L['W'] // 2, L['H'] // 2), interpolation=cv2.INTER_AREA))
  for s in shots: s.close()
  cv2.imwrite(os.path.join(TMP, name + '_frames.jpg'), np.hstack(out), [cv2.IMWRITE_JPEG_QUALITY, 85])

# ---------------- 実行 ----------------
FR = os.environ.get('FRAMES')
if FR:
  ts = [float(x) for x in FR.split(',')]
  for k, fn, L in (('reel', insta, 'reel'), ('feed', insta, 'feed'), ('youtube', youtube, 'youtube')):
    if k in WHICH: frames_at(k, LAYOUTS[L], fn(LAYOUTS[L]), ts)
  raise SystemExit
if 'reel' in WHICH: build('instagram_post_reel_9x16', LAYOUTS['reel'], insta(LAYOUTS['reel']))
if 'feed' in WHICH: build('instagram_post_feed_4x5', LAYOUTS['feed'], insta(LAYOUTS['feed']))
if 'youtube' in WHICH: build('youtube_16x9', LAYOUTS['youtube'], youtube(LAYOUTS['youtube']))
