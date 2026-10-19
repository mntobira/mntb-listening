"""コード地図：ファイルを開く前に「どこに何があるか」を1枚の絵と1行の索引で掴むための資料を作る。
  maps/00-overview.png  … 全体：しくみの箱ごとのファイル数・行数、箱どうしの import の本数、各箱の中心ファイル
  maps/<番号>-<箱>.png   … 箱ごと（40枚を超える箱はフォルダ単位で分ける）。1ファイル＝1マス
  codemap.md             … 1ファイル1行の索引（パス・ひとことで・行数・使われる数）。AI に渡すならこちら（量は画像の約半分、パスの写し間違いなし。research.md 7.4）
PNG は render.mjs が .work/maps/*.html から撮る。中身はすべて cards.json（＝ファイルから取り出した事実と手書きのカード）だけ。"""
import json, os, sys, re, html, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_site as B
G = B.G; S = B.S
cards = json.load(open(f'{G}/data/cards.json'))
sync = json.load(open(f'{G}/data/sync.json')) if os.path.exists(f'{G}/data/sync.json') else {'new': [], 'changed': []}
NEW = set(sync.get('new', [])); CHG = {x['path'] for x in sync.get('changed', [])}
SYS = [s for s in B.SYS]; LBL = B.SYS_LABEL
files = [c for c in cards if c['kind'] == 'file']
by_path = {c['path']: c for c in files}
facts = json.load(open(os.path.join(B.WORK, 'facts.json')))
TAGC = {'画面': '--t-screen', '部品': '--t-part', 'データ': '--t-data', '通信': '--t-net', '設定': '--t-config',
        'テスト': '--t-test', '音声・画像': '--t-media', '文書': '--t-doc'}
PER = 40
esc = html.escape

def imports_of(p): return [x for x in (facts.get(p, {}).get('imports') or []) if x in by_path]

# 箱ごとのページ分け（フォルダ順。大きいフォルダは途中で切る）
pages = []
NAMES = {}
for s in SYS:
    mem = sorted((c for c in files if c['sys'] == s['id']), key=lambda c: (os.path.dirname(c['path']), c['path']))
    if not mem: continue
    chunks, cur = [], []
    for d in sorted({os.path.dirname(c['path']) for c in mem}):
        grp = [c for c in mem if os.path.dirname(c['path']) == d]
        if cur and len(cur) + len(grp) > PER: chunks.append(cur); cur = []
        while len(grp) > PER: chunks.append(grp[:PER]); grp = grp[PER:]
        cur += grp
    if cur: chunks.append(cur)
    for i, ch in enumerate(chunks):
        pages.append(dict(sys=s['id'], label=s['label'], n=i + 1, of=len(chunks), cards=ch,
                          slug=f"{s['id']}-{i + 1}" if len(chunks) > 1 else s['id']))
bundled = sum(c.get('count', 0) for c in cards if c['kind'] == 'bundle')

CSS = re.search(r':root\{.*?\n\}', open(f'{G}/site/style.css').read(), re.S).group(0)  # 色と字の変数だけ使う
BASE = CSS + '''
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--font);font-size:14px;line-height:1.55;font-feature-settings:"palt" 1;width:1600px;padding:32px 36px 28px}
code,.mono{font-family:var(--mono);letter-spacing:0}
.hd{display:flex;align-items:flex-end;gap:18px;margin-bottom:18px;border-bottom:3px solid var(--navy);padding-bottom:12px}
.hd h1{margin:0;font-size:30px;font-weight:800;color:var(--navy);line-height:1.2}
.hd .sub{font-size:14px;color:var(--ink-2)}
.hd .meta{margin-left:auto;text-align:right;font-size:13px;color:var(--ink-3)}
.how{font-size:13px;color:var(--ink-2);margin:0 0 14px}
.dir{margin:16px 0 8px;display:flex;align-items:center;gap:10px;font-size:15px;font-weight:800;color:var(--navy)}
.dir code{font-size:14px;background:#fff;border:2px solid var(--line);border-radius:999px;padding:2px 12px}
.dir span{font-size:13px;font-weight:700;color:var(--ink-3)}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.t{background:#fff;border:2px solid var(--line);border-radius:16px;padding:10px 12px 9px;display:flex;flex-direction:column;gap:4px;min-width:0;border-left-width:8px}
.t.hub{border-color:var(--navy);border-left-color:var(--navy)}
.t .nm{font-family:var(--mono);font-weight:700;font-size:13.5px;color:var(--navy);overflow-wrap:anywhere;line-height:1.3}
.t .one{font-size:13.5px;color:var(--ink);font-weight:700;line-height:1.45}
.t .ft{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--ink-3);margin-top:auto;flex-wrap:wrap}
.chip{border-radius:999px;padding:0 8px;font-weight:700;color:var(--ink);font-size:13px}
.bar{height:6px;border-radius:3px;background:var(--blue-2);display:inline-block;vertical-align:middle}
.flag{border-radius:999px;padding:0 8px;font-weight:800;font-size:13px;background:var(--orange-pale);color:var(--orange)}
.key{display:flex;gap:16px;flex-wrap:wrap;font-size:13px;color:var(--ink-2);margin:0 0 6px}
.edges{margin-top:18px;background:#fff;border:2px solid var(--line);border-radius:20px;padding:12px 16px;columns:2;column-gap:28px;font-size:13px}
.edges h2{column-span:all;margin:0 0 6px;font-size:15px;color:var(--navy)}
.edges div{break-inside:avoid;font-family:var(--mono);color:var(--ink-2)}
.ov{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.box{background:#fff;border:2px solid var(--line);border-radius:20px;padding:12px 14px}
.box h2{margin:0;font-size:18px;color:var(--navy);display:flex;gap:8px;align-items:baseline}
.box h2 small{font-size:13px;color:var(--ink-3);font-weight:700}
.box .d{font-size:13px;color:var(--ink-2);margin:2px 0 6px}
.box ol{margin:0;padding-left:1.3em;font-size:13px}
.box li code{font-size:13px;color:var(--navy);font-weight:700}
.box .pg{font-size:13px;color:var(--blue);font-weight:700;margin-top:6px;font-family:var(--mono)}
table.x{border-collapse:collapse;margin-top:16px;font-size:13px;background:#fff;border-radius:16px;overflow:hidden}
table.x th,table.x td{border:1px solid var(--line);padding:4px 7px;text-align:center;font-variant-numeric:tabular-nums}
table.x th{background:var(--paper-2);color:var(--navy)}
table.x td.z{color:#c3cfdf}
.foot{margin-top:16px;font-size:13px;color:var(--ink-3);display:flex;justify-content:space-between}
'''

