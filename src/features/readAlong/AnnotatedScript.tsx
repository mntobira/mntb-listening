import React, { useEffect, useState } from 'react';
import { Play, Square } from 'lucide-react';
import { type RaLine, type RaWord, type ReadAlong, LINK_LABEL, toIpa } from './readAlong';
import { requireLocalStorage } from '../../utils/safeLocalStorage';
import { safeSetItem } from '../../utils/storageGuard';

/**
 * 強弱・アクセント・発音が「見ただけで分かる」スクリプト（2026-10-08）
 * ------------------------------------------------------------------
 *  ● 単語の上の丸 … リズム。音節ごとに1つ。大きい丸ほど強く読む
 *                   （オレンジの大＝その語群でいちばん強い語／紺の中＝強い／灰の小＝ふつう／白い点＝弱く読む）
 *  太字の音節   … アクセント（その単語で強く読む音節）。下にオレンジの線
 *  単語の大きさ … 強く読まれた語ほど大きく濃く、弱く読む語は小さく薄い
 *  ‿          … 前後の語がつながって聞こえる所
 *  /          … 意味のかたまりの区切り（ここで軽く息をつぐ）
 *  ↗ ↘        … 文の終わりで声を上げる／下げる
 *  発音記号    … 単語の下に。弱く読む語は弱いときの発音（the → ðə）
 * 強弱は、実際の音源の大きさ・高さ・長さから測った値（public/read_along/）を使う。
 */

export interface AnnotateOpts { stress: boolean; accent: boolean; ipa: boolean; chunks: boolean; links: boolean }
export const DEFAULT_OPTS: AnnotateOpts = { stress: true, accent: true, ipa: false, chunks: true, links: true };

/** 表示の切り替え。解説の中・練習画面で共通（端末に覚えておく） */
const OPTS_KEY = 'mtb_readalong_opts';
export function useAnnotOpts(): [AnnotateOpts, (o: AnnotateOpts) => void] {
  const [opts, set] = useState<AnnotateOpts>(() => {
    try { return { ...DEFAULT_OPTS, ...JSON.parse(requireLocalStorage().getItem(OPTS_KEY) || '{}') }; } catch { return DEFAULT_OPTS; }
  });
  useEffect(() => {
    const on = (e: Event) => set((e as CustomEvent<AnnotateOpts>).detail);
    window.addEventListener('mtb-readalong-opts', on);
    return () => window.removeEventListener('mtb-readalong-opts', on);
  }, []);
  return [opts, (o) => { set(o); safeSetItem(OPTS_KEY, JSON.stringify(o)); window.dispatchEvent(new CustomEvent('mtb-readalong-opts', { detail: o })); }];
}

