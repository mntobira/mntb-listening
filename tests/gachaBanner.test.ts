import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gachaItems } from '../src/battle/core/arenaEconomy';
import { gachaRarityOf } from '../src/battle/core/growth';
import { weekEndLabel, weeklyHero, weeklyPickup } from '../src/components/gacha/GachaItemDetail';

describe('ガチャのバナー（2026-10-28 A10・モンスト風）', () => {
  const items = gachaItems();
  it('今週のピックアップは LR 2つ＋UR 3つ。目玉とは重ならない', () => {
    const p = weeklyPickup(items, 42, 'print_book_listening_all');
    expect(p.map((i) => gachaRarityOf(i))).toEqual(['LR', 'LR', 'UR', 'UR', 'UR']);
    expect(p.some((i) => i.id === 'print_book_listening_all')).toBe(false);
  });
  it('週が変わると入れ替わる（いつも同じ UR にならない）', () => {
    const ids = new Set(Array.from({ length: 6 }, (_, w) => weeklyPickup(items, 40 + w).map((i) => i.id).join(',')));
    expect(ids.size).toBeGreaterThan(1);
  });
  it('目玉は週ごとに LR と UR が交互（いつも UR にならない）', () => {
    const ur = items.find((i) => gachaRarityOf(i) === 'UR')!;
    expect(gachaRarityOf(weeklyHero(items, 42, ur)!)).toBe('LR');
    expect(weeklyHero(items, 43, ur)).toBe(ur);
    expect(weeklyHero(items, 42, ur)!.id).not.toBe(weeklyHero(items, 44, ur)!.id);
  });
  it('期限の表示は日曜', () => {
    expect(weekEndLabel(0)).toBe('1/11（日）まで');
  });
  it('セット・かけらはガチャ画面から外し、ショップの「種類」に入れた', () => {
    const room = readFileSync('src/components/GachaRoom.tsx', 'utf8');
    const shop = readFileSync('src/components/MyCollection.tsx', 'utf8');
    expect(room).not.toContain('data-gacha-sets-open');
    expect(shop).toContain("['sets','セット収集']");
    expect(shop).toContain('<GachaSetsPanel');
  });
  it('iPhone・Androidとも同じ圧縮レイアウトで抽選ボタンまで一画面に収める', () => {
    const css = readFileSync('src/components/gacha.css', 'utf8');
    expect(css).toContain('@media (max-width: 699px)');
    expect(css).toContain('すべてのスマホで同じ密度にする');
    expect(css).toContain('.gacha-banner-buddy { display: none; }');
    expect(css).toContain('@media (max-width: 699px) and (max-height: 640px)');
    expect(css).toContain('.gacha-banner-links { display: none; }');
  });
});
