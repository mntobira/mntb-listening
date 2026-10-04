import { useState } from 'react';
import { Coins, ChevronRight } from 'lucide-react';
import { StudyRecord } from './StudyRecord';
import { LevelRewards } from './LevelRewards';
import { itemById, equippedTitleLabel } from '../battle/core/growth';
import { GachaRoom } from './GachaRoom';
import { ManaRush } from './ManaRush';
import { MyCollection } from './MyCollection';
import { GrowthAvatar, LevelBar } from '../battle/ui/GrowthParts';
import { useGrowthProgress } from '../hooks/useGrowthProgress';
import { BattleMissions } from '../battle/ui/BattleMissions';
import { BattleProfile } from '../battle/ui/BattleProfile';
import './growth-hub.css';
const PARTS = [['pose','ポーズ'],['frame','フレーム'],['hat','帽子'],['glasses','メガネ'],['cheek','ほっぺ'],['aura','オーラ'],['wallpaper','壁紙']] as const;
export type GrowthPage = 'overview' | 'gacha' | 'shop' | 'outfit' | 'prints' | 'rewards' | 'badges' | 'stats' | 'missions' | 'rush';
export function GrowthHub({ page, onPage, onBack, onBattle, onReview, onRanking, defaultSubject }: {
  page: GrowthPage; onPage: (page: GrowthPage) => void; onBack: () => void;
  onBattle?: () => void; onReview: () => void; onRanking?: () => void; defaultSubject?: string;
}) {
  const { progress, uid } = useGrowthProgress();
  const [outfitKind, setOutfitKind] = useState('all');
  const openPart = (kind: string) => { setOutfitKind(kind); onPage('outfit'); };
  const openTab = (id: GrowthPage) => { if (id === 'outfit') setOutfitKind('all'); onPage(id); };
  // ★マナラッシュはマイページの中ではなく、それだけの画面にする（2026-10-04 ご要望）★
  if (page === 'rush') return <section className="mana-hub mana-hub-rush" data-rush-page><div className="mypage-extra-scroll"><ManaRush onBack={onBack} defaultSubject={defaultSubject}/></div></section>;
  // ★ガチャ・マイページは下のナビから入るので「← ホーム」は置かない（2026-10-05）★
  if (page === 'gacha') return <section className="mana-hub mana-hub-gacha compact-gacha"><GachaRoom embedded onBack={onBack} onMissions={()=>onPage('missions')}/></section>;
  return <section className="mana-hub mypage-hub" data-mypage>
    <header className="mana-hub-header"><h1>マイページ</h1></header>
    {/* ショップはホームのボタンから入れるので、ここは学習記録（2026-10-05）。ミッション・学習記録の下ボタンは廃止 */}
    <nav className="mypage-tabs" aria-label="マイページメニュー">{([['overview','マイページ'],['outfit','持ちもの'],['badges','称号'],['prints','マイPDF'],['stats','学習記録']] as const).map(([id,label]) => <button type="button" key={id} aria-current={page === id ? 'page' : undefined} onClick={()=>openTab(id)}>{label}</button>)}</nav>
    <div className="mypage-body">
    {page === 'overview' ? <main className="mypage-overview" data-mypage-overview>
      <section className="mypage-stage" aria-label="いまのとびら君">
        <p className="mypage-stage-title">{(progress && equippedTitleLabel(progress)) || 'とびら君'}</p>
        <div className="mypage-stage-avatar">{progress && <GrowthAvatar progress={progress} size={132}/>}</div>
        <div className="mypage-stage-meta"><span><Coins size={16}/><strong>{progress?.coins.toLocaleString() ?? '—'}</strong>マナコイン</span>{progress && <LevelBar xp={progress.xp} compact/>}</div>
      </section>
      <section className="mypage-parts" aria-label="部位ごとに着がえる">
        <h2>部位ごとに着がえる</h2>
        <ul>{PARTS.map(([kind,label]) => { const id = progress?.equipped[kind as keyof typeof progress.equipped] || ''; const cur = id ? itemById(id)?.label : ''; return <li key={kind}><button type="button" data-part={kind} onClick={()=>openPart(kind)}><span className="mypage-part-label">{label}</span><span className="mypage-part-cur">{cur || 'なし'}</span><ChevronRight size={15} aria-hidden/></button></li>; })}</ul>
      </section>
      {/* 「レベルで手に入るもの」はミッションの中へ移した（マイページをスクロールなしで1画面に収める・2026-10-05） */}
    </main> : page === 'outfit' || page === 'prints' || page === 'shop' || page === 'rewards' ? <MyCollection key={`${uid}:${page}:${outfitKind}`} view={page === 'outfit' || page === 'rewards' ? 'owned' : page} initialKind={page === 'outfit' ? outfitKind : 'all'} onGacha={()=>onPage('gacha')}/>
    : page === 'stats' ? <div className="mypage-extra-scroll"><StudyRecord embedded onBack={()=>onPage('overview')} onReview={onReview}/></div>
    : page === 'missions' ? <div className="mypage-extra-scroll"><BattleMissions key={uid} standalone onBack={()=>onPage('overview')} onBattle={onBattle} onReview={onReview} onShop={()=>onPage('shop')} onRush={()=>onPage('rush')} extra={progress ? <LevelRewards progress={progress} /> : null}/></div>
    : <div className="mypage-extra-scroll"><BattleProfile key={`${uid}:${page}`} standalone initialTab={page} onBack={()=>onPage('overview')}/></div>}
    </div>
  </section>;
}
