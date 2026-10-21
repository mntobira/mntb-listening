/**
 * 「装飾コレクション・提供割合」のダイアログ（C-06）。
 * GachaRoom.tsx から JSX をそのまま移した（DOM・クラス名・文言は1文字も変えていない）。
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
import { gachaRarityOf, type GachaRarity, type GrowthProgress, type ItemDef } from '../../battle/core/growth';
import { COLLECTION_KINDS, ItemArt, PrintLinks, RarityTag, pct, type CollectionKind } from '../GachaParts';

export function GachaCollectionModal({ oddsDialog, items, tiers, progress }: {
  oddsDialog: RefObject<HTMLDialogElement | null>;
  items: ItemDef[];
  tiers: Record<GachaRarity, ItemDef[]>;
  progress: GrowthProgress | null;
}) {
  const [collectionFilter, setCollectionFilter] = useState<'all' | 'owned' | 'missing'>('all');
  const [collectionKind, setCollectionKind] = useState<CollectionKind>('body');
  const collectionList = items.filter(COLLECTION_KINDS.find((k) => k.id === collectionKind)!.match);
  return (
    <dialog ref={oddsDialog} className="game-details-dialog mt-dialog" aria-labelledby="gacha-odds-title">
      <header>
        <h2 id="gacha-odds-title">装飾コレクション・提供割合</h2>
        <button type="button" autoFocus onClick={() => oddsDialog.current?.close()}>
          閉じる
        </button>
      </header>
      <div className="game-details-body gacha-odds">
        <section className="gacha-odds-summary" aria-label="入手方法の要点">
          <strong>入手方法</strong>
          <p>ショップは選んで交換、ガチャはランダム。獲得した装飾は「持ちもの」へ、PDFは「マイPDF」へ。</p>
        </section>
        <section className="gacha-odds-section" aria-labelledby="gacha-rates-heading">
          <h3 id="gacha-rates-heading">抽選の割合</h3>
          <p>全{items.length}種類。まずレア度を抽選し、同じレア度の中から等確率で1つ出ます。</p>
          <ul className="gacha-odds-rate-list" aria-label="レア度ごとの提供割合">
            <li><RarityTag rarity="UR" /><b>{pct(GACHA_RARITY_RATES.UR)}%</b></li>
            <li><RarityTag rarity="SR" /><b>{pct(GACHA_RARITY_RATES.SR)}%</b></li>
            <li><RarityTag rarity="R" /><b>{pct(GACHA_RARITY_RATES.R)}%</b></li>
            <li><RarityTag rarity="N" /><b>{pct(GACHA_RARITY_RATES.N)}%</b></li>
          </ul>
          <p>URは学習プリント{tiers.UR.length}種。1種あたり約{pct(GACHA_RARITY_RATES.UR / Math.max(1, tiers.UR.length))}%です。</p>
        </section>
        <section className="gacha-odds-section" aria-labelledby="gacha-multi-heading">
          <h3 id="gacha-multi-heading">10＋1連</h3>
          <p>最後の1回はR以上確定。それまでにR以上が出ていない場合の割合：</p>
          <ul className="gacha-odds-bonus-rates">
            <li>UR <b>{pct(GACHA_RARITY_RATES.UR / (1 - GACHA_RARITY_RATES.N))}%</b></li>
            <li>SR <b>{pct(GACHA_RARITY_RATES.SR / (1 - GACHA_RARITY_RATES.N))}%</b></li>
            <li>R <b>{pct(GACHA_RARITY_RATES.R / (1 - GACHA_RARITY_RATES.N))}%</b></li>
          </ul>
        </section>
        <section className="gacha-odds-section" aria-labelledby="gacha-notes-heading">
          <h3 id="gacha-notes-heading">重複・入手条件</h3>
          <p>重複分はコインで返還：N {GACHA_DUPLICATE_REFUND_BY_RARITY.N}枚、R {GACHA_DUPLICATE_REFUND_BY_RARITY.R}枚、SR {GACHA_DUPLICATE_REFUND_BY_RARITY.SR}枚、UR {GACHA_DUPLICATE_REFUND_BY_RARITY.UR}枚。</p>
          <p>課金・換金・天井はありません。UR・SRはガチャ限定。一部のフレームやポーズはショップ・レベル・称号でも獲得できます。</p>
          <p>学習プリントは、アプリ内で確認済みの問題から作成しています。装飾で対戦の強さは変わりません。</p>
        </section>
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
              onClick={() => setCollectionKind(k.id)}
            >
              {k.label} {items.filter(k.match).length}
            </button>
          ))}
        </div>
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
        <ul className="gacha-collection-grid" data-kind={collectionKind}>
          {collectionList
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
                    {owned ? '所持済み' : '未所持'} · {pct(gachaItemRate(item))}%
                  </span>
                  {owned && item.kind === 'print' && <PrintLinks item={item} compact />}
                </li>
              );
            })}
        </ul>
        {(() => {
          const list = collectionList;
          const n = list.filter((item) => progress?.owned.includes(item.id)).length;
          return (
            <>
              {collectionFilter === 'missing' && n === list.length && <p>全種類コレクション済みです。</p>}
              {collectionFilter === 'owned' && n === 0 && (
                <p>
                  {collectionKind === 'print'
                    ? 'まだ学習プリントを持っていません。大当たり（UR）で出ます。'
                    : 'まだガチャ対象の装飾を持っていません。'}
                </p>
              )}
            </>
          );
        })()}
        <p>
          プレビューは装備・コインを変更しません。装飾はこのブラウザのアカウントごとに保存されます。強さは変わりません。
        </p>
      </div>
    </dialog>
  );
}
