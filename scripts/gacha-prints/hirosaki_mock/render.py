# -*- coding: utf-8 -*-
"""弘前大学 前期 英語 予想問題の PDF（問題／解答・解説）を作る。白黒・A4縦。
紙面の部品・書体・白黒化は神戸大（../kobe_mock/render.py）と北大（../hokudai_mock/render.py）の部品を読み込んで流用する。
  python3 render.py 1   → .tmpwork/hirosaki_mock/manatobi_hirosaki_eng_yoso1_{mondai,kaitou}.pdf
データ：hN.py（N＝回）。大問1・2 は type で形式を切り替える：
  reading（長文＋日本語の設問）／dialogue（会話文＋日本語の設問）／summary（英文を日本語で要約）／jaen（会話文の空所に入る英文を日本語から書く）
大問3 会話の最後の一言を完成（A・B）＋日本の事物を英語で説明（A・B）／大問4 約100語の英作文。
本文の記法：{u1|…} 下線部・((1)) 会話文の空所・[...] 完成させる部分・word* 注のある語。
"""
import sys, re, os, importlib, importlib.util
from pathlib import Path
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(HERE))
def _load(name, rel):
    sp = importlib.util.spec_from_file_location(name, HERE.parent / rel)
    m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m); return m
kb = _load('kb', 'kobe_mock/render.py')
hk = _load('hk', 'hokudai_mock/render.py')
# 北大の render.py は自分のフォルダを sys.path の先頭に入れる（北大にも h1.py がある）ので，弘前のフォルダを先頭に戻す
sys.path.insert(0, str(HERE))
from weasyprint import HTML, CSS
e, mono, FC, genko, crit_table = kb.e, kb.mono, kb.FC, kb.genko, kb.crit_table
OUT_DIR = Path(os.environ.get('HIROSAKI_OUT_DIR', str(ROOT / '.tmpwork/hirosaki_mock')))
DISCLAIMER = '弘前大学の過去問・公式問題ではありません。予想問題であり，大学とは関係がありません。'
POINTS = {'1': 50, '2': 50, '3': 50, '4': 50}
PN = '①②③④⑤⑥⑦⑧⑨'
JL = 'abcde'
TITLES = {'reading': '長文読解', 'dialogue': '会話文読解', 'summary': '英文の要約', 'jaen': '会話文と英文の作成'}
PAGE_INFO = {}

def em(s):
    t = kb.em(s)
    return re.sub(r'(?<![A-Za-z])\(([a-e])\)', r'<span class="x-b">(\1)</span>', t)

def mark(t):
    t = e(t)
    t = re.sub(r'\{u(\d)\|([^}]*)\}', r'<span class="lab">(\1)</span><span class="ul">\2</span>', t)
    t = re.sub(r'\(\((\d)\)\)', r'<span class="blank">(&#8194;\1&#8194;)</span>', t)
    t = t.replace('[...]', '<span class="blank">［. . .］</span>')
    return re.sub(r'(?<=[A-Za-z)])\*', '<sup class="ast">＊</sup>', t)

def plain(t):
    t = re.sub(r'\{u\d\|([^}]*)\}', r'\1', t)
    return re.sub(r'\(\(\d\)\)|\[\.\.\.\]', ' ', t).replace('*', '')

H_CSS = hk.H_CSS + """
.conv .ln { grid-template-columns: 22mm 1fr; }
.passage .pn { font-family: 'Noto Serif CJK JP'; margin-right: 1.5mm; }
.jopts { margin: 1.5mm 0 0 12mm; font-size: 10pt; line-height: 1.85; }
.jopts div { display: grid; grid-template-columns: 9mm 1fr; }
.task4 p { font-family: 'Noto Serif'; font-size: 10.5pt; line-height: 1.95; margin: 0 0 2mm; text-indent: 0; }
.task4 ul { font-family: 'Noto Serif'; font-size: 10.3pt; line-height: 1.9; margin: 1mm 0 2mm 6mm; }
.exbox { border: .6pt solid #999; padding: 2mm 4mm; font-family: 'Noto Serif'; font-size: 9.8pt; line-height: 1.8; margin-top: 2mm; }
.mailfix { font-family: 'Noto Serif'; font-size: 10pt; margin: 1mm 0; }
"""

