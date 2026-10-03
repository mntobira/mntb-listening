/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Smartphone } from 'lucide-react';
import { BottomNavigation } from './components/ui/BottomNavigation';
import { ListeningHome as Home } from './components/ListeningHome';
import { ListeningSubjectSelection } from './components/ListeningSubjectSelection';
import { LaunchScreen } from './components/LaunchScreen';
import { ProfileModal } from './components/ProfileModal';
import { ModeSelection } from './components/ModeSelection';
/*
 * ★単元選択画面も「開いたときに読む」（遅延読み込み）★
 *
 * ChapterSelection は getPartsOfSubject を使っており、
 * これが data/allChapters（実測 2,703,107 B）に静的に届いていた。
 * 上に書いた3本の線のうちの3本目である。
 *
 * この画面はホームから «学習を始める → 科目 → モード» と
 * 何段か進んだ先にあるので、起動時に持っている必要がない。
 *
 * fallback は null＝何も描かない。
 * ローディング表示を足すと「元には無かった表示」が一瞬出て消えることになり、
 * それ自体が見た目の変化になるため、あえて足していない。
 */
const StudyCatalog = React.lazy(() => import('./components/StudyCatalog').then(m => ({ default: m.StudyCatalog })));
const FoundationPage = React.lazy(() =>
  import('./components/FoundationPage').then((m) => ({ default: m.FoundationPage })),
);
const ChapterSelection = React.lazy(() =>
  import('./components/ChapterSelection').then((m) => ({ default: m.ChapterSelection })),
);
/*
 * ★演習画面と結果・解説画面も「開いたときに読む」（遅延読み込み）★
 *
 * ■ 何が起動時の重さを固定していたのか（実測）
 *
 * 起動時に必ず落ちてくる問題データ（data チャンク 2.37 MB）を
 * 固定していた静的な線は、実測でたった3本だった。
 *
 *   1. App.tsx           → allChapters   2,703,107 B（findChapterById）
 *   2. App.tsx           → chemistryData 1,253,813 B（handleReviewNote）
 *   3. ChapterSelection  → allChapters   2,703,107 B（getPartsOfSubject）
 *
 * manualChunks が src/data をひとつの data チャンクにまとめているため、
 * ★1本でも静的な線が残っていると 2.37 MB 全部が落ちてくる。★
 * だから「1本だけ直して軽くなった」とは言えない。3本まとめて切る必要がある。
 *
 * ■ Quiz / Explanation を別ファイル（QuizScreens）に束ねた理由
 *
 * 1 の findChapterById は★App.tsx の描画中に同期で★呼ばれていた。
 * App.tsx 側でこれを非同期にすると、章が解決するまでの間
 *     appState === 'quiz' && selectedChapter && …
 * が false になり、演習画面が一瞬まったく描かれない。
 * 「単元を選んだのに一瞬何も出ない」という元には無かった見え方になる。
 *
 * そこで章を探す処理ごと遅延側（components/QuizScreens.tsx）に移した。
 * App.tsx は章ID（文字列）だけを渡し、問題データを一切知らなくなる。
 * 詳しい経緯は QuizScreens.tsx の冒頭コメントに書いている。
 */
const QuizScreens = React.lazy(() =>
  import('./components/QuizScreens').then((m) => ({ default: m.QuizScreens })),
);
/*
 * ★まとめプリント画面だけは「開いたときに読む」（遅延読み込み）★
 *
 * ■ なぜこの画面から始めたか（実測にもとづく）
 *
 * この画面が使う data/learningContent は、まとめプリントの HTML 文字列で
 * 実測 710,921 バイト / 16 ファイル。しかも
 * ★LearningViewer 以外の誰も読んでいない完全に独立した塊★ である。
 * つまり切り離しても他の画面に影響が出ない。
 *
 * ■ 「チャンクを分けるだけ」では 1 バイトも減らないことを実験で確認済み
 *
 * 先に vite.config.ts の manualChunks で learningContent を
 * 別チャンク（data-learning）に分ける実験をした。結果:
 *
 *   data 3,041.75 → 2,367.58 kB、data-learning 674.06 kB（循環 0 で成功）
 *   しかし起動時に必ず落ちる JS は 5,253,265 → 5,253,186 B（−79 B のみ）
 *   遅延で落ちる JS は 0 B のまま
 *
 * ここが静的 import のままだと、チャンクを分けても両方ダウンロードされる。
 * ★分割は削減ではない。静的 import を切ることが先。★
 * この実験は取り消し、こちらの順序に変えた。
 *
 * ■ 表示は変えていない
 *
 * 元のコードは
 *     {appState === 'learning' && <LearningViewer … />}
 * で、画面が「学習」に切り替わった瞬間に描画される形だった。
 * lazy にしても JSX の書き方・渡す props・表示内容は同じ。
 * 違いは「その JS を読み終わるまでのわずかな間」だけで、
 * その間は下の Suspense fallback（何も描かない）になる。
 *
 * fallback をあえて空にしているのは、
 * ローディング表示という★新しい UI を足さない★ため。
 * 読み込み中に一瞬何かが出て消えるほうが、表示の変化としては大きい。
 */
const LearningViewer = React.lazy(() =>
  import('./components/LearningViewer').then((m) => ({ default: m.LearningViewer })),
);
import { Leaderboard } from './components/Leaderboard';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { Intro } from './components/Intro';
import { LogicalTree } from './components/LogicalTree';
import { NoteDetail } from './components/NoteDetail';
import { StudyHub, type StudyHubView } from './components/StudyHub';
import { ScreenLoading, ScreenUnavailable } from './components/ScreenStatus';
import { studyEntry, isLearningScreen, safeStudyResume } from './utils/studyNavigation';
import { addStudySeconds } from './utils/studyTime';
import { setFormatMathContext } from './utils/textFormatter';
import { resolveReviewTarget } from './utils/reviewTarget';
import { Onboarding } from './components/Onboarding';
import { MockExam } from './components/MockExam';
import { SubjectSelection, getSubjectLabel, isSubjectId, type SubjectId } from './components/SubjectSelection';
/*
 * 本体に教科データを持たない教科（高校入試 理科など）の登録簿。
 * ★何も import しない葉ファイルなので、ここから読んでも問題データは付いてこない★
 * （tests/subjectLabels.test.ts が「葉であること」を機械で見張っている）
 */
import { isExternalSubject } from './data/externalSubjects';
/*
 * ★分野選択画面（化学・発展）も「開いたときに読む」（遅延読み込み）★
 *
 * ■ 見落としていた4本目の線（新しく足した検査が見つけた）
 *
 * 上の3本を切ったあと、起動時の重さを見張る検査
 * （tests/screenDataWeight.test.ts）を「教科データの玄関に
 * 到達していないこと」に書き換えたところ、こう落ちた:
 *
 *   ★起動時に src/data/chemistryAdvancedData.ts へ静的に到達している★
 *
 * 原因はこの画面である。分野を3つ並べるだけの軽い画面なのに
 *     import { ADVANCED_FIELDS, getAdvancedFieldStats } from '../data/chemistryAdvancedData'
 * と書かれていて、見出しの下に出す「章○／単元○／大問○」を数えるために
 * ★化学（発展）の問題データ本体（実測 90,658 B のチャンク）★を
 * 起動時に持ってきていた。
 *
 * ■ ここで大事なこと
 *
 * 自分では「3本で全部」と思っていたが、実際には4本目があった。
 * ★思い込みではなく検査が見つけた。★
 * だから検査を「上限を少し下げる」形ではなく
 * 「玄関に届いていないこと」という★構造の条件★に書き換えたのが正しかった。
 * 教科を増やしても条件が古くならない。
 *
 * ■ 数え上げを消していない（表示は変えない）
 *
 * 「章○／単元○／大問○」の表示はそのまま残している。
 * 画面ごと遅延にしただけなので、出る数字も文言も同じ。
 * fallback は null＝何も描かない。
 * この画面へは「学習を始める → 化学 → モード選択」と進んだ先で入るので、
 * モード選択にいる間に先読みしている（下の「先読み」の useEffect を参照）。
 */
const AdvancedFieldSelection = React.lazy(() =>
  import('./components/AdvancedFieldSelection').then((m) => ({
    default: m.AdvancedFieldSelection,
  })),
);
/**
 * 高校入試 理科の入口（演習・まとめ・出題傾向）。
 *
 * ★必ず遅延読み込みにする★
 * 理科のデータは合計で約900KB あり、本体の教科データとは別物。
 * 静かに静的 import すると、理科を使わない生徒の起動時にも
 * この900KBが読み込まれることになる。
 * RikaHome の中で3画面をさらに分けているので、
 * 実際に読まれるのは「開いたタブの分だけ」になる。
 */
const RikaHome = React.lazy(() => import('./features/rika/RikaHome'));
/*
 * 理科の入口で「最初に開くタブ」を指定するための型だけを読む。
 * ★import type なので、この行では実際のコードは1バイトも読み込まれない★
 * （型は組み立てのときに消える。遅延読み込みの効き目は保たれる）
 */
import type { RikaTab } from './features/rika/RikaHome';
// 分野（理論／無機／有機）の表示情報だけを持つ葉ファイルから読む。
// ここで使うのは「保存値が正しい分野IDかの確認」と「見出しに出す分野名」だけで、
// 化学（発展）の問題データは1問も要らない。
// （以前は ./data/chemistryAdvancedData から読んでいたため、
//   この2つを使うだけで問題データ本体まで読み込み対象になっていた）
import { ADVANCED_FIELDS, type AdvancedFieldId } from './data/advancedFields';
import { readJsonArray } from './utils/safeLocalStorage';
/*
  公開/非公開の判断は src/config/features.ts が唯一の出どころ。

  ★このファイルが担当するのは「4箇所」のうちの
    1番目（ナビ）と 3番目（ルーティング）である。★

  3番目が一番大事で、一番忘れやすい。
  ナビとカードから消しても、
    ・localStorage に残った「前回選んだ科目」が復元される
    ・別の画面の戻り先として指定されている
  といった経路で、非公開の科目へ入れてしまうことがある。
  ★見えないのに入れてしまう状態は、見えているより悪い。★
  だから入口ではなく「受け口」でも必ず判定する。
*/
import { isSubjectEnabled, fallbackSubjectId, FEATURES } from './config/features';
/*
  BGM を ON にしていても一定時間で自然に消えるようにする計算。
  「経過ミリ秒 → 音量」の対応だけを別ファイルの純粋関数に置いてある
  （ブラウザを開かずに機械検査できるようにするため）。
*/
import { appBgmVolume, isBgmFadeComplete, BGM_FADE_END_MS } from './utils/bgmFade';
import { writeAudioPreferences, readAudioPreferences } from './battle/audio/audioPreferences';
import { setTitleBgmVolume, unlockTitleBgm } from './battle/audio/titleMediaAudio';
/*
 * ★chemistryData（1,253,813 B）の静的 import はここから外した★
 *
 * 使っていたのは handleReviewNote ひとつだけで、
 * それは「学習ノートの項目をタップしたとき」に走るイベントハンドラだった。
 * 描画中には呼ばれないので、その場で await import() して読む形にした。
 * 詳しい理由は handleReviewNote 内のコメントに書いている。
 */
/*
 * ★findChapterById（allChapters 2,703,107 B）の静的 import もここから外した★
 *
 * 使っていたのは演習画面・結果画面に渡す章の解決だけで、
 * その処理ごと components/QuizScreens.tsx（遅延読み込みされる側）へ移した。
 * 全教科から章IDで引く処理そのものは今も data/allChapters.ts に集約している。
 */
import { useGlobalClickSound } from './hooks/useGlobalClickSound';
import { useIdleReset } from './hooks/useIdleReset';
import { useIsMobile } from './hooks/useMediaQuery';
import { MobileViewWrapper } from './components/MobileViewWrapper';
import { countIncomingFriendRequests } from './utils/friends';
import { applyOverviewViewport } from './utils/viewportControl';
/*
 * ErrorBoundary の import もここから外した。
 * 演習画面・結果画面を包んでいたのが唯一の用途で、
 * その包み込みごと components/QuizScreens.tsx へ移したため。
 * ★包む対象・ラベル・onReset の中身は変えていない★
 * （「演習画面」「結果・解説画面」というラベルもそのまま持っていった）。
 */
