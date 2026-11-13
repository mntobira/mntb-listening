/**
 * 「装飾コレクション・提供割合」のダイアログ（C-06）。
 * GachaRoom.tsx から JSX をそのまま移した（DOM・クラス名・文言は1文字も変えていない）。
 *
 * ★2026-11-04 整理（ご要望「PDF を入れるたびに提供割合の一覧が長くなって見にくい」）★
 *   ・「割合・ルール」と「コレクション」をタブで分けた（縦に全部並べない）。重複・入手条件は開くと見える形に。
 *   ・学習プリントの一覧は、ショップと同じ棚（printShelves.ts：共通テスト・2次は地方ごと・教科）で絞り込む。
 *
 * ★種類・所持状況の切り替え（collectionKind / collectionFilter）はここで持つ★
 *   どちらもこのダイアログの中でしか使わない。ダイアログは常に描画されている（開閉は showModal / close）ので、
 *   親で持っていたときと同じく、閉じて開き直しても選んだ切り替えは残る。
 */
import { useState, type RefObject } from 'react';
import {
  GACHA_DUPLICATE_REFUND_BY_RARITY,
  GACHA_RARITY_RATES,
  gachaItemRate,
} from '../../battle/core/arenaEconomy';
import { gachaRarityOf, printOf, type GachaRarity, type GrowthProgress, type ItemDef } from '../../battle/core/growth';
import { PRINT_SHELVES, printShelfOf, type PrintShelfId } from '../../battle/core/printShelves';
import { COLLECTION_KINDS, ItemArt, PrintLinks, RarityTag, pct, type CollectionKind } from '../GachaParts';
import { DEFAULT_GACHA_POOL, gachaPoolOf, selectableUniversityOf, type GachaPoolId } from '../../battle/core/gachaPools';
import { availableCollectionRarities, filterCollectionByRarity, type CollectionRarityFilter } from './collectionFilters';

