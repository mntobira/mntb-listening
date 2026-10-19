/**
 * ===================================================================
 * 「英語リスニング」（共通テスト）の単元データ
 * ===================================================================
 *
 * 位置づけ
 *  - 既存の `chemistryData.ts`（化学基礎）／`chemistryAdvancedData.ts`（化学）と
 *    **まったく同じ parts / chapters 構造** を持つ。
 *    これにより単元選択画面（ChapterSelection）や進捗集計を
 *    そのまま流用でき、デザインも他科目と一切変わらない。
 *
 * 構造の対応（他科目と同じルール）
 *  - `parts[].title`        … 大きな区分。リスニングでは「前半（2回読み）／後半（1回読み）」
 *  - `chapters[].realTitle` … 単元選択画面のタブ見出し。
 *                              ★A・B が分かれる大問は「第1問 A」「第1問 B」と
 *                                別のタブ見出しにしている（ご要望）。
 *                                第1問 A と第1問 B は設問形式（英文を選ぶ／絵を選ぶ）が
 *                                まったく違うので、同じ「第1問」タブに同居させると
 *                                「今どちらの練習をしているのか」が分からなくなる。
 *  - `chapters[].abstractTitle`
 *                           … アプリ上の1単元。realTitle と同じ「第1問 A」を入れる
 *  - `chapters[].topics`    … その単元で扱う内容（設問形式の要約）
 *  - `chapters[].practiceProblems` / `miniTest`
 *                           … 問題本体。今回は「まず単元を追加する」段階なので
 *                              すべて空配列（画面上は「準備中」と表示される）
 *
 * ID 規約
 *  - 化学基礎 `c1_1` / 化学 `a1_1` と衝突しないよう、`el`（English Listening）接頭辞。
 *    例）`el1_A` = 英語リスニング・第1問A
 *  - 進捗・ランキングは章IDをキーに保存されるため、
 *    接頭辞を分けることで既存2科目のデータを一切汚染しない。
 *
 * 大問構成の根拠（2025・2026年度 共通テスト本試験。河合塾／東進の分析より）
 *   大問      設問形式                              配点  マーク数  読み上げ
 *   第1問 A   短い発話の内容に合う英文を選ぶ           28    4        2回
 *   第1問 B   短い発話の内容に合う絵を選ぶ             (同)  4        2回
 *   第2問     短い対話の内容に合う絵を選ぶ             12    3        2回
 *   第3問     短い対話について質問の答えを選ぶ         18    6        1回
 *   第4問 A   やや長い発話に沿って情報を整理する       12    8        1回
 *   第4問 B   複数の発話を比較し条件に合うものを選ぶ   (同)  1        1回
 *   第5問     講義＋ワークシート完成・図表の判断       16    7        1回
 *   第6問 A   2人の会話について質問の答えを選ぶ        14    2        1回
 *   第6問 B   3人の議論の意見・図表を選ぶ             (同)  2        1回
 *                                              合計 100   37
 *  ※ 配点は大問単位（A・B合計）で公表されるため、A/B に共通の値を持たせている。
 */

import { countProblemsInChapters } from './problemCount';
import { EL1_A_PROBLEMS } from './englishListeningQ1AProblems';
import { EL1_A_EXTRA_PROBLEMS } from './englishListeningQ1ASets';
import { EL1_B_PROBLEMS } from './englishListeningQ1BProblems';
import { EL2_PROBLEMS } from './englishListeningQ2Problems';
import { EL3_PROBLEMS } from './englishListeningQ3Problems';
import {
  EL4_A_PROBLEMS,
  EL4_B_PROBLEMS,
  EL5_PROBLEMS,
  EL6_A_PROBLEMS,
  EL6_B_PROBLEMS,
} from './englishListeningQ4to6Problems';
// 解説の後処理は listeningPostProcess.ts に1つだけ置いている
// （整形関数・リスニング専用の組み立ても、その中で使う）。
import { applyListeningPostProcess } from './listeningPostProcess';
import type { Problem } from '../types/curriculum';

