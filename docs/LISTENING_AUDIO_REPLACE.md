# リスニング音源の差し替え手順（録り直し音源の追加）

> **この手順だけ読めば差し替えできます。** AI が作業するときもこの順番を守ってください。
> 背景（なぜ録り直すのか・どのサービスを選んだか）は [COMMERCIAL_AUDIO_MIGRATION.md](COMMERCIAL_AUDIO_MIGRATION.md)。

---

## 0. 30秒でわかる仕組み

- 音源は **364本**。アプリは **ファイル名** で音源を探す。
- だから **同じファイル名の mp3 を同じ場所に置けば、それだけで新しい音に切り替わる。**
- **問題データ（`src/data/*.ts`・`*.json`）は書き換えない。** 書き換える必要はない。
- 置く作業は専用ツール `scripts/listening-audio.mts` が全部やる。手でコピーしない。
- **旧音源と新音源は分けて恒久保存される**（`audio_sources/`。アプリには入らない）：

| 場所 | 中身 |
|---|---|
| `public/listening_*/` | アプリが鳴らす音（常に1種類） |
| `audio_sources/legacy/` | 旧音源（商用権未確認）。初めて差し替えるときに1回だけ自動保存 |
| `audio_sources/commercial/<batch>/` | 新音源の元ファイル（FLAC など）と受領記録 |
| `scripts/data/listening_audio_ledger.json` | どれが新音源か（`replaced`）・生成元・商用の根拠 |

### 現在の差し替え状況（2026-09-28）

| 大問 | 新音源 | 生成元 |
|---|---|---|
| 第1問 A（56本）・第1問 B（60本） | 116本 ✓ 全部 | ElevenLabs eleven_v3（利用者が有料契約中に直接生成・申告ベース） |
| 第3問（90本） | 90本 ✓ 全部 | 同上（30ファイルのまとめ録りを台本照合で分割） |
| 第4問 A（30本）・第4問 B（15本） | 45本 ✓ 全部 | 同上（12ファイルを分割。set07_4A_front/back・set14_4B は取り直し版を `--merge` で採用） |
| 第2問（全48問） | 48本 ✓ 全部 | 同上（Q2_1〜5 の5ファイル＝48問を分割。設問文 Question. … まで含む。第10回問2 は抜けた1文を追加録音で補って連結。48問すべて絵と音源あり） |
| 第6問 A（15本） | 15本 ✓ 全部 | 同上（1回＝1ファイルで受領。第4回は混入した1文を無劣化カット：`elevenlabs_2026-09-28_q6a/receipt/edit_note.json`） |
| 第6問 B（15本） | 15本 ✓ 全部 | 同上（まとめ録り6本を分割。第10回は2ファイルにまたがるので連結、第12・13回は重複録音から全文そろう版を採用：`elevenlabs_2026-09-28_q6b/receipt/edit_note.json`） |
| 第5問（45本） | 45本 ✓ 全部（第8回 問32 は取り直し 02_21_38 から） | 同上・eleven_v4（13ファイルを分割。第4回は混入した2断片を無劣化カット：`elevenlabs_2026-09-29_q5/receipt/edit_note.json`） |
| **合計** | **374 / 374 ✓（2026-09-29 完了）** | 旧音源は全部削除。有料契約の領収書：`audio_sources/commercial/license_evidence/` |

第1〜6問すべての旧音源は **利用者の指示で削除済み**（2026-09-28。`legacyDiscardedAt` が台帳に記録される。`use-legacy` では戻らない）。

## ★送られてきた音声は「商用の新音源」。旧音源と絶対に混ぜない★（2026-09-28 利用者指示）

利用者から届くリスニング音声は **商用権のあるもの** として扱う。次の順番を必ず守る（AI が作業するときも同じ）。

