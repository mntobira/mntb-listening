/** Personal, device-local growth. Not authoritative ranking or a currency with monetary value.
 * Imported from the supplied growth v3 package; public/cloud persistence is deliberately excluded.
 * Durable replay protection lives in growthStore, alongside the progress in one atomic record.
 */
import type { BattleOutcome, BattlePlayerScore } from './types';
import { GACHA_PRINTS, type GachaPrintDef } from '../../data/gachaPrints.generated';
import { ACCESSORY_SLOTS, type AccessorySlot } from './tobiraParts';

// ============================================================
// 経験値（XP）
// ============================================================

/** 参加しただけで入る経験値（負けても0にしない） */
export const XP_PARTICIPATION = 20;
/** 正解1問あたり */
export const XP_PER_CORRECT = 10;
/** 勝利ボーナス */
export const XP_WIN = 50;
/** 引き分けボーナス */
export const XP_DRAW = 25;
/** 3連続正解以上を1回でも作った */
export const XP_STREAK_BONUS = 15;
/** 全問正解 */
export const XP_PERFECT_BONUS = 30;
/** Reward budget for the local progression system. */
export const XP_PER_MATCH_MAX = 400;
/** Reward budget for the local progression system. */
export const XP_PER_WRITE_MAX = 600;
/** Reward budget for the local progression system. */
export const COINS_PER_WRITE_MAX = 200;

/** 1試合ぶんの経験値の内訳 */
export interface XpBreakdown {
  participation: number;
  correct: number;
  outcome: number;
  streak: number;
  perfect: number;
  total: number;
}

/**
 * 1試合ぶんの経験値を計算する。
 *
 * @param score   自分の採点結果（battleCore.scoreBattlePlayer の出力）
 * @param outcome 自分から見た勝敗
 * @param forfeit 不戦勝／不戦敗（勝利ボーナスは半分にする。
 *                相手が来なかった試合で満額入ると「待つだけで稼げる」）
 */
export function xpForMatch(
  score: BattlePlayerScore,
  outcome: BattleOutcome,
  forfeit = false,
): XpBreakdown {
  const total = score.perQuestion.length;
  const participation = XP_PARTICIPATION;
  const correct = score.correctCount * XP_PER_CORRECT;
  let outcomeXp = outcome === 'win' ? XP_WIN : outcome === 'draw' ? XP_DRAW : 0;
  if (forfeit) outcomeXp = Math.floor(outcomeXp / 2);
  const streak = score.maxStreak >= 3 ? XP_STREAK_BONUS : 0;
  const perfect = total > 0 && score.correctCount === total ? XP_PERFECT_BONUS : 0;
  const sum = Math.min(XP_PER_MATCH_MAX, participation + correct + outcomeXp + streak + perfect);
  return { participation, correct, outcome: outcomeXp, streak, perfect, total: sum };
}

// ============================================================
// レベル
// ============================================================

/** レベル上限（これ以上は経験値だけ積む） */
export const LEVEL_MAX = 99;

/**
 * レベル n に到達するのに必要な★累積★経験値。
 *
 * ■ 曲線の選び方
 *   序盤は1〜2試合で上がり（Lv2=60, Lv3=241, Lv5=520前後）、
 *   Lv10 で約2,400（≒15試合）、Lv30 で約14,000（≒100試合）。
 *   「毎日1〜2試合の人が3ヶ月で Lv30 前後」を目標にした。
 *   二次曲線（n^2）にすると後半が急すぎて止まるので、1.6乗にしている。
 */
export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(60 * Math.pow(level - 1, 1.6) + 50 * (level - 2));
}

export interface LevelInfo {
  level: number;
  /** いまのレベルに入ってから稼いだ経験値 */
  into: number;
  /** つぎのレベルまでに必要な経験値（最大レベルなら 0） */
  span: number;
  /** 0〜1 の進捗 */
  ratio: number;
}

/** 累積経験値 → レベル情報 */
export function levelOf(xp: number): LevelInfo {
  const safe = Number.isFinite(xp) && xp > 0 ? Math.floor(xp) : 0;
  let level = 1;
  while (level < LEVEL_MAX && safe >= xpRequiredForLevel(level + 1)) level += 1;
  const base = xpRequiredForLevel(level);
  const next = level >= LEVEL_MAX ? base : xpRequiredForLevel(level + 1);
  const span = Math.max(0, next - base);
  const into = safe - base;
  return {
    level,
    into,
    span,
    ratio: span === 0 ? 1 : Math.max(0, Math.min(1, into / span)),
  };
}

// ============================================================
// 成長の記録（Firestore の battle_progress/{uid} と同じ形）
// ============================================================

/** 教科ごとの成績（ジャンル別統計） */
export interface SubjectProgress {
  matches: number;
  wins: number;
  /** 正解数 */
  correct: number;
  /** 解答した（権利があった）問題数 */
  answered: number;
}

export interface DailyRecord {
  /** YYYY-MM-DD */
  date: string;
  /** ミッションID → 進捗の数 */
  progress: Record<string, number>;
  /** 受け取り済みミッションID */
  claimed: string[];
}

/**
 * 1人ぶんの成長記録。
 *
 * ★レート（battle_ranking）と分けている理由★
 * battle_ranking は「1試合で勝敗がちょうど1増える」など
 * 厳格なルールで守られている。そこに経験値・バッジ・装備を混ぜると、
 * ミッション達成（試合ではない）で書けなくなるか、
 * ルールを緩めてレートの守りを弱めるかの二択になる。
 * 成長記録は「見せる／飾る」ためのもので、勝敗の真正性とは独立に扱う。
 */
export interface GrowthProgress {
  uid: string;
  /** 累積経験値（減らない） */
  xp: number;
  /** ミッション報酬などで貯まる通貨（装備の交換に使う） */
  coins: number;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  /** 累計正解数 */
  correct: number;
  /** 累計解答数 */
  answered: number;
  /** 1試合内の最高連続正解 */
  bestStreak: number;
  /** 全問正解した試合数 */
  perfectGames: number;
  /** 早押しモードでの勝利数 */
  buzzWins: number;
  /** 学習で埋めた穴の累計 */
  holesFilled: number;
  /** ログイン（対戦モードを開いた）日数 */
  loginDays: number;
  /** 最後に数えた日（YYYY-MM-DD、端末ローカル） */
  lastLoginDate: string;
  /** 連続ログイン日数 */
  loginStreak: number;
  /** デイリーコンプリート宝箱：連続で開けた日数 */
  completeStreak: number;
  /** デイリーコンプリート宝箱：開けた日数の累計 */
  completeDays: number;
  /** デイリーコンプリート宝箱：最後に開けた日（YYYY-MM-DD） */
  lastCompleteDate: string;
  /** 教科ID → 成績 */
  subjects: Record<string, SubjectProgress>;
  /** 獲得したバッジID → 獲得時刻（epoch ms） */
  badges: Record<string, number>;
  /** 所持している装備のID */
  owned: string[];
  /** いま身につけているもの */
  equipped: {
    /** 称号（バッジIDまたは '' でレート称号を使う） */
    title: string;
    /** 扉くんのポーズ */
    pose: string;
    /** 枠の色 */
    frame: string;
    /** 部位ごとのアクセサリ（'' = つけない） */
    hat: string;
    glasses: string;
    cheek: string;
    aura: string;
    /** アプリの壁紙（'' = いつもの背景） */
    wallpaper: string;
  };
  /** 今日のミッション進捗 */
  daily: DailyRecord;
  /** 直前に反映した部屋ID（同じ試合の二重反映を防ぐ） */
  lastRoomId: string;
  /** 演習で得点した大問の累計（同じ大問は1日1回まで数える） */
  studySolved: number;
  /** マナラッシュ（60秒チャレンジ）の挑戦回数 */
  rushPlays: number;
  /** マナラッシュの自己ベスト（全教科） */
  rushBest: number;
  /** マナラッシュの最高コンボ */
  rushBestCombo: number;
  /** 教科ID → マナラッシュ自己ベスト */
  rushBestBy: Record<string, number>;
}

export const DEFAULT_POSE = 'pose_basic';
export const DEFAULT_FRAME = 'frame_paper';

/** 初期値 */
export function emptyProgress(uid: string): GrowthProgress {
  return {
    uid,
    xp: 0,
    coins: 0,
    matches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    correct: 0,
    answered: 0,
    bestStreak: 0,
    perfectGames: 0,
    buzzWins: 0,
    holesFilled: 0,
    loginDays: 0,
    lastLoginDate: '',
    loginStreak: 0,
    completeStreak: 0,
    completeDays: 0,
    lastCompleteDate: '',
    subjects: {},
    badges: {},
    owned: [DEFAULT_POSE, DEFAULT_FRAME],
    equipped: { title: '', pose: DEFAULT_POSE, frame: DEFAULT_FRAME, hat: '', glasses: '', cheek: '', aura: '', wallpaper: '' },
    daily: { date: '', progress: {}, claimed: [] },
    lastRoomId: '',
    studySolved: 0,
    rushPlays: 0,
    rushBest: 0,
    rushBestCombo: 0,
    rushBestBy: {},
  };
}

/**
 * Firestore から読んだ生データを安全な形に直す。
 * 欠けているフィールドは初期値で埋め、型が違えば捨てる。
 * （古い版で書かれた記録や、壊れた記録でも画面を落とさない）
 */
export function normalizeProgress(uid: string, raw: unknown): GrowthProgress {
  const base = emptyProgress(uid);
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown, d: number) =>
    typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.min(10000000, Math.floor(v)) : d;
  const str = (v: unknown, d: string) => (typeof v === 'string' ? v : d);
  const strList = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

  const subjects: Record<string, SubjectProgress> = {};
  if (r.subjects && typeof r.subjects === 'object') {
    for (const [k, v] of Object.entries(r.subjects as Record<string, unknown>)) {
      if (!/^[a-z][a-z0-9_]{0,40}$/.test(k) || ['constructor', 'prototype'].includes(k)) continue;
      const s = (v ?? {}) as Record<string, unknown>;
      subjects[k] = {
        matches: num(s.matches, 0),
        wins: num(s.wins, 0),
        correct: num(s.correct, 0),
        answered: num(s.answered, 0),
      };
    }
  }
  const badges: Record<string, number> = {};
  if (r.badges && typeof r.badges === 'object') {
    for (const [k, v] of Object.entries(r.badges as Record<string, unknown>)) {
      if (BADGES.some(b => b.id === k) && typeof v === 'number' && Number.isFinite(v) && v >= 0) badges[k] = v;
    }
  }
  const eq = (r.equipped ?? {}) as Record<string, unknown>;
  const daily = (r.daily ?? {}) as Record<string, unknown>;
  const progress: Record<string, number> = {};
  if (daily.progress && typeof daily.progress === 'object') {
    for (const [k, v] of Object.entries(daily.progress as Record<string, unknown>)) {
      if (missionById(k)) progress[k] = num(v, 0);
    }
  }
  return {
    uid,
    xp: num(r.xp, 0),
    coins: num(r.coins, 0),
    matches: num(r.matches, 0),
    wins: num(r.wins, 0),
    losses: num(r.losses, 0),
    draws: num(r.draws, 0),
    correct: num(r.correct, 0),
    answered: num(r.answered, 0),
    bestStreak: num(r.bestStreak, 0),
    perfectGames: num(r.perfectGames, 0),
    buzzWins: num(r.buzzWins, 0),
    holesFilled: num(r.holesFilled, 0),
    loginDays: num(r.loginDays, 0),
    lastLoginDate: str(r.lastLoginDate, ''),
    loginStreak: num(r.loginStreak, 0),
    completeStreak: num(r.completeStreak, 0),
    completeDays: num(r.completeDays, 0),
    lastCompleteDate: str(r.lastCompleteDate, ''),
    subjects,
    badges,
    owned: [...new Set([DEFAULT_POSE, DEFAULT_FRAME, ...strList(r.owned)])],
    equipped: {
      title: str(eq.title, ''),
      pose: str(eq.pose, DEFAULT_POSE),
      frame: str(eq.frame, DEFAULT_FRAME),
      hat: str(eq.hat, ''),
      glasses: str(eq.glasses, ''),
      cheek: str(eq.cheek, ''),
      aura: str(eq.aura, ''),
      wallpaper: str(eq.wallpaper, ''),
    },
    daily: {
      date: str(daily.date, ''),
      progress,
      claimed: strList(daily.claimed),
    },
    lastRoomId: str(r.lastRoomId, ''),
    studySolved: num(r.studySolved, 0),
    rushPlays: num(r.rushPlays, 0),
    rushBest: num(r.rushBest, 0),
    rushBestCombo: num(r.rushBestCombo, 0),
    rushBestBy: normalizeBestBy(r.rushBestBy, num),
  };
}

