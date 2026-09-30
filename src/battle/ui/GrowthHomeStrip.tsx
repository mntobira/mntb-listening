import { useEffect, useState } from 'react';
import { touchLogin } from '../data/growthStore';
import { applyLoginWithBonus, localDateKey, allMissionsForDate, canClaimMission, equippedTitleLabel, type LoginBonus } from '../core/growth';
import { GrowthAvatar, LevelBar } from './GrowthParts';
import { LoginBonusSheet } from './GrowthFx';
import { useGrowthProgress } from '../../hooks/useGrowthProgress';
import { Coins, Gift, Shirt, Award, Target, Store, ChevronRight, Flame } from 'lucide-react';

/** Compact, optional entry: never place an automatic reward overlay in front of matchmaking. */
export function GrowthHomeStrip({ onProfile, onMissions, onShop, onBadges, onWallet, onGacha, expanded = false, homeLayout = false }: { onProfile: () => void; onMissions: () => void; onShop?: () => void; onBadges?: () => void; onWallet?: () => void; onGacha?: () => void; expanded?: boolean; homeLayout?: boolean }) {
  const { progress, uid } = useGrowthProgress();
  const [bonus, setBonus] = useState<LoginBonus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [today, setToday] = useState(localDateKey);
  useEffect(() => {
    const timer = setInterval(() => setToday(localDateKey()), 30_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => { setBonus(null); setError(''); }, [uid]);
  if (!progress) return <section className="mana-dashboard" role="alert">成長記録を読み込めません。ブラウザの保存設定・空き容量を確認してください。既存の記録は上書きしません。</section>;
  const claim = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const r = await touchLogin();
      if (!r) setError('端末に保存できません。保存設定・空き容量を確認してください。');
      else setBonus(r.bonus);
    } finally { setBusy(false); }
  };
  const received = progress.lastLoginDate >= today;
  const nextBonus = applyLoginWithBonus(progress, today).bonus;
  const claimable = allMissionsForDate(today).filter(m => canClaimMission(progress, m.id, today)).length;
  if (homeLayout) return <section className="mana-dashboard game-home-hud" aria-label="マナコインととびら君の成長" data-mana-dashboard>
    <div className="game-hud-top">
      <button type="button" className="game-hud-wallet" onClick={onWallet || onShop || onProfile} aria-label="マナコインの使い道を開く" data-mana-coins><Coins /><span><i className="game-hud-label">マナコイン</i><strong>{progress.coins.toLocaleString('ja-JP')}<small>枚</small></strong></span><ChevronRight size={14} /></button>
      <button type="button" className="game-hud-bonus" aria-label={received ? '今日のボーナス受取済み' : 'デイリーボーナスを受け取る'} disabled={busy || received} onClick={() => void claim()}><Gift /><span><i className="game-hud-label">{received ? '受取済み' : '今日のボーナス'}</i><strong>{received ? 'また明日' : `+${nextBonus?.coins ?? 0}枚`}</strong></span></button>
    </div>
    <div className="game-hud-xp"><LevelBar xp={progress.xp} compact /></div>
    {error && <p role="alert">{error}</p>}
    {bonus && <LoginBonusSheet bonus={bonus} progress={progress} onClose={() => setBonus(null)} />}
  </section>;
  if (expanded) return <section className={`mana-dashboard ${homeLayout ? 'mana-home-layout' : ''}`} aria-label="マナコインととびら君の成長" data-mana-dashboard>
    <div className="mana-player-row">
      {!homeLayout && <><button type="button" onClick={onProfile} className="mana-avatar-button" aria-label="とびら君をきせかえる"><GrowthAvatar progress={progress} size={76} /></button>
      <div className="mana-player-info">
        <p className="mana-eyebrow">MY TOBIRA</p>
        <p className="mana-title">{equippedTitleLabel(progress) || 'とびら君と、ひとつ先へ。'}</p>
        <LevelBar xp={progress.xp} compact />
        <p className="mana-player-meta"><Flame size={12} /> ボーナス連続 {progress.loginStreak}日 <span>累計 {progress.xp.toLocaleString()} XP</span></p>
      </div>
      </>}
      <button type="button" className="mana-wallet" onClick={onWallet || onShop || onProfile} aria-label="マナコインの使い道を開く" data-mana-coins>
        <span><Coins size={17} /> マナコイン</span><strong>{progress.coins.toLocaleString('ja-JP')}<small>枚</small></strong><span>ためる・つかう <ChevronRight size={12} /></span>
      </button>
    </div>
    <div className="mana-shortcuts" aria-label="ゲームメニュー">
      {onGacha && <button type="button" onClick={onGacha}><Gift /><span>ガチャ</span></button>}
      <button type="button" onClick={onShop || onProfile}><Store /><span>ショップ</span></button>
      <button type="button" onClick={onProfile}><Shirt /><span>きせかえ</span></button>
      <button type="button" onClick={onBadges || onProfile}><Award /><span>称号</span></button>
      <button type="button" onClick={onMissions}><Target /><span>ミッション</span>{claimable > 0 && <b aria-label={`受け取れる報酬${claimable}件`}>{claimable}</b>}</button>
    </div>
    <button type="button" className="mana-login" aria-label={received ? '今日のボーナス受取済み' : 'デイリーボーナスを受け取る'} disabled={busy || received} onClick={() => void claim()}>
      <Gift size={19} /><span><strong>{homeLayout ? (received ? '受取済み' : '今日のボーナス') : (received ? '今日のボーナス受取済み' : 'デイリーボーナスを受け取る')}</strong><small>{received ? 'また明日、とびら君と会おう' : `${homeLayout ? '+' : ''}${nextBonus?.coins ?? 0} ${homeLayout ? '枚' : 'マナコイン'} ＋ ${nextBonus?.xp ?? 0} XP`}</small></span>
      {received ? <span>受取済</span> : <ChevronRight size={18} />}
    </button>
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    {bonus && <LoginBonusSheet bonus={bonus} progress={progress} onClose={() => setBonus(null)} />}
    <p className="mana-save-note">この端末・アカウントに保存／課金なし</p>
  </section>;
  return <section className="my-2 rounded-2xl border border-gray-200 bg-white p-2" aria-label="この端末の成長">
    <div className="flex items-center gap-3">
      <button type="button" onClick={onProfile} aria-label="成長プロフィールを開く" className="shrink-0 p-1">
        <GrowthAvatar progress={progress} size={40} />
      </button>
      <div className="min-w-0 flex-1"><LevelBar xp={progress.xp} compact />
        <p className="mt-1 text-xs text-gray-600">端末保存 · {progress.coins} コイン · {progress.loginStreak}日連続</p>
      </div>
    </div>
    <div className="mt-2 grid grid-cols-3 gap-1 text-xs font-bold">
      <button type="button" onClick={onProfile} className="min-h-11 rounded-xl bg-blue-50">称号・きせかえ</button>
      <button type="button" onClick={onMissions} className="min-h-11 rounded-xl bg-blue-50">ミッション</button>
      <button type="button" disabled={busy || progress.lastLoginDate >= today}
        className="min-h-11 rounded-xl bg-amber-100 disabled:opacity-50"
        onClick={() => void claim()}>{progress.lastLoginDate >= today ? '本日受取済み' : '日替わりボーナス'}</button>
    </div>
    {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
    {bonus && <LoginBonusSheet bonus={bonus} progress={progress} onClose={() => setBonus(null)} />}
  </section>;
}
