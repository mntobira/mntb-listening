#!/usr/bin/env python3
"""
UR（大当たり）「共通テスト 英語リーディング 大問別演習 完全版」を作る（2026-10-24）。

  形式は 2025・2026年度の本試験（新課程）：全8大問・44マーク・100点・80分。英文・設問はすべてオリジナル。
  中身：表紙 → 使い方・新形式の全体像 → 大問ごとに「特徴と解き方 → 問題 → 解答・解説 → 重要語句」→ 解答用紙・得点記録表
  使い方: python3 scripts/gacha-prints/build-reading-mock.py
"""
import re, sys
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
                                PageBreak, CondPageBreak, KeepTogether)
from reportlab.platypus.doctemplate import NextPageTemplate

sys.path.insert(0, str(Path(__file__).parent))
from book_common import (ROOT, MARKS, F, FB, st, esc, on_page, bar, box, cover_stats, grid, make_thumb, page_count,
                         GOLD, GOLD_SOFT, LINE, GREEN, BLUE, PAPER, MINT, SKY)
from reading_mock_a import SET_A
from reading_mock_b1 import SET_B1
from reading_mock_b2 import SET_B2
SET_B = SET_B1 + SET_B2
from reading_guide import GUIDE, REAL_FORMAT

FOOTER = 'マナトビ ／ 英文・設問はオリジナル（実在の試験・教材の文章は使っていません）'

def passage_flow(items):
    out = []
    for kind, v in items:
        if kind == 'h':
            out += [Paragraph(f'<b>{esc(v)}</b>', st['enh']), Spacer(1, 2)]
        elif kind == 'p':
            out += [Paragraph(esc(v), st['en']), Spacer(1, 3)]
        elif kind == 'note':
            out += [box([Paragraph(esc(v), st['enc'])], bg=SKY, border=BLUE, pad=5, width=178 * mm), Spacer(1, 3)]
        elif kind == 'msg':
            who, text = v
            t = Table([[Paragraph(f'<font color="#2458a6">{esc(who)}</font>', st['encell']), Paragraph(esc(text), st['enc'])]], colWidths=[38 * mm, 140 * mm])
            t.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LINEBELOW', (0, 0), (-1, -1), 0.3, LINE),
                                   ('TOPPADDING', (0, 0), (-1, -1), 2.5), ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5), ('LEFTPADDING', (0, 0), (-1, -1), 2)]))
            out.append(t)
        elif kind == 'table':
            n = len(v[0])
            t = Table([[Paragraph(esc(c), st['encell']) for c in r] for r in v], colWidths=[178 * mm / n] * n, repeatRows=1)
            t.setStyle(TableStyle([('GRID', (0, 0), (-1, -1), 0.4, LINE), ('BACKGROUND', (0, 0), (-1, 0), GOLD_SOFT),
                                   ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('TOPPADDING', (0, 0), (-1, -1), 2.5), ('BOTTOMPADDING', (0, 0), (-1, -1), 3)]))
            out += [t, Spacer(1, 4)]
    frame = Table([[out]], colWidths=[182 * mm])
    frame.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), PAPER), ('BOX', (0, 0), (-1, -1), 0.6, LINE),
                               ('LEFTPADDING', (0, 0), (-1, -1), 2), ('RIGHTPADDING', (0, 0), (-1, -1), 2), ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6)]))
    return frame

def mark_count(q):
    a = q['answer']
    return 4 if '→' in a else 2 if ('・' in a or '(A)' in a) else 1

def question_flow(q, label):
    ch = q['choices']
    if len(ch) == 4 and max(len(c) for c in ch) <= 14:
        rows, widths = [[Paragraph(f'{MARKS[k]} {esc(c)}', st['enc']) for k, c in enumerate(ch)]], [39 * mm] * 4
    else:
        rows, widths = [[Paragraph(f'{MARKS[k]} {esc(c)}', st['enc'])] for k, c in enumerate(ch)], [156 * mm]
    opt = Table(rows, colWidths=widths)
    opt.setStyle(TableStyle([('LEFTPADDING', (0, 0), (-1, -1), 0), ('TOPPADDING', (0, 0), (-1, -1), 1), ('BOTTOMPADDING', (0, 0), (-1, -1), 1)]))
    t = Table([[Paragraph(f'<font color="#b8860b"><b>問{q["no"]}</b></font>', st['body']), [Paragraph(esc(q['stem']), st['enq']), Spacer(1, 2), opt],
                Paragraph(f'<font size="7.5" color="#6b5d45">マーク<br/>{label}</font>', st['small'])]], colWidths=[12 * mm, 156 * mm, 14 * mm])
    t.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 0), ('LINEBELOW', (0, 0), (-1, -1), 0.3, LINE),
                           ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 5)]))
    return KeepTogether(t)

