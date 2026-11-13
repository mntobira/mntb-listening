/**
 * ===================================================================
 * TOEIC® L&R リスニング（Part 2・Part 3・Part 4）1回12問の型と組み立て道具（2026-11-12）
 * ===================================================================
 *
 * ■ 位置づけ
 *   Part 5・Part 6・Part 7 と同じ「手書きの問題を、決まった場所に並べるだけ」の道具。
 *   スクリプト・設問・選択肢・解説はすべてマナトビのオリジナル（自動生成・市販転載なし）。
 *
 * ■ アプリでの1回（全15回＝Part 5・6・7 と同じ回数）
 *   ・Part 2 応答問題（質問・発言 → 3択 (A)〜(C)、画面には記号だけ出し音声で選択肢も聞く）… 6問（問1〜問6）
 *   ・Part 3 会話問題（2人の対話 → 設問3問・4択 (A)〜(D)）… 1セット3問（問7〜問9）
 *   ・Part 4 説明文問題（1人のアナウンス・留守電など → 設問3問・4択 (A)〜(D)）… 1セット3問（問10〜問12）
 *   ＝ 1回8トラック・12問（全15回で120トラック・180問）。
 *
 * ■ 音源と読み上げ代替
 *   ・ElevenLabs で録音した MP3 は public/audio/toeic_listening/<id>.mp3 に置き、
 *     public/audio/toeic_listening/index.json に収録済み ID 一覧を記録する。
 *   ・録音ファイルがまだ無いトラック（または通信失敗時）は、ブラウザの音声合成（Web Speech API）に
 *     自動でフォールバックして対話・説明文・応答選択肢を読み上げるため、録音前でもそのまま演習できる。
 *
 * ※ TOEIC is a registered trademark of ETS. This product is not endorsed or approved by ETS.
 */
import type { SubQuestion } from '../../types/curriculum';
import { answerPositions, TOEIC_MARKS, type ToeicLevel, type ToeicScene } from './toeicPart5Kit';
import type { ToeicCue } from './toeicPart5NoteTypes';

export type ToeicListeningSkill =
  | '疑問詞の応答'
  | 'Yes/No・選択の応答'
  | '依頼・提案・平叙文の応答'
  | '目的・主題'
  | '詳細・数値・条件'
  | '次の行動・依頼'
  | '話し手・場所・推測';

export const TOEIC_P2_MARKS = ['(A)', '(B)', '(C)'] as const;

/** Part 2（応答問題・1問＝1トラック・3択） */
export interface ToeicP2Item {
  k: ToeicListeningSkill;
  t: string;
  d: ToeicLevel;
  sc: ToeicScene;
  /** 話し手（'W' 女性 / 'M' 男性） */
  sp: 'W' | 'M';
  /** 質問・発言の英文（採点前は画面に出さない） */
  q: string;
  /** 質問・発言の和訳 */
  qtr: string;
  /** 正解の応答（英語） */
  c: string;
  /** 正解の応答の和訳 */
  ctr: string;
  /** 誤答2つ：[英文, 和訳, 合わない理由] */
  w: [[string, string, string], [string, string, string]];
  /** 正解の理由 */
  why: string;
  kw: [string, string][];
  h: string;
  r: string;
  tip: string;
  cues?: ToeicCue[];
}

/** Part 3 / Part 4 の1問（4択・設問と選択肢は画面に印刷される） */
export interface ToeicTalkQ {
  k: ToeicListeningSkill;
  t: string;
  d: ToeicLevel;
  /** 設問文（英語） */
  q: string;
  /** 設問文の和訳 */
  qtr: string;
  /** 正解の選択肢（英語） */
  c: string;
  /** 誤答3つと合わない理由 */
  w: [[string, string], [string, string], [string, string]];
  /** 正解の理由 */
  why: string;
  /** スクリプト中の根拠文（そのまま引用） */
  e: string;
  /** 根拠文の和訳 */
  etr: string;
  kw: [string, string][];
  h: string;
  r: string;
  tip: string;
  cues?: ToeicCue[];
}

