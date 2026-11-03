# -*- coding: utf-8 -*-
"""東北大学 前期 英語 予想問題の PDF（問題／解答・解説）を作る。白黒・A4縦。
紙面の部品・書体・白黒化は神戸大（../kobe_mock/render.py）と北大（../hokudai_mock/render.py）の部品を読み込んで流用する。
  python3 render.py 1   → .tmpwork/tohoku_mock/manatobi_tohoku_eng_yoso1_{mondai,kaitou}.pdf
データ：tN.py（N＝回）。Ⅰ・Ⅱ 長文読解／Ⅲ 会話文（語義＋意見 60〜80語）／Ⅳ 日本文（和文英訳＋語句整序2題）。
本文の記法：{u1|…} 下線部(1)・{gア|…} 文法正誤の下線・{wa|…} 語義の下線・{o5} 並べ替え・[[I]] 空欄・[[①]] 文挿入・*word 注。
"""
import sys, re, os, importlib, importlib.util, subprocess
from pathlib import Path
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(HERE))
def _load(name, rel):
    sp = importlib.util.spec_from_file_location(name, HERE.parent / rel)
    m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m); return m
kb = _load('kb', 'kobe_mock/render.py')
hk = _load('hk', 'hokudai_mock/render.py')
from weasyprint import HTML, CSS
e, mono, FC, genko, crit_table = kb.e, kb.mono, kb.FC, kb.genko, kb.crit_table
OUT_DIR = Path(os.environ.get('TOHOKU_OUT_DIR', str(ROOT / '.tmpwork/tohoku_mock')))
L = 'ABCDEFGHIJ'
DISCLAIMER = '東北大学の過去問・公式問題ではありません。予想問題であり，大学とは関係がありません。'
POINTS = {'I': 60, 'II': 50, 'III': 40, 'IV': 50}
RN = {'I': 'Ⅰ', 'II': 'Ⅱ', 'III': 'Ⅲ', 'IV': 'Ⅳ'}
PAGE_INFO = {}

def em(s):
    t = kb.em(s)
    t = re.sub(r'(?<![A-Za-z"=])\(([F-J])\)', r'<span class="x-b">(\1)</span>', t)
    t = re.sub(r'\(([ア-コ])\)', r'<span class="x-b">(\1)</span>', t)
    t = re.sub(r'(?<![A-Za-z])\(([a-d])\)', r'<span class="x-b">(\1)</span>', t)
    t = re.sub(r'([①②③])', r'<span class="x-b">\1</span>', t)
    return t

def order_html(q, n):
    ws = '　'.join(f'({L[i]}) {e(w)}' for i, w in enumerate(q['words']))
    return f'<span class="lab">({n})</span><span class="ul">[ {ws} ]</span>'

def mark(t, orders=None):
    t = e(t)
    t = re.sub(r'\{u(\d)\|([^}]*)\}', r'<span class="lab">(\1)</span><span class="ul">\2</span>', t)
    t = re.sub(r'\{g([ア-コ])\|([^}]*)\}', r'<span class="lab">(\1)</span><span class="ul">\2</span>', t)
    t = re.sub(r'\{w([a-d1-4])\|([^}]*)\}', r'<span class="lab">(\1)</span><span class="ul">\2</span>', t)
    t = re.sub(r'\{o(\d)\}', lambda m: order_html(orders[m.group(1)], m.group(1)), t)
    t = re.sub(r'\[\[(I|II|III)\]\]', r'<span class="blank">(&#8194;\1&#8194;)</span>', t)
    t = re.sub(r'\[\[([あいうえおかきく①②③])\]\]', r'<span class="blank">［&#8194;\1&#8194;］</span>', t)
    return re.sub(r'\*(?=[A-Za-z])', '<sup class="ast">*</sup>', t)

def orders_of(P):
    return {str(q['under']): q for q in P.get('questions', []) if q['kind'] == 'order'}

def filled(P):
    """本文の空欄・並べ替え・挿入を正解で埋めたプレーンテキスト（語数・難易度の計測用）"""
    od = orders_of(P); fill = {}
    for q in P.get('questions', []):
        if q['kind'] == 'mc1' and q.get('blank'): fill[q['blank']] = q['choices'][q['answer']]
        if q['kind'] == 'insert':
            for k, v in q['answer'].items(): fill[k] = q['choices'][v]
    out = []
    for p in P['passage']:
        p = re.sub(r'\{o(\d)\}', lambda m: od[m.group(1)]['sentence_part'], p)
        p = re.sub(r'\{[ugw][^|]*\|([^}]*)\}', r'\1', p)
        p = re.sub(r'\[\[([^\]]+)\]\]', lambda m: fill.get(m.group(1), ''), p)
        out.append(p.replace('*', ''))
    return out

