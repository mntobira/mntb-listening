/**
 * ===================================================================
 * TOEIC® L&R Part 5（短文穴埋め）　1回30問の型と組み立て道具（2026-10-28）
 * ===================================================================
 *
 * ■ 位置づけ
 *   英文法（englishGrammarKit.ts）と同じ「手書きの問題を、決まった場所に並べるだけ」の道具。
 *   問題文・選択肢・解説はすべて1問ずつ手で書く（自動生成しない）。
 *   画面（ChapterSelection の「第N回」一覧 → Quiz の1問ずつ → 解説 → 結果）は既存のものをそのまま使う。
 *
 * ■ TOEIC らしさのために英文法と変えたところ
 *   ・選択肢は (A)〜(D)。本文は小問の optionTexts に持たせる（解答ボタンに英文がそのまま載る）
 *   ・1回 = 30問（本番の Part 5 と同じ）
 *   ・正解の位置（A〜D）は、各回で偏らないよう ★組み立て時に決める★（placeChoices）。
 *     データには「正解」と「誤答3つ（それぞれの理由つき）」を書くだけなので、
 *     手で書くときに正解の位置が偏る心配がない。並べ方は回番号から決まる（毎回同じ）。
 *
 * ■ 問題文の決まり
 *   ・空所は ______（半角アンダースコア6つ）＝ 既存の英文法と同じ表記
 *   ・英語は米国式表記。社名・人名・地名はすべて架空
 *
 * ※ TOEIC is a registered trademark of ETS. This product is not endorsed or approved by ETS.
 */
import type { SubQuestion } from '../../types/curriculum';

/** 分野（結果画面の分野別正答率の単位） */
export type ToeicSkill =
  | '品詞'
  | '動詞の形'
  | '前置詞'
  | '接続詞'
  | '代名詞'
  | '関係詞'
  | '比較'
  | '語彙'
  | '句動詞・コロケーション';

/** 場面（出題の偏りチェックに使う。画面には出さない） */
export type ToeicScene =
  | '人事・研修'
  | '社内連絡・会議'
  | '製品・製造'
  | '小売・顧客'
  | '業績・財務'
  | '出張・物流'
  | '施設・地域'
  | '広報・メディア';

/** 難易度：1 易 / 2 中 / 3 難 */
export type ToeicLevel = 1 | 2 | 3;

/** 1問ぶんの手書きデータ */
export interface ToeicP5Item {
  /** 分野 */
  k: ToeicSkill;
  /** 小分類（例：'名詞'／'時制'／'譲歩'）。解説の見出しに出る */
  t: string;
  /** 難易度 */
  d: ToeicLevel;
  /** 場面 */
  sc: ToeicScene;
  /** 空所つき英文（空所は ______） */
  s: string;
  /** 正解の選択肢 */
  c: string;
  /** 誤答3つと、それぞれが入らない理由（1行） */
  w: [[string, string], [string, string], [string, string]];
  /** 正解の理由 */
  why: string;
  /** 完成文の和訳 */
  tr: string;
  /** 重要語句（英語, 意味） */
  kw: [string, string][];
}

export const TOEIC_MARKS = ['(A)', '(B)', '(C)', '(D)'] as const;
export type ToeicMark = (typeof TOEIC_MARKS)[number];

export const TOEIC_P5_CHAPTER_ID = 'tp5_1';
export const TOEIC_P5_QUESTIONS_PER_ROUND = 30;
/** 1回30問の目安時間（1問20秒）。超えても止めない（既存の演習と同じ「超過」表示） */
export const TOEIC_P5_TIME_LIMIT_SEC = 600;

export { TOEIC_DISCLAIMER } from '../../utils/toeicDisclaimer';

/* ───────── 正解位置の決め方 ───────── */

/** 回番号から決まる疑似乱数（毎回同じ並びになる） */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 30問の正解位置（0〜3）を決める。A〜D がそれぞれ 7〜8 回になるよう数を先に決めてから並べ替える。
 * 同じ位置が3問続かないようにする（続くと「また A？」と不安にさせ、勘で解く癖を生む）。
 */
export function answerPositions(round: number, count: number): number[] {
  const base = Array.from({ length: count }, (_, i) => (i + round) % 4);
  const rand = seeded(round * 7919 + 17);
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const list = base.slice();
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    const triple = list.some((v, i) => i >= 2 && v === list[i - 1] && v === list[i - 2]);
    if (!triple) return list;
  }
  return base;
}

