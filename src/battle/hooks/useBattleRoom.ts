/**
 * ===================================================================
 * 対戦モード: 試合の進行を1本にまとめたフック
 * ===================================================================
 *
 * ■ 責務
 *   ・部屋の購読（★1試合＝購読1本★）
 *   ・締切からの残り時間の計算（端末側で引き算）
 *   ・両者解答済み／締切到達で次の問題へ進める
 *   ・相手の切断（不戦勝）の判定
 *   ・結果の申告とレート反映
 *
 * ■ 点数計算はここではやらない
 * 計算は core/battleCore.ts（純関数）。
 * 通信・時間・React の都合をここに閉じ込め、
 * 「点数の決まり方」はテストしやすい純関数側に置く。
 *
 * -------------------------------------------------------------------
 * ■ 残り時間を「書き込まない」設計
 * -------------------------------------------------------------------
 * 残り秒数を Firestore に書くと、1問10秒×10問で
 * 1試合100回の書き込みになる（無料枠2万書き込み/日 → 200試合で枯渇）。
 * ★締切時刻を1回だけ書き、各端末が自分の時計で引き算する。★
 * 書き込みは1問1回（進行時）に収まり、1試合35回程度で済む。
 *
 * -------------------------------------------------------------------
 * ■ 「両者が進める」ようにしている理由
 * -------------------------------------------------------------------
 * 部屋主だけが進行役だと、部屋主の電波が切れた瞬間に試合が凍る。
 * 両者が同じ条件（次の番号）で進めれば、
 * どちらか生きている方が進めてくれる。
 * 同時に呼んでも同じ値を書くだけなので競合しても問題ない。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { auth } from '../../firebase';
import {
  abortRoom,
  advanceQuestion,
  releaseRoomCode,
  attestResult,
  saveHistory,
  startBattle,
  submitAnswer,
  subscribeRtt,
  currentRttMs,
  watchRoom,
} from '../data/battle';
import { loadPool } from '../data/battlePool';
import { applyRatingResult } from '../data/battleRanking';
import {
  BATTLE_REVEAL_HOLD_MS,
  FORFEIT_STREAK,
  hasLeft,
  judgeBattle,
  nationalAutoStartDelayMs,
  NO_ANSWER,
  resolveTimeLimit,
  scoreBattlePlayer,
  trailingNoAnswerCount,
} from '../core/battleCore';
import { normalizeRule } from '../core/battleRules';
import { cycleKanaKey } from '../core/kanaKeyboard';
import { isClockSkewed, serverNow, toMillis } from '../core/serverClock';
import {
  canSubmitAnswer,
  connectionQuality,
  didSuspend,
  offlineNotice,
  reconnectNotice,
  resumeNotice,
  retryDelayMs,
  type ConnectionQuality,
  type ConnectionState,
} from '../core/connection';
import type {
  BattleAnswerSheet,
  BattlePlayerScore,
  BattleQuestion,
  BattleResultSummary,
  BattleRoom,
} from '../core/types';
import { answerIndexOf, answerKeyOf } from '../core/types';
import { COUNTDOWN_TOTAL_MS, firstDeadlineSec } from '../core/battleLive';
import { preloadTargets, warmAssets } from '../core/preload';

/** 画面が使う対戦の状態 */
export interface BattleRoomState {
  loading: boolean;
  error: string | null;
  /** 開始の書き込み中 */
  starting: boolean;
  /** 出題プールを読み込めたか（false の間は開始できない） */
  poolReady: boolean;
  room: BattleRoom | null;
  /** 出題（部屋の questionIds を本体に戻したもの） */
  questions: BattleQuestion[];
  /** いま出ている問題 */
  current: BattleQuestion | null;
  /** 残りミリ秒（0で締切） */
  remainMs: number;
  /** いまの問の制限時間（秒・resolveTimeLimit 済み）。残り時間バーの分母。 */
  limitSec: number;
  /** 自分がこの問題に答えたか */
  answered: boolean;
  /** 相手が答えたか（「相手は解答済み」の表示に使う） */
  opponentAnswered: boolean;
  /** 自分が選んだ選択肢（表示のため） */
  myChoice: number;
  /** 自分が押したパネルの順 */
  myPanel: number[];
  /** 結果（試合終了後のみ） */
  result: BattleResultSummary | null;
  myScore: BattlePlayerScore | null;
  opponentScore: BattlePlayerScore | null;
  /** レートの変化（反映後のみ） */
  rating: { before: number; after: number } | null;
  /** 相手の離脱による決着か */
  byForfeit: boolean;
  /** 相手の表示名・アイコン */
  opponent: { uid: string; nickname: string; photoURL: string; rating: number } | null;
  /** 試合が終わったか */
  finished: boolean;
  /**
   * 端末の時計が大きくずれているか。
   * ずれていても対戦は成立する（サーバ時刻に寄せて計算している）が、
   * 端末側の設定を直してもらうために画面で伝える。
   */
  clockSkewed: boolean;
  /**
   * 通信の状態。
   * ★圏外でも購読は続く★ので、これがないと切れたことに気付けない。
   */
  connection: ConnectionState;
  /** 電波の強さ（アンテナ表示）と直近の往復時間 */
  quality: ConnectionQuality;
  rttMs: number | null;
  /** 解答を送信中（届くまでの間、押した選択肢を仮に出す） */
  sending: boolean;
  /** 通信が戻ったときの知らせ */
  reconnectMessage: string | null;
  /** 圏外の知らせ（出す必要がないときは null） */
  offlineMessage: string | null;
  /** 画面を離れて戻ってきたときの知らせ（同） */
  resumeMessage: string | null;
  /** 解答を送れる状態か（選択肢を押せるかの判断に使う） */
  submittable: boolean;
  /**
   * ★臨場感アップデート★ 開始カウントダウン（3・2・1・START!）の残りミリ秒。
   * 0 なら問題が始まっている。1問目の締切を「制限時間＋カウントダウン」で
   * 置き、締切から逆算して両端末が同じタイミングで数える（追加の書き込みなし）。
   */
  preStartMs: number;
  /** 自分が答えた問題番号（平均回答時間の集計に使う。無回答を除くため） */
  myAnsweredIndexes: number[];
}

