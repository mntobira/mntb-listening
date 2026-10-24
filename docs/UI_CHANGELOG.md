# UI 変更記録（元に戻すとき用）

見た目を変えたら、ここに **いつ・どの画面・どのファイル・どう戻すか** を追記します（新しいものを上に）。
「イメージと違った」ときは、この記録の項目名を添えて「○○を戻して」と伝えてください。

---

## 2026-10-24 ガチャに LR（レジェンドレア）を追加＝共通テスト英語 予想問題 5回分（PR: feat/kyotsu-mock-lr）

| 何を | どう変えた | ファイル |
|---|---|---|
| レア度 | UR の上に **LR** を新設。提供割合 LR 1%（UR 5% は据え置き、N を 65→64%）。重複は100枚返還・かけら10 | `growthItems.ts`、`arenaEconomy.ts`、`gachaSets.ts`、`gachaFeatured.ts` |
| 確定演出 | 青→金→虹→UR の後に **深紅×金の「伝説降臨」段階**（星6つ）。演出全体は約5.9秒（安全装置8秒未満） | `gachaRevealSteps.ts`、`src/index.css` |
| レア度の札・結果画面 | LR の札（深紅の地・金の縁・王冠）、結果に「レジェンドレア！」、提供割合の表に LR 行 | `ui/index.tsx`、`system.css`、`tokens.css`、`game-extras.css`、`gacha.css`、`gacha/GachaResultStage.tsx`、`gacha/GachaCollectionModal.tsx`、`gacha/GachaSetsModal.tsx` |
| LR の景品 | 共通テスト 英語リーディング（80分・100点・大問8・44解答）／リスニング（30分・100点・大問6・37問）の**予想問題 各5回＝10冊**。本番と同じ白黒の問題冊子レイアウト（表紙の注意事項・四角囲みの解答番号・マークシート型解答欄）＋正解と配点＋全問解説。リスニングは全スクリプト＋全訳つき | `public/prints/print_lr_kyotsu_*.pdf`、`src/data/kyotsuMockPrints.ts`、`scripts/gacha-prints/kyotsu_mock/` |

**戻し方**：このPRを `git revert`。LR を引いた人の所持データ（`owned` の id）は残るが、古い版では該当アイテムが無いので表示されないだけで壊れない。

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
原因の修正と、マナコイン・XP（レベル）の同期の修正の詳細は `docs/FIX_2026-10-21_coin_sync_web_login.md`。

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
