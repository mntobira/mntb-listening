import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './cinematic-celebration.css';

/** Locally hosted generated clips; no paid API or session-cookie URLs at runtime. */
/*
 * ★2026-10-26 とびら君 C動画 16本を Adobe Firefly で作り直して全部差し替え★（台帳 docs/CINEMATICS.md）
 *   背景はすべてクリーム色 #FBF5E8 に統一（緑・肌色の背景は とびら君だけ切り抜いて塗り替え）。
 *   Firefly が最初と最後に貼る参照画像のコマ（画質が違う）は切り落としてある。
 *   UR の夜空（gachaUrBuild）と金色（gachaUrFinale）は演出なので背景はそのまま。
 */
export const CINEMATIC_CLIPS = {
  // E4（2026-11-03）運営者が送った動画から作り直し（顔が崩れるコマを外してつないだ3.1秒。scripts/firefly-kit/title_e4.py）
  title: { src: '/cinematics/title.mp4', poster: '/cinematics/title-poster.webp' },
  // コンボ攻撃（2.8秒×1.15倍＝約2.4秒）。対戦の答え合わせ 3.5 秒に収まる
  special: { src: '/cinematics/attack.mp4', playbackRate: 1.15 },
  // ガチャ：抽選の通信を待つあいだ（扉が開いて白い光）
  gacha: { src: '/cinematics/gacha.mp4' },
  // 勝利（3.5秒・正面のままジャンプ→紙ふぶき）
  victory: { src: '/cinematics/victory.mp4', poster: '/cinematics/victory-poster.webp' },
  // 負け（E2 2026-11-03：以前の lose.mp4 は表情が崩れて見えたので削除。ウインク＋グッドの gacha_r を「はげまし」に流用・2.0秒）
  lose: { src: '/cinematics/gacha_r.mp4', poster: '/cinematics/gacha_r-poster.webp' },
  // ガチャの確定演出の丸窓（レア度ごと）。GACHA_REVEAL_CLIPS で並べる
  gachaN: { src: '/cinematics/gacha_n.mp4' },
  gachaR: { src: '/cinematics/gacha_r.mp4' },
  gachaSr: { src: '/cinematics/gacha_sr.mp4' },
  gachaUrBuild: { src: '/cinematics/gacha_ur_build.mp4' },
  gachaUrFinale: { src: '/cinematics/gacha_ur_finale.mp4' },
  // お祝い（CelebrationClip で画面の上に1回だけ出す）
  levelup: { src: '/cinematics/levelup.mp4', poster: '/cinematics/levelup-poster.webp' },
  perfect: { src: '/cinematics/perfect.mp4', poster: '/cinematics/perfect-poster.webp' },
  loginBonus: { src: '/cinematics/login_bonus.mp4', poster: '/cinematics/login_bonus-poster.webp' },
  setComplete: { src: '/cinematics/set_complete.mp4', poster: '/cinematics/set_complete-poster.webp' },
  rankUp: { src: '/cinematics/rank_up.mp4', poster: '/cinematics/rank_up-poster.webp' },
  streak: { src: '/cinematics/streak.mp4', poster: '/cinematics/streak-poster.webp' },
};
export type CinematicName = keyof typeof CINEMATIC_CLIPS;
type Clip = { src: string; poster?: string; playbackRate?: number };
const clipOf = (name: CinematicName): Clip => CINEMATIC_CLIPS[name];

/** ガチャの確定演出の丸窓で流す順番（引いたレア度ごと）。演出の長さ（gachaRevealSteps）に収まる */
export const GACHA_REVEAL_CLIPS: Record<'N' | 'R' | 'SR' | 'UR' | 'LR', CinematicName[]> = {
  N: ['gachaN'], R: ['gachaR'], SR: ['gachaSr'], UR: ['gachaUrFinale'], LR: ['gachaUrBuild', 'gachaUrFinale'],
};

/** いくつかの動画を順番に1回ずつ流す（ガチャの LR：ため→大当たり） */
export function CinematicSequence({ names, label }: { names: CinematicName[]; label: string }) {
  const [i, setI] = useState(0);
  const name = names[i];
  if (!name) return null;
  const c = clipOf(name);
  return <CinematicClip src={c.src} poster={c.poster} playbackRate={c.playbackRate} label={label} hold={i === names.length - 1}
    onComplete={() => setI(n => n + 1)} />;
}

/**
 * ★お祝いの動画を画面の上に1回だけ出す（2026-10-26）★
 *   レベルアップ・ランクアップ・ログインボーナス・セット完成・連続学習で使う。
 *   ・読み込めて再生が始まるまでは見えない（読み込み中に画面をふさがない）
 *   ・タップか「とじる」で消える。動画が終わったら自動で消える
 *   ・同じ onceKey は同じタブで1回だけ（結果画面を開き直しても2回出ない）
 *   ・動きを減らす設定・データセーバーでは CinematicClip がすぐ止めるので何も出ない
 */
export function CelebrationClip({ name, label, onceKey, delayMs = 0, onDone }: {
  name: CinematicName; label: string; onceKey?: string; delayMs?: number; onDone?: () => void;
}) {
  const storeKey = onceKey ? `cinematic-once:${onceKey}` : '';
  const [open, setOpen] = useState(() => { try { return !storeKey || !sessionStorage.getItem(storeKey); } catch { return true; } });
  const [ready, setReady] = useState(delayMs <= 0);
  const [active, setActive] = useState(false);
  const doneRef = useRef(onDone); doneRef.current = onDone;
  useEffect(() => {
    if (!open || ready) return;
    const t = setTimeout(() => setReady(true), delayMs);
    return () => clearTimeout(t);
  }, [open, ready, delayMs]);
  useEffect(() => { if (open && ready && storeKey) { try { sessionStorage.setItem(storeKey, '1'); } catch { /* 保存できなくても再生はする */ } } }, [open, ready, storeKey]);
  const closed = useRef(false);
  if (!open || !ready) return null;
  const close = () => { if (closed.current) return; closed.current = true; setOpen(false); doneRef.current?.(); };
  const c = clipOf(name);
  return createPortal(<div className={`cinematic-celebration ${active ? 'is-active' : ''}`} role="dialog" aria-label={label} onClick={close} data-cinematic-celebration={name}>
    <div className="cinematic-celebration-frame">
      <CinematicClip src={c.src} poster={c.poster} playbackRate={c.playbackRate} label={label} onActiveChange={a => { if (a) setActive(true); }} onComplete={close} />
    </div>
  </div>, document.body);
}
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
