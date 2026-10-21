import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync('src/components/home-pillars.css', 'utf8');
const home = readFileSync('src/components/Home.tsx', 'utf8');

describe('ホームの演習・対戦ボタン配置', () => {
  it('アイコンと大見出しを横並びにし、小見出しは下段に残す', () => {
    expect(css).toContain('grid-template-columns: auto auto');
    expect(css).toContain('grid-column: 1 / -1; grid-row: 2');
    expect(home).toContain('<small>ひとりで学ぶ</small>');
    expect(home).toContain('<small>ひとりで・みんなで</small>');
  });

  it('ホームからランキングとショップのショートカットを置かない', () => {
    expect(home).not.toContain('stage-gacha');
    expect(home).not.toContain('stage-shop');
    expect(home).not.toContain('ランキングを見る');
  });
});
