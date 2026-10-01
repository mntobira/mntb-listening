/**
 * アカウント削除（App Store Review Guideline 5.1.1(v)）のデータ処理。
 * UI は AccountSafetySection.tsx。
 *
 * ★今の firestore.rules で本人が消せるもの★
 *   study_progress / battle_queue / class_members + study_access（退出）/
 *   friends（双方向）/ friend_requests / friend_profiles / friend_codes / battle_history
 * ★ルールで削除禁止のため残るもの★
 *   leaderboard_* / battle_ranking / app_users
 *   → 運営への削除依頼を自動送信し、Admin SDK で消してもらう。
 */
import { deleteUser, type User } from 'firebase/auth';
import { db } from '../../firebase';
import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from '../../utils/firestoreMetered';
import { fetchMyMemberships, leaveClassroom } from '../../utils/classroom';
import { STUDY_PROGRESS_COLLECTION } from '../../utils/studySync';
import { submitFeedback } from '../../utils/feedback';

async function quiet(p: Promise<unknown>): Promise<boolean> {
  try { await p; return true; } catch { return false; }
}

/** 本人が消せるクラウド上のデータをすべて消す（1つ失敗しても残りは続ける） */
export async function deleteMyCloudData(uid: string): Promise<void> {
  await quiet(deleteDoc(doc(db, STUDY_PROGRESS_COLLECTION, uid)));
  await quiet(deleteDoc(doc(db, 'battle_queue', uid)));

  try {
    for (const m of await fetchMyMemberships()) await quiet(leaveClassroom(m.classId));
  } catch { /* noop */ }

  try {
    const friends = await getDocs(collection(db, 'friends', uid, 'items'));
    for (const f of friends.docs) {
      await quiet(deleteDoc(f.ref));
      await quiet(deleteDoc(doc(db, 'friends', f.id, 'items', uid)));
    }
  } catch { /* noop */ }

  for (const field of ['fromUid', 'toUid'] as const) {
    try {
      const reqs = await getDocs(query(collection(db, 'friend_requests'), where(field, '==', uid)));
      for (const r of reqs.docs) await quiet(deleteDoc(r.ref));
    } catch { /* noop */ }
  }

  try {
    const profile = await getDoc(doc(db, 'friend_profiles', uid));
    const code = (profile.data() as { friendCode?: string } | undefined)?.friendCode;
    if (code) await quiet(deleteDoc(doc(db, 'friend_codes', code)));
  } catch { /* noop */ }
  await quiet(deleteDoc(doc(db, 'friend_profiles', uid)));

  // ランキングは削除できない（ルール）ので、名前とアイコンを外して個人が分からないようにする
  const ANON = '退会したユーザー';
  await quiet(setDoc(doc(db, 'leaderboard_total', uid), { nickname: ANON, photoURL: '', updatedAt: serverTimestamp() }, { merge: true }));
  try {
    const rows = await getDocs(query(collection(db, 'leaderboard_chapter'), where('uid', '==', uid)));
    for (const r of rows.docs) await quiet(setDoc(r.ref, { nickname: ANON, photoURL: '' }, { merge: true }));
  } catch { /* noop */ }

  try {
    const hist = await getDocs(collection(db, 'battle_history', uid, 'items'));
    for (const h of hist.docs) await quiet(deleteDoc(h.ref));
  } catch { /* noop */ }
}

/** この端末に残る、この人の記録を消す（キーに uid を含むもの＋アプリ共通の mntb_*） */
export function clearLocalData(uid: string, store: Storage | null = safeStorage()): number {
  if (!store) return 0;
  const keys: string[] = [];
  for (let i = 0; i < store.length; i += 1) {
    const k = store.key(i);
    if (k && (k.includes(uid) || k.startsWith('mntb_'))) keys.push(k);
  }
  keys.forEach((k) => store.removeItem(k));
  return keys.length;
}

function safeStorage(): Storage | null {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

export type DeleteOutcome = { ok: true } | { ok: false; reason: 'recent_login' | 'failed' };

/** アカウントを完全に削除する */
export async function deleteAccount(user: User): Promise<DeleteOutcome> {
  const uid = user.uid;
  try {
    await quiet(submitFeedback({
      screen: 'other', category: 'request', rating: 0,
      message: `[アカウント削除依頼] uid: ${uid}\nランキング（leaderboard_* / battle_ranking）と app_users の削除をお願いします。`,
      context: { kind: 'account_deletion', uid },
    }));
    await deleteMyCloudData(uid);
    await deleteUser(user);
    clearLocalData(uid);
    return { ok: true };
  } catch (e) {
    const code = String((e as { code?: string })?.code || '');
    return { ok: false, reason: code.includes('requires-recent-login') ? 'recent_login' : 'failed' };
  }
}
