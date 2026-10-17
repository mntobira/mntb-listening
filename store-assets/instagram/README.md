# 宣伝動画（実際のアプリ操作の画面録画）

動画生成AIは使っていません。本物のアプリ（ビルド版）をスマホ実寸・パソコン（1920×1080）で操作し、その画面を録画して編集しています。
全国対戦の場面は、**スマホ（ハル）とパソコン（ソラ）の2台で本当に対戦した録画**です（Firebase のローカル エミュレーター上。本番のデータには触れていません）。

## できあがり

| ファイル | 用途 | 大きさ | 長さ |
|---|---|---|---|
| `instagram_story_9x16.mp4` | ストーリーズ（予告） | 1080×1920（9:16） | 約22秒 |
| `instagram_post_reel_9x16.mp4` | 投稿（リール） | 1080×1920（9:16） | 約79秒 |
| `instagram_post_feed_4x5.mp4` | 投稿（フィード）：リールと同じ内容を 4:5 で | 1080×1350（4:5） | 約79秒 |
| `../youtube/youtube_16x9.mp4` | YouTube（横・パソコン版を中心に） | 1920×1080（16:9） | 約2分9秒 |

- 映像は H.264 / 30fps、音声は AAC 48kHz・-14 LUFS（ピーク -1.5dBFS 以下）。
- 投稿文・YouTube の概要欄は `CAPTIONS.md`（**YouTube の概要欄には BGM のクレジットが必須**。下の「音の権利」）。

## 構成（投稿・YouTube）
「盛り上がる所」と「感動する所」を分けています。

| | 場面 | 音 |
|---|---|---|
| 感動（静） | アプリを開いた時のエンブレムが消えていく → タイトル画面 | 最初は効果音だけ（エンブレムのきらきら → タイトルへ向かう「すーっ」→ タイトルの「ふわっ」。`promo_sfx.py`。誕生と同じ E の和音）。「ふわっ」の響きが引いていく所（タイトルの約0.95秒後）で「誕生」を曲の頭から始め、そのまま次の画面へ |
| 感動 | 「イヤホンをつけて、1問だけ、聞いてみよう。」 | 誕生 |
| 解く | **第2問**（スマホ・パソコンとも同じ問題「What will the man drink?」）。英語の字幕は読まれた単語から光る＋和訳 | 問題の音声。鳴る間は BGM が自動で下がる |
| 解く | 答える → 正解！ → 解説で音声に合わせて英文が光る | 正解音 |
| 感動 | 対戦をつくった理由：「一人で落ち着いて解く力と、相手がいる中で聞き取る力は、別の力。」「紙の問題集では作れない『本番の緊張感』を、スマホの中に。」（対戦メニューの本物の画面をぼかした上に） | 待ち時間の曲「夕凪」（ここから約20秒） |
| 盛り上がり | 2台で全国対戦：相手さがし → カウントダウン | 夕凪のまま。START! の直前で引き、対戦の曲とは重ねない |
| 盛り上がり | START! → 早押し4択（スマホとパソコンを交互に大きく）→ ラスト1問 → FINISH! | 「カナリアスキップ」：START! の瞬間にサビ（曲頭7秒）から入る |
| 感動 | 勝利・ミッション達成 →「『聞き取れた！』を、毎日ひとつずつ。」→ ロゴ | 「誕生」の後半。静かな間で言葉、もう一度広がる所でロゴ |

YouTube 版は上に加えて、第2問をパソコンとスマホを並べて同時に見せ、最後にガチャ・復習ノート・ミッション（パソコン版）、締めに QR コードを入れています。

