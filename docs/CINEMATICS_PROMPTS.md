# とびら君 演出動画のプロンプト集（2026-09-29）

共通条件：Kling v3（standard）・1:1・5秒・参照画像はアプリ内のとびら君（`public/mascots/*.webp` をクリーム背景 #FBF5E8 の正方形に置いたもの、または既存動画の1コマ目）。
**最初と最後を同じ立ち姿にする**（アプリでは動画の後に静止画へ戻るため、飛ばないように）。
生成後は **生成元（fal）の原本URL** から取り込む（Genspark の表示用URLは中央に透かしが入る）。
取り込み：`ffmpeg -i 原本.mp4 -an -vf "scale=720:720:flags=lanczos,fps=24,format=yuv420p" -c:v libx264 -preset slow -crf 27 -movflags +faststart public/cinematics/<名前>.mp4`

## キャラクターの固定文（全プロンプトの先頭に入れる）
```
3D animated mascot character: a blue arched door-frame body with light-blue circuit-line patterns, a light blue half-open wooden door with a gold knob on the left side of its face, a peach-colored face with big brown eyes and a smile, thin blue arms holding a yellow pencil in the right hand and a small yellow triangle in the left hand, a white eraser, short blue legs. Keep the character design exactly the same the whole time.
```

## ✅ 作成済み
### 勝利（victory.mp4・参照 cheering）
```
Victory celebration: the character jumps up joyfully, raises the pencil high, lands with a little bounce and a spin, colorful soft confetti and golden sparkles burst and drift down, warm cream background with a soft spotlight glow, camera slowly pushes in. Smooth, polished Pixar-like animation, bright and heartwarming.
```
### コンボ攻撃（attack.mp4・参照 basic を最初と最後に指定）
```
Combo special attack: the character crouches with a determined look, the pencil tip starts glowing bright blue and gold, it dashes forward and swings the pencil in a big arc leaving a glowing light-blue slash trail and sparkling stars, a bright impact flash and a ring of soft shockwave on the floor, then it hops back and returns to its original friendly standing pose facing the camera. Warm cream background, soft floor shadow, dynamic but clean camera, smooth polished Pixar-like animation.
```
（アプリでは 1.0〜4.1 秒を切り出して 1.15 倍で再生＝答え合わせ 3.5 秒に収める）

## ⏳ 未作成（クレジット切れ）
### タイトル登場（title.mp4・参照＝今の title.mp4 の1コマ目を最初と最後に指定）
```
Title intro, "open the door of learning": the character wakes up with a blink and a stretch, gently opens the door on its face, soft glowing letters, notebook pages and little stars drift out and swirl around it like a gentle breeze, it waves hello to the viewer with the pencil, then closes the door halfway and settles back to the same standing pose, smiling. Warm cream background, soft morning light, calm and heartwarming, smooth polished Pixar-like animation.
```
v2 は上の文で作ったら顔の前に崩れた文字が出て不採用。次に試す v3：
```
Title intro: the character wakes up with a blink and a happy stretch, waves hello to the viewer with the pencil, while a few small white paper airplanes and tiny soft stars glide gently in the background behind the character. Nothing covers the character's face. Absolutely no text, no letters, no writing, no symbols anywhere. The character then settles back into the exact same standing pose in the same place, smiling. Warm cream background, soft morning light, calm and heartwarming, smooth polished Pixar-like animation.
```
※ タイトルは最後のコマから静止画シーンへクロスフェードする（LaunchScreen.tsx）。差し替えたら `docs/CODEMAP.md` の配置％を最後のコマで測り直す。

### ガチャ開封（gacha.mp4・参照＝今の title.mp4 の1コマ目）
```
Gacha opening: the character looks excited, the door on its face swings wide open and warm golden and rainbow light pours out, glowing sparkles and a shining capsule-like orb of light float up from inside the door and burst softly into stars, the character claps and does a happy little hop, then the light fades gently and the character returns to the same standing pose in the same place. Warm cream background, soft glow, smooth polished Pixar-like animation, magical and delightful.
```

### リスニング版向け（任意）
- リスニング正解（listening.webp 参照）：`The character wears white headphones, listens with closed happy eyes, music notes float around, then it opens its eyes, gives a thumbs-up with the pencil and returns to the same pose.`
- 負けたとき（はげまし）：`The character looks a little sad, then takes a deep breath, clenches the pencil with determination and nods to the viewer, soft warm light, returns to the same pose.`
