"""共通テスト 英語（リーディング・リスニング）予想問題 PDF の描画（LR プリント）。

データは set1.py 〜 set5.py（READING / LISTENING）。ここは描画だけ。
  - 本番の形式（2025年度〜の新課程）：R 80分・100点・大問8 ／ L 30分・100点・大問6・37問
  - 英文は欧文セリフ体（Liberation Serif）、日本語は IPA ゴシック
  - 解答番号（マーク番号）は全体の通し番号を自動でふる
"""
import sys, re, subprocess, tempfile
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
from reportlab.platypus.flowables import PageBreakIfNotEmpty as PageBreak  # noqa: F811  空白ページを作らない
from reportlab.graphics.shapes import Drawing, Rect, String, Line
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.linecharts import HorizontalLineChart

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import fonts as _fonts  # noqa: E402

F, FB = _fonts.setup(); _fonts.install_fake_bold(); _fonts.match_stroke_to_fill()
pdfmetrics.registerFont(TTFont('JM', '/usr/share/fonts/opentype/ipafont-mincho/ipam.ttf'))
pdfmetrics.registerFont(TTFont('EN', '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'))
pdfmetrics.registerFont(TTFont('ENB', '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'))
pdfmetrics.registerFont(TTFont('ENI', '/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf'))
from reportlab.lib.fonts import addMapping  # noqa: E402
addMapping('EN', 0, 0, 'EN'); addMapping('EN', 1, 0, 'ENB'); addMapping('EN', 0, 1, 'ENI'); addMapping('EN', 1, 1, 'ENB')
# 和文は明朝（本番の問題冊子と同じ）。太字はゴシックの太字（本番も強調はゴシック）
addMapping('JM', 0, 0, 'JM'); addMapping('JM', 1, 0, 'JPB'); addMapping('JM', 0, 1, 'JM'); addMapping('JM', 1, 1, 'JPB')

# ★本番と同じ白黒★（色は使わない）
MARKS = '①②③④⑤⑥⑦⑧⑨'
BLACK = colors.black
INK = BLACK; SUB = colors.HexColor('#333333'); LINE = BLACK
LR = BLACK; LR_SOFT = colors.white; GOLD = BLACK; GOLD_SOFT = colors.white; NIGHT = BLACK; GREEN = BLACK
PAPER = colors.white; GRAY = colors.HexColor('#e6e6e6')

def S(name, **kw):
    font = kw.pop('font', 'JM')
    if font in ('JM', F, FB, 'JPB') and 'wordWrap' not in kw:
        kw['wordWrap'] = 'CJK'  # 和文は文字単位で折り返す
    return ParagraphStyle(name, fontName=font, textColor=kw.pop('color', INK), **kw)
st = {
    'h1': S('h1', font=FB, fontSize=26, leading=34, alignment=1),
    'cs': S('cs', fontSize=12, leading=18, alignment=1),
    'h2': S('h2', font=FB, fontSize=14, leading=19, spaceBefore=2, spaceAfter=4),
    'h3': S('h3', font=FB, fontSize=12, leading=16, spaceBefore=3, spaceAfter=2),
    'dai': S('dai', font=FB, fontSize=14, leading=19),
    'bar': S('bar', font=FB, fontSize=11.5, leading=15),
    'ja': S('ja', fontSize=10.3, leading=16.5),
    'jas': S('jas', fontSize=9.2, leading=13.6),
    'en': S('en', font='EN', fontSize=11, leading=15.6, alignment=4, firstLineIndent=11),
    'enl': S('enl', font='EN', fontSize=11, leading=15.4),
    'enc': S('enc', font='EN', fontSize=11, leading=15.4, alignment=1),
    'ens': S('ens', font='EN', fontSize=10, leading=13.6),
    'ent': S('ent', font='ENB', fontSize=13, leading=17, alignment=1),
    'q': S('q', font='EN', fontSize=11, leading=16, leftIndent=11 * mm, firstLineIndent=-11 * mm),
    'ch': S('ch', font='EN', fontSize=10.8, leading=15, leftIndent=5.5 * mm, firstLineIndent=-5.5 * mm),
    'ans': S('ans', font=FB, fontSize=10.2, leading=14.5),
    'ex': S('ex', fontSize=9.6, leading=14.6),
    'scr': S('scr', font='EN', fontSize=10.6, leading=14.6),
    'tr': S('tr', fontSize=9.3, leading=13.6),
}

