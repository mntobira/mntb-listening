/** 対戦：リスニングの「絵を選ぶ」問題と、音源・絵の先読み */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { preloadTargets } from '../src/battle/core/preload';
import { PICTURE_GRID_SPLITS } from '../src/battle/data/pictureGrid.generated';
import { LISTENING_PICTURE_ASPECT } from '../src/data/listeningPictureAspect';

describe('対戦の絵と先読み', () => {
  it('対戦画面は問題の絵（imageUrl）を描き、読み込み失敗時は読み直せる', () => {
    const src = readFileSync('src/battle/ui/BattleQuestionView.tsx', 'utf8');
    // 2×2 に分けられない絵（地図・部屋など）は従来どおり1枚で描く
    expect(src).toMatch(/question\.imageUrl && !pictureGrid && \(\s*<BattleFigure/);
    // A11: 2×2 の絵は絵そのものを押して答える
    expect(src).toContain('<PictureGridAnswer');
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
  it('F4の7枚は既存画像パスのまま正方形4分割で使う', () => {
    const replacementPaths = [
      '/listening_q1b/el1B_set1_q2.jpg',
      '/listening_q1b/el1B_set9_q3.jpg',
      '/listening_q1b/el1B_set12_q3.jpg',
      '/listening_q1b/el1B_set14_q2.jpg',
      '/listening_q1b/el1B_set15_q4.jpg',
      '/listening_q2/el2_set1_q3.jpg',
      '/listening_q2/el2_set12_q3.jpg',
    ];
    for (const imagePath of replacementPaths) {
      expect(existsSync(`public${imagePath}`), imagePath).toBe(true);
      expect(PICTURE_GRID_SPLITS[imagePath], imagePath).toEqual([0.5, 0.5]);
      expect(LISTENING_PICTURE_ASPECT[imagePath] ?? 1, imagePath).toBe(1);
    }
  });
  it('オンライン対戦・AI対戦の両方で先読みしている', () => {
    for (const f of ['useBattleRoom', 'useAiBattle']) {
      expect(readFileSync(`src/battle/hooks/${f}.ts`, 'utf8')).toMatch(/warmAssets\(preloadTargets\(questions, currentIndex, 2\)\)/);
    }
  });
});
