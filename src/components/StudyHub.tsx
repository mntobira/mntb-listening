import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Trash2,
  Clock,
  Star,
  BookOpen,
  Sparkles,
  Flame,
  NotebookPen,
  ChevronDown,
  PenLine,
  TrendingUp,
} from 'lucide-react';
import { auth } from '../firebase';
import {
  getAllReviewItems,
  getDueReviewItems,
  createReviewActions,
  isMastered,
  groupReviewItems,
  type ReviewGroup,
  type ReviewItem,
} from '../utils/reviewList';
import { ForgettingCurveChart } from './ForgettingCurveChart';
import './review-note.css';
import { stripHtmlToText } from '../utils/sanitizeHtml';
import {
  ALL_SUBJECTS,
  filterBySubjectTab,
  formatDue,
  formatScope,
  retentionOf,
  subjectOfReviewItem,
  summarizeBySubject,
  summarizeQuestion,
  truncate,
  REVIEW_SUBJECT_LABELS,
  type SubjectTabId,
} from '../utils/reviewSubject';

/**
 * StudyHub — 「ノート」と「復習リスト」を1画面に統合した学習ハブ。
 *
 * 設計意図（なぜこの形にしたか）:
 *   - 従来はホームに「ノートを見る」「復習リスト」という2つの入口が並び、
 *     ユーザーは“復習すべきもの”を探すのに2画面を行き来していた。
 *   - この2機能は本質的に「復習ハブ」という同じゴールを持つが、性質が異なる:
 *       ・復習リスト = 誤答を自動キャプチャ + 忘却曲線(間隔反復)で自動スケジュール
 *       ・ノート    = 自分で保存したまとめ/メモ/重要マーク（手動キュレーション）
 *   - そこで「1つのハブ」に統合し、冒頭に “今日の復習” を自動提示（今やるべきことが一目でわかる）、
 *     その下でノートと復習項目を横断できるタブを用意した。
 *   - 自動(誤答)/手動(ノート)は色・アイコン・ラベルで視覚的に区別し、迷わず対象に到達できるようにした。
 *   - 忘却曲線の自動スケジュール（学習効率の要）は保持しつつ、入口だけを一本化する。
 */

export interface StudyHubView { tab: Tab; subjectTab: SubjectTabId }

interface StudyHubProps {
  view?: StudyHubView;
  onViewChange?: (view: StudyHubView) => void;
  onBack: () => void;
  isGuest: boolean;
  /** ノート詳細を開く（既存の NoteDetail 画面へ） */
  onSelectNote: (note: any) => void;
  /** 復習アイテム／ノートから、対応する演習問題へ直接遷移する（要件5） */
  onReview?: (target: any) => void;
  /** 復習が空のときの「演習する」 */
  onPractice?: () => void;
}

type Tab = 'today' | 'notes' | 'important' | 'all';

// ============================================================
// 表示用の小道具
// ============================================================

// 一覧のプレビュー用にHTMLタグを落としてテキストだけにする。
//
// ★以前は innerHTML に代入して textContent を読み出していた★
//   <script> は実行されないが、<img src=x onerror=...> は
//   HTMLの解析時に読み込みが走り onerror が発火し得る。
//   DOMを一切作らない共通実装に統一した。
const stripHtml = stripHtmlToText;

// truncate / formatDue は復習リスト画面（ReviewList.tsx）と同じ表示に
// しなければならないので、utils/reviewSubject.ts の1つだけを使う
// （以前はここにも同じ実装があった）。

// ============================================================
// 復習アイテム（1行 → タップで展開）2026-09-30 作り直し
// ============================================================
//
// ■ 何を直したか
//   以前は「ピンクの箱の中に白いカード」（入れ子）で、1枚ごとに大きな
//   「解き直す」ボタンがあり、スマホでは2件しか見えなかった。
//   文字も 10px が11種類あった。
// ■ いまの形
//   ・1件＝1行（区切り線だけ）。1画面に4〜5件見える。
//   ・行の右端に「解く」（44px の丸ボタン）。押せばすぐその問題へ。
//   ・行本体を押すと、正答とあなたの解答・自己評価・削除が開く。
//   ・状態は色つきの小さな印 1つ（期限切れ＝オレンジ／予定＝灰／習得＝緑）。

