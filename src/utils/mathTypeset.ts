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

import katex from 'katex';
// \ce{...}（化学式・反応式）用の拡張。import した時点でマクロが登録される。
import 'katex/dist/contrib/mhchem.mjs';
// 生テキストの最小エスケープは、リスニング側（listeningExplanation.ts）と
// 同じ作法でなければ表示が食い違うので、sanitizeHtml.ts の1つだけを使う
// （以前はこのファイルにも同じ実装が書かれていた）。
// sanitizeHtml.ts は何も import しない末端モジュールなので循環にならない。
import { escapeHtml } from './sanitizeHtml';
import {
  SUBSCRIPT_CHARS,
  SUPERSCRIPT_CHARS,
  scanChemRegions,
  toChemLatex,
  type MathRegion,
} from './mathChemTypeset';
export { scanChemRegions, toChemLatex, type MathRegion };

/** KaTeX 出力を包む目印クラス（CSS で本文となじませるために使う）。 */
export const KATEX_WRAPPER_CLASS = 'mtb-math';

/**
 * LaTeX を KaTeX で HTML に組む。
 *
 * - output: 'html' 固定
 *   既定は MathML 併記だが、本アプリのサニタイザは <math> を
 *   「中身ごと破棄」する危険タグ扱いにしているため二重表示・欠落の元になる。
 *   読み上げは外側 span の aria-label で担保する。
 * - throwOnError: false … 変換に失敗しても画面を壊さない。
 */
export function renderLatex(
  latex: string,
  options: { displayMode?: boolean; ariaLabel?: string } = {},
): string {
  const { displayMode = false, ariaLabel } = options;
  const source = latex.trim();
  if (!source) return '';
  try {
    const html = katex.renderToString(source, {
      displayMode,
      output: 'html',
      throwOnError: false,
      strict: false,
      trust: false,
      // 記述問題の解答欄など生徒の入力が流れ込む経路があるため、
      // マクロ展開の暴走（\def の再帰など）を抑える。
      maxExpand: 300,
    });
    const label = escapeHtml(ariaLabel ?? source);
    return `<span class="${KATEX_WRAPPER_CLASS}${displayMode ? ' mtb-math-block' : ''}" aria-label="${label}">${html}</span>`;
  } catch {
    return `<span class="${KATEX_WRAPPER_CLASS}-fallback">${escapeHtml(source)}</span>`;
  }
}

// ===================================================================
// 1. アプリ独自のテキスト記法 → LaTeX
// ===================================================================

/** 数式内で立体（ローマン体）で組む関数名。 */
const MATH_FUNCTIONS = [
  'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh',
  'sin', 'cos', 'tan', 'sec', 'csc', 'cot',
  'log', 'ln', 'exp', 'lim', 'max', 'min', 'gcd', 'det', 'mod',
];
const MATH_FUNCTION_SET = new Set(MATH_FUNCTIONS);

/**
 * 分数化してはいけない「単位」。
 * g/mol・mol/L・kJ/mol などは横書きのままが正しい表記。
 */
const UNIT_TOKENS = new Set([
  'mol', 'L', 'mL', 'g', 'kg', 'mg', 'cm', 'cm2', 'cm3', 'm', 'm2', 'm3',
  'kJ', 'J', 'kcal', 'cal', 'K', 's', 'min', 'h', 'Pa', 'kPa', 'atm', 'N',
  'V', 'A', 'W', 'dm', 'dm3', 'mmol', 'mol/L', 'g/mol',
]);

/** 数式で使う Unicode 記号 → LaTeX コマンド。 */
const SYMBOL_REPLACEMENTS: Array<[RegExp, string]> = [
  [/[−–—]/g, '-'],
  [/×/g, ' \\times '],
  [/÷/g, ' \\div '],
  [/[·・]/g, ' \\cdot '],
  [/≠/g, ' \\neq '],
  [/[≦≤]/g, ' \\leq '],
  [/[≧≥]/g, ' \\geq '],
  [/±/g, ' \\pm '],
  [/∓/g, ' \\mp '],
  [/[≒≈]/g, ' \\fallingdotseq '],
  [/⇔/g, ' \\Leftrightarrow '],
  [/⇒/g, ' \\Rightarrow '],
  [/∈/g, ' \\in '],
  [/∩/g, ' \\cap '],
  [/∪/g, ' \\cup '],
  [/∴/g, ' \\therefore '],
  [/∵/g, ' \\because '],
  [/∠/g, ' \\angle '],
  [/[→⟶]/g, ' \\to '],
  [/∞/g, '\\infty '],
  [/π/g, '\\pi '],
  [/θ/g, '\\theta '],
  [/α/g, '\\alpha '],
  [/β/g, '\\beta '],
  [/γ/g, '\\gamma '],
  [/Δ/g, '\\Delta '],
  [/δ/g, '\\delta '],
  [/λ/g, '\\lambda '],
  [/μ/g, '\\mu '],
  [/ω/g, '\\omega '],
  [/φ/g, '\\varphi '],
  [/Ω/g, '\\Omega '],
];

