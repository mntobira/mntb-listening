import { useEffect, useRef } from 'react';
import { sfxEnabled } from '../battle/ui/feedback';
import { readAudioPreferences } from '../battle/audio/audioPreferences';
import { sharedAudioContextResumed } from '../battle/audio/sharedAudioContext';
import type { RevealStage } from './gachaRevealSteps';

export type StageSpec = {
  cutin: string;
  sub: string;
  sealJp: string;
  impactKanji: string;
  impactSub: string;
  reversalTitle: string;
  freq: number;
  colors: readonly [string, string, string];
};

export const STAGE_SPEC: Record<RevealStage, StageSpec> = {
  blue: {
    cutin: '✦ STARLIGHT PULL — 星辰召喚 ✦',
    sub: 'SUMMON GATE ENGAGED',
    sealJp: '星扉開放',
    impactKanji: '召喚発動',
    impactSub: 'STARLIGHT GATE',
    reversalTitle: '星扉共鳴！',
    freq: 329.63,
    colors: ['#60a5fa', '#e0f2fe', '#38bdf8'],
  },
  gold: {
    cutin: '⚡ GOLD STRIKE — 金扉昇格・R以上確定！ ⚡',
    sub: 'GOLDEN DRAGONPULSE',
    sealJp: '黄金昇格',
    impactKanji: '金扉昇格！',
    impactSub: 'RARE OR ABOVE',
    reversalTitle: '黄金転換！',
    freq: 440,
    colors: ['#fbbf24', '#fef9c3', '#f59e0b'],
  },
  rainbow: {
    cutin: '🌈 PRISM OVERDRIVE — 虹扉突破・SR以上確定！！ 🌈',
    sub: 'SEVENFOLD RAINBOW SURGE',
    sealJp: '虹彩突破',
    impactKanji: '虹扉突破！！',
    impactSub: 'SUPER RARE GUARANTEED',
    reversalTitle: '逆転虹昇格！！',
    freq: 587.33,
    colors: ['#e879f9', '#38bdf8', '#fde047'],
  },
  ur: {
    cutin: '👑 ULTRA AWAKENING — 超激レア UR確定！！ 👑',
    sub: 'DIMENSIONAL SHATTER',
    sealJp: '超絶確定',
    impactKanji: '超絶確定！！',
    impactSub: 'ULTRA RARE AWAKENING',
    reversalTitle: '確定演出・超絶覚醒！！',
    freq: 783.99,
    colors: ['#facc15', '#c084fc', '#f472b6'],
  },
  lr: {
    cutin: '🔥 LEGENDARY ADVENT — 伝説降臨 LR確定！！！ 🔥',
    sub: 'GENESIS SUPERNOVA',
    sealJp: '伝説降臨',
    impactKanji: '伝説降臨！！！',
    impactSub: 'LEGENDARY GENESIS',
    reversalTitle: '奇跡到来・伝説降臨！！！',
    freq: 1046.5,
    colors: ['#fde047', '#fb7185', '#ffffff'],
  },
};

type SummonParticle = {
  angle: number;
  radius: number;
  prevX: number;
  prevY: number;
  vr: number;
  omega: number;
  size: number;
  alpha: number;
  decay: number;
  color: string;
  diamond: boolean;
};

type ShockRing = {
  r: number;
  maxR: number;
  alpha: number;
  color: string;
  width: number;
};

/**
 * 60fps Canvas 2D 神ゲーム級シェーダー演出エンジン：
 * 1) 残光コメットリボン軌跡つきの螺旋マナ銀河（引っ張りテンションに応じて中心吸引速度が倍増！）
 * 2) 高レア時・溜め時に中央オーブ外周でリアルタイム放電するプロシージャル稲妻アーク（折れ線プラズマ放電）
 * 3) 昇格・タップチャージ時の多層Canvas衝撃波リング
 */