W = 174 * mm
_MB = {}


def _mb_start(canv, kind, label):
    _MB[label] = canv._curr_tx_info['cur_x']


def _mb_end(canv, kind, label):
    i = canv._curr_tx_info
    x0 = _MB.pop(label, i['cur_x']); x1 = i['cur_x']; y = i['cur_y']; fs = i['xs'].style.fontSize
    canv.saveState(); canv.setStrokeColor(BLACK); canv.setLineWidth(0.8)
    canv.rect(x0, y - fs * 0.3, x1 - x0, fs * 1.22, stroke=1, fill=0)
    canv.restoreState()


from reportlab.pdfgen.canvas import Canvas as _Canvas  # noqa: E402
_orig_cb = _Canvas.getNamedCB
_Canvas.getNamedCB = lambda self, n: {'mbs': _mb_start, 'mbe': _mb_end}.get(n) or _orig_cb(self, n)
_MB_N = [0]


def esc(s):
    return str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def ml(s):
    """**太字** と __下線__ と //斜体// だけ使える簡易マークアップ。非ラテン文字は IPA で描く"""
    s = esc(s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', s)
    s = re.sub(r'__(.+?)__', r'<u>\1</u>', s)
    s = re.sub(r'//(.+?)//', r'<i>\1</i>', s)
    s = s.replace('\n', '<br/>')
    return s


def en(s):
    """英文用：日本語や丸数字が混ざったらその文字だけ IPA ゴシック"""
    out = re.sub(r'([\u2460-\u2473\u3000-\u9fff\uff00-\uffef\u2190-\u21ff\u25a0-\u25ff\u2500-\u257f]+)',
                 r'<font name="JM">\1</font>', ml(s))
    return out


def mark_box(n):
    """本番と同じ「四角で囲んだ解答番号」"""
    _MB_N[0] += 1
    k = _MB_N[0]
    return f'<onDraw name="mbs" label="{k}"/><font name="ENB">&nbsp;&nbsp;{n}&nbsp;&nbsp;</font><onDraw name="mbe" label="{k}"/>'


def bar(text, color=None):
    """大問の見出し：本番と同じ白黒（太字＋下線）"""
    t = Table([[Paragraph(esc(text), st['dai'])]], colWidths=[W])
    t.setStyle(TableStyle([('LINEBELOW', (0, 0), (-1, -1), 1.2, BLACK), ('LEFTPADDING', (0, 0), (-1, -1), 0),
                           ('TOPPADDING', (0, 0), (-1, -1), 2), ('BOTTOMPADDING', (0, 0), (-1, -1), 4)]))
    return t


def boxed(flows, bg=None, border=None, width=W, pad=8):
    t = Table([[flows]], colWidths=[width])
    t.setStyle(TableStyle([('BOX', (0, 0), (-1, -1), 0.8, BLACK),
                           ('LEFTPADDING', (0, 0), (-1, -1), pad), ('RIGHTPADDING', (0, 0), (-1, -1), pad),
                           ('TOPPADDING', (0, 0), (-1, -1), pad - 2), ('BOTTOMPADDING', (0, 0), (-1, -1), pad)]))
    return t


# ───────── 図表 ─────────
def fig_table(rows, widths=None, header=True, font_size=9.6):
    widths = widths or [W / len(rows[0])] * len(rows[0])
    data = [[Paragraph(en(c), S('tc', font='EN', fontSize=font_size, leading=font_size + 3.4)) for c in r] for r in rows]
    t = Table(data, colWidths=widths)
    style = [('GRID', (0, 0), (-1, -1), 0.6, BLACK), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
             ('TOPPADDING', (0, 0), (-1, -1), 3), ('BOTTOMPADDING', (0, 0), (-1, -1), 4)]
    if header:
        style.append(('BACKGROUND', (0, 0), (-1, 0), GRAY))
    t.setStyle(TableStyle(style))
    return t


def fig_bar(title, cats, series, unit='', maxv=None, width=150 * mm, height=62 * mm, legend=None, step=None):
    d = Drawing(width, height)
    d.add(String(width / 2, height - 10, title, fontName='ENB', fontSize=10.5, textAnchor='middle'))
    bc = VerticalBarChart()
    bc.x, bc.y, bc.width, bc.height = 38, 28, width - 60 - (70 if legend else 0), height - 52
    bc.data = series
    bc.categoryAxis.categoryNames = cats
    bc.categoryAxis.labels.fontName = 'EN'; bc.categoryAxis.labels.fontSize = 8.5
    bc.valueAxis.labels.fontName = 'EN'; bc.valueAxis.labels.fontSize = 8
    mn = min(min(s) for s in series)
    bc.valueAxis.valueMin = 0 if mn >= 0 else (int(mn / 10) - 1) * 10
    bc.categoryAxis.labelAxisMode = 'low'
    mx = maxv or max(max(s) for s in series) * 1.15
    bc.valueAxis.valueMax = mx
    if step:
        bc.valueAxis.valueStep = step
    fills = [colors.HexColor('#555555'), colors.HexColor('#bbbbbb'), colors.white, colors.HexColor('#888888')]
    for i in range(len(series)):
        bc.bars[i].fillColor = fills[i % 4]; bc.bars[i].strokeColor = BLACK; bc.bars[i].strokeWidth = 0.6
    bc.barLabels.fontName = 'EN'; bc.barLabels.fontSize = 7.5
    bc.barLabelFormat = '%s' if not unit else '%s' + unit.replace('%', '%%')
    bc.barLabels.nudge = 6
    d.add(bc)
    if unit:
        d.add(String(6, height - 24, f'({unit})', fontName='EN', fontSize=8))
    if legend:
        for i, name in enumerate(legend):
            y = height - 40 - i * 14
            d.add(Rect(width - 92, y, 9, 9, fillColor=fills[i % 4], strokeColor=BLACK, strokeWidth=0.6))
            d.add(String(width - 79, y + 1, name, fontName='EN', fontSize=8.5))
    return d


def fig_line(title, cats, series, legend, unit='', maxv=None, width=150 * mm, height=62 * mm):
    d = Drawing(width, height)
    d.add(String(width / 2, height - 10, title, fontName='ENB', fontSize=10.5, textAnchor='middle'))
    lc = HorizontalLineChart()
    lc.x, lc.y, lc.width, lc.height = 38, 28, width - 130, height - 52
    lc.data = series
    lc.categoryAxis.categoryNames = cats
    lc.categoryAxis.labels.fontName = 'EN'; lc.categoryAxis.labels.fontSize = 8.5
    lc.valueAxis.labels.fontName = 'EN'; lc.valueAxis.labels.fontSize = 8
    lc.valueAxis.valueMin = 0; lc.valueAxis.valueMax = maxv or max(max(s) for s in series) * 1.15
    cols = [BLACK, BLACK, BLACK]
    dashes = [None, [4, 2], [1, 2]]
    for i in range(len(series)):
        lc.lines[i].strokeColor = BLACK; lc.lines[i].strokeWidth = 1.4
        if dashes[i]:
            lc.lines[i].strokeDashArray = dashes[i]
    d.add(lc)
    if unit:
        d.add(String(6, height - 24, f'({unit})', fontName='EN', fontSize=8))
    for i, name in enumerate(legend):
        y = height - 40 - i * 14
        d.add(Line(width - 84, y + 4, width - 72, y + 4, strokeColor=BLACK, strokeWidth=1.4, strokeDashArray=dashes[i]))
        d.add(String(width - 68, y + 1, name, fontName='EN', fontSize=8.5))
    return d


def fig_map(cells, cols, rows, width=120 * mm, height=60 * mm, title=''):
    """cells: [(col,row,colspan,rowspan,label,shade)] 簡易見取り図。label の ①〜④ は IPA で描く"""
    d = Drawing(width, height)
    top = height - (14 if title else 2)
    if title:
        d.add(String(width / 2, height - 10, title, fontName='ENB', fontSize=10, textAnchor='middle'))
    cw, rh = width / cols, (top - 2) / rows
    for c, r, cs, rs, label, shade in cells:
        x, y = c * cw, top - (r + rs) * rh
        d.add(Rect(x + 1, y + 1, cs * cw - 2, rs * rh - 2, fillColor=GRAY if shade else colors.white,
                   strokeColor=BLACK, strokeWidth=0.8))
        lines = label.split('\n')
        for i, ln in enumerate(lines):
            jp = bool(re.search(r'[\u2460-\u2473\u3000-\u9fff]', ln))
            fs = 12 if (len(ln) == 1 and jp) else 8.5
            d.add(String(x + cs * cw / 2, y + rs * rh / 2 + (len(lines) / 2 - i - 0.75) * 10, ln,
                         fontName='JM' if jp else 'EN', fontSize=fs, textAnchor='middle'))
    return d


def fig_pics(items, per_row=2, height=24 * mm):
    """イラスト選択肢（本番は絵）。内容を言葉で示したカード"""
    cells = []
    if height < 100:
        height = height * mm
    w = W / per_row
    for i, desc in enumerate(items):
        p = [Paragraph(f'{MARKS[i]}', S('pm', fontSize=12, leading=14)),
             Paragraph(f'<font size="7.5">［絵］</font>{esc(desc)}', S('pd', fontSize=9.4, leading=13))]
        cells.append(p)
    rows = [cells[k:k + per_row] + [''] * (per_row - len(cells[k:k + per_row])) for k in range(0, len(cells), per_row)]
    t = Table(rows, colWidths=[w] * per_row, rowHeights=[height] * len(rows))
    t.setStyle(TableStyle([('BOX', (0, 0), (-1, -1), 0.7, BLACK), ('INNERGRID', (0, 0), (-1, -1), 0.7, BLACK),
                           ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                           ('LEFTPADDING', (0, 0), (-1, -1), 6), ('TOPPADDING', (0, 0), (-1, -1), 4)]))
    return t


# ───────── 本文ブロック ─────────
def render_block(b):
    k = b[0]
    if k == 'title':
        return [Paragraph(en(b[1]), st['ent']), Spacer(1, 3)]
    if k == 'h':
        return [Paragraph(f'<b>{en(b[1])}</b>', st['enl']), Spacer(1, 2)]
    if k == 'p':
        return [Paragraph(en(b[1]), st['en']), Spacer(1, 4)]
    if k == 'pl':
        return [Paragraph(en(b[1]), st['enl']), Spacer(1, 3)]
    if k == 'c':
        return [Paragraph(en(b[1]), st['enc']), Spacer(1, 3)]
    if k == 'small':
        return [Paragraph(en(b[1]), st['ens']), Spacer(1, 3)]
    if k == 'ja':
        return [Paragraph(ml(b[1]), st['ja']), Spacer(1, 3)]
    if k == 'msg':  # ('msg', 'Name', text, side)  side: 'l' / 'r'
        side = b[3] if len(b) > 3 else 'l'
        bub = Table([[[Paragraph(f'<font size="9"><b>{esc(b[1])}</b></font>', st['ens']),
                       Paragraph(en(b[2]), st['enl'])]]], colWidths=[112 * mm])
        bub.setStyle(TableStyle([('BOX', (0, 0), (-1, -1), 0.7, BLACK), ('BACKGROUND', (0, 0), (-1, -1), colors.white if side == 'l' else GRAY),
                                 ('ROUNDEDCORNERS', [6, 6, 6, 6]), ('LEFTPADDING', (0, 0), (-1, -1), 8),
                                 ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 6)]))
        row = Table([[bub, ''] if side == 'l' else ['', bub]], colWidths=[112 * mm, W - 112 * mm] if side == 'l' else [W - 112 * mm, 112 * mm])
        row.setStyle(TableStyle([('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 0)]))
        return [row, Spacer(1, 4)]
    if k == 'box':  # ('box', [blocks], bg?)
        inner = []
        _w = W; globals()['W'] = _w - 18  # 枠の内側に収める（左右の余白ぶん）
        try:
            for bb in b[1]:
                inner += render_block(bb)
        finally:
            globals()['W'] = _w
        return [boxed(inner), Spacer(1, 6)]
    if k == 'slide':  # ('slide', title, [bullets])
        inner = [Paragraph(f'<b>{en(b[1])}</b>', S('sl', font='ENB', fontSize=11.5, leading=15, alignment=1)), Spacer(1, 3)]
        inner += [Paragraph(f'• {en(x)}' if not x.startswith(' ') else f'&nbsp;&nbsp;&nbsp;&nbsp;– {en(x.strip())}', st['enl']) for x in b[2]]
        t = boxed(inner)
        return [t, Spacer(1, 5)]
    if k == 'table':  # ('table', rows, widths_mm?)
        widths = [w * mm for w in b[2]] if len(b) > 2 and b[2] else None
        if widths and sum(widths) > W:
            k = W / sum(widths); widths = [w * k for w in widths]
        return [fig_table(b[1], widths), Spacer(1, 5)]
    if k == 'bar':
        return [fig_bar(**{'width': min(150 * mm, W), **b[1]}), Spacer(1, 4)]
    if k == 'line':
        return [fig_line(**{'width': min(150 * mm, W), **b[1]}), Spacer(1, 4)]
    if k == 'map':
        return [fig_map(**b[1]), Spacer(1, 4)]
    if k == 'pics':
        return [fig_pics(b[1], **(b[2] if len(b) > 2 else {})), Spacer(1, 4)]
    if k == 'sp':
        return [Spacer(1, b[1] * mm)]
    if k == 'cols':  # ('cols', [blocksL], [blocksR])
        L = []; R = []
        for bb in b[1]:
            L += render_block(bb)
        for bb in b[2]:
            R += render_block(bb)
        t = Table([[L, R]], colWidths=[W / 2, W / 2])
        t.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 2), ('RIGHTPADDING', (0, 0), (-1, -1), 6)]))
        return [t, Spacer(1, 4)]
    raise ValueError(k)


