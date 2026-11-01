/**
 * ===================================================================
 * TOEIC® L&R Part 6（長文穴埋め）　1セット＝文書1つ＋空所4つ の型と組み立て道具（2026-10-30 準備）
 * ===================================================================
 *
 * ■ 位置づけ
 *   Part 5（toeicPart5Kit.ts）と同じ「手書きの問題を、決まった場所に並べるだけ」の道具。
 *   文書・選択肢・解説はすべて手で書く（自動生成しない）。
 *   ★まだ画面にはつないでいない★（教材の分析 → 問題づくりのあとで、教科の登録とあわせてつなぐ。
 *   手順は docs/TOEIC_DESIGN.md の §9）。
 *
 * ■ 本番の形式
 *   ・文書4つ × 空所4つ ＝ 16問（問題番号 131〜146）。4択 (A)〜(D)
 *   ・空所の種類：文法（品詞・動詞の形・代名詞など）・語彙・つなぎの語句・文挿入
 *   ・文挿入は各文書に1問（文書の流れに合う1文を選ぶ）
 *   ・文書の種類：Eメール・社内連絡・お知らせ・広告・記事・手紙 など
 *
 * ■ アプリでの1回
 *   1回＝本番と同じ文書4つ（16問）。Part 5 のページ式演習と同じく「1ページ＝文書1つ＋その4問」にできる。
 *
 * ■ 文書の書き方の決まり
 *   ・空所は段落の中に [[1]]〜[[4]]（文書の中での番号。回の中の通し番号は組み立て時に振る）
 *   ・段落ごとに和訳（tr）を1つずつ。数をそろえる
 *   ・英語は米国式表記。社名・人名・地名はすべて架空
 *
 * ※ TOEIC is a registered trademark of ETS. This product is not endorsed or approved by ETS.
 */
import type { SubQuestion } from '../../types/curriculum';
import { answerPositions, TOEIC_MARKS, type ToeicLevel, type ToeicScene } from './toeicPart5Kit';
import type { ToeicCue } from './toeicPart5NoteTypes';

/** 空所の分野（結果画面の分野別正答率の単位）。Part 5 と同じ名前は同じ意味 */
export type ToeicP6Skill =
  | '品詞'
  | '動詞の形'
  | '代名詞'
  | '前置詞'
  | '接続詞'
  | '関係詞'
  | '語彙'
  | 'つなぎの語句'
  | '文挿入';

/** 文書の種類（本番でよく出るもの） */
export type ToeicP6Genre =
  | 'Eメール'
  | '社内連絡'
  | 'お知らせ'
  | '広告'
  | '記事'
  | '手紙'
  | 'ウェブページ'
  | '案内・説明書';

/** 空所1つぶんの手書きデータ（Part 5 の1問と同じ書き方） */
export interface ToeicP6Blank {
  /** 分野 */
  k: ToeicP6Skill;
  /** 小分類（例：'時制'／'逆接'／'前の文を受ける'）。解説の見出しに出る */
  t: string;
  /** 難易度 */
  d: ToeicLevel;
  /** 正解の選択肢（文挿入では1文） */
  c: string;
  /** 誤答3つと、それぞれが入らない理由（1行） */
  w: [[string, string], [string, string], [string, string]];
  /** 正解の理由（文書のどこが手がかりかを書く） */
  why: string;
  /** 重要語句（英語, 意味）。無ければ空でよい */
  kw: [string, string][];
  /** 着眼点（どこを見るか）。Part 5 の h と同じ役割 */
  h?: string;
  /** ポイント（文法・語法の決まり） */
  r?: string;
  /** TOEICでのコツ（本番の文書での見分け方） */
  tip?: string;
  /** 手がかり（文脈の中の語句と、正解の理由の中で対応する語句）。書き方は Part 5 と同じ */
  cues?: ToeicCue[];
  /** 解説で見せる文脈に、1つ前の段落も入れる（手がかりが前の段落にあるとき） */
  pp?: boolean;
}

/** 文書1つ（＝1セット・空所4つ）の手書きデータ */
export interface ToeicP6Set {
  /** 文書の種類 */
  genre: ToeicP6Genre;
  /** 文書の見出し（件名・題名。英語。無ければ省略） */
  title?: string;
  /** 場面（Part 5 と同じ分類。出題の偏りチェックに使う） */
  sc: ToeicScene;
  /** 本文の段落。空所は [[1]]〜[[4]] を1回ずつ、この順に */
  p: string[];
  /** 段落ごとの和訳（空所に正解を入れた文の訳）。p と同じ数 */
  tr: string[];
  /** 空所 [[1]]〜[[4]] の中身（この順） */
  b: [ToeicP6Blank, ToeicP6Blank, ToeicP6Blank, ToeicP6Blank];
}

