import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { LogOut, Settings, Volume2, VolumeX, LogIn, Users, Check, Loader2, AlertTriangle, School, ClipboardList, Swords } from 'lucide-react';
// ★対戦の音（BGM / 効果音 / 音量）★ 通常 BGM とは別の設定（src/battle/core/audioSettings.ts の説明を参照）
import { useBattleAudioSettings } from '../battle/hooks/useBattleAudio';
import { battleAudio } from '../battle/audio/battleAudio';
import { FriendPanel } from './FriendPanel';
import { ClassPanel } from './ClassPanel';
import { ComingSoon } from './ComingSoon';
import { SOCIAL_FEATURES } from '../config/features';
import type { SubjectKey } from '../data/allChapters';
import { DoorMascot } from './DoorMascot';
import { GoogleMark } from './GoogleLinkBanner';
import { AppleSignInButton } from '../features/auth/AppleSignInButton';
import { signInWithGoogle, signOutGoogle, switchGoogleAccount, GOOGLE_LINK_BENEFITS } from '../utils/googleAuth';
import { useSignInGuard } from '../hooks/useSignInGuard';
import { isFeedbackAdmin } from '../utils/feedbackReply';
// ユーザーごとの localStorage キー名は utils/userStorageKeys.ts が唯一の定義
import { profileKey } from '../utils/userStorageKeys';
import { AccountSafetySection } from '../features/account/AccountSafetySection';
import { useGrowthProgress } from '../hooks/useGrowthProgress';
import { levelOf } from '../battle/core/growth';
import { GrowthAvatar, TitleChip } from '../battle/ui/GrowthParts';
import { fetchMyRankingRow } from '../battle/data/battleRanking';
import './profile-settings.css';
import { ReminderSettings, AnalyticsSetting } from './ReminderSettings';
import { requireLocalStorage } from '../utils/safeLocalStorage';
import { logRejection } from '../utils/reportError';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface ProfileModalProps {
  onClose: () => void;
  /** 最初に開くページ（対戦の「フレンドを追加」から来たときは 'friends'） */
  initialTab?: 'general' | 'friends' | 'class';
  isBgmEnabled: boolean;
  setIsBgmEnabled: (enabled: boolean) => void;
  onToggleBgm?: (enabled: boolean) => void;
  bgmVolume: number;
  setBgmVolume: (volume: number) => void;
  /**
   * 先生ダッシュボードを開く。
   *
   * → なぜホームでなく設定の下に置くのか：
   *   利用者の大半は生徒であり、先生用の入口を目立つ位置に置くと
   *   「自分の成績が見られる画面」と誤解されやすい。
   *   先生は設定を探すことを苦にしないので、ここに置く。
   */
  onOpenTeacherDashboard?: () => void;
  /**
   * フィードバック管理画面（運営専用）を開く。
   * 運営メールでログインしているときだけボタンを出す。
   * （万一開いても Firestore ルールが読み取りを拒否する）
   */
  onOpenFeedbackAdmin?: () => void;
  /** アバター（とびら君）を着せかえる画面を開く */
  onOpenOutfit?: () => void;
  /** 塾クラスの課題の「解く」から演習を始める */
  onStartClassChapter?: (chapterId: string, subject: SubjectKey) => void;
}

type SettingsTab = 'general' | 'friends' | 'class';

