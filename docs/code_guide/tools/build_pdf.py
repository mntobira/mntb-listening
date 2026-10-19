"""file-guide.html → file-guide.pdf（A4）。全カードを、フォルダごとの章に分けて載せる。
各章の始めに1行の役割と、とびら君のやさしい吹き出し。カード本文は簡潔なまま。"""
import json, os, sys, html
sys.path.insert(0, os.path.dirname(__file__))
import build_site as B
G = B.G; S = B.S; cards = B.cards; chapters = B.chapters; icons = B.icons
esc = html.escape
TAG = {t['label']: t for t in B.TAGS}
ico = lambda k, s=12: f'<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{icons[k]}</svg>'
ORDER = ['(ルート)', 'src', 'tests', 'functions', 'scripts', 'public', 'docs', 'android', 'ios', 'audio_sources', 'store-assets', 'license_evidence', 'message']
POSE = ['basic', 'studying', 'thinking', 'walking', 'trophy']
byPath = {c['path']: c for c in cards if c['kind'] == 'file'}

def card(c):
    t = TAG[c['tag']]
    if c['kind'] == 'file':
        lk = ''.join(f'<li><span class="d">{ {"from":"呼ばれる","to":"呼ぶ","ref":"名前が出る"}[l["dir"]] }</span><code>{esc(l["path"])}</code></li>' for l in c['links']) or '<li>import のつながり・名前の出てくる他ファイルは見つからず</li>'
        tie = f'<ul class="lk">{lk}</ul>'
    else:
        tie = f'<p class="mem">{c["count"]:,} 件をまとめて掲載（{" / ".join(f"{esc(e)} {n}" for e, n in c["exts"].items())}）</p>'
    low = ' low' if c['conf'] == '低' else ''
    return f'''<article class="cd{low}"><header><span class="tg" style="background:{t['bg']}">{ico(t['icon'])}{esc(c['tag'])}</span><span class="cf{low}">確信度 {esc(c['conf'])}{'（要確認）' if c['conf']=='低' else ''}</span><span class="ln">{c['lines']:,} 行</span></header>
<h3>{esc(c['name'])}</h3><div class="pt">{esc(c['path'])}</div>
<p class="one">{esc(c['one'])}</p><p class="dt">{esc(c['detail'])}</p>{tie}</article>'''

