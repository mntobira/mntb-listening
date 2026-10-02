import { beforeAll,beforeEach,afterAll,it,expect,vi } from 'vitest';
import { initializeTestEnvironment,type RulesTestEnvironment,assertFails } from '@firebase/rules-unit-testing';
import { doc,getDoc,updateDoc,setDoc } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
const state=vi.hoisted(()=>({db:null as any,auth:{currentUser:null as any}}));
vi.mock('../src/firebase',()=>({get db(){return state.db;},auth:state.auth}));
vi.mock('../src/utils/leaderboard',()=>({resolveNickname:()=>state.auth.currentUser?.uid || 'test'}));
import { createFriendRoom,joinRoomByCode,findOrEnqueue,startBattle,submitAnswer,advanceQuestion,watchMatched } from '../src/battle/data/battle';
import { loadPool } from '../src/battle/data/battlePool';
let env:RulesTestEnvironment;
const subject='english_listening';
const login=(uid:string)=>{state.auth.currentUser={uid,photoURL:''};state.db=env.authenticatedContext(uid).firestore();};
beforeAll(async()=>{env=await initializeTestEnvironment({projectId:'demo-listening-online',firestore:{host:'127.0.0.1',port:8080,rules:readFileSync('firestore.rules','utf8')}});await loadPool(subject);},30000);
beforeEach(async()=>{await env.clearFirestore();login('listener-a');});
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
