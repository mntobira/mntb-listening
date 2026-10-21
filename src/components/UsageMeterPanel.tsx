/**
 * Firebase 使用量メーター（運営専用・FeedbackAdminPanel の中に表示）
 *
 * - この端末で数えた Firestore の読み取り／書き込み／削除を、日ごと・機能ごとに表示する。
 * - プロジェクト全体の正確な合計は Firebase コンソールの「使用量」ページで確認する（リンクあり）。
 * - 通信は一切増やさない（localStorage の記録を読むだけ）。
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ExternalLink, Trash2 } from 'lucide-react';
import { readUsage, flushUsageNow, clearUsage, FREE_DAILY_LIMITS, type UsageDay } from '../utils/firestoreMetered';
import { confirmAction } from '../utils/dialog';

const AREA_LABELS: Record<string, string> = {
  battle_rooms: '対戦の部屋',
  battle_codes: '合言葉',
  battle_queue: 'マッチング待ち',
  battle_rules: '対戦ルール',
  battle_ranking: '対戦ランキング',
  battle_history: '対戦履歴',
  leaderboard_chapter: '単元ランキング',
  leaderboard_total: '総合ランキング',
  leaderboard_events: 'ランキング記録',
  friend_codes: 'フレンドコード',
  friend_profiles: 'フレンドの表示名',
  friend_requests: 'フレンド申請',
  friends: 'フレンド一覧',
  feedback: 'ご意見',
  feedback_replies: '運営からの返信',
  app_users: 'ユーザー登録',
  study_progress: '学習の同期',
  study_access: '学習の閲覧権',
  classrooms: 'クラス',
  class_codes: 'クラスコード',
  class_members: 'クラスメンバー',
};

const FIREBASE_USAGE_URL = 'https://console.firebase.google.com/project/_/firestore/usage';

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  return (
    <div className="h-2 rounded-full bg-gray-100 overflow-hidden" aria-hidden>
      <div className="h-full rounded-full" style={{ width: `${Math.max(pct, value > 0 ? 1 : 0)}%`, background: color }} />
    </div>
  );
}

export function UsageMeterPanel() {
  const [days, setDays] = useState<UsageDay[]>([]);
  const [selected, setSelected] = useState<string>('');

  const reload = () => {
    flushUsageNow();
    const d = readUsage();
    setDays(d);
    setSelected((cur) => (cur && d.some((x) => x.date === cur) ? cur : d[d.length - 1]?.date ?? ''));
  };
  useEffect(() => {
    reload();
    const t = window.setInterval(reload, 5000);
    return () => window.clearInterval(t);
  }, []);

  const day = days.find((d) => d.date === selected);
  const areas = useMemo(
    () => (Object.entries(day?.byArea ?? {}) as [string, UsageDay['byArea'][string]][]).sort((a, b) => (b[1].reads + b[1].writes + b[1].deletes) - (a[1].reads + a[1].writes + a[1].deletes)),
    [day],
  );
  const maxDay = Math.max(1, ...days.map((d) => d.reads + d.writes + d.deletes));

  return (
    <section className="rounded-2xl bg-white border border-gray-200 p-4 space-y-3 shadow-sm" aria-label="Firebase 使用量">
      <div className="flex items-center gap-2">
        <Activity size={18} className="text-[#E67E22]" />
        <h2 className="font-bold text-sm flex-1">Firebase 使用量（この端末）</h2>
        <a href={FIREBASE_USAGE_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-[#2980B9]">
          全体はコンソールで <ExternalLink size={12} />
        </a>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">
        このアプリがこの端末で行った Firestore の読み取り・書き込み・削除の回数です（14日分・キャッシュ分は除外）。
        プロジェクト全体の合計は右上のリンク（Firebase コンソール → Firestore → 使用量）で確認できます。
      </p>

      {days.length === 0 ? (
        <p className="text-xs text-gray-400 py-4 text-center">まだ記録がありません</p>
      ) : (
        <>
          {/* 日ごとの棒 */}
          <div className="flex items-end gap-1 h-16">
            {days.map((d) => {
              const total = d.reads + d.writes + d.deletes;
              return (
                <button
                  key={d.date}
                  onClick={() => setSelected(d.date)}
                  title={`${d.date}: ${total.toLocaleString()} 回`}
                  className={`flex-1 rounded-t ${d.date === selected ? 'bg-[#E67E22]' : 'bg-[#F5CBA7]'}`}
                  style={{ height: `${Math.max(6, (total / maxDay) * 100)}%` }}
                />
              );
            })}
          </div>

          {day && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-gray-600">{day.date}</div>
              {([
                ['読み取り', day.reads, FREE_DAILY_LIMITS.reads, '#3498DB'],
                ['書き込み', day.writes, FREE_DAILY_LIMITS.writes, '#27AE60'],
                ['削除', day.deletes, FREE_DAILY_LIMITS.deletes, '#E74C3C'],
              ] as const).map(([label, v, max, color]) => (
                <div key={label} className="space-y-0.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold">{label}</span>
                    <span className="tabular-nums text-gray-500">{v.toLocaleString()} / 無料枠 {max.toLocaleString()}（{((v / max) * 100).toFixed(2)}%）</span>
                  </div>
                  <Bar value={v} max={max} color={color} />
                </div>
              ))}

              <table className="w-full text-xs mt-2">
                <thead>
                  <tr className="text-gray-400">
                    <th className="text-left font-normal py-1">機能</th>
                    <th className="text-right font-normal">読み</th>
                    <th className="text-right font-normal">書き</th>
                    <th className="text-right font-normal">削除</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.map(([area, c]) => (
                    <tr key={area} className="border-t border-gray-100">
                      <td className="py-1">{AREA_LABELS[area] ?? area}</td>
                      <td className="text-right tabular-nums">{c.reads.toLocaleString()}</td>
                      <td className="text-right tabular-nums">{c.writes.toLocaleString()}</td>
                      <td className="text-right tabular-nums">{c.deletes.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => { if (confirmAction('この端末の使用量の記録を消しますか？')) { clearUsage(); reload(); } }}
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#C0392B]"
            >
              <Trash2 size={12} /> 記録を消す
            </button>
          </div>
        </>
      )}
    </section>
  );
}