import { flushFeedbackQueue, getFeedbackWebhookUrl } from './utils/feedback';
import { recordUserPresence } from './utils/userRegistry';
import { ensureRankingEntry } from './utils/leaderboard';
import { parseStoredStringRecord, countSolvedProblemsIn } from './utils/progress';
import { getChapterIndexOfSubject as getUnitIndexOf } from './data/chapterIndex.generated';
// ユーザーごとの localStorage キー名は utils/userStorageKeys.ts が唯一の定義
import { profileKey, completedKey } from './utils/userStorageKeys';
// 章 × モードごとの保存キー名は utils/quizStorageKeys.ts が唯一の定義
import {
  quizAnswersKey,
  quizRunKey,
  quizExplKey,
  quizIndexKey,
  quizStepKey,
} from './utils/quizStorageKeys';
import { pullStudyData, installStudySyncFlush, resetStudySyncState } from './utils/studySync';
import { TeacherDashboard } from './components/TeacherDashboard';
import { FeedbackAdminPanel } from './components/FeedbackAdminPanel';
import { battleAudio } from './battle/audio/battleAudio';
import { installFriendPresence } from './utils/friendPresence';
import { BattleMode } from './battle/ui/BattleMode';
import type { GrowthPage } from './components/GrowthHub';
import './styles/world.css';
const GrowthHub = React.lazy(() => import('./components/GrowthHub').then(m => ({ default: m.GrowthHub })));
const MissionToast = React.lazy(() => import('./components/MissionToast').then(m => ({ default: m.MissionToast })));

export type AppState = 'home' | 'mode_selection' | 'chapters' | 'quiz' | 'explanation' | 'learning' | 'intro' | 'study_hub' | 'note_detail' | 'onboarding' | 'logical_tree' | 'settings' | 'leaderboard' | 'mock_exam' | 'subject_selection' | 'advanced_fields' | 'teacher_dashboard' | 'feedback_admin' | 'battle' | 'rika' | 'growth' | 'foundation' | 'study';
export type AppMode = 'mini_test' | 'practice' | 'learning';

const APP_STATES = new Set<AppState>([
  'home', 'mode_selection', 'chapters', 'quiz', 'explanation', 'learning', 'intro',
  /*
   * 'flowchart' は以前ここにあったが、描画する画面が無く
   * 保存値から復元されると下部ナビしか出ない空白画面になっていた。
   * isAppState が false を返すので、古い保存値はオンボーディングへ倒れる。
   */
  'study_hub', 'note_detail', 'onboarding', 'logical_tree', 'settings',
  'leaderboard', 'mock_exam', 'subject_selection', 'advanced_fields', 'teacher_dashboard',
  'feedback_admin', 'battle', 'growth',
  /** 英文法・英単語を固める（単語・熟語／聞き取りの文法／その他）。下のナビを残す1画面のページ。 */
  'foundation',
  'study',
  /**
   * 高校入試 理科の入口（演習・まとめ・出題傾向の3画面）。
   *
   * ★本体の教科の流れ（教科→学び方→単元→解く）に乗せていない★
   * 理科は本体の「章・大問・小問」の形を持たず、単元の絞り込みも
   * 問題の出し方も理科側の画面が自分で持っているため、
   * 独立した1画面として置いている（詳しくは RikaHome.tsx）。
   */
  'rika',
]);
const APP_MODES = new Set<AppMode>(['mini_test', 'practice', 'learning']);

export function isAppState(value: unknown): value is AppState {
  return typeof value === 'string' && !['logical_tree', 'mock_exam', 'learning', 'advanced_fields', 'rika'].includes(value) && APP_STATES.has(value as AppState);
}

export function isAppMode(value: unknown): value is AppMode {
  return typeof value === 'string' && APP_MODES.has(value as AppMode);
}

/** 科目選択の保存キー（次回起動時に前回の科目を復元する） */
const SELECTED_SUBJECT_KEY = 'savedSelectedSubject';
/**
 * BGM を ON にしたかどうかの保存先。
 * 値は 'on' / 'off' の2種類だけ。
 * ★キーを未設定のままにしておくことに意味がある★
 *   未設定＝「まだ選んでいない」なので、
 *   FEATURES.bgm の既定値（OFF）に従う。
 *   0/1 や true/false を初期値として書き込んでしまうと、
 *   あとで既定値を変えても既存ユーザーに届かなくなる。
 */
const BGM_ENABLED_KEY = 'bgm_enabled';

/**
 * 通常 BGM を止める画面。
 *   quiz / explanation … 従来どおり（問題を読む場面では音を止める）
 *   battle             … ★臨場感アップデートで追加★
 *     対戦中は専用の BGM・効果音（src/battle/audio）が鳴るので、
 *     通常 BGM と重なると濁る。対戦モードの間だけ通常 BGM を止め、
 *     戻ってきたら従来どおり再開する（フェードの計測も止まる）。
 */
const BGM_SILENT_STATES: readonly string[] = ['quiz', 'explanation', 'battle', 'study_hub', 'note_list', 'note_detail'];
/** 化学（発展）で最後に選んだ分野の保存キー */
const SELECTED_FIELD_KEY = 'savedSelectedAdvancedField';

/**
 * 無操作でホーム画面に戻るまでの時間（30分）。
 * 問題を read しながら考え込む時間を邪魔しない程度に長く取り、
 * かつ放置された端末が学習画面のまま残らない長さにしている。
 */
const IDLE_RESET_MS = 30 * 60 * 1000;

