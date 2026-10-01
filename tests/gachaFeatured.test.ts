import { describe, expect, it } from 'vitest';
import { gachaFeatured, featuredWeek } from '../src/battle/core/gachaFeatured';
import { gachaItemsByRarity, gachaItemRate } from '../src/battle/core/arenaEconomy';
import { printOf } from '../src/battle/core/growth';
import { readFileSync } from 'node:fs';

describe('ガチャ「今回の注目アイテム」（C6・C8・C23）', () => {
  const tiers = gachaItemsByRarity();
  it('目玉はURの中から、その他は SR → R の順で、すべて実際のガチャデータに含まれる', () => {
    const f = gachaFeatured({ now: new Date(2026, 9, 1) });
    expect(f.hero && tiers.UR.includes(f.hero.item)).toBe(true);
    const order = f.others.map(e => e.rarity);
    expect(order).toEqual([...order].sort((a, b) => ['UR', 'SR', 'R', 'N'].indexOf(a) - ['UR', 'SR', 'R', 'N'].indexOf(b)));
    for (const e of f.others) expect(tiers[e.rarity].includes(e.item)).toBe(true);
  });
  it('表示する割合は本物の抽選表（gachaItemRate）と同じ', () => {
    const f = gachaFeatured();
    for (const e of [f.hero!, ...f.others]) expect(e.rate).toBe(gachaItemRate(e.item));
    expect(f.counts.UR).toBe(tiers.UR.length);
  });
  it('同じ週なら同じ、週が変わると入れ替わる', () => {
    const a = gachaFeatured({ now: new Date(2026, 9, 5) }), b = gachaFeatured({ now: new Date(2026, 9, 9) });
    expect(featuredWeek(new Date(2026, 9, 5))).toBe(featuredWeek(new Date(2026, 9, 9)));
    expect(a.hero!.item.id).toBe(b.hero!.item.id);
    const weeks = new Set(Array.from({ length: 6 }, (_, i) => gachaFeatured({ now: new Date(2026, 9, 5 + i * 7) }).hero!.item.id));
    expect(weeks.size).toBeGreaterThan(1);
  });
  it('preferSubjects の科目の学習プリントを目玉に優先する', () => {
    const f = gachaFeatured({ preferSubjects: ['english_vocab', 'english_grammar'] });
    expect(['english_vocab', 'english_grammar']).toContain(printOf(f.hero!.item.id)!.subject);
  });
  it('画面にアイテム名を直接書いていない（データ連動）', () => {
    const src = readFileSync('src/components/GachaRoom.tsx', 'utf8');
    for (const item of [...tiers.UR, ...tiers.SR].slice(0, 30)) expect(src.includes(`'${item.label}'`) || src.includes(`"${item.label}"`)).toBe(false);
  });
});
