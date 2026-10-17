import { useEffect, useMemo, useState } from 'react';
import { CorrectBurst } from './fx/CorrectBurst';
import { BookOpen, Check, ChevronLeft, ChevronRight, Play, RotateCcw, Shuffle, Volume2, X } from 'lucide-react';
import { VOCAB_LEVELS, type VocabularyData } from '../data/listeningSupport';
import { applyQuizResult, blockCount, blockKey, blockStages, blockWords, buildQuiz, buildStageQuiz, nextStage, BLOCK_SIZE, QUIZ_SIZE, quizComment, readQuizRecord, stageKey, STAGE_SIZE, wordNumbers, writeQuizRecord, type QuizDirection, type QuizItem } from '../data/vocabQuiz';
import { play, primeAudio } from '../battle/ui/feedback';
import { recordVocabActivity } from '../battle/data/growthStore';
import { isSpeechSupported, stopSpeech } from '../utils/listeningSpeech';
import { say } from './foundationShared';
import { TobiraBuddy } from './TobiraBuddy';

/**
 * 英単語の4択（2026-10-01 D／2026-10-17 番号順のステージ制）
 *   ［範囲］レベル → 100語のまとまり ─► ［ステージ］No.1〜10, 11〜20 … ─► ［10問］その10語を全部 ─► ［結果］
 *   - 語にはレベルごとの番号（No.）。ステージは番号順に10語ずつで、10語を必ず全部出す（＝抜けが出ない）
 *   - 正解した語に ✓。10語とも ✓ でステージクリア、100語とも ✓ でまとまりクリア
 *   - 仕上げの「100語からランダム10問」は ✓ がまだの語を優先する
 * 単語帳とは別の画面。1画面に収め、スクロールは一覧の中だけ。
 */
/** 何を解いているか：ステージ（10語）／100語からランダム／間違えた語 */
type Scope = { kind: 'stage'; level: string; block: number; stage: number } | { kind: 'block'; level: string; block: number } | { kind: 'missed' };
const scopeKey = (sc: Scope) => sc.kind === 'stage' ? stageKey(sc.level, sc.block, sc.stage) : sc.kind === 'block' ? blockKey(sc.level, sc.block) : 'missed';
type Phase = { kind: 'pick' } | { kind: 'play'; items: QuizItem[]; i: number; picks: (number | null)[]; scope: Scope } | { kind: 'done'; items: QuizItem[]; picks: number[]; scope: Scope };

let cache: VocabularyData | null = null;

