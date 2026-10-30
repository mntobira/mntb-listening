# UI 変更記録（元に戻すとき用）

見た目を変えたら、ここに **いつ・どの画面・どのファイル・どう戻すか** を追記します（新しいものを上に）。
「イメージと違った」ときは、この記録の項目名を添えて「○○を戻して」と伝えてください。

---

## 2026-10-30 2次試験ガチャの大当たりに大阪公立大学（A・Bグループ）を追加（PR: feat/niji-osaka）

| # | どこ | 変更 | ファイル |
|---|---|---|---|
| 1 | 2次試験ガチャの LR | 国公立2次 英語 予想問題 大阪公立大学 前期対策を追加。第3問（和文英訳）が学部・学域で2系統に分かれるため、Aグループ用（文・法・経済・商・獣医・医学科・生活科学）・Bグループ用（現代システム科学域・理・工・農・リハビリ・看護）を各3回、計6冊。ラベルにグループ名を出す | `src/data/nijiMockPrints.ts`・`public/prints/print_lr_niji_omu{a,b}_en_{1,2,3}.pdf`・thumbs・previews |
| 2 | ピックアップの説明文 | 収録大学に大阪公立大学を追加（同じ大学名は1回だけ表示） | `src/battle/core/gachaPools.ts`・`nijiMockPrints.ts`（`NIJI_DISCLAIMER`） |

**戻し方**：`nijiMockPrints.ts` の `omua`/`omub` の行と `NIJI_UNIVERSITIES` の2行を消し、`gachaPools.ts` の lrNote を元に戻す。PDF・画像は消してよい。

---

## 2026-10-30 ご指摘D1〜D11：結果画面の作り直し・英文法の回の選び方・カレンダー・公開マイページ・ホーム背景ガチャ・季節・コイン演出（PR: fix/revision-d）

| # | 何を | どう変えた | ファイル |
|---|---|---|---|
| D1 | 英文法の単元カード | 「続きから／最初から／回を選ぶ」を整理。次にやる回が一目で分かる回の一覧（`.grammar-rounds`） | `UnitCard.tsx`・`ChapterSelection.tsx`・`unit-select.css` |
| D2 | 結果画面 | 切れていたトビラを横並びに。次の回へ／単元選択／ホーム／ご意見を外し、正答率の輪・前回・最高・目標・回ごとの棒グラフを動きつきで表示。「詳しい解説を見る」1つで詳細へ。詳細の下に 次の回へ／単元選択に戻る／ホームに戻る | `explanation/ResultInsight.tsx`（新規）・`result-insight.css`（新規）・`ResultSummary.tsx`・`Explanation.tsx`・`BottomBars.tsx`・`step-explanation.css` |
| D3 | カレンダー | マス・棒グラフ・教材の行を詰めて、全部の教科が見えるように（押せる大きさは残す） | `studylog.css` |
| D4 | 使い方 | 「対戦ロビーへ」「さっそく始める」を削除 | `Intro.tsx`・`intro.css`・`App.tsx` |
| D5 | 学びの扉／ふくしゅう | 学びの扉ではバナー広告を出さない。ふくしゅうの「今日なおした」帯を削除 | `utils/adSuppress.ts`（新規）・`PhilosophyPage.tsx`・`ads/adConfig.ts`・`StudyHub.tsx`・`review-record.css` |
| D6 | 公開プロフィール | 公開中は マイページ・カレンダー・きせかえ・称号・マイPDF の5タブを他の人も見られる | `features/profile/PublicProfileTabs.tsx`（新規）・`PublicProfileView.tsx`・`public-profile.css`・`utils/publicProfileCore.ts`・`publicStudyProfile.ts`・`firestore.rules` |
| D7 | ホームの背景 | 宇宙だけ → ガチャで「ホーム背景」8種（朝焼け・森・海・夜桜・図書館・おかしの国・オーロラ・ネオン）。きせかえ・持ち物で付け外し、外すと宇宙 | `battle/core/growthItems.ts`・`growth.ts`・`growthTypes.ts`・`tobiraParts.ts`・`Home.tsx`・`GachaParts.tsx`・`MyCollection.tsx`・`BattleProfileTabs.tsx`・`styles/home-stage.css`（新規）・`styles/world.css`（星と文字の色を変数で受ける） |
| D8 | マイページのグラフ | 今日〜累計が0から数え上がる・7日の棒が順に伸びる・一番長い日に印・教材の行が順に出る（動きを減らす設定／軽量モードでは止まる） | `MyStudyCard.tsx`・`studylog.css` |
| D9 | ホームに降るもの | 季節で切り替え（春＝桜・夏＝若葉・秋＝紅葉・冬＝雪） | `SakuraPetals.tsx`・`styles/surfaces.css` |
| D10 | マナコイン | 増えたらどの画面でも「＋N マナコイン」の演出（10枚以上は光の輪とコインがはじける） | `CoinCelebration.tsx`（新規）・`coin-celebration.css`（新規）・`battle/data/growthStore.ts`・`App.tsx` |
| D11 | マイページの表 | 自分で記録したマスを押すと直す・消す（カレンダーと同じ）。アプリで計った時間は押せない | `MyStudyCard.tsx`・`studylog.css` |

**戻し方**：D1〜D11 はそれぞれ別コミット（D7 は背景とグラフの2コミット）なので、その1コミットを revert すれば戻る。D6 を戻すときは `firestore.rules` も戻して再デプロイ。

---

## 2026-10-29 2次試験ガチャを追加・ガチャは左右スワイプで切りかえ（PR: feat/niji-gacha）

| # | 何を | どう変えた | ファイル |
|---|---|---|---|
| 1 | ガチャの種類 | 「共通テストガチャ」に加えて「2次試験ガチャ」を追加。上のタブ（共通テスト／2次試験）か、目玉の帯を**左右にスワイプ**して切りかえ（上下スクロールはしない）。下の点と「左右にスワイプで切りかえ」で今どちらかを表示。←→キーでも切りかえ。最後に見ていた方を覚える（`mntb:gachaPool`） | `src/components/gacha/GachaPoolCarousel.tsx`（新）・`GachaRoom.tsx`・`gacha.css` |
| 2 | 2次試験ガチャの中身 | 大当たり（LR）＝国公立2次 英語 予想問題 名古屋大学 前期対策 第1〜3回（問題＋解答・解説 PDF）。ほかは新作12点（はちまき3色・えんぴつオーラ2種・壁紙4種・2次用フレーム3種）＋既存の単語帳・熟語・文法プリントやポーズ・帽子などを使い回し。共通テストガチャの中身と確率は変えていない | `src/battle/core/gachaPools.ts`（新）・`src/data/nijiMockPrints.ts`（新）・`growthItems.ts`・`tobiraParts.ts`・`TobiraAccessories.tsx`・`arenaEconomy.ts`・`growthStore.ts` |
| 3 | 色 | 2次試験ガチャは紺、共通テストは今までの金色 | `gacha.css` |
| 4 | 詳細・ピックアップ・提供割合 | 選んでいるガチャ名を見出しに出し、確率もそのガチャの分を表示。2次の予想問題には「名古屋大学の過去問・公式問題ではありません。予想問題であり、大学とは関係がありません。」を表示 | `GachaItemDetail.tsx`・`GachaPickupModal.tsx`・`GachaCollectionModal.tsx` |
| 5 | 小さい文字 | 帯の中の「提供割合」（11px）を12pxに、サムネの帯ラベル（8px）は題名が横にあるので帯の中では出さない | `gacha.css`（末尾） |

**戻し方**：このPRのコミットを revert すれば元の1種類のガチャに戻る（引いた2次のアイテムは持ちものに残る）。
---

## 2026-10-29 ご指摘C7〜C14：英文法の回の終わり方・2列の選択肢・解くカギ/大問の流れを外す・セットで覚える・章の称号・お知らせ（PR: feat/grammar-c7-c14、#132 を取り込み済み）

