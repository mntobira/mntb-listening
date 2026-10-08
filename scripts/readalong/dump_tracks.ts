import { getAllListeningChapters } from '../../src/data/englishListeningData';
const out: any[] = []; const seen = new Set<string>();
for (const ch of getAllListeningChapters() as any[]) for (const pb of ch.practiceProblems ?? ch.problems ?? []) for (const t of pb.audioTracks ?? []) {
  if (!t.audioUrl || seen.has(t.audioUrl)) continue; seen.add(t.audioUrl);
  out.push({ audioUrl: t.audioUrl, script: t.script, turns: t.turns ?? null });
}
console.log(JSON.stringify(out));
