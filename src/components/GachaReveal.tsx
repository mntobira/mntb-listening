import { useMountEffect } from '../hooks/useMountEffect';
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
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
  impactKanji: string;
  impactSub: string;
  freq: number;
  colors: readonly [string, string, string];
};

const STAGE_SPEC: Record<RevealStage, StageSpec> = {
  blue: {
    cutin: '✦ STARLIGHT PULL — 星辰召喚 ✦',
    sub: 'SUMMON GATE ENGAGED',
    sealJp: '星扉開放',
    impactKanji: '召喚発動',
    impactSub: 'STARLIGHT GATE',
    freq: 329.63,
    colors: ['#60a5fa', '#e0f2fe', '#38bdf8'],
  },
  gold: {
    cutin: '⚡ GOLD STRIKE — 金扉昇格・R以上確定！ ⚡',
    sub: 'GOLDEN DRAGONPULSE',
    sealJp: '黄金昇格',
    impactKanji: '金扉昇格！',
    impactSub: 'RARE OR ABOVE',
    freq: 440,
    colors: ['#fbbf24', '#fef9c3', '#f59e0b'],
  },
  rainbow: {
    cutin: '🌈 PRISM OVERDRIVE — 虹扉突破・SR以上確定！！ 🌈',
    sub: 'SEVENFOLD RAINBOW SURGE',
    sealJp: '虹彩突破',
    impactKanji: '虹扉突破！！',
    impactSub: 'SUPER RARE GUARANTEED',
    freq: 587.33,
    colors: ['#e879f9', '#38bdf8', '#fde047'],
  },
  ur: {
    cutin: '👑 ULTRA AWAKENING — 超激レア UR確定！！ 👑',
    sub: 'DIMENSIONAL SHATTER',
    sealJp: '超絶確定',
    impactKanji: '超絶確定！！',
    impactSub: 'ULTRA RARE AWAKENING',
    freq: 783.99,
    colors: ['#facc15', '#c084fc', '#f472b6'],
  },
  lr: {
    cutin: '🔥 LEGENDARY ADVENT — 伝説降臨 LR確定！！！ 🔥',
    sub: 'GENESIS SUPERNOVA',
    sealJp: '伝説降臨',
    impactKanji: '伝説降臨！！！',
    impactSub: 'LEGENDARY GENESIS',
    freq: 1046.5,
    colors: ['#fde047', '#fb7185', '#ffffff'],
  },
};

const METEOR_COUNT = 6;
const SHARD_COUNT = 16;

type SummonParticle = {
  angle: number;
  radius: number;
  vr: number;
  omega: number;
  size: number;
  alpha: number;
  decay: number;
  color: string;
  diamond: boolean;
};

/**
 * 60fps Canvas 2D 星辰マナ渦＆昇格爆発パーティクルエンジン（GPU合成を邪魔しない軽量 48〜96 粒子）。
 * 第1幕は外周から中央ゲートへ螺旋吸引（ドッカンの気集束）、第2幕＆昇格時は中央オーブから螺旋噴出！
 */