| # | 何を | どう変えた | ファイル |
|---|---|---|---|
| C7 | 英文法の回の終わり | #132 の結果画面（次の回へ／単元選択に戻る／ホームに戻る・詳しい結果は控えめ）を採用。回の一覧に「回を選んで始める」見出し、「第N回」が二重にならないように | `ChapterSelection.tsx`・`unit-select.css` |
| C8 | 選択肢 | 4択でどれも16文字以下なら2列×2。英文法・TOEIC の選択肢を問題文と同じ英文の書体（prose）に | `MultipleChoiceControl.tsx`・`hooks/useQuestionDerived.ts` |
| C9 | 英文法の解説 | 問題にできなかった仲間の表現を【セットで覚える】（太字・紫）で1行。解説で触れていないものだけ | `data/grammarMemorizeSets.ts`・`data/englishGrammarKit.ts`・`utils/listeningExplanation.ts` |
| C10 | 英文法・TOEIC の解説 | 「解くカギ」の一覧と英文の番号を外す（黄色いマーカーは残す） | `utils/listeningExplanation.ts`・`data/listeningPostProcess.ts`・`englishGrammarData.ts`・`toeicPart5Data.ts` |
| C11 | 解説の右側 | 「大問全体の流れ・共通ポイント」を出さない（`SharedExplanation.tsx` を削除） | `explanation/ExplanationAnswerItem.tsx` |
| C12 | 章の称号 | 英文法の章を全部の回で満点 →「○○マスター」を画面全体のお祝いで渡す。その場で称号をつけられる | `battle/core/chapterTitles.ts`・`growthBadges.ts`・`growthStore.ts`・`utils/chapterTitleAward.ts`・`ChapterTitleCelebration.tsx` |
| C13 | 起動 | 「学ぶ入口を、もっと快適に。」のお知らせ画面を削除（はじめる → ホーム） | `LaunchScreen.tsx`・`launch-screen.css` |
| C14 | お知らせ | 各お知らせに「✓ 反映しました」。C7〜C13 をお知らせに追加 | `UpdateNoticeModal.tsx`・`data/updateNotices.ts` |
| ほか | ガチャの目玉の枠の光 | box-shadow のアニメ → ::after の opacity（見た目同じ・軽い） | `gacha.css` |

**戻し方**：C7〜C14 はそれぞれ別コミットなので、その1コミットを revert すれば戻る。C11 を戻すときは `SharedExplanation.tsx` も戻る。

---

## 2026-10-29 ご指摘C1〜C7：アイテム詳細の拡大・マイPDFの保存・設定を短く・公開の赤い印・カレンダーの「何を何分」・ミッションの←・英文法の回の終わり（PR: fix/mypage-c）

| # | 何を | どう変えた | ファイル |
|---|---|---|---|
| C1 | マイPDFの詳細 | 消えていた「保存する」を詳細の窓に戻した（音声つきは再生ボタンも） | `src/components/MyCollection.tsx` |
| C2 | アイテムの詳細 | 上に大きな絵（きせかえ＝拡大した姿・PDF＝表紙ページ）、レア度/種類/状態のチップ、名前と短い説明 | `MyCollection.tsx`・`growth-hub.css` |
| C3 | 設定 | 空の列を削除、「通知・記録」を1枚に、「切り替え／ログアウト」を横並び、余白を詰め行は44px、560px以上は2列。見出し「その他・データ」→「安全・データ」 | `src/components/ProfileModal.tsx`・`profile-settings.css`・`legalText.ts`・`docs/APP_STORE.md`・`docs/app_review/BLOCK_FEATURE_FOR_APPLE.md` |
| C4 | マイページの「編集」の赤い点 | サーバーに保存された公開状態を見て、非公開のときだけ出す。編集画面の「プロフィールを公開」の行にも赤い印と「いまは非公開です」 | `src/features/studylog/MyStudyCard.tsx`・`src/components/MyProfileCard.tsx`・`growth-hub.css` |
| C5 | カレンダーの下 | マイページと同じ「教材ごとの色の棒」＋「教材×選んだ日」の何分の表。自分の記録のマスは押すと直せる。改訂前の記録リストは削除 | `src/features/studylog/CalendarTab.tsx`・`manualLogCore.ts`・`studylog.css` |
| C6 | きょうのミッション | 上に ←（ホームのミッション・ガチャの「コインをためる」から来ても戻れる）。「マナラッシュ／対戦／復習でミッションを進める」と下のもどるを削除 | `src/battle/ui/BattleMissions.tsx`・`growth-hub.css` |
| C7 | 英文法の演習 | 5問（1回）終わると結果のまとめに「次の回へ（第N回）」「単元選択に戻る」「ホームに戻る」をはっきり出す（「詳しい結果を確認する」は下に控えめに）。一覧から選んだ回もその回だけで終わる。「続きから」は前にやっていた回のNo.1から。一覧は「第N回 …」と「達成」の印 | `src/components/explanation/ResultSummary.tsx`・`Explanation.tsx`・`step-explanation.css`・`ChapterSelection.tsx`・`unit-select.css` |

**戻し方**：C6・C1/C2/C4・C5・C3・C7 は別コミットなので、その1コミットを revert すれば戻る。

---

## 2026-10-29 ご指摘B1〜B10：ミッション単独画面・プロフィール1画面・称号/持ちものタイル・カレンダーで7日比較・対戦レート ほか（PR: fix/mypage-b10）

| # | 何を | どう変えた | ファイル |
|---|---|---|---|
| B1 | ミッション | それだけの画面に（マイページの見出し・5つのタブを出さない）。もどるは来た画面へ（ガチャから来たらガチャ） | `src/components/GrowthHub.tsx`・`src/App.tsx`・`growth-hub.css` |
| B2 | マイページのカード | 「連続・解いた大問・バッジ・対戦」の行を削除、上を詰めて教材の表を広く | `src/features/studylog/MyStudyCard.tsx`・`studylog.css` |
| B3 | プロフィールを編集 | 1画面に。項目名を枠の中に出して枠を大きく（56px）、連続/学習時間/バッジ（重複）を削除、公開と保存を下にそろえた。非公開ならマイページの「編集」に赤い点 | `src/components/MyProfileCard.tsx`・`MyStudyCard.tsx`・`growth-hub.css` |
| B4 | 称号・もっているもの・マイPDF・ショップ | 小さなタイルの一覧に（押すと詳細の窓・装備/保存/購入は窓の中）。種類はアプリ風のチップ、所有状況は3つの切替（ネイティブの select をやめた）。称号は達成を色と「達成」の印でひと目で、つけている称号は太い枠 | `src/components/MyCollection.tsx`・`src/battle/ui/BattleProfileTabs.tsx`・`growth-hub.css` |
| B5 | ガチャの目玉 | 光の帯・キラキラ・枠の光・絵がふわっと動く。下の余白にとびら君のひとこと（動きを減らす設定では止める） | `src/components/GachaRoom.tsx`・`gacha.css` |
| B5 | とびらバトル／ランキングの切替 | ガチャの「装飾ガチャ／ショップ」と同じ形の共通部品にして、両画面で同じ位置・同じ並び（押されている方だけ変わる）。ランキング上の ← を削除 | `src/components/BattleRankSwitch.tsx`（新）・`battle-rank-switch.css`（新）・`Leaderboard.tsx`・`src/battle/ui/BattleHome.tsx` |
| B6 | フレンド戦のレート | 結果画面からすぐ「部屋に戻る」を押すと、相手の申告を待つ処理が消えてレートが動かなかった。画面を閉じても裏で最大2分待って反映する | `src/battle/data/pendingRating.ts`（新）・`src/battle/hooks/useBattlePostMatch.ts` |
| B7 | 全国対戦のボット戦 | レートが動く（サーバー関数 ghostMatch：1試合1回・1日30試合まで・K=16）。強さの幅を ±90 → ±320 に（近い相手が多い）。答える間を人間らしく（即答・長考・考えるテンポ） | `src/battle/core/aiOpponent.ts`・`src/battle/data/ghostRating.ts`（新）・`BattleAiRoomScreen.tsx`・`functions/index.mjs`・`functions/core.mjs`・`firestore.rules` |
| B8 | カレンダー | 日付を押すと黒くなり、すぐ下のグラフに加わる（最大7日・もう一度押すと外す）。教科色の積み上げ棒＋合計・平均・最長 | `src/features/studylog/CalendarTab.tsx`・`studylog.css` |
| B9 | タブ名 | 「記録」→「カレンダー」。5つのタブにアイコン | `src/components/GrowthHub.tsx`・`growth-hub.css` |
| B10 | 7日のグラフ | 左右の矢印で前の週へ（最大12週前・前の週は日付と合計） | `MyStudyCard.tsx`・`studylog.css` |

**戻し方**：B1・B2/B10・B3・B8/B9・B5（切替）・B5（ガチャ）・B6/B7・B4 は別コミットなので、その1コミットを revert すれば戻る。
**B7 の反映**：サーバー関数とルールの反映（`firebase deploy --only functions:ghostMatch,firestore:rules`）が要る。反映前はボット戦の結果に「レートに反映されませんでした」と出るだけ（対戦はできる）。

---

## 2026-10-28 TOEIC Part 5 の演習を「1ページ6問・マーク式」に・回の一覧の内訳行を外す（PR: feat/toeic-part5）

