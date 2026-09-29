# ビルドとメモリについて

`npm run build` が GenSpark のサンドボックスで OOM（Out Of Memory）になる問題の調査記録と、
その結論をまとめたものです。**結論から言うと、これはアプリの構造の問題ではなく、環境のメモリ不足です。**

---

## 1. 結論（先に読むところ）

| 質問 | 答え |
| --- | --- |
| なぜ `npm run build` が落ちるのか | GenSpark サンドボックスが **メモリ 985MB / swap 0** で、ビルドのピーク（約 810MB）が物理的に収まらないから |
| アプリのコード構造が悪いのか | **いいえ。** コードを1行も変えずに swap を足すだけで成功する |
| 本番（Vercel 等）は大丈夫か | **問題ありません。** 十分なメモリと swap があるため、元から発生していない |
| サンドボックスでビルドしたいときは | 下の「swap を足す手順」を実行する。これが唯一確実な方法 |

### swap を足す手順（サンドボックスでビルドしたいとき）

```sh
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

その後 `npm run build` を実行すれば通ります。swap は再起動で消えるので、必要なときに再実行してください。

---

## 2. 実測データ

### 2-1. 環境の制約が原因であることの証明

同一のコード・同一の設定で、swap の有無だけを変えた比較です。

| 条件 | 結果 |
| --- | --- |
| メモリ 985MB / **swap 0** | `✓ 2250 modules transformed` → **`Killed`（終了コード 137 = SIGKILL）** |
| メモリ 985MB / **swap 4GB** | **`✓ built in 1m 6s`（終了コード 0）**、swap 使用量 210MB |

コードも設定も変えていないので、**差分は環境だけ**です。これが「環境制限による問題」と断定した根拠です。

### 2-2. ビルド設定ごとのピークメモリ

swap を有効にして完走させ、ピーク RSS を測りました（985MB に収まるかの判定に使えます）。

| 設定 | ピーク RSS | 所要時間 | 判定 |
| --- | --- | --- | --- |
| 素の設定（チューニングなし） | 809MB | 17s | 基準 |
| ＋ `manualChunks` | 805MB | 15s | **メモリ効果なし**（誤差の範囲） |
| ＋ `maxParallelFileOps: 2` | **776MB** | 16s | **−33MB の実効果** |

> **重要**: `manualChunks` は当初「メモリ削減のため」と考えていましたが、**実測ではメモリに効きませんでした。**
> それでも残しているのは、メモリではなく**配信とキャッシュ**に効くからです（下記 3-2）。

### 2-3. V8 ヒープ上限（`--max-old-space-size`）は効かなかった

メモリ 985MB / swap 0 で上限値を振った結果です。

| 上限 | 結果 |
| --- | --- |
| 620 / 550 / 512 / 482 / 443 MiB | `Killed`（SIGKILL。OS に殺される） |
| 413 MiB | `FATAL ERROR: Reached heap limit Allocation failed`（SIGABRT。V8 が自死） |

上限が大きいと OS に殺され、小さいと V8 が自死します。**間に成功する幅がありません。**
そのため「効かない設定を無理に残さない」方針で、**ヒープ上限の指定は削除しました。**

（なお、上限を付けて成功したケースと付けずに成功したケースで、
出力チャンクのハッシュは 13 個中 12 個が一致しました。
つまりヒープ上限は**成果物を変えない**設定です。）

---

## 3. 現在残している設定と、その理由

`vite.config.ts` に残っているのは次の2つだけです。

### 3-1. `maxParallelFileOps: 2` — メモリのため

Rollup が同時に開くファイル数の上限。既定は CPU 数に応じて増えるため、並列数がそのままメモリのピークに乗ります。
実測で **−33MB**。出力内容は並列数に影響されないので、**成果物は同一**です。

### 3-2. `manualChunks` — 配信とキャッシュのため（メモリのためではない）

分割前は `index.js` が単一チャンクで **5,243.21 kB** でした。現在は次のように分かれます。

| チャンク | サイズ |
| --- | --- |
| `data`（教科データ全部） | 3,040.45 kB |
| `index`（アプリ本体） | 1,037.61 kB |
| `vendor-firebase` | 471.67 kB |
| `vendor-katex` | 294.22 kB |
| `vendor-react` | 196.52 kB |
| `vendor-motion` | 126.67 kB |
| `vendor-icons` | 40.11 kB |
| `vendor` | 29.75 kB |

利点は、アプリを更新してもライブラリ側のキャッシュが効き続けること、
教科データを追加したとき再ダウンロードされるのが `data` だけで済むことです。
アプリが大きくなるほど効きます。

**UI・UX には影響しません。** `manualChunks` は「どのモジュールをどのファイルに出力するか」だけを
決める設定で、import される内容・実行順序・副作用は変えません。
静的 import は従来どおり全部読み込まれます（`dist/index.html` で全チャンクが `modulepreload` される）。
つまりブラウザが実行するコードは分割前と同一で、画面・デザイン・フォント・遷移・アニメーションは変わりません。

### 3-3. 削除した設定

| 設定 | 削除した理由 |
| --- | --- |
| `--max-old-space-size`（V8 ヒープ上限） | これ単独でビルドが通ったことが一度も無い（上記 2-3） |
| `sourcemap: false` | Vite の既定値と同じで、書いても書かなくても挙動が同じ |

---

## 4. `src/data` を教科別チャンクに分けてはいけない理由

過去に `data` を教科ごとに分割したところ、**ビルドは成功するのに本番の画面が真っ白**になりました。

```
ブラウザ: Cannot access 'D' before initialization
Rollup 警告: Circular chunk: data-chemistry -> data-english-listening -> data-chemistry
             Circular chunk: data-english-grammar -> data-chemistry -> data-english-grammar
