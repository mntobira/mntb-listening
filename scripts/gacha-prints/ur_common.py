"""UR 学習プリントの共通レイアウト（理科・化学・数学）。

  items: [{ 'unit': 単元名, 'stem': 問題文, 'choices': [4つ], 'answer': 0..3,
            'tags': [小さな注記], 'explain': [(見出し, 本文), ...] }]
  正解位置は balance() で ①〜④ に均等にする（選択肢の中身・解説の文章は変えない）。
"""
import random, re, subprocess, tempfile
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
                                PageBreak, KeepTogether, CondPageBreak)
from reportlab.platypus.doctemplate import NextPageTemplate
import fonts as _fonts

F, FB = _fonts.setup(); _fonts.install_fake_bold(); _fonts.match_stroke_to_fill()
pdfmetrics.registerFont(TTFont('DV', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
_IPA_CMAP = None

def _ipa_has(ch):
    global _IPA_CMAP
    if _IPA_CMAP is None:
        from fontTools.ttLib import TTFont as FT
        _IPA_CMAP = FT(_fonts.IPA).getBestCmap()
    return ord(ch) in _IPA_CMAP

MARKS = '①②③④'
GOLD = colors.HexColor('#c98512'); GOLD_SOFT = colors.HexColor('#fff4dc'); NIGHT = colors.HexColor('#172a4f')
INK = colors.HexColor('#2b2418'); SUB = colors.HexColor('#6b5d45'); LINE = colors.HexColor('#e2d3b5')
GREEN = colors.HexColor('#2f7a52'); BLUE = colors.HexColor('#2458a6'); RED = colors.HexColor('#b3261e')

S = lambda name, **kw: ParagraphStyle(name, fontName=kw.pop('font', F), textColor=kw.pop('color', INK), **kw)
st = {
  'h1': S('h1', font=FB, fontSize=23, leading=30, color=colors.white),
  'cover_sub': S('cs', fontSize=11, leading=17, color=colors.white),
  'h2': S('h2', font=FB, fontSize=13.5, leading=18, color=NIGHT, spaceBefore=4, spaceAfter=4),
  'unit': S('unit', font=FB, fontSize=11, leading=15, color=colors.white),
  'body': S('body', fontSize=9.6, leading=14.5),
  'small': S('small', fontSize=8.4, leading=12, color=SUB),
  'q': S('q', fontSize=10.2, leading=15),
  'qn': S('qn', font=FB, fontSize=11, leading=15, color=GOLD),
  'ch': S('ch', fontSize=9.6, leading=13.6),
  'ans': S('ans', font=FB, fontSize=10.3, leading=15, color=GREEN),
  'ex': S('ex', fontSize=9.0, leading=13.6),
  'exs': S('exs', fontSize=8.5, leading=12.4, color=SUB),
}

_REPL = {'⭐': '★', '㎠': 'cm²', '㎤': 'cm³', '㎥': 'm³', '\ufe0f': '', '\u301c': '～', '~': '～'}

def esc(s):
    s = str(s)
    for a, b in _REPL.items():
        s = s.replace(a, b)
    s = s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    # IPA ゴシックに無い字（下付き・上付き数字、≤ ≥ など）は DejaVu で描く（□に化けるのを防ぐ）
    out = []
    for ch in s:
        if ord(ch) > 127 and not _ipa_has(ch):
            out.append(f'<font name="DV">{ch}</font>')
        else:
            out.append(ch)
    return ''.join(out)

def esc_ml(s):
    # アプリの解説にある <b>…</b>（強調）だけは太字として生かす
    return esc(s).replace('&lt;b&gt;', '<b>').replace('&lt;/b&gt;', '</b>').replace('\n', '<br/>')

def balance(items, seed):
    """正解位置を ①〜④ に均等にする（固定の乱数・同じデータなら同じ結果）"""
    rnd = random.Random(seed)
    n = len(items)
    targets = [k for k in range(4) for _ in range(n // 4)] + list(range(n % 4))
    rnd.shuffle(targets)
    out = []
    for it, tgt in zip(items, targets):
        a = it['answer']
        others = [k for k in range(4) if k != a]
        rnd.shuffle(others)
        order = [None] * 4
        order[tgt] = a
        for k, o in zip([k for k in range(4) if k != tgt], others):
            order[k] = o
        out.append({**it, 'choices': [it['choices'][o] for o in order], 'answer': tgt})
    return out

def unit_bar(text):
    t = Table([[Paragraph(esc(text), st['unit'])]], colWidths=[182 * mm])
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), NIGHT), ('LEFTPADDING', (0, 0), (-1, -1), 8),
                           ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                           ('ROUNDEDCORNERS', [4, 4, 4, 4])]))
    return t

