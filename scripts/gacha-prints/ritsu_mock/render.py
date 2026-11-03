# -*- coding: utf-8 -*-
"""立命館大学 全学統一方式（文系）英語 予想問題の PDF（問題／解答・解説）を作る。白黒・A4縦・マーク式。
紙面の部品・書体・白黒化は神戸大の render.py（../kobe_mock/render.py）を読み込んで流用する。
  python3 render.py 1   → .tmpwork/ritsu_mock/manatobi_ritsu_eng_yoso1_{mondai,kaitou}.pdf
データ：rmN.py（N＝回）。I 長文（英問・一致/不一致/判断不能・表題）／II 長文（空所・下線部）／
        III 会話文2つ（10択）／IV 文法・語法／V 語彙（空所・同意語）。独自配点 120点。
"""
import sys, re, os, importlib, importlib.util, subprocess
from pathlib import Path
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(HERE))
_spec = importlib.util.spec_from_file_location('kb', HERE.parent / 'kobe_mock/render.py')
kb = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(kb)
from weasyprint import HTML, CSS
e, mono, FC = kb.e, kb.mono, kb.FC
OUT_DIR = Path(os.environ.get('RITSU_OUT_DIR', str(ROOT / '.tmpwork/ritsu_mock')))
DISCLAIMER = '立命館大学の過去問・公式問題ではありません。予想問題であり，大学とは関係がありません。'
PAGE_INFO = {}
POINTS = {'I': 26, 'II': 34, 'III': 24, 'IV': 16, 'V': 20}
TF = {1: '1 一致', 2: '2 不一致', 3: '3 判断できない'}

def em(s):
    """解説文の強調：英文引用“…”は波下線，「…」は下線，選択肢番号・空所記号・判定は太字。"""
    t = kb.em(s)
    t = re.sub(r'(?<![A-Za-z0-9>])\(((?:10|[1-9]))\)', r'<span class="x-b">(\1)</span>', t)
    t = re.sub(r'(?<![A-Za-z>])\((き|く|け)\)', r'<span class="x-b">(\1)</span>', t)
    t = re.sub(r'^(1 一致|2 不一致|3 判断できない)', r'<span class="x-b">\1</span>', t)
    return t

def mark(t):
    """{u|…} 下線・{uあ|…} 下線(あ)・[[A]] 空所・^3 注番号"""
    t = e(t)
    def rep(m):
        lab, body = m.group(1), m.group(2)
        pre = f'<span class="lab">({lab})</span>' if lab else ''
        return f'{pre}<span class="ul">{body}</span>'
    t = re.sub(r'\{u([^|}]*)\|([^}]*)\}', rep, t)
    t = re.sub(r'\[\[([^\]]+)\]\]', r'<span class="bx">\1</span>', t)
    return re.sub(r'\^(\d+)', r'<sup class="nt">\1</sup>', t)

def strip(t):
    t = re.sub(r'\{u[^|}]*\|([^}]*)\}', r'\1', t)
    t = re.sub(r'\[\[[^\]]+\]\]', '', t)
    return re.sub(r'\^\d+', '', t)

