import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadReviewDone, recordReviewDone, summarizeReviewDone, startOfLocalDay } from '../src/utils/reviewProgress';

const hub = readFileSync('src/components/StudyHub.tsx', 'utf8');
const rrCss = readFileSync('src/components/review-record.css', 'utf8');
const reviewList = readFileSync('src/utils/reviewList.ts', 'utf8');
const catalogCss = readFileSync('src/components/study-catalog.css', 'utf8');
const profile = readFileSync('src/components/ProfileModal.tsx', 'utf8');
const profileCss = readFileSync('src/components/profile-settings.css', 'utf8');

const D = 86400000;

describe('復習の日誌 reviewProgress（2026-10-21）', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    const ls = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
      removeItem: (k: string) => { store.delete(k); },
      clear: () => store.clear(), key: () => null, length: 0,
    } as Storage;
    Object.assign(globalThis, { localStorage: ls, window: { localStorage: ls } });
  });

  it('同じ問題を同じ日に2回直しても今日は1と数える', () => {
    const now = startOfLocalDay(Date.now()) + 12 * 3600e3;
    const s = summarizeReviewDone([{ at: now - 1000, key: 'a' }, { at: now, key: 'a' }, { at: now, key: 'b' }], now);
    expect(s.today).toBe(2);
    expect(s.week).toHaveLength(7);
    expect(s.week[6].isToday).toBe(true);
    expect(s.week[6].label).toBe('今日');
  });

  it('連続日数：今日まだでも昨日まで続いていれば数える', () => {
    const now = startOfLocalDay(Date.now()) + 12 * 3600e3;
    const s = summarizeReviewDone([{ at: now - D, key: 'a' }, { at: now - 2 * D, key: 'b' }, { at: now - 4 * D, key: 'c' }], now);
    expect(s.streak).toBe(2);
    expect(s.today).toBe(0);
  });

  it('記録して読み戻せる（60日より古いものは捨てる）', () => {
    const now = Date.now();
    recordReviewDone('u1', 'k1', now - 61 * D);
    recordReviewDone('u1', 'k2', now);
    expect(loadReviewDone('u1', now).map(e => e.key)).toEqual(['k2']);
  });

  it('復習で正解したら日誌に書く', () => {
    expect(reviewList).toContain('recordReviewDone(uid, key, now)');
  });
});

describe('復習・記録の画面構成（2026-10-21）', () => {
  it('達成の帯（今日のリング・今週の扉）と大きな切替（復習ノート／学習記録）', () => {
    expect(hub).toContain('className="rr-hero"');
    expect(hub).toContain('<TodayRing');
    expect(hub).toContain('<WeekDoors');
    expect(hub).toContain('data-rr-section="review"');
    expect(hub).toContain('data-rr-section="record"');
  });

  it('タブは 今日・苦手・習得・ノート の4つ。習得はメダル棚', () => {
    expect(hub).toContain('data-rr-tab={t.id}');
    for (const t of ['today', 'all', 'mastered', 'notes']) expect(hub).toContain(`id: '${t}'`);
    expect(hub).toContain('<MasteredShelf');
  });

  it('埋め込みの学習記録は見出しを重ねない・ボタンがはみ出さない', () => {
    expect(rrCss).toContain('.rr-page .study-record.is-embedded > .sr-head');
    expect(rrCss).toContain('.rr-page .study-record.is-embedded .sr-retry button { min-width: 0;');
  });

  it('上の帯は小さく、スクロールは一覧（rr-scroll）だけ', () => {
    expect(hub).toContain('<ScrollArea key={`${tab}-${subjectTab}`}>');
    expect(hub).toContain('<ScrollArea key="record"><StudyRecord embedded onRetry={onRetry} /></ScrollArea>');
    expect(hub).toContain('className="rr-scroll" data-rr-scroll data-scrolled=');
    expect(hub).toContain('const size = 56, stroke = 7');
    expect(rrCss).toContain('.rr-page > .rn-wrap > .rr-scroll { flex: 1 1 0; min-height: 120px; overflow-y: auto;');
  });

  it('仕上げ：すべる切替・スクロールの影・メダルから習得へ', () => {
    expect(hub).toContain('data-active={section}');
    expect(rrCss).toContain(".rr-switch[data-active=record]::before { transform: translateX(100%); }");
    expect(rrCss).toContain('.rr-scroll[data-scrolled]::before');
    expect(hub).toContain("className=\"rn-header-stat rr-medal-pill\" onClick={() => { setSection('review'); setTab('mastered'); }}");
  });

  it('動きは transform/opacity のみ・reduced-motion で止める', () => {
    expect(rrCss).toContain('prefers-reduced-motion');
  });
});

describe('見出しをマイページとそろえる（中央・23px・900）', () => {
  it('学習（演習する）の見出しは中央', () => {
    expect(catalogCss).toContain('.sc-head { position: relative; justify-content: center; }');
    expect(catalogCss).toContain('.sc-head-title h1 { font: 900 23px/1.2');
  });
  it('設定の見出しは中央で、MY ACCOUNT は出さない', () => {
    expect(profile).not.toContain('MY ACCOUNT');
    expect(profileCss).toContain('.profile-journal .mt-app-header { position: relative; justify-content: center; }');
  });
  it('復習・記録の見出しも中央', () => {
    expect(rrCss).toContain('.rr-page .rn-header { position: relative; justify-content: center; }');
  });
});
