import { useState } from 'react';
import { Coins, ChevronRight, Shirt, Award, Store, Sparkles } from 'lucide-react';
import { StudyRecord, type StudyRetry } from './StudyRecord';
import { LevelRewards } from './LevelRewards';
import { equippedTitleLabel, type MissionDestination } from '../battle/core/growth';
import { GachaRoom } from './GachaRoom';
import { ManaRush } from './ManaRush';
import { MyCollection } from './MyCollection';
import { GrowthAvatar, LevelBar } from '../battle/ui/GrowthParts';
import { useGrowthProgress } from '../hooks/useGrowthProgress';
import { BattleMissions } from '../battle/ui/BattleMissions';
import { BattleProfile } from '../battle/ui/BattleProfile';
import './growth-hub.css';
import { KineticText } from '../motion';
export type GrowthPage = 'overview' | 'gacha' | 'gacha-shop' | 'outfit' | 'prints' | 'rewards' | 'badges' | 'stats' | 'missions' | 'rush';
export function GrowthHub({ page, onPage, onBack, onBattle, onReview, onRanking, defaultSubject, onStudy, onFoundation, onRetry }: {
  page: GrowthPage; onPage: (page: GrowthPage) => void; onBack: () => void;
  /** ミッションの行き先：演習する（教科選び）／英単語の4択・単語帳 */
  onStudy?: () => void; onFoundation?: (tab: 'words' | 'quiz') => void;
  onBattle?: () => void; onReview: () => void; onRanking?: () => void; defaultSubject?: string;
  /** 学習記録から、その大問を解きなおす（間違えた小問だけにも絞れる） */
  onRetry?: (t: StudyRetry) => void;
}) {
  const { progress, uid } = useGrowthProgress();
  const [outfitKind, setOutfitKind] = useState('all');
  const activePage = page;
  // ★ミッションの「○○へ」★ マイページの中で済むものはここで、ほかの画面は App に任せる
  const goMission = (to: MissionDestination) => {
    if (to === 'rush') onPage('rush');
    else if (to === 'gacha') onPage('gacha');
    else if (to === 'outfit') { setOutfitKind('all'); onPage('outfit'); }
    else if (to === 'review') onReview();
    else if (to === 'study') (onStudy ?? onBack)();
    else if (to === 'vocab_quiz') onFoundation ? onFoundation('quiz') : onBack();
    else if (to === 'wordbook') onFoundation ? onFoundation('words') : onBack();
    else (onBattle ?? onBack)();
  };
  const openTab = (id: GrowthPage) => { if (id === 'outfit') setOutfitKind('all'); onPage(id); };
  // ★マナラッシュはマイページの中ではなく、それだけの画面にする（2026-10-04 ご要望）★
  if (activePage === 'rush') return <section className="mana-hub mana-hub-rush" data-rush-page><div className="mypage-extra-scroll"><ManaRush onBack={onBack} defaultSubject={defaultSubject}/></div></section>;
  // ★ガチャ・マイページは下のナビから入るので「← ホーム」は置かない（2026-10-05）★
  if (activePage === 'gacha' || activePage === 'gacha-shop') return <section className={`mana-hub mana-hub-gacha compact-gacha ${activePage === 'gacha-shop' ? 'gacha-shop-page' : ''}`} data-gacha-page={activePage}>
    <nav className="gacha-page-switch" aria-label="ガチャ内メニュー">
      <button type="button" onClick={() => onPage('gacha')} aria-current={activePage === 'gacha' ? 'page' : undefined}><Sparkles size={18} />装飾ガチャ</button>
      <button type="button" onClick={() => onPage('gacha-shop')} aria-current={activePage === 'gacha-shop' ? 'page' : undefined}><Store size={18} />ショップ</button>
    </nav>
    {activePage === 'gacha' ? <GachaRoom embedded onBack={onBack} onMissions={()=>onPage('missions')}/> : <MyCollection key={`${uid}:gacha-shop`} view="shop" gachaMode onGacha={() => onPage('gacha')} />}
  </section>;
  return <section className="mana-hub mypage-hub" data-mypage>
    <header className="mana-hub-header"><h1><KineticText text="マイページ" /></h1></header>
    {/* ショップはガチャ欄から入る独立画面。マイページには置かない。 */}
    <nav className="mypage-tabs" aria-label="マイページメニュー">{([['overview','マイページ'],['outfit','きせかえ'],['badges','称号'],['prints','マイPDF']] as const).map(([id,label]) => <button type="button" key={id} aria-current={activePage === id ? 'page' : undefined} onClick={()=>openTab(id)}>{label}</button>)}</nav>
    <div className="mypage-body">
    {page === 'overview' ? <main className="mypage-overview" data-mypage-overview>
      <section className="mypage-stage" aria-label="いまのとびら君">
        <p className="mypage-stage-title">{(progress && equippedTitleLabel(progress)) || 'とびら君'}</p>
        <div className="mypage-stage-avatar">{progress && <GrowthAvatar progress={progress} size={132}/>}</div>
        <div className="mypage-stage-meta"><span><Coins size={16}/><strong>{progress?.coins.toLocaleString() ?? '—'}</strong>マナコイン</span>{progress && <LevelBar xp={progress.xp} compact/>}</div>
      </section>
      {/* ★ホームのサイドボタン（きせかえ・称号）をマイページへ統合★ */}
      <nav className="mypage-entries" aria-label="とびら君のメニュー">
        <button type="button" data-mypage-entry="outfit" onClick={()=>openTab('outfit')}><Shirt size={24} aria-hidden="true"/><strong>きせかえ</strong><ChevronRight size={18} aria-hidden="true"/></button>
        <button type="button" data-mypage-entry="badges" onClick={()=>openTab('badges')}><Award size={24} aria-hidden="true"/><strong>称号</strong><ChevronRight size={18} aria-hidden="true"/></button>
      </nav>
      {/* 「レベルで手に入るもの」はミッションの中へ移した（マイページをスクロールなしで1画面に収める・2026-10-05） */}
    </main> : activePage === 'outfit' || activePage === 'prints' || activePage === 'rewards' ? <MyCollection key={`${uid}:${activePage}:${outfitKind}`} view={activePage === 'outfit' || activePage === 'rewards' ? 'owned' : activePage} initialKind={activePage === 'outfit' ? outfitKind : 'all'} onGacha={()=>onPage('gacha')}/>
    : activePage === 'stats' ? <div className="mypage-extra-scroll"><StudyRecord embedded onReview={onReview} onRetry={onRetry}/></div>
    : activePage === 'missions' ? <div className="mypage-extra-scroll"><BattleMissions key={uid} standalone onBack={()=>onPage('overview')} onBattle={onBattle} onReview={onReview} onShop={()=>onPage('gacha-shop')} onRush={()=>onPage('rush')} extra={progress ? <LevelRewards progress={progress} /> : null} onGo={goMission}/></div>
    : <div className="mypage-extra-scroll"><BattleProfile key={`${uid}:${activePage}`} standalone initialTab={activePage as 'outfit' | 'badges' | 'stats'} onBack={()=>onPage('overview')}/></div>}
    </div>
  </section>;
}
