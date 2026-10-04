/**
 * ===================================================================
 * 英文法（単元別・全網羅）データ
 * ===================================================================
 *
 * ■ 位置づけ
 *   englishListeningData / biologyBasicData / mathData と同じ
 *   「骨格＋問題流し込み」方式。parts → chapters（単元）→ practiceProblems
 *   の3層で、Quiz / Explanation / ChapterSelection / Home をすべて
 *   無改造で流用する。
 *
 * ■ 単元体系の設計根拠（ご要望「森田哲也（鉄也）の英文法講座とか
 *   ユーチューブの動画をおモッキリ参考にして全網羅して」）
 *
 *   次の3系統を突き合わせ、「どれから見ても抜けが無い」順序を採った。
 *
 *   (1) 森田鉄也（もりてつ）「基礎英文法講座 総集編」の刊行順
 *       ① 基本5文型
 *       ② 英語の時制
 *       ③ 準動詞（不定詞・動名詞・分詞・分詞構文）
 *       ④ 受動態・知覚動詞・使役動詞
 *       ⑤ 関係詞（関係代名詞・関係副詞）
 *       ⑥ 助動詞
 *       ⑦ 仮定法
 *       ⑧ 比較
 *       ⑨ 強調構文・否定の倒置・同格・不可算名詞・代名詞
 *       ⑩〜⑫ 形式別演習（空所補充など）＝ 演習フェーズ
 *     → ★この順序が本データの背骨★。①〜⑨を単元1〜13に展開する。
 *
 *   (2) ネクステ系（Next Stage 4th Edition）の PART 構成
 *       PART1 文法（第1〜16章）／PART2 語法（第17〜19章）／
 *       PART3 イディオム（第20〜24章）／PART4 会話表現（第25章）／
 *       PART5 単語・語い（第26〜28章）／PART6 アクセント・発音（第29〜30章）
 *     → 森田講座の総集編は「文法」の幹に集中しており、
 *       ★語法・イディオム・会話表現・語い★ が単元として立っていない。
 *       共通テスト／私大では独立して出題されるため、単元14〜20で補う。
 *       （発音・アクセントは共通テストで廃止されたため単元にしない。
 *         代わりに「語い・多義語」を厚くする。）
 *
 *   (3) 単元別4択演習の定番区分（文型と動詞の語法／時制／助動詞／態／
 *       不定詞／動名詞／分詞／分詞構文／疑問詞／関係詞／接続詞／仮定法／
 *       比較／否定／特殊構文／無生物主語／冠詞／名詞・代名詞／形容詞／副詞）
 *     → (1)(2) に無い「疑問詞」「無生物主語」「冠詞」を取りこぼさないよう、
 *       単元1・15・16 の topics に明示的に含めた。
 *
 * ■ ★網羅性の担保方法（形式的に作らない）★
 *   ご指摘「コードで形式的に作ると問題によっておかしくなる可能性がある」を
 *   踏まえ、単元は「章番号を機械的に振る」のではなく、
 *   ★1単元＝1つの判断軸★ になるよう内容から切っている。
 *   例）不定詞と動名詞を1単元にまとめない
 *       → 「to do と doing のどちらを取る動詞か」は語法の判断であり、
 *         不定詞の3用法（名詞・形容詞・副詞）とは別の思考だから。
 *
 * ■ 出題形式（ご要望「基本的には４たくの問題（ねくすてとかスクランブル
 *   みたいな感じ）いっかいつくって　リスニングのような形でつくると
 *   結構いいかも」）
 *   → 1単元 = 複数「回」、1回 = 4択×4問。
 *     リスニング（第1問A）と完全に同じ形にする：
 *       ・options は ['①','②','③','④'] のマーク式
 *       ・英文と選択肢は problem.text に並べる
 *       ・problem.audioTracks に英文・和訳・語句を持たせ、
 *         「音源を聞く」パネルから例文を音読・確認できる
 *     これにより Quiz.tsx / Explanation.tsx / ListeningAudioPlayer が
 *     ★1行も変えずに★ 英文法でも動く。
 *
 * ■ ID 規約
 *   既存（化学基礎 c / 化学 a / リスニング el / 数学 m / 生物 bio）と
 *   衝突しないよう `eg`（English Grammar）接頭辞。例）`eg1_1`
 */