function SummonParticleCanvas({
  act,
  stage,
  shockSeq,
  burst,
}: {
  act: 'duo' | 'orb';
  stage: RevealStage;
  shockSeq: number;
  burst: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ act, stage, burst });
  stateRef.current = { act, stage, burst };
  const prevShockRef = useRef(0);
  const particlesRef = useRef<SummonParticle[]>([]);

  useEffect(() => {
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(320, window.innerWidth);
      const h = Math.max(480, window.innerHeight);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const spawnAmbient = (inward: boolean, palette: readonly [string, string, string]): SummonParticle => {
      const maxR = Math.hypot(window.innerWidth, window.innerHeight) * 0.48;
      return {
        angle: Math.random() * Math.PI * 2,
        radius: inward ? 130 + Math.random() * maxR * 0.75 : 34 + Math.random() * 90,
        vr: inward ? -(1.8 + Math.random() * 2.6) : 0.9 + Math.random() * 2.4,
        omega: (Math.random() < 0.5 ? -1 : 1) * (0.012 + Math.random() * 0.022),
        size: 2.2 + Math.random() * 4.4,
        alpha: 0.55 + Math.random() * 0.45,
        decay: 0.006 + Math.random() * 0.008,
        color: palette[Math.floor(Math.random() * palette.length)] ?? '#ffffff',
        diamond: Math.random() > 0.38,
      };
    };

    const initialPalette = STAGE_SPEC[stateRef.current.stage].colors;
    particlesRef.current = Array.from({ length: 44 }, () => spawnAmbient(true, initialPalette));

    let rafId = 0;
    const render = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w * 0.5;
      const cy = h * 0.44;
      const { act: curAct, stage: curStage, burst: isBurst } = stateRef.current;
      const palette = STAGE_SPEC[curStage].colors;

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      const list = particlesRef.current;
      const targetCount = curStage === 'lr' || curStage === 'ur' ? 68 : curStage === 'rainbow' ? 58 : 44;
      while (list.length < targetCount) {
        list.push(spawnAmbient(curAct === 'duo', palette));
      }

      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.angle += p.omega * (isBurst ? 2.2 : 1);
        p.radius += p.vr * (isBurst ? 2.8 : 1);
        p.alpha -= p.decay;

        if (p.alpha <= 0.02 || p.radius < 12 || p.radius > Math.max(w, h) * 0.75) {
          if (list.length <= targetCount) {
            list[i] = spawnAmbient(curAct === 'duo', palette);
          } else {
            list.splice(i, 1);
          }
          continue;
        }

        const x = cx + Math.cos(p.angle) * p.radius;
        const y = cy + Math.sin(p.angle) * p.radius;
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        ctx.fillStyle = p.color;

        if (p.diamond) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(p.angle + Math.PI * 0.25);
          const s = p.size;
          ctx.beginPath();
          ctx.moveTo(0, -s * 1.45);
          ctx.lineTo(s * 0.85, 0);
          ctx.lineTo(0, s * 1.45);
          ctx.lineTo(-s * 0.85, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(x, y, p.size * 0.75, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    if (shockSeq <= prevShockRef.current) return;
    prevShockRef.current = shockSeq;
    const palette = STAGE_SPEC[stage].colors;
    const burstCount = stage === 'lr' || stage === 'ur' ? 34 : 24;
    for (let k = 0; k < burstCount; k++) {
      particlesRef.current.push({
        angle: (Math.PI * 2 * k) / burstCount + (Math.random() - 0.5) * 0.18,
        radius: 42 + Math.random() * 26,
        vr: 3.4 + Math.random() * 4.8,
        omega: (Math.random() - 0.5) * 0.03,
        size: 3.2 + Math.random() * 4.6,
        alpha: 0.96,
        decay: 0.016 + Math.random() * 0.012,
        color: k % 3 === 0 ? '#ffffff' : (palette[k % palette.length] ?? '#ffffff'),
        diamond: true,
      });
    }
  }, [shockSeq, stage]);

  return <canvas ref={canvasRef} className="gacha-summon-particles" aria-hidden="true" />;
}

/**
 * 共有 AudioContext 上で鳴らす召喚シンセレイヤー（モンストの引っ張り溜め音・ドッカンの重低音インパクト＆上昇和音・結晶破砕ファンファーレ）。
 * 既存の battle_sfx 設定と音量設定を厳守し、新しい AudioContext は絶対に作らない。
 */
function playSummonSynth(kind: 'charge' | 'pull' | 'step' | 'tease' | 'shatter', stage: RevealStage): void {
  if (!sfxEnabled()) return;
  const ac = sharedAudioContextResumed();
  if (!ac || ac.state !== 'running') return;
  const masterVol = Math.max(0, Math.min(1, readAudioPreferences().volume)) * 0.17;
  if (masterVol <= 0.001) return;

  try {
    const now = ac.currentTime;
    const base = STAGE_SPEC[stage].freq;

    if (kind === 'charge') {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(185, now);
      osc.frequency.exponentialRampToValueAtTime(415, now + 0.62);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(masterVol * 0.85, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.66);
      osc.connect(gain).connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.68);
      return;
    }

    if (kind === 'pull') {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.11);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(masterVol * 0.75, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      osc.connect(gain).connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.16);
      return;
    }

    if (kind === 'step') {
      // 重低音サブベース打撃（モンスト／ドッカンの「ドンッ！」）
      const sub = ac.createOscillator();
      const subGain = ac.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(135, now);
      sub.frequency.exponentialRampToValueAtTime(42, now + 0.22);
      subGain.gain.setValueAtTime(0.0001, now);
      subGain.gain.linearRampToValueAtTime(masterVol * 1.15, now + 0.012);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
      sub.connect(subGain).connect(ac.destination);
      sub.start(now);
      sub.stop(now + 0.26);

      // 昇格アルペジオ倍音
      [1, 1.25, 1.5, stage === 'ur' || stage === 'lr' ? 2 : 1.5].forEach((ratio, idx) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        const t0 = now + idx * 0.032;
        osc.type = stage === 'ur' || stage === 'lr' ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(base * ratio * 0.94, t0);
        osc.frequency.exponentialRampToValueAtTime(base * ratio, t0 + 0.08);
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.linearRampToValueAtTime(masterVol * (idx >= 2 ? 0.92 : 0.62), t0 + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.36);
        osc.connect(gain).connect(ac.destination);
        osc.start(t0);
        osc.stop(t0 + 0.38);
      });
      return;
    }

    if (kind === 'tease') {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(base * 0.85, now);
      osc.frequency.exponentialRampToValueAtTime(base * 1.52, now + 0.74);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(masterVol * 0.85, now + 0.24);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      osc.connect(gain).connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.82);
      return;
    }

    // shatter: 重低音インパクト＋結晶ブレイク高次倍音ファンファーレ
    const sub = ac.createOscillator();
    const subGain = ac.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(150, now);
    sub.frequency.exponentialRampToValueAtTime(38, now + 0.28);
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.linearRampToValueAtTime(masterVol * 1.2, now + 0.012);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    sub.connect(subGain).connect(ac.destination);
    sub.start(now);
    sub.stop(now + 0.32);

    [1, 1.25, 1.5, 2, 2.5].forEach((ratio, idx) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      const t0 = now + idx * 0.02;
      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(base * ratio, t0);
      osc.frequency.exponentialRampToValueAtTime(base * ratio * 1.03, t0 + 0.44);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(masterVol * 0.92, t0 + 0.016);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
      osc.connect(gain).connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + 0.52);
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

