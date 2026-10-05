import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { isRatedOpponent } from '../src/battle/data/battleRanking';

// 2026-10-05：AI 対戦ではレートを動かさない
it('AI・ボット相手はレート対象外、人はレート対象', () => {
  expect(isRatedOpponent('ai:normal')).toBe(false);
  expect(isRatedOpponent('ai:expert')).toBe(false);
  expect(isRatedOpponent('bot_1')).toBe(false);
  expect(isRatedOpponent('Xy12abcUID')).toBe(true);
});

it('AI 対戦の画面はレートを書き込まない（applyRatingResult を呼ばない）', () => {
  for (const f of ['src/battle/hooks/useAiBattle.ts', 'src/battle/ui/BattleAiRoomScreen.tsx']) {
    expect(readFileSync(f, 'utf8')).not.toContain('applyRatingResult');
  }
  expect(readFileSync('src/battle/ui/BattleAiRoomScreen.tsx', 'utf8')).toContain('rating={null}');
  expect(readFileSync('src/battle/hooks/useBattleRoom.ts', 'utf8')).toContain('forfeit, opponentUid)');
});
