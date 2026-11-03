# -*- coding: utf-8 -*-
"""大阪大学 前期 英語（外国語学部以外）予想問題の PDF（問題／解答・解説）を作る。白黒・A4縦。
紙面の部品・書体・白黒化は神戸大の render.py（../kobe_mock/render.py）を読み込んで流用する。
  python3 render.py 1   → .tmpwork/osaka_mock/manatobi_osaka_eng_yoso1_{mondai,kaitou}.pdf
データ：oN.py（N＝回）。I 英文和訳(A)(B)／II 長文読解／III 自由英作文／IV 和文英訳 (A)＋(B)(イ)(ロ)。
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
OUT_DIR = Path(os.environ.get('OSAKA_OUT_DIR', str(ROOT / '.tmpwork/osaka_mock')))
K = 'イロハニホヘ'
DISCLAIMER = '大阪大学の過去問・公式問題ではありません。予想問題であり，大学とは関係がありません。'
PAGE_INFO = {}

def em(s):
    t = kb.em(s)
    return re.sub(r'(?<![A-Za-z])\((イ|ロ|ハ|ニ|ホ)\)', r'<span class="x-b">(\1)</span>', t)

def mark(t):
    """{u|…} 下線（番号なし）・{ui|…} 下線(i)・{uA|…} 下線(A)・{u1|…} 下線(1)・* 注"""
    t = e(t)
    def rep(m):
        lab, body = m.group(1), m.group(2)
        pre = f'<span class="lab">({lab})</span>' if lab else ''
        return f'{pre}<span class="ul">{body}</span>'
    t = re.sub(r'\{u([A-Za-z0-9]*)\|([^}]*)\}', rep, t)
    return re.sub(r'\*', '<sup class="ast">*</sup>', t)

def strip(t): return re.sub(r'\{u[A-Za-z0-9]*\|([^}]*)\}', r'\1', t).replace('*', '')

OSAKA_CSS = """
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
.ocover .chui li b { font-family: 'Noto Sans CJK JP'; }
.ocover .disc { position: absolute; top: 236mm; left: 26mm; right: 26mm; background: #ededed; border-left: 1.8mm solid #1a1a1a; padding: 3mm 5mm; font-family: 'Noto Sans CJK JP'; font-size: 9pt; font-weight: 700; line-height: 1.7; }
.ocover .foot { position: absolute; bottom: 12mm; left: 22mm; right: 22mm; display: flex; justify-content: space-between; font-family: 'Noto Sans CJK JP'; font-size: 7.6pt; color: #555; border-top: 1px solid #999; padding-top: 2mm; }
.ipass { margin: 3mm 0 5mm; display: grid; grid-template-columns: 9mm 1fr; }
.ipass .lb { font-family: 'Noto Serif CJK JP'; }
.jpass { font-family: 'Noto Serif CJK JP'; font-size: 10.4pt; line-height: 2.0; text-align: justify; }
.jpass p { margin: 0; text-indent: 1em; }
.who { font-family: 'Noto Serif CJK JP'; margin: 4mm 0 1mm; }
.osq { margin: 4.5mm 0 0; break-inside: avoid-page; }
.osq .stem { display: grid; grid-template-columns: 17mm 1fr; }
.osq .qn { font-family: 'Noto Serif CJK JP'; white-space: nowrap; }
.osq .items { margin: 1.2mm 0 0 17mm; }
.osq .q2 { font-family: 'Noto Serif'; margin: 1mm 0 0 6mm; }
.iiiq { font-family: 'Noto Serif CJK JP'; font-size: 10.4pt; line-height: 1.95; text-indent: 0; margin: 2mm 0; }
"""

def cover(R, kind):
    sub = '問題' if kind == 'q' else '解答・解説'
    rng = PAGE_INFO.get((R, kind), '')
    if kind == 'q':
        items = [f'問題部分と解答用紙で構成されている{rng}。答えは解答用紙の決められた欄に書くこと。',
                 '試験時間の目安は90分（文学部の志願者は105分）。大問は I〜IV の4題。',
                 'IV(B)は，<b>文学部志望なら(イ)</b>，<b>それ以外の学部志望なら(ロ)</b>に答えること。',
                 '配点は I 30点・II 50点・III 30点・IV 40点（計150点）。本予想問題が独自に定めた配点である。',
                 '本冊子の英文・日本文・設問はすべてオリジナルである。']
    else:
        items = [f'解答一覧・大問ごとの解答と解説{rng}。',
                 '英文和訳・和文英訳・日本語記述は，要素ごとの採点基準と別解を示した。',
                 '自由英作文と英語の説明問題は，採点観点と複数の解答例を示した。',
                 '長文は全訳と重要語句つき。',
                 '配点は I 30点・II 50点・III 30点・IV 40点（計150点）。本予想問題が独自に定めた配点で，大学の配点ではない。']
    lis = ''.join(f'<li>{x}</li>' for x in items)
    return f"""<section class="ocover">
<div class="brand"><img src="file://{HERE}/logo_gray.png"><div class="kicker">学習アプリ マナトビ</div></div>
<div class="box">{R}</div>
<div class="l1">予想問題 第{R}回</div>
<div class="l2">前期日程 対策</div>
<h1>英語{'問題' if kind == 'q' else '解答'}</h1>
<div class="sub">大阪大学（外国語学部以外）の出題形式に準拠 ／ {sub}</div>
<div class="chui"><span class="ttl">注　意</span><ol>{lis}</ol></div>
<div class="disc">{DISCLAIMER}<br>本冊子は過去の出題形式を分析して作成した練習用の教材です。</div>
<div class="foot"><span>学習アプリ マナトビ</span><span>予想問題 第{R}回 ／ {sub}</span></div></section>"""

def head(roman, title, pts):
    return f'<div class="parthead" data-run="{roman}　{title}"><span class="roman">{roman}</span><span class="t">{title}（配点 {pts}点）</span></div>'

def notes_html(notes):
    if not notes: return ''
    rows = ''.join(f'<tr><td class="en">{e(a)}</td><td>{e(b)}</td></tr>' for a, b in notes)
    return f'<div class="notes"><div class="nh">注</div><table>{rows}</table></div>'

def choices(chs, row4=False):
    cls = 'choices row4' if row4 else 'choices'
    return f'<div class="{cls}">' + ''.join(f'<div><span class="k">({K[i]})</span><span>{e(c)}</span></div>' for i, c in enumerate(chs)) + '</div>'

def part_I(P):
    out = f'<section class="part">{head("I", "英文和訳", P["points"])}<p class="intro">英文(A)・(B)の下線部を，それぞれ和訳しなさい。</p>'
    for it in P['items']:
        out += f'<div class="ipass"><span class="lb">({it["label"]})</span><div><div class="passage">{"".join(f"<p>{mark(p)}</p>" for p in it["passage"])}</div>{notes_html(it.get("notes"))}</div></div>'
    return out + '</section>'

def q_II(q):
    k = q['kind']; no = q['no']
    stem = f'<div class="stem"><span class="qn">設問({no})</span><span>{e(q["stem"])}</span></div>'
    body = ''
    if k == 'synonym':
        for it in q['items']:
            short = all(len(c) <= 20 for c in it['choices'])
            body += f'<div class="item"><div class="w"><span class="k">({it["label"]})</span>&ensp;{e(it["word"])}</div>{choices(it["choices"], row4=short)}</div>'
    elif k == 'en_mc':
        for it in q['items']:
            body += f'<div class="item"><div class="w"><span class="k">({it["label"]})</span>&ensp;{e(it["word"])}</div><div class="q2">{e(it["question"])}</div>{choices(it["choices"])}</div>'
    elif k in ('tf2', 'mc1'):
        body = choices(q['choices'])
    return f'<div class="osq">{stem}<div class="items">{body}</div></div>'

def part_II(P):
    paras = ''.join(f'<p>{mark(p)}</p>' for p in P['passage'])
    qs = ''.join(q_II(q) for q in P['questions'])
    return f"""<section class="part">{head("II", "長文読解", P["points"])}<p class="intro">英文を読み，後の設問(1)〜(6)に答えなさい。</p>
<div class="passage"><p class="first" style="text-align:center;font-style:normal;font-weight:700;text-indent:0">{e(P["title"])}</p>{paras}</div>{notes_html(P.get("notes"))}{qs}</section>"""

def part_III(P):
    return f'<section class="part">{head("III", "自由英作文", P["points"])}<p class="iiiq">{e(P["stem"])}</p></section>'

def part_IV(P):
    out = f'<section class="part">{head("IV", "和文英訳", P["points"])}<p class="intro">日本文(A)・(B)の下線部を英訳しなさい。(B)は，文学部を志望する人は(イ)，それ以外の学部を志望する人は(ロ)に答えること（本予想問題では，志望と異なる側を選んだ答案は採点しない扱いとする）。</p>'
    for it in P['items']:
        lab = f'({it["label"]})' if it['label'] == 'A' else f'({it["sub"]})'
        if it['label'] == 'B' and it['sub'] == 'イ': out += '<div class="who">(B)</div>'
        out += f'<div class="who">{lab}（{e(it["who"])}）</div><div class="jpass">{"".join(f"<p>{mark(p)}</p>" for p in it["text"])}</div>'
    return out + '</section>'

def wlines(n, label=True):
    return ''.join(f'<div class="wl">{"<span>" + str((i+1)*10) + "語</span>" if label and (i+1) % 2 == 0 else ""}</div>' for i in range(n))

def sheet(D, R):
    H4 = '<h4 style="font-family:MPR;font-weight:800;margin:3mm 0 1mm">{}</h4>'
    out = f'<section class="sheet"><h2>解答用紙　予想問題 第{R}回</h2><div style="font-size:8.6pt;margin-bottom:2mm">受験番号・氏名欄は省略。記号は (イ) のように書く。</div>'
    out += H4.format('I')
    for it in D['I']['items']:
        out += f'<div class="row lines"><span class="h">({it["label"]})</span><span></span></div>'
    out += H4.format('II')
    for q in D['II']['questions']:
        k, no = q['kind'], q['no']
        if k in ('synonym', 'en_mc'):
            cells = '　'.join(f'({it["label"]}) ［　　］' for it in q['items'])
            out += f'<div class="row"><span class="h">設問({no})</span><span>{cells}</span></div>'
        elif k == 'tf2':
            out += f'<div class="row"><span class="h">設問({no})</span><span>［　　］［　　］</span></div>'
        elif k == 'mc1':
            out += f'<div class="row"><span class="h">設問({no})</span><span>［　　］</span></div>'
        elif k == 'ja_limit':
            out += f'<div class="row tall"><span class="h">設問({no})</span><div>{genko(q["limit"])}</div></div>'
        elif k == 'en_explain':
            out += f'<div class="row"><span class="h">設問({no})</span><div style="width:100%">{wlines(5)}</div></div>'
        else:
            out += f'<div class="row lines"><span class="h">設問({no})</span><span></span></div>'
    out += '</section><section class="sheet"><h2>解答用紙（III・IV）</h2>' + H4.format('III（80語程度）') + wlines(10)
    out += H4.format('IV (A)') + wlines(6, False) + H4.format('IV (B)　選択した問題に○：　(イ)　・　(ロ)') + wlines(6, False) + '</section>'
    return out

def colophon(R, kind):
    return f"""<section class="colophon"><div class="box"><h2>奥付</h2>
<div>予想問題 第{R}回　英語　{'問題' if kind == 'q' else '解答・解説'}</div>
<div>対象：大阪大学 前期日程 英語（外国語学部以外）の受験準備</div>
<div>作成：学習アプリ マナトビ 編集部（2026年10月）</div>
<div>作成方法：2022〜2026年度の出題形式・語数・難易度を分析し，英文・日本文・設問をすべて新たに書き下ろした。</div>
<div class="disc">{DISCLAIMER}</div>
<div style="margin-top:2.5mm;font-size:8.4pt">本冊子の英文・日本文は実在の記事・書籍・論文からの引用・翻案ではありません。無断転載・再配布を禁じます。</div>
<img src="file://{HERE}/logo_gray.png"></div></section>"""

# ---------------------------------------------------------------- 解答・解説
def ans_short(q):
    k = q['kind']
    if k in ('synonym', 'en_mc'): return '　'.join(f'({it["label"]}) ({K[it["answer"]]})' for it in q['items'])
    if k == 'tf2': return '・'.join(f'({K[i]})' for i in sorted(q['answer']))
    if k == 'mc1': return f'({K[q["answer"]]})'
    if k == 'en_explain': return '解答例は解説参照'
    return q['answer']

def box(inner): return f'<div class="abox">{inner}</div>'

def model_block(q):
    out = f'<div><span class="lbl">模範解答</span><span class="ans">{e(q["answer"])}</span></div>'
    for a in q.get('alts', []): out += f'<div style="margin-top:.8mm"><span class="lbl">別解</span><span class="x-ul">{e(a)}</span></div>'
    return out

def akey_I(P):
    out = f'<section class="part akey"><h3>I　解答・解説（{P["points"]}点）</h3>'
    for it in P['items']:
        out += f'<h4>({it["label"]})（{it["points"]}点）</h4>' + box(
            model_block(it) + crit_table(it['criteria']) + '<ul>' + ''.join(f'<li>{em(x)}</li>' for x in it['explain']) + '</ul>'
            + f'<div style="margin-top:1mm"><span class="lbl">全訳</span>{e(it["translation"])}</div>')
    return out + '</section>'

def akey_II(P):
    out = f'<section class="part akey"><h3>II　解答・解説（{P["points"]}点）</h3>'
    for q in P['questions']:
        k = q['kind']
        out += f'<h4>設問({q["no"]})（{q["points"]}点）</h4>'
        if k in ('synonym', 'en_mc'):
            li = ''.join(f'<li><b>({it["label"]})</b> <span class="en">{e(it["word"])}</span> → <span class="en"><b>({K[it["answer"]]}) {e(it["choices"][it["answer"]])}</b></span>：{em(it["why"])}</li>' for it in q['items'])
            out += box(f'<div class="ans">正解　{ans_short(q)}</div><ul>{li}</ul>')
        elif k in ('tf2', 'mc1'):
            li = ''.join(f'<li><b>({K[i]})</b> {e(c)}<br>{em(r)}</li>' for i, (c, r) in enumerate(zip(q['choices'], q['reasons'])))
            out += box(f'<div class="ans">正解　{ans_short(q)}</div><ul>{li}</ul>')
        elif k == 'en_explain':
            ms = ''.join(f'<div style="margin-top:1.5mm"><span class="lbl">解答例：{e(lab)}</span></div><div class="model">{e(m)} <span class="wc">（{len(re.findall(r"[A-Za-z0-9][A-Za-z0-9’\'-]*", m))}語）</span></div>' for lab, m in q['models'])
            out += box(crit_table(q['criteria']) + ms + '<ul>' + ''.join(f'<li>{em(x)}</li>' for x in q['explain']) + '</ul>')
        else:
            extra = ''
            if k == 'ja_limit':
                extra = f'<div style="font-size:8.4pt;margin-top:.6mm">模範解答 {len(q["answer"])}字・別解 {"・".join(str(len(a)) + "字" for a in q.get("alts", []))}（句読点を含む／制限 {q["limit"]}字以内）</div>'
            out += box(model_block(q) + extra + crit_table(q['criteria']) + '<ul>' + ''.join(f'<li>{em(x)}</li>' for x in q['explain']) + '</ul>')
    out += '<h4>全訳</h4><div class="trs">' + ''.join(f'<p>{e(p)}</p>' for p in P['translation']) + '</div>'
    out += '<h4>重要語句</h4><table class="voc">' + ''.join(f'<tr><td>{e(a)}</td><td>{e(b)}</td></tr>' for a, b in P['vocab']) + '</table></section>'
    return out

def akey_III(P):
    ms = ''.join(f'<div style="margin-top:1.5mm"><span class="lbl">解答例：{e(lab)}</span></div><div class="model">{e(m)} <span class="wc">（{len(re.findall(r"[A-Za-z0-9][A-Za-z0-9’\'-]*", m))}語）</span></div>' for lab, m in P['models'])
    return (f'<section class="part akey"><h3>III　解答・解説（{P["points"]}点）</h3>' + box(f'<div class="iiiq" style="margin:0">{e(P["stem"])}</div>' + crit_table(P['criteria']) + ms)
            + '<h4>書き方のポイント・減点されやすい点</h4>' + box('<ul>' + ''.join(f'<li>{em(x)}</li>' for x in P['tips']) + '</ul>') + '</section>')

def akey_IV(P):
    out = f'<section class="part akey"><h3>IV　解答・解説（{P["points"]}点）</h3>'
    for it in P['items']:
        lab = '(A)' if it['label'] == 'A' else f'(B)({it["sub"]})'
        under = '／'.join(re.findall(r'\{u[A-Za-z0-9]*\|([^}]*)\}', ''.join(it['text'])))
        out += f'<h4>{lab}（{e(it["who"])}・{it["points"]}点）</h4>' + box(
            f'<div style="font-size:9pt"><span class="lbl">下線部</span>{e(under)}</div>' + model_block(it) + crit_table(it['criteria'])
            + '<ul>' + ''.join(f'<li>{em(x)}</li>' for x in it['explain']) + '</ul>')
    return out + '</section>'

def summary(D, R):
    rows = ''
    for it in D['I']['items']: rows += f'<tr><td>I</td><td>({it["label"]})</td><td>解説参照（模範訳・採点基準つき）</td><td>{it["points"]}</td></tr>'
    for q in D['II']['questions']:
        a = ans_short(q)
        if len(a) > 56: a = a[:54] + '…（解説参照）'
        rows += f'<tr><td>II</td><td>設問({q["no"]})</td><td>{e(a)}</td><td>{q["points"]}</td></tr>'
    rows += f'<tr><td>III</td><td>—</td><td>解答例は解説参照（採点観点つき）</td><td>{D["III"]["points"]}</td></tr>'
    for it in D['IV']['items']:
        lab = '(A)' if it['label'] == 'A' else f'(B)({it["sub"]})'
        rows += f'<tr><td>IV</td><td>{lab}</td><td>解説参照（模範訳・採点基準つき）</td><td>{it["points"]}</td></tr>'
    return f'<section class="part akey"><h3>解答一覧　予想問題 第{R}回</h3><table class="sum"><tr><th>大問</th><th>設問</th><th>解答</th><th>配点</th></tr>{rows}<tr><td colspan="3" style="text-align:right">合計（IV(B)は(イ)(ロ)のどちらか一方）</td><td>{total(D)}</td></tr></table></section>'

def total(D):
    iv = [it['points'] for it in D['IV']['items']]
    return sum(it['points'] for it in D['I']['items']) + sum(q['points'] for q in D['II']['questions']) + D['III']['points'] + iv[0] + iv[1]

def check_points(D):
    assert sum(it['points'] for it in D['I']['items']) == D['I']['points'] == 30
    assert sum(q['points'] for q in D['II']['questions']) == D['II']['points'] == 50, sum(q['points'] for q in D['II']['questions'])
    assert D['III']['points'] == 30
    iv = [it['points'] for it in D['IV']['items']]
    assert iv[0] + iv[1] == D['IV']['points'] == 40 and iv[1] == iv[2]
    assert total(D) == 150

def write(doc, out):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    css = [CSS(string=mono(kb.CSS_TEXT + OSAKA_CSS), font_config=FC)]
    HTML(string=mono(doc), base_url=str(HERE)).write_pdf(out, stylesheets=css, font_config=FC, metadata={'author': 'マナトビ'})
    return out

def load(R): return importlib.import_module(f'o{R}').DATA

def build_q(R):
    D = load(R); check_points(D)
    body = cover(R, 'q') + part_I(D['I']) + part_II(D['II']) + part_III(D['III']) + part_IV(D['IV']) + sheet(D, R) + colophon(R, 'q')
    return write(f'<html lang="ja"><head><meta charset="utf-8"><title>予想問題 第{R}回 英語 問題</title></head><body>{body}</body></html>', OUT_DIR / f'manatobi_osaka_eng_yoso{R}_mondai.pdf')

def build_a(R):
    D = load(R); check_points(D)
    body = cover(R, 'a') + summary(D, R) + akey_I(D['I']) + akey_II(D['II']) + akey_III(D['III']) + akey_IV(D['IV']) + colophon(R, 'a')
    return write(f'<html lang="ja"><head><meta charset="utf-8"><title>予想問題 第{R}回 英語 解答・解説</title></head><body>{body}</body></html>', OUT_DIR / f'manatobi_osaka_eng_yoso{R}_kaitou.pdf')

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
