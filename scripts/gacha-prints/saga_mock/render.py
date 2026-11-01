# -*- coding: utf-8 -*-
"""佐賀大学 一般選抜（前期日程）対策 英語 予想問題 — 紙面づくり（2026-11-01）

  python3 scripts/gacha-prints/saga_mock/render.py 1      # 第1回（r1.py のデータ）
  python3 scripts/gacha-prints/saga_mock/render.py all    # 第1〜3回
→ .tmpwork/saga/予想問題_佐賀大学_英語_第N回_{問題,解答解説}.pdf と public/prints/print_lr_niji_saga_en_N.pdf

紙面は kumamoto_mock と同じ試験冊子の形（表紙 → 大問 → 解答用紙3枚 → 奥付 ／ 解答・解説編）。
大問の型（1 英文の内容を100字程度の日本語でまとめる／2 短い会話文の空所に入る英文を4択で選ぶ／
3 図つきの英文の4択2問と約60語の英語での記述／4 英文を読んで100語程度の英語で意見を書く・100分・
20・20・30・30点）だけを公開情報から参考にし、英文・設問・解答はすべて書き下ろし（過去問の英文・解答例は引用していない）。
"""
import html, importlib, math, re, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
OUT = ROOT / '.tmpwork' / 'saga'
UNIV = '佐賀大学'
DISCLAIMER = f'{UNIV}の過去問・公式問題ではありません。予想問題であり、大学とは関係がありません。'
PART_NAMES = {1: '英文の要旨を日本語でまとめる', 2: '会話文の空所補充', 3: '図つきの長文読解', 4: '英文を読んで書く英作文'}
KEYS = ('P1', 'P2', 'P3', 'P4')
P3_WORDS = (45, 75)     # 3(3) 解答例の語数（約60語）
P4_WORDS = (85, 115)    # 4 解答例の語数（100語程度）


def e(s):
    return html.escape(str(s), quote=False)


def m(s):
    """{u|…} 下線、{kX} 空所（下線つき・ラベル X）、{k} 会話の空所（下線のみ）、**…** 太字、//…// 斜体、{br} 改行"""
    t = e(s)
    t = re.sub(r'\{u([A-Za-z0-9]*)\|(.+?)\}',
               lambda x: (f'<span class="ul"><span class="ulab">({x.group(1)})</span>{x.group(2)}</span>' if x.group(1)
                          else f'<span class="ul">{x.group(2)}</span>'), t)
    t = re.sub(r'\{k([A-Za-z0-9]+)\}', lambda x: f'<span class="ul"><span class="ulab">({x.group(1)})</span>{"　" * 7}</span>', t)
    t = t.replace('{k}', f'<span class="ul">{"　" * 16}</span>')
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'//(.+?)//', r'<i>\1</i>', t)
    return t.replace('{br}', '<br>')


CSS = (HERE / 'style.css').read_text(encoding='utf-8')


def page(body, cls=''):
    return f'<section class="page {cls}">{body}</section>'


def logo():
    return f'<img class="logo" src="file://{HERE / "logo_gray.png"}" alt="マナトビ">'


