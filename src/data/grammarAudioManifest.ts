/**
 * ===================================================================
 * 英文法：音源のある問題の名簿（2026-10-31 E9 の下準備）
 * ===================================================================
 * ご要望：英文法の解説も、リスニングのように「音声に合わせて表示」できるように準備する。
 *
 * ■ 今の状態
 *   英文法には音源ファイルが無く、端末の音声合成が完成文を読んでいる（audioUrl 未設定）。
 *   ★音源の生成はしていない（生成費用がかかるため、ご了承をいただいてから）★
 *
 * ■ 音源が届いたらやること（コードの変更は不要）
 *   1. public/grammar_audio/<問題ID>.mp3 に置く（問題IDは音読文PDFの灰色の行。例 q_eg6_1_set1_1）
 *   2. 下の GRAMMAR_AUDIO_IDS にその問題IDを足す
 *   3. npx tsx scripts/readalong/dump_tracks.ts > .tmp_ui/rd/tracks.json
 *      python3 scripts/readalong/align_readalong.py
 *      → public/read_along/grammar_audio/<問題ID>.json（単語ごとの時刻）ができる
 *   すると buildEgSet() が audioUrl を付け、リスニングと同じ ScriptReading が
 *   「今読んでいる語の色づけ・語をタップしてその位置から再生」を出す。
 *
 * 名簿に無い問題は今までどおり音声合成（音源ファイルを探しに行かない＝404 を出さない）。
 */

/** 音源ファイルの置き場所（public/ 直下のフォルダ名） */
export const GRAMMAR_AUDIO_DIR = 'grammar_audio';

/** 音源がある問題（小問）の ID。いまは空 */
export const GRAMMAR_AUDIO_IDS: ReadonlySet<string> = new Set<string>([
  // 'q_eg6_1_set1_1',
]);

/** 問題ID → 音源の URL（名簿に無ければ undefined＝音声合成） */
export function grammarAudioUrl(subId: string): string | undefined {
  return GRAMMAR_AUDIO_IDS.has(subId) ? `/${GRAMMAR_AUDIO_DIR}/${subId}.mp3` : undefined;
}
