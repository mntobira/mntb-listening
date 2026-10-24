/**
 * 英文解釈の本文全訳（2026-10-24）
 *   文章ID → 段落ごとの和訳。段落の数・順番は本文（paragraphs）と同じ。
 *   ・設問の根拠の和訳（evidenceJa）と同じ言い回しにそろえてある（tests/readingTranslation.test.ts で確認）
 *   ・解説で「この段落の全訳」を出すのに使う。本文データとは別ファイル（翻訳の手直しで設問を触らないため）
 */
import { JA_LEVEL1 } from './level1';
import { JA_LEVEL2 } from './level2';
import { JA_LEVEL3 } from './level3';
import { JA_LEVEL4 } from './level4';
import { JA_LEVEL5 } from './level5';

export const READING_TRANSLATIONS: Readonly<Record<string, readonly string[]>> = {
  ...JA_LEVEL1, ...JA_LEVEL2, ...JA_LEVEL3, ...JA_LEVEL4, ...JA_LEVEL5,
};

/** 文章 id の第 para 段落（1〜）の和訳。無ければ null */
export function paragraphJa(passageId: string, para: number): string | null {
  return READING_TRANSLATIONS[passageId]?.[para - 1] ?? null;
}
