import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, TrendingUp } from 'lucide-react';
import {
  computeUnseenTrajectoriesFromSummary,
  computeWeeklyVolume,
  evaluateRetentionForDays,
  loadOutcomesStore,
  toSyncedOutcomesSummary,
} from '../utils/learningOutcomes';
import { collectStudyDays } from '../utils/studyPeriods';
import { readSolvedMap } from '../utils/progress';
import { loadReviewList } from '../utils/reviewList';
import { USER_DATA_SYNCED_EVENT } from '../utils/userDataSyncEvent';

/**
 * 個人の「学習の伸び・定着（成果指標）」カード（StudyRecord 上部）
 *   - 週の解答数（直近7日・先週比）
 *   - 対戦→復習・演習への転換率
 *   - D7 / D30 継続ステータス
 *   - 形式別の「未見問題」正答率推移（初回10問 → 直近20問）
 */
export function PersonalOutcomesCard({ uid }: { uid: string }) {
  const [tick, setTick] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener(USER_DATA_SYNCED_EVENT, bump);
    window.addEventListener('review-list-changed', bump);
    return () => {
      window.removeEventListener(USER_DATA_SYNCED_EVENT, bump);
      window.removeEventListener('review-list-changed', bump);
    };
  }, []);

  const data = useMemo(() => {
    const store = loadOutcomesStore(uid);
    const summary = toSyncedOutcomesSummary(store);
    const baseDays = collectStudyDays(readSolvedMap(uid), loadReviewList(uid));
    const allDays = [...new Set([...baseDays, ...Object.keys(summary.daily)])].sort();
    const retention = evaluateRetentionForDays(allDays, summary.firstDay);
    const weekly = computeWeeklyVolume(summary.daily);
    const trajectories = computeUnseenTrajectoriesFromSummary(summary);
    const battlePct = summary.battles.total > 0
      ? Math.round((summary.battles.converted / summary.battles.total) * 100)
      : null;
    return { summary, retention, weekly, trajectories, battlePct };
    // tick は同期完了・復習追加イベントの再読込トリガ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, tick]);

  const { summary, retention, weekly, trajectories, battlePct } = data;
  const hasAnyOutcome =
    weekly.last7Days > 0 ||
    weekly.prev7Days > 0 ||
    summary.battles.total > 0 ||
    trajectories.length > 0 ||
    retention.firstDay !== null;

  if (!hasAnyOutcome) return null;

  const continuityLabel = retention.d30Eligible
    ? retention.d30Retained ? '30日後も継続中' : `開始から${retention.daysSinceStart}日`
    : retention.d7Eligible
    ? retention.d7Retained ? '7日後も継続中' : `開始から${retention.daysSinceStart}日`
    : `開始${retention.daysSinceStart + 1}日目`;

  return (
    <section className="sr-outcomes" aria-label="学習の伸びと定着" data-personal-outcomes>
      <div className="sr-outcomes-top">
        <span className="sr-outcomes-title">
          <TrendingUp size={16} aria-hidden="true" />
          <strong>今週の伸び・定着</strong>
          <small>{continuityLabel}</small>
        </span>
        {trajectories.length > 0 && (
          <button
            type="button"
            className="sr-outcomes-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            <span>初見の正答率推移</span>
            <ChevronDown size={15} aria-hidden="true" className={open ? 'rotate-180' : ''} />
          </button>
        )}
      </div>

      <div className="sr-outcomes-kpis">
        <div className="sr-outcomes-kpi">
          <span>直近7日の解答</span>
          <strong>{weekly.last7Days}<small>問</small></strong>
          <em>先週 {weekly.prev7Days}問</em>
        </div>
        <div className="sr-outcomes-kpi">
          <span>対戦→復習・演習</span>
          <strong>{battlePct !== null ? `${battlePct}` : '—'}{battlePct !== null && <small>%</small>}</strong>
          <em>{summary.battles.converted}/{summary.battles.total}試合</em>
        </div>
        <div className="sr-outcomes-kpi">
          <span>初見の直近正答率</span>
          <strong>
            {trajectories[0] ? `${trajectories[0].recentRatePct}` : '—'}
            {trajectories[0] && <small>%</small>}
          </strong>
          <em>
            {trajectories[0]
              ? trajectories[0].deltaPt !== null
                ? `初回比 ${trajectories[0].deltaPt >= 0 ? `+${trajectories[0].deltaPt}` : trajectories[0].deltaPt}pt`
                : `初見 ${trajectories[0].totalUnseen}問`
              : '演習で計測'}
          </em>
        </div>
      </div>

      {open && trajectories.length > 0 && (
        <ul className="sr-outcomes-formats" aria-label="形式ごとの未見問題正答率推移">
          {trajectories.map((row) => (
            <li key={row.format}>
              <div className="sr-outcomes-fmt-head">
                <strong>{row.label}</strong>
                <span>
                  初回 {row.initialRatePct}% → <b>直近 {row.recentRatePct}%</b>
                  {row.deltaPt !== null && (
                    <em data-up={row.deltaPt >= 0 || undefined}>
                      {row.deltaPt > 0 ? `+${row.deltaPt}` : row.deltaPt}pt
                    </em>
                  )}
                </span>
              </div>
              <small>初見問題 {row.totalUnseen}問（解き直しを除いた実力の推移）</small>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
