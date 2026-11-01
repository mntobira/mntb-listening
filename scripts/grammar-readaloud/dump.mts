import { egV3Chapters } from '../../src/data/egV3Problems';
const out = egV3Chapters.map(c => ({ chapter: c.chapter, title: c.title, sets: c.problems.map(p => ({ id: p.id, category: p.category, tracks: p.audioTracks.map(t => ({ subId: t.subId, label: t.label, hint: t.hint, script: t.script, translation: t.translation, key: t.keyPhrases })) })) }));
console.log(JSON.stringify(out));
