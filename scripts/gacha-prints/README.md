# UR 学習プリントの作り直し（英語・理科・化学 無機・数学）

アプリの英文法・単語帳のデータから、ガチャの UR 学習プリント（PDF＋サムネイル）を作ります。

```bash
# 1) 英文法の素データ（手書きの問題・解説）を書き出す
mkdir -p .tmpwork/eg && cp src/data/egProblems*.ts .tmpwork/eg/
sed 's#^export function buildEgSet(meta: EgSetMeta, items: EgItem\[\]): GrammarProblem {#&\n  (globalThis as any).__egCapture?.(meta, items);#' src/data/englishGrammarKit.ts > .tmpwork/eg/englishGrammarKit.ts
cp scripts/gacha-prints/dump-grammar.mts .tmpwork/eg/dump.mts && npx tsx .tmpwork/eg/dump.mts
# 2) PDF を作る（reportlab・pdftoppm・Pillow・IPAゴシックが必要）
python3 scripts/gacha-prints/build-grammar-ur.py
python3 scripts/gacha-prints/build-vocab-ur.py
# 理科3冊・化学 無機・数学 総まとめ（★教科データはアプリから外したので、元のリポジトリから src/data と src/features/rika を一時的に戻してから実行★）
npx tsx scripts/gacha-prints/dump-science.mts
python3 scripts/gacha-prints/build-science-ur.py            # 一部だけなら: ... inorganic math rika1 rika2 rika3
# 3) src/data/gachaPrints.generated.ts の pages / kb を実物に合わせる（tests/gachaPrintsQuality.test.ts が検査）
```

- 問題文・選択肢・解説は **アプリのデータのまま**。並べ替えるのは選択肢の順番だけ（正解位置を①〜④に均等にするため）で、解説中の「② の〜は」の番号も同じ対応表で付け替えます。
- 品質の下限は `tests/gachaPrintsQuality.test.ts`（100問すべてに解説・正解位置25問ずつ・4択の答えあり）。
- 理科・化学・数学は `ur_common.py`（表紙・問題・解答用紙・答えの一覧・解説・要点・自己採点表）を共通で使う。IPAゴシックに無い下付き・上付き数字や ≤ ≥ は DejaVu Sans で描く。

## UR「完全版」の本（2026-10-24）

ガチャの UR（大当たり）は「その一冊で完成する本」だけ。単元プリント・100語テストは SR。

```bash
python3 scripts/gacha-prints/build-vocab-book.py        # 英単語 Lv1・Lv2・Lv3+4、英熟語（アプリの単語帳の全語）
python3 scripts/gacha-prints/build-reading-mock.py      # 共通テスト英語リーディング 大問別演習 第1〜3回（問題データ reading_mock_a/b1/b2/c1/c2/c3.py・解き方 reading_guide.py）
npx tsx scripts/gacha-prints/dump-listening.ts /tmp/listening.json && python3 scripts/gacha-prints/build-listening-book.py  # 共通テスト英語リスニング 大問別演習（アプリの問題・音声をそのまま使う。QR＝https://mntb-listening.vercel.app の mp3）
python3 scripts/gacha-prints/build-analysis-book.py     # 共通テスト全科目 出題分析（データ analysis_*.py・出典つき）
```
- 共通レイアウトは `book_common.py`（紺と金の表紙・帯・囲み）。
- 作り直したら `src/data/gachaPrints.generated.ts` の pages / kb を合わせる（`tests/gachaDeluxe.test.ts` が検査）。
- リーディングは第1回（reading_mock_a.py）・第2回（reading_mock_b1.py＋b2.py）。第3回は同じ形のデータを足して BOOKS に1行追加。

## LR：共通テスト 英語 予想問題（2026-10-24）

```bash
# reportlab・pdftoppm・Pillow・IPAゴシック/IPA明朝（fonts-ipafont-gothic / fonts-ipafont-mincho）が必要
python3 scripts/gacha-prints/kyotsu_mock/build.py        # 5回分すべて（一部だけなら: build.py 2 4）
# → public/prints/print_lr_kyotsu_{r,l}_{n}.pdf と thumbs、.tmpwork/kyotsu-mock.json（ページ数・KB）
# src/data/kyotsuMockPrints.ts の pages / kb を .tmpwork/kyotsu-mock.json に合わせる（tests/kyotsuMockPrints.test.ts が検査）
```

