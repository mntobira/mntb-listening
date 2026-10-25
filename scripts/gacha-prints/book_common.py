"""UR（大当たり）「完全版」の本の共通レイアウト（2026-10-24）。

紺と金の表紙・ページ上の帯・見出しバー・囲み・サムネイル作成をまとめる。
英語はプロポーショナルの IPA Pゴシック（EN）、日本語は IPA ゴシック（JP / 疑似ボールド JPB）。
"""
import subprocess, tempfile
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import fonts as _fonts

F, FB = _fonts.setup(); _fonts.install_fake_bold(); _fonts.match_stroke_to_fill()
pdfmetrics.registerFont(TTFont('EN', '/usr/share/fonts/opentype/ipafont-gothic/ipagp.ttf'))
pdfmetrics.registerFont(TTFont('DV', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))

ROOT = Path(__file__).resolve().parents[2]
MARKS = '①②③④⑤⑥'
GOLD = colors.HexColor('#b8860b'); GOLD2 = colors.HexColor('#e9c46a'); GOLD_SOFT = colors.HexColor('#fff6df')
NIGHT = colors.HexColor('#14213d'); INK = colors.HexColor('#22201a'); SUB = colors.HexColor('#6b5d45')
LINE = colors.HexColor('#e2d3b5'); GREEN = colors.HexColor('#2f7a52'); BLUE = colors.HexColor('#2458a6')
PAPER = colors.HexColor('#fbfaf6'); MINT = colors.HexColor('#f4f8f2'); SKY = colors.HexColor('#eef3fb')

S = lambda n, **kw: ParagraphStyle(n, fontName=kw.pop('font', F), textColor=kw.pop('color', INK), **kw)
st = {
    'h1': S('h1', font=FB, fontSize=27, leading=35, color=colors.white), 'h1s': S('h1s', fontSize=12, leading=19, color=colors.white),
    'eyebrow': S('eb', font=FB, fontSize=10, leading=14, color=GOLD2),
    'h2': S('h2', font=FB, fontSize=14, leading=19, color=NIGHT, spaceAfter=3), 'h3': S('h3', font=FB, fontSize=10.8, leading=15, color=GOLD),
    'body': S('b', fontSize=9.4, leading=14.2), 'small': S('s', fontSize=8.2, leading=11.8, color=SUB),
    'en': S('en', font='EN', fontSize=10.2, leading=15.2), 'enh': S('enh', font='EN', fontSize=11.5, leading=15, color=NIGHT),
    'enq': S('enq', font='EN', fontSize=10.0, leading=14.2), 'enc': S('enc', font='EN', fontSize=9.6, leading=13.2),
    'ans': S('a', font=FB, fontSize=10, leading=14, color=GREEN), 'ex': S('ex', fontSize=8.9, leading=13.2),
    'unit': S('u', font=FB, fontSize=12, leading=16, color=colors.white), 'cell': S('c', fontSize=8.6, leading=11.6),
    'encell': S('ec', font='EN', fontSize=9.0, leading=12),
}

_CMAP = None
def _has(ch):
    global _CMAP
    if _CMAP is None:
        from fontTools.ttLib import TTFont as FT
        _CMAP = FT('/usr/share/fonts/opentype/ipafont-gothic/ipagp.ttf').getBestCmap()
    return ord(ch) in _CMAP

def esc(s):
    """XML をエスケープし、IPA に無い字は DejaVu で描く（□に化けない）"""
    s = str(s).replace('\u301c', '～').replace('\ufe0f', '').replace('👍', '(thumbs-up)')
    s = s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    return ''.join(f'<font name="DV">{c}</font>' if ord(c) > 127 and not _has(c) else c for c in s)