def cover(R, kind):
    sub = '問題' if kind == 'q' else '解答・解説'
    rng = PAGE_INFO.get((R, kind), '')
    pts = '1 50点・2 50点・3 50点・4 50点（計200点）'
    if kind == 'q':
        items = [f'問題部分と解答用紙で構成されている{rng}。答えは解答用紙の決められた欄に書くこと。',
                 '試験時間の目安は90分。大問は 1〜4 の4題。日本語で答える設問と英語で答える設問がある。',
                 f'配点は {pts}。本予想問題が独自に定めた配点である。',
                 '本冊子の英文・設問はすべてオリジナルである。登場する人物・団体・地名は架空。']
    else:
        items = [f'解答一覧・大問ごとの解答と解説{rng}。',
                 '日本語の説明・和訳・要約・英文を書く設問は，要素ごとの採点基準と別解を示した。',
                 '英作文（約100語）は，採点観点と複数の解答例を示した。',
                 '英文・会話文は全訳と重要語句つき。',
                 f'配点は {pts}。本予想問題が独自に定めた配点で，大学の配点ではない。']
    lis = ''.join(f'<li>{x}</li>' for x in items)
    return f"""<section class="ocover">
<div class="brand"><img src="file://{HERE}/logo_gray.png"><div class="kicker">学習アプリ マナトビ</div></div>
<div class="box">{R}</div>
<div class="l1">予想問題 第{R}回</div>
<div class="l2">前期日程 対策</div>
<h1>英語{'問題' if kind == 'q' else '解答'}</h1>
<div class="sub">弘前大学（英語を課す学部で共通）の出題形式に準拠 ／ {sub}</div>
<div class="chui"><span class="ttl">注　意</span><ol>{lis}</ol></div>
<div class="disc">{DISCLAIMER}<br>本冊子は過去の出題形式を分析して作成した練習用の教材です。</div>
<div class="foot"><span>学習アプリ マナトビ</span><span>予想問題 第{R}回 ／ {sub}</span></div></section>"""

def head(n, title):
    return f'<div class="parthead" data-run="{n}　{title}"><span class="roman">{n}</span><span class="t">{title}（配点 {POINTS[n]}点）</span></div>'

def notes_html(notes):
    if not notes: return ''
    rows = ''.join(f'<tr><td class="en">{e(a)}</td><td>{e(b)}</td></tr>' for a, b in notes)
    return f'<div class="notes"><div class="nh"></div><table>{rows}</table></div>'

def passage_html(P):
    ps = ''.join(f'<p>{"<span class=\"pn\">" + PN[i] + "</span>" if P.get("para_numbers") else ""}{mark(p)}</p>' for i, p in enumerate(P['passage']))
    return f'<div class="passage">{ps}</div>'

def lines_html(lines):
    return '<div class="conv">' + ''.join(f'<div class="ln"><span class="sp">{e(s)}:</span><span>{mark(t)}</span></div>' for s, t in lines) + '</div>'

def q_html(q):
    return f'<div class="hq"><div class="stem"><span class="qn">設問 {q["no"]}</span><span>{e(q["stem"])}</span></div></div>'

def part_12(P, n):
    t = P['type']
    body = lines_html(P['lines']) if t in ('dialogue', 'jaen') else passage_html(P)
    out = f'<section class="part">{head(n, TITLES[t])}<p class="intro">{e(P["intro"])}</p>{body}{notes_html(P.get("notes"))}'
    if t in ('reading', 'dialogue'):
        out += ''.join(q_html(q) for q in P['questions'])
    elif t == 'jaen':
        opts = ''.join(f'<div><span>({JL[i]})</span><span>{e(o)}</span></div>' for i, o in enumerate(P['options']))
        out += f'<div class="hq"><div class="stem"><span class="qn">設問</span><span>{e(P["stem"])}</span></div><div class="jopts">{opts}</div></div>'
    return out + '</section>'

def part_3(P):
    out = f'<section class="part">{head("3", "会話の完成・日本の事物の説明")}<div class="enq">'
    out += f'<div class="qh">設問 1</div><div>{e(P["q1_stem"])}</div>'
    for c in P['convs']:
        out += f'<div class="qh">Conversation {c["label"]}</div>{lines_html(c["lines"])}'
    out += f'<div class="qh">設問 2</div><div>{e(P["q2_stem"])}</div>'
    out += ''.join(f'<div style="margin:1.5mm 0 0 8mm;font-family:Noto Serif CJK JP">{w["label"]}．{e(w["word"])}</div>' for w in P['words'])
    return out + '</div></section>'

def part_4(P):
    paras = ''.join(f'<p>{e(p)}</p>' for p in P['stem'])
    sides = '<ul>' + ''.join(f'<li>{e(s)}</li>' for s in P['sides']) + '</ul>' if P.get('sides') else ''
    after = ''.join(f'<p>{e(p)}</p>' for p in P.get('after', []))
    ex = f'<div class="exbox">{"<br>".join(e(x) for x in P["expressions"])}</div>' if P.get('expressions') else ''
    return f'<section class="part">{head("4", "英作文")}<div class="task4">{paras}{sides}{after}{ex}</div></section>'

