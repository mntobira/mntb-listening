/**
 * =====================================================================
 * 設問ラベルから「空欄トークン」を推定する／短答かどうかを判定する
 * =====================================================================
 *
 * ■ なぜ Quiz.tsx から切り出したのか
 *   どちらも文字列と設問オブジェクトを見るだけの純関数で、
 *   React にも DOM にも依存しない。分けておくと単体で確かめられる。
 *
 * ■ 動きは 1 バイトも変えていない
 *   正規表現・戻り値の並び順・判定条件は Quiz.tsx にあったものと同一。
 */
import type { SubQuestionLike } from '../types/curriculum';

/**
 * 設問ラベル（例: "問1 (ア)" / "(ア)" / "問3 (1) A"）から、
 * 問題文中でハイライトすべき「空欄トークン」を推定して返す。
 * 主に ( ア ) 〜 ( ス ) のような穴埋め記号を対象にする。
 * 見つからない場合は null を返す（＝ハイライトしない）。
 */
export function extractBlankToken(label: string): string | null {
  if (!label) return null;
  // カッコ内のカタカナ1文字（ア〜ン）や、丸数字・英字1文字などを拾う。
  // 例: "問1 (ア)" → "ア", "(イ)" → "イ"
  const kata = label.match(/[（(]\s*([ア-ンア-ヶ])\s*[)）]/);
  if (kata) return kata[1];
  return null;
}

/**
 * 問題文中に「( ア )」のように空白付きで書かれた空欄と、
 * 詰めて書かれた「(ア)」の両方に対応するため、ハイライト候補文字列を複数返す。
 */
export function blankHighlightVariants(token: string): string[] {
  return [
    `( ${token} )`,
    `(${token})`,
    `（ ${token} ）`,
    `（${token}）`,
  ];
}

/**
 * short_answer（短答穴埋め）かどうかの判定。
 * multiple_choice / sorting / descriptive 以外の短答入力を対象にする。
 */
export function isShortAnswerType(sq: SubQuestionLike): boolean {
  const t = sq?.type;
  return t !== 'multiple_choice' && t !== 'sorting' && t !== 'descriptive';
}

