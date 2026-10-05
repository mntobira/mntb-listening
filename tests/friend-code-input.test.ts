import { expect, it } from 'vitest';
import { friendCodeFromRaw } from '../src/components/FriendCodeInput';

// 2026-10-05：フレンドコードは普通の入力欄。どんな形で入れても送信時に正しい形にそろえる
it('いろいろな入れ方を MNTB-XXXX-XXXX にそろえる', () => {
  for (const raw of ['MNTB-AB12-CD34', 'mntb-ab12-cd34', ' MNTB AB12 CD34 ', 'AB12CD34', 'ab12-cd34', 'ｍｎｔｂ－ＡＢ１２－ＣＤ３４', 'MNTBAB12CD34'])
    expect(friendCodeFromRaw(raw)).toBe('MNTB-AB12-CD34');
  for (const raw of ['', 'AB12', 'MNTB-AB12-CD3', 'MNTB-AB12-CD345'])
    expect(friendCodeFromRaw(raw)).toBe('');
});
