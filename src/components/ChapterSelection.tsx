import React, { useEffect, useMemo, useRef, useState } from 'react';
// 教科ごとの parts は data/allChapters.ts から引く
// （以前はこのファイルで6教科ぶんを個別に import していた）
import { type SubjectKey } from '../data/allChapters';
import { ChevronRight, ArrowLeft, X, Headphones } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DoorMascot } from './DoorMascot';
import { subjectTheme } from '../data/subjectTheme';
import { ListeningAudioPlayer } from './ListeningAudioPlayer';
import type { Chapter } from '../types/curriculum';
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
import { safeGetItem, safeParseJson } from '../utils/safeLocalStorage';
import { getChapterGroups, getGrammarPartGroups, collectAudioSets, splitTabTitle } from '../utils/chapterGroups';

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
  rememberedGroup?: string;
  onGroupChange?: (group: string) => void;
  /** 「戻る」の行き先の名前（ホーム／学習モード）。押す前に分かるようにする。 */
  backLabel?: string;
  /**
   * 表示する科目。省略時は英語リスニング（SUBJECTS の先頭）。
   * 'english_listening' のときは、共通テストの大問を A・B ごとの単元として表示する
   * （第1問A・第1問B …）。各単元のページには「第N回演習」のボタンを並べる。
   */
  subject?: SubjectKey;
}

