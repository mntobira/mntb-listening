/**
 * ===================================================================
 * 学習成果指標（Learning Outcomes）の記録・保存・同期マージ層
 * ===================================================================
 *
 * オフライン優先（localStorage）＋クラウド同期（user_data / study_progress / usage_sessions）で
 * 4つの学習成果指標を扱う：
 *   1. D7 / D30 継続率（初回学習日から 7〜13日後・30〜36日後に再学習した割合）
 *   2. 1人あたり週の解答数（直近7日・直近4週の推移）
 *   3. 対戦後に復習・演習へ進む割合（試合ごとの転換率：復習登録 or 単元演習遷移）
 *   4. 同形式の未見問題の正答率推移（初見問題のみを初回10問→直近20問・10問ビンで追跡）
 *
 * ※ 起動時のバンドルを増やさないため、src/data/* の問題データは一切 import しない。
 * ※ 集計・コホート算出・CSV出力は learningOutcomesAnalytics.ts に分離し再エクスポートする。
 */

import { safeGetItem, safeParseJson, setItemOrThrow } from './safeLocalStorage';
import { toDateKey } from './studyPeriods';
import { trackEvent } from './analytics';

const RECENT_WINDOW = 20;
const BIN_SIZE = 10;
const MAX_BINS = 15;
const MAX_SEEN_KEYS = 4500;
const MAX_DAILY_DAYS = 180;
const MAX_BATTLES = 160;

export type OutcomeFormatId =
  | 'listening_short'
  | 'listening_long'
  | 'grammar'
  | 'vocab_quiz'
  | 'reading_comp'
  | 'toeic_listening'
  | 'toeic_p5'
  | 'toeic_reading'
  | 'other_subject';

export const OUTCOME_FORMAT_LABELS: Record<OutcomeFormatId, string> = {
  listening_short: '共テリスニング（短文・応答）',
  listening_long: '共テリスニング（会話・講義）',
  grammar: '英文法・語法',
  vocab_quiz: '英単語4択',
  reading_comp: '英文解釈（読解）',
  toeic_listening: 'TOEIC® リスニング',
  toeic_p5: 'TOEIC® 短文穴埋め',
  toeic_reading: 'TOEIC® 長文穴埋め・読解',
  other_subject: '他教科・総合演習',
};

export const OUTCOME_FORMAT_ORDER: readonly OutcomeFormatId[] = [
  'listening_short',
  'listening_long',
  'grammar',
  'vocab_quiz',
  'reading_comp',
  'toeic_listening',
  'toeic_p5',
  'toeic_reading',
  'other_subject',
];

export interface UnseenBin {
  /** 10問単位の問数（1..10） */
  n: number;
  /** 正解数（0..n） */
  c: number;
}

export interface FormatUnseenTrack {
  /** 未見で解いた累計小問数 */
  total: number;
  /** 未見で正解した累計小問数 */
  correct: number;
  /** 最初の10問（ベースライン） */
  first10: UnseenBin;
  /** 直近最大20問の正誤列（'1' = 正解, '0' = 不正解） */
  recent20: string;
  /** 10問ごとの推移ビン（最大15ビン＝150問分） */
  bins: UnseenBin[];
  updatedAt: number;
}

export interface BattleConversionEntry {
  at: number;
  /** 0 = 未転換, 1 = 復習へ, 2 = 演習へ, 3 = 両方 */
  conv: 0 | 1 | 2 | 3;
}

export interface LearningOutcomesStore {
  version: 1;
  /** 初回学習日 YYYY-MM-DD */
  firstStudyDay: string | null;
  /** 日別の解答小問数（練習＋単語＋読解＋対戦すべて） */
  dailyAnswers: Record<string, number>;
  /** 形式別の未見（初見）正答率トラック */
  formats: Partial<Record<OutcomeFormatId, FormatUnseenTrack>>;
  /** 初見判定済みキー → 初回結果（1=正解, 0=不正解） */
  seen: Record<string, 0 | 1>;
  /** 対戦試合キー → 転換状態 */
  battles: Record<string, BattleConversionEntry>;
  /** 直近の対戦情報（直後の復習・演習ボタン押下を紐づける） */
  lastBattleKey?: string;
  lastBattleAt?: number;
}

