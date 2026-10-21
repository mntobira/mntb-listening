/**
 * ===================================================================
 * 裏で動く通信（C-01: App.tsx から分離）
 * ===================================================================
 *   画面の描画とは関係なく、起動中ずっと裏で回る通信をここに集めた。
 *   App.tsx にあった useEffect 6個を、中身を変えずにそのまま移している。
 *
 *   1. フレンド申請の件数を1分ごとに確認（見えているときだけ）→ 設定ボタンのバッジ
 *   2. 送れずに溜まったフィードバックの再送（起動 2.5 秒後・オンライン復帰時）
 *   3. 利用状況の記録（ログイン状態が決まってから・24時間に1回まで）
 *   4. ランキングへの参加登録（Google 連携が確定したら 0pt の枠を作る）
 *   5. 学習進捗・復習リストのクラウド同期（ログイン直後に取り込み・ログアウトで状態を捨てる）
 *   6. 画面を離れるときの未送信データの送信（pagehide / visibilitychange）
 *
 *   どれも失敗してもアプリは止めない（logRejection で記録だけする）。
 */
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { countIncomingFriendRequests } from '../utils/friends';
import { flushFeedbackQueue, getFeedbackWebhookUrl } from '../utils/feedback';
import { recordUserPresence } from '../utils/userRegistry';
import { ensureRankingEntry } from '../utils/leaderboard';
import { pullStudyData, installStudySyncFlush, resetStudySyncState } from '../utils/studySync';
import { startUserDataSync, stopUserDataSync, installUserDataSyncFlush, USER_DATA_SYNCED_EVENT } from '../utils/userDataSync';
import { installUsageFlush } from '../utils/analytics';
import { rescheduleReminders } from '../utils/studyRemindersRuntime';
import { logRejection } from '../utils/reportError';

/**
 * @param appState 画面が変わるたびにフレンド申請件数を取り直す（設定を閉じた直後に承諾/拒否を反映する）
 * @returns 届いているフレンド申請の件数
 */
export function useAppBackgroundSync(appState: string): { pendingFriendRequests: number } {
  const [pendingFriendRequests, setPendingFriendRequests] = useState(0);

  // 1. フレンド申請件数を定期的に確認する（ログイン時のみ）。
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

  // 2. 送信に失敗して端末に溜まっているフィードバックを、起動時とオンライン復帰時に自動再送する。
  //    （電波の悪い教室や機内モードで書いた意見を取りこぼさないための保険）
  useEffect(() => {
    const flush = () => { void flushFeedbackQueue().catch(logRejection('feedback.flushQueue')); };
    const timer = window.setTimeout(flush, 2500);
    window.addEventListener('online', flush);
    return () => { window.clearTimeout(timer); window.removeEventListener('online', flush); };
  }, []);

  // 3. 利用状況（総ユーザー数・登録 Google アカウント）を記録する。
  //    初回と「前回から24時間以上あいたとき」だけ記録される（判定は userRegistry 側）。
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => {
      window.setTimeout(() => {
        void recordUserPresence(getFeedbackWebhookUrl()).catch(logRejection('presence.record'));
      }, 4000);
    });
    return unsub;
  }, []);

  // 4. ランキングへの参加登録（0pt のユーザーも掲載する）。
  //    既にスコアがある人は名前とアイコンの更新だけが走る（スコアは触らない）。
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) return; // ゲストは掲載対象外
      window.setTimeout(() => {
        void ensureRankingEntry().catch(logRejection('ranking.ensureEntry'));
      }, 3000);
    });
    return unsub;
  }, []);

  // 5. 学習進捗・復習リストのクラウド同期。上書きではなくマージ（オフラインで解いた分も残る）。
  //    ゲストは同期しない（他人の記録と混ざらないようにする）。
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

  // 6. 画面を離れるとき（スマホでアプリを切り替えたときを含む）に未送信の学習データを送る。
  //    iOS Safari は beforeunload が発火しないことがあるため pagehide / visibilitychange を使う。
  useEffect(() => installStudySyncFlush(), []);
  useEffect(() => installUserDataSyncFlush(), []);
  useEffect(() => installUsageFlush(), []);
  // 7. 学習のお知らせ（通知）：開いたとき・裏から戻ったときに予約し直す（復習日・連続日数が変わるため）
  useEffect(() => {
    const again = () => { if (document.visibilityState !== 'hidden') void rescheduleReminders(); };
    const t = window.setTimeout(again, 3000);
    document.addEventListener('visibilitychange', again);
    window.addEventListener(USER_DATA_SYNCED_EVENT, again);
    return () => { window.clearTimeout(t); document.removeEventListener('visibilitychange', again); window.removeEventListener(USER_DATA_SYNCED_EVENT, again); };
  }, []);

  return { pendingFriendRequests };
}
