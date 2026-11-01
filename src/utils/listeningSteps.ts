/**
 * ==========================================================================
 * 英語リスニング：「問1で1つの進捗、問2で1つの進捗」にするための道具
 * ==========================================================================
 *
 * ■ なぜこのファイルが必要なのか（ご要望そのもの）
 *     > 今リスニングは、第1問Aだったらどの回も問1〜問4を同じ進捗に入れてると思うんだけど、
 *     > それもうやめて、問1で1つの進捗、問2で1つの進捗みたいな感じにしてほしい。
 *     > だから解説も修正な。
 *
 *   これまでは「第1回演習」を開くと問1〜問4の4問がすべて1画面に並び、
 *   4問まとめて「解答と解説を見る」を押す作りだった。そのため
 *
 *     ・進捗が 1/1 のまま動かず、4問解いても手応えが残らない
 *     ・解説も4問ぶんが一度にどっと出てきて、どの問の話か分からない
 *     ・スクロールしないと4問目にたどり着けない
 *
 *   という状態だった。そこで「1画面＝1問」に切り替える。
 *
 * ■ データは1問ずつに割らない（重要な設計判断）
 *   `practiceProblems` を問単位に割ってしまうと
 *
 *     ・進捗台帳のキー（`solved_problems_v1` の `章ID::大問ID`）が総入れ替えになり、
 *       これまでの学習記録が全部「未着手」に戻る
 *     ・ホームの分母（大問数）が 14 → 56 に跳ね上がり、達成率が一気に下がる
 *     ・ランキング（`leaderboard_chapter/{chapterId}_{uid}`）の過去スコアと
 *       比較できなくなる
 *
 *   という副作用が出る。ご要望は「見え方・解き方」の話なので、
 *   データ構造は据え置き、**表示と進行だけ**を問単位にする。
 *   つまり「大問（回）の中の何問目を今見ているか」を表す step を1つ足すだけ。
 *
 * ■ 対象を絞る理由
 *   化学の大問は「(1)で求めた値を(2)で使う」という連続した構成が多く、
 *   1問ずつに切ると前の設問を見返せなくなって解けなくなる。
 *   一方リスニングの第1問A/Bは1問ごとに音源が独立している（＝前の問を
 *   見返す必要がない）。そこで「音源トラックを持つ問題」だけを対象にする。
 */

/** 1問ぶんの表示単位 */
import type { Problem, SubQuestion } from '../types/curriculum';

/**
 * ステップ分けで読む大問の形。
 * 呼び出し元には空の値や組み立て途中の大問が来ることもあるので、全項目を任意にしている。
 */
type StepSource = Pick<Partial<Problem>, 'subQuestions' | 'audioTracks' | 'stepwise'> | null | undefined;

export interface ListeningStep {
  /** 大問（回）の中での位置（0始まり） */
  index: number;
  /** 小問ID（＝解答・採点・音源トラックのキー）。複数あるときは先頭の小問 */
  subQuestionId: string;
  /**
   * このステップで解く小問IDの一覧。
   *
   * ■ なぜ複数持てるようにしたか（第4問〜第6問）
   *   第1〜3問は「1問＝1音源」だったが、第4問以降は
   *   「1本の音声（講義・4人の発話）に問18〜21の4つの解答欄」のように
   *   複数の小問が同じ音源にぶら下がる。音声は1回しか流れないので、
   *   1つの音声に属する小問は必ず同じ画面で解かせないと
   *   「問19を解くために問18の音声をもう一度聞く」ことになり本番と違う。
   *   そこで「1ステップ＝1音源」とし、その音源が持つ小問を全部含める。
   *   第1〜3問では要素1つの配列になり、従来と同じ動きをする。
   */
  subQuestionIds: string[];
  /** 「問1」「問18〜21」などの見出し。取れないときは並び順から作る */
  label: string;
}

/**
 * その大問を「1問ずつ」に分けて進めるべきか。
 *
 * 判定は音源トラックの有無で行う。リスニング以外（化学など）は
 * audioTracks を持たないので、これまでどおり大問まるごと1画面のまま。
 */
export function isPerSubQuestionListening(problem: StepSource): boolean {
  // 英文法：答えを読み上げる音源は外したが「問1→解説→問2…」の1問ずつ進行は残す（2026-10-02）。
  //   音源の有無と進め方を切り離すため、明示フラグ stepwise でも1問ずつにする。
  //
  // ★2026-10-30 E5・E6：小問が1つでも1問ずつの画面にする★
  //   以前は「小問が2つ以上」のときだけ true にしていた。ところが音源か stepwise を持つ問題は
  //   画面側がリスニング扱い（listeningUnified）になり、本文をまるごと描かない。
  //   1問ずつでもない → 見出し・英文・図・音源のどれも描かれず、問題文が空になっていた。
  //     E5：英文法 第1章 第9回（41問目だけの1問の回）で問題文が出ない
  //     E6：「間違えた問題だけ解き直す」で小問が1つに絞られると、リスニングの図が出ない・
  //         解説に4問ぶんの再生ボタンが並ぶ
  //   小問が1つでも1問ずつの画面（見出し・英文・その問の音源・図を左に出す）を使えば全部そろう。
  const subs = problem?.subQuestions;
  if (!Array.isArray(subs) || subs.length === 0) return false;
  if (problem?.stepwise === true) return true;
  const tracks = problem?.audioTracks;
  return Array.isArray(tracks) && tracks.length > 0;
}

/**
 * 音源トラックが「複数の小問をまとめる」形（第4問以降）か。
 * subIds を持つトラックが1つでもあれば、その大問は音源単位でステップを切る。
 */
