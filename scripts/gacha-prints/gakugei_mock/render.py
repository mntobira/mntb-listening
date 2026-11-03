# -*- coding: utf-8 -*-
"""東京学芸大学 前期日程（英語コース）対策 英語 予想問題 — 紙面づくり（2026-10-30）

  python3 scripts/gacha-prints/gakugei_mock/render.py 1      # 第1回（r1.py のデータ）
  python3 scripts/gacha-prints/gakugei_mock/render.py all    # 第1〜3回
→ .tmpwork/gakugei/予想問題_東京学芸大学_英語_第N回_{問題,解答解説}.pdf と public/prints/print_lr_niji_gakugei_en_N.pdf

紙面は 2次試験ガチャの既存の予想問題（名古屋大学・静岡大学）と同じ試験冊子の形：
  表紙（はじめに読むこと・注意書き）→ 大問 → 解答用紙 → 奥付 ／ 解答・解説編も表紙 → 大問ごとの解答・採点の目安・全訳 → 奥付
大問の型（Ⅰ長文読解・Ⅱ英文の日本語要約・Ⅲ和文英訳・Ⅳ200語程度の意見英作文・Ⅴディクテーション）だけを参考にし、
英文・設問・解答はすべて書き下ろし（過去問・解答例・講評の文章は読んでいない・引用していない）。
HTML を作り、Chromium（Playwright）で PDF にする（pdf.mjs）。ページ範囲は2回刷って実物から数える。
"""
import html, importlib, re, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
OUT = ROOT / '.tmpwork' / 'gakugei'
UNIV = '東京学芸大学'
DISCLAIMER = f'{UNIV}の過去問・公式問題ではありません。予想問題であり、大学とは関係がありません。'
ROMAN = {1: 'Ⅰ', 2: 'Ⅱ', 3: 'Ⅲ', 4: 'Ⅳ', 5: 'Ⅴ'}
PART_NAMES = {1: '長文読解', 2: '英文要約', 3: '和文英訳', 4: '自由英作文', 5: 'ディクテーション'}


def e(s):
    return html.escape(str(s), quote=False)


def m(s):
    """{u1|…} 下線＋ラベル (1)、{u|…} 下線だけ、{bA} 空所（ A ）、**…** 太字、[[n]] 段落番号"""
    t = e(s)
    t = re.sub(r'\{u([A-Za-z0-9ア-ン]*)\|(.+?)\}',
               lambda x: (f'<span class="ul"><span class="ulab">({x.group(1)})</span>{x.group(2)}</span>' if x.group(1)
                          else f'<span class="ul">{x.group(2)}</span>'), t)
    t = re.sub(r'\{b([A-Z0-9]+)\}', lambda x: f'<span class="blank">（　{x.group(1)}　）</span>', t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    return t


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
            '解く時間の目安は，筆記 90 分＋ディクテーション約 10 分（全体で約 120 分の試験を想定）。はじめに全体を見渡し，時間の配分を決めてから取り組むこと。',
            '大問はⅠ〜Ⅴの 5 題。各大問の配点は，全体を 100 としたときの割合で，見出しに（配点 ○%）と示した。',
            '解答はすべて巻末の 3 枚の解答用紙に書くこと（切り取って使える）。問題のページの余白は下書きに使ってよい。',
            'Ⅴ（ディクテーション）の音声はついていない。解答・解説編の「読み上げ原稿」を，家族や先生に読んでもらって取り組むこと。1 人で解くときは最後に回し，原稿を見ずに音読を録音して使うとよい。',
            '英文・設問はすべて編集部の書き下ろしで，登場する人物・団体・数値は架空のものである。',
        ]
    else:
        notes = [
            '各大問のはじめに解答一覧と配点を示した。配点は全体を 100 点としたときの点数である。',
            '記述問題の【解答】は一例である。「採点の目安」の要素がそろっていれば，表現が違っても得点としてよい。',
            '長文には全訳と語句をつけた。答え合わせのあとに，下線部の前後をもう一度読み直すこと。',
            'Ⅴの「読み上げ原稿」は，解答・解説編の最後にある。読む人への指示（速さ・回数）もそこに書いた。',
            '自由英作文の解答例は 2 つの立場で示した。どちらの立場でも，理由と具体例が筋道立っていれば評価は同じである。',
        ]
    lis = ''.join(f'<li>{e(x)}</li>' for x in notes)
    return page(f'''
<div class="cv-head">{logo()}<span>学習アプリ マナトビ ｜ 国公立2次 予想問題</span></div>
<div class="cv-main">
  <p class="cv-round">予想問題 第{R['n']}回</p>
  <p class="cv-subject">外　　国　　語</p>
  <p class="cv-sub">英　　語</p>
  <p class="cv-kind">{label}</p>
  <p class="cv-range">{rng}</p>
  <p class="cv-univ">{UNIV} 前期日程 対策（英語コース）</p>
</div>
<div class="cv-notes"><p class="cv-notes-h">はじめに読むこと</p><ol>{lis}</ol></div>
<div class="disc"><b>{e(DISCLAIMER)}</b><br><span>出題の傾向を研究し，編集部が一から書き下ろした演習用の冊子です。</span></div>
<div class="cv-foot"><span>学習アプリ マナトビ 編集部</span><span>第{R['n']}回 ／ {'問題' if kind == 'q' else '解答・解説'}</span></div>
''', 'cover')


