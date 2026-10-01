/**
 * ===================================================================
 * 対戦の「通信チェック」— つながらないとき、どこで止まっているかを1行ずつ出す
 * ===================================================================
 *
 * ■ なぜ必要か
 *   対戦がつながらない原因は、利用者側（電波・学校のWi-Fi・アプリ内ブラウザ・時計）と
 *   運営側（Firebase の設定漏れ：ルール未反映・索引未作成・ドメイン未登録）の両方にある。
 *   どれも画面上は「始まらない」「許可されていません」としか見えず、原因に辿り着けない。
 *   特にリスニング版のように★新しい Firebase プロジェクトにつなぎ直す★ときは、
 *   設定漏れが1つでもあると全国対戦だけ・フレンド対戦だけが黙って壊れる。
 *
 * ■ 作り
 *   ここは★純粋な関数だけ★（ブラウザ・Firebase に触らない）。
 *   実際の読み取りは data/connectionProbe.ts が行い、結果をここに渡して判定する。
 *   Firebase のエラーコード → 「誰が・何をすれば直るか」の対応表もここに置く。
 *   統合版とリスニング版で同じファイルをそのまま使う（接続先は firebase.ts だけが知っている）。
 */

export type CheckId = 'network' | 'browser' | 'auth' | 'firestore' | 'rules' | 'index' | 'clock';
export type CheckStatus = 'ok' | 'warn' | 'fail' | 'skip';
/** 直すのは誰か（利用者が自分で直せるのか、運営に伝えるべきか） */
export type CheckOwner = 'user' | 'operator';

export type CheckResult = {
  id: CheckId;
  label: string;
  status: CheckStatus;
  detail: string;
  /** 直し方（ok のときは無し） */
  fix?: string;
  owner?: CheckOwner;
};

export const CHECK_LABELS: Record<CheckId, string> = {
  network: 'インターネット',
  browser: 'ブラウザ',
  auth: 'ログイン',
  firestore: 'サーバーへの接続',
  rules: '対戦のデータ（ルール）',
  index: '全国マッチの検索（索引）',
  clock: '端末の時計',
};

/** 実際に測った値（connectionProbe が集める） */
export type ProbeInput = {
  online: boolean;
  inAppBrowser: boolean;
  configured: boolean;
  signedIn: boolean;
  /** Firestore の読み取り（battle_rules）。null は未実施 */
  read: { ok: true; ms: number } | { ok: false; code: string } | null;
  /** 自分が参加者の部屋を探す読み取り（索引が要る）。null は未実施（未ログインなど） */
  indexQuery: { ok: true } | { ok: false; code: string } | null;
  /** 端末時計とサーバ時刻の差（ms）。null は測れなかった */
  clockOffsetMs: number | null;
};

export const SLOW_READ_MS = 1_500;
export const CLOCK_WARN_MS = 10_000;

