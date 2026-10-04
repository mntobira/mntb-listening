// src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { safeSetItem } from '../utils/storageGuard';

type Theme = 'light' | 'dark';
type ThemePref = Theme | 'system';

interface ThemeContextValue {
  theme: Theme;          // 実際に適用されているテーマ
  preference: ThemePref; // ユーザーが選んだ設定
  setPreference: (p: ThemePref) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'chembasis.theme';

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePref>(() => {
    if (typeof window === 'undefined') return 'system';
    return (localStorage.getItem(STORAGE_KEY) as ThemePref) || 'system';
  });

  const [theme, setTheme] = useState<Theme>(() =>
    preference === 'system' ? getSystemTheme() : (preference as Theme)
  );

  // システムテーマ変化を監視
  useEffect(() => {
    if (preference !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preference]);

  // 設定変更時の実テーマ反映
  useEffect(() => {
    const next = preference === 'system' ? getSystemTheme() : preference;
    setTheme(next);
  }, [preference]);

  // DOMに反映
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    // PWA テーマカラーも更新
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#0F1620' : '#F4F1EA');
    }
  }, [theme]);

  const setPreference = useCallback((p: ThemePref) => {
    setPreferenceState(p);
    safeSetItem(STORAGE_KEY, p);
  }, []);

  const toggle = useCallback(() => {
    setPreference(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setPreference]);

  return (
    <ThemeContext.Provider value={{ theme, preference, setPreference, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
