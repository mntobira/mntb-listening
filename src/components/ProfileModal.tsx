import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { ChevronLeft, ChevronDown, Pencil, User, LogOut, Flame, BookOpen, Clock, GraduationCap, Compass, Settings, Volume2, VolumeX, LogIn, Users, Save, Check, Loader2, AlertTriangle, School, ClipboardList, Swords, Shirt } from 'lucide-react';
// ★対戦の音（BGM / 効果音 / 音量）★ 通常 BGM とは別の設定（src/battle/core/audioSettings.ts の説明を参照）
import { useBattleAudioSettings } from '../battle/hooks/useBattleAudio';
import { battleAudio } from '../battle/audio/battleAudio';
import { FriendPanel } from './FriendPanel';
import { ClassPanel } from './ClassPanel';
import { DoorMascot } from './DoorMascot';
import { GoogleMark } from './GoogleLinkBanner';
import { signInWithGoogle, signOutGoogle, switchGoogleAccount, GOOGLE_LINK_BENEFITS } from '../utils/googleAuth';
import { isFeedbackAdmin } from '../utils/feedbackReply';
import { syncRankingNickname } from '../utils/leaderboard';
import { ensureFriendProfile } from '../utils/friends';
// ユーザーごとの localStorage キー名は utils/userStorageKeys.ts が唯一の定義
import { profileKey, streakKey, completedKey } from '../utils/userStorageKeys';
import { checkNickname, NICKNAME_MAX } from '../features/safety/nicknameFilter';
import { AccountSafetySection } from '../features/account/AccountSafetySection';
import { AppleSignInButton } from '../features/auth/AppleSignInButton';
import { useGrowthProgress } from '../hooks/useGrowthProgress';
import { BADGES, levelOf } from '../battle/core/growth';
import { GrowthAvatar, TitleChip } from '../battle/ui/GrowthParts';
import { fetchMyRankingRow } from '../battle/data/battleRanking';
import { readStudyTime, formatStudyTime } from '../utils/studyTime';
import './profile-settings.css';

interface ProfileModalProps {
  onClose: () => void;
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
}

type SettingsTab = 'general' | 'friends' | 'class';

