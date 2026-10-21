import { useBattleAudio } from '../hooks/useBattleAudio';
/**
 * ===================================================================
 * BattleResult — リザルト画面
 * ===================================================================
 *
 * ★1問ずつの内訳を必ず出す理由★
 * 点数だけを出すと「なぜ負けたのか」が分からず、
 * 速さボーナスがあるゲームでは特に不透明に見える。
 * 「正解したか」「何秒だったか」「速さで何点もらったか」を並べると、
 * 負けた側も納得できるし、次にどこを縮めればよいか分かる。
 *
 * ★レートの増減を「相手のレート」と一緒に見せる理由★
 * Elo では強い相手に勝つと大きく増える。
 * 相手のレートを出さないと、増減の大きさが理由なく変わって見える。
 *
 * ★無効試合をはっきり書く理由★
 * 両者の申告が食い違ったときはレートを動かさない設計になっている。
 * 黙って0のままにすると「レートが反映されないバグ」に見える。
 *
 * -------------------------------------------------------------------
 * ★★「答え＋ひと言の理由＋この単元を演習する」を出す理由（請求⑦-A）★★
 * -------------------------------------------------------------------
 * このアプリの構造は
 *
 *     ① オンライン対戦  ⇒  ② 演習・インプット
 *
 * である。①だけで終わると「楽しかった」で終わり、
 * 間違えた問題は間違えたままになる。
 * 負けた直後は「なんでこれが答えなの」がいちばん知りたい瞬間なので、
 * そこで ★答え・ひと言の理由・その単元の演習への入口★ を並べる。
 *
 * ■ ★なぜ試合中ではなく試合後なのか★
 *   試合中に理由まで出すと、画面を見せ合える環境（同じ教室）で
 *   相手に答えが渡る。だから解答は試合が終わってからまとめて出す。
 *
 * ■ ★答えのデータをここで動的 import する理由★
 *   1行解答（oneLine）は出題プールとは別のファイルに分けてある
 *   （data/answer.<教科>.generated.ts）。出題プールは対戦開始前に
 *   読み込まれるので、そこに答えを混ぜると通信を覗くだけで
 *   全問の答えが読めてしまう。この画面が出た時点ではもう試合は
 *   終わっているので、ここで初めて読む。
 *
 * ■ 読み込みに失敗しても画面は壊さない
 *   答えが出ないだけで、点数・レート・1問ずつの内訳は今までどおり出る。
 *   （リザルトが真っ白になるほうが、答えが出ないよりはるかに悪い）
 */

