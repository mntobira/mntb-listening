# -*- coding: utf-8 -*-
"""山口大学 一般選抜（前期日程）対策 英語 予想問題 — 紙面づくり（2026-11-03）

  python3 scripts/gacha-prints/yamaguchi_mock/render.py 1      # 第1回（r1.py のデータ）
  python3 scripts/gacha-prints/yamaguchi_mock/render.py all    # 第1〜3回
→ .tmpwork/yamaguchi/予想問題_山口大学_英語_第N回_{問題,解答解説}.pdf と public/prints/print_lr_niji_yamaguchi_en_N.pdf

紙面は fwu_mock と同じ試験冊子の形（表紙 → Ⅰ〜Ⅲ → 解答用紙3枚 → 奥付 ／ 解答・解説編）。
参考にしたのは公開されている出題の「形」だけ：120分・200点・大問3題。
  Ⅰ 約1000語の解説文。設問も解答も英語（本文の表現で文を完成・記号選択・頭文字つき要約の空所・T/F・題の選択）。
  Ⅱ 約1000語のエッセイ／物語。設問は日本語（下線部の説明・下線部和訳・日本語の要約の空所・語義・出来事の順番）。
  Ⅲ-1 会話文と関連記事を読んで会話の空所に英語を入れる。Ⅲ-2 日本語で示した内容を英語にしてメールを完成する。
英文・設問・解答はすべて書き下ろしで、過去問の英文・解答例は引用していない。
大問の配点（65・65・30・40）は公開問題の大問配点にならい、小問の配点は編集部の想定。
"""
import html, importlib, re, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
OUT = ROOT / '.tmpwork' / 'yamaguchi'
UNIV = '山口大学'
DISCLAIMER = f'{UNIV}の過去問・公式問題ではありません。予想問題であり、大学とは関係がありません。'
POINTS = {'P1': 65, 'P2': 65, 'P31': 30, 'P32': 40}
PASSAGE_WORDS = (880, 1080)
CIRC = '①②③④⑤⑥⑦⑧⑨'
LETTERS = 'abcdefgh'


def e(s):
    return html.escape(str(s), quote=False)


def m(s):
    """{u1|…} 下線＋(1)、{bA} 空所（ A ）、{c1} 空所（ ① ）、{s1:h} 頭文字つき空所 (1) h___、**…** 太字、//…// 斜体、{br} 改行"""
    t = e(s)
    t = re.sub(r'\{u(\d)\|(.+?)\}',
               lambda x: f'<span class="ul"><span class="ulab">({x.group(1)})</span>{x.group(2)}</span>', t)
    t = re.sub(r'\{b([A-Z])\}', lambda x: f'<span class="blank">（　{x.group(1)}　）</span>', t)
    t = re.sub(r'\{c(\d)\}', lambda x: f'<span class="blank">（　{CIRC[int(x.group(1)) - 1]}　）</span>', t)
    t = re.sub(r'\{s(\d+)(?::([a-z]))?\}',
               lambda x: f'<span class="blank">({x.group(1)}) {x.group(2) or ""}<span class="sline"></span></span>', t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'//(.+?)//', r'<i>\1</i>', t)
    return t.replace('{br}', '<br>')


