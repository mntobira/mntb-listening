#!/usr/bin/env bash
# ストアに出すビルドの「元のコミット」を確かめる（2026-10-17 の2つの事故を二度と起こさないため）。
#
#   事故1：Google Play の 1.0.2 を、音声劣化の修正（7c0b440）を含まないブランチから作って提出した
#          → 公開版で BGM が 110 秒中 87 か所途切れた
#   事故2：genspark_ai_developer が強制上書き（force-push）され、マージ済みの PR #41（R-10〜R-13）が消えた
#
#   使い方：bash scripts/release-guard.sh [確かめるコミット（既定 HEAD）]
#   ・マージ済みの PR の中身（PR の先頭コミット）が全部このコミットに入っているか（docs だけの PR は除く）
#   ・ストア版で必ず要る修正（音声劣化の修正など）が入っているか（tests/androidAudioFixPresent.test.ts）
#   ・Android の versionCode / iOS の build 番号が、これまでコミットされた最大より大きいか
#   どれか1つでも NG なら終了コード 1（ビルド・提出をしない）。gh（GitHub CLI）でログインしている必要がある。
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"
TARGET=${1:-HEAD}
NG=0
say() { printf '%s\n' "$*"; }

git fetch -q origin '+refs/heads/*:refs/remotes/origin/*' 2>/dev/null || say "（注意）git fetch に失敗。手元の情報で確かめる"

say "== 1. マージ済み PR の中身が $TARGET に入っているか"
if ! command -v gh >/dev/null || ! gh auth status >/dev/null 2>&1; then
  say "  NG: gh にログインしていないので確かめられない"; NG=1
else
  missing=0
  while IFS=$'\t' read -r num head title; do
    git cat-file -e "$head^{commit}" 2>/dev/null || git fetch -q origin "$head" 2>/dev/null
    # docs/・store-assets/ 以外を触っていない PR はアプリに影響しないので飛ばす
    base=$(git merge-base "$head" "$TARGET" 2>/dev/null || true)
    app=$( [ -n "$base" ] && git diff --name-only "$base" "$head" -- . ':!docs' ':!store-assets' ':!*.md' | head -1 )
    [ -z "$app" ] && continue
    if ! git merge-base --is-ancestor "$head" "$TARGET" 2>/dev/null; then
      # 中身が同じ形で入っている（rebase / cherry-pick）なら OK：PR が変えたアプリのファイルが一致するか
      diffs=$(git diff --name-only "$base" "$head" -- . ':!docs' ':!store-assets' ':!*.md' | while read -r f; do
        [ "$(git rev-parse "$head:$f" 2>/dev/null)" = "$(git rev-parse "$TARGET:$f" 2>/dev/null)" ] || echo "$f"; done | head -3)
      if [ -n "$diffs" ]; then say "  NG: PR #$num が入っていない（$title）  例: $(echo $diffs | tr '\n' ' ')"; missing=$((missing+1)); fi
    fi
  done < <(gh pr list --state merged --limit 200 --json number,headRefOid,title --jq '.[] | [.number, .headRefOid, .title] | @tsv')
  [ "$missing" -eq 0 ] && say "  OK" || NG=1
fi

say "== 2. ストア版で必ず要る修正"
tmp=$(mktemp -d); git archive "$TARGET" android src tests package.json tsconfig.json vite.config.ts 2>/dev/null | tar -x -C "$tmp"
ln -s "$PWD/node_modules" "$tmp/node_modules"
if (cd "$tmp" && npx vitest run tests/androidAudioFixPresent.test.ts >/dev/null 2>&1); then say "  OK（音声劣化の修正 4 点）"; else say "  NG: 音声劣化の修正が抜けている（tests/androidAudioFixPresent.test.ts）"; NG=1; fi
rm -rf "$tmp"

say "== 3. 版の番号が今までより大きいか"
vc=$(git show "$TARGET:android/app/build.gradle" | sed -nE 's/^\s*versionCode ([0-9]+).*/\1/p' | head -1)
maxvc=$(git log --all -p -- android/app/build.gradle | sed -nE 's/^[-+ ]\s*versionCode ([0-9]+).*/\1/p' | sort -n | tail -1)
ib=$(git show "$TARGET:ios/App/App.xcodeproj/project.pbxproj" | sed -nE 's/.*CURRENT_PROJECT_VERSION = ([0-9]+);.*/\1/p' | head -1)
maxib=$(git log --all -p -- ios/App/App.xcodeproj/project.pbxproj | sed -nE 's/.*CURRENT_PROJECT_VERSION = ([0-9]+);.*/\1/p' | sort -n | tail -1)
say "  Android versionCode $vc（これまでの最大 $maxvc）／ iOS build $ib（これまでの最大 $maxib）"
if [ "$vc" -lt "$maxvc" ] || [ "$ib" -lt "$maxib" ]; then say "  NG: 番号が過去より小さい"; NG=1; else say "  OK（ストアに上がっている番号より大きいかは Play Console / App Store Connect でも確かめる）"; fi

[ "$NG" -eq 0 ] && say "== すべて OK" || say "== NG があるので、このコミットからビルド・提出しない"
exit $NG
