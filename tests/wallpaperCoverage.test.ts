import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('壁紙はすべての全面画面に出る（大学ノートが出ない不具合）', () => {
  const css = readFileSync('src/index.css', 'utf8');
  it('全面の画面すべてに壁紙を敷く', () => {
    const rule = css.split('\n').find((l) => l.startsWith('html[data-wallpaper] :is('))!;
    for (const sel of ['.game-home', '.sc-page', '.mtb-page', '.mana-hub', '.review-note', '#battle-shell']) expect(rule).toContain(sel);
  });
  it('淡い柄が消えないよう、ベールは半分より薄い（明るい壁紙）', () => {
    const m = css.match(/html\[data-wallpaper\] \{ --wp-veil: #fffdf8([0-9a-f]{2}); \}/);
    expect(m).not.toBeNull();
    expect(parseInt(m![1], 16) / 255).toBeLessThan(0.5);
  });
  it('古い「70%ベール」の個別指定が残っていない', () => {
    expect(css).not.toContain('#fffdf8b3');
    expect(readFileSync('src/components/growth-hub.css', 'utf8')).not.toContain('data-wallpaper');
  });
});
