import { describe, expect, it } from 'vitest';
import {
  GHOST_AFTER_SEC,
  QUEUE_STALE_MS,
  QUOTA_COOLDOWN_MS,
  fallbackDecision,
  isStaleQueueTicket,
  quotaBlockedUntil,
} from '../src/battle/core/matchFallback';
import { ghostProfileFor, decideAiMove, GHOST_RATING_SPREAD, GHOST_ARCHETYPE_IDS } from '../src/battle/core/aiOpponent';

const base = { elapsedSec: 0, failures: 0, lastErrorCode: null, online: true, quotaBlocked: false };

describe('全国対戦：相手がいない／サーバーが使えないときは AI プレイヤー', () => {
  it('人を待つのは GHOST_AFTER_SEC 秒まで', () => {
    expect(fallbackDecision({ ...base, elapsedSec: GHOST_AFTER_SEC - 1 })).toBeNull();
    expect(fallbackDecision({ ...base, elapsedSec: GHOST_AFTER_SEC })).toBe('empty');
  });
  it('無料枠の上限・失敗の連続・圏外は待たずに切り替える', () => {
    expect(fallbackDecision({ ...base, lastErrorCode: 'resource-exhausted' })).toBe('server');
    expect(fallbackDecision({ ...base, quotaBlocked: true })).toBe('server');
    expect(fallbackDecision({ ...base, failures: 3 })).toBe('server');
    expect(fallbackDecision({ ...base, failures: 2 })).toBeNull();
    expect(fallbackDecision({ ...base, online: false })).toBe('offline');
  });
  it('全国対戦で組まれた相手の名前・紹介文に「AI」と出さない', () => {
    for (let i = 0; i < 40; i++) {
      const p = ghostProfileFor(1500, `seed-${i}`);
      expect(p.name).not.toMatch(/AI/);
      expect(p.tagline).not.toMatch(/AI/);
    }
  });
  it('マッチング画面・試合画面のソースに AI だと分かる表示が残っていない', async () => {
    const { readFileSync } = await import('node:fs');
    const matching = readFileSync('src/battle/ui/BattleMatching.tsx', 'utf8');
    expect(matching).not.toContain('AIプレイヤーが相手です');
    expect(matching).not.toMatch(/label: 'AIプレイヤー/);
    expect(matching).not.toMatch(/detail: `[^`]*AIプレイヤー/);
    const room = readFileSync('src/battle/ui/BattleAiRoomScreen.tsx', 'utf8');
    expect(room).not.toContain('（AI）');
    expect(room).not.toContain('data-ghost-badge');
    expect(room).toContain('2人がそろいました。まもなくスタート');
  });
  it('古い待機票は相手にしない（作成時刻が未確定の票は新しい扱い）', () => {
    const now = 1_000_000_000;
    expect(isStaleQueueTicket(now - QUEUE_STALE_MS - 1, now)).toBe(true);
    expect(isStaleQueueTicket(now - 5_000, now)).toBe(false);
    expect(isStaleQueueTicket(null, now)).toBe(false);
  });
  it('無料枠の上限は15分だけ覚える（おかしな値は捨てる）', () => {
    const now = 5_000_000;
    expect(quotaBlockedUntil(String(now + 60_000), now)).toBe(now + 60_000);
    expect(quotaBlockedUntil(String(now - 1), now)).toBeNull();
    expect(quotaBlockedUntil(String(now + QUOTA_COOLDOWN_MS * 3), now)).toBeNull();
    expect(quotaBlockedUntil(null, now)).toBeNull();
  });
});

