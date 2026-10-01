import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Info, X } from 'lucide-react';
import { VOCABULARY_COUNT } from '../data/listeningVocabularyMeta.generated';
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
  // ★2026-10-01 夜：暗記帳（単語帳）と問題（4択）は1ページの中のタブで分けず、別々のページにする★
  //   「演習する」で 問題＝他の単元と同じ列、暗記帳＝「覚える」の別枠 から入る。'more'（その他）は廃止して暗記帳へ。
  const tab: 'words' | 'quiz' = rawTab === 'quiz' ? 'quiz' : 'words';
  void onGrammarUnits; void onBattle; void onReview; void onListening;
  const { progress, error, mark } = useSupportProgress(uid);
  const [infoOpen, setInfoOpen] = useState(false);
  const known = useMemo(() => new Set(progress.words), [progress.words]);

  useEffect(() => () => { stopSpeech(); document.querySelectorAll<HTMLAudioElement>('.fd-page audio').forEach(a => a.pause()); }, []);
  useEffect(() => { stopSpeech(); setInfoOpen(false); }, [tab]);


  return <main className="fd-page" data-foundation data-tab={tab}>
    <header className="fd-head">
      <button type="button" className="fd-back" onClick={onBack} aria-label={`${backLabel}へ戻る`}><ChevronLeft size={18} aria-hidden="true" /><span>{backLabel}</span></button>
      <div className="fd-head-title">{tab === 'quiz'
        ? <><h1>英単語・英熟語</h1><p>4択の問題で確かめる。</p></>
        : <><h1>英単語帳（暗記帳）</h1><p>100語ずつめくって覚える。</p></>}</div>
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

    {error && <p role="alert" className="fd-error">{error}</p>}

    {tab === 'words' && <FoundationWords known={known} onMark={(id, done) => mark('words', id, done)} onPractice={onPractice} />}

    {tab === 'quiz' && <VocabQuiz uid={uid} known={known} onMark={(id) => mark('words', id, true)} onWordbook={() => onTab('words')} />}

  </main>;
}
