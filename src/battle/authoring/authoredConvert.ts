/**
 * ===================================================================
 * 手書き問題（authored）→ 対戦の1問 への変換
 * ===================================================================
 *
 * -------------------------------------------------------------------
 * ■ なぜ生成スクリプトの中ではなく、ここに置くのか
 * -------------------------------------------------------------------
 * この変換は「別の作業場が丸一日かけて書いた JSON」が
 * 対戦画面に出るかどうかを決める、唯一の関門である。
 *
 * scripts/gen-battle-pool.mts の中に閉じて書くと、
 * ★テストから呼べない★（スクリプトは import した瞬間に main() が走り、
 * 全教科データを読んでファイルを書き換えてしまう）。
 *
 * 過去に対戦プールで起きた事故（USE_SYNTHESIZED_FORMATS）は
 * 「生成器の中だけにあるロジックが、誰にも検査されないまま
 *   壊れた問題を本番に出した」というものだった。
 * 同じ形にはしない。★変換の判断はここに置き、テストで固定する。★
 *
 * -------------------------------------------------------------------
 * ■ このファイルは問題データを一切 import しない
 * -------------------------------------------------------------------
 * 五十音キーボードの番号表（画面と共有）と、
 * 答えの正規化（重複判定に使う）だけを見る。
 * 教科データ（約2.5MB）は読まない。
 *
 * -------------------------------------------------------------------
 * ■ 方針: 迷ったら出さない
 * -------------------------------------------------------------------
 * 変換できない問題は null を返して落とす。
 * ここに来る JSON は verify:authored を通っている前提だが、
 * 検証器を通さずに手で置かれる可能性はゼロではない。
 *
 *     壊れた問題が1問出る > 出題が1問減る
 *
 * のどちらが悪いかは明らかで、前者は「両者とも絶対に正解できない試合」に
 * なる。しかも点数は Firestore に残らないので後から追えない。
 */

import { kanaKeysOf, KANA_MAX_INPUT } from '../core/kanaKeyboard';
import { hashString } from '../core/battleCore';
import { normalizeAnswer } from '../../utils/answerJudge';
import type { AuthoredQuestion } from './authoredTypes';

// ============================================================
// 制約（生成器と共有する値）
// ============================================================

/**
 * 対戦の制限時間の下限・上限（秒）。
 * 生成器（gen-battle-pool.mts）の BATTLE_TIME_MIN / MAX と同じ値。
 * 手書きが 3 秒や 300 秒を書いてきても、この範囲に丸める。
 */
export const AUTHORED_TIME_MIN = 8;
export const AUTHORED_TIME_MAX = 30;

/**
 * 選択肢の数の範囲。
 * 下限2 … 元データが意図して作った2択（「元素／単体」など）を認める。
 * 上限6 … 7択以上はスマホの1画面で1つあたりが読めない大きさになる。
 */
export const AUTHORED_MIN_OPTIONS = 2;
export const AUTHORED_MAX_OPTIONS = 6;

/**
 * 五十音キーボードで書かせる答えの文字数。
 * 下限2 … 1文字は押した瞬間に確定するので誤タップがそのまま誤答になる。
 * 上限8 … 制限時間が最大30秒なので、9字以上は思い出せていても押し終わらない。
 */
export const AUTHORED_KANA_MIN = 2;
export const AUTHORED_KANA_MAX = 8;

/** 問題文の上限（画面に収まる長さ）。超えたら落とすのではなく末尾を切る */
const PROMPT_MAX = 150;

/** 選択肢カードに収まる長さ */
const OPTION_MAX = 60;

/**
 * 試合後に出す1行解答の上限。
 * 検証器（verify-authored-battle.mts の ONELINE_MAX）と同じ 120。
 * ここを超えるものは落とさずに末尾を切る（解答が出ないより短いほうがよい）。
 */
const ONELINE_MAX = 120;

// ============================================================
// 変換の結果
// ============================================================

/**
 * 変換結果。生成器の PoolQuestion と同じ形（subject は呼び出し側が持つ）。
 *
 * ★correctAnswer を持たせない★
 * 正解は answerIndex（choice系）／panelOrder（kana）だけで表す。
 * 答えの文字列を入れると、プールを配った時点で答えが読めてしまう。
 */
export interface AuthoredConverted {
  id: string;
  chapterId: string;
  problemId: string;
  subQuestionId: string;
  format: 'choice4' | 'choice' | 'kana';
  prompt: string;
  label: string;
  options: string[];
  answerIndex: number;
  panelOrder: number[];
  timeLimit: number;
  /**
   * ★試合後にだけ出す「答え＋ひと言の理由」（請求⑦-A）★
   *
   * ここは ★出題プール本体には入れない★。
   * 入れると、プールを配った時点で全問の答えが読めてしまう
   * （このファイル冒頭の correctAnswer を持たない理由と同じ）。
   * 生成器は出題プールと別のファイル（answer.<教科>.generated.ts）に分けて出し、
   * 画面は ★試合が終わってから★ そのファイルだけを動的に読む。
   *
   * 空文字になりうる（古い JSON が oneLine を持っていない場合）。
   * 空のときは画面側が「ひと言の理由」の行を出さない。
   */
  oneLine: string;
}

