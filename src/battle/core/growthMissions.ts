/** growth.ts から分割（growthMissions）。外部からは従来どおり growth.ts 経由で import できる。 */
import type { BattleOutcome, BattlePlayerScore } from './types';
import { hashString } from './battleCore';
import type { DailyRecord } from './growthTypes';

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

export function isNextDay(prev: string, today: string): boolean {
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
/**
 * ミッションを押したときの行き先（2026-10-05 ご要望「各ミッションから該当ページに飛べるように」）。
 *   battle … 対戦メニュー／battle_listening・battle_grammar … 対戦メニュー（その教科を選ぶ）
 *   study … 演習する（教科選び）／review … 復習ノート／rush … マナラッシュ
 *   gacha … ガチャ／outfit … きせかえ（持ちもの）／vocab_quiz … 英単語の4択／wordbook … 英単語帳
 */
export type MissionDestination = 'battle' | 'study' | 'review' | 'rush' | 'gacha' | 'outfit' | 'vocab_quiz' | 'wordbook';
export function missionDestination(kind: MissionKind): MissionDestination {
  switch (kind) {
    case 'holes': return 'review';
    case 'study': case 'study_streak': return 'study';
    case 'rush_play': case 'rush_score': case 'rush_combo': return 'rush';
    case 'gacha': return 'gacha';
    case 'equip': return 'outfit';
    case 'vocab_quiz': case 'vocab_perfect': return 'vocab_quiz';
    case 'vocab_learn': return 'wordbook';
    default: return 'battle';
  }
}
export const MISSION_DESTINATION_LABEL: Record<MissionDestination, string> = {
  battle: '対戦へ', study: '演習へ', review: '復習へ', rush: 'ラッシュへ', gacha: 'ガチャへ', outfit: '着がえる', vocab_quiz: '4択へ', wordbook: '単語帳へ',
};

export const MISSIONS_PER_DAY = 3;

/** 決定論的ハッシュ（日付から同じ組を選ぶため）。FNV-1a 32bit。実体は battleCore.hashString（結果は完全に同じ）。 */
const hashOf = hashString;

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
export function bumpMissions(daily: DailyRecord, today: string, gains: Partial<Record<MissionKind, number>> | ((m: MissionDef) => number)): DailyRecord {
  const next = rolloverDaily(daily, today);
  for (const m of allMissionsForDate(today)) {
    const gain = typeof gains === 'function' ? gains(m) : (gains[m.kind] ?? 0);
    if (gain <= 0) continue;
    const before = next.progress[m.id] ?? 0;
    next.progress[m.id] = Math.min(m.goal, before + gain);
  }
  return next;
}
