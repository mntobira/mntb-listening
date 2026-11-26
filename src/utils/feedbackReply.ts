/**
 * ===================================================================
 * feedbackReply.ts ― フィードバックへの返信（運営 ⇄ 利用者）
 * ===================================================================
 *
 * ■ 何のためのファイルか
 *   「ご意見・ご要望」を送ってくれた人に、運営が返事を届けるための仕組み。
 *   これまでフィードバックは Firestore に届くだけの一方通行で、
 *   「メッセージをしてくれた人に返答するフォーム」が無かった。
 *
 * ■ 返信の届け方（2経路）
 *   ① ログインして投函した人（uid あり）
 *        feedback_replies コレクションに返信を書き、
 *        アプリ内の「運営からの返信」ボックスに届ける。
 *   ② ゲスト投函・連絡先メールを書いてくれた人
 *        アプリ内では届けられないので、管理画面が contactEmail 宛の
 *        メール作成リンク（mailto:）を生成する。送信は運営のメーラーで行う。
 *
 * ■ 権限（firestore.rules と対で管理）
 *   - フィードバック一覧の閲覧・status 更新・返信の作成 … 運営のみ
 *   - 返信の閲覧 … 宛先本人と運営のみ
 *   - 運営の判定はメールアドレス（確認済み）の完全一致。
 *     ここの FEEDBACK_ADMIN_EMAILS と firestore.rules の
 *     isFeedbackAdmin() は必ず同じ一覧に保つこと。
 */

import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from './firestoreMetered';
import type { User } from 'firebase/auth';
import { auth, db } from '../firebase';
import { FEEDBACK_COLLECTION, FEEDBACK_CATEGORY_LABELS, FEEDBACK_SCREEN_LABELS } from './feedback';
import type { FeedbackCategory, FeedbackScreen } from './feedback';

/** 返信コレクション名 */
export const FEEDBACK_REPLY_COLLECTION = 'feedback_replies';

/** 返信本文の上限（フィードバック本文と同じ2000文字） */
export const FEEDBACK_REPLY_MAX = 2000;

/**
 * 運営（フィードバック管理者）のメールアドレス一覧。
 * ★ firestore.rules の isFeedbackAdmin() と必ず同期させること ★
 */
export const FEEDBACK_ADMIN_EMAILS = ['mntobira@gmail.com'];

/** いまログインしているユーザーが運営かどうか */
export function isFeedbackAdmin(user: User | null = auth.currentUser): boolean {
  const email = user?.email?.toLowerCase() || '';
  if (!email) return false;
  // メール未確認のアカウントは弾く（ルール側の email_verified と対応）
  if (user && 'emailVerified' in user && !user.emailVerified) return false;
  return FEEDBACK_ADMIN_EMAILS.includes(email);
}

/** 管理画面に出すフィードバック1件 */
export interface AdminFeedbackItem {
  /** Firestore ドキュメントID（status 更新に使う） */
  docId: string;
  /** 投函時に採番したID（返信の feedbackId に使う） */
  id: string;
  screen: FeedbackScreen | string;
  category: FeedbackCategory | string;
  rating: number;
  message: string;
  uid: string | null;
  displayName: string | null;
  authEmail: string | null;
  contactEmail: string | null;
  createdAtIso: string | null;
  status: FeedbackStatus;
}

/** 対応状況。new（未対応）→ in_progress → replied / closed */
export type FeedbackStatus = 'new' | 'in_progress' | 'replied' | 'closed';

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: '未対応',
  in_progress: '対応中',
  replied: '返信済み',
  closed: '完了',
};

function toStatus(value: unknown): FeedbackStatus {
  return value === 'in_progress' || value === 'replied' || value === 'closed'
    ? value
    : 'new';
}

/**
 * フィードバック一覧を新しい順に取得する（運営専用）。
 * ルールで read が拒否された場合は permission-denied が投げられる。
 */
export async function fetchFeedbackList(max = 200): Promise<AdminFeedbackItem[]> {
  const q = query(
    collection(db, FEEDBACK_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      docId: d.id,
      id: String(data.id || d.id),
      screen: String(data.screen || 'other'),
      category: String(data.category || 'other'),
      rating: typeof data.rating === 'number' ? data.rating : 0,
      message: String(data.message || ''),
      uid: typeof data.uid === 'string' && data.uid ? data.uid : null,
      displayName: typeof data.displayName === 'string' ? data.displayName : null,
      authEmail: typeof data.authEmail === 'string' ? data.authEmail : null,
      contactEmail: typeof data.contactEmail === 'string' && data.contactEmail ? data.contactEmail : null,
      createdAtIso: typeof data.createdAtIso === 'string' ? data.createdAtIso : null,
      status: toStatus(data.status),
    };
  });
}

