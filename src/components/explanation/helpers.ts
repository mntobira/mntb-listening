import type React from 'react';
import { LISTENING_PICTURE_ASPECT } from '../../data/listeningPictureAspect';
import { isToeicPageChapter } from '../toeic/toeicPageModel';
import type { AudioTrack, Problem, SubQuestion } from '../../types/curriculum';

/**
 * 英語の散文として組む単元か（英字を化学式用のセリフ体に化けさせない）。
 * 音声・完成文トラックを持つ単元に加え、TOEIC・英語リスニング・英文法・英検などの章IDも漏れなく対象にする。
 */
export function isEnglishProseChapter(
  chapterId: string | undefined | null,
  allQuestions: readonly Pick<Problem, 'audioTracks' | 'explanationTracks'>[],
): boolean {
  const id = String(chapterId || '').trim();
  if (/^(?:tp[l567]_\d+|el\d+(?:_[A-Z])?|eg\d+_\d+|ev_\d+|er_\d+|eiken_)/.test(id)) return true;
  return allQuestions.some((q) => textTracksOf(q).length > 0);
}

/**
 * 金額の「$100 … $15」などが KaTeX の数式として組まれるのを防ぐ単元か（TOEIC・英語単元）。
 */
export function isNoMathChapter(chapterId: string | undefined | null): boolean {
  const id = String(chapterId || '').trim();
  return isToeicPageChapter(id) || /^(?:el\d+(?:_[A-Z])?|eg\d+_\d+|ev_\d+|er_\d+|eiken_)/.test(id);
}

export interface DialogueTurnLine {
  speaker: string;
  text: string;
}

/**
 * `A: ...\nB: ...` 形式の対話文であれば話者ターンの配列に分解する。
 * 通常の1文（話者ラベルなし）は null を返す。
 */
export function splitDialogueTurns(text: string): DialogueTurnLine[] | null {
  const lines = String(text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return null;
  const turns: DialogueTurnLine[] = [];
  for (const line of lines) {
    const m = line.match(/^([A-Za-z][A-Za-z0-9 .]{0,12}):\s*(.+)$/);
    if (!m) return null;
    turns.push({ speaker: m[1].trim(), text: m[2].trim() });
  }
  return turns.length >= 2 ? turns : null;
}

/**
 * 小問の選択肢記号（`1`〜`4` / `①`〜`④` / `(A)`〜`(D)`）から、対応する選択肢本文を返す。
 */
export function resolveChoiceOptionText(
  sq: Pick<SubQuestion, 'options' | 'optionTexts'>,
  rawMark: string | undefined | null,
): string {
  const mark = String(rawMark || '').trim();
  if (!mark || !Array.isArray(sq.options) || !Array.isArray(sq.optionTexts)) return '';
  const idx = sq.options.findIndex((o) => String(o).trim() === mark);
  if (idx < 0) return '';
  const txt = String(sq.optionTexts[idx] ?? '').trim();
  if (!txt || txt === mark || txt === '音声を聞いて選ぶ') return '';
  return txt;
}

/**
 * 解答・解説画面（Explanation.tsx）で使う、React に依存しない小さな関数。
 * 2026-10-13 のリファクタリングで Explanation.tsx の先頭から移した（中身は1文字も変えていない）。
 */

/**
 * その小問に「解答が入力されているか」（＝手を付けたか）。
 *
 * 結果画面で「解いていない問」と「解いたが間違えた問」を区別するための判定。
 * 以前はどちらも isAnswerCorrect が false になるため一律「不正解」と
 * 表示されており、「一問しか解いてないのに他のが全部不正解扱いになる」
 * というご指摘につながった。空文字・空白のみは未解答として扱う。
 */
export function isAttempted(answer: string | undefined | null): boolean {
  return String(answer ?? '').trim().length > 0;
}

/**
 * 解説の1画面表示（結果 → 英文 → 解説）に使う英文トラック。
 * リスニングは audioTracks、英文法は explanationTracks を返す。
 * 英文法の完成文トラックは解答前には伏せ、解説画面で音声URLまたは音声合成と文字に使う。
 */
export function textTracksOf(q: Pick<Problem, 'audioTracks' | 'explanationTracks'> | null | undefined): AudioTrack[] {
  if (!q) return [];
  if (Array.isArray(q?.audioTracks) && q.audioTracks.length) return q.audioTracks;
  return Array.isArray(q?.explanationTracks) ? q.explanationTracks : [];
}

/** 結果の所要時間（例：45秒 / 3分20秒） */
export function formatResultTime(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return s < 60 ? `${s}秒` : `${Math.floor(s / 60)}分${s % 60 ? `${s % 60}秒` : ''}`;
}

/**
 * 絵の問題（第1問B・第2問）：問題のイラストは ①〜④ の4コマが 2×2 に並んだ1枚の絵。
 * 選択肢 oi のコマを背景の位置で切り出す（画像を新しく作らずに、同じ絵を使い回す）。
 */
export function pictureCellOf(sq: Pick<SubQuestion, 'imageUrl'> | null | undefined, oi: number, n: number): React.CSSProperties | null {
  const url: string | undefined = sq?.imageUrl;
  if (!url || n !== 4 || oi < 0 || oi > 3 || !/^\/listening_(q1b|q2)\//.test(url)) return null;
  const col = oi % 2, row = Math.floor(oi / 2);
  const aspect = LISTENING_PICTURE_ASPECT[url] ?? 1;
  return { backgroundImage: `url("${url}")`, backgroundSize: '200% 200%', backgroundPosition: `${col * 100}% ${row * 100}%`, aspectRatio: String(aspect) };
}