export const TOEIC_P6_CHAPTER_ID = 'tp6_1';
export const TOEIC_P6_SETS_PER_ROUND = 4;
export const TOEIC_P6_BLANKS_PER_SET = 4;
export const TOEIC_P6_QUESTIONS_PER_ROUND = TOEIC_P6_SETS_PER_ROUND * TOEIC_P6_BLANKS_PER_SET;
/** 1回16問の目安時間（1問30秒＝format.ts の targetSecPerQuestion）。超えても止めない */
export const TOEIC_P6_TIME_LIMIT_SEC = TOEIC_P6_QUESTIONS_PER_ROUND * 30;

/** 本文の語数の目安（2026-10-31 教材の分析で直した：写真の文書は約80〜150語。少し幅を持たせる） */
export const TOEIC_P6_WORDS_MIN = 70;
export const TOEIC_P6_WORDS_MAX = 180;

const MARKER = /\[\[(\d+)\]\]/g;

/* ───────── 本文の表示 ───────── */

/** 空所の表示：(回の中の通し番号)______ */
export function blankLabel(no: number): string {
  return `(${no})______`;
}

/** 段落の [[n]] を、回の中の通し番号つきの空所にする（offset＝この文書より前の空所の数） */
export function renderParagraph(paragraph: string, offset: number): string {
  return paragraph.replace(MARKER, (_, n: string) => blankLabel(offset + Number(n)));
}

/** 段落の [[n]] に正解を入れた完成文（文挿入も同じ位置に入る） */
export function fillParagraph(paragraph: string, blanks: readonly Pick<ToeicP6Blank, 'c'>[]): string {
  return paragraph.replace(MARKER, (_, n: string) => blanks[Number(n) - 1]?.c ?? '______');
}

/**
 * 解説で見せる文脈：空所のある段落（pp なら1つ前の段落から）。
 * この空所は ______ のまま、ほかの空所には正解を入れる。和訳も同じ段落ぶん。
 */
export function p6BlankContext(set: Pick<ToeicP6Set, 'p' | 'tr' | 'b'>, blankIndex: number): { text: string; translation: string; paragraphs: number[] } {
  const target = blankIndex + 1;
  const at = set.p.findIndex((x) => x.includes(`[[${target}]]`));
  if (at < 0) return { text: '', translation: '', paragraphs: [] };
  const from = set.b[blankIndex]?.pp && at > 0 ? at - 1 : at;
  const paragraphs = Array.from({ length: at - from + 1 }, (_, k) => from + k);
  const text = paragraphs
    .map((i) => set.p[i].replace(MARKER, (_, n: string) => (Number(n) === target ? '______' : set.b[Number(n) - 1]?.c ?? '______')))
    .join(' ');
  const translation = paragraphs.map((i) => set.tr[i] ?? '').join('');
  return { text, translation, paragraphs };
}

/** 本文を「ふつうの文字」と「空所（文書の中の番号 1〜4）」に分ける（画面の文書表示用） */
export function splitParagraph(paragraph: string): { text?: string; blank?: number }[] {
  const out: { text?: string; blank?: number }[] = [];
  let pos = 0;
  for (const m of paragraph.matchAll(MARKER)) {
    const at = m.index ?? 0;
    if (at > pos) out.push({ text: paragraph.slice(pos, at) });
    out.push({ blank: Number(m[1]) });
    pos = at + m[0].length;
  }
  if (pos < paragraph.length) out.push({ text: paragraph.slice(pos) });
  return out;
}

/** 本文の語数（空所の印は数えない） */
export function passageWordCount(set: Pick<ToeicP6Set, 'p'>): number {
  return set.p.join(' ').replace(MARKER, ' ').split(/\s+/).filter(Boolean).length;
}

/* ───────── 形の検査（テストと、データを書いたときの確認に使う） ───────── */

