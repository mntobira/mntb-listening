"""interactive.html（1ファイル・外部通信なし）を組み立てる。
フォントは使う文字だけに絞って WOFF2 で埋め込み、とびら君は公式 WebP をそのまま base64 で埋め込む（描き直さない）。"""
import json, base64, os, re, io, sys
from fontTools import subset
from fontTools.ttLib import TTFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import G, ROOT as SRC, WORK
FONTS = os.environ.get('CODE_GUIDE_FONTS') or os.path.join(WORK, 'fonts')
D = json.load
cards = D(open(f'{G}/data/cards.json')); stats = D(open(f'{G}/data/stats.json'))
icons = D(open(f'{G}/data/icons.json')); gloss = D(open(f'{G}/data/glossary.json')); chapters = D(open(f'{G}/data/chapters.json'))

TAGS = [
 dict(id='screen', label='画面', icon='screen', bg='var(--t-screen)'),
 dict(id='part', label='部品', icon='part', bg='var(--t-part)'),
 dict(id='data', label='データ', icon='data', bg='var(--t-data)'),
 dict(id='net', label='通信', icon='net', bg='var(--t-net)'),
 dict(id='config', label='設定', icon='config', bg='var(--t-config)'),
 dict(id='test', label='テスト', icon='test', bg='var(--t-test)'),
 dict(id='media', label='音声・画像', icon='media', bg='var(--t-media)'),
 dict(id='doc', label='文書', icon='doc', bg='var(--t-doc)'),
]
SYS = [
 dict(id='boot', label='起動と画面の切り替え', eng='entry / App router', icon='boot', sub='index.html・main.tsx・App.tsx'),
 dict(id='screen', label='画面と部品', eng='components / styles', icon='screen', sub='src/components・features'),
 dict(id='battle', label='対戦のしくみ', eng='src/battle', icon='battle', sub='core・data・ui・audio'),
 dict(id='logic', label='採点・記録の計算', eng='utils / hooks', icon='logic', sub='src/utils・hooks'),
 dict(id='content', label='問題と教材のデータ', eng='data / types', icon='content', sub='src/data・types'),
 dict(id='net', label='ログインと同期', eng='Firebase client', icon='net', sub='firebase.ts・*Sync'),
 dict(id='server', label='サーバーとルール', eng='Firestore rules / Functions', icon='server', sub='functions・firestore.rules'),
 dict(id='native', label='スマホアプリ版', eng='Capacitor iOS / Android', icon='native', sub='ios・android・ads'),
 dict(id='assets', label='音声・絵・プリント', eng='public assets', icon='assets', sub='public・audio_sources'),
 dict(id='tools', label='作る道具', eng='scripts / tooling', icon='tools', sub='scripts・store-assets'),
 dict(id='test', label='自動テスト', eng='vitest / Playwright', icon='test', sub='tests'),
 dict(id='docs', label='資料と全体の設定', eng='docs / root config', icon='docs', sub='docs・README など'),
]
SYS_LABEL = {s['id']: s['label'] for s in SYS}
FLOW = [
 dict(id='solve', label='解く', icon='solve', sub='単元を選び、聞いて答える'),
 dict(id='learn', label='わかる', icon='learn', sub='答え合わせと解説・音読'),
 dict(id='review', label='復習', icon='review', sub='間違いを集めて解き直す'),
 dict(id='compete', label='競う', icon='compete', sub='対戦・ランキング・クラン'),
]
SYN = {  # 検索の言いかえ（言いかえ表と同じ言葉）
 '対戦':['battle','対戦','マッチ','レート','ランキング'], '復習':['review','復習','忘却','ノート','解き直'],
 '採点':['scor','採点','判定','judge'], '音声':['audio','音','bgm','sfx','読み上げ','speech'],
 'ログイン':['auth','ログイン','サインイン','google','apple'], '同期':['sync','同期'],
 '単語':['vocab','単語'], '文法':['grammar','文法','eg'], 'リスニング':['listening','リスニング','聞'],
 'ガチャ':['gacha','ガチャ'], '広告':['ad','広告'], 'テスト':['test','テスト','確かめる'],
 '解説':['explanation','解説'], 'クラン':['clan','クラン'], 'フレンド':['friend','フレンド'],
}

