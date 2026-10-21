/**
 * ===================================================================
 * 端末だけにあった記録を、アカウントへ保存するための「純粋ロジック」層
 * ===================================================================
 *
 * ■ 何を保存するか（2026-10-19 ご指示「これ全部保存できるようにして」）
 *   study_progress（解いた問題・復習リスト）と achievements（ステージ記録・XP）以外で、
 *   これまで localStorage にしか無かったものすべて。
 *     growth      … レベル（XP）・マナコイン・ガチャ・持ちもの・着せかえ・ミッション・バッジ
 *     vocabQuiz   … 英単語4択の ✓（覚えた）・間違えた語・範囲ごとの最高点
 *     vocabPrefs  … 英単語4択の設定（出題数・順番・範囲）
 *     support     … 単語帳・文法の「覚えた」
 *     studyTime   … 学習時間（合計・日別）
 *     studyLog    … 学習記録（直近3日の○×）
 *     unitStats   … 単元ごとの正解率
 *     stageHistory… ステージの挑戦履歴
 *     battleLog   … 対戦の記録（部屋の「さっきの単元」）
 *     streak      … 連続学習日数と最後に学習した日
 *     profile     … 名前・学年・文理
 *     completed   … 修了した章
 *     notes       … 学習ノート（メモ・重要マーク）
 *     reading     … 英文解釈（内容一致4択）の文章ごとの最高点・間違えた設問（2026-10-21）
 *
 * ■ 合わせ方（3-way マージ）
 *   「前回そろえたときの値（base）」を端末に覚えておき、
 *     この端末で変わった分（local − base）と、ほかの端末で変わった分（remote − base）を両方残す。
 *   ・回数・コイン … base + (local − base) + (remote − base)
 *       → A でガチャに使い、B でミッションで貯めても、両方が正しく反映される
 *       → base が無い（初めてそろえる）ときは大きい方（二重に足さない）
 *   ・集合（覚えた語・持ちもの など）… 和集合から「base にあって片方で消したもの」を除く
 *       → 「覚えた」を外した操作もほかの端末へ伝わる
 *   ・設定・プロフィール … この端末で変えていればこの端末、変えていなければクラウド
 *   ・履歴（学習記録・対戦ログ）… key ごとに新しい方、時刻順に並べて件数を切る
 *
 * ■ このファイルは Firebase に依存しない（テストで直接呼べるように）
 */

import { mergeReviewLists, mergeSolvedMaps, type SolvedMap } from './studySyncCore';

/** 読み書きに使う最小の Storage（テストでは Map で代用できる） */
export interface KV {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

type Json = unknown;
type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const n0 = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const SAFE_KEY = (k: string) => k !== '__proto__' && k !== 'constructor' && k !== 'prototype';

// -------------------------------------------------------------------
// 部品（テストで個別に確かめる）
// -------------------------------------------------------------------

/** 回数・コインの 3-way。base が無ければ大きい方。 */
export function mergeCounter(local: unknown, remote: unknown, base?: unknown): number {
  const l = n0(local); const r = n0(remote);
  if (base === undefined || base === null) return Math.max(l, r);
  const b = n0(base);
  return Math.max(0, b + (l - b) + (r - b));
}

/** 集合の 3-way（順番は local → remote の出現順） */
export function mergeSet(local: readonly string[], remote: readonly string[], base?: readonly string[] | null): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of [...local, ...remote]) if (!seen.has(x)) { seen.add(x); out.push(x); }
  if (!base) return out;
  const l = new Set(local); const r = new Set(remote);
  return out.filter(x => !(base.includes(x) && (!l.has(x) || !r.has(x))));
}

/** 値どうしが同じか（JSON で比べる） */
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** 設定のような「まるごと1つ」の値。この端末で変えていればこの端末、でなければクラウド。 */
export function mergeWhole<T>(local: T | null, remote: T | null, base?: T | null): T | null {
  if (local == null) return remote;
  if (remote == null) return local;
  if (base !== undefined && base !== null && same(local, base)) return remote;
  return local;
}

