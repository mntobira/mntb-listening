# まなとび アプリ版（Capacitor）キット — はじめに

このキットは **Web 版（GitHub main と同じコード）をそのまま iPhone / Android アプリにする** ための一式です。
画面のコードは作り直していません。Web 版と **同じ画面・同じ操作・同じデータ（Firebase）** で動きます。

- 元にしたコード：GitHub `mntobira/mntb-listening` main（PR #22 の内容まで）
- **GitHub のコードは変えていません。** アプリ用の追加分は、このキットの中にだけ入っています。
- 画面の見本：`docs/reference_screens/`（iPhone 13 サイズ・Safari と同じ描画エンジンで撮影）

---

## 1. Flutter 版との違い（判断材料）

| | Flutter 版 | Capacitor 版（このキット） |
|---|---|---|
| 画面の作り方 | Dart で全画面を作り直す | Web 版の画面をそのまま使う |
| Web 版との見た目の一致 | 作り直した分だけずれる（今のテスト版で差が大きい） | 同じ（`docs/reference_screens/11_app_vs_web_same.png`） |
| 新機能・修正の反映 | Web と Flutter の **2回** 作る | Web を直せば `npm run app:build` で **アプリにも入る** |
| 問題・音声・採点・対戦ロジック | Dart に移植が必要（ズレ・不具合の元） | Web 版と同じものがそのまま動く |
| Firebase のデータ | 作り方しだい（ルールの作り直しが要る場合も） | Web 版と完全に同じ（uid・ルールも同じ） |
| アプリ特有の作業 | 全部 | ログイン・アイコン・申請まわりだけ |

Flutter 自体が悪いわけではありません。**Web 版が完成しているアプリを「同じ見た目」で出す** なら、Capacitor が一番ズレません。

---

## 2. このキットで足したもの（Web 版の動きは変わりません）

| ファイル | 内容 |
|---|---|
| `capacitor.config.ts` | アプリID `jp.manatobi.listening`、アプリ名「まなとび」、表示するのは `dist/`（Web 版のビルド） |
| `ios/` `android/` | Xcode / Android Studio のプロジェクト（`npx cap add` で作成済み・`dist` 同期済み） |
| `src/native/platform.ts` | 「アプリの中か」を判定（Web では常に false） |
| `src/native/nativeAuth.ts` | **アプリ版のログイン**。Google はアプリ内の画面でのログインを禁止しているため、端末のログイン画面で認証してから Web 版と同じ Firebase にログインする（uid は Web と同じ） |
| `src/native/nativeShell.ts` | ステータスバー・起動画面・Android の戻るボタン |
| `src/utils/googleAuth.ts` | アプリの中のときだけ `nativeAuth` を使う分岐（Web は従来どおり） |
| `src/firebase.ts` | アプリの中のときだけ、ログイン情報の保存先を明示（iPhone で固まる対策） |
| `src/main.tsx` | アプリの中では Service Worker を使わない（古い画面が残る原因になるため） |
| `vite.config.ts` | Capacitor の部品を firebase と同じファイルにまとめる（分けるとビルドが止まる） |
| `package.json` | `@capacitor/*`・`@capacitor-firebase/authentication` と、`app:build` / `app:ios` / `app:android` |

確認済み（このキットの状態で）：
- `npx tsc --noEmit` 0件、`vite build` 成功、`npx cap sync` 成功（iOS・Android 両方）
- アプリの中を想定した表示（Safari エンジン・iPhone 13 サイズ）で、Web 版と同じ画面が出て、エラー 0、Service Worker なし
- Web として開いたときは今までどおり（Service Worker あり・同じ画面）

**まだ実機では動かしていません**（Mac / Xcode がこちらに無いため）。下の手順で実機確認してください。

---

## 2-2. 広告（2026-10-06 決定：リワード ＋ インタースティシャル。バナーは後回し）

| 広告 | どこに出るか | 状態 |
|---|---|---|
| リワード | ガチャの「動画で1回」。最後まで見ると1回引ける（途中で閉じたら回数は減らない） | 実装済み（AdMob） |
| インタースティシャル（全画面） | 対戦の「詳しい結果」→「ホーム／部屋に戻る」、演習の結果→次の行動 の**区切りだけ**。問題を解いている最中・解説・対戦中には出ない | 実装済み（AdMob） |
| バナー | 画面の下（320×50）。ONにすると下のナビが自動で上がり、画面は1画面に収まる。ホームはとびら君の吹き出しが1行になり、とびら君が隠れない（`src/ads/ads.css`、`docs/reference_screens/12_banner_preview.png`） | 枠は用意済み・**初回は OFF** |

出しすぎないための決まり（`.env` で変えられる）：インストール直後の2回は出さない／3回の区切りに1回／前回から3分以上あける／読み込めていなければ待たずに進む。
広告はアプリ版だけで、Web 版には出ません。利用規約・プライバシーポリシーの文面も、アプリ版のときだけ広告ありの文に切り替わります。

追加・変更したファイル：`src/ads/interstitialAd.ts`（新）、`src/ads/breakpoint.ts`（新）、`src/native/admob.ts`（新）、`src/ads/adConfig.ts`、`src/App.tsx`（演習の結果の次の行動）、`src/battle/ui/BattleResult.tsx`（対戦の結果のボタン）、`src/features/legal/legalText.ts`、`Info.plist`／`AndroidManifest.xml`（AdMob アプリID・ATT の説明文）。

