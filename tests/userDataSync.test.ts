import { describe, expect, it } from 'vitest';
import {
  GROWTH_KEY, mergeCounter, mergeGrowthEnvelope, mergeSet, migrateGuestData, reconcile, sectionField, SYNC_SECTIONS, type KV,
} from '../src/utils/userDataSyncCore';
import { readFileSync } from 'node:fs';

function memory(init: Record<string, string> = {}): KV & { data: Map<string, string> } {
  const data = new Map(Object.entries(init));
  return { data, getItem: k => data.get(k) ?? null, setItem: (k, v) => { data.set(k, v); }, removeItem: k => { data.delete(k); } };
}
const env = (p: Record<string, unknown>, receipts: string[] = [], day = '2026-10-19') =>
  ({ version: 1, progress: { uid: 'u1', xp: 0, coins: 0, owned: [], equipped: {}, daily: { date: day, progress: {}, claimed: [] }, ...p }, receipts, day });

describe('部品のマージ', () => {
  it('回数：base があれば両方の増減を足す／無ければ大きい方', () => {
    expect(mergeCounter(70, 150, 100)).toBe(120); // A で30使い、B で50増えた
    expect(mergeCounter(70, 150)).toBe(150);
    expect(mergeCounter(10, 20, 100)).toBe(0); // マイナスにはしない
  });
  it('集合：片方で外したものは外れる。base が無ければ和集合', () => {
    expect(mergeSet(['a', 'b'], ['a', 'c'])).toEqual(['a', 'b', 'c']);
    expect(mergeSet(['a'], ['a', 'b'], ['a', 'b'])).toEqual(['a']); // この端末で b を外した
    expect(mergeSet(['a', 'c'], ['a', 'b'], ['a'])).toEqual(['a', 'c', 'b']);
  });
});

describe('成長記録（レベル・コイン・ガチャ・持ちもの）', () => {
  it('XP は減らない・持ちものは消えない・受け取り記録は和集合', () => {
    const a = env({ xp: 500, coins: 70, owned: ['hat_a'] }, ['gacha:1']);
    const b = env({ xp: 800, coins: 150, owned: ['hat_b'] }, ['gacha:2']);
    const base = env({ xp: 400, coins: 100, owned: [] });
    const m = mergeGrowthEnvelope(a, b, base) as { progress: Record<string, unknown>; receipts: string[] };
    expect(m.progress.xp).toBe(900); // 400 + 100 + 400
    expect(m.progress.coins).toBe(120);
    expect(m.progress.owned).toEqual(['hat_a', 'hat_b']);
    expect(m.receipts.sort()).toEqual(['gacha:1', 'gacha:2']);
  });
  it('初めてそろえるとき（base なし）は二重に足さない', () => {
    const m = mergeGrowthEnvelope(env({ xp: 500, coins: 70 }), env({ xp: 800, coins: 150 }), null) as { progress: Record<string, unknown> };
    expect(m.progress.xp).toBe(800);
    expect(m.progress.coins).toBe(150);
  });
  it('連続ログインは最後に数えた日が新しい方', () => {
    const m = mergeGrowthEnvelope(env({ lastLoginDate: '2026-10-19', loginStreak: 1 }), env({ lastLoginDate: '2026-10-10', loginStreak: 9 }), null) as { progress: Record<string, unknown> };
    expect(m.progress.loginStreak).toBe(1);
  });
  it('古い日付の受け取り記録は残さない', () => {
    const m = mergeGrowthEnvelope(env({}, ['study:2026-10-01:x', 'study:2026-10-19:y', 'match:r1']), env({}), null) as { receipts: string[] };
    expect(m.receipts.sort()).toEqual(['match:r1', 'study:2026-10-19:y']);
  });
});

