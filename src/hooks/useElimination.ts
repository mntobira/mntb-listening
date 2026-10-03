/**
 * =====================================================================
 * 消去法（選択肢に斜線を引く）のしくみをまとめたフック
 * =====================================================================
 * ■ なぜ Quiz.tsx から切り出したのか
 *   消去状態そのもの・端末への保存・斜線を引く／戻す・長押しでまとめて戻す・
 *   操作説明の初回表示、という 5 つの関心が Quiz.tsx の中で
 *   約 110 行にわたって混ざっていた。どれも「選択肢に斜線を引く」という
 *   1 つの機能の部品なので、まとめて 1 ファイルにした。
 *
 * ■ いちばん大事な設計（ここは変えてはいけない）
 *   消去状態は採点対象の解答（answers）とは *完全に別* に持つ。
 *   混ぜると「消したつもりが解答になっていた」という取り違えが起きる。
 *   採点は answers のみを見て、消去は見た目にだけ効く。
 *
 * ■ 動きは 1 バイトも変えていない
 *   保存キー・長押し 500ms・振動 30ms・\u0000 区切り・
 *   「斜線が1つも無いときは長押ししても何も起きない」という条件、
 *   すべて Quiz.tsx にあったときと同一。
 */
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { parseStoredStringArrayRecord } from '../utils/progress';
import { quizElimKey } from '../utils/quizStorageKeys';
import { safeSetItem } from '../utils/storageGuard';

/**
 * ★消去法の操作説明（タップで選択→斜線→…）を見たかどうかの保存キー。
 *   章・モードに依らずアプリ全体で1回だけ表示する（操作はどこでも同じなので）。
 *   消去状態の保存キー（quizElimKey が作る quiz_elim_<章>_<モード>）とは別物。
 */
export const ELIM_HINT_SEEN_KEY = 'quiz_elim_hint_seen';

export interface UseEliminationResult {
  /** { [設問ID]: 消去した選択肢の配列 }。選択肢の文字列で持つ。 */
  eliminated: Record<string, string[]>;
  isEliminated: (sqId: string, opt: string) => boolean;
  strikeOption: (sqId: string, opt: string) => void;
  restoreOption: (sqId: string, opt: string) => void;
  clearEliminated: (sqId: string) => void;
  /** 斜線を引き、同時にアニメーション対象として記録する。 */
  strikeOptionAnimated: (sqId: string, opt: string) => void;
  /** 直前に斜線を引いた選択肢のキー（`${設問ID}\u0000${選択肢}`）。 */
  justStruck: string | null;
  beginLongPress: (sqId: string) => void;
  endLongPress: () => void;
  /** 長押しが成立したので指を離したときの onClick を無視する、というフラグ。 */
  longPressFired: React.MutableRefObject<boolean>;
  elimHintOpen: boolean;
  setElimHintOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dismissElimHint: () => void;
}

/**
 * @param chapterId 保存キーに使う章ID
 * @param mode      保存キーに使うモード（practice / exam など）
 */
