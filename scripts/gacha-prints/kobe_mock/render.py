# -*- coding: utf-8 -*-
"""予想問題PDF（問題／解答・解説）を作る。WeasyPrint（フォントはサブセット埋め込み）。
紙面：神戸大学の問題冊子の型（大問番号・配点・注・下線(1)・波線(a)・空所( A )・「— n —」）に、
マナトビのデザイントークン（brand #2458a6 / accent #f29a1f / paper #fcf5e9 / ink #1c2a39 / M PLUS Rounded 1c）を当てる。
"""
import sys, re, html, importlib
from pathlib import Path
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration
FC = FontConfiguration()
HERE = Path(__file__).parent
import os
# M PLUS Rounded 1c（Google Fonts・OFL）の Bold / ExtraBold の ttf を置いたフォルダ（git には入れない）
FONT_DIR = Path(os.environ.get('KOBE_FONT_DIR', str(HERE.parents[2] / '.tmpwork/fonts')))
OUT_DIR = Path(os.environ.get('KOBE_OUT_DIR', str(HERE.parents[2] / '.tmpwork/kobe_mock')))
sys.path.insert(0, str(HERE))
K = 'あいうえおか'
DISCLAIMER = '神戸大学の過去問・公式問題ではありません。予想問題であり，大学とは関係がありません。'

def e(s): return html.escape(str(s), quote=False)

def em(s):
    """解説文の強調：英文引用“…”は波線，「…」は下線，選択肢記号・○×・空所記号・判定語は太字。"""
    t = e(s)
    t = re.sub(r'“([^”]+)”', r'“<span class="x-wv">\1</span>”', t)
    t = re.sub(r'「([^」<>]{1,60})」', r'「<span class="x-ul">\1</span>」', t)
    t = re.sub(r'(?<![A-Za-z])\((あ|い|う|え|お|か)\)', r'<span class="x-b">(\1)</span>', t)
    t = re.sub(r'\(\s*([A-E])\s*\)', r'<span class="x-b">( \1 )</span>', t)
    t = re.sub(r'^○', '<span class="x-ok">○</span>', t)
    t = re.sub(r'^×', '<span class="x-ng">×</span>', t)
    t = re.sub(r'（(本文と逆|本文に記述なし|本文にない|言い過ぎ|部分的|範囲のずれ)[^）]*）', lambda m: f'<span class="x-b">{m.group(0)}</span>', t)
    t = re.sub(r'(一意性の確認|不可|誤り|逆)(?![^<]*>)', r'<span class="x-b">\1</span>', t)
    return t

def mark(t):
    """本文の {u1|…}{ua|…}{wa|…} と * を HTML に"""
    t = e(t)
    def rep(m):
        kind, lab, body = m.group(1), m.group(2), m.group(3)
        cls = 'wv' if kind == 'w' else 'ul'
        return f'<span class="lab">({lab})</span><span class="{cls}">{body}</span>'
    t = re.sub(r'\{([uw])([a-z0-9]+)\|([^}]*)\}', rep, t)
    t = re.sub(r'\*', '<sup class="ast">*</sup>', t)
    t = re.sub(r'\(\s*([A-E])\s*\)', r'<span class="blank">(&#8194;\1&#8194;)</span>', t)
    return t

def jmark(t):
    """日本語の設問文：下線部(1)・空所( A )などをそのまま、半角英字は欧文書体に"""
    return e(t)

