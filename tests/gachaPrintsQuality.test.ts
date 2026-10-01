import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { GACHA_PRINTS } from '../src/data/gachaPrints.generated';

/** ★UR 学習プリント（英語）の品質の下限（2026-10-01）★ pdftotext が無い環境では飛ばす */
const hasPdf = (() => { try { execFileSync('pdftotext', ['-v'], { stdio: 'ignore' }); return true; } catch { return false; } })();
const text = (file: string) => execFileSync('pdftotext', ['-layout', `public${file}`, '-'], { encoding: 'utf8', maxBuffer: 64 << 20 });
const english = GACHA_PRINTS.filter(p => p.subject === 'english_grammar' || p.subject === 'english_vocab');
const REBUILT = ['print_c_inorganic', 'print_math_basic_all', 'print_rika_1', 'print_rika_2', 'print_rika_3'];

describe('UR 学習プリント（英語）', () => {
  it('台帳のページ数・ファイルが実物と合う', () => {
    for (const p of english) {
      expect(existsSync(`public${p.file}`), p.id).toBe(true);
      expect(existsSync(`public${p.thumb}`), p.id).toBe(true);
      expect(Math.abs(statSync(`public${p.file}`).size / 1024 - p.kb)).toBeLessThan(2);
    }
  });
  it.skipIf(!hasPdf)('英文法100題：100問すべてに解説（誤答肢の説明つき）・正解位置は①〜④に25問ずつ', () => {
    const t = text('/prints/print_grammar_100.pdf');
    const heads = [...t.matchAll(/^\s*(\d+)\s+正解\s+([①②③④])/gm)];
    expect(heads.map(m => Number(m[1]))).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
    const dist = { '①': 0, '②': 0, '③': 0, '④': 0 } as Record<string, number>;
    heads.forEach(m => { dist[m[2]] += 1; });
    expect(dist).toEqual({ '①': 25, '②': 25, '③': 25, '④': 25 });
    expect(t).toContain('解き方');
    expect((t.match(/決め手/g) || []).length).toBeGreaterThanOrEqual(100);
    expect(t).not.toMatch(/^\s*\d+\s+[①②③④]\s+正解は「[^」]*」。\s*$/m); // 以前の「正解は『〜』。」だけの解説に戻っていない
  });
  it.skipIf(!hasPdf)('英単語：100語・4択30問に答えがある', () => {
    for (const p of english.filter(p => p.subject === 'english_vocab')) {
      const t = text(p.file);
      expect(t, p.id).toContain('4択で確認（30問）');
      expect(t, p.id).toContain('③ 4択の答え');
      expect(t, p.id).toMatch(/日→英テスト（30問）/);
    }
  });
});

describe('UR 学習プリント（理科・化学 無機・数学 総まとめ）', () => {
  const list = GACHA_PRINTS.filter(p => REBUILT.includes(p.id));
  it('台帳のページ数・ファイルが実物と合う', () => {
    expect(list.length).toBe(REBUILT.length);
    for (const p of list) {
      expect(existsSync(`public${p.file}`), p.id).toBe(true);
      expect(Math.abs(statSync(`public${p.file}`).size / 1024 - p.kb), p.id).toBeLessThan(2);
    }
  });
  it.skipIf(!hasPdf)('全問に解説・正解位置は①〜④にほぼ均等・1行だけの解説に戻っていない・字化けなし', () => {
    for (const p of list) {
      const t = text(p.file);
      const heads = [...t.matchAll(/^\s*(\d+)\s+正解\s+([①②③④])/gm)];
      const n = heads.length;
      expect(heads.map(m => Number(m[1])), p.id).toEqual(Array.from({ length: n }, (_, i) => i + 1));
      expect(n, p.id).toBeGreaterThanOrEqual(50);
      const dist = { '①': 0, '②': 0, '③': 0, '④': 0 } as Record<string, number>;
      heads.forEach(m => { dist[m[2]] += 1; });
      for (const k of Object.keys(dist)) expect(Math.abs(dist[k] - n / 4), `${p.id} ${k}`).toBeLessThanOrEqual(1);
      expect(t, p.id).not.toMatch(/正解は「[^」]*」。\s*$/m);
      expect(t, p.id).not.toContain('<b>');
      expect(t, p.id).toContain('答えの一覧');
    }
  });
});