| 何を | どう変えた | ファイル |
|---|---|---|
| 回の一覧 | 各「第N回演習」カードの「語彙10・品詞6・文法14」の行を出さない。達成・満点の表示、上の説明・注意書きはそのまま。データの分野ラベルと結果画面の分野別正答率は変えていない | `ChapterSelection.tsx`（`!isToeic`） |
| 演習画面 | 1問ずつ → **1ページ6問（30問＝5ページ）**。問題番号（太字）・英文・(A)〜(D) を2×2で並べ、長い選択肢（18文字超）の問題だけ1列。幅1024px以上は2列×3問。「問題文」の枠・「たたむ」「全画面で読む」は出さない | 新規 `src/components/toeic/ToeicPageQuiz.tsx`・`toeic-page.css`・`toeicPageModel.ts`（`QUESTIONS_PER_PAGE`） |
| 選び方 | 選択肢の頭の丸（マーク）を塗る。丸でも文字でも押せる（44px以上）。もう一度押すと外れる。PC は A〜D／1〜4 で選択、↑↓で問題を移動。ラジオボタンとして読み上げ | 同上 |
| 採点 | 「解答と解説を見る」（1問ごと）→「**このページを採点する**」。未回答があれば確認。採点後は○/×と文言、各問の下に解説（正解の理由・他の選択肢・和訳・重要語句）を開閉。採点後は答えを変えられない。点数の演出はページごとに1回 | 同上（採点・記録・XP・結果画面は既存の関数をそのまま使う） |
| 上と下の帯 | 上：戻る・演習・ページ位置（2/5）・回答済み（12/30）・残り時間（10分）。下：前のページ・未回答数・採点する／次のページ／結果を見る | 同上 |
| 中断と再開 | ページ位置・選んだ答え・採点済みのページを復元（保存先は今までと同じキー）。TOEIC だけ、途中で戻っても採点前の答えを消さない | 同上 |
| ご指摘5点（同日） | ①開いた直後は「未回答」の印もオレンジの左線も出さない（中立の灰色）。印は採点ボタンを押したあとだけ未回答の問に出す。答えた問は左線を紺に ②番号を小さな丸にして英文の先頭へ（右のバッジも外し、問題文の幅を広げた。390px で6問中5問が2行） ③空所 ______ を太い下線の枠にし、選んだ語を空所に入れて見せる（採点後は正解=緑・誤り=赤の取り消し線） ④上の帯を「📄 1/5ページ」「☑ 0/30問」とアイコン＋単位で区別 ⑤選んだ選択肢は丸を塗る＋行全体を淡い紺で塗る＋紺の枠＋チェック印（色だけに頼らない） | `ToeicPageQuiz.tsx`、`toeic-page.css` |
| ご指摘3点（同日） | ①採点後に長い選択肢が「hav/e/rec/eiv/ed」と1文字ずつ折れて縦に伸びた → 単語の途中では折らない（`overflow-wrap: break-word`）、「正解」「あなたの答え」は選択肢の横でなく下の行へ ②回の一覧（単元選択）は見出しを「TOEIC」だけにし、「1章 Part 5」のタブ1枚と「TOEIC Part 5 短文穴埋め」の小見出しを出さない ③採点後、一覧の上に「このページの正解 3/6問」、下の帯に「正解 3/6問」を出す（全問正解なら緑） | `ToeicPageQuiz.tsx`、`toeic-page.css`、`ChapterSelection.tsx`（`isToeic` の分岐3か所） |
| 確認・満点表示を外す（10/29） | ①「このページを採点する」を押したとき、未回答があっても「未回答が◯問あります。採点しますか？」の確認を出さずに採点する（未回答は不正解として数えるのは同じ） ②回の一覧で TOEIC だけ「満点 0/3」を出さない（達成の表示・リスニングは同じ） | `ToeicPageQuiz.tsx`（`confirmAction` の1行）、`ChapterSelection.tsx`（`tried && !isToeic`） |
| 採点後の解説を英文法と同じ水準に（10/29） | ①解説の見出しを役割ごとの札に（正解の理由＝紺・いちばん目立つ／着眼点 #2F7C74／ポイント #B0464F／選択肢 #5A6573／TOEICでのコツ #1F5FA8＝英文法と同じ色。アイコン＋文言つき） ②各問に正誤・分野タグ・「ノートに保存」（1問ずつ、同じ問題は1件だけ） ③「正解」「あなたの答え」を英文法と同じ「あなた・正解」バッジに ④ページ上部に結果の帯（このページ n/6問正解・6問の ○× を押すとその問題へ・分野別）。下の帯の「正解 n/6問」は外した ⑤誤答・未回答の解説は最初から開く、正解は閉じる。解説の先頭に問題文を再掲 ⑥PC は採点後だけ1列（右列の下の空白をなくす）。入れ子の枠を減らした ⑦時間の線を 2px の紺に。目安を過ぎても赤・点滅は出さず灰色で「目安を過ぎました」（続けて解ける仕様はそのまま） ⑧手がかりの黄色いマーカー（データがある問題だけ） | `ToeicPageQuiz.tsx`、新規 `ToeicExplanationPanel.tsx`・`ToeicTimer.tsx`・`toeicNote.ts`、`toeic-page.css`。英文法・リスニングの部品（`QuizTimerBar`・`SubQuestionCard` など）は変えていない |

リスニング・英文法の演習画面と共有部品（`ProblemPane`・`AnswerPane`・`MultipleChoiceControl`・`QuizHeader`）は変えていない。`Quiz.tsx` は入口で TOEIC のときだけ専用画面に渡す分岐を足しただけ（本体は `QuizBody` に名前を変えただけで中身は同じ）。
**戻し方**：`Quiz.tsx` の `Quiz` を元の1関数に戻す（`isToeicPageChapter` の分岐と2行の import を消し、`QuizBody` を `export function Quiz` に戻す）。一覧の内訳行は `ChapterSelection.tsx` の `&& !isToeic` を2か所消す。解説の札・結果の帯・時間の表示は、`ToeicPageQuiz.tsx` を `git revert` で1つ前に戻す（新規3ファイルは読まれなくなる）。タブ・小見出しは `ChapterSelection.tsx` の `!isToeic &&` と `isToeic ? 'TOEIC'`・`aria-label` の分岐を消す。

## 2026-10-28 TOEIC Part 5（短文穴埋め・全15回×30問）を追加（PR: feat/toeic-part5）

| 何を | どう変えた | ファイル |
|---|---|---|
| 演習する（英語） | とびら君の吹き出し「今日はどれからやる？」の右に **TOEIC** の小さな入口ボタン（NEW）を置いた。下のカードの列（リスニング〜英単語帳）は動かしていない。高さ600px以下ではとびら君を隠し、ボタンだけ右に残す | `StudyCatalog.tsx`、`study-catalog.css`（`.sc-buddy-row`・`.sc-spot`）、`studyCatalog.ts`（`section: 'spotlight'`） |
| TOEIC の回の一覧 | リスニングと同じ「第N回演習」のカード（進み具合・正答率・満点3回で達成）。上に商標の注意書き | `ChapterSelection.tsx`（`isToeic`・`data-toeic-disclaimer`） |
| 出題・解説 | 英文法と同じ1問ずつ。音声の部品は出ない。選択肢は (A)〜(D) | 既存の `Quiz` をそのまま使う |
| 解説の選択肢（全教科） | 選択肢が (A)〜(D) で始まるときは丸数字を付けない（「①(A)」の二重を防ぐ）。丸数字なしの既存教科は今までどおり | `src/utils/questionDisplay.ts` |
| 結果画面の弱点 | 小問に `skill`（分野）があるときは分野ごとにまとめる。無い教科は今までどおり | `explanationLogic.ts` |

ホーム画面・ストア掲載物は変えていない。
**戻し方**：`studyCatalog.ts` の `english_toeic` の行を消せば入口ボタンが消える（`.sc-buddy-row` だけ残っても見た目は元と同じ）。教科ごと消すなら `subjects.ts` の `toeic_part5`・`allChapters.ts`・`gen-chapter-index.mts` の該当行と `src/data/toeic/` を消して `npx tsx scripts/gen-chapter-index.mts`。

---

## 2026-10-28 ご指摘10点：マイページ＝今日の勉強記録・記録はカレンダーだけ・ガチャをモンスト風に ほか（PR: fix/mypage-gacha-10）

