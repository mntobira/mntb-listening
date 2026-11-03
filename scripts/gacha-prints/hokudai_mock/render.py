# -*- coding: utf-8 -*-
"""北海道大学 前期 英語 予想問題の PDF（問題／解答・解説）を作る。白黒・A4縦。
紙面の部品・書体・白黒化は神戸大の render.py（../kobe_mock/render.py）を読み込んで流用する。
  python3 render.py 1   → .tmpwork/hokudai_mock/manatobi_hokudai_eng_yoso1_{mondai,kaitou}.pdf
データ：hN.py（N＝回）。大問1・2 長文読解／3 英文＋英語で答える問題（A・B 文の完成、C 意見 70〜100語）／4 会話文と要約（空所12）。
本文の記法：{u1|…} 下線部(1)・( ア ) 空所・*1 注・[[1]] 要約の空所・____ 英文完成の空所。
"""
import sys, re, os, importlib, importlib.util, subprocess
from pathlib import Path
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(HERE))
_spec = importlib.util.spec_from_file_location('kb', HERE.parent / 'kobe_mock/render.py')
kb = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(kb)
from weasyprint import HTML, CSS
e, mono, FC, genko, crit_table = kb.e, kb.mono, kb.FC, kb.genko, kb.crit_table
OUT_DIR = Path(os.environ.get('HOKUDAI_OUT_DIR', str(ROOT / '.tmpwork/hokudai_mock')))
L = 'ABCDEFGH'
DISCLAIMER = '北海道大学の過去問・公式問題ではありません。予想問題であり，大学とは関係がありません。'
POINTS = {'1': 42, '2': 42, '3': 42, '4': 24}
PAGE_INFO = {}

def em(s):
    t = kb.em(s)
    t = re.sub(r'(?<![A-Za-z"=])\(([F-Z])\)', r'<span class="x-b">(\1)</span>', t)
    t = re.sub(r'（(ア|イ|ウ|エ)）|\(\s*(ア|イ|ウ|エ)\s*\)', lambda m: f'<span class="x-b">( {m.group(1) or m.group(2)} )</span>', t)
    return t

def mark(t):
    t = e(t)
    t = re.sub(r'\{u(\d)\|([^}]*)\}', r'<span class="lab">(\1)</span><span class="ul">\2</span>', t)
    t = re.sub(r'\(\s*(ア|イ|ウ|エ)\s*\)', r'<span class="blank">(&#8194;\1&#8194;)</span>', t)
    t = re.sub(r'\[\[(\d+)\]\]', r'<span class="blank">(&#8194;\1&#8194;)</span>', t)
    t = re.sub(r'_{3,}', '<span class="fill"></span>', t)
    t = re.sub(r'\*(\d)', r'<sup class="ast">*\1</sup>', t)
    return re.sub(r'\*', '<sup class="ast">*</sup>', t)

def strip(t):
    t = re.sub(r'\{u\d\|([^}]*)\}', r'\1', t)
    return re.sub(r'\*\d?', '', t)

