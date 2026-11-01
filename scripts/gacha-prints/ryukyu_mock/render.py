# -*- coding: utf-8 -*-
"""琉球大学 一般選抜（前期日程）対策 英語 予想問題 — 紙面づくり（2026-10-31）

  python3 scripts/gacha-prints/ryukyu_mock/render.py 1      # 第1回（r1.py のデータ）
  python3 scripts/gacha-prints/ryukyu_mock/render.py all    # 第1〜3回
→ .tmpwork/ryukyu/予想問題_琉球大学_英語_第N回_{問題,解答解説}.pdf と public/prints/print_lr_niji_ryukyu_en_N.pdf

紙面は gakugei_mock と同じ試験冊子の形（表紙 → 大問 → 解答用紙3枚 → 奥付 ／ 解答・解説編）。
大問の型（1 論説の長文・記号選択 30点／2 物語文・記号選択と並べ替え 30点／3 会話文の空所10か所 10点／
4 グラフを読んで150語程度の英作文 30点・100分）だけを公開情報から参考にし、
英文・設問・グラフの数値・解答はすべて書き下ろし（過去問の英文・解答例は引用していない）。
"""
import html, importlib, re, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
OUT = ROOT / '.tmpwork' / 'ryukyu'
UNIV = '琉球大学'
DISCLAIMER = f'{UNIV}の過去問・公式問題ではありません。予想問題であり、大学とは関係がありません。'
PART_NAMES = {1: '長文読解（論説）', 2: '長文読解（物語）', 3: '会話文', 4: 'グラフ読解・英作文'}
KEYS = ('P1', 'P2', 'P3', 'P4')


def e(s):
    return html.escape(str(s), quote=False)


