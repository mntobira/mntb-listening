import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { NIJI_DISCLAIMER, NIJI_MOCK_PRINTS, NIJI_UNIVERSITIES, nijiDisclaimerFor, nijiUniversityOf } from '../src/data/nijiMockPrints';
import { KYOTSU_MOCK_PRINTS } from '../src/data/kyotsuMockPrints';
import {
  GACHA_RARITY_ORDER, GACHA_RARITY_RATES, gachaItemRate, gachaItems, gachaItemsByRarity, pickGachaItem, rollGacha, exchangeShards,
} from '../src/battle/core/arenaEconomy';
import { GACHA_POOLS, NIJI_NEW_ITEM_IDS, NIJI_SHARED_IDS, inGachaPool } from '../src/battle/core/gachaPools';
import { GACHA_SETS } from '../src/battle/core/gachaSets';
import { ITEMS, emptyProgress, gachaRarityOf, printOf } from '../src/battle/core/growth';
import { parseAccessory, wallpaperOf } from '../src/battle/core/tobiraParts';

/** ★2026-10-29 2次試験ガチャ（共通テストガチャと左右スワイプで切り替え）★ */
const hasPdf = (() => { try { execFileSync('pdftotext', ['-v'], { stdio: 'ignore' }); return true; } catch { return false; } })();

describe('2次試験ガチャ：景品', () => {
  it('ガチャは2種類（共通テスト→2次試験の順）', () => {
    expect(GACHA_POOLS.map((p) => p.id)).toEqual(['kyotsu', 'niji']);
  });
  it('LR は2次試験の予想問題だけ。共通テストの予想問題は出ない（その逆も）', () => {
    const niji = gachaItemsByRarity('niji');
    const kyotsu = gachaItemsByRarity('kyotsu');
    expect(niji.LR.map((i) => i.id).sort()).toEqual(NIJI_MOCK_PRINTS.map((p) => p.id).sort());
    expect(kyotsu.LR.map((i) => i.id).sort()).toEqual(KYOTSU_MOCK_PRINTS.map((p) => p.id).sort());
    for (const p of NIJI_MOCK_PRINTS) expect(inGachaPool(p.id, 'kyotsu'), p.id).toBe(false);
  });
  it('どのレア度にも景品がある（2次試験ガチャでも LR〜N が空でない）', () => {
    const t = gachaItemsByRarity('niji');
    for (const r of GACHA_RARITY_ORDER) expect(t[r].length, r).toBeGreaterThan(0);
  });
  it('新しく作った装飾は2次試験ガチャ専用で、見た目の定義がある', () => {
    for (const id of NIJI_NEW_ITEM_IDS) {
      const item = ITEMS.find((i) => i.id === id);
      expect(item, id).toBeTruthy();
      expect(item!.gacha, id).toBe(true);
      expect(inGachaPool(id, 'niji'), id).toBe(true);
      expect(inGachaPool(id, 'kyotsu'), id).toBe(false);
      if (['hat', 'glasses', 'cheek', 'aura'].includes(item!.kind)) expect(parseAccessory(item!.kind as 'hat', item!.value), id).not.toBeNull();
      if (item!.kind === 'wallpaper') expect(wallpaperOf(item!.value), id).not.toBeNull();
    }
  });
  it('使い回しの景品は実在し、共通テストガチャからも引き続き出る（大当たり＝LR は使い回さない）', () => {
    const kyotsu = new Set(gachaItems('kyotsu').map((i) => i.id));
    for (const id of NIJI_SHARED_IDS) {
      const item = ITEMS.find((i) => i.id === id);
      expect(item, id).toBeTruthy();
      expect(kyotsu.has(id), id).toBe(true);
      expect(gachaRarityOf(item!), id).not.toBe('LR');
    }
  });
  it('セット収集の部品は共通テストガチャで今までどおりそろう', () => {
    const kyotsu = new Set(gachaItems('kyotsu').map((i) => i.id));
    for (const s of GACHA_SETS) for (const id of s.items) expect(kyotsu.has(id), `${s.id}:${id}`).toBe(true);
  });
});

