# 塾向け（plan: 'juku'）— 何が無料で、何が塾向けか ／ 公開前チェック

最終更新: 2026-10-26

## 1. 方針（決めたこと）

| | 内容 |
|---|---|
| 生徒の学習機能 | **すべて無料のまま**（問題・音声・復習・対戦・ガチャ）。有料にしない |
| 塾向けの中身 | 先生側のクラス運営。ブラウザ（Web版）から使う |
| 新しく作った機能 | **課題配信**（締切つき・生徒ごとの状況）と **選んだ理由**（生徒が書いて送る→先生が読む）の1組だけ |
| 解放のしかた | `classrooms/{classId}.plan` を **運営が Firebase コンソールで `'juku'` に書き換える** |
| 試験導入 | 塾2〜3校は完全無料。課金の仕組みはあとで作る |
| やらないこと | 問題・音声・対戦・ガチャの有料化／アプリ内コードでの解放／塾専用アプリ／iOS アプリ内の価格表示・購入リンク |

## 2. 仕組み

- `classrooms.plan` は `'free' | 'juku'`。無ければ `'free'` 扱い。
  - 先生は作成時に `'free'` しか付けられず、作成後は変えられない（`firestore.rules` で禁止・テスト済み）。
  - コンソールの書き換えはルールを通らないので、運営だけが `'juku'` にできる。
- **課題** `class_assignments/{自動ID}` = `{ classId, teacherUid, title, chapterIds[1..10], dueAt, createdAt }`
  - 作れるのは担任だけ・`plan == 'juku'` のクラスだけ。読めるのは担任と在籍生徒。書き換え不可（消して作り直す）。
  - 生徒が「やったか」は課題に書かない。`study_progress.solved`（同意＝study_access がある先生だけ読める）から数える。
- **選んだ理由** `answer_reasons/{classId}_{uid}_{章}__{大問}` = `{ classId, uid, teacherUid, chapterId, questionId, qNo?, reason(≤200), correct?, updatedAt }`
  - 書けるのは在籍している生徒本人・`plan == 'juku'` のクラスだけ。本人が「先生に送る」を押したときだけ作られる。
  - 読めるのは本人と、`plan == 'juku'` のクラスの担任。消せるのは本人だけ。
- 画面
  - 先生：ダッシュボードに「課題・理由」タブ（`src/components/teacher/JukuTab.tsx`）。無料クラスでは「塾向けのクラスで使えます」の案内だけ。
  - 生徒：設定 → クラスの「参加中のクラス」に「先生からの課題」（`src/components/classroom/StudentAssignments.tsx`）。「解く」で演習へ。
  - 生徒：解説画面に「この答えを選んだ理由を先生に送る」の折りたたみ（`src/components/explanation/ReasonBox.tsx`）。塾クラスの生徒・その教科の問題のときだけ出る。
- 参加画面に「16歳未満は保護者の同意が必要」の案内を常に出す（`ClassPanel`）。

## 3. 試験導入の塾を `'juku'` にする手順（運営）

1. 先生にアプリ（Web）でクラスを作ってもらい、参加コードを聞く。
2. Firebase コンソール → Firestore → `class_codes/{参加コード}` を開き、`classId` を控える。
3. `classrooms/{classId}` を開き、フィールド `plan`（文字列）を追加して値を `juku` にする。
4. 先生にダッシュボードを開き直してもらう（「課題・理由」タブが使えるようになる）。

戻すときは `plan` を `free` にするか、フィールドを消す。

## 4. `SOCIAL_FEATURES.classroom` を true にする前のチェック（必須）

`src/config/features.ts` の `SOCIAL_FEATURES.classroom` は **false のまま**にしてある。
true にする前に、次をすべて確認する。

- [ ] 本番（`mntb-listening`）に最新の `firestore.rules` を反映した（手順は `docs/FIRESTORE_RULES_DEPLOY.md`）。
      このブランチで変えたルール：英文法の教科追加・先生の自分のクラス一覧（list）・`plan`・`class_assignments`・`answer_reasons`
- [ ] 反映後、Web 版で先生アカウントでクラスを作れる（英語リスニング・英文法の両方）
- [ ] 先生のダッシュボードにクラス一覧が出る（以前は list が禁止で、一覧の取得が失敗していた）
- [ ] 生徒アカウントで参加コードから参加できる
- [ ] `plan` を `juku` にしたクラスで、課題を出せる／生徒の画面に届く／理由を送れて先生が読める
- [ ] 無料クラスでは課題・理由が使えない（案内だけ出る）

ルールのテスト：`npm run test:rules`（`tests/classroom.rules.test.ts` を含む）

## 5. まだ決めていないこと

- 「準備中」の理由がルール以外にもあるか（features.ts のコメントは「Cloud Functions・ルールの公開準備がまだ」）。
  クラス機能自体は Cloud Functions を使っていない（すべてクライアント＋ルール）。
- 塾クラスの生徒の広告を消すか（広告収入は減る）。決まるまで広告はそのまま。
