import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, ChevronRight, RotateCcw, Volume2, X } from 'lucide-react';
import { VOCAB_LEVELS, type ListeningWord, type VocabularyData } from '../data/listeningSupport';
import { applyQuizResult, blockCount, blockKey, blockWords, buildQuiz, BLOCK_SIZE, QUIZ_SIZE, quizComment, readQuizRecord, writeQuizRecord, type QuizDirection, type QuizItem } from '../data/vocabQuiz';
import { play, primeAudio } from '../battle/ui/feedback';
import { recordVocabActivity } from '../battle/data/growthStore';
import { isSpeechSupported, stopSpeech } from '../utils/listeningSpeech';
import { say } from './foundationShared';
import { TobiraBuddy } from './TobiraBuddy';

/**
 * 英単語の4択（2026-10-01 D）
 *   ［範囲を選ぶ］レベル → 100語 → 向き  ─►  ［10問］1問ずつ・すぐ正誤  ─►  ［結果］点数・間違えた語・次の一手
 * 単語帳とは別の画面。1画面に収め、スクロールは範囲一覧の中だけ。
 */
type Phase = { kind: 'pick' } | { kind: 'play'; items: QuizItem[]; i: number; picks: (number | null)[]; block: string } | { kind: 'done'; items: QuizItem[]; picks: number[]; block: string };

let cache: VocabularyData | null = null;

