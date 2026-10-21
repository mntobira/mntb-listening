import React from 'react';
import { sanitizeInlineHtml } from './sanitizeHtml';
import { splitMathPieces, renderLatex, mayContainMath } from './mathTypeset';

/**
 * ===================================================================
 * 数式を KaTeX で組む（本文中の数式領域だけを差し替える）
 * ===================================================================
 *
 * ■ 背景
 *   以前は数式も「正規表現で組んだ自作 HTML」で描画していたため、
 *   分数の横線・根号・∫ の大きさやベースラインが揃わず、
 *   「数式が汚い」状態だった。
 *   数式は組版の問題なので、TeX の組版アルゴリズムを実装した
 *   KaTeX に任せ、数式専用書体で組む（Word の数式と同等の品質）。
 *
 * ■ 化学・英語を壊さないための設計
 *   数式として差し替えるのは
 *     ・$…$ / \(…\) / \ce{…} と明示的に書かれた部分
 *     ・∫ Σ √ lim[…] 7C3 x^(n+1) (…)' など「数学にしか出ない形」
 *   だけ（mathTypeset.ts の STRONG_TRIGGER）。
 *   H₂O・Fe²⁺・g/mol・mol/L・リスニングの英文は従来の
 *   化学式フォーマッタがそのまま担当する。
 *
 * ■ 組んだ数式を後段の処理から守る仕組み
 *   KaTeX の出力（多数の <span>）をそのまま後段の化学式変換に流すと、
 *   クラス名の中の英字が「化学式」と誤認されて壊れる。
 *   そこでプレースホルダ（\u0000{n}\u0000）に退避し、
 *   全処理が終わった最後に元の HTML へ戻す。
 */
const MATH_PLACEHOLDER_OPEN = '\u0000';

/**
 * ★入力に含まれる HTML タグを、数式変換の前に退避する★
 *
 * ■ 直した不具合（ご要望「解答解説と問題のフォントがあっていない」の一因）
 *   解説データには explanationFormat.ts の LABEL() などが作る
 *   インライン style つきの <span> が最初から入っている。
 *
 *     <span style="... background-color:#FFF1F5; ...">解 答</span>
 *
 *   ところが extractMath は HTML タグを区別せずテキスト全体を走査するため、
 *   style 属性の中の 16進カラーコード「FFF1F5」を数式トリガと誤認し、
 *   属性値の途中を KaTeX の HTML に置き換えてしまっていた。
 *   結果、実測（390x844・化学基礎「ろ過」）では
 *
 *     <span style="... background-color:#&lt;span class=" aria-label="FFF1F5"
 *            class="katex" aria-hidden="true">解 答</span>
 *
 *   という壊れた DOM になり、
 *     ・pill の背景色が消える（style が途中で切れる）
 *     ・class="katex" が付くので KaTeX_Main（セリフ体）で描画される
 *   ＝「解 答」という日本語の見出しだけ別書体になっていた。
 *
 * ■ 直し方
 *   タグ本体（"<...>"）を先にプレースホルダへ退避してから数式を探す。
 *   タグの中身は表示テキストではないので、数式・化学式の変換対象に
 *   すべきものが原理的に存在しない。
 *   後段のタグ解釈（tagRegex での分割）は復元後に行うので、
 *   <u> や <hl> の扱いは従来どおり変わらない。
 *
 * ■ プレースホルダの形
 *   数式退避と同じ \u0000 は使えない（restoreMath の正規表現と衝突する）。
 *   \u0001{n}\u0001 を使う。どちらも本文には出現し得ない制御文字。
 */
const TAG_PLACEHOLDER = '\u0001';

function extractTags(text: string): { text: string; tags: string[] } {
  const tags: string[] = [];
  if (!text.includes('<')) return { text, tags };
  const masked = text.replace(/<!--[\s\S]*?-->|<\/?[a-z][a-z0-9]*[^>]*>/gi, (tag) => {
    tags.push(tag);
    return `${TAG_PLACEHOLDER}${tags.length - 1}${TAG_PLACEHOLDER}`;
  });
  return { text: masked, tags };
}

function restoreTags(text: string, tags: string[]): string {
  if (tags.length === 0) return text;
  return text.replace(
    new RegExp(`${TAG_PLACEHOLDER}(\\d+)${TAG_PLACEHOLDER}`, 'g'),
    (_m, index: string) => tags[Number(index)] ?? '',
  );
}