def cover(R, kind, ranges):
    label = '問　題' if kind == 'q' else '解答・解説'
    rng = (f'（問題 {ranges[0]}〜{ranges[1]} ページ・解答用紙 {ranges[2]}〜{ranges[3]} ページ）' if kind == 'q'
           else f'（解答・解説 {ranges[0]}〜{ranges[1]} ページ）')
    if kind == 'q':
        notes = [
            '解答時間は 100 分。最初に 4 題すべてに目を通し，配分を決めてから解くこと（目安：1 は 20 分，2 は 10 分，3 は 35 分，4 は 30 分，見直し 5 分）。',
            '大問は 1〜4 の 4 題で，配点は 1 が 20 点，2 が 20 点，3 が 30 点，4 が 30 点の計 100 点（各大問の見出しにも示した）。',
            '答えは巻末の解答用紙（3 枚・切り取り可）の決められた欄にだけ書くこと。日本語でまとめる問題では，句読点も 1 字として数える。',
            '英語で書く問題は，書き終えたら語数を数えて欄に記入すること。コンマ・ピリオドなどの記号は語数に含めない。',
            '英文・会話・図表はすべて編集部が新しく作ったもので，人物・団体・調査の数値はすべて架空である。',
        ]
    else:
        notes = [
            '各大問の最初に解答一覧と配点をまとめた。',
            '日本語・英語で書く問題の解答は一例である。「採点の目安」の要素がそろっていれば，表現が違っても得点としてよい。',
            '1・3 には全訳と語句を，2 には会話の訳と，選ばなかった選択肢が合わない理由をつけた。',
            '4 の解答例は賛成・反対の 2 つの立場で示した。どちらの立場を選んでも，理由と経験が筋道立っていれば評価は変わらない。',
        ]
    lis = ''.join(f'<li>{e(x)}</li>' for x in notes)
    return page(f'''
<div class="cv-head">{logo()}<span>学習アプリ マナトビ ｜ 国公立2次 予想問題</span></div>
<div class="cv-main">
  <p class="cv-round">予想問題 第{R['n']}回</p>
  <p class="cv-subject">英　　　語</p>
  <p class="cv-sub">（ 100 分 ）</p>
  <p class="cv-kind">{label}</p>
  <p class="cv-range">{rng}</p>
  <p class="cv-univ">{UNIV} 一般選抜 前期日程 対策</p>
</div>
<div class="cv-notes"><p class="cv-notes-h">はじめに読むこと</p><ol>{lis}</ol></div>
<div class="disc"><b>{e(DISCLAIMER)}</b><br><span>出題の傾向を研究し，編集部が一から書き下ろした演習用の冊子です。</span></div>
<div class="cv-foot"><span>学習アプリ マナトビ 編集部</span><span>第{R['n']}回 ／ {'問題' if kind == 'q' else '解答・解説'}</span></div>
''', 'cover')


def part_head(n, P, suffix=''):
    return f'<h2 class="part"><span class="pnum">{n}</span>{PART_NAMES[n]}{suffix}（{P["points"]}点）</h2>'


def passage(P):
    title = f'<p class="ptitle">{e(P["title"])}</p>' if P.get('title') else ''
    paras = ''.join(f'<p class="en"><span class="pno">{i + 1}</span>{m(p)}</p>' for i, p in enumerate(P['passage']))
    notes = ''
    if P.get('notes'):
        notes = '<table class="notes"><tr><th>注</th><td>' + '　'.join(
            f'<span class="note"><i>{e(w)}</i>　{e(j)}</span>' for w, j in P['notes']) + '</td></tr></table>'
    return title + paras + notes


def choice_list(ch, cols=None):
    if cols is None:
        longest = max(len(c[1]) for c in ch)
        cols = 4 if longest <= 15 else (2 if longest <= 34 else 0)
    if cols:
        return f'<div class="cgrid c{cols}">' + ''.join(f'<span><span class="sl">{e(c[0])}</span>{m(c[1])}</span>' for c in ch) + '</div>'
    return '<ol class="choices ind">' + ''.join(f'<li><span class="cl">{e(c[0])}</span>{m(c[1])}</li>' for c in ch) + '</ol>'


def lim_text(lim):
    return f'{lim[0]}〜{lim[1]}字'


def part_1(R):
    P = R['P1']
    return page(part_head(1, P) + f'<p class="lead">{m(P["lead"])}</p>' + passage(P), 'flow')


def dialogue_html(D):
    rows = ''.join(f'<tr><td class="who">{e(w)}:</td><td>{m(t)}</td></tr>' for w, t in D['lines'])
    qs = ''
    for q in D['qs']:
        lab = f'<p class="sq" style="margin:1.5mm 0 0 6mm">{e(q["label"])}</p>' if q['label'] else ''
        qs += lab + f'<div style="margin-left:6mm">{choice_list(q["choices"], q.get("cols", 0))}</div>'
    return f'<p class="sq">（{D["n"]}）</p><table class="dlg">{rows}</table>{qs}'


def part_2(R):
    P = R['P2']
    return page(part_head(2, P) + f'<p class="lead">{m(P["lead"])}</p>' + ''.join(dialogue_html(D) for D in P['dialogues']), 'flow')