def part_head(n, P, suffix=''):
    return f'<h2 class="part"><span class="pnum">{ROMAN[n]}</span>{PART_NAMES[n]}{suffix}（配点 {P["points"]}%）</h2>' if not suffix else \
        f'<h2 class="part"><span class="pnum">{ROMAN[n]}</span>{PART_NAMES[n]}{suffix}（配点 {P["points"]}点）</h2>'


def passage(P):
    title = f'<p class="ptitle">{e(P["title"])}</p>' if P.get('title') else ''
    paras = ''.join(f'<p class="en"><span class="pno">{i + 1}</span>{m(p)}</p>' for i, p in enumerate(P['passage']))
    notes = ''
    if P.get('notes'):
        notes = '<table class="notes"><tr><th>注</th><td>' + '　'.join(
            f'<span class="note"><i>{e(w)}</i>　{e(j)}</span>' for w, j in P['notes']) + '</td></tr></table>'
    return title + paras + notes


def questions(P):
    out = []
    for i, q in enumerate(P['questions'], 1):
        ch = ''
        if q.get('choices'):
            ch = '<ol class="choices">' + ''.join(f'<li><span class="cl">{e(c[0])}</span>{m(c[1])}</li>' for c in q['choices']) + '</ol>'
        out.append(f'<div class="q"><span class="qno">{i}</span><div class="qbody">{m(q["stem"])}{ch}</div></div>')
    return ''.join(out)


def part_I(R):
    P = R['I']
    return page(part_head(1, P) + f'<p class="lead">{m(P["lead"])}</p>' + passage(P) + questions(P), 'flow')


def part_II(R):
    P = R['II']
    return page(part_head(2, P) + f'<p class="lead">{m(P["lead"])}</p>' + passage(P), 'flow')


def part_III(R):
    P = R['III']
    ja = ''.join(f'<p class="ja">{m(p)}</p>' for p in P['japanese'])
    return page(part_head(3, P) + f'<p class="lead">{m(P["lead"])}</p><div class="jabox">{ja}</div>', 'flow')


def part_IV(R):
    P = R['IV']
    return page(part_head(4, P) + f'<p class="lead">{m(P["lead"])}</p><div class="topic">{m(P["topic"])}</div>', 'flow')


def part_V(R):
    P = R['V']
    return page(part_head(5, P) + f'<p class="lead">{m(P["lead"])}</p>', 'flow')