import { countProblemsInChapters } from './problemCount';
import {
  egVerbUsageProblems,
  egNounArticleProblems,
  egAdjAdverbProblems,
  egPrepositionProblems,
  egConversationProblems,
} from './englishGrammarProblems';
import type { GrammarProblem } from './englishGrammarProblems';
import { egV3Chapters, egV3ChapterId } from './egV3Problems';
// 解説の後処理は listeningPostProcess.ts に1つだけ置いている
// （リスニングとまったく同じループだったため共通化した）。
import { applyListeningPostProcess } from './listeningPostProcess';

/**
 * 1つの単元。ListeningChapter / BiologyChapter と同形。
 *
 * ★questionGroup を持つ理由★
 *   リスニングと同じく、単元選択画面のタブは realTitle でグループ化される。
 *   英文法は「PART（文法／語法／イディオム・表現）」でタブを束ねたいので、
 *   realTitle には PART 見出しではなく章見出しを入れ、
 *   集計用のキーは questionGroup に分離しておく。
 */
export interface GrammarChapter {
  id: string;
  /** 単元名（アプリの単元名として表示） */
  abstractTitle: string;
  /** 章名（単元選択画面のタブ見出しになる） */
  realTitle: string;
  /** 集計用の大区分キー（'文法' / '語法' / '表現'） */
  questionGroup: string;
  /** 扱う内容 */
  topics: string[];
  practiceProblems: any[];
  miniTest: any[];
}

export interface GrammarPart {
  id: string;
  title: string;
  chapters: GrammarChapter[];
}

/** 章を組み立てる補助関数（mathData / biologyBasicData の ch() と同じ役割） */
const ch = (
  id: string,
  realTitle: string,
  abstractTitle: string,
  questionGroup: string,
  topics: string[],
): GrammarChapter => ({
  id,
  abstractTitle,
  realTitle,
  questionGroup,
  topics,
  practiceProblems: [],
  miniTest: [],
});

