"""四国の国公立2次 英語 予想問題（マナトビ編集部の書き下ろし）を、試験の体裁（白黒・解答用紙・奥付）で PDF にする。
  ラウンドのデータ R（rN.py）→ 問題編・解答解説編 → 2冊を pdfunite でつなぎ public/prints/ に置く。サムネイルも作る。
  記法：{u:ラベル:語句} 下線＋ラベル、{b:ラベル} 空所、**語** 太字。
"""
import re, html, base64, subprocess
from pathlib import Path
from weasyprint import HTML

ROOT = Path('/home/user/webapp'); OUT = Path('/home/user/work/niji/out'); OUT.mkdir(parents=True, exist_ok=True)
ROMAN = 'ⅠⅡⅢⅣⅤⅥ'


def disc(u):
    return f'{u}の過去問・公式問題ではありません。予想問題であり、大学とは関係がありません。'


CSS = """
@page { size: A4; margin: 17mm 17mm 16mm;
  @bottom-center { content: '— ' counter(page) ' —'; font: 8.5pt 'IPAMincho'; color: #444 }
  @top-right { content: string(hd); font: 7.5pt 'IPAGothic'; color: #555 } }
@page :first { @top-right { content: none } @bottom-center { content: none } }
html { font-family: 'Liberation Serif', 'IPAMincho'; font-size: 10.4pt; line-height: 1.62; color: #111 }
.hd { string-set: hd content() }
.cover { height: 258mm; position: relative; page-break-after: always }
.cover .top { display: flex; justify-content: space-between; border-bottom: 1.2pt solid #111; padding-bottom: 2mm; font: 9pt 'IPAGothic' }
.cover .kind { margin-top: 24mm; text-align: center; font: 11pt 'IPAGothic'; letter-spacing: .3em }
.cover h1 { text-align: center; font: 34pt 'IPAGothic'; letter-spacing: .6em; margin: 6mm 0 2mm }
.cover .sb { text-align: center; font: 13pt 'IPAMincho'; letter-spacing: .4em }
.cover .tag { text-align: center; margin-top: 6mm }
.cover .tag span { border: 1.2pt solid #111; padding: 1mm 9mm; font: 12pt 'IPAGothic'; letter-spacing: .3em }
.cover .meta { text-align: center; margin-top: 7mm; font-size: 9.5pt; line-height: 1.8 }
.cover .meta b { font-family: 'IPAGothic' }
.cover .notes { margin: 9mm 4mm 0; border: 1pt solid #111; padding: 3mm 5mm; font-size: 8.8pt; line-height: 1.7 }
.cover .notes b { font-family: 'IPAGothic'; letter-spacing: .3em }
.discl { margin: 6mm 4mm 0; border-left: 3.5pt solid #111; background: #f0f0f0; padding: 2.5mm 4mm; font: 9pt/1.6 'IPAGothic' }
.discl small { display: block; font: 8pt/1.55 'IPAMincho'; color: #333; margin-top: 1mm }
.cover .foot { position: absolute; bottom: 0; left: 0; right: 0; border-top: .6pt solid #111; padding-top: 2mm; font: 8pt 'IPAGothic'; display: flex; justify-content: space-between }
.sec { page-break-before: always }
.sh { display: flex; align-items: center; gap: 3mm; border-bottom: 1.4pt solid #111; padding-bottom: 1.5mm; margin-bottom: 3mm }
.sh .no { border: 1.4pt solid #111; min-width: 9mm; padding: 0 2mm; text-align: center; font: 13pt 'IPAGothic' }
.sh .t { font: 11pt 'IPAGothic' }
.sh .p { margin-left: auto; font: 9pt 'IPAGothic' }
.lead { font-size: 9.8pt; margin: 0 0 3mm }
.ptitle { text-align: center; font-weight: bold; margin: 2mm 0; font-size: 11pt }
.para { text-indent: 1.4em; margin: 0 0 1.2mm; text-align: justify }
.pn { font: 7.5pt 'IPAGothic'; color: #333; margin-right: 1mm }
.ul { text-decoration: underline }
.lab { font: 7.5pt 'IPAGothic'; vertical-align: super; margin-right: 1pt }
.blank { font-family: 'IPAGothic'; font-size: 9pt; white-space: nowrap }
.notes2 { font-size: 8.6pt; margin: 2mm 0 3mm; border-top: .5pt solid #777; padding-top: 1.5mm; columns: 2; column-gap: 6mm }
.notes2 div { break-inside: avoid }
.dlg { margin: 0 0 1.3mm; padding-left: 15mm; text-indent: -15mm }
.dlg b { display: inline-block; width: 15mm; text-indent: 0 }
.ja { text-indent: 1em; margin: 0 0 1.4mm; text-align: justify; font-family: 'IPAMincho' }
.box { border: 1pt solid #111; padding: 2.5mm 4mm; margin: 2mm 0 3mm }
.q { margin: 2.4mm 0 0; page-break-inside: avoid }
.qn { font: 9.5pt 'IPAGothic'; margin-right: 1.5mm }
.opts { margin: .8mm 0 0 7mm; display: grid; grid-template-columns: 1fr 1fr; column-gap: 5mm }
.opts.one { grid-template-columns: 1fr }
.sub { margin: 1.2mm 0 0 6mm }
.chart { text-align: center; margin: 2mm 0 }
.src { font-size: 8pt; text-align: right; color: #333 }
.sheet { page-break-before: always }
.sheet h2 { font: 13pt 'IPAGothic'; letter-spacing: .2em; border-bottom: 1.4pt solid #111; margin: 0 0 2mm }
.sheet .who { font: 8.5pt 'IPAGothic'; text-align: right; margin-bottom: 2mm }
.blk { border: 1pt solid #111; margin: 3mm 0; padding: 2mm 3mm }
.blk .bh { font: 10pt 'IPAGothic'; border-bottom: .6pt solid #111; margin-bottom: 1.5mm }
.row { display: flex; align-items: flex-end; gap: 2mm; margin: 1.3mm 0; page-break-inside: avoid }
.row .lb { font: 8.5pt 'IPAGothic'; min-width: 12mm }
.cell { border: .8pt solid #111; width: 13mm; height: 8mm; display: inline-block }
.cell.w { width: 40mm }
.lines { flex: 1 }
.ln { border-bottom: .6pt solid #555; height: 7.6mm }
.wc { text-align: right; font: 8.5pt 'IPAGothic'; margin-top: 1mm }
.grid { display: grid; grid-template-columns: repeat(20, 6.4mm); border-left: .5pt solid #555; border-top: .5pt solid #555 }
.grid i { height: 6.4mm; border-right: .5pt solid #555; border-bottom: .5pt solid #555 }
.subtot { text-align: right; font: 8.5pt 'IPAGothic'; margin-top: 1mm }
.ans h3 { font: 10.5pt 'IPAGothic'; border-left: 3pt solid #111; padding-left: 2mm; margin: 4mm 0 1.5mm }
table.kt { border-collapse: collapse; width: 100%; font-size: 9.4pt }
table.kt td, table.kt th { border: .6pt solid #333; padding: 1.2mm 2mm; vertical-align: top }
table.kt th { background: #eee; font: 9pt 'IPAGothic' }
table.kt td.pt { width: 13mm; text-align: center }
.exp { margin: 1.5mm 0 2.5mm; font-size: 9.6pt }
.exp b.tg { font-family: 'IPAGothic' }
.tr p { text-indent: 1em; margin: 0 0 1.2mm; font-size: 9.4pt }
.vc { columns: 2; column-gap: 6mm; font-size: 9pt }
.vc div { break-inside: avoid }
.model { border: .8pt solid #111; padding: 2mm 3mm; margin: 1mm 0 2mm; font-size: 9.8pt }
.colo { page-break-before: always; padding-top: 140mm }
.colo h2 { font: 12pt 'IPAGothic'; border-bottom: 1.2pt solid #111 }
.colo table { width: 100%; font-size: 9pt; border-collapse: collapse }
.colo td { padding: 1.2mm 2mm; border-bottom: .5pt solid #999; vertical-align: top }
.colo td:first-child { width: 24mm; font-family: 'IPAGothic' }
.colo .fine { font-size: 8pt; color: #333; margin-top: 3mm }
"""


