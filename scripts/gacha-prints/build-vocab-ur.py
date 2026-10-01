#!/usr/bin/env python3
"""
UR 学習プリント「英単語／英熟語 100語テスト」を作り直す（2026-10-01）。

  入力 : public/data/listeningVocabulary.json（アプリの単語帳と同じデータ）
  出力 : public/prints/print_vocab_*.pdf ／ public/prints/thumbs/print_vocab_*.webp

■ 以前の版の問題点
  ・後半の「4択で確認（20問）」に答えが載っていなかった
  ・意味の答えが別ページの一覧だけで、例文・使い方が無い
■ この版（1冊 = 100語）
  1. 意味テスト（英→日）100語 … 書いて ✓
  2. 逆テスト（日→英）30語 … 頭文字ヒントつき。書けるかで本当に覚えたかを見る
  3. 4択で確認 30問 … アプリの4択と同じ選択肢（データのまま）。正解位置は①〜④に均等
  4. 解答・単語カード … 全訳語・例文（あるもの）・4択の答え
  5. 自己採点と復習の予定表
  単語の選び方：同じレベルから固定の乱数で100語（第2集は別の100語）。毎回同じになる。
"""
import json, random, subprocess, tempfile
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle, PageBreak, CondPageBreak)
from reportlab.platypus.doctemplate import NextPageTemplate
from reportlab.lib.styles import ParagraphStyle

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'public/data/listeningVocabulary.json'
MARKS = '①②③④'
import sys as _s; _s.path.insert(0, str(Path(__file__).parent))
import fonts as _fonts
F, FB = _fonts.setup(); _fonts.install_fake_bold(); _fonts.match_stroke_to_fill()
GOLD = colors.HexColor('#c98512'); GOLD_SOFT = colors.HexColor('#fff4dc'); NIGHT = colors.HexColor('#172a4f')
INK = colors.HexColor('#2b2418'); SUB = colors.HexColor('#6b5d45'); LINE = colors.HexColor('#e2d3b5'); GREEN = colors.HexColor('#2f7a52')
S = lambda n, **kw: ParagraphStyle(n, fontName=kw.pop('font', F), textColor=kw.pop('color', INK), **kw)
st = {'h1': S('h1', font=FB, fontSize=24, leading=30, color=colors.white), 'cs': S('cs', fontSize=11.5, leading=17, color=colors.white),
      'h2': S('h2', font=FB, fontSize=13.5, leading=18, color=NIGHT, spaceAfter=3), 'body': S('b', fontSize=9.6, leading=14.5),
      'small': S('s', fontSize=8.4, leading=12, color=SUB), 'w': S('w', font=FB, fontSize=10.5, leading=14), 'ja': S('ja', fontSize=9.4, leading=13),
      'ex': S('ex', fontSize=8.6, leading=12, color=SUB), 'ans': S('a', font=FB, fontSize=9.6, leading=13, color=GREEN)}

def esc(s):
    s = str(s).replace('\u301c', '～').replace('~', '～')
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

PRINTS = [
  # id, level, 第n集, タイトル
  ('print_vocab_lv1', 'lv1', 1, '英単語 Lv1 共通テスト基礎'),
  ('print_vocab_lv2', 'lv2', 1, '英単語 Lv2 共通テスト標準'),
  ('print_vocab_lv2_2', 'lv2', 2, '英単語 Lv2 共通テスト標準 第2集'),
  ('print_vocab_lv3', 'lv3', 1, '英単語 Lv3 二次・私大標準'),
  ('print_vocab_lv3_2', 'lv3', 2, '英単語 Lv3 二次・私大標準 第2集'),
  ('print_vocab_lv4', 'lv4', 1, '英単語 Lv4 難関・最難関'),
  ('print_vocab_ilv1', 'ilv1', 1, '英熟語 Lv1 基礎'),
]

