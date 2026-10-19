/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * answerJudge — 解答判定の単一の真実 (single source of truth)
 * ------------------------------------------------------------------
 * このモジュールは「ユーザーの解答が正解か」を判定するロジックを一箇所に集約する。
 *
 * 【C7 (b) の狙い】
 *   採点ロジックを *純粋・依存ゼロ・フレームワーク非依存* な関数として切り出し、
 *   クライアント（Quiz / Explanation / 復習リスト）と将来のサーバー採点 API が
 *   まったく同じ判定を使えるようにする。これにより
 *     1) ✓/✗ 表示とスコアの食い違い（従来 trim 有無で不一致があった）を解消
 *     2) サーバー移行時にこのファイルをそのまま Cloud Functions / Workers へ持ち込める
 *        （import する側を差し替えるだけでロジックの再実装が不要）
 *
 * ここには DOM / React / Firebase など環境依存物を一切 import しないこと。
 * （answerEquivalence も同じく純粋関数のみのモジュール）
 */

import { isEquivalentAnswer } from './answerEquivalence';

/** 判定対象となる最小限の設問形状（scoring.ts の型と互換） */
export interface JudgeableSubQuestion {
  id: string;
  type?: string;
  correctAnswer?: string;
  /** 別解（いずれかに一致すれば正解）。データに存在すれば利用する */
  acceptedAnswers?: string[];
}

/**
 * 解答文字列を比較用に正規化する。
 * - 前後の空白を除去
 * - 全角空白 → 除去、連続空白 → 単一化
 * - 全角数字（０-９）→ 半角数字（0-9）
 * - 全角英字（Ａ-Ｚａ-ｚ）→ 半角英字（A-Za-z）
 * - 全角記号（＋−．，％）→ 半角（+- . , %）、各種マイナス記号 → '-'
 * - 上付き・下付き数字（₀-₉ / ⁰-⁹）→ 通常数字（化学式パレット入力と手入力の互換）
 * 数字・英字は全角/半角どちらで入力しても同じ解答として扱う。
 */
export function normalizeAnswer(value: string | undefined | null): string {
  if (value == null) return '';
  let s = String(value)
    .replace(/\u3000/g, ' ') // 全角空白→半角
    .trim()
    .replace(/\s+/g, ' ');

  // ★全角の ASCII 相当文字はすべて半角へ（U+FF01〜U+FF5E → U+0021〜U+007E）★
  //
  // 日本語 IME は英数字も記号も全角で確定してしまうことが多い。
  // 「半角でも全角でも正解になるようにしてね」というご要望に対し、
  //   ０-９ Ａ-Ｚ ａ-ｚ（数字・英字）
  //   ＋ − ／ ＾ ＝ ＜ ＞ （ ） ［ ］ ． ， ％ ： ； ＊ ！ ？ ＃ ＆ ＠ ｜ ～
  // を1つの規則でまとめて半角に寄せる。
  // ★ここで範囲変換にした理由★
  //   以前は ＋．，％ など数個だけを個別に置換していたため、
  //   ／（全角スラッシュ）や ＾（全角ハット）で書いた分数・累乗が
  //   半角で書いた正解と一致せず×になっていた。
  // ※ 「。、」（U+3001/3002）や長音「ー」はこの範囲に入らないので、
  //    日本語の文章はこの変換では壊れない。
  s = s.replace(/[\uFF01-\uFF5E]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  );

  // 各種マイナス/ハイフン様記号 → 半角ハイフン
  // （− U+2212 全角マイナス、‐ U+2010、‑ U+2011、– U+2013、— U+2014、― U+2015。
  //   長音「ー」U+30FC は日本語の語なので変換しない）
  s = s.replace(/[\u2212\u2010\u2011\u2013\u2014\u2015]/g, '-');

  // 下付き数字（₀₁₂₃₄₅₆₇₈₉）→ 通常数字
  s = s.replace(/[\u2080-\u2089]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x2080 + 0x30)
  );
  // 上付き数字（⁰¹²³⁴-⁹）→ 通常数字、上付き +/- → +/-
  s = s
    .replace(/\u00B9/g, '1')
    .replace(/\u00B2/g, '2')
    .replace(/\u00B3/g, '3')
    .replace(/[\u2070\u2074-\u2079]/g, (ch) => {
      const map: Record<string, string> = {
        '\u2070': '0', '\u2074': '4', '\u2075': '5', '\u2076': '6',
        '\u2077': '7', '\u2078': '8', '\u2079': '9',
      };
      return map[ch] ?? ch;
    })
    .replace(/\u207A/g, '+')
    .replace(/\u207B/g, '-');

  return s;
}

/**
 * 記号選択・並び替え問題の比較用に、区切り記号だけを除いた形も作る。
 * 例: 「ウ→オ→エ→ア→イ」「ウ > オ > エ > ア > イ」「ウオエアイ」を同一視する。
 */
function compactSymbolSequence(value: string): string {
  return normalizeAnswer(value)
    .replace(/[\s,，、・･→＞>\-－―–—]/g, '')
    .replace(/[()（）［］\[\]【】]/g, '');
}

