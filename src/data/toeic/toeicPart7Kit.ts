/**
 * ===================================================================
 * TOEIC® L&R Part 7（読解）　1セット＝文書1〜3つ＋設問 の型と組み立て道具（2026-11-02）
 * ===================================================================
 *
 * ■ 位置づけ
 *   Part 5・Part 6 と同じ「手書きの問題を、決まった場所に並べるだけ」の道具。文書・設問・解説はすべて手で書く。
 *   教材の写真は形の分析（文書の種類・設問の種類・1セットの設問数）にだけ使い、英文・選択肢・解説は写さない。
 *
 * ■ アプリでの1回（本番の54問は量が多いので、本番の形を保ったまま約半分にした）
 *   ・1つの文書のセット 5つ（設問 2・2・3・3・4）
 *   ・2文書の組 1つ（設問5）／3文書の組 1つ（設問5）
 *   ＝ 7セット・24問。1ページ＝1セット（文書＋その設問）
 *
 * ■ 設問の種類（k）
 *   目的・主題／詳細／NOT問題／推測／同義語／文挿入／意図（チャットの発言）／複数文書（2つ以上の文書を合わせて答える）
 *
 * ■ 書き方の決まり
 *   ・文挿入の位置は、段落の中に [[1]]〜[[4]]（画面では —[1]— のように出す）。正解 c は '[1]'〜'[4]'
 *   ・e（根拠）は文書の英文をそのまま引用（1〜3か所）。解説の「根拠」に出し、手がかりのマーカーを引く
 *   ・段落ごとに和訳（tr）。表（table）の和訳は要らない
 *   ・英語は米国式表記。社名・人名・地名はすべて架空
 *
 * ※ TOEIC is a registered trademark of ETS. This product is not endorsed or approved by ETS.
 */
import type { SubQuestion } from '../../types/curriculum';
import { answerPositions, TOEIC_MARKS, type ToeicLevel, type ToeicScene } from './toeicPart5Kit';
import type { ToeicCue } from './toeicPart5NoteTypes';

export type ToeicP7Skill = '目的・主題' | '詳細' | 'NOT問題' | '推測' | '同義語' | '文挿入' | '意図' | '複数文書';

export type ToeicP7Genre =
  | 'Eメール' | '手紙' | '社内連絡' | 'お知らせ' | '広告' | '記事' | 'ウェブページ' | 'チャット'
  | 'テキストメッセージ' | 'フォーム' | '請求書・注文書' | 'レビュー' | '求人' | '案内・説明書' | 'クーポン' | '予定表';

/** 文書1つ */
export interface ToeicP7Doc {
  genre: ToeicP7Genre;
  /** 見出し（記事の題名・ページ名など。英語） */
  title?: string;
  /** 見出しの行（To / From / Date / Subject など） */
  head?: [string, string][];
  /** 段落。チャットは1行＝1発言で「Name (10:55 A.M.): 本文」 */
  p: string[];
  /** 段落ごとの和訳。p と同じ数 */
  tr: string[];
  /** 表（1行目は見出し）。注文書・予定表など */
  table?: string[][];
  /** チャット・テキストメッセージ（吹き出しで出す） */
  chat?: boolean;
}

/** 設問1つ */
export interface ToeicP7Q {
  k: ToeicP7Skill;
  /** 小分類（解説の見出し） */
  t: string;
  d: ToeicLevel;
  /** 設問文（英語） */
  q: string;
  /** 設問文の和訳 */
  qtr: string;
  /** 正解（文挿入は '[1]'〜'[4]'） */
  c: string;
  /** 誤答3つと理由 */
  w: [[string, string], [string, string], [string, string]];
  /** 正解の理由（根拠がどこかを書く） */
  why: string;
  /** 根拠（文書の英文をそのまま1〜3か所） */
  e: string[];
  /** 根拠の和訳 */
  etr: string;
  kw: [string, string][];
  /** 着眼点・ポイント・TOEICでのコツ（Part 5・6 と同じ） */
  h: string;
  r: string;
  tip: string;
  /** 手がかり（根拠の中の語句と、正解の理由の中で対応する語句） */
  cues?: ToeicCue[];
}

export type ToeicP7Kind = 'single' | 'double' | 'triple';

export interface ToeicP7Set {
  kind: ToeicP7Kind;
  sc: ToeicScene;
  docs: ToeicP7Doc[];
  q: ToeicP7Q[];
}

export const TOEIC_P7_CHAPTER_ID = 'tp7_1';
export const TOEIC_P7_SECONDS_PER_QUESTION = 55;
const DOCS_OF: Record<ToeicP7Kind, number> = { single: 1, double: 2, triple: 3 };
export const TOEIC_P7_KIND_LABEL: Record<ToeicP7Kind, string> = { single: '1つの文書', double: '2つの文書', triple: '3つの文書' };
export const INSERT_MARKS = ['[1]', '[2]', '[3]', '[4]'] as const;

