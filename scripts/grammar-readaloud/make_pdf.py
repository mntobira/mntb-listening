import json, html
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak, KeepTogether
from reportlab.lib.styles import ParagraphStyle

pdfmetrics.registerFont(TTFont('G', '/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf'))
pdfmetrics.registerFont(TTFont('M', '/usr/share/fonts/opentype/ipafont-mincho/ipam.ttf'))
d = json.load(open('.tmp_ui/e9/tracks.json'))
total = sum(len(s['tracks']) for c in d for s in c['sets'])

H1 = ParagraphStyle('h1', fontName='G', fontSize=16, leading=22, spaceBefore=4, spaceAfter=6, textColor=colors.HexColor('#1f3a5f'))
H2 = ParagraphStyle('h2', fontName='G', fontSize=11.5, leading=16, spaceBefore=8, spaceAfter=3, textColor=colors.HexColor('#2f6f4f'))
EN = ParagraphStyle('en', fontName='G', fontSize=11, leading=15.5, leftIndent=9*mm, firstLineIndent=-9*mm)
JA = ParagraphStyle('ja', fontName='M', fontSize=9.5, leading=14, leftIndent=9*mm, textColor=colors.HexColor('#333333'), wordWrap='CJK')
META = ParagraphStyle('meta', fontName='G', fontSize=8.5, leading=12, leftIndent=9*mm, textColor=colors.HexColor('#777777'), wordWrap='CJK', spaceAfter=5)
BODY = ParagraphStyle('body', fontName='G', fontSize=10, leading=16, wordWrap='CJK')
TITLE = ParagraphStyle('t', fontName='G', fontSize=22, leading=30, spaceAfter=10)
e = lambda s: html.escape(s, quote=False)

class Doc(BaseDocTemplate):
    def afterFlowable(self, f):
        k = getattr(f, '_bm', None)
        if k:
            key, title, level = k
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(title, key, level=level, closed=level == 0)

def footer(c, doc):
    c.setFont('G', 8); c.setFillColor(colors.grey)
    c.drawString(15*mm, 10*mm, 'まなとび 英文法 音読文（完成文＋和訳）')
    c.drawRightString(195*mm, 10*mm, str(doc.page))

doc = Doc('.tmp_ui/e9/grammar_readaloud_all.pdf', pagesize=A4, leftMargin=15*mm, rightMargin=15*mm, topMargin=15*mm, bottomMargin=16*mm,
          title='英文法 音読文（全%d文）' % total, author='まなとび', subject='英文法 第1〜20章 音読用の完成文と和訳')
doc.addPageTemplates([PageTemplate('p', [Frame(15*mm, 16*mm, 180*mm, 266*mm, id='f')], onPage=footer)])
s = []
s.append(Paragraph('英文法 音読文（全%d文）' % total, TITLE))
s.append(Paragraph('第1〜20章の全問題について、アプリで読み上げている「空所を埋めた完成文」と和訳をまとめました。'
    '文字はすべてテキストなので、そのままコピーできます（音源作成・印刷・音読練習用）。', BODY))
s.append(Spacer(1, 4*mm))
s.append(Paragraph('・並びはアプリと同じ「章 → 第N回（5問ずつ） → 問1〜5」。<br/>'
    '・各文の下の灰色の行は「アプリ内の問題ID（音源ファイル名に使う予定）／決め手の語句：文法事項」。<br/>'
    '・音源を作るときは、英文の行だけを読み上げてください（番号・和訳・IDは読まない）。', BODY))
s.append(Spacer(1, 6*mm))
toc = ParagraphStyle('toc', parent=BODY, fontSize=10, leading=15)
for c in d:
    n = sum(len(x['tracks']) for x in c['sets'])
    s.append(Paragraph('第%d章　%s（%d回・%d文）' % (c['chapter'], e(c['title']), len(c['sets']), n), toc))
for c in d:
    s.append(PageBreak())
    p = Paragraph('第%d章　%s' % (c['chapter'], e(c['title'])), H1); p._bm = ('ch%d' % c['chapter'], '第%d章 %s' % (c['chapter'], c['title']), 0); s.append(p)
    for si, st in enumerate(c['sets'], 1):
        h = Paragraph(e(st['category']), H2); h._bm = ('ch%d_%d' % (c['chapter'], si), st['category'], 1)
        items = []
        for t in st['tracks']:
            k = '／'.join('%s：%s' % (x['phrase'], x['meaning']) for x in t['key'] if x.get('phrase'))
            blk = [Paragraph('<font color="#2f6f4f">%s</font>　%s' % (t['label'], e(t['script'])), EN),
                   Paragraph(e(t['translation']), JA),
                   Paragraph('%s%s' % (t['subId'], ('　' + e(k)) if k else ''), META)]
            items.append(KeepTogether(blk))
        s.append(KeepTogether([h, items[0]])); s.extend(items[1:])
doc.build(s)
print('ok')