# とびら君（目を開けた公式画像だけ）
def img64(name):
    return 'data:image/webp;base64,' + base64.b64encode(open(f'{SRC}/public/mascots/{name}.webp', 'rb').read()).decode()
MASCOT = {k: img64(k) for k in ['basic', 'studying', 'thinking', 'walking', 'trophy']}

S = stats
NUMS = [
 dict(n=S['tracked'], u='件', l='Gitで管理しているファイル', how='git ls-files の件数', w=100),
 dict(n=S['srcLines'], u='行', l='アプリ本体のコード', how=f"src/ の ts・tsx・css {S['srcFiles']}件の改行数", w=100),
 dict(n=S['screens'], u='種類', l='画面の行き先', how='App.tsx の AppState の値の数', w=100),
 dict(n=S['listening']['subQuestions'] + S['grammar']['subQuestions'], u='問', l='演習の小問', how=f"リスニング{S['listening']['subQuestions']}・英文法{S['grammar']['subQuestions']}（教科データを実行して数えた）", w=100),
 dict(n=S['vocab'], u='語', l='英単語', how='VOCABULARY_COUNT（生成ファイル）', w=100),
 dict(n=S['testCases'], u='件', l='自動テストの確認', how=f"vitest list の件数（{S['testFiles']}ファイル）", w=100),
]

def svg_icon(k, x, y, s=22):
    return f'<g transform="translate({x},{y}) scale({s/24})"><g class="ic">{icons[k]}</g></g>'

# しくみの図（SVG）
W, H = 1180, 560
pos = {
 'boot': (40, 70), 'screen': (330, 70), 'battle': (330, 230), 'logic': (620, 70), 'content': (620, 230), 'net': (910, 70),
 'server': (910, 230), 'native': (40, 230), 'assets': (40, 420), 'tools': (330, 420), 'test': (620, 420), 'docs': (910, 420),
}
BW, BH = 230, 108
# 矢印は「使う」向き。交差・箱の貫通を避けるため1本ずつ道を決める
EDGES = [
 ('boot','screen',   'M270 124 L330 124'),
 ('screen','logic',  'M560 124 L620 124'),
 ('logic','net',     'M850 124 L910 124'),
 ('screen','battle', 'M445 178 L445 230'),
 ('logic','content', 'M735 178 L735 230'),
 ('net','server',    'M1025 178 L1025 230'),
 ('battle','content','M560 284 L620 284'),
 ('battle','logic',  'M540 230 C540 204 640 204 640 178'),
 ('battle','server', 'M445 338 L445 346 Q445 352 451 352 L1019 352 Q1025 352 1025 346 L1025 338'),
 ('native','boot',   'M155 230 L155 178'),
 ('assets','screen', 'M210 420 L210 392 Q210 384 218 384 L292 384 Q300 384 300 376 L300 158 Q300 150 308 150 L330 150'),
 ('tools','assets',  'M330 474 L270 474'),
 ('tools','content', 'M530 420 L530 400 Q530 392 538 392 L707 392 Q715 392 715 384 L715 338'),
 ('test','content',  'M760 420 L760 338'),
]
FLOWPATHS = {('boot','screen'),('screen','logic'),('logic','net'),('net','server'),('battle','server')}
def diagram(eng=False, static=False):
    out = [f'<svg class="diagram" viewBox="0 0 {W} {H}" role="group" aria-label="アプリのしくみの図。箱を選ぶとその部分のファイルに絞り込めます">',
           '<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#9fb3cc"/></marker></defs>']
    out.append(f'<rect class="zone" x="20" y="44" width="{W-40}" height="316" rx="24"/><text class="zone-t" x="40" y="34">アプリとして動く部分</text>')
    out.append(f'<rect class="zone" x="20" y="396" width="{W-40}" height="150" rx="24"/><text class="zone-t" x="40" y="386">作る・確かめる・残す部分（アプリには入らない）</text>')
    for i, (a, b, d) in enumerate(EDGES):
        out.append(f'<path class="edge" data-a="{a}" data-b="{b}" d="{d}" marker-end="url(#ah)" style="--d:{.35 + i*.05:.2f}s"/>')
        if not static and (a, b) in FLOWPATHS: out.append(f'<path class="edge-flow" d="{d}"/>')
    for k, s in enumerate(SYS):
        x, y = pos[s['id']]; n = S['sys'].get(s['id'], 0)
        out.append(f'<g class="node" tabindex="0" role="button" aria-pressed="false" data-sys="{s["id"]}" style="--d:{.1 + k*.05:.2f}s" aria-label="{s["label"]}（{n}件）で絞り込む">'
                   f'<rect class="box" x="{x}" y="{y}" width="{BW}" height="{BH}" rx="18"/>'
                   + svg_icon(s['icon'], x + 18, y + 18) +
                   f'<text class="t" x="{x + 50}" y="{y + 36}">{s["label"]}</text>'
                   f'<text class="s" x="{x + 18}" y="{y + 66}">{s["eng"] if eng else s["sub"]}</text>'
                   f'<text class="n" x="{x + 18}" y="{y + 90}">{n:,} ファイル</text></g>')
    out.append('</svg>')
    return ''.join(out)

