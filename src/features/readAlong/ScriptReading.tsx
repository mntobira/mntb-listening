import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, SlidersHorizontal } from 'lucide-react';
import { loadReadAlong, type RaWord, type ReadAlong } from './readAlong';
import { AnnotLegend, AnnotToggles, AnnotatedScript, useAnnotOpts } from './AnnotatedScript';
import { DictationTip, ReadAlongStudio } from './ReadAlongStudio';
import { locateListeningEvidence } from '../../utils/listeningExplanation';
import './read-along.css';

/**
 * 解答・解説のスクリプトを「読み方つき」で出す（2026-10-08）
 *   強弱（丸）・アクセント（太字の音節）・区切り（/）・つながり（‿）・文末の上げ下げ（↗↘）・発音記号を、
 *   スクリプトそのものに重ねて表示する。単語を押すと、音源のその単語だけが鳴る。
 *   「聞き取りの決め手」の番号（黄色）もこれまでどおり付く。
 *   時刻データの無い音源・読み込み前は、従来のスクリプト（fallback）を出す。
 */

/** スクリプトの文字列の中で、各語がどこにあるか → 「決め手」の番号 */
function evidenceOf(data: ReadAlong, texts: string[], phrases: string[]): Map<number, number> {
  const out = new Map<number, number>();
  if (!phrases.length) return out;
  const full = texts.join('\n');
  const hits = texts.flatMap((t, k) => {
    const base = texts.slice(0, k).reduce((a, x) => a + x.length + 1, 0);
    return locateListeningEvidence(t, phrases).map(h => ({ ...h, start: h.start + base, end: h.end + base }));
  });
  let at = 0;
  for (const w of data.words) {
    const p = full.indexOf(w.text, at);
    if (p < 0) continue;
    at = p + w.text.length;
    const h = hits.find(x => p >= x.start && p < x.end);
    if (h) out.set(w.i, h.phraseIndex);
  }
  return out;
}

interface Track { subId: string; label: string; audioUrl?: string; script: string; turns?: { who: string; text: string }[]; translation?: string; keyPhrases?: { phrase: string }[] }

export function ScriptReading({ track, fallback, after, compact = false }: { track: Track; fallback: React.ReactNode; after?: React.ReactNode; compact?: boolean }) {
  const [data, setData] = useState<ReadAlong | null | undefined>(undefined);
  const [opts, setOpts] = useAnnotOpts();
  const [on, setOn] = useState<boolean>(() => { try { return localStorage.getItem('mtb_readalong_inline') !== 'off'; } catch { return true; } });
  const [studio, setStudio] = useState(false);
  const [picked, setPicked] = useState(-1);
  const [settings, setSettings] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const stopAt = useRef<number | null>(null);

  useEffect(() => { let alive = true; loadReadAlong(track.audioUrl).then(d => { if (alive) setData(d); }); return () => { alive = false; }; }, [track.audioUrl]);
  const evidence = useMemo(() => (data ? evidenceOf(data, track.turns?.length ? track.turns.map(t => t.text) : [track.script], (track.keyPhrases ?? []).map(k => k.phrase)) : new Map()), [data, track]);

  const playWord = (w: RaWord) => {
    setPicked(w.i);
    if (!track.audioUrl) return;
    if (!audio.current) {
      const a = new Audio(track.audioUrl); a.preload = 'auto';
      a.addEventListener('timeupdate', () => { if (stopAt.current != null && a.currentTime * 1000 >= stopAt.current) { a.pause(); stopAt.current = null; } });
      audio.current = a;
    }
    const a = audio.current;
    document.querySelectorAll('audio').forEach(el => { if (!el.paused) el.pause(); });
    a.currentTime = Math.max(0, (w.start - 60) / 1000);
    stopAt.current = w.end + 120;
    void a.play().catch(() => undefined);
  };
  useEffect(() => () => { audio.current?.pause(); }, []);
  const toggleOn = () => { const v = !on; setOn(v); try { localStorage.setItem('mtb_readalong_inline', v ? 'on' : 'off'); } catch { /* noop */ } };

  // 並び：スクリプト → 和訳 → [読み方 / 音読練習 / 表示] の1行 → 書き取りのすすめ（たたんだ状態）
  //   スクリプトの上には何も置かない（解説を読むじゃまにしない）。
  if (!data) return <>{fallback}{after}</>;
  return <div className={`ra-inline${compact ? ' is-compact' : ''}`} data-script-reading>
    {on ? <>
      <div className="ra-inline-text">
        <AnnotatedScript data={data} opts={opts} pickedId={picked} onWord={playWord} evidence={evidence} />
      </div>
      <AnnotLegend opts={opts} />
    </> : fallback}
    {after}
    <div className="ra-inline-bar">
      <button type="button" className="ra-inline-switch" aria-pressed={on} onClick={toggleOn}>
        <span aria-hidden="true" className="ra-inline-dot" />読み方
      </button>
      {on && <button type="button" className="ra-inline-set" aria-expanded={settings} onClick={() => setSettings(v => !v)} aria-label="表示するものを選ぶ"><SlidersHorizontal size={16} aria-hidden="true" />表示</button>}
      <button type="button" className="ra-entry is-compact" data-read-along-open onClick={() => setStudio(true)}>
        <Mic size={16} aria-hidden="true" />音読練習
      </button>
    </div>
    {on && settings && <AnnotToggles opts={opts} setOpts={setOpts} />}
    <DictationTip compact />
    {studio && <ReadAlongStudio track={track} onClose={() => setStudio(false)} />}
  </div>;
}