```bash
# 1) 原本をそのまま受領保存（切る前。旧音源と同じ中身なら受け付けない）
npx tsx scripts/listening-audio.mts receive 受け取り/*.mp3 --batch elevenlabs_<日付>_<範囲> --apply \
  --provider "ElevenLabs（利用者が直接生成）" --license "ElevenLabs有料契約中に新規生成（利用者申告 <日付>）"
# 2) まとめ録り（1ファイルに何問も）なら、文字起こし（単語時刻つき JSON）を用意して問題ごとに切り出す
python3 scripts/listening-split.py --batch <同じ名前> --out .tmpwork/<名前>/stage \
  --plan 'audio_sources/commercial/<名前>/receipt/原本.mp3=words.json=el2_set1_q1,el2_set1_q2,el2_set1_q3'
#    一部だけ取り直しが届いたら、元の分割をやり直したあと --merge で上書き（古い分割は supersededBy 付きで記録に残る）
#    python3 scripts/listening-split.py --batch <同じ名前> --out .tmpwork/<名前>/stage --merge \
#      --plan 'audio_sources/commercial/<名前>/receipt/取り直し.mp3=words.json=set07_4A_front,set14_4B'
#    設問文（Question. …）まで読み上げた録音は、読んだとおりの台本を --scripts x.json で渡す（{stem: 全文}）
# 3) 下見 → 取り込み（旧音源と同じ中身のファイルは自動で弾かれる）
npx tsx scripts/listening-audio.mts import .tmpwork/<名前>/stage
npx tsx scripts/listening-audio.mts import .tmpwork/<名前>/stage --apply --batch <同じ名前> --provider … --license …
# 4) 検査（差し替え済みの音が台帳のハッシュと違えば＝あとから旧音源で上書きされていれば、ここで止まる）
npx tsx scripts/listening-audio.mts check
# 5) 利用者が「旧音源は消して」と言ったときだけ
npx tsx scripts/listening-audio.mts purge-legacy <stem | chapterId> --apply
#    （取り込みと同時に消すなら import に --discard-legacy）
```

- 取り込み前に **全文を文字起こしして台本と照合** する（数字の表記ゆれ以外の差は利用者に報告）。
- `tests/listeningAudioLedger.test.ts` が、商用音源の上書き・旧音源との同一・元ファイルの欠け・第1問の旧音源の残りを検出する。

最新は `npx tsx scripts/listening-audio.mts status` で確認する。

| 大問 | chapterId | 本数 | 置き場所 | ファイル名の例 |
|---|---|---|---|---|
| 第1問 A | `el1_A` | 56 | `public/listening_audio/` | `el1A_set1_q1.mp3` |
| 第1問 B | `el1_B` | 60 | `public/listening_audio/` | `el1B_set1_q1.mp3` |
| 第2問 | `el2` | 38 | `public/listening_audio/` | `el2_set1_q1.mp3` |
| 第3問 | `el3` | 90 | `public/listening_audio/` | `el3_set1_q1.mp3` |
| 第4問 A | `el4_A` | 30 | `public/listening_q4/` | `set01_4A_front.mp3` / `set01_4A_back.mp3` |
| 第4問 B | `el4_B` | 15 | `public/listening_q4/` | `set01_4B.mp3`（4人分を1本に） |
| 第5問 | `el5` | 45 | `public/listening_q5/` | `q5set01_lecture.mp3` / `q5set01_q32.mp3` / `q5set01_q33.mp3` |
| 第6問 A | `el6_A` | 15 | `public/listening_q6/` | `q6set01_A.mp3` |
| 第6問 B | `el6_B` | 15 | `public/listening_q6/` | `q6set01_B.mp3` |

⚠ 番号の書き方が大問ごとに違う（`set1` と `set01`）。**必ず一覧（手順1）からコピーする。推測で名前を作らない。**

全ファイル名・発話数・話者・場面メモの一覧：

