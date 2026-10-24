import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { KYOTSU_MOCK_PRINTS } from '../src/data/kyotsuMockPrints';
import { GACHA_RARITY_ORDER, GACHA_RARITY_RATES, gachaItemsByRarity, gachaItemRate, pickGachaItem, exchangeShards } from '../src/battle/core/arenaEconomy';
import { ITEMS, emptyProgress, gachaRarityOf, printOf } from '../src/battle/core/growth';

/** ★LR（レジェンドレア）＝共通テスト英語 予想問題（2026-10-24）★ */
const hasPdf = (() => { try { execFileSync('pdftotext', ['-v'], { stdio: 'ignore' }); return true; } catch { return false; } })();
const text = (file: string) => execFileSync('pdftotext', ['-layout', `public${file}`, '-'], { encoding: 'utf8', maxBuffer: 64 << 20 });

describe('LR：共通テスト 英語 予想問題', () => {
  it('台帳のページ数・ファイル・サムネイルが実物と合う', () => {
    expect(KYOTSU_MOCK_PRINTS.length).toBe(10); // リーディング・リスニング × 5回分
    for (const p of KYOTSU_MOCK_PRINTS) {
      expect(existsSync(`public${p.file}`), p.id).toBe(true);
      expect(existsSync(`public${p.thumb}`), p.id).toBe(true);
      expect(Math.abs(statSync(`public${p.file}`).size / 1024 - p.kb), p.id).toBeLessThan(2);
    }
  });
  it('リーディングとリスニングが同じ回数ずつそろっている', () => {
    const r = KYOTSU_MOCK_PRINTS.filter(p => p.id.includes('_r_')).map(p => p.id.split('_').pop());
    const l = KYOTSU_MOCK_PRINTS.filter(p => p.id.includes('_l_')).map(p => p.id.split('_').pop());
    expect(r).toEqual(l);
  });
  it('ガチャでは LR として出る（UR より上・割合 1%・1種あたりは UR より低くない）', () => {
    const tiers = gachaItemsByRarity();
    expect(GACHA_RARITY_ORDER[0]).toBe('LR');
    expect(tiers.LR.map(i => i.id).sort()).toEqual(KYOTSU_MOCK_PRINTS.map(p => p.id).sort());
    for (const p of KYOTSU_MOCK_PRINTS) {
      const item = ITEMS.find(i => i.id === p.id)!;
      expect(gachaRarityOf(item)).toBe('LR');
      expect(item.kind).toBe('print');
      expect(printOf(p.id)?.file).toBe(p.file);
    }
    expect(Object.values(GACHA_RARITY_RATES).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    expect(GACHA_RARITY_RATES.LR).toBe(0.01);
    expect(GACHA_RARITY_RATES.UR).toBe(0.05);
    expect(gachaItemRate(tiers.LR[0])).toBeCloseTo(0.01 / tiers.LR.length, 10);
  });
  it('乱数の先頭 1% で LR が出る・かけらとは交換できない', () => {
    expect(pickGachaItem(0)?.rarity).toBe('LR');
    expect(pickGachaItem(0.0099)?.rarity).toBe('LR');
    expect(pickGachaItem(0.0101)?.rarity).toBe('UR');
    const p = { ...emptyProgress('u'), shards: 999 };
    expect(exchangeShards(p, KYOTSU_MOCK_PRINTS[0].id).ok).toBe(false);
  });
  it.skipIf(!hasPdf)('PDF：リーディングは解答数44・リスニングは37、正解と配点の合計が100、オリジナルの明記', () => {
    for (const p of KYOTSU_MOCK_PRINTS) {
      const t = text(p.file);
      expect(t, p.id).toContain('正解と配点');
      expect(t, p.id).toMatch(/合計\s+44|合計\s+37/);
      expect(t, p.id).toMatch(/\b100\b/);
      expect(t, p.id).toContain('大学入試センターの過去問ではありません');
      if (p.id.includes('_r_')) {
        expect(t, p.id).toMatch(/合計\s+44/);
        for (const n of ['第1問', '第2問', '第3問', '第4問', '第5問', '第6問', '第7問', '第8問']) expect(t, `${p.id} ${n}`).toContain(n);
        expect(t, p.id).toContain('本文の要旨');
      } else {
        expect(t, p.id).toMatch(/合計\s+37/);
        expect(t, p.id).toContain('スクリプト・全訳・解説');
        expect(t, p.id).toContain('2回読み');
        expect(t, p.id).toContain('1回読み');
      }
    }
  });
});
