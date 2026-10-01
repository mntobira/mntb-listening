/**
 * ===================================================================
 * 全国対戦で「相手がいない／サーバーが使えない」ときの受け皿（2026-10-01）
 * ===================================================================
 *
 * ★この葉モジュールは Firebase も React も import しない★（テストで判定を確かめるため）
 *
 * ■ 何をするか
 *   全国対戦の相手さがしで、次のどれかになったら「AIプレイヤー」を相手にして、すぐ試合を始める。
 *     empty   … GHOST_AFTER_SEC 秒さがしても人が見つからない（夜中・人が少ない時間）
 *     server  … サーバーが使えない（無料枠の上限＝resource-exhausted、通信の失敗が続く）
 *     offline … 端末が圏外
 *   ★AI であることは隠さない★（見つかった画面・対戦中の名前・結果画面に「AI」と出す）。
 *   レートは動かない（AI 対戦と同じ扱い）。
 *
 * ■ 無料枠の上限を一度見たら、しばらくサーバーに行かない（QUOTA_COOLDOWN_MS）
 *   上限に達している間に待機票を書き続けると、失敗の書き込みでさらに枠を食う。
 *   端末に「◯時まで上限」と覚えておき、その間の全国対戦は最初から AI プレイヤーにする。
 */

/** 人を待つ秒数。これを過ぎたら AI プレイヤーが相手になる */
export const GHOST_AFTER_SEC = 20;
/** 無料枠の上限を見たあと、サーバーに行かない時間 */
export const QUOTA_COOLDOWN_MS = 15 * 60_000;
/** 待機票の有効期限。これより古い票は「もういない人」として相手にしない */
export const QUEUE_STALE_MS = 3 * 60_000;
/** 相手さがしで失敗が何回続いたらサーバー不調とみなすか */
export const SERVER_FAILURES_LIMIT = 3;

export type GhostReason = 'empty' | 'server' | 'offline';

export function isQuotaError(code: unknown): boolean {
  return String(code || '') === 'resource-exhausted';
}

/**
 * いま AI プレイヤーに切り替えるべきか。null ならまだ人を待つ。
 * ★サーバーの不調は時間を待たずに切り替える★（待っても人は来ない）
 */
export function fallbackDecision(p: {
  elapsedSec: number;
  failures: number;
  lastErrorCode?: string | null;
  online: boolean;
  quotaBlocked: boolean;
}): GhostReason | null {
  if (!p.online) return 'offline';
  if (p.quotaBlocked || isQuotaError(p.lastErrorCode)) return 'server';
  if (p.failures >= SERVER_FAILURES_LIMIT) return 'server';
  if (p.elapsedSec >= GHOST_AFTER_SEC) return 'empty';
  return null;
}

/** 待機票が古すぎるか（作成時刻がまだ入っていない＝書き込み直後の票は新しい扱い） */
export function isStaleQueueTicket(createdAtMs: number | null, nowMs: number): boolean {
  if (createdAtMs == null || !Number.isFinite(createdAtMs) || createdAtMs <= 0) return false;
  return nowMs - createdAtMs > QUEUE_STALE_MS;
}

/** 無料枠の上限が「いつまで」続くとみなすか（端末に覚えておく値の読み書き） */
export function quotaBlockedUntil(storedValue: string | null, nowMs: number): number | null {
  const until = Number(storedValue);
  if (!Number.isFinite(until) || until <= nowMs) return null;
  // 時計がおかしくて極端に先の値が入っていたら捨てる
  if (until - nowMs > QUOTA_COOLDOWN_MS * 2) return null;
  return until;
}