H_CSS = """
.ocover { page: cover; height: 297mm; position: relative; background: #fff; overflow: hidden; font-family: 'Noto Serif CJK JP', serif; }
.ocover .brand { position: absolute; top: 12mm; left: 18mm; right: 18mm; display: flex; justify-content: space-between; align-items: center; border-bottom: .6pt solid #999; padding-bottom: 2.5mm; }
.ocover .brand img { width: 34mm; }
.ocover .brand .kicker { font-family: 'MPR'; font-weight: 700; font-size: 7.6pt; letter-spacing: .16em; color: #555; }
.ocover .box { position: absolute; top: 24mm; right: 24mm; border: .8pt solid #000; width: 11mm; height: 8mm; text-align: center; font-size: 11pt; line-height: 8mm; }
.ocover .l1 { position: absolute; top: 44mm; left: 0; right: 0; text-align: center; font-size: 13pt; letter-spacing: .5em; padding-left: .5em; }
.ocover .l2 { position: absolute; top: 56mm; left: 0; right: 0; text-align: center; font-family: 'Noto Sans CJK JP'; font-weight: 700; font-size: 13pt; letter-spacing: .5em; padding-left: .5em; }
.ocover h1 { position: absolute; top: 69mm; left: 0; right: 0; margin: 0; text-align: center; font-family: 'Noto Serif CJK JP'; font-weight: 900; font-size: 27pt; letter-spacing: .55em; padding-left: .55em; }
.ocover .sub { position: absolute; top: 88mm; left: 0; right: 0; text-align: center; font-family: 'MPR'; font-weight: 700; font-size: 9.2pt; color: #333; letter-spacing: .05em; }
.ocover .chui { position: absolute; top: 102mm; left: 26mm; right: 26mm; border-top: .6pt solid #000; padding-top: 2mm; font-size: 9.6pt; line-height: 1.75; }
.ocover .chui .ttl { display: inline-block; border: .6pt solid #000; padding: 0 2mm; font-family: 'Noto Sans CJK JP'; font-weight: 700; margin-bottom: 1.5mm; }
.ocover .chui ol { margin: 0; padding-left: 6mm; }
.ocover .disc { position: absolute; top: 236mm; left: 26mm; right: 26mm; background: #ededed; border-left: 1.8mm solid #1a1a1a; padding: 3mm 5mm; font-family: 'Noto Sans CJK JP'; font-size: 9pt; font-weight: 700; line-height: 1.7; }
.ocover .foot { position: absolute; bottom: 12mm; left: 22mm; right: 22mm; display: flex; justify-content: space-between; font-family: 'Noto Sans CJK JP'; font-size: 7.6pt; color: #555; border-top: 1px solid #999; padding-top: 2mm; }
.hq { margin: 4.5mm 0 0; break-inside: avoid-page; }
.hq .stem { display: grid; grid-template-columns: 12mm 1fr; }
.hq .qn { font-family: 'Noto Serif CJK JP'; white-space: nowrap; }
.hq .choices { margin-left: 12mm; }
.fill { display: inline-block; width: 46mm; border-bottom: .8pt solid #000; height: 1em; vertical-align: -1pt; margin: 0 1mm; }
.enq { font-family: 'Noto Serif'; font-size: 10.5pt; line-height: 1.95; margin: 3mm 0 0; }
.enq .qh { font-weight: 700; margin-top: 3.5mm; }
.enq .frame { margin: 1mm 0 0 6mm; }
.conv { font-family: 'Noto Serif'; font-size: 10.3pt; line-height: 1.8; }
.conv .ln { display: grid; grid-template-columns: 17mm 1fr; margin: .4mm 0; }
.conv .sp { font-weight: 700; }
.sec { font-family: 'Noto Serif'; font-weight: 700; margin: 4mm 0 1.5mm; }
.opts { display: grid; grid-template-columns: repeat(3, 1fr); font-family: 'Noto Serif'; font-size: 10.3pt; line-height: 1.85; margin: 3mm 0 0 4mm; border: .6pt solid #999; padding: 2mm 4mm; }
.opts .k { margin-right: 2mm; }
.p4ans { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0; margin: 1mm 0 2mm; }
.p4ans div { border: .6pt solid #999; padding: 1mm 2mm; font-size: 9pt; min-height: 9mm; }
"""

def cover(R, kind):
    sub = '問題' if kind == 'q' else '解答・解説'
    rng = PAGE_INFO.get((R, kind), '')
    pts = '1 42点・2 42点・3 42点・4 24点（計150点）'
    if kind == 'q':
        items = [f'問題部分と解答用紙で構成されている{rng}。答えは解答用紙の決められた欄に書くこと。',
                 '試験時間の目安は90分。大問は 1〜4 の4題。',
                 f'配点は {pts}。本予想問題が独自に定めた配点である。',
                 '本冊子の英文・設問はすべてオリジナルである。登場する人物・団体・地名は架空。']
    else:
        items = [f'解答一覧・大問ごとの解答と解説{rng}。',
                 '和訳・日本語の説明・英文の完成は，要素ごとの採点基準と別解を示した。',
                 '意見を書く問題（70〜100語）は，採点観点と複数の解答例を示した。',
                 '長文・会話文は全訳と重要語句つき。',
                 f'配点は {pts}。本予想問題が独自に定めた配点で，大学の配点ではない。']
    lis = ''.join(f'<li>{x}</li>' for x in items)
    return f"""<section class="ocover">
<div class="brand"><img src="file://{HERE}/logo_gray.png"><div class="kicker">学習アプリ マナトビ</div></div>
<div class="box">{R}</div>
<div class="l1">予想問題 第{R}回</div>
<div class="l2">前期日程 対策</div>
<h1>英語{'問題' if kind == 'q' else '解答'}</h1>
<div class="sub">北海道大学（全学部共通）の出題形式に準拠 ／ {sub}</div>
<div class="chui"><span class="ttl">注　意</span><ol>{lis}</ol></div>
<div class="disc">{DISCLAIMER}<br>本冊子は過去の出題形式を分析して作成した練習用の教材です。</div>
<div class="foot"><span>学習アプリ マナトビ</span><span>予想問題 第{R}回 ／ {sub}</span></div></section>"""