export function ChapterSelection({ mode, onSelectChapter, onBack, subject = 'english_listening', rememberedGroup, onGroupChange, backLabel = '戻る' }: ChapterSelectionProps) {
  // 科目ごとに画面の作りが変わる箇所だけフラグにしている。
  const isListening = subject === 'english_listening';
  const isGrammar = subject === 'english_grammar';
  /**
   * 科目ごとの配色。
   * これまで覈しのラベル等はすべてダスティローズ直書きだったため、
   * 化学でもリスニングでも同じ色に見えてしまっていた。
   * 色を動的に差し替える部分は Tailwind の JIT が拾えないので style 属性で渡す。
   */
  const theme = subjectTheme(subject);

  /**
   * 表示対象のタブ一覧。
   * - 英語リスニング：全 parts（前半＝2回読み／後半＝1回読み）
   * - 英文法        ：PART ごとの3タブ
   */
  const groups = useMemo(() => {
    // ★英文法は「PART（文法の幹／語法／会話表現）」の3タブ★
    //   章見出し（1章〜12章）でタブを作ると、1〜2単元しかないタブが12枚並び、
    //   スマホでは横スクロールしないと先が見えなかった。3タブにすると1画面で全体が見渡せる。
    if (isGrammar) return getGrammarPartGroups();
    return getChapterGroups(subject);
  }, [isGrammar, subject]);

  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);
  /**
   * 復習用音源パネルで開いている回（problem.id）。
   * 英語リスニングのみで使う。null なら閉じている。
   */
  const [openAudioSetId, setOpenAudioSetId] = useState<string | null>(null);
  const [activeGroupTitle, setActiveGroupTitle] = useState(groups.some(g => g.title === rememberedGroup) ? rememberedGroup! : groups[0]?.title || '');
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

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
  // 画面に入ったときの一度だけで十分（回を解いたら演習画面を経由して戻ってくる）
  // 画面に入ったときに1回だけ読む（useState の初期化関数は最初の描画でだけ呼ばれる）
  const [solvedMap] = useState(() => readSolvedMap(auth.currentUser?.uid || 'guest'));
  /** ステージ（単元・回）ごとの満点回数（utils/stageRecords.ts。満点3回で達成） */
  // 画面に入ったときに1回だけ読む（useState の初期化関数は最初の描画でだけ呼ばれる）
  const [stageRecords] = useState(() => readStageRecords(auth.currentUser?.uid || 'guest'));
  /** 単元ごとの正答率（utils/unitStats.ts。採点のたびに quizScoring が記録している） */
  // 画面に入ったときに1回だけ読む（useState の初期化関数は最初の描画でだけ呼ばれる）
  const [unitStats] = useState(() => readUnitStats(auth.currentUser?.uid || 'guest'));

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

  const activeGroup = groups.find(group => group.title === activeGroupTitle) || groups[0];
  /** 科目全体での通し番号（①〜⑳ → 01.〜20.）。タブを切り替えても番号が振り直されないようにする。 */
  const chapterNumberById = useMemo(() => {
    const m = new Map<string, number>();
    groups.flatMap(g => g.chapters).forEach((c, i) => m.set(c.id, i));
    return m;
  }, [groups]);

  // 章タブの中の単元を見出しつきで小分けにする（並べ方だけ。問題・IDは変えない）
  const unitSections = useMemo(
    () => buildUnitSections<Chapter>(subject, activeGroup?.chapters ?? [], (c) =>
      (mode === 'mini_test' ? (c.miniTest || []) : (c.practiceProblems || [])).length),
    [subject, activeGroup, mode],
  );
  const orderedChapters = useMemo(() => unitSections.flatMap(sec => sec.chapters), [unitSections]);
  const unitSectionByChapter = useMemo(() => {
    const m = new Map<string, (typeof unitSections)[number]>();
    for (const sec of unitSections) for (const c of sec.chapters) m.set(c.id, sec);
    return m;
  }, [unitSections]);

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
          <h2 style={{ color: theme.accent }}>{isListening ? '英語リスニング' : isGrammar ? '英文法' : theme.label}</h2>
          <p>{mode === 'mini_test' ? '小テスト' : isListening ? '共通テスト大問別・1回ずつ完結' : isGrammar ? '単元別の4択演習' : '単元を選ぶ'}</p>
        </div>
        <DoorMascot subject={subject} showSpeech={false} size="mini" className="unit-head-mascot w-auto" />
      </header>

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
        <div className="chapter-index mb-3 shrink-0 border-b border-slate-200/80" data-few-tabs={groups.length <= 3 || undefined}>
          <div
            role="tablist"
            aria-label="章を選択"
            className={`flex touch-pan-x snap-x snap-mandatory gap-1.5 overflow-x-auto overscroll-x-contain px-0.5 pb-2 [scrollbar-width:thin] sm:grid sm:grid-cols-3 sm:overflow-x-visible sm:overscroll-auto lg:grid-cols-4 xl:grid-cols-5`}
          >
            {groups.map((group, index) => {
              const isActive = group.title === activeGroup?.title;
              const { kicker: chapterNumber, label: shortTitle } = group.kicker
                ? { kicker: `${group.kicker}・${group.chapters.length}単元`, label: group.label as string }
                : splitTabTitle(group.title, index);

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
                    className="block text-xs font-bold leading-none"
                    style={{ color: isActive ? theme.accentSoft : theme.accent }}
                  >
                    {chapterNumber}
                  </span>
                  <span className="mt-1 block text-xs sm:text-sm font-bold leading-snug break-words [overflow-wrap:anywhere]">
                    {shortTitle}
                  </span>
                  {(() => {
                    // ★タブにも「問題がまだ無い章」を出す★ 開いてから準備中と分かるのでは遅い
                    const ready = group.chapters.filter((c) => ((mode === 'mini_test' ? c.miniTest : c.practiceProblems) || []).length > 0).length;
                    if (isListening || ready === group.chapters.length) return null;
                    return (
                      <span className="chapter-tab-status" data-ready={ready > 0}>
                        {ready === 0 ? '準備中' : `${ready}/${group.chapters.length}単元`}
                      </span>
                    );
                  })()}
                </button>
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
                <p className="text-xs font-bold" style={{ color: theme.accent }}>{activeGroup.partTitle}</p>
                {/* タブと同じ名前をもう一度出さない（UIの決まり：同じものを2つ置かない）。
                    タブにない情報（部の名前・流れ）だけを1行で添える。 */}
              </div>
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
                {activeGroup.chapters.map((chapter) => {
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
                        <div className="rounded-xl border border-slate-200 bg-white/70 p-4 text-center text-xs font-bold text-slate-400">
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
                  parseInt(safeGetItem(quizIndexKey(chapter.id, mode)) || '0', 10) || 0
                ));
                const hasSavedProgress = hasQuestions && (
                  savedIndex > 0 ||
                  safeGetItem(quizExplKey(chapter.id, mode)) === 'true' ||
                  !!safeGetItem(quizRunKey(chapter.id, mode)) ||
                  // 壊れた JSON は「保存なし」。null（JSON の null）は元の Object.keys(null) と同じく「保存なし」に倒す
                  Object.keys(safeParseJson<object>(safeGetItem(quizAnswersKey(chapter.id, mode)), {}) ?? {}).length > 0
                );
                // 英文法の各問も「空所を埋めた完成文」の音源を持っている（単元画面から聞き直せる入口）。
                const audioSets = isListening || isGrammar ? collectAudioSets(chapter) : [];
                const solvedCount = questions.filter((q) => solvedMap[problemKey(chapter.id, q.id)]).length;
                const stat = unitStats[chapter.id];
                const stage = stageRecords[stageKey(chapter.id)];
                // 達成＝この単元を満点で STAGE_CLEAR_PERFECTS 回。それまでは「満点 n/3」と数えて見せる
                // ★英文法は「1回（5問）＝1ステージ」★ 単元まるごと通すと 5/5 の後も次の回へ進み、結果が出ない（2026-10-04）。
                //   学習開始は「まだ達成していない最初の回」だけを始める。単元の達成＝全部の回を達成。
                const roundCleared = isGrammar ? questions.map((q) => isStageCleared(stageRecords[stageKey(chapter.id, q.id)])) : [];
                const clearedRounds = roundCleared.filter(Boolean).length;
                const nextRound = isGrammar ? Math.max(0, roundCleared.findIndex((c: boolean) => !c)) : 0;
                const roundTried = isGrammar && questions.some((q) => stageRecords[stageKey(chapter.id, q.id)]);
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
                  >
                    {hasQuestions && questions.length > 1 && (
                      <div className="chapter-question-list unit-card-questions">
                        {questions.map((question, questionIndex: number) => (
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
                  const sets = activeGroup.chapters.flatMap((c) => collectAudioSets(c));
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
                                ? 'text-xs font-bold text-[#9D5C24]'
                                : 'text-xs font-bold text-[#2F7C74]'
                            }
                          >
                            復習用音源 ／ {target.title}
                          </p>
                          <button
                            type="button"
                            onClick={() => setOpenAudioSetId(null)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-50 cursor-pointer"
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

      </div>

    </div>
  );
}
