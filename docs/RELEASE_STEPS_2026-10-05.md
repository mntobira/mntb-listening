# 公開・App Store 申請までの残り作業（2026-10-05 版）

このZIPに入っているコードだけでは終わらず、**運営者が自分のパソコンや各管理画面で行う作業**を、上から順にまとめました。
☐ を上から順に埋めていけば公開できます。各作業の「なぜ必要か」と「できたかの確かめ方」も書いています。

> 前提：Firebase は **リスニング専用プロジェクト**（例：`mntb-listening`）を使います。統合版（`mntb-4ef06`）には何もしないでください（アプリ側でも接続を拒否します）。
> 以下の `YOUR_PROJECT_ID` は、専用プロジェクトのIDに置き換えてください。

---

## 0. 全体の順番（ここだけ見ればよい）

| # | 作業 | どこで | 所要 |
|---|---|---|---|
| 1 | Firebase プロジェクトと `.env.local` | Firebase コンソール | 10分 |
| 2 | ログイン方法（Google・Apple） | Firebase コンソール／Apple Developer | 30分 |
| 3 | **Firestore ルールの反映（コピペ可）** | Firebase コンソール | 5分 |
| 4 | Firestore 索引（インデックス）の反映 | パソコン（コマンド） | 5分＋構築待ち |
| 5 | Cloud Functions（実績・掃除・リーグ） | パソコン（コマンド） | 15分 |
| 6 | Web 公開（Vercel） | Vercel | 10分 |
| 7 | 公開後の確認（2アカウント） | スマホ2台 | 20分 |
| 8 | App Store 申請（ネイティブ化を含む） | Mac・App Store Connect | 半日〜 |

---

## 1. Firebase プロジェクトと `.env.local`

☐ Firebase コンソール → プロジェクトを追加（すでにあれば飛ばす）
☐ プロジェクトの設定 → マイアプリ → **ウェブアプリを追加** → 表示された値を控える
☐ ZIP を展開したフォルダで `.env.example` を `.env.local` にコピーし、値を入れる

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_APP_ID=1:...:web:...
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_USE_EMULATORS=false
VITE_SITE_URL=https://（公開URL）      ← 理念ページ /message のシェア画像に使う
```

☐ 確かめる：`npm ci` → `npm run firebase:check`（設定の抜けがあれば日本語で表示される）

---

## 2. ログイン方法

☐ Authentication → Sign-in method → **Google を有効化**（サポートメールを選ぶ）
☐ Authentication → 設定 → **承認済みドメイン** に「公開ドメイン」と `localhost` を追加
☐ **Apple でサインイン**（App Store ガイドライン 4.8：Google ログインがあるアプリは必須）
  1. Apple Developer → Certificates, Identifiers & Profiles → **Services ID** を作成（Sign in with Apple を有効、Return URL に `https://YOUR_PROJECT_ID.firebaseapp.com/__/auth/handler`）
  2. **Key** を作成（Sign in with Apple にチェック）→ `.p8` をダウンロード、Key ID と Team ID を控える
  3. Firebase → Sign-in method → Apple を有効化 → Services ID・Team ID・Key ID・秘密鍵（.p8 の中身）を入力
☐ 確かめる：アプリの設定画面で「Apple でサインイン」を押し、ログインできる（未設定だと「準備中です」と出る）

---

## 3. Firestore ルールの反映（コピペで済む方法）

**なぜ必要か**：ルールが古い／未反映だと、対戦・フレンド・ランキング・お知らせが「許可されていません」で止まります。
アプリはルールで守られているので、**テストモード（全許可）のままの公開は絶対にしないでください**。

### 方法A：Firebase コンソールに貼り付ける（いちばん簡単）

1. ☐ ブラウザで開く：`https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore/rules`
   （まだ Firestore を作っていなければ「データベースの作成」→ ロケーション **asia-northeast1（東京）** → **本番環境モード** で作成）
2. ☐ ZIP の中の **`firestore.rules`** をテキストエディタで開き、**全文をコピー**（Ctrl+A → Ctrl+C／Mac は ⌘A → ⌘C）
   - 1行目が `rules_version = '2';`、最後の行が `}` であることを確認（2,126 行あります）
   - 同じ内容を `docs/firestore.rules.copy.txt` にも置いています（拡張子 .txt なのでスマホやメモ帳でも開けます）
