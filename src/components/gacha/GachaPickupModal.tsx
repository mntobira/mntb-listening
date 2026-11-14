/**
 * 「ピックアップ」ダイアログ（2026-10-27）。
 *   LR（予想問題）全種と、厳選UR 10種の「中身を少しだけ」見せる。
 *   画像は scripts/gacha-prints/build-previews.py が作る（ページの上半分だけ・下はぼかし）。
 *   リスニングの第1回は音声の試聴（問1だけ）もできる。
 *   ガチャの画面は1画面に収める決まりなので、一覧は画面には並べず、下のボタンからこのダイアログで開く。
 *
 * ★2026-11-04 整理（ご要望「PDF を入れるたびにピックアップ一覧が長くなって見にくい」）★
 *   ・LR と UR はタブで切り替える（縦に全部並べない）。
 *   ・LR は「地方の棚」（ショップの PDF と同じ printShelves.ts）で絞り込み、大学ごとにまとめる。
 *   ・長い大学名の一覧（lrNote）は「◯大学・◯冊」の短い説明にし、注意書きの大学名は開くと見える形に。
 */
import { useEffect, useState, type RefObject } from 'react';
import { gachaRarityOf, printOf, type GrowthProgress, type ItemDef } from '../../battle/core/growth';
import { gachaItemRate } from '../../battle/core/arenaEconomy';
import { GACHA_PREVIEWS } from '../../data/gachaPreviews.generated';
import { kyotsuAudioOf } from '../../data/kyotsuMockAudio';
import { RarityTag, pct } from '../GachaParts';
import { DEFAULT_GACHA_POOL, gachaPoolOf, selectableUniversityOf, type GachaPoolId } from '../../battle/core/gachaPools';
import { NIJI_DISCLAIMER, mockUniversityOf, nijiUniversityOf } from '../../data/nijiMockPrints';
import { PRINT_SHELVES, printShelfOf, type PrintShelfId } from '../../battle/core/printShelves';
import { KYOTSU_FREE_FULL_IDS } from '../../data/kyotsuMockPrints';
import { openFullPrint } from './openFullPrint';

/** ピックアップに出すアイテム（LR → UR の順。画像があるものだけ） */
export function pickupItems(items: readonly ItemDef[]): ItemDef[] {
  const ids = Object.keys(GACHA_PREVIEWS);
  const list = ids.map((id) => items.find((i) => i.id === id)).filter((i): i is ItemDef => !!i);
  return [...list.filter((i) => gachaRarityOf(i) === 'LR'), ...list.filter((i) => gachaRarityOf(i) !== 'LR')];
}

/** 大学名（学部・コースがあれば添える）。大学別の予想問題でなければ null */
export function pickupUnivLabel(id: string): string | null {
  const niji = nijiUniversityOf(id);
  if (niji) return niji.track ? `${niji.name}（${niji.track}）` : niji.name;
  return mockUniversityOf(id)?.name ?? null;
}

export interface PickupShelf {
  id: PrintShelfId;
  label: string;
  /** 大学ごとのまとまり（大学別でなければ label は null の1つだけ） */
  groups: { label: string | null; items: ItemDef[] }[];
  count: number;
}

/** LR を棚（地方）→ 大学の順にまとめる。棚の並びは PRINT_SHELVES の順、大学は最初に出てきた順 */
export function pickupShelves(lr: readonly ItemDef[]): PickupShelf[] {
  const out: PickupShelf[] = [];
  for (const sh of PRINT_SHELVES) {
    const inShelf = lr.filter((i) => {
      const p = printOf(i.id);
      return p ? printShelfOf(p) === sh.id : sh.id === 'other';
    });
    if (!inShelf.length) continue;
    const groups: PickupShelf['groups'] = [];
    for (const item of inShelf) {
      const label = pickupUnivLabel(item.id);
      const g = groups.find((x) => x.label === label);
      if (g) g.items.push(item);
      else groups.push({ label, items: [item] });
    }
    out.push({ id: sh.id, label: sh.label, groups, count: inShelf.length });
  }
  return out;
}

/** LR の短い説明（大学数・冊数）。大学別でなければ null */
export function pickupLrSummary(lr: readonly ItemDef[]): string | null {
  const univs = new Set(lr.map((i) => (nijiUniversityOf(i.id) ?? mockUniversityOf(i.id))?.name).filter(Boolean));
  return univs.size ? `${univs.size}大学・${lr.length}冊。地方を選ぶと、大学ごとに並びます。` : null;
}

function PickupItem({ item, progress, pool, univId }: { item: ItemDef; progress: GrowthProgress | null; pool: GachaPoolId; univId?: string }) {
  const print = printOf(item.id);
  const owned = !!progress?.owned.includes(item.id);
  const sample = kyotsuAudioOf(item.id)[0];
  return (
    <details className="gacha-pickup-item" data-gacha-pickup-item={item.id}>
      <summary>
        {print && <img src={print.thumb} alt="" loading="lazy" width={40} height={56} />}
        <span>
          <span className="gacha-pickup-meta">
            <RarityTag rarity={gachaRarityOf(item)} />
            {print ? `${print.pages}ページ` : ''} · {pct(gachaItemRate(item, 'N', pool, univId))}%{owned ? ' · 所持済み' : ''}
            {sample ? ' · 音声つき' : ''}
          </span>
          <strong>{item.label}</strong>
        </span>
        <em aria-hidden="true">少し見る</em>
      </summary>
      <div className="gacha-pickup-pages">
        {(GACHA_PREVIEWS[item.id] ?? []).map((src) => (
          <img key={src} src={src} alt={`${item.label} の一部（${src.match(/_p(\d+)\.webp$/)?.[1] ?? ''}ページ目の上半分）`} loading="lazy" />
        ))}
      </div>
      {sample && (
        <p className="gacha-pickup-audio">
          <span>試聴（問1）</span>
          <audio controls preload="none" src={sample.file} />
        </p>
      )}
    </details>
  );
}

