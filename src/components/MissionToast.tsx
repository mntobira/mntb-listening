/**
 * ミッション達成の演出（アプリ全体で1つ）— 2026-10-01 D で強化。
 *
 * どの画面にいても、デイリーミッションを達成した瞬間に出る。
 *   ① 画面の中央に「MISSION CLEAR!」のスタンプ＋光の輪＋紙ふぶき（1.4秒）
 *   ② そのあと上のトースト（受け取る／閉じる）に縮んで残る
 * 「受け取る」でミッション画面へ（受け取りはそこで行う＝報酬の二重付与を避ける）。
 * 動きを減らす設定では①を出さず、トーストだけ。通信はしない。
 */
import { useEffect, useRef, useState } from 'react';
import { Trophy, X } from 'lucide-react';
import { subscribeMissionComplete, type MissionAnnouncement } from '../battle/data/growthStore';
import { play } from '../battle/ui/feedback';
import { TobiraBuddy } from './TobiraBuddy';
import './mission-clear.css';

const SHOW_MS = 5200;
const BURST_MS = 1500;

export function MissionToast({ onOpen }: { onOpen: () => void }) {
  const [queue, setQueue] = useState<MissionAnnouncement[]>([]);
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
    if (!current || burst) return;
    timer.current = setTimeout(() => setQueue((q) => q.slice(1)), SHOW_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [current, burst]);

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

  if (!current) return null;
  return (
    <div className="mission-toast" role="status" aria-live="polite" data-mission-toast key={current.id}>
      <span className="mission-toast-icon" aria-hidden="true"><Trophy size={22} /></span>
      <div className="mission-toast-body">
        <strong>ミッション達成！</strong>
        <span>{current.label}</span>
        <small>+{current.rewardXp} XP ・ +{current.rewardCoins} マナコイン{queue.length > 1 ? `（ほか${queue.length - 1}件）` : ''}</small>
      </div>
      <button type="button" className="mission-toast-claim" onClick={() => { setQueue([]); onOpen(); }}>受け取る</button>
      <button type="button" className="mission-toast-close" aria-label="閉じる" onClick={() => setQueue((q) => q.slice(1))}><X size={16} /></button>
      <span className="mission-toast-timer" style={{ animationDuration: `${SHOW_MS}ms` }} aria-hidden="true" />
    </div>
  );
}
