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


## 2次試験ガチャの予想問題：作る前に「作成済み」を確認（2026-11-03）

```bash
npm run niji:made                         # main・開いている PR・手元のブランチで作った大学の一覧
npm run niji:made -- 山口大学 yamaguchi    # 作成済みなら「✗ 作成済み」で終了コード 1 → 作らない
```

- 別の部屋も同じリポジトリで大学を作っているので、**新しい大学に取りかかる前に毎回これを実行**する。
- 見ているのは各ブランチの `src/data/nijiMockPrints.ts` の `NIJI_UNIVERSITIES`。

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

## LR：神戸大学 前期 英語 予想問題（3回分・白黒）2026-10-29

```bash
# WeasyPrint・Noto Serif / Noto Serif CJK JP / Noto Sans CJK JP が必要。
# M PLUS Rounded 1c の Bold / ExtraBold（Google Fonts・OFL）の ttf を .tmpwork/fonts/ に置く（KOBE_FONT_DIR で変更可）
cd scripts/gacha-prints/kobe_mock && for R in 1 2 3; do python3 render.py $R; done
# → .tmpwork/kobe_mock/manatobi_kobe_eng_yoso{n}_{mondai,kaitou}.pdf
#   を public/prints/print_lr_kobe_{q,a}_{n}.pdf にコピー → サムネイル（book_common.make_thumb と同じ作り方）
#   → src/data/kobeMockPrints.ts の pages / kb を合わせる → python3 scripts/gacha-prints/build-previews.py
```
- 問題データは `rN_I.py`〜`rN_IV.py`（N＝回）。英文・設問・図表はすべて書き下ろし。IV の図表のデータは架空。
- 表紙と奥付に「神戸大学の過去問・公式問題ではありません。予想問題であり，大学とは関係がありません」（`tests/kobeMockPrints.test.ts` が確認）。
- 白黒：色は `mono()` で全部グレーに直す。解説の強調は、正解＝太字＋下線、本文の英語の根拠“…”＝波下線、「…」の要点＝下線、選択肢記号・○×・判定（本文と逆 など）＝太字。

### 神戸大 予想問題：品質・オリジナル性の検査（商用利用のため毎回実行）2026-10-29

```bash
# 照合用の過去問 OCR・分析データを .tmpwork/kobe_ref/{ocr,analysis} に置く（著作物なので git に入れない。KOBE_REF_DIR で変更可）
cd scripts/gacha-prints/kobe_mock
python3 check_orig.py          # 過去問・解答と英語4語連続／日本語13字連続の一致、題材の近さ（TF-IDF）、下線語句の重複 → logs/originality.json
python3 check_quality.py       # 解説の英文引用が本文に実在するか・正解の数と○×の一致・選択肢の重複・正解位置の偏り → logs/quality.json（NG なら終了コード1）
for R in 1 2 3; do python3 verify.py $R; done   # 語数・平均文長・難語率が 2022〜2026年度の範囲内か、字数・語数の指定どおりか → logs/verify_rN.json
```
- 合格の目安：4語以上の一致は（選択肢記号の並びなど意味のないもの以外）0、日本語13字一致 0、題材の近さは過去問どうしの最大値（0.18）未満。
- 登場人物名も過去問と重ならないようにする（例：第2回 III は過去問の人物名と同じだったため Hazel に変更）。

## LR：大阪大学 前期 英語 予想問題（3回分・白黒）2026-10-30

```bash
# 必要なもの・フォントは神戸大と同じ（osaka_mock/render.py は kobe_mock/render.py の部品を読み込む。kobe 側を壊さないこと）
cd scripts/gacha-prints/osaka_mock && for R in 1 2 3; do python3 render.py $R; done
# → .tmpwork/osaka_mock/manatobi_osaka_eng_yoso{n}_{mondai,kaitou}.pdf
#   を public/prints/print_lr_osaka_{q,a}_{n}.pdf にコピー → サムネイル（book_common.make_thumb と同じ作り方）
#   → src/data/osakaMockPrints.ts の pages / kb を合わせる → python3 scripts/gacha-prints/build-previews.py
```
- 形式：I 英文和訳(A)(B)／II 長文読解（語句4択・英問4択・字数制限の日本語説明・和訳・英語説明40〜50語・内容一致2つ）／III 自由英作文80語程度／IV 和文英訳(A)全員＋(B)(イ)文学部・(ロ)文学部以外。独自配点 150点（I 30・II 50・III 30・IV 40）。
- 問題データは `oN_I.py`〜`oN_IV.py`・`oN_II_ja.py`（全訳・語句）（N＝回）。英文・日本文・設問はすべて書き下ろし。
- 表紙と奥付に「大阪大学の過去問・公式問題ではありません。予想問題であり，大学とは関係がありません」（`tests/osakaMockPrints.test.ts` が確認）。2ページ目以降に注記ヘッダーは付けない。
- 白黒・強調のルールは神戸大と同じ。

### 阪大 予想問題：品質・オリジナル性の検査（商用利用のため毎回実行）2026-10-30

```bash
# 照合用の過去問・解答の OCR と分析データを .tmpwork/osaka_ref/{ocr,analysis} に置く（著作物なので git に入れない）。神戸大の .tmpwork/kobe_ref も照合に使う
cd scripts/gacha-prints/osaka_mock
python3 check.py 1 2 3     # 英語4語／日本語13字の一致・解説の英文引用の実在・選択肢の重複・○×と正解の一致・題材の近さ（TF-IDF）・正解位置の偏り・正解だけ長い選択肢 → logs/check.json（ng が空であること）
for R in 1 2 3; do python3 verify.py $R; done   # 語数・平均文長・難語率が 2022〜2026年度の範囲内か、字数・語数の指定どおりか → logs/verify_rN.json（NG なら終了コード1）
```

