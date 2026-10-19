#!/usr/bin/env bash
# コードの図鑑を「今のコード」に合わせて作り直す（リファクタリングのたびに1回実行）
#   bash docs/code_guide/tools/update.sh            … 作り直し＋自己チェック
#   bash docs/code_guide/tools/update.sh --check    … ＋ブラウザでの動作確認
# 終わると data/sync.json と画面に「新しいファイル／消えたファイル／中身が変わったカード」が出る。
# それを見て cards/*.txt を直し、見直したカードは  python3 tools/build_cards.py --accept <パス...>  で確認済みにする。
set -euo pipefail
G="$(cd "$(dirname "$0")/.." && pwd)"; cd "$G"
W="$G/.work"; mkdir -p "$W/fonts"

# 道具の準備（初回だけ。すべて .work/ に置き、git には入れない）
python3 -c 'import fontTools' 2>/dev/null || pip install -q fonttools brotli
F="https://raw.githubusercontent.com/google/fonts/main/ofl"
for w in Regular Medium Bold ExtraBold; do
  [ -s "$W/fonts/MPLUSRounded1c-$w.ttf" ] || curl -fsSL -o "$W/fonts/MPLUSRounded1c-$w.ttf" "$F/mplusrounded1c/MPLUSRounded1c-$w.ttf"
done
[ -s "$W/fonts/JetBrainsMono.ttf" ] || curl -fsSL -o "$W/fonts/JetBrainsMono.ttf" "$F/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf"
if [ ! -d "$W/pw/node_modules/playwright" ]; then
  mkdir -p "$W/pw" && (cd "$W/pw" && echo '{"private":true}' > package.json && npm i -s playwright@1.64.1 && npx playwright install chromium >/dev/null)
fi

python3 tools/build_cards.py "$@"
python3 tools/enrich.py ${FAST:+--fast} > /dev/null
node tools/icons.mjs > /dev/null
python3 tools/build_maps.py
python3 tools/build_site.py
python3 tools/build_poster.py
python3 tools/build_pdf.py
node tools/render.mjs ${1:-}
python3 tools/selfcheck.py > "$W/selfcheck.log" || { cat "$W/selfcheck.log"; exit 1; }
python3 - <<'PY'
import json
s = json.load(open('data/sync.json')); c = json.load(open('data/selfcheck.json'))
print(f"\n== {s['branch']} @{s['commit']}（{s['date']}）")
print(f"新しいファイル {len(s['new'])}件（仮カード） / 消えたファイル {len(s['removed'])}件 / 見直し候補 {len(s['changed'])}件 / 空の束ね {len(s['emptyBundles'])}件")
for k in ('new', 'removed'):
    for p in s[k][:40]: print(f'  [{k}] {p}')
for x in s['changed'][:40]: print(f"  [changed] {x['path']}  … {x['why']}")
for p in s.get('unsorted', []): print(f'  [図の箱が未定] {p}  … tools/enrich.py の SYS に規則を足す')
print(f"自己チェック：エラー {len(c['errors'])}件・秘密の値 {c['secretsChecked']}個を照合し {len(c['secretsFound'])}件")
PY