def sheet(D, R):
    H4 = '<h4 style="font-family:MPR;font-weight:800;margin:3mm 0 1mm">{}</h4>'
    out = f'<section class="sheet"><h2>解答用紙　予想問題 第{R}回</h2><div style="font-size:8.6pt;margin-bottom:2mm">受験番号・氏名欄は省略。</div>'
    for n in ('1', '2'):
        P = D[n]; t = P['type']; out += H4.format(n)
        if t in ('reading', 'dialogue'):
            for q in P['questions']:
                h = f'<span class="h">設問 {q["no"]}</span>'
                if q['kind'] == 'short': out += f'<div class="row">{h}<span>［　　　　　　　　］</span></div>'
                elif q['kind'] == 'yesno': out += f'<div class="row lines">{h}<span>Yes ・ No（どちらかを○で囲む）</span></div>'
                else: out += f'<div class="row lines">{h}<span></span></div>'
        elif t == 'summary':
            out += f'<div class="row tall"><span class="h">要約</span><div>{genko(P["limit"] + 40)}</div></div>'
        else:
            for k in P['answer']:
                out += f'<div class="row"><span class="h">( {k} )</span><span>［A］［　　］　［B］</span></div>'
    out += '</section><section class="sheet"><h2>解答用紙（3・4）</h2>' + H4.format('3　設問 1')
    for c in D['3']['convs']: out += f'<div style="font-size:9pt">Conversation {c["label"]}</div>' + hk.wlines(2, False)
    out += H4.format('3　設問 2')
    for w in D['3']['words']: out += f'<div style="font-size:9pt">{w["label"]}．{e(w["word"])}</div>' + hk.wlines(3, False)
    P4 = D['4']; out += '</section><section class="sheet"><h2>解答用紙（4）</h2>' + H4.format('4（約100語）')
    if P4.get('sides'):
        out += '<div class="mailfix">（賛成しない方を線で消すこと）<br>' + '<br>'.join(e(s) for s in P4['sides']) + '</div>'
    if P4.get('opening'): out += f'<div class="mailfix">{e(P4["opening"])}</div>'
    out += hk.wlines(12)
    if P4.get('closing'): out += f'<div class="mailfix" style="text-align:right">{e(P4["closing"])}</div>'
    return out + '</section>'

def colophon(R, kind):
    return f"""<section class="colophon"><div class="box"><h2>奥付</h2>
<div>予想問題 第{R}回　英語　{'問題' if kind == 'q' else '解答・解説'}</div>
<div>対象：弘前大学 前期日程 英語（英語を課す学部で共通）の受験準備</div>
<div>作成：学習アプリ マナトビ 編集部（2026年11月）</div>
<div>作成方法：2024〜2026年度の出題形式・語数・難易度を分析し，英文・設問をすべて新たに書き下ろした。</div>
<div class="disc">{DISCLAIMER}</div>
<div style="margin-top:2.5mm;font-size:8.4pt">本冊子の英文は実在の記事・書籍・論文からの引用・翻案ではありません。登場する人物・団体・地名は架空です。無断転載・再配布を禁じます。</div>
<img src="file://{HERE}/logo_gray.png"></div></section>"""

# ---------------------------------------------------------------- 解答・解説
def box(inner): return f'<div class="abox">{inner}</div>'
def ul(items): return '<ul>' + ''.join(f'<li>{em(x)}</li>' for x in items) + '</ul>'
def wc(m): return len(re.findall(r"[A-Za-z0-9][A-Za-z0-9’'-]*", m))

def model_block(ans, alts, en=False, lbl='模範解答'):
    c = ' en' if en else ''
    out = f'<div><span class="lbl">{lbl}</span><span class="ans{c}">{e(ans)}</span></div>'
    for a in alts: out += f'<div style="margin-top:.8mm"><span class="lbl">別解</span><span class="x-ul{c}">{e(a)}</span></div>'
    return out

def akey_q(q):
    out = f'<h4>設問 {q["no"]}（{q["points"]}点）</h4>'
    ans = q['answer']
    if q['kind'] == 'yesno': ans = f'{q["yn"]}　{ans}'
    return out + box(model_block(ans, q.get('alts', [])) + crit_table(q['criteria']) + ul(q['explain']))