function normalizeBestBy(raw: unknown, num: (v: unknown, d: number) => number): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^[a-z][a-z0-9_]{0,40}$/.test(k) || ['constructor', 'prototype'].includes(k)) continue;
    const n = num(v, 0);
    if (n > 0) out[k] = n;
  }
  return out;
}

// ============================================================
// 日付ユーティリティ（端末ローカル）
// ============================================================

/** YYYY-MM-DD（端末のローカル日付。ミッションは「その人の今日」で切る） */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isNextDay(prev: string, today: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(prev) || !/^\d{4}-\d{2}-\d{2}$/.test(today)) return false;
  const a = new Date(`${prev}T00:00:00`);
  const b = new Date(`${today}T00:00:00`);
  const diff = Math.round((b.getTime() - a.getTime()) / 86_400_000);
  return diff === 1;
}

/** 日付が変わっていたらミッション進捗を作り直す */
export function rolloverDaily(daily: DailyRecord, today: string): DailyRecord {
  if (daily.date === today) {
    return { date: today, progress: { ...daily.progress }, claimed: [...daily.claimed] };
  }
  return { date: today, progress: {}, claimed: [] };
}

// ============================================================
// 試合の要約（反映に必要な最小限）
// ============================================================

export interface MatchSummaryForGrowth {
  roomId: string;
  subject: string;
  outcome: BattleOutcome;
  /** 早押しモードか */
  buzz: boolean;
  forfeit: boolean;
  score: BattlePlayerScore;
  /** 解答権があった問題数（早押しでは権利を取った数、通常は全問） */
  answeredCount: number;
  /** この試合で埋まった穴の数 */
  holesFilled: number;
  /** 自分と相手の正解数の差（相手がいないときは undefined）。「接戦で勝つ」ミッションに使う */
  marginCorrect?: number;
}

// ============================================================
// デイリーミッション
// ============================================================

export type MissionKind =
  | 'matches'
  | 'correct'
  | 'win'
  | 'buzz_win'
  | 'holes'
  | 'streak'
  | 'perfect'
  | 'study'
  | 'rush_play'
  | 'rush_score'
  | 'rush_combo'
  | 'study_streak'
  | 'gacha'
  | 'equip'
  | 'vocab_quiz'     // 英単語の4択を1セット（10問）解く
  | 'vocab_perfect'  // 英単語の4択で満点
  | 'vocab_learn'    // 単語帳で「覚えた」をつける
  // ── 2026-10-01 ミッション拡充（対戦の中身で進む。どれも試合の採点結果だけで判定できる）──
  | 'score'          // 1試合で○点以上
  | 'speedy'         // 速さボーナスがついた正解（3秒以内の正解など）
  | 'listening'      // リスニングで対戦
  | 'grammar'        // 英文法で対戦
  | 'comeback';      // 勝つ（負けている場面からの逆転は記録が無いので「接戦で勝つ」で判定）

export interface MissionDef {
  id: string;
  kind: MissionKind;
  label: string;
  goal: number;
  /** 達成報酬 */
  rewardXp: number;
  rewardCoins: number;
  /** 1試合でどれだけ進むか */
  countMatch: (m: MatchSummaryForGrowth) => number;
}

/**
 * ミッションの全候補。日替わりで3つを選ぶ。
 *
 * ★「対戦以外」でも進むものを必ず1つ入れる★（holes）。
 * 対戦に勝てない日でも、学習で穴を埋めれば報酬が受け取れるようにする。
 * 競争が苦手な層の受け皿（エグゼクティブサマリ §6）。
 */
export const MISSION_POOL: readonly MissionDef[] = [
  { id: 'm_play2', kind: 'matches', label: '対戦を2回する', goal: 2, rewardXp: 40, rewardCoins: 20, countMatch: () => 1 },
  { id: 'm_play3', kind: 'matches', label: '対戦を3回する', goal: 3, rewardXp: 60, rewardCoins: 30, countMatch: () => 1 },
  { id: 'm_correct5', kind: 'correct', label: '5問せいかいする', goal: 5, rewardXp: 40, rewardCoins: 20, countMatch: (m) => m.score.correctCount },
  { id: 'm_correct10', kind: 'correct', label: '10問せいかいする', goal: 10, rewardXp: 70, rewardCoins: 35, countMatch: (m) => m.score.correctCount },
  { id: 'm_win1', kind: 'win', label: '1回かつ', goal: 1, rewardXp: 50, rewardCoins: 25, countMatch: (m) => (m.outcome === 'win' && !m.forfeit ? 1 : 0) },
  { id: 'm_streak3', kind: 'streak', label: '3連続せいかいを出す', goal: 1, rewardXp: 40, rewardCoins: 20, countMatch: (m) => (m.score.maxStreak >= 3 ? 1 : 0) },
  { id: 'm_perfect', kind: 'perfect', label: '全問せいかいする', goal: 1, rewardXp: 80, rewardCoins: 40, countMatch: (m) => (m.score.perQuestion.length > 0 && m.score.correctCount === m.score.perQuestion.length ? 1 : 0) },
  { id: 'm_holes1', kind: 'holes', label: '復習を1問できたにする', goal: 1, rewardXp: 40, rewardCoins: 20, countMatch: (m) => m.holesFilled },
  { id: 'm_holes3', kind: 'holes', label: '復習を3問できたにする', goal: 3, rewardXp: 80, rewardCoins: 40, countMatch: (m) => m.holesFilled },
  // ── 2026-10-01 D 追加（対戦）──
  { id: 'm_play5', kind: 'matches', label: '対戦を5回する', goal: 5, rewardXp: 90, rewardCoins: 40, countMatch: () => 1 },
  { id: 'm_correct20', kind: 'correct', label: '20問せいかいする', goal: 20, rewardXp: 110, rewardCoins: 50, countMatch: (m) => m.score.correctCount },
  { id: 'm_win2', kind: 'win', label: '2回かつ', goal: 2, rewardXp: 90, rewardCoins: 40, countMatch: (m) => (m.outcome === 'win' && !m.forfeit ? 1 : 0) },
  { id: 'm_streak5', kind: 'streak', label: '5連続せいかいを出す', goal: 1, rewardXp: 70, rewardCoins: 30, countMatch: (m) => (m.score.maxStreak >= 5 ? 1 : 0) },
  { id: 'm_holes5', kind: 'holes', label: '復習を5問できたにする', goal: 5, rewardXp: 110, rewardCoins: 50, countMatch: (m) => m.holesFilled },
  // ── 2026-10-01 追加（対戦の中身）──
  { id: 'm_score300', kind: 'score', label: '1試合で300点以上とる', goal: 1, rewardXp: 50, rewardCoins: 25, countMatch: (m) => (m.score.score >= 300 ? 1 : 0) },
  { id: 'm_score600', kind: 'score', label: '1試合で600点以上とる', goal: 1, rewardXp: 90, rewardCoins: 40, countMatch: (m) => (m.score.score >= 600 ? 1 : 0) },
  { id: 'm_speedy3', kind: 'speedy', label: '速さボーナスつきで3問正解', goal: 3, rewardXp: 50, rewardCoins: 25, countMatch: (m) => m.score.perQuestion.filter((q) => q.correct && q.speed > 0).length },
  { id: 'm_speedy8', kind: 'speedy', label: '速さボーナスつきで8問正解', goal: 8, rewardXp: 100, rewardCoins: 45, countMatch: (m) => m.score.perQuestion.filter((q) => q.correct && q.speed > 0).length },
  { id: 'm_listen2', kind: 'listening', label: 'リスニングで2回対戦する', goal: 2, rewardXp: 50, rewardCoins: 25, countMatch: (m) => (m.subject === 'english_listening' ? 1 : 0) },
  { id: 'm_grammar2', kind: 'grammar', label: '英文法で2回対戦する', goal: 2, rewardXp: 50, rewardCoins: 25, countMatch: (m) => (m.subject === 'english_grammar' ? 1 : 0) },
  { id: 'm_close_win', kind: 'comeback', label: '接戦（2問差以内）で勝つ', goal: 1, rewardXp: 80, rewardCoins: 40, countMatch: (m) => (m.outcome === 'win' && !m.forfeit && (m.marginCorrect ?? 99) <= 2 ? 1 : 0) },
  { id: 'm_streak7', kind: 'streak', label: '7連続せいかいを出す', goal: 1, rewardXp: 110, rewardCoins: 50, countMatch: (m) => (m.score.maxStreak >= 7 ? 1 : 0) },
];

/** 1日に出すミッション数 */
export const MISSIONS_PER_DAY = 3;

/** 決定論的ハッシュ（日付から同じ組を選ぶため） */
function hashOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * その日のミッション3つ。
 *
 * ★端末やユーザーに関係なく、日付だけで決まる★
 * 友達と「今日のミッション」を話題にできるように全員同じにする。
 * 必ず「穴を埋める」系を1つ、対戦系を2つ（同じ kind は重ねない）。
 */
export function missionsForDate(date: string): MissionDef[] {
  const seed = hashOf(date);
  const holes = MISSION_POOL.filter((m) => m.kind === 'holes');
  const others = MISSION_POOL.filter((m) => m.kind !== 'holes');
  const picked: MissionDef[] = [];
  const h = holes[seed % holes.length];
  if (h) picked.push(h);
  let cursor = Math.floor(seed / 7);
  const usedKinds = new Set<MissionKind>();
  const pool = [...others];
  while (picked.length < MISSIONS_PER_DAY && pool.length > 0) {
    const idx = cursor % pool.length;
    const m = pool.splice(idx, 1)[0];
    cursor = Math.floor(cursor / 3) + 11;
    if (!m || usedKinds.has(m.kind)) continue;
    usedKinds.add(m.kind);
    picked.push(m);
  }
  return picked;
}