function hasGroupedTracks(problem: StepSource): boolean {
  const tracks = Array.isArray(problem?.audioTracks) ? problem.audioTracks : [];
  return tracks.some((t) => Array.isArray(t?.subIds) && t.subIds.length > 0);
}

/** 小問ラベル（'問2 話者（…）の発話に…'）から「問2」だけを取り出す。 */
export function stepLabelOf(sq: Pick<SubQuestion, 'label'> | null | undefined, index: number): string {
  const matched = String(sq?.label || '').match(/^\s*(問\s*\d+)/u);
  if (matched) return matched[1].replace(/\s+/gu, '');
  return `問${index + 1}`;
}

/**
 * 大問を「問1／問2／…」の表示単位に並べ替える。
 *
 * 1問ずつにしない大問（化学など）では、全小問をまとめた1ステップだけを返す。
 * こうすると呼び出し側は「ステップ配列を順に見せる」だけで両方に対応でき、
 * リスニング用と従来用で描画コードを二重に持たなくて済む。
 */
export function buildListeningSteps(problem: StepSource): ListeningStep[] {
  const subs: SubQuestion[] = Array.isArray(problem?.subQuestions) ? problem.subQuestions : [];
  if (subs.length === 0) return [];

  // ---- 第4問以降：音源1本＝1ステップ（複数の解答欄） ----
  if (hasGroupedTracks(problem)) {
    const tracks = problem?.audioTracks ?? [];
    const steps: ListeningStep[] = [];
    const used = new Set<string>();
    tracks.forEach((t) => {
      const ids: string[] = Array.isArray(t?.subIds) && t.subIds.length > 0
        ? t.subIds.map(String)
        : [String(t?.subId ?? '')];
      // 音源が指す小問のうち、実際に存在するものだけ（並びは subQuestions の順）
      const present = subs.filter((sq) => ids.includes(String(sq?.id))).map((sq) => String(sq.id));
      if (present.length === 0) return;
      present.forEach((id) => used.add(id));
      steps.push({
        index: steps.length,
        subQuestionId: present[0],
        subQuestionIds: present,
        label: String(t?.label || stepLabelOf(subs.find((sq) => String(sq.id) === present[0]), steps.length)),
      });
    });
    // どの音源にも属さない小問が残っていたら、従来どおり1問ずつ足す（データ欠けの安全網）
    subs.forEach((sq) => {
      const id = String(sq?.id ?? '');
      if (used.has(id)) return;
      steps.push({
        index: steps.length,
        subQuestionId: id,
        subQuestionIds: [id],
        label: stepLabelOf(sq, steps.length),
      });
    });
    return steps;
  }

  // ---- 第1〜3問：1問＝1ステップ（従来どおり） ----
  return subs.map((sq, index) => {
    const id = String(sq?.id ?? `sub_${index}`);
    return {
      index,
      subQuestionId: id,
      subQuestionIds: [id],
      label: stepLabelOf(sq, index),
    };
  });
}

/**
 * ステップに含まれる小問オブジェクトを取り出す（subQuestions の並び順のまま）。
 */
export function stepSubQuestions(problem: StepSource, step: ListeningStep | null | undefined): SubQuestion[] {
  if (!step) return [];
  const subs: SubQuestion[] = Array.isArray(problem?.subQuestions) ? problem.subQuestions : [];
  const wanted = new Set(step.subQuestionIds);
  return subs.filter((sq) => wanted.has(String(sq?.id)));
}

/**
 * 「大問ID＋小問ID」から、採点結果を保存するキーを作る。
 *
 * ★`run.perQuestion` とは別の入れ物（`perStep`）に入れる★
 *   `perQuestion` は「大問1つ＝1レコード」という前提で
 *   進捗の引き継ぎ処理（progress.ts の backfillLegacyProgress）が
 *   キーをそのまま大問IDとして読んでいる。ここに小問単位のキーを混ぜると
 *   存在しない大問を「解いた」と誤って数え、進捗が分母を超えてしまう。
 *   そのため小問単位の記録は別フィールドに分ける。
 */
export function stepScoreKey(questionId: string, subQuestionId: string): string {
  return `${questionId}::${subQuestionId}`;
}

/** 進捗ピル（例「2〜3 / 8」）に出す値 */
export interface ProgressPill {
  /** いま解いている位置（1始まり） */
  position: number;
  /** 1画面に複数の解答欄があるときの末尾（例「2〜3」の 3）。1つだけなら undefined */
  positionEnd: number | undefined;
  total: number;
}

/**
 * 進捗ピルの分子・分母を決める。
 *
 * ・1問ずつモード（リスニング）… その回の中の「答えの数」を数える（例 2/4）
 * ・従来モード               … 範囲内の「大問」を数える（例 3/14）
 *
 * 第4問〜第6問は「音声1本に問34・35の2つの解答欄」なので、画面は1枚でも答えは2問。
 * 結果画面と数え方を揃えるため、どちらも「答えの数」で数える（2026-10-05 ご指摘「1問なのに2問と出る」）。
 */
export function buildProgressPill(input: {
  perStep: boolean;
  steps: readonly Pick<ListeningStep, 'subQuestionIds'>[];
  stepIndex: number;
  rangeCount: number;
  rangePosition: number;
}): ProgressPill {
  const { perStep, steps, stepIndex, rangeCount, rangePosition } = input;
  if (!perStep) return { position: rangePosition, positionEnd: undefined, total: rangeCount };
  const answersPerStep = steps.map((step) => Math.max(1, step.subQuestionIds.length));
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const position = sum(answersPerStep.slice(0, stepIndex)) + 1;
  const current = answersPerStep[stepIndex] ?? 1;
  return {
    position,
    positionEnd: current > 1 ? position + current - 1 : undefined,
    total: sum(answersPerStep),
  };
}
