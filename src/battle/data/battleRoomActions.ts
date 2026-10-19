/**
 * 試合の進行（開始・解答・問題送り・結果の相互確認・購読・中断）。
 * 2026-10-15 のリファクタリングで battle.ts（1,420行）から機能ごとに切り出した。中身は元のまま。
 * 依存の向き: battleShared ← battleTransport / battleRuleOverrides ← battleFriendRoom / battleMatchmaking ← battleRoomActions
 * 呼び出し側は従来どおり './battle'（再公開）から import してよい。
 */
import { auth, db } from '../../firebase';
import { doc, onSnapshot, runTransaction, serverTimestamp, updateDoc } from '../../utils/firestoreMetered';
import type { Unsubscribe } from '../../utils/firestoreMetered';
import { observeLowerBound, observeRoundTrip, toMillis } from '../core/serverClock';
import { answerKeyOf } from '../core/types';
import type { BattleAttestation, BattleRoom } from '../core/types';
import { COL_ROOMS, friendlyError, requireUid } from './battleShared';
import { clearLastWrite, deadlineFromNow, peekLastWrite, resilientWrite } from './battleTransport';
import { releaseJoinCode } from './battleFriendRoom';

// ============================================================
// 試合の進行
// ============================================================

/**
 * 対戦を開始する（部屋主だけが呼ぶ）。
 *
 * ★deadlineAt を1回だけ書く理由★
 * 「残り時間」を秒ごとに書き込むと、1問10秒で
 * 1試合あたり100回の書き込みになり無料枠を食い潰す。
 * 締切時刻を1回書いて、あとは各端末が自分の時計で引き算する。
 * 書き込みは1問1回（進行のときだけ）に収まる。
 */
