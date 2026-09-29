import { useEffect, useRef, useState } from 'react';

/** Locally hosted generated clips; no paid API or session-cookie URLs at runtime. */
export const CINEMATIC_CLIPS = {
  title: { src: '/cinematics/title.mp4', poster: '/cinematics/title-poster.webp' },
  // 2026-09-29 差し替え：コンボ攻撃（3.1秒・構えて斬撃→元の立ち姿に戻る）。対戦の答え合わせ 3.5 秒に収まる長さに切った
  special: { src: '/cinematics/attack.mp4', playbackRate: 1.15 },
  gacha: { src: '/cinematics/gacha.mp4' },
  // 2026-09-29 差し替え：勝利（5秒・ジャンプ→紙吹雪とスポットライト→くるっと回って決めポーズ）
  victory: { src: '/cinematics/victory.mp4', poster: '/cinematics/victory-poster.webp' },
};
type Props = {
  src: string; label: string; onActiveChange?: (active: boolean) => void; onComplete?: () => void; playbackRate?: number;
  /** 再生前に見せる1コマ目（動画の最初のフレームと同じ絵にすると、読み込み中も絵が飛ばない） */
  poster?: string;
  /** 再生し終わっても最後のコマを残す（親が次の絵へクロスフェードしてから外す） */
  hold?: boolean;
  /** 最初の画面など、すぐ再生したい動画は先読みする */
  eager?: boolean;
};
export function CinematicClip(props: Props) {
  return props.src ? <ClipPlayback key={props.src} {...props} /> : null;
}
function ClipPlayback({src,label,onActiveChange,onComplete,playbackRate=1,poster,hold=false,eager=false}: Props & {key?: string}) {
  const video=useRef<HTMLVideoElement>(null);
  const callbacks=useRef({onActiveChange,onComplete}); callbacks.current={onActiveChange,onComplete};
  const done=useRef(false); const started=useRef(false);
  const [allowed,setAllowed]=useState(false); const [stopped,setStopped]=useState(false); const [playing,setPlaying]=useState(false);
  const [held,setHeld]=useState(false);
  const stop=()=>{
    if(done.current)return;done.current=true;video.current?.pause();
    // 再生できた動画だけ最後のコマを残す（再生できなかったら何も残さない）
    if(hold&&started.current)setHeld(true);else setStopped(true);
    setPlaying(false);
    callbacks.current.onActiveChange?.(false);callbacks.current.onComplete?.();
  };
  useEffect(()=>{
    const reduce=matchMedia('(prefers-reduced-motion: reduce)');
    const connection=(navigator as Navigator & {connection?:{saveData?:boolean}}).connection;
    const policy=()=>{if(reduce.matches||connection?.saveData||document.hidden)stop();else setAllowed(true);};
    policy();reduce.addEventListener('change',policy);
    const hide=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hide);
    return()=>{reduce.removeEventListener('change',policy);document.removeEventListener('visibilitychange',hide);callbacks.current.onActiveChange?.(false);};
  },[]);
  useEffect(()=>{
    if(!allowed||stopped||!video.current)return;
    let disposed=false;const el=video.current;el.playbackRate=playbackRate;
    const loading=setTimeout(()=>{if(!disposed&&!started.current)stop();},4000);
    const watchdog=setTimeout(()=>{if(!disposed)stop();},8000);
    el.play().catch(()=>{if(!disposed)stop();});
    return()=>{disposed=true;clearTimeout(loading);clearTimeout(watchdog);el.pause();};
  },[allowed,stopped,playbackRate]);
  if(!allowed||stopped)return null;
  const state=held?'is-held':playing?'is-playing':poster?'has-poster':'';
  return <div className={`cinematic-clip ${state}`} role="group" aria-label={label}>
    <video ref={video} src={src} muted playsInline preload={eager?'auto':'none'} poster={poster} disablePictureInPicture aria-hidden="true"
      onPlaying={()=>{started.current=true;setPlaying(true);callbacks.current.onActiveChange?.(true);}} onEnded={stop} onError={stop}/>
    {playing&&!held&&<button type="button" className="cinematic-skip" onClick={stop}>演出をスキップ</button>}
  </div>;
}