export function useElimination(chapterId: string, mode: string): UseEliminationResult {
  // ■ 消去状態を answers と分けて持つ理由
  //   同じ入れ物にすると「消しただけ」と「解答として選んだ」の
  //   取り違えが起きる。採点対象は answers のみ、消去は表示だけに効く、
  //   と役割を分けることで誤答リスクを無くす。
  //
  // ■ 形
  //   { [設問ID]: 消去した選択肢の配列 }
  //   選択肢そのものの文字列で持つ（並び替えや添字ズレに影響されないため）。
  const [eliminated, setEliminated] = useState<Record<string, string[]>>(() =>
    parseStoredStringArrayRecord(localStorage.getItem(quizElimKey(chapterId, mode))),
  );

  // ★消去法の操作説明（タップで選択→斜線→…）は初回だけ表示する（ご要望）。
  //   毎問同じ説明が並ぶと選択肢の視認性を下げるので、
  //   一度でも見たら隠し、代わりに「?」アイコンで呼び出せるようにする。
  const [elimHintOpen, setElimHintOpen] = useState<boolean>(() => {
    try { return localStorage.getItem(ELIM_HINT_SEEN_KEY) !== 'true'; } catch { return true; }
  });
  /** 初回表示を「見た」ことにして閉じる（以降は ? アイコンから開閉） */
  const dismissElimHint = () => {
    setElimHintOpen(false);
    try { safeSetItem(ELIM_HINT_SEEN_KEY, 'true'); } catch { /* 保存不可でも表示は閉じる */ }
  };

  useEffect(() => {
    safeSetItem(quizElimKey(chapterId, mode), JSON.stringify(eliminated));
  }, [eliminated, chapterId, mode]);

  /** ある設問で、その選択肢が消去済みか。 */
  const isEliminated = (sqId: string, opt: string) =>
    (eliminated[sqId] || []).includes(opt);

  /** 斜線を引く（消去する）。 */
  const strikeOption = (sqId: string, opt: string) => {
    setEliminated((prev) => {
      const cur = prev[sqId] || [];
      if (cur.includes(opt)) return prev;
      return { ...prev, [sqId]: [...cur, opt] };
    });
  };

  /** 斜線を消して候補に戻す。 */
  const restoreOption = (sqId: string, opt: string) => {
    setEliminated((prev) => {
      const cur = prev[sqId] || [];
      if (!cur.includes(opt)) return prev;
      return { ...prev, [sqId]: cur.filter((o) => o !== opt) };
    });
  };

  /**
   * その設問の斜線をすべて消す（長押しで一気にリセット）。
   *
   * ご指摘「事故的に選択肢を復活させてしまうリスク」への対応。
   * 1つずつタップして戻すと、戻す途中で別の選択肢を誤って選んでしまう
   * （＝解答が入ってしまう）ことがある。まとめて白紙に戻す道を用意して、
   * 「やり直したい」ときに解答を触らずに済むようにする。
   */
  const clearEliminated = (sqId: string) => {
    setEliminated((prev) => {
      if (!(prev[sqId] || []).length) return prev;
      const next = { ...prev };
      delete next[sqId];
      return next;
    });
  };

  // 直前に斜線を引いた選択肢（アニメーションを1回だけ流すためのキー）。
  // `${設問ID}\u0000${選択肢}` の形で持つ。区切りに \u0000 を使うのは
  // 選択肢の文字列に現れ得ない文字にして衝突を避けるため。
  const [justStruck, setJustStruck] = useState<string | null>(null);

  /** 斜線を引き、同時にアニメーション対象として記録する。 */
  const strikeOptionAnimated = (sqId: string, opt: string) => {
    strikeOption(sqId, opt);
    setJustStruck(`${sqId}\u0000${opt}`);
  };

  // 長押し判定用。押し始めのタイマーと、「長押しが成立したので
  // 指を離したときの通常タップ（onClick）は無視する」フラグを持つ。
  const longPressTimer = useRef<number | null>(null);
  const longPressFired = useRef(false);

  /** 長押し開始（500ms 押し続けたら、その設問の斜線を全部消す）。 */
  const beginLongPress = (sqId: string) => {
    longPressFired.current = false;
    if (longPressTimer.current !== null) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => {
      longPressTimer.current = null;
      // 斜線が1つも無いなら何も起きない（誤爆しても害がない）
      if (!(eliminated[sqId] || []).length) return;
      longPressFired.current = true;
      clearEliminated(sqId);
      // 端末が対応していれば触覚で「まとめて戻した」ことを伝える
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(30);
      }
    }, 500);
  };

  /** 長押し解除（指を離した／指が外れた／スクロールした）。 */
  const endLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // 設問が変わる・アンマウントされるときにタイマーを残さない
  useEffect(() => () => endLongPress(), []);

  return {
    eliminated,
    isEliminated,
    strikeOption,
    restoreOption,
    clearEliminated,
    strikeOptionAnimated,
    justStruck,
    beginLongPress,
    endLongPress,
    longPressFired,
    elimHintOpen,
    setElimHintOpen,
    dismissElimHint,
  };
}
