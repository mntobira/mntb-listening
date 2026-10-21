#!/usr/bin/env python3
"""ElevenLabs 原稿の PDF を作る（コピペしやすい形）。

  python3 scripts/vocab-audio/make_pdf.py      → docs/elevenlabs_vocab/ElevenLabs_英単語_原稿.pdf

■ コピペで失敗しないための作り
  ・1回分（約30語）を1つの枠にまとめ、枠の途中でページを切らない（1回分が必ず1ページに収まる）
  ・1語＝1行。行の途中で折り返さない（長い熟語も1行）
  ・原稿の文字は PDF の中で本物の文字として入れる（画像にしない）。
    作ったあと pdftotext で全194回を取り出し、原稿ファイルと1文字ずつ同じか確かめる（違えば止める）
  ・合字（fi・fl）や引用符の自動変換が起きないフォントと設定（コピーしたときに文字が変わらない）
  ・見出しに「保存するファイル名」を大きく出す
"""
import asyncio, html, json, os, re, subprocess, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DIR = os.path.join(ROOT, 'docs', 'elevenlabs_vocab')
OUT = os.path.join(DIR, 'ElevenLabs_英単語_原稿.pdf')
TMP = os.path.join(ROOT, '.tmpwork', 'elevenlabs_pdf')
LEVEL_LABEL = {'lv1': '単語 Lv1（共通テスト6割〜）', 'lv2': '単語 Lv2（共通テスト8割〜）', 'lv3': '単語 Lv3（2次試験レベル）',
               'lv4': '単語 Lv4（2次試験の追加語彙）', 'ilv1': '熟語 Lv1', 'ilv2': '熟語 Lv2', 'ilv3': '熟語 Lv3'}
ORDER = ['lv1', 'lv2', 'lv3', 'lv4', 'ilv1', 'ilv2', 'ilv3']

CSS = r"""
@page { size: A4; margin: 12mm 12mm 13mm 12mm; }
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Noto Sans CJK JP', sans-serif; color: #1d2b36; font-size: 10.5pt; line-height: 1.6;
       font-variant-ligatures: none; font-feature-settings: "liga" 0, "clig" 0, "dlig" 0, "calt" 0; }
h1 { font-size: 19pt; margin: 0 0 4mm; color: #0f5c63; }
h2 { font-size: 13pt; margin: 6mm 0 2mm; color: #0f5c63; border-bottom: 1.5px solid #0f5c63; padding-bottom: 1mm; }
p, li { margin: 1.2mm 0; }
ol, ul { padding-left: 6mm; margin: 1mm 0; }
.warn { background: #fff4e5; border: 1.5px solid #f0a040; border-radius: 3mm; padding: 2.5mm 4mm; margin: 3mm 0; }
.ok { background: #eef7f1; border: 1.5px solid #4caf73; border-radius: 3mm; padding: 2.5mm 4mm; margin: 3mm 0; }
table { border-collapse: collapse; width: 100%; margin: 2mm 0; }
td, th { border: 1px solid #c8d3da; padding: 1.2mm 2.5mm; text-align: left; font-size: 10pt; }
th { background: #eef4f6; }
code, .mono { font-family: 'DejaVu Sans Mono', monospace; font-size: 9.5pt; }
.page { page-break-after: always; }
.batch { page-break-inside: avoid; break-inside: avoid; page-break-before: always; }
.bh { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #0f5c63; padding-bottom: 1.2mm; margin-bottom: 2mm; }
.bh .no { font-size: 9.5pt; color: #5d6d7e; }
.file { font-size: 15pt; font-weight: 700; color: #0f5c63; font-family: 'DejaVu Sans Mono', monospace; }
.meta { font-size: 9.5pt; color: #5d6d7e; margin: 0 0 2mm; }
.box { border: 2px dashed #0f5c63; border-radius: 2.5mm; padding: 2.5mm 3.5mm; background: #fbfdfd; }
.box .tag { font-size: 8.5pt; color: #0f5c63; margin: 0 0 1mm; font-family: 'Noto Sans CJK JP', sans-serif; }
.script { font-family: 'DejaVu Sans Mono', monospace; font-size: 9.3pt; line-height: 1.5; white-space: pre; margin: 0; }
.done { margin-top: 2mm; font-size: 9.5pt; color: #5d6d7e; }
.done span { display: inline-block; border: 1.5px solid #8895a0; width: 4mm; height: 4mm; vertical-align: -0.6mm; margin: 0 1.5mm 0 4mm; border-radius: 1mm; }
.idx td { font-size: 9pt; padding: 0.8mm 2mm; }
"""


