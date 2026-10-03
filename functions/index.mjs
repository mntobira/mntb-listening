import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { randomBytes } from 'node:crypto';
import { defineSecret } from 'firebase-functions/params';
import { clanPower, parsePowerPolicy, seasonAt, rewardPlan, ranked, validAttestation, EPOCH, PERIOD, REWARD_ITEM } from './core.mjs';
initializeApp();
const db=getFirestore();
const region='asia-northeast1';
const powerPolicy = defineSecret('MANA_CLAN_POWER_POLICY');
const privatePolicy = () => parsePowerPolicy(powerPolicy.value());
const memberRef=uid=>db.collection('mana_memberships').doc(uid);
const clanRef=id=>db.collection('mana_clans').doc(id);
const stamp=()=>FieldValue.serverTimestamp();
const safeId=value=>typeof value==='string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
function fail(code,message) { throw new HttpsError(code,message); }
function requireUid(req) {
  if (!req.auth?.uid || req.auth.token?.firebase?.sign_in_provider === 'anonymous') fail('unauthenticated','Googleログインが必要です。');
  return req.auth.uid;
}
const nameOf=row=>String(row?.get('nickname') || 'メンバー').slice(0,24);
function publicClan(doc) { const c=doc.data(); return c ? { id:doc.id, name:c.name, power:c.power ?? 0, members:c.memberUids.length, league:'mana', updatedAt:c.updatedAt?.toMillis?.() ?? 0, wins:c.wins ?? 0, draws:c.draws ?? 0, losses:c.losses ?? 0 } : null; }
async function powerFor(tx, uids) { return clanPower(uids.length ? (await tx.getAll(...uids.map(uid=>db.collection('battle_ranking').doc(uid)))).map(s=>s.data() ?? {}) : [], privatePolicy()); }
async function quota(uid) {
  const ref=db.collection('mana_rate_limits').doc(uid); const now=Date.now();
  await db.runTransaction(async tx=>{const s=await tx.get(ref); const d=s.data() ?? {}; const reset=now-(d.window ?? 0)>60000; const count=reset?1:(d.count ?? 0)+1; if(count>30) fail('resource-exhausted','操作が多すぎます。1分待ってください。'); tx.set(ref,{window:reset?now:d.window,count});});
}
async function overview(uid) {
  const [m,rank]=await Promise.all([uid?memberRef(uid).get():Promise.resolve(null),db.collection('mana_clans').orderBy('power','desc').limit(50).get()]);
  let mine={clan:null};
  if(m?.get('clanId')) {const c=await clanRef(m.get('clanId')).get(); if(c.exists) {const d=c.data(); mine={clan:publicClan(c),owner:d.ownerUid===uid,inviteCode:d.inviteCode,memberNames:Object.values(d.memberNames ?? {})};}}
  return {mine,ranking:ranked(rank.docs.map(publicClan),'power')};
}
export async function handleClan(req) {
  const data=req.data ?? {}; const action=data.action;
  if(action==='status') {const config=await db.collection('league_control').doc('config').get(); return {ready:config.get('enabled')===true && Boolean(privatePolicy()),epoch:EPOCH,periodDays:14};}
  if(action==='overview' || action==='refresh') return overview(req.auth?.uid);
  const uid=requireUid(req); await quota(uid);
  if(action==='rewards') {const snap=await db.collection('league_rewards').doc(uid).collection('items').orderBy('createdAt','desc').limit(100).get(); return {rewards:snap.docs.map(d=>({id:d.id,itemId:d.get('itemId'),season:d.get('season'),label:d.get('label'),rank:d.get('rank')}))};}
  if(action==='claimReward') {if(!safeId(data.rewardId)) fail('invalid-argument','プレゼントを選び直してください。'); const d=await db.collection('league_rewards').doc(uid).collection('items').doc(data.rewardId).get(); if(!d.exists || d.get('itemId')!==REWARD_ITEM) fail('not-found','このアカウントのプレゼントはありません。'); return {id:d.id,itemId:d.get('itemId'),season:d.get('season'),label:d.get('label'),rank:d.get('rank')};}
  if(action==='create' || action==='join') {
    const now=Date.now(); const invite=String(data.inviteCode ?? '').toUpperCase(); const name=String(data.name ?? '').normalize('NFKC').trim();
    if(action==='create' && (name.length<2 || name.length>16 || /[\p{Cc}<>@]|https?:|死ね|殺す|fuck|sex/iu.test(name))) fail('invalid-argument','クラン名は個人情報や不適切な語を含まない2〜16文字で入力してください。');
    if(action==='join' && !/^[A-F0-9]{8}$/.test(invite)) fail('invalid-argument','招待コードは8文字です。');
    const newClan=db.collection('mana_clans').doc(); const newCode=randomBytes(4).toString('hex').toUpperCase();
    await db.runTransaction(async tx=>{
      const m=await tx.get(memberRef(uid));
      if(m.get('clanId')) fail('already-exists','すでにクランに参加しています。');
      if((m.get('cooldownUntil') ?? 0)>now) fail('failed-precondition','脱退後24時間は参加できません。');
      let ref=newClan; let current; let targetCode=newCode;
      if(action==='join') {const code=await tx.get(db.collection('mana_invites').doc(invite)); if(!code.exists) fail('not-found','招待コードが見つかりません。'); ref=clanRef(code.get('clanId')); current=await tx.get(ref); if(!current.exists) fail('not-found','クランが見つかりません。'); targetCode=invite;}
      else {if((await tx.get(db.collection('mana_invites').doc(newCode))).exists) fail('aborted','もう一度作成してください。');}
      const c=current?.data(); const uids=[...(c?.memberUids ?? []),uid];
      if(uids.length>20) fail('resource-exhausted','このクランは20人で満員です。');
      const power=await powerFor(tx,uids);
      const profile=await tx.get(db.collection('battle_ranking').doc(uid));
      const season=seasonAt(now); const entry=season?await tx.get(db.collection('league_seasons').doc(season.id).collection('entries').doc(uid)):null;
      const names={...(c?.memberNames ?? {}),[uid]:nameOf(profile)};
      tx.set(ref,{...(c ?? {name,ownerUid:uid,inviteCode:targetCode,createdAt:stamp(),wins:0,losses:0,draws:0}),memberUids:uids,memberNames:names,power,updatedAt:stamp()});
      if(!c) tx.create(db.collection('mana_invites').doc(newCode),{clanId:ref.id});
      tx.set(memberRef(uid),{clanId:ref.id,joinedAt:now,cooldownUntil:0});
      if(entry?.exists) tx.update(entry.ref,{clanId:ref.id,clanMatches:0});
    });
    return {ok:true};
  }
  if(action==='leave') {
    const now=Date.now(); await db.runTransaction(async tx=>{
      const m=await tx.get(memberRef(uid)); if(!m.get('clanId')) fail('not-found','参加中のクランがありません。');
      const ref=clanRef(m.get('clanId')); const s=await tx.get(ref); const c=s.data(); if(!c) fail('not-found','クランがありません。');
      const uids=c.memberUids.filter(id=>id!==uid); const power=await powerFor(tx,uids);
      const season=seasonAt(now); const entry=season?await tx.get(db.collection('league_seasons').doc(season.id).collection('entries').doc(uid)):null;
      const names={...c.memberNames}; delete names[uid];
      if(!uids.length){tx.delete(ref);tx.delete(db.collection('mana_invites').doc(c.inviteCode));}
      else tx.update(ref,{memberUids:uids,memberNames:names,power,ownerUid:c.ownerUid===uid?uids[0]:c.ownerUid,updatedAt:stamp()});
      tx.set(memberRef(uid),{clanId:null,cooldownUntil:now+86400000,joinedAt:0});
      if(entry?.exists) tx.update(entry.ref,{clanId:null,clanMatches:0});
    }); return {ok:true};
  }
  if(action==='challenge') {
    if(!safeId(data.roomId) || !/^[A-F0-9]{8}$/.test(String(data.inviteCode))) fail('invalid-argument','対戦の情報が正しくありません。');
    await db.runTransaction(async tx=>{
      const [m,invite,room,existing]=await tx.getAll(memberRef(uid),db.collection('mana_invites').doc(data.inviteCode),db.collection('battle_rooms').doc(data.roomId),db.collection('mana_duels').doc(data.roomId));
      if(existing.exists) fail('already-exists','登録済みの交流戦です。');
      if(!m.get('clanId') || !invite.exists || m.get('clanId')===invite.get('clanId')) fail('failed-precondition','別のクランを指定してください。');
      const [own,target]=await tx.getAll(clanRef(m.get('clanId')),clanRef(invite.get('clanId')));
      if(!own.exists || !target.exists || own.get('ownerUid')!==uid) fail('permission-denied','代表者のみ交流戦を申し込めます。');
      if(room.get('hostUid')!==uid || room.get('status')!=='waiting' || room.get('mode')!=='friend') fail('failed-precondition','作成した待機部屋を指定してください。');
      tx.create(existing.ref,{clanA:own.id,clanB:target.id,playersA:own.get('memberUids'),playersB:target.get('memberUids'),createdAt:stamp(),status:'waiting'});
    }); return {ok:true};
  }
  fail('invalid-argument','操作を選び直してください。');
}
export const manaClan=onCall({region,maxInstances:10,timeoutSeconds:60,secrets:[powerPolicy]},handleClan);

