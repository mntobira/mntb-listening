#!/usr/bin/env python3
"""
UR（大当たり）「英単語帳・英熟語帳 完全版」を作る（2026-10-24）。

  ご要望：「景品はその一冊で完成するもの。今の UR は弱い」
  → アプリの単語帳の、そのレベルの **全語** を1冊に収めた本にする（100語の抜き出しではない）。

  入力 : public/data/listeningVocabulary.json（アプリの単語帳と同じデータ。訳・4択はデータのまま）
  出力 : public/prints/<id>.pdf ／ public/prints/thumbs/<id>.webp
  使い方: python3 scripts/gacha-prints/build-vocab-book.py [id ...]

1冊の中身
  1. 表紙・この本の使い方・30日の学習計画表（ユニットごとに3周のチェック欄）
  2. 本編：50語ずつのユニット。番号・3回ぶんのチェック欄・見出し語・訳（全訳）・例文（共通テスト形式の音声の英文から）
  3. 各ユニットの確認テスト（10問・4択。アプリと同じ選択肢。正解位置は①〜④に均等）
  4. 総仕上げテスト（100問。単語は 英→日 50問＋日→英 50問、熟語は 英→日 100問）
  5. 全テストの解答
  6. さくいん（アルファベット順・見出し語番号つき）
"""
import json, random, re, subprocess, sys, tempfile
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
                                PageBreak, CondPageBreak, KeepTogether)
