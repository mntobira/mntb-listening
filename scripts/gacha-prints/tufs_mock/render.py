# -*- coding: utf-8 -*-
"""東京外国語大学 一般選抜（前期日程）対策 英語 予想問題 — 紙面づくり（2026-11-03）

  python3 scripts/gacha-prints/tufs_mock/render.py 1      # 第1回（r1.py のデータ）
  python3 scripts/gacha-prints/tufs_mock/render.py all    # 第1〜3回
→ .tmpwork/tufs/予想問題_東京外国語大学_英語_第N回_{問題,解答解説}.pdf と public/prints/print_lr_niji_tufs_en_N.pdf

紙面は fwu_mock と同じ試験冊子の形（表紙 → 大問1〜5 → 解答用紙5枚 → 奥付 ／ 解答・解説編）。
参考にしたのは公開されている出題の形と配点だけ（120分・250点。1 約1000語の長文・下線部を40〜70字の日本語で説明6問
／2 約600語の長文・語群から選び必要なら形を変えて空所10／3 講義を1回聞いて3択8問／4 インタビューを1回聞いて3択8問
／5 ワークシートを見ながら講義を2回聞き、150語程度の要約と200語程度の意見文）。英文・設問・原稿・解答はすべて書き下ろしで、
過去問の英文・放送原稿・解答例は引用していない。リスニングは音声をつけず、解答・解説編の「読み上げ原稿」を人に読んでもらう。
"""
import html, importlib, math, re, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
OUT = ROOT / '.tmpwork' / 'tufs'
UNIV = '東京外国語大学'
DISCLAIMER = f'{UNIV}の過去問・公式問題ではありません。予想問題であり、大学とは関係がありません。'
PART_NAMES = {1: '長文読解（日本語で説明）', 2: '長文読解（語形を変えて補う）', 3: 'リスニング（講義）',
              4: 'リスニング（インタビュー）', 5: 'リスニング（講義の要約と意見）'}
KEYS = ('P1', 'P2', 'P3', 'P4', 'P5')
POINTS = {'P1': 60, 'P2': 30, 'P3': 40, 'P4': 40, 'P5': 80}
WORDS = {'P1': (850, 1150), 'P2': (520, 760), 'P3': (560, 820), 'P4': (500, 760), 'P5': (420, 620)}
SUMMARY_WORDS = (130, 170)   # 150語程度
OPINION_WORDS = (180, 220)   # 200語程度
PLAYS = {3: 1, 4: 1, 5: 2}


def e(s):
    return html.escape(str(s), quote=False)


def m(s):
    """{u1|…} 下線＋(1)、{b1} 空所（ 1 ）、{w} ワークシートの空欄、**…** 太字、//…// 斜体、{br} 改行"""
    t = e(s)
    t = re.sub(r'\{u([0-9])\|(.+?)\}',
               lambda x: f'<span class="ul"><span class="ulab">({x.group(1)})</span>{x.group(2)}</span>', t)
    t = re.sub(r'\{b([0-9]+)\}', lambda x: f'<span class="blank">（　{x.group(1)}　）</span>', t)
    t = t.replace('{w}', '<span class="wblank">（　　　　　　）</span>')
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'//(.+?)//', r'<i>\1</i>', t)
    return t.replace('{br}', '<br>')