/** 表示語 → 前の記号・音節・後ろの記号 */
function pieces(w: RaWord): { pre: string; syl: string[]; post: string } {
  const joined = w.syl.join('');
  const at = w.text.indexOf(joined);
  if (w.syl.length > 1 && at >= 0) return { pre: w.text.slice(0, at), syl: w.syl, post: w.text.slice(at + joined.length) };
  const m = /^([^A-Za-z0-9À-ÿ$£€]*)(.*?)([^A-Za-z0-9À-ÿ%']*)$/.exec(w.text);
  return { pre: m?.[1] ?? '', syl: [m?.[2] || w.text], post: m?.[3] ?? '' };
}

/** 音節ごとの丸の大きさ（0＝弱い点 1＝小 2＝中 3＝大） */
function dotsOf(w: RaWord, n: number): number[] {
  const top = w.level === 'focus' ? 3 : w.level === 'strong' ? 2 : w.level === 'mid' ? 1 : 0;
  if (n <= 1) return [top];
  const st = w.stressSyl >= 0 && w.stressSyl < n ? w.stressSyl : 0;
  return Array.from({ length: n }, (_, k) => (k === st ? Math.max(1, top) : 0));
}

export function AnnotatedScript({ data, opts, cur = -1, curChunk = -1, pickedId = -1, onWord, onLinePlay, activeLine = -1, hidden = false, evidence, breaks, renderBreak }: {
  data: ReadAlong; opts: AnnotateOpts; cur?: number; curChunk?: number; pickedId?: number; onWord?: (w: RaWord) => void;
  /** 文（発話）の先頭にある ▶ ボタンを押したとき、その文頭から最後まで再生／停止する */
  onLinePlay?: (line: RaLine, lineIndex: number) => void;
  activeLine?: number;
  hidden?: boolean;
  /** 語番号 → 「聞き取りの決め手」の番号（黄色で示す） */
  evidence?: Map<number, number>;
  /** 語番号 → まとまりの番号。その語の後ろで改行し、renderBreak の中身（和訳）を差し込む（2026-10-21） */
  breaks?: Map<number, number>;
  renderBreak?: (seg: number) => React.ReactNode;
}) {
  const words = data.words;
  const renderWord = (w: RaWord) => {
        const nx = words[w.i + 1];
        const chunkEnd = !nx || nx.chunk !== w.chunk;
        const { pre, syl, post } = pieces(w);
        const dots = dotsOf(w, syl.length);
        const st = syl.length > 1 && opts.accent ? (w.stressSyl >= 0 ? w.stressSyl : -1) : -1;
        const ipa = opts.ipa ? (w.weakIpa ?? toIpa(w.arpabet).ipa) : '';
        const state = w.i === cur ? 'now' : w.chunk === curChunk ? 'chunk' : cur >= 0 && w.i < cur ? 'past' : undefined;
        const link = opts.links && w.link && !chunkEnd ? w.link : null;
        const ev = evidence?.get(w.i);
        const evFirst = ev != null && evidence?.get(w.i - 1) !== ev;
        const slash = opts.chunks && chunkEnd && !w.tone;
        // 単語と後ろの「/」は1つのかたまり（「/」だけが次の行の頭に来ないように）
        return <span key={w.i} className="ra-unit">
          <button type="button" className="ra-w" data-w={w.i} data-level={w.level} data-state={state} data-picked={pickedId === w.i || undefined}
            onClick={onWord ? () => onWord(w) : undefined} tabIndex={onWord ? 0 : -1}
            aria-label={`${w.text}${w.level === 'focus' ? '（いちばん強く）' : w.level === 'weak' ? '（弱く）' : ''}`}>
            <span className="ra-word">
              {evFirst && <sup className="ra-evno">{(ev as number) + 1}</sup>}
              {pre}{syl.map((s, k) => <span key={k} className={`ra-syl${k === st ? ' ra-acc' : ''}`} data-d={opts.stress ? dots[k] : undefined}>{s}</span>)}{post}
              {w.tone && <span className={`ra-tone is-${w.tone}`} aria-label={w.tone === 'up' ? '上げる' : '下げる'}>{w.tone === 'up' ? '↗' : '↘'}</span>}
              {link && <span className={`ra-arc is-${link}`} title={LINK_LABEL[link].tip} aria-label={LINK_LABEL[link].name} />}
            </span>
            {opts.ipa && <span className="ra-uipa" data-weakform={w.weakIpa ? '' : undefined}>{ipa || '\u00a0'}</span>}
          </button>
          {slash && <span className="ra-slash" aria-hidden="true">/</span>}
        </span>;
  };
  // 和訳を挟む場合は、まとまりの最後の語で行を分ける
  const groupsOf = (ws: RaWord[]): { ws: RaWord[]; seg?: number }[] => {
    if (!breaks || !renderBreak) return [{ ws }];
    const out: { ws: RaWord[]; seg?: number }[] = []; let cur: RaWord[] = [];
    for (const w of ws) { cur.push(w); const seg = breaks.get(w.i); if (seg != null) { out.push({ ws: cur, seg }); cur = []; } }
    if (cur.length) out.push({ ws: cur });
    return out;
  };
  return <div className={`ra-annot${opts.ipa ? ' has-ipa' : ''}${opts.stress ? ' has-stress' : ''}${hidden ? ' is-hidden' : ''}${breaks && renderBreak ? ' has-tr' : ''}`} lang="en">
    {data.lines.map((ln, li) => groupsOf(ln.words).map((g, gi) => <React.Fragment key={`${li}-${gi}`}>
      <div className="ra-aline">
        {gi === 0 && onLinePlay && ln.words.length > 0 && (
          <button
            type="button"
            className="ra-line-play"
            data-playing={activeLine === li || undefined}
            onClick={() => onLinePlay(ln, li)}
            aria-label={`${ln.who ? `${ln.who} の発話` : `${li + 1}行目`}から再生${activeLine === li ? 'を停止' : ''}`}
            title="この文から再生"
          >
            {activeLine === li ? <Square size={11} aria-hidden="true" /> : <Play size={12} aria-hidden="true" />}
          </button>
        )}
        {gi === 0 && ln.who && <b className="ra-who">{ln.who}</b>}
        {g.ws.map(renderWord)}
      </div>
      {g.seg != null && renderBreak?.(g.seg)}
    </React.Fragment>))}
  </div>;
}

/** 記号の説明（いま表示しているものだけ） */
export function AnnotLegend({ opts }: { opts: AnnotateOpts }) {
  return <div className="ra-key" aria-label="記号の見方" data-ra-key>
    {opts.stress && <span><i className="ra-kdot" data-d="3" />いちばん強く</span>}
    {opts.stress && <span><i className="ra-kdot" data-d="2" />強く</span>}
    {opts.stress && <span><i className="ra-kdot" data-d="0" />弱く</span>}
    {opts.accent && <span><b className="ra-kacc">brel</b>アクセント</span>}
    {opts.links && <span><i className="ra-karc" />つながる</span>}
    {opts.chunks && <span><b className="ra-kslash">/</b>区切り</span>}
    <span><b className="ra-ktone">↗↘</b>上げる・下げる</span>
  </div>;
}

/** 表示の切り替えボタン */
export function AnnotToggles({ opts, setOpts }: { opts: AnnotateOpts; setOpts: (o: AnnotateOpts) => void }) {
  const items: [keyof AnnotateOpts, string][] = [['stress', '強弱'], ['accent', 'アクセント'], ['ipa', '発音記号'], ['chunks', '区切り'], ['links', 'つながり']];
  return <div className="ra-chips ra-toggles-row" role="group" aria-label="表示するもの">
    {items.map(([k, l]) => <button key={k} type="button" aria-pressed={opts[k]} onClick={() => setOpts({ ...opts, [k]: !opts[k] })}>{l}</button>)}
  </div>;
}
