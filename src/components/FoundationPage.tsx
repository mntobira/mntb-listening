import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, ChevronDown, ChevronLeft, ChevronRight, Headphones, Info, PenLine, Repeat2, Swords, X } from 'lucide-react';
import { LISTENING_GRAMMAR } from '../data/listeningSupport';
import { VOCABULARY_COUNT } from '../data/listeningVocabularyMeta.generated';
import { getSubjectStats } from '../data/chapterIndex.generated';
import { stopSpeech } from '../utils/listeningSpeech';
import { ReadAloud, useSupportProgress } from './foundationShared';
import { FoundationWords } from './FoundationWords';
import './foundation.css';

/**
 * 「英文法・英単語を固める」ページ（2026-09-30・A1/A2/A17/A18）。
 *
 * 以前は科目選択の上に重なるダイアログ（ListeningSupport）で、下のナビが隠れ、
 * 注意書き・検索・絞り込み3つ・章の選択が縦に積まれて単語カードが1枚しか見えなかった。
 *
 * ★UIの決まり（CLAUDE.md「UI principles」）★
 *   - 下のナビを残したまま1画面に収める。スクロールするのは一覧の中だけ。
 *   - 上は ［単語・熟語｜英文法｜その他］ の切り替え1本。
 *   - 注意書き（保存先・出典・照合方法）は ⓘ の吹き出しにまとめる。
 *   - リスニング（主役）とは別のページ。リスニングは「学習」から、ここはホームの帯から入る。
 */
export type FoundationTab = 'words' | 'grammar' | 'more';

export interface FoundationPageProps {
  tab: FoundationTab;
  onTab: (tab: FoundationTab) => void;
  uid: string;
  onBack: () => void;
  /** 英文法の4択演習（20単元）を開く */
  onGrammarUnits: () => void;
  /** 単語の例から、その回のリスニングを解く */
  onPractice: (chapterId: string, index: number) => void;
  onBattle?: () => void;
  onReview?: () => void;
  onListening?: () => void;
}

