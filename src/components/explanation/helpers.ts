import type React from 'react';
import { LISTENING_PICTURE_ASPECT } from '../../data/listeningPictureAspect';
import type { AudioTrack, Problem, SubQuestion } from '../../types/curriculum';

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
 * リスニングは音源つき（audioTracks）、英文法は音を出さない文字だけ（explanationTracks）。
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
