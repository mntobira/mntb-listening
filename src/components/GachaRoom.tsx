import { useEffect, useMemo, useRef, useState } from 'react';
import { Gift, Coins, ArrowLeft, PlayCircle, School } from 'lucide-react';
import { RewardVideo } from './RewardVideo';
import { rewardedAdAvailable, preloadRewardedAd, showRewardedAd } from '../ads/rewardedAd';
import { GachaReveal } from './GachaReveal';
import {
  DEFAULT_GACHA_POOL,
  DEFAULT_GACHA_UNIV_ID,
  GACHA_POOLS,
  SELECTABLE_UNIVERSITIES,
  gachaPoolOf,
  selectableUniversityOf,
  type GachaPoolId,
} from '../battle/core/gachaPools';
import './gacha.css';
import { useGrowthProgress } from '../hooks/useGrowthProgress';
import {
  VIDEO_GACHA_DAILY_LIMIT,
  gachaCostOf,
  gachaMultiCostOf,
  gachaItems,
  gachaItemsByRarity,
} from '../battle/core/arenaEconomy';
import {
  completedVideoToken,
  drawVideoGacha,
  videoGachaPlaysLeft,
  drawGacha,
  drawGachaMulti,
  GACHA_MULTI_COUNT,
} from '../battle/data/growthStore';
import { type ItemDef, type GachaRarity } from '../battle/core/growth';
import { primeAudio } from '../battle/ui/feedback';
import { bestOf } from './GachaParts';
import { trackEvent } from '../utils/analytics';
import { safeGetItem, safeLocalStorage } from '../utils/safeLocalStorage';
import { GachaMultiResult, GachaSingleResult, type GachaDrawResult } from './gacha/GachaResultStage';
import { GachaCollectionModal } from './gacha/GachaCollectionModal';
import { GachaItemDetail } from './gacha/GachaItemDetail';
import { GachaPoolCarousel } from './gacha/GachaPoolCarousel';
import { GachaPickupModal } from './gacha/GachaPickupModal';
import { GachaUniversityModal } from './gacha/GachaUniversityModal';

type GachaProps = {
  onBack: () => void;
  onMissions: () => void;
  embedded?: boolean;
};

// GachaDrawResult は gacha/GachaResultStage.tsx へ移した（結果表示と同じ所に置く）

export function GachaRoom(props: GachaProps) {
  const { uid } = useGrowthProgress();
  return <GachaRoomContent key={uid} owner={uid} {...props} />;
}

