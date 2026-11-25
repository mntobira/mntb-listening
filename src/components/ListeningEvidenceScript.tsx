import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Square } from 'lucide-react';
import { locateListeningEvidence } from '../utils/listeningExplanation';
import type { ListeningAudioTrack } from '../data/englishListeningQ1AProblems';
import { ScriptReading, type LinePlayControl } from '../features/readAlong/ScriptReading';
import type { ReadAlong } from '../features/readAlong/readAlong';
import './listening-explanation.css';
import { isLongTrack, loadListeningTranslations, segmentBreaks, segmentsOf, trackKey } from '../features/listeningTranslation/segments';

/** このトラックの和訳（まとまりごと）。データに無ければ track.translation を1つにまとめて使う */
function useTranslation(track: ListeningAudioTrack): string[] {
  const key = trackKey(track);
  const [tr, setTr] = useState<string[]>([]);
  useEffect(() => {
    let alive = true;
    loadListeningTranslations().then(all => { if (alive) setTr(all[key] ?? []); });
    return () => { alive = false; };
  }, [key]);
  if (tr.length) return tr;
  return track.translation?.trim() ? [track.translation.trim()] : [];
}

/**
 * ListeningEvidenceScript
 * ------------------------------------------------------------------
 * 復習用スクリプト表示（聞き取りの決め手となる箇所に番号付きマーカーを付け、
 * 下の「押さえたい表現」リストから該当箇所へジャンプできるようにする）。
 *
 * ListeningAudioPlayer.tsx から独立コンポーネントとして分離（#21）。
 * ListeningAudioPlayer からも再エクスポートしているため既存の import 先は不変。
 */