/**
 * ★ **…** を太字として描画する★
 *
 * ■ 何が起きていたか
 *   解説データには Markdown 記法の太字（**答えはろ液**）が書かれているのに、
 *   アプリ側に解釈する処理が無かったため、画面に
 *
 *     （2） **固体（不溶性の固体）と液体の混合物**
 *
 *   と、アスタリスクがそのまま表示されていた。
 *   これは今回のフォント修正とは無関係の、以前から残っていた症状。
 *
 * ■ 「べき乗の ** と衝突しないか」を実測で確認してから入れている
 *   コードコメントを除いた src/data 配下の全データを走査した結果：
 *     ・**…** のペア … 64組（chemProblemsC1 5 / chemProblemsC2 17 /
 *       mathIntegralProblems 42）
 *     ・ペアにならない孤立した ** … 0件
 *     ・$…$（数式）の中にある ** … 0件
 *   数値だけを囲む5件（**-5** / **0** / **2** / **1/3** / **8/15**）も
 *   前後を確認したところ「答えの強調」であり、べき乗ではなかった。
 *     例：「x の係数は **-5** なので、-1/5 を掛けて」
 *   つまり現行データに「べき乗としての **」は1つも無い。
 *
 * ■ それでも壊れないようにしている工夫
 *   ① 数式（$…$）は extractMath より前に触らない。この関数は
 *      extractTags の直後・extractMath の前に呼ぶが、$…$ の内側には
 *      ** が存在しないことを確認済み。将来 $2**3$ のような式が来ても
 *      困らないよう、下の正規表現は「$ を含む中身は太字にしない」。
 *   ② 中身が空（****）や、改行をまたぐものは対象外。
 *      「* を1個だけ使った掛け算記号（a * b）」にも触らない
 *      （後段の × 変換はアスタリスク1個を見るので、そちらは無傷）。
 *   ③ 既に <strong> が入っている入力には何もしない（二重適用を防ぐ）。
 *
 * ■ なぜ <strong> ではなく class 付きの <strong> か
 *   font-bold を明示しないと、本文が font-medium などの場合に
 *   ブラウザ既定の太字と噛み合わず「太くなっていない」ように見える。
 *   サニタイザは strong と class を許可しているので、そのまま通る。
 */
const BOLD_MARKDOWN_RE = /\*\*(?=\S)([^*\n$]*?\S)\*\*/g;

export function convertBoldMarkdown(text: string): string {
  if (!text.includes('**')) return text;
  return text.replace(BOLD_MARKDOWN_RE, '<strong class="font-bold">$1</strong>');
}

/** 本文から数式を抜き出して KaTeX で組み、プレースホルダに退避する。 */
function extractMath(text: string, mathContext = false): { text: string; slots: string[] } {
  const slots: string[] = [];

  // 数式の可能性が全く無いテキスト（大多数）は走査コストを掛けずに返す。
  // 判定条件は mathTypeset 側と共有する（ここに条件を書き写すと、
  // トリガを増やしたときにアプリだけ古い判定のまま取り残される）。
  if (!mathContext && !mayContainMath(text)) {
    return { text, slots };
  }

  const pieces = splitMathPieces(text, mathContext ? { auto: true, context: 'math' } : {});
  if (!pieces.some((p) => p.kind === 'math')) return { text, slots };

  const rebuilt = pieces
    .map((piece) => {
      if (piece.kind === 'text') return piece.value;
      // piece.value は splitMathPieces が変換済みの LaTeX（再変換すると壊れる）
      const html = renderLatex(piece.value, {
        displayMode: piece.display,
        ariaLabel: piece.source ?? piece.value,
      });
      slots.push(html);
      return `${MATH_PLACEHOLDER_OPEN}${slots.length - 1}${MATH_PLACEHOLDER_OPEN}`;
    })
    .join('');

  return { text: rebuilt, slots };
}

/** 退避した数式 HTML を元の位置へ戻す。 */
function restoreMath(html: string, slots: string[]): string {
  if (slots.length === 0) return html;
  return html.replace(
    new RegExp(`${MATH_PLACEHOLDER_OPEN}(\\d+)${MATH_PLACEHOLDER_OPEN}`, 'g'),
    (_m, index: string) => slots[Number(index)] ?? '',
  );
}

// 縦書き分数の HTML を生成するヘルパー。
// 分子・分母はそのまま埋め込み、後段の化学式処理で変数（w, M など）も適切にイタリック化される。
function buildFractionHtml(numerator: string, denominator: string) {
  return (
    '<span class="inline-flex flex-col justify-center text-center mx-1" style="font-size:max(12px, 0.85em); vertical-align: middle; line-height: 1;">' +
      '<span class="border-b border-stone-400 pb-[1.5px] leading-none px-1 font-serif font-medium">' + numerator + '</span>' +
      '<span class="leading-none pt-[1.5px] px-1 font-serif font-medium">' + denominator + '</span>' +
    '</span>'
  );
}

// 分母（または分子）が「単位」を表す場合は分数化しない。
// 例: g/mol, mol/L, kJ/mol, g/cm3, L/mol などは横書きのまま残す。
const UNIT_TOKENS = new Set([
  'mol', 'L', 'mL', 'g', 'kg', 'mg', 'cm', 'cm2', 'cm3', 'm', 'm2', 'm3',
  'kJ', 'J', 'kcal', 'cal', 'K', 's', 'min', 'h', 'Pa', 'kPa', 'atm', 'N',
  'V', 'A', 'W', 'dm', 'dm3', 'mmol',
]);

function isUnitToken(token: string) {
  return UNIT_TOKENS.has(token);
}

const SUBSCRIPT_CLASS = 'text-[0.75em] font-sans align-sub leading-none';
const SUPERSCRIPT_CLASS = 'text-[0.75em] font-sans align-super leading-none';

const SUBSCRIPT_CHAR_MAP: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
};
const SUPERSCRIPT_CHAR_MAP: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5',
  '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '−',
};

