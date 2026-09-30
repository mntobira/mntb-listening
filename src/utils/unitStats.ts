/**
 * 単元（章）ごとの正解率の台帳（2026-09-30）。
 *
 * ■ なぜ必要か
 *   単元カードに「未着手／学習中／完了」と「正解率」を出すため。
 *   solved_problems_v1_*（progress.ts）は「1点でも取れた大問」しか持っておらず、
 *   何問中何問正解したかが分からない。
 *
 * ■ 形式
 *   localStorage['unit_stats_v1_<uid>'] = { [章ID]: { c: 正解した小問数, j: 採点できた小問数, t: 最後に解いた時刻 } }
 *   - 採点のたびに足し込む（解き直しも数える＝最新の実力に寄せるため直近の値も持つ）。
 *   - 記述式など採点できない小問は j に入れない（quizScoring の judgeableCount と同じ）。
 *   - 最新の1回（last）も持ち、「前回の正解率」も出せるようにする。
 *
 * 壊れた値は読み飛ばす（学習を止めない）。
 */
import { safeLocalStorage } from './safeLocalStorage';

export const UNIT_STATS_PREFIX = 'unit_stats_v1_';
export interface UnitStat { c: number; j: number; t: number }
export type UnitStatsMap = Record<string, UnitStat>;

const keyOf = (uid: string | null | undefined) => UNIT_STATS_PREFIX + encodeURIComponent(uid || 'guest');
const isStat = (v: unknown): v is UnitStat => {
  if (!v || typeof v !== 'object') return false;
  const s = v as Record<string, unknown>;
  return [s.c, s.j, s.t].every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0) && (s.c as number) <= (s.j as number);
};

export function readUnitStats(uid: string | null | undefined): UnitStatsMap {
  try {
    const raw = safeLocalStorage()?.getItem(keyOf(uid));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: UnitStatsMap = {};
    for (const [id, v] of Object.entries(parsed)) if (isStat(v)) out[id] = v;
    return out;
  } catch { return {}; }
}

/** 採点のたびに呼ぶ。correct / judgeable はその大問で採点できた小問の数。 */
export function recordUnitResult(uid: string | null | undefined, chapterId: string, correct: number, judgeable: number, now = Date.now()): void {
  if (!chapterId || !Number.isFinite(correct) || !Number.isFinite(judgeable) || judgeable <= 0) return;
  const c = Math.max(0, Math.min(Math.floor(correct), Math.floor(judgeable)));
  const j = Math.floor(judgeable);
  const store = safeLocalStorage();
  if (!store) return;
  const map = readUnitStats(uid);
  const prev = map[chapterId];
  map[chapterId] = { c: (prev?.c ?? 0) + c, j: (prev?.j ?? 0) + j, t: now };
  try { store.setItem(keyOf(uid), JSON.stringify(map)); } catch { /* 容量不足などは無視（学習は止めない） */ }
}

export type UnitStatus = 'todo' | 'doing' | 'done';
export const UNIT_STATUS_LABEL: Record<UnitStatus, string> = { todo: '未着手', doing: '学習中', done: '完了' };

/**
 * 単元の状態を決める。
 *   未着手 … 1問も解いていない（途中保存もない）
 *   学習中 … 途中まで解いた／途中保存がある
 *   完了   … 全大問を1点以上で解いた
 */
export function unitStatus(solved: number, total: number, hasSavedProgress = false): UnitStatus {
  if (total > 0 && solved >= total) return 'done';
  if (solved > 0 || hasSavedProgress) return 'doing';
  return 'todo';
}

/** 正解率（%）。採点できた小問がなければ null（「—」と表示する） */
export function accuracyOf(stat: UnitStat | undefined): number | null {
  if (!stat || stat.j <= 0) return null;
  return Math.round((stat.c / stat.j) * 100);
}

/** 「① 基本5文型…」→「基本5文型…」。先頭の丸数字だけ外す（番号は「01.」として別に出す）。 */
export function stripCircledNumber(title: string): string {
  return title.replace(/^[\u2460-\u2473\u3251-\u325F\u32B1-\u32BF]\s*/, '');
}
