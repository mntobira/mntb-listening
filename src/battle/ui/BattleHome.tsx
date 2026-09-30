/**
 * ===================================================================
 * BattleHome — 対戦モードの入口
 * ===================================================================
 *
 * ★2026-08 に作り直した★
 * 利用者から
 *   「マッチングのところがやっぱりフレンドと全国で少しわかんないので
 *     もっとわかりやすくして　ポケポケとかイーフットボールみたいに
 *     すごい感じにして」
 * という指摘を受けた。
 *
 * -------------------------------------------------------------------
 * ■ 何が「わかんない」のかを分解した
 * -------------------------------------------------------------------
 * 前の実装は、2つのモードの違いを 11px の小さな説明文で
 *   フレンド「4文字の合言葉を作って、友達に口で伝えるだけ。」
 *   全国    「近いレートの人と自動でマッチングします。」
 * と書いていただけだった。
 * これは「やり方」の説明であって、選ぶ前に本当に知りたいこと——
 *   ・誰と当たるのか
 *   ・すぐ始まるのか
 *   ・レートは動くのか
 *   ・名前は相手に見えるのか
 * ——に答えていない。しかも2つの説明が同じ書式・同じ大きさなので、
 * 並べても違いが浮かび上がらない。
 *
 * そこで ★同じ4項目を、同じ順番で、両モードに並べる★ ことにした。
 * 「違い」は文章で語るのではなく、同じ枠の同じ位置にある値の差として
 * 見えるようにする（表と同じ原理）。
 *
 * -------------------------------------------------------------------
 * ■ 「ポケポケ・イーフットボールみたいにすごい感じ」の正体
 * -------------------------------------------------------------------
 * それらのゲームの対戦入口が「すごい」のは、暗い画面だからではない。
 *   ① 主動線が画面の主役として大きく置かれている（迷う余地がない）
 *   ② カードに光沢が走り、待っていても何かが動いている
 *   ③ 押す前から「これから戦う」という temperature がある（VS・レート）
 * この3つを、地色を変えずに作る。
 * 演出は src/index.css の .battle-sheen / .battle-card-in / .battle-vs-pulse
 * に置いてある（prefers-reduced-motion で一括停止できるようにするため）。
 *
 * ★地色は絶対に変えない★
 * 前回「暗くしたら乖離した」と指摘されたのがまさにこの点。
 * 対戦は別アプリではなく、同じノートの中の1ページ。
 *
 * -------------------------------------------------------------------
 * ■ フレンド対戦を上に置いている理由（変えていない）
 * -------------------------------------------------------------------
 * 利用者の指示が「フレンド対戦もできる、てかそっちメイン」だったため。
 * 全国対戦は「相手がいないと始まらない」＝最初は必ず待たされる機能なので、
 * 人が少ない時間帯に最初に押されると「壊れている」と受け取られやすい。
 *
 * ★ゲストを弾く場所をここにした理由★
 * 対戦は Firestore のルールで「部屋の players に自分の uid が入っていること」を
 * 読み書きの条件にしている。uid を持たないゲストはルール上どうやっても
 * 部屋に入れないので、押せるボタンを出してから失敗させるのではなく、
 * 入口で理由を説明して Google ログインに誘導する。
 */

