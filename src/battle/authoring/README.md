# src/battle/authoring — 対戦問題バンクの「生成時だけ」使うコード

`npm run gen:battle-pool`（`scripts/gen-battle-pool.mts`）が、教材データから対戦用の問題バンク
（`src/battle/data/battlePool*.ts`）を作るときにだけ使う。**アプリ本体からは import しない。**

| ファイル | 役割 |
|---|---|
| `authoredTypes.ts` | 手書きの対戦問題ファイル（JSON）の型 |
| `authoredConvert.ts` | 手書き問題 → `BattleQuestion` への変換と検査 |
| `questionPrompt.ts` | 教材の小問から、対戦で出す1問の問題文を組み立てる |
| `battleTiming.ts` | 1問あたりの制限時間の下限・上限・比率 |

型チェック（`npm run lint`）の対象に残すため `scripts/` ではなく `src/` に置いている。
アプリから import されていないことは `tests/moduleGraph.test.ts` で確認している。