/** study_progress/{uid} に載せる軽量サマリー（先生ダッシュボード用・約1〜2KB） */
export interface SyncedOutcomesSummary {
  v: 1;
  firstDay: string | null;
  daily: Record<string, number>;
  battles: { total: number; toReview: number; toPractice: number; converted: number };
  formats: Partial<Record<OutcomeFormatId, {
    total: number;
    correct: number;
    firstN: number;
    firstC: number;
    recentN: number;
    recentC: number;
    bins: Array<[number, number]>;
  }>>;
}

export const OUTCOMES_KEY = (uid: string) => `learning_outcomes_v1_${encodeURIComponent(uid)}`;

export function emptyOutcomesStore(): LearningOutcomesStore {
  return { version: 1, firstStudyDay: null, dailyAnswers: {}, formats: {}, seen: {}, battles: {} };
}

export function isOutcomesStore(v: unknown): v is LearningOutcomesStore {
  if (!v || typeof v !== 'object') return false;
  const o = v as Partial<LearningOutcomesStore>;
  return (
    o.version === 1 &&
    (o.firstStudyDay === null || typeof o.firstStudyDay === 'string') &&
    !!o.dailyAnswers && typeof o.dailyAnswers === 'object' &&
    !!o.formats && typeof o.formats === 'object' &&
    !!o.seen && typeof o.seen === 'object' &&
    !!o.battles && typeof o.battles === 'object'
  );
}

export function loadOutcomesStore(uid: string | null | undefined): LearningOutcomesStore {
  if (!uid) return emptyOutcomesStore();
  const parsed = safeParseJson<unknown>(safeGetItem(OUTCOMES_KEY(uid)), null);
  return isOutcomesStore(parsed) ? parsed : emptyOutcomesStore();
}

export function saveOutcomesStore(uid: string | null | undefined, store: LearningOutcomesStore): void {
  if (!uid) return;
  try {
    setItemOrThrow(OUTCOMES_KEY(uid), JSON.stringify(pruneOutcomesStore(store)));
  } catch {
    /* 容量不足でも学習自体は止めない */
  }
}

/** 章ID・教科名から問題形式を分類する（静的データ import ゼロ） */
export function classifyOutcomeFormat(chapterIdOrKind: string, subject?: string): OutcomeFormatId {
  const id = (chapterIdOrKind || '').trim();
  if (id === 'vocab_quiz' || subject === 'english_vocab') return 'vocab_quiz';
  if (id === 'reading_comp') return 'reading_comp';
  if (/^tpl_/i.test(id)) return 'toeic_listening';
  if (/^tp5_/i.test(id)) return 'toeic_p5';
  if (/^tp[67]_/i.test(id)) return 'toeic_reading';
  if (/^el[12](_|$)/i.test(id)) return 'listening_short';
  if (/^el[3-6](_|$)/i.test(id)) return 'listening_long';
  if (/^eg\d/i.test(id) || subject === 'english_grammar') return 'grammar';
  if (subject === 'english_listening') return 'listening_long';
  if (subject === 'toeic_part5') return 'toeic_p5';
  return 'other_subject';
}

function emptyTrack(now = Date.now()): FormatUnseenTrack {
  return { total: 0, correct: 0, first10: { n: 0, c: 0 }, recent20: '', bins: [], updatedAt: now };
}

