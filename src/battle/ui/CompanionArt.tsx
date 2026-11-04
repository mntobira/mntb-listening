import './companion.css';
import { COMPANION_SRC, companionOf } from '../core/tobiraParts';

/**
 * お供（2026-11-03）の絵。画像は1枚（金のカギ「カギノスケ」）で、色違いは CSS の filter。
 *   ホーム・ガチャ・持ちもの・きせかえ で同じ部品を使う（見た目をそろえる）。
 *   value は COMPANIONS のキー（tobiraParts.ts）。知らないキーなら何も描かない。
 *   色（filter）は companion.css の [data-companion=…]。大きさは width/height 属性（style の直書きは増やさない）。
 */
export function CompanionArt({ value, size, className, label }: { value: string; size: number; className?: string; label?: string }) {
  const c = companionOf(value);
  if (!c) return null;
  return (
    <img
      src={COMPANION_SRC}
      alt={label ?? c.label}
      width={Math.round(size * 0.56)}
      height={size}
      draggable={false}
      className={`companion-art ${className ?? ''}`.trim()}
      data-companion={value}
    />
  );
}
