# 審査への回答資料：通報・ブロック機能の場所（Guideline 2.1 / 1.2）

作成日：2026-10-14 ／ 対象：Version 1.0 (14) ／ 審査端末：iPad Air 11-inch (M3)

審査で「設定に通報・ブロックの説明があるが、ランキング機能が見つからない」と指摘された。
**ブロック機能はアプリ内にある。コードの修正は不要。** 回答では「ランキングへの行き方」と「ブロックできる場所」を案内する。

---

## 1. App Store Connect にそのまま貼る返信文（英語）

> Hello,
>
> Thank you for your review. The Ranking feature and the report / block feature are both available in the app. Here is how to reach them on iPad.
>
> **How to open Ranking**
> 1. Launch the app and tap **"登録せずにゲストで試す" (Try as a guest)** on the first screen. No account is needed.
> 2. Close the "What's New" dialog if it appears ("閉じる" = Close).
> 3. On the Home screen, tap the **trophy icon labeled "ランキング" (Ranking)**. It is on the left side of the mascot (the door character) in the center of the screen.
> 4. The Ranking screen opens. It has three tabs: National ("全国"), Friends ("フレンド") and Clan ("マナクラン", coming soon).
>
> **How to report or block a user**
> 5. On the Ranking screen, every other user's row has a **"…" (more) button** to the right of the name.
> 6. Tap "…" to open a menu with **"運営に通報する" (Report to the operator)** and **"ブロックする" (Block)**.
>    - Report: choose a reason (inappropriate name / inappropriate icon / cheating / harassment / other), optionally add details, and send. The operator reviews reports within 24 hours.
>    - Block: the user is immediately hidden from the ranking, online matching and friend requests. The blocked user is not notified.
> 7. Blocked users are listed in **Settings ("設定", bottom tab bar) → "その他・データ" (Other / Data) → "ブロック中の人" (Blocked users)**, where they can be unblocked ("解除").
>
> The same "…" menu is also shown next to the opponent's name on the online battle result screen and next to each friend in the friend list.
>
> **Note for the review environment**
> The ranking lists only users who have played online battles. If the list happens to be empty when you test, play one online battle (the "対戦" (Battle) tab → "全国対戦" (National battle)) from two devices or accounts; the opponent then appears in the ranking with the "…" button. Screenshots of each step are attached.
>
> Thank you.

## 2. 日本語の要約（社内用）

| 手順 | 画面 | 操作 |
|---|---|---|
| 1 | 起動画面 | 「登録せずにゲストで試す」 |
| 2 | お知らせ | 「閉じる」 |
| 3 | ホーム | とびら君の左にある **トロフィーの「ランキング」** |
| 4 | ランキング | 他の人の行の右にある **「…」** |
| 5 | メニュー | 「運営に通報する」／「ブロックする」 |
| 6 | 設定 → その他・データ | 「ブロック中の人」に一覧・「解除」 |

- 「…」はランキングのほかに、**対戦結果の相手の名前の横**・**フレンド一覧**にも出る（`UserSafetyMenu`）。
- ブロックするとランキング・マッチング・フレンド申請から消える（端末に保存・相手に通知しない）。
- 自分自身・AI 相手の行には「…」を出さない。

## 3. 添付する画面写真（このフォルダ・iPad 縦 820×1180）

| ファイル | 内容 |
|---|---|
| `s1_ranking.png` | ランキングの行と、名前の右の「…」 |
| `s2_menu.png` | 「…」を押したメニュー（運営に通報する／ブロックする／閉じる） |
| `s3_report.png` | 通報の理由を選ぶ画面 |
| `s4_blocked.png` | ブロックした直後の案内 |
| `s5_settings.png` | 設定 → その他・データ →「ブロック中の人」と「解除」 |

※ s1〜s4 は本物の部品（`UserSafetyMenu` / `AccountSafetySection`）を描いた写真。サンドボックスは Firebase につながらないので、ランキングの行の名前（Sakura など）は見本。実機では実際の対戦者の名前が並ぶ。
※ 実機（iPad）で撮り直すなら：ホーム →「ランキング」→「…」→「ブロックする」→ 設定 → その他・データ。

## 4. 審査で見つけてもらえなかった理由（推測）と、次の提出で検討すること

- 下のタブバーは「ホーム／学習／対戦／ガチャ／マイページ／設定」で、**ランキングのタブが無い**。ランキングの入口は、ホームのマスコットの左にある小さなアイコン1つだけ。
- ランキングに載るのはオンライン対戦をした人だけなので、**審査環境では行が0件**だった可能性が高い。0件だと「…」も出ない。
- 今回はご指示どおりコードを直さず、案内で回答する。次の提出で通りやすくする案（今回は未実施）：
  - レビューメモにこの手順と「2台で1回対戦すると行が出る」を書いておく
  - 審査用の見本の行を1件出す。運営アカウントを固定でランキングに載せる方法など

## 5. 今回いっしょに直したもの（参考）

- 通報・ブロックのメニュー（`<dialog>`）が **iPad の左上に張り付いていた**。Tailwind の初期化で `margin:0` になり、中央に寄らなかったのが原因。`src/index.css` の `.user-safety-dialog, .legal-dialog` に `margin:auto` を足し、中央に出るようにした。これで審査員にもメニューが見つけやすくなる。