def head(n, title):
    return f'<div class="parthead" data-run="{n}　{title}"><span class="roman">{n}</span><span class="t">{title}（配点 {POINTS[n]}点）</span></div>'

def notes_html(notes):
    if not notes: return ''
    rows = ''.join(f'<tr><td class="en">*{i + 1} {e(a)}</td><td>{e(b)}</td></tr>' for i, (a, b) in enumerate(notes))
    return f'<div class="notes"><div class="nh"></div><table>{rows}</table></div>'

def choices(chs):
    return '<div class="choices">' + ''.join(f'<div><span class="k">({L[i]})</span><span>{e(c)}</span></div>' for i, c in enumerate(chs)) + '</div>'

def q_html(q):
    body = choices(q['choices']) if q['kind'] in ('mc1', 'tf2') else ''
    return f'<div class="hq"><div class="stem"><span class="qn">問 {q["no"]}</span><span>{e(q["stem"])}</span></div>{body}</div>'

def part_RC(P, n, title):
    paras = ''.join(f'<p>{mark(p)}</p>' for p in P['passage'])
    return (f'<section class="part">{head(n, title)}<p class="intro">以下の英文を読み，後の問いに答えなさい。</p>'
            f'<div class="passage">{paras}</div>{notes_html(P.get("notes"))}' + ''.join(q_html(q) for q in P['questions']) + '</section>')

ENQ_LEAD = 'Respond to Questions A–C in English. Ideas and vocabulary from the passage may be used, but whole sentences should not be reproduced.'

def part_3(P):
    paras = ''.join(f'<p>{mark(p)}</p>' for p in P['passage'])
    qs = ''
    for k in ('A', 'B'):
        q = P['q' + k]
        qs += f'<div class="qh">Question {k}</div><div>{e(q["lead"])}</div><div class="frame">{mark(q["frame"])}</div>'
    qs += f'<div class="qh">Question C</div><div>{e(P["qC"]["stem"])}</div>'
    return (f'<section class="part">{head("3", "英文読解・英語での解答")}<p class="intro" style="font-family:Noto Serif;text-indent:0">Read the passage below.</p>'
            f'<div class="passage">{paras}</div>{notes_html(P.get("notes"))}<div class="enq"><div>{ENQ_LEAD}</div>{qs}</div></section>')

def part_4(P):
    lines = ''.join(f'<div class="ln"><span class="sp">{e(s)}:</span><span>{mark(t)}</span></div>' for s, t in P['lines'])
    summ = ''.join(f'<p>{mark(p)}</p>' for p in P['summary'])
    opts = ''.join(f'<div><span class="k">({k})</span>{e(w)}</div>' for k, w in P['options'])
    return (f'<section class="part">{head("4", "会話文と要約文")}<p class="intro" style="font-family:Noto Serif;text-indent:0">{e(P["lead"])}</p>'
            f'<div class="sec">[I : Conversation]</div><div class="conv">{lines}</div>{notes_html(P.get("notes"))}'
            f'<div class="sec">[II : Summary]</div><div class="passage">{summ}</div><div class="opts">{opts}</div>'
            f'<div style="font-size:8.6pt;margin-top:1mm">注）記号 (I) と (O) は数字と紛らわしいため使っていない。</div></section>')

def wlines(n, label=True):
    return ''.join(f'<div class="wl">{"<span>" + str((i+1)*10) + "語</span>" if label and (i+1) % 2 == 0 else ""}</div>' for i in range(n))

