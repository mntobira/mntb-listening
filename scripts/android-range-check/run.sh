#!/bin/sh
# RangeAwareWebViewClient.java を Android SDK なしで検査する（Android の型は stubs/ の最小の偽物）。
# 実ファイル public/bgm/battle/battle.mp3 を使い、Range ごとに「返したバイト＝ファイルのその位置」かを確かめる。
set -e
HERE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT=$(CDPATH= cd -- "$HERE/../.." && pwd)
TMP=$(mktemp -d)
cd "$HERE"
java Javac.java -d "$TMP" $(find stubs -name '*.java') "$ROOT/android/app/src/main/java/com/manatobi/listening/RangeAwareWebViewClient.java" "$ROOT/android/app/src/main/java/com/manatobi/listening/MainActivity.java" Check.java
java -Droot="$ROOT" -cp "$TMP" Check
rm -rf "$TMP"
