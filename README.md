# マナトビ リスニング — 独立コピー

> **音源：374 / 374 本が商用の新音源（ElevenLabs・運営者が有料契約中に直接生成、と申告）。** 状況は `COMMERCIAL_AUDIO_STATUS.json`、1本ずつの生成元と sha256 は `listening_audio_ledger.json`。旧音源が1本でも残っていると `npm run build` は止まります（`build:demo` は内部確認専用）。ElevenLabs の領収書3件を `license_evidence/` に同梱しています。公開前に運営者が契約条件（商用利用の可否）を最終確認してください。

統合版から複製した、リスニング専用のWebアプリ（React / Vite / Firebase）です。
元の統合版を削除・移動・上書きするZIPではありません。必ず別フォルダ・別リポジトリ・別の公開URLで使ってください。

## 同梱内容

- 第1問A〜第6問Bの9単元・135大問、収録済みの音源・図版
- 演習・採点・解説・スクリプト・和訳・聞き取りの決め手・復習ノート
- リスニング対戦254問：フレンド合言葉、全国マッチング、AI対戦
- サブ機能：英文法（問題演習＋対戦100問）、英単語・英熟語（対戦9541問・対戦専用）、ホームの「聞くための基礎」（単語カード・文法8ポイント）
- Googleログイン、学習記録、ランキング、フレンド、プロフィール
- マナコイン・ミッション・ガチャ・きせかえ・動画演出など既存の共通機能
- Firestoreルール／インデックス、依存関係lockfile、ビルド設定、テスト

公開科目・章カタログはリスニング＋英文法、対戦バンクはリスニング・英文法・英単語に限定しています（主役はリスニング）。
共通コンポーネントの参照を壊さないため、統合版由来の補助コード・教材・画像も一部残しています。最小容量化より、編集・ビルド可能な完全なコピーであることを優先しました。英語3種以外の対戦バンクは含みません。

含めないもの：ユーザー個人情報、クラウド上の利用者データ、アカウント、学習履歴、秘密鍵、実際の.env、node_modules、Git履歴、クラッシュダンプ、ビルド成果物。

## 1. 端末内で試す

Node.js 22以上を用意し、このREADMEのフォルダで実行します。

```sh
npm ci
npm run dev
```

表示されたURLを開き、「はじめる」からゲストを選びます。
Firebase未設定でも、演習・音声・解説・復習・AI対戦を端末内で試せます。設定前のGoogleログインは説明を表示して停止します。オンライン対戦のコードを削除したのではなく、接続先が未設定のためです。

設定前のビルド確認：

```sh
npm run build:demo
npm run preview -- --host 0.0.0.0 --port 4173
```

`build:demo` は公開設定のチェックを省略する検証用です。実際の公開では以下の `npm run build` を使います。
ブラウザの音声自動再生制限があるため、音が鳴らない場合は再生ボタンを押してください。

## 2. オンライン対戦の設定【公開前に必須】

### Firebaseは新規プロジェクトを使用

1. Firebase Consoleでリスニング専用プロジェクトを作成します。
2. Webアプリを登録し、Firebase設定値を取得します。
3. Authentication → Sign-in methodでGoogleを有効化し、サポートメールを指定します。
4. Authentication → Settings → Authorized domainsに、新しい公開ドメインとlocalhost（開発用）を追加します。
5. Cloud Firestoreを作成します。全許可のテストモードを公開に使わないでください。
6. `.env.example` を `.env.local` にコピーし、専用プロジェクトの値を入力します。

```sh
cp .env.example .env.local
```

必須：`VITE_FIREBASE_API_KEY` / `VITE_FIREBASE_AUTH_DOMAIN` / `VITE_FIREBASE_PROJECT_ID` / `VITE_FIREBASE_APP_ID`。
Storage BucketとSender IDもConsoleの値に合わせます。通常のauthDomainは `<PROJECT_ID>.firebaseapp.com` です。
これらはWebクライアント設定です。サービスアカウントの秘密鍵をフロント側へ置かないでください。データの保護は同梱のFirestoreルールで行います。

統合版への誤接続を防ぐため、旧プロジェクトIDへの接続を拒否します。
統合版とはユーザーUID・コイン・レート・フレンド・学習記録を共有しません。同じGoogleアカウントでも専用版では新規登録になります。既存データ移行は別作業です。
localStorageの一部キーは共通部品を引き継いでいるため、**同じオリジンのサブフォルダには公開せず、別ドメイン／別サブドメインを使ってください**。

### ルールとインデックスを反映

```sh
npx firebase login
npx firebase projects:list
# YOUR_LISTENING_PROJECT_IDを専用プロジェクトのIDへ置き換える
npx firebase deploy --only firestore:rules,firestore:indexes --project YOUR_LISTENING_PROJECT_ID
```

`.firebaserc` の既定値は誤配信防止用の `demo-manatobi-listening` です。
**deploy時は毎回 `--project` を明示し、統合版のフォルダでは実行しないでください。**
インデックス構築完了まで待ちます。battle_rules未登録の場合は同梱の既定ルールで動作します。

## 3. アプリ公開

```sh
npm run lint
npm test
npm run build
```

公開ビルドはFirebase設定不足・エミュレータ設定・統合版への接続先を検出すると停止します。
成果物は `dist/`。音源・画像・動画を削らず配信してください。

- Vercel：新しいプロジェクトとして登録。Install `npm ci` / Build `npm run build` / Output `dist`。環境変数を設定して再ビルドします。
- Firebase Hosting：`npx firebase deploy --only hosting --project YOUR_LISTENING_PROJECT_ID`。ルール・インデックスは前の手順で反映します。
- その他：全distを配信しSPA fallbackを設定。音源・画像の実ファイルをHTMLに書き換えないでください。

`vercel.json` と `public/_headers` にセキュリティヘッダーがあります。独自認証ドメインを使う場合はCSPのframe-srcも調整してください。HTTPSで配信します。
これはWebアプリのソースZIPであり、App Store／Google Play提出用のネイティブアプリではありません。

## 4. 公開前チェック

- 2アカウント・別ブラウザでGoogleログイン
- 合言葉作成 → 参加 → カウントダウン → 同じ問題と音源 → 結果
- 全国対戦の2人マッチング、キャンセル、再入室
- 手動／自動音声再生、問題切替・回答後の停止
- ランキング・フレンド・コイン・ガチャが専用Firebaseへ保存される
- スマホSafari／Chrome、バックグラウンド復帰、低速回線
- Firebase利用枠・課金通知、個人情報の取扱い、問い合わせ先
- 教材・画像・音源の公開権限、利用規約・プライバシーポリシー

認可ルールと採点は既存方式を継承しています。サーバー権威型の採点・不正対策への再設計は行っていません。
フィードバック管理者メールは既存の運営者設定を継承。変更する場合は `src/utils/feedback.ts` / `feedbackReply.ts` と `firestore.rules` の管理者条件を揃えます。

## 5. 開発・検証

```sh
npm test
npm run gen:index
npm run gen:battle-pool
# Java 21以上が必要
npm run test:rules
```

ブラウザテストには `npm install --no-save playwright` と `npx playwright install chromium` が必要です。preview起動後に `PRODUCTION_TEST_URL=http://localhost:4173 npm run test:browser` を実行します。
本番2人対戦・Safari実機はZIPを置くだけでは確認済みになりません。

`EXPORT_MANIFEST.json` は複製元コミットと元ファイルSHA-256です。`VALIDATION.txt` は今回の梱包時の検証記録です。
別の部屋へはZIP全体とこのREADMEを渡してください。統合版の部屋のファイルは置き換えないでください。
