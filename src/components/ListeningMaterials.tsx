import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ListeningMaterial } from '../data/englishListeningQ1AProblems';

/**
 * 表のセルで ○／× のメモを付けられる列か。
 * 第4問B の条件表（Speaker × A/B/C）のように、見出しが 1〜2 文字の空欄の列だけ。
 * 第6問B の「Memo」列のような文章を書く列は対象外。
 */
const isMarkColumn = (header: string) => header.trim().length > 0 && header.trim().length <= 2;
const NEXT_MARK: Record<string, string> = { '': '○', '○': '×', '×': '' };
/** 図の下の「(18) 1st step」のように、空欄の番号と短い見出しだけが並ぶ行か */
const isBlankList = (rows: string[]) => rows.length > 0 && rows.every(row => /^\(\s*\d+\s*\)\s*\S/u.test(row.trim()));

type MaterialImage = NonNullable<ListeningMaterial['images']>[number];
/** 図に書き込んだ印。x / y は図の幅・高さに対する割合（0〜1）なので、図の大きさが変わってもずれない。 */
type FigureMark = { x: number; y: number; m: '○' | '×' };
/** 既存の印の上をタップしたとみなす半径（px）。直径 44px ＝ タップ目標の最小サイズ。 */
const MARK_HIT = 22;

/**
 * ★図を「枠に収まる最大の大きさ」で描き、タップした場所に ○／× を書ける★
 * ご要望（2026-10-21）：
 *   「図をアウトしていいから１面に出すようにしてほしい」
 *   「グラフのやつも一面に収まるようにしてほしい」
 *   「図をタップしたら〇・×を入れれるようにしたい」
 * ・枠（親のグリッドのマス）の幅と高さを測り、縦横比を保ったまま両方に収まる大きさにする。
 *   CSS の object-contain だと余白ぶんだけ印の位置がずれるので、実寸を計算して描く。
 * ・図をタップ → その場所に ○。○ をタップ → ×。× をタップ → 消す（表の ○× と同じ順）。
 *   本番の冊子に鉛筆で書き込む代わり。端末内の一時的なメモなので保存しない。
 * ・細部は右上の「拡大」ボタン（44px）で全画面にして確かめる。
 */
