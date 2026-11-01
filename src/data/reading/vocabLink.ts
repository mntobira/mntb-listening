/**
 * 英文解釈の重要表現 → 単語帳の「レベル・番号」（2026-10-31）
 *   ご要望：英文解釈の重要英単語と、単語帳の英単語の番号がつながって見えるように。
 *   番号は単語帳（英単語・英熟語）と同じ「レベルごとに 1 から」。対応表は vocabLinks.generated.ts。
 */
import { READING_VOCAB_LINKS, type ReadingVocabLink } from './vocabLinks.generated';

/** 単語帳のレベルの短い名前（画面の小さな札に入る長さ） */
export const VOCAB_LEVEL_SHORT: Readonly<Record<string, string>> = {
  lv1: '単語6割', lv2: '単語8割', lv3: '単語2次', lv4: '単語2次+',
  ilv1: '熟語6割', ilv2: '熟語8割', ilv3: '熟語2次',
};

export function vocabLinkOf(phrase: string): ReadingVocabLink | null {
  return READING_VOCAB_LINKS[phrase] ?? null;
}

/** 札の文字：「熟語6割 No.693」 */
export function vocabLinkLabel(link: ReadingVocabLink): string {
  return `${VOCAB_LEVEL_SHORT[link.level] ?? link.level} No.${link.no}`;
}
