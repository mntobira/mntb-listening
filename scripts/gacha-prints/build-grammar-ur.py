#!/usr/bin/env python3
"""
UR 学習プリント「英文法 全20単元 総合100題」を作り直す（2026-10-01）。

  入力 : .tmpwork/grammar-raw.json（npx tsx .tmpwork/eg/dump.mts で、アプリの英文法データ＝手書きの素データを書き出したもの）
  出力 : public/prints/print_grammar_100.pdf ／ public/prints/thumbs/print_grammar_100.webp

■ 以前の版の問題点（UR＝大当たりなのに）
  ・解説が全問「正解は『saves』。」の1行だけ（なぜ他が違うかが無い）
  ・正解の位置が ② に74問かたより、②を塗るだけで7割取れてしまう
  ・アプリの問題と並び・答えが食い違っていた（100問中69問）
■ この版
  ・問題・選択肢・解説はアプリの手書きデータをそのまま使う（文章を機械で作らない）
  ・選択肢の並びだけを固定の乱数で入れ替え、正解位置を①〜④に均等にする。
    解説の中の「① の hears は…」の番号も同じ対応表で付け替える（番号と中身が必ず一致する）
  ・各問の解説：正解 → 完成文と和訳 → 決め手の語句 → 解き方の手順 → 誤答肢がなぜ違うか
  ・単元ごとのまとめ、解答用紙（マークシート風）、単元別の自己採点表
"""
import json, random, re, sys
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
                                PageBreak, KeepTogether, CondPageBreak)
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / '.tmpwork/grammar-raw.json'
OUT = ROOT / 'public/prints/print_grammar_100.pdf'
THUMB = ROOT / 'public/prints/thumbs/print_grammar_100.webp'
MARKS = '①②③④'

import sys as _s; _s.path.insert(0, str(Path(__file__).parent))
import fonts as _fonts
F, FB = _fonts.setup(); _fonts.install_fake_bold(); _fonts.match_stroke_to_fill()

GOLD = colors.HexColor('#c98512'); GOLD_SOFT = colors.HexColor('#fff4dc'); NIGHT = colors.HexColor('#172a4f')
INK = colors.HexColor('#2b2418'); SUB = colors.HexColor('#6b5d45'); LINE = colors.HexColor('#e2d3b5')
GREEN = colors.HexColor('#2f7a52'); RED = colors.HexColor('#b3261e'); BLUE = colors.HexColor('#2458a6')

S = lambda name, **kw: ParagraphStyle(name, fontName=kw.pop('font', F), textColor=kw.pop('color', INK), **kw)
st = {
  'h1': S('h1', font=FB, fontSize=24, leading=30, color=colors.white),
  'cover_sub': S('cs', fontSize=11.5, leading=17, color=colors.white),
  'h2': S('h2', font=FB, fontSize=13.5, leading=18, color=NIGHT, spaceBefore=4, spaceAfter=4),
  'unit': S('unit', font=FB, fontSize=11.5, leading=15, color=colors.white),
  'body': S('body', fontSize=9.6, leading=14.5),
  'small': S('small', fontSize=8.4, leading=12, color=SUB),
  'q': S('q', fontSize=10.3, leading=15),
  'qn': S('qn', font=FB, fontSize=11, leading=15, color=GOLD),
  'ch': S('ch', fontSize=9.8, leading=14),
  'ans': S('ans', font=FB, fontSize=10.5, leading=15, color=GREEN),
  'ex': S('ex', fontSize=9.1, leading=13.6),
  'exs': S('exs', fontSize=8.6, leading=12.6, color=SUB),
  'tag': S('tag', font=FB, fontSize=8.2, leading=11, color=GOLD),
}

def esc(s):
    # 「〜」(U+301C) と「~」は Noto Sans CJK でも欧文側で字形が細く「˜」に見えるので、全角の「～」にそろえる
    s = str(s).replace('\u301c', '～').replace('~', '～')
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

def blank(s):
    # 空所 ______ → 枠つきの （　？　）
    return esc(s).replace('______', '<font color="#c98512"><b>（　　？　　）</b></font>')