```bash
npx tsx scripts/listening-audio.mts list --tsv .tmpwork/audio-list.tsv   # 表計算ソフトで開ける
npx tsx scripts/listening-audio.mts list --chapter el2                   # 大問だけ
```

---

## 1. 音声ファイルの名前の付け方（2通り・混ぜてOK）

### (A) 完成ファイル（1問＝1ファイル）

ファイル名をアプリの名前と同じにする。拡張子は `mp3 / wav / flac / m4a / ogg / aac` どれでもよい（ツールが mp3 に変換する）。

```
受け取り/
  el1A_set1_q1.wav
  el1A_set1_q2.wav
  q5set01_lecture.flac
```

### (B) 発話ごとのファイル（会話を1人ずつ録った場合）

**フォルダ名** をアプリの名前（拡張子なし）にし、中に **`001`, `002`, …（話す順）** で置く。
ツールが順番どおりに、間に無音をはさんで1本に結合する。
（台本PDF・プロンプトZIPの「保存：segments/…/001.flac」と同じ形。そのまま渡せる）

```
受け取り/
  segments/el2/el2_set1_q1/001.flac   ← W（女性）
  segments/el2/el2_set1_q1/002.flac   ← M（男性）
  segments/el2/el2_set1_q1/003.flac
  segments/el2/el2_set1_q1/004.flac
```

- 途中のフォルダ（`segments/el2/`）は何でもよい。**一番内側のフォルダ名** だけで判定する。
- 発話の数が台本と違うと **取り込まない**（取り違え防止）。発話数は `list` の「発話数」列。
- 間の無音：第4問B＝1.2秒、第5問 問32＝0.6秒、その他＝0.35秒。変えたいときは `--gap 0.5`。

### やってはいけないこと

- 2回読みを1ファイルに入れる → **NG**。2回目はアプリが自動で再生する。1回分だけ録る。
- 話者名・「Question 1」などの読み上げを入れる → NG。台本の英文だけ。
- 同じ問題の (A) と (B) を両方入れる → エラーで取り込まれない。

---

## 2. 取り込み（コマンド4つ）

プロジェクト直下（`/home/user/webapp`）で実行する。

```bash
# ① 下見（何も変更しない）。対象・対象外・エラーの表が出る
npx tsx scripts/listening-audio.mts import 受け取り/

# ② 問題なければ本番。生成サービス名と商用利用の根拠は必須（台帳に記録する）
#    --batch は元ファイルの保存フォルダ名（audio_sources/commercial/<batch>/）。サービス名_日付_範囲 にする
npx tsx scripts/listening-audio.mts import 受け取り/ --apply \
  --batch elevenlabs_2026-09-25_q1a-set2 \
  --provider "ElevenLabs（利用者が直接生成）" \
  --license "ElevenLabs有料契約中に新規生成（利用者申告 2026-09-25）"

# ③ 全364本が揃って再生できるか検査（2〜3分かかる）
npx tsx scripts/listening-audio.mts check

# ④ 差し替えの進み具合（大問ごと）
npx tsx scripts/listening-audio.mts status
```

`--apply` で自動的に行われること：

1. 音声を **44.1kHz・モノラル・128kbps の mp3** に変換（既存音源と同じ形式）
2. 旧音源を `audio_sources/legacy/` に恒久保存（初回のみ）＋ `.tmpwork/audio-backup/<日時>/` に一時退避
3. 新音源の元ファイルを `audio_sources/commercial/<batch>/` に保存
4. `public/listening_*/` に同じ名前で上書き
5. 音源台帳 `scripts/data/listening_audio_ledger.json` を `replaced` に更新
6. 第4〜6問の長さ表 `src/data/listeningSets/listening-q4-6-durations.json` を更新
   （第4〜6問の制限時間はこの長さから計算される。手で直さない）

音量がばらばらなら `--normalize` を付けると -16 LUFS にそろえる（任意）。

### 失敗したとき・元に戻したいとき

