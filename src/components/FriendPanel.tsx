import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, RefreshCw, Send, Share2, UserPlus, X } from 'lucide-react';
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
import { ListSkeleton } from './ui';
import { FriendCodeInput, friendCodeFromRaw } from './FriendCodeInput';
import { UserSafetyMenu } from '../features/safety/UserSafetyMenu';
import { isBlocked } from '../features/safety/userSafety';
import { useBlockedTick } from '../features/safety/useBlockedFilter';
import { safeAvatarUrl } from '../features/safety/avatarUrl';
import { displaySafeNickname, displaySafePublicText } from '../features/safety/nicknameFilter';
import { watchPublicStudyProfiles, type PublicStudyProfile } from '../utils/publicStudyProfile';
import { UserProfileDialog, type ProfileTarget } from '../features/profile/UserProfileDialog';
import '../features/profile/public-profile.css';
import { formatStudyTime } from '../utils/studyTime';
import { confirmAction } from '../utils/dialog';
import { shareFriendCode } from '../utils/friendCodeShare';

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
  const [openProfile, setOpenProfile] = useState<ProfileTarget | null>(null);
  // E3（2026-10-30）：届いている申請の人も、ランキングと同じく公開プロフィール（志望校・学習時間・Lv）を出す
  const friendIds = [...new Set([...friends.map(f => f.uid), ...visibleRequests.map(r => r.fromUid)])].sort().join(',');
  useEffect(() => {
    if (!friendIds) { setPublicProfiles({}); return; }
    return watchPublicStudyProfiles(friendIds.split(','), setPublicProfiles);
  }, [friendIds]);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  /** 一覧を一度でも読み終えたか（初回だけスケルトンを出す。更新ボタンのときは今の一覧を残す） */
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    // 取得系（fetchFriendRequests / fetchFriends）は内部でエラーを握りつぶし
    // 空配列を返すため、ここで権限エラーのメッセージが常時表示されることはない。
    try {
      // 自分のコードの用意と、一覧の読み込みは並べて走らせる（片方が遅くても、もう片方は先に出す）
      void ensureFriendProfile().then(setProfile).catch((e) => console.error('フレンドコードの用意に失敗しました:', e));
      const [reqs, sent, list] = await Promise.all([
        fetchFriendRequests(),
        fetchSentFriendRequests(),
        fetchFriends(),
      ]);
      setRequests(reqs);
      setSentRequests(sent);
      setFriends(list);
    } catch (e: unknown) {
      // ここに到達するのは想定外の例外のみ。
      console.error('フレンド情報の取得に失敗しました:', e);
    } finally {
      setLoaded(true); // 失敗しても骨組みを出し続けない（空の案内に切り替える）
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
    } catch (error: unknown) {
      setIsError(true);
      setMessage(error instanceof Error && error.message ? error.message : '操作に失敗しました。通信状態を確認してください。');
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
    catch (e: unknown) { setIsError(true); setMessage(e instanceof Error && e.message ? e.message : '申請に失敗しました。'); }
    finally { setLoading(false); }
  };

  const shareOwnCode = async () => {
    if (!profile?.friendCode) return;
    setMessage(''); setIsError(false);
    try {
      const result = await shareFriendCode(profile.friendCode);
      if (result === 'copied') setMessage('共有機能が使えないため、共有文面をコピーしました。');
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setIsError(true);
      setMessage('共有を開始できませんでした。コードのコピーをお試しください。');
    }
  };

  return (
    /*
      ★フレンド一覧に高さを回す（ご指摘「フレンドスクロールが小さすぎる」）★
      390x844 の実機録画では、上の
        見出し（フレンド＋更新）36px／自分のコードのカード 3段 110px／
        入力欄 52px／全幅の「申請」48px／注意書き 20px
      で約300px を使い、一覧は約150px（1.5人ぶん）しか残っていなかった。
      さらに外枠と一覧の両方がスクロールする二重スクロールで、指が外枠を掴むと
      一覧ではなく画面全体が動いていた。
        ・自分のコードは1行（ラベル＋コード＋コピー）。説明文はラベルの title に寄せる
        ・入力欄・貼り付け・申請を1行に並べる
        ・見出しは「フレンド一覧（N人）」と更新ボタンの1行だけ（タブ名と重複していた「フレンド」見出しは外す）
        ・外枠はスクロールさせず、一覧だけを flex-1 でスクロールさせる
      これで上の部品は約130px になり、残り（約400px＝6人ぶん）を一覧が使う。
    */
    <div className="bg-white border border-gray-150 p-3 sm:p-4 rounded-2xl shadow-sm gap-2.5 h-full min-h-0 overflow-hidden flex flex-col friend-panel">
      <div className="flex shrink-0 items-center gap-2 rounded-xl border border-[#F0C7D2]/70 bg-[#FDFBF7] px-2.5 py-1.5"
        title="このコードを友だちに伝えると、相手があなたを追加できます。">
        <span className="friend-own-label shrink-0 text-xs font-bold leading-tight text-gray-600">あなたの<br />コード</span>
        <code aria-label="あなたのフレンドコード" className="friend-own-code min-w-0 flex-1 truncate rounded-lg border border-gray-150 bg-white px-2.5 py-2 text-sm font-black tracking-wider text-[#1B2631]">
          {profile ? profile.friendCode : (loading ? '発行中…' : '—')}
        </code>
        <button
          type="button"
          onClick={async () => {
            if (!profile?.friendCode) return;
            setMessage(''); setIsError(false);
            try {
              if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
              await navigator.clipboard.writeText(profile.friendCode);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            } catch {
              setIsError(true);
              setMessage('コードをコピーできませんでした。共有ボタンをお試しください。');
            }
          }}
          disabled={!profile?.friendCode}
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1 rounded-xl border border-[#A9CCE3]/40 bg-[#A9CCE3]/20 px-2 text-xs font-bold text-[#2C3E50] hover:bg-[#A9CCE3]/35 disabled:opacity-40"
          aria-label="フレンドコードをコピー"
        >
          {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}<span className="friend-own-copy-text">{copied ? '済' : 'コピー'}</span>
        </button>
        <button
          type="button"
          onClick={() => void shareOwnCode()}
          disabled={!profile?.friendCode}
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1 rounded-xl border border-[#A9CCE3]/40 bg-[#A9CCE3]/20 px-2 text-xs font-bold text-[#2C3E50] hover:bg-[#A9CCE3]/35 disabled:opacity-40"
          aria-label="フレンドコードを共有"
          title="他のアプリへフレンドコードを共有"
        >
          <Share2 size={15} aria-hidden="true" /><span className="friend-own-copy-text">共有</span>
        </button>
      </div>

      {/* ★フレンドコード入力（2026-10-05 再修正）★ 普通の入力欄＋貼り付けボタン。整形は送信時だけ。
          2026-10-18：申請ボタンも同じ行に並べる（一覧の高さを確保するため） */}
      <div className="friend-code-row friend-code-row-inline shrink-0" title="長押しペースト・「貼り付け」OK。小文字や「MNTB-」なしでも送れます。">
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

      {message && (
        <p data-friend-message
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

      {visibleRequests.length > 0 && (
        <div className="shrink-0 space-y-2 max-h-48 overflow-y-auto pr-1" data-friend-requests>
          <p className="text-xs text-gray-600 font-bold sticky top-0 bg-white">届いている申請（{visibleRequests.length}件）</p>
          {visibleRequests.map((req) => {
            // E3（2026-10-30）：ランキングと同じ詳しさ（志望校・学習時間・達成・Lv・志）＋「プロフィール」ボタン
            const pp = publicProfiles[req.fromUid];
            const name = displaySafeNickname(req.fromNickname);
            return (
              <div key={req.id} className="flex items-center gap-2.5 bg-[#F9E79F]/15 border border-[#F9E79F]/50 rounded-2xl px-2.5 py-2" data-friend-request>
                <Avatar name={req.fromNickname} url={req.fromPhotoURL} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[#1B2631] truncate">{name}</span>
                  {pp ? <>
                    <span className="block truncate text-xs font-bold text-[#425c6d]" data-friend-request-public>
                      {displaySafePublicText(pp.targetSchool) || '志望校未設定'} · 学習 {formatStudyTime(pp.studySeconds)}{pp.stagesCleared != null ? ` · 達成 ${pp.stagesCleared}` : ''}{pp.level != null ? ` · Lv.${pp.level}` : ''}
                    </span>
                    {pp.motto && <span className="block truncate text-xs font-bold text-[#6b5a3a]">「{displaySafePublicText(pp.motto)}」</span>}
                  </> : <span className="block text-xs font-bold text-gray-500">プロフィールは非公開です</span>}
                </span>
                <button type="button" className="min-h-11 shrink-0 rounded-xl border border-[#cfd8e3] bg-white px-2.5 text-xs font-bold text-[#2C3E50]"
                  onClick={() => setOpenProfile({ uid: req.fromUid, nickname: req.fromNickname, where: 'friend' })}
                  aria-label={`${name} さんのプロフィールを表示`} data-friend-request-profile>プロフィール</button>
                <UserSafetyMenu target={{ uid: req.fromUid, nickname: req.fromNickname, where: 'friend' }} />
                <button disabled={loading} aria-label={`${req.fromNickname}さんを承認`} onClick={() => runAction(() => acceptFriendRequest(req), `${req.fromNickname} さんとフレンドになりました。`)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 disabled:opacity-40"><Check size={16} /></button>
                <button disabled={loading} aria-label={`${req.fromNickname}さんを拒否`} onClick={() => runAction(() => rejectFriendRequest(req), '申請を拒否しました。')} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100 disabled:opacity-40"><X size={16} /></button>
              </div>
            );
          })}
        </div>
      )}

      {sentRequests.length > 0 && (
        <div className="shrink-0 space-y-2 max-h-24 overflow-y-auto pr-1">
          <p className="text-xs text-gray-400 font-bold sticky top-0 bg-white">送信済みの申請（承認待ち）</p>
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

      <div data-friend-list className="min-h-[160px] flex-1 space-y-1.5 overflow-y-auto overscroll-contain pr-1" tabIndex={0} aria-label="フレンド一覧">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-white pb-0.5">
          <p className="flex items-center gap-1.5 text-xs font-bold text-gray-600"><UserPlus size={14} aria-hidden="true" />フレンド一覧（{loaded ? `${friends.length}人` : '…'}）</p>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-gray-150 bg-gray-50 text-gray-500 transition-colors hover:bg-gray-100"
            aria-label="フレンド情報を更新"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        {!loaded ? (
          <ListSkeleton rows={4} rowHeight={52} label="フレンド一覧を読み込み中…" />
        ) : friends.length === 0 ? (
          <div className="text-xs text-gray-600 bg-gray-50 rounded-2xl p-3 flex items-center gap-2"><DoorMascot showSpeech={false} size="mini" className="w-auto" /><span>まだフレンドはいません。上の「あなたのコード」を友だちに伝えるか、友だちのコードを入れて「申請」しましょう（小文字や「MNTB-」なしでも送れます）。</span></div>
        ) : (
          friends.map((f) => (
            <div key={f.uid} className="flex items-center gap-2.5 bg-gray-50 border border-gray-150 rounded-2xl px-2.5 py-1.5">
              <Avatar name={f.nickname} url={f.photoURL} />
              <span className="min-w-0 flex-1">
                {publicProfiles[f.uid]
                  ? <button type="button" className="pp-open" onClick={() => setOpenProfile({ uid: f.uid, nickname: f.nickname, where: 'friend' })} aria-label={`${displaySafeNickname(f.nickname)} さんのプロフィールを見る`}><span className="block text-sm font-bold text-[#1B2631] truncate underline decoration-dotted underline-offset-2">{displaySafeNickname(f.nickname)}</span></button>
                  : <span className="block text-sm font-bold text-[#1B2631] truncate">{displaySafeNickname(f.nickname)}</span>}
                {publicProfiles[f.uid] && (() => { const pp = publicProfiles[f.uid]; return <>
                  <span className="block truncate text-xs font-bold text-[#425c6d]" data-friend-public>
                    {displaySafePublicText(pp.targetSchool) || '志望校未設定'} · 学習 {formatStudyTime(pp.studySeconds)}{pp.stagesCleared != null ? ` · 達成 ${pp.stagesCleared}` : ''}{pp.level != null ? ` · Lv.${pp.level}` : ''}
                  </span>
                  {pp.motto && <span className="block truncate text-xs font-bold text-[#6b5a3a]">「{displaySafePublicText(pp.motto)}」</span>}
                </>; })()}
              </span>
              <UserSafetyMenu target={{ uid: f.uid, nickname: f.nickname, where: 'friend' }} />
              <button disabled={loading} onClick={() => { if (confirmAction(`${f.nickname} さんとのフレンド関係を解除しますか？`)) runAction(() => removeFriend(f.uid), 'フレンドを解除しました。'); }} className="min-h-11 shrink-0 px-1.5 text-xs font-bold text-red-600 hover:underline disabled:opacity-40">解除</button>
            </div>
          ))
        )}
      </div>
      <UserProfileDialog target={openProfile} onClose={() => setOpenProfile(null)} />
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