CSS_TEXT = """
@font-face { font-family: 'MPR'; src: url('file://@FONT_DIR@/MPLUSRounded1c-ExtraBold.ttf'); font-weight: 800; }
@font-face { font-family: 'MPR'; src: url('file://@FONT_DIR@/MPLUSRounded1c-Bold.ttf'); font-weight: 700; }
:root { --brand:#1a1a1a; --brand-strong:#000000; --brand-soft:#ededed; --accent:#7a7a7a; --accent-ink:#000000; --accent-soft:#e6e6e6;
        --paper:#ffffff; --card:#ffffff; --ink:#000000; --ink2:#333333; --ink3:#555555; --line:#cfcfcf; --line-strong:#999999; --done:#000000; --done-soft:#eeeeee; }
@page { size: A4; margin: 17mm 17mm 19mm 17mm;
  @bottom-center { content: "— " counter(page) " —"; font-family: 'Noto Serif', 'Noto Serif CJK JP'; font-size: 9.5pt; color: #1c2a39; }
  @top-right { content: string(run); font-family: 'MPR'; font-weight:700; font-size: 7.5pt; color: #2458a6; } }
@page cover { margin: 0; counter-increment: page 0; @bottom-center { content: none; } @top-left { content: none; } @top-right { content: none; } }
html { font-family: 'Noto Serif CJK JP', serif; color: var(--ink); font-size: 10.2pt; line-height: 1.75; }
.cover { page: cover; height: 297mm; position: relative; background: #fff; overflow: hidden; font-family: 'Noto Serif CJK JP', serif; }
.cover .brand { position: absolute; top: 12mm; left: 18mm; right: 18mm; display: flex; justify-content: space-between; align-items: center; border-bottom: .6pt solid #999; padding-bottom: 2.5mm; }
.cover .brand img { width: 34mm; }
.cover .brand .kicker { font-family: 'MPR'; font-weight: 700; font-size: 7.6pt; letter-spacing: .16em; color: #555; text-align: right; line-height: 1.5; }
.cover .head { position: absolute; top: 46mm; left: 0; right: 0; height: 16mm; }
.cover .head .tag { position: absolute; left: 33mm; top: 3.2mm; font-size: 12pt; letter-spacing: .08em; }
.cover .head h1 { margin: 0; text-align: center; font-family: 'Noto Serif CJK JP'; font-weight: 900; font-size: 27pt; letter-spacing: 1.05em; padding-left: 1.05em; line-height: 1.3; }
.cover .eigo { position: absolute; top: 72mm; left: 0; right: 0; text-align: center; font-size: 15pt; letter-spacing: 1.6em; padding-left: 1.6em; }
.cover .range { position: absolute; top: 87mm; left: 0; right: 0; text-align: center; font-size: 10pt; }
.cover .sub { position: absolute; top: 95mm; left: 0; right: 0; text-align: center; font-family: 'MPR'; font-weight: 700; font-size: 9pt; color: #444; letter-spacing: .06em; }
.cover .chui { position: absolute; top: 121mm; left: 0; right: 0; text-align: center; font-size: 10.5pt; }
.cover .chui b { font-family: 'Noto Sans CJK JP'; font-weight: 700; margin-right: 3mm; }
.cover .haiten { position: absolute; top: 135mm; left: 0; right: 0; text-align: center; font-size: 10.5pt; }
.cover .haiten span { margin-left: 8mm; }
.cover .notice { position: absolute; top: 165mm; left: 30mm; right: 30mm; border: .6pt solid #999; border-radius: 2mm; padding: 3.5mm 6mm; font-size: 8.8pt; line-height: 1.75; }
.cover .notice h3 { margin: 0 0 .8mm; font-family: 'MPR'; font-weight: 800; font-size: 9.6pt; color: #000; }
.cover .notice ol { margin: 0; padding-left: 5mm; }
.cover .disc { position: absolute; top: 226mm; left: 30mm; right: 30mm; background: #ededed; border-left: 1.8mm solid #1a1a1a; padding: 3mm 5mm; font-family: 'Noto Sans CJK JP'; font-size: 9pt; font-weight: 700; color: #000; line-height: 1.7; }
.cover .foot { position: absolute; bottom: 12mm; left: 22mm; right: 22mm; font-family: 'Noto Sans CJK JP'; font-size: 7.6pt; color: var(--ink3); border-top: 1px solid var(--line-strong); padding-top: 2.5mm; display: flex; justify-content: space-between; }
.part { break-before: page; }
.parthead { display: flex; align-items: baseline; gap: 4mm; border-bottom: 1.6px solid var(--brand); padding-bottom: 1.4mm; margin-bottom: 3mm; string-set: run attr(data-run); }
.roman { font-family: 'Noto Serif'; font-weight: 700; font-size: 17pt; color: #fff; background: var(--brand); border-radius: 2mm; padding: 0 3.2mm; line-height: 1.45; }
.parthead .t { font-family: 'MPR'; font-weight: 800; font-size: 10.5pt; color: var(--brand-strong); }
.intro { margin: 0 0 4mm; text-indent: 1em; }
.intro .pt { white-space: nowrap; }
.passage { font-family: 'Noto Serif', 'Noto Serif CJK JP'; font-size: 10.6pt; line-height: 1.95; text-align: justify; hyphens: manual; }
.passage p { margin: 0; text-indent: 2.2em; }
.passage.novel p { margin: 0; }
.passage .first { text-indent: 0; font-style: italic; margin-bottom: 1.5mm; }
.ul { text-decoration: underline; text-decoration-thickness: 0.9pt; text-underline-offset: 2.4pt; }
.wv { text-decoration: underline wavy; text-decoration-thickness: 0.7pt; text-underline-offset: 2.6pt; text-decoration-color: var(--ink); }
.lab { font-size: 7.6pt; vertical-align: -3.2pt; margin-right: .4pt; font-family: 'Noto Serif'; }
.blank { white-space: nowrap; }
sup.ast { font-size: 7pt; vertical-align: 4pt; }
.notes { margin: 3.5mm 0 1mm 0; display: grid; grid-template-columns: 9mm 1fr; font-size: 9.4pt; line-height: 1.6; }
.notes .nh { font-family: 'Noto Serif CJK JP'; }
.notes table { border-collapse: collapse; }
.notes td { padding: 0 6mm 0 0; vertical-align: top; }
.notes td.en { font-family: 'Noto Serif'; white-space: nowrap; padding-right: 3mm; }
.q { margin: 5mm 0 0; break-inside: avoid-page; }
.q .stem { display: grid; grid-template-columns: 11mm 1fr; }
.q .qn { font-family: 'Noto Serif CJK JP'; font-weight: 700; white-space: nowrap; }
.q .qn b { color: var(--brand); }
.items { margin: 1.5mm 0 0 11mm; }
.item { margin: 2mm 0 0; break-inside: avoid; }
.item .w { font-family: 'Noto Serif', 'Noto Serif CJK JP'; }
.item .w .ul, .item .w .wv { font-size: 10.6pt; }
.choices { margin: .6mm 0 0 6mm; font-family: 'Noto Serif', 'Noto Serif CJK JP'; font-size: 10.4pt; line-height: 1.7; }
.choices div { display: grid; grid-template-columns: 8.5mm 1fr; }
.choices.row4 { display: grid; grid-template-columns: repeat(4, 1fr); }
.choices.row4 div { grid-template-columns: 7.5mm 1fr; }
.k { font-family: 'Noto Serif CJK JP'; font-size: 9.4pt; }
table.combo { border-collapse: collapse; margin: 2.5mm 0 0 18mm; font-family: 'Noto Serif'; font-size: 10.4pt; }
table.combo th, table.combo td { border: .8pt solid var(--ink); padding: 1.2mm 7mm; text-align: center; min-width: 26mm; }
table.combo th { font-weight: 400; background: var(--brand-soft); }
table.combo td.k0 { min-width: 9mm; padding: 1.2mm 2mm; font-family: 'Noto Serif CJK JP'; font-size: 9.4pt; }
.end { text-align: right; margin-top: 3mm; font-size: 8.5pt; color: var(--ink3); }
.ivintro { font-family: 'Noto Serif'; font-size: 10.6pt; line-height: 1.8; }
.chart { margin: 4mm auto 2mm; display: block; }
.ivq { font-family: 'Noto Serif'; font-size: 10.6pt; display: grid; grid-template-columns: 9mm 1fr; margin-top: 4mm; line-height: 1.8; }
/* 解答用紙 */
.sheet { break-before: page; }
.sheet h2, .akey h2 { font-family: 'MPR'; font-weight: 800; font-size: 14pt; color: var(--brand-strong); margin: 0 0 3mm; string-set: run content(); }
.sheet .row { display: grid; grid-template-columns: 26mm 1fr; border-bottom: .6pt solid var(--line-strong); min-height: 9mm; align-items: center; font-size: 9.2pt; }
.sheet .row .h { font-family: 'Noto Sans CJK JP'; font-weight: 700; color: var(--ink2); }
.sheet .row.tall { min-height: 24mm; align-items: start; padding-top: 1.5mm; }
.sheet .row.lines { min-height: 30mm; align-items: start; padding-top: 1.5mm;
   background-image: repeating-linear-gradient(to bottom, transparent 0, transparent 7.6mm, #d9cdb6 7.6mm, #d9cdb6 7.9mm); }
.genko { border-collapse: collapse; margin: 1mm 0; }
.genko td { width: 6.8mm; height: 6.8mm; border: .5pt solid #b9a98c; padding: 0; }
.genko td.ten { border-right: 1.2pt solid var(--accent); }
.sheet .sub { font-size: 7.6pt; color: var(--ink3); }
.wl { height: 9.2mm; border-bottom: .5pt solid #c9bba1; position: relative; }
.wl span { position: absolute; right: 0; bottom: .5mm; font-size: 6.5pt; color: #a8977a; font-family: 'Noto Sans CJK JP'; }
/* 解答・解説 */
.akey { font-family: 'Noto Serif CJK JP'; font-size: 9.7pt; line-height: 1.72; }
.akey h3 { font-family: 'MPR'; font-weight: 800; font-size: 11.5pt; color: #fff; background: var(--brand); border-radius: 2mm; padding: 1mm 4mm; margin: 0 0 3mm; border-bottom: 1mm solid var(--accent); }
.akey h4 { font-family: 'MPR'; font-weight: 800; font-size: 10.4pt; color: var(--brand-strong); margin: 5mm 0 1.5mm; border-left: 1.4mm solid var(--accent); padding-left: 2.4mm; }
.abox { border: 1px solid var(--line-strong); border-radius: 2.5mm; background: var(--card); padding: 2.8mm 4mm 3mm; margin: 0 0 3mm; break-inside: avoid; }
.abox .ans { font-family: 'Noto Sans CJK JP'; font-weight: 700; color: var(--done); }
.abox .ans .en { font-family: 'Noto Serif'; font-weight: 700; }
.abox .lbl { display: inline-block; font-family: 'MPR'; font-weight: 700; font-size: 8pt; color: var(--accent-ink); background: var(--accent-soft); border-radius: 99px; padding: 0 2.6mm; margin-right: 1.5mm; }
.abox ul { margin: 1mm 0 0; padding-left: 4.5mm; }
.abox li { margin: .3mm 0; }
.en, .abox .en { font-family: 'Noto Serif', 'Noto Serif CJK JP'; }
table.crit { border-collapse: collapse; width: 100%; margin: 1.5mm 0 1mm; font-size: 8.9pt; }
table.crit th, table.crit td { border: .5pt solid var(--line-strong); padding: .8mm 2mm; vertical-align: top; }
table.crit th { background: var(--accent-soft); font-family: 'Noto Sans CJK JP'; font-weight: 700; font-size: 8.3pt; }
table.crit td.p { width: 13mm; text-align: center; font-family: 'Noto Sans CJK JP'; }
.trs p { text-indent: 1em; margin: 0 0 1.2mm; font-size: 9.3pt; line-height: 1.75; }
table.voc { border-collapse: collapse; width: 100%; font-size: 9pt; }
table.voc td { border-bottom: .5pt solid var(--line); padding: .6mm 2mm; }
table.voc td:first-child { font-family: 'Noto Serif'; width: 48%; }
table.sum { border-collapse: collapse; width: 100%; font-size: 9pt; margin-bottom: 3mm; }
table.sum th, table.sum td { border: .5pt solid var(--line-strong); padding: .9mm 2mm; text-align: left; vertical-align: top; }
table.sum th { background: var(--brand-soft); font-family: 'Noto Sans CJK JP'; font-weight: 700; }
.model { font-family: 'Noto Serif'; font-size: 9.8pt; line-height: 1.7; background: #fff; border: 1px dashed var(--line-strong); border-radius: 2mm; padding: 2mm 3.5mm; margin: 1mm 0 2mm; }
.model .wc { font-family: 'Noto Sans CJK JP'; font-size: 8pt; color: var(--ink3); }
.colophon { break-before: page; }
.colophon .box { margin-top: 60mm; border: 1.5px solid var(--line-strong); border-radius: 4mm; padding: 7mm 9mm; background: var(--card); font-size: 9.4pt; line-height: 1.9; }
.colophon h2 { font-family: 'MPR'; font-weight: 800; font-size: 13pt; color: var(--brand-strong); margin: 0 0 2mm; string-set: run content(); }
.colophon .disc { margin-top: 3mm; background: var(--brand-soft); border-left: 1.6mm solid var(--brand); padding: 2.5mm 4mm; font-family: 'Noto Sans CJK JP'; font-weight: 700; color: var(--brand-strong); }
.colophon img { width: 46mm; margin-top: 4mm; }
/* 解説の強調（白黒） */
.x-wv { text-decoration: underline wavy; text-decoration-thickness: .6pt; text-underline-offset: 2.4pt; text-decoration-color: #000; font-family: 'Noto Serif', 'Noto Serif CJK JP'; }
.x-ul { text-decoration: underline; text-decoration-thickness: .8pt; text-underline-offset: 2.2pt; }
.x-b { font-weight: 700; font-family: 'Noto Sans CJK JP'; }
.x-ok, .x-ng { font-weight: 900; font-family: 'Noto Sans CJK JP'; font-size: 1.08em; }
.abox .ans { text-decoration: underline; text-decoration-thickness: 1pt; text-underline-offset: 2.6pt; }
.abox li b { font-family: 'Noto Sans CJK JP'; }
table.crit td.p { font-weight: 700; }

""".replace('@FONT_DIR@', str(FONT_DIR))

