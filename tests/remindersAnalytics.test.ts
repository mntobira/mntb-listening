import { describe, expect, it, beforeEach } from 'vitest';
import { planReminders, DEFAULT_REMINDER_PREFS, REVIEW_HOUR, STREAK_HOUR } from '../src/utils/studyReminders';
import { readFileSync } from 'node:fs';

const on = { ...DEFAULT_REMINDER_PREFS, enabled: true };
const at = (y: number, m: number, d: number, h = 0) => new Date(y, m - 1, d, h).getTime();

describe('通知の予定', () => {
  it('オフなら何も予約しない', () => {
    expect(planReminders({ now: at(2026, 10, 19, 9), reviewDueAts: [at(2026, 10, 19)], streak: 5, lastActive: null }, DEFAULT_REMINDER_PREFS)).toEqual([]);
  });
  it('今日が復習日なら今日 18:00、新しく期限が来る日だけ追加で', () => {
    const plan = planReminders({ now: at(2026, 10, 19, 9), reviewDueAts: [at(2026, 10, 19, 1), at(2026, 10, 22, 1)], streak: 0, lastActive: null }, on);
    const review = plan.filter(p => p.kind === 'review');
    expect(review.map(p => new Date(p.at).getDate())).toEqual([19, 22]);
    expect(new Date(review[0].at).getHours()).toBe(REVIEW_HOUR);
    expect(review[0].body).toContain('1 問');
    expect(review[1].body).toContain('2 問');
  });
  it('18時を過ぎていたら今日の分は出さない', () => {
    const plan = planReminders({ now: at(2026, 10, 19, 19), reviewDueAts: [at(2026, 10, 19, 1)], streak: 0, lastActive: null }, on);
    expect(plan.filter(p => p.kind === 'review')).toEqual([]);
  });
  it('連続日数：今日まだなら今日 21:00、学習済みなら明日 21:00', () => {
    const now = at(2026, 10, 19, 9);
    const notYet = planReminders({ now, reviewDueAts: [], streak: 4, lastActive: new Date(at(2026, 10, 18)).toDateString() }, on);
    expect(new Date(notYet[0].at).getDate()).toBe(19);
    expect(new Date(notYet[0].at).getHours()).toBe(STREAK_HOUR);
    const done = planReminders({ now, reviewDueAts: [], streak: 4, lastActive: new Date(now).toDateString() }, on);
    expect(new Date(done[0].at).getDate()).toBe(20);
  });
  it('連続1日以下では出さない', () => {
    expect(planReminders({ now: at(2026, 10, 19, 9), reviewDueAts: [], streak: 1, lastActive: null }, on)).toEqual([]);
  });
});

describe('使われ方の記録', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    (globalThis as { localStorage?: unknown }).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); }, removeItem: (k: string) => { store.delete(k); } };
  });
  it('画面・操作・エラーを数え、名前やメールは含めない', async () => {
    const a = await import('../src/utils/analytics');
    a.__resetUsageForTest();
    a.trackScreen('home'); a.trackScreen('foundation'); a.trackScreen('home');
    a.trackEvent('gacha_draw'); a.trackEvent('gacha_draw');
    a.trackError('NA-SHA1'); a.trackError('bad name with spaces');
    const s = a.buildSummary()!;
    expect(s.screens).toEqual({ home: 2, foundation: 1 });
    expect(s.events.gacha_draw).toBe(2);
    expect(s.errors['NA-SHA1']).toBe(1);
    expect(s.install).toMatch(/^[a-f0-9]{16}$/);
    expect(Object.keys(s)).not.toContain('uid');
    expect(JSON.stringify(s)).not.toMatch(/@/);
  });
  it('オフにすると数えない', async () => {
    const a = await import('../src/utils/analytics');
    a.setAnalyticsEnabled(false);
    a.trackScreen('home');
    expect(a.buildSummary()).toBeNull();
    a.setAnalyticsEnabled(true);
  });
  it('ルールは運営だけが読め、書き換え・削除はできない', () => {
    const rules = readFileSync('firestore.rules', 'utf8');
    const block = rules.slice(rules.indexOf('match /usage_sessions/{id}'), rules.indexOf('match /user_data/{userId}'));
    expect(block).toContain('allow read: if isFeedbackAdmin();');
    expect(block).toContain('allow update, delete: if false;');
  });
  it('プライバシーポリシーに書いてある', () => {
    const t = readFileSync('src/features/legal/legalText.ts', 'utf8');
    expect(t).toContain('使われ方の記録');
    expect(t).toContain('学習記録のバックアップ');
  });
});
