# 宣伝動画の作り方（道具・素材・決まり）— これを読めば次の動画が作れる

マナトビの宣伝動画（Instagram リール／ストーリーズ／フィード、YouTube）は、すべて **実際のアプリを操作した画面録画** を Python で編集して作る。
動画生成AIは使わない（アプリの本物の画面を見せるため）。道具と素材はこのリポジトリにすべて入っている。

## 1. 置き場所

| 場所 | 中身 |
|---|---|
| `store-assets/_tools/promo_engine.py` | **編集エンジン**。ショット・層（録画・画像・文字・カラオケ字幕）・カメラ（ズーム/パン）・切り替え・BGM の自動ミックス（-14 LUFS） |
| `store-assets/_tools/record_scenes.py` | 録画：リスニング・ガチャ・復習・ミッションなど（スマホ／`REC_DEVICE=pc` でパソコン） |
| `store-assets/_tools/record_duo.py` | 録画：スマホとパソコンの2台で本当に全国対戦（Firebase エミュレーター） |
| `store-assets/_tools/record_vocab.py` | 録画：英単語帳・英単語の4択・英文解釈・英単語の対戦 |
| `store-assets/_tools/promo_cut.py` | 台本：リスニング編（リール・フィード・YouTube）→ `store-assets/instagram/`, `store-assets/youtube/` |
| `store-assets/_tools/promo_vocab.py` | 台本：英単語・英熟語編（リール・ストーリーズ・YouTube）→ `store-assets/vocab/` |
| `store-assets/_tools/promo_sfx.py` | 冒頭の効果音を数式で作る（素材なし・表記不要） |
| `store-assets/_tools/measure.py` | 測る道具：画面が変わった時刻・時刻つきの静止画一覧・BGM の音量の山 |
| `store-assets/_tools/text_rects.py` | 画面の中の文字の位置を取る（長文の単語を光らせる場所） |
| `store-assets/_tools/setup.sh`, `requirements.txt` | 新しい環境の準備 |
| `store-assets/_footage/` | **録画素材**（Git LFS）。`scenes3`＝スマホ、`scenes_pc`＝パソコン、`scenes_duo`＝2台対戦、`vrec_ph`／`vrec_pc`＝英単語編。各 `.json` にタップ・再生・正解の時刻 |
| `store-assets/instagram/`, `youtube/`, `vocab/` | できあがりの動画と、投稿文（`CAPTIONS.md`）・説明（`README.md`） |

## 2. 準備（新しい環境で1回）

```sh
bash store-assets/_tools/setup.sh      # git lfs pull（録画素材）・pip・playwright の chromium・ffmpeg/フォントの確認
```
必要なもの：Python 3.11 以上、ffmpeg、日本語フォント Noto Sans CJK（`/usr/share/fonts/opentype/noto/NotoSansCJK-*.ttc`）。

## 3. 作り方の流れ

1. **台本を決める**：伝えたいこと → 場面の順番 → 各場面で見せるアプリの画面 → BGM の割り当て。
2. **録る**（素材が無い・アプリの見た目が変わったときだけ）
   ```sh
   NODE_OPTIONS=--max-old-space-size=2500 npx vite build --outDir .tmpwork/dist_v
   npx vite preview --outDir .tmpwork/dist_v --port 4175 --host 0.0.0.0 &
   APP_URL=http://localhost:4175 python3 store-assets/_tools/record_vocab.py store-assets/_footage/vrec_ph wordbook quiz
   REC_DEVICE=pc APP_URL=http://localhost:4175 python3 store-assets/_tools/record_vocab.py store-assets/_footage/vrec_pc wordbook quiz
   ```
   - 新しい場面は、`record_vocab.py` の `scene_*` を真似て関数を足し、`SCENES` に登録する（`tap(pg, btn('ボタンの文字'))` で押す）。
   - スマホは 430×932 の2倍密度（860×1864）、パソコンは 1920×1080 で録れる。ゲスト・広告なし（`?no_ads=1&screenshot=1`）で、個人情報は映らない。
3. **測る**：切り出す時刻を決める
   ```sh
   python3 store-assets/_tools/measure.py sheet store-assets/_footage/vrec_ph/battle.mp4 10,16.3,22,52.6
   python3 store-assets/_tools/measure.py changes store-assets/_footage/vrec_ph/battle.mp4 9 60 --th 10
   python3 store-assets/_tools/measure.py loud public/tanjou.mp3
   ```
4. **編集**：台本ファイル（`promo_vocab.py` をコピーして `promo_<テーマ>.py`）を書く
   ```sh
   python3 store-assets/_tools/promo_<テーマ>.py .tmpwork/out reel --sheet       # 1秒ごとの静止画一覧（数秒で終わる）
   FRAMES=10,22.5,38 python3 store-assets/_tools/promo_<テーマ>.py .tmpwork/out reel   # 指定時刻を原寸の半分で確認
   python3 store-assets/_tools/promo_<テーマ>.py .tmpwork/out reel story youtube  # 本番（1本 数分）
   python3 store-assets/_tools/promo_<テーマ>.py .tmpwork/out reel --audio-only   # 音だけ直す（映像は使い回す）
   ```
