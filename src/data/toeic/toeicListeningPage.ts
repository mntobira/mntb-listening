/**
 * TOEIC® L&R リスニング（tpl_1）のページ分割・解説引き当て・音声トラック案内（2026-11-12）
 *
 * toeicPageModel.ts を肥大化させないため、リスニング固有の計算をこのモジュールに分ける。
 *
 * ■ ページ割り（1回12問 → 4ページ×3問）
 *   ・ページ1（問1〜問3）：Part 2 応答問題（前半3問）
 *   ・ページ2（問4〜問6）：Part 2 応答問題（後半3問）
 *   ・ページ3（問7〜問9）：Part 3 会話問題（対話1本＋3問）
 *   ・ページ4（問10〜問12）：Part 4 説明文問題（トーク1本＋3問）
 */
import type { SubQuestion } from '../../types/curriculum';
import { TOEIC_MARKS } from './toeicPart5Kit';
import {
  buildP2SpeechTurns,
  p2AnswerPositions,
  placeP2Choices,
  placeTalkChoices,
  talkAnswerPositions,
  TOEIC_LISTENING_CHAPTER_ID,
  TOEIC_P2_MARKS,
  toeicListeningTrackId,
  type ToeicListeningRoundData,
  type ToeicP2Item,
  type ToeicP3Set,
  type ToeicP4Set,
  type ToeicTalkQ,
} from './toeicListeningKit';
import { TOEIC_LISTENING_ROUNDS } from './toeicListeningRounds';
import { resolveCues, type ToeicExplanation } from '../../components/toeic/toeicPageModel';

export const TOEIC_LISTENING_PER_PAGE = 3;

const TPL_SUB_ID = /^q_tpl_1_r(\d+)_(\d+)$/;

export type ToeicListeningPartKind = 'p2_a' | 'p2_b' | 'p3' | 'p4';

export interface LocatedToeicListening {
  round: number;
  /** 回の中の通し番号（0〜11） */
  index: number;
  /** ページグループ（0: 問1-3, 1: 問4-6, 2: 問7-9, 3: 問10-12） */
  pageGroup: 0 | 1 | 2 | 3;
  kind: ToeicListeningPartKind;
}

export function isToeicListeningChapter(chapterId: string | undefined | null): boolean {
  return chapterId === TOEIC_LISTENING_CHAPTER_ID;
}

export function locateToeicListening(subId: string | undefined | null): LocatedToeicListening | null {
  const m = String(subId || '').match(TPL_SUB_ID);
  if (!m) return null;
  const round = Number(m[1]);
  const index = Number(m[2]) - 1;
  if (round < 1 || index < 0 || index >= 12) return null;
  const pageGroup = Math.min(3, Math.floor(index / 3)) as 0 | 1 | 2 | 3;
  const kind: ToeicListeningPartKind = pageGroup === 0 ? 'p2_a' : pageGroup === 1 ? 'p2_b' : pageGroup === 2 ? 'p3' : 'p4';
  return { round, index, pageGroup, kind };
}

/** ページ分け：同じパート帯（問1-3 / 問4-6 / 問7-9 / 問10-12）ごとにまとめる */
export function splitToeicListeningPages<T extends Pick<SubQuestion, 'id'>>(items: readonly T[]): T[][] {
  const pages: T[][] = [];
  let key = '';
  for (const sq of items) {
    const at = locateToeicListening(sq.id);
    const k = at ? `${at.round}_${at.pageGroup}` : `x_${sq.id}`;
    if (k !== key || pages.length === 0) {
      pages.push([]);
      key = k;
    }
    pages[pages.length - 1].push(sq);
  }
  return pages;
}

