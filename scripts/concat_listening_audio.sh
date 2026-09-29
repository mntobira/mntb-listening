#!/bin/sh
# ※ 新しい音源の取り込みは scripts/listening-audio.mts（docs/LISTENING_AUDIO_REPLACE.md）を使う。
#   このスクリプトは 2026-09-06 の旧配布ZIP専用。
# 第4問B（4人の発話 s1〜s4）と 第5問 問32（A・B）の音声を 1 本に連結する。
#
# ■ なぜ連結するのか
#   アプリの音源トラック（audioTracks）は「小問1つ＝音源1本」の対応で
#   ListeningAudioPlayer が再生する。問26 と 問32 はどちらも
#   「複数の発話をまとめて聞いて 1 つ答える」設問なので、
#   本番と同じく 1 本の音声として続けて流す。
#   （配布側の指示：問32 は A→B の順に続けて再生・間は 0.5 秒程度）
#
# ■ 元ファイルは触らない
#   配布 ZIP の個別ファイルは解凍先に残し、public/ には連結後だけを置く。
#   録り直しが来たら該当の個別ファイルを差し替えてこのスクリプトを回す。
#
# 使い方: sh scripts/concat_listening_audio.sh <配布ZIPを解凍したフォルダ>
set -e
SRC="${1:-/tmp/lq}"
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

# 第4問B：4人 × 15セット → setNN_4B.mp3（発話間 1.2 秒）
for n in $(seq -w 1 15); do
  d="$SRC/第4問/新規/audio"
  out="$ROOT/public/listening_q4/set${n}_4B.mp3"
  ffmpeg -v error -y \
    -i "$d/set${n}_4B_s1.mp3" -i "$d/set${n}_4B_s2.mp3" \
    -i "$d/set${n}_4B_s3.mp3" -i "$d/set${n}_4B_s4.mp3" \
    -filter_complex "[0:a]apad=pad_dur=1.2[a0];[1:a]apad=pad_dur=1.2[a1];[2:a]apad=pad_dur=1.2[a2];[a0][a1][a2][3:a]concat=n=4:v=0:a=1[out]" \
    -map "[out]" -ar 44100 -ac 1 -b:a 128k "$out"
done

# 第5問 問32：A・B × 15セット → q5setNN_q32.mp3（間 0.6 秒）
for n in $(seq -w 1 15); do
  d="$SRC/第5問/新規/audio"
  out="$ROOT/public/listening_q5/q5set${n}_q32.mp3"
  ffmpeg -v error -y \
    -i "$d/q5set${n}_q32_A.mp3" -i "$d/q5set${n}_q32_B.mp3" \
    -filter_complex "[0:a]apad=pad_dur=0.6[a0];[a0][1:a]concat=n=2:v=0:a=1[out]" \
    -map "[out]" -ar 44100 -ac 1 -b:a 128k "$out"
done
echo done

# ---------------------------------------------------------------
# 音声の長さ（秒）を書き出す → 制限時間の計算に使う
#   src/data/listeningSets/listening-q4-6-durations.json
# ---------------------------------------------------------------
python3 - << 'PY'
import json, subprocess, glob, os
d = {}
for dir_ in ['public/listening_q4', 'public/listening_q5', 'public/listening_q6']:
    for f in sorted(glob.glob(dir_ + '/*.mp3')):
        s = subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).decode().strip()
        d[os.path.basename(f)] = round(float(s), 1)
json.dump(d, open('src/data/listeningSets/listening-q4-6-durations.json', 'w'), ensure_ascii=False, indent=1, sort_keys=True)
print('durations:', len(d))
PY
