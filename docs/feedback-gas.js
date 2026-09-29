/**
 * ===================================================================
 * まなとび（ChemNote）フィードバック受け取り用 Google Apps Script
 * ===================================================================
 *
 * このファイルは、アプリに届いたフィードバックを
 * 【Google スプレッドシートに1行ずつ自動追記する】ためのサーバー側スクリプトです。
 *
 * アプリ本体（src/utils/feedback.ts）は、環境変数
 *
 *     VITE_FEEDBACK_WEBHOOK_URL=https://script.google.com/macros/s/xxxxx/exec
 *
 * が設定されている場合に、このスクリプトへ JSON を POST します。
 *
 * -------------------------------------------------------------------
 * ■ 導入手順（所要 5〜10分）
 * -------------------------------------------------------------------
 *  STEP 1. 受け取り用の Google スプレッドシートを新規作成する
 *          （タブ名は気にしなくてOK。「feedback」タブが自動生成されます）
 *  STEP 2. そのスプレッドシートで［拡張機能］→［Apps Script］を開く
 *  STEP 3. エディタの中身を全部消して、このファイルの内容をそのまま貼り付け、保存する
 *  STEP 4. 下の CONFIG を確認する（スプレッドシート運用なら基本は変更不要）
 *            - APPEND_SHEET   : true  ← シートに記録する（既定でON）
 *            - SEND_EMAIL     : false ← メール通知は使わない（既定でOFF）
 *            - SPREADSHEET_ID : ''    ← STEP 2 の手順なら空のままでOK
 *  STEP 5. エディタ上部の関数選択で「testFeedback」を選び［実行］
 *            → 初回は権限の承認ダイアログが出るので許可する
 *            → シートにテスト行が1行増えることを確認して、その行は削除する
 *  STEP 6. ［デプロイ］→［新しいデプロイ］→ 種類「ウェブアプリ」
 *            - 次のユーザーとして実行 : 自分
 *            - アクセスできるユーザー : 全員（★ここが「全員」でないと受信できません）
 *  STEP 7. 表示された「ウェブアプリのURL」（末尾が /exec）をコピーし、
 *          ブラウザでそのURLを開いて次の表示になることを確認する
 *            ChemNote feedback endpoint is running.
 *            sheet: OK (feedback)
 *            mail: OFF
 *  STEP 8. アプリの .env（および本番のデプロイ環境の環境変数）に設定する
 *            VITE_FEEDBACK_WEBHOOK_URL=コピーしたURL
 *          → 再ビルド／再デプロイ
 *  STEP 9. アプリのタイトル画面「ご意見・ご要望」からテスト送信し、
 *          シートに1行増えることを確認する
 *
 * -------------------------------------------------------------------
 * ■ 補足
 * -------------------------------------------------------------------
 *  - このスクリプトを設定しなくても、フィードバックは Firestore の
 *    `feedback` コレクションに必ず保存されます（消えません）。
 *    このスクリプトは「スプレッドシートという見やすい場所へ流す」ためのものです。
 *  - あとから「メールでも通知が欲しい」となった場合は SEND_EMAIL を true にして
 *    再デプロイするだけでよく、アプリ本体の変更は不要です。
 *  - コード変更後は必ず［デプロイ］→［デプロイを管理］→ 鉛筆アイコン →
 *    バージョン「新バージョン」で再デプロイしてください（URLは変わりません）。
 */

/* eslint-disable no-undef */

var CONFIG = {
  // ---------------- スプレッドシートに記録する（既定：ON） ----------------
  /** スプレッドシートへの追記を行うか */
  APPEND_SHEET: true,
  /** 記録先シート名（存在しなければ自動作成） */
  SHEET_NAME: 'feedback',
  /**
   * 利用者台帳のシート名（存在しなければ自動作成）。
   * 「総ユーザー数」と「登録されている Google アカウント」は
   * このシートを見れば分かる（1人1行で上書きされる）。
   */
  USER_SHEET_NAME: 'users',
  /**
   * 記録先スプレッドシートのID。
   * スプレッドシートの『拡張機能 → Apps Script』から作った場合は
   * 空のままでOK（紐づいているシートを自動で使います）。
   * script.google.com から単体で作った場合は、URL の
   *   docs.google.com/spreadsheets/d/【ここがID】/edit
   * をコピーして貼ってください。
   */
  SPREADSHEET_ID: '',

  // ---------------- メールでも通知する（既定：OFF） ----------------
  /**
   * メール通知を行うか。
   * 「シートに溜めるだけでよい」なら false、
   * 「届いたらすぐに気づきたい」なら true にして再デプロイすれば
   * アプリ本体は一切触らずに切り替えられます。
   */
  SEND_EMAIL: false,
  /** 通知メールの宛先（SEND_EMAIL = true のときのみ使用） */
  NOTIFY_EMAIL: 'mntobira@gmail.com',

  /**
   * 任意の共有シークレット。空文字なら検証しない。
   * 設定する場合はアプリ側の payload に含める仕組みが別途必要なため、
   * 通常は空のままで構いません（URL自体が事実上の秘密鍵になります）。
   */
  SHARED_SECRET: '',
};