```bash
# 直前の取り込みを取り消す（一時退避から）
npx tsx scripts/listening-audio.mts restore .tmpwork/audio-backup/<日時>
# 恒久保存した旧音源に戻す（1本 / 大問 / 全部）
npx tsx scripts/listening-audio.mts use-legacy el1A_set1_q1
npx tsx scripts/listening-audio.mts use-legacy el1_A
```

### ElevenLabs でセットごとに1本にまとめて生成した場合

「何問分かが1本の mp3」で届いたら、`scripts/listening-split.py` で問題ごとに切り出してから (A) 形式で取り込む（上の手順 2）。
台本と文字起こしの単語を突き合わせ、文間の無音の中央で切る。速度・音程は変えない。mp3 は無劣化で切る。
実例：`audio_sources/commercial/elevenlabs_2026-09-28_q1/receipt/split_manifest.json`（第1問 112本・原本10本）。

---

## 3. 取り込み後の確認

1. `check` が「問題なし」
2. アプリで数本を試聴：`npm run dev` → 英語リスニング → 差し替えた大問を開く
   - 第1〜2問は2回読み（2回目はアプリが鳴らす）、第3問以降は1回読み
   - 対戦（オンライン対戦のリスニング）も同じファイルを使う
3. 本物の音声で文字起こし確認をしたい場合は、文字起こしツールで台本と照合する（任意）
4. commit する：

```bash
git add public/listening_audio public/listening_q4 public/listening_q5 public/listening_q6 audio_sources \
        scripts/data/listening_audio_ledger.json src/data/listeningSets/listening-q4-6-durations.json
git commit -m "feat(listening-audio): 第2問の音源を MiniMax 版に差し替え（38本）"
```

PR本文には CLAUDE.md の「リスニング配布判断」4項目が必須（音源の変更は原則「リスニングにも送ってください。」）。

---

## 4. 音源台帳（商用公開してよいかの管理）

`scripts/data/listening_audio_ledger.json` に全364本が1行ずつある。

| status | 意味 |
|---|---|
| `legacy_unverified` | 旧音源。**商用権未確認。公開前に差し替えが必要** |
| `replaced` | 新音源に差し替え済み。`provider`・`license`・`importedAt`・`sha256` 付き |

- 台帳は `import --apply` / `restore` が自動で書く。**手で編集しない。**
- 全部 `replaced` になるまで、公開用ZIPの商用公開は保留（COMMERCIAL_AUDIO_MIGRATION.md の方針）。
- 生成時の契約画面のスクリーンショット等の証拠は、別途保管する（台帳には根拠の文章だけ）。

---

## 5. よくある質問

**Q. 問題データの `audioUrl` を書き換える必要は？**
ない。ファイル名が同じなので自動で切り替わる。ファイル名を変えるのは禁止（問題データ・対戦・台帳が全部ずれる）。

**Q. 台本（英文）を直したい。**
音源とは別作業。第1〜3問は `src/data/englishListeningQ*.ts`、第4〜6問は `src/data/listeningSets/listening-q*.json`。
第4〜6問の JSON は配布元で検査済みなので、原則いじらない（`englishListeningQ4to6Problems.ts` 冒頭のコメント参照）。

**Q. 音源がまだ無い問題はどうなる？**
ファイルが無いと再生できない。現在は364本すべてに（旧）音源がある。`check` で欠けを検出できる。

**Q. 外部の人に録ってもらう台本・指示書は？**
`scripts/export-listening-audio-prompts.mts` が全台本・話者・保存名入りのパックを作る（出力は `.delivery/`）。
その中の保存名（`segments/<chapterId>/<名前>/001.flac`）は、このツールの (B) 形式とそのまま一致する。

**Q. 旧ツール `scripts/concat_listening_audio.sh` は？**
第4問B・第5問 問32 の旧配布ZIP専用。新しい音源は `listening-audio.mts` の (B) 形式で結合されるので使わなくてよい。
