import { FileText, Download } from 'lucide-react';
import { RarityBadge } from './ui';
import { GACHA_RARITY_LABELS, GACHA_RARITY_ORDER } from '../battle/core/arenaEconomy';
import { GrowthAvatar } from '../battle/ui/GrowthParts';
import { printOf, type ItemDef, type GachaRarity, type GrowthProgress } from '../battle/core/growth';
import { wallpaperOf } from '../battle/core/tobiraParts';
import { openPdf } from '../utils/pdfViewer';

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
  { id: 'wallpaper', label: '壁紙', match: (i: ItemDef) => i.kind === 'wallpaper' },
  { id: 'print', label: '学習プリント', match: (i: ItemDef) => i.kind === 'print' },
] as const;

export type CollectionKind = (typeof COLLECTION_KINDS)[number]['id'];

/** 下のプレビューで見せる「質の高いUR」。教科をばらして10個だけ */
export const FEATURED_UR_IDS = [
  'print_math_basic_all',
  'print_grammar_100',
  'print_trend_cb_all',
  'print_mock_cb_1',
  'print_mock_joho_1',
  'print_mock_bio_1',
  'print_rank_c',
  'print_trend_c_all',
  'print_math_quadratic_weekly',
  'print_vocab_lv2',
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
      {/* アプリの中で開く（別ページへ移らないので戻れる・広告も出ない。PdfViewer.tsx） */}
      <a
        href={print.file}
        onClick={e => { e.preventDefault(); openPdf(print.file, print.label, name); }}
        aria-label={`${print.label}（PDF・${print.pages}ページ）を開く`}
      >
        <FileText size={compact ? 14 : 16} aria-hidden="true" />
        {compact ? '開く' : `PDFを開く（${print.pages}ページ）`}
      </a>
      <a href={print.file} download={name} aria-label={`${print.label}をダウンロード`}>
        <Download size={compact ? 14 : 16} aria-hidden="true" />
        {compact ? '保存' : 'ダウンロード'}
      </a>
    </span>
  );
}