3. ☐ コンソールのエディタの中身を**全部消して**、貼り付ける
4. ☐ 右上の **「公開」** を押す
5. ☐ 確かめる：エディタ上部に「公開しました」と出る。エラー（赤い行）が出たら、コピーが途中で切れています（最後の `}` まで入っているか確認）

> 反映すると本番のルールは**まるごと入れ替わります**。コンソールで手で直した部分があれば消えます（このZIPの内容が正）。

### 方法B：コマンドで反映する（索引も一緒に出せる）

```sh
npx firebase login
npx firebase deploy --only firestore:rules --project YOUR_PROJECT_ID
```

`.firebaserc` の既定は事故防止用の `demo-manatobi-listening` です。**`--project` は毎回必ず付けてください。**

### 反映前に手元で確かめたい場合（任意・Java 21 以上）

```sh
npm run test:rules        # 2026-10-05 時点：188件すべて合格
```

---

## 4. Firestore 索引（インデックス）

**なぜ必要か**：ランキング・対戦履歴・マッチングの並べ替えに使います。無いと該当画面が「索引がありません」で止まります。

☐ コマンドで反映（コンソールに貼り付ける方法はありません）

```sh
npx firebase deploy --only firestore:indexes --project YOUR_PROJECT_ID
```

☐ 確かめる：コンソール → Firestore → **インデックス** で、すべて「有効」になるまで待つ（数分〜数十分）

---

## 5. Cloud Functions

**なぜ必要か**：次の機能はサーバー側で動きます。
- `achievements`：公開プロフィールの「達成数・レベル」（ルールで本人も書き換えられないようにしているため、サーバーが書く）
- `sweepStaleBattle`：放置された対戦部屋・待ち行列を1時間ごとに掃除
- `manaClan` ほか：マナクラン・隔週リーグ（**今はアプリ側で「準備中」表示**。公開するまでは出さなくてよい）

☐ Firebase を **Blaze プラン**（従量課金）にする。**予算アラート**（例：月 1,000円）を必ず設定
☐ 反映する

```sh
npm ci --prefix functions
npm test --prefix functions
# マナクランをまだ公開しない場合（いまはこちら）
npx firebase deploy --only functions:achievements,functions:sweepStaleBattle --project YOUR_PROJECT_ID
```

☐ 確かめる：コンソール → Functions に `achievements` と `sweepStaleBattle` が出ている

### マナクラン・隔週リーグを公開するとき（あとで）

```sh
npx firebase functions:secrets:set MANA_CLAN_POWER_POLICY --project YOUR_PROJECT_ID   # 非公開の集計基準（JSON）を入力
npx firebase deploy --only functions,firestore:rules,firestore:indexes --project YOUR_PROJECT_ID
```

- Firestore に `league_control/config` 文書を作り、`enabled` を **boolean の true** にする（自動配布の開始）
- アプリ側：`src/config/features.ts` の `SOCIAL_FEATURES` を `{ classroom: …, manaClan: true }` にして再ビルド
- `firestore.rules` と Functions は**必ず同時に**出す（片方だけだと達成数・クランが反映されない）

---

## 6. Web 公開（Vercel）

☐ Vercel → New Project → このリポジトリを選ぶ（設定は `vercel.json` に入っている）
  - Build Command：`npm run build:vercel`（自動）／Output：`dist`（自動）
☐ Settings → Environment Variables に、`.env.local` と同じ `VITE_FIREBASE_*` と `VITE_SITE_URL` を入れる → **Redeploy**
☐ Firebase の「承認済みドメイン」に Vercel のドメインを追加（2. で未追加なら）
☐ 確かめる
  - `https://（公開URL）/` → タイトル画面が出る
  - `https://（公開URL）/message` → 理念ページ「学びの扉」だけが出る（宣伝用URL）
  - LINE／X に `/message` を貼り、シェア画像（青とオレンジの絵＋「学びの扉」）が出る

