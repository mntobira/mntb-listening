/**
 * ===================================================================
 * 対戦モード: Firestore とのやりとり
 * ===================================================================
 *
 * ■ このファイルの責務
 * 「部屋を作る・入る・答えを出す・結果を確定する」だけ。
 * 点数の計算は一切しない（core/battleCore.ts が担当）。
 *
 * -------------------------------------------------------------------
 * ■ コレクション設計
 * -------------------------------------------------------------------
 *
 *   battle_rooms/{roomId}
 *     1試合＝1ドキュメント。★これが設計の中心★
 *     両者はこの1件だけを onSnapshot で購読する。
 *     問題ごとにドキュメントを分けると読み取り回数が問題数倍になり、
 *     無料枠（1日5万読み取り）で1日あたり数十試合しかできなくなる。
 *     1件にまとめれば1試合あたり約80読み取りで済む（約600試合/日）。
 *
 *   battle_codes/{joinCode}
 *     フレンド対戦の合言葉 → 部屋IDの逆引き。
 *     部屋を where 検索する設計にすると、ルール上
 *     battle_rooms 全体の list を開放することになり、
 *     他人の対戦を全部覗けてしまうので採用しない
 *     （既存の friend_codes と同じ考え方）。
 *
 *   battle_queue/{uid}
 *     全国ランダムマッチの待機列。1人1件。
 *     ★フレンド対戦が主役なので、こちらは副次的な入口★
 *
 *   battle_ranking/{uid}
 *     レート（Elo）と戦績。既存の leaderboard_* とは完全に別物。
 *     既存ランキングの集計・ルールには一切触らない。
 *
 *   battle_history/{uid}/items/{roomId}
 *     自分の対戦履歴。相手には書けない（自分の下にだけ書く）。
 *
 * -------------------------------------------------------------------
 * ■ 不正対策の考え方（Cloud Functions が使えない前提）
 * -------------------------------------------------------------------
 * 無料枠なのでサーバ側で判定するコードが置けない。
 * 「クライアントを信用しない」ではなく
 * ★クライアントが嘘をついても得をしない構造★ にする。
 *
 *   1. 点数を Firestore に保存しない
 *      保存するのは「何番を押したか」と「押した時刻」だけ。
 *      点数は両者が同じ純関数で計算する。
 *      → 点数を書き換える攻撃が、そもそも書く場所がない。
 *
 *   2. 時刻はサーバ時刻で刻む
 *      answeredAt には request.time（サーバ時刻）しか書けないよう
 *      ルールで縛る。端末の時計を巻き戻しても無意味。
 *
 *   3. 締切を過ぎた解答は書き込めない
 *      ルールで request.time < deadlineAt を要求する。
 *      「あとから答えを入れる」ができない。
 *
 *   4. 問題は部屋作成時に確定し、以後変更不可
 *      questionIds はルールで更新禁止。
 *      さらに部屋IDを種にした決定論的抽選なので、
 *      相手側で「この並びは本当にこの部屋の種から出たか」を検算できる。
 *
 *   5. 結果は両者の申告が一致したときだけ採用（相互確認）
 *      食い違ったら無効試合にしてレートを動かさない。
 *      片方が嘘をついても、相手のレートを下げられない。
 */

/*
 * ■ ファイル構成（2026-10-15 に機能ごとへ分割。このファイルは再公開だけを受け持つ）
 *   battleShared.ts        … コレクション名・ログイン確認・エラー文言・レート読み取り・出題の抽選
 *   battleRuleOverrides.ts … 対戦ルールの上書き
 *   battleTransport.ts     … 書き込みの待ち時間上限・再送・往復時間
 *   battleFriendRoom.ts    … フレンド対戦（合言葉の部屋）
 *   battleMatchmaking.ts   … 全国ランダムマッチの待機列
 *   battleRoomActions.ts   … 試合の進行
 *   battleHistory.ts       … 対戦履歴
 * 既存の呼び出し側（'../data/battle'）はそのまま動く。
 */
export { COL_CODES, COL_HISTORY, COL_QUEUE, COL_RANKING, COL_ROOMS, ROOM_STALE_MINUTES, canPlaySubject, drawQuestionIds, fetchMyRating } from './battleShared';
export { effectiveRule, loadBattleRuleOverrides } from './battleRuleOverrides';
export { WRITE_TIMEOUT_MS, currentRttMs, subscribeRtt } from './battleTransport';
export { NOT_FRIEND_MESSAGE, SUCCESSOR_ATTEMPTS, createFriendRoom, findSuccessorRoom, followSuccessorRoom, joinRoomByCode, joinRoomById, releaseRoomCode, successorCode } from './battleFriendRoom';
export type { CreatedRoom } from './battleFriendRoom';
export { findOrEnqueue, leaveQueue, watchMatched } from './battleMatchmaking';
export { abortRoom, advanceQuestion, attestResult, startBattle, submitAnswer, watchRoom } from './battleRoomActions';
export { fetchHistory, saveHistory } from './battleHistory';
export type { BattleHistoryItem } from './battleHistory';