## LR：立命館大学 全学統一方式（文系）英語 予想問題（3回分・白黒・マーク式）2026-10-30

```bash
# 必要なもの・フォントは神戸大と同じ（ritsu_mock/render.py は kobe_mock/render.py の部品を読み込む。kobe 側を壊さないこと）
cd scripts/gacha-prints/ritsu_mock && for R in 1 2 3; do python3 render.py $R; done
# → .tmpwork/ritsu_mock/manatobi_ritsu_eng_yoso{n}_{mondai,kaitou}.pdf
#   を public/prints/print_lr_ritsu_{q,a}_{n}.pdf にコピー → サムネイル（book_common.make_thumb と同じ作り方）
#   → src/data/ritsuMockPrints.ts の pages / kb を合わせる → python3 scripts/gacha-prints/build-previews.py
```
- 形式：I 長文（英問4択・一致／不一致／判断できない・表題5択）／II 長文（空所補充 A〜H・下線部 あ〜お）／III 会話文2つ（10択）／IV 文法・語法 A〜H／V 語彙（空所・同意語）。80分・すべて選択式。独自配点 120点（I 26・II 34・III 24・IV 16・V 20）。
- 問題データは `rmN_I.py`〜`rmN_V.py`（N＝回）。4択は `mk.mc()` で「正解を choices[0] に書き，解説では {c1}〜{c3} で他の選択肢を指す」形で書くと，正解位置が均等にずれて番号に置き換わる。
- 表紙と奥付に「立命館大学の過去問・公式問題ではありません。予想問題であり，大学とは関係がありません」（`tests/ritsuMockPrints.test.ts` が確認）。2ページ目以降に注記ヘッダーは付けない。登場人物・団体・場所は架空。

### 立命館 予想問題：品質・オリジナル性の検査（商用利用のため毎回実行）2026-10-30

```bash
# 照合用の過去問・解答の OCR と分析データを .tmpwork/ritsu_ref/{ocr,analysis} に置く（著作物なので git に入れない）。阪大・神戸大の ref も照合に使う
cd scripts/gacha-prints/ritsu_mock
python3 check.py 1 2 3     # 英語4語／日本語13字の一致・登場人物名の重複・解説の英文引用の実在・空所/下線の対応・会話10択・正解位置の偏り・正解だけ長い選択肢・題材の近さ → logs/check.json（ng が空であること）
for R in 1 2 3; do python3 verify.py $R; done   # 長文の語数・平均文長・難語率が 2022〜2026年度の範囲内か、会話文の語数、語彙問題の難しさ → logs/verify_rN.json（NG なら終了コード1）
```

## LR：北海道大学 前期日程 英語（全学部共通）予想問題（3回分・白黒）2026-10-31

```bash
# 必要なもの・フォントは神戸大と同じ（hokudai_mock/render.py は kobe_mock/render.py の部品を読み込む。kobe 側を壊さないこと）
cd scripts/gacha-prints/hokudai_mock && for R in 1 2 3; do python3 render.py $R; done
# → .tmpwork/hokudai_mock/manatobi_hokudai_eng_yoso{n}_{mondai,kaitou}.pdf
#   を public/prints/print_lr_hokudai_{q,a}_{n}.pdf にコピー → サムネイル（book_common.make_thumb と同じ作り方）
#   → src/data/hokudaiMockPrints.ts の pages / kb を合わせる → python3 scripts/gacha-prints/build-previews.py
```
- 形式：1・2 長文読解（下線部和訳・空所補充・内容説明（字数指定）・書き抜き・内容一致）／3 英文＋英語で答える問題（Question A・B 文の完成，C 意見 70〜100語）／4 会話文と要約文（空所12・語群21語）。90分。独自配点 150点（1 42・2 42・3 42・4 24）。
- 問題データは `hN_P1.py`〜`hN_P4.py`（N＝回）。選択問題は `mk.mc1()` で「正解を choices[0] に書き，解説では {c1}〜 で他の選択肢を指す」形で書くと，回ごとに正解位置が均等にずれる（`mk.pos_for(N)`）。
- 表紙と奥付に「北海道大学の過去問・公式問題ではありません。予想問題であり，大学とは関係がありません」（`tests/hokudaiMockPrints.test.ts` が確認）。2ページ目以降に注記ヘッダーは付けない。登場人物・団体・地名は架空。
- 分析に使った過去問：2025・2026年度は大学公式サイトの公開分（問題・解答例・出題の意図），2022〜2024年度は公開PDF。どちらも照合用 OCR として `.tmpwork/hokudai_ref/` に置くだけで，本文・設問・解答は引用しない。

### 北大 予想問題：品質・オリジナル性の検査（商用利用のため毎回実行）2026-10-31

```bash
# 照合用の過去問・解答例の OCR と分析データを .tmpwork/hokudai_ref/{ocr,analysis} に置く（著作物なので git に入れない）。神戸大・阪大・立命館の ref も照合に使う
cd scripts/gacha-prints/hokudai_mock
python3 check.py 1 2 3     # 英語4語／日本語13字の一致・登場人物名の重複・解説の英文引用の実在・下線/空所の番号と設問の対応・要約の空所と語群・○×と正解の一致・正解位置の偏り・正解だけ長い選択肢・題材の近さ・render.py の固定文言 → logs/check.json（ng が空であること）
for R in 1 2 3; do python3 verify.py $R; done   # 大問ごとの語数・平均文長・難語率が 2022〜2026年度の範囲内か、字数制限・意見英作文の語数 → logs/verify_rN.json（NG なら終了コード1）
```

## LR：東北大学 前期日程 英語（全学部共通）予想問題（3回分・白黒）2026-11-01

