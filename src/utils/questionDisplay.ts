/**
 * questionDisplay.ts — 問題文（左側）と解答欄（右側）の表示ルールを支える共有ユーティリティ
 *
 * 【表示ルール】
 * 1. 左側の「問題文」欄には、共通のリード文に加えて、続く全小問の設問文
 *    （問1、問2、…）を順番に表示する。左側だけ読めば全設問が理解できる。
 * 2. 右側の「解答欄」には設問文自体は含めず、設問マーカー（(ア)/(1)/問2 など）と
 *    入力フォーム・選択肢のみを配置する。
 *
 * そのために、設問ラベル（sq.label）を
 *   - marker: 「(ア)」「(1)」「問2」などの識別子
 *   - body  : マーカーに続く設問文本体
 * に分離するヘルパーを提供する。
 *
 * 【枝番（① ② / (a) (b) / （ア）（イ））の扱い】
 *   1つの大問マーカーの中がさらに枝分かれしている設問がある。
 *     例) "(3)① 非共有電子対を最も多くもつ分子"
 *         "(3)② 非共有電子対をもたない分子（すべて）"
 *         "問2 ①" 〜 "問2 ⑩"
 *   従来は marker が両方とも "(3)" になってしまい、解答欄に
 *   同じ "(3)" が並んで「今どの問題を解いているのか分からない」
 *   状態だった。そこで枝番はマーカー側に含め "(3)①" と表示する。
 *   （枝番は body 側からは取り除くので、左側の設問一覧では
 *     マーカー "(3)①" ＋ 本文 "非共有電子対を…" と並ぶ）
 */
import type { ProblemLike, SubQuestionLike } from '../types/curriculum';
import { joinMarker, splitQuestionLabel, CIRCLED, resolveAnswerMarkers, buildSubQuestionList } from './questionLabel';
export { extractInlineQuestionRows, extractListeningQuestionRows, extractSubQuestionSentences, findSubQuestionSentence } from './questionRowExtractor';
export type { InlineQuestionRow, InlineQuestionRows } from './questionRowExtractor';
export { cleanQuestionText, joinMarker, splitQuestionLabel, CIRCLED, resolveAnswerMarkers, buildSubQuestionList } from './questionLabel';
export type { SplitLabel } from './questionLabel';

/**
 * ★選択肢に付ける丸文字（①②③…）を決める★
 *
 * ご要望：「解答入力のところにも丸文字を。」
 *
 * ■ なぜ「常に index+1 の丸数字を出す」ではいけないのか（実測）
 *     全教科の multiple_choice を走査すると：
 *       英語リスニング 221問 / 英文法 100問 → options が既に ['①','②',…]
 *       で ★選択肢文字列そのものが丸数字★
 *     ここに更に丸数字バッジを足すと「① ①」と二重に出る。
 *
 *     さらに、設問文が「次の①〜⑥のうちから一つ選べ」と番号の範囲を
 *     明示している問題（地理 3問）では、バッジの番号と本文の番号が
 *     食い違うと ★問題文が嘘になる★。実測では地理の3問すべて
 *     （①〜⑥↔6択、①〜④↔4択、①〜④↔4択）で個数が一致しており、
 *     全教科で個数の不一致は0件だった。よって
 *     「出現順に番号を振る」で本文と必ず整合する。
 *
 * ■ 判定は選択肢の中身という事実だけで行う（教科で決め打ちしない）
 *     選択肢文字列が既に丸数字だけ／丸数字で始まる場合は付けない。
 *     それ以外には出現順の丸数字を付ける。⑳を超えた分は付けない
 *     （存在しない文字を作らない）。
 */
export function optionCircledMark(option: string, index: number): string {
  const raw = String(option ?? '').trim();
  // 既に丸数字を持っている選択肢（英語リスニング・英文法）には付けない
  if (/^[①-⑳]/u.test(raw)) return '';
  return CIRCLED[index] ?? '';
}

/**
 * 右側の解答欄カードに表示する「短いマーカー」を返す。
 * グループ化された設問（化学反応式の係数など）はグループ名の先頭語を冠する。
 *
 * (1) の中が ①② に枝分かれしている設問では "(1)①" のように枝番まで含める。
 * こうしないと解答欄に "(1)" が2つ並び、どちらを入力しているのか分からない。
 *
 * @param question 同じ問題の全設問。渡すと重複マーカーの自動採番まで行う。
 */