def _gray(m):
    h = m.group(1)
    if len(h) == 3: h = ''.join(c*2 for c in h)
    r, g, b = (int(h[i:i+2], 16) for i in (0, 2, 4))
    y = round(0.299*r + 0.587*g + 0.114*b)
    return '#%02x%02x%02x' % (y, y, y)

def mono(t):
    return re.sub(r'(?<![&\w])#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b', _gray, t)

PAGE_INFO = {}

def load(R):
    return [importlib.import_module(f'r{R}_{k}').PART for k in ['I', 'II', 'III', 'IV']]

def cover(R, kind):
    sub = '問題' if kind == 'q' else '解答・解説'
    if kind == 'q':
        notice = """<h3>注意</h3><ol>
<li>この冊子は問題部分と解答用紙からなる。解答はすべて解答用紙の指定のところに記入しなさい。</li>
<li>大問は I〜IV の4題，配点は I 35点・II 35点・III 30点・IV 25点（計125点）。</li>
<li>字数指定のある日本語の解答では，句読点も1字に数える。</li>
<li>本冊子の英文・設問・図表はすべてオリジナルで，IV の図表のデータは架空のものである。</li></ol>"""
    else:
        notice = """<h3>この冊子の内容</h3><ol>
<li>解答一覧（全設問の正解・模範解答）</li>
<li>大問ごとの解答・解説（根拠となる本文の箇所，他の選択肢が誤りである理由）</li>
<li>日本語記述の採点基準（要素ごとの配点）・英作文の採点観点と複数の解答例</li>
<li>全訳・重要語句</li></ol>
<p style="margin:1.5mm 0 0;font-size:8.6pt;color:#5a6573">設問ごとの配点は，大問の配点（大学公表の形式）に合わせて本予想問題が独自に定めたもので，大学の配点ではありません。</p>"""
    rng = PAGE_INFO.get((R, kind), '')
    return f"""<section class="cover">
<div class="brand"><img src="file://{HERE}/logo_gray.png"><div class="kicker">学習アプリ マナトビ</div></div>
<div class="head"><span class="tag">（予想 第{R}回）</span><h1>外国語</h1></div>
<div class="eigo">英語</div>
<div class="range">{rng}</div>
<div class="sub">神戸大学 前期日程 対策 ／ {sub}</div>
<div class="chui"><b>注意</b>{'解答はすべて解答用紙の指定のところに記入しなさい。' if kind == 'q' else '解答・解説は問題を解き終えてから読みなさい。'}</div>
<div class="haiten">外国語（英　語）<span>125点</span></div>
<div class="notice">{notice}</div>
<div class="disc">{DISCLAIMER}<br>本冊子は過去の出題形式を分析して作成した練習用の教材です。</div>
<div class="foot"><span>学習アプリ マナトビ</span><span>予想問題 第{R}回 ／ {sub}</span></div></section>"""