```

依存グラフを機械的に解析して原因を特定しました。

- **ファイル単位の循環依存は 0 件**（164 ファイル / 383 辺を Tarjan の SCC で検査。相互 import も 0 件）
- つまり「教科データ同士が循環している」わけではない
- 原因は **`src/data` が `src/utils` を import していること**（10 本）

### 4-1. 原因の実体

Rollup と同じチャンク割り当てを再現して全依存辺を数えた結果が次です
（`data` を `data` / `data-chem` / `data-listen` に割った場合）。

| 方向 | 本数 | 代表例 |
| --- | --- | --- |
| `data-chem` → `index` | 1 | `data/chemistryData.ts` → `utils/explanationFormat.ts` |
| `index` → `data-chem` | 12 | `App.tsx`、`Explanation.tsx` ほか → `data/chemistryData.ts` |
| `data` → `index` | 6 | `data/unitTeaching.ts` ほか → `utils/explanationFormat.ts` |
| `index` → `data` | 40 | 多数のコンポーネント → 各教科データ |

つまり循環しているのは教科データ同士ではなく、**`data 系チャンク` と `index チャンク` の間**です。

```
chemistryData.ts  →  utils/explanationFormat.ts   （data-chem → index）
App.tsx など      →  chemistryData.ts             （index → data-chem）
```

`utils` はコンポーネントと同じ `index` チャンクに入るため、
データ層が `utils` を1本でも参照していれば、`data` をどう細かく割っても必ず `index` を経由して環になります。
ESM はチャンク間の初期化順を決められず、初期化前の変数アクセス（`Cannot access 'D' before initialization`）で落ちます。

> **訂正**: 以前この節には「原因は `chapterCatalog` が全教科を集めるハブだから」と書いていましたが、**これは誤りでした。**
> 実際に `chapterCatalog` を分割対象から除外してビルドしても、`Circular chunk` は解消しませんでした。
> 上の辺の数え直しで、真因が `data → utils` であることが判明したため書き換えています。

### 4-2. 現在の結論：教科別分割は行わない

| 判断材料 | 実測 |
| --- | --- |
| メモリ削減効果 | **0**（809MB → 805MB。誤差の範囲） |
| 失敗したときの症状 | **画面が真っ白**（致命的） |
| 得られる利益 | 配信キャッシュの粒度が細かくなるだけ |
| 成立させるための前提 | `data → utils` の 10 本すべてを解消する大改造 |

**利益がゼロで、失敗時の被害が最大**なので、現在の単一 `data` チャンク（循環 0・ビルド成功）を維持します。

将来どうしても割りたくなった場合の前提条件は、
**教科データが `utils` に依存しないようにする**ことです（例: `explanationFormat` のうちデータが使う部分を
`src/data` 側の純粋なヘルパーへ移す）。これを先に済ませない限り、チャンク設定だけ変えても必ず真っ白になります。

---

## 5. サンドボックスで作業するときの注意（実地で踏んだもの）

- `pkill -f` / `pgrep -f` は**自分自身のシェルを巻き込んで殺す**ことがある。`ps -eo pid,args` で PID を確認して個別に kill する
- `npx vite` はネットワークから別バージョンの vite を取得してしまうことがある。`./node_modules/.bin/vite` か `npm run` を使う
- ビルドが SIGABRT で落ちると、リポジトリ直下に **1GB を超える `core` ダンプ**が残ることがある（`.gitignore` 済み）
- swap 0 で OOM ビルドを繰り返すと、サンドボックス自体が応答しなくなることがある。検証時は swap を有効にしてから行う

---

## 6. スクリプト

| コマンド | 内容 |
| --- | --- |
| `npm run build` | `scripts/build.sh` 経由。設定は変えず、メモリ不足を検出したら対処法を表示してからビルドする |
| `npm run build:raw` | `vite build` をそのまま実行する（ラッパーを通さない） |
