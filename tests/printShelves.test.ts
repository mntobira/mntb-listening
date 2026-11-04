import { describe, expect, it } from 'vitest';
import { ITEMS, printOf, shopPriceOf } from '../src/battle/core/growth';
import { PRINT_SHELVES, UNIV_REGION, printShelfOf, univOfPrint } from '../src/battle/core/printShelves';
import { NIJI_UNIVERSITIES } from '../src/data/nijiMockPrints';

// 2026-11-04：ショップの PDF を棚（共通テスト・2次は地方ごと・教科）で整理
const prints = ITEMS.filter((i) => i.kind === 'print').map((i) => printOf(i.id)!).filter(Boolean);

describe('PDF の棚', () => {
  it('大学別の予想問題は、どれも地方の棚に入る（新しい大学を足したら UNIV_REGION に1行）', () => {
    const missing = prints.map((p) => univOfPrint(p.id)).filter((u): u is string => !!u && !UNIV_REGION[u]);
    expect([...new Set(missing)]).toEqual([]);
    for (const u of NIJI_UNIVERSITIES) expect(UNIV_REGION[u.id], u.id).toBeTruthy();
  });
  it('「その他」に落ちる PDF は無い', () => {
    expect(prints.filter((p) => printShelfOf(p) === 'other').map((p) => p.id)).toEqual([]);
  });
  it('代表的な振り分け', () => {
    const shelf = (id: string) => printShelfOf(printOf(id)!);
    expect(shelf('print_lr_kyotsu_r_1')).toBe('kyotsu');
    expect(shelf('print_lr_hokudai_q_1')).toBe('hokkaido_tohoku');
    expect(shelf('print_lr_niji_nagoya_en_1')).toBe('kanto_chubu');
    expect(shelf('print_lr_kobe_a_1')).toBe('kinki');
    expect(shelf('print_lr_niji_kochim_en_2')).toBe('chugoku_shikoku');
    expect(shelf('print_lr_niji_ryukyu_en_3')).toBe('kyushu_okinawa');
    expect(shelf('print_trend_cb_all')).toBe('trend');
    expect(shelf('print_cb_ch1')).toBe('chemistry');
  });
  it('ショップの PDF はすべて、どこか1つの棚に入る（棚ごとの合計＝全体）', () => {
    const shop = ITEMS.filter((i) => i.kind === 'print' && shopPriceOf(i) != null);
    const ids = new Set(PRINT_SHELVES.map((s) => s.id));
    const total = shop.filter((i) => ids.has(printShelfOf(printOf(i.id)!))).length;
    expect(total).toBe(shop.length);
  });
});
