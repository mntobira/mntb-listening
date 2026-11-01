# -*- coding: utf-8 -*-
"""熊本大学 一般選抜（前期日程）対策 英語 予想問題 — 紙面づくり（2026-11-01）

  python3 scripts/gacha-prints/kumamoto_mock/render.py 1      # 第1回（r1.py のデータ）
  python3 scripts/gacha-prints/kumamoto_mock/render.py all    # 第1〜3回
→ .tmpwork/kumamoto/予想問題_熊本大学_英語_第N回_{問題,解答解説}.pdf と public/prints/print_lr_niji_kumamoto_en_N.pdf

紙面は ryukyu_mock と同じ試験冊子の形（表紙 → 大問 → 解答用紙3枚 → 奥付 ／ 解答・解説編）。
大問の型（Ⅰ 長文・日本語の字数制限つき記述と記号・並べ替え／Ⅱ 英語の設問に英語で答える長文／
Ⅲ 80〜100語の意見英作文／Ⅳ 会話文の空所20か所に語群から語を入れる・120分）だけを公開情報から参考にし、
英文・設問・解答はすべて書き下ろし（過去問の英文・解答例は引用していない）。
配点は大学が公表していないため、編集部の想定（Ⅰ32・Ⅱ32・Ⅲ16・Ⅳ20）とした。
"""
import html, importlib, math, re, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
OUT = ROOT / '.tmpwork' / 'kumamoto'
UNIV = '熊本大学'
DISCLAIMER = f'{UNIV}の過去問・公式問題ではありません。予想問題であり、大学とは関係がありません。'
ROMAN = {1: 'Ⅰ', 2: 'Ⅱ', 3: 'Ⅲ', 4: 'Ⅳ'}
PART_NAMES = {1: '長文読解（日本語で答える）', 2: '長文読解（英語で答える）', 3: '自由英作文', 4: '会話文の空所補充'}
KEYS = ('P1', 'P2', 'P3', 'P4')


def e(s):
    return html.escape(str(s), quote=False)


def m(s):
    """{u1|…} 下線＋(1)、{g2} 並べ替えの空欄(2)、{bア} 空所（ ア ）、{s1} 四角の空所 [1]、{box} 四角の空所、
    **…** 太字、//…// 斜体、{br} 改行"""
    t = e(s)
    t = re.sub(r'\{u([A-Za-z0-9ア-ン]*)\|(.+?)\}',
               lambda x: (f'<span class="ul"><span class="ulab">({x.group(1)})</span>{x.group(2)}</span>' if x.group(1)
                          else f'<span class="ul">{x.group(2)}</span>'), t)
    t = re.sub(r'\{g([0-9]+)\}', lambda x: f'<span class="ul"><span class="ulab">({x.group(1)})</span>{"　" * 14}</span>', t)
    t = re.sub(r'\{s([0-9]+)\}', lambda x: f'<span class="wbox">　{x.group(1)}　</span>', t)
    t = t.replace('{box}', '<span class="wbox">　　　　　</span>')
    t = re.sub(r'\{b([A-Z0-9ア-ン]+)\}', lambda x: f'<span class="blank">（　{x.group(1)}　）</span>', t)
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
            '解答時間は 120 分。はじめに全体を見渡し，時間の配分を決めてから取り組むこと（目安：Ⅰ 40 分，Ⅱ 35 分，Ⅲ 20 分，Ⅳ 20 分，見直し 5 分）。',
            '大問はⅠ〜Ⅳの 4 題。配点は編集部の想定で，Ⅰ 32 点・Ⅱ 32 点・Ⅲ 16 点・Ⅳ 20 点の合計 100 点とした。',
            '解答はすべて巻末の 3 枚の解答用紙の所定の欄に書くこと（切り取って使える）。日本語で答える問題は，句読点も 1 字に数える。',
            'Ⅲの英作文は語数を数え，解答用紙の欄に記入すること。ピリオドやコンマなどの句読点は語数に入れない。',
            '英文・設問はすべて編集部の書き下ろしで，登場する人物・団体・調査・数値は架空のものである。',
        ]
    else:
        notes = [
            '各大問のはじめに解答一覧と配点を示した。配点は全体を 100 点としたときの編集部の想定である。',
            '日本語で答える問題の【解答例】は一例である。「採点の目安」の要素がそろっていれば，表現が違っても得点としてよい。',
            'Ⅰ・Ⅱには全訳と語句をつけた。答え合わせのあとに，根拠になる文をもう一度読み直すこと。',
            'Ⅲの解答例は 2 つの立場で示した。どちらの立場でも，理由と具体例が筋道立っていれば評価は同じである。',
            'Ⅳは語の選び方だけでなく，動詞の形（過去形・過去分詞・-ing 形など）まで合って正解とする。',
        ]
    lis = ''.join(f'<li>{e(x)}</li>' for x in notes)
    return page(f'''
<div class="cv-head">{logo()}<span>学習アプリ マナトビ ｜ 国公立2次 予想問題</span></div>
<div class="cv-main">
  <p class="cv-round">予想問題 第{R['n']}回</p>
  <p class="cv-subject">英　　　語</p>
  <p class="cv-sub">（ 120 分 ）</p>
  <p class="cv-kind">{label}</p>
  <p class="cv-range">{rng}</p>
  <p class="cv-univ">{UNIV} 一般選抜 前期日程 対策</p>
</div>
<div class="cv-notes"><p class="cv-notes-h">はじめに読むこと</p><ol>{lis}</ol></div>
<div class="disc"><b>{e(DISCLAIMER)}</b><br><span>出題の傾向を研究し，編集部が一から書き下ろした演習用の冊子です。</span></div>
<div class="cv-foot"><span>学習アプリ マナトビ 編集部</span><span>第{R['n']}回 ／ {'問題' if kind == 'q' else '解答・解説'}</span></div>
''', 'cover')


