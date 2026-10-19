# 宣伝動画の編集エンジン（1コマずつ Python で合成 → ffmpeg に流す）
#
#   ・素材は record_scenes.py / record_duo.py で録った「実際のアプリ画面」だけ（動画生成AIは使わない）
#   ・ショット（Shot）を並べ、各ショットに層（Video・Sprite・Karaoke など）を重ねる
#   ・カメラ（切り抜き位置と幅）をキーフレームで動かす → ズーム・パン
#   ・ショットどうしは重ねて切り替え（フェード・白フラッシュ・スライド）
#   ・音は mix_audio()：BGM を複数つなぎ、問題の音声が鳴る間だけ BGM を自動で下げる（sidechaincompress）
import json, math, os, subprocess
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

FPS = 30
FONT_BLACK = '/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc'
FONT_BOLD = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
# ブランドの3色（RGB）
NAVY, BLUE, BLUE_D, ORANGE, WHITE = (28, 42, 57), (36, 88, 166), (28, 70, 135), (242, 154, 31), (255, 255, 255)
CREAM, CREAM_D = (253, 248, 238), (246, 234, 210)


# ---------------- 補間 ----------------
def clamp01(x): return 0.0 if x < 0 else 1.0 if x > 1 else x
def smooth(x): x = clamp01(x); return x * x * (3 - 2 * x)
def ease_out(x): x = clamp01(x); return 1 - (1 - x) ** 3
def back_out(x, c=1.9): x = clamp01(x); return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2

def interp_keys(keys, t):
  """keys = [(t, value_tuple), ...]。区間ごとに smooth で補間"""
  if t <= keys[0][0]: return keys[0][1]
  for (t0, a), (t1, b) in zip(keys, keys[1:]):
    if t <= t1:
      u = smooth((t - t0) / max(1e-6, t1 - t0)); return tuple(x + (y - x) * u for x, y in zip(a, b))
  return keys[-1][1]


# ---------------- 画像の下ごしらえ ----------------
def font(path, size): return ImageFont.truetype(path, size, index=0)  # ttc の 0 番 = 日本語

def pil_to_bgra(im): return cv2.cvtColor(np.array(im.convert('RGBA')), cv2.COLOR_RGBA2BGRA)

def load_sprite(path, h=None, w=None):
  im = Image.open(path).convert('RGBA')
  if h: im = im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
  elif w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
  return pil_to_bgra(im)

