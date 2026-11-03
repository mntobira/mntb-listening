import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { KOBE_MOCK_PRINTS } from '../src/data/kobeMockPrints';
import { gachaItemsByRarity } from '../src/battle/core/arenaEconomy';
import { ITEMS, gachaRarityOf, printOf } from '../src/battle/core/growth';
import { GACHA_PREVIEWS } from '../src/data/gachaPreviews.generated';

/** ★LR＝神戸大学 前期 英語 予想問題（3回分 × 問題／解答・解説・白黒）2026-10-29★ */
const hasPdf = (() => { try { execFileSync('pdftotext', ['-v'], { stdio: 'ignore' }); return true; } catch { return false; } })();
const text = (file: string) => execFileSync('pdftotext', [`public${file}`, '-'], { encoding: 'utf8', maxBuffer: 64 << 20 }).replace(/\s+/g, '');

describe('LR：神戸大学 前期 英語 予想問題', () => {
  it('3回分 × 問題・解答解説の6種。ファイル・サムネイル・KB が実物と合う', () => {
    expect(KOBE_MOCK_PRINTS.length).toBe(6);
    for (const n of [1, 2, 3]) for (const k of ['q', 'a']) expect(KOBE_MOCK_PRINTS.some(p => p.id === `print_lr_kobe_${k}_${n}`)).toBe(true);
    for (const p of KOBE_MOCK_PRINTS) {
      expect(existsSync(`public${p.file}`), p.id).toBe(true);
      expect(existsSync(`public${p.thumb}`), p.id).toBe(true);
      expect(Math.abs(statSync(`public${p.file}`).size / 1024 - p.kb), p.id).toBeLessThan(2);
      expect(GACHA_PREVIEWS[p.id]?.length, p.id).toBeGreaterThan(0);
    }
  });
  it('ガチャでは LR として出る', () => {
    const lr = gachaItemsByRarity('niji').LR.map(i => i.id);
    for (const p of KOBE_MOCK_PRINTS) {
      const item = ITEMS.find(i => i.id === p.id)!;
      expect(item.kind).toBe('print');
      expect(gachaRarityOf(item)).toBe('LR');
      expect(lr).toContain(p.id);
      expect(printOf(p.id)?.file).toBe(p.file);
    }
  });
  it('名前に誇大な言い方を使わない', () => {
    for (const p of KOBE_MOCK_PRINTS) {
      expect(p.label).toContain('予想問題');
      expect(p.label).not.toMatch(/的中|必ず出る|合格できる/);
    }
  });
  it.skipIf(!hasPdf)('PDF：大学とは無関係の明記・125点・大問 I〜IV', () => {
    for (const p of KOBE_MOCK_PRINTS) {
      const t = text(p.file);
      expect(t, p.id).toContain('神戸大学の過去問・公式問題ではありません');
      expect(t, p.id).toContain('大学とは関係がありません');
      expect(t, p.id).toContain('125点');
      expect(t, p.id).not.toMatch(/的中|必ず出る|合格できる/);
      if (p.id.includes('_q_')) expect(t, p.id).toContain('解答用紙');
      else { expect(t, p.id).toContain('採点基準'); expect(t, p.id).toContain('全訳'); }
    }
  });
});