import './battle-lobby.css';
import { useEffect, useState } from 'react';
import {
  Bot,
  Clock,
  Eye,
  EyeOff,
  History,
  LogIn,
  Shuffle,
  Swords,
  TrendingUp,
  Trophy,
  UserRound,
  Users,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { auth } from '../../firebase';
import { FriendOnlineStrip } from '../../components/FriendOnlineStrip';
import { useGrowthProgress } from '../../hooks/useGrowthProgress';
import { GrowthAvatar } from './GrowthParts';
import { GrowthHomeStrip } from './GrowthHomeStrip';
import {
  AMBER,
  BattleButton,
  BattleLoading,
  BattleNotice,
  BattleShell,
  BattleTitle,
  GOLD,
  INK,
  INK_SUB,
  LINE,
} from './BattleParts';
import { fetchMyRankingRow, ratingProgress, ratingTitle } from '../data/battleRanking';
import type { BattleRankingRow } from '../data/battleRanking';

export type BattleHomeChoice =
  | 'friend-create'
  | 'friend-join'
  | 'national'
  | 'ai'
  | 'ranking'
  | 'history'
  | 'profile'
  | 'missions';

/**
 * モードカードに並べる4項目。
 *
 * ★両モードで「同じ項目・同じ順番」にすることが仕様★
 * 片方だけ項目が多い／順番が違うと、読み手は差分を探すために
 * 2つのカードを行き来しなければならない。位置を揃えれば、
 * 目を横に動かすだけで違いが分かる。
 */
interface ModeFact {
  icon: ReactNode;
  /** 項目名（両モード共通の見出し） */
  key: string;
  /** そのモードでの値 */
  value: string;
  /** 値を強調するか（そのモードの「売り」なら true） */
  strong?: boolean;
}

const FRIEND_FACTS: ModeFact[] = [
  { icon: <UserRound size={13} />, key: 'あいて', value: '合言葉を教えた人', strong: true },
  { icon: <Clock size={13} />, key: 'まちじかん', value: 'なし（すぐ始まる）', strong: true },
  { icon: <TrendingUp size={13} />, key: 'レート', value: 'うごく' },
  { icon: <Eye size={13} />, key: 'なまえ', value: 'おたがいに見える' },
];

const NATIONAL_FACTS: ModeFact[] = [
  { icon: <Shuffle size={13} />, key: 'あいて', value: '近いレートの知らない人', strong: true },
  { icon: <Clock size={13} />, key: 'まちじかん', value: 'あり（数十秒〜数分）' },
  { icon: <TrendingUp size={13} />, key: 'レート', value: 'うごく' },
  { icon: <EyeOff size={13} />, key: 'なまえ', value: 'かくれる（マ＊＊＊）', strong: true },
];

/**
 * AI 対戦。
 * ★「まちじかん なし」と「レート うごかない」を強調する★
 * 全国対戦で待たされた人の受け皿がこれ。待たないことが売りで、
 * その代わりレートは動かない（動いたら全国で戦う理由が無くなる）。
 */
const AI_FACTS: ModeFact[] = [
  { icon: <Bot size={13} />, key: 'あいて', value: 'AI（強さを4段階からえらぶ）', strong: true },
  { icon: <Clock size={13} />, key: 'まちじかん', value: 'なし（すぐ始まる）', strong: true },
  { icon: <TrendingUp size={13} />, key: 'レート', value: 'うごかない（練習用）' },
  { icon: <Eye size={13} />, key: 'なまえ', value: 'AIには見えない' },
];

/**
 * モードカード。
 *
 * ★カード全体をボタンにしていない理由★
 * フレンド対戦には「つくる」と「入る」の2つの動作がある。
 * カードごとタップにすると、どちらに進むのか決められない。
 * カードは「説明の器」、動作は中のボタンに限定する。
 */
function ModeCard({
  kind,
  badge,
  title,
  lead,
  facts,
  accent,
  facePaint,
  children,
  delay,
}: {
  kind: 'friend' | 'national' | 'ai';
  /** 「おすすめ」などの札。無い場合は出さない */
  badge?: string;
  title: string;
  /** カードの一行目。「何をする機能か」を1文で */
  lead: string;
  facts: ModeFact[];
  /** カードの主色 */
  accent: string;
  /** 見出し行のアイコン */
  facePaint: ReactNode;
  /** 動作ボタン */
  children: ReactNode;
  /** 立ち上がりの遅延（上から順に出す） */
  delay: string;
}) {
  return (
    <section
      className={`lobby-mode lobby-mode-${kind} battle-card-in rounded-3xl border-2 p-4`}
      data-battle-mode={kind}
      style={
        {
          borderColor: `${accent}66`,
          background: '#FFFFFF',
          boxShadow: `0 6px 0 ${accent}22`,
          '--mode-accent': accent,
          '--card-delay': delay,
          '--sheen-delay': delay,
        } as CSSProperties
      }
    >
      {/* 見出し */}
      <header className="relative z-[2] mb-2 flex items-center gap-2">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: `${accent}1F`, color: accent }}
        >
          {facePaint}
        </span>
        <h2 className="font-handwriting text-xl font-black" style={{ color: INK }}>
          {title}
        </h2>
        {badge && (
          <span
            className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-black"
            style={{ background: GOLD, color: INK }}
          >
            {badge}
          </span>
        )}
      </header>

      <p className="lobby-mode-caption">{kind === 'friend' ? '合言葉で、友だちと1対1。' : kind === 'national' ? '全国のライバルに挑もう。' : '待たずに、腕だめし。'}</p>
      <div className="lobby-mode-tags"><span>{kind === 'ai' ? '強さは4段階' : 'レート変動あり'}</span><span>{kind === 'national' ? '近いレートでマッチ' : kind === 'friend' ? 'フレンド登録不要' : 'レート変動なし'}</span></div>
      <div className="lobby-mode-actions">{children}</div>
      <details className="lobby-mode-details">
        <summary>ルール・相手の表示を確認</summary>
        <p className="text-xs leading-relaxed mb-3" style={{ color: INK_SUB }}>{lead}</p>
      {/* ★4項目の対比表★ 両モードで同じ位置・同じ順番 */}
      <dl
        className="relative z-[2] mb-3.5 grid gap-1 rounded-2xl px-3 py-2.5"
        style={{ background: '#FAF8F3', border: `1px solid ${LINE}` }}
      >
        {facts.map((f) => (
          <div key={f.key} className="flex items-baseline gap-2 text-xs">
            <dt
              className="flex w-[5.6rem] shrink-0 items-center gap-1 font-black"
              style={{ color: INK_SUB }}
            >
              <span style={{ color: accent }}>{f.icon}</span>
              {f.key}
            </dt>
            <dd
              className="min-w-0 font-bold"
              style={{ color: f.strong ? accent : INK }}
            >
              {f.value}
            </dd>
          </div>
        ))}
      </dl>

      </details>
    </section>
  );
}

