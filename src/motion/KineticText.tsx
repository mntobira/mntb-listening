import React from 'react';
import { isLitePerf } from '../utils/devicePerf';

/**
 * キネティック・タイポグラフィ（2026-10-16）。
 *   文字列を1文字ずつの span に分け、CSS（motion.css の .kt）で順に立ち上げる。
 *
 *   ・読み上げ・innerText・コピー：全文（.sr-only）が1回だけ。見た目の1文字ずつは ::before で描く（aria-hidden）
 *   ・見た目の完成状態は素の文字と同じ（動きを減らす設定・印刷では止まった完成状態だけが出る）
 *   ・text が変わると key で作り直すので、新しい見出しでもう一度再生される
 *   ・長すぎる文（max 文字超）は分けずに、まとめて1回だけ立ち上げる（読みにくくしない）
 *   ・★L-01★ 低スペック端末（html[data-perf=lite]）でも分けずに、見出し全体を1要素で立ち上げる
 *     （28個の .kt-ch を同時に合成するより、1枚の合成のほうが格安端末でも 60fps に乗る）
 */
const seg: Intl.Segmenter | null = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter('ja', { granularity: 'grapheme' }) : null;
/** 前の文字にくっつける字（行頭に来てはいけない句読点・閉じかっこ・小書き・長音） */
const STICK_PREV = /^[、。，．・：；！？!?,.:;」』）)】〉》ー〜…‥ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ％%]$/;
/** 次の文字にくっつける字（行末に残してはいけない開きかっこ） */
const STICK_NEXT = /^[「『（(【〈《＋+¥$#]$/;
const WORD = /^[A-Za-z0-9'’]$/;
/**
 * 1つずつ動かす単位に分ける。英数字の語はひとかたまり、句読点は前の字に、開きかっこは次の字に付ける。
 * こうすると1字ずつの inline-block にしても、素の文字と同じ位置で改行される（語の途中・句読点の前で折れない）。
 */
export function splitKinetic(text: string): string[] {
  const chars = seg ? Array.from(seg.segment(text), s => s.segment) : Array.from(text);
  const out: string[] = [];
  let carry = '';
  for (const c of chars) {
    const last = out[out.length - 1];
    if (/\s/.test(c)) { if (carry) { out.push(carry); carry = ''; } out.push(c); continue; }
    if (!carry && last && !/\s/.test(last) && (STICK_PREV.test(c) || (WORD.test(c) && WORD.test(last.slice(-1))))) { out[out.length - 1] = last + c; continue; }
    if (STICK_NEXT.test(c)) { carry += c; continue; }
    out.push(carry + c); carry = '';
  }
  if (carry) out.push(carry);
  return out;
}

export function KineticText({ text, delay = 0, step = 38, max = 28, variant = 'rise', className }: {
  text: string;
  /** 最初の文字が動き出すまで（ms） */
  delay?: number;
  /** 1文字ごとのずれ（ms） */
  step?: number;
  max?: number;
  /** rise：下から・ぼかし／pop：弾む／wave：一度だけ波打つ */
  variant?: 'rise' | 'pop' | 'wave';
  className?: string;
}) {
  const chars = splitKinetic(text);
  const style = { ['--kt-delay' as string]: `${delay}ms`, ['--kt-step' as string]: `${step}ms` } as React.CSSProperties;
  if (chars.length > max || isLitePerf()) {
    return <span key={text} className={`kt kt-whole ${className ?? ''}`} data-kt={variant} style={style}>{text}</span>;
  }
  // 全文（.sr-only）は読み上げ・innerText・コピー用に1回だけ。
  // 見た目の1文字ずつは ::before（data-ch）で描く。CSS の生成文字は innerText に入らず、aria-hidden で読み上げにも入らない
  return (
    <span key={text} className={`kt ${className ?? ''}`} data-kt={variant} style={style}>
      <span className="sr-only">{text}</span>
      <span className="kt-chars" aria-hidden="true">
        {chars.map((c, i) => c.trim() === ''
          ? <React.Fragment key={i}>{c}</React.Fragment>
          : <span key={i} className="kt-ch" data-ch={c} style={{ ['--i' as string]: i } as React.CSSProperties} />)}
      </span>
    </span>
  );
}