```bash
# 必要なもの・フォントは神戸大と同じ（tohoku_mock/render.py は kobe_mock/render.py と hokudai_mock/render.py の部品を読み込む。両方を壊さないこと）
cd scripts/gacha-prints/tohoku_mock && for R in 1 2 3; do python3 render.py $R; done
# → .tmpwork/tohoku_mock/manatobi_tohoku_eng_yoso{n}_{mondai,kaitou}.pdf
#   を public/prints/print_lr_tohoku_{q,a}_{n}.pdf にコピー → サムネイル（1ページ目・72dpi・幅360で上510pxを webp q82）
#   → src/data/tohokuMockPrints.ts の pages / kb を合わせる → python3 scripts/gacha-prints/build-previews.py print_lr_tohoku_q_1 …
```
- 形式：Ⅰ・Ⅱ 長文読解（下線部和訳・内容説明・空所補充・文法正誤〈2つ〉・語句整序・内容一致・文挿入・図表の空所・語義）／Ⅲ 教授と学生の会話文（語義4つ＋意見論述 60〜80語）／Ⅳ 日本文（和文英訳1＋語句整序2〈10個から8個〉）。100分。独自配点 200点（Ⅰ 60・Ⅱ 50・Ⅲ 40・Ⅳ 50）。
- 問題データは `tN_I.py`〜`tN_IV.py`（N＝回）。本文の記法：`{u1|…}` 下線部・`{gア|…}` 文法正誤の下線・`{wa|…}` 語義の下線・`{o3}` 並べ替え（設問の words / correct から組み立てる）・`[[I]]` 空所・`[[①]]` 文挿入・`[[あ]]` 図表の空所・`*word` 注。
- 表紙と奥付に「東北大学の過去問・公式問題ではありません。予想問題であり，大学とは関係がありません」（`tests/tohokuMockPrints.test.ts` が確認）。2ページ目以降に注記ヘッダーは付けない。登場人物・団体・地名は架空。
- 分析に使った資料：2025・2026年度は大学公式サイトの公開分（問題冊子・出題意図。長文本文は著作権のため非公開で，設問・会話文・Ⅳの設問は公開）。2024年度は公開分が見つからず（旧サイトのアーカイブも取得できなかった），予備校の公開分析（大問構成・語数・設問形式）で補った。2025年度は予備校公開の解答例も照合に使用。照合用 OCR は `.tmpwork/tohoku_ref/` に置くだけで，本文・設問・解答は引用しない。
- 長文本文が非公開のため，Ⅰ・Ⅱの語数は公表語数（2023〜2026年度），平均文長・難語率は北大の長文（国立大の目安）で判定。Ⅲの会話文は 2025・2026年度の実測値で判定。

### 東北大 予想問題：品質・オリジナル性の検査（商用利用のため毎回実行）2026-11-01

```bash
cd scripts/gacha-prints/tohoku_mock
python3 check.py 1 2 3     # 英語4語／日本語13字の一致（東北大の公式PDF・出題意図・予備校解答例＋北大・神戸大・阪大・立命館）・人物名・禁止語・解説の英文引用の実在・下線/整序/語義/空所の番号と設問の対応・文法正誤の答え・整序の完成文・正解位置の偏り・題材の近さ・render.py の固定文言 → logs/check.json（ng が空であること）
for R in 1 2 3; do python3 verify.py $R; done   # Ⅰ・Ⅱ・Ⅲの語数・平均文長・難語率，Ⅰ+Ⅱの合計語数，意見論述の語数，設問数・Ⅳの構成 → logs/verify_rN.json
python3 probe.py '言い換え候補の文' …   # 書き直すときに，候補が過去問と重ならないかを先に試す
```

## LR：弘前大学 前期日程 英語（英語を課す学部で共通）予想問題（3回分・白黒）2026-11-02

```bash
# 必要なもの・フォントは神戸大と同じ（hirosaki_mock/render.py は kobe_mock/render.py と hokudai_mock/render.py の部品を読み込む。両方を壊さないこと）
cd scripts/gacha-prints/hirosaki_mock && for R in 1 2 3; do python3 render.py $R; done
# → .tmpwork/hirosaki_mock/manatobi_hirosaki_eng_yoso{n}_{mondai,kaitou}.pdf
#   を public/prints/print_lr_hirosaki_{q,a}_{n}.pdf にコピー → サムネイル（1ページ目・72dpi・幅360で上510pxを webp q82）
#   → src/data/hirosakiMockPrints.ts の pages / kb を合わせる → python3 scripts/gacha-prints/build-previews.py print_lr_hirosaki_q_1 …
```
- 形式：大問1・2 は年度によって形式が変わるので，回ごとに変えた（第1回＝会話文読解＋長文読解〈2026年度型〉，第2回＝長文読解＋英文要約400字程度〈2025年度型〉，第3回＝長文読解＋会話文の空所に入る英文を日本語 (a)〜(e) から書く〈2024年度型〉）。大問3 会話の最後の一言を完成（A・B）＋日本の事物を2〜3文の英語で説明（A・B）。大問4 約100語の英作文（e-mail で二択の一方を勧める／規則の利点と欠点／変化の利点と残る課題）。90分。独自配点 200点（各50点）。
- 問題データは `hN_1.py`〜`hN_4.py`（N＝回）と `hN.py`。大問1・2 は `type`（reading / dialogue / summary / jaen）で形式を切り替える。本文の記法：`{u1|…}` 下線部・`((1))` 会話文の空所・`[...]` 完成させる部分・`word*` 注のある語。
- 表紙と奥付に「弘前大学の過去問・公式問題ではありません。予想問題であり，大学とは関係がありません」（`tests/hirosakiMockPrints.test.ts` が確認）。2ページ目以降に注記ヘッダーは付けない。登場人物・団体・地名は架空。
- 分析に使った資料：大学公式サイト（入試情報「過去の入試問題」）で公開されている 2024〜2026年度（R6〜R8）の問題冊子と解答例・出題意図。長文の一部は著作権のため黒塗り。照合用 OCR は `.tmpwork/hirosaki_ref/` に置くだけで，本文・設問・解答は引用しない。
- 難易度の基準は公開部分の実測値（`verify.py` の冒頭に記載）。黒塗りの長文は，見えている部分の平均文長・難語率と紙面の分量から推定した語数で判定。

