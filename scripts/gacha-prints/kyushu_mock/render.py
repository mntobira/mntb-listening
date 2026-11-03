# -*- coding: utf-8 -*-
"""九州大学 一般選抜（前期日程）対策 英語 予想問題 — 紙面づくり（2026-11-01）

  python3 scripts/gacha-prints/kyushu_mock/render.py 1      # 第1回（r1.py のデータ）
  python3 scripts/gacha-prints/kyushu_mock/render.py all    # 第1〜3回
→ .tmpwork/kyushu/予想問題_九州大学_英語_第N回_{問題,解答解説}.pdf と public/prints/print_lr_niji_kyushu_en_N.pdf

紙面は saga_mock と同じ試験冊子の形（表紙 → 大問 → 解答用紙5枚 → 奥付 ／ 解答・解説編）。
大問の型（〔1〕〜〔3〕 段落番号つきの長文：空所補充・下線部和訳・字数制限つきの日本語説明・本文からの抜き出し・
内容一致・約30語の英語での要約／〔4〕 約100語の自由英作文／〔5〕 グラフを約80語の英語で説明する・120分・
40・45・45・40・30点の計200点）だけを公開情報から参考にし、英文・設問・図・解答はすべて書き下ろし
（過去問の英文・解答例は引用していない）。小問ごとの配点は大学が公表していないため編集部の想定。
"""
import html, importlib, math, re, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
OUT = ROOT / '.tmpwork' / 'kyushu'
UNIV = '九州大学'
DISCLAIMER = f'{UNIV}の過去問・公式問題ではありません。予想問題であり、大学とは関係がありません。'
PART_NAMES = {1: '長文読解', 2: '長文読解', 3: '長文読解', 4: '自由英作文', 5: 'グラフを説明する英作文'}
KEYS = ('P1', 'P2', 'P3', 'P4', 'P5')
POINTS = {'P1': 40, 'P2': 45, 'P3': 45, 'P4': 40, 'P5': 30}
P4_WORDS = (85, 115)    # 約100語
P5_WORDS = (65, 95)     # 約80語
SMALL = ('mc', 'mc2', 'blanks', 'order')   # 解答用紙で記号欄になるもの


def e(s):
    return html.escape(str(s), quote=False)


def m(s):
    """{u1|…} 下線＋(1)、{u|…} 下線のみ、{bア} 空所（ ア ）、**…** 太字、//…// 斜体、{br} 改行"""
    t = e(s)
    t = re.sub(r'\{u([A-Za-z0-9]*)\|(.+?)\}',
               lambda x: (f'<span class="ul"><span class="ulab">({x.group(1)})</span>{x.group(2)}</span>' if x.group(1)
                          else f'<span class="ul">{x.group(2)}</span>'), t)
    t = re.sub(r'\{b([A-Z0-9ア-ン]+)\}', lambda x: f'<span class="blank">（　{x.group(1)}　）</span>', t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'//(.+?)//', r'<i>\1</i>', t)
    return t.replace('{br}', '<br>')