RITSU_CSS = """
.ocover { page: cover; height: 297mm; position: relative; background: #fff; overflow: hidden; font-family: 'Noto Serif CJK JP', serif; }
.ocover .brand { position: absolute; top: 12mm; left: 18mm; right: 18mm; display: flex; justify-content: space-between; align-items: center; border-bottom: .6pt solid #999; padding-bottom: 2.5mm; }
.ocover .brand img { width: 34mm; }
.ocover .brand .kicker { font-family: 'MPR'; font-weight: 700; font-size: 7.6pt; letter-spacing: .16em; color: #555; }
.ocover .box { position: absolute; top: 24mm; right: 24mm; border: .8pt solid #000; width: 11mm; height: 8mm; text-align: center; font-size: 11pt; line-height: 8mm; }
.ocover .l1 { position: absolute; top: 44mm; left: 0; right: 0; text-align: center; font-size: 13pt; letter-spacing: .5em; padding-left: .5em; }
.ocover .l2 { position: absolute; top: 56mm; left: 0; right: 0; text-align: center; font-family: 'Noto Sans CJK JP'; font-weight: 700; font-size: 13pt; letter-spacing: .4em; padding-left: .4em; }
.ocover h1 { position: absolute; top: 69mm; left: 0; right: 0; margin: 0; text-align: center; font-family: 'Noto Serif CJK JP'; font-weight: 900; font-size: 27pt; letter-spacing: .55em; padding-left: .55em; }
.ocover .sub { position: absolute; top: 88mm; left: 0; right: 0; text-align: center; font-family: 'MPR'; font-weight: 700; font-size: 9.2pt; color: #333; letter-spacing: .05em; }
.ocover .chui { position: absolute; top: 102mm; left: 26mm; right: 26mm; border-top: .6pt solid #000; padding-top: 2mm; font-size: 9.6pt; line-height: 1.75; }
.ocover .chui .ttl { display: inline-block; border: .6pt solid #000; padding: 0 2mm; font-family: 'Noto Sans CJK JP'; font-weight: 700; margin-bottom: 1.5mm; }
.ocover .chui ol { margin: 0; padding-left: 6mm; }
.ocover .chui li b { font-family: 'Noto Sans CJK JP'; }
.ocover .disc { position: absolute; top: 236mm; left: 26mm; right: 26mm; background: #ededed; border-left: 1.8mm solid #1a1a1a; padding: 3mm 5mm; font-family: 'Noto Sans CJK JP'; font-size: 9pt; font-weight: 700; line-height: 1.7; }
.ocover .foot { position: absolute; bottom: 12mm; left: 22mm; right: 22mm; display: flex; justify-content: space-between; font-family: 'Noto Sans CJK JP'; font-size: 7.6pt; color: #555; border-top: 1px solid #999; padding-top: 2mm; }
.bx { display: inline-block; border: .8pt solid #000; min-width: 10mm; padding: 0 1.4mm; text-align: center; line-height: 1.3; font-family: 'Noto Serif CJK JP'; font-size: 9.4pt; text-indent: 0; }
sup.nt { font-size: 6.6pt; font-family: 'Noto Serif'; }
.rnotes { margin: 3mm 0 1mm; font-size: 9.2pt; line-height: 1.55; columns: 2; column-gap: 8mm; }
.rnotes div { break-inside: avoid; }
.rnotes .en { font-family: 'Noto Serif'; }
.rq { margin: 4.5mm 0 0; }
.rq .stem { display: grid; grid-template-columns: 10mm 1fr; font-family: 'Noto Serif CJK JP'; }
.rq .items { margin: 1mm 0 0 10mm; }
.ritem { margin: 2.2mm 0 0; break-inside: avoid; }
.ritem .w { font-family: 'Noto Serif', 'Noto Serif CJK JP'; display: grid; grid-template-columns: 9mm 1fr; }
.rch { margin: .5mm 0 0 9mm; font-family: 'Noto Serif', 'Noto Serif CJK JP'; font-size: 10.3pt; line-height: 1.65; }
.rch div { display: grid; grid-template-columns: 8.5mm 1fr; }
.rch.c4 { display: grid; grid-template-columns: repeat(4, 1fr); }
.rch.c2 { display: grid; grid-template-columns: repeat(2, 1fr); column-gap: 4mm; }
.rch.c4 div, .rch.c2 div { grid-template-columns: 7.5mm 1fr; }
.dlg { font-family: 'Noto Serif'; font-size: 10.4pt; line-height: 1.85; margin: 2mm 0 2mm 10mm; }
.dlg .scene { font-style: italic; margin-bottom: 1mm; }
.dlg .ln { display: grid; grid-template-columns: 7mm 1fr; }
.dlg .sp { font-weight: 700; }
.mrow { display: grid; grid-template-columns: 24mm 1fr; align-items: center; border-bottom: .5pt solid #bbb; min-height: 6.4mm; font-size: 8.8pt; }
.mrow .h { font-family: 'Noto Sans CJK JP'; font-weight: 700; color: #333; }
.bub { display: inline-block; width: 5mm; height: 5mm; border: .7pt solid #000; border-radius: 50%; text-align: center; line-height: 5mm; font-size: 7pt; margin-right: 1.2mm; font-family: 'Noto Sans CJK JP'; }
.mgrid { display: grid; grid-template-columns: 1fr 1fr; column-gap: 8mm; }
.mh { font-family: 'MPR'; font-weight: 800; margin: 2.2mm 0 .4mm; font-size: 9.8pt; }
.akey .tfl { font-family: 'Noto Serif'; }
.akey .dl { font-family: 'Noto Serif'; font-size: 9.3pt; }
"""

