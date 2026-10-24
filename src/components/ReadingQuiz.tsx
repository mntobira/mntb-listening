import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronRight, GraduationCap, ListChecks, Play, RotateCcw, X } from 'lucide-react';
import { CorrectBurst } from './fx/CorrectBurst';
import { TobiraBuddy } from './TobiraBuddy';
import { play, primeAudio } from '../battle/ui/feedback';
import { recordVocabActivity } from '../battle/data/growthStore';
import { trackEvent } from '../utils/analytics';
import { safeGetItem } from '../utils/safeLocalStorage';
import { safeSetItem } from '../utils/storageGuard';
import {
  applyReadingResult, evidencePara, examNote, isCleared, passagesOf, phrasesIn, READING_LEVELS, readReadingRecord, shuffledOptions, splitEvidence, stepsOf, TYPE_LABEL, writeReadingRecord,
  type ReadingLevel, type ReadingPassage, type ReadingQuestion, type ReadingRecord, type ReadingStep,
} from '../data/reading';
import { paragraphJa } from '../data/reading/ja';

/**
 * 英文解釈（段落ごとに読む・内容一致の4択）2026-10-21
 *   ［一覧］レベル（Lv1〜5）→ 文章を選ぶ（または「次の文章」）
 *   ［出題］スマホは1画面に1つ：第N段落を読む → 問Nに答える → 解説（根拠の英文＋和訳・構文・出題傾向・重要表現）
 *          → 第N+1段落へ …。長文をスクロールさせない。前の段落は ①②③ でいつでも見返せる
 *          PC（幅900px以上）は本文と問い・解説を左右に並べる
 *   ［結果］設問ごとの○×・解説・出題傾向 → 間違えた問題だけもう一度／次の文章へ
 * UI は英単語の4択（VocabQuiz）と同じ部品（vq-* / fd-*）。
 */
type Phase =
  | { kind: 'pick' }
  | { kind: 'play'; passage: ReadingPassage; steps: ReadingStep[]; i: number; picks: (number | null)[] }
  | { kind: 'done'; passage: ReadingPassage; steps: ReadingStep[]; picks: number[] };
/** スマホの表示（1画面に1つ）：段落を読む → 問いに答える → 解説。PC（幅900px以上）は本文と問い・解説を左右に並べる */
type Pane = 'text' | 'q' | 'ex';

const LEVEL_KEY = 'reading_quiz_level_v1';
const readLevel = (): ReadingLevel => { const n = Number(safeGetItem(LEVEL_KEY)); return (n >= 1 && n <= 5 ? n : 1) as ReadingLevel; };
const hasJa = (t: string) => /[ぁ-んァ-ン一-龥]/.test(t);
const answerOf = (st: ReadingStep) => shuffledOptions(st.question).answerIndex;

