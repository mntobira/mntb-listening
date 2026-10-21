/**
 * ===================================================================
 * 数式組版エンジン（KaTeX ベース）
 * ===================================================================
 *
 * ■ なぜ作り直したか
 *   これまで数式は「正規表現で自作した HTML」（縦書き分数の span、
 *   math-sqrt、math-bigop …）で描画していた。その結果
 *     ・分数の横線・添字・∫ の大きさやベースラインが揃わない
 *     ・書体が font-serif / font-sans で混ざる
 *     ・x^n の n が本文と同じ大きさで浮いて見える
 *   という「崩れた数式」になっていた。
 *
 *   数式は文字装飾ではなく「組版」の問題である。
 *   そこで TeX の組版アルゴリズムをそのまま実装した KaTeX に任せ、
 *   数式専用書体（KaTeX_Math / Computer Modern）で描画する。
 *   Word の数式（Cambria Math）と同じ「分数・根号・上下限・添字が
 *   正しい大きさと位置に組まれる」状態になる。
 *
 * ■ 3つの入口
 *   (1) 明示 LaTeX  … $…$ / $$…$$ / \(…\) で囲む（作者が完全に制御）
 *   (2) 化学式      … \ce{2H2O -> 2H2 + O2}（mhchem 拡張）
 *   (3) 自動判定    … 既存データの素朴な記法
 *                     ∫[0→π/2] / x^(n+1)/(n+1) / √(x²+y²) / lim[n→∞] / 7C3
 *                     を「数式領域」として切り出し、LaTeX に変換して組む
 *
 *   (3) が要点で、既存の膨大な問題データを書き換えずに見た目を直せる。
 *   ただし日本語の本文・英語リスニングの文章・化学の単位（g/mol）を
 *   数式と誤認すると事故になるため、切り出しは
 *   「強いトリガ（∫ Σ √ lim …）を含む連続領域だけ」に限定する。
 */

// \ce{...}（化学式・反応式）用の拡張。import した時点でマクロが登録される。
import 'katex/dist/contrib/mhchem.mjs';
// 生テキストの最小エスケープは、リスニング側（listeningExplanation.ts）と
// 同じ作法でなければ表示が食い違うので、sanitizeHtml.ts の1つだけを使う
// （以前はこのファイルにも同じ実装が書かれていた）。
// sanitizeHtml.ts は何も import しない末端モジュールなので循環にならない。
import { escapeHtml } from './sanitizeHtml';
import { scanChemRegions, toChemLatex, type MathRegion } from './mathChemTypeset';
import { renderLatex, toLatex, scanMathRegions } from './mathTypesetCore';
export { typesetHtmlMath } from './mathHtmlTypeset';
export { KATEX_WRAPPER_CLASS, renderLatex, toLatex, mayContainMath, scanMathRegions, hasExplicitMath } from './mathTypesetCore';
export { scanChemRegions, toChemLatex, type MathRegion };

export interface TypesetOptions {
  /** アプリ独自記法の自動判定を行うか（既定: true） */
  auto?: boolean;
  /** 数学の本文と明示された場合のみ、短い分数・指数も検出する。 */
  context?: 'math';
}

/**
 * プレーンテキストを「数式は KaTeX、それ以外は素のテキスト」の
 * 断片列に分解する。HTML 化は呼び出し側に任せる（既存の
 * 化学式フォーマッタと組み合わせるため）。
 */
export interface TypesetPiece {
  kind: 'text' | 'math';
  /**
   * text のときは素のテキスト。
   * math のときは **変換済みの LaTeX**（そのまま renderLatex に渡せる）。
   *
   * ★呼び出し側で再度 toLatex() を掛けてはいけない★
   *   toLatex は冪等ではないため（例: `\left(` の中の `\frac` に
   *   もう一度 (13) の規則が当たり `\left\left(` になって組版が失敗する）、
   *   二重適用すると数式が赤いエラー表示になる。
   */
  value: string;
  /** 元のテキスト（スクリーンリーダ向けラベル用。math のときのみ） */
  source?: string;
  /** math のときの表示形式 */
  display?: boolean;
}