def cover(R, kind):
    sub = '問題' if kind == 'q' else '解答・解説'
    rng = PAGE_INFO.get((R, kind), '')
    pts = '・'.join(f'{k} {v}点' for k, v in POINTS.items())
    if kind == 'q':
        items = [f'問題部分とマーク式の解答用紙で構成されている{rng}。',
                 '試験時間の目安は80分。大問は I〜V の5題で，すべて選択式である。',
                 '答えは，解答用紙の該当する番号の円を塗りつぶす（○で囲むだけでもよい）。',
                 f'配点は {pts}（計120点）。本予想問題が独自に定めた配点である。',
                 '本冊子の英文・設問はすべてオリジナルである。登場する人物・団体・場所は架空である。']
    else:
        items = [f'解答一覧・大問ごとの解答と解説{rng}。',
                 '正解の根拠となる本文の箇所と，ほかの選択肢が誤りである理由を示した。',
                 '長文は全訳と重要語句，会話文は全訳つき。',
                 f'配点は {pts}（計120点）。本予想問題が独自に定めた配点で，大学の配点ではない。']
    lis = ''.join(f'<li>{x}</li>' for x in items)
    return f"""<section class="ocover">
<div class="brand"><img src="file://{HERE}/logo_gray.png"><div class="kicker">学習アプリ マナトビ</div></div>
<div class="box">{R}</div>
<div class="l1">予想問題 第{R}回</div>
<div class="l2">全学統一方式（文系）対策</div>
<h1>英語{'問題' if kind == 'q' else '解答'}</h1>
<div class="sub">立命館大学 全学統一方式（文系）の出題形式に準拠 ／ {sub}</div>
<div class="chui"><span class="ttl">注　意</span><ol>{lis}</ol></div>
<div class="disc">{DISCLAIMER}<br>本冊子は過去の出題形式を分析して作成した練習用の教材です。</div>
<div class="foot"><span>学習アプリ マナトビ</span><span>予想問題 第{R}回 ／ {sub}</span></div></section>"""

def head(roman, title, pts):
    return f'<div class="parthead" data-run="{roman}　{title}"><span class="roman">{roman}</span><span class="t">{title}（配点 {pts}点）</span></div>'

def notes_html(notes):
    if not notes: return ''
    return '<div class="rnotes">' + ''.join(f'<div>{i}. <span class="en">{e(a)}</span>　{e(b)}</div>' for i, (a, b) in enumerate(notes, 1)) + '</div>'

def choices(chs, cols=None):
    if cols is None:
        L = max(len(c) for c in chs)
        cols = 'c4' if L <= 15 and len(chs) == 4 else ('c2' if L <= 34 else '')
    return f'<div class="rch {cols}">' + ''.join(f'<div><span class="k">({i + 1})</span><span>{e(c)}</span></div>' for i, c in enumerate(chs)) + '</div>'

def stem(lab, text): return f'<div class="stem"><span>〔{lab}〕</span><span>{e(text)}</span></div>'

def passage(paras, title=None):
    t = f'<p class="first" style="text-align:center;font-style:normal;font-weight:700;text-indent:0">{e(title)}</p>' if title else ''
    return f'<div class="passage">{t}{"".join(f"<p>{mark(p)}</p>" for p in paras)}</div>'

def part_I(P):
    q1 = ''.join(f'<div class="ritem"><div class="w"><span class="k">({it["label"]})</span><span>{e(it["question"])}</span></div>{choices(it["choices"])}</div>' for it in P['q1']['items'])
    q2 = ''.join(f'<div class="ritem"><div class="w"><span class="k">({i})</span><span>{e(it["text"])}</span></div></div>' for i, it in enumerate(P['q2']['items'], 1))
    return (f'<section class="part">{head("I", "長文読解", POINTS["I"])}<p class="intro">以下の英文を読み，後の問いに答えよ。</p>{passage(P["passage"], P.get("title"))}{notes_html(P["notes"])}'
            f'<div class="rq">{stem(1, "次の問い(A)〜(D)に対する答えとして最もふさわしいものを，本文の内容に基づいて(1)〜(4)のうちから1つずつ選びなさい。")}<div class="items">{q1}</div></div>'
            f'<div class="rq">{stem(2, "次の(1)〜(5)の英文について，本文の内容に合うものは 1，合わないものは 2，本文からは合うとも合わないとも決められないものは 3 を選びなさい。")}<div class="items">{q2}</div></div>'
            f'<div class="rq">{stem(3, "本文全体の内容を表す題として最もふさわしいものを(1)〜(5)のうちから1つ選びなさい。")}<div class="items">{choices(P["q3"]["choices"], "")}</div></div></section>')