/** Unicode / TeX風の添字を semantic HTML に統一し、フォントに依存せず上下配置する。 */
function normalizeScientificScripts(text: string) {
  return text
    .replace(/[₀₁₂₃₄₅₆₇₈₉]+/g, (value) =>
      `<sub class="${SUBSCRIPT_CLASS}">${[...value].map((char) => SUBSCRIPT_CHAR_MAP[char]).join('')}</sub>`
    )
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/g, (value) =>
      `<sup class="${SUPERSCRIPT_CLASS}">${[...value].map((char) => SUPERSCRIPT_CHAR_MAP[char]).join('')}</sup>`
    )
    // 問題データに残る H^+ / Fe^2+ / cm^3 / x_{1} も同じ表示へ揃える。
    .replace(/([A-Za-z0-9)])_\{?([0-9]+)\}?/g, `$1<sub class="${SUBSCRIPT_CLASS}">$2</sub>`)
    .replace(/([A-Za-z0-9)])\^\{?([0-9]*[+\-−]?|[+\-−])\}?/g, `$1<sup class="${SUPERSCRIPT_CLASS}">$2</sup>`)
    // 半反応式データ（redoxProblems.ts）で使われる MINUS SIGN(U+2212) の電荷を
    // ASCII の "-" に寄せて、下の化学式変換でイオンとして上付きにできるようにする。
    //   Cl−・e−・NO3− → 電荷なので変換する
    //   C−H・O−H・N−H → 構造式の結合線なので変換しない（直後が英大文字なら除外）
    .replace(/([A-Za-z][A-Za-z]?[0-9]*)\u2212(?![A-Za-z0-9(])/g, '$1-');
}

// ===================================================================
// 数学記法エンジン
// -------------------------------------------------------------------
// 数学の問題データ（mathIntegralProblems.ts など）は
//   ∫[0→π/2] / Σ[k=1→n] / lim[n→∞] / √(x²+y²) / x^(3/2) / x^5/5 / 7C3
// のようなテキスト記法で書かれている。これを「教科書と同じ見た目」
// （上下限付きの大きな∫Σ、真上に線が伸びる根号、上付き指数、縦書き分数、
//   下付きの nCr）へ変換する。
//
// ■ 化学・英語の本文を壊さないための設計
//   ・∫ Σ √ lim[ ^( はいずれも化学基礎・化学・リスニングのデータに
//     登場しないことを確認済み（登場する場合も数学的に正しい表示になる）
//   ・単位の g/mol・mol/L などは既存の isUnitToken で分数化を回避
//   ・変換で生成した記号は HTML 実体参照（&#8747; など）で埋め込み、
//     後段の正規表現に二重処理されないようにする
// ===================================================================

/** ∫・Σ など「上下限つきの大きな演算子」の HTML を組み立てる */
function buildBigOpHtml(symbolEntity: string, upper: string, lower: string) {
  return (
    `<span class="math-bigop" aria-hidden="false">` +
      `<span class="math-bigop-sym">${symbolEntity}</span>` +
      `<span class="math-bigop-lims"><span>${upper}</span><span>${lower}</span></span>` +
    `</span>`
  );
}

/** 根号（√の上に横線が伸びる形）の HTML を組み立てる */
function buildSqrtHtml(body: string) {
  return `<span class="math-sqrt">&#8730;<span class="math-sqrt-body">${body}</span></span>`;
}

/**
 * 数学記法をテキストから HTML へ変換する。
 * formatText の最初（添字正規化より前）に1回だけ通す。
 */