def part_head(n, P, suffix=''):
    return f'<h2 class="part"><span class="pnum">{ROMAN[n]}</span>{PART_NAMES[n]}{suffix}（{P["points"]}点）</h2>'


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
        longest = max(len(c[1]) for c in ch)
        cols = 4 if longest <= 15 else (2 if longest <= 34 else 0)
    if cols:
        return f'<div class="cgrid c{cols}">' + ''.join(f'<span><span class="sl">{e(c[0])}</span>{m(c[1])}</span>' for c in ch) + '</div>'
    return '<ol class="choices ind">' + ''.join(f'<li><span class="cl">{e(c[0])}</span>{m(c[1])}</li>' for c in ch) + '</ol>'


def lim_text(q):
    lo_hi = q['limit']
    if isinstance(lo_hi, (list, tuple)):
        return f'{lo_hi[0]}〜{lo_hi[1]}字'
    return f'{lo_hi}字以内'


def q1(q):
    body = f'<div>{m(q["stem"])}</div>'
    if q['type'] == 'order':
        body += '<div class="wbox" style="margin-left:4mm">[ ' + e(' / '.join(q['words'])) + ' ]</div>'
    if q['type'] == 'mc':
        body += choice_list(q.get('choices'), q.get('cols'))
        for s in q.get('subs', []):
            if s.get('choices'):
                body += f'<div class="sub"><span class="sl">{e(s["label"])}</span>{m(s.get("text", ""))}{choice_list(s["choices"], s.get("cols"))}</div>'
    return f'<div class="q"><span class="qk">{e(q["label"])}</span><div class="qbody">{body}</div></div>'


def part_1(R):
    P = R['P1']
    return page(part_head(1, P) + f'<p class="lead">{m(P["lead"])}</p>' + passage(P) + ''.join(q1(q) for q in P['questions']), 'flow')


def q2(i, q):
    return (f'<div class="q"><span class="qno">{i}</span><div class="qbody"><div>{m(q["stem"])}</div>'
            f'{choice_list(q["choices"], q.get("cols", 0))}</div></div>')


def part_2(R):
    P = R['P2']
    return page(part_head(2, P) + f'<p class="lead">{m(P["lead"])}</p>' + passage(P)
                + ''.join(q2(i, q) for i, q in enumerate(P['questions'], 1)), 'flow')


def part_3(R):
    P = R['P3']
    return page(part_head(3, P) + f'<p class="lead">{m(P["lead"])}</p><div class="topic">{m(P["topic"])}</div>', 'flow')


def part_4(R):
    P = R['P4']
    words = '<div class="words">' + ''.join(f'<span>{e(w)}</span>' for w in P['words']) + '</div>'
    rows = ''.join(f'<tr><td class="who">{e(w)}:</td><td>{m(t)}</td></tr>' for w, t in P['dialogue'])
    return page(part_head(4, P) + f'<p class="lead">{m(P["lead"])}</p><p class="sq">＜語群＞</p>{words}<table class="dlg">{rows}</table>', 'flow')


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


def sub_labels(q):
    return [s['label'] for s in q['subs']]


def sheet_q1(q):
    head = f'<p class="sq">{e(q["label"])}'
    if q['type'] == 'ja':
        hi = q['limit'][1] if isinstance(q['limit'], (list, tuple)) else q['limit']
        return head + f'<span class="lim">（{lim_text(q)}・句読点も1字）</span></p>' + genko(math.ceil(hi / 20) * 20)
    if q['type'] == 'order':
        return head + '</p>' + lines(1)
    return head + '</p>' + ast(sub_labels(q))


SCORE = '<div class="score">得　点<div></div></div>'


