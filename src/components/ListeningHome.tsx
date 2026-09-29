import React, { useMemo, useState, type ComponentProps } from 'react';
import { ArrowRight, BookOpen, Check, ChevronRight, Coins, Gift, Headphones, HelpCircle, ListMusic, Pause, Play, Repeat2, Swords, Volume2, VolumeX, Waves } from 'lucide-react';
import type { Home as IntegratedHome } from './Home';
import type { GrowthProgress } from '../battle/core/growth';
import { equippedPoseSrc, levelOf } from '../battle/core/growth';
import { useGrowthProgress } from '../hooks/useGrowthProgress';
import { GrowthHomeStrip } from '../battle/ui/GrowthHomeStrip';
import { problemKey, readSolvedMap } from '../utils/progress';
import { SUBJECT_INDEX } from '../data/chapterIndex.generated';
import { getDueCount } from '../utils/reviewList';
import { VOCABULARY_COUNT } from '../data/listeningVocabularyMeta.generated';
import { FIREBASE_CONFIGURED } from '../firebase';
import './listening-home.css';

const ListeningSupport = React.lazy(() => import('./ListeningSupport').then(m => ({ default: m.ListeningSupport })));
type Props = ComponentProps<typeof IntegratedHome> & { onListeningStart?: (chapter: string, index: number) => void };
type Unit = { id: string; title: string; count: number; completed: number; description: string };

const UNIT_DESCRIPTIONS = ['短い発話を聞き取る', '音とイラストを結ぶ', '対話から場面をつかむ', '会話の要点を見つける', '情報を整理して聞く', '複数の発話を比べる', '講義の流れを追う', '会話の意図を読み取る', '議論の要点をつかむ'];

export function ListeningHome(props: Props) {
  const { uid, progress } = useGrowthProgress();
  return <ListeningHomeContent key={uid} {...props} owner={uid} growth={progress} />;
}