- 問題データは `setN_r1.py`・`setN_r2.py`（リーディング第1〜4問・第5〜8問）、`setN_l.py`（リスニング）。描画は `render.py`、組み立ては `build.py`。
- `build.py` が毎回検査：大問数（R8・L6）・解答数（R44・L37）・各大問の配点・合計100点。
- 見た目は本番の問題冊子と同じ白黒（明朝・四角囲みの解答番号・大問ごとに改ページ）。色は使わない。

### 共通テスト予想問題の素材（音声・イラスト・図）の制作指示書

- `kyotsu_mock/assets_plan.py`：まだ無い素材の一覧（リスニング120トラックの台本と声の割り当て／4択の絵34／地図4／リーディングの図29）。問題データから自動で作る。
- `kyotsu_mock/build_orders.py`：ChatGPT に貼るプロンプト集＋全台本を1冊の PDF に（`.tmpwork/kyotsu_mock_seisaku_shijisho.pdf`）。
- `kyotsu_mock/make_audio.py`：OpenAI TTS（gpt-4o-mini-tts）でリスニング音声を作る。`--dry-run` は課金なしで台本だけ表示。実行者の `OPENAI_API_KEY` に課金。
- `kyotsu_mock/figs.py`＋`kyotsu_mock/assets/img/*.jpg`：受け取った画像（リスニングの絵34・地図4・リーディングの図24）を PDF に組み込む設定。4枚組の絵は枠を検出して切り出し、本番と同じく各絵の下中央に①〜④。地図は元の点線の丸を消し、同じ位置・大きさで丸数字を描く。リーディングの図は `R_PLACE`（回・大問・枠の番号・位置・幅）。
- **ElevenLabs（Eleven v4）で音声を作る**：`kyotsu_mock/build_orders_el.py` → `.tmpwork/kyotsu_mock_elevenlabs_v4.pdf`（声のキャスト12役・読み方のルール・全120トラックの台本）。一括作成は `kyotsu_mock/make_audio_el.py`（Text to Dialogue API・`eleven_v4`。`ELEVENLABS_API_KEY` と `el_voices.json`（役名→voice_id、`el_voices.example.json` をコピー・git 管理外）が必要。`--dry-run` は課金なし）。生成済みの部品は `.tmpwork/el_cache/` に残り、作り直しでは再生成しない。
- リーディングの英文量は本番（約5,600語）に合わせて増量済み（各回 約5,000〜5,400語）。図に描かれた内容・正解は変えていない。図は全29枚そろった（受け取り24枚＋生成5枚：r4_6_indigo_dye / r4_7_heat_island / r5_2_sunfold / r5_3_calligraphy / r5_6_feel_music）。

### ピックアップの「中身を少し見る」画像（2026-10-27）

`python3 scripts/gacha-prints/build-previews.py` で、LR 10種＋厳選UR（`GachaParts.tsx` の `FEATURED_UR_IDS`）10種の
2ページ目と真ん中のページを、**上半分だけ・幅360px・下はぼかし**の webp にする → `public/prints/previews/`。
一覧は `src/data/gachaPreviews.generated.ts` に自動で書き出す。厳選URを入れ替えたら、このスクリプトを流し直す
（`tests/gachaPickup.test.ts` が「厳選URと一致・実物あり・1枚30KB以下・余分なファイルなし」を確かめる）。

### LR リスニングの音声（第1回のみ・2026-10-27）

利用者が ElevenLabs v4 で作った6本（`audio_sources/commercial/elevenlabs_2026-10-26_kyotsu_l1/`）を、無音の中ほどで
問題ごとの24トラックに切って `public/prints/kyotsu_assets/audio/kyotsu_l1_q*.mp3` に置いた（区切りは同フォルダの `split_manifest.json`）。
第1問・第2問は4秒あけて2回つなぐ。対応表は `src/data/kyotsuMockAudio.ts`。第2回〜第5回は音声が届いたら同じ形で足す。
**`listening_audio_ledger.json`（374本）には入れない**（別教材）。

