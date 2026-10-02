import { Leaderboard } from '../../components/Leaderboard';
/** Every ranking entrance now uses the same authoritative battle-rating view. */
export function BattleRanking({ onBack }: { onBack: () => void }) { return <Leaderboard onBack={onBack}/>; }