def plain(s):
    t = re.sub(r'\{u\d\|(.+?)\}', r'\1', s)
    t = re.sub(r'\{b[A-Z]\}|\{c\d\}|\{s\d+(?::[a-z])?\}', ' ', t)
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
            '解答時間は 120 分。時間の目安は，Ⅰ 45 分，Ⅱ 40 分，Ⅲ 30 分，見直し 5 分。',
            '大問はⅠ〜Ⅲの 3 題。200 点満点（Ⅰ 65 点・Ⅱ 65 点・Ⅲ-1 30 点・Ⅲ-2 40 点）。小問の配点は編集部の想定である。',
            'Ⅰは設問も英語で書かれている。英語で答える問題は，指示された語数を守ること。',
            '答えは巻末の 3 枚の解答用紙（大問ごとに 1 枚・切り取り可）の決められた欄に書くこと。',
            '英文はすべて編集部が新しく作ったもので，人物・団体・地名・調査・数値はすべて架空である。',
        ]
    else:
        notes = [
            '各大問の最初に解答一覧と配点（小問は編集部の想定）をまとめた。',
            '日本語・英語で書く問題の解答は一例である。「採点の目安」の要素がそろっていれば，表現が違っても得点としてよい。',
            'Ⅰ・Ⅱには全訳と語句をつけた。答え合わせのあと，根拠になる段落をもう一度読み直すこと。',
            'Ⅲ-2 は解答例を 2 つずつ示し，メールで使える決まった言い方と間違えやすい点を書いた。',
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


def head(label, name, pts, suffix=''):
    return f'<h2 class="part"><span class="pnum">{label}</span>{name}{suffix}（配点 {pts}）</h2>'


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
        return f'<div class="cgrid c{cols}">' + ''.join(f'<span><span class="sl">{e(c[0])}</span> {m(c[1])}</span>' for c in ch) + '</div>'
    return '<ol class="choices ind">' + ''.join(f'<li><span class="cl">{e(c[0])}.</span> {m(c[1])}</li>' for c in ch) + '</ol>'


def question(q):
    body = f'<div>{m(q["stem"])}</div>'
    t = q['type']
    if q.get('frame'):
        body += f'<div class="frame">{m(q["frame"])}</div>'
    if t == 'mc':
        body += choice_list(q['choices'], q.get('cols'))
    elif t == 'tf':
        body += '<ol class="tfl">' + ''.join(f'<li><span class="cl">({i})</span> {m(s)}</li>'
                                             for i, (s, _) in enumerate(q['items'], 1)) + '</ol>'
    elif t == 'order':
        body += '<ol class="choices ind">' + ''.join(f'<li><span class="cl">{e(k)}.</span> {m(s)}</li>' for k, s in q['items']) + '</ol>'
    return f'<div class="q"><span class="qk">{e(q["label"])}</span><div class="qbody">{body}</div></div>'


def part_read(R, k):
    P = R[f'P{k}']
    name = '読解問題（設問・解答とも英語）' if k == 1 else '読解問題'
    return page(head('Ⅰ' if k == 1 else 'Ⅱ', name, P['points']) + f'<p class="lead">{m(P["lead"])}</p>' + passage(P)
                + f'<p class="qhead">{"Questions" if k == 1 else "設　問"}</p>' + ''.join(question(q) for q in P['questions']), 'flow')


def conv_html(lines):
    return '<table class="conv">' + ''.join(f'<tr><th>{e(s)}:</th><td>{m(t)}</td></tr>' for s, t in lines) + '</table>'


def mail_html(M, slots=False):
    hd = ''.join(f'<p class="mh"><b>{k}:</b> {e(M[k.lower()])}</p>' for k in ('From', 'To', 'Subject'))
    body = ''.join(f'<p>{m(p)}</p>' for p in M['body'])
    return f'<div class="mail">{hd}<div class="mb">{body}</div></div>'


def part_3(R):
    A, B = R['P31'], R['P32']
    body = head('Ⅲ-1', '英語表現', A['points']) + f'<p class="lead">{m(A["lead"])}</p>'
    body += f'<div class="art"><p class="art-t">{e(A["article"]["title"])}</p>' + ''.join(
        f'<p class="en">{m(p)}</p>' for p in A['article']['paras']) + '</div>'
    if A['article'].get('notes'):
        body += '<p class="small">' + '　'.join(f'<i>{e(w)}</i>：{e(j)}' for w, j in A['article']['notes']) + '</p>'
    body += '<p class="ptitle">Conversation</p>' + conv_html(A['conversation'])
    body += '<div class="pbreak"></div>' + head('Ⅲ-2', '英語表現', B['points']) + f'<p class="lead">{m(B["lead"])}</p>'
    body += '<ol class="instr">' + ''.join(f'<li><span class="cl">{CIRC[i]}</span> {m(s)}</li>' for i, s in enumerate(B['instructions'])) + '</ol>'
    body += '<p class="ptitle">(A)</p>' + mail_html(B['mail_a']) + '<p class="ptitle">(B)</p>' + mail_html(B['mail_b'])
    return page(body, 'flow')


# ───────── 解答用紙 ─────────

def sheet_head(R, k):
    return (f'<div class="sh-head"><span class="sh-t">解答用紙</span><span class="sh-s">予想問題 第{R["n"]}回 英語　{k}枚目／3枚</span>'
            f'<span class="sh-name">受験番号　　　　　　　氏名</span></div>')


def lines(n, cls='ln ln4'):
    return ''.join(f'<div class="{cls}"></div>' for _ in range(n))


def ast(labels, cls='ast'):
    th = ''.join(f'<th>{e(x)}</th>' for x in labels)
    td = ''.join('<td></td>' for _ in labels)
    return f'<table class="{cls}"><tr>{th}</tr><tr>{td}</tr></table>'


SMALL = ('mc',)


def sheet_field(q):
    t = q['type']
    if t == 'mc':
        return ast(['記号'])
    if t == 'tf':
        return ast([f'({i})　T ・ F' for i in range(1, len(q['items']) + 1)], 'ast tf')
    if t == 'fill':
        return ast([f'({i})' for i in range(1, len(q['answers']) + 1)], 'ast wide')
    if t == 'jafill':
        return ast([CIRC[i] for i in range(len(q['answers']))], 'ast wide')
    if t == 'order':
        return ast(['→'.join(['　'] * len(q['items']))], 'ast wide')
    if t == 'en':
        return lines(q.get('lines', 1))
    return lines(q.get('lines', 3))


SCORE = '<div class="score">得　点<div></div></div>'


def sheet_read(R, k):
    P = R[f'P{k}']
    body = sheet_head(R, k) + f'<p><span class="bignum">{"Ⅰ" if k == 1 else "Ⅱ"}</span></p>'
    small = []
    for q in P['questions']:
        if q['type'] in SMALL:
            small.append(f'<div><p class="sq">{e(q["label"])}</p>{sheet_field(q)}</div>')
            continue
        if small:
            body += '<div class="sqrow">' + ''.join(small) + '</div>'
            small = []
        body += f'<p class="sq">{e(q["label"])}</p>' + sheet_field(q)
    if small:
        body += '<div class="sqrow">' + ''.join(small) + '</div>'
    return body + SCORE


def sheets(R):
    s = [sheet_read(R, k) for k in (1, 2)]
    s3 = sheet_head(R, 3) + '<p><span class="bignum">Ⅲ-1</span></p>'
    s3 += '<table class="fill6">' + ''.join(
        f'<tr><th>{CIRC[i]}</th><td></td><th>{CIRC[i + 1]}</th><td></td></tr>' for i in range(0, len(R['P31']['answers']), 2)) + '</table>'
    s3 += '<p><span class="bignum">Ⅲ-2</span></p>'
    for i in range(len(R['P32']['instructions'])):
        s3 += f'<p class="sq">{CIRC[i]}</p>' + lines(2)
    s.append(s3 + SCORE)
    return ''.join(page(x, 'sheet') for x in s)


def colophon(R, kind):
    return page(f'''
<h2 class="colh">奥　付</h2>
<table class="col">
<tr><th>書名</th><td>国公立2次 予想問題 第{R['n']}回 英語 {'問題' if kind == 'q' else '解答・解説'}</td></tr>
<tr><th>想定</th><td>{UNIV} 一般選抜 前期日程（個別学力検査「外国語（英語）」・全学部共通）の出題形式に準拠</td></tr>
<tr><th>構成</th><td>Ⅰ 読解（設問・解答とも英語）／Ⅱ 読解（設問は日本語）／Ⅲ-1 会話文の空所補充・Ⅲ-2 メールの英作文／120 分／200 点（65・65・30・40。小問の配点は編集部の想定）</td></tr>
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


def wcount(text):
    return len(re.findall(r"[A-Za-z0-9'’.%-]*[A-Za-z0-9]", text))


def words_of(s):
    return re.findall(r"[a-z0-9]+(?:['’][a-z]+)?", s.lower())


def check_q(q, P):
    text = ' '.join(P['passage'])
    pw = set(words_of(plain(text)))
    lab = q['label']
    if q.get('ref'):
        assert f'{{u{q["ref"]}|' in text, ('下線部が本文にない', lab, q['ref'])
    t = q['type']
    if t == 'mc':
        assert q['answer'] in [c[0] for c in q['choices']], ('mc', lab)
    elif t == 'en':
        for a in q['answers']:
            if q.get('limit'):
                assert wcount(a) <= q['limit'], ('語数オーバー', lab, a)
            if q.get('from_text'):
                miss = [w for w in words_of(a) if w not in pw]
                assert not miss, ('本文にない語', lab, miss)
        assert sum(p for _, p in q['criteria']) == q['points'], ('en criteria', lab)
    elif t == 'fill':
        n = len(re.findall(r'\{s\d+(?::[a-z])?\}', q['frame']))
        assert n == len(q['answers']), ('fill 数', lab, n, len(q['answers']))
        for i, (mm, a) in enumerate(zip(re.findall(r'\{s(\d+)(?::([a-z]))?\}', q['frame']), q['answers'])):
            assert int(mm[0]) == i + 1, ('fill 番号', lab)
            assert len(a.split()) == 1, ('fill 1語', lab, a)
            if mm[1]:
                assert a.lower().startswith(mm[1]), ('頭文字', lab, a)
            if q.get('from_text'):
                assert a.lower() in pw, ('本文にない語', lab, a)
    elif t == 'tf':
        assert all(v in ('T', 'F') for _, v in q['items']), ('tf', lab)
        vs = [v for _, v in q['items']]
        assert 'T' in vs and 'F' in vs, ('tf 偏り', lab)
    elif t == 'jafill':
        n = len(re.findall(r'\{c\d\}', q['frame']))
        assert n == len(q['answers']), ('jafill 数', lab, n, len(q['answers']))
    elif t == 'order':
        keys = [k for k, _ in q['items']]
        assert sorted(q['answer']) == sorted(keys) and q['answer'] != ''.join(keys), ('order', lab)
    elif t == 'ja':
        assert sum(p for _, p in q['criteria']) == q['points'], ('ja criteria', lab)
        if q.get('limit'):
            assert len(re.sub(r'\s', '', q['answer'])) <= q['limit'], ('字数オーバー', lab)
    else:
        raise AssertionError(('unknown type', t))


def short_answer(q):
    t = q['type']
    if t == 'mc':
        return q['answer']
    if t == 'tf':
        return '　'.join(f'({i}) {v}' for i, (_, v) in enumerate(q['items'], 1))
    if t == 'fill':
        return '　'.join(f'({i}) {a}' for i, a in enumerate(q['answers'], 1))
    if t == 'jafill':
        return '　'.join(f'{CIRC[i]} {a}' for i, a in enumerate(q['answers']))
    if t == 'order':
        return ' → '.join(q['answer'])
    if t == 'en':
        return q['answers'][0]
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
    wc = wcount(plain(' '.join(P['passage'])))
    assert PASSAGE_WORDS[0] <= wc <= PASSAGE_WORDS[1], (f'P{k} 本文の語数', wc)
    assert len(P['translation']) == len(P['passage']), (f'P{k} 全訳の段落数', len(P['translation']), len(P['passage']))
    qs = P['questions']
    for q in qs:
        check_q(q, P)
    rows = [(q['label'], short_answer(q), q['points']) for q in qs]
    assert sum(r[2] for r in rows) == P['points'], (f'P{k} points', sum(r[2] for r in rows))
    body = head('Ⅰ' if k == 1 else 'Ⅱ', '読解問題', P['points'], ' — 解答・解説') + f'<p class="small">本文 {wc} 語</p><p class="ah">解答一覧</p>' + akey_table(rows)
    for q in qs:
        body += f'<h3 class="aq"><span class="qk">{e(q["label"])}</span>{e(q["kind"])}（{q["points"]}点）</h3>'
        if q['type'] == 'ja':
            body += f'<p class="ans">【解答例】{m(q["answer"])}</p>'
        elif q['type'] == 'en':
            body += '<p class="ans">【解答例】' + ' ／ '.join(m(a) for a in q['answers']) + '</p>'
        else:
            body += f'<p class="ans">【解答】{m(short_answer(q))}</p>'
        if q.get('expl'):
            body += f'<p class="expl">{m(q["expl"])}</p>'
        if q.get('criteria'):
            body += crit(q)
    body += full_translation(P)
    return page(body, 'flow')


def a_part_3(R):
    A, B = R['P31'], R['P32']
    n_blank = sum(len(re.findall(r'\{c\d\}', t)) for _, t in A['conversation'])
    assert n_blank == len(A['answers']) == len(A['expl']), ('Ⅲ-1 空所の数', n_blank, len(A['answers']), len(A['expl']))
    assert all(isinstance(a, list) and a for a in A['answers'])
    pts = A['points'] // len(A['answers'])
    assert pts * len(A['answers']) == A['points'], ('Ⅲ-1 points',)
    rows = [(CIRC[i], ' ／ '.join(a), pts) for i, a in enumerate(A['answers'])]
    body = head('Ⅲ-1', '英語表現', A['points'], ' — 解答・解説') + '<p class="ah">解答一覧（／ は別解）</p>' + akey_table(rows)
    body += '<ul class="tips">' + ''.join(f'<li><b>{CIRC[i]}</b>　{m(x)}</li>' for i, x in enumerate(A['expl'])) + '</ul>'
    body += '<p class="ah">会話の訳</p>' + ''.join(f'<p class="trp">{m(t)}</p>' for t in A['conversation_ja'])
    body += '<p class="ah">記事の訳</p>' + ''.join(f'<p class="trp">{m(t)}</p>' for t in A['article_ja'])

    n_slot = sum(len(re.findall(r'\{c\d\}', t)) for t in B['mail_b']['body'])
    assert n_slot == len(B['instructions']) == len(B['slots']), ('Ⅲ-2 欄の数', n_slot, len(B['instructions']), len(B['slots']))
    assert sum(sum(p for _, p in s['criteria']) for s in B['slots']) == B['points'], ('Ⅲ-2 points',)
    body += '<div class="pbreak"></div>' + head('Ⅲ-2', '英語表現', B['points'], ' — 解答・解説')
    for i, (ins, s) in enumerate(zip(B['instructions'], B['slots'])):
        assert len(s['models']) == 2, ('Ⅲ-2 models', i)
        sp = sum(p for _, p in s['criteria'])
        body += f'<h3 class="aq"><span class="qk">{CIRC[i]}</span>{e(ins)}（{sp}点）</h3>'
        body += ''.join(f'<p class="ans">【解答例{j}】{m(t)}</p>' for j, t in enumerate(s['models'], 1))
        body += '<ul class="tips">' + ''.join(f'<li>{m(t)}</li>' for t in s['tips']) + '</ul>' + crit(s)
    filled = [re.sub(r'\{c(\d)\}', lambda x: f'**{B["slots"][int(x.group(1)) - 1]["models"][0]}**', p) for p in B['mail_b']['body']]
    body += '<p class="ah">完成したメール（B）の例（解答例1を入れたもの）</p><div class="mail"><div class="mb">' + ''.join(f'<p>{m(p)}</p>' for p in filled) + '</div></div>'
    body += '<p class="ah">メール（B）の訳</p>' + ''.join(f'<p class="trp">{m(t)}</p>' for t in B['mail_b_ja'])
    return page(body, 'flow')


def build(R, kind, ranges):
    if kind == 'q':
        parts = (cover(R, 'q', ranges) + part_read(R, 1) + part_read(R, 2) + part_3(R) + sheets(R) + colophon(R, 'q'))
    else:
        parts = (cover(R, 'a', ranges) + a_part_read(R, 1) + a_part_read(R, 2) + a_part_3(R) + colophon(R, 'a'))
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
    assert sum(R[k]['points'] for k in POINTS) == 200
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
    dest = ROOT / 'public' / 'prints' / f'print_lr_niji_yamaguchi_en_{n}.pdf'
    subprocess.run(['pdfunite', str(q), str(a), str(dest)], check=True)
    print(f'第{n}回: 問題 {last}p（解答用紙 {qr[2]}〜{qr[3]}）・解答解説 {ar[1] + 1}p → {dest.relative_to(ROOT)} {dest.stat().st_size // 1024}KB')


if __name__ == '__main__':
    sys.path.insert(0, str(HERE))
    arg = sys.argv[1] if len(sys.argv) > 1 else 'all'
    for k in ([1, 2, 3] if arg == 'all' else [int(arg)]):
        render(k)
