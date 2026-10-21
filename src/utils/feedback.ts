/**
 * ===================================================================
 * ユーザーフィードバック収集ユーティリティ
 * ===================================================================
 *
 * 【収集先について】
 * 「メールアドレス（mntobira@gmail.com）に届くのか、Google スプレッドシート
 * に溜まるのか、まだ決めきれていない」という要件に対応するため、
 * “あとから切り替えられる” 3 系統の送信口（sink）を用意している。
 *
 *   ① Firestore（既定・常時ON）
 *      `feedback` コレクションに1件1ドキュメントで保存する。
 *      Firebase コンソールからそのまま閲覧・CSV エクスポートできるので、
 *      「とりあえず消えずに全部溜まる」土台として最優先で書き込む。
 *
 *   ② Google Apps Script Web アプリ（任意・環境変数で有効化）
 *      `VITE_FEEDBACK_WEBHOOK_URL` に GAS のデプロイURLを設定すると、
 *      同じ内容を GAS へ POST する。GAS 側（docs/feedback-gas.js）で
 *        - Google スプレッドシートへ1行追記
 *        - mntobira@gmail.com へメール通知
 *      の両方（または片方だけ）を行える。つまり「スプレッドシート」か
 *      「メール」かの判断を、アプリのコードを触らずに後から決められる。
 *
 *   ③ mailto: フォールバック（任意・最後の手段）
 *      ①②がどちらも失敗した／未設定のときに、本文を差し込んだ
 *      メール作成画面を開くリンクを提示する。宛先は FEEDBACK_EMAIL。
 *
 * さらに、通信失敗時は localStorage の再送キューに積み、次回起動時に
 * 自動で再送する（flushFeedbackQueue）。
 */

// タイムアウト付き fetch と 15秒のタイムアウト値は、ユーザー記録
// （userRegistry.ts）と同じ GAS へ同じ作法で送るため共通のものを使う
// （以前はこの2ファイルに同じ実装と同じ値が別々に書かれていた）。
import type { FeedbackInput, FeedbackResult } from './feedbackTypes';
import { readFeedbackQueue, writeFeedbackQueue, enqueueFeedback } from './feedbackQueue';
import { getFeedbackWebhookUrl, validateFeedback, buildFeedbackPayload } from './feedbackPayload';
import { activeSinks, deliver } from './feedbackTransports';
import { safeLocalStorage } from './safeLocalStorage';
export { diagnoseFeedbackRoutes } from './feedbackTransports';
export type { SinkDiagnosis } from './feedbackTransports';
export { FEEDBACK_WEBHOOK_OVERRIDE_KEY, DEFAULT_FEEDBACK_WEBHOOK_URL, isAllowedFeedbackWebhookUrl, getFeedbackWebhookUrl, setFeedbackWebhookUrl, getFeedbackEmail, describeFeedbackSinks, validateFeedback, buildFeedbackPayload, buildFeedbackMailto } from './feedbackPayload';
export { readFeedbackQueue, enqueueFeedback, pendingFeedbackCount } from './feedbackQueue';
export type { QueuedFeedback } from './feedbackQueue';

export { FEEDBACK_EMAIL, FEEDBACK_COLLECTION, FEEDBACK_QUEUE_KEY, FEEDBACK_QUEUE_LIMIT, FEEDBACK_MESSAGE_MAX, FEEDBACK_CATEGORY_LABELS, FEEDBACK_SCREEN_LABELS } from './feedbackTypes';
export type { FeedbackCategory, FeedbackScreen, FeedbackInput, FeedbackPayload, FeedbackSink, FeedbackResult, FeedbackValidation } from './feedbackTypes';

/**
 * 画面から呼ぶメインAPI。
 * 検証 → ペイロード生成 → 送信 を行い、UI 表示に必要な情報を返す。
 *
 * @throws 入力が不正な場合は Error（メッセージは日本語・そのまま表示可）
 */
const FEEDBACK_RATE_KEY = 'feedback_rate_v1';
const FEEDBACK_PER_MINUTE = 3;
const FEEDBACK_PER_DAY = 20;

/**
 * ★連続送信の歯止め（2026-10-04）★
 * ゲストでも送れる窓口なので、ボタンの連打・スクリプトでの大量投函を端末側で止める。
 * （本当の防御は firestore.rules の形式・サイズ検証。ここは通常利用を邪魔しない一次防御）
 * 送れるなら記録して true、上限なら false を返す。
 */
export function takeFeedbackSlot(now: number = Date.now()): boolean {
  try {
    const ls = safeLocalStorage();
    if (!ls) return true;
    // ★safeParseJson にしない（C-18）★ 壊れた記録は catch で「送ってよい」とし、記録を上書きしない（元のまま）
    const raw = JSON.parse(ls.getItem(FEEDBACK_RATE_KEY) || '[]');
    const recent = (Array.isArray(raw) ? raw : []).filter((t: unknown) => typeof t === 'number' && now - t < 86400000 && t <= now);
    if (recent.length >= FEEDBACK_PER_DAY) return false;
    if (recent.filter((t: number) => now - t < 60000).length >= FEEDBACK_PER_MINUTE) return false;
    recent.push(now);
    ls.setItem(FEEDBACK_RATE_KEY, JSON.stringify(recent));
    return true;
  } catch {
    return true;
  }
}

export async function submitFeedback(input: FeedbackInput): Promise<FeedbackResult> {
  const validation = validateFeedback(input);
  if (!validation.valid) {
    throw new Error(validation.errors.join('\n'));
  }
  if (!takeFeedbackSlot()) {
    throw new Error('送信が続いています。少し時間をおいてから、もう一度送ってください。');
  }
  const payload = buildFeedbackPayload(input);
  return deliver(payload, activeSinks());
}

/**
 * 溜まっている未送信フィードバックをまとめて再送する。
 * アプリ起動時とオンライン復帰時に呼ぶ（失敗したものはキューに残る）。
 *
 * 送信先ごとに未達を記録しているので、例えば「Firestore は既に成功、
 * スプレッドシートだけ未達」の件はスプレッドシートのみ再送し、
 * Firestore に同じ意見が2件登録されることはない。
 *
 * @returns 完全に送り切れてキューから消えた件数
 */
export async function flushFeedbackQueue(): Promise<number> {
  const queue = readFeedbackQueue();
  if (queue.length === 0) return 0;

  // deliver() が失敗時に enqueue するので、先にキューを空にしてから回す
  writeFeedbackQueue([]);

  let cleared = 0;
  for (const item of queue) {
    // webhook が未設定に戻された場合は webhook 待ちを打ち切る
    const targets = item.pending.filter(
      (sink) => sink !== 'webhook' || getFeedbackWebhookUrl(),
    );
    if (targets.length === 0) { cleared += 1; continue; }

    try {
      const result = await deliver(item.payload, targets);
      // 失敗分は deliver() が自動でキューに戻す
      if (!result.queued) cleared += 1;
    } catch {
      // 予期しない例外でも意見を捨てない
      enqueueFeedback(item.payload, targets);
    }
  }

  return cleared;
}
