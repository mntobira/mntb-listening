import { expect, it } from 'vitest';
import { emptyProgress, unequipKind, canUnequip, DEFAULT_POSE, DEFAULT_FRAME, ITEMS } from '../src/battle/core/growth';

// 2026-10-06：一度付けた装備を外せるように
it('帽子などは外すと「なし」、ポーズ・フレームは基本に戻る', () => {
  const hat = ITEMS.find(i => i.kind === 'hat')!;
  const pose = ITEMS.find(i => i.kind === 'pose' && i.id !== DEFAULT_POSE)!;
  const frame = ITEMS.find(i => i.kind === 'frame' && i.id !== DEFAULT_FRAME)!;
  const p0 = emptyProgress('u');
  const p = { ...p0, owned: [...p0.owned, hat.id, pose.id, frame.id], equipped: { ...p0.equipped, hat: hat.id, pose: pose.id, frame: frame.id } };
  expect(canUnequip(p, hat)).toBe(true);
  expect(canUnequip(p, pose)).toBe(true);
  expect(canUnequip(p, frame)).toBe(true);
  expect(unequipKind(p, 'hat').equipped.hat).toBe('');
  expect(unequipKind(p, 'pose').equipped.pose).toBe(DEFAULT_POSE);
  expect(unequipKind(p, 'frame').equipped.frame).toBe(DEFAULT_FRAME);
  // 基本ポーズ・紙フレームは「外す」を出さない（外しても見た目が変わらない）
  expect(canUnequip(p0, { id: DEFAULT_POSE, kind: 'pose' })).toBe(false);
  expect(canUnequip(p0, { id: DEFAULT_FRAME, kind: 'frame' })).toBe(false);
  expect(unequipKind(p0, 'pose')).toBe(p0);
  // 付けていないものは外せない
  expect(canUnequip(p0, hat)).toBe(false);
});
