import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, SlidersHorizontal } from 'lucide-react';
import { loadReadAlong, wordAt, type RaWord, type ReadAlong } from './readAlong';
import { AnnotLegend, AnnotToggles, AnnotatedScript, useAnnotOpts } from './AnnotatedScript';
import { DictationTip, ReadAlongStudio } from './ReadAlongStudio';
import { locateListeningEvidence } from '../../utils/listeningExplanation';
import './read-along.css';
import { pauseAllAudio } from '../../utils/audioElements';

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


/**
 * いま読まれている単語（2026-10-12）
 *   音読練習を開かなくても、上の［▶問N］などで音源を流すと、スクリプトの中で
 *   いま読まれている単語（と語群）が光るようにする。
 *   ページ内の <audio> のうち、この音源（audioUrl）を鳴らしているものを捕まえて時刻を追う。
 *   どのプレーヤーが鳴らしているかに依存しないよう、document の play/pause を capture で拾う。
 */
function sameSrc(el: HTMLAudioElement, url: string) {
  const src = el.currentSrc || el.src || el.getAttribute('src') || '';
  if (!src) return false;
  try { return new URL(src, location.href).pathname === new URL(url, location.href).pathname; } catch { return src.endsWith(url); }
}
function useLiveWord(audioUrl: string | undefined, data: ReadAlong | null | undefined): number {
  const [cur, setCur] = useState(-1);
  useEffect(() => {
    if (!audioUrl || !data) return;
    let raf = 0; let el: HTMLAudioElement | null = null; let last = -2;
    const tick = () => {
      if (!el || el.paused || el.ended) { raf = 0; return; }
      const idx = wordAt(data.words, el.currentTime * 1000);
      if (idx !== last) { last = idx; setCur(idx); }
      raf = requestAnimationFrame(tick);
    };
    const start = (a: HTMLAudioElement) => { el = a; if (!raf) raf = requestAnimationFrame(tick); };
    const onPlay = (e: Event) => {
      const a = e.target;
      if (!(a instanceof HTMLAudioElement)) return;
      if (sameSrc(a, audioUrl)) start(a);
      else if (el) { el = null; last = -2; setCur(-1); } // ほかの音源に切り替わった
    };
    const onStop = (e: Event) => {
      if (e.target !== el) return;
      // 最後まで流れた・最初に戻された → 光を消す。一時停止なら位置を残す
      if (e.type === 'ended' || (el && el.currentTime === 0)) { last = -2; setCur(-1); }
    };
    const onSeek = (e: Event) => { if (e.target === el && el) { const idx = wordAt(data.words, el.currentTime * 1000); last = idx; setCur(el.currentTime === 0 ? -1 : idx); } };
    document.addEventListener('play', onPlay, true);
    document.addEventListener('pause', onStop, true);
    document.addEventListener('ended', onStop, true);
    document.addEventListener('seeked', onSeek, true);
    // 開いた時点ですでに鳴っている場合
    document.querySelectorAll('audio').forEach(a => { if (!a.paused && sameSrc(a, audioUrl)) start(a); });
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('play', onPlay, true);
      document.removeEventListener('pause', onStop, true);
      document.removeEventListener('ended', onStop, true);
      document.removeEventListener('seeked', onSeek, true);
    };
  }, [audioUrl, data]);
  return cur;
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
  const cur = useLiveWord(track.audioUrl, data);
  const curChunk = cur >= 0 && data ? data.words[cur]?.chunk ?? -1 : -1;

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
    pauseAllAudio();
    a.currentTime = Math.max(0, (w.start - 60) / 1000);
    stopAt.current = w.end + 120;
    // 自動再生の制限で拒まれたら、利用者が再生ボタンを押せばよい
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
        <AnnotatedScript data={data} opts={opts} cur={cur} curChunk={curChunk} pickedId={picked} onWord={playWord} evidence={evidence} />
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
