# Firestore ルールの反映手順（管理者向け）

最終更新: 2026-10-01

アプリのお知らせ（ホームのベル）・対戦・フレンド・ランキングは、Firestore の
**セキュリティルール**（`firestore.rules`）と **索引**（`firestore.indexes.json`）が
本番プロジェクトに反映されていないと正しく動きません。

ルールが古いままだと、お知らせを開いたときに
「お知らせを読めるようにする Firestore のルールが未反映です」と表示されます。

> このファイルは手順書です。反映は **管理者が自分のパソコンで** 行います。
> 開発用の作業環境（サンドボックス）からは反映しません。

---

## 0. 先に知っておくこと

| 注意 | 内容 |
|---|---|
| **まるごと置き換わる** | 反映すると本番のルールは `firestore.rules` の内容に**全部入れ替わります**。Firebase コンソールで手で直した部分があれば消えます。 |
| **`--project` を必ず付ける** | `.firebaserc` の既定は `demo-manatobi-listening`（ローカル試験用）です。付け忘れると正しいプロジェクトに届きません。 |
| **統合版には反映しない** | 統合版の Firebase（`mntb-4ef06`）は対象外です。チェック用スクリプトもアプリも、このIDだと止まるようになっています。 |
| **必要な権限** | 反映するアカウントに、そのプロジェクトの「オーナー」または「編集者」の権限が必要です。 |

関係するファイル:

| ファイル | 役割 |
|---|---|
| `firestore.rules` | セキュリティルール本体（`app_notices` のお知らせ読み取りもここ） |
| `firestore.indexes.json` | 索引（ランキング・対戦の並べ替えに使う） |
| `firebase.json` | 上の2つの場所の指定 |
| `.firebaserc` | 既定のプロジェクト（ローカル試験用のまま。触らない） |
| `scripts/check-firebase-setup.mjs` | 反映前の設定チェック（`npm run firebase:check`） |

---

## 1. 準備（初回だけ）

必要なもの: Node.js 20 以上、Git。

```bash
git clone https://github.com/mntobira/mntb-listening.git   # すでにあれば git pull
cd mntb-listening
git checkout main && git pull                               # 最新のルールを使う
npm install                                                 # firebase-tools もここで入ります
```

---

## 2. 接続先の設定を確認する

リポジトリ直下に `.env.local` を作り（`.env.example` をコピー）、
Firebase コンソールの値を入れます。
場所: **プロジェクトの設定 → マイアプリ → SDK の設定と構成**

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=<プロジェクトID>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<プロジェクトID>
VITE_FIREBASE_APP_ID=1:...:web:...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_USE_EMULATORS=false
```

読み取りだけのチェックを実行します（何も書き換えません）。

```bash
npm run firebase:check
```

- `×` が出たら … 表示どおりに `.env.local` を直して、もう一度実行。
- `✓` が出たら … 反映に使うコマンドが表示されます。次へ進みます。

---

## 3. 今のルールを控える（おすすめ）

Firebase コンソール → **Firestore Database → ルール** を開き、
今のルールを全部コピーしてメモ帳などに保存します。
何かあったときは、これを貼り直して「公開」すればすぐ元に戻せます。

---

## 4. （任意）反映前にローカルで試す

Java 11 以上が入っていれば、エミュレーターでルールのテストを流せます。

```bash
npm run test:rules
```

全部通れば、ルールの文法と主な読み書きの可否は問題ありません。

---

## 5. ログインして反映する

```bash
npx firebase login            # ブラウザが開く。プロジェクトの管理者アカウントでログイン
npx firebase projects:list    # 反映先のプロジェクトIDが一覧にあるか確認
```

### ルールだけ反映する

```bash
npx firebase deploy --only firestore:rules --project <プロジェクトID>
```

### ルールと索引を一緒に反映する（初回・索引を変えたとき）

```bash
npx firebase deploy --only firestore:rules,firestore:indexes --project <プロジェクトID>
```

最後に `✔  Deploy complete!` と出れば成功です。

---

## 6. 反映できたか確認する

1. **コンソール**: Firestore Database → ルール の「公開日時」が今になっていて、
   次の部分が入っていること。
   ```
   match /app_notices/{noticeId} {
     allow read: if true;
     allow write: if false;
   }
   ```
2. **索引**（一緒に反映した場合）: Firestore Database → インデックス の状態が
   すべて「有効」になるまで数分待つ。
3. **アプリ**:
   - ホームのベル（お知らせ）を開き、「Firestore のルールが未反映です」が出ないこと。
   - 対戦メニュー →「その他」→「つながらないとき（通信チェック）」で全部 ○ になること。
     △ や × が出たら「運営に送る内容をコピー」で原因の文をコピーできます。

### Firebase コンソールで一緒に確認しておくこと

- [ ] Authentication → ログイン方法 → Google を有効
- [ ] Authentication → 設定 → 承認済みドメイン に、公開URLのドメインと `localhost`
- [ ] Firestore Database を「本番モード」で作成済み（テストモードで公開しない）

---

## 7. うまくいかないとき

| 症状 | 原因と対処 |
|---|---|
| `Permission denied` / `403` | アカウントに権限がない。`npx firebase login --reauth` で権限のあるアカウントに入り直す |
| `Invalid project id` | `--project` のIDの打ち間違い。`projects:list` に出るIDをそのまま使う |
| 反映先が `demo-manatobi-listening` になった | `--project` の付け忘れ。付けて再実行 |
| ルールの文法エラーで止まる | 表示された行番号を開発側に伝える（こちらで直します） |
| 索引が「作成中」のまま | 数分〜十数分かかることがある。終わるまでランキングが空になることがある |
| 反映後にアプリがおかしい | 手順3で控えたルールをコンソールに貼って「公開」すれば元に戻る |

---

## 8. 次に反映が必要になるとき

`firestore.rules` か `firestore.indexes.json` が変わったプルリクエストをマージしたら、
手順 5〜6 をもう一度行います（手順 1〜2 は初回だけ）。
