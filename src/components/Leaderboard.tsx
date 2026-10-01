import './ranking.css';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ランキング画面
 * - 3つのタブ: 全章合計 / 章ごと / 期間別（週間・月間・全期間）
 * - 自分の順位がわかるように isMe をハイライト
 * - ゲスト時はログイン誘導
 */

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Crown, Medal, ChevronLeft, RefreshCw, User, BookOpen, Calendar, Globe, Users, TrendingUp, Swords, ArrowRight } from 'lucide-react';
import {
  fetchChapterRanking,
  fetchTotalRanking,
  fetchPeriodRanking,
  type RankingPeriod,
} from '../utils/leaderboard';
import { auth } from '../firebase';
/*
 * ★この画面は章の「ID と表示名」しか使わないので、軽い索引だけを読む★
 *
 * ランキングの絞り込みプルダウンに章名を並べるために、
 * もとは chemistryData と chemistryAdvancedData を静的 import していた。
 * しかし実際に使っていたのは
 *
 *     { id: c.id, title: c.abstractTitle || c.title || c.id }
 *
 * だけで、★問題文・選択肢・解説は1文字も使っていない★。
 * それにも関わらず依存グラフを辿ると
 *
 *     Leaderboard.tsx が引き込む src/data … 17 ファイル / 1,340,750 バイト
 *
 * が読み込まれていた（問題を増やすとこの数字がそのまま増える）。
 *
 * 索引に切り替える前に、置き換えても並びと文字列が完全に同一になることを
 * 実データで確認した（95件すべて一致）。
 * 化学（発展）側だけ `abstractTitle || id`（title を挟まない）に
 * なっているのも元の実装のままにしている。
 */
import { SUBJECT_INDEX } from '../data/chapterIndex.generated';
import { isSubjectEnabled } from '../config/features';
import { fetchFriendCompetition } from '../utils/friends';
import { DoorMascot } from './DoorMascot';
import { GoogleLinkBanner } from './GoogleLinkBanner';
import { RankingPodium } from './RankingPodium';
import { qualifyLineFor } from '../utils/liveRank';
import { displayNicknameForNational } from '../utils/nicknamePrivacy';
import { UserSafetyMenu } from '../features/safety/UserSafetyMenu';
import { useWithoutBlocked } from '../features/safety/useBlockedFilter';
import { safeAvatarUrl } from '../features/safety/avatarUrl';
import { displaySafeNickname } from '../features/safety/nicknameFilter';

interface LeaderboardProps {
  onBack: () => void;
  isGuest: boolean;
  /** 章タブを開いた時の初期 chapterId */
  initialChapterId?: string | null;
  /**
   * オンライン対戦を開く。
   *
   * ★この画面に対戦への橋を架けた理由★
   *   利用者の指示「オンラインをメインにするUIにしていかんとだめよね？」
   *   「対戦画面は他のところでしているのでそこまでのところはすべて変えて」
   *
   *   ★このアプリにはランキングが2つある★
   *     ① この画面（leaderboard_*）… ★学習量★ を competing する
   *     ② 対戦ランキング（BattleRanking）… ★対戦の強さ（レート）★
   *   これは意図的に別コレクションにしてある（BattleRanking.tsx の冒頭）。
   *
   *   ところが下部ナビの「ランキング」はこの①へ行く。
   *   「対戦で勝ったから順位を見よう」と思って押した人は、
   *   ★自分のレートがどこにも無い別のランキングに着く★。
   *   探し物が無いのに、それが別画面にあることも書いていなかった。
   *
   *   ①を②に置き換えることはしない（学習量のランキングは
   *   利用者の指示「問題をなくすとかはダメだよ」の対象で、
   *   消すべきものではない）。並べて、行けるようにする。
   *
   * ★任意（省略可）★ FEATURES.battle が false なら App 側から渡さない。
   */
  onBattle?: () => void;
  /** 本体で選択中の科目。章別ベストの科目を最初にこれへ合わせる。 */
  initialSubject?: string;
}

