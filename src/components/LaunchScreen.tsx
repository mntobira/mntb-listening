import { useEffect, useRef, useState } from 'react';
import { AlphaCinematicClip, ALPHA_CINEMATIC_CLIPS, FULLFRAME_CINEMATIC_MOVIES } from './AlphaCinematicClip';
import { TitleBgmMuteButton, TITLE_SCREEN_BGM_SRC, useLaunchTitleBgm } from './TitleBgmControl';
import { ArrowRight, BookHeart, Headphones, PenLine, Repeat2, Swords } from 'lucide-react';
import { PhilosophyPage } from './PhilosophyPage';
import { useGrowthProgress } from '../hooks/useGrowthProgress';
import { equippedPoseSrc } from '../battle/core/growth';
import { TobiraAccessories } from '../battle/ui/TobiraAccessories';
import { auth } from '../firebase';
import './launch-screen.css';
import { getDaysUntilExam, EXAM_DATE_LABEL } from '../utils/examCountdown';
import { fadeOutLaunchSfx, launchCueSchedule, playLaunchSfx, preloadLaunchSfx, type LaunchSfx } from '../battle/audio/launchSfx';
import { resumeSharedAudio } from '../battle/audio/sharedAudioContext';
import { readAudioPreferences } from '../battle/audio/audioPreferences';
import { TOEIC_DISCLAIMER } from '../utils/toeicDisclaimer';

/**
 * タイトル画面（2026-11-15 モンスト風フル画面オープニングムービー ＋ ①高精度切り抜きとびら君登場演出）。
 *
 * 起動の流れ:
 *   1. gate = 'emblem' : マナトビ起動エンブレム（白→フェードイン→保持→フェードアウト）
 *   2. gate = 'op'     : エンブレムがフェードアウトした直後、画面向き・幅に応じて
 *                        ・横向き／PC（orientation: landscape かつ min-width: 768px）＝ ② title_op_landscape.mp4（15秒フル画面）
 *                        ・縦向き／スマホ（それ以外）＝ ③ title_op_portrait.mp4（15秒フル画面）
 *                        を切り抜かず星空・水面反射そのまま再生。画面タップまたは「スキップ」でいつでも即スキップ可能。
 *   3. gate = 'title'  : OP終了（またはスキップ）で既存のタイトル画面へ遷移し、
 *                        とびら君ステージの位置で高精度切り抜きした ①（battle_countdown）のジャンプ登場演出を再生 →
 *                        そのままタイトル画面のとびら君待機ポーズへシームレスに移行する。
 */
type Phase = 'intro' | 'crossfade' | 'done';
type Gate = 'emblem' | 'op' | 'title' | 'philosophy';

const LANDSCAPE_QUERY = '(orientation: landscape) and (min-width: 768px)';

