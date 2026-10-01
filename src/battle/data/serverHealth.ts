/**
 * サーバー（Firestore）の調子を端末に覚えておく（2026-10-01）。
 *   ・無料枠の上限（resource-exhausted）を見たら、15分は全国対戦でサーバーに行かない
 *   ・最後に読めた自分のレートを覚えておく（サーバーが使えないときの AI プレイヤーの強さに使う）
 * 判定そのものは core/matchFallback.ts（純関数）。ここは localStorage の読み書きだけ。
 */
import { QUOTA_COOLDOWN_MS, isQuotaError, quotaBlockedUntil } from '../core/matchFallback';

const QUOTA_KEY = 'battle_quota_blocked_until';
const RATING_KEY = 'battle_last_rating';

function read(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function write(key: string, value: string | null) {
  try { if (value == null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch { /* 保存できない環境は何もしない */ }
}

/** Firestore のエラーを見て、無料枠の上限なら覚える */
export function noteServerError(error: unknown): void {
  const code = (error as { code?: string } | null)?.code;
  if (isQuotaError(code)) write(QUOTA_KEY, String(Date.now() + QUOTA_COOLDOWN_MS));
}

export function isQuotaBlocked(now = Date.now()): boolean {
  return quotaBlockedUntil(read(QUOTA_KEY), now) != null;
}

export function clearQuotaBlock(): void { write(QUOTA_KEY, null); }

export function rememberRating(uid: string, rating: number): void {
  if (Number.isFinite(rating)) write(`${RATING_KEY}:${uid}`, String(Math.round(rating)));
}

export function lastKnownRating(uid: string | undefined): number | null {
  if (!uid) return null;
  const v = Number(read(`${RATING_KEY}:${uid}`));
  return Number.isFinite(v) && v > 0 ? v : null;
}
