import { useEffect, useMemo, useState } from 'react';
import { CorrectBurst } from './fx/CorrectBurst';
import { BookOpen, Check, ChevronRight, Play, RotateCcw, Volume2, X } from 'lucide-react';
import { VOCAB_LEVELS, type VocabularyData } from '../data/listeningSupport';
import { applyQuizResult, buildQuiz, buildRangeQuiz, clampRange, COUNT_OPTIONS, QUIZ_SIZE, quizComment, rangeKey, rangeWords, readQuizPrefs, readQuizRecord, wordNumbers, writeQuizPrefs, writeQuizRecord, type QuizCount, type QuizDirection, type QuizItem, type QuizPrefs } from '../data/vocabQuiz';
import { play, primeAudio } from '../battle/ui/feedback';
import { recordVocabActivity } from '../battle/data/growthStore';
import { isSpeechSupported, stopSpeech } from '../utils/listeningSpeech';
import { sayWord, prefetchVocabAudioIndex } from './foundationShared';
import { hasVocabAudio, stopVocabAudio } from '../utils/vocabAudio';
import { TobiraBuddy } from './TobiraBuddy';
import { trackEvent } from '../utils/analytics';

/**
 * 英単語の4択（2026-10-01 D／2026-10-17 市販の単語アプリと同じ「出題の設定」）
 *   ［設定］レベル → 範囲 No.◯〜◯ → 問題数（10/20/30/50/100/全部）→ 順番（番号順/ランダム）
 *          → 出す語（まだの語だけ/すべて）→ 向き ─► ［出題］1問ずつ・すぐ正誤 ─► ［結果］番号順
 *   - 語の番号は単語帳と同じ（レベルごとに No.1 から）
 *   - 正解で ✓、間違えると ✓ が外れて復習待ちへ
 *   - 既定は「番号順 × まだの語だけ」。解くたびに続きの番号から出る＝抜けが出ない
 *   - 設定（範囲はレベルごと）は端末に保存し、次に開いたときも同じ
 * 単語帳とは別の画面。1画面に収め、スクロールは設定の中だけ。
 */
/** 何を解いているか：範囲（レベル・No.◯〜◯）／間違えた語 */
type Scope = { kind: 'range'; level: string; from: number; to: number } | { kind: 'missed' };
const scopeKey = (sc: Scope) => sc.kind === 'range' ? rangeKey(sc.level, sc.from, sc.to) : 'missed';
type Phase = { kind: 'pick' } | { kind: 'play'; items: QuizItem[]; i: number; picks: (number | null)[]; scope: Scope } | { kind: 'done'; items: QuizItem[]; picks: number[]; scope: Scope };

/** 範囲のすぐ選べる候補（市販アプリの「1〜100」「101〜200」…と同じ） */
const RANGE_STEP = 100;

let cache: VocabularyData | null = null;

