/**
 * リスニング「読み方・解き方のテクニック」（2026-10-31 E11）
 *   ・全大問にテクニックがある（どこを見る／先読み／できる人／悩み）
 *   ・回の一覧のいちばん上（第1回より前）に出る配線
 *   ・文字 12px 以上・押せる高さ 44px 以上
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { getAllListeningChapters } from '../src/data/englishListeningData';
import { LISTENING_COMMON_TIPS, techniqueOf } from '../src/data/listeningTechniques';

describe('テクニックのデータ', () => {
  it('問題のある全大問に、4つの観点がそろっている', () => {
    const miss: string[] = [];
    for (const c of getAllListeningChapters()) {
      if (!(c.practiceProblems || []).length) continue;
      const t = techniqueOf(c.id);
      if (!t || !t.look.length || !t.preview.length || !t.pros.length || !t.worries.length) miss.push(c.id);
    }
    expect(miss).toEqual([]);
    expect(LISTENING_COMMON_TIPS.length).toBeGreaterThan(0);
  });
});

describe('画面の配線', () => {
  it('ChapterSelection で、回の一覧より前にテクニックを出す', () => {
    const src = readFileSync('src/components/ChapterSelection.tsx', 'utf8');
    const card = src.indexOf('<ListeningTechniqueCard');
    expect(card).toBeGreaterThan(0);
    expect(card).toBeLessThan(src.indexOf('rounds.map((round)'));
  });
  it('文字 12px 以上・見出しの高さ 44px 以上', () => {
    const css = readFileSync('src/components/unit-select.css', 'utf8');
    const block = css.slice(css.indexOf('.lt-card {'));
    for (const m of block.matchAll(/font-size:\s*(\d+)px/g)) expect(Number(m[1])).toBeGreaterThanOrEqual(12);
    expect(block).toMatch(/\.lt-card > summary \{[^}]*min-height: 44px/);
  });
});
