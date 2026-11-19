import { useMemo } from 'react';
import { Download, RefreshCw, TrendingUp, Swords, CalendarCheck2, Sparkles, Info } from 'lucide-react';
import {
  aggregateClassOutcomes,
  type StudentOutcomeRow,
  type UnseenTrajectoryRow,
} from '../../utils/learningOutcomes';
import type { ClassroomDoc } from '../../utils/classroomCore';
import type { StudentSummary } from '../../utils/studySummary';
import type { ThemeShape } from './teacherTheme';

interface OutcomesTabProps {
  students: StudentSummary[];
  loading: boolean;
  theme: ThemeShape;
  activeClass: ClassroomDoc | null;
  onRefresh: () => void;
  onExportCsv: (rows: readonly StudentOutcomeRow[]) => void;
}

function TrajectoryBar({ pct, tone = 'brand' }: { pct: number; tone?: 'brand' | 'muted' | 'done' }) {
  const fill = tone === 'done' ? '#2F7A52' : tone === 'muted' ? '#B8A88E' : '#C8781F';
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <svg viewBox="0 0 100 8" className="w-full h-2 rounded-full overflow-hidden" aria-hidden="true" preserveAspectRatio="none">
      <rect x="0" y="0" width="100" height="8" rx="4" fill="#EFE7D8" />
      {clamped > 0 && <rect x="0" y="0" width={clamped} height="8" rx="4" fill={fill} />}
    </svg>
  );
}

function BinsSpark({ bins }: { bins: number[] }) {
  if (bins.length === 0) return null;
  const step = 100 / Math.max(1, bins.length);
  const gap = Math.min(2, step * 0.2);
  const barW = Math.max(2, step - gap);
  return (
    <svg viewBox="0 0 100 28" className="w-28 h-7 shrink-0" aria-label={`10問ごとの正答率推移: ${bins.map((b) => `${b}%`).join(' → ')}`}>
      {bins.map((pct, i) => {
        const h = Math.max(3, Math.round((pct / 100) * 26));
        const isLast = i === bins.length - 1;
        return (
          <rect
            key={i}
            x={i * step + gap / 2}
            y={28 - h}
            width={barW}
            height={h}
            rx="1.5"
            fill={isLast ? '#2F7A52' : '#D5C5AA'}
          />
        );
      })}
    </svg>
  );
}

function RetentionBadge({ eligible, retained, label }: { eligible: boolean; retained: boolean; label: string }) {
  if (!eligible) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#F5EFE3] text-[#7A6B56] text-xs font-medium">{label}: 期間未達</span>;
  }
  return retained ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#E6F4EC] text-[#236B43] text-xs font-bold">{label}: 継続</span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FDECEA] text-[#96342B] text-xs font-bold">{label}: 離脱</span>
  );
}

