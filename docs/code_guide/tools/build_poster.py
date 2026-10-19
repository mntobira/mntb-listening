"""poster.html → poster.png（縦長・幅1800px）。層1〜3（目的・規模の数字・しくみの図）だけ。個別ファイルは出さない。"""
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
import build_site as B
G = B.G; S = B.S; icons = B.icons
ico = lambda k, s=40, c='currentColor': f'<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="{c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{icons[k]}</svg>'

FOLDERS = [  # フォルダ単位のアイコン（層3の補足）
 ('src', 'boot', 'アプリ本体', '画面・計算・通信のコード'),
 ('public', 'assets', '配る素材', '音声・イラスト・プリント'),
 ('tests', 'test', '自動テスト', '決まりどおりか確かめる'),
 ('functions', 'server', 'サーバー処理', 'クラン集計・リーグの締め'),
 ('scripts', 'tools', '作る道具', '問題・音源・アイコンを作る'),
 ('docs', 'docs', '資料', '設計の理由と公開手順'),
 ('ios / android', 'native', 'スマホアプリ', 'App Store・Google Play 版'),
 ('audio_sources', 'audio', '音源の原本', '保管用（アプリに入らない）'),
]
def fcount(name):
    if name == 'ios / android': return S['folders'].get('ios', 0) + S['folders'].get('android', 0)
    return S['folders'].get(name, 0)