/** Part 3（会話問題・1セット＝対話1本＋設問3問） */
export interface ToeicP3Set {
  sc: ToeicScene;
  /** 場面の短い説明（日本語・解説やトラック見出し用） */
  situation: string;
  /** 対話の発話列（W: 女性 / M: 男性） */
  turns: readonly { sp: 'W' | 'M'; en: string; ja: string }[];
  q: readonly [ToeicTalkQ, ToeicTalkQ, ToeicTalkQ];
}

/** Part 4（説明文問題・1セット＝トーク1本＋設問3問） */
export interface ToeicP4Set {
  sc: ToeicScene;
  /** トークの種類（例：社内アナウンス・留守番電話・イベント案内） */
  genre: string;
  /** 話し手（'W' 女性 / 'M' 男性） */
  sp: 'W' | 'M';
  /** 英文の段落（2〜3段落） */
  p: readonly string[];
  /** 段落ごとの和訳（p と同じ数） */
  tr: readonly string[];
  q: readonly [ToeicTalkQ, ToeicTalkQ, ToeicTalkQ];
}

/** 1回ぶんの TOEIC リスニングデータ（12問） */
export interface ToeicListeningRoundData {
  p2: readonly [ToeicP2Item, ToeicP2Item, ToeicP2Item, ToeicP2Item, ToeicP2Item, ToeicP2Item];
  p3: ToeicP3Set;
  p4: ToeicP4Set;
}

export const TOEIC_LISTENING_CHAPTER_ID = 'tpl_1';
export const TOEIC_LISTENING_P2_COUNT = 6;
export const TOEIC_LISTENING_QUESTIONS_PER_ROUND = 12;
/** 1回12問の目安時間（9分＝540秒：Part 2 約3分＋Part 3 約3分＋Part 4 約3分） */
export const TOEIC_LISTENING_TIME_LIMIT_SEC = 540;

