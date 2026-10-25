"""Adobe Firefly 用の動画キットを作る（2026-10-24）。

  python3 scripts/firefly-kit/build_kit.py [出力先=/tmp/firefly_kit]

出力
  refs/green/<pose>.png      … 1024×1024・真緑 #00FF00（背景なしモーションの First/Last）
  refs/transparent/<pose>.png… とびら君だけ透過（PNG・アルファ付き）。Firefly で背景を差し替えたいとき・確認用
  refs/cream/<pose>.png      … 1024×1024・クリーム #FBF5E8＋床の影（全画面演出の First/Last）
  refs/frames/<動画>_first.png… いまの動画の1コマ目（撮り直しの First/Last）
  cards/<ID>_<名前>.png      … 1本ずつの指示カード（First/Last の画像＋プロンプト＋設定）
  prompts.txt                … コピペ用（ID ごとにプロンプトだけ）
  Firefly_とびら君_動画キット.pdf
  docs/FIREFLY_KIT.md        … リポジトリの台帳（--docs のときだけ書く）
"""
import sys, subprocess, textwrap
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE))
import videos as VD

OUT = Path(sys.argv[1]) if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else Path('/tmp/firefly_kit')
NOTO = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
NOTOB = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
MONO = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
def font(sz, bold=False):
    return ImageFont.truetype(NOTOB if bold and Path(NOTOB).exists() else NOTO, sz, index=0)

S = 1024
CREAM = (251, 245, 232)

# ─── 参照画像 ─────────────────────────────────────────
def place(src, bg_rgba, shadow=False):
    """とびら君を正方形の下寄り中央に置く（全ポーズで足の位置をそろえる＝ずれない）"""
    canvas = Image.new('RGBA', (S, S), bg_rgba)
    im = Image.open(src).convert('RGBA')
    im.thumbnail((int(S * 0.66), int(S * 0.70)), Image.LANCZOS)
    x = (S - im.width) // 2; y = int(S * 0.88) - im.height
    if shadow:
        sh = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(sh)
        w = int(im.width * 0.8)
        d.ellipse([S // 2 - w // 2, int(S * 0.865), S // 2 + w // 2, int(S * 0.915)], fill=(120, 95, 60, 70))
        canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10)))
    canvas.alpha_composite(im, (x, y))
    return canvas

def build_refs():
    for sub in ['green', 'transparent', 'cream', 'frames']:
        (OUT / 'refs' / sub).mkdir(parents=True, exist_ok=True)
    for p in VD.POSES:
        src = ROOT / 'public' / 'mascots' / f'{p}.webp'
        place(src, (0, 255, 0, 255)).convert('RGB').save(OUT / 'refs/green' / f'{p}.png')
        place(src, (0, 0, 0, 0)).save(OUT / 'refs/transparent' / f'{p}.png')
        place(src, CREAM + (255,), shadow=True).convert('RGB').save(OUT / 'refs/cream' / f'{p}.png')
    for n in ['title', 'attack', 'gacha', 'victory']:
        dst = OUT / 'refs/frames' / f'{n}_first.png'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(ROOT / 'public/cinematics' / f'{n}.mp4'),
                        '-frames:v', '1', '-vf', 'scale=1024:1024:flags=lanczos', str(dst)], check=True)

def ref_path(spec):
    if not spec: return None
    kind, name = spec.split(':')
    return OUT / 'refs' / kind / f'{name}.png'

def ref_label(spec):
    if not spec: return '（入れない）'
    kind, name = spec.split(':')
    return f'refs/{kind}/{name}.png'

# ─── カード（1本ずつの指示書・画像） ─────────────────────
KIND_JA = {'motion': '背景なし（緑→透過）', 'cinema': '全画面の演出（背景ごと）'}
STATUS_JA = {'reshoot': '撮り直し', 'new': '新規'}

def wrap(draw, text, fnt, width):
    lines = []
    for para in text.split('\n'):
        cur = ''
        for ch in para:
            if draw.textlength(cur + ch, font=fnt) > width:
                # 英文は単語の途中で切らない
                if ch != ' ' and ' ' in cur and all(ord(c) < 128 for c in cur[-12:]):
                    head, tail = cur.rsplit(' ', 1); lines.append(head); cur = tail + ch
                else:
                    lines.append(cur); cur = ch.lstrip()
            else:
                cur += ch
        lines.append(cur)
    return lines

