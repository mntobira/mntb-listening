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
import { SOCIAL_FEATURES } from '../../config/features';
import { useEffect, useState } from 'react';
import {
  Activity,
  BookOpen,
  Coins,
  Target,
  Bot,
  History,
  LogIn,
  Swords,
  Trophy,
  UserRound,
  Users,
  Wifi,
  Zap,
  Volume2,
  VolumeX,
  Shield,
} from 'lucide-react';
import { useBattleAudioSettings } from '../hooks/useBattleAudio';
import { auth } from '../../firebase';
import { ConnectionCheckPanel } from './ConnectionCheckPanel';
import { TobiraBuddy } from '../../components/TobiraBuddy';
import { useGrowthProgress } from '../../hooks/useGrowthProgress';
import { GrowthAvatar } from './GrowthParts';
import {
  BattleNotice,
  BattleShell,
} from './BattleParts';
import { fetchMyRankingRow, ratingProgress, ratingTitle } from '../data/battleRanking';
import type { BattleRankingRow } from '../data/battleRanking';

export type BattleHomeChoice =
  | 'friend-create'
  | 'friend-join'
  | 'national'
  | 'ai'
  | 'ranking'
  | 'clan'
  | 'history'
  | 'profile'
  | 'missions';


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
    <div className="arena-rank-strip arena-vs-progress" aria-label={`称号 ${t.label}・${rating} RP`}>
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
   <header className="arena-menu-header"><button type="button" onClick={onExit}>ホームへ</button><h1><Swords size={21}/>とびらバトル</h1><BgmButton /></header>
   {/* ★E（2026-10-01）対戦前の舞台★ 夜のアリーナに「あなた VS ？？？」。とびら君がひとこと（少し挑発）。
       機能は同じ。下の3択・その他・ルールの中身も同じ */}
   <section className={`arena-vs${row ? ' has-rank' : ''}`} aria-label="あなたの情報" data-arena-vs>
    <div className="arena-vs-me">
     <span className="arena-vs-avatar">{progress ? <GrowthAvatar progress={progress} size={56}/> : <UserRound aria-hidden="true"/>}</span>
     <strong>{user ? (user.displayName || 'あなた') : 'ゲスト'}</strong>
     <small>{row ? <><b className="arena-rank-chip" style={{background:ratingTitle(row.rating).color}}>{ratingTitle(row.rating).label}</b>{row.rating} RP</> : user ? 'ランク確認中' : 'まずはAIで腕だめし'}</small>
    </div>
    <span className="arena-vs-mark" aria-hidden="true">VS</span>
    <div className="arena-vs-foe" aria-hidden="true">
     <span className="arena-vs-avatar arena-vs-unknown">?</span>
     <strong>対戦相手</strong>
     <small>だれが来る？</small>
    </div>
    {row ? <RankStrip rating={row.rating}/> : <TobiraBuddy className="arena-vs-buddy" size="sm" input={{ screen: 'battle', isGuest: !user, seed: new Date().getDate() }} />}
   </section>
   {notice && <BattleNotice message={notice} tone="info"/>}
   {/* ルールは仕様書の文ではなく、アイコン＋ひとことに（詳しい式は下の「配点と対戦ルール」） */}
   <ul className="arena-rule-chips" aria-label="点数とごほうび">
    <li><Target aria-hidden="true"/>正解で60点</li>
    <li><Zap aria-hidden="true"/>速いほどボーナス</li>
    <li><Coins aria-hidden="true"/>勝てば+10枚</li>
   </ul>
   {/* 3つのモードは同じ高さ・同じ幅。主役は「AIと対戦」（ゲストでも遊べる）を色とサイズで最強調 */}
   <p className="arena-lobby-label" aria-hidden="true">今すぐ対戦</p>
   <section className="arena-lobby-deck arena-lobby-grid" aria-label="今すぐ対戦：AI・フレンド・全国">
    <button type="button" className="arena-lobby-card arena-lobby-main" data-battle-mode="ai" data-tone="ai" onClick={()=>onChoose('ai')} aria-label="AIと対戦する">
     <span className="arena-lobby-icon"><Bot aria-hidden="true"/></span><strong>AIと対戦</strong><small>すぐ始まる・ゲストOK</small>
     <span className="arena-lobby-cta">はじめる<Swords size={16} aria-hidden="true"/></span>
    </button>
    <div className="arena-lobby-card arena-lobby-side arena-lobby-friend" data-battle-mode="friend" data-tone="friend">
     <span className="arena-lobby-icon"><Users aria-hidden="true"/></span><strong>フレンド</strong><small>フレンドどうし・1対1</small>
     <div className="arena-lobby-actions">
      <button type="button" onClick={()=>user?onChoose('friend-create'):onRequireLogin?.()}>部屋をつくる</button>
      <button type="button" onClick={()=>user?onChoose('friend-join'):onRequireLogin?.()}>合言葉で入る</button>
     </div>
    </div>
    <div className="arena-lobby-card arena-lobby-side arena-lobby-national" data-battle-mode="national" data-tone="national">
     <span className="arena-lobby-icon"><Wifi aria-hidden="true"/></span><strong>全国対戦</strong><small>RANKED・ランクが動く</small>
     <div className="arena-lobby-actions">
      <button type="button" onClick={()=>user?onChoose('national'):onRequireLogin?.()}>相手を見つける<Zap size={15} aria-hidden="true"/></button>
     </div>
    </div>
   </section>
   {!user && <p className="arena-login-note"><LogIn size={14} aria-hidden="true"/>フレンド・全国はログインすると遊べるよ</p>}
   {/* B13 サブ機能はメインの3択の下に「その他」としてまとめる（機能は削らない） */}
   <nav className="arena-lobby-sub" aria-label="その他の機能">
   <p className="arena-lobby-label" aria-hidden="true">その他</p>
   <div className="arena-menu-links"><button type="button" onClick={()=>onChoose('history')}><History size={16}/>対戦履歴</button><button type="button" onClick={()=>onChoose('clan')}><Shield size={16}/>マナクラン{!SOCIAL_FEATURES.manaClan && <span className="soon-tag">準備中</span>}</button></div>
   <div className="arena-lobby-help">
   <details className="arena-rules-help arena-connection-help"><summary><Activity size={14} aria-hidden="true"/>つながらないとき</summary><ConnectionCheckPanel compact/></details>
   <details className="arena-rules-help"><summary><BookOpen size={14} aria-hidden="true"/>配点と対戦ルール</summary><p>正解のみ加点。速さ点は残り時間の割合rに対して240×(0.7r²+0.3r³)。500ms単位に丸めます。3連続以上に小さな連続点。旧ルームでは作成時の配点を使用します。フレンドもお互い更新してから遊んでください。</p></details>
   </div>
   </nav>
 </BattleShell>;
}

/** ★BGMのON/OFF（アプリ全体で1つ）★ ホームのボタン・設定と同じスイッチ。待ち時間と対戦の曲もこれで止まる */
function BgmButton() {
  const [settings, update] = useBattleAudioSettings();
  return <button type="button" className="arena-bgm" aria-pressed={settings.bgm} aria-label={settings.bgm ? 'BGMを止める' : 'BGMを鳴らす'}
    onClick={() => update({ bgm: !settings.bgm })}>{settings.bgm ? <Volume2 size={19} aria-hidden="true" /> : <VolumeX size={19} aria-hidden="true" />}</button>;
}
