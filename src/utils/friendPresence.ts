/**
 * フレンドの在室（オンライン表示）の心拍。
 *
 * ★2026-10-30 E8：書き込みをやめた★
 *   以前は画面を開いている間 45 秒ごとに friend_profiles/{uid} へ presenceAt を書いていた
 *   （1人が1時間使うと約80回の書き込み）。ところが、それを読んで「オンライン中」を出していた
 *   FriendOnlineStrip は 2026-10-16 のリファクタリングで削除されていて、いまは誰も読んでいない。
 *   読まれない書き込みが Firestore の書き込み上限（1日2万）を押し上げていたので止める。
 *   オンライン表示を復活させるときは、書き込みではなく Realtime Database の onDisconnect か、
 *   「フレンド画面を開いている間だけ」書く形で入れ直す。
 *   呼び出し側（App.tsx）を変えなくて済むよう、関数の形は残す。
 */
export function installFriendPresence(): () => void {
  return () => {};
}
