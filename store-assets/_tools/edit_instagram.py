# Instagram 用動画の編集（録画した本物の操作画面 → 見出し・スマホ枠・効果音・BGM をつけて書き出す）
#   python3 store-assets/_tools/edit_instagram.py <録画dir> <出力dir> [story|post|post45]
#
# ■ 方針
#   ・画面は record_scenes.py で録った「実際のアプリの操作」だけを使う（動画生成AIは使わない）。
#   ・見出しの文言・数字は実装で確かめたものだけ（全6大問・AI対戦・復習ノート・ミッション・きせかえ）。
#   ・音：録画は無音なので、アプリが実際に鳴らす音をその時刻に重ねる
#       タップ音・正解音・START など … public/sfx/battle/*.mp3（運営が数式で自作。商用・動画OK・表記不要）
#       リスニングの問題音声 … public/listening_audio/el1A_set1_q1.mp3（アプリの音源）
#       BGM … public/bgm/battle/battle2.mp3「カナリアスキップ」まんぼう二等兵（OpenTracks）
#             ライセンス：オンライン動画の背景音楽として商用利用可・クレジット不要・加工可（2026-10-16 確認）
#   ・色はブランドの3色だけ：濃紺 #1c2a39 ／ 青 #2458a6 ／ オレンジ #f29a1f（＋白）。
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.environ.get('MNTB_ROOT') or os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
REC, OUT = sys.argv[1], sys.argv[2]
WHICH = sys.argv[3:] or ['story', 'post', 'post45']
TMP = os.path.join(OUT, '_work'); os.makedirs(TMP, exist_ok=True)

NAVY, BLUE, BLUE_D, ORANGE, WHITE = (28, 42, 57), (36, 88, 166), (28, 70, 135), (242, 154, 31), (255, 255, 255)
FONT_BLACK = '/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc'
FONT_BOLD = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
FPS = 30
SFX = lambda n: os.path.join(ROOT, 'public/sfx/battle', n + '.mp3')
LISTEN = os.path.join(ROOT, 'public/listening_audio/el1A_set1_q1.mp3')
BGM = os.path.join(ROOT, 'public/bgm/battle/battle2.mp3')
LOGO = os.path.join(ROOT, 'public/brand/manatobi-logo.png')
TOBIRA = os.path.join(ROOT, 'public/mascots/basic.webp')       # 公式アセット・目が開いている
TOBIRA2 = os.path.join(ROOT, 'public/mascots/walking.webp')    # 公式アセット・目が開いている

def meta(name): return json.load(open(os.path.join(REC, name + '.json')))
def font(path, size): return ImageFont.truetype(path, size, index=0)  # ttc の 0 番 = 日本語（JP）

# ---------------- レイアウト ----------------
LAYOUTS = {
  # 9:16（リール・ストーリーズ共通）。大事なものは中央の 4:5（y=285〜1635）に入れる
  '9x16': dict(W=1080, H=1920, cap_y=290, head=78, phone_y=630, phone_h=1180),
  # 4:5（フィード）
  '4x5': dict(W=1080, H=1350, cap_y=48, head=66, phone_y=318, phone_h=1000),
}
# 録画はスマホ実寸 430×932 を2倍密度で撮ったもの（CDP screencast・record_scenes.py）
SRC_W, SRC_H = 860, 1864

def phone_box(L):
  h = L['phone_h']; w = round(h * SRC_W / SRC_H) // 2 * 2
  return (L['W'] - w) // 2, L['phone_y'], w, h

def background(L):
  W, H = L['W'], L['H']
  bg = Image.new('RGB', (W, H), BLUE)
  d = ImageDraw.Draw(bg)
  for y in range(H):  # ゆるい縦グラデーション（青 → 濃い青）
    t = y / H
    d.line([(0, y), (W, y)], fill=tuple(round(BLUE[i] * (1 - t) + BLUE_D[i] * t) for i in range(3)))
  return bg.convert('RGBA')

