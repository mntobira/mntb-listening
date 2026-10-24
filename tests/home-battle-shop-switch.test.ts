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

  // 2026-10-20 30045bd「remove duplicate gacha shop switch」で上部の切替ボタンは重複として撤去した
  // （UI の決まり「同じ操作を1画面に2つ置かない」）。行き来はガチャ説明文のリンクとショップ側の onGacha で残っている
  it('装飾ガチャとショップを行き来でき、重複の切替ボタンは置かない', () => {
    expect(gacha).toContain('「ショップ」へ');
    expect(gacha).not.toContain('collection-mode-switch');
    expect(collection).toContain('onGacha');
    expect(collection).not.toContain('collection-mode-switch');
  });

  it('単一科目の演習画面には左上のホーム戻るボタンを置かない', () => {
    expect(studyCatalog).toContain('{!single && <button');
  });
});
