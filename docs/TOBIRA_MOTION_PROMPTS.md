# とびら君「背景なし」モーション：Adobe Firefly 用プロンプト集（2026-10-23）

アプリ内の静止画のとびら君に、短い動き（2〜3.5秒）を足すための動画。
**背景は真緑（#00FF00）で作らせ、取り込み時に透過にする。**

## 0. 生成ツール：Adobe Firefly（Firefly Video モデル）

**商用利用の根拠**：Adobe 自社の **Firefly Video** モデルは「商用利用に安全（許可を得た素材だけで学習）」と Adobe が案内している。
同じ画面で選べる **Kling / Veo / Ray / Runway / Gemini などのパートナーモデルは Adobe 製ではない**（選ぶと確認が出る）ので、
**必ず Model＝「Firefly Video」を選ぶ**。参照に使うのは運営者自身のキャラクター（とびら君）の画像だけ。
※ 無料プランは生成クレジットの数に上限がある。出力に透かしや利用制限が付くかは、生成前にプランの表示を確認すること。

### Firefly の画面での設定（Generate video）
| 項目 | 指定 |
|---|---|
| Model | **Firefly Video**（パートナーモデルは選ばない） |
| Aspect ratio | **Square (1:1)** |
| Resolution | 1080p（取り込みで 480px に縮めるのでどちらでも可） |
| Duration / FPS | 5秒・24fps（決まり。取り込みで必要な 2〜3.5 秒を切り出す） |
| Frames → **First** | `docs/tobira_motion_refs/ref_<ポーズ>_green.png` |
| Frames → **Last** | **First と同じ画像**（＝最初と最後が同じ立ち姿になる。wakeup・cheer・encourage だけ別のポーズ→basic） |
| Camera → Motion | Last を入れると選べなくなるが、それで OK（入れない場合は **Static**） |
| Style / Shot size / Camera angle | 使わない（First を入れると自動で無効） |
| Enhance prompt | **オフ**（勝手に背景や紙ふぶきを足されることがある） |
| Advanced → Seed | 気に入った結果が出たら番号を控える（同じ seed で作り直せる） |
| 音声 | なし（アプリは音を使わない。取り込みでも消す） |

ダウンロードは MP4。そのまま `scripts/tobira-motion/import.sh` に渡す。

### 生成のルール（全部共通）
| 項目 | 指定 |
|---|---|
| 背景 | 真緑 #00FF00 の単色。影・床・光・パーティクル（紙ふぶき・キラキラ）は**入れない**（緑に混ざって抜けない） |
| 最初と最後 | 同じ立ち姿・同じ位置（再生後に静止画へ戻るので、ずれると「飛ぶ」）→ First/Last に同じ画像を入れて担保 |
| カメラ | 固定。キャラが画面からはみ出さない |
| 文字 | 一切なし |
| プロンプトの言語 | 英語（下の文をそのまま貼る） |

> **ブルーバックは使わない**：とびら君は体が青いので、青で抜くと体が透ける（実測で体の 52% が透明になった）。緑なら 0%。

### 参照画像（First / Last に入れる画像）
作成済み：`docs/tobira_motion_refs/ref_basic_green.png`・`ref_thinking_green.png`・`ref_sleeping_green.png`（1024×1024・真緑）。作り直すときは：
```bash
python3 - <<'PY'
from PIL import Image
for pose in ['basic','thinking','sleeping']:
    src = Image.open(f'public/mascots/{pose}.webp').convert('RGBA')
    S = 1024; bg = Image.new('RGBA', (S, S), (0, 255, 0, 255))
    src.thumbnail((int(S*0.7), int(S*0.7)))
    bg.alpha_composite(src, ((S-src.width)//2, int(S*0.92)-src.height))
    bg.convert('RGB').save(f'docs/tobira_motion_refs/ref_{pose}_green.png')
PY
```