def sheet(D, R):
    H4 = '<h4 style="font-family:MPR;font-weight:800;margin:3mm 0 1mm">{}</h4>'
    out = f'<section class="sheet"><h2>解答用紙　予想問題 第{R}回</h2><div style="font-size:8.6pt;margin-bottom:2mm">受験番号・氏名欄は省略。記号は (A) のように書く。</div>'
    for n in ('1', '2'):
        out += H4.format(n)
        for q in D['P' + n]['questions']:
            k = q['kind']
            if k == 'ja_limit': out += f'<div class="row tall"><span class="h">問 {q["no"]}</span><div>{genko(q["limit"])}</div></div>'
            elif k in ('trans', 'ja_free'): out += f'<div class="row lines"><span class="h">問 {q["no"]}</span><span></span></div>'
            elif k == 'tf2': out += f'<div class="row"><span class="h">問 {q["no"]}</span><span>［　　　］［　　　］</span></div>'
            elif k == 'extract': out += f'<div class="row"><span class="h">問 {q["no"]}</span><span>{"　".join("［" + "　" * 12 + "］" for _ in range(q.get("n", 1)))}</span></div>'
            else: out += f'<div class="row"><span class="h">問 {q["no"]}</span><span>［　　　］</span></div>'
    out += '</section><section class="sheet"><h2>解答用紙（3・4）</h2>' + H4.format('3　Question A') + wlines(3, False) + H4.format('3　Question B') + wlines(3, False)
    out += H4.format('3　Question C（70〜100語）') + wlines(11)
    out += H4.format('4') + '<div class="p4ans">' + ''.join(f'<div>({i})</div>' for i in range(1, len(D['P4']['answers']) + 1)) + '</div></section>'
    return out

def colophon(R, kind):
    return f"""<section class="colophon"><div class="box"><h2>奥付</h2>
<div>予想問題 第{R}回　英語　{'問題' if kind == 'q' else '解答・解説'}</div>
<div>対象：北海道大学 前期日程 英語（全学部共通）の受験準備</div>
<div>作成：学習アプリ マナトビ 編集部（2026年10月）</div>
<div>作成方法：2022〜2026年度の出題形式・語数・難易度を分析し，英文・設問をすべて新たに書き下ろした。</div>
<div class="disc">{DISCLAIMER}</div>
<div style="margin-top:2.5mm;font-size:8.4pt">本冊子の英文は実在の記事・書籍・論文からの引用・翻案ではありません。登場する人物・団体・地名は架空です。無断転載・再配布を禁じます。</div>
<img src="file://{HERE}/logo_gray.png"></div></section>"""

# ---------------------------------------------------------------- 解答・解説
def ans_short(q):
    k = q['kind']
    if k == 'mc1': return f'({L[q["answer"]]})'
    if k == 'tf2': return '・'.join(f'({L[i]})' for i in sorted(q['answer']))
    if k == 'extract': return '，'.join(q['answer']) if isinstance(q['answer'], list) else q['answer']
    return q['answer']

def box(inner): return f'<div class="abox">{inner}</div>'

def model_block(q):
    out = f'<div><span class="lbl">模範解答</span><span class="ans">{e(q["answer"])}</span></div>'
    for a in q.get('alts', []): out += f'<div style="margin-top:.8mm"><span class="lbl">別解</span><span class="x-ul">{e(a)}</span></div>'
    return out

def wc(m): return len(re.findall(r"[A-Za-z0-9][A-Za-z0-9’'-]*", m))

