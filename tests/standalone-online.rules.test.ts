import { beforeAll,beforeEach,afterAll,it,expect,vi } from 'vitest';
import { initializeTestEnvironment,type RulesTestEnvironment,assertFails } from '@firebase/rules-unit-testing';
import { doc,getDoc,updateDoc,setDoc,deleteDoc,serverTimestamp } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
const state=vi.hoisted(()=>({db:null as any,auth:{currentUser:null as any}}));
vi.mock('../src/firebase',()=>({get db(){return state.db;},auth:state.auth}));
vi.mock('../src/utils/leaderboard',()=>({resolveNickname:()=>state.auth.currentUser?.uid || 'test'}));
import { createFriendRoom,joinRoomByCode,findOrEnqueue,startBattle,submitAnswer,advanceQuestion,watchMatched } from '../src/battle/data/battle';
import { watchPublicStudyProfiles, parsePublicStudyProfile } from '../src/utils/publicStudyProfile';
import { loadPool } from '../src/battle/data/battlePool';
let env:RulesTestEnvironment;
const subject='english_listening';
const login=(uid:string)=>{state.auth.currentUser={uid,photoURL:''};state.db=env.authenticatedContext(uid).firestore();};
beforeAll(async()=>{env=await initializeTestEnvironment({projectId:'demo-listening-online',firestore:{host:'127.0.0.1',port:8080,rules:readFileSync('firestore.rules','utf8')}});await loadPool(subject);},30000);
// フレンド対戦はフレンドどうしだけ。テストで使う組を相互フレンドにしておく
const befriend=async(a:string,b:string)=>env.withSecurityRulesDisabled(async ctx=>{const f=ctx.firestore();await setDoc(doc(f,'friends',a,'items',b),{uid:b,nickname:b,photoURL:'',addedAt:new Date()});await setDoc(doc(f,'friends',b,'items',a),{uid:a,nickname:a,photoURL:'',addedAt:new Date()});});
beforeEach(async()=>{await env.clearFirestore();await befriend('listener-a','listener-b');login('listener-a');});
afterAll(async()=>{await env?.cleanup();});
it('two listening clients create/join/start and answer under security rules',async()=>{
 const created=await createFriendRoom(subject,{questionCount:3});
 login('listener-b');expect(await joinRoomByCode(created.joinCode)).toBe(created.roomId);
 login('listener-a');await startBattle(created.roomId,55);
 const room=await getDoc(doc(state.db,'battle_rooms',created.roomId));
 expect(room.get('subject')).toBe(subject);expect(room.get('players')).toEqual(['listener-a','listener-b']);
 expect(room.get('rules').timeLimitOverride).toBe(55);
 const pool=await loadPool(subject);expect(room.get('questionIds').every((id:string)=>pool.some(q=>q.id===id&&q.audioUrl))).toBe(true);
 await submitAnswer(created.roomId,0,{choice:0,panel:[]},false);
 login('listener-b');await submitAnswer(created.roomId,0,{choice:1,panel:[]},false);
 await advanceQuestion(created.roomId,1,55);
 expect((await getDoc(doc(state.db,'battle_rooms',created.roomId))).get('currentIndex')).toBe(1);
 login('outsider');await assertFails(updateDoc(doc(state.db,'battle_rooms',created.roomId),{currentIndex:2}));
},30000);
it('national listening queue pairs two sessions and notifies the waiting player',async()=>{
 expect((await findOrEnqueue(subject,'listening-a')).roomId).toBeNull();
 const found:string[]=[];const errors:unknown[]=[];
 const stop=watchMatched(id=>found.push(id),e=>errors.push(e),{subject,sessionId:'listening-a'});
 try {
  login('listener-b');const second=await findOrEnqueue(subject,'listening-b');expect(second.roomId).toBeTruthy();
  await vi.waitFor(()=>expect(found).toContain(second.roomId),{timeout:5000});expect(errors).toEqual([]);
  const room=await getDoc(doc(state.db,'battle_rooms',second.roomId!));expect(room.get('subject')).toBe(subject);expect(room.get('mode')).toBe('random');
 }finally{stop();}
},30000);

it('clan internals and league grants deny all direct client reads and writes',async()=>{
 for(const path of ['mana_clans/c','mana_memberships/listener-a','mana_invites/ABCDEF12','mana_duels/d','mana_rate_limits/listener-a','league_control/config','league_seasons/s/entries/listener-a','league_receipts/listener-a/rooms/r','league_exclusions/listener-a','league_rewards/listener-a/items/prize']) {
  await assertFails(getDoc(doc(state.db,path)));
  await assertFails(setDoc(doc(state.db,path),{power:999999,itemId:'frame_league_aurora'}));
 }
});
it('fine vocabulary scope works in friend rooms under rules',async()=>{
 const created=await createFriendRoom('english_vocab',{questionCount:5},'vocab:lv1:1:50');
 login('listener-b');await joinRoomByCode(created.joinCode);
 login('listener-a');await startBattle(created.roomId,30);
 const room=await getDoc(doc(state.db,'battle_rooms',created.roomId));const pool=await loadPool('english_vocab');
 expect(room.get('questionIds')).toHaveLength(5);
 for(const id of room.get('questionIds')){const q=pool.find(q=>q.id===id)!;expect(q.chapterId).toBe('lv1');expect(Number(q.subQuestionId)).toBeGreaterThanOrEqual(1);expect(Number(q.subQuestionId)).toBeLessThanOrEqual(50);}
},30000);


