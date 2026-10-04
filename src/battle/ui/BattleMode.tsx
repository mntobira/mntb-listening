/**
 * ===================================================================
 * BattleMode — 対戦モードの入口（★App.tsx が読むのはこの1ファイルだけ★)
 * ===================================================================
 *
 * ★1ファイルだけを公開する理由★
 * 既存の App.tsx への変更を最小にするため。
 * 画面の数は10個あるが、App.tsx から見れば
 *   <BattleMode onExit={...} onRequireLogin={...} />
 * の1行で済む。対戦モードの内部の画面遷移は全部この中で完結させる。
 * 既存の AppState（画面の列挙）に追加するのも 'battle' の1つだけになる。
 *
 * ★ここで onSnapshot を張らない理由★
 * 部屋の購読は BattleRoomScreen（の useBattleRoom）が1本だけ持つ。
 * 上位でも購読すると同じドキュメントを2回読むことになり、
 * 無料枠の読み取り回数が倍になる。
 *
 * ★ルールの上書きを最初に1回だけ読む理由★
 * battle_rules は運用調整用（数学だけ6問にする等）で、普段は空。
 * 教科選択のたびに読むと、対戦していない人でも読み取りが増える。
 * 対戦モードに入ったときに1回だけ読み、以後はメモリのキャッシュを使う。
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  abortRoom,
  createFriendRoom,
  loadBattleRuleOverrides,
} from '../data/battle';
import { ensureBattleRankingEntry } from '../data/battleRanking';
import { battleAudio } from '../audio/battleAudio';
import { useBattleAudioSettings } from '../hooks/useBattleAudio';
import { auth } from '../../firebase';
import type { AiLevel, AiProfile } from '../core/aiOpponent';
import type { GhostReason } from '../core/matchFallback';
import { BattleAiRoomScreen } from './BattleAiRoomScreen';
import { BattleAiSelect } from './BattleAiSelect';
import { BattleFriendJoin } from './BattleFriendJoin';
import { BattleHistory } from './BattleHistory';
import { BattleHome } from './BattleHome';
import { BattleProfile } from './BattleProfile';
import { BattleMissions } from './BattleMissions';
import type { BattleHomeChoice } from './BattleHome';
import { BattleLoading, BattleNotice, BattleShell, BattleTitle } from './BattleParts';
import { BattleMatching } from './BattleMatching';
import { BattleRanking } from './BattleRanking';
import { BattleRoomScreen } from './BattleRoomScreen';
import { BattleSubjectSelect } from './BattleSubjectSelect';
import type { QuestionCountChoice } from './BattleSubjectSelect';

/**
 * 対戦モードの中の画面。
 *
 *  home            … 入口（フレンド/全国/ランキング/履歴）
 *  subject-friend  … 教科選択（部屋を作る）
 *  subject-national… 教科選択（全国対戦）
 *  creating        … 部屋を作っている最中
 *  join            … 合言葉を入れる
 *  matching        … 全国の相手さがし
 *  room            … 部屋の中（待機・対戦・結果）
 *  subject-ai      … 教科選択（AI 対戦）
 *  ai-level        … AI の強さをえらぶ
 *  ai-room         … AI 対戦（端末内で進む。Firestore は使わない）
 *  ranking / history
 */
type Screen =
  | 'home'
  | 'subject-friend'
  | 'subject-national'
  | 'subject-ai'
  | 'ai-level'
  | 'ai-room'
  | 'creating'
  | 'join'
  | 'matching'
  | 'room'
  | 'ranking'
  | 'clan'
  | 'history'
  | 'profile'
  | 'missions';

