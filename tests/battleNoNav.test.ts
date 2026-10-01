import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('対戦中の画面（2026-10-01）', () => {
  const app = readFileSync('src/App.tsx', 'utf8');
  it('試合中は下ナビを出さず、ナビの高さを0として扱う', () => {
    expect(app).toMatch(/!\(appState === 'battle' && battleActive\)/);
    expect(app).toMatch(/data-battle-live=/);
    expect(readFileSync('src/styles/world.css', 'utf8')).toMatch(/\.app-shell\[data-battle-live\] \{ --app-nav-h: 0px/);
  });
  it('「相手は回答ずみ！」は 1/10もん と 4つからえらぶ の間（別の行を使わない）', () => {
    expect(readFileSync('src/battle/ui/BattleLiveStage.tsx', 'utf8')).toMatch(/notice=\{!counting && p\.opponentAnswered/);
    expect(readFileSync('src/battle/ui/BattleQuestionView.tsx', 'utf8')).toMatch(/bq-progress-notice/);
  });
  it('絵の4択は残りの高さを2行で分けて収める', () => {
    expect(readFileSync('src/battle/ui/battle-question.css', 'utf8')).toMatch(/grid-template-rows: 1fr 1fr/);
  });
});