from reportlab.platypus.doctemplate import NextPageTemplate

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).parent))
import fonts as _fonts
F, FB = _fonts.setup(); _fonts.install_fake_bold(); _fonts.match_stroke_to_fill()
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
pdfmetrics.registerFont(TTFont('DV', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
# 英語（見出し語・例文）はプロポーショナルの IPA Pゴシックで読みやすく。太字は疑似ボールドの仕組み（JPB）に合わせて別名で登録
pdfmetrics.registerFont(TTFont('EN', '/usr/share/fonts/opentype/ipafont-gothic/ipagp.ttf'))

DATA = ROOT / 'public/data/listeningVocabulary.json'
MARKS = '①②③④'
GOLD = colors.HexColor('#b8860b'); GOLD2 = colors.HexColor('#e9c46a'); GOLD_SOFT = colors.HexColor('#fff6df')
NIGHT = colors.HexColor('#14213d'); INK = colors.HexColor('#22201a'); SUB = colors.HexColor('#6b5d45')
LINE = colors.HexColor('#e2d3b5'); GREEN = colors.HexColor('#2f7a52'); RED = colors.HexColor('#b3261e')
S = lambda n, **kw: ParagraphStyle(n, fontName=kw.pop('font', F), textColor=kw.pop('color', INK), **kw)
st = {
    'h1': S('h1', font=FB, fontSize=28, leading=36, color=colors.white),
    'h1s': S('h1s', fontSize=12, leading=19, color=colors.white),
    'eyebrow': S('eb', font=FB, fontSize=10, leading=14, color=GOLD2),
    'h2': S('h2', font=FB, fontSize=14, leading=19, color=NIGHT, spaceAfter=3),
    'h3': S('h3', font=FB, fontSize=11, leading=15, color=GOLD),
    'body': S('b', fontSize=9.6, leading=14.5),
    'small': S('s', fontSize=8.2, leading=11.5, color=SUB),
    'w': S('w', font=FB, fontSize=10.2, leading=13),
    'en': S('en', font='EN', fontSize=10.6, leading=13.4),
    'ja': S('ja', fontSize=9.0, leading=12.4),
    'ex': S('ex', font='EN', fontSize=8.2, leading=10.8, color=SUB),
    'ans': S('a', font=FB, fontSize=8.6, leading=11, color=GREEN),
    'idx': S('ix', font='EN', fontSize=7.8, leading=9.4),
    'unit': S('u', font=FB, fontSize=11.5, leading=15, color=colors.white),
}

BOOKS = [
    # id, levels, タイトル, サブタイトル, 種類
    ('print_book_vocab_lv1', ['lv1'], '英単語 完全版 Lv1\n共通テスト 基礎の全語',
     '共通テストの英文を読む・聞くための土台になる単語を、アプリの単語帳 Lv1 から1語残らず収録。', 'word'),
    ('print_book_vocab_lv2', ['lv2'], '英単語 完全版 Lv2\n共通テスト 標準の全語',
     '共通テストで8割をねらうための標準単語を、アプリの単語帳 Lv2 から1語残らず収録。', 'word'),
    ('print_book_vocab_adv', ['lv3', 'lv4'], '英単語 完全版 Lv3・Lv4\n二次・私大・難関の全語',
     '国公立二次・私大・難関大の長文で差がつく単語を、アプリの単語帳 Lv3・Lv4 から1語残らず収録。', 'word'),
    ('print_book_idiom_all', ['ilv1', 'ilv2', 'ilv3'], '英熟語 完全版\n基礎から難関まで全熟語',
     '共通テスト・二次・私大で問われる熟語を、アプリの英熟語 Lv1〜Lv3 から1つ残らず収録。', 'idiom'),
]

UNIT = 50

_IPA = None
def _has(ch):
    global _IPA
    if _IPA is None:
        from fontTools.ttLib import TTFont as FT
        _IPA = FT(_fonts.IPA).getBestCmap()
    return ord(ch) in _IPA

def esc(s):
    s = str(s).replace('\u301c', '～').replace('~', '～').replace('\ufe0f', '')
    s = s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    return ''.join(f'<font name="DV">{c}</font>' if ord(c) > 127 and not _has(c) else c for c in s)

def example_of(w):
    """その語を含む1文（共通テスト形式の音声の英文）。見つからなければ None"""
    word = w['word'].replace('～', '').replace('~', '').strip()
    head = word.split()[0] if word else ''
    if not head or len(head) < 2:
        return None
    for ex in w['examples']:
        for sen in re.split(r'(?<=[.!?])\s+', ex['script'].replace('\n', ' ')):
            sen = sen.strip().strip('"')
            if re.search(r'\b' + re.escape(head) + r'\w*', sen, re.I) and 20 <= len(sen) <= 150:
                t = esc(sen)
                t = re.sub(r'\b(' + re.escape(esc(head)) + r'\w*)', r'<font color="#14213d"><u>\1</u></font>', t, count=1, flags=re.I)
                return t
    return None

def make_quiz(words, seed, direction='e2j'):
    """アプリの4択（選択肢・正解はデータのまま）。並びだけ入れ替えて正解位置を①〜④に均等にする"""
    rnd = random.Random(seed)
    n = len(words)
    targets = [k for k in range(4) for _ in range(n // 4)] + list(range(n % 4)); rnd.shuffle(targets)
    out = []
    for w, t in zip(words, targets):
        q = next((q for q in w['questions'] if q['id'].endswith(':' + direction)), None) or w['questions'][0]
        opts, ans = list(q['options']), q['answerIndex']
        assert len(opts) == 4 and 0 <= ans < 4, w['id']
        others = [o for i, o in enumerate(opts) if i != ans]; rnd.shuffle(others)
        others.insert(t, opts[ans])
        out.append({'no': w['_no'], 'label': q['label'], 'options': others, 'answer': t,
                    'dir': 'j2e' if q['id'].endswith(':j2e') else 'e2j'})
    return out

def on_page(title):
    def f(c, doc):
        w, h = A4
        c.saveState()
        if doc.page == 1:
            c.setFillColor(NIGHT); c.rect(0, 0, w, h, stroke=0, fill=1)
            c.setStrokeColor(GOLD2); c.setLineWidth(2.2); c.rect(9 * mm, 9 * mm, w - 18 * mm, h - 18 * mm)
            c.setLineWidth(0.6); c.rect(11.5 * mm, 11.5 * mm, w - 23 * mm, h - 23 * mm)
            c.setFillColor(GOLD2); c.setFont(FB, 9)
            c.drawCentredString(w / 2, 17 * mm, '★ 大当たり UR ／ 完全版 ／ マナトビ ★')
        else:
            c.setFillColor(NIGHT); c.rect(0, h - 7 * mm, w, 7 * mm, stroke=0, fill=1)
            c.setFillColor(GOLD2); c.rect(0, h - 7.6 * mm, w, 0.6 * mm, stroke=0, fill=1)
            c.setFont(FB, 7.5); c.setFillColor(colors.white)
            c.drawString(14 * mm, h - 4.8 * mm, f'★ UR 完全版 ★  {title}')
            c.setFont(F, 7.5); c.setFillColor(SUB)
            c.drawString(14 * mm, 7 * mm, 'マナトビ ／ アプリの単語帳と同じデータ（訳・4択はデータのまま）')
            c.drawRightString(w - 14 * mm, 7 * mm, str(doc.page))
        c.restoreState()
    return f

def box(flows, bg=GOLD_SOFT, border=GOLD, pad=7, width=182 * mm):
    t = Table([[flows]], colWidths=[width])
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), bg), ('BOX', (0, 0), (-1, -1), 0.8, border),
                           ('LEFTPADDING', (0, 0), (-1, -1), pad), ('RIGHTPADDING', (0, 0), (-1, -1), pad),
                           ('TOPPADDING', (0, 0), (-1, -1), pad - 2), ('BOTTOMPADDING', (0, 0), (-1, -1), pad)]))
    return t

