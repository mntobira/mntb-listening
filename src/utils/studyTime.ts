/**
 * 学習時間の記録（2026-09-30・設定のプロフィールカード A14）。
 *
 *   localStorage['study_time_v1_<uid>'] = { total: 秒, days: { 'YYYY-MM-DD': 秒 } }
 *
 * 数えるのは「演習・解説の画面を開いていて、タブが前面にある間」だけ（App.tsx が1分ごとに足す）。
 * 放置で増え続けないよう、1回に足せるのは最大90秒・1日の上限は12時間。
 * days は直近60日だけ残す（容量を増やし続けない）。
 */
import { safeLocalStorage } from './safeLocalStorage';

export interface StudyTimeLog { total: number; days: Record<string, number> }
const PREFIX = 'study_time_v1_';
export const studyTimeKey = (uid: string | null | undefined) => PREFIX + encodeURIComponent(uid || 'guest');
const DAY_CAP = 12 * 3600;
const STEP_CAP = 90;
const KEEP_DAYS = 60;

export function readStudyTime(uid: string | null | undefined): StudyTimeLog {
  try {
    const p = JSON.parse(safeLocalStorage()?.getItem(studyTimeKey(uid)) || '{}');
    const total = Number.isFinite(p?.total) && p.total > 0 ? Math.floor(p.total) : 0;
    const days: Record<string, number> = {};
    if (p?.days && typeof p.days === 'object') for (const [k, v] of Object.entries(p.days)) if (/^\d{4}-\d{2}-\d{2}$/.test(k) && typeof v === 'number' && v > 0) days[k] = Math.floor(v);
    return { total, days };
  } catch { return { total: 0, days: {} }; }
}

export function addStudySeconds(uid: string | null | undefined, seconds: number, day: string): void {
  const add = Math.min(STEP_CAP, Math.max(0, Math.floor(seconds)));
  if (!add || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
  const store = safeLocalStorage(); if (!store) return;
  const log = readStudyTime(uid);
  const today = log.days[day] ?? 0;
  const grant = Math.max(0, Math.min(add, DAY_CAP - today));
  if (!grant) return;
  log.days[day] = today + grant;
  log.total += grant;
  const keep = Object.keys(log.days).sort().slice(-KEEP_DAYS);
  log.days = Object.fromEntries(keep.map(k => [k, log.days[k]]));
  try { store.setItem(studyTimeKey(uid), JSON.stringify(log)); } catch { /* 容量不足は無視 */ }
}

/** 3725秒 → 「1時間2分」、59秒 → 「1分未満」 */
export function formatStudyTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  if (m < 1) return seconds > 0 ? '1分未満' : '0分';
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}時間${m % 60 ? `${m % 60}分` : ''}` : `${m}分`;
}
