/** 届かなかったフィードバックの再送キュー（端末内）。feedback.ts から分けた。中身は不変。 */
import { safeLocalStorage } from './safeLocalStorage';
import { FEEDBACK_QUEUE_KEY, FEEDBACK_QUEUE_LIMIT } from './feedbackTypes';
import type { FeedbackPayload, FeedbackSink } from './feedbackTypes';


// -------------------------------------------------------------------
// 再送キュー（localStorage）
// -------------------------------------------------------------------

/**
 * 使える localStorage を返す（使えなければ null）。
 * 実装は utils/safeLocalStorage.ts が唯一の定義。
 * 呼び出し側の書き方は今までどおり `readStorage()` のままにしている。
 */
export const readStorage = safeLocalStorage;

/**
 * キューに積まれた1件。
 * `pending` に「まだ届いていない送信先」だけを持たせることで、
 * 「Firestore は成功したがスプレッドシートだけ失敗した」場合に
 * スプレッドシートのみを再送でき、Firestore の二重登録を防げる。
 */
export interface QueuedFeedback {
  payload: FeedbackPayload;
  /** 未達の送信先 */
  pending: FeedbackSink[];
}

/** 再送キューを読み出す（旧フォーマットも読めるようにする） */
/** 端末に保存されていたキューの1件（新旧どちらの形式かは読んでみるまで分からない） */
export type QueuedFeedbackRaw = null | undefined | {
  payload?: unknown;
  pending?: unknown;
  id?: unknown;
  message?: unknown;
};

export function readFeedbackQueue(): QueuedFeedback[] {
  const ls = readStorage();
  if (!ls) return [];
  try {
    const raw = ls.getItem(FEEDBACK_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item: QueuedFeedbackRaw): QueuedFeedback | null => {
        if (!item || typeof item !== 'object') return null;
        // 新フォーマット { payload, pending }
        if (item.payload && Array.isArray(item.pending)) {
          return { payload: item.payload as FeedbackPayload, pending: item.pending as FeedbackSink[] };
        }
        // 旧フォーマット（ペイロードが直接入っている）→ 全送信先を未達として扱う
        if (typeof item.id === 'string' && typeof item.message === 'string') {
          return { payload: item as FeedbackPayload, pending: ['firestore', 'webhook'] };
        }
        return null;
      })
      .filter((item): item is QueuedFeedback => item !== null);
  } catch {
    return [];
  }
}

export function writeFeedbackQueue(items: QueuedFeedback[]): void {
  const ls = readStorage();
  if (!ls) return;
  try {
    // 古いものから捨てて上限を守る
    const trimmed = items.slice(-FEEDBACK_QUEUE_LIMIT);
    if (trimmed.length === 0) ls.removeItem(FEEDBACK_QUEUE_KEY);
    else ls.setItem(FEEDBACK_QUEUE_KEY, JSON.stringify(trimmed));
  } catch {
    // 容量超過などは黙って諦める（ユーザー操作を妨げない）
  }
}

/**
 * 未達の送信先があるフィードバックをキューへ退避する。
 * すでに同じIDが入っている場合は pending を統合する。
 */
export function enqueueFeedback(payload: FeedbackPayload, pending: FeedbackSink[]): void {
  if (pending.length === 0) return;
  const queue = readFeedbackQueue();
  const existing = queue.find((item) => item.payload.id === payload.id);
  if (existing) {
    existing.pending = Array.from(new Set([...existing.pending, ...pending]));
  } else {
    queue.push({ payload, pending: [...pending] });
  }
  writeFeedbackQueue(queue);
}

/** キューの件数（UI 表示用） */
export function pendingFeedbackCount(): number {
  return readFeedbackQueue().length;
}