| # | 何を | どう変えた | ファイル |
|---|---|---|---|
| A1 | マイページの記録 | 「マイページ」タブ＝今日の勉強記録（今日・今週・今月・累計、7日の棒グラフ、教材ごとの7日の表＝スタディプラスの表記を参考）。「記録」タブはカレンダーだけ（日付を押すとその日の記録）。集計・教材・フレンドのタブと「＋記録」ボタンは撤去（記録を書くのはマイページの「学習を記録」1か所） | `src/features/studylog/MyStudyCard.tsx`・`CalendarTab.tsx`・`StudyLogPage.tsx`・`manualLogCore.ts`（weekByMaterial）・`studylog.css`、`SummaryTab.tsx`/`MaterialsTab.tsx` は削除 |
| A2 | きせかえタブの青い枠 | 「マナクランの集計サーバー…」の文言を出さない（プレゼントは届いたときだけ表示） | `src/components/MyCollection.tsx` |
| A3 | とびら君・Lv・コインのカード | 別カードをやめ、A1のカードの上段にまとめた | `src/components/GrowthHub.tsx`・`MyStudyCard.tsx` |
| A4 | 設定の「対戦で相手に見えるカード」 | 削除 | `src/components/ProfileModal.tsx` |
| A5 | 通知が鳴らない | iOS は予約に音（notify_chime.wav）を付ける、Android は重要度「高」の専用チャンネル（res/raw/notify_chime.wav）、Web はチャイムを鳴らす。設定に「テスト通知を送る」 | `src/utils/studyRemindersRuntime.ts`・`ReminderSettings.tsx`・`capacitor.config.ts`・`public/notify_chime.wav`・`android/app/src/main/res/raw/notify_chime.wav` |
| A6 | とびらバトル／ランキングの切替 | 両画面とも 左＝とびらバトル・右＝ランキング に固定 | `src/components/Leaderboard.tsx`・`src/battle/ui/BattleHome.tsx` |
| A7 | ランキングの「…」 | 「詳細」ボタンに。窓は ①プロフィールを見る ②運営に通報する ③ブロックする の3段、見出しに名前を出さない | `src/features/safety/UserSafetyMenu.tsx`・`Leaderboard.tsx`・`src/styles/game-extras.css` |
| A8 | セリフ・志望校・夢 | ホームの吹き出しを装飾より手前・不透明に。ランキングの志望校・志は2行まで表示 | `src/styles/world.css`・`src/components/ranking.css` |
| A9 | 称号タブの← | 削除（ほかのタブとそろえる） | `src/battle/ui/BattleProfile.tsx` |
| A10 | ガチャ画面 | モンスト風：週がわりの目玉バナー＋今週のピックアップ5つ（LR2・UR3を週ごとに入れ替え）。絵を押すと「アイテムの詳細」（中身の一部・試し聞き）。ピックアップ一覧・提供割合・コインをためるは小さいボタン。動画で1回・1回・10＋1連はそのまま。セット収集・かけら交換はショップの「種類」へ（ボタンは増やさない） | `src/components/GachaRoom.tsx`・`gacha/GachaItemDetail.tsx`（新）・`gacha/GachaSetsPanel.tsx`（旧 GachaSetsModal）・`MyCollection.tsx`・`gacha.css` |

**戻し方**：各項目は別コミット（A1/A3・A2/A4・A9・A6・A7・A8・A5・A10）なので、その1コミットを revert すれば戻る。

## 2026-10-28 「記録」の住み分け：ホームは「復習」、記録はマイページだけ（PR: feat/study-community）

| 何を | どう変えた | ファイル |
|---|---|---|
| ホームの横長ボタン | 「復習・記録」→「復習」（小さい字「苦手をなくす」はそのまま） | `Home.tsx` |
| 復習の画面 | 見出し「復習・記録」→「復習」。上の切替「復習ノート／学習記録 3日分」→「復習ノート／解いた問題 3日分」。中身（解きなおし・まちがえた問題だけ）は同じ | `StudyHub.tsx`、`StudyRecord.tsx` |
| マイページ | 「記録」タブ（学習時間・自分で書いた勉強・集計・カレンダー・フレンド）はそのまま。**「記録」という言葉はここだけ** | 変更なし |

住み分け：**ホーム「復習」＝まちがえた問題を解きなおす場所**、**マイページ「記録」＝どれだけ勉強したかを残して見る場所**。見た目・配置・色は変えていない（文字だけ）。
**戻し方**：上の3か所の文字を元に戻す（`tests/recordNaming.test.ts` も消す）。
## 2026-10-28 Web 版の広告の場所を元に戻す・クラス機能を確認用アカウントだけ開く（PR: fix/ad-space-classroom-preview）

| 何を | どう変えた | ファイル |
|---|---|---|
| 下の広告の場所（Web 版） | #114 で Web 版だけ枠（50px）が消え、画面の下が詰まっていた。2026-10-14 の決まり（Web もアプリと同じ場所を空ける・広告を出すのはアプリだけ）に戻した | `src/ads/adConfig.ts`、`AdBannerSlot.tsx`（説明だけ）、`tests/rewarded-ad.test.ts` |
| 演習する（リスニング・英文法・英単語・英熟語・英文解釈・英単語帳） | 上の枠が戻ったことで、広告ありの詰めた形（説明1行／なし）に戻り、375×667・390×844 でも一覧がスクロールせず1画面に入る（CSS は変えていない） | なし（`study-catalog.css` の既存の広告ありブロックがそのまま効く） |
| 設定 › クラス | 公開前（`SOCIAL_FEATURES.classroom` は false のまま）でも、hirokingz0927@gmail.com と mntobira@gmail.com でログインしたときだけ「準備中」を外して中に入れる（教師役の確認用）。ほかの人は今までどおり「準備中」 | `src/config/features.ts`（`CLASSROOM_PREVIEW_EMAILS`）、`ProfileModal.tsx`、`ReasonBox.tsx` |

**戻し方**：広告の場所は `adConfig.ts` の `enabled` の頭に `Capacitor.isNativePlatform() &&` を付ける（Web で枠を消したいだけなら `?no_ads=1`）。クラスは `CLASSROOM_PREVIEW_EMAILS` を空にする。

---

## 2026-10-28 マイページを「自分の学習ページ」に・手動の学習記録・教材・集計・フレンドの記録フィード（PR: feat/study-community）

| 何を | どう変えた | ファイル |
|---|---|---|
| マイページ | 上のタブに「記録」を追加（マイページ／記録／きせかえ／称号／マイPDF）。最初の画面は学習カード（名前・学年・志望校・志、今日／今週／今月／累計、連続日数・解いた大問・バッジ・対戦成績、「学習を記録」「記録・集計を見る」「編集」）。プロフィールの編集は「編集」から別画面（もどるで戻る）。幅360px以下は4つの数字を2×2に | `MyStudyCard.tsx`、`GrowthHub.tsx`、`growth-hub.css`、`studylog.css`（`.mystudy*`） |
| 記録ページ | 「カレンダー／集計／教材／フレンド」の4タブ＋「＋記録」。カレンダーは見るだけ（濃さ4段階・自己申告の日は点）で、下の一覧（スクロール）から日の記録を直す。集計は今日・今週・今月、アプリ計測と自己申告を分けた累計、目標メーター、7日間グラフ、教科別（演習・復習へ） | `StudyLogPage.tsx`、`CalendarTab.tsx`、`SummaryTab.tsx`、`studylog.css`（`.slog-*`） |
| 記録の窓 | 日付・分（15/30/60/90分の札）・教科（3つの札＋他教科）・教材。学習量・コメントは「も書く」で開く。フレンドに共有は既定オフ（ログイン時のみ）。窓の中はスクロールしない | `RecordDialog.tsx` |
| 教材・目標 | 教材の検索・教科で絞る・登録・編集・削除（記録は残る）、目標時間 | `MaterialsTab.tsx`、`MaterialDialogs.tsx` |
| フレンドのフィード | フレンドが共有した記録だけ。リアクションは「ファイト」「いいね」の2つ（チャットなし）。名前から公開プロフィール、…から報告・ブロック | `FriendFeed.tsx` |
| 公開プロフィール | 対戦成績の札と「共有した記録」（最新3件、フレンドのみ） | `PublicProfileView.tsx`、`public-profile.css`、`UserProfileDialog.tsx` |

新しい色は足していない（tokens.css のトークンと既存の #f3d9a4 だけ）。ボタン44px以上・文字12px以上、320×568／375×667／390×844／1280×800 で一覧以外スクロールなし。
**戻し方**：見た目だけ戻すなら `GrowthHub.tsx` の概要を `MyProfileCard` に戻し、「記録」タブを消す。全部戻すならこのPRを `git revert`（共有された記録 `study_posts` はルールを戻すと読めなくなるだけで、端末の記録は残る）。
## 2026-10-27 ガチャに「ピックアップ」（LR・厳選URの中身を少し見る）＋ LR リスニング第1回の音声（PR: feat/kyotsu-mock-lr）