const MARKER = /\[\[(\d)\]\]/g;

/* ───────── 本文の扱い ───────── */

/** 段落を「ふつうの文字」と「文挿入の位置（1〜4）」に分ける */
export function splitP7Paragraph(paragraph: string): { text?: string; mark?: number }[] {
  const out: { text?: string; mark?: number }[] = [];
  let pos = 0;
  for (const m of paragraph.matchAll(MARKER)) {
    const at = m.index ?? 0;
    if (at > pos) out.push({ text: paragraph.slice(pos, at) });
    out.push({ mark: Number(m[1]) });
    pos = at + m[0].length;
  }
  if (pos < paragraph.length) out.push({ text: paragraph.slice(pos) });
  return out;
}

/** 文挿入の印を除いて空白をそろえた文 */
export function plainP7(text: string): string {
  return text.replace(MARKER, ' ').replace(/\s+/g, ' ').trim();
}

const CHAT_LINE = /^(.+?) \((\d{1,2}:\d{2} [AP]\.M\.)\): ([\s\S]*)$/;
/** チャットの1行 → 名前・時刻・本文（形が違えば本文だけ） */
export function parseChatLine(line: string): { name: string; time: string; text: string } {
  const m = line.match(CHAT_LINE);
  return m ? { name: m[1], time: m[2], text: m[3] } : { name: '', time: '', text: line };
}

/** 文書の中の文字（見出し・見出しの行・本文・表）をつないだもの。根拠の照合に使う */
export function docText(d: ToeicP7Doc): string {
  return plainP7([d.title || '', ...(d.head || []).map(([a, b]) => `${a}: ${b}`), ...d.p, ...(d.table || []).map((r) => r.join(' '))].join(' \n '));
}

/** 本文の語数（見出しの行・表は数えない） */
export function p7DocWords(d: ToeicP7Doc): number {
  return plainP7(d.p.map((x) => parseChatLine(x).text).join(' ')).split(/\s+/).filter(Boolean).length;
}

/* ───────── 形の検査 ───────── */

export function validateP7Set(set: ToeicP7Set): string[] {
  const issues: string[] = [];
  const need = DOCS_OF[set.kind];
  if (set.docs.length !== need) issues.push(`文書が ${set.docs.length} つ（${TOEIC_P7_KIND_LABEL[set.kind]}）`);
  const [qmin, qmax] = set.kind === 'single' ? [2, 4] : [5, 5];
  if (set.q.length < qmin || set.q.length > qmax) issues.push(`設問が ${set.q.length} 問（${qmin}〜${qmax}問）`);
  set.docs.forEach((d, i) => {
    if (d.tr.length !== d.p.length) issues.push(`文書${i + 1}：段落 ${d.p.length} と和訳 ${d.tr.length} の数が合わない`);
    if (d.tr.some((t) => !t.trim())) issues.push(`文書${i + 1}：空の和訳がある`);
    const words = p7DocWords(d);
    const [lo, hi] = set.kind === 'single' ? [50, 230] : [25, 200];
    if (words < lo || words > hi) issues.push(`文書${i + 1}：本文が ${words} 語（目安 ${lo}〜${hi} 語）`);
    if (d.chat && d.p.some((x) => !CHAT_LINE.test(x))) issues.push(`文書${i + 1}：チャットの行が「Name (10:55 A.M.): 本文」の形になっていない`);
  });
  const marks = set.docs.flatMap((d) => d.p.join('\n').match(MARKER) ?? []);
  const inserts = set.q.filter((q) => q.k === '文挿入');
  if (inserts.length > 1) issues.push('文挿入が2問以上ある');
  if (inserts.length === 1 && marks.join('') !== '[[1]][[2]][[3]][[4]]') issues.push(`文挿入の印が [[1]]〜[[4]] の順に1回ずつになっていない（${marks.join(' ') || 'なし'}）`);
  if (inserts.length === 0 && marks.length) issues.push('文挿入の設問が無いのに印がある');
  const all = set.docs.map(docText).join(' \n ');
  if (set.kind !== 'single' && !set.q.some((q) => q.k === '複数文書')) issues.push('複数の文書を合わせて答える設問が無い');
  set.q.forEach((q, i) => {
    const tag = `設問${i + 1}`;
    const choices = [q.c, ...q.w.map(([t]) => t)];
    if (new Set(choices.map((t) => t.trim().toLowerCase())).size !== 4) issues.push(`${tag}：選択肢4つが互いに違っていない`);
    if (choices.some((t) => !t.trim() || t.trim() !== t)) issues.push(`${tag}：選択肢が空か、前後に空白がある`);
    if (q.why.trim().length <= 10) issues.push(`${tag}：正解の理由が短すぎる`);
    if (q.w.some(([, r]) => r.trim().length <= 5)) issues.push(`${tag}：誤答の理由が短すぎる`);
    if (!q.e.length) issues.push(`${tag}：根拠が無い`);
    for (const e of q.e) if (!all.includes(plainP7(e))) issues.push(`${tag}：根拠が文書に無い「${e.slice(0, 40)}」`);
    if (q.k === '複数文書' && set.kind === 'single') issues.push(`${tag}：1つの文書なのに複数文書の設問`);
    if (q.k === '複数文書') {
      const hit = set.docs.filter((d) => q.e.some((e) => docText(d).includes(plainP7(e)))).length;
      if (hit < 2) issues.push(`${tag}：複数文書の設問なのに根拠が文書1つだけ`);
    }
    if (q.k === '文挿入') {
      if (!(INSERT_MARKS as readonly string[]).includes(q.c) || !q.w.every(([t]) => (INSERT_MARKS as readonly string[]).includes(t))) issues.push(`${tag}：文挿入の選択肢が [1]〜[4] になっていない`);
      const quoted = q.q.match(/"([^"]+)"/)?.[1] || '';
      if (!/[.?!]$/.test(quoted)) issues.push(`${tag}：入れる文を設問文の中に "…" で書く（文末は . ? !）`);
      else if (all.toLowerCase().includes(quoted.toLowerCase())) issues.push(`${tag}：入れる文が本文にすでにある`);
    }
  });
  return issues;
}

