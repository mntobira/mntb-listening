import { useEffect, useRef } from 'react';
import { ArrowLeft, Coins, BookOpen, Swords, Award, Store, Target, Shirt, BarChart3, Gift, UserRound, Zap, Trophy } from 'lucide-react';
import { ManaRush } from './ManaRush';
import { GachaRoom } from './GachaRoom';
import { GrowthHomeStrip } from '../battle/ui/GrowthHomeStrip';
import { BattleProfile } from '../battle/ui/BattleProfile';
import { BattleMissions } from '../battle/ui/BattleMissions';
import { NextGoals } from '../battle/ui/GrowthParts';
import { loginBonusFor } from '../battle/core/growth';
import { useGrowthProgress } from '../hooks/useGrowthProgress';
import './growth-hub.css';

export type GrowthPage = 'overview' | 'gacha' | 'shop' | 'outfit' | 'badges' | 'stats' | 'missions' | 'rush';
export function GrowthHub({ page, onPage, onBack, onBattle, onReview, defaultSubject }: {
  page: GrowthPage; onPage: (page: GrowthPage) => void; onBack: () => void;
  onBattle?: () => void; onReview: () => void;
  /** マナラッシュの最初の科目（本体で選択中の科目） */
  defaultSubject?: string;
}) {
  const { progress, uid } = useGrowthProgress();
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => { scroll.current?.scrollTo(0, 0); }, [page]);
  if (page === 'rush') return <div ref={scroll} className="mana-hub h-full min-h-0 overflow-y-auto pb-app-nav" data-growth-hub>
    <ManaRush onBack={() => onPage('overview')} defaultSubject={defaultSubject} />
  </div>;
  return <div ref={scroll} className={`mana-hub h-full min-h-0 overflow-y-auto pb-app-nav ${page === 'gacha' ? 'mana-hub-gacha' : ''}`} data-growth-hub>
    <header className="mana-hub-header">
      <button type="button" onClick={onBack}><ArrowLeft size={18} /> ホーム</button>
      <span className="growth-shared-label">ガチャ・マイページ</span>
    </header>
    <nav className="growth-shared-switch" aria-label="ガチャとマイページの切り替え">
      <button type="button" onClick={() => onPage('gacha')} aria-current={page === 'gacha' ? 'page' : undefined}><Gift size={19} />ガチャ</button>
      <button type="button" onClick={() => onPage('overview')} aria-current={page !== 'gacha' ? 'page' : undefined}><UserRound size={19} />マイページ</button>
    </nav>
    {page === 'gacha' ? <GachaRoom embedded onBack={() => onPage('overview')} onMissions={() => onPage('missions')} /> : page === 'overview' ? <main className="mana-hub-main">
      <p className="mana-eyebrow">MY GROWTH & COLLECTION</p>
      <h1>学ぶ。ためる。自分らしく。</h1>
      <p className="mb-5 text-sm text-slate-600">対戦も、復習も、とびら君の成長につながる。</p>
      <button type="button" className="mana-rush-banner" onClick={() => onPage('rush')} data-rush-entry>
        <Zap aria-hidden="true" /><span><strong>マナラッシュ</strong><small>60秒チャレンジ・コンボで高得点をねらえ</small></span>
        {progress && progress.rushBest > 0 && <em><Trophy size={14} />{progress.rushBest.toLocaleString()}</em>}
      </button>
      <GrowthHomeStrip onGacha={() => onPage('gacha')} expanded onProfile={() => onPage('outfit')} onShop={() => onPage('shop')}
        onMissions={() => onPage('missions')} onBadges={() => onPage('badges')} onWallet={() => onPage('shop')} />
      <section className="mana-hub-card" aria-label="マナコインのため方">
        <h2><Coins size={20} /> マナコインのため方</h2>
        <p>毎日のボーナス・ミッション・演習・マナラッシュで獲得。復習だけでも報酬を目指せます。</p>
        <div className="mana-earn-actions">
          <button type="button" onClick={onReview}><BookOpen size={20} /><strong>復習でためる</strong><small>「できた」でミッションを進める</small></button>
          {onBattle && <button type="button" onClick={onBattle}><Swords size={20} /><strong>対戦でためる</strong><small>AIも対象／対戦終了時に獲得</small></button>}
          <button type="button" onClick={() => onPage('rush')}><Zap size={20} /><strong>マナラッシュでためる</strong><small>1日5回までコイン／XPは毎回</small></button>
        </div>
        <button type="button" className="mana-text-action" onClick={() => onPage('missions')}>達成したミッションの報酬を受け取る</button>
      </section>
      <section className="mana-hub-card" aria-label="連続ボーナス一覧">
        <h2>毎日会おう、7日間のボーナス</h2>
        <p>受け取りを7日連続で続けると、7日目は50マナコイン。8日目から次のサイクルです。</p>
        <div className="mana-week">{Array.from({ length: 7 }, (_, i) => <div key={i}><span>{i + 1}日目</span><Coins size={18} /><strong>{loginBonusFor(i + 1).coins}</strong></div>)}</div>
      </section>
      {progress && <section className="mana-hub-card"><h2><Award size={20} /> 次の目標</h2><NextGoals progress={progress} max={3} /><button type="button" className="mana-text-action" onClick={() => onPage('stats')}>教科別の対戦記録を見る</button></section>}
      <p className="mana-storage-info">マナコイン・XP・装備はこのブラウザのアカウントごとに保存され、ホームと対戦で共通です。端末間同期・他の人への公開はありません。サイトデータを削除すると消えます。課金・換金はできません。</p>
    </main> : <>
      <nav className="mana-hub-tabs" aria-label="マイページのメニュー">
        {([['shop', Store, 'ショップ'], ['outfit', Shirt, 'きせかえ'], ['badges', Award, '称号'], ['missions', Target, 'ミッション'], ['stats', BarChart3, '記録']] as const).map(([id, Icon, label]) =>
          <button type="button" key={id} onClick={() => onPage(id)} aria-current={page === id ? 'page' : undefined}><Icon size={17} />{label}</button>)}
      </nav>
      {page === 'missions' ? <BattleMissions key={uid} standalone onBack={() => onPage('overview')} onBattle={onBattle} onReview={onReview} onShop={() => onPage('shop')} onRush={() => onPage('rush')} />
        : <BattleProfile key={`${uid}:${page}`} standalone onMissions={() => onPage('missions')} initialTab={page} onBack={() => onPage('overview')} />}
    </>}
  </div>;
}
