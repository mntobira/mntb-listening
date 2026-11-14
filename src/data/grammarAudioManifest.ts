/**
 * ===================================================================
 * 英文法：登録済みMP3音源へのURL割り当て
 * ===================================================================
 * public/grammar_audio/<問題ID>.mp3 の音源を、grammarAudioIds.generated.ts のID一覧で管理する。
 * ID一覧は scripts/grammar-audio/make_ids.py で音源フォルダから再生成する。
 *
 * buildEgSet() が対応する音声URLを付与し、englishGrammarData.ts は正解を漏らさないよう
 * 解答前の audioTracks から explanationTracks へ移す。ProblemStatement は解説画面で再生UIを表示する。
 *
 * 名簿に無い問題は音声合成が script を読む（存在しないMP3への404を出さない）。
 */

import { GRAMMAR_AUDIO_ID_LIST } from './grammarAudioIds.generated';

/** 音源ファイルの置き場所（public/ 直下のフォルダ名） */
export const GRAMMAR_AUDIO_DIR = 'grammar_audio';

/**
 * 音源がある問題（小問）の ID。
 * 名簿は public/grammar_audio/ の一覧から自動生成：python3 scripts/grammar-audio/make_ids.py
 */
export const GRAMMAR_AUDIO_IDS: ReadonlySet<string> = new Set<string>(GRAMMAR_AUDIO_ID_LIST);

/** 問題ID → 音源の URL（名簿に無ければ undefined＝音声合成） */
export function grammarAudioUrl(subId: string): string | undefined {
  return GRAMMAR_AUDIO_IDS.has(subId) ? `/${GRAMMAR_AUDIO_DIR}/${subId}.mp3` : undefined;
}