/**
 * 変換できなかった理由。
 *
 * ★理由を返す理由★
 * 「なぜか出題されない」が作業場にとって一番たちが悪い。
 * 生成器はこれをそのまま画面に出すので、作業場は自分の JSON の
 * どこが悪いかを数字ではなく言葉で受け取れる。
 */
export type AuthoredRejectReason =
  | 'id_format'
  | 'source_missing'
  | 'empty_text'
  | 'kana_not_katakana'
  | 'kana_length'
  | 'kana_unreachable'
  | 'options_count'
  | 'options_empty_text'
  | 'options_correct_count'
  | 'options_duplicate'
  | 'unknown_format';

/** 変換の戻り値。成功なら question、失敗なら reason が入る */
export type AuthoredConvertResult =
  | { ok: true; question: AuthoredConverted }
  | { ok: false; reason: AuthoredRejectReason };

// ============================================================
// 決定論的な乱数（選択肢の並べ替えに使う）
// ============================================================

/**
 * 種から擬似乱数を作る（生成器・battleCore と同じ mulberry32）。
 *
 * ★Math.random() を使わない理由★
 * 使うと生成のたびに違う並びになり、再生成の差分が
 * 「本当の変更」なのか「乱数のゆらぎ」なのか区別できなくなる。
 * ここでは問題IDを種にするので、同じ JSON からは必ず同じ並びが出る。
 */