def frame_layer(L):
  """背景＋スマホの枠。画面の部分だけ透明（この下に録画を敷く）"""
  W, H = L['W'], L['H']; x, y, w, h = phone_box(L); r = round(w * 0.11); b = round(w * 0.028)
  img = background(L)
  sh = Image.new('L', (W, H), 0); ImageDraw.Draw(sh).rounded_rectangle([x - b, y - b + 18, x + w + b, y + h + b + 18], r + b, fill=150)
  img.paste((10, 20, 40), (0, 0), sh.filter(ImageFilter.GaussianBlur(28)))
  ImageDraw.Draw(img).rounded_rectangle([x - b, y - b, x + w + b, y + h + b], r + b, fill=(13, 23, 38))
  hole = Image.new('L', (W, H), 0); ImageDraw.Draw(hole).rounded_rectangle([x, y, x + w, y + h], r, fill=255)
  img.putalpha(Image.eval(hole, lambda v: 255 - v))
  return img

def draw_text_center(d, W, y, text, f, fill, highlight=None, line_gap=1.28):
  """中央ぞろえ。highlight の文字列はオレンジの下線マーカー"""
  lines = text.split('\n'); size = f.size
  for i, line in enumerate(lines):
    tw = d.textlength(line, font=f); x0 = (W - tw) / 2; yy = y + i * size * line_gap
    if highlight and highlight in line:
      hx = x0 + d.textlength(line[:line.index(highlight)], font=f); hw = d.textlength(highlight, font=f)
      # 文字の実際の下端（textbbox）の少し上から下へ、太めの下線マーカー。文字に重ねて「線で消した」ように見せない
      bb = d.textbbox((x0, yy), line, font=f)
      d.rounded_rectangle([hx - 4, bb[3] - size * 0.10, hx + hw + 4, bb[3] + size * 0.14], 6, fill=ORANGE)
    d.text((x0, yy), line, font=f, fill=fill)
  return y + len(lines) * size * line_gap

def caption_layer(L, step, text, highlight=None):
  W, H = L['W'], L['H']
  img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
  y = L['cap_y']
  if step:
    f = font(FONT_BOLD, 34); tw = d.textlength(step, font=f)
    d.rounded_rectangle([(W - tw) / 2 - 22, y, (W + tw) / 2 + 22, y + 56], 28, fill=ORANGE)
    d.text(((W - tw) / 2, y + 6), step, font=f, fill=NAVY); y += 78
  draw_text_center(d, W, y, text, font(FONT_BLACK, L['head']), WHITE, highlight)
  return img

