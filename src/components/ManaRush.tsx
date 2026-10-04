/**
 * マナラッシュ — 60秒のひとりチャレンジ（ミニゲーム）
 *
 * ■ ルール
 *   ・制限時間60秒、ライフ3。まちがえるとライフが1減る。
 *   ・正解が続くとコンボ。5コンボ以上で「フィーバー」＝得点2倍。
 *   ・5コンボごとに +3秒（最大90秒まで）。
 *   ・時間切れかライフ0で終了。S/A/B/C のランクと自己ベストを記録。
 *
 * ■ 問題は対戦用の出題プールを使う（新しい問題データは足していない）
 *   画像・音声の無い、短い4択（または2〜3択）だけを使う。
 *   リスニングは音声が必要なので対象外。
 *
 * ■ 報酬（XP・マナコイン）は growthStore.applyRushGrowth が1回だけ書く
 *   コインは1日5回まで（XPは毎回）。オンライン対戦のレートには一切影響しない。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Flame, Heart, Play, RotateCcw, Timer, Trophy, Zap } from 'lucide-react';
import { loadPool, POOL_FORMAT_COUNTS } from '../battle/data/battlePool';
import { effectiveRule } from '../battle/data/battle';
import { BattleText } from '../battle/ui/BattleText';
import { play, primeAudio } from '../battle/ui/feedback';
import { GrowthAvatar } from '../battle/ui/GrowthParts';
import { Confetti } from '../battle/ui/GrowthFx';
import { applyRushGrowth, rushCoinPlaysLeft } from '../battle/data/growthStore';
import { levelOf, rushRankOf, RUSH_COIN_PLAYS_PER_DAY } from '../battle/core/growth';
import type { BattleQuestion } from '../battle/core/types';
import { subjectTheme } from '../data/subjectTheme';
import type { SubjectKey } from '../data/allChapters';
import { NextBadgeHint } from '../battle/ui/GrowthParts';
import { useGrowthProgress } from '../hooks/useGrowthProgress';

export const RUSH_DURATION_MS = 60_000;
export const RUSH_MAX_MS = 90_000;
export const RUSH_LIVES = 3;
export const RUSH_FEVER_COMBO = 5;
export const RUSH_TIME_BONUS_MS = 3_000;
const FEEDBACK_MS = 420;
const COUNTDOWN_SEC = 3;
/** この教科は画面では扱わない（音声が要る） */
const EXCLUDED = new Set(['english_listening']);
const LAST_SUBJECT_KEY = 'mana_rush_last_subject_v1';

/** ラッシュで出せる問題か（画像・音声なし、短い選択式） */
export function isRushQuestion(q: BattleQuestion): boolean {
  if (q.format !== 'choice4' && q.format !== 'choice') return false;
  if (q.imageUrl || q.audioUrl) return false;
  if (q.answerIndex < 0 || q.answerIndex >= q.options.length) return false;
  if ((q.prompt || '').length + (q.label || '').length > 180) return false;
  return q.options.every(o => o.length <= 40);
}

/** 1問正解したときの得点（combo は「この正解を含めた」連続数） */
export function rushPointsFor(combo: number, elapsedMs: number): { points: number; fever: boolean } {
  const speed = elapsedMs <= 2000 ? 50 : elapsedMs <= 4000 ? 25 : 0;
  const base = 100 + Math.min(10, Math.max(0, combo - 1)) * 20 + speed;
  const fever = combo >= RUSH_FEVER_COMBO;
  return { points: fever ? base * 2 : base, fever };
}

export function rushSubjects(): string[] {
  return Object.keys(POOL_FORMAT_COUNTS).filter(s => {
    if (EXCLUDED.has(s)) return false;
    const c = POOL_FORMAT_COUNTS[s];
    if (((c.choice4 || 0) + (c.choice || 0)) < 20) return false;
    try { return effectiveRule(s).enabled; } catch { return false; }
  });
}

function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  const r = new Uint32Array(a.length);
  crypto.getRandomValues(r);
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = r[i] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Phase = 'menu' | 'loading' | 'countdown' | 'play' | 'result';
type Miss = { q: BattleQuestion; chosen: number };
type Summary = {
  score: number; correct: number; answered: number; maxCombo: number; reason: 'time' | 'lives';
  reward: { xp: number; coins: number } | null; newBest: boolean; newSubjectBest: boolean;
  levelBefore: number; levelAfter: number; saveFailed: boolean;
};

