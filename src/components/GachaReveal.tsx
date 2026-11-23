import { useMountEffect } from '../hooks/useMountEffect';
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { CinematicSequence, GACHA_REVEAL_CLIPS } from './CinematicClip';
import { FULLFRAME_CINEMATIC_MOVIES } from './AlphaCinematicClip';
import type { GachaRarity } from '../battle/core/growth';
import { play } from '../battle/ui/feedback';
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
import { STAGE_SPEC, SummonParticleCanvas, playSummonSynth } from './gachaSummonFx';
import './gacha-summon-theater.css';

const METEOR_COUNT = 6;
const SHARD_COUNT = 16;

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

/**
 * モンスト完全再現・物理ベクトル連動ストライク照準アロー：
 * ドラッグ方向（dx, dy）と逆向きに発射レーザー矢印が伸び、テンションリングが収縮する！
 */
function StrikeSlingshotAim({
  pulled,
  aimDeg,
  tension,
}: {
  pulled: boolean;
  aimDeg: number;
  tension: number;
}) {
  const arrowTipY = Math.round(32 - tension * 22);
  const tailY = Math.round(298 + tension * 16);
  const ringR = Math.round(144 - tension * 22);
  return (
    <svg
      className="gacha-summon-slingshot"
      data-pulled={pulled || undefined}
      viewBox="0 0 320 320"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="gacha-strike-grad" x1="160" y1="312" x2="160" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
          <stop offset="52%" stopColor="currentColor" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
        </linearGradient>
      </defs>
      <circle cx="160" cy="160" r={ringR} stroke="currentColor" strokeWidth="2" strokeDasharray="12 7" opacity="0.82" />
      <circle cx="160" cy="160" r={Math.max(88, ringR - 18)} stroke="#ffffff" strokeWidth="1.2" strokeDasharray="4 8" opacity="0.6" />
      <g transform={`rotate(${aimDeg} 160 160)`}>
        <line x1="160" y1={tailY} x2="160" y2={arrowTipY + 14} stroke="url(#gacha-strike-grad)" strokeWidth={6 + tension * 3.5} strokeLinecap="round" />
        <polygon points={`160,${arrowTipY - 8} ${138 - tension * 6},${arrowTipY + 28} 160,${arrowTipY + 18} ${182 + tension * 6},${arrowTipY + 28}`} fill="#ffffff" />
        <polyline points="128,256 160,226 192,256" stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="136,284 160,260 184,284" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.88" />
      </g>
    </svg>
  );
}

