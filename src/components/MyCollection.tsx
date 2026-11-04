import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { FileText, Download, Coins, Gift, Shirt, Check, Lock } from 'lucide-react';
import { useGrowthProgress } from '../hooks/useGrowthProgress';
import { ITEMS, gachaRarityOf, printOf, shopPriceOf, canUnequip, type EquipKind, type ItemDef } from '../battle/core/growth';
import { buyItem, equip, unequip, importLeagueReward, leagueRewardClaimed } from '../battle/data/growthStore';
import { GrowthAvatar } from '../battle/ui/GrowthParts';
import { clanCall, type LeagueReward } from '../utils/manaClan';
import { auth } from '../firebase';
import { confirmAction } from '../utils/dialog';
import { useFitPager } from '../hooks/useFitPager';
import { FitPagerBar } from './ui/FitPagerBar';
import { savePdf } from '../utils/pdfShare';
import { KyotsuAudioPlayer } from './gacha/KyotsuAudioPlayer';
import { GachaSetsPanel } from './gacha/GachaSetsPanel';
import { stageOf } from '../battle/core/tobiraParts';
import { CompanionArt } from '../battle/ui/CompanionArt';
import { PRINT_SHELVES, printShelfOf, type PrintShelfId } from '../battle/core/printShelves';
import '../styles/home-stage.css';
/** プレゼント（隔週リーグ報酬）でしか手に入らないアイテム */
const LEAGUE_GIFT_ITEM = 'frame_league_aurora';
/** C2：種類の名前と、詳細の窓に出す軽い説明 */
const KIND_LABEL: Record<string, string> = { pose: 'ポーズ', frame: 'フレーム', hat: '帽子', glasses: 'メガネ', cheek: 'ほっぺ', aura: 'オーラ', wallpaper: '壁紙', stage: 'ホーム背景', companion: 'お供', print: 'PDF' };
const KIND_DESC: Record<string, string> = {
  pose: 'とびら君のポーズが変わります。ホームと対戦で表示されます。',
  frame: 'とびら君のまわりの枠が変わります。ランキングや対戦のカードにも出ます。',
  hat: 'とびら君の頭にのせるアクセサリです。',
  glasses: 'とびら君の目もとにつけるアクセサリです。',
  cheek: 'とびら君のほっぺの飾りです。',
  aura: 'とびら君のまわりに出る光のアクセサリです。',
  wallpaper: 'マイページやホームでとびら君の後ろに出る壁紙です。',
  stage: 'ホームのとびら君のステージの背景が変わります（何もつけなければ宇宙）。',
  companion: 'ホームでとびら君のとなりにいるお供です（外すと、ひとりに戻ります）。',
};
function describeItem(item: ItemDef): string {
  const print = printOf(item.id);
  if (print) return `${print.category}（${print.pages}ページ）。「保存する」で端末にPDFを保存して、いつでも見られます。${print.category === '完全版' ? '本1冊ぶんの完全版です。' : ''}`;
  const how = 'coins' in item.unlock ? `ショップで${item.unlock.coins}マナコインと交換できます。` : shopPriceOf(item) != null ? `ガチャで当てるか、ショップで${shopPriceOf(item)}マナコインと交換できます。` : 'level' in item.unlock ? `Lv.${item.unlock.level}で手に入ります。` : 'badge' in item.unlock ? '称号を手に入れると解放されます。' : 'ガチャで手に入ります。';
  return `${KIND_DESC[item.kind] ?? ''}${how}`;
}
const LEAGUE_LABEL: Record<string, string> = { bronze: 'ブロンズ', silver: 'シルバー', gold: 'ゴールド', platinum: 'プラチナ', manatobi: 'マナトビ' };
export function MyCollection({ view = 'owned', onGacha, initialKind = 'all', gachaMode = false }: { view?: 'owned' | 'prints' | 'shop'; key?: string; onGacha?: () => void; initialKind?: string; gachaMode?: boolean }) {
  const { progress, uid } = useGrowthProgress();
  const [kind, setKind] = useState(initialKind); const [search, setSearch] = useState('');
  const [shelf, setShelf] = useState<PrintShelfId | 'all'>('all');
  const [state, setState] = useState<'owned' | 'available' | 'all'>(view === 'shop' ? 'available' : 'owned');
  const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const [rewards, setRewards] = useState<LeagueReward[]>([]);
  /** B4：押したタイルの詳細（窓で開く） */
  const [detail, setDetail] = useState<ItemDef | null>(null);
  useEffect(() => {
    // プレゼント（隔週リーグ報酬）は「持ちもの」の中で受け取る（2026-10-04 プレゼントタブを統合）
    if (view !== 'owned' || !auth.currentUser) return;
    let alive = true;
    setBusy(true); clanCall<{ rewards: LeagueReward[] }>('rewards').then(r => { if (alive) setRewards(r.rewards); }).catch(() => { /* 2026-10-28 A2：集計サーバーが未準備などで取れなくても青い枠の文言は出さない（届いたときだけ表示） */ }).finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
  }, [view, uid]);
  // PC では、枠に入るぶんだけ並べてページでめくる（スクロールさせない）。絞り込みを変えたら1ページ目へ
  const owned = progress?.owned ?? [];
  const base = ITEMS.filter(i => view === 'prints' ? i.kind === 'print' && owned.includes(i.id) : view === 'shop' ? shopPriceOf(i) != null : i.kind !== 'print');
  // 2026-11-04：PDF は棚（共通テスト・2次は地方ごと・教科）で絞る。ショップの「PDF」とマイPDF だけ
  const showShelves = view === 'prints' || (view === 'shop' && kind === 'print');
  const shelfCount = new Map<PrintShelfId, number>();
  if (showShelves) for (const i of base) { const p = i.kind === 'print' ? printOf(i.id) : undefined; if (p) shelfCount.set(printShelfOf(p), (shelfCount.get(printShelfOf(p)) ?? 0) + 1); }
  const inShelf = (i: ItemDef) => { if (!showShelves || shelf === 'all') return true; const p = printOf(i.id); return !!p && printShelfOf(p) === shelf; };
  const list = base.filter(i => (kind === 'all' || i.kind === kind) && inShelf(i) && (!search || i.label.includes(search)) && (view === 'prints' || state === 'all' || (state === 'owned') === owned.includes(i.id)));
  const pager = useFitPager(list.length, `${view}:${kind}:${shelf}:${search}:${state}`);
  if (!progress) return <p role="alert">所有記録を読み込めません。ブラウザの保存設定を確認してください。</p>;
  const titles = { owned: 'もっているもの', prints: 'マイPDF', shop: gachaMode ? 'ガチャショップ（選んで交換）' : 'ショップ（選んで交換）' };
  const perform = async (item: ItemDef) => {
    if (busy) return;
    const owned = progress.owned.includes(item.id);
    const price = shopPriceOf(item);
    if (!owned && price != null && !confirmAction(`${item.label}を${price}マナコインで購入しますか？`)) return;
    setBusy(true); setMessage('');
    try {
      if (owned) { const r = await equip(item.id); setMessage(r ? '装備しました。ホームと対戦に反映されます。' : '装備を保存できませんでした。'); }
      else if (price != null) { const r = await buyItem(item.id); setMessage(r?.ok ? (item.kind === 'print' ? '購入しました。マイPDFから保存できます。' : '購入して装備しました。') : r?.reason || '購入できませんでした。'); }
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
  /** B4（2026-10-29）：種類はアプリ風のチップ（横に並べて押すだけ）。セット・かけらはショップだけ */
  const kinds: string[][] = [['all','すべて'],['pose','ポーズ'],['frame','フレーム'],['hat','帽子'],['glasses','メガネ'],['cheek','ほっぺ'],['aura','オーラ'],['wallpaper','壁紙'],['stage','ホーム背景'],['companion','お供'],...(view === 'shop' ? [['print','PDF'],['sets','セット収集'],['shards',`かけら交換（${progress.shards ?? 0}）`]] : [])];
  const states: [typeof state, string][] = [['owned','所持済み'],['available','未所持'],['all','すべて']];
  /** 詳細の窓の中の操作（保存・装備・外す・購入）。タイルはコンパクトにして、操作はそこに集めた */
  const actions = (item: ItemDef) => {
    const owned = progress.owned.includes(item.id); const print = printOf(item.id); const equipped = progress.equipped[item.kind] === item.id; const price = shopPriceOf(item);
    return print && owned ? <><p>{print.category} · {print.pages}ページ</p><a href={print.file} download onClick={e => { e.preventDefault(); void savePdf(print.file, `${print.label.replace(/[\\/:*?"<>|\s]+/g, '_')}.pdf`, print.label).catch(() => setMessage('PDFを保存できませんでした。接続を確認して、もう一度お試しください。')); }}><Download size={16}/>保存する</a><KyotsuAudioPlayer printId={item.id}/></> : owned ? (equipped ? (canUnequip(progress, item) ? <button type="button" className="collection-unequip" data-unequip={item.id} disabled={busy} onClick={() => void takeOff(item)}>外す</button> : <button type="button" disabled>装備中</button>) : <button type="button" disabled={busy} onClick={() => void perform(item)}>装備する</button>) : price != null ? <><p>{price.toLocaleString()} マナコイン</p><button type="button" disabled={busy || progress.coins < price} onClick={() => void perform(item)}>{progress.coins < price ? `あと${(price-progress.coins).toLocaleString()}枚` : '購入する'}</button></> : <p>{item.id === 'frame_league_aurora' ? '隔週リーグ限定UR' : 'level' in item.unlock ? `Lv.${item.unlock.level}で解放` : 'badge' in item.unlock ? '称号で解放' : 'ガチャで獲得'}</p>;
  };
  const art = (item: ItemDef, size: number) => { const print = printOf(item.id); if (item.kind === 'companion') return <span className="collection-companion-art"><CompanionArt value={item.value} size={Math.round(size * 0.96)} /></span>; if (item.kind === 'stage') return <svg className="collection-stage-swatch" data-stage-swatch={stageOf(item.value) ? item.value : 'cosmos'} width={size} height={size} viewBox="0 0 10 10" role="img" aria-label={stageOf(item.value)?.label ?? 'ホームの背景'}><rect className="stage-swatch-fill" width="10" height="10" rx="1.4" /><image href="/mascots/basic.webp" x="2.2" y="3" width="5.6" height="5.6" /></svg>; return print ? <img src={print.thumb} alt="PDFの表紙" loading="lazy"/> : <GrowthAvatar progress={{...progress,equipped:{...progress.equipped,[item.kind]:item.id}}} size={size} showLevel={false}/>; };
  return <section className="my-collection" data-my-collection={view}>
    <header><h2>{view === 'prints' ? <FileText size={22}/> : <Shirt size={22}/>} {titles[view]}</h2><b><Coins size={18}/>{progress.coins.toLocaleString()}</b></header>
    {message && <p role="status" className="collection-message">{message}</p>}
    <div className="collection-controls"><label className="sr-only" htmlFor="collection-search">アイテム名で探す</label><input id="collection-search" placeholder="名前で探す" value={search} onChange={e => setSearch(e.target.value)}/>
      {view !== 'prints' && <div className="collection-state" role="group" aria-label="所有状況">{states.map(([id, label]) => <button type="button" key={id} aria-pressed={state === id} data-state={id} onClick={() => setState(id)}>{label}</button>)}</div>}</div>
    {view !== 'prints' && <nav className="collection-kinds" aria-label="種類" data-collection-kinds>{kinds.map(([id,label]) => <button type="button" key={id} data-kind={id} aria-pressed={kind === id} onClick={() => { setKind(id); setShelf('all'); }}>{label}</button>)}</nav>}
    {showShelves && shelfCount.size > 1 && <nav className="collection-kinds collection-shelves" aria-label="PDFの棚" data-print-shelves>{[{ id: 'all' as const, label: 'すべて' }, ...PRINT_SHELVES.filter(sh => shelfCount.has(sh.id))].map(sh => <button type="button" key={sh.id} data-shelf={sh.id} aria-pressed={shelf === sh.id} onClick={() => setShelf(sh.id)}>{sh.label}{sh.id !== 'all' && <small>{shelfCount.get(sh.id)}</small>}</button>)}</nav>}
    <div className="collection-scroll" tabIndex={0} aria-label="所有アイテム一覧" ref={pager.frameRef} data-fit-paged={pager.enabled || undefined}>
      {/* 届いたプレゼント（未受け取りだけ）。受け取ると下の一覧に「プレゼントで獲得」と出る */}
      {view === 'owned' && rewards.some(r => !progress.owned.includes(r.itemId)) && <section className="store-guide is-gift" aria-label="届いたプレゼント" data-gift-guide>
        <p><strong>プレゼントが届いています</strong>（隔週リーグの上位報酬）。受け取ると持ちものに入り、装備できます。</p>
        {rewards.filter(r => !leagueRewardClaimed(r.id) && !(r.itemId && progress.owned.includes(r.itemId) && !r.coins)).map(r => <article key={r.id} className="collection-reward"><strong><Gift size={16} aria-hidden/> {r.kind === 'join' ? `シーズン参加賞（${LEAGUE_LABEL[r.label] ?? r.label}）` : 'UR · リーグ・オーロラフレーム'}{r.coins ? ` ＋${r.coins}マナコイン` : ''}</strong><p>{r.season.replace(/^s/, 'シーズン')} · {r.kind === 'join' ? '全国対戦3試合以上' : r.kind === 'clan' ? `マナクラン ${r.rank}位` : `${LEAGUE_LABEL[r.label] ?? r.label} ${r.rank}位`}</p><button type="button" disabled={busy} onClick={async () => { setBusy(true); try { const validated = await clanCall<LeagueReward>('claimReward', { rewardId: r.id }); const result = await importLeagueReward(validated.id, validated.itemId, uid, validated.coins ?? 0); setMessage(result ? (validated.itemId ? 'プレゼントを受け取りました。持ちものから装備できます。' : `${validated.coins ?? 0}マナコインを受け取りました。`) : '端末保存に失敗しました。再度受け取れます。'); } catch (e) { setMessage((e as Error).message); } finally { setBusy(false); } }}>受け取る</button></article>)}
      </section>}
      {/* 2026-10-28 A10：セット収集・かけら交換はショップの「種類」から（ボタンは増やさない） */}{view === 'shop' && (kind === 'sets' || kind === 'shards') ? <GachaSetsPanel progress={progress} tab={kind} /> : <><ul className="collection-grid collection-tiles" ref={pager.gridRef}>{list.slice(pager.start, pager.end).map(item => { const owned = progress.owned.includes(item.id); const equipped = progress.equipped[item.kind] === item.id; const rarity = gachaRarityOf(item); return <li key={item.id} data-owned={owned} data-equipped={equipped || undefined}>
        {/* B4：小さなタイル。押すと詳細の窓（装備・保存などの操作はそこ） */}
        <button type="button" className="collection-tile" data-rarity={rarity} onClick={() => setDetail(item)} aria-label={`${item.label}（${equipped ? '装備中' : owned ? '所持済み' : '未所持'}）の詳細を見る`}>
          <span className="collection-art">{art(item, 52)}</span>
          <span className="collection-tile-name">{item.label}</span>
          <span className="collection-tile-tag">{equipped ? <><Check size={12} aria-hidden/>装備中</> : owned ? rarity : <><Lock size={11} aria-hidden/>{shopPriceOf(item) != null ? `${shopPriceOf(item)!.toLocaleString()}枚` : rarity}</>}</span>
          {owned && item.id === LEAGUE_GIFT_ITEM && <span className="collection-gift-tag" data-gift-item><Gift size={12} aria-hidden/>プレゼント</span>}
        </button>
      </li>; })}</ul>{!list.length && <p className="collection-empty">{view === 'prints' ? '獲得したPDFはここに並びます。ガチャのSRで学習プリント、URで完全版の本が出ます。' : 'この条件のアイテムはありません。絞り込みを変えてみてください。'}</p>}</>}
    </div>
    <FitPagerBar pager={pager} label="一覧" />
    {/* C1/C2（2026-10-29）：詳細の窓＝大きな絵＋説明＋操作。PDF は表紙のページ・中身の説明・「保存する」 */}
    {detail && <ItemDialog onClose={() => setDetail(null)} title={detail.label}>
      {(() => {
        const owned = progress.owned.includes(detail.id); const print = printOf(detail.id); const equipped = progress.equipped[detail.kind] === detail.id;
        return <>
          <div className="collection-detail-hero" data-kind={detail.kind}>
            {detail.kind === 'stage' ? art(detail, 150) : print ? <img className="collection-detail-cover" src={print.thumb} alt={`${print.label}の表紙`} />
              : <GrowthAvatar progress={{...progress,equipped:{...progress.equipped,[detail.kind]:detail.id}}} size={150} showLevel={false}/>}
          </div>
          <div className="collection-detail-title">
            <span className="collection-detail-chip" data-rarity={gachaRarityOf(detail)}>{gachaRarityOf(detail)}</span>
            <span className="collection-detail-chip">{KIND_LABEL[detail.kind] ?? 'アイテム'}</span>
            <span className="collection-detail-chip" data-state={equipped ? 'equipped' : owned ? 'owned' : 'none'}>{equipped ? '装備中' : owned ? '所持済み' : '未所持'}</span>
          </div>
          <strong className="collection-detail-name">{detail.label}</strong>
          <p className="collection-detail-desc">{describeItem(detail)}</p>
          <div className="collection-detail-actions">{actions(detail)}</div>
          {message && <p role="status" className="collection-message">{message}</p>}
        </>;
      })()}
    </ItemDialog>}
    <p className="collection-storage">所有アイテム・コインはこの端末のアカウント別に保存。リーグの配布記録はサーバーに保存され、受け取り直せます。</p>
  </section>;
}

/** B4：アイテムの詳細の窓（既存の窓と同じ見た目） */
function ItemDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const d = ref.current; if (d && !d.open) d.showModal(); }, []);
  return createPortal(<dialog ref={ref} className="game-details-dialog mt-dialog collection-detail" aria-label={`${title}の詳細`} data-collection-detail
    onClose={onClose} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === ref.current) onClose(); }}>
    <header><h2>アイテムの詳細</h2><button type="button" autoFocus onClick={onClose}>閉じる</button></header>
    <div className="game-details-body collection-detail-body">{children}</div>
  </dialog>, document.body);
}