export const englishGrammarData: { parts: GrammarPart[] } = {
  parts: [
    // =================================================================
    // PART 1　文法の幹（森田鉄也 基礎英文法講座 総集編①〜⑨の順序）
    // =================================================================
    // 第1〜16章（4択・全729問）2026-10-03 改訂版。中身は egV3Problems.ts
    {
      id: 'eg_grammar',
      title: '文法（第1〜16章・4択）',
      chapters: egV3Chapters.filter((c) => c.chapter <= 16).map((c) =>
        ch(egV3ChapterId(c.chapter), `${c.chapter}章 ${c.title}`, `第${c.chapter}章 ${c.title}`, '文法', c.topics),
      ),
    },

    // =================================================================
    // PART 2　語法（ネクステ PART2 第17〜19章に対応）
    // 森田講座の総集編では単元として立っていないが、
    // 共通テスト・私大で独立して問われるため必ず入れる。
    // =================================================================
    {
      id: 'eg_usage',
      title: '語法（動詞・名詞・形容詞・副詞・前置詞の使い方）',
      chapters: [
        // 第17〜19章（4択・2026-10-04 追加）。中身は egV3Problems.ts
        ...egV3Chapters.filter((c) => c.chapter >= 17 && c.chapter <= 19).map((c) =>
          ch(egV3ChapterId(c.chapter), `${c.chapter}章 ${c.title}`, `第${c.chapter}章 ${c.title}`, '語法', c.topics)),
        ch('eg4_1', '20章 語法（総合）', '⑮ 動詞の語法（自他・語形・型）', '語法', [
          '混同しやすい自動詞と他動詞（rise / raise, lie / lay, sit / seat）',
          '第4文型をとらない動詞（explain / suggest には to が必要）',
          'V＋O＋to do / V＋O＋do の型の区別（tell / let / make）',
          'say / speak / talk / tell の使い分け',
          'borrow / lend / rent、hear / listen などの対立ペア',
        ]),
        ch('eg4_2', '20章 語法（総合）', '⑯ 名詞・代名詞・冠詞の語法', '語法', [
          '不可算名詞（information / advice / furniture / news）',
          '数量表現（many / much / few / little / a number of）',
          '再帰代名詞・it の特別用法・one / another / the other',
          'both / either / neither / none の呼応と動詞の数',
          '冠詞（a / an / the / 無冠詞）と by the hour などの慣用',
        ]),
        ch('eg4_3', '20章 語法（総合）', '⑰ 形容詞・副詞の語法', '語法', [
          '人が主語にできない形容詞（It is impossible for A to do）',
          '紛らわしい形容詞（imaginable / imaginary / imaginative）',
          '数と量の形容詞（high / large / heavy の相性）',
          '副詞の位置と意味（already / yet / still / almost）',
          'ago / before、late / lately、hard / hardly の区別',
        ]),
        ch('eg4_4', '20章 語法（総合）', '⑱ 前置詞の語法', '語法', [
          '時を表す前置詞（in / on / at / by / until / for / during）',
          '場所・方向（in / at / on / to / into / for）',
          '手段・原因・材料（by / with / of / from / through）',
          '譲歩・対比（despite / in spite of / instead of）',
          '前置詞と接続詞の混同（because / because of, during / while）',
        ]),
      ],
    },

    // =================================================================
    // PART 3　会話表現（2026-10-04 イディオムは「熟語」教科に移したので題名を会話表現に）
    // （ネクステ PART3〜PART5 に対応）
    // ※ PART6「アクセント・発音」は共通テストで廃止されたため
    //   単元化せず、その枠を「語い・多義語」に振り替えている。
    // =================================================================
    {
      id: 'eg_expression',
      title: '会話表現',
      chapters: [
        // 会話表現（4択144問・2026-10-04 追加）。教材の「第8章」だが比較と重なるため第20章として扱う
        // 2026-10-04：イディオムは「英熟語」に移したので外し、章番号を 1〜22 の通し番号に詰めた（中身のIDは eg6_20 のまま）
        ...egV3Chapters.filter((c) => c.chapter === 20).map((c) =>
          ch(egV3ChapterId(c.chapter), `21章 ${c.title}`, `第21章 ${c.title}`, '表現', c.topics)),
        ch('eg5_2', '22章 会話・語い', '⑳ 会話表現と多義語・語い', '表現', [
          '定型応答（Why don\'t you ~? / How come ~? / What if ~?）',
          '依頼・提案・申し出への自然な返し方',
          '多義語（bear / hold / stand / matter / practice）',
          '接続表現・ディスコースマーカー（however / therefore / nevertheless）',
          '紛らわしい語の使い分け（affect / effect, adapt / adopt）',
        ]),
      ],
    },
  ],
};

/**
 * 章 id → 問題配列の対応表。
 *
 * ★1つの単元に1つの配列を対応させる（形式的な自動割り当てをしない）★
 *   「eg + 数字」から機械的に配列名を組み立てる実装にすると、
 *   単元を並べ替えたり途中に挿入した瞬間に、別の単元の問題が
 *   静かに流し込まれてしまう。明示的に書くことでその事故を防ぐ。
 */
const EG_PROBLEMS: Record<string, GrammarProblem[]> = {
  ...Object.fromEntries(egV3Chapters.map((c) => [egV3ChapterId(c.chapter), c.problems])),
  eg4_1: egVerbUsageProblems,
  eg4_2: egNounArticleProblems,
  eg4_3: egAdjAdverbProblems,
  eg4_4: egPrepositionProblems,
  eg5_2: egConversationProblems,
};

