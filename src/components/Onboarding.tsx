/**
 * ===================================================================
 * オンボーディング（初回起動時のログイン → プロフィール設定）
 * ===================================================================
 *
 * ■ 設計方針：Google アカウント連携を「主動線」にする
 *   学習記録・連続日数・ランキング・フレンドはすべてアカウントに
 *   紐づくため、ゲスト利用のままだと
 *     ・端末を変えると記録がゼロに戻る
 *     ・ブラウザのデータを消すと記録が消える
 *     ・ランキングやフレンドが使えない
 *   という不利益が後から発覚する。あとで「知らなかった」と
 *   なるのを防ぐため、この画面では
 *     ① 連携で何が得られるかを先に具体的に見せる
 *     ② Google 連携ボタンを主ボタン（大・カラー）にする
 *     ③ ゲストは「あとで連携できる」ことを添えた副action に落とす
 *   の3点を徹底する。
 *
 * ■ popup が塞がれた環境への対応
 *   utils/googleAuth.ts が popup → redirect の切り替えを吸収する。
 *   リダイレクトから戻ったときの結果もここで受け取る。
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Loader2, AlertTriangle, Check, ArrowRight } from 'lucide-react';
import { auth, FIREBASE_CONFIGURED, USE_EMULATORS } from '../firebase';
import { signInWithGoogle, consumeGoogleRedirectResult, GOOGLE_LINK_BENEFITS, isInAppBrowser } from '../utils/googleAuth';
import { syncRankingNickname } from '../utils/leaderboard';
// ユーザーごとの localStorage キー名は utils/userStorageKeys.ts が唯一の定義
import { profileKey } from '../utils/userStorageKeys';
import { GoogleMark } from './GoogleLinkBanner';
import { AppleSignInButton } from '../features/auth/AppleSignInButton';

interface OnboardingProps {
  onComplete: () => void;
  onGuest: () => void;
}

export function Onboarding({ onComplete, onGuest }: OnboardingProps) {
  const [step, setStep] = useState<'login' | 'profile'>('login');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [stream, setStream] = useState('science');
  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestConfirm, setGuestConfirm] = useState(false);

  const inAppBrowser = isInAppBrowser();

  // リダイレクト方式で戻ってきた場合の結果を受け取る
  useEffect(() => {
    let cancelled = false;
    consumeGoogleRedirectResult().then((user) => {
      if (!cancelled && user) checkProfile(user);
    });
    return () => { cancelled = true; };
  }, []);

  const checkProfile = (user: any) => {
    try {
      const localProfile = localStorage.getItem(profileKey(user.uid));
      if (localProfile) {
        onComplete();
      } else {
        setName(user.displayName || '');
        setStep('profile');
      }
    } catch {
      // localStorage が使えない環境でも、プロフィール入力へは進める
      setName(user.displayName || '');
      setStep('profile');
    }
  };

  const handleLogin = async () => {
    setSigning(true);
    setError(null);
    const outcome = await signInWithGoogle();
    if (outcome.redirecting) return; // ページ遷移するのでそのまま待つ
    setSigning(false);
    if (outcome.ok && outcome.user) {
      checkProfile(outcome.user);
      return;
    }
    setError(outcome.message || 'ログインに失敗しました。');
  };

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      localStorage.setItem(profileKey(auth.currentUser.uid), JSON.stringify({
        name,
        grade,
        stream,
        iconUrl: auth.currentUser.photoURL || '',
      }));
      // 初回に決めた名前もランキング側へ即反映（失敗しても進行は止めない）
      void syncRankingNickname().catch(() => {});
      onComplete();
    } catch (saveError: any) {
      setError('プロフィールの保存に失敗しました。' + String(saveError?.message || ''));
    } finally {
      setLoading(false);
    }
  };

    /* items-center → items-safe-center。
        スクロールする箱（overflow-y-auto）に中央寄せを付けると、
        中身が画面より高いとき ★上にはみ出した分へスクロールで到達できない★。
        ここは名前・学年などの入力欄が並ぶので、縦の短いパソコンや
        キーボードが出た状態では実際にはみ出す。
        safe 付きなら「収まるときは中央・はみ出すときは上端」に自動で
        切り替わるので、見た目を変えずに一番上まで読める。
        （定義は index.css 13.5 節） */
  return (
    <div className="fixed inset-0 z-[100] flex items-safe-center justify-center overflow-y-auto bg-gradient-to-b from-[#FFF1F5] via-[#FDFBF7] to-[#F8E7EE] p-4 font-handwriting">
      {/* ノート罫線の背景 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: 'linear-gradient(transparent calc(2.5rem - 1px), #F0C7D2 calc(2.5rem - 1px))',
          backgroundSize: '100% 2.5rem',
        }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 my-auto w-full max-w-md rounded-[26px] border border-[#F4A9C4]/55 bg-white/95 p-6 shadow-[0_22px_54px_-22px_rgba(217,70,110,0.5)] backdrop-blur-sm sm:p-7"
      >
        {step === 'login' ? (
          <>
            <h2 className="text-center text-2xl font-bold text-[#1B2631] sm:text-[28px]">ようこそ！</h2>{!FIREBASE_CONFIGURED && !USE_EMULATORS && <p role="status">設定前のプレビューです。ゲストで演習・AI対戦を試せます。オンライン対戦には専用Firebaseの設定が必要です。</p>}
            {/* ★説明文を書き換えた理由★
                以前は「学習記録を守るため、連携をおすすめしています」だけで、
                ★アプリの主機能である対戦に一言も触れていなかった★。

                対戦は Firestore のルール上、uid を持たないゲストでは
                どうやっても部屋に入れない（＝連携しないと存在しない機能）。
                「おすすめ」ではなく「対戦するなら必要」なので、
                そう書く。おすすめだと思って断った人が、あとで
                対戦を押して弾かれるのが一番よくない。

                ★「学習だけならゲストでもできる」も明記している★
                対戦を前に出すことと、学習を隠すことは別。
                連携したくない人の逃げ道を隠すと、ただの強制になる。 */}
            <p className="mt-2 text-center text-[12px] font-modern leading-relaxed text-[#5D6D7E]">
              <b className="text-[#2E86C1]">オンライン対戦</b>と学習記録の引き継ぎには
              <b className="text-[#D9466E]">Google アカウントでの連携</b>が必要です。
            </p>

            {/* 連携で得られること（抽象論にせず具体的に示す） */}
            <ul className="mt-4 space-y-1.5 rounded-2xl border border-[#F4A9C4]/45 bg-[#FFF7FA] px-4 py-3">
              {GOOGLE_LINK_BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-[11.5px] font-modern leading-snug text-[#5D6D7E]">
                  <Check size={14} className="mt-[1px] shrink-0 text-[#E8688E]" aria-hidden="true" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            {/* アプリ内ブラウザは Google ログイン自体が使えないため先に案内する */}
            {inAppBrowser && (
              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-[#FF9F43]/60 bg-[#FFF4E5] px-3.5 py-3">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#E67E22]" aria-hidden="true" />
                <p className="text-[11px] font-modern leading-relaxed text-[#7E5109]">
                  LINE や Instagram などの<b>アプリ内ブラウザ</b>では Google ログインが利用できません。
                  右上のメニューから「ブラウザで開く」を選び、Safari や Chrome で開き直してください。
                </p>
              </div>
            )}

            {/* ===== 主ボタン：Google 連携 ===== */}
            <button
              onClick={handleLogin}
              disabled={signing}
              className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-2xl border border-[#DADCE0] bg-white px-4 py-3.5 text-[14px] font-bold text-[#3C4043] shadow-[0_10px_24px_-14px_rgba(60,64,67,0.45)] transition-all hover:bg-[#F8F9FA] hover:shadow-[0_12px_28px_-14px_rgba(60,64,67,0.5)] disabled:opacity-50"
            >
              {signing
                ? <><Loader2 size={19} className="animate-spin" aria-hidden="true" />連携中…</>
                : <><GoogleMark size={20} />Google アカウントで続ける</>}
            </button>
            <AppleSignInButton
              className="mt-2.5 !rounded-2xl !min-h-[50px] !text-[14px]"
              label="Appleで続ける"
              onResult={(o) => { if (o.ok && o.user) checkProfile(o.user); else setError(o.message || 'ログインに失敗しました。'); }}
            />
            <p className="mt-2 text-center text-[10.5px] font-modern leading-snug text-[#8895A0]">
              メールアドレスとお名前のみを利用します。パスワードは受け取りません。
            </p>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-[#E74C3C]/40 bg-[#FDEDEC] px-3.5 py-3" role="alert">
                <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[#C0392B]" aria-hidden="true" />
                <p className="text-[11px] font-modern leading-relaxed text-[#C0392B]">{error}</p>
              </div>
            )}

            {/* ===== 副action：ゲスト利用（不利益を隠さず1度だけ確認する） ===== */}
            <div className="mt-5 border-t border-dashed border-[#E4E8EC] pt-4">
              {!guestConfirm ? (
                <button
                  onClick={() => setGuestConfirm(true)}
                  className="w-full rounded-xl py-2 text-[11.5px] font-bold text-[#8895A0] underline decoration-dotted underline-offset-4 transition-colors hover:text-[#5D6D7E]"
                >
                  連携せずにゲストとして試す
                </button>
              ) : (
                <div className="rounded-2xl border border-[#E4E8EC] bg-[#F7F9FA] px-3.5 py-3">
                  {/* ★「対戦は使えない」を先頭に出した理由★
                      以前は「ランキングやフレンドは使えません」だけで、
                      対戦が使えないことを書いていなかった。
                      ゲストで始めた人はホームの一番上に対戦のボタンを
                      見つけて押し、そこで初めて弾かれることになる。
                      ★押す前に分かるようにするのが正しい★ */}
                  <p className="text-[11px] font-modern leading-relaxed text-[#5D6D7E]">
                    ゲスト利用では<b className="text-[#1B2631]">オンライン対戦・ランキング・フレンドが使えません</b>。
                    学習記録も<b className="text-[#1B2631]">この端末の中だけ</b>に保存され、ブラウザのデータを消すと消えます。
                    <br />
                    <span className="text-[#8895A0]">※ 学習（問題を解く・解説を読む）はゲストのままでも全部できます。あとから設定画面でいつでも連携でき、記録はそのまま引き継がれます。</span>
                  </p>
                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setGuestConfirm(false)}
                      className="rounded-xl border border-[#F4A9C4]/60 bg-white py-2 text-[11.5px] font-bold text-[#D9466E] transition-colors hover:bg-[#FFF3F7]"
                    >
                      連携に戻る
                    </button>
                    <button
                      onClick={onGuest}
                      className="flex items-center justify-center gap-1 rounded-xl border border-[#E4E8EC] bg-white py-2 text-[11.5px] font-bold text-[#8895A0] transition-colors hover:bg-[#F2F4F5]"
                    >
                      ゲストで始める<ArrowRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-center text-2xl font-bold text-[#1B2631] sm:text-[26px]">プロフィール設定</h2>
            <p className="mt-2 text-center text-[11.5px] font-modern leading-relaxed text-[#5D6D7E]">
              連携が完了しました。表示名と学年を設定して始めましょう。
            </p>

            <div className="mt-5 space-y-2.5">
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="ニックネーム"
                className="w-full rounded-2xl border border-[#E4E8EC] bg-white px-4 py-3 text-[14px] font-modern text-[#1B2631] placeholder:text-[#B8C4CE] focus:border-[#E8688E] focus:outline-none focus:ring-2 focus:ring-[#FBE0E9]"
              />
              <input
                type="text"
                value={grade}
                onChange={(event) => setGrade(event.target.value)}
                placeholder="学年（例：高校1年）"
                className="w-full rounded-2xl border border-[#E4E8EC] bg-white px-4 py-3 text-[14px] font-modern text-[#1B2631] placeholder:text-[#B8C4CE] focus:border-[#E8688E] focus:outline-none focus:ring-2 focus:ring-[#FBE0E9]"
              />
              <select
                value={stream}
                onChange={(event) => setStream(event.target.value)}
                className="w-full cursor-pointer appearance-none rounded-2xl border border-[#E4E8EC] bg-white px-4 py-3 text-[14px] font-modern text-[#1B2631] focus:border-[#E8688E] focus:outline-none focus:ring-2 focus:ring-[#FBE0E9]"
              >
                <option value="science">理系（化学・物理など）</option>
                <option value="humanities">文系（社会・国語など）</option>
                <option value="other">その他</option>
              </select>
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-[#E74C3C]/40 bg-[#FDEDEC] px-3.5 py-3" role="alert">
                <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[#C0392B]" aria-hidden="true" />
                <p className="text-[11px] font-modern leading-relaxed text-[#C0392B]">{error}</p>
              </div>
            )}

            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E8688E] to-[#D9466E] py-3.5 text-[14px] font-bold text-white shadow-[0_12px_28px_-14px_rgba(217,70,110,0.9)] transition-colors hover:from-[#E0567F] hover:to-[#C93C61] disabled:opacity-50"
            >
              {/* ★文言を変えた理由★
                  連携まで済ませた人が最後に押すボタンが
                  「学習をはじめる」だった。
                  ここまでの画面で「オンライン対戦には連携が必要です」と
                  説明して同意してもらったのに、
                  最後の一押しだけ学習の話に戻っていた。
                  行き先はホーム（対戦と学習の両方がある）なので、
                  ★両方あることが分かる言葉にする★。
                  学習を消したわけではない（両方書いている）。 */}
              {loading
                ? <><Loader2 size={17} className="animate-spin" aria-hidden="true" />保存中…</>
                : <>対戦と学習をはじめる<ArrowRight size={17} aria-hidden="true" /></>}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