/**
 * ★市販の対戦ゲームにならった「ランク帯」（2026-09-28）★
 * ポケポケ・eFootball・クラロワの対戦入口は、どれも
 *   「いまの称号」と「次の称号まであと何点か」を常に見せている。
 * 数字（RP）だけでは強くなった実感が出ないため、称号の色つきバッジと
 * 次の称号までの進捗バーを並べる。計算は battleRanking の ratingTitle /
 * ratingProgress（ランキング画面と同じ関数）を使い、表示だけを足している。
 * ログインしていてレートが取れたときだけ出す（ゲストには出さない）。
 */
function RankStrip({ rating }: { rating: number }) {
  const t = ratingTitle(rating);
  const p = ratingProgress(rating);
  return (
    <div className="arena-rank-strip" aria-label={`称号 ${t.label}・${rating} RP`}>
      <span className="arena-rank-badge" style={{ background: t.color }}><Trophy size={14} />{t.label}</span>
      <div className="arena-rank-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p.ratio * 100)}>
        <i style={{ width: `${Math.round(p.ratio * 100)}%`, background: t.color }} />
      </div>
      <small>{p.remain > 0 ? `「${p.next}」まで あと ${p.remain} RP` : '最高位'}</small>
    </div>
  );
}

export function BattleHome({onChoose,onExit,onRequireLogin,notice}: {
 onChoose:(choice:BattleHomeChoice)=>void;onExit:()=>void;onRequireLogin?:()=>void;notice?:string|null;
}) {
 const user=auth.currentUser;const {progress}=useGrowthProgress();
 const [row,setRow]=useState<BattleRankingRow|null>(null);
 useEffect(()=>{let active=true;if(user)void fetchMyRankingRow().then(r=>{if(active)setRow(r);}).catch(()=>{});return()=>{active=false;};},[user]);
 return <BattleShell className="arena-menu">
   <header className="arena-menu-header"><button type="button" onClick={onExit}>ホームへ</button><h1><Swords size={21}/>とびらバトル</h1><span>{row ? <><b className="arena-rank-chip" style={{background:ratingTitle(row.rating).color}}>{ratingTitle(row.rating).label}</b>{row.rating} RP</> : user?'レート確認中':'ゲスト'}</span></header>
   <div className="arena-menu-player">{progress && <GrowthAvatar progress={progress} size={64}/>}<div><strong>学んだ力で、勝負しよう。</strong><p>正解60点 ＋ 速さ最大240点</p><small>完走10枚・正解ごと2枚・勝利10枚</small></div></div>
   {row && <RankStrip rating={row.rating}/>}
   {notice && <BattleNotice message={notice} tone="info"/>}
   {/* ★ホームと同じ組み方（2026-09-30）★ 左右＝パステルの札、中央＝水色の大きな丸。1画面に収める。 */}
   <section className="arena-lobby-deck" aria-label="対戦の種類">
    <div className="arena-lobby-side arena-lobby-friend" data-battle-mode="friend">
     <span className="arena-lobby-icon"><Users aria-hidden="true"/></span><strong>フレンド</strong><small>合言葉で1対1</small>
     <button type="button" onClick={()=>user?onChoose('friend-create'):onRequireLogin?.()}>部屋をつくる</button>
     <button type="button" onClick={()=>user?onChoose('friend-join'):onRequireLogin?.()}>合言葉で入る</button>
    </div>
    <button type="button" className="arena-lobby-main" data-battle-mode="ai" onClick={()=>onChoose('ai')} aria-label="AIと対戦する">
     <Bot aria-hidden="true"/><strong>AIと対戦</strong><small>すぐ始まる</small>
    </button>
    <div className="arena-lobby-side arena-lobby-national" data-battle-mode="national">
     <span className="arena-lobby-icon"><Wifi aria-hidden="true"/></span><strong>全国対戦</strong><small>RANKED</small>
     <button type="button" onClick={()=>user?onChoose('national'):onRequireLogin?.()}>相手を見つける<Zap size={15} aria-hidden="true"/></button>
    </div>
   </section>
   {!user && <p className="arena-login-note">AIはゲストでも遊べます（フレンド・全国はログイン）</p>}
   <div className="arena-menu-links"><button type="button" onClick={()=>onChoose('profile')} aria-label="きせかえ・ガチャ">きせかえ</button><button type="button" onClick={()=>onChoose('missions')}>ミッション</button><button type="button" onClick={()=>onChoose('ranking')}><Trophy size={14}/>ランキング</button><button type="button" onClick={()=>onChoose('history')}><History size={14}/>対戦履歴</button></div>
   {/* ゲストには上の「ログイン」の一文で足りるので、同じ趣旨の案内を重ねない */}
   {user && <FriendOnlineStrip/>}
   <details className="arena-rules-help"><summary>配点と対戦ルール</summary><p>正解のみ加点。速さ点は残り時間の割合rに対して240×(0.7r²+0.3r³)。500ms単位に丸めます。3連続以上に小さな連続点。旧ルームでは作成時の配点を使用します。フレンドもお互い更新してから遊んでください。</p></details>
 </BattleShell>;
}
