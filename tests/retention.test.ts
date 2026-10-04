import { describe, expect, it } from 'vitest';
import { BADGES, emptyProgress, lifetimeTotals, nearestBadgeGoal } from '../src/battle/core/growth';
import { LOGIN_MILESTONES, tobiraMood } from '../src/data/tobiraMood';

const base = () => emptyProgress('u');

describe('あと少し（nearestBadgeGoal）', () => {
  it('遊んだ種類の称号を優先する', () => {
    const p = { ...base(), studySolved: 8, matches: 9 };
    expect(nearestBadgeGoal(p, 'b_study')?.id).toBe('b_study_10');
    expect(nearestBadgeGoal(p, 'b_study')?.remain).toBe(2);
  });
  it('遠すぎる目標（3割未満）は出さない', () => {
    const p = { ...base(), studySolved: 1 };
    expect(nearestBadgeGoal(p, 'b_study')?.id).not.toBe('b_study_10');
  });
  it('持っている称号は出さない', () => {
    const p = { ...base(), studySolved: 12, badges: { b_study_10: 1 } };
    const g = nearestBadgeGoal(p, 'b_study');
    expect(g?.id).not.toBe('b_study_10');
  });
});

describe('積み上げ（lifetimeTotals）', () => {
  it('progress の数字をそのまま集計する', () => {
    const p = { ...base(), loginDays: 21, studySolved: 57, holesFilled: 23, matches: 3, wins: 1, correct: 9, rushBest: 2400, badges: { a: 1, b: 2 }, owned: ['x', 'y', 'z'] };
    expect(lifetimeTotals(p)).toEqual({ loginDays: 21, studySolved: 57, holesFilled: 23, matches: 3, wins: 1, correct: 9, rushBest: 2400, badges: 2, badgeTotal: BADGES.length, items: 3 });
  });
});

describe('節目のひとこと', () => {
  it('7・30・100日目は特別なセリフ', () => {
    for (const d of [7, 30, 100]) {
      const m = tobiraMood({ screen: 'home', loginDays: d, streak: 1, solved: 3 });
      expect(m.mood).toBe('milestone');
      expect(m.line).toBe(LOGIN_MILESTONES[d]);
    }
  });
  it('節目でない日・はじめての日は通常どおり', () => {
    expect(tobiraMood({ screen: 'home', loginDays: 8, streak: 1, solved: 3 }).mood).not.toBe('milestone');
    expect(tobiraMood({ screen: 'home', loginDays: 7, firstVisit: true }).mood).toBe('first');
  });
});

import { STAGE_CLEAR_PERFECTS, isStageCleared, readStageHistory, readStageRecords, recordStagePlay, stageSummary } from '../src/utils/stageRecords';
import { parsePublicStudyProfile } from '../src/utils/publicStudyProfile';

describe('ステージ：満点3回で達成', () => {
  it('満点だけ数え、3回で達成・履歴は新しい順', () => {
    const mem = new Map<string, string>();
    (globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k), clear: () => mem.clear(), key: () => null, length: 0 };
    recordStagePlay('u', 'ch1', '第1章', 9, 10, 1);
    for (let i = 0; i < STAGE_CLEAR_PERFECTS - 1; i++) recordStagePlay('u', 'ch1', '第1章', 10, 10, 2 + i);
    expect(isStageCleared(readStageRecords('u').ch1)).toBe(false);
    recordStagePlay('u', 'ch1', '第1章', 10, 10, 9);
    const r = readStageRecords('u').ch1;
    expect(r.p).toBe(STAGE_CLEAR_PERFECTS); expect(r.n).toBe(STAGE_CLEAR_PERFECTS + 1); expect(isStageCleared(r)).toBe(true);
    expect(readStageHistory('u')[0].t).toBe(9);
    expect(stageSummary('u')).toMatchObject({ cleared: 1, perfects: 3, plays: 4 });
  });
});

describe('公開プロフィール（志・達成ステージ）', () => {
  it('古い文書でも読める／新しい項目を読む', () => {
    expect(parsePublicStudyProfile({ public: true, targetSchool: 'A大', studySeconds: 10 })).toMatchObject({ motto: '', stagesCleared: null, level: null });
    expect(parsePublicStudyProfile({ public: true, targetSchool: 'A大', studySeconds: 10, motto: '医者になる', stagesCleared: 4, level: 12 })).toMatchObject({ motto: '医者になる', stagesCleared: 4, level: 12 });
  });
});

import { readFileSync } from 'node:fs';
describe('対戦結果（2026-10-04）', () => {
  const src = readFileSync('src/battle/ui/BattleResult.tsx', 'utf8');
  it('勝敗の画面と詳しい結果（復習）は別ページ。ミッション・プロフィールは結果に戻れる', () => {
    expect(src).toContain('詳しい結果を確認する');
    expect(src).toContain("if (page === 'missions') return <BattleMissions onBack={() => setPage('detail')} />");
    expect(src).toContain("onOpenMissions={onOpenMissions ? () => setPage('missions') : undefined}");
    // 勝敗の画面のボタンは「詳しい結果を確認する」だけ。詳しい結果には「部屋に戻る」「ホームに戻る」だけ
    expect(src).toContain('data-result-open-detail');
    expect(src).toContain('data-result-back-room');
    expect(src).toContain('data-result-home');
    expect(src).not.toContain('<ReviewPicks');
  });
  it('詳しい解説はその1問だけ（大問の問1〜問5一覧を混ぜない）', async () => {
    const { subQuestionExplanation } = await import('../src/battle/ui/BattleReviewDetails');
    const text = subQuestionExplanation({ detailedExplanation: { theme: 'put off＝延期する', steps: ['① A', '② B'] } });
    expect(text).toContain('put off'); expect(text).not.toContain('問2');
  });
});
