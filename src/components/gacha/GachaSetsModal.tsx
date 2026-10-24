/**
 * ガチャの「セット収集」と「かけら交換」のダイアログ（2026-10-23 やり込み強化）。
 *   ・セット：テーマごとに4つ。そろうと称号＋限定フレーム（gachaSets.ts）
 *   ・かけら交換：ダブりで貯まる「とびらのかけら」で、未所持の景品を選んで交換（天井の代わり）
 * ガチャ画面を1画面に収めるため、どちらもダイアログの中に置く（UI原則1）。
 */
import { useState, type RefObject } from 'react';
import { Check, Gem } from 'lucide-react';
import { gachaRarityOf, itemById, type GrowthProgress, type ItemDef } from '../../battle/core/growth';
import { gachaItems, shardCostOf } from '../../battle/core/arenaEconomy';
import { GACHA_SETS, SETS_FOR_COLLECTOR, SHARDS_PER_DUPLICATE, completedSetCount, setProgress } from '../../battle/core/gachaSets';
import { exchangeShardItem } from '../../battle/data/growthStore';
import { confirmAction } from '../../utils/dialog';
import { ItemArt, RarityTag } from '../GachaParts';

type Tab = 'sets' | 'shards';

export function GachaSetsModal({ dialog, progress }: { dialog: RefObject<HTMLDialogElement | null>; progress: GrowthProgress | null }) {
  const [tab, setTab] = useState<Tab>('sets');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const owned = progress?.owned ?? [];
  const shards = progress?.shards ?? 0;
  const done = completedSetCount(owned);
  // 交換できるのは、ガチャで出る装飾のうち未所持のもの（学習プリントは除く）。安い順
  const exchangeable = gachaItems()
    .filter((i) => i.gacha && i.kind !== 'print' && !owned.includes(i.id))
    .sort((a, b) => shardCostOf(a) - shardCostOf(b));

  const exchange = async (item: ItemDef) => {
    if (busy || !confirmAction(`とびらのかけら ${shardCostOf(item)} 個で「${item.label}」と交換しますか？`)) return;
    setBusy(true); setMessage('');
    try {
      const r = await exchangeShardItem(item.id);
      if (!r) setMessage('保存できませんでした。');
      else if (!r.ok) setMessage(r.reason ?? '交換できませんでした。');
      else setMessage(`${item.label}を手に入れて装備しました。${r.sets.length ? ` セット完成！（${r.sets.join('・')}）` : ''}`);
    } finally { setBusy(false); }
  };

  return (
    <dialog ref={dialog} className="game-details-dialog mt-dialog" aria-labelledby="gacha-sets-title" data-gacha-sets-dialog>
      <header>
        <h2 id="gacha-sets-title">セット収集・かけら交換</h2>
        <button type="button" autoFocus onClick={() => dialog.current?.close()}>閉じる</button>
      </header>
      <div className="game-details-body gacha-odds gacha-sets">
        <div className="gacha-collection-filters" role="tablist" aria-label="切り替え">
          <button type="button" role="tab" aria-selected={tab === 'sets'} aria-pressed={tab === 'sets'} onClick={() => setTab('sets')}>
            セット {done}/{GACHA_SETS.length}
          </button>
          <button type="button" role="tab" aria-selected={tab === 'shards'} aria-pressed={tab === 'shards'} onClick={() => setTab('shards')} data-shard-tab>
            <Gem size={14} aria-hidden="true" /> かけら {shards}
          </button>
        </div>
        {message && <p role="status" className="gacha-message">{message}</p>}

        {tab === 'sets' ? (
          <>
            <p className="gacha-sets-lead">4つそろえると<b>称号</b>と<b>限定フレーム</b>。{SETS_FOR_COLLECTOR}セット完成で「コレクター」の虹フレーム。</p>
            <ul className="gacha-set-list">
              {GACHA_SETS.map((set) => {
                const p = setProgress(owned, set);
                const reward = itemById(set.reward);
                return (
                  <li key={set.id} data-done={p.done} data-gacha-set={set.id}>
                    <strong>{p.done && <Check size={14} aria-hidden="true" />}{set.label}<small>{p.have}/{p.total}</small></strong>
                    <span className="gacha-set-parts">
                      {set.items.map((id) => {
                        const it = itemById(id);
                        if (!it) return null;
                        const has = owned.includes(id);
                        return <span key={id} className="gacha-set-part" data-owned={has} title={`${it.label}${has ? '（所持）' : '（未所持）'}`}>
                          <ItemArt item={it} progress={progress} size={40} />
                        </span>;
                      })}
                    </span>
                    {reward && <em>報酬：{reward.label}</em>}
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <>
            <p className="gacha-sets-lead">
              ダブると貯まる（N {SHARDS_PER_DUPLICATE.N}・R {SHARDS_PER_DUPLICATE.R}・SR {SHARDS_PER_DUPLICATE.SR}・UR {SHARDS_PER_DUPLICATE.UR}・LR {SHARDS_PER_DUPLICATE.LR}）。
              未所持の装飾を<b>選んで</b>交換できます（学習プリントは対象外）。
            </p>
            {exchangeable.length === 0 ? <p>交換できる装飾はすべて持っています。</p> : (
              <ul className="gacha-collection-grid gacha-shard-grid">
                {exchangeable.map((item) => {
                  const cost = shardCostOf(item);
                  return (
                    <li key={item.id} data-shard-item={item.id}>
                      <ItemArt item={item} progress={progress} size={64} />
                      <strong><RarityTag rarity={gachaRarityOf(item)} /> {item.label}</strong>
                      <button type="button" disabled={busy || shards < cost} onClick={() => void exchange(item)}>
                        {shards < cost ? `あと${cost - shards}` : `かけら${cost}で交換`}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </dialog>
  );
}
