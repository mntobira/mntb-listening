import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

/**
 * 「スクロールせずに1画面で見せる」ための、入るだけ並べてページでめくる仕組み（PC 用）。
 *
 * 一覧（ショップ・持ちもの・称号など）は件数が多く、画面に収まらない。
 * スクロールさせると生徒は「どこまであるのか」を探すことになるので、PC では
 *   ・枠の高さと1件の高さ・列の数から「1ページに入る件数」を測り、
 *   ・その件数ずつ並べて、‹ 1/3 › でめくる
 * 形にする。スマホ（幅 1024px 未満）では従来どおりスクロールのまま（enabled=false）。
 *
 * 使い方:
 *   const pager = useFitPager(items.length);
 *   <div ref={pager.frameRef}>          // 高さが決まっている枠（flex:1; min-height:0 など）
 *     <ul ref={pager.gridRef}>{items.slice(pager.start, pager.end).map(...)}</ul>
 *   </div>
 *   {pager.pages > 1 && <Pager {...pager} />}
 */
export interface FitPager {
  frameRef: RefObject<HTMLDivElement | null>;
  gridRef: RefObject<HTMLUListElement | null>;
  /** PC で、ページ分けが有効か */
  enabled: boolean;
  page: number;
  pages: number;
  start: number;
  end: number;
  setPage: (p: number) => void;
}

const PC_QUERY = '(min-width: 1024px)';

function isPc(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(PC_QUERY).matches;
}

export function useFitPager(total: number, resetKey: unknown = null): FitPager {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLUListElement | null>(null);
  const [enabled, setEnabled] = useState(isPc);
  const [perPage, setPerPage] = useState(0);
  const [page, setPageRaw] = useState(0);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(PC_QUERY);
    const on = () => setEnabled(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);

  // 絞り込みが変わったら1ページ目へ
  useEffect(() => { setPageRaw(0); }, [resetKey]);

  const measure = useCallback(() => {
    const frame = frameRef.current; const grid = gridRef.current;
    if (!enabled || !frame || !grid) { setPerPage(0); return; }
    const first = grid.firstElementChild as HTMLElement | null;
    if (!first) return;
    const cs = getComputedStyle(grid);
    const cols = Math.max(1, cs.gridTemplateColumns.split(' ').filter(Boolean).length);
    const gap = parseFloat(cs.rowGap) || 0;
    // 枠の中で一覧より上にあるもの（案内など）の高さを引く
    const above = grid.getBoundingClientRect().top - frame.getBoundingClientRect().top;
    const room = frame.clientHeight - above;
    const rowH = first.getBoundingClientRect().height + gap;
    const rows = Math.max(1, Math.floor((room + gap) / rowH));
    setPerPage(cols * rows);
  }, [enabled]);

  useLayoutEffect(() => {
    measure();
    const frame = frameRef.current;
    if (!frame || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(frame);
    return () => ro.disconnect();
  }, [measure, total]);

  const size = enabled && perPage > 0 ? perPage : total;
  const pages = Math.max(1, Math.ceil(total / Math.max(1, size)));
  const safe = Math.min(page, pages - 1);
  const start = enabled && perPage > 0 ? safe * size : 0;
  const end = enabled && perPage > 0 ? Math.min(total, start + size) : total;
  const setPage = useCallback((p: number) => setPageRaw(Math.max(0, p)), []);
  return { frameRef, gridRef, enabled: enabled && perPage > 0, page: safe, pages, start, end, setPage };
}
