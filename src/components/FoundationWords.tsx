import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronLeft, ChevronRight, EyeOff, Headphones, Map as MapIcon, Play, Search, SlidersHorizontal, Volume2 } from 'lucide-react';
import { chapterState, groupBlocks, nextChapter, splitChapters } from '../data/vocabChapters';
import { Dialog } from './ui';
import { VOCAB_LEVELS, type ListeningWord, type VocabularyData } from '../data/listeningSupport';
import { safeLocalStorage } from '../utils/safeLocalStorage';
import { stopSpeech, isSpeechSupported } from '../utils/listeningSpeech';
import { say } from './foundationShared';
import { VOCAB_PREF_KEY } from '../utils/vocabGoal';

/**
 * 単語・熟語タブ（A4・A19）。
 *   - 目標（プリセット）4つ＋検索＋「リスニングに出る語」だけを常に見せる。残りの絞り込みは畳む。
 *   - 一覧は1語1行（約56px）。スマホでも3語以上が見える。意味・4択・例文はタップで開く。
 */

/**
 * 目標別の範囲。語数はデータの level から数える（数字を直書きしない）。
 *   共通テスト6〜8割 … 単語・共通テスト6割〜／8割〜 ＋ 熟語・共通テスト6割〜
 *   2次試験レベル    … ＋ 単語・2次試験レベル ＋ 熟語・共通テスト8割〜
 *   2次＋追加        … 全レベル
 *   志望校別         … 志望校の出題に合わせてレベルを自分で選ぶ
 */
export const PRESETS = [
  { id: 'common', label: '共通6〜8割', full: '共通テスト6〜8割を目標に', levels: ['lv1', 'lv2', 'ilv1'] },
  { id: 'national', label: '2次試験', full: '2次試験レベル', levels: ['lv1', 'lv2', 'lv3', 'ilv1', 'ilv2'] },
  { id: 'private', label: '2次＋追加', full: '2次試験の追加語彙まで', levels: Object.keys(VOCAB_LEVELS) },
  { id: 'custom', label: '志望校別', full: '志望校別', levels: null },
] as const;
export type PresetId = typeof PRESETS[number]['id'];
const PREF_KEY = VOCAB_PREF_KEY;
/** 単語帳の1ページ＝100語（2026-10-01 D：100語ずつめくる） */
export const WORDBOOK_PAGE = 100;
const PAGE = WORDBOOK_PAGE;
const POS_KEY = 'foundation_word_pos_v1';
/** レベルごとに最後に開いた章（次に開いたとき同じ場所から） */
function readPos(): Record<string, number> {
  try { const v = JSON.parse(safeLocalStorage()?.getItem(POS_KEY) || '{}'); return v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([k, n]) => k in VOCAB_LEVELS && Number.isInteger(n) && (n as number) >= 0)) as Record<string, number> : {}; } catch { return {}; }
}

export function readPrefs(): { preset: PresetId; custom: string[] } {
  try {
    const p = JSON.parse(safeLocalStorage()?.getItem(PREF_KEY) || '{}');
    const preset: PresetId = PRESETS.some(x => x.id === p.preset) ? p.preset : 'common';
    const custom: string[] = Array.isArray(p.custom) ? p.custom.filter((l: unknown) => typeof l === 'string' && l in VOCAB_LEVELS) : [];
    return { preset, custom: custom.length ? custom : ['lv1'] };
  } catch { return { preset: 'common', custom: ['lv1'] }; }
}