def unit_bar(text, right=''):
    t = Table([[Paragraph(esc(text), st['unit']), Paragraph(esc(right), S('ur', fontSize=8.5, leading=12, color=GOLD2, alignment=2))]],
              colWidths=[120 * mm, 62 * mm])
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), NIGHT), ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                           ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 5), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                           ('LINEBELOW', (0, 0), (-1, -1), 1.4, GOLD2)]))
    return t

def quiz_block(q, i):
    longest = max(len(o) for o in q['options'])
    if longest <= 9:
        opt = Table([[Paragraph(f'{MARKS[k]} {esc(q["options"][k])}', st['ja']) for k in range(4)]], colWidths=[40 * mm] * 4)
    else:
        opt = Table([[Paragraph(f'{MARKS[k]} {esc(q["options"][k])}', st['ja']) for k in (0, 1)],
                     [Paragraph(f'{MARKS[k]} {esc(q["options"][k])}', st['ja']) for k in (2, 3)]], colWidths=[80 * mm] * 2)
    opt.setStyle(TableStyle([('LEFTPADDING', (0, 0), (-1, -1), 0), ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 1)]))
    ask = '（意味は？）' if q['dir'] == 'e2j' else '（英語は？）'
    row = Table([[Paragraph(f'<font color="#b8860b"><b>{i}</b></font>', st['w']),
                  [Paragraph(f'{esc(q["label"])} <font name="JP" size="7.5" color="#6b5d45">{ask}</font>', st['en'] if q['dir'] == 'e2j' else st['w']), opt],
                  Paragraph('<font color="#c9b893" size="14">□</font>', st['body'])]], colWidths=[9 * mm, 160 * mm, 13 * mm])
    row.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 0),
                             ('LINEBELOW', (0, 0), (-1, -1), 0.3, LINE), ('BOTTOMPADDING', (0, 0), (-1, -1), 3), ('TOPPADDING', (0, 0), (-1, -1), 2)]))
    return row

def answer_grid(title, quiz, cols=10):
    rows, cur = [], []
    for i, q in enumerate(quiz):
        cur.append(Paragraph(f'<b>{i + 1}</b> {MARKS[q["answer"]]}', st['ans']))
        if len(cur) == cols: rows.append(cur); cur = []
    if cur: rows.append(cur + [''] * (cols - len(cur)))
    t = Table(rows, colWidths=[182 * mm / cols] * cols)
    t.setStyle(TableStyle([('GRID', (0, 0), (-1, -1), 0.3, LINE), ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f2fbf5')),
                           ('TOPPADDING', (0, 0), (-1, -1), 1.5), ('BOTTOMPADDING', (0, 0), (-1, -1), 1.5)]))
    return KeepTogether([Paragraph(esc(title), st['small']), Spacer(1, 1), t, Spacer(1, 3)])

def sort_key(word):
    return re.sub(r'[^a-z ]', '', word.lower().replace('～', '')).strip() or word.lower()