### 弘前大 予想問題：品質・オリジナル性の検査（商用利用のため毎回実行）2026-11-02

```bash
cd scripts/gacha-prints/hirosaki_mock
python3 check.py 1 2 3     # 英語4語／日本語13字の一致（弘前大の公式PDF・解答例・出題意図＋東北大・北大・神戸大・阪大・立命館）・人物名・禁止語・解説の英文引用の実在・下線部の番号と設問の対応・注の付け忘れ・和訳の行数/段落数・空所補充の記号の重複・配点の合計・題材の近さ・render.py の固定文言 → logs/check.json（ng が空であること）
for R in 1 2 3; do python3 verify.py $R; done   # 大問1・2・3の語数・平均文長・難語率，設問数，日本語の解答の字数，要約の字数，事物の説明の文数，英作文の語数 → logs/verify_rN.json
python3 probe.py '言い換え候補の文' …   # 書き直すときに，候補が過去問と重ならないかを先に試す
```

## LR：岩手大学 前期日程 英語（人文社会科学部・教育学部 共通問題）予想問題（3回分・白黒）2026-11-03

```bash
# 必要なもの・フォントは神戸大と同じ（iwate_mock/render.py は kobe_mock/render.py と hokudai_mock/render.py の部品を読み込む。両方を壊さないこと）
cd scripts/gacha-prints/iwate_mock && for R in 1 2 3; do python3 render.py $R; done
# → .tmpwork/iwate_mock/manatobi_iwate_eng_yoso{n}_{mondai,kaitou}.pdf
#   を public/prints/print_lr_iwate_{q,a}_{n}.pdf にコピー → サムネイル（1ページ目・72dpi・幅360で上510pxを webp q82）
#   → src/data/iwateMockPrints.ts の pages / kb を合わせる → python3 scripts/gacha-prints/build-previews.py print_lr_iwate_q_1 …
```
- 形式：大問3つ・90分・独自配点 200点。年度によって大問の組み合わせが変わるので回ごとに変えた（第1回＝長文読解（日本語記述）＋短い英文3つ（空所補充・同意語・内容）＋表を読んで120〜150語の英作文，第2回＝長文読解2題（日本語記述・和訳）＋調査結果の表を読んで題をつけた180〜220語の英作文，第3回＝長文読解（日本語記述）＋ことわざについての80語程度の英作文と和文英訳＋長文読解（5択の空所補充・同意語・続きの英文・内容不一致））。
- 問題データは `iN_1.py`〜`iN_3.py`（本文）と `iN_Mq.py`（設問。書き込みが途中で切れないよう分けた），`iN.py`（配点・架空の人物名）。設問の種類は free（日本語記述。`limit` で原稿用紙）／mcset（記号選択）／write（英作文）／jaen（和文英訳）。本文の記法：`{u1|…}` 下線部・`{w6|…}` 同意語を問う語・`((1))` 空所・`word*` 注のある語。
- 表紙と奥付に「岩手大学の過去問・公式問題ではありません。予想問題であり，大学とは関係がありません」（`tests/iwateMockPrints.test.ts` が確認）。2ページ目以降に注記ヘッダーは付けない。登場人物・団体・地名は架空。
- 分析に使った資料：大学公式サイト（入試情報「過去の入試問題」）で公開されている 2024〜2026年度の問題冊子と解答例。画像だけのPDFは OCR して `.tmpwork/iwate_ref/` に置くだけで，本文・設問・解答は引用しない。
- 難易度の基準は実測値（`verify.py` の冒頭に記載。2024年度 大問3 は約590語・平均文長18語）。

### 岩手大 予想問題：品質・オリジナル性の検査（商用利用のため毎回実行）2026-11-03

```bash
cd scripts/gacha-prints/iwate_mock
python3 check.py 1 2 3     # 英語4語／日本語13字の一致（岩手大の公式PDF・解答例＋弘前大・東北大・北大・神戸大・阪大・立命館）・人物名・禁止語・解説の英文引用の実在・下線部/空所/同意語の番号と設問の対応・注の付け忘れ・和訳の段落数・選択肢の数と重複・正解位置と「最長の選択肢が正解」の偏り・配点の合計・題材の近さ・render.py の固定文言 → logs/check.json（ng が空であること）
for R in 1 2 3; do python3 verify.py $R; done   # 長文・短文の語数・平均文長・難語率，日本語の解答の字数（字数指定の7〜10割），英作文の模範解答の語数，記号選択の小問数 → logs/verify_rN.json
python3 probe.py '言い換え候補の文' …   # 書き直すときに，候補が過去問と重ならないかを先に試す
```

## LR：秋田大学 前期日程 英語（国際資源学部・教育文化学部・医学部保健学科・情報データ科学部 共通問題）予想問題（3回分・白黒）2026-11-03