def chart_svg(C, w=620, h=290):
    """グループ化した棒グラフ（白黒。系列は濃さと斜線で見分ける）"""
    cats, series = C['categories'], C['series']
    top = C.get('max', 100)
    step = C.get('step', 20)
    ml, mr, mt, mb = 44, 10, 34, 46
    pw, ph = w - ml - mr, h - mt - mb
    fills = ['#111', '#fff', '#888', 'url(#hatch)', '#ccc']
    gw = pw / len(cats)
    bw = (gw * 0.8) / len(series)
    out = [f'<svg class="chart" width="{w}" height="{h}" viewBox="0 0 {w} {h}" xmlns="http://www.w3.org/2000/svg" '
           f'font-family="Noto Sans CJK JP, sans-serif">',
           '<defs><pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">'
           '<rect width="5" height="5" fill="#fff"/><line x1="0" y1="0" x2="0" y2="5" stroke="#111" stroke-width="1.6"/></pattern></defs>']
    for v in range(0, top + 1, step):
        y = mt + ph - ph * v / top
        out.append(f'<line x1="{ml}" y1="{y:.1f}" x2="{ml + pw}" y2="{y:.1f}" stroke="#bbb" stroke-width="0.6"/>')
        out.append(f'<text x="{ml - 5}" y="{y + 3.5:.1f}" font-size="10" text-anchor="end">{v}</text>')
    out.append(f'<text x="{ml - 30}" y="{mt - 12}" font-size="10">{e(C.get("unit", "(%)"))}</text>')
    for i, c in enumerate(cats):
        x0 = ml + gw * i + gw * 0.1
        for j, (_, vals) in enumerate(series):
            v = vals[i]
            bh = ph * v / top
            x = x0 + bw * j
            out.append(f'<rect x="{x:.1f}" y="{mt + ph - bh:.1f}" width="{bw - 1.5:.1f}" height="{bh:.1f}" fill="{fills[j]}" stroke="#111" stroke-width="0.8"/>')
            out.append(f'<text x="{x + (bw - 1.5) / 2:.1f}" y="{mt + ph - bh - 3:.1f}" font-size="7.6" text-anchor="middle">{v:g}</text>')
        out.append(f'<text x="{ml + gw * i + gw / 2:.1f}" y="{mt + ph + 15}" font-size="10.5" text-anchor="middle">{e(c)}</text>')
    out.append(f'<line x1="{ml}" y1="{mt + ph}" x2="{ml + pw}" y2="{mt + ph}" stroke="#111" stroke-width="1"/>')
    lx = ml + 4
    for j, (name, _) in enumerate(series):
        out.append(f'<rect x="{lx:.1f}" y="{h - 16}" width="12" height="10" fill="{fills[j]}" stroke="#111" stroke-width="0.8"/>')
        out.append(f'<text x="{lx + 16:.1f}" y="{h - 7}" font-size="10.5">{e(name)}</text>')
        lx += 26 + sum(10.5 if ord(ch) > 255 else 6 for ch in name)
    out.append('</svg>')
    return ''.join(out)


def chart_block(C):
    return (f'<p class="chart-cap"><b>{e(C["title"])}</b></p>' + chart_svg(C)
            + f'<p class="chart-src">{e(C["source"])}</p>')


def part_3(R):
    P = R['P3']
    body = part_head(3, P) + f'<p class="lead">{m(P["lead"])}</p>' + passage(P) + chart_block(P['chart'])
    for q in P['questions']:
        pts = f'（{q["points"]}点）'
        inner = f'<div>{m(q["stem"])}{pts}</div>'
        if q['type'] == 'mc':
            inner += choice_list(q['choices'], q.get('cols'))
        body += f'<div class="q"><span class="qk">{e(q["label"])}</span><div class="qbody">{inner}</div></div>'
    return page(body, 'flow')


def part_4(R):
    P = R['P4']
    return page(part_head(4, P) + f'<p class="lead">{m(P["lead"])}</p>' + passage(P)
                + f'<div class="topic">{m(P["question"])}</div>', 'flow')


# ───────── 解答用紙 ─────────