def box(flows, bg=GOLD_SOFT, border=GOLD, pad=7):
    t = Table([[flows]], colWidths=[182 * mm])
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), bg), ('BOX', (0, 0), (-1, -1), 0.8, border),
                           ('LEFTPADDING', (0, 0), (-1, -1), pad), ('RIGHTPADDING', (0, 0), (-1, -1), pad),
                           ('TOPPADDING', (0, 0), (-1, -1), pad - 2), ('BOTTOMPADDING', (0, 0), (-1, -1), pad),
                           ('ROUNDEDCORNERS', [5, 5, 5, 5])]))
    return t

def _choices_table(choices):
    longest = max(len(c) for c in choices)
    if longest > 22:  # 長い選択肢は1列に
        rows = [[Paragraph(f'{MARKS[k]} {esc(c)}', st['ch'])] for k, c in enumerate(choices)]
        widths = [160 * mm]
    else:
        rows = [[Paragraph(f'{MARKS[0]} {esc(choices[0])}', st['ch']), Paragraph(f'{MARKS[1]} {esc(choices[1])}', st['ch'])],
                [Paragraph(f'{MARKS[2]} {esc(choices[2])}', st['ch']), Paragraph(f'{MARKS[3]} {esc(choices[3])}', st['ch'])]]
        widths = [80 * mm, 80 * mm]
    t = Table(rows, colWidths=widths)
    t.setStyle(TableStyle([('LEFTPADDING', (0, 0), (-1, -1), 0), ('TOPPADDING', (0, 0), (-1, -1), 1), ('BOTTOMPADDING', (0, 0), (-1, -1), 1)]))
    return t