function FormatRow({ row }: { row: UnseenTrajectoryRow; key?: string | number }) {
  return (
    <div className="rounded-xl border border-[#EAE0CF] bg-white p-3.5 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-[#1B2631]">{row.label}</p>
          <p className="text-xs text-[#6E604C]">
            初見累計 {row.totalUnseen}問（全体正答率 {row.overallRatePct}%）
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BinsSpark bins={row.binRatesPct} />
          {row.deltaPt !== null ? (
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums ${
                row.deltaPt > 0
                  ? 'bg-[#E6F4EC] text-[#236B43]'
                  : row.deltaPt < 0
                  ? 'bg-[#FDECEA] text-[#96342B]'
                  : 'bg-[#F4EFE4] text-[#5C4F3D]'
              }`}
            >
              {row.deltaPt > 0 ? `+${row.deltaPt}` : row.deltaPt}pt
            </span>
          ) : (
            <span className="px-2 py-1 rounded-lg bg-[#F5EFE3] text-[#6E604C] text-xs">計測中（11問〜比較）</span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        <div className="space-y-1">
          <div className="flex justify-between text-[#5C4F3D]">
            <span>初回 {row.initialCount}問（基準）</span>
            <strong className="tabular-nums text-[#1B2631]">{row.initialRatePct}%</strong>
          </div>
          <TrajectoryBar pct={row.initialRatePct} tone="muted" />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[#5C4F3D]">
            <span>直近 {row.recentCount}問（現在）</span>
            <strong className="tabular-nums text-[#236B43]">{row.recentRatePct}%</strong>
          </div>
          <TrajectoryBar pct={row.recentRatePct} tone="done" />
        </div>
      </div>
    </div>
  );
}

export function OutcomesTab({ students, loading, activeClass, onRefresh, onExportCsv }: OutcomesTabProps) {
  const agg = useMemo(
    () =>
      aggregateClassOutcomes(
        students.map((s) => ({
          uid: s.uid,
          displayName: s.displayName,
          studyDays: s.studyDays ?? (s.lastStudiedAt ? [s.lastStudiedAt] : []),
          outcomes: s.outcomes ?? null,
        })),
      ),
    [students],
  );

  const weekLabels = ['3週前', '2週前', '先週', '今週'];
  const maxWeekVal = Math.max(1, ...agg.fourWeeksAvgPerMember);

  return (
    <div className="space-y-4" data-teacher-outcomes>
      {/* ヘッダー操作バー */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-[#1B2631]">
            学習成果・定着指標{activeClass ? `（${activeClass.className}）` : ''}
          </h2>
          <p className="text-xs text-[#6E604C]">
            継続率・週あたり解答数・対戦からの復習転換・未見問題の正答率推移を実データで集計します
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex min-h-[44px] items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm border border-[#DFD2BC] bg-[#FFFDF8] text-[#3F3527] shadow-[0_2px_0_#E5D9C4] hover:bg-[#FAF6EC] active:translate-y-[1.5px] active:shadow-none transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            更新
          </button>
          <button
            type="button"
            onClick={() => onExportCsv(agg.students)}
            disabled={agg.students.length === 0}
            className="flex min-h-[44px] items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold text-white bg-[#2C4A63] shadow-[0_2.5px_0_#1D3244] hover:bg-[#243E54] active:translate-y-[1.5px] active:shadow-none transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            成果指標CSVで出す
          </button>
        </div>
      </div>

      {/* 4つの主要KPIカード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#FFFDF8] rounded-2xl border border-[#E5DCCC] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_2px_0_#E6DCCB]">
          <p className="flex items-center gap-1.5 text-xs font-bold text-[#6E604C] mb-1">
            <CalendarCheck2 className="w-4 h-4 text-[#2F7A52]" />
            7日後 継続率（D7）
          </p>
          <p className="text-2xl font-bold tabular-nums text-[#1B2631]">
            {agg.d7.ratePct !== null ? `${agg.d7.ratePct}%` : '—'}
          </p>
          <p className="text-xs text-[#6E604C] mt-1">
            対象 {agg.d7.eligible}人中 {agg.d7.retained}人が7〜13日後に学習
          </p>
        </div>

        <div className="bg-[#FFFDF8] rounded-2xl border border-[#E5DCCC] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_2px_0_#E6DCCB]">
          <p className="flex items-center gap-1.5 text-xs font-bold text-[#6E604C] mb-1">
            <CalendarCheck2 className="w-4 h-4 text-[#2C5E8A]" />
            30日後 継続率（D30）
          </p>
          <p className="text-2xl font-bold tabular-nums text-[#1B2631]">
            {agg.d30.ratePct !== null ? `${agg.d30.ratePct}%` : '—'}
          </p>
          <p className="text-xs text-[#6E604C] mt-1">
            対象 {agg.d30.eligible}人中 {agg.d30.retained}人が30〜36日後に学習
          </p>
        </div>

        <div className="bg-[#FFFDF8] rounded-2xl border border-[#E5DCCC] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_2px_0_#E6DCCB]">
          <p className="flex items-center gap-1.5 text-xs font-bold text-[#6E604C] mb-1">
            <Sparkles className="w-4 h-4 text-[#C8781F]" />
            1人あたり週の解答数
          </p>
          <p className="text-2xl font-bold tabular-nums text-[#1B2631]">
            {agg.weeklyAnswersPerMember}
            <span className="text-sm font-bold text-[#5C4F3D] ml-1">問 / 週</span>
          </p>
          <p className="text-xs text-[#6E604C] mt-1">
            学習者平均 {agg.weeklyAnswersPerActive}問（今週稼働 {agg.activeMembersIn7d}人）
          </p>
        </div>

        <div className="bg-[#FFFDF8] rounded-2xl border border-[#E5DCCC] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_2px_0_#E6DCCB]">
          <p className="flex items-center gap-1.5 text-xs font-bold text-[#6E604C] mb-1">
            <Swords className="w-4 h-4 text-[#B84534]" />
            対戦→復習・演習 転換率
          </p>
          <p className="text-2xl font-bold tabular-nums text-[#1B2631]">
            {agg.battleConversion.ratePct !== null ? `${agg.battleConversion.ratePct}%` : '—'}
          </p>
          <p className="text-xs text-[#6E604C] mt-1">
            {agg.battleConversion.battles}試合中 {agg.battleConversion.converted}回（復習{agg.battleConversion.toReview}・演習{agg.battleConversion.toPractice}）
          </p>
        </div>
      </div>

      {/* 直近4週間の1人あたり解答数推移 */}
      <div className="bg-[#FFFDF8] rounded-2xl border border-[#E5DCCC] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_2px_0_#E6DCCB]">
        <h3 className="text-sm font-bold text-[#1B2631] mb-3">1人あたり週間解答数の推移（直近4週間）</h3>
        <div className="grid grid-cols-4 gap-3">
          {agg.fourWeeksAvgPerMember.map((val, idx) => {
            const ratio = Math.round((val / maxWeekVal) * 100);
            const isCurrent = idx === 3;
            return (
              <div key={weekLabels[idx]} className="rounded-xl border border-[#EAE0CF] bg-white p-3">
                <div className="flex items-baseline justify-between gap-1 mb-1.5">
                  <span className="text-xs font-bold text-[#6E604C]">{weekLabels[idx]}</span>
                  <strong className={`text-sm tabular-nums ${isCurrent ? 'text-[#1B2631]' : 'text-[#5C4F3D]'}`}>{val}問</strong>
                </div>
                <TrajectoryBar pct={ratio} tone={isCurrent ? 'brand' : 'muted'} />
              </div>
            );
          })}
        </div>
      </div>

      {/* 同形式の未見問題の正答率推移 */}
      <div className="bg-[#FFFDF8] rounded-2xl border border-[#E5DCCC] p-4 space-y-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_2px_0_#E6DCCB]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-[#1B2631]">
              <TrendingUp className="w-4 h-4 text-[#2F7A52]" />
              同形式の「未見問題」正答率推移（暗記ではなく実力の伸び）
            </h3>
            <p className="text-xs text-[#6E604C] mt-0.5">
              解き直し・復習を除いた「初めて解く問題」のみを抽出し、初回10問と直近20問の正答率を比較しています。
            </p>
          </div>
        </div>

        {agg.formatTrajectories.length === 0 ? (
          <p className="text-sm text-[#6E604C] py-6 text-center bg-white rounded-xl border border-[#EAE0CF]">
            生徒が演習・英単語4択・英文解釈・TOEIC®・対戦で初見問題を解くと、形式ごとの正答率推移がここに表示されます。
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agg.formatTrajectories.map((row) => (
              <FormatRow key={row.format} row={row} />
            ))}
          </div>
        )}
      </div>

      {/* 生徒別の成果指標一覧 */}
      <div className="bg-[#FFFDF8] rounded-2xl border border-[#E5DCCC] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_2px_0_#E6DCCB]">
        <div className="px-4 py-3 border-b border-[#EAE0CF] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1B2631]">生徒別の成果データ（{agg.students.length}人）</h3>
          <span className="text-xs text-[#6E604C]">今週の解答数順</span>
        </div>
        {agg.students.length === 0 ? (
          <p className="p-6 text-center text-sm text-[#6E604C]">在籍している生徒がまだいません。</p>
        ) : (
          <div className="divide-y divide-[#EFE7D8]">
            {agg.students.map((st) => (
              <div key={st.uid} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-[#1B2631]">{st.displayName}</span>
                    <RetentionBadge eligible={st.retention.d7Eligible} retained={st.retention.d7Retained} label="D7" />
                    <RetentionBadge eligible={st.retention.d30Eligible} retained={st.retention.d30Retained} label="D30" />
                  </div>
                  <p className="text-xs text-[#6E604C]">
                    初回学習日: {st.retention.firstDay ?? '未学習'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-right tabular-nums">
                  <div className="rounded-lg bg-[#FAF6EC] px-2.5 py-1.5 border border-[#EAE0CF]">
                    <p className="text-xs text-[#6E604C]">週の解答数</p>
                    <p className="text-sm font-bold text-[#1B2631]">
                      {st.weeklyAnswers}問
                      <span className="text-xs font-normal text-[#6E604C] ml-1">（先週{st.prevWeeklyAnswers}）</span>
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#FAF6EC] px-2.5 py-1.5 border border-[#EAE0CF]">
                    <p className="text-xs text-[#6E604C]">対戦→復習・演習</p>
                    <p className="text-sm font-bold text-[#1B2631]">
                      {st.battleConversionPct !== null ? `${st.battleConversionPct}%` : '—'}
                      <span className="text-xs font-normal text-[#6E604C] ml-1">（{st.battlesConverted}/{st.battlesTotal}）</span>
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#FAF6EC] px-2.5 py-1.5 border border-[#EAE0CF]">
                    <p className="text-xs text-[#6E604C]">未見正答率</p>
                    <p className="text-sm font-bold text-[#1B2631]">
                      {st.unseenRecentPct !== null ? `${st.unseenRecentPct}%` : '—'}
                      {st.unseenDeltaPt !== null && (
                        <span className={`text-xs ml-1 ${st.unseenDeltaPt >= 0 ? 'text-[#236B43]' : 'text-[#96342B]'}`}>
                          ({st.unseenDeltaPt > 0 ? `+${st.unseenDeltaPt}` : st.unseenDeltaPt}pt)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 rounded-xl bg-[#FAF5E8] border border-[#E8DEC9] p-3 text-xs text-[#5C4F3D] leading-relaxed">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#8A6D3B]" />
        <span>
          D7・D30継続率は「初回学習日からそれぞれ7〜13日後・30〜36日後に学習記録がある生徒の割合」です。未見問題の正答率は同じ問題の解き直しを除いているため、形式そのものへの対応力の伸びを確認できます。
        </span>
      </div>
    </div>
  );
}