/**
 * 区切り記号を無視する比較は、ア/イ/ウや①②③のような選択肢記号の列だけに限定する。
 * 通常の短答（例: 日本語語句や化学用語）でハイフン等を過剰に無視しないためのガード。
 */
function looksLikeChoiceSequence(value: string): boolean {
  const normalized = normalizeAnswer(value);
  return /[アイウエオカキクケコサシスセソタチツテト①②③④⑤⑥⑦⑧⑨⑩]/.test(normalized);
}

/**
 * 記述式（自動採点不可）かどうか。
 * descriptive のみ自動採点対象外とする（既存仕様を踏襲）。
 */
export function isDescriptive(sq: { type?: string }): boolean {
  return sq.type === 'descriptive';
}

/**
 * 自動採点可能な設問か（記述式を除く）。
 */
export function isJudgeable(sq: { type?: string }): boolean {
  return !isDescriptive(sq);
}

/**
 * 1つの設問について、ユーザーの解答が正解かどうかを判定する。
 * - 記述式は常に false（自動採点不可）
 * - 空解答は false
 * - correctAnswer または acceptedAnswers のいずれかに（正規化して）一致すれば正解
 * - さらに answerEquivalence による「表記ゆれの緩和」でも一致すれば正解
 *     半角/全角、ひらがな/カタカナ、長音、句読点・括弧、
 *     単位付き数値（40 mL ＝ 40 ＝ 0.040 L）、指数表記（5.0×10⁻² ＝ 0.050）、
 *     化学的な同義語（ろ過＝濾過、貴ガス＝希ガス、ネオン型＝Ne型 など）
 *
 * これがアプリ全体の「正解/不正解」判定の唯一の基準。
 */
export function isAnswerCorrect(
  sq: JudgeableSubQuestion,
  userAnswer: string | undefined | null
): boolean {
  if (isDescriptive(sq)) return false;

  const ans = normalizeAnswer(userAnswer);
  if (!ans) return false;

  const candidates: string[] = [];
  if (sq.correctAnswer != null) candidates.push(sq.correctAnswer);
  if (Array.isArray(sq.acceptedAnswers)) candidates.push(...sq.acceptedAnswers);

  const compactAns = compactSymbolSequence(ans);
  const canUseCompact = looksLikeChoiceSequence(ans);
  const rawUser = String(userAnswer ?? '');

  return candidates.some((c) => {
    const normalizedCandidate = normalizeAnswer(c);

    // ① 従来どおりの厳密一致（最速パス）
    if (normalizedCandidate === ans) return true;

    // ② 選択肢記号の並び替え（区切り記号の違いを無視）
    if (
      canUseCompact &&
      looksLikeChoiceSequence(normalizedCandidate) &&
      !!compactAns &&
      compactSymbolSequence(normalizedCandidate) === compactAns
    ) {
      return true;
    }

    // ③ 表記ゆれの緩和（半角全角・かなカナ・単位・同義語 など）
    return isEquivalentAnswer(c, rawUser);
  });
}

/**
 * 「完答グループ」を考慮した正誤判定。
 *
 * ■ 何のためか（英語リスニング 第4問・第5問）
 *   本番の問18〜21（完答4点）、問28・29／問30・31（完答2点）は
 *   「グループの全問が合っていて初めて得点」で部分点が無い。
 *   アプリの得点（正解1問100点）でこれを再現するため、
 *   `allOrNothingGroup` を持つ小問は、同じグループの小問が
 *   全部正解のときだけ「正解」として数える。
 *
 * ■ 表示（✓／✗）には使わない
 *   解説画面の各小問の ✓／✗ は isAnswerCorrect のまま（その問自体が
 *   合っていたかを見せる）。得点の数え方だけを変える。
 *   グループを持たない小問は isAnswerCorrect とまったく同じ結果になる。
 */
export function isCountedCorrect(
  sq: JudgeableSubQuestion & { allOrNothingGroup?: string },
  all: (JudgeableSubQuestion & { allOrNothingGroup?: string })[],
  answers: Record<string, string | undefined>,
): boolean {
  const group = sq.allOrNothingGroup;
  if (!group) return isAnswerCorrect(sq, answers[sq.id]);
  const members = all.filter((s) => s.allOrNothingGroup === group);
  if (members.length === 0) return isAnswerCorrect(sq, answers[sq.id]);
  return members.every((m) => isAnswerCorrect(m, answers[m.id]));
}

/**
 * 自動採点可能な設問だけを抽出する。
 */
export function judgeableSubQuestions<T extends { type?: string }>(subQuestions: T[]): T[] {
  return (subQuestions || []).filter(isJudgeable);
}

/**
 * 設問群の採点結果（正誤マップ + 集計）。
 * 表示（✓/✗）とスコア計算の双方がこの結果を共有できる。
 */
export interface JudgeResult {
  /** setId ごとの正誤（記述式は含めない） */
  correctById: Record<string, boolean>;
  /** 正解数（自動採点可能なもののうち） */
  correctCount: number;
  /** 自動採点可能な設問数 */
  judgeableCount: number;
  /** 全設問数 */
  totalCount: number;
}