export function ProfileModal({ onClose, initialTab, isBgmEnabled, setIsBgmEnabled, onToggleBgm, bgmVolume, setBgmVolume, onOpenTeacherDashboard, onOpenFeedbackAdmin, onOpenOutfit, onStartClassChapter }: ProfileModalProps) {
  const { progress: growth } = useGrowthProgress();
  const [rating, setRating] = useState(1500);
  useEffect(() => { let alive = true; if (auth.currentUser) void fetchMyRankingRow().then(r => { if (alive && r) setRating(r.rating); }).catch(logRejection('profile.fetchRanking')); return () => { alive = false; }; }, []);
  const [tab, setTab] = useState<SettingsTab>(() => (initialTab && initialTab !== 'general' && auth.currentUser ? initialTab : 'general'));
  /** PC の3列レイアウト（profile-settings.css の 1100px と揃える） */
  const wideLayout = useMediaQuery('(min-width: 1100px)');
  const [battleAudioSettings, updateBattleAudio] = useBattleAudioSettings();
  /** 対戦カードのプレビューに出すニックネーム（編集はマイページ） */
  const [name, setName] = useState('');
  /** Google 連携の進行状態（連携／切り替えのどちらでも使う） */
  const { busy: signing, anyBusy: signInBusy, run: runSignIn } = useSignInGuard();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = requireLocalStorage().getItem(profileKey(auth.currentUser?.uid || 'guest'));
      setName(raw ? (JSON.parse(raw).name || '') : (auth.currentUser?.displayName || ''));
    } catch { /* 読めなければ「ニックネーム」と出す */ }
  }, []);

  const toggleBgm = () => {
    const next = !isBgmEnabled;
    if (onToggleBgm) onToggleBgm(next);
    else setIsBgmEnabled(next);
  };

  const logout = async () => {
    await signOutGoogle();
    onClose();
  };

  /** ゲスト → Google 連携（記録はローカルに残るのでそのまま引き継がれる） */
  const linkGoogle = async () => {
    setAuthError(null);
    // 「連携中…」は useSignInGuard が必ず元に戻す（想定外の例外・ブラウザの「戻る」でも）
    const outcome = await runSignIn(signInWithGoogle);
    if (outcome.redirecting) return; // ページ遷移するのでそのまま待つ
    if (!outcome.ok && !outcome.cancelled) setAuthError(outcome.message || 'ログインに失敗しました。');
  };

  const switchAccount = async () => {
    setAuthError(null);
    const outcome = await runSignIn(switchGoogleAccount);
    if (outcome.redirecting) return;
    if (!outcome.ok && !outcome.cancelled) setAuthError(outcome.message || 'ログインに失敗しました。');
  };

  /* ★対戦で相手に見えるカードのプレビュー（A16）★ 名前・称号を変えるとその場で反映される。
     PC の3列（1100px〜）ではプロフィール列が縦に長くなるので、余白のあるサウンド列に置く。 */
  const preview = (
    <section className="ps-preview mt-card" aria-label="対戦で相手に見えるカード">
      <p>対戦で相手に見えるカード</p>
      <div className="ps-mini" aria-hidden="true">
        <span className="ps-mini-avatar"><GrowthAvatar progress={growth} size={44} showLevel={false} /></span>
        <div><strong>{name.trim() || 'ニックネーム'}</strong><span><TitleChip progress={growth} rating={rating} /> Lv.{levelOf(growth.xp).level}</span></div>
        <b>VS</b>
      </div>
    </section>
  );

  return (
    <div className="mtb-page mt-screen profile-journal w-full h-full overflow-hidden pb-[calc(var(--app-nav-h,120px)+8px)] sm:pb-24" data-settings>
      <div className="profile-frame max-w-4xl h-full mx-auto px-3 sm:px-5 py-3 sm:py-5 flex flex-col relative">
        <div className="absolute top-4 right-8 w-40 h-40 bg-[#A9CCE3]/15 rounded-full blur-3xl pointer-events-none" />

        <header className="mt-app-header mb-2 sm:mb-3 relative z-10 shrink-0">
          {/* 上の「＜」（マイページへ戻る）は廃止（2026-10-11）。設定は下のナビから出入りする */}
          {/* 見出しは中央（2026-10-21・マイページとそろえる）。英字のキッカーは外した */}
          <div className="mt-app-header-title"><h2>設定</h2></div>
          <span className="door-mascot-slot"><DoorMascot showSpeech={false} size="mini" className="w-auto -my-2" /></span>
        </header>

        <div className="profile-tabs mt-tabs mb-2 sm:mb-3 relative z-10 shrink-0" role="group" aria-label="設定のページ">
          <button aria-pressed={tab === 'general'} onClick={() => setTab('general')} type="button">
            <Settings size={14} /> 基本設定
          </button>
          <button aria-pressed={tab === 'friends'} onClick={() => setTab('friends')} disabled={!auth.currentUser} type="button">
            <Users size={14} /> フレンド
          </button>
          <button aria-pressed={tab === 'class'} onClick={() => setTab('class')} disabled={SOCIAL_FEATURES.classroom && !auth.currentUser} type="button">
            <School size={14} /> クラス{!SOCIAL_FEATURES.classroom && <span className="soon-tag">準備中</span>}
          </button>
        </div>

        <main className="relative z-10 flex flex-1 min-h-0 flex-col overflow-hidden">
          {tab === 'friends' && auth.currentUser ? (
            <FriendPanel />
          ) : tab === 'class' && !SOCIAL_FEATURES.classroom ? (
            <ComingSoon title="クラス">先生が作ったクラスに参加して、課題や進み具合を共有できるようになります。もうすぐ公開します。</ComingSoon>
          ) : tab === 'class' && auth.currentUser ? (
            <div className="h-full overflow-y-auto no-scrollbar pb-4">
              <ClassPanel defaultDisplayName={name} onStartChapter={onStartClassChapter} />

              {/* 先生用の入口。生徒が誤って開いてもクラス0件の案内が出るだけ。 */}
              {onOpenTeacherDashboard && (
                <button
                  onClick={onOpenTeacherDashboard}
                  className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-[#4A7FA0]"
                >
                  <ClipboardList size={14} />
                  先生の方はこちら（クラスの管理）
                </button>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col gap-2">
            <div className="profile-workspace flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 overflow-y-auto md:overflow-hidden no-scrollbar">
              <div className="ps-col-profile space-y-2 sm:space-y-3">
                {/* 2026-10-21：「アカウント・プロフィール」はマイページへ移した（名前・学年・志望校・公開設定など）。
                    ここには対戦で相手に見えるカードのプレビューだけ残す */}
                {!wideLayout && preview}
              </div>

              <div className="ps-col-app space-y-2 sm:space-y-3 flex flex-col">
                <h3 className="ps-group-title">アプリ（サウンド）</h3>
                <section className="ps-sound mt-card" aria-label="サウンド">
                  <Toggle label="BGM" checked={isBgmEnabled} onChange={toggleBgm} icon={isBgmEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />} />
                  <Volume label="BGM音量" value={bgmVolume} onChange={setBgmVolume} />
                  <p className="ps-sub"><Swords size={14} aria-hidden="true" />対戦モードの音</p>
                  <Toggle label="対戦効果音" sub="正解・逆転など" checked={battleAudioSettings.sfx} onChange={() => { updateBattleAudio({ sfx: !battleAudioSettings.sfx }); if (!battleAudioSettings.sfx) window.setTimeout(() => battleAudio().play('correct'), 50); }} tone="gold" />
                </section>
                <h3 className="ps-group-title">通知</h3>
                <section className="ps-sound mt-card" aria-label="通知">
                  <ReminderSettings />
                </section>
                {wideLayout && preview}
              </div>

              <div className="ps-col-account space-y-2 sm:space-y-3 flex flex-col">
                <h3 className="ps-group-title">アカウント連携</h3>
                <section className="ps-account mt-card space-y-2" aria-label="アカウント連携">
                  {!auth.currentUser ? (
                    /* 未連携：連携の「得」を具体的に見せてから押してもらう。
                       ボタンは Google のブランドガイドに近い白地＋Gマークで、
                       「見慣れた形」にして心理的なハードルを下げる。 */
                    <div className="space-y-2">
                      {/* 利点の一覧は押したら開く（設定画面を縦に長くしない） */}
                      <details className="ps-benefits rounded-xl bg-[#FBE0E9]/40 border border-[#F4A9C4]/50 px-2.5">
                        <summary className="text-xs font-bold text-[#1B2631]">連携するとできること（オンライン対戦・記録の引き継ぎ など）</summary>
                        <ul className="space-y-1 pb-2.5">
                          {GOOGLE_LINK_BENEFITS.map((benefit) => (
                            <li key={benefit} className="flex items-start gap-1.5 text-xs text-[#5D6D7E] leading-snug">
                              <Check size={13} className="shrink-0 mt-[1px] text-[#D9466E]" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                      <button
                        onClick={linkGoogle}
                        disabled={signInBusy}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-gray-300 text-[#1B2631] text-xs font-bold shadow-sm disabled:opacity-50"
                      >
                        {signing ? <Loader2 size={15} className="animate-spin" /> : <GoogleMark size={17} />}
                        {signing ? '連携中…' : 'Google アカウントで連携'}
                      </button>
                      <AppleSignInButton onResult={(o) => { if (!o.ok && !o.cancelled) setAuthError(o.message || 'ログインに失敗しました。'); }} />
                      <p className="text-xs text-gray-500 text-center leading-snug">
                        連携は無料です。いまの学習記録はそのまま引き継がれます。
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-gray-400 truncate px-1">{auth.currentUser.email}</p>
                      {/* 運営専用：フィードバック管理（返信フォーム）への入口。
                          運営メールでログインしているときだけ見える。 */}
                      {onOpenFeedbackAdmin && isFeedbackAdmin(auth.currentUser) && (
                        <button onClick={onOpenFeedbackAdmin} className="compact-action bg-[#FBE0E9]/60 text-[#D9466E] border border-[#F4A9C4]/60">
                          <ClipboardList size={15} />フィードバック管理（返信）
                        </button>
                      )}
                      <button onClick={logout} disabled={signInBusy} className="compact-action bg-red-50 text-red-600 border border-red-100 disabled:opacity-50"><LogOut size={15} />ログアウト</button>
                      <button onClick={switchAccount} disabled={signInBusy} className="compact-action bg-blue-50 text-blue-600 border border-blue-100 disabled:opacity-50">
                        {signing ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
                        {signing ? '切り替え中…' : 'アカウントを切り替え'}
                      </button>
                    </>
                  )}
                  {authError && (
                    <div role="alert" className="flex items-start gap-1.5 rounded-xl bg-[#FDEDEC] border border-[#E74C3C]/40 px-2.5 py-2 text-xs leading-snug text-[#C0392B]">
                      <AlertTriangle size={14} className="shrink-0 mt-[1px]" />
                      <span>{authError}</span>
                    </div>
                  )}
                </section>

                <h3 className="ps-group-title">その他・データ</h3>
                <section className="ps-sound mt-card" aria-label="使われ方の記録">
                  <AnalyticsSetting />
                </section>
                <AccountSafetySection onDeleted={onClose} />

                {/* ※「お問い合わせの送信状態」の欄は廃止した。
                    送信に失敗した分は localStorage のキューに残り、
                    App.tsx の起動時・オンライン復帰時に自動で再送されるため、
                    利用者が手動で診断・復旧操作をする必要がない。 */}

              </div>
            </div>
              {/* 保存ボタンは下に置いておく（名前を変えたのに保存し忘れる、を防ぐ）。
                  2026-10-11：右の列の中で sticky にしていたため、スマホでは列の頭までスクロールしないと出てこなかった。
                  スクロールする箱の外（すぐ下）に出し、いつでも画面の下に見えるようにする */}
              {/* 2026-10-21：保存が必要だったのはプロフィールだけ（マイページへ移した）。音・通知などはその場で保存されるので、保存バーは置かない */}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/**
 * ★トグル（A12）★ つまみは必ずトラックの内側（幅48・高さ28、つまみ22・余白3）。
 * 以前は translate-x-5 の移動量がトラック幅と合っておらず、ON でつまみが外へはみ出していた。
 */
function Toggle({ label, sub, checked, onChange, icon, tone = 'blue' }: { label: string; sub?: string; checked: boolean; onChange: () => void; icon?: React.ReactNode; tone?: 'blue' | 'gold' }) {
  return <div className="ps-toggle-row">
    {icon && <span className="ps-toggle-icon" data-on={checked || undefined}>{icon}</span>}
    <div className="ps-toggle-text"><p>{label}</p>{sub && <small>{sub}</small>}</div>
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange} className="ps-switch" data-tone={tone}><span /></button>
  </div>;
}

/** ★音量スライダー（A13）★ 塗りつぶしたトラックを見せ、値は%で表示する。 */
function Volume({ label, value, onChange, onCommit, tone = 'blue' }: { label: string; value: number; onChange: (v: number) => void; onCommit?: () => void; tone?: 'blue' | 'gold' }) {
  const pct = Math.round(value * 100);
  return <div className="ps-volume" data-tone={tone}>
    <VolumeX size={16} aria-hidden="true" />
    <input aria-label={label} type="range" min="0" max="1" step="0.01" value={value} onInput={(e) => onChange(e.currentTarget.valueAsNumber)} onChange={(e) => onChange(e.currentTarget.valueAsNumber)} onPointerUp={onCommit} onKeyUp={onCommit} style={{ '--ps-fill': `${pct}%` } as React.CSSProperties} />
    <Volume2 size={16} aria-hidden="true" />
    <output>{pct}%</output>
  </div>;
}
