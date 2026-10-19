/**
 * =====================================================================
 * 記号パレットを「この設問に出すか」の判定ルール
 * =====================================================================
 *
 * ■ なぜ Quiz.tsx から切り出したのか
 *   ここは画面の描き方とは無関係な「判定」だけで、React も DOM も使わない。
 *   純関数なので単体で確かめられるほうがよい（数III積分の見張りテストが
 *   このルールを固定している）。
 *
 * ■ 動きは 1 バイトも変えていない
 *   関数名・引数・戻り値・判定順序・正規表現は Quiz.tsx にあったものと同一。
 */
import type { SubQuestionLike } from '../types/curriculum';

/** パレット判定が読む項目（小問のほか、問題単位の明示フラグも読む） */
type PaletteTarget = (NonNullable<SubQuestionLike> & { requiresChemicalPalette?: boolean; requiresMathPalette?: boolean }) | null | undefined;

/**
 * 解答文字列そのものが化学記号パレットの記号を必要とするか判定する。
 *
 * パレットは「入力補助」なので、判断材料は
 * **その設問の解答として実際に打ち込む文字列**に限るのが正しい。
 * 問題文や解説に「イオン」「酸化」などの語が含まれるだけでパレットを出すと、
 * 語句を答えるだけの設問にも大量に表示されてしまう（旧実装の問題点）。
 */
export function answerNeedsPalette(ansRaw: string): boolean {
  const ans = String(ansRaw);

  // 1. 上付き・下付き Unicode を含む（H₂O, Cu²⁺, 10⁻³ など）。
  //    ¹²³ は U+00B9/B2/B3 で U+2070-2079 の範囲外なので個別に列挙する。
  if (/[₀-₉⁰-⁹⁺⁻¹²³]/.test(ans)) return true;
  // 2. 反応式の記号（→ ⇌ ⇄ ↔）。
  //    ただし「1族→1」のような日本語の説明文中の矢印は反応式ではないので、
  //    元素記号になり得るラテン文字を含む場合に限る。
  if (/[→⇌⇄↔]/.test(ans) && /[A-Za-z]/.test(ans)) return true;
  // 3. TeX 風の上付き・下付き（e^-, ^2+, _8 など）
  if (/\^\{?[0-9]*[+\-−]/.test(ans) || /_\{?[0-9]/.test(ans)) return true;
  // 4. 元素記号＋数字／電荷（H2O, CaCO3, SO42- など）。
  //    ただし単位付きの数値（25 mL, 0.10 mol/L）は除外する。
  if (/(?:[A-Z][a-z]?\d*){1,}[\d+\-]/.test(ans) && /[A-Z]/.test(ans)) {
    const unitOnly =
      /^[\d.,\s×^\-+()/]*(?:mol|L|mL|g|kg|mg|cm|m|kJ|J|K|Pa|kPa|atm|%|℃|mol\/L|g\/mol|個)?[\d.,\s×^\-+()/]*$/i;
    if (!unitOnly.test(ans)) return true;
  }
  // 5. イオン式の平文表記（Na+, Cl-, OH-, NH4+ など）
  if (/[A-Z][A-Za-z]{0,3}\d*\s*[+\-]\s*$/.test(ans.trim())) return true;

  return false;
}


/**
 * この設問に「数学記号パレット」を出すか。
 *
 * 化学パレットと違い、数学は答えの文字列だけから確実に判定できないため
 * データ側の明示 opt-in（requiresMathPalette）を必須とする。
 * 数III積分の問題データ（mathIntegralProblems.ts）は全設問でこのフラグを立てている。
 */
export function requiresMathSymbols(question: PaletteTarget): boolean {
  if (!question?.requiresMathPalette) return false;
  const type = String(question?.type || '');
  if (
    type === 'multiple_choice' ||
    type === 'true_false' ||
    type === 'select' ||
    type === 'sorting'
  ) {
    return false;
  }
  return true;
}
