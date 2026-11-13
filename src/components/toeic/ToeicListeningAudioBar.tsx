/**
 * TOEIC リスニング（tpl_1）の音声再生バー＋採点後スクリプト表示（2026-11-12）
 *
 * ・Part 2 のページでは「問1を再生 / 問2を再生 / 問3を再生」または「連続再生」を選べる
 * ・Part 3・Part 4 のページでは対話／説明文の再生ボタン＋速度切替（0.85x / 1.0x / 1.15x）を出す
 * ・採点後はこのバーの下から全文スクリプト＆日本語訳を開閉して確認できる
 */
import { useEffect, useState } from 'react';
import { ChevronDown, FileText, Headphones, Square, Volume2 } from 'lucide-react';
import { formatText } from '../../utils/textFormatter';
import type { ToeicListeningAudioCardItem, ToeicListeningPageAudioInfo } from '../../data/toeic/toeicListeningPage';
import {
  playToeicListeningTrack,
  prefetchToeicListeningAudioIndex,
  stopToeicListeningAudio,
} from '../../utils/toeicListeningAudio';

const SPEEDS = [
  { rate: 0.85, label: '0.85x' },
  { rate: 1.0, label: '1.0x' },
  { rate: 1.15, label: '1.15x' },
] as const;

export interface ToeicListeningAudioBarProps {
  info: ToeicListeningPageAudioInfo;
  scored: boolean;
  pageKey: string;
}

export function ToeicListeningAudioBar({ info, scored, pageKey }: ToeicListeningAudioBarProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [rate, setRate] = useState<number>(1.0);
  const [scriptOpen, setScriptOpen] = useState(false);

  useEffect(() => {
    prefetchToeicListeningAudioIndex();
    return () => {
      stopToeicListeningAudio();
    };
  }, []);

  useEffect(() => {
    stopToeicListeningAudio();
    setPlayingId(null);
    setScriptOpen(false);
  }, [pageKey]);

  const toggleTrack = (track: ToeicListeningAudioCardItem) => {
    if (playingId === track.trackId) {
      stopToeicListeningAudio();
      setPlayingId(null);
      return;
    }
    const mode = playToeicListeningTrack({
      trackId: track.trackId,
      turns: track.turns,
      fallbackScript: track.fallbackScript,
      rate,
      onEnd: () => setPlayingId((cur) => (cur === track.trackId ? null : cur)),
    });
    setPlayingId(mode ? track.trackId : null);
  };

  return (
    <section className="tpl-audio-card" aria-label={`${info.partBadge} 音声プレーヤー`} data-toeic-listening-bar>
      <div className="tpl-audio-top">
        <div className="tpl-audio-heading">
          <span className="tpl-part-badge">{info.partBadge}</span>
          <h3 className="tpl-audio-title">{info.title}</h3>
        </div>
        <div className="tpl-speed-group" role="group" aria-label="再生速度">
          {SPEEDS.map((s) => (
            <button
              key={s.label}
              type="button"
              className="tpl-speed-btn"
              aria-pressed={rate === s.rate}
              onClick={() => setRate(s.rate)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <p className="tpl-audio-guide">{info.guide}</p>

      <div className={`tpl-track-grid${info.isSetAudio ? ' is-single' : ''}`}>
        {info.tracks.map((track) => {
          const active = playingId === track.trackId;
          return (
            <button
              key={track.trackId}
              type="button"
              className="tpl-play-btn"
              data-playing={active || undefined}
              data-toeic-play={track.trackId}
              aria-pressed={active}
              onClick={() => toggleTrack(track)}
            >
              {active ? <Square size={16} aria-hidden="true" /> : info.isSetAudio ? <Headphones size={18} aria-hidden="true" /> : <Volume2 size={17} aria-hidden="true" />}
              <span>{active ? '停止する' : track.buttonLabel}</span>
            </button>
          );
        })}
      </div>

      {scored && (
        <details
          className="tpl-script"
          open={scriptOpen || undefined}
          onToggle={(e) => setScriptOpen((e.currentTarget as HTMLDetailsElement).open)}
          data-toeic-listening-script
        >
          <summary>
            <FileText size={15} aria-hidden="true" />
            <span>{scriptOpen ? '音声スクリプト・全訳を閉じる' : '音声スクリプト・全訳を見る'}</span>
            <ChevronDown size={17} className="tpl-script-chev" aria-hidden="true" />
          </summary>
          <div className="tpl-script-body">
            {info.tracks.map((track) => (
              <div key={track.trackId} className="tpl-script-block">
                {!info.isSetAudio && <h4 className="tpl-script-sub">{track.buttonLabel.replace('を再生', '')}</h4>}
                <ul className="tpl-script-lines">
                  {track.scriptLines.map((line, idx) => (
                    <li key={`${track.trackId}_${idx}`}>
                      {line.speaker && <span className="tpl-script-who">{line.speaker}</span>}
                      <p lang="en" className="tpl-script-en">{formatText(line.en, [], { prose: true, noMath: true })}</p>
                      <p className="tpl-script-ja">{line.ja}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