export function VocabQuiz({ uid, known, onMark, onWordbook }: { uid: string; known: ReadonlySet<string>; onMark: (id: string) => void; onWordbook: () => void }) {
  const [data, setData] = useState<VocabularyData | null>(cache);
  const [err, setErr] = useState('');
  const [level, setLevel] = useState('lv1');
  const [dir, setDir] = useState<QuizDirection>('mix');
  const [rec, setRec] = useState(() => readQuizRecord(uid));
  const [phase, setPhase] = useState<Phase>({ kind: 'pick' });
  /** 範囲の画面で開いている100語のまとまり（null＝まとまりの一覧） */
  const [openBlock, setOpenBlock] = useState<number | null>(null);

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
  const mastered = useMemo(() => new Set(rec.mastered ?? []), [rec.mastered]);
  const numbers = useMemo(() => wordNumbers(data?.words ?? []), [data]);

  if (!data) return <section className="fd-panel fd-loading" role="status">{err || '単語を読み込んでいます…'}</section>;

  const begin = (items: QuizItem[], scope: Scope) => {
    if (!items.length) return;
    setPhase({ kind: 'play', items: items.map(x => ({ ...x, no: x.no ?? numbers.get(x.wordId) })), i: 0, picks: items.map(() => null), scope });
  };
  /** ステージ（その10語を全部・順番だけ入れ替え） */
  const startStage = (lv: string, block: number, stage: number) => {
    primeAudio();
    const list = blockWords(data.words, lv, block).slice(stage * STAGE_SIZE, stage * STAGE_SIZE + STAGE_SIZE);
    begin(buildStageQuiz(list, { dir, seed: Date.now(), numbers }), { kind: 'stage', level: lv, block, stage });
  };
  /** 仕上げ：100語からランダム10問（復習待ち → ✓ がまだの語 → 残り の順に優先） */
  const startBlock = (lv: string, block: number) => {
    primeAudio();
    const list = blockWords(data.words, lv, block);
    begin(buildQuiz(list, { missed: rec.missed, prefer: list.filter(w => !mastered.has(w.id)).map(w => w.id), dir, seed: Date.now() }), { kind: 'block', level: lv, block });
  };
  const startMissed = () => {
    primeAudio();
    begin(buildQuiz(data.words.filter(w => missedSet.has(w.id)), { missed: rec.missed, dir, seed: Date.now() }), { kind: 'missed' });
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
      const nextRec = applyQuizResult(rec, results, scopeKey(phase.scope));
      writeQuizRecord(uid, nextRec); setRec(nextRec);
      const score = results.filter(r => r.correct).length;
      void recordVocabActivity('vocab_quiz');
      if (score === phase.items.length && phase.items.length >= QUIZ_SIZE) void recordVocabActivity('vocab_perfect');
      play(score === phase.items.length ? 'win' : score >= phase.items.length / 2 ? 'levelup' : 'tap', false);
      setPhase({ kind: 'done', items: phase.items, picks, scope: phase.scope });
    };
    return <section className="fd-panel vq-play" aria-label="英単語の4択" data-vocab-quiz="play">
      <div className="vq-top">
        <button type="button" className="fd-chip" onClick={() => { stopSpeech(); setPhase({ kind: 'pick' }); }} aria-label="やめてステージ選びにもどる"><X size={16} aria-hidden="true" />やめる</button>
        <ol className="vq-dots" aria-label={`${phase.i + 1}問目 / 全${phase.items.length}問`}>{phase.items.map((x, j) => {
          const p = phase.picks[j];
          return <li key={j} data-now={j === phase.i || undefined} data-state={p === null ? undefined : p === x.q.answerIndex ? 'ok' : 'ng'} />;
        })}</ol>
        <b className="vq-count">{phase.i + 1}<small>/{phase.items.length}</small></b>
      </div>
      <article className="vq-card" key={it.q.id}>
        <p className="vq-prompt">{it.no !== undefined && <span className="vq-no" data-vocab-no={it.no}>No.{it.no}</span>}{it.q.prompt}</p>
        <p className="vq-label" lang={it.dir === 'e2j' ? 'en' : 'ja'}>{it.q.label}
          {it.dir === 'e2j' && <button type="button" className="fd-icon" aria-label={`${it.word} を読み上げる`} disabled={!isSpeechSupported()} onClick={() => say(it.word)}><Volume2 size={18} aria-hidden="true" /></button>}
        </p>
      </article>
      <div className="vq-options" role="group" aria-label="選択肢">{it.q.options.map((o, k) => <button key={k} type="button" disabled={answered} onClick={() => choose(k)}
        lang={it.dir === 'j2e' ? 'en' : 'ja'}
        data-correct={answered && k === it.q.answerIndex ? true : undefined} data-wrong={answered && pick === k && k !== it.q.answerIndex ? true : undefined}>
        <i aria-hidden="true">{'①②③④'[k]}</i><span>{o}</span>{answered && k === it.q.answerIndex && <Check size={18} aria-hidden="true" />}
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
    const stageList = sc.kind === 'stage' ? blockStages(blockWords(data.words, sc.level, sc.block), sc.block, mastered) : [];
    const thisStage = sc.kind === 'stage' ? stageList[sc.stage] : undefined;
    const nextIdx = sc.kind === 'stage' ? sc.stage + 1 : -1;
    const hasNextStage = sc.kind === 'stage' && nextIdx < stageList.length;
    const hasNextBlock = sc.kind !== 'missed' && sc.block + 1 < blockCount(data.words, sc.level);
    const title = sc.kind === 'stage' && thisStage ? `No.${thisStage.from}〜${thisStage.to}` : sc.kind === 'block' ? `${sc.block * BLOCK_SIZE + 1}〜${sc.block * BLOCK_SIZE + BLOCK_SIZE}語からランダム` : '間違えた語';
    const line = sc.kind === 'stage'
      ? (thisStage?.cleared ? (hasNextStage ? `ステージクリア！ 次は No.${stageList[nextIdx]!.from}〜` : '100語ぜんぶクリア！ 仕上げのランダムへ') : `あと${(thisStage?.ids.length ?? 0) - (thisStage?.learned ?? 0)}語で、このステージはクリア`)
      : quizComment(score, phase.items.length);
    // 結果の並びは番号順（どの番号を落としたかが一目で分かる）
    const order = phase.items.map((x, j) => ({ x, j })).sort((p, q) => (p.x.no ?? 0) - (q.x.no ?? 0));
    return <section className="fd-panel vq-done" aria-label="結果" data-vocab-quiz="done" data-stage-cleared={thisStage?.cleared || undefined}>
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
        {sc.kind === 'stage' && hasNextStage && <button type="button" className={wrong.length ? 'fd-secondary' : 'vq-next'} onClick={() => startStage(sc.level, sc.block, nextIdx)} data-vocab-next-stage>
          次のステージ（No.{stageList[nextIdx]!.from}〜{stageList[nextIdx]!.to}）<ChevronRight size={16} aria-hidden="true" /></button>}
        {sc.kind === 'stage' && !hasNextStage && <button type="button" className={wrong.length ? 'fd-secondary' : 'vq-next'} onClick={() => startBlock(sc.level, sc.block)}><Shuffle size={16} aria-hidden="true" />仕上げ：100語からランダム{QUIZ_SIZE}問</button>}
        {sc.kind === 'stage' && <button type="button" className="fd-secondary" onClick={() => startStage(sc.level, sc.block, sc.stage)}>このステージをもう一度</button>}
        {sc.kind === 'block' && <button type="button" className="fd-secondary" onClick={() => startBlock(sc.level, sc.block)}>同じ100語で次の{QUIZ_SIZE}問</button>}
        {sc.kind === 'block' && hasNextBlock && <button type="button" className="fd-secondary" onClick={() => { setLevel(sc.level); setOpenBlock(sc.block + 1); startStage(sc.level, sc.block + 1, 0); }}>次の100語へ（No.{(sc.block + 1) * BLOCK_SIZE + 1}〜）<ChevronRight size={16} aria-hidden="true" /></button>}
        <button type="button" className="fd-secondary" onClick={onWordbook}><BookOpen size={16} aria-hidden="true" />単語帳で見直す</button>
        <button type="button" className="fd-secondary" onClick={() => { if (sc.kind !== 'missed') { setLevel(sc.level); setOpenBlock(sc.block); } setPhase({ kind: 'pick' }); }}>ステージの一覧へ</button>
      </div>
      {score === phase.items.length && phase.items.every(x => known.has(x.wordId)) === false && <button type="button" className="fd-chip vq-markall" onClick={() => phase.items.forEach(x => onMark(x.wordId))}><Check size={15} aria-hidden="true" />この{phase.items.length}語を単語帳でも「覚えた」にする</button>}
    </section>;
  }

  // 範囲を選ぶ：① 100語のまとまり一覧 → ② そのまとまりの10ステージ
  const lvTotal = data.words.filter(w => w.level === level).length;
  const lvLearned = data.words.reduce((n, w) => n + (w.level === level && mastered.has(w.id) ? 1 : 0), 0);
  const head = <>
    <div className="fd-levels" role="tablist" aria-label="レベル">{levels.map(l => {
      const n = data.words.filter(w => w.level === l).length;
      return <button key={l} type="button" role="tab" aria-selected={level === l} onClick={() => { setLevel(l); setOpenBlock(null); }}><span>{VOCAB_LEVELS[l]}</span><small>{n.toLocaleString()}語</small></button>;
    })}</div>
    <div className="vq-dir mt-segment" role="radiogroup" aria-label="問題の向き">
      {([['mix', 'まぜる'], ['e2j', '英→日'], ['j2e', '日→英']] as const).map(([v, t]) => <button key={v} type="button" role="radio" aria-checked={dir === v} onClick={() => setDir(v)}>{t}</button>)}
    </div>
  </>;

  if (openBlock !== null && openBlock < blocks) {
    const list = blockWords(data.words, level, openBlock);
    const stages = blockStages(list, openBlock, mastered);
    const resume = nextStage(stages);
    const learned = stages.reduce((n, st) => n + st.learned, 0);
    const from = openBlock * BLOCK_SIZE + 1;
    return <section className="fd-panel vq-pick" aria-label="ステージを選ぶ" data-vocab-quiz="stages">
      {head}
      <div className="vq-block-head">
        <button type="button" className="fd-range-back" onClick={() => setOpenBlock(null)} data-vocab-blocks-back><ChevronLeft size={15} aria-hidden="true" />100語の一覧</button>
        <strong>No.{from}〜{from + list.length - 1}</strong>
        <small>✓ {learned}/{list.length}語</small>
      </div>
      {resume >= 0
        ? <button type="button" className="vq-missed vq-resume" onClick={() => startStage(level, openBlock, resume)} data-vocab-resume>
            <Play size={18} aria-hidden="true" /><span><strong>続きから：No.{stages[resume]!.from}〜{stages[resume]!.to}</strong><small>10語を全部出題・✓ {stages[resume]!.learned}/{stages[resume]!.ids.length}</small></span><ChevronRight size={18} aria-hidden="true" />
          </button>
        : <button type="button" className="vq-missed vq-resume" data-done onClick={() => startBlock(level, openBlock)} data-vocab-final>
            <Shuffle size={18} aria-hidden="true" /><span><strong>100語クリア！ 仕上げのランダム{QUIZ_SIZE}問</strong><small>最高 {rec.best[blockKey(level, openBlock)] ?? 0}/{QUIZ_SIZE}</small></span><ChevronRight size={18} aria-hidden="true" />
          </button>}
      <ol className="vq-stages" aria-label={`No.${from}〜の10語ずつのステージ`}>{stages.map(st => <li key={st.index}>
        <button type="button" onClick={() => startStage(level, openBlock, st.index)} data-vocab-stage={st.index}
          data-state={st.cleared ? 'clear' : st.learned > 0 ? 'part' : undefined} aria-current={st.index === resume ? 'step' : undefined}
          aria-label={`No.${st.from}〜${st.to} ✓${st.learned}/${st.ids.length}${st.cleared ? ' クリア' : ''}`}>
          <b>No.{st.from}〜{st.to}</b>
          <i aria-hidden="true">{st.ids.map(id => <u key={id} data-on={mastered.has(id) || undefined} />)}</i>
          <small>{st.cleared ? 'クリア' : `✓ ${st.learned}/${st.ids.length}`}</small>
        </button>
      </li>)}</ol>
      {resume >= 0 && <button type="button" className="fd-secondary vq-random" onClick={() => startBlock(level, openBlock)}><Shuffle size={16} aria-hidden="true" />100語からランダム{QUIZ_SIZE}問<small>（✓ がまだの語から）</small></button>}
    </section>;
  }

  return <section className="fd-panel vq-pick" aria-label="範囲を選ぶ" data-vocab-quiz="pick">
    {head}
    <p className="vq-lv-sum">番号順に10語ずつ、全部の語を出題します。<b>✓ {lvLearned.toLocaleString()}/{lvTotal.toLocaleString()}語</b></p>
    {rec.missed.length > 0 && <button type="button" className="vq-missed" onClick={startMissed} data-vocab-missed>
      <RotateCcw size={18} aria-hidden="true" /><span><strong>間違えた語から解く</strong><small>復習待ち {rec.missed.length}語</small></span><ChevronRight size={18} aria-hidden="true" />
    </button>}
    <ol className="vq-blocks" aria-label={`${VOCAB_LEVELS[level]}の範囲（${BLOCK_SIZE}語ずつ）`}>{Array.from({ length: blocks }, (_, b) => {
      const words = blockWords(data.words, level, b);
      const learned = words.reduce((n, w) => n + (mastered.has(w.id) ? 1 : 0), 0);
      const from = b * BLOCK_SIZE + 1;
      const pct = Math.round(learned / words.length * 100);
      return <li key={b}><button type="button" onClick={() => setOpenBlock(b)} data-vocab-block={b}
        data-best={learned === words.length ? 'perfect' : learned >= words.length * .7 ? 'good' : learned > 0 ? 'try' : undefined}>
        <b>{from}〜{from + words.length - 1}</b><small>{learned === 0 ? 'まだ' : learned === words.length ? 'クリア' : `✓ ${learned}`}</small>
        <i aria-hidden="true"><em style={{ width: `${pct}%` }} /></i>
      </button></li>;
    })}</ol>
  </section>;
}

/** i問目までの連続正解数（2問以上でCOMBO表示） */
function streakAt(items: readonly { q: { answerIndex: number } }[], picks: readonly (number | null)[], i: number): number {
  let n = 0;
  for (let j = i; j >= 0; j--) { if (picks[j] === items[j]!.q.answerIndex) n++; else break; }
  return n;
}
