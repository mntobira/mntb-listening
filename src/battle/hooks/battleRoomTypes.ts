/**
 * ===================================================================
 * 対戦モード: 画面が使う対戦の状態・操作の型定義
 * ===================================================================
 *
 * useBattleRoom.ts から型定義を分離（#22）。
 * useBattleRoom.ts からも再エクスポートしているため既存の import 先は不変。
 */

import type { ConnectionQuality, ConnectionState } from '../core/connection';
import type {
  BattlePlayerScore,
  BattleQuestion,
  BattleResultSummary,
  BattleRoom,
} from '../core/types';

/** 画面が使う対戦の状態 */
export interface BattleRoomState {
  loading: boolean;
  error: string | null;
  /** 開始の書き込み中 */
  starting: boolean;
  /** 出題プールを読み込めたか（false の間は開始できない） */
  poolReady: boolean;
  room: BattleRoom | null;
  /** 出題（部屋の questionIds を本体に戻したもの） */
  questions: BattleQuestion[];
  /** いま出ている問題 */
  current: BattleQuestion | null;
  /** 残りミリ秒（0で締切） */
  remainMs: number;
  /** いまの問の制限時間（秒・resolveTimeLimit 済み）。残り時間バーの分母。 */
  limitSec: number;
  /** 自分がこの問題に答えたか */
  answered: boolean;
  /** 相手が答えたか（「相手は解答済み」の表示に使う） */
  opponentAnswered: boolean;
  /** 自分が選んだ選択肢（表示のため） */
  myChoice: number;
  /** 自分が押したパネルの順 */
  myPanel: number[];
  /** 結果（試合終了後のみ） */
  result: BattleResultSummary | null;
  myScore: BattlePlayerScore | null;
  opponentScore: BattlePlayerScore | null;
  /** レートの変化（反映後のみ） */
  rating: { before: number; after: number } | null;
  /** 相手の離脱による決着か */
  byForfeit: boolean;
  /** 相手の表示名・アイコン */
  opponent: { uid: string; nickname: string; photoURL: string; rating: number } | null;
  /** 試合が終わったか */
  finished: boolean;
  /**
   * 端末の時計が大きくずれているか。
   * ずれていても対戦は成立する（サーバ時刻に寄せて計算している）が、
   * 端末側の設定を直してもらうために画面で伝える。
   */
  clockSkewed: boolean;
  /**
   * 通信の状態。
   * ★圏外でも購読は続く★ので、これがないと切れたことに気付けない。
   */
  connection: ConnectionState;
  /** 電波の強さ（アンテナ表示）と直近の往復時間 */
  quality: ConnectionQuality;
  rttMs: number | null;
  /** 解答を送信中（届くまでの間、押した選択肢を仮に出す） */
  sending: boolean;
  /** 通信が戻ったときの知らせ */
  reconnectMessage: string | null;
  /** 圏外の知らせ（出す必要がないときは null） */
  offlineMessage: string | null;
  /** 画面を離れて戻ってきたときの知らせ（同） */
  resumeMessage: string | null;
  /** 解答を送れる状態か（選択肢を押せるかの判断に使う） */
  submittable: boolean;
  /**
   * ★臨場感アップデート★ 開始カウントダウン（3・2・1・START!）の残りミリ秒。
   * 0 なら問題が始まっている。1問目の締切を「制限時間＋カウントダウン」で
   * 置き、締切から逆算して両端末が同じタイミングで数える（追加の書き込みなし）。
   */
  preStartMs: number;
  /** 自分が答えた問題番号（平均回答時間の集計に使う。無回答を除くため） */
  myAnsweredIndexes: number[];
}

export interface BattleRoomActions {
  /** 選択肢を押す（4択・2〜3択・5〜6択） */
  choose: (index: number) => void;
  /** パネル／五十音キーボードのキーを押す */
  pushPanel: (index: number) => void;
  /** 1つ戻す */
  popPanel: () => void;
  /**
   * かな入力: 最後の1文字を「゛゜小」で切り替える。
   * カ→ガ→カ のように一周して戻るので、押しすぎても詰まらない。
   */
  cyclePanel: () => void;
  /**
   * かな入力: 「けってい」で解答を送る。
   *
   * ★文字パネルには対応する操作が無い★
   * 文字パネルは札が揃った瞬間に自動で送っている（1タップぶん速い）。
   * かな入力は最後の文字に濁点を付ける余地があるので、
   * 自動で送ると「ダイヤモント」で確定してしまう。だから明示的に送る。
   */
  commitKana: () => void;
  /** 部屋主が対戦を開始する */
  start: () => void;
  /** 部屋を離脱する */
  leave: () => void;
  /** 復帰の知らせを消す */
  dismissResumeMessage: () => void;
}