def esc(s):
    return html.escape(str(s), quote=False)


def mk(s):
    s = esc(s)
    s = re.sub(r'\{u:([^:{}]+):(.*?)\}', r'<span class="ul"><span class="lab">\1</span>\2</span>', s)
    s = re.sub(r'\{b:([^{}]+)\}', r'<span class="blank">（ \1 ）</span>', s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', s)
    return s.replace('\n', '<br>')


def secno(cfg, i):
    st = cfg.get('sec_style', 'dai')
    return {'dai': f'第{i + 1}問', 'roman': ROMAN[i], 'num': str(i + 1), 'kaku': f'［{ROMAN[i]}］', 'mon': f'問題{i + 1}'}[st]


def chart_svg(c):
    W, H, L, B, T = 460, 240, 48, 46, 28
    cats, ser = c['x'], c['series']
    ymax = c['ymax']; step = c.get('ystep', ymax / 5)
    pw, ph = W - L - 12, H - B - T; n = len(cats); k = len(ser)
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="Liberation Serif" font-size="10">',
         f'<rect width="{W}" height="{H}" fill="#fff"/><text x="{W / 2}" y="15" text-anchor="middle" font-size="12" font-weight="bold">{esc(c["title"])}</text>']
    v = 0.0
    while v <= ymax + 1e-9:
        y = T + ph - ph * v / ymax
        o.append(f'<line x1="{L}" y1="{y:.1f}" x2="{L + pw}" y2="{y:.1f}" stroke="#bbb" stroke-width=".6"/><text x="{L - 4}" y="{y + 3:.1f}" text-anchor="end">{v:g}</text>')
        v += step
    if c.get('ylabel'):
        o.append(f'<text x="13" y="{T + ph / 2}" transform="rotate(-90 13 {T + ph / 2})" text-anchor="middle" font-size="9.5">{esc(c["ylabel"])}</text>')
    fills = ['#333', '#fff', '#999']; gw = pw / n
    for i, cat in enumerate(cats):
        bw = gw * 0.7 / k
        for j, (_, vals) in enumerate(ser):
            h = ph * vals[i] / ymax; x = L + gw * i + gw * 0.15 + bw * j; y = T + ph - h
            o.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{bw:.1f}" height="{h:.1f}" fill="{fills[j]}" stroke="#111" stroke-width=".8"/>')
            o.append(f'<text x="{x + bw / 2:.1f}" y="{y - 2.5:.1f}" text-anchor="middle" font-size="8.5">{vals[i]:g}</text>')
        o.append(f'<text x="{L + gw * i + gw / 2:.1f}" y="{T + ph + 13}" text-anchor="middle" font-size="9">{esc(cat)}</text>')
    o.append(f'<line x1="{L}" y1="{T + ph}" x2="{L + pw}" y2="{T + ph}" stroke="#111"/>')
    if k > 1:
        for j, (nm, _) in enumerate(ser):
            x = L + 8 + j * 160
            o.append(f'<rect x="{x}" y="{H - 15}" width="11" height="8" fill="{fills[j]}" stroke="#111" stroke-width=".8"/><text x="{x + 15}" y="{H - 8}" font-size="9">{esc(nm)}</text>')
    o.append('</svg>')
    data = base64.b64encode(''.join(o).encode()).decode()
    src = f'<div class="src">{esc(c["source"])}</div>' if c.get('source') else ''
    return f'<img src="data:image/svg+xml;base64,{data}" style="width:150mm">{src}'