def plain(s):
    t = re.sub(r'\{u[0-9]\|(.+?)\}', r'\1', s)
    t = re.sub(r'\{b[0-9]+\}', ' ', t)
    return re.sub(r'\*\*|//|\{br\}|\{w\}', ' ', t)


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
            '解答時間は 120 分。大問は 1〜5 の 5 題で，250 点満点（1 は 60 点・2 は 30 点・3 は 40 点・4 は 40 点・5 は 80 点）。',
            '3・4・5 はリスニング。この冊子には音声がついていない。解答・解説編の最後にある「読み上げ原稿」を，家族や先生などに読んでもらうこと（読み上げは 3・4 が 1 回，5 が 2 回）。',
            'リスニングは試験の途中にまとめて行う（目安：開始から 80 分後に 20 分間）。その前後の時間で 1・2 と 5 の英作文を進める。',
            '答えは巻末の 5 枚の解答用紙の決められた欄に書くこと。マス目の欄は 1 マスに 1 字。句読点も 1 字に数え，英字・数字は 1 マスに 2 字まで。',
            '英文・放送原稿はすべて編集部が新しく作ったもので，人物・団体・地名・調査・数値はすべて架空である。',
        ]
    else:
        notes = [
            '各大問の最初に解答一覧と配点をまとめた。大問ごとの配点は，大学が公表している配点の形にならった。',
            '日本語・英語で書く問題の解答は一例である。「採点の目安」の要素がそろっていれば，表現が違っても得点としてよい。',
            '1・2 には全訳と語句，3〜5 には放送原稿の訳をつけた。',
            '巻末の「読み上げ原稿」は，解く人に見せずに，読む人だけが開くこと。',
        ]
    lis = ''.join(f'<li>{e(x)}</li>' for x in notes)
    return page(f'''
<div class="cv-head">{logo()}<span>学習アプリ マナトビ ｜ 国公立2次 予想問題</span></div>
<div class="cv-main">
  <p class="cv-round">予想問題 第{R['n']}回</p>
  <p class="cv-subject">英　　　語</p>
  <p class="cv-sub">（ 120 分 ・ 250 点 ・ リスニングを含む ）</p>
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
    paras = ''.join(f'<p class="en">{m(p)}</p>' for p in P['passage'])
    notes = ''
    if P.get('notes'):
        notes = '<table class="notes"><tr><th>注</th><td>' + '　'.join(
            f'<span class="note"><i>{e(w)}</i>　{e(j)}</span>' for w, j in P['notes']) + '</td></tr></table>'
    return title + paras + notes


def choice_list(ch):
    return '<ol class="choices ind">' + ''.join(f'<li><span class="cl">{e(c[0])}.</span>{m(c[1])}</li>' for c in ch) + '</ol>'


def part_1(R):
    P = R['P1']
    qs = ''.join(f'<div class="q"><span class="qk">{e(q["label"])}</span><div class="qbody">{m(q["stem"])}</div></div>'
                 for q in P['questions'])
    return page(part_head(1, P) + f'<p class="lead">{m(P["lead"])}</p>' + passage(P)
                + f'<p class="qhead">【設問】</p><p>{m(P["qlead"])}</p>' + qs, 'flow')


def part_2(R):
    P = R['P2']
    bank = '<div class="bank">' + '　'.join(e(w) for w in P['bank']) + '</div>'
    return page(part_head(2, P) + f'<p class="lead">{m(P["lead"])}</p>' + passage(P)
                + f'<p class="qhead">【設問】</p><p>{m(P["qlead"])}</p>' + bank, 'flow')


def listening_qs(P):
    return ''.join(f'<div class="q"><span class="qk">{e(q["label"])}</span><div class="qbody">{m(q["stem"])}{choice_list(q["choices"])}</div></div>'
                   for q in P['questions'])


def part_3(R, k):
    P = R[f'P{k}']
    return page(part_head(k, P) + f'<p class="lead">{m(P["lead"])}</p>' + listening_qs(P), 'flow')


def part_5(R):
    P = R['P5']
    ws = (f'<div class="wsheet"><p class="ws-t">{e(P["ws_title"])}</p>'
          + ''.join(f'<p class="ws-l">{m(x)}</p>' for x in P['worksheet']) + '</div>')
    S, O = P['summary'], P['opinion']
    qs = (f'<p class="qhead">【設問】</p>'
          f'<div class="q"><span class="qk">設問1</span><div class="qbody">{m(S["stem"])}（{S["points"]}点）</div></div>'
          f'<div class="q"><span class="qk">設問2</span><div class="qbody">{m(O["stem"])}（{O["points"]}点）'
          f'<div class="topic">{m(O["question"])}</div></div></div>')
    return page(part_head(5, P) + f'<p class="lead">{m(P["lead"])}</p>' + ws + qs, 'flow')


# ───────── 解答用紙 ─────────

def sheet_head(R, k, total=5):
    return (f'<div class="sh-head"><span class="sh-t">解答用紙</span><span class="sh-s">予想問題 第{R["n"]}回 英語　{k}枚目／{total}枚</span>'
            f'<span class="sh-name">受験番号　　　　　　　氏名</span></div>')


def lines(n, cls='ln ln4'):
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


SCORE = '<div class="score">得　点<div></div></div>'


def sheets(R):
    s = []
    b = sheet_head(R, 1) + '<p><span class="bignum">1</span></p>'
    for q in R['P1']['questions']:
        b += f'<p class="sq">{e(q["label"])}<span class="lim">（{q["limit"]}字以内）</span></p>' + genko(math.ceil(q['limit'] / 20) * 20)
    s.append(b + SCORE)
    labs = [f'({x["n"]})' for x in R['P2']['blanks']]
    s.append(sheet_head(R, 2) + '<p><span class="bignum">2</span></p>' + ast(labs[:5], 'ast wide') + ast(labs[5:], 'ast wide') + SCORE)
    b = sheet_head(R, 3)
    for k in (3, 4):
        b += f'<p><span class="bignum">{k}</span></p>' + ast([q['label'] for q in R[f'P{k}']['questions']])
    s.append(b + SCORE)
    s.append(sheet_head(R, 4) + '<p><span class="bignum">5</span>設問1（150語程度）<span class="wc">語数　　　　語</span></p>' + lines(17) + SCORE)
    s.append(sheet_head(R, 5) + '<p><span class="bignum">5</span>設問2（200語程度）<span class="wc">語数　　　　語</span></p>' + lines(21) + SCORE)
    return ''.join(page(x, 'sheet') for x in s)


def colophon(R, kind):
    return page(f'''
<h2 class="colh">奥　付</h2>
<table class="col">
<tr><th>書名</th><td>国公立2次 予想問題 第{R['n']}回 英語 {'問題' if kind == 'q' else '解答・解説'}</td></tr>
<tr><th>想定</th><td>{UNIV} 一般選抜 前期日程（個別テスト「英語」・言語文化学部／国際社会学部／国際日本学部 共通）の出題形式に準拠。英語スピーキング試験は含まない</td></tr>
<tr><th>構成</th><td>大問 1〜5（長文読解 2 題・リスニング 3 題）／120 分／250 点（60・30・40・40・80）</td></tr>
<tr><th>音声</th><td>なし（解答・解説編の「読み上げ原稿」を人が読む）</td></tr>
<tr><th>編集・作成</th><td>学習アプリ マナトビ 編集部（{R.get('date', '2026年11月')}）</td></tr>
</table>
<div class="disc"><b>{e(DISCLAIMER)}</b><br><span>英文・設問・放送原稿・解答・解説はすべて編集部の書き下ろしです。実際の試験の問題文・放送原稿・解答例の文章は引用していません。</span></div>
<p class="small">本冊子の無断転載・複製を禁じます。学習アプリ マナトビの利用者が個人の学習に使う範囲でご利用ください。</p>
''', 'colophon')


# ───────── 検査 ─────────

def wcount(text):
    return len(re.findall(r"[A-Za-z0-9'’.%-]*[A-Za-z0-9]", text))


def jlen(s):
    return len(re.sub(r'\s', '', s))


def script_text(P):
    return ' '.join(x if isinstance(x, str) else x[1] for x in P['script'])


def check(R):
    for k, v in POINTS.items():
        assert R[k]['points'] == v, (k, R[k]['points'])
    for k in ('P1', 'P2'):
        P = R[k]
        wc = wcount(plain(' '.join(P['passage'])))
        assert WORDS[k][0] <= wc <= WORDS[k][1], (k, '本文の語数', wc)
        assert len(P['translation']) == len(P['passage']), (k, '全訳の段落数')
    P = R['P1']
    text = ' '.join(P['passage'])
    assert len(P['questions']) == 6 and sum(q['points'] for q in P['questions']) == 60, 'P1 設問'
    for q in P['questions']:
        assert f'{{u{q["ref"]}|' in text, ('P1 下線部が本文にない', q['label'])
        assert jlen(q['answer']) <= q['limit'], ('P1 字数オーバー', q['label'], jlen(q['answer']), q['limit'])
        assert jlen(q['answer']) >= q['limit'] * 0.6, ('P1 解答例が短すぎる', q['label'], jlen(q['answer']))
        assert sum(p for _, p in q['criteria']) == q['points'], ('P1 criteria', q['label'])
    P = R['P2']
    text = ' '.join(P['passage'])
    assert len(P['bank']) == 11 and len(set(P['bank'])) == 11, 'P2 語群は11語'
    assert len(P['blanks']) == 10 and P['points'] == 30, 'P2 空所10'
    bases = [b['base'] for b in P['blanks']]
    assert len(set(bases)) == 10 and all(x in P['bank'] for x in bases), ('P2 語群の使い方', bases)
    for b in P['blanks']:
        assert text.count(f'{{b{b["n"]}}}') == 1, ('P2 空所', b['n'])
        assert b['answer'].lower().startswith(b['base'][:3].lower()) or b.get('irregular'), ('P2 語形', b['answer'])
    assert sum(1 for b in P['blanks'] if b['answer'] != b['base']) >= 4, 'P2 形を変える空所が少ない'
    for k in (3, 4):
        P = R[f'P{k}']
        wc = wcount(plain(script_text(P)))
        assert WORDS[f'P{k}'][0] <= wc <= WORDS[f'P{k}'][1], (k, '原稿の語数', wc)
        assert len(P['questions']) == 8 and sum(q['points'] for q in P['questions']) == 40, (k, '設問')
        for q in P['questions']:
            assert [c[0] for c in q['choices']] == ['a', 'b', 'c'] and q['answer'] in 'abc', (k, q['label'])
        assert len({q['answer'] for q in P['questions']}) == 3, (k, '答えが偏っている')
        assert len(P['script_ja']) == len(P['script']), (k, '原稿の訳の段落数')
    P = R['P5']
    wc = wcount(plain(script_text(P)))
    assert WORDS['P5'][0] <= wc <= WORDS['P5'][1], ('P5 原稿の語数', wc)
    assert len(P['script_ja']) == len(P['script']), 'P5 原稿の訳'
    nb = sum(x.count('{w}') for x in P['worksheet'])
    assert nb == len(P['ws_answers']) and nb >= 5, ('P5 ワークシートの空欄', nb, len(P['ws_answers']))
    for key, (lo, hi) in (('summary', SUMMARY_WORDS), ('opinion', OPINION_WORDS)):
        X = P[key]
        assert sum(p for _, p in X['criteria']) == X['points'] == 40, ('P5', key)
        for t, txt in X['models']:
            assert lo <= wcount(txt) <= hi, ('P5 解答例の語数', key, t, wcount(txt))
    assert sum(R[k]['points'] for k in KEYS) == 250


# ───────── 解答・解説編 ─────────

def crit(q, title='採点の目安'):
    total = sum(p for _, p in q['criteria'])
    items = ''.join(f'<li>{m(t)}（{p:g}点）</li>' for t, p in q['criteria'])
    return f'<div class="crit"><p class="crit-h">{title}（{total:g}点）</p><ul>{items}</ul></div>'


def akey_table(rows):
    body = ''.join(f'<tr><td>{e(a)}</td><td>{m(b)}</td><td class="pt">{c:g}</td></tr>' for a, b, c in rows)
    total = sum(c for _, _, c in rows)
    return f'<table class="akey"><tr><th>設問</th><th>解答</th><th>配点</th></tr>{body}<tr class="sum"><td>合計</td><td></td><td class="pt">{total:g}</td></tr></table>'


def full_translation(P):
    tr = ''.join(f'<p class="trp">{m(t)}</p>' for t in P['translation'])
    vocab = ''
    if P.get('vocab'):
        vocab = '<p class="ah">語句</p><div class="vocab">' + ''.join(
            f'<span class="vw"><i>{e(w)}</i>　{e(j)}</span>' for w, j in P['vocab']) + '</div>'
    return f'<p class="ah">全訳</p>{tr}{vocab}'


def a_part_1(R):
    P = R['P1']
    rows = [(q['label'], '解答例を参照', q['points']) for q in P['questions']]
    body = part_head(1, P, ' — 解答・解説') + '<p class="ah">配点</p>' + akey_table(rows)
    for q in P['questions']:
        body += (f'<h3 class="aq"><span class="qk">{e(q["label"])}</span>{e(q["kind"])}（{q["points"]}点）</h3>'
                 f'<p class="ans">【解答例】{m(q["answer"])}<span class="lim">（{jlen(q["answer"])}字／{q["limit"]}字以内）</span></p>')
        if q.get('expl'):
            body += f'<p class="expl">{m(q["expl"])}</p>'
        body += crit(q)
    return page(body + full_translation(P), 'flow')


def a_part_2(R):
    P = R['P2']
    rows = [(f'({b["n"]})', f'{b["answer"]}' + (f'（← {b["base"]}）' if b['answer'] != b['base'] else ''), 3) for b in P['blanks']]
    unused = [w for w in P['bank'] if w not in {b['base'] for b in P['blanks']}]
    body = part_head(2, P, ' — 解答・解説') + '<p class="ah">解答一覧</p>' + akey_table(rows)
    body += f'<p class="small">使わない語：{e("・".join(unused))}</p><p class="ah">解説</p>'
    body += ''.join(f'<p class="subexp"><b>({b["n"]}) {e(b["answer"])}</b>　{m(b["expl"])}</p>' for b in P['blanks'])
    return page(body + full_translation(P), 'flow')


def script_html(P, ja=False):
    src = P['script_ja'] if ja else P['script']
    out = ''
    for x in src:
        if isinstance(x, str):
            out += f'<p class="{"trp" if ja else "en script"}">{m(x)}</p>'
        else:
            out += f'<p class="{"trp" if ja else "en script"}"><b>{e(x[0])}：</b>{m(x[1])}</p>'
    return out


def a_listen(R, k):
    P = R[f'P{k}']
    rows = [(q['label'], q['answer'], q['points']) for q in P['questions']]
    body = part_head(k, P, ' — 解答・解説') + '<p class="ah">解答一覧</p>' + akey_table(rows) + '<p class="ah">解説</p>'
    body += ''.join(f'<p class="subexp"><b>{e(q["label"])} {e(q["answer"])}</b>　{m(q["expl"])}</p>' for q in P['questions'])
    body += f'<p class="ah">放送原稿の訳（原稿は巻末の「読み上げ原稿」）</p>' + script_html(P, ja=True)
    if P.get('vocab'):
        body += '<p class="ah">語句</p><div class="vocab">' + ''.join(f'<span class="vw"><i>{e(w)}</i>　{e(j)}</span>' for w, j in P['vocab']) + '</div>'
    return page(body, 'flow')


def a_part_5(R):
    P = R['P5']
    S, O = P['summary'], P['opinion']
    body = part_head(5, P, ' — 解答・解説')
    body += '<p class="ah">ワークシートの空欄（参考・採点しない）</p><p>' + '　'.join(f'{i}. {e(a)}' for i, a in enumerate(P['ws_answers'], 1)) + '</p>'
    for key, X, n in (('summary', S, 1), ('opinion', O, 2)):
        body += f'<h3 class="aq"><span class="qk">設問{n}</span>{"要約" if n == 1 else "意見文"}（{X["points"]}点）</h3>'
        body += crit(X)
        body += '<p class="ah">書き方のポイント</p><ul class="tips">' + ''.join(f'<li>{m(t)}</li>' for t in X['tips']) + '</ul>'
        for j, (title, txt) in enumerate(X['models'], 1):
            body += f'<p class="ah">解答例{j}　{e(title)}（{wcount(txt)}語）</p><div class="model-en">' + ''.join(f'<p>{m(p)}</p>' for p in txt.split('\n')) + '</div>'
        body += '<p class="ah">解答例1の訳</p>' + ''.join(f'<p class="trp">{m(t)}</p>' for t in X['model_ja'])
    body += '<p class="ah">放送原稿の訳（原稿は巻末の「読み上げ原稿」）</p>' + script_html(P, ja=True)
    return page(body, 'flow')


def reader(R):
    body = ('<h2 class="part"><span class="pnum">★</span>読み上げ原稿（読む人だけが開くこと）</h2>'
            '<div class="reader"><p class="crit-h">読む人へ</p><p class="small">解く人には問題編の 3・4・5 のページだけを開かせてください。'
            '3 と 4 は 1 回ずつ，5 は 2 回読みます。ふつうの速さ（1 分間に 140〜150 語くらい）で，段落の切れ目では 2 秒ほど間をあけます。'
            '4 は 2 人で読むか，1 人で声の調子を変えて読んでください。3 と 4 は読み終えたあと 1 分，5 は 2 回目のあと 1 分，答えを書く時間をとります。'
            '実際の試験と同じく，リスニングは 3 → 4 → 5 の順に続けて行い，全体で 20 分ほどです。</p></div>')
    for k in (3, 4, 5):
        P = R[f'P{k}']
        body += (f'<p class="ah">{k}　{e(P["title"])}（{PLAYS[k]} 回読む・{wcount(plain(script_text(P)))} 語）</p>'
                 + script_html(P))
    return page(body, 'flow')


def build(R, kind, ranges):
    if kind == 'q':
        parts = (cover(R, 'q', ranges) + part_1(R) + part_2(R) + part_3(R, 3) + part_3(R, 4) + part_5(R)
                 + sheets(R) + colophon(R, 'q'))
    else:
        check(R)
        parts = (cover(R, 'a', ranges) + a_part_1(R) + a_part_2(R) + a_listen(R, 3) + a_listen(R, 4) + a_part_5(R)
                 + reader(R) + colophon(R, 'a'))
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
    dest = ROOT / 'public' / 'prints' / f'print_lr_niji_tufs_en_{n}.pdf'
    subprocess.run(['pdfunite', str(q), str(a), str(dest)], check=True)
    print(f'第{n}回: 問題 {last}p（解答用紙 {qr[2]}〜{qr[3]}）・解答解説 {ar[1] + 1}p → {dest.relative_to(ROOT)} {dest.stat().st_size // 1024}KB')


if __name__ == '__main__':
    sys.path.insert(0, str(HERE))
    arg = sys.argv[1] if len(sys.argv) > 1 else 'all'
    for k in ([1, 2, 3] if arg == 'all' else [int(arg)]):
        render(k)
