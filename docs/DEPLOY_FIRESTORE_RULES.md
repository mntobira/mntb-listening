# Firestore ルールのデプロイ手順（必読）

フレンド機能で「この操作は許可されていません」と表示される場合、
**本番 Firebase プロジェクトのセキュリティルールがこのリポジトリの
`firestore.rules` と一致していない**ことが原因です。

> 🔬 診断済み: 本番（mntb-4ef06）では `leaderboard_total`（ルール上は
> `allow read: if true` = 誰でも読める）への未認証読み取りすら
> `PERMISSION_DENIED` になります。これはフレンド機能追加前の古いルール
> （またはプロジェクト作成時のデフォルト「全拒否」ロックモード）が
> 本番に残っている決定的な証拠です。

コードをいくら修正してもルール側が拒否するため、
**以下のいずれかの方法でルールをデプロイしない限り解決しません。**

---

## 方法 1: Firebase Console から貼り付ける（最速・CLI 不要）⭐推奨

1. ブラウザで Firebase Console のルール画面を開く:
   <https://console.firebase.google.com/project/mntb-4ef06/firestore/rules>
   （プロジェクトのオーナー Google アカウントでログイン）

2. GitHub でリポジトリの最新 `firestore.rules` を開く:
   <https://github.com/2525Azarashi/ChemNote/blob/main/firestore.rules>
   → 「Raw」ボタン → 全文をコピー（Ctrl+A → Ctrl+C）

3. Console のエディタの内容を**全部削除**して、コピーした内容を貼り付ける。

4. 右上の「**公開**（Publish）」ボタンを押す。

5. 反映は通常 1 分以内。アプリを**リロード**してフレンド申請を再試行する。

### 動作確認（任意）

デプロイ後、ターミナルまたはブラウザで以下を開き、403 ではなく
`{ "documents": [...] }` か `{}` が返れば成功:

```
https://firestore.googleapis.com/v1/projects/mntb-4ef06/databases/(default)/documents/leaderboard_total?pageSize=1&key=<WebアプリのAPIキー>
```

---

## 方法 2: Firebase CLI でデプロイ

ローカル PC（このリポジトリを clone した状態）で:

```bash
npm install -g firebase-tools   # 未インストールの場合
firebase login                  # ブラウザが開き Google ログイン
firebase deploy --only firestore:rules --project mntb-4ef06
```

`Deploy complete!` と出れば成功です。

- ブラウザが開けないリモート環境では `firebase login --no-localhost` を使用。
- `Error: Failed to get Firebase project` が出る場合は、ログインした
  Google アカウントがプロジェクト mntb-4ef06 のオーナー／編集者か確認。

---

## 方法 3: GitHub Actions で自動デプロイ（今後のルール変更を自動反映）

`docs/deploy-firestore-rules.workflow.yml` にワークフローの雛形を同梱
しています（Bot の権限では `.github/workflows/` へ直接 push できない
ため docs に置いています）。有効化するには一度だけ設定が必要です:

0. GitHub の Web UI（Add file → Create new file）で
   `.github/workflows/deploy-firestore-rules.yml` を作成し、
   `docs/deploy-firestore-rules.workflow.yml` の内容を貼り付けてコミット。

1. サービスアカウントキーを作成:
   - <https://console.firebase.google.com/project/mntb-4ef06/settings/serviceaccounts/adminsdk>
   - 「新しい秘密鍵の生成」→ JSON ファイルがダウンロードされる

2. GitHub リポジトリにシークレットを登録:
   - リポジトリ → Settings → Secrets and variables → Actions → New repository secret
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Secret: ダウンロードした JSON の**中身全文**を貼り付け

3. Actions タブ → `Deploy Firestore Rules` → 「Run workflow」で手動実行
   （以降は `firestore.rules` を変更して main へマージするだけで自動実行）

> ⚠️ サービスアカウント JSON は強力な認証情報です。リポジトリに
> コミットせず、必ず GitHub Secrets のみに保存してください。