it('public study profile requires explicit consent and owner-only bounded writes',async()=>{
 const ref=doc(state.db,'public_study_profiles','listener-a');
 const valid={public:true,targetSchool:'Example University',studySeconds:3600,updatedAt:serverTimestamp()};
 expect((await getDoc(ref)).exists()).toBe(false);
 await assertFails(setDoc(ref,{...valid,public:false}));
 await assertFails(setDoc(ref,{...valid,email:'private@example.test'}));
 await assertFails(setDoc(ref,{...valid,studySeconds:-1}));
 await assertFails(setDoc(ref,{...valid,studySeconds:0.5}));
 await assertFails(setDoc(ref,{...valid,targetSchool:'x'.repeat(41)}));
 await setDoc(ref,valid);
 login('viewer');expect(parsePublicStudyProfile((await getDoc(doc(state.db,'public_study_profiles','listener-a'))).data())?.targetSchool).toBe('Example University');
 await assertFails(setDoc(doc(state.db,'public_study_profiles','listener-a'),valid));
 await assertFails(deleteDoc(doc(state.db,'public_study_profiles','listener-a')));
 await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'public_study_profiles','listener-a')));
});
it('withdrawing removes metadata live, and a stale time refresh cannot recreate it',async()=>{
 const ref=doc(state.db,'public_study_profiles','listener-a');
 await setDoc(ref,{public:true,targetSchool:'Visible only by consent',studySeconds:120,updatedAt:serverTimestamp()});
 login('viewer');const updates:Record<string,unknown>[]=[];const stop=watchPublicStudyProfiles(['listener-a','never-published'],p=>updates.push(p));
 try{
  await vi.waitFor(()=>expect(updates.at(-1)?.['listener-a']).toBeTruthy(),{timeout:5000});
  login('listener-a');await deleteDoc(doc(state.db,'public_study_profiles','listener-a'));
  await vi.waitFor(()=>expect(updates.at(-1)).toEqual({}),{timeout:5000});
  await assertFails(updateDoc(doc(state.db,'public_study_profiles','listener-a'),{studySeconds:360,updatedAt:serverTimestamp()}));
  expect((await getDoc(doc(state.db,'public_study_profiles','listener-a'))).exists()).toBe(false);
 }finally{stop();}
},15000);
it('public profile: motto is self-written, stagesCleared/level are server-only',async()=>{
 const ref=doc(state.db,'public_study_profiles','listener-a');
 const base={public:true,targetSchool:'A大',studySeconds:60,updatedAt:serverTimestamp()};
 await assertFails(setDoc(ref,{...base,stagesCleared:3}));
 await assertFails(setDoc(ref,{...base,level:12}));
 await assertFails(setDoc(ref,{...base,motto:'x'.repeat(41)}));
 await assertFails(setDoc(ref,{...base,email:'a@b.c'}));
 await setDoc(ref,{...base,motto:'医者になる'});
 // サーバー（Admin）が合算値を書いたあと、本人は志や時間を更新できるが、合算値は変えられない
 await env.withSecurityRulesDisabled(async c=>{await updateDoc(doc(c.firestore(),'public_study_profiles','listener-a'),{stagesCleared:3,level:12});});
 await setDoc(ref,{...base,motto:'先生になる'},{merge:true});
 await assertFails(setDoc(ref,{...base,stagesCleared:99},{merge:true}));
 await assertFails(updateDoc(ref,{level:99,updatedAt:serverTimestamp()}));
 login('viewer');expect(parsePublicStudyProfile((await getDoc(ref)).data())).toMatchObject({motto:'先生になる',stagesCleared:3,level:12});
 await assertFails(getDoc(doc(state.db,'user_achievements','listener-a')));
 login('listener-a');await assertFails(setDoc(doc(state.db,'user_achievements','listener-a'),{level:99}));
 await assertFails(getDoc(doc(state.db,'user_achievements','listener-a','devices','d1')));
});
it('unpublished metadata cannot be retrieved even if an admin seeded it',async()=>{
 await env.withSecurityRulesDisabled(async context=>{await setDoc(doc(context.firestore(),'public_study_profiles','private-user'),{public:false,targetSchool:'Hidden',studySeconds:999});});
 login('viewer');await assertFails(getDoc(doc(state.db,'public_study_profiles','private-user')));
});

it('フレンドでない人は合言葉を知っていてもフレンド対戦に入れない',async()=>{
 const created=await createFriendRoom(subject,{questionCount:3});
 login('stranger');
 await expect(joinRoomByCode(created.joinCode)).rejects.toThrow(/フレンドどうし/);
},30000);