/** 1つの単元（アプリ上の1単元）。他科目の chapter と同形。 */
export interface ListeningChapter {
  id: string;
  /** アプリの単元名として表示（例：「第1問 A」） */
  abstractTitle: string;
  /**
   * 単元選択画面のタブ見出しになる（例：「第1問 A」）。
   * A・B が分かれる大問は A・B それぞれを独立したタブにする。
   */
  realTitle: string;
  /**
   * 配点を合算するときの「大問」キー（例：'第1問'）。
   *
   * ■ なぜ realTitle と別に持つのか
   *   共通テストの配点は大問単位（第1問＝28点）でしか公表されない。
   *   realTitle を A・B で分けた結果、realTitle をキーに配点を集計すると
   *   第1問の28点を A と B で二重に数えてしまい合計が100点を超える。
   *   そこで「表示のためのタブ名（realTitle）」と
   *   「配点を数えるための大問名（questionGroup）」を分離した。
   */
  questionGroup: string;
  /** 扱う内容 */
  topics: string[];
  /** 演習問題（今回は未収録。問題を入れると自動で「最初から」ボタンが出る） */
  practiceProblems: Problem[];
  /** 小テスト（未収録） */
  miniTest: Problem[];
  // ---- ここから下はリスニング固有の情報（他科目には無いが、任意項目なので既存処理を壊さない） ----
  /** 大問単位の配点（A・B に分かれる大問は共通の値） */
  points: number;
  /** マーク数（＝解答数） */
  marks: number;
  /** 読み上げ回数。共通テストは第1問・第2問が2回読み、第3問以降は1回読み */
  readCount: 1 | 2;
  /** 登場する話者の人数（「1人（モノローグ）」「3人」など表示用の文字列） */
  speakers: string;
}

export interface ListeningPart {
  id: string;
  title: string;
  /** 区分の識別子（2回読みの前半／1回読みの後半） */
  section: 'first_half' | 'second_half';
  chapters: ListeningChapter[];
}

/**
 * 単元を組み立てる補助関数。
 * practiceProblems / miniTest の空配列を毎回書かずに済ませる
 * （chemistryAdvancedData.ts の `ch()` と同じ役割）。
 */
const ch = (
  id: string,
  /** タブ見出し＝単元名（例：'第1問 A'）。表示はこの1つに統一する。 */
  title: string,
  /** 配点を合算するときの大問キー（例：'第1問'） */
  questionGroup: string,
  topics: string[],
  meta: { points: number; marks: number; readCount: 1 | 2; speakers: string },
): ListeningChapter => ({
  id,
  // タブ見出しと単元名は同じ文字列にする。
  // 別にすると「タブは第1問、カードは第1問 A」と2通りの呼び名が生まれ、
  // どの単元を開いているのか分かりにくくなるため。
  abstractTitle: title,
  realTitle: title,
  questionGroup,
  topics,
  practiceProblems: [],
  miniTest: [],
  ...meta,
});

export const englishListeningData: { parts: ListeningPart[] } = {
  parts: [
    // =================================================================
    // 前半（第1問・第2問）＝ 2回読み
    // 音声が2回流れるため確実に得点したい領域。全体配点の40点分。
    // =================================================================
    {
      id: 'el_first_half',
      title: '前半（2回読み）',
      section: 'first_half',
      chapters: [
        ch(
          'el1_A',
          '第1問 A',
          '第1問',
          ['短い発話の内容に合う英文を選ぶ', '言い換え（パラフレーズ）の理解', '数量・時刻・否定表現の聞き取り'],
          { points: 28, marks: 4, readCount: 2, speakers: '1人（短い発話）' },
        ),
        ch(
          'el1_B',
          '第1問 B',
          '第1問',
          ['短い発話の内容に合う絵を選ぶ', '位置・動作・状態の描写', '前置詞と語彙の正確な理解'],
          { points: 28, marks: 4, readCount: 2, speakers: '1人（短い発話）' },
        ),
        ch(
          'el2',
          '第2問',
          '第2問',
          ['短い対話の内容に合う絵を選ぶ', '日本語の場面説明を活用する', '比較・変化の過程を選び分ける'],
          { points: 12, marks: 3, readCount: 2, speakers: '2人（対話）' },
        ),
      ],
    },

    // =================================================================
    // 後半（第3問〜第6問）＝ 1回読み
    // 1回しか流れないうえ、図表・ワークシートの読み取りが加わる。
    // 第4〜6問だけで42点あり、得点差が付きやすい領域。
    // =================================================================
    {
      id: 'el_second_half',
      title: '後半（1回読み）',
      section: 'second_half',
      chapters: [
        ch(
          'el3',
          '第3問',
          '第3問',
          ['短い対話について質問の答えを選ぶ', '設問の先読みと要点の把握', '正誤（What is true …?）形式への対応'],
          { points: 18, marks: 6, readCount: 1, speakers: '2人（対話）' },
        ),
        ch(
          'el4_A',
          '第4問 A',
          '第4問',
          ['やや長い発話に沿って情報を整理する', '図表・表の完成', 'イラストの並べ替え（不要な選択肢に注意）'],
          { points: 12, marks: 8, readCount: 1, speakers: '1人（モノローグ）' },
        ),
        ch(
          'el4_B',
          '第4問 B',
          '第4問',
          ['複数の発話を比較して条件に合うものを選ぶ', '4人の情報を聞きながら取捨選択する', '条件表への書き込みメモの型'],
          { points: 12, marks: 1, readCount: 1, speakers: '4人（複数の発話）' },
        ),
        ch(
          'el5',
          '第5問',
          '第5問',
          ['講義を聞いてワークシートを完成させる', 'グラフ・図表と聞き取り内容の統合', '選択肢を先に意味で分類する'],
          { points: 16, marks: 7, readCount: 1, speakers: '1人（講義）＋討論' },
        ),
        ch(
          'el6_A',
          '第6問 A',
          '第6問',
          ['2人の会話について質問の答えを選ぶ', '話者の立場・意図の把握', '会話の流れを追う'],
          { points: 14, marks: 2, readCount: 1, speakers: '2人（会話）' },
        ),
        ch(
          'el6_B',
          '第6問 B',
          '第6問',
          ['3人の議論から意見と図表を選ぶ', '賛成・反対の立場を整理する', '意見の根拠となるグラフを判断する'],
          { points: 14, marks: 2, readCount: 1, speakers: '3人（議論）' },
        ),
      ],
    },
  ],
};