def page():
    css = open(f'{G}/site/style.css').read()
    secs = []
    for k, f in enumerate(ORDER):
        cs = sorted([c for c in cards if c['folder'] == f], key=lambda c: (c['kind'] != 'file', c['path']))
        if not cs: continue
        ch = chapters[f]; n = sum(c.get('count', 1) for c in cs)
        secs.append(f'''<section class="ch"><div class="chh"><div><div class="chn">第{len(secs)+1}章</div><h2>{esc(ch['title'])}</h2><p class="role">{esc(ch['role'])}</p>
<p class="meta">カード {len(cs)} 枚 ／ ファイル {n:,} 件</p></div><div class="gd"><p class="bb">{esc(ch['bubble'])}</p><img src="{B.MASCOT[POSE[len(secs) % len(POSE)]]}" alt="とびら君"></div></div>
<div class="cards">{''.join(card(c) for c in cs)}</div></section>''')
    toc = ''.join(f'<li><span>{esc(chapters[f]["title"])}</span><em>{sum(1 for c in cards if c["folder"]==f)} 枚</em></li>' for f in ORDER if any(c['folder'] == f for c in cards))
    gl = ''.join(f'<tr><th>{esc(g["term"])}</th><td>{esc(g["plain"])}</td></tr>' for g in B.gloss)
    body = f'''<section class="cover"><div class="kick">FILE GUIDE ／ {S['asOf']}</div><h1>マナトビ リスニング<br><span>ファイルの手引き</span></h1>
<p class="lead">リポジトリの {S['tracked']:,} 件のファイルを、個別カード {S['cardsFile']} 枚と、まとめたカード {S['cardsBundle']} 枚で説明します。説明はすべてファイルを読んで書いたもので、確かめられなかったものは「要確認」としています。</p>
<p class="src">対象：{S['branch']} @{S['commit']}（{S['commitDate']}）</p><img src="{B.MASCOT['basic']}" alt="とびら君"></section>
<section class="toc"><h2>目次</h2><ol>{toc}</ol><h2 style="margin-top:9mm">カードの読み方</h2>
<p><b>ひとことで</b>…そのファイルが何の係か。<b>くわしく</b>…中身の説明・公開する名前・読み込むもの。<b>つながり</b>…呼ぶ／呼ばれる主なファイル（最大3）。<b>確信度</b>…高＝冒頭の説明やコードで確かめた／中＝一部を中身から判断／低＝使い道を確かめられず要確認。</p>
</section><section class="toc"><h2>ことばの言いかえ表</h2><p>一般向けの説明では、専門用語を右の言葉で言いかえています。</p><table class="glt">{gl}</table></section>
{''.join(secs)}'''
    text = body + css
    fonts = B.font_faces(text)
    return f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>ファイルの手引き</title><style>{fonts}
{css}
@page{{size:A4;margin:14mm 13mm 16mm}}
html,body{{background:#fff}}
body{{font-size:8.6pt;line-height:1.6;color:var(--ink)}}
.cover{{height:255mm;position:relative;page-break-after:always;padding-top:36mm}}
.cover .kick{{font-family:var(--mono);color:var(--orange);font-weight:700;letter-spacing:.12em;font-size:10pt}}
.cover h1{{font-size:38pt;line-height:1.15;margin:6mm 0 0;color:var(--navy);font-weight:800}}
.cover h1 span{{color:var(--blue)}}
.cover .lead{{font-size:12pt;max-width:120mm;color:var(--ink-2);margin-top:9mm;line-height:1.8}}
.cover .src{{font-size:9pt;color:var(--ink-3);margin-top:6mm}}
.cover img{{position:absolute;right:4mm;bottom:12mm;width:62mm}}
.toc{{page-break-after:always}}
.toc h2{{font-size:15pt;color:var(--navy);margin:0 0 4mm}}
.toc ol{{margin:0;padding-left:7mm;font-size:10.5pt}} .toc li{{display:flex;justify-content:space-between;border-bottom:1px solid var(--line);padding:1.6mm 0}}
.toc li em{{font-style:normal;font-family:var(--mono);color:var(--ink-3)}}
.toc p{{font-size:9.5pt;color:var(--ink-2)}}
.glt{{border-collapse:collapse;width:100%;font-size:9.5pt}} .glt th{{text-align:left;color:var(--navy);width:58mm;padding:2mm 2mm;border-bottom:1px solid var(--line);vertical-align:top}} .glt td{{padding:2mm 2mm;border-bottom:1px solid var(--line);color:var(--ink-2)}}
.ch{{page-break-before:always}}
.chh{{display:grid;grid-template-columns:1fr 54mm;gap:6mm;align-items:end;border-bottom:2px solid var(--line);padding-bottom:5mm;margin-bottom:5mm}}
.chn{{font-family:var(--mono);color:var(--orange);font-weight:700;font-size:9pt}}
.chh h2{{font-size:21pt;margin:1mm 0 0;color:var(--navy);font-weight:800;line-height:1.25}}
.chh .role{{font-size:11pt;color:var(--ink-2);margin:2.5mm 0 0}}
.chh .meta{{font-size:8.5pt;color:var(--ink-3);margin:2mm 0 0;font-family:var(--mono)}}
.gd{{display:flex;flex-direction:column;align-items:flex-end;gap:2mm}}
.gd img{{width:24mm}}
.bb{{margin:0;background:#fff;border:1.5px solid var(--line);border-radius:12px;padding:2mm 3mm;font-size:8.6pt;color:var(--ink-2)}}
.cards{{columns:2;column-gap:5mm}}
.cd{{break-inside:avoid;border:1.5px solid var(--line);border-radius:14px;padding:3mm 3.4mm;margin:0 0 3.4mm;background:#fff}}
.cd.low{{border-color:#efc58e;background:#fffaf2}}
.cd header{{display:flex;gap:2mm;align-items:center;font-size:8pt}}
.tg{{display:inline-flex;gap:1mm;align-items:center;border-radius:99px;padding:.3mm 2.2mm .3mm 1.6mm;font-weight:700}}
.cf{{color:var(--ink-3);font-weight:700}} .cf.low{{color:var(--orange)}}
.ln{{margin-left:auto;font-family:var(--mono);color:var(--ink-3)}}
.cd h3{{margin:1.4mm 0 0;font-size:10pt;color:var(--navy);word-break:break-all;line-height:1.35}}
.pt{{font-family:var(--mono);font-size:8pt;color:var(--ink-3);word-break:break-all}}
.one{{margin:1.2mm 0 0;font-weight:700;color:var(--navy);font-size:8.8pt}}
.dt{{margin:.8mm 0 0;color:var(--ink-2);font-size:8pt}}
.lk{{margin:1mm 0 0;padding:0;list-style:none;font-size:8pt}} .lk li{{display:flex;gap:1.6mm}} .lk .d{{color:var(--blue);font-weight:700;white-space:nowrap}} .lk code{{word-break:break-all;color:var(--ink-2)}}
.mem{{margin:1mm 0 0;font-size:8pt;color:var(--blue);font-weight:700}}
</style></head><body>{body}</body></html>'''

if __name__ == '__main__':
    open(f'{B.WORK}/file-guide.html', 'w').write(page()); print('file-guide.html')
