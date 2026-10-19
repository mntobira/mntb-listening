/** Personal, device-local growth. Not authoritative ranking or a currency with monetary value.
 * Imported from the supplied growth v3 package; public/cloud persistence is deliberately excluded.
 * Durable replay protection lives in growthStore, alongside the progress in one atomic record.
 */
import { BADGES, evaluateBadges } from './growthBadges';
import { DEFAULT_FRAME, DEFAULT_POSE, ITEMS, evaluateUnlocks } from './growthItems';
import type { ItemDef } from './growthItems';
import { COINS_PER_WRITE_MAX, levelOf, xpForMatch } from './growthLevel';
import type { XpBreakdown } from './growthLevel';
import { RUSH_COMBO_GOALS, RUSH_SCORE_GOALS, STUDY_STREAK_GOALS, allMissionsForDate, bumpMissions, isNextDay, missionById, missionsForDate, rolloverDaily } from './growthMissions';
import type { MatchSummaryForGrowth, MissionDef, MissionKind } from './growthMissions';

// 分割したモジュール（XP・レベル／ミッション／バッジ／装備）をここから再エクスポートする
export { XP_PARTICIPATION, XP_PER_CORRECT, XP_WIN, XP_DRAW, XP_STREAK_BONUS, XP_PERFECT_BONUS, XP_PER_MATCH_MAX, XP_PER_WRITE_MAX, COINS_PER_WRITE_MAX, xpForMatch, LEVEL_MAX, xpRequiredForLevel, levelOf } from './growthLevel';
export type { XpBreakdown, LevelInfo } from './growthLevel';
export { localDateKey, rolloverDaily, MISSION_POOL, missionDestination, MISSION_DESTINATION_LABEL, MISSIONS_PER_DAY, missionsForDate, BONUS_MISSION_POOL, BONUS_MISSIONS_PER_DAY, RUSH_SCORE_GOALS, RUSH_COMBO_GOALS, STUDY_STREAK_GOALS, bonusMissionsForDate, allMissionsForDate, missionById } from './growthMissions';
export type { MatchSummaryForGrowth, MissionKind, MissionDef, MissionDestination } from './growthMissions';
export { BADGES, badgeById, evaluateBadges, badgeTierColor } from './growthBadges';
export type { BadgeDef } from './growthBadges';
export { DEFAULT_POSE, DEFAULT_FRAME, REMOVABLE_KINDS, LEVEL_PRINTS, LEVEL_REWARD_ITEMS, ITEMS, printOf, gachaRarityOf, itemById, evaluateUnlocks, purchaseItem, equipItem, unequipKind, canUnequip, equippedAccessory, equippedWallpaper, equipTitle, equippedPoseSrc, equippedFramePattern, equippedFrameColor, equippedTitleLabel } from './growthItems';
export type { ItemKind, EquipKind, GachaRarity, ItemDef } from './growthItems';

// ============================================================
// 成長の記録（Firestore の battle_progress/{uid} と同じ形）
// ============================================================

export type { SubjectProgress, DailyRecord, GrowthProgress } from './growthTypes';
import type { SubjectProgress, GrowthProgress } from './growthTypes';


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

/**
 * 結果画面の「あと少し」1行用：いま遊んだ種類（接頭辞）の称号を優先し、無ければ全体でいちばん近いもの。
 * 達成済み・残りが大きすぎる（進捗3割未満）ものは出さない（「あと190」は動機にならない）。
 */
export function nearestBadgeGoal(progress: GrowthProgress, preferPrefix?: string): BadgeGoal | null {
  const all = nextBadgeGoals(progress, BADGES.length).filter((g) => g.remain > 0 && g.ratio >= 0.3);
  return (preferPrefix ? all.find((g) => g.id.startsWith(preferPrefix)) : undefined) ?? all[0] ?? null;
}

/** 積み上げの合計（記録画面用）。すでにある progress の数字をまとめるだけ */
export function lifetimeTotals(progress: GrowthProgress) {
  return {
    loginDays: progress.loginDays,
    studySolved: progress.studySolved,
    holesFilled: progress.holesFilled,
    matches: progress.matches,
    wins: progress.wins,
    correct: progress.correct,
    rushBest: progress.rushBest,
    badges: Object.keys(progress.badges).length,
    badgeTotal: BADGES.length,
    items: progress.owned.length,
  };
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