def narrow_nodes():
    out = []
    for zone, ids in [('アプリとして動く部分', ['boot','screen','battle','logic','content','net','server','native']), ('作る・確かめる・残す部分', ['assets','tools','test','docs'])]:
        out.append(f'<p class="nz">{zone}</p>')
        for i in ids:
            sx = next(x for x in SYS if x['id'] == i)
            out.append(f'<button class="node nb" data-sys="{i}" aria-pressed="false">{ico(sx["icon"])}<b>{sx["label"]}</b><span class="gen-only">{sx["sub"]}</span><span class="eng-only">{sx["eng"]}</span><em>{S["sys"].get(i,0):,}</em></button>')
    return ''.join(out)

def bars(items, total=None, color='var(--blue)'):
    mx = max(v for _, _, v in items)
    return ''.join(f'<div class="hbar"><span class="lab">{ic}{lab}</span><span class="tr"><i style="--w:{max(1.5, v/mx*100):.1f}%;--c:{color};--d:{.15 + i*.06:.2f}s"></i></span><span class="v">{v:,}</span></div>'
                   for i, (lab, ic, v) in enumerate(items))

def ico(k): return f'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">{icons[k]}</svg>'

def html_page():
    maxLines = max(c['lines'] for c in cards if c['kind'] == 'file')
    data = dict(cards=cards, stats=stats, icons=icons, tags=TAGS, sys=SYS, sysLabel=SYS_LABEL, flowSteps=FLOW, synonyms={k.lower(): v for k, v in SYN.items()}, maxLines=maxLines)
    tagbars = bars([(t['label'], ico(t['icon']), S['tags'].get(t['label'], 0)) for t in sorted(TAGS, key=lambda t: -S['tags'].get(t['label'], 0))])
    folderbars = bars([(k, ico('folder'), v) for k, v in list(S['folders'].items())[:9]], color='var(--navy)')
    stat_html = ''.join(f'<div class="stat rv" style="--d:{.25 + i*.07:.2f}s"><div class="num"><span class="cu" data-to="{x["n"]}" data-final="{x["n"]:,}">{x["n"]:,}</span><small>{x["u"]}</small></div><div class="lbl">{x["l"]}</div><div class="how">{x["how"]}</div></div>' for i, x in enumerate(NUMS))
    flow_html = ''.join(f'<button class="step rv" data-flow="{f["id"]}" aria-pressed="false" style="--d:{.1 + i*.08:.2f}s">{ico(f["icon"])}<b>{i+1}. {f["label"]}</b><span>{f["sub"]}</span><em>{S["flow"][f["id"]]} 枚が関係</em></button>' for i, f in enumerate(FLOW))
    gl_html = ''.join(f'<div class="gl"><b>{g["term"]}</b><span>{g["plain"]}</span><code>{g["where"]}</code></div>' for g in gloss)
    css = open(f'{G}/site/style.css').read()
    js = open(f'{G}/site/app.js').read()
    lowc = [c for c in cards if c['conf'] == '低']
    body = f'''
<a class="sr-only" href="#atlas">図鑑の一覧へ移動</a>
<header class="top">
  <div class="brand">{ico('book')}<span>コードの図鑑</span></div>
  <div class="audience" role="group" aria-label="説明の向き">
    <button data-aud="gen" aria-pressed="true">{ico('users')}一般向け</button>
    <button data-aud="eng" aria-pressed="false">{ico('eng')}エンジニア向け</button>
  </div>
  <span class="asof">{S['asOf']}・{S['branch']} @{S['commit']}（{S['commitDate']}）</span>
</header>
<main>
<section class="hero" aria-labelledby="h1">
  <div>
    <h1 id="h1"><span data-kt="" data-kt-step="38">マナトビ</span> <span data-kt="" data-kt-step="38" data-kt-delay=".15" style="white-space:nowrap">リスニングの</span><br><span class="accent" data-kt="pop" data-kt-delay=".45" data-kt-step="60">コードの図鑑</span></h1>
    <p class="lead rv" style="--d:.9s"><span class="gen-only">共通テストの英語リスニングを「解く → わかる → 復習 → 競う」で学ぶアプリ。その中身の {S['tracked']:,} 個のファイルが、それぞれ何の係なのかを1枚ずつのカードにしました。</span><span class="eng-only">React 19 + TypeScript + Vite の Web アプリを Capacitor で iOS / Android に包み、Firebase（Auth・Firestore・Functions）で同期と対戦を行う構成。追跡ファイル {S['tracked']:,} 件を、個別カード {S['cardsFile']} 枚と束ね {S['cardsBundle']} 枚に分類。</span></p>
  </div>
  <div class="guide rv" style="--d:1.1s"><p class="bubble">気になる箱やことばを押してみてね。案内するよ。</p><img src="{MASCOT['basic']}" width="150" height="159" alt="案内役のとびら君"></div>
</section>
<section class="stats" aria-label="数字で見る">{stat_html}</section>
<p class="asof-note">数字はすべて {S['asOf']}（{S['branch']} ブランチ @{S['commit']}）。数え方は各数字の下と research.md に記録。</p>

<section class="sec" id="system" aria-labelledby="h-sys">
  <div class="sec-h"><span class="no">01</span><h2 id="h-sys" data-kt="">しくみの図</h2></div>
  <p class="sec-sub">箱はファイルのまとまり、矢印は「使う」向き。箱を押すと、その部分のカードだけに絞り込みます。</p>
  <div class="diagram-wrap"><div class="dg-wide"><div class="gen-only">{diagram(False)}</div><div class="eng-only">{diagram(True)}</div></div>
  <div class="dg-narrow" role="group" aria-label="アプリのしくみ（箱を選ぶと絞り込み）">{narrow_nodes()}</div>
  <p class="diagram-hint">{ico('filter')}もう一度押すと絞り込みを外します。点線の流れは、画面からサーバーまでデータが流れる主な道です。</p></div>
</section>

<section class="sec" id="flow" aria-labelledby="h-flow">
  <div class="sec-h"><span class="no">02</span><h2 id="h-flow" data-kt="">ユーザーの流れから探す</h2></div>
  <p class="sec-sub">使う人が通る4つの場面。押すと、その場面に関係するカードが明るく光ります。</p>
  <div class="flow">{flow_html}</div>
</section>

<section class="sec" id="atlas" aria-labelledby="h-atlas">
  <div class="sec-h"><span class="no">03</span><h2 id="h-atlas" data-kt="">図鑑</h2></div>
  <p class="sec-sub">左はフォルダの木、右はカード。ファイル名でも「対戦」「復習」のような機能の言葉でも探せます（<kbd>/</kbd> で検索欄へ）。</p>
  <div class="toolbar">
    <label class="search">{ico('search')}<span class="sr-only">ファイル名や機能で探す</span><input id="q" type="search" placeholder="例：対戦、復習、採点、firebase.ts" autocomplete="off"></label>
    <div class="chips" id="chips" role="group" aria-label="種別タグで絞り込む"></div>
  </div>
  <p class="status" id="status" aria-live="polite"></p>
  <div class="atlas">
    <nav class="tree" id="tree" aria-label="フォルダの木"></nav>
    <div><div class="list" id="list"></div><div class="more" id="more"><button type="button">さらに表示</button></div></div>
  </div>
</section>

<section class="sec" id="dist" aria-labelledby="h-dist">
  <div class="sec-h"><span class="no">04</span><h2 id="h-dist" data-kt="">数の内訳</h2></div>
  <p class="sec-sub">種別タグ・フォルダごとのファイル数（束ねたものは中の件数で数える）。</p>
  <div class="dist"><div class="panel"><h3>種別タグ</h3>{tagbars}</div><div class="panel"><h3>フォルダ（上位9）</h3>{folderbars}</div></div>
</section>

<section class="sec" id="gloss" aria-labelledby="h-gloss">
  <div class="sec-h"><span class="no">05</span><h2 id="h-gloss" data-kt="">ことばの言いかえ表</h2></div>
  <p class="sec-sub">一般向けとエンジニア向けで同じものを指すよう、この表の言いかえで統一しています。</p>
  <div class="gloss">{gl_html}</div>
</section>

<section class="sec" id="todo" aria-labelledby="h-todo">
  <div class="sec-h"><span class="no">06</span><h2 id="h-todo">要確認のもの</h2></div>
  <p class="sec-sub">コードから使い道を確かめられなかったもの（確信度「低」）。推測では書いていません。</p>
  <div class="list">{''.join(f'<button class="item" data-id="{c["id"]}" onclick="__zukan.openCard(this.dataset.id)"><span class="row"><span class="conf low">{ico("alert")}要確認</span></span><span class="nm">{c["name"]}</span><span class="one">{c["one"]}</span><span class="meta"><span>{c["path"]}</span></span></button>' for c in lowc)}</div>
</section>
</main>
<footer class="foot"><span>作成：コードを読んで書いた説明だけを載せています（推測・AI画像なし）。</span><span>秘密の値・個人情報・内部のURLは載せていません。</span><span>アイコン：lucide（ISC）／書体：M PLUS Rounded 1c・JetBrains Mono（OFL）</span></footer>
<div id="sheet-back" class="sheet-back" hidden></div>
<aside id="sheet" class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" hidden></aside>
'''
    return body, css, js, data