export function ReadingQuiz({ uid }: { uid: string }) {
  const [level, setLevel] = useState<ReadingLevel>(readLevel);
  const [rec, setRec] = useState<ReadingRecord>(() => readReadingRecord(uid));
  const [phase, setPhase] = useState<Phase>({ kind: 'pick' });
  const [pane, setPane] = useState<Pane>('text');
  /** 前の段落を見返しているとき、その段落番号 */
  const [viewPara, setViewPara] = useState<number | null>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const sideRef = useRef<HTMLDivElement>(null);

  useEffect(() => { safeSetItem(LEVEL_KEY, String(level)); }, [level]);
  useEffect(() => { setRec(readReadingRecord(uid)); }, [uid]);

  const list = useMemo(() => passagesOf(level), [level]);
  const missed = useMemo(() => new Set(rec.missed), [rec.missed]);
  const nextOf = (lv: ReadingLevel, after?: string) => {
    const ps = passagesOf(lv);
    const start = after ? ps.findIndex(x => x.id === after) + 1 : 0;
    const rest = [...ps.slice(start), ...ps.slice(0, start)];
    return rest.find(x => !isCleared(rec, x) && x.id !== after) ?? (after ? ps[start % ps.length] : ps[0]);
  };

  const begin = (passage: ReadingPassage, qs: readonly ReadingQuestion[] = passage.questions) => {
    if (!qs.length) return;
    primeAudio();
    trackEvent('reading_start', { lv: passage.level });
    setLevel(passage.level);
    const steps = stepsOf(passage, qs);
    setPhase({ kind: 'play', passage, steps, i: 0, picks: steps.map(() => null) });
    setViewPara(null);
    // はじめて読む文章は段落から。間違えた問題の解き直しは問いから（本文はいつでも見返せる）
    setPane(qs.length === passage.questions.length ? 'text' : 'q');
  };

  const playKey = phase.kind === 'play' ? `${phase.passage.id}:${phase.i}:${phase.picks[phase.i] ?? ''}:${pane}:${viewPara ?? ''}` : '';
  // 段落がスクロールなしで収まるよう、はみ出すときだけ文字を少しずつ小さくする（最小 14px・320×568 など小さい画面は 13px）
  useLayoutEffect(() => {
    const box = textRef.current; if (!box) return;
    const fit = () => {
      box.style.fontSize = '';
      let size = parseFloat(getComputedStyle(box).fontSize) || 17;
      const min = window.innerHeight < 620 || window.innerWidth < 360 ? 13 : 14;
      while (box.scrollHeight > box.clientHeight + 1 && size > min) { size -= 0.5; box.style.fontSize = `${size}px`; }
    };
    fit();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => fit()) : null;
    ro?.observe(box);
    return () => ro?.disconnect();
  }, [playKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ページが変わったら先頭へ。答えたら根拠の一節が見える位置へ
  useEffect(() => {
    if (phase.kind !== 'play') return;
    sideRef.current?.scrollTo({ top: 0 });
    const box = textRef.current; if (!box) return;
    const mark = box.querySelector('mark') as HTMLElement | null;
    box.scrollTo({ top: mark ? Math.max(0, mark.offsetTop - box.offsetTop - 16) : 0, behavior: mark ? 'smooth' : 'auto' });
  }, [playKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (phase.kind === 'play') {
    const { passage, steps, i, picks } = phase;
    const st = steps[i]!;
    const q = st.question;
    const view = shuffledOptions(q);
    const pick = picks[i];
    const answered = pick !== null;
    const ok = pick === view.answerIndex;
    const qNo = passage.questions.indexOf(q) + 1;
    const nParas = passage.paragraphs.length;
    const shownPara = viewPara ?? st.para;
    const evPara = evidencePara(passage, q);
    const paraText = passage.paragraphs[shownPara - 1]!;
    const ev = splitEvidence(paraText, answered && evPara === shownPara ? q.evidence : null);
    const note = examNote(passage.level, q.type);
    const phrases = phrasesIn(passage, evPara);
    // 根拠の段落の全訳（2026-10-24）。根拠の一節の訳は太字で示す
    const evJa = paragraphJa(passage.id, evPara);
    const next = steps[i + 1];

    const quit = () => {
      // 途中でやめたときは「間違えた設問」だけ記録し、最高点は変えない
      const results = steps.flatMap((x, j) => picks[j] === null ? [] : [{ questionId: x.question.id, correct: picks[j] === answerOf(x) }]);
      if (results.length) { const r = { ...applyReadingResult(rec, passage.id, results), best: rec.best }; writeReadingRecord(uid, r); setRec(r); }
      setPhase({ kind: 'pick' });
    };
    const choose = (k: number) => {
      if (answered) return;
      const good = k === view.answerIndex;
      play(good ? 'correct' : 'wrong', !good);
      const nextPicks = picks.slice(); nextPicks[i] = k;
      setPhase({ ...phase, picks: nextPicks });
      setViewPara(null);
      setPane('ex');
    };
    const goNext = () => {
      if (next) {
        setPhase({ ...phase, i: i + 1 });
        setViewPara(null);
        setPane(next.para !== st.para ? 'text' : 'q');
        return;
      }
      const all = picks as number[];
      const results = steps.map((x, j) => ({ questionId: x.question.id, correct: all[j] === answerOf(x) }));
      const full = steps.length === passage.questions.length;
      // 一部の設問だけ解き直したときは、最高点は更新せず「間違えた設問」だけ直す
      const r0 = applyReadingResult(rec, passage.id, results);
      const r = full ? r0 : { ...r0, best: rec.best };
      writeReadingRecord(uid, r); setRec(r);
      const score = results.filter(x => x.correct).length;
      void recordVocabActivity('vocab_quiz');
      trackEvent('reading_done', { lv: passage.level, ok: score });
      play(score === steps.length ? 'win' : score >= steps.length / 2 ? 'levelup' : 'tap', false);
      setPhase({ kind: 'done', passage, steps, picks: all });
    };
    const nextLabel = !next ? '結果を見る' : next.para !== st.para ? `第${next.para}段落へ` : '次の問題';
    const paneBtn = (p: Pane, label: string, disabled = false) =>
      <button type="button" role="tab" aria-selected={pane === p} disabled={disabled} onClick={() => { setPane(p); if (p !== 'text') setViewPara(null); }} data-reading-pane={p}>{label}</button>;

    return <section className="fd-panel vq-play rq-play" aria-label="英文解釈" data-reading="play">
      <div className="vq-top rq-top">
        <button type="button" className="fd-chip rq-quit" onClick={quit} aria-label="やめて文章の一覧にもどる（答えた分は記録する）"><X size={16} aria-hidden="true" /><span>やめる</span></button>
        <div className="rq-panes" role="tablist" aria-label="表示">
          {paneBtn('text', `第${st.para}段落`)}
          {paneBtn('q', `問${qNo}`)}
          {paneBtn('ex', '解説', !answered)}
        </div>
        <b className="vq-count" aria-label={`${i + 1}問目 / 全${steps.length}問`}>{i + 1}<small>/{steps.length}</small></b>
      </div>

      <div className="rq-body" data-pane={pane}>
        <article className="rq-passage" aria-label="本文">
          <header className="rq-passage-head">
            <b lang="en">{passage.title}</b>
            <span className="rq-paras" role="group" aria-label="段落を見返す">{passage.paragraphs.map((_, k) => {
              const n = k + 1; const can = n <= st.para || q.para === 0;
              return <button key={n} type="button" disabled={!can} aria-pressed={shownPara === n} aria-label={`第${n}段落`}
                onClick={() => setViewPara(n === st.para ? null : n)} data-reading-para={n}>{'①②③④⑤'[k]}</button>;
            })}</span>
          </header>
          <div className="rq-text" ref={textRef} lang="en" tabIndex={0} aria-label={`第${shownPara}段落（全${nParas}段落）`} data-reading-text>
            {ev.before}{ev.mark && <mark data-reading-evidence>{ev.mark}</mark>}{ev.after}
          </div>
          {viewPara !== null && <p className="rq-viewing">第{viewPara}段落を見返しています（答える段落は第{st.para}段落）</p>}
        </article>

        <div className="rq-side" ref={sideRef}>
          <div className="rq-q">
            <p className="rq-prompt" key={q.id} lang={hasJa(q.prompt) ? 'ja' : 'en'}><span className="rq-qno">問{qNo}</span>{q.prompt}</p>
            <div className="vq-options rq-options" role="group" aria-label="選択肢">{view.options.map((o, k) => <button key={k} type="button" disabled={answered} onClick={() => choose(k)}
              lang={hasJa(o) ? 'ja' : 'en'}
              data-correct={answered && k === view.answerIndex ? true : undefined} data-wrong={answered && pick === k && k !== view.answerIndex ? true : undefined}>
              <i aria-hidden="true">{'①②③④'[k]}</i><span>{o}</span>{answered && k === view.answerIndex && <Check size={18} aria-hidden="true" />}
            </button>)}</div>
          </div>
          {answered && <div className="rq-ex" data-reading-explain>
            <p className="rq-ex-judge" data-ok={ok || undefined}>{ok ? '正解！' : <>正解は {'①②③④'[view.answerIndex]}</>}<small>{TYPE_LABEL[q.type]}・第{evPara}段落</small></p>
            <div className="rq-ex-ev"><p lang="en">{q.evidence}</p><p>{q.evidenceJa}</p></div>
            {evJa && <details className="rq-ex-ja" key={`${q.id}-ja`} data-reading-translation>
              <summary>第{evPara}段落の全訳</summary>
              <p>{markJa(evJa, q.evidenceJa)}</p>
            </details>}
            <p className="rq-ex-text">{q.explanation}</p>
            {q.point && <p className="rq-ex-point"><b>構文</b>{q.point}</p>}
            <p className="rq-ex-exam" data-reading-exam><GraduationCap size={15} aria-hidden="true" /><span><b>{note.where}</b>{note.tip}</span></p>
            {phrases.length > 0 && <ul className="rq-ex-phrases" aria-label="この段落の重要表現">{phrases.map(([en, ja]) => <li key={en}><b lang="en">{en}</b>{ja}</li>)}</ul>}
          </div>}
        </div>
      </div>
      {answered && ok && <CorrectBurst burstKey={q.id} combo={streakAt(steps, picks, i)} />}

      <div className="vq-foot" aria-live="polite">
        {answered
          ? <><p className="vq-judge" data-ok={ok || undefined}>{ok ? '正解！' : '根拠を確認'}</p>
              <button type="button" className="vq-next" onClick={goNext} data-reading-next>{nextLabel}<ChevronRight size={18} aria-hidden="true" /></button></>
          : pane === 'text'
            ? <><p className="vq-hint rq-foot-hint">第{st.para}段落を読んだら</p>
                <button type="button" className="vq-next rq-to-q" onClick={() => { setPane('q'); setViewPara(null); }} data-reading-to-q>問{qNo}へ<ChevronRight size={18} aria-hidden="true" /></button></>
            : <p className="vq-hint">迷ったら「第{st.para}段落」で本文を見返せる</p>}
      </div>
    </section>;
  }

  if (phase.kind === 'done') {
    const { passage, steps, picks } = phase;
    const qs = steps.map(x => x.question);
    const ans = (j: number) => answerOf(steps[j]!);
    const good = (j: number) => picks[j] === ans(j);
    const score = qs.filter((_, j) => good(j)).length;
    const wrong = qs.filter((_, j) => !good(j));
    const nx = nextOf(passage.level, passage.id);
    const leftInLevel = passagesOf(passage.level).filter(x => !isCleared(rec, x)).length;
    const line = score === qs.length
      ? (leftInLevel === 0 ? `${READING_LEVELS[passage.level - 1]!.name} はぜんぶ満点！ 次のレベルへ` : `満点！ このレベルのまだの文章は あと${leftInLevel}題`)
      : score === 0 ? '根拠の一文を見直して、もう一度やってみよう' : 'おしい！ 間違えた問題の根拠を見直そう';
    return <section className="fd-panel vq-done rq-done" aria-label="結果" data-reading="done">
      <div className="vq-score" data-perfect={score === qs.length || undefined}>
        <strong>{score}<small>/{qs.length}</small></strong>
        <span className="vq-score-body"><b className="vq-score-title" lang="en">{passage.title}</b><TobiraBuddy size="sm" input={{ screen: 'study' }} line={line} /></span>
      </div>
      <ul className="rq-result" aria-label="設問ごとの結果">{qs.map((x, j) => {
        const v = shuffledOptions(x);
        return <li key={x.id} data-ok={good(j) || undefined}>
          <p className="rq-result-q">{good(j) ? <Check size={16} aria-label="正解" /> : <X size={16} aria-label="不正解" />}<span>問{passage.questions.indexOf(x) + 1}　{x.prompt}</span></p>
          <p className="rq-result-a">正解：{v.options[v.answerIndex]}</p>
          <p className="rq-result-e">{x.explanation}</p>
          <p className="rq-result-x">{examNote(passage.level, x.type).where}</p>
        </li>;
      })}</ul>
      <details className="rq-ja-all" data-reading-translation-all>
        <summary>本文と全訳を見る</summary>
        <ol>{passage.paragraphs.map((en, k) => <li key={k}>
          <p lang="en">{en}</p>
          {paragraphJa(passage.id, k + 1) && <p>{paragraphJa(passage.id, k + 1)}</p>}
        </li>)}</ol>
      </details>
      <div className="vq-done-actions">
        {wrong.length > 0 && <button type="button" className="vq-next" onClick={() => begin(passage, wrong)} data-reading-retry><RotateCcw size={17} aria-hidden="true" />間違えた{wrong.length}問だけもう一度</button>}
        {nx && nx.id !== passage.id && <button type="button" className={wrong.length ? 'fd-secondary' : 'vq-next'} onClick={() => begin(nx)} data-reading-continue>次の文章へ（{nx.title}）<ChevronRight size={16} aria-hidden="true" /></button>}
        {leftInLevel === 0 && passage.level < 5 && <button type="button" className="fd-secondary" onClick={() => { setLevel((passage.level + 1) as ReadingLevel); setPhase({ kind: 'pick' }); }}>次のレベル（{READING_LEVELS[passage.level]!.name}）へ<ChevronRight size={16} aria-hidden="true" /></button>}
        <button type="button" className="fd-secondary" onClick={() => setPhase({ kind: 'pick' })}><ListChecks size={16} aria-hidden="true" />文章の一覧へ</button>
      </div>
    </section>;
  }

  // ---------------- 文章の一覧 ----------------
  const meta = READING_LEVELS[level - 1]!;
  const cleared = list.filter(x => isCleared(rec, x)).length;
  const first = nextOf(level);
  return <section className="fd-panel vq-setup rq-pick" aria-label="文章を選ぶ" data-reading="pick">
    <div className="fd-levels" role="tablist" aria-label="レベル">{READING_LEVELS.map(l => {
      const ps = passagesOf(l.level); const got = ps.filter(x => isCleared(rec, x)).length;
      return <button key={l.level} type="button" role="tab" aria-selected={level === l.level} onClick={() => setLevel(l.level)} data-reading-level={l.level}>
        <span>{l.name}</span><small>{got}/{ps.length}題</small><i aria-hidden="true" style={{ ['--p' as string]: `${ps.length ? got / ps.length * 100 : 0}%` }} />
      </button>;
    })}</div>
    <p className="rq-target">目安：{meta.target}</p>
    <ul className="rq-list vq-set-scroll" aria-label={`${meta.name}の文章`}>{list.map((x, k) => {
      const b = rec.best[x.id]; const done = isCleared(rec, x);
      const miss = x.questions.filter(qq => missed.has(qq.id)).length;
      return <li key={x.id}><button type="button" onClick={() => begin(x)} data-reading-passage={x.id} data-state={done ? 'clear' : b ? 'part' : undefined}>
        <i className="rq-no" aria-hidden="true">{k + 1}</i>
        <span className="rq-item-main"><b lang="en">{x.title}</b><small>{x.topic}・{x.paragraphs.length}段落・{x.questions.length}問</small></span>
        <span className="rq-item-score">{done ? <><Check size={15} aria-hidden="true" />満点</> : b ? `${b.score}/${b.total}` : 'まだ'}{miss > 0 && <em>×{miss}</em>}</span>
      </button></li>;
    })}</ul>
    <div className="vq-start-box">
      <p className="vq-start-sum" aria-live="polite">{meta.name}：満点 <b>{cleared}</b>/{list.length}題{first && <>　・次は「{first.title}」</>}</p>
      <button type="button" className="vq-next vq-start" onClick={() => first && begin(first)} disabled={!first} data-reading-start><Play size={18} aria-hidden="true" />{cleared === list.length ? 'もう一度はじめから解く' : '次の文章を解く'}</button>
    </div>
  </section>;
}

/** 段落の全訳の中で、根拠の一節の訳（evidenceJa）に当たる部分を太字にする（鉤括弧の有無の違いは吸収） */
function markJa(full: string, part: string) {
  const key = part.replace(/^「|」$/g, '');
  const at = key ? full.indexOf(key) : -1;
  if (at < 0) return full;
  return <>{full.slice(0, at)}<b>{full.slice(at, at + key.length)}</b>{full.slice(at + key.length)}</>;
}

function streakAt(steps: readonly ReadingStep[], picks: readonly (number | null)[], i: number): number {
  let n = 0;
  for (let j = i; j >= 0; j--) { if (picks[j] !== null && picks[j] === answerOf(steps[j]!)) n++; else break; }
  return n;
}