def card(v):
    W, H = 1600, 1000
    im = Image.new('RGB', (W, H), 'white'); d = ImageDraw.Draw(im)
    accent = (36, 88, 166) if v['kind'] == 'motion' else (201, 133, 18)
    d.rectangle([0, 0, W, 86], fill=accent)
    d.text((28, 16), f"{v['id']}  {v['name']}", font=font(40, True), fill='white')
    tag = f"{STATUS_JA[v['status']]}｜{KIND_JA[v['kind']]}｜優先度 {v['prio']}｜{v['sec']}秒" + ('｜くり返し' if v['loop'] else '')
    d.text((W - 28 - d.textlength(tag, font=font(26)), 28), tag, font=font(26), fill='white')
    # First / Last
    T = 330
    for i, (lab, spec) in enumerate([('First（最初のコマ）', v['first']), ('Last（最後のコマ）', v['last'])]):
        x = 28 + i * (T + 24); y = 110
        d.text((x, y), lab, font=font(24, True), fill=(40, 40, 40))
        p = ref_path(spec)
        box = [x, y + 38, x + T, y + 38 + T]
        if p and p.exists():
            r = Image.open(p).convert('RGB').resize((T, T)); im.paste(r, (x, y + 38))
        else:
            d.rectangle(box, fill=(240, 240, 240)); d.text((x + 70, y + 38 + T // 2 - 16), '入れない', font=font(30), fill=(150, 150, 150))
        d.rectangle(box, outline=(200, 200, 200), width=2)
        d.text((x, y + 44 + T), ref_label(spec), font=font(20), fill=(90, 90, 90))
    # 右側：使い道・動き
    x0 = 28 + 2 * (T + 24) + 10; wmax = W - x0 - 28; y = 110
    for head, body in [('どこで使う', v['where']), ('動き（日本語）', v['ja'])]:
        d.text((x0, y), head, font=font(24, True), fill=accent); y += 36
        for ln in wrap(d, body, font(24), wmax): d.text((x0, y), ln, font=font(24), fill=(30, 30, 30)); y += 34
        y += 12
    if v.get('note'):
        d.text((x0, y), '注意', font=font(24, True), fill=(179, 38, 30)); y += 36
        for ln in wrap(d, v['note'], font(22), wmax): d.text((x0, y), ln, font=font(22), fill=(120, 30, 30)); y += 31
    # 下：プロンプト
    y = 560
    d.rectangle([20, y - 10, W - 20, H - 70], fill=(246, 247, 250), outline=(210, 214, 222))
    d.text((36, y), 'Prompt（そのまま貼る）', font=font(24, True), fill=(40, 40, 40)); y += 38
    mono = ImageFont.truetype(MONO, 19)
    for ln in wrap(d, VD.prompt(v), mono, W - 80):
        d.text((36, y), ln, font=mono, fill=(20, 20, 20)); y += 25
    s = 'Model: Firefly Video ｜ Square 1:1 ｜ 1080p ｜ 5秒 ｜ Enhance prompt: オフ ｜ 音声なし ｜ ' + \
        ('Camera Motion: Static（Last なしのとき）' if not v['last'] else 'Last あり＝Motion は自動で無効')
    d.text((28, H - 54), s, font=font(22), fill=(70, 70, 70))
    cut = v['cut'].split()
    imp = (f"取り込み: bash scripts/tobira-motion/import.sh {v['id']}.mp4 {v['name']} {cut[0]} {cut[1]}" if v['kind'] == 'motion'
           else f"取り込み: bash scripts/firefly-kit/import-cinematic.sh {v['id']}.mp4 {v['name']} {cut[0]} {cut[1]}")
    d.text((28, H - 28), imp, font=font(18), fill=(110, 110, 110))
    (OUT / 'cards').mkdir(parents=True, exist_ok=True)
    out = OUT / 'cards' / f"{v['id']}_{v['name']}.png"; im.save(out, optimize=True)
    return out

# ─── PDF ──────────────────────────────────────────────
def build_pdf(cards):
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.units import mm
    from reportlab.lib import colors
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image as RLImage)
    pdfmetrics.registerFont(TTFont('JP', '/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf'))
    pdfmetrics.registerFont(TTFont('MONO', MONO))
    P = lambda n, **k: ParagraphStyle(n, fontName=k.pop('f', 'JP'), **k)
    h1 = P('h1', fontSize=20, leading=28, textColor=colors.HexColor('#172a4f'), spaceAfter=6)
    h2 = P('h2', fontSize=13.5, leading=19, textColor=colors.HexColor('#2458a6'), spaceBefore=8, spaceAfter=4)
    b = P('b', fontSize=9.6, leading=14.5)
    sm = P('sm', fontSize=8.4, leading=12, textColor=colors.HexColor('#555555'))
    mono = P('m', f='MONO', fontSize=8.2, leading=11)
    e = lambda s: str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    pg = landscape(A4)
    doc = SimpleDocTemplate(str(OUT / 'Firefly_とびら君_動画キット.pdf'), pagesize=pg,
                            leftMargin=12 * mm, rightMargin=12 * mm, topMargin=11 * mm, bottomMargin=11 * mm,
                            title='とびら君 動画キット（Adobe Firefly）', author='まなとび')
    s = []
    nm = sum(v['kind'] == 'motion' for v in VD.V); nc = len(VD.V) - nm
    nr = sum(v['status'] == 'reshoot' for v in VD.V)
    s += [Paragraph('とびら君 動画キット（Adobe Firefly 用）', h1),
          Paragraph(f'2026-10-24 ／ 全 {len(VD.V)} 本（撮り直し {nr}・新規 {len(VD.V) - nr}）＝ 背景なしモーション {nm} 本 ＋ 全画面の演出 {nc} 本', b),
          Spacer(1, 4),
          Paragraph('1. 生成の設定（全部共通）', h2)]
    rows = [['項目', '指定'],
            ['Model', 'Firefly Video（Adobe 製・商用利用に安全）。Kling / Veo / Ray / Runway / Gemini などのパートナーモデルは選ばない'],
            ['Aspect ratio', 'Square (1:1)'], ['Resolution', '1080p'], ['Duration / FPS', '5秒・24fps（取り込みで必要な長さに切る）'],
            ['Frames', 'First と Last に、カードに書いた参照画像を入れる（Last「入れない」のものは First だけ＋Camera Motion: Static）'],
            ['Enhance prompt', 'オフ（勝手に背景・紙ふぶき・文字を足されるため）'],
            ['Seed', '良い結果が出たら番号を控える（同じ seed で作り直せる）'],
            ['音声', 'なし'], ['ダウンロード', 'MP4。ファイル名は「ID.mp4」（例：M01.mp4）にして送る']]
    t = Table([[Paragraph(e(a), b), Paragraph(e(c), b)] for a, c in rows], colWidths=[40 * mm, 225 * mm])
    t.setStyle(TableStyle([('GRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#c9ced8')),
                           ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e8eef9')), ('VALIGN', (0, 0), (-1, -1), 'TOP')]))
    s += [t, Paragraph('2. 2種類の動画', h2)]
    rows = [['種類', '背景', '参照画像', 'アプリでの使い方'],
            ['背景なしモーション（M）', '真緑 #00FF00 の単色。影・床・紙ふぶき・キラキラは入れない',
             'refs/green/*.png', 'とびら君だけを透過にして、いつもの静止画の位置でその場で動かす'],
            ['全画面の演出（C）', 'クリーム #FBF5E8＋床の影（光・紙ふぶきなどの演出 OK）',
             'refs/cream/*.png ・ refs/frames/*.png', '背景ごと全画面（または大きな枠）で流す']]
    t = Table([[Paragraph(e(c), b) for c in r] for r in rows], colWidths=[45 * mm, 80 * mm, 55 * mm, 85 * mm])
    t.setStyle(TableStyle([('GRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#c9ced8')),
                           ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e8eef9')), ('VALIGN', (0, 0), (-1, -1), 'TOP')]))
    s += [t, Paragraph('ブルーバックは使わない：とびら君は体が青いので、青で抜くと体が透ける（実測で体の 52% が透けた。緑なら 0%）。'
                       '透過が必要なのはとびら君（M の動画）だけ。refs/transparent/ は確認用・差し替え用。', sm),
          Paragraph('3. 固定文（プロンプトにすでに入っている）', h2),
          Paragraph('キャラクター固定文（全プロンプトの先頭）', b), Paragraph(e(VD.CHAR), mono), Spacer(1, 3),
          Paragraph('背景固定文：背景なしモーション（M）の最後', b), Paragraph(e(VD.GREEN), mono), Spacer(1, 3),
          Paragraph('背景固定文：全画面の演出（C）の最後', b), Paragraph(e(VD.CREAM), mono),
          Paragraph('4. 失敗しやすいところ（出たら作り直し）', h2)]
    for x in ['文字・数字・記号が出る（特に本の表紙・メダル・吹き出し）→ 作り直し。「Absolutely no text」を消さない',
              '後ろを向く・背中が見える回転 → 作り直し（前回の victory・attack で発生）',
              '鉛筆・三角・消しゴムが消える／形が変わる → 作り直し',
              'M（緑背景）で影・床・キラキラ・音符・Zzz が出る → 緑に混ざって抜けないので作り直し',
              '最初と最後で位置がずれる → アプリで静止画に戻るときに「飛ぶ」。First/Last に同じ画像を入れて防ぐ',
              '同じ画像を First/Last に入れると動きが小さくなりやすい → 動きを大きめの言葉で書いてある。それでも止まって見えたら Last を外して First だけで作る']:
        s.append(Paragraph('・' + e(x), b))
    s += [PageBreak(), Paragraph('5. 全動画の一覧（優先度 A から作る）', h2)]
    rows = [['ID', '名前', '種類', '優先', '秒', 'First → Last', 'どこで使う']]
    for v in VD.V:
        rows.append([v['id'], v['name'], ('撮り直し・' if v['status'] == 'reshoot' else '') + ('背景なし' if v['kind'] == 'motion' else '全画面'),
                     v['prio'], v['sec'] + ('↻' if v['loop'] else ''), f"{ref_label(v['first']).split('/', 1)[1]} → {ref_label(v['last']).split('/', 1)[-1]}",
                     v['where']])
    t = Table([[Paragraph(e(c), sm) for c in r] for r in rows],
              colWidths=[11 * mm, 30 * mm, 26 * mm, 10 * mm, 22 * mm, 62 * mm, 112 * mm], repeatRows=1)
    t.setStyle(TableStyle([('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#c9ced8')),
                           ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e8eef9')), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                           ('TOPPADDING', (0, 0), (-1, -1), 1.5), ('BOTTOMPADDING', (0, 0), (-1, -1), 1.5)]
                          + [('BACKGROUND', (0, i + 1), (-1, i + 1), colors.HexColor('#fff4dc'))
                             for i, v in enumerate(VD.V) if v['status'] == 'reshoot']))
    s += [t, Paragraph('↻＝くり返し再生（最初と最後を同じにしてつなぎ目をなくす）。黄色の行＝いまアプリで使っている動画の撮り直し。', sm),
          PageBreak(), Paragraph('6. 参照画像（First / Last に入れる画像）', h2),
          Paragraph('左から：緑（M 用）／透過（とびら君だけ・確認用）／クリーム（C 用）。ファイル名はポーズ名。', sm)]
    # 参照画像の一覧
    cells, row = [], []
    for p in VD.POSES:
        trio = Image.new('RGB', (3 * 256 + 8, 256), 'white')
        chk = Image.new('RGB', (256, 256), 'white'); dd = ImageDraw.Draw(chk)
        for yy in range(0, 256, 16):
            for xx in range(0, 256, 16):
                if (xx // 16 + yy // 16) % 2: dd.rectangle([xx, yy, xx + 15, yy + 15], fill=(225, 225, 225))
        tr = Image.open(OUT / 'refs/transparent' / f'{p}.png').resize((256, 256)); chk.paste(tr, (0, 0), tr)
        trio.paste(Image.open(OUT / 'refs/green' / f'{p}.png').resize((256, 256)), (0, 0))
        trio.paste(chk, (260, 0)); trio.paste(Image.open(OUT / 'refs/cream' / f'{p}.png').resize((256, 256)), (520, 0))
        fp = OUT / 'cards' / f'_trio_{p}.png'; trio.save(fp)
        row.append([RLImage(str(fp), width=78 * mm, height=78 * mm * 256 / 776), Paragraph(p, sm)])
        if len(row) == 3: cells.append(row); row = []
    if row: cells.append(row + [''] * (3 - len(row)))
    t = Table(cells, colWidths=[90 * mm] * 3)
    s += [t, Spacer(1, 4), Paragraph('いまの動画の1コマ目（撮り直しの First/Last）：refs/frames/', sm)]
    fr = [RLImage(str(OUT / 'refs/frames' / f'{n}.png'), width=40 * mm, height=40 * mm) for n in VD.CINE_FRAMES]
    s += [Table([fr, [Paragraph(n, sm) for n in VD.CINE_FRAMES]], colWidths=[62 * mm] * 4)]
    # 1本ずつ
    for c in cards:
        s += [PageBreak(), RLImage(str(c), width=pg[0] - 24 * mm, height=(pg[0] - 24 * mm) * 1000 / 1600)]
    doc.build(s)
    for f in (OUT / 'cards').glob('_trio_*.png'): f.unlink()

def build_txt():
    lines = ['とびら君 動画キット：プロンプト（ID ごとにそのまま貼る）', 'Model=Firefly Video / Square 1:1 / 1080p / 5秒 / Enhance prompt オフ', '']
    for v in VD.V:
        lines += ['=' * 70, f"{v['id']} {v['name']}  [{STATUS_JA[v['status']]}・{KIND_JA[v['kind']]}・優先度{v['prio']}]",
                  f"First: {ref_label(v['first'])}   Last: {ref_label(v['last'])}", '-' * 70, VD.prompt(v), '']
    (OUT / 'prompts.txt').write_text('\n'.join(lines), encoding='utf-8')

def build_docs():
    L = ['# Adobe Firefly 動画キットの台帳（2026-10-24）', '',
         '元データは `scripts/firefly-kit/videos.py`（ここを直して `python3 scripts/firefly-kit/build_kit.py --docs` で PDF・画像・この表を作り直す）。',
         '生成は **Adobe Firefly の Firefly Video モデルだけ**（商用利用に安全。パートナーモデルは使わない）。', '',
         '- 背景なしモーション（M）：真緑で作り、`scripts/tobira-motion/import.sh` で透過 webm/webp/png に → `src/components/TobiraMotion.tsx`',
         '- 全画面の演出（C）：クリーム背景のまま `scripts/firefly-kit/import-cinematic.sh` で mp4 に → `src/components/CinematicClip.tsx`', '',
         '| ID | 名前 | 種類 | 優先 | 秒 | First → Last | どこで使う | 状態 |', '|---|---|---|---|---|---|---|---|']
    for v in VD.V:
        L.append(f"| {v['id']} | {v['name']} | {('撮り直し・' if v['status'] == 'reshoot' else '')}{'背景なし' if v['kind'] == 'motion' else '全画面'} | {v['prio']} | {v['sec']}{'↻' if v['loop'] else ''} | "
                 f"{ref_label(v['first'])} → {ref_label(v['last'])} | {v['where']} | 未生成 |")
    L += ['', '受け取ったら：ファイル名 `ID.mp4` → カードの「取り込み」行のコマンド → 登録（TOBIRA_MOTIONS / CINEMATIC_CLIPS）→ この表の状態を「取り込み済み（日付・seed）」に。', '']
    (ROOT / 'docs/FIREFLY_KIT.md').write_text('\n'.join(L), encoding='utf-8')

if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    build_refs()
    cards = [card(v) for v in VD.V]
    build_txt()
    build_pdf(cards)
    if '--docs' in sys.argv: build_docs()
    print('OK', OUT, len(cards), 'cards')
