/**
 * ステージ（一人で学ぶ）の挑戦記録（2026-10-04）。
 *
 * ■ ステージとは
 *   利用者が「始めた単位」。単元カードの「学習開始」なら単元まるごと（キー＝章ID）、
 *   リスニングの「第N回」なら その回だけ（キー＝章ID::大問ID）。
 *
 * ■ 達成の決まり
 *   1回の挑戦で採点できた問題をすべて正解＝「満点」。満点を STAGE_CLEAR_PERFECTS 回で「達成」。
 *   「1回解いたら完了」だと数えるものがなくなるので、もう2回やる理由を残す。
 *
 * ■ 形式（localStorage・端末ごと）
 *   stage_records_v1_<uid> = { [key]: { p: 満点回数, n: 挑戦回数, b: 最高正答率%, t: 最後に遊んだ時刻 } }
 *   stage_history_v1_<uid> = [{ k, title, c, j, t }]（新しい順・最大 HISTORY_MAX 件）
 *   壊れた値は読み飛ばす（学習を止めない）。
 */
import { safeLocalStorage } from './safeLocalStorage';

export const STAGE_CLEAR_PERFECTS = 3;
const HISTORY_MAX = 40;
const RECORDS = 'stage_records_v1_';
const HISTORY = 'stage_history_v1_';

export interface StageRecord { p: number; n: number; b: number; t: number }
export interface StageHistoryEntry { k: string; title: string; c: number; j: number; t: number }

const OTHERS = 'stage_records_others_v1_';
const keyOf = (prefix: string, uid: string | null | undefined) => prefix + encodeURIComponent(uid || 'guest');
const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0;

export function stageKey(chapterId: string, questionId?: string): string {
  return questionId ? `${chapterId}::${questionId}` : chapterId;
}

/** この端末だけの記録（サーバーへ送る元） */
export function readLocalStageRecords(uid: string | null | undefined): Record<string, StageRecord> {
  return parseRecords(RECORDS, uid);
}

/**
 * 画面に出す記録＝この端末の記録＋ほかの端末の記録（サーバーで合算した値から、この端末ぶんを引いたもの）。
 * どの端末で開いても同じ「満点 n/3」になる。
 */
export function readStageRecords(uid: string | null | undefined): Record<string, StageRecord> {
  const local = parseRecords(RECORDS, uid);
  const others = parseRecords(OTHERS, uid);
  const out: Record<string, StageRecord> = { ...local };
  for (const [k, o] of Object.entries(others)) {
    const l = local[k];
    out[k] = l ? { p: l.p + o.p, n: l.n + o.n, b: Math.max(l.b, o.b), t: Math.max(l.t, o.t) } : o;
  }
  return out;
}

/** サーバーの合算結果から「ほかの端末ぶん」を保存する（achievementsSync が呼ぶ） */
export function writeOtherDeviceStages(uid: string | null | undefined, total: Record<string, { p: number; n: number }>, sent: Record<string, { p: number; n: number }>): void {
  const others: Record<string, StageRecord> = {};
  for (const [k, v] of Object.entries(total)) {
    const p = Math.max(0, v.p - (sent[k]?.p ?? 0));
    const n = Math.max(p, v.n - (sent[k]?.n ?? 0));
    if (n > 0) others[k] = { p, n, b: 0, t: 0 };
  }
  try { safeLocalStorage()?.setItem(keyOf(OTHERS, uid), JSON.stringify(others)); } catch { /* 無視 */ }
}

function parseRecords(prefix: string, uid: string | null | undefined): Record<string, StageRecord> {
  try {
    const parsed = JSON.parse(safeLocalStorage()?.getItem(keyOf(prefix, uid)) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: Record<string, StageRecord> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, any>)) {
      if (v && num(v.p) && num(v.n) && num(v.b) && num(v.t) && v.p <= v.n) out[k] = { p: v.p, n: v.n, b: Math.min(100, v.b), t: v.t };
    }
    return out;
  } catch { return {}; }
}

export function readStageHistory(uid: string | null | undefined): StageHistoryEntry[] {
  try {
    const parsed = JSON.parse(safeLocalStorage()?.getItem(keyOf(HISTORY, uid)) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e: any) => e && typeof e.k === 'string' && typeof e.title === 'string' && num(e.c) && num(e.j) && num(e.t) && e.c <= e.j)
      .slice(0, HISTORY_MAX);
  } catch { return []; }
}

/** 1回の挑戦（ステージを最後まで解いた）を記録する。満点なら満点回数を1つ増やす。 */
export function recordStagePlay(uid: string | null | undefined, key: string, title: string, correct: number, judgeable: number, now = Date.now()): StageRecord | null {
  if (!key || !Number.isFinite(correct) || !Number.isFinite(judgeable) || judgeable <= 0) return null;
  const store = safeLocalStorage();
  if (!store) return null;
  const c = Math.max(0, Math.min(Math.floor(correct), Math.floor(judgeable)));
  const j = Math.floor(judgeable);
  const records = readLocalStageRecords(uid);
  const prev = records[key] ?? { p: 0, n: 0, b: 0, t: 0 };
  const next: StageRecord = { p: prev.p + (c === j ? 1 : 0), n: prev.n + 1, b: Math.max(prev.b, Math.round((c / j) * 100)), t: now };
  records[key] = next;
  const history = [{ k: key, title: title.slice(0, 60), c, j, t: now }, ...readStageHistory(uid)].slice(0, HISTORY_MAX);
  try {
    store.setItem(keyOf(RECORDS, uid), JSON.stringify(records));
    store.setItem(keyOf(HISTORY, uid), JSON.stringify(history));
  } catch { /* 容量不足などは無視（学習は止めない） */ }
  // 端末共通の集計へ（ログイン中のみ・失敗しても学習は止めない）
  if (uid && uid !== 'guest') void import('./achievementsSync').then(m => m.scheduleAchievementsSync()).catch(() => {});
  return next;
}

export const isStageCleared = (r: StageRecord | undefined) => (r?.p ?? 0) >= STAGE_CLEAR_PERFECTS;

/** 公開プロフィール・記録画面用のまとめ */
export function stageSummary(uid: string | null | undefined) {
  const records = Object.values(readStageRecords(uid));
  return {
    cleared: records.filter(isStageCleared).length,
    perfects: records.reduce((s, r) => s + r.p, 0),
    plays: records.reduce((s, r) => s + r.n, 0),
    stages: records.length,
  };
}