def logo_pill(width):
  lg = Image.open(LOGO).convert('RGBA'); s = width / lg.width; lg = lg.resize((round(lg.width * s), round(lg.height * s)), Image.LANCZOS)
  pad = round(width * 0.09); pill = Image.new('RGBA', (lg.width + pad * 2, lg.height + pad * 2), (0, 0, 0, 0))
  ImageDraw.Draw(pill).rounded_rectangle([0, 0, pill.width - 1, pill.height - 1], pill.height // 2, fill=WHITE)
  pill.alpha_composite(lg, (pad, pad)); return pill

def mascot(path, h):
  m = Image.open(path).convert('RGBA'); s = h / m.height; return m.resize((round(m.width * s), h), Image.LANCZOS)

def card(L, kind):
  """最初と最後の1枚（静止画）"""
  W, H = L['W'], L['H']; img = background(L); d = ImageDraw.Draw(img); tall = H > 1500
  if kind == 'intro':
    pill = logo_pill(380); img.alpha_composite(pill, ((W - pill.width) // 2, 300 if tall else 70))
    y = 560 if tall else 270
    draw_text_center(d, W, y, '共通テストの\n英語リスニング', font(FONT_BLACK, 92 if tall else 80), WHITE, 'リスニング')
    d2 = font(FONT_BOLD, 42); draw_text_center(d, W, y + (300 if tall else 260), '解いて、聞いて、競う。', d2, WHITE)
    m = mascot(TOBIRA, 620 if tall else 470); img.alpha_composite(m, ((W - m.width) // 2, H - m.height - (220 if tall else 40)))
  else:
    y = 330 if tall else 70
    draw_text_center(d, W, y, '「聞き取れた！」を、\n毎日ひとつずつ。', font(FONT_BLACK, 84 if tall else 72), WHITE, '毎日ひとつずつ')
    pill = logo_pill(420); py = y + (300 if tall else 250); img.alpha_composite(pill, ((W - pill.width) // 2, py))
    f = font(FONT_BOLD, 40); yy = py + pill.height + 46
    yy = draw_text_center(d, W, yy, 'App Store・Google Play で', f, WHITE)
    yy = draw_text_center(d, W, yy, '「マナトビ」と検索', font(FONT_BLACK, 54), WHITE, 'マナトビ')
    draw_text_center(d, W, yy + 18, '無料（広告表示あり）', font(FONT_BOLD, 32), WHITE)
    m = mascot(TOBIRA2, 470 if tall else 330); img.alpha_composite(m, ((W - m.width) // 2, H - m.height - (230 if tall else 30)))
  return img.convert('RGB')

# ---------------- 書き出し ----------------
def run(cmd):
  r = subprocess.run(cmd, capture_output=True, text=True)
  if r.returncode: print(' '.join(cmd)); print(r.stderr[-3000:]); raise SystemExit(1)

def render_still(path_png, dur, out):
  run(['ffmpeg', '-y', '-v', 'error', '-loop', '1', '-t', f'{dur}', '-i', path_png,
       '-vf', f'fps={FPS},setsar=1,format=yuv420p', '-color_range', 'tv', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', out])

def render_clip(L, seg, idx, out):
  """録画の一部（t0〜t1 を speed 倍）をスマホ枠にはめて、見出しを重ねる"""
  x, y, w, h = phone_box(L)
  fr = os.path.join(TMP, f'frame_{L["W"]}x{L["H"]}.png')
  if not os.path.exists(fr): frame_layer(L).save(fr)
  cap = os.path.join(TMP, f'cap_{L["W"]}x{L["H"]}_{idx}.png')
  caption_layer(L, seg.get('step'), seg['text'], seg.get('hl')).save(cap)
  dur = (seg['t1'] - seg['t0']) / seg.get('speed', 1)
  fade_cap = seg.get('new_caption', True)
  capf = f"[2:v]format=rgba,fade=in:st=0:d=0.28:alpha=1[c]" if fade_cap else "[2:v]format=rgba[c]"
  slide = "y='if(lt(t,0.28),18*(1-t/0.28),0)'" if fade_cap else 'y=0'
  fc = (f"[0:v]trim=start={seg['t0']}:end={seg['t1']},setpts=(PTS-STARTPTS)/{seg.get('speed', 1)},fps={FPS},"
        f"scale={w}:{h}:flags=lanczos[v];"
        f"color=c=0x2458a6:s={L['W']}x{L['H']}:r={FPS}:d={dur:.3f}[bg];[bg][v]overlay={x}:{y}[a];"
        f"[a][1:v]overlay=0:0[b];{capf};[b][c]overlay=x=0:{slide},setsar=1,scale=out_range=tv,format=yuv420p")
  run(['ffmpeg', '-y', '-v', 'error', '-i', os.path.join(REC, seg['clip'] + '.mp4'), '-loop', '1', '-i', fr, '-loop', '1', '-i', cap,
       '-filter_complex', fc, '-t', f'{dur:.3f}', '-color_range', 'tv', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-an', out])
  return dur

def build(name, L, segments, bgm_from=7.0, bgm_gain=0.32):
  parts, events, t = [], [], 0.0
  for i, seg in enumerate(segments):
    out = os.path.join(TMP, f'{name}_{i:02d}.mp4')
    if seg['clip'] in ('intro', 'outro'):
      png = os.path.join(TMP, f'{name}_{seg["clip"]}.png'); card(L, seg['clip']).save(png)
      render_still(png, seg['dur'], out); dur = seg['dur']
      if seg['clip'] == 'outro': events.append((t + 0.15, 'win', 0.6))
    else:
      dur = render_clip(L, seg, i, out); m = meta(seg['clip']); sp = seg.get('speed', 1)
      at = lambda s: t + (s - seg['t0']) / sp
      for tp in m.get('taps', []):
        if seg['t0'] <= tp + 0.2 < seg['t1']: events.append((at(tp + 0.2), 'tap', 0.55))
      for (s, kind, vol) in seg.get('sfx', []):
        if seg['t0'] <= s < seg['t1']: events.append((at(s), kind, vol))
      if seg.get('listen') and m.get('play') and seg['t0'] <= m['play'] < seg['t1']:
        events.append((at(m['play'] + 0.15), 'LISTEN', 1.0))
    parts.append(out); t += dur
  total = t
  lst = os.path.join(TMP, f'{name}_list.txt'); open(lst, 'w').write(''.join(f"file '{os.path.abspath(p)}'\n" for p in parts))
  silent = os.path.join(TMP, f'{name}_video.mp4')
  run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', silent])

  # 音：BGM（問題の音声が流れる間は小さく）＋効果音＋問題の音声
  inputs = ['-ss', f'{bgm_from}', '-i', BGM]; fc = []; mix = []
  listen_at = [e[0] for e in events if e[1] == 'LISTEN']
  duck = ''.join(f"*if(between(t,{a - 0.3:.2f},{a + 4.0:.2f}),0.18,1)" for a in listen_at)
  fc.append(f"[0:a]atrim=0:{total:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.6,afade=t=out:st={total - 1.6:.3f}:d=1.6,"
            f"volume='{bgm_gain}{duck}':eval=frame[bgm]"); mix.append('[bgm]')
  for k, (at_, kind, vol) in enumerate(events):
    src = LISTEN if kind == 'LISTEN' else SFX(kind)
    inputs += ['-i', src]; ms = max(0, round(at_ * 1000))
    fc.append(f"[{k + 1}:a]volume={vol},adelay={ms}|{ms}[e{k}]"); mix.append(f'[e{k}]')
  fc.append(f"{''.join(mix)}amix=inputs={len(mix)}:normalize=0:dropout_transition=0,atrim=0:{total:.3f},"
            f"loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[aout]")
  mixed = os.path.join(TMP, f'{name}_audio.m4a')
  run(['ffmpeg', '-y', '-v', 'error', *inputs, '-filter_complex', ';'.join(fc), '-map', '[aout]', '-c:a', 'aac', '-b:a', '192k', mixed])
  final = os.path.join(OUT, f'{name}.mp4')
  run(['ffmpeg', '-y', '-v', 'error', '-i', silent, '-i', mixed, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'copy',
       '-shortest', '-movflags', '+faststart', final])
  # BGM なし版（Instagram 側で曲を付けたいとき用。効果音と問題の音声だけ）
  json.dump({'total': total, 'events': events, 'segments': [{k: v for k, v in s.items()} for s in segments]},
            open(os.path.join(TMP, f'{name}_timeline.json'), 'w'), ensure_ascii=False, indent=1)
  print('done', final, round(total, 2), 's', flush=True)

# ---------------- 台本 ----------------
P = meta('practice'); E = meta('explain'); R = meta('review'); B = meta('battle'); M = meta('missions'); Y = meta('mypage')
p_play = P['play']; p_ans = P['taps'][-1]   # 「解答と解説を見る」
b_taps = B['taps']                           # 対戦：…, はじめる(13.76), 回答×5
b_answers = b_taps[-5:]

POST = [   # 約45秒（Instagram のフィード・リール。全機能を1本で「使い方」として見せる）
  dict(clip='intro', dur=2.0),
  dict(clip='practice', t0=P['taps'][0] - 0.4, t1=P['taps'][3] + 0.9, speed=1.6, step='STEP 1', text='共通テストの全6大問から\n選んで、1回ずつ', hl='全6大問'),
  dict(clip='practice', t0=p_play - 0.5, t1=p_ans + 0.25, speed=1.15, step='STEP 2', text='音声を聞いて、\n4択で答える', hl='音声', listen=True),
  dict(clip='practice', t0=p_ans + 0.25, t1=p_ans + 2.9, step='STEP 3', text='その場で採点。\n正解でコインも', hl='その場で採点', sfx=[(p_ans + 0.55, 'correct', 0.8)]),
  dict(clip='explain', t0=E['taps'][-1] + 2.2, t1=E['end'] - 0.3, speed=1.6, step='STEP 4', text='強弱・和訳・語句まで\n解説ですぐ確認', hl='解説'),
  dict(clip='review', t0=R['taps'][-3] - 0.15, t1=R['end'] - 0.3, speed=1.35, step='STEP 5', text='間違えた問題は\n復習ノートに自動で', hl='復習ノート'),
  dict(clip='battle', t0=b_taps[0] - 0.1, t1=b_taps[1] + 0.7, speed=1.2, step='BATTLE', text='AIとも、友だちとも\n対戦できる', hl='対戦'),
  dict(clip='battle', t0=b_taps[6] + 4.7, t1=b_answers[0] + 1.6, speed=1.2, step='BATTLE', text='早押し4択で、\n正解を競う', hl='早押し4択',
       sfx=[(b_taps[6] + 4.9, 'countdown', 0.45), (b_taps[6] + 5.95, 'countdown', 0.45), (b_taps[6] + 7.15, 'start', 0.7), (b_answers[0] + 0.3, 'correct', 0.8)]),
  dict(clip='battle', t0=b_answers[4] - 1.2, t1=B['end'] - 0.6, speed=1.2, step='BATTLE', text='早押し4択で、\n正解を競う', hl='早押し4択', new_caption=False,
       sfx=[(b_answers[4] + 0.3, 'correct', 0.8), (b_answers[4] + 5.3, 'final', 0.6)]),
  dict(clip='missions', t0=M['taps'][0] - 0.05, t1=M['end'] - 1.2, speed=1.3, step='MISSION', text='毎日のミッションで、\n続けられる', hl='ミッション'),
  dict(clip='mypage', t0=Y['taps'][0] - 0.05, t1=Y['end'] - 0.6, speed=1.2, step='MY PAGE', text='とびら君を育てて、\nきせかえも', hl='きせかえ'),
  dict(clip='outro', dur=3.2),
]

STORY = [
  dict(clip='intro', dur=1.6),
  dict(clip='practice', t0=p_play - 0.3, t1=p_play + 4.1, text='本番形式の音声で、\n聞き取りを鍛える', hl='本番形式の音声', listen=True),
  dict(clip='practice', t0=p_ans - 0.3, t1=p_ans + 2.4, text='解いた直後に、\n採点と解説', hl='採点と解説', sfx=[(p_ans + 0.55, 'correct', 0.8)]),
  dict(clip='explain', t0=E['taps'][-1] + 3.0, t1=E['taps'][-1] + 6.4, speed=1.4, text='解いた直後に、\n採点と解説', hl='採点と解説', new_caption=False),
  dict(clip='battle', t0=b_taps[6] + 5.8, t1=b_answers[0] + 1.3, speed=1.25, text='AIと対戦して、\n早押しで競う', hl='対戦',
       sfx=[(b_taps[6] + 5.95, 'countdown', 0.45), (b_taps[6] + 7.15, 'start', 0.7), (b_answers[0] + 0.3, 'correct', 0.8)]),
  dict(clip='battle', t0=B['end'] - 2.6, t1=B['end'] - 0.3, text='AIと対戦して、\n早押しで競う', hl='対戦', new_caption=False, sfx=[(B['end'] - 2.4, 'final', 0.6)]),
  dict(clip='outro', dur=3.0),
]

if 'story' in WHICH: build('instagram_story_9x16', LAYOUTS['9x16'], STORY)
if 'post' in WHICH: build('instagram_post_reel_9x16', LAYOUTS['9x16'], POST)
if 'post45' in WHICH: build('instagram_post_feed_4x5', LAYOUTS['4x5'], POST)