## 画面・文言の根拠
- 第2問の問題・音声・字幕：`src/data/englishListeningQ2Problems.ts`（第1回 問1、正解 ②）、`public/listening_audio/el2_set1_q1.mp3`、単語の時刻 `public/read_along/listening_audio/el2_set1_q1.json`。和訳は台本に合わせて付けたもの。
- 全国対戦：英文法・全10問。スマホ（ハル）2849点 vs パソコン（ソラ）2445点、レート 1500→1512（録画どおり）。
- 対戦をつくった理由の言葉は、運営の文章（対戦の説明）を短くしたもの。「AI・友だち・全国」「リスニング・英文法・英単語」は対戦メニューの画面どおり
- 「無料（広告表示あり）」… 課金なし・広告あり（`docs/APP_STORE.md`）。録画では広告を止めています（`?no_ads=1`）。
- 映っている名前「ハル」「ソラ」は録画用のテストアカウント（エミュレーター）。実在の人の名前・メールは映っていません。
- 「No.1」「必ず点が上がる」などの断定表現は使っていません。

## 音の権利
| 音 | 出どころ | 動画での利用 |
|---|---|---|
| BGM「誕生」 | `public/tanjou.mp3`（アプリのホーム画面の曲。Suno で作成） | Suno の有料プランで作った曲（2026-10-17 確認済み）→ **商用利用可**（宣伝動画・アプリに使える） |
| BGM「夕凪」 | 作曲 やっすん／配布元 創作堂さくら紅葉 https://yukizakura.net/ | 商用可・加工可。**配布元「創作堂さくら紅葉」と URL を、見る人が見られる所に書くことが条件**（YouTube の概要欄・Instagram の投稿文。`CAPTIONS.md` に入れてあります。YouTube 版は動画の最後にも表示） |
| BGM「カナリアスキップ」 | 作曲 まんぼう二等兵／OpenTracks https://opentracks.com/bgm/detail/7312 | 商用可・加工可・クレジット任意（書いています）。**Content ID には登録しないこと**（他人の曲として申し立てが起きる原因になる） |
| 効果音 | `public/sfx/battle/*.mp3`、冒頭の3つは `store-assets/_tools/promo_sfx.py`（どちらも数式だけで作った音） | 商用・動画OK・表記不要 |
| 問題の英語音声 | アプリの音源 `public/listening_audio/` | アプリ自身の素材 |

## 作り直し方
```sh
# 1) ビルド版を 4173 番、エミュレーター版を 4174 番で開く
NODE_OPTIONS=--max-old-space-size=3000 npx vite build --outDir .tmpwork/dist
VITE_USE_EMULATORS=true NODE_OPTIONS=--max-old-space-size=3000 npx vite build --outDir .tmpwork/dist_emu
npx vite preview --outDir .tmpwork/dist --port 4173 &
npx vite preview --outDir .tmpwork/dist_emu --port 4174 &
npx firebase emulators:start --only auth,firestore --project demo-manatobi-listening &
# 2) 録画（スマホ・パソコン・2台対戦）
python3 store-assets/_tools/record_scenes.py .tmpwork/scenes3 launch q2 q2_read            # スマホ
REC_DEVICE=pc python3 store-assets/_tools/record_scenes.py .tmpwork/scenes_pc launch q2 q2_read gacha_draw review missions
python3 store-assets/_tools/record_duo.py .tmpwork/scenes_duo                              # 2台で全国対戦
# 3) 編集して書き出し（冒頭の効果音は promo_sfx.py で自動的に作られる。音だけ直す時は --audio-only で映像を使い回せる）（1本 1〜5分。--draft で速い下書き、--sheet で静止画の一覧だけ）
python3 store-assets/_tools/promo_cut.py .tmpwork/promo reel feed youtube
```
- 編集の道具（ズーム・分割画面・字幕・複数BGMの自動ミックス）は `promo_engine.py`、台本・切り出す時刻は `promo_cut.py`。
- 録り直したら、`promo_cut.py` の先頭にある時刻（正解が出た時刻など）を測り直してください（`D_START`, `PH_OK`, `PC_OK` …）。
- ストーリーは前の編集（`edit_instagram.py`）のままです。