```bash
# 必要なもの・フォントは神戸大と同じ（akita_mock/render.py は kobe_mock/render.py と hokudai_mock/render.py の部品を読み込む。両方を壊さないこと）
cd scripts/gacha-prints/akita_mock && for R in 1 2 3; do python3 render.py $R; done
# → .tmpwork/akita_mock/manatobi_akita_eng_yoso{n}_{mondai,kaitou}.pdf
#   を public/prints/print_lr_akita_{q,a}_{n}.pdf にコピー → サムネイル（1ページ目・72dpi・幅360で上510pxを webp q82）
#   → src/data/akitaMockPrints.ts の pages / kb を合わせる → python3 scripts/gacha-prints/build-previews.py print_lr_akita_q_1 …
```
- 形式：60分・大問3つ・独自配点 200点（Ⅰ 70・Ⅱ 70・Ⅲ 60）。Ⅰ・Ⅱは段落番号 [1]〜 つきの記事（約700〜880語・10〜11段落）を読み，英語の設問に4択 (A)〜(D) で答える10問（語義・段落の内容・指示内容・述べられていないもの・本文と合わないもの）。Ⅲは自分の意見を1段落・約120語で書く（第1回＝地域ボランティアの義務化への賛否，第2回＝キャッシュレス決済の利点と欠点を一つずつ，第3回＝大都市か小さな町か）。2024〜2026年度の3年とも同じ構成なので，3回とも同じ形式にした。
- 問題データは `aN_1.py`・`aN_2.py`（本文）と `aN_1q.py`・`aN_2q.py`（設問。書き込みが途中で切れないよう分けた），`aN_3.py`（英作文），`aN.py`（配点・架空の固有名詞）。本文の記法：`{u|…}` 設問で問う語句（下線）・`word*` 注のある語。設問文の `<<…>>` は本文中の語句（太字斜体）。解答・解説では各設問に日本語訳をつけた。
- 表紙と奥付に「秋田大学の過去問・公式問題ではありません。予想問題であり，大学とは関係がありません」（`tests/akitaMockPrints.test.ts` が確認）。2ページ目以降に注記ヘッダーは付けない。登場人物・団体・地名は架空。
- 分析に使った資料：大学公式サイト（入試情報「過去問題」）で公開されている 2024〜2026年度（R6〜R8）の問題冊子と模範解答例。Ⅰ・Ⅱの本文は著作権のため「本文省略」で，設問・注・出典・模範解答例は画像PDFを OCR して `.tmpwork/akita_ref/` に置くだけで，本文・設問・解答は引用しない。
- 難易度の基準（`verify.py` の冒頭に記載）：本文は紙面2〜3ページ分・段落番号 [9]〜[16] から 550〜900語と推定。設問は各9〜10問。英作文の模範解答例は 115〜137語。

### 秋田大 予想問題：品質・オリジナル性の検査（商用利用のため毎回実行）2026-11-03

```bash
cd scripts/gacha-prints/akita_mock
python3 check.py 1 2 3     # 英語4語／日本語13字の一致（秋田大の公式PDF・模範解答例＋岩手大・弘前大・東北大・北大・神戸大・阪大・立命館）・人物名・禁止語・解説の英文引用の実在・設問の <<語句>> と本文の下線の対応・段落番号の範囲・選択肢4つで重複なし・正解位置と「最長の選択肢が正解」の偏り・注の付け忘れ・和訳の段落数・配点の合計・題材の近さ・render.py の固定文言 → logs/check.json（ng が空であること）
for R in 1 2 3; do python3 verify.py $R; done   # Ⅰ・Ⅱの語数・平均文長・難語率・段落数・設問数，Ⅲの解答例の語数 → logs/verify_rN.json
python3 probe.py '言い換え候補の文' …   # 書き直すときに，候補が過去問と重ならないかを先に試す
```

### 東京学芸大学 前期対策（英語コース・2026-10-31 追加）

```bash
# 中身は scripts/gacha-prints/gakugei_mock/r{1,2,3}*.py（データ）、紙面は render.py（HTML → Chromium で PDF。試験冊子・白黒・解答用紙3枚つき）
python3 scripts/gacha-prints/gakugei_mock/render.py all   # → .tmpwork/gakugei/ に問題・解答解説、public/prints/print_lr_niji_gakugei_en_N.pdf に1冊
# サムネ（表紙・360×510）は render のあとに作り直す（作り方は PR の手順どおり）。中身を少し見る画像：
python3 scripts/gacha-prints/build-previews.py print_lr_niji_gakugei_en_1 print_lr_niji_gakugei_en_2 print_lr_niji_gakugei_en_3
# src/data/nijiMockPrints.ts の gakugei(n, pages, kb) を実物に合わせる
```

- 大問の型（Ⅰ長文読解・Ⅱ英文の250字要約・Ⅲ和文英訳・Ⅳ200語程度の意見英作文・Ⅴディクテーション／筆記90分＋約10分）だけを公開情報から参考にし、**過去問・解答例・講評は読んでいない**。英文・設問・解答・表紙の文言はすべて書き下ろし。
- 配点は全体を100とした割合（Ⅰ30・Ⅱ25・Ⅲ20・Ⅳ15・Ⅴ10）。render.py が大問ごと・全体の合計を検査する（合わなければ止まる）。
- Ⅴの音声はつけていない。解答・解説編の最後に「読み上げ原稿」（区切り／つき・読み方の指示）を載せ、人に読んでもらう形にした。
- Playwright は `docs/code_guide/.work/pw`（update.sh が入れる）を使う。無い環境では `npm i playwright` してから。

### 琉球大学 前期対策（2026-10-31 追加）

```bash
# 中身は scripts/gacha-prints/ryukyu_mock/r{1,2,3}*.py（r{n}_p1/p1q/p2/p2q/p3/p4 に大問ごと・r{n}.py でまとめる）。紙面は render.py
python3 scripts/gacha-prints/ryukyu_mock/render.py all   # → .tmpwork/ryukyu/ に問題・解答解説、public/prints/print_lr_niji_ryukyu_en_N.pdf に1冊
python3 scripts/gacha-prints/build-previews.py print_lr_niji_ryukyu_en_1 print_lr_niji_ryukyu_en_2 print_lr_niji_ryukyu_en_3
# サムネ（表紙・360×510）は東京学芸大学と同じ作り方。src/data/nijiMockPrints.ts の ryukyu(n, pages, kb) を実物に合わせる
```

