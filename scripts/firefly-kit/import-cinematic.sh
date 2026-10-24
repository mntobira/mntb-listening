#!/usr/bin/env bash
# 全画面の演出動画（クリーム背景のまま使う）を取り込む（2026-10-24）
#
#   使い方: bash scripts/firefly-kit/import-cinematic.sh <Firefly の原本.mp4> <名前> [開始秒] [長さ秒]
#     例:   bash scripts/firefly-kit/import-cinematic.sh ~/Downloads/C09.mp4 gacha_ur_finale 0 4
#
#   出力: public/cinematics/<名前>.mp4（720×720・24fps・H.264・音声なし・faststart）
#         public/cinematics/<名前>-poster.webp（1コマ目。読み込み中に出す）
#   1MB を超えたら止める（tests/cinematicClips.test.ts と同じ上限）。
set -euo pipefail
SRC="${1:?原本の動画を指定してください}"; NAME="${2:?名前（title / gacha_ur_finale など）}"
SS="${3:-0}"; DUR="${4:-}"
OUT="$(cd "$(dirname "$0")/../.." && pwd)/public/cinematics"; mkdir -p "$OUT"
CUT=(-ss "$SS"); [ -n "$DUR" ] && CUT+=(-t "$DUR")
ffmpeg -v error -y "${CUT[@]}" -i "$SRC" -an -vf "crop='min(iw,ih)':'min(iw,ih)',scale=720:720:flags=lanczos,fps=24,format=yuv420p" \
  -c:v libx264 -preset slow -crf 27 -movflags +faststart "$OUT/$NAME.mp4"
ffmpeg -v error -y -i "$OUT/$NAME.mp4" -frames:v 1 -c:v libwebp -q:v 80 "$OUT/$NAME-poster.webp"
size=$(stat -c %s "$OUT/$NAME.mp4"); echo "$NAME.mp4: $((size/1024)) KB"
[ "$size" -lt 1000000 ] || { echo "1MB を超えました。-crf を上げるか長さを短くしてください" >&2; exit 1; }
echo "OK → src/components/CinematicClip.tsx の CINEMATIC_CLIPS と docs/CINEMATICS.md の表を更新してください"
