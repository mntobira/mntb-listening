/**
 * ===================================================================
 * 章インデックス（軽い索引）の生成スクリプト
 * ===================================================================
 *
 * -------------------------------------------------------------------
 * ■ 何を作るスクリプトか
 * -------------------------------------------------------------------
 * 教科データ本体（src/data/*.ts）から、
 * ホーム画面が必要とする情報だけを抜き出した
 *
 *     src/data/chapterIndex.generated.ts
 *
 * を生成する。抜き出すのは次の4つだけで、問題文・選択肢・解説は含めない。
 *
 *     章ID / 章タイトル / 章の略称タイトル / その章の大問数
 *
 * -------------------------------------------------------------------
 * ■ なぜ必要になったのか（実測）
 * -------------------------------------------------------------------
 * ホーム画面（Home.tsx）は起動直後に必ず表示される画面だが、
 * 表示している内容は
 *
 *     ・教科ごとの「大問 12 / 174 問」という進捗
 *     ・「次の章：○○ から始めよう」という章名
 *
 * だけで、★問題文は1文字も出していない★。
 * ところが実装は教科データの章オブジェクトそのものを受け取っていたため、
 * 依存グラフを機械的に辿ると
 *
 *     Home.tsx が引き込む src/data … 50 ファイル / 2,637,176 バイト
 *
 * が起動時に読み込まれていた。問題を増やせばこの数字がそのまま増える。
 * 「問題数が莫大になっても耐えられるように」という要件に対して、
 * ここが最初に効く場所になる。
 *
 * 画面を後から読み込む（lazy 化）では解決しない。ホームは
 * ★必ず最初に出る画面★なので、後回しにできる相手がいない。
 * 必要なのは「ホームが読む量そのものを減らす」ことである。
 *
 * -------------------------------------------------------------------
 * ■ なぜ「生成」なのか（手書きの索引にしない理由）
 * -------------------------------------------------------------------
 * 索引を手で書くと、問題を1問足したときに索引の更新を忘れる。
 * その場合ホームの分母だけが古いままになり、
 * 「解いたのに進捗が増えない」という最も分かりにくい不具合になる。
 *
 * そこで索引は必ず教科データから機械的に作り、
 * ★中身が一致しているかをテストで毎回突き合わせる★
 * （tests/chapterIndex.test.ts）。
 * ズレたらテストが落ちるので、古い索引が本番へ出ることはない。
 *
 * -------------------------------------------------------------------
 * ■ 使い方
 * -------------------------------------------------------------------
 *     npm run gen:index
 *
 * 問題を足したあとにこれを実行して、差分をコミットする。
 * 実行を忘れた場合は tests/chapterIndex.test.ts が落ちて教えてくれる。
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SUBJECTS, getChaptersOfSubject } from '../src/data/allChapters';

/*
 * ★科目選択画面（タイトル画面）の「収録ボリューム」の数字も索引に入れる★
 *
 * ■ なぜ必要か（実測）
 *   科目選択画面はオンボーディング直後に必ず出る画面だが、
 *   科目データから取っているのは「全29単元・演習174問」のような
 *   ★数字だけ★で、問題文は1文字も表示していない。
 *   それにも関わらず6教科ぶんのデータを丸ごと読み込んでいたため、
 *   依存グラフを辿ると
 *     SubjectSelection.tsx が引き込む src/data … 47 ファイル / 2,578,344 バイト
 *   になっていた。ホームと同じ問題がここにも残っていた。
 *
 * ■ なぜ「生成時に本物の関数を呼ぶ」形にしたか
 *   数字を手で書き写すと、問題を追加したときに必ずズレる。
 *   ここでは本物の getListeningStats() などをそのまま呼び、
 *   ★戻り値をそのまま JSON にして埋め込む★。
 *   これなら生成のたびに本体と一致することが構造的に保証される。
 *   さらに tests/chapterIndex.test.ts が、実行時にも本物の関数と
 *   1フィールドずつ突き合わせるので、再生成を忘れれば必ずテストが落ちる。
 */