export function validateP7Round(sets: readonly ToeicP7Set[]): string[] {
  const issues: string[] = [];
  const singles = sets.filter((s) => s.kind === 'single').length;
  const doubles = sets.filter((s) => s.kind === 'double').length;
  const triples = sets.filter((s) => s.kind === 'triple').length;
  if (singles !== 5 || doubles !== 1 || triples !== 1) issues.push(`セットの数：1文書 ${singles}・2文書 ${doubles}・3文書 ${triples}（5・1・1）`);
  sets.forEach((s, i) => validateP7Set(s).forEach((m) => issues.push(`セット${i + 1}：${m}`)));
  const qs = sets.flatMap((s) => s.q);
  if (qs.length < 22 || qs.length > 26) issues.push(`設問が ${qs.length} 問（22〜26問）`);
  for (const k of ['文挿入', '同義語', '意図', 'NOT問題'] as ToeicP7Skill[]) if (!qs.some((q) => q.k === k)) issues.push(`「${k}」の設問が無い`);
  const genres = new Set(sets.flatMap((s) => s.docs.map((d) => d.genre)));
  if (genres.size < 5) issues.push(`文書の種類が ${genres.size} 種類だけ（5種類以上）`);
  return issues;
}

/* ───────── 組み立て ───────── */

export interface ToeicP7Track {
  subId: string;
  subIds: string[];
  label: string;
  hint: string;
  script: string;
  translation: string;
  keyPhrases: { phrase: string; meaning: string }[];
}

export interface ToeicP7Problem {
  id: string;
  category: string;
  text: string;
  subQuestions: SubQuestion[];
  explanation: string;
  surroundingKnowledge: string[];
  deepDiveTopics: string[];
  audioTracks: ToeicP7Track[];
  readCount: 1;
  timeLimitSec: number;
}

/** 選択肢を並べる：正解を pos に、誤答は書いた順に残りへ（文挿入は [1]〜[4] の順のまま） */
export function placeP7Choices(q: ToeicP7Q, pos: number): { texts: string[]; reasons: string[] } {
  if (q.k === '文挿入') {
    const texts = [...INSERT_MARKS];
    const reasons = texts.map((t) => (t === q.c ? '' : q.w.find(([m]) => m === t)?.[1] ?? ''));
    return { texts, reasons };
  }
  const texts: string[] = [];
  const reasons: string[] = [];
  let wi = 0;
  for (let i = 0; i < 4; i += 1) {
    if (i === pos) { texts.push(q.c); reasons.push(''); } else { texts.push(q.w[wi][0]); reasons.push(q.w[wi][1]); wi += 1; }
  }
  return { texts, reasons };
}

/** Part 5・6 と正解位置の並びがそろわないよう、回番号をずらす。文挿入は印の番号がそのまま位置 */
export function p7AnswerPositions(round: number, qs: readonly Pick<ToeicP7Q, 'k' | 'c'>[]): number[] {
  const base = answerPositions(round + 2000, qs.length);
  return qs.map((q, i) => (q.k === '文挿入' ? Math.max(0, (INSERT_MARKS as readonly string[]).indexOf(q.c)) : base[i]));
}