interface ReviewCardProps {
  item: ReviewItem;
  now: number;
  onCorrect: (key: string) => void;
  onWrong: (key: string) => void;
  onRemove: (key: string) => void;
  onReview?: (item: ReviewItem) => void;
  /** 科目名を出すか（「すべて」のときだけ出す） */
  showSubject?: boolean;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ item, now, onCorrect, onWrong, onRemove, onReview, showSubject = false }) => {
  const [open, setOpen] = useState(false);
  const due = item.dueAt <= now;
  const mastered = isMastered(item);
  const retention = Math.round(retentionOf(item) * 100);
  const subject = subjectOfReviewItem(item);
  const detailId = `review-detail-${item.key}`;
  const status = mastered ? 'done' : due ? 'doing' : 'todo';
  const summary = summarizeQuestion(item.questionText);

  return (
    <li className="rn-item" data-status={status} data-open={open || undefined}>
      <div className="rn-item-row">
        <button type="button" className="rn-item-main" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-controls={detailId}>
          <span className="rn-item-scope">
            {showSubject && subject !== 'other' && <b>{REVIEW_SUBJECT_LABELS[subject]}</b>}
            <span>{formatScope(item)}</span>
          </span>
          <span className="rn-item-q">{summary || '（問題文なし）'}</span>
          <span className="rn-item-meta">
            <span className="mt-status" data-status={status}>{mastered ? '習得済み' : due ? '今日やる' : formatDue(item.dueAt, now)}</span>
            {item.wrongCount >= 2 && !mastered && <span className="rn-weak"><Flame size={13} aria-hidden="true" />{item.wrongCount}回ミス</span>}
            <span className="rn-retention" aria-label={`定着度 ${retention}%`}>
              <span className="mt-meter" data-status={mastered ? 'done' : undefined} aria-hidden="true"><i style={{ width: `${Math.max(retention, 4)}%` }} /></span>
              {retention}%
            </span>
          </span>
        </button>
        {onReview && (
          <button type="button" className="rn-item-solve" onClick={() => onReview(item)} aria-label={`答えを見ずに解き直す：${formatScope(item)}`}>
            <RotateCcw size={18} aria-hidden="true" /><span>解く</span>
          </button>
        )}
      </div>

      {open && (
        <div id={detailId} className="rn-item-detail">
          {(item.correctAnswer || item.lastWrongAnswer) && (
            <dl className="rn-answers">
              {item.lastWrongAnswer && <div data-kind="wrong"><dt>あなたの解答</dt><dd className="font-math">{item.lastWrongAnswer}</dd></div>}
              {item.correctAnswer && <div data-kind="right"><dt>正答</dt><dd className="font-math">{item.correctAnswer}</dd></div>}
            </dl>
          )}
          {item.questionText && stripHtml(item.questionText) !== summary && (
            <p className="rn-item-full">{stripHtml(item.questionText)}</p>
          )}
          <p className="rn-item-stats"><Clock size={13} aria-hidden="true" />{formatDue(item.dueAt, now)} ・ 間違い {item.wrongCount}回 ・ 復習正解 {item.correctCount}回</p>
          <div className="rn-item-actions" role="group" aria-label="答えを確認したあとの自己評価">
            <button type="button" className="mt-btn mt-btn-primary" onClick={() => onCorrect(item.key)} aria-label="復習で正解にする"><CheckCircle2 size={16} aria-hidden="true" />できた</button>
            <button type="button" className="mt-btn mt-btn-secondary" onClick={() => onWrong(item.key)} aria-label="復習でまだ苦手にする"><RotateCcw size={16} aria-hidden="true" />まだ苦手</button>
            <button type="button" className="mt-btn mt-btn-text rn-remove" onClick={() => onRemove(item.key)} aria-label="復習リストから削除"><Trash2 size={16} aria-hidden="true" />削除</button>
          </div>
        </div>
      )}
    </li>
  );
};

// ============================================================
// 問題ごとのカード（2026-10-04 ご要望）
//   同じ大問で間違えた小問を1枚にまとめ、「解く」は間違えた小問だけを出す
// ============================================================

