import { useGrowthProgress } from '../../hooks/useGrowthProgress';
import { GrowthAvatar } from './GrowthParts';
import { Swords } from 'lucide-react';
import { CinematicClip, CINEMATIC_CLIPS } from '../../components/CinematicClip';

type FighterProps = {
  answered?: boolean; reveal?: boolean; correct?: boolean; opponentAnswered?: boolean;
  waiting?: boolean; offline?: boolean; matched?: boolean; opponentCorrect?: boolean;
  roundKey?: number; streak?: number;
};
export function ArenaFighters({answered=false,reveal=false,correct=false,opponentAnswered=false,waiting=false,offline=false,matched=false,opponentCorrect=false,roundKey=0,streak=0}: FighterProps) {
 const {progress}=useGrowthProgress();
 // Correctness is deliberately used only at reveal, never to leak an opponent answer.
 const combat = reveal ? correct ? (opponentCorrect?'clash':'strike') : (opponentCorrect?'hurt':'miss') : answered?'guard':'idle';
 return <div key={`${roundKey}:${reveal}`} data-combat={combat} data-combo={reveal&&correct&&streak>=3}
   className={`arena-fighters ${waiting?'is-searching':''} ${reveal?(correct?'is-hit':'is-miss'):''}`} aria-label="とびら君の対戦ステージ">
  <div className="combat-fx" aria-hidden="true"><i className="combat-slash mine-slash"/><i className="combat-slash opponent-slash"/><i className="combat-impact"/><i className="combat-dust"/></div>
  <div className={`arena-fighter mine ${answered?'is-ready':''}`}>{progress && <GrowthAvatar progress={progress} size={72}/>}<small>{matched?'準備OK':waiting?'あなたのとびら君':answered?'回答ロック':'考え中'}</small></div>
  <div className="arena-clash"><Swords/><strong>{reveal?(correct?(streak>=3?`${streak} COMBO`:'HIT!'):(opponentCorrect?'DAMAGE':'MISS')):'VS'}</strong></div>
  <div className={`arena-fighter opponent ${opponentAnswered?'is-ready':''}`}><img src="/mascots/thinking.webp" alt="対戦相手のイメージ"/><small>{offline?'通信待ち':matched?'準備OK':waiting?'対戦相手を探索中':opponentAnswered?'回答済み':'考え中'}</small></div>
  {reveal && correct && streak>=3 && <div className="combat-movie"><CinematicClip src={CINEMATIC_CLIPS.special.src} playbackRate={CINEMATIC_CLIPS.special.playbackRate} label="とびら君のコンボ攻撃動画" /></div>}
 </div>;
}
