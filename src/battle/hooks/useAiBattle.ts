/**
 * ===================================================================
 * AI 対戦: 端末の中だけで進む試合（Firestore を使わない）
 * ===================================================================
 *
 * ■ useBattleRoom との関係
 *   画面（BattleQuestionView / BattleResult）は同じ部品を使うので、
 *   返す値の形はできるだけ useBattleRoom に揃えてある。
 *   ただし通信に関するもの（connection / offlineMessage / resumeMessage /
 *   clockSkewed）は存在しないので、常に「問題なし」の値を返す。
 *
 * ■ 進行
 *   ・開始で問題 0 の締切（Date.now() + 制限時間）を置く
 *   ・AI の行動は decideAiMove で試合開始時に全問ぶん確定する（決定論）
 *   ・各問題で「AI の遅延が来たら AI の解答を記録」
 *   ・両者解答 or 締切 → 1.2 秒見せてから次へ
 *   ・最終問題が終わったら finished
 *
 * ■ 点数計算は本番の対戦と同じ純関数（scoreBattlePlayer / judgeBattle）
 *   「AI 戦だけ点の付き方が違う」と練習にならないため。
 *
 * ■ レートは動かさない。履歴にも残さない。
 *   Firestore ルール上、レートは「2人部屋・相手の申告つき・決着済み」の
 *   部屋が実在するときしか更新できない。AI 戦の部屋は存在しないので
 *   書けない（書くべきでもない）。画面にはその旨を出す。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { auth } from '../../firebase';
import { loadPool } from '../data/battlePool';
import { drawQuestionIds, effectiveRule } from '../data/battle';
import { resolveNickname } from '../../utils/leaderboard';
import {
  aiAnswerRecord,
  aiRevealLagMs,
  aiProfileOf,
  aiUidOf,
  decideAiMove,
  type AiLevel,
  type AiMove,
} from '../core/aiOpponent';
import {
  BATTLE_REVEAL_HOLD_MS,
  judgeBattle,
  NO_ANSWER,
  resolveTimeLimit,
  scoreBattlePlayer,
} from '../core/battleCore';
import { arenaRule } from '../core/arenaRules';
import { cycleKanaKey } from '../core/kanaKeyboard';
import type {
  BattleAnswerRecord,
  BattleAnswerSheet,
  BattlePlayerScore,
  BattleQuestion,
  BattleResultSummary,
  BattleRule,
} from '../core/types';
import { answerKeyOf, answerIndexOf } from '../core/types';
import { COUNTDOWN_TOTAL_MS } from '../core/battleLive';
import { preloadTargets, warmAssets } from '../core/preload';

export type AiBattlePhase = 'loading' | 'ready' | 'playing' | 'finished' | 'error';

/** 両者解答／締切のあと、正解を見せておく時間 */
const REVEAL_HOLD_MS = BATTLE_REVEAL_HOLD_MS;
/** 締切をまたいだ判定に使う猶予（ms） */
const DEADLINE_GRACE_MS = 150;

export interface AiBattleState {
  phase: AiBattlePhase;
  error: string | null;
  subject: string;
  level: AiLevel;
  rules: BattleRule;
  questions: BattleQuestion[];
  currentIndex: number;
  current: BattleQuestion | null;
  remainMs: number;
  /** いまの問の制限時間（秒・resolveTimeLimit 済み）。残り時間バーの分母。 */
  limitSec: number;
  answered: boolean;
  opponentAnswered: boolean;
  myChoice: number;
  myPanel: number[];
  myScore: number;
  opponentScore: number;
  /**
   * 問題ごとの内訳（正解・不正解・時間）を含む得点。
   * ★相手がいま何問目でどうだったかを画面に出すため★（レーストラック表示）。
   * useBattleRoom と同じ形に揃えて、画面部品を online / AI で共有できるようにする。
   */
  myDetail: BattlePlayerScore | null;
  opponentDetail: BattlePlayerScore | null;
  /** 採点の内訳（実況・HUD が問題ごとの正誤を読むため。useBattleRoom の myScore/opponentScore に当たる） */
  scores: { me: BattlePlayerScore; other: BattlePlayerScore } | null;
  result: BattleResultSummary | null;
  finished: boolean;
  me: { uid: string; nickname: string; photoURL: string };
  opponent: { uid: string; nickname: string; photoURL: string; rating: number };
  /** 開始カウントダウンの残りミリ秒（useBattleRoom と同じ意味） */
  preStartMs: number;
  /** 自分が答えた問題番号 */
  myAnsweredIndexes: number[];
  /** 解答を送れる状態か */
  submittable: boolean;
}