def build(book, all_words):
    pid, levels, title, subtitle, kind = book
    words = [w for lv in levels for w in all_words if w['level'] == lv and w.get('questions')]
    for i, w in enumerate(words): w['_no'] = i + 1
    n = len(words); unit_word = '熟語' if kind == 'idiom' else '語'
    units = [words[i:i + UNIT] for i in range(0, n, UNIT)]
    nex = sum(1 for w in words if example_of(w))
    flat = title.replace('\n', ' ')
    story = [NextPageTemplate('body'), Spacer(1, 30 * mm),
             Paragraph(('IDIOMS' if kind == 'idiom' else 'VOCABULARY') + ' ／ COMPLETE EDITION', st['eyebrow']), Spacer(1, 4 * mm),
             Paragraph(esc(title).replace('\n', '<br/>'), st['h1']), Spacer(1, 6 * mm),
             Paragraph(esc(subtitle), st['h1s']), Spacer(1, 26 * mm)]
    stats = [(f'{n:,}{unit_word}', '全収録（データの全件）'), (f'{len(units)}ユニット', f'{UNIT}{unit_word}ずつ'),
             (f'{len(units) * 10}問', 'ユニット確認テスト'), ('100問', '総仕上げテスト'), (f'例文 {nex}', '共通テスト形式の英文から')]
    cells = [Paragraph(f'<font color="#e9c46a" size="13"><b>{esc(a)}</b></font><br/><font size="8" color="#ffffff">{esc(b)}</font>', st['body']) for a, b in stats]
    t = Table([cells], colWidths=[182 * mm / len(cells)] * len(cells))
    t.setStyle(TableStyle([('BOX', (0, 0), (-1, -1), 0.8, GOLD2), ('INNERGRID', (0, 0), (-1, -1), 0.5, GOLD2),
                           ('TOPPADDING', (0, 0), (-1, -1), 9), ('BOTTOMPADDING', (0, 0), (-1, -1), 9), ('LEFTPADDING', (0, 0), (-1, -1), 7)]))
    story += [t, Spacer(1, 14 * mm),
              Paragraph('この1冊だけで、そのレベルの全' + unit_word + 'を「見たら分かる」から「テストで取れる」まで仕上げられるように作りました。', st['h1s']),
              PageBreak()]

    # ── 使い方 ──
    days = max(10, (len(units) + 1) // 1)
    story += [Paragraph('この本の使い方', st['h2']),
              box([Paragraph('<b>3周で覚えきる（1ユニット＝1日15〜20分）</b>', st['h3']), Spacer(1, 2),
                   Paragraph('<b>1周目（覚える）</b>　ユニットの' + unit_word + 'を1つ5秒で見て、訳を言えたら左の□1に✓。言えなければ訳と例文を音読して次へ。', st['body']),
                   Paragraph('<b>2周目（確かめる）</b>　訳を手やしおりで隠して言う。言えたら□2に✓。そのあと確認テスト10問。', st['body']),
                   Paragraph('<b>3周目（仕上げ）</b>　□2に✓が無い' + unit_word + 'だけをもう一度。言えたら□3に✓。全ユニット終わったら総仕上げテスト。', st['body']),
                   Spacer(1, 3),
                   Paragraph('・例文は、このアプリの共通テスト形式リスニングの英文から、その' + unit_word + 'を含む1文を載せています（例文のない' + unit_word + 'もあります）。', st['small']),
                   Paragraph('・訳と4択の選択肢は、アプリの単語帳・4択とまったく同じデータです。アプリで同じユニットを解けば、そのまま復習になります。', st['small']),
                   Paragraph('・最後の「さくいん」で、知らない' + unit_word + 'がこの本の何番かをすぐ引けます。', st['small'])]),
              Spacer(1, 5 * mm), Paragraph('学習計画表（1日1ユニット。日付を書き、終わったら✓）', st['h2'])]
    rows = [['ユニット', '番号', '1周目', '2周目', 'テスト', '3周目']]
    for k, u in enumerate(units):
        rows.append([f'Unit {k + 1}', f'{u[0]["_no"]}〜{u[-1]["_no"]}', '　／', '　／', '　／10', '　／'])
    plan = Table(rows, colWidths=[24 * mm, 32 * mm, 31.5 * mm, 31.5 * mm, 31.5 * mm, 31.5 * mm], repeatRows=1)
    plan.setStyle(TableStyle([('FONT', (0, 0), (-1, -1), F, 8.6), ('FONT', (0, 0), (-1, 0), FB, 8.6), ('BACKGROUND', (0, 0), (-1, 0), GOLD_SOFT),
                              ('GRID', (0, 0), (-1, -1), 0.3, LINE), ('ALIGN', (2, 0), (-1, -1), 'CENTER'),
                              ('TOPPADDING', (0, 0), (-1, -1), 2.2), ('BOTTOMPADDING', (0, 0), (-1, -1), 2.2)]))
    story += [plan, PageBreak()]

    # ── 本編＋確認テスト ──
    quizzes = []
    for k, u in enumerate(units):
        story += [unit_bar(f'Unit {k + 1}', f'No. {u[0]["_no"]}〜{u[-1]["_no"]}（{len(u)}{unit_word}）'), Spacer(1, 2 * mm)]
        rows = [[Paragraph('<font size="7" color="#6b5d45">1 2 3</font>', st['small']), '', Paragraph('<font size="7.5"><b>見出し語</b></font>', st['small']),
                 Paragraph('<font size="7.5"><b>訳 ／ 例文</b></font>', st['small'])]]
        for w in u:
            ex = example_of(w)
            right = [Paragraph(esc(w['fullMeaning']), st['ja'])]
            if ex: right.append(Paragraph(ex, st['ex']))
            rows.append([Paragraph('<font color="#c9b893" size="10">□□□</font>', st['body']),
                         Paragraph(f'<font color="#b8860b" size="8"><b>{w["_no"]}</b></font>', st['body']),
                         Paragraph(esc(w['word']), st['en']), right])
        t = Table(rows, colWidths=[15 * mm, 11 * mm, 52 * mm, 104 * mm], repeatRows=1)
        t.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LINEBELOW', (0, 0), (-1, -1), 0.3, LINE),
                               ('LEFTPADDING', (0, 0), (-1, -1), 2), ('TOPPADDING', (0, 0), (-1, -1), 1.6), ('BOTTOMPADDING', (0, 0), (-1, -1), 2.2),
                               ('BACKGROUND', (0, 0), (-1, 0), GOLD_SOFT)]
                              + [('BACKGROUND', (0, r), (-1, r), colors.HexColor('#fffdf6')) for r in range(2, len(rows), 2)]))
        story += [t, Spacer(1, 3 * mm)]
        rnd = random.Random(f'{pid}:{k}')
        picks = sorted(rnd.sample(u, min(10, len(u))), key=lambda w: w['_no'])
        q = make_quiz(picks, f'{pid}:q{k}')
        quizzes.append(q)
        story += [CondPageBreak(60 * mm), Paragraph(f'Unit {k + 1} 確認テスト（10問）', st['h3']),
                  Paragraph('答えは右の□に。解答は巻末「解答」にあります。', st['small']), Spacer(1, 1)]
        story += [quiz_block(x, i + 1) for i, x in enumerate(q)]
        story.append(PageBreak())

    # ── 総仕上げテスト ──
    rnd = random.Random(f'{pid}:final')
    final_words = sorted(rnd.sample(words, 100), key=lambda w: w['_no'])
    if kind == 'word':
        final = make_quiz(final_words[:50], f'{pid}:f1', 'e2j') + make_quiz(final_words[50:], f'{pid}:f2', 'j2e')
    else:
        final = make_quiz(final_words, f'{pid}:f1', 'e2j')
    story += [unit_bar('総仕上げテスト（100問）', '目標 90点以上'), Spacer(1, 2 * mm),
              Paragraph('全ユニットから100問。' + ('前半50問は英→日、後半50問は日→英。' if kind == 'word' else '') +
                        '1問10秒が目安（合計17分）。間違えた問題の番号（No.）のユニットに戻って3周目をやり直す。', st['small']), Spacer(1, 2)]
    story += [quiz_block(x, i + 1) for i, x in enumerate(final)]
    story.append(PageBreak())

    # ── 解答 ──
    story += [unit_bar('解答', '正解の位置は①〜④に均等'), Spacer(1, 3 * mm)]
    for k, q in enumerate(quizzes):
        story.append(answer_grid(f'Unit {k + 1} 確認テスト　（見出し語 No. ' + '・'.join(str(x['no']) for x in q) + '）', q))
    story += [Spacer(1, 2 * mm), answer_grid('総仕上げテスト（100問）', final)]
    story += [Spacer(1, 3 * mm), Paragraph('総仕上げテスト：問題の番号と見出し語 No. の対応', st['small'])]
    rows, cur = [], []
    for i, x in enumerate(final):
        cur.append(Paragraph(f'{i + 1}→No.{x["no"]}', st['idx']))
        if len(cur) == 10: rows.append(cur); cur = []
    t = Table(rows, colWidths=[18.2 * mm] * 10); t.setStyle(TableStyle([('GRID', (0, 0), (-1, -1), 0.2, LINE), ('TOPPADDING', (0, 0), (-1, -1), 1), ('BOTTOMPADDING', (0, 0), (-1, -1), 1)]))
    story += [t, Spacer(1, 4 * mm), Paragraph('自己採点', st['h2'])]
    rows = [['', '1回目', '2回目', '3回目'], ['総仕上げテスト', '　　／100', '　　／100', '　　／100'],
            ['確認テスト合計', f'　　／{len(units) * 10}', f'　　／{len(units) * 10}', f'　　／{len(units) * 10}']]
    t = Table(rows, colWidths=[50 * mm, 44 * mm, 44 * mm, 44 * mm])
    t.setStyle(TableStyle([('FONT', (0, 0), (-1, -1), F, 9.5), ('GRID', (0, 0), (-1, -1), 0.4, LINE), ('BACKGROUND', (0, 0), (-1, 0), GOLD_SOFT),
                           ('ALIGN', (1, 0), (-1, -1), 'CENTER'), ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6)]))
    story += [t, Spacer(1, 2), Paragraph('目安：総仕上げ 90点以上・確認テスト 9割以上で「このレベルは完成」。', st['small']), PageBreak()]

    # ── さくいん（4段組みで流し込む：長い熟語が折り返しても段がずれない） ──
    story += [unit_bar('さくいん', 'アルファベット順・数字は見出し語 No.'), NextPageTemplate('index'), PageBreak()]
    idx = sorted(words, key=lambda w: sort_key(w['word']))
    head = ''
    for w in idx:
        h = (sort_key(w['word'])[:1] or '#').upper()
        if h != head:
            head = h; story.append(Paragraph(f'<b><font color="#b8860b">{esc(h)}</font></b>', S('ih', font=FB, fontSize=9, leading=12, spaceBefore=2)))
        story.append(Paragraph(f'{esc(w["word"])} <font color="#b8860b">{w["_no"]}</font>', st['idx']))

    out = ROOT / f'public/prints/{pid}.pdf'
    doc = BaseDocTemplate(str(out), pagesize=A4, leftMargin=14 * mm, rightMargin=14 * mm, topMargin=12 * mm, bottomMargin=13 * mm,
                          title=f'{flat}（UR 完全版）', author='マナトビ')
    fr = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='f')
    cw = (doc.width - 3 * 4 * mm) / 4
    cols = [Frame(doc.leftMargin + c * (cw + 4 * mm), doc.bottomMargin, cw, doc.height, id=f'c{c}', leftPadding=1, rightPadding=1) for c in range(4)]
    doc.addPageTemplates([PageTemplate(id='cover', frames=[fr], onPage=on_page(flat)),
                          PageTemplate(id='body', frames=[fr], onPage=on_page(flat)),
                          PageTemplate(id='index', frames=cols, onPage=on_page(flat))])
    doc.build(story)
    thumb(out, ROOT / f'public/prints/thumbs/{pid}.webp')
    for w in words: w.pop('_no', None)
    return out, n, len(units)

def thumb(pdf, dst):
    from PIL import Image
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(['pdftoppm', '-r', '72', '-f', '1', '-l', '1', '-png', str(pdf), f'{d}/p'], check=True, capture_output=True)
        im = Image.open(next(Path(d).glob('p*.png'))).convert('RGB'); im = im.resize((360, int(360 * im.height / im.width)))
        im.crop((0, 0, 360, 510)).save(dst, 'WEBP', quality=82)

if __name__ == '__main__':
    words = json.loads(DATA.read_text())['words']
    want = set(sys.argv[1:])
    for b in BOOKS:
        if want and b[0] not in want: continue
        out, n, nu = build(b, words)
        r = subprocess.run(['pdfinfo', str(out)], capture_output=True, text=True).stdout
        pages = re.search(r'Pages:\s+(\d+)', r).group(1)
        print(f'{b[0]}: {n}語 {nu}ユニット {pages}ページ {out.stat().st_size // 1024}KB')
