# ElevenLabs 用プロンプト（任意）

完成した動画は、アプリの効果音と BGM（カナリアスキップ）だけで作ってあります。
ナレーションを入れたいとき・別の曲にしたいときに使ってください。
※ ElevenLabs の生成物を商用に使うには、有料プランで生成してください（docs/BATTLE_BGM.md の方針）。
※ 有名な曲・他社のアプリの曲に「似せて」とは書かないでください。

---

## 1. ナレーション（Text to Speech / Eleven v3）

**声の指定（Voice design のプロンプト）**
> 日本語ネイティブの20代女性。明るく、はきはきした声。高校生に話しかける先輩のような、近い距離感。早口すぎず、語尾をはっきり言い切る。ラジオCMのような落ち着いた明るさ。

**ストーリー用（約20秒・動画の場面に合わせて区切っています）**
```
[明るく] 共通テストの、英語リスニング。
[少し間をあけて] 本番形式の音声で、聞き取りを鍛える。
[テンポよく] 解いた直後に、採点と解説。
[楽しそうに] AIと対戦して、早押しで競う。
[やさしく、言い切る] 「聞き取れた！」を、毎日ひとつずつ。マナトビ。
```

**投稿用（約50秒・STEP ごと）**
```
[明るく] マナトビの使い方。
ステップ1。共通テストの、全6大問から選んで、1回ずつ。
ステップ2。音声を聞いて、4択で答える。
ステップ3。その場で採点。正解すると、コインももらえる。
ステップ4。強弱、和訳、語句まで、解説ですぐ確認。
ステップ5。間違えた問題は、復習ノートに自動で入る。
[楽しそうに] AIとも、友だちとも対戦できる。早押し4択で、正解を競おう。
毎日のミッションで、続けられる。とびら君を育てて、きせかえも。
[やさしく、言い切る] 「聞き取れた！」を、毎日ひとつずつ。App Store と Google Play で、マナトビと検索。
```
- 「No.1」「必ず点が上がる」など、言い切りすぎる言葉は入れていません。
- 問題の英語音声（STEP 2）が流れる間は、ナレーションを止めてください（動画の 4〜8 秒あたり）。

---

## 2. BGM（Eleven Music）

**ストーリー用（20秒）**
> Upbeat, bright J-pop-inspired instrumental for a study app teaser. 128 BPM, major key. Clean piano chords, light plucked synth, soft claps and a gentle four-on-the-floor kick. Starts with a short 1-bar intro, builds to a cheerful hook at 6 seconds, short drum fill at 14 seconds, ends with a clean button ending at 20 seconds. Positive, motivating, not aggressive. No vocals. Leave room in the mid frequencies for a Japanese voice-over.

**投稿用（50秒）**
> Light, encouraging instrumental for an app tutorial video aimed at high-school students preparing for an English listening exam. 118 BPM, major key. Warm piano, marimba, soft bass and brushed drums. Calm verse for the first 20 seconds (tutorial steps), lifts into an energetic section with claps and a bright synth lead from 22 to 40 seconds (battle mode), then settles and ends with a gentle resolving chord at 50 seconds. Friendly, focused, not distracting. No vocals. Mix quietly enough to sit under narration.

---

## 3. 効果音（Sound Effects）※アプリの効果音で足りない場合だけ
- `A soft, satisfying UI tap sound, short wooden click, 0.2 seconds`
- `Cheerful correct-answer chime, two rising bell notes, bright and short, 0.8 seconds`
- `Game show countdown beep, single clean electronic beep, 0.3 seconds`
- `Short triumphant fanfare sting for finishing a quiz, brass and bells, 2 seconds`