def opts_html(opts, marks):
    one = ' one' if max(len(x) for x in opts) > 32 else ''
    return f'<div class="opts{one}">' + ''.join(f'<div>{marks[i]} {mk(x)}</div>' for i, x in enumerate(opts)) + '</div>'


def q_html(q, marks):
    s = f'<div class="q"><span class="qn">{esc(q["n"])}</span>{mk(q.get("q", ""))}'
    marks = q.get('marks') or marks
    if q.get('opts'):
        s += opts_html(q['opts'], marks)
    for it in q.get('sub', []):
        if not it[1] and not (len(it) > 2 and it[2]):
            continue  # 解答欄だけに使うラベル（問題文には出さない）
        s += f'<div class="sub"><span class="qn">{esc(it[0])}</span>{mk(it[1])}'
        if len(it) > 2 and it[2]:
            s += opts_html(it[2], marks)
        s += '</div>'
    return s + '</div>'


def sec_html(cfg, i, S):
    marks = S.get('marks') or cfg.get('marks') or ['(A)', '(B)', '(C)', '(D)', '(E)', '(F)']
    h = (f'<section class="sec"><div class="sh"><span class="no">{secno(cfg, i)}</span><span class="t">{esc(S.get("title", ""))}</span>'
         f'<span class="p">（配点 {S["pts"]} 点）</span></div><p class="lead">{mk(S["lead"])}</p>')
    for P in S.get('passages', []):
        if P.get('title'):
            h += f'<div class="ptitle">{mk(P["title"])}</div>'
        for k, para in enumerate(P['paras']):
            pn = f'<span class="pn">[{k + 1}]</span>' if S.get('pnum') else ''
            h += f'<p class="para">{pn}{mk(para)}</p>'
    if S.get('dialog_intro'):
        h += f'<p class="para">{mk(S["dialog_intro"])}</p>'
    for a, b in S.get('dialog', []):
        h += f'<p class="dlg"><b>{esc(a)}:</b> {mk(b)}</p>'
    for jp in S.get('ja_paras', []):
        h += f'<p class="ja">{mk(jp)}</p>'
    if S.get('notes'):
        h += '<div class="notes2">' + ''.join(f'<div>*{esc(a)}　{esc(b)}</div>' for a, b in S['notes']) + '</div>'
    if S.get('chart'):
        h += f'<div class="chart">{chart_svg(S["chart"])}</div>'
    if S.get('prompt'):
        h += f'<div class="box">{mk(S["prompt"])}</div>'
    if S.get('qlead'):
        h += f'<p class="lead" style="margin-top:3mm">{mk(S["qlead"])}</p>'
    h += ''.join(q_html(q, marks) for q in S['qs'])
    return h + '</section>'