export function SummonParticleCanvas({
  act,
  stage,
  shockSeq,
  burst,
  tease,
  pullTension,
}: {
  act: 'duo' | 'orb';
  stage: RevealStage;
  shockSeq: number;
  burst: boolean;
  tease: boolean;
  pullTension: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ act, stage, burst, tease, pullTension });
  stateRef.current = { act, stage, burst, tease, pullTension };
  const prevShockRef = useRef(0);
  const particlesRef = useRef<SummonParticle[]>([]);
  const ringsRef = useRef<ShockRing[]>([]);

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
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w * 0.5;
      const cy = h * 0.44;
      const maxR = Math.hypot(w, h) * 0.48;
      const angle = Math.random() * Math.PI * 2;
      const radius = inward ? 130 + Math.random() * maxR * 0.75 : 38 + Math.random() * 92;
      return {
        angle,
        radius,
        prevX: cx + Math.cos(angle) * radius,
        prevY: cy + Math.sin(angle) * radius,
        vr: inward ? -(2.0 + Math.random() * 2.8) : 1.1 + Math.random() * 2.6,
        omega: (Math.random() < 0.5 ? -1 : 1) * (0.014 + Math.random() * 0.024),
        size: 2.3 + Math.random() * 4.5,
        alpha: 0.6 + Math.random() * 0.4,
        decay: 0.0055 + Math.random() * 0.0075,
        color: palette[Math.floor(Math.random() * palette.length)] ?? '#ffffff',
        diamond: Math.random() > 0.34,
      };
    };

    const initialPalette = STAGE_SPEC[stateRef.current.stage].colors;
    particlesRef.current = Array.from({ length: 48 }, () => spawnAmbient(true, initialPalette));

    const drawLightningArc = (
      cx: number,
      cy: number,
      baseR: number,
      a0: number,
      a1: number,
      color: string,
    ) => {
      const segments = 7;
      ctx.save();
      ctx.beginPath();
      for (let s = 0; s <= segments; s++) {
        const t = s / segments;
        const ang = a0 + (a1 - a0) * t;
        const jitter = s === 0 || s === segments ? 0 : (Math.random() - 0.5) * 26;
        const r = baseR + jitter;
        const px = cx + Math.cos(ang) * r;
        const py = cy + Math.sin(ang) * r;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 4.2;
      ctx.globalAlpha = 0.42;
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = 0.92;
      ctx.stroke();
      ctx.restore();
    };

    let frame = 0;
    let rafId = 0;
    const render = () => {
      frame += 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w * 0.5;
      const cy = h * 0.44;
      const { act: curAct, stage: curStage, burst: isBurst, tease: isTease, pullTension: tension } = stateRef.current;
      const palette = STAGE_SPEC[curStage].colors;

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      const rings = ringsRef.current;
      for (let i = rings.length - 1; i >= 0; i--) {
        const rg = rings[i];
        rg.r += (rg.maxR - rg.r) * 0.14 + 3.2;
        rg.alpha *= 0.91;
        if (rg.alpha <= 0.02 || rg.r >= rg.maxR) {
          rings.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(cx, cy, rg.r, 0, Math.PI * 2);
        ctx.strokeStyle = rg.color;
        ctx.lineWidth = rg.width * rg.alpha;
        ctx.globalAlpha = rg.alpha;
        ctx.stroke();
      }

      const list = particlesRef.current;
      const targetCount = curStage === 'lr' ? 78 : curStage === 'ur' ? 70 : curStage === 'rainbow' ? 60 : 48;
      while (list.length < targetCount) {
        list.push(spawnAmbient(curAct === 'duo', palette));
      }

      const speedBoost = 1 + tension * 1.6 + (isTease ? 0.65 : 0);
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        const x0 = cx + Math.cos(p.angle) * p.radius;
        const y0 = cy + Math.sin(p.angle) * p.radius;
        p.prevX = x0;
        p.prevY = y0;

        p.angle += p.omega * (isBurst ? 2.4 : speedBoost);
        p.radius += p.vr * (isBurst ? 3.1 : speedBoost);
        p.alpha -= p.decay;

        if (p.alpha <= 0.02 || p.radius < 12 || p.radius > Math.max(w, h) * 0.78) {
          if (list.length <= targetCount) {
            list[i] = spawnAmbient(curAct === 'duo', palette);
          } else {
            list.splice(i, 1);
          }
          continue;
        }

        const x = cx + Math.cos(p.angle) * p.radius;
        const y = cy + Math.sin(p.angle) * p.radius;
        const a = Math.max(0, Math.min(1, p.alpha));

        ctx.beginPath();
        ctx.moveTo(p.prevX, p.prevY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1.2, p.size * 0.55);
        ctx.globalAlpha = a * 0.62;
        ctx.stroke();

        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        if (p.diamond) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(p.angle + Math.PI * 0.25);
          const s = p.size;
          ctx.beginPath();
          ctx.moveTo(0, -s * 1.5);
          ctx.lineTo(s * 0.88, 0);
          ctx.lineTo(0, s * 1.5);
          ctx.lineTo(-s * 0.88, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(x, y, p.size * 0.78, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const arcCount =
        curStage === 'lr' ? 4 : curStage === 'ur' ? 3 : curStage === 'rainbow' || isTease ? 2 : tension > 0.35 ? 2 : 0;
      if (arcCount > 0 && frame % 2 === 0) {
        const orbR = Math.min(w * 0.34, 136);
        for (let a = 0; a < arcCount; a++) {
          const start = Math.random() * Math.PI * 2;
          const span = 0.55 + Math.random() * 0.85;
          drawLightningArc(cx, cy, orbR, start, start + span, palette[a % palette.length] ?? '#60a5fa');
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
    const w = typeof window !== 'undefined' ? window.innerWidth : 400;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    const cx = w * 0.5;
    const cy = h * 0.44;

    ringsRef.current.push(
      { r: 44, maxR: Math.min(w, h) * 0.54, alpha: 0.92, color: palette[0], width: 6 },
      { r: 28, maxR: Math.min(w, h) * 0.42, alpha: 0.78, color: '#ffffff', width: 3 },
    );

    const burstCount = stage === 'lr' || stage === 'ur' ? 38 : 26;
    for (let k = 0; k < burstCount; k++) {
      const ang = (Math.PI * 2 * k) / burstCount + (Math.random() - 0.5) * 0.18;
      const rad = 40 + Math.random() * 24;
      particlesRef.current.push({
        angle: ang,
        radius: rad,
        prevX: cx + Math.cos(ang) * rad,
        prevY: cy + Math.sin(ang) * rad,
        vr: 3.8 + Math.random() * 5.2,
        omega: (Math.random() - 0.5) * 0.032,
        size: 3.4 + Math.random() * 4.8,
        alpha: 0.98,
        decay: 0.015 + Math.random() * 0.011,
        color: k % 3 === 0 ? '#ffffff' : (palette[k % palette.length] ?? '#ffffff'),
        diamond: true,
      });
    }
  }, [shockSeq, stage]);

  return <canvas ref={canvasRef} className="gacha-summon-particles" aria-hidden="true" />;
}

/**
 * 共有 AudioContext 上で鳴らすプロシージャル立体音響シンセ（神ゲーム版）：
 * - charge: 召喚陣起動スイープ
 * - pull: 引っ張り距離に比例してピッチが上がるテンション音
 * - kyuin: パズドラ／モンスト確定演出の「プチュン…キュイィィン！！」逆転チャイム
 * - step: 重低音サブベース打撃＋昇格コード倍音
 * - shatter: クリスタル破砕ノイズバースト＋5和音ファンファーレ
 */
export function playSummonSynth(
  kind: 'charge' | 'pull' | 'kyuin' | 'step' | 'tease' | 'shatter',
  stage: RevealStage,
  tension = 0.5,
): void {
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
      const f0 = 380 + tension * 520;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f0, now);
      osc.frequency.exponentialRampToValueAtTime(f0 * 1.28, now + 0.09);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(masterVol * 0.7, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.connect(gain).connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.13);
      return;
    }

    if (kind === 'kyuin') {
      const drop = ac.createOscillator();
      const dropGain = ac.createGain();
      drop.type = 'sawtooth';
      drop.frequency.setValueAtTime(420, now);
      drop.frequency.exponentialRampToValueAtTime(48, now + 0.1);
      dropGain.gain.setValueAtTime(masterVol * 0.95, now);
      dropGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
      drop.connect(dropGain).connect(ac.destination);
      drop.start(now);
      drop.stop(now + 0.12);

      [1, 1.5].forEach((mul, idx) => {
        const ky = ac.createOscillator();
        const kyGain = ac.createGain();
        const t0 = now + 0.12 + idx * 0.025;
        ky.type = idx === 0 ? 'sine' : 'triangle';
        ky.frequency.setValueAtTime(587.33 * mul, t0);
        ky.frequency.exponentialRampToValueAtTime(1760 * mul, t0 + 0.26);
        kyGain.gain.setValueAtTime(0.0001, t0);
        kyGain.gain.linearRampToValueAtTime(masterVol * (idx === 0 ? 1.05 : 0.7), t0 + 0.03);
        kyGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.36);
        ky.connect(kyGain).connect(ac.destination);
        ky.start(t0);
        ky.stop(t0 + 0.38);
      });
      return;
    }

    if (kind === 'step') {
      const sub = ac.createOscillator();
      const subGain = ac.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(140, now);
      sub.frequency.exponentialRampToValueAtTime(40, now + 0.22);
      subGain.gain.setValueAtTime(0.0001, now);
      subGain.gain.linearRampToValueAtTime(masterVol * 1.18, now + 0.012);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
      sub.connect(subGain).connect(ac.destination);
      sub.start(now);
      sub.stop(now + 0.26);

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
      osc.frequency.exponentialRampToValueAtTime(base * 1.55, now + 0.74);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(masterVol * 0.85, now + 0.24);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      osc.connect(gain).connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.82);
      return;
    }

    const bufLen = Math.max(256, Math.floor(ac.sampleRate * 0.14));
    const noiseBuf = ac.createBuffer(1, bufLen, ac.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.28));
    }
    const noise = ac.createBufferSource();
    noise.buffer = noiseBuf;
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(2400, now);
    const nGain = ac.createGain();
    nGain.gain.setValueAtTime(masterVol * 0.95, now);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    noise.connect(hp).connect(nGain).connect(ac.destination);
    noise.start(now);

    const sub = ac.createOscillator();
    const subGain = ac.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(155, now);
    sub.frequency.exponentialRampToValueAtTime(36, now + 0.28);
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.linearRampToValueAtTime(masterVol * 1.22, now + 0.012);
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
      gain.gain.linearRampToValueAtTime(masterVol * 0.94, t0 + 0.016);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.52);
      osc.connect(gain).connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + 0.54);
    });
  } catch (err) {
    // WebAudio 非対応または閉鎖済みコンテキストでは既存の play() 効果音のみで進行する
    void err;
  }
}
