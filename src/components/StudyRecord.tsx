import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, PenLine, Play, RotateCcw, Swords, XCircle } from 'lucide-react';
import { auth } from '../firebase';
import { STUDY_LOG_DAYS, groupStudyLogByDay, loadStudyLog, type StudyLogEntry } from '../utils/studyLog';
import './study-record.css';
import { KineticText, ScoreRing } from '../motion';
import { CountUp } from './ui/CountUp';

/**
 * 学習記録（2026-10-04 ご要望）
 *   直近3日ぶん、一人で学ぶ・対戦で「どの問題を解いて、どこを間違えたか」を時系列で見る画面。
 *   進捗や達成の数字よりも「何をやって、どこでつまずいたか」を真ん中に置く。
 *   2026-10-11：一人で学んだ大問は、ここから「解きなおす（全部）」「まちがえた問題だけ」をすぐ選べる。
 */
export interface StudyRetry { chapterId: string; questionId: string; wrongOnly: boolean; subQuestionIds: string[] }

export function StudyRecord({ onReview, onRetry, embedded = false }: { onReview?: () => void; onRetry?: (t: StudyRetry) => void; embedded?: boolean }) {
  const uid = auth.currentUser?.uid || 'guest';
  const [filter, setFilter] = useState<'all' | 'wrong'>('all');
  const entries = useMemo(() => loadStudyLog(uid), [uid]);
  const days = useMemo(() => groupStudyLogByDay(filter === 'wrong' ? entries.filter(e => e.items.some(i => !i.correct)) : entries), [entries, filter]);
  const total = entries.reduce((n, e) => n + e.items.length, 0);
  const wrong = entries.reduce((n, e) => n + e.items.filter(i => !i.correct).length, 0);
  return (
    <section className={`study-record ${embedded ? 'is-embedded' : ''}`} aria-labelledby="study-record-title" data-study-record>
      <header className="sr-head">
        <div>
          <h1 id="study-record-title"><KineticText text="学習記録" /></h1>
          <p>直近{STUDY_LOG_DAYS}日に解いた問題と、まちがえた所</p>
        </div>
      </header>
      <div className="sr-summary" role="group" aria-label={`直近${STUDY_LOG_DAYS}日のまとめ`}>
        <span><b><CountUp value={total} fromZero duration={900} delay={250} /></b>問 解いた</span>
        <span className="is-wrong"><b><CountUp value={wrong} fromZero duration={900} delay={400} /></b>問 まちがえた</span>
        {onReview && wrong > 0 && <button type="button" onClick={onReview}><RotateCcw size={16} aria-hidden="true" />復習ノートで直す</button>}
      </div>
      <div className="mt-segment sr-filter" role="tablist" aria-label="表示">
        <button type="button" role="tab" aria-selected={filter === 'all'} onClick={() => setFilter('all')}>すべて</button>
        <button type="button" role="tab" aria-selected={filter === 'wrong'} onClick={() => setFilter('wrong')}>まちがえた問題だけ</button>
      </div>
      {days.length === 0 ? (
        <p className="sr-empty">{filter === 'wrong' ? `直近${STUDY_LOG_DAYS}日にまちがえた問題はありません。` : `直近${STUDY_LOG_DAYS}日の記録はまだありません。演習や対戦をすると、ここに残ります。`}</p>
      ) : days.map(day => (
        <section key={day.date} className="sr-day" aria-label={day.label}>
          <h2>{day.label}<small>{day.solved}問・まちがい{day.wrong}問</small></h2>
          <ol>{day.entries.map(e => <EntryCard key={e.key} entry={e} onlyWrong={filter === 'wrong'} onRetry={onRetry} />)}</ol>
        </section>
      ))}
    </section>
  );
}

function EntryCard({ entry, onlyWrong, onRetry }: { entry: StudyLogEntry; onlyWrong: boolean; onRetry?: (t: StudyRetry) => void; key?: string }) {
  const wrongItems = entry.items.filter(i => !i.correct);
  const [open, setOpen] = useState(false);
  const shown = onlyWrong ? wrongItems : entry.items;
  const time = new Date(entry.at);
  return (
    <li className="sr-entry" data-kind={entry.kind} data-has-wrong={wrongItems.length > 0 || undefined}>
      <button type="button" className="sr-entry-main" onClick={() => setOpen(v => !v)} aria-expanded={open}>
        <span className="sr-entry-icon" aria-hidden="true">{entry.kind === 'battle' ? <Swords size={18} /> : <PenLine size={18} />}</span>
        <span className="sr-entry-text">
          <strong>{entry.title}</strong>
          <small>{entry.sub ? `${entry.sub}・` : ''}{String(time.getHours()).padStart(2, '0')}:{String(time.getMinutes()).padStart(2, '0')}</small>
          <span className="sr-marks" aria-label={`${entry.items.length}問中 まちがい${wrongItems.length}問`}>
            {entry.items.map(i => <i key={i.id} data-ok={i.correct || undefined} title={i.label}>{i.correct ? '○' : '×'}</i>)}
          </span>
        </span>
        <span className="sr-entry-score mo-rate"><ScoreRing rate={entry.items.length ? (entry.items.length - wrongItems.length) / entry.items.length : 0} size={20} stroke={4} tone={wrongItems.length === 0 ? 'done' : 'brand'} /><span>{entry.items.length - wrongItems.length}<small>/{entry.items.length}</small></span></span>
        <ChevronDown size={18} aria-hidden="true" className={open ? 'rotate-180' : ''} />
      </button>
      {/* ★解きなおしの2択（2026-10-11）★ 一人で学んだ大問だけ（対戦の問題は復習ノートから） */}
      {onRetry && entry.kind === 'study' && entry.chapterId && entry.questionId && (
        <div className="sr-retry" role="group" aria-label={`${entry.title} ${entry.sub ?? ''}を解きなおす`}>
          <button type="button" data-sr-retry="all" onClick={() => onRetry({ chapterId: entry.chapterId!, questionId: entry.questionId!, wrongOnly: false, subQuestionIds: [] })}>
            <Play size={16} aria-hidden="true" />解きなおす
          </button>
          <button type="button" data-sr-retry="wrong" disabled={wrongItems.length === 0}
            onClick={() => onRetry({ chapterId: entry.chapterId!, questionId: entry.questionId!, wrongOnly: true, subQuestionIds: wrongItems.map(i => i.id) })}>
            <RotateCcw size={16} aria-hidden="true" />{wrongItems.length > 0 ? <>まちがえた問題だけ解く<small>（{wrongItems.length}問）</small></> : '全問正解'}
          </button>
        </div>
      )}
      {open && (
        <ul className="sr-items">
          {shown.map(i => (
            <li key={i.id} data-ok={i.correct || undefined}>
              {i.correct ? <CheckCircle2 size={16} aria-hidden="true" /> : <XCircle size={16} aria-hidden="true" />}
              <span><b>{i.label}</b>{i.prompt && <span className="sr-prompt">{i.prompt}</span>}{!i.correct && i.answer ? <em>正解 {i.answer}</em> : null}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
