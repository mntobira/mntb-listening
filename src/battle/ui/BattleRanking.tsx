import { Leaderboard } from '../../components/Leaderboard';
/** Every ranking entrance now uses the same authoritative battle-rating view. */
export function BattleRanking({ onBack, initialTab, onRequireLogin }: { onBack: () => void; initialTab?: 'national' | 'friend' | 'clan'; onRequireLogin?: () => void }) {
  return <Leaderboard onBack={onBack} initialTab={initialTab} onRequireLogin={onRequireLogin}/>;
}
