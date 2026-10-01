import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { anchorOf } from '../battle/core/tobiraParts';
import { tobiraMood, type MoodInput } from '../data/tobiraMood';
import './tobira-buddy.css';

/**
 * とびら君（住人）— 2026-10-01
 *   状態に合わせた表情（ポーズ）＋しっぽ付きの吹き出し＋軽いアイドル動き（呼吸・まばたき・ときどき揺れる）。
 *   動きを減らす設定（prefers-reduced-motion）では止まる（CSS 側）。
 *
 * size:  sm=48px（帯の中） / md=88px（対戦ロビーなど） / lg=親いっぱい（ホームのステージ）
 * bubble: 吹き出しの位置（right=右横 / top=頭の上 / none=出さない）
 */
export function TobiraBuddy({ input, size = 'md', bubble = 'right', pose, className = '', line, children, figure = true }: {
  input: MoodInput;
  size?: 'sm' | 'md' | 'lg';
  bubble?: 'right' | 'top' | 'none';
  /** 着せ替えのポーズを優先したいとき（ホーム）。省略時は気分のポーズ */
  pose?: string;
  className?: string;
  /** 文言を差し替えたいとき */
  line?: string;
  children?: ReactNode;
  /** false なら吹き出しだけ（絵は別の場所に大きく出ているとき） */
  figure?: boolean;
}) {
  const m = useMemo(() => tobiraMood(input), [input.screen, input.streak, input.dueCount, input.solved, input.daysAway, input.firstVisit, input.outcome, input.margin, input.isGuest, input.seed]);
  const src = pose ?? m.pose;
  const a = anchorOf(src);
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => { t = setTimeout(() => { setBlink(true); setTimeout(() => setBlink(false), 140); loop(); }, 2600 + Math.random() * 2600); };
    loop();
    return () => clearTimeout(t);
  }, []);
  const eye: CSSProperties = { ['--ex' as string]: `${a.eyes[0] * 100}%`, ['--ey' as string]: `${a.eyes[1] * 100}%`, ['--ew' as string]: `${a.eyes[2] * 100}%`, ['--er' as string]: `${a.eyes[3]}deg`, aspectRatio: `${a.w} / ${a.h}` };
  return <div className={`tb tb-${size} ${className}`} data-mood={m.mood} data-tone={m.tone} data-bubble={bubble} data-tobira-buddy>
    {figure && <span className="tb-body" aria-hidden="true">
      <span className="tb-figure" style={eye} data-blink={blink || undefined}>
        <img src={src} alt="" draggable={false} decoding="async" />
        <i className="tb-lid" />
        {children}
      </span>
    </span>}
    {bubble !== 'none' && <p className="tb-bubble" role="status" aria-live="polite" key={line ?? m.line}><span>{line ?? m.line}</span></p>}
  </div>;
}