/** 問題カードに出す設問文（Part 2 は採点前は音声のみで伏せ、Part 3・4 は設問文を印刷する） */
export function toeicListeningStem(sq: Pick<SubQuestion, 'id'>, scored = false): string {
  const at = locateToeicListening(sq.id);
  const roundData: ToeicListeningRoundData | undefined = at ? TOEIC_LISTENING_ROUNDS[at.round - 1] : undefined;
  if (!at || !roundData) return '';
  if (at.index < 6) {
    const item = roundData.p2[at.index];
    if (!item) return '';
    return scored ? item.q : '音声を聞いて、最も適切な応答 (A)〜(C) を選びなさい。';
  }
  if (at.index < 9) {
    return roundData.p3.q[at.index - 6]?.q ?? '';
  }
  return roundData.p4.q[at.index - 9]?.q ?? '';
}

/** Part 2 の選択肢表示テキスト（採点前は英文を伏せ、採点後は実際の応答英文を出す） */
export function toeicListeningChoiceTexts(sq: SubQuestion, scored: boolean): readonly string[] {
  const at = locateToeicListening(sq.id);
  const roundData = at ? TOEIC_LISTENING_ROUNDS[at.round - 1] : undefined;
  if (!at || !roundData || at.index >= 6) return sq.optionTexts || [];
  if (!scored) return sq.optionTexts || ['音声を聞いて選ぶ', '音声を聞いて選ぶ', '音声を聞いて選ぶ'];
  const item = roundData.p2[at.index];
  if (!item) return sq.optionTexts || [];
  const pos = p2AnswerPositions(at.round)[at.index] ?? 0;
  return placeP2Choices(item, pos).texts;
}

export interface ToeicListeningAudioCardItem {
  trackId: string;
  buttonLabel: string;
  subLabel: string;
  turns: { who: string; text: string }[];
  fallbackScript: string;
  scriptLines: { speaker?: string; en: string; ja: string }[];
}

export interface ToeicListeningPageAudioInfo {
  partBadge: string;
  title: string;
  guide: string;
  isSetAudio: boolean;
  tracks: ToeicListeningAudioCardItem[];
}

/** 現在のページに対応する音声バー情報を作る */
export function toeicListeningPageAudioOf(page: readonly Pick<SubQuestion, 'id'>[]): ToeicListeningPageAudioInfo | null {
  const first = page[0];
  const at = first ? locateToeicListening(first.id) : null;
  const roundData = at ? TOEIC_LISTENING_ROUNDS[at.round - 1] : undefined;
  if (!at || !roundData) return null;

  if (at.pageGroup === 0 || at.pageGroup === 1) {
    const tracks: ToeicListeningAudioCardItem[] = [];
    for (const sq of page) {
      const loc = locateToeicListening(sq.id);
      if (!loc || loc.index >= 6) continue;
      const item: ToeicP2Item = roundData.p2[loc.index];
      const pos = p2AnswerPositions(loc.round)[loc.index] ?? 0;
      const placed = placeP2Choices(item, pos);
      const turns = buildP2SpeechTurns(loc.round, loc.index, item);
      tracks.push({
        trackId: toeicListeningTrackId(loc.round, 'p2', loc.index),
        buttonLabel: `問${loc.index + 1}を再生`,
        subLabel: `Part 2 応答（3択）`,
        turns,
        fallbackScript: turns.map((t) => t.text).join(' '),
        scriptLines: [
          { speaker: item.sp === 'W' ? '質問（女性）' : '質問（男性）', en: item.q, ja: item.qtr },
          ...placed.texts.map((en, j) => ({
            speaker: TOEIC_P2_MARKS[j],
            en,
            ja: placed.translations[j] ?? '',
          })),
        ],
      });
    }
    return {
      partBadge: 'Part 2',
      title: `応答問題（問${at.pageGroup === 0 ? '1〜3' : '4〜6'}）`,
      guide: '質問と (A)〜(C) の応答がすべて音声で流れます（採点後にスクリプトが開きます）',
      isSetAudio: false,
      tracks,
    };
  }

  if (at.pageGroup === 2) {
    const p3: ToeicP3Set = roundData.p3;
    return {
      partBadge: 'Part 3',
      title: `会話問題：${p3.situation}`,
      guide: '男女の対話を聞いて、問7〜問9の4択に答えましょう（先に設問に目を通すのがおすすめ）',
      isSetAudio: true,
      tracks: [
        {
          trackId: toeicListeningTrackId(at.round, 'p3'),
          buttonLabel: '会話を再生（問7〜9）',
          subLabel: p3.situation,
          turns: p3.turns.map((t) => ({ who: t.sp, text: t.en })),
          fallbackScript: p3.turns.map((t) => t.en).join(' '),
          scriptLines: p3.turns.map((t) => ({
            speaker: t.sp === 'W' ? '女性 (W)' : '男性 (M)',
            en: t.en,
            ja: t.ja,
          })),
        },
      ],
    };
  }

  const p4: ToeicP4Set = roundData.p4;
  return {
    partBadge: 'Part 4',
    title: `説明文問題：${p4.genre}`,
    guide: 'アナウンス・説明を聞いて、問10〜問12の4択に答えましょう',
    isSetAudio: true,
    tracks: [
      {
        trackId: toeicListeningTrackId(at.round, 'p4'),
        buttonLabel: '説明文を再生（問10〜12）',
        subLabel: p4.genre,
        turns: p4.p.map((text) => ({ who: p4.sp, text })),
        fallbackScript: p4.p.join(' '),
        scriptLines: p4.p.map((en, idx) => ({
          speaker: idx === 0 ? (p4.sp === 'W' ? '話し手（女性）' : '話し手（男性）') : `段落 ${idx + 1}`,
          en,
          ja: p4.tr[idx] ?? '',
        })),
      },
    ],
  };
}

