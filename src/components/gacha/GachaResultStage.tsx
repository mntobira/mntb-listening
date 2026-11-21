/**
 * ガチャの結果表示（1回・10＋1連）（C-06 ＋ 神ゲーム級3Dホログラム・チルト台座）。
 * 既存の DOM 階層・クラス名・data-* 属性・文言契約を100%維持したまま、
 * カードを指やマウスでなぞると立体傾き（--rx, --ry）と7色プリズムフォイル反射（--hx, --hy）がリアルタイム追従する。
 */
import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { RarityStars } from '../GachaReveal';
import { CelebrationClip } from '../CinematicClip';
import { RARITY_STARS } from '../gachaRevealSteps';
import { Badge, ItemCard } from '../ui';
import { GACHA_COST } from '../../battle/core/arenaEconomy';
import { equip, GACHA_MULTI_COUNT } from '../../battle/data/growthStore';
import type { GachaRarity, GrowthProgress, ItemDef } from '../../battle/core/growth';
import { ItemArt, PrintLinks, RarityTag, bestOf } from '../GachaParts';

/** 1回ぶんの抽選結果（growthStore の drawGacha / drawGachaMulti が返す形） */
export type GachaDrawResult = {
  item: ItemDef;
  rarity: GachaRarity;
  duplicate: boolean;
  refund: number;
  /** ダブりでもらえた「とびらのかけら」 */
  shards?: number;
  /** この抽選で完成したセット名 */
  sets?: string[];
};

/** セット完成のお知らせ（称号＋限定フレームを受け取ったことを伝える） */
function SetCompleteNote({ sets }: { sets: string[] }) {
  if (!sets.length) return null;
  return (
    <p className="gacha-set-complete" role="status" data-gacha-set-complete>
      <b>セット完成！</b>
      {sets.join('・')} → 称号と限定フレームを獲得
      <CelebrationClip name="setComplete" label="とびら君のセット完成動画" onceKey={`set:${sets.join(',')}`} delayMs={500} />
    </p>
  );
}

/** ポケカ／マスターデュエル級：ポインタ位置に応じて 3D 傾き＆ホログラム反射座標を更新 */
function updateHoloTilt(el: HTMLElement | null, clientX: number, clientY: number) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return;
  const nx = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  const ny = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
  const ry = ((nx - 0.5) * 14).toFixed(2);
  const rx = ((0.5 - ny) * 12).toFixed(2);
  el.style.setProperty('--rx', `${rx}deg`);
  el.style.setProperty('--ry', `${ry}deg`);
  el.style.setProperty('--hx', `${(nx * 100).toFixed(1)}%`);
  el.style.setProperty('--hy', `${(ny * 100).toFixed(1)}%`);
  el.setAttribute('data-tilting', 'true');
}

function resetHoloTilt(el: HTMLElement | null) {
  if (!el) return;
  el.style.setProperty('--rx', '0deg');
  el.style.setProperty('--ry', '0deg');
  el.style.setProperty('--hx', '50%');
  el.style.setProperty('--hy', '35%');
  el.removeAttribute('data-tilting');
}

