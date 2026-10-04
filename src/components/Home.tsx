import './home-legibility.css';
import './home-pillars.css';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronRight, Edit3, BarChart3, ShieldCheck, Repeat2, Bell, Volume2, VolumeX, Swords, Trophy, Store, Shirt, Award, Target, Zap } from 'lucide-react';
import { auth } from '../firebase';
import { useGrowthProgress } from '../hooks/useGrowthProgress';
import { equippedPoseSrc, equippedFrameColor, equippedFramePattern, levelOf, equippedTitleLabel } from '../battle/core/growth';
import { TobiraAccessories } from '../battle/ui/TobiraAccessories';
import type { GrowthPage } from './GrowthHub';
const GrowthHomeStrip = React.lazy(() => import('../battle/ui/GrowthHomeStrip').then(m => ({ default: m.GrowthHomeStrip })));
/*
 * 教科IDの型だけは data/allChapters.ts が唯一の定義。
 *
 * ★必ず `import type` と書くこと（`import { type SubjectKey }` にしないこと）★
 * 後者の書き方だと、型しか使っていなくてもモジュールの解決自体は行われ、
 * バンドラは data/allChapters.ts →（6教科ぶんの教科データ）を
 * 起動時の読み込みに含めてしまう。
 * 実測でも `import { type ... }` のままだと src/data 51 ファイル
 * （約 2.66MB）が読み込まれ、索引にした効果が消えていた。
 * `import type` にすると文ごと消えるので、教科データは読み込まれない。
 */
import type { SubjectKey } from '../data/allChapters';
/*
 * ★ホームは教科データ本体を読まない（軽い索引だけを読む）★
 *
 * ■ 以前の作り
 *   ここで getChaptersOfSubject / SUBJECTS を呼んで章オブジェクトを
 *   そのまま受け取っていた。章オブジェクトには問題文・選択肢・解説が
 *   全部ぶら下がっているため、依存を辿ると起動時に
 *     src/data から 50 ファイル / 2,637,176 バイト
 *   が読み込まれていた。問題を1問足すたびにこの数字が増える。
 *
 * ■ ところがホームは問題文を1文字も表示していない
 *   出しているのは「大問 12 / 174 問」という数字と、
 *   「次の章：○○ から始めよう」という章名だけ。
 *   つまり必要なのは ★章ID・章名・その章の大問数★ の3つだけである。
 *
 * ■ そこで軽い索引に切り替えた
 *   data/chapterIndex.generated.ts は上の3つだけを持つ自動生成ファイルで、
 *   全6教科・162章ぶんで 24,972 バイト（約 1/106）。
 *   中身は章の数ぶんしか無いので、問題を何問足しても大きさは変わらない。
 *   索引が本体とズレていないことは tests/chapterIndex.test.ts が
 *   1件ずつ突き合わせて検査している（再生成を忘れたら落ちる）。
 *
 * ■ 画面の見た目は変えていない
 *   索引のフィールド名（id / title / abstractTitle）は
 *   章オブジェクトのものと同じにしてあるので、描画のコードは元のまま。
 *   数え方も data/problemCount.ts と同一（索引生成時に同じ式で数え、
 *   一致をテストで検査している）。
 *
 * ■ 教科データ本体が必要な処理は1つだけ残っている
 *   旧データからの引き継ぎ（backfillLegacyProgress）は大問の実体が
 *   必要なので索引では代われない。ただしこれは1人につき生涯1回だけの
 *   処理なので、下の useEffect で「まだ引き継いでいない人にだけ」
 *   その場で読み込む形にした（動的 import）。
 */
