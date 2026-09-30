import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Headphones, Search, SlidersHorizontal, Volume2 } from 'lucide-react';
import { VOCAB_LEVELS, type ListeningWord, type VocabularyData } from '../data/listeningSupport';
import { safeLocalStorage } from '../utils/safeLocalStorage';
import { stopSpeech, isSpeechSupported } from '../utils/listeningSpeech';
import { say } from './foundationShared';

/**
 * 単語・熟語タブ（A4・A19）。
 *   - 目標（プリセット）4つ＋検索＋「リスニングに出る語」だけを常に見せる。残りの絞り込みは畳む。
 *   - 一覧は1語1行（約56px）。スマホでも3語以上が見える。意味・4択・例文はタップで開く。
 */

/**
 * 目標別の範囲。語数はデータの level から数える（数字を直書きしない）。
 *   共通テストレベル … 単語・基礎／標準 ＋ 熟語・基礎
 *   国公立大         … ＋ 単語・発展 ＋ 熟語・標準
 *   難関私大         … 全レベル
 *   志望校別         … 志望校の出題に合わせてレベルを自分で選ぶ
 */
export const PRESETS = [
  { id: 'common', label: '共通テスト', full: '共通テストレベル', levels: ['lv1', 'lv2', 'ilv1'] },
  { id: 'national', label: '国公立大', full: '国公立大', levels: ['lv1', 'lv2', 'lv3', 'ilv1', 'ilv2'] },
  { id: 'private', label: '難関私大', full: '難関私大', levels: Object.keys(VOCAB_LEVELS) },
  { id: 'custom', label: '志望校別', full: '志望校別', levels: null },
] as const;
export type PresetId = typeof PRESETS[number]['id'];
const PREF_KEY = 'foundation_prefs_v1';
const PAGE = 20;

export function readPrefs(): { preset: PresetId; custom: string[] } {
  try {
    const p = JSON.parse(safeLocalStorage()?.getItem(PREF_KEY) || '{}');
    const preset: PresetId = PRESETS.some(x => x.id === p.preset) ? p.preset : 'common';
    const custom: string[] = Array.isArray(p.custom) ? p.custom.filter((l: unknown) => typeof l === 'string' && l in VOCAB_LEVELS) : [];
    return { preset, custom: custom.length ? custom : ['lv1'] };
  } catch { return { preset: 'common', custom: ['lv1'] }; }
}

function WordDetail({ word, onPractice }: { word: ListeningWord; onPractice: (chapter: string, index: number) => void }) {
  const [mode, setMode] = useState<'learn' | 'check'>('learn');
  const [direction, setDirection] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const q = word.questions[direction] || word.questions[0];
  return <div className="fd-word-detail">
    <div className="mt-segment fd-mini-seg" role="tablist" aria-label="単語の学習方法">
      <button role="tab" aria-selected={mode === 'learn'} onClick={() => { setMode('learn'); setAnswer(null); }}>意味</button>
      <button role="tab" aria-selected={mode === 'check'} onClick={() => { setMode('check'); setAnswer(null); }}>4択で確認</button>
    </div>
    {mode === 'learn' ? <p className="fd-definition">{word.fullMeaning}</p> : q && <div className="fd-quiz">
      {word.questions.length > 1 && <div className="fd-quiz-dir" role="group" aria-label="確認の向き">
        {word.questions.map((item, i) => <button key={item.id} type="button" aria-pressed={direction === i} onClick={() => { setDirection(i); setAnswer(null); }}>{i === 0 ? '英→日' : '日→英'}</button>)}
      </div>}
      <p className="fd-quiz-q">{q.prompt}：<b>{q.label}</b></p>
      <div className="fd-options">{q.options.map((o, i) => <button key={i} type="button" disabled={answer !== null} onClick={() => setAnswer(i)}
        data-correct={answer !== null && i === q.answerIndex ? true : undefined} data-wrong={answer === i && i !== q.answerIndex ? true : undefined}>{o}</button>)}</div>
      {answer !== null && <p className="fd-feedback" role="status"><strong>{answer === q.answerIndex ? '正解' : 'もう一度'}</strong> 正解：{q.options[q.answerIndex]} <button type="button" onClick={() => setAnswer(null)}>やり直す</button></p>}
    </div>}
    {word.examples.length > 0 && <details className="fd-examples">
      <summary><Headphones size={15} aria-hidden="true" />リスニングでの使われ方（{word.examples.length}大問）<ChevronDown size={15} aria-hidden="true" /></summary>
      {word.examples.map(ex => <section key={ex.chapterId}>
        <h4>{ex.chapterTitle}・第{ex.problemIndex + 1}回</h4>
        <p lang="en">{ex.script.length > 220 ? ex.script.slice(0, 220) + '…' : ex.script}</p>
        <div className="fd-example-actions">
          <audio controls preload="none" src={ex.audioUrl} aria-label={`${ex.chapterTitle} 第${ex.problemIndex + 1}回の音源`}
            onPlay={e => { stopSpeech(); document.querySelectorAll('audio').forEach(a => { if (a !== e.currentTarget) a.pause(); }); }} />
          <button type="button" onClick={() => onPractice(ex.chapterId, ex.problemIndex)}><Headphones size={15} aria-hidden="true" />この回を解く</button>
        </div>
      </section>)}
    </details>}
  </div>;
}

