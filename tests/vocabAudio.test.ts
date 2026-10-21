import { describe, expect, it, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { vocabAudioUrl, loadVocabAudioIndex, playVocabAudio, hasVocabAudio, __resetVocabAudio } from '../src/utils/vocabAudio';

class FakeAudio {
  static last: FakeAudio | null = null;
  static mode: 'ok' | 'reject' | 'error' = 'ok';
  src: string; preload = ''; onended: null | (() => void) = null; onerror: null | (() => void) = null;
  constructor(src: string) { this.src = src; FakeAudio.last = this; }
  play() {
    if (FakeAudio.mode === 'reject') return Promise.reject(new Error('NotAllowedError'));
    if (FakeAudio.mode === 'error') setTimeout(() => this.onerror?.(), 0);
    return Promise.resolve();
  }
  pause() {} removeAttribute() {} load() {}
}

describe('英単語の録音', () => {
  beforeEach(() => { __resetVocabAudio(); FakeAudio.mode = 'ok'; (globalThis as { Audio?: unknown }).Audio = FakeAudio; });
  it('語ID から音声の場所が決まり、版が付く（録り直しで古い音が残らない）', () => {
    expect(vocabAudioUrl('ev:lv1:1')).toBe('/audio/vocab/lv1/1.mp3');
    expect(vocabAudioUrl('ei:ilv2:300', 'abc')).toBe('/audio/vocab/ilv2/300.mp3?v=abc');
    expect(vocabAudioUrl('../etc')).toBeNull();
  });
  it('index.json が無ければ録音なし（端末の読み上げに戻る）', async () => {
    const r = await loadVocabAudioIndex((async () => new Response('', { status: 404 })) as typeof fetch);
    expect(r.ids.size).toBe(0);
    expect(playVocabAudio('ev:lv1:1')).toBe(false);
  });
  it('読み込み前のタップは待たずに端末の読み上げ（iPhone で無音にならない）', () => {
    expect(hasVocabAudio('ev:lv1:1')).toBe(false);
    expect(playVocabAudio('ev:lv1:1')).toBe(false);
  });
  it('録音がある語はその場で鳴らす', () => {
    __resetVocabAudio({ rev: 'r1', ids: new Set(['ev:lv1:1']) });
    expect(playVocabAudio('ev:lv1:1')).toBe(true);
    expect(FakeAudio.last?.src).toBe('/audio/vocab/lv1/1.mp3?v=r1');
  });
  it('再生を断られた・ファイルが壊れていたら端末の読み上げに切り替える', async () => {
    __resetVocabAudio({ rev: '', ids: new Set(['ev:lv1:1']) });
    for (const mode of ['reject', 'error'] as const) {
      FakeAudio.mode = mode;
      const fail = vi.fn();
      playVocabAudio('ev:lv1:1', fail);
      await new Promise(r => setTimeout(r, 5));
      expect(fail).toHaveBeenCalledTimes(1);
    }
  });
});

describe('ElevenLabs の原稿', () => {
  const words = JSON.parse(readFileSync('public/data/listeningVocabulary.json', 'utf8')).words as { id: string; word: string }[];
  const manifest = JSON.parse(readFileSync('docs/elevenlabs_vocab/manifest.json', 'utf8')) as Record<string, { ids: string[]; spoken: string[]; words: string[] }>;
  it('全語ぶん・重複なし・1回30語まで', () => {
    const ids = Object.values(manifest).flatMap(m => m.ids);
    expect(ids.length).toBe(words.length);
    expect(new Set(ids)).toEqual(new Set(words.map(w => w.id)));
    for (const m of Object.values(manifest)) expect(m.ids.length).toBeLessThanOrEqual(30);
  });
  it('読めない記号・日本語が残っていない', () => {
    for (const m of Object.values(manifest)) for (const s of m.spoken) {
      expect(s).not.toMatch(/[～〜()（）／/;；…＝\u3040-\u30ff\u4e00-\u9fff]|^—|—$/);
      expect(s.length).toBeGreaterThan(0);
    }
  });
  it('記号の無いふつうの単語は1文字も変えていない', () => {
    for (const m of Object.values(manifest)) m.words.forEach((w, i) => {
      if (!/[～〜…／/()（）;；＝\u3040-\u30ff\u4e00-\u9fff]|\.\.\.|\betc\b|\bS\b|\bSV\b/.test(w)) expect(m.spoken[i]).toBe(w.trim().replace(/\.+$/, ''));
    });
  });
  it('原稿ファイルは manifest と一致する（貼る原稿と切り方がずれない）', () => {
    for (const [name, m] of Object.entries(manifest)) {
      const txt = readFileSync(`docs/elevenlabs_vocab/batches/${name}.txt`, 'utf8').trim().split('\n');
      expect(txt.length).toBe(m.ids.length);
      expect(txt.slice(0, -1).every(l => l.endsWith('<break time="1.2s" />'))).toBe(true);
      expect(txt.at(-1)).not.toContain('<break');
    }
  });
});