import {
  SUBJECT_INDEX,
  getChapterIndexOfSubject,
} from '../data/chapterIndex.generated';
// 公開/非公開の判断は src/config/features.ts が唯一の出どころ
import { isSubjectEnabled } from '../config/features';
import { getDaysUntilExam, EXAM_DATE_LABEL } from '../utils/examCountdown';
import { getDueCount } from '../utils/reviewList';
import { TobiraBuddy } from './TobiraBuddy';
import { SpinMascot } from './SpinMascot';
import { streakDoors } from '../data/tobiraMood';
import { CountUp } from './ui/CountUp';
import { FeedbackButton } from './FeedbackButton';
import { FeedbackReplyInbox } from './FeedbackReplyInbox';
import { GoogleLinkBanner } from './GoogleLinkBanner';
import {
  isLegacyProgressBackfilled,
  countSolvedByChapter,
  countSolvedProblemsIn,
} from '../utils/progress';
// ユーザーごとの localStorage キー名は utils/userStorageKeys.ts が唯一の定義
import { profileKey, streakKey, lastActiveKey, completedKey } from '../utils/userStorageKeys';
import { loadSchoolBrand } from '../utils/classroom';
import { UpdateNoticeModal } from './UpdateNoticeModal';
import { unreadNoticeCount, refreshRemoteNotices } from '../utils/updateNotices';
import { readJsonArray } from '../utils/safeLocalStorage';

interface HomeProps {
  onStart: () => void;
  /** ホームの「演習する」→ 科目選択（演習する）画面 */
  onPractice?: () => void;
  onGrowth?: (page: GrowthPage) => void;
  onPickSubject?: (subject: string) => void;
  onStudyMode?: (mode: 'practice' | 'learning' | 'mini_test') => void;
  onIntro: () => void;
  onNoteList: () => void;
  onLogicalTree: () => void;
  onLeaderboard?: () => void;
  /** 対戦モードを開く。FEATURES.battle が false のときは渡されない */
  onBattle?: () => void;
  /**
   * 高校入試 理科（演習・まとめ・出題傾向）を開く。
   *
   * ★科目カードではなくホームの入口にした理由★
   *   理科は本体の「章→大問→小問」の形を持っていない。
   *   単元の絞り込みも問題の出し方も理科の画面が自分で持っているので、
   *   科目選択のカードに並べると、押した先で1問も出せない状態になる。
   *   （詳しくは src/features/rika/RikaHome.tsx）
   *
   * ★省略可にしてある理由★
   *   Home はテストやプレビューからも描画される。
   *   必須にすると呼び出し側すべてに手を入れることになる。
   *   渡されなければカードを出さない（＝従来どおりの見た目）。
   *   FEATURES.rika が false のときは App 側で渡さない。
   */
  onRika?: () => void;
  onReviewList?: () => void;
  /** 科目選択（タイトル）画面へ戻る */
  onChangeSubject?: () => void;
  /** 英文法・英単語を固めるページを開く（無ければ onChangeSubject＝科目選択へ） */
  onFoundation?: () => void;
  /** 現在選択中の科目名（表示用） */
  subjectLabel?: string;
  /** 現在選択中の科目。省略時は従来どおり化学基礎として振る舞う。 */
  subject?: SubjectKey;
  isGuest: boolean;
  /*
    ===== BGM の ON/OFF をヘッダーから切り替えられるようにする =====

    ■ なぜ設定画面だけでは足りないのか
      音は「いま鳴っている」ときに止めたいものなので、
        ナビ → 設定 → スクロール → トグル
      という4手を踏ませるのは実質「止められない」に等しい。
      鳴っていることに気づいた画面で1タップで止められる必要がある。

    ■ なぜ「省略可」なのか
      Home は他の場所（テスト・プレビュー）からも描画される。
      必須にすると呼び出し側すべてに手を入れることになり、
      今回の指摘とは無関係な変更が広がる。
      渡されなければボタンを出さない（＝従来どおりの見た目）。
  */
  isBgmEnabled?: boolean;
  /** フェードで音が消えた状態。ラベルを「もう一度鳴らす」に変えるため。 */
  isBgmFadedOut?: boolean;
  onToggleBgm?: (enabled: boolean) => void;
}

