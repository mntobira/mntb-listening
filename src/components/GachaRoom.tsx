import { RewardVideo } from './RewardVideo';
import { rewardedAdAvailable, preloadRewardedAd, showRewardedAd } from '../ads/rewardedAd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GachaReveal, RarityStars } from './GachaReveal';
import { RARITY_STARS } from './gachaRevealSteps';
import { Gift, Coins, ArrowLeft, ChevronLeft, PlayCircle, ChevronRight, FileText, Download, Target } from 'lucide-react';
import { Badge, ItemCard, RarityBadge } from './ui';
import { gachaFeatured } from '../battle/core/gachaFeatured';
import './gacha.css';
import { useGrowthProgress } from '../hooks/useGrowthProgress';
import { VIDEO_GACHA_DAILY_LIMIT, GACHA_COST, GACHA_MULTI_COST, GACHA_DUPLICATE_REFUND_BY_RARITY, GACHA_RARITY_LABELS, GACHA_RARITY_ORDER, GACHA_RARITY_RATES, gachaItems, gachaItemsByRarity, gachaItemRate } from '../battle/core/arenaEconomy';
import { completedVideoToken, drawVideoGacha, videoGachaPlaysLeft, drawGacha, drawGachaMulti, equip, GACHA_MULTI_COUNT } from '../battle/data/growthStore';
import { GrowthAvatar } from '../battle/ui/GrowthParts';
import { gachaRarityOf, printOf, type ItemDef, type GachaRarity, type GrowthProgress } from '../battle/core/growth';
import { primeAudio } from '../battle/ui/feedback';
import { wallpaperOf } from '../battle/core/tobiraParts';

/** コレクションの分類（部位ごとに見られるように） */
const COLLECTION_KINDS = [
  { id: 'body', label: 'ポーズ・わく', match: (i: ItemDef) => i.kind === 'pose' || i.kind === 'frame' },
  { id: 'parts', label: '帽子・メガネほか', match: (i: ItemDef) => ['hat', 'glasses', 'cheek', 'aura'].includes(i.kind) },
  { id: 'wallpaper', label: '壁紙', match: (i: ItemDef) => i.kind === 'wallpaper' },
  { id: 'print', label: '学習プリント', match: (i: ItemDef) => i.kind === 'print' },
] as const;
type CollectionKind = typeof COLLECTION_KINDS[number]['id'];

