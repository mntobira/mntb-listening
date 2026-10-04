import React, { useEffect, useMemo, useRef, useState } from 'react';
// ★必ず `import type` と書くこと（`import { type AdvancedFieldId }` にしないこと）★
//   後者は「値の import 文」なので、型しか使っていなくてもモジュールの解決が起き、
//   参照先のファイルが読み込み対象に入ってしまう。`import type` なら完全に消える。
// あわせて参照先も、問題データ本体（chemistryAdvancedData）ではなく
// 分野名だけを持つ葉ファイル（advancedFields）に変えている。
import type { AdvancedFieldId } from '../data/advancedFields';
import { ADVANCED_FIELDS } from '../data/advancedFields';
// 教科ごとの parts は data/allChapters.ts から引く
// （以前はこのファイルで6教科ぶんを個別に import していた）
import { getPartsOfSubject, type SubjectKey } from '../data/allChapters';
import { ChevronRight, ArrowLeft, TrendingUp, BarChart2, GraduationCap, X, Headphones } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChapterFlowchartModal } from './ChapterFlowchartModal';
import { TrendModal } from './TrendModal';
import { chemistryBasicTrendDataset } from '../data/trendData';
import { chemistryAdvancedTrendDataset } from '../data/chemistryAdvancedTrendData';
import { DoorMascot } from './DoorMascot';
import { subjectTheme } from '../data/subjectTheme';
import { MolBasicsSection } from './MolBasicsSection';
import { ListeningAudioPlayer } from './ListeningAudioPlayer';
import type { ListeningAudioTrack } from '../data/englishListeningQ1AProblems';
import { buildListeningRounds } from '../utils/listeningRounds';
import { problemKey, readSolvedMap } from '../utils/progress';
// 章 × モードごとの保存キー名は utils/quizStorageKeys.ts が唯一の定義
import {
  quizAnswersKey,
  quizExplKey,
  quizIndexKey,
  quizRunKey,
} from '../utils/quizStorageKeys';
import { auth } from '../firebase';
import { buildUnitSections } from '../data/unitSections';
import { UnitCard } from './UnitCard';
import './unit-select.css';
import { accuracyOf, readUnitStats } from '../utils/unitStats';
import { STAGE_CLEAR_PERFECTS, isStageCleared, readStageRecords, stageKey } from '../utils/stageRecords';
import { MATH_COURSE_LABELS, MATH_LEVELS, buildMathTopicGroups, mathCourseOfGroup, mathLevelOfCourse, type MathCourseKey } from '../data/mathNavigation';

interface ChapterSelectionProps {
  mode: 'mini_test' | 'practice';
  /**
   * 単元（章）を選んで演習画面へ移るためのハンドラ。
   *
   * @param questionIndex 章の中で最初に開く問題（0始まり）
   * @param resume        保存された解答を引き継ぐか
   * @param range         「この範囲だけを1回として解く」ときの範囲（両端を含む）。
   *                      英語リスニングの「第N回演習」ボタンから渡す。
   *                      省略時は章の全問を通しで解く（化学は従来のまま）。
   */
  onSelectChapter: (
    id: string,
    questionIndex?: number,
    resume?: boolean,
    range?: { startIndex: number; endIndex: number } | null,
  ) => void;
  onBack: () => void;
  onChangeSubject?: () => void;
  onChangeField?: (field: AdvancedFieldId) => void;
  rememberedGroup?: string;
  onGroupChange?: (group: string) => void;
  /** 「戻る」の行き先の名前（ホーム／学習モード）。押す前に分かるようにする。 */
  backLabel?: string;
  /**
   * 表示する科目。省略時は従来どおり化学基礎。
   * 'chemistry' のときは、指定された分野（理論／無機／有機）の単元だけを表示する。
   * 'english_listening' のときは、共通テストの大問を A・B ごとの単元として表示する
   * （第1問A・第1問B …）。各単元のページには「第N回演習」のボタンを並べる。
   */
  subject?: SubjectKey;
  /** 科目が 'chemistry' のときに表示する分野 */
  field?: AdvancedFieldId;
  /** 分野名（画面見出しに出す。化学のときのみ） */
  fieldTitle?: string;
}

// chapterのIDから、対応するtrendDataの情報を取得するマッピング
const chapterIdToTrendUnit: Record<string, { chapterGroupTitle: string; unitId: string }> = {
  'c1_1':   { chapterGroupTitle: '1章 物質の構成', unitId: 'c1_1' },
  'c1_2_A': { chapterGroupTitle: '1章 物質の構成', unitId: 'c1_2_A' },
  'c1_2_B': { chapterGroupTitle: '1章 物質の構成', unitId: 'c1_2_B' },
  'c1_3':   { chapterGroupTitle: '1章 物質の構成', unitId: 'c1_3' },
  'c2_1':   { chapterGroupTitle: '2章 物質の構成粒子', unitId: 'c2_3' },
  'c2_2':   { chapterGroupTitle: '2章 物質の構成粒子', unitId: 'c2_3' },
  'c2_3':   { chapterGroupTitle: '2章 物質の構成粒子', unitId: 'c2_3' },
  'c2_4':   { chapterGroupTitle: '2章 物質の構成粒子', unitId: 'c2_4' },
  'c3_1':   { chapterGroupTitle: '3章 化学結合', unitId: 'c3_5' },
  'c3_2':   { chapterGroupTitle: '3章 化学結合', unitId: 'c3_6' },
  'c3_3':   { chapterGroupTitle: '3章 化学結合', unitId: 'c3_7' },
  'c4_1':   { chapterGroupTitle: '4章 物質量と化学反応式', unitId: 'c4_8' },
  'c4_2':   { chapterGroupTitle: '4章 物質量と化学反応式', unitId: 'c4_9' },
  'c4_3':   { chapterGroupTitle: '4章 物質量と化学反応式', unitId: 'c4_10' },
  'c4_4':   { chapterGroupTitle: '4章 物質量と化学反応式', unitId: 'c4_11' },
  'c5_1':   { chapterGroupTitle: '5章 酸と塩基', unitId: 'c5_12' },
  'c5_2':   { chapterGroupTitle: '5章 酸と塩基', unitId: 'c5_13' },
  'c5_3':   { chapterGroupTitle: '5章 酸と塩基', unitId: 'c5_14' },
  'c5_4':   { chapterGroupTitle: '5章 酸と塩基', unitId: 'c5_15' },
  'c5_5':   { chapterGroupTitle: '5章 酸と塩基', unitId: 'c5_16' },
  'c5_6':   { chapterGroupTitle: '5章 酸と塩基', unitId: 'c5_17' },
  'c5_7':   { chapterGroupTitle: '5章 酸と塩基', unitId: 'c5_18' },
  'c6_1':   { chapterGroupTitle: '6章 酸化還元反応', unitId: 'c6_19' },
  'c6_2':   { chapterGroupTitle: '6章 酸化還元反応', unitId: 'c6_19' },
  'c6_3':   { chapterGroupTitle: '6章 酸化還元反応', unitId: 'c6_19' },
  'c6_4':   { chapterGroupTitle: '6章 酸化還元反応', unitId: 'c6_19' },
  'c6_5':   { chapterGroupTitle: '6章 酸化還元反応', unitId: 'c6_19' },
  'c6_6':   { chapterGroupTitle: '6章 酸化還元反応', unitId: 'c6_19' },
  'c6_7':   { chapterGroupTitle: '6章 酸化還元反応', unitId: 'c6_19' },
};

