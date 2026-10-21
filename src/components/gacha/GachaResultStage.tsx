/**
 * ガチャの結果表示（1回・10＋1連）（C-06）。
 * GachaRoom.tsx から JSX をそのまま移した（DOM・クラス名・data-* 属性・文言は1文字も変えていない）。
 * 状態は親（GachaRoom）が持ち、ここは表示と「もどる／つける」ボタンだけ。
 */
import type { ReactNode } from 'react';
import { RarityStars } from '../GachaReveal';
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
};

/** 1回引いた結果 */
export function GachaSingleResult({ result, progress, freeResult, collectionLine, setResult, setError }: {
  result: GachaDrawResult;
  progress: GrowthProgress | null;
  /** 動画の無料抽選だったか（重複してもコインは返さない） */
  freeResult: boolean;
  collectionLine: ReactNode;
  setResult: (next: GachaDrawResult | null) => void;
  setError: (message: string) => void;
}) {
  return (
    <div className="gacha-result gacha-outcome" role="status" data-rarity={result.rarity} data-gacha-result>
      {(result.rarity === 'UR' || result.rarity === 'SR') && (
        <span className="gacha-result-halo" aria-hidden="true" />
      )}
      {/* ★C10・C11 結果の順★ レア度 → アイテム → 名前 → コレクションに追加。URは大きく、でも点滅させない */}
      <p className="gacha-reveal-rarity">
        <RarityTag rarity={result.rarity} size={result.rarity === 'UR' || result.rarity === 'SR' ? 'xl' : 'lg'} />
        <RarityStars count={RARITY_STARS[result.rarity]} />
        {result.rarity === 'UR' ? (
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
              : `${result.refund} マナコイン返還（実質 ${GACHA_COST - result.refund}枚）`}
          </>
        ) : (
          <>
            <Badge tone="new">NEW</Badge>
            {result.item.kind === 'print' ? 'マイプリントに追加！' : 'コレクションに追加！'}
          </>
        )}
      </p>
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

/** 10＋1連の結果 */
export function GachaMultiResult({ multi, progress, collectionLine, setMulti, setError }: {
  multi: GachaDrawResult[];
  progress: GrowthProgress | null;
  collectionLine: ReactNode;
  setMulti: (next: GachaDrawResult[] | null) => void;
  setError: (message: string) => void;
}) {
  return (
    <div
      className="gacha-result gacha-multi-result"
      role="status"
      data-gacha-multi
      data-rarity={bestOf(multi)}
    >
      <p className="gacha-reveal-rarity">
        <span className="gacha-multi-best">いちばん</span>
        <RarityTag rarity={bestOf(multi)} size="lg" />
        <RarityStars count={RARITY_STARS[bestOf(multi)]} />
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
            style={{ animationDelay: `${i * 0.18}s` }}
            art={<ItemArt item={r.item} progress={progress} size={r.item.kind === 'print' ? 44 : 60} />}
            title={r.item.label}
            sub={r.duplicate ? `重複 +${r.refund}枚` : undefined}
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
        {multi.some((r) => r.duplicate) && ` · 重複分 ${multi.reduce((n, r) => n + r.refund, 0)}枚返還`}
      </p>
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