export function splitMathPieces(text: string, options: TypesetOptions = {}): TypesetPiece[] {
  const { auto = true, context } = options;
  const pieces: TypesetPiece[] = [];

  // --- (a) 明示マークアップを最優先で切り出す ---
  //   $$…$$（別行立て） / $…$（行内） / \(…\) / \[…\] / \ce{…}
  const EXPLICIT = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$|\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]|(\\ce\{(?:[^{}]|\{[^{}]*\})*\})/g;

  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = EXPLICIT.exec(text)) !== null) {
    if (m.index > last) {
      pieces.push(...splitAutoPieces(text.slice(last, m.index), auto, context === 'math'));
    }
    // 明示マークアップの中身は「著者が書いた LaTeX」なので変換しない。
    if (m[1] !== undefined) pieces.push({ kind: 'math', value: m[1], display: true });
    else if (m[2] !== undefined) pieces.push({ kind: 'math', value: m[2] });
    else if (m[3] !== undefined) pieces.push({ kind: 'math', value: m[3] });
    else if (m[4] !== undefined) pieces.push({ kind: 'math', value: m[4], display: true });
    else if (m[5] !== undefined) pieces.push({ kind: 'math', value: m[5] });
    last = m.index + m[0].length;
  }
  if (last < text.length) pieces.push(...splitAutoPieces(text.slice(last), auto, context === 'math'));

  return pieces;
}

/**
 * 自動判定。
 *
 * 数式（∫ Σ √ …）と化学式（H₂O, 反応式）の両方を拾う。
 * 数式を先に確定させ、その「隙間」だけを化学式として調べる
 * （数式の中の英字を化学式と誤認させないため）。
 */
function splitAutoPieces(text: string, auto: boolean, mathContext = false): TypesetPiece[] {
  if (!auto || !text) return text ? [{ kind: 'text', value: text }] : [];

  const mathRegions = scanMathRegions(text, mathContext);

  // 数式に取られなかった範囲から化学式を探す
  const chemRegions: MathRegion[] = [];
  let scanFrom = 0;
  for (const region of [...mathRegions, { start: text.length, end: text.length, text: '' }]) {
    if (!mathContext && region.start > scanFrom) {
      const gap = text.slice(scanFrom, region.start);
      for (const c of scanChemRegions(gap)) {
        chemRegions.push({ start: scanFrom + c.start, end: scanFrom + c.end, text: c.text });
      }
    }
    scanFrom = Math.max(scanFrom, region.end);
  }

  type Marked = MathRegion & { chem: boolean };
  const regions: Marked[] = [
    ...mathRegions.map((r) => ({ ...r, chem: false })),
    ...chemRegions.map((r) => ({ ...r, chem: true })),
  ].sort((a, b) => a.start - b.start);

  if (regions.length === 0) return [{ kind: 'text', value: text }];

  const pieces: TypesetPiece[] = [];
  let cursor = 0;
  for (const region of regions) {
    if (region.start < cursor) continue; // 念のため重なりを飛ばす
    if (region.start > cursor) pieces.push({ kind: 'text', value: text.slice(cursor, region.start) });
    // value は LaTeX、source は読み上げ用の元テキスト
    const latex = region.chem ? toChemLatex(region.text) : toLatex(region.text);
    if (latex === null) {
      // 化学式として組めなかった（判定後に落ちた）ならテキストのまま
      pieces.push({ kind: 'text', value: region.text });
    } else {
      pieces.push({ kind: 'math', value: latex, source: region.text });
    }
    cursor = region.end;
  }
  if (cursor < text.length) pieces.push({ kind: 'text', value: text.slice(cursor) });
  return pieces;
}

/**
 * テキストを HTML に組む（数式は KaTeX、それ以外はエスケープのみ）。
 * 化学式の整形が不要な場所で使う。
 */
export function typesetMath(text: string, options: TypesetOptions = {}): string {
  return splitMathPieces(text, options)
    .map((piece) =>
      piece.kind === 'math'
        // piece.value は splitMathPieces が変換し終えた LaTeX。ここで
        // 再変換すると \left\left( のように壊れるので、そのまま渡す。
        ? renderLatex(piece.value, {
            displayMode: piece.display,
            ariaLabel: piece.source ?? piece.value,
          })
        : escapeHtml(piece.value),
    )
    .join('');
}