/** 回の中で、各セットの最初の設問の番号（0から） */
export function p7Offsets(sets: readonly Pick<ToeicP7Set, 'q'>[]): number[] {
  const out: number[] = [];
  let n = 0;
  for (const s of sets) { out.push(n); n += s.q.length; }
  return out;
}

export function p7RoundBreakdown(sets: readonly ToeicP7Set[]): string {
  const qs = sets.flatMap((s) => s.q);
  return `1文書${sets.filter((s) => s.kind === 'single').length}・複数文書${sets.filter((s) => s.kind !== 'single').length}・${qs.length}問`;
}

const SEP = '────────────────────';

function docAsText(d: ToeicP7Doc): string {
  const head = (d.head || []).map(([a, b]) => `${a}: ${b}`).join('\n');
  const body = d.p.map((x) => x.replace(MARKER, (_, n: string) => ` —[${n}]— `).replace(/\s+/g, ' ').trim()).join('\n\n');
  const table = (d.table || []).map((r) => r.join(' | ')).join('\n');
  return [d.title || '', head, body, table].filter(Boolean).join('\n');
}

export function buildToeicP7Round(meta: { round: number }, sets: readonly ToeicP7Set[]): ToeicP7Problem {
  const no = String(meta.round).padStart(2, '0');
  const base = `q_${TOEIC_P7_CHAPTER_ID}_r${no}`;
  const qs = sets.flatMap((s) => s.q);
  const offsets = p7Offsets(sets);
  const subIdOf = (i: number) => `${base}_${i + 1}`;
  const positions = p7AnswerPositions(meta.round, qs);
  const placed = qs.map((q, i) => placeP7Choices(q, positions[i]));
  const setOf = (i: number) => sets.findIndex((_, si) => i >= offsets[si] && i < offsets[si] + sets[si].q.length);

  const head = `第${meta.round}回　TOEIC Part 7 読解（${sets.length}セット・${qs.length}問・4択）\n\n` +
    '文書を読み、設問の答えとして最も適切なものを、(A)〜(D)のうちから1つずつ選びなさい。';
  const blocks = sets.map((s, si) => {
    const from = offsets[si] + 1;
    const docs = s.docs.map((d, di) => `【文書${di + 1}：${d.genre}】\n${docAsText(d)}`).join('\n\n');
    return `${SEP}\nセット${si + 1}（${TOEIC_P7_KIND_LABEL[s.kind]}）　問${from}〜${from + s.q.length - 1}\n${docs}`;
  });

  const subQuestions: SubQuestion[] = qs.map((q, i) => ({
    id: subIdOf(i),
    label: `問${i + 1}`,
    type: 'multiple_choice',
    options: [...TOEIC_MARKS],
    optionTexts: placed[i].texts,
    correctAnswer: TOEIC_MARKS[positions[i]],
    skill: q.k,
    scene: sets[setOf(i)].sc,
    detailedExplanation: { theme: `${q.k}（${q.t}）`, type: q.k, difficulty: q.d, steps: [] },
  }));

  const audioTracks: ToeicP7Track[] = sets.map((s, si) => {
    const ids = s.q.map((_, j) => subIdOf(offsets[si] + j));
    return {
      subId: ids[0],
      subIds: ids,
      label: `セット${si + 1}`,
      hint: `${TOEIC_P7_KIND_LABEL[s.kind]}　問${offsets[si] + 1}〜${offsets[si] + s.q.length}`,
      script: s.docs.map(docAsText).join('\n\n'),
      translation: s.docs.map((d) => d.tr.join('\n')).join('\n\n'),
      keyPhrases: s.q.flatMap((q) => q.kw.map(([phrase, meaning]) => ({ phrase, meaning }))),
    };
  });

  const bodies = qs.map((q, i) => {
    const lines = placed[i].texts.map((t, j) => (j === positions[i] ? `${TOEIC_MARKS[j]} ${t}　○ 正解` : `${TOEIC_MARKS[j]} ${t}　× ${placed[i].reasons[j]}`));
    return `問${i + 1}　${q.q}\n正解は ${TOEIC_MARKS[positions[i]]}\n【ポイント】${q.why}\n【選択肢】\n${lines.join('\n')}`;
  });

  return {
    id: base,
    category: `第${meta.round}回 ${p7RoundBreakdown(sets)}`,
    readCount: 1,
    timeLimitSec: qs.length * TOEIC_P7_SECONDS_PER_QUESTION,
    audioTracks,
    text: `${head}\n\n${blocks.join('\n\n')}`,
    subQuestions,
    explanation: `第${meta.round}回の解説。根拠の場所と、選択肢ごとの理由を確認しよう。\n\n${bodies.join('\n\n')}`,
    surroundingKnowledge: [],
    deepDiveTopics: [],
  };
}
