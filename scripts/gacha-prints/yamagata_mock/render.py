# -*- coding: utf-8 -*-
"""山形大学 前期日程 英語 予想問題の PDF（問題／解答・解説）を作る。白黒・A4縦。
紙面の部品・書体・白黒化は神戸大（../kobe_mock/render.py）と北大（../hokudai_mock/render.py）の部品を読み込んで流用する。
  python3 render.py 1   → .tmpwork/yamagata_mock/manatobi_yamagata_eng_yoso{1}_{mondai,kaitou}.pdf
データ：yN.py（N＝回）。DATA = {'points': {'1':…[,'2':…]}, '1': 大問[, '2': 大問], 'names': [...]}
大問 = {'title', 'intro', 'passages': [{'headline','paras','notes','translation'}], 'questions': [...], 'vocab'}
  段落番号 ①〜 は大問の中で通し番号（英文が2本でも続けて数える）。
設問の kind：syn（下線語の同意語。items=[{label,para,word,choices,answer,explain}]）／blank（[[a]] に語群から補充・1語余る）／
  order（{o|…} の語句の並べ替え）／mc（1つ選ぶ）／multi（n個選ぶ。answers）／tf（T/F。answers）／
  trans（下線部 {u|…} の和訳）／explain（下線部の日本語説明。lo〜hi字）／oneword（要約文の空所に英語1語）／write（英作文）。
  para を持つ設問は，その段落に対象の下線（target）があることを check.py が確かめる。
本文の記法：{u|…} 下線・{s|…} 同意語を問う下線・{o|a / b / c} 並べ替える語句（下線つき括弧）・[[a]] 空所・word* 注のある語。
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
# 北大の render.py は自分のフォルダを sys.path の先頭に入れるので，山形のフォルダを先頭に戻す
sys.path.insert(0, str(HERE))
from weasyprint import HTML, CSS
e, mono, FC, genko, crit_table = kb.e, kb.mono, kb.FC, kb.genko, kb.crit_table
OUT_DIR = Path(os.environ.get('YAMAGATA_OUT_DIR', str(ROOT / '.tmpwork/yamagata_mock')))
DISCLAIMER = '山形大学の過去問・公式問題ではありません。予想問題であり，大学とは関係がありません。'
ROMAN = {'1': 'Ⅰ', '2': 'Ⅱ'}
PN = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'
CL = 'ABCDEF'
PAGE_INFO = {}

def em(s): return kb.em(s)

def mark(t):
    t = e(t)
    t = re.sub(r'\{[us]\|([^}]*)\}', r'<span class="ul">\1</span>', t)
    t = re.sub(r'\{o\|([^}]*)\}', r'<span class="ul">(&#8194;\1&#8194;)</span>', t)
    t = re.sub(r'\[\[([a-e])\]\]', r'<span class="blank">[&#8194;\1&#8194;]</span>', t)
    return re.sub(r'(?<=[A-Za-z)])\*', '<sup class="ast">＊</sup>', t)

def plain(t):
    t = re.sub(r'\{[us]\|([^}]*)\}', r'\1', t)
    t = re.sub(r'\{o\|([^}]*)\}', ' ', t)
    return re.sub(r'\[\[[a-e]\]\]', ' ', t).replace('*', '')

def all_paras(P): return [p for ps in P['passages'] for p in ps['paras']]

def filled(P):
    """空所・並べ替えに正解を入れた本文（語数・照合用）"""
    bl = {k: v for q in P['questions'] if q['kind'] == 'blank' for k, v in q['answers'].items()}
    od = [q['answer'] for q in P['questions'] if q['kind'] == 'order']
    out = []
    for p in all_paras(P):
        p = re.sub(r'\[\[([a-e])\]\]', lambda m: bl.get(m.group(1), ' '), p)
        p = re.sub(r'\{o\|[^}]*\}', lambda m: od.pop(0) if od else ' ', p)
        out.append(plain(p))
    return ' '.join(out)

H_CSS = hk.H_CSS + """
.passage .pn { font-family: 'Noto Serif CJK JP'; margin-right: 1.6mm; }
.headline { font-family: 'Noto Serif'; font-weight: 700; font-size: 11.2pt; text-align: center; margin: 3mm 0 2.2mm; }
.vocab-box { border: .6pt solid #777; padding: 1.5mm 4mm; margin: 2mm 0 3mm; font-size: 9pt; }
.vocab-box .vh { font-family: 'Noto Serif'; font-weight: 700; margin-bottom: .6mm; }
.vocab-box table td { padding: .2mm 4mm .2mm 0; vertical-align: top; }
.vocab-box td.en { font-family: 'Noto Serif'; font-style: italic; }
.qh { font-family: 'Noto Serif'; font-weight: 700; font-size: 11pt; margin: 4mm 0 1mm; }
.yq { margin: 2.4mm 0 0; break-inside: avoid; font-family: 'Noto Serif'; font-size: 10pt; }
.yq .st { display: grid; grid-template-columns: 11mm 1fr; }
.yq .st .n { font-weight: 700; }
.yq .body { margin: .8mm 0 0 11mm; }
.yq .body .ch div { margin: .3mm 0; padding-left: 7mm; text-indent: -7mm; }
.yq .sub { margin: 1.2mm 0 .3mm; }
.yq .chrow { display: flex; flex-wrap: wrap; gap: 0 6mm; margin-left: 7mm; }
.yq .wordlist { border: .6pt solid #999; display: inline-block; padding: .8mm 4mm; margin: 1mm 0; }
.ansgrid { border-collapse: collapse; margin: 1mm 0 2mm; }
.ansgrid td, .ansgrid th { border: .6pt solid #555; min-width: 13mm; height: 8.5mm; text-align: center; font-size: 8.8pt; padding: 0 1.5mm; }
.ansgrid th { height: 5.5mm; font-weight: 500; }
"""

def cover(R, kind, D):
    sub = '問題' if kind == 'q' else '解答・解説'
    rng = PAGE_INFO.get((R, kind), '')
    parts = [n for n in ('1', '2') if n in D]
    pts = '・'.join(f'{ROMAN[n]} {D["points"][n]}点' for n in parts) + '（計200点）'
    if kind == 'q':
        items = [f'問題部分と解答用紙で構成されている{rng}。答えは解答用紙の決められた欄に書くこと。',
                 f'試験時間の目安は90分。大問は {"・".join(ROMAN[n] for n in parts)} の{len(parts)}題で，英文は2本。設問の指示は英語で書かれている。',
                 '日本語で答える設問（和訳・字数指定の説明）と，英語で答える設問（英作文など）がある。',
                 f'配点は {pts}。本予想問題が独自に定めた配点である。',
                 '本冊子の英文・設問はすべてオリジナルである。登場する人物・団体・地名は架空。']
    else:
        items = [f'解答一覧・設問ごとの解答と解説{rng}。',
                 '記号で答える設問は，正解の根拠と，ほかの選択肢が誤りである理由を示した。',
                 '和訳・日本語の説明・英作文は，採点基準と解答例（別解）を示した。',
                 '英文は全訳と重要語句つき。設問の指示文には日本語訳をつけた。',
                 f'配点は {pts}。本予想問題が独自に定めた配点で，大学の配点ではない。']
    lis = ''.join(f'<li>{x}</li>' for x in items)
    return f"""<section class="ocover">
<div class="brand"><img src="file://{HERE}/logo_gray.png"><div class="kicker">学習アプリ マナトビ</div></div>
<div class="box">{R}</div>
<div class="l1">予想問題 第{R}回</div>
<div class="l2">前期日程 対策</div>
<h1>英語{'問題' if kind == 'q' else '解答'}</h1>
<div class="sub">山形大学（人文社会科学部・医学部ほか 英語を課す学部の共通問題）の出題形式に準拠 ／ {sub}</div>
<div class="chui"><span class="ttl">注　意</span><ol>{lis}</ol></div>
<div class="disc">{DISCLAIMER}<br>本冊子は過去の出題形式を分析して作成した練習用の教材です。</div>
<div class="foot"><span>学習アプリ マナトビ</span><span>予想問題 第{R}回 ／ {sub}</span></div></section>"""

def head(n, title, pts):
    return f'<div class="parthead" data-run="{ROMAN[n]}　{title}"><span class="roman">{ROMAN[n]}</span><span class="t">{title}（配点 {pts}点）</span></div>'

def vocab_box(notes):
    if not notes: return ''
    rows = ''.join(f'<tr><td class="en">{e(a)}</td><td>{e(b)}</td></tr>' for a, b in notes)
    return f'<div class="vocab-box"><div class="vh">Word notes</div><table>{rows}</table></div>'

def passages_html(P):
    out, k = '', 0
    for ps in P['passages']:
        out += f'<div class="headline">{e(ps["headline"])}</div><div class="passage">'
        for p in ps['paras']:
            out += f'<p><span class="pn">{PN[k]}</span>{mark(p)}</p>'; k += 1
        out += '</div>' + vocab_box(ps.get('notes'))
    return out

def chs(choices, row=False):
    if row: return '<div class="chrow">' + ''.join(f'<span>({CL[i]}) {e(c)}</span>' for i, c in enumerate(choices)) + '</div>'
    return '<div class="ch">' + ''.join(f'<div>({CL[i]}) {e(c)}</div>' for i, c in enumerate(choices)) + '</div>'

def q_body(q):
    k = q['kind']
    if k == 'syn':
        return ''.join(f'<div class="sub">({it["label"]}) <b><i>{e(it["word"])}</i></b> in paragraph {PN[it["para"] - 1]}</div>' + chs(it['choices'], row=True) for it in q['items'])
    if k == 'blank':
        return f'<div class="wordlist">{" / ".join(e(w) for w in q["words"])}</div>'
    if k == 'order':
        return f'<div class="wordlist">{" / ".join(e(w) for w in q["words"])}</div>'
    if k in ('mc', 'multi'):
        return chs(q['choices'])
    if k == 'tf':
        return '<div class="ch">' + ''.join(f'<div>({CL[i]}) {e(s)}</div>' for i, s in enumerate(q['statements'])) + '</div>'
    if k == 'oneword':
        return f'<div class="sub">{e(q["sentence"])}</div>'
    return ''

def stem_txt(q):
    s = q['stem']
    return re.sub(r'¶(\d+)', lambda m: PN[int(m.group(1)) - 1], s)

def q_html(q):
    return f'<div class="yq"><div class="st"><span class="n">Q{q["no"]}</span><span>{e(stem_txt(q))}</span></div><div class="body">{q_body(q)}</div></div>'

def part_html(P, n, pts):
    out = f'<section class="part">{head(n, P["title"], pts)}'
    out += f'<p class="intro" style="font-family:\'Noto Serif\'">{e(P["intro"])}</p>'
    out += passages_html(P) + '<div class="qh">Questions</div>' + ''.join(q_html(q) for q in P['questions'])
    return out + '</section>'

def grid(labels):
    th = ''.join(f'<th>{e(x)}</th>' for x in labels); td = ''.join('<td></td>' for _ in labels)
    return f'<table class="ansgrid"><tr>{th}</tr><tr>{td}</tr></table>'

def sheet(D, R):
    H4 = '<h4 style="font-family:MPR;font-weight:800;margin:3mm 0 1mm">{}</h4>'
    out = f'<section class="sheet"><h2>解答用紙　予想問題 第{R}回</h2><div style="font-size:8.6pt;margin-bottom:2mm">受験番号・氏名欄は省略。記号は (A) のように書く。</div>'
    later = []
    for n in ('1', '2'):
        if n not in D: continue
        out += H4.format(ROMAN[n])
        for q in D[n]['questions']:
            k, lab = q['kind'], f'Q{q["no"]}'
            if k == 'syn': out += f'<div>{lab}</div>' + grid([f'({it["label"]})' for it in q['items']])
            elif k == 'blank': out += f'<div>{lab}</div>' + grid([f'[{x}]' for x in sorted(q['answers'])])
            elif k == 'tf': out += f'<div>{lab}</div>' + grid([f'({CL[i]})' for i in range(len(q['statements']))])
            elif k in ('mc', 'multi', 'oneword'): out += f'<div class="row"><span class="h">{lab}</span><span>［　　　　　　　　　］</span></div>'
            elif k == 'order': out += f'<div class="row lines"><span class="h">{lab}</span><span></span></div>'
            elif k == 'explain': out += f'<div class="row tall"><span class="h">{lab}</span><div>{genko(q["hi"] + (20 - q["hi"] % 20) % 20)}</div></div>'
            elif k == 'trans': out += f'<div>{lab}</div>' + hk.wlines(4, False)
            elif k == 'write': later.append((n, q))
    for n, q in later:
        out += H4.format(f'{ROMAN[n]}　Q{q["no"]}（{q["limit"]}）') + hk.wlines(q.get('lines', 12))
    return out + '</section>'

def colophon(R, kind):
    return f"""<section class="colophon"><div class="box"><h2>奥付</h2>
<div>予想問題 第{R}回　英語　{'問題' if kind == 'q' else '解答・解説'}</div>
<div>対象：山形大学 前期日程 英語（人文社会科学部・医学部ほか 英語を課す学部の共通問題）の受験準備</div>
<div>作成：学習アプリ マナトビ 編集部（2026年11月）</div>
<div>作成方法：2024〜2026年度の出題形式・分量・難易度を分析し，英文・設問をすべて新たに書き下ろした。</div>
<div class="disc">{DISCLAIMER}</div>
<div style="margin-top:2.5mm;font-size:8.4pt">本冊子の英文は実在の記事・書籍・論文・統計からの引用・翻案ではありません。登場する人物・団体・地名・数値は架空です。無断転載・再配布を禁じます。</div>
<img src="file://{HERE}/logo_gray.png"></div></section>"""

# ---------------------------------------------------------------- 解答・解説
def box(inner): return f'<div class="abox">{inner}</div>'
def ul(items): return '<ul>' + ''.join(f'<li>{em(x)}</li>' for x in items) + '</ul>'
def wc(m): return len(re.findall(r"[A-Za-z0-9][A-Za-z0-9’'-]*", m))

def answer_str(q):
    k = q['kind']
    if k == 'syn': return '　'.join(f'({it["label"]}) {CL[it["answer"]]}' for it in q['items'])
    if k == 'blank': return '　'.join(f'[{x}] {q["answers"][x]}' for x in sorted(q['answers']))
    if k == 'order': return q['answer']
    if k == 'mc': return f'({CL[q["answer"]]})'
    if k == 'multi': return '・'.join(f'({CL[i]})' for i in q['answers'])
    if k == 'tf': return '　'.join(f'({CL[i]}) {v}' for i, v in enumerate(q['answers']))
    if k == 'oneword': return q['answer']
    return '解説参照'

def akey_q(q):
    k = q['kind']
    h = f'<h4>Q{q["no"]}（{q["points"]}点）</h4>'
    ja = f'<div style="font-size:8.8pt;margin:.6mm 0">設問の訳：{e(q["ja"])}</div>'
    if k == 'syn':
        lis = [f'({it["label"]}) {it["word"]} → ({CL[it["answer"]]}) {it["choices"][it["answer"]]}：{it["explain"]}' for it in q['items']]
        return h + box(f'<div class="ans">正解　{e(answer_str(q))}</div>' + ja + ul(lis))
    if k in ('blank', 'order', 'mc', 'multi', 'tf', 'oneword'):
        return h + box(f'<div class="ans">正解　<span class="en">{e(answer_str(q))}</span></div>' + ja + ul(q['explain']))
    if k == 'write':
        ms = ''.join(f'<div style="margin-top:1.5mm"><span class="lbl">解答例：{e(lab)}</span></div><div class="model">{e(m)} <span class="wc">（{wc(m)}語）</span></div>' for lab, m in q['models'])
        return h + box(ja + crit_table(q['criteria']) + ms) + '<h4>書き方のポイント・減点されやすい点</h4>' + box(ul(q['tips']))
    out = f'<div><span class="lbl">解答例</span><span class="ans">{e(q["answer"])}</span></div>'
    for a in q.get('alts', []): out += f'<div style="margin-top:.8mm"><span class="lbl">別解</span><span class="x-ul">{e(a)}</span></div>'
    if k == 'explain':
        out += f'<div style="font-size:8.4pt;margin-top:.6mm">字数：{"・".join(f"{len(a)}字" for a in [q["answer"]] + q.get("alts", []))}（{q["lo"]}〜{q["hi"]}字）</div>'
    return h + box(out + ja + crit_table(q['criteria']) + ul(q['explain']))

def akey(P, n, pts):
    out = f'<section class="part akey"><h3>{ROMAN[n]}　解答・解説（{pts}点）</h3>' + ''.join(akey_q(q) for q in P['questions'])
    k = 0
    for ps in P['passages']:
        out += f'<h4>全訳（{e(ps["headline"])}）</h4><div class="trs">'
        for t in ps['translation']:
            out += f'<p>{PN[k]} {e(t)}</p>'; k += 1
        out += '</div>'
    if P.get('vocab'):
        out += '<h4>重要語句</h4><table class="voc">' + ''.join(f'<tr><td>{e(a)}</td><td>{e(b)}</td></tr>' for a, b in P['vocab']) + '</table>'
    return out + '</section>'

def summary_table(D, R):
    rows = ''
    for n in ('1', '2'):
        if n not in D: continue
        for q in D[n]['questions']:
            a = answer_str(q) if q['kind'] not in ('trans', 'explain', 'write') else '解答例は解説参照（採点基準つき）'
            rows += f'<tr><td>{ROMAN[n]}</td><td>Q{q["no"]}</td><td>{e(a)}</td><td>{q["points"]}</td></tr>'
    return f'<section class="part akey"><h3>解答一覧　予想問題 第{R}回</h3><table class="sum"><tr><th>大問</th><th>設問</th><th>解答</th><th>配点</th></tr>{rows}<tr><td colspan="3" style="text-align:right">合計</td><td>200</td></tr></table></section>'

def check_points(D):
    assert sum(D['points'].values()) == 200
    for n in D['points']:
        assert sum(q['points'] for q in D[n]['questions']) == D['points'][n], (n, 'sum')
        for q in D[n]['questions']:
            if q['kind'] in ('trans', 'explain', 'write'): assert sum(p for _, p in q['criteria']) == q['points'], (n, q['no'])

def write(doc, out):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    css = [CSS(string=mono(kb.CSS_TEXT + H_CSS), font_config=FC)]
    HTML(string=mono(doc), base_url=str(HERE)).write_pdf(out, stylesheets=css, font_config=FC, metadata={'author': 'マナトビ'})
    return out

def load(R): return importlib.import_module(f'y{R}').DATA

def build_q(R):
    D = load(R); check_points(D)
    body = cover(R, 'q', D) + ''.join(part_html(D[n], n, D['points'][n]) for n in ('1', '2') if n in D) + sheet(D, R) + colophon(R, 'q')
    return write(f'<html lang="ja"><head><meta charset="utf-8"><title>予想問題 第{R}回 英語 問題</title></head><body>{body}</body></html>', OUT_DIR / f'manatobi_yamagata_eng_yoso{R}_mondai.pdf')

def build_a(R):
    D = load(R); check_points(D)
    body = cover(R, 'a', D) + summary_table(D, R) + ''.join(akey(D[n], n, D['points'][n]) for n in ('1', '2') if n in D) + colophon(R, 'a')
    return write(f'<html lang="ja"><head><meta charset="utf-8"><title>予想問題 第{R}回 英語 解答・解説</title></head><body>{body}</body></html>', OUT_DIR / f'manatobi_yamagata_eng_yoso{R}_kaitou.pdf')

if __name__ == '__main__':
    R = sys.argv[1] if len(sys.argv) > 1 else '1'
    for kind, f in (('q', build_q), ('a', build_a)):
        o = f(R); PAGE_INFO[(R, kind)] = hk.page_range(o, kind)
        o = f(R); print(o.name, o.stat().st_size // 1024, 'KB', PAGE_INFO[(R, kind)])
