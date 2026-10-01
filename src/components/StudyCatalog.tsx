import React from 'react';
import { ArrowRight, BookOpen, ChevronLeft, FlaskConical, Globe2, Headphones, PenLine, Sigma } from 'lucide-react';
import { STUDY_CATALOG, findStudySubject, type StudyContent, type StudyIcon, type StudySubject } from '../data/studyCatalog';
import './study-catalog.css';
import { TobiraBuddy } from './TobiraBuddy';

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
  // ★2026-10-01 D：科目は英語だけなので「科目を選ぶ」を出さない★
  //   科目が1つのときはその科目のコンテンツを直接出し、戻るはホームへ。
  //   科目が2つ以上に増えたら、従来どおり科目選択 → コンテンツの2段に戻る。
  const single = STUDY_CATALOG.length === 1 ? STUDY_CATALOG[0] : undefined;
  const subject = single ?? findStudySubject(subjectId);
  const showSubjects = !subject;
  const title = showSubjects ? '科目を選ぶ' : single ? '演習する' : subject.label;
  const sub = showSubjects ? 'ひとりで学ぶ・演習する' : subject.description;
  const back = showSubjects || single ? onBack : () => onSubject(null);
  const backLabel = showSubjects || single ? 'ホーム' : '科目';

  return (
    <main className="sc-page" data-study-catalog={showSubjects ? 'subjects' : 'contents'}>
      <header className="sc-head">
        <button type="button" className="sc-back" onClick={back} aria-label={`${backLabel}に戻る`}><ChevronLeft size={18} aria-hidden="true" /><span>{backLabel}</span></button>
        <div className="sc-head-title">
          <p className="sc-crumb" aria-label="現在地">{single ? <>演習する › <b>{single.label}</b></> : <>演習する{!showSubjects && <> › <b>{subject.label}</b></>}</>}</p>
          <h1>{title}</h1>
          <p>{sub}</p>
        </div>
      </header>

      {!showSubjects && <TobiraBuddy className="sc-buddy" size="sm" bubble="right" input={{ screen: 'study', seed: new Date().getDate() }} />}

      <div className="sc-list" role="list">
        {showSubjects
          ? STUDY_CATALOG.map(s => <div role="listitem" key={s.id}>
              <StudyCard dataId={s.id} icon={s.icon} title={s.label} description={s.description}
                meta={`${s.contents.length}コース：${subjectMeta(s)}`} onClick={() => onSubject(s.id)} />
            </div>)
          : <>
              {/* 問題を解くもの（リスニング・英文法・英単語の4択）は同じ列に並べる */}
              {subject.contents.filter(c => c.section !== 'memorize').map(c => <div role="listitem" key={c.id}>
                <StudyCard dataId={c.id} icon={c.icon} title={c.title} description={c.description} meta={c.meta}
                  primary={c.primary} badge={lastContentId === c.id ? '前回' : undefined}
                  progress={c.progressSubject ? progressOf?.(c.progressSubject) : undefined}
                  onClick={() => onContent(c)} />
              </div>)}
              {/* ★暗記帳は問題とは別の枠に置く（2026-10-01 夜）★ */}
              {subject.contents.some(c => c.section === 'memorize') && <>
                <h2 className="sc-section" role="presentation" data-study-section="memorize">覚える</h2>
                {subject.contents.filter(c => c.section === 'memorize').map(c => <div role="listitem" key={c.id}>
                  <StudyCard dataId={c.id} icon={c.icon} title={c.title} description={c.description} meta={c.meta}
                    badge={lastContentId === c.id ? '前回' : undefined} onClick={() => onContent(c)} />
                </div>)}
              </>}
            </>}
      </div>

      {showSubjects && <p className="sc-note" data-study-more>ほかの科目は順次追加します。<br />進捗と復習ノートは科目ごとに保存されます。</p>}
    </main>
  );
}
