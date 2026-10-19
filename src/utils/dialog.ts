/**
 * 利用者への「お知らせ」と「確認」の唯一の窓口（監査 #28）。
 *
 * 以前は画面ごとに window.alert / window.confirm を直接呼んでいた（9ファイル・16か所）。
 * 見た目を変えずに呼び出し口だけをここへ集め、
 *   ・アプリ内のトースト／確認モーダルへ切り替えるときは、このファイルだけを直せばよい
 *   ・テストでは setDialogHandlers で差し替えられる（jsdom の未実装 alert に依存しない）
 * ようにした。現在の実装はブラウザ標準のダイアログのまま（挙動は従来どおり）。
 */

export interface DialogHandlers {
  /** お知らせを出す（閉じるまで待つ必要はない） */
  notify: (message: string) => void;
  /** はい／いいえを聞く。はい なら true */
  confirm: (message: string) => boolean;
}

const browserHandlers: DialogHandlers = {
  notify: (message) => { window.alert(message); },
  confirm: (message) => window.confirm(message),
};

let handlers: DialogHandlers = browserHandlers;

export function notify(message: string): void {
  handlers.notify(message);
}

export function confirmAction(message: string): boolean {
  return handlers.confirm(message);
}

/** 差し替え（アプリ内UIへの移行・テスト用）。戻り値で元に戻せる */
export function setDialogHandlers(next: Partial<DialogHandlers>): () => void {
  const prev = handlers;
  handlers = { ...handlers, ...next };
  return () => { handlers = prev; };
}
