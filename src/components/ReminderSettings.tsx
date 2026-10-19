/**
 * 設定 → 通知（2026-10-19）。最初はオフ。オンにしたときだけ許可を求める。
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { readReminderPrefs, writeReminderPrefs, type ReminderPrefs, REVIEW_HOUR, STREAK_HOUR } from '../utils/studyReminders';
import { reminderPermission, requestReminderPermission, rescheduleReminders, type ReminderPermission } from '../utils/studyRemindersRuntime';
import { analyticsEnabled, setAnalyticsEnabled, trackEvent } from '../utils/analytics';

export function ReminderSettings() {
  const [prefs, setPrefs] = useState<ReminderPrefs>(() => readReminderPrefs());
  const [perm, setPerm] = useState<ReminderPermission>('prompt');
  useEffect(() => { let alive = true; void reminderPermission().then(p => { if (alive) setPerm(p); }); return () => { alive = false; }; }, []);

  const save = (next: ReminderPrefs) => { setPrefs(next); writeReminderPrefs(next); void rescheduleReminders(); };
  const toggleAll = async () => {
    if (prefs.enabled) { save({ ...prefs, enabled: false }); trackEvent('reminder_toggle', { on: 0 }); return; }
    const p = perm === 'granted' ? perm : await requestReminderPermission();
    setPerm(p);
    if (p !== 'granted') return;
    save({ ...prefs, enabled: true });
    trackEvent('reminder_toggle', { on: 1 });
  };

  return <div className="ps-reminders">
    <Row label="学習のお知らせ" sub={prefs.enabled ? 'オン（この端末に届きます）' : 'オフ'} checked={prefs.enabled} onChange={() => { void toggleAll(); }}
      icon={prefs.enabled ? <Bell size={16} /> : <BellOff size={16} />} />
    {prefs.enabled && <>
      <Row label="復習の日" sub={`間違えた問題の復習日に ${REVIEW_HOUR}:00`} checked={prefs.review} onChange={() => save({ ...prefs, review: !prefs.review })} />
      <Row label="連続日数がとぎれそう" sub={`まだ学習していない日の ${STREAK_HOUR}:00`} checked={prefs.streak} onChange={() => save({ ...prefs, streak: !prefs.streak })} />
    </>}
    {perm === 'denied' && <p className="ps-help" role="status">通知が端末の設定でオフになっています。端末の「設定 → 通知 → マナトビ」でオンにしてください。</p>}
    {perm === 'unsupported' && <p className="ps-help" role="status">このブラウザは通知に対応していません。アプリ版ならアプリを閉じていても届きます。</p>}
    {perm !== 'denied' && perm !== 'unsupported' && <p className="ps-help">Web 版は、マナトビを開いているあいだだけ届きます。</p>}
  </div>;
}

function Row({ label, sub, checked, onChange, icon }: { label: string; sub?: string; checked: boolean; onChange: () => void; icon?: ReactNode }) {
  return <div className="ps-toggle-row">
    {icon && <span className="ps-toggle-icon" data-on={checked || undefined}>{icon}</span>}
    <div className="ps-toggle-text"><p>{label}</p>{sub && <small>{sub}</small>}</div>
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange} className="ps-switch" data-tone="blue"><span /></button>
  </div>;
}

/** 設定 → その他：使われ方の記録（オフにすると何も送らない） */
export function AnalyticsSetting() {
  const [on, setOn] = useState(() => analyticsEnabled());
  return <div className="ps-reminders">
    <Row label="使われ方の記録" sub="よく使う画面・エラーを匿名で送り、改善に使います（名前・メールは送りません）" checked={on}
      onChange={() => { const next = !on; setAnalyticsEnabled(next); setOn(next); }} />
  </div>;
}