def explain_flow(q):
    parts = [Paragraph(f'<font color="#b8860b"><b>問{q["no"]}</b></font>　<b>正解 {esc(q["answer"])}</b>　<font size="8" color="#6b5d45">（{q["points"]}点）</font>', st['ans'])]
    parts += [Paragraph(f'<font color="#2458a6"><b>{esc(h)}</b></font>　' + esc(tx), st['ex']) for h, tx in q['explain']]
    t = Table([[parts]], colWidths=[182 * mm])
    t.setStyle(TableStyle([('LINEBEFORE', (0, 0), (0, -1), 2.2, GOLD), ('LEFTPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 6), ('TOPPADDING', (0, 0), (-1, -1), 3)]))
    return KeepTogether(t)

def words_of(sets):
    txt = []
    for s in sets:
        for d in s:
            for k, v in d['passage']:
                txt.append(' '.join(v) if isinstance(v, tuple) else ' '.join(' '.join(r) for r in v) if k == 'table' else v)
            for q in d['questions']: txt += [q['stem']] + q['choices']
    return len(re.findall(r"[A-Za-z']+", ' '.join(txt)))

def build(sets, pid, title, subtitle, no=1):
    flat = title.replace('\n', ' ')
    nq = sum(len(d['questions']) for s in sets for d in s)
    story = [NextPageTemplate('body'), Spacer(1, 30 * mm), Paragraph('KYOTSU TEST ENGLISH READING ／ COMPLETE EDITION', st['eyebrow']), Spacer(1, 4 * mm),
             Paragraph(esc(title).replace('\n', '<br/>'), st['h1']), Spacer(1, 6 * mm), Paragraph(esc(subtitle), st['h1s']), Spacer(1, 22 * mm),
             cover_stats([('全8大問', '新形式（2025〜）'), (f'{len(sets) * 44}マーク', '本番と同じ数'), (f'{nq}問', '全問に根拠つき解説'),
                          (f'約{words_of(sets):,}語', '英文はオリジナル'), ('80分', '本番と同じ時間')]),
             Spacer(1, 14 * mm), Paragraph('大問ごとの「解き方」を読んでから解き、解説で根拠の一文を確かめる。最後に80分通しで本番の練習。この1冊で共通テストのリーディングを仕上げる。', st['h1s']), PageBreak()]
    story += [Paragraph('この本の使い方', st['h2']),
              box([Paragraph('<b>① 大問別に（1日1大問・約20分）</b>　「特徴と解き方」を読む → 目標時間で解く → 解説で根拠の一文に線を引く → 重要語句を覚える。', st['body']),
                   Paragraph('<b>② 通しで（80分）</b>　第1問から順に解き、巻末の解答用紙に書く。時間が足りなかった大問の「解き方」を読み直す。', st['body']),
                   Paragraph('<b>③ 復習</b>　得点記録表に大問別の点を書き、7割未満の大問を3日後にもう一度。', st['body'])]),
              Spacer(1, 4 * mm), Paragraph('新形式の全体像（2025・2026年度の本試験：全8大問・44マーク・100点・80分）', st['h2'])]
    rows = [['大問', '本試験の素材（2025／2026）', 'マーク', '配点', '目標', 'この本の素材']]
    rows += [[f'第{d["q"]}問', REAL_FORMAT[d['q']], str(d['marks']), str(d['points']), f'{d["minutes"]}分', d['title']] for d in sets[0]]
    rows.append(['合計', '', '44', '100', '80分', ''])
    story += [grid(rows, [14 * mm, 52 * mm, 13 * mm, 12 * mm, 14 * mm, 77 * mm]), Spacer(1, 3 * mm),
              Paragraph('総語数は約5,600語（2025・2026年度）＝1分に約70語のペース。旧形式（2021〜2024年度）は第1問〜第6問（A・B）でしたが、2025年度から8大問になり、'
                        '第4問（推敲）と第8問（レポート作成）の「書く力を読解で問う」問題が加わりました。', st['small']), PageBreak()]

    mark, sheet = 1, []
    for si, s in enumerate(sets):
        for d in s:
            g = GUIDE[d['q']]
            story += [bar(f'第{d["q"]}問　{d["title"]}', f'第{no + si}回 ／ {d["marks"]}マーク・{d["points"]}点・目標{d["minutes"]}分'), Spacer(1, 3 * mm),
                      box([Paragraph(f'<b>特徴と解き方：{esc(g[0])}</b>', st['h3'])] + [Paragraph('・' + esc(x), st['body']) for x in g[1]]), Spacer(1, 3 * mm),
                      Paragraph(esc(d['intro']), st['enq']), Spacer(1, 2 * mm), passage_flow(d['passage']), Spacer(1, 3 * mm)]
            for q in d['questions']:
                n = mark_count(q); label = str(mark) if n == 1 else f'{mark}〜{mark + n - 1}'
                story.append(question_flow(q, label)); sheet.append((d['q'], q['no'], label, q['answer'], q['points'])); mark += n
            story += [PageBreak(), bar(f'第{d["q"]}問　解答・解説', f'{d["points"]}点満点'), Spacer(1, 3 * mm)]
            for q in d['questions']: story += [explain_flow(q), Spacer(1, 2 * mm)]
            vt = Table([[Paragraph(esc(a), st['encell']), Paragraph(esc(b), st['cell'])] for a, b in d['vocab']], colWidths=[60 * mm, 112 * mm])
            vt.setStyle(TableStyle([('LINEBELOW', (0, 0), (-1, -1), 0.3, LINE), ('TOPPADDING', (0, 0), (-1, -1), 2), ('BOTTOMPADDING', (0, 0), (-1, -1), 2)]))
            story += [CondPageBreak(40 * mm), box([Paragraph('<b>重要語句</b>', st['h3']), vt], bg=MINT, border=GREEN), PageBreak()]
    assert mark - 1 == 44 * len(sets), mark - 1

    story += [bar('解答用紙（80分通し）・丸つけ表', '「正解」の列は解く前に紙で隠す'), Spacer(1, 3 * mm)]
    rows = [['大問', '問', 'マーク', 'あなたの解答', '正解', '配点', '得点']]
    rows += [[f'第{a}問', f'問{b}', c, '', Paragraph(f'<font color="#2f7a52">{esc(d)}</font>', st['cell']), str(e), ''] for a, b, c, d, e in sheet]
    story += [grid(rows, [16 * mm, 12 * mm, 16 * mm, 40 * mm, 62 * mm, 14 * mm, 22 * mm]), Spacer(1, 4 * mm), Paragraph('得点記録表（大問別）', st['h2'])]
    rows = [['', *[f'第{k}問' for k in range(1, 9)], '合計'], ['満点', *[str(d['points']) for d in sets[0]], '100']] + [[k] + [''] * 9 for k in ('1回目', '2回目', '3回目')]
    t = Table(rows, colWidths=[18 * mm] + [17.5 * mm] * 8 + [24 * mm])
    t.setStyle(TableStyle([('FONT', (0, 0), (-1, -1), F, 9), ('GRID', (0, 0), (-1, -1), 0.4, LINE), ('BACKGROUND', (0, 0), (-1, 0), GOLD_SOFT),
                           ('ALIGN', (1, 0), (-1, -1), 'CENTER'), ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6)]))
    story += [t, Spacer(1, 3), Paragraph('目安：80点で難関国公立のボーダー付近、70点で標準。時間切れの大問は、その大問の目標時間で解き直す。', st['small'])]

    out = ROOT / f'public/prints/{pid}.pdf'
    doc = BaseDocTemplate(str(out), pagesize=A4, leftMargin=14 * mm, rightMargin=14 * mm, topMargin=12 * mm, bottomMargin=13 * mm,
                          title=f'{flat}（UR 完全版）', author='マナトビ')
    fr = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='f')
    doc.addPageTemplates([PageTemplate(id='cover', frames=[fr], onPage=on_page(flat, FOOTER)), PageTemplate(id='body', frames=[fr], onPage=on_page(flat, FOOTER))])
    doc.build(story)
    make_thumb(out, pid)
    return out

BOOKS = [
    ([SET_A], 'print_book_reading_mock1', '共通テスト 英語リーディング\n大問別演習 完全版 第1回', 1),
    ([SET_B], 'print_book_reading_mock2', '共通テスト 英語リーディング\n大問別演習 完全版 第2回', 2),
]

if __name__ == '__main__':
    want = set(sys.argv[1:])
    for sets, pid, title, no in BOOKS:
        if want and pid not in want: continue
        out = build(sets, pid, title, '新形式（全8大問・44マーク・100点・80分）に準拠。大問ごとの解き方 → 問題 → 根拠つき解説で、この1冊で仕上げる。', no)
        print(out.name, page_count(out), 'pages', out.stat().st_size // 1024, 'KB')
