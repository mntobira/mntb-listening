import { getAllListeningChapters } from '../../src/data/englishListeningData';
import { egV3Chapters } from '../../src/data/egV3Problems';
const out: any[] = []; const seen = new Set<string>();
for (const ch of getAllListeningChapters() as any[]) for (const pb of ch.practiceProblems ?? ch.problems ?? []) for (const t of pb.audioTracks ?? []) {
  if (!t.audioUrl || seen.has(t.audioUrl)) continue; seen.add(t.audioUrl);
  out.push({ audioUrl: t.audioUrl, script: t.script, turns: t.turns ?? null });
}
// E9（2026-10-31）：英文法も、音源が届いた問題（grammarAudioManifest の名簿）だけ時刻合わせの対象にする
for (const ch of egV3Chapters) for (const pb of ch.problems) for (const t of pb.audioTracks) {
  if (!t.audioUrl || seen.has(t.audioUrl)) continue; seen.add(t.audioUrl);
  out.push({ audioUrl: t.audioUrl, script: t.script, turns: null });
}
console.log(JSON.stringify(out));
