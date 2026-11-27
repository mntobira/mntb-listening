import { useEffect, useRef, useState, type ReactNode } from 'react';
import { safeGetItem, safeLocalStorage } from '../utils/safeLocalStorage';
import './tobira-motion.css';

/**
 * とびら君の「背景なし」モーション（2026-10-23）
 * ------------------------------------------------------------------
 * 生成AIで作った緑背景の動画を scripts/tobira-motion/import.sh で透過にし、
 * public/tobira-motion/<名前>.webm（Chrome・Android）／.webp（Safari・iOS）／.png（1コマ目）に置く。
 *
 * ★まだ動画ファイルが無いうちは何も変わらない★
 *   TOBIRA_MOTIONS の ready が false のあいだは children（今までの静止画）をそのまま出す。
 *   動画を取り込んだら ready を true にする（tests/tobiraMotion.test.ts がファイルの有無・大きさを確かめる）。
 *
 * 再生の決まり（CinematicClip と同じ考え方）
 *   ・動きを減らす設定・データセーバー・低スペック（html[data-perf=lite]）では再生しない＝静止画のまま
 *   ・1回だけ再生して静止画に戻る（loop の指定があるものだけくり返す）
 *   ・読み込めない／再生できないときは黙って静止画に戻る（画面は止めない）
 *   ・音は入れない
 */
export type TobiraMotionName = 'walk' | 'greet' | 'cheer' | 'encourage' | 'wakeup' | 'think';

export interface TobiraMotionDef {
  /** 長さ（ミリ秒）。WebP（Safari）はこの時間で静止画に戻す */
  ms: number;
  /** 取り込み済みか（public/tobira-motion に3ファイルある） */
  ready: boolean;
  /** くり返すか（考え中など、待っている間だけ動かすもの） */
  loop?: boolean;
  /** 何の動きか（台帳 docs/TOBIRA_MOTION.md と同じ文） */
  note: string;
}

export const TOBIRA_MOTIONS: Record<TobiraMotionName, TobiraMotionDef> = {
  walk: { ms: 1833, ready: true, loop: true, note: 'ホーム：ステージの上で元気に足踏み・おさんぽ（くり返し）' },
  greet: { ms: 3000, ready: false, note: 'ホーム：その日はじめて開いたとき、手をふってあいさつ' },
  wakeup: { ms: 3500, ready: false, note: 'ホーム：3日以上あいて開いたとき、目をこすって起きて手をふる' },
  cheer: { ms: 2500, ready: false, note: 'ミッション達成・単語/英文の高得点：ジャンプしてバンザイ' },
  encourage: { ms: 3000, ready: false, note: '対戦の負け・惜敗：少ししょんぼり→深呼吸→ガッツポーズでうなずく' },
  think: { ms: 2400, ready: false, loop: true, note: '待ち時間（対戦相手さがし）：あごに手を当てて考える（くり返し）' },
};

/** その日まだ再生していなければ true を返し、再生済みとして記録する（ホームのあいさつを1日1回にする） */
export function claimDailyMotion(key: string, today = new Date().toISOString().slice(0, 10)): boolean {
  const k = `tobira_motion_day_${key}`;
  if (safeGetItem(k) === today) return false;
  try { safeLocalStorage()?.setItem(k, today); } catch { return false; }
  return true;
}

export const motionSrc = (name: TobiraMotionName, ext: 'webm' | 'webp' | 'png') => `/tobira-motion/${name}.${ext}`;

/** 透過 WebM を正しく出せない環境（Safari / iOS の WebView）か */
function prefersWebp(): boolean {
  if (typeof navigator === 'undefined') return true;
  const apple = /Apple/.test(navigator.vendor || '') || /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (apple) return true;
  try { return !document.createElement('video').canPlayType('video/webm; codecs="vp9"'); } catch { return true; }
}

/** いま動かしてよいか（動きを減らす・データセーバー・低スペック・裏に回っている は不可） */
export function motionAllowed(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return false;
  if (document.documentElement.dataset.perf === 'lite') return false;
  return !document.hidden;
}

export function TobiraMotion({ name, play = true, children, className = '', label, onDone }: {
  name: TobiraMotionName;
  /** false なら再生しない（条件を満たしたときだけ true にする） */
  play?: boolean;
  /** 動画がないとき・終わったあとに出す静止画（今までのとびら君） */
  children: ReactNode;
  className?: string;
  label?: string;
  onDone?: () => void;
}) {
  const def = TOBIRA_MOTIONS[name];
  const [active, setActive] = useState(false);
  const [webp] = useState(prefersWebp);
  const doneRef = useRef(onDone); doneRef.current = onDone;

  useEffect(() => {
    if (!def.ready || !play || !motionAllowed()) {
      setActive(false);
      return;
    }
    setActive(true);
    const stop = () => { setActive(false); doneRef.current?.(); };
    // 安全装置：長さ＋1秒で必ず静止画に戻す（くり返しのものは止めない）
    const t = def.loop ? undefined : setTimeout(stop, def.ms + 1000);
    const onVisibility = () => {
      if (document.hidden) {
        if (def.loop) setActive(false);
        else stop();
      } else if (def.loop && motionAllowed()) {
        setActive(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { if (t) clearTimeout(t); document.removeEventListener('visibilitychange', onVisibility); };
  }, [def.ready, def.ms, def.loop, play]);

  const finish = () => { setActive(false); doneRef.current?.(); };
  // WebP は終わりのイベントが無いので、長さで止める
  useEffect(() => {
    if (!active || !webp || def.loop) return;
    const t = setTimeout(() => { setActive(false); doneRef.current?.(); }, def.ms);
    return () => clearTimeout(t);
  }, [active, webp, def.ms, def.loop]);

  if (!active) return <>{children}</>;
  return (
    <span className={`tobira-motion ${className}`} data-tobira-motion={name} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {webp
        ? <img src={motionSrc(name, 'webp')} alt="" draggable={false} decoding="async" onError={finish} />
        : <video src={motionSrc(name, 'webm')} poster={motionSrc(name, 'png')} autoPlay muted playsInline loop={def.loop}
            disablePictureInPicture onEnded={finish} onError={finish} />}
    </span>
  );
}