var HEADERS = [
  '受信日時',
  '管理ID',
  '送信画面',
  '種類',
  '評価', // ★ 数値のみ（1〜5）。AVERAGE() でそのまま平均を取れる
  '内容',
  '返信用メール',
  'ユーザー名',
  'uid',
  'ログインメール',
  '付帯情報',
  'アプリ版',
  '画面サイズ',
  'UserAgent',
  '端末送信日時',
];

/**
 * 利用者台帳（users シート）の見出し。
 * uid をキーに1人1行で上書きするので、
 * 行数（見出しを除く）= 総ユーザー数になる。
 */
var USER_HEADERS = [
  '初回登録日時',
  '最終利用日時',
  'Google連携',
  'メールアドレス',
  'Google表示名',
  'アプリ内ニックネーム',
  '学年',
  '連続学習日数',
  '修了章数',
  'uid',
  'アカウント作成日',
  'アプリ版',
  'UserAgent',
];

var SCREEN_LABELS = {
  title: 'タイトル画面',
  chapter_result: '単元の結果画面',
  mock_exam_result: '模擬試験の結果画面',
  other: 'その他の画面',
};

var CATEGORY_LABELS = {
  praise: 'よかった点',
  problem: '問題・解説の内容',
  bug: '不具合・表示崩れ',
  request: '要望・改善案',
  other: 'その他',
};

/**
 * 動作確認用。デプロイURLをブラウザで開くとこの文字列が出れば公開設定は正しい。
 * シートへの接続可否もここで分かる。
 *
 * また
 *     ...\/exec?ping=1&callback=関数名
 * のように呼ばれたときは JSONP を返す。
 * これにより「このURLに匿名で到達できるか」をブラウザからでも確実に判定でき、
 * 「アクセスできるユーザーが［全員］になっていない（401）」を検出できる。
 */
