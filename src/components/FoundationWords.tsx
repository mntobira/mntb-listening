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
  const [level, setLevel] = useState<string>('');
  const [pos, setPos] = useState(readPos);
  const [mapOpen, setMapOpen] = useState(false);
  /** ★2段階★ まず範囲を選ぶ画面 → 単語帳の画面（範囲ボタンで単語帳を圧迫しない・2026-10-02 D2） */
  const [stage, setStage] = useState<'range' | 'book'>('range');
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

  if (!data) return <section className="fd-panel fd-loading" role="status">
    {loadError ? <>{loadError}<button type="button" onClick={() => setRetry(n => n + 1)}>もう一度読み込む</button></> : '単語・熟語を読み込んでいます…'}
  </section>;

  const levelTotals = (ids: readonly string[]) => {
    const all = (data.words ?? []).filter(w => ids.includes(w.level));
    return { total: all.length, learned: all.reduce((n, w) => n + (known.has(w.id) ? 1 : 0), 0) };
  };
  const presetNow = PRESETS.find(x => x.id === prefs.preset)!;
  /* ★2つの画面に分ける（2026-10-05 ご指摘「これじゃあ単語勉強できない」）★
       ① 絞る画面 … 目標・レベル・条件・検索をここで全部決める（単語は出さない）
       ② 学ぶ画面 … 単語だけ。上は「‹ 絞り込む」と今の範囲の1行、下は100語ずつめくるだけ
     絞り込みを単語帳の上に積むと単語が1〜2語しか見えなくなるので、同じ画面に置かない。 */
  if (stage === 'range') {
    const startLabel = searching ? `「${query.trim()}」の検索結果を見る（${base.length.toLocaleString()}語）`
      : curLevel ? `${curLevel.label}を覚える（${curLevel.ids.length.toLocaleString()}語）` : 'この範囲で覚える';
    return <section className="fd-panel fd-words fd-range" aria-label="覚える単語を絞る" data-fd-range>
      <div className="fd-range-scroll">
        <header className="fd-range-head"><h2>覚える単語を絞る</h2><p>目標とレベルを選んで「覚える」を押すと、単語だけの画面になります。</p></header>
        <fieldset className="fd-range-step"><legend><b>1</b>目標</legend>
          <div className="fd-range-list" role="radiogroup" aria-label="目標">
            {PRESETS.map(p => {
              const lv = (p.levels ?? prefs.custom) as readonly string[];
              const t = levelTotals(lv);
              const pct = t.total ? Math.round(t.learned / t.total * 100) : 0;
              return <button key={p.id} type="button" role="radio" aria-checked={prefs.preset === p.id} data-fd-range-pick={p.id}
                onClick={() => { setPrefs(v => ({ ...v, preset: p.id })); setLevel(''); resetList(); }}>
                <span className="fd-range-title"><strong>{p.full}</strong><small>{(countByPreset[p.id] ?? 0).toLocaleString()}語{p.id === 'custom' ? '・レベルを自分で選ぶ' : ''}・覚えた{pct}%</small></span>
                <span className="fd-range-meter" aria-hidden="true"><i style={{ width: `${pct}%` }} /></span>
              </button>;
            })}
          </div>
          {prefs.preset === 'custom' && <div className="fd-level-grid fd-range-custom" role="group" aria-label="志望校のレベル">
            {Object.entries(VOCAB_LEVELS).map(([id, label]) => <label key={id} className="fd-check"><input type="checkbox" checked={prefs.custom.includes(id)}
              onChange={e => { const on = e.target.checked; setPrefs(v => { const s2 = new Set(v.custom); if (on) s2.add(id); else s2.delete(id); return { ...v, custom: s2.size ? [...s2] : [id] }; }); resetList(); }} />{label}</label>)}
          </div>}
        </fieldset>
        {levelList.length > 0 && <fieldset className="fd-range-step"><legend><b>2</b>いま覚えるレベル</legend>
          <div className="fd-range-levels" role="radiogroup" aria-label="レベル" data-fd-levels>
            {levelList.map(l => <button key={l.id} type="button" role="radio" aria-checked={curLevel?.id === l.id} onClick={() => pickLevel(l.id)}>
              <span>{l.label}</span><small>覚えた {l.learned.toLocaleString()} / {l.ids.length.toLocaleString()}</small>
              <i aria-hidden="true" style={{ ['--p' as string]: `${Math.round(l.learned / l.ids.length * 100)}%` }} />
            </button>)}
          </div>
        </fieldset>}
        <fieldset className="fd-range-step"><legend><b>3</b>条件（なくてもよい）</legend>
          <div className="fd-range-conds">
            <label className="fd-check"><input type="checkbox" checked={listenOnly} onChange={e => { setListenOnly(e.target.checked); resetList(); }} /><Headphones size={15} aria-hidden="true" />リスニングに出る語だけ</label>
            <label className="fd-check"><input type="checkbox" checked={unlearned} onChange={e => { setUnlearned(e.target.checked); resetList(); }} />まだ覚えていない語だけ</label>
            <label className="fd-select">大問で探す<span><select aria-label="対応するリスニング大問" value={chapter} onChange={e => { setChapter(e.target.value); resetList(); }}>
              <option value="">すべての大問</option>{data.chapters.map(c => <option key={c.id} value={c.id}>{c.title}に登場</option>)}
            </select><ChevronDown size={16} aria-hidden="true" /></span></label>
            <label className="fd-search"><Search size={17} aria-hidden="true" /><input type="search" aria-label="英語・日本語で検索" placeholder="単語をさがす（英語・日本語）" value={query} onChange={e => { setQuery(e.target.value); resetList(); }} /></label>
          </div>
        </fieldset>
        <p className="fd-goal-guide">目標の目安です。得点や志望校の出題範囲を保証するものではありません。</p>
      </div>
      <div className="fd-range-start">
        <button type="button" className="fd-range-go-btn" data-fd-start disabled={base.length === 0} onClick={() => { stopSpeech(); setStage('book'); }}>
          <Play size={18} aria-hidden="true" />{base.length === 0 ? '条件に合う語がありません' : startLabel}
        </button>
      </div>
    </section>;
  }

  const condTags = [listenOnly && 'リスニング', unlearned && '未習得のみ', chapter && (data.chapters.find(c => c.id === chapter)?.title ?? ''), searching && `「${query.trim()}」`].filter(Boolean) as string[];
  return <section className="fd-panel fd-words fd-book" aria-label="単語を覚える" data-fd-book>
    <div className="fd-book-head">
      <button type="button" className="fd-range-back" onClick={() => { stopSpeech(); setStage('range'); }} data-fd-range-back><SlidersHorizontal size={15} aria-hidden="true" />絞り込む</button>
      <span className="fd-book-title"><strong>{searching ? '検索結果' : curLevel?.label ?? presetNow.full}</strong>
        <small>{condTags.length ? condTags.join('・') : presetNow.full}</small></span>
      <span className="fd-book-count" data-fd-chapter>{searching || !curChapter ? `${filtered.length.toLocaleString()}語` : <>覚えた <b>{curChapter.learned}</b>/{curChapter.ids.length}</>}</span>
    </div>
    <div className="fd-hide" role="radiogroup" aria-label="隠す" data-fd-hide>
      <EyeOff size={15} aria-hidden="true" /><span>隠す</span>
      {([['none', 'なし'], ['ja', '意味'], ['en', '英語']] as const).map(([v, t]) => <button key={v} type="button" role="radio" aria-checked={hide === v} onClick={() => { setHide(v); setPeek(new Set()); }}>{t}</button>)}
      {hide !== 'none' && <small>タップでのぞける</small>}
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
                {(searching || w.examples.length > 0) && <span className="fd-word-tags">{searching && <i>{VOCAB_LEVELS[w.level]}</i>}{w.examples.length > 0 && <i className="fd-tag-listen">リスニング</i>}</span>}
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