def page():
    css = open(f'{G}/site/style.css').read()
    big = [
     (S['tracked'], '件', 'ファイル', 'Gitで管理している数'),
     (S['srcLines'], '行', 'アプリ本体のコード', 'src/ の改行数'),
     (S['screens'], '種類', '画面', 'アプリの行き先'),
     (S['listening']['subQuestions'] + S['grammar']['subQuestions'], '問', '演習の小問', f"リスニング{S['listening']['subQuestions']}＋英文法{S['grammar']['subQuestions']}"),
     (S['vocab'], '語', '英単語', '単語帳の収録数'),
     (S['battleTotal'], '問', '対戦の出題', '3教科の出題プール'),
     (S['audio'], '本', 'リスニング音源', '音源台帳の件数'),
     (S['testCases'], '件', 'テストの確認', f"{S['testFiles']}ファイル"),
    ]
    nums = ''.join(f'<div class="pn"><div class="pv">{n:,}<small>{u}</small></div><div class="pl">{l}</div><div class="ph">{h}</div></div>' for n, u, l, h in big)
    flds = ''.join(f'<div class="pf">{ico(i, 44, "#2458a6")}<div><b>{n}</b><span>{l} — {d}</span></div><em>{fcount(n):,}</em></div>' for n, i, l, d in FOLDERS)
    flow = ''.join(f'<div class="pfl">{ico(f["icon"], 46, "#2458a6")}<b>{k+1}. {f["label"]}</b><span>{f["sub"]}</span></div>' + ('<div class="parr">→</div>' if k < 3 else '') for k, f in enumerate(B.FLOW))
    return f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>{B.font_faces("".join(map(str, big)) + flds + flow + "マナトビ リスニング コードの図鑑 何をするアプリか 数字で見る規模 しくみの図 アプリとして動く部分 作る・確かめる・残す部分（アプリには入らない） 箱はファイルのまとまり、矢印は「使う」向き フォルダの役割 案内役 とびら君 数え方は research.md に記録 時点 共通テストの英語リスニングを、解いて・わかって・復習して・競って身につけるアプリです。1つ1つのファイルを「〜をする係」として説明した図鑑の全体図です。" + S["asOf"] + S["branch"] + S["commit"] + S["commitDate"] + "".join(s["label"] + s["sub"] for s in B.SYS) + "0123456789,ファイル")}
{css}
html,body{{width:1800px;background:var(--paper)}}
body{{padding:96px 110px 90px;font-size:26px}}
.ph1{{font-size:120px;line-height:1.08;margin:0;font-weight:800;color:var(--navy);letter-spacing:.01em}}
.ph1 span{{color:var(--blue)}}
.pkick{{font-size:30px;font-weight:800;color:var(--orange);letter-spacing:.12em;margin-bottom:22px;display:flex;gap:14px;align-items:center}}
.plead{{font-size:34px;line-height:1.7;color:var(--ink-2);margin:34px 0 0;max-width:1080px}}
.phero{{display:grid;grid-template-columns:1fr 360px;gap:40px;align-items:end}}
.phero img{{width:330px;filter:drop-shadow(0 18px 26px rgba(28,42,57,.16))}}
.pbub{{font-size:26px;background:#fff;border:3px solid var(--line);border-radius:28px;padding:18px 24px;color:var(--ink-2);margin-bottom:18px;line-height:1.6}}
.psec{{margin-top:96px}}
.psh{{display:flex;align-items:baseline;gap:20px;margin-bottom:30px}}
.psh .no{{font-family:var(--mono);color:var(--orange);font-size:30px;font-weight:700}}
.psh h2{{margin:0;font-size:58px;color:var(--navy);font-weight:800}}
.psh p{{margin:0 0 0 auto;font-size:24px;color:var(--ink-3)}}
.pflow{{display:flex;align-items:stretch;gap:14px}}
.pfl{{flex:1;background:#fff;border:3px solid var(--line);border-radius:30px;padding:30px 28px;display:grid;gap:10px;box-shadow:var(--shadow)}}
.pfl b{{font-size:44px;color:var(--navy)}}
.pfl span{{font-size:25px;color:var(--ink-2);line-height:1.5}}
.parr{{align-self:center;font-size:48px;color:var(--orange);font-weight:800}}
.pnums{{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}}
.pn{{background:#fff;border:3px solid var(--line);border-radius:30px;padding:30px 32px 28px;box-shadow:var(--shadow)}}
.pv{{font-size:76px;font-weight:800;color:var(--navy);line-height:1.05;font-variant-numeric:tabular-nums}}
.pv small{{font-size:30px;color:var(--ink-3);margin-left:6px}}
.pl{{font-size:32px;font-weight:800;color:var(--ink);margin-top:10px}}
.ph{{font-size:22px;color:var(--ink-3);margin-top:6px}}
.pdiag{{background:var(--paper-2);border:3px solid var(--line);border-radius:36px;padding:28px}}
.pdiag .node .t{{font-size:17px}} .pdiag .node .s{{font-size:13.5px}} .pdiag .node .n{{font-size:13.5px}} .pdiag .zone-t{{font-size:14px}}
.pfold{{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:26px}}
.pf{{background:#fff;border:3px solid var(--line);border-radius:26px;padding:22px 26px;display:grid;grid-template-columns:auto 1fr auto;gap:20px;align-items:center}}
.pf b{{font-size:30px;color:var(--navy);display:block;font-family:var(--mono)}}
.pf span{{font-size:23px;color:var(--ink-2)}}
.pf em{{font-style:normal;font-family:var(--mono);font-size:30px;color:var(--blue);font-weight:700}}
.pfoot{{margin-top:70px;padding-top:28px;border-top:3px solid var(--line);font-size:22px;color:var(--ink-3);display:flex;justify-content:space-between;gap:20px}}
</style></head><body>
<div class="phero"><div>
<div class="pkick">{ico('book', 34, '#a65400')}CODE ATLAS ／ {S['asOf']}</div>
<h1 class="ph1">マナトビ リスニング<br><span>コードの図鑑</span></h1>
<p class="plead">共通テストの英語リスニングを、解いて・わかって・復習して・競って身につけるアプリです。1つ1つのファイルを「〜をする係」として説明した図鑑の全体図です。</p>
</div><div><p class="pbub">全体の地図はこの1枚。くわしくは図鑑のカードで見てね。</p><img src="{B.MASCOT['studying']}" alt="とびら君"></div></div>

<section class="psec"><div class="psh"><span class="no">01</span><h2>何をするアプリか</h2><p>使う人が通る4つの場面</p></div><div class="pflow">{flow}</div></section>

<section class="psec"><div class="psh"><span class="no">02</span><h2>数字で見る規模</h2><p>{S['asOf']}・{S['branch']} @{S['commit']}（{S['commitDate']}）</p></div><div class="pnums">{nums}</div></section>

<section class="psec"><div class="psh"><span class="no">03</span><h2>しくみの図</h2><p>箱はファイルのまとまり、矢印は「使う」向き</p></div>
<div class="pdiag">{B.diagram(False, static=True)}</div>
<div class="pfold">{flds}</div></section>

<div class="pfoot"><span>数え方は research.md に記録。数字はすべて {S['asOf']}。</span><span>案内役：とびら君（公式画像）／アイコン：lucide（ISC）</span></div>
</body></html>'''

if __name__ == '__main__':
    open(f'{B.WORK}/poster.html', 'w').write(page()); print('poster.html')
