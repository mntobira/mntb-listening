/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * フレンド機能（Google認証 + Firestore）
 *
 * ▼ コレクション設計
 *
 *   friend_codes/{friendCode}            ← コード → uid の逆引きインデックス
 *     { uid, nickname, photoURL, updatedAt }
 *     - get のみ許可 / list 禁止
 *     - 「コードを知っている人だけが相手の uid を引ける」ための入口。
 *       friend_profiles を where 検索する設計は、ルール上コレクション全体の
 *       read を開放することになり全ユーザーを吸い出せてしまうため採用しない。
 *
 *   friend_profiles/{uid}                ← 表示用プロフィール
 *     { uid, nickname, photoURL, friendCode, updatedAt }
 *     - 本人 / フレンド / 申請関係にある相手のみ get 可能、list 禁止
 *
 *   friend_requests/{toUid}_{fromUid}    ← 申請（1組につき必ず1件）
 *     { fromUid, toUid, fromNickname, fromPhotoURL, createdAt }
 *     - ドキュメントIDを固定することで重複申請を構造的に防ぐ
 *     - update 禁止。承認は「delete + friends 作成」で表現する
 *
 *   friends/{ownerUid}/items/{friendUid} ← 確定したフレンド関係（双方向に1件ずつ）
 *     { uid, nickname, photoURL, addedAt }
 *     - 作成時にルールが friend_requests の実在を検証するため、
 *       無関係な他人の一覧に割り込むことはできない
 */

import {
  limit,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Timestamp,
} from './firestoreMetered';
import { auth, db } from '../firebase';
import { resolveNickname } from './leaderboard';

export interface FriendProfile {
  uid: string;
  nickname: string;
  photoURL?: string;
  friendCode: string;
  updatedAt?: Timestamp | null;
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected' | 'canceled';

export interface FriendRequest {
  id: string;
  fromUid: string;
  toUid: string;
  fromNickname: string;
  fromPhotoURL?: string;
  status?: FriendRequestStatus;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export const FRIEND_CODE_PATTERN = /^MNTB-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

/** 申請ドキュメントIDは `${toUid}_${fromUid}` に固定（ルールと一致させる）。 */
function requestId(fromUid: string, toUid: string) {
  return `${toUid}_${fromUid}`;
}

/**
 * Firestore の権限エラーを、ユーザーに意味が伝わる日本語へ変換する。
 * 「Missing or insufficient permissions.」をそのまま出さないための共通処理。
 */
function toFriendlyError(error: any, fallback: string): Error {
  const code = error?.code as string | undefined;
  switch (code) {
    case 'permission-denied':
      return new Error(
        'この操作は許可されていません。本番の Firestore セキュリティルールが古いままです。管理者は Firebase Console（console.firebase.google.com → Firestore → ルール）でリポジトリの firestore.rules を貼り付けて「公開」するか、firebase deploy --only firestore:rules を実行してください。詳細は docs/DEPLOY_FIRESTORE_RULES.md を参照。'
      );
    case 'unauthenticated':
      return new Error('ログインの有効期限が切れています。もう一度Googleログインしてください。');
    case 'unavailable':
      return new Error('Firestore に接続できません。通信状態を確認してもう一度お試しください。');
    case 'failed-precondition':
      return new Error('オフラインのため実行できません。オンラインに戻ってからお試しください。');
    case 'not-found':
      return new Error('対象のデータが見つかりませんでした。画面を更新してお試しください。');
    case 'already-exists':
      return new Error('すでに登録済みです。画面を更新してご確認ください。');
    case 'aborted':
      return new Error('同時に別の操作が行われました。もう一度お試しください。');
    case 'deadline-exceeded':
      return new Error('処理がタイムアウトしました。もう一度お試しください。');
    case 'resource-exhausted':
      return new Error('アクセスが集中しています。しばらく待ってからお試しください。');
    default:
      return new Error(error?.message ? `${fallback}（${error.message}）` : fallback);
  }
}

/** Firestore の permission-denied かどうか（フォールバック判定用）。 */
function isPermissionDenied(error: any): boolean {
  return error?.code === 'permission-denied';
}

function makeFriendCode(uid: string, salt = 0) {
  // UIDそのものを露出せず、UID全体から安定したコードを生成する。
  // salt はハッシュ衝突時の再試行用（salt=0 なら常に同じコードになる）。
  let hashA = 2166136261 ^ salt;
  let hashB = (0x9e3779b9 ^ (salt * 2654435761)) >>> 0;
  for (const char of uid || 'mntb') {
    const value = char.charCodeAt(0);
    hashA = Math.imul(hashA ^ value, 16777619) >>> 0;
    hashB = Math.imul(hashB ^ value, 2246822519) >>> 0;
  }
  const base = `${hashA.toString(36)}${hashB.toString(36)}`.toUpperCase().replace(/[^A-Z0-9]/g, '0').padEnd(8, '0').slice(0, 8);
  return `MNTB-${base.slice(0, 4)}-${base.slice(4, 8)}`;
}

/** 入力されたコードを `MNTB-XXXX-XXXX` 形式へ正規化する。 */
export function normalizeFriendCode(input: string): string {
  const raw = (input || '').trim().toUpperCase().replace(/\s/g, '');
  const compact = raw.replace(/[^A-Z0-9]/g, '');
  if (compact.startsWith('MNTB') && compact.length === 12) {
    return `MNTB-${compact.slice(4, 8)}-${compact.slice(8, 12)}`;
  }
  return raw;
}

/**
 * 自分のプロフィールとフレンドコード逆引きインデックスを用意する。
 * 一度発行したコードは変更せず、共有済みコードを無効にしない。
 */
export async function ensureFriendProfile(): Promise<FriendProfile | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const nickname = resolveNickname();
  const photoURL = user.photoURL || '';