/** 文書1つの形の問題点（無ければ空の配列） */
export function validateP6Set(set: ToeicP6Set): string[] {
  const issues: string[] = [];
  const found = set.p.join('\n').match(MARKER) ?? [];
  const numbers = found.map((m) => Number(m.slice(2, -2)));
  if (numbers.join(',') !== '1,2,3,4') issues.push(`空所の印が [[1]]〜[[4]] の順に1回ずつになっていない（${found.join(' ') || 'なし'}）`);
  if (set.b.length !== TOEIC_P6_BLANKS_PER_SET) issues.push(`空所のデータが ${set.b.length} 個（4個必要）`);
  if (set.tr.length !== set.p.length) issues.push(`段落 ${set.p.length} 個と和訳 ${set.tr.length} 個の数が合わない`);
  if (set.tr.some((t) => !t.trim())) issues.push('空の和訳がある');
  const inserts = set.b.filter((x) => x.k === '文挿入').length;
  if (inserts !== 1) issues.push(`文挿入が ${inserts} 問（各文書に1問）`);
  const words = passageWordCount(set);
  if (words < TOEIC_P6_WORDS_MIN || words > TOEIC_P6_WORDS_MAX) issues.push(`本文が ${words} 語（目安 ${TOEIC_P6_WORDS_MIN}〜${TOEIC_P6_WORDS_MAX} 語）`);
  const body = set.p.join(' ').toLowerCase();
  set.b.forEach((x, i) => {
    const tag = `空所${i + 1}`;
    const choices = [x.c, ...x.w.map(([t]) => t)];
    if (new Set(choices.map((t) => t.trim().toLowerCase())).size !== 4) issues.push(`${tag}：選択肢4つが互いに違っていない`);
    if (choices.some((t) => !t.trim() || t.trim() !== t)) issues.push(`${tag}：選択肢が空か、前後に空白がある`);
    if (x.why.trim().length <= 10) issues.push(`${tag}：正解の理由が短すぎる`);
    if (x.w.some(([, r]) => r.trim().length <= 5)) issues.push(`${tag}：誤答の理由が短すぎる`);
    if (x.k === '文挿入') {
      if (!/[.?!]$/.test(x.c)) issues.push(`${tag}：文挿入の正解が文の形（文末が . ? !）になっていない`);
      if (body.includes(x.c.toLowerCase())) issues.push(`${tag}：文挿入の正解が本文にすでにある`);
    }
  });
  return issues;
}

/** 1回分（文書4つ）の形の問題点 */
export function validateP6Round(sets: readonly ToeicP6Set[]): string[] {
  const issues: string[] = [];
  if (sets.length !== TOEIC_P6_SETS_PER_ROUND) issues.push(`文書が ${sets.length} つ（1回 ${TOEIC_P6_SETS_PER_ROUND} つ）`);
  sets.forEach((s, i) => validateP6Set(s).forEach((m) => issues.push(`文書${i + 1}：${m}`)));
  const genres = new Set(sets.map((s) => s.genre));
  if (sets.length === TOEIC_P6_SETS_PER_ROUND && genres.size < 3) issues.push(`文書の種類が ${genres.size} 種類だけ（3種類以上にする）`);
  return issues;
}

/* ───────── 1回ぶんの大問を組み立てる ───────── */

export interface ToeicP6RoundMeta {
  round: number;
}

/** 文書ごとの「完成文・全訳・語句」のカード（音は出さない。英文法の explanationTracks と同じ形） */
export interface ToeicP6Track {
  subId: string;
  /** この文書の4問の小問ID */
  subIds: string[];
  label: string;
  hint: string;
  script: string;
  translation: string;
  keyPhrases: { phrase: string; meaning: string }[];
}

export interface ToeicP6Problem {
  id: string;
  category: string;
  text: string;
  subQuestions: SubQuestion[];
  explanation: string;
  surroundingKnowledge: string[];
  deepDiveTopics: string[];
  audioTracks: ToeicP6Track[];
  readCount: 1;
  timeLimitSec: number;
}

const SEP = '────────────────────';

/** 回の一覧カードに出す配分（例：文法7・語彙3・つなぎ2・文挿入4） */
export function p6RoundBreakdown(sets: readonly ToeicP6Set[]): string {
  const all = sets.flatMap((s) => s.b);
  const n = (f: (x: ToeicP6Blank) => boolean) => all.filter(f).length;
  const vocab = n((x) => x.k === '語彙');
  const link = n((x) => x.k === 'つなぎの語句');
  const insert = n((x) => x.k === '文挿入');
  return `文法${all.length - vocab - link - insert}・語彙${vocab}・つなぎ${link}・文挿入${insert}`;
}

