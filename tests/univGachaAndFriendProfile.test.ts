import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  GACHA_COST,
  GACHA_MULTI_COST,
  UNIV_GACHA_COST,
  UNIV_GACHA_MULTI_COST,
  gachaCostOf,
  gachaItemRate,
  gachaItemsByRarity,
  gachaMultiCostOf,
  pickGachaItem,
  rollGacha,
} from '../src/battle/core/arenaEconomy';
import {
  GACHA_POOLS,
  SELECTABLE_UNIVERSITIES,
  UNIV_MOCK_PRINT_IDS,
  inGachaPool,
  selectableUniversityOf,
} from '../src/battle/core/gachaPools';
import { univOfPrint } from '../src/battle/core/printShelves';
import { emptyProgress } from '../src/battle/core/growth';
import { completedVideoToken, drawVideoGacha } from '../src/battle/data/growthStore';

describe('大学選択ガチャ（1回500マナコイン）', () => {
  it('1回500マナコイン（10＋1連は5000枚）、既存の共通テスト・2次試験は100枚のまま', () => {
    expect(UNIV_GACHA_COST).toBe(500);
    expect(UNIV_GACHA_MULTI_COST).toBe(5000);
    expect(gachaCostOf('univ')).toBe(500);
    expect(gachaMultiCostOf('univ')).toBe(5000);
    expect(gachaCostOf('kyotsu')).toBe(GACHA_COST);
    expect(gachaCostOf('niji')).toBe(GACHA_COST);
    expect(gachaMultiCostOf('kyotsu')).toBe(GACHA_MULTI_COST);
    expect(gachaMultiCostOf('niji')).toBe(GACHA_MULTI_COST);
  });

  it('すべての大学別予想問題がいずれかの選択可能な大学に属し、各大学でその大学のLRだけが出る', () => {
    expect(GACHA_POOLS.some((p) => p.id === 'univ')).toBe(true);
    expect(SELECTABLE_UNIVERSITIES.length).toBeGreaterThanOrEqual(60);

    const covered = new Set(SELECTABLE_UNIVERSITIES.flatMap((u) => u.printIds));
    expect([...covered].sort()).toEqual([...UNIV_MOCK_PRINT_IDS].sort());

    for (const u of SELECTABLE_UNIVERSITIES) {
      expect(u.printIds.length, u.id).toBe(3);
      expect(u.region, u.id).not.toBe('other');
      const tiers = gachaItemsByRarity('univ', u.id);
      expect(tiers.LR.map((i) => i.id).sort(), u.id).toEqual([...u.printIds].sort());
      // LR 以外の枠（UR / SR / R / N）も空にならない
      expect(tiers.UR.length, u.id).toBeGreaterThan(0);
      expect(tiers.SR.length, u.id).toBeGreaterThan(0);
      expect(tiers.R.length, u.id).toBeGreaterThan(0);
      expect(tiers.N.length, u.id).toBeGreaterThan(0);
    }
  });

  it('選んだ大学以外の予想問題LRは排出率0%で、抽選でも絶対に出ない', () => {
    const nagoya = selectableUniversityOf('nagoya');
    const osaka = selectableUniversityOf('osaka');
    const nagoyaTiers = gachaItemsByRarity('univ', nagoya.id);
    const osakaTiers = gachaItemsByRarity('univ', osaka.id);

    expect(gachaItemRate(nagoyaTiers.LR[0], 'N', 'univ', nagoya.id)).toBeCloseTo(0.01 / 3, 10);
    expect(gachaItemRate(osakaTiers.LR[0], 'N', 'univ', nagoya.id)).toBe(0);

    // 乱数 0〜0.0099（LR枠）ではすべて名古屋大学の予想問題になる
    for (const r of [0, 0.001, 0.004, 0.007, 0.0099]) {
      const picked = pickGachaItem(r, 'N', 'univ', nagoya.id)!;
      expect(picked.rarity).toBe('LR');
      expect(univOfPrint(picked.item.id)).toBe('nagoya');
    }

    // 乱数全域でも他大学の予想問題は一切混ざらない
    for (let i = 0; i < 500; i += 1) {
      const r = (i + 0.5) / 500;
      const picked = pickGachaItem(r, 'N', 'univ', nagoya.id)!;
      expect(inGachaPool(picked.item.id, 'univ', nagoya.id)).toBe(true);
      const u = univOfPrint(picked.item.id);
      if (u !== null) expect(u).toBe('nagoya');
    }
  });

  it('rollGacha は pool="univ" のとき既定で500コイン消費し、499コイン以下では引けない', () => {
    const shortCoins = { ...emptyProgress('u'), coins: 499 };
    expect(rollGacha(shortCoins, 0, 'N', { pool: 'univ', univId: 'kobe' })).toBeNull();

    const enoughCoins = { ...emptyProgress('u'), coins: 600 };
    const res = rollGacha(enoughCoins, 0, 'N', { pool: 'univ', univId: 'kobe' })!;
    expect(res).not.toBeNull();
    expect(res.rarity).toBe('LR');
    expect(univOfPrint(res.item.id)).toBe('kobe');
    expect(res.next.coins).toBe(100);
  });

  it('大学選択ガチャでは動画無料抽選は使えない', async () => {
    const token = completedVideoToken();
    const res = await drawVideoGacha(token, 'guest', 'univ');
    expect(res).toBeNull();
  });

  it('ガチャ画面UIに大学選択モーダルと「大学をえらぶ」導線がある', () => {
    const room = readFileSync('src/components/GachaRoom.tsx', 'utf8');
    const modal = readFileSync('src/components/gacha/GachaUniversityModal.tsx', 'utf8');
    const carousel = readFileSync('src/components/gacha/GachaPoolCarousel.tsx', 'utf8');
    expect(room).toContain('<GachaUniversityModal');
    expect(room).toContain('data-gacha-univ-select');
    expect(carousel).toContain('data-gacha-univ-open');
    expect(modal).toContain('data-gacha-univ-dialog');
    expect(modal).toContain('data-gacha-univ-search');
    expect(modal).toContain('1回500枚');
  });
});

describe('フレンド一覧の「…」メニューからのプロフィール表示', () => {
  it('FriendPanel のフレンド行・申請行の UserSafetyMenu は「…」（triggerVariant="dots"）のまま onProfile を渡す', () => {
    const fp = readFileSync('src/components/FriendPanel.tsx', 'utf8');
    const menu = readFileSync('src/features/safety/UserSafetyMenu.tsx', 'utf8');

    // UserSafetyMenu が triggerVariant="dots" に対応し、onProfile 時に data-user-profile（「プロフィールを見る」）を出す
    expect(menu).toContain("triggerVariant?: 'detail' | 'dots'");
    expect(menu).toContain('const showDetailLabel = Boolean(onProfile) && triggerVariant === \'detail\'');
    expect(menu).toContain('data-user-profile');
    expect(menu).toContain('プロフィールを見る');

    // FriendPanel 側では申請行・フレンド一覧行の両方で triggerVariant="dots" と onProfile を設定し、名前タップでも開ける
    const dotsMatches = fp.match(/triggerVariant="dots"/g) ?? [];
    expect(dotsMatches.length).toBeGreaterThanOrEqual(2);
    expect(fp).toContain('onProfile={openFriendProfile}');
    expect(fp).toContain('data-friend-profile-open');
  });
});