def sheets(R):
    P1, P2, P3, P4 = (R[k] for k in KEYS)
    s1 = sheet_head(R, 1) + '<p><span class="bignum">Ⅰ</span></p>' + ''.join(sheet_q1(q) for q in P1['questions']) + SCORE
    n2 = len(P2['questions'])
    s2 = (sheet_head(R, 2) + '<p><span class="bignum">Ⅱ</span></p>' + ast([str(i) for i in range(1, n2 + 1)])
          + '<p class="sp"><span class="bignum" style="margin:0 2mm 0 0">Ⅲ</span>（80〜100語）<span class="wc">語数　　　　語</span></p>'
          + lines(P3.get('lines', 13), 'ln ln4') + SCORE)
    n4 = len(P4['answers'])
    s3 = sheet_head(R, 3) + '<p><span class="bignum">Ⅳ</span></p>' + ''.join(
        ast([f'({i})' for i in range(k, min(k + 5, n4 + 1))], 'ast wide') for k in range(1, n4 + 1, 5)) + SCORE
    return ''.join(page(x, 'sheet') for x in (s1, s2, s3))


def colophon(R, kind):
    return page(f'''
<h2 class="colh">奥　付</h2>
<table class="col">
<tr><th>書名</th><td>国公立2次 予想問題 第{R['n']}回 英語 {'問題' if kind == 'q' else '解答・解説'}</td></tr>
<tr><th>想定</th><td>{UNIV} 一般選抜 前期日程（個別学力検査「英語」・全学部共通）の出題形式に準拠</td></tr>
<tr><th>構成</th><td>大問Ⅰ〜Ⅳ（日本語で答える長文読解・英語で答える長文読解・80〜100語の自由英作文・会話文の空所補充）／120 分／配点は編集部の想定（32・32・16・20）</td></tr>
<tr><th>編集・作成</th><td>学習アプリ マナトビ 編集部（{R.get('date', '2026年11月')}）</td></tr>
</table>
<div class="disc"><b>{e(DISCLAIMER)}</b><br><span>英文・設問・解答・解説はすべて編集部の書き下ろしです。実際の試験の問題文・解答例の文章は引用していません。</span></div>
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


def norm_words(s):
    return sorted(w.lower() for w in re.findall(r"[A-Za-z’'-]+", s))


def jlen(s):
    return len(re.sub(r'\s', '', s))


def check_q1(q):
    if q['type'] == 'ja':
        assert sum(p for _, p in q['criteria']) == q['points'], ('ja criteria', q['label'])
        n = jlen(q['answer'])
        if isinstance(q['limit'], (list, tuple)):
            assert q['limit'][0] <= n <= q['limit'][1], ('ja length', q['label'], n)
        else:
            assert n <= q['limit'], ('ja length', q['label'], n)
    elif q['type'] == 'order':
        assert norm_words(q['answer']) == norm_words(' '.join(q['words'])), ('order words', q['label'])
    else:
        labs = sub_labels(q)
        assert len(q['answers']) == len(labs), ('answers', q['label'])
        for i, a in enumerate(q['answers']):
            ch = q.get('choices') or q['subs'][i].get('choices')
            assert a in [c[0] for c in ch], ('answer not in choices', q['label'], a)
        if q.get('distinct'):
            assert len(set(q['answers'])) == len(q['answers']), ('distinct', q['label'])


def q1_short(q):
    if q['type'] == 'ja':
        return '解答例を参照'
    if q['type'] == 'order':
        return q['answer']
    return '　'.join(f'{l} {a}' for l, a in zip(sub_labels(q), q['answers']))


def full_translation(P):
    tr = ''.join(f'<p class="trp"><span class="pno">{i + 1}</span>{m(t)}</p>' for i, t in enumerate(P['translation']))
    vocab = ''
    if P.get('vocab'):
        vocab = '<p class="ah">語句</p><div class="vocab">' + ''.join(
            f'<span class="vw"><i>{e(w)}</i>　{e(j)}</span>' for w, j in P['vocab']) + '</div>'
    return f'<p class="ah">全訳</p>{tr}{vocab}'


def a_part_1(R):
    P = R['P1']
    for q in P['questions']:
        check_q1(q)
    rows = [(q['label'], q1_short(q), q['points']) for q in P['questions']]
    assert sum(r[2] for r in rows) == P['points'], ('P1 points', sum(r[2] for r in rows))
    body = part_head(1, P, ' — 解答・解説') + '<p class="ah">解答一覧</p>' + akey_table(rows)
    for q in P['questions']:
        body += f'<h3 class="aq"><span class="qk">{e(q["label"])}</span>{e(q["kind"])}（{q["points"]}点）</h3>'
        if q['type'] == 'ja':
            body += f'<p class="ans">【解答例】{m(q["answer"])}<span class="lim">（{jlen(q["answer"])}字）</span></p>'
        else:
            body += f'<p class="ans">【解答】{m(q1_short(q))}</p>'
        if q.get('subexpl'):
            body += ''.join(f'<p class="subexp"><b>{e(l)}</b>　{m(t)}</p>' for l, t in zip(sub_labels(q), q['subexpl']))
        if q.get('expl'):
            body += f'<p class="expl">{m(q["expl"])}</p>'
        body += crit(q)
    body += full_translation(P)
    return page(body, 'flow')


def a_part_2(R):
    P = R['P2']
    qs = P['questions']
    for i, q in enumerate(qs, 1):
        assert q['answer'] in [c[0] for c in q['choices']], ('P2 answer', i)
    assert P['each'] * len(qs) == P['points'], ('P2 points', P['each'] * len(qs))
    rows = [(str(i), q['answer'], P['each']) for i, q in enumerate(qs, 1)]
    body = part_head(2, P, ' — 解答・解説') + '<p class="ah">解答一覧</p>' + akey_table(rows)
    for i, q in enumerate(qs, 1):
        body += (f'<h3 class="aq"><span class="qno">{i}</span>{e(q["kind"])}（{P["each"]}点）</h3>'
                 f'<p class="ans">【解答】{e(q["answer"])}</p><p class="expl">{m(q["expl"])}</p>')
    body += full_translation(P)
    return page(body, 'flow')


def a_part_3(R):
    P = R['P3']
    assert sum(p for _, p in P['criteria']) == P['points'], ('P3 points', P['points'])
    body = part_head(3, P, ' — 解答・解説') + crit(P)
    body += '<p class="ah">書き方のポイント</p><ul class="tips">' + ''.join(f'<li>{m(t)}</li>' for t in P['tips']) + '</ul>'
    for k, (title, outline, text) in enumerate(P['models'], 1):
        wc = len(re.findall(r"[A-Za-z0-9'’.%-]*[A-Za-z0-9]", text))
        assert 80 <= wc <= 100, ('model words', k, wc)
        body += (f'<p class="ah">解答例{k}　{e(title)}（{wc}語）</p><p class="outl">構成：{m(outline)}</p>'
                 f'<div class="model-en">{"".join(f"<p>{m(p)}</p>" for p in text.split(chr(10)))}</div>')
    if P.get('model_ja'):
        body += '<p class="ah">解答例1の訳</p>' + ''.join(f'<p class="trp">{m(t)}</p>' for t in P['model_ja'])
    return page(body, 'flow')


def a_part_4(R):
    P = R['P4']
    ans = P['answers']   # [(語群の語, 記入する形), ...]
    assert len(P['words']) == 25 and len(set(P['words'])) == 25, '語群は25語'
    bases = [b for b, _ in ans]
    assert all(b in P['words'] for b in bases), ('語群にない語', [b for b in bases if b not in P['words']])
    assert len(set(bases)) == len(bases), '語群の語は1回ずつ'
    assert len(ans) == P['points'], ('P4 points', len(ans))
    for i in range(1, len(ans) + 1):
        assert any(f'{{b{i}}}' in t for _, t in P['dialogue']), ('空所が本文にない', i)
    rows = [(f'({i})', f if f == b else f'{f}（← {b}）', 1) for i, (b, f) in enumerate(ans, 1)]
    body = part_head(4, P, ' — 解答・解説') + '<p class="ah">解答一覧（各1点・形まで合って正解）</p>' + akey_table(rows)
    body += '<p class="ah">解説</p>' + ''.join(f'<p class="subexp"><b>({i})</b>　{m(t)}</p>' for i, t in enumerate(P['subexpl'], 1))
    unused = [w for w in P['words'] if w not in bases]
    body += f'<p class="small">使わなかった語：{e("・".join(unused))}</p>'
    tr = ''.join(f'<tr><td class="who">{e(w)}:</td><td>{m(t)}</td></tr>' for w, t in P['translation'])
    body += f'<p class="ah">全訳</p><table class="dlg facts">{tr}</table>'
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
    dest = ROOT / 'public' / 'prints' / f'print_lr_niji_kumamoto_en_{n}.pdf'
    subprocess.run(['pdfunite', str(q), str(a), str(dest)], check=True)
    print(f'第{n}回: 問題 {last}p（解答用紙 {qr[2]}〜{qr[3]}）・解答解説 {ar[1] + 1}p → {dest.relative_to(ROOT)} {dest.stat().st_size // 1024}KB')


if __name__ == '__main__':
    sys.path.insert(0, str(HERE))
    arg = sys.argv[1] if len(sys.argv) > 1 else 'all'
    for k in ([1, 2, 3] if arg == 'all' else [int(arg)]):
        render(k)