/** 回番号と問題番号から Part 2 の3択 (A)〜(C) の正解位置（0〜2）を決める（各回 A/B/C が2回ずつ・3連続なし） */
export function p2AnswerPositions(round: number): number[] {
  const base = [0, 1, 2, 0, 1, 2];
  let a = (round * 104729 + 31) >>> 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let attempt = 0; attempt < 100; attempt += 1) {
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

/** Part 2 の選択肢を並べる：正解を pos に置き、誤答2つを残りへ */
export function placeP2Choices(item: ToeicP2Item, pos: number): {
  texts: string[];
  translations: string[];
  reasons: string[];
} {
  const texts: string[] = [];
  const translations: string[] = [];
  const reasons: string[] = [];
  let wi = 0;
  for (let i = 0; i < 3; i += 1) {
    if (i === pos) {
      texts.push(item.c);
      translations.push(item.ctr);
      reasons.push('');
    } else {
      texts.push(item.w[wi][0]);
      translations.push(item.w[wi][1]);
      reasons.push(item.w[wi][2]);
      wi += 1;
    }
  }
  return { texts, translations, reasons };
}

/** Part 3・Part 4 の6問の正解位置（0〜3）を決める（A〜D が偏らず3連続しない） */
export function talkAnswerPositions(round: number): number[] {
  return answerPositions(round + 3000, 6);
}

/** Part 3・Part 4 の1問の4択を並べる */
export function placeTalkChoices(q: ToeicTalkQ, pos: number): { texts: string[]; reasons: string[] } {
  const texts: string[] = [];
  const reasons: string[] = [];
  let wi = 0;
  for (let i = 0; i < 4; i += 1) {
    if (i === pos) {
      texts.push(q.c);
      reasons.push('');
    } else {
      texts.push(q.w[wi][0]);
      reasons.push(q.w[wi][1]);
      wi += 1;
    }
  }
  return { texts, reasons };
}

/** トラックID（ElevenLabs の音声ファイル名と1対1対応） */
export function toeicListeningTrackId(round: number, kind: 'p2' | 'p3' | 'p4', p2Index = 0): string {
  const r = String(round).padStart(2, '0');
  if (kind === 'p2') return `tpl_r${r}_p2_q${p2Index + 1}`;
  return `tpl_r${r}_${kind}`;
}

/** ElevenLabs 用の読み上げテキスト（Part 2 の1問：質問＋(A)(B)(C)） */
export function buildP2ElevenLabsLines(round: number, qIndex: number, item: ToeicP2Item): string[] {
  const pos = p2AnswerPositions(round)[qIndex] ?? 0;
  const placed = placeP2Choices(item, pos);
  return [
    `Number ${qIndex + 1}. ${item.q}`,
    '<break time="1.0s" />',
    `A. ${placed.texts[0]}`,
    '<break time="0.8s" />',
    `B. ${placed.texts[1]}`,
    '<break time="0.8s" />',
    `C. ${placed.texts[2]}`,
  ];
}

/** Web Speech 用の発話列（Part 2 の1問） */
export function buildP2SpeechTurns(round: number, qIndex: number, item: ToeicP2Item): { who: string; text: string }[] {
  const pos = p2AnswerPositions(round)[qIndex] ?? 0;
  const placed = placeP2Choices(item, pos);
  const answerer = item.sp === 'W' ? 'M' : 'W';
  return [
    { who: item.sp, text: item.q },
    { who: answerer, text: `A. ${placed.texts[0]}` },
    { who: answerer, text: `B. ${placed.texts[1]}` },
    { who: answerer, text: `C. ${placed.texts[2]}` },
  ];
}

export interface BuiltToeicListeningTrack {
  subId: string;
  subIds?: string[];
  trackId: string;
  label: string;
  hint: string;
  script: string;
  turns?: { who: string; text: string }[];
  translation: string;
  keyPhrases: { phrase: string; meaning: string }[];
}

export interface BuiltToeicListeningProblem {
  id: string;
  category: string;
  text: string;
  subQuestions: SubQuestion[];
  explanation: string;
  surroundingKnowledge: string[];
  deepDiveTopics: string[];
  audioTracks: BuiltToeicListeningTrack[];
  readCount: 1;
  timeLimitSec: number;
}

export function validateToeicListeningRound(data: ToeicListeningRoundData): string[] {
  const issues: string[] = [];
  if (data.p2.length !== 6) issues.push(`Part 2 が ${data.p2.length} 問（6問必要）`);
  data.p2.forEach((it, idx) => {
    const allChoices = [it.c, it.w[0][0], it.w[1][0]];
    if (new Set(allChoices.map((s) => s.toLowerCase())).size !== 3) issues.push(`Part 2 問${idx + 1}: 選択肢の重複`);
    if (!it.q.trim() || !it.qtr.trim() || !it.why.trim()) issues.push(`Part 2 問${idx + 1}: 空の項目`);
  });
  const p3Script = data.p3.turns.map((t) => t.en).join(' ');
  if (data.p3.turns.length < 4) issues.push('Part 3: 発話が4つ未満');
  data.p3.q.forEach((q, idx) => {
    if (!p3Script.includes(q.e)) issues.push(`Part 3 設問${idx + 1}: 根拠が対話内に無い (${q.e})`);
    const cs = [q.c, ...q.w.map((x) => x[0])];
    if (new Set(cs.map((s) => s.toLowerCase())).size !== 4) issues.push(`Part 3 設問${idx + 1}: 選択肢の重複`);
  });
  const p4Script = data.p4.p.join(' ');
  if (data.p4.p.length !== data.p4.tr.length) issues.push('Part 4: 段落と和訳の数が不一致');
  data.p4.q.forEach((q, idx) => {
    if (!p4Script.includes(q.e)) issues.push(`Part 4 設問${idx + 1}: 根拠がトーク内に無い (${q.e})`);
    const cs = [q.c, ...q.w.map((x) => x[0])];
    if (new Set(cs.map((s) => s.toLowerCase())).size !== 4) issues.push(`Part 4 設問${idx + 1}: 選択肢の重複`);
  });
  return issues;
}

export function buildToeicListeningRound(round: number, data: ToeicListeningRoundData): BuiltToeicListeningProblem {
  const no = String(round).padStart(2, '0');
  const base = `q_${TOEIC_LISTENING_CHAPTER_ID}_r${no}`;
  const subIdOf = (i: number) => `${base}_${i + 1}`;

  const p2Pos = p2AnswerPositions(round);
  const talkPos = talkAnswerPositions(round);

  const subQuestions: SubQuestion[] = [];
  const audioTracks: BuiltToeicListeningTrack[] = [];
  const bodies: string[] = [];

  // Part 2: 問1〜問6（音声のみの3択：採点前は選択肢英文を伏せるため optionTexts は記号と同じ '(A)'〜'(C)' にし、解説で全文を出す）
  data.p2.forEach((item, i) => {
    const pos = p2Pos[i] ?? 0;
    const placed = placeP2Choices(item, pos);
    const subId = subIdOf(i);
    const trackId = toeicListeningTrackId(round, 'p2', i);
    const choiceLines = placed.texts.map((t, j) => `${TOEIC_P2_MARKS[j]} ${t}`).join('\n');
    const trLines = placed.translations.map((t, j) => `${TOEIC_P2_MARKS[j]} ${t}`).join(' ／ ');

    audioTracks.push({
      subId,
      trackId,
      label: `問${i + 1}`,
      hint: `Part 2 応答問題（${item.t}）`,
      script: `${item.sp}: ${item.q}\n${choiceLines}`,
      turns: buildP2SpeechTurns(round, i, item),
      translation: `質問：${item.qtr}\n${trLines}`,
      keyPhrases: item.kw.map(([phrase, meaning]) => ({ phrase, meaning })),
    });

    subQuestions.push({
      id: subId,
      label: `問${i + 1}`,
      type: 'multiple_choice',
      options: [...TOEIC_P2_MARKS],
      optionTexts: ['音声を聞いて選ぶ', '音声を聞いて選ぶ', '音声を聞いて選ぶ'],
      correctAnswer: TOEIC_P2_MARKS[pos],
      skill: item.k,
      scene: item.sc,
      detailedExplanation: { theme: `${item.k}（${item.t}）`, type: item.k, difficulty: item.d, steps: [] },
    });

    const lines = placed.texts.map((t, j) =>
      j === pos ? `${TOEIC_P2_MARKS[j]} ${t}（${placed.translations[j]}）　○ 正解`
        : `${TOEIC_P2_MARKS[j]} ${t}（${placed.translations[j]}）　× ${placed.reasons[j]}`,
    );
    bodies.push(`問${i + 1}　正解は ${TOEIC_P2_MARKS[pos]}\n【質問】${item.q}（${item.qtr}）\n【ポイント】${item.why}\n【選択肢】\n${lines.join('\n')}`);
  });

  // Part 3: 問7〜問9（会話1本に3問）
  const p3SubIds = [subIdOf(6), subIdOf(7), subIdOf(8)];
  audioTracks.push({
    subId: p3SubIds[0],
    subIds: p3SubIds,
    trackId: toeicListeningTrackId(round, 'p3'),
    label: '問7〜9（会話）',
    hint: `Part 3 会話問題（${data.p3.situation}）`,
    script: data.p3.turns.map((t) => `${t.sp}: ${t.en}`).join('\n'),
    turns: data.p3.turns.map((t) => ({ who: t.sp, text: t.en })),
    translation: data.p3.turns.map((t) => `${t.sp === 'W' ? '女性' : '男性'}：${t.ja}`).join('\n'),
    keyPhrases: data.p3.q.flatMap((q) => q.kw.map(([phrase, meaning]) => ({ phrase, meaning }))),
  });

  data.p3.q.forEach((q, qi) => {
    const qNo = 7 + qi;
    const pos = talkPos[qi] ?? 0;
    const placed = placeTalkChoices(q, pos);
    subQuestions.push({
      id: subIdOf(qNo - 1),
      label: `問${qNo}`,
      type: 'multiple_choice',
      options: [...TOEIC_MARKS],
      optionTexts: placed.texts,
      correctAnswer: TOEIC_MARKS[pos],
      skill: q.k,
      scene: data.p3.sc,
      detailedExplanation: { theme: `${q.k}（${q.t}）`, type: q.k, difficulty: q.d, steps: [] },
    });
    const lines = placed.texts.map((t, j) =>
      j === pos ? `${TOEIC_MARKS[j]} ${t}　○ 正解` : `${TOEIC_MARKS[j]} ${t}　× ${placed.reasons[j]}`,
    );
    bodies.push(`問${qNo}　正解は ${TOEIC_MARKS[pos]}\n【設問】${q.q}\n【ポイント】${q.why}\n【選択肢】\n${lines.join('\n')}`);
  });

  // Part 4: 問10〜問12（説明文1本に3問）
  const p4SubIds = [subIdOf(9), subIdOf(10), subIdOf(11)];
  audioTracks.push({
    subId: p4SubIds[0],
    subIds: p4SubIds,
    trackId: toeicListeningTrackId(round, 'p4'),
    label: '問10〜12（説明文）',
    hint: `Part 4 説明文問題（${data.p4.genre}）`,
    script: data.p4.p.join('\n\n'),
    turns: data.p4.p.map((text) => ({ who: data.p4.sp, text })),
    translation: data.p4.tr.join('\n'),
    keyPhrases: data.p4.q.flatMap((q) => q.kw.map(([phrase, meaning]) => ({ phrase, meaning }))),
  });

  data.p4.q.forEach((q, qi) => {
    const qNo = 10 + qi;
    const pos = talkPos[3 + qi] ?? 0;
    const placed = placeTalkChoices(q, pos);
    subQuestions.push({
      id: subIdOf(qNo - 1),
      label: `問${qNo}`,
      type: 'multiple_choice',
      options: [...TOEIC_MARKS],
      optionTexts: placed.texts,
      correctAnswer: TOEIC_MARKS[pos],
      skill: q.k,
      scene: data.p4.sc,
      detailedExplanation: { theme: `${q.k}（${q.t}）`, type: q.k, difficulty: q.d, steps: [] },
    });
    const lines = placed.texts.map((t, j) =>
      j === pos ? `${TOEIC_MARKS[j]} ${t}　○ 正解` : `${TOEIC_MARKS[j]} ${t}　× ${placed.reasons[j]}`,
    );
    bodies.push(`問${qNo}　正解は ${TOEIC_MARKS[pos]}\n【設問】${q.q}\n【ポイント】${q.why}\n【選択肢】\n${lines.join('\n')}`);
  });

  const text =
    `第${round}回　TOEIC リスニング演習（Part 2 応答6問・Part 3 会話3問・Part 4 説明文3問／計12問）\n\n` +
    `音声を聞いて、最も適切な答えを選びなさい。採点するとスクリプト・和訳・選択肢ごとの理由が開きます。`;
  const explanation = `第${round}回の解説。流れた英文・和訳・語句と、選択肢ごとの理由を確認しよう。\n\n${bodies.join('\n\n')}`;

  return {
    id: base,
    category: `第${round}回 応答6・会話3・説明文3`,
    readCount: 1,
    timeLimitSec: TOEIC_LISTENING_TIME_LIMIT_SEC,
    audioTracks,
    text,
    subQuestions,
    explanation,
    surroundingKnowledge: [],
    deepDiveTopics: [],
  };
}
