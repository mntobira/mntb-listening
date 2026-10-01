import React from 'react';
import { ArrowRight, BookOpen, ChevronLeft, FlaskConical, Globe2, Headphones, PenLine, Sigma } from 'lucide-react';
import { STUDY_CATALOG, findStudySubject, type StudyContent, type StudyIcon, type StudySubject } from '../data/studyCatalog';
import './study-catalog.css';

/**
 * 演習する（B2〜B6）2026-10-01
 *
 *   ホーム ─「演習する」→ ［科目を選ぶ］→［学習コンテンツを選ぶ］→ 既存の単元一覧・演習
 *
 * ★科目でUIを変えない（B4・B16）★
 *   画面はこのファイル1つ。科目カードもコンテンツカードも同じ StudyCard で描き、
 *   変わるのは studyCatalog.ts のデータ（名前・説明・規模・アイコン・進捗）だけ。
 *   科目が1つしか無いときは科目選択を飛ばさず、1枚のカードとして見せる（科目が増えても形が同じ）。
 */
export interface StudyProgress { solved: number; total: number }

export interface StudyCatalogProps {
  /** 選んでいる科目（null なら科目選択を表示） */
  subjectId: string | null;
  onSubject: (id: string | null) => void;
  onContent: (content: StudyContent) => void;
  onBack: () => void;
  /** コンテンツごとの進捗（progressSubject をキーに） */
  progressOf?: (progressSubject: string) => StudyProgress | undefined;
  /** 前回開いたコンテンツ（カードに「前回」を付ける） */
  lastContentId?: string | null;
}

const ICONS: Record<StudyIcon, React.ComponentType<{ size?: number; 'aria-hidden'?: boolean }>> = {
  headphones: Headphones, pen: PenLine, book: BookOpen, flask: FlaskConical, sigma: Sigma, globe: Globe2,
  letters: () => <span className="sc-letters" aria-hidden="true">Aa</span>,
};

/** 科目カード・コンテンツカード共通（B5：タイトル／説明／規模／進捗／矢印／アイコン） */
export function StudyCard({ icon, title, description, meta, progress, primary, badge, onClick, dataId }: {
  icon: StudyIcon; title: string; description: string; meta?: string; progress?: StudyProgress;
  primary?: boolean; badge?: string; onClick: () => void; dataId?: string;
}) {
  const Icon = ICONS[icon];
  const pct = progress && progress.total > 0 ? Math.round((progress.solved / progress.total) * 100) : null;
  return (
    <button type="button" className="sc-card" data-primary={primary || undefined} data-study-card={dataId} onClick={onClick}>
      <span className="sc-icon"><Icon size={24} aria-hidden /></span>
      <span className="sc-body">
        <span className="sc-title"><strong>{title}</strong>{badge && <em>{badge}</em>}</span>
        <span className="sc-desc">{description}</span>
        {(meta || pct !== null) && <span className="sc-meta">
          {meta && <small>{meta}</small>}
          {pct !== null && <span className="sc-progress" role="progressbar" aria-label={`${title}の進捗`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
            <span className="sc-track"><i style={{ width: `${pct}%` }} /></span><b>{pct}%</b>
          </span>}
        </span>}
      </span>
      <ArrowRight className="sc-arrow" size={20} aria-hidden="true" />
    </button>
  );
}

function subjectMeta(s: StudySubject): string {
  return s.contents.map(c => c.title).join('・');
}

export function StudyCatalog({ subjectId, onSubject, onContent, onBack, progressOf, lastContentId }: StudyCatalogProps) {
  const subject = findStudySubject(subjectId);
  // 科目が決まっていない、または見つからないときは科目選択
  const showSubjects = !subject;
  const title = showSubjects ? '科目を選ぶ' : subject.label;
  const sub = showSubjects ? 'ひとりで学ぶ・演習する' : subject.description;
  // 戻る：コンテンツ一覧 → 科目選択 → ホーム（科目が1つでも同じ順にする）
  const back = showSubjects ? onBack : () => onSubject(null);
  const backLabel = showSubjects ? 'ホーム' : '科目';

  return (
    <main className="sc-page" data-study-catalog={showSubjects ? 'subjects' : 'contents'}>
      <header className="sc-head">
        <button type="button" className="sc-back" onClick={back} aria-label={`${backLabel}に戻る`}><ChevronLeft size={18} aria-hidden="true" /><span>{backLabel}</span></button>
        <div className="sc-head-title">
          <p className="sc-crumb" aria-label="現在地">演習する{!showSubjects && <> › <b>{subject.label}</b></>}</p>
          <h1>{title}</h1>
          <p>{sub}</p>
        </div>
      </header>

      <div className="sc-list" role="list">
        {showSubjects
          ? STUDY_CATALOG.map(s => <div role="listitem" key={s.id}>
              <StudyCard dataId={s.id} icon={s.icon} title={s.label} description={s.description}
                meta={`${s.contents.length}コース：${subjectMeta(s)}`} onClick={() => onSubject(s.id)} />
            </div>)
          : subject.contents.map(c => <div role="listitem" key={c.id}>
              <StudyCard dataId={c.id} icon={c.icon} title={c.title} description={c.description} meta={c.meta}
                primary={c.primary} badge={lastContentId === c.id ? '前回' : undefined}
                progress={c.progressSubject ? progressOf?.(c.progressSubject) : undefined}
                onClick={() => onContent(c)} />
            </div>)}
      </div>

      {showSubjects && <p className="sc-note" data-study-more>ほかの科目は順次追加します。<br />進捗と復習ノートは科目ごとに保存されます。</p>}
    </main>
  );
}