def font_faces(text):
    chars = set(text) | set('0123456789０１２３４５６７８９,.%/:-+()（）「」・、。ー〜ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')
    ff = []
    for w, f in [(400, 'Regular'), (700, 'Bold'), (800, 'ExtraBold')]:
        ft = TTFont(f'{FONTS}/MPLUSRounded1c-{f}.ttf')
        opt = subset.Options(); opt.flavor = 'woff2'; opt.layout_features = ['palt', 'kern', 'liga']
        sub = subset.Subsetter(opt); sub.populate(text=''.join(chars)); sub.subset(ft)
        b = io.BytesIO(); ft.flavor = 'woff2'; ft.save(b)
        ff.append(f'@font-face{{font-family:"MPR";font-weight:{w};font-display:swap;src:url(data:font/woff2;base64,{base64.b64encode(b.getvalue()).decode()}) format("woff2")}}')
    ft = TTFont(f'{FONTS}/JetBrainsMono.ttf')
    opt = subset.Options(); opt.flavor = 'woff2'
    sub = subset.Subsetter(opt); sub.populate(text=''.join(chr(c) for c in range(32, 127)) + '×→'); sub.subset(ft)
    b = io.BytesIO(); ft.flavor = 'woff2'; ft.save(b)
    ff.append(f'@font-face{{font-family:"JBM";font-weight:100 800;font-display:swap;src:url(data:font/woff2;base64,{base64.b64encode(b.getvalue()).decode()}) format("woff2")}}')
    return '\n'.join(ff)

if __name__ == '__main__':
    body, css, js, data = html_page()
    dj = json.dumps(data, ensure_ascii=False).replace('</', '<\\/')
    fonts = font_faces(body + css + js + dj)
    page = f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'none'">
<title>コードの図鑑 — マナトビ リスニング（{S['asOf']}）</title>
<style>{fonts}
{css}</style></head><body>{body}
<script>window.__DATA__={dj};</script><script>{js}</script></body></html>'''
    out = sys.argv[1] if len(sys.argv) > 1 else f'{G}/interactive.html'
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, 'w').write(page)
    print(out, f'{len(page)/1024:.0f} KB')
