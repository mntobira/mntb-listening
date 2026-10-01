import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
const user = vi.hoisted(()=>({currentUser:{uid:'revision-user'} as {uid:string}|null}));
vi.mock('../src/firebase',()=>({auth:user}));
import { GACHA_COST, GACHA_MULTI_COUNT, GACHA_MULTI_COST, gachaItems, rollGacha } from '../src/battle/core/arenaEconomy';
import { emptyProgress } from '../src/battle/core/growth';
import { drawGacha, drawGachaMulti, drawVideoGacha, completedVideoToken, videoGachaPlaysLeft, GROWTH_STORAGE_PREFIX } from '../src/battle/data/growthStore';
import { leagueOf, leagueProgress, seasonAt, SEASON_EPOCH, SEASON_MS } from '../src/battle/core/leagues';
import { loadPool } from '../src/battle/data/battlePool';
import { questionInScope, vocabRanges } from '../src/battle/core/vocabRanges';
import { getAllGrammarChapters } from '../src/data/englishGrammarData';
const storage = new Map<string,string>();
const seed=(coins=2000)=>storage.set(GROWTH_STORAGE_PREFIX+'revision-user',JSON.stringify({version:1,progress:{...emptyProgress('revision-user'),coins},receipts:[],day:''}));
beforeEach(()=>{ storage.clear(); user.currentUser={uid:'revision-user'}; vi.stubGlobal('localStorage',{getItem:(k:string)=>storage.get(k) ?? null,setItem:(k:string,v:string)=>storage.set(k,v),removeItem:(k:string)=>storage.delete(k)}); seed(); });
afterEach(()=>vi.unstubAllGlobals());
describe('new gacha economics',()=>{
  it('prices are 100 and 1000 for 11 results',()=>{expect([GACHA_COST,GACHA_MULTI_COUNT,GACHA_MULTI_COST]).toEqual([100,11,1000]);});
  it('single pull costs 100 before any duplicate refund and request is idempotent',async()=>{
    const r=await drawGacha('single');expect(r?.result).toBeTruthy();expect(r!.progress.coins).toBe(2000-100+r!.result!.refund);expect((await drawGacha('single'))?.result).toBeNull();
  });
  it('multi prepays 1000 exactly and guarantees at least one R+',async()=>{
    seed(1000);const r=await drawGachaMulti('eleven');expect(r?.results).toHaveLength(11);expect(r!.progress.coins).toBe(r!.results!.reduce((n,x)=>n+x.refund,0));expect(r!.results!.some(x=>x.rarity!=='N')).toBe(true);expect((await drawGachaMulti('eleven'))?.results).toBeNull();
  });
  it('999 coins cannot use refunds or the free extra pull to start a multi',async()=>{seed(999);expect((await drawGachaMulti('too-cheap'))?.results).toBeNull();});
  it('five completed videos are free; a sixth, replay or fabricated token cannot draw',async()=>{
    seed(0);expect(await drawVideoGacha({})).toBeNull();
    for(let i=0;i<5;i++){const token=completedVideoToken();const r=await drawVideoGacha(token);expect(r?.result).toBeTruthy();expect(r!.progress.coins).toBe(0);expect(await drawVideoGacha(token)).toBeNull();}
    expect(videoGachaPlaysLeft()).toBe(0);expect((await drawVideoGacha(completedVideoToken()))?.result).toBeNull();
  });
  it('free duplicates never mint coins and league-only UR is not in the random pool',()=>{
    const p={...emptyProgress('u'),coins:0};const first=rollGacha(p,0,'N',{cost:0,refundDuplicates:false})!;const again=rollGacha(first.next,0,'N',{cost:0,refundDuplicates:false})!;expect(again.duplicate).toBe(true);expect(again.refund).toBe(0);expect(again.next.coins).toBe(0);expect(gachaItems().some(i=>i.id==='frame_league_aurora')).toBe(false);
  });
  it('an account change cancels a pending draw instead of charging the next user',async()=>{user.currentUser={uid:'another'};expect(await drawGacha('old','revision-user')).toBeNull();});
});
describe('battle range and league revision',()=>{
  it.each([[1399,'bronze'],[1400,'silver'],[1600,'gold'],[1800,'platinum'],[2000,'manatobi']] as const)('rating %s is %s',(r,id)=>expect(leagueOf(r).id).toBe(id));
  it('league progress and fortnight boundary are stable',()=>{expect(leagueProgress(1599).remain).toBe(1);expect(seasonAt(SEASON_EPOCH+SEASON_MS).id).toBe('s2');});
  it('100/50-word blocks use real word serials, preserve both directions and cover each book once',async()=>{
    const pool=await loadPool('english_vocab');
    for(const book of [...new Set(pool.map(q=>q.chapterId))])for(const size of [50,100] as const){const ranges=vocabRanges(pool,book,size);const count=new Set(pool.filter(q=>q.chapterId===book).map(q=>q.subQuestionId)).size;expect(ranges.reduce((n,r)=>n+r.count,0)).toBe(count);for(const q of pool.filter(q=>q.chapterId===book))expect(ranges.filter(r=>questionInScope(q,r.id))).toHaveLength(1);}
    expect(pool.filter(q=>questionInScope(q,'vocab:lv1:101:150')).every(q=>Number(q.subQuestionId)>=101&&Number(q.subQuestionId)<=150)).toBe(true);
    expect(pool.some(q=>questionInScope(q,'vocab:lv1:150:101'))).toBe(false);
  });
  it('grammar answer audio is removed while explanations and listening audio remain',async()=>{
    const qs=getAllGrammarChapters().flatMap(c=>[...c.practiceProblems,...c.miniTest]);expect(qs.length).toBeGreaterThan(0);for(const q of qs){expect((q as any).audioTracks).toBeUndefined();expect((q as any).audioUrl).toBeUndefined();}
    expect((await loadPool('english_listening')).every(q=>!!q.audioUrl)).toBe(true);
  });
  it('server aggregation is never imported by the frontend and nav has an independent My Page',()=>{
    expect(readFileSync('src/components/Leaderboard.tsx','utf8')).not.toContain('clanPower');expect(readFileSync('src/App.tsx','utf8')).toContain("id: 'mypage'");expect(readFileSync('src/components/GrowthHub.tsx','utf8')).toContain('ガチャとランキング');
  });
});
