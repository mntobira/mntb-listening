import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { FitPager } from '../../hooks/useFitPager';

/**
 * 一覧のページ送り（‹ 2 / 5 ›）。useFitPager と組で使う。
 * 1ページに収まるときは何も描かない（ボタンを増やさない）。
 */
export function FitPagerBar({ pager, label }: { pager: FitPager; label: string }) {
  if (!pager.enabled || pager.pages <= 1) return null;
  const { page, pages, setPage } = pager;
  return (
    <nav className="fit-pager" aria-label={`${label}のページ`} data-fit-pager>
      <button type="button" onClick={() => setPage(page - 1)} disabled={page === 0} aria-label="前のページ">
        <ChevronLeft size={20} aria-hidden="true" />
      </button>
      <span aria-live="polite"><b>{page + 1}</b> / {pages}</span>
      <button type="button" onClick={() => setPage(page + 1)} disabled={page >= pages - 1} aria-label="次のページ">
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </nav>
  );
}