type Tab = 'total' | 'chapter' | 'period';

export function Leaderboard({ onBack, isGuest, initialChapterId, onBattle, initialSubject }: LeaderboardProps) {
  const [tab, setTab] = useState<Tab>('total');
  const [scope, setScope] = useState<'all' | 'friends'>('all');
  const [period, setPeriod] = useState<RankingPeriod>('week');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Array<{ rank: number; nickname: string; photoURL?: string; score: number; sub?: string; isMe: boolean; uid?: string }>>([]);

  /*
   * 章別ベストの選択肢は「公開中の全科目」から作る。
   * 以前は化学基礎・化学の章しか並ばず、英語や地理を学習している人が
   * 章別タブを開くと自分の科目が無く、化学基礎の第1章が選択済みになっていた。
   * 章スコアの送信（Quiz → submitChapterScore）は科目を問わず行われているので、
   * 選択肢だけが化学系に閉じていた。
   */
  const subjects = useMemo(
    () => SUBJECT_INDEX
      .filter((s) => isSubjectEnabled(s.id) && s.chapters.length > 0)
      .map((s) => ({
        id: s.id,
        label: s.label,
        chapters: s.chapters.map((c) => ({ id: c.id, title: c.abstractTitle || c.title || c.id })),
      })),
    []
  );
  const subjectOfChapter = (id: string | null | undefined) =>
    subjects.find((s) => s.chapters.some((c) => c.id === id))?.id;
  const [subjectId, setSubjectId] = useState<string>(() =>
    subjectOfChapter(initialChapterId)
    || (initialSubject && subjects.some((s) => s.id === initialSubject) ? initialSubject : subjects[0]?.id || '')
  );
  const chapters = subjects.find((s) => s.id === subjectId)?.chapters || [];
  const [chapterId, setChapterId] = useState<string>(() =>
    (initialChapterId && subjectOfChapter(initialChapterId) ? initialChapterId : null)
    || subjects.find((s) => s.id === subjectId)?.chapters[0]?.id || ''
  );
  const changeSubject = (next: string) => {
    setSubjectId(next);
    setChapterId(subjects.find((s) => s.id === next)?.chapters[0]?.id || '');
  };

  const load = async () => {
    setLoading(true);
    try {
      if (scope === 'friends' && auth.currentUser) {
        let since: Date | null = null;
        if (tab === 'period' && period !== 'all') {
          since = new Date();
          if (period === 'week') since.setDate(since.getDate() - 7);
          else since.setMonth(since.getMonth() - 1);
        }
        const list = await fetchFriendCompetition(tab, { chapterId, since });
        setRows(list.map((entry, index) => ({
          rank: index + 1,
          nickname: entry.nickname,
          photoURL: entry.photoURL,
          score: entry.score,
          sub: entry.sub,
          isMe: entry.uid === auth.currentUser?.uid,
          uid: entry.uid,
        })));
      } else if (tab === 'total') {
        const list = await fetchTotalRanking(100);
        setRows(
          list.map((r) => ({
            rank: r.rank,
            // 全国ランキングは誰でも見られるので、本名を入れている子の
            // 個人情報を守るため名前を部分マスクする（自分の行はそのまま）。
            // フレンドスコープ（上の分岐）は従来どおりフル表示。
            nickname: displayNicknameForNational(r.entry.nickname, r.isMe),
            photoURL: r.entry.photoURL,
            score: r.entry.totalScore,
            // 0pt のユーザーも掲載する（連携済みなら全員載る）ため、
            // 「0 章クリア」ではなく「まだ挑戦していません」と出して、
            // 記録が無いのか点が伸びていないのかを取り違えないようにする。
            sub:
              (r.entry.totalScore || 0) === 0 &&
              Object.keys(r.entry.chapterScores || {}).length === 0
                ? 'まだ挑戦していません'
                : `${Object.keys(r.entry.chapterScores || {}).length} 章クリア`,
            isMe: r.isMe,
            uid: r.entry.uid,
          }))
        );
      } else if (tab === 'chapter') {
        if (!chapterId) return;
        const list = await fetchChapterRanking(chapterId, 100);
        setRows(
          list.map((r) => ({
            rank: r.rank,
            nickname: displayNicknameForNational(r.entry.nickname, r.isMe),
            photoURL: r.entry.photoURL,
            score: r.entry.bestScore,
            sub: `正答率 ${Math.round((r.entry.correctRate || 0) * 100)}% / ${r.entry.timeUsedSec}秒`,
            isMe: r.isMe,
            uid: r.entry.uid,
          }))
        );
      } else {
        const list = await fetchPeriodRanking(period, 100);
        setRows(
          list.map((r) => ({
            rank: r.rank,
            nickname: displayNicknameForNational(r.entry.nickname, r.isMe),
            photoURL: r.entry.photoURL,
            score: r.entry.bestScore,
            sub: `${r.entry.playCount} 回プレイ`,
            isMe: r.isMe,
            uid: r.entry.uid,
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, scope, period, chapterId]);

  // 自分が圏外かどうか判定
  // ブロックした人は自分の画面に出さない（App Store 1.2）。順位の数字は元のまま。
  const visibleRows = useWithoutBlocked<(typeof rows)[number]>(rows);
  const myRow = rows.find((r) => r.isMe);
  const me = auth.currentUser;

  // 進出ラインは参加人数に応じて決める（少人数で「全員が圏内」になると線の意味が消える）
  const qualifyLine = qualifyLineFor(rows.length);

  /**
   * すぐ上の相手までの点差。
   * 順位を見せるだけだと「遠い」で終わってしまうが、点差まで見せると
   * 「あと○点なら次の1問で届く」と分かり、順位が現実の目標になる。
   * 同点では抜けないので +1 して「抜くのに必要な点」を出す。
   */
  const chaseInfo = useMemo(() => {
    if (!myRow || myRow.rank <= 1) return null;
    const above = rows.filter((r) => r.rank < myRow.rank);
    if (above.length === 0) return null;
    const target = above.reduce((best, cur) => (cur.rank > best.rank ? cur : best), above[0]);
    return {
      gap: Math.max(1, target.score - myRow.score + 1),
      targetRank: target.rank,
      targetName: target.nickname,
    };
  }, [rows, myRow]);

  /** 首位のときに見せる「2位との差」＝守るべきリード */
  const defendInfo = useMemo(() => {
    if (!myRow || myRow.rank !== 1) return null;
    const second = rows.find((r) => r.rank === 2);
    if (!second) return null;
    return Math.max(0, myRow.score - second.score);
  }, [rows, myRow]);

  return (
    /*
      ★スマホでは「固定される所」と「スクロールする所」を分ける★
      （利用者の指示：「ランキング画面も基本一画面に入るでしょ？ モンストのランキングとか、
        固定されるところとスクロールしてるところが明確になってる」）

        固定   … 見出し・対戦ランキングへの橋・全国／フレンド・集計タブ・章／期間の選択
        スクロール … 表彰台・一覧（.ranking-scroll）
        画面下に貼り付く … 「あなた」の順位カード（.ranking-me-card、sticky）

      DOM の順番は変えていない（PC は今までと同じ見た目・同じ並び）。
      切り替えは index.css の @media (max-width: 767px) だけで行う。
      PC（768px 以上）では .ranking-scroll は素の div で、高さもはみ出しも今までどおり。
    */
    <div className="mtb-page mt-screen ranking-hall w-full min-h-screen pb-32" data-ranking>
      <div className="ranking-hall-inner max-w-3xl mx-auto px-4 py-6 md:py-8 relative">
        <div className="absolute top-10 right-4 w-40 h-40 bg-[#F4D03F]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-4 w-48 h-48 bg-[#A9CCE3]/15 rounded-full blur-3xl pointer-events-none" />

        {/* ヘッダー */}
        <div className="ranking-hall-header mtb-page-header flex items-center gap-4 mb-6 relative z-10">
          <button type="button" onClick={onBack} className="mt-icon-btn" aria-label="戻る">
            <ChevronLeft size={20} className="stroke-[2.5]" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F4D03F]/30 text-[#1B2631] flex items-center justify-center shadow-xs">
              <Trophy size={18} />
            </div>
            <div className="mt-app-header-title"><p className="mt-kicker">LEARNING RECORDS</p><h2>ランキング</h2></div>
          </div>

          <DoorMascot showSpeech={false} size="mini" className="hidden sm:flex w-auto ml-1" />

          <button
            type="button"
            onClick={load}
            className="mt-icon-btn ml-auto"
            title="更新"
            aria-label="ランキングを更新"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* =====================================================================
            対戦ランキングへの橋
            =====================================================================

            ★この帯が必要な理由★
              この画面は「学習量」のランキング。対戦の強さ（レート）は
              別のランキング（BattleRanking）にあり、意図的に
              別コレクションにしてある。
              下部ナビの「ランキング」はこちらへ来るので、
              対戦の順位を探している人はここで行き止まりになる。
              ★探し物がどこにあるかを書いて、そこへ行けるようにする★

            ★この画面の中身は1つも変えていない★
              全国／フレンド競争、全章合計／章別ベスト／期間別、
              表彰台、ボーダーラインの表示はすべて元のまま。
              上に1行足しただけ。 */}
        {onBattle && (
          <button
            onClick={onBattle}
            aria-label="対戦ランキング（レート）を見る"
            className="ranking-battle-bridge relative z-10 mb-3 w-full flex items-center gap-2.5 rounded-2xl border border-[#BBDCF0] bg-gradient-to-r from-[#EAF4FB] to-[#DCEBF7] px-3.5 py-2.5 text-left transition-colors hover:from-[#E0EEF9] hover:to-[#D0E4F4] min-h-[48px]"
          >
            <div className="w-8 h-8 rounded-xl bg-[#2E86C1]/15 text-[#1B4F72] flex items-center justify-center shrink-0">
              <Swords size={16} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="ranking-bridge-title">対戦の順位（レート）はこちら</p>
              <p className="ranking-bridge-sub">
                このページは学習量のランキングです
              </p>
            </div>
            <ArrowRight size={16} className="text-[#2E86C1] shrink-0" aria-hidden="true" />
          </button>
        )}

        <p className="ranking-hall-caption">積み重ねた学びを、次の目標に。</p>
        {/* 全国／フレンド競争 */}
        <div className="ranking-scope mt-tabs relative z-10 mb-3" role="group" aria-label="範囲">
          <button aria-pressed={scope === 'all'} onClick={() => setScope('all')} type="button">
            <Globe size={14} /> 全国
          </button>
          <button aria-pressed={scope === 'friends'} onClick={() => !isGuest && setScope('friends')} disabled={isGuest} type="button">
            <Users size={14} /> フレンド競争
          </button>
        </div>

        {/* 集計タブ */}
        <div className="ranking-tabs mt-tabs relative z-10 mb-4" role="group" aria-label="集計">
          <TabButton active={tab === 'total'} onClick={() => setTab('total')} icon={<Globe size={14} />} label="全章合計" />
          <TabButton active={tab === 'chapter'} onClick={() => setTab('chapter')} icon={<BookOpen size={14} />} label="章別ベスト" />
          <TabButton active={tab === 'period'} onClick={() => setTab('period')} icon={<Calendar size={14} />} label="期間別" />
        </div>

        {/* サブセレクタ */}
        {tab === 'chapter' && (
          <div className="ranking-subselect relative z-10 mb-4 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2">
            <label className="bg-white border border-gray-200 rounded-2xl shadow-xs p-2 flex items-center gap-2">
              <span className="sr-only">科目</span>
              <select
                value={subjectId}
                onChange={(e) => changeSubject(e.target.value)}
                aria-label="章別ベストの科目"
                className="w-full px-3 py-2 bg-transparent outline-none text-sm font-bold text-[#1B2631] cursor-pointer font-modern"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </label>
            <label className="bg-white border border-gray-200 rounded-2xl shadow-xs p-2 flex items-center gap-2">
              <span className="sr-only">単元</span>
              <select
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                aria-label="章別ベストの単元"
                className="w-full px-3 py-2 bg-transparent outline-none text-sm font-bold text-[#1B2631] cursor-pointer font-modern"
              >
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {tab === 'period' && (
          <div className="ranking-subselect mt-tabs relative z-10 mb-4" role="group" aria-label="期間">
            {(['week', 'month', 'all'] as RankingPeriod[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                aria-pressed={period === p}
              >
                {p === 'week' ? '週間' : p === 'month' ? '月間' : '全期間'}
              </button>
            ))}
          </div>
        )}

        {/* ここから下がスマホでスクロールする領域（PC では素の div） */}
        <div className="ranking-scroll">
        {/* 上位3名の表彰台。
            一覧だけだと1位も4位も同じ高さの行で「頂点に立つ」感覚が出ないため、
            国際大会の順位発表と同じく台の形で見せる。下の一覧は今までどおり残す。 */}
        {rows.length > 0 && (
          <div className="ranking-podium-wrap relative z-10 mb-4">
            <RankingPodium
              entries={visibleRows.slice(0, 3).map((r) => ({
                rank: r.rank,
                nickname: r.nickname,
                photoURL: r.photoURL,
                score: r.score,
                isMe: r.isMe,
              }))}
            />
          </div>
        )}

        {/* 自分の順位サマリー */}
        {!isGuest && me && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="ranking-me-card mt-card relative z-10 mb-4" data-tone="gold"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  {me.photoURL ? (
                    <img src={me.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={18} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-widest opacity-60">あなた</p>
                  <p className="text-sm font-bold truncate max-w-[180px]">{myRow?.nickname || '—'}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs uppercase tracking-widest opacity-60">順位 / スコア</p>
                <p className="text-lg font-bold mt-num tabular-nums">
                  {myRow ? `${myRow.rank}位` : (scope === 'friends' ? '未参加' : '圏外')}
                  <span className="text-xs opacity-70 ml-2">{myRow ? `${myRow.score} pt` : ''}</span>
                </p>
              </div>
            </div>

            {/* すぐ上の相手までの点差。
                「あと○点で○位」まで示すと、順位が“届く距離”になり本気になれる。
                順位そのものより、この点差の方が次の行動を決める情報になる。 */}
            {chaseInfo && (
              <div className="mt-3 pt-3 border-t border-white/15 flex items-center gap-2 text-xs">
                <TrendingUp size={14} className="text-[#F4D03F] shrink-0" />
                <p className="font-bold min-w-0 truncate">
                  あと<span className="text-[#F4D03F] tabular-nums mx-1 text-sm">{chaseInfo.gap}</span>pt で
                  <span className="mx-1">{chaseInfo.targetRank}位</span>
                  <span className="opacity-60">（{chaseInfo.targetName}）</span>
                </p>
              </div>
            )}
            {myRow && myRow.rank === 1 && (
              <div className="mt-3 pt-3 border-t border-white/15 flex items-center gap-2 text-xs">
                <Crown size={14} className="text-[#F4D03F] shrink-0" />
                <p className="font-bold">
                  首位を守っています。
                  {defendInfo != null && (
                    <span className="opacity-70 ml-1">2位との差 {defendInfo} pt</span>
                  )}
                </p>
              </div>
            )}
            {qualifyLine != null && myRow && myRow.rank > 1 && (
              <p className="mt-2 text-xs font-bold opacity-70">
                {myRow.rank <= qualifyLine
                  ? `上位${qualifyLine}位以内（圏内）を維持中`
                  : `上位${qualifyLine}位以内が当面の目標ライン`}
              </p>
            )}
          </motion.div>
        )}

        {/* ゲストは順位に載れない。文言で伝えるだけだとその場で解決できないので、
            そのまま連携できるカードを置いておく。 */}
        {isGuest && (
          <div className="ranking-guest-wrap relative z-10 mb-4">
            <GoogleLinkBanner
              variant="card"
              className="mb-0"
              onLinked={() => window.location.reload()}
            />
          </div>
        )}

        {/* リスト */}
        <div className="ranking-record-paper mt-card relative z-10 overflow-hidden">
          {loading && rows.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">読み込み中…</div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">
              {scope === 'friends' ? 'フレンドの記録はまだありません。' : 'まだ誰もチャレンジしていません。'}
              <br />
              {scope === 'friends' ? '同じ問題に挑戦して競争しよう！' : '一番乗りで頂点を取ろう！'}
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {visibleRows.map((r) => (
                <React.Fragment key={`${r.uid}-${r.rank}`}>
                {/* 進出ラインの区切り。
                    ここに線が1本あるだけで「あと1つ上がれば圏内」という当落線が生まれ、
                    順位そのものに意味が出る（グループリーグ突破ラインと同じ考え方）。 */}
                {qualifyLine != null && r.rank === qualifyLine + 1 && (
                  <li className="flex items-center gap-2 px-4 py-1.5 bg-[#FDFBF7] border-y border-dashed border-[#D4A017]/50">
                    <span className="h-px flex-1 bg-[#D4A017]/30" />
                    <span className="text-xs font-bold text-[#A47C0A] whitespace-nowrap">
                      上位{qualifyLine}位ライン
                    </span>
                    <span className="h-px flex-1 bg-[#D4A017]/30" />
                  </li>
                )}
                <li
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    r.isMe ? 'bg-[#F4D03F]/15 border-l-4 border-[#F4D03F]' : 'hover:bg-gray-50'
                  }`}
                >
                  <RankBadge rank={r.rank} />
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                    {safeAvatarUrl(r.photoURL) ? (
                      <img src={safeAvatarUrl(r.photoURL)} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={16} className="text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold truncate ${r.isMe ? 'text-[#1B2631]' : 'text-[#1B2631]'}`}>
                      {r.isMe ? r.nickname : displaySafeNickname(r.nickname)}
                      {r.isMe && <span className="ml-2 text-xs text-[#D4A017] font-bold">YOU</span>}
                    </p>
                    {r.sub && <p className="text-xs text-gray-400 truncate">{r.sub}</p>}
                  </div>
                  {!r.isMe && r.uid && <UserSafetyMenu target={{ uid: r.uid, nickname: r.nickname, where: 'ranking' }} />}
                  <p className="text-base font-bold tabular-nums mt-num text-[#3d3222] shrink-0">
                    {r.score}
                    <span className="text-xs text-gray-400 ml-1">pt</span>
                  </p>
                </li>
                </React.Fragment>
              ))}
            </ul>
          )}
        </div>
        </div>
        {/* .ranking-scroll ここまで */}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-8 h-8 rounded-full bg-[#F4D03F] text-[#1B2631] flex items-center justify-center shadow-sm shrink-0">
        <Crown size={16} />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center shadow-sm shrink-0">
        <Medal size={16} />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-8 h-8 rounded-full bg-[#D4A017]/30 text-[#A47C0A] flex items-center justify-center shadow-sm shrink-0">
        <Medal size={16} />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold tabular-nums shrink-0">
      {rank}
    </div>
  );
}