/** 1問の選択肢を並べる：正解を pos に置き、誤答は書いた順に残りへ（Part 5 の placeChoices と同じ決まり） */
export function placeP6Choices(blank: ToeicP6Blank, pos: number): { texts: string[]; reasons: string[] } {
  const texts: string[] = [];
  const reasons: string[] = [];
  let wi = 0;
  for (let i = 0; i < 4; i += 1) {
    if (i === pos) {
      texts.push(blank.c);
      reasons.push('');
    } else {
      texts.push(blank.w[wi][0]);
      reasons.push(blank.w[wi][1]);
      wi += 1;
    }
  }
  return { texts, reasons };
}

/** Part 5 と正解位置の並びがそろわないよう、回番号をずらして使う */
const P6_POSITION_SEED_OFFSET = 1000;

/** 第 round 回の16問の正解位置（0〜3）。画面の解説の引き当てでも同じものを使う */
export function p6AnswerPositions(round: number, count: number): number[] {
  return answerPositions(round + P6_POSITION_SEED_OFFSET, count);
}

export function buildToeicP6Round(meta: ToeicP6RoundMeta, sets: readonly ToeicP6Set[]): ToeicP6Problem {
  const no = String(meta.round).padStart(2, '0');
  const base = `q_${TOEIC_P6_CHAPTER_ID}_r${no}`;
  const blanks = sets.flatMap((s) => s.b);
  const subIdOf = (i: number) => `${base}_${i + 1}`;
  const positions = p6AnswerPositions(meta.round, blanks.length);
  const placed = blanks.map((b, i) => placeP6Choices(b, positions[i]));

  const head =
    `第${meta.round}回　TOEIC Part 6 長文穴埋め（文書${sets.length}つ・${blanks.length}問・4択）\n\n` +
    `文書を読み、空所に入れるのに最も適切なものを、(A)〜(D)のうちから1つずつ選びなさい。\n` +
    `文の流れに合う1文を選ぶ問題（文挿入）も各文書に1問あります。`;

  const passages = sets.map((s, si) => {
    const offset = si * TOEIC_P6_BLANKS_PER_SET;
    const title = s.title ? `${s.title}\n` : '';
    const body = s.p.map((x) => renderParagraph(x, offset)).join('\n\n');
    return `${SEP}\n文書${si + 1}（${s.genre}）　問${offset + 1}〜${offset + TOEIC_P6_BLANKS_PER_SET}\n${title}${body}`;
  });
  const text = `${head}\n\n${passages.join('\n\n')}`;

  const subQuestions: SubQuestion[] = blanks.map((b, i) => ({
    id: subIdOf(i),
    label: `問${i + 1}`,
    type: 'multiple_choice',
    options: [...TOEIC_MARKS],
    optionTexts: placed[i].texts,
    correctAnswer: TOEIC_MARKS[positions[i]],
    skill: b.k,
    scene: sets[Math.floor(i / TOEIC_P6_BLANKS_PER_SET)].sc,
    detailedExplanation: { theme: `${b.k}（${b.t}）`, type: b.k, difficulty: b.d, steps: [] },
  }));

  const audioTracks: ToeicP6Track[] = sets.map((s, si) => {
    const offset = si * TOEIC_P6_BLANKS_PER_SET;
    const ids = s.b.map((_, j) => subIdOf(offset + j));
    return {
      subId: ids[0],
      subIds: ids,
      label: `文書${si + 1}`,
      hint: `${s.genre}　問${offset + 1}〜${offset + TOEIC_P6_BLANKS_PER_SET}`,
      script: s.p.map((x) => fillParagraph(x, s.b)).join('\n\n'),
      translation: s.tr.join('\n\n'),
      keyPhrases: s.b.flatMap((b) => b.kw.map(([phrase, meaning]) => ({ phrase, meaning }))),
    };
  });

  const bodies = blanks.map((b, i) => {
    const lines = placed[i].texts.map((t, j) =>
      j === positions[i] ? `${TOEIC_MARKS[j]} ${t}　○ 正解` : `${TOEIC_MARKS[j]} ${t}　× ${placed[i].reasons[j]}`,
    );
    return `問${i + 1}　正解は ${TOEIC_MARKS[positions[i]]}\n【ポイント】${b.why}\n【選択肢】\n${lines.join('\n')}`;
  });
  const explanation = `第${meta.round}回の解説。文書ごとの完成文・全訳と、選択肢ごとの理由を確認しよう。\n\n${bodies.join('\n\n')}`;

  return {
    id: base,
    category: `第${meta.round}回 ${p6RoundBreakdown(sets)}`,
    readCount: 1,
    timeLimitSec: TOEIC_P6_TIME_LIMIT_SEC,
    audioTracks,
    text,
    subQuestions,
    explanation,
    surroundingKnowledge: [],
    deepDiveTopics: [],
  };
}
