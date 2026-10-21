/**
 * 画面名（AppState）と学び方（AppMode）の定義と、保存値の検査（C-01: App.tsx から分離）。
 *   hooks（useAppPersistence など）が App.tsx を import すると循環するので、型と検査はここに置く。
 *   App.tsx からも従来どおり export している（import { isAppState } from './App' は変わらず動く）。
 *   このファイルは他の src を import しない葉モジュール。
 */
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