export function convertMathNotation(src: string): string {
  let t = src;

  // (1) 順列・組合せ 7C3 / nCr / 7P3 → ₇C₃（前後が英数字でないときだけ）。
  //     12C のような同位体表記は「C の後に数字が続かない」ため一致しない。
  t = t.replace(
    /(?<![A-Za-z0-9])([0-9]{1,2}|n)([CP])([0-9]{1,2}|[rk])(?![A-Za-z0-9])/g,
    (_m, n: string, cp: string, r: string) =>
      `<sub class="${SUBSCRIPT_CLASS}">${n}</sub>${cp}<sub class="${SUBSCRIPT_CLASS}">${r}</sub>`
  );

  // (2) 上下限つきの定積分 ∫[a→b]・∫[a,b]
  t = t.replace(
    /∫\s*\[([^\[\]]{1,24}?)\s*(?:→|,)\s*([^\[\]]{1,24}?)\]/g,
    (_m, lo: string, hi: string) => buildBigOpHtml('&#8747;', hi.trim(), lo.trim())
  );
  // 上下限のない ∫ も教科書サイズに拡大
  t = t.replace(/∫/g, '<span class="math-bigop-solo">&#8747;</span>');

  // (3) 上下限つきの総和 Σ[k=1→n]
  t = t.replace(
    /Σ\s*\[([^\[\]]{1,24}?)\s*(?:→|,)\s*([^\[\]]{1,24}?)\]/g,
    (_m, lo: string, hi: string) => buildBigOpHtml('&#931;', hi.trim(), lo.trim())
  );
  t = t.replace(/Σ/g, '<span class="math-bigop-solo">&#931;</span>');

  // (4) 極限 lim[n→∞] → lim の真下に n→∞
  t = t.replace(
    /lim\s*\[([^\[\]]{1,24})\]/g,
    (_m, cond: string) =>
      `<span class="math-lim"><span class="math-lim-main">lim</span><span class="math-lim-under">${cond.trim()}</span></span>`
  );

  // (4.5) 根号を含む分数 1/√x・√x/2・3/√(x+1) → 縦書き分数
  //     ★√ が (5) で HTML に変換される前に分数として拾う必要がある★
  //     （変換後は <span…>√</span> になり分数ルールが二度とマッチしないため。
  //       実際に「∫ 1/√x dx」が横書きのまま表示される不具合の原因だった）
  const SQRT_TOKEN = '√\\s*(?:\\([^()]{1,30}\\)|[0-9]+(?:\\.[0-9]+)?|[A-Za-z][0-9²³]*)';
  // 分母が √…（例: 1/√x, 2/√(x+1)）
  t = t.replace(
    new RegExp(`(?<![0-9A-Za-z_])(-?[0-9]{1,3}(?:\\.[0-9]+)?|[A-Za-z])\\s*\\/\\s*(${SQRT_TOKEN})(?![0-9A-Za-z])`, 'g'),
    (_m, num: string, den: string) => buildFractionHtml(num, den)
  );
  // 分子が √…（例: √x/2, √(x²+1)/3）
  t = t.replace(
    new RegExp(`(?<![0-9A-Za-z_])(${SQRT_TOKEN})\\s*\\/\\s*(-?[0-9]{1,3}(?:\\.[0-9]+)?|[A-Za-z](?:\\^[0-9]{1,2})?)(?![0-9A-Za-z])`, 'g'),
    (_m, num: string, den: string) => buildFractionHtml(num, den)
  );

  // (5) 根号 √(…)・√x・√25 → 中身の真上に線が伸びる根号
  //     √(4² + (-7)²) のような「1段だけ入れ子の括弧」にも対応する。
  t = t.replace(
    /√\s*\(((?:[^()]|\([^()]{0,30}\)){1,60}?)\)/g,
    (_m, body: string) => buildSqrtHtml(body.trim())
  );
  t = t.replace(
    /√\s*([0-9]+(?:\.[0-9]+)?[A-Za-z]?|[A-Za-z][0-9²³]*)/g,
    (_m, body: string) => buildSqrtHtml(body)
  );

  // (6) 括弧つき指数 x^(3/2)・e^(2x)・A^(a+) → 上付きに。
  //     指数の中の / は分数化せず「∕」（除算スラッシュ）でコンパクトに見せる
  //     （上付きの中にさらに縦書き分数を入れると小さすぎて読めないため）。
  t = t.replace(
    /([A-Za-z0-9)\]])\^\(([^()]{1,30})\)/g,
    (_m, base: string, exp: string) =>
      `${base}<sup class="${SUPERSCRIPT_CLASS}">${exp.replace(/\//g, '&#8725;')}</sup>`
  );
  // (7) 1文字の英字指数 e^x・2^n・10^k → 上付き
  t = t.replace(
    /([A-Za-z0-9)\]])\^([A-Za-z])(?![A-Za-z0-9])/g,
    `$1<sup class="${SUPERSCRIPT_CLASS}">$2</sup>`
  );

  // ---- 分数（数学でよく出る形を、単位を壊さない範囲で縦書き分数にする） ----
  // 数式として許可する中身（コンマ・スラッシュを含まない＝座標 (3, 1) や
  // 単位 g/mol、(3/5, 4/5) のような組は変換しない）
  const EXPR = "[A-Za-z0-9+\\-−·×*^√!'’ ._]";

  // (8) 三角関数の分数 sin^5 x/5・cos 2x/2 → 関数ごと分子に含める
  t = t.replace(
    new RegExp(`(?<![A-Za-z])((?:sin|cos|tan)(?:\\^[0-9]{1,2})?\\s?[0-9]?x)\\s*\\/\\s*([0-9]{1,3})(?![0-9A-Za-z])`, 'g'),
    (_m, num: string, den: string) => buildFractionHtml(num, den)
  );
  // (9) 累乗・階乗が分子の分数 x^5/5・6!/2
  t = t.replace(
    /(?<![A-Za-z0-9_])([A-Za-z]\^[0-9]{1,2}|[0-9]{1,3}!|[A-Za-z]!)\s*\/\s*([0-9]{1,3}(?:\.[0-9]+)?!?|[A-Za-z](?:\^[0-9]{1,2})?!?)(?![0-9A-Za-z])/g,
    (_m, num: string, den: string) => buildFractionHtml(num, den)
  );
  // (9.5) 累乗が分母の分数 1/x^3・2/x^2 → 分母に x^3 を丸ごと入れる。
  //     ★ここで拾わないと、後段の一般分数ルールが「1/x」だけを分数化し、
  //       ^3 が分数の右へはみ出す誤表示になる（∫ 1/x^3 dx で実際に発生）★
  t = t.replace(
    /(?<![A-Za-z0-9_])(-?[0-9]{1,3}(?:\.[0-9]+)?|[A-Za-z])\s*\/\s*([A-Za-z]\^[0-9]{1,2})(?![0-9A-Za-z])/g,
    (_m, num: string, den: string) => buildFractionHtml(num, den)
  );
  // (10) 括弧が分子の分数 (a + 2b)/3・(x+1)/(x-1)（数式文字だけの中身に限定）
  t = t.replace(
    new RegExp(`\\((${EXPR}{1,40})\\)\\s*\\/\\s*(?:\\((${EXPR}{1,40})\\)|([0-9]{1,3}(?:\\.[0-9]+)?!?|[A-Za-z](?:\\^[0-9]{1,2})?!?))(?![0-9A-Za-z])`, 'g'),
    (_m, num: string, denParen: string | undefined, denToken: string | undefined) =>
      buildFractionHtml(num.trim(), (denParen ?? denToken ?? '').trim())
  );
  // (11) 括弧が分母の分数 -1/(2x^2)・6!/(3!·2!·1!)
  t = t.replace(
    new RegExp(`(?<![A-Za-z0-9_])(-?[0-9]{1,3}(?:\\.[0-9]+)?!?|[A-Za-z]!?)\\s*\\/\\s*\\((${EXPR}{1,40})\\)`, 'g'),
    (_m, num: string, den: string) => {
      if (isUnitToken(num)) return _m;
      return buildFractionHtml(num, den.trim());
    }
  );

  return t;
}