/**
 * ボーナスミッション（演習・マナラッシュで進む）。毎日2つ。
 *
 * ★対戦用の3つ（missionsForDate）とは別枠★
 * 対戦ミッションの組み合わせ・報酬上限の検査はそのまま残し、
 * 「ひとりで遊ぶ」導線にも毎日の目標を置くために足した。
 * 必ず「演習」系を1つ、「マナラッシュ」系を1つ。
 */
export const BONUS_MISSION_POOL: readonly MissionDef[] = [
  { id: 'x_study3', kind: 'study', label: '演習で大問を3問とく', goal: 3, rewardXp: 40, rewardCoins: 20, countMatch: () => 0 },
  { id: 'x_study5', kind: 'study', label: '演習で大問を5問とく', goal: 5, rewardXp: 60, rewardCoins: 30, countMatch: () => 0 },
  { id: 'x_study8', kind: 'study', label: '演習で大問を8問とく', goal: 8, rewardXp: 90, rewardCoins: 40, countMatch: () => 0 },
  { id: 'x_rush1', kind: 'rush_play', label: 'マナラッシュに1回ちょうせん', goal: 1, rewardXp: 30, rewardCoins: 15, countMatch: () => 0 },
  { id: 'x_rush3', kind: 'rush_play', label: 'マナラッシュに3回ちょうせん', goal: 3, rewardXp: 60, rewardCoins: 30, countMatch: () => 0 },
  { id: 'x_rush1500', kind: 'rush_score', label: 'マナラッシュで1500点', goal: 1, rewardXp: 50, rewardCoins: 25, countMatch: () => 0 },
  { id: 'x_combo5', kind: 'rush_combo', label: 'マナラッシュで5コンボ', goal: 1, rewardXp: 50, rewardCoins: 25, countMatch: () => 0 },
  // ── 追加分（演習・マナラッシュ）──
  { id: 'x_study10', kind: 'study', label: '演習で大問を10問とく', goal: 10, rewardXp: 110, rewardCoins: 50, countMatch: () => 0 },
  { id: 'x_rush2', kind: 'rush_play', label: 'マナラッシュに2回ちょうせん', goal: 2, rewardXp: 45, rewardCoins: 20, countMatch: () => 0 },
  { id: 'x_rush2500', kind: 'rush_score', label: 'マナラッシュで2500点', goal: 1, rewardXp: 70, rewardCoins: 35, countMatch: () => 0 },
  { id: 'x_combo10', kind: 'rush_combo', label: 'マナラッシュで10コンボ', goal: 1, rewardXp: 70, rewardCoins: 35, countMatch: () => 0 },
  // ── おたのしみ枠（3つ目のボーナス。遊び方を広げるきっかけ）──
  { id: 'x_gacha1', kind: 'gacha', label: 'ガチャを1回まわす', goal: 1, rewardXp: 20, rewardCoins: 10, countMatch: () => 0 },
  { id: 'x_equip1', kind: 'equip', label: 'とびら君の装飾を着がえる', goal: 1, rewardXp: 20, rewardCoins: 10, countMatch: () => 0 },
  { id: 'x_streak_study3', kind: 'study_streak', label: '演習で3問れんぞく正解', goal: 1, rewardXp: 40, rewardCoins: 20, countMatch: () => 0 },
  // ── 2026-10-01 D 追加：英単語（単語帳・4択）──
  { id: 'x_vocab1', kind: 'vocab_quiz', label: '英単語の4択を1セット解く', goal: 1, rewardXp: 30, rewardCoins: 15, countMatch: () => 0 },
  { id: 'x_vocab3', kind: 'vocab_quiz', label: '英単語の4択を3セット解く', goal: 3, rewardXp: 70, rewardCoins: 30, countMatch: () => 0 },
  { id: 'x_vocab_perfect', kind: 'vocab_perfect', label: '英単語の4択で満点をとる', goal: 1, rewardXp: 60, rewardCoins: 30, countMatch: () => 0 },
  { id: 'x_learn10', kind: 'vocab_learn', label: '単語帳で10語「覚えた」にする', goal: 10, rewardXp: 40, rewardCoins: 20, countMatch: () => 0 },
  { id: 'x_learn30', kind: 'vocab_learn', label: '単語帳で30語「覚えた」にする', goal: 30, rewardXp: 90, rewardCoins: 40, countMatch: () => 0 },
  // ── 2026-10-01 D 追加：演習・おたのしみ ──
  { id: 'x_study1', kind: 'study', label: '演習で大問を1問とく', goal: 1, rewardXp: 20, rewardCoins: 10, countMatch: () => 0 },
  { id: 'x_streak_study5', kind: 'study_streak', label: '演習で5問れんぞく正解', goal: 1, rewardXp: 70, rewardCoins: 30, countMatch: () => 0 },
  { id: 'x_gacha5', kind: 'gacha', label: 'ガチャを5回まわす', goal: 5, rewardXp: 40, rewardCoins: 15, countMatch: () => 0 },
  // ── 2026-10-01 追加：ボーナス ──
  { id: 'x_study15', kind: 'study', label: '演習で大問を15問とく', goal: 15, rewardXp: 150, rewardCoins: 60, countMatch: () => 0 },
  { id: 'x_rush5', kind: 'rush_play', label: 'マナラッシュに5回ちょうせん', goal: 5, rewardXp: 90, rewardCoins: 40, countMatch: () => 0 },
  { id: 'x_rush4000', kind: 'rush_score', label: 'マナラッシュで4000点（Sランク）', goal: 1, rewardXp: 120, rewardCoins: 50, countMatch: () => 0 },
  { id: 'x_combo15', kind: 'rush_combo', label: 'マナラッシュで15コンボ', goal: 1, rewardXp: 100, rewardCoins: 45, countMatch: () => 0 },
  { id: 'x_equip2', kind: 'equip', label: 'とびら君の装飾を2回着がえる', goal: 2, rewardXp: 30, rewardCoins: 15, countMatch: () => 0 },
  { id: 'x_streak_study8', kind: 'study_streak', label: '演習で8問れんぞく正解', goal: 1, rewardXp: 100, rewardCoins: 45, countMatch: () => 0 },
  { id: 'x_vocab5', kind: 'vocab_quiz', label: '英単語の4択を5セット解く', goal: 5, rewardXp: 110, rewardCoins: 50, countMatch: () => 0 },
  { id: 'x_vocab_perfect2', kind: 'vocab_perfect', label: '英単語の4択で2回満点をとる', goal: 2, rewardXp: 110, rewardCoins: 50, countMatch: () => 0 },
  { id: 'x_learn50', kind: 'vocab_learn', label: '単語帳で50語「覚えた」にする', goal: 50, rewardXp: 130, rewardCoins: 55, countMatch: () => 0 },
  { id: 'x_learn20', kind: 'vocab_learn', label: '単語帳で20語「覚えた」にする', goal: 20, rewardXp: 65, rewardCoins: 30, countMatch: () => 0 },
];

/** 2026-10-01 D：3 → 5（演習・ラッシュ・おたのしみ・英単語×2） */
export const BONUS_MISSIONS_PER_DAY = 5;
/** マナラッシュのスコア系ミッションの基準（ミッションIDごと） */
export const RUSH_SCORE_GOALS: Record<string, number> = { x_rush1500: 1500, x_rush2500: 2500, x_rush4000: 4000 };
export const RUSH_COMBO_GOALS: Record<string, number> = { x_combo5: 5, x_combo10: 10, x_combo15: 15 };
/** 演習の「n問れんぞく正解」ミッションの n */
export const STUDY_STREAK_GOALS: Record<string, number> = { x_streak_study3: 3, x_streak_study5: 5, x_streak_study8: 8 };

/** その日のボーナスミッション（演習1＋マナラッシュ1＋おたのしみ1＋英単語の4択1＋単語帳1）。日付だけで決まる */
export function bonusMissionsForDate(date: string): MissionDef[] {
  const seed = hashOf(`bonus:${date}`);
  const study = BONUS_MISSION_POOL.filter((m) => m.kind === 'study');
  const rush = BONUS_MISSION_POOL.filter((m) => m.kind.startsWith('rush_'));
  const fun = BONUS_MISSION_POOL.filter((m) => m.kind === 'gacha' || m.kind === 'equip' || m.kind === 'study_streak');
  const vocabQuiz = BONUS_MISSION_POOL.filter((m) => m.kind === 'vocab_quiz' || m.kind === 'vocab_perfect');
  const vocabLearn = BONUS_MISSION_POOL.filter((m) => m.kind === 'vocab_learn');
  return [study[seed % study.length]!, rush[Math.floor(seed / 5) % rush.length]!, fun[Math.floor(seed / 37) % fun.length]!,
    vocabQuiz[Math.floor(seed / 101) % vocabQuiz.length]!, vocabLearn[Math.floor(seed / 211) % vocabLearn.length]!];
}

/** 対戦3つ＋ボーナス2つ（画面に並べる全部） */
export function allMissionsForDate(date: string): MissionDef[] {
  return [...missionsForDate(date), ...bonusMissionsForDate(date)];
}

export function missionById(id: string): MissionDef | undefined {
  return MISSION_POOL.find((m) => m.id === id) ?? BONUS_MISSION_POOL.find((m) => m.id === id);
}

/** 今日のミッションにだけ進捗を足す（対戦系以外の入口で使う） */
function bumpMissions(daily: DailyRecord, today: string, gains: Partial<Record<MissionKind, number>> | ((m: MissionDef) => number)): DailyRecord {
  const next = rolloverDaily(daily, today);
  for (const m of allMissionsForDate(today)) {
    const gain = typeof gains === 'function' ? gains(m) : (gains[m.kind] ?? 0);
    if (gain <= 0) continue;
    const before = next.progress[m.id] ?? 0;
    next.progress[m.id] = Math.min(m.goal, before + gain);
  }
  return next;
}

// ============================================================
// 演習（ひとりで解く）の報酬
// ============================================================

/** 演習で大問を1問得点したときの報酬 */
export const STUDY_REWARD = { xp: 15, coins: 3 } as const;

export function applyStudySolved(progress: GrowthProgress, today: string, now: number = Date.now(), streak = 0): { next: GrowthProgress; reward: { xp: number; coins: number } } {
  const next: GrowthProgress = {
    ...progress,
    xp: progress.xp + STUDY_REWARD.xp,
    coins: progress.coins + STUDY_REWARD.coins,
    studySolved: progress.studySolved + 1,
    daily: bumpMissions(progress.daily, today, (m) => {
      if (m.kind === 'study') return 1;
      // 「n問れんぞく正解」はミッションごとの n で判定（以前は3以上なら5問・8問も進んでいた）
      if (m.kind === 'study_streak') return streak >= (STUDY_STREAK_GOALS[m.id] ?? 3) ? 1 : 0;
      return 0;
    }),
  };
  return { next: withAchievements(next, now), reward: { ...STUDY_REWARD } };
}

// ============================================================
// マナラッシュ（60秒チャレンジ）
// ============================================================

export interface RushResult {
  /** 一意なID（二重反映の防止に使う） */
  runId: string;
  subject: string;
  score: number;
  correct: number;
  answered: number;
  maxCombo: number;
}

