import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff, Headphones, Lightbulb, Mic, Pause, PenLine, Play, Repeat, RotateCcw, Volume2, X } from 'lucide-react';
import { AnnotLegend, AnnotToggles, AnnotatedScript, useAnnotOpts } from './AnnotatedScript';
import {
  type RaChunk, type RaWord, type ReadAlong,
  LINK_LABEL, loadReadAlong, toIpa, wordAt,
} from './readAlong';
import './read-along.css';

/**
 * 音読練習（2026-10-08）
 * ------------------------------------------------------------------
 * 解答・解説のスクリプトから開く「練習室」。解説の文を読むだけで終わらせず、
 * 実際の音源に合わせて 聞く → まねる を1か所でできるようにする（書き取りは紙でやるよう勧める）。
 *
 *  ・聞く／音読 … いま流れている単語を光らせる（音源の時刻データ public/read_along/）
 *                 語群（意味のかたまり）の区切り「/」、音のつながり（連結・脱落・同化…）、弱く読む語
 *                 単語を押すとその位置から再生し、発音記号・音節・強勢を出す
 *                 音読は「いっしょに読む（オーバーラッピング）」「文字を隠す（シャドーイング）」
 *                 「語群ごとに止まる（リピート）」
 */

type Mode = 'listen' | 'speak';
type SpeakStyle = 'overlap' | 'shadow' | 'repeat';
const RATES = [0.75, 0.9, 1] as const;

interface Track { subId: string; label: string; audioUrl?: string; translation?: string }