def sheet_head(R, k):
    return (f'<div class="sh-head"><span class="sh-t">解答用紙</span><span class="sh-s">予想問題 第{R["n"]}回 英語　{k}枚目／3枚</span>'
            f'<span class="sh-name">受験番号　　　　　　　氏名</span></div>')


def lines(n, cls='ln'):
    return ''.join(f'<div class="{cls}"></div>' for _ in range(n))


def genko(cells, per_row=20):
    rows = (cells + per_row - 1) // per_row
    out = []
    for r in range(rows):
        cs = ''.join('<span class="gk s"></span>' for _ in range(per_row))
        out.append(f'<div class="gkrow">{cs}<span class="gkn" style="left:150mm">{(r + 1) * per_row}</span></div>')
    return '<div class="genko">' + ''.join(out) + '</div>'


def ast(labels, cls='ast'):
    th = ''.join(f'<th>{e(x)}</th>' for x in labels)
    td = ''.join('<td></td>' for _ in labels)
    return f'<table class="{cls}"><tr>{th}</tr><tr>{td}</tr></table>'


def p2_labels(P):
    out = []
    for D in P['dialogues']:
        for q in D['qs']:
            out.append(f'（{D["n"]}）{q["label"]}')
    return out


SCORE = '<div class="score">得　点<div></div></div>'


def sheets(R):
    P1, P2, P3, P4 = (R[k] for k in KEYS)
    s1 = (sheet_head(R, 1) + f'<p><span class="bignum">1</span><span class="lim">（{lim_text(P1["limit"])}・句読点も1字）</span></p>'
          + genko(math.ceil(P1['limit'][1] / 20) * 20)
          + '<p class="sp"><span class="bignum">2</span></p>' + ast(p2_labels(P2), 'ast wide') + SCORE)
    mcs = [q for q in P3['questions'] if q['type'] == 'mc']
    s2 = (sheet_head(R, 2) + '<p><span class="bignum">3</span></p>' + ast([q['label'] for q in mcs], 'ast wide')
          + f'<p class="sq">(3)（約60語）<span class="wc">語数　　　　語</span></p>' + lines(P3.get('lines', 9), 'ln ln4') + SCORE)
    s3 = (sheet_head(R, 3) + '<p><span class="bignum">4</span>（100語程度）<span class="wc">語数　　　　語</span></p>'
          + lines(P4.get('lines', 15), 'ln ln4') + SCORE)
    return ''.join(page(x, 'sheet') for x in (s1, s2, s3))


def colophon(R, kind):
    return page(f'''
<h2 class="colh">奥　付</h2>
<table class="col">
<tr><th>書名</th><td>国公立2次 予想問題 第{R['n']}回 英語 {'問題' if kind == 'q' else '解答・解説'}</td></tr>
<tr><th>想定</th><td>{UNIV} 一般選抜 前期日程（個別学力検査「英語」・教育・経済・医・農学部共通）の出題形式に準拠</td></tr>
<tr><th>構成</th><td>大問 1〜4（英文の要旨を日本語でまとめる・会話文の空所補充・図つきの長文読解・英文を読んで書く 100 語の英作文）／100 分／20・20・30・30 点</td></tr>
<tr><th>編集・作成</th><td>学習アプリ マナトビ 編集部（{R.get('date', '2026年11月')}）</td></tr>
</table>
<div class="disc"><b>{e(DISCLAIMER)}</b><br><span>英文・設問・解答・解説はすべて編集部の書き下ろしです。実際の試験の問題文・解答例の文章は引用していません。</span></div>
<p class="small">本冊子の無断転載・複製を禁じます。学習アプリ マナトビの利用者が個人の学習に使う範囲でご利用ください。</p>
''', 'colophon')


# ───────── 解答・解説編 ─────────

def crit(q, title='採点の目安'):
    total = sum(p for _, p in q['criteria'])
    items = ''.join(f'<li>{m(t)}（{p:g}点）</li>' for t, p in q['criteria'])
    return f'<div class="crit"><p class="crit-h">{title}（{total:g}点）</p><ul>{items}</ul></div>'


