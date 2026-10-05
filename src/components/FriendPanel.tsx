import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, RefreshCw, Send, UserPlus, X } from 'lucide-react';
import {
  acceptFriendRequest,
  cancelFriendRequest,
  ensureFriendProfile,
  fetchFriendRequests,
  fetchFriends,
  fetchSentFriendRequests,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
  type FriendProfile,
  type FriendRequest,
} from '../utils/friends';
import { auth } from '../firebase';
import { DoorMascot } from './DoorMascot';
import { FriendCodeInput, friendCodeFromRaw } from './FriendCodeInput';
import { UserSafetyMenu } from '../features/safety/UserSafetyMenu';
import { isBlocked } from '../features/safety/userSafety';
import { useBlockedTick } from '../features/safety/useBlockedFilter';
import { safeAvatarUrl } from '../features/safety/avatarUrl';
import { displaySafeNickname, displaySafePublicText } from '../features/safety/nicknameFilter';
import { watchPublicStudyProfiles, type PublicStudyProfile } from '../utils/publicStudyProfile';
import { formatStudyTime } from '../utils/studyTime';

export function FriendPanel() {
  const [profile, setProfile] = useState<FriendProfile | null>(null);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  // ブロックした人からの申請は表示しない（App Store 1.2）
  const blockedTick = useBlockedTick();
  const visibleRequests = useMemo(() => requests.filter((r) => !isBlocked(r.fromUid)), [requests, blockedTick]);
  const [friends, setFriends] = useState<Array<{ uid: string; nickname: string; photoURL?: string }>>([]);
  /** フレンドの公開プロフィール（本人が公開にしている人だけ。志望校・志・達成ステージ・Lv） */
  const [publicProfiles, setPublicProfiles] = useState<Record<string, PublicStudyProfile>>({});
  const friendIds = friends.map(f => f.uid).sort().join(',');
  useEffect(() => {
    if (!friendIds) { setPublicProfiles({}); return; }
    return watchPublicStudyProfiles(friendIds.split(','), setPublicProfiles);
  }, [friendIds]);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    // 取得系（fetchFriendRequests / fetchFriends）は内部でエラーを握りつぶし
    // 空配列を返すため、ここで権限エラーのメッセージが常時表示されることはない。
    try {
      const p = await ensureFriendProfile();
      setProfile(p);
      const [reqs, sent, list] = await Promise.all([
        fetchFriendRequests(),
        fetchSentFriendRequests(),
        fetchFriends(),
      ]);
      setRequests(reqs);
      setSentRequests(sent);
      setFriends(list);
    } catch (e: any) {
      // ここに到達するのは想定外の例外のみ。
      console.error('フレンド情報の取得に失敗しました:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const runAction = async (action: () => Promise<unknown>, success: string) => {
    setLoading(true);
    setMessage('');
    setIsError(false);
    try {
      await action();
      setMessage(success);
      await load();
    } catch (error: any) {
      setIsError(true);
      setMessage(error?.message || '操作に失敗しました。通信状態を確認してください。');
    } finally {
      setLoading(false);
    }
  };

  if (!auth.currentUser) return null;

  const submitCode = async () => {
    if (loading) return;
    const full = friendCodeFromRaw(code);
    if (!full) { setIsError(true); setMessage('フレンドコードは「MNTB-」のあとに英数字8文字です（例：MNTB-AB12-CD34）。'); return; }
    setMessage(''); setIsError(false); setLoading(true);
    try { setMessage(await sendFriendRequest(full)); setCode(''); await load(); }
    catch (e: any) { setIsError(true); setMessage(e?.message || '申請に失敗しました。'); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-white border border-gray-150 p-3 sm:p-4 rounded-2xl shadow-sm space-y-3 h-full overflow-y-auto overscroll-contain flex flex-col friend-panel">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <UserPlus size={15} />
          <span>フレンド</span>
        </h3>
        <button
          onClick={load}
          disabled={loading}
          className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-150 transition-colors"
          aria-label="フレンド情報を更新"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-[#FDFBF7] border border-[#F0C7D2]/70 rounded-xl p-3">
        <p className="text-[11px] text-gray-500 font-bold mb-2">あなたのフレンドコード</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-white border border-gray-150 rounded-xl px-3 py-2 text-sm font-black tracking-wider text-[#1B2631]">
            {profile ? profile.friendCode : (loading ? '発行中…' : '—')}
          </code>
          <button
            onClick={() => {
              if (!profile?.friendCode) return;
              navigator.clipboard?.writeText(profile.friendCode);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            }}
            disabled={!profile?.friendCode}
            className="p-2.5 rounded-xl bg-[#A9CCE3]/20 text-[#2C3E50] hover:bg-[#A9CCE3]/35 border border-[#A9CCE3]/40 disabled:opacity-40"
            aria-label="フレンドコードをコピー"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 leading-snug">
          このコードを友だちに伝えると、相手があなたを追加できます。
        </p>
      </div>

      {/* ★フレンドコード入力（2026-10-05 再修正）★ 普通の入力欄＋貼り付けボタン。整形は送信時だけ */}
      <div className="friend-code-row">
        <FriendCodeInput value={code} onChange={setCode} disabled={loading} onSubmit={() => void submitCode()} />
        <button
          type="button"
          onClick={() => void submitCode()}
          disabled={loading || !code.trim()}
          className="friend-code-send"
        >
          <Send size={16} aria-hidden="true" />
          申請
        </button>
      </div>
      <p className="friend-code-hint">長押しペースト・「貼り付け」OK。小文字や「MNTB-」なしでも送れます。</p>

      {message && (
        <p
          role={isError ? 'alert' : 'status'}
          className={`text-xs font-bold rounded-xl p-3 border ${
            isError
              ? 'text-red-700 bg-red-50 border-red-100'
              : 'text-[#2C3E50] bg-blue-50 border-blue-100'
          }`}
        >
          {message}
        </p>
      )}

      {requests.length > 0 && (
        <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
          <p className="text-[11px] text-gray-400 font-bold sticky top-0 bg-white">届いている申請</p>
          {visibleRequests.map((req) => (
            <div key={req.id} className="flex items-center gap-3 bg-[#F9E79F]/15 border border-[#F9E79F]/50 rounded-2xl p-3">
              <Avatar name={req.fromNickname} url={req.fromPhotoURL} />
              <span className="flex-1 text-sm font-bold text-[#1B2631] truncate">{displaySafeNickname(req.fromNickname)}</span>
              <UserSafetyMenu target={{ uid: req.fromUid, nickname: req.fromNickname, where: 'friend' }} />
              <button disabled={loading} aria-label={`${req.fromNickname}さんを承認`} onClick={() => runAction(() => acceptFriendRequest(req), `${req.fromNickname} さんとフレンドになりました。`)} className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 disabled:opacity-40"><Check size={15} /></button>
              <button disabled={loading} aria-label={`${req.fromNickname}さんを拒否`} onClick={() => runAction(() => rejectFriendRequest(req), '申請を拒否しました。')} className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-100 disabled:opacity-40"><X size={15} /></button>
            </div>
          ))}
        </div>
      )}

      {sentRequests.length > 0 && (
        <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
          <p className="text-[11px] text-gray-400 font-bold sticky top-0 bg-white">送信済みの申請（承認待ち）</p>
          {sentRequests.map((req) => (
            <div key={req.id} className="flex items-center gap-3 bg-gray-50 border border-gray-150 rounded-2xl p-3">
              <span className="flex-1 text-xs font-bold text-gray-500 truncate">相手の承認を待っています</span>
              <button
                disabled={loading}
                onClick={() => runAction(() => cancelFriendRequest(req), '申請を取り消しました。')}
                className="text-xs font-bold text-gray-500 hover:underline disabled:opacity-40"
              >
                取消
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 min-h-[96px] flex-1 overflow-y-auto pr-1">
        <p className="text-[11px] text-gray-400 font-bold sticky top-0 bg-white z-10">フレンド一覧（{friends.length}人）</p>
        {friends.length === 0 ? (
          <div className="text-xs text-gray-400 bg-gray-50 rounded-2xl p-3 flex items-center gap-2"><DoorMascot showSpeech={false} size="mini" className="w-auto" /><span>まだフレンドはいません。コードで追加してみましょう。</span></div>
        ) : (
          friends.map((f) => (
            <div key={f.uid} className="flex items-center gap-3 bg-gray-50 border border-gray-150 rounded-2xl p-3">
              <Avatar name={f.nickname} url={f.photoURL} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-[#1B2631] truncate">{displaySafeNickname(f.nickname)}</span>
                {publicProfiles[f.uid] && (() => { const pp = publicProfiles[f.uid]; return <>
                  <span className="block truncate text-xs font-bold text-[#425c6d]" data-friend-public>
                    {displaySafePublicText(pp.targetSchool) || '志望校未設定'} · 学習 {formatStudyTime(pp.studySeconds)}{pp.stagesCleared != null ? ` · 達成 ${pp.stagesCleared}` : ''}{pp.level != null ? ` · Lv.${pp.level}` : ''}
                  </span>
                  {pp.motto && <span className="block truncate text-xs font-bold text-[#6b5a3a]">「{displaySafePublicText(pp.motto)}」</span>}
                </>; })()}
              </span>
              <UserSafetyMenu target={{ uid: f.uid, nickname: f.nickname, where: 'friend' }} />
              <button disabled={loading} onClick={() => { if (window.confirm(`${f.nickname} さんとのフレンド関係を解除しますか？`)) runAction(() => removeFriend(f.uid), 'フレンドを解除しました。'); }} className="text-xs font-bold text-red-500 hover:underline disabled:opacity-40">解除</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Avatar({ name, url }: { name: string; url?: string }) {
  return (
    <div className="w-9 h-9 rounded-full bg-white border border-gray-150 overflow-hidden flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
      {safeAvatarUrl(url) ? <img src={safeAvatarUrl(url)} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : name.slice(0, 1)}
    </div>
  );
}
