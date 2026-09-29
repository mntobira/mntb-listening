import { it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { SUBJECTS, getChaptersOfSubject } from '../src/data/allChapters';
import { SUBJECT_INDEX, SUBJECT_STATS } from '../src/data/chapterIndex.generated';
import { FEATURES, isSubjectEnabled } from '../src/config/features';
import { POOL_COUNTS, loadPool } from '../src/battle/data/battlePool';
import { defaultEnabledSubjects, normalizeRule } from '../src/battle/core/battleRules';
import { arenaRule } from '../src/battle/core/arenaRules';
import { EXTERNAL_SUBJECTS } from '../src/data/externalSubjects';
const subject = 'english_listening';
it('exposes listening first, with English grammar and vocabulary as sub-features only', () => {
  expect(SUBJECTS.map(s=>s.id)).toEqual([subject,'english_grammar']);
  expect(SUBJECT_INDEX.map(s=>s.id)).toEqual([subject,'english_grammar']);
  expect(Object.keys(SUBJECT_STATS)).toEqual([subject,'english_grammar']);
  expect(Object.keys(POOL_COUNTS)).toEqual([subject,'english_grammar','english_vocab']);
  expect(defaultEnabledSubjects()).toEqual([subject,'english_grammar','english_vocab']);
  expect(EXTERNAL_SUBJECTS.map(s=>s.id)).toEqual(['english_vocab']);
  expect(FEATURES.battle).toBe(true);
  expect(isSubjectEnabled('english_grammar')).toBe(true);
  for(const other of ['math','chemistry','chemistry_basic','biology_basic','geography','rika','joho']) {
    expect(isSubjectEnabled(other)).toBe(false);
    expect(normalizeRule(other,{enabled:true}).enabled).toBe(false);
  }
});
it('keeps English grammar (100) and vocabulary (9541) battle banks loadable', async () => {
  expect(await loadPool('english_grammar')).toHaveLength(100);
  expect(await loadPool('english_vocab')).toHaveLength(9541);
  expect(getChaptersOfSubject('english_grammar').length).toBeGreaterThan(0);
  expect(normalizeRule('english_vocab',{}).enabled).toBe(true);
});
it('keeps nine units, 135 practice problems and their audio/images', () => {
  const chapters=getChaptersOfSubject(subject);
  expect(chapters).toHaveLength(9);
  expect(chapters.reduce((sum,c)=>sum+c.practiceProblems.length+c.miniTest.length,0)).toBe(135);
  const index=SUBJECT_INDEX.find(entry=>entry.id===subject)!.chapters;
  expect(index.map(entry=>entry.practiceIds)).toEqual(chapters.map(chapter=>chapter.practiceProblems.map(problem=>problem.id)));
  expect(readFileSync('src/components/ListeningHome.tsx','utf8')).not.toContain("import('../data/englishListeningData')");
  const audio=new Set<string>();const assets=new Set<string>();
  const walk=(value:unknown,key='')=>{
    if(typeof value==='string') {
      if(key==='audioUrl') {expect(value.startsWith('/')).toBe(true);audio.add(value);assets.add(value);}
      for(const hit of value.matchAll(/(?:src=["']|url\(["']?)(\/[^"'\s)>]+)/g))assets.add(hit[1]);
      if(value.startsWith('/')&&/\.(png|jpg|jpeg|webp|svg|mp3|mp4)(\?|$)/i.test(value))assets.add(value);
    }else if(Array.isArray(value))value.forEach(v=>walk(v));
    else if(value&&typeof value==='object')Object.entries(value).forEach(([k,v])=>walk(v,k));
  };
  walk(chapters);expect(audio.size).toBeGreaterThan(100);
  for(const path of assets)expect(existsSync(resolve('public','.'+decodeURIComponent(path.split('?')[0]))),path).toBe(true);
  console.log(`Verified ${audio.size} distinct audio URLs and ${assets.size} referenced local assets.`);
});
it('loads 254 recorded battle questions with 55-second rounds',async()=>{
  const pool=await loadPool(subject);expect(pool).toHaveLength(254);
  expect(new Set(pool.map(q=>q.id)).size).toBe(254);
  for(const q of pool){expect(q.subject).toBe(subject);expect(q.audioUrl).toBeTruthy();expect(existsSync(resolve('public','.'+q.audioUrl!))).toBe(true);}
  expect(arenaRule(normalizeRule(subject,{})).timeLimitOverride).toBe(55);
  expect(await loadPool('math')).toEqual([]);
});
it('does not reuse integrated credentials or non-listening home links',()=>{
  const firebase=readFileSync('src/firebase.ts','utf8');
  expect(firebase).not.toContain('AIzaSy');expect(firebase).not.toContain('141618374149');
  expect(JSON.parse(readFileSync('.firebaserc','utf8')).projects.default).toBe('demo-manatobi-listening');
  expect(readFileSync('src/components/Home.tsx','utf8')).not.toContain('>まとめプリント</button>');
  expect(readFileSync('src/components/Home.tsx','utf8')).not.toContain('>全体のつながりを見る</button>');
});
it('ships only commercial audio listed in the ledger', () => {
  const status=JSON.parse(readFileSync('COMMERCIAL_AUDIO_STATUS.json','utf8'));
  const ledger=JSON.parse(readFileSync('listening_audio_ledger.json','utf8'));
  expect(status.totalTracks).toBe(ledger.length);
  if(status.status==='approved'){expect(status.legacyTracks).toEqual([]);for(const r of ledger)expect(r.status,r.audioUrl).toBe('replaced');}
  for(const r of ledger)expect(existsSync(resolve('public','.'+r.audioUrl)),r.audioUrl).toBe(true);
  expect(existsSync('license_evidence/README.md')).toBe(true);
});

