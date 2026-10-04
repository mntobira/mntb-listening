/**
 * ===================================================================
 * BattleLobby — 部屋の待機画面（合言葉を見せて相手を待つ）
 * ===================================================================
 *
 * ★合言葉を画面いっぱいに出す理由★
 * この画面の役目は「相手に4文字を伝える」ことだけ。
 * 目の前の友達に見せる／通話で読み上げる／写真に撮ってもらう、
 * どの使い方でも一発で読めるサイズにする。
 *
 * ★「はじめる」を部屋主だけに出す理由★
 * 両方が押せると、押した瞬間に deadlineAt が2回書かれ、
 * 後から書かれた方に上書きされて片方の残り時間がずれる。
 * 開始の書き込みは1人に限定する（進行中の advanceQuestion は
 * 逆に両者が呼べる設計にしてある。部屋主が落ちても止まらないように）。
 *
 * ★相手が入るまで「はじめる」を押させない理由★
 * 1人で開始すると相手は「もう始まっている試合」に途中参加することになり、
 * 最初の数問を無回答で失う。相手の参加を待ってから開始する。
 *
 * ★全国対戦（joinCode が空）の部屋は別の見せ方にする★
 * 全国対戦の部屋は findOrEnqueue が「2人揃った状態」で作り、
 * useBattleRoom が自動で開始する（nationalAutoStartDelayMs）。
 * ここで合言葉・「はじめる」・「相手を待っています」を出すと、
 * 利用者には★フレンド対戦の画面に飛ばされた★ように見える（実際に指摘された）。
 * 全国対戦では「相手が見つかった／まもなく始まる」だけを見せ、
 * 押すものは「やめる」だけにする。
 */

import { Check, Copy, Settings2, Share2, X } from 'lucide-react';
import { FRIEND_MODES, friendModeOfRules, type FriendModeId } from '../core/friendModes';
import { POOL_FORMAT_COUNTS, poolCountOf } from '../data/battlePool';
import { effectiveRule } from '../data/battle';
import { QUESTION_COUNT_CHOICES, type QuestionCountChoice } from './BattleSubjectSelect';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useBattleAudio } from '../hooks/useBattleAudio';
import { OpponentCard } from './OpponentCard';
import { subjectTheme } from '../../data/subjectTheme';
import type { SubjectKey } from '../../data/allChapters';
import type { BattleRoom } from '../core/types';
import {
  AMBER,
  BattleButton,
  BattleNotice,
  BattleShell,
  BattleTitle,
  GOLD,
  INK,
  INK_SUB,
  LINE,
  PlayerBadge,
} from './BattleParts';

export interface FriendRoomSettings { subject: string; questionCount: QuestionCountChoice; mode: FriendModeId }

