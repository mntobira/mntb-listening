import React from 'react';
import { ChevronDown, Headphones, RotateCcw, Play } from 'lucide-react';
import { UNIT_STATUS_LABEL, stripCircledNumber, type UnitStatus } from '../utils/unitStats';
import './unit-card.css';

/**
 * 単元カード（2026-09-30）。単元一覧（ChapterSelection）と「英文法・英単語を固める」の英文法タブで共通。
 *
 * ★UIの決まり（CLAUDE.md「UI principles」）★
 *   - 閉じた状態は 80〜100px。番号・単元名・状態・正答率・主ボタンだけを見せる。
 *   - 内容（扱う文法事項）と補助の操作（最初から／音源／解説）はタップで開く。
 *   - 主ボタンは1つだけ：途中保存があれば「続きから」、なければ「学習開始」。
 *     「最初から」は途中保存があるときだけ補助側に出す（同じ操作を2つ並べない）。
 */
export interface UnitCardProps {
  /** 0 始まりの通し番号（表示は 01.） */
  index: number;
  title: string;
  topics?: string[];
  questionCount: number;
  status: UnitStatus;
  /** 正答率（%）。記録が無ければ null */
  accuracy: number | null;
  hasSavedProgress: boolean;
  expanded: boolean;
  onToggle: () => void;
  onStart: () => void;
  onResume?: () => void;
  onAudio?: () => void;
  audioOpen?: boolean;
  /** 開いたときに下に出す追加の中身（問題を選ぶ・音源プレーヤーなど） */
  children?: React.ReactNode;
  accent?: string;
  /** 解き終えた大問・回の数（進行中に「X/Y問 進捗」を出す） */
  solvedCount?: number;
  /** 満点をとった回数（互換のため残す。一覧のラベルには「満点 0/3」は出さない） */
  perfects?: number;
  /** 状態の文字を差し替える（英文法の「達成 1/4回」など） */
  progressLabel?: string;
  /** D1：主ボタンの文字を差し替える（英文法の「第2回の続き」「第3回を始める」など。どこをやるかを明確にする） */
  primaryLabel?: string;
  /** D1：開いた中身を回の一覧だけにする（英文法：文法項目の箇条書き・「最初から」を出さない。一覧に同じ内容がある） */
  roundsMode?: boolean;
  /** D1：「演習 N 大問」の代わりに出す文字 */
  countLabel?: string;
}

export function UnitCard({ index, title, topics, questionCount, solvedCount, status, accuracy, hasSavedProgress, expanded, onToggle, onStart, onResume, onAudio, audioOpen, children, accent, progressLabel, primaryLabel, roundsMode, countLabel }: UnitCardProps) {
  const ready = questionCount > 0;
  const number = String(index + 1).padStart(2, '0');
  const name = stripCircledNumber(title);
  const panelId = `unit-card-panel-${number}`;
  const statusText = !ready
    ? '準備中'
    : progressLabel
    ? progressLabel
    : status === 'done'
    ? `全${questionCount}問 完了`
    : status === 'doing' && solvedCount !== undefined
    ? `${solvedCount}/${questionCount}問 完了`
    : questionCount > 0 && status === 'todo'
    ? `0/${questionCount}問`
    : UNIT_STATUS_LABEL[status];
  return (
    <article className="unit-card" data-status={status} data-expanded={expanded || undefined} data-empty={!ready || undefined}
      style={accent ? ({ '--unit-accent': accent } as React.CSSProperties) : undefined}>
      <div className="unit-card-row">
        <button type="button" className="unit-card-main" onClick={onToggle} aria-expanded={expanded} aria-controls={panelId}>
          <span className="unit-card-title"><b>{number}.</b> {name}</span>
          <span className="unit-card-meta">
            <span className="mt-status" data-status={status}>{statusText}</span>
            <span className="mt-meter unit-card-meter" data-status={status} aria-hidden="true"><i style={{ width: `${accuracy ?? 0}%` }} /></span>
            <span className="unit-card-acc">{accuracy === null ? '正答率 —' : `正答率 ${accuracy}%`}</span>
            <ChevronDown size={16} className="unit-card-chev" aria-hidden="true" />
          </span>
        </button>
        {ready && (
          <button type="button" className="unit-card-primary" onClick={hasSavedProgress && onResume ? onResume : onStart}>
            <Play size={15} aria-hidden="true" />{primaryLabel ?? (hasSavedProgress && onResume ? '続きから' : '学習開始')}
          </button>
        )}
      </div>
      {expanded && (
        <div className="unit-card-panel" id={panelId}>
          {!roundsMode && topics && topics.length > 0 && <ul className="unit-card-topics">{topics.map(t => <li key={t}>{t}</li>)}</ul>}
          {!roundsMode && <p className="unit-card-count">{ready ? countLabel ?? `演習 ${questionCount} 大問` : '問題を準備中です'}</p>}
          {ready && (onAudio || (!roundsMode && hasSavedProgress && onResume)) && (
            <div className="unit-card-secondary">
              {!roundsMode && hasSavedProgress && onResume && <button type="button" onClick={onStart}><RotateCcw size={15} aria-hidden="true" />最初から</button>}
              {onAudio && <button type="button" onClick={onAudio} aria-pressed={!!audioOpen} title="復習用の音源を聞く（問題を解かずに音声だけ再生）"><Headphones size={15} aria-hidden="true" />音源</button>}
            </div>
          )}
          {children}
        </div>
      )}
    </article>
  );
}
