# カサニマロさんへ（2026-10-19）Google Play のログインエラーと、今回の更新で端末側に必要な作業

コードで直せるところはこちらで直しました。残りは**ビルドする PC と Firebase / Play Console の画面でしかできない作業**です。
上から順にお願いします。

---

## A. Google Play 版のログインエラー（最優先）

### こちらで直したこと（このプルリクに入っています）
1. **`capacitor.config.ts` にログイン方法の指定が無かった** → 追加しました
   `FirebaseAuthentication: { skipNativeAuth: true, providers: ['google.com', 'apple.com'] }`
   これが無いと、プラグインは「Google sign-in provider is not enabled」でログインを断ります（iOS も同じ）。
2. **Android に Google ログインの部品が入っていなかった** → `android/variables.gradle` に `rgcfaIncludeGoogle = true` を追加しました
   （既定は false。false のままだと Android の Google ログインは必ず失敗します）
3. **エラーの原因が画面に出るようにしました。** 失敗すると、メッセージの最後にコードが付きます。
   | 表示 | 原因 | 直す場所 |
   |---|---|---|
   | `[NA-PROVIDER]` | providers の指定が無い | 1 で直した（`npx cap sync` が必要） |
   | `[NA-SDK]` | Google の部品が入っていない | 2 で直した（`npx cap sync`・作り直しが必要） |
   | `[NA-SHA1]` | **Firebase に SHA-1 が登録されていない** | 下の B-2 |
   | `[NA-NOCRED]` | 端末に Google アカウントが無い（SHA-1 未登録でも出る） | B-2 → それでも出れば端末側 |
   | `[NA-CONFIG]` | google-services.json / GoogleService-Info.plist が無い・古い | B-3 |
4. README のパッケージ名が `jp.manatobi.listening` になっていた（正しくは **`com.manatobi.listening`**）→ 直しました

### お願いしたいこと
**B-1. 最新を取ってきて、ネイティブへ反映**
```bash
git pull
npm install
npm run app:build        # = vite build && npx cap sync（設定・新しいプラグインが Android / iOS に入る）
```

**B-2. Firebase に SHA-1 / SHA-256 を3種類とも登録（Google Play のエラーはほぼこれです）**
Firebase コンソール → プロジェクトの設定 → マイアプリ → Android（`com.manatobi.listening`）→「フィンガープリントを追加」
| 種類 | 見る場所 |
|---|---|
| デバッグ鍵 | `cd android && ./gradlew signingReport` の `Variant: debug` |
| アップロード鍵 | 同じく `Variant: release`（または `keytool -list -v -keystore <upload の .jks>`） |
| **Play のアプリ署名鍵** | **Play Console → アプリ → テストとリリース → アプリの完全性 → アプリの署名 → 「アプリ署名鍵の証明書」** |

★ Play ストア・内部テストから入れたアプリは、Google が付け直した「アプリ署名鍵」で動きます。
　**この SHA-1 が Firebase に無いと、手元では動くのに Play から入れると失敗する**、というまさに今の症状になります。

**B-3. 設定ファイルを入れ直す**（SHA を追加したあとに必ず）
- Firebase から `google-services.json` をダウンロードし直して `android/app/` に上書き
- iOS も `GoogleService-Info.plist` を `ios/App/App/` に上書き（`REVERSED_CLIENT_ID` が `Info.plist` の URL スキームと同じか確認）

**B-4. Firebase の Authentication → ログイン方法で Google と Apple が「有効」か確認**

**B-5. 作り直して内部テストへ**
- Android Studio：Build → Generate Signed App Bundle → `versionCode` を1つ上げる → Play Console の内部テストへ
- 内部テストのアプリで Google ログイン → もし失敗したら、**画面のメッセージ（[NA-xxx] まで）をそのまま送ってください**

---

## B. 今回の更新で端末側に必要なこと

### 1. 通知（新機能：復習の日・連続日数）
- 新しいプラグイン `@capacitor/local-notifications` を入れました。**`npm install` → `npm run app:build` だけで入ります**
- Android の通知の許可（`POST_NOTIFICATIONS` など）はプラグインが自動で追加します。AndroidManifest は触らなくて大丈夫です
- 確認：設定 →「通知」→「学習のお知らせ」をオン → 許可ダイアログが出る → 許可
  （最初はオフ。オンにしたときだけ許可を求めます）
- iOS は Xcode の追加設定は不要です（ローカル通知なので Push の証明書も不要）

### 2. Firestore ルールの公開（必須：これをしないと「全部保存」が動きません）
今回、次の2つの置き場所を追加しました。ルールを公開しないと書き込みが拒否されます。
- `user_data/{uid}` … レベル・コイン・ガチャ・持ちもの・ミッション・単語の✓・学習時間・メモなど（本人だけ読み書き）
- `usage_sessions` … 使われ方の記録（匿名。運営だけ読める）
```bash
npx firebase deploy --only firestore:rules --project <本番のプロジェクトID>   # .firebaserc の既定は mntb-listening
```

### 3. 実機で確かめてほしいこと
- [ ] Play の内部テスト版で **Google ログインが通る**（いちばん大事）
- [ ] iPhone で Google / Apple ログインが通る
- [ ] 端末 A でガチャを引く → 端末 B で同じアカウントにログイン → コイン・持ちものが同じ
- [ ] 単語の ✓・学習時間・連続日数も端末 B に出る
- [ ] タイトルに「ゲストで試す」が無い。ログインに失敗したときだけ「ログインせずに、この端末だけで続ける」が出る
- [ ] 通知をオンにして、復習の日の 18:00 に通知が来る

---

## C. うまくいかないとき
画面のメッセージ（`[NA-xxx]` まで）と、`adb logcat | grep -i -E "nativeSignIn|FirebaseAuthentication|GoogleAuth"` の出力を送ってください。
原因の場所がすぐ分かるようにしてあります。