def passage_html(P):
    novel = P['roman'] == 'III'
    ps = ''.join(f'<p>{mark(p)}</p>' for p in P['passage'])
    notes = ''
    if P.get('notes'):
        rows = ''.join(f'<tr><td class="en">{e(a)}</td><td>{e(b)}</td></tr>' for a, b in P['notes'])
        notes = f'<div class="notes"><div class="nh">注</div><table>{rows}</table></div>'
    return f'<div class="passage{" novel" if novel else ""}">{ps}</div>{notes}'

def choices_html(chs, row4=False):
    cls = 'choices row4' if row4 else 'choices'
    return f'<div class="{cls}">' + ''.join(f'<div><span class="k">({K[i]})</span><span>{e(c)}</span></div>' for i, c in enumerate(chs)) + '</div>'

def question_html(q):
    head = f'<div class="stem"><span class="qn">問 {q["no"]}</span><span>{jmark(q["stem"])}</span></div>'
    body = ''
    k = q['kind']
    if k in ('synonym', 'wavy'):
        cls = 'wv' if k == 'wavy' else 'ul'
        for it in q['items']:
            short = all(len(c) <= 18 for c in it['choices'])
            body += f'<div class="item"><div class="w"><span class="k">({it["label"]})</span>&ensp;<span class="{cls}">{e(it["word"])}</span></div>{choices_html(it["choices"], row4=short)}</div>'
        body = f'<div class="items">{body}</div>'
    elif k == 'blanks':
        for it in q['items']:
            body += f'<div class="item"><div class="w">(&#8194;{it["label"]}&#8194;)</div>{choices_html(it["choices"], row4=all(len(c) <= 22 for c in it["choices"]))}</div>'
        body = f'<div class="items">{body}</div>'
    elif k == 'combo':
        th = '<tr><th></th>' + ''.join(f'<th>{e(c)}</th>' for c in q['cols']) + '</tr>'
        trs = ''.join(f'<tr><td class="k0">({K[i]})</td>' + ''.join(f'<td>{e(x)}</td>' for x in r) + '</tr>' for i, r in enumerate(q['rows']))
        body = f'<table class="combo">{th}{trs}</table>'
    elif k in ('tf2', 'dialog_blanks'):
        body = f'<div class="items">{choices_html(q["choices"])}</div>'
    return f'<div class="q">{head}{body}</div>'

