import { useEffect, useRef, useState } from 'react';
import './alpha-cinematic.css';

export interface AlphaClipSpec {
  webm: string;
  sbsMp4: string;
  poster: string;
  endPlate: string;
  width: number;
  height: number;
  durationSec: number;
}

export interface FullFrameMovieSpec {
  mp4: string;
  poster: string;
  width: number;
  height: number;
  durationSec: number;
}

/**
 * ① tobirakun_home_github.mp4 を ISNet 1024px ＋ 音波形ロックで完全に切り抜いた透過クリップ。
 * - タイトル画面のとびら君ステージ（モンスト風OPの後）
 * - 対戦モードのカウントダウン（3・2・1・START! 同期）
 * の両方で使用する。
 */
export const ALPHA_CINEMATIC_CLIPS = {
  battleCountdown: {
    webm: '/cinematics/battle_countdown.webm',
    sbsMp4: '/cinematics/battle_countdown-sbs.mp4',
    poster: '/cinematics/battle_countdown-poster.webp',
    endPlate: '/cinematics/battle_countdown-end.webp',
    width: 560,
    height: 980,
    durationSec: 5.16,
  },
} as const satisfies Record<string, AlphaClipSpec>;

/**
 * 切り抜かずに美しい星空・水面反射・光粒子をそのまま見せるフル画角ムービー（1MB未満）。
 * - ② titleOpLandscape : PC・横向きオープニング演出（15秒）
 * - ③ titleOpPortrait  : スマホ・縦向きオープニング演出（15秒）
 * - ④ gachaDuoIntro    : ガチャ確定演出・応援報酬動画（約14.7秒）
 */
export const FULLFRAME_CINEMATIC_MOVIES = {
  titleOpLandscape: {
    mp4: '/cinematics/title_op_landscape.mp4',
    poster: '/cinematics/title_op_landscape-poster.webp',
    width: 960,
    height: 548,
    durationSec: 15.08,
  },
  titleOpPortrait: {
    mp4: '/cinematics/title_op_portrait.mp4',
    poster: '/cinematics/title_op_portrait-poster.webp',
    width: 548,
    height: 960,
    durationSec: 15.08,
  },
  gachaDuoIntro: {
    mp4: '/cinematics/gacha_duo_intro.mp4',
    poster: '/cinematics/gacha_duo_intro-poster.webp',
    width: 540,
    height: 960,
    durationSec: 14.70,
  },
} as const satisfies Record<string, FullFrameMovieSpec>;

export type AlphaCinematicName = keyof typeof ALPHA_CINEMATIC_CLIPS;

/**
 * Safari / iOS WKWebView では VP9 透過 WebM のアルファが黒塗りまたは非対応になるため、
 * 上下スタック H.264 MP4 + Canvas 2D 合成モードへ自動で切り替える。
 */