def trans_block(P):
    if P['type'] in ('dialogue', 'jaen'):
        return '<h4>会話文の全訳</h4><div class="trs">' + ''.join(f'<p>{e(s)}：{e(t)}</p>' for (s, _), t in zip(P['lines'], P['translation'])) + '</div>'
    return '<h4>全訳</h4><div class="trs">' + ''.join(f'<p>{PN[i] if P.get("para_numbers") else ""}{e(p)}</p>' for i, p in enumerate(P['translation'])) + '</div>'

def vocab_block(P):
    return '<h4>重要語句</h4><table class="voc">' + ''.join(f'<tr><td>{e(a)}</td><td>{e(b)}</td></tr>' for a, b in P['vocab']) + '</table>'

def akey_12(P, n):
    t = P['type']
    out = f'<section class="part akey"><h3>{n}　解答・解説（{POINTS[n]}点）</h3>'
    if t in ('reading', 'dialogue'):
        out += ''.join(akey_q(q) for q in P['questions'])
    elif t == 'summary':
        lens = '・'.join(f'{len(a)}字' for a in [P['answer']] + P.get('alts', []))
        out += '<h4>要約（50点）</h4>' + box(model_block(P['answer'], P.get('alts', []), lbl='解答例')
                                         + f'<div style="font-size:8.4pt;margin-top:.6mm">字数：{lens}（句読点を含む／400字程度）</div>'
                                         + crit_table(P['criteria']) + ul(P['explain']))
    else:
        rows = ''
        for k, lt in P['answer'].items():
            ms = P['models'][lt]
            rows += (f'<li><b>( {k} )</b>　［A］<b>({lt})</b>　［B］<span class="en ans">{e(ms[0])}</span>'
                     + ''.join(f'<br><span class="lbl">別解</span><span class="en x-ul">{e(m)}</span>' for m in ms[1:])
                     + f'<br>{em(P["explain"][lt])}</li>')
        out += f'<h4>設問（各{P["each"]}点）</h4>' + box(f'<div class="ans">正解　{"　".join(f"({k}) ({v})" for k, v in P["answer"].items())}</div>'
                                                      + crit_table(P['criteria']) + f'<ul>{rows}</ul>')
    return out + trans_block(P) + vocab_block(P) + '</section>'

def akey_3(P):
    out = f'<section class="part akey"><h3>3　解答・解説（{POINTS["3"]}点）</h3>'
    for c in P['convs']:
        ms = ''.join(f'<div style="margin-top:.8mm"><span class="lbl">{"解答例" if i == 0 else "別解"}</span><span class="en {"ans" if i == 0 else "x-ul"}">{e(m)}</span></div>' for i, m in enumerate(c['models']))
        out += f'<h4>設問 1　Conversation {c["label"]}（{c["points"]}点）</h4>' + box(f'<div class="en" style="font-size:9pt">{mark(c["lines"][-1][1])}</div>' + ms + crit_table(c['criteria']) + ul(c['explain']))
    for w in P['words']:
        ms = ''.join(f'<div class="model">{e(m)} <span class="wc">（{len(re.findall(r"[.!?](?:\s|$)", m))}文）</span></div>' for m in w['models'])
        out += f'<h4>設問 2　{w["label"]}．{e(w["word"])}（{w["points"]}点）</h4>' + box(ms + crit_table(w['criteria']) + ul(w['explain']))
    for c in P['convs']:
        out += f'<h4>Conversation {c["label"]} の全訳</h4><div class="trs">' + ''.join(f'<p>{e(s)}：{e(t)}</p>' for (s, _), t in zip(c['lines'], c['translation'])) + '</div>'
    return out + vocab_block(P) + '</section>'

def akey_4(P):
    ms = ''.join(f'<div style="margin-top:1.5mm"><span class="lbl">解答例：{e(lab)}</span></div><div class="model">{e(m)} <span class="wc">（{wc(m)}語）</span></div>' for lab, m in P['models'])
    out = f'<section class="part akey"><h3>4　解答・解説（{POINTS["4"]}点）</h3>'
    out += box('<div class="en" style="font-size:9.2pt">' + '<br>'.join(e(p) for p in P['stem']) + '</div>' + crit_table(P['criteria']) + ms)
    out += '<h4>書き方のポイント・減点されやすい点</h4>' + box(ul(P['tips']))
    out += '<h4>問題文の訳</h4><div class="trs">' + ''.join(f'<p>{e(p)}</p>' for p in P['stem_translation']) + '</div>'
    return out + '</section>'

