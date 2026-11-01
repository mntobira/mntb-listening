/**
 * 英文法：音声に合わせた解説表示の下準備（2026-10-31 E9）
 *   ・名簿が空のあいだは、どの問題にも audioUrl を付けない（音声合成のまま・404 を出さない）
 *   ・名簿に入れた ID だけ /grammar_audio/<ID>.mp3 になり、時刻データの URL もリスニングと同じ規則で決まる
 *   ・dump_tracks.ts が英文法の音源も時刻合わせの対象に入れる
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { GRAMMAR_AUDIO_IDS, grammarAudioUrl } from '../src/data/grammarAudioManifest';
import { egV3Chapters } from '../src/data/egV3Problems';
import { readAlongUrl } from '../src/features/readAlong/readAlong';

describe('英文法の音源名簿', () => {
  it('名簿に無い問題は audioUrl なし（音声合成）', () => {
    expect(grammarAudioUrl('q_eg6_1_set1_1')).toBe(GRAMMAR_AUDIO_IDS.has('q_eg6_1_set1_1') ? '/grammar_audio/q_eg6_1_set1_1.mp3' : undefined);
    const withUrl = egV3Chapters.flatMap(c => c.problems.flatMap(p => p.audioTracks)).filter(t => t.audioUrl);
    expect(withUrl.map(t => t.subId).sort()).toEqual([...GRAMMAR_AUDIO_IDS].sort());
  });
  it('名簿の ID はすべて実在する小問', () => {
    const ids = new Set(egV3Chapters.flatMap(c => c.problems.flatMap(p => p.audioTracks.map(t => t.subId))));
    expect([...GRAMMAR_AUDIO_IDS].filter(id => !ids.has(id))).toEqual([]);
  });
  it('音源の URL から、リスニングと同じ規則で時刻データの URL が決まる', () => {
    expect(readAlongUrl('/grammar_audio/q_eg6_1_set1_1.mp3')).toBe('/read_along/grammar_audio/q_eg6_1_set1_1.json');
  });
  it('dump_tracks.ts が英文法の音源も拾う', () => {
    const src = readFileSync('scripts/readalong/dump_tracks.ts', 'utf8');
    expect(src).toContain('egV3Chapters');
  });
});
