import { readCode } from './helpers/sourceScan';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { restoreAppState, restoreAppMode, restoreQuizRange, restoreSelectedSubject, isScreenshotLaunch } from '../src/hooks/useAppPersistence';
import { isAppState, isAppMode } from '../src/App';
import { STORAGE_KEYS } from '../src/utils/storageKeysCatalog';
import { safeGetItem, safeRemoveItem, safeParseJson, readStoredJson, isPlainObject } from '../src/utils/safeLocalStorage';

/**
 * C-01 / C-17 / C-18：App.tsx から移した「起動時の復元」と、端末ストレージの安全な読み書き。
 * 復元の規則は分離前と同じであることを固定する。
 */
class MemoryStorage implements Storage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
}
const g = globalThis as { localStorage?: Storage; window?: unknown };
let saved: Storage | undefined;
beforeEach(() => { saved = g.localStorage; g.localStorage = new MemoryStorage(); });
afterEach(() => { g.localStorage = saved; });

describe('キーの一覧（値は既存の端末データの在り処なので変えない）', () => {
  it('固定名のキーの値', () => {
    expect(STORAGE_KEYS).toEqual({
      appState: 'savedAppState', appMode: 'savedAppMode', selectedChapterId: 'savedSelectedChapterId',
      quizRange: 'savedQuizRange', quizAnswers: 'savedQuizAnswers', isGuest: 'savedIsGuest',
      // 2026-10-19 ログイン必須化（#47）の「この端末だけで続ける」の印。値は #47 の LOGIN_FALLBACK_KEY と同じ
      loginFallbackLocal: 'login_fallback_local_v1',
      selectedSubject: 'savedSelectedSubject', lastLearnState: 'savedLastLearnState',
      hasCompletedOnboarding: 'hasCompletedOnboarding', screenshotMode: 'screenshot_mode', noAds: 'no_ads',
      studyCatalogSubject: 'study_catalog_subject_v1', studyCatalogLast: 'study_catalog_last_v1',
    });
  });
});

describe('起動時の復元（useAppPersistence）', () => {
  it('画面：保存値 → 案内済みならホーム → 初回は案内', () => {
    expect(restoreAppState()).toBe('onboarding');
    localStorage.setItem('hasCompletedOnboarding', 'true');
    expect(restoreAppState()).toBe('home');
    localStorage.setItem('savedAppState', 'study_hub');
    expect(restoreAppState()).toBe('study_hub');
    localStorage.setItem('savedAppState', 'flowchart'); // 統合版の古い画面名は復元しない
    expect(restoreAppState()).toBe('home');
  });
  it('ゲストの印：古い savedIsGuest は引き継がず、「この端末だけで続ける」の印だけを読む（#47）', () => {
    // このテスト環境はフックを描画できない（jsdom なし）ので、読み書きするキーをソースで確かめる
    const code = readCode('src/hooks/useAppPersistence.ts');
    expect(code).toContain('safeGetItem(STORAGE_KEYS.loginFallbackLocal)');
    expect(code).not.toContain('safeGetItem(STORAGE_KEYS.isGuest)');
    expect(code).toContain('safeRemoveItem(STORAGE_KEYS.isGuest)');
  });
  it('画面検証の起動（screenshot_mode）はホームから', () => {
    localStorage.setItem('screenshot_mode', 'true');
    // window が無い環境では URL を読めないので、画面検証かどうかは false（従来どおり）
    expect(isScreenshotLaunch()).toBe(typeof window !== 'undefined');
  });
  it('学び方：保存値が正しくなければ practice', () => {
    expect(restoreAppMode()).toBe('practice');
    localStorage.setItem('savedAppMode', 'mini_test');
    expect(restoreAppMode()).toBe('mini_test');
    localStorage.setItem('savedAppMode', 'xxx');
    expect(restoreAppMode()).toBe('practice');
  });
  it('範囲：形が正しいときだけ。壊れた JSON・逆順・負の数・小数は null', () => {
    expect(restoreQuizRange()).toBeNull();
    localStorage.setItem('savedQuizRange', '{"startIndex":2,"endIndex":4,"extra":1}');
    expect(restoreQuizRange()).toEqual({ startIndex: 2, endIndex: 4 });
    for (const bad of ['{', '[]', 'null', '{"startIndex":3,"endIndex":1}', '{"startIndex":-1,"endIndex":1}', '{"startIndex":0.5,"endIndex":1}']) {
      localStorage.setItem('savedQuizRange', bad);
      expect(restoreQuizRange(), bad).toBeNull();
    }
  });
  it('科目：公開中の科目だけ。壊れた値は公開中の先頭へ', () => {
    localStorage.setItem('savedSelectedSubject', 'english_grammar');
    expect(restoreSelectedSubject()).toBe('english_grammar');
    localStorage.setItem('savedSelectedSubject', 'chemistry_basic');
    expect(restoreSelectedSubject()).toBe('english_listening');
  });
  it('App.tsx から isAppState / isAppMode が従来どおり取れる（re-export）', () => {
    expect(isAppState('home')).toBe(true);
    expect(isAppState('learning')).toBe(false);
    expect(isAppMode('learning')).toBe(true);
  });
});

describe('localStorage を参照しただけで例外が飛ぶ端末（iOS プライベートブラウズ）でも止まらない（C-17）', () => {
  it('safeGetItem / safeRemoveItem / 復元はすべて既定値に倒れる', () => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new DOMException('denied', 'SecurityError'); } });
    try {
      expect(safeGetItem('savedAppState')).toBeNull();
      expect(safeRemoveItem('savedAppState')).toBe(false);
      expect(restoreAppState()).toBe('onboarding');
      expect(restoreAppMode()).toBe('practice');
      expect(restoreQuizRange()).toBeNull();
    } finally {
      Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: new MemoryStorage() });
    }
  });
});

describe('safeParseJson（C-18）', () => {
  it('壊れている・空・型が違うときは既定値', () => {
    expect(safeParseJson(null, 1)).toBe(1);
    expect(safeParseJson('', 1)).toBe(1);
    expect(safeParseJson('{', [])).toEqual([]);
    expect(safeParseJson('{"a":1}', [], Array.isArray)).toEqual([]);
    expect(safeParseJson('[1,2]', [], Array.isArray)).toEqual([1, 2]);
    expect(safeParseJson('{"a":1}', {}, isPlainObject)).toEqual({ a: 1 });
    expect(safeParseJson('[1]', {}, isPlainObject)).toEqual({});
  });
  it('readStoredJson はキーから読む', () => {
    localStorage.setItem('k', '{"x":2}');
    expect(readStoredJson('k', {}, isPlainObject)).toEqual({ x: 2 });
    expect(readStoredJson('missing', 'd')).toBe('d');
  });
});