export function VocabQuiz({ uid, known, onMark, onWordbook }: { uid: string; known: ReadonlySet<string>; onMark: (id: string) => void; onWordbook: () => void }) {
  const [data, setData] = useState<VocabularyData | null>(cache);
  const [err, setErr] = useState('');
  const [level, setLevel] = useState('lv1');
  const [dir, setDir] = useState<QuizDirection>('mix');
  const [rec, setRec] = useState(() => readQuizRecord(uid));
  const [phase, setPhase] = useState<Phase>({ kind: 'pick' });

  useEffect(() => {
    if (data) return;
    const c = new AbortController();
    fetch('/data/listeningVocabulary.json', { signal: c.signal }).then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(v => { cache = v; setData(v); }).catch(() => setErr('単語を読み込めませんでした。接続を確認してください。'));
    return () => c.abort();
  }, [data]);
  useEffect(() => () => stopSpeech(), []);

  const levels = useMemo(() => Object.keys(VOCAB_LEVELS).filter(l => data?.words.some(w => w.level === l)), [data]);
  const blocks = data ? blockCount(data.words, level) : 0;
  const missedSet = useMemo(() => new Set(rec.missed), [rec.missed]);

  if (!data) return <section className="fd-panel fd-loading" role="status">{err || '単語を読み込んでいます…'}</section>;

  const start = (block: number, onlyMissed = false) => {
    primeAudio();
    const words: ListeningWord[] = onlyMissed ? data.words.filter(w => missedSet.has(w.id)) : blockWords(data.words, level, block);
    const items = buildQuiz(words, { missed: rec.missed, dir, seed: Date.now() });
    if (!items.length) return;
    setPhase({ kind: 'play', items, i: 0, picks: items.map(() => null), block: onlyMissed ? 'missed' : blockKey(level, block) });
  };

  if (phase.kind === 'play') {
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
      const nextRec = applyQuizResult(rec, results, phase.block);
      writeQuizRecord(uid, nextRec); setRec(nextRec);
      const score = results.filter(r => r.correct).length;
      void recordVocabActivity('vocab_quiz');
      if (score === phase.items.length && phase.items.length >= QUIZ_SIZE) void recordVocabActivity('vocab_perfect');
      play(score === phase.items.length ? 'win' : score >= phase.items.length / 2 ? 'levelup' : 'tap', false);
      setPhase({ kind: 'done', items: phase.items, picks, block: phase.block });
    };
    return <section className="fd-panel vq-play" aria-label="英単語の4択" data-vocab-quiz="play">
      <div className="vq-top">
        <button type="button" className="fd-chip" onClick={() => { stopSpeech(); setPhase({ kind: 'pick' }); }} aria-label="やめて範囲選びにもどる"><X size={16} aria-hidden="true" />やめる</button>
        <ol className="vq-dots" aria-label={`${phase.i + 1}問目 / 全${phase.items.length}問`}>{phase.items.map((x, j) => {
          const p = phase.picks[j];
          return <li key={j} data-now={j === phase.i || undefined} data-state={p === null ? undefined : p === x.q.answerIndex ? 'ok' : 'ng'} />;
        })}</ol>
        <b className="vq-count">{phase.i + 1}<small>/{phase.items.length}</small></b>
      </div>
      <article className="vq-card" key={it.q.id}>
        <p className="vq-prompt">{it.q.prompt}</p>
        <p className="vq-label" lang={it.dir === 'e2j' ? 'en' : 'ja'}>{it.q.label}
          {it.dir === 'e2j' && <button type="button" className="fd-icon" aria-label={`${it.word} を読み上げる`} disabled={!isSpeechSupported()} onClick={() => say(it.word)}><Volume2 size={18} aria-hidden="true" /></button>}
        </p>
      </article>
      <div className="vq-options" role="group" aria-label="選択肢">{it.q.options.map((o, k) => <button key={k} type="button" disabled={answered} onClick={() => choose(k)}
        lang={it.dir === 'j2e' ? 'en' : 'ja'}
        data-correct={answered && k === it.q.answerIndex ? true : undefined} data-wrong={answered && pick === k && k !== it.q.answerIndex ? true : undefined}>
        <i aria-hidden="true">{'①②③④'[k]}</i><span>{o}</span>{answered && k === it.q.answerIndex && <Check size={18} aria-hidden="true" />}
      </button>)}</div>
      <div className="vq-foot" aria-live="polite">
        {answered ? <>
          <p className="vq-judge" data-ok={pick === it.q.answerIndex || undefined}>{pick === it.q.answerIndex ? '正解！' : <>正解は <b>{it.q.options[it.q.answerIndex]}</b></>}</p>
          <button type="button" className="vq-next" onClick={next} autoFocus>{phase.i + 1 < phase.items.length ? '次の問題' : '結果を見る'}<ChevronRight size={18} aria-hidden="true" /></button>
        </> : <p className="vq-hint">わからなければ、いちばん近いものを選ぼう</p>}
      </div>
    </section>;
  }

  if (phase.kind === 'done') {
    const score = phase.items.filter((x, j) => phase.picks[j] === x.q.answerIndex).length;
    const wrong = phase.items.filter((x, j) => phase.picks[j] !== x.q.answerIndex);
    const [lv, b] = phase.block.split(':');
    return <section className="fd-panel vq-done" aria-label="結果" data-vocab-quiz="done">
      <div className="vq-score" data-perfect={score === phase.items.length || undefined}>
        <strong>{score}<small>/{phase.items.length}</small></strong>
        <TobiraBuddy size="sm" input={{ screen: 'study' }} line={quizComment(score, phase.items.length)} />
      </div>
      {wrong.length > 0 && <>
        <p className="vq-sub">間違えた語（次のセットで先に出ます）</p>
        <ul className="vq-wrong">{wrong.map(x => <li key={x.q.id}>
          <span lang="en">{x.word}</span><span>{x.dir === 'e2j' ? x.q.options[x.q.answerIndex] : x.q.label}</span>
        </li>)}</ul>
      </>}
      <div className="vq-done-actions">
        {wrong.length > 0 && <button type="button" className="vq-next" onClick={() => {
          const items = buildQuiz(data.words.filter(w => wrong.some(x => x.wordId === w.id)), { dir, size: wrong.length, seed: Date.now() });
          setPhase({ kind: 'play', items, i: 0, picks: items.map(() => null), block: phase.block });
        }}><RotateCcw size={17} aria-hidden="true" />間違えた{wrong.length}語だけもう一度</button>}
        {phase.block !== 'missed' && <button type="button" className="fd-secondary" onClick={() => start(Number(b))}>同じ範囲で次の{QUIZ_SIZE}問</button>}
        {phase.block !== 'missed' && Number(b) + 1 < blockCount(data.words, lv) && <button type="button" className="fd-secondary" onClick={() => { setLevel(lv); start(Number(b) + 1); }}>次の100語へ<ChevronRight size={16} aria-hidden="true" /></button>}
        <button type="button" className="fd-secondary" onClick={onWordbook}><BookOpen size={16} aria-hidden="true" />単語帳で見直す</button>
        <button type="button" className="fd-secondary" onClick={() => setPhase({ kind: 'pick' })}>範囲を選び直す</button>
      </div>
      {score === phase.items.length && phase.items.every(x => known.has(x.wordId)) === false && <button type="button" className="fd-chip vq-markall" onClick={() => phase.items.forEach(x => onMark(x.wordId))}><Check size={15} aria-hidden="true" />この{phase.items.length}語を「覚えた」にする</button>}
    </section>;
  }

  // 範囲を選ぶ
  return <section className="fd-panel vq-pick" aria-label="範囲を選ぶ" data-vocab-quiz="pick">
    <div className="fd-levels" role="tablist" aria-label="レベル">{levels.map(l => {
      const n = data.words.filter(w => w.level === l).length;
      return <button key={l} type="button" role="tab" aria-selected={level === l} onClick={() => setLevel(l)}><span>{VOCAB_LEVELS[l]}</span><small>{n.toLocaleString()}語</small></button>;
    })}</div>
    <div className="vq-dir mt-segment" role="radiogroup" aria-label="問題の向き">
      {([['mix', 'まぜる'], ['e2j', '英→日'], ['j2e', '日→英']] as const).map(([v, t]) => <button key={v} type="button" role="radio" aria-checked={dir === v} onClick={() => setDir(v)}>{t}</button>)}
    </div>
    {rec.missed.length > 0 && <button type="button" className="vq-missed" onClick={() => start(0, true)} data-vocab-missed>
      <RotateCcw size={18} aria-hidden="true" /><span><strong>間違えた語から解く</strong><small>復習待ち {rec.missed.length}語</small></span><ChevronRight size={18} aria-hidden="true" />
    </button>}
    <ol className="vq-blocks" aria-label={`${VOCAB_LEVELS[level]}の範囲（${BLOCK_SIZE}語ずつ）`}>{Array.from({ length: blocks }, (_, b) => {
      const best = rec.best[blockKey(level, b)];
      const from = b * BLOCK_SIZE + 1; const words = blockWords(data.words, level, b);
      return <li key={b}><button type="button" onClick={() => start(b)} data-best={best === undefined ? undefined : best >= QUIZ_SIZE ? 'perfect' : best >= QUIZ_SIZE * .7 ? 'good' : 'try'}>
        <b>{from}〜{from + words.length - 1}</b><small>{best === undefined ? 'まだ' : `最高 ${best}/${QUIZ_SIZE}`}</small>
      </button></li>;
    })}</ol>
  </section>;
}