H_CSS = hk.H_CSS + """
.syn { display: grid; grid-template-columns: 26mm repeat(4, 1fr); margin: .8mm 0 0 12mm; font-family: 'Noto Serif'; font-size: 10pt; }
.syn .w { font-weight: 700; }
.frame-en { font-family: 'Noto Serif'; font-size: 10.3pt; line-height: 2.1; margin: 1.5mm 0 0 12mm; }
.opts10 { display: grid; grid-template-columns: repeat(5, 1fr); font-family: 'Noto Serif'; font-size: 10pt; line-height: 1.8; margin: 1mm 0 0 12mm; }
.jpas p { font-family: 'Noto Serif CJK JP'; text-indent: 1em; font-size: 10.3pt; line-height: 1.95; margin: 0; }
.ftab { border-collapse: collapse; margin: 1.5mm 0 1mm 12mm; font-size: 9.6pt; width: 150mm; }
.conv .ln { grid-template-columns: 37mm 1fr; }
.ftab td, .ftab th { border: .6pt solid #000; padding: 1.2mm 2mm; vertical-align: top; }
.ftab th { background: #eee; font-family: 'Noto Sans CJK JP'; font-weight: 700; }
"""

def cover(R, kind):
    sub = '問題' if kind == 'q' else '解答・解説'
    rng = PAGE_INFO.get((R, kind), '')
    pts = 'Ⅰ 60点・Ⅱ 50点・Ⅲ 40点・Ⅳ 50点（計200点）'
    if kind == 'q':
        items = [f'問題部分と解答用紙で構成されている{rng}。答えは解答用紙の決められた欄に書くこと。',
                 '試験時間の目安は100分。大問はⅠ〜Ⅳの4題。',
                 f'配点は {pts}。本予想問題が独自に定めた配点である。',
                 '本冊子の英文・日本文・設問はすべてオリジナルである。登場する人物・団体・地名は架空。']
    else:
        items = [f'解答一覧・大問ごとの解答と解説{rng}。',
                 '和訳・日本語の説明・英訳は，要素ごとの採点基準と別解を示した。',
                 '意見を書く問題（60〜80語）は，採点観点と複数の解答例を示した。',
                 '長文・会話文は全訳と重要語句つき。',
                 f'配点は {pts}。本予想問題が独自に定めた配点で，大学の配点ではない。']
    lis = ''.join(f'<li>{x}</li>' for x in items)
    return f"""<section class="ocover">
<div class="brand"><img src="file://{HERE}/logo_gray.png"><div class="kicker">学習アプリ マナトビ</div></div>
<div class="box">{R}</div>
<div class="l1">予想問題 第{R}回</div>
<div class="l2">前期日程 対策</div>
<h1>英語{'問題' if kind == 'q' else '解答'}</h1>
<div class="sub">東北大学（全学部共通）の出題形式に準拠 ／ {sub}</div>
<div class="chui"><span class="ttl">注　意</span><ol>{lis}</ol></div>
<div class="disc">{DISCLAIMER}<br>本冊子は過去の出題形式を分析して作成した練習用の教材です。</div>
<div class="foot"><span>学習アプリ マナトビ</span><span>予想問題 第{R}回 ／ {sub}</span></div></section>"""

def head(n, title):
    return f'<div class="parthead" data-run="{RN[n]}　{title}"><span class="roman">{RN[n]}</span><span class="t">{title}（配点 {POINTS[n]}点）</span></div>'

def notes_html(notes):
    if not notes: return ''
    rows = ''.join(f'<tr><td class="en">*{e(a)}</td><td>{e(b)}</td></tr>' for a, b in notes)
    return f'<div class="notes"><div class="nh"></div><table>{rows}</table></div>'

def choices(chs):
    return '<div class="choices">' + ''.join(f'<div><span class="k">({L[i]})</span><span>{e(c)}</span></div>' for i, c in enumerate(chs)) + '</div>'