/** 数値マップ（key → 回数）の 3-way */
function mergeCounterMap(l: unknown, r: unknown, b: unknown, cap = Infinity): Record<string, number> {
  const lo = isObj(l) ? l : {}; const ro = isObj(r) ? r : {}; const bo = isObj(b) ? b : null;
  const out: Record<string, number> = {};
  for (const k of new Set([...Object.keys(lo), ...Object.keys(ro)])) {
    if (!SAFE_KEY(k)) continue;
    out[k] = Math.min(cap, mergeCounter(lo[k], ro[k], bo ? bo[k] ?? 0 : undefined));
  }
  return out;
}

/** 最大値マップ（自己ベストなど・減らない値） */
function mergeMaxMap(l: unknown, r: unknown): Record<string, number> {
  const lo = isObj(l) ? l : {}; const ro = isObj(r) ? r : {};
  const out: Record<string, number> = {};
  for (const k of new Set([...Object.keys(lo), ...Object.keys(ro)])) if (SAFE_KEY(k)) out[k] = Math.max(n0(lo[k]), n0(ro[k]));
  return out;
}

/** 履歴（key ごとに新しい方・新しい順・件数上限） */
export function mergeHistory<T extends Obj>(l: unknown, r: unknown, keyOf: (x: T) => string, timeOf: (x: T) => number, max: number): T[] {
  const by = new Map<string, T>();
  for (const list of [l, r]) {
    if (!Array.isArray(list)) continue;
    for (const x of list) {
      if (!isObj(x)) continue;
      const item = x as T; const k = keyOf(item);
      if (!k) continue;
      const prev = by.get(k);
      if (!prev || timeOf(item) > timeOf(prev)) by.set(k, item);
    }
  }
  return [...by.values()].sort((a, b) => timeOf(b) - timeOf(a)).slice(0, max);
}

// -------------------------------------------------------------------
// 成長記録（レベル・コイン・ガチャ・持ちもの・ミッション）
// -------------------------------------------------------------------

/** 減らない回数（max で合わせる。2台で同時に増えても、片方の分は次の対戦で追いつく） */
const GROWTH_MONOTONIC = ['xp', 'matches', 'wins', 'losses', 'draws', 'correct', 'answered', 'bestStreak', 'perfectGames',
  'buzzWins', 'holesFilled', 'loginDays', 'loginStreak', 'completeStreak', 'completeDays', 'studySolved', 'rushPlays',
  'rushBest', 'rushBestCombo'] as const;

/**
 * 成長記録の封筒（growthStore の Envelope と同じ形）を合わせる。
 *   ・xp などの累計 … 3-way（base が無ければ max）。ただし「ベスト」系は max
 *   ・coins … 3-way（使った分・増えた分の両方を反映）
 *   ・owned … 和集合（持ちものは消えない）
 *   ・equipped … この端末で着がえていればこの端末
 *   ・daily … 日付が新しい方。同じ日なら進みは max、受け取りは和集合
 *   ・receipts … 和集合（同じ報酬を2台で二重に受け取らない）
 */
