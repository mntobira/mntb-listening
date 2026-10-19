/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AdBannerSlot } from './ads/AdBannerSlot';
import { PdfViewerHost } from './components/PdfViewer';
import { usePdfOpen } from './hooks/usePdfOpen';
import React, { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { setReviewFocus, type ReviewTargetItem } from './utils/reviewFocus';
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
import { Leaderboard } from './components/Leaderboard';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { Intro } from './components/Intro';
import { NoteDetail } from './components/NoteDetail';
import { StudyHub, type StudyHubView } from './components/StudyHub';
import { ScreenLoading, ScreenUnavailable } from './components/ScreenStatus';
import { studyEntry, isLearningScreen } from './utils/studyNavigation';
import { DEFAULT_SUBJECT, SUBJECT_IDS } from './data/subjects';
import { useStudyTimeTracker } from './hooks/useStudyTimeTracker';
import { resolveReviewTarget, type ReviewRequest } from './utils/reviewTarget';
import type { ChapterRunState } from './utils/quizRunState';
import type { StudyNote } from './types/studyNote';
import { Onboarding } from './components/Onboarding';
import { getSubjectLabel, isSubjectId, type SubjectId } from './data/subjectLabels';
/*
 * 本体に教科データを持たない教科（高校入試 理科など）の登録簿。
 * ★何も import しない葉ファイルなので、ここから読んでも問題データは付いてこない★
 * （tests/subjectLabels.test.ts が「葉であること」を機械で見張っている）
 */
import { isExternalSubject } from './data/externalSubjects';
import { readJsonArray } from './utils/safeLocalStorage';
import { safeSetItem } from './utils/storageGuard';
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
import { countIncomingFriendRequests } from './utils/friends';
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
import { startUserDataSync, stopUserDataSync, installUserDataSyncFlush, USER_DATA_SYNCED_EVENT } from './utils/userDataSync';
import { installUsageFlush, trackScreen } from './utils/analytics';
import { rescheduleReminders } from './utils/studyRemindersRuntime';
import { TeacherDashboard } from './components/TeacherDashboard';
import { useTitleBgmController } from './hooks/useTitleBgmController';
import { FeedbackAdminPanel } from './components/FeedbackAdminPanel';
import { battleAudio } from './battle/audio/battleAudio';
import { installFriendPresence } from './utils/friendPresence';
import { BattleMode } from './battle/ui/BattleMode';
import type { GrowthPage } from './components/GrowthHub';
import './styles/world.css';
import { usePreventZoom, NATIVE_CONTROLS_SELECTOR } from './hooks/usePreventZoom';
import { useAutomationHooks } from './hooks/useAutomationHooks';
import { logRejection } from './utils/reportError';
import { notify, confirmAction } from './utils/dialog';
const GrowthHub = React.lazy(() => import('./components/GrowthHub').then(m => ({ default: m.GrowthHub })));
const MissionToast = React.lazy(() => import('./components/MissionToast').then(m => ({ default: m.MissionToast })));

export type AppState = 'home' | 'mode_selection' | 'chapters' | 'quiz' | 'explanation' | 'intro' | 'study_hub' | 'note_detail' | 'onboarding' | 'settings' | 'leaderboard' | 'subject_selection' | 'teacher_dashboard' | 'feedback_admin' | 'battle' | 'growth' | 'foundation' | 'study';
export type AppMode = 'mini_test' | 'practice' | 'learning';

/*
 * 復元してよい画面の一覧。
 * 統合版にあった 'learning'（まとめプリント）・'advanced_fields'（化学の分野選択）・'rika'（高校入試 理科）・
 * 'logical_tree'・'mock_exam' はリスニング版に画面が無いので含めない。古い保存値は isAppState が false を返し、
 * オンボーディング（またはホーム）へ倒れる（'flowchart' と同じ扱い）。
 */
const APP_STATES = new Set<AppState>([
  'home', 'mode_selection', 'chapters', 'quiz', 'explanation', 'intro',
  'study_hub', 'note_detail', 'onboarding', 'settings',
  'leaderboard', 'subject_selection', 'teacher_dashboard',
  'feedback_admin', 'battle', 'growth',
  /** 英文法・英単語を固める（単語・熟語／聞き取りの文法／その他）。下のナビを残す1画面のページ。 */
  'foundation',
  'study',
]);
const APP_MODES = new Set<AppMode>(['mini_test', 'practice', 'learning']);

export function isAppState(value: unknown): value is AppState {
  return typeof value === 'string' && APP_STATES.has(value as AppState);
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

/**
 * 通常 BGM を止める画面。
 *   quiz / explanation … 従来どおり（問題を読む場面では音を止める）
 *   battle             … ★臨場感アップデートで追加★
 *     対戦中は専用の BGM・効果音（src/battle/audio）が鳴るので、
 *     通常 BGM と重なると濁る。対戦モードの間だけ通常 BGM を止め、
 *     戻ってきたら従来どおり再開する（フェードの計測も止まる）。
 */
/** 化学（発展）で最後に選んだ分野の保存キー */

/**
 * 無操作でホーム画面に戻るまでの時間（30分）。
 * 問題を read しながら考え込む時間を邪魔しない程度に長く取り、
 * かつ放置された端末が学習画面のまま残らない長さにしている。
 */
const IDLE_RESET_MS = 30 * 60 * 1000;
/** ログインできずに「この端末だけで続ける」を選んだ印（ゲスト入口の廃止後の逃げ道） */
const LOGIN_FALLBACK_KEY = 'login_fallback_local_v1';
function isScreenshotMode(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('screenshot') === '1' || localStorage.getItem('screenshot_mode') === 'true';
  } catch { return false; }
}

export default function App() {
  const [hasEntered, setHasEntered] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const p = new URLSearchParams(window.location.search);
        if (p.get('screenshot') === '1' || localStorage.getItem('screenshot_mode') === 'true') {
          return true;
        }
      } catch {
        // localStorage が使えない環境（プライベートモード等）は通常の起動に倒す
      }
    }
    return false;
  });
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
    if (isAppState(saved)) return saved;
    if (typeof window !== 'undefined') {
      try {
        const p = new URLSearchParams(window.location.search);
        if (p.get('screenshot') === '1' || localStorage.getItem('screenshot_mode') === 'true' || localStorage.getItem('hasCompletedOnboarding') === 'true') {
          return 'home';
        }
      } catch {
        // localStorage が使えない環境（プライベートモード等）は通常の起動に倒す
      }
    }
    return 'onboarding';
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
  const [selectedNote, setSelectedNote] = useState<StudyNote | null>(null);
  const [studyHubView, setStudyHubView] = useState<StudyHubView>({ tab: 'today', subjectTab: 'all' });
  const [chapterGroups, setChapterGroups] = useState<Record<string, string>>({});
  const [battleReturnActive, setBattleReturnActive] = useState(false);
  const [battleActive, setBattleActive] = useState(false);
  const [growthPage, setGrowthPage] = useState<GrowthPage>('overview');
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
    if (!['battle', 'quiz', 'explanation'].includes(appState)) setBattleReturnActive(false);
  }, [appState]);
  useEffect(() => {
    let owner = auth.currentUser?.uid || 'guest';
    return onAuthStateChanged(auth, user => {
      const next = user?.uid || 'guest';
      if (next !== owner) setBattleReturnActive(false);
      owner = next;
      // 積み上げ（満点・レベル）を端末共通に（ほかの端末で解いたぶんも「満点 n/3」に反映）
      if (user && !user.isAnonymous) void import('./utils/achievementsSync').then(m => m.scheduleAchievementsSync(1500)).catch(logRejection('achievements.scheduleSync'));
    });
  }, []);
  const returnToBattle = () => {
    restoreBattleScroll.current = true;
    setBattleReturnActive(false);
    setAppState('battle');
  };
  const navigateMain = (next: AppState) => {
    if (appState === 'battle' && next !== 'battle' && battleActive &&
      !confirmAction('進行中の対戦・待機を終了して移動しますか？オンライン対戦では途中退出扱いになります。')) return;
    if (next === 'settings') setPrevAppState(appState === 'battle' && battleActive ? 'home' : appState);
    setBattleReturnActive(false);
    setAppState(next);
  };
  // 学習時間の計測（演習・解説の画面にいる間だけ）。中身は hooks/useStudyTimeTracker.ts
  useStudyTimeTracker(appState === 'quiz' || appState === 'explanation', appState);
  const reviewRequest = useRef(0);
  const reviewBusy = useRef(false);
  useEffect(() => { reviewRequest.current += 1; reviewBusy.current = false; }, [appState]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>(() =>
    parseStoredStringRecord(localStorage.getItem('savedQuizAnswers')),
  );
  // ユーザーエージェントによるモバイル端末判定（初回のみ・不変）。
  // 画面幅の判定は共有フック useIsMobile に一元化する（C2）。
  const isMobileUserAgent = useRef(
    typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent)
  ).current;
  const isNarrowViewport = useIsMobile();
  // 「モバイル端末」= UA がモバイル or 画面幅が md 未満。
  const isMobileDevice = isMobileUserAgent || isNarrowViewport;
  /*
   * isGuest ＝「ログインせずに、この端末だけで使っている」状態。
   * 2026-10-19 ゲストで始める入口は廃止した（ログイン必須）。
   * ただし「ログインがどうしても通らない／オンライン機能が設定前」のときに
   * アプリへ入れなくなるのが一番まずいので、ログイン画面で失敗したときだけ
   * 「この端末だけで続ける」を出す（Onboarding の onOffline）。その印が LOGIN_FALLBACK_KEY。
   * 以前のゲスト（savedIsGuest）は引き継がない＝次の起動でログイン画面が出る。
   * ログインすると、この端末の記録は userDataSync.migrateGuestData でアカウントへ移る。
   */
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem(LOGIN_FALLBACK_KEY) === 'true');
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
      公開中の科目が1つも無い場合だけ登録簿の先頭（DEFAULT_SUBJECT）を使う
      （その状態はアプリとして成立していないので、
        画面が真っ白になるのを避けるための最後の受け皿）。
    */
    if (isSubjectId(saved) && isSubjectEnabled(saved)) return saved;
    const fallback = fallbackSubjectId(SUBJECT_IDS);
    return (fallback as SubjectId) ?? DEFAULT_SUBJECT;
  });
  const [isExplanationView, setIsExplanationView] = useState(false);
  const [prevAppState, setPrevAppState] = useState<AppState>('home');
  /** 設定を開いたとき最初に見せるページ（対戦から「フレンドを追加」で来たときだけ 'friends'） */
  const [settingsTab, setSettingsTab] = useState<'general' | 'friends' | 'class'>('general');
  const [subjectPickerReturnTo, setSubjectPickerReturnTo] = useState<AppState>('home');
  /** 固めるページで開いているタブ（ページを離れても戻ったときに同じタブを開く） */
  const [foundationTab, setFoundationTab] = useState<'words' | 'quiz' | 'grammar' | 'more'>('words');
  /** アプリ内の PDF ビューが開いているか（開いている間は広告を出さない） */
  const pdfOpen = usePdfOpen();
  const [foundationBackTo, setFoundationBackTo] = useState<'home' | 'study'>('home');
  // 演習する（科目→コンテンツ）。選んだ科目・前回のコンテンツは端末に覚えておく
  const [studyCatalogSubject, setStudyCatalogSubject] = useState<string | null>(() => localStorage.getItem('study_catalog_subject_v1'));
  const [studyLastContent, setStudyLastContent] = useState<string | null>(() => localStorage.getItem('study_catalog_last_v1'));
  const [lastQuizResult, setLastQuizResult] = useState<ChapterRunState | null>(null);
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
    const flush = () => { void flushFeedbackQueue().catch(logRejection('feedback.flushQueue')); };
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
        void recordUserPresence(getFeedbackWebhookUrl()).catch(logRejection('presence.record'));
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
        void ensureRankingEntry().catch(logRejection('ranking.ensureEntry'));
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
        stopUserDataSync();
        return;
      }
      // レベル・コイン・ガチャ・単語の✓・学習時間・メモなど、端末だけにあった記録も
      // アカウントへ保存する（ゲストで使っていた分はここでアカウントへ移る）
      startUserDataSync(user.uid);
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
  useEffect(() => installUserDataSyncFlush(), []);
  useEffect(() => installUsageFlush(), []);
  // 学習のお知らせ（通知）：開いたとき・裏から戻ったときに予約し直す（復習日・連続日数が変わるため）
  useEffect(() => {
    const again = () => { if (document.visibilityState !== 'hidden') void rescheduleReminders(); };
    const t = window.setTimeout(again, 3000);
    document.addEventListener('visibilitychange', again);
    window.addEventListener(USER_DATA_SYNCED_EVENT, again);
    return () => { window.clearTimeout(t); document.removeEventListener('visibilitychange', again); window.removeEventListener(USER_DATA_SYNCED_EVENT, again); };
  }, []);

  // iOS のピンチ・ダブルタップズームを抑止する（解答・解説画面と入力欄・ボタン・リンクは除く）
  usePreventZoom({
    enabled: !(appState === 'explanation' || isExplanationView),
    blockPinchTouch: true,
    ignoreSelector: NATIVE_CONTROLS_SELECTOR,
  });


  useEffect(() => { safeSetItem('savedAppState', appState); }, [appState]);
  // 使われ方の記録：どの画面を開いたか（設定でオフにできる。utils/analytics.ts）
  useEffect(() => { trackScreen(hasEntered ? appState : 'launch'); }, [appState, hasEntered]);
  useEffect(() => { safeSetItem('savedAppMode', appMode); }, [appMode]);
  useEffect(() => {
    if (selectedChapterId) {
      safeSetItem('savedSelectedChapterId', selectedChapterId);
    } else {
      localStorage.removeItem('savedSelectedChapterId');
    }
  }, [selectedChapterId]);
  useEffect(() => {
    if (quizRange) {
      safeSetItem('savedQuizRange', JSON.stringify(quizRange));
    } else {
      localStorage.removeItem('savedQuizRange');
    }
  }, [quizRange]);
  useEffect(() => { safeSetItem('savedQuizAnswers', JSON.stringify(quizAnswers)); }, [quizAnswers]);
  useEffect(() => {
    safeSetItem(LOGIN_FALLBACK_KEY, isGuest.toString());
    try { localStorage.removeItem('savedIsGuest'); } catch { /* 古い印の掃除。消せなくても読まないので害はない */ }
  }, [isGuest]);
  useEffect(() => { safeSetItem(SELECTED_SUBJECT_KEY, selectedSubject); }, [selectedSubject]);
  
  useEffect(() => {
    if (isLearningScreen(appState)) {
      safeSetItem('savedLastLearnState', appState);
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
    // モード選択にいる ＝ 次は単元選択の可能性が高い
    if (appState === 'mode_selection') {
      import('./components/ChapterSelection').catch(logRejection('chunk.prefetch.ChapterSelection'));
    }
    // 単元選択にいる ＝ 次は演習画面の可能性が高い
    if (appState === 'chapters') {
      import('./components/QuizScreens').catch(logRejection('chunk.prefetch.QuizScreens'));
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
  const isMobileView = isMobileDevice;

  // PC版では「学習モードを選択」(mode_selection) 以外の全画面で外側余白をなくし、
  // ノート風背景を全幅に広げる。mode_selection だけは従来通り中央寄せ＋余白を維持。
  // 数学の演習・解説・まとめを開いている間だけ、数式を数学の規則で組む（書体の混在を防ぐ）。
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
      safeSetItem('savedLastLearnState', 'chapters');
    }
    setSelectedSubject(subject);
    setAppMode('practice');
    setChaptersBackTo(from);
    setAppState('chapters');
  };

  /** 演習する（B2〜B6）：コンテンツを押したら既存の画面へ。科目ごとの分岐はここ1か所だけ（データの action で決まる） */
  const openStudyContent = (content: import('./data/studyCatalog').StudyContent) => {
    setStudyLastContent(content.id);
    safeSetItem('study_catalog_last_v1', content.id);
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
    if (id) safeSetItem('study_catalog_subject_v1', id); else localStorage.removeItem('study_catalog_subject_v1');
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
      safeSetItem('savedLastLearnState', entry);
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
        // ログイン必須（2026-10-19）。起動時に未ログインならログイン画面へ。
        // 例外：ログインできずに「この端末だけで続ける」を選んだ人・スクリーンショット撮影
        if (!isGuest && !(wasFirstLoad && isScreenshotMode())) {
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
  
  // BGM（タイトル曲）の制御は hooks/useTitleBgmController.tsx にまとめた
  const {
    audioRef, isBgmEnabled, setIsBgmEnabled, bgmVolume, setBgmVolume,
    setHasInteracted, isBgmFadedOut, handleAudioError, handleToggleBgm,
  } = useTitleBgmController({ appState, hasEntered });

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
    // 公開中の科目（リスニング・英文法）は学び方を選ばず、単元選択へ進む。
    // 「学習(インプット)」（まとめプリント）はリスニング版に無いので、演習として単元選択へ進める。
    setAppMode(mode === 'learning' ? 'practice' : mode);
    setAppState('chapters');
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
    // 通常の演習を始めるときは、復習ノートの「間違えた小問だけ」の絞り込みを外す（復習ノートからは後で付け直す）
    setReviewFocus(null);
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
      safeSetItem(quizIndexKey(chapterId, targetMode), questionIndex.toString());
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
        throw new Error('この科目は対戦専用です。答えはリザルトの解答欄で確認できます。');
      }
      const { getPartsOfSubject, miniTestProblemsOf } = await import('./data/allChapters');
      if (request !== reviewRequest.current) return;
      if (!isSubjectId(subject)) throw new Error('対応する科目が見つかりません。');
      const parts = getPartsOfSubject(subject);
      const part = parts.find((p) => p.chapters.some((c) => c.id === chapterId));
      const chapter = part?.chapters.find((c) => c.id === chapterId);
      if (!chapter) throw new Error('対応する単元が見つかりません。');
      let mode: 'practice' | 'mini_test' = 'practice';
      let problems = chapter.practiceProblems || [];
      let index = problemId ? problems.findIndex((p) => p.id === problemId) : 0;
      if (problemId && index < 0) {
        mode = 'mini_test';
        problems = miniTestProblemsOf(chapter);
        index = problems.findIndex((p) => p.id === problemId);
      }
      if (!problems[index] || (subQuestionId && !problems[index].subQuestions?.some((q) => q.id === subQuestionId))) {
        throw new Error('対応する問題が見つかりません。教材が更新された可能性があります。');
      }
      savedBattleScroll.current = battleScrollRef.current?.scrollTop || 0;
      setBattleReturnActive(true);
      setSelectedSubject(subject as SubjectId);
      setAppMode(mode);
      handleSelectChapter(chapterId, index, false, problemId ? { startIndex: index, endIndex: index } : null, mode);
    } catch (error) {
      if (request === reviewRequest.current) notify(error instanceof Error ? error.message : '演習を読み込めませんでした。もう一度お試しください。');
    } finally {
      if (request === reviewRequest.current) reviewBusy.current = false;
    }
  };

  const handleFinishQuiz = (answers: Record<string, string>, result?: ChapterRunState) => {
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
          safeSetItem(key, JSON.stringify(completed));
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
   * 「間違えた問題だけ解き直す」を始める。
   * 演習画面には、間違いを含む大問（それぞれ間違えた小問だけ）の並びが渡るので、
   * 位置は先頭・範囲指定なしで開始する（範囲は絞り込み前の通し番号なので使えない）。
   */
  const startFocusedRetry = (chapterId: string, targets: ReviewTargetItem[], targetMode: AppMode) => {
    if (targets.length === 0) return;
    handleSelectChapter(chapterId, 0, false, null, targetMode);
    setReviewFocus({ chapterId, targets });
  };

  /**
   * 学習ノートの問題項目から、対応する演習問題へ遷移する（要件5）。
   * ノートに保存された chapterId / questionId を優先して問題位置を特定し、
   * 見つからなければ questionIndex（1始まり表示番号）でフォールバックする。
   */
  const handleReviewNote = async (note: ReviewRequest | null | undefined) => {
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
        notify(note.subQuestionId && !note.chapterId && !note.questionId
          ? 'この確認問題は現在の教材に見つかりませんでした。問題が差し替えられた可能性があります。'
          : '対応する問題を見つけられませんでした。教材が更新された可能性があります。ノートはそのまま残しています。');
        return;
      }
      setSelectedSubject(target.subject);
      setAppMode('practice');
      // ★間違えた小問だけを解き直す（2026-10-04 ご要望）★ その大問1つだけを範囲にして、小問も間違えた分に絞る
      const subIds: string[] = Array.isArray(note.subQuestionIds) ? note.subQuestionIds.map(String)
        : note.subQuestionId && note.questionId ? [String(note.subQuestionId)] : [];
      if (note.wholeQuestion && note.questionId) {
        // ★学習記録の「解きなおす」（2026-10-11）★ その大問1つだけを、小問ぜんぶで
        setReviewFocus(null);
        handleSelectChapter(target.chapterId, target.questionIndex, false, { startIndex: target.questionIndex, endIndex: target.questionIndex }, 'practice');
      } else if (subIds.length > 0 && note.questionId) {
        // 絞り込み後の並びはその大問だけになるので、先頭から・範囲なしで始める
        startFocusedRetry(target.chapterId, [{ questionId: String(note.questionId), subQuestionIds: subIds }], 'practice');
      } else {
        handleSelectChapter(target.chapterId, target.questionIndex, false, null, 'practice');
      }
    } catch {
      if (request === reviewRequest.current) {
        notify('問題データの読み込みに失敗しました。通信状況を確認して、もう一度お試しください。');
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

  // 画面検証（スクリーンショット・E2E）用の操作を window に公開する（最新の操作を ref 経由で呼ぶ）
  const enterForAutomation = () => { setHasInteracted(true); setHasEntered(true); };
  useAutomationHooks({
    enterApp: enterForAutomation,
    setAppState: (s: AppState) => { enterForAutomation(); setAppState(s); },
    setGrowthPage: (g: GrowthPage) => { enterForAutomation(); setGrowthPage(g); },
    selectChapter: (c: string, idx = 0) => {
      enterForAutomation();
      handleSelectChapter(c, idx, false, { startIndex: idx, endIndex: idx }, 'practice');
    },
    navigateQuiz: (chapterId = 'el1_A') => {
      enterForAutomation();
      setSelectedChapterId(chapterId);
      setAppMode('practice');
      setQuizRange({ startIndex: 0, endIndex: 0 });
      setAppState('quiz');
    },
    navigateExplanation: (chapterId = 'el1_A') => {
      enterForAutomation();
      setSelectedChapterId(chapterId);
      setAppMode('practice');
      setQuizAnswers({ el1_A_q1: '1' });
      setAppState('explanation');
    },
  });

  if (!hasEntered) {
    const enter = () => { battleAudio().unlock(); setHasInteracted(true); setHasEntered(true); };
    // 2026-10-19 タイトルの「ゲストで試す」は廃止（ログイン必須）。未ログインならこの次にログイン画面が出る
    return <LaunchScreen soundEnabled={isBgmEnabled} onToggleSound={() => handleToggleBgm(!isBgmEnabled)} onStart={enter} />;
  }

  return (
    <>
      <>
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
            playsInline
            onError={handleAudioError}
          />
          

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
            {appState === 'settings' && <ProfileModal initialTab={settingsTab} onClose={() => { setSettingsTab('general'); setAppState(prevAppState); }} isBgmEnabled={isBgmEnabled} setIsBgmEnabled={setIsBgmEnabled} onToggleBgm={handleToggleBgm} bgmVolume={bgmVolume} setBgmVolume={setBgmVolume} onOpenTeacherDashboard={() => setAppState('teacher_dashboard')} onOpenFeedbackAdmin={() => setAppState('feedback_admin')} onOpenOutfit={() => { setGrowthPage('outfit'); navigateMain('growth'); }} />}
            {/* 先生ダッシュボード。戻る先を設定にしているのは、入ってきた経路と揃えるため。 */}
            {appState === 'teacher_dashboard' && <TeacherDashboard onBack={() => setAppState('settings')} />}
            {/* フィードバック管理（運営専用）。入口は設定内の運営専用ボタン。 */}
            {appState === 'feedback_admin' && <FeedbackAdminPanel onBack={() => setAppState('settings')} />}

            {/* ログイン／ゲスト開始の直後は、必ず科目選択（＝タイトル）画面を経由する */}
            {/* ログイン（またはログインできないときの「この端末だけで続ける」）の直後は、そのままホームへ入る。
                以前はここで科目選択を挟んでいたため、
                «ログイン → 科目選択 → ホーム → 学習を始める → 科目選択»
                と科目選択が2回出てしまっていた。
                科目はホームの「学習を始める」で選ぶ（初期値は化学基礎）。 */}
            {appState === 'onboarding' && <Onboarding onComplete={() => { setIsGuest(false); setAppState('home'); }} onOffline={() => { setIsGuest(true); setAppState('home'); }} />}
            {appState === 'subject_selection' && (
              <ListeningSubjectSelection
                onSelectSubject={handleSelectSubject}
                currentSubject={selectedSubject}
                isGuest={isGuest}
                // 科目選択は必ずホームから開くので、常に「ホームに戻る」を出せる
                onBack={() => setAppState(subjectPickerReturnTo)}
                backLabel={subjectPickerReturnTo === 'home' ? 'ホームに戻る' : '学習に戻る'}
                onBattle={FEATURES.battle ? () => setAppState('battle') : undefined}
              />
            )}
            {appState === 'home' && <Home onPractice={() => { setFoundationBackTo('home'); setAppState('study'); }} onListeningStart={(chapter,index)=>{setAppMode('practice');handleSelectChapter(chapter,index,false,{startIndex:index,endIndex:index},'practice');}} onPickSubject={value => { if (isSubjectId(value) && isSubjectEnabled(value)) setSelectedSubject(value); }} onStudyMode={handleSelectMode} onGrowth={page => { setGrowthPage(page); navigateMain('growth'); }} onStart={handleStart} onIntro={handleIntro} onNoteList={() => setAppState('study_hub')} onLeaderboard={() => setAppState('leaderboard')} onBattle={FEATURES.battle ? () => setAppState('battle') : undefined} onChangeSubject={() => { setSubjectPickerReturnTo('home'); setSubjectPickerOrigin('start'); setAppState('subject_selection'); }} onFoundation={() => { setFoundationBackTo('home'); setAppState('foundation'); }} subjectLabel={getSubjectLabel(selectedSubject)} subject={selectedSubject} isGuest={isGuest} isBgmEnabled={isBgmEnabled} isBgmFadedOut={isBgmFadedOut} onToggleBgm={handleToggleBgm} />}
            {/* ★ルーティング側の門（4箇所のうちの3番目）★
                ナビのボタンを隠すだけでは、Home の「ランキングを見る」など
                別の導線からこの状態になれてしまう。
                描画の受け口でも同じフラグを見て、
                「見えないのに入れる」状態を作らない。 */}
            {appState === 'growth' && <React.Suspense fallback={<ScreenLoading />}>
              <GrowthHub onRanking={() => navigateMain('leaderboard')} page={growthPage} onPage={setGrowthPage} onBack={() => navigateMain('home')} defaultSubject={selectedSubject}
                onBattle={FEATURES.battle ? () => navigateMain('battle') : undefined}
                onReview={() => { setStudyHubView({ tab: 'today', subjectTab: 'all' }); navigateMain('study_hub'); }}
                onStudy={() => { setFoundationBackTo('home'); navigateMain('study'); }}
                /* ★学習記録から「解きなおす／間違えた問題だけ解く」（2026-10-11）★ 復習ノートと同じ入口で、その大問を開く */
                onRetry={(t) => { void handleReviewNote({ chapterId: t.chapterId, questionId: t.questionId, subQuestionIds: t.wrongOnly ? t.subQuestionIds : undefined, wholeQuestion: !t.wrongOnly }); }}
                onFoundation={tab => { setFoundationTab(tab); setFoundationBackTo('home'); navigateMain('foundation'); }} />
            </React.Suspense>}
            {appState === 'leaderboard' && FEATURES.ranking && <Leaderboard onBack={() => setAppState('home')} isGuest={isGuest} initialChapterId={selectedChapterId} initialSubject={selectedSubject} onBattle={FEATURES.battle ? () => setAppState('battle') : undefined} />}
            {/* ★対戦モード（ルーティング側の門）★
                ホームのボタンを隠すだけでは、localStorage に残った
                appState='battle' から復元して入れてしまう。
                描画の受け口でも同じフラグを見る（既存のランキングと同じ作り）。 */}
            {(appState === 'battle' || battleReturnActive) && FEATURES.battle && (
              <div id="battle-screen-scroll" ref={battleScrollRef} hidden={appState !== 'battle'}
                className={appState === 'battle' ? `h-full min-h-0 overflow-y-auto overscroll-contain ${battleActive ? 'battle-no-nav' : 'pb-app-nav'}` : 'hidden'}>
              <BattleMode
                onExit={() => setAppState('home')}
                /* ★フレンド対戦はフレンドどうしだけ★ 対戦画面の「フレンドを追加」から設定のフレンドを開く */
                onOpenFriends={() => { setSettingsTab('friends'); navigateMain('settings'); }}
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
            {appState === 'intro' && <Intro onBack={() => setAppState('home')} onBattle={FEATURES.battle ? () => setAppState('battle') : undefined} />}
            {appState === 'mode_selection' && <ModeSelection onSelectMode={handleSelectMode} onBack={() => setAppState('home')} onChangeSubject={handleChangeStudySubject} subject={selectedSubject} onBattle={FEATURES.battle ? () => setAppState('battle') : undefined} />}
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
                  rememberedGroup={chapterGroups[selectedSubject]}
                  onGroupChange={(group) => setChapterGroups(prev => ({ ...prev, [selectedSubject]: group }))}
                  subject={selectedSubject}
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
                  onRetryWrong={(chapterId, targets) => startFocusedRetry(chapterId, targets, appMode)}
                  onNextChapter={(chapterId) => handleSelectChapter(chapterId, 0, false, null, appMode)}
                  onNextRound={(chapterId, index) => handleSelectChapter(chapterId, index, false, { startIndex: index, endIndex: index }, appMode)}
                  onHome={() => navigateMain('home')}
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
                  const measure = () => {
                    const isAndroid = Capacitor.getPlatform() === 'android';
                    const adGap = isAndroid ? ' + var(--ad-gap, 16px)' : '';
                    shell?.style.setProperty('--app-nav-h', `calc(${node.getBoundingClientRect().height}px + var(--ad-bottom-h, 0px)${adGap})`);
                  };
                  measure();
                  const observer = new ResizeObserver(measure);
                  observer.observe(node);
                  return () => observer.disconnect();
                }}
                items={[
                  { id: 'home', label: 'ホーム', ariaLabel: 'ホーム画面へ移動', current: appState === 'home', onClick: () => navigateMain('home') },
                  // ★「学習」は必ず教科の選択画面（演習する）へ（2026-10-04）★
                  //   以前は「前回の学習画面（英文法の単元一覧など）」に戻していたため、押すたびに出る画面が違い、
                  //   学習画面の中で押しても反応しなかった。いつ押しても同じ入口に着くようにする。
                  { id: 'study', label: '学習', ariaLabel: '学習画面へ移動', current: appState === 'study', onClick: () => {
                    setFoundationBackTo('home');
                    navigateMain('study');
                    requestAnimationFrame(() => document.querySelector('.app-shell')?.scrollTo?.({ top: 0 }));
                  } },
                  // 対戦はランキングより前（結果を見る画面より先）。FEATURES.battle が false なら席ごと消す
                  { id: 'battle', label: '対戦', ariaLabel: 'オンライン対戦へ移動', current: appState === 'battle', hidden: !FEATURES.battle, onClick: () => navigateMain('battle') },
                  { id: 'gacha', label: 'ガチャ', ariaLabel: 'ガチャ画面へ移動', current: appState === 'growth' && growthPage === 'gacha', onClick: () => { setGrowthPage('gacha'); navigateMain('growth'); } },
                  { id: 'mypage', label: 'マイページ', ariaLabel: 'マイページへ移動', current: appState === 'growth' && growthPage !== 'gacha' && growthPage !== 'rush', onClick: () => { setGrowthPage('overview'); navigateMain('growth'); } },
                  { id: 'settings', label: '設定', ariaLabel: pendingFriendRequests > 0 ? `設定画面へ移動（フレンド申請が${pendingFriendRequests}件届いています）` : '設定画面へ移動',
                    current: appState === 'settings', badge: pendingFriendRequests, onClick: () => navigateMain('settings') },
                ]}
              />
            )}
          </div>
        </div>
      </>

      {/* バナー広告の場所（今は OFF なので何も描かない。src/ads/adConfig.ts で有効にする） */}
      {/* PDF を開いている間は 'pdf'（広告を出さない画面）として扱う */}
      <AdBannerSlot screen={pdfOpen ? 'pdf' : appState === 'battle' && battleActive ? 'battle_live' : appState} />
      {/* アプリ内の PDF ビュー（どの画面からでも openPdf() で開く。戻るボタン・Esc で閉じる） */}
      <PdfViewerHost />

      {/* ミッション達成のお知らせ（どの画面でも上に出る。「報酬を受け取る」はその場で受け取る・2026-10-11） */}
      <React.Suspense fallback={null}>
        <MissionToast />
      </React.Suspense>

    </>
  );
}