def intro(manifest):
    by = {lv: [k for k, v in manifest.items() if v['level'] == lv] for lv in ORDER}
    words = {lv: sum(len(manifest[k]['ids']) for k in by[lv]) for lv in ORDER}
    rows = ''.join(f'<tr><td>{html.escape(LEVEL_LABEL[lv])}</td><td>{words[lv]:,} 語</td><td>{len(by[lv])} 回</td>'
                   f'<td class="mono">{by[lv][0]} 〜 {by[lv][-1]}</td></tr>' for lv in ORDER)
    total_w = sum(words.values()); total_b = len(manifest)
    return f"""
<section class="page">
<h1>ElevenLabs 読み上げ原稿　英単語帳 全 {total_w:,} 語</h1>
<p>アプリの英単語帳・英単語4択の🔊を、ElevenLabs の声にするための原稿です。<b>1回＝約30語、全 {total_b} 回</b>。
1回ずつ、<b>点線の枠の中を全部コピーして貼る → 生成 → 見出しのファイル名で保存</b>、をくり返してください。</p>
<div class="ok"><b>一部ずつ送ってもらって大丈夫です。</b>録音が届いた語から録音で鳴り、まだの語は今までどおり端末の読み上げで鳴ります。
よく使う <b>単語 Lv1</b> から順に送ってもらえると、早く効果が出ます。</div>
<table><tr><th>レベル</th><th>語数</th><th>回数</th><th>回の名前</th></tr>{rows}</table>

<h2>1. ElevenLabs の設定（全部の回で同じにする）</h2>
<table>
<tr><th style="width:32%">項目</th><th>設定</th></tr>
<tr><td>画面</td><td>Text to Speech</td></tr>
<tr><td>モデル</td><td><b>Eleven Multilingual v2</b><br>※ v3・v4 は「間」の指定（&lt;break&gt;）が使えないので<b>使わない</b>（1語ずつに切れなくなります）</td></tr>
<tr><td>声</td><td><b>アメリカ英語のはっきりした声を1つ決めて、最後まで変えない</b>（途中で変えると単語ごとに声が違って聞こえる）。
「えー」「あー」が入りやすい声は避ける</td></tr>
<tr><td>Stability</td><td>60〜70%（毎回同じ調子で読ませる）</td></tr>
<tr><td>Similarity</td><td>75%</td></tr>
<tr><td>Style exaggeration</td><td>0%</td></tr>
<tr><td>Speaker boost</td><td>オン</td></tr>
<tr><td>Speed</td><td>0.9（単語帳なので少しゆっくり）</td></tr>
<tr><td>ダウンロード</td><td>MP3（128kbps 以上）。WAV でも可</td></tr>
</table>

<h2>2. 1回ごとの手順</h2>
<ol>
<li>次の回のページを開き、<b>点線の枠の中を全部</b>選んでコピー（1行目から最後の行まで。見出しやファイル名は入れない）</li>
<li>ElevenLabs の入力欄を<b>空にしてから</b>貼る（前の回の文が残っていると、語の数が合わなくなる）</li>
<li>生成 → 最後まで聞く（読み飛ばし・言い直し・2語がくっついていないか）</li>
<li>気になったら、その回だけもう一度生成（何回やり直してもよい）</li>
<li><b>見出しのファイル名で保存</b>（例 <code>lv1_0001-0030.mp3</code>）。名前を付け忘れても、こちらでたいてい見分けられます</li>
<li>何回分かたまったら、まとめて送る（zip でもフォルダでも）</li>
</ol>

<h2>3. よくある失敗と、こちらの対応</h2>
<table>
<tr><th style="width:38%">起きること</th><th>どうなるか・どうするか</th></tr>
<tr><td>読み飛ばし・言い直し・語が多い</td><td>こちらで語の数と間の数を数え、<b>合わない回は切らずにお知らせ</b>します（ずれた音を入れない）。その回だけ作り直しをお願いします</td></tr>
<tr><td>間が短くなる・速くなる</td><td>1回を30語にして間の数を減らしてあります（ElevenLabs 公式：間が多すぎると速くなる・雑音が入る）。それでも起きたら Stability を上げて作り直し</td></tr>
<tr><td>枠の外（見出し）まで貼ってしまった</td><td>見出しの日本語まで読まれ、語の数が合わなくなります。<b>枠の中だけ</b>を貼ってください</td></tr>
<tr><td>同じ回を2回送った</td><td>新しい方を使います</td></tr>
<tr><td>ファイル名を付け忘れた</td><td>語の長さの並びで回を判断します。はっきり決まらないものは名前を聞きます</td></tr>
<tr><td>文字数（クレジット）が足りない</td><td>レベルごとに分けて進めてください（読む英語は全部で約 5.6 万文字。間の指定まで数えられる場合は最大 約 18 万文字）</td></tr>
</table>

<h2>4. 原稿の読み方の決まり</h2>
<ul>
<li><code>—</code>（ダッシュ）は「ここに語句が入る」場所。少し間を空けて読まれます（例 <code>so — that.</code>）</li>
<li><code>A</code> <code>B</code> は「A を B に」の A・B。そのまま「エー」「ビー」と読まれます（例 <code>prefer A to B.</code>）</li>
<li><code>someone</code> <code>something</code> <code>doing</code> は、単語帳の「人」「物」「～ing」です</li>
<li><code>&lt;break time="1.2s" /&gt;</code> は 1.2 秒の間の指定。<b>消さずにそのまま</b>貼ってください（これを目印に1語ずつ切ります）</li>
</ul>
</section>
"""


