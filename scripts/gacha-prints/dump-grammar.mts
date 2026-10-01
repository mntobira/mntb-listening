import { writeFileSync, readdirSync } from 'node:fs';
const captured: any[] = [];
(globalThis as any).__egCapture = (meta: any, items: any) => captured.push({ meta, items });
const dir = new URL('.', import.meta.url);
for (const f of readdirSync(dir).filter(f => /^egProblems.*\.ts$/.test(f)).sort()) await import(new URL(f, dir).href);
captured.sort((a, b) => a.meta.chapterId.localeCompare(b.meta.chapterId, 'en', { numeric: true }) || a.meta.setNo - b.meta.setNo);
writeFileSync(new URL('../grammar-raw.json', import.meta.url), JSON.stringify(captured, null, 1));
console.log(captured.length, captured.reduce((s: number, c: any) => s + c.items.length, 0));
