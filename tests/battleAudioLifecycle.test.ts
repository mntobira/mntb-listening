import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BattleAudioEngine } from '../src/battle/audio/battleAudio';
import { DEFAULT_BATTLE_AUDIO } from '../src/battle/core/audioSettings';
import { resetSharedAudioContextForTest } from '../src/battle/audio/sharedAudioContext';

vi.mock('../src/battle/audio/sfxSamples', () => ({ preloadSamples: vi.fn(), playSample: () => false }));

const contexts: MockContext[] = [];
class MockContext {
  state = 'running'; currentTime = 0; destination = {};
  sources: any[] = [];
  resume = vi.fn(async () => { this.state = 'running'; });
  decodeAudioData = vi.fn(async () => ({ duration: 90 }));
  constructor() { contexts.push(this); }
  createGain() {
    return { gain: { value: 1, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), cancelScheduledValues: vi.fn() }, connect: vi.fn() };
  }
  createBufferSource() {
    const src = { loop: false, loopStart: 0, loopEnd: 0, buffer: null, connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
    this.sources.push(src); return src;
  }
}
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

beforeEach(() => {
  contexts.length = 0;
  resetSharedAudioContextForTest();
  vi.stubGlobal('window', { AudioContext: MockContext, setTimeout, clearTimeout });
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) })));
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('screen-owned battle BGM lifecycle', () => {
  it('does not stop matching music when outgoing cleanup precedes result/review mounting', async () => {
    const e = new BattleAudioEngine(), old = Symbol(), next = Symbol();
    e.setBgmOwner(old, 'matching'); await flush();
    const src = contexts[0].sources[0];
    e.releaseBgmOwner(old); e.setBgmOwner(next, 'matching'); await flush();
    expect(src.stop).not.toHaveBeenCalled(); expect(contexts[0].sources).toHaveLength(1);
  });
  it('survives StrictMode setup-cleanup-setup and stops after the last screen leaves', async () => {
    const e = new BattleAudioEngine(), owner = Symbol();
    e.setBgmOwner(owner, 'matching'); e.releaseBgmOwner(owner); e.setBgmOwner(owner, 'matching');
    await flush(); expect(contexts[0].sources).toHaveLength(1);
    e.releaseBgmOwner(owner); await flush(); expect(contexts[0].sources[0].stop).toHaveBeenCalledTimes(1);
  });
  it('keeps the same looping source through normal, closing and final', async () => {
    const e = new BattleAudioEngine(), owner = Symbol();
    e.setBgmOwner(owner, 'normal'); await flush();
    e.setBgmOwner(owner, 'closing'); e.setBgmOwner(owner, 'final'); await flush();
    expect(contexts[0].sources).toHaveLength(1);
    expect(contexts[0].sources[0].stop).not.toHaveBeenCalled();
    expect(contexts[0].sources[0]).toMatchObject({ loop: true, loopStart: 7, loopEnd: 67.5 });
  });
  it('does not discard slow decoding when battle phases change', async () => {
    let resolve!: (buffer: any) => void;
    const e = new BattleAudioEngine(), owner = Symbol();
    e.unlock(); contexts[0].decodeAudioData.mockImplementation(() => new Promise(r => { resolve = r; }));
    await flush(); e.setBgmOwner(owner, 'normal'); e.setBgmOwner(owner, 'closing'); e.setBgmOwner(owner, 'final');
    resolve({ duration: 70 }); await flush();
    expect(contexts[0].sources).toHaveLength(1); expect(contexts[0].sources[0].start).toHaveBeenCalledOnce();
  });
  it('ignores stale decode after leaving the battle', async () => {
    let resolve!: (buffer: any) => void;
    const e = new BattleAudioEngine(), owner = Symbol();
    e.unlock(); contexts[0].decodeAudioData.mockImplementation(() => new Promise(r => { resolve = r; }));
    await flush(); e.setBgmOwner(owner, 'normal'); e.releaseBgmOwner(owner); await flush();
    resolve({ duration: 70 }); await flush(); expect(contexts[0].sources).toHaveLength(0);
  });
  it('BGM OFF/ON restores the screen request rather than losing it', async () => {
    const e = new BattleAudioEngine(), owner = Symbol();
    e.setBgmOwner(owner, 'matching'); await flush();
    e.setSettings({ ...DEFAULT_BATTLE_AUDIO, bgm: false }); await flush();
    expect(contexts[0].sources[0].stop).toHaveBeenCalledOnce();
    e.setSettings({ ...DEFAULT_BATTLE_AUDIO, bgm: true }); await flush();
    expect(contexts[0].sources).toHaveLength(2);
  });
  it('listening silence overrides lobby music; releasing lobby does not remove silence', async () => {
    const e = new BattleAudioEngine(), lobby = Symbol(), listening = Symbol();
    e.setBgmOwner(lobby, 'matching', 0); await flush();
    e.setBgmOwner(listening, null, 10); e.releaseBgmOwner(lobby); await flush();
    expect(contexts[0].sources).toHaveLength(1); expect(contexts[0].sources[0].stop).toHaveBeenCalledOnce();
  });
  it.each(['suspended', 'interrupted'])('resumes a %s context without restarting its source', async state => {
    const e = new BattleAudioEngine(), owner = Symbol();
    e.setBgmOwner(owner, 'normal'); await flush(); contexts[0].state = state;
    e.unlock(); await flush(); expect(contexts[0].resume).toHaveBeenCalled(); expect(contexts[0].sources).toHaveLength(1);
  });
  it('recreates a closed context for an unchanged track, including direct replay', async () => {
    const e = new BattleAudioEngine(), owner = Symbol();
    e.setBgmOwner(owner, 'normal'); await flush(); contexts[0].state = 'closed';
    e.setBgmOwner(owner, 'normal'); await flush();
    expect(contexts).toHaveLength(2); expect(contexts[1].sources).toHaveLength(1);
  });
});