/** モンスト風・ストライクショット牽引リング＆照準アロー（実際にドラッグ／タップでも引ける双方向ギミック付き！） */
function StrikeSlingshotAim({ pulled }: { pulled: boolean }) {
  return (
    <svg className="gacha-summon-slingshot" data-pulled={pulled || undefined} viewBox="0 0 320 320" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="gacha-strike-grad" x1="160" y1="305" x2="160" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
          <stop offset="55%" stopColor="currentColor" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
        </linearGradient>
      </defs>
      <circle cx="160" cy="160" r="144" stroke="currentColor" strokeWidth="1.8" strokeDasharray="12 7" opacity="0.78" />
      <circle cx="160" cy="160" r="126" stroke="#ffffff" strokeWidth="1" strokeDasharray="4 8" opacity="0.55" />
      <line x1="160" y1="308" x2="160" y2="30" stroke="url(#gacha-strike-grad)" strokeWidth="6" strokeLinecap="round" />
      <polygon points="160,10 140,46 160,36 180,46" fill="#ffffff" />
      <polyline points="130,256 160,228 190,256" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="138,284 160,262 182,284" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}

/** パズドラ×モンスト風・聖なる龍爪ダイヤオーブ冠ベゼル＆プリズムファセット亀裂（オーブ表面に走る光のひび） */
function SacredOrbCrest() {
  return (
    <svg className="gacha-orb-crest" viewBox="0 0 280 280" fill="none" aria-hidden="true">
      <circle cx="140" cy="140" r="129" stroke="currentColor" strokeWidth="2.6" opacity="0.92" />
      <circle cx="140" cy="140" r="136" stroke="currentColor" strokeWidth="1.2" strokeDasharray="8 5" opacity="0.72" />
      {/* 12方位の聖宝石スタッド */}
      {Array.from({ length: 12 }, (_, k) => {
        const deg = k * 30;
        return (
          <g key={deg} transform={`rotate(${deg} 140 140)`}>
            <polygon points="140,4 145,14 140,20 135,14" fill="currentColor" opacity={k % 3 === 0 ? 1 : 0.65} />
          </g>
        );
      })}
      {/* 上下左右の聖龍爪クロー */}
      <path d="M140 0 L155 24 L140 17 L125 24 Z" fill="#ffffff" />
      <path d="M140 280 L155 256 L140 263 L125 256 Z" fill="#ffffff" />
      <path d="M0 140 L24 125 L17 140 L24 155 Z" fill="#ffffff" />
      <path d="M280 140 L256 125 L263 140 L256 155 Z" fill="#ffffff" />
      {/* 斜め四隅のドラゴニックウイング装飾 */}
      <path d="M38 38 L66 48 L48 66 Z" fill="currentColor" opacity="0.9" />
      <path d="M242 38 L214 48 L232 66 Z" fill="currentColor" opacity="0.9" />
      <path d="M38 242 L66 232 L48 214 Z" fill="currentColor" opacity="0.9" />
      <path d="M242 242 L214 232 L232 214 Z" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

/** パズドラのダイヤタマゴ／モンストの確定オーブひび割れのように、昇格・溜め時にオーブ表面に浮かび上がる光の亀裂 */
function OrbFractureOverlay() {
  return (
    <svg className="gacha-orb-fracture" viewBox="0 0 240 240" fill="none" aria-hidden="true">
      <path d="M120 18 L112 64 L134 98 L116 132 L128 178 L118 222" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M134 98 L178 76 L212 84" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M112 64 L68 54 L34 68" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M116 132 L64 154 L28 148" stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M128 178 L176 190 L206 176" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** ドッカンバトル風・高レア昇格／極限溜め／解放時に走るプラズマ稲妻＆次元ガラス破砕クラック */
function DimensionalCracks() {
  return (
    <svg className="gacha-summon-cracks" viewBox="0 0 400 400" preserveAspectRatio="none" fill="none" aria-hidden="true">
      {/* 外側ハロー稲妻 */}
      <g className="gacha-crack-glow" stroke="currentColor" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.42">
        <path d="M200 185 L148 126 L164 94 L104 38 L68 10" />
        <path d="M200 185 L258 120 L298 106 L346 44 L386 14" />
        <path d="M200 185 L132 238 L88 264 L28 340" />
        <path d="M200 185 L270 244 L318 268 L374 350" />
      </g>
      {/* 鋭利な白芯クラック */}
      <g className="gacha-crack-core" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
 * ガチャの確定演出（モンスト × パズドラ × ドッカンバトル流・フルスクリーン星辰召喚シアター極致版）。
 * - 60fps Canvas マナ渦粒子エンジン（第1幕は中心へ螺旋集束 → 第2幕・昇格時は放射爆発！）
 * - 第1幕（act = 'duo'）：モンスト風ストライク牽引照準（タップ／下スワイプでも手応え反応！）＋流星の尾＋
 *   とびら君＆カギノスケ共鳴クリスタルポータル（FULLFRAME_CINEMATIC_MOVIES.gachaDuoIntro・丸窓被りゼロ）。
 * - 第2幕（act = 'orb'）：聖なる龍爪ダイヤオーブ冠（GACHA_REVEAL_CLIPS[rarity]）へ凝縮し、
 *   昇格の瞬間にドッカン／モンスト流「暗転ヒットストップ＆特大漢字フラッシュ（金扉昇格！／虹扉突破！！／超絶確定！！／伝説降臨！！！）」が炸裂！
 * - 終幕（burst）：オーブに光の亀裂が走り、16枚のプリズム結晶シャードが弾け飛んで結果画面へ突入！
 */
export function GachaReveal({ rarity, onDone }: { rarity: GachaRarity; onDone: () => void; key?: number }) {
  const steps = revealSteps(rarity);
  const [act, setAct] = useState<'duo' | 'orb'>('duo');
  const [index, setIndex] = useState(0);
  const [shockSeq, setShockSeq] = useState(0);
  const [impactStage, setImpactStage] = useState<RevealStage | null>(null);
  const [pulled, setPulled] = useState(false);
  const [burst, setBurst] = useState(false);
  /** E1：最後の段のあとの溜め（次のゲージがチカチカ） */
  const [tease, setTease] = useState(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const finished = useRef(false);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const dragStartY = useRef<number | null>(null);

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

    // 第1幕（共鳴ストライクカットイン 760ms）→ 第2幕（召喚オーブ凝縮＆段階昇格）へシームレス転換
    const actSwitchMs = Math.min(760, Math.floor(steps[0].ms * 0.6));
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
            setImpactStage(s.stage);
            play(s.sfx, s.vibrate);
            playSummonSynth('step', s.stage);
            timers.push(setTimeout(() => setImpactStage(cur => (cur === s.stage ? null : cur)), 460));
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

  // ステージ中央をタップまたは下に引っ張ると、モンスト／ドッカンの手動チャージ波紋が追加発動する遊び心ギミック
  const onStagePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragStartY.current = e.clientY;
    setPulled(true);
    setShockSeq(n => n + 1);
    playSummonSynth('pull', step.stage);
  };

  const onStagePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartY.current !== null && e.clientY - dragStartY.current > 24 && act === 'duo') {
      setAct('orb');
      setShockSeq(n => n + 1);
      playSummonSynth('step', step.stage);
    }
    dragStartY.current = null;
    setPulled(false);
  };

  const cutinMain = tease
    ? '⚡ OVERCHARGE — 限界突破の予兆…！？ ⚡'
    : act === 'duo'
      ? '✦ STRIKE RESONANCE — 共鳴召喚ゲート開放！！ ✦'
      : spec.cutin;

  const cutinSub = tease
    ? 'LIMIT GAUGE PULSING'
    : act === 'duo'
      ? 'PULL OR TAP TO BOOST MANA'
      : spec.sub;

  const showSeal = act === 'orb' && (step.stage === 'gold' || step.stage === 'rainbow' || step.stage === 'ur' || step.stage === 'lr');
  const showOrbFracture = tease || burst || step.stage === 'rainbow' || step.stage === 'ur' || step.stage === 'lr';

  return (
    <div
      className="gacha-cinema gacha-reveal"
      data-act={act}
      data-stage={step.stage}
      data-step-bump={index > 0 ? String(index) : undefined}
      data-impact={impactStage || undefined}
      data-burst={burst || undefined}
      data-tease={tease || undefined}
      data-gacha-reveal
    >
      <div className="gacha-summon-cosmos" aria-hidden="true" />
      <div className="gacha-summon-pillar" aria-hidden="true" />
      <div className="gacha-summon-speedlines" aria-hidden="true" />
      <div className="gacha-reveal-rays" aria-hidden="true" />
      <SummonParticleCanvas act={act} stage={step.stage} shockSeq={shockSeq} burst={burst} />

      {/* 上空から中央ゲートへ降り注ぐ召喚流星の尾（ドッカンバトル風メテオフォール） */}
      <div className="gacha-summon-meteors" aria-hidden="true">
        {Array.from({ length: METEOR_COUNT }, (_, idx) => (
          <i key={idx} />
        ))}
      </div>

      <ArcaneSummonCircles />
      <DimensionalCracks />

      {/* 昇格の瞬間に走るドッカン／モンスト流「暗転ヒットストップ＆特大確定文字スラッシュ」！ */}
      {impactStage && (
        <div className="gacha-summon-impact-banner" key={`imp:${impactStage}`} aria-hidden="true">
          <small>{STAGE_SPEC[impactStage].impactSub}</small>
          <strong>{STAGE_SPEC[impactStage].impactKanji}</strong>
        </div>
      )}

      {/* 高レア昇格時に右上へ刻印される「黄金昇格／虹彩突破／超絶確定／伝説降臨」縦書きエンブレム */}
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

      <div
        className="gacha-summon-core-stage"
        onPointerDown={onStagePointerDown}
        onPointerUp={onStagePointerUp}
        onPointerCancel={() => setPulled(false)}
        aria-hidden="true"
      >
        <StrikeSlingshotAim pulled={pulled} />
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
              {showOrbFracture && <OrbFractureOverlay />}
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