### キャラクター固定文（全プロンプトの先頭に入れる）
```
3D animated mascot character: a blue arched door-frame body with light-blue circuit-line patterns, a light blue half-open wooden door with a gold knob on the left side of its face, a peach-colored face with big brown eyes and a smile, thin blue arms holding a yellow pencil in the right hand and a small yellow triangle in the left hand, a white eraser, short blue legs. Keep the character design exactly the same the whole time.
```

### 背景固定文（全プロンプトの最後に入れる）
```
Solid pure chroma-key green background (#00FF00), perfectly flat and evenly lit, no shadows on the background, no floor, no props, no particles, no confetti, no sparkles, no text. Static locked-off camera, full body always visible and centered with margin around it. The character starts and ends in the exact same standing pose and position. Smooth polished Pixar-like animation.
```

---

## 0-walk. walk（ホーム・常時おさんぽループ）— First / Last：walking
```
[キャラクター固定文]
The character walks cheerfully in place facing the viewer with a rhythmic left-right step, swinging its arms naturally with the yellow pencil and triangle tail, blinking once with a bright friendly smile. Seamless loop: the last frame matches the first frame exactly.
[背景固定文]
```
取り込み：`bash scripts/tobira-motion/import.sh walk.mp4 walk 0.46 1.83`

## 1. greet（ホーム・その日はじめて）— First / Last：basic
```
[キャラクター固定文]
The character blinks, smiles brightly at the viewer and waves hello with the pencil hand two times, does a tiny happy bounce on its feet, then lowers its arm and settles back into its original friendly standing pose.
[背景固定文]
```
取り込み：`bash scripts/tobira-motion/import.sh greet.mp4 greet 0.3 3.0`

## 2. wakeup（ホーム・3日以上ぶり）— First：sleeping / Last：basic
```
[キャラクター固定文]
The character starts sleepy with closed eyes, slowly opens its eyes, rubs one eye with the back of the hand, stretches both arms up with a little yawn, notices the viewer, smiles and waves happily, then returns to its original friendly standing pose.
[背景固定文]
```
取り込み：`bash scripts/tobira-motion/import.sh wakeup.mp4 wakeup 0.5 3.5`

## 3. cheer（ミッション達成）— First：basic / Last：basic（途中で cheering のバンザイをする）
```
[キャラクター固定文]
The character crouches slightly, then jumps up joyfully with both arms raised high in a banzai pose, lands softly with a small squash-and-stretch bounce, gives a quick proud nod, and returns to its original standing pose.
[背景固定文]
```
取り込み：`bash scripts/tobira-motion/import.sh cheer.mp4 cheer 0.4 2.5`

## 4. encourage（対戦で負けたとき）— First：thinking / Last：basic
```
[キャラクター固定文]
The character looks a little disappointed with drooping shoulders for a moment, then takes a deep breath, straightens up, clenches the pencil hand into a determined fist pump, nods firmly to the viewer with a confident smile, and returns to its original standing pose.
[背景固定文]
```
取り込み：`bash scripts/tobira-motion/import.sh encourage.mp4 encourage 0.3 3.0`

## 5. think（対戦相手さがし・くり返し）— First / Last：thinking（同じ画像＝つなぎ目なくループ）
```
[キャラクター固定文]
The character puts the pencil hand to its chin and thinks, slowly tilts its head left and right, eyes looking up and around curiously, small gentle sway of the body. Seamless loop: the last frame matches the first frame exactly.
[背景固定文]
```
取り込み：`bash scripts/tobira-motion/import.sh think.mp4 think 0.5 2.4`

---

## 失敗しやすいところ
- **紙ふぶき・キラキラが出る** → 背景固定文の「no particles / no confetti」を必ず入れる。出たら作り直し（緑に混ざって残る）。
- **床に影が出る** → 影は半透明の緑になり、抜くと黒っぽいシミになる。「no shadows, no floor」。
- **後ろを向く** → 「always facing the viewer」を足す（過去の victory.mp4 で発生）。
- **透かし** → Genspark の表示用URLの動画には中央に透かしが入る。**生成元（fal）の原本URL**からダウンロードする（docs/CINEMATICS.md と同じ）。