/** マナラッシュで報酬コインがもらえるのは1日この回数まで（XPは毎回） */
export const RUSH_COIN_PLAYS_PER_DAY = 5;
export const RUSH_SCORE_MISSION = 1500;
export const RUSH_COMBO_MISSION = 5;

/** 1回ぶんの報酬（上限つき。1回の書き込み上限に必ず収まる） */
export function rushRewardFor(r: RushResult, coinEligible: boolean): { xp: number; coins: number } {
  const xp = Math.min(150, 10 + r.correct * 6 + Math.floor(r.maxCombo / 3) * 5);
  const coins = coinEligible ? Math.min(40, 5 + Math.floor(Math.max(0, r.score) / 150)) : 0;
  return { xp, coins };
}

/** 成績のランク（S/A/B/C） */
export function rushRankOf(score: number): 'S' | 'A' | 'B' | 'C' {
  if (score >= 4000) return 'S';
  if (score >= 2500) return 'A';
  if (score >= 1200) return 'B';
  return 'C';
}

export function applyRushResult(
  progress: GrowthProgress,
  r: RushResult,
  today: string,
  coinEligible: boolean,
  now: number = Date.now(),
): { next: GrowthProgress; reward: { xp: number; coins: number }; newBest: boolean; newSubjectBest: boolean } {
  const reward = rushRewardFor(r, coinEligible);
  const score = Math.max(0, Math.floor(r.score));
  const prevSubject = progress.rushBestBy[r.subject] ?? 0;
  const next: GrowthProgress = {
    ...progress,
    xp: progress.xp + reward.xp,
    coins: progress.coins + reward.coins,
    rushPlays: progress.rushPlays + 1,
    rushBest: Math.max(progress.rushBest, score),
    rushBestCombo: Math.max(progress.rushBestCombo, r.maxCombo),
    rushBestBy: { ...progress.rushBestBy, [r.subject]: Math.max(prevSubject, score) },
    daily: bumpMissions(progress.daily, today, (m) => {
      if (m.kind === 'rush_play') return 1;
      if (m.kind === 'rush_score') return score >= (RUSH_SCORE_GOALS[m.id] ?? RUSH_SCORE_MISSION) ? 1 : 0;
      if (m.kind === 'rush_combo') return r.maxCombo >= (RUSH_COMBO_GOALS[m.id] ?? RUSH_COMBO_MISSION) ? 1 : 0;
      return 0;
    }),
  };
  return {
    next: withAchievements(next, now),
    reward,
    newBest: score > progress.rushBest,
    newSubjectBest: score > prevSubject,
  };
}

/** ガチャ・着がえなど、報酬なしで「今日のミッション」だけ進める */
export function bumpDailyMission(progress: GrowthProgress, kind: MissionKind, today: string, amount = 1): GrowthProgress {
  const daily = bumpMissions(progress.daily, today, { [kind]: amount });
  return { ...progress, daily };
}

/** before → after で「新しく達成した」ミッション（受け取り前）。通知に使う */
export function newlyCompletedMissions(before: GrowthProgress, after: GrowthProgress, today: string): MissionDef[] {
  if (after.daily.date !== today) return [];
  const prev = before.daily.date === today ? before.daily.progress : {};
  return allMissionsForDate(today).filter((m) => (after.daily.progress[m.id] ?? 0) >= m.goal && (prev[m.id] ?? 0) < m.goal && !after.daily.claimed.includes(m.id));
}

/** 受け取れる（達成済み・未受け取り）か */
export function canClaimMission(progress: GrowthProgress, id: string, today: string): boolean {
  if (progress.daily.date !== today) return false;
  const m = missionById(id);
  if (!m) return false;
  if (progress.daily.claimed.includes(id)) return false;
  return (progress.daily.progress[id] ?? 0) >= m.goal;
}

/** ミッション報酬を受け取る */
export function claimMission(
  progress: GrowthProgress,
  id: string,
  today: string,
): { next: GrowthProgress; reward: { xp: number; coins: number } | null } {
  if (!canClaimMission(progress, id, today)) return { next: progress, reward: null };
  const m = missionById(id);
  if (!m) return { next: progress, reward: null };
  const next: GrowthProgress = {
    ...progress,
    xp: progress.xp + m.rewardXp,
    coins: progress.coins + m.rewardCoins,
    daily: { ...progress.daily, claimed: [...progress.daily.claimed, id] },
  };
  return { next: withAchievements(next), reward: { xp: m.rewardXp, coins: m.rewardCoins } };
}

// ============================================================
// バッジ（称号としても使える）
// ============================================================

export interface BadgeDef {
  id: string;
  label: string;
  desc: string;
  /** 葉モジュールなので UI 部品を持てない。絵文字で表す */
  emoji: string;
  /** 希少度（並び順と色に使う） */
  tier: 1 | 2 | 3;
  earned: (p: GrowthProgress) => boolean;
}

export const BADGES: readonly BadgeDef[] = [
  { id: 'b_first_match', label: 'はじめの一歩', desc: '初めて対戦した', emoji: '◆', tier: 1, earned: (p) => p.matches >= 1 },
  { id: 'b_first_win', label: '初勝利', desc: '初めて勝った', emoji: '◆', tier: 1, earned: (p) => p.wins >= 1 },
  { id: 'b_matches_10', label: '常連', desc: '10試合こなした', emoji: '◆', tier: 1, earned: (p) => p.matches >= 10 },
  { id: 'b_matches_50', label: '歴戦', desc: '50試合こなした', emoji: '◆', tier: 2, earned: (p) => p.matches >= 50 },
  { id: 'b_matches_100', label: '百戦', desc: '100試合こなした', emoji: '◆', tier: 3, earned: (p) => p.matches >= 100 },
  { id: 'b_wins_10', label: '十勝', desc: '10回勝った', emoji: '◆', tier: 2, earned: (p) => p.wins >= 10 },
  { id: 'b_wins_50', label: '五十勝', desc: '50回勝った', emoji: '◆', tier: 3, earned: (p) => p.wins >= 50 },
  { id: 'b_streak_5', label: '五連鎖', desc: '1試合で5問連続正解', emoji: '◆', tier: 2, earned: (p) => p.bestStreak >= 5 },
  { id: 'b_streak_8', label: '八連鎖', desc: '1試合で8問連続正解', emoji: '◆', tier: 3, earned: (p) => p.bestStreak >= 8 },
  { id: 'b_perfect', label: 'パーフェクト', desc: '全問正解で試合を終えた', emoji: '◆', tier: 2, earned: (p) => p.perfectGames >= 1 },
  { id: 'b_perfect_5', label: '完璧主義', desc: '全問正解を5回', emoji: '◆', tier: 3, earned: (p) => p.perfectGames >= 5 },
  { id: 'b_holes_10', label: '復習職人', desc: '復習で10問できた', emoji: '◆', tier: 2, earned: (p) => p.holesFilled >= 10 },
  { id: 'b_holes_50', label: '復習達人', desc: '復習で50問できた', emoji: '◆', tier: 3, earned: (p) => p.holesFilled >= 50 },
  { id: 'b_correct_100', label: '百問正解', desc: '累計100問正解', emoji: '◆', tier: 1, earned: (p) => p.correct >= 100 },
  { id: 'b_correct_500', label: '五百問正解', desc: '累計500問正解', emoji: '◆', tier: 2, earned: (p) => p.correct >= 500 },
  { id: 'b_login_7', label: '七日通い', desc: '7日連続でボーナスを受け取った', emoji: '◆', tier: 2, earned: (p) => p.loginStreak >= 7 },
  { id: 'b_login_30', label: '皆勤', desc: '30日ぶんボーナスを受け取った', emoji: '◆', tier: 3, earned: (p) => p.loginDays >= 30 },
  { id: 'b_chest_7', label: '宝箱七連', desc: '7日連続でコンプリート宝箱を開けた', emoji: '◆', tier: 2, earned: (p) => p.completeStreak >= 7 },
  { id: 'b_chest_30', label: '宝箱コレクター', desc: 'コンプリート宝箱を通算30回開けた', emoji: '◆', tier: 3, earned: (p) => p.completeDays >= 30 },
  { id: 'b_level_10', label: 'Lv.10', desc: 'レベル10に到達', emoji: '◆', tier: 1, earned: (p) => levelOf(p.xp).level >= 10 },
  { id: 'b_level_30', label: 'Lv.30', desc: 'レベル30に到達', emoji: '◆', tier: 2, earned: (p) => levelOf(p.xp).level >= 30 },
  { id: 'b_level_50', label: 'Lv.50', desc: 'レベル50に到達', emoji: '◆', tier: 3, earned: (p) => levelOf(p.xp).level >= 50 },
  { id: 'b_subject_3', label: '三刀流', desc: '3教科で対戦した', emoji: '◆', tier: 1, earned: (p) => Object.keys(p.subjects).length >= 3 },
  { id: 'b_subject_master', label: '専門家', desc: '1つの教科で10勝', emoji: '◆', tier: 2, earned: (p) => Object.values(p.subjects).some((s) => s.wins >= 10) },
  { id: 'b_study_10', label: 'コツコツ', desc: '演習で大問を10問とけた', emoji: '◆', tier: 1, earned: (p) => p.studySolved >= 10 },
  { id: 'b_study_50', label: '努力家', desc: '演習で大問を50問とけた', emoji: '◆', tier: 2, earned: (p) => p.studySolved >= 50 },
  { id: 'b_study_200', label: '学びの鬼', desc: '演習で大問を200問とけた', emoji: '◆', tier: 3, earned: (p) => p.studySolved >= 200 },
  { id: 'b_rush_first', label: 'ラッシュデビュー', desc: 'マナラッシュに初ちょうせん', emoji: '◆', tier: 1, earned: (p) => p.rushPlays >= 1 },
  { id: 'b_rush_2500', label: '瞬速', desc: 'マナラッシュで2500点', emoji: '◆', tier: 2, earned: (p) => p.rushBest >= 2500 },
  { id: 'b_rush_4000', label: '電光石火', desc: 'マナラッシュで4000点（Sランク）', emoji: '◆', tier: 3, earned: (p) => p.rushBest >= 4000 },
  { id: 'b_rush_combo10', label: '十連コンボ', desc: 'マナラッシュで10コンボ', emoji: '◆', tier: 2, earned: (p) => p.rushBestCombo >= 10 },
];

export function badgeById(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id);
}

/** まだ持っていないバッジのうち、条件を満たしたものを返す */
export function evaluateBadges(progress: GrowthProgress): string[] {
  return BADGES.filter((b) => !(b.id in progress.badges) && b.earned(progress)).map((b) => b.id);
}

/** バッジの希少度に応じた色（琥珀・紫・金。ライト地で読める色） */
export function badgeTierColor(tier: 1 | 2 | 3): string {
  return tier === 3 ? '#B7791F' : tier === 2 ? '#9B59B6' : '#3498DB';
}

// ============================================================
// 扉くんの装備（ポーズ・枠）
// ============================================================

/**
 * pose / frame は扉くん本体、hat / glasses / cheek / aura は部位ごとのアクセサリ（重ねて描く）、
 * wallpaper はアプリの壁紙。print は大当たりの学習プリント（PDF・装備はしない）。
 */
