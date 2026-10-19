import { useLayoutEffect } from 'react';

/**
 * 縦の高さがまちまちなカードを、列ごとに上から詰めて並べる（PC の「1画面に収める」配置用）。
 *
 * CSS の grid に `grid-auto-rows: 4px` と各カードの列（grid-column。全幅は 1 / -1）を書いておき、
 * 各カードの実際の高さから「どの行から何行ぶん使うか」（grid-row）をここで決める。
 * 並び順は DOM の順のまま（列の中で上から順に積む）なので、読み上げの順番もスマホと同じ。
 * 高さを CSS に決め打ちすると、文言やミッションの数が変わったときに重なったり隙間が空いたりするため。
 *
 * @param selector 並べる枠（grid）の CSS セレクタ
 * @param active   計算するか（スマホでは false にして、ふつうの縦並びのまま）
 * @param deps     中身が変わったら測り直す
 */
export function useMasonrySpans(selector: string, active: boolean, deps: readonly unknown[]): void {
  useLayoutEffect(() => {
    const grid = document.querySelector<HTMLElement>(selector);
    if (!grid) return;
    const items = Array.from(grid.children) as HTMLElement[];
    const reset = () => items.forEach((el) => { el.style.gridRowStart = ''; el.style.gridRowEnd = ''; });
    if (!active) { reset(); return; }
    const apply = () => {
      const cs = getComputedStyle(grid);
      const row = parseFloat(cs.gridAutoRows) || 4;
      const gap = parseFloat(cs.rowGap) || 0;
      const cols = cs.gridTemplateColumns.split(' ').filter(Boolean).length || 1;
      // 列ごとの「次に置ける行」。全幅の要素（grid-column: 1 / -1）は全列を押し下げる
      const next = new Array(cols).fill(1);
      for (const el of items) {
        const ecs = getComputedStyle(el);
        if (ecs.display === 'none' || ecs.position === 'absolute') continue;
        const mb = parseFloat(ecs.marginBottom) || 0;
        const span = Math.max(1, Math.ceil((el.getBoundingClientRect().height + mb + gap) / (row + gap)));
        const start = parseInt(ecs.gridColumnStart, 10);
        const full = ecs.gridColumnEnd === '-1' || !Number.isFinite(start);
        const colsHit = full ? next.map((_, i) => i) : [Math.min(cols, Math.max(1, start)) - 1];
        const at = Math.max(...colsHit.map((i) => next[i]));
        el.style.gridRowStart = String(at);
        el.style.gridRowEnd = `span ${span}`;
        colsHit.forEach((i) => { next[i] = at + span; });
      }
    };
    apply();
    if (typeof ResizeObserver === 'undefined') return reset;
    const ro = new ResizeObserver(apply);
    items.forEach((el) => ro.observe(el));
    return () => { ro.disconnect(); reset(); };
    // 呼び出し側が渡す deps を展開して使うため、静的な依存の検査ができない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selector, active, ...deps]);
}
