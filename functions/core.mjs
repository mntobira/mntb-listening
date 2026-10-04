/** SERVER ONLY. Never import this file in Vite or expose per-member intermediate values. */
// シーズン1：2026-10-16(金) 0:00 JST 開始・2週間ごと（src/battle/core/leagues.ts と必ず同じ値）
export const EPOCH = Date.UTC(2026, 9, 15, 15);
export const PERIOD = 14 * 86400000;
export const REWARD_ITEM = 'frame_league_aurora';
export const LEAGUES = ['bronze', 'silver', 'gold', 'platinum', 'manatobi'];
export function leagueId(r) { return r >= 2000 ? 'manatobi' : r >= 1800 ? 'platinum' : r >= 1600 ? 'gold' : r >= 1400 ? 'silver' : 'bronze'; }
export function seasonAt(time) {
  if (time < EPOCH) return null;
  const n = Math.floor((time - EPOCH) / PERIOD);
  return { id: `s${n + 1}`, start: EPOCH + n * PERIOD, end: EPOCH + (n + 1) * PERIOD };
}
/** Production values come ONLY from Secret Manager; no public fallback criteria. */
export function parsePowerPolicy(raw) {
  let p;
  try { p = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { /* fail closed */ }
  if (p?.version !== 1 || !Array.isArray(p.bands) || p.bands.length < 2 || p.bands.length > 50
    || p.bands.some((b,i) => !Number.isFinite(b.rating) || !Number.isFinite(b.power) || b.power <= 0
      || (i > 0 && (b.rating <= p.bands[i-1].rating || b.power < p.bands[i-1].power)))) {
    throw new Error('Clan power policy is missing or invalid.');
  }
  return p;
}
export function clanPower(rows, policy) {
  const { bands } = parsePowerPolicy(policy);
  const contribution = row => {
    const rating = Number.isFinite(row.rating) ? row.rating : 1500;
    if (rating <= bands[0].rating) return bands[0].power;
    const next = bands.findIndex(b => b.rating >= rating);
    if (next < 0) return bands.at(-1).power;
    const lo = bands[next-1], hi = bands[next];
    return lo.power + (hi.power-lo.power)*(rating-lo.rating)/(hi.rating-lo.rating);
  };
  return Math.round(rows.slice(0,20).reduce((sum,row)=>sum+contribution(row),0));
}
export function ranked(rows, field = 'rating') {
  const sorted = [...rows].sort((a, b) => b[field] - a[field] || a.uid?.localeCompare(b.uid ?? '') || a.id?.localeCompare(b.id ?? '') || 0);
  let rank = 0; let previous;
  return sorted.map((r, i) => { if (r[field] !== previous) rank = i + 1; previous = r[field]; return { ...r, rank }; });
}
export function validAttestation(room, uid) {
  if (room?.status !== 'finished' || room.players?.length !== 2 || !room.players.includes(uid) || room.players[0] === room.players[1]) return false;
  const [a,b] = room.players.map(p => room.attest?.[p]);
  if (!a || !b || !Number.isFinite(a.myScore) || !Number.isFinite(b.myScore) || a.myScore < 0 || b.myScore < 0 || a.myScore !== b.opponentScore || b.myScore !== a.opponentScore) return false;
  const outcome = a.myScore > b.myScore ? 'win' : a.myScore < b.myScore ? 'lose' : 'draw';
  return a.outcome === outcome && b.outcome === ({ win:'lose',lose:'win',draw:'draw' })[outcome];
}
/** シーズン報酬表（src/battle/core/leagues.ts の SEASON_REWARDS と同じ値を保つ） */
export const PARTICIPATION_COINS = { bronze: 50, silver: 100, gold: 150, platinum: 200, manatobi: 300 };
export function rankCoins(rank) { return rank === 1 ? 500 : rank <= 3 ? 300 : 150; }
export const CLAN_COINS = 200;
export function rewardPlan(entries, powerPolicy) {
  const eligible = entries.filter(e => e.matches >= 3 && !e.excluded);
  const gifts = [];
  // 参加賞：シーズン中に全国の対人戦3試合以上 → 最終リーグに応じたマナコイン
  for (const e of eligible) { const lg = leagueId(e.rating); gifts.push({ uid:e.uid, kind:'join', rank:0, label:lg, coins:PARTICIPATION_COINS[lg], itemId:null }); }
  for (const league of LEAGUES) {
    for (const row of ranked(eligible.filter(e => leagueId(e.rating) === league))) {
      if (row.rank <= 10) gifts.push({ uid:row.uid, kind:'individual', rank:row.rank, label:league, coins:rankCoins(row.rank), itemId:REWARD_ITEM });
    }
  }
  const groups = new Map();
  for (const e of eligible) if (e.clanId && e.clanMatches >= 3) { const list=groups.get(e.clanId) ?? []; list.push(e); groups.set(e.clanId,list); }
  const clans=ranked([...groups].map(([id, members]) => ({ id, power:clanPower(members, powerPolicy), members })), 'power');
  for (const clan of clans.filter(c => c.rank <= 3)) for (const e of clan.members) gifts.push({ uid:e.uid, kind:'clan', rank:clan.rank, label:'マナクラン', coins:CLAN_COINS, itemId:REWARD_ITEM });
  return { gifts, clans:clans.map(({members,...publicRow}) => publicRow) };
}

/** とびら君のレベル（src/battle/core/growth.ts の levelOf と同じ式。Lv.99 まで） */
export function levelFromXp(xp) {
  const need = (lv) => lv <= 1 ? 0 : Math.round(60 * Math.pow(lv - 1, 1.6) + 50 * (lv - 2));
  const safe = Number.isFinite(xp) && xp > 0 ? Math.floor(xp) : 0;
  let level = 1;
  while (level < 99 && safe >= need(level + 1)) level += 1;
  return level;
}
export const STAGE_CLEAR_PERFECTS = 3;
/** 端末ごとの記録を合算する。満点・挑戦回数・XP は足し算（各端末の記録は独立しているため） */
export function aggregateAchievements(devices) {
  const stages = {};
  let xp = 0;
  for (const d of devices) {
    xp += Number.isInteger(d?.xp) ? d.xp : 0;
    for (const [k, v] of Object.entries(d?.stages ?? {})) {
      const cur = stages[k] ?? { p: 0, n: 0 };
      stages[k] = { p: cur.p + (v?.p ?? 0), n: cur.n + (v?.n ?? 0) };
    }
  }
  const cleared = Object.values(stages).filter((s) => s.p >= STAGE_CLEAR_PERFECTS).length;
  return { stages, xp, stagesCleared: Math.min(100000, cleared), level: levelFromXp(xp) };
}
/** 端末から届いた記録の検証（壊れた・大きすぎる値は受け取らない） */
export function parseDeviceAchievements(data) {
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(String(data?.deviceId ?? ''))) return null;
  const xp = data?.xp;
  if (!Number.isInteger(xp) || xp < 0 || xp > 100000000) return null;
  const raw = data?.stages;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const entries = Object.entries(raw);
  if (entries.length > 2000) return null;
  const stages = {};
  for (const [k, v] of entries) {
    if (!/^[A-Za-z0-9_:-]{1,200}$/.test(k)) return null;
    const p = v?.p, n = v?.n;
    if (!Number.isInteger(p) || !Number.isInteger(n) || p < 0 || n < 0 || p > n || n > 100000) return null;
    stages[k] = { p, n };
  }
  return { deviceId: data.deviceId, xp, stages };
}