function appendUnseenToTrack(prev: FormatUnseenTrack | undefined, correct: boolean, now: number): FormatUnseenTrack {
  const base = prev ? {
    total: prev.total,
    correct: prev.correct,
    first10: { ...prev.first10 },
    recent20: prev.recent20 || '',
    bins: prev.bins.map((b) => ({ ...b })),
    updatedAt: Math.max(prev.updatedAt || 0, now),
  } : emptyTrack(now);

  const bit = correct ? 1 : 0;
  base.total += 1;
  base.correct += bit;
  if (base.first10.n < BIN_SIZE) {
    base.first10.n += 1;
    base.first10.c += bit;
  }
  base.recent20 = `${base.recent20}${bit}`.slice(-RECENT_WINDOW);
  const last = base.bins[base.bins.length - 1];
  if (!last || last.n >= BIN_SIZE) {
    if (base.bins.length < MAX_BINS) {
      base.bins.push({ n: 1, c: bit });
    } else {
      const tailBits = base.recent20.slice(-BIN_SIZE);
      const cCount = [...tailBits].filter((ch) => ch === '1').length;
      base.bins[base.bins.length - 1] = { n: tailBits.length, c: cCount };
    }
  } else {
    last.n += 1;
    last.c += bit;
  }
  base.updatedAt = now;
  return base;
}

const SAFE_OUTCOME_KEY = (k: string): boolean =>
  Boolean(k) && k !== '__proto__' && k !== 'constructor' && k !== 'prototype' && k.length <= 160;

function pruneOutcomesStore(store: LearningOutcomesStore): LearningOutcomesStore {
  const days = Object.keys(store.dailyAnswers)
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort();
  const dailyAnswers: Record<string, number> = {};
  for (const d of days.slice(-MAX_DAILY_DAYS)) {
    const v = Math.min(100000, Math.max(0, Math.round(Number(store.dailyAnswers[d]) || 0)));
    if (v > 0) dailyAnswers[d] = v;
  }

  const seen: Record<string, 0 | 1> = {};
  for (const [k, v] of Object.entries(store.seen).filter(([k]) => SAFE_OUTCOME_KEY(k)).slice(-MAX_SEEN_KEYS)) {
    seen[k] = v === 1 ? 1 : 0;
  }

  const battleEntries = Object.entries(store.battles)
    .filter(([k, b]) => SAFE_OUTCOME_KEY(k) && b && typeof b === 'object' && Number.isFinite(b.at))
    .sort((a, b) => a[1].at - b[1].at)
    .slice(-MAX_BATTLES);
  const battles: Record<string, BattleConversionEntry> = {};
  for (const [k, b] of battleEntries) {
    const conv = (b.conv === 1 || b.conv === 2 || b.conv === 3 ? b.conv : 0) as 0 | 1 | 2 | 3;
    battles[k] = { at: b.at, conv };
  }

  const allDays = Object.keys(dailyAnswers).sort();
  let firstStudyDay = store.firstStudyDay;
  if (allDays.length > 0 && (!firstStudyDay || allDays[0]! < firstStudyDay)) {
    firstStudyDay = allDays[0]!;
  }

  return {
    version: 1,
    firstStudyDay: firstStudyDay || null,
    dailyAnswers,
    formats: store.formats,
    seen,
    battles,
    ...(store.lastBattleKey ? { lastBattleKey: store.lastBattleKey } : {}),
    ...(store.lastBattleAt ? { lastBattleAt: store.lastBattleAt } : {}),
  };
}

export interface AttemptItemInput {
  /** 一意な設問キー（例: el1_A::q1::1, vocab::ev:lv1:1, reading::p1::q1） */
  itemKey: string;
  format: OutcomeFormatId;
  correct: boolean;
  /** 既存の進捗・復習記録上ですでに既見と分かっている場合は true */
  alreadyKnownSeen?: boolean;
}

/**
 * 解答結果を一括記録する（週あたり解答数 ＋ 未見問題の正答率推移）。
 * 復習モードや2回目以降の同一設問は dailyAnswers（週の解答数）には入るが、
 * formats（未見正答率推移）には一切混ざらない。
 */