def build_print(*, out: Path, thumb: Path, title: str, eyebrow: str, subtitle: str, footer: str, items, seed: int,
                howto, stats, unit_notes=None, extra_sections=None, minutes_per_q=1):
    """PDF を作り、(items, pages) を返す。unit_notes: {単元名: [(見出し, 本文)]}（単元の要点）"""
    items = balance(items, seed)
    unit_notes = unit_notes or {}
    units = []
    for i, it in enumerate(items):
        if not units or units[-1]['title'] != it['unit']:
            units.append({'title': it['unit'], 'start': i, 'end': i})
        units[-1]['end'] = i
    n = len(items)
    story = [NextPageTemplate('body')]

    # ===== 表紙 =====
    story += [Spacer(1, 22 * mm), Paragraph(esc(eyebrow), S('e', font=FB, fontSize=9, color=colors.HexColor('#ffd36b'))),
              Spacer(1, 3 * mm), Paragraph(esc(title).replace('\n', '<br/>'), st['h1']), Spacer(1, 4 * mm),
              Paragraph(esc(subtitle).replace('\n', '<br/>'), st['cover_sub']), Spacer(1, 38 * mm)]
    cells = [Paragraph(f'<b>{esc(a)}</b><br/><font size="8" color="#6b5d45">{esc(b)}</font>', st['body']) for a, b in stats]
    stt = Table([cells], colWidths=[182 * mm / len(cells)] * len(cells))
    stt.setStyle(TableStyle([('BOX', (0, 0), (-1, -1), 0.8, LINE), ('INNERGRID', (0, 0), (-1, -1), 0.5, LINE),
                             ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7), ('LEFTPADDING', (0, 0), (-1, -1), 8)]))
    story += [stt, Spacer(1, 6 * mm)]
    story.append(box([Paragraph('<b>このプリントの使い方</b>', S('b', font=FB, fontSize=10.5, color=GOLD)), Spacer(1, 2)] +
                     [Paragraph(esc(h), st['body']) for h in howto]))
    story.append(Spacer(1, 5 * mm))
    toc = []
    for k in range(0, len(units), 2):
        row = [Paragraph(f'{esc(u["title"])}　<font color="#6b5d45">問{u["start"] + 1}〜{u["end"] + 1}</font>', st['small']) for u in units[k:k + 2]]
        toc.append(row + [''] * (2 - len(row)))
    tt = Table([[Paragraph('<b>収録単元</b>', st['small']), '']] + toc, colWidths=[91 * mm, 91 * mm])
    tt.setStyle(TableStyle([('LINEBELOW', (0, 0), (-1, -1), 0.3, LINE), ('TOPPADDING', (0, 0), (-1, -1), 2), ('BOTTOMPADDING', (0, 0), (-1, -1), 2)]))
    story += [tt, PageBreak()]

    # ===== 問題 =====
    story.append(Paragraph(f'演習問題（全{n}問）', st['h2']))
    story.append(Paragraph(f'最も適切なものを①〜④のうちから1つずつ選びなさい。答えは解答用紙へ。1問{minutes_per_q}分が目安。', st['small']))
    story.append(Spacer(1, 3 * mm))
    for u in units:
        story += [CondPageBreak(55 * mm), unit_bar(u['title']), Spacer(1, 2 * mm)]
        for i in range(u['start'], u['end'] + 1):
            it = items[i]
            body = [Paragraph(esc_ml(it['stem']), st['q']), Spacer(1, 1.5), _choices_table(it['choices'])]
            q = Table([[Paragraph(str(i + 1), st['qn']), body, Paragraph('<font color="#c9b893">□</font>', S('x', fontSize=16, leading=18))]],
                      colWidths=[10 * mm, 162 * mm, 10 * mm])
            q.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 0),
                                   ('LINEBELOW', (0, 0), (-1, -1), 0.3, LINE), ('BOTTOMPADDING', (0, 0), (-1, -1), 5), ('TOPPADDING', (0, 0), (-1, -1), 4)]))
            story.append(KeepTogether(q))
        story.append(Spacer(1, 3 * mm))
    story.append(PageBreak())

    # ===== 解答用紙 =====
    story.append(Paragraph('解答用紙', st['h2']))
    story.append(Paragraph('番号に○をつける。採点は ○× の欄へ。', st['small']))
    story.append(Spacer(1, 2 * mm))
    per = -(-n // 4)
    rows = [['問', '解答', '○×'] * 4]
    for r in range(per):
        row = []
        for c4 in range(4):
            k = c4 * per + r + 1
            row += ([str(k), '①　②　③　④', ''] if k <= n else ['', '', ''])
        rows.append(row)
    rh = min(8.6, 215 / max(per, 1))
    sheet = Table(rows, colWidths=[9 * mm, 27 * mm, 9.5 * mm] * 4, rowHeights=[6 * mm] + [rh * mm] * per)
    sheet.setStyle(TableStyle([('FONT', (0, 0), (-1, -1), F, 9), ('FONT', (0, 0), (-1, 0), FB, 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.4, LINE), ('BACKGROUND', (0, 0), (-1, 0), GOLD_SOFT),
        *[('LINEAFTER', (k * 3 + 2, 0), (k * 3 + 2, -1), 1.2, GOLD) for k in range(3)]]))
    story += [sheet, Spacer(1, 4 * mm)]
    # すぐ丸つけできる「答えだけ」の一覧
    story.append(Paragraph('答えの一覧（丸つけ用）', st['h2']))
    ak = []
    for r in range(0, n, 10):
        ak.append([Paragraph(f'<b>{r + 1}〜{min(r + 10, n)}</b>', st['small'])] +
                  [Paragraph(f'{k + 1}<font color="#2f7a52"><b>{MARKS[items[k]["answer"]]}</b></font>', st['small']) if k < n else '' for k in range(r, r + 10)])
    akt = Table(ak, colWidths=[18 * mm] + [16.4 * mm] * 10)
    akt.setStyle(TableStyle([('GRID', (0, 0), (-1, -1), 0.3, LINE), ('BACKGROUND', (0, 0), (0, -1), GOLD_SOFT),
                             ('TOPPADDING', (0, 0), (-1, -1), 2), ('BOTTOMPADDING', (0, 0), (-1, -1), 2)]))
    story += [akt, PageBreak()]

    # ===== 解答・解説 =====
    story.append(Paragraph('解答・解説', st['h2']))
    story.append(Paragraph('各問：正解 → なぜその答えか → ほかの選択肢がなぜ違うか（または関連事項）。選択肢の番号はこのプリントの並びです。', st['small']))
    story.append(Spacer(1, 2 * mm))
    for u in units:
        story += [CondPageBreak(45 * mm), unit_bar(u['title']), Spacer(1, 2 * mm)]
        for i in range(u['start'], u['end'] + 1):
            it = items[i]
            k = it['answer']
            tags = ''.join(f'　<font size="8" color="#6b5d45">［{esc(t)}］</font>' for t in it.get('tags', []))
            parts = [Paragraph(f'<font color="#c98512"><b>{i + 1}</b></font>　<b>正解 {MARKS[k]} {esc(it["choices"][k])}</b>{tags}', st['ans'])]
            for head, text in it['explain']:
                h = f'<font color="#2458a6"><b>{esc(head)}</b></font>　' if head else ''
                parts.append(Paragraph(h + esc_ml(text), st['ex']))
            t = Table([[parts]], colWidths=[182 * mm])
            t.setStyle(TableStyle([('LINEBEFORE', (0, 0), (0, -1), 2.2, GOLD), ('LEFTPADDING', (0, 0), (-1, -1), 7),
                                   ('BOTTOMPADDING', (0, 0), (-1, -1), 6), ('TOPPADDING', (0, 0), (-1, -1), 3)]))
            story += [t, Spacer(1, 2 * mm)]
        notes = unit_notes.get(u['title'])
        if notes:
            story.append(box([Paragraph(f'<b>{esc(u["title"])}　要点</b>', S('b2', font=FB, fontSize=9.5, color=GOLD))] +
                             [Paragraph((f'<b>{esc(h)}</b>　' if h else '・') + esc_ml(t), st['ex']) for h, t in notes], pad=6))
            story.append(Spacer(1, 3 * mm))
    for sec in (extra_sections or []):
        story.append(PageBreak())
        story += sec(st, esc, esc_ml)
    story.append(PageBreak())

    # ===== 単元別 自己採点表 =====
    story.append(Paragraph('単元別 自己採点表', st['h2']))
    story.append(Paragraph('各単元の正解数を書き、正答率7割未満の単元に★。★の単元は解説と要点を読み直し、3日後に×の問題だけ解き直す。', st['small']))
    story.append(Spacer(1, 2 * mm))
    rows = [['単元', '問題', '正解数', '★', '3日後']]
    for u in units:
        c = u['end'] - u['start'] + 1
        rows.append([Paragraph(esc(u['title']), st['body']), f'{u["start"] + 1}〜{u["end"] + 1}', f'　／{c}', '', f'　／{c}'])
    rows.append([Paragraph('<b>合計</b>', st['body']), '', f'　／{n}', '', f'　／{n}'])
    tbl = Table(rows, colWidths=[100 * mm, 22 * mm, 22 * mm, 14 * mm, 24 * mm], repeatRows=1)
    tbl.setStyle(TableStyle([('FONT', (0, 0), (-1, -1), F, 9), ('FONT', (0, 0), (-1, 0), FB, 8.5),
        ('GRID', (0, 0), (-1, -1), 0.4, LINE), ('BACKGROUND', (0, 0), (-1, 0), GOLD_SOFT),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3), ('BOTTOMPADDING', (0, 0), (-1, -1), 3)]))
    story += [tbl, Spacer(1, 5 * mm)]
    q = n // 4
    story.append(box([Paragraph('<b>正解の位置について</b>', S('b3', font=FB, fontSize=9.5, color=GOLD)),
        Paragraph(f'正解が①〜④にほぼ均等（各{q}問前後）になるよう選択肢を並べています。「迷ったら①」のような勘では点が取れません。'
                  '問題文・選択肢の中身・解説はアプリのデータと同じです。', st['ex'])]))

    def on_page(c, doc):
        c.saveState()
        w, h = A4
        if doc.page > 1:
            c.setFillColor(GOLD); c.rect(0, h - 6 * mm, w, 6 * mm, stroke=0, fill=1)
            c.setFont(FB, 7.5); c.setFillColor(colors.white)
            c.drawString(14 * mm, h - 4.2 * mm, f'★ 大当たり UR 学習プリント ★   {title.replace(chr(10), " ")}')
        c.setFont(F, 7.5); c.setFillColor(SUB)
        c.drawString(14 * mm, 8 * mm, footer)
        c.drawRightString(w - 14 * mm, 8 * mm, f'{doc.page}')
        c.restoreState()

    def cover(c, doc):
        on_page(c, doc)
        w, h = A4
        c.saveState()
        c.setFillColor(NIGHT); c.roundRect(12 * mm, h - 110 * mm, w - 24 * mm, 92 * mm, 8 * mm, stroke=0, fill=1)
        c.setFillColor(GOLD); c.circle(w - 34 * mm, h - 30 * mm, 26 * mm, stroke=0, fill=1)
        c.setFillColor(colors.HexColor('#2d4f8e')); c.circle(w - 18 * mm, h - 100 * mm, 18 * mm, stroke=0, fill=1)
        c.restoreState()

    doc = BaseDocTemplate(str(out), pagesize=A4, leftMargin=14 * mm, rightMargin=14 * mm, topMargin=12 * mm, bottomMargin=14 * mm,
                          title=f'{title.replace(chr(10), " ")}（UR学習プリント）', author='マナトビ')
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='f')
    doc.addPageTemplates([PageTemplate(id='cover', frames=[frame], onPage=cover), PageTemplate(id='body', frames=[frame], onPage=on_page)])
    doc.build(story)
    pages = doc.page
    make_thumb(out, thumb)
    return items, pages

def make_thumb(pdf: Path, thumb: Path):
    from PIL import Image
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(['pdftoppm', '-r', '72', '-f', '1', '-l', '1', '-png', str(pdf), f'{d}/p'], check=True, capture_output=True)
        png = next(Path(d).glob('p*.png'))
        im = Image.open(png).convert('RGB'); im = im.resize((360, int(360 * im.height / im.width)))
        im.crop((0, 0, 360, 510)).save(thumb, 'WEBP', quality=82)
