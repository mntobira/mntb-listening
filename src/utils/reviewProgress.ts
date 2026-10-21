/**
 * 復習の「やった記録」（2026-10-21）。
 *
 * ■ なぜ要るか
 *   復習リスト（reviewList.ts）は「次にいつ出すか」しか持っていない。
 *   「今日いくつ直したか」「今週どれだけやったか」を見せて達成感を出すには、
 *   復習で正解した瞬間の記録が要る。ここはその小さな日誌。
 *
 * ■ 決まり
 *   - 端末内（localStorage）だけ。60日より古いものは読み込み時に捨てる。最大600件。
 *   - 書けなくても（容量・プライベートモード）復習そのものは止めない（黙って諦める）。
 *   - 同じ問題を同じ日に2回直しても「今日直した数」は1と数える（数を盛らない）。
 */
import { requireLocalStorage, safeParseJson } from './safeLocalStorage';

const DAY_MS = 24 * 60 * 60 * 1000;
const KEEP_DAYS = 60;
const MAX_ENTRIES = 600;
const keyOf = (uid: string | null | undefined) => `review_done_v1_${uid || 'guest'}`;

export interface ReviewDone { at: number; key: string }

export function startOfLocalDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function loadReviewDone(uid: string | null | undefined, now = Date.now()): ReviewDone[] {
  try {
    const list = safeParseJson<ReviewDone[]>(requireLocalStorage().getItem(keyOf(uid)), [], Array.isArray);
    const from = now - KEEP_DAYS * DAY_MS;
    return list.filter(e => e && typeof e.at === 'number' && typeof e.key === 'string' && e.at >= from && e.at <= now + DAY_MS);
  } catch {
    return [];
  }
}

export function recordReviewDone(uid: string | null | undefined, key: string, now = Date.now()): void {
  try {
    const list = loadReviewDone(uid, now);
    list.push({ at: now, key });
    requireLocalStorage().setItem(keyOf(uid), JSON.stringify(list.slice(-MAX_ENTRIES)));
  } catch {
    // 記録できなくても復習の進み（reviewList）は保存済み。ここは見せるためだけの日誌なので諦める
  }
}

export interface ReviewDay { date: number; label: string; count: number; isToday: boolean }
export interface ReviewDoneSummary {
  /** 今日直した問題の数（同じ問題は1回と数える） */
  today: number;
  /** 直近7日（古い→今日） */
  week: ReviewDay[];
  weekTotal: number;
  /** 今日（まだなら昨日）から続けて復習した日数 */
  streak: number;
  /** これまでに直した回数（60日分） */
  total: number;
}

const WEEKDAY = ['日', '月', '火', '水', '木', '金', '土'];

export function summarizeReviewDone(list: ReviewDone[], now = Date.now()): ReviewDoneSummary {
  const today0 = startOfLocalDay(now);
  const perDay = new Map<number, Set<string>>();
  for (const e of list) {
    const d = startOfLocalDay(e.at);
    if (!perDay.has(d)) perDay.set(d, new Set());
    perDay.get(d)!.add(e.key);
  }
  const week: ReviewDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = startOfLocalDay(today0 - i * DAY_MS + DAY_MS / 2);
    week.push({ date: d, label: i === 0 ? '今日' : WEEKDAY[new Date(d).getDay()], count: perDay.get(d)?.size ?? 0, isToday: i === 0 });
  }
  let streak = 0;
  let cursor = perDay.has(today0) ? today0 : startOfLocalDay(today0 - DAY_MS / 2);
  while (perDay.has(cursor)) { streak += 1; cursor = startOfLocalDay(cursor - DAY_MS / 2); }
  return {
    today: perDay.get(today0)?.size ?? 0,
    week,
    weekTotal: week.reduce((n, d) => n + d.count, 0),
    streak,
    total: list.length,
  };
}