def chart_svg(ch):
    cats, series = ch['cats'], ch['series']
    W, H, L, T = 600, 300, 175, 34
    vmax = ch.get('vmax', 160); step = ch.get('step', 40)
    rowh = (H - T - 30) / len(cats)
    bh = rowh * 0.32
    cols = ['#111111', '#b0b0b0']
    s = [f'<svg class="chart" width="150mm" height="75mm" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" font-family="Noto Serif">']
    s.append(f'<text x="{W/2}" y="16" text-anchor="middle" font-size="14" font-weight="700" fill="#1c2a39">{e(ch["title"])}</text>')
    for v in range(0, vmax + 1, step):
        x = L + (W - L - 30) * v / vmax
        s.append(f'<line x1="{x:.1f}" y1="{T}" x2="{x:.1f}" y2="{H-30}" stroke="#d9cdb6" stroke-width="1"/>')
        s.append(f'<text x="{x:.1f}" y="{H-14}" text-anchor="middle" font-size="11" fill="#3e4c5b">{v}</text>')
    for i, c in enumerate(cats):
        y0 = T + rowh * i + rowh * 0.16
        words = c.split(' (')
        s.append(f'<text x="{L-8}" y="{y0+bh+3}" text-anchor="end" font-size="12" fill="#1c2a39">{e(words[0])}</text>')
        if len(words) > 1: s.append(f'<text x="{L-8}" y="{y0+bh+17}" text-anchor="end" font-size="10.5" fill="#3e4c5b">({e(words[1])}</text>')
        for j, (lab, vals) in enumerate(series):
            y = y0 + j * (bh + 2)
            w = (W - L - 30) * vals[i] / vmax
            s.append(f'<rect x="{L}" y="{y:.1f}" width="{w:.1f}" height="{bh:.1f}" fill="{cols[j]}" rx="2"/>')
            s.append(f'<text x="{L+w+5:.1f}" y="{y+bh-2:.1f}" font-size="11" fill="#1c2a39">{vals[i]}{ch.get("suffix", "")}</text>')
    lx = W - 150
    for j, (lab, _) in enumerate(series):
        s.append(f'<rect x="{lx + j*70}" y="{H-8-10}" width="0" height="0"/>')
    s.append(f'<rect x="{L}" y="{H-12}" width="0" height="0"/>')
    leg = ''.join(f'<rect x="{W-170 + j*80}" y="24" width="14" height="10" fill="{cols[j]}"/><text x="{W-151 + j*80}" y="33" font-size="11.5" fill="#1c2a39">{e(lab)}</text>' for j, (lab, _) in enumerate(series))
    s.append(leg)
    s.append(f'<text x="{W-30}" y="{H-1}" text-anchor="end" font-size="10" fill="#5a6573">{e(ch.get("unit_label", "(minutes)"))}</text>')
    s.append('</svg>')
    return ''.join(s)

