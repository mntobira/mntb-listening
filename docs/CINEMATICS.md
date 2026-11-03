# とびら君の演出動画の台帳

`src/components/CinematicClip.tsx` の `CINEMATIC_CLIPS` が再生する動画。すべて `public/cinematics/` に置く（外部URL・有料APIを実行時に呼ばない）。
音声は入れない（`muted`）。効果音は対戦の効果音（`sfxSamples`）が担当する。

## 2026-10-26 Adobe Firefly で C01〜C16 を作り直して全部差し替え

- 元動画：Firefly Video（1:1・5秒・24fps）。プロンプトと参照画像は `scripts/firefly-kit/videos.py`（PDF・カードは `build_kit.py` が作る）。
- 取り込み：720×720・24fps・H.264（crf 24）・音声なし・faststart、1本 1MB 未満（合計約3.7MB）。ポスターは1コマ目の WebP。
- **背景はすべてクリーム色 #FBF5E8 に統一**。緑背景は色で切り抜き（緑のにじみ除去・床の影を足す）、肌色・茶色の背景は背景だけ塗り替え（とびら君は色を変えない）。
  C14 は後ろに残っていた緑のアーチと茶色の床も消した。UR の夜空（C08）と金色（C09）は演出なのでそのまま。
- **Firefly が最初と最後に貼る参照画像のコマ**（画質・背景が違って「写真」に見える）は全部切り落とした。
- 処理の道具：`scripts/firefly-kit/unify_background.py`（切り抜き・塗り替え・書き出し。区間と方法は先頭の CLIPS 表）。

| ID | 用途・再生する場所 | ファイル | 長さ | 元動画の使った区間 | 背景 |
|---|---|---|---|---|---|
| C01 | 起動画面（LaunchScreen.tsx） | title.mp4 | 3.1秒 | **E4（2026-11-03）で作り直し**：運営者が送った「…3D ani 389900 OFW.mp4」の 2.17〜3.92秒→1.04〜1.71秒→3.92〜4.62秒（顔が崩れる 0〜0.29秒・1.75〜2.12秒・4.65秒〜を外し、同じ姿勢のコマどうしを2コマのクロスフェードでつないだ。`scripts/firefly-kit/title_e4.py`） | 肌色→クリーム |
| C02 | 3連続正解のコンボ攻撃（ArenaFighters.tsx、1.15倍） | attack.mp4 | 2.8秒（約2.4秒） | 0.25〜3.0秒 | 肌色→クリーム |
| C03 | ガチャ：抽選の待ち・応援動画で1回（RewardVideo.tsx） | gacha.mp4 | 2.9秒 | 撮り直し版の 1.6〜4.4秒 | 肌色→クリーム |
| C04 | 対戦の勝ち（BattleResult.tsx、最後のコマを残す） | victory.mp4 | 3.5秒 | 撮り直し版の 0.3〜3.7秒 | 肌色→クリーム |
| C05 | ガチャ確定演出の丸窓：N（GachaReveal.tsx） | gacha_n.mp4 | 1.6秒 | 2.2〜3.75秒（2.0秒の写真ジャンプを避けた） | 緑→クリーム＋白い光 |
| C06 | 丸窓：R | gacha_r.mp4 | 2.0秒 | 3.0〜5.0秒（ウインク＋グッド） | 緑→クリーム＋青い光 |
| C07 | 丸窓：SR | gacha_sr.mp4 | 2.6秒 | 2.0〜4.6秒 | 肌色→クリーム |
| C08 | 丸窓：LR の前半（ため） | gacha_ur_build.mp4 | 3.1秒 | 全体を 1.55倍速 | 夜空（演出） |
| C09 | 丸窓：UR／LR の後半（大当たり） | gacha_ur_finale.mp4 | 4.0秒 | 0〜4.6秒を 1.15倍速（最後の写真を除去） | 金色（演出） |
| C10 | レベルアップ（対戦結果の上に1回） | levelup.mp4 | 3.0秒 | 撮り直し版の 0.3〜3.3秒 | 肌色→クリーム |
| C11 | 全問正解（ResultSummary.tsx の結果ステージ、最後のコマを残す） | perfect.mp4 | 3.1秒 | 撮り直し版の 0.8〜3.85秒 | 肌色→クリーム |
| C12 | ログインボーナス（LoginBonusSheet の上に1回） | login_bonus.mp4 | 3.0秒 | 0.5〜3.5秒 | 緑→クリーム |
| C13 | ガチャのセット完成（GachaResultStage.tsx の上に1回） | set_complete.mp4 | 3.0秒 | 1.75〜4.75秒 | 緑→クリーム |
| C14 | 段位アップ（対戦結果の上に1回。レベルアップより優先） | rank_up.mp4 | 3.0秒 | 1.9〜4.9秒 | 緑・茶色→クリーム |
| C15 | 7日連続ログイン（ログインボーナスの7日目） | streak.mp4 | 2.6秒 | 2.45〜5.0秒（緑→肌色に切り替わった後だけ） | 肌色→クリーム |
| C16 | 対戦の負け（BattleResult.tsx。**流し終わったら枠ごと外す**） | gacha_r.mp4（C06 を流用） | 2.0秒 | **E2（2026-11-03）**：以前の lose.mp4 は表情が崩れて「きもい」との指摘で削除。ウインク＋グッドの C06 を「はげまし」として使う（`CINEMATIC_CLIPS.lose`） | 緑→クリーム＋青い光 |