- 大問の型（1 論説の長文・記号選択30点／2 物語文・記号選択と出来事の並べ替え30点／3 会話文の空所10か所10点／4 グラフを読んで150語程度の英作文30点・100分）だけを公開情報から参考にし、英文・設問・グラフ・解答はすべて書き下ろし。人物・町・調査・グラフの数値は架空。
- 過去問（令和8）の問題文を OCR したものと照合し、英5語・日12字の連続一致が0件であることを確認（指示文の定型句も言い換えた）。
- render.py が検査すること：大問ごと・全体の配点（合計100）、記号の答えが選択肢にあるか、大問1 問1・大問3 は選択肢を1回ずつ使うか、並べ替えの答えが全部の出来事を1回ずつ含むか、英作文の解答例が135〜175語か。合わなければ止まる。
- グラフは render.py の `chart_svg()` が白黒の棒グラフ（濃さ・白・灰で系列を見分ける）を描く。

### 熊本大学 前期対策（2026-11-01 追加）

```bash
# 中身は scripts/gacha-prints/kumamoto_mock/r{1,2,3}*.py（r{n}_p1/p1q/p2/p3/p4 に大問ごと・r{n}.py でまとめる）。紙面は render.py
python3 scripts/gacha-prints/kumamoto_mock/render.py all   # → .tmpwork/kumamoto/ に問題・解答解説、public/prints/print_lr_niji_kumamoto_en_N.pdf に1冊
python3 scripts/gacha-prints/build-previews.py print_lr_niji_kumamoto_en_1 print_lr_niji_kumamoto_en_2 print_lr_niji_kumamoto_en_3
# サムネ（表紙・360×510）は琉球大学と同じ作り方。src/data/nijiMockPrints.ts の kumamoto(n, pages, kb) を実物に合わせる
```

- 前期の英語は全学部共通（文・教育・法・理・医・薬・工・情報融合・共創）。大問の型（Ⅰ 長文・字数制限つきの日本語記述と記号・並べ替え・四角の空所／Ⅱ 英語の設問に英語で答える長文／Ⅲ 80〜100語の意見英作文／Ⅳ 会話文の空所20か所に語群25語から入れる・120分）だけを公開情報から参考にし、英文・設問・解答はすべて書き下ろし。
- 配点は大学が公表していないため、編集部の想定（Ⅰ32・Ⅱ32・Ⅲ16・Ⅳ20）とした。表紙・奥付にもそう書いた。
- 過去問（R6〜R8）の問題文を文字に起こしたものと照合し、英5語・日12字の連続一致が0件であることを確認（指示文も言い換えた）。
- render.py が検査すること：配点の合計、日本語の解答例が字数制限に収まるか、並べ替えの答えが与えた語をちょうど使うか、記号の答えが選択肢にあるか、Ⅳの答えが語群の語を1回ずつ使い空所が本文にそろっているか、英作文の解答例が80〜100語か。

### 佐賀大学 前期対策（2026-11-01 追加）

```bash
# 中身は scripts/gacha-prints/saga_mock/r{1,2,3}*.py（r{n}_p1〜p4 に大問ごと・r{n}.py でまとめる）。紙面は render.py
python3 scripts/gacha-prints/saga_mock/render.py all   # → .tmpwork/saga/ に問題・解答解説、public/prints/print_lr_niji_saga_en_N.pdf に1冊
python3 scripts/gacha-prints/build-previews.py print_lr_niji_saga_en_1 print_lr_niji_saga_en_2 print_lr_niji_saga_en_3
# サムネ（表紙・360×510）は琉球大学と同じ作り方。src/data/nijiMockPrints.ts の saga(n, pages, kb) を実物に合わせる
```

- 前期の英語は教育・経済・医・農学部の共通問題（全員が同じ4題を解く）。大問の型（1 英文の要旨を100字程度の日本語でまとめる／2 短い会話文の空所に入る英文を4択／3 図つきの長文の4択2問と約60語の英語での記述／4 英文を読んで100語程度の意見英作文・100分・20・20・30・30点）だけを公開情報から参考にし、英文・設問・図・解答はすべて書き下ろし。
- 過去問（R6〜R8・大学公開のスキャン画像）を OCR で文字に起こしたものと照合し、英5語・日12字の連続一致が0件であることを確認（設問の決まり文句も言い換えた）。
- render.py が検査すること：配点の合計、日本語の解答例が80〜120字か、記号の答えが選択肢にあるか、3(3) の解答例が45〜75語か、4 の解答例が85〜115語か、採点の目安の合計が配点と合うか。

### 九州大学 前期対策（2026-11-01 追加）

```bash
# 中身は scripts/gacha-prints/kyushu_mock/r{1,2,3}*.py（r{n}_p1/p1q・p2/p2q・p3/p3q・p4・p5 に大問ごと・r{n}.py でまとめる）。紙面は render.py
python3 scripts/gacha-prints/kyushu_mock/render.py all   # → .tmpwork/kyushu/ に問題・解答解説、public/prints/print_lr_niji_kyushu_en_N.pdf に1冊
python3 scripts/gacha-prints/build-previews.py print_lr_niji_kyushu_en_1 print_lr_niji_kyushu_en_2 print_lr_niji_kyushu_en_3
# サムネ（表紙・360×510）は琉球大学と同じ作り方。src/data/nijiMockPrints.ts の kyushu(n, pages, kb) を実物に合わせる
```

