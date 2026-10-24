import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { GACHA_RARITY_RATES, gachaItemsByRarity } from '../src/battle/core/arenaEconomy';
import { GACHA_PRINTS } from '../src/data/gachaPrints.generated';
import { printRarity } from '../src/battle/core/growth';

/** ★2026-10-24 ご要望「はずれを多く・大当たりはとびきり豪華に（その一冊で完成する本）」★ */
const hasPdf = (() => { try { execFileSync('pdftotext', ['-v'], { stdio: 'ignore' }); return true; } catch { return false; } })();
const text = (file: string) => execFileSync('pdftotext', ['-layout', `public${file}`, '-'], { encoding: 'utf8', maxBuffer: 64 << 20 });
const books = GACHA_PRINTS.filter(p => p.category === '完全版');

describe('ガチャの配分（はずれ多め・URは完全版の本だけ）', () => {
  it('N が 75%・UR は 3%（合計 1）', () => {
    expect(GACHA_RARITY_RATES).toEqual({ UR: 0.03, SR: 0.06, R: 0.16, N: 0.75 });
    expect(Object.values(GACHA_RARITY_RATES).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });
  it('ガチャの UR は全部「完全版」の本。単元プリント・100語テストは SR', () => {
    const tiers = gachaItemsByRarity();
    expect(tiers.UR.length).toBe(books.length);
    for (const item of tiers.UR) expect(books.some(b => b.id === item.id), item.id).toBe(true);
    for (const p of GACHA_PRINTS) expect(printRarity(p), p.id).toBe(p.category === '完全版' ? 'UR' : 'SR');
  });
  it('完全版は7冊（英単語3・英熟語1・リーディング大問別2・全科目分析1）がそろい、ファイルとページ数が台帳と合う', () => {
    expect(books.map(b => b.id).sort()).toEqual(['print_book_analysis_all', 'print_book_idiom_all', 'print_book_reading_mock1', 'print_book_reading_mock2',
      'print_book_vocab_adv', 'print_book_vocab_lv1', 'print_book_vocab_lv2']);
    for (const b of books) {
      expect(existsSync(`public${b.file}`), b.id).toBe(true);
      expect(existsSync(`public${b.thumb}`), b.id).toBe(true);
      expect(Math.abs(statSync(`public${b.file}`).size / 1024 - b.kb), b.id).toBeLessThan(2);
      expect(b.pages, b.id).toBeGreaterThanOrEqual(15);
    }
  });
});

describe.skipIf(!hasPdf)('完全版の中身（その一冊で完成するか）', () => {
  it('単語帳・熟語帳はデータの全語を収録し、確認テスト・総仕上げ100問・解答・さくいんがある', () => {
    for (const id of ['print_book_vocab_lv1', 'print_book_vocab_lv2', 'print_book_vocab_adv', 'print_book_idiom_all']) {
      const t = text(books.find(b => b.id === id)!.file);
      for (const k of ['この本の使い方', '学習計画表', '確認テスト', '総仕上げテスト（100問）', '解答', 'さくいん']) expect(t, `${id} ${k}`).toContain(k);
    }
    expect(text('/prints/print_book_vocab_lv2.pdf')).toContain('962語');
    expect(text('/prints/print_book_idiom_all.pdf')).toContain('1,885熟語');
  });
  it.each(['print_book_reading_mock1', 'print_book_reading_mock2'])('リーディング大問別 %s：第1問〜第8問すべてに解き方・問題・解説・重要語句、44マーク', (id) => {
    const t = text(`/prints/${id}.pdf`);
    for (let q = 1; q <= 8; q++) {
      expect(t, `第${q}問`).toMatch(new RegExp(`第${q}問\\s*解答・解説`));
    }
    expect((t.match(/特徴と解き方/g) || []).length).toBeGreaterThanOrEqual(8);
    expect((t.match(/重要語句/g) || []).length).toBeGreaterThanOrEqual(8);
    expect(t).toContain('44マーク');
    expect(t).toContain('得点記録表');
  });
  it('全科目分析：主要科目すべてと出典・最新平均点がある', () => {
    const t = text('/prints/print_book_analysis_all.pdf');
    for (const k of ['英語（リーディング）', '英語（リスニング）', '国語', '数学Ⅰ、数学A', '数学Ⅱ、数学B、数学C', '情報Ⅰ', '物理', '化学', '生物',
      '歴史総合、日本史探究', '歴史総合、世界史探究', '地理総合、地理探究', '出典', '116.37', '56.59']) expect(t, k).toContain(k);
  });
});
