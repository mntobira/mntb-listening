import { ArrowLeft, Coins, Gift, Trophy, FileText, Shirt, Store, Award, Target, BarChart3, Zap } from 'lucide-react';
import { GachaRoom } from './GachaRoom';
import { ManaRush } from './ManaRush';
import { MyCollection } from './MyCollection';
import { GrowthAvatar, LevelBar } from '../battle/ui/GrowthParts';
import { useGrowthProgress } from '../hooks/useGrowthProgress';
import { BattleMissions } from '../battle/ui/BattleMissions';
import { BattleProfile } from '../battle/ui/BattleProfile';
import './growth-hub.css';
export type GrowthPage = 'overview' | 'gacha' | 'shop' | 'outfit' | 'prints' | 'rewards' | 'badges' | 'stats' | 'missions' | 'rush';
export function GrowthHub({ page, onPage, onBack, onBattle, onReview, onRanking, defaultSubject }: {
  page: GrowthPage; onPage: (page: GrowthPage) => void; onBack: () => void;
  onBattle?: () => void; onReview: () => void; onRanking?: () => void; defaultSubject?: string;
}) {
  const { progress, uid } = useGrowthProgress();
  if (page === 'gacha') return <section className="mana-hub h-full min-h-0 overflow-y-auto pb-app-nav"><header className="mana-hub-header"><button onClick={onBack}><ArrowLeft size={18}/>ホーム</button><span>ガチャ</span></header><nav className="growth-shared-switch" aria-label="ガチャとランキング"><button aria-current="page"><Gift size={19}/>ガチャ</button><button onClick={onRanking}><Trophy size={19}/>ランキング</button></nav><GachaRoom embedded onBack={onBack} onMissions={()=>onPage('missions')}/></section>;
  return <section className="mana-hub mypage-hub" data-mypage>
    <header className="mana-hub-header"><button onClick={onBack}><ArrowLeft size={18}/>ホーム</button><h1>マイページ</h1></header>
    <nav className="mypage-tabs" aria-label="マイページメニュー">{([['overview','マイページ'],['outfit','持ちもの'],['prints','マイPDF'],['shop','ショップ'],['rewards','プレゼント']] as const).map(([id,label]) => <button type="button" key={id} aria-current={page === id ? 'page' : undefined} onClick={()=>onPage(id)}>{label}</button>)}</nav>
    <div className="mypage-body">
    {page === 'overview' ? <main className="mypage-overview">
      <section className="mypage-hero">{progress && <GrowthAvatar progress={progress} size={86}/>}<div><h2>あなたのコレクション</h2><p><Coins size={18}/><strong>{progress?.coins.toLocaleString() ?? '—'}</strong> マナコイン</p>{progress && <LevelBar xp={progress.xp}/>}</div></section>
      <div className="mypage-menu">{([['outfit',Shirt,'もっているもの','装備・壁紙をまとめて確認'],['prints',FileText,'マイPDF','獲得したプリントを開く・保存'],['shop',Store,'買えるもの','未所持と所持済みを分けて表示'],['rewards',Gift,'プレゼント','隔週リーグのUR報酬'],['missions',Target,'ミッション','達成報酬を受け取る'],['rush',Zap,'マナラッシュ','60秒チャレンジ'],['badges',Award,'称号','獲得バッジ'],['stats',BarChart3,'記録','教科ごとの戦績']] as const).map(([id,Icon,label,sub]) => <button type="button" key={id} onClick={()=>onPage(id)}><Icon size={22}/><span><strong>{label}</strong><small>{sub}</small></span></button>)}</div>
      <p className="collection-storage">ゲットした装備・PDFはここに集約。マナコインは課金・換金できません。</p>
    </main> : page === 'outfit' || page === 'prints' || page === 'shop' || page === 'rewards' ? <MyCollection key={`${uid}:${page}`} view={page === 'outfit' ? 'owned' : page}/>
    : page === 'rush' ? <div className="mypage-extra-scroll"><ManaRush onBack={()=>onPage('overview')} defaultSubject={defaultSubject}/></div>
    : page === 'missions' ? <div className="mypage-extra-scroll"><BattleMissions key={uid} standalone onBack={()=>onPage('overview')} onBattle={onBattle} onReview={onReview} onShop={()=>onPage('shop')} onRush={()=>onPage('rush')}/></div>
    : <div className="mypage-extra-scroll"><BattleProfile key={`${uid}:${page}`} standalone initialTab={page} onBack={()=>onPage('overview')}/></div>}
    </div>
  </section>;
}
