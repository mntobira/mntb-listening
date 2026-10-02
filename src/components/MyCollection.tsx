import { useEffect, useState } from 'react';
import { FileText, Download, Coins, Gift, Shirt } from 'lucide-react';
import { useGrowthProgress } from '../hooks/useGrowthProgress';
import { ITEMS, gachaRarityOf, printOf, type ItemDef } from '../battle/core/growth';
import { buyItem, equip, importLeagueReward } from '../battle/data/growthStore';
import { GrowthAvatar } from '../battle/ui/GrowthParts';
import { clanCall, type LeagueReward } from '../utils/manaClan';
import { auth } from '../firebase';
export function MyCollection({ view = 'owned' }: { view?: 'owned' | 'prints' | 'shop' | 'rewards'; key?: string }) {
  const { progress, uid } = useGrowthProgress();
  const [kind, setKind] = useState('all'); const [search, setSearch] = useState('');
  const [state, setState] = useState<'owned' | 'available' | 'all'>(view === 'shop' ? 'available' : 'owned');
  const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const [rewards, setRewards] = useState<LeagueReward[]>([]);
  useEffect(() => {
    if (view !== 'rewards') return;
    let alive = true;
    if (!auth.currentUser) { setMessage('リーグのプレゼントにはGoogleログインが必要です。'); return; }
    setBusy(true); clanCall<{ rewards: LeagueReward[] }>('rewards').then(r => { if (alive) setRewards(r.rewards); }).catch(e => { if (alive) setMessage(e.message); }).finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
  }, [view, uid]);
  if (!progress) return <p role="alert">所有記録を読み込めません。ブラウザの保存設定を確認してください。</p>;
  const titles = { owned: 'もっているもの', prints: 'マイPDF', shop: '買えるもの', rewards: 'プレゼント' };
  const base = ITEMS.filter(i => view === 'prints' ? i.kind === 'print' && progress.owned.includes(i.id) : view === 'shop' ? 'coins' in i.unlock : i.kind !== 'print');
  const list = base.filter(i => (kind === 'all' || i.kind === kind) && (!search || i.label.includes(search)) && (view === 'prints' || state === 'all' || (state === 'owned') === progress.owned.includes(i.id)));
  const perform = async (item: ItemDef) => {
    if (busy) return;
    const owned = progress.owned.includes(item.id);
    if (!owned && 'coins' in item.unlock && !window.confirm(`${item.label}を${item.unlock.coins}マナコインで購入しますか？`)) return;
    setBusy(true); setMessage('');
    try {
      if (owned) { const r = await equip(item.id); setMessage(r ? '装備しました。ホームと対戦に反映されます。' : '装備を保存できませんでした。'); }
      else if ('coins' in item.unlock) { const r = await buyItem(item.id); setMessage(r?.ok ? '購入して装備しました。' : r?.reason || '購入できませんでした。'); }
    } catch { setMessage('保存に失敗しました。'); } finally { setBusy(false); }
  };
  return <section className="my-collection" data-my-collection={view}>
    <header><h2>{view === 'prints' ? <FileText size={22}/> : view === 'rewards' ? <Gift size={22}/> : <Shirt size={22}/>} {titles[view]}</h2><b><Coins size={18}/>{progress.coins.toLocaleString()}</b></header>
    {message && <p role="status" className="collection-message">{message}</p>}
    {view !== 'rewards' && <><div className="collection-controls"><label className="sr-only" htmlFor="collection-search">アイテム名で探す</label><input id="collection-search" placeholder="名前で探す" value={search} onChange={e => setSearch(e.target.value)}/>{view !== 'prints' && <select aria-label="所有状況" value={state} onChange={e => setState(e.target.value as typeof state)}><option value="owned">所持済み</option><option value="available">未所持</option><option value="all">すべて</option></select>}</div>{view !== 'prints' && <label className="collection-kind">種類<select value={kind} onChange={e => setKind(e.target.value)}>{[['all','すべて'],['pose','ポーズ'],['frame','フレーム'],['hat','帽子'],['glasses','メガネ'],['cheek','ほっぺ'],['aura','オーラ'],['wallpaper','壁紙']].map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></label>}</>}
    <div className="collection-scroll" tabIndex={0} aria-label="所有アイテム一覧">
      {view === 'rewards' ? <>{busy && <p>プレゼントを確認中…</p>}{rewards.map(r => <article key={r.id} className="collection-reward"><strong>UR · リーグ・オーロラフレーム</strong><p>{r.season} · {r.label} {r.rank}位</p><button type="button" disabled={busy || progress.owned.includes(r.itemId)} onClick={async () => { setBusy(true); try { const validated = await clanCall<LeagueReward>('claimReward', { rewardId: r.id }); const result = await importLeagueReward(validated.id, validated.itemId, uid); setMessage(result ? 'プレゼントを受け取りました。もっているものから装備できます。' : '端末保存に失敗しました。再度受け取れます。'); } catch (e: any) { setMessage(e.message); } finally { setBusy(false); } }}>{progress.owned.includes(r.itemId) ? '所持済み' : '受け取る'}</button></article>)}{!busy && !rewards.length && !message && <p>プレゼントはまだ届いていません。隔週リーグで上位を目指そう。</p>}</> : <>
      <ul className="collection-grid">{list.map(item => { const owned = progress.owned.includes(item.id); const print = printOf(item.id); const equipped = progress.equipped[item.kind] === item.id; return <li key={item.id} data-owned={owned}>
        <div className="collection-art">{print ? <img src={print.thumb} alt="PDFの表紙" loading="lazy"/> : <GrowthAvatar progress={{...progress,equipped:{...progress.equipped,[item.kind]:item.id}}} size={68} showLevel={false}/>}</div>
        <span className="collection-tag">{gachaRarityOf(item)} · {equipped ? '装備中' : owned ? '所持済み' : '未所持'}</span><h3>{item.label}</h3>
        {print && owned ? <><p>{print.category} · {print.pages}ページ</p><a href={print.file} target="_blank" rel="noopener"><FileText size={16}/>PDFを開く</a><a href={print.file} download><Download size={16}/>保存する</a></> : owned ? <button type="button" disabled={busy || equipped} onClick={() => void perform(item)}>{equipped ? '装備中' : '装備する'}</button> : 'coins' in item.unlock ? <><p>{item.unlock.coins} マナコイン</p><button type="button" disabled={busy || progress.coins < item.unlock.coins} onClick={() => void perform(item)}>{progress.coins < item.unlock.coins ? `あと${item.unlock.coins-progress.coins}枚` : '購入する'}</button></> : <p>{item.id === 'frame_league_aurora' ? '隔週リーグ限定UR' : 'level' in item.unlock ? `Lv.${item.unlock.level}で解放` : 'badge' in item.unlock ? '称号で解放' : 'ガチャで獲得'}</p>}
      </li>; })}</ul>{!list.length && <p className="collection-empty">{view === 'prints' ? '獲得したPDFはここに並びます。ガチャのURで学習プリントを手に入れよう。' : 'この条件のアイテムはありません。絞り込みを変えてみてください。'}</p>}</>}
    </div>
    <p className="collection-storage">所有アイテム・コインはこの端末のアカウント別に保存。リーグの配布記録はサーバーに保存され、受け取り直せます。</p>
  </section>;
}
