import { useMountEffect } from '../hooks/useMountEffect';
import { useRef, useState } from 'react';
import { CinematicSequence, GACHA_REVEAL_CLIPS } from './CinematicClip';
import { FULLFRAME_CINEMATIC_MOVIES } from './AlphaCinematicClip';
import type { GachaRarity } from '../battle/core/growth';
import { play, sfxEnabled } from '../battle/ui/feedback';
import { readAudioPreferences } from '../battle/audio/audioPreferences';
import { sharedAudioContextResumed } from '../battle/audio/sharedAudioContext';
import {
  REVEAL_BURST_MS,
  REVEAL_ORDER,
  REVEAL_TEASE_CAPTION,
  REVEAL_TEASE_MS,
  burstSfx,
  hasTease,
  revealSteps,
  revealTotalMs,
  type RevealStage,
} from './gachaRevealSteps';
import './gacha-summon-theater.css';

type StageSpec = {
  cutin: string;
  sub: string;
  sealJp: string;
  freq: number;
};

const STAGE_SPEC: Record<RevealStage, StageSpec> = {
  blue: {
    cutin: '✦ STARLIGHT PULL — 星辰召喚 ✦',
    sub: 'SUMMON GATE ENGAGED',
    sealJp: '星扉開放',
    freq: 329.63,
  },
  gold: {
    cutin: '⚡ GOLD STRIKE — 金扉昇格・R以上確定！ ⚡',
    sub: 'GOLDEN DRAGONPULSE',
    sealJp: '黄金昇格',
    freq: 440,
  },
  rainbow: {
    cutin: '🌈 PRISM OVERDRIVE — 虹扉突破・SR以上確定！！ 🌈',
    sub: 'SEVENFOLD RAINBOW SURGE',
    sealJp: '虹彩突破',
    freq: 587.33,
  },
  ur: {
    cutin: '👑 ULTRA AWAKENING — 超激レア UR確定！！ 👑',
    sub: 'DIMENSIONAL SHATTER',
    sealJp: '超絶確定',
    freq: 783.99,
  },
  lr: {
    cutin: '🔥 LEGENDARY ADVENT — 伝説降臨 LR確定！！！ 🔥',
    sub: 'GENESIS SUPERNOVA',
    sealJp: '伝説降臨',
    freq: 1046.5,
  },
};

const METEOR_COUNT = 6;
const SHARD_COUNT = 14;

/**
 * 共有 AudioContext 上で鳴らす召喚シンセレイヤー（モンストの引っ張り溜め音・ドッカンの気弾上昇音・ガラス破砕チャイム）。
 * 既存の battle_sfx 設定と音量設定を厳守し、新しい AudioContext は絶対に作らない。
 */
function playSummonSynth(kind: 'charge' | 'step' | 'tease' | 'shatter', stage: RevealStage): void {
  if (!sfxEnabled()) return;
  const ac = sharedAudioContextResumed();
  if (!ac || ac.state !== 'running') return;
  const masterVol = Math.max(0, Math.min(1, readAudioPreferences().volume)) * 0.16;
  if (masterVol <= 0.001) return;

  try {
    const now = ac.currentTime;
    const base = STAGE_SPEC[stage].freq;

    if (kind === 'charge') {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(196, now);
      osc.frequency.exponentialRampToValueAtTime(392, now + 0.58);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(masterVol * 0.85, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
      osc.connect(gain).connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.64);
      return;
    }

    if (kind === 'step') {
      [1, 1.25, 1.5].forEach((ratio, idx) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        const t0 = now + idx * 0.035;
        osc.type = stage === 'ur' || stage === 'lr' ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(base * ratio * 0.92, t0);
        osc.frequency.exponentialRampToValueAtTime(base * ratio, t0 + 0.09);
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.linearRampToValueAtTime(masterVol * (idx === 2 ? 0.95 : 0.65), t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.34);
        osc.connect(gain).connect(ac.destination);
        osc.start(t0);
        osc.stop(t0 + 0.36);
      });
      return;
    }

    if (kind === 'tease') {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(base * 0.85, now);
      osc.frequency.exponentialRampToValueAtTime(base * 1.45, now + 0.72);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(masterVol * 0.8, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.78);
      osc.connect(gain).connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.8);
      return;
    }

    // shatter: 結晶ブレイク＋高次倍音ファンファーレ和音
    [1, 1.25, 1.5, 2].forEach((ratio, idx) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      const t0 = now + idx * 0.022;
      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(base * ratio, t0);
      osc.frequency.exponentialRampToValueAtTime(base * ratio * 1.03, t0 + 0.42);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(masterVol * 0.9, t0 + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.48);
      osc.connect(gain).connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + 0.5);
    });
  } catch {
    // WebAudio 非対応または閉鎖済みコンテキストでは既存の play() 効果音のみで進行する
  }
}

