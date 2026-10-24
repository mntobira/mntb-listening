# Adobe Firefly 動画キットの台帳（2026-10-24）

元データは `scripts/firefly-kit/videos.py`（ここを直して `python3 scripts/firefly-kit/build_kit.py --docs` で PDF・画像・この表を作り直す）。
生成は **Adobe Firefly の Firefly Video モデルだけ**（商用利用に安全。パートナーモデルは使わない）。

- 背景なしモーション（M）：真緑で作り、`scripts/tobira-motion/import.sh` で透過 webm/webp/png に → `src/components/TobiraMotion.tsx`
- 全画面の演出（C）：クリーム背景のまま `scripts/firefly-kit/import-cinematic.sh` で mp4 に → `src/components/CinematicClip.tsx`

| ID | 名前 | 種類 | 優先 | 秒 | First → Last | どこで使う | 状態 |
|---|---|---|---|---|---|---|---|
| C01 | title | 撮り直し・全画面 | A | 2.5〜3.5 | refs/frame/title_first.png → refs/frame/title_first.png | 起動画面（LaunchScreen.tsx）。最後のコマから静止画の場面へクロスフェード | 未生成 |
| C02 | attack | 撮り直し・全画面 | A | 3.0（1.15倍で約2.6秒） | refs/frame/attack_first.png → refs/frame/attack_first.png | 対戦：3問連続正解のコンボ攻撃（ArenaFighters.tsx）。答え合わせの3.5秒に必ず収める | 未生成 |
| C03 | gacha | 撮り直し・全画面 | A | 3.0 | refs/frame/gacha_first.png → refs/frame/gacha_first.png | ガチャ：開封の共通部分（GachaReveal.tsx）。このあとレア度ごとの動画（C05〜C09）へつなぐ | 未生成 |
| C04 | victory | 撮り直し・全画面 | A | 3.5 | refs/frame/victory_first.png → refs/cream/cheering.png | 対戦の勝利画面（BattleResult.tsx）。最後のコマを残して結果を重ねる | 未生成 |
| C05 | gacha_n | 全画面 | A | 1.5 | refs/cream/basic.png → refs/cream/basic.png | ガチャ：N（はずれ）。短く・あっさり（GachaReveal.tsx） | 未生成 |
| C06 | gacha_r | 全画面 | A | 2.0 | refs/cream/basic.png → refs/cream/good.png | ガチャ：R。青い光（GachaReveal.tsx） | 未生成 |
| C07 | gacha_sr | 全画面 | A | 2.5 | refs/cream/basic.png → refs/cream/happy.png | ガチャ：SR。紫と銀の光（GachaReveal.tsx） | 未生成 |
| C08 | gacha_ur_build | 全画面 | A | 3.0 | refs/cream/basic.png → （入れない） | ガチャ：UR の前半「ため」（GachaReveal.tsx）。画面が暗くなり金色が満ちていく | 未生成 |
| C09 | gacha_ur_finale | 全画面 | A | 4.0 | refs/cream/basic.png → refs/cream/trophy.png | ガチャ：UR の後半「大当たり」（GachaReveal.tsx）。景品＝本（UR プリント）が出てくる | 未生成 |
| C10 | levelup | 全画面 | B | 3.0 | refs/cream/basic.png → refs/cream/cheering.png | レベルアップ（成長画面・対戦結果） | 未生成 |
| C11 | perfect | 全画面 | B | 3.0 | refs/cream/basic.png → refs/cream/trophy.png | 全問正解（ResultSummary.tsx） | 未生成 |
| C12 | login_bonus | 全画面 | B | 3.0 | refs/cream/bowing.png → refs/cream/happy.png | ログインボーナス（その日はじめて） | 未生成 |
| C13 | set_complete | 全画面 | B | 3.0 | refs/cream/basic.png → refs/cream/happy.png | ガチャのセットがそろったとき（GachaSetsModal.tsx） | 未生成 |
| C14 | rank_up | 全画面 | B | 3.0 | refs/cream/walking.png → refs/cream/trophy.png | ランキング・段位が上がったとき | 未生成 |
| C15 | streak | 全画面 | B | 3.0 | refs/cream/studying.png → refs/cream/cheering.png | 連続学習（7日・30日など）の達成 | 未生成 |
| C16 | lose_cinema | 全画面 | C | 3.0 | refs/cream/thinking.png → refs/cream/good.png | 対戦の負け（全画面版。背景なしの M04 encourage と好きな方を採用） | 未生成 |
| M01 | greet | 背景なし | A | 3.0 | refs/green/basic.png → refs/green/basic.png | ホームのとびら君（Home.tsx）：その日はじめて開いたとき | 未生成 |
| M02 | wakeup | 背景なし | A | 3.5 | refs/green/sleeping.png → refs/green/basic.png | ホーム：3日以上あいて開いたとき（greet の代わり） | 未生成 |
| M03 | cheer | 背景なし | A | 2.5 | refs/green/basic.png → refs/green/basic.png | ミッション達成スタンプ（MissionToast.tsx） | 未生成 |
| M04 | encourage | 背景なし | A | 3.0 | refs/green/thinking.png → refs/green/basic.png | 対戦の負け（BattleResult.tsx） | 未生成 |
| M05 | think | 背景なし | A | 2.4↻ | refs/green/thinking.png → refs/green/thinking.png | 全国対戦の相手さがし（BattleMatchingRadar.tsx）：待っている間くり返し | 未生成 |
| M06 | idle | 背景なし | A | 3.0↻ | refs/green/basic.png → refs/green/basic.png | ホームのとびら君（待機中にときどき） | 未生成 |
| M07 | correct | 背景なし | A | 1.8 | refs/green/basic.png → refs/green/good.png | 問題に正解したとき（CorrectBurst.tsx の cheering の代わり） | 未生成 |
| M08 | combo | 背景なし | A | 2.0 | refs/green/trophy.png → refs/green/trophy.png | 2問以上連続正解（CorrectBurst.tsx の trophy の代わり） | 未生成 |
| M09 | oops | 背景なし | A | 2.0 | refs/green/thinking.png → refs/green/basic.png | 不正解のとき（はげまし・責めない） | 未生成 |
| M10 | listen | 背景なし | A | 3.0↻ | refs/green/listening.png → refs/green/listening.png | リスニング音声の再生中（くり返し） | 未生成 |
| M11 | study | 背景なし | B | 3.0↻ | refs/green/studying.png → refs/green/studying.png | 学習中・解説を読んでいるとき（くり返し） | 未生成 |
| M12 | nap | 背景なし | B | 3.0↻ | refs/green/sleeping.png → refs/green/sleeping.png | しばらく操作がないとき・夜の時間帯（くり返し） | 未生成 |
| M13 | bow | 背景なし | B | 2.5 | refs/green/basic.png → refs/green/basic.png | はじめての案内（Intro.tsx）・お知らせ | 未生成 |
| M14 | walk | 背景なし | B | 2.0↻ | refs/green/walking.png → refs/green/walking.png | 起動画面の歩く場面（LaunchScreen.tsx）（くり返し） | 未生成 |
| M15 | happy | 背景なし | B | 2.5 | refs/green/happy.png → refs/green/happy.png | ガチャの結果（N・R）・ショップで買えたとき | 未生成 |
| M16 | science | 背景なし | C | 2.5↻ | refs/green/science.png → refs/green/science.png | 理科・化学のプリント／実験のテーマ | 未生成 |
| M17 | ready | 背景なし | B | 2.0 | refs/green/good.png → refs/green/basic.png | 対戦開始の直前（カウントダウン） | 未生成 |
| M18 | draw | 背景なし | B | 2.0 | refs/green/good.png → refs/green/good.png | 対戦の引き分け | 未生成 |
| M19 | levelup_jump | 背景なし | B | 2.5 | refs/green/basic.png → refs/green/cheering.png | レベルアップ（小さく出す場所用。全画面は C10） | 未生成 |
| M20 | idea | 背景なし | B | 2.0 | refs/green/thinking.png → refs/green/basic.png | ヒントを出すとき・解説を開くとき | 未生成 |
| M21 | bye | 背景なし | C | 2.0 | refs/green/basic.png → refs/green/basic.png | 学習を終えるとき・ログアウト | 未生成 |
| M22 | surprise | 背景なし | C | 1.5 | refs/green/basic.png → refs/green/basic.png | 時間切れ・タイムアップ | 未生成 |
| M23 | write | 背景なし | C | 2.5↻ | refs/green/basic.png → refs/green/basic.png | メモ・ミッション一覧（くり返し） | 未生成 |
| M24 | clap | 背景なし | C | 2.0 | refs/green/happy.png → refs/green/happy.png | フレンドの勝利・ランキング上昇の通知 | 未生成 |

受け取ったら：ファイル名 `ID.mp4` → カードの「取り込み」行のコマンド → 登録（TOBIRA_MOTIONS / CINEMATIC_CLIPS）→ この表の状態を「取り込み済み（日付・seed）」に。