export function recordOutcomeAttempts(
  uid: string | null | undefined,
  items: readonly AttemptItemInput[],
  now = Date.now(),
): LearningOutcomesStore | null {
  if (!uid || items.length === 0) return null;
  const store = loadOutcomesStore(uid);
  const day = toDateKey(now);

  if (!store.firstStudyDay || day < store.firstStudyDay) {
    store.firstStudyDay = day;
  }
  store.dailyAnswers[day] = (store.dailyAnswers[day] || 0) + items.length;

  let unseenTotal = 0;
  let unseenCorrect = 0;

  for (const it of items) {
    if (!SAFE_OUTCOME_KEY(it.itemKey)) continue;
    const seenBefore = Object.prototype.hasOwnProperty.call(store.seen, it.itemKey) || Boolean(it.alreadyKnownSeen);
    if (seenBefore) {
      if (!Object.prototype.hasOwnProperty.call(store.seen, it.itemKey)) store.seen[it.itemKey] = it.correct ? 1 : 0;
      continue;
    }
    store.seen[it.itemKey] = it.correct ? 1 : 0;
    store.formats[it.format] = appendUnseenToTrack(store.formats[it.format], it.correct, now);
    unseenTotal += 1;
    if (it.correct) unseenCorrect += 1;
  }

  const next = pruneOutcomesStore(store);
  saveOutcomesStore(uid, next);

  trackEvent('outcome_ans', { n: items.length });
  if (unseenTotal > 0) trackEvent('outcome_unseen', { n: unseenTotal, ok: unseenCorrect });
  return next;
}

/** 対戦1試合の完了を記録する（転換率の分母） */
export function recordBattleFinished(
  uid: string | null | undefined,
  battleKey: string,
  now = Date.now(),
): void {
  if (!uid || !battleKey) return;
  const store = loadOutcomesStore(uid);
  const safeKey = battleKey.slice(0, 120);
  if (!SAFE_OUTCOME_KEY(safeKey)) return;
  if (!Object.prototype.hasOwnProperty.call(store.battles, safeKey)) {
    store.battles[safeKey] = { at: now, conv: 0 };
    trackEvent('outcome_battle_done');
  }
  store.lastBattleKey = safeKey;
  store.lastBattleAt = now;
  saveOutcomesStore(uid, store);
}

/**
 * 対戦後に「復習ノート登録／復習へ進む」または「単元演習へ進む」を実行したことを記録する。
 * battleKey が省略された場合は直近30分以内の lastBattleKey に紐づける。
 */
export function recordBattleFollowup(
  uid: string | null | undefined,
  action: 'review' | 'practice',
  battleKey?: string,
  now = Date.now(),
): boolean {
  if (!uid) return false;
  const store = loadOutcomesStore(uid);
  let targetKey = battleKey ? battleKey.slice(0, 120) : '';
  if (!targetKey) {
    const withinWindow = store.lastBattleKey && store.lastBattleAt && now - store.lastBattleAt <= 30 * 60 * 1000;
    if (withinWindow && store.lastBattleKey) targetKey = store.lastBattleKey;
  }
  if (!SAFE_OUTCOME_KEY(targetKey)) return false;

  const prev = Object.prototype.hasOwnProperty.call(store.battles, targetKey)
    ? store.battles[targetKey]!
    : { at: now, conv: 0 as const };
  const bit: 1 | 2 = action === 'review' ? 1 : 2;
  const nextConv = ((prev.conv | bit) as 0 | 1 | 2 | 3);
  const wasUnconverted = prev.conv === 0;
  const bitAdded = (prev.conv & bit) === 0;

  store.battles[targetKey] = { at: prev.at || now, conv: nextConv };
  saveOutcomesStore(uid, store);

  if (wasUnconverted) trackEvent('outcome_battle_conv');
  if (bitAdded) {
    trackEvent(action === 'review' ? 'outcome_battle_to_review' : 'outcome_battle_to_practice');
  }
  return true;
}

