/**
 * アカウント同期（userDataSync）が localStorage を書き換えたときに出すイベント名。
 * 成長記録（growthStore）など、同期の中身を知らない画面側が読み直すために使う。
 * ★葉モジュール（何も import しない）★ growthStore → userDataSyncCore → studySyncCore → reviewList → growthStore
 *   の循環参照を作らないよう、イベント名だけをここに置く。
 */
export const USER_DATA_SYNCED_EVENT = 'manatobi:user-data-synced';