5. **確かめる**：静止画一覧で「文字が画面の文字にかぶっていない」「切り替えが自然」「CORRECT!/FINISH! が見える」こと。音は `ffmpeg -i X.mp4 -af ebur128=peak=true -f null -` で -14 LUFS・ピーク -1dBFS 以下。
6. できあがりを `store-assets/<テーマ>/` に置き、`CAPTIONS.md`（投稿文・**BGM クレジット**）と `README.md`（構成・根拠・作り直し方）を書いて PR。

## 4. 編集エンジンの使い方（要点）

```python
from promo_engine import *
shot = Shot(dur秒, [層, 層, ...], 背景画像, xin=前と重ねる秒, kind='fade'|'flash'|'slide'|'zoom', punch=[ドンと拡大する時刻], flash=[白く光る時刻], shake=[揺れる時刻])
Video(録画.mp4, 元動画の開始秒, (x, y, w, h), cam=[(t, (cx, cy, 幅)), ...], speed=1.0, device='phone'|'pc', radius=角丸, freeze=止める元時刻)
Sprite(画像, x, y, at=出る秒, until=消える秒, anim='up'|'pop'|'fade'|'zoom'|'left'|'right', bob=(振幅, 周期))
Func(lambda cv, t: ...)   # 自由に描く（カウンター・光る単語など）
text_img('文字', 大きさ, 色, hl='強調', hl_mode='color')、pill_img('札', 大きさ, fg, bg)、load_sprite('public/mascots/happy.webp', h=高さ)
render_video(shots, W, H, 出力)；mix_audio(長さ, music=[dict(f, src, at, dur, gain, fi, fo)], voice=[...], sfx=[(時刻, ファイル, 音量)], 出力, 作業dir)；mux(映像, 音, 出力)
```
- `promo_vocab.py` の `full()`（縦は角丸カードに入れ、上に道のりと見出し）・`caption()`・`road()`・`reading_hl()`・`outro()` はそのまま流用できる。
- `fit(roi, w, h, 元幅, 元高)`：元動画の「見せたい四角」から切り抜きを計算。`cams([(t, roi), ...])` でズームのキーフレーム。

## 5. 決まり（守ること）

- **素材は本物のアプリ画面だけ**。数字（語数・問題数・点数）はアプリのデータ・録画どおりに書く（例：語数は `public/data/listeningVocabulary.json` から数える）。
- **断定しない**：「必ず点が上がる」「No.1」などは書かない。
- **縦動画の見出しは、アプリの文字にかぶせない**（上の帯に置き、画面は下のカードに）。文字は大きく（縦で 50px 以上）。
- ストーリーズは上下約250px に文字を置かない（プロフィール・返信欄に隠れる）。
- 音は -14 LUFS・ピーク -1.5dBFS 前後（`mix_audio` が自動）。問題の英語音声が鳴る間は BGM が自動で下がる。
- 対戦の曲（風の列車・カナリアスキップ）は **曲頭から7秒で盛り上がる**ように切ってある。START! など一番盛り上げたい瞬間に「曲の7秒目」を合わせる。

## 6. BGM（アプリに入っている曲）と使える条件

| 曲 | ファイル | 長さ | 聞きどころ | 条件 |
|---|---|---|---|---|
| 誕生 | `public/tanjou.mp3` | 134.9秒 | 0〜23秒 静かな前奏、**23.0秒で広がる**、117.8〜123.1秒 静かな間、**123.1秒でもう一度広がる** | Suno 有料プランで作成・商用可 |
| 夕凪 | `public/bgm/battle/waiting.mp3` | 81.5秒 | ピアノ中心・落ち着いた待ち時間の曲 | **配布元「創作堂さくら紅葉」と https://yukizakura.net/ の記載が必須** |
| 風の列車 | `public/bgm/battle/battle.mp3` | 67.5秒 | **7秒で本編**（テンポ速め・にぎやか） | 同上（記載必須） |
| カナリアスキップ | `public/bgm/battle/battle2.mp3` | 210.7秒 | **7秒で1番サビ**（135bpm） | 商用可・クレジット任意（書く）。**Content ID 登録禁止** |
| 効果音 | `public/sfx/battle/*.mp3` | — | correct / combo / countdown / start / final / timeup / win / badge / coin / tap など | 数式で作った音・表記不要 |

`public/cobblestone_dreams.mp3` はアプリのどこからも鳴らしていない古い曲（Suno 作成のメタ情報あり）。使うときは利用者に確認する。

## 7. 作った動画の一覧

| テーマ | 台本 | 出力 | 日付 |
|---|---|---|---|
| リスニング（第2問・2台で全国対戦） | `promo_cut.py` | `store-assets/instagram/`, `store-assets/youtube/` | 2026-10-17 |
| 英単語・英熟語（覚える→演習→長文→対戦） | `promo_vocab.py` | `store-assets/vocab/` | 2026-10-24 |