def part_II(P):
    q1 = ''.join(f'<div class="ritem"><div class="w"><span class="k">({it["label"]})</span><span></span></div>{choices(it["choices"])}</div>' for it in P['q1']['items'])
    q2 = ''.join(f'<div class="ritem"><div class="w"><span class="k">({it["label"]})</span><span>{e(it["word"])}</span></div>{choices(it["choices"])}</div>' for it in P['q2']['items'])
    return (f'<section class="part">{head("II", "長文読解", POINTS["II"])}<p class="intro">以下の英文を読み，後の問いに答えよ。</p>{passage(P["passage"], P.get("title"))}{notes_html(P["notes"])}'
            f'<div class="rq">{stem(1, "本文の空所( A )〜( H )に入れるのに最もふさわしいものを，それぞれ(1)〜(4)のうちから1つずつ選びなさい。")}<div class="items">{q1}</div></div>'
            f'<div class="rq">{stem(2, "下線部(あ)〜(お)が本文中で表している意味・内容として最もふさわしいものを，それぞれ(1)〜(4)のうちから1つずつ選びなさい。")}<div class="items">{q2}</div></div></section>')

def dialogue_html(d):
    lines = ''.join(f'<div class="ln"><span class="sp">{e(s)}:</span><span>{mark(x)}</span></div>' for s, x in d['lines'])
    return f'<div class="dlg"><div class="scene">{e(d["title"])}</div>{lines}</div>'

def part_III(P):
    out = f'<section class="part">{head("III", "会話文", POINTS["III"])}'
    for n, d in enumerate(P['dialogues'], 1):
        labs = list(d['answers'])
        out += (f'<div class="rq">{stem(n, f"次の会話の空所({labs[0]})〜({labs[-1]})に入れるのに最もふさわしい表現を(1)〜(10)のうちから1つずつ選びなさい。同じ表現を2度使ってはならない。また，使わない表現が6つある。")}'
                f'{dialogue_html(d)}<div class="items">{choices(d["choices"], "")}</div></div>')
    return out + '</section>'

def part_IV(P):
    its = ''.join(f'<div class="ritem"><div class="w"><span class="k">({it["label"]})</span><span>{e(it["text"])}</span></div>{choices(it["choices"])}</div>' for it in P['items'])
    return f'<section class="part">{head("IV", "文法・語法", POINTS["IV"])}<div class="rq">{stem("", "次の(A)〜(H)の英文の空所に入れるのに最もふさわしいものを，それぞれ(1)〜(4)のうちから1つずつ選びなさい。")}<div class="items">{its}</div></div></section>'

def part_V(P):
    a = ''.join(f'<div class="ritem"><div class="w"><span class="k">({it["label"]})</span><span>{e(it["text"])}</span></div>{choices(it["choices"])}</div>' for it in P['q1']['items'])
    b = ''.join(f'<div class="ritem"><div class="w"><span class="k">({it["label"]})</span><span>{mark(it["text"])}</span></div>{choices(it["choices"])}</div>' for it in P['q2']['items'])
    return (f'<section class="part">{head("V", "語彙", POINTS["V"])}'
            f'<div class="rq">{stem(1, "次の(A)〜(E)の英文の空所に入れる語として最もふさわしいものを，それぞれ(1)〜(4)のうちから1つずつ選びなさい。")}<div class="items">{a}</div></div>'
            f'<div class="rq">{stem(2, "次の(A)〜(E)の英文の下線部の語に意味が最も近いものを，それぞれ(1)〜(4)のうちから1つずつ選びなさい。")}<div class="items">{b}</div></div></section>')

def bubbles(n): return ''.join(f'<span class="bub">{i}</span>' for i in range(1, n + 1))