/** 1問の選択肢を並べる：正解を pos に置き、誤答は書いた順に残りへ */
export function placeChoices(item: ToeicP5Item, pos: number): { texts: string[]; reasons: string[] } {
  const texts: string[] = [];
  const reasons: string[] = [];
  let wi = 0;
  for (let i = 0; i < 4; i += 1) {
    if (i === pos) {
      texts.push(item.c);
      reasons.push('');
    } else {
      texts.push(item.w[wi][0]);
      reasons.push(item.w[wi][1]);
      wi += 1;
    }
  }
  return { texts, reasons };
}

/** 空所に正解を入れた完成文 */
export function fillBlank(sentence: string, answer: string): string {
  return sentence.replace('______', answer);
}

/* ───────── 1回ぶんの大問を組み立てる ───────── */

export interface ToeicRoundMeta {
  round: number;
}

/** 音を出さない「完成文・和訳・語句」のカード（英文法の explanationTracks と同じ形） */
export interface ToeicTrack {
  subId: string;
  label: string;
  hint: string;
  script: string;
  translation: string;
  keyPhrases: { phrase: string; meaning: string }[];
}

export interface ToeicProblem {
  id: string;
  category: string;
  text: string;
  subQuestions: SubQuestion[];
  explanation: string;
  surroundingKnowledge: string[];
  deepDiveTopics: string[];
  audioTracks: ToeicTrack[];
  readCount: 1;
  timeLimitSec: number;
}

const SEP = '────────────────────';

/** 回の一覧カードに出す配分（例：語彙9・品詞6・文法15） */
export function roundBreakdown(items: ToeicP5Item[]): string {
  const vocab = items.filter((x) => x.k === '語彙' || x.k === '句動詞・コロケーション').length;
  const pos = items.filter((x) => x.k === '品詞').length;
  return `語彙${vocab}・品詞${pos}・文法${items.length - vocab - pos}`;
}

export function buildToeicRound(meta: ToeicRoundMeta, items: ToeicP5Item[]): ToeicProblem {
  const no = String(meta.round).padStart(2, '0');
  const base = `q_${TOEIC_P5_CHAPTER_ID}_r${no}`;
  const subIdOf = (i: number) => `${base}_${i + 1}`;
  const positions = answerPositions(meta.round, items.length);

  const placed = items.map((item, i) => placeChoices(item, positions[i]));

  const audioTracks: ToeicTrack[] = items.map((item, i) => ({
    subId: subIdOf(i),
    label: `問${i + 1}`,
    hint: `${item.k}（${item.t}）`,
    script: fillBlank(item.s, item.c),
    translation: item.tr,
    keyPhrases: [{ phrase: item.c, meaning: `正解（${item.k}：${item.t}）` }, ...item.kw.map(([phrase, meaning]) => ({ phrase, meaning }))],
  }));

  const head =
    `第${meta.round}回　TOEIC Part 5 短文穴埋め（${items.length}問・4択）\n\n` +
    `空所に入れるのに最も適切なものを、(A)〜(D)のうちから1つずつ選びなさい。\n\n` +
    `1問ずつ解いて、すぐ下の解説で「なぜその語か」を確かめてから次の問へ進みます。`;
  const blocks = items.map((item, i) => `${SEP}\n問${i + 1}　${item.s}`);
  const text = `${head}\n\n${blocks.join('\n\n')}`;

  const subQuestions: SubQuestion[] = items.map((item, i) => ({
    id: subIdOf(i),
    label: `問${i + 1}`,
    type: 'multiple_choice',
    options: [...TOEIC_MARKS],
    optionTexts: placed[i].texts,
    correctAnswer: TOEIC_MARKS[positions[i]],
    skill: item.k,
    scene: item.sc,
    detailedExplanation: { theme: `${item.k}（${item.t}）`, type: item.k, difficulty: item.d, steps: [] },
  }));

  const bodies = items.map((item, i) => {
    const lines = placed[i].texts.map((text, j) =>
      j === positions[i] ? `${TOEIC_MARKS[j]} ${text}　○ 正解` : `${TOEIC_MARKS[j]} ${text}　× ${placed[i].reasons[j]}`,
    );
    return `問${i + 1}　正解は ${TOEIC_MARKS[positions[i]]}\n【ポイント】${item.why}\n【選択肢】\n${lines.join('\n')}`;
  });
  const explanation = `第${meta.round}回の解説。各問の英文・和訳・語句と、選択肢ごとの理由を確認しよう。\n\n${bodies.join('\n\n')}`;

  return {
    id: base,
    category: `第${meta.round}回 ${roundBreakdown(items)}`,
    readCount: 1,
    timeLimitSec: TOEIC_P5_TIME_LIMIT_SEC,
    audioTracks,
    text,
    subQuestions,
    explanation,
    surroundingKnowledge: [],
    deepDiveTopics: [],
  };
}