const GroupCard: React.FC<Omit<ReviewCardProps, 'item' | 'onReview'> & { group: ReviewGroup; onReview?: (target: any) => void }> = ({ group, now, onCorrect, onWrong, onRemove, onReview, showSubject = false }) => {
  const [open, setOpen] = useState(false);
  const head = group.items[0];
  if (group.items.length === 1) return <ReviewCard item={head} now={now} onCorrect={onCorrect} onWrong={onWrong} onRemove={onRemove} showSubject={showSubject}
    onReview={onReview ? () => onReview({ ...head, subQuestionIds: group.subQuestionIds }) : undefined} />;
  const due = group.dueAt <= now;
  const mastered = group.items.every(isMastered);
  const status = mastered ? 'done' : due ? 'doing' : 'todo';
  const subject = subjectOfReviewItem(head);
  const labels = group.items.map((it, i) => (String(it.subLabel || '').match(/問\s*\d+/u)?.[0] ?? `(${i + 1})`).replace(/\s+/g, ''));
  const detailId = `review-group-${group.key}`;
  return (
    <li className="rn-item rn-group" data-status={status} data-open={open || undefined} data-review-group>
      <div className="rn-item-row">
        <button type="button" className="rn-item-main" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-controls={detailId}>
          <span className="rn-item-scope">
            {showSubject && subject !== 'other' && <b>{REVIEW_SUBJECT_LABELS[subject]}</b>}
            <span>{formatScope(head)}</span>
          </span>
          <span className="rn-group-chips" aria-label={`間違えた問題 ${labels.join('・')}`}>
            {labels.map((l, i) => <span key={i} data-mastered={isMastered(group.items[i]) || undefined}>{l}</span>)}
            <small>の{group.items.length}問だけ</small>
          </span>
          <span className="rn-item-meta">
            <span className="mt-status" data-status={status}>{mastered ? '習得済み' : due ? '今日やる' : formatDue(group.dueAt, now)}</span>
            {group.wrongCount >= 2 && !mastered && <span className="rn-weak"><Flame size={13} aria-hidden="true" />{group.wrongCount}回ミス</span>}
          </span>
        </button>
        {onReview && (
          <button type="button" className="rn-item-solve" onClick={() => onReview({ ...head, subQuestionIds: group.subQuestionIds })} aria-label={`間違えた${group.items.length}問だけ解き直す：${formatScope(head)}`}>
            <RotateCcw size={18} aria-hidden="true" /><span>解く</span>
          </button>
        )}
      </div>
      {open && (
        <ul id={detailId} className="rn-group-detail">
          {group.items.map((it, i) => (
            <li key={it.key}>
              <p className="rn-group-label"><b>{labels[i]}</b>{summarizeQuestion(it.subLabel?.replace(/^問\s*\d+\s*/u, '') || '', 30)}</p>
              {(it.correctAnswer || it.lastWrongAnswer) && (
                <dl className="rn-answers">
                  {it.lastWrongAnswer && <div data-kind="wrong"><dt>あなたの解答</dt><dd className="font-math">{it.lastWrongAnswer}</dd></div>}
                  {it.correctAnswer && <div data-kind="right"><dt>正答</dt><dd className="font-math">{it.correctAnswer}</dd></div>}
                </dl>
              )}
              <div className="rn-item-actions" role="group" aria-label={`${labels[i]}の自己評価`}>
                <button type="button" className="mt-btn mt-btn-primary" onClick={() => onCorrect(it.key)}><CheckCircle2 size={16} aria-hidden="true" />できた</button>
                <button type="button" className="mt-btn mt-btn-secondary" onClick={() => onWrong(it.key)}><RotateCcw size={16} aria-hidden="true" />まだ苦手</button>
                <button type="button" className="mt-btn mt-btn-text rn-remove" onClick={() => onRemove(it.key)} aria-label={`${labels[i]}を復習リストから削除`}><Trash2 size={16} aria-hidden="true" />削除</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

// ============================================================
// 「もっと見る」で展開する復習リスト
// ============================================================

interface CollapsibleReviewListProps {
  items: ReviewItem[];
  now: number;
  onCorrect: (key: string) => void;
  onWrong: (key: string) => void;
  onRemove: (key: string) => void;
  onReview?: (item: ReviewItem) => void;
  showSubject?: boolean;
  /** 最初に見せる件数（1行表示にしたので既定6件） */
  initialCount?: number;
}

const CollapsibleReviewList: React.FC<CollapsibleReviewListProps> = ({ items, now, onCorrect, onWrong, onRemove, onReview, showSubject = false, initialCount = 6 }) => {
  const [expanded, setExpanded] = useState(false);
  const groups = useMemo(() => groupReviewItems(items), [items]);
  const hasMore = groups.length > initialCount;
  const visible = expanded || !hasMore ? groups : groups.slice(0, initialCount);
  const hiddenCount = groups.length - visible.length;
  return (
    <>
      <ul className="rn-list">
        {visible.map(g => <GroupCard key={g.key} group={g} now={now} onCorrect={onCorrect} onWrong={onWrong} onRemove={onRemove} onReview={onReview} showSubject={showSubject} />)}
      </ul>
      {hasMore && (
        <button type="button" className="rn-more" onClick={() => setExpanded(v => !v)} aria-expanded={expanded}>
          {expanded ? '表示を減らす' : `もっと見る（あと${hiddenCount}件）`}<ChevronDown size={16} aria-hidden="true" style={{ transform: expanded ? 'rotate(180deg)' : undefined }} />
        </button>
      )}
    </>
  );
};

// ============================================================
// ノート（手動で保存したまとめ）
// ============================================================

const NoteCard: React.FC<{ note: any; onSelect: (note: any) => void }> = ({ note, onSelect }) => (
  <li className="rn-item rn-note">
    <button type="button" className="rn-item-main" onClick={() => onSelect(note)} aria-label={`ノートを開く：${truncate(stripHtml(note.question) || '問題文なし', 70)}`}>
      <span className="rn-item-scope">
        <b><NotebookPen size={13} aria-hidden="true" />ノート</b>
        {note.chapterTitle && <span>{note.chapterTitle}{note.questionIndex ? ` 第${note.questionIndex}問` : ''}</span>}
        {note.isImportant && <span className="rn-star"><Star size={13} fill="currentColor" aria-hidden="true" />重要</span>}
      </span>
      <span className="rn-item-q">{truncate(stripHtml(note.question) || '（問題文なし）', 70)}</span>
      <span className="rn-note-memo">{note.memo ? truncate(note.memo, 60) : 'メモなし'}</span>
      {note.tags && note.tags.length > 0 && (
        <span className="rn-tags">{note.tags.slice(0, 3).map((tag: string) => <span key={tag}>#{tag}</span>)}{note.tags.length > 3 && <span>+{note.tags.length - 3}</span>}</span>
      )}
    </button>
  </li>
);

// ============================================================
// メイン
// ============================================================

export function StudyHub({ onBack, isGuest, onSelectNote, onReview, onPractice, view, onViewChange }: StudyHubProps) {
  const uid = auth.currentUser?.uid || (isGuest ? 'guest' : null);

  const [reviewItems, setReviewItems] = useState<ReviewItem[]>(() => getAllReviewItems(uid));
  const [notes, setNotes] = useState<any[]>([]);
  const [tab, setTab] = useState<Tab>(view?.tab ?? 'today');
  const [now, setNow] = useState(() => Date.now());

  const loadNotes = () => {
    try {
      const raw = localStorage.getItem(`notes_${uid || 'guest'}`);
      const list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) return [];
      // 重要 → 新しい順
      list.sort((a: any, b: any) => {
        if (!!a.isImportant !== !!b.isImportant) return (b.isImportant ? 1 : 0) - (a.isImportant ? 1 : 0);
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      return list;
    } catch {
      return [];
    }
  };

  const refresh = () => {
    setNow(Date.now());
    setReviewItems(getAllReviewItems(uid));
    setNotes(loadNotes());
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 科目の一覧は「実際に復習アイテムがある科目」だけから作る（空の科目タブを出さない）。
  const subjectSummaries = useMemo(() => summarizeBySubject(reviewItems, now), [reviewItems, now]);
  const [subjectTab, setSubjectTab] = useState<SubjectTabId>(view?.subjectTab ?? ALL_SUBJECTS);
  useEffect(() => { onViewChange?.({ tab, subjectTab }); }, [tab, subjectTab, onViewChange]);
  useEffect(() => {
    if (subjectTab === ALL_SUBJECTS) return;
    if (!subjectSummaries.some((s) => s.subject === subjectTab)) setSubjectTab(ALL_SUBJECTS);
  }, [subjectSummaries, subjectTab]);

  const scopedItems = useMemo(() => filterBySubjectTab(reviewItems, subjectTab), [reviewItems, subjectTab]);
  const scopedDueItems = useMemo(
    () => scopedItems.filter((it) => it.dueAt <= now).sort((a, b) => a.dueAt - b.dueAt || b.wrongCount - a.wrongCount),
    [scopedItems, now]
  );
  /** 「苦手リスト」は期限の近い順 → 習得済みは最後 */
  const sortedScopedItems = useMemo(
    () => [...scopedItems].sort((a, b) => Number(isMastered(a)) - Number(isMastered(b)) || a.dueAt - b.dueAt),
    [scopedItems]
  );
  const scopedSubjectLabel = subjectTab === ALL_SUBJECTS ? undefined : REVIEW_SUBJECT_LABELS[subjectTab];

  const dueItems = useMemo(() => getDueReviewItems(uid, now), [reviewItems, now, uid]);
  const masteredCount = useMemo(() => reviewItems.filter(isMastered).length, [reviewItems]);
  const weakCount = useMemo(() => dueItems.filter(it => it.wrongCount >= 2).length, [dueItems]);
  const importantNotes = useMemo(() => notes.filter((n) => n.isImportant), [notes]);
  const masteredPercent = reviewItems.length > 0 ? Math.round(masteredCount / reviewItems.length * 100) : 0;
  const nextUpcoming = useMemo(() => reviewItems.filter(it => it.dueAt > now && !isMastered(it)).sort((a, b) => a.dueAt - b.dueAt)[0], [reviewItems, now]);

  const { handleCorrect, handleWrong, handleRemove } = createReviewActions(uid, refresh);

  // 旧タブIDはそのまま（App 側が view を覚えているため）。'all' は「苦手リスト（全件）」として出す。
  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'today', label: '今日', count: scopedDueItems.length },
    { id: 'all', label: '苦手リスト', count: scopedItems.length },
    { id: 'notes', label: 'ノート', count: notes.length },
    { id: 'important', label: '重要', count: importantNotes.length },
  ];
  const showSubjectFilter = (tab === 'today' || tab === 'all') && subjectSummaries.length > 1;
  const first = scopedDueItems[0];

  return (
    <div className="review-note" data-review-note>
      <div className="rn-wrap">
        {/* ヘッダー：1行。説明文は置かない（画面を見れば分かる） */}
        <header className="rn-header">
          <button type="button" onClick={onBack} aria-label="ホームに戻る" className="rn-back"><ArrowLeft size={20} aria-hidden="true" /></button>
          <h1>復習ノート</h1>
          <span className="rn-header-stat" aria-label={`習得済み ${masteredCount}問`}><CheckCircle2 size={16} aria-hidden="true" />習得 {masteredCount}</span>
        </header>

        {/* 今日の復習：数字1つ＋主ボタン1つ */}
        <section className="rn-hero" aria-labelledby="rn-hero-title" data-empty={dueItems.length === 0 || undefined}>
          <div className="rn-hero-count">
            <p id="rn-hero-title">今日の復習</p>
            <strong>{dueItems.length}<small>問</small></strong>
          </div>
          <div className="rn-hero-side">
            {dueItems.length > 0 ? (
              <p>{weakCount > 0 ? <><Flame size={14} aria-hidden="true" />2回以上ミスした問題 {weakCount}問</> : '忘れかけたころが、いちばん覚えられるタイミング。'}</p>
            ) : (
              <p>{nextUpcoming ? `次の復習は${formatDue(nextUpcoming.dueAt, now)}。` : reviewItems.length === 0 ? '間違えた問題が、ここに自動で集まります。' : '今日の分は完了。'}</p>
            )}
            <div className="rn-hero-meter">
              <span className="mt-meter" data-status="done" role="progressbar" aria-label="習得済みの割合" aria-valuemin={0} aria-valuemax={100} aria-valuenow={masteredPercent}><i style={{ width: `${masteredPercent}%` }} /></span>
              <small>習得 {masteredCount} / {reviewItems.length}</small>
            </div>
          </div>
          {first && onReview ? (
            <button type="button" className="mt-btn mt-btn-accent rn-hero-cta" onClick={() => { const g = groupReviewItems(scopedDueItems).find(x => x.key === `${first.chapterId}::${first.questionId}`); onReview({ ...first, subQuestionIds: g?.subQuestionIds ?? [first.subQuestionId] }); }}>
              <RotateCcw size={18} aria-hidden="true" />
              <span><strong>復習を始める</strong><small>1問目：{formatScope(first)}</small></span>
            </button>
          ) : onPractice ? (
            <button type="button" className="mt-btn mt-btn-secondary rn-hero-cta" onClick={onPractice}>
              <PenLine size={18} aria-hidden="true" /><span><strong>演習で新しく解く</strong></span>
            </button>
          ) : null}
        </section>

        {/* 表示切替：1本のセグメント（横スクロールしない） */}
        <div className="mt-segment rn-tabs" role="tablist" aria-label="復習ノートの表示切替">
          {tabs.map(t => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}<span className="rn-tab-count">{t.count}</span>
            </button>
          ))}
        </div>

        {showSubjectFilter && (
          <div className="rn-subjects" role="group" aria-label="科目で絞り込む">
            {[{ id: ALL_SUBJECTS as SubjectTabId, label: 'すべて', total: reviewItems.length }, ...subjectSummaries.map(s => ({ id: s.subject as SubjectTabId, label: s.shortLabel, total: s.total }))].map(t => (
              <button key={t.id} type="button" aria-pressed={subjectTab === t.id} onClick={() => setSubjectTab(t.id)}>{t.label}<span>{t.total}</span></button>
            ))}
          </div>
        )}

        <div className="rn-panel" role="tabpanel">
          {tab === 'today' && (scopedDueItems.length === 0
            ? <EmptyState icon={<CheckCircle2 size={28} aria-hidden="true" />} title={scopedSubjectLabel ? `${scopedSubjectLabel}の今日の復習は完了` : '今日の復習は完了'} desc="問題を解いて間違えると、ここに自動で追加されます。" action={onPractice && (first && onReview) ? { label: '演習する', onClick: onPractice } : undefined} />
            : <CollapsibleReviewList items={scopedDueItems} now={now} onCorrect={handleCorrect} onWrong={handleWrong} onRemove={handleRemove} onReview={onReview} showSubject={subjectTab === ALL_SUBJECTS} />)}

          {tab === 'all' && (sortedScopedItems.length === 0
            ? <EmptyState icon={<Sparkles size={28} aria-hidden="true" />} title="苦手はまだありません" desc="間違えた問題は、忘却曲線にそって自動で並びます。" action={onPractice && (first && onReview) ? { label: '演習する', onClick: onPractice } : undefined} />
            : <CollapsibleReviewList items={sortedScopedItems} now={now} onCorrect={handleCorrect} onWrong={handleWrong} onRemove={handleRemove} onReview={onReview} showSubject={subjectTab === ALL_SUBJECTS} />)}

          {tab === 'notes' && (notes.length === 0
            ? <EmptyState icon={<BookOpen size={28} aria-hidden="true" />} title="ノートはまだありません" desc="解説ページの「ノートに保存」から、まとめを追加できます。" />
            : <ul className="rn-list">{notes.map(n => <NoteCard key={n.id} note={n} onSelect={onSelectNote} />)}</ul>)}

          {tab === 'important' && (importantNotes.length === 0
            ? <EmptyState icon={<Star size={28} aria-hidden="true" />} title="重要マークのノートはありません" desc="ノート詳細で「重要」をつけると、ここに集まります。" />
            : <ul className="rn-list">{importantNotes.map(n => <NoteCard key={n.id} note={n} onSelect={onSelectNote} />)}</ul>)}
        </div>

        {(tab === 'today' || tab === 'all') && scopedItems.length > 0 && (
          <details className="rn-chart">
            <summary><TrendingUp size={16} aria-hidden="true" />定着のグラフを見る<ChevronDown size={16} aria-hidden="true" /></summary>
            <ForgettingCurveChart items={scopedItems} now={now} subjectLabel={scopedSubjectLabel} />
          </details>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, desc, action }: { icon: React.ReactNode; title: string; desc: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="rn-empty">
      <span className="rn-empty-icon">{icon}</span>
      <p className="rn-empty-title">{title}</p>
      <p className="rn-empty-desc">{desc}</p>
      {action && <button type="button" className="mt-btn mt-btn-secondary" onClick={action.onClick}><PenLine size={16} aria-hidden="true" />{action.label}</button>}
    </div>
  );
}