/** `(` `{` に対応する閉じ括弧を前方に探す。見つからなければ -1。 */
function matchForward(s: string, openIndex: number): number {
  const open = s[openIndex];
  const close = open === '(' ? ')' : '}';
  let depth = 0;
  for (let i = openIndex; i < s.length; i++) {
    if (s[i] === open) depth++;
    else if (s[i] === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** `)` `}` に対応する開き括弧を後方に探す。見つからなければ -1。 */
function matchBackward(s: string, closeIndex: number): number {
  const close = s[closeIndex];
  const open = close === ')' ? '(' : '{';
  let depth = 0;
  for (let i = closeIndex; i >= 0; i--) {
    if (s[i] === close) depth++;
    else if (s[i] === open) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

const IDENT_CHAR = /[A-Za-z0-9.]/;

/**
 * `/` の左側にある「1つの数式のかたまり（atom）」を後方に読み取る。
 * 例: `x^{n+1}` / `\sqrt{x}` / `\frac{a}{b}` / `2.5` / `\pi`
 */
function readLeftAtom(s: string, end: number): { start: number; text: string } | null {
  let i = end;
  while (i > 0 && s[i - 1] === ' ') i--;
  const atomEnd = i;
  if (i === 0) return null;

  let consumed = false;
  while (i > 0) {
    const c = s[i - 1];

    if (c === ')' || c === '}') {
      const open = matchBackward(s, i - 1);
      if (open < 0) break;
      i = open;
      consumed = true;
      // \frac{a}{b} のように引数グループが連続する場合はまとめて取り込む
      while (i > 0 && s[i - 1] === '}') {
        const prevOpen = matchBackward(s, i - 1);
        if (prevOpen < 0) break;
        i = prevOpen;
      }
      // グループの直前にコマンド名があれば一体（\sqrt{...}）
      let j = i;
      while (j > 0 && /[A-Za-z]/.test(s[j - 1])) j--;
      if (j > 0 && s[j - 1] === '\\') i = j - 1;
      else if (c === ')' && /^[fgPQ]$/.test(s.slice(j, i))) i = j;
      // 添字・指数は基底と一体（x^{5} の {5} を読んだあと x へ続ける）
      if (i > 0 && (s[i - 1] === '^' || s[i - 1] === '_')) { i--; continue; }
      break;
    }

    if (IDENT_CHAR.test(c)) {
      let j = i;
      while (j > 0 && IDENT_CHAR.test(s[j - 1])) j--;
      if (j > 0 && s[j - 1] === '\\') j--;      // \pi, \infty
      i = j;
      consumed = true;
      if (i > 0 && (s[i - 1] === '^' || s[i - 1] === '_')) { i--; continue; }
      break;
    }

    break;
  }

  if (!consumed) return null;
  return { start: i, text: s.slice(i, atomEnd) };
}

/** 添字・指数（^{...} / ^2 / _n）を前方に読み進める。 */
function skipScripts(s: string, from: number): number {
  let i = from;
  while (i < s.length && (s[i] === '^' || s[i] === '_')) {
    let j = i + 1;
    if (s[j] === '{') {
      const close = matchForward(s, j);
      if (close < 0) break;
      j = close + 1;
    } else if (j < s.length && /[A-Za-z0-9]/.test(s[j])) {
      j++;
    } else {
      break;
    }
    i = j;
  }
  return i;
}

/**
 * `/` の右側にある atom を前方に読み取る。
 * 例: `(n+1)` → `n+1` / `\cos^{2}x` / `\log a` / `x^{3}`
 */
function readRightAtom(s: string, start: number): { end: number; text: string } | null {
  let i = start;
  while (i < s.length && s[i] === ' ') i++;
  if (i >= s.length) return null;

  const atomStart = i;
  let sign = '';
  if (s[i] === '-' || s[i] === '+') { sign = s[i]; i++; }

  // 括弧グループ → 外側の括弧は分数の中では不要なので外す
  if (s[i] === '(' || s[i] === '{') {
    const close = matchForward(s, i);
    if (close < 0) return null;
    const inner = s.slice(i + 1, close);
    let end = skipScripts(s, close + 1);
    const scripts = s.slice(close + 1, end);
    // 指数が付く場合は括弧を残す（(x+1)^2）
    const text = scripts ? `${sign}(${inner})${scripts}` : `${sign}${inner}`;
    return { end, text };
  }

  // コマンド（\pi, \sqrt{...}, \cos^{2}x, \log a）
  if (s[i] === '\\') {
    let j = i + 1;
    while (j < s.length && /[A-Za-z]/.test(s[j])) j++;
    const cmd = s.slice(i + 1, j);
    i = j;
    while (i < s.length && s[i] === '{') {
      const close = matchForward(s, i);
      if (close < 0) break;
      i = close + 1;
    }
    i = skipScripts(s, i);
    // 関数はその引数までを1つの atom とみなす（1/cos^2 x → 分母は cos²x）
    if (MATH_FUNCTION_SET.has(cmd)) {
      let k = i;
      while (k < s.length && s[k] === ' ') k++;
      if (k < s.length && /[A-Za-z0-9]/.test(s[k])) {
        let m = k;
        while (m < s.length && IDENT_CHAR.test(s[m])) m++;
        m = skipScripts(s, m);
        i = m;
      }
    }
    return { end: i, text: s.slice(atomStart, i) };
  }

  if (!IDENT_CHAR.test(s[i])) return null;
  while (i < s.length && IDENT_CHAR.test(s[i])) i++;
  i = skipScripts(s, i);
  if (/^[fgPQ]$/.test(s.slice(atomStart, i)) && s[i] === '(') {
    const close = matchForward(s, i);
    if (close >= 0) i = close + 1;
  }
  return { end: i, text: s.slice(atomStart, i) };
}

/** atom 文字列が単位（g / mol / L …）かどうか。単位は分数化しない。 */
function isUnitAtom(text: string): boolean {
  const t = text.trim().replace(/^\{|\}$/g, '');
  return UNIT_TOKENS.has(t);
}

/**
 * `a/b` を `\frac{a}{b}` へ組み替える。
 * 左右の atom を構文的に読み取るので、`x^{n+1}/(n+1)` のように
 * 指数や括弧が付いていても「どこまでが分子・分母か」を取り違えない。
 */
function buildFractions(src: string): string {
  let s = src;
  let cursor = 0;

  while (cursor < s.length) {
    const slash = s.indexOf('/', cursor);
    if (slash < 0) break;

    const left = readLeftAtom(s, slash);
    const right = readRightAtom(s, slash + 1);

    if (!left || !right || isUnitAtom(left.text) || isUnitAtom(right.text)) {
      cursor = slash + 1;
      continue;
    }

    const numerator = left.text.startsWith('(') && matchForward(left.text, 0) === left.text.length - 1
      ? left.text.slice(1, -1)
      : left.text;
    const frac = `\\frac{${numerator}}{${right.text}}`;
    s = s.slice(0, left.start) + frac + s.slice(right.end);
    cursor = left.start + frac.length;
  }

  return s;
}

/**
 * アプリのテキスト記法を LaTeX に変換する。
 * 既に LaTeX で書かれている部分（\frac など）はそのまま通る。
 */
export function toLatex(src: string): string {
  let t = src;

  // (0) Unicode の上付き・下付きを ^{} _{} に統一
  t = t.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿ]+/g, (run) =>
    `^{${[...run].map((c) => SUPERSCRIPT_CHARS[c] ?? '').join('')}}`,
  );
  t = t.replace(/[₀₁₂₃₄₅₆₇₈₉]+/g, (run) =>
    `_{${[...run].map((c) => SUBSCRIPT_CHARS[c] ?? '').join('')}}`,
  );

  // (1) 上下限つきの ∫ / Σ（∫[0→π/2] ・ Σ[k=1→n]）
  //     中身は再帰的に変換する（π/2 → \frac{\pi}{2}）
  t = t.replace(/∫\s*\[([^[\]]{1,32}?)\s*(?:→|,)\s*([^[\]]{1,32}?)\]/g,
    (_m, lo: string, hi: string) => `\\int_{${toLatex(lo)}}^{${toLatex(hi)}}`);
  t = t.replace(/[Σ∑]\s*\[([^[\]]{1,32}?)\s*(?:→|,)\s*([^[\]]{1,32}?)\]/g,
    (_m, lo: string, hi: string) => `\\sum_{${toLatex(lo)}}^{${toLatex(hi)}}`);
  t = t.replace(/∫/g, '\\int ');
  t = t.replace(/[Σ∑]/g, '\\sum ');

  // (2) 極限 lim[n→∞] → \lim_{n \to \infty}
  t = t.replace(/lim\s*\[([^[\]]{1,32})\]/g,
    (_m, cond: string) => `\\lim_{${toLatex(cond)}}`);

  // (3) 根号 √(…) / √x / √25
  t = t.replace(/√\s*\(((?:[^()]|\([^()]{0,40}\)){1,80}?)\)/g,
    (_m, body: string) => `\\sqrt{${toLatex(body)}}`);
  t = t.replace(/√\s*([0-9]+(?:\.[0-9]+)?|[A-Za-z](?:\^\{[^{}]*\})?)/g,
    (_m, body: string) => `\\sqrt{${body}}`);

  // (4) 順列・組合せ 7C3 / nCr → ₇C₃
  t = t.replace(/(?<![A-Za-z0-9\\])([0-9]{1,2}|n)([CP])([0-9]{1,2}|[rk])(?![A-Za-z0-9])/g,
    (_m, n: string, cp: string, r: string) => `{}_{${n}}\\mathrm{${cp}}_{${r}}`);

  // (5) 関数名を立体に（\sin \cos \log …）。長い名前から順に置換する。
  for (const fn of MATH_FUNCTIONS) {
    t = t.replace(new RegExp(`(?<![A-Za-z\\\\])${fn}(?![A-Za-z])`, 'g'), `\\${fn} `);
  }
  // 関数名の直後に付く指数は関数と一体で扱う（\cos ^2x → \cos^2x）。
  // ここで空白を詰めないと、分数化のときに分母が「\cos だけ」になり
  // 「1/cos²x」が「(1/cos)²x」の形に崩れる。
  t = t.replace(/\\([a-z]+) +\^/g, '\\$1^');

  // (6) 指数・添字の波括弧化（^(n+1) → ^{n+1}、^2 → ^{2}）
  t = t.replace(/\^\(([^()]{1,40})\)/g, (_m, exp: string) => `^{${toLatex(exp)}}`);
  t = t.replace(/\^([A-Za-z0-9])(?![A-Za-z0-9])/g, '^{$1}');
  t = t.replace(/\^(-[0-9]+)(?![0-9])/g, '^{$1}');
  t = t.replace(/_\(([^()]{1,40})\)/g, '_{$1}');
  t = t.replace(/_([A-Za-z0-9])(?![A-Za-z0-9])/g, '_{$1}');

  // (7) Unicode 記号 → LaTeX コマンド
  //     ★分数化より前に済ませる（\pi/2 を分数として拾えるようにする）
  for (const [re, rep] of SYMBOL_REPLACEMENTS) t = t.replace(re, rep);

  // (8) 絶対値 |x| → \left|x\right|（縦線の高さを中身に合わせる）
  //
  // ★すでに \left| \right| になっている縦線は二度と触らない★
  //   toLatex は √(…) や lim[…] の中身に対して自分自身を再帰で呼ぶ。
  //   すると内側で \left|a\right| まで組み終わった文字列が
  //   外側の (8) にもう一度渡り、`|a\right|` を新しい絶対値と誤認して
  //   \left\left|a\right\right| という壊れた LaTeX になっていた。
  //   （実例：√(|a|²|b|² − (a·b)²) がベクトルのまとめプリントで
  //     KaTeX エラーになっていた。）
  //   そこで
  //     ・開き側は直前が \left / \right なら対象外（lookbehind）
  //     ・中身に \right を含む並びは対象外（tempered token）
  //   の二重のガードを掛ける。
  t = t.replace(
    /(?<!\\left)(?<!\\right)\|((?:(?!\\right)[^|]){1,40})\|/g,
    (_m, body: string) => `\\left|${body}\\right|`,
  );

  // (9) 分数
  t = buildFractions(t);

  // (10) 微分要素 dx は前に細い空白を入れて「かけ算」と見分けられるように
  t = t.replace(/(?<![A-Za-z\\])d([xytuvrsz]|\\theta)(?![A-Za-z])/g, '\\,d$1');

  // (11) 掛け算のアスタリスク
  t = t.replace(/\s*\*\s*/g, ' \\times ');

  // (12) 導関数のプライム。全角の ′ や ’ も ASCII の ' に寄せる
  t = t.replace(/[′’]/g, "'");

  // (13) 分数や根号を囲む括弧は \left( \right) にして高さを中身に合わせる。
  //      (1/2)e^x の括弧が分数より低いと「1/2 が括弧から飛び出す」ため。
  t = t.replace(/\(([^()]*\\(?:frac|sqrt|int|sum)[^()]*)\)/g,
    (_m, body: string) => `\\left(${body}\\right)`);

  // 余分な空白を整える（LaTeX では空白は組版に影響しない）
  return t.replace(/[ \t]{2,}/g, ' ').trim();
}

// ===================================================================
// 1b. 化学式・化学反応式（mhchem）
// ===================================================================
//
// ■ なぜ専用の処理を足したか
//   化学式は今まで「元素記号を Cambria Math の斜体寄りフォントで描き、
//   係数だけ <sub class="font-sans">」という作りだった。
//   フォントが2種類混ざるため、H₂O の H と 2 で太さ・字面が揃わず、
//   反応式が並ぶと行がガタガタに見えていた（ご指摘の「汚い」の一因）。
//
//   化学は TeX の世界では mhchem が標準で、
//     \ce{2HCl + Ca(OH)2 -> CaCl2 + 2H2O}
//   と書けば
//     ・元素記号は立体（化学の約束。斜体は物理量の意味になる）
//     ・係数・添字の大きさと位置
//     ・矢印 → ⇄ の長さと前後の空き
//   まで規約どおりに組まれる。数式と同じ KaTeX で組むので、
//   解説文中で数式と化学式が隣り合っても字面が揃う。
//
// ■ 誤爆させないための考え方
//   「英大文字で始まる語」を化学式と見なすと English や人名まで壊れる。
//   そこで
//     (1) 元素記号の並びとして完全に説明できる語だけを化学式と認める
//     (2) 単位（mol/L, g など）や英単語は明示的に除外する
//     (3) 反応式は「矢印を含み、両辺が化学式だけ」のときのみ式全体を組む
//   の3段構えにしている。

// ===================================================================
// 2. 混在テキストから「数式領域」を切り出す
// ===================================================================

/**
 * 数式として組んでよいと判断できる「トリガ」。
 *
 * ★ここに素の `^` や `/` を入れてはいけない★
 *   化学の Fe^2+ / cm^3 / g/mol まで数式扱いになり、
 *   単位が斜体になったり化学式の整形が壊れる。
 *   それらは従来の化学式フォーマッタが正しく描画している。
 *
 * 採用したトリガはいずれも「化学式・英語本文には現れない形」だけ:
 *   ∫ Σ √ ∞ π      … 数学記号そのもの
 *   lim[…]          … 極限
 *   7C3 / nCr       … 順列・組合せ
 *   x^(n+1)         … 括弧つき指数（化学は Fe^2+ のように括弧を使わない）
 *   (x^n)' (sin x)' … 導関数のプライム（化学・英語には出ない）
 *   \frac \int …    … データに直接書かれた LaTeX
 */
const STRONG_TRIGGER = new RegExp(
  [
    '[∫Σ∑√∞π]',
    '(?<![A-Za-z])lim\\s*\\[',
    '(?<![A-Za-z0-9])(?:[0-9]{1,2}|n)[CP](?:[0-9]{1,2}|[rk])(?![A-Za-z0-9])',
    '\\^\\(',                                    // 括弧つき指数 x^(n+1)
    '\\)\\s*\u2032|\\)\\s*\'',                   // 導関数 (x^n)'
    // 指数を含む分数 x^5/5・a^{n}/2。
    // 化学の cm^3/g・mol^-1 は下の単位ガードで除外されるので誤爆しない。
    '[A-Za-z0-9]\\^\\{?-?[0-9A-Za-z+]+\\}?\\s*/',
    // 括弧つき分数を含む式 (1/2)e^x・(2/9)(x^3+2)
    '\\([0-9]{1,3}\\s*/\\s*[0-9]{1,3}\\)',
    '\\\\(?:frac|int|sqrt|sum|lim|dfrac|tfrac)\\b',
  ].join('|'),
);

/**
 * 「このテキストは数式走査を掛ける価値があるか」の高速判定。
 *
 * 全文の 99% は数式を含まないので、重い scanMathRegions を回す前に弾く。
 * ★STRONG_TRIGGER と必ず同じ条件を見ること★
 *   ここだけ条件が古いと、トリガを増やしても実アプリでは数式にならない
 *   （テストは splitMathPieces を直接呼ぶので気付けない）というズレが起きる。
 *   そのため判定を STRONG_TRIGGER 自身に委ね、明示マークアップだけ足す。
 */
export function mayContainMath(text: string): boolean {
  if (!text) return false;
  if (hasExplicitMath(text) || STRONG_TRIGGER.test(text)) return true;
  // 化学式・反応式（H₂O, SO₄²⁻, → を含む式）も対象にする。
  // ここは「可能性があるか」の粗い判定でよく、確定は scanChemRegions が行う。
  return CHEM_HINT.test(text);
}

/**
 * 化学式が含まれ得るか、の粗い判定。
 *
 * 大文字＋小文字/数字の並び（Na, H2, SO4）や Unicode 添字・電荷・矢印を見る。
 * ここで拾い過ぎても scanChemRegions が元素記号の並びとして
 * 検証するので誤変換にはならない（性能のための門番でしかない）。
 */
const CHEM_HINT = /[₀-₉]|[⁰-⁹⁺⁻]|[→⟶⇄⇌⟷⇔]|[A-Z][a-z]?[0-9]|[A-Z][a-z][A-Z]|[A-Z][+-]/;

/**
 * 数式領域として連続して取り込める文字。
 * 日本語・全角記号・「%」「℃」などは含めない（そこで領域が切れる）。
 */
const MATH_CHAR = /[0-9A-Za-z+\-−–—=×÷·・^_/!'’′\\()[\]{}|,.<>≠≦≧≤≥≒≈∫Σ∑√πθαβγλμωφΔδΩ∞→⟶∈∩∪∴∵∠±∓⇔⇒⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿ₀₁₂₃₄₅₆₇₈₉ \t]/;

/** 領域の端に付いた「数式ではない文字」を落とす。 */
function trimRegion(text: string): string {
  return text
    .replace(/^[\s,.]+/, '')
    .replace(/[\s,.]+$/, '')
    // 対応の取れない閉じ括弧が末尾に残る場合は外す（例: 「（∫ x dx）」の ）は全角なので別だが保険）
    .replace(/^\)+/, '')
    .trim();
}

/** 領域が「実質的に数式」か（記号だけ・単語だけの誤検出を弾く）。 */
function looksLikeMath(text: string, mathContext = false): boolean {
  // 数学と明示された画面だけは短い分数・指数・座標も対象にする。
  if (!mathContext && !STRONG_TRIGGER.test(text)) return false;
  if (mathContext && !/[A-Za-z0-9∫Σ∑√πθαβγ∞]/.test(text)) return false;

  // 英単語の羅列（リスニング本文など）は数式にしない。
  // 数式で使う関数名・LaTeX コマンドだけを既知語として許可する。
  const words = text.match(/[A-Za-z]{4,}/g) || [];
  const known = new Set([
    ...MATH_FUNCTIONS, 'sqrt', 'infty', 'frac', 'dfrac', 'tfrac',
    'left', 'right', 'times', 'cdot', 'theta', 'alpha', 'beta', 'gamma',
    'lambda', 'omega', 'varphi', 'delta', 'mathrm', 'text',
  ]);
  if (words.some((w) => !known.has(w.toLowerCase()))) return false;

  // 単位を含む領域（22.4 L / 1 mol など）は化学の換算式なので数式化しない。
  // KaTeX に渡すと L や mol が斜体の変数になってしまう。
  if (!mathContext && [...UNIT_TOKENS].some((u) => new RegExp(`(?<![A-Za-z])${u}(?![A-Za-z])`).test(text))) {
    return false;
  }

  return true;
}

/**
 * テキスト中の数式領域を列挙する。
 * 「MATH_CHAR の連続」を候補にし、強いトリガを含むものだけ採用する。
 */
export function scanMathRegions(text: string, mathContext = false): MathRegion[] {
  const regions: MathRegion[] = [];
  let i = 0;

  while (i < text.length) {
    if (!MATH_CHAR.test(text[i])) { i++; continue; }

    let j = i;
    while (j < text.length && MATH_CHAR.test(text[j])) j++;

    const raw = text.slice(i, j);
    const trimmed = trimRegion(raw);
    if (trimmed && looksLikeMath(trimmed, mathContext)) {
      const offset = raw.indexOf(trimmed);
      regions.push({ start: i + offset, end: i + offset + trimmed.length, text: trimmed });
    }
    i = j;
  }

  return regions;
}

// ===================================================================
// 3. 明示 LaTeX（$…$ / $$…$$ / \(…\) / \ce{…}）
// ===================================================================

/** テキストに明示的な数式マークアップが含まれるか。 */
export function hasExplicitMath(text: string): boolean {
  return /\$[^$\n]+\$|\\\(|\\ce\{|\\\[/.test(text);
}

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

// ===================================================================
// 4. すでに HTML になっている本文の中の数式を組み直す
// ===================================================================
//
// まとめプリント（src/data/learningContent/*.ts）は HTML 文字列で
// 書かれており、指数が <sup>n</sup>、添字が <sub>2</sub> になっている。
//   例: <li>(x<sup>n</sup>)' = nx<sup>n−1</sup>、(sin x)' = cos x</li>
// これは「本文の文字を小さくして上に寄せただけ」なので、
// 分数・∫・根号が混ざると途端に崩れる。
//
// そこで <sup>/<sub> を一旦 ^{…}/_{…} の記法に戻して数式領域を判定し、
// 数式と判定できた範囲だけ KaTeX で組み直す。
// 数式でなかった範囲は元の HTML をそのまま返す（化学式・英文は無変更）。

/** 数式化の対象にしてよいインラインタグ（中身が短いものだけ）。 */
const SCRIPT_TAG_RE = /^<(sup|sub)(?:\s[^>]*)?>([^<]{1,24})<\/\1>$/i;

/** HTML をタグ／テキストに分解する（sanitizeHtml と同じ考え方）。 */
const HTML_TOKEN_RE = /(<!--[\s\S]*?-->|<\/?[a-zA-Z][a-zA-Z0-9]*(?:"[^"]*"|'[^']*'|[^>"'])*>)/g;

/** HTML の実体参照を素のテキストへ戻す（数式判定のため）。 */
function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&minus;/gi, '-')
    .replace(/&times;/gi, '×')
    .replace(/&pi;/gi, 'π')
    .replace(/&infin;/gi, '∞')
    .replace(/&radic;/gi, '√')
    .replace(/&int;/gi, '∫')
    .replace(/&amp;/gi, '&');
}

/** 数式判定用の論理テキストと、元 HTML を保持する断片。 */
interface Atom {
  /** 数式判定に使う論理テキスト */
  text: string;
  /** 出力時に復元する元の HTML */
  html: string;
  /** テキストノードは境界で分割してよい */
  splittable: boolean;
}

/**
 * HTML 中の数式を KaTeX で組み直す。
 *
 * @param html  まとめプリント等の HTML 文字列
 */
export function typesetHtmlMath(html: string): string {
  if (!html) return '';
  // 数式の気配が無い HTML は触らない（大多数のケースを高速に素通し）。
  // <sup>/<sub> は数式化後に初めてトリガを満たす場合があるため、
  // 共通判定に加えてタグの存在も許可する。
  if (!mayContainMath(html) && !/<su[pb][\s>]/i.test(html)) return html;

  const tokens = html.split(HTML_TOKEN_RE).filter((t) => t !== undefined && t !== '');
  const out: string[] = [];
  let run: Atom[] = [];

  /**
   * 溜めた run（テキスト＋sup/sub）を、数式・化学式部分だけ KaTeX にして出力する。
   *
   * ★化学式もここで組む（ご要望「化学式とか反応式も全部ね」）★
   *   まとめプリントは
   *     <p>Zn ＋ 2HCl → ZnCl<sub>2</sub> ＋ H<sub>2</sub></p>
   *   のように書かれている。以前ここは scanMathRegions だけを掛けていた
   *   ため、∫ や √ を含まない化学式・反応式は 1 つも数式領域と判定されず、
   *   まとめプリントの化学だけが「HTML の <sub> を小さくしただけ」の
   *   見た目で取り残されていた（解説・問題は既に mhchem で組めていた）。
   *
   *   splitMathPieces（プレーンテキスト用）と同じ二段構えにする：
   *     ① まず数式領域を確定させる
   *     ② その「隙間」だけを化学式として調べる
   *   順序が逆だと、数式の中の英字（dx の x など）を化学式と誤認する。
   */
  const flushRun = () => {
    if (run.length === 0) return;

    const logical = run.map((a) => a.text).join('');
    const mathRegions = scanMathRegions(logical);

    // 数式に取られなかった範囲から化学式を探す
    const chemRegions: MathRegion[] = [];
    let scanFrom = 0;
    for (const r of [...mathRegions, { start: logical.length, end: logical.length, text: '' }]) {
      if (r.start > scanFrom) {
        const gap = logical.slice(scanFrom, r.start);
        for (const c of scanChemRegions(gap)) {
          chemRegions.push({ start: scanFrom + c.start, end: scanFrom + c.end, text: c.text });
        }
      }
      scanFrom = Math.max(scanFrom, r.end);
    }

    type MarkedRegion = MathRegion & { chem: boolean };
    const regions: MarkedRegion[] = [
      ...mathRegions.map((r) => ({ ...r, chem: false })),
      ...chemRegions.map((r) => ({ ...r, chem: true })),
    ].sort((a, b) => a.start - b.start);

    if (regions.length === 0) {
      out.push(run.map((a) => a.html).join(''));
      run = [];
      return;
    }

    // 論理テキスト上の位置 → atom のどこか、を辿れるように開始位置を持つ
    const starts: number[] = [];
    let pos = 0;
    for (const atom of run) {
      starts.push(pos);
      pos += atom.text.length;
    }

    /** 位置 p を含む atom の index */
    const atomAt = (p: number) => {
      for (let i = run.length - 1; i >= 0; i--) if (starts[i] <= p) return i;
      return 0;
    };

    let cursor = 0;
    const pieces: string[] = [];

    const emitPlain = (from: number, to: number) => {
      if (to <= from) return;
      let i = atomAt(from);
      while (i < run.length && starts[i] < to) {
        const atom = run[i];
        const atomStart = starts[i];
        const atomEnd = atomStart + atom.text.length;
        if (atom.splittable) {
          const s = Math.max(from, atomStart) - atomStart;
          const e = Math.min(to, atomEnd) - atomStart;
          // テキストノードは元 HTML と論理テキストの長さが実体参照でずれ得るため、
          // 部分切り出しは「元 HTML 全体」か「論理テキストの切片」を使い分ける。
          if (s === 0 && e === atom.text.length) pieces.push(atom.html);
          else pieces.push(escapeHtml(atom.text.slice(s, e)));
        } else if (atomStart >= from && atomEnd <= to) {
          pieces.push(atom.html);
        }
        i++;
      }
    };

    for (const region of regions) {
      // 直前の領域と重なってしまった場合は捨てる（安全側）
      if (region.start < cursor) continue;

      // 数式領域が sup/sub の atom を途中で跨ぐ場合は、その atom を丸ごと含める
      // （<sup>n</sup> は指数そのものなので数式側に入れるのが正しい）
      let start = region.start;
      let end = region.end;
      const first = atomAt(start);
      const last = atomAt(Math.max(start, end - 1));
      if (!run[first].splittable) start = starts[first];
      if (!run[last].splittable) end = starts[last] + run[last].text.length;
      if (start < cursor) start = cursor;
      if (end <= start) continue;

      const source = logical.slice(start, end);
      // 化学式は mhchem（\ce{…}）、数式は通常の LaTeX へ。
      const latex = region.chem ? toChemLatex(source) : toLatex(source);

      emitPlain(cursor, start);
      if (latex === null) {
        // atom を丸ごと含めた結果、化学式として組めなくなった場合は
        // 元の HTML をそのまま出す（勝手に壊さない）。
        emitPlain(start, end);
      } else {
        pieces.push(renderLatex(latex, { ariaLabel: source }));
      }
      cursor = end;
    }
    emitPlain(cursor, logical.length);

    out.push(pieces.join(''));
    run = [];
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // --- <sup>n</sup> / <sub>2</sub> は「開始タグ・中身・終了タグ」の3トークンで来る ---
    const scriptTag = /^<(sup|sub)(?:\s[^>]*)?>$/i.exec(token);
    if (scriptTag && tokens[i + 1] !== undefined && !tokens[i + 1].startsWith('<')) {
      const closing = tokens[i + 2];
      if (closing && new RegExp(`^</${scriptTag[1]}\\s*>$`, 'i').test(closing)) {
        const inner = decodeEntities(tokens[i + 1]);
        const combined = token + tokens[i + 1] + closing;
        if (SCRIPT_TAG_RE.test(combined.replace(/\n/g, ' '))) {
          run.push({
            text: scriptTag[1].toLowerCase() === 'sup' ? `^{${inner}}` : `_{${inner}}`,
            html: combined,
            splittable: false,
          });
          i += 2;
          continue;
        }
      }
    }

    // --- それ以外のタグは run の区切り ---
    if (token.startsWith('<')) {
      flushRun();
      out.push(token);
      continue;
    }

    // --- テキストノード ---
    run.push({ text: decodeEntities(token), html: token, splittable: true });
  }

  flushRun();
  return out.join('');
}