def sheet_rows(q):
    labels = [f'{q["n"]} {it[0]}' for it in q.get('sub', [])] if q.get('sheet_each', True) and q.get('sub') else [q['n']]
    sh = q.get('sheet', 3); out = ''
    for lab in labels:
        if sh == 'box':
            out += f'<div class="row"><span class="lb">{esc(lab)}</span><span class="cell"></span></div>'
        elif sh == 'wide':
            out += f'<div class="row"><span class="lb">{esc(lab)}</span><span class="cell w"></span></div>'
        elif isinstance(sh, str) and sh.startswith('grid'):
            n = int(sh[4:]); r = (n + 19) // 20
            out += (f'<div class="row" style="align-items:flex-start"><span class="lb">{esc(lab)}</span><div class="grid">' + '<i></i>' * (r * 20)
                    + f'</div></div><div class="wc">（{n}字以内）</div>')
        elif isinstance(sh, str) and sh.startswith('words'):
            n = int(sh[5:])
            out += (f'<div class="row" style="align-items:flex-start"><span class="lb">{esc(lab)}</span><div class="lines">' + '<div class="ln"></div>' * n
                    + '</div></div><div class="wc">語数（　　　　　）語</div>')
        else:
            out += f'<div class="row"><span class="lb">{esc(lab)}</span><div class="lines">' + '<div class="ln"></div>' * int(sh) + '</div></div>'
    return out