  // すでに発行済みのコードがあれば、それを維持する（共有済みコードを無効にしない）。
  let savedCode: string | null = null;
  try {
    const existing = await getDoc(doc(db, 'friend_profiles', user.uid));
    const value = existing.data()?.friendCode;
    if (typeof value === 'string' && FRIEND_CODE_PATTERN.test(value)) savedCode = value;
  } catch {
    // オフライン・初回でも決定的なコードを表示できる。
  }

  // 逆引きインデックスを確保する。ハッシュ衝突（別ユーザーが同じコードを
  // 使用中）の場合は salt を変えて再試行し、コードの一意性を保証する。
  let friendCode = savedCode ?? makeFriendCode(user.uid);
  if (!savedCode) {
    for (let salt = 0; salt < 8; salt += 1) {
      const candidate = makeFriendCode(user.uid, salt);
      try {
        const snap = await getDoc(doc(db, 'friend_codes', candidate));
        const ownerUid = snap.exists() ? (snap.data()?.uid as string | undefined) : undefined;
        if (!snap.exists() || ownerUid === user.uid) {
          friendCode = candidate;
          break;
        }
        // 他人が使用中 → 次の salt へ
      } catch {
        // 読み取り失敗時は既定コードのまま進める（表示は可能）。
        break;
      }
    }
  }

  const profile: FriendProfile = { uid: user.uid, nickname, photoURL, friendCode };