// chapterのrealTitleから、対応するtrendDataのchapterGroupTitleを取得
const realTitleToChapterGroupTitle: Record<string, string> = {
  '1章 物質の構成': '1章 物質の構成',
  '2章 物質の構成粒子': '2章 物質の構成粒子',
  '3章 化学結合': '3章 化学結合',
  '4章 物質量と化学反応式': '4章 物質量と化学反応式',
  '5章 酸と塩基': '5章 酸と塩基',
  '6章 酸化還元反応': '6章 酸化還元反応',
};

// 化学（発展）は単元 ID（a1_1 など）と章名（realTitle）が
// そのまま傾向データ側の ID / chapterGroupTitle と一致するので、
// 手書きの対応表を作らずデータから自動生成する。
const advancedChapterIdToTrendUnit: Record<string, { chapterGroupTitle: string; unitId: string }> =
  Object.fromEntries(
    chemistryAdvancedTrendDataset.chapters.flatMap(chapter =>
      chapter.units.map(unit => [
        unit.id,
        { chapterGroupTitle: chapter.chapterGroupTitle, unitId: unit.id },
      ] as const)
    )
  );

const advancedRealTitleToChapterGroupTitle: Record<string, string> = Object.fromEntries(
  chemistryAdvancedTrendDataset.chapters.map(chapter => [
    chapter.chapterGroupTitle,
    chapter.chapterGroupTitle,
  ])
);

/**
 * parts を「教科書の章（realTitle）」単位のタブにまとめる共通処理。
 * 化学基礎・化学（発展）のどちらも同じ構造なので、そのまま使い回せる。
 */
function buildChapterGroups(parts: any[]) {
  return parts.flatMap((part: any) => {
    const groups = new Map<string, any[]>();

    (part.chapters as any[]).forEach(chapter => {
      const groupTitle = chapter.realTitle || 'その他';
      const chapters = groups.get(groupTitle) || [];
      chapters.push(chapter);
      groups.set(groupTitle, chapters);
    });

    return Array.from(groups, ([title, chapters]) => ({
      title,
      chapters,
      partId: part.id,
      partTitle: part.title,
    }));
  });
}

/**
 * 教科ごとのタブ（章のグループ）。
 *
 * どの教科も realTitle でグループ化するだけで正しいタブになるため、
 * 処理は buildChapterGroups の1本で共通。以前は教科ごとに
 *   const chapterGroups   = buildChapterGroups(chemistryData.parts);
 *   const listeningGroups = buildChapterGroups(englishListeningData.parts);
 *   …（5教科ぶん）
 * と同じ行を並べていたが、教科を足すたびに書き足す必要があった。
 *
 * ★同じ教科なら必ず同じ配列（実体）を返すこと。★
 * groups は useEffect / useMemo の依存に入っているので、
 * 呼ぶたびに新しい配列を作るとタブが毎回作り直され、
 * 開いているタブが勝手に先頭へ戻ってしまう。
 * そのため一度作ったものを教科IDで覚えておく。
 *
 * 参考（各教科の事情はそのまま）：
 * - 英語リスニング：A・B が分かれる大問は realTitle も別（'第1問 A' / '第1問 B'）
 *   なので、この共通処理を通すだけで A・B が独立したタブになる
 * - 英文法：「10章 語法」は 4 単元を抱えるので、1 つのタブに 4 単元が並ぶ
 */
const groupsBySubject = new Map<string, ReturnType<typeof buildChapterGroups>>();

function getChapterGroups(subject: string): ReturnType<typeof buildChapterGroups> {
  const cached = groupsBySubject.get(subject);
  if (cached) return cached;
  // 数学は「科目 → 教科書の分野」のタブに組み直す（src/data/mathNavigation.ts の説明を参照）
  const built = subject === 'math'
    ? (buildMathTopicGroups(getPartsOfSubject('math')) as unknown as ReturnType<typeof buildChapterGroups>)
    : buildChapterGroups(getPartsOfSubject(subject));
  groupsBySubject.set(subject, built);
  return built;
}

const GRAMMAR_PART_LABEL: Record<string, string> = { eg_grammar: '文法の幹', eg_usage: '語法', eg_expression: '会話表現' };
let grammarPartGroups: ReturnType<typeof buildChapterGroups> | null = null;
function getGrammarPartGroups(): ReturnType<typeof buildChapterGroups> {
  if (grammarPartGroups) return grammarPartGroups;
  grammarPartGroups = getPartsOfSubject('english_grammar').map((part: any, i: number) => ({
    title: GRAMMAR_PART_LABEL[part.id] ?? part.title,
    label: GRAMMAR_PART_LABEL[part.id] ?? part.title,
    kicker: `PART ${i + 1}`,
    chapters: part.chapters,
    partId: part.id,
    partTitle: part.title,
  })) as unknown as ReturnType<typeof buildChapterGroups>;
  return grammarPartGroups;
}

/**
 * 単元の中に収録されている音源を、回（problem）ごとにまとめて取り出す。
 *
 * ご要望「復習用の音源を聞く場所もしっかりと作って」に対応するためのもの。
 * 問題を解き直さなくても、単元選択の画面からいつでも音源だけを
 * 聞き直せるようにする（＝復習専用の入口）。
 */