def plain(s):
    t = re.sub(r'\{u[A-Za-z0-9]*\|(.+?)\}', r'\1', s)
    t = re.sub(r'\{b[A-Z0-9ア-ン]+\}', ' ', t)
    return re.sub(r'\*\*|//|\{br\}', ' ', t)


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
            '解答時間は 120 分。はじめに全体を見て時間の割り振りを決めること（目安：〔1〕25 分，〔2〕25 分，〔3〕30 分，〔4〕20 分，〔5〕15 分，見直し 5 分）。',
            '大問は〔1〕〜〔5〕の 5 題で，200 点満点（〔1〕40 点・〔2〕45 点・〔3〕45 点・〔4〕40 点・〔5〕30 点）。小問ごとの配点は編集部の想定である。',
            '答えは巻末の 5 枚の解答用紙（大問ごとに 1 枚・切り取り可）の決められた欄に書くこと。字数の指定がある問題は，句読点も 1 字に数える。',
            '英語で書く問題は，書き終えたら語数を数えて欄に記入すること。コンマ・ピリオドなどの記号は語数に含めない。',
            '英文・図表はすべて編集部が新しく作ったもので，人物・団体・調査・数値はすべて架空である。',
        ]
    else:
        notes = [
            '各大問の最初に解答一覧と配点（小問の配点は編集部の想定）をまとめた。',
            '日本語・英語で書く問題の解答は一例である。「採点の目安」の要素がそろっていれば，表現が違っても得点としてよい。',
            '〔1〕〜〔3〕には全訳と語句をつけた。答え合わせのあと，根拠になる段落をもう一度読み直すこと。',
            '〔4〕〔5〕の解答例は 2 つずつ示した。語数は目安の範囲に収めてある。',
        ]
    lis = ''.join(f'<li>{e(x)}</li>' for x in notes)
    return page(f'''
<div class="cv-head">{logo()}<span>学習アプリ マナトビ ｜ 国公立2次 予想問題</span></div>
<div class="cv-main">
  <p class="cv-round">予想問題 第{R['n']}回</p>
  <p class="cv-subject">英　　　語</p>
  <p class="cv-sub">（ 120 分 ・ 200 点 ）</p>
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
        cols = 4 if longest <= 14 else (2 if longest <= 32 else 0)
    if cols:
        return f'<div class="cgrid c{cols}">' + ''.join(f'<span><span class="sl">{e(c[0])}.</span> {m(c[1])}</span>' for c in ch) + '</div>'
    return '<ol class="choices ind">' + ''.join(f'<li><span class="cl">{e(c[0])}.</span>{m(c[1])}</li>' for c in ch) + '</ol>'


def question(q):
    body = f'<div>{m(q["stem"])}</div>'
    t = q['type']
    if t in ('mc', 'mc2') or (t == 'blanks' and q.get('choices')):
        body += choice_list(q['choices'], q.get('cols'))
    if t == 'blanks' and q.get('subs'):
        for s in q['subs']:
            body += f'<div class="sub"><span class="sl">{e(s["label"])}</span>{choice_list(s["choices"], s.get("cols", 2))}</div>'
    if t == 'order':
        body += '<ol class="choices ind">' + ''.join(f'<li><span class="cl">{e(a)}.</span>{m(b)}</li>' for a, b in q['events']) + '</ol>'
    return f'<div class="q"><span class="qk">{e(q["label"])}.</span><div class="qbody">{body}</div></div>'


def part_read(R, k):
    P = R[f'P{k}']
    return page(part_head(k, P) + f'<p class="lead">{m(P["lead"])}</p>' + passage(P)
                + ''.join(question(q) for q in P['questions']), 'flow')


def info_table(T):
    head = ''.join(f'<th>{e(h)}</th>' for h in T['head'])
    rows = ''.join('<tr>' + ''.join(f'<td>{m(c)}</td>' for c in r) + '</tr>' for r in T['rows'])
    return f'<table class="itab"><tr>{head}</tr>{rows}</table>'


def part_4(R):
    P = R['P4']
    body = part_head(4, P) + f'<p class="lead">{m(P["lead"])}</p>'
    if P.get('context'):
        body += ''.join(f'<p class="en">{m(x)}</p>' for x in P['context'])
    if P.get('table'):
        body += info_table(P['table'])
    body += f'<div class="topic">{m(P["question"])}</div><p class="en">{m(P["instruction"])}</p>'
    return page(body, 'flow')


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


def part_5(R):
    P = R['P5']
    return page(part_head(5, P) + f'<p class="lead">{m(P["lead"])}</p>' + chart_block(P['chart'])
                + f'<div class="topic">{m(P["instruction"])}</div>', 'flow')


# ───────── 解答用紙 ─────────

def sheet_head(R, k):
    return (f'<div class="sh-head"><span class="sh-t">解答用紙</span><span class="sh-s">予想問題 第{R["n"]}回 英語　{k}枚目／5枚</span>'
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


def blank_labels(q):
    return [f'({b})' for b in q['blanks']]


def sheet_field(q):
    t = q['type']
    if t == 'blanks':
        return ast(blank_labels(q))
    if t == 'mc':
        return ast(['記号'])
    if t == 'mc2':
        return ast(['記号', '記号'])
    if t == 'order':
        return ast([f'{i}番目' for i in range(1, len(q['events']) + 1)])
    if t == 'word':
        return lines(1)
    if t == 'ja' and q.get('limit'):
        return genko(math.ceil(q['limit'] / 20) * 20)
    if t == 'en':
        return lines(q.get('lines', 4), 'ln ln4')
    return lines(q.get('lines', 3), 'ln ln4')


def sheet_label(q):
    extra = ''
    if q['type'] == 'ja' and q.get('limit'):
        extra = f'<span class="lim">（{q["limit"]}字以内・句読点も1字）</span>'
    if q['type'] == 'en':
        extra = f'<span class="wc">語数　　　　語</span>'
    return f'<p class="sq">{e(q["label"])}{extra}</p>'


SCORE = '<div class="score">得　点<div></div></div>'


def sheet_read(R, k):
    P = R[f'P{k}']
    body = sheet_head(R, k) + f'<p><span class="bignum">〔{k}〕</span></p>'
    small = []
    for q in P['questions']:
        if q['type'] in SMALL:
            small.append(f'<div>{sheet_label(q)}{sheet_field(q)}</div>')
            continue
        if small:
            body += '<div class="sqrow">' + ''.join(small) + '</div>'
            small = []
        body += sheet_label(q) + sheet_field(q)
    if small:
        body += '<div class="sqrow">' + ''.join(small) + '</div>'
    return body + SCORE


def sheets(R):
    s = [sheet_read(R, k) for k in (1, 2, 3)]
    s.append(sheet_head(R, 4) + '<p><span class="bignum">〔4〕</span>（約100語）<span class="wc">語数　　　　語</span></p>'
             + lines(R['P4'].get('lines', 15), 'ln ln4') + SCORE)
    s.append(sheet_head(R, 5) + '<p><span class="bignum">〔5〕</span>（約80語）<span class="wc">語数　　　　語</span></p>'
             + lines(R['P5'].get('lines', 12), 'ln ln4') + SCORE)
    return ''.join(page(x, 'sheet') for x in s)


def colophon(R, kind):
    return page(f'''
<h2 class="colh">奥　付</h2>
<table class="col">
<tr><th>書名</th><td>国公立2次 予想問題 第{R['n']}回 英語 {'問題' if kind == 'q' else '解答・解説'}</td></tr>
<tr><th>想定</th><td>{UNIV} 一般選抜 前期日程（個別学力検査「外国語（英語）」・全学部共通）の出題形式に準拠</td></tr>
<tr><th>構成</th><td>大問〔1〕〜〔5〕（長文読解 3 題・約 100 語の自由英作文・グラフを説明する約 80 語の英作文）／120 分／200 点（40・45・45・40・30。小問の配点は編集部の想定）</td></tr>
<tr><th>編集・作成</th><td>学習アプリ マナトビ 編集部（{R.get('date', '2026年11月')}）</td></tr>
</table>
<div class="disc"><b>{e(DISCLAIMER)}</b><br><span>英文・設問・図表・解答・解説はすべて編集部の書き下ろしです。実際の試験の問題文・解答例の文章は引用していません。</span></div>
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


def choice_keys(q, i=None):
    if q.get('subs'):
        return [c[0] for c in q['subs'][i]['choices']]
    return [c[0] for c in q['choices']]


def check_q(q, P):
    text = ' '.join(P['passage'])
    lab = q['label']
    if q.get('ref'):
        assert f'{{u{q["ref"]}|' in text, ('下線部が本文にない', lab, q['ref'])
    t = q['type']
    if t == 'blanks':
        assert len(q['answers']) == len(q['blanks']), ('blanks answers', lab)
        for i, (b, a) in enumerate(zip(q['blanks'], q['answers'])):
            if q.get('in_text', True):   # 語句の言いかえ問題（本文に空所がない）は in_text=False
                assert f'{{b{b}}}' in text, ('空所が本文にない', lab, b)
            assert a in choice_keys(q, i), ('答えが選択肢にない', lab, b, a)
        if q.get('distinct'):
            assert len(set(q['answers'])) == len(q['answers']), ('同じ記号を2回', lab)
    elif t == 'mc':
        assert q['answer'] in choice_keys(q), ('mc', lab)
    elif t == 'mc2':
        assert len(q['answers']) == 2 and len(set(q['answers'])) == 2, ('mc2', lab)
        assert all(a in choice_keys(q) for a in q['answers']), ('mc2 choices', lab)
    elif t == 'order':
        assert sorted(q['answer']) == sorted(a for a, _ in q['events']), ('order', lab)
    elif t == 'word':
        w = q['answer'].lower()
        pt = plain(text).lower()
        assert re.search(rf'\b{re.escape(w)}(s|es)?\b', pt) or re.search(rf'\b{re.escape(w[:-1])}ies\b', pt), ('抜き出し語が本文にない', lab, w)
        assert len(q['answer'].split()) == 1, ('1語', lab)
    elif t == 'ja':
        assert sum(p for _, p in q['criteria']) == q['points'], ('ja criteria', lab)
        if q.get('limit'):
            assert jlen(q['answer']) <= q['limit'], ('字数オーバー', lab, jlen(q['answer']))
    elif t == 'en':
        assert sum(p for _, p in q['criteria']) == q['points'], ('en criteria', lab)
        lo, hi = q['words']
        for j, (_, txt) in enumerate(q['models'], 1):
            assert lo <= wcount(txt) <= hi, ('英語の語数', lab, j, wcount(txt))
    else:
        raise AssertionError(('unknown type', t))


def short_answer(q):
    t = q['type']
    if t == 'blanks':
        return '　'.join(f'({b}) {a}' for b, a in zip(q['blanks'], q['answers']))
    if t == 'mc':
        return q['answer']
    if t == 'mc2':
        return '・'.join(q['answers'])
    if t == 'order':
        return ' → '.join(q['answer'])
    if t == 'word':
        return q['answer']
    return '解答例を参照'


def full_translation(P):
    tr = ''.join(f'<p class="trp"><span class="pno">{i + 1}</span>{m(t)}</p>' for i, t in enumerate(P['translation']))
    vocab = ''
    if P.get('vocab'):
        vocab = '<p class="ah">語句</p><div class="vocab">' + ''.join(
            f'<span class="vw"><i>{e(w)}</i>　{e(j)}</span>' for w, j in P['vocab']) + '</div>'
    return f'<p class="ah">全訳</p>{tr}{vocab}'


def a_part_read(R, k):
    P = R[f'P{k}']
    qs = P['questions']
    for q in qs:
        check_q(q, P)
    rows = [(q['label'], short_answer(q), q['points']) for q in qs]
    assert sum(r[2] for r in rows) == P['points'], (f'P{k} points', sum(r[2] for r in rows))
    body = part_head(k, P, ' — 解答・解説') + '<p class="ah">解答一覧</p>' + akey_table(rows)
    for q in qs:
        body += f'<h3 class="aq"><span class="qk">{e(q["label"])}</span>{e(q["kind"])}（{q["points"]}点）</h3>'
        if q['type'] == 'ja':
            lim = f'<span class="lim">（{jlen(q["answer"])}字）</span>' if q.get('limit') else ''
            body += f'<p class="ans">【解答例】{m(q["answer"])}{lim}</p>'
        elif q['type'] == 'en':
            for j, (title, txt) in enumerate(q['models'], 1):
                body += f'<p class="ah">解答例{j}　{e(title)}（{wcount(txt)}語）</p><div class="model-en"><p>{m(txt)}</p></div>'
        else:
            body += f'<p class="ans">【解答】{m(short_answer(q))}</p>'
        if q.get('subexpl'):
            body += ''.join(f'<p class="subexp"><b>{e(l)}</b>　{m(t)}</p>' for l, t in q['subexpl'])
        if q.get('expl'):
            body += f'<p class="expl">{m(q["expl"])}</p>'
        if q.get('criteria'):
            body += crit(q)
    body += full_translation(P)
    return page(body, 'flow')


def a_writing(P, n, words):
    assert sum(p for _, p in P['criteria']) == P['points'], (f'P{n} criteria', P['points'])
    body = part_head(n, P, ' — 解答・解説')
    if n == 5:
        body += chart_block(P['chart'])
        body += '<p class="ah">グラフから読み取れること</p><ul class="tips">' + ''.join(f'<li>{m(t)}</li>' for t in P['facts']) + '</ul>'
    body += crit(P)
    body += '<p class="ah">書き方のポイント</p><ul class="tips">' + ''.join(f'<li>{m(t)}</li>' for t in P['tips']) + '</ul>'
    for k, (title, outline, text) in enumerate(P['models'], 1):
        wc = wcount(text)
        assert words[0] <= wc <= words[1], (f'P{n} model words', k, wc)
        body += (f'<p class="ah">解答例{k}　{e(title)}（{wc}語）</p><p class="outl">構成：{m(outline)}</p>'
                 f'<div class="model-en">{"".join(f"<p>{m(p)}</p>" for p in text.split(chr(10)))}</div>')
    body += '<p class="ah">解答例1の訳</p>' + ''.join(f'<p class="trp">{m(t)}</p>' for t in P['model_ja'])
    return page(body, 'flow')


def build(R, kind, ranges):
    if kind == 'q':
        parts = (cover(R, 'q', ranges) + ''.join(part_read(R, k) for k in (1, 2, 3)) + part_4(R) + part_5(R)
                 + sheets(R) + colophon(R, 'q'))
    else:
        parts = (cover(R, 'a', ranges) + ''.join(a_part_read(R, k) for k in (1, 2, 3))
                 + a_writing(R['P4'], 4, P4_WORDS) + a_writing(R['P5'], 5, P5_WORDS) + colophon(R, 'a'))
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
    for k, v in POINTS.items():
        assert R[k]['points'] == v, (k, R[k]['points'])
    assert sum(R[k]['points'] for k in KEYS) == 200
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
    dest = ROOT / 'public' / 'prints' / f'print_lr_niji_kyushu_en_{n}.pdf'
    subprocess.run(['pdfunite', str(q), str(a), str(dest)], check=True)
    print(f'第{n}回: 問題 {last}p（解答用紙 {qr[2]}〜{qr[3]}）・解答解説 {ar[1] + 1}p → {dest.relative_to(ROOT)} {dest.stat().st_size // 1024}KB')


if __name__ == '__main__':
    sys.path.insert(0, str(HERE))
    arg = sys.argv[1] if len(sys.argv) > 1 else 'all'
    for k in ([1, 2, 3] if arg == 'all' else [int(arg)]):
        render(k)