export type ItemKind = 'pose' | 'frame' | AccessorySlot | 'wallpaper' | 'print';
/** 装備できる種類（equipped のキー） */
export type EquipKind = Exclude<ItemKind, 'print'>;
/** 外せる種類（アクセサリと壁紙。ポーズと枠は常に何か1つ） */
export const REMOVABLE_KINDS: readonly EquipKind[] = [...ACCESSORY_SLOTS, 'wallpaper'];
/** ガチャのレア度：N（ノーマル）/ R（レア）/ SR（スーパーレア）/ UR（大当たり＝学習プリント） */
export type GachaRarity = 'N' | 'R' | 'SR' | 'UR';

export interface ItemDef {
  id: string;
  kind: ItemKind;
  label: string;
  /** pose: 画像パス（public/mascots）／ frame: 色コード ／ アクセサリ: '形:色'（tobiraParts.ts）／ wallpaper: WALLPAPERS のキー ／ print: PDF のパス（public/prints） */
  value: string;
  gacha?: boolean;
  pattern?: 'dashed' | 'double' | 'dots' | 'rays' | 'stars' | 'stripes' | 'checker' | 'wave' | 'grid' | 'sparkle' | 'rainbow' | 'aurora' | 'neon' | 'prism' | 'galaxy';
  /** ガチャのレア度。省略時は gachaRarityOf() が入手条件から決める（N / R / SR）。UR は学習プリントだけ */
  rarity?: GachaRarity;
  /**
   * 入手条件。どれか1つ。
   *   level  … そのレベルで自動解放
   *   badge  … そのバッジで自動解放
   *   coins  … コインで交換
   *   gacha  … ガチャ限定（自動解放・コイン交換なし）
   */
  unlock: { level: number } | { badge: string } | { coins: number } | { gacha: true };
}

/**
 * 扉くんのポーズは public/mascots の画像。
 * 基本9枚に、ガチャ限定の新ポーズ（リスニング・実験・トロフィー）を追加。
 * 「ポーズを選べる」こと自体が装備で、レベルや実績・コイン・ガチャで順に解放する。
 * gacha: true を付けたものはガチャの抽選対象にも入る（レベル解放と併用可）。
 */
export const ITEMS: readonly ItemDef[] = [
  { id: 'frame_league_aurora', kind: 'frame', rarity: 'UR', label: 'リーグ・オーロラフレーム', value: '#8657c5', pattern: 'aurora', unlock: { gacha: true } },
  { id: 'pose_basic', kind: 'pose', label: '基本', value: '/mascots/basic.webp', unlock: { level: 1 } },
  { id: 'pose_walking', kind: 'pose', gacha: true, label: 'おさんぽ', value: '/mascots/walking.webp', unlock: { level: 3 } },
  { id: 'pose_studying', kind: 'pose', gacha: true, label: '勉強中', value: '/mascots/studying.webp', unlock: { level: 5 } },
  { id: 'pose_thinking', kind: 'pose', gacha: true, label: '考え中', value: '/mascots/thinking.webp', unlock: { level: 8 } },
  { id: 'pose_good', kind: 'pose', gacha: true, label: 'グッド！', value: '/mascots/good.webp', unlock: { badge: 'b_first_win' } },
  { id: 'pose_cheering', kind: 'pose', label: '応援', value: '/mascots/cheering.webp', unlock: { coins: 120 } },
  { id: 'pose_happy', kind: 'pose', gacha: true, label: 'よろこび', value: '/mascots/happy.webp', unlock: { badge: 'b_perfect' } },
  { id: 'pose_bowing', kind: 'pose', gacha: true, label: 'おじぎ', value: '/mascots/bowing.webp', unlock: { badge: 'b_holes_10' } },
  { id: 'pose_sleeping', kind: 'pose', label: 'おひるね', value: '/mascots/sleeping.webp', unlock: { coins: 200 } },
  // ── ガチャ限定の新ポーズ（コイン交換不可・ガチャのみ）──
  { id: 'pose_listening', kind: 'pose', gacha: true, label: 'リスニング中', value: '/mascots/listening.webp', unlock: { gacha: true } },
  { id: 'pose_science', kind: 'pose', gacha: true, label: '実験中', value: '/mascots/science.webp', unlock: { gacha: true } },
  { id: 'pose_trophy', kind: 'pose', gacha: true, label: '優勝トロフィー', value: '/mascots/trophy.webp', unlock: { gacha: true } },
  // ── SR（スーパーレア）限定フレーム：ガチャからだけ出る ──
  { id: 'frame_prism', kind: 'frame', gacha: true, rarity: 'SR', label: 'プリズム', value: '#C471ED', pattern: 'prism', unlock: { gacha: true } },
  { id: 'frame_galaxy', kind: 'frame', gacha: true, rarity: 'SR', label: 'ギャラクシー', value: '#1E1B4B', pattern: 'galaxy', unlock: { gacha: true } },
  { id: 'frame_paper', kind: 'frame', label: 'ノート', value: '#E5E7EB', unlock: { level: 1 } },
  { id: 'frame_green', kind: 'frame', label: 'わかば', value: '#2ECC71', unlock: { level: 5 } },
  { id: 'frame_blue', kind: 'frame', label: 'そら', value: '#3498DB', unlock: { level: 10 } },
  { id: 'frame_purple', kind: 'frame', label: 'すみれ', value: '#9B59B6', unlock: { level: 20 } },
  { id: 'frame_gold', kind: 'frame', label: 'ゴールド', value: '#F4D03F', unlock: { badge: 'b_wins_10' } },
  { id: 'frame_pink', kind: 'frame', label: 'さくら', value: '#D9A0A0', unlock: { coins: 80 } },
  { id: 'frame_mint', kind: 'frame', label: 'ミント', value: '#74B7A3', unlock: { coins: 60 } },
  { id: 'frame_ocean', kind: 'frame', label: 'マリン', value: '#4D93AE', unlock: { coins: 100 } },
  { id: 'frame_lavender', kind: 'frame', label: 'ラベンダー', value: '#B09BC7', unlock: { coins: 140 } },
  { id: 'frame_coral', kind: 'frame', label: 'コーラル', value: '#DD8F79', unlock: { coins: 160 } },
  { id: 'frame_midnight', kind: 'frame', label: '星空', value: '#3F527C', unlock: { coins: 200 } },
  { id: 'frame_stitch', kind: 'frame', label: '手帳ステッチ', value: '#B58164', pattern: 'dashed', unlock: { coins: 120 } },
  { id: 'frame_medal', kind: 'frame', label: '二重のメダル', value: '#BBA049', pattern: 'double', unlock: { coins: 180 } },
  { id: 'frame_bubbles', kind: 'frame', label: 'ソーダバブル', value: '#62A8BB', pattern: 'dots', unlock: { coins: 150 } },
  { id: 'frame_sunrise', kind: 'frame', label: '朝日のリング', value: '#DA9B65', pattern: 'rays', unlock: { coins: 180 } },
  { id: 'frame_constellation', kind: 'frame', label: '星めぐり', value: '#7A76B0', pattern: 'stars', unlock: { coins: 220 } },
  // ── 追加フレーム（ガチャ増量分）──
  { id: 'frame_candy', kind: 'frame', label: 'キャンディ', value: '#E98BA5', pattern: 'stripes', unlock: { coins: 130 } },
  { id: 'frame_checker', kind: 'frame', label: 'チェッカー', value: '#5B6B7F', pattern: 'checker', unlock: { coins: 140 } },
  { id: 'frame_wave', kind: 'frame', label: 'さざなみ', value: '#4FA3C7', pattern: 'wave', unlock: { coins: 150 } },
  { id: 'frame_graph', kind: 'frame', label: 'グラフ用紙', value: '#6FA88C', pattern: 'grid', unlock: { coins: 110 } },
  { id: 'frame_sparkle', kind: 'frame', label: 'きらめき', value: '#C9A227', pattern: 'sparkle', unlock: { coins: 240 } },
  { id: 'frame_rainbow', kind: 'frame', label: 'レインボー', value: '#E76F51', pattern: 'rainbow', unlock: { coins: 260 } },
  { id: 'frame_aurora', kind: 'frame', label: 'オーロラ', value: '#3FA796', pattern: 'aurora', unlock: { coins: 280 } },
  { id: 'frame_neon', kind: 'frame', label: 'ネオン', value: '#7C3AED', pattern: 'neon', unlock: { coins: 300 } },
  { id: 'frame_lemon', kind: 'frame', label: 'レモン', value: '#F2D16B', unlock: { coins: 70 } },
  { id: 'frame_grape', kind: 'frame', label: 'ぶどう', value: '#8E5EA2', unlock: { coins: 90 } },
  { id: 'frame_chocolate', kind: 'frame', label: 'チョコ', value: '#7B4B2A', unlock: { coins: 100 } },
  { id: 'frame_ice', kind: 'frame', label: 'アイス', value: '#A8DDE9', unlock: { coins: 90 } },
  { id: 'frame_fire', kind: 'frame', label: 'ほのお', value: '#E67E22', unlock: { badge: 'b_streak_5' } },
  // ── 演習・マナラッシュの実績で解放（ガチャ・交換なし）──
  { id: 'frame_scholar', kind: 'frame', label: '努力の証', value: '#2F7D6D', pattern: 'double', unlock: { badge: 'b_study_50' } },
  { id: 'frame_lightning', kind: 'frame', label: 'イナズマ', value: '#E0A800', pattern: 'rays', unlock: { badge: 'b_rush_2500' } },
  { id: 'frame_comet', kind: 'frame', label: 'コメット', value: '#5A67D8', pattern: 'sparkle', unlock: { badge: 'b_rush_combo10' } },
  // ── 部位ごとのアクセサリ（とびら君に重ねて描く・ガチャ限定）。value は '形:色'（tobiraParts.ts）──
  // 頭（帽子）
  { id: 'hat_beanie_red', kind: 'hat', gacha: true, rarity: 'N', label: 'ニット帽（あか）', value: 'beanie:#E76F51', unlock: { gacha: true } },
  { id: 'hat_beanie_navy', kind: 'hat', gacha: true, rarity: 'N', label: 'ニット帽（こん）', value: 'beanie:#3D5A80', unlock: { gacha: true } },
  { id: 'hat_cap_blue', kind: 'hat', gacha: true, rarity: 'N', label: 'キャップ（そら）', value: 'cap:#4D96FF', unlock: { gacha: true } },
  { id: 'hat_cap_green', kind: 'hat', gacha: true, rarity: 'N', label: 'キャップ（みどり）', value: 'cap:#43AA8B', unlock: { gacha: true } },
  { id: 'hat_ribbon_pink', kind: 'hat', gacha: true, rarity: 'N', label: 'リボン（ピンク）', value: 'ribbon:#F28AB2', unlock: { gacha: true } },
  { id: 'hat_flower', kind: 'hat', gacha: true, rarity: 'N', label: 'お花のかみかざり', value: 'flower:#FF8FAB', unlock: { gacha: true } },
  { id: 'hat_beret', kind: 'hat', gacha: true, rarity: 'R', label: 'ベレー帽', value: 'beret:#9B2226', unlock: { gacha: true } },
  { id: 'hat_bunny', kind: 'hat', gacha: true, rarity: 'R', label: 'うさみみ', value: 'bunny:#F8F9FA', unlock: { gacha: true } },
  { id: 'hat_chef', kind: 'hat', gacha: true, rarity: 'R', label: 'コック帽', value: 'chef:#E63946', unlock: { gacha: true } },
  { id: 'hat_graduation', kind: 'hat', gacha: true, rarity: 'R', label: '卒業帽（角帽）', value: 'graduation:#F4D03F', unlock: { gacha: true } },
  { id: 'hat_wizard', kind: 'hat', gacha: true, rarity: 'SR', label: '魔法使いの帽子', value: 'wizard:#5A4FCF', unlock: { gacha: true } },
  { id: 'hat_crown', kind: 'hat', gacha: true, rarity: 'SR', label: '王冠', value: 'crown:#F6C744', unlock: { gacha: true } },
  { id: 'hat_tiara', kind: 'hat', gacha: true, rarity: 'SR', label: 'ティアラ', value: 'tiara:#C0C8D6', unlock: { gacha: true } },
  { id: 'hat_halo', kind: 'hat', gacha: true, rarity: 'SR', label: '天使のわっか', value: 'halo:#FFD43B', unlock: { gacha: true } },
  // 顔（メガネ）
  { id: 'glasses_round', kind: 'glasses', gacha: true, rarity: 'N', label: 'まるメガネ', value: 'round:#3B2F2F', unlock: { gacha: true } },
  { id: 'glasses_square', kind: 'glasses', gacha: true, rarity: 'N', label: 'スクエアメガネ', value: 'square:#1D3557', unlock: { gacha: true } },
  { id: 'glasses_red', kind: 'glasses', gacha: true, rarity: 'N', label: 'あかぶちメガネ', value: 'round:#D62828', unlock: { gacha: true } },
  { id: 'glasses_science', kind: 'glasses', gacha: true, rarity: 'N', label: '実験用ゴーグル', value: 'science:#74C0FC', unlock: { gacha: true } },
  { id: 'glasses_sun', kind: 'glasses', gacha: true, rarity: 'R', label: 'サングラス', value: 'sun:#222222', unlock: { gacha: true } },
  { id: 'glasses_monocle', kind: 'glasses', gacha: true, rarity: 'R', label: '名探偵の片メガネ', value: 'monocle:#B8860B', unlock: { gacha: true } },
  { id: 'glasses_goggle', kind: 'glasses', gacha: true, rarity: 'R', label: 'スイミングゴーグル', value: 'goggle:#2A9D8F', unlock: { gacha: true } },
  { id: 'glasses_star', kind: 'glasses', gacha: true, rarity: 'SR', label: 'スターグラス', value: 'star:#F9C74F', unlock: { gacha: true } },
  { id: 'glasses_heart', kind: 'glasses', gacha: true, rarity: 'SR', label: 'ハートグラス', value: 'heart:#FF4D8D', unlock: { gacha: true } },
  // ほっぺ
  { id: 'cheek_blush', kind: 'cheek', gacha: true, rarity: 'N', label: 'ぽっとほっぺ', value: 'blush:#FF8FA3', unlock: { gacha: true } },
  { id: 'cheek_orange', kind: 'cheek', gacha: true, rarity: 'N', label: 'みかんほっぺ', value: 'blush:#FFA94D', unlock: { gacha: true } },
  { id: 'cheek_whisker', kind: 'cheek', gacha: true, rarity: 'N', label: 'ねこのおひげ', value: 'whisker:#5C4033', unlock: { gacha: true } },
  { id: 'cheek_sticker', kind: 'cheek', gacha: true, rarity: 'R', label: 'ばんそうこう', value: 'sticker:#F4C28F', unlock: { gacha: true } },
  { id: 'cheek_star', kind: 'cheek', gacha: true, rarity: 'R', label: 'ほしのペイント', value: 'star:#FFD43B', unlock: { gacha: true } },
  { id: 'cheek_heart', kind: 'cheek', gacha: true, rarity: 'R', label: 'ハートのペイント', value: 'heart:#FF6B9D', unlock: { gacha: true } },
  // オーラ（まわりに浮かぶ）
  { id: 'aura_bubbles', kind: 'aura', gacha: true, rarity: 'N', label: 'シャボン玉', value: 'bubbles:#74C0FC', unlock: { gacha: true } },
  { id: 'aura_petals', kind: 'aura', gacha: true, rarity: 'N', label: '桜ふぶき', value: 'petals:#F9A8C9', unlock: { gacha: true } },
  { id: 'aura_notes', kind: 'aura', gacha: true, rarity: 'R', label: 'おんぷ', value: 'notes:#9775FA', unlock: { gacha: true } },
  { id: 'aura_formula', kind: 'aura', gacha: true, rarity: 'R', label: '数式と化学式', value: 'formula:#4C6EF5', unlock: { gacha: true } },
  { id: 'aura_hearts', kind: 'aura', gacha: true, rarity: 'R', label: 'ハート', value: 'hearts:#FF6B9D', unlock: { gacha: true } },
  { id: 'aura_sparkle', kind: 'aura', gacha: true, rarity: 'SR', label: 'きらきら', value: 'sparkle:#FFC300', unlock: { gacha: true } },
  { id: 'aura_stars', kind: 'aura', gacha: true, rarity: 'SR', label: '流れ星', value: 'stars:#FFD166', unlock: { gacha: true } },
  { id: 'aura_flame', kind: 'aura', gacha: true, rarity: 'SR', label: 'やる気の炎', value: 'flame:#FF7B00', unlock: { gacha: true } },
  // ── アプリの壁紙（ホームなどの背景）──
  { id: 'wall_grid', kind: 'wallpaper', gacha: true, rarity: 'N', label: '壁紙：方眼ノート', value: 'grid', unlock: { gacha: true } },
  { id: 'wall_lined', kind: 'wallpaper', gacha: true, rarity: 'N', label: '壁紙：大学ノート', value: 'lined', unlock: { gacha: true } },
  { id: 'wall_mint', kind: 'wallpaper', gacha: true, rarity: 'N', label: '壁紙：ミントストライプ', value: 'mint', unlock: { gacha: true } },
  { id: 'wall_sakura', kind: 'wallpaper', gacha: true, rarity: 'N', label: '壁紙：桜', value: 'sakura', unlock: { gacha: true } },
  { id: 'wall_forest', kind: 'wallpaper', gacha: true, rarity: 'N', label: '壁紙：森の小道', value: 'forest', unlock: { gacha: true } },
  { id: 'wall_ocean', kind: 'wallpaper', gacha: true, rarity: 'R', label: '壁紙：海', value: 'ocean', unlock: { gacha: true } },
  { id: 'wall_sunset', kind: 'wallpaper', gacha: true, rarity: 'R', label: '壁紙：夕焼け', value: 'sunset', unlock: { gacha: true } },
  { id: 'wall_chem', kind: 'wallpaper', gacha: true, rarity: 'R', label: '壁紙：化学式柄', value: 'chem', unlock: { gacha: true } },
  { id: 'wall_math', kind: 'wallpaper', gacha: true, rarity: 'R', label: '壁紙：数式柄', value: 'math', unlock: { gacha: true } },
  { id: 'wall_music', kind: 'wallpaper', gacha: true, rarity: 'R', label: '壁紙：五線譜', value: 'music', unlock: { gacha: true } },
  { id: 'wall_chalk', kind: 'wallpaper', gacha: true, rarity: 'R', label: '壁紙：黒板', value: 'chalk', unlock: { gacha: true } },
  { id: 'wall_night', kind: 'wallpaper', gacha: true, rarity: 'SR', label: '壁紙：夜空', value: 'night', unlock: { gacha: true } },
  { id: 'wall_aurora', kind: 'wallpaper', gacha: true, rarity: 'SR', label: '壁紙：オーロラ', value: 'aurora', unlock: { gacha: true } },
  { id: 'wall_galaxy', kind: 'wallpaper', gacha: true, rarity: 'SR', label: '壁紙：銀河', value: 'galaxy', unlock: { gacha: true } },
  { id: 'wall_rainbow', kind: 'wallpaper', gacha: true, rarity: 'SR', label: '壁紙：レインボー', value: 'rainbow', unlock: { gacha: true } },
  { id: 'wall_gold', kind: 'wallpaper', gacha: true, rarity: 'SR', label: '壁紙：黄金の書斎', value: 'gold', unlock: { gacha: true } },
  // ── UR（大当たり）：学習プリント PDF。ガチャからだけ出る（一覧は gachaPrints.generated.ts）──
  ...GACHA_PRINTS.map((p): ItemDef => ({ id: p.id, kind: 'print', gacha: true, rarity: 'UR', label: p.label, value: p.file, unlock: { gacha: true } })),
];