export function mergeGrowthEnvelope(local: Obj | null, remote: Obj | null, base?: Obj | null): Obj | null {
  if (!local) return remote;
  if (!remote) return local;
  const lp = isObj(local.progress) ? local.progress : {};
  const rp = isObj(remote.progress) ? remote.progress : {};
  const bp = base && isObj(base.progress) ? base.progress : null;
  const p: Obj = { ...rp, ...lp };
  const BEST = new Set(['bestStreak', 'rushBest', 'rushBestCombo']);
  for (const k of GROWTH_MONOTONIC) {
    if (k === 'loginStreak' || k === 'completeStreak') continue; // 下で日付に合わせて決める
    p[k] = BEST.has(k) || !bp ? Math.max(n0(lp[k]), n0(rp[k])) : Math.max(n0(lp[k]), n0(rp[k]), mergeCounter(lp[k], rp[k], bp[k]));
  }
  p.coins = mergeCounter(lp.coins, rp.coins, bp ? bp.coins : undefined);
  // 連続日数は「最後に数えた日が新しい方」に合わせる（途切れて1に戻ったことも正しく伝える）
  const newer = (a: unknown, b: unknown) => String(a || '') >= String(b || '');
  p.lastLoginDate = newer(lp.lastLoginDate, rp.lastLoginDate) ? String(lp.lastLoginDate || '') : String(rp.lastLoginDate || '');
  p.loginStreak = lp.lastLoginDate === rp.lastLoginDate ? Math.max(n0(lp.loginStreak), n0(rp.loginStreak))
    : n0(newer(lp.lastLoginDate, rp.lastLoginDate) ? lp.loginStreak : rp.loginStreak);
  p.lastCompleteDate = newer(lp.lastCompleteDate, rp.lastCompleteDate) ? String(lp.lastCompleteDate || '') : String(rp.lastCompleteDate || '');
  p.completeStreak = lp.lastCompleteDate === rp.lastCompleteDate ? Math.max(n0(lp.completeStreak), n0(rp.completeStreak))
    : n0(newer(lp.lastCompleteDate, rp.lastCompleteDate) ? lp.completeStreak : rp.completeStreak);
  p.owned = mergeSet(strs(lp.owned), strs(rp.owned));
  p.equipped = mergeWhole(isObj(lp.equipped) ? lp.equipped : null, isObj(rp.equipped) ? rp.equipped : null, bp && isObj(bp.equipped) ? bp.equipped : undefined) ?? {};
  // バッジ：どちらかで取っていれば取得。時刻は早い方
  const badges: Record<string, number> = {};
  for (const src of [lp.badges, rp.badges]) if (isObj(src)) for (const [k, v] of Object.entries(src)) {
    if (!SAFE_KEY(k) || !n0(v)) continue;
    badges[k] = badges[k] ? Math.min(badges[k], n0(v)) : n0(v);
  }
  p.badges = badges;
  // 教科ごとの成績・教科ごとのベスト
  const subjects: Record<string, Obj> = {};
  const ls = isObj(lp.subjects) ? lp.subjects : {}; const rs = isObj(rp.subjects) ? rp.subjects : {};
  for (const k of new Set([...Object.keys(ls), ...Object.keys(rs)])) {
    if (!SAFE_KEY(k)) continue;
    const a = isObj(ls[k]) ? ls[k] as Obj : {}; const b = isObj(rs[k]) ? rs[k] as Obj : {};
    subjects[k] = { matches: Math.max(n0(a.matches), n0(b.matches)), wins: Math.max(n0(a.wins), n0(b.wins)),
      correct: Math.max(n0(a.correct), n0(b.correct)), answered: Math.max(n0(a.answered), n0(b.answered)) };
  }
  p.subjects = subjects;
  p.rushBestBy = mergeMaxMap(lp.rushBestBy, rp.rushBestBy);
  // 今日のミッション
  const ld = isObj(lp.daily) ? lp.daily : {}; const rd = isObj(rp.daily) ? rp.daily : {};
  const dl = String(ld.date || ''); const dr = String(rd.date || '');
  if (dl === dr) {
    p.daily = { date: dl, progress: mergeMaxMap(ld.progress, rd.progress), claimed: mergeSet(strs(ld.claimed), strs(rd.claimed)) };
  } else {
    p.daily = dl > dr ? ld : rd;
  }
  const day = [String(local.day || ''), String(remote.day || '')].sort().at(-1);
  // 日付入りの受け取り記録は今日の分だけ残す（growthStore.pruneReceipts と同じ決まり）
  const receipts = mergeSet(strs(local.receipts), strs(remote.receipts))
    .filter(k => !/^(study|rushcoin|learn|video):/.test(k) || k.split(':')[1] === day);
  return { version: 1, progress: p, receipts, day };
}

// -------------------------------------------------------------------
// 各データの合わせ方
// -------------------------------------------------------------------

function mergeVocabQuiz(l: Obj | null, r: Obj | null, b?: Obj | null): Obj | null {
  if (!l) return r; if (!r) return l;
  const missed = mergeSet(strs(l.missed), strs(r.missed), b ? strs(b.missed) : null);
  const miss = new Set(missed);
  // 2台で食い違ったら「まだ復習が要る」側に倒す（覚えたことにして見落とすより安全）
  const mastered = mergeSet(strs(l.mastered), strs(r.mastered), b ? strs(b.mastered) : null).filter(x => !miss.has(x));
  return { version: 1, missed, best: mergeMaxMap(l.best, r.best), mastered };
}

