/**
 * ===================================================================
 * 対戦部屋の「通信」（C-07: useBattleRoom.ts から分離）
 * ===================================================================
 *   ・部屋の購読と、切れたときの自動の張り直し（0.4秒→0.8秒→…の指数バックオフ。最大8回）
 *   ・オンライン復帰・画面に戻ったときは待たずに張り直す（online / visibilitychange）
 *   ・圏外になった時刻を覚え、戻ったら「再接続しました」を2.5秒だけ出す
 *   ・往復時間（RTT）の購読（アンテナ表示）
 *
 *   本体（useEffect 4つとその依存配列）は useBattleRoom.ts にあったときと1文字も変えていない。
 *   部屋の中身（room）・読み込み中・エラーは呼び出し側の state なので、setter を受け取る。
 */
import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { subscribeRtt, currentRttMs, watchRoom } from '../data/battle';
import { reconnectNotice, retryDelayMs, type ConnectionState } from '../core/connection';
import type { BattleRoom } from '../core/types';

export function useBattleRoomConnection(roomId: string | null, { setRoom, setLoading, setError }: {
  setRoom: React.Dispatch<React.SetStateAction<BattleRoom | null>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  /**
   * 通信の状態。
   * 既定を 'online' にしているのは、購読が始まる前の一瞬に
   * 「通信が切れています」と出すと誤解を招くため。
   */
  const [connection, setConnection] = useState<ConnectionState>('online');

  // ------------------------------------------------------------
  // 部屋の購読
  // ------------------------------------------------------------
  /**
   * ★購読が切れても自動で張り直す★
   * Firestore の購読はエラー（権限・一時的な障害・長時間の休止）で止まると、
   * 二度と通知を返さない。以前はここで「通信が切れました」と出したまま
   * 画面が固まり、再読み込みするしかなかった。
   * 0.4秒→0.8秒→…と間隔を空けて張り直し、端末が「オンラインに戻った」
   * 「画面に戻ってきた」ときは待たずにすぐ張り直す。
   */
  const [subscribeNo, setSubscribeNo] = useState(0);
  const resubAttemptRef = useRef(0);
  const connectionRef = useRef<ConnectionState>('online');
  useEffect(() => {
    if (!roomId) return;
    const kick = () => { resubAttemptRef.current = 0; setSubscribeNo((n) => n + 1); };
    const onVisible = () => { if (document.visibilityState === 'visible' && connectionRef.current === 'offline') kick(); };
    window.addEventListener('online', kick);
    document.addEventListener('visibilitychange', onVisible);
    const onOffline = () => setConnection('offline');
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', kick);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [roomId]);

  const offlineSinceRef = useRef<number | null>(null);
  const [reconnectMessage, setReconnectMessage] = useState<string | null>(null);
  useEffect(() => {
    const prev = connectionRef.current;
    connectionRef.current = connection;
    if (connection === 'offline' && prev !== 'offline') offlineSinceRef.current = Date.now();
    if (connection === 'online' && prev === 'offline') {
      const since = offlineSinceRef.current;
      offlineSinceRef.current = null;
      const msg = since ? reconnectNotice(Date.now() - since) : null;
      if (msg) {
        setReconnectMessage(msg);
        const t = window.setTimeout(() => setReconnectMessage(null), 2500);
        return () => window.clearTimeout(t);
      }
    }
    return undefined;
  }, [connection]);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }
    if (subscribeNo === 0) setLoading(true);
    let retry: ReturnType<typeof setTimeout> | undefined;
    let alive = true;
    const stop = watchRoom(
      roomId,
      (next) => {
        if (!alive) return;
        setLoading(false);
        resubAttemptRef.current = 0;
        if (!next) {
          setError('この対戦はすでに終了しています。');
          setRoom(null);
          return;
        }
        // 一時的な通信エラーの表示は、届いた時点で消す
        setError((e) => (e && /通信/.test(e) ? null : e));
        setRoom(next);
      },
      (e) => {
        if (!alive) return;
        setLoading(false);
        setConnection('offline');
        // ★張り直す★（権限エラーでも、部屋が閉じたかどうかは次の購読で分かる）
        const attempt = resubAttemptRef.current;
        resubAttemptRef.current = attempt + 1;
        if (attempt >= 8) { setError(e.message); return; }
        retry = setTimeout(() => setSubscribeNo((n) => n + 1), retryDelayMs(attempt, Math.random(), 500, 8_000));
      },
      // 通信の状態を受け取る（圏外でも購読は続くので、これが無いと気付けない）
      setConnection,
    );
    return () => { alive = false; if (retry) clearTimeout(retry); stop(); };
  }, [roomId, subscribeNo]);

  // 往復時間（アンテナ表示）
  const [rttMs, setRttMs] = useState<number | null>(() => currentRttMs());
  useEffect(() => subscribeRtt(setRttMs), []);

  return { connection, reconnectMessage, rttMs };
}
