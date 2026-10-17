# コードの図鑑 — 調査記録（research.md）

- 対象：マナトビ リスニングのリポジトリ、`genspark_ai_developer` ブランチ @`7c0b440`（2026-10-16 のコミット）
- 時点：**2026年10月時点**（数字はすべてこのコミットで数えたもの）
- 成果物：`interactive.html`（1ファイルで、外部への通信なし）、`poster.png`（1800×3904px）、`file-guide.pdf`（A4・69ページ）、本書

## 1. 数字と数え方

| 数字 | 値 | 数え方（作業ツリーのルートで実行） |
|---|---:|---|
| Gitで管理しているファイル | 2,534 件 | `git -c core.quotepath=false ls-files \| wc -l` |
| アプリ本体のコード | 95,312 行（366 ファイル） | `git ls-files 'src/*.ts' 'src/*.tsx' 'src/*.css' \| xargs cat \| wc -l`。自動生成ファイル11件を含む。除くと 91,577 行 |
| 画面の行き先 | 18 種類 | `src/App.tsx` の `export type AppState = …` の文字列リテラルの数 |
| リスニングの単元・大問・小問 | 9 単元・135 大問・554 小問 | `npx tsx` で `SUBJECTS`（`src/data/allChapters.ts`）を読み、各章の `miniTest` と `practiceProblems` の数と `subQuestions` の数を合計。`countChapterProblems` で数えた大問数とも一致 |
| 英文法の単元・大問・小問 | 20 単元・238 大問・1,163 小問 | 同上 |
| 演習の小問（合計） | 1,717 問 | 554 + 1,163 |
| 英単語 | 5,713 語 | `src/data/listeningVocabularyMeta.generated.ts` の `VOCABULARY_COUNT` |
| 対戦の出題 | 10,958 問 | `src/battle/data/battlePool.ts` の `POOL_COUNTS`（リスニング 254・英文法 1,163・英単語 9,541） |
| リスニング音源 | 374 本 | `listening_audio_ledger.json` の配列の長さ |
| 自動テストの確認 | 788 件（63 ファイル） | `npx vitest list --json` の件数。`functions/` の node:test（20件）と Playwright の検査（5本）は含まない |

> 訂正：手順1の報告では、テストの件数を「688件」とお伝えしました。これは `it(` を行頭で数える簡易な方法によるもので、`it.each` や入れ子を数え漏らしていました。今回は vitest 自身に一覧を出させた 788 件に改めています。

## 2. 分類の方針

- **個別カード（566枚）**：自分で書いたコード・設定・テスト・文書、それに独自コードを持つネイティブのファイル（Android 2件・iOS 2件）、英文法の作業スクリプト（4件）。
- **まとめカード（28枚＝1,968件ぶん）**：次のものは1枚にまとめて説明しています。
  - 音源・イラスト・音読用データ・プリント・効果音などの大量の素材
  - 自動生成ファイル、lock ファイル
  - Android／iOS のひな形と画像
  - 音源の原本（`audio_sources/`）
  - スクリプトの中間データ
- まとめ方は `data/bundles.py` の正規表現で決めています。2,534 件すべてが、個別カードかまとめカードの**どちらか1つだけ**に入ることを機械的に確かめました。
- **種別タグ（8種）**：画面／部品／データ／通信／設定／テスト／音声・画像／文書。1枚ごとに中身を読んで1つだけ付けました。
- **しくみの図の箱（12個）**：パスとタグの規則だけで決めています（`tools/enrich.py`）。個別に推測で振り分けたものはありません。
- **ユーザーの流れ（解く・わかる・復習・競う）**：ファイル名の規則で関係づけています（`tools/enrich.py` の `FLOW`）。1枚が複数の場面に関係することもあり、場面に関係しないもの（テスト・道具・文書）は外しています。
- **「くわしく」の材料**：
  - ファイル冒頭のコメント（コードより前に書かれたものだけ）
  - Markdown の見出し、JSON の項目名
  - export している名前、import しているファイル、import されているファイル
  - 中身を読んで手で書いた説明（約60枚）
- **「つながり」**：import の向き（呼ぶ／呼ばれる）を最大3件まで。import が無いものは、他のファイルにファイル名が出てくる箇所（名前が出る）を示しています。

### 確信度

