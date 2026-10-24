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
