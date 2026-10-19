/**
 * ===================================================================
 * 章カタログ（科目 → 章定義の一覧）
 * ===================================================================
 *
 * -------------------------------------------------------------------
 * ■ なぜこのファイルが必要なのか
 * -------------------------------------------------------------------
 * 先生ダッシュボードで「知識・技能」の到達率を出すには、
 *
 *     その科目に章がいくつあり、各章に大問が何問あるか（分母）
 *
 * が必要になる。ところが章データは科目ごとに別ファイルにあり、
 * 形も微妙に違う。集計側（utils/）から科目データを
 * 直接 import すると依存が絡まるので、
 *
 *     「科目ID → ChapterDefinition[]」への変換をここ1か所に閉じ込める。
 *
 * -------------------------------------------------------------------
 * ■ 分母の数え方（誠実さのルール）
 * -------------------------------------------------------------------
 * 問題が1問も入っていない章（化学発展の未収録章など）は
 * カタログから**除外**する。含めると「解きようがない章」が分母に
 * 入り、生徒の到達率が不当に低く出るため。
 * 到達率は常に「実際に解ける問題」に対する割合とする。
 *
 * -------------------------------------------------------------------
 * ■ ★どこから章の情報を取るか（ここが今回変わった点）★
 * -------------------------------------------------------------------
 * このカタログが返すのは、1章につき
 *
 *     { id, title, totalProblems }
 *
 * の3項目だけである。★問題文・選択肢・解説は1文字も使っていない。★
 * それにも関わらず、以前は教科データ本体（getPartsOfSubject）から
 * 章オブジェクトを受け取っていたため、依存グラフを辿ると
 *
 *     chapterCatalog.ts が引き込む src/data … 47 ファイル / 2,578,344 バイト
 *
 * になっていた。この重さは先生ダッシュボード（TeacherDashboard.tsx）へ
 * そのまま伝わり、同画面の src/data も 2,589,638 バイトになっていた。
 * 問題を増やせばこの数字がそのまま増える場所である。
 *
 * そこで取得元を、教科データから機械的に作られる軽い索引
 * （chapterIndex.generated.ts）に切り替えた。
 * 索引が持っているのは章ID・章名・大問数だけなので、
 * ★問題を何万問足しても、このファイルが読む量は章の数ぶんしか増えない。★
 *
 * -------------------------------------------------------------------
 * ■ 中身が本体とズレないこと（ここが一番大事）
 * -------------------------------------------------------------------
 * 「索引に切り替える」ことの唯一の危険は、索引が古くなって
 * ★到達率の分母だけが古い値のままになる★ことである。
 * これは「解いたのに％が上がらない」という、先生・生徒の両方から見て
 * 最も原因の分からない種類の不具合になる。
 *
 * それを防ぐために2重の仕掛けがある。
 *   1. 索引は必ず教科データから生成する（npm run gen:index）
 *   2. tests/chapterIndex.test.ts が索引と本体を1件ずつ突き合わせ、
 *      tests/chapterCatalog.test.ts がこのカタログの中身を
 *      ★教科データ本体から数え直した結果★と比べる
 * 再生成を忘れればテストが落ちるので、古い分母は本番へ出ない。
 *
 * また、章名の式（abstractTitle || realTitle || id）を崩さないために、
 * 索引側に realTitle も持たせてある。「今の実データでは全章が
 * abstractTitle を持つから省く」という省略はしていない
 * （省くと将来 abstractTitle の無い章で生の章IDが表示される）。
 */

import type { ChapterDefinition } from '../utils/studySummary';
// 教科IDの型だけを借りる。
// ★import type で書くこと★ … `import { type SubjectKey } from './allChapters'`
// と書くとモジュールの解決自体は行われ、6教科ぶんの教科データが
// 読み込みに含まれてしまう（実測 2.5MB）。型だけの文なら完全に消える。
import type { SubjectKey } from './allChapters';
// 章ID・章名・大問数だけを持つ軽い索引（教科データから自動生成される）
import { SUBJECT_INDEX } from './chapterIndex.generated';

/**
 * このカタログが扱う教科。
 * 実体は allChapters.ts の SubjectKey（アプリ全体で唯一の教科ID定義）。
 */
export type CatalogSubject = SubjectKey;

/**
 * 科目の表示名（レポートの文章にも使う）。
 *
 * ★実体は data/subjectLabels.ts。ここは再公開しているだけ。★
 *
 * 以前はこのファイルの中で
 *     Object.fromEntries(SUBJECT_INDEX.map((s) => [s.id, s.label]))
 * を組み立てていたが、まったく同じ3行が SubjectSelection.tsx にもあり、
 * 「教科名の唯一の定義」が2つ存在する状態だった。
 * 今は値が一致するが、片方の組み立て方だけを将来変えたときに
 * 画面ごとに違う教科名が出て、しかもどちらが正しいか分からなくなる。
 *
 * そこで組み立てを subjectLabels.ts 1本に寄せた。
 * 呼び出し側（TeacherDashboard・各テスト）は
 * 今までどおり chapterCatalog から SUBJECT_LABELS を読める。
 *
 * 出どころは変わっていない：索引の id / label は教科データの
 * SUBJECTS から自動生成したもので、一致は
 * tests/chapterIndex.test.ts と tests/allChapters.test.ts が検査する。
 */
export { SUBJECT_LABELS } from './subjectLabels';

/**
 * 索引の章を ChapterDefinition に詰め替える。
 *
 * 元の実装（教科データ本体から作っていたとき）と式を1対1で合わせてある。
 *   - 除外条件      : 大問が 0 件の章は分母に入れない
 *   - title の決め方 : abstractTitle || realTitle || id の順に採用し、trim する
 *   - totalProblems : ミニテスト ＋ 演習の件数（data/problemCount.ts と同じ数え方）
 * 索引の problemCount は countChapterProblems で作られているので、
 * ここで数え直す必要はない（同じ数え方であることはテストが検査する）。
 */
function toDefinitions(
  chapters: readonly {
    id: string;
    title?: string;
    abstractTitle?: string;
    realTitle?: string;
    problemCount: number;
  }[],
): ChapterDefinition[] {
  const rows: ChapterDefinition[] = [];
  chapters.forEach((chapter) => {
    // 問題が無い章は到達しようがないので分母に入れない
    if (chapter.problemCount === 0) return;
    rows.push({
      id: chapter.id,
      // 元の式は abstractTitle || realTitle || id。
      // 索引は title も持っている教科があるが、元の実装は title を見ていないので
      // ★ここでも見ない★（勝手に候補を増やすと表示名が変わってしまう）。
      title: (chapter.abstractTitle || chapter.realTitle || chapter.id).trim(),
      totalProblems: chapter.problemCount,
    });
  });
  return rows;
}

/**
 * 科目の章一覧は起動後に変わらないので、初回だけ計算して使い回す。
 */
const cache = new Map<CatalogSubject, ChapterDefinition[]>();

export function getChapterCatalog(subject: CatalogSubject): ChapterDefinition[] {
  const hit = cache.get(subject);
  if (hit) return hit;

  // 未知のIDのときに先頭の教科（英語リスニング）へ落ちる挙動は、
  // 元の getPartsOfSubject / 元の switch の default 節と同じ。
  const entry = SUBJECT_INDEX.find((s) => s.id === subject) ?? SUBJECT_INDEX[0];
  const rows = toDefinitions(entry ? entry.chapters : []);
  cache.set(subject, rows);
  return rows;
}