/**
 * ===================================================================
 * ★ご要望11「解説と問題でフォント違うの何？」の原因と対処★
 * ===================================================================
 *
 * ■ 実測でわかった原因（推測ではなく Playwright の getComputedStyle）
 *   スマホ 390x844／英語リスニング 第1問A の問題画面・解説画面で、
 *   英文の 1 語 1 語がこう描画されていた。
 *     "The" "speaker" "has" "her" "umbrella" …
 *       → font-family: "Cambria Math", "Times New Roman", serif  (15.75px)
 *   一方、同じ画面の日本語は 14〜15px のゴシック／手書きだった。
 *   つまり「英文だけがセリフ体（明朝っぽい書体）で浮いていた」。
 *
 *   なぜそうなるか。この整形エンジンは化学式（H2O・Na+ など）を
 *   きれいに組むために、
 *     chemRegex = /([A-Za-z]+[0-9]*(?:[+-](?![0-9]))?)/g
 *   で「英字の連なり」を化学式トークンとして切り出し、
 *   その全部を必ず
 *     <span style="font-family: 'Cambria Math','Times New Roman',serif">
 *   で包んでいた。この正規表現は "The" も "umbrella" も等しく
 *   通してしまうため、英文のすべての単語が化学式扱いになっていた。
 *   しかも style 属性（インライン）なので、Tailwind の
 *   font-modern / font-handwriting より必ず強く、上書きできない。
 *   ＝「問題文の日本語はゴシック、英文だけセリフ」という食い違いの正体。
 *
 * ■ 直し方（ここが肝心）
 *   「英語かどうかを字面から推測して自動で切り替える」ことはしない。
 *   それをやると化学の "mol" や生物の "ATP" まで巻き込みかねず、
 *   ご指摘の「コードで形式的に作ると問題によっておかしくなる」に
 *   まっすぐ当てはまる。
 *   そこで、呼び出す側が「この文章は英語の散文であって化学式ではない」と
 *   分かっている場所だけで明示的に prose を渡す形にする。
 *     formatText(text, highlights, { prose: true })
 *   英語リスニング・英文法は audioTracks（英文の音源）を持つ問題だけが
 *   対象なので、画面側はその有無で判断できる（科目名で分岐しない）。
 *
 * ■ prose のときに止めるのは「化学式の体裁付け」だけ
 *   下線 <u>・ハイライト <hl>・改行・数式退避はそのまま通す。
 *   止めるのは
 *     ・英字トークンをセリフ体 span で包む処理
 *     ・数字を下付き（H₂O の ₂）にする処理
 *     ・末尾の +/- を上付き電荷にする処理
 *   の3つ。英文にはどれも要らないし、あると害しかない。
 */
export type FormatTextOptions = {
  /**
   * true のとき「化学式・数式の体裁付け」を行わず、素の文章として組む。
   * 英語リスニング・英文法の英文（と、その訳・解説）で使う。
   */
  prose?: boolean;
  /**
   * true のとき数学の問題として数式を判定する（splitMathPieces の context:'math'）。
   * 既定の判定では (2x + 3)^2・2/7・(a+b)/(2c) が素のテキストのまま残り、
   * 同じ問題の中で 3√2 や x^5/5 だけが KaTeX で組まれて書体が混ざっていた。
   * 対戦（BattleText）と同じ判定にそろえる。
   */
  math?: boolean;
};

/**
 * 数学の画面かどうかを、画面を描いている部品の外から伝えるための既定値。
 * Quiz / Explanation が数学の問題を開いている間だけ true にする
 * （formatText の呼び出しは数十か所あるので、1か所ずつ引数を足すと必ず漏れる）。
 */
let mathContextDefault = false;
export function setFormatMathContext(on: boolean): void { mathContextDefault = on; }
export function isFormatMathContext(): boolean { return mathContextDefault; }

