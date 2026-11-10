import { afterEach, describe, expect, it, vi } from 'vitest';

const mockAudio = vi.hoisted(() => ({
  calls: [] as string[],
  context: { decodeAudioData: vi.fn(async () => ({})) },
}));

vi.mock('../src/battle/audio/sharedAudioContext', () => ({
  sharedAudioContext: () => mockAudio.context,
  sharedAudioContextResumed: () => {
    mockAudio.calls.push('resume');
    return mockAudio.context;
  },
}));

import { preloadLaunchSfx } from '../src/battle/audio/launchSfx';

afterEach(() => {
  vi.unstubAllGlobals();
  mockAudio.calls.length = 0;
  mockAudio.context.decodeAudioData.mockClear();
});

describe('起動効果音の読み込み', () => {
  it('AudioContextを作成・再開してから3つの音源を読み込む', async () => {
    vi.stubGlobal('fetch', vi.fn(() => {
      mockAudio.calls.push('fetch');
      return Promise.resolve({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(8),
      });
    }));

    await preloadLaunchSfx();

    expect(mockAudio.calls[0]).toBe('resume');
    expect(mockAudio.calls.slice(1)).toEqual(['fetch', 'fetch', 'fetch']);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(mockAudio.context.decodeAudioData).toHaveBeenCalledTimes(3);
  });
});