/** 学習プリント（UR）の詳細（サムネイル・ページ数など）。プリントでなければ undefined */
export function printOf(id: string): GachaPrintDef | undefined {
  return GACHA_PRINTS.find((p) => p.id === id);
}

/**
 * ガチャのレア度。
 *   UR … 大当たりの学習プリント（rarity:'UR' 指定のみ）
 *   SR … ガチャ限定のもの（rarity:'SR' 指定・または unlock:{gacha:true}）
 *   R  … 模様つきフレーム・200枚以上の交換品・称号で解放されるポーズ
 *   N  … それ以外
 */
export function gachaRarityOf(item: ItemDef): GachaRarity {
  if (item.rarity) return item.rarity;
  if ('gacha' in item.unlock) return 'SR';
  if (item.pattern || ('coins' in item.unlock && item.unlock.coins >= 200) || ('badge' in item.unlock)) return 'R';
  return 'N';
}

export function itemById(id: string): ItemDef | undefined {
  return ITEMS.find((i) => i.id === id);
}

/** 自動解放（レベル・バッジ条件）で新しく手に入る装備 */
export function evaluateUnlocks(progress: GrowthProgress): string[] {
  const level = levelOf(progress.xp).level;
  const out: string[] = [];
  for (const item of ITEMS) {
    if (progress.owned.includes(item.id)) continue;
    if ('level' in item.unlock && level >= item.unlock.level) out.push(item.id);
    else if ('badge' in item.unlock && item.unlock.badge in progress.badges) out.push(item.id);
  }
  return out;
}

/** コインで装備を交換する */
export function purchaseItem(
  progress: GrowthProgress,
  id: string,
): { next: GrowthProgress; ok: boolean; reason?: string } {
  const item = itemById(id);
  if (!item) return { next: progress, ok: false, reason: 'その装備はありません。' };
  if (progress.owned.includes(id)) return { next: progress, ok: false, reason: 'すでに持っています。' };
  if (!('coins' in item.unlock)) return { next: progress, ok: false, reason: 'コインでは交換できません。' };
  if (progress.coins < item.unlock.coins) {
    return {
      next: progress,
      ok: false,
      reason: `コインが ${item.unlock.coins - progress.coins} 足りません。`,
    };
  }
  return {
    next: { ...progress, coins: progress.coins - item.unlock.coins, owned: [...progress.owned, id] },
    ok: true,
  };
}

/** 装備を身につける（持っていないものは拒否） */
export function equipItem(progress: GrowthProgress, id: string): GrowthProgress {
  const item = itemById(id);
  // 学習プリントは装備ではない（equipped に入れると扉くんの表示が壊れる）
  if (!item || item.kind === 'print' || !progress.owned.includes(id)) return progress;
  return { ...progress, equipped: { ...progress.equipped, [item.kind]: id } };
}