def akey_RC(P, n):
    out = f'<section class="part akey"><h3>{n}　解答・解説（{POINTS[n]}点）</h3>'
    for q in P['questions']:
        k = q['kind']
        out += f'<h4>問 {q["no"]}（{q["points"]}点）</h4>'
        if k in ('mc1', 'tf2'):
            li = ''.join(f'<li><b>({L[i]})</b> {e(c)}<br>{em(r)}</li>' for i, (c, r) in enumerate(zip(q['choices'], q['reasons'])))
            out += box(f'<div class="ans">正解　{ans_short(q)}</div><ul>{li}</ul>' + (f'<div style="margin-top:1mm">{em(q["note"])}</div>' if q.get('note') else ''))
        elif k == 'extract':
            out += box(f'<div class="ans">正解　<span class="en">{e(ans_short(q))}</span></div>' + crit_table(q['criteria']) + '<ul>' + ''.join(f'<li>{em(x)}</li>' for x in q['explain']) + '</ul>')
        else:
            extra = ''
            if k == 'ja_limit':
                extra = f'<div style="font-size:8.4pt;margin-top:.6mm">模範解答 {len(q["answer"])}字・別解 {"・".join(str(len(a)) + "字" for a in q.get("alts", []))}（句読点を含む／制限 {q["limit"]}字以内）</div>'
            out += box(model_block(q) + extra + crit_table(q['criteria']) + '<ul>' + ''.join(f'<li>{em(x)}</li>' for x in q['explain']) + '</ul>')
    out += '<h4>全訳</h4><div class="trs">' + ''.join(f'<p>{e(p)}</p>' for p in P['translation']) + '</div>'
    out += '<h4>重要語句</h4><table class="voc">' + ''.join(f'<tr><td>{e(a)}</td><td>{e(b)}</td></tr>' for a, b in P['vocab']) + '</table></section>'
    return out

def akey_3(P):
    out = f'<section class="part akey"><h3>3　解答・解説（{POINTS["3"]}点）</h3>'
    for k in ('A', 'B'):
        q = P['q' + k]
        out += f'<h4>Question {k}（{q["points"]}点）</h4>' + box(
            f'<div class="en" style="font-size:9pt">{mark(q["frame"])}</div>'
            + ''.join(f'<div style="margin-top:.8mm"><span class="lbl">{"解答例" if i == 0 else "別解"}</span><span class="en {"ans" if i == 0 else "x-ul"}">{e(a)}</span></div>' for i, a in enumerate(q['answers']))
            + crit_table(q['criteria']) + '<ul>' + ''.join(f'<li>{em(x)}</li>' for x in q['explain']) + '</ul>')
    C = P['qC']
    ms = ''.join(f'<div style="margin-top:1.5mm"><span class="lbl">解答例：{e(lab)}</span></div><div class="model">{e(m)} <span class="wc">（{wc(m)}語）</span></div>' for lab, m in C['models'])
    out += f'<h4>Question C（{C["points"]}点）</h4>' + box(f'<div class="en" style="font-size:9.2pt">{e(C["stem"])}</div>' + crit_table(C['criteria']) + ms)
    out += '<h4>書き方のポイント・減点されやすい点</h4>' + box('<ul>' + ''.join(f'<li>{em(x)}</li>' for x in C['tips']) + '</ul>')
    out += '<h4>全訳</h4><div class="trs">' + ''.join(f'<p>{e(p)}</p>' for p in P['translation']) + '</div>'
    out += '<h4>重要語句</h4><table class="voc">' + ''.join(f'<tr><td>{e(a)}</td><td>{e(b)}</td></tr>' for a, b in P['vocab']) + '</table></section>'
    return out

def akey_4(P):
    opt = dict(P['options'])
    out = f'<section class="part akey"><h3>4　解答・解説（{POINTS["4"]}点・各2点）</h3>'
    out += box('<div class="ans">正解　' + '　'.join(f'({i}) ({a})' for i, a in P['answers'].items()) + '</div>')
    li = ''.join(f'<li><b>({i})</b> <span class="en"><b>({a}) {e(opt[a])}</b></span>：{em(P["why"][i])}</li>' for i, a in P['answers'].items())
    out += '<h4>各空所の解説</h4>' + box(f'<ul>{li}</ul><div style="margin-top:1mm">{em(P["unused"])}</div>')
    out += '<h4>会話文の全訳</h4><div class="trs">' + ''.join(f'<p>{e(s)}：{e(t)}</p>' for (s, _), t in zip(P['lines'], P['translation'])) + '</div>'
    out += '<h4>要約文の全訳</h4><div class="trs">' + ''.join(f'<p>{e(p)}</p>' for p in P['summary_translation']) + '</div>'
    out += '<h4>重要語句</h4><table class="voc">' + ''.join(f'<tr><td>{e(a)}</td><td>{e(b)}</td></tr>' for a, b in P['vocab']) + '</table></section>'
    return out