### 広告ID管理一覧（本番用）
- **iOS App ID**: `ca-app-pub-9838177330528377~3742078035`
- **iOS バナー広告ID**: `ca-app-pub-9838177330528377/8564913897`
- **iOS インタースティシャル広告ID**: `ca-app-pub-9838177330528377/7060260538`
- **iOS リワード広告ID**: `ca-app-pub-9838177330528377/1014650376`（Phase 2予定）
- **Android**: ID共有待ち（現在はデモID）

**本番の前に必ず**：AdMob でアプリとユニットを作り、`Info.plist` の `GADApplicationIdentifier`・`AndroidManifest.xml` の `APPLICATION_ID`・`.env` の各 `UNIT_ID` を本番の値に、`VITE_ADS_TESTING=false` にする。


---

## 3. 手順（Mac で）

### 必要なもの
- Mac（Xcode 16.3 以上）、Node.js 20 以上
- Android は Android Studio
- Firebase プロジェクト（Web 版と同じもの）、Apple Developer アカウント

### ★前のバージョンが出るとき（古い画面・クレジットが無い など）
アプリの中身は `ios/App/App/public`（Android は `android/app/src/main/assets/public`）にコピーされたものが使われます。
前のキットのフォルダに上書きしたり、ビルドせずに Xcode を開くと、**前の画面のまま**になります。
1. 前のキットのフォルダは使わず、新しい ZIP を**別のフォルダ**に展開する
2. `npm install` → **`npm run app:ios`**（＝ビルド → iOS へコピー → Xcode が開く）
3. Xcode で **Product → Clean Build Folder**（⇧⌘K）
4. 端末（またはシミュレータ）から**前のアプリを削除**してから ▶
5. アプリの「使い方」を一番下までスクロール →「クレジット」の下に **ビルド 日時** が出る。ZIP と同じ日時なら最新です
   （この ZIP には、ビルド済みの `ios/App/App/public` も入れてあります。日時：2026-10-06 15:48 JST）

### 手順
1. このフォルダで `npm install`
2. `.env` を作る（Web 版と同じ `VITE_FIREBASE_*`。`.env.example` 参照）
3. **Firebase コンソールで iOS アプリを追加**（バンドルID `jp.manatobi.listening`）
   - `GoogleService-Info.plist` を `ios/App/App/` に置き、Xcode で App フォルダにドラッグして追加
   - `ios/App/App/Info.plist` の `com.googleusercontent.apps.REPLACE_WITH_REVERSED_CLIENT_ID` を、plist の `REVERSED_CLIENT_ID` の値に置き換える
4. **Firebase コンソールで Android アプリを追加**（パッケージ名 `jp.manatobi.listening`）
   - `google-services.json` を `android/app/` に置く
   - SHA-1（デバッグ用・Play のアプリ署名鍵の両方）を Firebase に登録
5. Firebase の Authentication で Google と Apple を有効にする（Web 版で済んでいれば不要）
6. Apple でサインイン：Xcode の Signing & Capabilities で「Sign in with Apple」を追加
7. `npm run app:ios` → Xcode が開く → 実機を選んで ▶（Android は `npm run app:android`）
8. TestFlight：Xcode の Product → Archive → Distribute App

### Web 版を直したあとの反映
Web 版のコードを更新したら、このキットの `src/` などを差し替えて **`npm run app:build`** を実行するだけです（`src/native/` と上の表のファイルは残す）。

---

## 4. 実機で確認すること
- [ ] 「使い方」の一番下に「クレジット（夕凪・風の列車・カナリアスキップ）」と「ビルド 日時」が出る
- [ ] 起動してタイトル→ホームが Web 版と同じ（`docs/reference_screens/` と見比べる）
- [ ] 画面の上（時計・ノッチ）と下（ホームバー）に、ボタンが隠れない
- [ ] Google ログイン → 端末のログイン画面が出て、戻るとログイン済み
- [ ] Apple でサインイン
- [ ] リスニングの音声が鳴る（最初の1回は画面をタップしてから鳴る仕様）
- [ ] 対戦（AI・フレンド・全国）、フレンドコードの長押しペースト
- [ ] アプリを閉じて開き直してもログインが残る
- [ ] Android の戻るボタンで前の画面に戻る
- [ ] 装備を付けて「外す」で外せる（マイページの部位一覧・持ちもの）
- [ ] ガチャの「動画で1回」でテスト広告が出て、最後まで見ると1回引ける／途中で閉じると回数が減らない
- [ ] 対戦・演習の結果から進むときに、たまにテスト広告（全画面）が出る。問題を解いている最中には出ない
- [ ] iPhone で最初に「トラッキングの許可」が出る（断っても使える）

---

## 5. 注意
- **AI の作業でこのキットを「Flutter に変換」しないでください。** 変換すると Web 版と別物になります。
- `ios/App/App/public` と `android/app/src/main/assets/public` は `npm run app:build` で毎回作り直されるので、直接いじらない。
- アプリIDを変える場合は `capacitor.config.ts` の `appId` と、Xcode / Android の ID、Firebase の登録を全部そろえる。
