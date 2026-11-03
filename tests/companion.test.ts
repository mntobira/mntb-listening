import { describe, expect, it } from 'vitest';
import { emptyProgress, normalizeProgress, unequipKind, canUnequip, equipItem, equippedCompanion, DEFAULT_COMPANION, ITEMS, itemById } from '../src/battle/core/growth';
import { COMPANIONS, parseAccessory, ACCESSORY_SLOTS, type AccessorySlot } from '../src/battle/core/tobiraParts';
import { gachaItemsByRarity } from '../src/battle/core/arenaEconomy';

// 2026-11-03：お供（カギノスケ）とはずれ（N）の追加
describe('お供', () => {
  it('はじめから最初のお供を持っていて、連れている', () => {
    const p = emptyProgress('u');
    expect(p.owned).toContain(DEFAULT_COMPANION);
    expect(p.equipped.companion).toBe(DEFAULT_COMPANION);
    expect(equippedCompanion(p)).toBe('key_gold');
  });
  it('古い記録（companion が無い）でも、最初のお供を連れている', () => {
    const p = normalizeProgress('u', { owned: ['pose_basic'], equipped: { pose: 'pose_basic' } });
    expect(p.owned).toContain(DEFAULT_COMPANION);
    expect(p.equipped.companion).toBe(DEFAULT_COMPANION);
  });
  it('外すと連れていない（読み直しても外したまま）', () => {
    const p = emptyProgress('u');
    expect(canUnequip(p, { id: DEFAULT_COMPANION, kind: 'companion' })).toBe(true);
    const off = unequipKind(p, 'companion');
    expect(off.equipped.companion).toBe('');
    expect(equippedCompanion(off)).toBe('');
    expect(normalizeProgress('u', off).equipped.companion).toBe('');
  });
  it('持っていないお供は表示しない・持てば付けかえられる', () => {
    const p = emptyProgress('u');
    expect(equippedCompanion({ ...p, equipped: { ...p.equipped, companion: 'comp_key_aurora' } })).toBe('');
    const got = equipItem({ ...p, owned: [...p.owned, 'comp_key_aurora'] }, 'comp_key_aurora');
    expect(equippedCompanion(got)).toBe('key_aurora');
  });
  it('お供の見た目はすべて登録ずみ・ガチャから出るのは6色', () => {
    const comps = ITEMS.filter(i => i.kind === 'companion');
    expect(comps.length).toBe(7);
    for (const c of comps) expect(COMPANIONS[c.value], c.id).toBeTruthy();
    expect(comps.filter(c => c.gacha).length).toBe(6);
    expect(itemById(DEFAULT_COMPANION)?.gacha).toBeFalsy();
  });
});

describe('はずれ（N）の追加', () => {
  it('アクセサリはすべて描ける形と色', () => {
    for (const i of ITEMS) {
      if (!(ACCESSORY_SLOTS as readonly string[]).includes(i.kind)) continue;
      expect(parseAccessory(i.kind as AccessorySlot, i.value), i.id).not.toBeNull();
    }
  });
  it('共通テストガチャの N が増えている（25種以上の追加）', () => {
    expect(gachaItemsByRarity('kyotsu').N.length).toBeGreaterThanOrEqual(50);
  });
  it('id が重複していない', () => {
    const ids = ITEMS.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
