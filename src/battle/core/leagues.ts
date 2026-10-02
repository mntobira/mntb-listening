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
export const SEASON_EPOCH = Date.UTC(2026, 9, 4, 15); // Monday 2026-10-05 00:00 JST
export const SEASON_MS = 14 * 86400000;
export function seasonAt(now = Date.now()) {
  const index = Math.max(0, Math.floor((now - SEASON_EPOCH) / SEASON_MS));
  return { id: `s${index + 1}`, start: SEASON_EPOCH + index * SEASON_MS, end: SEASON_EPOCH + (index + 1) * SEASON_MS };
}