/** 英文解釈：最高点は文章ごとに高い方（同点なら新しい方）、間違えた設問は集合の 3-way */
function mergeReading(l: Obj | null, r: Obj | null, b?: Obj | null): Obj | null {
  if (!l) return r; if (!r) return l;
  const lb = isObj(l.best) ? l.best : {}; const rb = isObj(r.best) ? r.best : {};
  const best: Obj = {};
  for (const k of new Set([...Object.keys(lb), ...Object.keys(rb)])) {
    if (!SAFE_KEY(k)) continue;
    const a = lb[k]; const c = rb[k];
    if (!isObj(a)) { if (isObj(c)) best[k] = c; continue; }
    if (!isObj(c)) { best[k] = a; continue; }
    const sa = n0(a.score); const sc = n0(c.score);
    best[k] = sa !== sc ? (sa > sc ? a : c) : (n0(a.at) >= n0(c.at) ? a : c);
  }
  return { version: 1, best, missed: mergeSet(strs(l.missed), strs(r.missed), b ? strs(b.missed) : null) };
}

function mergeSupport(l: Obj | null, r: Obj | null, b?: Obj | null): Obj | null {
  if (!l) return r; if (!r) return l;
  return { version: 1,
    words: mergeSet(strs(l.words), strs(r.words), b ? strs(b.words) : null),
    grammar: mergeSet(strs(l.grammar), strs(r.grammar), b ? strs(b.grammar) : null) };
}

const DAY_CAP = 12 * 3600;
function mergeStudyTime(l: Obj | null, r: Obj | null, b?: Obj | null): Obj | null {
  if (!l) return r; if (!r) return l;
  const days = mergeCounterMap(l.days, r.days, b ? b.days ?? {} : null, DAY_CAP);
  const keep = Object.keys(days).sort().slice(-60);
  const sumDays = keep.reduce((s, k) => s + days[k], 0);
  const total = Math.max(sumDays, mergeCounter(l.total, r.total, b ? b.total : undefined));
  return { total, days: Object.fromEntries(keep.map(k => [k, days[k]])) };
}

function mergeUnitStats(l: Obj | null, r: Obj | null, b?: Obj | null): Obj | null {
  if (!l) return r; if (!r) return l;
  const out: Obj = {};
  for (const k of new Set([...Object.keys(l), ...Object.keys(r)])) {
    if (!SAFE_KEY(k)) continue;
    const a = isObj(l[k]) ? l[k] as Obj : null; const c = isObj(r[k]) ? r[k] as Obj : null;
    const base = b && isObj(b[k]) ? b[k] as Obj : null;
    if (!a || !c) { out[k] = a || c; continue; }
    const j = mergeCounter(a.j, c.j, base ? base.j : (b ? 0 : undefined));
    const cc = Math.min(j, mergeCounter(a.c, c.c, base ? base.c : (b ? 0 : undefined)));
    out[k] = { c: cc, j, t: Math.max(n0(a.t), n0(c.t)) };
  }
  return out;
}

function mergeStreak(l: Obj | null, r: Obj | null): Obj | null {
  if (!l) return r; if (!r) return l;
  const tl = Date.parse(String(l.lastActive || '')) || 0;
  const tr = Date.parse(String(r.lastActive || '')) || 0;
  if (tl === tr) return { lastActive: l.lastActive ?? r.lastActive, streak: Math.max(n0(l.streak), n0(r.streak)) };
  return tl > tr ? l : r;
}

function mergeNotes(l: unknown, r: unknown, b?: unknown): Obj[] | null {
  const la = Array.isArray(l) ? l.filter(isObj) : null; const ra = Array.isArray(r) ? r.filter(isObj) : null;
  if (!la) return ra; if (!ra) return la;
  const baseById = new Map<string, Obj>((Array.isArray(b) ? b.filter(isObj) : []).map(n => [String(n.id), n]));
  const lById = new Map(la.map(n => [String(n.id), n])); const rById = new Map(ra.map(n => [String(n.id), n]));
  const out: Obj[] = [];
  for (const id of new Set([...lById.keys(), ...rById.keys()])) {
    if (!id || id === 'undefined') continue;
    const a = lById.get(id); const c = rById.get(id); const base = baseById.get(id);
    // 片方で消したノート（base にはあった）は消す
    if (base && (!a || !c)) continue;
    if (a && c) out.push(base && same(a, base) ? c : a);
    else out.push((a || c)!);
  }
  return out;
}