def summary(D, R):
    rows = ''
    for n in ('1', '2'):
        for q in D['P' + n]['questions']:
            a = ans_short(q) if q['kind'] in ('mc1', 'tf2', 'extract') else '解説参照（模範解答・採点基準つき）'
            rows += f'<tr><td>{n}</td><td>問 {q["no"]}</td><td>{e(a)}</td><td>{q["points"]}</td></tr>'
    for k in ('A', 'B'): rows += f'<tr><td>3</td><td>Question {k}</td><td>解答例は解説参照（採点基準つき）</td><td>{D["P3"]["q" + k]["points"]}</td></tr>'
    rows += f'<tr><td>3</td><td>Question C</td><td>解答例は解説参照（採点観点つき）</td><td>{D["P3"]["qC"]["points"]}</td></tr>'
    rows += f'<tr><td>4</td><td>(1)〜({len(D["P4"]["answers"])})</td><td>{"　".join(f"({i}) ({a})" for i, a in D["P4"]["answers"].items())}</td><td>{POINTS["4"]}</td></tr>'
    return f'<section class="part akey"><h3>解答一覧　予想問題 第{R}回</h3><table class="sum"><tr><th>大問</th><th>設問</th><th>解答</th><th>配点</th></tr>{rows}<tr><td colspan="3" style="text-align:right">合計</td><td>150</td></tr></table></section>'

def check_points(D):
    for n in ('1', '2'):
        s = sum(q['points'] for q in D['P' + n]['questions']); assert s == POINTS[n], (n, s)
        for q in D['P' + n]['questions']:
            if 'criteria' in q: assert sum(p for _, p in q['criteria']) == q['points'], (n, q['no'])
    P3 = D['P3']; s = P3['qA']['points'] + P3['qB']['points'] + P3['qC']['points']; assert s == POINTS['3'], s
    for k in ('qA', 'qB', 'qC'): assert sum(p for _, p in P3[k]['criteria']) == P3[k]['points'], k
    assert len(D['P4']['answers']) * 2 == POINTS['4']

def write(doc, out):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    css = [CSS(string=mono(kb.CSS_TEXT + H_CSS), font_config=FC)]
    HTML(string=mono(doc), base_url=str(HERE)).write_pdf(out, stylesheets=css, font_config=FC, metadata={'author': 'マナトビ'})
    return out

def load(R): return importlib.import_module(f'h{R}').DATA

def build_q(R):
    D = load(R); check_points(D)
    body = (cover(R, 'q') + part_RC(D['P1'], '1', '長文読解') + part_RC(D['P2'], '2', '長文読解') + part_3(D['P3']) + part_4(D['P4'])
            + sheet(D, R) + colophon(R, 'q'))
    return write(f'<html lang="ja"><head><meta charset="utf-8"><title>予想問題 第{R}回 英語 問題</title></head><body>{body}</body></html>', OUT_DIR / f'manatobi_hokudai_eng_yoso{R}_mondai.pdf')

def build_a(R):
    D = load(R); check_points(D)
    body = cover(R, 'a') + summary(D, R) + akey_RC(D['P1'], '1') + akey_RC(D['P2'], '2') + akey_3(D['P3']) + akey_4(D['P4']) + colophon(R, 'a')
    return write(f'<html lang="ja"><head><meta charset="utf-8"><title>予想問題 第{R}回 英語 解答・解説</title></head><body>{body}</body></html>', OUT_DIR / f'manatobi_hokudai_eng_yoso{R}_kaitou.pdf')

def page_range(pdf, kind):
    n = int(re.search(r'Pages:\s+(\d+)', subprocess.run(['pdfinfo', str(pdf)], capture_output=True, text=True).stdout).group(1))
    if kind == 'a': return f'（1〜{n - 2}ページ）'
    for p in range(2, n + 1):
        t = subprocess.run(['pdftotext', '-f', str(p), '-l', str(p), str(pdf), '-'], capture_output=True, text=True).stdout
        if '解答用紙' in t and '受験番号' in t: return f'（問題部分 1〜{p - 2}ページ・解答用紙 {p - 1}〜{n - 2}ページ）'
    raise SystemExit('解答用紙のページが見つからない')

if __name__ == '__main__':
    R = sys.argv[1] if len(sys.argv) > 1 else '1'
    for kind, f in (('q', build_q), ('a', build_a)):
        o = f(R); PAGE_INFO[(R, kind)] = page_range(o, kind)
        o = f(R); print(o.name, o.stat().st_size // 1024, 'KB', PAGE_INFO[(R, kind)])