def summary_table(D, R):
    rows = ''
    for n in ('1', '2'):
        P = D[n]; t = P['type']
        if t in ('reading', 'dialogue'):
            for q in P['questions']:
                a = q['answer'] if q['kind'] == 'short' else ('解説参照（' + q['yn'] + '・模範解答・採点基準つき）' if q['kind'] == 'yesno' else '解説参照（模範解答・採点基準つき）')
                rows += f'<tr><td>{n}</td><td>設問 {q["no"]}</td><td>{e(a)}</td><td>{q["points"]}</td></tr>'
        elif t == 'summary':
            rows += f'<tr><td>{n}</td><td>要約</td><td>解答例は解説参照（採点基準つき）</td><td>{POINTS[n]}</td></tr>'
        else:
            rows += f'<tr><td>{n}</td><td>( 1 )〜( {len(P["answer"])} )</td><td>［A］{e("　".join(f"({k}) ({v})" for k, v in P["answer"].items()))}　［B］解説参照</td><td>{POINTS[n]}</td></tr>'
    for c in D['3']['convs']: rows += f'<tr><td>3</td><td>設問 1 {c["label"]}</td><td>解答例は解説参照</td><td>{c["points"]}</td></tr>'
    for w in D['3']['words']: rows += f'<tr><td>3</td><td>設問 2 {w["label"]}</td><td>解答例は解説参照</td><td>{w["points"]}</td></tr>'
    rows += f'<tr><td>4</td><td>英作文</td><td>解答例は解説参照（採点観点つき）</td><td>{POINTS["4"]}</td></tr>'
    return f'<section class="part akey"><h3>解答一覧　予想問題 第{R}回</h3><table class="sum"><tr><th>大問</th><th>設問</th><th>解答</th><th>配点</th></tr>{rows}<tr><td colspan="3" style="text-align:right">合計</td><td>200</td></tr></table></section>'

def check_points(D):
    for n in ('1', '2'):
        P = D[n]; t = P['type']
        if t in ('reading', 'dialogue'):
            assert sum(q['points'] for q in P['questions']) == POINTS[n], (n, 'sum')
            for q in P['questions']: assert sum(p for _, p in q['criteria']) == q['points'], (n, q['no'])
        elif t == 'summary': assert sum(p for _, p in P['criteria']) == POINTS[n], (n, 'summary')
        else:
            assert len(P['answer']) * P['each'] == POINTS[n], (n, 'jaen')
            assert sum(p for _, p in P['criteria']) == P['each'], (n, 'jaen crit')
    P3 = D['3']
    assert sum(c['points'] for c in P3['convs']) + sum(w['points'] for w in P3['words']) == POINTS['3']
    for x in P3['convs'] + P3['words']: assert sum(p for _, p in x['criteria']) == x['points'], x['label']
    assert sum(p for _, p in D['4']['criteria']) == POINTS['4']

def write(doc, out):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    css = [CSS(string=mono(kb.CSS_TEXT + H_CSS), font_config=FC)]
    HTML(string=mono(doc), base_url=str(HERE)).write_pdf(out, stylesheets=css, font_config=FC, metadata={'author': 'マナトビ'})
    return out

def load(R): return importlib.import_module(f'h{R}').DATA

def build_q(R):
    D = load(R); check_points(D)
    body = cover(R, 'q') + part_12(D['1'], '1') + part_12(D['2'], '2') + part_3(D['3']) + part_4(D['4']) + sheet(D, R) + colophon(R, 'q')
    return write(f'<html lang="ja"><head><meta charset="utf-8"><title>予想問題 第{R}回 英語 問題</title></head><body>{body}</body></html>', OUT_DIR / f'manatobi_hirosaki_eng_yoso{R}_mondai.pdf')

def build_a(R):
    D = load(R); check_points(D)
    body = cover(R, 'a') + summary_table(D, R) + akey_12(D['1'], '1') + akey_12(D['2'], '2') + akey_3(D['3']) + akey_4(D['4']) + colophon(R, 'a')
    return write(f'<html lang="ja"><head><meta charset="utf-8"><title>予想問題 第{R}回 英語 解答・解説</title></head><body>{body}</body></html>', OUT_DIR / f'manatobi_hirosaki_eng_yoso{R}_kaitou.pdf')

if __name__ == '__main__':
    R = sys.argv[1] if len(sys.argv) > 1 else '1'
    for kind, f in (('q', build_q), ('a', build_a)):
        o = f(R); PAGE_INFO[(R, kind)] = hk.page_range(o, kind)
        o = f(R); print(o.name, o.stat().st_size // 1024, 'KB', PAGE_INFO[(R, kind)])