def sheet(D, R):
    def rows(title, labs, n):
        return f'<div class="mh">{title}</div>' + ''.join(f'<div class="mrow"><span class="h">{x}</span><span>{bubbles(n)}</span></div>' for x in labs)
    I, II, III = D['I'], D['II'], D['III']
    left = rows('I 〔1〕', [f'({it["label"]})' for it in I['q1']['items']], 4) + rows('I 〔2〕', [f'({i})' for i in range(1, 6)], 3) + rows('I 〔3〕', ['—'], 5)
    left += rows('II 〔1〕', [f'({it["label"]})' for it in II['q1']['items']], 4) + rows('II 〔2〕', [f'({it["label"]})' for it in II['q2']['items']], 4)
    right = ''.join(rows(f'III 〔{n}〕', [f'({x})' for x in d['answers']], 10) for n, d in enumerate(III['dialogues'], 1))
    right += rows('IV', [f'({it["label"]})' for it in D['IV']['items']], 4)
    right += rows('V 〔1〕', [f'({it["label"]})' for it in D['V']['q1']['items']], 4) + rows('V 〔2〕', [f'({it["label"]})' for it in D['V']['q2']['items']], 4)
    return (f'<section class="sheet"><h2>解答用紙（マーク式）　予想問題 第{R}回</h2>'
            f'<div style="font-size:8.6pt;margin-bottom:1mm">受験番号・氏名欄は省略。選んだ番号の円を塗りつぶすか○で囲む。I〔2〕は 1・2・3 のいずれか。</div>'
            f'<div class="mgrid"><div>{left}</div><div>{right}</div></div></section>')

def colophon(R, kind):
    return f"""<section class="colophon"><div class="box"><h2>奥付</h2>
<div>予想問題 第{R}回　英語　{'問題' if kind == 'q' else '解答・解説'}</div>
<div>対象：立命館大学 全学統一方式（文系）英語の受験準備</div>
<div>作成：学習アプリ マナトビ 編集部（2026年10月）</div>
<div>作成方法：2022〜2026年度の出題形式・語数・難易度を分析し，英文・設問をすべて新たに書き下ろした。</div>
<div class="disc">{DISCLAIMER}</div>
<div style="margin-top:2.5mm;font-size:8.4pt">本冊子の英文は実在の記事・書籍・論文からの引用・翻案ではありません。登場する人物・団体・場所は架空です。無断転載・再配布を禁じます。</div>
<img src="file://{HERE}/logo_gray.png"></div></section>"""

# ---------------------------------------------------------------- 解答・解説
def box(inner): return f'<div class="abox">{inner}</div>'
def ans(i, c): return f'<span class="ans">({i + 1}) {e(c)}</span>'
def li(x): return f'<li>{x}</li>'

def summary(D, R):
    I, II, III, IV, V = (D[k] for k in ('I', 'II', 'III', 'IV', 'V'))
    def j(items, key='answer'): return '　'.join(f'({it["label"]}) {it[key] + 1}' for it in items)
    rows = [('I', '〔1〕', j(I['q1']['items']), 3 * len(I['q1']['items'])),
            ('I', '〔2〕', '　'.join(f'({i}) {it["answer"]}' for i, it in enumerate(I['q2']['items'], 1)), 2 * len(I['q2']['items'])),
            ('I', '〔3〕', str(I['q3']['answer'] + 1), 4),
            ('II', '〔1〕', j(II['q1']['items']), 3 * len(II['q1']['items'])),
            ('II', '〔2〕', j(II['q2']['items']), 2 * len(II['q2']['items']))]
    for n, d in enumerate(III['dialogues'], 1):
        rows.append(('III', f'〔{n}〕', '　'.join(f'({k}) {v + 1}' for k, v in d['answers'].items()), 3 * len(d['answers'])))
    rows += [('IV', '—', j(IV['items']), 2 * len(IV['items'])), ('V', '〔1〕', j(V['q1']['items']), 2 * len(V['q1']['items'])), ('V', '〔2〕', j(V['q2']['items']), 2 * len(V['q2']['items']))]
    tr = ''.join(f'<tr><td>{a}</td><td>{b}</td><td class="en">{e(c)}</td><td>{p}</td></tr>' for a, b, c, p in rows)
    return f'<section class="part akey"><h3>解答一覧　予想問題 第{R}回</h3><table class="sum"><tr><th>大問</th><th>設問</th><th>解答（番号）</th><th>配点</th></tr>{tr}<tr><td colspan="3" style="text-align:right">合計</td><td>{total(D)}</td></tr></table><div style="font-size:8.6pt">配点：I〔1〕各3点・〔2〕各2点・〔3〕4点／II〔1〕各3点・〔2〕各2点／III 各3点／IV 各2点／V 各2点（独自配点）。</div></section>'

