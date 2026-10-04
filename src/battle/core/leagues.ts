/** Public individual leagues. Clan aggregation is intentionally server-only. */
export const LEAGUES = [
  { id: 'bronze', label: 'ブロンズ', min: 0, color: '#87502c', tint: '#f5e5d5' },
  { id: 'silver', label: 'シルバー', min: 1400, color: '#526170', tint: '#e9edf2' },
  { id: 'gold', label: 'ゴールド', min: 1600, color: '#886000', tint: '#fff1bd' },
  { id: 'platinum', label: 'プラチナ', min: 1800, color: '#24687b', tint: '#dcf3f5' },
  { id: 'manatobi', label: 'マナトビ', min: 2000, color: '#7444a0', tint: '#eee1fb' },
] as const;
export type LeagueId = typeof LEAGUES[number]['id'];
export function leagueOf(rating: number) {
  const value = Number.isFinite(rating) ? rating : 1500;
  return [...LEAGUES].reverse().find(l => value >= l.min) ?? LEAGUES[0];
}
export function leagueProgress(rating: number) {
  const current = leagueOf(rating);
  const next = LEAGUES[LEAGUES.indexOf(current) + 1];
  return { current, next, remain: next ? Math.max(0, next.min - rating) : 0,
    ratio: next ? Math.max(0, Math.min(1, (rating - current.min) / (next.min - current.min))) : 1 };
}
/** シーズン1：2026-10-16(金) 0:00 JST 開始・2週間ごと（functions/core.mjs の EPOCH と同じ値） */
export const SEASON_EPOCH = Date.UTC(2026, 9, 15, 15);
export const SEASON_MS = 14 * 86400000;
export function seasonAt(now = Date.now()) {
  const index = Math.max(0, Math.floor((now - SEASON_EPOCH) / SEASON_MS));
  return { id: `s${index + 1}`, number: index + 1, started: now >= SEASON_EPOCH,
    start: SEASON_EPOCH + index * SEASON_MS, end: SEASON_EPOCH + (index + 1) * SEASON_MS };
}

/**
 * ★シーズン報酬（2026-10-04）★ 何がもらえるかを画面に明示するための表。
 * 実際の配布はサーバー（functions/core.mjs の rewardPlan）が同じ値で行う。値を変えるときは両方を直すこと。
 * 条件：シーズン中に「全国対戦（対人）」を3試合以上。報酬はマイページの「プレゼント」に届く。
 */
export const SEASON_REWARDS = {
  minMatches: 3,
  participation: { bronze: 50, silver: 100, gold: 150, platinum: 200, manatobi: 300 } as Record<LeagueId, number>,
  rank: [
    { label: '各リーグ1位', coins: 500, item: 'UR「リーグ・オーロラフレーム」' },
    { label: '各リーグ2〜3位', coins: 300, item: 'UR「リーグ・オーロラフレーム」' },
    { label: '各リーグ4〜10位', coins: 150, item: 'UR「リーグ・オーロラフレーム」' },
  ],
  clan: { label: 'クラン上位3位のメンバー', coins: 200, item: 'UR「リーグ・オーロラフレーム」' },
} as const;
