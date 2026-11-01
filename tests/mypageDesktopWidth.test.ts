import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('desktop mypage width', () => {
  it('lets the overview use the desktop width and makes its study card span the grid', () => {
    const css = readFileSync('src/components/growth-hub.css', 'utf8');
    const desktop = css.split('@media (min-width: 1024px)').slice(1).join('@media (min-width: 1024px)');

    expect(desktop).toContain('.mypage-tabs { max-width: none; width: 100%');
    expect(desktop).toContain('.mypage-body { max-width: none; width: 100%');
    expect(desktop).toContain('.mypage-overview[data-mypage-overview] > [data-my-study] { grid-column: 1 / -1; width: 100%');
  });
});