/** 1回引いた結果 */
export function GachaSingleResult({
  result,
  progress,
  freeResult,
  cost = GACHA_COST,
  collectionLine,
  setResult,
  setError,
}: {
  result: GachaDrawResult;
  progress: GrowthProgress | null;
  /** 動画の無料抽選だったか（重複してもコインは返さない） */
  freeResult: boolean;
  /** この抽選で使ったマナコイン（共通テスト・2次＝100、大学選択＝500） */
  cost?: number;
  collectionLine: ReactNode;
  setResult: (next: GachaDrawResult | null) => void;
  setError: (message: string) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    updateHoloTilt(cardRef.current, e.clientX, e.clientY);
  };

  return (
    <div
      ref={cardRef}
      className="gacha-result gacha-outcome gacha-holo-card"
      role="status"
      data-rarity={result.rarity}
      data-gacha-result
      onPointerMove={onPointerMove}
      onPointerLeave={() => resetHoloTilt(cardRef.current)}
      onPointerUp={() => resetHoloTilt(cardRef.current)}
    >
      {(result.rarity === 'LR' || result.rarity === 'UR' || result.rarity === 'SR') && (
        <span className="gacha-result-halo" aria-hidden="true" />
      )}
      <span className="gacha-holo-foil" aria-hidden="true" />
      {/* ★C10・C11 結果の順★ レア度 → アイテム → 名前 → コレクションに追加。URは大きく、でも点滅させない */}
      <p className="gacha-reveal-rarity">
        <RarityTag rarity={result.rarity} size={result.rarity === 'LR' || result.rarity === 'UR' || result.rarity === 'SR' ? 'xl' : 'lg'} />
        <RarityStars count={RARITY_STARS[result.rarity]} />
        {result.rarity === 'LR' ? (
          <span>レジェンドレア！</span>
        ) : result.rarity === 'UR' ? (
          <span>大当たり！</span>
        ) : result.rarity === 'SR' ? (
          <span>スーパーレア！</span>
        ) : null}
      </p>
      <div className="gacha-result-art" data-kind={result.item.kind}>
        <ItemArt item={result.item} progress={progress} size={result.item.kind === 'print' ? 96 : 120} />
      </div>
      <h2 className="gacha-reveal-name">{result.item.label}</h2>
      <p className="gacha-reveal-collect">
        {result.duplicate ? (
          <>
            <Badge tone="muted">もう持っている</Badge>
            {freeResult
              ? '無料抽選のためコイン返還はありません'
              : `${result.refund} マナコイン返還（実質 ${Math.max(0, cost - result.refund)}枚）`}
            {!!result.shards && ` · かけら +${result.shards}`}
          </>
        ) : (
          <>
            <Badge tone="new">NEW</Badge>
            {result.item.kind === 'print' ? 'マイプリントに追加！' : 'コレクションに追加！'}
          </>
        )}
      </p>
      <SetCompleteNote sets={result.sets ?? []} />
      {collectionLine}
      <div className="gacha-reveal-actions">
        {result.item.kind === 'print' ? (
          <PrintLinks item={result.item} />
        ) : (
          <button
            type="button"
            onClick={async () => {
              if (await equip(result.item.id)) setError('装備しました。ホームと対戦に反映されます。');
              else setError('装備を保存できませんでした。');
            }}
          >
            この装飾をつける
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setResult(null);
            setError('');
          }}
        >
          抽選画面にもどる
        </button>
      </div>
    </div>
  );
}

/** 10＋1連（または5連）の結果 */
export function GachaMultiResult({
  multi,
  progress,
  collectionLine,
  setMulti,
  setError,
}: {
  multi: GachaDrawResult[];
  progress: GrowthProgress | null;
  collectionLine: ReactNode;
  setMulti: (next: GachaDrawResult[] | null) => void;
  setError: (message: string) => void;
}) {
  const best = bestOf(multi);
  return (
    <div
      className="gacha-result gacha-multi-result"
      role="status"
      data-gacha-multi
      data-rarity={best}
    >
      <p className="gacha-reveal-rarity">
        <span className="gacha-multi-best">いちばん</span>
        <RarityTag rarity={best} size="lg" />
        <RarityStars count={RARITY_STARS[best]} />
        <span>
          {GACHA_MULTI_COUNT}連 · NEW {multi.filter((r) => !r.duplicate).length}種
        </span>
      </p>
      <ul className="gacha-multi-grid">
        {multi.map((r, i) => (
          <ItemCard
            as="li"
            key={`${r.item.id}:${i}`}
            rarity={r.rarity}
            isNew={!r.duplicate}
            data-new={!r.duplicate}
            art={<ItemArt item={r.item} progress={progress} size={r.item.kind === 'print' ? 44 : 60} />}
            title={r.item.label}
            sub={r.duplicate ? `重複 +${r.refund}枚・かけら+${r.shards ?? 0}` : undefined}
          >
            {r.item.kind === 'print' ? (
              <PrintLinks item={r.item} compact />
            ) : (
              !r.duplicate && (
                <button
                  type="button"
                  onClick={async () => {
                    if (await equip(r.item.id)) setError(`${r.item.label}を装備しました。`);
                    else setError('装備を保存できませんでした。');
                  }}
                >
                  つける
                </button>
              )
            )}
          </ItemCard>
        ))}
      </ul>
      <p className="gacha-reveal-collect">
        {multi.some((r) => !r.duplicate) ? (
          <>
            <Badge tone="new">NEW</Badge>
            {multi.filter((r) => !r.duplicate).length}種をコレクションに追加！
          </>
        ) : (
          'すべて持っているものでした'
        )}
        {multi.some((r) => r.duplicate) && ` · 重複分 ${multi.reduce((n, r) => n + r.refund, 0)}枚返還・かけら +${multi.reduce((n, r) => n + (r.shards ?? 0), 0)}`}
      </p>
      <SetCompleteNote sets={multi.flatMap((r) => r.sets ?? [])} />
      {collectionLine}
      <button
        type="button"
        onClick={() => {
          setMulti(null);
          setError('');
        }}
      >
        抽選画面にもどる
      </button>
    </div>
  );
}