def part_q(P):
    r = P['roman']
    if r == 'IV':
        qs = ''.join(f'<div class="ivq"><span>{e(q["no"])}</span><span>{e(q["stem"])}</span></div>' for q in P['questions'])
        return f"""<section class="part"><div class="parthead" data-run="IV　英作文"><span class="roman">IV</span><span class="t">英作文（配点 {P['points']}点）</span></div>
<p class="ivintro">{e(P['intro_en'])}<span style="font-family:'Noto Serif CJK JP'">（配点 {P['points']}点）</span></p>{chart_svg(P['chart'])}{qs}</section>"""
    intro = e(P['intro']).replace('。（', '。（')
    qs = ''.join(question_html(q) for q in P['questions'])
    return f"""<section class="part"><div class="parthead" data-run="{r}　{'評論' if r != 'III' else '小説'}"><span class="roman">{r}</span><span class="t">{'評論' if r != 'III' else '小説'}（配点 {P['points']}点）</span></div>
<p class="intro">{intro}<span class="pt">（配点 {P['points']}点）</span></p>{passage_html(P)}{qs}</section>"""

def genko(n):
    rows = (n + 19) // 20
    out = '<table class="genko">'
    c = 0
    for r in range(rows):
        out += '<tr>' + ''.join(f'<td class="{"ten" if (r*20+i+1) % 10 == 0 else ""}"></td>' for i in range(20)) + '</tr>'
    return out + f'</table><span class="sub">{n}字（20字×{rows}行，10字ごとに太線）</span>'

def lines(n):
    return ''.join(f'<div class="wl">{"<span>" + str((i+1)*10) + "語</span>" if (i+1) % 2 == 0 else ""}</div>' for i in range(n))

def sheet(parts, R):
    out = f'<section class="sheet"><h2>解答用紙　予想問題 第{R}回</h2><div style="font-size:8.6pt;color:#5a6573;margin-bottom:2mm">受験番号・氏名欄は省略。記号は (あ) のように書く。</div>'
    for P in parts[:3]:
        out += f'<h4 style="font-family:MPR;font-weight:800;color:#1c4687;margin:3mm 0 1mm">{P["roman"]}</h4>'
        for q in P['questions']:
            k = q['kind']
            if k == 'ja_limit':
                out += f'<div class="row tall"><span class="h">問 {q["no"]}</span><div>{genko(q["limit"])}</div></div>'
            elif k in ('trans', 'trans_ref', 'ja_free'):
                out += f'<div class="row lines"><span class="h">問 {q["no"]}</span><span></span></div>'
            elif k in ('synonym', 'wavy', 'blanks'):
                cells = '　'.join(f'({it["label"]}) ［　　　］' for it in q['items'])
                out += f'<div class="row"><span class="h">問 {q["no"]}</span><span>{cells}</span></div>'
            elif k == 'dialog_blanks':
                cells = '　'.join(f'( {b} ) ［　　　］' for b in 'ABCDE')
                out += f'<div class="row"><span class="h">問 {q["no"]}</span><span>{cells}</span></div>'
            elif k == 'tf2':
                out += f'<div class="row"><span class="h">問 {q["no"]}</span><span>［　　　］［　　　］</span></div>'
            else:
                out += f'<div class="row"><span class="h">問 {q["no"]}</span><span>［　　　］</span></div>'
    out += '</section><section class="sheet"><h2>解答用紙（IV 英作文）</h2>'
    for q in parts[3]['questions']:
        n = 6 if q['target'] == 40 else 9
        out += f'<h4 style="font-family:MPR;font-weight:800;color:#1c4687;margin:4mm 0 1mm">IV {e(q["no"])}　<span style="font-size:8.5pt;color:#5a6573">（約{q["target"]}語）</span></h4>{lines(n)}'
    out += '</section>'
    return out