export function ReadAlongStudio({ track, onClose }: { track: Track; onClose: () => void }) {
  const [data, setData] = useState<ReadAlong | null | undefined>(undefined);
  const [mode, setMode] = useState<Mode>('listen');
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState<number>(1);
  const [cur, setCur] = useState(-1);
  const [picked, setPicked] = useState<RaWord | null>(null);
  // 表示の切り替え（強弱・アクセント・発音記号・区切り・つながり）。端末に覚えておく
  const [opts, setOpts] = useAnnotOpts();
  const [speakStyle, setSpeakStyle] = useState<SpeakStyle>('overlap');
  const [hideText, setHideText] = useState(false);
  // 区間再生（語群・文・1語）。stopAt を過ぎたら止める
  const stopAt = useRef<number | null>(null);
  const loopSeg = useRef<{ start: number; end: number } | null>(null);
  const [loopOn, setLoopOn] = useState(false);
  // リピート（語群ごとに止まる）
  const [yourTurn, setYourTurn] = useState<{ chunk: number; until: number } | null>(null);
  const turnTimer = useRef<number | null>(null);
  const textRef = useRef<HTMLDivElement>(null);
  /** リピート：もう「あなたの番」を出した語群（同じ所で止まり続けないように） */
  const repeatDone = useRef(-1);

  useEffect(() => { let alive = true; loadReadAlong(track.audioUrl).then(d => { if (alive) setData(d); }); return () => { alive = false; }; }, [track.audioUrl]);

  // 開いている間は後ろの画面をスクロールさせない・Esc で閉じる
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.querySelectorAll('audio').forEach(el => { if (el !== audioRef.current && !el.paused) el.pause(); });
    return () => { window.removeEventListener('keydown', onKey); if (turnTimer.current) window.clearTimeout(turnTimer.current); };
  }, [onClose]);

  const words = data?.words ?? [];
  const chunks = data?.chunks ?? [];

  // ---------- 再生 ----------
  const clearTurn = () => { if (turnTimer.current) window.clearTimeout(turnTimer.current); turnTimer.current = null; setYourTurn(null); };
  const playFrom = useCallback((ms: number, untilMs: number | null = null) => {
    const el = audioRef.current; if (!el) return;
    clearTurn();
    stopAt.current = untilMs;
    if (untilMs == null) loopSeg.current = null;
    if (data) { const k = wordAt(data.words, ms); repeatDone.current = k >= 0 ? data.words[k].chunk - (ms <= data.words[k].start + 200 ? 1 : 0) : -1; }
    el.currentTime = Math.max(0, ms / 1000);
    el.playbackRate = rate;
    void el.play().catch(() => undefined);
  }, [rate, data]);
  const pause = () => { audioRef.current?.pause(); clearTurn(); };
  const playSeg = useCallback((start: number, end: number) => { playFrom(Math.max(0, start - 120), end + 180); loopSeg.current = { start, end: end + 180 }; }, [playFrom]);

  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = rate; }, [rate]);

  // 時刻 → いまの単語（requestAnimationFrame。単語が変わったときだけ描き直す）
  useEffect(() => {
    let raf = 0; let last = -2;
    const tick = () => {
      const el = audioRef.current;
      if (el && data) {
        const ms = el.currentTime * 1000;
        const idx = wordAt(data.words, ms);
        if (idx !== last) { last = idx; setCur(idx); }
        if (stopAt.current != null && ms >= stopAt.current && !el.paused) {
          const seg = loopSeg.current;
          if (seg && loopOn) { el.currentTime = Math.max(0, (seg.start - 120) / 1000); }
          else { el.pause(); stopAt.current = null; }
        }
        // リピート：語群の終わりで止めて「あなたの番」
        if (mode === 'speak' && speakStyle === 'repeat' && !el.paused && idx >= 0 && stopAt.current == null) {
          const c = data.chunks[data.words[idx].chunk];
          // 前に戻った（3秒もどる・シークバー・最初から）ときは、そこからまた止まるようにする
          if (c && c.i < repeatDone.current) repeatDone.current = c.i - 1;
          if (c && c.i > repeatDone.current && ms >= c.end + 120) {
            repeatDone.current = c.i;
            el.pause();
            const wait = Math.round((c.end - c.start) * 1.4 / rate + 900);
            setYourTurn({ chunk: c.i, until: Date.now() + wait });
            turnTimer.current = window.setTimeout(() => {
              setYourTurn(null);
              const nx = data.chunks[c.i + 1];
              if (nx && audioRef.current) { audioRef.current.currentTime = Math.max(0, (nx.start - 80) / 1000); void audioRef.current.play().catch(() => undefined); }
            }, wait);
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [data, mode, speakStyle, rate, loopOn]);

  // 光っている語が見えるようにスクロール
  useEffect(() => {
    if (cur < 0 || !playing) return;
    const box = textRef.current; const el = box?.querySelector<HTMLElement>(`[data-w="${cur}"]`);
    if (!box || !el) return;
    const b = box.getBoundingClientRect(); const r = el.getBoundingClientRect();
    if (r.top < b.top + 8 || r.bottom > b.bottom - 8) box.scrollTop += r.top - b.top - b.height * 0.35;
  }, [cur, playing]);

  const curChunk = cur >= 0 ? words[cur]?.chunk ?? -1 : -1;
  const back3 = () => { const el = audioRef.current; if (el) playFrom(Math.max(0, el.currentTime * 1000 - 3000)); };
  const toggle = () => { const el = audioRef.current; if (!el) return; if (el.paused) { if (yourTurn) clearTurn(); void el.play().catch(() => undefined); el.playbackRate = rate; } else pause(); };
  const repeatChunk = () => {
    const c = chunks[curChunk >= 0 ? curChunk : 0]; if (!c) return;
    playSeg(c.start, c.end);
  };

  const onWord = (w: RaWord) => { setPicked(w); playSeg(w.start, w.end); };

  const body = <div className="ra-studio" role="dialog" aria-modal="true" aria-label="音読練習" data-read-along>
    <audio ref={audioRef} src={track.audioUrl} preload="auto" playsInline
      onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); stopAt.current = null; repeatDone.current = -1; }} />
    <header className="ra-head">
      <button type="button" className="ra-icon" onClick={onClose} aria-label="閉じる"><X size={20} /></button>
      <h2>音読練習<small>{track.label}</small></h2>
      <div className="ra-rate" role="group" aria-label="再生の速さ">
        {RATES.map(r => <button key={r} type="button" aria-pressed={rate === r} onClick={() => setRate(r)}>{r === 1 ? '1倍' : `${r}倍`}</button>)}
      </div>
    </header>
    <nav className="ra-tabs" role="tablist">
      {([['listen', '聞きながら見る', Headphones], ['speak', '音読する', Mic]] as const).map(([k, label, Icon]) =>
        <button key={k} type="button" role="tab" aria-selected={mode === k} onClick={() => { pause(); setMode(k); setPicked(null); }}><Icon size={16} aria-hidden="true" />{label}</button>)}
    </nav>

    {data === undefined && <p className="ra-msg">読み込み中…</p>}
    {data === null && <p className="ra-msg">この音源はまだ音読練習に対応していません。</p>}

    {data && <>
      <div className="ra-toggles">
        {mode === 'speak' && <div className="ra-seg" role="group" aria-label="音読のしかた">
          {([['overlap', 'いっしょに読む'], ['shadow', '追いかける'], ['repeat', '語群ごとに止まる']] as const).map(([k, l]) =>
            <button key={k} type="button" aria-pressed={speakStyle === k} onClick={() => { pause(); setSpeakStyle(k); setHideText(k === 'shadow'); repeatDone.current = -1; }}>{l}</button>)}
        </div>}
        <div className="ra-chips-row">
          <AnnotToggles opts={opts} setOpts={setOpts} />
          {mode === 'speak' && <button type="button" className="ra-hide" aria-pressed={hideText} onClick={() => setHideText(v => !v)}>{hideText ? <EyeOff size={14} /> : <Eye size={14} />}文字を隠す</button>}
        </div>
        <AnnotLegend opts={opts} />
      </div>
      <div ref={textRef} className="ra-text" data-ra-text>
        <AnnotatedScript data={data} opts={opts} cur={cur} curChunk={curChunk} pickedId={picked?.i ?? -1} onWord={onWord} hidden={hideText} />
      </div>
      {picked ? <WordCard w={picked} next={words[picked.i + 1]} onPlay={() => playSeg(picked.start, picked.end)} onClose={() => setPicked(null)} />
        : yourTurn ? <TurnCard chunk={chunks[yourTurn.chunk]} until={yourTurn.until} />
        : <Legend mode={mode} />}
      {!picked && !yourTurn && !playing && <DictationTip compact />}
      <footer className="ra-controls">
        <button type="button" className="ra-icon" onClick={back3} aria-label="3秒もどる"><RotateCcw size={20} /></button>
        <button type="button" className="ra-play" onClick={toggle} aria-label={playing ? '一時停止' : '再生'}>{playing ? <Pause size={24} /> : <Play size={24} />}</button>
        <button type="button" className="ra-icon" onClick={repeatChunk} aria-label="いまの語群をもう一度"><Repeat size={20} /></button>
        <label className="ra-loop"><input type="checkbox" checked={loopOn} onChange={e => setLoopOn(e.target.checked)} />くり返す</label>
      </footer>
    </>}

  </div>;
  return createPortal(body, document.body);
}

/**
 * ディクテーションのすすめ（2026-10-08）。アプリでは書き取りの採点はしないが、
 * 紙に書き取ると「聞こえたつもり」が見えるようになるので、やり方を短く勧める。
 */
export function DictationTip({ compact = false }: { compact?: boolean }) {
  return <details className={`ra-dtip${compact ? ' is-compact' : ''}`} data-dictation-tip>
    <summary><PenLine size={16} aria-hidden="true" /><span><b>書き取り（ディクテーション）もやってみよう</b><small>聞き取れたつもりの所が分かります</small></span></summary>
    <ol>
      <li><b>スクリプトを隠して</b>、1文ずつ音声を止めながら<b>紙に書き取る</b>（0.75倍でOK）</li>
      <li>「読み方」を開いて答え合わせ。<b>書けなかった語に丸</b>をつける</li>
      <li>丸をつけた語を見る：<b>白い点の語</b>（弱く読む a・the・to など）と <b>‿ の所</b>（音がつながる所）が多いはず。そこを意識してもう一度聞く</li>
    </ol>
  </details>;
}

function Legend({ mode }: { mode: Mode }) {
  return <div className="ra-legend">
    {mode === 'listen'
      ? <p><Lightbulb size={14} aria-hidden="true" />光っている単語が、いま流れている音です。大きい丸ほど強く読まれています。単語を押すと、その語を聞いて発音を確かめられます。</p>
      : <p><Lightbulb size={14} aria-hidden="true" />まず「いっしょに読む」で音に重ねて読み、慣れたら「追いかける」（文字を隠す）へ。大きい丸の語を強く、白い点の語は軽く短く。／で息をつぎ、‿の所はつなげて読みます。</p>}
  </div>;
}

function TurnCard({ chunk, until }: { chunk?: RaChunk; until: number }) {
  const [left, setLeft] = useState(until - Date.now());
  useEffect(() => { const t = window.setInterval(() => setLeft(until - Date.now()), 100); return () => window.clearInterval(t); }, [until]);
  return <div className="ra-turn" aria-live="polite"><Mic size={18} aria-hidden="true" /><div><b>あなたの番：まねして言ってみよう</b><p lang="en">{chunk?.text}</p></div><span>{Math.max(0, Math.ceil(left / 1000))}</span></div>;
}

function WordCard({ w, next, onPlay, onClose }: { w: RaWord; next?: RaWord; onPlay: () => void; onClose: () => void }) {
  const p = toIpa(w.arpabet);
  const link = w.link && next ? LINK_LABEL[w.link] : null;
  return <div className="ra-card" aria-live="polite">
    <div className="ra-card-main">
      <b lang="en">{w.text.replace(/[.,!?;:"”]+$/, '')}</b>
      {p.ipa ? <span className="ra-ipa">/{p.ipa}/</span> : <span className="ra-ipa is-none">発音記号なし（固有名詞など）</span>}
      <button type="button" className="ra-icon" onClick={onPlay} aria-label="この単語を聞く"><Volume2 size={18} /></button>
      <button type="button" className="ra-icon" onClick={onClose} aria-label="閉じる"><X size={18} /></button>
    </div>
    <p className="ra-card-sub">
      {w.syl.length > 1 && <span className="ra-card-syl" lang="en">{w.syl.map((x, k) => <b key={k} data-acc={k === w.stressSyl || undefined}>{x}</b>)}<em>{w.syl.length}音節・{w.stressSyl + 1}つ目を強く</em></span>}
      {w.weakIpa && <span>弱く読む語：この文では <b className="ra-ipa-inline">/{w.weakIpa}/</b> と短く・あいまいに（ていねいに言うと /{p.ipa}/）</span>}
      {w.level === 'focus' && <span>この語群でいちばん強く読まれている語（伝えたい中心）</span>}
      {w.tone && <span>文の終わり：声を{w.tone === 'up' ? '上げる ↗（Yes / No で答える疑問）' : '下げる ↘'}</span>}
      {link && <span><b>{link.name}</b>（{w.text.replace(/[.,]$/, '')} ‿ {next!.text.replace(/[.,]$/, '')}）：{link.tip}</span>}
    </p>
  </div>;
}
