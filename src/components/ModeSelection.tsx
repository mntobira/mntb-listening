import React, { useEffect } from 'react';
import { BookOpen, ArrowLeft, FileText, Swords, ArrowRight } from 'lucide-react';
import { labelOfSubject } from '../data/subjectLabels';
import { DEFAULT_SUBJECT, subjectDefinitionOf } from '../data/subjects';
import { DoorMascot } from './DoorMascot';
import { subjectTheme } from '../data/subjectTheme';
// 教科IDの型は data/allChapters.ts の SubjectKey が唯一の定義
import type { SubjectKey } from '../data/allChapters';
import { KineticText } from '../motion';

interface ModeSelectionProps {
  onSelectMode: (mode: 'mini_test' | 'practice' | 'learning') => void;
  onBack: () => void;
  onChangeSubject?: () => void;
  /** 選択中の科目。省略時は登録簿の先頭の科目。 */
  subject?: SubjectKey;
  /**
   * オンライン対戦を開く。
   *
   * ★この画面に対戦の席を作った理由★
   *   利用者の指示「オンラインをメインにするUIにしていかんとだめよね？」
   *   「対戦画面は他のところでしているのでそこまでのところはすべて変えて」
   *
   *   この画面は下部ナビの「学習」を押すと必ず来る場所で、
   *   ★対戦という語が1文字も無かった★。
   *   モードは「学習(インプット)」と「演習問題」の2枚だけで、
   *   ここまで来た人には対戦が存在しないように見えていた。
   *
   * ★任意（省略可）にしている★
   *   FEATURES.battle が false のときは App 側から渡さない。
   *   渡されなければ席ごと描かないので、
   *   「見えるのに入れない」を作らない。
   */
  onBattle?: () => void;
}

export function ModeSelection({ onSelectMode, onBack, subject = DEFAULT_SUBJECT, onBattle, onChangeSubject }: ModeSelectionProps) {
  /**
   * この画面は、登録簿で entry: 'mode_selection' にした科目（演習の前に「まとめプリント」などを
   * 選ばせたい科目）のための入口。いまの英語2科目は単元一覧へ直行するので通らない。
   * 文言は登録簿（data/subjects.ts）から引くので、科目を足しても画面を書き換えなくてよい。
   */
  const definition = subjectDefinitionOf(subject);
  /** まとめプリントを持たない科目（学習カードを隠す）。登録簿で learningDescription を書いた科目だけ出す */
  const learningDescription = definition?.learningDescription;
  const hideLearning = !learningDescription;
  /** 科目ごとの配色。演習問題カードのアクセントを科目色にして、いまの科目を見分けられるようにする */
  const theme = subjectTheme(subject);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <div className="mtb-page mode-desk w-full min-h-0 max-h-full overflow-y-auto pb-app-nav" style={{ '--subject-accent': theme.accent, '--subject-soft': theme.accentSoft } as React.CSSProperties}>
        <header className="mtb-page-header">
          <button type="button" onClick={onBack} className="mtb-back" aria-label="ホームに戻る"><ArrowLeft size={19} aria-hidden="true" /><span>ホーム</span></button>
          <span className="mtb-kicker">STUDY ROOM</span>
          <DoorMascot subject={subject} showSpeech={false} size="mini" />
        </header>
        <div className="mode-heading">
          <p className="mtb-kicker">今日の学びを、明日の自信に。</p>
          <h1><KineticText text={labelOfSubject(subject)} /></h1>
          <p>学習モードを選択</p>
        </div>
        {onChangeSubject && <div className="mb-3 flex justify-end"><button type="button" onClick={onChangeSubject} className="min-h-[44px] rounded-full border border-gray-200 bg-white px-4 text-sm font-bold text-[#2C3E50]">科目を変更</button></div>}
        {onBattle && (
          <button type="button" onClick={onBattle} aria-label="オンライン対戦を開く" className="mode-battle-bridge">
            <Swords size={18} aria-hidden="true" /><span>対戦ロビーへ<small>友だちと1対1で早解き・全国とレート戦</small></span><ArrowRight size={16} aria-hidden="true" />
          </button>
        )}
        <div className={`mode-workspace ${hideLearning ? 'mode-workspace-solo' : ''}`}>
          <section className="mode-practice-stage" aria-labelledby="mode-practice-title">
            <div className="mode-practice-art" aria-hidden="true"><span>TRY</span><BookOpen /><i>01</i></div>
            <div className="mode-practice-copy">
              <span className="mtb-kicker">知識を、使える力に</span>
              <h2 id="mode-practice-title">演習問題</h2>
              <p>{definition?.practiceDescription ?? 'より実践的な問題に取り組みます。応用力を身につけたい場合におすすめです。'}</p>
            </div>
            <button type="button" onClick={() => onSelectMode('practice')} className="mode-primary" aria-label="演習問題の単元を選ぶ"><span>演習問題をはじめる</span><ArrowRight size={21} aria-hidden="true" /></button>
          </section>
          {!hideLearning && (
            <button type="button" onClick={() => onSelectMode('learning')} className="mode-input-paper" aria-label="学習(インプット)を開く">
              <span className="mode-page-tab">READ</span><FileText size={34} aria-hidden="true" />
              <h2>まとめプリント</h2><span className="mode-input-subtitle">読む・理解する</span>
              <p>{learningDescription}</p>
              <span className="mode-input-open">ノートをひらく <ArrowRight size={18} aria-hidden="true" /></span>
            </button>
          )}
        </div>
        <p className="mode-footnote">{hideLearning ? 'この科目は演習問題を公開中です。学習(インプット)は順次追加予定です。' : '読む → 解く → 振り返る。自分に合った入口から始めましょう。'}</p>
      </div>
    </>
  );
}