def colophon(R, kind):
    return f"""<section class="colophon"><div class="box"><h2>奥付</h2>
<div>予想問題 第{R}回　外国語（英語）　{'問題' if kind == 'q' else '解答・解説'}</div>
<div>対象：神戸大学 前期日程 外国語（英語）の受験準備</div>
<div>作成：学習アプリ マナトビ 編集部（2026年10月）</div>
<div>作成方法：2022〜2026年度の出題形式・語数・難易度を分析し，英文・設問・図表をすべて新たに書き下ろした。</div>
<div class="disc">{DISCLAIMER}</div>
<div style="margin-top:2.5mm;font-size:8.4pt;color:#5a6573">本冊子の英文は実在の記事・書籍・論文からの引用・翻案ではありません。IV の図表のデータは架空です。無断転載・再配布を禁じます。</div>
<img src="file://{HERE}/logo_gray.png"></div></section>"""

def build_q(R):
    parts = load(R)
    body = cover(R, 'q') + ''.join(part_q(P) for P in parts) + sheet(parts, R) + colophon(R, 'q')
    doc = f'<html lang="ja"><head><meta charset="utf-8"><title>予想問題 第{R}回 外国語（英語）問題</title></head><body>{body}</body></html>'
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f'manatobi_kobe_eng_yoso{R}_mondai.pdf'
    HTML(string=mono(doc), base_url=str(HERE)).write_pdf(out, stylesheets=[CSS(string=mono(CSS_TEXT), font_config=FC)], font_config=FC, metadata={'author': 'マナトビ'})
    return out

# ------------------------------------------------------------ 解答・解説
def crit_table(c):
    rows = ''.join(f'<tr><td>{e(a)}</td><td class="p">{p}点</td></tr>' for a, p in c)
    return f'<table class="crit"><tr><th>採点基準（要素）</th><th>配点</th></tr>{rows}<tr><td style="text-align:right">計</td><td class="p">{sum(p for _, p in c)}点</td></tr></table>'

def ans_short(q):
    k = q['kind']
    if k in ('synonym', 'wavy', 'blanks'):
        return '　'.join(f'({it["label"]}) ({K[it["answer"]]})' for it in q['items'])
    if k == 'combo': return f'({K[q["answer"]]})'
    if k == 'tf2': return '・'.join(f'({K[i]})' for i in sorted(q['answer']))
    if k == 'dialog_blanks': return '　'.join(f'({b}) ({K[v]})' for b, v in q['answer'].items())
    return q['answer']

def akey_part(P):
    r = P['roman']
    out = f'<section class="part akey"><h3>{r}　解答・解説（{P["points"]}点）</h3>'
    if r == 'IV':
        for q in P['questions']:
            out += f'<h4>IV {e(q["no"])}（{q["points"]}点）</h4><div class="abox"><div class="en">{e(q["stem"])}</div>{crit_table(q["criteria"])}'
            for lab, m in q['models']:
                n = len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'’\-]*", m))
                out += f'<div style="margin-top:1.5mm"><span class="lbl">解答例：{e(lab)}</span></div><div class="model">{e(m)} <span class="wc">（{n}語）</span></div>'
            out += '</div>'
        out += '<h4>減点されやすい点</h4><div class="abox"><ul><li><b>(1)</b>で図の数値を<span class="x-ul">読み違える</span>・増減の向きを逆に書く。</li><li>(1)で比較の語（while / in contrast / both）がなく，2つの事実を並べただけになる。</li><li>(2)で賛否を最初に示さない・理由が1つだけで具体例がない。</li><li>語数が指定から大きく外れる（目安：±15%）。</li></ul></div>'
        out += '<h4>重要語句</h4><table class="voc">' + ''.join(f'<tr><td>{e(a)}</td><td>{e(b)}</td></tr>' for a, b in P['vocab']) + '</table></section>'
        return out
    for q in P['questions']:
        k = q['kind']
        out += f'<h4>問 {q["no"]}（{q["points"]}点）</h4><div class="abox">'
        if k in ('synonym', 'wavy', 'blanks'):
            out += f'<div class="ans">正解　{ans_short(q)}</div><ul>'
            for it in q['items']:
                w = f'<span class="en">{e(it["word"])}</span>' if 'word' in it else f'( {it["label"]} )'
                out += f'<li><b>({it["label"]})</b> {w} → <span class="en"><b>{e(it["choices"][it["answer"]])}</b></span>：{em(it["why"])}</li>'
            out += '</ul>'
        elif k == 'combo':
            out += f'<div class="ans">正解　({K[q["answer"]]})　<span class="en">{" / ".join(e(x) for x in q["rows"][q["answer"]])}</span></div><ul>' + ''.join(f'<li>{em(x)}</li>' for x in q['explain']) + '</ul>'
        elif k == 'tf2':
            out += f'<div class="ans">正解　{ans_short(q)}</div><ul>'
            for i, (c, rs) in enumerate(zip(q['choices'], q['reasons'])):
                out += f'<li><b>({K[i]})</b> <span class="en">{e(c)}</span><br>{em(rs)}</li>'
            out += '</ul>'
        elif k == 'dialog_blanks':
            out += f'<div class="ans">正解　{ans_short(q)}</div><ul>'
            for b, v in q['answer'].items():
                out += f'<li><b>( {b} )</b> ({K[v]}) <span class="en">{e(q["choices"][v])}</span>：{em(q["why"][b])}</li>'
            out += f'</ul><div style="margin-top:1mm"><span class="lbl">答えが1つに決まる理由</span>{em(q["check"])}</div>'
        else:
            out += f'<div><span class="lbl">模範解答</span><span class="ans">{e(q["answer"])}</span></div>'
            for a in q.get('alts', []):
                out += f'<div style="margin-top:.8mm"><span class="lbl">別解</span><span class="x-ul">{e(a)}</span></div>'
            if k == 'ja_limit':
                out += f'<div style="font-size:8.4pt;color:#5a6573;margin-top:.6mm">模範解答 {len(q["answer"])}字・別解 {"・".join(str(len(a)) + "字" for a in q.get("alts", []))}（句読点を含む／制限 {q["limit"]}字以内）</div>'
            out += crit_table(q['criteria']) + '<ul>' + ''.join(f'<li>{em(x)}</li>' for x in q['explain']) + '</ul>'
        out += '</div>'
    out += '<h4>全訳</h4><div class="trs">' + ''.join(f'<p>{e(p)}</p>' for p in P['translation']) + '</div>'
    out += '<h4>重要語句</h4><table class="voc">' + ''.join(f'<tr><td>{e(a)}</td><td>{e(b)}</td></tr>' for a, b in P['vocab']) + '</table></section>'
    return out

