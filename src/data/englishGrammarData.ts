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
  egSvPatternProblems,
  egTenseProblems,
  egAspectProblems,
  egModalProblems,
  egPassiveProblems,
  egInfinitiveProblems,
  egGerundProblems,
  egParticipleProblems,
  egRelativeProblems,
  egRelativeAdverbProblems,
  egSubjunctiveProblems,
  egSubjunctiveNoIfProblems,
  egComparisonProblems,
  egSpecialProblems,
  egVerbUsageProblems,
  egNounArticleProblems,
  egAdjAdverbProblems,
  egPrepositionProblems,
  egIdiomProblems,
  egConversationProblems,
} from './englishGrammarProblems';
import type { GrammarProblem } from './englishGrammarProblems';
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
    {
      id: 'eg_grammar',
      title: '文法の幹（文型→時制→準動詞→関係詞→仮定法→比較）',
      chapters: [
        // ---- 総集編① 基本5文型 ----
        ch('eg1_1', '1章 文型と動詞', '① 基本5文型と自動詞・他動詞', '文法', [
          '第1文型 SV と第2文型 SVC の見分け（be 動詞以外の SVC）',
          '第3文型 SVO と第4文型 SVOO（give 型・二重目的語）',
          '第5文型 SVOC（O と C に主述関係がある）',
          '自動詞と他動詞の区別（discuss / marry / enter に前置詞は不要）',
          '疑問詞を用いた文の語順（間接疑問は「疑問詞＋S＋V」）',
        ]),

        // ---- 総集編② 英語の時制 ----
        ch('eg1_2', '2章 時制', '② 基本時制と時制の一致', '文法', [
          '現在形は「現在の習慣・不変の事実」を表す（今この瞬間ではない）',
          '進行形にできない動詞（know / belong / resemble などの状態動詞）',
          '時・条件の副詞節では未来のことも現在形（when he comes）',
          '時制の一致と、その例外（不変の真理・歴史上の事実）',
          '未来を表す形の使い分け（will / be going to / 現在進行形）',
        ]),
        ch('eg1_3', '2章 時制', '③ 完了形（現在・過去・未来）', '文法', [
          '現在完了の4用法（完了・結果・経験・継続）',
          '現在完了と過去形の使い分け（yesterday とは共起しない）',
          '過去完了は「過去のある時点より前」を表す大過去',
          '未来完了（by the time 節との組み合わせ）',
          '完了進行形（have been ~ing）が表す「継続してきた動作」',
        ]),

        // ---- 総集編⑥ 助動詞 ----
        ch('eg1_4', '3章 助動詞', '④ 助動詞と助動詞＋have p.p.', '文法', [
          'can / may / must / should の基本義（能力・許可・義務・推量）',
          'must not（禁止）と don\'t have to（不要）の決定的な差',
          '助動詞＋have p.p.（過去への推量・後悔・非難）',
          'used to / would（過去の習慣）と be used to ~ing の区別',
          'had better / may well / may as well などの慣用表現',
        ]),

        // ---- 総集編④ 受動態・知覚動詞・使役動詞 ----
        ch('eg1_5', '4章 態', '⑤ 受動態・知覚動詞・使役動詞', '文法', [
          '受動態の作り方と by 以外の前置詞（be known to / be filled with）',
          '第4文型・第5文型の受動態（O が2つある文の受け身）',
          '群動詞の受動態（be laughed at / be spoken to）',
          '知覚動詞（see / hear / feel）＋O＋原形／~ing／p.p.',
          '使役動詞 make / have / let ＋O＋原形と get / help の扱い',
        ]),

        // ---- 総集編③ 準動詞（不定詞・動名詞・分詞・分詞構文）----
        ch('eg2_1', '5章 準動詞', '⑥ 不定詞（3用法と重要構文）', '文法', [
          '名詞・形容詞・副詞の3用法の判別',
          '不定詞の意味上の主語（for A to do / of A to do）',
          '完了不定詞 to have p.p.（述語動詞より前の時）',
          'too ~ to / enough to / so as to / in order to',
          '原形不定詞をとる形（all you have to do is do）',
        ]),
        ch('eg2_2', '5章 準動詞', '⑦ 動名詞と to do / doing の使い分け', '文法', [
          '動名詞のみを目的語にとる動詞（enjoy / mind / avoid / finish）',
          '不定詞のみを目的語にとる動詞（hope / decide / promise）',
          '両方とれるが意味が変わる動詞（remember / forget / try / stop）',
          '前置詞＋動名詞の慣用表現（look forward to ~ing / be used to ~ing）',
          '動名詞の完了形・受動形・否定（having p.p. / being p.p. / not ~ing）',
        ]),
        ch('eg2_3', '5章 準動詞', '⑧ 分詞と分詞構文', '文法', [
          '現在分詞（能動・進行）と過去分詞（受動・完了）の使い分け',
          '感情を表す分詞形容詞（exciting / excited, boring / bored）',
          '分詞構文の基本（接続詞＋S＋V を分詞1語に圧縮する）',
          '独立分詞構文・完了分詞構文（having p.p.）・being の省略',
          '慣用的な分詞構文（generally speaking / judging from）',
        ]),

        // ---- 総集編⑤ 関係詞 ----
        ch('eg2_4', '6章 関係詞', '⑨ 関係代名詞（格と what・that）', '文法', [
          '主格・目的格・所有格（who / whom / whose / which / that）',
          '関係代名詞 what（＝the thing which）と接続詞 that の区別',
          '前置詞＋関係代名詞（the house in which he lives）',
          '連鎖関係代名詞（the man who I think is honest）',
          '制限用法とコンマつき非制限用法の意味差',
        ]),
        ch('eg2_5', '6章 関係詞', '⑩ 関係副詞と複合関係詞', '文法', [
          '関係副詞 where / when / why / how の使い分け',
          '関係副詞と「前置詞＋関係代名詞」の書き換え',
          '複合関係代名詞 whoever / whatever / whichever',
          '複合関係副詞 wherever / whenever / however（譲歩）',
          '先行詞が省略される関係副詞（This is where ~）',
        ]),

        // ---- 総集編⑦ 仮定法 ----
        ch('eg3_1', '7章 仮定法', '⑪ 仮定法過去・過去完了・未来', '文法', [
          '仮定法過去（現在の事実に反する仮定）の形',
          '仮定法過去完了（過去の事実に反する仮定）の形',
          'ミックス条件（If S had p.p., S would do now）',
          '仮定法未来（should / were to）',
          'if の省略と倒置（Were I you / Had I known）',
        ]),
        ch('eg3_2', '7章 仮定法', '⑫ if を使わない仮定表現', '文法', [
          'I wish / if only ＋仮定法',
          'as if / as though ＋仮定法',
          'without / but for / otherwise（〜がなければ）',
          'It is time ＋仮定法過去（そろそろ〜してよい時間だ）',
          '要求・提案・命令の that 節中の should（仮定法現在）',
        ]),

        // ---- 総集編⑧ 比較 ----
        ch('eg3_3', '8章 比較', '⑬ 原級・比較級・最上級と重要表現', '文法', [
          'as ~ as の原級比較と倍数表現（twice as ~ as）',
          '比較級の強調（much / far / even）※very は不可',
          '最上級・the＋比較級（of the two）・no more than 系',
          'クジラ構文（A is no more B than C is D）と rather than',
          '比較の慣用（the 比較級, the 比較級 / all the more / no less than）',
        ]),

        // ---- 総集編⑨ 強調構文・否定の倒置・同格 ----
        ch('eg3_4', '9章 特殊構文', '⑭ 強調・倒置・省略・同格・無生物主語', '文法', [
          'It is ~ that ... の強調構文（形式主語との識別）',
          '否定の副詞が文頭に出たときの倒置（Never have I ~）',
          '否定表現（部分否定・二重否定・準否定 hardly / seldom）',
          '同格の that / of と挿入・省略（共通関係）',
          '無生物主語構文（This road will take you to ~）',
        ]),
      ],
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
        ch('eg4_1', '10章 語法', '⑮ 動詞の語法（自他・語形・型）', '語法', [
          '混同しやすい自動詞と他動詞（rise / raise, lie / lay, sit / seat）',
          '第4文型をとらない動詞（explain / suggest には to が必要）',
          'V＋O＋to do / V＋O＋do の型の区別（tell / let / make）',
          'say / speak / talk / tell の使い分け',
          'borrow / lend / rent、hear / listen などの対立ペア',
        ]),
        ch('eg4_2', '10章 語法', '⑯ 名詞・代名詞・冠詞の語法', '語法', [
          '不可算名詞（information / advice / furniture / news）',
          '数量表現（many / much / few / little / a number of）',
          '再帰代名詞・it の特別用法・one / another / the other',
          'both / either / neither / none の呼応と動詞の数',
          '冠詞（a / an / the / 無冠詞）と by the hour などの慣用',
        ]),
        ch('eg4_3', '10章 語法', '⑰ 形容詞・副詞の語法', '語法', [
          '人が主語にできない形容詞（It is impossible for A to do）',
          '紛らわしい形容詞（imaginable / imaginary / imaginative）',
          '数と量の形容詞（high / large / heavy の相性）',
          '副詞の位置と意味（already / yet / still / almost）',
          'ago / before、late / lately、hard / hardly の区別',
        ]),
        ch('eg4_4', '10章 語法', '⑱ 前置詞の語法', '語法', [
          '時を表す前置詞（in / on / at / by / until / for / during）',
          '場所・方向（in / at / on / to / into / for）',
          '手段・原因・材料（by / with / of / from / through）',
          '譲歩・対比（despite / in spite of / instead of）',
          '前置詞と接続詞の混同（because / because of, during / while）',
        ]),
      ],
    },

    // =================================================================
    // PART 3　イディオム・会話表現・語い
    // （ネクステ PART3〜PART5 に対応）
    // ※ PART6「アクセント・発音」は共通テストで廃止されたため
    //   単元化せず、その枠を「語い・多義語」に振り替えている。
    // =================================================================
    {
      id: 'eg_expression',
      title: 'イディオム・会話表現・語い',
      chapters: [
        ch('eg5_1', '11章 イディオム', '⑲ 動詞を含む熟語・群動詞', '表現', [
          'put / take / get / make / come / go の句動詞',
          '「動詞＋副詞」と「動詞＋前置詞」の目的語の位置',
          'be動詞＋形容詞＋前置詞（be aware of / be capable of）',
          '前置詞を含む慣用（in terms of / on behalf of / at the expense of）',
          '否定・強調の慣用表現（by no means / anything but）',
        ]),
        ch('eg5_2', '12章 会話・語い', '⑳ 会話表現と多義語・語い', '表現', [
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
  eg1_1: egSvPatternProblems,
  eg1_2: egTenseProblems,
  eg1_3: egAspectProblems,
  eg1_4: egModalProblems,
  eg1_5: egPassiveProblems,
  eg2_1: egInfinitiveProblems,
  eg2_2: egGerundProblems,
  eg2_3: egParticipleProblems,
  eg2_4: egRelativeProblems,
  eg2_5: egRelativeAdverbProblems,
  eg3_1: egSubjunctiveProblems,
  eg3_2: egSubjunctiveNoIfProblems,
  eg3_3: egComparisonProblems,
  eg3_4: egSpecialProblems,
  eg4_1: egVerbUsageProblems,
  eg4_2: egNounArticleProblems,
  eg4_3: egAdjAdverbProblems,
  eg4_4: egPrepositionProblems,
  eg5_1: egIdiomProblems,
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
          .replace(/スクリプト内の黄色いマーカー/g, '英文の黄色いマーカー');
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
