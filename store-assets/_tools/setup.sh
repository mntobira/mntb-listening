#!/usr/bin/env bash
# 宣伝動画の道具を、新しい環境で使えるようにする（1回だけ）
#   bash store-assets/_tools/setup.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
# 1) 録画素材（Git LFS）を取り出す
if command -v git-lfs >/dev/null 2>&1 || git lfs version >/dev/null 2>&1; then git lfs install --local && git lfs pull --include "store-assets/**"; else echo "!! git-lfs が無いので録画素材が取り出せません（apt install git-lfs）"; fi
# 2) Python ライブラリ
pip install -q -r store-assets/_tools/requirements.txt
python3 -m playwright install chromium
# 3) ffmpeg と日本語フォント（Noto Sans CJK）
command -v ffmpeg >/dev/null || { echo "!! ffmpeg を入れてください（apt install ffmpeg）"; }
[ -f /usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc ] || { echo "!! 日本語フォントを入れてください（apt install fonts-noto-cjk fonts-noto-cjk-extra）"; }
echo "OK: 動作確認 → python3 store-assets/_tools/promo_vocab.py .tmpwork/vout reel --sheet"
