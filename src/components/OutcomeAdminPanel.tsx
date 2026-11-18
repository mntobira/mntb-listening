/**
 * アプリ全体の学習成果・定着指標パネル（運営専用・FeedbackAdminPanel 内）
 *
 * - デフォルトでは通信を増やさず、「直近セッションを集計する」ボタンを押したときだけ
 *   usage_sessions（最大500件・最新順）を1クエリで取得して集計する。
 * - クラス未所属の一般ユーザーを含む D7/D30 継続率・週あたり解答数・対戦後転換率・未見正答率を確認できる。
 */
import { useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { collection, getDocs, limit, orderBy, query } from '../utils/firestoreMetered';
import { db } from '../firebase';
import { USAGE_COLLECTION } from '../utils/analytics';
import {
  aggregateGlobalUsageSessions,
  type GlobalSessionOutcomes,
  type UsageSessionRowLike,
} from '../utils/learningOutcomes';

export function OutcomeAdminPanel() {
  const [stats, setStats] = useState<GlobalSessionOutcomes | null>(null);
  const [sampleCount, setSampleCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadGlobal = async () => {
    setLoading(true);
    setError('');
    try {
      const q = query(collection(db, USAGE_COLLECTION), orderBy('createdAt', 'desc'), limit(500));
      const snap = await getDocs(q);
      const rows: UsageSessionRowLike[] = snap.docs.map((d) => {
        const data = d.data() || {};
        return {
          day: String(data.day || ''),
          install: String(data.install || ''),
          events: data.events && typeof data.events === 'object' ? (data.events as Record<string, number>) : {},
        };
      });
      setSampleCount(rows.length);
      setStats(aggregateGlobalUsageSessions(rows));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'セッション集計の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl bg-[#FFFDF8] border border-[#E5DCCC] p-4 space-y-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_2px_0_#E6DCCB]" aria-label="アプリ全体の学習成果指標">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-[#2F7A52]" />
          <h2 className="font-bold text-sm text-[#1B2631]">アプリ全体の学習成果・継続指標（匿名セッション）</h2>
        </div>
        <button
          type="button"
          onClick={() => void loadGlobal()}
          disabled={loading}
          className="inline-flex min-h-[44px] items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#DFD2BC] bg-white text-xs font-bold text-[#3F3527] shadow-[0_2px_0_#E5D9C4] hover:bg-[#FAF6EC] active:translate-y-[1.5px] active:shadow-none transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {stats ? '再集計' : '直近セッションを集計する'}
        </button>
      </div>

      <p className="text-xs text-[#6E604C] leading-relaxed">
        クラス未参加の個人学習者を含め、匿名端末ID（usage_sessions 直近最大500件）から D7/D30 継続率・週の解答数・対戦後の復習／演習転換率・未見正答率を集計します。
      </p>

      {error && <p role="alert" className="text-xs font-bold text-[#B83227]">{error}</p>}

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="rounded-xl border border-[#EAE0CF] bg-white p-3">
            <p className="text-xs text-[#6E604C]">D7 / D30 継続率</p>
            <p className="text-base font-bold tabular-nums text-[#1B2631] mt-0.5">
              {stats.d7.ratePct !== null ? `${stats.d7.ratePct}%` : '—'}
              <span className="text-xs text-[#6E604C] mx-1">/</span>
              {stats.d30.ratePct !== null ? `${stats.d30.ratePct}%` : '—'}
            </p>
            <p className="text-xs text-[#6E604C] mt-0.5">
              端末 {stats.installCount}台（{sampleCount}回）
            </p>
          </div>

          <div className="rounded-xl border border-[#EAE0CF] bg-white p-3">
            <p className="text-xs text-[#6E604C]">週の解答数 / 稼働端末</p>
            <p className="text-base font-bold tabular-nums text-[#1B2631] mt-0.5">
              {stats.weeklyAnswersPerActiveInstall}問
            </p>
            <p className="text-xs text-[#6E604C] mt-0.5">
              7日計 {stats.totalAnswers7d}問 / {stats.activeInstalls7d}台
            </p>
          </div>

          <div className="rounded-xl border border-[#EAE0CF] bg-white p-3">
            <p className="text-xs text-[#6E604C]">対戦→復習・演習</p>
            <p className="text-base font-bold tabular-nums text-[#1B2631] mt-0.5">
              {stats.battleConversionPct !== null ? `${stats.battleConversionPct}%` : '—'}
            </p>
            <p className="text-xs text-[#6E604C] mt-0.5">
              {stats.battlesConverted} / {stats.battlesDone}試合
            </p>
          </div>

          <div className="rounded-xl border border-[#EAE0CF] bg-white p-3">
            <p className="text-xs text-[#6E604C]">未見問題の正答率</p>
            <p className="text-base font-bold tabular-nums text-[#1B2631] mt-0.5">
              {stats.unseenAccuracyPct !== null ? `${stats.unseenAccuracyPct}%` : '—'}
            </p>
            <p className="text-xs text-[#6E604C] mt-0.5">
              初見計 {stats.unseenCount}問
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