| 何を | どう変えた | ファイル |
|---|---|---|
| ガチャ画面の下のボタン | 「ピックアップ」を追加（セット・提供割合の左）。下のボタンは1行に並べ、文字はボタン内で折り返す（画面の高さは増やさない） | `src/components/GachaRoom.tsx`、`src/components/gacha.css` |
| ピックアップのダイアログ | LR 10種 → 厳選UR 10種の順に並べ、各行の「少し見る」で **2ページ分の上半分だけ**（下はぼかして白く消す）を表示。リスニング第1回は問1の試聴つき | `src/components/gacha/GachaPickupModal.tsx`、`public/prints/previews/`（40枚・計324KB）、`src/data/gachaPreviews.generated.ts`、`scripts/gacha-prints/build-previews.py` |
| マイPDF | LR リスニング第1回を持っている人だけ「音声を聞く（24トラック）」。問題ごとのボタン（44px）で再生・もう一度押すと停止。第1・2問は本番どおり2回流れる | `src/components/gacha/KyotsuAudioPlayer.tsx`、`src/components/MyCollection.tsx`、`src/data/kyotsuMockAudio.ts`、`public/prints/kyotsu_assets/audio/` |
| 音声の元ファイル | 受け取った ElevenLabs v4 の6本を保存、区切り位置と sha256 を記録 | `audio_sources/commercial/elevenlabs_2026-10-26_kyotsu_l1/` |

**A案とB案の統合（integrate/gacha-pickup）**：同じ依頼を2つのやり方で作ってしまったので、PR を2本立てて比べ、A案を採用した。
- 採用 A（下のボタン → ダイアログで一覧）：ガチャは1画面に収める決まり。B（画面に横並びの欄）は背の低い端末で隠すしかなく、隠すと見つからない。
- 採用 A のマイPDF音声（問題ごとのボタン）：B の「選ぶ → 再生」より1タップ少ない。
- B から取り込んだもの：ピックアップを閉じたら試聴を止める（A は閉じても鳴り続けていた）。
- 直したもの：A のコミットで `kyotsuMockAudio.ts` が別版に上書きされ、テスト3件が落ちていた → `q`・`part`・`kyotsuAudioLabel` を戻した。使われていない `GachaPreviewModal.tsx` は削除。

**main（#110〜#114）との統合（2026-10-28）**：main で UR が「完全版の本」15冊だけになり、厳選URの旧10種は SR になっていた → 厳選UR（ショーケースとピックアップ）を完全版の本10冊に入れ替え、ちら見せ画像を作り直した（40枚・320KB）。予想問題の PDF・生成スクリプトはこちらの新しい版（図29枚・英文増量）、レア度・提供割合（LR1/UR3/SR6/R16/N74）は main の版。

**戻し方**：ピックアップだけ消すなら `GachaRoom.tsx` の `data-gacha-pickup-open` のボタンと `<GachaPickupModal>` の2か所を削除（gacha.css の「ピックアップ」節は残っても無害）。音声だけ消すなら `MyCollection.tsx` の `<KyotsuAudioPlayer printId={item.id}/>` を削除。

## 2026-10-26 LR 共通テスト予想問題：図・イラストを組み込み、リーディングを本番並みの分量に（PR: feat/kyotsu-mock-lr）

| 何を | どう変えた | ファイル |
|---|---|---|
| リスニングの絵・地図 | 受け取った画像34枚＋地図4枚を問題冊子に。4枚組は横一列で各絵の下中央に①〜④（本番と同じ）。地図は元の丸を消して同じ位置に丸数字 | `scripts/gacha-prints/kyotsu_mock/figs.py`、`render.py`、`assets/img/` |
| リーディングの図 | チラシ・ブログ・地図・図解など24枚を各枠に。未着の5枚（藍染め・ヒートアイランド・ソーラー充電器・書道・振動で感じる音楽）は白黒線画で生成して追加＝全29枚 | 同上 |
| 台本の微修正 | 絵と合わない6問（第1回問8、第2回問5・8、第3回第4問A、第4回問8・11）を絵に合わせて書き直し | `set1_l.py`〜`set4_l.py` |
| 難易度（分量） | リーディング各回 約3,200〜4,400語 → **約5,100〜5,400語**（本番 約5,600語）。資料・段落・意見を追加、正解と図の内容は不変 | `set{1..5}_r1.py`・`_r2.py` |
| 台帳 | ページ数・KB を更新（画像入りで1冊 1.1〜1.6MB） |
| レビューの★ | 第5回 第2問の ★☆ が空白になっていたのを表示されるように | `render.py` | `src/data/kyotsuMockPrints.ts` |

**戻し方**：`figs.py` の `apply_reading` / `apply_listening` の呼び出し（`build.py`）を外すと図なしの版に戻る。分量の増量はこの PR のコミット「英文量を本番並みに増量」を `git revert`。## 2026-10-28 英単語の演習：「この範囲を全部」ボタンを追加（PR: fix/vocab-start-all）

| 何を | どう変えた | ファイル |
|---|---|---|
| 出題の設定の下 | 青いボタン（まだ ✓ がない語から○問）の下に「この範囲を全部（○語）」を追加。✓ 済みの語も含めて範囲の全語を出す（順番・向きは設定どおり）。「間違えた語から」と両方あるときは横に2つ並べる。設定が「すべて×全部」で青いボタンが既に全部のときは出さない | `src/components/VocabQuiz.tsx`、`src/components/foundation.css` |

戻すとき：`VocabQuiz.tsx` の `startAll`・`showAll`・`vq-start-sub` を消し、間違えた語のボタンを元の1行に戻す。`foundation.css` の「2026-10-28」の4行を消す。

---

## 2026-10-27 公開プロフィールの充実・ランキングをガチャ画面の見た目に（PR: feat/public-profile-rich）

| 何を | どう変えた | ファイル |
|---|---|---|
| 公開プロフィール | 名前を押すと窓で開く（ランキング・フレンド）。とびら君・称号・学年・志望校・志・自己紹介・学習時間・7日間グラフ・連続・解いた大問・達成ステージ・称号数。低い画面（高さ820px以下）は「プロフィール／学習の記録」の2枚に分け、窓の中はスクロールしない | `src/features/profile/*`、`UserProfileDialog.tsx` |
| マイページのプロフィール | 学年は選択式、自己紹介は窓で編集、「見え方」で公開時の見た目を確認 | `MyProfileCard.tsx`、`growth-hub.css` |
| ランキング | 背景・字・切替・タブをガチャと同じ共通部品の形に。自分のカードはガチャの目玉カードの作り（白い縁＋下の厚み）で、次のリーグまでのバーをカードの中へ（1段へらして一覧を広く）。行は共通カード、1〜3位は金・銀・銅のメダル。シーズンの帯は44pxで1行 | `ranking.css`（末尾の 2026-10-27 ブロック）、`Leaderboard.tsx`（`is-in-card`・`data-rank`） |

新しい色は足していない（tokens.css のトークンとリーグ色だけ）。
**戻し方**：ランキングだけ戻すなら `ranking.css` 末尾の「2026-10-27」以降を消し、`Leaderboard.tsx` のバーをカードの外へ戻す。全部戻すならこのPRを `git revert`。

---

## 2026-10-27 ガチャの UR（完全版）に B4 プリント6冊を追加（PR #112: feat/idiom-reading-quiz）

| 何を | どう変えた | ファイル |
|---|---|---|
| ガチャの UR | 9冊 → 15冊。熟語＋英文解釈 小テスト（基礎・標準・発展）、英文法4択（文法編 第1〜16章・語法編 第17〜19章・会話表現編 第20章）を追加。UR 枠の確率 3% は変えていない（1冊あたり約0.33% → 約0.2%） | `src/data/gachaPrints.generated.ts`、`public/prints/print_book_{idiom_reading_*,grammar_b4_*}.pdf`、`public/prints/thumbs/` |

戻すとき：`gachaPrints.generated.ts` の「2026-10-27 UR に追加」以降の6件を消し、`tests/gachaDeluxe.test.ts` の冊数リストを9冊に戻す。

---

## 2026-10-26 とびら君の演出動画 C01〜C16 を全部差し替え・新しい場面に追加（PR: feat/cinematics-c-all）

| 何を | どう変えた | ファイル |
|---|---|---|
| 動画16本 | Adobe Firefly で作り直し。背景はすべてクリーム色 #FBF5E8 に統一（緑・肌色を塗り替え）、参照画像が貼られた前後のコマを除去、長さを 1.6〜4.0 秒に | `public/cinematics/*.mp4`、`docs/CINEMATICS.md` |
| ガチャの確定演出 | 丸窓の動画を引いたレア度ごとに（N・R・SR・UR、LR は ため→大当たり の2本） | `GachaReveal.tsx`、`CinematicClip.tsx`（`GACHA_REVEAL_CLIPS`） |
| 対戦の負け | 勝ちと同じ場所に「はげまし」動画（最後のコマを残す） | `BattleResult.tsx` |
| 段位アップ・レベルアップ | 対戦結果が出て約4秒後に、お祝い動画を画面の上に1回（段位を優先） | `BattleResult.tsx`、`CelebrationClip` |
| ログインボーナス | プレゼントを差し出す動画（7日目は連続学習の動画）をその日1回 | `GrowthFx.tsx` |
| ガチャのセット完成 | お祝い動画を1回 | `GachaResultStage.tsx` |
| 全問正解 | 結果のとびら君がトロフィーを掲げる動画に（最後のコマを残す） | `ResultSummary.tsx`、`cinematic-celebration.css` |
| 応援動画で1回 | 流す動画を起動画面の動画からガチャ開封の動画に | `RewardVideo.tsx` |

