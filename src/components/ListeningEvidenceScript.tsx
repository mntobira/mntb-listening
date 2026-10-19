import React, { useRef } from 'react';
import { locateListeningEvidence } from '../utils/listeningExplanation';
import type { ListeningAudioTrack } from '../data/englishListeningQ1AProblems';
import { ScriptReading } from '../features/readAlong/ScriptReading';

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
        fallback={
          track.turns?.length ? (
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
        after={<p className="mt-3 text-xs leading-relaxed">{track.translation}</p>}
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