/** Recalculate privately, never trust a browser-supplied clan power or membership. */
export async function refreshClan(uid) {
  await db.runTransaction(async tx=>{
    const m=await tx.get(memberRef(uid)); if(!m.get('clanId')) return;
    const c=await tx.get(clanRef(m.get('clanId'))); if(!c.exists) return;
    const power=await powerFor(tx,c.get('memberUids')); tx.update(c.ref,{power,updatedAt:stamp()});
  });
}
export async function recordRating(uid,before,after) {
  if(!after?.lastRoomId || after.lastRoomId===before?.lastRoomId || !safeId(after.lastRoomId)) return;
  if(!Number.isFinite(after.rating) || after.rating<100 || after.rating>4000) return;
  const increase=['wins','losses','draws'].reduce((n,k)=>n+(after[k] ?? 0)-(before?.[k] ?? 0),0);
  if(increase!==1 || Math.abs(after.rating-(before?.rating ?? 1500))>60) return;
  await refreshClan(uid);
  await recordSeasonRating(uid, after);
}

// Either the rating write OR the second player's proof may arrive last.
// Both triggers use the same receipt, so event ordering cannot lose or double-count a match.
export async function recordSeasonRating(uid, after) {
  const room=(await db.collection('battle_rooms').doc(after.lastRoomId).get()).data();
  if(room?.mode!=='random' || !validAttestation(room,uid)) return;
  const time=after.updatedAt?.toMillis?.(); if(!Number.isFinite(time)) return;
  const season=seasonAt(time); if(!season) return;
  await db.runTransaction(async tx=>{
    const receipt=db.collection('league_receipts').doc(uid).collection('rooms').doc(after.lastRoomId);
    const entry=db.collection('league_seasons').doc(season.id).collection('entries').doc(uid);
    const [seen,old,m,excluded,seasonState]=await tx.getAll(receipt,entry,memberRef(uid),db.collection('league_exclusions').doc(uid),db.collection('league_seasons').doc(season.id));
    if(seen.exists || excluded.get('excluded')===true || ['freezing','awarding','settled'].includes(seasonState.get('status'))) return;
    const p=old.data() ?? {}; const clanId=(m.get('joinedAt') ?? 0)<=time ? (m.get('clanId') ?? null) : null;
    const latest=time>=(p.lastUpdateMs ?? 0);
    tx.create(receipt,{season:season.id,createdAt:stamp()});
    tx.set(entry,{uid,rating:latest?after.rating:p.rating,matches:(p.matches ?? 0)+1,clanId,clanMatches:clanId?((p.clanId===clanId?p.clanMatches:0) ?? 0)+1:0,lastUpdateMs:Math.max(time,p.lastUpdateMs ?? 0),excluded:false});
    tx.set(db.collection('league_seasons').doc(season.id),{start:season.start,end:season.end},{merge:true});
  });
}
export const onManaRating=onDocumentWritten({document:'battle_ranking/{uid}',region,maxInstances:20,retry:true,secrets:[powerPolicy]},event=>event.data?.after.exists?recordRating(event.params.uid,event.data.before.data(),event.data.after.data()):undefined);