export function ListeningEvidenceScript({
  track,
  collapsiblePhrases = false,
  showHint = true,
}: {
  track: ListeningAudioTrack;
  collapsiblePhrases?: boolean;
  showHint?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const phrases = track.keyPhrases.map((item) => item.phrase);
  const segments = track.turns?.length ? track.turns.map((turn) => turn.text) : [track.script];
  const located = new Set(
    segments.flatMap((text) => locateListeningEvidence(text, phrases).map((hit) => hit.phraseIndex)),
  );

  const renderScript = (text: string) => {
    const parts: React.ReactNode[] = [];
    let end = 0;
    for (const hit of locateListeningEvidence(text, phrases)) {
      parts.push(text.slice(end, hit.start));
      parts.push(
        <mark
          key={hit.start}
          tabIndex={-1}
          data-listening-evidence={hit.phraseIndex}
          className="listening-evidence"
          aria-label={`聞き取りの決め手 ${hit.phraseIndex + 1}`}
        >
          <sup>{hit.phraseIndex + 1}</sup>
          {text.slice(hit.start, hit.end)}
        </mark>,
      );
      end = hit.end;
    }
    parts.push(text.slice(end));
    return parts;
  };

  // 2026-10-21 和訳：短い大問はスクリプトの下にまとめて、長い大問は英文→和訳→英文→和訳…
  const tr = useTranslation(track);
  const segs = segmentsOf(track);
  const interleave = isLongTrack(track) && tr.length === segs.length && segs.length > 1;
  const trLine = (seg: number) => <p className="listening-tr-line" lang="ja">{tr[seg]}</p>;
  const breaksOf = useCallback((d: ReadAlong) => segmentBreaks(track, d.words, d.lines.length), [track]);
  const renderBreak = useCallback((seg: number) => (tr[seg] ? <p className="listening-tr-line" lang="ja">{tr[seg]}</p> : null), [tr]);
  const after = tr.length > 0 && !interleave ? (
    <div className="listening-tr-block" lang="ja">
      <p className="listening-tr-label">和訳</p>
      {track.turns?.length && tr.length === segs.length ? (
        <ul>{tr.map((t, k) => <li key={k}><b>{segs[k].who}</b>{t}</li>)}</ul>
      ) : <p>{tr.join('')}</p>}
    </div>
  ) : null;

  const jump = (index: number) => {
    const target = root.current?.querySelector<HTMLElement>(`[data-listening-evidence="${index}"]`);
    target?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
    target?.focus({ preventScroll: true });
  };

  const phraseList = track.keyPhrases.length > 0 && (
    <ol>
      {track.keyPhrases.map((item, index) => (
        <li key={`${item.phrase}-${index}`}>
          <button
            type="button"
            disabled={!located.has(index)}
            onClick={() => jump(index)}
            aria-label={`${index + 1}. ${item.phrase} の英文箇所へ移動`}
          >
            <b>{index + 1}</b>
            {item.phrase}
          </button>
          <p>
            {item.meaning}
            {!located.has(index) && <small>語形・言い換えの説明（本文と完全一致する箇所なし）</small>}
          </p>
        </li>
      ))}
    </ol>
  );

  return (
    <div ref={root} className="listening-script-evidence">
      {showHint && (
        <p className="listening-evidence-hint">
          番号つきの黄色い部分が対応する英文です。下の表現を押すと、その箇所へ移動します。
        </p>
      )}
      {/* 2026-10-08 スクリプトに読み方（強弱・アクセント・区切り・つながり・上げ下げ・発音記号）を重ねて表示。
          時刻データが無い音源では従来どおりのスクリプト */}
      <ScriptReading
        track={track}
        compact={collapsiblePhrases}
        renderPlainFallback={(ctrl: LinePlayControl) =>
          interleave ? (
            <div className="space-y-1">
              {segs.map((seg, k) => (
                <div key={k} className="listening-tr-pair">
                  <p className="listening-script-text flex items-baseline gap-1.5">
                    {ctrl.canPlayLine(k) && (
                      <button
                        type="button"
                        className="ra-line-play self-center"
                        data-playing={ctrl.activeLine === k || undefined}
                        onClick={() => ctrl.toggleLine(k)}
                        aria-label={`${seg.who ? `${seg.who} の発話` : `${k + 1}行目`}から再生${ctrl.activeLine === k ? 'を停止' : ''}`}
                        title="この文から再生"
                      >
                        {ctrl.activeLine === k ? <Square size={11} aria-hidden="true" /> : <Play size={12} aria-hidden="true" />}
                      </button>
                    )}
                    {seg.who && <b className="mr-1 shrink-0 text-xs">{seg.who}</b>}
                    <span>{renderScript(seg.text)}</span>
                  </p>
                  {trLine(k)}
                </div>
              ))}
            </div>
          ) : track.turns?.length ? (
            <ul className="space-y-2">
              {track.turns.map((turn, index) => (
                <li key={index} className="flex items-baseline gap-1.5">
                  {ctrl.canPlayLine(index) && (
                    <button
                      type="button"
                      className="ra-line-play self-center"
                      data-playing={ctrl.activeLine === index || undefined}
                      onClick={() => ctrl.toggleLine(index)}
                      aria-label={`${turn.who ? `${turn.who} の発話` : `${index + 1}行目`}から再生${ctrl.activeLine === index ? 'を停止' : ''}`}
                      title="この文から再生"
                    >
                      {ctrl.activeLine === index ? <Square size={11} aria-hidden="true" /> : <Play size={12} aria-hidden="true" />}
                    </button>
                  )}
                  <b className="shrink-0 text-xs">{turn.who}</b>
                  <span className="listening-script-text">{renderScript(turn.text)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="listening-script-text flex items-baseline gap-1.5">
              {ctrl.canPlayLine(0) && (
                <button
                  type="button"
                  className="ra-line-play self-center"
                  data-playing={ctrl.activeLine === 0 || undefined}
                  onClick={() => ctrl.toggleLine(0)}
                  aria-label={`先頭から再生${ctrl.activeLine === 0 ? 'を停止' : ''}`}
                  title="先頭から再生"
                >
                  {ctrl.activeLine === 0 ? <Square size={11} aria-hidden="true" /> : <Play size={12} aria-hidden="true" />}
                </button>
              )}
              <span>{renderScript(track.script)}</span>
            </p>
          )
        }
        fallback={
          interleave ? (
            <div className="space-y-1">
              {segs.map((seg, k) => (
                <div key={k} className="listening-tr-pair">
                  <p className="listening-script-text">{seg.who && <b className="mr-2 text-xs">{seg.who}</b>}{renderScript(seg.text)}</p>
                  {trLine(k)}
                </div>
              ))}
            </div>
          ) : track.turns?.length ? (
            <ul className="space-y-2">
              {track.turns.map((turn, index) => (
                <li key={index} className="flex gap-2">
                  <b className="shrink-0 text-xs">{turn.who}</b>
                  <span className="listening-script-text">{renderScript(turn.text)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="listening-script-text">{renderScript(track.script)}</p>
          )
        }
        breaks={interleave ? breaksOf : undefined}
        renderBreak={interleave ? renderBreak : undefined}
        after={after}
      />
      {track.keyPhrases.length > 0 &&
        (collapsiblePhrases ? (
          <details className="listening-evidence-list listening-evidence-fold">
            <summary>押さえたい表現（{track.keyPhrases.length}）</summary>
            {phraseList}
          </details>
        ) : (
          <div className="listening-evidence-list">
            <h3>押さえたい表現</h3>
            {phraseList}
          </div>
        ))}
    </div>
  );
}