# ───────── 設問 ─────────
def number_marks(parts):
    """全設問に通しの解答番号をふる（q['marks'] = [番号...]）。配点・正解数の整合も確かめる"""
    n = 0
    qn = 0
    for p in parts:
        for sec in p['sections']:
            for q in sec['qs']:
                qn += 1
                q['qno'] = qn
                ans = q['ans'] if isinstance(q['ans'], list) else [q['ans']]
                q['ans'] = ans
                q['marks'] = list(range(n + 1, n + 1 + len(ans)))
                n += len(ans)
                for a in ans:
                    if isinstance(a, int):
                        assert 1 <= a <= max(len(q.get('choices') or []), q.get('nchoices', 0)), (q['prompt'][:40], a)
    return n


def q_points(q):
    """(この設問の満点, 採点方法の説明)"""
    mode = q.get('score', 'all' if len(q['ans']) > 1 else 'one')
    if mode == 'each':
        return q['pts'] * len(q['ans']), f'各{q["pts"]}点'
    if mode == 'pairs':
        return q['pts'] * (len(q['ans']) // 2), f'2つずつ完答・各組{q["pts"]}点'
    if mode == 'all' and len(q['ans']) > 1:
        return q['pts'], ('順不同・完答' if q.get('any_order') else '完答')
    return q['pts'], ''


def choices_flow(q):
    ch = q.get('choices')
    if not ch or q.get('hide_choices'):
        return []
    longest = max(len(c) for c in ch)
    if longest <= 30 and len(ch) in (4, 6, 8):
        per = 2 if longest > 14 else 4 if len(ch) == 4 else 3
        if len(ch) == 6 and per == 4:
            per = 3
        cells = [Paragraph(f'<font name="JM">{MARKS[i]}</font>&nbsp;&nbsp;{en(c)}', st['ch']) for i, c in enumerate(ch)]
        rows = [cells[k:k + per] + [''] * (per - len(cells[k:k + per])) for k in range(0, len(cells), per)]
        t = Table(rows, colWidths=[(W - 14 * mm) / per] * per, hAlign='RIGHT')
    else:
        t = Table([[Paragraph(f'<font name="JM">{MARKS[i]}</font>&nbsp;&nbsp;{en(c)}', st['ch'])] for i, c in enumerate(ch)], colWidths=[W - 14 * mm], hAlign='RIGHT')
    t.setStyle(TableStyle([('LEFTPADDING', (0, 0), (-1, -1), 0), ('TOPPADDING', (0, 0), (-1, -1), 1.2),
                           ('BOTTOMPADDING', (0, 0), (-1, -1), 1.2), ('VALIGN', (0, 0), (-1, -1), 'TOP')]))
    return [t]


def q_flow(q):
    marks = '&nbsp;'.join(mark_box(m) for m in q['marks'])
    if q.get('listening') and not q['prompt']:
        return [KeepTogether([Paragraph(f'<font name="JPB">問 {q["no"]}</font>&nbsp;&nbsp;&nbsp;{marks}', st['q']), Spacer(1, 3)] +
                             sum((render_block(b) for b in q.get('pre', [])), []) + choices_flow(q) + [Spacer(1, 9)])]
    prompt = q['prompt']
    # 本文中の {1} {2} … を解答番号の箱に置き換える（複数マークの設問）
    if '{' in prompt:
        pr = en(prompt)
        for i, m in enumerate(q['marks']):
            pr = pr.replace('{%d}' % (i + 1), mark_box(m))
        head = f'<font name="JPB">問 {q["no"]}</font>&nbsp;&nbsp;&nbsp;{pr}'
    else:
        head = f'<font name="JPB">問 {q["no"]}</font>&nbsp;&nbsp;&nbsp;{en(prompt)}&nbsp;&nbsp;{marks}'
    flows = [Paragraph(head, st['q']), Spacer(1, 3)]
    for b in q.get('pre', []):
        flows += render_block(b)
    flows += choices_flow(q)
    return [KeepTogether(flows + [Spacer(1, 9)])]


# ───────── 解答 ─────────
def ans_str(q):
    if q.get('ans_text'):
        return q['ans_text']
    def one(a):
        return MARKS[a - 1] if isinstance(a, int) else str(a)
    return '・'.join(one(a) for a in q['ans'])


def key_table(parts, total_marks):
    rows = [['大問', '設問', '解答番号', '正解', '配点', '備考']]
    span = []
    total = 0
    for p in parts:
        start = len(rows)
        for sec in p['sections']:
            for q in sec['qs']:
                pts, note = q_points(q)
                total += pts
                rows.append([p['label'], f'問{q["no"]}' + (f'（{sec["tag"]}）' if sec.get('tag') else ''),
                             f'{q["marks"][0]}' if len(q['marks']) == 1 else f'{q["marks"][0]}–{q["marks"][-1]}',
                             ans_str(q), str(pts), note])
        span.append((start, len(rows) - 1))
    rows.append(['合計', '', f'{total_marks}', '', str(total), ''])
    t = Table(rows, colWidths=[17 * mm, 30 * mm, 21 * mm, 50 * mm, 13 * mm, 43 * mm], repeatRows=1)
    style = [('FONT', (0, 0), (-1, -1), 'JM', 8.8), ('FONT', (0, 0), (-1, 0), FB, 8.8), ('GRID', (0, 0), (-1, -1), 0.5, BLACK),
             ('BACKGROUND', (0, 0), (-1, 0), GRAY), ('ALIGN', (0, 0), (-2, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
             ('TOPPADDING', (0, 0), (-1, -1), 1.6), ('BOTTOMPADDING', (0, 0), (-1, -1), 2.2), ('FONT', (0, -1), (-1, -1), FB, 9)]
    for a, b in span:
        style.append(('SPAN', (0, a), (0, b)))
    t.setStyle(TableStyle(style))
    return t, total


def mark_sheet(total_marks, nch=9):
    """本番のマークシートの「解答欄」と同じ並び（解答番号 ｜ ① ② … ⑨）。白黒"""
    per = -(-total_marks // 2)
    head = ['解答\n番号'] + list(MARKS[:nch])
    rows = [head + [''] + head]
    for r in range(per):
        a = r + 1; b = r + 1 + per
        left = [str(a)] + list(MARKS[:nch])
        right = ([str(b)] + list(MARKS[:nch])) if b <= total_marks else [''] * (nch + 1)
        rows.append(left + [''] + right)
    rh = min(8.6, 225 / (per + 1))
    cw = [12 * mm] + [7.2 * mm] * nch
    t = Table(rows, colWidths=cw + [5 * mm] + cw, rowHeights=[11 * mm] + [rh * mm] * per)
    n = nch + 1
    t.setStyle(TableStyle([('FONT', (0, 0), (-1, -1), 'JM', 10), ('FONT', (0, 0), (-1, 0), FB, 8), ('FONT', (0, 1), (0, -1), FB, 10),
                           ('FONT', (n + 1, 1), (n + 1, -1), FB, 10), ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                           ('GRID', (0, 0), (n - 1, -1), 0.5, BLACK), ('GRID', (n + 1, 0), (-1, -1 if per * 2 == total_marks else -2), 0.5, BLACK),
                           ('BOX', (0, 0), (n - 1, -1), 1.2, BLACK), ('BOX', (n + 1, 0), (-1, -1 if per * 2 == total_marks else -2), 1.2, BLACK),
                           ('BACKGROUND', (0, 0), (n - 1, 0), GRAY), ('BACKGROUND', (n + 1, 0), (-1, 0), GRAY)]))
    return t


def explain_flow(q, script_first=None):
    pts, note = q_points(q)
    head = (f'<font name="JPB">問 {q["no"]}</font>　解答番号 {"・".join(str(m) for m in q["marks"])}　'
            f'<font name="JPB">正解 {esc(ans_str(q))}</font>　<font size="8.5">（{pts}点{("・" + note) if note else ""}）</font>')
    flows = [Paragraph(head, st['ja']), Spacer(1, 1.5)]
    for line in (q['ex'] if isinstance(q['ex'], list) else [q['ex']]):
        flows.append(Paragraph(ml(line), st['ex']))
    return [KeepTogether(flows), Spacer(1, 5)]


def check_answer_balance(parts):
    dist = {}
    for p in parts:
        for sec in p['sections']:
            for q in sec['qs']:
                if q.get('no_balance'):
                    continue
                for a in q['ans']:
                    if isinstance(a, int):
                        dist[a] = dist.get(a, 0) + 1
    return dict(sorted(dist.items()))


# ───────── ページ ─────────
def make_doc(out, title, page_label):
    """本番の問題冊子と同じ白黒：上下に細い罫線、ページ番号は下中央に「− n −」"""
    def on_page(c, doc):
        c.saveState()
        w, h = A4
        c.setFillColor(BLACK)
        if doc.page > 1:
            c.setFont('JM', 8); c.drawRightString(w - 18 * mm, h - 10 * mm, page_label)
            c.setLineWidth(0.4); c.line(18 * mm, h - 11.5 * mm, w - 18 * mm, h - 11.5 * mm)
            c.setFont('EN', 10); c.drawCentredString(w / 2, 9 * mm, f'– {doc.page - 1} –')
            c.setFont('JM', 6.5); c.drawString(18 * mm, h - 10 * mm, 'マナトビ オリジナル予想問題（大学入試センターの過去問ではありません）')
        c.restoreState()

    def cover(c, doc):
        w, h = A4
        c.saveState()
        c.setStrokeColor(BLACK)
        c.setLineWidth(1.6); c.rect(14 * mm, 14 * mm, w - 28 * mm, h - 28 * mm)
        c.setLineWidth(0.5); c.rect(16 * mm, 16 * mm, w - 32 * mm, h - 32 * mm)
        c.setFont('JM', 6.5); c.drawCentredString(w / 2, 19 * mm, 'マナトビ オリジナル予想問題（大学入試センターの過去問ではありません）　★ガチャ景品 LR（レジェンドレア）')
        c.restoreState()

    doc = BaseDocTemplate(str(out), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=16 * mm, bottomMargin=16 * mm,
                          title=title, author='マナトビ')
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='f')
    cframe = Frame(24 * mm, 24 * mm, A4[0] - 48 * mm, A4[1] - 48 * mm, id='c')
    doc.addPageTemplates([PageTemplate(id='cover', frames=[cframe], onPage=cover), PageTemplate(id='body', frames=[frame], onPage=on_page)])
    return doc


def cover_story(eyebrow, title, subtitle, stats, howto, toc):
    """本番の問題冊子の表紙のつくり：科目名・試験時間・注意事項（白黒）"""
    cw = A4[0] - 48 * mm
    story = [NextPageTemplate('body'), Spacer(1, 6 * mm),
             Paragraph(esc(eyebrow), S('e', fontSize=10, leading=14, alignment=1)), Spacer(1, 10 * mm),
             Paragraph(esc(title).replace('\n', '<br/>'), st['h1']), Spacer(1, 6 * mm)]
    cells = [Paragraph(f'<font name="JPB">{esc(b)}</font>　{esc(a)}', S('stc', fontSize=11, leading=15, alignment=1)) for a, b in stats]
    stt = Table([cells], colWidths=[cw / len(cells)] * len(cells))
    stt.setStyle(TableStyle([('BOX', (0, 0), (-1, -1), 0.8, BLACK), ('INNERGRID', (0, 0), (-1, -1), 0.5, BLACK),
                             ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 7)]))
    story += [stt, Spacer(1, 4 * mm), Paragraph(esc(subtitle).replace('\n', '<br/>'), S('sub', fontSize=10, leading=15, alignment=1)), Spacer(1, 8 * mm)]
    notes = [Paragraph('<font name="JPB">注　意　事　項</font>', S('nh', fontSize=12, leading=18, alignment=1)), Spacer(1, 2 * mm)]
    for k, h in enumerate(howto, 1):
        notes.append(Paragraph(f'{k}　{ml(h)}', S('nt', fontSize=10.2, leading=16, leftIndent=6 * mm, firstLineIndent=-6 * mm)))
    nt = Table([[notes]], colWidths=[cw])
    nt.setStyle(TableStyle([('BOX', (0, 0), (-1, -1), 0.8, BLACK), ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10),
                            ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 10)]))
    story += [nt, Spacer(1, 6 * mm)]
    rows = [[Paragraph(f'<font name="JPB">{esc(a)}</font>', st['jas']), Paragraph(esc(b), st['jas'])] for a, b in toc]
    tt = Table(rows, colWidths=[24 * mm, cw - 24 * mm])
    tt.setStyle(TableStyle([('LINEBELOW', (0, 0), (-1, -1), 0.3, BLACK), ('TOPPADDING', (0, 0), (-1, -1), 1.5), ('BOTTOMPADDING', (0, 0), (-1, -1), 1.5)]))
    story += [tt, PageBreak()]
    return story


def make_thumb(pdf, thumb):
    from PIL import Image
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(['pdftoppm', '-r', '72', '-f', '1', '-l', '1', '-png', str(pdf), f'{d}/p'], check=True, capture_output=True)
        png = next(Path(d).glob('p*.png'))
        im = Image.open(png).convert('RGB'); im = im.resize((360, int(360 * im.height / im.width)))
        im.crop((0, 0, 360, 510)).save(thumb, 'WEBP', quality=82)


def pdf_pages(pdf):
    out = subprocess.run(['pdfinfo', str(pdf)], capture_output=True, text=True).stdout
    return int(re.search(r'Pages:\s+(\d+)', out).group(1))