/** Firebase のエラーコード → 原因と直し方 */
export function describeFirebaseCode(code: string): { detail: string; fix: string; owner: CheckOwner } {
  const c = String(code || '').replace(/^firestore\//, '').replace(/^auth\//, '');
  switch (c) {
    case 'permission-denied':
      return { detail: 'サーバーが読み取りを拒否しました（permission-denied）', fix: 'Firestore ルールが未反映か古い可能性があります。運営者が `firebase deploy --only firestore:rules --project <ID>` を実行してください。', owner: 'operator' };
    case 'failed-precondition':
      return { detail: '検索に必要な索引がありません（failed-precondition）', fix: '運営者が `firebase deploy --only firestore:indexes --project <ID>` を実行し、Firebase コンソールで索引の作成完了（数分）を待ってください。', owner: 'operator' };
    case 'unavailable':
    case 'deadline-exceeded':
      return { detail: 'サーバーに届きませんでした（' + c + '）', fix: '電波の良い場所で再度お試しください。学校・会社のWi-Fiでは止められていることがあります（モバイル回線なら通ることがあります）。', owner: 'user' };
    case 'unauthenticated':
      return { detail: 'ログインの確認に失敗しました（unauthenticated）', fix: 'いったんログアウトして、もう一度ログインしてください。', owner: 'user' };
    case 'unauthorized-domain':
      return { detail: 'このURLはログインが許可されていません（unauthorized-domain）', fix: '運営者が Firebase コンソール → Authentication → 設定 → 承認済みドメイン に公開URLのドメインを追加してください。', owner: 'operator' };
    case 'invalid-api-key':
    case 'api-key-not-valid':
      return { detail: 'Firebase の設定値（APIキー）が正しくありません', fix: '運営者が .env.local の VITE_FIREBASE_* をコンソールの値に合わせ、ビルドし直してください。', owner: 'operator' };
    case 'not-found':
      return { detail: 'Firestore データベースが見つかりません（not-found）', fix: '運営者が Firebase コンソールで Cloud Firestore を作成してください（本番モード）。', owner: 'operator' };
    case 'resource-exhausted':
      return { detail: '無料枠の上限に達しています（resource-exhausted）', fix: '時間をおいてお試しください。続く場合は運営者が Firebase の利用状況・プランを確認してください。', owner: 'operator' };
    case 'timeout':
      return { detail: '8秒待っても応答がありませんでした', fix: '電波の良い場所で再度お試しください。学校・会社のWi-Fiでは止められていることがあります。', owner: 'user' };
    default:
      return { detail: 'つながりませんでした（' + (c || '原因不明') + '）', fix: '時間をおいてお試しください。続く場合はこの画面の内容を運営者に伝えてください。', owner: 'operator' };
  }
}

const row = (id: CheckId, status: CheckStatus, detail: string, extra: Partial<CheckResult> = {}): CheckResult =>
  ({ id, label: CHECK_LABELS[id], status, detail, ...extra });

/** 測った値から、上から順に「どこまで通ったか」を決める。前の段が落ちたら後ろは skip。 */
export function evaluateConnection(p: ProbeInput): CheckResult[] {
  const out: CheckResult[] = [];
  let blocked = false;
  const skip = (id: CheckId) => out.push(row(id, 'skip', '前の項目が通るまで確認できません'));

  if (!p.online) { out.push(row('network', 'fail', '端末がオフラインです', { fix: 'Wi-Fi かモバイル回線につないでください。', owner: 'user' })); blocked = true; }
  else out.push(row('network', 'ok', 'つながっています'));

  if (p.inAppBrowser) out.push(row('browser', 'warn', 'LINE・Instagram などのアプリ内ブラウザです', { fix: '右上のメニューから「ブラウザで開く」を選び、Safari か Chrome で開き直してください（ログインできないことがあります）。', owner: 'user' }));
  else out.push(row('browser', 'ok', '標準のブラウザです'));

  if (!p.configured) { out.push(row('firestore', 'fail', 'このアプリはまだ Firebase につながる設定がされていません', { fix: '運営者が .env.local に専用プロジェクトの VITE_FIREBASE_* を入れてビルドしてください（README の「オンライン対戦の設定」）。', owner: 'operator' })); blocked = true; }

  if (blocked) { for (const id of ['auth', 'firestore', 'rules', 'index', 'clock'] as CheckId[]) if (!out.some(r => r.id === id)) skip(id); return out; }

  if (!p.read) skip('firestore');
  else if (p.read.ok === true) out.push(row('firestore', p.read.ms > SLOW_READ_MS ? 'warn' : 'ok', `応答 ${p.read.ms}ms`, p.read.ms > SLOW_READ_MS ? { fix: '通信が遅めです。対戦はできますが、速さの点で不利になることがあります。', owner: 'user' } : {}));
  else {
    const code = (p.read as { code: string }).code;
    const d = describeFirebaseCode(code);
    const id: CheckId = /permission-denied/.test(code) ? 'rules' : 'firestore';
    if (id === 'rules') out.push(row('firestore', 'ok', 'サーバーには届いています'));
    out.push(row(id, 'fail', d.detail, { fix: d.fix, owner: d.owner }));
    blocked = true;
  }
  if (!out.some(r => r.id === 'rules')) out.push(blocked ? row('rules', 'skip', '前の項目が通るまで確認できません') : row('rules', 'ok', '読み取りが許可されています'));

  if (!p.signedIn) out.push(row('auth', 'warn', 'ログインしていません', { fix: 'フレンド対戦・全国対戦にはログインが必要です（AI対戦はそのまま遊べます）。', owner: 'user' }));
  else out.push(row('auth', 'ok', 'ログインしています'));

  if (blocked || !p.signedIn || !p.indexQuery) out.push(row('index', 'skip', p.signedIn ? '前の項目が通るまで確認できません' : 'ログインすると確認できます'));
  else if (p.indexQuery.ok === true) out.push(row('index', 'ok', '検索できます'));
  else { const d = describeFirebaseCode((p.indexQuery as { code: string }).code); out.push(row('index', 'fail', d.detail, { fix: d.fix, owner: d.owner })); }

  if (p.clockOffsetMs == null) out.push(row('clock', 'skip', '対戦を1回すると測れます'));
  else if (Math.abs(p.clockOffsetMs) >= CLOCK_WARN_MS) out.push(row('clock', 'warn', `サーバーと ${Math.round(Math.abs(p.clockOffsetMs) / 1000)}秒ずれています`, { fix: '端末の設定で「日付と時刻を自動設定」をオンにしてください（アプリ側でも補正しています）。', owner: 'user' }));
  else out.push(row('clock', 'ok', 'ずれはありません'));

  const order: CheckId[] = ['network', 'browser', 'auth', 'firestore', 'rules', 'index', 'clock'];
  return order.map(id => out.find(r => r.id === id)!).filter(Boolean);
}

/** いちばん大事な一言（画面の見出し） */
export function summarizeConnection(results: CheckResult[]): { tone: 'ok' | 'warn' | 'fail'; text: string } {
  const fail = results.find(r => r.status === 'fail');
  if (fail) return { tone: 'fail', text: `${fail.label}で止まっています${fail.owner === 'operator' ? '（運営側の設定が必要です）' : ''}` };
  const warn = results.find(r => r.status === 'warn');
  if (warn) return { tone: 'warn', text: `対戦できます（注意：${warn.label}）` };
  return { tone: 'ok', text: 'すべて正常です。対戦できます' };
}

/** 運営者に送る用のテキスト（個人情報は入れない：UID・メールは含めない） */
export function reportText(results: CheckResult[], meta: { projectId: string; appVersion: string; userAgent: string }): string {
  const mark: Record<CheckStatus, string> = { ok: '○', warn: '△', fail: '×', skip: '－' };
  return [`通信チェック ${new Date().toISOString()}`, `project: ${meta.projectId} / version: ${meta.appVersion}`, `UA: ${meta.userAgent}`,
    ...results.map(r => `${mark[r.status]} ${r.label}: ${r.detail}${r.fix ? ` → ${r.fix}` : ''}`)].join('\n');
}