// -------------------------------------------------------------------
// 保存先（localStorage のキー）と合わせ方の一覧
// -------------------------------------------------------------------

export interface SyncSection {
  /** Firestore のフィールド名（s_<id>） */
  id: string;
  /** localStorage のキー（uid ごと） */
  keys: (uid: string) => string[];
  /** localStorage → 値（無ければ null。壊れていれば undefined＝触らない） */
  read: (kv: KV, uid: string) => Json | null | undefined;
  /** 値 → localStorage */
  write: (kv: KV, uid: string, value: Json) => void;
  merge: (local: Json | null, remote: Json | null, base?: Json | null) => Json | null;
}

const enc = (uid: string) => encodeURIComponent(uid);
function readJson(kv: KV, key: string): Json | null | undefined {
  const raw = kv.getItem(key);
  if (raw === null || raw === '') return null;
  try { return JSON.parse(raw); } catch { return undefined; }
}
function writeJson(kv: KV, key: string, value: Json) { kv.setItem(key, JSON.stringify(value)); }

/** 1つのキーに JSON がそのまま入っているデータ */
function jsonSection(id: string, key: (uid: string) => string, merge: SyncSection['merge'], valid: (v: Json) => boolean): SyncSection {
  return {
    id, keys: (uid) => [key(uid)],
    read: (kv, uid) => { const v = readJson(kv, key(uid)); return v === null || v === undefined ? v : valid(v) ? v : undefined; },
    write: (kv, uid, value) => writeJson(kv, key(uid), value),
    merge,
  };
}

export const GROWTH_KEY = (uid: string) => 'battle_growth_local_v1_' + enc(uid);

export const SYNC_SECTIONS: readonly SyncSection[] = [
  jsonSection('growth', GROWTH_KEY, (l, r, b) => mergeGrowthEnvelope(l as Obj | null, r as Obj | null, b as Obj | null),
    v => isObj(v) && v.version === 1 && isObj(v.progress) && Array.isArray(v.receipts)),
  jsonSection('vocabQuiz', uid => 'vocab_quiz_v1_' + enc(uid), (l, r, b) => mergeVocabQuiz(l as Obj | null, r as Obj | null, b as Obj | null),
    v => isObj(v) && v.version === 1 && Array.isArray(v.missed)),
  jsonSection('vocabPrefs', uid => 'vocab_quiz_prefs_v1_' + enc(uid), mergeWhole, isObj),
  jsonSection('support', uid => 'listening_support_v1_' + enc(uid), (l, r, b) => mergeSupport(l as Obj | null, r as Obj | null, b as Obj | null),
    v => isObj(v) && v.version === 1 && Array.isArray(v.words) && Array.isArray(v.grammar)),
  jsonSection('studyTime', uid => 'study_time_v1_' + enc(uid), (l, r, b) => mergeStudyTime(l as Obj | null, r as Obj | null, b as Obj | null), isObj),
  jsonSection('studyLog', uid => `study_log_v1_${uid}`,
    (l, r) => (l == null ? r : r == null ? l : mergeHistory<Obj>(l, r, x => String(x.key || ''), x => n0(x.at), 120)), Array.isArray),
  jsonSection('unitStats', uid => 'unit_stats_v1_' + enc(uid), (l, r, b) => mergeUnitStats(l as Obj | null, r as Obj | null, b as Obj | null), isObj),
  jsonSection('stageHistory', uid => 'stage_history_v1_' + enc(uid),
    (l, r) => (l == null ? r : r == null ? l : mergeHistory<Obj>(l, r, x => `${x.k}@${x.t}`, x => n0(x.t), 40)), Array.isArray),
  jsonSection('battleLog', uid => `battle_local_log_v1_${uid}`,
    (l, r) => (l == null ? r : r == null ? l : mergeHistory<Obj>(l, r, x => String(x.key || ''), x => n0(x.at), 12)), Array.isArray),
  jsonSection('profile', uid => `profile_${uid}`, mergeWhole, isObj),
  jsonSection('completed', uid => `completed_${uid}`,
    (l, r, b) => (l == null ? r : r == null ? l : mergeSet(strs(l), strs(r), b ? strs(b) : null)), Array.isArray),
  jsonSection('notes', uid => `notes_${uid}`, mergeNotes, Array.isArray),
  jsonSection('reading', uid => 'reading_quiz_v1_' + enc(uid), (l, r, b) => mergeReading(l as Obj | null, r as Obj | null, b as Obj | null),
    v => isObj(v) && v.version === 1 && isObj(v.best) && Array.isArray(v.missed)),
  {
    // 連続日数は2つのキー（数と日付）に分かれているので、1つにまとめて扱う
    id: 'streak',
    keys: uid => [`streak_${uid}`, `lastActive_${uid}`],
    read: (kv, uid) => {
      const last = kv.getItem(`lastActive_${uid}`);
      if (!last) return null;
      return { lastActive: last, streak: parseInt(kv.getItem(`streak_${uid}`) || '0', 10) || 0 };
    },
    write: (kv, uid, value) => {
      if (!isObj(value) || typeof value.lastActive !== 'string') return;
      kv.setItem(`lastActive_${uid}`, value.lastActive);
      kv.setItem(`streak_${uid}`, String(n0(value.streak)));
    },
    merge: (l, r) => mergeStreak(l as Obj | null, r as Obj | null),
  },
];