function WordDetail({ word, onPractice }: { word: ListeningWord; onPractice: (chapter: string, index: number) => void }) {
  // 2026-10-01 D：辞書としての役割に絞る（4択の確認は「4択で解く」タブへ移した）
  return <div className="fd-word-detail">
    <p className="fd-definition">{word.fullMeaning}</p>
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
  /** 隠す：なし／意味／英語（赤シートの代わり）。隠した語はタップで1語ずつのぞける */
  const [hide, setHide] = useState<'none' | 'ja' | 'en'>('none');
  const [peek, setPeek] = useState<ReadonlySet<string>>(new Set());
  const [slide, setSlide] = useState<'next' | 'prev' | ''>('');
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [page, setPage] = useState(0);
  const [openWord, setOpenWord] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [level, setLevel] = useState<string>('');
  const [pos, setPos] = useState(readPos);
  const [mapOpen, setMapOpen] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => { try { safeLocalStorage()?.setItem(PREF_KEY, JSON.stringify(prefs)); } catch { /* 保存できなくても表示は続ける */ } }, [prefs]);
  useEffect(() => { try { safeLocalStorage()?.setItem(POS_KEY, JSON.stringify(pos)); } catch { /* 同上 */ } }, [pos]);
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
  const needle = query.normalize('NFKC').toLowerCase().trim();
  const searching = needle.length > 0;
  /** 検索・絞り込み（「まだ覚えていない語だけ」以外）を通した語。章の区切りはこれで決めるので、覚えても章がずれない */
  const base = useMemo(() => (data?.words ?? []).filter(w => levels.has(w.level)
      && (!listenOnly || w.examples.length > 0)
      && (!chapter || w.chapterIds.includes(chapter))
      && (!needle || (w.word + ' ' + w.fullMeaning).normalize('NFKC').toLowerCase().includes(needle))), [data, levels, listenOnly, chapter, needle]);
  const wordById = useMemo(() => new Map((data?.words ?? []).map(w => [w.id, w])), [data]);
  /** ★分け方★ レベル → 100語のまとまり → 20語の章。章番号はレベルごとに1から */
  const levelList = useMemo(() => Object.keys(VOCAB_LEVELS).filter(l => levels.has(l)).map(id => {
    const ids = base.filter(w => w.level === id).map(w => w.id);
    return { id, label: VOCAB_LEVELS[id], ids, learned: ids.reduce((n, x) => n + (known.has(x) ? 1 : 0), 0) };
  }).filter(l => l.ids.length > 0), [base, levels, known]);
  const curLevel = levelList.find(l => l.id === level) ?? levelList.find(l => l.learned < l.ids.length) ?? levelList[0];
  const chapters = useMemo(() => curLevel ? splitChapters(curLevel.ids, known, WORDBOOK_PAGE) : [], [curLevel, known]);
  const blocks = useMemo(() => groupBlocks(chapters, 5), [chapters]);
  const resume = nextChapter(chapters);
  const chapterIndex = curLevel ? Math.min(pos[curLevel.id] ?? resume, Math.max(0, chapters.length - 1)) : 0;
  const curChapter = chapters[chapterIndex];
  // 検索中はレベルをまたいだ結果を20語ずつ
  const pages = searching ? Math.max(1, Math.ceil(base.length / PAGE)) : Math.max(1, chapters.length);
  const safePage = searching ? Math.min(page, pages - 1) : chapterIndex;
  const pageWords = searching ? base.slice(safePage * PAGE, safePage * PAGE + PAGE) : (curChapter?.ids ?? []).map(id => wordById.get(id)!).filter(Boolean);
  const slice = unlearned ? pageWords.filter(w => !known.has(w.id)) : pageWords;
  const filtered = base;
  const learned = useMemo(() => filtered.reduce((n, w) => n + (known.has(w.id) ? 1 : 0), 0), [filtered, known]);
  const goPage = (n: number) => {
    stopSpeech(); setOpenWord(null); setPeek(new Set()); setSlide(n > safePage ? 'next' : n < safePage ? 'prev' : ''); listRef.current?.scrollTo({ top: 0 });
    if (searching || !curLevel) setPage(n); else setPos(v => ({ ...v, [curLevel.id]: Math.max(0, Math.min(n, chapters.length - 1)) }));
  };
  const resetList = () => { stopSpeech(); setPage(0); setOpenWord(null); listRef.current?.scrollTo({ top: 0 }); };
  const pickLevel = (id: string) => { stopSpeech(); setOpenWord(null); setLevel(id); listRef.current?.scrollTo({ top: 0 }); };
  const extraFilters = (chapter ? 1 : 0) + (unlearned ? 1 : 0) + (prefs.preset === 'custom' ? 1 : 0);

  if (!data) return <section className="fd-panel fd-loading" role="status">
    {loadError ? <>{loadError}<button type="button" onClick={() => setRetry(n => n + 1)}>もう一度読み込む</button></> : '単語・熟語を読み込んでいます…'}
  </section>;

  return <section className="fd-panel fd-words" aria-label="単語・熟語">
    <p className="fd-goal-guide" style={{fontSize:12}}>目標の目安です。得点や志望校の出題範囲を保証するものではありません。</p><div className="fd-presets" role="radiogroup" aria-label="目標">
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
    {!searching && levelList.length > 1 && <div className="fd-levels" role="tablist" aria-label="レベル" data-fd-levels>
      {levelList.map(l => <button key={l.id} type="button" role="tab" aria-selected={curLevel?.id === l.id} onClick={() => pickLevel(l.id)}>
        <span>{l.label}</span><small>{l.learned.toLocaleString()}/{l.ids.length.toLocaleString()}</small>
        <i aria-hidden="true" style={{ ['--p' as string]: `${Math.round(l.learned / l.ids.length * 100)}%` }} />
      </button>)}
    </div>}
    <div className="fd-hide" role="radiogroup" aria-label="隠す" data-fd-hide>
      <EyeOff size={15} aria-hidden="true" /><span>隠す</span>
      {([['none', 'なし'], ['ja', '意味'], ['en', '英語']] as const).map(([v, t]) => <button key={v} type="button" role="radio" aria-checked={hide === v} onClick={() => { setHide(v); setPeek(new Set()); }}>{t}</button>)}
      {hide !== 'none' && <small>タップでのぞける</small>}
      {hide === 'none' && <span className="fd-hide-now" data-fd-chapter>{searching || !curChapter ? `${filtered.length.toLocaleString()}語` : `覚えた ${curChapter.learned}/${curChapter.ids.length}`}</span>}
    </div>
    <div className="fd-list-head">
      {searching || !curChapter
        ? <span><b>{filtered.length.toLocaleString()}</b>語・覚えた {learned.toLocaleString()}</span>
        : <span className="fd-chapter-now" data-fd-chapter><b>{curChapter.from}〜{curChapter.to}語</b><span className="fd-chapter-range">{chapterIndex + 1} / {chapters.length}</span><span>覚えた {curChapter.learned}/{curChapter.ids.length}</span></span>}
    </div>
    {slice.length === 0 ? <p className="fd-empty" role="status">{unlearned && pageWords.length > 0 ? 'この100語は全部覚えました。次の100語へ進もう' : '該当する語はありません。検索や絞り込みを変えてください。'}</p> :
      <ol className="fd-list" ref={listRef} aria-label={`第${safePage + 1}ページの語`} key={`${curLevel?.id}:${safePage}`} data-slide={slide || undefined}
        onTouchStart={e => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY }; }}
        onTouchEnd={e => {
          // ★左右にスワイプで次・前の100語★ 縦スクロールと取り違えないよう、横の動きが十分大きいときだけ
          const st = touch.current; touch.current = null; if (!st) return;
          const t = e.changedTouches[0]; const dx = t.clientX - st.x; const dy = t.clientY - st.y;
          if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
          if (dx < 0 && safePage < pages - 1) goPage(safePage + 1);
          if (dx > 0 && safePage > 0) goPage(safePage - 1);
        }}>
        {slice.map(w => {
          const open = openWord === w.id; const isKnown = known.has(w.id);
          return <li key={w.id} className="fd-word" data-known={isKnown || undefined} data-open={open || undefined}>
            <div className="fd-word-row">
              <button type="button" className="fd-word-main" aria-expanded={open} onClick={() => {
                stopSpeech();
                if (hide !== 'none' && !peek.has(w.id) && !open) { setPeek(v => new Set(v).add(w.id)); return; }
                setOpenWord(open ? null : w.id);
              }}>
                <span className="fd-word-en" lang="en" data-hidden={(hide === 'en' && !open && !peek.has(w.id)) || undefined}>{w.word}</span>
                <span className="fd-word-ja" data-hidden={(hide === 'ja' && !open && !peek.has(w.id)) || undefined}>{w.meaning}</span>
                <span className="fd-word-tags"><i>{VOCAB_LEVELS[w.level]}</i>{w.examples.length > 0 && <i className="fd-tag-listen">リスニング</i>}</span>
              </button>
              <button type="button" className="fd-icon" aria-label={`${w.word} を読み上げる`} disabled={!isSpeechSupported()} onClick={() => say(w.word)}><Volume2 size={18} aria-hidden="true" /></button>
              <button type="button" className="fd-icon fd-mark" aria-pressed={isKnown} aria-label={isKnown ? `${w.word} の覚えた印を外す` : `${w.word} を覚えた語にする`} onClick={() => onMark(w.id, !isKnown)}><Check size={18} aria-hidden="true" /></button>
            </div>
            {open && <WordDetail word={w} onPractice={onPractice} />}
          </li>;
        })}
      </ol>}
    <nav className="fd-pager" aria-label="100語ずつめくる">
      <button type="button" disabled={safePage === 0} onClick={() => goPage(safePage - 1)} aria-label="前の100語"><ChevronLeft size={18} aria-hidden="true" /></button>
      {searching || !curLevel
        ? <label className="fd-select"><span><select aria-label="章を選ぶ" value={safePage} onChange={e => goPage(Number(e.target.value))}>
            {Array.from({ length: pages }, (_, i) => <option key={i} value={i}>検索結果 {i + 1} / {pages}</option>)}
          </select><ChevronDown size={16} aria-hidden="true" /></span></label>
        : <button type="button" className="fd-map-open" onClick={() => setMapOpen(true)} aria-haspopup="dialog" data-fd-map-open>
            <MapIcon size={16} aria-hidden="true" /><span>{curChapter ? `${curChapter.from}〜${curChapter.to}` : ''}語 <small>{chapterIndex + 1}/{chapters.length}</small>{curChapter && <small className="fd-map-open-learned"> · 覚えた {curChapter.learned}/{curChapter.ids.length}</small>}</span><ChevronDown size={16} aria-hidden="true" />
          </button>}
      <button type="button" disabled={safePage >= pages - 1} onClick={() => goPage(safePage + 1)} aria-label="次の100語"><ChevronRight size={18} aria-hidden="true" /></button>
    </nav>
    {curLevel && <Dialog open={mapOpen} onClose={() => setMapOpen(false)} title={`${curLevel.label}・100語ずつ`} className="fd-map">
      <p className="fd-map-sum">全{chapters.length}ページ（{WORDBOOK_PAGE}語ずつ・左右にスワイプでもめくれる）・覚えた {curLevel.learned.toLocaleString()}/{curLevel.ids.length.toLocaleString()}語</p>
      <button type="button" className="fd-map-resume" onClick={() => { goPage(resume); setMapOpen(false); }}><Play size={16} aria-hidden="true" />続きから：{chapters[resume]?.from ?? 1}語目〜</button>
      <div className="fd-map-blocks" data-fd-map>{blocks.map(b => <section key={b.index} className="fd-map-block">
        <h3><span>{b.from}〜{b.to}語</span><small>覚えた {b.learned}/{b.total}</small></h3>
        <ol>{b.chapters.map(c => <li key={c.index}><button type="button" data-state={chapterState(c)} aria-current={c.index === chapterIndex ? 'true' : undefined}
          aria-label={`${c.from}〜${c.to}語目 覚えた${c.learned}/${c.ids.length}`} onClick={() => { goPage(c.index); setMapOpen(false); }}>
          <b>{c.from}〜</b><small>{c.learned}/{c.ids.length}</small></button></li>)}</ol>
      </section>)}</div>
    </Dialog>}
  </section>;
}