お祝い動画は再生が始まってから表示し、タップ・「演出をスキップ」・終了で消える。動きを減らす設定・データセーバーでは出ない。
**戻し方**：このPRを `git revert`。お祝いだけ止めるなら各ファイルの `<CelebrationClip … />` を消す。

---

## 2026-10-26 UR に2冊追加（リスニング大問別・リーディング第3回）／ガチャの目玉にリスニング（PR: feat/firefly-kit-ur-deluxe）

| 何を | どう変えた | ファイル |
|---|---|---|
| UR（完全版） | 7冊 → **9冊**：共通テスト英語リスニング 大問別演習（全6大問・3回分・79ページ・各問題に QR でアプリの音声）、リーディング大問別演習 第3回 | `src/data/gachaPrints.generated.ts` |
| ガチャ部屋の目玉（今週の UR） | 優先する科目の先頭に `english_listening` を追加（リスニングの本が目玉に出やすい） | `src/components/GachaRoom.tsx` |
| 動画プロンプト | 英文解釈用の動画 R01〜R07・扉絵60枚・本の図12枚を追加。PDF はコピペ用の文字ページつき | `scripts/firefly-kit/reading_media.py`、`build_reading_media.py`、`build_kit.py` |

**戻し方**：目玉は `preferSubjects` から `'english_listening'` を外す。本は台帳の該当2件を消す（PDF は残っていても出ない）。

## 2026-10-24 ガチャ：はずれ多め・UR は「完全版の本」だけ／Firefly 動画キット（PR: feat/firefly-kit-ur-deluxe）

| 何を | どう変えた | ファイル |
|---|---|---|
| 抽選の割合 | N 65→**75%**・R 25→16%・SR 5→6%・UR 5→**3%** | `src/battle/core/arenaEconomy.ts` |
| UR（大当たり） | 「その一冊で完成する本」（完全版）7冊だけに：英単語 Lv1／Lv2／Lv3・4、英熟語 全1885、共通テスト英語リーディング大問別演習 第1回・第2回、共通テスト全科目 出題分析 | `src/data/gachaPrints.generated.ts`（category: '完全版'）、`growthItems.ts`（`printRarity`） |
| これまでの学習プリント（単元・100語テスト等 50種） | UR → **SR** に移動（中身は同じ） | `growthItems.ts` |
| 提供割合の説明・空のときの文言 | 「URは完全版の本」「SRで学習プリント」に | `GachaCollectionModal.tsx`、`MyCollection.tsx` |
| 動画 | Adobe Firefly 用キット（40本：撮り直し4＋新規36）の元データと PDF・画像の作り方 | `scripts/firefly-kit/*`、`docs/FIREFLY_KIT.md` |

本の作り方：`python3 scripts/gacha-prints/build-vocab-book.py`／`build-reading-mock.py`／`build-analysis-book.py`（共通部品 `book_common.py`）。

**戻し方**：割合だけ戻すなら `GACHA_RARITY_RATES` を `{ UR: 0.05, SR: 0.05, R: 0.25, N: 0.65 }` に、旧プリントを UR に戻すなら `printRarity` を常に 'UR' に。

## 2026-10-24 ガチャに LR（レジェンドレア）を追加＝共通テスト英語 予想問題 5回分（PR: feat/kyotsu-mock-lr）

| 何を | どう変えた | ファイル |
|---|---|---|
| レア度 | UR の上に **LR** を新設。提供割合 LR 1%（UR 5% は据え置き、N を 65→64%）。重複は100枚返還・かけら10 | `growthItems.ts`、`arenaEconomy.ts`、`gachaSets.ts`、`gachaFeatured.ts` |
| 確定演出 | 青→金→虹→UR の後に **深紅×金の「伝説降臨」段階**（星6つ）。演出全体は約5.9秒（安全装置8秒未満） | `gachaRevealSteps.ts`、`src/index.css` |
| レア度の札・結果画面 | LR の札（深紅の地・金の縁・王冠）、結果に「レジェンドレア！」、提供割合の表に LR 行 | `ui/index.tsx`、`system.css`、`tokens.css`、`game-extras.css`、`gacha.css`、`gacha/GachaResultStage.tsx`、`gacha/GachaCollectionModal.tsx`、`gacha/GachaSetsModal.tsx` |
| LR の景品 | 共通テスト 英語リーディング（80分・100点・大問8・44解答）／リスニング（30分・100点・大問6・37問）の**予想問題 各5回＝10冊**。本番と同じ白黒の問題冊子レイアウト（表紙の注意事項・四角囲みの解答番号・マークシート型解答欄）＋正解と配点＋全問解説。リスニングは全スクリプト＋全訳つき | `public/prints/print_lr_kyotsu_*.pdf`、`src/data/kyotsuMockPrints.ts`、`scripts/gacha-prints/kyotsu_mock/` |

**戻し方**：このPRを `git revert`。LR を引いた人の所持データ（`owned` の id）は残るが、古い版では該当アイテムが無いので表示されないだけで壊れない。

---

## 2026-10-24 ご指摘4点（PR: fix/battle-choice-shift-and-q6b-carousel）

| 何を | どう変えた | ファイル |
|---|---|---|
| 対戦：相手／自分が答えると 🔵🔴 の札・相手の確定回答・「相手は回答ずみ！」が出て、4択ボタンが上下に揺れて押し間違える | 3つとも「高さを先に決めた枠」にして中身だけ入れ替える（実況は最新1行・28px、相手の確定回答は答え合わせのときだけ・34px、お知らせ行18px）。低い画面で進捗行が出たり消えたりしていたのも常時表示に | `src/battle/ui/BattleLiveParts.tsx`、`BattleLiveStage.tsx`、`BattleQuestionView.tsx`、`battle-question.css` |
| 正解/不正解が出たあとに解答画面へ戻れる | 「問題に戻る」（上部・スマホ下部）を撤去、← キーと「前へ」も解説表示中は無効 | `src/components/explanation/ExplanationHeader.tsx`、`BottomBars.tsx`、`src/utils/quizNavigationActions.ts`、`src/components/Quiz.tsx` |
| 第6問B のグラフ4枚が並んで小さい | 1枚ずつ大きく表示。‹ › ボタン（44px）・①〜④ボタン・左右スワイプ・← → キーで切り替え（端で反対へ回る） | `src/components/ListeningMaterials.tsx`（`FigureCarousel`） |
| 選択肢の下の操作説明「ア 選ぶ → ア 斜線 → ア 戻す／閉じる」「?操作説明」 | 全問題で表示しない（操作そのもの＝タップで選択→もう一度で斜線→戻す は残す） | `src/components/MultipleChoiceControl.tsx` |

**戻し方**：このPRを `git revert`。操作説明だけ戻すなら `MultipleChoiceControl.tsx` に `renderEliminationHint({ elimHintOpen, dismissElimHint, setElimHintOpen })` を戻す。

---

## 2026-10-24 英文解釈：本文の全訳を解説に（PR: feat/reading-translation）

| 何を | どう変えた | ファイル |
|---|---|---|
| 解説（答えたあと） | 根拠の英文＋和訳の下に「第N段落の全訳」（タップで開く）。根拠の部分は太字＋黄色マーカー。ふだんは閉じているので1画面に収まる | `src/components/ReadingQuiz.tsx`、`src/components/foundation.css` |
| 結果画面 | 「本文と全訳を見る」（タップで開く）。段落ごとに英文→和訳 | 同上 |
| データ | 全60題・208段落の全訳。設問の根拠の和訳と同じ言い回し | `src/data/reading/ja/level1〜5.ts` |

**戻し方**：`ReadingQuiz.tsx` の `data-reading-translation` と `data-reading-translation-all` の `<details>` を消す（データは残しても害なし）。

---

## 2026-10-23 Web ログインの「連携中…」と Apple の失敗（PR: fix/web-login-stuck）