def pick(words, level, vol):
    pool = [w for w in words if w['level'] == level and w.get('questions')]
    # 例文がある語を少し優先（読めば使い方まで分かる）しつつ、固定の乱数で混ぜる
    rnd = random.Random(f'{level}:{20261001}')
    rnd.shuffle(pool)
    pool.sort(key=lambda w: 0 if w['examples'] else 1)  # 安定ソート：例文つきが前、その中は乱数順
    with_ex = [w for w in pool if w['examples']]; without = [w for w in pool if not w['examples']]
    mixed = []
    # 1集あたり例文つきを最大40語、残りは例文なし
    for v in range(vol):
        a = with_ex[v * 40:(v + 1) * 40]; b = without[v * (100 - len(a)) : (v + 1) * (100 - len(a))] if a else without[v * 100:(v + 1) * 100]
        mixed = a + b
    rnd2 = random.Random(f'{level}:{vol}:order'); rnd2.shuffle(mixed)
    assert len(mixed) == 100, (level, vol, len(mixed))
    return mixed

import re as _re
def example_of(w):
    """例文は「その語を含む1文」だけ（音声の原稿まるごとは長すぎる）。語は太字に。見つからなければ出さない"""
    word = w['word'].replace('～', '').replace('~', '').strip()
    head = word.split()[0] if word else ''
    if not head:
        return None
    for ex in w['examples']:
        sents = _re.split(r'(?<=[.!?])\s+', ex['script'].replace('\n', ' '))
        for sen in sents:
            m = _re.search(r'\b' + _re.escape(head) + r'\w*', sen, _re.I)
            if m and len(sen) <= 160:
                t = esc(sen)
                t = _re.sub(r'\b(' + _re.escape(esc(head)) + r'\w*)', r'<b>\1</b>', t, count=1, flags=_re.I)
                return t, ex['chapterTitle']
    return None