> CSP（`vercel.json`・`public/_headers`）の `connect-src` に `asia-northeast1-mntb-listening.cloudfunctions.net` が入っています。**プロジェクトIDが `mntb-listening` 以外なら、3か所（vercel.json・public/_headers・firebase.json）をあなたのIDに置き換えてください**。置き換えないと Functions への通信がブラウザに止められます。

---

## 7. 公開後の確認（2アカウント・2台）

☐ 2台でそれぞれ Google ログイン（1台は Apple でも）
☐ 合言葉で対戦：作成 → 参加 → カウントダウン → **START! と同時に曲のサビ**（風の列車／カナリアスキップのどちらか）→ 結果
☐ 全国マッチング：2人がマッチ → キャンセル → 再入室
☐ ランキングに自分が出る／フレンド申請が届く／ホームのお知らせ（ベル）が開く
☐ 設定 → アカウントを削除 → 消える（App Store 5.1.1(v)）
☐ iPhone の Safari で、バックグラウンドから戻っても音が止まったままにならない

---

## 8. App Store 申請

**大事**：このZIPは **Web アプリのソース**です。App Store に出すには、Mac で **ネイティブアプリに包む**作業が要ります（Capacitor を想定）。

### 8-1. ネイティブ化（Mac・Xcode）

```sh
npm i @capacitor/core @capacitor/ios && npm i -D @capacitor/cli
npx cap init "マナトビ" com.manatobi.listening --web-dir dist
npm run build && npx cap add ios && npx cap sync ios
npx cap open ios      # Xcode が開く → Signing で Team を選ぶ → Product › Archive
```

- **ログイン**：WKWebView では Google のポップアップログインが使えません → `@capacitor-firebase/authentication` などで **ネイティブの Google／Apple ログイン**に差し替える（`src/firebase.ts` のログイン処理）
- **4.2 最低限の機能**：Web をそのまま包んだだけだと却下されやすい → オフライン学習・触覚フィードバック（`@capacitor/haptics`）などを足す
- `Info.plist` に**使っていない権限**（カメラ・マイク・位置情報）の説明文を入れない

### 8-2. 広告を入れる場合（任意）

- `npm i @capacitor-community/admob` → `src/ads/rewardedAd.ts` のコメントの例どおり `registerRewardedAdProvider()` を `main.tsx` で1回呼ぶ
- 環境変数：`VITE_ADS_REWARDED=true`・`VITE_ADS_REWARDED_UNIT_ID=（本番ID）`（バナーは `VITE_ADS_BANNER=true`）
- **ATT（トラッキング許可）**の説明文、App Store Connect の「広告あり」申告、利用規約（`src/features/legal/legalText.ts`）の「動画で1回は広告ではありません」の書き換え

### 8-3. App Store Connect

☐ プライバシーポリシーを公開URLに置く（アプリ内の 設定 → その他・データ → プライバシー と同じ内容）
☐ 「App のプライバシー」：連絡先（メール・名前）／ユーザーID／使用状況データ（学習記録）／診断 ＝ 目的「アプリの機能」・トラッキングなし（広告を入れたら変わる）
☐ 年齢区分：ユーザー生成コンテンツあり（名前）・フィルタと通報あり
☐ レビュー用メモ：審査用のログイン方法と「対戦 → AI対戦 ならひとりで試せる」と書く
☐ スクリーンショット（6.7インチ・6.5インチ）
☐ 通報は24時間以内に確認（フィードバック管理画面の `[通報]`）

詳しい確認表は `docs/APP_STORE.md` にあります。

---

## 付録：このZIPで直した音（2026-10-05）

- 「カナリアスキップ」：以前は START! の時点でサビが**終わりかけていた**（原曲 32 小節目＝サビの最後の小節から始めていた）。
  原曲（OpenTracks 配布ファイル）を小節ごとに解析し、**1番サビ＝原曲 30.222 秒（17小節目）** から START! と重なるよう切り出し直した。
  音量 -20.3 LUFS は以前と同じ。ループは 114 小節で、継ぎ目の和音一致 0.998。
- iPhone で読み込み待ちのあいだ AudioContext が止まっていると、待った時間を数えられずサビが遅れることがあった → 壁時計で数えるように修正。
