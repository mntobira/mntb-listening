import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { splitKinetic } from '../src/motion/KineticText';

/**
 * モーション層（2026-10-16）の決まりを固定する。
 *   ・1文字ずつに分けても、元の文字列と完全に同じ（文言を変えない）
 *   ・句読点・閉じかっこは前の字に、開きかっこは次の字に付く（行頭禁則が崩れない）
 *   ・英数字の語は分けない（語の途中で改行しない）
 *   ・動きは prefers-reduced-motion: no-preference の中だけ（動きを減らす設定では今までの画面のまま）
 */
describe('splitKinetic', () => {
  const samples = ['聞く力と、その土台。', '復習ノート', 'ゲストさんのホーム', '「ひたすら実践」（本番）', 'Lv.12 とびら君', 'ここからが伸びしろ！詳しい結果で1問ずつ確かめよう'];
  it('つなげると元の文字列に戻る', () => {
    for (const s of samples) expect(splitKinetic(s).join('')).toBe(s);
  });
  it('句読点・閉じかっこで始まる塊がない／開きかっこで終わる塊がない', () => {
    for (const s of samples) for (const t of splitKinetic(s)) {
      expect(t).not.toMatch(/^[、。！？」）]/);
      expect(t).not.toMatch(/[「（]$/);
    }
  });
  it('英数字の語はひとかたまり', () => {
    expect(splitKinetic('Lv.12 とびら君')).toContain('12');
    expect(splitKinetic('第1問 Listening')).toContain('Listening');
  });
});

describe('motion.css', () => {
  const css = readFileSync('src/motion/motion.css', 'utf8');
  it('animation は動きを許す設定の中だけ（ブロックの外に animation: を書かない）', () => {
    const start = css.indexOf('@media (prefers-reduced-motion: no-preference)');
    expect(start).toBeGreaterThan(0);
    const outside = css.slice(0, start).replace(/\/\*[\s\S]*?\*\//g, '');
    expect(outside).not.toMatch(/animation\s*:/);
  });
  it('画面全体の入場は opacity だけ（fixed のバーを動かさない）', () => {
    const rule = css.match(/\.app-screen-stack > :not\(audio\) \{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toContain('mo-fade');
    expect(css.match(/@keyframes mo-fade \{([^\n]*)\n/)?.[1]).not.toMatch(/translate|scale|filter/);
  });
  it('入場の fill-mode は backwards（終わったら各画面の :active・ホバーに戻す）', () => {
    expect(css).not.toMatch(/animation[^;]*\sboth[;,\s]/);
  });
});
