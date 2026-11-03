# -*- coding: utf-8 -*-
"""秋田大学 前期日程 英語 予想問題の PDF（問題／解答・解説）を作る。白黒・A4縦。
紙面の部品・書体・白黒化は神戸大（../kobe_mock/render.py）と北大（../hokudai_mock/render.py）の部品を読み込んで流用する。
  python3 render.py 1   → .tmpwork/akita_mock/manatobi_akita_eng_yoso1_{mondai,kaitou}.pdf
データ：aN.py（N＝回）。DATA = {'points': {'1':…,'2':…,'3':…}, '1': 読解, '2': 読解, '3': 英作文, 'names': [...]}
読解 = {'kind': 'reading', 'title', 'headline', 'paras', 'notes', 'questions': [{'no','stem','ja','choices'(4),'answer','explain','points'}], 'translation', 'vocab'}
英作文 = {'kind': 'write', 'title', 'task': [英文], 'limit': 'about 120 words', 'lines', 'criteria', 'models', 'tips', 'task_translation'}
本文の記法：{u|…} 設問で問う語句（下線）・word* 注のある語。設問文の <<…>> は本文中の語句（太字斜体）。
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
# 北大の render.py は自分のフォルダを sys.path の先頭に入れるので，秋田のフォルダを先頭に戻す
sys.path.insert(0, str(HERE))
from weasyprint import HTML, CSS
e, mono, FC, crit_table = kb.e, kb.mono, kb.FC, kb.crit_table
OUT_DIR = Path(os.environ.get('AKITA_OUT_DIR', str(ROOT / '.tmpwork/akita_mock')))
DISCLAIMER = '秋田大学の過去問・公式問題ではありません。予想問題であり，大学とは関係がありません。'
ROMAN = {'1': 'Ⅰ', '2': 'Ⅱ', '3': 'Ⅲ'}
CL = 'ABCD'
PAGE_INFO = {}

def em(s): return kb.em(s)

def mark(t):
    t = e(t)
    t = re.sub(r'\{u\|([^}]*)\}', r'<span class="ul">\1</span>', t)
    return re.sub(r'(?<=[A-Za-z)])\*', '<sup class="ast">＊</sup>', t)

def stem_html(t):
    return re.sub(r'&lt;&lt;(.+?)&gt;&gt;', r'<b><i>\1</i></b>', e(t))

def plain(t):
    t = re.sub(r'\{u\|([^}]*)\}', r'\1', t)
    return t.replace('<<', '').replace('>>', '').replace('*', '')

def text_of(P): return plain(' '.join(P['paras']))

H_CSS = hk.H_CSS + """
.passage .pn { font-family: 'Noto Serif'; font-weight: 700; margin-right: 1.8mm; }
.headline { font-family: 'Noto Serif'; font-weight: 700; font-size: 11.5pt; text-align: center; margin: 3mm 0 2.5mm; }
.mq { margin: 2.6mm 0 0; break-inside: avoid; font-family: 'Noto Serif'; font-size: 10pt; }
.mq .st { display: grid; grid-template-columns: 13mm 1fr; }
.mq .st .n { font-family: 'Noto Sans CJK JP'; font-weight: 700; font-size: 9.4pt; }
.mq .ch { margin: .8mm 0 0 13mm; }
.mq .ch div { margin: .3mm 0; padding-left: 7mm; text-indent: -7mm; }
.task p { font-size: 10pt; line-height: 1.9; margin: 0 0 1.5mm; font-family: 'Noto Serif'; }
.ansgrid { border-collapse: collapse; margin: 1.5mm 0 3mm; }
.ansgrid td, .ansgrid th { border: .6pt solid #555; width: 15mm; height: 9mm; text-align: center; font-size: 9pt; }
.ansgrid th { height: 6mm; font-weight: 500; }
"""

def cover(R, kind, D):
    sub = '問題' if kind == 'q' else '解答・解説'
    rng = PAGE_INFO.get((R, kind), '')
    pts = '・'.join(f'{ROMAN[n]} {D["points"][n]}点' for n in ('1', '2', '3')) + '（計200点）'
    if kind == 'q':
        items = [f'問題部分と解答用紙で構成されている{rng}。答えは解答用紙の決められた欄に書くこと。',
                 '試験時間の目安は60分。大問は Ⅰ〜Ⅲ の3題。Ⅰ・Ⅱは英文の設問に記号 (A)〜(D) で答え，Ⅲは英語で1段落の文章を書く。',
                 f'配点は {pts}。本予想問題が独自に定めた配点である。',
                 '本冊子の英文・設問はすべてオリジナルである。登場する人物・団体・地名は架空。']
    else:
        items = [f'解答一覧・大問ごとの解答と解説{rng}。',
                 '記号で答える設問は，正解の根拠となる段落と，他の選択肢が誤りである理由を示した。',
                 'Ⅲの英作文は，採点観点と複数の解答例を示した。',
                 '英文は全訳と重要語句つき。設問文には日本語訳をつけた。',
                 f'配点は {pts}。本予想問題が独自に定めた配点で，大学の配点ではない。']
    lis = ''.join(f'<li>{x}</li>' for x in items)
    return f"""<section class="ocover">
<div class="brand"><img src="file://{HERE}/logo_gray.png"><div class="kicker">学習アプリ マナトビ</div></div>
<div class="box">{R}</div>
<div class="l1">予想問題 第{R}回</div>
<div class="l2">前期日程 対策</div>
<h1>英語{'問題' if kind == 'q' else '解答'}</h1>
<div class="sub">秋田大学（国際資源学部・教育文化学部・医学部保健学科・情報データ科学部 共通問題）の出題形式に準拠 ／ {sub}</div>
<div class="chui"><span class="ttl">注　意</span><ol>{lis}</ol></div>
<div class="disc">{DISCLAIMER}<br>本冊子は過去の出題形式を分析して作成した練習用の教材です。</div>
<div class="foot"><span>学習アプリ マナトビ</span><span>予想問題 第{R}回 ／ {sub}</span></div></section>"""

def head(n, title, pts):
    return f'<div class="parthead" data-run="{ROMAN[n]}　{title}"><span class="roman">{ROMAN[n]}</span><span class="t">{title}（配点 {pts}点）</span></div>'

def notes_html(notes):
    if not notes: return ''
    rows = ''.join(f'<tr><td class="en">{e(a)}</td><td>{e(b)}</td></tr>' for a, b in notes)
    return f'<div class="notes"><div class="nh"></div><table>{rows}</table></div>'

def passage_html(P):
    out = ''.join(f'<p><span class="pn">[{i + 1}]</span>{mark(p)}</p>' for i, p in enumerate(P['paras']))
    return f'<div class="headline">{e(P["headline"])}</div><div class="passage">{out}</div>'

def mq_html(q):
    ch = ''.join(f'<div>({CL[i]}) {e(c)}</div>' for i, c in enumerate(q['choices']))
    return f'<div class="mq"><div class="st"><span class="n">問 {q["no"]}</span><span>{stem_html(q["stem"])}</span></div><div class="ch">{ch}</div></div>'

def part_html(P, n, pts):
    out = f'<section class="part">{head(n, P["title"], pts)}'
    if P['kind'] == 'reading':
        out += f'<p class="intro en" style="font-family:\'Noto Serif\'">{e(P["intro"])}</p>'
        out += passage_html(P) + notes_html(P.get('notes'))
        out += ''.join(mq_html(q) for q in P['questions'])
    else:
        out += '<div class="task">' + ''.join(f'<p>{e(p)}</p>' for p in P['task']) + '</div>'
    return out + '</section>'

def sheet(D, R):
    H4 = '<h4 style="font-family:MPR;font-weight:800;margin:3mm 0 1mm">{}</h4>'
    out = f'<section class="sheet"><h2>解答用紙　予想問題 第{R}回</h2><div style="font-size:8.6pt;margin-bottom:2mm">受験番号・氏名欄は省略。Ⅰ・Ⅱは記号 (A)〜(D) を書く。</div>'
    for n in ('1', '2'):
        qs = D[n]['questions']
        th = ''.join(f'<th>問 {q["no"]}</th>' for q in qs)
        td = ''.join('<td></td>' for _ in qs)
        out += H4.format(ROMAN[n]) + f'<table class="ansgrid"><tr>{th}</tr><tr>{td}</tr></table>'
    P = D['3']
    out += H4.format(f'{ROMAN["3"]}（{P["limit"]}）') + hk.wlines(P.get('lines', 13))
    return out + '</section>'

def colophon(R, kind):
    return f"""<section class="colophon"><div class="box"><h2>奥付</h2>
<div>予想問題 第{R}回　英語　{'問題' if kind == 'q' else '解答・解説'}</div>
<div>対象：秋田大学 前期日程 英語（国際資源学部・教育文化学部・医学部保健学科・情報データ科学部 共通問題）の受験準備</div>
<div>作成：学習アプリ マナトビ 編集部（2026年11月）</div>
<div>作成方法：2024〜2026年度の出題形式・分量・難易度を分析し，英文・設問をすべて新たに書き下ろした。</div>
<div class="disc">{DISCLAIMER}</div>
<div style="margin-top:2.5mm;font-size:8.4pt">本冊子の英文は実在の記事・書籍・論文・統計からの引用・翻案ではありません。登場する人物・団体・地名・数値は架空です。無断転載・再配布を禁じます。</div>
<img src="file://{HERE}/logo_gray.png"></div></section>"""

# ---------------------------------------------------------------- 解答・解説
def box(inner): return f'<div class="abox">{inner}</div>'
def ul(items): return '<ul>' + ''.join(f'<li>{em(x)}</li>' for x in items) + '</ul>'
def wc(m): return len(re.findall(r"[A-Za-z0-9][A-Za-z0-9’'-]*", m))

def akey_reading(P, n, pts):
    out = f'<section class="part akey"><h3>{ROMAN[n]}　解答・解説（{pts}点）</h3>'
    for q in P['questions']:
        c = q['answer']
        body = f'<div class="ans">正解　({CL[c]}) <span class="en">{e(q["choices"][c])}</span></div>'
        body += f'<div style="font-size:8.8pt;margin:.6mm 0">設問の訳：{e(q["ja"])}</div>'
        out += f'<h4>問 {q["no"]}（{q["points"]}点）</h4>' + box(body + ul(q['explain']))
    out += f'<h4>全訳（{e(P["headline"])}）</h4><div class="trs">' + ''.join(f'<p>[{i + 1}] {e(t)}</p>' for i, t in enumerate(P['translation'])) + '</div>'
    if P.get('vocab'):
        out += '<h4>重要語句</h4><table class="voc">' + ''.join(f'<tr><td>{e(a)}</td><td>{e(b)}</td></tr>' for a, b in P['vocab']) + '</table>'
    return out + '</section>'

def akey_write(P, n, pts):
    ms = ''.join(f'<div style="margin-top:1.5mm"><span class="lbl">解答例：{e(lab)}</span></div><div class="model">{e(m)} <span class="wc">（{wc(m)}語）</span></div>' for lab, m in P['models'])
    out = f'<section class="part akey"><h3>{ROMAN[n]}　解答・解説（{pts}点）</h3>'
    out += '<h4>問題文の訳</h4><div class="trs">' + ''.join(f'<p>{e(t)}</p>' for t in P['task_translation']) + '</div>'
    out += f'<h4>採点観点と解答例（{pts}点）</h4>' + box(crit_table(P['criteria']) + ms)
    out += '<h4>書き方のポイント・減点されやすい点</h4>' + box(ul(P['tips']))
    return out + '</section>'

def summary_table(D, R):
    rows = ''
    for n in ('1', '2'):
        qs = D[n]['questions']
        a = '　'.join(f'問{q["no"]} ({CL[q["answer"]]})' for q in qs)
        rows += f'<tr><td>{ROMAN[n]}</td><td>問1〜問{len(qs)}（各{qs[0]["points"]}点）</td><td>{e(a)}</td><td>{D["points"][n]}</td></tr>'
    rows += f'<tr><td>Ⅲ</td><td>英作文</td><td>解答例は解説参照（採点観点つき）</td><td>{D["points"]["3"]}</td></tr>'
    return f'<section class="part akey"><h3>解答一覧　予想問題 第{R}回</h3><table class="sum"><tr><th>大問</th><th>設問</th><th>解答</th><th>配点</th></tr>{rows}<tr><td colspan="3" style="text-align:right">合計</td><td>200</td></tr></table></section>'

def check_points(D):
    assert sum(D['points'].values()) == 200
    for n in ('1', '2'):
        assert sum(q['points'] for q in D[n]['questions']) == D['points'][n], (n, 'sum')
    assert sum(p for _, p in D['3']['criteria']) == D['points']['3'], ('3', 'criteria')

def write(doc, out):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    css = [CSS(string=mono(kb.CSS_TEXT + H_CSS), font_config=FC)]
    HTML(string=mono(doc), base_url=str(HERE)).write_pdf(out, stylesheets=css, font_config=FC, metadata={'author': 'マナトビ'})
    return out

def load(R): return importlib.import_module(f'a{R}').DATA

def build_q(R):
    D = load(R); check_points(D)
    body = cover(R, 'q', D) + ''.join(part_html(D[n], n, D['points'][n]) for n in ('1', '2', '3')) + sheet(D, R) + colophon(R, 'q')
    return write(f'<html lang="ja"><head><meta charset="utf-8"><title>予想問題 第{R}回 英語 問題</title></head><body>{body}</body></html>', OUT_DIR / f'manatobi_akita_eng_yoso{R}_mondai.pdf')

def build_a(R):
    D = load(R); check_points(D)
    parts = ''.join((akey_reading if D[n]['kind'] == 'reading' else akey_write)(D[n], n, D['points'][n]) for n in ('1', '2', '3'))
    body = cover(R, 'a', D) + summary_table(D, R) + parts + colophon(R, 'a')
    return write(f'<html lang="ja"><head><meta charset="utf-8"><title>予想問題 第{R}回 英語 解答・解説</title></head><body>{body}</body></html>', OUT_DIR / f'manatobi_akita_eng_yoso{R}_kaitou.pdf')

if __name__ == '__main__':
    R = sys.argv[1] if len(sys.argv) > 1 else '1'
    for kind, f in (('q', build_q), ('a', build_a)):
        o = f(R); PAGE_INFO[(R, kind)] = hk.page_range(o, kind)
        o = f(R); print(o.name, o.stat().st_size // 1024, 'KB', PAGE_INFO[(R, kind)])