import { getAllAdvancedChapters } from '../src/data/chemistryAdvancedData';
import { getListeningStats } from '../src/data/englishListeningData';
import { getMathStats } from '../src/data/mathData';
import { getBiologyStats } from '../src/data/biologyBasicData';
import { getGrammarStats } from '../src/data/englishGrammarData';
import { getGeographyStats } from '../src/data/geographyData';
import { countProblemsInChapters } from '../src/data/problemCount';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '../src/data/chapterIndex.generated.ts');

/**
 * 章1つぶんの索引。
 *
 * フィールド名は Home.tsx が元々読んでいた名前と同じにしている
 * （id / title / abstractTitle）。呼び出し側の書き方を変えずに
 * 差し替えられるようにするため。
 *
 * ★realTitle も持たせている理由★
 *   先生ダッシュボード（chapterCatalog.ts）が章名を出すときの式は
 *
 *       abstractTitle || realTitle || id
 *
 *   で、abstractTitle が無い章では realTitle が使われる。
 *   実データでは現在 162 章すべてが abstractTitle を持っているため
 *   realTitle が選ばれる章は 0 件だが、それは「今たまたまそうである」
 *   だけで仕様ではない。索引に realTitle を入れずに切り替えると、
 *   将来 abstractTitle の無い章を追加した瞬間に、先生の画面へ
 *   `c99_1` のような★生の章IDが表示される★ことになる。
 *   しかも本体を見ないので誰も気づけない。
 *   そこで「今の実データで一致するから省く」ではなく、
 *   ★式そのものを再現できる情報を索引に持たせる★形にしてある。
 */
interface ChapterIndexEntry {
  id: string;
  title?: string;
  abstractTitle?: string;
  /** 教科書上の章名（例「1章 物質の構成」）。章名の代替に使う。 */
  realTitle?: string;
  /** この章の大問数（miniTest ＋ practiceProblems）。数え方は data/problemCount.ts と同じ。 */
  problemCount: number;
}

/** 教科1つぶんの索引（並び順・表示名も索引側に持たせる） */
interface SubjectIndexEntry {
  id: string;
  label: string;
  chapters: ChapterIndexEntry[];
}

/**
 * 科目選択画面のカードに出す「収録ボリューム」の数字。
 *
 * ★教科によって出す数字の種類が違う★ ので、共通の形に無理に揃えない。
 * （リスニングは「単元数・マーク数・配点」、化学基礎は「単元数・問題数」など）
 * 機械的に統一するとカードの文言が変わってしまうため、
 * 教科ごとに必要なキーだけを持つ形にしている。
 */
interface SubjectStats {
  chapters?: number;
  questions?: number;
  sections?: number;
  units?: number;
  points?: number;
  marks?: number;
}

/**
 * 科目選択画面が使う数字を、本物の集計関数から取ってくる。
 *
 * 化学基礎・化学（発展）は専用の stats 関数が無いので、
 * SubjectSelection.tsx が書いていた式をそのまま再現している
 * （章を並べて countProblemsInChapters で数える）。
 * この一致もテストで検査する。
 */
function buildSubjectStats(): Record<string, SubjectStats> {
  const basicChapters = getChaptersOfSubject('chemistry_basic');
  const advancedChapters = getAllAdvancedChapters();

  return {
    chemistry_basic: {
      chapters: basicChapters.length,
      questions: countProblemsInChapters(basicChapters as any),
    },
    chemistry: {
      chapters: advancedChapters.length,
      questions: countProblemsInChapters(advancedChapters as any),
    },
    english_listening: getListeningStats(),
    math: getMathStats(),
    biology_basic: getBiologyStats(),
    english_grammar: getGrammarStats(),
    geography: getGeographyStats(),
  };
}