export function GachaCollectionModal({ oddsDialog, items, tiers, progress, pool = DEFAULT_GACHA_POOL, univId }: {
  oddsDialog: RefObject<HTMLDialogElement | null>;
  items: ItemDef[];
  tiers: Record<GachaRarity, ItemDef[]>;
  progress: GrowthProgress | null;
  pool?: GachaPoolId;
  univId?: string;
}) {
  const def = gachaPoolOf(pool);
  const selectedUniv = pool === 'univ' ? selectableUniversityOf(univId) : null;
  const [collectionFilter, setCollectionFilter] = useState<'all' | 'owned' | 'missing'>('all');
  const [collectionKind, setCollectionKind] = useState<CollectionKind>('body');
  const [tab, setTab] = useState<'odds' | 'collection'>('odds');
  const [shelf, setShelf] = useState<PrintShelfId | 'all'>('all');
  const [collectionRarity, setCollectionRarity] = useState<CollectionRarityFilter>('all');
  const kindList = items.filter(COLLECTION_KINDS.find((k) => k.id === collectionKind)!.match);
  const shelfOfItem = (i: ItemDef): PrintShelfId | null => { const p = printOf(i.id); return p ? printShelfOf(p) : null; };
  const shelfCount = new Map<PrintShelfId, number>();
  if (collectionKind === 'print') for (const i of kindList) { const sh = shelfOfItem(i); if (sh) shelfCount.set(sh, (shelfCount.get(sh) ?? 0) + 1); }
  // 棚（地方・教科）で絞ったあと、さらにレア度で絞る（#176 のレア度ボタンと両立）
  const collectionList = collectionKind === 'print' && shelf !== 'all' ? kindList.filter((i) => shelfOfItem(i) === shelf) : kindList;
  const rarityOptions = collectionKind === 'print' ? availableCollectionRarities(collectionList) : [];
  const rarityFilteredList = filterCollectionByRarity(collectionList, collectionRarity);
  return (
    <dialog ref={oddsDialog} className="game-details-dialog mt-dialog" aria-labelledby="gacha-odds-title">
      <header>
        <h2 id="gacha-odds-title">{def.title} コレクション・提供割合</h2>
        <button type="button" autoFocus onClick={() => oddsDialog.current?.close()}>
          閉じる
        </button>
      </header>
      <div className="game-details-body gacha-odds">
        <div className="gacha-odds-tabs" role="tablist" aria-label="表示の切り替え">
          <button type="button" role="tab" aria-selected={tab === 'odds'} data-odds-tab="odds" onClick={() => setTab('odds')}>割合・ルール</button>
          <button type="button" role="tab" aria-selected={tab === 'collection'} data-odds-tab="collection" onClick={() => setTab('collection')}>コレクション<small>{items.length}</small></button>
        </div>
        {tab === 'odds' && <>
        <section className="gacha-odds-summary" aria-label="入手方法の要点">
          <strong>入手方法</strong>
          <p>ショップは選んで交換、ガチャはランダム。獲得した装飾は「持ちもの」へ、PDFは「マイPDF」へ。</p>
        </section>
        <section className="gacha-odds-section" aria-labelledby="gacha-rates-heading">
          <h3 id="gacha-rates-heading">抽選の割合</h3>
          <p>{def.title}{selectedUniv ? `（${selectedUniv.label}）` : ''}は全{items.length}種類。まずレア度を抽選し、同じレア度の中から等確率で1つ出ます。割合はどのガチャでも同じです（中身が違います）。</p>
          <ul className="gacha-odds-rate-list" aria-label="レア度ごとの提供割合">
            <li><RarityTag rarity="LR" /><b>{pct(GACHA_RARITY_RATES.LR)}%</b></li>
            <li><RarityTag rarity="UR" /><b>{pct(GACHA_RARITY_RATES.UR)}%</b></li>
            <li><RarityTag rarity="SR" /><b>{pct(GACHA_RARITY_RATES.SR)}%</b></li>
            <li><RarityTag rarity="R" /><b>{pct(GACHA_RARITY_RATES.R)}%</b></li>
            <li><RarityTag rarity="N" /><b>{pct(GACHA_RARITY_RATES.N)}%</b></li>
          </ul>
          <p>LRは{selectedUniv ? `${selectedUniv.label}の予想問題` : def.lrName}{tiers.LR.length}種（1種あたり約{pct(GACHA_RARITY_RATES.LR / Math.max(1, tiers.LR.length))}%）、URは「その一冊で完成する本」（完全版）{tiers.UR.length}種（1種あたり約{pct(GACHA_RARITY_RATES.UR / Math.max(1, tiers.UR.length))}%）です。単元ごとの学習プリントはSRで出ます。</p>
        </section>
        <section className="gacha-odds-section" aria-labelledby="gacha-multi-heading">
          <h3 id="gacha-multi-heading">10＋1連</h3>
          <p>最後の1回はR以上確定。それまでにR以上が出ていない場合の割合：</p>
          <ul className="gacha-odds-bonus-rates">
            <li>LR <b>{pct(GACHA_RARITY_RATES.LR / (1 - GACHA_RARITY_RATES.N))}%</b></li>
            <li>UR <b>{pct(GACHA_RARITY_RATES.UR / (1 - GACHA_RARITY_RATES.N))}%</b></li>
            <li>SR <b>{pct(GACHA_RARITY_RATES.SR / (1 - GACHA_RARITY_RATES.N))}%</b></li>
            <li>R <b>{pct(GACHA_RARITY_RATES.R / (1 - GACHA_RARITY_RATES.N))}%</b></li>
          </ul>
        </section>
        <details className="gacha-odds-section gacha-odds-rules">
          <summary id="gacha-notes-heading">重複・入手条件（開く）</summary>
          <p>重複分はコインで返還：N {GACHA_DUPLICATE_REFUND_BY_RARITY.N}枚、R {GACHA_DUPLICATE_REFUND_BY_RARITY.R}枚、SR {GACHA_DUPLICATE_REFUND_BY_RARITY.SR}枚、UR {GACHA_DUPLICATE_REFUND_BY_RARITY.UR}枚、LR {GACHA_DUPLICATE_REFUND_BY_RARITY.LR}枚。</p>
          <p>ダブりでは「とびらのかけら」も貯まり、未所持の装飾（学習プリント以外）と選んで交換できます。</p>
          <p>課金・換金はありません。LR・UR・SRはガチャ限定。一部のフレームやポーズはショップ・レベル・称号・セット完成でも獲得できます。</p>
          <p>学習プリントは、アプリ内で確認済みの問題から作成しています。装飾で対戦の強さは変わりません。</p>
        </details>
        </>}
        {tab === 'collection' && <>
        <div
          className="gacha-collection-filters gacha-collection-kinds"
          role="group"
          aria-label="種類で切り替える"
        >
          {COLLECTION_KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              aria-pressed={collectionKind === k.id}
              onClick={() => { setCollectionKind(k.id); setShelf('all'); setCollectionRarity('all'); }}
            >
              {k.label} {items.filter(k.match).length}
            </button>
          ))}
        </div>
        {collectionKind === 'print' && shelfCount.size > 1 && (
          <nav className="gacha-pickup-shelves" aria-label="PDFの棚" data-odds-shelves>
            {[{ id: 'all' as const, label: 'すべて' }, ...PRINT_SHELVES.filter((sh) => shelfCount.has(sh.id))].map((sh) => (
              <button key={sh.id} type="button" aria-pressed={shelf === sh.id} data-shelf={sh.id} onClick={() => { setShelf(sh.id); setCollectionRarity('all'); }}>
                {sh.label}{sh.id !== 'all' && <small>{shelfCount.get(sh.id)}</small>}
              </button>
            ))}
          </nav>
        )}
        {collectionKind === 'print' && (
          <div className="gacha-collection-filters gacha-collection-rarities" role="group" aria-label="PDFのレアリティで絞り込む">
            <button
              type="button"
              aria-pressed={collectionRarity === 'all'}
              onClick={() => setCollectionRarity('all')}
            >
              すべて {collectionList.length}
            </button>
            {rarityOptions.map((rarity) => {
              const count = filterCollectionByRarity(collectionList, rarity).length;
              return (
                <button
                  key={rarity}
                  type="button"
                  aria-label={`${rarity}のPDF ${count}件`}
                  aria-pressed={collectionRarity === rarity}
                  onClick={() => setCollectionRarity(rarity)}
                >
                  {rarity} {count}
                </button>
              );
            })}
          </div>
        )}
        <div className="gacha-collection-filters" role="group" aria-label="所持状況で絞り込む">
          {(
            [
              ['all', 'すべて'],
              ['owned', '所持済み'],
              ['missing', '未所持'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={collectionFilter === id}
              onClick={() => setCollectionFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <ul className="gacha-collection-grid" data-kind={collectionKind} data-rarity={collectionKind === 'print' ? collectionRarity : undefined}>
          {rarityFilteredList
            .filter(
              (item) =>
                collectionFilter === 'all' ||
                (collectionFilter === 'owned') === !!progress?.owned.includes(item.id),
            )
            .map((item) => {
              const owned = !!progress?.owned.includes(item.id);
              return (
                <li key={item.id} data-owned={owned}>
                  <ItemArt item={item} progress={progress} size={item.kind === 'print' ? 64 : 76} />
                  <strong>
                    <RarityTag rarity={gachaRarityOf(item)} /> {item.label}
                  </strong>
                  <span>
                    {owned ? '所持済み' : '未所持'} · {pct(gachaItemRate(item, 'N', pool, univId))}%
                  </span>
                  {owned && item.kind === 'print' && <PrintLinks item={item} compact />}
                </li>
              );
            })}
        </ul>
        {(() => {
          const list = rarityFilteredList;
          const n = list.filter((item) => progress?.owned.includes(item.id)).length;
          return (
            <>
              {collectionFilter === 'missing' && n === list.length && <p>全種類コレクション済みです。</p>}
              {collectionFilter === 'owned' && n === 0 && (
                <p>
                  {collectionKind === 'print'
                    ? 'まだ学習プリントを持っていません。SR（学習プリント）とUR（完全版の本）で出ます。'
                    : 'まだガチャ対象の装飾を持っていません。'}
                </p>
              )}
            </>
          );
        })()}
        </>}
        <p>
          プレビューは装備・コインを変更しません。装飾はこのブラウザのアカウントごとに保存されます。強さは変わりません。
        </p>
      </div>
    </dialog>
  );
}
