import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { vocabAudioUrl, loadVocabAudioIndex, __resetVocabAudio } from '../src/utils/vocabAudio';

describe('英単語の録音', () => {
  beforeEach(() => __resetVocabAudio());
  it('語ID から音声の場所が決まる', () => {
    expect(vocabAudioUrl('ev:lv1:1')).toBe('/audio/vocab/lv1/1.mp3');
    expect(vocabAudioUrl('ei:ilv2:300')).toBe('/audio/vocab/ilv2/300.mp3');
    expect(vocabAudioUrl('../etc')).toBeNull();
  });
  it('index.json が無ければ録音なし（端末の読み上げに戻る）', async () => {
    const ids = await loadVocabAudioIndex((async () => new Response('', { status: 404 })) as typeof fetch);
    expect(ids.size).toBe(0);
  });
  it('原稿は全語ぶんあり、読めない記号が残っていない', () => {
    const words = JSON.parse(readFileSync('public/data/listeningVocabulary.json', 'utf8')).words as { id: string }[];
    const manifest = JSON.parse(readFileSync('docs/elevenlabs_vocab/manifest.json', 'utf8')) as Record<string, { ids: string[]; spoken: string[] }>;
    const ids = Object.values(manifest).flatMap(m => m.ids);
    expect(new Set(ids)).toEqual(new Set(words.map(w => w.id)));
    for (const m of Object.values(manifest)) {
      expect(m.ids.length).toBeLessThanOrEqual(50);
      for (const s of m.spoken) expect(s).not.toMatch(/[～〜()（）／/人]|^…|…$/);
    }
  });
});