## 熟語＋英文解釈 小テスト（B4横・B5縦2面・問題と解答を同じ PDF・白黒）2026-10-27

```bash
npx tsx scripts/gacha-prints/idiom_reading/dump.ts && python3 scripts/gacha-prints/idiom_reading/build.py
# → .tmpwork/idiom_reading/熟語英文解釈_{基礎,標準,発展}_第01-12回.pdf（各12回・B4 24ページ）
```
- 左：英熟語（ilv1）をアプリの単語帳と同じ順に（英→日・書く）。右：**上に熟語のつづき → 下に英文解釈1題**（熟語は 左上→左下→右上 と続く）。
- コース：基礎＝英文解釈レベル1、標準＝レベル2、発展＝レベル3。熟語は通し番号（基礎 1〜479 → 標準 480〜939 → 発展 940〜1388）。
- 白黒印刷用：熟語の答え＝太字、設問の正解＝太字＋下線、本文の根拠＝波下線（`<u color="#010101">`）、ポイント＝太字。赤は使わない。
- 本文が長い回は右上の熟語を減らし（最低4語）、それでも入らなければ文字を少し小さくする（最小0.85倍）。
- 共通部品は `scripts/gacha-prints/b4common.py`（フォント・波下線・英日混在・見出し帯）。

## 英文法 4択 B4プリント（アプリと同じ問題・同じ順）2026-10-27

```bash
npx tsx scripts/gacha-prints/idiom_reading/dump.ts && python3 scripts/gacha-prints/grammar_b4/build.py
# → .tmpwork/idiom_reading/英文法_4択_第1-16章.pdf（80回分・B4 80ページ）
```
- アプリの英文法 第1〜16章（729問）を、章→問題番号の順・同じ選択肢の並びで。1面（B5）＝1回分（7〜10問、章をまたがない）。見出しは「時制（1）」「時制（2）」…
- 3冊：文法編 第1〜16章（729問・80回分）・語法編 第17〜19章（290問・30回分）・会話表現編 第20章（144問・15回分）。
- 1枚目＝左右2回分の問題、2枚目＝同じ配置で解答。解説はアプリより短く：正解の英文（答えの部分を太字＋下線）・和訳・ポイント1行。

## ガチャ UR（完全版）への登録 2026-10-27

```bash
python3 scripts/gacha-prints/idiom_reading/publish.py   # 上の6冊を public/prints/print_book_*.pdf にコピー＋サムネイル
```
- id：`print_book_idiom_reading_{basic,standard,advanced}`・`print_book_grammar_b4_{bunpo,gohou,kaiwa}`。
- `src/data/gachaPrints.generated.ts` の末尾（「2026-10-27 UR に追加」）に pages・kb を書く。作り直したら publish.py が出す pages・kb に合わせる（`tests/gachaDeluxe.test.ts` が照合）。

## LR：国公立2次 英語 予想問題 名古屋大学 前期対策（2次試験ガチャ・2026-10-29）

```bash
# PDF は別リポジトリ（webapp/pdf）で作る：build_round{1,2,3}_{q,a}.py で中身の HTML → build_exam.py で試験冊子の紙面（白黒・解答用紙つき）に組んで PDF 化
# 問題＋解答解説を1冊にまとめる
pdfunite 予想問題_名古屋大学_英語_第N回_問題.pdf 予想問題_名古屋大学_英語_第N回_解答解説.pdf public/prints/print_lr_niji_nagoya_en_N.pdf
# サムネ（thumbs）と「中身を少し見る」画像だけ作り直す（引数に id を渡すとその分だけ）
python3 scripts/gacha-prints/build-previews.py print_lr_niji_nagoya_en_1 print_lr_niji_nagoya_en_2 print_lr_niji_nagoya_en_3
# src/data/nijiMockPrints.ts の pages / kb を実物に合わせる（tests/nijiGacha.test.ts が検査）
```

- 過去問・公式解答・講評の文言は**一切引用しない**（商用アプリのため）。英5語・日12文字の n-gram で過去問OCRと照合して 0 件を確認してから入れる。
- 表紙と奥付に「名古屋大学の過去問・公式問題ではありません。予想問題であり、大学とは関係がありません」を入れる。「的中」「必ず出る」「合格できる」は使わない。