export async function recordDuel(roomId,room) {
  if(!validAttestation(room,room?.players?.[0])) return;
  await db.runTransaction(async tx=>{
    const ref=db.collection('mana_duels').doc(roomId); const duel=await tx.get(ref); const d=duel.data(); if(!d || d.status==='finished') return;
    const a=room.players.find(uid=>d.playersA.includes(uid)); const b=room.players.find(uid=>d.playersB.includes(uid));
    if(!a || !b || a===b) return;
    const [ca,cb,ma,mb]=await tx.getAll(clanRef(d.clanA),clanRef(d.clanB),memberRef(a),memberRef(b));
    if(!ca.exists || !cb.exists || ma.get('clanId')!==d.clanA || mb.get('clanId')!==d.clanB) return;
    const outcome=room.attest[a].outcome;
    tx.update(ref,{status:'finished',outcome,finishedAt:stamp()});
    const field=outcome==='win'?'wins':outcome==='lose'?'losses':'draws'; const other=outcome==='win'?'losses':outcome==='lose'?'wins':'draws';
    tx.update(ca.ref,{[field]:FieldValue.increment(1)});tx.update(cb.ref,{[other]:FieldValue.increment(1)});
  });
}
// ★対戦の部屋は解答のたびに書き込まれる（1試合 約35回）。同時に大勢が対戦すると
//   maxInstances:5 では処理待ちが積み上がり、クラン戦の結果反映が遅れる。
//   決着していない書き込みはすぐ return するので、上限を上げても費用はほぼ増えない。
export const onManaDuel=onDocumentWritten({document:'battle_rooms/{roomId}',region,maxInstances:30,retry:true,secrets:[powerPolicy]},async event=>{
  const room=event.data?.after.data();
  if(!validAttestation(room,room?.players?.[0])) return;
  await recordDuel(event.params.roomId,room);
  if(room.mode==='random') {
    for(const uid of room.players) {
      const row=(await db.collection('battle_ranking').doc(uid).get()).data();
      if(row?.lastRoomId===event.params.roomId) await recordSeasonRating(uid,row);
    }
  }
});