def shell(title, sub, body, text_for_font):
    FONT_TEXT.append(text_for_font + title + sub); fonts = '/*FONTS*/'
    meta = f"{esc(S['asOf'])}<br>{esc(S['branch'])} @{esc(S['commit'])}（{esc(S['commitDate'])}）"
    return f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>{esc(title)}</title>
<style>{fonts}\n{BASE}</style></head><body>
<header class="hd"><h1>{esc(title)}</h1><div class="sub">{esc(sub)}</div><div class="meta">{meta}</div></header>
{body}
<div class="foot"><span>コードの図鑑 docs/code_guide ・ この絵は tools/update.sh で今のコードから作り直せる</span><span>詳しい文は interactive.html / file-guide.pdf、正確な中身は元のファイル</span></div>
</body></html>'''

FONT_TEXT = []
maxl = max(c['lines'] for c in files) or 1
def tile(c):
    w = max(4, round(120 * (c['lines'] / maxl) ** .5))
    fl = ''
    if c['path'] in NEW or c.get('draft'): fl = '<span class="flag">新・要確認</span>'
    elif c['path'] in CHG: fl = '<span class="flag">変わった</span>'
    elif c['conf'] == '低': fl = '<span class="flag">要確認</span>'
    hub = ' hub' if c['nBy'] >= 6 else ''
    return (f'<div class="t{hub}" style="border-left-color:var({TAGC.get(c["tag"], "--line")})">'
            f'<div class="nm">{esc(c["name"])}</div><div class="one">{esc(c["one"])}</div>'
            f'<div class="ft"><span class="chip" style="background:var({TAGC.get(c["tag"], "--line")})">{esc(c["tag"])}</span>'
            f'<span class="bar" style="width:{w}px"></span><span>{c["lines"]:,}行</span>'
            f'<span>使われる {c["nBy"]}・使う {c["nImports"]}</span>{fl}</div></div>')

def page_html(pg):
    body = [f'<p class="how">1マス＝1ファイル。左の色＝タグ、棒＝行数、紺の太枠＝6ファイル以上から使われる中心ファイル。'
            f'「使われる／使う」は import の数。まず中心ファイルと名前で当たりを付け、必要なファイルだけを開く。</p>']
    body.append('<div class="key">' + ''.join(f'<span><span class="chip" style="background:var({v})">{k}</span></span>' for k, v in TAGC.items()) + '</div>')
    for d in sorted({os.path.dirname(c['path']) for c in pg['cards']}):
        grp = [c for c in pg['cards'] if os.path.dirname(c['path']) == d]
        allin = sum(1 for c in files if os.path.dirname(c['path']) == d)
        body.append(f'<div class="dir"><code>{esc(d or "リポジトリ直下")}/</code><span>{len(grp)}ファイル'
                    + (f'（このフォルダ全{allin}のうち）' if allin != len(grp) else '') + '</span></div>')
        body.append('<div class="grid">' + ''.join(tile(c) for c in grp) + '</div>')
    inside = {c['path'] for c in pg['cards']}
    edges = [(c['path'], x) for c in pg['cards'] for x in imports_of(c['path']) if x in inside]
    deg = {}
    for a, b in edges: deg[b] = deg.get(b, 0) + 1
    edges.sort(key=lambda e: (-deg.get(e[1], 0), e[1], e[0]))
    if edges:
        body.append('<section class="edges"><h2>この絵の中のつながり（A → B は「A が B を使う」）・多く使われる順に最大24本</h2>'
                    + ''.join(f'<div>{esc(by_path[a]["name"])} → {esc(by_path[b]["name"])}</div>' for a, b in edges[:24]) + '</section>')
    title = f"コード地図：{pg['label']}" + (f"（{pg['n']}/{pg['of']}）" if pg['of'] > 1 else '')
    txt = ''.join(c['name'] + c['one'] + c['tag'] + c['path'] for c in pg['cards']) + ''.join(body)
    return shell(title, f"{len(pg['cards'])}ファイル", '\n'.join(body), txt)

def overview():
    sysfiles = {s['id']: [c for c in files if c['sys'] == s['id']] for s in SYS}
    boxes = []
    for s in SYS:
        mem = sysfiles[s['id']]
        if not mem: continue
        hubs = sorted(mem, key=lambda c: -c['nBy'])[:4]
        pgs = [f'{i:02d}-{p["slug"]}' for i, p in enumerate(pages, 1) if p['sys'] == s['id']]
        boxes.append(f'<div class="box"><h2>{esc(s["label"])}<small>{len(mem)}ファイル・{sum(c["lines"] for c in mem):,}行</small></h2>'
                     f'<div class="d">{esc(s["sub"])}</div><ol>'
                     + ''.join(f'<li><code>{esc(c["name"])}</code> {esc(c["one"])}（使われる {c["nBy"]}）</li>' for c in hubs)
                     + '</ol><div class="pg">→ ' + ' / '.join(f'maps/{p}.png' for p in pgs) + '</div></div>')
    ids = [s['id'] for s in SYS if sysfiles[s['id']]]
    m = {(a, b): 0 for a in ids for b in ids}
    sysof = {c['path']: c['sys'] for c in files}
    for c in files:
        for x in imports_of(c['path']):
            m[(c['sys'], sysof[x])] += 1
    tbl = ('<table class="x"><tr><th>使う側 ＼ 使われる側</th>' + ''.join(f'<th>{esc(LBL[b])}</th>' for b in ids) + '</tr>'
           + ''.join('<tr><th>' + esc(LBL[a]) + '</th>' + ''.join(
               f'<td class="{"z" if not m[(a, b)] else ""}">{m[(a, b)] or "·"}</td>' for b in ids) + '</tr>' for a in ids) + '</table>')
    body = (f'<p class="how">全体の地図。カード{len(files)}枚の個別ファイル（ほかに画像・音声など{bundled:,}ファイルは束ねて1枚ずつ）。'
            f'箱ごとに「多く使われる中心ファイル」を4つ挙げた。下の表は箱どうしの import の本数。</p>'
            f'<div class="ov">{"".join(boxes)}</div>{tbl}')
    return shell('コード地図：全体', 'しくみの箱と、箱どうしのつながり', body, body)

def codemap_md():
    L = [f"# コード地図（文字版）— {S['asOf']}・{S['branch']} @{S['commit']}（{S['commitDate']}）", '',
         'tools/update.sh が cards.json から作る。1ファイル1行：`パス` — ひとことで（タグ・行数・使われる数）。',
         '【新】はカード未記入の新しいファイル、【変】は書いたあとに冒頭の説明か export が変わったファイル、【要確認】は役割を確かめきれていないファイル。',
         '使い方：ここで当たりを付けてから、必要なファイルだけを開く。行の説明は要約なので、細かい挙動は必ず元のファイルで確かめる。', '']
    for s in SYS:
        mem = sorted((c for c in files if c['sys'] == s['id']), key=lambda c: c['path'])
        if not mem: continue
        L.append(f"## {s['label']}（{len(mem)}ファイル）"); L.append('')
        for c in mem:
            f = '【新】' if c['path'] in NEW or c.get('draft') else '【変】' if c['path'] in CHG else '【要確認】' if c['conf'] == '低' else ''
            L.append(f"- `{c['path']}` — {f}{c['one']}（{c['tag']}・{c['lines']:,}行・使われる{c['nBy']}）")
        L.append('')
    L.append(f"## 束ねたファイル（{sum(1 for c in cards if c['kind'] == 'bundle')}群）"); L.append('')
    for c in cards:
        if c['kind'] == 'bundle': L.append(f"- {c['name']}：`{c['path']}` — {c['one']}（{c['count']:,}ファイル）")
    return '\n'.join(L) + '\n'

if __name__ == '__main__':
    out = os.path.join(B.WORK, 'maps')   # 絵の元（HTML）は作業場所。Git に入れるのは render.mjs が撮る maps/*.png
    if os.path.isdir(out):
        for f in os.listdir(out):
            if f.endswith('.html'): os.remove(os.path.join(out, f))
    os.makedirs(out, exist_ok=True)
    docs = {'00-overview.html': overview()}
    for i, pg in enumerate(pages, 1): docs[f'{i:02d}-{pg["slug"]}.html'] = page_html(pg)
    fonts = B.font_faces(''.join(FONT_TEXT) + ''.join(docs.values()))   # 字のサブセットは全ページ分まとめて1回
    for k, v in docs.items(): open(f'{out}/{k}', 'w').write(v.replace('/*FONTS*/', fonts))
    open(f'{G}/codemap.md', 'w').write(codemap_md())
    print('maps', len(pages) + 1, 'codemap.md')