def akey_table(rows):
    body = ''.join(f'<tr><td>{e(a)}</td><td>{m(b)}</td><td class="pt">{c:g}</td></tr>' for a, b, c in rows)
    total = sum(c for _, _, c in rows)
    return f'<table class="akey"><tr><th>設問</th><th>解答</th><th>配点</th></tr>{body}<tr class="sum"><td>合計</td><td></td><td class="pt">{total:g}</td></tr></table>'


def jlen(s):
    return len(re.sub(r'\s', '', s))


def wcount(text):
    return len(re.findall(r"[A-Za-z0-9'’.%-]*[A-Za-z0-9]", text))


def full_translation(P):
    tr = ''.join(f'<p class="trp"><span class="pno">{i + 1}</span>{m(t)}</p>' for i, t in enumerate(P['translation']))
    vocab = ''
    if P.get('vocab'):
        vocab = '<p class="ah">語句</p><div class="vocab">' + ''.join(
            f'<span class="vw"><i>{e(w)}</i>　{e(j)}</span>' for w, j in P['vocab']) + '</div>'
    return f'<p class="ah">全訳</p>{tr}{vocab}'


def a_part_1(R):
    P = R['P1']
    n = jlen(P['answer'])
    assert P['limit'][0] <= n <= P['limit'][1], ('P1 length', n)
    assert sum(p for _, p in P['criteria']) == P['points'], 'P1 criteria'
    body = part_head(1, P, ' — 解答・解説')
    body += f'<p class="ans">【解答例】{m(P["answer"])}<span class="lim">（{n}字）</span></p>'
    body += crit(P) + f'<p class="expl">{m(P["expl"])}</p>' + full_translation(P)
    return page(body, 'flow')


def a_part_2(R):
    P = R['P2']
    rows, body_d = [], ''
    labs = p2_labels(P)
    k = 0
    for D in P['dialogues']:
        body_d += f'<h3 class="aq">（{D["n"]}）</h3>'
        for q in D['qs']:
            assert q['answer'] in [c[0] for c in q['choices']], ('P2 answer', labs[k])
            rows.append((labs[k], q['answer'], q['points']))
            body_d += f'<p class="ans">{e(q["label"])}【解答】{e(q["answer"])}</p><p class="expl">{m(q["expl"])}</p>'
            k += 1
        tr = ''.join(f'<tr><td class="who">{e(w)}:</td><td>{m(t)}</td></tr>' for w, t in D['translation'])
        body_d += f'<table class="dlg facts">{tr}</table>'
    assert sum(r[2] for r in rows) == P['points'], ('P2 points', sum(r[2] for r in rows))
    body = part_head(2, P, ' — 解答・解説') + '<p class="ah">解答一覧</p>' + akey_table(rows) + '<p class="ah">解説と訳</p>' + body_d
    return page(body, 'flow')


def a_part_3(R):
    P = R['P3']
    qs = P['questions']
    assert sum(q['points'] for q in qs) == P['points'], 'P3 points'
    rows = []
    for q in qs:
        if q['type'] == 'mc':
            assert q['answer'] in [c[0] for c in q['choices']], ('P3 answer', q['label'])
            rows.append((q['label'], q['answer'], q['points']))
        else:
            rows.append((q['label'], '解答例を参照', q['points']))
    body = part_head(3, P, ' — 解答・解説') + '<p class="ah">解答一覧</p>' + akey_table(rows)
    for q in qs:
        body += f'<h3 class="aq"><span class="qk">{e(q["label"])}</span>{e(q["kind"])}（{q["points"]}点）</h3>'
        if q['type'] == 'mc':
            body += f'<p class="ans">【解答】{e(q["answer"])}</p><p class="expl">{m(q["expl"])}</p>'
        else:
            assert sum(p for _, p in q['criteria']) == q['points'], 'P3 (3) criteria'
            body += crit(q)
            for j, (title, text) in enumerate(q['models'], 1):
                wc = wcount(text)
                assert P3_WORDS[0] <= wc <= P3_WORDS[1], ('P3 model words', j, wc)
                body += f'<p class="ah">解答例{j}　{e(title)}（{wc}語）</p><div class="model-en"><p>{m(text)}</p></div>'
            body += f'<p class="expl">{m(q["expl"])}</p>'
    body += '<p class="ah">図から読み取れること</p><ul class="tips">' + ''.join(f'<li>{m(t)}</li>' for t in P['facts']) + '</ul>'
    body += full_translation(P)
    return page(body, 'flow')