function useLandscapeTitle(): boolean {
  const [isLandscape, setIsLandscape] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia(LANDSCAPE_QUERY).matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(LANDSCAPE_QUERY);
    const onChange = () => setIsLandscape(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isLandscape;
}

export function LaunchScreen({ onStart }: {
  /** 2026-10-19 ゲスト入口は廃止（ログイン必須）。未ログインなら次にログイン画面が出る */
  onStart: () => void;
}) {
  const { progress } = useGrowthProgress();
  const isLandscape = useLandscapeTitle();
  const opMovie = isLandscape ? FULLFRAME_CINEMATIC_MOVIES.titleOpLandscape : FULLFRAME_CINEMATIC_MOVIES.titleOpPortrait;

  const [phase, setPhase] = useState<Phase>('intro');
  const [gate, setGate] = useState<Gate>('emblem');
  const [emblemPhase, setEmblemPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [emblemSkipped, setEmblemSkipped] = useState(false);
  const [opFadingOut, setOpFadingOut] = useState(false);

  const {
    audioRef: titleBgmRef,
    muted: titleBgmMuted,
    toggleMute: toggleTitleBgm,
    stopTitleBgm,
  } = useLaunchTitleBgm(gate === 'op' || gate === 'title');

  const sfxTimers = useRef<number[]>([]);
  const bloomDone = useRef(false);
  const skipRequested = useRef(false);
  const opDoneRef = useRef(false);
  const opVideoRef = useRef<HTMLVideoElement>(null);

  const cue = (name: LaunchSfx) => { playLaunchSfx(name, readAudioPreferences().volume); };
  const clearSfxTimers = () => { sfxTimers.current.forEach(t => window.clearTimeout(t)); sfxTimers.current = []; };

  const advancepastEmblem = () => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    setGate(g => (g === 'emblem' ? (reduce || saveData ? 'title' : 'op') : g));
  };

  useEffect(() => {
    if (gate !== 'emblem') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const at = reduced ? { hold: 0, out: 900, next: 1100 } : { hold: 700, out: 2500, next: 3400 };
    let alive = true;
    const visualTimers: number[] = [];
    void preloadLaunchSfx().then(() => {
      if (!alive || skipRequested.current) return;
      resumeSharedAudio();
      const t0 = performance.now();
      visualTimers.push(
        window.setTimeout(() => setEmblemPhase(p => (p === 'in' ? 'hold' : p)), at.hold),
        window.setTimeout(() => setEmblemPhase('out'), at.out),
        window.setTimeout(advancepastEmblem, at.next),
      );
      for (const c of launchCueSchedule(at.next)) {
        if (c.name === 'title_bloom') continue;
        const wait = c.at - (performance.now() - t0);
        if (wait < -500) continue;
        sfxTimers.current.push(window.setTimeout(() => cue(c.name), Math.max(0, wait)));
      }
    });
    return () => { alive = false; visualTimers.forEach(t => window.clearTimeout(t)); clearSfxTimers(); };
  }, [gate]);

  const finishOpToTitle = () => {
    if (opDoneRef.current) return;
    opDoneRef.current = true;
    opVideoRef.current?.pause();
    setOpFadingOut(true);
    window.setTimeout(() => {
      setGate(g => (g === 'op' ? 'title' : g));
    }, 320);
  };

  // OPムービー再生ライフサイクル＆セーフティタイマー
  useEffect(() => {
    if (gate !== 'op') return;
    opDoneRef.current = false;
    setOpFadingOut(false);
    const el = opVideoRef.current;
    if (!el) {
      finishOpToTitle();
      return;
    }
    let disposed = false;
    let started = false;
    const onPlay = () => { started = true; };
    el.addEventListener('playing', onPlay);
    const loadWatchdog = window.setTimeout(() => {
      if (!disposed && !started) finishOpToTitle();
    }, 4500);
    const maxWatchdog = window.setTimeout(() => {
      if (!disposed) finishOpToTitle();
    }, Math.ceil(opMovie.durationSec * 1000) + 2500);
    el.play().catch(() => {
      if (!disposed) finishOpToTitle();
    });
    return () => {
      disposed = true;
      el.removeEventListener('playing', onPlay);
      window.clearTimeout(loadWatchdog);
      window.clearTimeout(maxWatchdog);
      el.pause();
    };
  }, [gate, opMovie.mp4, opMovie.durationSec]);

  useEffect(() => {
    if (gate !== 'title' || bloomDone.current) return;
    bloomDone.current = true;
    // タイトル専用BGM（title_intro_bgm.mp3）が有効／再生中のときは /tanjou.mp3 用 E メジャー和音（title_bloom）を重ねない
    const bgmEl = titleBgmRef.current;
    const titleBgmPlaying = Boolean(bgmEl && !bgmEl.paused && !titleBgmMuted && bgmEl.volume > 0);
    if (titleBgmPlaying || !titleBgmMuted) return;
    let alive = true;
    void preloadLaunchSfx().then(() => {
      if (!alive) return;
      resumeSharedAudio();
      cue('title_bloom');
    });
    return () => { alive = false; };
  }, [gate, titleBgmMuted, titleBgmRef]);

  useEffect(() => {
    if (gate === 'philosophy') {
      fadeOutLaunchSfx();
      stopTitleBgm();
    }
  }, [gate]);
  useEffect(() => () => {
    fadeOutLaunchSfx();
    stopTitleBgm();
  }, []);

  const skipEmblem = () => {
    if (emblemPhase === 'out') return;
    skipRequested.current = true;
    setEmblemSkipped(true);
    setEmblemPhase('out');
    clearSfxTimers();
    resumeSharedAudio();
    void preloadLaunchSfx().then(() => {
      resumeSharedAudio();
      window.setTimeout(advancepastEmblem, 420);
    });
  };

  const [played, setPlayed] = useState(false);
  const [walkReady, setWalkReady] = useState(false);
  const equippedSpriteSrc = progress ? equippedPoseSrc(progress) : '/mascots/basic.webp';

  useEffect(() => {
    const urls = [
      '/cinematics/title-plate.webp',
      ALPHA_CINEMATIC_CLIPS.battleCountdown.poster,
      ALPHA_CINEMATIC_CLIPS.battleCountdown.endPlate,
      '/mascots/walking.webp',
      equippedSpriteSrc,
    ];
    urls.forEach((src) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
      if (src === '/mascots/walking.webp') {
        img.onload = () => setWalkReady(true);
      }
      // 事前デコード非対応ブラウザや未キャッシュ時の失敗は通常描画へ委ねる
      void img.decode?.().catch(() => { /* ignore decode race */ });
    });
  }, [equippedSpriteSrc]);

  useEffect(() => {
    if (phase !== 'crossfade') return;
    const t = setTimeout(() => setPhase('done'), 380);
    return () => clearTimeout(t);
  }, [phase]);

  const finishIntro = () => setPhase(p => (p === 'intro' ? (played ? 'crossfade' : 'done') : p));
  const walk = phase === 'done' && !played;

  useEffect(() => {
    if (gate !== 'title') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.isComposing) return;
      const t = e.target as HTMLElement | null;
      if (t && t.closest('button, a, input, textarea, select, [contenteditable]')) return;
      e.preventDefault();
      enter();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const enter = () => {
    fadeOutLaunchSfx();
    stopTitleBgm();
    onStart();
  };

  return (
    <>
      <audio ref={titleBgmRef} src={TITLE_SCREEN_BGM_SRC} loop preload="auto" playsInline data-title-screen-bgm="" />
      {gate === 'emblem' ? (
        <main className="launch-emblem" data-phase={emblemPhase} data-skip={emblemSkipped || undefined} aria-label={`マナトビ 起動エンブレム（タップで進む）。${TOEIC_DISCLAIMER}`} role="button" tabIndex={0} onClick={skipEmblem} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); skipEmblem(); } }}><div className="launch-emblem-inner"><img className="launch-emblem-applogo" src="/brand/app-icon-logo.webp" alt="マナトビ" width={640} height={640}/><h1>聞いて、解いて、<br/>競って、<em>これ1本</em>で。</h1></div><p className="launch-emblem-disclaimer">{TOEIC_DISCLAIMER}</p></main>
      ) : gate === 'op' ? (
        <main
          className={`launch-op-stage ${opFadingOut ? 'is-fading-out' : ''}`}
          data-launch-op
          data-orientation={isLandscape ? 'landscape' : 'portrait'}
          aria-label="マナトビ オープニングムービー（タップでスキップ）"
          onClick={finishOpToTitle}
        >
          <video
            key={opMovie.mp4}
            ref={opVideoRef}
            className="launch-op-video"
            src={opMovie.mp4}
            poster={opMovie.poster}
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            onEnded={finishOpToTitle}
            onError={finishOpToTitle}
          />
          <div className="launch-op-hud" onClick={e => e.stopPropagation()}>
            <TitleBgmMuteButton muted={titleBgmMuted} onToggle={toggleTitleBgm} />
          </div>
          <div className="launch-op-bottom">
            <img className="launch-op-brand" src="/brand/manatobi-logo.webp" width={1008} height={321} alt="マナトビ" draggable={false} />
            <button
              type="button"
              className="launch-op-skip"
              onClick={e => { e.stopPropagation(); finishOpToTitle(); }}
            >
              タップしてスキップ
            </button>
          </div>
        </main>
      ) : gate === 'philosophy' ? (
        <PhilosophyPage onBack={() => setGate('title')} />
      ) : (
        <main className="launch-screen" aria-label="マナトビ タイトル画面" data-launch-screen data-orientation={isLandscape ? 'landscape' : 'portrait'}>
          <TitleBgmMuteButton muted={titleBgmMuted} onToggle={toggleTitleBgm} />
          <div className="launch-content">
            <h1 className="launch-brand"><img src="/brand/manatobi-logo.webp" width={1008} height={321} alt="マナトビ" fetchPriority="high" /></h1>
            <div className="launch-stage" data-phase={phase} aria-label="とびら君の登場演出">
              <div className="launch-box">
                <div className="launch-scene" aria-hidden="true">
                  {/* 既存の美しい紙色背景プレート（雲・星・紙飛行機・光の輪・床）をそのまま活かす */}
                  <img className="launch-plate" src="/cinematics/title-plate.webp" alt="" width={720} height={720} draggable={false} />
                  <div className="launch-sparkles"><i /><i /><i /><i /><i /><i /></div>
                  {phase !== 'intro' && (
                    <div className={`launch-arrival ${walk && walkReady ? 'walk-ready' : ''} ${!walk ? 'is-idle' : ''}`}>
                      <div className="launch-gait">
                        <img className="launch-walking-pose" src="/mascots/walking.webp" alt="" decoding="sync" draggable={false} onLoad={() => setWalkReady(true)} />
                        <img className="launch-equipped-pose" src={equippedSpriteSrc} alt="" decoding="sync" draggable={false} />
                        {progress && <TobiraAccessories progress={progress} />}
                      </div>
                    </div>
                  )}
                </div>
                {/* タイトル画面のとびら君の位置に、高精度で切り抜いた ①（battle_countdown）を重ねて再生 */}
                {phase !== 'done' && (
                  <div className="launch-tobira-cutout-wrap">
                    <img className="launch-plate launch-plate-under-video" src="/cinematics/title-plate.webp" alt="" width={720} height={720} draggable={false} aria-hidden="true" />
                    <AlphaCinematicClip
                      clip={ALPHA_CINEMATIC_CLIPS.battleCountdown}
                      className="launch-tobira-cutout"
                      hold
                      eager
                      skippable
                      fadeInMs={280}
                      label="とびら君の登場動画"
                      onActiveChange={active => { if (active) setPlayed(true); }}
                      onComplete={finishIntro}
                    />
                  </div>
                )}
              </div>
            </div>
            <p className="launch-copy">聞いて、解いて、<br className="launch-copy-break" />競って、<em>これ1本</em>で。</p>
            <p className="launch-lead">共通テスト英語リスニングの第1問〜第6問を、本番と同じ音源で。<br />解いたその場でスクリプト・読み方・解説まで確かめられます。</p>
            <ul className="launch-chips" aria-label="できること">
              <li><PenLine size={16} aria-hidden="true" /><span><b>演習</b><small>第1問〜第6問を本番どおりに</small></span></li>
              <li><Repeat2 size={16} aria-hidden="true" /><span><b>復習</b><small>読んでいる単語が光る</small></span></li>
              <li><Swords size={16} aria-hidden="true" /><span><b>オンライン対戦</b><small>友だち・全国・AI と</small></span></li>
            </ul>
            <div className="launch-actions">
              <p className="launch-countdown-mini" aria-label={`共通テストまで${getDaysUntilExam()}日`}><Headphones size={16} aria-hidden="true" />共通テストまで <strong>{getDaysUntilExam()}</strong>日<small>{EXAM_DATE_LABEL}</small></p>
              <button type="button" className="launch-start mt-btn mt-btn-accent" onClick={() => { fadeOutLaunchSfx(); enter(); }}><Headphones size={20} aria-hidden="true" />はじめる<ArrowRight size={20} aria-hidden="true" /></button>
              <p className="launch-note">{auth.currentUser ? '学習のつづきから始まります' : 'Google か Apple でログインして始めます'}</p>
              <button type="button" className="launch-philosophy" data-open-philosophy onClick={() => setGate('philosophy')}><BookHeart size={16} aria-hidden="true" />学びの扉 ～私達に出来ることを～</button>
              <p className="launch-kbd" aria-hidden="true"><kbd>Enter</kbd> ではじめる</p>
            </div>
          </div>
        </main>
      )}
    </>
  );
}