def m(s):
    """{uア|…} 下線＋ラベル (ア)、{u|…} 下線だけ、{b1} 空所（ 1 ）、**…** 太字、//…// 斜体、{br} 改行"""
    t = e(s)
    t = re.sub(r'\{u([A-Za-z0-9ア-ン]*)\|(.+?)\}',
               lambda x: (f'<span class="ul"><span class="ulab">({x.group(1)})</span>{x.group(2)}</span>' if x.group(1)
                          else f'<span class="ul">{x.group(2)}</span>'), t)
    t = re.sub(r'\{b([A-Z0-9]+)\}', lambda x: f'<span class="blank">（　{x.group(1)}　）</span>', t)
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
            '解答時間は 100 分。はじめに全体を見渡し，時間の配分を決めてから取り組むこと（目安：1 と 2 に各 30 分，3 に 10 分，4 に 25 分，見直し 5 分）。',
            '大問は 1〜4 の 4 題。配点は 1・2・4 が各 30 点，3 が 10 点で，合計 100 点である。',
            '解答はすべて巻末の 3 枚の解答用紙の所定の欄に，記号または英文で書くこと（切り取って使える）。問題のページの余白は下書きに使ってよい。',
            '4 の英作文は 150 語程度で書き，語数を解答用紙の欄に記入すること。',
            '英文・設問・グラフはすべて編集部の書き下ろしで，登場する人物・団体・調査・数値は架空のものである。',
        ]
    else:
        notes = [
            '各大問のはじめに解答一覧と配点を示した。配点は全体を 100 点としたときの点数である。',
            '記号の問題は，正解の根拠になる本文の箇所を解説に示した。間違えた問題は，その箇所を読み直すこと。',
            '1・2・3 には全訳をつけた。答え合わせのあとに，知らなかった語句を確認すること。',
            '4 の英作文の解答例は一例である。「採点の目安」の要素がそろっていれば，表現が違っても得点としてよい。',
            'グラフの数値は架空のもので，実際の調査結果ではない。',
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
    if not ch:
        return ''
    if cols is None:
        cols = 5 if len(ch) >= 5 and max(len(c[1]) for c in ch) <= 14 else (4 if max(len(c[1]) for c in ch) <= 16 else 0)
    if cols:
        return f'<div class="cgrid c{cols}">' + ''.join(f'<span><span class="sl">{e(c[0])}</span>{m(c[1])}</span>' for c in ch) + '</div>'
    return '<ol class="choices ind">' + ''.join(f'<li><span class="cl">{e(c[0])}</span>{m(c[1])}</li>' for c in ch) + '</ol>'


def question(q):
    body = f'<div>{m(q["stem"])}</div>'
    if q.get('order'):
        body += '<ul class="events">' + ''.join(f'<li><span class="sl">{e(a)}</span>{m(t)}</li>' for a, t in q['order']['events']) + '</ul>'
    body += choice_list(q.get('choices'), q.get('cols'))
    for s in q.get('subs', []):
        if s.get('text') or s.get('choices'):
            body += f'<div class="sub"><span class="sl">{e(s["label"])}</span>{m(s.get("text", ""))}{choice_list(s.get("choices"), s.get("cols"))}</div>'
    return f'<div class="q"><span class="qk">{e(q["label"])}</span><div class="qbody">{body}</div></div>'


def part_1(R):
    P = R['P1']
    return page(part_head(1, P) + f'<p class="lead">{m(P["lead"])}</p>' + passage(P) + ''.join(question(q) for q in P['questions']), 'flow')


def part_2(R):
    P = R['P2']
    return page(part_head(2, P) + f'<p class="lead">{m(P["lead"])}</p>' + passage(P) + ''.join(question(q) for q in P['questions']), 'flow')


def dialogue(P):
    rows = ''.join(f'<tr><td class="who">{e(w)}:</td><td>{m(t)}</td></tr>' for w, t in P['dialogue'])
    return f'<table class="dlg">{rows}</table>'


def part_3(R):
    P = R['P3']
    return page(part_head(3, P) + f'<p class="lead">{m(P["lead"])}</p>' + dialogue(P)
                + '<div class="q" style="margin-top:4mm"><span class="qk">選択肢</span><div class="qbody">'
                + choice_list(P['choices'], 0) + '</div></div>', 'flow')


def chart_svg(C, w=620, h=300):
    """グループ化した横並びの棒グラフ（白黒。系列は濃さと斜線で見分ける）"""
    cats, series = C['categories'], C['series']
    ml, mr, mt, mb = 44, 10, 34, 46
    pw, ph = w - ml - mr, h - mt - mb
    fills = ['#111', '#fff', '#888', 'url(#hatch)', '#ccc']
    gw = pw / len(cats)
    bw = (gw * 0.8) / len(series)
    out = [f'<svg class="chart" width="{w}" height="{h}" viewBox="0 0 {w} {h}" xmlns="http://www.w3.org/2000/svg" '
           f'font-family="Noto Sans CJK JP, sans-serif">',
           '<defs><pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">'
           '<rect width="5" height="5" fill="#fff"/><line x1="0" y1="0" x2="0" y2="5" stroke="#111" stroke-width="1.6"/></pattern></defs>']
    for v in range(0, 101, 20):
        y = mt + ph - ph * v / 100
        out.append(f'<line x1="{ml}" y1="{y:.1f}" x2="{ml + pw}" y2="{y:.1f}" stroke="#bbb" stroke-width="0.6"/>')
        out.append(f'<text x="{ml - 5}" y="{y + 3.5:.1f}" font-size="10" text-anchor="end">{v}</text>')
    out.append(f'<text x="{ml - 30}" y="{mt - 12}" font-size="10">(%)</text>')
    for i, c in enumerate(cats):
        x0 = ml + gw * i + gw * 0.1
        for j, (_, vals) in enumerate(series):
            v = vals[i]
            bh = ph * v / 100
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


def part_4(R):
    P = R['P4']
    C = P['chart']
    return page(part_head(4, P) + f'<p class="lead">{m(P["lead"])}</p>'
                + f'<p class="chart-cap"><b>{e(C["title"])}</b></p>' + chart_svg(C)
                + f'<p class="chart-src">{e(C["source"])}</p>', 'flow')


# ───────── 解答用紙 ─────────

def sheet_head(R, k):
    return (f'<div class="sh-head"><span class="sh-t">解答用紙</span><span class="sh-s">予想問題 第{R["n"]}回 英語　{k}枚目／3枚</span>'
            f'<span class="sh-name">受験番号　　　　　　　氏名</span></div>')


def sheet_labels(q):
    return [s['label'] for s in q['subs']] if q.get('subs') else ['']


def ast(labels):
    if labels == ['']:
        return '<table class="ast"><tr><td style="width:22mm"></td></tr></table>'
    th = ''.join(f'<th>{e(x)}</th>' for x in labels)
    td = ''.join('<td></td>' for _ in labels)
    return f'<table class="ast"><tr>{th}</tr><tr>{td}</tr></table>'


def sheet_q(q):
    if q.get('order'):
        o = q['order']
        boxes = ''.join('<span>—</span><span class="ob"></span>' for _ in range(len(o['events']) - 2))
        return f'<p class="sq">{e(q["label"])}</p><div class="ord"><b>{e(o["first"])}</b>{boxes}<span>—</span><b>{e(o["last"])}</b></div>'
    return f'<p class="sq">{e(q["label"])}</p>' + ast(sheet_labels(q))


def sheet_compact(qs):
    """選択肢1つだけの設問は横に並べる"""
    out, row = [], []
    for q in qs:
        if not q.get('subs') and not q.get('order'):
            row.append(f'<div>{sheet_q(q)}</div>')
            continue
        if row:
            out.append(f'<div class="sqrow">{"".join(row)}</div>')
            row = []
        out.append(sheet_q(q))
    if row:
        out.append(f'<div class="sqrow">{"".join(row)}</div>')
    return ''.join(out)


SCORE = '<div class="score">得　点<div></div></div>'


def sheets(R):
    P1, P2, P3, P4 = (R[k] for k in KEYS)
    s1 = sheet_head(R, 1) + '<p><span class="bignum">1</span></p>' + sheet_compact(P1['questions']) + SCORE
    n3 = len(P3['answers'])
    s2 = (sheet_head(R, 2) + '<p><span class="bignum">2</span></p>' + sheet_compact(P2['questions'])
          + '<p><span class="bignum">3</span></p>' + ast([f'({i})' for i in range(1, 6)])
          + ast([f'({i})' for i in range(6, n3 + 1)]) + SCORE)
    s3 = (sheet_head(R, 3) + '<p class="sp"><span class="bignum" style="margin:0 2mm 0 0">4</span>（150語程度）<span class="wc">語数　　　　語</span></p>'
          + lines(P4.get('lines', 20), 'ln ln4') + SCORE)
    return ''.join(page(x, 'sheet') for x in (s1, s2, s3))


def lines(n, cls='ln'):
    return ''.join(f'<div class="{cls}"></div>' for _ in range(n))


def colophon(R, kind):
    return page(f'''
<h2 class="colh">奥　付</h2>
<table class="col">
<tr><th>書名</th><td>国公立2次 予想問題 第{R['n']}回 英語 {'問題' if kind == 'q' else '解答・解説'}</td></tr>
<tr><th>想定</th><td>{UNIV} 一般選抜 前期日程（個別学力検査「英語」）の出題形式に準拠</td></tr>
<tr><th>構成</th><td>大問 1〜4（論説の長文読解・物語の長文読解・会話文・グラフを読んで書く英作文）／100 分／100 点（30・30・10・30）</td></tr>
<tr><th>編集・作成</th><td>学習アプリ マナトビ 編集部（{R.get('date', '2026年10月')}）</td></tr>
</table>
<div class="disc"><b>{e(DISCLAIMER)}</b><br><span>英文・設問・グラフ・解答・解説はすべて編集部の書き下ろしです。実際の試験の問題文・解答例の文章は引用していません。グラフの数値は架空です。</span></div>
<p class="small">本冊子の無断転載・複製を禁じます。学習アプリ マナトビの利用者が個人の学習に使う範囲でご利用ください。</p>
''', 'colophon')


# ───────── 解答・解説編 ─────────

def crit(q, title='採点の目安'):
    if not q.get('criteria'):
        return ''
    total = sum(p for _, p in q['criteria'])
    items = ''.join(f'<li>{m(t)}（{p:g}点）</li>' for t, p in q['criteria'])
    return f'<div class="crit"><p class="crit-h">{title}（{total:g}点）</p><ul>{items}</ul></div>'


def akey_table(rows):
    body = ''.join(f'<tr><td>{e(a)}</td><td>{m(b)}</td><td class="pt">{c:g}</td></tr>' for a, b, c in rows)
    total = sum(c for _, _, c in rows)
    return f'<table class="akey"><tr><th>設問</th><th>解答</th><th>配点</th></tr>{body}<tr class="sum"><td>合計</td><td></td><td class="pt">{total:g}</td></tr></table>'


def ans_str(q):
    if q.get('order'):
        o = q['order']
        return ' → '.join([o['first']] + list(q['answers']) + [o['last']])
    labs = sheet_labels(q)
    if labs == ['']:
        return q['answers'][0]
    return '　'.join(f'{l} {a}' for l, a in zip(labs, q['answers']))


def check_q(q):
    labs = sheet_labels(q)
    if q.get('order'):
        o = q['order']
        allk = [a for a, _ in o['events']]
        seq = [o['first']] + list(q['answers']) + [o['last']]
        assert sorted(seq) == sorted(allk), ('order', q['label'], seq)
    else:
        assert len(q['answers']) == len(labs), ('answers', q['label'])
        for i, a in enumerate(q['answers']):
            ch = q.get('choices') or (q['subs'][i].get('choices') if q.get('subs') else None)
            assert ch and a in [c[0] for c in ch], ('answer not in choices', q['label'], a)
        if q.get('choices') and q.get('distinct'):
            assert len(set(q['answers'])) == len(q['answers']), ('distinct', q['label'])


def a_mc_part(n, R, key):
    P = R[key]
    for q in P['questions']:
        check_q(q)
    rows = [(q['label'], ans_str(q), q['points']) for q in P['questions']]
    assert sum(r[2] for r in rows) == P['points'], (key, sum(r[2] for r in rows), P['points'])
    body = part_head(n, P, ' — 解答・解説') + '<p class="ah">解答一覧</p>' + akey_table(rows)
    for q in P['questions']:
        body += f'<h3 class="aq"><span class="qk">{e(q["label"])}</span>{e(q["kind"])}（{q["points"]}点）</h3><p class="ans">【解答】{m(ans_str(q))}</p>'
        if q.get('subexpl'):
            body += ''.join(f'<p class="subexp"><b>{e(l)}</b>　{m(t)}</p>' for l, t in zip(sheet_labels(q), q['subexpl']))
        if q.get('expl'):
            body += f'<p class="expl">{m(q["expl"])}</p>'
    body += full_translation(P)
    return page(body, 'flow')


def full_translation(P):
    tr = ''.join(f'<p class="trp"><span class="pno">{i + 1}</span>{m(t)}</p>' for i, t in enumerate(P['translation']))
    vocab = ''
    if P.get('vocab'):
        vocab = '<p class="ah">語句</p><div class="vocab">' + ''.join(
            f'<span class="vw"><i>{e(w)}</i>　{e(j)}</span>' for w, j in P['vocab']) + '</div>'
    return f'<p class="ah">全訳</p>{tr}{vocab}'


def a_part_3(R):
    P = R['P3']
    labs = [f'({i})' for i in range(1, len(P['answers']) + 1)]
    keys = [c[0] for c in P['choices']]
    assert sorted(P['answers']) == sorted(keys), '3 は選択肢を1回ずつ使う'
    rows = [(l, a, P['points'] / len(labs)) for l, a in zip(labs, P['answers'])]
    body = part_head(3, P, ' — 解答・解説') + '<p class="ah">解答一覧（各1点）</p>' + akey_table(rows)
    body += '<p class="ah">解説</p>' + ''.join(f'<p class="subexp"><b>{e(l)}</b>　{m(t)}</p>' for l, t in zip(labs, P['subexpl']))
    tr = ''.join(f'<tr><td class="who">{e(w)}:</td><td>{m(t)}</td></tr>' for w, t in P['translation'])
    body += f'<p class="ah">全訳</p><table class="dlg facts">{tr}</table>'
    return page(body, 'flow')


def a_part_4(R):
    P = R['P4']
    assert sum(p for _, p in P['criteria']) == P['points'], ('4 points', P['points'])
    body = part_head(4, P, ' — 解答・解説') + crit(P)
    body += '<p class="ah">グラフから読み取れること（例）</p><ul class="tips">' + ''.join(f'<li>{m(t)}</li>' for t in P['facts']) + '</ul>'
    body += '<p class="ah">書き方のポイント</p><ul class="tips">' + ''.join(f'<li>{m(t)}</li>' for t in P['tips']) + '</ul>'
    for k, (title, outline, text) in enumerate(P['models'], 1):
        wc = len(re.findall(r"[A-Za-z0-9'’.%-]*[A-Za-z0-9]", text))
        assert 135 <= wc <= 175, ('model words', k, wc)
        body += (f'<p class="ah">解答例{k}　{e(title)}（{wc}語）</p><p class="outl">構成：{m(outline)}</p>'
                 f'<div class="model-en">{"".join(f"<p>{m(p)}</p>" for p in text.split(chr(10)))}</div>')
    if P.get('model_ja'):
        body += '<p class="ah">解答例1の訳</p>' + ''.join(f'<p class="trp">{m(t)}</p>' for t in P['model_ja'])
    return page(body, 'flow')


def build(R, kind, ranges):
    if kind == 'q':
        parts = cover(R, 'q', ranges) + part_1(R) + part_2(R) + part_3(R) + part_4(R) + sheets(R) + colophon(R, 'q')
    else:
        parts = cover(R, 'a', ranges) + a_mc_part(1, R, 'P1') + a_mc_part(2, R, 'P2') + a_part_3(R) + a_part_4(R) + colophon(R, 'a')
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
    dest = ROOT / 'public' / 'prints' / f'print_lr_niji_ryukyu_en_{n}.pdf'
    subprocess.run(['pdfunite', str(q), str(a), str(dest)], check=True)
    print(f'第{n}回: 問題 {last}p（解答用紙 {qr[2]}〜{qr[3]}）・解答解説 {ar[1] + 1}p → {dest.relative_to(ROOT)} {dest.stat().st_size // 1024}KB')


if __name__ == '__main__':
    sys.path.insert(0, str(HERE))
    arg = sys.argv[1] if len(sys.argv) > 1 else 'all'
    for k in ([1, 2, 3] if arg == 'all' else [int(arg)]):
        render(k)