def answer_sheets(cfg, R):
    out = ''
    for i, S in enumerate(R['sections']):
        out += (f'<section class="sheet"><h2>解答用紙　{secno(cfg, i)}</h2>'
                f'<div class="who">{esc(cfg["univ"])} {esc(cfg.get("label", "英語"))} 予想問題 第{R["no"]}回　　受験番号（　　　　　　　）　氏名（　　　　　　　　　　）</div>'
                f'<div class="blk">' + ''.join(sheet_rows(q) for q in S['qs']) + '<div class="subtot">小計（　　　　）点</div></div></section>')
    return out


def cover(cfg, R, kind):
    notes = cfg['notes_q'] if kind == '問　題' else cfg['notes_a']
    return (f'<section class="cover"><div class="hd">{esc(cfg["univ"])} {esc(cfg.get("label", "英語"))} 予想問題 第{R["no"]}回</div>'
            f'<div class="top"><span>マナトビ　国公立2次 英語 予想問題</span><span>{esc(cfg["univ"])} 前期日程 対策</span></div>'
            f'<div class="kind">予想問題　第{R["no"]}回</div><h1>{esc(cfg.get("subject", "外国語"))}</h1><div class="sb">{esc(cfg.get("subject_sub", "英　語"))}</div>'
            f'<div class="tag"><span>{kind}</span></div>'
            f'<div class="meta"><b>{esc(cfg["univ"])} 前期日程 対策</b><br>{esc(cfg["target"])}<br>試験時間 {cfg["minutes"]} 分　／　{cfg["total"]} 点満点（時間・配点は本書の想定）</div>'
            f'<div class="notes"><b>はじめに読むこと</b><br>' + '<br>'.join(mk(x) for x in notes) + '</div>'
            f'<div class="discl">{esc(disc(cfg["univ"]))}<small>出題の形式・分量は、大学が公開している過去の問題を研究して設定しました。英文・設問・図表・解答はすべてマナトビ編集部の書き下ろしです。</small></div>'
            f'<div class="foot"><span>マナトビ編集部</span><span>{"問題編" if kind == "問　題" else "解答・解説編"}</span></div></section>')


def colophon(cfg, R, kind):
    return (f'<section class="colo"><h2>奥　付</h2><table>'
            f'<tr><td>書名</td><td>国公立2次 英語 予想問題 {esc(cfg["univ"])} 前期日程 対策 第{R["no"]}回（{kind}）</td></tr>'
            f'<tr><td>想定</td><td>{esc(cfg["univ"])}　{esc(cfg["target"])}</td></tr>'
            f'<tr><td>構成</td><td>{esc(cfg["structure"])}</td></tr>'
            f'<tr><td>編集・作問</td><td>マナトビ編集部（2026年11月）</td></tr></table>'
            f'<div class="discl" style="margin:4mm 0 0">{esc(disc(cfg["univ"]))}</div>'
            f'<p class="fine">本書の英文・設問・図表・解答・解説はすべて書き下ろしです。実在の試験問題、解答速報、講評などの文章は使っていません。'
            f'出題の形式は公開されている過去の問題を参考に設定したもので、実際の出題を保証するものではありません。登場する人物・団体・調査はすべて架空です。</p></section>')