/** 3-way / CRDT マージ（userDataSyncCore.ts の s_outcomes 用） */
export function mergeOutcomesStores(
  local: LearningOutcomesStore | null | undefined,
  remote: LearningOutcomesStore | null | undefined,
  base?: LearningOutcomesStore | null,
): LearningOutcomesStore {
  const a = isOutcomesStore(local) ? local : emptyOutcomesStore();
  const b = isOutcomesStore(remote) ? remote : emptyOutcomesStore();
  const g = isOutcomesStore(base) ? base : null;

  const firstCandidates = [a.firstStudyDay, b.firstStudyDay]
    .filter((d): d is string => typeof d === 'string' && d.length === 10)
    .sort();
  const firstStudyDay = firstCandidates[0] ?? null;

  const dailyAnswers: Record<string, number> = {};
  for (const d of new Set([...Object.keys(a.dailyAnswers), ...Object.keys(b.dailyAnswers)])) {
    const va = Math.max(0, Number(a.dailyAnswers[d]) || 0);
    const vb = Math.max(0, Number(b.dailyAnswers[d]) || 0);
    if (g && d in g.dailyAnswers) {
      const vg = Math.max(0, Number(g.dailyAnswers[d]) || 0);
      dailyAnswers[d] = Math.max(va, vb, vg + Math.max(0, va - vg) + Math.max(0, vb - vg));
    } else {
      dailyAnswers[d] = Math.max(va, vb);
    }
  }

  const seen: Record<string, 0 | 1> = {};
  for (const [k, v] of [...Object.entries(b.seen), ...Object.entries(a.seen)]) {
    if (SAFE_OUTCOME_KEY(k)) seen[k] = v === 1 ? 1 : 0;
  }
  const battles: Record<string, BattleConversionEntry> = {};
  for (const k of new Set([...Object.keys(a.battles), ...Object.keys(b.battles)])) {
    if (!SAFE_OUTCOME_KEY(k)) continue;
    const ba = Object.prototype.hasOwnProperty.call(a.battles, k) ? a.battles[k] : undefined;
    const bb = Object.prototype.hasOwnProperty.call(b.battles, k) ? b.battles[k] : undefined;
    if (ba && bb) {
      battles[k] = { at: Math.min(ba.at || Date.now(), bb.at || Date.now()), conv: ((ba.conv | bb.conv) & 3) as 0 | 1 | 2 | 3 };
    } else if (ba || bb) {
      const only = (ba || bb)!;
      battles[k] = { at: only.at, conv: (only.conv & 3) as 0 | 1 | 2 | 3 };
    }
  }

  const formats: Partial<Record<OutcomeFormatId, FormatUnseenTrack>> = {};
  for (const fmt of OUTCOME_FORMAT_ORDER) {
    const fa = a.formats[fmt];
    const fb = b.formats[fmt];
    if (!fa && !fb) continue;
    if (fa && !fb) { formats[fmt] = fa; continue; }
    if (!fa && fb) { formats[fmt] = fb; continue; }
    const primary = fa!.total >= fb!.total ? fa! : fb!;
    const secondary = fa === primary ? fb! : fa!;
    const newer = (fa!.updatedAt || 0) >= (fb!.updatedAt || 0) ? fa! : fb!;
    formats[fmt] = {
      total: Math.max(fa!.total, fb!.total),
      correct: primary.correct,
      first10: primary.first10.n >= secondary.first10.n ? primary.first10 : secondary.first10,
      recent20: newer.recent20 || primary.recent20,
      bins: primary.bins,
      updatedAt: Math.max(fa!.updatedAt || 0, fb!.updatedAt || 0),
    };
  }

  const newerLast = (a.lastBattleAt || 0) >= (b.lastBattleAt || 0) ? a : b;
  return pruneOutcomesStore({
    version: 1,
    firstStudyDay,
    dailyAnswers,
    formats,
    seen,
    battles,
    lastBattleKey: newerLast.lastBattleKey,
    lastBattleAt: newerLast.lastBattleAt,
  });
}