function createRandom(seed: number): () => number {
  let a = seed >>> 0;
  return function random(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWith<T>(items: readonly T[], random: () => number): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

// ============================================================
// 変換
// ============================================================

function clampTime(value: unknown): number {
  const n = Math.round(Number(value) || 0);
  return Math.min(AUTHORED_TIME_MAX, Math.max(AUTHORED_TIME_MIN, n));
}

function trimText(text: string, max: number): string {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

/**
 * 手書き1問を、対戦プールの1問に変換する。
 *
 * @param q 検証器を通った（はずの）手書き問題
 * @returns 出題できる形なら ok:true、そうでなければ理由つきの ok:false
 */
export function convertAuthoredQuestion(q: AuthoredQuestion): AuthoredConvertResult {
  /**
   * ★ID の先頭は必ず `a:`★
   * 機械生成は `q:`（選択式）と `k:`（かな）を使う。
   * 先頭で見分けられるようにしておくと、生成ファイルを見るだけで
   * 「どれが手書きか」が分かる。混ざると調査ができなくなる。
   */
  const id = String(q.id || '').trim();
  if (!id.startsWith('a:')) return { ok: false, reason: 'id_format' };

  const src = q.source;
  if (!src || !src.chapterId || !src.problemId || !src.subQuestionId) {
    return { ok: false, reason: 'source_missing' };
  }

  const prompt = trimText(q.prompt || '', PROMPT_MAX);
  const label = trimText(q.label || '', PROMPT_MAX);
  // prompt と label が両方空だと、画面に何も表示されない問題になる
  if (!prompt && !label) return { ok: false, reason: 'empty_text' };

  const base = {
    id,
    chapterId: src.chapterId,
    problemId: src.problemId,
    subQuestionId: src.subQuestionId,
    prompt,
    label,
    timeLimit: clampTime(q.timeLimit),
    /**
     * ★ここで落とさない（空でも通す）★
     * oneLine は検証器（verify:authored）が 10〜120 文字で必須にしている欄だが、
     * 検証器を通さずに置かれた古い JSON もありうる。
     * 「解答が出ない」は出題できないほどの欠陥ではないので、
     * 空文字にして出題そのものは生かす（画面側が行を出さないだけ）。
     */
    oneLine: trimText(q.oneLine || '', ONELINE_MAX),
  };

  // ------------------------------------------------------------
  // 五十音キーボード形式
  // ------------------------------------------------------------
  if (q.format === 'kana') {
    const answer = String(q.answer || '').trim();
    // 長音符（ー）を含むカタカナだけ。漢字・英字・数字は押せない
    if (!/^[ァ-ヶー]+$/.test(answer)) return { ok: false, reason: 'kana_not_katakana' };

    const chars = Array.from(answer);
    if (chars.length < AUTHORED_KANA_MIN || chars.length > AUTHORED_KANA_MAX) {
      return { ok: false, reason: 'kana_length' };
    }
    // Firestore のルールが panel.size() <= 12 で拒否するので二重に見る
    if (chars.length > KANA_MAX_INPUT) return { ok: false, reason: 'kana_length' };

    /**
     * ★画面のキーボードから実際に押せる文字か★
     * 番号表（KANA_KEYS）に載っているだけで五十音表に置いていない文字
     * （現在は「ヲ」）が1つでも混ざると、誰も入力できない
     * ＝両者0点確定の問題になる。kanaKeysOf が到達可能性まで見る。
     */
    const keys = kanaKeysOf(answer);
    if (!keys) return { ok: false, reason: 'kana_unreachable' };

    return {
      ok: true,
      question: {
        ...base,
        format: 'kana',
        /**
         * ★選択肢は持たない★
         * 持たせると、プールを見ただけで「答えは5文字」「ノとルを使う」と
         * 分かってしまう。キーボードは画面側が描くのでデータは要らない。
         */
        options: [],
        answerIndex: -1,
        /** ★KANA_KEYS の添字の並び★（options の添字ではない） */
        panelOrder: keys,
      },
    };
  }

  // ------------------------------------------------------------
  // 選択式
  // ------------------------------------------------------------
  if (q.format !== 'choice' && q.format !== 'choice4') {
    return { ok: false, reason: 'unknown_format' };
  }

  const opts = Array.isArray(q.options) ? q.options : [];
  if (opts.length < AUTHORED_MIN_OPTIONS || opts.length > AUTHORED_MAX_OPTIONS) {
    return { ok: false, reason: 'options_count' };
  }
  if (opts.some((o) => !o || !String(o.text || '').trim())) {
    return { ok: false, reason: 'options_empty_text' };
  }
  /**
   * 正解はちょうど1つ。
   * 0個 … 誰も正解できない
   * 2個 … 正しく答えたのに不正解になる人が出る（どちらを選ぶかで運が決まる）
   */
  if (opts.filter((o) => o.correct === true).length !== 1) {
    return { ok: false, reason: 'options_correct_count' };
  }

  const texts = opts.map((o) => trimText(String(o.text), OPTION_MAX));
  /**
   * 選択肢の重複は「正解が2つある」状態と同じ。
   * 表記だけ違って中身が同じ（「一定」「一定である」）ものも
   * normalizeAnswer で潰してから見る。
   */
  const uniq = new Set(texts.map((t) => normalizeAnswer(t)));
  if (uniq.size !== texts.length) return { ok: false, reason: 'options_duplicate' };

  /**
   * ★並べ替えてから answerIndex を決める★
   *
   * JSON では correct:true が選択肢自身にくっついていて順番に意味がない。
   * 人が書くと正解が2番目に偏ることが知られているので、
   * ID を種にした決定論的シャッフルで並べ替える。
   * 種が ID なので、何度生成しても同じ並びになる。
   */
  const order = shuffleWith(
    texts.map((text, i) => ({ text, correct: opts[i].correct === true })),
    createRandom(hashString(`a:${id}`)),
  );
  const answerIndex = order.findIndex((o) => o.correct);
  if (answerIndex < 0) return { ok: false, reason: 'options_correct_count' };

  return {
    ok: true,
    question: {
      ...base,
      // 4つだけ choice4、それ以外（2・3・5・6）は choice。
      // 画面の並べ方を切り替えるための区別で、採点の扱いは同じ。
      format: order.length === 4 ? 'choice4' : 'choice',
      options: order.map((o) => o.text),
      answerIndex,
      panelOrder: [],
    },
  };
}

/** 落とした理由を、作業場が読んで直せる日本語にする */
export function authoredRejectMessage(reason: AuthoredRejectReason): string {
  switch (reason) {
    case 'id_format':
      return 'id が "a:" で始まっていない（機械生成の q: / k: と区別できない）';
    case 'source_missing':
      return 'source の chapterId / problemId / subQuestionId が揃っていない';
    case 'empty_text':
      return 'prompt と label が両方空（画面に何も表示されない）';
    case 'kana_not_katakana':
      return `answer がカタカナ（＋ー）だけになっていない`;
    case 'kana_length':
      return `answer の文字数が ${AUTHORED_KANA_MIN}〜${AUTHORED_KANA_MAX} 字の範囲外`;
    case 'kana_unreachable':
      return 'answer に五十音キーボードから押せない文字が含まれている（「ヲ」など）';
    case 'options_count':
      return `選択肢の数が ${AUTHORED_MIN_OPTIONS}〜${AUTHORED_MAX_OPTIONS} の範囲外`;
    case 'options_empty_text':
      return '選択肢に text が空のものがある';
    case 'options_correct_count':
      return 'correct: true がちょうど1つになっていない';
    case 'options_duplicate':
      return '選択肢に中身が同じものがある（正解が2つある状態と同じ）';
    case 'unknown_format':
      return 'format が choice4 / choice / kana のどれでもない';
    default:
      return '不明';
  }
}
