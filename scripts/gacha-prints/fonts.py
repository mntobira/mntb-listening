"""プリント用フォント（IPAゴシック＝TrueType を埋め込む。Noto CJK の .ttc は reportlab が読めない）。
太字は IPA に無いので、文字の輪郭を少し太らせた「疑似ボールド」を使う。"""
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.fonts import addMapping

IPA = '/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf'

def setup():
    pdfmetrics.registerFont(TTFont('JP', IPA))
    pdfmetrics.registerFont(TTFont('JPB', IPA))  # 名前だけ別。<b> は addMapping で JPB に寄せ、描画側で太らせる
    addMapping('JP', 0, 0, 'JP'); addMapping('JP', 1, 0, 'JPB'); addMapping('JP', 0, 1, 'JP'); addMapping('JP', 1, 1, 'JPB')
    return 'JP', 'JPB'

def install_fake_bold(width=0.18):
    """JPB で描く文字に輪郭線を足して太字に見せる（Paragraph・drawString の両方に効く）"""
    from reportlab.pdfgen import textobject, canvas
    orig_set = textobject.PDFTextObject.setFont
    def setFont(self, psfontname, size, leading=None):
        orig_set(self, psfontname, size, leading)
        if psfontname == 'JPB':
            self._code.append(f'2 Tr {width} w')
        else:
            self._code.append('0 Tr')
    textobject.PDFTextObject.setFont = setFont
    orig_c = canvas.Canvas.setFont
    def csetFont(self, psfontname, size, leading=None):
        orig_c(self, psfontname, size, leading)
        self._code.append(('2 Tr %s w' % width) if psfontname == 'JPB' else '0 Tr')
    canvas.Canvas.setFont = csetFont

def match_stroke_to_fill():
    """疑似ボールドの輪郭線を文字色と同じ色にする（黒い縁どりで中抜きに見えるのを防ぐ）"""
    from reportlab.pdfgen import textobject, canvas
    for cls in (textobject.PDFTextObject, canvas.Canvas):
        orig = cls.setFillColor
        def setFillColor(self, aColor, alpha=None, _o=orig):
            _o(self, aColor, alpha) if alpha is not None else _o(self, aColor)
            try:
                self.setStrokeColor(aColor)
            except Exception:
                pass
        cls.setFillColor = setFillColor