function buildIndex(): SubjectIndexEntry[] {
  const index: SubjectIndexEntry[] = [];

  for (const subject of SUBJECTS) {
    const chapters = getChaptersOfSubject(subject.id).map((chapter: any) => {
      const entry: ChapterIndexEntry = {
        id: String(chapter.id),
        // 大問数の数え方は data/problemCount.ts の countChapterProblems と同一。
        // （ここで import すると生成物と実装で数え方がズレないが、
        //   このスクリプトは Node で動くだけなので同じ式を明示的に書いている。
        //   一致は tests/chapterIndex.test.ts が countChapterProblems と
        //   突き合わせて検査する。）
        problemCount:
          (chapter.miniTest?.length || 0) + (chapter.practiceProblems?.length || 0),
      };
      // 無い教科もあるので、あるときだけ入れる（無いキーを "undefined" と書かない）
      if (typeof chapter.title === 'string' && chapter.title) entry.title = chapter.title;
      if (typeof chapter.abstractTitle === 'string' && chapter.abstractTitle) {
        entry.abstractTitle = chapter.abstractTitle;
      }
      if (typeof chapter.realTitle === 'string' && chapter.realTitle) {
        entry.realTitle = chapter.realTitle;
      }
      return entry;
    });

    index.push({ id: subject.id, label: subject.label, chapters });
  }

  return index;
}

const HEADER = `/**
 * ===================================================================
 * 章インデックス（自動生成ファイル・手で編集しないこと）
 * ===================================================================
 *
 * ★このファイルは scripts/gen-chapter-index.mts が生成する。★
 * 手で書き換えても次の生成で消えるので、直したい場合は
 * 教科データ本体（src/data/*.ts）を直してから
 *
 *     npm run gen:index
 *
 * を実行すること。
 *
 * -------------------------------------------------------------------
 * ■ これは何か
 * -------------------------------------------------------------------
 * 教科データから「章ID・章名・その章の大問数」だけを抜いた軽い索引。
 * 問題文・選択肢・解説は含まない。
 *
 * ホーム画面（Home.tsx）は起動直後に必ず出るが、出しているのは
 * 進捗の数字と次の章名だけで、問題文は1文字も表示していない。
 * それにも関わらず教科データ本体を全部読み込んでいたため、
 * 起動時に src/data から 50 ファイル・約 2.6MB を読んでいた。
 * この索引に切り替えると、ホームが読むのはこのファイル1枚だけになる。
 *
 * 問題を増やしてもこのファイルは章の数（現在 162 章）ぶんしか増えない。
 * 「問題数が莫大になっても起動が重くならない」ことがこの索引の目的である。
 *
 * -------------------------------------------------------------------
 * ■ 中身が本体とズレないこと
 * -------------------------------------------------------------------
 * tests/chapterIndex.test.ts が、教科データ本体から数え直した結果と
 * この索引を1件ずつ突き合わせる。問題を足して再生成を忘れると
 * そのテストが落ちるので、古い索引のままリリースされることはない。
 *
 * -------------------------------------------------------------------
 * ■ このファイルは他の src を一切 import しない（葉モジュール）
 * -------------------------------------------------------------------
 * ここから教科データを import してしまうと、索引にした意味が無くなる
 * （結局本体が読み込まれる）。★何も import しないことが仕様である。★
 */

/** 章1つぶんの索引。フィールド名は Home.tsx が元々読んでいたものと同じ。 */
export interface ChapterIndexEntry {
  id: string;
  title?: string;
  abstractTitle?: string;
  /**
   * 教科書上の章名（例「1章 物質の構成」）。
   *
   * 先生ダッシュボードの章名は \`abstractTitle || realTitle || id\` で決まるため、
   * abstractTitle が無い章のために必要。現在の実データでは全章が
   * abstractTitle を持っているので出番は無いが、無いと将来
   * 章名の代わりに生の章IDが表示される（しかも気づけない）。
   */
  realTitle?: string;
  /** この章の大問数（miniTest ＋ practiceProblems） */
  problemCount: number;
}

/** 教科1つぶんの索引。並び順・表示名も持たせて、画面が SUBJECTS を見ずに済むようにしている。 */
export interface SubjectIndexEntry {
  id: string;
  /** 画面に出す教科名（data/allChapters.ts の SUBJECTS の label と同じ） */
  label: string;
  chapters: readonly ChapterIndexEntry[];
}

/**
 * 教科の索引一覧。
 *
 * ★並び順は data/allChapters.ts の SUBJECTS と同じ★
 * （ホーム画面の教科別進捗はこの順に縦に並ぶため、順序が意味を持つ）。
 * 一致は tests/chapterIndex.test.ts が検査する。
 */
export const SUBJECT_INDEX: readonly SubjectIndexEntry[] = `;

