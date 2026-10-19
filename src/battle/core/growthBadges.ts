/** growth.ts から分割（growthBadges）。外部からは従来どおり growth.ts 経由で import できる。 */
import type { GrowthProgress } from './growthTypes';
import { levelOf } from './growthLevel';

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
