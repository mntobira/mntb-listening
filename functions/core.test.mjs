import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePowerPolicy, clanPower, leagueId, seasonAt, rewardPlan, ranked, validAttestation, EPOCH, PERIOD } from './core.mjs';
// Deliberately artificial test values; never a production policy.
const policy = { version:1, bands:[{rating:0,power:1},{rating:5000,power:2}] };
const plan = entries => rewardPlan(entries, policy);
test('five individual leagues use the frontend thresholds',()=>{
  assert.deepEqual([1399,1400,1599,1600,1800,2000].map(leagueId),['bronze','silver','silver','gold','platinum','manatobi']);
});
test('fortnight starts at Monday midnight Japan and retains a fixed epoch',()=>{
  assert.equal(seasonAt(EPOCH-1),null); assert.equal(seasonAt(EPOCH).id,'s1'); assert.equal(seasonAt(EPOCH+PERIOD-1).id,'s1'); assert.equal(seasonAt(EPOCH+PERIOD).id,'s2');
});
test('ties share rank without tie-breaking away prizes',()=>{
  assert.deepEqual(ranked([{uid:'b',rating:1800},{uid:'a',rating:1800},{uid:'c',rating:1700}]).map(r=>r.rank),[1,1,3]);
});
test('admitting a beginner cannot reduce clan power',()=>{
  const a=[{rating:2100},{rating:1900}]; assert.ok(clanPower([...a,{rating:800}], policy)>clanPower(a, policy)); assert.equal(clanPower([], policy),0);
});
test('server grants require three games and exclude an operator-blocked record',()=>{
  const p=plan([{uid:'a',rating:1800,matches:3,clanId:'one',clanMatches:3},{uid:'b',rating:2200,matches:2},{uid:'c',rating:2500,matches:4,excluded:true}]);
  assert.deepEqual(p.gifts.map(g=>g.uid),['a','a','a']); assert.deepEqual(p.gifts.map(g=>g.kind),['join','individual','clan']); assert.equal(p.clans.length,1); assert.ok(!('members' in p.clans[0]));
});
test('individual cutoff includes every tied player at tenth place',()=>{
  const entries=Array.from({length:12},(_,i)=>({uid:`u${i}`,rating:i<9?1900-i:1800,matches:3}));
  assert.equal(plan(entries).gifts.filter(g=>g.kind==='individual').length,12);
});
test('season rewards: participation coins by final league, rank coins for top 10',()=>{
  const p=plan([{uid:'m',rating:2050,matches:3},{uid:'b',rating:1200,matches:5}]);
  const coins=Object.fromEntries(p.gifts.filter(g=>g.kind==='join').map(g=>[g.uid,g.coins]));
  assert.deepEqual(coins,{m:300,b:50});
  assert.equal(p.gifts.find(g=>g.uid==='m'&&g.kind==='individual').coins,500);
  assert.equal(seasonAt(Date.UTC(2026,9,15,14,59)),null); assert.equal(seasonAt(Date.UTC(2026,9,15,15)).id,'s1');
});
test('clan grants cannot be gained by moving to a strong clan at the deadline',()=>{
  const p=plan([{uid:'a',rating:1500,matches:10,clanId:'team',clanMatches:0}]); assert.equal(p.gifts.some(g=>g.kind==='clan'),false);
});
const room={status:'finished',players:['a','b'],attest:{a:{myScore:100,opponentScore:80,outcome:'win'},b:{myScore:80,opponentScore:100,outcome:'lose'}}};
test('finished mutual attestation validates both scores and outcomes',()=>assert.equal(validAttestation(room,'a'),true));
test('missing peer proof, mismatched scores and self battles cannot earn grants',()=>{
  assert.equal(validAttestation({...room,attest:{a:room.attest.a}},'a'),false);
  assert.equal(validAttestation({...room,attest:{...room.attest,b:{...room.attest.b,myScore:200}}},'a'),false);
  assert.equal(validAttestation({...room,players:['a','a']},'a'),false);
  assert.equal(validAttestation({...room,status:'playing'},'a'),false);
  assert.equal(validAttestation(room,'outsider'),false);
});

test('missing and decreasing secret policies fail closed',()=>{assert.throws(()=>parsePowerPolicy(''));assert.throws(()=>clanPower([{rating:1500}]));assert.throws(()=>parsePowerPolicy({version:1,bands:[{rating:0,power:2},{rating:5000,power:1}]}));});

import { aggregateAchievements, parseDeviceAchievements, levelFromXp } from './core.mjs';
test('achievements: devices are summed; 3 perfects across devices clear a stage', () => {
  const a = aggregateAchievements([{ xp: 100, stages: { s1: { p: 2, n: 3 }, s2: { p: 1, n: 1 } } }, { xp: 3100, stages: { s1: { p: 1, n: 1 } } }]);
  assert.equal(a.stagesCleared, 1); assert.equal(a.xp, 3200); assert.equal(a.level, levelFromXp(3200)); assert.equal(a.level, 11);
  assert.equal(parseDeviceAchievements({ deviceId: 'short', xp: 1, stages: {} }), null);
  assert.equal(parseDeviceAchievements({ deviceId: 'abcdefgh12', xp: 1, stages: { 'a/b': { p: 0, n: 1 } } }), null);
  assert.equal(parseDeviceAchievements({ deviceId: 'abcdefgh12', xp: 1, stages: { a: { p: 2, n: 1 } } }), null);
  assert.ok(parseDeviceAchievements({ deviceId: 'abcdefgh12', xp: 1, stages: { 'eg6_1::q1': { p: 1, n: 2 } } }));
});