export function answerCardMarker(sq: SubQuestionLike, index: number, question?: ProblemLike): string {
  const fallback = `問${index + 1}`;
  let full: string;

  const resolved = question ? resolveAnswerMarkers(question).get(sq) : undefined;
  if (resolved) {
    full = resolved;
  } else {
    const { marker, subMarker } = splitQuestionLabel(sq?.label || '', fallback);
    full = joinMarker(marker, subMarker);
  }

  if (sq?.group) {
    const groupHead = String(sq.group).split(' ')[0];
    return `${groupHead} : 係数 ${full || sq.label}`;
  }
  return full || fallback;
}

/**
 * 「設問一覧」が問題文の丸写しになっているかを判定する。
 *
 * ご要望（原文）：
 *   > 数学の問題でさ、設問一覧と問題が同じなので、同じやつはもう設問一覧いらない
 *
 * ■ なぜ「数学なら消す」という実装にしないのか
 *   ご指摘のとおり、問題によって作りが違うので科目で決め打ちすると壊れる。
 *   実際に全306問を走査して数えると、重複の有無は科目では決まらなかった。
 *
 *     科目        問題数  一覧なし  完全重複  一部重複  重複なし
 *     化学基礎     153      7        30       24       92
 *     化学(発展)    20     12         1        1        6
 *     数学          65      0        43       16        6
 *     生物基礎      24     23         0        1        0
 *
 *   ・数学にも「重複していない」問題が 6 件ある（消すと設問が読めなくなる）
 *   ・化学基礎にも「完全に重複している」問題が 30 件ある（消して良い）
 *   ・そして最も危険なのが「一部重複」41 件。
 *     一覧の一部だけが問題文にあるので、一覧ごと消すと
 *     問題文に載っていない設問が完全に読めなくなる。
 *
 * ■ 判定ルール
 *   「一覧のすべての項目が問題文の中に見つかるときだけ」冗長とみなす。
 *   1 項目でも問題文に無ければ false（＝一覧を残す）＝安全側に倒す。
 *
 *   比較は表記ゆれを吸収するため
 *     ・空白（全角/半角/改行）を除去
 *     ・全角括弧 （） を半角 () に寄せる
 *   の正規化をしてから包含判定する。
 *   例）問題文 "（1）∫ x^4 dx" と ラベル "（1）∫ x^4 dx" は一致し、
 *       "(1)∫x^4dx" として突き合わせる。
 *
 * @returns true = 一覧は問題文の繰り返しなので省略して良い
 */
export function isSubQuestionListRedundant(question: ProblemLike): boolean {
  const list = buildSubQuestionList(question);
  // 一覧が空なら「省略する/しない」を語る意味が無い（呼び出し側も描画しない）
  if (list.length === 0) return false;

  const text = normalizeForDuplicateCheck(String(question?.text || ''));
  if (!text) return false;

  return list.every(item => {
    const body = normalizeForDuplicateCheck(item.body);
    // 本文が無い（マーカーだけの）項目は判定材料にならないので
    // 「重複している」側に数える（残す理由にはならない）。
    if (!body) return true;

    // 判定1：本文が十分に長ければ、本文だけで照合する。
    //   マーカーの採番が問題文と一覧でずれている場合（自動採番など）でも
    //   拾えるので、こちらを先に見る。
    if (body.length >= MIN_BODY_LEN_FOR_TEXT_ONLY_MATCH && text.includes(body)) return true;

    // 判定2：短い本文は「マーカー＋本文」の並びで照合する。
    //   本文だけで照合すると偶然の一致が起きるため。
    //     例) 分類問題の選択肢 "水" は、リード文の "水溶液" にも当たってしまう。
    //   一方 "(11)水" のような並びは、問題文中の該当行にしか現れない。
    //   これにより、元素記号 (Li/Na/K…) や 1文字の物質名だけが並ぶ
    //   分類・暗記系の問題（化学基礎に多い）も正しく重複と判定できる。
    const marker = normalizeForDuplicateCheck(item.marker);
    if (marker && text.includes(marker + body)) return true;

    // どちらでも見つからない項目が1つでもあれば「一覧を残す」。
    return false;
  });
}

/**
 * 本文だけで重複照合してよい最小文字数。
 * これより短い本文は「マーカー＋本文」の並びでのみ一致を認める。
 */
const MIN_BODY_LEN_FOR_TEXT_ONLY_MATCH = 3;

/** 重複判定用の正規化（空白除去＋全角括弧を半角へ） */
function normalizeForDuplicateCheck(s: string): string {
  return String(s || '')
    .replace(/\s+/gu, '')
    .replace(/[（]/gu, '(')
    .replace(/[）]/gu, ')');
}