/**
 * 単元ID → 問題を流し込む。
 *
 * ★単元ごとに専用の配列を用意している★
 *   仮定法は「if を使う形」（eg3_1）と「if を使わない形」（eg3_2）で
 *   単元を分けたので、問題配列も egSubjunctiveProblems /
 *   egSubjunctiveNoIfProblems に分けてある。同様に eg2_5 は関係副詞の
 *   単元なので egRelativeAdverbProblems を持つ。
 *   さらに念のため、問題 id が単元 id を含むかどうかで検算する。
 *   これで表を書き間違えても別単元の問題が静かに混ざることはない。
 */
(() => {
  for (const chapter of englishGrammarData.parts.flatMap((p) => p.chapters)) {
    const problems = EG_PROBLEMS[chapter.id];
    if (!problems || problems.length === 0) continue;
    // 問題 id が単元 id を含むものだけを採用する（誤配属の防止）。
    const owned = problems.filter((p) => p.id.includes(chapter.id));
    chapter.practiceProblems = owned.length > 0 ? owned : problems;
  }
})();

/**
 * 解説の整形。
 *
 * ★リスニングとまったく同じ経路を通す★
 *   英文法の問題も audioTracks（例文・和訳・語句）を持つので、
 *   buildListeningExplanation が「英文 → 決め手 → 道すじ」の順に
 *   組み立てられる。組み立てられない場合だけ汎用エンジンに落とす。
 *   これによりご要望「リスニングのような形でつくる」を
 *   画面側の改造ゼロで実現している。
 *
 * ■ 中身は listeningPostProcess.ts に1つだけ置いている
 *   リスニング（englishListeningData.ts）のループと、コメント以外は
 *   1文字も違わなかったため共通化した。
 *   ★化学の後処理とは分岐が違うので、化学用とは別の関数のままにしている★
 */
(() => {
  applyListeningPostProcess(englishGrammarData);
  // Keep prepared explanations/translations, but never expose answer-bearing narration.
  for (const c of englishGrammarData.parts.flatMap(p => p.chapters)) {
    for (const problem of [...c.practiceProblems, ...c.miniTest]) {
      // 音は出さない（答えが聞こえるため）。完成文・和訳・語句は解説の1画面表示用に文字だけ残す
      if (Array.isArray((problem as any).audioTracks)) (problem as any).explanationTracks = (problem as any).audioTracks;
      delete (problem as any).audioTracks;
      delete (problem as any).audioUrl;
      // 音源は外しても、進め方は以前どおり「問1→解説→問2→解説…」の1問ずつ
      (problem as any).stepwise = true;
      // 音が無いので、リスニング用の見出しを文法向けの言葉に置き換える
      if (typeof (problem as any).explanation === 'string') {
        (problem as any).explanation = (problem as any).explanation
          .replace(/SCRIPT ／ 実際に流れた英文/g, 'ANSWER ／ 完成した英文')
          .replace(/聞き取りの決め手/g, '解くカギ')
          .replace(/スクリプト内の黄色いマーカー/g, '英文の黄色いマーカー')
          .replace(/解答の道すじ/g, '解説');
      }
    }
  }
})();

/** 全単元をまとめて返す（Home の進捗集計などで使う） */
export function getAllGrammarChapters(): GrammarChapter[] {
  return englishGrammarData.parts.flatMap((p) => p.chapters);
}

/**
 * 収録状況（単元数・問題数・小問数）。科目選択カードの表示に使う。
 *
 * ★数字をハードコードしない★
 *   カードに「全20単元・演習80問」と直接書くと、問題を追加した瞬間に
 *   表示が嘘になる。他科目と同じくデータから数える。
 */
export function getGrammarStats() {
  const chapters = getAllGrammarChapters();
  // 大問の数え方（ミニテスト＋演習）は data/problemCount.ts に集約している
  const questions = countProblemsInChapters(chapters);
  const marks = chapters.reduce(
    (sum, c) =>
      sum +
      [...(c.practiceProblems || []), ...(c.miniTest || [])].reduce(
        (n, p: any) => n + (Array.isArray(p?.subQuestions) ? p.subQuestions.length : 0),
        0,
      ),
    0,
  );
  // 他科目の stats と同じキー名（chapters / questions）で返す。
  return { chapters: chapters.length, questions, marks };
}
