# マナトビ リスニング — 独立コピー

> **公開・App Store 申請までの残り作業は [`docs/RELEASE_STEPS_2026-10-05.md`](docs/RELEASE_STEPS_2026-10-05.md) に上から順にまとめています。** Firestore ルールはコンソールに貼り付けるだけで反映できます（`firestore.rules` の全文、または同じ内容の `docs/firestore.rules.copy.txt`）。

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

### マナクラン・隔週リーグUR（追加サーバー設定）

フロントの公開だけではクラン・プレゼント配布は動きません。専用FirebaseのCloud Functions（Node 22、東京リージョン）を追加します。Blazeプランと課金設定が必要になる場合があります。運営者が利用料金・予算通知を確認してから実行してください。

```sh
npm ci --prefix functions
npm test --prefix functions
# Java 21以上。demoプロジェクトだけを使う安全性・結合テスト
npm run test:clans
# 非公開の本番集計ポリシーをSecret Managerへ設定（値をGit・画面・ログへ載せない）
npx firebase functions:secrets:set MANA_CLAN_POWER_POLICY --project mntb-listening
npx firebase deploy --only functions:mana-clan,firestore:rules,firestore:indexes --project mntb-listening
```

Functions反映・2アカウントでの動作確認後、Consoleで `league_control/config` ドキュメントの `enabled` を boolean の `true` に設定すると隔週配布を開始します。初期値では自動配布は停止します。初回期間は2026-10-05 00:00〜10-19 00:00（日本時間）。終了後01:00の定期処理で集計します。

- 個人：期間中の全国対人戦3試合以上を対象に、各リーグ上位10名（同順位を含む）。
- クラン：参加中の全国対人戦3試合以上を終えたメンバーで期間別集計、上位3組（同順位を含む）。現在の全メンバーによるクラン順位表とは集計対象が異なります。
- 報酬：限定UR「リーグ・オーロラフレーム」。マイページ → プレゼントで受け取れます。同一期間の再試行では重複配布しません。
- クラン交流戦はリーダーが申し込む英文法の1対1形式です。同時に複数人が戦う団体戦ではありません。
- 公開GitHubには本番の集計基準を置きません。`MANA_CLAN_POWER_POLICY` は運営者だけがアクセスするSecret ManagerのJSONで、`version:1` と非公開の `bands`（rating / power）の配列です。数値は本番用として別途非公開で設定してください。テストの人工値・旧試作の基準を本番へ流用しないでください。未設定・不正設定の場合、集計は停止します。ソースをサーバー側へ置くだけで計算基準の秘密が守られるとは扱いません。
- クランの計算・所属・招待・期間記録・報酬はサーバー専用です。これらのFirestoreルールを全許可へ変更しないでください。
- 既存レートは従来のクライアント採点方式を継承しています。相互証明の検査はありますが、完全なサーバー採点・不正対策ではありません。賞品の金銭的価値を伴う運用には別途設計が必要です。
- 大規模運用前に負荷検証が必要です。現実装は期間の報酬計画を1ドキュメントに保存するため、大量の同順位入賞では分割保存への改修が必要です。

ガチャは100枚で1回、1000枚で10＋1連。無料動画は**1日5回**として実装しています。既存のアプリ内応援動画で、広告SDK・広告収益への接続ではありません。コイン・所持品は端末内のアカウント別保存であり、クラウド同期や不正防止の境界ではありません。配布済みURはサーバーのプレゼント一覧から再取得できます。

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
