import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const battleHome = readFileSync('src/battle/ui/BattleHome.tsx', 'utf8');
const leaderboard = readFileSync('src/components/Leaderboard.tsx', 'utf8');
const gacha = readFileSync('src/components/GachaRoom.tsx', 'utf8');
const collection = readFileSync('src/components/MyCollection.tsx', 'utf8');
const studyCatalog = readFileSync('src/components/StudyCatalog.tsx', 'utf8');

describe('ホーム周辺の切替導線', () => {
  it('対戦ロビーとランキングを上部で切り替えられる', () => {
    expect(battleHome).toContain('とびらバトル');
    expect(battleHome).toContain('ランキング');
    expect(leaderboard).toContain('とびらバトル');
    expect(leaderboard).toContain('league-top-switch');
    expect(battleHome).not.toContain('>ホームへ</button>');
  });

  it('装飾ガチャとショップを相互に切り替えられる', () => {
    expect(gacha).toContain('collection-mode-switch');
    expect(gacha).toContain('onShop');
    expect(collection).toContain('ショップと装飾ガチャの切替');
    expect(collection).toContain('onGacha');
  });

  it('単一科目の演習画面には左上のホーム戻るボタンを置かない', () => {
    expect(studyCatalog).toContain('{!single && <button');
  });
});
