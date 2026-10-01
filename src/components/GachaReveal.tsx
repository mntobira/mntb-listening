import { useEffect, useRef, useState } from 'react';
import { CinematicClip, CINEMATIC_CLIPS } from './CinematicClip';
import type { GachaRarity } from '../battle/core/growth';
import { play } from '../battle/ui/feedback';
import { REVEAL_BURST_MS, burstSfx, revealSteps } from './gachaRevealSteps';

/**
 * ガチャの確定演出。光が 青→金→虹→大当たり と上がっていき、引いたレア度で止まって弾ける。
 * 動きを減らす設定のときは段取りを飛ばし、最後の色だけ一瞬見せて結果へ。
 */
export function GachaReveal({ rarity, onDone }: { rarity: GachaRarity; onDone: () => void; key?: number }) {
  const steps = revealSteps(rarity);
  const [index, setIndex] = useState(0);
  const [burst, setBurst] = useState(false);
  const doneRef = useRef(onDone); doneRef.current = onDone;
  const finished = useRef(false);
  const finish = () => { if (finished.current) return; finished.current = true; doneRef.current(); };

  useEffect(() => {
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (reduce) {
      setIndex(steps.length - 1);
      play(burstSfx(rarity), false);
      timers.push(setTimeout(finish, 600));
      return () => timers.forEach(clearTimeout);
    }
    let at = 0;
    steps.forEach((s, i) => {
      timers.push(setTimeout(() => { setIndex(i); if (i > 0) play(s.sfx, s.vibrate); }, at));
      at += s.ms;
    });
    timers.push(setTimeout(() => { setBurst(true); play(burstSfx(rarity), true); }, at));
    timers.push(setTimeout(finish, at + REVEAL_BURST_MS));
    return () => timers.forEach(clearTimeout);
    // 1回の抽選につき1度だけ流す
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = steps[index];
  const skip = () => { setBurst(true); play(burstSfx(rarity), false); setTimeout(finish, 180); };

  return <div className="gacha-cinema gacha-reveal" data-stage={step.stage} data-burst={burst || undefined} data-gacha-reveal>
    <div className="gacha-reveal-rays" aria-hidden="true" />
    <div className="gacha-reveal-orb" aria-hidden="true"><CinematicClip src={CINEMATIC_CLIPS.gacha.src} label="ガチャの開封動画" /></div>
    <div className="gacha-reveal-sparks" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ ['--i' as string]: i }} />)}</div>
    <p className="gacha-reveal-caption" role="status" aria-live="assertive" key={step.stage}>{step.caption}</p>
    <ol className="gacha-reveal-meter" aria-hidden="true">{steps.map((s, i) => <li key={s.stage} data-stage={s.stage} data-on={i <= index || undefined} />)}</ol>
    <div className="gacha-reveal-flash" aria-hidden="true" />
    <button type="button" onClick={skip}>結果を見る</button>
  </div>;
}

/** 結果画面の星（レア度ぶん順番に光る） */
export function RarityStars({ count }: { count: number }) {
  return <span className="gacha-stars" aria-label={`星${count}`}>{Array.from({ length: count }, (_, i) => <i key={i} style={{ animationDelay: `${0.15 + i * 0.12}s` }}>★</i>)}</span>;
}