export function prefersStackedCanvasAlpha(): boolean {
  if (typeof navigator === 'undefined' || typeof document === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const vendor = navigator.vendor || '';
  const isAppleWebKit = (/Apple/.test(vendor) && !/Chrome|Chromium|CriOS|Edg|OPR/.test(ua)) || /iPad|iPhone|iPod/.test(ua);
  if (isAppleWebKit) return true;
  try {
    const v = document.createElement('video');
    return !v.canPlayType('video/webm; codecs="vp9"');
  } catch {
    return true;
  }
}

export interface AlphaCinematicClipProps {
  clip: AlphaClipSpec;
  label: string;
  className?: string;
  /** 再生開始位置（秒）。途中フレームからの同期用 */
  startAtSec?: number;
  playbackRate?: number;
  /** 最後のフレームを保持して親の静止画プレートへシームレスに引き継ぐ */
  hold?: boolean;
  eager?: boolean;
  /** スキップボタンを表示するか */
  skippable?: boolean;
  skipLabel?: string;
  /** フェードイン／フェードアウトを自動付与するか */
  fadeInMs?: number;
  fadeOutBeforeEndMs?: number;
  watchdogMs?: number;
  onActiveChange?: (active: boolean) => void;
  onComplete?: () => void;
}

export function AlphaCinematicClip(props: AlphaCinematicClipProps) {
  return <AlphaPlayback key={`${props.clip.webm}:${props.startAtSec ?? 0}`} {...props} />;
}

function AlphaPlayback({
  clip,
  label,
  className = '',
  startAtSec = 0,
  playbackRate = 1,
  hold = false,
  eager = false,
  skippable = false,
  skipLabel = '演出をスキップ',
  fadeInMs = 360,
  fadeOutBeforeEndMs = 0,
  watchdogMs,
  onActiveChange,
  onComplete,
}: AlphaCinematicClipProps & { key?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scratchRef = useRef<HTMLCanvasElement | null>(null);
  const callbacks = useRef({ onActiveChange, onComplete });
  callbacks.current = { onActiveChange, onComplete };

  const done = useRef(false);
  const started = useRef(false);
  const [useCanvas] = useState(prefersStackedCanvasAlpha);
  const [allowed, setAllowed] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [held, setHeld] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  const finish = (fromSkip = false) => {
    if (done.current) return;
    done.current = true;
    videoRef.current?.pause();
    if (hold && (started.current || fromSkip)) {
      setHeld(true);
    } else {
      setStopped(true);
    }
    setPlaying(false);
    callbacks.current.onActiveChange?.(false);
    callbacks.current.onComplete?.();
  };

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const policy = () => {
      if (reduce.matches || connection?.saveData || document.hidden) finish(false);
      else setAllowed(true);
    };
    policy();
    reduce.addEventListener('change', policy);
    const hide = () => { if (document.hidden) finish(false); };
    document.addEventListener('visibilitychange', hide);
    return () => {
      reduce.removeEventListener('change', policy);
      document.removeEventListener('visibilitychange', hide);
      callbacks.current.onActiveChange?.(false);
    };
  }, []);

  useEffect(() => {
    if (!allowed || stopped || !videoRef.current) return;
    let disposed = false;
    const el = videoRef.current;
    el.playbackRate = playbackRate;
    if (startAtSec > 0.02) {
      const seekStart = () => {
        try {
          if (el.currentTime < startAtSec - 0.05) el.currentTime = Math.min(startAtSec, Math.max(0, clip.durationSec - 0.15));
        } catch { /* ignore pre-metadata seek */ }
      };
      if (el.readyState >= 1) seekStart();
      else el.addEventListener('loadedmetadata', seekStart, { once: true });
    }
    const maxWait = watchdogMs ?? Math.max(8500, Math.ceil(((clip.durationSec - startAtSec) / Math.max(0.25, playbackRate)) * 1000) + 3000);
    const loadingTimer = window.setTimeout(() => { if (!disposed && !started.current) finish(false); }, 4500);
    const totalTimer = window.setTimeout(() => { if (!disposed) finish(false); }, maxWait);
    el.play().catch(() => { if (!disposed) finish(false); });
    return () => {
      disposed = true;
      window.clearTimeout(loadingTimer);
      window.clearTimeout(totalTimer);
      el.pause();
    };
  }, [allowed, stopped, playbackRate, startAtSec, clip.durationSec, watchdogMs]);

  useEffect(() => {
    if (!playing || held || fadeOutBeforeEndMs <= 0 || !videoRef.current) return;
    const el = videoRef.current;
    const onTime = () => {
      const dur = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : clip.durationSec;
      const remainMs = ((dur - el.currentTime) / Math.max(0.25, el.playbackRate || 1)) * 1000;
      if (remainMs <= fadeOutBeforeEndMs) setFadingOut(true);
    };
    el.addEventListener('timeupdate', onTime);
    return () => el.removeEventListener('timeupdate', onTime);
  }, [playing, held, fadeOutBeforeEndMs, clip.durationSec]);

  useEffect(() => {
    if (!useCanvas || !allowed || stopped || !playing) return;
    const video = videoRef.current;
    const outCanvas = canvasRef.current;
    if (!video || !outCanvas) return;

    const w = clip.width;
    const h = clip.height;
    if (!scratchRef.current) {
      scratchRef.current = document.createElement('canvas');
    }
    const scratch = scratchRef.current;
    scratch.width = w;
    scratch.height = h * 2;
    outCanvas.width = w;
    outCanvas.height = h;

    const sctx = scratch.getContext('2d', { willReadFrequently: true });
    const octx = outCanvas.getContext('2d');
    if (!sctx || !octx) return;
    sctx.imageSmoothingEnabled = true;
    sctx.imageSmoothingQuality = 'high';
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = 'high';

    let raf = 0;
    let vfc = 0;
    let active = true;
    type VideoWithVFC = HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number;
      cancelVideoFrameCallback?: (id: number) => void;
    };
    const vfcVideo = video as VideoWithVFC;
    const hasVfc = typeof vfcVideo.requestVideoFrameCallback === 'function';

    const drawCurrentFrame = () => {
      if (!active) return;
      if (video.readyState >= 2 && !video.paused && !video.ended) {
        sctx.clearRect(0, 0, w, h * 2);
        sctx.drawImage(video, 0, 0, w, h * 2);
        const top = sctx.getImageData(0, 0, w, h);
        const bot = sctx.getImageData(0, h, w, h);
        const td = top.data;
        const bd = bot.data;
        for (let i = 0, len = td.length; i < len; i += 4) {
          const rawA = bd[i];
          const a = rawA < 8 ? 0 : rawA > 248 ? 255 : rawA;
          td[i + 3] = a;
          if (a === 0) {
            td[i] = 0;
            td[i + 1] = 0;
            td[i + 2] = 0;
          }
        }
        octx.putImageData(top, 0, 0);
      }
    };

    const scheduleNext = () => {
      if (!active) return;
      if (hasVfc && vfcVideo.requestVideoFrameCallback) {
        vfc = vfcVideo.requestVideoFrameCallback(() => {
          drawCurrentFrame();
          scheduleNext();
        });
      } else {
        raf = window.requestAnimationFrame(() => {
          drawCurrentFrame();
          scheduleNext();
        });
      }
    };

    drawCurrentFrame();
    scheduleNext();
    return () => {
      active = false;
      if (raf) window.cancelAnimationFrame(raf);
      if (vfc && vfcVideo.cancelVideoFrameCallback) vfcVideo.cancelVideoFrameCallback(vfc);
    };
  }, [useCanvas, allowed, stopped, playing, clip.width, clip.height]);

  if (!allowed || stopped) return null;

  const stateClass = [
    'cinematic-clip',
    'alpha-cinematic',
    playing ? 'is-playing' : '',
    held ? 'is-held' : '',
    fadingOut ? 'is-fading-out' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={stateClass}
      role="group"
      aria-label={label}
      data-fade-in={fadeInMs}
      data-fade-out={fadeOutBeforeEndMs}
    >
      {!playing && !held && (
        <img className="alpha-cinematic-poster" src={clip.poster} alt="" width={clip.width} height={clip.height} draggable={false} aria-hidden="true" />
      )}
      <video
        ref={videoRef}
        className={useCanvas ? 'alpha-cinematic-hidden-video' : 'alpha-cinematic-video'}
        src={useCanvas ? clip.sbsMp4 : clip.webm}
        muted
        playsInline
        preload={eager ? 'auto' : 'metadata'}
        disablePictureInPicture
        aria-hidden="true"
        onPlaying={() => {
          started.current = true;
          setPlaying(true);
          callbacks.current.onActiveChange?.(true);
        }}
        onEnded={() => finish(false)}
        onError={() => finish(false)}
      />
      {useCanvas && (
        <canvas
          ref={canvasRef}
          className="alpha-cinematic-canvas"
          width={clip.width}
          height={clip.height}
          aria-hidden="true"
        />
      )}
      {held && (
        <img className="alpha-cinematic-endplate" src={clip.endPlate} alt="" width={clip.width} height={clip.height} draggable={false} aria-hidden="true" />
      )}
      {skippable && playing && !held && (
        <button type="button" className="cinematic-skip alpha-cinematic-skip" onClick={() => finish(true)}>
          {skipLabel}
        </button>
      )}
    </div>
  );
}
