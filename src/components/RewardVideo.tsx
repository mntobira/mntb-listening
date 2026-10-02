import { useEffect, useRef, useState } from 'react';
import { completedVideoToken } from '../battle/data/growthStore';
/** An in-app support clip, NOT a simulated commercial ad or revenue-producing integration. */
export function RewardVideo({ onComplete, onCancel }: { onComplete: (token: object) => void; onCancel: () => void }) {
  const video = useRef<HTMLVideoElement>(null); const dialog = useRef<HTMLDialogElement>(null);
  const watched = useRef(0); const lastTime = useRef(0); const lastWall = useRef(0); const done = useRef(false);
  const [message, setMessage] = useState('最後まで再生すると1回引けます。広告ではなくアプリ内の応援動画です。');
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    dialog.current?.showModal();
    const timer = window.setInterval(() => {
      const v = video.current; if (!v) return;
      const now = performance.now();
      if (!v.paused && !v.seeking && document.visibilityState === 'visible' && v.playbackRate === 1) {
        const elapsed = (now - lastWall.current) / 1000;
        const delta = v.currentTime - lastTime.current;
        if (delta > 0 && delta <= elapsed + 0.35) watched.current += Math.min(delta, elapsed);
      }
      lastTime.current = v.currentTime; lastWall.current = now;
      if (Number.isFinite(v.duration)) setRemaining(Math.max(0, Math.ceil(v.duration - watched.current)));
    }, 100);
    const hide = () => { if (document.visibilityState === 'hidden') video.current?.pause(); };
    document.addEventListener('visibilitychange', hide);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', hide); video.current?.pause(); };
  }, []);
  const finish = () => {
    const v = video.current;
    if (!v || done.current) return;
    if (Number.isFinite(v.duration) && watched.current >= v.duration - 0.6) { done.current = true; onComplete(completedVideoToken()); }
    else { setMessage('早送り・バックグラウンド再生は対象外です。もう一度、最後まで再生してください。'); watched.current = 0; v.currentTime = 0; lastTime.current = 0; }
  };
  return <dialog ref={dialog} className="game-details-dialog mt-dialog" onCancel={e => { e.preventDefault(); onCancel(); }} aria-label="動画を見て1回引く"><header><h2>応援動画で1回</h2><button type="button" onClick={onCancel}>閉じる</button></header><div className="game-details-body"><p role="status">{message}</p><video ref={video} src="/cinematics/title.mp4" playsInline preload="auto" disablePictureInPicture controlsList="nodownload noplaybackrate noremoteplayback" onPlay={() => { lastTime.current = video.current?.currentTime ?? 0; lastWall.current = performance.now(); }} onEnded={finish} onError={() => setMessage('動画を読み込めませんでした。報酬回数は消費されていません。')} style={{width:'100%',borderRadius:16}}/><p>{remaining === null ? '読み込み中' : `視聴完了まであと${remaining}秒`}</p><button type="button" onClick={() => void video.current?.play().catch(() => setMessage('ブラウザが再生を止めました。もう一度、再生を押してください。'))}>再生／再開</button><p>途中で閉じた場合は回数を消費しません。無料抽選の重複にコイン返還はありません。</p></div></dialog>;
}
