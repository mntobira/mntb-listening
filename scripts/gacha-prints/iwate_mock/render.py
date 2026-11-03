# -*- coding: utf-8 -*-
"""岩手大学 前期日程 英語 予想問題の PDF（問題／解答・解説）を作る。白黒・A4縦。
紙面の部品・書体・白黒化は神戸大（../kobe_mock/render.py）と北大（../hokudai_mock/render.py）の部品を読み込んで流用する。
  python3 render.py 1   → .tmpwork/iwate_mock/manatobi_iwate_eng_yoso1_{mondai,kaitou}.pdf
データ：iN.py（N＝回）。DATA = {'points': {'1':…,'2':…,'3':…}, '1': 大問, '2': 大問, '3': 大問, 'names': [...]}
大問 = {'title', 'intro', 'passages': [{'label','intro','paras','para_numbers','notes','translation'}], 'questions': [...], 'vocab'}
設問の kind：free（日本語で説明・和訳。limit があれば字数指定・原稿用紙）／mcset（記号選択の小問の組。items に blank・word・prompt）／
           write（英語で書く。table・expressions・limit）／jaen（和文英訳）。設問の ps は対応する英文の番号（既定 0）。
本文の記法：{u1|…} 下線部(1)・{sA|…} 語義を問う下線部(A)・{w6|…} 番号⑥の下線部・((1)) 空所①・word* 注のある語。
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
# 北大の render.py は自分のフォルダを sys.path の先頭に入れるので，岩手のフォルダを先頭に戻す
sys.path.insert(0, str(HERE))
from weasyprint import HTML, CSS
e, mono, FC, genko, crit_table = kb.e, kb.mono, kb.FC, kb.genko, kb.crit_table
OUT_DIR = Path(os.environ.get('IWATE_OUT_DIR', str(ROOT / '.tmpwork/iwate_mock')))
DISCLAIMER = '岩手大学の過去問・公式問題ではありません。予想問題であり，大学とは関係がありません。'
PN = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'
CL = 'abcde'
PAGE_INFO = {}

def em(s):
    t = kb.em(s)
    return re.sub(r'(?<![A-Za-z])\(([a-e])\)', r'<span class="x-b">(\1)</span>', t)

def mark(t):
    t = e(t)
    t = re.sub(r'\{u(\d)\|([^}]*)\}', r'<span class="lab">(\1)</span><span class="ul">\2</span>', t)
    t = re.sub(r'\{s([A-E])\|([^}]*)\}', r'<span class="lab">(\1)</span><span class="ul">\2</span>', t)
    t = re.sub(r'\{w(\d+)\|([^}]*)\}', lambda m: f'<span class="lab">{PN[int(m.group(1)) - 1]}</span><span class="ul">{m.group(2)}</span>', t)
    t = re.sub(r'\(\((\d+)\)\)', lambda m: f'<span class="blank">(&#8194;{PN[int(m.group(1)) - 1]}&#8194;)</span>', t)
    return re.sub(r'(?<=[A-Za-z)])\*', '<sup class="ast">＊</sup>', t)

def plain(t):
    t = re.sub(r'\{(?:[us][0-9A-E]|w\d+)\|([^}]*)\}', r'\1', t)
    return re.sub(r'\(\(\d+\)\)', ' ', t).replace('*', '')

def blank_answers(P):
    out = {}
    for q in P['questions']:
        if q['kind'] == 'mcset':
            for it in q['items']:
                if it.get('blank'): out[(q.get('ps', 0), it['blank'])] = it['choices'][it['answer']]
    return out

def filled(P, i):
    """i 番目の英文の空所に正解を入れた本文（語数・照合用）"""
    ans = blank_answers(P)
    t = ' '.join(P['passages'][i]['paras'])
    t = re.sub(r'\(\((\d+)\)\)', lambda m: ans.get((i, int(m.group(1))), ' '), t)
    return plain(t)

H_CSS = hk.H_CSS + """
.passage .pn { font-family: 'Noto Serif CJK JP'; margin-right: 1.5mm; }
.plabel { font-family: 'MPR'; font-weight: 800; font-size: 10.5pt; margin: 4mm 0 1mm; }
.mcs { margin: 1.2mm 0 0 12mm; font-size: 9.8pt; }
.mcs .it { display: grid; grid-template-columns: 8mm 1fr; margin: 1.4mm 0; break-inside: avoid; }
.mcs .pr { font-family: 'Noto Serif'; }
.mcs .ch { font-family: 'Noto Serif'; display: flex; flex-wrap: wrap; gap: 0 6mm; }
.mcs .ch.col { display: block; }
.mcs .ch.col span { display: block; }
.dtable { border-collapse: collapse; margin: 2.5mm auto; font-family: 'Noto Serif'; font-size: 9.4pt; }
.dtable th, .dtable td { border: .6pt solid #555; padding: 1mm 3mm; text-align: center; }
.dtable caption { font-size: 9pt; margin-bottom: 1mm; }
.task p { font-size: 10pt; line-height: 1.9; margin: 0 0 1.5mm; }
.task p.en { font-family: 'Noto Serif'; }
.exbox { border: .6pt solid #999; padding: 2mm 4mm; font-family: 'Noto Serif'; font-size: 9.8pt; line-height: 1.8; margin-top: 2mm; }
.jsrc { border: .6pt solid #999; padding: 2mm 4mm; font-size: 10pt; line-height: 1.9; margin: 2mm 0 0 12mm; }
"""

def cover(R, kind, D):
    sub = '問題' if kind == 'q' else '解答・解説'
    rng = PAGE_INFO.get((R, kind), '')
    pts = '・'.join(f'{n} {D["points"][n]}点' for n in ('1', '2', '3')) + '（計200点）'
    if kind == 'q':
        items = [f'問題部分と解答用紙で構成されている{rng}。答えは解答用紙の決められた欄に書くこと。',
                 '試験時間の目安は90分。大問は 1〜3 の3題。日本語で答える設問と英語で答える設問がある。',
                 f'配点は {pts}。本予想問題が独自に定めた配点である。',
                 '本冊子の英文・設問はすべてオリジナルである。登場する人物・団体・地名は架空。']
    else:
        items = [f'解答一覧・大問ごとの解答と解説{rng}。',
                 '日本語の説明・和訳・英文を書く設問は，要素ごとの採点基準と別解を示した。',
                 '英語で書く設問は，採点観点と複数の解答例を示した。',
                 '英文は全訳と重要語句つき。',
                 f'配点は {pts}。本予想問題が独自に定めた配点で，大学の配点ではない。']
    lis = ''.join(f'<li>{x}</li>' for x in items)
    return f"""<section class="ocover">
<div class="brand"><img src="file://{HERE}/logo_gray.png"><div class="kicker">学習アプリ マナトビ</div></div>
<div class="box">{R}</div>
<div class="l1">予想問題 第{R}回</div>
<div class="l2">前期日程 対策</div>
<h1>英語{'問題' if kind == 'q' else '解答'}</h1>
<div class="sub">岩手大学（人文社会科学部・教育学部 共通問題）の出題形式に準拠 ／ {sub}</div>
<div class="chui"><span class="ttl">注　意</span><ol>{lis}</ol></div>
<div class="disc">{DISCLAIMER}<br>本冊子は過去の出題形式を分析して作成した練習用の教材です。</div>
<div class="foot"><span>学習アプリ マナトビ</span><span>予想問題 第{R}回 ／ {sub}</span></div></section>"""

def head(n, title, pts):
    return f'<div class="parthead" data-run="{n}　{title}"><span class="roman">{n}</span><span class="t">{title}（配点 {pts}点）</span></div>'

def notes_html(notes):
    if not notes: return ''
    rows = ''.join(f'<tr><td class="en">{e(a)}</td><td>{e(b)}</td></tr>' for a, b in notes)
    return f'<div class="notes"><div class="nh"></div><table>{rows}</table></div>'

def passage_html(ps):
    out = ''
    for i, p in enumerate(ps['paras']):
        pn = f'<span class="pn">({i + 1})</span>' if ps.get('para_numbers') else ''
        out += f'<p>{pn}{mark(p)}</p>'
    return f'<div class="passage">{out}</div>'

def table_html(tb):
    head_ = ''.join(f'<th>{e(h)}</th>' for h in tb['head'])
    rows = ''.join('<tr>' + ''.join(f'<td>{e(str(c))}</td>' for c in r) + '</tr>' for r in tb['rows'])
    cap = f'<caption>{e(tb["caption"])}</caption>' if tb.get('caption') else ''
    note = f'<div style="font-size:8.4pt;text-align:center">{e(tb["note"])}</div>' if tb.get('note') else ''
    return f'<table class="dtable">{cap}<tr>{head_}</tr>{rows}</table>{note}'

def q_html(q):
    stem = f'<div class="stem"><span class="qn">設問 {q["no"]}</span><span>{e(q["stem"])}</span></div>'
    k = q['kind']
    if k == 'mcset':
        its = ''
        for it in q['items']:
            pr = f'<div class="pr">{mark(it["prompt"])}</div>' if it.get('prompt') else ''
            col = ' col' if it.get('col') else ''
            ch = ''.join(f'<span>({CL[i]}) {e(c)}</span>' for i, c in enumerate(it['choices']))
            its += f'<div class="it"><span>{it["label"]}</span><div>{pr}<div class="ch{col}">{ch}</div></div></div>'
        return f'<div class="hq">{stem}<div class="mcs">{its}</div></div>'
    if k == 'write':
        body = ''.join(f'<p class="{"en" if re.match(r"[A-Za-z(]", p) else ""}">{e(p)}</p>' for p in q.get('task', []))
        tb = table_html(q['table']) if q.get('table') else ''
        ex = f'<div class="exbox">{"<br>".join(e(x) for x in q["expressions"])}</div>' if q.get('expressions') else ''
        return f'<div class="hq">{stem}<div class="task" style="margin-left:12mm">{body}{tb}{ex}</div></div>'
    if k == 'jaen':
        return f'<div class="hq">{stem}<div class="jsrc">{e(q["source"])}</div></div>'
    return f'<div class="hq">{stem}</div>'

def part_html(P, n, pts):
    out = f'<section class="part">{head(n, P["title"], pts)}<p class="intro">{e(P["intro"])}</p>'
    for i, ps in enumerate(P['passages']):
        if ps.get('label'): out += f'<div class="plabel">{e(ps["label"])}</div>'
        if ps.get('intro'): out += f'<p class="intro">{e(ps["intro"])}</p>'
        if ps.get('paras'): out += passage_html(ps) + notes_html(ps.get('notes'))
        out += ''.join(q_html(q) for q in P['questions'] if q.get('ps', 0) == i)
    return out + '</section>'

def mc_slots(q): return '　'.join(f'{it["label"]}［　　］' for it in q['items'])

def is_writing(P): return any(q['kind'] in ('write', 'jaen') for q in P['questions'])

def sheet(D, R):
    H4 = '<h4 style="font-family:MPR;font-weight:800;margin:3mm 0 1mm">{}</h4>'
    out = f'<section class="sheet"><h2>解答用紙　予想問題 第{R}回</h2><div style="font-size:8.6pt;margin-bottom:2mm">受験番号・氏名欄は省略。</div>'
    later = []
    for n in ('1', '2', '3'):
        P = D[n]
        if is_writing(P): later.append(n); continue
        out += H4.format(n)
        for q in P['questions']:
            h = f'<span class="h">設問 {q["no"]}</span>'
            if q['kind'] == 'mcset':
                out += f'<div class="row">{h}<span>{mc_slots(q)}</span></div>'
            elif q.get('limit'):
                out += f'<div class="row tall">{h}<div>{genko(q["limit"] + 20)}</div></div>'
            else:
                out += f'<div class="row lines">{h}<span></span></div>'
    out += '</section>'
    for n in later:
        out += f'<section class="sheet"><h2>解答用紙（{n}）</h2>'
        for q in D[n]['questions']:
            if q['kind'] == 'write':
                out += H4.format(f'{n}　設問 {q["no"]}（{q["limit"]}）')
                if q.get('title_line'): out += '<div style="font-size:9pt">Title：＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿</div>'
                out += hk.wlines(q.get('lines', 14))
            elif q['kind'] == 'jaen':
                out += H4.format(f'{n}　設問 {q["no"]}') + hk.wlines(5, False)
            elif q['kind'] == 'mcset':
                out += H4.format(f'{n}　設問 {q["no"]}') + f'<div class="row"><span>{mc_slots(q)}</span></div>'
            else:
                out += H4.format(f'{n}　設問 {q["no"]}') + hk.wlines(4, False)
        out += '</section>'
    return out

def colophon(R, kind):
    return f"""<section class="colophon"><div class="box"><h2>奥付</h2>
<div>予想問題 第{R}回　英語　{'問題' if kind == 'q' else '解答・解説'}</div>
<div>対象：岩手大学 前期日程 英語（人文社会科学部・教育学部 共通問題）の受験準備</div>
<div>作成：学習アプリ マナトビ 編集部（2026年11月）</div>
<div>作成方法：2024〜2026年度の出題形式・分量・難易度を分析し，英文・設問をすべて新たに書き下ろした。</div>
<div class="disc">{DISCLAIMER}</div>
<div style="margin-top:2.5mm;font-size:8.4pt">本冊子の英文・図表は実在の記事・書籍・論文・統計からの引用・翻案ではありません。登場する人物・団体・地名・数値は架空です。無断転載・再配布を禁じます。</div>
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
    k = q['kind']
    if k == 'mcset':
        each = q['points'] // len(q['items'])
        ans = '　'.join(f'{it["label"]} ({CL[it["answer"]]})' for it in q['items'])
        lis = [f'{it["label"]} ({CL[it["answer"]]}) {it["choices"][it["answer"]]}：{it["explain"]}' for it in q['items']]
        return f'<h4>設問 {q["no"]}（各{each}点）</h4>' + box(f'<div class="ans">正解　{ans}</div>' + ul(lis + q.get('explain', [])))
    if k == 'write':
        ms = ''.join(f'<div style="margin-top:1.5mm"><span class="lbl">解答例：{e(lab)}</span></div><div class="model">{e(m)} <span class="wc">（{wc(m)}語）</span></div>' for lab, m in q['models'])
        return (f'<h4>設問 {q["no"]}（{q["points"]}点）</h4>' + box(crit_table(q['criteria']) + ms)
                + '<h4>書き方のポイント・減点されやすい点</h4>' + box(ul(q['tips'])))
    if k == 'jaen':
        return f'<h4>設問 {q["no"]}（{q["points"]}点）</h4>' + box(model_block(q['answer'], q.get('alts', []), en=True) + crit_table(q['criteria']) + ul(q['explain']))
    lim = f'<div style="font-size:8.4pt;margin-top:.6mm">字数：{"・".join(f"{len(a)}字" for a in [q["answer"]] + q.get("alts", []))}（{q["limit"]}字以内）</div>' if q.get('limit') else ''
    return f'<h4>設問 {q["no"]}（{q["points"]}点）</h4>' + box(model_block(q['answer'], q.get('alts', [])) + lim + crit_table(q['criteria']) + ul(q['explain']))

def akey(P, n, pts):
    out = f'<section class="part akey"><h3>{n}　解答・解説（{pts}点）</h3>' + ''.join(akey_q(q) for q in P['questions'])
    for ps in P['passages']:
        if not ps.get('translation'): continue
        lab = f'（{ps["label"]}）' if ps.get('label') else ''
        out += f'<h4>全訳{e(lab)}</h4><div class="trs">' + ''.join(f'<p>{"(" + str(i + 1) + ")" if ps.get("para_numbers") else ""}{e(t)}</p>' for i, t in enumerate(ps['translation'])) + '</div>'
    if P.get('task_translation'):
        out += '<h4>問題文の訳</h4><div class="trs">' + ''.join(f'<p>{e(t)}</p>' for t in P['task_translation']) + '</div>'
    if P.get('vocab'):
        out += '<h4>重要語句</h4><table class="voc">' + ''.join(f'<tr><td>{e(a)}</td><td>{e(b)}</td></tr>' for a, b in P['vocab']) + '</table>'
    return out + '</section>'

def summary_table(D, R):
    rows = ''
    for n in ('1', '2', '3'):
        for q in D[n]['questions']:
            if q['kind'] == 'mcset': a = '　'.join(f'{it["label"]} ({CL[it["answer"]]})' for it in q['items'])
            elif q['kind'] in ('write', 'jaen'): a = '解答例は解説参照（採点観点つき）'
            else: a = '解説参照（模範解答・採点基準つき）'
            rows += f'<tr><td>{n}</td><td>設問 {q["no"]}</td><td>{e(a)}</td><td>{q["points"]}</td></tr>'
    return f'<section class="part akey"><h3>解答一覧　予想問題 第{R}回</h3><table class="sum"><tr><th>大問</th><th>設問</th><th>解答</th><th>配点</th></tr>{rows}<tr><td colspan="3" style="text-align:right">合計</td><td>200</td></tr></table></section>'

def check_points(D):
    assert sum(D['points'].values()) == 200
    for n in ('1', '2', '3'):
        P = D[n]
        assert sum(q['points'] for q in P['questions']) == D['points'][n], (n, 'sum')
        for q in P['questions']:
            if q['kind'] == 'mcset': assert q['points'] % len(q['items']) == 0, (n, q['no'])
            else: assert sum(p for _, p in q['criteria']) == q['points'], (n, q['no'])

def write(doc, out):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    css = [CSS(string=mono(kb.CSS_TEXT + H_CSS), font_config=FC)]
    HTML(string=mono(doc), base_url=str(HERE)).write_pdf(out, stylesheets=css, font_config=FC, metadata={'author': 'マナトビ'})
    return out

def load(R): return importlib.import_module(f'i{R}').DATA

def build_q(R):
    D = load(R); check_points(D)
    body = cover(R, 'q', D) + ''.join(part_html(D[n], n, D['points'][n]) for n in ('1', '2', '3')) + sheet(D, R) + colophon(R, 'q')
    return write(f'<html lang="ja"><head><meta charset="utf-8"><title>予想問題 第{R}回 英語 問題</title></head><body>{body}</body></html>', OUT_DIR / f'manatobi_iwate_eng_yoso{R}_mondai.pdf')

def build_a(R):
    D = load(R); check_points(D)
    body = cover(R, 'a', D) + summary_table(D, R) + ''.join(akey(D[n], n, D['points'][n]) for n in ('1', '2', '3')) + colophon(R, 'a')
    return write(f'<html lang="ja"><head><meta charset="utf-8"><title>予想問題 第{R}回 英語 解答・解説</title></head><body>{body}</body></html>', OUT_DIR / f'manatobi_iwate_eng_yoso{R}_kaitou.pdf')

if __name__ == '__main__':
    R = sys.argv[1] if len(sys.argv) > 1 else '1'
    for kind, f in (('q', build_q), ('a', build_a)):
        o = f(R); PAGE_INFO[(R, kind)] = hk.page_range(o, kind)
        o = f(R); print(o.name, o.stat().st_size // 1024, 'KB', PAGE_INFO[(R, kind)])