def mc_list(items, show_q='question'):
    out = ''
    for it in items:
        q = f'<span class="en">{e(it.get(show_q, ""))}</span> ' if it.get(show_q) else ''
        out += li(f'<b>({it["label"]})</b> {q}→ {ans(it["answer"], it["choices"][it["answer"]])}<br>{em(it["why"])}')
    return f'<ul>{out}</ul>'

def trans_vocab(P):
    out = '<h4>全訳</h4><div class="trs">' + ''.join(f'<p>{e(p)}</p>' for p in P['translation']) + '</div>'
    return out + '<h4>重要語句</h4><table class="voc">' + ''.join(f'<tr><td>{e(a)}</td><td>{e(b)}</td></tr>' for a, b in P['vocab']) + '</table>'

def akey_I(P):
    out = f'<section class="part akey"><h3>I　解答・解説（{POINTS["I"]}点）</h3>'
    out += '<h4>〔1〕（各3点）</h4>' + box(mc_list(P['q1']['items']))
    tf = ''.join(li(f'<b>({i})</b> <span class="tfl">{e(it["text"])}</span><br><span class="ans">{TF[it["answer"]]}</span>：{em(it["why"])}') for i, it in enumerate(P['q2']['items'], 1))
    out += '<h4>〔2〕（各2点）</h4>' + box(f'<ul>{tf}</ul>')
    q3 = P['q3']
    rs = ''.join(li(f'<b>({i + 1})</b> <span class="tfl">{e(c)}</span><br>{em(r)}') for i, (c, r) in enumerate(zip(q3['choices'], q3['reasons'])))
    out += '<h4>〔3〕（4点）</h4>' + box(f'<div>正解　{ans(q3["answer"], q3["choices"][q3["answer"]])}</div><ul>{rs}</ul>')
    return out + trans_vocab(P) + '</section>'

def akey_II(P):
    out = f'<section class="part akey"><h3>II　解答・解説（{POINTS["II"]}点）</h3>'
    out += '<h4>〔1〕空所補充（各3点）</h4>' + box(mc_list(P['q1']['items'], 'none'))
    out += '<h4>〔2〕下線部の意味・内容（各2点）</h4>' + box(mc_list(P['q2']['items'], 'word'))
    return out + trans_vocab(P) + '</section>'

def akey_III(P):
    out = f'<section class="part akey"><h3>III　解答・解説（{POINTS["III"]}点）</h3>'
    for n, d in enumerate(P['dialogues'], 1):
        rs = ''.join(li(f'<b>({k})</b> → {ans(v, d["choices"][v])}<br>{em(d["why"][k])}') for k, v in d['answers'].items())
        used = set(d['answers'].values())
        unused = '・'.join(f'({i + 1})' for i in range(len(d['choices'])) if i not in used)
        out += f'<h4>〔{n}〕 {e(d["title"])}（各3点）</h4>' + box(f'<ul>{rs}</ul><div style="margin-top:1mm"><span class="lbl">使わない選択肢</span>{unused}：{em(d["unused"])}</div>')
        out += '<div class="trs">' + ''.join(f'<p>{e(x)}</p>' for x in d['translation']) + '</div>'
    return out + '</section>'

def akey_IV(P):
    rs = ''.join(li(f'<b>({it["label"]})</b> <span class="en">{e(it["text"])}</span><br>→ {ans(it["answer"], it["choices"][it["answer"]])}：{em(it["why"])}') for it in P['items'])
    return f'<section class="part akey"><h3>IV　解答・解説（{POINTS["IV"]}点）</h3>' + box(f'<ul>{rs}</ul>') + '</section>'

