import React, { useState } from 'react';
import { ArrowRight, BookOpen, ChevronLeft, Headphones, PenLine, Swords } from 'lucide-react';
import type { SubjectId } from './SubjectSelection';
import { getSubjectStats } from '../data/chapterIndex.generated';
import { VOCABULARY_COUNT } from '../data/listeningVocabularyMeta.generated';
import { auth, FIREBASE_CONFIGURED } from '../firebase';
import './listening-home.css';

/**
 * リスニング専用版の「科目選択」画面（2026-09-29）。
 *
 * 主役はリスニング。英文法・英単語は「聞くための土台」としてまとめて固める。
 * 統合版の SubjectSelection（学びの本棚）と同じ props を受けるので、App.tsx は import 1行の差し替えだけで済む。
 *  - 英文法の演習   → onSelectSubject('english_grammar')（統合版と同じ単元一覧・演習画面）
 *  - 英単語カード   → ホームと同じ補助学習（ListeningSupport）を開く
 *  - 対戦で固める   → onBattle（対戦ロビー。科目は「英文法」「英単語・英熟語」を選べる）
 */
const ListeningSupport = React.lazy(() => import('./ListeningSupport').then(m => ({ default: m.ListeningSupport })));

export interface ListeningSubjectSelectionProps {
  onSelectSubject: (subject: SubjectId) => void;
  currentSubject?: SubjectId;
  backLabel?: string;
  isGuest: boolean;
  onBack?: () => void;
  /** 統合版の互換用（専用版では使わない） */
  onRika?: () => void;
  /** 対戦ロビーを開く（英文法・英単語の対戦で固める） */
  onBattle?: () => void;
}

export function ListeningSubjectSelection({ onSelectSubject, currentSubject, onBack, onBattle, backLabel = 'ホームに戻る' }: ListeningSubjectSelectionProps) {
  const [support, setSupport] = useState<'words' | 'grammar' | null>(null);
  const listening = getSubjectStats('english_listening');
  const grammar = getSubjectStats('english_grammar');
  const uid = auth.currentUser?.uid || 'guest';
  const current = (id: SubjectId) => (currentSubject === id ? { 'aria-current': 'true' as const } : {});

  return <main className="listening-home ls-subjects" data-listening-subjects>
    <div className="lh-container">
      <header className="lh-header">
        {onBack ? <button className="ls-subjects-back" onClick={onBack} aria-label={backLabel}><ChevronLeft size={18} />{backLabel}</button> : <span />}
        <div className="lh-brand"><img src="/manatobi-logo.jpg" alt="マナトビ" width={1024} height={367} /><span>LISTENING</span></div>
      </header>

      <section className="ls-subjects-title">
        <p className="lh-eyebrow">なにを学ぶ？</p>
        <h1>聞く力と、その土台。</h1>
        <p>リスニングを軸に、英文法と英単語をまとめて固めよう。</p>
      </section>

      {/* ① 主役：リスニング */}
      <button className="ls-subject-main" data-subject-id="english_listening" {...current('english_listening')} onClick={() => onSelectSubject('english_listening')}>
        <span className="lh-main-icon"><Headphones size={28} /></span>
        <span><small>メイン</small><strong>英語リスニング</strong><span>第1問A〜第6問B・全{listening.units}単元・マーク{listening.marks}個</span></span>
        <ArrowRight size={22} />
      </button>

      {/* ② 英文法・英単語を固める（まとめてひとつのブロック） */}
      <section className="ls-foundation" aria-labelledby="ls-foundation-title">
        <div className="lh-section-heading"><h2 id="ls-foundation-title">英文法・英単語を固める</h2><span>聞き取れない原因の多くは、語と文の形。</span></div>
        <div className="ls-foundation-grid">
          <button data-subject-id="english_grammar" {...current('english_grammar')} onClick={() => onSelectSubject('english_grammar')}>
            <PenLine size={22} /><span><strong>英文法の演習</strong><small>全{grammar.chapters}単元・4択{grammar.marks}問</small></span><ArrowRight size={16} />
          </button>
          <button onClick={() => setSupport('words')} aria-label="英単語・英熟語のカードを開く">
            <span className="lh-letter">Aa</span><span><strong>英単語・英熟語</strong><small>{VOCABULARY_COUNT.toLocaleString()}語・1章20語</small></span><ArrowRight size={16} />
          </button>
          <button onClick={() => setSupport('grammar')} aria-label="聞き取りの文法ポイントを開く">
            <BookOpen size={22} /><span><strong>聞き取りの文法</strong><small>8ポイント・例文つき</small></span><ArrowRight size={16} />
          </button>
        </div>
        {onBattle && <button className="ls-foundation-battle" onClick={onBattle}>
          <span className="lh-battle-icon"><Swords size={22} /></span>
          <span><strong>対戦で固める</strong><small>{FIREBASE_CONFIGURED ? '英文法・英単語もAI・友だち・全国対戦で選べます' : 'ゲストではAI対戦を楽しめます'}</small></span><ArrowRight size={18} />
        </button>}
      </section>

      <p className="ls-subjects-note">このアプリは英語専用です。進捗と復習ノートは科目ごとに保存されます。</p>
    </div>
    {support && <React.Suspense fallback={<div className="lh-load" role="status">読み込んでいます…<button onClick={() => setSupport(null)}>閉じる</button></div>}>
      <ListeningSupport initialTab={support} uid={uid} onClose={() => setSupport(null)} onPractice={() => { setSupport(null); onSelectSubject('english_listening'); }} />
    </React.Suspense>}
  </main>;
}