def syn_rows(items):
    return ''.join(f'<div class="syn"><span class="w">({it["label"]}) {e(it["word"])}</span>' + ''.join(f'<span>({L[i]}) {e(c)}</span>' for i, c in enumerate(it['choices'])) + '</div>' for it in items)

def ftable(q):
    rows = ''.join('<tr>' + ''.join(f'<td>{mark(c)}</td>' for c in r) + '</tr>' for r in q['rows'])
    hd = ''.join(f'<th>{e(h)}</th>' for h in q['header'])
    return f'<table class="ftab"><tr>{hd}</tr>{rows}</table>' + choices(q['options'])

def q_html(q):
    k = q['kind']
    body = ''
    if k in ('mc1', 'tf2', 'insert'): body = choices(q['choices'])
    elif k == 'synonym': body = syn_rows(q['items'])
    elif k == 'table': body = ftable(q)
    return f'<div class="hq"><div class="stem"><span class="qn">問 {q["no"]}</span><span>{e(q["stem"])}</span></div>{body}</div>'

INTRO = '以下の英文を読み，後の問いに答えなさい。'

def part_RC(P, n):
    od = orders_of(P)
    paras = ''.join(f'<p>{mark(p, od)}</p>' for p in P['passage'])
    src = f'<div style="text-align:right;font-size:8.6pt;margin-top:1mm">{e(P["credit"])}</div>' if P.get('credit') else ''
    return (f'<section class="part">{head(n, "長文読解")}<p class="intro">{INTRO}</p>'
            f'<div class="passage">{paras}</div>{src}{notes_html(P.get("notes"))}' + ''.join(q_html(q) for q in P['questions']) + '</section>')

def part_3(P):
    lines = ''.join(f'<div class="ln"><span class="sp">{e(s)}:</span><span>{mark(t)}</span></div>' for s, t in P['lines'])
    q1, q2 = P['q1'], P['q2']
    return (f'<section class="part">{head("III", "会話文・意見論述")}<p class="intro" style="font-family:Noto Serif;text-indent:0">{e(P["lead"])}</p>'
            f'<div class="conv">{lines}</div>{notes_html(P.get("notes"))}'
            f'<div class="enq"><div class="qh">1)</div><div>{e(q1["stem"])}</div>{syn_rows(q1["items"])}'
            f'<div class="qh">2)</div><div>{e(q2["stem"])}</div></div></section>')

def frame_en(q):
    slots = ' '.join(f'(&#8194;{q["marks"].get(str(i + 1), "&#8195;")}&#8194;)' for i in range(len(q['correct'])))
    return f'<div class="frame-en">{e(q["pre"])} {slots} {e(q["post"])}</div>'

def opts10(q):
    return '<div class="opts10">' + ''.join(f'<div>({L[i]}) {e(w)}</div>' for i, w in enumerate(q['options'])) + '</div>'

def part_4(P):
    paras = ''.join(f'<p>{mark(p)}</p>' for p in P['passage'])
    qs = ''
    for q in P['questions']:
        qs += f'<div class="hq"><div class="stem"><span class="qn">問 {q["no"]}</span><span>{e(q["stem"])}</span></div>'
        if q['kind'] == 'order_en': qs += frame_en(q) + opts10(q)
        qs += '</div>'
    src = f'<div style="text-align:right;font-size:8.6pt;margin-top:1mm">{e(P["credit"])}</div>' if P.get('credit') else ''
    return (f'<section class="part">{head("IV", "日本文の英訳・語句整序")}<p class="intro">以下の日本文を読み，後の問いに答えなさい。</p>'
            f'<div class="jpas">{paras}</div>{src}{qs}</section>')

def lab_cells(items): return '　'.join(f'({it["label"]})［　　］' for it in items)
def syn_ans(items): return '　'.join(f'({it["label"]}) ({L[it["answer"]]})' for it in items)