export interface AiBattleActions {
  start: () => void;
  choose: (index: number) => void;
  pushPanel: (index: number) => void;
  popPanel: () => void;
  cyclePanel: () => void;
  commitKana: () => void;
}

export function useAiBattle(
  subject: string,
  level: AiLevel,
  /** 試合番号。変わるたびに新しい試合を作る */
  matchNo = 0,
  /**
   * 利用者が選んだ問題数。undefined なら教科の既定を使う。
   * ご指示「問題数決めれるようにして」。フレンド対戦では部屋の rules に焼き込むが、
   * AI 戦は端末内で完結するのでここでルールに上書きする。
   */
  questionCount?: number,
  chapterId?: string,
): AiBattleState & AiBattleActions {
  const user = auth.currentUser;
  const uid = user?.uid || 'me';
  const profile = aiProfileOf(level);
  const aiUid = aiUidOf(level);

  const rules = useMemo(() => {
    const base = arenaRule(effectiveRule(subject));
    return questionCount ? { ...base, questionCount } : base;
  }, [subject, questionCount]);

  const [phase, setPhase] = useState<AiBattlePhase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<BattleQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deadlineMs, setDeadlineMs] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [mySheet, setMySheet] = useState<BattleAnswerSheet>({});
  const [aiSheet, setAiSheet] = useState<BattleAnswerSheet>({});
  const [panel, setPanel] = useState<number[]>([]);

  /** 試合ID（乱数の種）。開始ごとに新しくする */
  const seedRef = useRef(`ai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);
  /** 問題ごとの開始時刻（速さ点の計算に使う） */
  const startsRef = useRef(new Map<number, number>());
  /** AI の行動（開始時に全問ぶん確定） */
  const movesRef = useRef<AiMove[]>([]);
  /** 次へ進める処理の二重実行防止 */
  const advancingRef = useRef(false);

  // ------------------------------------------------------------
  // 出題を用意する
  // ------------------------------------------------------------
  useEffect(() => {
    let alive = true;
    setPhase('loading');
    setError(null);
    // ★新しい試合ごとに種と記録を作り直す★
    seedRef.current = `ai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    startsRef.current = new Map();
    movesRef.current = [];
    advancingRef.current = false;
    setMySheet({});
    setAiSheet({});
    setPanel([]);
    setCurrentIndex(0);
    setDeadlineMs(0);
    (async () => {
      const ids = await drawQuestionIds(subject, rules, seedRef.current, chapterId);
      if (ids.length === 0) throw new Error('この教科は対戦できる問題がまだ足りません。');
      const pool = await loadPool(subject);
      const byId = new Map(pool.map((q) => [q.id, q]));
      const qs = ids.map((id) => byId.get(id)).filter((q): q is BattleQuestion => Boolean(q));
      if (!alive) return;
      setQuestions(qs);
      movesRef.current = qs.map((q, i) =>
        decideAiMove(profile, q, resolveTimeLimit(q, rules), seedRef.current, i),
      );
      setPhase('ready');
    })().catch((e: Error) => {
      if (!alive) return;
      setError(e.message || '問題の読み込みに失敗しました。');
      setPhase('error');
    });
    return () => {
      alive = false;
    };
    // level は profile 経由で使う。subject/level/matchNo が変わったら作り直す
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, level, rules, matchNo, chapterId]);

  // ------------------------------------------------------------
  // 時計
  // ------------------------------------------------------------
  useEffect(() => {
    if (phase !== 'playing') return;
    const timer = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(timer);
  }, [phase]);

  const current = questions[currentIndex] || null;
  // 音源・絵の先読み（いまの問題と次の問題）
  useEffect(() => { if (questions.length) warmAssets(preloadTargets(questions, currentIndex, 2)); }, [questions, currentIndex]);
  const remainMs = deadlineMs > 0 ? Math.max(0, deadlineMs - now) : 0;
  const preStartMs = (() => {
    if (phase !== 'playing' || currentIndex !== 0 || !current || deadlineMs <= 0) return 0;
    return Math.max(0, deadlineMs - resolveTimeLimit(current, rules) * 1000 - now);
  })();

  const myRecord = mySheet[answerKeyOf(currentIndex)] || null;
  const answered = Boolean(myRecord);
  const aiRecord = aiSheet[answerKeyOf(currentIndex)] || null;
  const opponentAnswered = Boolean(aiRecord);

  // 問題が変わったらパネルの入力を捨てる
  useEffect(() => {
    setPanel([]);
  }, [currentIndex]);

  // ------------------------------------------------------------
  // 開始
  // ------------------------------------------------------------
  const openQuestion = useCallback(
    (index: number) => {
      const q = questions[index];
      if (!q) return;
      // ★1問目だけカウントダウン（3・2・1・START!）の分だけ開始を後ろに置く★
      //   人間戦（useBattleRoom.start）と同じ見せ方にそろえる。
      //   速さ点の基準（startsRef）はカウントダウン終了時刻なので、点の付き方は変わらない。
      const startMs = Date.now() + (index === 0 ? COUNTDOWN_TOTAL_MS : 0);
      const limit = resolveTimeLimit(q, rules);
      startsRef.current.set(index, startMs);
      setCurrentIndex(index);
      setDeadlineMs(startMs + limit * 1000);
      setNow(startMs);
      advancingRef.current = false;
    },
    [questions, rules],
  );

  const start = useCallback(() => {
    if (phase !== 'ready' || questions.length === 0) return;
    setMySheet({});
    setAiSheet({});
    setPhase('playing');
    openQuestion(0);
  }, [phase, questions.length, openQuestion]);

  // ------------------------------------------------------------
  // AI の解答（遅延が来たら記録する）
  // ------------------------------------------------------------
  useEffect(() => {
    if (phase !== 'playing' || !current) return;
    const move = movesRef.current[currentIndex];
    const startMs = startsRef.current.get(currentIndex);
    if (!move || startMs == null) return;
    if (aiSheet[answerKeyOf(currentIndex)]) return;

    /*
     * ★A21：AI の答え（正誤＋解答時刻）は試合開始時に decideAiMove で確定済み★
     *   あなたが答えたあとは、AI の予定時刻を待たずに 0.8〜1.5秒（ランダム・決定論）で表示する。
     *   採点に使う AI の解答時刻（answeredAt）は予定どおり＝速さの点は変わらない。
     *   （以前は AI が制限時間の9割まで考えることがあり、答えた後に長く待たされていた）
     */
    const fireAt = startMs + move.delayMs;
    const mine = mySheet[answerKeyOf(currentIndex)];
    const revealAt = mine ? mine.answeredAt + aiRevealLagMs(seedRef.current, currentIndex) : Infinity;
    const wait = Math.max(0, Math.min(fireAt, revealAt) - Date.now());
    const timer = window.setTimeout(() => {
      const rec = aiAnswerRecord(currentIndex, move, startMs);
      if (!rec) return;
      setAiSheet((prev) =>
        prev[answerKeyOf(currentIndex)] ? prev : { ...prev, [answerKeyOf(currentIndex)]: rec },
      );
    }, wait);
    return () => window.clearTimeout(timer);
    // aiSheet は「もう答えたか」の判定にだけ使うので依存に含めない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, current, currentIndex, !!mySheet[answerKeyOf(currentIndex)]]);

  // ------------------------------------------------------------
  // 進行（両者解答 or 締切 → 少し見せて次へ／終了）
  // ------------------------------------------------------------
  const bothAnswered = answered && opponentAnswered;
  const timeUp = deadlineMs > 0 && now >= deadlineMs + DEADLINE_GRACE_MS;
  const revealable = bothAnswered || timeUp;

  useEffect(() => {
    if (phase !== 'playing' || !current || !revealable) return;
    if (advancingRef.current) return;
    advancingRef.current = true;
    const timer = window.setTimeout(() => {
      const next = currentIndex + 1;
      if (next >= questions.length) {
        setPhase('finished');
      } else {
        openQuestion(next);
      }
    }, REVEAL_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [phase, current, revealable, currentIndex, questions.length, openQuestion]);

  // ------------------------------------------------------------
  // 採点
  // ------------------------------------------------------------
  const scores = useMemo(() => {
    if (questions.length === 0) return null;
    const starts = startsRef.current;
    return {
      me: scoreBattlePlayer(uid, questions, mySheet, rules, starts),
      other: scoreBattlePlayer(aiUid, questions, aiSheet, rules, starts),
    };
    // startsRef は phase / currentIndex の変化と一緒に更新される
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, uid, aiUid, mySheet, aiSheet, rules, currentIndex, phase]);

  const finished = phase === 'finished';
  const result = useMemo(() => {
    if (!scores || !finished) return null;
    return judgeBattle(scores.me, scores.other, rules);
  }, [scores, finished, rules]);

  // ------------------------------------------------------------
  // 操作
  // ------------------------------------------------------------
  const submittable = phase === 'playing' && !answered && remainMs > 0 && preStartMs <= 0;

  const record = useCallback(
    (payload: { choice: number; panel: number[] }) => {
      if (!submittable) return;
      const rec: BattleAnswerRecord = {
        index: currentIndex,
        choice: payload.choice,
        panel: payload.panel,
        answeredAt: Date.now(),
      };
      setMySheet((prev) =>
        prev[answerKeyOf(currentIndex)] ? prev : { ...prev, [answerKeyOf(currentIndex)]: rec },
      );
    },
    [submittable, currentIndex],
  );

  const choose = useCallback(
    (index: number) => {
      if (!current) return;
      record({ choice: index, panel: [] });
    },
    [current, record],
  );

  const commitPanel = useCallback(
    (order: number[]) => {
      if (!current) return;
      if (order.length !== current.panelOrder.length) return;
      record({ choice: NO_ANSWER, panel: order });
    },
    [current, record],
  );

  const pushPanel = useCallback(
    (index: number) => {
      if (!current || !submittable) return;
      const need = current.panelOrder.length;
      const isKana = current.format === 'kana';
      setPanel((prev) => {
        if (!isKana && prev.includes(index)) return prev;
        if (prev.length >= need) return prev;
        const next = [...prev, index];
        if (!isKana && next.length === need) commitPanel(next);
        return next;
      });
    },
    [current, submittable, commitPanel],
  );

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

  const commitKana = useCallback(() => {
    if (!current || current.format !== 'kana') return;
    commitPanel(panel);
  }, [current, commitPanel, panel]);

  const popPanel = useCallback(() => {
    if (answered) return;
    setPanel((prev) => prev.slice(0, -1));
  }, [answered]);

  return {
    phase,
    error,
    subject,
    level,
    rules,
    questions,
    currentIndex,
    current,
    remainMs,
    /** いまの問の制限時間（秒）。useBattleRoom と同じ理由で resolveTimeLimit の結果を渡す。 */
    limitSec: current ? resolveTimeLimit(current, rules) : 0,
    answered,
    opponentAnswered,
    myChoice: myRecord?.choice ?? NO_ANSWER,
    myPanel: myRecord ? myRecord.panel || [] : panel,
    myScore: scores?.me.score ?? 0,
    opponentScore: scores?.other.score ?? 0,
    myDetail: scores?.me ?? null,
    opponentDetail: scores?.other ?? null,
    scores,
    result,
    finished,
    me: {
      uid,
      nickname: user ? resolveNickname() : 'あなた',
      photoURL: user?.photoURL || '',
    },
    opponent: {
      uid: aiUid,
      nickname: profile.name,
      photoURL: '',
      rating: profile.displayRating,
    },
    preStartMs,
    myAnsweredIndexes: Object.keys(mySheet)
      .map((k) => answerIndexOf(k))
      .filter((n): n is number => n != null),
    submittable,
    start,
    choose,
    pushPanel,
    popPanel,
    cyclePanel,
    commitKana,
  };
}