def lines(n, cls='ln'):
    return ''.join(f'<div class="{cls}"></div>' for _ in range(n))


def genko(cells, per_row=20):
    rows = (cells + per_row - 1) // per_row
    out = []
    for r in range(rows):
        cs = ''.join('<span class="gk"></span>' for _ in range(per_row))
        mark = f'<span class="gkn">{(r + 1) * per_row}</span>' if (r + 1) % 5 == 0 else ''
        out.append(f'<div class="gkrow">{cs}{mark}</div>')
    return '<div class="genko">' + ''.join(out) + '</div>'


def sheet_head(R, k):
    return (f'<div class="sh-head"><span class="sh-t">解答用紙</span><span class="sh-s">予想問題 第{R["n"]}回 外国語（英語）　{k}枚目／3枚</span>'
            f'<span class="sh-name">受験番号　　　　　　　氏名</span></div>')


def sheet_q(i, q):
    a = q['sheet']
    if a[0] == 'lines':
        box = lines(a[1])
    elif a[0] == 'box':
        box = '<div class="sbox"></div>'
    elif a[0] == 'boxes':
        box = '<div class="sboxes">' + ''.join(f'<span class="sb"><span>({e(x)})</span><span class="sbb"></span></span>' for x in a[1]) + '</div>'
    else:
        raise ValueError(a)
    return f'<div class="srow"><span class="sno">{i}</span><div class="sbody">{box}</div></div>'


def sheets(R):
    I, II, III, IV, V = (R[k] for k in ('I', 'II', 'III', 'IV', 'V'))
    s1 = sheet_head(R, 1) + '<p class="sp"><span class="pnum">Ⅰ</span></p>' + ''.join(sheet_q(i, q) for i, q in enumerate(I['questions'], 1))
    s2 = (sheet_head(R, 2) + '<p class="sp"><span class="pnum">Ⅱ</span>（250字程度・横書き。句読点も1字に数える）</p>' + genko(II.get('cells', 300))
          + '<p class="sp"><span class="pnum">Ⅲ</span></p>'
          + ''.join(f'<div class="srow"><span class="sno">({e(it["label"])})</span><div class="sbody">{lines(it.get("lines", 4))}</div></div>' for it in III['items']))
    s3 = (sheet_head(R, 3) + '<p class="sp"><span class="pnum">Ⅳ</span>（200語程度）<span class="wc">語数　　　　語</span></p>' + lines(IV.get('lines', 21), 'ln ln4')
          + '<p class="sp"><span class="pnum">Ⅴ</span></p>' + lines(V.get('lines', 5), 'ln ln4'))
    return ''.join(page(x, 'sheet') for x in (s1, s2, s3))


