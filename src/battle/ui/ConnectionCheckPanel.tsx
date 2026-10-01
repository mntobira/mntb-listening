/**
 * 通信チェック（対戦メニュー・マッチング失敗時）。
 * 押したときだけ読み取りを最大4回して、どこで止まっているかを上から順に出す。
 * 運営者に送る文をコピーできる（UID・メールは含めない）。
 */
import { useEffect, useRef, useState } from 'react';
import { Activity, Copy } from 'lucide-react';
import { reportText, summarizeConnection, type CheckResult } from '../core/connectionCheck';
import { connectedProjectId, probeConnection } from '../data/connectionProbe';

const MARK: Record<CheckResult['status'], string> = { ok: '○', warn: '△', fail: '×', skip: '－' };

export function ConnectionCheckPanel({ autoRun = false, compact = false }: { autoRun?: boolean; compact?: boolean }) {
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const started = useRef(false);
  const run = async () => {
    if (running) return;
    setRunning(true); setCopied(false);
    try { setResults((await probeConnection()).results); } finally { setRunning(false); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (autoRun && !started.current) { started.current = true; void run(); } }, [autoRun]);
  const summary = results ? summarizeConnection(results) : null;
  const copy = async () => {
    if (!results) return;
    const text = reportText(results, { projectId: connectedProjectId(), appVersion: String(import.meta.env.VITE_APP_VERSION || 'dev'), userAgent: navigator.userAgent });
    try { await navigator.clipboard.writeText(text); setCopied(true); } catch { setCopied(false); }
  };
  return <section className={`connection-check ${compact ? 'is-compact' : ''}`} aria-label="通信チェック" data-connection-check>
    <button type="button" className="connection-check-run" onClick={() => void run()} disabled={running}>
      <Activity size={15} aria-hidden="true" />{running ? '確認中…（最大8秒）' : results ? 'もう一度チェック' : '通信チェックをする'}
    </button>
    {summary && <p className="connection-check-summary" data-tone={summary.tone} role="status">{summary.text}</p>}
    {results && <ol className="connection-check-list">{results.map(r => <li key={r.id} data-status={r.status}>
      <span className="connection-check-mark" aria-label={r.status}>{MARK[r.status]}</span>
      <span><b>{r.label}</b>：{r.detail}{r.fix && <small>{r.owner === 'operator' ? '【運営側】' : ''}{r.fix}</small>}</span>
    </li>)}</ol>}
    {results && results.some(r => r.status === 'fail' || r.status === 'warn') && <button type="button" className="connection-check-copy" onClick={() => void copy()}><Copy size={13} aria-hidden="true" />{copied ? 'コピーしました' : '運営に送る内容をコピー'}</button>}
  </section>;
}
