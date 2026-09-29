#!/bin/sh
# ビルド起動ラッパー
#
# ■ 何をするスクリプトか
#   `npm run build` から呼ばれ、vite build を実行する。
#   ★ビルドの設定は一切変えない★（NODE_OPTIONS も足さない）。
#   やることは1つだけ: メモリが足りない環境を事前に検出して、
#   「なぜ落ちるのか」「どうすれば通るのか」を先に表示する。
#
# ■ なぜヒープ上限（--max-old-space-size）を付けないのか
#   付けても通らなかったため。実測（メモリ 985MB / swap 0）:
#     上限 512MiB → Killed(137)   上限 482MiB → Killed(137)
#     上限 443MiB → Killed(137)   上限 413MiB → FATAL: Reached heap limit
#   上限が大きいと OS に殺され（SIGKILL）、小さいと V8 が自死する（SIGABRT）。
#   成功する幅が無く、★ヒープ上限だけで成功したことは一度も無い★。
#   一方 swap を 4GB 足すと、コードも設定も変えずにそのまま成功する
#   （✓ built in 1m 6s / swap 使用量 210MB）。
#   したがって「効かない設定を残さない」方針で、上限指定は削除した。
#
# ■ これはアプリの問題ではなく環境の問題
#   ピーク RSS は約 780〜810MB。搭載 985MB から OS とツールの使用分を引くと
#   物理的に収まらない。本番（Vercel 等）は十分なメモリと swap があるため
#   元から問題は起きない。詳細と実測値は docs/BUILD.md を参照。
set -e

PROJECT_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$PROJECT_ROOT"

VITE="./node_modules/.bin/vite"

TOTAL_MIB=0
SWAP_MIB=0
if [ -r /proc/meminfo ]; then
  TOTAL_MIB=$(awk '/^MemTotal:/ {print int($2/1024)}' /proc/meminfo)
  SWAP_MIB=$(awk '/^SwapTotal:/ {print int($2/1024)}' /proc/meminfo)
fi

# 実測のピークは約 810MB。RAM+swap が 1400MiB を下回ると現実的に厳しい。
USABLE_MIB=$((TOTAL_MIB + SWAP_MIB))
if [ "$USABLE_MIB" -gt 0 ] && [ "$USABLE_MIB" -lt 1400 ]; then
  echo "[build] 警告: 利用可能メモリが ${USABLE_MIB}MiB です（RAM ${TOTAL_MIB}MiB / swap ${SWAP_MIB}MiB）。"
  echo "[build] このビルドはピークで約 810MB 使うため、途中で Killed になる可能性が高いです。"
  echo "[build] これはアプリの構造ではなく環境のメモリ不足です。swap を足すと確実に通ります:"
  echo "[build]   sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile \\"
  echo "[build]     && sudo mkswap /swapfile && sudo swapon /swapfile"
  echo "[build] 詳細は docs/BUILD.md を参照してください。ビルドはこのまま試行します。"
fi

exec "$VITE" build "$@"