/** 対応状況を更新する（運営専用・status のみ変更可能） */
export async function updateFeedbackStatus(docId: string, status: FeedbackStatus): Promise<void> {
  await updateDoc(doc(db, FEEDBACK_COLLECTION, docId), { status });
}

/**
 * アプリ内返信を送る（運営専用）。
 * 宛先はログイン投函者（uid あり）のみ。送信後、元のフィードバックの
 * status を replied に更新する。
 */
export async function sendFeedbackReply(
  item: Pick<AdminFeedbackItem, 'docId' | 'id' | 'uid' | 'message'>,
  replyMessage: string,
): Promise<void> {
  const body = replyMessage.trim();
  if (!body) throw new Error('返信本文が空です');
  if (body.length > FEEDBACK_REPLY_MAX) {
    throw new Error(`返信は${FEEDBACK_REPLY_MAX}文字以内で入力してください`);
  }
  if (!item.uid) {
    throw new Error('この投稿はゲスト投函のため、アプリ内返信では届けられません（メールをご利用ください）');
  }
  await addDoc(collection(db, FEEDBACK_REPLY_COLLECTION), {
    feedbackId: item.id,
    toUid: item.uid,
    message: body,
    // 本人が「どの意見への返信か」思い出せるよう、元の本文の冒頭を添える
    feedbackSummary: String(item.message || '').slice(0, 120),
    adminName: '運営',
    createdAt: serverTimestamp(),
    createdAtIso: new Date().toISOString(),
    readAt: null,
  });
  await updateFeedbackStatus(item.docId, 'replied');
}

/**
 * contactEmail 宛のメール返信リンク（mailto:）を組み立てる。
 * ゲスト投函や「メールで返事がほしい」人への返信経路。
 */
export function buildReplyMailto(item: AdminFeedbackItem): string | null {
  const rawTo = (item.contactEmail || item.authEmail || '').trim();
  if (!rawTo || rawTo.length > 200 || !/^[^\s@\r\n<>]+@[^\s@\r\n<>]+\.[^\s@\r\n<>]+$/.test(rawTo)) return null;
  const to = rawTo;
  const categoryLabel = (FEEDBACK_CATEGORY_LABELS as Record<string, string>)[item.category] || item.category;
  const screenLabel = (FEEDBACK_SCREEN_LABELS as Record<string, string>)[item.screen] || item.screen;
  const subject = `【マナトビ】いただいたご意見への返信（${categoryLabel}）`;
  const bodyLines = [
    'マナトビをご利用いただきありがとうございます。',
    '以下のご意見をいただいた件についてご連絡いたします。',
    '',
    '──── いただいた内容 ────',
    `画面：${screenLabel} ／ 種類：${categoryLabel}`,
    item.message,
    '────────────────',
    '',
    '（ここに返信を書いてください）',
  ];
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
}

/** 利用者側の「運営からの返信」1件 */
export interface MyFeedbackReply {
  docId: string;
  feedbackId: string;
  message: string;
  feedbackSummary: string;
  adminName: string;
  createdAtIso: string | null;
  read: boolean;
}

/**
 * 自分宛の返信を新しい順に取得する（ログインユーザー用）。
 * インデックス不要にするため、並べ替えはクライアント側で行う。
 */
export async function fetchMyFeedbackReplies(): Promise<MyFeedbackReply[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const q = query(
    collection(db, FEEDBACK_REPLY_COLLECTION),
    where('toUid', '==', uid),
    limit(100),
  );
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      docId: d.id,
      feedbackId: String(data.feedbackId || ''),
      message: String(data.message || ''),
      feedbackSummary: String(data.feedbackSummary || ''),
      adminName: String(data.adminName || '運営'),
      createdAtIso: typeof data.createdAtIso === 'string' ? data.createdAtIso : null,
      read: data.readAt != null,
    };
  });
  return items.sort((a, b) => String(b.createdAtIso || '').localeCompare(String(a.createdAtIso || '')));
}

/** 返信を既読にする（宛先本人のみ・readAt だけ更新できる） */
export async function markReplyRead(docId: string): Promise<void> {
  await updateDoc(doc(db, FEEDBACK_REPLY_COLLECTION, docId), { readAt: serverTimestamp() });
}