import { TobiraBuddy } from '../../components/TobiraBuddy';
import { CinematicClip, CINEMATIC_CLIPS } from '../../components/CinematicClip';
import { useEffect, useState } from 'react';
import './battle-result-review.css';
import { BattleGrowthReward, type GrowthReward } from './BattleGrowthReward';
import { BattleGrowthCard } from './BattleGrowthCard';
import { recordLocalBattle } from '../data/localBattleLog';
import { recordStudyLog } from '../../utils/studyLog';
import { auth } from '../../firebase';
import { ShareButton } from './GrowthFx';
import { equippedTitleLabel, levelOf, shareTextForMatch } from '../core/growth';
import { Home as HomeIcon, DoorOpen } from 'lucide-react';
import { BattleMissions } from './BattleMissions';
import { BattleProfile } from './BattleProfile';
import { showInterstitialAd } from '../../utils/adService';
import type { CSSProperties } from 'react';
import {
  ArrowLeft,
  ClipboardList,
  Swords,
  Minus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { subjectTheme } from '../../data/subjectTheme';
// 外部教科（本体に教科データを持たない教科）の単元名
import { externalChapterTitleOf, isBattleOnlySubject } from '../../data/externalSubjects';
import type { SubjectKey } from '../../data/allChapters';
import type {
  BattlePlayerScore,
  BattleQuestion,
  BattleResultSummary,
} from '../core/types';
import { ratingTitle } from '../data/battleRanking';
/**
 * ★章名は「軽い索引」から引く（教科データ本体を読まない）★
 * data/chapterIndex.generated.ts は章ID・章名・大問数だけを持つ自動生成ファイルで、
 * 何も import しない葉モジュールである。ここで allChapters（約2.6MB）を
 * 引き込むと、対戦モードのチャンクに教科データ全部が入ってしまう。
 */
import { getChapterIndexOfSubject } from '../../data/chapterIndex.generated';
import {
  AMBER,
  BattleButton,
  BattleShell,
  GOLD,
  INK,
  INK_SUB,
  LINE,
  PlayerBadge,
  WRONG,
} from './BattleParts';
/**
 * ★臨場感アップデート（試合終了演出）★
 * WIN/LOSE/DRAW の大見出し・統計・XP・間違えた問題のまとめ・「復習する」。
 * 既存の「1問ずつの内訳」「レート」「この単元を演習する」はそのまま残す。
 */
import {
  kanaTextOf,
  OutcomeHero,
  pickReviewQuestions,
  ResultActions,
  ResultStats,
  useOutcomeJingle,
} from './BattleResultLive';
import { UserSafetyMenu } from '../../features/safety/UserSafetyMenu';
import { BattleResultReviewSection, useBattleReviewState } from './BattleResultReviewSection';

function ScoreColumn({
  score,
  label,
  color,
}: {
  score: BattlePlayerScore | null;
  label: string;
  color: string;
}) {
  return (
    <div className="flex-1 text-center">
      <p className="text-xs font-black" style={{ color: INK_SUB }}>
        {label}
      </p>
      <p className="battle-pop text-3xl font-black tabular-nums" style={{ color }}>
        {score?.score ?? 0}
      </p>
      <p className="text-xs font-bold" style={{ color: INK_SUB }}>
        {score ? `${score.correctCount}問せいかい` : '—'}
      </p>
    </div>
  );
}

export function BattleResult({
  result,
  questions,
  subject,
  opponent,
  meNickname,
  mePhotoURL,
  rating,
  byForfeit,
  maskOpponent,
  onRematch,
  rematchLabel = 'もう1回たいせん',
  onChangeSubject,
  onPlayAgain,
  playAgainLabel = '同じ単元でもう1回',
  onExit,
  onPractice: onPracticeProp,
  ratingNote,
  myRating,
  growthMatchId, growthOwnerUid, growthEligible = false, onOpenProfile, onOpenMissions,
  onReview,
  onRetryWrong,
  retryMode = false,
  myAnsweredIndexes = [],
  matchKey,
  onBackToRoom,
  backToRoomLabel = '部屋に戻って問題を選ぶ',
  onHome,
}: {
  result: BattleResultSummary;
  questions: BattleQuestion[];
  subject: string;
  opponent: { uid?: string; nickname: string; photoURL: string; rating: number } | null;
  meNickname: string;
  mePhotoURL?: string;
  /** レート変化。無効試合・未反映のときは null */
  rating: { before: number; after: number } | null;
  byForfeit: boolean;
  /** 全国対戦なら相手の名前を隠す */
  maskOpponent: boolean;
  onRematch?: () => void;
  /**
   * 「もう1回」ボタンの文言。
   * フレンド戦の onRematch は「同じ科目で新しい部屋を作る」処理で、
   * 同じ相手との再戦ではない（相手には招待コードを渡し直す必要がある）。
   * 押す前にそれが分かるよう、呼び出し側が実際の動きに合った文言を渡す。
   * 省略時は AI 戦などそのまま再戦できる場合の文言。
   */
  rematchLabel?: string;
  /** 2026-10-02：別の単元・教科でもう一度（教科選びへ） */
  onChangeSubject?: () => void;
  /** 同じ相手・同じ単元以外の「もう一戦」（例：AI戦で同じ設定のまま次の試合） */
  onPlayAgain?: () => void;
  playAgainLabel?: string;
  onExit: () => void;
  /**
   * ★「この単元を演習する」を押したとき（請求⑦-A）★
   *
   * 対戦（①）から演習（②）へ渡す橋。渡されなかったときはボタンを出さない
   * （＝この画面だけでは演習画面に行けないので、出すと押しても何も起きない）。
   * chapterId は BattleQuestion がそのまま持っている元データの章IDなので、
   * 受け側は既存の handleSelectChapter にそのまま流せる。
   */
  onPractice?: (subject: string, chapterId: string, problemId?: string, subQuestionId?: string) => void;
  /**
   * レートが動かない理由の説明（AI 対戦など）。
   * 渡されると「無効試合」ではなくこの文を出す。
   * ★無効試合と区別する理由★
   * AI 戦でレートが動かないのは仕様であり、故障でも不正でもない。
   * 「無効試合」と出すと、利用者は何か失敗したと受け取る。
   */
  ratingNote?: string;
  /** レートが動かない試合（AI など）で見せる、いまのレート */
  myRating?: number;
  growthMatchId?: string;
  growthOwnerUid?: string;
  growthEligible?: boolean;
  onOpenProfile?: () => void;
  onOpenMissions?: () => void;
  /**
   * ★「復習する」を押したとき★
   * 間違えた問題を復習リストに入れたあと、アプリ本体の学習ノート（復習タブ）へ移る。
   * 渡されなければボタンを出さない。
   */
  onReview?: () => void;
  /** 「間違えた問題だけ再対戦」（AI 相手で、間違えた問題だけをもう一度） */
  onRetryWrong?: (subject: string, ids: string[]) => void;
  /** いまの試合が「間違えた問題だけ再対戦」か */
  retryMode?: boolean;
  /** 自分が回答した問題番号（平均回答時間は回答した問題だけで出す） */
  myAnsweredIndexes?: number[];
  /** XP を同じ試合で2回足さないための鍵（部屋IDなど） */
  matchKey?: string;
  /**
   * ★詳しい結果 → 「部屋に戻って問題を選ぶ」（2026-10-04）★
   * 対戦の部屋（始まる前の画面：教科・単元・問題数・強さを選ぶところ）へ戻る。
   * 次の問題はそこで選び直すので、結果画面には「同じ相手と」「強さを変える」「ほかの単元で」を並べない。
   */
  onBackToRoom?: () => void;
  backToRoomLabel?: string;
  /** 「ホームに戻る」（アプリのホーム）。無ければ onExit（対戦メニュー）を使う */
  onHome?: () => void;
}) {
  useBattleAudio('matching');
  /**
   * ★英単語・英熟語（english_vocab）・情報Ⅰ（joho）には演習画面が無い★（isBattleOnlySubject）
   * 外部プールだけで成り立つ対戦専用教科なので、「この問題を演習する」
   * 「つづけて演習する」を出すと押しても何も起きない（App 側で例外になる）。
   * 出さないのが正しい。答えは各問の1行解答（見出し語 ＝ 意味の全文）で見せる。
   */
  const onPractice = isBattleOnlySubject(subject) ? undefined : onPracticeProp;
  const theme = subjectTheme(subject as SubjectKey);
  useOutcomeJingle(result.outcome);
  const picks = pickReviewQuestions(result, questions, kanaTextOf);
  const delta = rating ? rating.after - rating.before : 0;
  const title = ratingTitle(rating?.after ?? 1500);

  /**
   * ★試合後の1行解答（出題ID → 「答え＋ひと言の理由」）★
   *
   * この画面が出たときに初めて読む（対戦前には端末に落ちてこない）。
   * 読み込み前・失敗時は空の Map なので、答えの行が出ないだけで
   * 点数・レート・内訳は今までどおり表示される。
   */
  /**
   * ★結果は2ページ（2026-10-04）★
   *   summary … 勝敗・報酬・点数・レート（ここで止まる。下へ長くスクロールさせない）
   *   detail  … 「詳しい結果を確認する」で開く復習（間違えた問題・1問ずつの答えあわせ・解説）
   *   missions/profile … 結果の上に開く。もどると結果に戻る（以前は対戦メニューへ飛び、復習に戻れなかった）
   */
  const [page, setPage] = useState<'summary' | 'detail' | 'missions' | 'profile'>('summary');
  // ページを切り替えたら必ず先頭から見せる（前のページのスクロール位置が残ると、途中から始まって見える）
  useEffect(() => {
    window.scrollTo?.(0, 0);
    let el: HTMLElement | null = document.querySelector('[data-result-detail-title]') ?? document.querySelector('#battle-shell');
    while (el) { if (el.scrollTop > 0) el.scrollTop = 0; el = el.parentElement; }
    document.scrollingElement && (document.scrollingElement.scrollTop = 0);
  }, [page]);
  const [growth, setGrowth] = useState<GrowthReward | null>(null);
  const wrongIds = result.me.perQuestion.filter((q) => !q.correct).map((q) => questions[q.index]?.id).filter((id): id is string => !!id);
  // 部屋（対戦前の画面）の「さいきんの対戦」に出すため、端末内に1件残す
  useEffect(() => {
    const chapterIds = [...new Set(questions.map((q) => q.chapterId).filter(Boolean))];
    const chapterId = chapterIds.length === 1 ? chapterIds[0] : undefined;
    recordLocalBattle(auth.currentUser?.uid, {
      key: matchKey || `${subject}-${questions[0]?.id ?? ''}-${result.me.score}`,
      subject, chapterId, chapterTitle: chapterId ? chapterTitleOf(chapterId) : undefined,
      outcome: result.outcome, correct: result.me.correctCount, total: result.me.perQuestion.length,
      wrongIds, mode: maskOpponent ? 'national' : (opponent?.uid ? 'friend' : 'ai'), at: Date.now(),
    });
    // ★学習記録（直近3日）★ 対戦で解いた問題と○×も、一人で学ぶと同じ記録に残す
    const modeLabel = maskOpponent ? '全国対戦' : (opponent?.uid ? 'フレンド対戦' : 'AIと対戦');
    const outcomeLabel = result.outcome === 'win' ? '勝ち' : result.outcome === 'lose' ? '負け' : '引き分け';
    recordStudyLog(auth.currentUser?.uid, {
      key: `battle:${matchKey || `${subject}-${questions[0]?.id ?? ''}-${result.me.score}`}`,
      kind: 'battle', at: Date.now(), subject, chapterId,
      title: `${theme.label}${chapterId ? ` ${chapterTitleOf(chapterId)}` : ''}`,
      sub: `${modeLabel}・${outcomeLabel}`, outcome: result.outcome,
      items: result.me.perQuestion.map((pq) => {
        const q = questions[pq.index];
        return { id: q?.id ?? String(pq.index), label: `${pq.index + 1}問目`, correct: !!pq.correct,
          prompt: q ? String(q.prompt || q.label || '').replace(/\s+/g, ' ').slice(0, 60) : undefined,
          answer: !pq.correct && q && q.answerIndex >= 0 ? String(q.options[q.answerIndex] ?? '') : undefined };
      }),
    });
    // 学習記録は1試合につき1回だけ書く（結果の表示が更新されても書き直さない）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchKey]);
  // 答えあわせの状態（いま見ている問・解説の読み込み）。中身は BattleResultReviewSection.tsx（C-09）
  const review = useBattleReviewState(result, subject);

  /**
   * 出題に出た章（重複を除く・出た順）。
   * 「この単元を演習する」の行をここから作る。
   *
   * ★間違えた章だけに絞らない理由★
   * 全問正解した試合でも「もっとやる」入口は要る。
   * ただし ★間違えた章を先に並べる★（下の sort）。いま直したいのはそこだから。
   */
  /**
   * 章ID → 章名（軽い索引から作る。無い章は章IDをそのまま出す）
   *
   * ★外部教科（本体に教科データを持たない教科）もここで拾う★
   * 高校入試 理科は本体の索引に載らないため、拾わないと
   * ★「ch01 を演習する」という生の記号がそのまま画面に出る★。
   * 何の単元なのか生徒に伝わらないので、外部教科の登録簿から名前を引く。
   */
  const chapterTitleOf = (chapterId: string): string => {
    const entry = getChapterIndexOfSubject(subject).find((c) => c.id === chapterId);
    const known = entry?.abstractTitle || entry?.realTitle || entry?.title;
    if (known) return known;
    return externalChapterTitleOf(subject, chapterId) || chapterId;
  };

  // 「つづけて演習する」の行（chapterRows）は BattleResultReviewSection.tsx で作る（C-09）

  const deltaIcon =
    delta > 0 ? <TrendingUp size={16} /> : delta < 0 ? <TrendingDown size={16} /> : <Minus size={16} />;
  // ★ライト地なので「増えた」の色にゴールドを使わない★
  //   アイボリーの上では #F4D03F の数字が読めない。琥珀に置き換える。
  const deltaColor = delta > 0 ? AMBER : delta < 0 ? WRONG : INK_SUB;

  const DETAIL_SECTIONS = (
    <BattleResultReviewSection
      result={result}
      questions={questions}
      subject={subject}
      theme={theme}
      onPractice={onPractice}
      chapterTitleOf={chapterTitleOf}
      review={review}
    />
  );

  // ミッション・プロフィールは結果の上に開く（もどると結果に戻る）
  if (page === 'missions') return <BattleMissions onBack={() => setPage('detail')} />;
  if (page === 'profile') return <BattleProfile onBack={() => setPage('detail')} onMissions={() => setPage('missions')} />;

  const retryButton = onRetryWrong && wrongIds.length > 0 ? (
    <BattleButton variant="ghost" onClick={() => onRetryWrong(subject, wrongIds)} icon={<Swords size={18} />}>
      間違えた{wrongIds.length}問だけ再対戦
    </BattleButton>
  ) : null;
  const goHome = onHome ?? onExit;
  const margin = result.me.score - (result.opponent?.score ?? 0);

  /**
   * ★導線（2026-10-04 ご指示）★
   *   対戦終わり（勝敗・とびら君・報酬・点数＝1画面）
   *     → 「詳しい結果を確認する」だけ
   *   詳しい結果（1問ずつの答えあわせ・解説・成長記録）
   *     → 「部屋に戻って問題を選ぶ」（教科・単元・問題数・強さはそこで選ぶ）／「ホームに戻る」
   */
  // ===== 詳しい結果（復習）ページ =====
  if (page === 'detail') {
    // 広告の失敗（在庫なし・頻度制限・Web）で画面遷移を止めない
    const handleBackToRoom = () => {
      showInterstitialAd().catch(() => {});
      onBackToRoom?.();
    };
    const handleGoHome = () => {
      showInterstitialAd().catch(() => {}); // 同上：広告の失敗で遷移を止めない
      goHome();
    };

    return (
      <BattleShell
        className="result-detail-shell"
        footer={
          <div className="result-detail-actions" data-result-detail-actions>
            {onBackToRoom && (
              <BattleButton onClick={handleBackToRoom} icon={<DoorOpen size={18} />} data-result-back-room>
                {backToRoomLabel}
              </BattleButton>
            )}
            <BattleButton variant="ghost" onClick={handleGoHome} icon={<HomeIcon size={18} />} data-result-home>
              ホームに戻る
            </BattleButton>
          </div>
        }
      >
      <div className="result-detail-head">
        <button type="button" className="result-detail-back" onClick={() => setPage('summary')} aria-label="勝敗の画面にもどる"><ArrowLeft size={18} /></button>
        <h1 className="font-handwriting text-2xl font-black" style={{ color: INK }} data-result-detail-title>詳しい結果{retryMode ? '（再対戦）' : ''}</h1>
      </div>
      {DETAIL_SECTIONS}
      {(retryButton || (onReview && picks.length > 0)) && (
        <section className="mb-4 grid gap-2" aria-label="復習">
          {retryButton}
          <ResultActions onRematch={undefined} rematchLabel={rematchLabel} onReview={onReview} picks={picks} subject={subject} chapterTitleOf={chapterTitleOf} />
        </section>
      )}
      {/* 成長記録の詳しいカード（ミッション・称号・共有）は勝敗画面から移した */}
      {growth && <section className="mb-4" aria-label="成長記録">
        <BattleGrowthCard progress={growth.progress} delta={growth.delta}
          onOpenProfile={onOpenProfile ? () => setPage('profile') : undefined}
          onOpenMissions={onOpenMissions ? () => setPage('missions') : undefined} />
        <ShareButton text={shareTextForMatch({ outcome: result.outcome, subjectLabel: theme.label,
          myScore: result.me.score, theirScore: result.opponent?.score || 0, rating,
          level: levelOf(growth.progress.xp).level, title: equippedTitleLabel(growth.progress) || '' })} />
      </section>}
      <ResultStats
        result={result}
        answeredIndexes={myAnsweredIndexes}
        matchKey={matchKey || `${subject}-${result.me.score}-${result.opponent?.score ?? 0}-${questions[0]?.id ?? ''}`}
      />
    </BattleShell>
  );
}

  // ===== 対戦終わり（1画面に収める）=====
  return (
    <BattleShell
      className="result-summary-shell"
      footer={
        <div className="grid gap-2.5" data-result-summary-actions>
          <BattleButton onClick={() => setPage('detail')} icon={<ClipboardList size={18} />} data-result-open-detail>
            詳しい結果を確認する{picks.length > 0 ? `（まちがい${picks.length}問）` : ''}
          </BattleButton>
        </div>
      }
    >
      <div className="result-summary" data-result-summary data-outcome={result.outcome}>
      <OutcomeHero outcome={result.outcome} byForfeit={byForfeit} />
      {/* 勝ったときはとびら君の動画、それ以外はとびら君のひとことを大きく */}
      {result.outcome === 'win'
        ? <div className="victory-cinema result-summary-stage" style={{ backgroundImage: `url(${CINEMATIC_CLIPS.victory.poster})` }}><CinematicClip src={CINEMATIC_CLIPS.victory.src} poster={CINEMATIC_CLIPS.victory.poster} label="とびら君の勝利動画" hold /></div>
        : null}
      <TobiraBuddy className="battle-result-buddy result-summary-buddy" size={result.outcome === 'win' ? 'sm' : 'md'} input={{ screen: 'result', outcome: result.outcome, margin, seed: result.me.score }} />
      {growthMatchId && growthOwnerUid && <BattleGrowthReward matchId={growthMatchId} ownerUid={growthOwnerUid}
        eligible={growthEligible} subject={subject} subjectLabel={theme.label} result={result} rating={rating}
        compact onLoaded={setGrowth} />}

      {byForfeit && (
        <p
          className="mb-2 rounded-xl px-3 py-2 text-center text-xs font-bold"
          style={{ background: `${GOLD}2E`, color: AMBER }}
        >
          相手の通信が切れたため、不戦勝あつかいになりました（レートの変化は半分です）
        </p>
      )}

      {result.decidedByTime && (
        <p
          className="mb-2 rounded-xl px-3 py-2 text-center text-xs font-bold"
          style={{ background: '#2E86C114', color: '#2E86C1' }}
        >
          同点だったので、解答時間の合計で決まりました
        </p>
      )}

      {/* 点数 */}
      <section
        className="battle-card-in mb-4 rounded-3xl border-2 p-4"
        style={{ borderColor: LINE, background: '#FFFFFF' }}
      >
        <div className="mb-3 flex items-center gap-2">
          <PlayerBadge
            nickname={meNickname}
            photoURL={mePhotoURL}
            rating={rating?.before ?? myRating ?? 1500}
            isMe
          />
          <span
            className="battle-vs-pulse shrink-0 rounded-lg px-1.5 py-0.5 text-xs font-black"
            style={{ background: GOLD, color: INK }}
          >
            VS
          </span>
          <PlayerBadge
            nickname={opponent?.nickname || '対戦相手'}
            photoURL={opponent?.photoURL}
            rating={opponent?.rating ?? 1500}
            mask={maskOpponent}
            align="right"
          />
          {opponent?.uid && (
            <UserSafetyMenu target={{ uid: opponent.uid, nickname: opponent.nickname || '対戦相手', where: 'battle' }} />
          )}
        </div>
        <div className="flex items-center">
          <ScoreColumn score={result.me} label="あなた" color={AMBER} />
          <span className="px-2" style={{ color: LINE }}>
            —
          </span>
          <ScoreColumn score={result.opponent} label="あいて" color={INK_SUB} />
        </div>
      </section>

      {/* レート（1行）。統計（正解数・回答時間・コンボ・1問ごとのながれ）は「詳しい結果」へ */}
      <p className="result-rate-line" style={{ borderColor: `${title.color}44`, background: `${title.color}10` }} data-result-rate>
        <span className="result-rate-label">レート</span>
        {rating ? <>
          <span className="tabular-nums" style={{ color: INK_SUB }}>{rating.before}</span>
          <span style={{ color: INK_SUB }}>→</span>
          <b className="battle-pop tabular-nums" style={{ color: title.color, '--pop-delay': '0.2s' } as CSSProperties}>{rating.after}</b>
          <span className="result-rate-delta tabular-nums" style={{ background: `${deltaColor}22`, color: deltaColor }}>{deltaIcon}{delta > 0 ? `+${delta}` : delta}</span>
        </> : <span className="result-rate-note">{ratingNote || '反映されませんでした（無効試合）'}</span>}
      </p>
      </div>
    </BattleShell>
  );
}