- 前期の英語は全学部共通の1冊（学部ごとに満点を換算するだけ）。大問の型（〔1〕〜〔3〕 段落番号つきの長文：前置詞・4択の空所、下線部和訳、50字以内の説明、本文から1語の抜き出し、内容一致、出来事の順序、約30語の英語での要約／〔4〕 約100語の自由英作文／〔5〕 グラフを約80語で説明・120分・40・45・45・40・30点の計200点）だけを公開情報から参考にし、英文・設問・図・解答はすべて書き下ろし。
- 小問ごとの配点は大学が公表していないため編集部の想定。表紙・奥付にもそう書いた。
- 過去問（R7・R8・大学公開。本文は大学側で省略）の設問・解答例・出題意図を文字にしたものと照合し、英5語・日12字の連続一致が0件であることを確認（「〜を日本語に訳しなさい」「in a paragraph of approximately … words」などの決まり文句も言い換えた）。
- render.py が検査すること：大問ごとの配点（40・45・45・40・30）と合計200、下線部・空所が本文にあるか、記号の答えが選択肢にあるか（前置詞は1回ずつ）、並べ替えが全項目を使うか、抜き出しの1語が本文にあるか、日本語の解答例が字数制限内か、英語の解答例の語数（要約22〜40語・〔4〕85〜115語・〔5〕65〜95語）、採点の目安の合計が配点と合うか。

### 福岡女子大学 前期対策（2026-11-02 追加）

```bash
# 中身は scripts/gacha-prints/fwu_mock/r{1,2,3}*.py（r{n}_p1/p1q・p2/p2q・p3 に大問ごと・r{n}.py でまとめる）。紙面は render.py
python3 scripts/gacha-prints/fwu_mock/render.py all   # → .tmpwork/fwu/ に問題・解答解説、public/prints/print_lr_niji_fwu_en_N.pdf に1冊
python3 scripts/gacha-prints/build-previews.py print_lr_niji_fwu_en_1 print_lr_niji_fwu_en_2 print_lr_niji_fwu_en_3
# サムネ（表紙・360×510）は琉球大学と同じ作り方。src/data/nijiMockPrints.ts の fwu(n, pages, kb) を実物に合わせる
```

- 前期の英語は国際教養・環境科学・食・健康の3学科で同じ問題。大問の型（問題Ⅰ・Ⅱ 約700語の長文：空所補充・下線部和訳・下線部の理由／内容の日本語説明・語の並べかえ・本文の語の抜き出し・語形を変えて補う・内容一致（すべて選ぶ）・要旨の選択／問題Ⅲ 和文英訳2問・90分）だけを公開情報から参考にし、英文・設問・解答はすべて書き下ろし。
- 配点は大学が公表していないため、この冊子では100点満点（40・40・20）とした。表紙・奥付にもそう書いた。
- 過去問（2020・2023・2024・2025年度と2025年度の解答・解答例。大学公開）を文字にしたものと照合し、英5語・日12字の連続一致が0件であることを確認（「同じ意味で使われている語を」などの決まり文句も言い換えた）。
- render.py が検査すること：大問ごとの配点（40・40・20）と合計100、本文の語数（680〜950語）、全訳の段落数、下線部・空所が本文にあるか（語形を変える問題は空所が2か所以上）、記号の答えが選択肢にあるか、並べかえの語が答えと一致し最初から正解の順になっていないか、抜き出しの1語・元の動詞が本文にあるか、採点の目安の合計が配点と合うか、和文英訳の解答例が2つあるか。

### 東京外国語大学 前期対策（2026-11-03 追加）

```bash
# 中身は scripts/gacha-prints/tufs_mock/r{1,2,3}*.py（r{n}_p1/p1q・p2・p3・p4・p5 に大問ごと・r{n}.py でまとめる）。紙面は render.py
python3 scripts/gacha-prints/tufs_mock/render.py all   # → .tmpwork/tufs/ に問題・解答解説、public/prints/print_lr_niji_tufs_en_N.pdf に1冊
python3 scripts/gacha-prints/build-previews.py print_lr_niji_tufs_en_1 print_lr_niji_tufs_en_2 print_lr_niji_tufs_en_3
# サムネ（表紙・360×510）は琉球大学と同じ作り方。src/data/nijiMockPrints.ts の tufs(n, pages, kb) を実物に合わせる
```

- 前期の「英語」は言語文化・国際社会・国際日本の3学部で同じ1冊（120分・250点・リスニングを含む）。英語スピーキング試験（BCT-S）は別の試験なので対象外。
- 大問の型（1 約1000語の長文・下線部を40〜70字の日本語で説明6問・60点／2 約550語の長文・11語の語群から選び必要なら形を変える空所10・30点／3 講義を1回聞いて3択8問・40点／4 インタビューを1回聞いて3択8問・40点／5 メモ用紙を見ながら講義を2回聞き、150語前後の要約と200語前後の意見文・80点）だけを公開情報から参考にし、英文・設問・放送原稿・解答はすべて書き下ろし。
- リスニングの音声はつけていない。解答・解説編の最後に「読み上げ原稿」（読む人への指示つき）を載せ、人に読んでもらう形にした（東京学芸大学のⅤと同じ扱い）。
- 過去問（2026年度の問題。サイバーカレッジがサイト上で公開しているパスワードで閲覧）と、2024〜2026年度の正解・解答例（大学公式）を文字にしたものと照合し、英5語・日12字の連続一致が0件であることを確認（「その内容に合うように」「あなたの意見を…語程度の英語で」などの決まり文句も言い換えた）。
- render.py が検査すること：大問ごとの配点（60・30・40・40・80）と合計250、本文・原稿の語数、全訳・原稿の訳の段落数、大問1の下線部が本文にあるか・解答例が字数制限の6割〜10割か、大問2の語群が11語で10語を1回ずつ使い形を変える空所が4つ以上あるか、大問3・4が8問ずつで答えがa〜cに散らばっているか、大問5のメモ用紙の空欄数と答えの数が合うか・要約（130〜170語）と意見文（180〜220語）の解答例の語数、採点の目安の合計が配点と合うか。
### 四国（香川・徳島・愛媛・高知）前期対策（2026-11-02 追加）

