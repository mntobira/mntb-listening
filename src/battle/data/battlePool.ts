/**
 * ===================================================================
 * 対戦用 出題プールの読み込み口（自動生成・手で編集しないこと）
 * ===================================================================
 *
 * ★このファイルは scripts/gen-battle-pool.mts が生成する。★
 *
 * -------------------------------------------------------------------
 * ■ 役割
 * -------------------------------------------------------------------
 * 教科ごとに分かれた生成ファイル（pool.*.generated.ts）を
 * ★必要になった教科だけ★ 動的に読み込む。
 *
 * 全教科をまとめると約900KBある。対戦画面を開いた時点で全部読むと、
 * 化学基礎で対戦する人が英語・数学・地理の問題まで
 * ダウンロードすることになる。教科は対戦開始時に決まっているので、
 * その1教科だけを取れば十分である。
 *
 * -------------------------------------------------------------------
 * ■ 一度読んだ教科は使い回す
 * -------------------------------------------------------------------
 * 1試合の中で何度も呼ばれる（問題を1問ずつ引く）ので、
 * 読み込み結果はモジュール内に保持する。
 * 同じ教科で連続して対戦しても再ダウンロードは起きない。
 */

import type { BattleAnswerFormat, BattleQuestion } from '../core/types';

/** 教科ごとの収録数（UIで「この教科は◯問あります」と出すために使う） */
export const POOL_COUNTS: Readonly<Record<string, number>> = {"english_listening":254,"english_grammar":1188,"english_vocab":9541};

/**
 * 教科ごと・回答形式ごとの収録数。
 *
 * -------------------------------------------------------------------
 * ■ ★POOL_COUNTS（総数）だけでは足りない理由★
 * -------------------------------------------------------------------
 * 教科ごとのルール（battleRules.ts の formats）は「使う回答形式」を絞る。
 * 総数だけを見て教科カードを出すと、
 *
 *   ・カードには「収録 348 問」と書いてある
 *   ・でもルールが使う形式の問題は 1 問しか無い
 *   ・押すと対戦が始められない
 *
 * という ★選べるのに対戦できない★ 状態が起こる。
 * 実際に過去そうなりかけた（生物基礎が該当）。
 *
 * 形式別の数をここに持っておけば、画面は問題データ本体（数百KB）を
 * 読まずに「この教科でいま出せる数」を出せる。
 */
export const POOL_FORMAT_COUNTS: Readonly<
  Record<string, Readonly<Partial<Record<BattleAnswerFormat, number>>>>
> = {"english_listening":{"choice4":254},"english_grammar":{"choice4":1188},"english_vocab":{"choice4":9541}};

/**
 * その教科で「指定の形式のうち」何問使えるかを数える。
 *
 * ★画面の「収録N問」はこの数を出すこと。★
 * 総数（POOL_COUNTS）を出すと、上に書いたとおり嘘になる場合がある。
 */
export function poolCountOf(
  subject: string,
  formats: readonly BattleAnswerFormat[],
): number {
  const byFormat = POOL_FORMAT_COUNTS[subject];
  if (!byFormat) return 0;
  let total = 0;
  for (const f of formats) total += byFormat[f] || 0;
  return total;
}

/**
 * 形式番号 → 形式名。
 *
 * ★番号は生成器の FORMAT_CODE と同じ並びでなければならない。★
 * choice が末尾（3）にいるのは、あとから追加したときに
 * 既存の 0/1/2 を動かさなかったためである。並べ替えてはいけない。
 */
const FORMATS: readonly BattleAnswerFormat[] = ['choice4', 'word', 'panel', 'choice', 'kana'];

/**
 * タプルを BattleQuestion に戻す。
 *
 * ★並びは生成ファイル側の toTuple() と対応している。★
 * どちらか片方だけ変えると全教科が壊れるので、必ず同時に変えること。
 */
function expand(subject: string, t: readonly unknown[]): BattleQuestion {
  return {
    id: t[0] as string,
    subject,
    chapterId: t[1] as string,
    problemId: t[2] as string,
    subQuestionId: t[3] as string,
    // 形式番号が範囲外なら choice4 に寄せる。
    // 生成ファイルが古い（新しい形式番号を知らない）状態で
    // 画面だけ新しくなったときに、undefined が入って落ちるのを防ぐ。
    format: FORMATS[t[4] as number] ?? 'choice4',
    prompt: t[5] as string,
    label: t[6] as string,
    options: t[7] as string[],
    answerIndex: t[8] as number,
    panelOrder: t[9] as number[],
    timeLimit: t[10] as number,
    imageUrl: (t[11] as string) || undefined,
  };
}

async function loadRaw(subject: string): Promise<readonly unknown[][]> {
  switch (subject) {
    case 'english_listening':
      return (await import('./pool.english_listening.generated')).POOL;
    case 'english_grammar':
      return (await import('./pool.english_grammar.generated')).POOL;
    case 'english_vocab':
      return (await import('./pool.english_vocab.generated')).POOL;
    default:
      return [];
  }
}

/** 読み込み済みの教科（教科ID → 出題の配列） */
const cache = new Map<string, readonly BattleQuestion[]>();
/** 読み込み中の教科（同時に2回呼ばれても1回しか取りに行かないため） */
const inflight = new Map<string, Promise<readonly BattleQuestion[]>>();