export function ProfileModal({ onClose, isBgmEnabled, setIsBgmEnabled, onToggleBgm, bgmVolume, setBgmVolume, onOpenTeacherDashboard, onOpenFeedbackAdmin, onOpenOutfit }: ProfileModalProps) {
  const { progress: growth } = useGrowthProgress();
  const [rating, setRating] = useState(1500);
  useEffect(() => { let alive = true; if (auth.currentUser) void fetchMyRankingRow().then(r => { if (alive && r) setRating(r.rating); }).catch(() => {}); return () => { alive = false; }; }, []);
  const [studySeconds] = useState(() => readStudyTime(auth.currentUser?.uid || 'guest').total);
  const earnedBadges = BADGES.filter(b => b.id in growth.badges);
  const [tab, setTab] = useState<SettingsTab>('general');
  const [battleAudioSettings, updateBattleAudio] = useBattleAudioSettings();
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [stream, setStream] = useState('science');
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  /** Google 連携の進行状態（連携／切り替えのどちらでも使う） */
  const [signing, setSigning] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const uid = auth.currentUser?.uid || 'guest';
      const localProfile = localStorage.getItem(profileKey(uid));
      if (localProfile) {
        const data = JSON.parse(localProfile);
        setName(data.name || '');
        setGrade(data.grade || '');
        setStream(data.stream || 'science');
      } else {
        setName(auth.currentUser?.displayName || (auth.currentUser ? 'ユーザー' : 'ゲスト'));
        setGrade('高校生');
      }
      setStreak(parseInt(localStorage.getItem(streakKey(uid)) || '0', 10));
      setCompletedCount(JSON.parse(localStorage.getItem(completedKey(uid)) || '[]').length);
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
    }
  }, []);

  /** 名前の安全チェック（他人の画面に出るので、使えない名前は保存させない） */
  const nameCheck = checkNickname(name);

  const handleSave = async () => {
    if (!nameCheck.ok) return;
    setLoading(true);
    try {
      const uid = auth.currentUser?.uid || 'guest';
      localStorage.setItem(profileKey(uid), JSON.stringify({
        name: name.trim(), grade: grade.trim(), stream, iconUrl: auth.currentUser?.photoURL || '',
      }));
      // 名前を変えたら、ランキング・フレンド検索の表示名もその場で最新化する。
      // これまでは「次にスコアを出すまで」旧名のままで、
      // 「プロフィールを変えたのにランキングが変わらない」と混乱させていた。
      // 通信失敗しても保存自体は成功として扱う（次回ログイン時に再同期される）。
      if (auth.currentUser) {
        void syncRankingNickname().catch(() => {});
        void ensureFriendProfile().catch(() => {});
      }
      onClose();
    } catch (error) {
      console.error('保存エラー:', error);
    } finally {
      setLoading(false);
    }
  };

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
    setSigning(true);
    setAuthError(null);
    const outcome = await signInWithGoogle();
    if (outcome.redirecting) return; // ページ遷移するのでそのまま待つ
    setSigning(false);
    if (!outcome.ok) setAuthError(outcome.message || 'ログインに失敗しました。');
  };

  const switchAccount = async () => {
    setSigning(true);
    setAuthError(null);
    const outcome = await switchGoogleAccount();
    if (outcome.redirecting) return;
    setSigning(false);
    if (!outcome.ok) setAuthError(outcome.message || 'ログインに失敗しました。');
  };

  return (
    <div className="mtb-page profile-journal w-full h-[100dvh] bg-[#FDFBF7] font-handwriting overflow-hidden pb-20 sm:pb-24">
      <div className="max-w-4xl h-full mx-auto px-3 sm:px-5 py-3 sm:py-5 flex flex-col relative">
        <div className="absolute top-4 right-8 w-40 h-40 bg-[#A9CCE3]/15 rounded-full blur-3xl pointer-events-none" />

        <header className="mtb-page-header flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 relative z-10 shrink-0">
          <button onClick={onClose} className="p-2 bg-white border border-gray-200 text-gray-500 rounded-xl shadow-sm" aria-label="設定を閉じる">
            <ChevronLeft size={19} />
          </button>
          <div className="w-8 h-8 rounded-xl bg-[#2C3E50]/5 text-[#2C3E50] flex items-center justify-center"><Settings size={17} /></div>
          <div><p className="mtb-kicker">MY ACCOUNT</p><h2 className="text-lg sm:text-xl font-bold text-[#1B2631]">アプリ設定</h2></div>
          <DoorMascot showSpeech={false} size="mini" className="w-auto ml-auto -my-2" />
        </header>

        <div className="profile-tabs mtb-tabs grid grid-cols-3 gap-1.5 bg-white/70 border border-gray-200 rounded-2xl p-1.5 mb-2 sm:mb-3 relative z-10 shrink-0">
          <button aria-pressed={tab === 'general'} onClick={() => setTab('general')} className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${tab === 'general' ? 'bg-[#1B2631] text-white shadow-sm' : 'text-gray-500'}`}>
            <Settings size={14} /> 基本設定
          </button>
          <button aria-pressed={tab === 'friends'} onClick={() => setTab('friends')} disabled={!auth.currentUser} className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 ${tab === 'friends' ? 'bg-[#D9466E] text-white shadow-sm' : 'text-gray-500'}`}>
            <Users size={14} /> フレンド
          </button>
          <button aria-pressed={tab === 'class'} onClick={() => setTab('class')} disabled={!auth.currentUser} className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 ${tab === 'class' ? 'bg-[#4A7FA0] text-white shadow-sm' : 'text-gray-500'}`}>
            <School size={14} /> クラス
          </button>
        </div>

        <main className="relative z-10 flex-1 min-h-0">
          {tab === 'friends' && auth.currentUser ? (
            <FriendPanel />
          ) : tab === 'class' && auth.currentUser ? (
            <div className="h-full overflow-y-auto no-scrollbar pb-4">
              <ClassPanel defaultDisplayName={name} />

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
            <div className="profile-workspace h-full grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 overflow-y-auto md:overflow-hidden no-scrollbar">
              <div className="space-y-2 sm:space-y-3">
                {/* ★プロフィールカード（A14）★ アバター・レベル/称号・連続日数・学習時間・バッジを1枚に。
                    「学習状況」と「プロフィール」の2枚に分かれていたものをまとめ、縦を詰める。 */}
                <section className="ps-card" aria-label="プロフィール">
                  <div className="ps-card-top">
                    <div className="ps-avatar">
                      <GrowthAvatar progress={growth} size={72} />
                      {onOpenOutfit && <button type="button" className="ps-avatar-edit" onClick={onOpenOutfit} aria-label="アバターを変更（きせかえ）"><Shirt size={15} aria-hidden="true" /><span>変更</span></button>}
                    </div>
                    <div className="ps-id">
                      <label className="ps-name">
                        <span className="sr-only">ニックネーム</span>
                        <input value={name} maxLength={NICKNAME_MAX} onChange={(event) => setName(event.target.value)} placeholder="ニックネーム" aria-invalid={!!name.trim() && !nameCheck.ok} aria-describedby="nickname-help" />
                        <Pencil size={16} aria-hidden="true" />
                      </label>
                      <div className="ps-rank"><TitleChip progress={growth} rating={rating} size="md" /><span>Lv.{levelOf(growth.xp).level}</span></div>
                    </div>
                  </div>
                  {/* 注意書きは名前に問題があるときだけ出す（普段は入力欄の説明＝aria で伝える） */}
                  <p id="nickname-help" role={name.trim() && !nameCheck.ok ? 'alert' : undefined} className="ps-help" data-error={(name.trim() && !nameCheck.ok) || undefined}>
                    {name.trim() && !nameCheck.ok ? nameCheck.message : '名前は対戦・ランキングで表示されます（本名・連絡先は不可）'}
                  </p>
                  <dl className="ps-stats">
                    <div><dt><Flame size={15} aria-hidden="true" />連続</dt><dd>{streak}<small>日</small></dd></div>
                    <div><dt><Clock size={15} aria-hidden="true" />学習時間</dt><dd>{formatStudyTime(studySeconds)}</dd></div>
                    <div><dt><BookOpen size={15} aria-hidden="true" />修了</dt><dd>{completedCount}<small>章</small></dd></div>
                  </dl>
                  <div className="ps-badges" aria-label={`獲得バッジ ${earnedBadges.length}個`}>
                    <span>バッジ {earnedBadges.length}/{BADGES.length}</span>
                    {earnedBadges.length === 0 ? <small>対戦や復習で集まります</small> : earnedBadges.slice(0, 4).map(b => <i key={b.id} title={b.desc}>{b.label}</i>)}
                    {earnedBadges.length > 4 && <small>ほか{earnedBadges.length - 4}個</small>}
                  </div>
                  <div className="ps-fields">
                    <label className="ps-select"><GraduationCap size={15} aria-hidden="true" /><span className="sr-only">学年</span>
                      <input value={grade} onChange={(event) => setGrade(event.target.value)} placeholder="学年（例：高校1年）" /><Pencil size={15} aria-hidden="true" />
                    </label>
                    <label className="ps-select"><Compass size={15} aria-hidden="true" /><span className="sr-only">文理</span>
                      <select value={stream} onChange={(event) => setStream(event.target.value)}>
                        <option value="science">理系</option>
                        <option value="humanities">文系</option>
                        <option value="other">その他</option>
                      </select><ChevronDown size={16} aria-hidden="true" />
                    </label>
                  </div>
                </section>

                {/* ★対戦で相手に見えるカードのプレビュー（A16）★ 名前・称号を変えるとその場で反映される */}
                <section className="ps-preview" aria-label="対戦で相手に見えるカード">
                  <p>対戦で相手に見えるカード</p>
                  <div className="ps-mini" aria-hidden="true">
                    <span className="ps-mini-avatar"><GrowthAvatar progress={growth} size={44} showLevel={false} /></span>
                    <div><strong>{name.trim() || 'ニックネーム'}</strong><span><TitleChip progress={growth} rating={rating} /> Lv.{levelOf(growth.xp).level}</span></div>
                    <b>VS</b>
                  </div>
                </section>
              </div>

              <div className="space-y-2 sm:space-y-3 flex flex-col">
                <section className="ps-sound" aria-label="サウンド">
                  <h3>サウンド</h3>
                  <Toggle label="BGM" sub="学習中の音楽" checked={isBgmEnabled} onChange={toggleBgm} icon={isBgmEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />} />
                  {isBgmEnabled && <Volume label="BGM音量" value={bgmVolume} onChange={setBgmVolume} />}
                  <p className="ps-sub"><Swords size={14} aria-hidden="true" />対戦モードの音</p>
                  <Toggle label="対戦BGM" sub="試合中・最終問題で変化" checked={battleAudioSettings.bgm} onChange={() => updateBattleAudio({ bgm: !battleAudioSettings.bgm })} tone="gold" />
                  <Toggle label="対戦効果音" sub="正解・逆転など" checked={battleAudioSettings.sfx} onChange={() => { updateBattleAudio({ sfx: !battleAudioSettings.sfx }); if (!battleAudioSettings.sfx) window.setTimeout(() => battleAudio().play('correct'), 50); }} tone="gold" />
                  {(battleAudioSettings.bgm || battleAudioSettings.sfx) && <Volume label="対戦の音量" value={battleAudioSettings.volume} onChange={(v) => updateBattleAudio({ volume: v })} onCommit={() => battleAudio().play('tap')} tone="gold" />}
                </section>

                <section className="bg-white border border-gray-150 p-3 rounded-2xl shadow-sm space-y-2 flex-1">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">アカウント</h3>
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
                        disabled={signing}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-gray-300 text-[#1B2631] text-xs font-bold shadow-sm disabled:opacity-50"
                      >
                        {signing ? <Loader2 size={15} className="animate-spin" /> : <GoogleMark size={17} />}
                        {signing ? '連携中…' : 'Google アカウントで連携'}
                      </button>
                      <AppleSignInButton onResult={(o) => { if (!o.ok) setAuthError(o.message || 'ログインに失敗しました。'); }} />
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
                      <button onClick={logout} disabled={signing} className="compact-action bg-red-50 text-red-600 border border-red-100 disabled:opacity-50"><LogOut size={15} />ログアウト</button>
                      <button onClick={switchAccount} disabled={signing} className="compact-action bg-blue-50 text-blue-600 border border-blue-100 disabled:opacity-50">
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

                <AccountSafetySection onDeleted={onClose} />

                {/* ※「お問い合わせの送信状態」の欄は廃止した。
                    送信に失敗した分は localStorage のキューに残り、
                    App.tsx の起動時・オンライン復帰時に自動で再送されるため、
                    利用者が手動で診断・復旧操作をする必要がない。 */}

                {/* 保存ボタンは下に貼り付けておく（名前を変えたのに保存し忘れる、を防ぐ） */}
                <div className="ps-savebar grid grid-cols-[1fr_2fr] gap-2 shrink-0">
                  <button onClick={onClose} className="min-h-11 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-500">キャンセル</button>
                  <button onClick={handleSave} disabled={loading || !nameCheck.ok} className="min-h-11 rounded-xl bg-[#2C3E50] text-white text-xs font-bold disabled:opacity-40 flex items-center justify-center gap-1.5"><Save size={14} />{loading ? '保存中…' : '設定を保存'}</button>
                </div>
              </div>
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
    <input aria-label={label} type="range" min="0" max="1" step="0.01" value={value} onChange={(e) => onChange(parseFloat(e.target.value))} onPointerUp={onCommit} onKeyUp={onCommit} style={{ '--ps-fill': `${pct}%` } as React.CSSProperties} />
    <Volume2 size={16} aria-hidden="true" />
    <output>{pct}%</output>
  </div>;
}

function Stat({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: string; color: string; bg: string }) {
  return <div className={`${bg} rounded-xl p-2 flex items-center gap-2`}><span className={color}>{icon}</span><div><p className="text-xs text-gray-500 font-bold">{label}</p><p className="text-base font-bold text-[#1B2631] leading-tight">{value}</p></div></div>;
}

function CompactField({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="relative flex items-center rounded-xl border border-gray-200 bg-gray-50"><span className="absolute left-3 text-gray-400 pointer-events-none">{icon}</span>{children}</div>;
}
