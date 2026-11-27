import { useCallback, useEffect, useRef, useState } from 'react';
import { AlphaCinematicClip, ALPHA_CINEMATIC_CLIPS, FULLFRAME_CINEMATIC_MOVIES, type AlphaClipSpec } from './AlphaCinematicClip';
import { TitleBgmMuteButton, TITLE_SCREEN_BGM_SRC, useLaunchTitleBgm } from './TitleBgmControl';
import { ArrowRight, BookHeart, Headphones, PenLine, Play, Repeat2, Swords } from 'lucide-react';
import { PhilosophyPage } from './PhilosophyPage';
import { useGrowthProgress } from '../hooks/useGrowthProgress';
import { equippedAccessory, equippedPoseSrc } from '../battle/core/growth';
import { TobiraAccessories } from '../battle/ui/TobiraAccessories';
import { auth } from '../firebase';
import './launch-screen.css';
import { getDaysUntilExam, EXAM_DATE_LABEL } from '../utils/examCountdown';
import { fadeOutLaunchSfx, launchCueSchedule, playLaunchSfx, preloadLaunchSfx, type LaunchSfx } from '../battle/audio/launchSfx';
import { resumeSharedAudio } from '../battle/audio/sharedAudioContext';
import { readAudioPreferences } from '../battle/audio/audioPreferences';
import { TOEIC_DISCLAIMER } from '../utils/toeicDisclaimer';

/**
 * タイトル画面（2026-11-18 モンスト風フル画面オープニングムービー ＋ ①高精度切り抜きとびら君登場演出 ＋ 0.00s同期・1回完結BGM）。
 *
 * 起動の流れ:
 *   1. gate = 'emblem' : マナトビ起動エンブレム（白→フェードイン→保持→フェードアウト）
 *   2. gate = 'op'     : エンブレムがフェードアウトした直後、画面向き・幅に応じて
 *                        ・横向き／PC（orientation: landscape かつ min-width: 768px）＝ ② title_op_landscape.mp4（15秒フル画面）
 *                        ・縦向き／スマホ（それ以外）＝ ③ title_op_portrait.mp4（15秒フル画面）
 *                        を先頭 0.00s から BGM（1回完結・ループなし）と完全同期で再生。
 *                        ブラウザの音声自動再生制限時は 0.00s で待機し、最初のタップで映像＋BGMを同時に最初から開始する。
 *   3. gate = 'title'  : OP終了（またはスキップ）で既存のタイトル画面へ遷移し、
 *                        とびら君ステージの位置で高精度切り抜きした ①（battle_countdown）のジャンプ登場演出を再生 →
 *                        そのままタイトル画面のとびら君待機ポーズへシームレスに移行する。
 */
type Phase = 'intro' | 'crossfade' | 'done';
type Gate = 'emblem' | 'op' | 'title' | 'philosophy';