def balanced_quiz(ws):
    """4択はアプリのデータ（選択肢・正解）のまま。並びだけ入れ替えて正解位置を均等に"""
    rnd = random.Random(len(ws) * 7 + 13)
    targets = [k for k in range(4) for _ in range(len(ws) // 4)] + list(range(len(ws) % 4)); rnd.shuffle(targets)
    out = []
    for w, t in zip(ws, targets):
        q = next((q for q in w['questions'] if q['id'].endswith(':e2j')), w['questions'][0])
        opts = list(q['options']); ans = q['answerIndex']
        assert len(opts) == 4 and 0 <= ans < 4
        others = [o for i, o in enumerate(opts) if i != ans]; rnd.shuffle(others)
        new = others[:]; new.insert(t, opts[ans])
        out.append({'word': w['word'], 'prompt': q.get('prompt') or '意味を選べ', 'options': new, 'answer': t, 'correct': opts[ans]})
    return out

def on_page(title):
    def f(c, doc):
        w, h = A4
        c.saveState()
        if doc.page > 1:
            c.setFillColor(GOLD); c.rect(0, h - 6 * mm, w, 6 * mm, stroke=0, fill=1)
            c.setFont(FB, 7.5); c.setFillColor(colors.white); c.drawString(14 * mm, h - 4.2 * mm, f'★ 大当たり UR 学習プリント ★   {title} 100語テスト')
        else:
            c.setFillColor(NIGHT); c.roundRect(12 * mm, h - 104 * mm, w - 24 * mm, 86 * mm, 8 * mm, stroke=0, fill=1)
            c.setFillColor(GOLD); c.circle(w - 34 * mm, h - 30 * mm, 24 * mm, stroke=0, fill=1)
        c.setFont(F, 7.5); c.setFillColor(SUB)
        c.drawString(14 * mm, 8 * mm, 'マナトビ 学習プリント ／ 英単語（アプリの単語帳・英単語の4択と同じデータ）')
        c.drawRightString(w - 14 * mm, 8 * mm, str(doc.page))
        c.restoreState()
    return f

def grid(rows, widths, head=True, zebra=True):
    t = Table(rows, colWidths=widths, repeatRows=1 if head else 0)
    style = [('FONT', (0, 0), (-1, -1), F, 9.4), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('LINEBELOW', (0, 0), (-1, -1), 0.3, LINE),
             ('TOPPADDING', (0, 0), (-1, -1), 3), ('BOTTOMPADDING', (0, 0), (-1, -1), 3)]
    if head: style += [('FONT', (0, 0), (-1, 0), FB, 8.4), ('BACKGROUND', (0, 0), (-1, 0), GOLD_SOFT)]
    if zebra: style += [('BACKGROUND', (0, r), (-1, r), colors.HexColor('#fffdf6')) for r in range(2, len(rows), 2)]
    t.setStyle(TableStyle(style)); return t

def build_one(pid, level, vol, title, words):
    ws = pick(words, level, vol)
    isIdiom = level.startswith('i')
    unit = '熟語' if isIdiom else '語'
    rev = ws[:30]
    quiz = balanced_quiz(ws[30:60])
    story = [NextPageTemplate('body'), Spacer(1, 20 * mm),
             Paragraph(('IDIOM' if isIdiom else 'VOCABULARY') + ' TEST 100 ／ UR PRINT', S('e', font=FB, fontSize=9, color=colors.HexColor('#ffd36b'))), Spacer(1, 3 * mm),
             Paragraph(esc(title) + '<br/>100' + unit + 'テスト', st['h1']), Spacer(1, 4 * mm),
             Paragraph('アプリの単語帳と同じ100' + unit + '。英→日・日→英・4択の3方向で<br/>「見たらわかる」を「使える」まで仕上げる。全問解答つき。', st['cs']), Spacer(1, 36 * mm)]
    stats = Table([[Paragraph(f'<b>100{unit}</b><br/><font size="8" color="#6b5d45">英→日テスト</font>', st['body']),
                    Paragraph('<b>30問</b><br/><font size="8" color="#6b5d45">日→英（頭文字ヒント）</font>', st['body']),
                    Paragraph('<b>30問</b><br/><font size="8" color="#6b5d45">4択で確認</font>', st['body']),
                    Paragraph(f'<b>例文 {sum(1 for w in ws if example_of(w))}{unit}</b><br/><font size="8" color="#6b5d45">共テ音声の英文から</font>', st['body'])]],
                  colWidths=[45.5 * mm] * 4)
    stats.setStyle(TableStyle([('BOX', (0, 0), (-1, -1), 0.8, LINE), ('INNERGRID', (0, 0), (-1, -1), 0.5, LINE), ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7), ('LEFTPADDING', (0, 0), (-1, -1), 8)]))
    howto = Table([[[Paragraph('<b>このプリントの使い方（1日15分×3日）</b>', S('h', font=FB, fontSize=10.5, color=GOLD)), Spacer(1, 2),
                     Paragraph('1日目　① 英→日 100' + unit + 'を1' + unit + '5秒で。書けなければ飛ばして✓。　② 解答で答え合わせ、✓の' + unit + 'は例文を音読。', st['body']),
                     Paragraph('2日目　③ 日→英 30問と ④ 4択 30問。間違えた' + unit + 'は単語カードに印。', st['body']),
                     Paragraph('3日目　⑤ ✓と印の' + unit + 'だけもう一度。最後の表に点数を書く。アプリの「英単語の4択」で同じレベルを1セット。', st['body'])]]], colWidths=[182 * mm])
    howto.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), GOLD_SOFT), ('BOX', (0, 0), (-1, -1), 0.8, GOLD), ('LEFTPADDING', (0, 0), (-1, -1), 8), ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 8)]))
    story += [stats, Spacer(1, 6 * mm), howto, PageBreak()]

    # 1. 英→日
    story += [Paragraph(f'① 英→日テスト（100{unit}）', st['h2']), Paragraph('意味を線の上に書く。書けなかったら左の□に✓。', st['small']), Spacer(1, 2 * mm)]
    rows = [['', '#', '英語', '意味', '', '#', '英語', '意味']]
    for r in range(50):
        a, b = ws[r], ws[r + 50]
        rows.append(['□', str(r + 1), Paragraph(esc(a['word']), st['w']), '', '□', str(r + 51), Paragraph(esc(b['word']), st['w']), ''])
    t = grid(rows, [5 * mm, 7 * mm, 33 * mm, 46 * mm] * 2)
    t.setStyle(TableStyle([('TEXTCOLOR', (0, 1), (0, -1), LINE), ('TEXTCOLOR', (4, 1), (4, -1), LINE), ('TEXTCOLOR', (1, 1), (1, -1), SUB), ('TEXTCOLOR', (5, 1), (5, -1), SUB),
                           ('LINEBELOW', (3, 1), (3, -1), 0.6, colors.HexColor('#b9a77f')), ('LINEBELOW', (7, 1), (7, -1), 0.6, colors.HexColor('#b9a77f')),
                           ('LINEAFTER', (3, 0), (3, -1), 1.0, GOLD)]))
    story += [t, PageBreak()]

    # 2. 日→英
    story += [Paragraph('② 日→英テスト（30問）', st['h2']), Paragraph('日本語を見て英語を書く。（　）の中は頭文字と文字数のヒント。', st['small']), Spacer(1, 2 * mm)]
    rows = [['#', '意味', 'ヒント', '英語']]
    for i, w in enumerate(rev):
        word = w['word']; first = word.strip()[0]
        hint = f'{first}{"＿" * max(1, len(word.split()[0]) - 1)}' + (f'（{len(word.split())}語）' if ' ' in word.strip() else f'（{len(word)}文字）')
        rows.append([str(i + 1), Paragraph(esc(w['meaning']), st['ja']), Paragraph(esc(hint), st['small']), ''])
    t = grid(rows, [8 * mm, 86 * mm, 38 * mm, 50 * mm])
    t.setStyle(TableStyle([('LINEBELOW', (3, 1), (3, -1), 0.6, colors.HexColor('#b9a77f')), ('TOPPADDING', (0, 1), (-1, -1), 5), ('BOTTOMPADDING', (0, 1), (-1, -1), 5)]))
    story += [t, PageBreak()]

    # 3. 4択
    story += [Paragraph('③ 4択で確認（30問）', st['h2']), Paragraph('似た意味・つづりの似た語と区別できるか。答えは右の□へ。', st['small']), Spacer(1, 2 * mm)]
    for i, q in enumerate(quiz):
        opt = Table([[Paragraph(f'{MARKS[k]} {esc(q["options"][k])}', st['ja']) for k in (0, 1)], [Paragraph(f'{MARKS[k]} {esc(q["options"][k])}', st['ja']) for k in (2, 3)]], colWidths=[78 * mm, 78 * mm])
        opt.setStyle(TableStyle([('LEFTPADDING', (0, 0), (-1, -1), 0), ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 1)]))
        row = Table([[Paragraph(f'<font color="#c98512"><b>{i + 1}</b></font>', st['w']), [Paragraph(f'<b>{esc(q["word"])}</b>　<font size="8" color="#6b5d45">の意味は？</font>', st['w']), opt],
                      Paragraph('<font color="#c9b893" size="15">□</font>', st['body'])]], colWidths=[9 * mm, 160 * mm, 13 * mm])
        row.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 0), ('LINEBELOW', (0, 0), (-1, -1), 0.3, LINE), ('BOTTOMPADDING', (0, 0), (-1, -1), 4), ('TOPPADDING', (0, 0), (-1, -1), 3)]))
        story.append(row)
    story.append(PageBreak())

    # 4. 解答
    story += [Paragraph('解答', st['h2']), Paragraph('③ 4択の答え（正解は①〜④に均等）', st['small']), Spacer(1, 1 * mm)]
    rows = []
    for r in range(0, 30, 10):
        rows.append([Paragraph(f'<b>{i + 1}</b> {MARKS[quiz[i]["answer"]]}', st['ans']) for i in range(r, r + 10)])
    t = Table(rows, colWidths=[18.2 * mm] * 10); t.setStyle(TableStyle([('GRID', (0, 0), (-1, -1), 0.4, LINE), ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f2fbf5'))]))
    story += [t, Spacer(1, 4 * mm), Paragraph(f'① 英→日・② 日→英の答え／単語カード（100{unit}）　★＝②日→英で出た語', st['small']), Spacer(1, 1 * mm)]
    revset = {id(w) for w in rev}
    for i, w in enumerate(ws):
        ex = example_of(w)
        cells = [Paragraph(f'<font color="#c98512"><b>{i + 1}</b></font>{" ★" if id(w) in revset else ""}', st['body']),
                 [Paragraph(f'<b>{esc(w["word"])}</b>', st['w']), Paragraph(esc(w['fullMeaning']), st['ja'])] +
                 ([Paragraph('例文：' + ex[0] + f'　<font size="7">（{esc(ex[1])}の音声より）</font>', st['ex'])] if ex else [])]
        t = Table([cells], colWidths=[12 * mm, 170 * mm]); t.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LINEBELOW', (0, 0), (-1, -1), 0.3, LINE), ('LEFTPADDING', (0, 0), (-1, -1), 2), ('TOPPADDING', (0, 0), (-1, -1), 2), ('BOTTOMPADDING', (0, 0), (-1, -1), 3)]))
        story.append(t)
    story += [CondPageBreak(70 * mm), Spacer(1, 4 * mm), Paragraph('自己採点と復習の予定', st['h2'])]
    rows = [['', '① 英→日', '② 日→英', '③ 4択', '✓の数']] + [[d, '　／100', '　／30', '　／30', ''] for d in ('1日目', '2日目', '3日目', '1週間後')]
    t = grid(rows, [30 * mm, 38 * mm, 38 * mm, 38 * mm, 38 * mm]); t.setStyle(TableStyle([('ALIGN', (1, 0), (-1, -1), 'CENTER'), ('TOPPADDING', (0, 1), (-1, -1), 7), ('BOTTOMPADDING', (0, 1), (-1, -1), 7)]))
    story += [t, Spacer(1, 3 * mm), Paragraph('目安：① 85点・② 25点・③ 27点以上で「このレベルは合格」。届かなかった' + unit + 'は、アプリの単語帳で「意味をかくす」にして1日1回めくる。', st['small'])]

    out = ROOT / f'public/prints/{pid}.pdf'
    doc = BaseDocTemplate(str(out), pagesize=A4, leftMargin=14 * mm, rightMargin=14 * mm, topMargin=12 * mm, bottomMargin=14 * mm, title=f'{title} 100{unit}テスト（UR学習プリント）', author='マナトビ')
    fr = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='f')
    doc.addPageTemplates([PageTemplate(id='cover', frames=[fr], onPage=on_page(title)), PageTemplate(id='body', frames=[fr], onPage=on_page(title))])
    doc.build(story)
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(['pdftoppm', '-r', '72', '-f', '1', '-l', '1', '-png', str(out), f'{d}/p'], check=True, capture_output=True)
        from PIL import Image
        im = Image.open(next(Path(d).glob('p*.png'))).convert('RGB'); im = im.resize((360, int(360 * im.height / im.width)))
        im.crop((0, 0, 360, 510)).save(ROOT / f'public/prints/thumbs/{pid}.webp', 'WEBP', quality=82)
    dist = [sum(1 for q in quiz if q['answer'] == k) for k in range(4)]
    return out, dist, sum(1 for w in ws if example_of(w))

if __name__ == '__main__':
    words = json.loads(DATA.read_text())['words']
    seen = {}
    for pid, level, vol, title in PRINTS:
        out, dist, ex = build_one(pid, level, vol, title, words)
        print(pid, 'quiz dist', dist, 'examples', ex)