describe('2次試験ガチャ：抽選', () => {
  it('割合は共通テストガチャと同じ（LR 1%・合計 1）。1種あたりはそのガチャの中で計算する', () => {
    expect(Object.values(GACHA_RARITY_RATES).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    const t = gachaItemsByRarity('niji');
    expect(gachaItemRate(t.LR[0], 'N', 'niji')).toBeCloseTo(0.01 / t.LR.length, 10);
    expect(gachaItemRate(t.LR[0], 'N', 'kyotsu')).toBe(0); // 共通テストガチャでは出ない
  });
  it('乱数の先頭 1% で2次試験の予想問題が出る。どの乱数でも2次試験ガチャの中身しか出ない', () => {
    expect(NIJI_MOCK_PRINTS.map((p) => p.id)).toContain(pickGachaItem(0, 'N', 'niji')!.item.id);
    expect(pickGachaItem(0.0101, 'N', 'niji')!.rarity).toBe('UR');
    for (let i = 0; i < 2000; i += 1) {
      const r = (i + 0.5) / 2000;
      expect(inGachaPool(pickGachaItem(r, 'N', 'niji')!.item.id, 'niji'), String(r)).toBe(true);
      expect(inGachaPool(pickGachaItem(r, 'N', 'kyotsu')!.item.id, 'kyotsu'), String(r)).toBe(true);
    }
  });
  it('指定しないと今までどおり共通テストガチャ（既存の呼び出しは変わらない）', () => {
    expect(KYOTSU_MOCK_PRINTS.map((p) => p.id)).toContain(pickGachaItem(0)!.item.id);
    const p = { ...emptyProgress('u'), coins: 100 };
    const r = rollGacha(p, 0)!;
    expect(gachaRarityOf(r.item)).toBe('LR');
    expect(inGachaPool(r.item.id, 'kyotsu')).toBe(true);
  });
  it('2次試験ガチャで引いても、コイン・ダブり返還・かけらは同じ仕組み', () => {
    const p = { ...emptyProgress('u'), coins: 300 };
    const first = rollGacha(p, 0.5, 'N', { pool: 'niji' })!;
    expect(first.next.coins).toBe(200);
    const again = rollGacha(first.next, 0.5, 'N', { pool: 'niji' })!;
    expect(again.duplicate).toBe(true);
    expect(again.shards).toBeGreaterThan(0);
  });
  it('2次試験の予想問題はかけらと交換できない。新しい装飾は交換できる', () => {
    const p = { ...emptyProgress('u'), shards: 9999 };
    expect(exchangeShards(p, NIJI_MOCK_PRINTS[0].id).ok).toBe(false);
    expect(exchangeShards(p, 'hat_hachimaki_red').ok).toBe(true);
  });
});

describe('2次試験の予想問題 PDF', () => {
  it('台帳のページ数・ファイル・サムネイルが実物と合う', () => {
    expect(NIJI_MOCK_PRINTS.length).toBe(21); // 名古屋 3・静岡 3・大阪公立 A 3・B 3・和歌山 3・岡山 3・広島 3
    for (const u of NIJI_UNIVERSITIES) expect(NIJI_MOCK_PRINTS.filter((p) => nijiUniversityOf(p.id)?.id === u.id).length, u.id).toBe(3);
    for (const p of NIJI_MOCK_PRINTS) {
      expect(existsSync(`public${p.file}`), p.id).toBe(true);
      expect(existsSync(`public${p.thumb}`), p.id).toBe(true);
      expect(Math.abs(statSync(`public${p.file}`).size / 1024 - p.kb), p.id).toBeLessThan(2);
      expect(printOf(p.id)?.file).toBe(p.file);
    }
  });
  it.skipIf(!hasPdf)('ページ数が合い、表紙と奥付に「過去問ではない・大学とは関係がない」がある', () => {
    for (const p of NIJI_MOCK_PRINTS) {
      const info = execFileSync('pdfinfo', [`public${p.file}`], { encoding: 'utf8' });
      expect(Number(info.match(/Pages:\s+(\d+)/)![1]), p.id).toBe(p.pages);
      const t = execFileSync('pdftotext', [`public${p.file}`, '-'], { encoding: 'utf8', maxBuffer: 64 << 20 }).replace(/\s+/g, '');
      expect((t.match(/過去問・公式問題ではありません/g) || []).length, p.id).toBeGreaterThanOrEqual(4); // 問題編・解答編の表紙と奥付
      expect(t, p.id).toContain('大学とは関係がありません');
      // その大学の名前入りの注意書き（ほかの大学の名前と取り違えていない）
      const u = nijiUniversityOf(p.id)!;
      expect(t, p.id).toContain(nijiDisclaimerFor(u.name).replace(/\s+/g, ''));
      expect(t, p.id).not.toMatch(/的中|必ず出る|合格できる/);
    }
  });
  it('ガチャの詳細・ピックアップに注意書きを出す', () => {
    expect(NIJI_DISCLAIMER).toContain('過去問・公式問題ではありません');
    expect(readFileSync('src/components/gacha/GachaItemDetail.tsx', 'utf8')).toContain('nijiDisclaimerFor(nijiUniv.name)');
    for (const u of NIJI_UNIVERSITIES) expect(NIJI_DISCLAIMER).toContain(u.name);
    expect(nijiUniversityOf('print_lr_niji_shizuoka_en_2')?.name).toBe('静岡大学');
    expect(nijiUniversityOf('print_lr_kyotsu_r_1')).toBeUndefined();
    // 大阪公立大学は A・B どちらも大学名は同じ。ラベルで系統がわかり、全体の注意書きに大学名は1回だけ
    expect(nijiUniversityOf('print_lr_niji_omub_en_1')?.name).toBe('大阪公立大学');
    expect(NIJI_MOCK_PRINTS.find((p) => p.id === 'print_lr_niji_omua_en_1')!.label).toContain('Aグループ');
    expect(NIJI_MOCK_PRINTS.find((p) => p.id === 'print_lr_niji_omub_en_3')!.label).toContain('Bグループ');
    expect(NIJI_DISCLAIMER.split('大阪公立大学').length - 1).toBe(1);
    for (const name of ['和歌山大学', '岡山大学', '広島大学']) expect(NIJI_DISCLAIMER, name).toContain(name);
    expect(nijiUniversityOf('print_lr_niji_hiroshima_en_2')?.name).toBe('広島大学');
    expect(NIJI_MOCK_PRINTS.find((p) => p.id === 'print_lr_niji_okayama_en_1')!.label).toBe('国公立2次 英語 予想問題 岡山大学 前期対策 第1回（問題＋解答・解説）');
    expect(readFileSync('src/components/gacha/GachaPickupModal.tsx', 'utf8')).toContain('NIJI_DISCLAIMER');
  });
});

describe('ガチャ画面：左右スワイプで切り替え', () => {
  const room = readFileSync('src/components/GachaRoom.tsx', 'utf8');
  const carousel = readFileSync('src/components/gacha/GachaPoolCarousel.tsx', 'utf8');
  const css = readFileSync('src/components/gacha.css', 'utf8');
  it('バナーは横スクロール（scroll-snap）で、縦には並べない', () => {
    expect(room).toContain('<GachaPoolCarousel');
    expect(css).toMatch(/\.gacha-carousel \{[^}]*overflow-x: auto[^}]*scroll-snap-type: x mandatory/);
    expect(css).toMatch(/\.gacha-slide \{[^}]*flex: 0 0 100%[^}]*scroll-snap-align: start/);
  });
  it('切替タブ（共通テスト｜2次試験）でも切り替えられ、引くときはそのガチャで抽選する', () => {
    expect(carousel).toContain('role="tablist"');
    expect(carousel).toContain('data-gacha-pool-tab');
    expect(room).toContain('drawGacha(crypto.randomUUID(), owner, pool)');
    expect(room).toContain('drawGachaMulti(crypto.randomUUID(), owner, pool)');
    expect(room).toContain('drawVideoGacha(token, owner, pool)');
  });
  it('見えていないスライドは操作できない（inert・aria-hidden）', () => {
    expect(carousel).toContain('inert={!active ? true : undefined}');
    expect(carousel).toContain('aria-hidden={!active}');
  });
});