// =====================================================================
// 問題の流し込み
// =====================================================================
//
// 化学（chemistryAdvancedData.ts）とまったく同じ手順で、
// 別ファイルに切り出した問題を単元IDをキーに割り当てる。
// 回（第1回・第2回…）を増やすときは問題ファイル側の配列に足すだけでよい。

/** 単元ID → 演習問題。収録済みの単元だけを列挙する。 */
const LISTENING_PROBLEMS: Record<string, Problem[]> = {
  // 第1問A：手作りの第1回 ＋ 配布PDF由来の13セット（第2回〜第14回）
  el1_A: [...EL1_A_PROBLEMS, ...EL1_A_EXTRA_PROBLEMS],
  // 第1問B：配布PDF（スクリプト側）＋ イラストPDF を対応させた15セット
  el1_B: EL1_B_PROBLEMS,
  // 第2問：配布PDF「第２問.pdf」から取り出した実物イラストが揃った回だけを公開。
  //   第2問は絵を見比べて選ぶ大問なので、絵が無い問を出すと
  //   ①〜④のマークだけが並ぶ「解けない問題」になってしまう。
  //   そこで48問すべてを待たず、イラストが揃った問だけを先に出している。
  //   いま公開しているのは 16セット38問（PDF全体は16セット48問）。
  //   イラストは1マスずつ拡大して選択肢の文言と突き合わせ、
  //   絵と選択肢が完全に一致することを確認した分だけを収録している。
  //   絵と文がズレていた6問（6-3 / 7-3 / 8-3 / 11-1 / 13-1 / 16-2）は、
  //   絵を作り直すのではなく「文章側を絵に合わせて書き直す」方法で解決した
  //   （書き換えの根拠は scripts/data/q2_figure_audit.md、
  //     実体は scripts/q2_figure_fixes.py に記録）。
  //   また見出しと中身がズレていた6問は
  //   ILLUSTRATION_SOURCE_LABEL で正しいPDF見出しへ張り替えている。
  //   追加するときは実物イラストを public/listening_q2/ に置き、
  //     python3 scripts/extract_q2_illustrations.py --pdf <PDF>
  //     python3 scripts/gen_listening_q2_data.py
  //   を回すだけでよい（この行は変更不要）。
  el2: EL2_PROBLEMS,
  // 第3問：配布PDF由来の15セット（各6問・1回読み・2人の対話）
  el3: EL3_PROBLEMS,
  // 第4問〜第6問：配布 ZIP（listening_q4_q5_q6_all_2026-09-06_v2）の各15セット。
  //   音声・画像ともに完成品が同梱されている（public/listening_q4〜q6/）。
  //   問題データは JSON のまま置き、englishListeningQ4to6Problems.ts が
  //   読み込み時にアプリの形へ組み替える（理由はそのファイル冒頭）。
  //   第4問以降は「1本の音声に複数の小問」の構成なので、
  //   1画面＝1音源（複数の解答欄）で進む。
  el4_A: EL4_A_PROBLEMS,
  el4_B: EL4_B_PROBLEMS,
  el5: EL5_PROBLEMS,
  el6_A: EL6_A_PROBLEMS,
  el6_B: EL6_B_PROBLEMS,
};