# ---------- データ：正解位置を均等にする ----------
def balanced(items):
    """正解位置が ①〜④ に25問ずつになるよう、固定の乱数で選択肢を並べ替える。
       mapping[old_index] = new_index。解説の番号もこれで付け替える。"""
    rnd = random.Random(20261001)
    targets = [k for k in range(4) for _ in range(len(items) // 4)] + list(range(len(items) % 4))
    rnd.shuffle(targets)
    out = []
    for it, tgt in zip(items, targets):
        a = MARKS.index(it['answer'])
        others = [k for k in range(4) if k != a]
        rnd.shuffle(others)
        order = [None] * 4  # order[new] = old
        order[tgt] = a
        free = [k for k in range(4) if k != tgt]
        for k, o in zip(free, others): order[k] = o
        mapping = {old: new for new, old in enumerate(order)}
        def remap(text):
            # 「①能力…」「②推量…」のように、すぐ後ろに文字が続く丸数字は「分類の番号」で選択肢ではないので付け替えない
            def sub(m):
                nxt = text[m.end():m.end() + 1]
                if nxt and nxt not in ' のはをがと、。　）':
                    return m.group(0)
                return MARKS[mapping[MARKS.index(m.group(0))]]
            return re.sub(r'[①②③④]', sub, text)
        out.append({**it,
          'choices': [it['choices'][o] for o in order],
          'answer': MARKS[tgt],
          'commentary': [remap(c) for c in it['commentary']],
          'steps': it['steps'],  # 手順の①〜④は「手順番号」なので付け替えない
        })
    return out

def load():
    sets = json.loads(RAW.read_text())
    flat = []
    for s in sets:
        for it in s['items']:
            flat.append({**it, 'unit': s['meta']['unitTitle'], 'chapterId': s['meta']['chapterId'], 'meta': s['meta']})
    assert len(flat) == 100, len(flat)
    for i, it in enumerate(flat):
        assert it['answer'] in MARKS and len(it['choices']) == 4 and it['commentary'], i
    return sets, balanced(flat)

# ---------- ページの飾り ----------
def on_page(c, doc):
    c.saveState()
    w, h = A4
    if doc.page > 1:
        c.setFillColor(GOLD); c.rect(0, h - 6 * mm, w, 6 * mm, stroke=0, fill=1)
        c.setFont(FB, 7.5); c.setFillColor(colors.white)
        c.drawString(14 * mm, h - 4.2 * mm, '★ 大当たり UR 学習プリント ★   英文法 全20単元 総合100題')
    c.setFont(F, 7.5); c.setFillColor(SUB)
    c.drawString(14 * mm, 8 * mm, 'マナトビ 学習プリント ／ 英文法（アプリの英文法 全20単元と同じ問題・同じ解説）')
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

def build():
    sets, items = load()
    units = []
    for i, it in enumerate(items):
        if not units or units[-1]['title'] != it['unit']:
            units.append({'title': it['unit'], 'meta': it['meta'], 'start': i})
    story = []

    # ===== 表紙 =====
    story += [Spacer(1, 22 * mm),
              Paragraph('GRAMMAR 100 ／ UR PRINT', S('e', font=FB, fontSize=9, color=colors.HexColor('#ffd36b'))),
              Spacer(1, 3 * mm),
              Paragraph('英文法 全20単元<br/>総合100題', st['h1']), Spacer(1, 4 * mm),
              Paragraph('文型から会話表現まで。アプリの英文法と同じ100問を、<br/>1問ずつ「なぜその答えで、なぜ他は違うか」まで解説。', st['cover_sub']),
              Spacer(1, 40 * mm)]
    stats = Table([[Paragraph('<b>100問</b><br/><font size="8" color="#6b5d45">4択・全問解説</font>', st['body']),
                    Paragraph('<b>全20単元</b><br/><font size="8" color="#6b5d45">文法・語法・表現</font>', st['body']),
                    Paragraph('<b>約100分</b><br/><font size="8" color="#6b5d45">1単元 5分×20</font>', st['body']),
                    Paragraph('<b>正解は①〜④に均等</b><br/><font size="8" color="#6b5d45">勘では取れない</font>', st['body'])]],
                  colWidths=[45.5 * mm] * 4)
    stats.setStyle(TableStyle([('BOX', (0, 0), (-1, -1), 0.8, LINE), ('INNERGRID', (0, 0), (-1, -1), 0.5, LINE),
                               ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7), ('LEFTPADDING', (0, 0), (-1, -1), 8)]))
    story += [stats, Spacer(1, 6 * mm)]
    story.append(box([Paragraph('<b>このプリントの使い方</b>', S('b', font=FB, fontSize=10.5, color=GOLD)), Spacer(1, 2),
        Paragraph('① 1単元（5問）ずつ、<b>1問1分</b>を目安に解く。答えは最後の「解答用紙」に。', st['body']),
        Paragraph('② すぐに解答・解説を読む。<b>×だった問題は「誤答肢がなぜ違うか」まで</b>読んで、自分の言葉で1行メモ。', st['body']),
        Paragraph('③ 最後の「単元別自己採点表」で、正答率7割未満の単元に★。★の単元から、アプリの英文法で同じ単元をもう一度。', st['body']),
        Paragraph('④ 3日後に×の問題だけ解き直す。2回連続で○になったら卒業。', st['body'])]))
    story.append(Spacer(1, 5 * mm))
    toc = [[Paragraph('<b>収録単元</b>', st['small']), '', '']]
    for k in range(0, 20, 2):
        row = []
        for u in units[k:k + 2]:
            row.append(Paragraph(f'{esc(u["title"])}　<font color="#6b5d45">問{u["start"] + 1}〜{u["start"] + 5}</font>', st['small']))
        toc.append(row + [''] * (3 - len(row)))
    tt = Table([r[:2] for r in toc], colWidths=[91 * mm, 91 * mm])
    tt.setStyle(TableStyle([('LINEBELOW', (0, 0), (-1, -1), 0.3, LINE), ('TOPPADDING', (0, 0), (-1, -1), 2), ('BOTTOMPADDING', (0, 0), (-1, -1), 2)]))
    story += [tt, PageBreak()]

    # ===== 問題 =====
    story.append(Paragraph('演習問題（全100問）', st['h2']))
    story.append(Paragraph('空所に入れるのに最も適切なものを、①〜④のうちから1つずつ選びなさい。答えは巻末の解答用紙へ。', st['small']))
    story.append(Spacer(1, 3 * mm))
    for u in units:
        block = [CondPageBreak(60 * mm), unit_bar(u['title']), Spacer(1, 1.5 * mm),
                 Paragraph('ねらい：' + esc(u['meta']['category']), st['small']), Spacer(1, 2 * mm)]
        story += block
        for i in range(u['start'], u['start'] + 5):
            it = items[i]
            ch = Table([[Paragraph(f'① {esc(it["choices"][0])}', st['ch']), Paragraph(f'② {esc(it["choices"][1])}', st['ch'])],
                        [Paragraph(f'③ {esc(it["choices"][2])}', st['ch']), Paragraph(f'④ {esc(it["choices"][3])}', st['ch'])]],
                       colWidths=[80 * mm, 80 * mm])
            ch.setStyle(TableStyle([('LEFTPADDING', (0, 0), (-1, -1), 0), ('TOPPADDING', (0, 0), (-1, -1), 1), ('BOTTOMPADDING', (0, 0), (-1, -1), 1)]))
            q = Table([[Paragraph(str(i + 1), st['qn']), [Paragraph(blank(it['sentence']), st['q']), Spacer(1, 1.5), ch],
                        Paragraph('<font color="#c9b893">□</font>', S('x', fontSize=16, leading=18))]],
                      colWidths=[10 * mm, 162 * mm, 10 * mm])
            q.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 0),
                                   ('LINEBELOW', (0, 0), (-1, -1), 0.3, LINE), ('BOTTOMPADDING', (0, 0), (-1, -1), 5), ('TOPPADDING', (0, 0), (-1, -1), 4)]))
            story.append(KeepTogether(q))
        story.append(Spacer(1, 3 * mm))
    story.append(PageBreak())

    # ===== 解答用紙 =====
    story.append(Paragraph('解答用紙', st['h2']))
    story.append(Paragraph('番号に○をつける。採点は ○／× の欄へ。', st['small']))
    story.append(Spacer(1, 2 * mm))
    rows = [['問', '解答', '○×'] * 4]
    for r in range(25):
        row = []
        for c4 in range(4):
            n = c4 * 25 + r + 1
            row += [str(n), '①　②　③　④', '']
        rows.append(row)
    sheet = Table(rows, colWidths=[9 * mm, 27 * mm, 9.5 * mm] * 4, rowHeights=[6 * mm] + [8.6 * mm] * 25)
    sheet.setStyle(TableStyle([('FONT', (0, 0), (-1, -1), F, 9), ('FONT', (0, 0), (-1, 0), FB, 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.4, LINE), ('BACKGROUND', (0, 0), (-1, 0), GOLD_SOFT),
        *[('LINEAFTER', (k * 3 + 2, 0), (k * 3 + 2, -1), 1.2, GOLD) for k in range(3)],
        *[('BACKGROUND', (0, r), (-1, r), colors.HexColor('#fffdf6')) for r in range(2, 26, 2)]]))
    story += [sheet, PageBreak()]

    # ===== 解答・解説 =====
    story.append(Paragraph('解答・解説', st['h2']))
    story.append(Paragraph('各問：正解 → 完成文と和訳 → 決め手の語句 → 解き方の手順 → 誤答肢がなぜ違うか。選択肢の番号は、このプリントの並びに合わせてあります。', st['small']))
    story.append(Spacer(1, 2 * mm))
    for u in units:
        story += [CondPageBreak(50 * mm), unit_bar(u['title']), Spacer(1, 2 * mm)]
        for i in range(u['start'], u['start'] + 5):
            it = items[i]
            k = MARKS.index(it['answer'])
            parts = [Paragraph(f'<font color="#c98512"><b>{i + 1}</b></font>　<b>正解 {it["answer"]} {esc(it["choices"][k])}</b>'
                               f'　<font size="8" color="#6b5d45">［{esc(it["type"])}・難易度{"★" * int(it["difficulty"])}・想定正答率{it["rate"]}%］</font>', st['ans']),
                     Paragraph(f'<b>{esc(it["full"])}</b>', st['ex']),
                     Paragraph(f'訳：{esc(it["translation"])}', st['exs'])]
            if it.get('keyPhrases'):
                kp = ' ／ '.join(f'<b>{esc(p["phrase"])}</b>：{esc(p["meaning"])}' for p in it['keyPhrases'])
                parts.append(Paragraph('<font color="#c98512"><b>決め手</b></font>　' + kp, st['ex']))
            parts.append(Paragraph('<font color="#2458a6"><b>解き方</b></font>　' + '　'.join(esc(s) for s in it['steps']), st['ex']))
            for line in it['commentary']:
                parts.append(Paragraph('・' + esc(line), st['ex']))
            parts.append(Paragraph('<font color="#c98512"><b>ポイント</b></font>　' + esc(it['theme']), st['exs']))
            t = Table([[parts]], colWidths=[182 * mm])
            t.setStyle(TableStyle([('LINEBEFORE', (0, 0), (0, -1), 2.2, GOLD), ('LEFTPADDING', (0, 0), (-1, -1), 7),
                                   ('BOTTOMPADDING', (0, 0), (-1, -1), 6), ('TOPPADDING', (0, 0), (-1, -1), 3)]))
            story += [t, Spacer(1, 2.2 * mm)]
        summ = u['meta'].get('summary') or []
        if summ:
            story.append(box([Paragraph(f'<b>{esc(u["title"])}　まとめ</b>', S('b2', font=FB, fontSize=9.5, color=GOLD))] +
                             [Paragraph('・' + esc(s), st['ex']) for s in summ], pad=6))
            story.append(Spacer(1, 3 * mm))
    story.append(PageBreak())

    # ===== 単元別 自己採点表 =====
    story.append(Paragraph('単元別 自己採点表', st['h2']))
    story.append(Paragraph('各単元の正解数（5問中）を書き、3問以下の単元に★。★の単元は、アプリ「英文法」の同じ単元で解説を読み直してからもう一度。', st['small']))
    story.append(Spacer(1, 2 * mm))
    rows = [['単元', '問題', '正解数', '★', '3日後']]
    for u in units:
        rows.append([Paragraph(esc(u['title']), st['body']), f'{u["start"] + 1}〜{u["start"] + 5}', '　／5', '', '　／5'])
    rows.append([Paragraph('<b>合計</b>', st['body']), '', '　／100', '', '　／100'])
    tbl = Table(rows, colWidths=[100 * mm, 22 * mm, 22 * mm, 14 * mm, 24 * mm])
    tbl.setStyle(TableStyle([('FONT', (0, 0), (-1, -1), F, 9), ('FONT', (0, 0), (-1, 0), FB, 8.5),
        ('GRID', (0, 0), (-1, -1), 0.4, LINE), ('BACKGROUND', (0, 0), (-1, 0), GOLD_SOFT),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#fffdf6'))]))
    story.append(tbl)
    story.append(Spacer(1, 5 * mm))
    story.append(box([Paragraph('<b>正解の位置について</b>', S('b3', font=FB, fontSize=9.5, color=GOLD)),
        Paragraph('このプリントは正解が①〜④にそれぞれ25問ずつになるよう並べています。「迷ったら②」のような勘では点が取れません。'
                  '選択肢の並びはアプリと違うことがありますが、問題文・選択肢の中身・解説はアプリの英文法と同じです。', st['ex'])]))

    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=14 * mm, rightMargin=14 * mm, topMargin=12 * mm, bottomMargin=14 * mm,
                          title='英文法 全20単元 総合100題（UR学習プリント）', author='マナトビ')
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='f')
    doc.addPageTemplates([PageTemplate(id='cover', frames=[frame], onPage=cover), PageTemplate(id='body', frames=[frame], onPage=on_page)])
    from reportlab.platypus.doctemplate import NextPageTemplate
    story.insert(0, NextPageTemplate('body'))
    doc.build(story)
    dist = {m: sum(1 for it in items if it['answer'] == m) for m in MARKS}
    print('wrote', OUT, 'answers', dist)
    # サムネイル（ガチャ・コレクション画面で使う 360×510 の webp）
    import subprocess, tempfile
    from PIL import Image
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(['pdftoppm', '-r', '72', '-f', '1', '-l', '1', '-png', str(OUT), f'{d}/p'], check=True, capture_output=True)
        png = next(Path(d).glob('p*.png'))
        im = Image.open(png).convert('RGB'); im = im.resize((360, int(360 * im.height / im.width)))
        im.crop((0, 0, 360, 510)).save(THUMB, 'WEBP', quality=82)
    print('thumb', THUMB)
    return items

if __name__ == '__main__':
    build()