export default function App() {
  const [hasEntered, setHasEntered] = useState(false);
  useGlobalClickSound();
  useEffect(() => installFriendPresence(), []);
  useEffect(() => {
    const unlock = () => battleAudio().unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
  }, []);

  const [appState, setAppState] = useState<AppState>(() => {
    const saved = localStorage.getItem('savedAppState');
    return isAppState(saved) ? saved : 'onboarding';
  });
  const [appMode, setAppMode] = useState<AppMode>(() => {
    const saved = localStorage.getItem('savedAppMode');
    return isAppMode(saved) ? saved : 'practice';
  });
  /**
   * 理科の入口で最初に開くタブ（演習／まとめ／出題傾向）。
   *
   * ★localStorage に保存しない★
   *   本体の appState / appMode は「閉じた場所から続けられる」ように保存しているが、
   *   理科のタブは3つ並んでいて指1本で切り替えられる。
   *   保存すると「対戦の結果から演習を開いた次にホームから開いたとき、
   *   なぜか演習が開いている」という、押した覚えのない状態が残る。
   *   ここは毎回まっさらな 'practice' から始める。
   */
  const [rikaTab, setRikaTab] = useState<RikaTab>('practice');
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(() => localStorage.getItem('savedSelectedChapterId'));
  /**
   * 「今回はこの範囲だけを解く」ときの範囲（両端を含む・章内の通し番号）。
   *
   * ■ 何のために持つのか（ご要望）
   *   英語リスニングは「第1問A のページ → 第1回演習〜第14回演習のボタン」の形にした。
   *   ボタンで1回を選んだら、その1回だけを解き、その1回だけを振り返れるようにする。
   *   （これまでは14回分がひと続きで、途中でやめると中途半端な位置に取り残されていた）
   *
   * ■ 章IDを分けずに範囲で表す理由
   *   回ごとに章IDを作ると、保存キーや進捗台帳・ランキングの宛先が変わって
   *   これまでの学習記録が迷子になる。章IDは据え置き、範囲だけを別に持つ。
   *
   * ■ localStorage に載せている理由
   *   演習中にアプリを閉じて開き直したとき、範囲を忘れていると
   *   「第3回だけのはずが章の最後まで続く」ことになり、
   *   選んだはずの回と実際に解く範囲が食い違ってしまう。
   */
  const [quizRange, setQuizRange] = useState<{ startIndex: number; endIndex: number } | null>(() => {
    try {
      const raw = localStorage.getItem('savedQuizRange');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        Number.isSafeInteger(parsed.startIndex) && parsed.startIndex >= 0 &&
        Number.isSafeInteger(parsed.endIndex) && parsed.endIndex >= parsed.startIndex
      ) return { startIndex: parsed.startIndex, endIndex: parsed.endIndex };
      return null;
    } catch {
      return null;
    }
  });
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [studyHubView, setStudyHubView] = useState<StudyHubView>({ tab: 'today', subjectTab: 'all' });
  const [chapterGroups, setChapterGroups] = useState<Record<string, string>>({});
  const [battleReturnActive, setBattleReturnActive] = useState(false);
  const [battleActive, setBattleActive] = useState(false);
  const [growthPage, setGrowthPage] = useState<GrowthPage>('overview');
  const [rikaBattleTarget, setRikaBattleTarget] = useState<{ chapterId: string; questionId?: string } | null>(null);
  const battleScrollRef = useRef<HTMLDivElement | null>(null);
  const savedBattleScroll = useRef(0);
  const restoreBattleScroll = useRef(false);
  useEffect(() => {
    if (appState !== 'battle' || !restoreBattleScroll.current) return;
    const frame = requestAnimationFrame(() => {
      if (battleScrollRef.current) battleScrollRef.current.scrollTop = savedBattleScroll.current;
      restoreBattleScroll.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [appState]);
  useEffect(() => {
    if (!['battle', 'quiz', 'explanation', 'rika'].includes(appState)) setBattleReturnActive(false);
  }, [appState]);
  useEffect(() => {
    let owner = auth.currentUser?.uid || 'guest';
    return onAuthStateChanged(auth, user => {
      const next = user?.uid || 'guest';
      if (next !== owner) { setBattleReturnActive(false); setRikaBattleTarget(null); }
      owner = next;
    });
  }, []);
  const returnToBattle = () => {
    restoreBattleScroll.current = true;
    setBattleReturnActive(false);
    setAppState('battle');
  };
  const navigateMain = (next: AppState) => {
    if (appState === 'battle' && next !== 'battle' && battleActive &&
      !window.confirm('進行中の対戦・待機を終了して移動しますか？オンライン対戦では途中退出扱いになります。')) return;
    if (next === 'settings') setPrevAppState(appState === 'battle' && battleActive ? 'home' : appState);
    setBattleReturnActive(false);
    setRikaBattleTarget(null);
    setAppState(next);
  };
  /**
   * ★学習時間（設定のプロフィールカード）★ utils/studyTime.ts
   * 演習・解説の画面を開いていて、タブが前面にある間だけ30秒ごとに足す。
   */
  useEffect(() => {
    if (appState !== 'quiz' && appState !== 'explanation') return;
    let last = Date.now();
    const tick = () => {
      const now = Date.now();
      if (document.visibilityState === 'visible') {
        const d = new Date(now);
        const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        addStudySeconds(auth.currentUser?.uid || 'guest', (now - last) / 1000, day);
      }
      last = now;
    };
    const id = window.setInterval(tick, 30000);
    return () => { window.clearInterval(id); tick(); };
  }, [appState]);
  const reviewRequest = useRef(0);
  const reviewBusy = useRef(false);
  useEffect(() => { reviewRequest.current += 1; reviewBusy.current = false; }, [appState]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>(() =>
    parseStoredStringRecord(localStorage.getItem('savedQuizAnswers')),
  );
  // スマホ端末では常にスマホ向けレイアウトで表示するため、PC/スマホ切り替えは廃止。
  // 既存の判定ロジック（shouldForceDesktopUI / isMobileExplanation）との互換のため定数 false を保持する。
  const forceDesktop = false;
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  // ユーザーエージェントによるモバイル端末判定（初回のみ・不変）。
  // 画面幅の判定は共有フック useIsMobile に一元化する（C2）。
  const isMobileUserAgent = useRef(
    typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent)
  ).current;
  const isNarrowViewport = useIsMobile();
  // 「モバイル端末」= UA がモバイル or 画面幅が md 未満。
  const isMobileDevice = isMobileUserAgent || isNarrowViewport;
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem('savedIsGuest') === 'true');
  // 選択中の科目。ログイン直後の科目選択画面（＝タイトル画面）で決まる。
  // 保存値が今の科目一覧に無い（＝古い/壊れた値）場合は化学基礎に戻す。
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>(() => {
    const saved = localStorage.getItem(SELECTED_SUBJECT_KEY);
    /*
      ★ここがルーティング側の門（4箇所のうちの3番目）★

      保存値の検査を2段にしている。
        1. isSubjectId  … そもそも科目IDとして成立しているか（従来どおり）
        2. isSubjectEnabled … いま公開している科目か（今回追加）

      2 が無いと、「数学を選んだまま非公開にした」ユーザーが
      次に開いたときに数学の画面へ復元されてしまう。
      カードを消しても、この経路が残っていれば意味がない。

      戻す先は fallbackSubjectId が公開中のものから選ぶ。
      「必ず化学基礎」と書かないのは、将来化学基礎を非公開にした日に
      非公開の科目へ倒す処理になってしまうからである。
      公開中の科目が1つも無い場合だけ 'chemistry_basic' を使う
      （その状態はアプリとして成立していないので、
        画面が真っ白になるのを避けるための最後の受け皿）。
    */
    if (isSubjectId(saved) && isSubjectEnabled(saved)) return saved;
    const fallback = fallbackSubjectId(
      ['chemistry_basic', 'chemistry', 'english_listening', 'english_grammar', 'biology_basic', 'geography'],
    );
    return (fallback as SubjectId) ?? 'english_listening';
  });
  // 化学（発展）で選択中の分野（理論／無機／有機）。
  // 保存値が壊れていても安全に理論化学へ倒す。
  const [selectedField, setSelectedField] = useState<AdvancedFieldId>(() => {
    const saved = localStorage.getItem(SELECTED_FIELD_KEY);
    return ADVANCED_FIELDS.some(f => f.id === saved) ? (saved as AdvancedFieldId) : 'theoretical';
  });
  const [isExplanationView, setIsExplanationView] = useState(false);
  const [prevAppState, setPrevAppState] = useState<AppState>('home');
  const [subjectPickerReturnTo, setSubjectPickerReturnTo] = useState<AppState>('home');
  /** 固めるページで開いているタブ（ページを離れても戻ったときに同じタブを開く） */
  const [foundationTab, setFoundationTab] = useState<'words' | 'quiz' | 'grammar' | 'more'>('words');
  const [foundationBackTo, setFoundationBackTo] = useState<'home' | 'study'>('home');
  // 演習する（科目→コンテンツ）。選んだ科目・前回のコンテンツは端末に覚えておく
  const [studyCatalogSubject, setStudyCatalogSubject] = useState<string | null>(() => localStorage.getItem('study_catalog_subject_v1'));
  const [studyLastContent, setStudyLastContent] = useState<string | null>(() => localStorage.getItem('study_catalog_last_v1'));
  const [lastQuizResult, setLastQuizResult] = useState<any>(null);
  // 届いているフレンド申請件数（設定ボタンのバッジ表示用）
  const [pendingFriendRequests, setPendingFriendRequests] = useState(0);

  // フレンド申請件数を定期的に確認する（ログイン時のみ）。
  // 設定画面を閉じた直後にも再取得して、承諾/拒否の結果をバッジに反映する。
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      if (!auth.currentUser) {
        if (!cancelled) setPendingFriendRequests(0);
        return;
      }
      const n = await countIncomingFriendRequests();
      if (!cancelled) setPendingFriendRequests(n);
    };
    refresh();
    // 画面が見えていないときは読みに行かない（裏で開きっぱなしのタブが読み取りを使い続けないように）
    const id = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 60000);
    const unsub = onAuthStateChanged(auth, () => refresh());
    return () => { cancelled = true; window.clearInterval(id); unsub(); };
  }, [appState]);

  // 送信に失敗して端末に溜まっているフィードバックを、起動時とオンライン復帰時に自動再送する。
  // （電波の悪い教室や機内モードで書いた意見を取りこぼさないための保険）
  useEffect(() => {
    const flush = () => { void flushFeedbackQueue().catch(() => {}); };
    const timer = window.setTimeout(flush, 2500);
    window.addEventListener('online', flush);
    return () => { window.clearTimeout(timer); window.removeEventListener('online', flush); };
  }, []);

  // 利用状況（総ユーザー数・登録 Google アカウント）を記録する。
  // ログイン状態が確定してから送りたいので onAuthStateChanged に乗せる。
  // 送りすぎないよう、初回と「前回から24時間以上あいたとき」だけ記録される
  // （判定は userRegistry 側が行う）。失敗してもアプリは止めない。
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => {
      window.setTimeout(() => {
        void recordUserPresence(getFeedbackWebhookUrl()).catch(() => {});
      }, 4000);
    });
    return unsub;
  }, []);

  // ランキングへの参加登録（ご要望：0pt のユーザーも掲載する）
  // ─────────────────────────────────────────────
  // これまで leaderboard_total の枠は「初めてスコアを更新したとき」に
  // しか作られず、連携したばかりの人はランキングに存在しなかった。
  // Google 連携が確定した時点で totalScore: 0 の枠を作り、
  // 「連携済みなら必ず載る」状態にする。
  // 既にスコアがある人は名前とアイコンの更新だけが走る（スコアは触らない）。
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) return; // ゲストは掲載対象外
      window.setTimeout(() => {
        void ensureRankingEntry().catch(() => {});
      }, 3000);
    });
    return unsub;
  }, []);

  // ============================================================
  // 学習進捗・復習リストのクラウド同期
  // ============================================================
  // これまで進捗は端末の localStorage だけにあり、
  // 機種変更やキャッシュ削除で全部消えていた。
  // ログインしている場合はクラウドと**マージ**して引き継ぐ。
  //
  // ・上書きではなくマージなので、オフラインで解いた分も残る
  // ・失敗しても学習は止めない（次回起動で再試行）
  // ・ゲストは同期しない（他人の記録と混ざらないようにする）
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // ログアウトしたら同期状態を捨てる（別アカウントと混ざらないように）
        resetStudySyncState();
        return;
      }
      // ログイン直後は他の初期化処理と競合しやすいので少し待つ
      window.setTimeout(() => {
        void pullStudyData().then((result) => {
          if (result.addedProblems > 0 || result.addedReviews > 0) {
            console.info(
              `[studySync] クラウドから引き継ぎました: 進捗 +${result.addedProblems} / 復習 +${result.addedReviews}`,
            );
          }
        });
      }, 1500);
    });
    return unsub;
  }, []);

  // 画面を離れるとき（スマホでアプリを切り替えたときを含む）に
  // 未送信の学習データを送る。iOS Safari は beforeunload が
  // 発火しないことがあるため pagehide / visibilitychange を使う。
  useEffect(() => installStudySyncFlush(), []);

  // Prevent iOS pinch zoom and double tap zoom, EXCEPT on the answers/explanations pages
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (appState === 'explanation' || isExplanationView || (e.target instanceof Element && e.target.closest('input, select, button, a'))) {
        return; // Native controls must retain their touch behavior.
      }
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      if (appState === 'explanation' || isExplanationView || (e.target instanceof Element && e.target.closest('input, select, button, a'))) {
        return; // Native controls must retain their touch behavior.
      }
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [appState, isExplanationView]);

  const [lastLearnState, setLastLearnState] = useState<AppState>(() => {
    const saved = localStorage.getItem('savedLastLearnState');
    return isAppState(saved) && isLearningScreen(saved) ? saved : 'study';
  });

  useEffect(() => { localStorage.setItem('savedAppState', appState); }, [appState]);
  useEffect(() => { localStorage.setItem('savedAppMode', appMode); }, [appMode]);
  useEffect(() => {
    if (selectedChapterId) {
      localStorage.setItem('savedSelectedChapterId', selectedChapterId);
    } else {
      localStorage.removeItem('savedSelectedChapterId');
    }
  }, [selectedChapterId]);
  useEffect(() => {
    if (quizRange) {
      localStorage.setItem('savedQuizRange', JSON.stringify(quizRange));
    } else {
      localStorage.removeItem('savedQuizRange');
    }
  }, [quizRange]);
  useEffect(() => { localStorage.setItem('savedQuizAnswers', JSON.stringify(quizAnswers)); }, [quizAnswers]);
  useEffect(() => { localStorage.setItem('savedIsGuest', isGuest.toString()); }, [isGuest]);
  useEffect(() => { localStorage.setItem(SELECTED_SUBJECT_KEY, selectedSubject); }, [selectedSubject]);
  useEffect(() => { localStorage.setItem(SELECTED_FIELD_KEY, selectedField); }, [selectedField]);
  
  useEffect(() => {
    if (isLearningScreen(appState)) {
      setLastLearnState(appState);
      localStorage.setItem('savedLastLearnState', appState);
    }
  }, [appState]);

  // 画面遷移時に常に最上部へスクロール（前画面のスクロール位置を引き継がない）
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [appState]);

  /*
   * ★「先読み」＝次に行く画面を、まだ表示していないうちに裏で読み始める★
   *
   * ■ なぜ必要なのか（これが無いと見え方が変わってしまう）
   *
   * 単元選択・演習・解説の3画面は遅延読み込みにした。
   * 遅延読み込みは「その画面に入った瞬間に読み始める」ので、
   * 何もしないと通信が遅い端末で★画面に入った直後に何も出ない時間★ができる。
   * 元のアプリには無かった見え方であり、これは避けなければならない。
   *
   * そこで「まだその画面に入っていないが、次に行く可能性が高い」段階で
   * 裏側で読み込みを始めておく。ユーザーがモードを選んでいる数秒間や
   * 単元を選んでいる数秒間が、そのまま読み込み時間になる。
   *
   * ■ なぜ起動時（ホーム）には先読みしないのか
   *
   * ホームで先読みしてしまうと、結局起動と同時に問題データを取りに行くことになり、
   * ★遅延読み込みにした意味が消える。★
   * 「学習を始める」を押してモード選択に入った時点＝
   * 「この人は問題を解く気がある」と分かった時点から読み始める。
   *
   * ■ 正直な注意
   *
   * これは「必ず間に合う」保証ではない。回線が極端に遅ければ待ちは残る。
   * ただし「入った瞬間から読み始める」よりは確実に早く、
   * 起動時に全部持ってくるよりは確実に軽い。
   *
   * catch は空にしている。先読みは失敗しても実害が無く
   * （本番でその画面に入ったときに改めて読み込みが走る）、
   * ここでエラー表示を出すと「まだ見てもいない画面のエラー」を
   * 見せることになってしまうため。
   */
  useEffect(() => {
    // モード選択・分野選択にいる ＝ 次は単元選択の可能性が高い
    if (appState === 'mode_selection' || appState === 'advanced_fields') {
      import('./components/ChapterSelection').catch(() => {});
    }
    // モード選択にいる ＝ 化学（発展）なら次は分野選択
    if (appState === 'mode_selection') {
      import('./components/AdvancedFieldSelection').catch(() => {});
    }
    // 単元選択にいる ＝ 次は演習画面の可能性が高い
    if (appState === 'chapters') {
      import('./components/QuizScreens').catch(() => {});
    }
  }, [appState]);

  const isFirstLoad = useRef(true);

  /**
   * 科目選択画面を「どこから開いたか」。科目を選んだあとの遷移先に使う。
   *
   *  - 'start'  … ホームの「学習を始める」から。科目を選んだら
   *               そのまま学習モード選択へ進む（もう一度ボタンを押させない）。
   *  - 'change' … ホームの「科目を変更」から。科目を選んだらホームへ戻る。
   *
   * 科目選択は必ずホームから開くので、'onboarding' は廃止した。
   * （以前はログイン直後にも科目選択を挟んでいたため、科目選択が2回出ていた）
   *
   * ref ではなく state にしている理由：
   *   この値は描画（遷移先の分岐）に使うため。ref はレンダリングを
   *   起こさないので、ホーム→科目選択の遷移と同時に更新しても
   *   1テンポ遅れて反映され、事故になりやすい。
   */
  const [subjectPickerOrigin, setSubjectPickerOrigin] =
    useState<'start' | 'change'>('start');

  // 【スマホ解答解説：俯瞰UIの廃止 → スマホ専用レイアウトへ】
  // 以前は解答解説ページだけスマホでも PC 版レイアウト（width=1024 を縮小した
  // 俯瞰UI）を強制していたが、「解答と解説の文字が小さい。問題のところと同じ
  // ぐらいの文字の大きさにしたい」というご指摘のとおり、初期表示の文字が
  // 物理的に極小（実質6px程度）になっていた。
  // そこで俯瞰UIをやめ、スマホでは解答解説もスマホ専用レイアウト
  // （正誤一覧 → タップでその問の解説を開く。Explanation.tsx 側で実装）で表示する。
  // PC のレイアウトは一切変えない。
  const shouldForceDesktopUI = forceDesktop;
  const isMobileView = ((isMobileDevice && !shouldForceDesktopUI) || isMobilePreview) && !shouldForceDesktopUI;

  // PC版では「学習モードを選択」(mode_selection) 以外の全画面で外側余白をなくし、
  // ノート風背景を全幅に広げる。mode_selection だけは従来通り中央寄せ＋余白を維持。
  // 数学の演習・解説・まとめを開いている間だけ、数式を数学の規則で組む（書体の混在を防ぐ）。
  setFormatMathContext(selectedSubject === 'math' && ['quiz', 'explanation', 'learning', 'mock_exam'].includes(appState));
  const isFullBleed = appState !== 'mode_selection';

  /**
   * 科目を選び終えたときの遷移先。
   *  - ホームの「学習を始める」から来た場合 … そのまま学習モード選択へ進む
   *    （ホームに戻してしまうと、もう一度ボタンを押させることになる）
   *  - 「科目を変更」から来た場合 … ホーム（ダッシュボード）へ
   */
  /**
   * 単元一覧の「戻る」の行き先。固めるページから英文法の演習に入ったときは固めるページへ戻す
   * （ホームへ飛ばすと、どこから来たのか分からなくなる）。
   */
  const [chaptersBackTo, setChaptersBackTo] = useState<'home' | 'foundation' | 'study'>('home');
  /** 科目を切り替えて、その科目の単元一覧を開く（固めるページから使う） */
  const openSubjectUnits = (subject: SubjectId, from: 'home' | 'foundation' | 'study') => {
    if (!isSubjectEnabled(subject)) return;
    if (subject !== selectedSubject) {
      setSelectedChapterId(null);
      setQuizRange(null);
      setLastQuizResult(null);
      setLastLearnState('chapters');
      localStorage.setItem('savedLastLearnState', 'chapters');
    }
    setSelectedSubject(subject);
    setAppMode('practice');
    setChaptersBackTo(from);
    setAppState('chapters');
  };

  /** 演習する（B2〜B6）：コンテンツを押したら既存の画面へ。科目ごとの分岐はここ1か所だけ（データの action で決まる） */
  const openStudyContent = (content: import('./data/studyCatalog').StudyContent) => {
    setStudyLastContent(content.id);
    localStorage.setItem('study_catalog_last_v1', content.id);
    if (content.action.kind === 'units') {
      if (isSubjectId(content.action.subject)) openSubjectUnits(content.action.subject, 'study');
      return;
    }
    setFoundationTab(content.action.kind === 'vocabQuiz' ? 'quiz' : content.action.tab);
    setFoundationBackTo('study');
    setAppState('foundation');
  };
  /** 演習するのカードに出す進捗（ホームの「学習状況」と同じ数え方：解いた大問 / 大問数） */
  const studyProgressOf = (subject: string) => {
    const chapters = getUnitIndexOf(subject);
    const total = chapters.reduce((sum, c) => sum + (c.problemCount || 0), 0);
    if (!total) return undefined;
    const uid = auth.currentUser?.uid || 'guest';
    return { solved: Math.min(countSolvedProblemsIn(uid, chapters.map(c => c.id)), total), total };
  };
  const setStudySubject = (id: string | null) => {
    setStudyCatalogSubject(id);
    if (id) localStorage.setItem('study_catalog_subject_v1', id); else localStorage.removeItem('study_catalog_subject_v1');
  };

  const handleSelectSubject = (subject: SubjectId) => {
    /*
      ★受け口でもう一度確かめる（4箇所のうちの3番目）★
      呼び出し側（科目カード）は非公開のカードを描いていないので、
      通常ここに非公開の科目は来ない。
      それでも確かめるのは、「呼ぶ側が正しいはず」に頼った作りは
      画面を1つ足したときに静かに破れるからである。
      入れてはいけない場所は、入口ではなく受け口で守る。
    */
    if (!isSubjectEnabled(subject)) return;
    const entry = studyEntry(subject);
    if (subject !== selectedSubject) {
      setSelectedChapterId(null);
      setQuizRange(null);
      setLastQuizResult(null);
      setLastLearnState(entry);
      localStorage.setItem('savedLastLearnState', entry);
    }
    setSelectedSubject(subject);
    setAppMode('practice');
    setAppState(subjectPickerOrigin === 'start' ? entry : 'home');
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const wasFirstLoad = isFirstLoad.current;
      isFirstLoad.current = false;

      if (!user) {
        if (!isGuest && !wasFirstLoad) {
          setAppState('onboarding');
        }
      } else {
        setIsGuest(false);
        try {
          // Firestoreの代わりにlocalStorageを使用
          const localProfile = localStorage.getItem(profileKey(user.uid));
          if (!localProfile) {
            setAppState('onboarding');
          } else if (!wasFirstLoad) {
            setAppState('home');
          }
        } catch (error) {
          console.error("Error in onAuthStateChanged:", error);
          setAppState('onboarding');
        }
      }
    });
    return unsubscribe;
  }, [isGuest]);
  
  // BGM state
  const audioRef = useRef<HTMLAudioElement>(null);
  const titlePauseTimer = useRef<number | null>(null);
  /*
    ===== BGM の初期状態について =====
    ★以前は常に ON（useState(true)）だった。これを OFF 既定に変える。★

    ■ なぜ OFF にするのか
      学習アプリで音が勝手に鳴り始めるのは、
        ・図書館・電車・自習室では実害になる
        ・イヤホンを繋いだ瞬間に大音量で鳴ることがある
        ・「まず音を止める」から始まる体験になる
      という問題がある。音楽を聴きながらやりたい人は
      自分の好きな曲を別に流しているので、
      ★アプリ側が鳴らす理由は元々弱い。★
      機能自体は消さず、設定画面のトグルからONにできる。

      既定値は src/config/features.ts の FEATURES.bgm で持つ。
      「どの機能を出すか」の判断を1か所に集めておくため
      （このファイルに true/false を直接書かない）。

    ■ 選択を覚える
      毎回OFFに戻ると、ONにしたい人には毎回操作が必要になる。
      localStorage に覚えるので、ONにした人は次回もON。
      ★保存値が無い人（＝新規・これまでのユーザー全員）は
        フラグの既定値に従うので、OFF から始まる。★

    ■ 保存値の読み方
      'on' / 'off' という文字で保存する（true/false の文字列より
      あとから3値目を足しやすく、読んで意味が分かる）。
      壊れた値・読めない場合は既定値に倒す。
      localStorage が使えない環境（プライベートモード等）で
      例外が飛んでも起動を止めないよう try で囲む。
  */
  const [isBgmEnabled, setIsBgmEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem(BGM_ENABLED_KEY);
      if (saved === 'on') return true;
      if (saved === 'off') return false;
    } catch {
      /* 読めない環境では既定値に従う */
    }
    // まだ選んでいない人は、対戦BGMの設定（既定ON）に合わせる＝BGMのスイッチは1つ（2026-10-01）
    try { return readAudioPreferences().bgm; } catch { return FEATURES.bgm; }
  });
  const [bgmVolume, setBgmVolume] = useState(() => readAudioPreferences().volume);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isAudioValid, setIsAudioValid] = useState(true);
  /*
    フェードが終わって音が消えた状態。
    ★これを画面に出さないと「ONなのに鳴っていない」＝故障に見える。★
    ヘッダーのボタンのラベルを「もう一度鳴らす」に変えるために使う。
  */
  const [isBgmFadedOut, setIsBgmFadedOut] = useState(false);
  const hasLoggedAudioError = useRef(false);

  /**
   * ★設定のスライダーの値を、再生開始・フェードの計算にも使う（A13）★
   * 以前はここが 0.1 固定で、500ms ごとのフェード計算が audio.volume を 0.1 に戻していたため、
   * スライダーを動かしても音量が変わらなかった。タイマーの中から最新の値を読むので ref で持つ。
   */
  const bgmVolumeRef = useRef(bgmVolume);
  bgmVolumeRef.current = bgmVolume;
  useEffect(() => {
    if (readAudioPreferences().volume !== bgmVolume) writeAudioPreferences({ volume: bgmVolume });
    battleAudio().setSettings({ ...readAudioPreferences(), volume: bgmVolume });
    if (audioRef.current) {
      setTitleBgmVolume(audioRef.current, appBgmVolume(bgmVolume, bgmElapsedMs()));
    }
  }, [bgmVolume]);

  // ON/OFF の選択を覚える（次回もその状態で始まる）。
  // localStorage が使えない環境でも起動を止めない。
  useEffect(() => {
    try {
      localStorage.setItem(BGM_ENABLED_KEY, isBgmEnabled ? 'on' : 'off');
    } catch {
      /* 保存できなくても今回のセッションでは効いているので続行する */
    }
    /*
      ★BGMのON/OFFは1つのボタンで全部（2026-10-01）★
      以前は対戦BGMが別スイッチ（battle_audio_settings.bgm・既定ON）で、
      ホームのBGMボタンを切っても対戦BGM（待ち時間・試合中）は鳴り続けていた。
      アプリBGMのON/OFFを対戦側の設定へそのまま写し、どの画面のボタンでも両方が切り替わるようにする。
    */
    if (readAudioPreferences().bgm !== isBgmEnabled) writeAudioPreferences({ bgm: isBgmEnabled });
  }, [isBgmEnabled]);
  // 逆向き：対戦ロビーのBGMボタン（対戦側の設定）で切り替えたら、アプリBGMも同じにする
  useEffect(() => {
    const sync = () => {
      const settings = readAudioPreferences();
      setIsBgmEnabled(prev => prev === settings.bgm ? prev : settings.bgm);
      setBgmVolume(prev => prev === settings.volume ? prev : settings.volume);
    };
    const onStorage = (event: StorageEvent) => { if (event.key === 'battle_audio_settings' || event.key === null) sync(); };
    window.addEventListener('storage', onStorage);
    window.addEventListener('battle-audio-settings', sync);
    return () => { window.removeEventListener('battle-audio-settings', sync); window.removeEventListener('storage', onStorage); };
  }, []);

  useEffect(() => {
    // BattleMode remains mounted while hidden to preserve matches. Its owners must
    // not leak music into home (double BGM) or listening practice (answer interference).
    if (appState === 'battle') return;
    const reviewing = ['study_hub', 'note_list', 'note_detail'].includes(appState);
    const token = Symbol('app-audio-policy');
    const engine = battleAudio();
    engine.setSettings({ ...readAudioPreferences(), bgm: isBgmEnabled });
    engine.setBgmOwner(token, reviewing ? 'matching' : null, 100);
    const resume = () => { if (reviewing && document.visibilityState !== 'hidden') engine.unlock(); };
    resume();
    window.addEventListener('pointerdown', resume);
    document.addEventListener('visibilitychange', resume);
    return () => { engine.releaseBgmOwner(token); window.removeEventListener('pointerdown', resume); document.removeEventListener('visibilitychange', resume); };
  }, [appState, isBgmEnabled]);

  const bgmStateRef = useRef({ isBgmEnabled, isAudioValid, appState });
  useEffect(() => {
    bgmStateRef.current = { isBgmEnabled, isAudioValid, appState };
  }, [isBgmEnabled, isAudioValid, appState]);

  /*
    ===== ONのままでも90秒で自然に消える（フェードアウト） =====

    ■ 何のためか
      ONにした人でも「鳴り続けてほしい」わけではない。
      始めた直後は気分が乗るが、問題文を読み始めると音は邪魔になる。
      止めたくなったときに設定画面まで戻るのは手間なので、
      ★放っておいても消える★ようにする。

    ■ 「鳴っていた時間」だけを数える
      単に「ONにした時刻から90秒」で数えると、
      演習中（quiz / explanation）は止まっているのに時間だけ進み、
      演習から戻ってきた瞬間にはもう消えている、という
      「一度も聞けていないのに終わっている」状態が起きる。
      そこで ★実際に鳴っていた時間を足し込む★ 方式にする。
        bgmPlayedMsRef  … これまで鳴っていた合計（一時停止中も保持）
        bgmPlaySinceRef … いま鳴り始めた時刻（止まっているときは null）

    ■ 音量の計算はこのファイルに書かない
      「経過ミリ秒 → 音量」の対応は utils/bgmFade.ts の純粋関数に置く。
      ここに書くと目視でしか確認できないが、
      切り出せばブラウザを開かずに機械検査できる。

    ■ 消えたあとは pause する
      音量0のまま再生を続けると、電池を削り、
      端末の「再生中の音楽」を占有し続けてしまう（他アプリの音楽が戻らない）。
  */
  const bgmPlayedMsRef = useRef(0);
  const bgmPlaySinceRef = useRef<number | null>(null);

  /** 現在までに「実際に鳴っていた」合計ミリ秒。 */
  const bgmElapsedMs = () => {
    const since = bgmPlaySinceRef.current;
    return bgmPlayedMsRef.current + (since === null ? 0 : Date.now() - since);
  };

  /** 再生時間の計測をやり直す（ONに入れ直したとき＝もう一度聞きたいとき）。 */
  const resetBgmFade = () => {
    bgmPlayedMsRef.current = 0;
    bgmPlaySinceRef.current = null;
  };

  /** 鳴り始めた／止まった、を計測に反映する。 */
  const markBgmPlaying = (playing: boolean) => {
    if (playing) {
      if (bgmPlaySinceRef.current === null) bgmPlaySinceRef.current = Date.now();
      return;
    }
    const since = bgmPlaySinceRef.current;
    if (since !== null) {
      bgmPlayedMsRef.current += Date.now() - since;
      bgmPlaySinceRef.current = null;
    }
  };

  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
      
      // Attempt to play immediately on interaction to satisfy strict browser policies
      const audio = audioRef.current;
      const { isBgmEnabled, isAudioValid, appState } = bgmStateRef.current;
      
      if (audio && isAudioValid && isBgmEnabled && !BGM_SILENT_STATES.includes(appState)) {
        unlockTitleBgm(audio, appBgmVolume(bgmVolumeRef.current));
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            if (e.name === 'NotSupportedError' || e.message?.includes('no supported sources')) {
              if (!hasLoggedAudioError.current) {
                hasLoggedAudioError.current = true;
                console.error('[BGM Error] Decode failed on interaction. Switching to silent mode.', e);
                console.warn('音源ファイルが読み込めないか、サポートされていない形式です。無音でアプリを続行します。');
              }
              setIsAudioValid(false);
            } else if (e.name === 'NotAllowedError') {
              console.warn('[BGM Info] Autoplay blocked by browser. Waiting for user interaction.', e);
            } else {
              console.error('[BGM Error] Unexpected playback error on interaction:', e);
            }
          });
        }
      }

      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      if (shouldForceDesktopUI) {
        // 解答解説画面：俯瞰UI。常に PC 版レイアウト（width=1024）で描画し、
        // 初期表示は全体が画面内に収まる縮小倍率（fit scale）にする。
        // 実装は viewportControl.applyOverviewViewport に一元化。
        // （ページ遷移毎のズームリセットは Explanation 側でも同関数を呼ぶ）
        applyOverviewViewport();
      } else {
        // モバイルへ戻る/遷移する際に、以前の desktop スケールが残って
        // 「異常にズームされた状態」で切り替わるのを防ぐため、一度スケールを
        // 明示的に 1.0 に固定してから通常のビューポートへ戻す（D対策）。
        // user-scalable は既定（許可）のままにしてアクセシビリティを確保する（C3）。
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0');
        // 次フレームで拡大許可を戻し、ユーザーによるピンチズームを再度可能にする。
        requestAnimationFrame(() => {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
        });
      }
    }
  }, [shouldForceDesktopUI, appState]);

  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const target = e.target as HTMLAudioElement;
    const error = target.error;
    
    if (!hasLoggedAudioError.current) {
      hasLoggedAudioError.current = true;
      console.error('[BGM Error] Failed to load or decode. Details:', {
        code: error?.code,
        message: error?.message,
        networkState: target.networkState,
        readyState: target.readyState,
        src: target.src
      });
      console.warn('音源ファイルが読み込めないか、ブラウザでサポートされていない形式です。無音でアプリを続行します。');
    }
    setIsAudioValid(false);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isAudioValid || hasLoggedAudioError.current) return;
    
    // Starting from the title mounts <audio>; a prior title tap may already have
    // set hasInteracted, so hasEntered must also trigger this effect.
    const shouldPlay = hasEntered && isBgmEnabled && hasInteracted && !BGM_SILENT_STATES.includes(appState);

    if (shouldPlay) {
      /*
        ★音量は設定のスライダーの値（bgmVolumeRef）にフェードの倍率をかけたもの★
        以前は 0.1 固定で、スライダーを動かしても再生開始やフェードの計算が
        0.1 に戻してしまい「音量が変わらない」状態だった（2026-09-30 修正）。
      */
      unlockTitleBgm(audio, appBgmVolume(bgmVolumeRef.current, bgmElapsedMs()));
      // すでにフェードが終わっている（＝90秒＋5秒鳴り終えた）なら鳴らさない。
      // 画面を移動しただけで音が復活しては「消えた」ことにならない。
      if (isBgmFadeComplete(bgmElapsedMs())) {
        markBgmPlaying(false);
        audio.pause();
        return;
      }
      markBgmPlaying(true);
      // 鳴っている最中に play() を重ねて呼ばない（画面遷移のたびに呼ぶとバッファが詰まり「ガガッ」と鳴る）
      if (titlePauseTimer.current) { window.clearTimeout(titlePauseTimer.current); titlePauseTimer.current = null; }
      if (!audio.paused) return;
      // Play might fail if user hasn't interacted with the document yet or if source is invalid
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          if (e.name === 'NotSupportedError' || e.message?.includes('no supported sources')) {
            if (!hasLoggedAudioError.current) {
              hasLoggedAudioError.current = true;
              console.error('[BGM Error] Decode failed (NotSupportedError). Switching to silent mode.', e);
              console.warn('音源ファイルが読み込めないか、サポートされていない形式です。無音でアプリを続行します。');
            }
            setIsAudioValid(false);
          } else if (e.name === 'NotAllowedError') {
            console.warn('[BGM Info] Autoplay blocked by browser. Waiting for user interaction.', e);
          } else {
            console.error('[BGM Error] Unexpected playback error:', e);
          }
        });
      }
    } else {
      // 止まる側でも計測を止める。演習中に進んだ時間を数えてしまうと
      // 「演習から戻ったらもう消えていた」状態になる。
      markBgmPlaying(false);
      // いきなり pause せず、音量を絞ってから止める（ブツッ・ガガッを防ぐ）。
      // 短い時間で戻ってきたら（演習→解説などの行き来）止めずに続ける。
      if (!audio.paused && !titlePauseTimer.current) {
        setTitleBgmVolume(audio, 0);
        titlePauseTimer.current = window.setTimeout(() => { titlePauseTimer.current = null; audio.pause(); }, 250);
      }
    }
  }, [appState, isBgmEnabled, hasInteracted, isAudioValid, hasEntered]);

  /*
    ===== フェードを実際に進める時計 =====
    音量の計算式（utils/bgmFade.ts）は「経過時間を渡せば音量が出る」形なので、
    誰かが定期的に呼んでやる必要がある。鳴っている間だけ 500ms ごとに呼ぶ。

    ★鳴っていないときは時計を作らない★（依存配列に isBgmEnabled 等を入れ、
    OFF・演習中・音源不正のときは setInterval を張らない）。
    常時タイマーを回すと、音を切っている人の電池まで削ることになる。
  */
  useEffect(() => {
    if (!isBgmEnabled || !isAudioValid || hasInteracted === false) return;
    if (BGM_SILENT_STATES.includes(appState)) return;

    const id = window.setInterval(() => {
      const audio = audioRef.current;
      if (!audio) return;
      const elapsed = bgmElapsedMs();
      setTitleBgmVolume(audio, appBgmVolume(bgmVolumeRef.current, elapsed));
      if (isBgmFadeComplete(elapsed)) {
        markBgmPlaying(false);
        audio.pause();
        // 「もう鳴らない」ことを画面にも伝える（ヘッダーのボタンの見た目が変わる）。
        setIsBgmFadedOut(true);
      }
    }, 500);

    return () => window.clearInterval(id);
  }, [isBgmEnabled, isAudioValid, hasInteracted, appState]);

  // iOS/Safari では audio.play() をユーザー操作（クリック/タップ）と同一の
  // コールスタック内で呼ばないと再生がブロックされる。
  // 設定画面のトグルでは React state 更新 → useEffect 再生では間に合わないため、
  // 操作ハンドラ内で直接 play/pause を実行する。
  const handleToggleBgm = (enabled: boolean) => {
    setIsBgmEnabled(enabled);
    setHasInteracted(true);
    /*
      ★ONに入れ直したら再生時間の計測をやり直す★
      「もう一度鳴らしたい」という操作なので、
      前回の90秒を引き継いだままだと押しても鳴らない
      （＝ボタンが壊れているように見える）。
      OFFにしたときも0に戻す。次にONにしたときが「始まり」だから。
    */
    resetBgmFade();
    setIsBgmFadedOut(false);
    const audio = audioRef.current;
    if (!audio) return;

    if (enabled) {
      if (!isAudioValid || hasLoggedAudioError.current) return;
      if (BGM_SILENT_STATES.includes(appState)) return;
      unlockTitleBgm(audio, appBgmVolume(bgmVolumeRef.current));
      markBgmPlaying(true);
      // iOS Safari 対策:
      // 音源がまだデコードされていない場合、ユーザー操作と同一スタックで
      // load() → play() を呼ぶことで再生ブロック/デコード失敗を回避しやすくなる。
      try {
        if (audio.readyState < 2) {
          audio.load();
        }
      } catch {
        /* load 失敗は play 側の catch で処理 */
      }
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          if (e.name === 'NotSupportedError' || e.message?.includes('no supported sources')) {
            if (!hasLoggedAudioError.current) {
              hasLoggedAudioError.current = true;
              console.error('[BGM Error] Decode failed on toggle. Switching to silent mode.', e);
            }
            setIsAudioValid(false);
          } else if (e.name === 'NotAllowedError') {
            console.warn('[BGM Info] Playback blocked by browser on toggle.', e);
          } else {
            console.error('[BGM Error] Unexpected playback error on toggle:', e);
          }
        });
      }
    } else {
      markBgmPlaying(false);
      audio.pause();
    }
  };

  /**
   * -----------------------------------------------------------------
   * 一定時間なにも操作されなかったらホーム画面へ戻す
   * -----------------------------------------------------------------
   * 端末を開いたまま放置されたとき、問題や解説の画面で止まったままに
   * せず、とびら君が話しているホームに戻す。
   *
   * 安全のための配慮：
   *  - すでにホームにいるときは何もしない（戻る先が同じ画面）。
   *  - ログイン前（オンボーディング）では作動させない。
   *    まだホームが無い状態で飛ばすと操作不能に見えるため。
   *    科目選択は必ずホームから開くので、こちらは対象に含める。
   *  - 解答の内容は Quiz 側が localStorage に保存しており、
   *    ここでは画面を移すだけなので書きかけの答えは失われない。
   *    （単元に入り直せば「続きから」再開できる）
   */
  const idleResetEnabled = appState !== 'home' && appState !== 'onboarding' && appState !== 'battle';

  useIdleReset({
    enabled: idleResetEnabled,
    timeoutMs: IDLE_RESET_MS,
    onIdle: () => setAppState('home'),
  });

  // 表示中の科目で開始する。科目の変更は本人が希望したときだけ行う。
  const handleStart = () => {
    setSubjectPickerOrigin('start');
    setAppMode('practice');
    setAppState(studyEntry(selectedSubject));
  };
  const handleChangeStudySubject = () => {
    setSubjectPickerReturnTo(appState);
    setSubjectPickerOrigin('start');
    setAppState('subject_selection');
  };
  const handleIntro = () => setAppState('intro');
  
  const handleSelectMode = (mode: AppMode) => {
    setAppMode(mode);
    if (mode === 'learning' && selectedSubject === 'english_listening') {
      setAppMode('practice'); setAppState('chapters'); return;
    }
    if (mode === 'learning') {
      setAppState('learning');
    } else if (selectedSubject === 'english_listening') {
      // 英語リスニングは分野選択を持たず、そのまま大問（単元）選択へ進む。
      setAppState('chapters');
    } else if (selectedSubject === 'chemistry') {
      // 分野は単元一覧内の切替で選ぶ。
      setAppState('chapters');
    } else {
      setAppState('chapters');
    }
  };

  const handleSelectChapter = (
    chapterId: string,
    questionIndex = 0,
    resume = false,
    /**
     * 「この範囲だけを1回として解く」ときの範囲（両端を含む）。
     * 英語リスニングの「第N回演習」ボタンから渡す。
     * 省略時は範囲なし＝章の全問を通しで解く（化学基礎・化学は従来のまま）。
     */
    range: { startIndex: number; endIndex: number } | null = null,
    targetMode: AppMode = appMode,
  ) => {
    setSelectedChapterId(chapterId);
    setQuizRange(range);
    setAppState('quiz');
    setLastQuizResult(null);

    if (!resume) {
      setQuizAnswers({});
      localStorage.removeItem(quizAnswersKey(chapterId, targetMode));
      localStorage.removeItem(quizRunKey(chapterId, targetMode));
      localStorage.removeItem(quizExplKey(chapterId, targetMode));
      localStorage.removeItem(quizStepKey(chapterId, targetMode));
      localStorage.setItem(quizIndexKey(chapterId, targetMode), questionIndex.toString());
    }
  };

  /**
   * ★対戦のリザルトから、その単元の演習へ移る（請求⑦-A）★
   *
   * -------------------------------------------------------------------
   * ■ これが「① 対戦 ⇒ ② 演習」の橋である
   * -------------------------------------------------------------------
   * 対戦は「表側＝楽しい」を担い、演習は「裏側＝つまずきを直す」を担う。
   * 負けた直後・間違えた直後がいちばん学ぶ気になっている瞬間なので、
   * リザルト画面からワンタップでその単元の演習に入れるようにする。
   *
   * -------------------------------------------------------------------
   * ■ ★教科も一緒に切り替える理由★
   * -------------------------------------------------------------------
   * 対戦の教科は、アプリで選んでいる教科（selectedSubject）と違うことがある
   * （化学基礎を選んだまま、対戦だけ生物基礎で遊ぶ、など）。
   * 章IDだけ渡して演習に飛ばすと、教科が食い違って
   * ★単元選択に戻ったときに別教科の一覧が出る★ という迷子になる。
   * 章と教科は必ずセットで切り替える。
   *
   * -------------------------------------------------------------------
   * ■ 演習モード（practice）に固定する理由
   * -------------------------------------------------------------------
   * 対戦で出しているのは演習問題（practiceProblems）を割ったものなので、
   * 対応する問題があるのは演習モードである。
   * ミニテストに飛ばすと「対戦で間違えた問題が出てこない」ことになる。
   * 既存の復習ノートからの遷移（handleReviewNote）と同じ扱いにしている。
   */
  const handlePracticeFromBattle = async (subject: string, chapterId: string, problemId?: string, subQuestionId?: string) => {
    if (reviewBusy.current) return;
    reviewBusy.current = true;
    const request = ++reviewRequest.current;
    try {
      if (isExternalSubject(subject)) {
        // 英単語・英熟語は対戦専用（本体に演習画面が無い）。
        // リザルトは onPractice を渡されても vocab では出さない（BattleResult 側で判定）が、
        // 履歴など別経路から来たときのためにここでも止める。
        if (subject !== 'rika') throw new Error('この科目は対戦専用です。答えはリザルトの解答欄で確認できます。');
        if (!FEATURES.rika) throw new Error('この科目の演習は現在公開されていません。');
        const { RIKA_ITEMS } = await import('./features/rika/rikaData');
        const found = RIKA_ITEMS.find(q => q.chapterId === chapterId && (!subQuestionId || q.id === subQuestionId));
        if (!found) throw new Error('対応する演習問題が見つかりません。');
        if (request !== reviewRequest.current) return;
        savedBattleScroll.current = battleScrollRef.current?.scrollTop || 0;
        setBattleReturnActive(true);
        setRikaBattleTarget({ chapterId, questionId: subQuestionId });
        setRikaTab('practice'); setAppState('rika');
        return;
      }
      const { getPartsOfSubject } = await import('./data/allChapters');
      if (request !== reviewRequest.current) return;
      if (!isSubjectId(subject)) throw new Error('対応する科目が見つかりません。');
      const parts = getPartsOfSubject(subject);
      const part = parts.find((p: any) => p.chapters.some((c: any) => c.id === chapterId));
      const chapter = part?.chapters.find((c: any) => c.id === chapterId);
      if (!chapter) throw new Error('対応する単元が見つかりません。');
      let mode: 'practice' | 'mini_test' = 'practice';
      let problems = chapter.practiceProblems || [];
      let index = problemId ? problems.findIndex((p: any) => p.id === problemId) : 0;
      if (problemId && index < 0) {
        mode = 'mini_test';
        problems = Array.isArray(chapter.miniTest) ? chapter.miniTest : chapter.miniTest?.problems || [];
        index = problems.findIndex((p: any) => p.id === problemId);
      }
      if (!problems[index] || (subQuestionId && !problems[index].subQuestions?.some((q: any) => q.id === subQuestionId))) {
        throw new Error('対応する問題が見つかりません。教材が更新された可能性があります。');
      }
      savedBattleScroll.current = battleScrollRef.current?.scrollTop || 0;
      setBattleReturnActive(true);
      setSelectedSubject(subject as SubjectId);
      if (part?.field) setSelectedField(part.field);
      setAppMode(mode);
      handleSelectChapter(chapterId, index, false, problemId ? { startIndex: index, endIndex: index } : null, mode);
    } catch (error) {
      if (request === reviewRequest.current) alert(error instanceof Error ? error.message : '演習を読み込めませんでした。もう一度お試しください。');
    } finally {
      if (request === reviewRequest.current) reviewBusy.current = false;
    }
  };

  const handleFinishQuiz = (answers: Record<string, string>, result?: any) => {
    setQuizAnswers(answers);
    setLastQuizResult(result || null);
    setAppState('explanation');
    
    // Track chapter completion if not guest
    if (!isGuest && auth.currentUser && selectedChapterId) {
      const uid = auth.currentUser.uid;
      const key = completedKey(uid);
      try {
        const completed = readJsonArray<string>(key);
        if (!completed.includes(selectedChapterId)) {
          completed.push(selectedChapterId);
          localStorage.setItem(key, JSON.stringify(completed));
        }
      } catch (e) {
        console.error('Failed to save completion:', e);
      }
    }
  };

  const handleBackToChapters = () => {
    setAppState('chapters');
    setSelectedChapterId(null);
  };

  /**
   * 学習ノートの問題項目から、対応する演習問題へ遷移する（要件5）。
   * ノートに保存された chapterId / questionId を優先して問題位置を特定し、
   * 見つからなければ questionIndex（1始まり表示番号）でフォールバックする。
   */
  const handleReviewNote = async (note: any) => {
    if (!note || reviewBusy.current) return;
    reviewBusy.current = true;
    const request = ++reviewRequest.current;
    try {
      // 問題本体は押されたときだけ読む。全科目を起動時には読み込まない。
      const { SUBJECTS, getPartsOfSubject } = await import('./data/allChapters');
      if (request !== reviewRequest.current) return;
      const target = resolveReviewTarget(note, SUBJECTS
        .filter(entry => isSubjectEnabled(entry.id))
        .map(entry => ({ id: entry.id, parts: getPartsOfSubject(entry.id) })));
      if (!target) {
        alert(note.subQuestionId && !note.chapterId && !note.questionId
          ? 'この確認問題は現在の教材に見つかりませんでした。問題が差し替えられた可能性があります。'
          : '対応する問題を見つけられませんでした。教材が更新された可能性があります。ノートはそのまま残しています。');
        return;
      }
      setSelectedSubject(target.subject);
      if (target.field) setSelectedField(target.field);
      setAppMode('practice');
      handleSelectChapter(target.chapterId, target.questionIndex, false, null, 'practice');
    } catch {
      if (request === reviewRequest.current) {
        alert('問題データの読み込みに失敗しました。通信状況を確認して、もう一度お試しください。');
      }
    } finally {
      if (request === reviewRequest.current) reviewBusy.current = false;
    }
  };

  /*
   * ★選択中の章（単元）を探す処理は、ここから components/QuizScreens.tsx へ移した★
   *
   * 以前はここで
   *     const selectedChapter = findChapterById(selectedChapterId);
   * と★描画中に同期で★呼んでいた。
   * findChapterById は全教科の章を連結して探すので、
   * 呼ぶだけで問題データ全部（実測 2,703,107 B）が起動時に必要になっていた。
   *
   * ■ ここで非同期にする案は捨てた（表示が変わってしまう）
   *
   *   await で章を取ろうとすると、解決するまで selectedChapter が
   *   undefined になる。すると下の
   *       appState === 'quiz' && selectedChapter && …
   *   が false になり、★演習画面が一瞬まったく描かれない★。
   *   「単元を選んだのに一瞬何も出ない」という、
   *   元のアプリには無かった見え方が生まれる。
   *
   * ■ そこで「画面ごと」遅延側に移した
   *
   *   App.tsx は章ID（文字列）だけを持ち、章の実体を知らない。
   *   章を探すのは QuizScreens（＝遅延読み込みされる側）の仕事にした。
   *   これで App.tsx から data/allChapters への静的な線が切れる。
   *
   *   探し方そのものは変えていない（移動先でも同じ findChapterById を
   *   同じ引数で同期に呼んでいる）。見つからないときに何も描かないのも同じ。
   */

  if (!hasEntered) {
    const enter = () => { battleAudio().unlock(); setHasInteracted(true); setHasEntered(true); };
    // 副CTA「ゲストで試す」は、まだゲストでもログイン済みでもない人（＝次にログイン画面が出る人）にだけ出す
    const firstVisit = !isGuest && !auth.currentUser;
    return <LaunchScreen soundEnabled={isBgmEnabled} onToggleSound={() => handleToggleBgm(!isBgmEnabled)} onStart={enter}
      onGuest={firstVisit ? () => { setIsGuest(true); setAppState('home'); enter(); } : undefined} />;
  }

  return (
    <>
      <MobileViewWrapper isMobileMode={isMobilePreview && !shouldForceDesktopUI} onClose={() => setIsMobilePreview(false)}>
        {/*
          ===== アプリの外枠の高さについて =====
          ★以前は min-h-screen（＝100vh）だった。これが「1画面に収まらない」原因★

          iOS Safari の 100vh は「アドレスバー・下部ツールバーを含んだ高さ」なので、
          実際に見えている領域より必ず大きい。しかも min-height なので
          「最低でもこの高さ、中身が増えればいくらでも伸びる」箱になっていた。

          その結果、各画面の中にある `flex-1 overflow-y-auto` は
          高さの上限をもらえず、スクロールせずに中身のぶんだけ伸びてしまう
          （実測：ホームの中身 1501px ＝ ペインもそのまま 1501px）。
          スクロールするのは中のペインではなく **ページ全体** になり、
          コンテンツが下部ナビやブラウザのツールバーの裏に潜り込んでいた。
          （ご指摘の「マスコットの吹き出しが切れる」「この科目ではじめる が隠れる」）

          そこで h-[100dvh] で高さを確定させる。
           ・dvh … ツールバーを除いた「いま見えている高さ」
           ・h（min-h ではない）… 中身が増えても箱は伸びない
          これで各画面の overflow-y-auto が初めて上限を得て、
          「ページ全体ではなく中身だけがスクロールする」形になり、
          下部ナビは常に画面内に居座る。
        */}
        {/*
          ★overflow は hidden ではなく auto にする（重要）★
          この外枠の下には2種類の画面がぶら下がっている。
            A) 自前のスクロール領域を持つ画面（ホーム／科目選択／単元選択）
            B) 持たない画面（設定・ランキング・アプリ紹介・模試・
               ロジックツリー・学習モード選択 など）
          hidden にすると B の画面は中身がはみ出しても
          スクロールする手段が無くなり、下の方が永久に読めなくなる。
          auto なら A は自前ペインで完結し（外枠はスクロールしない）、
          B は外枠がスクロールしてくれる。
        */}
        {/*
          ★items-center → items-safe-center に変えた理由★

          ご指摘（原文）:
            > PCバージョンのタイトル画面で上にスクロールできず、
            > お知らせや科目変更ができません。

          この外枠はスクロールする箱（overflow-y-auto）なのに、
          科目選択・アプリ紹介・学習モード選択・初回登録では
          中央寄せ（items-center）を付けていた。

          スクロールする箱に中央寄せを付けると、中身が箱より高いとき
          はみ出しを上下へ半分ずつ押し出すが、
          ★ブラウザがスクロールで見せてくれるのは下側だけ★。
          上側はスクロール位置の最小値が 0（箱の上辺）なので到達できない。
          実測では箱300px・中身600pxのとき上に150px 届かず、
          しかも scrollHeight が 450 に減っていた
          （＝はみ出しが「無いもの」として扱われるので JS でも到達不能）。

          items-safe-center は「収まるなら中央、はみ出すなら上端」に
          自動で切り替わる（実測で両方を確認）。
          収まる画面の見た目は今までと同じままで、
          縦の短いパソコンでも一番上まで読めるようになる。
          定義は index.css の 13.5 節（未対応ブラウザ用の保険つき）。
        */}
        <div data-app-state={appState} data-battle-live={appState === 'battle' && battleActive ? '' : undefined} className={`app-shell h-[100dvh] w-full flex justify-center relative overflow-y-auto ${
          isFullBleed
            ? 'p-0 items-stretch'
            : `pt-6 pb-safe-lg md:py-12 px-4 md:px-8 md:pb-28 ${['onboarding', 'subject_selection', 'intro', 'mode_selection'].includes(appState) ? 'items-safe-center' : 'items-start'}`
        }`}>
          {/* iOS Safari では crossOrigin="anonymous" が付いていると
              同一オリジン音源でもデコードがブロックされ再生できないことがあるため付与しない。
              playsInline を付けて iOS のインライン再生を許可する。 */}
          <audio 
            ref={audioRef} 
            src="/tanjou.mp3" 
            loop 
            preload="auto" 
            // @ts-ignore - playsInline は audio でも iOS 挙動安定のため付与
            playsInline
            onError={handleAudioError}
          />
          
          {/* スマホ版の「パソコン版・スマホ版の切り替えボタン」は削除。
              （スマホ端末では常にスマホ向けレイアウトで表示する。forceDesktop は false 固定） */}

          {/*
            外枠でせっかく高さを確定させても、この中間ラッパーが高さを
            素通りさせないと子（各画面）は上限を受け取れない。
            ★パーセント指定の高さ（h-full / max-h-full）は、親の高さが
              解決していないと `none` 扱いで無視される★ため、
              外枠 → ここ → 各画面 と高さの鎖をつなぐ必要がある。

            mode_selection だけは中央寄せカード（items-center）なので、
            伸び縮みする箱として min-h-0 + flex を渡し、
            カード側が自分で内部スクロールを持てるようにする。
          */}
          <div className={`app-screen-stack w-full relative min-h-0 ${
            appState === 'explanation'
              ? 'max-w-none w-full h-full'
              : isFullBleed
                ? 'max-w-none h-full'
                : 'max-w-5xl max-h-full flex flex-col'
          }`}>
            {appState === 'settings' && <ProfileModal onClose={() => setAppState(prevAppState)} isBgmEnabled={isBgmEnabled} setIsBgmEnabled={setIsBgmEnabled} onToggleBgm={handleToggleBgm} bgmVolume={bgmVolume} setBgmVolume={setBgmVolume} onOpenTeacherDashboard={() => setAppState('teacher_dashboard')} onOpenFeedbackAdmin={() => setAppState('feedback_admin')} onOpenOutfit={() => { setGrowthPage('outfit'); navigateMain('growth'); }} />}
            {/* 先生ダッシュボード。戻る先を設定にしているのは、入ってきた経路と揃えるため。 */}
            {appState === 'teacher_dashboard' && <TeacherDashboard onBack={() => setAppState('settings')} />}
            {/* フィードバック管理（運営専用）。入口は設定内の運営専用ボタン。 */}
            {appState === 'feedback_admin' && <FeedbackAdminPanel onBack={() => setAppState('settings')} />}

            {/* ログイン／ゲスト開始の直後は、必ず科目選択（＝タイトル）画面を経由する */}
            {/* ログイン／ゲスト開始の直後は、そのままホームへ入る。
                以前はここで科目選択を挟んでいたため、
                «ログイン → 科目選択 → ホーム → 学習を始める → 科目選択»
                と科目選択が2回出てしまっていた。
                科目はホームの「学習を始める」で選ぶ（初期値は化学基礎）。 */}
            {appState === 'onboarding' && <Onboarding onComplete={() => setAppState('home')} onGuest={() => { setIsGuest(true); setAppState('home'); }} />}
            {appState === 'subject_selection' && (
              <ListeningSubjectSelection
                onSelectSubject={handleSelectSubject}
                currentSubject={selectedSubject}
                isGuest={isGuest}
                // 科目選択は必ずホームから開くので、常に「ホームに戻る」を出せる
                onBack={() => setAppState(subjectPickerReturnTo)}
                backLabel={subjectPickerReturnTo === 'home' ? 'ホームに戻る' : '学習に戻る'}
                /* 高校入試 理科（スマホでは科目選択に並べる。ホームの onRika と同じ条件・同じ行き先） */
                onRika={FEATURES.rika ? () => { setRikaTab('practice'); setAppState('rika'); } : undefined}
                onBattle={FEATURES.battle ? () => setAppState('battle') : undefined}
              />
            )}
            {appState === 'home' && <Home onPractice={() => { setFoundationBackTo('home'); setAppState('study'); }} onListeningStart={(chapter,index)=>{setAppMode('practice');handleSelectChapter(chapter,index,false,{startIndex:index,endIndex:index},'practice');}} onPickSubject={value => { if (isSubjectId(value) && isSubjectEnabled(value)) setSelectedSubject(value); }} onStudyMode={handleSelectMode} onGrowth={page => { setGrowthPage(page); navigateMain('growth'); }} onStart={handleStart} onIntro={handleIntro} onNoteList={() => setAppState('study_hub')} onLogicalTree={() => setAppState('logical_tree')} onLeaderboard={() => setAppState('leaderboard')} onBattle={FEATURES.battle ? () => setAppState('battle') : undefined} onRika={FEATURES.rika ? () => { setRikaTab('practice'); setAppState('rika'); } : undefined} onChangeSubject={() => { setSubjectPickerReturnTo('home'); setSubjectPickerOrigin('start'); setAppState('subject_selection'); }} onFoundation={() => { setFoundationBackTo('home'); setAppState('foundation'); }} subjectLabel={getSubjectLabel(selectedSubject)} subject={selectedSubject} isGuest={isGuest} isBgmEnabled={isBgmEnabled} isBgmFadedOut={isBgmFadedOut} onToggleBgm={handleToggleBgm} />}
            {/* ★ルーティング側の門（4箇所のうちの3番目）★
                ナビのボタンを隠すだけでは、Home の「ランキングを見る」など
                別の導線からこの状態になれてしまう。
                描画の受け口でも同じフラグを見て、
                「見えないのに入れる」状態を作らない。 */}
            {appState === 'growth' && <React.Suspense fallback={<ScreenLoading />}>
              <GrowthHub onRanking={() => navigateMain('leaderboard')} page={growthPage} onPage={setGrowthPage} onBack={() => navigateMain('home')} defaultSubject={selectedSubject}
                onBattle={FEATURES.battle ? () => navigateMain('battle') : undefined}
                onReview={() => { setStudyHubView({ tab: 'today', subjectTab: 'all' }); navigateMain('study_hub'); }} />
            </React.Suspense>}
            {appState === 'leaderboard' && FEATURES.ranking && <Leaderboard onGacha={() => { setGrowthPage('gacha'); navigateMain('growth'); }} onBack={() => setAppState('home')} isGuest={isGuest} initialChapterId={selectedChapterId} initialSubject={selectedSubject} onBattle={FEATURES.battle ? () => setAppState('battle') : undefined} />}
            {/* ★対戦モード（ルーティング側の門）★
                ホームのボタンを隠すだけでは、localStorage に残った
                appState='battle' から復元して入れてしまう。
                描画の受け口でも同じフラグを見る（既存のランキングと同じ作り）。 */}
            {(appState === 'battle' || battleReturnActive) && FEATURES.battle && (
              <div id="battle-screen-scroll" ref={battleScrollRef} hidden={appState !== 'battle'}
                className={appState === 'battle' ? `h-full min-h-0 overflow-y-auto overscroll-contain ${battleActive ? 'battle-no-nav' : 'pb-app-nav'}` : 'hidden'}>
              <BattleMode
                onExit={() => setAppState('home')}
                onRequireLogin={() => setAppState('onboarding')}
                /* ★対戦 ⇒ 演習 の橋（請求⑦-A）★ */
                onPractice={handlePracticeFromBattle}
                onActiveChange={setBattleActive}
                /* ★対戦 ⇒ 復習（臨場感アップデート）★ 間違えた問題は復習リストに入っている */
                onReview={() => {
                  setStudyHubView({ tab: 'today', subjectTab: 'all' });
                  setAppState('study_hub');
                }}
                initialSubject={selectedSubject}
              />
              </div>
            )}
            {appState === 'rika' && FEATURES.rika && (
              /*
                高校入試 理科の入口（演習・まとめ・出題傾向）。
                遅延読み込み（上の React.lazy を参照）。fallback は null＝何も描かない。
                本体の他の遅延画面と同じ扱いにそろえてある。

                ★描画の受け口でも FEATURES.rika を見る★
                ホームのカードを消すだけでは塞げない。
                このアプリは画面状態を localStorage に保存しているので、
                理科を開いた状態で非公開に切り替えると
                ★次の起動で保存値 'rika' が復元されて中に入ってしまう★。
                （既存のランキングと同じ塞ぎ方。詳しくは src/config/features.ts）
              */
              <React.Suspense fallback={<ScreenLoading />}>
                <RikaHome onBack={battleReturnActive ? returnToBattle : () => setAppState('home')} initialTab={rikaTab}
                  battleTarget={rikaBattleTarget || undefined} onReturnToBattle={battleReturnActive ? returnToBattle : undefined} />
              </React.Suspense>
            )}
            {appState === 'intro' && <Intro onBack={() => setAppState('home')} onBattle={FEATURES.battle ? () => setAppState('battle') : undefined} />}
            {appState === 'logical_tree' && (
              <LogicalTree
                onBack={() => setAppState('home')}
                /* ツリーの「確認問題」は小問IDを持つ。学習ノートと同じ解決处理で演習へ移る。 */
                onOpenQuestion={(subQuestionId) => handleReviewNote({ subQuestionId })}
              />
            )}
            {appState === 'mode_selection' && <ModeSelection onSelectMode={handleSelectMode} onBack={() => setAppState('home')} onChangeSubject={handleChangeStudySubject} onMockExam={() => setAppState('mock_exam')} subject={selectedSubject} onBattle={FEATURES.battle ? () => setAppState('battle') : undefined} />}
            {appState === 'mock_exam' && <MockExam onBack={() => setAppState('mode_selection')} />}
            {appState === 'learning' && (
              /*
                まとめプリントは遅延読み込み（上の React.lazy を参照）。
                fallback は null＝何も描かない。
                ローディング表示を足すと「元には無かった表示」が増えてしまうため。
              */
              <React.Suspense fallback={<ScreenLoading />}>
                <LearningViewer
                  onBack={() => setAppState('mode_selection')}
                  subject={
                    selectedSubject === 'chemistry' ? 'chemistry'
                    : selectedSubject === 'math' ? 'math'
                    : selectedSubject === 'biology_basic' ? 'biology_basic'
                    : 'chemistry_basic'
                  }
                />
              </React.Suspense>
            )}
            {/* 化学（発展）：理論化学・無機化学・有機化学の分野選択 */}
            {appState === 'advanced_fields' && (
              /* 分野選択画面は遅延読み込み（上の React.lazy を参照）。fallback は null＝何も描かない。 */
              <React.Suspense fallback={<ScreenLoading />}>
                <AdvancedFieldSelection
                  onSelectField={(field) => { setSelectedField(field); setAppState('chapters'); }}
                  onBack={() => setAppState('mode_selection')}
                />
              </React.Suspense>
            )}
            {appState === 'chapters' && (
              /*
                単元選択画面は遅延読み込み（上の React.lazy を参照）。
                fallback は null＝何も描かない。

                なお、この画面に入る直前のモード選択画面で
                あらかじめ読み込みを始めている（下の「先読み」の useEffect を参照）ので、
                実際にはここで待たされないようにしてある。
              */
              <React.Suspense fallback={<ScreenLoading />}>
                <ChapterSelection
                  mode={appMode as 'mini_test' | 'practice'}
                  onChangeSubject={handleChangeStudySubject}
                  onSelectChapter={handleSelectChapter}
                  onBack={() => setAppState(chaptersBackTo === 'study' ? 'study' : chaptersBackTo === 'foundation' && selectedSubject === 'english_grammar' ? 'foundation' : studyEntry(selectedSubject) === 'chapters' ? 'home' : 'mode_selection')}
                  backLabel={chaptersBackTo === 'study' ? '演習' : chaptersBackTo === 'foundation' && selectedSubject === 'english_grammar' ? '固める' : studyEntry(selectedSubject) === 'chapters' ? 'ホーム' : '学習モード'}
                  onChangeField={setSelectedField}
                  rememberedGroup={chapterGroups[`${selectedSubject}:${selectedField}`]}
                  onGroupChange={(group) => setChapterGroups(prev => ({ ...prev, [`${selectedSubject}:${selectedField}`]: group }))}
                  subject={selectedSubject}
                  field={selectedField}
                  fieldTitle={ADVANCED_FIELDS.find(f => f.id === selectedField)?.title}
                />
              </React.Suspense>
            )}
            {(appState === 'quiz' || appState === 'explanation') && (
              /*
                演習画面と結果・解説画面は遅延読み込み（上の React.lazy を参照）。
                章を探す処理も含めて QuizScreens 側に置いてあるので、
                この画面に入るまで問題データ（2.7MB）を読まない。

                fallback は null＝何も描かない。
                元のコードも「章が見つかるまで何も描かない」挙動
                （appState === 'quiz' && selectedChapter && …）だったので、
                読み込み中に何も出ないのは元からの見え方と同じ。
                ここでローディング表示を足すと、元には無かった表示が
                一瞬出て消えることになるため、あえて足していない。
              */
              <React.Suspense fallback={<ScreenLoading />}>
                <QuizScreens
                  screen={appState === 'quiz' ? 'quiz' : 'explanation'}
                  chapterId={selectedChapterId}
                  mode={appMode as 'mini_test' | 'practice'}
                  answers={quizAnswers}
                  onFinish={handleFinishQuiz}
                  onBack={battleReturnActive ? returnToBattle : handleBackToChapters}
                  onReturnToBattle={battleReturnActive ? returnToBattle : undefined}
                  isGuest={isGuest}
                  // スマホではスマホ専用レイアウト（正誤一覧→タップで解説）で表示する。
                  // PC は従来どおり（isMobileView=false → 2カラムレイアウト）。
                  isMobileView={isMobileView}
                  onExplanationChange={setIsExplanationView}
                  resultTotalScore={lastQuizResult?.totalScore}
                  resultTotalCorrect={lastQuizResult?.totalCorrect}
                  resultTotalJudgeable={lastQuizResult?.totalJudgeable}
                  resultTotalTimeSec={lastQuizResult?.totalTimeSec}
                  // 1回分（例：第3回演習）だけを解いたときは、その回だけを振り返る。
                  // 解いていない回まで答え合わせに並ぶと、どこまでやったか分からなくなる。
                  questionRange={quizRange}
                  subject={selectedSubject}
                  /* 結果画面の「次にすること」。どちらも通常の演習開始と同じ経路を通す。 */
                  onRetryWrong={(chapterId, firstWrongIndex) => handleSelectChapter(chapterId, firstWrongIndex, false, quizRange, appMode)}
                  onNextChapter={(chapterId) => handleSelectChapter(chapterId, 0, false, null, appMode)}
                />
              </React.Suspense>
            )}
            {appState === 'study_hub' && <StudyHub view={studyHubView} onViewChange={setStudyHubView} onBack={() => setAppState('home')} onPractice={() => handleSelectMode('practice')} isGuest={isGuest} onSelectNote={(note) => { setSelectedNote(note); setAppState('note_detail'); }} onReview={handleReviewNote} />}
            {/* ★英文法・英単語を固める（A1/A17/A18）★
                リスニング（主役・学習タブ）とは別のページ。下のナビを残したまま1画面で完結させる。
                英文法の4択演習・単語の例から解くリスニングは、どちらも通常の演習と同じ経路を通す。 */}
            {appState === 'study' && <React.Suspense fallback={<ScreenLoading />}>
              <StudyCatalog
                subjectId={studyCatalogSubject}
                onSubject={setStudySubject}
                onContent={openStudyContent}
                onBack={() => setAppState('home')}
                lastContentId={studyLastContent}
                progressOf={(subject) => studyProgressOf(subject)}
              />
            </React.Suspense>}
            {appState === 'foundation' && <React.Suspense fallback={<ScreenLoading />}>
              <FoundationPage
                tab={foundationTab}
                onTab={setFoundationTab}
                uid={auth.currentUser?.uid || 'guest'}
                onBack={() => setAppState(foundationBackTo)}
                backLabel={foundationBackTo === 'study' ? '演習' : undefined}
                onGrammarUnits={() => openSubjectUnits('english_grammar', 'foundation')}
                onPractice={(chapter, index) => { setSelectedSubject('english_listening'); setAppMode('practice'); handleSelectChapter(chapter, index, false, { startIndex: index, endIndex: index }, 'practice'); }}
                onBattle={FEATURES.battle ? () => navigateMain('battle') : undefined}
                onReview={() => setAppState('study_hub')}
                onListening={() => openSubjectUnits('english_listening', 'home')}
              />
            </React.Suspense>}
            {appState === 'note_detail' && (selectedNote
              ? <NoteDetail note={selectedNote} onBack={() => setAppState('study_hub')} onReview={handleReviewNote} />
              : <ScreenUnavailable message="ノートを一覧から選び直してください。保存したノートは削除されていません。" onBack={() => setAppState('study_hub')} backLabel="学習ノートへ戻る" />)}

            {/* Global Bottom Navigation Footer
                日本語ラベル化（ホーム／学習／設定）＋aria-labelをaria-currentで現在地を明示
                アイコンには aria-hidden を付け、ラベルだけがスクリーンリーダーに読まれるよう整理 */}
            {/* ★対戦中（試合が始まってから終わるまで）は下ナビを出さない（2026-10-01）★ 問題と絵を1画面に入れるため。
                 「対戦をやめる」は対戦画面の中にある。結果画面ではナビが戻る。 */}
            {appState !== 'onboarding' && appState !== 'subject_selection' && appState !== 'quiz' && appState !== 'explanation' && !(appState === 'battle' && battleActive) && (
              /* C19 下ナビは共通部品1つ（components/ui/BottomNavigation）。行き先・条件は以前と同じ。
                 高さは --app-nav-h として公開し、各画面が下の余白の基準にする。 */
              <BottomNavigation
                ref={(node: HTMLElement | null) => {
                  if (!node) return;
                  const shell = node.closest<HTMLElement>('.app-shell');
                  const measure = () => shell?.style.setProperty('--app-nav-h', `${node.getBoundingClientRect().height}px`);
                  measure();
                  const observer = new ResizeObserver(measure);
                  observer.observe(node);
                  return () => observer.disconnect();
                }}
                items={[
                  { id: 'home', label: 'ホーム', ariaLabel: 'ホーム画面へ移動', current: appState === 'home', onClick: () => navigateMain('home') },
                  { id: 'study', label: '学習', ariaLabel: '学習画面へ移動', current: isLearningScreen(appState), onClick: () => {
                    if (!isLearningScreen(appState)) { const next = safeStudyResume(selectedSubject, lastLearnState, selectedChapterId); setFoundationBackTo('home'); navigateMain((next === 'mode_selection' ? 'study' : next) as AppState); }
                  } },
                  // 対戦はランキングより前（結果を見る画面より先）。FEATURES.battle が false なら席ごと消す
                  { id: 'battle', label: '対戦', ariaLabel: 'オンライン対戦へ移動', current: appState === 'battle', hidden: !FEATURES.battle, onClick: () => navigateMain('battle') },
                  { id: 'gacha', label: 'ガチャ', ariaLabel: 'ガチャ画面へ移動', current: appState === 'growth' && growthPage === 'gacha' || appState === 'leaderboard', onClick: () => { setGrowthPage('gacha'); navigateMain('growth'); } },
                  { id: 'mypage', label: 'マイページ', ariaLabel: 'マイページへ移動', current: appState === 'growth' && growthPage !== 'gacha', onClick: () => { setGrowthPage('overview'); navigateMain('growth'); } },
                  { id: 'settings', label: '設定', ariaLabel: pendingFriendRequests > 0 ? `設定画面へ移動（フレンド申請が${pendingFriendRequests}件届いています）` : '設定画面へ移動',
                    current: appState === 'settings', badge: pendingFriendRequests, onClick: () => navigateMain('settings') },
                ]}
              />
            )}
          </div>
        </div>
      </MobileViewWrapper>

      {/* ミッション達成のお知らせ（どの画面でも上に出る。受け取りはミッション画面で） */}
      <React.Suspense fallback={null}>
        <MissionToast onOpen={() => { setGrowthPage('missions'); navigateMain('growth'); }} />
      </React.Suspense>

      {/* Desktop Toggle Button for Mobile Preview
          aria-label / title を日本語で明示、アイコンには aria-hidden */}
      {!isMobileDevice && !isMobilePreview && (
        /* サイドバーの左下に置く（右下だとホームの復習ノート等のボタンに重なっていた）。ラベルも常に出す */
        <button type="button" onClick={() => setIsMobilePreview(true)} className="mt-preview-toggle"
          title="スマホ版でプレビュー（モバイル端末での見え方を確認）">
          <Smartphone size={16} aria-hidden="true" />スマホ版で見る
        </button>
      )}
    </>
  );
}