  // 保存に失敗してもコード自体は表示できるようにプロフィールを返す。
  try {
    await setDoc(
      doc(db, 'friend_profiles', user.uid),
      { ...profile, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (e) {
    console.error('フレンドプロフィールの保存に失敗しました（コードは利用できます）:', e);
  }

  // 逆引きインデックス。これが無いと相手からコード検索されない。
  try {
    await setDoc(
      doc(db, 'friend_codes', friendCode),
      { uid: user.uid, nickname, photoURL, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (e) {
    console.error('フレンドコードの登録に失敗しました:', e);
  }

  return profile;
}

/**
 * 【旧ルール互換】friend_profiles を friendCode で where 検索する。
 * 旧ルール（friend_profiles を認証済み全員が read 可能だった版）が本番に
 * 残っている環境では friend_codes コレクションが read/write とも拒否される
 * ため、この検索が唯一の到達経路になる。最新ルールではこのクエリ自体が
 * 拒否されるので、失敗時は null を返して呼び出し元に判断を委ねる。
 */
async function lookupByProfileQuery(code: string): Promise<{ uid: string; nickname: string; photoURL: string } | null> {
  const snaps = await getDocs(query(collection(db, 'friend_profiles'), where('friendCode', '==', code)));
  const hit = snaps.docs[0];
  if (!hit) return null;
  const data = hit.data() as { uid?: string; nickname?: string; photoURL?: string };
  if (typeof data.uid !== 'string' || data.uid.length === 0) return null;
  return {
    uid: data.uid,
    nickname: data.nickname || '名無しの化学者',
    photoURL: data.photoURL || '',
  };
}

/**
 * コードから相手を1件だけ引く（原則 get のみ。列挙はできない）。
 * 本番ルールが古い場合（friend_codes 未定義で get が拒否される／相手の
 * 逆引きインデックスが書き込めず存在しない場合）は、旧ルールで許可されて
 * いた friend_profiles の where 検索へフォールバックする。
 */
async function lookupByFriendCode(code: string): Promise<{ uid: string; nickname: string; photoURL: string } | null> {
  try {
    const snap = await getDoc(doc(db, 'friend_codes', code));
    if (snap.exists()) {
      const data = snap.data() as { uid?: string; nickname?: string; photoURL?: string };
      if (typeof data.uid === 'string' && data.uid.length > 0) {
        return {
          uid: data.uid,
          nickname: data.nickname || '名無しの化学者',
          photoURL: data.photoURL || '',
        };
      }
    }
    // インデックス未作成（相手が旧版クライアント／旧ルールで登録できなかった）
    // の可能性があるので、旧方式でも探す。最新ルールでは拒否されるが、
    // その場合は「見つからない」として扱えばよい。
    try {
      return await lookupByProfileQuery(code);
    } catch {
      return null;
    }
  } catch (e) {
    if (isPermissionDenied(e)) {
      // 旧ルールが本番に残っている環境: friend_codes 自体が読めない。
      try {
        return await lookupByProfileQuery(code);
      } catch (e2) {
        throw toFriendlyError(e2, 'フレンドコードの検索に失敗しました。');
      }
    }
    throw toFriendlyError(e, 'フレンドコードの検索に失敗しました。');
  }
}

/**
 * フレンド申請を送る。
 * 事前チェックはすべて「自分が読める範囲」だけで行い、権限エラーを起こさない。
 */
export async function sendFriendRequest(friendCode: string): Promise<string> {
  const me = await ensureFriendProfile();
  if (!me) throw new Error('Googleログインが必要です。');

  const code = normalizeFriendCode(friendCode);
  if (!code) throw new Error('フレンドコードを入力してください。');
  if (!FRIEND_CODE_PATTERN.test(code)) {
    throw new Error('フレンドコードの形式を確認してください。（例: MNTB-1QHZ-RF1K）');
  }
  if (code === me.friendCode) throw new Error('自分自身には申請できません。');

  const target = await lookupByFriendCode(code);
  if (!target) throw new Error('該当するフレンドコードが見つかりません。');
  if (target.uid === me.uid) throw new Error('自分自身には申請できません。');

  // すでにフレンドか？（自分の配下なので必ず読める）
  try {
    const friendship = await getDoc(doc(db, 'friends', me.uid, 'items', target.uid));
    if (friendship.exists()) throw new Error(`${target.nickname} さんとはすでにフレンドです。`);
  } catch (e: any) {
    if (e instanceof Error && e.message.includes('すでにフレンド')) throw e;
    throw toFriendlyError(e, 'フレンド状態の確認に失敗しました。');
  }

  // 相手から申請が届いていないか／自分が既に送っていないか。
  // 単一ドキュメントの get は「存在しない場合に resource.data が無く」
  // ルールが当事者判定できず permission-denied になるため、当事者を
  // where で明示したクエリで確認する（未申請時も安全に空結果になる）。
  try {
    const incoming = await getDocs(query(
      collection(db, 'friend_requests'),
      where('toUid', '==', me.uid),
      where('fromUid', '==', target.uid),
    ));
    const pendingIncoming = incoming.docs.find((d) => (d.data().status ?? 'pending') === 'pending');
    if (pendingIncoming) {
      throw new Error('相手から申請が届いています。「届いている申請」から承認してください。');
    }

    const outgoing = await getDocs(query(
      collection(db, 'friend_requests'),
      where('fromUid', '==', me.uid),
      where('toUid', '==', target.uid),
    ));
    const pendingOutgoing = outgoing.docs.find((d) => (d.data().status ?? 'pending') === 'pending');
    if (pendingOutgoing) return `${target.nickname} さんへ申請済みです。`;
  } catch (e: any) {
    if (e instanceof Error && e.message.includes('申請が届いています')) throw e;
    throw toFriendlyError(e, '申請状況の確認に失敗しました。');
  }

  const reqRef = doc(db, 'friend_requests', requestId(me.uid, target.uid));
  const basePayload = {
    fromUid: me.uid,
    toUid: target.uid,
    fromNickname: me.nickname,
    fromPhotoURL: me.photoURL || '',
    createdAt: serverTimestamp(),
  };
  try {
    // 最新ルール向け: status 状態機械つきの申請
    await setDoc(reqRef, {
      ...basePayload,
      status: 'pending' satisfies FriendRequestStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    if (!isPermissionDenied(e)) throw toFriendlyError(e, '申請の送信に失敗しました。');
    // 【旧ルール互換】本番ルールが status/updatedAt を知らない版
    // （keys().hasOnly が createdAt までしか許可しない）だと上の書き込みは
    // フィールド超過で拒否される。旧ルールが許可する形へ落として再試行する。
    // 読み取り側は status 欠落を 'pending' として扱うため互換性がある。
    try {
      await setDoc(reqRef, basePayload);
    } catch (e2) {
      throw toFriendlyError(e2, '申請の送信に失敗しました。');
    }
  }

  return `${target.nickname} さんへ申請しました。`;
}

export async function fetchFriendRequests(): Promise<FriendRequest[]> {
  const user = auth.currentUser;
  if (!user) return [];
  try {
    const snaps = await getDocs(query(collection(db, 'friend_requests'), where('toUid', '==', user.uid)));
    return snaps.docs
      .map((s) => ({ id: s.id, ...(s.data() as Omit<FriendRequest, 'id'>) }))
      .filter((r) => (r.status ?? 'pending') === 'pending');
  } catch (e) {
    // 権限エラー（ルール未デプロイなど）でもパネル全体を壊さないよう空配列で返す。
    console.error('フレンド申請の取得に失敗しました:', e);
    return [];
  }
}

/** 送信済み（自分発）の申請一覧。取り消し用。 */
export async function fetchSentFriendRequests(): Promise<FriendRequest[]> {
  const user = auth.currentUser;
  if (!user) return [];
  try {
    const snaps = await getDocs(query(collection(db, 'friend_requests'), where('fromUid', '==', user.uid)));
    return snaps.docs
      .map((s) => ({ id: s.id, ...(s.data() as Omit<FriendRequest, 'id'>) }))
      .filter((r) => (r.status ?? 'pending') === 'pending');
  } catch (e) {
    console.error('送信済み申請の取得に失敗しました:', e);
    return [];
  }
}

// 届いている（自分宛の）フレンド申請の件数。設定ボタンのバッジ表示などに使用。
export async function countIncomingFriendRequests(): Promise<number> {
  const user = auth.currentUser;
  if (!user) return 0;
  try {
    // ★件数バッジのための読み取りは上限つき★
    //   承認・拒否済みの申請も残るので、上限が無いと使い続けるほど
    //   1分ごとの読み取りが増える。バッジは「9+」で十分なので 50 件まで見る。
    const snaps = await getDocs(query(collection(db, 'friend_requests'), where('toUid', '==', user.uid), limit(50)));
    return snaps.docs.filter((s) => (s.data().status ?? 'pending') === 'pending').length;
  } catch {
    return 0;
  }
}

/**
 * 申請を承認する。
 *
 * トランザクションで
 *   (1) 申請の存在と status === 'pending' を確認（二重承認・競合を防ぐ）
 *   (2) 申請を status: 'accepted' に更新
 *   (3) 双方の friends/{uid}/items/{friendUid} を作成
 * を原子的に確定する。ルール側も「申請の実在」を検証するため、
 * 申請なしに他人の friends へ割り込むことはできない。
 */
export async function acceptFriendRequest(req: FriendRequest) {
  const me = await ensureFriendProfile();
  if (!me) throw new Error('Googleログインが必要です。');
  if (req.toUid !== me.uid) throw new Error('この申請を承認する権限がありません。');

  const reqRef = doc(db, 'friend_requests', requestId(req.fromUid, req.toUid));

  // 【旧ルール互換】承認 = 「双方の friends 作成 + 申請削除」を1バッチで行う。
  // status 更新を含まないため、update を一切許可しない旧ルールでも、
  // 申請の実在を検証する最新ルールでも成功する。
  const acceptWithLegacyBatch = async () => {
    const batch = writeBatch(db);
    batch.set(doc(db, 'friends', me.uid, 'items', req.fromUid), {
      uid: req.fromUid,
      nickname: req.fromNickname || '名無しの化学者',
      photoURL: req.fromPhotoURL || '',
      addedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'friends', req.fromUid, 'items', me.uid), {
      uid: me.uid,
      nickname: me.nickname,
      photoURL: me.photoURL || '',
      addedAt: serverTimestamp(),
    });
    batch.delete(reqRef);
    await batch.commit();
  };

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(reqRef);
      if (!snap.exists()) {
        throw new Error('この申請は取り消されたか、すでに処理済みです。');
      }
      const status = (snap.data().status ?? 'pending') as FriendRequestStatus;
      if (status !== 'pending') {
        throw new Error('この申請はすでに処理済みです。');
      }

      // (2) 申請を承認済みへ
      tx.update(reqRef, { status: 'accepted', updatedAt: serverTimestamp() });

      // (3) 双方向にフレンド関係を作成
      tx.set(doc(db, 'friends', me.uid, 'items', req.fromUid), {
        uid: req.fromUid,
        nickname: req.fromNickname || '名無しの化学者',
        photoURL: req.fromPhotoURL || '',
        addedAt: serverTimestamp(),
      });
      tx.set(doc(db, 'friends', req.fromUid, 'items', me.uid), {
        uid: me.uid,
        nickname: me.nickname,
        photoURL: me.photoURL || '',
        addedAt: serverTimestamp(),
      });
    });
  } catch (e: any) {
    // 業務ロジック由来のメッセージはそのまま見せる
    if (e instanceof Error && !('code' in e)) throw e;
    if (isPermissionDenied(e)) {
      // 旧ルール（friend_requests の update 全面禁止）環境へのフォールバック。
      try {
        await acceptWithLegacyBatch();
        return;
      } catch (e2) {
        throw toFriendlyError(e2, '承認に失敗しました。');
      }
    }
    throw toFriendlyError(e, '承認に失敗しました。');
  }

  // 承認済み申請の後片付け（失敗してもフレンド関係は成立しているので致命的でない）
  try {
    await deleteDoc(reqRef);
  } catch (e) {
    console.error('承認済み申請の削除に失敗しました（フレンド登録は完了しています）:', e);
  }
}

/** 申請を拒否する。status を rejected にしてから削除する。 */
export async function rejectFriendRequest(req: FriendRequest) {
  const user = auth.currentUser;
  if (!user || req.toUid !== user.uid) throw new Error('この申請を拒否する権限がありません。');
  const reqRef = doc(db, 'friend_requests', requestId(req.fromUid, req.toUid));
  try {
    // 監査可能性のため一度 rejected を記録してから削除する。
    await updateDoc(reqRef, { status: 'rejected', updatedAt: serverTimestamp() });
  } catch (e) {
    console.error('拒否ステータスの記録に失敗しました:', e);
  }
  try {
    await deleteDoc(reqRef);
  } catch (e) {
    throw toFriendlyError(e, '申請の拒否に失敗しました。');
  }
}

/** 自分が送った申請を取り消す。status を canceled にしてから削除する。 */
export async function cancelFriendRequest(req: FriendRequest) {
  const user = auth.currentUser;
  if (!user || req.fromUid !== user.uid) throw new Error('この申請を取り消す権限がありません。');
  const reqRef = doc(db, 'friend_requests', requestId(req.fromUid, req.toUid));
  try {
    await updateDoc(reqRef, { status: 'canceled', updatedAt: serverTimestamp() });
  } catch (e) {
    console.error('取消ステータスの記録に失敗しました:', e);
  }
  try {
    await deleteDoc(reqRef);
  } catch (e) {
    throw toFriendlyError(e, '申請の取り消しに失敗しました。');
  }
}

export async function fetchFriends(): Promise<Array<{ uid: string; nickname: string; photoURL?: string }>> {
  const user = auth.currentUser;
  if (!user) return [];
  try {
    const snaps = await getDocs(collection(db, 'friends', user.uid, 'items'));
    return snaps.docs.map((s) => s.data() as { uid: string; nickname: string; photoURL?: string });
  } catch (e) {
    console.error('フレンド一覧の取得に失敗しました:', e);
    return [];
  }
}

/**
 * フレンドを解除する。
 * 自分の配下と、相手の配下にある「自分」の2件だけを削除する。
 * ルールは delete を `userId == me || friendUid == me` に限定しているので、
 * 第三者同士の関係には手を出せない。
 */
export async function removeFriend(friendUid: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('Googleログインが必要です。');
  const batch = writeBatch(db);
  batch.delete(doc(db, 'friends', user.uid, 'items', friendUid));
  batch.delete(doc(db, 'friends', friendUid, 'items', user.uid));
  try {
    await batch.commit();
  } catch (e) {
    throw toFriendlyError(e, 'フレンドの解除に失敗しました。');
  }
}

export async function fetchFriendUids(includeMe = true): Promise<string[]> {
  const user = auth.currentUser;
  if (!user) return [];
  const friends = await fetchFriends();
  return [...new Set([...(includeMe ? [user.uid] : []), ...friends.map((friend) => friend.uid)])];
}

export interface FriendCompetitionEntry {
  uid: string;
  nickname: string;
  photoURL: string;
  score: number;
  sub: string;
}

/** フレンド全員（自分を含む）の合計・章別・期間別スコアを漏れなく集計する。 */
export async function fetchFriendCompetition(
  mode: 'total' | 'chapter' | 'period',
  options: { chapterId?: string; since?: Date | null } = {}
): Promise<FriendCompetitionEntry[]> {
  const uids = await fetchFriendUids(true);
  if (uids.length === 0) return [];

  if (mode === 'total' || mode === 'chapter') {
    const entries = await Promise.all(uids.map(async (uid) => {
      const ref = mode === 'total'
        ? doc(db, 'leaderboard_total', uid)
        : doc(db, 'leaderboard_chapter', `${options.chapterId}_${uid}`);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      const data = snap.data() as any;
      return {
        uid,
        nickname: data.nickname || '名無しの化学者',
        photoURL: data.photoURL || '',
        score: mode === 'total' ? (data.totalScore || 0) : (data.bestScore || 0),
        sub: mode === 'total'
          ? `${Object.keys(data.chapterScores || {}).length} 章クリア`
          : `正答率 ${Math.round((data.correctRate || 0) * 100)}% / ${data.timeUsedSec || 0}秒`,
      } satisfies FriendCompetitionEntry;
    }));
    return entries.filter((entry): entry is FriendCompetitionEntry => entry !== null).sort((a, b) => b.score - a.score);
  }

  // ★1人あたり読む件数に上限をかける★
  //   プレイ履歴（leaderboard_events）は遊ぶたびに増えるので、上限が無いと
  //   「フレンド20人 × 1人数千件」を開くたびに読むことになる。
  //   期間別ランキングは直近の記録で十分なので、1人 200 件までにする。
  const entries = await Promise.all(uids.map(async (uid) => {
    const snaps = await getDocs(query(collection(db, 'leaderboard_events'), where('uid', '==', uid), limit(200)));
    const events = snaps.docs.map((item) => item.data() as any).filter((event) => {
      if (!options.since) return true;
      const playedAt = event.playedAt?.toDate?.();
      return playedAt instanceof Date && playedAt >= options.since;
    });
    if (events.length === 0) return null;
    const best = events.reduce((current, event) => (event.score || 0) > (current.score || 0) ? event : current, events[0]);
    return {
      uid,
      nickname: best.nickname || '名無しの化学者',
      photoURL: best.photoURL || '',
      score: best.score || 0,
      sub: `${events.length} 回プレイ`,
    } satisfies FriendCompetitionEntry;
  }));
  return entries.filter((entry): entry is FriendCompetitionEntry => entry !== null).sort((a, b) => b.score - a.score);
}
