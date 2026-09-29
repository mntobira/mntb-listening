# フレンド機能 設計ドキュメント

## 1. なぜ `Missing or insufficient permissions` が出ていたのか

### 原因A（本質的な原因）: フレンドコード検索がルール上成立しない

旧実装は次のクエリでコード検索していました。

```ts
getDocs(query(collection(db, 'friend_profiles'), where('friendCode', '==', code)))
```

Firestore のセキュリティルールは **クエリ結果を絞り込むフィルタではなく、「そのクエリが必ずルールを満たすと静的に証明できるか」を判定するゲート** です。したがって:

- `friend_profiles` のコレクションクエリを通すには「コレクション全体の read」を開放するしかない
- 旧ルールは `allow read: if isAuthenticated();` だったため、クエリは通るが
  **認証さえすれば全ユーザーのプロフィールを丸ごと吸い出せる** 状態だった
- 逆に「他人のプロフィールは読ませない」よう絞ると、コード検索クエリ自体が
  `permission-denied` になる

つまり「安全さ」と「コード検索」が旧設計では両立しません。

### 原因B: 承認時のバッチ書き込みが弾かれる／穴だった

旧ルール:

```js
allow create, update: if isAuthenticated()
  && (request.auth.uid == userId || request.resource.data.uid == request.auth.uid);
```

`request.resource.data.uid == request.auth.uid` は「自分の uid を名乗れば**誰の**
`friends` にも勝手に登録できる」ことを意味します。申請の実在を検証していませんでした。

加えて `writeBatch` は **1つでも失敗すると全体が permission-denied** になるため、
双方向書き込み + 申請削除のいずれかが引っかかると承認全体が落ちます。

### 原因C: 申請ドキュメントIDが自由だった

旧ルールは `requestId` を検証していなかったため、同じ相手への申請を無限に
作れました（スパム・重複の余地）。

---

## 2. 新しいデータモデル

```
friend_codes/{friendCode}              ← コード → uid の逆引きインデックス
  { uid, nickname, photoURL, updatedAt }
  - get のみ許可 / list 禁止
  - 「コードを知っている人だけ」が相手の uid を引ける入口

friend_profiles/{uid}                  ← 表示用プロフィール
  { uid, nickname, photoURL, friendCode, updatedAt }
  - 本人 / フレンド / 申請関係にある相手のみ get 可能、list 禁止

friend_requests/{toUid}_{fromUid}      ← 申請（1組につき必ず1件）
  { fromUid, toUid, fromNickname, fromPhotoURL, status, createdAt, updatedAt }
  status: "pending" | "accepted" | "rejected" | "canceled"
  - ドキュメントIDを固定 → 重複申請を構造的に防止
  - update は status と updatedAt のみ変更可（当事者・遷移元・遷移先を検証）
      受信者: pending -> accepted | rejected
      送信者: pending -> canceled
  - pending 以外からの遷移は禁止 → 承認済みを蒸し返せない

friends/{ownerUid}/items/{friendUid}   ← 確定した関係（双方向に1件ずつ）
  { uid, nickname, photoURL, addedAt }
  - 作成時にルールが friend_requests の実在を検証
```

### 設計のポイント

`friend_codes` を分離したことで、**コレクションを列挙させずに単一ドキュメントの
`get` で検索が成立** します。`allow list: if false` により総当りでコードを
収集することもできません（コード空間は `MNTB-XXXX-XXXX` = 36^8 ≈ 2.8兆通り）。

---

## 3. セキュリティ上の保証

ルールで担保している項目（すべて `tests/friends.rules.test.ts` で検証済み・32件）:

| 攻撃／誤操作 | 防御方法 |
|---|---|
| 全ユーザーのプロフィール収集 | `friend_profiles` / `friend_codes` の `list` を禁止 |
| 他人になりすまして申請 | `request.resource.data.fromUid == request.auth.uid` |
| 重複申請・申請スパム | ドキュメントIDを `${toUid}_${fromUid}` に固定 |
| 申請内容の改ざん | `friend_requests` の `update` を全面禁止 |
| 第三者が他人宛の申請を読む | `get, list` を当事者（`toUid` / `fromUid`）に限定 |
| 第三者が他人の申請を削除 | `delete` を当事者に限定 |
| **申請なしに他人の friends へ割り込む** | `create` 時に `requestExists()` で申請の実在を検証 |
| **他人のフレンドを勝手に消す** | `delete` を `userId == me \|\| friendUid == me` に限定 |
| 他人の交友関係を覗く | `friends/{userId}/items` の `read` を本人に限定 |
| 他人のフレンドコードを奪う | `update` 時に `resource.data.uid == request.auth.uid` |
| uid の差し替え | `request.resource.data.uid == friendUid` を強制 |
| 想定外フィールドの注入 | `keys().hasOnly([...])` でホワイトリスト化 |
| 自分自身をフレンド／申請 | `friendUid != userId`, `toUid != request.auth.uid` |
| **送信者による自己承認** | `accepted` への遷移は `toUid == request.auth.uid` のみ |
| 承認済み申請の蒸し返し | 遷移元を `resource.data.status == 'pending'` に限定 |
| 不正な status 値の書き込み | `status in ['accepted','rejected']` 等で列挙を強制 |
| status 更新にかこつけた uid すり替え | `diff().affectedKeys().hasOnly(['status','updatedAt'])` |
| 拒否・取消済み申請での関係作成 | `requestUsableForFriendship()` が `pending`/`accepted` のみ許可 |

### 承認フローの整合性

承認は `runTransaction` で以下を原子的に実行します。

1. 申請の存在と `status === 'pending'` を確認（二重承認・競合を防止）
2. 申請を `status: 'accepted'` に更新
3. 双方の `friends/{uid}/items/{friendUid}` を作成

トランザクション／バッチ内の `get()` は**コミット前の状態**を見るため、
(3) の評価時点では `status` はまだ `pending` に見えます。そのためルールの
`requestUsableForFriendship()` は `pending` と `accepted` の両方を
承認の根拠として許容し、`rejected` / `canceled` は除外しています。

### 「他人のフレンドを勝手に消せない」ことの根拠

```js
allow delete: if isAuthenticated()
  && (request.auth.uid == userId || request.auth.uid == friendUid);
```

- `friends/{ALICE}/items/{BOB}` を消せるのは ALICE 本人か BOB のみ
- CAROL は `userId` でも `friendUid` でもないため両方向とも削除不可
- フレンド解除は「双方向 delete」なので、当事者は相手側の1件も消せる必要があり、
  この2条件が必要十分

---

## 4. デプロイ手順

ルールを変更しただけでは反映されません。**必ずデプロイしてください。**

```bash
# ルールのみデプロイ
firebase deploy --only firestore:rules

# 反映確認（Firebase Console → Firestore → ルール のタイムスタンプ）
```

`Missing or insufficient permissions` が続く場合、まずここを確認します。

---

## 5. 既存ユーザーの移行

`friend_codes` は新設コレクションなので、**既存ユーザーは初回ログイン時に
`ensureFriendProfile()` が自動で登録** します（`FriendPanel` のマウント時に実行）。

一括で先に埋めたい場合は Admin SDK で:

```bash
# サービスアカウントキーを用意してから
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json \
  node scripts/backfill-friend-codes.mjs
```

---

## 6. ルールのテスト

```bash
npm run test:rules
```

Firestore エミュレータを起動し、`tests/friends.rules.test.ts` の32ケースを実行します。
（要: Java ランタイム）