function collectAudioSets(
  chapter: any,
): { id: string; title: string; readCount: 1 | 2; tracks: ListeningAudioTrack[] }[] {
  const problems: any[] = [
    ...((chapter?.practiceProblems as any[]) || []),
    ...((chapter?.miniTest as any[]) || []),
  ];
  return problems
    .filter((p) => Array.isArray(p?.audioTracks) && p.audioTracks.length > 0)
    .map((p) => ({
      id: p.id,
      title: p.category || chapter.abstractTitle,
      readCount: (p.readCount || 2) as 1 | 2,
      tracks: p.audioTracks as ListeningAudioTrack[],
    }));
}

/**
 * タブに出す見出しを「小さな添え字（上段）＋ 見出し（下段）」に分解する。
 *
 * - 化学基礎／化学：「1章 物質の構成」→ 上段「1章」／下段「物質の構成」
 * - 英語リスニング：「第1問」        → 上段「Q1」／下段「第1問」
 *                   「第1問 A」      → 上段「Q1A」／下段「第1問 A」
 *   （リスニングの大問には章名が無いので、上段に通し番号を置いて
 *    デザイン（2段組みのタブ）を他科目とまったく同じに保つ）
 *
 * ★A・B の枝番まで上段に出す理由★
 *   第1問 A と第1問 B は設問形式がまったく違う別の練習なので、
 *   タブを横に並べたときに「Q1」が2つ続くと見分けが付かない。
 *   上段を Q1A / Q1B と書き分けることで、狭いスマホ幅でも取り違えない。
 */
/**
 * 見出しの上に出す「部」の名前を、生徒に分かる言葉にする。
 * データ（chemistryData.ts）の part.title は変えない（他で使っているため）。
 *   化学基礎：第一部・化学基礎前半 → 物質の構成（1〜3章）／ 第二部・化学基礎後半 → 物質の変化（4〜6章）
 *   （教科書の大きな区分「物質の構成」「物質の変化」に合わせる）
 */
export function displayPartTitle(subject: string, partTitle: string): string {
  if (subject === 'chemistry_basic') {
    if (/前半/.test(partTitle)) return '化学基礎 ／ 物質の構成（1〜3章）';
    if (/後半/.test(partTitle)) return '化学基礎 ／ 物質の変化（4〜6章）';
  }
  return partTitle;
}

function splitTabTitle(title: string, index: number): { kicker: string; label: string } {
  const chapterMatch = title.match(/^(\d+章)\s*(.*)$/);
  if (chapterMatch) {
    return { kicker: chapterMatch[1], label: chapterMatch[2] || title };
  }
  // 「第1問」「第1問 A」「第1問A」のいずれの表記でも拾う
  const questionMatch = title.match(/^第(\d+)問\s*([A-Z]?)$/);
  if (questionMatch) {
    return { kicker: `Q${questionMatch[1]}${questionMatch[2]}`, label: title };
  }
  return { kicker: `${index + 1}章`, label: title };
}