export interface FoundationWordsProps {
  known: ReadonlySet<string>;
  onMark: (id: string, done: boolean) => void;
  onPractice: (chapterId: string, index: number) => void;
}

export function FoundationWords({ known, onMark, onPractice }: FoundationWordsProps) {
  const [data, setData] = useState<VocabularyData | null>(null);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);
  const [prefs, setPrefs] = useState(readPrefs);
  const [query, setQuery] = useState('');
  const [listenOnly, setListenOnly] = useState(false);
  const [chapter, setChapter] = useState('');
  const [unlearned, setUnlearned] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [page, setPage] = useState(0);
  const [openWord, setOpenWord] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => { try { safeLocalStorage()?.setItem(PREF_KEY, JSON.stringify(prefs)); } catch { /* 保存できなくても表示は続ける */ } }, [prefs]);
  useEffect(() => {
    if (data) return;
    let alive = true; setLoadError('');
    const controller = new AbortController();
    fetch('/data/listeningVocabulary.json', { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error('Vocabulary unavailable'); return r.json(); })
      .then(v => { if (!Array.isArray(v.words) || !Array.isArray(v.chapters) || typeof v.wordCount !== 'number') throw new Error('Invalid vocabulary data'); if (alive) setData(v as VocabularyData); })
      .catch(() => { if (alive) setLoadError('単語を読み込めませんでした。接続を確認してください。'); });
    return () => { alive = false; controller.abort(); };
  }, [data, retry]);

  const levels = useMemo(() => new Set<string>(PRESETS.find(x => x.id === prefs.preset)!.levels ?? prefs.custom), [prefs]);
  const countByPreset = useMemo(() => {
    const byLevel: Record<string, number> = {};
    for (const w of data?.words ?? []) byLevel[w.level] = (byLevel[w.level] ?? 0) + 1;
    return Object.fromEntries(PRESETS.map(p => [p.id, ((p.levels ?? prefs.custom) as readonly string[]).reduce((n, l) => n + (byLevel[l] ?? 0), 0)]));
  }, [data, prefs.custom]);
  const filtered = useMemo(() => {
    const needle = query.normalize('NFKC').toLowerCase().trim();
    return (data?.words ?? []).filter(w => levels.has(w.level)
      && (!listenOnly || w.examples.length > 0)
      && (!chapter || w.chapterIds.includes(chapter))
      && (!unlearned || !known.has(w.id))
      && (!needle || (w.word + ' ' + w.fullMeaning).normalize('NFKC').toLowerCase().includes(needle)));
  }, [data, levels, listenOnly, chapter, unlearned, known, query]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const safePage = Math.min(page, pages - 1);
  const slice = filtered.slice(safePage * PAGE, safePage * PAGE + PAGE);
  const learned = useMemo(() => filtered.reduce((n, w) => n + (known.has(w.id) ? 1 : 0), 0), [filtered, known]);
  const goPage = (n: number) => { stopSpeech(); setPage(n); setOpenWord(null); listRef.current?.scrollTo({ top: 0 }); };
  const resetList = () => goPage(0);
  const extraFilters = (chapter ? 1 : 0) + (unlearned ? 1 : 0) + (prefs.preset === 'custom' ? 1 : 0);

  if (!data) return <section className="fd-panel fd-loading" role="status">
    {loadError ? <>{loadError}<button type="button" onClick={() => setRetry(n => n + 1)}>もう一度読み込む</button></> : '単語・熟語を読み込んでいます…'}
  </section>;

  return <section className="fd-panel fd-words" aria-label="単語・熟語">
    <div className="fd-presets" role="radiogroup" aria-label="目標">
      {PRESETS.map(p => <button key={p.id} type="button" role="radio" aria-checked={prefs.preset === p.id}
        onClick={() => { setPrefs(v => ({ ...v, preset: p.id })); if (p.id === 'custom') setFiltersOpen(true); resetList(); }}>
        <span aria-label={p.full}><span className="fd-preset-short">{p.label}</span><span className="fd-preset-full">{p.full}</span></span><small>{(countByPreset[p.id] ?? 0).toLocaleString()}語</small>
      </button>)}
    </div>
    <div className="fd-toolbar">
      <label className="fd-search"><Search size={17} aria-hidden="true" /><input type="search" aria-label="英語・日本語で検索" placeholder="単語を検索" value={query} onChange={e => { setQuery(e.target.value); resetList(); }} /></label>
      <button type="button" className="fd-chip" aria-pressed={listenOnly} onClick={() => { setListenOnly(v => !v); resetList(); }}><Headphones size={15} aria-hidden="true" /><span className="fd-long">リスニングに出る語</span><span className="fd-short" aria-hidden="true">聞く語</span></button>
      <button type="button" className="fd-chip fd-icon-chip" aria-expanded={filtersOpen} aria-controls="fd-filters" onClick={() => setFiltersOpen(v => !v)} aria-label={`ほかの絞り込み${extraFilters ? `（${extraFilters}件）` : ''}`}>
        <SlidersHorizontal size={16} aria-hidden="true" />{extraFilters > 0 && <b>{extraFilters}</b>}
      </button>
    </div>
    {filtersOpen && <div id="fd-filters" className="fd-filters">
      {prefs.preset === 'custom' && <fieldset><legend>志望校のレベル（出題に合わせて選ぶ）</legend><div className="fd-level-grid">
        {Object.entries(VOCAB_LEVELS).map(([id, label]) => <label key={id} className="fd-check"><input type="checkbox" checked={prefs.custom.includes(id)}
          onChange={e => { const on = e.target.checked; setPrefs(v => { const s = new Set(v.custom); if (on) s.add(id); else s.delete(id); return { ...v, custom: s.size ? [...s] : [id] }; }); resetList(); }} />{label}</label>)}
      </div></fieldset>}
      <label className="fd-select">大問で探す<span><select aria-label="対応するリスニング大問" value={chapter} onChange={e => { setChapter(e.target.value); resetList(); }}>
        <option value="">すべての大問</option>{data.chapters.map(c => <option key={c.id} value={c.id}>{c.title}に登場</option>)}
      </select><ChevronDown size={16} aria-hidden="true" /></span></label>
      <label className="fd-check"><input type="checkbox" checked={unlearned} onChange={e => { setUnlearned(e.target.checked); resetList(); }} />まだ覚えていない語だけ</label>
    </div>}
    <div className="fd-list-head">
      <span><b>{filtered.length.toLocaleString()}</b>語・覚えた {learned.toLocaleString()}</span>
      <button type="button" className="fd-chip" aria-pressed={sheet} onClick={() => setSheet(v => !v)}>意味を隠す</button>
    </div>
    {slice.length === 0 ? <p className="fd-empty" role="status">該当する語はありません。検索や絞り込みを変えてください。</p> :
      <ol className="fd-list" ref={listRef} aria-label={`第${safePage + 1}章の語`}>
        {slice.map(w => {
          const open = openWord === w.id; const isKnown = known.has(w.id);
          return <li key={w.id} className="fd-word" data-known={isKnown || undefined} data-open={open || undefined}>
            <div className="fd-word-row">
              <button type="button" className="fd-word-main" aria-expanded={open} onClick={() => { stopSpeech(); setOpenWord(open ? null : w.id); }}>
                <span className="fd-word-en" lang="en">{w.word}</span>
                <span className="fd-word-ja" data-hidden={(sheet && !open) || undefined}>{w.meaning}</span>
                <span className="fd-word-tags"><i>{VOCAB_LEVELS[w.level]}</i>{w.examples.length > 0 && <i className="fd-tag-listen">リスニング</i>}</span>
              </button>
              <button type="button" className="fd-icon" aria-label={`${w.word} を読み上げる`} disabled={!isSpeechSupported()} onClick={() => say(w.word)}><Volume2 size={18} aria-hidden="true" /></button>
              <button type="button" className="fd-icon fd-mark" aria-pressed={isKnown} aria-label={isKnown ? `${w.word} の覚えた印を外す` : `${w.word} を覚えた語にする`} onClick={() => onMark(w.id, !isKnown)}><Check size={18} aria-hidden="true" /></button>
            </div>
            {open && <WordDetail word={w} onPractice={onPractice} />}
          </li>;
        })}
      </ol>}
    <nav className="fd-pager" aria-label="章の切り替え">
      <button type="button" disabled={safePage === 0} onClick={() => goPage(safePage - 1)} aria-label="前の章"><ChevronLeft size={18} aria-hidden="true" /></button>
      <label className="fd-select"><span><select aria-label="章を選ぶ" value={safePage} onChange={e => goPage(Number(e.target.value))}>
        {Array.from({ length: pages }, (_, i) => <option key={i} value={i}>第{i + 1}章 / 全{pages}章</option>)}
      </select><ChevronDown size={16} aria-hidden="true" /></span></label>
      <button type="button" disabled={safePage >= pages - 1} onClick={() => goPage(safePage + 1)} aria-label="次の章"><ChevronRight size={18} aria-hidden="true" /></button>
    </nav>
  </section>;
}