def sheet(D, R):
    H4 = '<h4 style="font-family:MPR;font-weight:800;margin:3mm 0 1mm">{}</h4>'
    out = f'<section class="sheet"><h2>解答用紙　予想問題 第{R}回</h2><div style="font-size:8.6pt;margin-bottom:2mm">受験番号・氏名欄は省略。記号は (A) のように書く。</div>'
    for n in ('I', 'II'):
        out += H4.format(RN[n])
        for q in D[n]['questions']:
            k, h = q['kind'], f'<span class="h">問 {q["no"]}</span>'
            if k in ('trans', 'ja_free'): out += f'<div class="row lines">{h}<span></span></div>'
            elif k in ('tf2', 'gram2'): out += f'<div class="row">{h}<span>［　　　］［　　　］</span></div>'
            elif k == 'order': out += f'<div class="row">{h}<span>{"　".join(f"{p}番目［　　　］" for p in q["ask"])}</span></div>'
            elif k == 'synonym': out += f'<div class="row">{h}<span>{lab_cells(q["items"])}</span></div>'
            elif k == 'insert': out += f'<div class="row">{h}<span>{"　".join(f"［{s}］［　　］" for s in q["answer"])}</span></div>'
            elif k == 'table': out += f'<div class="row">{h}<span>{"　".join(f"（{s}）［　　］" for s in q["answer"])}</span></div>'
            else: out += f'<div class="row">{h}<span>［　　　］</span></div>'
    P3 = D['III']
    out += '</section><section class="sheet"><h2>解答用紙（Ⅲ・Ⅳ）</h2>' + H4.format('Ⅲ')
    out += f'<div class="row"><span class="h">1)</span><span>{lab_cells(P3["q1"]["items"])}</span></div>'
    out += H4.format('Ⅲ 2)（60〜80語）') + hk.wlines(9) + H4.format('Ⅳ')
    for q in D['IV']['questions']:
        if q['kind'] == 'trans_en': out += f'<div class="row lines"><span class="h">問 {q["no"]}</span><span></span></div>'
        else: out += f'<div class="row"><span class="h">問 {q["no"]}</span><span>{"　".join(f"{m}［　　］" for m in q["marks"].values())}</span></div>'
    return out + '</section>'

def colophon(R, kind):
    return f"""<section class="colophon"><div class="box"><h2>奥付</h2>
<div>予想問題 第{R}回　英語　{'問題' if kind == 'q' else '解答・解説'}</div>
<div>対象：東北大学 前期日程 英語（全学部共通）の受験準備</div>
<div>作成：学習アプリ マナトビ 編集部（2026年10月）</div>
<div>作成方法：2024〜2026年度の出題形式・語数・難易度を分析し，英文・日本文・設問をすべて新たに書き下ろした。</div>
<div class="disc">{DISCLAIMER}</div>
<div style="margin-top:2.5mm;font-size:8.4pt">本冊子の英文・日本文は実在の記事・書籍・論文からの引用・翻案ではありません。登場する人物・団体・地名は架空です。無断転載・再配布を禁じます。</div>
<img src="file://{HERE}/logo_gray.png"></div></section>"""

# ---------------------------------------------------------------- 解答・解説
def ans_short(q):
    k = q['kind']
    if k == 'mc1': return f'({L[q["answer"]]})'
    if k == 'tf2': return '・'.join(f'({L[i]})' for i in sorted(q['answer']))
    if k == 'gram2': return '・'.join(f'({x})' for x in q['answer'])
    if k == 'order': return '　'.join(f'{p}番目 ({q["correct"][p - 1]})' for p in q['ask'])
    if k == 'synonym': return '　'.join(f'({it["label"]}) ({L[it["answer"]]})' for it in q['items'])
    if k in ('insert', 'table'): return '　'.join(f'{"［" + s + "］" if k == "insert" else "（" + s + "）"} ({L[v]})' for s, v in q['answer'].items())
    if k == 'order_en': return '　'.join(f'{m} ({q["correct"][int(i) - 1]})' for i, m in q['marks'].items())
    return q.get('answer', '')

def box(inner): return f'<div class="abox">{inner}</div>'

def model_block(q, en=False):
    c = ' en' if en else ''
    out = f'<div><span class="lbl">{"解答例" if en else "模範解答"}</span><span class="ans{c}">{e(q["answer"])}</span></div>'
    for a in q.get('alts', []): out += f'<div style="margin-top:.8mm"><span class="lbl">別解</span><span class="x-ul{c}">{e(a)}</span></div>'
    return out

def wc(m): return len(re.findall(r"[A-Za-z0-9][A-Za-z0-9’'-]*", m))
def ul(items): return '<ul>' + ''.join(f'<li>{em(x)}</li>' for x in items) + '</ul>'