/** Freeze once after a grace period, then resume idempotent reward creation on retries. */
export async function settleSeason(id,now=Date.now()) {
  const ref=db.collection('league_seasons').doc(id); const state=await ref.get();
  const data=state.data(); if(!data || data.end>now-3600000 || data.status==='settled') return;
  if(!data.plan) {
    await db.runTransaction(async tx=>{const s=await tx.get(ref);if(!s.get('plan') && s.get('status')!=='settled')tx.update(ref,{status:'freezing'});});
    const [entries,exclusions]=await Promise.all([ref.collection('entries').get(),db.collection('league_exclusions').where('excluded','==',true).get()]);
    const blocked=new Set(exclusions.docs.map(d=>d.id));
    const plan=rewardPlan(entries.docs.map(d=>({...d.data(),excluded:blocked.has(d.id)})), privatePolicy());
    // Plan is protected from all client reads. Freeze avoids ranking changes during retries.
    await db.runTransaction(async tx=>{const s=await tx.get(ref);if(!s.get('plan'))tx.update(ref,{plan,status:'awarding',frozenAt:stamp()});});
  }
  const plan=(await ref.get()).get('plan');
  for(const gift of plan.gifts) {
    const target=db.collection('league_rewards').doc(gift.uid).collection('items').doc(`${id}_${gift.kind}`);
    try {await target.create({itemId:REWARD_ITEM,season:id,label:gift.label,rank:gift.rank,createdAt:stamp()});}
    catch(e) {if(e.code!==6 && e.code!=='already-exists') throw e;}
  }
  await ref.update({status:'settled',settledAt:stamp()});
}
export const settleManaLeagues=onSchedule({schedule:'0 1 * * *',timeZone:'Asia/Tokyo',region,maxInstances:1,timeoutSeconds:540,secrets:[powerPolicy]},async()=>{
  const control=await db.collection('league_control').doc('config').get(); if(control.get('enabled')!==true) return;
  const states=await db.collection('league_seasons').where('end','<=',Date.now()-3600000).get();
  for(const s of states.docs) await settleSeason(s.id);
});