| 段階 | 意味 | 枚数 |
|---|---|---:|
| 高 | 冒頭の説明やコードで役割を確かめた | 583 |
| 中 | コメントが無く、中身と周りのファイルから判断した | 4 |
| 低（要確認） | 使っている場所をコードから確かめられなかった | 7 |

## 3. 要確認のリスト

### 確信度「低」

1. `src/components/ExplanationChartsExtra.tsx`：`src/` の中に、このファイルを import している箇所がありません。
2. `src/components/NotebookScenery.tsx`：同上です。
3. `src/assets/mntb_logo.png`：ファイル名を参照している箇所が見つかりません。
4. `public/flowcharts/chem-basic-acid-redox-flowchart.html`：アプリ・`sw.js`・`manifest.json` から参照されていません。
5. `public/化学基礎_フローチャート集.html` と `_v2.html`：同上です。
6. 参照の見つからない画像など（まとめカード、78件）。いずれも `src/`・`index.html`・`public/manifest.json`・`public/sw.js` のどこにもファイル名が出てきません。
   - `public/fig_math/`（26件）、`learning_figures/`（14件）、`rika/`（6件）、`geography/`（4件）、`acid_base_images/`（3件）
   - `public/` 直下：化学の図（fig_*・photo_*・filtration*・separating*・sublimation*・graph*）、`manatob_bg.png`、`penguin_mascot.png`、`manatobi-logo.jpg`、`home_icon.jpg` / `.png`、`マナトビリスニング最終盤アイコン.png`
   - `public/まなとびandroid.png`：`scripts/apply-android-assets.py` からのみ参照
   - `public/cobblestone_dreams.mp3`：`scripts/purge-legacy-listening-audio.mjs` からのみ参照
   - `public/brand/manatobi-logo.png` はまとめカード「ロゴ・アイコン類」に入れ、参照が見つからないことをそのカードに注記しています。

### 確信度「中」

- `ios/App/App/AppDelegate.swift`：Capacitor のひな形のままで、独自の処理は見当たりません。
- `scripts/gacha-prints/dump-grammar.mts`、`scripts/readalong/dump_tracks.ts`：コメントがありません。入力の説明が書かれた相手側のスクリプトと照らし合わせて判断しました。
- `src/battle/core/vocabRanges.ts`：コメントがなく、関数名と中身から判断しました。

## 4. 載せていないもの（秘密・個人情報）

次のものは、存在と役割だけを書き、値は載せていません。

- `.env.example` の項目名
- `.firebaserc` のプロジェクト名
- `capacitor.config.ts` と `src/utils/adConfig.ts` の広告ID
- 問い合わせ用のメールアドレス（`legalText.ts` ほか）
- フォームと Apps Script の URL
- `license_evidence/` の領収画像の中身

`tools/selfcheck.py` が、ソースからこれらの実際の値（21個）を集め、成果物（`interactive.html`・`poster.html`・`file-guide.html`・`cards.json`・本書）に1つも含まれないことを確かめています（0件）。

## 5. 自己チェックの結果

- 全594枚で、必須の欄（パス・ひとことで・くわしく・規模・種別タグ・確信度）が埋まっています。
- 「ひとことで」はすべて20〜40字で、「係」で終わっています。
- 「様々な処理」などのあいまいな言い方や、「革新的」「最先端」などの誇張した言葉は使っていません。
- 文字色のコントラストはすべて 4.5:1 以上です。いちばん低いのは強調のオレンジと淡い橙の地の組み合わせで 4.89 です。最初は 3.43 で基準に届かなかったため、オレンジを `#a65400` に変えました。
- 文字の大きさは、画面で 13px 以上、印刷で 8pt 以上です。狭い画面ではしくみの図をカードの並びに切り替えるので、図の文字が小さくなりすぎません。
- 動き：すべて `prefers-reduced-motion: no-preference` の中に入れてあります。「動きを減らす」設定では、動きなしで同じ内容を表示します。
- ブラウザでの確認（Playwright）：1280×800 と 390×844、動きあり・なしの両方で確かめました。
  - ページのエラーは0件、外部への通信は0件、横のはみ出しも0です。
  - しくみの図での絞り込み、検索（「復習」）、カードを開く、ユーザーの流れ、一般向けとエンジニア向けの切り替えが、すべて動きました。
- ポスターを幅500pxに縮めても、見出しと数字は読めました（`out/poster-500.png`）。