def summary(parts, R):
    rows = ''
    for P in parts[:3]:
        for q in P['questions']:
            a = ans_short(q)
            if len(a) > 60: a = a[:58] + '…（解説参照）'
            rows += f'<tr><td>{P["roman"]}</td><td>問 {q["no"]}</td><td>{e(a)}</td><td>{q["points"]}</td></tr>'
    for q in parts[3]['questions']:
        rows += f'<tr><td>IV</td><td>{e(q["no"])}</td><td>解答例は解説参照（採点観点つき）</td><td>{q["points"]}</td></tr>'
    tot = sum(q['points'] for P in parts for q in P['questions'])
    return f'<section class="part akey"><h3>解答一覧　予想問題 第{R}回</h3><table class="sum"><tr><th>大問</th><th>設問</th><th>解答</th><th>配点</th></tr>{rows}<tr><td colspan="3" style="text-align:right">合計</td><td>{tot}</td></tr></table><p style="font-size:8.4pt;color:#5a6573">設問ごとの配点は本予想問題独自のもの（大問の配点は2022〜2026年度の出題と同じ）。</p></section>'

def build_a(R):
    parts = load(R)
    tot = sum(q['points'] for P in parts for q in P['questions'])
    assert tot == 125, tot
    for P in parts: assert sum(q['points'] for q in P['questions']) == P['points'], (P['roman'], sum(q['points'] for q in P['questions']))
    body = cover(R, 'a') + summary(parts, R) + ''.join(akey_part(P) for P in parts) + colophon(R, 'a')
    doc = f'<html lang="ja"><head><meta charset="utf-8"><title>予想問題 第{R}回 外国語（英語）解答・解説</title></head><body>{body}</body></html>'
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f'manatobi_kobe_eng_yoso{R}_kaitou.pdf'
    HTML(string=mono(doc), base_url=str(HERE)).write_pdf(out, stylesheets=[CSS(string=mono(CSS_TEXT), font_config=FC)], font_config=FC, metadata={'author': 'マナトビ'})
    return out

def page_range(pdf, kind):
    import subprocess
    n = int(re.search(r'Pages:\s+(\d+)', subprocess.run(['pdfinfo', str(pdf)], capture_output=True, text=True).stdout).group(1))
    if kind == 'a':
        return f'（解答・解説 1 〜 {n - 2} ページ）'
    for p in range(2, n + 1):
        t = subprocess.run(['pdftotext', '-f', str(p), '-l', str(p), str(pdf), '-'], capture_output=True, text=True).stdout
        if '解答用紙' in t and '受験番号' in t:
            return f'（問題部分 1 〜 {p - 2} ページ・解答用紙 {p - 1} ページ）'
    raise SystemExit('解答用紙のページが見つからない')

if __name__ == '__main__':
    R = sys.argv[1] if len(sys.argv) > 1 else '1'
    for kind, f in (('q', build_q), ('a', build_a)):
        o = f(R)
        PAGE_INFO[(R, kind)] = page_range(o, kind)
        o = f(R); print(o.name, o.stat().st_size // 1024, 'KB', PAGE_INFO[(R, kind)])