export function BattleMode({
  onExit,
  onRequireLogin,
  onPractice,
  onActiveChange,
  onReview,
  onOpenFriends,
  initialSubject = '',
}: {
  /** 設定のフレンドページを開く（フレンド対戦はフレンドどうしだけなので、その入口） */
  onOpenFriends?: () => void;
  /** 対戦モードを抜けてアプリのホームに戻る */
  onExit: () => void;
  /** ログインしていないときにログイン画面へ送る */
  onRequireLogin?: () => void;
  /**
   * ★対戦のリザルトから演習へ抜ける（請求⑦-A）★
   *
   * 「① 対戦 ⇒ ② 演習」の橋。対戦モードは自分では演習画面を持たないので、
   * 教科と章IDをアプリ本体（App.tsx）に渡して、そちらに切り替えてもらう。
   * 渡されなかったときはリザルトにボタンが出ない。
   */
  onPractice?: (subject: string, chapterId: string, problemId?: string, subQuestionId?: string) => void;
  onActiveChange?: (active: boolean) => void;
  /**
   * ★リザルトの「復習する」（臨場感アップデート）★
   * 間違えた問題は復習リストに登録済みなので、アプリ本体の学習ノート（復習）へ移る。
   */
  onReview?: () => void;
  initialSubject?: string;
}) {
  const [screen, setScreen] = useState<Screen>('home');
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  useEffect(() => {
    if (screen !== 'creating') return;
    onActiveChange?.(true);
    return () => onActiveChange?.(false);
  }, [screen, onActiveChange]);
  /**
   * ★対戦ボタンを押した瞬間に BGM が途切れる不具合の修正（2026-09-28）★
   * アプリ本体の BGM は対戦モードに入ると止まる（App.tsx の BGM_SILENT_STATES）。
   * ところが対戦ホーム・教科選び・AI 選びなどの画面は自分で BGM を鳴らさないので、
   * 待合室（マッチング）まで無音になっていた。
   * 自前の BGM を持たない画面では、ここで待合室の曲（'matching'）を鳴らし続ける。
   * 自前の BGM を持つ画面（matching / room / ai-room）は、その画面の useBattleAudio に任せる。
   */
  const [audioSettings] = useBattleAudioSettings();
  const lobbyOwner = useRef(Symbol('battle-lobby'));
  const ownsBgm = screen === 'matching' || screen === 'room' || screen === 'ai-room';
  useEffect(() => {
    if (ownsBgm) { battleAudio().releaseBgmOwner(lobbyOwner.current); return; }
    battleAudio().setBgmOwner(lobbyOwner.current, 'matching', 0);
  }, [ownsBgm, audioSettings.bgm]);
  // ★注意★ room / ai-room に入る瞬間にここで曲を鳴らしてはいけない。
  //   React は子の effect を親より先に走らせるので、対戦画面（BattleLiveStage）が
  //   決めた曲を親が上書きしてしまう。所有する画面へは口を出さない。
  useEffect(() => {
    // 対戦モードを抜けたら止める
    const token = lobbyOwner.current;
    return () => battleAudio().releaseBgmOwner(token);
  }, []);
  useEffect(() => {
    // ブラウザが音を止めている（自動再生制限）ときは、最初のタップで再開する
    const resume = () => battleAudio().unlock();
    resume();
    window.addEventListener('pointerdown', resume, { once: true });
    return () => window.removeEventListener('pointerdown', resume);
  }, []);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [subject, setSubject] = useState<string>(initialSubject);
  /**
   * 利用者が選んだ問題数（フレンド・AI でのみ）。undefined なら教科の既定。
   * ご指示「問題数決めれるようにして」。全国対戦は待機列を割らないため対象外
   *（理由は BattleSubjectSelect の QUESTION_COUNT_CHOICES のコメント）。
   */
  const [questionCount, setQuestionCount] = useState<QuestionCountChoice | undefined>(undefined);
  const [chapterId, setChapterId] = useState<string | undefined>(undefined);
  const [aiLevel, setAiLevel] = useState<AiLevel>('normal');
  /**
   * AI 対戦の「もう1回」で試合を作り直すための番号。
   * key に使って BattleAiRoomScreen を作り直す（内部状態を捨てる）。
   */
  const [aiMatchNo, setAiMatchNo] = useState(0);
  /** 全国対戦で相手がいなかったときの AI プレイヤー（ai-room を「全国対戦」として見せる） */
  const [ghost, setGhost] = useState<{ profile: AiProfile; reason: GhostReason } | null>(null);
  /** 「間違えた問題だけ再対戦」の出題ID（AI 戦で、この問題だけを出す）。null なら通常の試合 */
  const [retryIds, setRetryIds] = useState<string[] | null>(null);
  const retryWrong = useCallback((pick: string, ids: string[]) => {
    if (!ids.length) return;
    setSubject(pick); setGhost(null); setChapterId(undefined); setRetryIds(ids.slice(0, 30));
    setAiMatchNo((n) => n + 1); setScreen('ai-room');
  }, []);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ------------------------------------------------------------
  // 初回の準備（ルール上書きの読み込み・ランキング行の作成）
  // ------------------------------------------------------------
  useEffect(() => {
    if (!auth.currentUser) return;
    // どちらも失敗しても対戦は成立する（既定値で動く）ので待たない
    void loadBattleRuleOverrides();
    void ensureBattleRankingEntry();
  }, []);

  // ------------------------------------------------------------
  // 入口の選択
  // ------------------------------------------------------------
  const handleHomeChoice = useCallback((choice: BattleHomeChoice) => {
    setNotice(null);
    setError(null);
    switch (choice) {
      case 'friend-create':
        setScreen('subject-friend');
        break;
      case 'friend-join':
        setScreen('join');
        break;
      case 'national':
        setScreen('subject-national');
        break;
      case 'ai':
        setScreen('subject-ai');
        break;
      case 'ranking':
        setScreen('ranking');
        break;
      case 'clan':
        setScreen('clan');
        break;
      case 'history':
        setScreen('history');
        break;
      case 'profile': setScreen('profile'); break;
      case 'missions': setScreen('missions'); break;
    }
  }, []);

  // ------------------------------------------------------------
  // 部屋を作る
  // ------------------------------------------------------------
  const createRoom = useCallback(async (pick: string, count?: QuestionCountChoice, unit?: string) => {
    setSubject(pick);
    setScreen('creating');
    setError(null);
    try {
      // 問題数を選んでいればルールに上書きして部屋に焼き込む。
      // 部屋の rules は参加者が変えられない（firestore.rules の battleCoreFixed）ので、
      // 相手も同じ問題数で戦うことが保証される。
      const { roomId: created } = await createFriendRoom(
        pick,
        count ? { questionCount: count } : undefined,
        unit,
      );
      if (!mountedRef.current) { void abortRoom(created).catch(() => {}); return; }
      setRoomId(created);
      setScreen('room');
    } catch (e) {
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : '部屋を作れませんでした。');
      setScreen('subject-friend');
    }
  }, []);

  // ------------------------------------------------------------
  // 部屋から戻る
  // ------------------------------------------------------------
  const leaveRoom = useCallback((message?: string) => {
    setRoomId(null);
    setNotice(message || null);
    setScreen('home');
  }, []);

  /** 同じ教科・同じ問題数でもう1回（結果画面から） */
  const rematch = useCallback(
    (pick: string) => {
      setRoomId(null);
      void createRoom(pick, questionCount, chapterId);
    },
    [createRoom, questionCount, chapterId],
  );

  // ------------------------------------------------------------
  // 画面
  // ------------------------------------------------------------
  switch (screen) {
    case 'subject-friend':
      return (
        <>
          {error && (
            <div className="fixed inset-x-0 top-2 z-50 mx-auto max-w-xl px-4">
              <BattleNotice message={error} />
            </div>
          )}
          <BattleSubjectSelect
            currentSubject={subject}
            title="部屋をつくる ／ 教科をえらぶ"
            allowQuestionCount
            showRecent
            onPick={(pick, count, unit) => {
              setQuestionCount(count);
              setChapterId(unit);
              void createRoom(pick, count, unit);
            }}
            onBack={() => setScreen('home')}
          />
        </>
      );

    case 'subject-national':
      return (
        <BattleSubjectSelect
            currentSubject={subject}
          title="全国対戦 ／ 教科をえらぶ"
          showRecent
          // ★全国は問題数を選べない★ 待機列は教科だけでマッチさせている。
          onPick={(pick) => {
            setSubject(pick);
            setQuestionCount(undefined);
            setChapterId(undefined);
            setScreen('matching');
          }}
          onBack={() => setScreen('home')}
        />
      );

    case 'creating':
      return (
        <BattleShell>
          <BattleTitle subtitle="部屋をつくっています" />
          <BattleLoading message="あいことばを用意しています…" />
        </BattleShell>
      );

    case 'join':
      return (
        <BattleFriendJoin
          onJoined={(id) => {
            setChapterId(undefined);
            setQuestionCount(undefined);
            setRoomId(id);
            setScreen('room');
          }}
          onBack={() => setScreen('home')}
          onOpenFriends={onOpenFriends}
        />
      );

    case 'matching':
      return (
        <BattleMatching
          subject={subject}
          onMatched={(id) => {
            setRoomId(id);
            setScreen('room');
          }}
          onCancel={() => setScreen('home')}
          // ★待ちが長いときの逃げ道は「AI と対戦」にする★
          //
          //   以前は「フレンド対戦にする」を押すと、その場で合言葉つきの
          //   部屋が作られて待機画面に飛んでいた。利用者からは
          //   「全国対戦を押したのに、なぜフレンドの部屋にいるのか」と
          //   見えて混乱していた（誰かに合言葉を伝えないと始まらないので、
          //   結局また待つことになる）。
          //   代わりに AI 対戦を出す。同じ教科で、押した瞬間に始まる。
          onSwitchToAi={() => {
            setGhost(null);
            setAiMatchNo((n) => n + 1);
            setScreen('ai-level');
          }}
          onGhostMatch={(g) => {
            setGhost(g);
            setQuestionCount(undefined);
            setChapterId(undefined);
            setAiMatchNo((n) => n + 1);
            setScreen('ai-room');
          }}
        />
      );

    case 'subject-ai':
      return (
        <BattleSubjectSelect
            currentSubject={subject}
          title="AIと対戦 ／ 教科をえらぶ"
          allowQuestionCount
          showRecent
          onRetryWrong={retryWrong}
          onPick={(pick, count, unit) => {
            setSubject(pick);
            setQuestionCount(count);
            setChapterId(unit);
            setScreen('ai-level');
          }}
          onBack={() => setScreen('home')}
        />
      );

    case 'ai-level':
      return (
        <BattleAiSelect
          subject={subject}
          onPick={(level) => {
            setAiLevel(level);
            setGhost(null);
            setRetryIds(null);
            setAiMatchNo((n) => n + 1);
            setScreen('ai-room');
          }}
          onBack={() => setScreen('subject-ai')}
        />
      );

    case 'ai-room':
      return (
        <BattleAiRoomScreen
          matchNo={aiMatchNo}
          subject={subject}
          questionCount={questionCount}
          chapterId={chapterId}
          level={ghost?.profile.level ?? aiLevel}
          ghost={ghost ?? undefined}
          retryIds={retryIds ?? undefined}
          onRetryWrong={retryWrong}
          onExit={(m) => { setGhost(null); setRetryIds(null); leaveRoom(m); }}
          // ★AI プレイヤー戦の「もう1回」は、もう一度全国の人をさがす★（人が来ていればその人と組む）
          onRematch={() => {
            if (ghost) { setGhost(null); setScreen('matching'); return; }
            setRetryIds(null);
            setAiMatchNo((n) => n + 1);
          }}
          onChangeLevel={() => { setGhost(null); setRetryIds(null); setScreen('ai-level'); }}
          onChangeSubject={() => { const wasGhost = !!ghost; setGhost(null); setRetryIds(null); setScreen(wasGhost ? 'subject-national' : 'subject-ai'); }}
          onHome={onExit}
          onPractice={onPractice}
          onActiveChange={onActiveChange}
          onOpenProfile={() => setScreen('profile')}
          onOpenMissions={() => setScreen('missions')}
          onReview={onReview}
        />
      );

    case 'room':
      if (!roomId) {
        // 想定外の状態（部屋IDが無いのに部屋画面）。
        // ★描画中に setScreen を呼ばない★
        //   React は描画の途中の状態更新を警告する（無限ループの原因にもなる）。
        //   代わりに入口の画面をそのまま描く。次の操作で正しい状態に戻る。
        return (
          <BattleHome
            onChoose={handleHomeChoice}
            onExit={onExit}
            onRequireLogin={onRequireLogin}
            notice="対戦を開始できませんでした。もう一度お試しください。"
          />
        );
      }
      return (
        <BattleRoomScreen
          key={roomId}
          roomId={roomId}
          onExit={leaveRoom}
          onRematch={rematch}
          onSwitchRoom={(next) => setRoomId(next)}
          onChangeSubject={(friend) => { setRoomId(null); setScreen(friend ? 'subject-friend' : 'subject-national'); }}
          onNationalAgain={() => { setRoomId(null); setScreen('matching'); }}
          onHome={onExit}
          onPractice={onPractice}
          onActiveChange={onActiveChange}
          onOpenProfile={() => setScreen('profile')}
          onOpenMissions={() => setScreen('missions')}
          onReview={onReview}
          onRetryWrong={retryWrong}
        />
      );

    case 'profile':
      return <BattleProfile onBack={() => setScreen('home')} onMissions={() => setScreen('missions')} />;

    case 'missions':
      return <BattleMissions onBack={() => setScreen('home')} onBattle={() => setScreen('subject-ai')} />;

    case 'ranking':
      return <BattleRanking onBack={() => setScreen('home')} onRequireLogin={onRequireLogin} />;

    case 'clan':
      return <BattleRanking initialTab="clan" onBack={() => setScreen('home')} onRequireLogin={onRequireLogin} />;

    case 'history':
      return <BattleHistory onBack={() => setScreen('home')} onRetryWrong={retryWrong} onStartAi={() => handleHomeChoice('ai')} />;

    case 'home':
    default:
      return (
        <BattleHome
          onChoose={handleHomeChoice}
          onExit={onExit}
          onRequireLogin={onRequireLogin}
          notice={notice}
        />
      );
  }
}

export default BattleMode;