/** アクセサリ・壁紙を外す（ポーズ・枠・称号は外せない） */
export function unequipKind(progress: GrowthProgress, kind: EquipKind): GrowthProgress {
  if (!REMOVABLE_KINDS.includes(kind) || !progress.equipped[kind]) return progress;
  return { ...progress, equipped: { ...progress.equipped, [kind]: '' } };
}

/** 装備中のアクセサリの見た目（'形:色'）。持っていない・種類が違うものは無視 */
export function equippedAccessory(progress: GrowthProgress, slot: AccessorySlot): string | undefined {
  const id = progress.equipped[slot];
  const item = id ? itemById(id) : undefined;
  return item && item.kind === slot && progress.owned.includes(id) ? item.value : undefined;
}

/** 装備中の壁紙のキー（WALLPAPERS）。無ければ '' */
export function equippedWallpaper(progress: GrowthProgress): string {
  const id = progress.equipped.wallpaper;
  const item = id ? itemById(id) : undefined;
  return item && item.kind === 'wallpaper' && progress.owned.includes(id) ? item.value : '';
}

/** 称号を身につける（'' でレート称号に戻す。持っていないバッジは拒否） */
export function equipTitle(progress: GrowthProgress, badgeId: string): GrowthProgress {
  if (badgeId !== '' && !(badgeId in progress.badges)) return progress;
  return { ...progress, equipped: { ...progress.equipped, title: badgeId } };
}

/** 身につけているポーズの画像パス（壊れていれば基本） */
export function equippedPoseSrc(progress: GrowthProgress): string {
  const item = itemById(progress.equipped.pose);
  return item && item.kind === 'pose' ? item.value : '/mascots/basic.webp';
}

/** 身につけている枠の色 */
export function equippedFramePattern(progress: GrowthProgress): string {
  return itemById(progress.equipped.frame)?.pattern || 'plain';
}

export function equippedFrameColor(progress: GrowthProgress): string {
  const item = itemById(progress.equipped.frame);
  return item && item.kind === 'frame' ? item.value : '#E5E7EB';
}

/** 表示する称号（バッジ称号を選んでいればそれ、無ければ null＝レート称号を使う） */
export function equippedTitleLabel(progress: GrowthProgress): string | null {
  if (!progress.equipped.title) return null;
  const b = badgeById(progress.equipped.title);
  if (!b || !(b.id in progress.badges)) return null;
  return b.label;
}

// ============================================================
// 試合結果の反映
// ============================================================

export interface GrowthDelta {
  coins?: { finish: number; correct: number; victory: number; total: number };
  xp: XpBreakdown;
  levelBefore: number;
  levelAfter: number;
  /** この試合で新しく獲得したバッジ */
  newBadges: string[];
  /** 進捗が動いたミッション */
  missionUpdates: { id: string; before: number; after: number; completed: boolean }[];
  /** 新しく解放された装備 */
  unlocked: string[];
}

/**
 * 試合結果を成長記録に反映した「次の状態」と「何が変わったか」を返す。
 *
 * ★同じ部屋IDは二度反映しない★（再読み込み・戻る操作の対策）。
 * その場合は元の記録をそのまま返し、delta は null。
 *
 * @param today  YYYY-MM-DD（ミッションの日付判定に使う。呼び出し側が渡す＝テスト可能）
 * @param now    バッジ獲得時刻に使う epoch ms
 */
export function applyMatchToProgress(
  progress: GrowthProgress,
  match: MatchSummaryForGrowth,
  today: string,
  now: number = Date.now(),
): { next: GrowthProgress; delta: GrowthDelta | null } {
  if (progress.lastRoomId === match.roomId) return { next: progress, delta: null };

  const xp = xpForMatch(match.score, match.outcome, match.forfeit);
  const levelBefore = levelOf(progress.xp).level;

  const subjectPrev = progress.subjects[match.subject] ?? {
    matches: 0,
    wins: 0,
    correct: 0,
    answered: 0,
  };
  const total = match.score.perQuestion.length;
  const perfect = total > 0 && match.score.correctCount === total;
  const won = match.outcome === 'win';

  let next: GrowthProgress = {
    ...progress,
    xp: progress.xp + xp.total,
    matches: progress.matches + 1,
    wins: progress.wins + (won ? 1 : 0),
    losses: progress.losses + (match.outcome === 'lose' ? 1 : 0),
    draws: progress.draws + (match.outcome === 'draw' ? 1 : 0),
    correct: progress.correct + match.score.correctCount,
    answered: progress.answered + match.answeredCount,
    bestStreak: Math.max(progress.bestStreak, match.score.maxStreak),
    perfectGames: progress.perfectGames + (perfect ? 1 : 0),
    buzzWins: progress.buzzWins + (match.buzz && won ? 1 : 0),
    holesFilled: progress.holesFilled + match.holesFilled,
    subjects: {
      ...progress.subjects,
      [match.subject]: {
        matches: subjectPrev.matches + 1,
        wins: subjectPrev.wins + (won ? 1 : 0),
        correct: subjectPrev.correct + match.score.correctCount,
        answered: subjectPrev.answered + match.answeredCount,
      },
    },
    lastRoomId: match.roomId,
  };

  // ミッション進捗
  const daily = rolloverDaily(next.daily, today);
  const missionUpdates: GrowthDelta['missionUpdates'] = [];
  for (const m of missionsForDate(today)) {
    const before = daily.progress[m.id] ?? 0;
    const gain = m.countMatch(match);
    if (gain <= 0 || before >= m.goal) continue;
    const after = Math.min(m.goal, before + gain);
    daily.progress[m.id] = after;
    missionUpdates.push({ id: m.id, before, after, completed: after >= m.goal });
  }
  next = { ...next, daily };

  // バッジ
  const newBadges = evaluateBadges(next);
  if (newBadges.length > 0) {
    const badges = { ...next.badges };
    for (const id of newBadges) badges[id] = now;
    next = { ...next, badges };
  }

  // 装備の解放（レベル・バッジ条件）
  const unlocked = evaluateUnlocks(next);
  if (unlocked.length > 0) next = { ...next, owned: [...next.owned, ...unlocked] };

  const levelAfter = levelOf(next.xp).level;
  return {
    next,
    delta: { xp, levelBefore, levelAfter, newBadges, missionUpdates, unlocked },
  };
}

/**
 * ログイン日数を数える（対戦モードを開いたとき）。
 * 同じ日に2回開いても1日としか数えない。連続日数も更新する。
 * 変化が無ければ同じ参照を返す（呼び出し側が「書かなくてよい」と判断できる）。
 */
export function applyLogin(progress: GrowthProgress, today: string, now: number = Date.now()): GrowthProgress {
  return applyLoginWithBonus(progress, today, now).next;
}

/** ログインボーナスの内容 */
export interface LoginBonus {
  /** 連続日数（今日を含む） */
  streak: number;
  xp: number;
  coins: number;
  /** 7日ごとの節目 */
  milestone: boolean;
}

/**
 * ログインボーナス。連続日数で増え、7日目で節目（大きめ）。
 *  1日目 10コイン / 2日目 15 / … / 7日目 50 ＋ XP。8日目からは 7日周期で繰り返す。
 *  ★1回の書き込み上限（coins +200 / xp +600）に必ず収まる大きさ★
 */
export function loginBonusFor(streak: number): LoginBonus {
  const s = Math.max(1, streak);
  const day = ((s - 1) % 7) + 1; // 1..7
  const milestone = day === 7;
  const coins = milestone ? 50 : 5 + day * 5; // 10,15,20,25,30,35,50
  const xp = milestone ? 40 : 10 + day * 2; // 12..22, 40
  return { streak: s, xp, coins, milestone };
}

/** ログイン日数を数え、ボーナスも付ける。今日すでに数えていれば bonus は null */
export function applyLoginWithBonus(
  progress: GrowthProgress,
  today: string,
  now: number = Date.now(),
): { next: GrowthProgress; bonus: LoginBonus | null } {
  if (progress.lastLoginDate >= today) return { next: progress, bonus: null };
  const consecutive = isNextDay(progress.lastLoginDate, today);
  const streak = consecutive ? progress.loginStreak + 1 : 1;
  const bonus = loginBonusFor(streak);
  let next: GrowthProgress = {
    ...progress,
    xp: progress.xp + bonus.xp,
    coins: progress.coins + bonus.coins,
    loginDays: progress.loginDays + 1,
    loginStreak: streak,
    lastLoginDate: today,
    daily: rolloverDaily(progress.daily, today),
  };
  const newBadges = evaluateBadges(next);
  if (newBadges.length > 0) {
    const badges = { ...next.badges };
    for (const id of newBadges) badges[id] = now;
    next = { ...next, badges };
    const unlocked = evaluateUnlocks(next);
    if (unlocked.length > 0) next = { ...next, owned: [...next.owned, ...unlocked] };
  }
  return { next: withAchievements(next, now), bonus };
}

// ============================================================
// デイリーコンプリート宝箱（2026-09-24 追加）
// ============================================================
//
// ★目的★ 「3つのうち1つ受け取ったら満足して終わる」を防ぎ、毎日「全部」やる理由を作る。
// その日のミッション3つをすべて受け取ると宝箱が開けられる。
// 連続でコンプリートした日数（completeStreak）で中身が増え、7日目が大当たり。
// 1日1回だけ。受け取り済みの記録は daily.claimed に COMPLETE_CHEST_ID を入れて表す
// （保存形式を増やさないため。古い記録でも壊れない）。
// 連続日数は receipts（growthStore の受領記録）ではなく progress.completeStreak / lastCompleteDate に持つ。

/** 宝箱を受け取ったことを daily.claimed に記録するための ID（ミッションIDと衝突しない） */
export const COMPLETE_CHEST_ID = 'chest_complete';

export interface CompleteChest {
  /** 連続コンプリート日数（今日を含む） */
  streak: number;
  xp: number;
  coins: number;
  /** 7日ごとの大当たり */
  jackpot: boolean;
}

/**
 * 宝箱の中身。1日目 60コイン・XP50 → 1日ごとに +10 コイン・+10 XP → 7日目は 200コイン・XP150。
 * ★1回の書き込み上限（coins +200 / xp +600）に必ず収まる★
 */
export function completeChestFor(streak: number): CompleteChest {
  const s = Math.max(1, streak);
  const day = ((s - 1) % 7) + 1; // 1..7
  const jackpot = day === 7;
  const coins = jackpot ? COINS_PER_WRITE_MAX : 50 + day * 10; // 60..110, 200
  const xp = jackpot ? 150 : 40 + day * 10; // 50..100, 150
  return { streak: s, xp, coins, jackpot };
}

/** 今日のミッションをすべて受け取ったか（宝箱が開けられる条件） */
export function allMissionsClaimed(progress: GrowthProgress, today: string): boolean {
  if (progress.daily.date !== today) return false;
  // 対戦3つ＋ボーナス（演習・マナラッシュ）2つ、すべて受け取ったら開く
  return allMissionsForDate(today).every((m) => progress.daily.claimed.includes(m.id));
}

/** 宝箱を今日すでに開けたか */
export function chestOpenedToday(progress: GrowthProgress, today: string): boolean {
  return progress.daily.date === today && progress.daily.claimed.includes(COMPLETE_CHEST_ID);
}