describe('AI プレイヤーの強さ・名前', () => {
  it('同じ種なら同じ相手（試合中に名前や強さが変わらない）', () => {
    expect(ghostProfileFor(1500, 'x')).toEqual(ghostProfileFor(1500, 'x'));
  });
  it('レートは自分の ±480 以内・近い相手を中心に出しつつ格上〜格下・8タイプの個性が出る', () => {
    const names = new Set<string>();
    const archetypes = new Set<string>();
    const diffs: number[] = [];
    for (let i = 0; i < 400; i += 1) {
      const p = ghostProfileFor(1600, `s${i}`);
      const d = Math.abs(p.displayRating - 1600);
      expect(d).toBeLessThanOrEqual(GHOST_RATING_SPREAD);
      expect(p.speedRange[0]).toBeLessThanOrEqual(p.speedRange[1]);
      expect(p.human).toBeTruthy();
      if (p.human?.archetype) archetypes.add(p.human.archetype);
      diffs.push(d);
      names.add(p.name);
    }
    expect(names.size).toBeGreaterThan(40);
    expect(archetypes.size).toBe(GHOST_ARCHETYPE_IDS.length);
    expect(diffs.filter(d => d > 200).length).toBeGreaterThan(30);         // 格上・格下もしっかり混ざる
    expect(diffs.filter(d => d > 320).length).toBeGreaterThan(10);         // 大幅な格上・格下もたまに出る
    expect(diffs.filter(d => d <= 150).length).toBeGreaterThan(diffs.length / 3); // 近い相手が中心
  });
  it('レートが高い相手ほど平均正解率が高く、全体では 0.22〜0.98 の幅広い強さになる', () => {
    const avg = (r: number) => Array.from({ length: 120 }, (_, i) => ghostProfileFor(r, `a${i}`).accuracy).reduce((a, b) => a + b) / 120;
    expect(avg(1100)).toBeLessThan(avg(1500));
    expect(avg(1500)).toBeLessThan(avg(2000));
    const lowMin = Math.min(...Array.from({ length: 120 }, (_, i) => ghostProfileFor(900, `l${i}`).accuracy));
    const highMax = Math.max(...Array.from({ length: 120 }, (_, i) => ghostProfileFor(2600, `h${i}`).accuracy));
    expect(lowMin).toBeGreaterThanOrEqual(0.22);
    expect(lowMin).toBeLessThan(0.35);
    expect(highMax).toBeLessThanOrEqual(0.98);
    expect(highMax).toBeGreaterThan(0.9);
  });
  it('同じ中堅レート帯でも、早押し型と熟考型で解答スピード・正答率に明確な差が出る', () => {
    const profiles = Array.from({ length: 300 }, (_, i) => ghostProfileFor(1500, `style-${i}`));
    const rush = profiles.filter(p => p.human?.archetype === 'rush');
    const careful = profiles.filter(p => p.human?.archetype === 'careful');
    expect(rush.length).toBeGreaterThan(5);
    expect(careful.length).toBeGreaterThan(5);
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(mean(rush.map(p => p.speedRange[0]))).toBeLessThan(mean(careful.map(p => p.speedRange[0])));
    expect(mean(rush.map(p => p.accuracy))).toBeLessThan(mean(careful.map(p => p.accuracy)));
  });
  it('人間らしい間：同じ相手でも問題ごとに答える時間がばらつく', () => {
    const p = ghostProfileFor(1500, 'human');
    const q = { id: 'q1', format: 'choice', prompt: 'apple の意味は？', options: ['りんご', 'みかん', 'ぶどう', 'もも'], answerIndex: 0, panelOrder: [] } as never;
    const ms = Array.from({ length: 30 }, (_, i) => decideAiMove(p, q, 20, 'seed', i).delayMs);
    expect(Math.max(...ms) - Math.min(...ms)).toBeGreaterThan(3000);
  });
  it('AI プレイヤーの解答は制限時間内', () => {
    const p = ghostProfileFor(1500, 'q');
    const q = { id: 'q1', format: 'choice', prompt: 'apple の意味は？', options: ['りんご', 'みかん', 'ぶどう', 'もも'], answerIndex: 0, panelOrder: [] } as never;
    for (let i = 0; i < 20; i += 1) {
      const m = decideAiMove(p, q, 10, 'seed', i);
      expect(m.delayMs).toBeLessThanOrEqual(10_000 * 0.92 + 1);
      expect(m.delayMs).toBeGreaterThan(0);
    }
  });
});
