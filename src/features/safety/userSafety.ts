/**
 * ===================================================================
 * 通報・ブロック（App Store Review Guideline 1.2）
 * ===================================================================
 *
 * ■ 何ができるか
 *   - 通報 … ランキング・対戦相手・フレンドの「名前／アイコン」を運営へ知らせる。
 *            既存のフィードバック送信口（Firestore feedback / GAS）に載せるので、
 *            ★firestore.rules を変えずに★ 運営の管理画面へ届く。
 *   - ブロック … その人を「自分の画面から」消す。
 *            ・ランキングに出さない
 *            ・全国マッチでその人と組まない（待機票を候補から外す）
 *            ・フレンド申請を表示しない
 *            端末（localStorage）に保存する。サーバーに「誰が誰をブロックしたか」を
 *            残さないので、相手に知られることもない。
 *
 * ■ 端末保存にした理由
 *   ブロックの目的は「自分が見たくない相手を見ない」こと。サーバー側に置くと
 *   ルール変更（＝全利用者への影響）が要るうえ、ブロック関係という新しい個人データが
 *   生まれる。見えなくする処理は表示側で完結するので、端末保存で十分。
 */
import { submitFeedback } from '../../utils/feedback';
import { safeLocalStorage } from '../../utils/safeLocalStorage';

const BLOCK_KEY = 'mntb_blocked_users_v1';
const BLOCK_MAX = 500;

export interface BlockedUser {
  uid: string;
  /** 一覧で「誰をブロックしたか」を思い出せるように（表示用のみ） */
  nickname: string;
  blockedAt: number;
}

type Listener = () => void;
const listeners = new Set<Listener>();

// 中身が文字どおり同じだった取り出し口を safeLocalStorage に集約した（C-17）。呼び名は従来どおり storage()
const storage = safeLocalStorage;

export function listBlockedUsers(): BlockedUser[] {
  try {
    const raw = storage()?.getItem(BLOCK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is BlockedUser => !!x && typeof x.uid === 'string' && x.uid.length > 0)
      .map((x) => ({ uid: x.uid, nickname: String(x.nickname || '').slice(0, 40), blockedAt: Number(x.blockedAt) || 0 }));
  } catch {
    return [];
  }
}

function save(list: BlockedUser[]) {
  try {
    storage()?.setItem(BLOCK_KEY, JSON.stringify(list.slice(-BLOCK_MAX)));
  } catch {
    // 保存できなくても、この画面の間は反映される
  }
  listeners.forEach((fn) => fn());
}

export function isBlocked(uid: string | null | undefined): boolean {
  if (!uid) return false;
  return listBlockedUsers().some((b) => b.uid === uid);
}

/** 高速に何度も引く場所（ランキングの行ごとの判定など）用 */
export function blockedUidSet(): Set<string> {
  return new Set(listBlockedUsers().map((b) => b.uid));
}

export function blockUser(uid: string, nickname = ''): void {
  if (!uid) return;
  const list = listBlockedUsers().filter((b) => b.uid !== uid);
  list.push({ uid, nickname: nickname.slice(0, 40), blockedAt: Date.now() });
  save(list);
}

export function unblockUser(uid: string): void {
  save(listBlockedUsers().filter((b) => b.uid !== uid));
}

export function subscribeBlocked(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** 一覧からブロック中の人を除く（uid を持つ行なら何でも使える） */
export function withoutBlocked<T extends { uid?: string | null }>(rows: readonly T[]): T[] {
  const set = blockedUidSet();
  if (set.size === 0) return [...rows];
  return rows.filter((r) => !r.uid || !set.has(r.uid));
}

// -------------------------------------------------------------------
// 通報
// -------------------------------------------------------------------

export type ReportReason = 'name' | 'icon' | 'cheat' | 'harassment' | 'other';

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  name: '不適切な名前',
  icon: '不適切なアイコン画像',
  cheat: '不正・迷惑なプレイ',
  harassment: 'いやがらせ・つきまとい',
  other: 'その他',
};

export interface ReportTarget {
  uid: string;
  nickname: string;
  /** どこで見かけたか（ranking / battle / friend） */
  where: 'ranking' | 'battle' | 'friend';
}

/**
 * 運営へ通報する。フィードバックの仕組み（category='problem'）に
 * [通報] の印を付けて載せる。運営は管理画面で uid を見て対応する。
 */
export async function reportUser(target: ReportTarget, reason: ReportReason, detail = ''): Promise<boolean> {
  const message = [
    `[通報] ${REPORT_REASON_LABELS[reason]}`,
    `対象: ${target.nickname.slice(0, 40)}（uid: ${target.uid.slice(0, 128)}）`,
    `場所: ${target.where}`,
    detail.trim() ? `詳細: ${detail.trim().slice(0, 1500)}` : '',
  ].filter(Boolean).join('\n');
  try {
    const result = await submitFeedback({
      screen: 'other',
      category: 'problem',
      rating: 0,
      message,
      context: { kind: 'user_report', reason, targetUid: target.uid.slice(0, 128), where: target.where },
    });
    return result.ok;
  } catch {
    return false;
  }
}
