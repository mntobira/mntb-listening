/**
 * ===================================================================
 * 「閉じた場所から続けられる」ための、画面状態の復元と保存（C-01: App.tsx から分離）
 * ===================================================================
 *
 * ■ 何を持つか
 *   appState / appMode / selectedChapterId / quizRange / quizAnswers / isGuest / selectedSubject
 *   の7つ。どれも「起動時に端末から復元し、変わるたびに端末へ書く」だけの値。
 *   App.tsx にあった useState 7個と保存の useEffect 9個を、そのままここへ移した。
 *
 * ■ 変えていないこと（外部挙動は完全に同じ）
 *   ・復元の規則（保存値の検査・既定値・スクリーンショット起動・初回案内の判定）
 *   ・保存するキー名と書く値（STORAGE_KEYS の値は従来の文字列そのもの）
 *   ・保存の順番（useEffect の宣言順）と、保存しないもの（理科のタブなど）
 *
 * ■ 変えたこと（C-17：端末ストレージの耐障害性）
 *   生の localStorage.getItem / removeItem をやめ、safeGetItem / safeRemoveItem を通す。
 *   iOS Safari のプライベートブラウズでは localStorage を参照しただけで例外が飛び、
 *   useState の初期化（描画中）で投げると画面全体が止まっていた。読めなければ「保存なし」と同じに倒す。
 */
import { useEffect, useState } from 'react';
import { isAppMode, isAppState, type AppMode, type AppState } from '../appState';
import { isSubjectId, type SubjectId } from '../data/subjectLabels';
import { DEFAULT_SUBJECT, SUBJECT_IDS } from '../data/subjects';
import { fallbackSubjectId, isSubjectEnabled } from '../config/features';
import { parseStoredStringRecord } from '../utils/progress';
import { isPlainObject, safeGetItem, safeParseJson, safeRemoveItem } from '../utils/safeLocalStorage';
import { safeSetItem } from '../utils/storageGuard';
import { isLearningScreen } from '../utils/studyNavigation';
import { STORAGE_KEYS } from '../utils/storageKeysCatalog';

/** 「この範囲だけを1回として解く」範囲（両端を含む・章内の通し番号） */
export type QuizRange = { startIndex: number; endIndex: number };

/** URL の ?screenshot=1 か、端末の screenshot_mode（画面検証用の起動） */
export function isScreenshotLaunch(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const p = new URLSearchParams(window.location.search);
    return p.get('screenshot') === '1' || safeGetItem(STORAGE_KEYS.screenshotMode) === 'true';
  } catch {
    return false; // URL が読めない環境は通常の起動に倒す
  }
}

/** 起動したときの画面。保存値 → 画面検証・案内済みならホーム → 初回は案内 */
export function restoreAppState(): AppState {
  const saved = safeGetItem(STORAGE_KEYS.appState);
  if (isAppState(saved)) return saved;
  if (isScreenshotLaunch() || safeGetItem(STORAGE_KEYS.hasCompletedOnboarding) === 'true') return 'home';
  return 'onboarding';
}

export function restoreAppMode(): AppMode {
  const saved = safeGetItem(STORAGE_KEYS.appMode);
  return isAppMode(saved) ? saved : 'practice';
}

function isQuizRange(value: unknown): value is QuizRange {
  return isPlainObject(value) &&
    Number.isSafeInteger(value.startIndex) && (value.startIndex as number) >= 0 &&
    Number.isSafeInteger(value.endIndex) && (value.endIndex as number) >= (value.startIndex as number);
}

/** 保存されていた範囲。壊れている・形が違うときは null（章の全問） */
export function restoreQuizRange(): QuizRange | null {
  const parsed = safeParseJson<QuizRange | null>(safeGetItem(STORAGE_KEYS.quizRange), null, isQuizRange);
  return parsed ? { startIndex: parsed.startIndex, endIndex: parsed.endIndex } : null;
}