/** 三重逆回転・古代星辰召喚魔法陣（パズドラの召喚陣 × モンストのストライクゲート幾何学） */
function ArcaneSummonCircles() {
  return (
    <div className="gacha-summon-magic-circle" aria-hidden="true">
      <svg className="gacha-magic-ring-outer" viewBox="0 0 260 260" fill="none">
        <circle cx="130" cy="130" r="124" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.88" />
        <circle cx="130" cy="130" r="115" stroke="currentColor" strokeWidth="2.4" />
        <circle cx="130" cy="130" r="102" stroke="currentColor" strokeWidth="1.1" opacity="0.68" />
        <polygon points="130,14 230,188 30,188" stroke="currentColor" strokeWidth="1.6" opacity="0.74" />
        <polygon points="130,246 30,72 230,72" stroke="currentColor" strokeWidth="1.6" opacity="0.74" />
        {Array.from({ length: 12 }, (_, k) => {
          const deg = k * 30;
          return (
            <g key={deg} transform={`rotate(${deg} 130 130)`}>
              <line x1="130" y1="5" x2="130" y2="18" stroke="currentColor" strokeWidth="2.1" />
              <circle cx="130" cy="24" r="2.8" fill="currentColor" />
            </g>
          );
        })}
      </svg>
      <svg className="gacha-magic-ring-inner" viewBox="0 0 200 200" fill="none">
        <circle cx="100" cy="100" r="92" stroke="currentColor" strokeWidth="1.9" />
        <circle cx="100" cy="100" r="78" stroke="currentColor" strokeWidth="1.2" strokeDasharray="10 5" />
        <rect x="35" y="35" width="130" height="130" stroke="currentColor" strokeWidth="1.45" opacity="0.78" />
        <rect x="35" y="35" width="130" height="130" transform="rotate(45 100 100)" stroke="currentColor" strokeWidth="1.45" opacity="0.78" />
      </svg>
      <svg className="gacha-magic-ring-core" viewBox="0 0 140 140" fill="none">
        <circle cx="70" cy="70" r="64" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 5" />
        <polygon points="70,10 122,100 18,100" stroke="currentColor" strokeWidth="1.2" opacity="0.8" />
        <polygon points="70,130 18,40 122,40" stroke="currentColor" strokeWidth="1.2" opacity="0.8" />
      </svg>
    </div>
  );
}

/** モンスト風・ストライクショット牽引リング＆照準アロー（第1幕で発動し中央オーブへ収束） */
function StrikeSlingshotAim() {
  return (
    <svg className="gacha-summon-slingshot" viewBox="0 0 320 320" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="gacha-strike-grad" x1="160" y1="305" x2="160" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
          <stop offset="55%" stopColor="currentColor" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
        </linearGradient>
      </defs>
      <circle cx="160" cy="160" r="142" stroke="currentColor" strokeWidth="1.6" strokeDasharray="12 8" opacity="0.72" />
      <line x1="160" y1="304" x2="160" y2="34" stroke="url(#gacha-strike-grad)" strokeWidth="5" strokeLinecap="round" />
      <polygon points="160,14 143,46 160,38 177,46" fill="#ffffff" />
      <polyline points="134,256 160,232 186,256" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="140,282 160,262 180,282" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
  );
}