見た目の変更はほぼ無し。
| 何を | どう変えた | ファイル |
|---|---|---|
| ポップアップを閉じたとき | 画面全体の遷移に切り替えず「ログインをキャンセルしました。もう一度ボタンを押すとやり直せます。」 | `src/utils/webSignInCore.ts` |
| Google と Apple のボタン | 片方の処理中はもう片方も押せない | `src/hooks/useSignInGuard.ts` ほか4画面 |
| ログイン済みなのにログイン画面のまま | 自動でプロフィール確認・ホームへ | `Onboarding.tsx`、`useAuthRouting.ts` |
| Apple が Invalid web redirect url | 同じドメイン化を二重スイッチに（`VITE_AUTH_SAME_ORIGIN_APPLE_READY`） | `src/authDomainPolicy.ts` |

詳細は `docs/WEB_LOGIN_SAME_ORIGIN.md` の冒頭。

**戻し方**：このPRを `git revert`。

---

## 2026-10-23 とびら君の背景なしモーション（準備）＋ガチャのやり込み強化（PR: feat/tobira-motion-gacha-depth）

| 何を | どう変えた | ファイル |
|---|---|---|
| とびら君の動き | 静止画の位置で短く動く「背景なし動画」の再生部品を追加。**動画ファイルが届くまで見た目は変わらない**（`ready: false`） | `src/components/TobiraMotion.tsx`、`tobira-motion.css` |
| 置き場所 | ホーム（1日1回のあいさつ／3日ぶりは起きる）、ミッション達成、対戦の負け、全国対戦の相手さがし | `Home.tsx`、`MissionToast.tsx`、`BattleResult.tsx`、`BattleMatchingRadar.tsx` |
| 動画の作り方 | Adobe Firefly（Firefly Video モデル）用プロンプト・緑背景の参照画像・取り込みスクリプト | `docs/TOBIRA_MOTION*.md`、`docs/tobira_motion_refs/`、`scripts/tobira-motion/import.sh` |
| ガチャ景品 | 11種追加（ヘッドホン・ふたば・ドットのサングラス・きらりほっぺ・こなゆき・アルファベット・イナズマ・壁紙4種） | `growthItems.ts`、`tobiraParts.ts`、`TobiraAccessories.tsx` |
| セット収集 | 6セット（各4つ）。そろうと称号＋限定フレーム。3セットで「コレクター」虹フレーム | `src/battle/core/gachaSets.ts`、`growthBadges.ts` |
| かけら交換 | ダブりで「とびらのかけら」が貯まり、未所持の装飾を選んで交換（学習プリントは対象外）。アカウント同期対応 | `arenaEconomy.ts`、`growthStore.ts`、`userDataSyncCore.ts`、`gacha/GachaSetsModal.tsx` |
| ガチャ画面 | 下のリンクに「セット n/6・かけら n」を追加（ダイアログで開く＝画面は1画面のまま）。結果に「かけら +n」「セット完成！」 | `GachaRoom.tsx`、`gacha/GachaResultStage.tsx` |

**戻し方**：このPRを `git revert`。かけら（`shards`）は保存データに残るが、古い版は読み飛ばすだけで壊れない。

---

## 2026-10-22 Web ログインが「連携中…」で止まる件（PR: fix/web-login-same-origin）

見た目の変更はほぼ無し。
| 何を | どう変えた | ファイル |
|---|---|---|
| ポップアップの結果が届かず「連携中…」のまま | 裏でログインが済んでいたらその時点で成功扱い。90秒たっても何も無ければ止めて「ログインの結果を受け取れませんでした。ページを再読み込みして…」と案内（ボタンをもう一度押せる） | `src/utils/googleAuth.ts`（`popupWithWatchdog`） |
| ログインの往復が別ドメイン（firebaseapp.com）で、ブラウザの保護で結果が戻らない | `/__/auth/*` を自分のドメインから中継。`VITE_AUTH_SAME_ORIGIN=true` を入れると authDomain が今のドメインになる（アプリ版は変わらない） | `vercel.json`、`src/firebase.ts` |

管理画面での設定手順は `docs/WEB_LOGIN_SAME_ORIGIN.md`。

**戻し方**：まず Vercel の `VITE_AUTH_SAME_ORIGIN` を消して Redeploy。コードごと戻すならこのPRを `git revert`。

---

## 2026-10-21 Web ログインのエラー文（PR: fix/coin-sync-and-web-login）

見た目の変更はほぼ無し。Web 版でログインの準備に失敗したとき（`auth/argument-error`）の文を
「Firebase: Error (auth/argument-error).」→「ログインの準備に失敗しました。ページを再読み込みしてから、もう一度お試しください。」に。
原因の修正と、マナコイン・XP（レベル）の同期の修正の詳細は `docs/archive/FIX_2026-10-21_coin_sync_web_login.md`。

**戻し方**：`src/utils/googleAuth.ts` の `describeAuthError` の `argument-error` の3行を消す。

---

## 2026-10-21 ホーム：とびら君に待機モーション（PR: feat/home-mascot-idle）

| 何を | どう変えた | ファイル |
|---|---|---|
| ホームのとびら君が止まったまま | **6秒に1回、約0.6秒**だけ「ちょっとしゃがむ → ぴょこっと跳ねる（体の高さの4%）→ 着地でむにっ」。足元の影も跳ねに合わせて小さく・うすく | `src/components/home-mascot-idle.css`（新規）、`src/components/Home.tsx`（読み込み1行） |
| ドラッグで回している間 | 待機モーションは止まる（回転とけんかしない） | 同上（`:not([data-spinning]):not([data-settling])`） |
| 動きを減らす設定 | 動かさない | 同上 |

**戻し方**：`home-mascot-idle.css` を消し、`Home.tsx` の `import './home-mascot-idle.css';` の1行を消す。
頻度を変えたいときは `6s`（間隔）を、跳ねの高さは `translate: 0 -4%` を変える。

---

## 2026-10-21（仕上げ）復習・記録：機能と配置はそのまま、見た目と手ざわりを上げる

| 何を | どう変えた | ファイル |
|---|---|---|
| 達成の帯の文字がばらばら | 「あと3問」「🔥3日」を小さな札に。連続日数は「🔥数字＋日」で短く（読み上げは「N日連続」）。完了したらリングが緑一色＋チェック。帯に光のにじみと浮き影 | `StudyHub.tsx`（`rr-streak`）、`review-record.css`（末尾「2026-10-21 c」） |
| 今週の扉が地に溶ける | 白い小箱に入れ、今日の棒の下に金の点 | `review-record.css` |
| 主ボタンがのっぺり | つや（上半分に明るいグラデ）と押した感触。PCでは2行（「復習を始める」／1問目） | `review-record.css` |
| 「復習ノート｜学習記録」が別々の大きなボタン | 1本の切替にして、青い下地がすべって移る（transform だけ） | `StudyHub.tsx`（`data-active`）、`review-record.css` |
| 小タブも箱型で、上の切替と見分けにくい | 下線タブに（選んだタブに青い線、数字は青いバッジ） | `review-record.css` |
| 一覧の続きがあるか分かりにくい | 一覧だけのスクロール枠に、上の影（スクロール済み）と下のフェード（続きあり） | `StudyHub.tsx`（`ScrollArea`）、`review-record.css` |
| 見出し右のメダル数 | 押すと「習得」タブへ | `StudyHub.tsx`（`rr-medal-pill`） |
| 今日の分が無いときの帯が高い | 「次の復習は…／演習する」を1行に | `StudyHub.tsx`、`review-record.css` |

**戻し方**：この仕上げのコミットだけを `git revert` する（作り直し・一覧を広くした分は残る）。

## 2026-10-21（追加）復習・記録：上の帯を小さくして、一覧を広く・一覧だけスクロール

| 何を | どう変えた | ファイル |
|---|---|---|
| 達成の帯（リング＋大きな7日グラフ＋2行の主ボタン）が画面の半分近く（一覧は上から約470pxで始まっていた） | 1段にまとめた：小さいリング（92→56px）｜「今日なおした N問」・あと何問・連続日数｜**小さな7本の扉**＋「今週 N問」。主ボタンは1行（PCでは同じ行の右端）。一覧は約314pxから始まる（390×844） | `src/components/StudyHub.tsx`（`TodayRing` の大きさ、`WeekDoors` は曜日の文字をやめて棒だけ、帯の中身）、`src/components/review-record.css`（①の帯・PCのブロック） |
| 画面全体がスクロールして、一覧の場所が狭く感じる | 見出し・帯・切替・タブは固定し、**一覧（`.rr-scroll`）だけがスクロール**。学習記録の側も同じ | `StudyHub.tsx`（`<div className="rr-scroll" data-rr-scroll>` で一覧を囲む）、`review-record.css`（末尾「2026-10-21 b」） |
| タブを変えても一覧が途中のまま | タブ・科目を変えたら一覧を先頭に戻す | `StudyHub.tsx`（`rr-scroll` に `key`） |
| 切替ボタンが高い（52px） | 46px（押す所は44px以上を守る） | `review-record.css` |

