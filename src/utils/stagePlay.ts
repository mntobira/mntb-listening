import { recordStagePlay, type StageRecord } from './stageRecords';
import { logRejection } from './reportError';

/**
 * ステージの挑戦を記録し、ログイン中なら端末共通の集計（achievementsSync）へ送る予約をする。
 *
 * 以前は stageRecords.ts（保存の層）が achievementsSync.ts（通信の層）を呼び、
 * achievementsSync.ts も stageRecords.ts を読むという循環参照になっていた。
 * 「保存」と「送信」を分け、両方を使うこの関数を上に置くことで依存を一方向にする。
 * 送信は遅延読み込み・失敗しても学習は止めない（従来どおり）。
 */
export function recordStagePlayAndSync(
  uid: string | null | undefined,
  key: string,
  title: string,
  correct: number,
  judgeable: number,
  now = Date.now(),
): StageRecord | null {
  const record = recordStagePlay(uid, key, title, correct, judgeable, now);
  if (record && uid && uid !== 'guest') {
    void import('./achievementsSync').then((m) => m.scheduleAchievementsSync()).catch(logRejection('achievements.scheduleSync'));
  }
  return record;
}