def akey_q(q):
    k = q['kind']
    out = f'<h4>問 {q["no"]}（{q["points"]}点）</h4>'
    if k in ('mc1', 'tf2', 'insert'):
        li = ''.join(f'<li><b>({L[i]})</b> {e(c)}<br>{em(r)}</li>' for i, (c, r) in enumerate(zip(q['choices'], q['reasons'])))
        return out + box(f'<div class="ans">正解　{ans_short(q)}</div><ul>{li}</ul>' + (f'<div style="margin-top:1mm">{em(q["note"])}</div>' if q.get('note') else ''))
    if k == 'gram2':
        li = ''.join(f'<li><b>({lab})</b> <span class="en">{e(w)}</span>：{em(r)}</li>' for lab, w, r in q['reasons'])
        return out + box(f'<div class="ans">正解　{ans_short(q)}</div><ul>{li}</ul>')
    if k == 'order':
        return out + box(f'<div class="ans">正解　{ans_short(q)}</div><div class="en" style="margin-top:1mm">完成文：<span class="x-ul">{e(q["sentence"])}</span></div>'
                         f'<div style="font-size:8.6pt">並び：{" ".join("(" + x + ")" for x in q["correct"])}</div>' + ul(q['explain']))
    if k == 'synonym':
        li = ''.join(f'<li><b>({it["label"]}) {e(it["word"])}</b> → <b>({L[it["answer"]]}) {e(it["choices"][it["answer"]])}</b>：{em(it["reason"])}</li>' for it in q['items'])
        return out + box(f'<div class="ans">正解　{ans_short(q)}</div><ul>{li}</ul>')
    if k == 'table':
        return out + box(f'<div class="ans">正解　{ans_short(q)}</div>' + ul(q['explain']))
    return out + box(model_block(q) + crit_table(q['criteria']) + ul(q['explain']))

def akey_RC(P, n):
    out = f'<section class="part akey"><h3>{RN[n]}　解答・解説（{POINTS[n]}点）</h3>' + ''.join(akey_q(q) for q in P['questions'])
    out += '<h4>全訳</h4><div class="trs">' + ''.join(f'<p>{e(p)}</p>' for p in P['translation']) + '</div>'
    return out + '<h4>重要語句</h4><table class="voc">' + ''.join(f'<tr><td>{e(a)}</td><td>{e(b)}</td></tr>' for a, b in P['vocab']) + '</table></section>'

def akey_3(P):
    q1, q2 = P['q1'], P['q2']
    out = f'<section class="part akey"><h3>Ⅲ　解答・解説（{POINTS["III"]}点）</h3><h4>1)（{q1["points"]}点・各{q1["points"] // len(q1["items"])}点）</h4>'
    li = ''.join(f'<li><b>({it["label"]}) {e(it["word"])}</b> → <b>({L[it["answer"]]}) {e(it["choices"][it["answer"]])}</b>：{em(it["reason"])}</li>' for it in q1['items'])
    out += box(f'<div class="ans">正解　{syn_ans(q1["items"])}</div><ul>{li}</ul>')
    ms = ''.join(f'<div style="margin-top:1.5mm"><span class="lbl">解答例：{e(lab)}</span></div><div class="model">{e(m)} <span class="wc">（{wc(m)}語）</span></div>' for lab, m in q2['models'])
    out += f'<h4>2)（{q2["points"]}点）</h4>' + box(f'<div class="en" style="font-size:9.2pt">{e(q2["stem"])}</div>' + crit_table(q2['criteria']) + ms)
    out += '<h4>書き方のポイント・減点されやすい点</h4>' + box(ul(q2['tips']))
    out += '<h4>会話文の全訳</h4><div class="trs">' + ''.join(f'<p>{e(s)}：{e(t)}</p>' for (s, _), t in zip(P['lines'], P['translation'])) + '</div>'
    return out + '<h4>重要語句</h4><table class="voc">' + ''.join(f'<tr><td>{e(a)}</td><td>{e(b)}</td></tr>' for a, b in P['vocab']) + '</table></section>'

