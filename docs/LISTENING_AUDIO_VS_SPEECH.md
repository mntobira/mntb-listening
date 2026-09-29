# 生成音源（MP3）とブラウザ読み上げの違い

第2問リスニングは、MP3 がある問は MP3 を鳴らし、
無い問は**ブラウザの音声合成（SpeechSynthesis）に自動で切り替わる**。
切り替えの判定は `src/utils/listeningSpeech.ts` の `hasRealAudio()` が
`audioUrl` の有無だけで行う。

この2つは「同じ内容を別の声で読む」ものではない。
★中身そのものが違う★ので、ここに実測で並べて残す。

（実測日 2026-08-31 / 音源 **38問＝全問完成** 時点）

---

## 1. ★最も重要な差：設問文を読むかどうか★

| | 対話部分 | **設問文（"Question. Which …?"）** |
|---|---|---|
| **MP3** | 読む | ★読む★ |
| **読み上げ** | 読む | ★読まない★ |

実測:

```
turns ブロック数                    : 38
turns 内に "Question" を含む発話    :  0 件   ← 読み上げは設問を読まない
MP3台本(manifest) で Question を含む問: 38 / 38 件  ← MP3 は全問読む
```

### 具体例（el2_set12_q1）

**MP3（実際に鳴る内容）**
```
Speaker 1: We have wired earphones and wireless ones.
Speaker 2: Wireless, please. With noise cancelling if possible.
Speaker 1: Yes, this one has it. It also has a microphone.
Speaker 2: Great, I'll take it.
Speaker 3: Question. Which earphones will the man buy?   ← ★これがある★
```

**読み上げ（turns）**
```
W: We have wired earphones and wireless ones.
M: Wireless, please. With noise cancelling if possible.
W: Yes, this one has it. It also has a microphone.
M: Great, I'll take it.
                                                          ← ★設問文が無い★
```

**影響**：設問文は画面にも表示されるので、読み上げでも問題は解ける。
ただし本番の共通テストは**設問文も音声で読まれる**ので、
読み上げの問は本番より易しい（設問を聞き取る練習にならない）。

---

## 2. 声の数

| | 声の種類 | 内訳 |
|---|---|---|
| **MP3** | ★3種類★ | 女性 Adeline / 男性 Mark / ナレーター Daniel |
| **読み上げ** | 実質 1〜2種類 | 端末にある英語音声を最大2つ使い、無ければ1つを pitch 1.05 / 0.9 でずらすだけ |

実測（el2_set12_q1 を発話単位に分解し、音色で役を判定）:

```
1) female    1.63s
2) female    1.25s
3) male      0.70s
4) male      0.60s
5) male      1.51s
6) female    0.77s
7) female    1.35s
8) narrator  0.60s   ← ナレーターが独立した3人目として存在
9) male      1.88s
→ 出てくる声の種類: 3 種類
```

読み上げ側の実装（`speakDialogue`）は:

```ts
const [voiceA, voiceB] = pickEnglishVoicePair();
const isSecond = speakers.indexOf(line.who) % 2 === 1;
queue.push({
  text: line.text,
  voice: isSecond ? voiceB : voiceA,
  pitch: isSecond ? 0.9 : 1.05,   // 声が1つしか無い端末はピッチ差だけ
});
```

**影響**：第2問は「話者を区別してイラストを選ぶ」形式なので、
声の数は正答率に直結する。ナレーターが対話の声と同じだと、
どこまでが対話でどこからが設問か分からなくなる。
MP3 はナレーターを別人（Daniel）にしてこれを避けている。

---

## 3. 話者の割り当ての安定性

| | 話者の割り当て |
|---|---|
| **MP3** | 台本で固定（ただし TTS が稀に入れ替えるので実測検証している） |
| **読み上げ** | **登場順**で機械的に交互（`speakers.indexOf(who) % 2`） |

読み上げは「登場順」で A/B を割るので、
**男性が先に話す問では男性が voiceA（高いピッチ側）になる**。
つまり読み上げでは**性別と声の高さが一致しない**問がある。

MP3 側は性別順（Speaker 1 = 女性 / Speaker 2 = 男性）に振り直してから
生成しているので、性別と声が常に一致する。
振り直しは `gen_q2_tts_batches.py` の `rebuild_by_gender()` が行う。

なお TTS 側が指示を無視して入れ替える事故が実際に起きたため
（`el2_set10_q1`）、録音後に必ず
`scripts/verify_q2_single_gender.py` で実測確認している。

---

## 4. 音質・話し方

| 項目 | MP3 | 読み上げ |
|---|---|---|
| 声の自然さ | 人間に近い（ElevenLabs v3） | 機械的（端末の合成音声） |
| 抑揚 | 場面に応じて変化（`[curiously]` 等が自動付与される） | ほぼ一定 |
| 間の取り方 | 対話と設問の間に明確なポーズ | 発話間は端末依存 |
| 端末による差 | ★無い★（同じファイルが鳴る） | ★大きい★（OS/ブラウザで声が変わる） |
| オフライン | 不可（ファイル取得が必要） | 可 |

**端末差は無視できない**。読み上げは iOS / Android / Windows で
声も速度も変わるため、「同じ問題を同じ条件で解く」ことができない。
MP3 は全端末で同一。

---

## 5. コスト・容量

| | MP3 | 読み上げ |
|---|---|---|
| 生成コスト | 有料（1問ずつだと1問1回の呼び出し） | ★無料★ |
| 配信容量 | 全38問で **9.33 MB**（1問あたり約 252 KB） | 0 |
| 合計再生時間 | 10.2 分（平均 16.1s / 最短 13.3s / 最長 22.0s） | — |

**この容量の軽さが「全問 MP3 化してよい」根拠**になった。
38問すべて揃えても 10 MB 弱で、画像より軽い。

---

## 6. まとめ：どちらを使うべきか

読み上げは**無料で端末だけで動く**のが強みで、
音源が無い間のフォールバックとしては十分機能している
（アプリは壊れず、問題も解ける）。

ただし第2問に関しては MP3 が明確に優れている。理由は3つ。

1. ★設問文を読む★ … 本番と同じ条件になる
2. ★声が3種類ある★ … 話者を区別してイラストを選ぶ形式に必須
3. ★端末差が無い★ … 同じ問題を同じ条件で解ける

→ **第2問は全38問を MP3 化した（38/38 完了）**。
　第2問でブラウザ読み上げに落ちる問はもう無い。

一方、第1問・第3問は
* 話者が1〜2人で、ナレーターと混ざる問題が起きにくい
* 設問が画面表示だけで足りる形式が多い

ため、読み上げのままでも実用上の支障は小さい。
実際に第1問は 112 トラックが読み上げで動いている。
**「全部 MP3 にすべき」ではなく、形式によって必要度が違う**。

---

## 再測定のしかた

この文書の数値は次で再現できる。

```bash
# 設問文を読むかどうか
grep -c "Question" src/data/englishListeningQ2Problems.ts

# 声の種類・長さの実測
python3 scripts/verify_q2_single_gender.py

# 音源の本数と容量
ls public/listening_audio/el2_*.mp3 | wc -l
du -ch public/listening_audio/el2_*.mp3 | tail -1
```
