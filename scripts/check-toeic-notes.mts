/**
 * TOEIC Part 5 の追加解説（着眼点・ポイント・TOEICでのコツ）が、
 * 英文法の解説やほかの文章を写していないかを確かめる。
 *
 * 2026-11-01: Part 6 の空所も同じように調べる。
 * 2026-11-02: Part 7 の設問も同じように調べる。
 * 2026-11-12: リスニング（Part 2・Part 3・Part 4）も同じように調べる。
 * 使い方: npx tsx scripts/check-toeic-notes.mts   （一致があれば終了コード 1）
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { EG_V3_ITEMS } from '../src/data/egV3Items.generated';
import { TOEIC_P5_NOTES } from '../src/data/toeic/toeicPart5Notes';
import { TOEIC_P5_ROUNDS } from '../src/data/toeic/toeicPart5Rounds';
import { TOEIC_P6_ROUNDS } from '../src/data/toeic/toeicPart6Rounds';
import { TOEIC_P7_ROUNDS } from '../src/data/toeic/toeicPart7Rounds';
import { TOEIC_LISTENING_ROUNDS } from '../src/data/toeic/toeicListeningRounds';

const N = 5;
const seg = new Intl.Segmenter('ja', { granularity: 'word' });
const KANJI = /^[\u4e00-\u9fff々]+$/u;
const KANA_ONLY = /^[\u3040-\u309fー]+$/u;

function words(text: string): string[] {
  const out: string[] = [];
  let prevKanji = false;
  for (const s of seg.segment(text.normalize('NFKC'))) {
    if (!s.isWordLike) { prevKanji = false; continue; }
    const w = s.segment.toLowerCase();
    if (KANA_ONLY.test(w)) { prevKanji = false; continue; }
    if (KANJI.test(w) && prevKanji) out[out.length - 1] += w;
    else out.push(w);
    prevKanji = KANJI.test(w);
  }
  return out;
}
const JA = /[\u3040-\u30ff\u4e00-\u9fff]/u;
function grams(text: string): string[] {
  const w = words(text);
  const out: string[] = [];
  for (let i = 0; i + N <= w.length; i++) {
    const g = w.slice(i, i + N);
    if (g.filter((x) => JA.test(x)).length >= 2) out.push(g.join(' '));
  }
  return out;
}

// 1) 英文法の解説
const grammar = new Map<string, string>();
for (const it of EG_V3_ITEMS) {
  for (const t of [...it.cm, it.one, it.th]) for (const g of grams(t || '')) if (!grammar.has(g)) grammar.set(g, `英文法 第${it.c}章 問${it.n}`);
}

// 2) src 内のほかの日本語の文字列（TOEIC の追加解説そのものと、生成済みの英文法データは除く）
const other = new Map<string, string>();
function walk(dir: string) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!/\.(ts|tsx)$/.test(name)) continue;
    if (/toeicPart5Notes|toeicPart5Round\d+|toeicPart6Round\d+|toeicPart7Round\d+|toeicListeningRounds|egV3Items\.generated/.test(p)) continue;
    const src = readFileSync(p, 'utf8');
    for (const m of src.matchAll(/(['"`])((?:\\.|(?!\1).)*[\u3040-\u30ff\u4e00-\u9fff](?:\\.|(?!\1).)*)\1/g)) {
      for (const g of grams(m[2])) if (!other.has(g)) other.set(g, p.replace(/^.*?src\//, 'src/'));
    }
  }
}
walk(new URL('../src', import.meta.url).pathname);

// TOEIC の問題データ（正解の理由・誤答の理由・重要語句・和訳）。どの問題のものかを持っておく
const itemText = new Map<string, Set<string>>();
TOEIC_P5_ROUNDS.forEach((items, r) => items.forEach((it, i) => {
  const id = `${r + 1}-${i + 1}`;
  const texts = [it.why, it.tr, ...it.w.map((x) => x[1]), ...(it.kw || []).map((x) => `${x[0]} ${x[1]}`)];
  for (const t of texts) for (const g of grams(t || '')) {
    if (!itemText.has(g)) itemText.set(g, new Set());
    itemText.get(g)!.add(id);
  }
}));
TOEIC_P6_ROUNDS.forEach((sets, r) => sets.forEach((set, si) => {
  const docTexts = [...set.p, ...set.tr, set.title || ''];
  set.b.forEach((b, bi) => {
    const id = `p6-${r + 1}-${si * 4 + bi + 1}`;
    const texts = [b.why, b.c, ...b.w.map((x) => x[1]), ...(b.kw || []).map((x) => `${x[0]} ${x[1]}`), ...docTexts];
    for (const t of texts) for (const g of grams(t || '')) {
      if (!itemText.has(g)) itemText.set(g, new Set());
      itemText.get(g)!.add(id);
    }
  });
}));

TOEIC_P7_ROUNDS.forEach((sets, r) => sets.forEach((set, si) => {
  const self = `p7-${r + 1}-${si + 1}`;
  const docTexts = set.docs.flatMap((d) => [d.title || '', ...d.p, ...d.tr, ...(d.head || []).map((x) => x.join(' ')), ...(d.table || []).map((x) => x.join(' '))]);
  const texts = [...docTexts, ...set.q.flatMap((q) => [q.why, q.c, q.q, q.qtr, q.etr, ...q.e, ...q.w.map((x) => x[1]), ...(q.kw || []).map((x) => `${x[0]} ${x[1]}`)])];
  for (const t of texts) for (const g of grams(t || '')) {
    if (!itemText.has(g)) itemText.set(g, new Set());
    itemText.get(g)!.add(self);
  }
}));

TOEIC_LISTENING_ROUNDS.forEach((round, r) => {
  round.p2.forEach((it, i) => {
    const self = `pl-p2-${r + 1}-${i + 1}`;
    const texts = [it.why, it.qtr, it.ctr, ...it.w.flatMap((x) => [x[1], x[2]]), ...it.kw.map((x) => `${x[0]} ${x[1]}`)];
    for (const t of texts) for (const g of grams(t || '')) {
      if (!itemText.has(g)) itemText.set(g, new Set());
      itemText.get(g)!.add(self);
    }
  });
  const p3Self = `pl-p3-${r + 1}`;
  const p3Texts = [
    round.p3.situation,
    ...round.p3.turns.map((t) => t.ja),
    ...round.p3.q.flatMap((q) => [q.why, q.qtr, q.etr, ...q.w.map((x) => x[1]), ...q.kw.map((x) => `${x[0]} ${x[1]}`)]),
  ];
  for (const t of p3Texts) for (const g of grams(t || '')) {
    if (!itemText.has(g)) itemText.set(g, new Set());
    itemText.get(g)!.add(p3Self);
  }
  const p4Self = `pl-p4-${r + 1}`;
  const p4Texts = [
    round.p4.genre,
    ...round.p4.tr,
    ...round.p4.q.flatMap((q) => [q.why, q.qtr, q.etr, ...q.w.map((x) => x[1]), ...q.kw.map((x) => `${x[0]} ${x[1]}`)]),
  ];
  for (const t of p4Texts) for (const g of grams(t || '')) {
    if (!itemText.has(g)) itemText.set(g, new Set());
    itemText.get(g)!.add(p4Self);
  }
});

// 3) 照合
const seenInNotes = new Map<string, string>();
const hits: string[] = [];
const internal: string[] = [];
let checked = 0;
TOEIC_P5_NOTES.forEach((round, r) => round.forEach((note, i) => {
  const id = `第${r + 1}回 問${i + 1}（${TOEIC_P5_ROUNDS[r][i]?.c ?? '?'}）`;
  for (const key of ['h', 'r', 'tip'] as const) {
    const text = note?.[key];
    if (!text) continue;
    checked++;
    const own = new Set<string>();
    for (const g of grams(text)) {
      if (own.has(g)) continue;
      own.add(g);
      if (grammar.has(g)) hits.push(`${id} ${key}: 「${g}」が ${grammar.get(g)} の解説と一致`);
      else if (other.has(g)) hits.push(`${id} ${key}: 「${g}」が ${other.get(g)} と一致`);
      else if (itemText.has(g) && !itemText.get(g)!.has(`${r + 1}-${i + 1}`)) hits.push(`${id} ${key}: 「${g}」が TOEIC 第${[...itemText.get(g)!][0].replace('-', '回 問')} の問題データと一致`);
      else if (seenInNotes.has(g) && !seenInNotes.get(g)!.startsWith(id)) internal.push(`${id} ${key}: 「${g}」が ${seenInNotes.get(g)} と一致`);
      if (!seenInNotes.has(g)) seenInNotes.set(g, `${id} ${key}`);
    }
  }
}));

TOEIC_P6_ROUNDS.forEach((sets, r) => sets.forEach((set, si) => set.b.forEach((b, bi) => {
  const no = si * 4 + bi + 1;
  const id = `Part 6 第${r + 1}回 問${no}（${b.c.slice(0, 24)}）`;
  const self = `p6-${r + 1}-${no}`;
  const sameDoc = new Set([1, 2, 3, 4].map((k) => `p6-${r + 1}-${si * 4 + k}`));
  for (const key of ['h', 'r', 'tip'] as const) {
    const text = b[key];
    if (!text) continue;
    checked++;
    const own = new Set<string>();
    for (const g of grams(text)) {
      if (own.has(g)) continue;
      own.add(g);
      const owners = itemText.get(g);
      if (grammar.has(g)) hits.push(`${id} ${key}: 「${g}」が ${grammar.get(g)} の解説と一致`);
      else if (other.has(g)) hits.push(`${id} ${key}: 「${g}」が ${other.get(g)} と一致`);
      else if (owners && !owners.has(self) && ![...owners].some((o) => sameDoc.has(o))) hits.push(`${id} ${key}: 「${g}」が TOEIC のほかの問題データ（${[...owners][0]}）と一致`);
      else if (seenInNotes.has(g) && !seenInNotes.get(g)!.startsWith(id)) internal.push(`${id} ${key}: 「${g}」が ${seenInNotes.get(g)} と一致`);
      if (!seenInNotes.has(g)) seenInNotes.set(g, `${id} ${key}`);
    }
  }
})));

TOEIC_P7_ROUNDS.forEach((sets, r) => sets.forEach((set, si) => set.q.forEach((q, qi) => {
  const id = `Part 7 第${r + 1}回 セット${si + 1} 設問${qi + 1}`;
  const self = `p7-${r + 1}-${si + 1}`;
  for (const key of ['h', 'r', 'tip'] as const) {
    const text = q[key];
    if (!text) continue;
    checked++;
    const own = new Set<string>();
    for (const g of grams(text)) {
      if (own.has(g)) continue;
      own.add(g);
      const owners = itemText.get(g);
      if (grammar.has(g)) hits.push(`${id} ${key}: 「${g}」が ${grammar.get(g)} の解説と一致`);
      else if (other.has(g)) hits.push(`${id} ${key}: 「${g}」が ${other.get(g)} と一致`);
      else if (owners && !owners.has(self)) hits.push(`${id} ${key}: 「${g}」が TOEIC のほかの問題データ（${[...owners][0]}）と一致`);
      else if (seenInNotes.has(g) && !seenInNotes.get(g)!.startsWith(id)) internal.push(`${id} ${key}: 「${g}」が ${seenInNotes.get(g)} と一致`);
      if (!seenInNotes.has(g)) seenInNotes.set(g, `${id} ${key}`);
    }
  }
})));

TOEIC_LISTENING_ROUNDS.forEach((round, r) => {
  const checkNote = (id: string, self: string, item: { h: string; r: string; tip: string }) => {
    for (const key of ['h', 'r', 'tip'] as const) {
      const text = item[key];
      if (!text) continue;
      checked++;
      const own = new Set<string>();
      for (const g of grams(text)) {
        if (own.has(g)) continue;
        own.add(g);
        const owners = itemText.get(g);
        if (grammar.has(g)) hits.push(`${id} ${key}: 「${g}」が ${grammar.get(g)} の解説と一致`);
        else if (other.has(g)) hits.push(`${id} ${key}: 「${g}」が ${other.get(g)} と一致`);
        else if (owners && !owners.has(self)) hits.push(`${id} ${key}: 「${g}」が TOEIC のほかの問題データ（${[...owners][0]}）と一致`);
        else if (seenInNotes.has(g) && !seenInNotes.get(g)!.startsWith(id)) internal.push(`${id} ${key}: 「${g}」が ${seenInNotes.get(g)} と一致`);
        if (!seenInNotes.has(g)) seenInNotes.set(g, `${id} ${key}`);
      }
    }
  };
  round.p2.forEach((it, i) => checkNote(`Listening 第${r + 1}回 Part2 問${i + 1}`, `pl-p2-${r + 1}-${i + 1}`, it));
  round.p3.q.forEach((q, qi) => checkNote(`Listening 第${r + 1}回 Part3 設問${qi + 1}`, `pl-p3-${r + 1}`, q));
  round.p4.q.forEach((q, qi) => checkNote(`Listening 第${r + 1}回 Part4 設問${qi + 1}`, `pl-p4-${r + 1}`, q));
});

console.log(`[check-toeic-notes] 調べた文 ${checked} 件／英文法の5語並び ${grammar.size}／ほかの文字列の5語並び ${other.size}`);
console.log(`[check-toeic-notes] 5語連続の一致 ${hits.length} 件`);
for (const h of hits) console.log('  ' + h);
console.log(`[check-toeic-notes] 参考: 追加解説どうしの5語連続の一致 ${internal.length} 件（失敗にはしない）`);
if (process.argv.includes('--internal')) for (const h of internal) console.log('  ' + h);
process.exit(hits.length ? 1 : 0);
