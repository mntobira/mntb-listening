/**
 * ガチャの「アイテムの詳細」窓（2026-10-28 A10・モンストのガチャのように、絵を押すと中身が出る）。
 *   バナーの目玉・ピックアップの絵を押すと開く。レア度・名前・ページ数・1種あたりの割合・所持、
 *   PDFは2ページ分の上半分だけ（下はぼかし）、リスニング第1回は問1の試し聞き。
 *   ピックアップは週ごとに入れ替える（LR と UR を混ぜる。いつも同じ UR にならない）。
 */
import { useEffect, type RefObject } from 'react';
import { gachaItemRate } from '../../battle/core/arenaEconomy';
import { gachaRarityOf, printOf, type GrowthProgress, type ItemDef } from '../../battle/core/growth';
import { GACHA_PREVIEWS } from '../../data/gachaPreviews.generated';
import { kyotsuAudioOf } from '../../data/kyotsuMockAudio';
import { mockUniversityOf, nijiDisclaimerFor } from '../../data/nijiMockPrints';
import { DEFAULT_GACHA_POOL, type GachaPoolId } from '../../battle/core/gachaPools';
import { ItemArt, RarityTag, pct } from '../GachaParts';

/** 週番号を種にした決まった並べ替え（全員同じ・保存も乱数も使わない） */
function rotate<T>(list: readonly T[], seed: number): T[] {
  if (!list.length) return [];
  const step = Math.abs(seed * 7919) % list.length;
  return [...list.slice(step), ...list.slice(0, step)];
}

/** 今週の目玉：偶数週は LR（共通テスト予想問題）、奇数週は UR（完全版の本）。いつも UR にならない（2026-10-28 見直し） */
export function weeklyHero(items: readonly ItemDef[], week: number, urHero: ItemDef | null): ItemDef | null {
  if (week % 2 === 0) {
    const lr = rotate(Object.keys(GACHA_PREVIEWS).map((id) => items.find((i) => i.id === id)).filter((i): i is ItemDef => !!i && gachaRarityOf(i) === 'LR'), week / 2);
    if (lr[0]) return lr[0];
  }
  return urHero;
}

/** 今週のピックアップ：中身を見られるもの（LR・厳選UR）から LR 2つ＋UR 3つ。目玉（hero）とは重ねない */
export function weeklyPickup(items: readonly ItemDef[], week: number, heroId?: string, lrCount = 2, urCount = 3): ItemDef[] {
  const pool = Object.keys(GACHA_PREVIEWS).map((id) => items.find((i) => i.id === id)).filter((i): i is ItemDef => !!i && i.id !== heroId);
  const lr = rotate(pool.filter((i) => gachaRarityOf(i) === 'LR'), week).slice(0, lrCount);
  const ur = rotate(pool.filter((i) => gachaRarityOf(i) === 'UR'), week + 3).slice(0, urCount);
  return [...lr, ...ur];
}

/** 今週の終わり（日曜）の「10/31（日）まで」 */
export function weekEndLabel(week: number): string {
  const end = new Date(Date.UTC(2026, 0, 5) + ((week + 1) * 7 - 1) * 86400000);
  return `${end.getUTCMonth() + 1}/${end.getUTCDate()}（日）まで`;
}

export function GachaItemDetail({ dialog, item, progress, pool = DEFAULT_GACHA_POOL }: {
  dialog: RefObject<HTMLDialogElement | null>;
  item: ItemDef | null;
  progress: GrowthProgress | null;
  pool?: GachaPoolId;
}) {
  const nijiUniv = item ? mockUniversityOf(item.id) : undefined;
  const print = item ? printOf(item.id) : undefined;
  const pages = item ? GACHA_PREVIEWS[item.id] ?? [] : [];
  const sample = item ? kyotsuAudioOf(item.id)[0] : undefined;
  const owned = !!item && !!progress?.owned.includes(item.id);
  // 閉じたら試し聞きを止める
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const stop = () => d.querySelectorAll('audio').forEach((a) => a.pause());
    d.addEventListener('close', stop);
    return () => d.removeEventListener('close', stop);
  }, [dialog]);
  return (
    <dialog ref={dialog} className="game-details-dialog mt-dialog gacha-detail" aria-labelledby="gacha-detail-title" data-gacha-detail>
      <header>
        <h2 id="gacha-detail-title">アイテムの詳細</h2>
        <button type="button" autoFocus onClick={() => dialog.current?.close()}>閉じる</button>
      </header>
      {item && <div className="game-details-body gacha-detail-body" key={item.id}>
        <div className="gacha-detail-head">
          <span className="gacha-detail-art"><ItemArt item={item} progress={progress} size={72} /></span>
          <div>
            <RarityTag rarity={gachaRarityOf(item)} />
            <strong>{item.label}</strong>
            <small>
              {print ? `${print.category} · ${print.pages}ページ · ` : ''}1種あたり {pct(gachaItemRate(item, 'N', pool))}%
              {sample ? ' · 音声つき' : ''}{owned ? ' · 所持済み' : ''}
            </small>
          </div>
        </div>
        {pages.length > 0 && <div className="gacha-detail-pages" aria-label="中身の一部">
          {pages.map((src) => <img key={src} src={src} loading="lazy" alt={`${item.label} の一部（${src.match(/_p(\d+)\.webp$/)?.[1] ?? ''}ページ目の上半分）`} />)}
        </div>}
        {sample && <p className="gacha-detail-audio"><span>試し聞き（{sample.label}）</span><audio controls preload="none" src={sample.file} /></p>}
        {nijiUniv && <p className="gacha-detail-disclaimer" data-niji-disclaimer>※ {nijiDisclaimerFor(nijiUniv.name)}</p>}
        <p className="gacha-detail-note">{pages.length ? '見られるのは一部の上半分だけ。全部はガチャで当てると「マイPDF」で保存できます。' : print ? 'ガチャで当てると「マイPDF」で保存できます。' : 'ガチャで当てると、とびら君に装備できます。'}</p>
      </div>}
    </dialog>
  );
}
