import { useEffect, useState } from 'react';
import { FileText, Download, Coins, Gift, Shirt } from 'lucide-react';
import { useGrowthProgress } from '../hooks/useGrowthProgress';
import { ITEMS, gachaRarityOf, printOf, canUnequip, type EquipKind, type ItemDef } from '../battle/core/growth';
import { buyItem, equip, unequip, importLeagueReward, leagueRewardClaimed } from '../battle/data/growthStore';
import { GrowthAvatar } from '../battle/ui/GrowthParts';
import { clanCall, type LeagueReward } from '../utils/manaClan';
import { auth } from '../firebase';
/** プレゼント（隔週リーグ報酬）でしか手に入らないアイテム */
const LEAGUE_GIFT_ITEM = 'frame_league_aurora';
const LEAGUE_LABEL: Record<string, string> = { bronze: 'ブロンズ', silver: 'シルバー', gold: 'ゴールド', platinum: 'プラチナ', manatobi: 'マナトビ' };
export function MyCollection({ view = 'owned', onGacha, initialKind = 'all' }: { view?: 'owned' | 'prints' | 'shop'; key?: string; onGacha?: () => void; initialKind?: string }) {
  const { progress, uid } = useGrowthProgress();
  const [kind, setKind] = useState(initialKind); const [search, setSearch] = useState('');
  const [state, setState] = useState<'owned' | 'available' | 'all'>(view === 'shop' ? 'available' : 'owned');
  const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const [rewards, setRewards] = useState<LeagueReward[]>([]);
  useEffect(() => {
    // プレゼント（隔週リーグ報酬）は「持ちもの」の中で受け取る（2026-10-04 プレゼントタブを統合）
    if (view !== 'owned' || !auth.currentUser) return;
    let alive = true;
    setBusy(true); clanCall<{ rewards: LeagueReward[] }>('rewards').then(r => { if (alive) setRewards(r.rewards); }).catch(e => { if (alive) setMessage(e.message); }).finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
  }, [view, uid]);
  if (!progress) return <p role="alert">所有記録を読み込めません。ブラウザの保存設定を確認してください。</p>;
  const titles = { owned: 'もっているもの', prints: 'マイPDF', shop: 'ショップ（選んで交換）' };
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
  // ★装備を外す（2026-10-06）★ ポーズ・フレームは基本に戻る、それ以外は「なし」になる
  const takeOff = async (item: ItemDef) => {
    if (busy) return;
    setBusy(true); setMessage('');
    try {
      const r = await unequip(item.kind as EquipKind);
      setMessage(r ? (item.kind === 'pose' || item.kind === 'frame' ? `${item.label}を外しました（基本に戻しました）。` : `${item.label}を外しました。`) : '保存できませんでした。');
    } catch { setMessage('保存に失敗しました。'); } finally { setBusy(false); }
  };
  return <section className="my-collection" data-my-collection={view}>
    <header><h2>{view === 'prints' ? <FileText size={22}/> : <Shirt size={22}/>} {titles[view]}</h2><b><Coins size={18}/>{progress.coins.toLocaleString()}</b></header>
    {message && <p role="status" className="collection-message">{message}</p>}
    {<><div className="collection-controls"><label className="sr-only" htmlFor="collection-search">アイテム名で探す</label><input id="collection-search" placeholder="名前で探す" value={search} onChange={e => setSearch(e.target.value)}/>{view !== 'prints' && <select aria-label="所有状況" value={state} onChange={e => setState(e.target.value as typeof state)}><option value="owned">所持済み</option><option value="available">未所持</option><option value="all">すべて</option></select>}</div>{view !== 'prints' && <label className="collection-kind">種類<select value={kind} onChange={e => setKind(e.target.value)}>{[['all','すべて'],['pose','ポーズ'],['frame','フレーム'],['hat','帽子'],['glasses','メガネ'],['cheek','ほっぺ'],['aura','オーラ'],['wallpaper','壁紙']].map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></label>}</>}
    <div className="collection-scroll" tabIndex={0} aria-label="所有アイテム一覧">
      {view === 'shop' && <section className="store-guide" aria-label="ショップとガチャの違い" data-store-guide>
        <div><b>ショップ</b><span>欲しい物を<strong>選んで</strong>コイン交換</span></div>
        <div><b>ガチャ</b><span>何が出るか<strong>ランダム</strong>（UR・SRはガチャ限定）</span></div>
        <p>どちらで手に入れても「持ちもの」に入り、PDFは「マイPDF」で開けます。装飾で対戦の強さは変わりません。</p>
        {onGacha && <button type="button" onClick={onGacha}>ガチャを見てみる</button>}
      </section>}
      {/* 届いたプレゼント（未受け取りだけ）。受け取ると下の一覧に「プレゼントで獲得」と出る */}
      {view === 'owned' && rewards.some(r => !progress.owned.includes(r.itemId)) && <section className="store-guide is-gift" aria-label="届いたプレゼント" data-gift-guide>
        <p><strong>プレゼントが届いています</strong>（隔週リーグの上位報酬）。受け取ると持ちものに入り、装備できます。</p>
        {rewards.filter(r => !leagueRewardClaimed(r.id) && !(r.itemId && progress.owned.includes(r.itemId) && !r.coins)).map(r => <article key={r.id} className="collection-reward"><strong><Gift size={16} aria-hidden/> {r.kind === 'join' ? `シーズン参加賞（${LEAGUE_LABEL[r.label] ?? r.label}）` : 'UR · リーグ・オーロラフレーム'}{r.coins ? ` ＋${r.coins}マナコイン` : ''}</strong><p>{r.season.replace(/^s/, 'シーズン')} · {r.kind === 'join' ? '全国対戦3試合以上' : r.kind === 'clan' ? `マナクラン ${r.rank}位` : `${LEAGUE_LABEL[r.label] ?? r.label} ${r.rank}位`}</p><button type="button" disabled={busy} onClick={async () => { setBusy(true); try { const validated = await clanCall<LeagueReward>('claimReward', { rewardId: r.id }); const result = await importLeagueReward(validated.id, validated.itemId, uid, validated.coins ?? 0); setMessage(result ? (validated.itemId ? 'プレゼントを受け取りました。持ちものから装備できます。' : `${validated.coins ?? 0}マナコインを受け取りました。`) : '端末保存に失敗しました。再度受け取れます。'); } catch (e: any) { setMessage(e.message); } finally { setBusy(false); } }}>受け取る</button></article>)}
      </section>}
      <ul className="collection-grid">{list.map(item => { const owned = progress.owned.includes(item.id); const print = printOf(item.id); const equipped = progress.equipped[item.kind] === item.id; return <li key={item.id} data-owned={owned}>
        <div className="collection-art">{print ? <img src={print.thumb} alt="PDFの表紙" loading="lazy"/> : <GrowthAvatar progress={{...progress,equipped:{...progress.equipped,[item.kind]:item.id}}} size={68} showLevel={false}/>}</div>
        <span className="collection-tag">{gachaRarityOf(item)} · {equipped ? '装備中' : owned ? '所持済み' : '未所持'}</span>{owned && item.id === LEAGUE_GIFT_ITEM && <span className="collection-gift-tag" data-gift-item><Gift size={12} aria-hidden/>プレゼントで獲得</span>}<h3>{item.label}</h3>
        {print && owned ? <><p>{print.category} · {print.pages}ページ</p><a href={print.file} target="_blank" rel="noopener"><FileText size={16}/>PDFを開く</a><a href={print.file} download><Download size={16}/>保存する</a></> : owned ? (equipped ? (canUnequip(progress, item) ? <button type="button" className="collection-unequip" data-unequip={item.id} disabled={busy} onClick={() => void takeOff(item)}>外す</button> : <button type="button" disabled>装備中</button>) : <button type="button" disabled={busy} onClick={() => void perform(item)}>装備する</button>) : 'coins' in item.unlock ? <><p>{item.unlock.coins} マナコイン</p><button type="button" disabled={busy || progress.coins < item.unlock.coins} onClick={() => void perform(item)}>{progress.coins < item.unlock.coins ? `あと${item.unlock.coins-progress.coins}枚` : '購入する'}</button></> : <p>{item.id === 'frame_league_aurora' ? '隔週リーグ限定UR' : 'level' in item.unlock ? `Lv.${item.unlock.level}で解放` : 'badge' in item.unlock ? '称号で解放' : 'ガチャで獲得'}</p>}
      </li>; })}</ul>{!list.length && <p className="collection-empty">{view === 'prints' ? '獲得したPDFはここに並びます。ガチャのURで学習プリントを手に入れよう。' : 'この条件のアイテムはありません。絞り込みを変えてみてください。'}</p>}
    </div>
    <p className="collection-storage">所有アイテム・コインはこの端末のアカウント別に保存。リーグの配布記録はサーバーに保存され、受け取り直せます。</p>
  </section>;
}