/**
 * 教科の出題プールを読み込む。
 *
 * ★並び順はプールの並び（ID昇順）で固定★
 * 抽選は「部屋IDを種にした決定論的な乱数」でこの並びに対して行うため、
 * 順序が変わると同じ種でも違う問題が選ばれ、
 * 対戦相手と出題がズレる（＝対戦が成立しない）。
 * 生成時にID昇順で固定してあるので、問題を足さない限り順序は変わらない。
 */
export async function loadPool(subject: string): Promise<readonly BattleQuestion[]> {
  const cached = cache.get(subject);
  if (cached) return cached;

  const running = inflight.get(subject);
  if (running) return running;

  const promise = loadRaw(subject)
    .then(async (raw) => {
      const list = raw.map((t) => expand(subject, t));
      // Resolve before matchmaking starts; preserve IDs and order, expose no script/hints.
      if (subject === 'english_listening') {
        const { getAllListeningChapters } = await import('../../data/englishListeningData');
        const chapters = getAllListeningChapters();
        for (const question of list) {
          const chapter = chapters.find(c => c.id === question.chapterId);
          const problem = [...(chapter?.practiceProblems || []), ...(chapter?.miniTest || [])]
            .find(p => p.id === question.problemId);
          const track = problem?.audioTracks?.find((t: { subId: string; subIds?: string[] }) =>
            t.subId === question.subQuestionId || t.subIds?.includes(question.subQuestionId));
          if (!track?.audioUrl) throw new Error('Listening battle audio is missing: ' + question.id);
          question.audioUrl = track.audioUrl;
        }
      }
      cache.set(subject, list);
      inflight.delete(subject);
      return list as readonly BattleQuestion[];
    })
    .catch((error) => {
      inflight.delete(subject);
      throw error;
    });

  inflight.set(subject, promise);
  return promise;
}

/**
 * 出題ID → 出題。
 * 部屋に保存されているのは questionIds だけなので、これで本体に戻す。
 * ★読み込み済みの教科でしか引けない★（先に loadPool を呼ぶこと）
 */
export function questionByIdSync(subject: string, id: string): BattleQuestion | undefined {
  const list = cache.get(subject);
  if (!list) return undefined;
  return list.find((q) => q.id === id);
}

/** 出題IDの一覧（形式で絞り込む）。抽選の母集団に使う */
export async function poolIdsOf(
  subject: string,
  formats: readonly BattleAnswerFormat[],
): Promise<string[]> {
  const list = await loadPool(subject);
  return list.filter((q) => formats.includes(q.format)).map((q) => q.id);
}

/** 読み込み済みの出題を全部返す（テスト・検証用） */
export function loadedPool(subject: string): readonly BattleQuestion[] {
  return cache.get(subject) || [];
}

// ============================================================
// 試合後の解答（請求⑦-A）
// ============================================================

/**
 * 教科ごとの「1行解答を持つ問題」の数。
 * リザルト画面が「この教科は解答が出ます／出ません」を
 * データ本体を読まずに判断するために置いてある。
 */
export const ANSWER_COUNTS: Readonly<Record<string, number>> = {"english_listening":0,"english_grammar":1163,"english_vocab":9541};

async function loadAnswerRaw(subject: string): Promise<readonly (readonly [string, string])[]> {
  switch (subject) {
    case 'english_listening':
      return (await import('./answer.english_listening.generated')).ANSWERS;
    case 'english_grammar':
      return (await import('./answer.english_grammar.generated')).ANSWERS;
    case 'english_vocab':
      return (await import('./answer.english_vocab.generated')).ANSWERS;
    default:
      return [];
  }
}

/** 読み込み済みの解答（教科ID → 出題ID → 1行解答） */
const answerCache = new Map<string, ReadonlyMap<string, string>>();
const answerInflight = new Map<string, Promise<ReadonlyMap<string, string>>>();

/**
 * その教科の「試合後の1行解答」を読み込む。
 *
 * ★★ここは「試合が終わってから」しか呼んではいけない★★
 *
 * 出題プール（loadPool）と別のファイルに分けているのは、
 * 対戦前に答えが端末に落ちてくるのを防ぐためである。
 * 対戦画面や待機画面からこれを呼ぶと、その意味がまるごと消える。
 * 呼び出しているのはリザルト画面（BattleResult）だけであり、
 * tests/battleAnswers.test.ts がそれを検査している。
 *
 * 解答が1問も無い教科（機械生成だけの教科）では空の Map が返る。
 * 画面側は「無ければ答えの行を出さない」作りなので、それで正しく動く。
 */
export async function loadBattleAnswers(
  subject: string,
): Promise<ReadonlyMap<string, string>> {
  const cached = answerCache.get(subject);
  if (cached) return cached;

  const running = answerInflight.get(subject);
  if (running) return running;

  const promise = loadAnswerRaw(subject)
    .then((rows) => {
      const map: ReadonlyMap<string, string> = new Map(rows.map(([id, one]) => [id, one]));
      answerCache.set(subject, map);
      answerInflight.delete(subject);
      return map;
    })
    .catch((error) => {
      answerInflight.delete(subject);
      throw error;
    });

  answerInflight.set(subject, promise);
  return promise;
}
