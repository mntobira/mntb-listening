import { useEffect, useState } from 'react';
import { CinematicClip, CINEMATIC_CLIPS } from './CinematicClip';
import { ArrowRight, Headphones, PenLine, Repeat2, Swords, Volume2, VolumeX } from 'lucide-react';
import { useGrowthProgress } from '../hooks/useGrowthProgress';
import { equippedPoseSrc } from '../battle/core/growth';
import { TobiraAccessories } from '../battle/ui/TobiraAccessories';
import './launch-screen.css';

/**
 * タイトル画面（2026-09-30 作り直し）。保存された画面やアカウントには一切触れない（見た目だけ）。
 *
 * 1画面（スクロールなし）に ロゴ → とびら君 → 主コピー → 3つのチップ → はじめる を収める。
 *  - ロゴは背景を透過した /brand/manatobi-logo.webp（白い四角を残さない）。
 *  - とびら君は全身を見せ、足元に楕円の接地影を置く。背後は「閉じた円」の光背にする（途中で切れた弧にしない）。
 *  - 意味のない飾り（◆・罫線）は置かない。
 *  - 主CTA「はじめる」はオレンジの塗り＋濃紺の文字。副CTA「ゲストで試す」は文字リンク（未登録の人にだけ出す）。
 *
 * 登場の流れ（動画は2秒しかないので、つなぎ目を作らない）:
 *   intro     … 動画の1コマ目（poster）→ 2秒の登場動画
 *   crossfade … 動画の最後のコマを残したまま、同じ位置・同じ大きさの静止画シーンを重ねてフェード
 *   done      … 動画を外し、静止画シーン（装備したポーズ・アクセサリ）だけが残る
 * 動画が使えない時（動きを減らす設定・データセーバー・読み込み失敗）は、歩いて登場する演出にする。
 *
 * 静止画シーンの配置（.launch-box 内の %）は、動画 title.mp4 の最後のコマ（720×720）を実測した値。
 *   とびら君: x 149〜569 / y 124〜576、床の楕円: x 97〜621 / y 550〜637
 */
type Phase = 'intro' | 'crossfade' | 'done';

export function LaunchScreen({ onStart, onGuest, soundEnabled, onToggleSound }: {
  onStart: () => void;
  /** 未登録（ゲストでもログイン済みでもない）の人にだけ渡す。ログイン画面を飛ばしてゲストで入る */
  onGuest?: () => void;
  soundEnabled: boolean; onToggleSound: () => void;
}) {
  const { progress } = useGrowthProgress();
  const [phase, setPhase] = useState<Phase>('intro');
  const [played, setPlayed] = useState(false);
  const [walkReady, setWalkReady] = useState(false);
  useEffect(() => {
    if (phase !== 'crossfade') return;
    const t = setTimeout(() => setPhase('done'), 380);
    return () => clearTimeout(t);
  }, [phase]);
  const finishIntro = () => setPhase(p => (p === 'intro' ? (played ? 'crossfade' : 'done') : p));
  // 動画を再生できなかった時だけ歩いて登場
  const walk = phase === 'done' && !played;
  return <main className="launch-screen" aria-label="マナトビ タイトル画面" data-launch-screen>
    <div className="launch-content">
      <header className="launch-top">
        <span className="launch-product">マナトビ<b>LISTENING</b></span>
        <button type="button" className="launch-sound" aria-label={soundEnabled ? 'BGMをオフにする' : 'BGMをオンにする'} aria-pressed={soundEnabled} onClick={onToggleSound}>
          {soundEnabled ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}<span>BGM {soundEnabled ? 'ON' : 'OFF'}</span>
        </button>
      </header>
      <h1 className="launch-brand"><img src="/brand/manatobi-logo.webp" width={1008} height={321} alt="マナトビ" fetchPriority="high" /></h1>
      <div className="launch-stage" data-phase={phase} aria-label="とびら君の登場演出">
        <div className="launch-box">
          <div className="launch-scene" aria-hidden="true">
            <div className="launch-halo" />
            <div className="launch-ground" />
            <div className={`launch-arrival ${walk && walkReady ? 'walk-ready' : ''} ${!walk ? 'is-idle' : ''}`}>
              <div className="launch-gait">
                <img className="launch-walking-pose" src="/mascots/walking.webp" alt="" draggable={false} onLoad={() => setWalkReady(true)} />
                <img className="launch-equipped-pose" src={progress ? equippedPoseSrc(progress) : '/mascots/basic.webp'} alt="" draggable={false} />
                {progress && <TobiraAccessories progress={progress} />}
              </div>
            </div>
          </div>
          {phase !== 'done' && <CinematicClip src={CINEMATIC_CLIPS.title.src} poster={CINEMATIC_CLIPS.title.poster} hold eager label="とびら君の登場動画"
            onActiveChange={active => { if (active) setPlayed(true); }} onComplete={finishIntro} />}
        </div>
      </div>
      <p className="launch-copy">聞く力を、<br className="launch-copy-break" />対戦する力に。</p>
      <ul className="launch-chips" aria-label="できること">
        <li><PenLine size={16} aria-hidden="true" />演習</li>
        <li><Repeat2 size={16} aria-hidden="true" />復習</li>
        <li><Swords size={16} aria-hidden="true" />オンライン対戦</li>
      </ul>
      <div className="launch-actions">
        <button type="button" className="launch-start mt-btn mt-btn-accent" onClick={onStart}><Headphones size={20} aria-hidden="true" />はじめる<ArrowRight size={20} aria-hidden="true" /></button>
        {onGuest
          ? <button type="button" className="launch-guest mt-btn mt-btn-text" onClick={onGuest}>登録せずにゲストで試す</button>
          : <p className="launch-note">学習のつづきから始まります</p>}
      </div>
    </div>
  </main>;
}
