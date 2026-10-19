/**
 * 自分の対戦履歴の保存と読み出し。
 * 2026-10-15 のリファクタリングで battle.ts（1,420行）から機能ごとに切り出した。中身は元のまま。
 * 依存の向き: battleShared ← battleTransport / battleRuleOverrides ← battleFriendRoom / battleMatchmaking ← battleRoomActions
 * 呼び出し側は従来どおり './battle'（再公開）から import してよい。
 */
import { auth, db } from '../../firebase';
import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from '../../utils/firestoreMetered';
import type { Timestamp } from '../../utils/firestoreMetered';
import { COL_HISTORY } from './battleShared';

// ============================================================
// 履歴
// ============================================================

export interface BattleHistoryItem {
  roomId: string;
  subject: string;
  outcome: string;
  myScore: number;
  opponentScore: number;
  opponentNickname: string;
  ratingBefore: number;
  ratingAfter: number;
  /** この試合で間違えた出題ID（「間違えた問題だけ再対戦」用・最大30） */
  wrongIds?: string[];
  playedAt?: Timestamp | null;
}

/** 自分の履歴に1件書く（自分の下にしか書けない） */
export async function saveHistory(item: BattleHistoryItem): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  try {
    await setDoc(
      doc(db, COL_HISTORY, uid, 'items', item.roomId),
      { ...item, uid, playedAt: serverTimestamp() },
      { merge: true },
    );
  } catch {
    // 履歴は補助情報なので、失敗しても対戦結果には影響させない
  }
}

/** 自分の履歴を新しい順に読む */
export async function fetchHistory(max = 20): Promise<BattleHistoryItem[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  try {
    const snap = await getDocs(
      query(
        collection(db, COL_HISTORY, uid, 'items'),
        orderBy('playedAt', 'desc'),
        limit(max),
      ),
    );
    return snap.docs.map((d) => ({ roomId: d.id, ...(d.data() as object) } as BattleHistoryItem));
  } catch {
    return [];
  }
}