function doGet(e) {
  var params = (e && e.parameter) || {};

  if (params.ping) {
    var body = JSON.stringify({ ok: true, service: 'chemnote-feedback' });
    if (params.callback) {
      return ContentService
        .createTextOutput(params.callback + '(' + body + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
  }

  var status = 'ChemNote feedback endpoint is running.';
  if (CONFIG.APPEND_SHEET) {
    try {
      status += '\nsheet: OK (' + getSheet().getName() + ')';
    } catch (error) {
      status += '\nsheet: NG - ' + error;
    }
    try {
      var userSheet = getUserSheet();
      // 見出し行を除いた行数 = 登録ユーザー数
      var userCount = Math.max(0, userSheet.getLastRow() - 1);
      status += '\nusers: OK (' + userSheet.getName() + ', ' + userCount + '人)';
    } catch (error) {
      status += '\nusers: NG - ' + error;
    }
  }
  status += '\nmail: ' + (CONFIG.SEND_EMAIL ? 'ON -> ' + CONFIG.NOTIFY_EMAIL : 'OFF');
  return ContentService.createTextOutput(status).setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Apps Script エディタ内で手動実行して動作確認する関数。
 * 実行するとテスト行が1行追加される（初回の権限認証にも使える）。
 * ▶ エディタ上部の関数選択で testFeedback を選んで「実行」
 */
function testFeedback() {
  var result = doPost({
    postData: {
      contents: JSON.stringify({
        id: 'fb_manual_test',
        screen: 'title',
        category: 'other',
        rating: 5,
        message: 'これは動作確認用のテスト送信です。この行は削除してください。',
        uid: null,
        displayName: '動作確認',
        createdAtIso: new Date().toISOString(),
        appVersion: 'manual-test',
      }),
    },
  });
  Logger.log(result.getContent());
}

/**
 * 利用者台帳（users シート）の動作確認用。
 * 実行するとテスト行が1行追加される（確認後は削除してください）。
 * 2回実行しても行が増えなければ「1人1行」の上書きが正しく動いている。
 * ▶ エディタ上部の関数選択で testUserRecord を選んで「実行」
 */
function testUserRecord() {
  var result = doPost({
    postData: {
      contents: JSON.stringify({
        kind: 'user',
        event: 'signup',
        uid: 'uid_manual_test',
        isGoogleLinked: true,
        displayName: '動作確認ユーザー',
        email: 'test@example.com',
        profileName: 'てすと',
        grade: '高校1年',
        streak: 3,
        completedCount: 2,
        createdAtIso: new Date().toISOString(),
        recordedAtIso: new Date().toISOString(),
        appVersion: 'manual-test',
      }),
    },
  });
  Logger.log(result.getContent());
}

/**
 * アプリからの POST を受け取る本体。
 */
function doPost(e) {
  try {
    var payload = parsePayload(e);

    if (CONFIG.SHARED_SECRET && payload.secret !== CONFIG.SHARED_SECRET) {
      return jsonResponse({ ok: false, error: 'forbidden' });
    }

    // ★ 利用者台帳の記録（kind === 'user'）はフィードバックとは別のシートへ。
    //   フィードバックには message が必須だが、こちらには無いので先に振り分ける。
    if (payload.kind === 'user') {
      if (CONFIG.APPEND_SHEET) upsertUserRow(payload);
      return jsonResponse({ ok: true, uid: payload.uid || '' });
    }

    if (!payload.message) {
      return jsonResponse({ ok: false, error: 'message is required' });
    }

    if (CONFIG.APPEND_SHEET) appendToSheet(payload);
    if (CONFIG.SEND_EMAIL) sendNotificationMail(payload);

    return jsonResponse({ ok: true, id: payload.id || '' });
  } catch (error) {
    // 失敗しても 200 を返す（アプリ側は本文の ok を見ない設計だが、
    // 500 だと再送キューに積まれて何度も届くため、原因はログで追う）
    console.error(error);
    return jsonResponse({ ok: false, error: String(error) });
  }
}

/** リクエストボディを JSON として読む */
function parsePayload(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try {
    return JSON.parse(e.postData.contents) || {};
  } catch (error) {
    // フォーム形式で送られた場合の保険
    return (e.parameter || {});
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** 記録先スプレッドシートを取得する */
function getBook() {
  if (CONFIG.SPREADSHEET_ID) {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) {
    throw new Error(
      '記録先のスプレッドシートが見つかりません。' +
      'CONFIG.SPREADSHEET_ID にスプレッドシートのIDを設定してください。'
    );
  }
  return active;
}

/** シートを取得（無ければ作成し、見出し行を用意する） */
function getSheet() {
  var book = getBook();
  var sheet = book.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(CONFIG.SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#FBE0E9');
    sheet.setFrozenRows(1);
    // 「内容」列を広めにして読みやすくする
    sheet.setColumnWidth(6, 420);
  }
  return sheet;
}

function label(map, key, fallback) {
  return map[key] || key || fallback;
}

function appendToSheet(p) {
  var sheet = getSheet();
  sheet.appendRow([
    new Date(),
    p.id || '',
    label(SCREEN_LABELS, p.screen, '不明'),
    label(CATEGORY_LABELS, p.category, '不明'),
    // ★ 評価は「数値」として書く。
    //   以前は '5 / 5' という文字列だったため、シート上で
    //   AVERAGE() の対象にならず平均が計算できなかった。
    //   アプリ側で星評価を必須化したので通常は 1〜5 が入るが、
    //   旧バージョンのアプリからの送信に備え、
    //   未選択は空セルにする（0 を入れると平均を下げてしまうため）。
    typeof p.rating === 'number' && p.rating > 0 ? p.rating : '',
    p.message || '',
    p.contactEmail || '',
    p.displayName || 'ゲスト',
    p.uid || '',
    p.authEmail || '',
    p.context ? JSON.stringify(p.context) : '',
    p.appVersion || '',
    p.viewport || '',
    p.userAgent || '',
    p.createdAtIso || '',
  ]);
  // 折り返し表示にして長文でも読める状態を保つ
  sheet.getRange(sheet.getLastRow(), 6).setWrap(true);
}

/**
 * 利用者台帳のシートを取得（無ければ作成し、見出し行を用意する）
 */
function getUserSheet() {
  var book = getBook();
  var sheet = book.getSheetByName(CONFIG.USER_SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(CONFIG.USER_SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(USER_HEADERS);
    sheet.getRange(1, 1, 1, USER_HEADERS.length).setFontWeight('bold').setBackground('#E8DAF5');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(4, 240); // メールアドレス列を広めに
  }
  return sheet;
}

/**
 * 利用者を1人1行で記録する（uid をキーに上書き）。
 *
 * ★ なぜ追記ではなく上書きなのか
 *   起動のたびに追記すると同じ人が何行も並び、
 *   「総ユーザー数＝行数」で数えられなくなってしまう。
 *   uid で既存行を探して更新することで、
 *   行数がそのまま実際の登録者数になるようにしている。
 *
 *   初回登録日時だけは既存の値を保持し、上書きしない。
 */
function upsertUserRow(p) {
  var sheet = getUserSheet();
  var now = new Date();
  var uid = p.uid || '';
  if (!uid) return;

  var uidColumn = USER_HEADERS.indexOf('uid') + 1; // 1-based
  var lastRow = sheet.getLastRow();

  // 既存行を探す（見出し行を除く）
  var targetRow = 0;
  var firstSeen = now;
  if (lastRow >= 2) {
    var uids = sheet.getRange(2, uidColumn, lastRow - 1, 1).getValues();
    for (var i = 0; i < uids.length; i++) {
      if (String(uids[i][0]) === uid) {
        targetRow = i + 2;
        break;
      }
    }
  }
  if (targetRow) {
    // 初回登録日時は保持する
    var existing = sheet.getRange(targetRow, 1).getValue();
    if (existing) firstSeen = existing;
  }

  var row = [
    firstSeen,
    now,
    p.isGoogleLinked ? '連携済み' : 'ゲスト',
    p.email || '',
    p.displayName || '',
    p.profileName || '',
    p.grade || '',
    typeof p.streak === 'number' ? p.streak : '',
    typeof p.completedCount === 'number' ? p.completedCount : '',
    uid,
    p.createdAtIso || '',
    p.appVersion || '',
    p.userAgent || '',
  ];

  if (targetRow) {
    sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

function sendNotificationMail(p) {
  var screenLabel = label(SCREEN_LABELS, p.screen, '不明');
  var categoryLabel = label(CATEGORY_LABELS, p.category, '不明');
  var subject = '【まなとび】フィードバック（' + screenLabel + '／' + categoryLabel + '）';

  var lines = [
    '■ 内容',
    p.message || '',
    '',
    '■ 基本情報',
    '送信画面: ' + screenLabel,
    '種類: ' + categoryLabel,
    '評価: ' + (p.rating ? p.rating : '未選択'),
    '返信希望先: ' + (p.contactEmail || '（なし）'),
    'ユーザー: ' + (p.displayName || 'ゲスト') + (p.uid ? '（uid: ' + p.uid + '）' : '（ゲスト）'),
    'ログインメール: ' + (p.authEmail || '（なし）'),
    '端末送信日時: ' + (p.createdAtIso || ''),
    'アプリ版: ' + (p.appVersion || ''),
    '画面サイズ: ' + (p.viewport || ''),
    'UserAgent: ' + (p.userAgent || ''),
    '管理ID: ' + (p.id || ''),
  ];

  if (p.context) {
    lines.push('', '■ 付帯情報');
    var context = p.context;
    Object.keys(context).forEach(function (key) {
      lines.push('  - ' + key + ': ' + context[key]);
    });
  }

  if (CONFIG.APPEND_SHEET) {
    try {
      lines.push('', '■ 記録先シート', getBook().getUrl());
    } catch (error) {
      // シートURLが取れなくてもメール自体は送る
    }
  }

  var options = {};
  // 返信用メールが書かれていれば、そのままメーラーの「返信」で返せるようにする
  if (p.contactEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.contactEmail)) {
    options.replyTo = p.contactEmail;
  }

  MailApp.sendEmail(CONFIG.NOTIFY_EMAIL, subject, lines.join('\n'), options);
}
