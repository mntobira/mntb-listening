/**
 * ==========================================================================
 * 英語リスニング：大問の中の「第N回演習」を取り出すための小さな道具
 * ==========================================================================
 *
 * ■ なぜこのファイルが必要なのか（ご要望）
 *   これまで「第1問A」を開くと、収録されている14回分の演習が
 *   ひとつの通し番号（進捗 1/14）でつながっていた。
 *   つまり「第1問Aを選ぶ」＝「14回分を最後まで通しで解く」しかなく、
 *
 *     ・今日は第3回だけやりたい
 *     ・前にやった第7回をもう一度だけ解き直したい
 *
 *   といった、ふつうの使い方ができなかった。
 *   そこで「第1問A のページ → 第1回演習〜第14回演習のボタンが並ぶ」形にする。
 *   その“回”を作るために、問題データから回の番号と見出しを取り出す。
 *
 * ■ どこから回の情報を取るのか
 *   問題データ（ListeningProblem）の `category` が
 *
 *     '第2回 短い発話の言い換え（易しめ（導入））'
 *     '第1回 発話に合うイラストを選ぶ（標準）'
 *
 *   のように「第N回 ＋ 内容」の形で書かれている。
 *   ここを機械的に読み取れば、データ側を書き換えずに回を作れる。
 *   （データを二重に持つと、片方だけ直して食い違う事故が起きる）
 *
 * ■ `index` を必ず持たせている理由
 *   ボタンを押したあとの遷移は、既存の
 *   `onSelectChapter(chapter.id, questionIndex, false)` をそのまま使う。
 *   保存や順位付けのキーは章ID（chapter.id）のままなので、
 *   これまでの学習記録・ランキングが1件も消えない。
 */
import type { ProblemLike } from '../types/curriculum';

/** 1回分の演習を表す */
export interface ListeningRound {
  /** 章の中での通し位置（0始まり）。画面遷移でそのまま使う */
  index: number;
  /** 問題ID（進捗の判定に使う） */
  questionId: string;
  /** 回の番号（1始まり） */
  roundNumber: number;
  /** ボタンの主見出し（例：'第3回演習'） */
  roundLabel: string;
  /** 回の内容（例：'短い発話の言い換え（標準）'）。空文字になることもある */
  detail: string;
}

/** '第12回 …' の先頭部分を拾う。全角の空白やスペース無しでも拾えるようにしている */
const ROUND_PATTERN = /^\s*第\s*(\d+)\s*回\s*(.*)$/u;

/**
 * `category` から回の番号と内容を読み取る。
 *
 * 「第N回」と書かれていないデータ（将来追加される大問など）でも
 * 画面が壊れないよう、その場合は並び順から番号を作る。
 */
export function parseRoundLabel(
  category: string | undefined | null,
  index: number,
): { roundNumber: number; detail: string } {
  const text = (category || '').trim();
  const matched = text.match(ROUND_PATTERN);
  if (matched) {
    const parsed = parseInt(matched[1], 10);
    return {
      roundNumber: Number.isFinite(parsed) && parsed > 0 ? parsed : index + 1,
      detail: (matched[2] || '').trim(),
    };
  }
  return { roundNumber: index + 1, detail: text };
}

/**
 * 章に入っている問題（practiceProblems / miniTest）を
 * 「第N回演習」のボタン一覧に変換する。
 *
 * 並び順はデータの順番のまま（＝本試験の並びのまま）にしている。
 * 回番号で並べ替えると、番号が付いていないデータが混ざったときに
 * 順番が突然入れ替わって混乱するため。
 */
export function buildListeningRounds(questions: ProblemLike[] | undefined | null): ListeningRound[] {
  if (!Array.isArray(questions)) return [];
  return questions.map((question, index) => {
    const { roundNumber, detail } = parseRoundLabel(question?.category, index);
    return {
      index,
      questionId: String(question?.id ?? `q_${index}`),
      roundNumber,
      roundLabel: `第${roundNumber}回演習`,
      detail,
    };
  });
}
