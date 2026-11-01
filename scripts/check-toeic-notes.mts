/**
 * TOEIC Part 5 の追加解説（着眼点・ポイント・TOEICでのコツ）が、
 * 英文法の解説やほかの文章を写していないかを確かめる。
 *
 * 文を語に分け、5語続けて同じ並びがあれば「一致」として出す。
 *   語の分け方: 英語は単語。日本語は Intl.Segmenter の語で、漢字だけの語が続くときはつなげて1語にする
 *   （空所・目的語・比較級など）。ひらがなだけの語（助詞・助動詞）と記号は数えない。
 *   比べる相手: 英文法 1163 問の解説（cm・one・th）／src 内のほかの日本語の文字列
 *   （TOEIC の問題データはほかの問題の分だけ。同じ問題の「正解の理由」などとの一致は、解説どうしをそろえるため数えない）／
 *   ほかの問題の追加解説（これは数を出すだけで失敗にはしない。「空所の前の〜を見る」など、役割ごとに言い回しを
 *   そろえているため）。
 *   英語だけの決まった形（either A or B、look forward to など）は文章の写しではないので、
 *   日本語の語が2つ以上入る並びだけを一致として数える。
 * 2026-11-01: Part 6 の空所（toeicPart6RoundNN.ts の h・r・tip）も同じように調べる。
 *   Part 6 の問題データ（本文・和訳・正解の理由・誤答の理由・重要語句）は、Part 5 と同じく「ほかの問題の分」だけと比べる。
 * 使い方: npx tsx scripts/check-toeic-notes.mts   （一致があれば終了コード 1）
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { EG_V3_ITEMS } from '../src/data/egV3Items.generated';
import { TOEIC_P5_NOTES } from '../src/data/toeic/toeicPart5Notes';
import { TOEIC_P5_ROUNDS } from '../src/data/toeic/toeicPart5Rounds';
import { TOEIC_P6_ROUNDS } from '../src/data/toeic/toeicPart6Rounds';

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
    if (/toeicPart5Notes|toeicPart5Round\d+|toeicPart6Round\d+|egV3Items\.generated/.test(p)) continue;
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
    // 本文・和訳は同じ文書の4問で共有するので、4問とも「自分の問題」として扱う
    const texts = [b.why, b.c, ...b.w.map((x) => x[1]), ...(b.kw || []).map((x) => `${x[0]} ${x[1]}`), ...docTexts];
    for (const t of texts) for (const g of grams(t || '')) {
      if (!itemText.has(g)) itemText.set(g, new Set());
      itemText.get(g)!.add(id);
    }
  });
}));

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
  // 同じ文書のほかの空所も、本文を共有するので自分の問題として扱う
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

console.log(`[check-toeic-notes] 調べた文 ${checked} 件／英文法の5語並び ${grammar.size}／ほかの文字列の5語並び ${other.size}`);
console.log(`[check-toeic-notes] 5語連続の一致 ${hits.length} 件`);
for (const h of hits) console.log('  ' + h);
console.log(`[check-toeic-notes] 参考: 追加解説どうしの5語連続の一致 ${internal.length} 件（失敗にはしない）`);
if (process.argv.includes('--internal')) for (const h of internal) console.log('  ' + h);
process.exit(hits.length ? 1 : 0);