def colophon(R, kind):
    return page(f'''
<h2 class="colh">奥　付</h2>
<table class="col">
<tr><th>書名</th><td>国公立2次 予想問題 第{R['n']}回 外国語（英語）{'問題' if kind == 'q' else '解答・解説'}</td></tr>
<tr><th>想定</th><td>{UNIV} 前期日程（教育学部 A類・B類 英語コース）の英語の出題形式に準拠</td></tr>
<tr><th>構成</th><td>大問Ⅰ〜Ⅴ（長文読解・英文要約・和文英訳・自由英作文・ディクテーション）／筆記 90 分＋ディクテーション約 10 分／配点は全体を 100 とした割合</td></tr>
<tr><th>編集・作成</th><td>学習アプリ マナトビ 編集部（{R.get('date', '2026年10月')}）</td></tr>
</table>
<div class="disc"><b>{e(DISCLAIMER)}</b><br><span>英文・設問・解答・解説はすべて編集部の書き下ろしです。実際の試験の問題文・解答例・講評の文章は引用していません。</span></div>
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


def qpoints(q):
    return sum(p for _, p in q['criteria']) if q.get('criteria') else q['points']


def a_part_I(R):
    P = R['I']
    rows = [(str(i), q.get('short', '解説を参照'), qpoints(q)) for i, q in enumerate(P['questions'], 1)]
    assert sum(r[2] for r in rows) == P['points'], ('I points', sum(r[2] for r in rows), P['points'])
    body = part_head(1, P, ' — 解答・解説') + '<p class="ah">解答一覧</p>' + akey_table(rows)
    for i, q in enumerate(P['questions'], 1):
        body += (f'<h3 class="aq"><span class="qno">{i}</span>{e(q["kind"])}</h3>'
                 f'<p class="ans">【解答】{m(q["answer"])}</p><p class="expl">{m(q["expl"])}</p>' + crit(q))
    body += full_translation(P)
    return page(body, 'flow')


def full_translation(P):
    tr = ''.join(f'<p class="trp"><span class="pno">{i + 1}</span>{m(t)}</p>' for i, t in enumerate(P['translation']))
    vocab = ''
    if P.get('vocab'):
        vocab = '<p class="ah">語句</p><div class="vocab">' + ''.join(
            f'<span class="vw"><i>{e(w)}</i>　{e(j)}</span>' for w, j in P['vocab']) + '</div>'
    return f'<p class="ah">全訳</p>{tr}{vocab}'


def a_part_II(R):
    P = R['II']
    assert qpoints(P) == P['points'], ('II points', qpoints(P), P['points'])
    rows = ''.join(f'<tr><td>第{i + 1}段落</td><td>{m(t)}</td></tr>' for i, t in enumerate(P['outline']))
    body = (part_head(2, P, ' — 解答・解説') +
            f'<p class="ah">要約の解答例（{len(P["model"].replace(" ", ""))}字）</p><div class="model-ja">{m(P["model"])}</div>'
            f'<p class="ah">段落ごとの要点</p><table class="outline">{rows}</table>' + crit(P) +
            '<p class="ah">要約のコツ</p><ul class="tips">' + ''.join(f'<li>{m(t)}</li>' for t in P['tips']) + '</ul>' + full_translation(P))
    return page(body, 'flow')


def a_part_III(R):
    P = R['III']
    total = sum(qpoints(it) for it in P['items'])
    assert total == P['points'], ('III points', total, P['points'])
    body = part_head(3, P, ' — 解答・解説')
    for it in P['items']:
        alts = ''.join(f'<p class="alt">別解：{m(a)}</p>' for a in it.get('alts', []))
        pts = '<ul class="tips">' + ''.join(f'<li>{m(t)}</li>' for t in it['points_ja']) + '</ul>'
        body += (f'<h3 class="aq"><span class="qno">({e(it["label"])})</span>下線部{e(it["label"])}</h3>'
                 f'<p class="ja-src">{m(it["src"])}</p><p class="ans en-ans">【解答例】{m(it["answer"])}</p>{alts}'
                 f'<p class="ah2">表現のポイント</p>{pts}' + crit(it))
    return page(body, 'flow')


def a_part_IV(R):
    P = R['IV']
    assert qpoints(P) == P['points'], ('IV points', qpoints(P), P['points'])
    body = part_head(4, P, ' — 解答・解説') + crit(P) + '<p class="ah">書き方のポイント</p><ul class="tips">' + ''.join(
        f'<li>{m(t)}</li>' for t in P['tips']) + '</ul>'
    for k, (stance, outline, text) in enumerate(P['models'], 1):
        wc = len(re.findall(r"[A-Za-z0-9'’-]+", text))
        body += (f'<p class="ah">解答例{k}　{e(stance)}（{wc}語）</p><p class="outl">構成：{m(outline)}</p>'
                 f'<div class="model-en">{"".join(f"<p>{m(p)}</p>" for p in text.split(chr(10)))}</div>')
    return page(body, 'flow')


def a_part_V(R):
    P = R['V']
    assert qpoints(P) == P['points'], ('V points', qpoints(P), P['points'])
    body = (part_head(5, P, ' — 解答・解説') + '<p class="ah">解答（読み上げ原稿と同じ英文）</p>'
            f'<div class="model-en"><p>{m(P["script"])}</p></div>' + crit(P) +
            '<p class="ah">聞き取りのポイント</p><ul class="tips">' + ''.join(f'<li>{m(t)}</li>' for t in P['tips']) + '</ul>'
            '<div class="reader"><p class="crit-h">読み上げ原稿（読む人へ）</p>'
            '<p class="small">解く人に問題編のⅤだけを開かせ，次の英文を 3 回読んでください。1 回目はふつうの速さで通して，2 回目は「／」の所で 5〜6 秒ずつ止めながら，3 回目はもう一度ふつうの速さで通して読みます。最後に 1 分ほど見直しの時間をとってください。</p>'
            f'<p class="en script">{m(P["script_slashed"])}</p></div>')
    return page(body, 'flow')


def build(R, kind, ranges):
    if kind == 'q':
        parts = cover(R, 'q', ranges) + part_I(R) + part_II(R) + part_III(R) + part_IV(R) + part_V(R) + sheets(R) + colophon(R, 'q')
    else:
        parts = cover(R, 'a', ranges) + a_part_I(R) + a_part_II(R) + a_part_III(R) + a_part_IV(R) + a_part_V(R) + colophon(R, 'a')
    return f'<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>{CSS}</style></head><body>{parts}</body></html>'


def pdf(html_text, path, label):
    hp = path.with_suffix('.html')
    hp.write_text(html_text, encoding='utf-8')
    subprocess.run(['node', str(HERE / 'pdf.mjs'), str(hp), str(path), label], check=True)


def page_texts(path):
    """ページごとの文字（空白を除き NFKC で正規化。PDF からは「⽤」など部首の字形で取れることがあるため）"""
    import unicodedata
    from pypdf import PdfReader
    return [unicodedata.normalize('NFKC', re.sub(r'\s+', '', p.extract_text() or '')) for p in PdfReader(str(path)).pages]


def render(n):
    R = importlib.import_module(f'r{n}').ROUND
    assert R['n'] == n
    total = sum(R[k]['points'] for k in ('I', 'II', 'III', 'IV', 'V'))
    assert total == 100, total
    OUT.mkdir(parents=True, exist_ok=True)
    q = OUT / f'予想問題_{UNIV}_英語_第{n}回_問題.pdf'
    a = OUT / f'予想問題_{UNIV}_英語_第{n}回_解答解説.pdf'
    # 1回目：仮のページ範囲で刷り、実物から数える
    pdf(build(R, 'q', (1, 1, 1, 1)), q, f'第{n}回 問題')
    t = page_texts(q)
    first_sheet = next(i for i, s in enumerate(t) if '解答用紙' in s and '受験番号' in s) + 1
    last = len(t)
    qr = (2, first_sheet - 1, first_sheet, last - 1)
    pdf(build(R, 'q', qr), q, f'第{n}回 問題')
    pdf(build(R, 'a', (1, 1)), a, f'第{n}回 解答・解説')
    ar = (2, len(page_texts(a)) - 1)
    pdf(build(R, 'a', ar), a, f'第{n}回 解答・解説')
    assert len(page_texts(q)) == last, 'ページ数が2回目で変わった'
    dest = ROOT / 'public' / 'prints' / f'print_lr_niji_gakugei_en_{n}.pdf'
    subprocess.run(['pdfunite', str(q), str(a), str(dest)], check=True)
    print(f'第{n}回: 問題 {last}p（解答用紙 {qr[2]}〜{qr[3]}）・解答解説 {ar[1] + 1}p → {dest.relative_to(ROOT)} {dest.stat().st_size // 1024}KB')


if __name__ == '__main__':
    sys.path.insert(0, str(HERE))
    arg = sys.argv[1] if len(sys.argv) > 1 else 'all'
    for k in ([1, 2, 3] if arg == 'all' else [int(arg)]):
        render(k)