export function ManaRush({ onBack, defaultSubject }: { onBack: () => void; defaultSubject?: string }) {
  const { progress } = useGrowthProgress();
  const subjects = useMemo(() => rushSubjects(), []);
  const [subject, setSubject] = useState<string>(() => {
    const saved = (() => { try { return localStorage.getItem(LAST_SUBJECT_KEY); } catch { return null; } })();
    return [saved, defaultSubject].find((s): s is string => !!s && subjects.includes(s)) || subjects[0] || 'chemistry_basic';
  });
  const [phase, setPhase] = useState<Phase>('menu');
  const [error, setError] = useState('');
  const [count, setCount] = useState(COUNTDOWN_SEC);
  const [queue, setQueue] = useState<BattleQuestion[]>([]);
  const [qi, setQi] = useState(0);
  const [lives, setLives] = useState(RUSH_LIVES);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [remain, setRemain] = useState(RUSH_DURATION_MS);
  const [flash, setFlash] = useState<{ choice: number; ok: boolean; points: number; bonus: boolean } | null>(null);
  const [misses, setMisses] = useState<Miss[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [coinLeft, setCoinLeft] = useState(() => rushCoinPlaysLeft());

  const deadline = useRef(0);
  const shownAt = useRef(0);
  const ended = useRef(false);
  const busy = useRef(false);
  const stats = useRef({ score: 0, correct: 0, answered: 0, maxCombo: 0 });
  const theme = subjectTheme(subject as SubjectKey);
  const question = queue.length ? queue[qi % queue.length] : undefined;
  const best = progress?.rushBestBy[subject] ?? 0;

  useEffect(() => { try { localStorage.setItem(LAST_SUBJECT_KEY, subject); } catch { /* 保存できなくても遊べる */ } }, [subject]);

  const finish = useCallback(async (reason: 'time' | 'lives') => {
    if (ended.current) return;
    ended.current = true;
    const s = stats.current;
    const levelBefore = levelOf(progress?.xp ?? 0).level;
    setPhase('result');
    const r = await applyRushGrowth({ runId: crypto.randomUUID(), subject, score: s.score, correct: s.correct, answered: s.answered, maxCombo: s.maxCombo });
    const levelAfter = r ? levelOf(r.progress.xp).level : levelBefore;
    setSummary({ ...s, reason, reward: r?.reward ?? null, newBest: !!r?.newBest && s.score > 0, newSubjectBest: !!r?.newSubjectBest && s.score > 0,
      levelBefore, levelAfter, saveFailed: !r });
    setCoinLeft(rushCoinPlaysLeft());
    play(r?.newBest && s.score > 0 ? 'levelup' : 'win');
  }, [progress?.xp, subject]);

  const start = async () => {
    primeAudio(); play('tap'); setError(''); setPhase('loading');
    try {
      const pool = (await loadPool(subject)).filter(isRushQuestion);
      if (pool.length < 5) { setError('この科目は出せる問題が足りません。別の科目を選んでください。'); setPhase('menu'); return; }
      setQueue(shuffle(pool).slice(0, 120));
      setQi(0); setLives(RUSH_LIVES); setScore(0); setCombo(0); setMaxCombo(0); setCorrect(0); setAnswered(0);
      setMisses([]); setSummary(null); setFlash(null); setRemain(RUSH_DURATION_MS);
      stats.current = { score: 0, correct: 0, answered: 0, maxCombo: 0 };
      ended.current = false; busy.current = false;
      setCount(COUNTDOWN_SEC); setPhase('countdown');
    } catch {
      setError('問題を読み込めませんでした。通信状態を確認して、もう一度お試しください。'); setPhase('menu');
    }
  };

  // 3・2・1
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (count <= 0) {
      deadline.current = Date.now() + RUSH_DURATION_MS; shownAt.current = Date.now(); setPhase('play'); return;
    }
    play('tick', false);
    const t = window.setTimeout(() => setCount(c => c - 1), 700);
    return () => window.clearTimeout(t);
  }, [phase, count]);

  // 残り時間
  useEffect(() => {
    if (phase !== 'play') return;
    const tick = window.setInterval(() => {
      const left = Math.max(0, deadline.current - Date.now());
      setRemain(left);
      if (left <= 0) void finish('time');
    }, 100);
    return () => window.clearInterval(tick);
  }, [phase, finish]);

  const answer = (choice: number) => {
    if (phase !== 'play' || !question || busy.current || ended.current) return;
    busy.current = true;
    const ok = choice === question.answerIndex;
    const s = stats.current;
    s.answered += 1;
    let points = 0; let bonus = false; let nextLives = lives;
    if (ok) {
      const nextCombo = combo + 1;
      points = rushPointsFor(nextCombo, Date.now() - shownAt.current).points;
      s.score += points; s.correct += 1; s.maxCombo = Math.max(s.maxCombo, nextCombo);
      if (nextCombo % RUSH_FEVER_COMBO === 0) {
        bonus = true;
        deadline.current = Math.min(deadline.current + RUSH_TIME_BONUS_MS, Date.now() + RUSH_MAX_MS);
      }
      setCombo(nextCombo); setMaxCombo(s.maxCombo); setCorrect(s.correct);
      play('correct');
    } else {
      nextLives = lives - 1;
      setLives(nextLives); setCombo(0);
      setMisses(m => [...m, { q: question, chosen: choice }]);
      play('wrong');
    }
    setScore(s.score); setAnswered(s.answered);
    setFlash({ choice, ok, points, bonus });
    window.setTimeout(() => {
      setFlash(null); busy.current = false;
      if (nextLives <= 0) { void finish('lives'); return; }
      setQi(i => i + 1); shownAt.current = Date.now();
    }, FEEDBACK_MS);
  };

  // キーボード（1〜4）でも答えられる
  useEffect(() => {
    if (phase !== 'play') return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && question && n <= question.options.length) answer(n - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const fever = combo >= RUSH_FEVER_COMBO;
  const timeRatio = Math.max(0, Math.min(1, remain / RUSH_DURATION_MS));

  if (phase === 'menu' || phase === 'loading') {
    return <section className="mana-rush mana-hub-main" data-mana-rush="menu">
      <button type="button" className="arena-back" onClick={onBack}><ArrowLeft size={18} />もどる</button>
      <p className="mana-eyebrow">60 SECOND CHALLENGE</p>
      <h1 className="mana-rush-title"><Zap aria-hidden="true" /> マナラッシュ</h1>
      <p className="text-sm text-slate-600">60秒で何問とける？ 正解を続けてコンボをつなごう。</p>
      <ul className="mana-rush-rules" aria-label="ルール">
        <li><Timer size={16} />制限時間60秒（5コンボごとに＋3秒）</li>
        <li><Heart size={16} />ライフ3。まちがえると1つ減る</li>
        <li><Flame size={16} />5コンボ以上でフィーバー！ 得点2倍</li>
        <li><Zap size={16} />はやく答えるほどスピードボーナス</li>
      </ul>
      <h2 className="mana-rush-subtitle">科目をえらぶ</h2>
      <div className="mana-rush-subjects" role="radiogroup" aria-label="科目">
        {subjects.map(s => {
          const t = subjectTheme(s as SubjectKey);
          const b = progress?.rushBestBy[s] ?? 0;
          return <button key={s} type="button" role="radio" aria-checked={subject === s} onClick={() => setSubject(s)}
            style={{ borderColor: subject === s ? t.accent : undefined, background: subject === s ? t.surface : undefined }}>
            <strong style={{ color: t.accent }}>{t.label}</strong><small>{b > 0 ? `ベスト ${b.toLocaleString()}` : '未ちょうせん'}</small>
          </button>;
        })}
      </div>
      <div className="mana-rush-best" aria-live="polite">
        {progress && <GrowthAvatar progress={progress} size={58} />}
        <div><span>{theme.label}の自己ベスト</span><strong>{best.toLocaleString()}<small>点</small></strong>
          <span>全体ベスト {(progress?.rushBest ?? 0).toLocaleString()}点 ／ 最高 {progress?.rushBestCombo ?? 0}コンボ</span></div>
      </div>
      <p className="mana-rush-coin">{coinLeft > 0 ? `今日のコイン報酬 あと${coinLeft}回（1日${RUSH_COIN_PLAYS_PER_DAY}回まで・XPは毎回）` : '今日のコイン報酬は終了（XPは毎回もらえます）'}</p>
      {error && <p role="alert" className="mana-rush-error">{error}</p>}
      <button type="button" className="mana-rush-start" disabled={phase === 'loading'} onClick={() => void start()} data-rush-start>
        <Play aria-hidden="true" />{phase === 'loading' ? '問題を準備中…' : 'スタート'}
      </button>
      <p className="mana-storage-info">成績と報酬はこの端末・アカウントに保存されます。オンライン対戦のレートには影響しません。</p>
    </section>;
  }

  if (phase === 'countdown') {
    return <section className="mana-rush mana-rush-countdown" data-mana-rush="countdown" aria-live="assertive">
      <p>{theme.label}</p><strong key={count}>{count > 0 ? count : 'GO!'}</strong>
    </section>;
  }

  if (phase === 'play' && question) {
    return <section className={`mana-rush mana-rush-play ${fever ? 'is-fever' : ''}`} data-mana-rush="play">
      <header className="mana-rush-hud">
        <span className="mana-rush-lives" aria-label={`ライフ ${lives}`}>{Array.from({ length: RUSH_LIVES }, (_, i) =>
          <Heart key={i} size={20} fill={i < lives ? '#E0566B' : 'none'} color={i < lives ? '#E0566B' : '#C9C3B8'} />)}</span>
        <span className="mana-rush-score" aria-label={`得点 ${score}`}>{score.toLocaleString()}<small>点</small></span>
        <span className="mana-rush-time" aria-label={`残り ${Math.ceil(remain / 1000)} 秒`}><Timer size={16} />{Math.ceil(remain / 1000)}</span>
      </header>
      <div className="mana-rush-timebar" aria-hidden="true"><i style={{ width: `${timeRatio * 100}%`, background: remain < 10_000 ? '#E0566B' : theme.accent }} /></div>
      <div className="mana-rush-combo" aria-live="polite">
        {combo >= 2 && <b key={combo}>{combo} COMBO{fever ? ' ・ FEVER ×2' : ''}</b>}
        {flash?.ok && <em key={`p${answered}`}>+{flash.points}{flash.bonus ? ' ／ +3秒' : ''}</em>}
      </div>
      <article className="mana-rush-question" style={{ borderColor: `${theme.accent}55`, background: theme.surface }}>
        {question.prompt && <p className="mana-rush-prompt"><BattleText text={question.prompt} subject={question.subject} /></p>}
        <p className="mana-rush-label"><BattleText text={question.label} subject={question.subject} /></p>
      </article>
      <div className="mana-rush-options" role="group" aria-label="選択肢">
        {question.options.map((o, i) => {
          const state = flash ? (i === question.answerIndex ? 'correct' : i === flash.choice ? 'wrong' : 'idle') : 'idle';
          return <button key={`${question.id}:${i}`} type="button" data-state={state} disabled={!!flash} onClick={() => answer(i)}>
            <span aria-hidden="true">{i + 1}</span><BattleText text={o} subject={question.subject} />
          </button>;
        })}
      </div>
      <p className="mana-rush-foot">{correct}問正解 ／ {answered}問回答</p>
    </section>;
  }

  // result
  const rank = rushRankOf(summary?.score ?? stats.current.score);
  return <section className="mana-rush mana-hub-main mana-rush-result" data-mana-rush="result">
    {summary?.newBest && <Confetti count={24} />}
    <p className="mana-eyebrow">{summary?.reason === 'lives' ? 'LIFE OUT' : 'TIME UP'}</p>
    <h1 className="mana-rush-title">結果発表</h1>
    <div className="mana-rush-rank" data-rank={rank}><span>RANK</span><strong>{rank}</strong></div>
    <p className="mana-rush-final">{(summary?.score ?? stats.current.score).toLocaleString()}<small>点</small></p>
    {summary?.newBest ? <p className="mana-rush-newbest"><Trophy size={18} />自己ベスト更新！</p>
      : summary?.newSubjectBest ? <p className="mana-rush-newbest"><Trophy size={18} />{theme.label}のベスト更新！</p> : null}
    <dl className="mana-rush-stats">
      <div><dt>正解</dt><dd>{summary?.correct ?? 0}<small>/{summary?.answered ?? 0}</small></dd></div>
      <div><dt>最高コンボ</dt><dd>{summary?.maxCombo ?? 0}</dd></div>
      <div><dt>正答率</dt><dd>{summary && summary.answered > 0 ? Math.round(summary.correct / summary.answered * 100) : 0}<small>%</small></dd></div>
    </dl>
    {summary ? summary.saveFailed ? <p role="alert" className="mana-rush-error">端末に保存できませんでした。ブラウザの保存設定・空き容量を確認してください。</p>
      : <p className="mana-rush-reward" data-rush-reward>+{summary.reward?.xp ?? 0} XP{summary.reward && summary.reward.coins > 0 ? ` ／ +${summary.reward.coins} マナコイン` : '（今日のコイン報酬は終了）'}
        {summary.levelAfter > summary.levelBefore && <b> ・ レベルアップ！ Lv.{summary.levelAfter}</b>}</p>
      : <p role="status">記録を保存しています…</p>}
    {summary && !summary.saveFailed && <NextBadgeHint progress={progress} prefer="b_rush" className="mt-1" />}
    {misses.length > 0 && <details className="mana-rush-misses"><summary>まちがえた問題を見る（{misses.length}問）</summary>
      <ul>{misses.map((m, i) => <li key={`${m.q.id}:${i}`}>
        <p><BattleText text={m.q.label} subject={m.q.subject} /></p>
        <p className="is-wrong">あなた：<BattleText text={m.q.options[m.chosen] || ''} subject={m.q.subject} /></p>
        <p className="is-right">正解：<BattleText text={m.q.options[m.q.answerIndex] || ''} subject={m.q.subject} /></p>
      </li>)}</ul></details>}
    <div className="mana-rush-actions">
      <button type="button" className="mana-rush-start" onClick={() => void start()}><RotateCcw aria-hidden="true" />もう一回</button>
      <button type="button" className="mana-text-action" onClick={() => { setPhase('menu'); setSummary(null); }}>科目をかえる</button>
      <button type="button" className="mana-text-action" onClick={onBack}>もどる</button>
    </div>
  </section>;
}
