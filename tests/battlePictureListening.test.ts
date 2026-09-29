/** 対戦：リスニングの「絵を選ぶ」問題と、音源・絵の先読み */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { preloadTargets } from '../src/battle/core/preload';

describe('対戦の絵と先読み', () => {
  it('対戦画面は問題の絵（imageUrl）を描き、読み込み失敗時は読み直せる', () => {
    const src = readFileSync('src/battle/ui/BattleQuestionView.tsx', 'utf8');
    expect(src).toMatch(/question\.imageUrl && \(\s*<BattleFigure/);
    expect(src).toContain('タップしてもう一度読み込む');
    expect(src).toContain("'絵を大きく表示する'");
  });
  it('先読みは「いまの問題＋次の問題」の音源と絵（重複なし）', () => {
    const qs = [
      { audioUrl: '/a0.mp3', imageUrl: '/p0.jpg' },
      { audioUrl: '/a1.mp3', imageUrl: '/p1.jpg' },
      { audioUrl: '/a2.mp3' },
    ];
    expect(preloadTargets(qs, 0)).toEqual(['/a0.mp3', '/p0.jpg', '/a1.mp3', '/p1.jpg']);
    expect(preloadTargets(qs, 2)).toEqual(['/a2.mp3']);
    expect(preloadTargets([{ imageUrl: '/x.jpg' }, { imageUrl: '/x.jpg' }], 0)).toEqual(['/x.jpg']);
  });
  it('オンライン対戦・AI対戦の両方で先読みしている', () => {
    for (const f of ['useBattleRoom', 'useAiBattle']) {
      expect(readFileSync(`src/battle/hooks/${f}.ts`, 'utf8')).toMatch(/warmAssets\(preloadTargets\(questions, currentIndex, 2\)\)/);
    }
  });
});
