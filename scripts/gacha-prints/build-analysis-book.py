#!/usr/bin/env python3
"""
UR（大当たり）「共通テスト 全科目 出題分析 完全版」を作る（2026-10-24）。

  ご要望：「共通テストの分析（何が出るか）を全科目で。過去数十年を調べて。時間をかけてOK」
  中身：表紙 → 全体像（志願者・6教科平均・約50年の歴史・全科目共通の傾向）→ 平均点一覧（2026・2025）
        → 科目ごとに「構成と配点・形式の移り変わり・よく出ること・失点パターン・時期別の対策・アプリで練習できる所」
        → 出典
  使い方: python3 scripts/gacha-prints/build-analysis-book.py
"""
import sys
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak, CondPageBreak, KeepTogether
from reportlab.platypus.doctemplate import NextPageTemplate

sys.path.insert(0, str(Path(__file__).parent))
from book_common import ROOT, st, esc, on_page, bar, box, cover_stats, grid, make_thumb, page_count, GOLD_SOFT, MINT, SKY, GREEN, BLUE, colors
from analysis_data import OVERVIEW, HISTORY, COMMON
from analysis_subjects1 import SUBJECTS_1
from analysis_subjects2 import SUBJECTS_2

PID = 'print_book_analysis_all'
TITLE = '共通テスト 全科目\n出題分析 完全版'
FOOTER = 'マナトビ ／ 平均点は大学入試センター「実施結果の概要」（2026-02-05 最終集計）。分析は公開資料をもとにマナトビが作成'
SUBJECTS = SUBJECTS_1 + SUBJECTS_2
RED = colors.HexColor('#b3261e')

def bullets(items, style='body'):
    return [Paragraph('・' + esc(x), st[style]) for x in items]

def diff(a, b):
    if a is None or b is None: return '—'
    d = a - b
    return f'{"+" if d >= 0 else "−"}{abs(d):.2f}'

def subject_pages(s):
    head = f'{s["time"]}・{s["points"]}点'
    out = [bar(s['name'], head), Spacer(1, 3 * mm)]
    if s['avg2026'] is not None:
        rate = s['avg2026'] / s['points'] * 100
        out += [cover_like([(f'{s["avg2026"]:.2f}点', '2026年度 平均点'), (f'{rate:.1f}%', '平均得点率'),
                            (diff(s['avg2026'], s['avg2025']), '前年度との差'), (s['takers'], '受験者数')]), Spacer(1, 3 * mm)]
    else:
        out += [Paragraph('受験者数：' + esc(s['takers']), st['small']), Spacer(1, 2 * mm)]
    out += [Paragraph('出題の構成と配点（2025・2026年度の本試験）', st['h3'])]
    rows = [['大問', '内容', '配点']] + [[a, b, str(c)] for a, b, c in s['structure']]
    out += [grid(rows, [22 * mm, 140 * mm, 20 * mm]), Spacer(1, 3 * mm), Paragraph('形式の移り変わり', st['h3'])]
    out += [grid([['時期', '変化']] + [[a, b] for a, b in s['history']], [45 * mm, 137 * mm]), Spacer(1, 3 * mm)]
    out += [KeepTogether([box([Paragraph('<b>よく出ること・ねらわれる力</b>', st['h3'])] + bullets(s['trend']), bg=SKY, border=BLUE)]), Spacer(1, 2 * mm)]
    out += [KeepTogether([box([Paragraph('<b>失点パターン</b>', S_red())] + bullets(s['traps']), bg=colors.HexColor('#fdf0ef'), border=RED)]), Spacer(1, 2 * mm)]
    out += [Paragraph('時期別の対策', st['h3']), grid([['時期', 'やること']] + [[a, b] for a, b in s['plan']], [32 * mm, 150 * mm]), Spacer(1, 2 * mm),
            box([Paragraph(esc(s['app']), st['body'])], bg=MINT, border=GREEN, pad=5), PageBreak()]
    return out

def S_red():
    from book_common import S
    return S('red', font='JPB', fontSize=10.8, leading=15, color=RED)

def cover_like(stats):
    from reportlab.platypus import Table, TableStyle
    cells = [Paragraph(f'<font size="13" color="#14213d"><b>{esc(a)}</b></font><br/><font size="7.8" color="#6b5d45">{esc(b)}</font>', st['body']) for a, b in stats]
    t = Table([cells], colWidths=[40 * mm, 34 * mm, 34 * mm, 74 * mm])
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), GOLD_SOFT), ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor('#b8860b')),
                           ('INNERGRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#e2d3b5')), ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6)]))
    return t