/** study_progress/{uid} への軽量サマリー変換（先生ダッシュボード用） */
export function toSyncedOutcomesSummary(store: LearningOutcomesStore): SyncedOutcomesSummary {
  const daily: Record<string, number> = {};
  for (const d of Object.keys(store.dailyAnswers).sort().slice(-56)) {
    const n = Math.max(0, Math.round(Number(store.dailyAnswers[d]) || 0));
    if (n > 0) daily[d] = n;
  }

  let totalBattles = 0;
  let toReview = 0;
  let toPractice = 0;
  let converted = 0;
  for (const b of Object.values(store.battles)) {
    totalBattles += 1;
    if (b.conv & 1) toReview += 1;
    if (b.conv & 2) toPractice += 1;
    if (b.conv > 0) converted += 1;
  }

  const formats: SyncedOutcomesSummary['formats'] = {};
  for (const fmt of OUTCOME_FORMAT_ORDER) {
    const tr = store.formats[fmt];
    if (!tr || tr.total <= 0) continue;
    const recentN = tr.recent20.length;
    const recentC = [...tr.recent20].filter((c) => c === '1').length;
    formats[fmt] = {
      total: tr.total,
      correct: tr.correct,
      firstN: tr.first10.n,
      firstC: tr.first10.c,
      recentN,
      recentC,
      bins: tr.bins.slice(-12).map((b) => [b.n, b.c]),
    };
  }

  return { v: 1, firstDay: store.firstStudyDay, daily, battles: { total: totalBattles, toReview, toPractice, converted }, formats };
}

export function fromSyncedOutcomesSummary(raw: unknown): SyncedOutcomesSummary | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<SyncedOutcomesSummary>;
  if (o.v !== 1) return null;
  const daily: Record<string, number> = {};
  if (o.daily && typeof o.daily === 'object') {
    for (const [k, v] of Object.entries(o.daily)) {
      const n = Number(v);
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && Number.isFinite(n) && n > 0) daily[k] = Math.round(n);
    }
  }
  const b = (o.battles && typeof o.battles === 'object' ? o.battles : {}) as Partial<SyncedOutcomesSummary['battles']>;
  const formats: SyncedOutcomesSummary['formats'] = {};
  if (o.formats && typeof o.formats === 'object') {
    for (const fmt of OUTCOME_FORMAT_ORDER) {
      const f = (o.formats as Record<string, unknown>)[fmt] as Record<string, unknown> | undefined;
      if (!f || typeof f !== 'object') continue;
      const total = Math.max(0, Math.round(Number(f.total) || 0));
      if (total <= 0) continue;
      const binsRaw = Array.isArray(f.bins) ? f.bins : [];
      formats[fmt] = {
        total,
        correct: Math.max(0, Math.round(Number(f.correct) || 0)),
        firstN: Math.max(0, Math.round(Number(f.firstN) || 0)),
        firstC: Math.max(0, Math.round(Number(f.firstC) || 0)),
        recentN: Math.max(0, Math.round(Number(f.recentN) || 0)),
        recentC: Math.max(0, Math.round(Number(f.recentC) || 0)),
        bins: binsRaw
          .filter((pair): pair is [number, number] => Array.isArray(pair) && pair.length === 2)
          .map(([n, c]) => [Math.max(0, Math.round(Number(n) || 0)), Math.max(0, Math.round(Number(c) || 0))]),
      };
    }
  }
  return {
    v: 1,
    firstDay: typeof o.firstDay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.firstDay) ? o.firstDay : null,
    daily,
    battles: {
      total: Math.max(0, Math.round(Number(b.total) || 0)),
      toReview: Math.max(0, Math.round(Number(b.toReview) || 0)),
      toPractice: Math.max(0, Math.round(Number(b.toPractice) || 0)),
      converted: Math.max(0, Math.round(Number(b.converted) || 0)),
    },
    formats,
  };
}

export * from './learningOutcomesAnalytics';