(() => {
  for (const chapter of englishListeningData.parts.flatMap((p) => p.chapters)) {
    const problems = LISTENING_PROBLEMS[chapter.id];
    if (problems && problems.length > 0) {
      chapter.practiceProblems = problems;
    }
  }
})();

// 解説を「解答カード → 小問ごとのアコーディオン」へ自動整形する。
// enhanceExplanation は冪等（整形済みマーカーで二重適用を防ぐ）なので、
// HMR で再評価されても壊れない。
//
// ■ リスニングだけ専用の組み立てを先に試す理由（ご要望そのもの）
//     > 解説は、解答の道筋よりも以前にスクリプトをまずは出すこと。
//     > その後でそのスクリプトのどの単語／表現を聞き取れればよかったのかを反映する。
//     > スクリプトはスクリプトだけで枠で囲む。
//     > 解説が長すぎるというか変に多くて、どこが大事なのか分からない。
//   化学と同じ汎用エンジンだと［解答 → 思考手順 → 詳しい解説］の順になり、
//   スクリプトが本文の地の文に埋もれてしまう。リスニングは「聞こえたか」の勝負なので、
//   復習で最初に見たいのは “実際には何と言っていたのか” である。
//   そこで buildListeningExplanation が組み立てられた場合だけそれを使い、
//   組み立てられない（スクリプトが無い）ときは従来どおり汎用エンジンに任せる。
//
// ■ 中身は listeningPostProcess.ts に1つだけ置いている
//   英文法（englishGrammarData.ts）にまったく同じループが書かれていたため、
//   片方だけ直して片方を直し忘れる事故を防ぐために共通化した。
//   ★化学の後処理とは分岐が違うので、化学用とは別の関数のままにしている★
(() => {
  applyListeningPostProcess(englishListeningData);
})();

/** 単元選択画面などで使う「区分」の一覧 */
export const LISTENING_SECTIONS = [
  {
    id: 'first_half' as const,
    title: '前半（2回読み）',
    latin: 'First Half',
    description: '第1問・第2問。音声が2回流れる確実に取りたい40点',
  },
  {
    id: 'second_half' as const,
    title: '後半（1回読み）',
    latin: 'Second Half',
    description: '第3問〜第6問。1回読み＋図表読み取りで差が付く60点',
  },
];

export type ListeningSectionId = (typeof LISTENING_SECTIONS)[number]['id'];

/** 指定区分の part を返す（見つからなければ null） */
export function getListeningPart(section: ListeningSectionId): ListeningPart | null {
  return englishListeningData.parts.find((p) => p.section === section) || null;
}

/** 指定区分の単元一覧を返す */
export function getListeningChapters(section: ListeningSectionId): ListeningChapter[] {
  return getListeningPart(section)?.chapters || [];
}

/** 全区分の単元をまとめて返す（進捗集計に使う） */
export function getAllListeningChapters(): ListeningChapter[] {
  return englishListeningData.parts.flatMap((p) => p.chapters);
}

/**
 * 大問（questionGroup）ごとの収録状況。
 * A・B に分かれる大問は配点が共通なので、配点の二重計上を避けるために
 * 「大問単位でユニークにしてから」合計する。
 */
export function getListeningStats() {
  const chapters = getAllListeningChapters();
  // 大問の数（questionGroup のユニーク数）＝ 6。
  // ★realTitle ではなく questionGroup を使う★
  //   タブは A・B で分けたので realTitle は9種類あるが、
  //   共通テストの大問はあくまで第1問〜第6問の6つ。
  const sections = new Set(chapters.map((c) => c.questionGroup)).size;
  // 配点は大問単位で公表されるため、大問ごとに1回だけ足す
  const pointsByQuestion = new Map<string, number>();
  chapters.forEach((c) => pointsByQuestion.set(c.questionGroup, c.points));
  const points = [...pointsByQuestion.values()].reduce((a, b) => a + b, 0);
  // マーク数は単元ごとに独立しているのでそのまま合計する
  const marks = chapters.reduce((sum, c) => sum + c.marks, 0);
  // 大問の数え方（ミニテスト＋演習）は data/problemCount.ts に集約している
  const questions = countProblemsInChapters(chapters);
  return { sections, units: chapters.length, points, marks, questions };
}