// -------------------------------------------------------------------
// ゲストで使っていた記録をアカウントへ移す（ゲスト廃止・2026-10-19）
// -------------------------------------------------------------------

export const GUEST_UID = 'guest';

/** クラウドから取り込んで localStorage が変わったときのイベント名（画面が読み直す） */
export { USER_DATA_SYNCED_EVENT } from './userDataSyncEvent';

/** study_progress 側（解いた問題・復習リスト）とステージ記録のキー */
const EXTRA_GUEST_KEYS = {
  solved: (uid: string) => `solved_problems_v1_${uid}`,
  review: (uid: string) => `review_list_${uid}`,
  stageRecords: (uid: string) => 'stage_records_v1_' + enc(uid),
};

export interface MigrationResult { moved: string[] }

/**
 * この端末にゲストの記録があれば、uid の記録へ合わせて、ゲストの分は消す。
 * 何度呼んでも同じ結果（2回目はゲストの記録が無いので何もしない）。
 */
export function migrateGuestData(kv: KV, uid: string): MigrationResult {
  const moved: string[] = [];
  if (!uid || uid === GUEST_UID) return { moved };
  for (const s of SYNC_SECTIONS) {
    const g = s.read(kv, GUEST_UID);
    if (g === null || g === undefined) continue;
    const mine = s.read(kv, uid);
    if (mine === undefined) continue; // アカウント側が壊れていたら上書きしない
    let value = mine === null ? g : s.merge(mine, g, null);
    // 成長記録の中には uid が入っているので、アカウントの uid に直す
    if (s.id === 'growth' && isObj(value) && isObj(value.progress)) value = { ...value, progress: { ...value.progress, uid } };
    if (value === null || value === undefined) continue;
    s.write(kv, uid, value);
    s.keys(GUEST_UID).forEach(k => kv.removeItem(k));
    moved.push(s.id);
  }
  // 解いた問題（追記のみ）
  const gs = readJson(kv, EXTRA_GUEST_KEYS.solved(GUEST_UID));
  if (isObj(gs)) {
    const ms = readJson(kv, EXTRA_GUEST_KEYS.solved(uid));
    if (ms !== undefined) {
      writeJson(kv, EXTRA_GUEST_KEYS.solved(uid), mergeSolvedMaps(isObj(ms) ? ms as SolvedMap : {}, gs as SolvedMap));
      kv.removeItem(EXTRA_GUEST_KEYS.solved(GUEST_UID));
      moved.push('solved');
    }
  }
  // 復習リスト
  const gr = readJson(kv, EXTRA_GUEST_KEYS.review(GUEST_UID));
  if (Array.isArray(gr)) {
    const mr = readJson(kv, EXTRA_GUEST_KEYS.review(uid));
    if (mr !== undefined) {
      writeJson(kv, EXTRA_GUEST_KEYS.review(uid), mergeReviewLists(Array.isArray(mr) ? mr : [], gr));
      kv.removeItem(EXTRA_GUEST_KEYS.review(GUEST_UID));
      moved.push('review');
    }
  }
  // ステージ記録（この端末ぶん。サーバーへの合算は achievementsSync が行う）
  const gst = readJson(kv, EXTRA_GUEST_KEYS.stageRecords(GUEST_UID));
  if (isObj(gst)) {
    const mst = readJson(kv, EXTRA_GUEST_KEYS.stageRecords(uid));
    if (mst !== undefined) {
      const out: Obj = { ...(isObj(mst) ? mst : {}) };
      for (const [k, v] of Object.entries(gst)) {
        if (!SAFE_KEY(k) || !isObj(v)) continue;
        const m = isObj(out[k]) ? out[k] as Obj : null;
        out[k] = m ? { p: n0(m.p) + n0(v.p), n: n0(m.n) + n0(v.n), b: Math.max(n0(m.b), n0(v.b)), t: Math.max(n0(m.t), n0(v.t)) } : v;
      }
      writeJson(kv, EXTRA_GUEST_KEYS.stageRecords(uid), out);
      kv.removeItem(EXTRA_GUEST_KEYS.stageRecords(GUEST_UID));
      moved.push('stageRecords');
    }
  }
  return { moved };
}

