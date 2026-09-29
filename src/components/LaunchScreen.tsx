import { useEffect, useState } from 'react';
import { CinematicClip, CINEMATIC_CLIPS } from './CinematicClip';
import { ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { useGrowthProgress } from '../hooks/useGrowthProgress';
import { equippedPoseSrc, equippedFrameColor, equippedFramePattern } from '../battle/core/growth';
import { TobiraAccessories } from '../battle/ui/TobiraAccessories';

/**
 * タイトル画面。保存された画面やアカウントには一切触れない（見た目だけ）。
 *
 * 登場の流れ（動画は2秒しかないので、つなぎ目を作らない）:
 *   intro     … 動画の1コマ目（poster）→ 2秒の登場動画
 *   crossfade … 動画の最後のコマを残したまま、同じ位置・同じ大きさの静止画シーンを重ねてフェード
 *   done      … 動画を外し、静止画シーン（装備したポーズ・枠・アクセサリ）だけが残る
 * 動画が使えない時（動きを減らす設定・データセーバー・読み込み失敗）は、歩いて登場する演出にする。
 *
 * 静止画シーンの配置（.launch-box 内の %）は、動画 title.mp4 の最後のコマ（720×720）を実測した値。
 *   とびら君: x 149〜569 / y 124〜576、床の楕円: x 97〜621 / y 550〜637、弧: 中心(360,315) 半径232
 */
type Phase = 'intro' | 'crossfade' | 'done';

export function LaunchScreen({ onStart, soundEnabled, onToggleSound }: {
  onStart: () => void; soundEnabled: boolean; onToggleSound: () => void;
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
    <div className="launch-paper-lines" aria-hidden="true" />
    <div className="launch-content">
      <button type="button" className="launch-sound" aria-label={soundEnabled ? 'BGMをオフにする' : 'BGMをオンにする'} aria-pressed={soundEnabled} onClick={onToggleSound}>
        {soundEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}<span>BGM {soundEnabled ? 'ON' : 'OFF'}</span>
      </button>
      <div className="launch-brand"><p>マナトビ リスニング</p><h1><img src="/manatobi-logo.jpg" width={1024} height={367} alt="マナトビ" fetchPriority="high" /></h1></div>
      <div className="launch-stage" data-phase={phase} aria-label="とびら君の登場演出">
        <div className="launch-box">
          <div className="launch-scene" aria-hidden="true">
            <div className="launch-arch" />
            <div className="launch-stage-floor" data-frame-pattern={progress ? equippedFramePattern(progress) : 'plain'} style={{ borderColor: progress ? equippedFrameColor(progress) : undefined }} />
            <i /><i />
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
      <p className="launch-caption">聞く力を、対戦する力に。<br />演習・復習・オンライン対戦</p>
      <button type="button" className="launch-start" onClick={onStart}>はじめる<ArrowRight size={21} /></button>
      <p className="launch-note">タップして学習のつづきへ</p>
    </div>
  </main>;
}