export async function startBattle(roomId: string, firstTimeLimitSec: number): Promise<void> {
  requireUid();
  try {
    // 開始は再送してよい（2回目以降の permission-denied は「最初の送信で既に始まっている」）
    await resilientWrite(() =>
      updateDoc(doc(db, COL_ROOMS, roomId), {
        status: 'playing',
        currentIndex: 0,
        deadlineAt: deadlineFromNow(firstTimeLimitSec),
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
      { budgetMs: 15_000, acceptDeniedAfterRetry: true, attemptTimeoutMs: 6_000 },
    );
  } catch (error) {
    throw friendlyError(error, '対戦を開始できませんでした。');
  }
}

/**
 * 解答を記録する。
 *
 * ★点数を送らない★
 * 送るのは「何番を押したか（choice）」「どの順に押したか（panel）」だけ。
 * 正解かどうかも送らない。両者が同じ関数で判定する。
 */
export async function submitAnswer(
  roomId: string,
  index: number,
  payload: { choice: number; panel: number[] },
  answered: boolean,
  opts?: { budgetMs?: number },
): Promise<void> {
  const uid = requireUid();

  // 同じ問題に2回答えるのを防ぐ（連打・再描画対策）。
  // ★これは通信を無駄にしないための予防で、防御の本体ではない★
  //   本体は Firestore ルール側（すでに q{index} があれば書き込み拒否）。
  //   ここだけに頼ると、開発者ツールから直接呼ばれた時に防げない。
  if (answered) return;

  try {
    // ★1問ぶんを「1フィールド」として書く★
    //
    // パス指定（`answers.{uid}.q{index}`）で書くと、
    // ・同じマップ内の他の問題（q0, q1 …）はサーバ側で保持される
    //   → 相手や自分の他の回答を消さずに済む
    // ・answeredAt が配列の中に入らない
    //   → serverTimestamp() が使える（配列の中では使えない）
    //
    // ここを配列（`answers.{uid}` に配列を丸ごと入れる）でやっていたときは、
    //   serverTimestamp() is not currently supported inside arrays
    // で必ず例外になり、★1問も回答できなかった★。
    // ★解答は締切まで再送する★（一瞬の圏外で解答が消えないように）。
    //   締切を過ぎたらルールが拒否するので、それ以上は送らない。
    //   再送後の permission-denied は「最初の送信が届いていた」（二重解答の拒否）とみなす。
    await resilientWrite(() =>
      updateDoc(doc(db, COL_ROOMS, roomId), {
        [`answers.${uid}.${answerKeyOf(index)}`]: {
          index,
          choice: payload.choice,
          panel: payload.panel,
          // ★時刻はサーバに刻ませる★（端末時計を信用しない）
          //   ルール側で `== request.time` を強制しているので、
          //   ここを固定値に書き換えても書き込みが通らない。
          answeredAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      }),
      { budgetMs: Math.max(1_500, opts?.budgetMs ?? 8_000), acceptDeniedAfterRetry: true, attemptTimeoutMs: 4_000 },
    );
  } catch (error) {
    throw friendlyError(error, '解答を送信できませんでした。');
  }
}

/**
 * 次の問題に進める。
 *
 * ★両者が呼んでも壊れない形にする★
 * 「部屋主だけが進める」設計にすると、部屋主の回線が切れた瞬間に
 * 試合が永久に止まる。そこで
 *   ・進める条件（次の番号が今より大きい）をルールで縛り
 *   ・両者が呼べるようにする
 * 二人が同時に呼んでも、同じ値を書くだけなので結果は同じになる。
 */
export async function advanceQuestion(
  roomId: string,
  nextIndex: number,
  nextTimeLimitSec: number,
): Promise<void> {
  requireUid();
  try {
    await resilientWrite(() =>
      updateDoc(doc(db, COL_ROOMS, roomId), {
        currentIndex: nextIndex,
        deadlineAt: deadlineFromNow(nextTimeLimitSec),
        updatedAt: serverTimestamp(),
      }),
      { budgetMs: 10_000, acceptDeniedAfterRetry: true, attemptTimeoutMs: 5_000 },
    );
  } catch (error) {
    // 相手が先に進めていた場合の競合は無視してよい（同じ状態になる）
    if ((error as { code?: string }).code !== 'permission-denied') {
      throw friendlyError(error, '次の問題に進めませんでした。');
    }
  }
}

/**
 * 自分が計算した結果を申告する（相互確認）。
 *
 * ★両者の申告が一致したときだけレートを動かす★
 * 片方が「自分の勝ち」と嘘をついても、相手の申告と食い違うので
 * 無効試合になる。相手のレートを下げることはできない。
 */
export async function attestResult(
  roomId: string,
  attestation: BattleAttestation,
): Promise<void> {
  const uid = requireUid();
  try {
    await resilientWrite(() =>
      updateDoc(doc(db, COL_ROOMS, roomId), {
        [`attest.${uid}`]: {
          myScore: attestation.myScore,
          opponentScore: attestation.opponentScore,
          outcome: attestation.outcome,
          at: serverTimestamp(),
        },
        status: 'finished',
        updatedAt: serverTimestamp(),
      }),
      { budgetMs: 30_000, acceptDeniedAfterRetry: true },
    );
  } catch (error) {
    throw friendlyError(error, '結果を送信できませんでした。');
  }
}

/**
 * 部屋を購読する（★1試合＝1ドキュメント＝購読1本★）
 *
 * @param onConnection 通信の状態が分かったときに呼ばれる。
 *   ★これを渡す理由★
 *   Firestore は圏外でも端末内の控えを返して購読を続けるので、
 *   画面だけ見ていると通信が切れたことに気付けない。
 *   気付けないまま解答すると、書き込みは端末に溜まり、
 *   通信が戻ったときには締切を過ぎていてルールに拒否される
 *   （＝答えたのに消える）。
 *   そこでスナップショットが端末内の控えかどうか（fromCache）を
 *   そのまま上に伝え、画面で「通信が切れています」と出せるようにする。
 */
export function watchRoom(
  roomId: string,
  onChange: (room: BattleRoom | null) => void,
  onError?: (error: Error) => void,
  onConnection?: (state: 'online' | 'offline') => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, COL_ROOMS, roomId),
    { includeMetadataChanges: true },
    (snap) => {
      // ★通信の状態を先に伝える★
      //
      // fromCache は「この内容は端末内の控えで、サーバとは同期していない」印。
      // 圏外・機内モード・通信の一時停止で真になる。
      // hasPendingWrites は「自分の書き込みがまだサーバに届いていない」印で、
      // これ自体は通常の書き込み直後にも立つので、切断の判断には使わない。
      //
      // ★metadata を先に取り出しておく理由★
      // exists() は型を絞り込む述語なので、否定側（存在しない場合）では
      // 型が never になり snap.metadata を参照できない。
      // 判定より前に控えておく。
      const fromCache = snap.metadata.fromCache;
      const hasPendingWrites = snap.metadata.hasPendingWrites;
      onConnection?.(fromCache ? 'offline' : 'online');

      if (!snap.exists()) {
        // ★端末内の控えが空なだけの可能性がある★
        // 圏外で購読を始めた直後は控えが無いので「無い」と返ってくる。
        // これを「部屋が消えた」と扱うと、電波が悪いだけで
        // 対戦から追い出されてしまう。控えの場合は判断を保留する。
        if (fromCache) return;
        onChange(null);
        return;
      }
      const data = snap.data() as { updatedAt?: unknown };

      // ★ここでサーバ時刻を観測する（追加の通信は0）★
      //
      // 部屋への書き込みはすべて updatedAt: serverTimestamp() を含んでいるので、
      // 届いたスナップショットにはサーバが刻んだ時刻が乗っている。
      // これと端末時刻を突き合わせれば、時計のずれが分かる。
      //
      // ただし ★保留状態（fromCache / hasPendingWrites）のスナップショットは使えない★。
      // 自分の書き込みが反映される前の段階では updatedAt がまだ
      // 端末側の推定値（null や直前の値）なので、これを採用すると
      // 「自分の時計を自分で確認する」ことになり、ずれが永久に消えない。
      const settled = !hasPendingWrites && !fromCache;
      const serverMs = settled ? toMillis(data.updatedAt) : null;

      if (serverMs != null) {
        const pending = peekLastWrite();
        if (pending && serverMs >= pending.sentAt - 1) {
          // 自分の書き込みが返ってきた場合。送信と応答の間に
          // サーバが刻んだと分かるので、往復から誤差を絞れる（本命）。
          observeRoundTrip(serverMs, pending.sentAt, pending.ackAt);
          clearLastWrite();
        } else {
          // 相手の書き込みが届いた場合。いつ送られたかは分からないので
          // 「サーバ時刻はこれ以上」という下限としてだけ使う。
          // 数分単位の大きなずれはこれで最初の1通で見つかる。
          observeLowerBound(serverMs, Date.now());
        }
      }

      onChange({ id: snap.id, ...(snap.data() as object) } as BattleRoom);
    },
    (error) => onError?.(friendlyError(error, '対戦の通信が切れました。')),
  );
}

/**
 * 部屋を離脱する（相手には不戦勝として見える）。
 *
 * ★待機中の退出は部屋そのものを閉じる（status: 'aborted'）★
 *
 * 以前は left.{自分} を書くだけだった。すると待機中（waiting）に
 * 部屋主が「部屋をでる」を押しても部屋は waiting のまま残り、
 * 合言葉を知っている人が★もう誰もいない部屋★に入れてしまった
 * （独立検証で再現。入った側は「相手を待っています…」のまま止まる）。
 * 待機中なら相手はまだ試合を始めていないので、閉じても失うものが無い。
 *
 * ★トランザクションにした理由★
 * 「部屋をでる」を押した瞬間に相手が「はじめる」を押していると、
 * 読んだときは waiting でも書くときには playing になっている。
 * その場合に aborted を書くと、始まった試合を消してしまう。
 * 読み直してから書くことで、始まっていたら left だけを残す
 * （＝相手の不戦勝になる）。
 *
 * 進行中（playing）の退出は従来どおり left だけを書く。
 * 勝敗は残った側が left を見て決める（useBattleRoom の explicitForfeit）。
 */
export async function abortRoom(roomId: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  try {
    await runTransaction(db, async (tx) => {
      const ref = doc(db, COL_ROOMS, roomId);
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const room = snap.data() as BattleRoom;
      // 参加者でない／もう退出済み／決着済み・中断済み なら何もしない
      if (!room.players.includes(uid)) return;
      if (room.left?.[uid]) return;
      if (room.status !== 'waiting' && room.status !== 'playing') return;

      tx.update(ref, {
        ...(room.status === 'waiting' ? { status: 'aborted' } : {}),
        [`left.${uid}`]: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  } catch {
    // 離脱の記録に失敗しても、相手側は無応答から不戦勝を判定できる
  }
  void releaseJoinCode(roomId);
}