def build():
    flat = TITLE.replace('\n', ' ')
    story = [NextPageTemplate('body'), Spacer(1, 30 * mm), Paragraph('KYOTSU TEST ANALYSIS ／ COMPLETE EDITION', st['eyebrow']), Spacer(1, 4 * mm),
             Paragraph(esc(TITLE).replace('\n', '<br/>'), st['h1']), Spacer(1, 6 * mm),
             Paragraph('共通一次（1979）・センター試験（1990〜2020）・共通テスト（2021〜）の約50年の流れと、2025・2026年度の新課程の本試験をもとに、'
                       '全科目の「何が出るか・どこで落とすか・いつ何をするか」を1冊にまとめました。', st['h1s']), Spacer(1, 18 * mm),
             cover_stats([(f'{len(SUBJECTS)}科目群', '英・国・数・情・理・地歴・公民'), ('2026年度', '最新の平均点（確定値）'), ('約50年', '共通一次からの流れ'), ('時期別', '高2〜直前の対策表')]),
             PageBreak()]
    story += [bar('共通テストの全体像', '2026年度'), Spacer(1, 3 * mm),
              grid([['項目', '内容']] + [[k, v] for k, v in [('志願者数', OVERVIEW['applicants']), ('受験者数', OVERVIEW['takers']), ('6教科の平均', OVERVIEW['avg6']),
                                                              ('次の試験', OVERVIEW['dates']), ('新課程', OVERVIEW['new'])]], [35 * mm, 147 * mm]),
              Spacer(1, 4 * mm), Paragraph('約50年の流れ', st['h3']), grid([['時期', '試験と特徴']] + [list(h) for h in HISTORY], [30 * mm, 152 * mm]),
              Spacer(1, 4 * mm), box([Paragraph('<b>全科目に共通する出題の特徴</b>', st['h3'])] + bullets(COMMON)), PageBreak()]
    rows = [['科目', '配点', '2026 平均', '2025 平均', '差', '得点率']]
    for s in SUBJECTS:
        if s['avg2026'] is None: continue
        rows.append([s['name'], str(s['points']), f'{s["avg2026"]:.2f}', f'{s["avg2025"]:.2f}', diff(s['avg2026'], s['avg2025']), f'{s["avg2026"] / s["points"] * 100:.1f}%'])
    for name, a, b in [('物理基礎', 34.68, 24.78), ('化学基礎', 28.58, 27.00), ('生物基礎', 36.46, 31.39), ('地学基礎', 28.17, 34.49)]:
        rows.append([name, '50', f'{a:.2f}', f'{b:.2f}', diff(a, b), f'{a / 50 * 100:.1f}%'])
    story += [bar('科目別 平均点一覧', '大学入試センター 最終集計'), Spacer(1, 3 * mm), grid(rows, [70 * mm, 16 * mm, 24 * mm, 24 * mm, 22 * mm, 26 * mm]), Spacer(1, 3 * mm),
              Paragraph('2026年度は国語（−10.30）・情報Ⅰ（−12.67）・物理（−13.41）・数学Ⅰ、A（−6.31）・リスニング（−6.66）が大きく下がり、化学（+11.52）・物理基礎（+9.90）・リーディング（+5.12）が上がった。'
                        '平均点は年ごとに±10点以上動くことがあるので、「その年の難易度」より「自分の得点率」で目標を立てる。', st['small']), PageBreak()]
    for s in SUBJECTS: story += subject_pages(s)
    story += [bar('出典', '数値はすべて公開資料から'),
              Spacer(1, 3 * mm)] + bullets(['大学入試センター「令和8年度 大学入学共通テスト 実施結果の概要」（2026年2月5日）', '東進「2026年大学入学共通テスト平均点」「英語リーディング 全体概観」',
                                            '駿台「2026年度入試状況分析【大学入学共通テスト】」（2026年2月9日）', '河合塾「2026年度 大学入学共通テスト速報 英語（リーディング）」',
                                            '教学社「2027年度の大学入学共通テストがわかる！」（2026年3月20日時点）',
                                            '大問構成は年度で多少変わる。科目ごとの「よく出ること」は各予備校の公開分析をマナトビがまとめたもの。'], 'small')
    out = ROOT / f'public/prints/{PID}.pdf'
    doc = BaseDocTemplate(str(out), pagesize=A4, leftMargin=14 * mm, rightMargin=14 * mm, topMargin=12 * mm, bottomMargin=13 * mm, title=f'{flat}（UR 完全版）', author='マナトビ')
    fr = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='f')
    doc.addPageTemplates([PageTemplate(id='cover', frames=[fr], onPage=on_page(flat, FOOTER)), PageTemplate(id='body', frames=[fr], onPage=on_page(flat, FOOTER))])
    doc.build(story)
    make_thumb(out, PID)
    return out

if __name__ == '__main__':
    out = build()
    print(out.name, page_count(out), 'pages', out.stat().st_size // 1024, 'KB')
