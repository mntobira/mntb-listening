/**
 * 学習記録（2026-10-04 ご要望）
 *
 * 「直近（3日ぶん）に、どの問題を解いて、どこを間違えたか」を
 * 一人で学ぶ・対戦の両方から1つの時系列に残す。端末内（localStorage）だけで完結。
 *
 *   1件 = 1回のまとまり
 *     ・一人で学ぶ … 大問（回）1つを採点したとき（1問ずつ進む英語は小問ごとに来るので同じ大問へ足し込む）
 *     ・対戦       … 1試合
 *   items には小問ごとの ○× と、間違えたときの正解を持つ。
 */
export const STUDY_LOG_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 120;

export interface StudyLogItem {
  /** 小問ID（対戦は問題ID） */
  id: string;
  /** 「問4」など */
  label: string;
  correct: boolean;
  /** 問題文の短い要約（対戦） */
  prompt?: string;
  /** 正解（間違えたときに見返す用） */
  answer?: string;
}

export interface StudyLogEntry {
  /** 同じまとまりを2回書かないための鍵 */
  key: string;
  kind: 'study' | 'battle';
  at: number;
  subject?: string;
  chapterId?: string;
  /** 「第1章 時制」など */
  title: string;
  /** 「第1回」「AIと対戦・勝ち」など */
  sub?: string;
  questionId?: string;
  outcome?: 'win' | 'lose' | 'draw';
  items: StudyLogItem[];
}

const keyOf = (uid: string | null | undefined) => `study_log_v1_${uid || 'guest'}`;

export function loadStudyLog(uid: string | null | undefined, now = Date.now()): StudyLogEntry[] {
  try {
    const raw = localStorage.getItem(keyOf(uid));
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return [];
    return (list as StudyLogEntry[])
      .filter(e => e && typeof e.at === 'number' && now - e.at < STUDY_LOG_DAYS * DAY_MS && Array.isArray(e.items))
      .sort((a, b) => b.at - a.at);
  } catch { return []; }
}

/** 追記する。同じ key があれば小問を足し込み（同じ小問は上書き）、時刻を新しくする */
export function recordStudyLog(uid: string | null | undefined, entry: StudyLogEntry, now = Date.now()): void {
  try {
    const list = loadStudyLog(uid, now);
    const at = list.findIndex(e => e.key === entry.key);
    let merged = entry;
    if (at >= 0) {
      const prev = list[at];
      const byId = new Map(prev.items.map(i => [i.id, i]));
      for (const i of entry.items) byId.set(i.id, i);
      merged = { ...prev, ...entry, items: [...byId.values()] };
      list.splice(at, 1);
    }
    localStorage.setItem(keyOf(uid), JSON.stringify([merged, ...list].slice(0, MAX_ENTRIES)));
  } catch { /* 記録できなくても学習は止めない */ }
}

export interface StudyLogDay { date: string; label: string; entries: StudyLogEntry[]; solved: number; wrong: number }

const dateKey = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/** 日ごと（今日・きのう・おととい）にまとめる */
export function groupStudyLogByDay(entries: StudyLogEntry[], now = Date.now()): StudyLogDay[] {
  const today = dateKey(now); const yday = dateKey(now - DAY_MS); const dby = dateKey(now - 2 * DAY_MS);
  const map = new Map<string, StudyLogDay>();
  for (const e of entries) {
    const k = dateKey(e.at);
    const d = new Date(e.at);
    const label = k === today ? '今日' : k === yday ? 'きのう' : k === dby ? 'おととい' : `${d.getMonth() + 1}/${d.getDate()}`;
    let day = map.get(k);
    if (!day) { day = { date: k, label, entries: [], solved: 0, wrong: 0 }; map.set(k, day); }
    day.entries.push(e);
    day.solved += e.items.length;
    day.wrong += e.items.filter(i => !i.correct).length;
  }
  return [...map.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
}
