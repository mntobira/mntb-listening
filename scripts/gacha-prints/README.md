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
python3 scripts/gacha-prints/build-reading-mock.py      # 共通テスト英語リーディング 大問別演習（問題データ reading_mock_a.py・解き方 reading_guide.py）
python3 scripts/gacha-prints/build-analysis-book.py     # 共通テスト全科目 出題分析（データ analysis_*.py・出典つき）
```
- 共通レイアウトは `book_common.py`（紺と金の表紙・帯・囲み）。
- 作り直したら `src/data/gachaPrints.generated.ts` の pages / kb を合わせる（`tests/gachaDeluxe.test.ts` が検査）。
- リーディングは第1回（reading_mock_a.py）・第2回（reading_mock_b1.py＋b2.py）。第3回は同じ形のデータを足して BOOKS に1行追加。
