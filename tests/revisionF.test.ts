import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { ITEMS, PRINT_SHOP_PRICES, gachaRarityOf, purchaseItem, shopPriceOf } from '../src/battle/core/growth';
import { CINEMATIC_CLIPS } from '../src/components/CinematicClip';

const read = (p: string) => readFileSync(p, 'utf8');

describe('E1 フレンド対戦の結果 →「部屋に戻って科目などを選ぶ」', () => {
  const src = read('src/battle/ui/BattleRoomScreen.tsx');
  it('フレンド部屋は合言葉のロビー（次の部屋）へ。教科選び（onChangeSubject）へは落とさない', () => {
    expect(src).toContain("const isFriendRoom = !!room && (!!room.joinCode");
    // フレンド部屋で onSwitchRoom があれば hostMove / guestFollow だけ
    expect(src).toMatch(/isFriendRoom && onSwitchRoom\s*\?\s*\(isHostHere/);
    expect(src).toContain('部屋に戻って科目などを選ぶ（同じ相手と再戦）');
  });
  it('失敗したときは結果画面に理由を出す（もう一度押せる）', () => {
    expect(src).toContain('backToRoomNote={moveError}');
    expect(read('src/battle/ui/BattleResult.tsx')).toContain('data-result-back-room-note');
  });
});

describe('E2 負けの動画', () => {
  it('旧 lose.mp4 は削除し、別の動画（gacha_r）を使う', () => {
    expect(existsSync('public/cinematics/lose.mp4')).toBe(false);
    expect(CINEMATIC_CLIPS.lose.src).toBe('/cinematics/gacha_r.mp4');
  });
  it('流し終わったら枠ごと外す（最後のコマ・ポスターを残さない）', () => {
    const src = read('src/battle/ui/BattleResult.tsx');
    expect(src).toContain('!loseClipDone &&');
    expect(src).toContain('onComplete={() => setLoseClipDone(true)}');
    expect(src).not.toMatch(/CINEMATIC_CLIPS\.lose\.src[^>]*\bhold\b/);
  });
});

describe('E3 マナラッシュの最初の画面', () => {
  const src = read('src/components/ManaRush.tsx');
  it('見出しはほかの独立画面と同じ形（← 44px ＋ 見出し）。文字だけの「←もどる」は使わない', () => {
    expect(src).toContain('profile-standalone-head mana-rush-head');
    expect(src).toContain('data-rush-back');
    expect(src).not.toContain('className="arena-back"');
  });
});

describe('E5 ショップで PDF をマナコインと交換', () => {
  it('値段は LR 5000 / UR 3000 / SR 2000', () => {
    expect(PRINT_SHOP_PRICES).toEqual({ LR: 5000, UR: 3000, SR: 2000 });
  });
  it('ガチャの PDF はすべてショップに並び、レア度どおりの値段', () => {
    const prints = ITEMS.filter((i) => i.kind === 'print' && i.gacha);
    expect(prints.length).toBeGreaterThan(0);
    for (const p of prints) expect(shopPriceOf(p), p.id).toBe(PRINT_SHOP_PRICES[gachaRarityOf(p)]);
    const rarities = new Set(prints.map(gachaRarityOf));
    for (const r of ['LR', 'UR', 'SR'] as const) expect(rarities.has(r), r).toBe(true);
  });
  it('レベル報酬の PDF はショップに出さない', () => {
    const lv = ITEMS.find((i) => i.id === 'print_level_listening_howto')!;
    expect(shopPriceOf(lv)).toBeNull();
  });
  it('購入するとコインが減り、持ちものに入る（足りなければ買えない）', () => {
    const lr = ITEMS.find((i) => i.kind === 'print' && i.gacha && gachaRarityOf(i) === 'LR')!;
    const base = { coins: 5000, owned: [] as string[] } as unknown as Parameters<typeof purchaseItem>[0];
    const ok = purchaseItem(base, lr.id);
    expect(ok.ok).toBe(true);
    expect(ok.next.coins).toBe(0);
    expect(ok.next.owned).toContain(lr.id);
    const ng = purchaseItem({ ...base, coins: 4999 } as typeof base, lr.id);
    expect(ng.ok).toBe(false);
  });
  it('ショップの種類に「PDF」がある', () => {
    expect(read('src/components/MyCollection.tsx')).toContain("['print','PDF']");
  });
});