def ans_html(cfg, R):
    h = ''
    for i, S in enumerate(R['sections']):
        h += (f'<section class="sec ans"><div class="sh"><span class="no">{secno(cfg, i)}</span><span class="t">{esc(S.get("title", ""))}　解答・解説</span>'
              f'<span class="p">（配点 {S["pts"]} 点）</span></div>')
        h += ('<table class="kt"><tr><th style="width:16mm">設問</th><th>解答（例）</th><th style="width:13mm">配点</th></tr>'
              + ''.join(f'<tr><td>{esc(a["n"])}</td><td>{mk(a.get("short", a["ans"]))}</td><td class="pt">{a["pts"]}</td></tr>' for a in S['ans']) + '</table>')
        h += '<h3>解説</h3>'
        for a in S['ans']:
            h += f'<div class="exp"><b class="tg">{esc(a["n"])}</b>　'
            if a.get('model'):
                h += f'<div class="model">{mk(a["model"])}</div>'
            h += f'{mk(a["exp"])}</div>'
        if S.get('tr'):
            h += '<h3>全訳</h3><div class="tr">' + ''.join(f'<p>{mk(p)}</p>' for p in S['tr']) + '</div>'
        if S.get('vocab'):
            h += '<h3>重要語句</h3><div class="vc">' + ''.join(f'<div><b>{esc(a)}</b>　{esc(b)}</div>' for a, b in S['vocab']) + '</div>'
        h += '</section>'
    return h


def words(s):
    return len(re.findall(r"[A-Za-z][A-Za-z'’-]*", re.sub(r'<[^>]+>|\{[ub]:[^:}]*:?|\}', ' ', s)))


def check(cfg, R):
    tot = 0
    for i, S in enumerate(R['sections']):
        s = sum(a['pts'] for a in S['ans'])
        assert s == S['pts'], f'{secno(cfg, i)} 配点 {s} != {S["pts"]}'
        tot += S['pts']
        for a in S['ans']:
            if a.get('min_words'):
                w = words(a['model'])
                assert a['min_words'] <= w <= a.get('max_words', 999), f'{secno(cfg, i)} {a["n"]} 模範解答 {w}語'
    assert tot == cfg['total'], f'合計 {tot} != {cfg["total"]}'


def doc(body, title):
    return f'<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>{esc(title)}</title><style>{CSS}</style></head><body>{body}</body></html>'


def build(cfg, R):
    check(cfg, R)
    slug, n = cfg['slug'], R['no']
    qb = cover(cfg, R, '問　題') + ''.join(sec_html(cfg, i, S) for i, S in enumerate(R['sections'])) + answer_sheets(cfg, R) + colophon(cfg, R, '問題')
    ab = cover(cfg, R, '解答・解説') + ans_html(cfg, R) + colophon(cfg, R, '解答・解説')
    pdfs = {}
    for tag, body in (('q', qb), ('a', ab)):
        hp = OUT / f'{slug}{n}_{tag}.html'
        hp.write_text(doc(body, f'{cfg["univ"]} {cfg.get("label", "英語")} 予想問題 第{n}回'))
        pp = OUT / f'{slug}{n}_{tag}.pdf'
        HTML(filename=str(hp)).write_pdf(str(pp))
        pdfs[tag] = pp
    dest = ROOT / f'public/prints/print_lr_niji_{slug}_en_{n}.pdf'
    subprocess.run(['pdfunite', str(pdfs['q']), str(pdfs['a']), str(dest)], check=True)
    info = subprocess.run(['pdfinfo', str(dest)], capture_output=True, text=True).stdout
    pages = int(re.search(r'Pages:\s+(\d+)', info).group(1)); kb = round(dest.stat().st_size / 1024)
    subprocess.run(['pdftoppm', '-r', '110', '-f', '1', '-l', '1', '-png', '-singlefile', str(dest), '/tmp/nijithumb'], check=True)
    from PIL import Image
    Image.open('/tmp/nijithumb.png').convert('RGB').resize((360, 510), Image.LANCZOS).save(
        ROOT / f'public/prints/thumbs/print_lr_niji_{slug}_en_{n}.webp', 'WEBP', quality=80)
    wc = [words(' '.join(P['paras'])) for S in R['sections'] for P in S.get('passages', [])]
    print(f'{slug} 第{n}回: 本文 {wc} 語 / {pages}ページ {kb}KB')
    return pages, kb