export function FoundationPage({ tab, onTab, uid, onBack, onGrammarUnits, onPractice, onBattle, onReview, onListening }: FoundationPageProps) {
  const { progress, error, locked, mark } = useSupportProgress(uid);
  const [infoOpen, setInfoOpen] = useState(false);
  const [grammarIndex, setGrammarIndex] = useState(0);
  const [grammarAnswer, setGrammarAnswer] = useState<number | null>(null);
  const known = useMemo(() => new Set(progress.words), [progress.words]);
  const grammarStats = getSubjectStats('english_grammar');

  useEffect(() => () => { stopSpeech(); document.querySelectorAll<HTMLAudioElement>('.fd-page audio').forEach(a => a.pause()); }, []);
  useEffect(() => { stopSpeech(); setInfoOpen(false); }, [tab]);

  const lesson = LISTENING_GRAMMAR[grammarIndex];
  const grammarKnown = progress.grammar.includes(lesson.id);
  const pickLesson = (i: number) => { stopSpeech(); setGrammarIndex(i); setGrammarAnswer(null); };

  return <main className="fd-page" data-foundation data-tab={tab}>
    <header className="fd-head">
      <button type="button" className="fd-back" onClick={onBack} aria-label="ホームへ戻る"><ChevronLeft size={18} aria-hidden="true" /><span>ホーム</span></button>
      <div className="fd-head-title"><h1>英文法・英単語を固める</h1><p>聞き取れない原因の多くは、語と文の形。</p></div>
      <div className="fd-info">
        <button type="button" className="fd-info-btn" aria-expanded={infoOpen} aria-controls="fd-info-pop" aria-label="保存と収録についての説明" onClick={() => setInfoOpen(v => !v)}><Info size={18} aria-hidden="true" /></button>
        {infoOpen && <div id="fd-info-pop" role="dialog" aria-label="保存と収録について" className="fd-info-pop">
          <button type="button" aria-label="説明を閉じる" onClick={() => setInfoOpen(false)}><X size={16} aria-hidden="true" /></button>
          <p>覚えた印はこの端末・アカウントに保存します（クラウド同期・コイン加算なし）。</p>
          <p>単語・熟語は全{VOCABULARY_COUNT.toLocaleString()}語。複数の公開語彙リストを合算し、重要度で再編したマナトビ独自の編成です。</p>
          <p>「リスニングに出る語」は教材スクリプトに同じ綴りがある語です。語形変化・言い換えは結び付けていません。</p>
          <p>「志望校別」は、志望校の出題レベルに合わせて範囲を自分で選びます。</p>
          <p>読み上げの声・対応状況は端末によって異なります。</p>
        </div>}
      </div>
    </header>

    <div className="mt-segment fd-tabs" role="tablist" aria-label="固める内容">
      <button role="tab" aria-selected={tab === 'words'} onClick={() => onTab('words')}>単語・熟語</button>
      <button role="tab" aria-selected={tab === 'grammar'} onClick={() => onTab('grammar')}>英文法</button>
      <button role="tab" aria-selected={tab === 'more'} onClick={() => onTab('more')}>その他</button>
    </div>
    {error && <p role="alert" className="fd-error">{error}</p>}

    {tab === 'words' && <FoundationWords known={known} onMark={(id, done) => mark('words', id, done)} onPractice={onPractice} />}

    {tab === 'grammar' && <section className="fd-panel fd-grammar" aria-label="聞き取りの英文法">
      <div className="fd-points" role="tablist" aria-label="聞き取りの文法ポイント">
        {LISTENING_GRAMMAR.map((g, i) => <button key={g.id} type="button" role="tab" aria-selected={i === grammarIndex} onClick={() => pickLesson(i)}>
          <b>{String(i + 1).padStart(2, '0')}</b><span>{g.title}</span>{progress.grammar.includes(g.id) && <Check size={14} aria-label="確認済み" />}
        </button>)}
      </div>
      <article className="fd-lesson">
        <h2><b>{String(grammarIndex + 1).padStart(2, '0')}.</b> {lesson.title}</h2>
        <p className="fd-lesson-point">{lesson.point}</p>
        <div className="fd-lesson-example"><p lang="en">{lesson.example}</p><ReadAloud key={lesson.id} text={lesson.example} /></div>
        <details className="fd-lesson-more"><summary>訳と聞き取りのコツ<ChevronDown size={15} aria-hidden="true" /></summary><p>{lesson.translation}</p><p className="fd-tip"><Headphones size={16} aria-hidden="true" />{lesson.tip}</p></details>
        <p className="fd-quiz-q">{lesson.question}</p>
        <div className="fd-options">{lesson.options.map((o, i) => <button key={lesson.id + i} type="button" disabled={grammarAnswer !== null} onClick={() => setGrammarAnswer(i)}
          data-correct={grammarAnswer !== null && i === lesson.answer ? true : undefined} data-wrong={grammarAnswer === i && i !== lesson.answer ? true : undefined}>{o}</button>)}</div>
        {grammarAnswer !== null && <div role="status" className="fd-feedback"><strong>{grammarAnswer === lesson.answer ? '正解' : 'ポイントを確認しよう'}</strong> {lesson.explanation} <button type="button" onClick={() => setGrammarAnswer(null)}>やり直す</button></div>}
        <div className="fd-lesson-actions">
          <button type="button" className="fd-secondary" disabled={grammarAnswer !== lesson.answer || locked} aria-pressed={grammarKnown} onClick={() => mark('grammar', lesson.id, !grammarKnown)}><Check size={16} aria-hidden="true" />{grammarKnown ? '確認済みを外す' : '分かった'}</button>
          {grammarIndex < LISTENING_GRAMMAR.length - 1 && <button type="button" className="fd-secondary" onClick={() => pickLesson(grammarIndex + 1)}>次のポイント<ChevronRight size={16} aria-hidden="true" /></button>}
        </div>
      </article>
      <button type="button" className="fd-primary" onClick={onGrammarUnits}><PenLine size={18} aria-hidden="true" /><span><strong>英文法の4択演習へ</strong><small>全{grammarStats.chapters ?? 20}単元・文型から会話表現まで</small></span><ChevronRight size={18} aria-hidden="true" /></button>
    </section>}

    {tab === 'more' && <section className="fd-panel fd-more" aria-label="その他の固め方">
      {onBattle && <button type="button" className="fd-more-card" data-kind="battle" onClick={onBattle}><Swords size={22} aria-hidden="true" /><span><strong>対戦で固める</strong><small>英文法・英単語もAI・友だち・全国対戦で</small></span><ChevronRight size={18} aria-hidden="true" /></button>}
      <button type="button" className="fd-more-card" data-kind="grammar" onClick={onGrammarUnits}><PenLine size={22} aria-hidden="true" /><span><strong>英文法の4択演習</strong><small>全{grammarStats.chapters ?? 20}単元・単元ごとに正答率を記録</small></span><ChevronRight size={18} aria-hidden="true" /></button>
      {onReview && <button type="button" className="fd-more-card" data-kind="review" onClick={onReview}><Repeat2 size={22} aria-hidden="true" /><span><strong>復習ノート</strong><small>間違えた問題を解き直す</small></span><ChevronRight size={18} aria-hidden="true" /></button>}
      {onListening && <button type="button" className="fd-more-card" data-kind="listening" onClick={onListening}><BookOpen size={22} aria-hidden="true" /><span><strong>リスニングへ</strong><small>メイン：第1問A〜第6問B</small></span><ChevronRight size={18} aria-hidden="true" /></button>}
    </section>}
  </main>;
}
