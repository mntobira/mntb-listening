/**
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
   * 先生ダッシュボードの章名は `abstractTitle || realTitle || id` で決まるため、
   * abstractTitle が無い章のために必要。現在の実データでは全章が
   * abstractTitle を持っているので出番は無いが、無いと将来
   * 章名の代わりに生の章IDが表示される（しかも気づけない）。
   */
  realTitle?: string;
  /** この章の大問数（miniTest ＋ practiceProblems） */
  problemCount: number;
  /** リスニングの大問ID。ホームの進捗・次の1回のために必要な軽量索引。 */
  practiceIds?: readonly string[];
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
export const SUBJECT_INDEX: readonly SubjectIndexEntry[] = [
  {
    "id": "english_listening",
    "label": "英語リスニング",
    "chapters": [
      {
        "id": "el1_A",
        "problemCount": 14,
        "abstractTitle": "第1問 A",
        "realTitle": "第1問 A",
        "practiceIds": [
          "q_el1_A_set1",
          "q_el1_A_set2",
          "q_el1_A_set3",
          "q_el1_A_set4",
          "q_el1_A_set5",
          "q_el1_A_set6",
          "q_el1_A_set7",
          "q_el1_A_set8",
          "q_el1_A_set9",
          "q_el1_A_set10",
          "q_el1_A_set11",
          "q_el1_A_set12",
          "q_el1_A_set13",
          "q_el1_A_set14"
        ]
      },
      {
        "id": "el1_B",
        "problemCount": 15,
        "abstractTitle": "第1問 B",
        "realTitle": "第1問 B",
        "practiceIds": [
          "q_el1_B_set1",
          "q_el1_B_set2",
          "q_el1_B_set3",
          "q_el1_B_set4",
          "q_el1_B_set5",
          "q_el1_B_set6",
          "q_el1_B_set7",
          "q_el1_B_set8",
          "q_el1_B_set9",
          "q_el1_B_set10",
          "q_el1_B_set11",
          "q_el1_B_set12",
          "q_el1_B_set13",
          "q_el1_B_set14",
          "q_el1_B_set15"
        ]
      },
      {
        "id": "el2",
        "problemCount": 16,
        "abstractTitle": "第2問",
        "realTitle": "第2問",
        "practiceIds": [
          "q_el2_set1",
          "q_el2_set2",
          "q_el2_set3",
          "q_el2_set4",
          "q_el2_set5",
          "q_el2_set6",
          "q_el2_set7",
          "q_el2_set8",
          "q_el2_set9",
          "q_el2_set10",
          "q_el2_set11",
          "q_el2_set12",
          "q_el2_set13",
          "q_el2_set14",
          "q_el2_set15",
          "q_el2_set16"
        ]
      },
      {
        "id": "el3",
        "problemCount": 15,
        "abstractTitle": "第3問",
        "realTitle": "第3問",
        "practiceIds": [
          "q_el3_set1",
          "q_el3_set2",
          "q_el3_set3",
          "q_el3_set4",
          "q_el3_set5",
          "q_el3_set6",
          "q_el3_set7",
          "q_el3_set8",
          "q_el3_set9",
          "q_el3_set10",
          "q_el3_set11",
          "q_el3_set12",
          "q_el3_set13",
          "q_el3_set14",
          "q_el3_set15"
        ]
      },
      {
        "id": "el4_A",
        "problemCount": 15,
        "abstractTitle": "第4問 A",
        "realTitle": "第4問 A",
        "practiceIds": [
          "q_el4_A_set1",
          "q_el4_A_set2",
          "q_el4_A_set3",
          "q_el4_A_set4",
          "q_el4_A_set5",
          "q_el4_A_set6",
          "q_el4_A_set7",
          "q_el4_A_set8",
          "q_el4_A_set9",
          "q_el4_A_set10",
          "q_el4_A_set11",
          "q_el4_A_set12",
          "q_el4_A_set13",
          "q_el4_A_set14",
          "q_el4_A_set15"
        ]
      },
      {
        "id": "el4_B",
        "problemCount": 15,
        "abstractTitle": "第4問 B",
        "realTitle": "第4問 B",
        "practiceIds": [
          "q_el4_B_set1",
          "q_el4_B_set2",
          "q_el4_B_set3",
          "q_el4_B_set4",
          "q_el4_B_set5",
          "q_el4_B_set6",
          "q_el4_B_set7",
          "q_el4_B_set8",
          "q_el4_B_set9",
          "q_el4_B_set10",
          "q_el4_B_set11",
          "q_el4_B_set12",
          "q_el4_B_set13",
          "q_el4_B_set14",
          "q_el4_B_set15"
        ]
      },
      {
        "id": "el5",
        "problemCount": 15,
        "abstractTitle": "第5問",
        "realTitle": "第5問",
        "practiceIds": [
          "q_el5_set1",
          "q_el5_set2",
          "q_el5_set3",
          "q_el5_set4",
          "q_el5_set5",
          "q_el5_set6",
          "q_el5_set7",
          "q_el5_set8",
          "q_el5_set9",
          "q_el5_set10",
          "q_el5_set11",
          "q_el5_set12",
          "q_el5_set13",
          "q_el5_set14",
          "q_el5_set15"
        ]
      },
      {
        "id": "el6_A",
        "problemCount": 15,
        "abstractTitle": "第6問 A",
        "realTitle": "第6問 A",
        "practiceIds": [
          "q_el6_A_set1",
          "q_el6_A_set2",
          "q_el6_A_set3",
          "q_el6_A_set4",
          "q_el6_A_set5",
          "q_el6_A_set6",
          "q_el6_A_set7",
          "q_el6_A_set8",
          "q_el6_A_set9",
          "q_el6_A_set10",
          "q_el6_A_set11",
          "q_el6_A_set12",
          "q_el6_A_set13",
          "q_el6_A_set14",
          "q_el6_A_set15"
        ]
      },
      {
        "id": "el6_B",
        "problemCount": 15,
        "abstractTitle": "第6問 B",
        "realTitle": "第6問 B",
        "practiceIds": [
          "q_el6_B_set1",
          "q_el6_B_set2",
          "q_el6_B_set3",
          "q_el6_B_set4",
          "q_el6_B_set5",
          "q_el6_B_set6",
          "q_el6_B_set7",
          "q_el6_B_set8",
          "q_el6_B_set9",
          "q_el6_B_set10",
          "q_el6_B_set11",
          "q_el6_B_set12",
          "q_el6_B_set13",
          "q_el6_B_set14",
          "q_el6_B_set15"
        ]
      }
    ]
  },
  {
    "id": "english_grammar",
    "label": "英文法",
    "chapters": [
      {
        "id": "eg1_1",
        "problemCount": 1,
        "abstractTitle": "① 基本5文型と自動詞・他動詞",
        "realTitle": "1章 文型と動詞"
      },
      {
        "id": "eg1_2",
        "problemCount": 1,
        "abstractTitle": "② 基本時制と時制の一致",
        "realTitle": "2章 時制"
      },
      {
        "id": "eg1_3",
        "problemCount": 1,
        "abstractTitle": "③ 完了形（現在・過去・未来）",
        "realTitle": "2章 時制"
      },
      {
        "id": "eg1_4",
        "problemCount": 1,
        "abstractTitle": "④ 助動詞と助動詞＋have p.p.",
        "realTitle": "3章 助動詞"
      },
      {
        "id": "eg1_5",
        "problemCount": 1,
        "abstractTitle": "⑤ 受動態・知覚動詞・使役動詞",
        "realTitle": "4章 態"
      },
      {
        "id": "eg2_1",
        "problemCount": 1,
        "abstractTitle": "⑥ 不定詞（3用法と重要構文）",
        "realTitle": "5章 準動詞"
      },
      {
        "id": "eg2_2",
        "problemCount": 1,
        "abstractTitle": "⑦ 動名詞と to do / doing の使い分け",
        "realTitle": "5章 準動詞"
      },
      {
        "id": "eg2_3",
        "problemCount": 1,
        "abstractTitle": "⑧ 分詞と分詞構文",
        "realTitle": "5章 準動詞"
      },
      {
        "id": "eg2_4",
        "problemCount": 1,
        "abstractTitle": "⑨ 関係代名詞（格と what・that）",
        "realTitle": "6章 関係詞"
      },
      {
        "id": "eg2_5",
        "problemCount": 1,
        "abstractTitle": "⑩ 関係副詞と複合関係詞",
        "realTitle": "6章 関係詞"
      },
      {
        "id": "eg3_1",
        "problemCount": 1,
        "abstractTitle": "⑪ 仮定法過去・過去完了・未来",
        "realTitle": "7章 仮定法"
      },
      {
        "id": "eg3_2",
        "problemCount": 1,
        "abstractTitle": "⑫ if を使わない仮定表現",
        "realTitle": "7章 仮定法"
      },
      {
        "id": "eg3_3",
        "problemCount": 1,
        "abstractTitle": "⑬ 原級・比較級・最上級と重要表現",
        "realTitle": "8章 比較"
      },
      {
        "id": "eg3_4",
        "problemCount": 1,
        "abstractTitle": "⑭ 強調・倒置・省略・同格・無生物主語",
        "realTitle": "9章 特殊構文"
      },
      {
        "id": "eg4_1",
        "problemCount": 1,
        "abstractTitle": "⑮ 動詞の語法（自他・語形・型）",
        "realTitle": "10章 語法"
      },
      {
        "id": "eg4_2",
        "problemCount": 1,
        "abstractTitle": "⑯ 名詞・代名詞・冠詞の語法",
        "realTitle": "10章 語法"
      },
      {
        "id": "eg4_3",
        "problemCount": 1,
        "abstractTitle": "⑰ 形容詞・副詞の語法",
        "realTitle": "10章 語法"
      },
      {
        "id": "eg4_4",
        "problemCount": 1,
        "abstractTitle": "⑱ 前置詞の語法",
        "realTitle": "10章 語法"
      },
      {
        "id": "eg5_1",
        "problemCount": 1,
        "abstractTitle": "⑲ 動詞を含む熟語・群動詞",
        "realTitle": "11章 イディオム"
      },
      {
        "id": "eg5_2",
        "problemCount": 1,
        "abstractTitle": "⑳ 会話表現と多義語・語い",
        "realTitle": "12章 会話・語い"
      }
    ]
  }
];

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

export const SUBJECT_STATS: Readonly<Record<string, SubjectStatsEntry>> = {
  "english_listening": {
    "sections": 6,
    "units": 9,
    "points": 100,
    "marks": 37,
    "questions": 135
  },
  "english_grammar": {
    "chapters": 20,
    "questions": 20,
    "marks": 100
  }
};

/**
 * 指定した教科の収録ボリュームを返す。
 *
 * 未知の教科IDでも画面が壊れないよう、空オブジェクトを返す
 * （呼び出し側は数字が undefined のときの表示を持っている）。
 */
export function getSubjectStats(subjectId: string | null | undefined): SubjectStatsEntry {
  return SUBJECT_STATS[String(subjectId)] ?? {};
}