const pct=(r:number)=>{const v=r*100;return (v>=10?v.toFixed(1):v>=1?v.toFixed(2):v.toFixed(3)).replace(/\.?0+$/,'');};
/** レア度の札は共通部品（ui/RarityBadge）。N→R→SR→UR で枠・装飾が段階的に増える（C12） */
function RarityTag({rarity,size}:{rarity:GachaRarity;size?:'lg'|'xl'}){return <RarityBadge rarity={rarity} size={size} label={GACHA_RARITY_LABELS[rarity]}/>;}
/** 結果の中でいちばん高いレア度 */
const bestOf=(list:{rarity:GachaRarity}[]):GachaRarity=>GACHA_RARITY_ORDER.find(r=>list.some(x=>x.rarity===r)) ?? 'N';
/** アイテムの見た目：装備なら扉くんに着せたプレビュー、学習プリントなら1ページ目のサムネイル */
function ItemArt({item,progress,size}:{item:ItemDef;progress:GrowthProgress|null;size:number}){
 const print=item.kind==='print'?printOf(item.id):undefined;
 if(item.kind==='wallpaper') return <span className="gacha-wallpaper-art" style={{width:size,height:Math.round(size*1.3),background:wallpaperOf(item.value)?.css}}><img src="/mascots/basic.webp" alt="" width={Math.round(size*0.5)} height={Math.round(size*0.5)}/></span>;
 if(print) return <span className="gacha-print-thumb" style={{width:size,height:Math.round(size*1.414)}}><img src={print.thumb} alt={`${print.label}の1ページ目`} loading="lazy" decoding="async" width={size} height={Math.round(size*1.414)}/><em>{print.category}</em></span>;
 return progress ? <GrowthAvatar progress={{...progress,equipped:{...progress.equipped,[item.kind]:item.id}}} size={size} showLevel={false}/> : null;
}
/** 学習プリントを開く・保存するリンク（同じサイト内の PDF だけ） */
function PrintLinks({item,compact=false}:{item:ItemDef;compact?:boolean}){
 const print=printOf(item.id);if(!print)return null;
 const name=`${print.label.replace(/[\\/:*?"<>|\s]+/g,'_')}.pdf`;
 return <span className={`gacha-print-links ${compact?'is-compact':''}`}>
  <a href={print.file} target="_blank" rel="noopener" aria-label={`${print.label}（PDF・${print.pages}ページ）を開く`}><FileText size={compact?14:16} aria-hidden="true"/>{compact?'開く':`PDFを開く（${print.pages}ページ）`}</a>
  <a href={print.file} download={name} aria-label={`${print.label}をダウンロード`}><Download size={compact?14:16} aria-hidden="true"/>{compact?'保存':'ダウンロード'}</a>
 </span>;
}
type GachaProps = {onBack:()=>void;onMissions:()=>void;embedded?:boolean};
export function GachaRoom(props:GachaProps) {
 const {uid}=useGrowthProgress();
 return <GachaRoomContent key={uid} owner={uid} {...props}/>;
}
/** 下のプレビューで見せる「質の高いUR」。教科をばらして10個だけ */
const FEATURED_UR_IDS = ['print_math_basic_all','print_grammar_100','print_trend_cb_all','print_mock_cb_1','print_mock_joho_1','print_mock_bio_1','print_rank_c','print_trend_c_all','print_math_quadratic_weekly','print_vocab_lv2'] as const;
function GachaRoomContent({onBack,onMissions,owner,embedded=false}:GachaProps & {owner:string;key?:string}) {
 const {progress}=useGrowthProgress();const lock=useRef(false);const [busy,setBusy]=useState(false);
 const oddsDialog=useRef<HTMLDialogElement>(null);
 const [collectionFilter,setCollectionFilter]=useState<'all'|'owned'|'missing'>('all');
 const items=gachaItems();const tiers=gachaItemsByRarity();
 const topUr=FEATURED_UR_IDS.map(id=>items.find(i=>i.id===id)).filter((i):i is ItemDef=>!!i);
 const showcase=topUr.length?topUr:tiers.UR.slice(0,10);
 const [previewIndex,setPreviewIndex]=useState(0);
 const previewItem=showcase[previewIndex % showcase.length];
 const ownedCount=items.filter(item=>progress?.owned.includes(item.id)).length;
 const [confirm,setConfirm]=useState(false);const [error,setError]=useState('');
 const [revealing,setRevealing]=useState(false);const [revealKey,setRevealKey]=useState(0);
 const [result,setResult]=useState<{item:ItemDef;rarity:GachaRarity;duplicate:boolean;refund:number}|null>(null);
 const [multi,setMulti]=useState<{item:ItemDef;rarity:GachaRarity;duplicate:boolean;refund:number}[]|null>(null);
 const bestRarity:GachaRarity|null=result?result.rarity:multi?bestOf(multi):null;
 const [collectionKind,setCollectionKind]=useState<CollectionKind>('body');
 const collectionList=items.filter(COLLECTION_KINDS.find(k=>k.id===collectionKind)!.match);
 const [confirmMulti,setConfirmMulti]=useState(false);
 const multiCost=GACHA_MULTI_COST;
 const [videoOpen,setVideoOpen]=useState(false);
 const [freeResult,setFreeResult]=useState(false);
 const videoLeft=videoGachaPlaysLeft();
 /*
  * ★「動画で1回」＝ アプリ公開後はリワード広告（2026-10-05）★
  *   広告が使えるとき（src/ads/adConfig.ts で ON・SDK 登録済み）は広告を見せ、最後まで見たら1回引く。
  *   使えないとき（今の Web 版・広告の在庫切れ・読み込み失敗）は、これまでどおりアプリ内の応援動画を出す。
  *   どちらでも「途中で閉じたら回数を消費しない」「1日5回まで」は同じ。抽選は drawVideoGacha 1か所。
  */
 const adMode=rewardedAdAvailable();
 useEffect(()=>{preloadRewardedAd();},[]);
 const drawFree=async(token:object)=>{
  if(lock.current)return;lock.current=true;setBusy(true);
  try {const r=await drawVideoGacha(token,owner);if(!r?.result){setError('今日の上限に達したか、保存できませんでした。');return;}setFreeResult(true);setMulti(null);setResult(r.result);setRevealKey(k=>k+1);setRevealing(true);}finally{lock.current=false;setBusy(false);}
 };
 const startFree=async()=>{
  setError('');
  if(!adMode){setVideoOpen(true);return;}
  setBusy(true);
  const r=await showRewardedAd();
  setBusy(false);
  if(r.status==='rewarded'){await drawFree(completedVideoToken());return;}
  if(r.status==='dismissed'){setError('最後まで見ると1回引けます。回数は消費していません。');return;}
  setVideoOpen(true); // 広告が出せないときは応援動画で代わりに
 };
 const drawMulti=async()=>{
  if(lock.current)return;lock.current=true;setBusy(true);setError('');setFreeResult(false);setConfirmMulti(false);primeAudio();
  try {const r=await drawGachaMulti(crypto.randomUUID(),owner);if(!r?.results){setError('抽選できませんでした。残高や保存設定を確認してください。');return;}setResult(null);setMulti(r.results);setRevealKey(k=>k+1);setRevealing(true);}
  catch {setError('抽選できませんでした。再度お試しください。');}finally{lock.current=false;setBusy(false);}
 };
 const draw=async()=>{
  if(lock.current)return;lock.current=true;setBusy(true);setError('');setFreeResult(false);setConfirm(false);primeAudio();
  try {const r=await drawGacha(crypto.randomUUID(),owner);if(!r?.result){setError('抽選できませんでした。残高や保存設定を確認してください。');return;}setMulti(null);setResult(r.result);setRevealKey(k=>k+1);setRevealing(true);}
  catch {setError('抽選できませんでした。再度お試しください。');}finally{lock.current=false;setBusy(false);}
 };
 const featured=useMemo(()=>gachaFeatured({preferSubjects:['english_vocab','english_grammar'],srCount:0,rCount:0}),[]);
 const busyView=revealing||!!result||!!multi;
 const collectionLine=<span className="gacha-collect-count" data-gacha-collection aria-label={`コレクション ${ownedCount} / ${items.length}`}><span className="gacha-collect-word">コレクション </span><b>{ownedCount}</b> / {items.length}</span>;
 /*
  * ★画面の流れ（C9）★ ① 今回の注目アイテム → ② 所持マナコイン → ③ ガチャを引く → ④ 結果 → ⑤ コレクションに追加
  *   注目アイテムは gachaFeatured()（ガチャデータから自動生成）。アイテム名は書かない（C23）。
  *   「注目」は見せ方で、割合は本物の抽選表（gachaItemRate）の値をそのまま出す（C8）。
  */
 return <section className={`gacha-room ${result?'has-result':''} ${busyView?'is-busy':''}`} data-best-rarity={!revealing && bestRarity ? bestRarity : undefined}>{!embedded && <button type="button" className="arena-back" onClick={onBack}><ArrowLeft size={18}/>マイページ</button>}
  <header className="gacha-head">
   <p className="mt-kicker">TOBIRA COLLECTION</p><h1>とびらくんの装飾ガチャ</h1>
   <p className="gacha-lead">コインで<strong>ランダム抽選</strong>。選んで買うなら<wbr/>「ショップ」へ</p>
  </header>

  {!busyView && featured.hero && <section className="gacha-featured" aria-labelledby="gacha-featured-title" data-gacha-featured>
    <h2 id="gacha-featured-title" className="gacha-step">今回の注目アイテム<small>毎週月曜に入れ替え</small></h2>
    <article className="gacha-hero" data-rarity="UR" data-gacha-hero aria-label={`今回の目玉 UR ${featured.hero.item.label}`}>
      <span className="gacha-hero-art"><ItemArt item={featured.hero.item} progress={progress} size={52}/></span>
      <span className="gacha-hero-body">
        <span className="gacha-hero-top"><RarityTag rarity="UR"/><em>これが今回の目玉！</em></span>
        <strong>{featured.hero.item.label}</strong>
        <small>1種あたり {pct(featured.hero.rate)}%{progress?.owned.includes(featured.hero.item.id) ? ' · 所持済み' : ''}</small>
      </span>
    </article>
  </section>}

  <div className={`gacha-machine gacha-preview-stage ${busy?'is-spinning':''}`} aria-label="厳選UR（大当たり）10種" data-gacha-showcase>
    <span className="gacha-preview-tag">厳選UR 10</span>
    <button type="button" className="gacha-preview-prev" aria-label="前の厳選URを見る" disabled={busy} onClick={()=>setPreviewIndex(i=>(i+showcase.length-1)%showcase.length)}><ChevronLeft /></button>
    <div className="gacha-exhibit" data-kind={previewItem.kind}><ItemArt item={previewItem} progress={progress} size={previewItem.kind==='print'?64:88}/></div>
    <button type="button" className="gacha-preview-next" aria-label="次の厳選URを見る" disabled={busy} onClick={()=>setPreviewIndex(i=>(i+1)%showcase.length)}><ChevronRight /></button>
    <div className="gacha-preview-info" aria-live="polite"><strong><RarityTag rarity={gachaRarityOf(previewItem)}/> {previewItem.label}</strong><span>{previewIndex+1} / {showcase.length} · {pct(gachaItemRate(previewItem))}%</span></div>
  </div>

  <div className="gacha-wallet" data-gacha-wallet>
   
   <p className="gacha-balance" aria-label={`所持 ${progress?.coins ?? 0} マナコイン`}><Coins size={20} aria-hidden="true"/><span className="gacha-balance-word">所持</span><b>{progress?.coins ?? '—'}</b>マナコイン</p>
   {collectionLine}
  </div>

  {/* 2026-09-30 確定演出：青→金→虹→大当たり と上がり、引いたレア度で止まる（それより上の色は出さない） */}
  {revealing && bestRarity ? <GachaReveal key={revealKey} rarity={bestRarity} onDone={()=>setRevealing(false)} />
   : result ? <div className="gacha-result gacha-outcome" role="status" data-rarity={result.rarity} data-gacha-result>{(result.rarity==='UR'||result.rarity==='SR') && <span className="gacha-result-halo" aria-hidden="true"/>}
    {/* ★C10・C11 結果の順★ レア度 → アイテム → 名前 → コレクションに追加。URは大きく、でも点滅させない */}
    <p className="gacha-reveal-rarity"><RarityTag rarity={result.rarity} size={result.rarity==='UR'||result.rarity==='SR'?'xl':'lg'}/><RarityStars count={RARITY_STARS[result.rarity]}/>{result.rarity==='UR'?<span>大当たり！</span>:result.rarity==='SR'?<span>スーパーレア！</span>:null}</p>
    <div className="gacha-result-art" data-kind={result.item.kind}><ItemArt item={result.item} progress={progress} size={result.item.kind==='print'?96:120}/></div>
    <h2 className="gacha-reveal-name">{result.item.label}</h2>
    <p className="gacha-reveal-collect">{result.duplicate
      ? <><Badge tone="muted">もう持っている</Badge>{freeResult ? '無料抽選のためコイン返還はありません' : `${result.refund} マナコイン返還（実質 ${GACHA_COST-result.refund}枚）`}</>
      : <><Badge tone="new">NEW</Badge>{result.item.kind==='print'?'マイプリントに追加！':'コレクションに追加！'}</>}</p>
    {collectionLine}
    <div className="gacha-reveal-actions">
     {result.item.kind==='print' ? <PrintLinks item={result.item}/> : <button type="button" onClick={async()=>{if(await equip(result.item.id))setError('装備しました。ホームと対戦に反映されます。');else setError('装備を保存できませんでした。');}}>この装飾をつける</button>}
     <button type="button" onClick={()=>{setResult(null);setError('');}}>抽選画面にもどる</button>
    </div></div>
   : multi ? <div className="gacha-result gacha-multi-result" role="status" data-gacha-multi data-rarity={bestOf(multi)}>
      <p className="gacha-reveal-rarity"><span className="gacha-multi-best">いちばん</span><RarityTag rarity={bestOf(multi)} size="lg"/><RarityStars count={RARITY_STARS[bestOf(multi)]}/><span>{GACHA_MULTI_COUNT}連 · NEW {multi.filter(r=>!r.duplicate).length}種</span></p>
      <ul className="gacha-multi-grid">{multi.map((r,i)=><ItemCard as="li" key={`${r.item.id}:${i}`} rarity={r.rarity} isNew={!r.duplicate} data-new={!r.duplicate} style={{animationDelay:`${i*0.18}s`}}
        art={<ItemArt item={r.item} progress={progress} size={r.item.kind==='print'?44:60}/>} title={r.item.label} sub={r.duplicate?`重複 +${r.refund}枚`:undefined}>
        {r.item.kind==='print' ? <PrintLinks item={r.item} compact/> : !r.duplicate && <button type="button" onClick={async()=>{if(await equip(r.item.id))setError(`${r.item.label}を装備しました。`);else setError('装備を保存できませんでした。');}}>つける</button>}
      </ItemCard>)}</ul>
      <p className="gacha-reveal-collect">{multi.some(r=>!r.duplicate)?<><Badge tone="new">NEW</Badge>{multi.filter(r=>!r.duplicate).length}種をコレクションに追加！</>:'すべて持っているものでした'}{multi.some(r=>r.duplicate) && ` · 重複分 ${multi.reduce((n,r)=>n+r.refund,0)}枚返還`}</p>
      {collectionLine}
      <button type="button" onClick={()=>{setMulti(null);setError('');}}>抽選画面にもどる</button></div>
    : confirmMulti ? <div className="gacha-confirm" role="group" aria-label="10＋1連ガチャ購入確認"><p>{multiCost}マナコインを使って{GACHA_MULTI_COUNT}回まとめて引きますか？<br/><small>10＋1連は R 以上が1つ以上確定</small></p><button type="button" disabled={busy} onClick={()=>void drawMulti()}>{multiCost}枚で確定する</button><button type="button" onClick={()=>setConfirmMulti(false)}>キャンセル</button></div>
    : confirm ? <div className="gacha-confirm" role="group" aria-label="ガチャ購入確認"><p>{GACHA_COST}マナコインを使って1回引きますか？</p><button type="button" disabled={busy} onClick={()=>void draw()}>{GACHA_COST}枚で確定する</button><button type="button" onClick={()=>setConfirm(false)}>キャンセル</button></div>
    : <div className="gacha-pulls" data-gacha-pulls>
       
       <button type="button" className="gacha-pull" disabled={busy || !progress || progress.coins<GACHA_COST} onClick={()=>setConfirm(true)}><Gift size={20} aria-hidden="true"/><span>1回引く<small>{GACHA_COST}枚</small></span></button>
       <button type="button" className="gacha-pull gacha-pull-multi" disabled={busy || !progress || progress.coins<multiCost} onClick={()=>setConfirmMulti(true)} data-gacha-multi-pull><Gift size={20} aria-hidden="true"/><span>10＋1連<small>{multiCost}枚・R以上1つ確定</small></span></button>
       <button type="button" className="gacha-pull gacha-pull-video" disabled={busy || !progress || videoLeft === 0} onClick={()=>void startFree()} data-video-gacha data-ad-mode={adMode ? 'rewarded' : 'clip'}><PlayCircle size={20} aria-hidden="true"/><span>動画で1回<small>無料・今日あと{videoLeft} / {VIDEO_GACHA_DAILY_LIMIT}回</small></span></button>
      </div>}
  {videoOpen && <RewardVideo onCancel={()=>setVideoOpen(false)} onComplete={async token=>{ setVideoOpen(false); await drawFree(token); }}/>}
  {error && <p role="status" className="gacha-message">{error}</p>}
  {!busyView && <div className="gacha-foot">
   {progress && progress.coins<GACHA_COST && <button type="button" className="gacha-foot-link" onClick={onMissions}><Target size={16} aria-hidden="true"/>ミッションでコインをためる</button>}
   <button type="button" className="gacha-odds-toggle gacha-foot-link" aria-haspopup="dialog" onClick={()=>oddsDialog.current?.showModal()}>提供割合・コレクション</button>
  </div>}
  <div className="gacha-collection-meter" aria-label={`コレクション ${ownedCount}/${items.length}種類`} hidden><progress value={ownedCount} max={items.length} aria-label="装飾の収集状況" /></div>
  <dialog ref={oddsDialog} className="game-details-dialog mt-dialog" aria-labelledby="gacha-odds-title">
    <header><h2 id="gacha-odds-title">装飾コレクション・提供割合</h2><button type="button" autoFocus onClick={()=>oddsDialog.current?.close()}>閉じる</button></header>
    <div className="game-details-body gacha-odds">
      <p>ショップは欲しい装飾を選んでコイン交換。ガチャはランダム抽選です。どちらで獲得したものもマイページに集まり、PDFは「マイPDF」で開けます。</p><p>全{items.length}種類。まず<strong>レア度</strong>を抽選（UR {pct(GACHA_RARITY_RATES.UR)}%・SR {pct(GACHA_RARITY_RATES.SR)}%・R {pct(GACHA_RARITY_RATES.R)}%・N {pct(GACHA_RARITY_RATES.N)}%）し、同じレア度の中から等確率で1つ出ます。<strong>UR（大当たり）は学習プリント{tiers.UR.length}種</strong>で、1種あたり約{pct(GACHA_RARITY_RATES.UR/Math.max(1,tiers.UR.length))}%。<strong>10＋1連は最後の1回が「R以上確定」</strong>（それまでにR以上が出ていなければ、UR {pct(GACHA_RARITY_RATES.UR/(1-GACHA_RARITY_RATES.N))}%・SR {pct(GACHA_RARITY_RATES.SR/(1-GACHA_RARITY_RATES.N))}%・R {pct(GACHA_RARITY_RATES.R/(1-GACHA_RARITY_RATES.N))}% で抽選）。重複は N {GACHA_DUPLICATE_REFUND_BY_RARITY.N}枚・R {GACHA_DUPLICATE_REFUND_BY_RARITY.R}枚・SR {GACHA_DUPLICATE_REFUND_BY_RARITY.SR}枚・UR {GACHA_DUPLICATE_REFUND_BY_RARITY.UR}枚返還。課金・換金なし／天井なし。UR・SR はガチャ限定です。フレームや一部ポーズはショップ交換・レベル・称号でも獲得できます。学習プリントの問題・正解はアプリ内の問題（確認済み）から作っています。</p>
      <div className="gacha-collection-filters gacha-collection-kinds" role="group" aria-label="種類で切り替える">{COLLECTION_KINDS.map(k=><button key={k.id} type="button" aria-pressed={collectionKind===k.id} onClick={()=>setCollectionKind(k.id)}>{k.label} {items.filter(k.match).length}</button>)}</div>
      <div className="gacha-collection-filters" role="group" aria-label="所持状況で絞り込む">{([['all','すべて'],['owned','所持済み'],['missing','未所持']] as const).map(([id,label])=><button key={id} type="button" aria-pressed={collectionFilter===id} onClick={()=>setCollectionFilter(id)}>{label}</button>)}</div>
      <ul className="gacha-collection-grid" data-kind={collectionKind}>{collectionList.filter(item=>collectionFilter==='all'||(collectionFilter==='owned')===!!progress?.owned.includes(item.id)).map(item=>{
        const owned=!!progress?.owned.includes(item.id);
        return <li key={item.id} data-owned={owned}>
          <ItemArt item={item} progress={progress} size={item.kind==='print'?64:76}/>
          <strong><RarityTag rarity={gachaRarityOf(item)}/> {item.label}</strong><span>{owned?'所持済み':'未所持'} · {pct(gachaItemRate(item))}%</span>
          {owned && item.kind==='print' && <PrintLinks item={item} compact/>}
        </li>;
      })}</ul>
      {(()=>{const list=collectionList;const n=list.filter(item=>progress?.owned.includes(item.id)).length;
        return <>{collectionFilter==='missing' && n===list.length && <p>全種類コレクション済みです。</p>}
        {collectionFilter==='owned' && n===0 && <p>{collectionKind==='print'?'まだ学習プリントを持っていません。大当たり（UR）で出ます。':'まだガチャ対象の装飾を持っていません。'}</p>}</>;})()}
      <p>プレビューは装備・コインを変更しません。装飾はこのブラウザのアカウントごとに保存されます。強さは変わりません。</p>
    </div>
  </dialog>
 </section>;
}
