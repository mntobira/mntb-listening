import { describe, it, expect } from 'vitest';
import { pauseAllAudio } from '../src/utils/audioElements';

/** pause() が呼ばれたかだけを記録する最小の audio 要素 */
function fakeAudio(paused: boolean) {
  const el = { paused, pauseCalls: 0, pause() { this.pauseCalls += 1; this.paused = true; } };
  return el;
}
function fakeRoot(els: ReturnType<typeof fakeAudio>[]) {
  return { querySelectorAll: (sel: string) => (sel === 'audio' ? els : []) } as unknown as ParentNode;
}

describe('pauseAllAudio（音声の二重再生防止を1か所に集約）', () => {
  it('再生中の音源をすべて止める', () => {
    const a = fakeAudio(false), b = fakeAudio(false);
    pauseAllAudio(null, fakeRoot([a, b]));
    expect([a.paused, b.paused]).toEqual([true, true]);
  });

  it('except に渡した要素（いま鳴らし始めた音源）は止めない', () => {
    const self = fakeAudio(false), other = fakeAudio(false);
    pauseAllAudio(self as unknown as HTMLMediaElement, fakeRoot([self, other]));
    expect(self.pauseCalls).toBe(0);
    expect(other.pauseCalls).toBe(1);
  });

  it('止まっている要素には触らない', () => {
    const idle = fakeAudio(true);
    pauseAllAudio(null, fakeRoot([idle]));
    expect(idle.pauseCalls).toBe(0);
  });

  it('root が無い（SSR・閉じたダイアログ）ときは何もしない', () => {
    expect(() => pauseAllAudio(null, null)).not.toThrow();
  });
});
