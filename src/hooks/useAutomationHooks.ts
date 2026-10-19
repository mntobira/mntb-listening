import { useEffect, useRef } from 'react';

/**
 * 画面検証（スクリーンショット・E2E）用に window へ公開する操作。
 *
 * 以前は App.tsx の useEffect(..., []) の中で直接 window に代入しており、
 * 初回描画時の handleSelectChapter を掴み続ける（stale closure）問題があった。
 * ここでは最新の操作を ref に入れ替え続け、window の関数は ref を経由して呼ぶ。
 */
export interface AutomationHooks {
  enterApp: () => void;
  /**
   * 画面名（App の AppState）。ここで App を import すると循環参照になるため、
   * 型は呼び出し側（App.tsx）の引数で絞る。
   */
  setAppState: (state: never) => void;
  /** 成長ハブのページ名（GrowthHub の GrowthPage） */
  setGrowthPage: (page: never) => void;
  selectChapter: (chapterId: string, index?: number) => void;
  navigateQuiz: (chapterId?: string) => void;
  navigateExplanation: (chapterId?: string) => void;
}

/** window 上の公開名（既存のスクリプトが使う名前なので変えない） */
const GLOBAL_NAMES: Record<keyof AutomationHooks, string> = {
  enterApp: '__ENTER_APP__',
  setAppState: '__SET_APP_STATE__',
  setGrowthPage: '__SET_GROWTH_PAGE__',
  selectChapter: '__SELECT_CHAPTER__',
  navigateQuiz: '__NAVIGATE_QUIZ__',
  navigateExplanation: '__NAVIGATE_EXPLANATION__',
};

export function useAutomationHooks(hooks: AutomationHooks): void {
  const latest = useRef(hooks);
  latest.current = hooks;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const target = window as unknown as Record<string, unknown>;
    (Object.keys(GLOBAL_NAMES) as (keyof AutomationHooks)[]).forEach((key) => {
      target[GLOBAL_NAMES[key]] = (...args: unknown[]) =>
        (latest.current[key] as (...a: unknown[]) => void)(...args);
    });
  }, []);
}