- お祝い（C10・C12〜C15）は `CelebrationClip`：再生が始まってから画面の上に出す。タップ・「演出をスキップ」・再生終了で消える。同じ出来事は同じタブで1回だけ（sessionStorage）。
- 再生の上限：読み込み4秒・全体8秒で止まる（CinematicClip の安全装置）。動きを減らす設定・データセーバーでは再生しない（静止画・お祝いなし）。
- 元動画（Firefly の書き出し）はリポジトリに入れていない（17＋5本・約22MB）。作り直すときは videos.py のプロンプトで撮り直し、unify_background.py の区間を合わせる。
- 商用：Adobe Firefly の生成物（商用利用可）。参照画像は運営者自身のキャラクター画像。

## 2026-11-03 E2・E4
- E2：負けの動画（旧 lose.mp4・lose-poster.webp）を削除。代わりに C06（gacha_r.mp4）を流し、再生が終わったら動画の枠を外す（以前は最後のコマとポスターが残り、ぼやけた絵が止まって見えた）。
- E4：タイトルの title.mp4 を、運営者が送った2本のうち動きが良い1本から作り直し（もう1本は 1.75〜2.3秒で目が白く崩れ、ほかもほぼ静止なので不採用）。元動画はリポジトリに入れていない。

## 残っている仕事（M：背景なしモーション／R：英文解釈の動画）

**まだ作っていない。** プロンプト・参照画像・カードはできている（`docs/FIREFLY_KIT.md`、`scripts/firefly-kit/videos.py` の M01〜M24、`scripts/firefly-kit/reading_media.py` の R01〜R07）。

| 種類 | 本数 | 中身 | 取り込み先 | 状態 |
|---|---|---|---|---|
| M01〜M24 | 24本 | 緑背景で作り、とびら君だけ透過（greet・wakeup・cheer・encourage・think ほか） | `scripts/tobira-motion/import.sh` → `public/tobira-motion/<名前>.{webm,webp,png}`、`TobiraMotion.tsx` の `ready: true` | **未着手**（Firefly で撮影待ち） |
| R01〜R07 | 7本 | 英文解釈・模試の演出（read_start・read_think・read_evidence・read_retry・read_clear・read_levelup・mock_start） | `public/cinematics/` または `public/reading-media/`（reading_media.py の where 欄） | **未着手**（Firefly で撮影待ち） |

撮るときの注意（C で分かったこと）：
1. Firefly は First/Last の参照画像を1コマ目と最後のコマにそのまま貼る → 取り込みで前後0.2秒ほど必ず切る。
2. 背景が途中で緑↔肌色に変わることがある → 切り替わりの瞬間を避けて区間を選ぶ。M は緑で統一し透過、R はクリームに塗り替える（unify_background.py）。
3. 余計な小物（ヘッドホン・本）・目の色の変化・背中を見せる回転が出たら撮り直し。
4. C は全部取り込み済み。C の撮り直しは不要。

## これまでの経緯（2026-09〜10）
- 2026-09-29：Kling v3（Genspark）で attack・gacha・victory を作成。2026-10-01：victory を背中が映る前で切り詰め。
- 2026-10-26：上の Firefly 版に全部差し替え（古い版の原本は `docs/cinematics_originals/`）。