export function GachaPickupModal({ dialog, items, progress, pool = DEFAULT_GACHA_POOL, univId }: {
  dialog: RefObject<HTMLDialogElement | null>;
  items: readonly ItemDef[];
  progress: GrowthProgress | null;
  pool?: GachaPoolId;
  univId?: string;
}) {
  const list = pickupItems(items);
  const def = gachaPoolOf(pool);
  const selectedUniv = pool === 'univ' ? selectableUniversityOf(univId) : null;
  // F5（2026-11-04）：共通テストガチャは、第1回（全文を見られる）を一番上に固定する
  const free = pool === 'kyotsu' ? KYOTSU_FREE_FULL_IDS.map((id) => printOf(id)).filter((p): p is NonNullable<typeof p> => !!p) : [];
  const lr = list.filter((i) => gachaRarityOf(i) === 'LR');
  const ur = list.filter((i) => gachaRarityOf(i) !== 'LR');
  const shelves = pickupShelves(lr);
  const summary = pickupLrSummary(lr);
  const [tab, setTab] = useState<'LR' | 'UR'>('LR');
  const [shelfId, setShelfId] = useState<PrintShelfId | null>(null);
  const shelf = shelves.find((s) => s.id === shelfId) ?? shelves[0];
  // 閉じたら試聴を止める（B案から採用：閉じても裏で鳴り続けないように）
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const stop = () => d.querySelectorAll('audio').forEach((a) => a.pause());
    d.addEventListener('close', stop);
    return () => d.removeEventListener('close', stop);
  }, [dialog]);
  return (
    <dialog ref={dialog} className="game-details-dialog mt-dialog" aria-labelledby="gacha-pickup-title" data-gacha-pickup>
      <header>
        <h2 id="gacha-pickup-title">{def.title} ピックアップ（中身を少し見る）</h2>
        <button type="button" autoFocus onClick={() => dialog.current?.close()}>
          閉じる
        </button>
      </header>
      <div className="game-details-body gacha-pickup">
        <p className="gacha-pickup-lead">ページの一部だけ見られます。全部は、ガチャで当てて「マイPDF」から。</p>
        {(pool === 'niji' || pool === 'univ') && (
          <details className="gacha-pickup-disclaimer" data-niji-disclaimer>
            <summary>※ 各大学の過去問・公式問題ではありません（予想問題）。収録している大学を見る</summary>
            <p className="gacha-detail-disclaimer">※ {NIJI_DISCLAIMER}</p>
          </details>
        )}
        {free.length > 0 && (
          <section className="gacha-pickup-free" aria-labelledby="gacha-pickup-free" data-gacha-free-full>
            <h3 id="gacha-pickup-free">第1回は全文を見られます</h3>
            <p>ここを押すと、全ページを見られます（ガチャで当てなくてOK）。見終わったら「‹ もどる」でこの画面に戻ります。</p>
            <ul>
              {free.map((p) => (
                <li key={p.id}>
                  <button type="button" className="gacha-pickup-free-btn" data-gacha-free-open={p.id} onClick={() => openFullPrint(p.id, dialog)}>
                    <img src={p.thumb} alt="" loading="lazy" width={40} height={56} />
                    <span>
                      <span className="gacha-pickup-meta"><RarityTag rarity="LR" />{p.pages}ページ{kyotsuAudioOf(p.id).length ? ' · 音声つき' : ''}</span>
                      <strong>{p.label}</strong>
                    </span>
                    <em>全文を見る</em>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        <div className="gacha-pickup-tabs" role="tablist" aria-label="レア度">
          {([['LR', `LR ${def.lrName}`, lr.length], ['UR', '厳選UR 完全版の本', ur.length]] as const).map(([id, label, n]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} data-pickup-tab={id} onClick={() => setTab(id)}>
              {label}<small>{n}</small>
            </button>
          ))}
        </div>
        {tab === 'LR' ? (
          <section className="gacha-pickup-group" aria-label={`LR ${def.lrName}`} data-pickup-panel="LR">
            <p>{selectedUniv ? `${selectedUniv.label}の全${lr.length}冊だけが LR で出ます。` : summary ?? def.lrNote}</p>
            {shelves.length > 1 && (
              <nav className="gacha-pickup-shelves" aria-label="地方の棚" data-pickup-shelves>
                {shelves.map((s) => (
                  <button key={s.id} type="button" aria-pressed={shelf?.id === s.id} data-shelf={s.id} onClick={() => setShelfId(s.id)}>
                    {s.label}<small>{s.count}</small>
                  </button>
                ))}
              </nav>
            )}
            {shelf?.groups.map((g) => (
              <div key={g.label ?? 'all'} className="gacha-pickup-univ">
                {g.label && <h3>{g.label}<small>{g.items.length}冊</small></h3>}
                <ul>{g.items.map((item) => <li key={item.id}><PickupItem item={item} progress={progress} pool={pool} univId={univId} /></li>)}</ul>
              </div>
            ))}
          </section>
        ) : (
          <section className="gacha-pickup-group" aria-label="厳選UR 完全版の本" data-pickup-panel="UR">
            <p>大当たり（その一冊で完成する本）から、{def.title}で出るもの。</p>
            <ul>{ur.map((item) => <li key={item.id}><PickupItem item={item} progress={progress} pool={pool} univId={univId} /></li>)}</ul>
          </section>
        )}
      </div>
    </dialog>
  );
}