**戻し方**：この追加分のコミットだけを `git revert` する（①の作り直しは残る）。

## 2026-10-21 復習・記録の画面を作り直し ＋ 見出しの位置をそろえる（PR: feat/review-record-redesign）

### ① 復習・記録：画面の組み立てを作り直し
| 何を | どう変えた | ファイル |
|---|---|---|
| タブが5つ（今日／苦手リスト／ノート／重要／記録）で窮屈。「記録」の中にまた「学習記録」の見出しが出ていた | 上に **達成の帯**、その下に大きな2択 **「復習ノート」｜「学習記録」**。復習ノートの中だけ小タブ **今日／苦手／習得／ノート** の4つ（「重要」は「ノート」にまとめた） | `src/components/StudyHub.tsx`（本体の `StudyHub` を作り直し。カード部品 `ReviewCard` などはそのまま） |
| 達成感がない | 達成の帯：今日のリング（直した数／今日の分。全部終わると緑＋チェック）、「今日なおした N問」、🔥連続日数、今週の合計、**7日分の「扉」の棒**（直した日ほど高い・今日は金色）。「できた」を押すと **＋1** がふわっと出る | `StudyHub.tsx`（`TodayRing`・`WeekDoors`）、`src/components/review-record.css`（新規） |
| 覚えた問題が見えない | 「習得」タブに **メダル棚**（6回なおした問題）。見出しの右にもメダル数 | `StudyHub.tsx`（`MasteredShelf`） |
| 「今日直した数・連続日数」の元データがなかった | 復習で正解したときに小さな日誌を端末に残す（60日・最大600件）。同じ問題を同じ日に2回直しても1と数える | `src/utils/reviewProgress.ts`（新規）、`src/utils/reviewList.ts`（`markReviewedCorrect` の最後で `recordReviewDone`） |
| 学習記録の「まちがえた問題だけ解く（1問）」がはみ出す | この画面の中ではボタンを2行まで折り返し、430px以下は「（1問）」を省く | `review-record.css`（末尾） |

**戻し方**：`git revert` でこの PR を戻すのがいちばん確実。手で戻す場合は `StudyHub.tsx` の本体を前の版に戻し、`review-record.css`・`reviewProgress.ts` を消し、`reviewList.ts` の `recordReviewDone` の2行（import と呼び出し）を消す。日誌のデータ `review_done_v1_*` は残っても害はない。

### ② 見出しを「中央・23px・太字900」にそろえる（マイページに合わせた）
| 画面 | 前 | 今 | ファイル |
|---|---|---|---|
| 学習（演習する） | 左寄せ・22px・800 | 中央・23px・900（PC 28px）。「演習する › 英語」の道しるべも中央 | `src/components/study-catalog.css`（末尾のブロック） |
| 設定 | 左寄せ、上に英字「MY ACCOUNT」。PCでは見出しとタブが横並び | 中央・23px・900、「MY ACCOUNT」は外した。とびら君は右端。PCも見出し→タブの2段 | `src/components/ProfileModal.tsx`（header）、`src/components/profile-settings.css`（末尾2ブロック） |
| 復習・記録 | 戻るボタンの横に左寄せ | 中央（戻るは左、メダル数は右） | `review-record.css`（末尾） |

**戻し方**：上の各 CSS の「2026-10-21」ブロックを消す。設定は `ProfileModal.tsx` の header を `<div className="mt-app-header-title"><p className="mt-kicker">MY ACCOUNT</p><h2>設定</h2></div><DoorMascot … className="w-auto ml-auto -my-2" />` に戻す。

---

## 2026-10-20 ホーム・対戦・ランキングの手直し（PR: fix/home-battle-ranking-polish）

前提：#55 で UI 刷新はいったん戻され、その後 #56〜#58 でホームの導線が整理された。今回はその **今の main の上に、指定の項目だけ** を入れた（ほかの見た目は今のまま）。

### ① ホーム：とびら君の足元の札
| 何を | どう変えた | ファイル |
|---|---|---|
| 「MY TOBIRA」 | 「マイとびら」に | `src/components/Home.tsx`（札の `<span className="my-tobira-tag">`）、`src/battle/ui/GrowthHomeStrip.tsx`（マイページ側の小見出し） |
| 名前とレベルの色が同化 | 名前＝紺の文字・クリーム地、レベル＝金のメダル（濃い茶の文字）に分けた。札の左右に小さな金の星 | `src/components/my-tobira-tag.css`（新規）／`Home.tsx` の先頭で読み込み |

**戻し方**：`Home.tsx` の札を `<span>MY TOBIRA <b>Lv.{…}</b></span>` に戻し、`import './my-tobira-tag.css';` の1行と `my-tobira-tag.css` を消す。`GrowthHomeStrip.tsx` の「マイとびら」を「MY TOBIRA」に戻す。

### ② 対戦：自分の名前
| 何を | どう変えた | ファイル |
|---|---|---|
| 自分のとびら君の名前がアカウント名（Google の名前＝本名のことが多い） | 設定したニックネームを出す | `src/battle/ui/BattleHome.tsx`（`resolveNickname()` を使う） |
| ニックネーム未設定のとき、対戦・ランキング・フレンドでアカウント名が送られていた | アカウント名には落とさず「名無しの化学者」に | `src/utils/leaderboard.ts` の `resolveNickname()` |

**戻し方**：`BattleHome.tsx` の `resolveNickname()` を `user.displayName || 'あなた'` に戻す。`leaderboard.ts` の最後の `return '名無しの化学者';` を `return sanitizeNickname(user.displayName || '', '名無しの化学者');` に戻す。
※ プライバシーのため、② は戻さないことをおすすめします。

### ③ 対戦：「正解で60点」などのタグ
| 何を | どう変えた | ファイル |
|---|---|---|
| 対戦画面の「正解で60点・速いほどボーナス・勝てば+10枚」 | 対戦画面から削除 | `src/battle/ui/BattleHome.tsx`（`arena-rule-chips` を削除） |
| 同じ3つ | 試合前のカウントダウン画面（紙と筆記用具を用意…）に小さな札で表示 | `src/battle/ui/BattleLiveParts.tsx`（`battle-ready-rules`）、`src/styles/game-dashboard.css`（末尾の札の見た目） |

**戻し方**：`BattleHome.tsx` に `<ul className="arena-rule-chips">…</ul>` を戻し（`Target`・`Coins` の import も）、`BattleLiveParts.tsx` の `battle-ready-rules` の1行と `game-dashboard.css` 末尾のブロックを消す。

### ④ ランキング（スマホの一覧を広く）
| 何を | どう変えた | ファイル |
|---|---|---|
| 下の「この範囲で○位・対戦へ」バー | 削除（対戦へは上の切替から行ける） | `src/components/Leaderboard.tsx`（`league-footer` を削除） |
| 見出しの「BATTLE LEAGUES」 | 削除 | `Leaderboard.tsx` |
| スマホの上の部品 | 見出し行と「ランキング／とびらバトル」の切替を1行に。自分のカード・シーズンの帯を低く。一覧の行も低く | `src/components/ranking.css`（末尾の「2026-10-20」のブロック） |
| 「もらえるもの」が左右に2回 | 右端の1回だけに | `Leaderboard.tsx`（`season-mine` はログイン時だけ）、`ranking.css` |

実測（一覧の高さ）：390×844 で約430px（約7人分）、320×568 で約180px（約3人分）。

### ⑤ ランキング：「ゴールドまで○○」のバー
| 何を | どう変えた | ファイル |
|---|---|---|
| 細い灰色のバー＋文字だけ | いまのリーグ色→次のリーグ色のグラデーション、両端にリーグ名の札、「あと○」を大きな数字で。つやの帯がゆっくり流れる（動きを減らす設定では止まる） | `Leaderboard.tsx`（`league-progress-rich` と `BAR_COLORS`）、`ranking.css` |

**④⑤の戻し方**：`ranking.css` の「2026-10-20」以降のブロックを消す。`Leaderboard.tsx` の `league-progress-rich` の部分を元の `<div className="league-progress"><progress …/><span>…まであと…</span></div>` に戻し、`BAR_COLORS` を消す。下のバーが必要なら `league-footer` を戻す。

### テスト
- `tests/homeBattleRankingPolish.test.ts`（新規）で上の①〜⑤が崩れていないかを確認。戻すときはこのテストも消す。
- `tests/revision.test.ts`：main で1件落ちていた（#58 でホームの「ランキングを見る」を外したのに、テストがホームにあることを求めていた）。入口が対戦画面の切替（`onRanking`）にあることを確かめる形に直した。