export function ChapterSelection({ mode, onSelectChapter, onBack, subject = 'chemistry_basic', field, fieldTitle, onChangeSubject, onChangeField, rememberedGroup, onGroupChange, backLabel = '戻る' }: ChapterSelectionProps) {
  // 科目ごとに画面の作りが変わる箇所だけフラグにしている。
  // （数学・生物基礎はタブの作り方も中身の出し方も共通処理のままなので、
  //   専用のフラグは持たない）
  const isAdvanced = subject === 'chemistry';
  const isListening = subject === 'english_listening';
  const isGrammar = subject === 'english_grammar';
  /**
   * 地理はリスニングと同じく「大問別のタブ（第1問）→ 回ごとの単元」という
   * 2階層なので、この一行がないと今どの科目の画面なのか分からない。
   * タブの作り方（realTitle でまとめる）と中身の出し方は共通処理のまま。
   */
  const isGeography = subject === 'geography';
  /**
   * 科目ごとの配色。
   * これまで覈しのラベル等はすべてダスティローズ直書きだったため、
   * 化学でもリスニングでも同じ色に見えてしまっていた。
   * 色を動的に差し替える部分は Tailwind の JIT が拾えないので style 属性で渡す。
   */
  const theme = subjectTheme(subject);

  /**
   * 表示対象のタブ一覧。
   * - 化学基礎      ：従来どおり全 parts
   * - 化学          ：選択された分野（part）のみに絞る
   * - 英語リスニング：全 parts（前半＝2回読み／後半＝1回読み）
   */
  const groups = useMemo(() => {
    // 化学（発展）だけは分野（理論／無機／有機）で parts を絞るため別扱い。
    // 他の教科は parts をそのまま使うので共通処理で作れる。
    if (isAdvanced) {
      const parts = getPartsOfSubject('chemistry').filter((p: any) => !field || p.field === field);
      return buildChapterGroups(parts);
    }
    // ★英文法は「PART（文法の幹／語法／会話表現）」の3タブ★
    //   章見出し（1章〜12章）でタブを作ると、1〜2単元しかないタブが12枚並び、
    //   スマホでは横スクロールしないと先が見えなかった。3タブにすると1画面で全体が見渡せる。
    if (isGrammar) return getGrammarPartGroups();
    // 化学基礎（および想定外の科目）は化学基礎のタブになる（従来どおり）。
    return getChapterGroups(subject);
  }, [isAdvanced, subject, field]);

  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);
  /**
   * 復習用音源パネルで開いている回（problem.id）。
   * 英語リスニングのみで使う。null なら閉じている。
   */
  const [openAudioSetId, setOpenAudioSetId] = useState<string | null>(null);
  const [activeGroupTitle, setActiveGroupTitle] = useState(groups.some(g => g.title === rememberedGroup) ? rememberedGroup! : groups[0]?.title || '');
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [selectedFlowchart, setSelectedFlowchart] = useState<{ id: string; title: string; questions: any[] } | null>(null);

  /**
   * すでに解いた大問（回）の一覧。
   *
   * ■ なぜ出すのか
   *   「第1回演習〜第14回演習」を並べるだけだと、次にどれをやればいいのか
   *   分からず、同じ回を何度も開いてしまう。解いた回に「済」を付けることで、
   *   まだ手を付けていない回が一目で分かる。
   *
   * ■ 通信しない理由
   *   これは localStorage の台帳（solved_problems_v1_*）を読むだけ。
   *   単元選択を開くたびに通信すると表示が遅くなるので、
   *   すでに手元にある記録だけで描画する。
   */
  const solvedMap = useMemo(
    () => readSolvedMap(auth.currentUser?.uid || 'guest'),
    // 画面に入ったときの一度だけで十分（回を解いたら演習画面を経由して戻ってくる）
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  /** ステージ（単元・回）ごとの満点回数（utils/stageRecords.ts。満点3回で達成） */
  const stageRecords = useMemo(
    () => readStageRecords(auth.currentUser?.uid || 'guest'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  /** 単元ごとの正答率（utils/unitStats.ts。採点のたびに quizScoring が記録している） */
  const unitStats = useMemo(
    () => readUnitStats(auth.currentUser?.uid || 'guest'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // 分野を切り替えたときは、その分野の先頭の章を開き直す
  useEffect(() => {
    setActiveGroupTitle(groups.some(g => g.title === rememberedGroup) ? rememberedGroup! : groups[0]?.title || '');
    setExpandedChapterId(null);
    setOpenAudioSetId(null);
  }, [groups]);

  // スマホでは選択中のタブを横スクロール領域の中央付近に保つ。
  // PC のグリッド表示では inline 方向にあふれないため、同じ処理でも位置は変わらない。
  useEffect(() => {
    tabRefs.current[activeGroupTitle]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [activeGroupTitle]);

  // ---- 数学：段階→科目で絞り込む ----
  const isMath = subject === 'math';
  const mathCountByCourse = useMemo(() => {
    const out: Partial<Record<MathCourseKey, number>> = {};
    if (!isMath) return out;
    for (const g of groups) { const c = mathCourseOfGroup(g); if (c) out[c] = (out[c] ?? 0) + g.chapters.length; }
    return out;
  }, [isMath, groups]);
  const initialCourse = useMemo<MathCourseKey>(() => {
    const g = groups.find(x => x.title === activeGroupTitle);
    return (g && mathCourseOfGroup(g)) || 'mc1';
    // 最初の1回だけ（記憶していた分野の科目で開く）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);
  const [mathCourse, setMathCourse] = useState<MathCourseKey>(initialCourse);
  useEffect(() => setMathCourse(initialCourse), [initialCourse]);
  const mathLevel = mathLevelOfCourse(mathCourse);
  const visibleGroups = useMemo(
    () => (isMath ? groups.filter(g => mathCourseOfGroup(g) === mathCourse) : groups),
    [isMath, groups, mathCourse],
  );
  const pickMathCourse = (course: MathCourseKey) => {
    setMathCourse(course);
    const first = groups.find(g => mathCourseOfGroup(g) === course);
    if (first) { setActiveGroupTitle(first.title); onGroupChange?.(first.title); }
    setExpandedChapterId(null);
    document.getElementById('chapter-tab-panel')?.scrollTo({ top: 0 });
  };

  const activeGroup = groups.find(group => group.title === activeGroupTitle) || groups[0];
  /** 科目全体での通し番号（①〜⑳ → 01.〜20.）。タブを切り替えても番号が振り直されないようにする。 */
  const chapterNumberById = useMemo(() => {
    const m = new Map<string, number>();
    groups.flatMap(g => g.chapters).forEach((c: any, i: number) => m.set(c.id, i));
    return m;
  }, [groups]);

  // 章タブの中の単元を見出しつきで小分けにする（並べ方だけ。問題・IDは変えない）
  const unitSections = useMemo(
    () => buildUnitSections(subject, (activeGroup?.chapters ?? []) as any[], (c: any) =>
      (mode === 'mini_test' ? (c.miniTest || []) : (c.practiceProblems || [])).length),
    [subject, activeGroup, mode],
  );
  const orderedChapters = useMemo(() => unitSections.flatMap(sec => sec.chapters), [unitSections]);
  const unitSectionByChapter = useMemo(() => {
    const m = new Map<string, (typeof unitSections)[number]>();
    for (const sec of unitSections) for (const c of sec.chapters) m.set(c.id, sec);
    return m;
  }, [unitSections]);

  // 出題傾向データ（科目ごとに切り替える）。リスニングには傾向データがないのでボタンを出さない。
  const trendDataset = isAdvanced ? chemistryAdvancedTrendDataset : chemistryBasicTrendDataset;
  const trendUnitMap = isListening
    ? {}
    : isAdvanced
      ? advancedChapterIdToTrendUnit
      : chapterIdToTrendUnit;
  const trendGroupMap: Record<string, string> = isListening
    ? {}
    : isAdvanced
      ? advancedRealTitleToChapterGroupTitle
      : realTitleToChapterGroupTitle;

  // 出題傾向モーダルの状態
  const [trendModal, setTrendModal] = useState<{
    open: boolean;
    chapterGroupTitle?: string;
    unitId?: string;
  }>({ open: false });
  // チュートリアル（物質量 mol 補講）モーダルの開閉
  const [tutorialOpen, setTutorialOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="mtb-page chapter-route flex h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom))] min-h-0 w-full flex-col overflow-hidden notebook-paper p-3 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:p-5 sm:pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:p-6 md:pb-[calc(5.75rem+env(safe-area-inset-bottom))] relative font-handwriting">
      {/* ★見出しは1行・80px以内（UIの決まり）★
          以前は「科目名の小見出し／演習問題／学習したい単元を選択してください／科目を変更」の4段で
          スマホの縦の1/4を使っていた。戻る・科目名・とびら君を1行にまとめる。 */}
      <header className="chapter-route-heading unit-head shrink-0">
        <button type="button" onClick={onBack} className="unit-head-back" aria-label={`${backLabel}へ戻る`}>
          <ArrowLeft size={18} aria-hidden="true" /><span>{backLabel}</span>
        </button>
        <div className="unit-head-title">
          <h2 style={{ color: theme.accent }}>{isListening ? '英語リスニング' : isGrammar ? '英文法' : isAdvanced && fieldTitle ? `化学 ／ ${fieldTitle}` : theme.label}</h2>
          <p>{mode === 'mini_test' ? '小テスト' : isListening ? '共通テスト大問別・1回ずつ完結' : isGrammar ? '単元別の4択演習' : isGeography ? '共通テスト大問別' : '単元を選ぶ'}</p>
        </div>
        <DoorMascot subject={subject} showSpeech={false} size="mini" className="unit-head-mascot w-auto" />
      </header>

      {isAdvanced && onChangeField && <div className="mb-2 flex shrink-0 gap-2" role="group" aria-label="化学の分野">
        {ADVANCED_FIELDS.map(item => <button key={item.id} type="button" aria-pressed={field === item.id} onClick={() => onChangeField(item.id)} className={`min-h-[44px] flex-1 rounded-xl border px-2 text-sm font-bold ${field === item.id ? 'bg-[#2C3E50] text-white' : 'border-gray-200 bg-white text-[#2C3E50]'}`}>{item.title}</button>)}
      </div>}
      {subject === 'math' && (
        /* ★数学は「数ⅠA／数ⅡB／数ⅢC → 科目 → 単元」の順に選ぶ★
           以前は教材の束（基礎から標準・全範囲・全パターン）ごとに並んでいて、
           同じ「数学A」の単元が3か所に散らばっていた。教科書の区分で探せるようにする。 */
        <div className="math-nav mb-2 shrink-0 space-y-1.5" data-math-nav>
          <div className="math-nav-levels" role="group" aria-label="数学の段階">
            {MATH_LEVELS.map(level => (
              <button key={level.id} type="button" aria-pressed={mathLevel === level.id}
                onClick={() => pickMathCourse(level.courses[0])}>
                {level.label}
              </button>
            ))}
          </div>
          <div className="math-nav-courses" role="group" aria-label="数学の科目">
            {(MATH_LEVELS.find(l => l.id === mathLevel)?.courses ?? []).map(course => (
              <button key={course} type="button" aria-pressed={mathCourse === course} onClick={() => pickMathCourse(course)}>
                {MATH_COURSE_LABELS[course]}
                <small>{mathCountByCourse[course] ?? 0}単元</small>
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm font-bold text-[#2C3E50]">
            <span className="shrink-0">分野</span>
            <select
              aria-label="数学の分野へ移動"
              value={activeGroupTitle}
              onChange={event => {
                setActiveGroupTitle(event.target.value);
                onGroupChange?.(event.target.value);
                setExpandedChapterId(null);
                document.getElementById('chapter-tab-panel')?.scrollTo({ top: 0 });
              }}
              className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-2"
            >
              {visibleGroups.map(group => <option key={`${group.partId}:${group.title}`} value={group.title}>{(group as any).label ?? group.title}（{group.chapters.length}単元）</option>)}
            </select>
          </label>
        </div>
      )}
      <div className="chapter-workspace flex min-h-0 flex-1 flex-col font-handwriting">
        {/* ================================================================
            章／大問の一覧
            ================================================================
            ■ スマホは横スクロールにする理由
              2列の折り返し一覧はタブだけで縦幅を使い、下の問題を選びにくかった。
              横並び＋スナップにして、問題一覧を見せたまま親指で単元を切り替えられるようにする。
              タブ幅を画面の半分より少し狭くし、次のタブが一部見えることで
              右側にも単元が続くことが分かるようにしている。

            ■ タブレット／PCはグリッドを保つ理由
              横幅がある画面では複数章を一度に見渡せる利点が大きいため、
              sm 以上では従来どおり折り返しグリッドに戻す。
              長い章名は途中で省略せず、タブ内で折り返して全文を表示する。
        */}
        <div className="chapter-index mb-3 shrink-0 border-b border-slate-200/80" data-few-tabs={visibleGroups.length <= 3 || undefined}>
          <div
            role="tablist"
            aria-label="章を選択"
            className={`flex touch-pan-x snap-x snap-mandatory gap-1.5 overflow-x-auto overscroll-x-contain px-0.5 pb-2 [scrollbar-width:thin] ${subject === 'math' ? '' : 'sm:grid sm:grid-cols-3 sm:overflow-x-visible sm:overscroll-auto lg:grid-cols-4 xl:grid-cols-5'}`}
          >
            {visibleGroups.map((group, index) => {
              const isActive = group.title === activeGroup?.title;
              const { kicker: chapterNumber, label: shortTitle } = (group as any).kicker
                ? { kicker: `${(group as any).kicker}・${group.chapters.length}単元`, label: (group as any).label as string }
                : splitTabTitle(group.title, index);

              // ★スマホ用チュートリアルタイル（化学基礎のみ）
              //   ご要望「チュートリアルは 3章と4章の間に入れて、下は単元ボタンを
              //   広く表示して」に対応。章タブの横スクロール列の 3章の直後に
              //   チュートリアル入口を差し込み、画面下部の常設バナーはスマホでは
              //   非表示にする（→ 単元一覧の縦スペースが広がる）。
              //   章が3つ未満の科目でも壊れないよう、最後のタブの後ろに出す。
              const tutorialSlot = subject === 'chemistry_basic'
                && (index === 2 || (groups.length <= 3 && index === groups.length - 1));

              return (
                <React.Fragment key={group.title}>
                <button
                  ref={(element) => {
                    tabRefs.current[group.title] = element;
                  }}
                  id={`chapter-tab-${index}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="chapter-tab-panel"
                  onClick={() => {
                    setActiveGroupTitle(group.title);
                    onGroupChange?.(group.title);
                    setExpandedChapterId(null);
                    // 大問を切り替えたら、開いていた復習用音源パネルも閉じる
                    // （別の大問の音源が開いたまま残るのを防ぐ）
                    setOpenAudioSetId(null);
                    document.getElementById('chapter-tab-panel')?.scrollTo({ top: 0 });
                  }}
                  className={`flex h-full min-h-[3rem] w-[42vw] min-w-[8.5rem] max-w-[11rem] shrink-0 snap-center flex-col justify-center rounded-xl border px-2.5 py-2 text-left transition-all cursor-pointer sm:w-auto sm:min-w-0 sm:max-w-none sm:shrink ${
                    isActive
                      ? 'border-[#A9CCE3] bg-[#2C3E50] text-white shadow-sm'
                      : 'border-slate-200 bg-white/75 text-slate-600 hover:border-[#A9CCE3] hover:bg-white'
                  }`}
                >
                  <span
                    className="block text-[10px] font-bold leading-none"
                    style={{ color: isActive ? theme.accentSoft : theme.accent }}
                  >
                    {chapterNumber}
                  </span>
                  <span className="mt-1 block text-xs sm:text-sm font-bold leading-snug break-words [overflow-wrap:anywhere]">
                    {shortTitle}
                  </span>
                  {(() => {
                    // ★タブにも「問題がまだ無い章」を出す★ 開いてから準備中と分かるのでは遅い
                    const ready = group.chapters.filter((c: any) => ((mode === 'mini_test' ? c.miniTest : c.practiceProblems) || []).length > 0).length;
                    if (isListening || ready === group.chapters.length) return null;
                    return (
                      <span className="chapter-tab-status" data-ready={ready > 0}>
                        {ready === 0 ? '準備中' : `${ready}/${group.chapters.length}単元`}
                      </span>
                    );
                  })()}
                </button>
                {tutorialSlot && (
                  <button
                    type="button"
                    onClick={() => setTutorialOpen(true)}
                    className="flex h-full min-h-[3rem] w-[42vw] min-w-[8.5rem] max-w-[11rem] shrink-0 snap-center flex-col justify-center rounded-xl border-2 border-[#7c3aed]/40 bg-gradient-to-r from-[#f6f1ff] to-[#efe6ff] px-2.5 py-2 text-left transition-all cursor-pointer hover:border-[#7c3aed] sm:hidden"
                    title="チュートリアル：物質量（mol）がわからない人へ"
                  >
                    <span className="flex items-center gap-1 text-[10px] font-bold leading-none text-[#7c3aed]">
                      <GraduationCap size={11} />
                      チュートリアル
                    </span>
                    <span className="mt-1 block text-xs font-bold leading-snug text-[#3f3352] break-words [overflow-wrap:anywhere]">
                      mol がわからない人へ
                    </span>
                  </button>
                )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {activeGroup && (
          <section
            id="chapter-tab-panel"
            role="tabpanel"
            aria-labelledby={`chapter-tab-${groups.indexOf(activeGroup)}`}
            tabIndex={0}
            className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain rounded-2xl border border-slate-200/80 bg-white/35 p-3 pb-6 sm:p-4 sm:pb-6 [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable]"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
              <div>
                <p className="text-[10px] font-bold" style={{ color: theme.accent }}>{displayPartTitle(subject, activeGroup.partTitle)}</p>
                {/* タブと同じ名前をもう一度出さない（UIの決まり：同じものを2つ置かない）。
                    タブにない情報（部の名前・流れ）だけを1行で添える。 */}
              </div>
              {trendGroupMap[activeGroup.title] && (
                <button
                  type="button"
                  onClick={() => setTrendModal({
                    open: true,
                    chapterGroupTitle: trendGroupMap[activeGroup.title],
                  })}
                  className="flex items-center gap-1.5 rounded-lg border border-[#A9CCE3] bg-[#A9CCE3]/15 px-2.5 py-1.5 text-[11px] font-bold text-[#2C3E50] transition-colors hover:bg-[#A9CCE3]/30 cursor-pointer"
                  title={`${activeGroup.title} の共通テスト出題傾向を確認`}
                >
                  <BarChart2 size={13} className="text-[#6FA8C5]" />
                  共通テスト傾向
                </button>
              )}
            </div>

            {/* ================================================================
                英語リスニング：「第N回演習」のボタンを並べる
                ================================================================
                ■ なぜこの形にしたのか（ご要望）
                  これまで「第1問A」を開くと、収録14回分が1本の通し番号
                  （進捗 1/14）でつながっていた。つまり
                    ・今日は第3回だけやりたい
                    ・前にやった第7回だけ解き直したい
                  ができず、必ず頭から通しで解くしかなかった。
                  そこで大問のページを開いた時点で
                  「第1回演習 … 第14回演習」が並ぶ形にして、
                  やりたい回をその場で1タップで始められるようにした。

                ■ 化学と分けている理由
                  化学基礎・化学は「章 → 大問がいくつか」という作りで、
                  回という単位が無い。共通の見た目にすると、かえって
                  どちらの科目でも意味の分からないボタンが並ぶ。
                  そのため、リスニングだけ専用の並べ方にしている。 */}
            {isListening ? (
              <div className="space-y-5" data-listening-rounds>
                {activeGroup.chapters.map((chapter: any) => {
                  const questions = mode === 'mini_test' ? (chapter.miniTest || []) : (chapter.practiceProblems || []);
                  const rounds = buildListeningRounds(questions);
                  const audioSets = collectAudioSets(chapter);

                  return (
                    <div key={chapter.id}>
                      {/* 単元の説明（何を練習する回なのか）。
                          回のボタンだけだと「第1問Aって何をするんだっけ」が分からない。 */}
                      <div className="mb-2.5">
                        {chapter.topics && chapter.topics.length > 0 && (
                          <p className="text-xs font-bold leading-relaxed text-slate-600">
                            {chapter.topics.join(' ・ ')}
                          </p>
                        )}
                        <p className="mt-1 text-xs font-bold text-slate-600">
                          {rounds.length > 0
                            ? `全${rounds.length}回 ／ 達成 ${rounds.filter((r) => isStageCleared(stageRecords[stageKey(chapter.id, r.questionId)])).length}回（満点${STAGE_CLEAR_PERFECTS}回で達成）`
                            : 'この大問の問題は準備中です'}
                        </p>
                      </div>

                      {rounds.length > 0 ? (
                        <div className="round-grid grid grid-cols-1 gap-1.5 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {rounds.map((round) => {
                            const roundStage = stageRecords[stageKey(chapter.id, round.questionId)];
                            const solved = isStageCleared(roundStage);
                            const tried = !!solvedMap[problemKey(chapter.id, round.questionId)] || !!roundStage;
                            const audio = audioSets.find((s) => s.id === round.questionId);
                            return (
                              <div
                                key={round.questionId}
                                data-round
                                data-status={solved ? 'done' : 'todo'}
                                className={`round-card flex items-stretch gap-1.5 rounded-xl border p-1.5 text-left shadow-xs transition-all ${
                                  solved
                                    ? 'border-[#5BC0BE]/60 bg-[#EAF9F6]'
                                    : 'border-yellow-200/80 bg-[#FFFDF2]/90'
                                }`}
                              >
                                {/* 回のボタン本体。
                                    第4引数で「この回だけ」を範囲として渡すことで、
                                    進捗が 1/1 になり、その回を解き終えた時点で
                                    ちゃんと結果画面に進む。 */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    onSelectChapter(chapter.id, round.index, false, {
                                      startIndex: round.index,
                                      endIndex: round.index,
                                    })
                                  }
                                  className="round-main flex min-h-[48px] min-w-0 flex-1 flex-col justify-center items-start px-1.5 text-left cursor-pointer"
                                  title={`${round.roundLabel}${round.detail ? ` ／ ${round.detail}` : ''}`}
                                >
                                  <span className="flex w-full items-center justify-between gap-1">
                                    <span className="round-title font-bold text-[#2C3E50]">
                                      {round.roundLabel}
                                    </span>
                                    {solved ? (
                                      <span className="round-done mt-status shrink-0" data-status="done">
                                        達成
                                      </span>
                                    ) : tried ? (
                                      <span className="round-done mt-status shrink-0" data-status="doing">
                                        満点 {roundStage?.p ?? 0}/{STAGE_CLEAR_PERFECTS}
                                      </span>
                                    ) : (
                                      <ChevronRight size={13} className="shrink-0 text-[#A9CCE3]" />
                                    )}
                                  </span>
                                  {round.detail && (
                                    <span className="round-detail mt-0.5 line-clamp-1 font-bold leading-snug text-slate-600">
                                      {round.detail}
                                    </span>
                                  )}
                                </button>

                                {/* 回ごとの復習用音源。
                                    問題を解き直さなくても、この回の音声だけを聞ける。 */}
                                {audio && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenAudioSetId(openAudioSetId === audio.id ? null : audio.id)
                                    }
                                    aria-expanded={openAudioSetId === audio.id}
                                    aria-label={`${round.roundLabel} の音源だけを聞く`}
                                    className={`round-audio inline-flex min-h-[44px] min-w-[44px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border px-1 font-bold transition-colors cursor-pointer ${
                                      openAudioSetId === audio.id
                                        ? 'border-[#3E9C93] bg-[#3E9C93] text-white'
                                        : 'border-[#5BC0BE]/60 bg-white text-[#2F7C74] hover:bg-[#D8F3EE]'
                                    }`}
                                    title={`${round.roundLabel} の音源だけを聞く`}
                                  >
                                    <Headphones size={16} aria-hidden="true" />
                                    <span>音源</span>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-slate-200 bg-white/70 p-4 text-center text-[11px] font-bold text-slate-400">
                          準備中（問題は順次追加しています）
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
            <div className="chapter-route-list unit-card-list">
              {orderedChapters.map((chapter, routeIndex) => {
                const questions = mode === 'mini_test' ? (chapter.miniTest || []) : (chapter.practiceProblems || []);
                const hasQuestions = questions.length > 0;
                const savedIndex = Math.max(0, Math.min(
                  questions.length - 1,
                  parseInt(localStorage.getItem(quizIndexKey(chapter.id, mode)) || '0', 10) || 0
                ));
                const hasSavedProgress = hasQuestions && (
                  savedIndex > 0 ||
                  localStorage.getItem(quizExplKey(chapter.id, mode)) === 'true' ||
                  !!localStorage.getItem(quizRunKey(chapter.id, mode)) ||
                  (() => {
                    try { return Object.keys(JSON.parse(localStorage.getItem(quizAnswersKey(chapter.id, mode)) || '{}')).length > 0; }
                    catch { return false; }
                  })()
                );
                // 英文法の各問も「空所を埋めた完成文」の音源を持っている（単元画面から聞き直せる入口）。
                const audioSets = isListening || isGrammar ? collectAudioSets(chapter) : [];
                const solvedCount = questions.filter((q: any) => solvedMap[problemKey(chapter.id, q.id)]).length;
                const stat = unitStats[chapter.id];
                const stage = stageRecords[stageKey(chapter.id)];
                // 達成＝この単元を満点で STAGE_CLEAR_PERFECTS 回。それまでは「満点 n/3」と数えて見せる
                // ★英文法は「1回（5問）＝1ステージ」★ 単元まるごと通すと 5/5 の後も次の回へ進み、結果が出ない（2026-10-04）。
                //   学習開始は「まだ達成していない最初の回」だけを始める。単元の達成＝全部の回を達成。
                const roundCleared = isGrammar ? questions.map((q: any) => isStageCleared(stageRecords[stageKey(chapter.id, q.id)])) : [];
                const clearedRounds = roundCleared.filter(Boolean).length;
                const nextRound = isGrammar ? Math.max(0, roundCleared.findIndex((c: boolean) => !c)) : 0;
                const roundTried = isGrammar && questions.some((q: any) => stageRecords[stageKey(chapter.id, q.id)]);
                const status = isGrammar
                  ? (questions.length > 0 && clearedRounds === questions.length ? 'done' : (solvedCount > 0 || hasSavedProgress || !!stat || roundTried) ? 'doing' : 'todo')
                  : isStageCleared(stage) ? 'done' : (solvedCount > 0 || hasSavedProgress || !!stat || !!stage) ? 'doing' : 'todo';

                // ★見出しつきの小分け（数学の段階・地理の単元演習/模試・準備中）★ src/data/unitSections.ts
                const section = unitSectionByChapter.get(chapter.id);
                const prevSection = routeIndex > 0 ? unitSectionByChapter.get(orderedChapters[routeIndex - 1].id) : undefined;
                const stageHeading = section?.label && section !== prevSection ? (
                  <h4 className="math-stage-heading col-span-full" data-stage={section.key?.split(':')[1] ?? section.key ?? ''}>
                    <span>{section.label}</span>
                    <small>{section.chapters.length}単元</small>
                  </h4>
                ) : null;
                const expanded = expandedChapterId === chapter.id;

                return (
                  <React.Fragment key={chapter.id}>
                  {stageHeading}
                  <div data-unit-id={chapter.id}>
                  <UnitCard
                    index={chapterNumberById.get(chapter.id) ?? routeIndex}
                    title={chapter.abstractTitle}
                    topics={chapter.topics}
                    questionCount={questions.length}
                    status={status}
                    accuracy={accuracyOf(stat)}
                    perfects={isGrammar ? undefined : stage?.p ?? 0}
                    progressLabel={isGrammar && status === 'doing' ? `達成 ${clearedRounds}/${questions.length}回` : undefined}
                    hasSavedProgress={hasSavedProgress}
                    expanded={expanded}
                    accent={theme.accent}
                    onToggle={() => setExpandedChapterId(expanded ? null : chapter.id)}
                    onStart={() => isGrammar
                      ? onSelectChapter(chapter.id, nextRound, false, { startIndex: nextRound, endIndex: nextRound })
                      : onSelectChapter(chapter.id, 0, false)}
                    onResume={() => isGrammar
                      ? onSelectChapter(chapter.id, savedIndex, true, { startIndex: savedIndex, endIndex: savedIndex })
                      : onSelectChapter(chapter.id, savedIndex, true)}
                    onAudio={audioSets.length > 0 ? () => setOpenAudioSetId(openAudioSetId === audioSets[0].id ? null : audioSets[0].id) : undefined}
                    audioOpen={audioSets.length > 0 && openAudioSetId === audioSets[0].id}
                    onExplain={hasQuestions ? () => setSelectedFlowchart({ id: chapter.id, title: chapter.abstractTitle, questions }) : undefined}
                  >
                    {trendUnitMap[chapter.id] && (
                      <button
                        type="button"
                        onClick={() => setTrendModal({ open: true, chapterGroupTitle: trendUnitMap[chapter.id].chapterGroupTitle, unitId: trendUnitMap[chapter.id].unitId })}
                        className="unit-card-link"
                      >
                        <TrendingUp size={14} aria-hidden="true" />出題傾向を見る
                      </button>
                    )}
                    {hasQuestions && questions.length > 1 && (
                      <div className="chapter-question-list unit-card-questions">
                        {questions.map((question: any, questionIndex: number) => (
                          <button key={question.id} type="button" onClick={() => onSelectChapter(chapter.id, questionIndex, false)}>
                            <span>{question.category || `問 ${questionIndex + 1}`}</span>
                            <ChevronRight size={14} aria-hidden="true" />
                          </button>
                        ))}
                      </div>
                    )}
                  </UnitCard>
                  </div>
                  </React.Fragment>
                );
              })}
            </div>
            )}

            {/* ================================================================
                復習用の音源を聞く場所（英語リスニングのみ）
                ================================================================
                ご要望「復習用の音源を聞く場所もしっかりと作って」に対応。

                ・単元カードは横4列のグリッドで幅が狭いため、プレーヤー本体は
                  グリッドの**下に全幅**で開く（スクリプトや語句が読める幅を確保）。
                ・カード側の「音源」ボタンと連動し、押した回のパネルが開く。
                ・問題を解かなくても再生できるので、通学中の聞き直しに使える。 */}
            {(isListening || isGrammar) && (
              <AnimatePresence initial={false}>
                {(() => {
                  const sets = activeGroup.chapters.flatMap((c: any) => collectAudioSets(c));
                  const target = sets.find((s) => s.id === openAudioSetId);
                  if (!target) return null;
                  return (
                    <motion.div
                      key={target.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3">
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          {/* 色は科目テーマに揃える。
                              リスニングは従来のミントをそのまま使い続ける（見た目不変）。 */}
                          <p
                            className={
                              isGrammar
                                ? 'text-[11px] font-bold text-[#9D5C24]'
                                : 'text-[11px] font-bold text-[#2F7C74]'
                            }
                          >
                            復習用音源 ／ {target.title}
                          </p>
                          <button
                            type="button"
                            onClick={() => setOpenAudioSetId(null)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-500 transition-colors hover:bg-slate-50 cursor-pointer"
                          >
                            <X size={11} />
                            閉じる
                          </button>
                        </div>
                        <ListeningAudioPlayer
                          tracks={target.tracks}
                          mode="review"
                          tone="light"
                          readCount={target.readCount}
                          title="復習用の音源を聞く（問題を解かずに音声だけ再生）"
                        />
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            )}
          </section>
        )}

        {/* ========== チュートリアル（単元選択の下） ==========
            物質量（mol）の考え方を配布プリントそのままの途中式で学べる
            「物質量（mol）がわからない人へ」をチュートリアルとして常設表示する。
            ※ mol は化学基礎の内容なので、化学（発展）では表示しない。 */}
        {/* スマホでは章タブ列にチュートリアル入口を移したので、
            この常設バナーは sm 以上（タブレット・PC）だけに表示する。
            → スマホは単元一覧（①・②…のカード）が縦に広く使える。 */}
        {subject === 'chemistry_basic' && (
        <div className="hidden sm:block shrink-0 mt-3">
          <button
            type="button"
            onClick={() => setTutorialOpen(true)}
            className="w-full flex items-center justify-between gap-3 rounded-2xl border-2 border-[#7c3aed]/35 bg-gradient-to-r from-[#f6f1ff] to-[#efe6ff] px-4 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
            title="チュートリアル：物質量（mol）がわからない人へ"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7c3aed] text-white shadow-md">
                <GraduationCap size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-widest text-[#7c3aed]">チュートリアル</p>
                <p className="truncate text-sm sm:text-base font-bold text-[#3f3352]">
                  物質量（mol）がわからない人へ
                </p>
                <p className="hidden sm:block truncate text-[11px] font-bold text-[#6b6280]">
                  「スタートは？ゴールは？」単位変換の図と同じ途中式で mol 計算を根本から理解する
                </p>
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#7c3aed] px-3 py-1.5 text-[11px] font-bold text-white">
              開く
              <ChevronRight size={13} />
            </span>
          </button>
        </div>
        )}
      </div>

      {/* チュートリアル全画面モーダル */}
      <AnimatePresence>
        {tutorialOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex flex-col bg-black/45 backdrop-blur-sm"
            onClick={() => setTutorialOpen(false)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mx-auto my-3 flex h-[calc(100dvh-1.5rem)] w-[min(60rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-2xl bg-[#fbf8ff] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#c9bce6] bg-white/90 px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <GraduationCap size={18} className="shrink-0 text-[#7c3aed]" />
                  <span className="truncate text-sm sm:text-base font-bold text-[#3f3352]">
                    チュートリアル：物質量（mol）がわからない人へ
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setTutorialOpen(false)}
                  className="flex shrink-0 items-center gap-1 rounded-full border border-[#c9bce6] bg-white px-3 py-1.5 text-xs font-bold text-[#5b21b6] transition-colors hover:bg-[#f3ecff] cursor-pointer"
                >
                  <X size={14} />
                  閉じる
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-6 sm:px-5 [-webkit-overflow-scrolling:touch]">
                <MolBasicsSection showHeader={false} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chapter Flowchart Viewer Modal */}
      <AnimatePresence>
        {selectedFlowchart && (
          <ChapterFlowchartModal 
            chapterId={selectedFlowchart.id}
            chapterTitle={selectedFlowchart.title}
            questions={selectedFlowchart.questions}
            onClose={() => setSelectedFlowchart(null)}
            onSelectQuestion={(qIdx) => onSelectChapter(selectedFlowchart.id, qIdx, false)}
          />
        )}
      </AnimatePresence>

      {/* 出題傾向モーダル */}
      {trendModal.open && (
        <TrendModal
          onClose={() => setTrendModal({ open: false })}
          targetChapterGroupTitle={trendModal.chapterGroupTitle}
          targetUnitId={trendModal.unitId}
          dataset={trendDataset}
        />
      )}
    </div>
  );
}