def gradient(W, H, top, bottom, glow=None):
  """縦グラデーション（RGB指定）→ BGR。glow=(cx, cy, r, rgb, strength) で丸い光"""
  t = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
  a = np.array(top[::-1], np.float32); b = np.array(bottom[::-1], np.float32)
  img = np.repeat(a * (1 - t) + b * t, W, axis=1)
  if glow:
    cx, cy, r, col, k = glow
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    m = np.exp(-(((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * r * r)))[..., None] * k
    img = img * (1 - m) + np.array(col[::-1], np.float32) * m
  return np.clip(img, 0, 255).astype(np.uint8)

def text_img(text, size, color=WHITE, fnt=FONT_BLACK, hl=None, hl_color=ORANGE, hl_mode='marker', stroke=0, stroke_color=NAVY,
             line_gap=1.28, align='center', shadow=None, pad=None):
  """複数行の文字 → BGRA。hl の部分はオレンジの下線マーカー（marker）か、オレンジ文字（color）"""
  f = font(fnt, size); lines = text.split('\n')
  dummy = ImageDraw.Draw(Image.new('RGBA', (8, 8)))
  widths = [dummy.textlength(l, font=f) for l in lines]
  pad = pad if pad is not None else round(size * 0.3) + stroke
  W = int(max(widths)) + pad * 2; lh = round(size * line_gap); H = lh * len(lines) + pad * 2 - (lh - size) + round(size * 0.25)
  im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
  for i, (l, w) in enumerate(zip(lines, widths)):
    x0 = pad + (0 if align == 'left' else (W - 2 * pad - w) / 2); y0 = pad + i * lh
    if hl and hl in l and hl_mode == 'marker':
      hx = x0 + d.textlength(l[:l.index(hl)], font=f); hw = d.textlength(hl, font=f)
      bb = d.textbbox((x0, y0), l, font=f)
      d.rounded_rectangle([hx - 4, bb[3] - size * 0.12, hx + hw + 4, bb[3] + size * 0.13], max(3, size // 12), fill=hl_color)
    if shadow:
      d.text((x0 + shadow[0], y0 + shadow[1]), l, font=f, fill=shadow[2], stroke_width=stroke, stroke_fill=shadow[2])
    if hl and hl in l and hl_mode == 'color':
      a, b = l.split(hl, 1); x = x0
      for part, col in ((a, color), (hl, hl_color), (b, color)):
        d.text((x, y0), part, font=f, fill=col, stroke_width=stroke, stroke_fill=stroke_color); x += d.textlength(part, font=f)
    else:
      d.text((x0, y0), l, font=f, fill=color, stroke_width=stroke, stroke_fill=stroke_color)
  return pil_to_bgra(im)

def pill_img(text, size, fg=NAVY, bg=ORANGE, fnt=FONT_BLACK, padx=None, pady=None, border=None):
  f = font(fnt, size); d0 = ImageDraw.Draw(Image.new('RGBA', (8, 8)))
  tw = d0.textlength(text, font=f); padx = padx or round(size * 0.75); pady = pady or round(size * 0.32)
  W = int(tw + padx * 2); H = int(size * 1.32 + pady * 2)
  im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
  d.rounded_rectangle([0, 0, W - 1, H - 1], H // 2, fill=bg, outline=border, width=3 if border else 0)
  d.text((padx, pady - size * 0.06), text, font=f, fill=fg)
  return pil_to_bgra(im)

def panel_img(w, h, r, rgba):
  im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); ImageDraw.Draw(im).rounded_rectangle([0, 0, w - 1, h - 1], r, fill=rgba)
  return pil_to_bgra(im)

_MASKS = {}
def round_mask(w, h, r):
  k = (w, h, r)
  if k not in _MASKS:
    im = Image.new('L', (w * 2, h * 2), 0); ImageDraw.Draw(im).rounded_rectangle([0, 0, w * 2 - 1, h * 2 - 1], r * 2, fill=255)
    _MASKS[k] = (np.array(im.resize((w, h), Image.LANCZOS), np.float32) / 255.0)[..., None]
  return _MASKS[k]

_FRAMES = {}
def device_sprite(kind, w, h):
  """端末の外枠（影つき）。返り値 (BGRA, 画面左上からのずれ dx, dy, 画面の角丸 r)"""
  k = (kind, w, h)
  if k in _FRAMES: return _FRAMES[k]
  if kind == 'phone':
    b = max(8, round(w * 0.032)); r = round(w * 0.11); sh = round(w * 0.08)
    W, H = w + 2 * b + 2 * sh, h + 2 * b + 2 * sh
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    s = Image.new('L', (W, H), 0); ImageDraw.Draw(s).rounded_rectangle([sh, sh + sh // 3, sh + w + 2 * b, sh + h + 2 * b + sh // 3], r + b, fill=170)
    im.paste((6, 12, 26, 255), (0, 0), s.filter(ImageFilter.GaussianBlur(sh / 2.2)))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([sh, sh, sh + w + 2 * b, sh + h + 2 * b], r + b, fill=(16, 22, 34, 255), outline=(70, 82, 104, 255), width=2)
    out = (pil_to_bgra(im), sh + b, sh + b, r)
  else:  # pc：薄いベゼルのモニター＋スタンド
    b = max(8, round(w * 0.016)); r = round(w * 0.012); sh = round(w * 0.05); stand_h = round(h * 0.16)
    W, H = w + 2 * b + 2 * sh, h + 2 * b + 2 * sh + stand_h
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    s = Image.new('L', (W, H), 0); sd = ImageDraw.Draw(s)
    sd.rounded_rectangle([sh, sh + sh // 3, sh + w + 2 * b, sh + h + 2 * b + sh // 3], r + b, fill=150)
    im.paste((6, 12, 26, 255), (0, 0), s.filter(ImageFilter.GaussianBlur(sh / 2.2)))
    d = ImageDraw.Draw(im); cx = sh + b + w // 2; y1 = sh + h + 2 * b
    d.polygon([(cx - w * 0.05, y1), (cx + w * 0.05, y1), (cx + w * 0.07, y1 + stand_h * 0.82), (cx - w * 0.07, y1 + stand_h * 0.82)], fill=(150, 160, 178, 255))
    d.rounded_rectangle([cx - w * 0.17, y1 + stand_h * 0.78, cx + w * 0.17, y1 + stand_h * 0.92], 8, fill=(175, 184, 200, 255))
    d.rounded_rectangle([sh, sh, sh + w + 2 * b, sh + h + 2 * b], r + b, fill=(16, 22, 34, 255), outline=(70, 82, 104, 255), width=2)
    out = (pil_to_bgra(im), sh + b, sh + b, r)
  _FRAMES[k] = out
  return out


# ---------------- 合成の基本 ----------------
def blit(cv, img, x, y, alpha=1.0):
  """img（BGR か BGRA）を cv の (x, y) に。はみ出しは切る"""
  x, y = int(round(x)), int(round(y)); h, w = img.shape[:2]; H, W = cv.shape[:2]
  x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
  if x0 >= x1 or y0 >= y1 or alpha <= 0.003: return
  sub = img[y0 - y:y1 - y, x0 - x:x1 - x]
  dst = cv[y0:y1, x0:x1]
  if sub.shape[2] == 4:
    a = sub[..., 3:4].astype(np.float32) * (alpha / 255.0)
    dst[:] = (sub[..., :3].astype(np.float32) * a + dst.astype(np.float32) * (1 - a)).astype(np.uint8)
  elif alpha >= 0.997: dst[:] = sub
  else: dst[:] = cv2.addWeighted(sub, alpha, dst, 1 - alpha, 0)

def blit_masked(cv, img, x, y, mask, alpha=1.0):
  x, y = int(round(x)), int(round(y)); h, w = img.shape[:2]; H, W = cv.shape[:2]
  x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
  if x0 >= x1 or y0 >= y1: return
  sub = img[y0 - y:y1 - y, x0 - x:x1 - x].astype(np.float32); m = mask[y0 - y:y1 - y, x0 - x:x1 - x] * alpha
  dst = cv[y0:y1, x0:x1]; dst[:] = (sub * m + dst.astype(np.float32) * (1 - m)).astype(np.uint8)

def scaled(img, s):
  if abs(s - 1) < 0.004: return img
  h, w = img.shape[:2]
  return cv2.resize(img, (max(1, round(w * s)), max(1, round(h * s))), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_LINEAR)


class Reader:
  """録画を前から順に読む（戻る・大きく飛ぶときだけシーク）。範囲外は端のコマで止める"""
  def __init__(self, path):
    self.path = path; self.cap = cv2.VideoCapture(path); self.fps = self.cap.get(5) or FPS
    self.n = int(self.cap.get(7)); self.idx = -1; self.frame = None
  def get(self, t):
    i = max(0, min(self.n - 1, int(round(t * self.fps))))
    if i == self.idx and self.frame is not None: return self.frame
    if i < self.idx or i > self.idx + 60:
      self.cap.set(cv2.CAP_PROP_POS_FRAMES, i); self.idx = i - 1
    while self.idx < i:
      ok, f = self.cap.read()
      if not ok: self.idx = i; break
      self.idx += 1; self.frame = f
    return self.frame
  def close(self): self.cap.release()


# ---------------- 層 ----------------
class Layer:
  at = 0.0; until = None
  def active(self, t): return t >= self.at and (self.until is None or t < self.until)
  def close(self): pass


class Video(Layer):
  """録画の一部を dest=(x, y, w, h) に。cam=[(t, (cx, cy, cw)), ...] で切り抜きを動かす（cw = 切り抜きの幅・元動画の画素）
     device='phone'|'pc' で端末の外枠つき。src_t(t) = t0 + (t - at) * speed"""
  def __init__(self, path, t0, dest, cam=None, speed=1.0, at=0.0, until=None, device=None, radius=0, fade_in=0.0, fade_out=0.0,
               freeze=None, slide=None):
    self.path, self.t0, self.dest, self.speed, self.at, self.until = path, t0, dest, speed, at, until
    self.cam = cam; self.device = device; self.radius = radius; self.fade_in = fade_in; self.fade_out = fade_out
    self.freeze = freeze  # 元動画の時刻で止める（この時刻より先は進めない）
    self.slide = slide    # (dx, dy, dur)：入ってくるときの動き
    self.r = None
  def src_t(self, t):
    s = self.t0 + (t - self.at) * self.speed
    return min(s, self.freeze) if self.freeze is not None else s
  def draw(self, cv, t):
    if self.r is None: self.r = Reader(self.path)
    f = self.r.get(self.src_t(t))
    if f is None: return
    sh, sw = f.shape[:2]; x, y, w, h = self.dest
    cx, cy, cw = interp_keys(self.cam, t - self.at) if self.cam else (sw / 2, sh / 2, sw)
    s = w / cw; ch = h / s
    # 縮小は先に INTER_AREA で縮めてから、端数の位置合わせは warpAffine（ズーム中に文字がガタつかない）
    if s < 0.95:
      f = cv2.resize(f, (max(1, round(sw * s)), max(1, round(sh * s))), interpolation=cv2.INTER_AREA)
      k = f.shape[1] / sw; M = np.float32([[1, 0, -(cx * k - w / 2)], [0, 1, -(cy * k - h / 2)]])
      img = cv2.warpAffine(f, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    else:
      M = np.float32([[s, 0, -(cx - cw / 2) * s], [0, s, -(cy - ch / 2) * s]])
      img = cv2.warpAffine(f, M, (w, h), flags=cv2.INTER_CUBIC if s > 1.05 else cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    lt = t - self.at; a = 1.0
    if self.fade_in: a *= smooth(lt / self.fade_in)
    if self.fade_out and self.until is not None: a *= smooth((self.until - t) / self.fade_out)
    ox = oy = 0
    if self.slide:
      u = 1 - ease_out(lt / self.slide[2]); ox, oy = self.slide[0] * u, self.slide[1] * u
    x, y = x + ox, y + oy
    if self.device:
      spr, dx, dy, r = device_sprite(self.device, w, h); blit(cv, spr, x - dx, y - dy, a)
      blit_masked(cv, img, x, y, round_mask(w, h, r), a)
    elif self.radius:
      blit_masked(cv, img, x, y, round_mask(w, h, self.radius), a)
    else:
      blit(cv, img, x, y, a)
  def close(self):
    if self.r: self.r.close(); self.r = None


class Sprite(Layer):
  """画像を中心 (x, y) に。anim：fade / up（下から）/ pop（ぽんと出る）/ drop（上から）/ zoom（大→等倍）
     bob=(振幅px, 周期s) でふわふわ。drift=(dx/s, dy/s, ds/s) で少しずつ動く"""
  def __init__(self, img, x, y, at=0.0, until=None, anim='up', dur=0.4, out=0.25, bob=None, drift=None, alpha=1.0, anchor='center'):
    self.img, self.x, self.y, self.at, self.until = img, x, y, at, until
    self.anim, self.dur, self.out, self.bob, self.drift, self.alpha, self.anchor = anim, dur, out, bob, drift, alpha, anchor
  def draw(self, cv, t):
    lt = t - self.at; u = lt / self.dur if self.dur else 1.0; a = self.alpha; s = 1.0; dx = dy = 0.0
    if self.anim == 'fade': a *= smooth(u)
    elif self.anim == 'up': a *= smooth(u * 1.4); dy = 46 * (1 - ease_out(u))
    elif self.anim == 'drop': a *= smooth(u * 1.4); dy = -46 * (1 - ease_out(u))
    elif self.anim == 'pop': a *= smooth(u * 3); s = 0.35 + 0.65 * back_out(u)
    elif self.anim == 'zoom': a *= smooth(u * 2); s = 1 + 0.9 * (1 - ease_out(u))
    elif self.anim == 'left': a *= smooth(u * 1.4); dx = -70 * (1 - ease_out(u))
    elif self.anim == 'right': a *= smooth(u * 1.4); dx = 70 * (1 - ease_out(u))
    if self.until is not None and self.out: a *= smooth((self.until - t) / self.out)
    if self.bob: dy += self.bob[0] * math.sin(2 * math.pi * lt / self.bob[1])
    if self.drift: dx += self.drift[0] * lt; dy += self.drift[1] * lt; s *= 1 + self.drift[2] * lt
    img = scaled(self.img, s); h, w = img.shape[:2]
    if self.anchor == 'center': x0, y0 = self.x - w / 2, self.y - h / 2
    elif self.anchor == 'top': x0, y0 = self.x - w / 2, self.y
    else: x0, y0 = self.x, self.y  # 'tl'
    blit(cv, img, x0 + dx, y0 + dy, a)


class Fill(Layer):
  """全面の色（暗くする・白くするなど）。alpha は数値か t → 値 の関数"""
  def __init__(self, rgb, alpha, at=0.0, until=None):
    self.bgr = np.array(rgb[::-1], np.float32); self.alpha = alpha; self.at = at; self.until = until
  def draw(self, cv, t):
    a = self.alpha(t - self.at) if callable(self.alpha) else self.alpha
    if a > 0.003: cv[:] = (cv.astype(np.float32) * (1 - a) + self.bgr * a).astype(np.uint8)


class Func(Layer):
  def __init__(self, fn, at=0.0, until=None): self.fn, self.at, self.until = fn, at, until
  def draw(self, cv, t): self.fn(cv, t - self.at)


class Karaoke(Layer):
  """英語の字幕（読み上げに合わせて単語がオレンジに）＋和訳。
     lines=[(who, [(word, startSec, endSec), ...], 和訳)]、audio_at = 音声の0秒が来るショット内の時刻、audio_from = 音声の何秒からか"""
  def __init__(self, lines, audio_at, cx, y, maxw, at=0.0, until=None, audio_from=0.0, size=46, jp_size=32, panel=True):
    self.lines = lines; self.audio_at = audio_at; self.audio_from = audio_from; self.cx, self.y, self.maxw = cx, y, maxw
    self.at, self.until = at, until; self.size, self.jp_size, self.panel = size, jp_size, panel; self.cache = {}
  def _prep(self, i):
    if i in self.cache: return self.cache[i]
    who, words, jp = self.lines[i]; f = font(FONT_BLACK, self.size); fj = font(FONT_BOLD, self.jp_size)
    d0 = ImageDraw.Draw(Image.new('RGBA', (8, 8))); sp = d0.textlength(' ', font=f)
    # 折り返し
    rows, row, wsum = [], [], 0
    for wd in words:
      ww = d0.textlength(wd[0], font=f)
      if row and wsum + sp + ww > self.maxw - 120: rows.append(row); row, wsum = [], 0
      row.append((wd, ww)); wsum += (sp if len(row) > 1 else 0) + ww
    rows.append(row)
    lh = round(self.size * 1.3); W = self.maxw; H = lh * len(rows) + round(self.jp_size * 1.5) + 40
    base = Image.new('RGBA', (W, H), (0, 0, 0, 0)); lit = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    db, dl = ImageDraw.Draw(base), ImageDraw.Draw(lit); spans = []
    tag = pill_img(who, 26, fg=WHITE, bg=BLUE, padx=14, pady=4)
    for ri, row in enumerate(rows):
      tw = sum(w for _, w in row) + sp * (len(row) - 1); x = (W - tw) / 2 + 30; y = 16 + ri * lh
      for (wd, ww) in row:
        db.text((x, y), wd[0], font=f, fill=(255, 255, 255, 235), stroke_width=3, stroke_fill=(16, 26, 40, 255))
        dl.text((x, y), wd[0], font=f, fill=ORANGE + (255,), stroke_width=3, stroke_fill=(16, 26, 40, 255))
        spans.append((wd[1], wd[2], int(x), int(x + ww), y)); x += ww + sp
    first = rows[0]; tw0 = sum(w for _, w in first) + sp * (len(first) - 1)
    jw = d0.textlength(jp, font=fj); jy = 16 + len(rows) * lh + 8
    db.text(((W - jw) / 2, jy), jp, font=fj, fill=(255, 236, 200, 255), stroke_width=2, stroke_fill=(16, 26, 40, 255))
    out = (pil_to_bgra(base), pil_to_bgra(lit), spans, tag, int((W - tw0) / 2 - 34), H, lh)
    self.cache[i] = out; return out
  def draw(self, cv, t):
    lt = t - self.audio_at + self.audio_from  # 音声の中の時刻
    cur = None
    for i, (_, words, _) in enumerate(self.lines):
      if words[0][1] - 0.35 <= lt: cur = i
    if cur is None: return
    base, lit, spans, tag, tagx, H, lh = self._prep(cur)
    x0 = self.cx - self.maxw / 2; y0 = self.y
    # この行が出てからの時間（ふわっと出す）
    since = lt - (self.lines[cur][1][0][1] - 0.35); a = smooth(since / 0.25)
    if self.panel:
      pk = ('panel', H)
      if pk not in self.cache: self.cache[pk] = panel_img(self.maxw, H, 28, (14, 24, 40, 178))
      blit(cv, self.cache[pk], x0, y0, a)
    img = base.copy()
    for (s0, s1, xa, xb, yy) in spans:
      if lt >= s0:
        k = clamp01((lt - s0) / max(0.05, s1 - s0)); xe = int(xa + (xb - xa) * (0.35 + 0.65 * k)) if k < 1 else xb + 6
        img[yy - 4:yy + lh, xa - 4:xe] = lit[yy - 4:yy + lh, xa - 4:xe]
    blit(cv, img, x0, y0, a)
    blit(cv, tag, x0 + tagx - tag.shape[1] + 30, y0 + 22, a)


class Shot:
  """dur 秒のショット。bg は BGR 画像か t → 画像。xin = 前のショットと重ねる秒数（kind：fade / flash / white / slide / zoom）
     punch=[t...]：その時刻に画面全体を少し拡大（ドン）、flash=[t...]：白く光る、shake=[t...]：揺れ"""
  def __init__(self, dur, layers, bg, xin=0.0, kind='fade', punch=(), flash=(), shake=(), name='', zoom=None):
    self.dur, self.layers, self.bg, self.xin, self.kind = dur, layers, bg, xin, kind
    self.punch, self.flash, self.shake, self.name, self.zoom = list(punch), list(flash), list(shake), name, zoom
    self.start = 0.0
  def render(self, t, W, H):
    cv = (self.bg(t) if callable(self.bg) else self.bg).copy()
    for L in self.layers:
      if L.active(t): L.draw(cv, t)
    s = 1.0; ox = oy = 0.0
    if self.zoom: s *= interp_keys(self.zoom, t)[0]
    for p in self.punch:
      if 0 <= t - p < 0.6: s *= 1 + 0.055 * math.exp(-(t - p) * 7) * (1 - math.exp(-(t - p) * 60))
    for p in self.shake:
      if 0 <= t - p < 0.45:
        k = math.exp(-(t - p) * 9) * 16; ox += k * math.sin((t - p) * 95); oy += k * math.cos((t - p) * 77)
    if s != 1.0 or ox or oy:
      M = np.float32([[s, 0, (1 - s) * W / 2 + ox], [0, s, (1 - s) * H / 2 + oy]])
      cv = cv2.warpAffine(cv, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    for p in self.flash:
      if 0 <= t - p < 0.5:
        a = 0.85 * math.exp(-(t - p) * 7)
        cv = cv2.addWeighted(cv, 1 - a, np.full_like(cv, 255), a, 0)
    return cv
  def close(self):
    for L in self.layers: L.close()


def layout(shots):
  t = 0.0
  for i, s in enumerate(shots):
    s.start = t - (s.xin if i else 0.0); t = s.start + s.dur
  return t


def render_video(shots, W, H, out, crf=18, preset='medium', only=None):
  total = layout(shots); n = int(round(total * FPS))
  cmd = ['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
         '-c:v', 'libx264', '-preset', preset, '-crf', str(crf), '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-threads', '2', out]
  ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
  closed = set()
  for k in range(n):
    T = k / FPS
    act = [s for s in shots if s.start <= T < s.start + s.dur]
    if not act: act = [shots[-1]]
    if len(act) == 1: fr = act[0].render(T - act[0].start, W, H)
    else:
      a, b = act[0], act[-1]; u = clamp01((T - b.start) / max(1e-6, b.xin))
      A = a.render(T - a.start, W, H); B = b.render(T - b.start, W, H)
      if b.kind == 'flash':   # 白へ → 白から
        if u < 0.5: fr = cv2.addWeighted(A, 1 - u * 2, np.full_like(A, 255), u * 2, 0)
        else: fr = cv2.addWeighted(B, (u - 0.5) * 2, np.full_like(B, 255), 1 - (u - 0.5) * 2, 0)
      elif b.kind == 'slide':  # 新しい画面が下から
        e = ease_out(u); off = int(H * (1 - e)); fr = A.copy()   # 前の画面は上へ押し出され、新しい画面が下から
        if off < H: fr[off:] = B[:H - off]
        if off > 0: fr[:off] = A[H - off:]
      elif b.kind == 'zoom':   # 前の画面が拡大しながら消える
        s = 1 + 0.25 * smooth(u); M = np.float32([[s, 0, (1 - s) * W / 2], [0, s, (1 - s) * H / 2]])
        Az = cv2.warpAffine(A, M, (W, H)); fr = cv2.addWeighted(Az, 1 - smooth(u), B, smooth(u), 0)
      else: fr = cv2.addWeighted(A, 1 - smooth(u), B, smooth(u), 0)
    ff.stdin.write(fr.tobytes())
    for s in shots:
      if id(s) not in closed and T > s.start + s.dur + 0.1: s.close(); closed.add(id(s))
    if k % 300 == 0: print(f'  {T:6.1f}/{total:.1f}s', flush=True)
  ff.stdin.close(); ff.wait()
  for s in shots: s.close()
  return total


# ---------------- 音 ----------------
def _run(cmd):
  r = subprocess.run(cmd, capture_output=True, text=True)
  if r.returncode: print(' '.join(cmd)[:3000]); print(r.stderr[-3000:]); raise SystemExit(1)
  return r

def mix_audio(total, music, voice, sfx, out_m4a, tmp, target_lufs=-14.0):
  """music/voice = [dict(f, src, at, dur, gain, fi, fo)]、sfx = [(at, file, gain)]。
     問題の音声（voice）が鳴る間は music を sidechaincompress で自動的に下げる。最後に2パスの loudnorm"""
  inputs, fc = [], []
  def add(f, src, dur):
    inputs.extend(['-ss', f'{max(0, src):.3f}', '-t', f'{dur:.3f}', '-i', f]); return len(inputs) // 6 - 1
  def chain(k, d, tag):
    ms = max(0, round(d['at'] * 1000)); fo = d.get('fo', 0); fi = d.get('fi', 0)
    f = f"[{k}:a]aresample=48000,aformat=channel_layouts=stereo"
    if fi: f += f",afade=t=in:d={fi}"
    if fo: f += f",afade=t=out:st={max(0, d['dur'] - fo):.3f}:d={fo}"
    f += f",volume={d.get('gain', 1.0)},adelay={ms}:all=1[{tag}]"; fc.append(f)
  mt, vt, st = [], [], []
  for i, d in enumerate(music): chain(add(d['f'], d['src'], d['dur']), d, f'm{i}'); mt.append(f'[m{i}]')
  for i, d in enumerate(voice): chain(add(d['f'], d['src'], d['dur']), d, f'v{i}'); vt.append(f'[v{i}]')
  for i, (at, f, g) in enumerate(sfx):
    k = add(f, 0, 6); chain(k, dict(at=at, gain=g, dur=6), f's{i}'); st.append(f'[s{i}]')
  pad = f'apad=whole_dur={total:.3f}'
  fc.append(f"{''.join(mt)}amix=inputs={len(mt)}:normalize=0:dropout_transition=0,{pad}[mus]")
  parts = []
  if vt:
    fc.append(f"{''.join(vt)}amix=inputs={len(vt)}:normalize=0:dropout_transition=0,{pad},asplit=2[voi][key]")
    fc.append("[mus][key]sidechaincompress=threshold=0.015:ratio=9:attack=25:release=420:makeup=1[mud]"); parts += ['[mud]', '[voi]']
  else: parts.append('[mus]')
  if st:
    fc.append(f"{''.join(st)}amix=inputs={len(st)}:normalize=0:dropout_transition=0,{pad}[sfx]"); parts.append('[sfx]')
  fc.append(f"{''.join(parts)}amix=inputs={len(parts)}:normalize=0:dropout_transition=0,atrim=0:{total:.3f}[pre]")
  pre = os.path.join(tmp, os.path.basename(out_m4a) + '.pre.wav')
  _run(['ffmpeg', '-y', '-v', 'error', *inputs, '-filter_complex', ';'.join(fc), '-map', '[pre]', '-c:a', 'pcm_s16le', pre])
  r = _run(['ffmpeg', '-hide_banner', '-i', pre, '-af', f'loudnorm=I={target_lufs}:TP=-1.5:LRA=14:print_format=json', '-f', 'null', '-'])
  js = json.loads(r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1])
  ln = (f"loudnorm=I={target_lufs}:TP=-1.5:LRA=14:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
        f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
  _run(['ffmpeg', '-y', '-v', 'error', '-i', pre, '-af', ln + ',aresample=48000', '-c:a', 'aac', '-b:a', '192k', out_m4a])
  os.remove(pre)
  return js

def mux(video, audio, out):
  _run(['ffmpeg', '-y', '-v', 'error', '-i', video, '-i', audio, '-map', '0:v', '-map', '1:a', '-c', 'copy', '-shortest',
        '-movflags', '+faststart', out])
