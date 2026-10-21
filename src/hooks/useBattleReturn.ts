/**
 * 対戦から演習へ出かけて、また対戦へ戻ってくるための状態（C-01: App.tsx から分離）。
 *
 *   ・battleReturnActive … 「対戦に戻る」導線を出しているか
 *       対戦・演習・解説以外の画面へ移ったら消す／ログインし直して別の人になったら消す
 *   ・対戦画面のスクロール位置を覚えておき、戻ったときに次のフレームで戻す
 *   ・ログインしたら、積み上げ（満点・レベル）を端末共通に同期する予約を入れる
 *
 * 中身は App.tsx にあったときと同じ（useEffect 3個と returnToBattle）。
 */
import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { logRejection } from '../utils/reportError';
import type { AppState } from '../appState';

export function useBattleReturn(appState: AppState, setAppState: (s: AppState) => void) {
  const [battleReturnActive, setBattleReturnActive] = useState(false);
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
      if (user && !user.isAnonymous) void import('../utils/achievementsSync').then(m => m.scheduleAchievementsSync(1500)).catch(logRejection('achievements.scheduleSync'));
    });
  }, []);
  const returnToBattle = () => {
    restoreBattleScroll.current = true;
    setBattleReturnActive(false);
    setAppState('battle');
  };
  /** 対戦画面のいまのスクロール位置を覚える（演習へ出かける直前に呼ぶ） */
  const rememberBattleScroll = () => {
    savedBattleScroll.current = battleScrollRef.current?.scrollTop || 0;
  };
  return { battleReturnActive, setBattleReturnActive, battleScrollRef, returnToBattle, rememberBattleScroll };
}