function ListeningHomeContent({ owner, growth, onPickSubject, onChangeSubject, onStart, onStudyMode, onNoteList, onIntro, onBattle, onGrowth, onLeaderboard, onListeningStart, isBgmEnabled, onToggleBgm }: Props & { owner: string; growth: GrowthProgress | null; key?: string }) {
  const [support, setSupport] = useState<'words' | 'grammar' | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const due = getDueCount(owner);
  // The home needs IDs and counts, not scripts, audio metadata or explanations.
  // Read the generated index and saved answers once; download question data only
  // when the learner actually opens a practice round.
  const { units, next, solved } = useMemo(() => {
    const chapters = SUBJECT_INDEX.find(subject => subject.id === 'english_listening')?.chapters || [];
    const saved = readSolvedMap(owner);
    const rounds = chapters.flatMap(chapter => (chapter.practiceIds || []).map((id, index) => ({
      chapter: chapter.id, index, label: `${chapter.abstractTitle} · 第${index + 1}回`, id,
    })));
    const units: Unit[] = chapters.map((chapter, index) => ({
      id: chapter.id, title: chapter.abstractTitle || chapter.id,
      count: chapter.practiceIds?.length || 0,
      completed: (chapter.practiceIds || []).filter(id => saved[problemKey(chapter.id, id)]).length,
      description: UNIT_DESCRIPTIONS[index] || '英語を聞いて理解する',
    }));
    return {
      units,
      next: rounds.find(round => !saved[problemKey(round.chapter, round.id)]) || rounds[0] || null,
      solved: units.reduce((sum, unit) => sum + unit.completed, 0),
    };
  }, [owner]);

  const study = () => { onPickSubject?.('english_listening'); onStudyMode ? onStudyMode('practice') : onStart(); };
  const listenAt = (chapter: string, index: number) => { onPickSubject?.('english_listening'); onListeningStart ? onListeningStart(chapter, index) : study(); };
  const grammarDrill = onPickSubject ? () => { onPickSubject('english_grammar'); onStudyMode ? onStudyMode('practice') : onStart(); } : undefined;
  const total = units.reduce((sum, unit) => sum + unit.count, 0) || 135;
  const preview = '/listening_audio/el1A_set1_q1.mp3';

  return <main className="listening-home" data-listening-home>
    <div className="lh-container">
      <header className="lh-header">
        <div className="lh-brand"><img src="/manatobi-logo.jpg" alt="マナトビ" width={1024} height={367} /><span className="lh-brand-divider" /><span className="lh-brand-name">LISTENING <small>音から、学びをひらく。</small></span></div>
        <div className="lh-header-tools">
          {onChangeSubject && <button className="lh-subject-chip" onClick={onChangeSubject} aria-label="科目をえらぶ（英文法・英単語もここから）"><BookOpen size={16} /> 科目</button>}
          {onGrowth && <button className="lh-wallet" onClick={() => onGrowth('overview')} aria-label="マナコインの使い道を開く"><Coins size={17} /> {growth ? growth.coins.toLocaleString() : '—'}</button>}
          <button className="lh-sound" aria-label={isBgmEnabled ? 'BGMをオフにする' : 'BGMをオンにする'} onClick={() => onToggleBgm?.(!isBgmEnabled)}>{isBgmEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}<span> BGM {isBgmEnabled ? 'ON' : 'OFF'}</span></button>
        </div>
      </header>

      <div className="lh-welcome"><div><p className="lh-kicker"><span className="lh-kicker-line" /> YOUR LISTENING STUDIO</p><h1>聞こえる世界を、<em>広げよう。</em></h1><p>今日も、耳から一歩ずつ。あなたのペースで始めましょう。</p>{!FIREBASE_CONFIGURED && <p className="lh-guest-note" role="status">ゲスト体験版 · 学習記録はこの端末に保存されます。ログイン・全国対戦は準備中です。</p>}</div><div className="lh-welcome-mark"><Headphones size={18} /> LISTEN · LEARN · GROW</div></div>

      <div className="lh-dashboard">
        <div className="lh-primary-column">
          <section className="lh-hero" aria-labelledby="listening-home-title">
            <div className="lh-hero-noise" aria-hidden="true" />
            <div className="lh-hero-content"><div className="lh-hero-top"><span className="lh-hero-tag"><span /> TODAY'S SESSION</span><span className="lh-hero-index">01 / 03</span></div>
              <div className="lh-hero-copy"><p className="lh-hero-overline">耳を澄ませば、わかることが増える。</p><h2 id="listening-home-title">まずは、<br /><em>ひとつ</em>聞いてみよう。</h2><p>聞く → 答える → 確かめる。<br />短い1回から、確かな力に。</p></div>
              <button className="lh-main" aria-label="おすすめのリスニングを始める" onClick={() => next ? listenAt(next.chapter, next.index) : study()}><span><Play size={17} fill="currentColor" /> 学習を再開する</span><ArrowRight size={19} /></button>
              <div className="lh-hero-bottom"><span><Waves size={15} /> NEXT UP</span><strong>{next?.label || '大問一覧から選ぶ'}</strong></div>
            </div>
            <div className="lh-hero-art" aria-hidden="true"><div className="lh-orbit lh-orbit-one" /><div className="lh-orbit lh-orbit-two" /><div className="lh-sound-rings"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div><div className="lh-hero-mascot"><img src={growth ? equippedPoseSrc(growth) : '/mascots/listening.webp'} alt="" /></div><span className="lh-float-note lh-note-one">LISTEN</span><span className="lh-float-note lh-note-two">♪</span></div>
          </section>

          <section className="lh-path" aria-labelledby="lh-path-title"><div className="lh-section-heading"><div><p className="lh-kicker">THE LEARNING PATH</p><h2 id="lh-path-title">あなたの学び方で、進もう。</h2></div><span>3つのステップ</span></div>
            <div className="lh-path-grid">
              <button className="lh-path-card lh-path-card-listen" onClick={study} aria-label="大問を選ぶ"><span className="lh-card-icon"><ListMusic size={23} /></span><span className="lh-card-number">01 / PRACTICE</span><strong>大問を選ぶ</strong><small>第1問Aから第6問Bまで。<br />好きなところから聞いてみる。</small><span className="lh-card-arrow"><ArrowRight size={18} /></span></button>
              <button className="lh-path-card lh-path-card-review" onClick={onNoteList}><span className="lh-card-icon"><Repeat2 size={23} /></span><span className="lh-card-number">02 / REVIEW</span><strong>復習ノート</strong><small>{due ? `今日の復習が ${due} 問あります。` : '間違えたところを、聞き直そう。'}<br />理解をひとつずつ深める。</small><span className="lh-card-arrow"><ArrowRight size={18} /></span></button>
              <button className="lh-path-card lh-path-card-build" onClick={() => setSupport('words')}><span className="lh-card-icon"><BookOpen size={23} /></span><span className="lh-card-number">03 / BUILD</span><strong>聞くための基礎</strong><small>単語・文法を少しずつ。<br />「わかる」を増やしていく。</small><span className="lh-card-arrow"><ArrowRight size={18} /></span></button>
            </div>
          </section>

          <section className="lh-units" aria-labelledby="lh-units-title"><div className="lh-section-heading"><div><p className="lh-kicker">EXPLORE THE LIBRARY</p><h2 id="lh-units-title">大問から探す</h2></div><button onClick={study}>すべて見る <ArrowRight size={16} /></button></div><p className="lh-units-intro">短い会話から、長い講義まで。いまの自分に合った音を選ぼう。</p>
            <div className="lh-unit-grid">{units.length ? units.map((unit, i) => <button key={unit.id} className="lh-unit" onClick={() => listenAt(unit.id, 0)}><span className="lh-unit-num">{String(i + 1).padStart(2, '0')}</span><span className="lh-unit-info"><strong>{unit.title}</strong><small>{unit.description}</small></span><span className="lh-unit-end">{unit.completed}/{unit.count} <ChevronRight size={16} /></span></button>) : <div className="lh-unit-loading" role="status">大問一覧から学習を始められます。</div>}</div>
          </section>
        </div>

        <aside className="lh-side-column" aria-label="学習サポート">
          <section className="lh-progress-card"><div className="lh-side-label"><span className="lh-status-dot" /> YOUR PROGRESS <span>今の記録</span></div><div className="lh-progress-ring" style={{ '--progress': `${Math.min(100, solved / total * 100)}%` } as React.CSSProperties}><div><strong>{solved}</strong><span> / {total} 大問</span></div></div><h2>聴いた分だけ、力になる。</h2><p>一問ずつ、自分のペースで積み重ねよう。</p><div className="lh-progress-foot"><span><Check size={15} /> 演習の積み重ね</span><strong>{Math.round(solved / total * 100)}%</strong></div></section>
          <section className="lh-preview-card"><div className="lh-side-label">A LITTLE PREVIEW <Headphones size={17} /></div><h2>耳を、英語に慣らそう。</h2><p>まずは短い音声をひとつ。<br />聞こえ方を試してみてください。</p><div className="lh-preview-player"><button aria-label={previewPlaying ? '試聴を停止する' : '音声を試聴する'} onClick={e => { const audio = e.currentTarget.parentElement?.querySelector('audio'); if (!audio) return; if (audio.paused) { document.querySelectorAll('audio').forEach(a => { if (a !== audio) a.pause(); }); void audio.play().catch(() => setPreviewPlaying(false)); } else audio.pause(); }}><span>{previewPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</span></button><div className="lh-preview-bars" aria-hidden="true">{Array.from({ length: 22 }, (_, i) => <i key={i} style={{ height: `${12 + ((i * 17 + 7) % 27)}px` }} />)}</div><span className="lh-preview-time">PREVIEW</span><audio src={preview} preload="none" onPlay={() => setPreviewPlaying(true)} onPause={() => setPreviewPlaying(false)} onEnded={() => setPreviewPlaying(false)} /></div><small>第1問 A · サンプル音声</small></section>
          <section className="lh-foundation-card"><div className="lh-side-label">LISTENING ESSENTIALS</div><h2>聞くための基礎</h2><p>分からない言葉や文法は、ここから。</p><button onClick={() => setSupport('words')}><span className="lh-letter">Aa</span><span><strong>単語・熟語</strong><small>{VOCABULARY_COUNT.toLocaleString()}語を少しずつ</small></span><ArrowRight size={17} /></button><button onClick={() => setSupport('grammar')}><BookOpen size={21} /><span><strong>英文法のポイント</strong><small>聞き取りに役立つ8つのコツ</small></span><ArrowRight size={17} /></button>{grammarDrill && <button className="lh-grammar-link" onClick={grammarDrill}>英文法の問題演習へ <ArrowRight size={15} /></button>}</section>
          {onBattle && <button className="lh-battle-card" onClick={onBattle}><span><Swords size={21} /> CHALLENGE</span><strong>聞く力を、試そう。</strong><small>{FIREBASE_CONFIGURED ? <>友だちと、全国と、AIと。<br />身につけた力を対戦で。</> : <>ゲストでも遊べるAI対戦。<br />聞く力を、腕だめし。</>}</small><span className="lh-battle-arrow">対戦に進む <ArrowRight size={16} /></span></button>}
          <details className="lh-growth"><summary><Gift size={18} /> 学びのごほうび <ChevronRight size={17} /></summary>{onGrowth && <GrowthHomeStrip homeLayout onProfile={() => onGrowth('outfit')} onMissions={() => onGrowth('missions')} onWallet={() => onGrowth('overview')} onGacha={() => onGrowth('gacha')} />}<div className="lh-growth-links">{onGrowth && <><button onClick={() => onGrowth('gacha')}>ガチャ</button><button onClick={() => onGrowth('missions')}>ミッション</button><button onClick={() => onGrowth('outfit')}>きせかえ</button></>}{onLeaderboard && <button onClick={onLeaderboard}>ランキング</button>}</div></details>
          <div className="lh-level"><img src={growth ? equippedPoseSrc(growth) : '/mascots/basic.webp'} alt="とびら君" /><span>いっしょに、少しずつ。</span><small>Lv. {levelOf(growth?.xp || 0).level}</small></div>
        </aside>
      </div>
      <footer className="lh-footer"><span>MANATOBI LISTENING <span>·</span> 音から、学びをひらく。</span><button onClick={onIntro}><HelpCircle size={15} /> 使い方</button></footer>
    </div>
    {support && <React.Suspense fallback={<div className="lh-load" role="status">補助学習を読み込んでいます…<button onClick={() => setSupport(null)}>閉じる</button></div>}><ListeningSupport initialTab={support} uid={owner} onClose={() => setSupport(null)} onPractice={(chapter, index) => { setSupport(null); listenAt(chapter, index); }} /></React.Suspense>}
  </main>;
}