/** パズドラ×モンスト風・聖なる龍爪ダイヤオーブ冠ベゼル */
function SacredOrbCrest() {
  return (
    <svg className="gacha-orb-crest" viewBox="0 0 280 280" fill="none" aria-hidden="true">
      <circle cx="140" cy="140" r="129" stroke="currentColor" strokeWidth="2.6" opacity="0.92" />
      <circle cx="140" cy="140" r="136" stroke="currentColor" strokeWidth="1.2" strokeDasharray="8 5" opacity="0.72" />
      {Array.from({ length: 12 }, (_, k) => {
        const deg = k * 30;
        return (
          <g key={deg} transform={`rotate(${deg} 140 140)`}>
            <polygon points="140,4 145,14 140,20 135,14" fill="currentColor" opacity={k % 3 === 0 ? 1 : 0.65} />
          </g>
        );
      })}
      <path d="M140 0 L155 24 L140 17 L125 24 Z" fill="#ffffff" />
      <path d="M140 280 L155 256 L140 263 L125 256 Z" fill="#ffffff" />
      <path d="M0 140 L24 125 L17 140 L24 155 Z" fill="#ffffff" />
      <path d="M280 140 L256 125 L263 140 L256 155 Z" fill="#ffffff" />
      <path d="M38 38 L66 48 L48 66 Z" fill="currentColor" opacity="0.9" />
      <path d="M242 38 L214 48 L232 66 Z" fill="currentColor" opacity="0.9" />
      <path d="M38 242 L66 232 L48 214 Z" fill="currentColor" opacity="0.9" />
      <path d="M242 242 L214 232 L232 214 Z" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

/** パズドラのダイヤタマゴ／モンストの確定オーブひび割れ：昇格・溜め時にオーブ表面に浮かび上がる光の亀裂 */
function OrbFractureOverlay() {
  return (
    <svg className="gacha-orb-fracture" viewBox="0 0 240 240" fill="none" aria-hidden="true">
      <path d="M120 18 L112 64 L134 98 L116 132 L128 178 L118 222" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M134 98 L178 76 L212 84" stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M112 64 L68 54 L34 68" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M116 132 L64 154 L28 148" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M128 178 L176 190 L206 176" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** ドッカンバトル風・高レア昇格／極限溜め／解放時に走るプラズマ稲妻＆次元ガラス破砕クラック */
function DimensionalCracks() {
  return (
    <svg className="gacha-summon-cracks" viewBox="0 0 400 400" preserveAspectRatio="none" fill="none" aria-hidden="true">
      <g className="gacha-crack-glow" stroke="currentColor" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.44">
        <path d="M200 185 L148 126 L164 94 L104 38 L68 10" />
        <path d="M200 185 L258 120 L298 106 L346 44 L386 14" />
        <path d="M200 185 L132 238 L88 264 L28 340" />
        <path d="M200 185 L270 244 L318 268 L374 350" />
      </g>
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
 * ガチャの確定演出（神ゲーム版：モンスト超・獣神祭 × パズドラゴッドフェス × ドッカンバトルLR降臨）。
 * - 60fps Canvas コメットリボン銀河＋プロシージャル稲妻アーク放電＋多層衝撃波
 * - 物理ベクトル連動スリングショット（指で実際に引っ張って角度・テンション操作可能＋STRIKE SHOT解放！）
 * - SR / UR / LR 最終段突入時の「プチュン暗転＆ネガ反転 → キュイーン確定逆転カットイン（REVERSAL AWAKENING）」
 * - 5本パワーゲージ（REVEAL_ORDER.map）・「結果を見る」即スキップ・prefers-reduced-motion 完全対応
 */
export function GachaReveal({ rarity, onDone }: { rarity: GachaRarity; onDone: () => void; key?: number }) {
  const steps = revealSteps(rarity);
  const [act, setAct] = useState<'duo' | 'orb'>('duo');
  const [index, setIndex] = useState(0);
  const [shockSeq, setShockSeq] = useState(0);
  const [impactStage, setImpactStage] = useState<RevealStage | null>(null);
  const [reversalStage, setReversalStage] = useState<RevealStage | null>(null);
  const [pulled, setPulled] = useState(false);
  const [pullTension, setPullTension] = useState(0);
  const [aimDeg, setAimDeg] = useState(0);
  const [strikeShotFlash, setStrikeShotFlash] = useState(false);
  const [burst, setBurst] = useState(false);
  /** E1：最後の段のあとの溜め（次のゲージがチカチカ） */
  const [tease, setTease] = useState(false);

  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const finished = useRef(false);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const stageElRef = useRef<HTMLDivElement>(null);
  const dragOrigin = useRef<{ x: number; y: number } | null>(null);
  const lastPullSfxAt = useRef(0);

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
    const isHighFinal = rarity === 'SR' || rarity === 'UR' || rarity === 'LR';
    steps.forEach((s, i) => {
      // SR / UR / LR の最終段の直前 220ms に「プチュン暗転＆キュイーン確定逆転カットイン」を挿入！
      if (isHighFinal && i === steps.length - 1 && at >= 260) {
        timers.push(
          setTimeout(() => {
            setReversalStage(s.stage);
            playSummonSynth('kyuin', s.stage);
          }, at - 220),
        );
      }

      timers.push(
        setTimeout(() => {
          setReversalStage(null);
          setIndex(i);
          if (i > 0) {
            setShockSeq(n => n + 1);
            setImpactStage(s.stage);
            play(s.sfx, s.vibrate);
            playSummonSynth('step', s.stage);
            timers.push(setTimeout(() => setImpactStage(cur => (cur === s.stage ? null : cur)), 480));
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
    setReversalStage(null);
    setTease(false);
    setBurst(true);
    play(burstSfx(rarity), false);
    setTimeout(finish, 180);
  };

  // リアル物理スリングショット操作（指やマウスで引っ張ると角度・テンション・ピッチが連続変化！）
  const onStagePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragOrigin.current = { x: e.clientX, y: e.clientY };
    setPulled(true);
    setPullTension(0.25);
    setShockSeq(n => n + 1);
    playSummonSynth('pull', step.stage, 0.25);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // 非対応環境では通常のポインタイベントで継続する
    }
  };

  const onStagePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragOrigin.current) return;
    const dx = e.clientX - dragOrigin.current.x;
    const dy = e.clientY - dragOrigin.current.y;
    const dist = Math.hypot(dx, dy);
    const nextTension = Math.min(1, dist / 110);
    setPullTension(nextTension);
    if (dist > 8) {
      // 引っ張った方向の逆（発射方向）へ矢印を向ける（モンスト物理準拠）
      const deg = (Math.atan2(dx, Math.max(12, dy)) * -180) / Math.PI;
      setAimDeg(Math.max(-55, Math.min(55, deg)));
    }
    if (stageElRef.current) {
      stageElRef.current.style.setProperty('--pull-scale', (1 - nextTension * 0.08).toFixed(3));
    }
    const now = performance.now();
    if (now - lastPullSfxAt.current > 110 && nextTension > 0.3) {
      lastPullSfxAt.current = now;
      playSummonSynth('pull', step.stage, nextTension);
    }
  };

  const releaseSlingshot = () => {
    if (!dragOrigin.current) return;
    const launchedHard = pullTension >= 0.28;
    dragOrigin.current = null;
    setPulled(false);
    setPullTension(0);
    setAimDeg(0);
    if (stageElRef.current) {
      stageElRef.current.style.setProperty('--pull-scale', '1');
    }
    if (launchedHard) {
      setStrikeShotFlash(true);
      setShockSeq(n => n + 1);
      if (act === 'duo') setAct('orb');
      playSummonSynth('step', step.stage, 1);
      setTimeout(() => setStrikeShotFlash(false), 520);
    }
  };

  const cutinMain = strikeShotFlash
    ? '⚡ STRIKE SHOT!! — 全力解放！！ ⚡'
    : tease
      ? '⚡ OVERCHARGE — 限界突破の予兆…！？ ⚡'
      : act === 'duo'
        ? '✦ STRIKE RESONANCE — 引いて・タップしてマナ解放！！ ✦'
        : spec.cutin;

  const cutinSub = strikeShotFlash
    ? 'MAX TENSION RELEASED'
    : tease
      ? 'LIMIT GAUGE PULSING'
      : act === 'duo'
        ? 'SLINGSHOT SUMMON SYSTEM'
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
      data-reversal={reversalStage || undefined}
      data-burst={burst || undefined}
      data-tease={tease || undefined}
      data-gacha-reveal
    >
      <div className="gacha-summon-cosmos" aria-hidden="true" />
      <div className="gacha-summon-pillar" aria-hidden="true" />
      <div className="gacha-summon-speedlines" aria-hidden="true" />
      <div className="gacha-reveal-rays" aria-hidden="true" />
      <SummonParticleCanvas
        act={act}
        stage={step.stage}
        shockSeq={shockSeq}
        burst={burst}
        tease={tease}
        pullTension={pullTension}
      />

      {/* 上空から中央ゲートへ降り注ぐ召喚流星の尾 */}
      <div className="gacha-summon-meteors" aria-hidden="true">
        {Array.from({ length: METEOR_COUNT }, (_, idx) => (
          <i key={idx} />
        ))}
      </div>

      <ArcaneSummonCircles />
      <DimensionalCracks />

      {/* SR / UR / LR 最終段突入の瞬間：プチュン暗転＆ネガ反転「確定逆転カットイン（REVERSAL AWAKENING）」 */}
      {reversalStage && (
        <div className="gacha-summon-reversal" key={`rev:${reversalStage}`} aria-hidden="true">
          <div className="gacha-summon-reversal-slash">
            <small>✦ REVERSAL AWAKENING ✦</small>
            <strong>{STAGE_SPEC[reversalStage].reversalTitle}</strong>
          </div>
        </div>
      )}

      {/* 昇格の瞬間に走るドッカン／モンスト流「暗転ヒットストップ＆特大確定文字スラッシュ」 */}
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

      <div className="gacha-summon-cutin" key={`cutin:${act}:${strikeShotFlash ? 'ss' : tease ? 'tease' : step.stage}`} aria-hidden="true">
        <div className="gacha-summon-cutin-inner">
          <small>{cutinSub}</small>
          <span>{cutinMain}</span>
        </div>
      </div>

      <div
        ref={stageElRef}
        className="gacha-summon-core-stage"
        onPointerDown={onStagePointerDown}
        onPointerMove={onStagePointerMove}
        onPointerUp={releaseSlingshot}
        onPointerCancel={releaseSlingshot}
        aria-hidden="true"
      >
        <StrikeSlingshotAim pulled={pulled} aimDeg={aimDeg} tension={pullTension} />
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
        {tease
          ? REVEAL_TEASE_CAPTION
          : pulled
            ? 'パワー充填中… 離してストライク解放！！'
            : act === 'duo'
              ? 'ストライク共鳴！ 星扉にマナが収束する…！'
              : step.caption}
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