function GachaRoomContent({
  onBack,
  onMissions,
  owner,
  embedded = false,
}: GachaProps & { owner: string; key?: string }) {
  const { progress } = useGrowthProgress();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const oddsDialog = useRef<HTMLDialogElement>(null);
  const detailDialog = useRef<HTMLDialogElement>(null);
  const [detailItem, setDetailItem] = useState<ItemDef | null>(null);
  const pickupDialog = useRef<HTMLDialogElement>(null);
  const univDialog = useRef<HTMLDialogElement>(null);
  // ★ガチャの種類（共通テスト／2次試験／大学選択）。左右スワイプで切り替え、最後に見ていたものを覚えておく★
  const [pool, setPoolState] = useState<GachaPoolId>(readPool);
  const [univId, setUnivState] = useState<string>(readUniv);
  const setPool = (next: GachaPoolId) => {
    setPoolState(next);
    writePool(next);
    setConfirm(false);
    setConfirmMulti(false);
    setError('');
  };
  const setUnivId = (next: string) => {
    const normalized = selectableUniversityOf(next).id;
    setUnivState(normalized);
    writeUniv(normalized);
  };
  const poolDef = gachaPoolOf(pool);
  const selectedUniv = selectableUniversityOf(univId);
  const scopedUniv = pool === 'univ' ? selectedUniv.id : undefined;
  const openDetail = (item: ItemDef, from: GachaPoolId = pool) => {
    if (from !== pool) setPool(from);
    setDetailItem(item);
    requestAnimationFrame(() => detailDialog.current?.showModal());
  };

  const items = useMemo(() => gachaItems(pool, scopedUniv), [pool, scopedUniv]);
  const tiers = useMemo(() => gachaItemsByRarity(pool, scopedUniv), [pool, scopedUniv]);
  const ownedCount = items.filter((item) => progress?.owned.includes(item.id)).length;

  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  const [revealing, setRevealing] = useState(false);
  const [revealKey, setRevealKey] = useState(0);
  const [result, setResult] = useState<GachaDrawResult | null>(null);
  const [lastDrawCost, setLastDrawCost] = useState<number>(() => gachaCostOf(pool));
  const [multi, setMulti] = useState<GachaDrawResult[] | null>(null);
  const bestRarity: GachaRarity | null = result ? result.rarity : multi ? bestOf(multi) : null;

  const [confirmMulti, setConfirmMulti] = useState(false);
  const singleCost = gachaCostOf(pool);
  const multiCost = gachaMultiCostOf(pool);
  const [videoOpen, setVideoOpen] = useState(false);
  const [freeResult, setFreeResult] = useState(false);
  const videoLeft = videoGachaPlaysLeft();

  /*
   * ★「動画で1回」＝ アプリ公開後はリワード広告（2026-10-05）★
   *   広告が使えるとき（src/ads/adConfig.ts で ON・SDK 登録済み）は広告を見せ、最後まで見たら1回引く。
   *   使えないとき（今の Web 版・広告の在庫切れ・読み込み失敗）は、これまでどおりアプリ内の応援動画を出す。
   *   どちらでも「途中で閉じたら回数を消費しない」「1日5回まで」は同じ。抽選は drawVideoGacha 1か所。
   */
  const adMode = rewardedAdAvailable();
  useEffect(() => {
    preloadRewardedAd();
  }, []);

  const drawFree = async (token: object) => {
    if (lock.current || pool === 'univ') return;
    lock.current = true;
    setBusy(true);
    try {
      const r = await drawVideoGacha(token, owner, pool);
      if (!r?.result) {
        setError('今日の上限に達したか、保存できませんでした。');
        return;
      }
      setFreeResult(true);
      setLastDrawCost(0);
      setMulti(null);
      setResult(r.result);
      setRevealKey((k) => k + 1);
      setRevealing(true);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  const startFree = async () => {
    if (pool === 'univ') return;
    setError('');
    if (!adMode) {
      setVideoOpen(true);
      return;
    }
    setBusy(true);
    const r = await showRewardedAd();
    setBusy(false);
    if (r.status === 'rewarded') {
      await drawFree(completedVideoToken());
      return;
    }
    if (r.status === 'dismissed') {
      setError('最後まで見ると1回引けます。回数は消費していません。');
      return;
    }
    setVideoOpen(true); // 広告が出せないときは応援動画で代わりに
  };

  const drawMulti = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setFreeResult(false);
    setConfirmMulti(false);
    primeAudio();
    try {
      const r = await drawGachaMulti(crypto.randomUUID(), owner, pool, scopedUniv);
      if (r) trackEvent(pool === 'univ' ? 'gacha_draw11_univ' : pool === 'niji' ? 'gacha_draw11_niji' : 'gacha_draw11');
      if (!r?.results) {
        setError('抽選できませんでした。残高や保存設定を確認してください。');
        return;
      }
      setResult(null);
      setMulti(r.results);
      setRevealKey((k) => k + 1);
      setRevealing(true);
    } catch {
      setError('抽選できませんでした。再度お試しください。');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  const draw = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setFreeResult(false);
    setConfirm(false);
    primeAudio();
    const cost = singleCost;
    try {
      const r = await drawGacha(crypto.randomUUID(), owner, pool, scopedUniv);
      if (r) trackEvent(pool === 'univ' ? 'gacha_draw_univ' : pool === 'niji' ? 'gacha_draw_niji' : 'gacha_draw');
      if (!r?.result) {
        setError('抽選できませんでした。残高や保存設定を確認してください。');
        return;
      }
      setLastDrawCost(cost);
      setMulti(null);
      setResult(r.result);
      setRevealKey((k) => k + 1);
      setRevealing(true);
    } catch {
      setError('抽選できませんでした。再度お試しください。');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  const busyView = revealing || !!result || !!multi;
  const pullTitle = pool === 'univ' ? `${poolDef.title}（${selectedUniv.label}）` : poolDef.title;
  const collectionLine = (
    <span
      className="gacha-collect-count"
      data-gacha-collection
      aria-label={`コレクション ${ownedCount} / ${items.length}`}
    >
      <span className="gacha-collect-word">コレクション </span>
      <b>{ownedCount}</b> / {items.length}
    </span>
  );

  /*
   * ★画面の流れ（C9）★ ① 今回の注目アイテム → ② 所持マナコイン → ③ ガチャを引く → ④ 結果 → ⑤ コレクションに追加
   *   注目アイテムは gachaFeatured()（ガチャデータから自動生成）。アイテム名は書かない（C23）。
   *   「注目」は見せ方で、割合は本物の抽選表（gachaItemRate）の値をそのまま出す（C8）。
   */
  return (
    <section
      className={`gacha-room ${result ? 'has-result' : ''} ${busyView ? 'is-busy' : ''}`}
      data-best-rarity={!revealing && bestRarity ? bestRarity : undefined}
    >
      {!embedded && (
        <button type="button" className="arena-back" onClick={onBack}>
          <ArrowLeft size={18} />
          マイページ
        </button>
      )}
      {!busyView && (
        <GachaPoolCarousel
          pool={pool}
          onPool={setPool}
          univId={selectedUniv.id}
          onOpenUniv={() => univDialog.current?.showModal()}
          progress={progress}
          onDetail={openDetail}
          onPickup={() => pickupDialog.current?.showModal()}
          onOdds={() => oddsDialog.current?.showModal()}
          coinsLow={!!progress && progress.coins < singleCost}
          onMissions={onMissions}
        />
      )}

      <div className="gacha-wallet" data-gacha-wallet>
        <p className="gacha-balance" aria-label={`所持 ${progress?.coins ?? 0} マナコイン`}>
          <Coins size={20} aria-hidden="true" />
          <span className="gacha-balance-word">所持</span>
          <b>{progress?.coins ?? '—'}</b>マナコイン
        </p>
        {collectionLine}
      </div>

      {/* 2026-09-30 確定演出：青→金→虹→大当たり と上がり、引いたレア度で止まる（それより上の色は出さない） */}
      {revealing && bestRarity ? (
        <GachaReveal key={revealKey} rarity={bestRarity} onDone={() => setRevealing(false)} />
      ) : result ? (
        <GachaSingleResult
          result={result}
          progress={progress}
          freeResult={freeResult}
          cost={lastDrawCost}
          collectionLine={collectionLine}
          setResult={setResult}
          setError={setError}
        />
      ) : multi ? (
        <GachaMultiResult multi={multi} progress={progress} collectionLine={collectionLine} setMulti={setMulti} setError={setError} />
      ) : confirmMulti ? (
        <div className="gacha-confirm" role="group" aria-label="10＋1連ガチャ購入確認">
          <p>
            {multiCost}マナコインを使って「{pullTitle}」を{GACHA_MULTI_COUNT}回まとめて引きますか？
            <br />
            <small>10＋1連は R 以上が1つ以上確定</small>
          </p>
          <button type="button" disabled={busy} onClick={() => void drawMulti()}>
            {multiCost}枚で確定する
          </button>
          <button type="button" onClick={() => setConfirmMulti(false)}>
            キャンセル
          </button>
        </div>
      ) : confirm ? (
        <div className="gacha-confirm" role="group" aria-label="ガチャ購入確認">
          <p>{singleCost}マナコインを使って「{pullTitle}」を1回引きますか？</p>
          <button type="button" disabled={busy} onClick={() => void draw()}>
            {singleCost}枚で確定する
          </button>
          <button type="button" onClick={() => setConfirm(false)}>
            キャンセル
          </button>
        </div>
      ) : (
        <div className="gacha-pulls" data-gacha-pulls data-pool={pool} aria-label={`${pullTitle}を引く`}>
          <button
            type="button"
            className="gacha-pull"
            disabled={busy || !progress || progress.coins < singleCost}
            onClick={() => setConfirm(true)}
            data-gacha-single-pull
          >
            <Gift size={20} aria-hidden="true" />
            <span>
              1回引く<small>{singleCost}枚</small>
            </span>
          </button>
          <button
            type="button"
            className="gacha-pull gacha-pull-multi"
            disabled={busy || !progress || progress.coins < multiCost}
            onClick={() => setConfirmMulti(true)}
            data-gacha-multi-pull
          >
            <Gift size={20} aria-hidden="true" />
            <span>
              10＋1連<small>{multiCost}枚・R以上1つ確定</small>
            </span>
          </button>
          {pool === 'univ' ? (
            <button
              type="button"
              className="gacha-pull gacha-pull-univ-select"
              disabled={busy}
              onClick={() => univDialog.current?.showModal()}
              data-gacha-univ-select
              aria-label={`狙う大学を選ぶ（現在：${selectedUniv.label}）`}
            >
              <School size={20} aria-hidden="true" />
              <span>
                大学をえらぶ
                <small>{selectedUniv.label}（全{selectedUniv.printIds.length}冊）</small>
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="gacha-pull gacha-pull-video"
              disabled={busy || !progress || videoLeft === 0}
              onClick={() => void startFree()}
              data-video-gacha
              data-ad-mode={adMode ? 'rewarded' : 'clip'}
            >
              <PlayCircle size={20} aria-hidden="true" />
              <span>
                動画で1回<small>無料・今日あと{videoLeft} / {VIDEO_GACHA_DAILY_LIMIT}回</small>
              </span>
            </button>
          )}
        </div>
      )}

      {videoOpen && (
        <RewardVideo
          onCancel={() => setVideoOpen(false)}
          onComplete={async (token) => {
            setVideoOpen(false);
            await drawFree(token);
          }}
        />
      )}
      {error && (
        <p role="status" className="gacha-message">
          {error}
        </p>
      )}
      <div className="gacha-collection-meter" aria-label={`コレクション ${ownedCount}/${items.length}種類`} hidden>
        <progress value={ownedCount} max={items.length} aria-label="装飾の収集状況" />
      </div>
      <GachaCollectionModal oddsDialog={oddsDialog} items={items} tiers={tiers} progress={progress} pool={pool} univId={scopedUniv} />
      <GachaItemDetail dialog={detailDialog} item={detailItem} progress={progress} pool={pool} univId={scopedUniv} />
      <GachaPickupModal dialog={pickupDialog} items={items} progress={progress} pool={pool} univId={scopedUniv} />
      <GachaUniversityModal dialog={univDialog} univId={selectedUniv.id} onSelect={setUnivId} progress={progress} />
    </section>
  );
}

/** 最後に見ていたガチャの種類（端末ごと。保存できない環境では共通テストガチャ） */
const POOL_KEY = 'mntb:gachaPool';
function readPool(): GachaPoolId {
  const v = safeGetItem(POOL_KEY);
  return GACHA_POOLS.some((p) => p.id === v) ? (v as GachaPoolId) : DEFAULT_GACHA_POOL;
}
function writePool(pool: GachaPoolId) {
  try { safeLocalStorage()?.setItem(POOL_KEY, pool); } catch { /* 保存できなくても切り替えはできる */ }
}

/** 大学選択ガチャで最後に選んでいた大学（未設定のときはプロフィールの志望校に一致すれば初期値にする） */
const UNIV_KEY = 'mntb:gachaUniv';
function readUniv(): string {
  const saved = safeGetItem(UNIV_KEY);
  if (saved && SELECTABLE_UNIVERSITIES.some((u) => u.id === saved)) return saved;
  const school = safeGetItem('mntb_profile_target_school_v1') || '';
  if (school) {
    const matched = SELECTABLE_UNIVERSITIES.find((u) => school.includes(u.name));
    if (matched) return matched.id;
  }
  return DEFAULT_GACHA_UNIV_ID;
}
function writeUniv(univId: string) {
  try { safeLocalStorage()?.setItem(UNIV_KEY, univId); } catch { /* 保存できなくても選択はできる */ }
}
