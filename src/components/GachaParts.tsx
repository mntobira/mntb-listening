import { Download } from 'lucide-react';
import { RarityBadge } from './ui';
import { GACHA_RARITY_LABELS, GACHA_RARITY_ORDER } from '../battle/core/arenaEconomy';
import { GrowthAvatar } from '../battle/ui/GrowthParts';
import { printOf, type ItemDef, type GachaRarity, type GrowthProgress } from '../battle/core/growth';
import { stageOf, wallpaperOf } from '../battle/core/tobiraParts';
import { CompanionArt } from '../battle/ui/CompanionArt';
import '../styles/home-stage.css';
import { savePdf } from '../utils/pdfShare';
import { notify } from '../utils/dialog';

/**
 * GachaParts
 * ------------------------------------------------------------------
 * ガチャ画面（GachaRoom.tsx）で使われる共通の定数・整形関数・表示用サブコンポーネント。
 * GachaRoom.tsx の可読性向上のため分離（#26）。見た目・DOM・挙動は完全に不変。
 */

/** コレクションの分類（部位ごとに見られるように） */
export const COLLECTION_KINDS = [
  { id: 'body', label: 'ポーズ・わく', match: (i: ItemDef) => i.kind === 'pose' || i.kind === 'frame' },
  { id: 'parts', label: '帽子・メガネほか', match: (i: ItemDef) => ['hat', 'glasses', 'cheek', 'aura'].includes(i.kind) },
  { id: 'wallpaper', label: '壁紙・ホーム背景', match: (i: ItemDef) => i.kind === 'wallpaper' || i.kind === 'stage' },
  { id: 'companion', label: 'お供', match: (i: ItemDef) => i.kind === 'companion' },
  { id: 'print', label: '学習プリント', match: (i: ItemDef) => i.kind === 'print' },
] as const;

export type CollectionKind = (typeof COLLECTION_KINDS)[number]['id'];

/** 下のプレビューで見せる「質の高いUR」。教科をばらして10個だけ */
export const FEATURED_UR_IDS = [
  // 2026-10-28：UR＝「完全版の本」になった（#112）ので、厳選UR もその本から10冊（以前の10種は SR になっていた）
  'print_book_listening_all',
  'print_book_reading_mock1',
  'print_book_reading_mock2',
  'print_book_reading_mock3',
  'print_book_vocab_lv1',
  'print_book_vocab_lv2',
  'print_book_idiom_all',
  'print_book_analysis_all',
  'print_book_idiom_reading_standard',
  'print_book_grammar_b4_bunpo',
] as const;

export const pct = (r: number): string => {
  const v = r * 100;
  return (v >= 10 ? v.toFixed(1) : v >= 1 ? v.toFixed(2) : v.toFixed(3)).replace(/\.?0+$/, '');
};

/** 結果の中でいちばん高いレア度 */
export const bestOf = (list: { rarity: GachaRarity }[]): GachaRarity =>
  GACHA_RARITY_ORDER.find((r) => list.some((x) => x.rarity === r)) ?? 'N';

/** レア度の札は共通部品（ui/RarityBadge）。N→R→SR→UR で枠・装飾が段階的に増える（C12） */
export function RarityTag({ rarity, size }: { rarity: GachaRarity; size?: 'lg' | 'xl' }) {
  return <RarityBadge rarity={rarity} size={size} label={GACHA_RARITY_LABELS[rarity]} />;
}

/** アイテムの見た目：装備なら扉くんに着せたプレビュー、学習プリントなら1ページ目のサムネイル */
export function ItemArt({
  item,
  progress,
  size,
}: {
  item: ItemDef;
  progress: GrowthProgress | null;
  size: number;
}) {
  const print = item.kind === 'print' ? printOf(item.id) : undefined;
  if (item.kind === 'stage') {
    return (
      <svg className="gacha-stage-art" data-stage-swatch={stageOf(item.value) ? item.value : 'cosmos'} width={size} height={Math.round(size * 1.3)} viewBox="0 0 10 13" role="img" aria-label={stageOf(item.value)?.label ?? 'ホームの背景'}>
        <rect className="stage-swatch-fill" width="10" height="13" rx="1.2" />
        <image href="/mascots/basic.webp" x="2.5" y="5.5" width="5" height="5" />
      </svg>
    );
  }
  if (item.kind === 'companion') {
    // お供：カギノスケの色違い（2026-11-03）
    return <span className="gacha-companion-art"><CompanionArt value={item.value} size={Math.round(size * 1.02)} /></span>;
  }
  if (item.kind === 'wallpaper') {
    return (
      <span
        className="gacha-wallpaper-art"
        style={{ width: size, height: Math.round(size * 1.3), background: wallpaperOf(item.value)?.css }}
      >
        <img
          src="/mascots/basic.webp"
          alt=""
          width={Math.round(size * 0.5)}
          height={Math.round(size * 0.5)}
        />
      </span>
    );
  }
  if (print) {
    return (
      <span className="gacha-print-thumb" style={{ width: size, height: Math.round(size * 1.414) }}>
        <img
          src={print.thumb}
          alt={`${print.label}の1ページ目`}
          loading="lazy"
          decoding="async"
          width={size}
          height={Math.round(size * 1.414)}
        />
        <em>{print.category}</em>
      </span>
    );
  }
  return progress ? (
    <GrowthAvatar
      progress={{ ...progress, equipped: { ...progress.equipped, [item.kind]: item.id } }}
      size={size}
      showLevel={false}
    />
  ) : null;
}

/** 学習プリントを開く・保存するリンク（同じサイト内の PDF だけ） */
export function PrintLinks({ item, compact = false }: { item: ItemDef; compact?: boolean }) {
  const print = printOf(item.id);
  if (!print) return null;
  const name = `${print.label.replace(/[\\/:*?"<>|\s]+/g, '_')}.pdf`;
  return (
    <span className={`gacha-print-links ${compact ? 'is-compact' : ''}`}>
      <a href={print.file} download={name} aria-label={`${print.label}をダウンロード`} onClick={e => { e.preventDefault(); void savePdf(print.file, name, print.label).catch(() => notify('PDFを保存できませんでした。接続を確認して、もう一度お試しください。')); }}>
        <Download size={compact ? 14 : 16} aria-hidden="true" />
        {compact ? '保存' : '保存する'}
      </a>
    </span>
  );
}