/**
 * 保存されていた科目。
 *   ★ここがルーティング側の門（4箇所のうちの3番目）★
 *   1. isSubjectId      … 科目IDとして成立しているか
 *   2. isSubjectEnabled … いま公開している科目か（非公開にした科目へ復元しない）
 *   戻す先は公開中のものから選ぶ。公開中が1つも無いときだけ登録簿の先頭（画面が真っ白になるのを避ける受け皿）。
 */
export function restoreSelectedSubject(): SubjectId {
  const saved = safeGetItem(STORAGE_KEYS.selectedSubject);
  if (isSubjectId(saved) && isSubjectEnabled(saved)) return saved;
  const fallback = fallbackSubjectId(SUBJECT_IDS);
  return (fallback as SubjectId) ?? DEFAULT_SUBJECT;
}

/** 値があれば書き、無ければ消す */
function writeOrRemove(key: string, value: string | null): void {
  if (value) safeSetItem(key, value);
  else safeRemoveItem(key);
}

export function useAppPersistence() {
  const [appState, setAppState] = useState<AppState>(restoreAppState);
  const [appMode, setAppMode] = useState<AppMode>(restoreAppMode);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(() => safeGetItem(STORAGE_KEYS.selectedChapterId));
  /*
   * quizRange（「今回はこの範囲だけを解く」）を localStorage に載せている理由：
   *   演習中にアプリを閉じて開き直したとき、範囲を忘れていると
   *   「第3回だけのはずが章の最後まで続く」ことになり、選んだ回と実際に解く範囲が食い違う。
   *   章IDを回ごとに分けないのは、保存キー・進捗台帳・ランキングの宛先が変わって記録が迷子になるため。
   */
  const [quizRange, setQuizRange] = useState<QuizRange | null>(restoreQuizRange);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>(() =>
    parseStoredStringRecord(safeGetItem(STORAGE_KEYS.quizAnswers)),
  );
  /*
   * isGuest ＝「ログインせずに、この端末だけで使っている」状態。
   * 2026-10-19 ゲストで始める入口は廃止した（ログイン必須）。
   * ただし「ログインがどうしても通らない／オンライン機能が設定前」のときに
   * アプリへ入れなくなるのが一番まずいので、ログイン画面で失敗したときだけ
   * 「この端末だけで続ける」を出す（Onboarding の onOffline）。その印が STORAGE_KEYS.loginFallbackLocal。
   * 以前のゲスト（savedIsGuest）は引き継がない＝次の起動でログイン画面が出る。
   * ログインすると、この端末の記録は userDataSync.migrateGuestData でアカウントへ移る。
   */
  const [isGuest, setIsGuest] = useState(() => safeGetItem(STORAGE_KEYS.loginFallbackLocal) === 'true');
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>(restoreSelectedSubject);

  useEffect(() => { safeSetItem(STORAGE_KEYS.appState, appState); }, [appState]);
  useEffect(() => { safeSetItem(STORAGE_KEYS.appMode, appMode); }, [appMode]);
  useEffect(() => { writeOrRemove(STORAGE_KEYS.selectedChapterId, selectedChapterId); }, [selectedChapterId]);
  useEffect(() => { writeOrRemove(STORAGE_KEYS.quizRange, quizRange ? JSON.stringify(quizRange) : null); }, [quizRange]);
  useEffect(() => { safeSetItem(STORAGE_KEYS.quizAnswers, JSON.stringify(quizAnswers)); }, [quizAnswers]);
  useEffect(() => {
    safeSetItem(STORAGE_KEYS.loginFallbackLocal, isGuest.toString());
    safeRemoveItem(STORAGE_KEYS.isGuest); // 古い印の掃除。消せなくても読まないので害はない
  }, [isGuest]);
  useEffect(() => { safeSetItem(STORAGE_KEYS.selectedSubject, selectedSubject); }, [selectedSubject]);
  useEffect(() => {
    if (isLearningScreen(appState)) safeSetItem(STORAGE_KEYS.lastLearnState, appState);
  }, [appState]);

  return {
    appState, setAppState,
    appMode, setAppMode,
    selectedChapterId, setSelectedChapterId,
    quizRange, setQuizRange,
    quizAnswers, setQuizAnswers,
    isGuest, setIsGuest,
    selectedSubject, setSelectedSubject,
  };
}
