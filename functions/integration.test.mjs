import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { handleClan, recordRating, recordSeasonRating, recordDuel, settleSeason } from './index.mjs';
import { EPOCH, PERIOD, seasonAt } from './core.mjs';

const project = process.env.GCLOUD_PROJECT;
if (!process.env.FIRESTORE_EMULATOR_HOST || !project?.startsWith('demo-')) {
  throw new Error('Integration tests require an explicit demo project and Firestore emulator.');
}
// Synthetic emulator-only fixture, NOT production criteria.
process.env.MANA_CLAN_POWER_POLICY = JSON.stringify({version:1,bands:[{rating:0,power:1},{rating:5000,power:2}]});
const db = getFirestore();
const call = (uid, action, data = {}) => handleClan({ data: { action, ...data }, auth: uid ? { uid, token: { firebase: { sign_in_provider: 'google.com' } } } : null });
const overview = uid => call(uid, 'overview');
const clan = async (uid, name) => { await call(uid, 'create', { name }); return (await overview(uid)).mine; };
const finished = (mode = 'random') => ({ mode, status: 'finished', players: ['a', 'b'], attest: { a: { myScore: 200, opponentScore: 100, outcome: 'win' }, b: { myScore: 100, opponentScore: 200, outcome: 'lose' } } });
beforeEach(async () => {
  const r = await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${project}/databases/(default)/documents`, { method: 'DELETE' });
  assert.equal(r.ok, true);
});

test('authenticated create/join, sanitized overview, leader transfer and cooldown', async () => {
  await assert.rejects(call(null, 'create', { name: 'チーム' }), { code: 'unauthenticated' });
  const a = await clan('a', 'あおぞら');
  await call('b', 'join', { inviteCode: a.inviteCode });
  await assert.rejects(call('b', 'create', { name: '別チーム' }), { code: 'already-exists' });
  const o = await overview('b');
  assert.equal(o.mine.clan.members, 2); assert.equal(o.mine.owner, false);
  assert.equal(o.ranking[0].inviteCode, undefined); assert.equal(o.ranking[0].memberUids, undefined);
  assert.equal(o.ranking[0].memberNames, undefined);
  await call('a', 'leave'); assert.equal((await overview('b')).mine.owner, true);
  await assert.rejects(call('a', 'join', { inviteCode: a.inviteCode }), { code: 'failed-precondition' });
  await call('b', 'leave'); assert.equal((await db.doc(`mana_clans/${a.clan.id}`).get()).exists, false);
});

test('simultaneous joins cannot exceed twenty members', async () => {
  const a = await clan('a', '容量テスト');
  const results = await Promise.allSettled(Array.from({ length: 20 }, (_, i) => call(`u${i}`, 'join', { inviteCode: a.inviteCode })));
  assert.ok(results.filter(r => r.status === 'fulfilled').length <= 19);
  // Firestore may exhaust contention retries. Retry those requests serially;
  // only capacity or contention errors are acceptable, never permission/data failures.
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === 'rejected') {
      assert.ok(['resource-exhausted', 'aborted', 10].includes(r.reason.code));
      try { await call(`u${i}`, 'join', { inviteCode: a.inviteCode }); }
      catch (e) { assert.equal(e.code, 'resource-exhausted'); }
    }
  }
  assert.equal((await overview('a')).mine.clan.members, 20);
});

test('leader-only exchange registration, correct clans and idempotent win/loss', async () => {
  const a = await clan('a', 'クランA'), b = await clan('b', 'クランB');
  await call('a2', 'join', { inviteCode: a.inviteCode });
  await db.doc('battle_rooms/duel').set({ hostUid: 'a', status: 'waiting', mode: 'friend' });
  await assert.rejects(call('a2', 'challenge', { roomId: 'duel', inviteCode: b.inviteCode }), { code: 'permission-denied' });
  await call('a', 'challenge', { roomId: 'duel', inviteCode: b.inviteCode });
  await recordDuel('duel', finished('friend')); await recordDuel('duel', finished('friend'));
  assert.equal((await db.doc(`mana_clans/${a.clan.id}`).get()).get('wins'), 1);
  assert.equal((await db.doc(`mana_clans/${b.clan.id}`).get()).get('losses'), 1);
});

test('season entries reject incomplete proof, recover later proof and deduplicate receipts', async () => {
  const s = seasonAt(EPOCH + 1000), time = Timestamp.fromMillis(EPOCH + 1000);
  const row = { rating: 1520, wins: 1, losses: 0, draws: 0, lastRoomId: 'national', updatedAt: time };
  const incomplete = finished(); delete incomplete.attest.b;
  await db.doc('battle_rooms/national').set(incomplete);
  await recordRating('a', { rating: 1500, wins: 0 }, row);
  assert.equal((await db.doc(`league_seasons/${s.id}/entries/a`).get()).exists, false);
  await db.doc('battle_rooms/national').set(finished());
  await recordSeasonRating('a', row); await recordSeasonRating('a', row);
  const entry = await db.doc(`league_seasons/${s.id}/entries/a`).get();
  assert.equal(entry.get('matches'), 1); assert.equal(entry.get('rating'), 1520);
  await db.doc(`league_seasons/${s.id}`).set({ status: 'freezing' }, { merge: true });
  await db.doc('battle_rooms/next').set(finished());
  await recordSeasonRating('a', { ...row, lastRoomId: 'next' });
  assert.equal((await entry.ref.get()).get('matches'), 1);
});

test('fortnight settlement and own-account gift claims are idempotent', async () => {
  const s = seasonAt(EPOCH + 1000), ref = db.doc(`league_seasons/${s.id}`);
  await ref.set({ start: s.start, end: s.end });
  await ref.collection('entries').doc('winner').set({ uid: 'winner', rating: 1700, matches: 3, clanMatches: 0, clanId: null });
  await ref.collection('entries').doc('ineligible').set({ uid: 'ineligible', rating: 2000, matches: 2 });
  await settleSeason(s.id, EPOCH + PERIOD + 3600001);
  await settleSeason(s.id, EPOCH + PERIOD + 3600001);
  const gifts = (await call('winner', 'rewards')).rewards;
  assert.equal(gifts.length, 1); assert.equal(gifts[0].itemId, 'frame_league_aurora');
  assert.equal((await call('ineligible', 'rewards')).rewards.length, 0);
  await assert.rejects(call('other', 'claimReward', { rewardId: gifts[0].id }), { code: 'not-found' });
  assert.equal((await call('winner', 'claimReward', { rewardId: gifts[0].id })).id, gifts[0].id);
  assert.equal((await ref.get()).get('status'), 'settled');
});