def index_page(manifest):
    names = list(manifest)
    rows = ''
    for i in range(0, len(names), 3):
        cells = ''
        for n in names[i:i + 3]:
            m = manifest[n]
            cells += f'<td class="mono">□ {n}</td><td>{html.escape(m["words"][0])} 〜 {html.escape(m["words"][-1])}</td>'
        rows += f'<tr>{cells}</tr>'
    return f'<section class="page"><h2>回の一覧（済んだら □ に印を）</h2><table class="idx">{rows}</table></section>'


def batch_page(i, n, name, m, text):
    lv = m['level']
    return f"""
<section class="batch">
<div class="bh"><span class="file">{name}.mp3</span><span class="no">{i} / {n} 回目</span></div>
<p class="meta">{html.escape(LEVEL_LABEL[lv])}　No.{m['from']}〜{m['to']}（{len(m['ids'])}語）　↓ 点線の枠の中だけを全部コピーして貼る</p>
<div class="box"><pre class="script">{html.escape(text)}</pre></div>
<p class="done">保存した<span></span>　送った<span></span></p>
</section>"""


def normalize(t):
    return re.sub(r'\s+', ' ', t).strip()


async def render(html_path, pdf_path):
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-dev-shm-usage', '--disable-gpu'])
        pg = await b.new_page()
        await pg.goto('file://' + html_path, wait_until='load')
        await pg.evaluate('document.fonts.ready')
        # 1回分が1ページに収まっているか（はみ出すとページの境目で切れて、コピーしにくい）
        over = await pg.evaluate("""() => { const mm = 96/25.4, pageH = (297-12-13)*mm;
          return [...document.querySelectorAll('.batch')].filter(s => s.getBoundingClientRect().height > pageH).map(s => s.querySelector('.file').textContent); }""")
        if over:
            raise SystemExit(f'1ページに収まらない回があります: {over[:5]}')
        await pg.pdf(path=pdf_path, format='A4', print_background=True, prefer_css_page_size=True)
        await b.close()


def verify(pdf_path, manifest, texts):
    """PDF から文字を取り出し、全部の回が原稿ファイルと同じか確かめる"""
    out = subprocess.run(['pdftotext', '-layout', pdf_path, '-'], capture_output=True, text=True).stdout
    flat = normalize(out.replace('\f', ' '))
    bad = []
    for name in manifest:
        want = normalize(texts[name])
        if want not in flat:
            bad.append(name)
    lig = [c for c in ('ﬁ', 'ﬂ', 'ﬀ', '“', '”', '’') if c in out]
    return bad, lig


def main():
    manifest = json.load(open(os.path.join(DIR, 'manifest.json')))
    texts = {n: open(os.path.join(DIR, 'batches', n + '.txt')).read().rstrip('\n') for n in manifest}
    n = len(manifest)
    body = intro(manifest) + index_page(manifest) + ''.join(batch_page(i + 1, n, name, manifest[name], texts[name]) for i, name in enumerate(manifest))
    os.makedirs(TMP, exist_ok=True)
    hp = os.path.join(TMP, 'prompts.html')
    open(hp, 'w').write(f'<!doctype html><html lang="ja"><meta charset="utf-8"><style>{CSS}</style><body>{body}</body></html>')
    asyncio.run(render(hp, OUT))
    bad, lig = verify(OUT, manifest, texts)
    if bad or lig:
        raise SystemExit(f'PDF の文字が原稿と違います: 回 {bad[:5]} / 置き換わった文字 {lig}')
    pages = subprocess.run(['pdfinfo', OUT], capture_output=True, text=True).stdout
    pg = re.search(r'Pages:\s+(\d+)', pages)
    print(f'{os.path.relpath(OUT, ROOT)}  {pg.group(1) if pg else "?"} ページ。全 {n} 回、PDF から取り出した文字が原稿と一致')


if __name__ == '__main__':
    main()