export function VocabQuiz({ uid, known, onMark, onWordbook }: { uid: string; known: ReadonlySet<string>; onMark: (id: string) => void; onWordbook: () => void }) {
  const [data, setData] = useState<VocabularyData | null>(cache);
  const [err, setErr] = useState('');
  const [level, setLevel] = useState('lv1');
  const [dir, setDir] = useState<QuizDirection>('mix');
  const [rec, setRec] = useState(() => readQuizRecord(uid));
  const [prefs, setPrefs] = useState<QuizPrefs>(() => readQuizPrefs(uid));
  const [phase, setPhase] = useState<Phase>({ kind: 'pick' });
  /** 範囲の入力中の文字（確定するまで数字に直さない） */
  const [draft, setDraft] = useState<{ from: string; to: string } | null>(null);

  useEffect(() => {
    if (data) return;
    const c = new AbortController();
    fetch('/data/listeningVocabulary.json', { signal: c.signal }).then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(v => { cache = v; setData(v); }).catch(() => setErr('単語を読み込めませんでした。接続を確認してください。'));
    return () => c.abort();
  }, [data]);
  useEffect(() => { prefetchVocabAudioIndex(); return () => { stopSpeech(); stopVocabAudio(); }; }, []);
  useEffect(() => { writeQuizPrefs(uid, prefs); }, [uid, prefs]);

  const levels = useMemo(() => Object.keys(VOCAB_LEVELS).filter(l => data?.words.some(w => w.level === l)), [data]);
  const missedSet = useMemo(() => new Set(rec.missed), [rec.missed]);
  const mastered = useMemo(() => new Set(rec.mastered ?? []), [rec.mastered]);
  const numbers = useMemo(() => wordNumbers(data?.words ?? []), [data]);
  const lvCount = useMemo(() => data ? data.words.filter(w => w.level === level).length : 0, [data, level]);

  if (!data) return <section className="fd-panel fd-loading" role="status">{err || '単語を読み込んでいます…'}</section>;

  const saved = prefs.ranges[level] ?? [1, Math.min(RANGE_STEP, lvCount)];
  const [from, to] = clampRange(saved[0], saved[1], lvCount);
  const setRange = (a: number, b: number) => { setDraft(null); setPrefs(p => ({ ...p, ranges: { ...p.ranges, [level]: clampRange(a, b, lvCount) } })); };
  const list = rangeWords(data.words, level, from, to);
  const learnedInRange = list.reduce((n, w) => n + (mastered.has(w.id) ? 1 : 0), 0);
  const pool = prefs.only === 'unlearned' ? list.length - learnedInRange : list.length;

  const save = (results: { wordId: string; correct: boolean }[], scope: Scope) => {
    const nextRec = applyQuizResult(rec, results, scopeKey(scope));
    writeQuizRecord(uid, nextRec); setRec(nextRec);
  };
  const begin = (items: QuizItem[], scope: Scope) => {
    if (!items.length) return;
    setPhase({ kind: 'play', items: items.map(x => ({ ...x, no: x.no ?? numbers.get(x.wordId) })), i: 0, picks: items.map(() => null), scope });
  };
  /** 設定どおりに出題する */
  const startRange = () => {
    primeAudio();
    const { items } = buildRangeQuiz(list, prefs, { mastered, missed: rec.missed, dir, seed: Date.now(), numbers });
    trackEvent('vocab_quiz_start');
    begin(items, { kind: 'range', level, from, to });
  };
  const startMissed = () => {
    primeAudio();
    begin(buildQuiz(data.words.filter(w => missedSet.has(w.id)), { missed: rec.missed, dir, size: prefs.count === 'all' ? rec.missed.length : prefs.count, seed: Date.now() }), { kind: 'missed' });
  };

  if (phase.kind === 'play') {
    /** やめる：答えた分だけ記録して（✓・復習待ち）、設定の画面へ */
    const quit = () => {
      stopSpeech();
      const results = phase.items.flatMap((x, j) => phase.picks[j] === null ? [] : [{ wordId: x.wordId, correct: phase.picks[j] === x.q.answerIndex }]);
      if (results.length) save(results, phase.scope);
      setPhase({ kind: 'pick' });
    };
    const it = phase.items[phase.i];
    const pick = phase.picks[phase.i];
    const answered = pick !== null;
    const choose = (k: number) => {
      if (answered) return;
      const ok = k === it.q.answerIndex;
      play(ok ? 'correct' : 'wrong', !ok);
      const picks = phase.picks.slice(); picks[phase.i] = k;
      setPhase({ ...phase, picks });
    };
    const next = () => {
      stopSpeech();
      if (phase.i + 1 < phase.items.length) { setPhase({ ...phase, i: phase.i + 1 }); return; }
      const picks = phase.picks as number[];
      const results = phase.items.map((x, j) => ({ wordId: x.wordId, correct: picks[j] === x.q.answerIndex }));
      save(results, phase.scope);
      const score = results.filter(r => r.correct).length;
      void recordVocabActivity('vocab_quiz');
      if (score === phase.items.length && phase.items.length >= QUIZ_SIZE) void recordVocabActivity('vocab_perfect');
      play(score === phase.items.length ? 'win' : score >= phase.items.length / 2 ? 'levelup' : 'tap', false);
      setPhase({ kind: 'done', items: phase.items, picks, scope: phase.scope });
    };
    return <section className="fd-panel vq-play" aria-label="英単語の4択" data-vocab-quiz="play">
      <div className="vq-top">
        <button type="button" className="fd-chip" onClick={quit} aria-label="やめて出題の設定にもどる（答えた分は記録する）"><X size={16} aria-hidden="true" />やめる</button>
        {phase.items.length <= 30
          ? <ol className="vq-dots" aria-label={`${phase.i + 1}問目 / 全${phase.items.length}問`}>{phase.items.map((x, j) => {
              const p = phase.picks[j];
              return <li key={j} data-now={j === phase.i || undefined} data-state={p === null ? undefined : p === x.q.answerIndex ? 'ok' : 'ng'} />;
            })}</ol>
          : <div className="vq-bar" role="progressbar" aria-label="進み具合" aria-valuemin={0} aria-valuemax={phase.items.length} aria-valuenow={phase.i + 1}>
              <i style={{ width: `${(phase.i + 1) / phase.items.length * 100}%` }} /><small>正解 {phase.picks.filter((p, j) => p !== null && p === phase.items[j]!.q.answerIndex).length}</small>
            </div>}
        <b className="vq-count">{phase.i + 1}<small>/{phase.items.length}</small></b>
      </div>
      <article className="vq-card" key={it.q.id}>
        <p className="vq-prompt">{it.no !== undefined && <span className="vq-no" data-vocab-no={it.no}>No.{it.no}</span>}{it.q.prompt}</p>
        <p className="vq-label" lang={it.dir === 'e2j' ? 'en' : 'ja'}>{it.q.label}
          {it.dir === 'e2j' && <button type="button" className="fd-icon" aria-label={`${it.word} を読み上げる`} disabled={!isSpeechSupported() && !hasVocabAudio(it.wordId)} onClick={() => sayWord(it.wordId, it.word)}><Volume2 size={18} aria-hidden="true" /></button>}
        </p>
      </article>
      <div className="vq-options" role="group" aria-label="選択肢">{it.q.options.map((o, k) => <button key={k} type="button" disabled={answered} onClick={() => choose(k)}
        lang={it.dir === 'j2e' ? 'en' : 'ja'}
        data-correct={answered && k === it.q.answerIndex ? true : undefined} data-wrong={answered && pick === k && k !== it.q.answerIndex ? true : undefined}>
        <i aria-hidden="true">{'①②③④'[k]}</i><span>{o.split(/([0-9]+)/g).map((part, index) => /[0-9]+/.test(part) ? <span className="vq-number-glyph" key={index}>{part}</span> : part)}</span>{answered && k === it.q.answerIndex && <Check size={18} aria-hidden="true" />}
      </button>)}</div>
      {answered && pick === it.q.answerIndex && <CorrectBurst burstKey={it.q.id} combo={streakAt(phase.items, phase.picks, phase.i)} />}
      <div className="vq-foot" aria-live="polite">
        {answered ? <>
          <p className="vq-judge" data-ok={pick === it.q.answerIndex || undefined}>{pick === it.q.answerIndex ? '正解！' : <>正解は <b>{it.q.options[it.q.answerIndex]}</b></>}</p>
          <button type="button" className="vq-next" onClick={next} autoFocus>{phase.i + 1 < phase.items.length ? '次の問題' : '結果を見る'}<ChevronRight size={18} aria-hidden="true" /></button>
        </> : <p className="vq-hint">わからなければ、いちばん近いものを選ぼう</p>}
      </div>
    </section>;
  }

  if (phase.kind === 'done') {
    const sc = phase.scope;
    const ok = (j: number) => phase.picks[j] === phase.items[j]!.q.answerIndex;
    const score = phase.items.filter((_, j) => ok(j)).length;
    const wrong = phase.items.filter((_, j) => !ok(j));
    const title = sc.kind === 'range' ? `${VOCAB_LEVELS[sc.level]}　No.${sc.from}〜${sc.to}` : '間違えた語';
    const rangeLeft = sc.kind === 'range' ? rangeWords(data.words, sc.level, sc.from, sc.to).filter(w => !mastered.has(w.id)).length : 0;
    const line = sc.kind === 'range'
      ? (rangeLeft === 0 ? 'この範囲はぜんぶ ✓！ 次の範囲へ進もう' : `この範囲のまだの語は あと${rangeLeft}語`)
      : quizComment(score, phase.items.length);
    const nextFrom = sc.kind === 'range' ? sc.to + 1 : 0;
    const hasNextRange = sc.kind === 'range' && nextFrom <= data.words.filter(w => w.level === sc.level).length;
    // 結果の並びは番号順（どの番号を落としたかが一目で分かる）
    const order = phase.items.map((x, j) => ({ x, j })).sort((p, q) => (p.x.no ?? 0) - (q.x.no ?? 0));
    return <section className="fd-panel vq-done" aria-label="結果" data-vocab-quiz="done">
      <div className="vq-score" data-perfect={score === phase.items.length || undefined}>
        <strong>{score}<small>/{phase.items.length}</small></strong>
        <span className="vq-score-body"><b className="vq-score-title">{title}</b><TobiraBuddy size="sm" input={{ screen: 'study' }} line={line} /></span>
      </div>
      <ul className="vq-result" aria-label="この回の語（番号順）">{order.map(({ x, j }) => <li key={x.q.id} data-ok={ok(j) || undefined}>
        {x.no !== undefined && <i>No.{x.no}</i>}<span lang="en">{x.word}</span><span>{x.dir === 'e2j' ? x.q.options[x.q.answerIndex] : x.q.label}</span>
        {ok(j) ? <Check size={16} aria-label="正解" /> : <X size={16} aria-label="不正解" />}
      </li>)}</ul>
      <div className="vq-done-actions">
        {wrong.length > 0 && <button type="button" className="vq-next" onClick={() => {
          begin(buildQuiz(data.words.filter(w => wrong.some(x => x.wordId === w.id)), { dir, size: wrong.length, seed: Date.now() }), sc);
        }}><RotateCcw size={17} aria-hidden="true" />間違えた{wrong.length}語だけもう一度</button>}
        {sc.kind === 'range' && rangeLeft > 0 && <button type="button" className={wrong.length ? 'fd-secondary' : 'vq-next'} onClick={startRange} data-vocab-continue>
          続けて{prefs.count === 'all' ? '残り全部' : `${prefs.count}問`}<ChevronRight size={16} aria-hidden="true" /></button>}
        {sc.kind === 'range' && rangeLeft === 0 && hasNextRange && <button type="button" className={wrong.length ? 'fd-secondary' : 'vq-next'} onClick={() => {
          const len = sc.to - sc.from + 1; setLevel(sc.level); setRange(nextFrom, nextFrom + len - 1); setPhase({ kind: 'pick' });
        }}>次の範囲へ（No.{nextFrom}〜）<ChevronRight size={16} aria-hidden="true" /></button>}
        <button type="button" className="fd-secondary" onClick={onWordbook}><BookOpen size={16} aria-hidden="true" />単語帳で見直す</button>
        <button type="button" className="fd-secondary" onClick={() => setPhase({ kind: 'pick' })}>出題の設定へ</button>
      </div>
      {score === phase.items.length && phase.items.every(x => known.has(x.wordId)) === false && <button type="button" className="fd-chip vq-markall" onClick={() => phase.items.forEach(x => onMark(x.wordId))}><Check size={15} aria-hidden="true" />この{phase.items.length}語を単語帳でも「覚えた」にする</button>}
    </section>;
  }

  // ---------------- 出題の設定 ----------------
  const presets = Array.from({ length: Math.ceil(lvCount / RANGE_STEP) }, (_, i) => [i * RANGE_STEP + 1, Math.min(lvCount, (i + 1) * RANGE_STEP)] as const);
  const nCount = prefs.count === 'all' ? pool : Math.min(prefs.count, pool);
  const allDone = prefs.only === 'unlearned' && pool === 0;
  const startLabel = allDone ? `全部 ✓ 済み。すべての語から${prefs.count === 'all' ? list.length : Math.min(prefs.count as number, list.length)}問` : `${nCount}問はじめる`;
  const firstUnlearned = list.find(w => !mastered.has(w.id));
  const seg = <T extends string | number>(label: string, value: T, opts: readonly (readonly [T, string])[], onPick: (v: T) => void, attr: string) =>
    <div className="vq-set-row"><span className="vq-set-label">{label}</span>
      <div className="vq-seg" role="radiogroup" aria-label={label} data-vocab-set={attr}>{opts.map(([v, t]) => <button key={String(v)} type="button" role="radio" aria-checked={value === v} onClick={() => onPick(v)}>{t}</button>)}</div>
    </div>;
  return <section className="fd-panel vq-pick vq-setup" aria-label="出題の設定" data-vocab-quiz="pick">
    <div className="fd-levels" role="tablist" aria-label="レベル">{levels.map(l => {
      const n = data.words.filter(w => w.level === l).length;
      return <button key={l} type="button" role="tab" aria-selected={level === l} onClick={() => { setLevel(l); setDraft(null); }}><span>{VOCAB_LEVELS[l]}</span><small>{n.toLocaleString()}語</small></button>;
    })}</div>
    <div className="vq-set-scroll">
      <div className="vq-set-row vq-range">
        <span className="vq-set-label">範囲</span>
        <div className="vq-range-inputs">
          <label>No.<input type="number" inputMode="numeric" min={1} max={lvCount} aria-label="範囲のはじめの番号" data-vocab-from
            value={draft?.from ?? String(from)} onChange={e => setDraft({ from: e.target.value, to: draft?.to ?? String(to) })}
            onBlur={() => draft && setRange(Number(draft.from) || 1, Number(draft.to) || lvCount)} /></label>
          <span aria-hidden="true">〜</span>
          <label><input type="number" inputMode="numeric" min={1} max={lvCount} aria-label="範囲のおわりの番号" data-vocab-to
            value={draft?.to ?? String(to)} onChange={e => setDraft({ from: draft?.from ?? String(from), to: e.target.value })}
            onBlur={() => draft && setRange(Number(draft.from) || 1, Number(draft.to) || lvCount)} /></label>
          <small>/ 全{lvCount.toLocaleString()}語</small>
        </div>
        <div className="vq-range-presets" aria-label="範囲をすぐ選ぶ">{presets.map(([a, b]) => {
          const ws = rangeWords(data.words, level, a, b); const got = ws.reduce((n, w) => n + (mastered.has(w.id) ? 1 : 0), 0);
          return <button key={a} type="button" aria-pressed={from === a && to === b} onClick={() => setRange(a, b)} data-vocab-preset={a}
            data-state={got === ws.length ? 'clear' : got > 0 ? 'part' : undefined}>
            <b>{a}〜{b}</b><small>{got === ws.length ? 'ぜんぶ ✓' : `✓ ${got}`}</small><i aria-hidden="true"><em style={{ width: `${got / ws.length * 100}%` }} /></i>
          </button>;
        })}{lvCount > RANGE_STEP && <button type="button" aria-pressed={from === 1 && to === lvCount} onClick={() => setRange(1, lvCount)}><b>全部</b><small>1〜{lvCount.toLocaleString()}</small></button>}</div>
      </div>
      {seg<QuizCount>('問題数', prefs.count, COUNT_OPTIONS.map(c => [c, c === 'all' ? '全部' : `${c}問`] as const), v => setPrefs(p => ({ ...p, count: v })), 'count')}
      {seg('順番', prefs.order, [['number', '番号順'], ['random', 'ランダム']] as const, v => setPrefs(p => ({ ...p, order: v })), 'order')}
      {seg('出す語', prefs.only, [['unlearned', 'まだ ✓ がない語'], ['all', 'すべて']] as const, v => setPrefs(p => ({ ...p, only: v })), 'only')}
      {seg('向き', dir, [['mix', 'まぜる'], ['e2j', '英→日'], ['j2e', '日→英']] as const, v => setDir(v), 'dir')}
    </div>
    <div className="vq-start-box">
      <p className="vq-start-sum" aria-live="polite">No.{from}〜{to}（{list.length}語）の ✓ <b>{learnedInRange}</b>/{list.length}
        {prefs.order === 'number' && prefs.only === 'unlearned' && firstUnlearned && <>　・No.{numbers.get(firstUnlearned.id)} から</>}</p>
      <button type="button" className="vq-next vq-start" onClick={startRange} disabled={list.length === 0} data-vocab-start><Play size={18} aria-hidden="true" />{startLabel}</button>
      {rec.missed.length > 0 && <button type="button" className="fd-secondary vq-missed-btn" onClick={startMissed} data-vocab-missed>
        <RotateCcw size={16} aria-hidden="true" />間違えた語から解く（復習待ち {rec.missed.length}語）</button>}
    </div>
  </section>;
}

/** i問目までの連続正解数（2問以上でCOMBO表示） */
function streakAt(items: readonly { q: { answerIndex: number } }[], picks: readonly (number | null)[], i: number): number {
  let n = 0;
  for (let j = i; j >= 0; j--) { if (picks[j] === items[j]!.q.answerIndex) n++; else break; }
  return n;
}