/** 宝箱を開ける。条件を満たさなければ reward は null（何も変えない） */
export function openCompleteChest(
  progress: GrowthProgress,
  today: string,
  now: number = Date.now(),
): { next: GrowthProgress; reward: CompleteChest | null } {
  if (!allMissionsClaimed(progress, today) || chestOpenedToday(progress, today)) return { next: progress, reward: null };
  const streak = isNextDay(progress.lastCompleteDate, today) ? progress.completeStreak + 1 : 1;
  const reward = completeChestFor(streak);
  const next: GrowthProgress = {
    ...progress,
    xp: progress.xp + reward.xp,
    coins: progress.coins + reward.coins,
    completeStreak: streak,
    completeDays: progress.completeDays + 1,
    lastCompleteDate: today,
    daily: { ...progress.daily, claimed: [...progress.daily.claimed, COMPLETE_CHEST_ID] },
  };
  return { next: withAchievements(next, now), reward };
}

/**
 * 表示用：いまの連続コンプリート日数。
 * 昨日も今日もコンプリートしていなければ連続は切れているので 0。
 */
export function currentCompleteStreak(progress: GrowthProgress, today: string): number {
  if (progress.lastCompleteDate === today || isNextDay(progress.lastCompleteDate, today)) return progress.completeStreak;
  return 0;
}

/** 学習で穴を埋めたときの反映（ミッション「穴を埋める」にも入る） */
export function applyHolesFilled(
  progress: GrowthProgress,
  count: number,
  today: string,
  now: number = Date.now(),
): GrowthProgress {
  if (count <= 0) return progress;
  const daily = rolloverDaily(progress.daily, today);
  for (const m of missionsForDate(today)) {
    if (m.kind !== 'holes') continue;
    const before = daily.progress[m.id] ?? 0;
    daily.progress[m.id] = Math.min(m.goal, before + count);
  }
  let next: GrowthProgress = { ...progress, holesFilled: progress.holesFilled + count, daily };
  const newBadges = evaluateBadges(next);
  if (newBadges.length > 0) {
    const badges = { ...next.badges };
    for (const id of newBadges) badges[id] = now;
    next = { ...next, badges };
    const unlocked = evaluateUnlocks(next);
    if (unlocked.length > 0) next = { ...next, owned: [...next.owned, ...unlocked] };
  }
  return next;
}

// ============================================================
// 表示用の集計
// ============================================================

/** 教科別の正答率（0〜100）。未解答なら null */
export function subjectAccuracy(s: SubjectProgress | undefined): number | null {
  if (!s || s.answered === 0) return null;
  return Math.round((s.correct / s.answered) * 100);
}

/** 得意・苦手の並び（正答率の高い順。試合数0は末尾） */
export function rankSubjects(
  progress: GrowthProgress,
): { subject: string; stats: SubjectProgress; accuracy: number | null }[] {
  return Object.entries(progress.subjects)
    .map(([subject, stats]) => ({ subject, stats, accuracy: subjectAccuracy(stats) }))
    .sort((a, b) => (b.accuracy ?? -1) - (a.accuracy ?? -1) || b.stats.matches - a.stats.matches);
}

// ============================================================
// つぎの目標（バッジまでの残り）
// ============================================================

/**
 * 数えられるバッジの「いまの値／目標」。
 *
 * ★earned() は真偽しか返さないので、進捗を別に持つ★
 * 「常連（10試合）まであと6試合」のように残りを見せると、
 * 次の1試合に理由ができる。真偽関数だけでは残りが分からない。
 * 数えられないバッジ（条件が複合）は載せない。
 */
const BADGE_COUNTERS: Record<string, (p: GrowthProgress) => { current: number; goal: number }> = {
  b_first_match: (p) => ({ current: p.matches, goal: 1 }),
  b_first_win: (p) => ({ current: p.wins, goal: 1 }),
  b_matches_10: (p) => ({ current: p.matches, goal: 10 }),
  b_matches_50: (p) => ({ current: p.matches, goal: 50 }),
  b_matches_100: (p) => ({ current: p.matches, goal: 100 }),
  b_wins_10: (p) => ({ current: p.wins, goal: 10 }),
  b_wins_50: (p) => ({ current: p.wins, goal: 50 }),
  b_streak_5: (p) => ({ current: p.bestStreak, goal: 5 }),
  b_streak_8: (p) => ({ current: p.bestStreak, goal: 8 }),
  b_perfect: (p) => ({ current: p.perfectGames, goal: 1 }),
  b_perfect_5: (p) => ({ current: p.perfectGames, goal: 5 }),
  b_holes_10: (p) => ({ current: p.holesFilled, goal: 10 }),
  b_holes_50: (p) => ({ current: p.holesFilled, goal: 50 }),
  b_correct_100: (p) => ({ current: p.correct, goal: 100 }),
  b_correct_500: (p) => ({ current: p.correct, goal: 500 }),
  b_login_7: (p) => ({ current: p.loginStreak, goal: 7 }),
  b_login_30: (p) => ({ current: p.loginDays, goal: 30 }),
  b_chest_7: (p) => ({ current: p.completeStreak, goal: 7 }),
  b_chest_30: (p) => ({ current: p.completeDays, goal: 30 }),
  b_level_10: (p) => ({ current: levelOf(p.xp).level, goal: 10 }),
  b_level_30: (p) => ({ current: levelOf(p.xp).level, goal: 30 }),
  b_level_50: (p) => ({ current: levelOf(p.xp).level, goal: 50 }),
  b_subject_3: (p) => ({ current: Object.keys(p.subjects).length, goal: 3 }),
  b_study_10: (p) => ({ current: p.studySolved, goal: 10 }),
  b_study_50: (p) => ({ current: p.studySolved, goal: 50 }),
  b_study_200: (p) => ({ current: p.studySolved, goal: 200 }),
  b_rush_first: (p) => ({ current: p.rushPlays, goal: 1 }),
  b_rush_2500: (p) => ({ current: p.rushBest, goal: 2500 }),
  b_rush_4000: (p) => ({ current: p.rushBest, goal: 4000 }),
  b_rush_combo10: (p) => ({ current: p.rushBestCombo, goal: 10 }),
  b_subject_master: (p) => ({
    current: Math.max(0, ...Object.values(p.subjects).map((s) => s.wins)),
    goal: 10,
  }),
};

export interface BadgeGoal {
  id: string;
  current: number;
  goal: number;
  /** 残り */
  remain: number;
  /** 0〜1 */
  ratio: number;
}

/** バッジ1つの進捗（数えられないバッジは null） */
export function badgeProgress(progress: GrowthProgress, id: string): BadgeGoal | null {
  const counter = BADGE_COUNTERS[id];
  if (!counter) return null;
  const { current, goal } = counter(progress);
  const clamped = Math.max(0, Math.min(goal, current));
  return { id, current: clamped, goal, remain: goal - clamped, ratio: goal === 0 ? 1 : clamped / goal };
}

/**
 * まだ持っていないバッジのうち、達成に近いもの（進捗率の高い順）。
 *
 * ★同じ系列は近い方だけ★（「常連 6/10」と「歴戦 6/50」を並べない）
 * 系列は id の接頭辞（b_matches_ / b_wins_ …）で判定する。
 */
export function nextBadgeGoals(progress: GrowthProgress, max = 3): BadgeGoal[] {
  const seen = new Set<string>();
  const out: BadgeGoal[] = [];
  const candidates = BADGES.filter((b) => !(b.id in progress.badges))
    .map((b) => badgeProgress(progress, b.id))
    .filter((g): g is BadgeGoal => g !== null)
    .sort((a, b) => b.ratio - a.ratio || a.remain - b.remain);
  for (const g of candidates) {
    const family = g.id.replace(/_\d+$/, '').replace(/^b_(first_)?/, 'b_');
    if (seen.has(family)) continue;
    seen.add(family);
    out.push(g);
    if (out.length >= max) break;
  }
  return out;
}

/** つぎにレベルで解放される装備（無ければ null） */
export function nextLevelUnlock(progress: GrowthProgress): { item: ItemDef; level: number } | null {
  const level = levelOf(progress.xp).level;
  let best: { item: ItemDef; level: number } | null = null;
  for (const item of ITEMS) {
    if (progress.owned.includes(item.id) || !('level' in item.unlock)) continue;
    if (item.unlock.level <= level) continue;
    if (!best || item.unlock.level < best.level) best = { item, level: item.unlock.level };
  }
  return best;
}

/** ミッションが入れ替わるまでのミリ秒（端末ローカルの翌日0時まで） */
export function msUntilNextDay(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return Math.max(0, next.getTime() - now.getTime());
}

// ============================================================
// シェア文・レート段位
// ============================================================

/** レートの段位（battleRanking.ratingTitle と同じ境目。葉モジュールなのでここにも持つ） */
export const RATING_TIERS: { min: number; label: string }[] = [
  { min: 2000, label: '達人' },
  { min: 1800, label: '師範' },
  { min: 1650, label: '上級' },
  { min: 1500, label: '中級' },
  { min: 1350, label: '初級' },
  { min: 0, label: '入門' },
];

export function ratingTierOf(rating: number): { label: string; min: number; next: number | null } {
  for (let i = 0; i < RATING_TIERS.length; i++) {
    const t = RATING_TIERS[i];
    if (rating >= t.min) return { label: t.label, min: t.min, next: i > 0 ? RATING_TIERS[i - 1].min : null };
  }
  const last = RATING_TIERS[RATING_TIERS.length - 1];
  return { label: last.label, min: last.min, next: RATING_TIERS[RATING_TIERS.length - 2].min };
}

/** 段位が変わったか（'up' | 'down' | null） */
export function ratingTierChange(before: number, after: number): 'up' | 'down' | null {
  const a = ratingTierOf(before).min;
  const b = ratingTierOf(after).min;
  if (b > a) return 'up';
  if (b < a) return 'down';
  return null;
}

/** 結果画面の「共有」用の短い文（URL は呼び出し側が足す） */
export function shareTextForMatch(input: {
  outcome: 'win' | 'lose' | 'draw';
  subjectLabel: string;
  myScore: number;
  theirScore: number;
  rating: { before: number; after: number } | null;
  level: number;
  title: string;
}): string {
  const head = input.outcome === 'win' ? '勝ち！' : input.outcome === 'lose' ? '負け…' : '引き分け';
  const lines = [
    `【マナトビ対戦】${input.subjectLabel} ${head} ${input.myScore} - ${input.theirScore}`,
  ];
  if (input.rating) {
    const d = input.rating.after - input.rating.before;
    lines.push(`レート ${input.rating.after}（${d >= 0 ? '+' : ''}${d}）${ratingTierOf(input.rating.after).label}`);
  }
  lines.push(`Lv.${input.level}${input.title ? ` 「${input.title}」` : ''}`);
  lines.push('#マナトビ');
  return lines.join('\n');
}

/** XP from missions can cross a level without a battle; unlock immediately. */
function withAchievements(progress: GrowthProgress, now = Date.now()): GrowthProgress {
  const badges = { ...progress.badges };
  for (const id of evaluateBadges(progress)) badges[id] = now;
  const next = { ...progress, badges };
  return { ...next, owned: [...next.owned, ...evaluateUnlocks(next)] };
}