### 静岡大学 前期対策（2026-10-30 追加）

```bash
# 中身は webapp/pdf/shizuoka/r{1,2,3}.py（データ）、紙面は build.py（試験冊子・白黒・解答用紙3枚つき）
python3 build.py            # → 予想問題_静岡大学_英語_第N回_{問題,解答解説}.pdf
pdfunite 予想問題_静岡大学_英語_第N回_問題.pdf 予想問題_静岡大学_英語_第N回_解答解説.pdf public/prints/print_lr_niji_shizuoka_en_N.pdf
python3 scripts/gacha-prints/build-previews.py print_lr_niji_shizuoka_en_1 print_lr_niji_shizuoka_en_2 print_lr_niji_shizuoka_en_3
# src/data/nijiMockPrints.ts の shizuoka(n, pages, kb) を実物に合わせる
```

- 大問の型（物語文・誤り訂正・評論文・会話文・自由英作文／配点は%）だけを参考にし、英文・設問・解答・表紙の文言はすべて書き下ろし。過去問4年分のOCR文と照合して英5語・日12字の一致0件を確認。
- 注意書きは大学ごとに出し分ける（`nijiDisclaimerFor(大学名)`）。ほかの大学を足すときは `NIJI_UNIVERSITIES` に1行足す。

### 大阪公立大学 前期対策（2026-10-30 追加・A／Bグループ）

```bash
# 中身は webapp/pdf/osaka/r{1,2,3}.py（第1・2問は共通、第3問は W['A'] / W['B']）、紙面は build.py
python3 build.py            # → 予想問題_大阪公立大学_英語_第N回_{A,B}_{問題,解答解説}.pdf
pdfunite 予想問題_大阪公立大学_英語_第N回_A_問題.pdf 予想問題_大阪公立大学_英語_第N回_A_解答解説.pdf public/prints/print_lr_niji_omua_en_N.pdf   # B は omub
python3 scripts/gacha-prints/build-previews.py print_lr_niji_omua_en_1 …   # previews
# thumbs は 1ページ目を 360×510 の webp に（静岡と同じ規格）
```

- 第3問（和文英訳）だけ学部・学域で2系統（A：文・法・経済・商・獣医・医学科・生活科学／B：現代システム科学域・理・工・農・リハビリ・看護）。`NIJI_UNIVERSITIES` の `track` にグループ名を書くとラベルに出る。
- 解答速報5年分（2022〜2026）の文と照合して英5語・日12字の一致0件を確認。

### 和歌山大学・岡山大学・広島大学 前期対策（2026-10-31 追加）

```bash
# 中身は webapp/pdf/{wakayama,okayama,hiroshima}/r{1,2,3}.py、紙面は共通の webapp/pdf/niji_common.py（各 build.py は設定だけ）
cd webapp/pdf/okayama && python3 build.py 1      # → 予想問題_岡山大学_英語_第1回_{問題,解答解説}.pdf
pdfunite 予想問題_岡山大学_英語_第1回_問題.pdf 予想問題_岡山大学_英語_第1回_解答解説.pdf public/prints/print_lr_niji_okayama_en_1.pdf
python3 scripts/gacha-prints/build-previews.py print_lr_niji_okayama_en_1 …   # previews
# thumbs は 1ページ目を 360×510 の webp に（静岡と同じ規格）
```

- 3大学とも英語は全学部共通の1種類なので、各3回分（学部別の出し分けなし）。
  - 和歌山：Ⅰ〜Ⅲ（長文2題＋グラフ英作文）・90分・100点
  - 岡山：問1〜問4（長文2題・会話文＋グラフ／和文英訳・自由英作文）・120分・200点
  - 広島：Ⅰ〜Ⅳ（段落要約・関連2文の長文・意見英作文・グラフ英作文）・120分・200点
- 照合：`python3 work/plag/niji_check.py wakayama okayama hiroshima`（各大学の過去問・公式解答のOCR文と照合）で英5語・日12字の一致0件を確認。
- 大学名の入った問題指示の決まり文句も過去問と重なりやすいので、言い回しは独自のもの（例「以下の英文を読み、あとの問いに答えよ」）にしている。
