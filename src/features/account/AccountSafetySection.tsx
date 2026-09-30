/**
 * 設定画面の「安全とアカウント」欄。
 *   - ブロック中の人の一覧と解除（App Store 1.2）
 *   - 利用規約・プライバシーポリシー・お問い合わせ（App Store 1.2 / 5.1.1）
 *   - アカウントの削除（App Store 5.1.1(v)：アプリ内で削除できること）
 */
import { useEffect, useState } from 'react';
import { Trash2, Loader2, Ban, AlertTriangle, FileText, Shield, Mail } from 'lucide-react';
import { auth } from '../../firebase';
import { listBlockedUsers, subscribeBlocked, unblockUser, type BlockedUser } from '../safety/userSafety';
import { deleteAccount } from './accountDeletion';
import { LegalDialog, type LegalDoc } from '../legal/LegalDialog';
import { SUPPORT_EMAIL } from '../legal/legalText';

export function AccountSafetySection({ onDeleted }: { onDeleted?: () => void }) {
  const [blocked, setBlocked] = useState<BlockedUser[]>(() => listBlockedUsers());
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [legal, setLegal] = useState<LegalDoc | null>(null);
  useEffect(() => subscribeBlocked(() => setBlocked(listBlockedUsers())), []);

  const user = auth.currentUser;

  const runDelete = async () => {
    if (!user) return;
    setBusy(true);
    setError('');
    const result = await deleteAccount(user);
    setBusy(false);
    if (result.ok) {
      onDeleted?.();
      window.location.reload();
      return;
    }
    setError(('reason' in result && result.reason === 'recent_login')
      ? '安全のため、もう一度ログインしてから削除してください（ログアウト → ログイン → 削除）。'
      : '削除できませんでした。通信状況を確認して、もう一度お試しください。');
  };

  return (
    <section className="bg-white border border-gray-150 p-3 rounded-2xl shadow-sm space-y-2" aria-labelledby="account-safety-title">
      <h3 id="account-safety-title" className="text-xs font-bold text-gray-500 uppercase tracking-wider">安全とアカウント</h3>

      <div className="grid grid-cols-3 gap-1.5">
        <button type="button" className="account-link" onClick={() => setLegal('terms')}><FileText size={14} aria-hidden="true" />利用規約</button>
        <button type="button" className="account-link" onClick={() => setLegal('privacy')}><Shield size={14} aria-hidden="true" />プライバシー</button>
        <a className="account-link" href={`mailto:${SUPPORT_EMAIL}`}><Mail size={14} aria-hidden="true" />お問い合わせ</a>
      </div>

      <div>
        <p className="flex items-center gap-1 text-xs font-bold"><Ban size={13} aria-hidden="true" />ブロック中の人（{blocked.length}）</p>
        {blocked.length === 0 ? (
          <p className="text-xs text-gray-400">ランキングの「…」から通報・ブロックできます。</p>
        ) : (
          <ul className="mt-1 space-y-1">
            {blocked.map((b) => (
              <li key={b.uid} className="flex items-center gap-2 text-xs">
                <span className="flex-1 truncate">{b.nickname || '（名前なし）'}</span>
                <button type="button" className="min-h-[32px] px-2 text-[#2980B9] font-bold" onClick={() => unblockUser(b.uid)}>解除</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {user && (
        <div className="border-t border-gray-100 pt-2">
          {!confirming ? (
            <button type="button" onClick={() => setConfirming(true)} className="compact-action bg-white text-red-600 border border-red-200">
              <Trash2 size={15} aria-hidden="true" />アカウントを削除
            </button>
          ) : (
            <div className="space-y-1.5 rounded-xl bg-[#FDEDEC] border border-[#E74C3C]/40 p-2.5">
              <p className="flex items-start gap-1 text-xs font-bold text-[#C0392B]"><AlertTriangle size={14} className="shrink-0" aria-hidden="true" />学習記録・フレンド・対戦履歴・クラス在籍・ランキング掲載が削除され、元に戻せません。</p>
              <label className="block text-xs text-gray-600">確認のため「削除」と入力してください
                <input value={typed} onChange={(e) => setTyped(e.target.value)} className="compact-input mt-1" />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { setConfirming(false); setTyped(''); }} className="py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-500">やめる</button>
                <button type="button" disabled={typed.trim() !== '削除' || busy} onClick={runDelete} className="py-2 rounded-xl bg-red-600 text-white text-xs font-bold disabled:opacity-40 flex items-center justify-center gap-1">
                  {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Trash2 size={14} aria-hidden="true" />}完全に削除
                </button>
              </div>
              {error && <p role="alert" className="text-xs text-[#C0392B]">{error}</p>}
            </div>
          )}
        </div>
      )}
      {legal && <LegalDialog doc={legal} onClose={() => setLegal(null)} />}
    </section>
  );
}
