/**
 * ミッション達成の演出（アプリ全体で1つ）— 2026-10-01 D で強化。
 *
 * どの画面にいても、デイリーミッションを達成した瞬間に出る。
 *   ① 画面の中央に「MISSION CLEAR!」のスタンプ＋光の輪＋紙ふぶき（1.4秒）
 *   ② そのあと上のトースト（受け取る／閉じる）に縮んで残る
 * 「受け取る」はその場で受け取る（2026-10-11 ご要望：ミッション画面へ飛ばさない）。
 *   claimMission は受け取り済みを二重に払わないので、ミッション画面と同時に押しても安全。
 * 動きを減らす設定では①を出さず、トーストだけ。通信はしない。
 */
import { useEffect, useRef, useState } from 'react';
import { Check, Trophy, X } from 'lucide-react';
import { claimMissionReward, subscribeMissionComplete, type MissionAnnouncement } from '../battle/data/growthStore';
import { play } from '../battle/ui/feedback';
import { flyCoins } from '../battle/ui/GrowthParts';
import { TobiraBuddy } from './TobiraBuddy';
import './mission-clear.css';

const SHOW_MS = 5200;
const BURST_MS = 1500;

const CLAIMED_MS = 1800;

export function MissionToast() {
  const [queue, setQueue] = useState<MissionAnnouncement[]>([]);
  /** 受け取った直後の「受け取りました」表示（合計） */
  const [claimed, setClaimed] = useState<{ xp: number; coins: number; n: number } | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [burst, setBurst] = useState<MissionAnnouncement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => subscribeMissionComplete((ms) => {
    setQueue((q) => [...q, ...ms.filter((m) => !q.some((x) => x.id === m.id))]);
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce && ms[0]) { setBurst(ms[0]); setTimeout(() => setBurst(null), BURST_MS); }
    try { play('levelup', true); setTimeout(() => play('coin', false), 420); } catch { /* 音が出せなくても通知は出す */ }
  }), []);

  const current = queue[0];
  useEffect(() => {
    if (!claimed) return;
    const t = setTimeout(() => setClaimed(null), CLAIMED_MS);
    return () => clearTimeout(t);
  }, [claimed]);
  useEffect(() => {
    if (!current || burst || claiming) return;
    timer.current = setTimeout(() => setQueue((q) => q.slice(1)), SHOW_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [current, burst, claiming]);

  /** 出ているミッションをまとめて、その場で受け取る */
  const claimBtn = useRef<HTMLButtonElement>(null);
  const claimAll = async () => {
    if (claiming) return;
    setClaiming(true);
    const list = queue;
    let xp = 0, coins = 0, n = 0;
    for (const m of list) {
      try {
        const r = await claimMissionReward(m.id);
        if (r?.reward) { xp += r.reward.xp; coins += r.reward.coins; n += 1; }
      } catch { /* 1件失敗しても残りは受け取る */ }
    }
    setQueue([]);
    setClaiming(false);
    setClaimed({ xp, coins, n });
    if (n > 0 && claimBtn.current) flyCoins(claimBtn.current, coins);
    try { if (n > 0) play('coin', true); } catch { /* 音なしでも可 */ }
  };

  if (burst) return <div className="mission-clear" role="status" aria-live="assertive" data-mission-clear onClick={() => setBurst(null)}>
    <div className="mission-clear-rays" aria-hidden="true" />
    <div className="mission-clear-confetti" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ ['--i' as string]: i }} />)}</div>
    <div className="mission-clear-card">
      <p className="mission-clear-stamp">MISSION<br />CLEAR!</p>
      <p className="mission-clear-label">{burst.label}</p>
      <p className="mission-clear-reward"><b>+{burst.rewardXp}</b> XP　<b>+{burst.rewardCoins}</b> マナコイン</p>
      <TobiraBuddy size="sm" bubble="none" input={{ screen: 'result', outcome: 'win' }} pose="/mascots/cheering.webp" />
    </div>
  </div>;

  if (claimed && !current) return (
    <div className="mission-toast is-claimed" role="status" aria-live="polite" data-mission-toast="claimed">
      <span className="mission-toast-icon" aria-hidden="true"><Check size={22} /></span>
      <div className="mission-toast-body">
        <strong>{claimed.n > 0 ? '受け取りました！' : '受け取り済みです'}</strong>
        {claimed.n > 0 && <small>+{claimed.xp} XP ・ +{claimed.coins} マナコイン</small>}
      </div>
      <button type="button" className="mission-toast-close" aria-label="閉じる" onClick={() => setClaimed(null)}><X size={16} /></button>
    </div>
  );
  if (!current) return null;
  return (
    <div className="mission-toast" role="status" aria-live="polite" data-mission-toast key={current.id}>
      <span className="mission-toast-icon" aria-hidden="true"><Trophy size={22} /></span>
      <div className="mission-toast-body">
        <strong>ミッション達成！</strong>
        <span>{current.label}</span>
        <small>+{current.rewardXp} XP ・ +{current.rewardCoins} マナコイン{queue.length > 1 ? `（ほか${queue.length - 1}件）` : ''}</small>
      </div>
      <button type="button" ref={claimBtn} className="mission-toast-claim" onClick={() => { void claimAll(); }} disabled={claiming}>{claiming ? '受け取り中…' : queue.length > 1 ? 'まとめて受け取る' : '報酬を受け取る'}</button>
      <button type="button" className="mission-toast-close" aria-label="閉じる" onClick={() => setQueue((q) => q.slice(1))}><X size={16} /></button>
      {!claiming && <span className="mission-toast-timer" style={{ animationDuration: `${SHOW_MS}ms` }} aria-hidden="true" />}
    </div>
  );
}
