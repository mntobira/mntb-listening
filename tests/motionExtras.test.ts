import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { shouldPlayDoor } from '../src/components/ui/DoorTransition';

const read = (p: string) => readFileSync(p, 'utf8');

describe('演出の追加（2026-10-19）', () => {
  it('扉のページ切り替えは主要画面どうしだけ・初回と動きを減らす設定では出さない', () => {
    expect(shouldPlayDoor('home', 'battle', false)).toBe(true);
    expect(shouldPlayDoor('settings', 'growth', false)).toBe(true);
    expect(shouldPlayDoor(null, 'home', false)).toBe(false);
    expect(shouldPlayDoor('home', 'home', false)).toBe(false);
    expect(shouldPlayDoor('home', 'battle', true)).toBe(false);
    // 演習・解説の切り替えでは毎回扉が出ないように
    expect(shouldPlayDoor('quiz', 'explanation', false)).toBe(false);
    expect(shouldPlayDoor('home', 'quiz', false)).toBe(false);
  });
  it('扉のアニメは transform と opacity だけで、押せなくならない', () => {
    const css = read('src/components/ui/door-transition.css');
    expect(css).toContain('pointer-events: none');
    expect(css).toContain('prefers-reduced-motion');
    const keyframes = css.slice(css.indexOf('@keyframes dt-open'));
    expect(keyframes.split('\n')[0]).not.toMatch(/width|height|left|top/);
  });
  it('読み込み中は扉の絵つき・動きを減らす設定で止まる', () => {
    expect(read('src/components/ScreenStatus.tsx')).toContain('screen-loading-door');
    expect(read('src/components/screen-loading.css')).toContain('prefers-reduced-motion');
  });
  it('コインを受け取る3か所（ミッション行・まとめて受け取る・宝箱）でコインが飛ぶ', () => {
    expect(read('src/battle/ui/GrowthParts.tsx')).toContain('flyCoins(e.currentTarget');
    expect(read('src/components/MissionToast.tsx')).toContain('flyCoins(claimBtn.current');
    expect(read('src/battle/ui/BattleMissions.tsx')).toContain('flyCoins(chestBtn');
  });
  it('復習カードの吸い込み・XPの火花は動きを減らす設定で消える', () => {
    const css = read('src/components/home/home-v2.css');
    expect(css).toContain('.home-review-suck { display: none; }');
    expect(css).toMatch(/game-hud-xp \[role=progressbar\] > div::after \{ animation: none; display: none; \}/);
  });
});
