import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Info, PenLine, Repeat2, Swords, X } from 'lucide-react';
import { VOCABULARY_COUNT } from '../data/listeningVocabularyMeta.generated';
import { getSubjectStats } from '../data/chapterIndex.generated';
import { stopSpeech } from '../utils/listeningSpeech';
import { useSupportProgress } from './foundationShared';
import { FoundationWords } from './FoundationWords';
import { VocabQuiz } from './VocabQuiz';
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
/** 'grammar'（旧：聞き取りの文法）は 2026-10-01 に廃止。古い保存値・呼び出しは単語帳に寄せる */
export type FoundationTab = 'words' | 'quiz' | 'more' | 'grammar';

export interface FoundationPageProps {
  tab: FoundationTab;
  onTab: (tab: FoundationTab) => void;
  uid: string;
  onBack: () => void;
  /** 戻るボタンの文字（既定：ホーム） */
  backLabel?: string;
  /** 英文法の4択演習（20単元）を開く */
  onGrammarUnits: () => void;
  /** 単語の例から、その回のリスニングを解く */
  onPractice: (chapterId: string, index: number) => void;
  onBattle?: () => void;
  onReview?: () => void;
  onListening?: () => void;
}

export function FoundationPage({ tab: rawTab, onTab, uid, onBack, backLabel = 'ホーム', onGrammarUnits, onPractice, onBattle, onReview, onListening }: FoundationPageProps) {
  const tab = rawTab === 'grammar' ? 'words' : rawTab;
  const { progress, error, mark } = useSupportProgress(uid);
  const [infoOpen, setInfoOpen] = useState(false);
  const known = useMemo(() => new Set(progress.words), [progress.words]);
  const grammarStats = getSubjectStats('english_grammar');

  useEffect(() => () => { stopSpeech(); document.querySelectorAll<HTMLAudioElement>('.fd-page audio').forEach(a => a.pause()); }, []);
  useEffect(() => { stopSpeech(); setInfoOpen(false); }, [tab]);


  return <main className="fd-page" data-foundation data-tab={tab}>
    <header className="fd-head">
      <button type="button" className="fd-back" onClick={onBack} aria-label={`${backLabel}へ戻る`}><ChevronLeft size={18} aria-hidden="true" /><span>{backLabel}</span></button>
      <div className="fd-head-title"><h1>英単語・英熟語</h1><p>単語帳で覚えて、4択で確かめる。</p></div>
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

    <div className="mt-segment fd-tabs" role="tablist" aria-label="英単語の使い方">
      <button role="tab" aria-selected={tab === 'words'} onClick={() => onTab('words')}>単語帳</button>
      <button role="tab" aria-selected={tab === 'quiz'} onClick={() => onTab('quiz')}>4択で解く</button>
      <button role="tab" aria-selected={tab === 'more'} onClick={() => onTab('more')}>その他</button>
    </div>
    {error && <p role="alert" className="fd-error">{error}</p>}

    {tab === 'words' && <FoundationWords known={known} onMark={(id, done) => mark('words', id, done)} onPractice={onPractice} />}

    {tab === 'quiz' && <VocabQuiz uid={uid} known={known} onMark={(id) => mark('words', id, true)} onWordbook={() => onTab('words')} />}

    {tab === 'more' && <section className="fd-panel fd-more" aria-label="その他の固め方">
      {onBattle && <button type="button" className="fd-more-card" data-kind="battle" onClick={onBattle}><Swords size={22} aria-hidden="true" /><span><strong>対戦で固める</strong><small>英文法・英単語もAI・友だち・全国対戦で</small></span><ChevronRight size={18} aria-hidden="true" /></button>}
      <button type="button" className="fd-more-card" data-kind="grammar" onClick={onGrammarUnits}><PenLine size={22} aria-hidden="true" /><span><strong>英文法の4択演習</strong><small>全{grammarStats.chapters ?? 20}単元・単元ごとに正答率を記録</small></span><ChevronRight size={18} aria-hidden="true" /></button>
      {onReview && <button type="button" className="fd-more-card" data-kind="review" onClick={onReview}><Repeat2 size={22} aria-hidden="true" /><span><strong>復習ノート</strong><small>間違えた問題を解き直す</small></span><ChevronRight size={18} aria-hidden="true" /></button>}
      {onListening && <button type="button" className="fd-more-card" data-kind="listening" onClick={onListening}><BookOpen size={22} aria-hidden="true" /><span><strong>リスニングへ</strong><small>メイン：第1問A〜第6問B</small></span><ChevronRight size={18} aria-hidden="true" /></button>}
    </section>}
  </main>;
}
