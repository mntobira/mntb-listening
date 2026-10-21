/**
 * ===================================================================
 * 対戦部屋の「端末の休止・復帰・離脱」（C-07: useBattleRoom.ts から分離）
 * ===================================================================
 *   useBattleSuspendTracker … 200ms ごとに時計を進め、タイマーの飛びと visibilitychange で休止を検知する
 *   useBattleResumeNotice   … 復帰したとき「問題が進んだ／試合が終わった」を正直に知らせる
 *   useBattleLeaveOnUnmount … 試合中に画面ごと消えたら（ナビ移動・pagehide）退出として記録する
 *
 *   本体（useEffect とその依存配列）は useBattleRoom.ts にあったときと1文字も変えていない。
 *   useBattleRoom は、元の effect があった位置でそれぞれ1回ずつ呼ぶ（effect の実行順は同じ）。
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import { abortRoom } from '../data/battle';
import { serverNow } from '../core/serverClock';
import { didSuspend, resumeNotice } from '../core/connection';
import type { BattleRoom } from '../core/types';

export function useBattleSuspendTracker(status: BattleRoom['status'] | undefined, currentIndexForSuspend: number, setNow: React.Dispatch<React.SetStateAction<number>>) {
  /**
   * 端末が休止していたことを検知するための記録。
   *
   * ★タイマーの飛びで判定する理由★
   * visibilitychange だけでは足りない。機種やブラウザによって
   * 画面消灯・別アプリへの移動で発火しない場合があるうえ、
   * 「どれだけの間離れていたか」が分からない。
   * タイマーが実際に何ミリ秒飛んだかを見れば、
   * どんな理由で止まっていても確実に分かる。
   */
  const lastTickRef = useRef<number>(Date.now());
  /** 休止に入る直前の状況（復帰時に何が変わったかを比べるため） */
  const beforeSuspendRef = useRef<{ index: number } | null>(null);
  /** 復帰の検知フラグ（実際の知らせは下の useEffect が作る） */
  const [suspendedAt, setSuspendedAt] = useState<number>(0);

  useEffect(() => {
    if (status !== 'playing') return;
    lastTickRef.current = Date.now();

    // 200ms 間隔。★1秒間隔にしない理由★
    // 締切直前の「残り0.4秒」が表示に出ず、
    // 押せたのに間に合わなかったように見えてしまう。
    const timer = window.setInterval(() => {
      const localNow = Date.now();
      // ★端末が休止していたかを、タイマーの飛びで見る★
      // 画面消灯・別アプリへの移動・端末の省電力で割り込みは止まる。
      // 止まっていた間に問題が進んだり試合が終わっていることがあるので、
      // 復帰したことを記録して、あとで利用者に伝える。
      if (didSuspend(lastTickRef.current, localNow)) {
        setSuspendedAt(localNow);
      }
      lastTickRef.current = localNow;
      setNow(serverNow());
    }, 200);
    return () => window.clearInterval(timer);
  }, [status]);

  /**
   * 画面が見えなくなった瞬間を捉える。
   *
   * ★タイマーの飛びだけに頼らない理由★
   * 離れる「前」の状況（何問目だったか）を覚えておかないと、
   * 復帰時に「問題が進んだ」ことを判定できない。
   * visibilitychange は離れる瞬間に発火するので、そこで控えておく。
   * 発火しない機種のために、タイマーの飛びによる検知も併用している
   * （どちらか片方でも動けば知らせが出る）。
   */
  // currentIndexForSuspend（room?.currentIndex ?? 0）は呼び出し側で作って引数で受け取る
  useEffect(() => {
    if (status !== 'playing') return;

    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        beforeSuspendRef.current = { index: currentIndexForSuspend };
        // タイマーが止まる直前の時刻を入れておく。
        // これが無いと、復帰時の飛びが「離れていた時間」にならない。
        lastTickRef.current = Date.now();
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [status, currentIndexForSuspend]);

  return { beforeSuspendRef, suspendedAt, setSuspendedAt };
}

export function useBattleResumeNotice({ suspendedAt, setSuspendedAt, beforeSuspendRef, currentIndex, finished }: {
  suspendedAt: number;
  setSuspendedAt: React.Dispatch<React.SetStateAction<number>>;
  beforeSuspendRef: React.MutableRefObject<{ index: number } | null>;
  currentIndex: number;
  finished: boolean;
}) {
  /** 画面を離れて戻ってきたときに出す知らせ */
  const [resumeMessage, setResumeMessage] = useState<string | null>(null);

  /**
   * 復帰したときの知らせを作る。
   *
   * ★黙って進めない理由★
   * 画面を離れている間に問題が進んだり試合が終わったりするのは正しい挙動だが、
   * 何も言わないと利用者には
   *   「勝手に進んだ」「答えたのに点が入っていない」
   * と見える。実際に何が起きたのかをそのまま伝える。
   */
  useEffect(() => {
    if (suspendedAt === 0) return;

    const before = beforeSuspendRef.current;
    const message = resumeNotice({
      suspended: true,
      // 離れる前の問題番号を控えられていた場合だけ比較する。
      // 控えが無い（visibilitychange が発火しなかった）場合は
      // 「進んだかどうか」を偽らずに false として扱う。
      indexChanged: before != null && before.index !== currentIndex,
      finished,
    });

    beforeSuspendRef.current = null;
    setSuspendedAt(0);
    setResumeMessage(message);
  }, [suspendedAt, currentIndex, finished]);

  /** 復帰の知らせを消す（画面側から呼ぶ） */
  const dismissResumeMessage = useCallback(() => setResumeMessage(null), []);

  return { resumeMessage, dismissResumeMessage };
}

export function useBattleLeaveOnUnmount(roomId: string | null, status: BattleRoom['status'] | undefined, finished: boolean): void {
  /**
   * ★試合中に画面ごと消えたら退出として記録する★
   *
   * 下のナビで「ホーム」に移る・タブを閉じる（pagehide）と、
   * このフックはアンマウントされる。以前は何も書かなかったので、
   * 相手は無回答が5問続くまで待たされていた。
   * 進行中（playing）で、まだ試合が終わっていないときだけ書く。
   * 決着済みの部屋に書くとルールで拒否されるだけなので害は無いが、
   * 無駄な書き込みを避けるために条件を付ける。
   */
  const leavingRef = useRef<{ roomId: string | null; active: boolean }>({ roomId, active: false });
  leavingRef.current = { roomId, active: status === 'waiting' || (status === 'playing' && !finished) };
  useEffect(() => {
    const flush = () => {
      const cur = leavingRef.current;
      if (cur.roomId && cur.active) void abortRoom(cur.roomId);
    };
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
    // 部屋が変わったときだけ張り直す（status の変化では張り直さない）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);
}