def akey_V(P):
    a = ''.join(li(f'<b>({it["label"]})</b> <span class="en">{e(it["text"])}</span><br>→ {ans(it["answer"], it["choices"][it["answer"]])}：{em(it["why"])}') for it in P['q1']['items'])
    b = ''.join(li(f'<b>({it["label"]})</b> <span class="en">{e(strip(it["text"]))}</span><br>→ {ans(it["answer"], it["choices"][it["answer"]])}：{em(it["why"])}') for it in P['q2']['items'])
    return (f'<section class="part akey"><h3>V　解答・解説（{POINTS["V"]}点）</h3><h4>〔1〕空所補充（各2点）</h4>' + box(f'<ul>{a}</ul>')
            + '<h4>〔2〕同意語（各2点）</h4>' + box(f'<ul>{b}</ul>') + '</section>')

def total(D):
    I, II, III, IV, V = (D[k] for k in ('I', 'II', 'III', 'IV', 'V'))
    return (3 * len(I['q1']['items']) + 2 * len(I['q2']['items']) + 4 + 3 * len(II['q1']['items']) + 2 * len(II['q2']['items'])
            + 3 * sum(len(d['answers']) for d in III['dialogues']) + 2 * len(IV['items']) + 2 * (len(V['q1']['items']) + len(V['q2']['items'])))

def check_points(D):
    I, II, III, IV, V = (D[k] for k in ('I', 'II', 'III', 'IV', 'V'))
    assert 3 * len(I['q1']['items']) + 2 * len(I['q2']['items']) + 4 == POINTS['I']
    assert 3 * len(II['q1']['items']) + 2 * len(II['q2']['items']) == POINTS['II']
    assert 3 * sum(len(d['answers']) for d in III['dialogues']) == POINTS['III']
    assert 2 * len(IV['items']) == POINTS['IV'] and 2 * (len(V['q1']['items']) + len(V['q2']['items'])) == POINTS['V']
    assert total(D) == 120 == sum(POINTS.values())

def write(doc, out):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    css = [CSS(string=mono(kb.CSS_TEXT + RITSU_CSS), font_config=FC)]
    HTML(string=mono(doc), base_url=str(HERE)).write_pdf(out, stylesheets=css, font_config=FC, metadata={'author': 'マナトビ'})
    return out

def load(R): return importlib.import_module(f'rm{R}').DATA

def build_q(R):
    D = load(R); check_points(D)
    body = cover(R, 'q') + part_I(D['I']) + part_II(D['II']) + part_III(D['III']) + part_IV(D['IV']) + part_V(D['V']) + sheet(D, R) + colophon(R, 'q')
    return write(f'<html lang="ja"><head><meta charset="utf-8"><title>予想問題 第{R}回 英語 問題</title></head><body>{body}</body></html>', OUT_DIR / f'manatobi_ritsu_eng_yoso{R}_mondai.pdf')

def build_a(R):
    D = load(R); check_points(D)
    body = cover(R, 'a') + summary(D, R) + akey_I(D['I']) + akey_II(D['II']) + akey_III(D['III']) + akey_IV(D['IV']) + akey_V(D['V']) + colophon(R, 'a')
    return write(f'<html lang="ja"><head><meta charset="utf-8"><title>予想問題 第{R}回 英語 解答・解説</title></head><body>{body}</body></html>', OUT_DIR / f'manatobi_ritsu_eng_yoso{R}_kaitou.pdf')

def page_range(pdf, kind):
    n = int(re.search(r'Pages:\s+(\d+)', subprocess.run(['pdfinfo', str(pdf)], capture_output=True, text=True).stdout).group(1))
    if kind == 'a': return f'（1〜{n - 2}ページ）'
    for p in range(2, n + 1):
        t = subprocess.run(['pdftotext', '-f', str(p), '-l', str(p), str(pdf), '-'], capture_output=True, text=True).stdout
        if '解答用紙' in t and '受験番号' in t: return f'（問題部分 1〜{p - 2}ページ・解答用紙 {p - 1}ページ）'
    raise SystemExit('解答用紙のページが見つからない')

if __name__ == '__main__':
    R = sys.argv[1] if len(sys.argv) > 1 else '1'
    for kind, f in (('q', build_q), ('a', build_a)):
        o = f(R); PAGE_INFO[(R, kind)] = page_range(o, kind)
        o = f(R); print(o.name, o.stat().st_size // 1024, 'KB', PAGE_INFO[(R, kind)])