export function BattleLobby({
  room,
  myUid,
  onStart,
  onLeave,
  error,
  starting = false,
  poolReady = true,
  onChangeSettings,
  changing = false,
}: {
  room: BattleRoom;
  myUid: string;
  onStart: () => void;
  onLeave: () => void;
  /** 開始の失敗・問題の読み込み失敗など（以前は表示されず「押しても反応しない」ように見えた） */
  error?: string | null;
  starting?: boolean;
  poolReady?: boolean;
  /** 部屋主だけ：部屋の中で科目・モード・問題数を変える（相手は自動で次の部屋へ移る） */
  onChangeSettings?: (next: FriendRoomSettings) => void;
  changing?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const currentMode = friendModeOfRules(room.rules);
  const [showSettings, setShowSettings] = useState(false);
  const [draft, setDraft] = useState<FriendRoomSettings>(() => ({
    subject: room.subject,
    questionCount: (QUESTION_COUNT_CHOICES as readonly number[]).includes(room.questionIds.length) ? room.questionIds.length as QuestionCountChoice : 10,
    mode: currentMode.id,
  }));
  const subjects = Object.keys(POOL_FORMAT_COUNTS).filter((s) => {
    try { const r = effectiveRule(s); return r.enabled && poolCountOf(s, r.formats) > 0; } catch { return false; }
  });
  const theme = subjectTheme(room.subject as SubjectKey);

  const isHost = room.hostUid === myUid;
  const opponentUid = room.players.find((p) => p !== myUid) || '';
  const me = room.profiles[myUid];
  const opponent = opponentUid ? room.profiles[opponentUid] : null;
  const ready = Boolean(opponent);
  /** 全国対戦（合言葉なし）の部屋か。見せ方が変わる（上の説明を参照）。 */
  const isNational = !room.joinCode;

  /**
   * ★待機中の音★
   * 待っている間は期待感のあるループ（BGM ON のときだけ）。
   * 相手が入ってきた瞬間に合図の効果音を1回鳴らす（画面を見ていなくても分かる）。
   */
  const { play } = useBattleAudio('matching');
  const wasReadyRef = useRef(ready);
  useEffect(() => {
    if (ready && !wasReadyRef.current) play('matched');
    wasReadyRef.current = ready;
  }, [ready, play]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.joinCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // クリップボードが使えない環境（iOSの一部）では何もしない。
      // 合言葉は画面に大きく出ているので手で伝えられる。
    }
  };

  const share = async () => {
    // Web Share API があるときだけ出す（LINEに直接送れる端末が多い）
    const nav = navigator as Navigator & {
      share?: (data: { title?: string; text?: string }) => Promise<void>;
    };
    if (!nav.share) return;
    try {
      await nav.share({
        title: 'マナトビ 対戦モード',
        text: `マナトビの対戦しよう！ 合言葉は「${room.joinCode}」（${theme.label}）※フレンドどうしだけ入れます`,
      });
    } catch {
      // 共有をキャンセルしただけなので無視する
    }
  };

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <BattleShell
      footer={
        <div className="grid gap-2.5">
          {isNational ? (
            // 全国対戦：開始は自動。押すものは「やめる」だけ。
            <BattleNotice message="まもなく始まります…" tone="info" />
          ) : isHost ? (
            <BattleButton onClick={onStart} disabled={!ready || starting || changing}>
              {changing ? '部屋を作り直しています…' : starting ? '開始しています…' : !poolReady ? '問題を準備中…（押すと再読み込み）' : ready ? 'はじめる' : '相手を待っています…'}
            </BattleButton>
          ) : (
            <BattleNotice
              message={ready ? '相手がはじめるのを待っています…' : '部屋に入りました'}
              tone="info"
            />
          )}
          <BattleButton variant="danger" onClick={onLeave} icon={<X size={18} />}>
            {isNational ? 'やめる' : '部屋をでる'}
          </BattleButton>
        </div>
      }
    >
      <BattleTitle subtitle={`${theme.label} ／ ${room.questionIds.length}問しょうぶ${isNational ? '' : ` ／ ${currentMode.label}`}`} />
      {error && <div className="mb-3" role="alert"><BattleNotice message={error} /></div>}

      {/* ★部屋の中で科目・モード・問題数を選ぶ（部屋主）★ */}
      {!isNational && isHost && onChangeSettings && (
        <section className="battle-card-in mb-4 rounded-3xl border-2 p-4" style={{ borderColor: LINE, background: '#FFFFFF' }} data-room-settings>
          <button type="button" className="flex w-full items-center justify-between text-sm font-black" style={{ color: INK }}
            aria-expanded={showSettings} onClick={() => setShowSettings((v) => !v)}>
            <span className="flex items-center gap-1.5"><Settings2 size={16} /> 対戦の設定（科目・モード・問題数）</span>
            <span className="text-xs" style={{ color: INK_SUB }}>{showSettings ? 'とじる' : 'かえる'}</span>
          </button>
          {showSettings && <div className="mt-3 grid gap-3">
            <label className="grid gap-1 text-xs font-black" style={{ color: INK_SUB }}>科目
              <select className="min-h-11 rounded-xl border-2 bg-white px-2 text-sm font-bold" style={{ borderColor: LINE, color: INK }}
                value={draft.subject} onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}>
                {subjects.map((s) => <option key={s} value={s}>{subjectTheme(s as SubjectKey).label}</option>)}
              </select>
            </label>
            <div className="grid gap-1" role="radiogroup" aria-label="モード">
              <span className="text-xs font-black" style={{ color: INK_SUB }}>モード</span>
              {FRIEND_MODES.map((m) => <button key={m.id} type="button" role="radio" aria-checked={draft.mode === m.id}
                onClick={() => setDraft((d) => ({ ...d, mode: m.id }))}
                className="rounded-2xl border-2 px-3 py-2 text-left" style={{ borderColor: draft.mode === m.id ? AMBER : LINE, background: draft.mode === m.id ? `${GOLD}22` : '#FFFFFF' }}>
                <span className="block text-sm font-black" style={{ color: INK }}>{m.label}</span>
                <span className="block text-xs font-bold" style={{ color: INK_SUB }}>{m.desc}{draft.subject === 'english_listening' && m.rules.timeLimitOverride ? '（リスニングは音源のため時間は55秒のまま）' : ''}</span>
              </button>)}
            </div>
            <div className="grid gap-1" role="radiogroup" aria-label="問題数">
              <span className="text-xs font-black" style={{ color: INK_SUB }}>問題数</span>
              <div className="grid grid-cols-3 gap-2">{QUESTION_COUNT_CHOICES.map((n) => <button key={n} type="button" role="radio" aria-checked={draft.questionCount === n}
                onClick={() => setDraft((d) => ({ ...d, questionCount: n }))}
                className="min-h-11 rounded-xl border-2 text-sm font-black" style={{ borderColor: draft.questionCount === n ? AMBER : LINE, background: draft.questionCount === n ? `${GOLD}22` : '#FFFFFF', color: INK }}>{n}問</button>)}</div>
            </div>
            <BattleButton onClick={() => { setShowSettings(false); onChangeSettings(draft); }} disabled={changing || starting}>
              この設定にする{opponent ? '（相手も自動で移動します）' : ''}
            </BattleButton>
          </div>}
        </section>
      )}
      {!isNational && !isHost && (
        <p className="mb-3 text-center text-xs font-bold" style={{ color: INK_SUB }}>
          設定は部屋を作った人が選びます。変わったときは自動で新しい設定の部屋へ移ります。
        </p>
      )}

      {/* 合言葉 */}
      {room.joinCode ? (
        <section
          id="battle-join-code"
          className="battle-card-in battle-sheen mb-5 rounded-3xl border-2 p-5 text-center"
          style={{
            borderColor: `${GOLD}AA`,
            background: '#FFFFFF',
            boxShadow: `0 6px 0 ${GOLD}33`,
          }}
        >
          <p
            className="relative z-[2] text-xs font-black tracking-widest"
            style={{ color: INK_SUB }}
          >
            あいことば
          </p>
          {/*
            ★合言葉の文字色をゴールドにしない★
            アイボリー地の上の #F4D03F は輝度が近すぎて読めない。
            この4文字は「相手に読み上げてもらう」のが全てなので、
            視認性を優先して濃紺にし、ゴールドは下地に使う。
          */}
          <p
            className="relative z-[2] my-1 inline-block rounded-2xl px-4 py-1 text-5xl font-black tracking-[0.2em] tabular-nums"
            style={{ background: `${GOLD}3D`, color: INK }}
          >
            {room.joinCode}
          </p>
          <p className="relative z-[2] mb-3 text-xs font-bold" style={{ color: INK_SUB }}>
            フレンドに伝えて「合言葉で入る」から入ってもらってください（フレンドどうしだけ入れます）
          </p>
          <div className="relative z-[2] flex justify-center gap-2">
            <button
              type="button"
              onClick={() => void copyCode()}
              className="flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-xs font-black transition active:translate-y-[2px] active:scale-95"
              style={{ borderColor: LINE, background: '#FFFFFF', color: INK }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'コピーしました' : 'コピー'}
            </button>
            {canShare && (
              <button
                type="button"
                onClick={() => void share()}
                className="flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-xs font-black transition active:translate-y-[2px] active:scale-95"
                style={{ background: GOLD, borderColor: '#E5B93C', color: INK }}
              >
                <Share2 size={13} />
                おくる
              </button>
            )}
          </div>
        </section>
      ) : (
        <section
          id="battle-national-matched"
          className="battle-card-in battle-sheen mb-5 rounded-3xl border-2 p-5 text-center"
          style={{
            borderColor: `${GOLD}AA`,
            background: '#FFFFFF',
            boxShadow: `0 6px 0 ${GOLD}33`,
          }}
        >
          <p
            className="relative z-[2] text-xs font-black tracking-widest"
            style={{ color: INK_SUB }}
          >
            ぜんこく対戦
          </p>
          <p className="relative z-[2] my-1 text-2xl font-black" style={{ color: INK }}>
            相手が見つかりました！
          </p>
          <p className="relative z-[2] text-xs font-bold" style={{ color: INK_SUB }}>
            最初の問題は自動で出ます。準備してください。
          </p>
        </section>
      )}

      {/* 対戦カード */}
      <section
        className="battle-card-in rounded-3xl border-2 p-4"
        style={
          { borderColor: LINE, background: '#FFFFFF', '--card-delay': '0.08s' } as CSSProperties
        }
      >
        <div className="flex items-center gap-2">
          <PlayerBadge
            nickname={me?.nickname || 'あなた'}
            photoURL={me?.photoURL}
            rating={me?.rating ?? 1500}
            isMe
          />
          <span
            className="battle-vs-pulse shrink-0 rounded-lg px-1.5 py-0.5 text-xs font-black"
            style={{ background: GOLD, color: INK }}
          >
            VS
          </span>
          {opponent ? (
            <PlayerBadge
              nickname={opponent.nickname}
              photoURL={opponent.photoURL}
              rating={opponent.rating}
              mask={!room.joinCode}
              align="right"
            />
          ) : (
            <div className="flex min-w-0 flex-1 flex-row-reverse items-center gap-2 text-right">
              <div
                className="h-9 w-9 shrink-0 animate-pulse rounded-full border-2"
                style={{ background: '#F1EDE4', borderColor: LINE }}
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-black" style={{ color: INK_SUB }}>
                  相手を待っています
                  {/* ★点々で「この画面は生きている」と伝える★ */}
                  {['0s', '0.15s', '0.3s'].map((d) => (
                    <span
                      key={d}
                      className="battle-dot inline-block"
                      style={{ '--dot-delay': d } as CSSProperties}
                    >
                      .
                    </span>
                  ))}
                </p>
                {!isNational && (
                  <p className="text-xs font-bold" style={{ color: INK_SUB }}>
                    フレンドに合言葉を伝えましたか？
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
      {opponent && <OpponentCard uid={opponentUid} nickname={opponent.nickname} photoURL={opponent.photoURL} rating={opponent.rating} mask={!room.joinCode} />}

      {room.rules.note && (
        <p className="mt-4 text-center text-xs font-bold leading-relaxed" style={{ color: AMBER }}>
          {room.rules.note}
        </p>
      )}

      <div className="mt-auto pt-6">
        <p
          className="text-center text-xs font-bold leading-relaxed"
          style={{ color: INK_SUB }}
        >
          先に押した方が勝ちではありません。
          <br />
          同じ問題が2人に同時に出て、正解と速さで点が決まります。
          <br />
          回線の速さで勝敗は変わりません。
        </p>
      </div>
    </BattleShell>
  );
}