```bash
# 中身は scripts/gacha-prints/niji_shikoku/{slug}/r{1,2,3}.py、紙面は common.py、大学ごとの設定は cfg.py
cd scripts/gacha-prints/niji_shikoku
python3 run.py kochim 1        # → 問題＋解答解説を pdfunite して public/prints/print_lr_niji_kochim_en_1.pdf と thumbs を作り、ledger.json に pages/kb を記録
python3 plag.py kochim         # 過去問・公式解答のテキストと照合（英5語・日12字）。TOTAL 0 であること
python3 ../build-previews.py print_lr_niji_kochim_en_1 …   # previews
```

- 学部・コースで問題が違う大学は系統ごとに3回分（計27冊）。
  - 香川（kagawa）・徳島（tokushima）：全学部共通
  - 愛媛：法文学部・工学部〈文理型〉（ehimeh：物語文・評論・和文英訳）／教育学部（ehimee：長文2題・書き出し指定の英作文）／医学部医学科 総合問題〈英文〉（ehimem：医療英文の抜き出し・字数制限の日本語記述）
  - 高知：人文社会 人文科学コース（kochij：長文・会話・整序）／同 国際社会コース（kochik：＋自由英作文100語）／教育学部（kochie：長文・文法・1語補充・整序・英作文）／医学部医学科（kochim：長文・会話・整序・医療長文）
- 表紙・奥付に「{大学名}の過去問・公式問題ではありません。予想問題であり、大学とは関係がありません。」
- 厳格チェック（2026-11-03）：`python3 strict/gate.py {id…}`（英語5語以上・日本語10字以上の連続一致。記号の並びと大学名だけ除く）と `python3 strict/para.py`（1文ごとの言い換え検出）がどちらも 0 件であること。照合元は各大学の過去問・解答例（画像PDFは300dpiで全ページOCRし直したもの）。指示文の決まり文句も過去問と重ならない独自の言い回しにしている（置き換え表は `strict/fix.py`）。

### 鳥取大学 前期対策（2026-11-03 追加）

```bash
cd scripts/gacha-prints/niji_shikoku   # 四国と同じ道具（cfg.py に 'tottori' を追加）
python3 run.py tottori 1 2 3
python3 plag.py tottori && python3 strict/gate.py tottori && python3 strict/para.py   # どれも 0 件
python3 ../build-previews.py print_lr_niji_tottori_en_1 print_lr_niji_tottori_en_2 print_lr_niji_tottori_en_3
```

- 英語は英語を課す全学部の共通問題なので3回分。形式は過去3年分（令和6〜8年度）の公開問題に合わせた：［Ⅰ］［Ⅱ］長文読解（和訳・下線部説明・語義/語形・内容一致2つ）／［Ⅲ］下線部の和文英訳／［Ⅳ］40語以上の自由英作文・90分。配点は大学非公表のため本書の想定（60・60・40・40）。
- 照合元は鳥取大学の公開問題・出題意図・解答例（令和6〜8年度。画像PDFは300dpiで全ページOCR）。本文は大学が著作権の都合で非公開にしている部分が多いが、公開部分（設問文・選択肢・自由英作文の問い）と照合し、英5語・日10字の一致と1文ごとの言い換えがどちらも0件。

### 山口大学 前期対策（2026-11-03 追加）

```bash
# 中身は scripts/gacha-prints/yamaguchi_mock/r{1,2,3}*.py（r{n}_p1/p1q・p2/p2q・p3/p31/p32 に大問ごと）
python3 scripts/gacha-prints/yamaguchi_mock/render.py all   # → .tmpwork/yamaguchi/ に問題・解答解説、public/prints/ に結合PDF
python3 scripts/gacha-prints/build-previews.py print_lr_niji_yamaguchi_en_1 print_lr_niji_yamaguchi_en_2 print_lr_niji_yamaguchi_en_3
# サムネ（表紙・360×510）は福岡女子大学と同じ作り方。src/data/nijiMockPrints.ts の pages / kb を実物に合わせる
```

- 前期の「外国語（英語）」は全学部共通の1種類なので3回分。120分・200点（R8 募集要項）。
- 形式は公開されている問題・解答例・出題の意図（令和7・8年度）の「形」だけを参考にした：Ⅰ 約1000語の解説文で設問も解答も英語（本文の語句で文を完成・下線部の説明・記号選択・T/F・頭文字つき要約の空所・表題）／Ⅱ 約1000語のエッセイ・物語で設問は日本語（下線部和訳・内容説明・語義・日本語要約の空所・出来事の順番）／Ⅲ-1 記事を読んで会話の空所に英語／Ⅲ-2 日本語で示した①〜④を英語にしてメールを完成。
- 大問の配点（65・65・30・40）は公開問題の大問配点にならった。小問の配点は編集部の想定。
- 表紙と奥付に「山口大学の過去問・公式問題ではありません。予想問題であり、大学とは関係がありません。」を明記。
- 照合：過去問（画像PDFは200dpiで全ページOCR）・解答例・出題の意図と、英語5語・日本語12字の連続一致が 0 件（指示文の決まり文句も言い換え済み）。照合用のテキストは著作物なので git に入れない。
- render.py が検査すること：大問ごとの配点と合計200、本文の語数（880〜1080語）・全訳の段落数、下線部の位置、英語で答える問題の語数と「本文の語句で」の語が本文にあるか、頭文字つき空所の頭文字、T/F の偏り、出来事の順番が最初から正解の順になっていないこと、Ⅲ の空所数・解答例2つずつ・採点の目安の合計。

