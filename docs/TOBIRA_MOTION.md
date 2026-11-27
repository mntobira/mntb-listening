# とびら君モーションの台帳（どの動画を・どこに入れるか）

`src/components/TobiraMotion.tsx` の `TOBIRA_MOTIONS` が再生する「背景なし」の短い動画。
全画面の演出動画（`docs/CINEMATICS.md`：タイトル・コンボ・ガチャ・勝利）とは別物で、**いつもの静止画のとびら君の位置で、その場で動く**。

| 名前 | 置き場所（ファイル） | いつ動くか | 長さ | First→Last | 状態 |
|---|---|---|---|---|---|
| walk | ホームのとびら君（`Home.tsx`） | ホーム表示中ずっと（基本／おさんぽポーズ時・くり返し） | 1.8秒 | walking→walking | 取り込み済み（2026-11-27） |
| greet | ホームのとびら君（`Home.tsx`） | その日はじめてホームを開いたとき（1日1回） | 3.0秒 | basic→basic | 未生成 |
| wakeup | ホームのとびら君（`Home.tsx`） | 3日以上あいて開いたとき（greet の代わり・1日1回） | 3.5秒 | sleeping→basic | 未生成 |
| cheer | ミッション達成スタンプ（`MissionToast.tsx`） | デイリーミッションを達成した瞬間 | 2.5秒 | basic→basic | 未生成 |
| encourage | 対戦結果（`BattleResult.tsx`） | 負けたとき（勝ちは victory.mp4、引き分けは静止画） | 3.0秒 | thinking→basic | 未生成 |
| think | 全国対戦の相手さがし（`BattleMatchingRadar.tsx`） | 待っている間ずっと（くり返し） | 2.4秒 | thinking→thinking | 未生成 |

プロンプトは `docs/TOBIRA_MOTION_PROMPTS.md`。

## 取り込み手順
1. **Adobe Firefly の「Firefly Video」モデル**で、真緑背景・Square(1:1)・5秒で作る（プロンプト集どおり）。MP4 をダウンロード。
2. `bash scripts/tobira-motion/import.sh <原本.mp4> <名前> <開始秒> <長さ秒>`
   → `public/tobira-motion/<名前>.webm / .webp / .png` ができる（各 1MB 未満でないと止まる）。
3. `TobiraMotion.tsx` の `TOBIRA_MOTIONS.<名前>.ready` を `true` にし、`ms` を実際の長さに合わせる。
4. この表の「状態」を「取り込み済み（日付・Firefly Video・seed）」にする。
5. `npx vitest run tests/tobiraMotion.test.ts`（ready のものはファイルがそろっているか・1MB 未満かを確かめる）。

## 再生しない条件（静止画のまま）
- 動きを減らす設定（prefers-reduced-motion）・データセーバー・低スペック端末（`html[data-perf=lite]`）・アプリが裏にいるとき
- 読み込み失敗・再生失敗（黙って静止画に戻す）
- `ready: false`（ファイル未配置）

## 形式の理由
- **WebM（VP9＋透過）**：Chrome / Android / Edge / Firefox。480×480・24fps で 3 秒 約 150KB。
- **アニメ WebP**：Safari / iOS は透過 WebM を出せないため。320×320・15fps で 3 秒 約 280KB。
- MP4（H.264）は透過を持てないので使わない。