def a_part_4(R):
    P = R['P4']
    assert sum(p for _, p in P['criteria']) == P['points'], 'P4 criteria'
    body = part_head(4, P, ' — 解答・解説') + crit(P)
    body += '<p class="ah">書き方のポイント</p><ul class="tips">' + ''.join(f'<li>{m(t)}</li>' for t in P['tips']) + '</ul>'
    for k, (title, outline, text) in enumerate(P['models'], 1):
        wc = wcount(text)
        assert P4_WORDS[0] <= wc <= P4_WORDS[1], ('P4 model words', k, wc)
        body += (f'<p class="ah">解答例{k}　{e(title)}（{wc}語）</p><p class="outl">構成：{m(outline)}</p>'
                 f'<div class="model-en">{"".join(f"<p>{m(p)}</p>" for p in text.split(chr(10)))}</div>')
    body += '<p class="ah">解答例1の訳</p>' + ''.join(f'<p class="trp">{m(t)}</p>' for t in P['model_ja'])
    body += full_translation(P)
    return page(body, 'flow')


def build(R, kind, ranges):
    if kind == 'q':
        parts = cover(R, 'q', ranges) + part_1(R) + part_2(R) + part_3(R) + part_4(R) + sheets(R) + colophon(R, 'q')
    else:
        parts = cover(R, 'a', ranges) + a_part_1(R) + a_part_2(R) + a_part_3(R) + a_part_4(R) + colophon(R, 'a')
    return f'<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>{CSS}</style></head><body>{parts}</body></html>'


def pdf(html_text, path, label):
    hp = path.with_suffix('.html')
    hp.write_text(html_text, encoding='utf-8')
    subprocess.run(['node', str(HERE / 'pdf.mjs'), str(hp), str(path), label], check=True)


def page_texts(path):
    import unicodedata
    from pypdf import PdfReader
    return [unicodedata.normalize('NFKC', re.sub(r'\s+', '', p.extract_text() or '')) for p in PdfReader(str(path)).pages]


def render(n):
    R = importlib.import_module(f'r{n}').ROUND
    assert R['n'] == n
    total = sum(R[k]['points'] for k in KEYS)
    assert total == 100, total
    OUT.mkdir(parents=True, exist_ok=True)
    q = OUT / f'予想問題_{UNIV}_英語_第{n}回_問題.pdf'
    a = OUT / f'予想問題_{UNIV}_英語_第{n}回_解答解説.pdf'
    pdf(build(R, 'a', (1, 1)), a, f'第{n}回 解答・解説')   # 先に解答編（検査で止まるならここ）
    pdf(build(R, 'q', (1, 1, 1, 1)), q, f'第{n}回 問題')
    t = page_texts(q)
    first_sheet = next(i for i, s in enumerate(t) if '解答用紙' in s and '受験番号' in s) + 1
    last = len(t)
    qr = (2, first_sheet - 1, first_sheet, last - 1)
    pdf(build(R, 'q', qr), q, f'第{n}回 問題')
    ar = (2, len(page_texts(a)) - 1)
    pdf(build(R, 'a', ar), a, f'第{n}回 解答・解説')
    assert len(page_texts(q)) == last, 'ページ数が2回目で変わった'
    dest = ROOT / 'public' / 'prints' / f'print_lr_niji_saga_en_{n}.pdf'
    subprocess.run(['pdfunite', str(q), str(a), str(dest)], check=True)
    print(f'第{n}回: 問題 {last}p（解答用紙 {qr[2]}〜{qr[3]}）・解答解説 {ar[1] + 1}p → {dest.relative_to(ROOT)} {dest.stat().st_size // 1024}KB')


if __name__ == '__main__':
    sys.path.insert(0, str(HERE))
    arg = sys.argv[1] if len(sys.argv) > 1 else 'all'
    for k in ([1, 2, 3] if arg == 'all' else [int(arg)]):
        render(k)