def akey_4(P):
    out = f'<section class="part akey"><h3>Ⅳ　解答・解説（{POINTS["IV"]}点）</h3>'
    for q in P['questions']:
        out += f'<h4>問 {q["no"]}（{q["points"]}点）</h4>'
        if q['kind'] == 'trans_en':
            out += box(f'<div style="font-size:9pt">下線部：{e(q["source"])}</div>' + model_block(q, en=True) + crit_table(q['criteria']) + ul(q['explain']))
        else:
            sent = q['pre'] + ' ' + ' '.join(q['options'][L.index(c)] for c in q['correct']) + ' ' + q['post']
            unused = [w for i, w in enumerate(q['options']) if L[i] not in q['correct']]
            out += box(f'<div class="ans">正解　{ans_short(q)}</div><div class="en" style="margin-top:1mm">完成文：<span class="x-ul">{e(sent)}</span></div>'
                       f'<div style="font-size:8.6pt">使わない語句：{"，".join(e(w) for w in unused)}</div>' + ul(q['explain']))
    return out + '</section>'

def summary(D, R):
    rows = ''
    for n in ('I', 'II'):
        for q in D[n]['questions']:
            a = ans_short(q) if q['kind'] not in ('trans', 'ja_free') else '解説参照（模範解答・採点基準つき）'
            rows += f'<tr><td>{RN[n]}</td><td>問 {q["no"]}</td><td>{e(a)}</td><td>{q["points"]}</td></tr>'
    q1 = D['III']['q1']
    rows += f'<tr><td>Ⅲ</td><td>1)</td><td>{e(syn_ans(q1["items"]))}</td><td>{q1["points"]}</td></tr>'
    rows += f'<tr><td>Ⅲ</td><td>2)</td><td>解答例は解説参照（採点観点つき）</td><td>{D["III"]["q2"]["points"]}</td></tr>'
    for q in D['IV']['questions']:
        a = ans_short(q) if q['kind'] == 'order_en' else '解答例は解説参照（採点基準つき）'
        rows += f'<tr><td>Ⅳ</td><td>問 {q["no"]}</td><td>{e(a)}</td><td>{q["points"]}</td></tr>'
    return f'<section class="part akey"><h3>解答一覧　予想問題 第{R}回</h3><table class="sum"><tr><th>大問</th><th>設問</th><th>解答</th><th>配点</th></tr>{rows}<tr><td colspan="3" style="text-align:right">合計</td><td>200</td></tr></table></section>'

def check_points(D):
    for n in ('I', 'II', 'IV'):
        s = sum(q['points'] for q in D[n]['questions']); assert s == POINTS[n], (n, s)
        for q in D[n]['questions']:
            if 'criteria' in q: assert sum(p for _, p in q['criteria']) == q['points'], (n, q['no'])
    P3 = D['III']; assert P3['q1']['points'] + P3['q2']['points'] == POINTS['III']
    assert sum(p for _, p in P3['q2']['criteria']) == P3['q2']['points']

def write(doc, out):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    css = [CSS(string=mono(kb.CSS_TEXT + H_CSS), font_config=FC)]
    HTML(string=mono(doc), base_url=str(HERE)).write_pdf(out, stylesheets=css, font_config=FC, metadata={'author': 'マナトビ'})
    return out

def load(R): return importlib.import_module(f't{R}').DATA

def build_q(R):
    D = load(R); check_points(D)
    body = cover(R, 'q') + part_RC(D['I'], 'I') + part_RC(D['II'], 'II') + part_3(D['III']) + part_4(D['IV']) + sheet(D, R) + colophon(R, 'q')
    return write(f'<html lang="ja"><head><meta charset="utf-8"><title>予想問題 第{R}回 英語 問題</title></head><body>{body}</body></html>', OUT_DIR / f'manatobi_tohoku_eng_yoso{R}_mondai.pdf')

def build_a(R):
    D = load(R); check_points(D)
    body = cover(R, 'a') + summary(D, R) + akey_RC(D['I'], 'I') + akey_RC(D['II'], 'II') + akey_3(D['III']) + akey_4(D['IV']) + colophon(R, 'a')
    return write(f'<html lang="ja"><head><meta charset="utf-8"><title>予想問題 第{R}回 英語 解答・解説</title></head><body>{body}</body></html>', OUT_DIR / f'manatobi_tohoku_eng_yoso{R}_kaitou.pdf')

if __name__ == '__main__':
    R = sys.argv[1] if len(sys.argv) > 1 else '1'
    for kind, f in (('q', build_q), ('a', build_a)):
        o = f(R); PAGE_INFO[(R, kind)] = hk.page_range(o, kind)
        o = f(R); print(o.name, o.stat().st_size // 1024, 'KB', PAGE_INFO[(R, kind)])
