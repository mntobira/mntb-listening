/**
 * 志望校と、単語帳の「目標」（出題範囲のプリセット）の保存（2026-10-01 夜）。
 *
 * 単語帳（FoundationWords）と設定（ProfileModal）の両方から読み書きするので、
 * 重いデータを読み込まない小さなモジュールに分けた。保存先は以前と同じ localStorage のキー。
 */
import { safeLocalStorage } from './safeLocalStorage';

export const VOCAB_PREF_KEY = 'foundation_prefs_v1';

/** 単語帳の目標（ラベルは FoundationWords の PRESETS と同じ） */
export const GOAL_OPTIONS = [
  { id: 'common', label: '共通6〜8割' },
  { id: 'national', label: '2次試験レベル' },
  { id: 'private', label: '2次＋追加語彙' },
  { id: 'custom', label: '自分で選ぶ' },
] as const;
export type GoalId = typeof GOAL_OPTIONS[number]['id'];

function readRaw(): Record<string, unknown> {
  try {
    const v = JSON.parse(safeLocalStorage()?.getItem(VOCAB_PREF_KEY) || '{}');
    return v && typeof v === 'object' ? v : {};
  } catch { return {}; }
}

export function readGoal(): GoalId {
  const p = readRaw().preset;
  return GOAL_OPTIONS.some(o => o.id === p) ? (p as GoalId) : 'common';
}

/** 目標を変える（単語帳で選んだ「志望校別」のレベルなど、ほかの設定は残す） */
export function writeGoal(id: GoalId): void {
  try { safeLocalStorage()?.setItem(VOCAB_PREF_KEY, JSON.stringify({ ...readRaw(), preset: id })); } catch { /* 保存できなくても続ける */ }
}

/** 志望校名は名前と違って他人に見せないので、長さだけ整える */
export const TARGET_SCHOOL_MAX = 40;
export function normalizeTargetSchool(v: string): string {
  return v.replace(/\s+/g, ' ').trim().slice(0, TARGET_SCHOOL_MAX);
}