function FitFigure({ image, badge, marks, onMarks, onZoom }: {
  image: MaterialImage;
  badge?: string;
  marks: FigureMark[];
  onMarks: (next: FigureMark[]) => void;
  onZoom: () => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [ratio, setRatio] = useState(0);
  useLayoutEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth && img.naturalHeight) setRatio(img.naturalWidth / img.naturalHeight);
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setBox(b => (b.w === el.clientWidth && b.h === el.clientHeight) ? b : { w: el.clientWidth, h: el.clientHeight });
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const size = ratio && box.w && box.h
    ? (box.w / box.h > ratio ? { width: Math.floor(box.h * ratio), height: box.h } : { width: box.w, height: Math.floor(box.w / ratio) })
    : null;
  const onTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const px = e.clientX - r.left, py = e.clientY - r.top;
    const hit = marks.findIndex(k => Math.hypot(k.x * r.width - px, k.y * r.height - py) <= MARK_HIT);
    if (hit < 0) { onMarks([...marks, { x: px / r.width, y: py / r.height, m: '○' }]); return; }
    onMarks(marks[hit].m === '○'
      ? marks.map((k, i) => i === hit ? { ...k, m: '×' } : k)
      : marks.filter((_, i) => i !== hit));
  };
  return (
    <figure data-material-graph className="relative m-0 flex min-h-0 min-w-0 flex-col">
      <figcaption className="sr-only">{image.caption}</figcaption>
      {/* 図は absolute にして、枠の大きさ（＝親から割り当てられた高さ）に影響しないようにする */}
      <div ref={boxRef} className="relative min-h-0 flex-1 overflow-hidden">
        <div data-material-figure-tap role="button" tabIndex={0} onClick={onTap}
          aria-label={`${image.caption}：タップした場所に ○ を書く（印は ${marks.length} 個）`}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onZoom(); } }}
          className="absolute cursor-crosshair select-none overflow-hidden rounded border border-gray-300 bg-white"
          style={size
            ? { width: size.width, height: size.height, left: (box.w - size.width) / 2, top: (box.h - size.height) / 2, touchAction: 'manipulation' }
            : { inset: 0, visibility: 'hidden' }}>
          <img ref={imgRef} src={image.src} alt={image.caption} draggable={false} className="block h-full w-full"
            onLoad={(e) => { const i = e.currentTarget; if (i.naturalWidth && i.naturalHeight) setRatio(i.naturalWidth / i.naturalHeight); }} />
          {marks.map((k, i) => <span key={i} aria-hidden="true" data-figure-mark={k.m}
            className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-[30px] font-black leading-none ${
              k.m === '○' ? 'text-rose-600' : 'text-blue-700'}`}
            style={{ left: `${k.x * 100}%`, top: `${k.y * 100}%`, textShadow: '0 0 3px #fff, 0 0 3px #fff' }}>{k.m}</span>)}
          {!marks.length && <span aria-hidden="true" className="pointer-events-none absolute bottom-0.5 left-0.5 rounded-full bg-white/90 px-1.5 text-xs font-bold leading-5 text-[#2C3E50] ring-1 ring-gray-300">タップで ○×</span>}
          {badge && <span aria-hidden="true" className="pointer-events-none absolute left-0.5 top-0.5 rounded bg-[#2C3E50] px-1.5 text-sm font-bold leading-6 text-white">{badge}</span>}
        </div>
        <button type="button" onClick={onZoom} aria-label={`${image.caption}を全画面で拡大する`} data-material-zoom-open
          className="absolute right-0 top-0 flex h-11 w-11 items-start justify-end p-0.5">
          <span aria-hidden="true" className="rounded-full bg-[#2C3E50]/90 px-1.5 text-xs font-bold leading-5 text-white">拡大</span>
        </button>
      </div>
    </figure>
  );
}

/**
 * ★図が複数（第6問B のグラフ①〜④）のときは、枠の形に合わせて並べ方を選ぶ★
 * 縦に余裕があれば 2×2、横長の枠（375x667 のように資料欄が低い端末）なら 4×1。
 * どちらでも縦横比は保ち、図が一番大きく見える並べ方を毎回計算する。
 */
const GRID_GAP = 6;
function bestColumns(count: number, w: number, h: number, ratio: number) {
  let best = { cols: Math.min(2, count), size: 0 };
  for (const cols of [1, 2, 3, 4].filter(c => c <= count)) {
    const rows = Math.ceil(count / cols);
    const cw = (w - GRID_GAP * (cols - 1)) / cols, ch = (h - GRID_GAP * (rows - 1)) / rows;
    const size = Math.min(cw, ch * ratio); // 図1枚の幅
    if (size > best.size + 1) best = { cols, size };
  }
  return best.cols;
}
function FigureGrid({ count, children }: { count: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(count > 1 ? 2 : 1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || count < 2) return;
    // グラフ画像はどれも 4:3（1400x1050）。ここでは並べ方を決めるだけなので固定比で足りる
    const measure = () => { if (el.clientWidth && el.clientHeight) setCols(bestColumns(count, el.clientWidth, el.clientHeight, 4 / 3)); };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [count]);
  const rows = Math.ceil(count / cols);
  return <div ref={ref} data-material-figures data-cols={cols} className="grid min-h-0 flex-1"
    style={{ gap: GRID_GAP, gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      minHeight: count > 1 ? 88 : 96 }}>
    {children}
  </div>;
}

/** Render only printed question data. The shared document never follows answer-page keys. */
export function ListeningMaterials({ material, activeSubId }: {
  material: ListeningMaterial;
  activeSubId?: string;
}) {
  const activeNumber = activeSubId?.match(/_(\d+)$/)?.[1];
  /*
    ★表の ○× メモ（ご要望「タップで〇×がつけれるようになるとなおよし」）★
    本番の冊子に鉛筆で書き込む代わり。端末内の一時的なメモなので保存はしない
    （別の回・別の大問に移ったら消える）。
  */
  const [marks, setMarks] = useState<Record<string, string>>({});
  /* ★図はタップで全画面に拡大（ご要望「図が一部しか映ってない」）★ */
  const [zoomed, setZoomed] = useState<{ src: string; caption: string; minWidth?: number } | null>(null);
  /* ★図への書き込み（○／×）。図の src ごとに持つ★ */
  const [figureMarks, setFigureMarks] = useState<Record<string, FigureMark[]>>({});
  useEffect(() => { setMarks({}); setFigureMarks({}); setZoomed(null); }, [material]);
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setZoomed(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomed]);

  const text = (value: string, compact = false) => value.split(/(\(\s*\d+\s*\))/).map((part, i) => {
    const number = part.match(/^\(\s*(\d+)\s*\)$/)?.[1];
    if (!number) return part;
    return <mark key={i} data-material-blank={number}
      aria-current={number === activeNumber ? 'true' : undefined}
      className={`inline-block whitespace-nowrap rounded border font-bold ${compact ? 'px-1' : 'px-2'} ${
        number === activeNumber ? 'border-amber-500 bg-amber-100 text-gray-900' : 'border-gray-300 bg-white text-gray-700'
      }`}>({number})</mark>;
  });
  const table = material.table;
  const images = material.images ?? [];
  /*
    ★第6問B のメモ表（Speaker / Memo、メモ欄は空）は「名前のボタン1行」にする★
    表のままだと 3行×44px＋見出しで約180px を使い、グラフ4枚を1画面に収められない。
    名前をタップで ○ → × → 空欄（＝問36「賛成している人」を数えるメモ）に切り替える。
  */
  const memoOnly = !!table && images.length > 0 && table.headers.length === 2
    && table.rows.every(row => !row[1]?.trim());
  const titleInFigure = images.length === 1 && images[0].caption === material.title;
  const markable = !!table && !memoOnly && table.headers.slice(1).some(isMarkColumn);
  /*
    ★条件表があるとき（第4問B）は条件と表を詰めて1画面に収める★
    ご指摘：「第4問B … 図一画面に収まってない」
    390x844 で Conditions 117px ＋ 表 4行×65px ＝ 約380px を使い、④の行が
    選択肢の下に隠れていた。条件の行間・表のセルの余白を詰め、
    話者の列は1行で収まるように幅を取り、A/B/C の列は ○× が入る幅だけにする。
  */
  const sections = material.sections?.map((section, i) => (
        <section key={i} className={`rounded-lg border border-gray-200 ${markable ? 'mb-2 px-2.5 py-1.5' : 'mb-3 px-3 py-2'}`}>
          {section.heading && <h3 className="mb-2 font-bold">{section.heading}</h3>}
          <ul className={markable ? 'space-y-0.5 text-[15px] leading-snug' : 'space-y-2'}>
            {section.rows.map((row, j) => <li key={j}>{text(row)}</li>)}
          </ul>
        </section>
      ));
  return (
    <article data-listening-material data-material-fit={images.length ? 'true' : undefined}
      className={`min-w-0 font-modern text-[16px] leading-relaxed text-gray-900 ${images.length ? 'flex flex-[1_1_0%] flex-col' : 'shrink-0'}`}>
      {/* 図が1枚で、図の中に同じ題名が描いてあるとき（第4問A）は見出しを読み上げ専用にして、その高さを図に回す */}
      <h2 className={titleInFigure ? 'sr-only' : `${markable || images.length ? 'mb-1' : 'mb-1.5'} shrink-0 text-base font-bold leading-snug`}>{material.title}</h2>
      {!images.length && material.instruction && <p className="mb-3 text-sm text-gray-600">{material.instruction}</p>}
      {!images.length && sections}
      {memoOnly && table && <div data-material-memo className="mb-1.5 flex shrink-0 items-center gap-1.5">
        <span className="shrink-0 text-xs font-bold text-gray-600">{table.headers[1]}</span>
        {table.rows.map((row, i) => {
          const key = `${i}:1`;
          const mark = marks[key] || '';
          return <button key={i} type="button" data-material-mark={mark || 'none'}
            onClick={() => setMarks(m => ({ ...m, [key]: NEXT_MARK[mark] ?? '' }))}
            aria-label={`${row[0]}：${mark === '○' ? '○' : mark === '×' ? '×' : '未記入'}（タップで切り替え）`}
            className={`flex h-11 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg border text-sm font-bold ${
              mark === '○' ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : mark === '×' ? 'border-rose-400 bg-rose-50 text-rose-800' : 'border-gray-300 bg-white text-gray-800'
            }`}>
            <span className="min-w-0 truncate">{row[0]}</span>
            <span aria-hidden="true" className="text-lg leading-none">{mark || '・'}</span>
          </button>;
        })}
      </div>}
      {table && !memoOnly && <div className="mb-2 overflow-x-auto" tabIndex={0} aria-label="資料の表">
        <table className={`w-full border-collapse text-left ${markable ? 'table-fixed text-[15px] leading-snug' : 'text-[16px]'}`}>
          {markable && <colgroup>
            {table.headers.map((h, i) => <col key={i} style={i > 0 && isMarkColumn(h) ? { width: '3.25rem' } : undefined} />)}
          </colgroup>}
          <thead><tr>{table.headers.map((cell, i) =>
            <th key={i} scope="col" className={`border border-gray-300 bg-blue-50 ${markable ? 'px-2 py-1 text-center first:text-left' : 'px-3 py-2'}`}>{cell}</th>)}</tr></thead>
          <tbody>{table.rows.map((row, i) => <tr key={i}>
            {row.map((cell, j) => {
              const header = table.headers[j] ?? '';
              if (markable && j > 0 && !cell && isMarkColumn(header)) {
                const key = `${i}:${j}`;
                const mark = marks[key] || '';
                return <td key={j} className="border border-gray-300 p-0">
                  <button type="button" data-material-mark={mark || 'none'}
                    onClick={() => setMarks(m => ({ ...m, [key]: NEXT_MARK[mark] ?? '' }))}
                    aria-label={`${row[0]} の ${header}：${mark === '○' ? '○' : mark === '×' ? '×' : '未記入'}（タップで切り替え）`}
                    className={`flex h-11 w-full items-center justify-center text-xl font-bold ${
                      mark === '○' ? 'bg-emerald-50 text-emerald-700' : mark === '×' ? 'bg-rose-50 text-rose-700' : 'text-gray-300'
                    }`}>
                    {mark || <span aria-hidden="true" className="text-base">・</span>}
                  </button>
                </td>;
              }
              return <td key={j} className={`border border-gray-300 ${markable ? 'px-2 py-1' : 'min-w-20 px-3 py-2'}`}>{text(cell) || '\u00a0'}</td>;
            })}
          </tr>)}</tbody>
        </table>
        {markable && <p className="mt-1 text-xs leading-tight text-gray-600">空欄をタップすると ○ → × → 空欄 の順にメモできます</p>}
      </div>}
      {/*
        ★図は「1画面に全体が収まる大きさ」で出す（2026-10-21 ご要望）★
        ご指摘：「第４問Aは図をアウトしていいから１面に出すようにしてほしい」
                「グラフのやつも一面にないので一面に収まるようにしてほしい」
        以前は幅いっぱい（縦はなりゆき）で描いていたので、第6問B（メモ表＋グラフ4枚）は
        資料欄 359px に対して中身が 1540px あり、グラフが選択肢の下に隠れていた。
        いまは資料欄の残りの高さに、縦横比を保ったまま幅にも高さにも収まる大きさで描く
        （FitFigure）。グラフが複数あるときは 2×2 か 4×1 の大きく見える方に並べる（FigureGrid）。細部は「拡大」で確かめる。
        資料欄がとても低い端末（320x568 など）では下限の高さを守り、はみ出すぶんだけ縦にスクロールする。
      */}
      {images.length > 0 && <FigureGrid count={images.length}>
        {images.map((image, i) => <React.Fragment key={image.src}><FitFigure image={image}
          badge={images.length > 1 ? (image.caption.match(/^\S+/)?.[0] ?? String(i + 1)) : undefined}
          marks={figureMarks[image.src] ?? []}
          onMarks={(next) => setFigureMarks(m => ({ ...m, [image.src]: next }))}
          onZoom={() => setZoomed(image)} /></React.Fragment>)}
      </FigureGrid>}
      {/*
        ★図の下の「(18) 1st step (19) 2nd step …」は出さない（2026-10-21 ご指摘「いらない」）★
        いまどの空欄を解いているかは解答欄の上の黒い札（問18 1st step）に出ている。
        空欄の番号だけの行（"(18) 1st step" の形）は省き、その高さを図に回す。
      */}
      {images.length > 0 && material.sections?.filter(section => !isBlankList(section.rows)).map((section, i) => <p key={i}
        className="mt-1 flex shrink-0 flex-wrap gap-x-1.5 gap-y-0.5 text-[13px] leading-snug text-gray-800">
        {section.heading && <b>{section.heading}</b>}
        {section.rows.map((row, j) => <span key={j} className="whitespace-nowrap">{text(row, true)}</span>)}
      </p>)}
      {images.length > 0 && material.instruction && !memoOnly && <p className="mt-0.5 shrink-0 text-xs leading-tight text-gray-600">{material.instruction}</p>}
      {zoomed && <div role="dialog" aria-modal="true" aria-label={`${zoomed.caption}（拡大）`} data-material-zoom
        className="fixed inset-0 z-[200] flex flex-col bg-black/90"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-1 text-white">
          <span className="min-w-0 truncate text-sm font-bold">{zoomed.caption}</span>
          <button type="button" onClick={() => setZoomed(null)} autoFocus
            className="min-h-11 min-w-11 shrink-0 rounded-lg bg-white px-3 text-sm font-bold text-[#2C3E50]">閉じる</button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto overscroll-contain" style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
          onClick={(e) => { if (e.target === e.currentTarget) setZoomed(null); }}>
          {/* 横向きの図は縦の高さいっぱいまで大きくする（はみ出すぶんは横スクロール） */}
          <img src={zoomed.src} alt={zoomed.caption} className="mx-auto block h-auto max-w-none bg-white"
            style={{ width: `max(100%, min(${Math.round((zoomed.minWidth || 360) * 1.4)}px, 180vh))` }} />
        </div>
        <p className="shrink-0 px-3 py-1 text-center text-xs text-gray-200">ピンチで拡大・ドラッグで移動できます</p>
      </div>}
    </article>
  );
}