const FOOTER = `;

/**
 * 指定した教科の章索引を返す。
 *
 * 未知の教科IDのときは空配列ではなく先頭の教科（化学基礎）を返す。
 * これは data/allChapters.ts の getChaptersOfSubject と同じ既定の振る舞いで、
 * 画面が空にならないようにするためのもの。
 */
export function getChapterIndexOfSubject(
  subjectId: string | null | undefined,
): readonly ChapterIndexEntry[] {
  const entry = SUBJECT_INDEX.find((subject) => subject.id === subjectId) ?? SUBJECT_INDEX[0];
  return entry ? entry.chapters : [];
}
`;

/** 科目選択画面の「収録ボリューム」用の数字を書き出す部分 */
const STATS_HEADER = `
/**
 * 科目選択画面（タイトル画面）のカードに出す「収録ボリューム」の数字。
 *
 * -------------------------------------------------------------------
 * ■ なぜここに数字を置くのか
 * -------------------------------------------------------------------
 * 科目選択画面はオンボーディング直後に必ず出る画面だが、
 * 教科データから取っていたのは
 *
 *     「全29単元・演習174問」「配点100点・マーク37個」
 *
 * のような★数字だけ★で、問題文は1文字も表示していない。
 * それにも関わらず6教科ぶんのデータを丸ごと読み込んでいたため、
 * 依存グラフを辿ると 47 ファイル / 2,578,344 バイトになっていた。
 * 問題を増やせばこの数字がそのまま増える場所だった。
 *
 * -------------------------------------------------------------------
 * ■ 数字がズレない仕組み
 * -------------------------------------------------------------------
 * この値は生成時に★本物の集計関数★
 * （getListeningStats / getMathStats / getBiologyStats /
 *   getGrammarStats / countProblemsInChapters）を実際に呼び、
 * その戻り値をそのまま埋め込んだものである。
 * さらに tests/chapterIndex.test.ts が実行時にも本物の関数と
 * 1フィールドずつ突き合わせるので、
 * 問題を足して再生成を忘れるとテストが落ちる。
 *
 * 教科ごとに持っているキーが違うのは意図的で、
 * カードに出す数字の種類が教科ごとに違うため
 * （無理に統一するとカードの文言が変わってしまう）。
 */
export interface SubjectStatsEntry {
  chapters?: number;
  questions?: number;
  sections?: number;
  units?: number;
  points?: number;
  marks?: number;
}

export const SUBJECT_STATS: Readonly<Record<string, SubjectStatsEntry>> = `;

const STATS_FOOTER = `;

/**
 * 指定した教科の収録ボリュームを返す。
 *
 * 未知の教科IDでも画面が壊れないよう、空オブジェクトを返す
 * （呼び出し側は数字が undefined のときの表示を持っている）。
 */
export function getSubjectStats(subjectId: string | null | undefined): SubjectStatsEntry {
  return SUBJECT_STATS[String(subjectId)] ?? {};
}
`;

function main(): void {
  const index = buildIndex();
  const stats = buildSubjectStats();

  const body = JSON.stringify(index, null, 2);
  const statsBody = JSON.stringify(stats, null, 2);
  const source = `${HEADER}${body}${FOOTER}${STATS_HEADER}${statsBody}${STATS_FOOTER}`;

  writeFileSync(OUT, source, 'utf8');

  const chapters = index.reduce((sum, s) => sum + s.chapters.length, 0);
  const problems = index.reduce(
    (sum, s) => sum + s.chapters.reduce((n, c) => n + c.problemCount, 0),
    0,
  );
  console.log(`[gen:index] ${OUT}`);
  console.log(`[gen:index] 教科 ${index.length} / 章 ${chapters} / 大問 ${problems}`);
  console.log(`[gen:index] 生成サイズ ${Buffer.byteLength(source, 'utf8').toLocaleString()} バイト`);
}

main();