// -------------------------------------------------------------------
// クラウドとそろえる（1回分）
// -------------------------------------------------------------------

/** Firestore の1フィールドに入れてよい最大の長さ（文字数）。ドキュメント全体の上限は 1MiB。 */
export const MAX_SECTION_CHARS = 200_000;
export const sectionField = (id: string) => `s_${id}`;

export interface ReconcileResult {
  /** localStorage を書き換えたデータ */
  changedLocal: string[];
  /** クラウドへ送るべきフィールド（s_<id> → JSON 文字列） */
  upload: Record<string, string>;
  /** 次回の base（id → JSON 文字列） */
  base: Record<string, string>;
  /** 大きすぎてクラウドに置けなかったデータ */
  tooLarge: string[];
}

/**
 * localStorage とクラウドの値を合わせる。
 * @param remote Firestore ドキュメント（s_<id> に JSON 文字列）。初回は null
 * @param base   前回そろえた値（id → JSON 文字列）
 */
export function reconcile(kv: KV, uid: string, remote: Record<string, unknown> | null, base: Record<string, string>): ReconcileResult {
  const result: ReconcileResult = { changedLocal: [], upload: {}, base: { ...base }, tooLarge: [] };
  for (const s of SYNC_SECTIONS) {
    const local = s.read(kv, uid);
    if (local === undefined) continue; // 壊れている端末の記録は触らない（上書きして消さない）
    const rawRemote = remote ? remote[sectionField(s.id)] : undefined;
    let remoteValue: Json | null = null;
    if (typeof rawRemote === 'string') { try { remoteValue = JSON.parse(rawRemote); } catch { remoteValue = null; } }
    const baseRaw = base[s.id];
    let baseValue: Json | null = null;
    if (typeof baseRaw === 'string') { try { baseValue = JSON.parse(baseRaw); } catch { baseValue = null; } }
    const merged = s.merge(local, remoteValue, baseValue);
    if (merged === null || merged === undefined) continue;
    let mergedStr = JSON.stringify(merged);
    if (s.id === 'growth' && isObj(merged) && isObj(merged.progress) && merged.progress.uid !== uid) {
      mergedStr = JSON.stringify({ ...merged, progress: { ...merged.progress, uid } });
    }
    if (local === null || JSON.stringify(local) !== mergedStr) {
      s.write(kv, uid, JSON.parse(mergedStr));
      result.changedLocal.push(s.id);
    }
    if (mergedStr.length > MAX_SECTION_CHARS) { result.tooLarge.push(s.id); continue; }
    if (rawRemote !== mergedStr) result.upload[sectionField(s.id)] = mergedStr;
    result.base[s.id] = mergedStr;
  }
  return result;
}

/** 前回そろえたあと、この端末で何か変わったか（送るべきか）の判定に使う指紋 */
export function localFingerprint(kv: KV, uid: string): string {
  return SYNC_SECTIONS.map(s => s.keys(uid).map(k => kv.getItem(k) ?? '').join('\u0001')).join('\u0002');
}