const LANDSCAPE_QUERY = '(orientation: landscape) and (min-width: 768px)';
const BASIC_POSE = '/mascots/basic.webp';
const TITLE_TOBIRA_CLIP: AlphaClipSpec = {
  ...ALPHA_CINEMATIC_CLIPS.battleCountdown,
  webm: '/cinematics/title_tobira.webm',
  sbsMp4: '/cinematics/title_tobira-sbs.mp4',
  poster: '/cinematics/title_tobira-poster.webp',
  endPlate: '/cinematics/title_tobira-landed.webp',
  width: 420,
  height: 736,
  durationSec: 5.16,
};

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
    needsSoundGesture,
    primeFromGesture,
    startBgmFromBeginning,
    markEnded: markTitleBgmEnded,
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

  const finishOpToTitle = useCallback(() => {
    if (opDoneRef.current) return;
    opDoneRef.current = true;
    opVideoRef.current?.pause();
    setOpFadingOut(true);
    window.setTimeout(() => {
      setGate(g => (g === 'op' ? 'title' : g));
    }, 320);
  }, []);

  /** 自動再生制限で待機中のOP映像とBGMを、ユーザータップで 0.00s から同時に開始する */
  const startSyncedOpFromGesture = useCallback(() => {
    resumeSharedAudio();
    const el = opVideoRef.current;
    if (el) {
      try { el.currentTime = 0; } catch { /* ignore */ }
    }
    void startBgmFromBeginning();
    if (el) {
      el.play().catch(() => finishOpToTitle());
    }
  }, [finishOpToTitle, startBgmFromBeginning]);

  // OPムービー再生ライフサイクル＆0.00s完全同期スタート
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
    let loadWatchdog = 0;
    let maxWatchdog = 0;

    const clearWatchdogs = () => {
      if (loadWatchdog) window.clearTimeout(loadWatchdog);
      if (maxWatchdog) window.clearTimeout(maxWatchdog);
      loadWatchdog = 0;
      maxWatchdog = 0;
    };

    const armWatchdogs = () => {
      clearWatchdogs();
      loadWatchdog = window.setTimeout(() => {
        if (!disposed && !started) finishOpToTitle();
      }, 4500);
      maxWatchdog = window.setTimeout(() => {
        if (!disposed) finishOpToTitle();
      }, Math.ceil(opMovie.durationSec * 1000) + 2500);
    };

    const onPlay = () => {
      started = true;
      if (loadWatchdog) {
        window.clearTimeout(loadWatchdog);
        loadWatchdog = 0;
      }
      if (!maxWatchdog) {
        maxWatchdog = window.setTimeout(() => {
          if (!disposed) finishOpToTitle();
        }, Math.ceil(opMovie.durationSec * 1000) + 2500);
      }
    };
    el.addEventListener('playing', onPlay);

    try { el.currentTime = 0; } catch { /* ignore */ }

    void startBgmFromBeginning().then(status => {
      if (disposed) return;
      const isHeadless = typeof navigator !== 'undefined' && navigator.webdriver === true;
      if (status === 'blocked' && !isHeadless) {
        // 音声が自動再生制限された場合、映像だけ無音で先に進んでしまうのを防ぎ 0.00s で待機する
        el.pause();
        try { el.currentTime = 0; } catch { /* ignore */ }
        return;
      }
      try { el.currentTime = 0; } catch { /* ignore */ }
      armWatchdogs();
      el.play().catch(() => {
        if (!disposed) finishOpToTitle();
      });
    });

    return () => {
      disposed = true;
      el.removeEventListener('playing', onPlay);
      clearWatchdogs();
      el.pause();
    };
  }, [finishOpToTitle, gate, opMovie.mp4, opMovie.durationSec, startBgmFromBeginning]);

  // エンブレム・OP を経ずに直接 gate === 'title' へ入った場合（reduced-motion 等）も BGM が未再生なら 0.00s から1回だけ開始
  useEffect(() => {
    if (gate !== 'title') return;
    void startBgmFromBeginning();
  }, [gate, startBgmFromBeginning]);

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
  }, [gate, stopTitleBgm]);
  useEffect(() => () => {
    fadeOutLaunchSfx();
    stopTitleBgm();
  }, [stopTitleBgm]);

  const skipEmblem = () => {
    if (emblemPhase === 'out') return;
    skipRequested.current = true;
    setEmblemSkipped(true);
    setEmblemPhase('out');
    clearSfxTimers();
    resumeSharedAudio();
    primeFromGesture();
    void preloadLaunchSfx().then(() => {
      resumeSharedAudio();
      window.setTimeout(advancepastEmblem, 420);
    });
  };

  const played = useRef(false);
  const [landedReady, setLandedReady] = useState(false);
  const poseSrc = progress ? equippedPoseSrc(progress) : BASIC_POSE;
  const hasAccessories = progress && (['hat', 'glasses', 'cheek', 'aura'] as const)
    .some(slot => equippedAccessory(progress, slot));
  const useCinematicIdle = poseSrc === BASIC_POSE && !hasAccessories && landedReady;

  useEffect(() => {
    if (phase !== 'crossfade') return;
    const t = setTimeout(() => setPhase('done'), 380);
    return () => clearTimeout(t);
  }, [phase]);

  const finishIntro = () => {
    // 通常は同じ座標の最終フレームへ直接つなぐ。きせかえ中だけ専用ポーズへフェードする。
    const next = !useCinematicIdle && played.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'crossfade' : 'done';
    setPhase(p => (p === 'intro' ? next : p));
  };

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
      <audio
        ref={titleBgmRef}
        src={TITLE_SCREEN_BGM_SRC}
        preload="auto"
        playsInline
        onEnded={markTitleBgmEnded}
        data-title-screen-bgm=""
      />
      {gate === 'emblem' ? (
        <main className="launch-emblem" data-phase={emblemPhase} data-skip={emblemSkipped || undefined} aria-label={`マナトビ 起動エンブレム（タップで進む）。${TOEIC_DISCLAIMER}`} role="button" tabIndex={0} onPointerDown={primeFromGesture} onClick={skipEmblem} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); skipEmblem(); } }}><div className="launch-emblem-inner"><img className="launch-emblem-applogo" src="/brand/app-icon-logo.webp" alt="マナトビ" width={640} height={640}/><h1>聞いて、解いて、<br/>競って、<em>これ1本</em>で。</h1></div><p className="launch-emblem-disclaimer">{TOEIC_DISCLAIMER}</p></main>
      ) : gate === 'op' ? (
        <main
          className={`launch-op-stage ${opFadingOut ? 'is-fading-out' : ''}`}
          data-launch-op
          data-orientation={isLandscape ? 'landscape' : 'portrait'}
          aria-label={needsSoundGesture ? 'マナトビ オープニングムービー（タップして最初から再生）' : 'マナトビ オープニングムービー（タップでスキップ）'}
          onClick={needsSoundGesture ? startSyncedOpFromGesture : finishOpToTitle}
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
            <TitleBgmMuteButton muted={titleBgmMuted} onToggle={() => {
              const wasMuted = titleBgmMuted;
              toggleTitleBgm();
              if (wasMuted && needsSoundGesture && opVideoRef.current?.paused) {
                try { opVideoRef.current.currentTime = 0; } catch { /* ignore */ }
                void opVideoRef.current.play().catch(() => finishOpToTitle());
              }
            }} />
          </div>
          {needsSoundGesture && (
            <button
              type="button"
              className="launch-op-sound-start"
              data-op-sound-start
              onClick={e => { e.stopPropagation(); startSyncedOpFromGesture(); }}
            >
              <Play size={18} aria-hidden="true" />
              <span>タップして音ありで再生</span>
            </button>
          )}
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
            <div className="launch-stage" data-phase={phase} role="group" aria-label="とびら君の登場演出">
              <div className="launch-box">
                <div className="launch-scene" aria-hidden="true">
                  <img className="launch-plate" src="/cinematics/title-plate.webp" alt="" width={720} height={720} draggable={false} />
                  <div className="launch-ground" />
                  <div className="launch-sparkles"><i /><i /><i /><i /><i /><i /></div>
                  {!useCinematicIdle && (
                    <div className="launch-arrival">
                      <div className="launch-gait">
                        <img className="launch-equipped-pose" src={poseSrc} alt="" draggable={false} />
                        {progress && <TobiraAccessories progress={progress} align="bottom" />}
                      </div>
                    </div>
                  )}
                </div>
                {poseSrc === BASIC_POSE && !hasAccessories && (
                  <div className="launch-tobira-framing launch-cinematic-idle" data-visible={phase === 'done' && useCinematicIdle} aria-hidden="true">
                    <div className="launch-idle-actor">
                      <img src={TITLE_TOBIRA_CLIP.endPlate} alt="" draggable={false} onLoad={() => setLandedReady(true)} onError={() => setLandedReady(false)} />
                      <img className="launch-idle-blink" src="/cinematics/title_tobira-blink.webp" alt="" draggable={false} />
                    </div>
                  </div>
                )}
                {phase !== 'done' && (
                  <div className="launch-tobira-cutout-wrap" inert={phase === 'crossfade'}>
                    <AlphaCinematicClip
                      clip={TITLE_TOBIRA_CLIP}
                      className="launch-tobira-framing launch-tobira-cutout"
                      hold
                      eager
                      skippable
                      fadeInMs={280}
                      label="とびら君の登場動画"
                      onActiveChange={active => { if (active) played.current = true; }}
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
              <p className="launch-trademark-disclaimer" data-toeic-disclaimer>{TOEIC_DISCLAIMER}</p>
              <p className="launch-kbd" aria-hidden="true"><kbd>Enter</kbd> ではじめる</p>
            </div>
          </div>
        </main>
      )}
    </>
  );
}