describe('reconcile（端末とクラウドを合わせる）', () => {
  it('クラウドが空なら端末の分をそのまま送る', () => {
    const kv = memory({ 'vocab_quiz_v1_u1': JSON.stringify({ version: 1, missed: ['w1'], best: {}, mastered: ['w2'] }) });
    const r = reconcile(kv, 'u1', null, {});
    expect(Object.keys(r.upload)).toContain(sectionField('vocabQuiz'));
    expect(r.changedLocal).toEqual([]);
  });
  it('新しい端末ではクラウドの分を取り込む（✓・プロフィール・連続日数）', () => {
    const kv = memory();
    const remote = {
      [sectionField('vocabQuiz')]: JSON.stringify({ version: 1, missed: [], best: { 'lv1:1': 9 }, mastered: ['ev:lv1:1'] }),
      [sectionField('profile')]: JSON.stringify({ name: 'たろう', grade: '高校2年' }),
      [sectionField('streak')]: JSON.stringify({ lastActive: 'Sun Oct 19 2026', streak: 5 }),
    };
    const r = reconcile(kv, 'u1', remote, {});
    expect(r.changedLocal.sort()).toEqual(['profile', 'streak', 'vocabQuiz']);
    expect(JSON.parse(kv.getItem('profile_u1')!).name).toBe('たろう');
    expect(kv.getItem('streak_u1')).toBe('5');
    expect(Object.keys(r.upload)).toEqual([]); // 同じ内容は書き戻さない（課金を増やさない）
  });
  it('壊れた端末の記録は上書きしない', () => {
    const kv = memory({ 'vocab_quiz_v1_u1': '{broken' });
    reconcile(kv, 'u1', { [sectionField('vocabQuiz')]: JSON.stringify({ version: 1, missed: [], best: {}, mastered: [] }) }, {});
    expect(kv.getItem('vocab_quiz_v1_u1')).toBe('{broken');
  });
  it('ノート：別の端末で消したものは消える', () => {
    const note = (id: string, memo = '') => ({ id, memo });
    const base = { notes: JSON.stringify([note('a'), note('b')]) };
    const kv = memory({ notes_u1: JSON.stringify([note('a'), note('b', '追記')]) });
    reconcile(kv, 'u1', { [sectionField('notes')]: JSON.stringify([note('b')]) }, base);
    expect(JSON.parse(kv.getItem('notes_u1')!)).toEqual([note('b', '追記')]);
  });
});

describe('ゲストの記録をアカウントへ移す', () => {
  it('成長記録・単語・解いた問題が移り、ゲストの分は消える。2回目は何もしない', () => {
    const kv = memory({
      [GROWTH_KEY('guest')]: JSON.stringify({ ...env({ xp: 300, coins: 40, owned: ['x'] }), progress: { ...env({ xp: 300, coins: 40, owned: ['x'] }).progress, uid: 'guest' } }),
      'listening_support_v1_guest': JSON.stringify({ version: 1, words: ['w1'], grammar: [] }),
      'solved_problems_v1_guest': JSON.stringify({ 'c1::q1': 100 }),
      'review_list_guest': JSON.stringify([{ key: 'c1::q1::s1', chapterId: 'c1', questionId: 'q1', subQuestionId: 's1', box: 0, dueAt: 1, wrongCount: 1, correctCount: 0, createdAt: 1, updatedAt: 1 }]),
      'profile_guest': JSON.stringify({ name: 'ゲスト' }),
      'profile_u1': JSON.stringify({ name: '本人' }),
    });
    const r = migrateGuestData(kv, 'u1');
    expect(r.moved).toEqual(expect.arrayContaining(['growth', 'support', 'solved', 'review', 'profile']));
    const g = JSON.parse(kv.getItem(GROWTH_KEY('u1'))!);
    expect(g.progress.uid).toBe('u1');
    expect(g.progress.xp).toBe(300);
    expect(JSON.parse(kv.getItem('profile_u1')!).name).toBe('本人'); // アカウント側を優先
    expect(kv.getItem(GROWTH_KEY('guest'))).toBeNull();
    expect(kv.getItem('solved_problems_v1_guest')).toBeNull();
    expect(JSON.parse(kv.getItem('solved_problems_v1_u1')!)).toEqual({ 'c1::q1': 100 });
    expect(migrateGuestData(kv, 'u1').moved).toEqual([]);
  });
});

describe('Firestore ルールとそろっている', () => {
  it('すべてのデータのフィールドがルールで許可されている', () => {
    const rules = readFileSync('firestore.rules', 'utf8');
    const block = rules.slice(rules.indexOf('match /user_data/{userId}'));
    for (const s of SYNC_SECTIONS) expect(block).toContain(`'${sectionField(s.id)}'`);
  });
  it('アカウント削除で user_data も消す', () => {
    expect(readFileSync('src/features/account/accountDeletion.ts', 'utf8')).toContain('USER_DATA_COLLECTION');
  });
});