def on_page(title, footer):
    """1ページ目＝紺と金の表紙、2ページ目以降＝上に紺の帯・下にフッターとページ番号"""
    def f(c, doc):
        w, h = A4
        c.saveState()
        if doc.page == 1:
            c.setFillColor(NIGHT); c.rect(0, 0, w, h, stroke=0, fill=1)
            c.setStrokeColor(GOLD2); c.setLineWidth(2.2); c.rect(9 * mm, 9 * mm, w - 18 * mm, h - 18 * mm)
            c.setLineWidth(0.6); c.rect(11.5 * mm, 11.5 * mm, w - 23 * mm, h - 23 * mm)
            c.setFillColor(GOLD2); c.setFont(FB, 9); c.drawCentredString(w / 2, 17 * mm, '★ 大当たり UR ／ 完全版 ／ マナトビ ★')
        else:
            c.setFillColor(NIGHT); c.rect(0, h - 7 * mm, w, 7 * mm, stroke=0, fill=1)
            c.setFillColor(GOLD2); c.rect(0, h - 7.6 * mm, w, 0.6 * mm, stroke=0, fill=1)
            c.setFont(FB, 7.5); c.setFillColor(colors.white); c.drawString(14 * mm, h - 4.8 * mm, f'★ UR 完全版 ★  {title}')
            c.setFont(F, 7.5); c.setFillColor(SUB)
            c.drawString(14 * mm, 7 * mm, footer); c.drawRightString(w - 14 * mm, 7 * mm, str(doc.page))
        c.restoreState()
    return f

def bar(text, right=''):
    t = Table([[Paragraph(esc(text), st['unit']), Paragraph(esc(right), S('r', fontSize=8.5, leading=12, color=GOLD2, alignment=2))]],
              colWidths=[120 * mm, 62 * mm])
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), NIGHT), ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                           ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 6), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                           ('LINEBELOW', (0, 0), (-1, -1), 1.4, GOLD2)]))
    return t

def box(flows, bg=GOLD_SOFT, border=GOLD, pad=7, width=182 * mm):
    t = Table([[flows]], colWidths=[width])
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), bg), ('BOX', (0, 0), (-1, -1), 0.8, border),
                           ('LEFTPADDING', (0, 0), (-1, -1), pad), ('RIGHTPADDING', (0, 0), (-1, -1), pad),
                           ('TOPPADDING', (0, 0), (-1, -1), pad - 2), ('BOTTOMPADDING', (0, 0), (-1, -1), pad)]))
    return t

def cover_stats(stats):
    """表紙の金枠つき数字（[(大きい字, 小さい字)]）"""
    cells = [Paragraph(f'<font color="#e9c46a" size="13"><b>{esc(a)}</b></font><br/><font size="8" color="#ffffff">{esc(b)}</font>', st['body']) for a, b in stats]
    t = Table([cells], colWidths=[182 * mm / len(cells)] * len(cells))
    t.setStyle(TableStyle([('BOX', (0, 0), (-1, -1), 0.8, GOLD2), ('INNERGRID', (0, 0), (-1, -1), 0.5, GOLD2),
                           ('TOPPADDING', (0, 0), (-1, -1), 9), ('BOTTOMPADDING', (0, 0), (-1, -1), 9), ('LEFTPADDING', (0, 0), (-1, -1), 7)]))
    return t

def grid(rows, widths, head_bg=GOLD_SOFT, size=8.6, pad=2.4):
    """見出し行つきの表（中身は Paragraph にして折り返す）"""
    body = [[c if not isinstance(c, str) else Paragraph(esc(c), st['cell']) for c in r] for r in rows]
    t = Table(body, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([('GRID', (0, 0), (-1, -1), 0.35, LINE), ('BACKGROUND', (0, 0), (-1, 0), head_bg),
                           ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('TOPPADDING', (0, 0), (-1, -1), pad), ('BOTTOMPADDING', (0, 0), (-1, -1), pad)]))
    return t

def make_thumb(pdf: Path, pid: str):
    from PIL import Image
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(['pdftoppm', '-r', '72', '-f', '1', '-l', '1', '-png', str(pdf), f'{d}/p'], check=True, capture_output=True)
        im = Image.open(next(Path(d).glob('p*.png'))).convert('RGB'); im = im.resize((360, int(360 * im.height / im.width)))
        im.crop((0, 0, 360, 510)).save(ROOT / f'public/prints/thumbs/{pid}.webp', 'WEBP', quality=82)

def page_count(pdf: Path) -> int:
    import re
    r = subprocess.run(['pdfinfo', str(pdf)], capture_output=True, text=True).stdout
    return int(re.search(r'Pages:\s+(\d+)', r).group(1))
