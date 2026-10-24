# 英単語・英熟語の告知動画（2026-10-24）

実際のアプリ（ビルド版・ゲスト・広告なし）を操作した画面録画だけで作っています（動画生成AIは使っていません）。

## できあがり

| ファイル | 用途 | 大きさ | 長さ |
|---|---|---|---|
| `vocab_reel_9x16.mp4` | Instagram リール | 1080×1920 | 約78秒 |
| `vocab_story_9x16.mp4` | Instagram ストーリーズ（上下の UI 部分をあけてある） | 1080×1920 | 約27秒 |
| `vocab_youtube_16x9.mp4` | YouTube（パソコン版中心・スマホ版も並べる・最後に QR） | 1920×1080 | 約98秒 |

- H.264 / 30fps、AAC 48kHz・-14 LUFS（ピーク -1.3dBFS 以下）。
- 投稿文・概要欄・チャプターは `CAPTIONS.md`（**BGM のクレジットが必須**）。

## 構成（1本の道）

| 場面 | 中身 | BGM |
|---|---|---|
| しんどい | 「英単語って、覚えるの、しんどい。」降ってくる単語・ねむるとびら君 | 夕凪 |
| 論争 | 「1冊を極めてから次へ」VS「何冊も回して覚える」→ どれが正解？ | 夕凪 |
| 答え | 白く光って「市販の単語帳の単語を、網羅した。」5,713語のカウンター（YouTube はレベル別の内訳も） | 誕生（曲が広がる所から） |
| 道のり | 「ゲーム感覚で、こなすだけ。」覚える → 演習 → 長文 → 対戦 | 風の列車（曲頭7秒の盛り上がりを STEP1 に） |
| STEP1 覚える | 英単語帳：目標を選ぶ → 100語の一覧 → ✓ → 意味を隠して自分テスト（YouTube は熟語も） | 風の列車 |
| STEP2 演習 | 英単語・英熟語の4択：正解・コンボ | 風の列車 |
| STEP3 長文 | 英文解釈「The Library Cat」：単語帳に載っている語（public / unusual / staff / refuse / librarian）が光り、単語帳の番号と意味が出る → 内容一致の4択で正解 | 風の列車 |
| STEP4 対戦 | AI と対戦（英単語・英熟語・5問）：カウントダウン → START! → 5問全問正解 → FINISH! → 勝利・ミッション達成 | カナリアスキップ（アプリと同じく、曲頭7秒のサビ＝START!） |
| しめ | 「こなすだけで、全部の単語へ。」「もう、単語帳選びで迷わない。」→ ロゴ | 誕生（後半） |

上には常に「覚える・演習・長文・対戦」の道のりの帯があり、いまどこかがオレンジで光ります（済んだ所は ✓）。

## 文言の根拠

- 5,713語・単語3,828／熟語1,885・レベル別の語数：`public/data/listeningVocabulary.json`（アプリの単語帳と同じデータ）。
- 「市販の単語帳の単語を網羅した独自の単語帳」は運営者の説明に基づく表現（アプリ内の表記は「複数の公開語彙リストを合算し、重要度で再編したマナトビ独自の編成」）。
- 長文の語の番号（No.31 public など）は単語帳と同じ番号（レベルごとに No.1 から）。
- 対戦の点数（1219 vs 241）・結果は録画どおり（AI 対戦・レートは動かない練習用）。
- 「必ず覚えられる」「No.1」などの断定はしていません。

## 音の権利

| 音 | 出どころ | 条件 |
|---|---|---|
| 誕生 | `public/tanjou.mp3`（Suno 有料プランで作成） | 商用可 |
| 夕凪・風の列車 | 創作堂さくら紅葉 https://yukizakura.net/ | 商用・加工可。**配布元名と URL の記載が必須** |
| カナリアスキップ | まんぼう二等兵／OpenTracks | 商用・加工可・クレジット任意（書いている）。Content ID 登録禁止 |
| 効果音 | `public/sfx/battle/*.mp3`（数式で作った音） | 表記不要 |

## 作り直し方

```sh
NODE_OPTIONS=--max-old-space-size=2500 npx vite build --outDir .tmpwork/dist_v
npx vite preview --outDir .tmpwork/dist_v --port 4175 &
# 録画（スマホ・パソコン）
python3 store-assets/_tools/record_vocab.py store-assets/_footage/vrec_ph wordbook idiom quiz reading battle
REC_DEVICE=pc python3 store-assets/_tools/record_vocab.py store-assets/_footage/vrec_pc wordbook quiz reading battle
# 長文の単語の位置（光らせる場所）: store-assets/_footage/vrec_*/reading_rects.json（store-assets/_tools/text_rects.py で取得）
# 編集（--sheet で静止画の一覧、--draft で速い下書き、--audio-only で音だけ）
python3 store-assets/_tools/promo_vocab.py .tmpwork/vout reel story youtube
```

- 録り直したら、`promo_vocab.py` 先頭の時刻（カウントダウン `ticks`・`start`・`finish` など）を測り直してください。