export interface BattleRoomActions {
  /** 選択肢を押す（4択・2〜3択・5〜6択） */
  choose: (index: number) => void;
  /** パネル／五十音キーボードのキーを押す */
  pushPanel: (index: number) => void;
  /** 1つ戻す */
  popPanel: () => void;
  /**
   * かな入力: 最後の1文字を「゛゜小」で切り替える。
   * カ→ガ→カ のように一周して戻るので、押しすぎても詰まらない。
   */
  cyclePanel: () => void;
  /**
   * かな入力: 「けってい」で解答を送る。
   *
   * ★文字パネルには対応する操作が無い★
   * 文字パネルは札が揃った瞬間に自動で送っている（1タップぶん速い）。
   * かな入力は最後の文字に濁点を付ける余地があるので、
   * 自動で送ると「ダイヤモント」で確定してしまう。だから明示的に送る。
   */
  commitKana: () => void;
  /** 部屋主が対戦を開始する */
  start: () => void;
  /** 部屋を離脱する */
  leave: () => void;
  /** 復帰の知らせを消す */
  dismissResumeMessage: () => void;
}

/** 締切をまたいだ判定に使う猶予（ms）。表示と受付のズレを吸収する */
const DEADLINE_GRACE_MS = 250;

export function useBattleRoom(roomId: string | null): BattleRoomState & BattleRoomActions {
  const uid = auth.currentUser?.uid || '';

  const [room, setRoom] = useState<BattleRoom | null>(null);
  const [pool, setPool] = useState<readonly BattleQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // ★Date.now() ではなく serverNow()（推定サーバ時刻）を使う★
  //
  // 残り時間は「締切 − 現在時刻」で出すが、
  // 締切（deadlineAt）はサーバ側の時間軸であり、
  // 受付の可否もルールが request.time（サーバ時刻）で決める。
  // ここで端末時刻を混ぜると、時計が遅れている端末で
  // 「残り3秒」と見えているのにサーバでは締切後となり、
  // ★答えたのに解答が消える★。
  const [now, setNow] = useState(() => serverNow());
  const [panel, setPanel] = useState<number[]>([]);
  const [rating, setRating] = useState<{ before: number; after: number } | null>(null);

  /**
   * 通信の状態。
   * 既定を 'online' にしているのは、購読が始まる前の一瞬に
   * 「通信が切れています」と出すと誤解を招くため。
   */
  const [connection, setConnection] = useState<ConnectionState>('online');

  /** 画面を離れて戻ってきたときに出す知らせ */
  const [resumeMessage, setResumeMessage] = useState<string | null>(null);

  /** 二重実行を防ぐための記録（進行・申告・レート反映） */
  const advancedRef = useRef<number>(-1);
  /** 最後に「進める」を撃った問題番号と時刻（撃ち直しの見張り用） */
  const advanceFiredRef = useRef<{ index: number; at: number } | null>(null);
  const revealStartedRef = useRef<{ index: number; at: number } | null>(null);
  const attestedRef = useRef(false);
  const ratedRef = useRef(false);

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

  // ------------------------------------------------------------
  // 教科のプールを読み込む（★選ばれた1教科だけ★）
  // ------------------------------------------------------------
  const subject = room?.subject;
  // 読み込みに失敗したら自動でやり直す（2秒・4秒・8秒…最大5回）。
  // 以前は1回失敗すると問題が空のまま残り、「はじめる」を押しても何も起きなかった。
  const [poolAttempt, setPoolAttempt] = useState(0);
  useEffect(() => {
    if (!subject) return;
    let alive = true;
    let retry: ReturnType<typeof setTimeout> | undefined;
    loadPool(subject)
      .then((list) => {
        if (alive) { setPool(list); setError((e) => (e && e.startsWith('問題の読み込み') ? null : e)); }
      })
      .catch(() => {
        if (!alive) return;
        setError('問題の読み込みに失敗しました。通信環境をご確認ください（自動で再試行します）。');
        if (poolAttempt < 5) retry = setTimeout(() => setPoolAttempt((n) => n + 1), 2000 * 2 ** poolAttempt);
      });
    return () => {
      alive = false;
      if (retry) clearTimeout(retry);
    };
  }, [subject, poolAttempt]);

  // ------------------------------------------------------------
  // 時計を進める（残り時間の表示用）
  // ------------------------------------------------------------
  const status = room?.status;

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
  const currentIndexForSuspend = room?.currentIndex ?? 0;
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

  // ------------------------------------------------------------
  // 部屋の中身を扱いやすい形に直す
  // ------------------------------------------------------------
  const rawRules = room?.rules;
  const rules = useMemo(
    () => normalizeRule(subject || '', rawRules),
    [subject, rawRules],
  );

  const questionIds = room?.questionIds;
  const questions = useMemo(() => {
    if (!questionIds || pool.length === 0) return [];
    const byId = new Map(pool.map((q) => [q.id, q]));
    return questionIds
      .map((id) => byId.get(id))
      .filter((q): q is BattleQuestion => Boolean(q));
  }, [questionIds, pool]);

  const currentIndex = room?.currentIndex ?? 0;
  const current = questions[currentIndex] || null;

  const players = room?.players;
  const opponentUid = useMemo(
    () => (players || []).find((p) => p !== uid) || '',
    [players, uid],
  );

  const profiles = room?.profiles;
  const opponent = useMemo(() => {
    if (!opponentUid) return null;
    const p = profiles?.[opponentUid];
    return p
      ? { uid: opponentUid, nickname: p.nickname, photoURL: p.photoURL, rating: p.rating }
      : { uid: opponentUid, nickname: '対戦相手', photoURL: '', rating: 1500 };
  }, [profiles, opponentUid]);

  // ★回答は「q0, q1 …」をキーにしたマップ★
  //   配列ではない理由は types.ts の BattleAnswerSheet を参照。
  //   （配列だと serverTimestamp() が使えず、そもそも回答できない）
  const answersMap = room?.answers;
  const mySheet = useMemo<BattleAnswerSheet>(
    () => (answersMap?.[uid] as BattleAnswerSheet) || {},
    [answersMap, uid],
  );
  const opponentSheet = useMemo<BattleAnswerSheet>(
    () => (answersMap?.[opponentUid] as BattleAnswerSheet) || {},
    [answersMap, opponentUid],
  );

  const myRecord = mySheet[answerKeyOf(currentIndex)] || null;
  const answered = Boolean(myRecord);
  const opponentAnswered = Boolean(opponentSheet[answerKeyOf(currentIndex)]);

  // ------------------------------------------------------------
  // 残り時間
  // ------------------------------------------------------------
  const rawDeadline = room?.deadlineAt;
  const deadlineMs = useMemo(() => toMillis(rawDeadline) ?? 0, [rawDeadline]);

  const remainMs = deadlineMs > 0 ? Math.max(0, deadlineMs - now) : 0;

  /**
   * 端末の時計が実害の出るほどずれているか。
   *
   * ★黙って補正するだけにしない理由★
   * serverNow() で補正しているので対戦は成立するが、
   * 補正は推定なので完墧ではない。
   * また端末の時計がずれていると、このアプリ以外（学習記録など）でも
   * 日付がごろごろになる。利用者に一度は伝えた方がよい。
   */
  const clockSkewed = status === 'playing' && isClockSkewed();

  // ★音源・絵の先読み★（いまの問題と次の問題。待機中・カウントダウン中から読み始める）
  useEffect(() => {
    if (questions.length === 0) return;
    warmAssets(preloadTargets(questions, currentIndex, 2));
  }, [questions, currentIndex]);

  // 問題が変わったらパネルの入力を捨てる
  useEffect(() => {
    setPanel([]);
  }, [currentIndex]);

  // ------------------------------------------------------------
  // 各問題の開始時刻を覚える（速度点の計算に使う）
  // ------------------------------------------------------------
  /**
   * ★問題ごとの開始時刻を端末側で記録する理由★
   * 速度点は「締切までの残り時間」で決まる。
   * 部屋には現在の問題の締切しか入っていないので、
   * 過去の問題の開始時刻はここで覚えておく必要がある。
   * Firestore に問題ごとの開始時刻を書くと書き込みが倍になるので置かない。
   *
   * 記録できていない問題は速度点0で計算する（推測しない）。
   * 途中参加・再読み込みの端末で点が水増しされるのを防ぐため。
   */
  const startsRef = useRef(new Map<number, number>());
  useEffect(() => {
    if (deadlineMs <= 0 || !current) return;
    if (startsRef.current.has(currentIndex)) return;
    // 1問目は締切にカウントダウン分を足して書いている（start / firstDeadlineSec を参照）。
    // 「締切 − 制限時間」で出す開始時刻は、そのままカウントダウン終了の時刻になる。
    startsRef.current.set(currentIndex, deadlineMs - resolveTimeLimit(current, rules) * 1000);
  }, [deadlineMs, current, currentIndex, rules]);

  /**
   * ★開始カウントダウンの残り★
   * 1問目だけ、問題の開始時刻（締切 − 制限時間）までの残りを返す。
   * 両端末が同じ deadlineAt から引き算するので、同じタイミングで START! になる。
   */
  /*
   * ★締切がまだ届いていない1問目は「カウントダウン中」として扱う★
   * status が playing に変わった直後は、
   *   ・自分の書き込み（serverTimestamp 待ち）で deadlineAt がまだ読めない
   *   ・now（200ms の時計）がまだ playing 用に動き出していない
   * ことがあり、以前はここが 0 になって ★1フレームだけ問題文が描かれ★、
   * そのあと「7」のカウントダウンに切り替わっていた（背景に問題が一瞬見える不具合）。
   * 開始時刻が分からない間は問題を出さない側に倒す。
   */
  const liveNow = Math.max(now, serverNow());
  const preStartMs =
    status === 'playing' && currentIndex === 0 && current
      ? deadlineMs > 0
        ? Math.max(0, deadlineMs - resolveTimeLimit(current, rules) * 1000 - liveNow)
        : COUNTDOWN_TOTAL_MS
      : 0;

  // ------------------------------------------------------------
  // 自動進行
  // ------------------------------------------------------------
  useEffect(() => {
    if (!roomId || status !== 'playing' || !current) return;
    if (questions.length === 0) return;

    const bothAnswered = answered && opponentAnswered;
    const timeUp = deadlineMs > 0 && now >= deadlineMs + DEADLINE_GRACE_MS;
    if (!bothAnswered && !timeUp) {
      revealStartedRef.current = null;
      return;
    }
    // A timeout here would be cancelled on each clock tick. Keep the start
    // timestamp instead, and advance only after the feedback has been visible.
    if (revealStartedRef.current?.index !== currentIndex) {
      revealStartedRef.current = { index: currentIndex, at: now };
    }
    if (now - revealStartedRef.current.at < BATTLE_REVEAL_HOLD_MS) return;

    // 最終問題なら進めない（結果の申告は別の useEffect が行う）
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) return;

    // 同じ番号で何度も進めないようにする
    if (advancedRef.current >= currentIndex) return;
    advancedRef.current = currentIndex;

    // ★失敗したら同じ番号でもう一度進められるように戻す★
    //   以前は失敗しても advancedRef が進んだままで、二度と送らなかった。
    //   相手も同時に圏外だと、試合がその問題で永久に止まっていた（未処理の例外にもなっていた）。
    const failedIndex = currentIndex;
    void advanceQuestion(roomId, nextIndex, resolveTimeLimit(questions[nextIndex], rules)).catch(() => {
      if (advancedRef.current === failedIndex) advancedRef.current = failedIndex - 1;
    });
  }, [
    roomId,
    status,
    current,
    questions,
    answered,
    opponentAnswered,
    now,
    deadlineMs,
    currentIndex,
    rules,
  ]);

  // ------------------------------------------------------------
  // 終了判定と点数の計算
  // ------------------------------------------------------------
  const lastQuestionDone =
    questions.length > 0 &&
    currentIndex >= questions.length - 1 &&
    ((answered && opponentAnswered) ||
      (deadlineMs > 0 && now >= deadlineMs + DEADLINE_GRACE_MS));

  /**
   * ★明示的な退出（left）による早期決着★
   *
   * 相手が「対戦メニューにもどる」を押すと abortRoom() が left.{相手} を書く。
   * 以前はこれを見ても「不戦勝の予告」を出すだけで、終了判定は
   * 最後の問題の締切を待っていた（独立検証で指摘）。
   * 相手はもういないので、残りの問題を1人で消化させる意味が無い。
   *
   * ★サーバが確定した退出だけを使う★
   * left はルールで「自分の uid・サーバ時刻」しか書けないので、
   * 偽装できない証拠になる。無回答からの推測（下の byForfeit ②）は
   * 早期決着には使わない（トンネルで圏外になった人を負けにしない）。
   *
   * 両者が退出している（ありえないが）場合は先に抜けた方を負けにする。
   */
  const leftMap = room?.left;
  const firstLeaver = useMemo(() => {
    const leavers = (players || []).filter((p) => hasLeft(leftMap, p));
    if (leavers.length === 0) return '';
    return [...leavers].sort(
      (a, b) => (toMillis(leftMap?.[a]) ?? 0) - (toMillis(leftMap?.[b]) ?? 0),
    )[0] as string;
  }, [players, leftMap]);
  const explicitForfeit =
    Boolean(firstLeaver) && (status === 'playing' || status === 'finished');

  const finished =
    status === 'finished' || (status === 'playing' && (lastQuestionDone || explicitForfeit));

  // 決着・中断したら、この端末が作った合言葉を返す（合言葉の枯渇と「入れない部屋」を防ぐ）
  useEffect(() => {
    if (roomId && (finished || status === 'aborted')) releaseRoomCode(roomId);
  }, [roomId, finished, status]);

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

  const scores = useMemo(() => {
    if (questions.length === 0) return null;
    const starts = startsRef.current;
    return {
      me: scoreBattlePlayer(uid, questions, mySheet, rules, starts),
      other: scoreBattlePlayer(opponentUid, questions, opponentSheet, rules, starts),
    };
  }, [questions, uid, opponentUid, mySheet, opponentSheet, rules]);

  /**
   * 相手の離脱（不戦勝）の判定。
   *
   * ★2つの経路を区別する★
   *
   *   ① 明示的な離脱（相手が「もどる」を押した）
   *      abortRoom() が left.{uid} を書き込むので確実に分かる。
   *      待つ意味がないので即座に決着させる。
   *
   *   ② 推測（無回答が続いている）
   *      電源が切れた・圏外・強制終了では何も書き込めないので、
   *      無回答が続くことからの推測しかできない。
   *      ★ここを短くしすぎてはいけない★。
   *      トンネルや地下で30〜60秒圏外になるのは日常的に起き、
   *      1問10〜20秒なら数問は簡単に飛ぶ。
   *      短いと「席を立った人」ではなく「トンネルに入った人」を
   *      不戦敗にしてレートを削ることになる。
   *
   * 自分が圏外のときは判定しない。自分に相手の書き込みが届いていないだけで、
   * 相手は普通に答えている可能性がある。
   * ★自分の電波が悪いことを相手の離脱と取り違えてはいけない★。
   */
  const byForfeit = useMemo(() => {
    // 明示的な退出が確定していれば、抜けていない側の不戦勝
    if (explicitForfeit) return firstLeaver !== uid;
    if (status !== 'playing') return false;

    // ① 明示的な離脱は即座に成立
    if (hasLeft(leftMap, opponentUid)) return true;

    // ★自分が圏外なら推測しない★
    // 端末内の控えを見ているだけなので、相手の回答が届いていないだけの
    // 可能性が高い。ここで不戦勝にすると、電波の悪い側が
    // 「相手が逃げた」と誤解したまま試合が終わる。
    if (connection === 'offline') return false;

    // ② 無回答の連続からの推測
    // キー名（q0, q1 …）から問題番号を取り出す。
    // 壊れたキーは answerIndexOf が null を返すので捨てる。
    const answeredIndexes = Object.keys(opponentSheet)
      .map((k) => answerIndexOf(k))
      .filter((n): n is number => n != null);
    const trailing = trailingNoAnswerCount(answeredIndexes, currentIndex);
    return trailing >= FORFEIT_STREAK;
  }, [status, leftMap, opponentUid, connection, opponentSheet, currentIndex, explicitForfeit, firstLeaver, uid]);

  const result = useMemo(() => {
    if (!scores || !finished) return null;
    // ★退出した側の負け★
    //   点数で判定すると「負けそうになったら抜ける」が引き分け以上になりうる。
    //   退出は得点に関係なく敗北にする（逃げ得を作らない）。
    if (explicitForfeit) {
      return {
        me: scores.me,
        opponent: scores.other,
        outcome: firstLeaver === uid ? ('lose' as const) : ('win' as const),
        decidedByTime: false,
        needsSuddenDeath: false,
      };
    }
    return judgeBattle(scores.me, scores.other, rules);
  }, [scores, finished, rules, explicitForfeit, firstLeaver, uid]);

  // ------------------------------------------------------------
  // 結果の申告
  // ------------------------------------------------------------
  const myAttest = room?.attest?.[uid];
  const [attestRetry, setAttestRetry] = useState(0);
  useEffect(() => {
    if (!roomId || !result || !scores || attestedRef.current) return;
    // ★結果画面を再読み込みしたときに再申告しない★
    //   申告はルールで「1人1回・上書き不可」なので、2回目は必ず拒否される。
    //   以前はここで拒否エラーが未処理例外になっていた（独立検証で指摘）。
    //   既に自分の申告が部屋にあれば、それを結果として使う。
    if (myAttest) {
      attestedRef.current = true;
      return;
    }
    attestedRef.current = true;
    void attestResult(roomId, {
      myScore: scores.me.score,
      opponentScore: scores.other.score,
      outcome: result.outcome,
    }).catch((e: Error) => {
      // ★結果の申告が届かなかったら、通信が戻ったときにもう一度送る★
      //   ここで諦めると、レートも履歴も残らない試合になる。
      setError(`${e.message} 通信が戻ると自動で送り直します。`);
      window.setTimeout(() => { attestedRef.current = false; setAttestRetry((n) => n + 1); }, 4_000);
    });
  }, [roomId, result, scores, myAttest, attestRetry]);

  // ------------------------------------------------------------
  // レート反映（★相互確認が揃ってから★）
  // ------------------------------------------------------------
  const attest = room?.attest;
  useEffect(() => {
    if (!roomId || !result || !scores || !subject || ratedRef.current) return;

    const mine = attest?.[uid];
    const theirs = opponentUid ? attest?.[opponentUid] : undefined;

    // 相手が離脱した場合は相手の申告が来ないので、
    // 不戦勝として（変化量を半分にして）反映する。
    const forfeit = explicitForfeit || (byForfeit && !theirs);
    if (!mine) return;
    if (!theirs && !forfeit) return;

    // 申告が食い違ったら無効試合（レートを動かさない）
    if (theirs) {
      const agreed =
        (mine.outcome === 'win' && theirs.outcome === 'lose') ||
        (mine.outcome === 'lose' && theirs.outcome === 'win') ||
        (mine.outcome === 'draw' && theirs.outcome === 'draw');
      if (!agreed) {
        ratedRef.current = true;
        return;
      }
    }

    ratedRef.current = true;
    const opponentRating = opponent?.rating ?? 1500;

    void applyRatingResult(roomId, opponentRating, result.outcome, forfeit, opponentUid).then((change) => {
      if (change) setRating(change);
      void saveHistory({
        roomId,
        subject,
        outcome: result.outcome,
        myScore: scores.me.score,
        opponentScore: scores.other.score,
        opponentNickname: opponent?.nickname || '対戦相手',
        ratingBefore: change?.before ?? 0,
        ratingAfter: change?.after ?? 0,
        // 履歴から「間違えた問題だけ再対戦」できるように、間違えた出題IDを残す（最大30）
        wrongIds: scores.me.perQuestion.filter((q) => !q.correct).map((q) => questionIds?.[q.index]).filter((id): id is string => typeof id === 'string').slice(0, 30),
      });
    });
  }, [roomId, result, scores, subject, attest, uid, opponentUid, opponent, byForfeit, explicitForfeit]);

  // ------------------------------------------------------------
  // 操作
  // ------------------------------------------------------------
  /**
   * 解答を送れる状態か。
   *
   * ★圏外を弾く理由★
   * Firestore は圏外でも書き込みを端末に溜め、購読は即座に
   * 「反映済みのように見える」通知を返す。画面は解答済みになる。
   * ところが通信が戻って実際に送られるときには締切を過ぎているので
   * ルールが拒否し、★答えたはずの解答が黙って消える★。
   * それなら最初から「電波が戻るまで解答できません」と伝えた方が良い。
   */
  // カウントダウン中は解答を受け付けない（問題文はまだ見せていない）
  const submittable = canSubmitAnswer({ connection, remainMs, answered }) && preStartMs <= 0;

  /**
   * ★送信中の解答（楽観的な表示）★
   * 市販の対戦ゲームと同じく、押した瞬間に「押した」表示にする。
   * 以前はサーバの返事が来るまで何も変わらず、電波が悪いと連打されていた。
   * 送信は締切まで自動で再送し、届いたら部屋の内容に置き換わる。
   */
  const [pending, setPending] = useState<{ index: number; choice: number } | null>(null);
  useEffect(() => { if (pending && (answered || pending.index !== currentIndex)) setPending(null); }, [answered, currentIndex, pending]);
  const sendBudget = () => Math.max(1_500, remainMs + 1_500);

  const choose = useCallback(
    (index: number) => {
      if (!roomId || !current || !submittable || pending) return;
      setPending({ index: currentIndex, choice: index });
      void submitAnswer(roomId, currentIndex, { choice: index, panel: [] }, answered, { budgetMs: sendBudget() }).catch(
        (e: Error) => { setPending(null); setError(e.message); },
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roomId, current, submittable, answered, currentIndex, pending, remainMs],
  );

  /**
   * パネルの解答を送る。
   *
   * ★「決定」ボタンを押させない理由★
   * 制限時間が短いので、1タップの差がそのまま点数差になる。
   * 必要な文字数を並べ終えた時点が解答意思の表明とみなせるので、
   * 揃った瞬間に送る（押した順は panel が保持している）。
   */
  const commitPanel = useCallback(
    (order: number[]) => {
      if (!roomId || !current || !submittable) return;
      if (order.length !== current.panelOrder.length || pending) return;
      setPending({ index: currentIndex, choice: NO_ANSWER });
      void submitAnswer(roomId, currentIndex, { choice: NO_ANSWER, panel: order }, answered, { budgetMs: sendBudget() }).catch(
        (e: Error) => { setPending(null); setError(e.message); },
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roomId, current, submittable, answered, currentIndex, pending, remainMs],
  );

  const pushPanel = useCallback(
    (index: number) => {
      // ★圏外ではパネルも押せないようにする★
      // 押せてしまうと、揃った瞬間に自動で送信を試みて
      // 「答えたのに消えた」が起きる。入力の段階で止める。
      if (!current || !submittable) return;
      const need = current.panelOrder.length;
      const isKana = current.format === 'kana';
      setPanel((prev) => {
        /**
         * ★同じキーを2回押せるかどうかは形式で変わる★
         *
         * 文字パネル（panel）は「画面に並んだ札を取る」形なので、
         * 一度取った札をもう一度取ることはできない。
         *
         * 五十音キーボード（kana）は札ではなくキーなので、
         * 同じキーを何度でも押せる必要がある。ここを塞ぐと
         * 「バリウム」「アルミニウム」のように同じ文字を2回使う語が
         * ★入力しようとしても入らない★ という不具合になる。
         */
        if (!isKana && prev.includes(index)) return prev;
        if (prev.length >= need) return prev;
        const next = [...prev, index];
        /**
         * ★かな入力では「揃った瞬間の自動送信」をしない★
         *
         * かな入力の最後の1文字が「゛゜小」で作る文字であることがある
         * （実測9語：ダイヤモン「ド」／ステッ「プ」／アミラー「ゼ」など）。
         * 自動で送ってしまうと、濁点を付ける前の「ダイヤモント」で
         * 確定してしまい、正しく覚えている人が誤答になる。
         * そこで、かな入力だけは利用者が「けってい」を押すまで待つ。
         *
         * 文字パネルは札を取るだけで後から変化しないので、
         * 今まで通り揃った瞬間に送る（1タップぶん速い）。
         */
        if (!isKana && next.length === need) commitPanel(next);
        return next;
      });
    },
    [current, submittable, commitPanel],
  );

  /**
   * かな入力の最後の1文字を「゛゜小」で切り替える。
   *
   * ★最後の1文字だけを対象にしている理由★
   * 途中の文字を選んで直せるようにすると、どの文字を選んでいるかを
   * 示す仕組みが必要になり、短い制限時間の中で操作が増える。
   * 「押した直後に切り替える」形なら、キーボードの流れが途切れない。
   */
  const cyclePanel = useCallback(() => {
    if (!current || current.format !== 'kana' || !submittable) return;
    setPanel((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (last === undefined) return prev;
      const next = cycleKanaKey(last);
      if (next === last) return prev;
      return [...prev.slice(0, -1), next];
    });
  }, [current, submittable]);

  /** かな入力の「けってい」（文字パネルは自動確定なので使わない） */
  const commitKana = useCallback(() => {
    if (!current || current.format !== 'kana') return;
    commitPanel(panel);
  }, [current, commitPanel, panel]);

  const popPanel = useCallback(() => {
    if (answered) return;
    setPanel((prev) => prev.slice(0, -1));
  }, [answered]);

  /** 開始の書き込み中（ボタンの二度押し防止・「開始しています…」の表示） */
  const [starting, setStarting] = useState(false);
  /** 自動開始の再試行回数（失敗のたびに増やして effect を張り直す） */
  const [autoStartRetry, setAutoStartRetry] = useState(0);
  const autoStartedForRef = useRef<string | null>(null);
  const start = useCallback(() => {
    if (!roomId) return;
    if (questions.length === 0) {
      // ★黙って何もしないのをやめる★（押しても反応が無い不具合）
      setError('問題を準備しています。数秒待ってからもう一度押してください。');
      setPoolAttempt((n) => n + 1);
      return;
    }
    /**
     * ★1問目の締切にカウントダウン（約3秒）を足す★
     * 3・2・1・START! の間は問題を隠すので、その分だけ締切を後ろに置く。
     * ★ルールの上限（締切は request.time + 60秒 未満）を超えないよう firstDeadlineSec で丸める★
     * 以前は「制限時間の最大35秒」前提で足していたが、今はリスニング55秒があり
     * 55 + 7.6 + 0.7 = 63.3秒 で開始が拒否されていた（battleLive.ts の説明を参照）。
     * 速さ点は「締切 − 制限時間」を開始時刻とするので、カウントダウンの分は入らない。
     */
    const first = firstDeadlineSec(resolveTimeLimit(questions[0], rules));
    setError(null);
    setStarting(true);
    void startBattle(roomId, first)
      .catch((e: Error) => {
        setError(`${e.message} もう一度「はじめる」を押してください。`);
        // 全国対戦の自動開始が失敗したら、部屋がまだ待機中なら自動でもう一度試せるようにする
        if (autoStartedForRef.current === roomId) autoStartedForRef.current = null;
        setAutoStartRetry((n) => n + 1);
      })
      .finally(() => setStarting(false));
  }, [roomId, questions, rules]);

  /**
   * ★全国対戦は揃った時点で自動開始する★
   *
   * findOrEnqueue が作る部屋は 2 人揃っているのに status:'waiting' なので、
   * 以前はここで止まり、フレンド対戦と同じ待機ロビーが出ていた
   * （利用者の指摘：「全国対戦 → 科目選択 → なぜかフレンド対戦の画面」）。
   * 部屋主は即開始、相手側は部屋主の書き込みが来なければ 8 秒後に開始する
   * （判断は nationalAutoStartDelayMs に集約。二重開始の考え方もそこに書いた）。
   *
   * 部屋ごとに 1 回しか撃たないよう roomId を記録する。
   * status が waiting → playing に変わればタイマーは片付ける。
   */
  const roomStatus = room?.status;
  const roomJoinCode = room?.joinCode;
  const roomHostUid = room?.hostUid;
  useEffect(() => {
    if (!roomId || !room || questions.length === 0) return;
    if (autoStartedForRef.current === roomId) return;
    const delay = nationalAutoStartDelayMs(
      { status: room.status, joinCode: room.joinCode, hostUid: room.hostUid, players: room.players },
      uid,
      true,
    );
    if (delay == null) return;
    // 再試行は 3 回まで・間隔を空ける（相手が先に開始していれば status が変わって止まる）
    if (autoStartRetry > 3) return;
    const timer = window.setTimeout(() => {
      autoStartedForRef.current = roomId;
      start();
    }, delay + autoStartRetry * 2_000);
    return () => window.clearTimeout(timer);
    // room 全体ではなく開始判断に関わる値だけを見る（answers 等の更新で張り直さない）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, roomStatus, roomJoinCode, roomHostUid, players, uid, questions.length, start, autoStartRetry]);

  const leave = useCallback(() => {
    if (!roomId) return;
    void abortRoom(roomId);
  }, [roomId]);

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

  return {
    loading,
    error,
    starting,
    poolReady: pool.length > 0,
    room,
    questions,
    current,
    remainMs,
    /**
     * いまの問の制限時間（秒）。画面の残り時間バーの分母に使う。
     * ★プールの素の秒数ではなく resolveTimeLimit の結果★（倍率・上書きを反映済み）。
     * 締切（deadlineAt）も同じ値で決めているので、バーの分母と実際の締切が合う。
     */
    limitSec: current ? resolveTimeLimit(current, rules) : 0,
    // 送信中も「解答済み」として見せる（押した瞬間に反応する）。進行の判定は部屋の内容で行う。
    answered: answered || Boolean(pending && pending.index === currentIndex),
    opponentAnswered,
    myChoice: myRecord?.choice ?? (pending && pending.index === currentIndex ? pending.choice : NO_ANSWER),
    myPanel: myRecord ? myRecord.panel || [] : panel,
    result,
    myScore: scores?.me || null,
    opponentScore: scores?.other || null,
    rating,
    byForfeit,
    opponent,
    finished,
    clockSkewed,
    connection,
    quality: connectionQuality(rttMs, connection),
    rttMs,
    sending: Boolean(pending),
    reconnectMessage,
    offlineMessage: offlineNotice({ connection, playing: status === 'playing' }),
    resumeMessage,
    submittable,
    preStartMs,
    myAnsweredIndexes: Object.keys(mySheet)
      .map((k) => answerIndexOf(k))
      .filter((n): n is number => n != null),
    choose,
    pushPanel,
    popPanel,
    cyclePanel,
    commitKana,
    start,
    leave,
    dismissResumeMessage,
  };
}