export function Home({ onPractice, onPickSubject, onStudyMode, onGrowth, onStart, onIntro, onNoteList, onLogicalTree, onLeaderboard, onBattle, onRika, onChangeSubject, onFoundation, subjectLabel = '化学基礎', subject = 'chemistry_basic', isGuest, isBgmEnabled, isBgmFadedOut, onToggleBgm }: HomeProps) {
  const { progress: growth } = useGrowthProgress();
  const reviewDueCount = useMemo(() => {
    const uid = auth.currentUser?.uid || (isGuest ? 'guest' : null);
    return getDueCount(uid);
  }, [isGuest]);
  const [profile, setProfile] = useState<any>(null);

  /**
   * ホワイトレーベル：クラスに参加している生徒には学校名を掲げる。
   *
   * localStorage から同期的に読むのは、起動直後に一瞬だけ
   * 既定ブランドが見えてから学校名に差し替わるチラつきを避けるため。
   * 未参加の生徒（大半）には何も出ない。
   */
  const schoolBrand = useMemo(() => loadSchoolBrand(), []);

  // ===== お知らせ（更新履歴）=====
  // 未読件数は localStorage を見るだけなので同期的に初期化できる。
  // モーダルを閉じたときに 0 件へ更新してバッジを消す。
  const [showNotices, setShowNotices] = useState(false);
  const progressDialog = useRef<HTMLDialogElement>(null);
  const [unreadCount, setUnreadCount] = useState(() => unreadNoticeCount());
  // 運営のお知らせ（Firestore）が届いたら未読数を更新する（取れなければ同梱分のまま）。
  useEffect(() => { let alive = true; void refreshRemoteNotices().then(() => { if (alive) setUnreadCount(unreadNoticeCount()); }); return () => { alive = false; }; }, []);

  // Real stats state
  const [streak, setStreak] = useState(0);
  /** とびら君の気分用：前回からの日数（はじめては -1） */
  const [daysAway, setDaysAway] = useState(0);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  // ===== 学習進捗（大問ベース） =====
  // 分母：全章の「大問」数（miniTest ＋ practiceProblems）。
  //   以前は miniTest の「小問」数だけを分母にしていたため、
  //   演習（practiceProblems＝大問の大多数）が丸ごと抜け落ちていた。
  // 分子：1点でも獲得した大問の数（utils/progress の台帳を参照）。
  // 科目に応じて集計対象の章を切り替える（化学基礎の振る舞いは従来のまま）。
  // 未知の科目IDが来た場合は化学基礎の章が返る（従来の if 連鎖の既定分岐と同じ）。
  //
  // 中身は軽い索引（章ID・章名・大問数のみ）。教科データ本体は読まない。
  const allChaptersList = useMemo(() => getChapterIndexOfSubject(subject), [subject]);
  const totalQuestions = useMemo(
    () => allChaptersList.reduce((sum, c) => sum + c.problemCount, 0),
    [allChaptersList],
  );
  const [solvedQuestions, setSolvedQuestions] = useState(0);
  /** 章ID → その章で解いた大問数（「次の章」の算出に使う） */
  const [solvedByChapter, setSolvedByChapter] = useState<Record<string, number>>({});

  // ===== 科目ごとの進捗（「何問中何問」を教科別に見せる） =====
  // 従来は選択中の科目の1本だけを表示していたため、
  // 他の科目の進み具合を見るには科目を切り替える必要があった。
  // ここで全科目分をまとめて作り、カード内に並べて出す。
  // 並ぶ順・表示名・対象の章は索引がそのまま決める（並び順は data/allChapters.ts の
  // SUBJECTS と同一で、一致は tests/chapterIndex.test.ts が検査している）。
  // 教科を追加したときにここへ書き足す必要は無い。
  // ★ここは「4箇所」のうちの4番目（一覧・検索結果）★
  // 非公開の科目は進捗一覧にも出さない。
  // 出してしまうと「数学 0/48問」のように見えて、
  // タップできないのに存在だけ知られる＝一番中途半端な状態になる。
  // 判断は src/config/features.ts の1か所だけを見る。
  const subjectProgressDefs = useMemo(
    () =>
      SUBJECT_INDEX.filter((s) => isSubjectEnabled(s.id)).map((s) => ({
        id: s.id,
        label: s.label,
        chapters: s.chapters,
      })),
    [],
  );
  /** 科目ID → { solved, total } */
  const [subjectProgress, setSubjectProgress] = useState<
    Record<string, { solved: number; total: number }>
  >({});

  useEffect(() => {
    const fetchProfileAndStats = async () => {
      try {
        const uid = auth.currentUser ? auth.currentUser.uid : 'guest';

        // Load Profile Name/Details
        const localProfile = localStorage.getItem(profileKey(uid));
        if (localProfile) {
          setProfile(JSON.parse(localProfile));
        } else {
          setProfile({ name: auth.currentUser ? (auth.currentUser.displayName || 'ユーザー') : 'ゲスト' });
        }

        // Calculate streak
        const lastActive = localStorage.getItem(lastActiveKey(uid));
        const storedStreak = parseInt(localStorage.getItem(streakKey(uid)) || '0', 10);

        const today = new Date().toDateString();
        setDaysAway(lastActive ? Math.max(0, Math.round((new Date(today).getTime() - new Date(lastActive).getTime()) / 86_400_000)) : -1);
        if (lastActive === today) {
          setStreak(storedStreak);
        } else {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (lastActive === yesterday.toDateString()) {
            const newStreak = storedStreak + 1;
            setStreak(newStreak);
            localStorage.setItem(streakKey(uid), newStreak.toString());
            localStorage.setItem(lastActiveKey(uid), today);
          } else {
            setStreak(1);
            localStorage.setItem(streakKey(uid), '1');
            localStorage.setItem(lastActiveKey(uid), today);
          }
        }

        /*
         * 解いた大問数をカウント（1点でも取れた大問＝進捗）。
         * 初回だけ旧データ（quiz_run_* / quiz_answers_* / completed_*）から引き継ぐ。
         *
         * ■ ここだけは教科データ本体が必要
         *   引き継ぎは「小問IDから、それが属する大問IDを引く」処理なので、
         *   大問の実体（subQuestions）が要る。軽い索引では代われない。
         *
         * ■ ただし1人につき生涯1回しか走らない
         *   済んだかどうかは localStorage のフラグで覚えている。
         *   以前は毎回この関数を呼んでいたため、2回目以降の起動では
         *   「読み込んだ教科データ 約2.6MB を、何もせず捨てる」
         *   ということが毎回起きていた。
         *
         *   そこで先にフラグだけを見て、
         *     ・まだの人   → その場で教科データを読み込んで引き継ぐ（従来と同じ）
         *     ・済んだ人   → 何も読み込まない
         *   と分けた。大多数の起動は後者になる。
         *
         * ■ 順番は変えていない（ここが大事）
         *   引き継ぎは「進捗を数える前」に終わっている必要がある。
         *   先に数えてしまうと、引き継ぎ直後の1回だけ古い数字が出て、
         *   あとから増えるという不自然な見え方になる。
         *   そのため await して、引き継ぎが終わってから数える。
         *   （待つのは「まだの人」の初回だけ。済んだ人は待たない）
         *
         * ■ 渡す章は従来と同一
         *   以前も選択中の教科の章だけを渡していた（全教科ではない）。
         *   getChaptersOfSubject(subject) はまさにそれと同じものを返す。
         */
        if (!isLegacyProgressBackfilled(uid)) {
          try {
            const [{ getChaptersOfSubject }, { backfillLegacyProgress }] = await Promise.all([
              import('../data/allChapters'),
              import('../utils/progress'),
            ]);
            backfillLegacyProgress(uid, getChaptersOfSubject(subject));
          } catch {
            /* 引き継ぎに失敗しても現在の進捗表示は続行する */
          }
        }
        // 選択中の科目の進捗。
        // countSolvedProblems は全科目の合計を返すため、そのまま使うと
        // 「化学基礎 174問中 180問」のように分母を超えることがあった。
        // 対象の章に限って数える countSolvedProblemsIn を使う。
        const currentChapterIds = allChaptersList.map((c) => c.id);
        setSolvedQuestions(
          Math.min(countSolvedProblemsIn(uid, currentChapterIds), totalQuestions),
        );
        setSolvedByChapter(countSolvedByChapter(uid));

        // 科目ごとの進捗（教科別に「何問中何問」を並べて出すため）
        const perSubject: Record<string, { solved: number; total: number }> = {};
        subjectProgressDefs.forEach((def) => {
          // 索引が持っている大問数を足すだけ（数え方は data/problemCount.ts と同一。
          // 一致は tests/chapterIndex.test.ts が検査している）。
          const total = def.chapters.reduce((sum, c) => sum + c.problemCount, 0);
          const solved = Math.min(
            countSolvedProblemsIn(uid, def.chapters.map((c) => c.id)),
            total,
          );
          perSubject[def.id] = { solved, total };
        });
        setSubjectProgress(perSubject);

        // completed chapters（次の章を求めるために継続利用）
        const completed = readJsonArray<string>(completedKey(uid));
        setCompletedIds(completed);

      } catch (error) {
        console.error("プロフィール・統計情報取得エラー:", error);
      }
    };

    fetchProfileAndStats();
    // subject を足したのは、引き継ぎに渡す章を subject から引き直すようにしたため。
    // allChaptersList は subject から作られているので、実際に再実行される回数は従来と同じ。
  }, [isGuest, subject, allChaptersList, totalQuestions, subjectProgressDefs]);

  const todayStr = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
  const todayFormatted = todayStr.replace(/\//g, '.');

  // 共通テストまでの残り日数
  const daysUntilExam = useMemo(() => getDaysUntilExam(), []);


  // 「次の章」を算出（学習進捗カードの状況別コピー用）
  // 大問をすべて解き終えた章は飛ばし、まだ残っている最初の章を提示する。
  // （completed_ は「ミニテストを通した」履歴でしかなく、
  //   演習の進捗を反映しないため、台帳側の章ごと件数を併せて見る）

  // 「次のマイルストーン」を算出（連続学習カード用）

  const greetingName = profile?.name || 'ゲスト';

  const progressPercent = totalQuestions > 0 ? Math.round(solvedQuestions / totalQuestions * 100) : 0;
  const bgmPlaying = !!isBgmEnabled && !isBgmFadedOut;
  const bgmLabel = !isBgmEnabled ? 'BGMを鳴らす' : isBgmFadedOut ? 'BGMをもう一度鳴らす' : 'BGMを止める';

  return (
    <div className="home-lobby arena-home game-home h-full min-h-0 relative">
      <div className="home-lobby-lines" aria-hidden="true" />
      <div className="game-home-viewport">
        <header className="game-home-header">
          <div><h1><img className="game-home-logo" src="/brand/manatobi-logo.webp" width={1008} height={321} alt="マナトビ" /></h1><p title={`${greetingName}さんのホーム`}>{greetingName}さんのホーム</p></div>
          <div className="game-home-tools">
            <button type="button" onClick={() => onToggleBgm?.(!isBgmEnabled || !!isBgmFadedOut)} aria-label={bgmLabel}>{bgmPlaying ? <Volume2 size={19} /> : <VolumeX size={19} />}</button>
            <button type="button" onClick={() => setShowNotices(true)} aria-label="お知らせを開く"><Bell size={19} />{unreadCount > 0 && <i />}</button>
          </div>
        </header>
        {onGrowth && <React.Suspense fallback={<div className="game-hud-placeholder">成長記録を読み込んでいます…</div>}>
          <GrowthHomeStrip expanded homeLayout onProfile={() => onGrowth('outfit')} onShop={() => onGrowth('shop')} onGacha={() => onGrowth('gacha')}
            onBadges={() => onGrowth('badges')} onMissions={() => onGrowth('missions')} onWallet={() => onGrowth('overview')} />
        </React.Suspense>}
        <section className="game-mascot-stage" aria-label="とびら君のホームステージ">
          <div className="game-stage-backdrop" aria-hidden="true"><i /><i /><i /></div>
          {/* ★とびら君は「住人」（2026-10-01）★ 状態（はじめて・久しぶり・復習待ち・連続）で言うことが変わる。しっぽ付きの吹き出し */}
          <TobiraBuddy className="game-stage-say" figure={false} bubble="top" input={{ screen: 'home', streak, dueCount: reviewDueCount, solved: solvedQuestions, daysAway: Math.max(0, daysAway), firstVisit: (daysAway < 0 || (streak <= 1 && solvedQuestions === 0 && !completedIds.length)) && growth.loginDays <= 1 && growth.matches === 0 && growth.studySolved === 0 && growth.rushPlays === 0, isGuest, loginDays: growth.loginDays, seed: new Date().getDate() }} />
          {growth && equippedTitleLabel(growth) && <p className="game-stage-caption">{equippedTitleLabel(growth)}</p>}
          <div className="game-stage-floor" aria-hidden="true"><div className="game-equipped-ring" data-frame-pattern={growth ? equippedFramePattern(growth) : 'plain'} style={{borderColor: growth ? equippedFrameColor(growth) : undefined}} /><Swords /></div>
          {/* ★2026-10-01 D：とびら君をドラッグで回せる（モンスト風）★ ちょんと押すと今までどおり着せ替え */}
          {growth && <div className="game-mascot-button" data-home-mascot>
            <SpinMascot className="home-mascot-wrap" label="とびら君（左右にドラッグで回す・押すと着せ替え）" onTap={onGrowth ? () => onGrowth('outfit') : undefined}>
              <img className="home-mascot-art" src={equippedPoseSrc(growth)} alt="あなたのとびら君" draggable={false} /><TobiraAccessories progress={growth} />
            </SpinMascot>
            <span>MY TOBIRA <b>Lv.{levelOf(growth.xp).level}</b></span>
          </div>}
          {onGrowth && <div className="game-stage-shortcuts" aria-label="ゲームメニュー">
            {/* ガチャは下のナビにあるので、ここはランキング（2026-10-04） */}
            <button className="stage-gacha" type="button" onClick={onLeaderboard} aria-label="ランキングを見る"><Trophy /><span>ランキング</span></button>
            <button className="stage-shop" type="button" onClick={() => onGrowth('shop')}><Store /><span>ショップ</span></button>
            <button className="stage-outfit" type="button" onClick={() => onGrowth('outfit')}><Shirt /><span>きせかえ</span></button>
            <button className="stage-badges" type="button" onClick={() => onGrowth('badges')}><Award /><span>称号</span></button>
          </div>}
        </section>
        {/* ★ホームの3本柱（2026-10-01）★
            演習する（ひとりで学ぶ）／対戦する（ひとりで・みんなで）を同じ大きさで左右に、
            その下に復習ノート（苦手をなくす）を横長で。科目の帯は「演習する」の中（科目選択）へ移した。 */}
        <section className={`game-action-deck home-pillars ${!onBattle ? 'without-battle' : ''}`} aria-label="学習の入口" data-home-arena={onBattle ? '' : undefined}>
          <button type="button" className="home-pillar home-pillar-solo game-solo" data-home-practice onClick={onPractice ?? (() => (onStudyMode ? onStudyMode('practice') : onStart()))}>
            <span className="home-pillar-icon" aria-hidden="true"><Edit3 /></span><strong>演習する</strong><small>ひとりで学ぶ</small>
          </button>
          {onBattle && <button type="button" onClick={onBattle} className="home-pillar home-pillar-battle home-battle-button" aria-label="対戦する（ひとりで・みんなで）" data-home-battle>
            <span className="home-pillar-icon" aria-hidden="true"><Swords /></span><strong>対戦する</strong><small>ひとりで・みんなで</small>
          </button>}
        </section>
        <section className="home-review-rush" aria-label="復習と短時間チャレンジ">
        <button type="button" className="home-review-wide game-review" aria-label={`復習ノート（苦手をなくす）${reviewDueCount > 0 ? `・今日の復習 ${reviewDueCount}問` : ''}`} onClick={onNoteList} data-home-review>
          <span className="home-pillar-icon" aria-hidden="true"><Repeat2 /></span>
          <span className="home-review-text"><strong>復習ノート</strong><small>苦手をなくす</small></span>
          {reviewDueCount > 0 ? <b>今日 {reviewDueCount}問</b> : <ChevronRight aria-hidden="true" />}
        </button>
          {onGrowth && <button type="button" className="home-rush-card" onClick={() => onGrowth('rush')} aria-label="マナラッシュ（60秒チャレンジ）を開く" data-home-rush><Zap size={20} /><span><strong>マナラッシュ</strong><small>60秒チャレンジ</small></span></button>}
        </section>
        <div className="game-home-utility arena-home-bottom">
          {onGrowth && <button type="button" onClick={() => onGrowth('missions')}><Target size={17} />ミッション</button>}
          <button type="button" onClick={() => progressDialog.current?.showModal()} aria-haspopup="dialog"><BarChart3 size={17} />学習状況</button>
          <button type="button" aria-label="アプリ紹介を開く" onClick={onIntro}><ShieldCheck size={17} />使い方</button>
        </div>
        <section className="desktop-study-summary" aria-label="今日の学習状況">
          <p>STUDY DESK</p><h2>今日の積み重ね</h2>
          <div><span>連続学習<strong><CountUp value={streak} /><small>日</small></strong></span><span>復習待ち<strong><CountUp value={reviewDueCount} /><small>問</small></strong></span></div>
          {/* ★連続日数は炎ではなく「開いた扉」で★ 1日＝扉1枚。7枚より先は数字で */}
          <p className="study-doors" aria-label={`連続学習 ${streak}日`}>{Array.from({ length: 7 }, (_, i) => <i key={i} data-open={i < streakDoors(streak).doors || undefined} />)}{streakDoors(streak).extra > 0 && <b>+{streakDoors(streak).extra}</b>}</p>
          <label>{subjectLabel}の進捗 <b>{solvedQuestions} / {totalQuestions} 大問</b></label>
          <div className="mt-progress" role="progressbar" aria-label={`${subjectLabel}の学習進捗`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}><i style={{ width: `${progressPercent}%` }} /></div>
          {/* ゼロには次の一手を */}
          {reviewDueCount === 0 && <p className="study-next">{solvedQuestions === 0 ? '最初の1問で、扉がひとつ開くよ' : '復習はゼロ。新しい大問に進もう'}</p>}
          <button type="button" onClick={() => progressDialog.current?.showModal()}>学習記録を見る <ChevronRight size={16} /></button>
        </section>
      </div>
      <dialog ref={progressDialog} className="game-details-dialog" aria-labelledby="home-progress-title">
        <header><h2 id="home-progress-title">学習状況・その他</h2><button type="button" onClick={() => progressDialog.current?.close()} autoFocus>閉じる</button></header>
        <div className="game-details-body arena-home-more"><p>連続学習 {streak}日 ／ {todayFormatted}</p><p>{EXAM_DATE_LABEL}まで {daysUntilExam}日</p>{schoolBrand && <p>{schoolBrand.schoolName}</p>}
          <div className="game-study-progress"><span>{subjectLabel} {solvedQuestions}/{totalQuestions}大問</span><div role="progressbar" aria-label="学習進捗" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}><i style={{ width: `${progressPercent}%` }} /></div></div>
          <details className="home-all-progress"><summary>リスニングの進捗を見る</summary>{subjectProgressDefs.map(def => <p key={def.id}>{def.label} {subjectProgress[def.id]?.solved ?? 0}/{subjectProgress[def.id]?.total ?? 0}大問</p>)}</details>
          {onRika && <button type="button" onClick={onRika}>高校入試 理科を開く</button>}
          <FeedbackButton screen="title" variant="text" label="ご意見・ご要望" /><FeedbackReplyInbox />
          {isGuest && !auth.currentUser && <GoogleLinkBanner variant="inline" dismissible />}
        </div>
      </dialog>
      {showNotices && <UpdateNoticeModal onClose={() => { setShowNotices(false); setUnreadCount(unreadNoticeCount()); }} />}
    </div>
  );
}