it('keeps unrelated integrated screens out of the listening startup bundle', () => {
  const app = readFileSync('src/App.tsx', 'utf8');
  for (const screen of ['ModeSelection', 'LogicalTree', 'MockExam', 'TeacherDashboard', 'FeedbackAdminPanel', 'BattleMode']) {
    expect(app, screen).toContain(`React.lazy(() => import(`);
    expect(app, screen).not.toMatch(new RegExp(`import \\{ ${screen} \\} from`));
  }
  expect(app).toContain("import('./battle/ui/BattleMode')");
  expect(app).toContain("import('./components/ModeSelection')");
});

it('only allows a Vercel guest build when Firebase is entirely absent', () => {
  const cleanEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('VITE_FIREBASE_') && key !== 'VITE_USE_EMULATORS' && key !== 'VERCEL'));
  const check = (args: string[], vars: Record<string, string> = {}) => spawnSync(process.execPath, ['scripts/check-release.mjs', ...args], {
    cwd: resolve('.'), env: { ...cleanEnv, ...vars }, encoding: 'utf8',
  });
  const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
  expect(config.buildCommand).toBe('npm run build:vercel');
  expect(check([]).status).not.toBe(0);
  expect(check(['--vercel']).status).not.toBe(0);
  expect(check(['--vercel'], { VERCEL: '1' }).status).toBe(0);
  expect(check(['--vercel'], { VERCEL: '1', VITE_FIREBASE_API_KEY: 'partial' }).status).not.toBe(0);
  expect(check(['--vercel'], { VERCEL: '1', VITE_FIREBASE_PROJECT_ID: 'mntb-4ef06' }).status).not.toBe(0);
  expect(check(['--vercel'], { VERCEL: '1', VITE_USE_EMULATORS: 'true' }).status).not.toBe(0);
  const firebase = { VITE_FIREBASE_API_KEY: 'sample-key', VITE_FIREBASE_PROJECT_ID: 'listening-dedicated', VITE_FIREBASE_AUTH_DOMAIN: 'listening-dedicated.firebaseapp.com', VITE_FIREBASE_APP_ID: '1:123:web:sample' };
  expect(check([], firebase).status).toBe(0);
  expect(check(['--vercel'], { VERCEL: '1', ...firebase }).status).toBe(0);
});