/** パズドラ×ドッカン風・聖なる召喚龍脈オーブ冠ベゼル（中央オーブを包む王冠フレーム） */
function SacredOrbCrest() {
  return (
    <svg className="gacha-orb-crest" viewBox="0 0 280 280" fill="none" aria-hidden="true">
      <circle cx="140" cy="140" r="129" stroke="currentColor" strokeWidth="2.4" opacity="0.9" />
      <circle cx="140" cy="140" r="135" stroke="currentColor" strokeWidth="1.1" strokeDasharray="8 6" opacity="0.65" />
      {/* 上下左右の聖結晶クロー */}
      <path d="M140 2 L152 22 L140 16 L128 22 Z" fill="currentColor" />
      <path d="M140 278 L152 258 L140 264 L128 258 Z" fill="currentColor" />
      <path d="M2 140 L22 128 L16 140 L22 152 Z" fill="currentColor" />
      <path d="M278 140 L258 128 L264 140 L258 152 Z" fill="currentColor" />
      {/* 斜め四隅のウイング装飾 */}
      <path d="M42 42 L64 50 L50 64 Z" fill="currentColor" opacity="0.85" />
      <path d="M238 42 L216 50 L230 64 Z" fill="currentColor" opacity="0.85" />
      <path d="M42 238 L64 230 L50 216 Z" fill="currentColor" opacity="0.85" />
      <path d="M238 238 L216 230 L230 216 Z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

/** ドッカンバトル風・高レア昇格／極限溜め／解放時に走るプラズマ稲妻＆次元ガラス破砕クラック */
function DimensionalCracks() {
  return (
    <svg className="gacha-summon-cracks" viewBox="0 0 400 400" preserveAspectRatio="none" fill="none" aria-hidden="true">
      {/* 外側ハロー稲妻 */}
      <g className="gacha-crack-glow" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.38">
        <path d="M200 185 L148 126 L164 94 L104 38 L68 10" />
        <path d="M200 185 L258 120 L298 106 L346 44 L386 14" />
        <path d="M200 185 L132 238 L88 264 L28 340" />
        <path d="M200 185 L270 244 L318 268 L374 350" />
      </g>
      {/* 鋭利な白芯クラック */}
      <g className="gacha-crack-core" stroke="#ffffff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M200 185 L148 126 L164 94 L104 38 L68 10" />
        <path d="M148 126 L106 138 L58 108" strokeWidth="1.5" />
        <path d="M164 94 L192 58 L184 22" strokeWidth="1.3" />
        <path d="M200 185 L258 120 L298 106 L346 44 L386 14" />
        <path d="M258 120 L292 148 L346 142" strokeWidth="1.5" />
        <path d="M200 185 L132 238 L88 264 L28 340" />
        <path d="M132 238 L142 286 L114 336" strokeWidth="1.4" />
        <path d="M200 185 L270 244 L318 268 L374 350" />
        <path d="M270 244 L256 294 L282 348" strokeWidth="1.4" />
        <path d="M200 185 L196 112 L212 66 L202 8" strokeWidth="1.6" />
      </g>
    </svg>
  );
}

/**
 * ガチャの確定演出（モンスト × パズドラ × ドッカンバトル流・フルスクリーン3層召喚シアター最上級版）。
 * - 第1幕（act = 'duo'）：ストライク牽引リング＆星辰神殿の中央クリスタルゲートに、とびら君＆カギノスケ共鳴映像
 *   （FULLFRAME_CINEMATIC_MOVIES.gachaDuoIntro）を丸窓の被りゼロで主役表示。斜め上空から召喚メテオが飛来！
 * - 第2幕（act = 'orb'）：エネルギーが聖なる龍脈オーブ冠（GACHA_REVEAL_CLIPS[rarity]）へ凝縮し、
 *   青 → 金 → 虹 → UR → LR の段階昇格ごとに確定ショックウェーブ・斜め閃光カットイン・縦書き確定印・次元稲妻クラックが炸裂！
 * - 終幕（burst）：14枚のプリズムクリスタル破片が放射状に弾け飛ぶシャッターバーストで結果画面へ突入！
 */
export function GachaReveal({ rarity, onDone }: { rarity: GachaRarity; onDone: () => void; key?: number }) {
  const steps = revealSteps(rarity);
  const [act, setAct] = useState<'duo' | 'orb'>('duo');
  const [index, setIndex] = useState(0);
  const [shockSeq, setShockSeq] = useState(0);
  const [burst, setBurst] = useState(false);
  /** E1：最後の段のあとの溜め（次のゲージがチカチカ） */
  const [tease, setTease] = useState(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const finished = useRef(false);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    doneRef.current();
  };

  const totalSec = Math.max(2.6, revealTotalMs(rarity) / 1000);
  const duoRate = Math.min(2.0, Math.max(1.15, (FULLFRAME_CINEMATIC_MOVIES.gachaDuoIntro.durationSec - 2.2) / totalSec));

  useMountEffect(() => {
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (reduce) {
      setAct('orb');
      setIndex(steps.length - 1);
      play(burstSfx(rarity), false);
      timers.push(setTimeout(finish, 600));
      return () => timers.forEach(clearTimeout);
    }
    const v = bgVideoRef.current;
    if (v) {
      const seekDuoHighlight = () => {
        try {
          // 魔導書から音符と光の粒子が一気に溢れ出すハイライト（2.2秒地点）から開始
          if (v.currentTime < 1.8) v.currentTime = 2.2;
        } catch {
          // メタデータ到着前のシーク例外は無視して先頭から再生する
        }
      };
      if (v.readyState >= 1) seekDuoHighlight();
      else v.addEventListener('loadedmetadata', seekDuoHighlight, { once: true });
      v.playbackRate = duoRate;
      // 自動再生制限時はポスター表示のまま演出タイマーで進行する
      void v.play().catch(() => { /* autoplay blocked fallback */ });
    }

    playSummonSynth('charge', 'blue');

    // 第1幕（共鳴ストライクカットイン 780ms）→ 第2幕（召喚オーブ凝縮＆段階昇格）へシームレス転換
    const actSwitchMs = Math.min(780, Math.floor(steps[0].ms * 0.62));
    timers.push(
      setTimeout(() => {
        setAct('orb');
        setShockSeq(n => n + 1);
        playSummonSynth('step', steps[0].stage);
      }, actSwitchMs),
    );

    let at = 0;
    steps.forEach((s, i) => {
      timers.push(
        setTimeout(() => {
          setIndex(i);
          if (i > 0) {
            setShockSeq(n => n + 1);
            play(s.sfx, s.vibrate);
            playSummonSynth('step', s.stage);
          }
        }, at),
      );
      at += s.ms;
    });
    if (hasTease(rarity)) {
      timers.push(
        setTimeout(() => {
          setTease(true);
          setShockSeq(n => n + 1);
          playSummonSynth('tease', steps[steps.length - 1].stage);
        }, at),
      );
      at += REVEAL_TEASE_MS;
    }
    timers.push(
      setTimeout(() => {
        setTease(false);
        setBurst(true);
        setShockSeq(n => n + 1);
        play(burstSfx(rarity), true);
        playSummonSynth('shatter', steps[steps.length - 1].stage);
      }, at),
    );
    timers.push(setTimeout(finish, at + REVEAL_BURST_MS));
    return () => {
      timers.forEach(clearTimeout);
      v?.pause();
    };
    // 1回の抽選につき1度だけ流す
  });

  const step = steps[index];
  const spec = STAGE_SPEC[step.stage];
  const skip = () => {
    setTease(false);
    setBurst(true);
    play(burstSfx(rarity), false);
    setTimeout(finish, 180);
  };

  const cutinMain = tease
    ? '⚡ OVERCHARGE — 限界突破の予兆…！？ ⚡'
    : act === 'duo'
      ? '✦ STRIKE RESONANCE — 共鳴召喚ゲート開放！！ ✦'
      : spec.cutin;

  const cutinSub = tease
    ? 'LIMIT GAUGE PULSING'
    : act === 'duo'
      ? 'TOBIRAKUN × KAGINOSUKE'
      : spec.sub;

  const showSeal = act === 'orb' && (step.stage === 'gold' || step.stage === 'rainbow' || step.stage === 'ur' || step.stage === 'lr');

  return (
    <div
      className="gacha-cinema gacha-reveal"
      data-act={act}
      data-stage={step.stage}
      data-step-bump={index > 0 ? String(index) : undefined}
      data-burst={burst || undefined}
      data-tease={tease || undefined}
      data-gacha-reveal
    >
      <div className="gacha-summon-cosmos" aria-hidden="true" />
      <div className="gacha-summon-pillar" aria-hidden="true" />
      <div className="gacha-summon-speedlines" aria-hidden="true" />
      <div className="gacha-reveal-rays" aria-hidden="true" />

      {/* 上空から中央ゲートへ降り注ぐ召喚流星の尾（ドッカンバトル風メテオフォール） */}
      <div className="gacha-summon-meteors" aria-hidden="true">
        {Array.from({ length: METEOR_COUNT }, (_, idx) => (
          <i key={idx} />
        ))}
      </div>

      <ArcaneSummonCircles />
      <DimensionalCracks />

      {/* 高レア昇格時に左右へ刻印される「黄金昇格／虹彩突破／超絶確定／伝説降臨」縦書きエンブレム */}
      {showSeal && (
        <div className="gacha-summon-seal" key={`seal:${step.stage}`} aria-hidden="true">
          <span>{spec.sealJp}</span>
        </div>
      )}

      <div className="gacha-summon-cutin" key={`cutin:${act}:${tease ? 'tease' : step.stage}`} aria-hidden="true">
        <div className="gacha-summon-cutin-inner">
          <small>{cutinSub}</small>
          <span>{cutinMain}</span>
        </div>
      </div>

      <div className="gacha-summon-core-stage" aria-hidden="true">
        <StrikeSlingshotAim />
        <div className="gacha-reveal-duo-backdrop">
          <video
            ref={bgVideoRef}
            src={FULLFRAME_CINEMATIC_MOVIES.gachaDuoIntro.mp4}
            poster={FULLFRAME_CINEMATIC_MOVIES.gachaDuoIntro.poster}
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
          />
        </div>
        {act === 'orb' && (
          <div className="gacha-reveal-orb-wrap">
            <SacredOrbCrest />
            <div className="gacha-reveal-orb">
              <CinematicSequence names={GACHA_REVEAL_CLIPS[rarity]} label="ガチャの開封動画" />
            </div>
          </div>
        )}
        {shockSeq > 0 && (
          <div className="gacha-summon-shockwave-group" key={`sw:${shockSeq}`}>
            <div className="gacha-summon-shockwave" />
            <div className="gacha-summon-shockwave is-delayed" />
          </div>
        )}
        {burst && (
          <div className="gacha-summon-shards">
            {Array.from({ length: SHARD_COUNT }, (_, idx) => (
              <i key={idx} />
            ))}
          </div>
        )}
      </div>

      <div className="gacha-reveal-sparks" aria-hidden="true">
        {Array.from({ length: 16 }, (_, i) => (
          <i key={i} />
        ))}
      </div>

      <p
        className="gacha-reveal-caption"
        role="status"
        aria-live="assertive"
        key={tease ? 'tease' : `${act}:${step.stage}`}
        data-tease={tease || undefined}
      >
        {tease ? REVEAL_TEASE_CAPTION : act === 'duo' ? 'ストライク共鳴！ 星扉にマナが収束する…！' : step.caption}
      </p>

      {/* E1：ゲージは毎回5本。光った段だけ色が付き、溜めのときは次の1本が点滅する（色は付けない） */}
      <ol className="gacha-reveal-meter" aria-hidden="true">
        {REVEAL_ORDER.map((stage, i) => (
          <li key={stage} data-stage={stage} data-on={i <= index || undefined} data-tease={(tease && i === index + 1) || undefined} />
        ))}
      </ol>

      <div className="gacha-reveal-flash" aria-hidden="true" />
      <button type="button" onClick={skip}>
        結果を見る
      </button>
    </div>
  );
}

/** 結果画面の星（レア度ぶん順番に光る） */
export function RarityStars({ count }: { count: number }) {
  return (
    <span className="gacha-stars" aria-label={`星${count}`}>
      {Array.from({ length: count }, (_, i) => (
        <i key={i}>★</i>
      ))}
    </span>
  );
}