export function formatText(
  text: string,
  highlights: string[] = [],
  options: FormatTextOptions = {}
) {
  if (!text) return null;
  const prose = options.prose === true;
  const mathContext = !prose && (options.math ?? mathContextDefault);

  /*
    ★数式より先に「入力に元から入っている HTML タグ」を退避する★
    解説データには LABEL() が作る style つき <span> が含まれる。
    タグの中身（属性値）は表示テキストではないので、数式・化学式の
    変換対象になり得ない。にもかかわらず走査対象に入れていたため、
    style の中の色コード（#FFF1F5）が数式と誤認され、属性が壊れて
    「解 答」の pill だけセリフ体（KaTeX_Main）になっていた。
    詳しい経緯は extractTags の説明を参照。
  */
  const { text: withoutTags, tags: rawTags } = extractTags(text);

  /*
    ★**…** を <strong> にする★
    順序に意味があるので3手に分けている。
      ① タグを退避した状態（withoutTags）で太字変換する
         → 元から入っている HTML の属性値（style="…" の中など）に
           アスタリスクが現れても巻き込まない。
      ② 元のタグを戻す
         → ここで初めて「元のタグ」と「新しい <strong>」が同じ文章に並ぶ。
      ③ もう一度まとめて退避する
         → 新しい <strong …> も数式走査の対象から外れる。
           退避は1つの配列に統一するので、プレースホルダ番号が衝突しない。
  */
  const { text: maskedForMath, tags: tagsForMath } = extractTags(
    restoreTags(convertBoldMarkdown(withoutTags), rawTags),
  );

  // ★次に数式を KaTeX で組んで退避する★
  //   ここで抜いておくことで、以降の化学式変換・添字処理・分数処理は
  //   「数式ではない部分」だけを相手にすればよくなる。
  const { text: maskedMath, slots: mathSlots } = extractMath(maskedForMath, mathContext);

  // タグを戻してから従来の処理に渡す。以降の tagRegex での分割や
  // <u>/<hl> の読み替えは、これまでとまったく同じ入力を受け取る。
  const withMathSlots = restoreTags(maskedMath, tagsForMath);

  // ★prose では数式・化学式向けの前処理を通さない★
  //   convertMathNotation / normalizeScientificScripts は
  //   「a/b を分数に」「x^2 を上付きに」といった理科の組版を行うので、
  //   英文に当てると Where's（アポストロフィ）や I'd like to のような
  //   ごく普通の文まで巻き込む恐れがある。英文には要らないので通さない。
  let processedText = prose
    ? withMathSlots
    : normalizeScientificScripts(convertMathNotation(withMathSlots)).replace(
        /([A-Za-z0-9]|\)|[％%]|\])[\s ]*\*[\s ]*([A-Za-z0-9]|\(|\[)/g,
        '$1 <span class="font-sans font-semibold text-stone-500 mx-0.5">×</span> $2'
      );

  if (!prose) {

  // (1) 明示的な分数表記 \frac{分子}{分母} を最優先で縦書き分数に変換する。
  //     入れ子は想定せず、波括弧内に } を含まないシンプルな書式に対応。
  processedText = processedText.replace(
    /\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g,
    (_m: string, num: string, den: string) => buildFractionHtml(num.trim(), den.trim())
  );

  // (2) 括弧で囲まれた分数 (分子)/(分母) を縦書き分数にする。
  //     例: (w/M), (x/100) のように括弧つきで書かれた割り算の中身を確実に拾う。
  processedText = processedText.replace(
    /\(([^()/]+)\)\s*\/\s*\(([^()/]+)\)/g,
    (_m: string, num: string, den: string) => buildFractionHtml(num.trim(), den.trim())
  );

  // (3) 一般的な分数 a/b を縦書き分数にする。
  //     - 分子・分母は「数字・小数・1〜2文字の英字変数（添字 _ を許可）」に限定。
  //     - 分子・分母のどちらかが単位トークン（mol, L, g など）の場合は変換せず
  //       横書きのまま残す。これにより
  //         ・g/mol・mol/L・kJ/mol などの単位表記
  //         ・単位変換の換算係数「(22.4 L / 1 mol)」「(d g / 1 cm³)」
  //       が壊れない。
  //
  //       ★分子側も除外する理由★
  //       以前は分母だけを見ていたため、「22.4 L / 1 mol」が
  //       「L ÷ 1」の分数と誤認され、スラッシュが分数の横線に化けて
  //       画面上は「22.4 L1 mol」と表示されてしまっていた（換算係数が読めない）。
  processedText = processedText.replace(
    /(?<![A-Za-z0-9_.\/])([0-9]+(?:\.[0-9]+)?|[A-Za-z][A-Za-z]?(?:_[A-Za-z0-9]+)?)\s*\/\s*([0-9]+(?:\.[0-9]+)?|[A-Za-z][A-Za-z]?(?:_[A-Za-z0-9]+)?)(?![A-Za-z0-9_.\/])/g,
    (match: string, num: string, den: string) => {
      if (isUnitToken(den) || isUnitToken(num)) return match;
      return buildFractionHtml(num, den);
    }
  );

  // Replace atomic weight annotations with a smaller inline-block style
  processedText = processedText.replace(
    /([（(][A-Za-z]+[\s ]*[=＝][\s ]*[0-9.]+(?:[、,，\s ]+[A-Za-z]+[\s ]*[=＝][\s ]*[0-9.]+)*[）)])/g,
    '<span class="text-[0.82em] font-sans text-stone-500 bg-stone-50 border border-stone-200/60 px-2 py-0.5 rounded-lg inline-block my-0.5 font-normal select-none shadow-xs">$1</span>'
  );

  // 質量数（同位体）の上付き表記。35Cl / 12C / 26Mg のような「質量数＋元素記号」を ³⁵Cl と描画する。
  //
  // ★重要★ ここは化学反応式の「係数」と衝突しやすい。
  //   2H₂O・8H⁺・2Cl⁻・3Cu ＋ … の先頭の数字は係数であって質量数ではないため、
  //   上付きにしてしまうと「係数が左上に小さく出る」という誤表示になる。
  //   そこで「直後に化学式が続かない位置（日本語・句読点・行末など）」に限って
  //   質量数とみなす。反応式の中では必ず直後に
  //     ・下付き数字（H₂O → <sub> タグ）
  //     ・電荷記号（+ / - / − / <sup> タグ）
  //     ・空白＋演算子（ ＋ 、→ など）
  //   のいずれかが来るため、この条件だけで係数を確実に除外できる。
  const ISOTOPE_ELEMENTS = [
    'Cl', 'Ca', 'Cu', 'Co', 'Cr', 'Mg', 'Mn', 'Na', 'Ne', 'Ni', 'Ar', 'Ag', 'Al',
    'Ba', 'Be', 'Br', 'Fe', 'He', 'Li', 'Pb', 'Si', 'Sn', 'Zn',
    'B', 'C', 'F', 'H', 'I', 'K', 'N', 'O', 'P', 'S', 'U', 'A', 'X',
  ].join('|');
  //   直後に来てよい文字（＝ここで途切れるなら化学式ではない）。
  //   ASCII の "(" は Cu(NO₃)₂ / Al(OH)₃ のように化学式が続く合図なので許可しない。
  //   全角の「（」は日本語の注記（26Mg（相対質量…）なので許可する。
  const AFTER_ISOTOPE = '[ぁ-んァ-ヶー一-龥、。，．・「」『』（）)：:；;％%\\n]';
  const ISOTOPE_RE = new RegExp(
    `(?<![A-Za-z0-9<\\-−])([0-9]{1,3})(${ISOTOPE_ELEMENTS})(?![A-Za-z0-9])` +
      `(?=${AFTER_ISOTOPE}|\\s*[-−–]\\s*[0-9]{1,3}[A-Z]|$)`,
    'g'
  );
  //   さらに、反応式の行では行末の「＋ 2Ag」のような係数も拾ってしまうため、
  //   反応の矢印を含む行は質量数変換の対象から丸ごと外す。
  //   （化学基礎の反応式に核反応＝質量数表記が現れることは無い）
  const REACTION_LINE = /[→⟶⟵←⇄⇌⇔⟷]/;
  processedText = processedText
    .split('\n')
    .map((line) => (REACTION_LINE.test(line)
      ? line
      : line.replace(ISOTOPE_RE, `<sup class="${SUPERSCRIPT_CLASS} font-bold pr-[1px] select-none">$1</sup>$2`)))
    .join('\n');
  } // ← if (!prose)：ここまでが化学式・数式向けの前処理

  // First, apply custom highlights to the text. We surround them with custom tags <hl>...</hl>
  let highlightedText = processedText;
  if (highlights.length > 0) {
    // Sort highlights by length descending to avoid partial matches
    const sortedHighlights = [...highlights].sort((a, b) => b.length - a.length);
    sortedHighlights.forEach(hl => {
      if (!hl.trim()) return;
      // Simple string replacement for all occurrences
      // Escape for regex
      const escaped = hl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'g');
      // We must avoid highlighting inside already created <hl> tags
      highlightedText = highlightedText.replace(regex, '<hl>$1</hl>');
    });
  }

  // Split text by a regex that matches chemical formulas, math variables, AND our <hl> tags
  // BUT we must avoid matching inside HTML tags like <u> or </u> or <hl>.
  
  // Split by HTML tags (e.g., <u>, </u>, <br/>, <hl>, </hl>) and HTML comments.
  //
  // ★HTMLコメントを必ずトークンとして切り出すこと★
  // コメント（例：整形エンジンの冪等マーカー <!--fmt-v1-->）を素通しせずに
  // 下の化学式変換へ流すと、末尾の "-->" の "-" がイオンの電荷として
  // <sup>-</sup> に化けてコメントが閉じなくなり、
  // 「以降の解説本文がまるごとブラウザに飲み込まれて消える」という致命的な事故になる。
  const tagRegex = /(<!--[\s\S]*?-->|<\/?[a-z][a-z0-9]*[^>]*>)/gi;
  const tokens = highlightedText.split(tagRegex);

  const htmlString = tokens.map((token, tokenIndex) => {
    // HTML コメントはそのまま（中身を一切加工せずに）出力する
    if (token.startsWith('<!--') && token.endsWith('-->')) {
      return token;
    }

    // If it's an HTML tag, render it directly
    if (token.match(/^<\/?[a-z][a-z0-9]*[^>]*>$/i)) {
      // Replace <u> with our styled version (marker-like UI)
      if (token.toLowerCase() === '<u>') {
        return '<span class="bg-gradient-to-t from-[#F9E79F] to-transparent bg-[length:100%_40%] bg-bottom bg-no-repeat font-bold px-1">';
      }
      if (token.toLowerCase() === '</u>') {
        return '</span>';
      }
      if (token.toLowerCase() === '<hl>') {
        return '<mark class="bg-yellow-200 text-gray-900 rounded-sm px-1 shadow-sm font-bold mx-0.5 transition-colors">';
      }
      if (token.toLowerCase() === '</hl>') {
        return '</mark>';
      }
      return token;
    }

    // It's normal text, now we can safely look for chemical formulas
    // Matches: A sequence of letters, optional digits, optional charge
    // 末尾の +/- は「電荷」のときだけ取り込む。直後に数字が続く場合
    // （35Cl-35Cl の同位体ペアや mol-1 のような表記）はハイフンであって電荷ではない。
    const chemRegex = /([A-Za-z]+[0-9]*(?:[+-](?![0-9]))?)/g;
    const parts = token.split(chemRegex);

    // ── 1文字の元素記号が斜体になってしまう問題への対策 ───────────────
    // H₂O は上流の処理で `H` + <sub>2</sub> + `O` の3トークンに分解されるため、
    // `H` も `O` も「1文字＝数式の変数」と誤判定されて斜体になっていた。
    // そこで、直前が </sub> </sup>、直後が <sub> <sup> のときは
    // 「化学式の途中」だと分かるので、斜体にせず立体（upright）で描画する。
    const prevToken = tokens[tokenIndex - 1] || '';
    const nextToken = tokens[tokenIndex + 1] || '';
    const continuesFormula = /^<\/(?:sub|sup)>$/i.test(prevToken.trim());
    const startsFormula = /^<(?:sub|sup)[\s>]/i.test(nextToken.trim()) || /^<(?:sub|sup)>$/i.test(nextToken.trim());

    return parts.map((part, partIndex) => {
      // ★英語の散文（prose）では化学式の体裁付けを一切しない★
      //   ここを通すと "The" や "umbrella" が化学式トークンとみなされ、
      //   セリフ体の span（インライン style）で包まれてしまう。
      //   prose のときは素のテキストとして、改行だけ <br/> に置き換えて返す。
      if (prose) {
        return part ? part.replace(/\n/g, '<br/>') : '';
      }
      if (part.match(/^[A-Za-z]+[0-9]*[+-]?$/)) {
        // Check if it's an ion (ends with + or -). Compact notation is ambiguous:
        // Cu2+ is Cu²⁺, NH4+ is NH₄⁺, SO42- is SO₄²⁻. Element数と末尾数字から判定する。
        const ionMatch = part.match(/^([A-Za-z]+)([0-9]*)([+-])$/);
        
        let elements = '';

        if (ionMatch) {
          const letters = ionMatch[1];
          const digits = ionMatch[2];
          const sign = ionMatch[3];
          const elementSymbols = letters.match(/[A-Z][a-z]?/g) || [];
          const isSingleElement = elementSymbols.length === 1 && elementSymbols[0] === letters;
          let base = letters;
          let charge = sign;

          if (digits && isSingleElement) {
            charge = `${digits}${sign}`;
          } else if (digits.length > 1) {
            base = `${letters}${digits.slice(0, -1)}`;
            charge = `${digits.slice(-1)}${sign}`;
          } else if (digits) {
            base = `${letters}${digits}`;
          }
          
          // Process base for subscripts (e.g., NH4 / SO4).
          const baseParts = base.split(/([0-9]+)/);
          const formattedBase = baseParts.map((bp) => {
            if (bp.match(/^[0-9]+$/)) {
              return `<sub class="${SUBSCRIPT_CLASS}">${bp}</sub>`;
            }
            return bp;
          }).join('');
          
          elements = `${formattedBase}<sup class="${SUPERSCRIPT_CLASS}">${charge}</sup>`;
        } else {
          // Normal molecule like H2O, CO2, or just text like A, B
          const molParts = part.split(/([0-9]+)/);
          elements = molParts.map((mp) => {
            if (mp.match(/^[0-9]+$/)) {
              return `<sub class="${SUBSCRIPT_CLASS}">${mp}</sub>`;
            }
            return mp;
          }).join('');
        }

        // If it's a single letter (like A, B, x, y), italicize it as a math variable
        // ただし化学式の一部（H₂O の H / O、Na⁺ の Na など）は立体のままにする。
        const isSingleLetter = /^[A-Za-z]$/.test(part);
        // このトークン内で「先頭に密着しているか」「末尾に密着しているか」
        const touchesTokenHead = parts.slice(0, partIndex).join('') === '';
        const touchesTokenTail = parts.slice(partIndex + 1).join('') === '';
        // 同じトークン内で化学式片と直に隣接している場合（"H2O" → "H2" + "" + "O"）も
        // 化学式の一部とみなす。split の仕様上、連続一致の間には空文字が入る。
        const isChemPart = (p: string | undefined) => !!p && /^[A-Za-z]+[0-9]*[+-]?$/.test(p);
        const gluedToPrevPart = parts[partIndex - 1] === '' && isChemPart(parts[partIndex - 2]);
        const gluedToNextPart = parts[partIndex + 1] === '' && isChemPart(parts[partIndex + 2]);
        const isPartOfFormula =
          (continuesFormula && touchesTokenHead) ||
          (startsFormula && touchesTokenTail) ||
          gluedToPrevPart ||
          gluedToNextPart;
        const fontClass = isSingleLetter && !isPartOfFormula ? 'font-serif italic' : 'font-serif';

        return `<span class="${fontClass} text-[1.05em] tracking-wide mx-[1px]" style="font-family: 'Cambria Math', 'Times New Roman', serif;">${elements}</span>`;
      }
      
      // Normal text, replace newlines with <br/>
      if (part) {
        return part.replace(/\n/g, '<br/>');
      }
      return '';
    }).join('');
  }).join('');

  // ★セキュリティ上の要所★
  // ここまでで組み立てた htmlString は dangerouslySetInnerHTML に渡すため、
  // 「HTML として解釈されてよいもの」だけに絞り込んでから出力する。
  //
  // なぜ出口でサニタイズするのか
  //   この関数には問題データ（<u> や <br/>、冪等マーカー <!--fmt-v1--> を
  //   意図的に含む）と、生徒が解答欄に打ち込んだ文字列の両方が流れてくる。
  //     Explanation.tsx: formatText(answers[sq.id] || '未解答')
  //   入口で一律エスケープすると前者の表示が壊れるので、
  //   出口で許可リスト方式に絞る形にしている。
  //   これで <img src=x onerror=...> や <script> のような入力は
  //   タグとして成立しなくなる（＝XSSにならない）。
  //
  //   ★数式の復元はサニタイズの前★
  //   KaTeX の出力も許可リストで検証させる（span / class / style のみ）。
  //   数式だから無検査で通す、という抜け道を作らない。
  const finalHtml = restoreMath(htmlString, mathSlots);
  return <span dangerouslySetInnerHTML={{ __html: sanitizeInlineHtml(finalHtml) }} />;
}
