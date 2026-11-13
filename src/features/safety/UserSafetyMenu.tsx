/**
 * 他の利用者の名前の横に置く「…」メニュー（通報・ブロック）。
 * App Store Review Guideline 1.2（ユーザー生成コンテンツ）対応。
 *
 * 使い方:
 *   <UserSafetyMenu target={{ uid, nickname, where: 'ranking' }} />
 * 自分自身・uid が無い行（AI 相手など）には出さない（呼び出し側で判定しなくてよい）。
 */
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { MoreHorizontal, Flag, Ban, Check, Loader2, UserRound } from 'lucide-react';
import { auth } from '../../firebase';
import {
  blockUser, isBlocked, reportUser, unblockUser,
  REPORT_REASON_LABELS, type ReportReason, type ReportTarget,
} from './userSafety';

const REASONS = Object.keys(REPORT_REASON_LABELS) as ReportReason[];

/**
 * 2026-10-28 A7：onProfile を渡すと、ボタンは「詳細」（triggerVariant="dots" のときは「…」のまま）になり、窓は
 *   ① プロフィールを見る ② 運営に通報する ③ ブロックする の3段（名前は窓の見出しに出さない）。
 */
export function UserSafetyMenu({
  target,
  className = '',
  onProfile,
  triggerVariant = 'detail',
}: {
  target: ReportTarget;
  className?: string;
  onProfile?: () => void;
  triggerVariant?: 'detail' | 'dots';
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<'menu' | 'report' | 'done'>('menu');
  const [reason, setReason] = useState<ReportReason>('name');
  const [detail, setDetail] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string>('');
  const [blocked, setBlocked] = useState(() => isBlocked(target.uid));

  useEffect(() => setBlocked(isBlocked(target.uid)), [target.uid]);

  const me = auth.currentUser?.uid;
  if (!target.uid || target.uid === me || target.uid.startsWith('ai:') || target.uid.startsWith('bot')) return null;

  const open = (event: MouseEvent) => {
    event.stopPropagation();
    setMode('menu');
    setResult('');
    setDetail('');
    dialog.current?.showModal();
  };
  const close = () => dialog.current?.close();

  const toggleBlock = () => {
    if (blocked) {
      unblockUser(target.uid);
      setBlocked(false);
      setResult('ブロックを解除しました。');
    } else {
      blockUser(target.uid, target.nickname);
      setBlocked(true);
      setResult('ブロックしました。この人はランキングやマッチングに表示されなくなります（相手には通知されません）。');
    }
    setMode('done');
  };

  const sendReport = async () => {
    setSending(true);
    const ok = await reportUser(target, reason, detail);
    setSending(false);
    setResult(ok
      ? '通報を受け付けました。運営が内容を確認し、必要に応じて名前の変更・利用停止などの対応をします。'
      : '通信できなかったため、端末に保存しました。通信が戻ると自動で送信されます。');
    setMode('done');
  };

  const showDetailLabel = Boolean(onProfile) && triggerVariant === 'detail';

  return (
    <>
      <button
        type="button"
        onClick={open}
        className={`user-safety-trigger ${showDetailLabel ? 'is-detail' : ''} ${className}`}
        aria-label={onProfile ? `${target.nickname} さんのメニュー（プロフィール・通報・ブロック）` : `${target.nickname} さんを通報・ブロック`}
        title={showDetailLabel ? '詳細' : onProfile ? 'プロフィール・通報・ブロック' : '通報・ブロック'}
        data-user-detail={onProfile ? '' : undefined}
      >
        {showDetailLabel ? '詳細' : <MoreHorizontal size={16} aria-hidden="true" />}
      </button>
      <dialog ref={dialog} className="user-safety-dialog" aria-labelledby="user-safety-title" onClick={(e) => { if (e.target === dialog.current) close(); }}>
        <div className="user-safety-body" onClick={(e) => e.stopPropagation()}>
          {/* 2026-10-28 A7：見出しに名前は出さない（画面の左上に名前が見えてしまうため） */}
          <h2 id="user-safety-title">{mode === 'report' ? '運営に通報する' : 'メニュー'}</h2>
          {mode === 'menu' && (
            <div className="user-safety-actions">
              {onProfile && <button type="button" data-primary onClick={() => { close(); onProfile(); }} data-user-profile><UserRound size={16} aria-hidden="true" />プロフィールを見る</button>}
              <button type="button" onClick={() => setMode('report')}><Flag size={16} aria-hidden="true" />運営に通報する</button>
              <button type="button" onClick={toggleBlock} data-danger={!blocked}>
                <Ban size={16} aria-hidden="true" />{blocked ? 'ブロックを解除する' : 'ブロックする'}
              </button>
              <button type="button" className="user-safety-cancel" onClick={close}>閉じる</button>
            </div>
          )}
          {mode === 'report' && (
            <div className="user-safety-report">
              <fieldset>
                <legend>通報の理由</legend>
                {REASONS.map((r) => (
                  <label key={r}>
                    <input type="radio" name="report-reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
                    {REPORT_REASON_LABELS[r]}
                  </label>
                ))}
              </fieldset>
              <label className="user-safety-detail">
                くわしく（任意）
                <textarea value={detail} maxLength={500} rows={3} onChange={(e) => setDetail(e.target.value)} />
              </label>
              <div className="user-safety-row">
                <button type="button" className="user-safety-cancel" onClick={() => setMode('menu')}>戻る</button>
                <button type="button" onClick={sendReport} disabled={sending} data-primary>
                  {sending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Flag size={15} aria-hidden="true" />}
                  送信する
                </button>
              </div>
            </div>
          )}
          {mode === 'done' && (
            <div className="user-safety-done" role="status">
              <p><Check size={16} aria-hidden="true" />{result}</p>
              <button type="button" onClick={close} data-primary>閉じる</button>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
