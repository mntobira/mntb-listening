# 教科を追加する手順

問題データ（`src/data/*.ts`）を受け取ってから、アプリに教科を1つ足すまでの手順です。
教科の名前・公開状態・章IDの形・配色などは **`src/data/subjects.ts`（教科の登録簿）1か所** に集めてあり、
ホーム・単元一覧・復習ノート・先生用画面・クラス作成・状態の復元は、すべてこの登録簿から作られます。

下の例では数学（`math`）を足します。

## 1. 問題データを置く

- `src/data/mathData.ts` に、英文法（`englishGrammarData.ts`）と同じ形のデータを置く
  - `export const mathData = { parts: [{ chapters: [...] }] }`（型は `src/types/curriculum.ts` の `Part` / `Chapter` / `Problem`）
  - 章IDは **他の教科と重ならない接頭辞** にする（例: `m1_1`）。リスニングは `el…`、英文法は `eg…`
- 「収録ボリューム」（科目カードの数字）を返す `getMathStats()` を置く
  - 専用の数え方が無ければ `{ chapters: 章の数, questions: countProblemsInChapters(章) }` でよい（`src/data/problemCount.ts`）

## 2. 登録簿に1件足す — `src/data/subjects.ts`

```ts
{
  id: 'math',                       // 保存データのキー。公開後は変えない
  label: '数学',
  shortLabel: '数学',               // 復習タブなど狭い場所
  enabled: true,                    // false にすると、カード・ナビ・状態の復元・一覧のすべてから消える
  chapterIdPattern: /^m\d+_\d+$/,   // 手順1の章IDの形
  entry: 'chapters',                // 'mode_selection' にすると、演習の前に学習モード選択を挟む
  practiceDescription: '…',          // 学習モード選択の「演習問題」カードの説明
  learningDescription: '…',          // 書いたときだけ「まとめプリント」カードが出る（任意）
  theme: { … },                     // 配色（既存の教科と色相が近すぎないもの）
  reviewStyle: { … },               // 復習ノートのタブ・帯の色
},
```

## 3. 型エラーが出る場所を埋める（2か所）

登録簿に足すと `SubjectKey` に `'math'` が加わり、次の2か所が型エラーになります。エラーの出た場所に1行ずつ足します。

| ファイル | 足すもの |
| --- | --- |
| `src/data/allChapters.ts` の `SUBJECT_DATA` | `math: mathData,` |
| `scripts/gen-chapter-index.mts` の `buildSubjectStats` | `math: getMathStats(),` |

## 4. 索引を作り直す

```bash
npm run gen:index        # src/data/chapterIndex.generated.ts（ホームなどが読む軽い索引）
```

## 5. 確かめる

```bash
npx tsc --noEmit
npx vitest run tests/subjectRegistry.test.ts
```

`tests/subjectRegistry.test.ts` が、教科データ・索引・統計・名前・配色・復習タブ・公開状態・入口・クラス作成が
登録簿と揃っていること、全章IDがその教科の形にだけ当てはまることを検査します。

## 任意（必要なときだけ）

- **対戦にも出す**: `src/battle/data/battlePool.ts` の `loadRaw` / 解答の読み込みに `case 'math'` を足し、
  `src/battle/core/battleRules.ts` にルールを足してから `npm run gen:battle-pool`
- **起動を軽く保つ**: `vite.config.ts` の `manualChunks` に、その教科のデータ用のチャンクを1つ足す
  （足さなくても動くが、`data` チャンクにまとまって起動時に読む量が増える）
- **とびら君の豆知識**: `src/data/mascotTips.ts` の `TipCategory` / `CATEGORY_SUBJECT` に分野を足し、豆知識を並べる
- **演習するタブに並べる**: `src/data/studyCatalog.ts` に項目を足す
- **数式を組版する**: 数学のように数式を含む教科は `src/utils/textFormatter.tsx` の `setFormatMathContext` を
  その教科の演習・解説画面で有効にする（`App.tsx`）

## ガチャの景品について

ガチャの UR 学習プリント（`public/prints/` と `src/data/gachaPrints.generated.ts`）には、英語以外の教科のプリントも含まれています。
教科データとは独立しているので、教科を足しても外しても **景品はそのまま** です。
