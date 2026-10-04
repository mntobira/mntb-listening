import type { ReactNode } from 'react';
import { Hammer } from 'lucide-react';

/**
 * 「準備中」の札（2026-10-05）。クラス・マナクランはまだ公開しないので、中身の代わりにこれを出す。
 * 機能のコード（ClassPanel / ManaClan）は消さずに残している。公開するときは
 * src/config/features.ts の FEATURES.classroom / FEATURES.manaClan を true にするだけ。
 */
export function ComingSoon({ title, children }: { title: string; children?: ReactNode }) {
  return <section className="coming-soon" role="status" data-coming-soon>
    <span className="coming-soon-icon" aria-hidden="true"><Hammer size={26} /></span>
    <h3>{title}は準備中です</h3>
    <p>{children ?? 'もうすぐ使えるようになります。公開したらお知らせでお伝えします。'}</p>
  </section>;
}
