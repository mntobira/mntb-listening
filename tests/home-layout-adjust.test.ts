import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const home = readFileSync('src/components/Home.tsx', 'utf8');
const hub = readFileSync('src/components/StudyHub.tsx', 'utf8');
const css = readFileSync('src/index.css', 'utf8');

describe('ホームの導線（2026-10-20）', () => {
  it('きせかえ・称号・学習記録のホームボタンを置かない', () => {
    expect(home).not.toContain('className="stage-outfit"');
    expect(home).not.toContain('className="stage-badges"');
    expect(home).not.toContain('data-home-record');
    expect(home).not.toContain('学習記録を見る');
  });

  it('3段目は使い方・ミッション・学びの扉で、ミッションを中央に長くする', () => {
    expect(home).toContain('className="game-home-utility arena-home-bottom has-three"');
    expect(home.indexOf('aria-label="アプリ紹介を開く"')).toBeLessThan(home.indexOf('>ミッション</button>'));
    expect(home.indexOf('>ミッション</button>')).toBeLessThan(home.indexOf('data-open-philosophy'));
    expect(css).toContain('.game-home .game-home-utility.has-three { grid-template-columns: 1fr 1.8fr 1fr;');
  });

  it('学習記録は復習ノートと同じStudyHub内の記録タブで表示する', () => {
    expect(hub).toContain("data-rn-record");
    expect(hub).toContain("{section === 'record' && <ScrollArea key=\"record\"><StudyRecord embedded onRetry={onRetry} /></ScrollArea>}");
  });
});
