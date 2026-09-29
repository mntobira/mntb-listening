# audio_sources — 旧音源と新音源の保管庫（アプリには入らない）

リスニング音源を「商用権未確認の旧音源」と「商用条件を確認して作り直した新音源」に**分けて恒久保存**する場所。
アプリが実際に鳴らすのは `public/listening_*/` の1種類だけ。このフォルダは public の外なのでビルド（dist）に含まれない。

```
audio_sources/
  legacy/                      旧音源（差し替え前の public のファイルそのまま。商用公開しない）
    listening_audio/el1A_set1_q1.mp3 …
  commercial/                  新音源の元ファイル（高音質マスター）と受領記録
    elevenlabs_2026-09-28_q1/            第1問A 第2〜14回・第1問B 全15回（まとめ録り原本10本を切り出し）
    elevenlabs_2026-09-19_q1a-set1/
      listening_audio/el1A_set1_q1.flac …   取り込みに使った元ファイル
      receipt/                               受け取った原本・受領記録・分割記録
```

- ★届いた音声は商用の新音源。`receive` → （まとめ録りなら `scripts/listening-split.py`）→ `import` の順で入れ、旧音源と混ぜない。
- 第1問（A・B 116本）・第2問（48本）・第3問（90本）・第4問（A・B 45本）・第5問（45本）・第6問（A・B 30本）の旧音源は利用者の指示で削除済み（2026-09-28）。`purge-legacy` または取り込み時の `--discard-legacy` で消した記録は台帳の `legacyDiscardedAt`。
- **手で置かない・消さない。** `scripts/listening-audio.mts import … --apply --batch <名前>` が自動で保存する。
- 旧音源は「最初に差し替えるとき」に1回だけ `legacy/` へ保存される（2回目以降の差し替えで新音源を旧扱いしない）。
- 旧音源に戻す：`npx tsx scripts/listening-audio.mts use-legacy <stem | chapterId | all>`
- どの音源がどちらか・生成元・商用の根拠：`scripts/data/listening_audio_ledger.json`（`status: replaced` が新音源）
- 手順の全体：`docs/LISTENING_AUDIO_REPLACE.md`