/** 1問ぶんの解説データ（ToeicExplanationPanel とそのまま互換） */
export function toeicListeningExplanationFor(sq: SubQuestion): ToeicExplanation | null {
  const at = locateToeicListening(sq.id);
  const roundData = at ? TOEIC_LISTENING_ROUNDS[at.round - 1] : undefined;
  if (!at || !roundData) return null;

  if (at.index < 6) {
    const item = roundData.p2[at.index];
    if (!item) return null;
    const pos = p2AnswerPositions(at.round)[at.index] ?? 0;
    const placed = placeP2Choices(item, pos);
    return {
      sentence: item.q,
      completed: item.q,
      prompt: `Part 2 質問文（音声）`,
      why: item.why,
      choices: TOEIC_P2_MARKS.map((mark, i) => ({
        mark,
        text: `${placed.texts[i]}（${placed.translations[i]}）`,
        correct: mark === sq.correctAnswer,
        reason: mark === sq.correctAnswer ? '' : (placed.reasons[i] || ''),
      })),
      translation: `質問：${item.qtr}\n正解の応答：${item.ctr}`,
      keywords: item.kw.map(([en, ja]) => ({ en, ja })),
      skill: item.k,
      subType: item.t,
      hint: item.h.trim(),
      rule: item.r.trim(),
      tip: item.tip.trim(),
      cues: resolveCues(item.q, item.why, item.cues),
    };
  }

  const isP3 = at.index < 9;
  const q: ToeicTalkQ | undefined = isP3 ? roundData.p3.q[at.index - 6] : roundData.p4.q[at.index - 9];
  if (!q) return null;
  const talkIdx = at.index - 6;
  const pos = talkAnswerPositions(at.round)[talkIdx] ?? 0;
  const placed = placeTalkChoices(q, pos);
  return {
    sentence: q.e,
    completed: q.e,
    prompt: q.q,
    why: q.why,
    choices: TOEIC_MARKS.map((mark, i) => ({
      mark,
      text: placed.texts[i] ?? '',
      correct: mark === sq.correctAnswer,
      reason: mark === sq.correctAnswer ? '' : (placed.reasons[i] || ''),
    })),
    translation: `設問：${q.qtr}\n根拠：${q.etr}`,
    keywords: q.kw.map(([en, ja]) => ({ en, ja })),
    skill: q.k,
    subType: q.t,
    hint: q.h.trim(),
    rule: q.r.trim(),
    tip: q.tip.trim(),
    cues: resolveCues(q.e, q.why, q.cues),
  };
}
