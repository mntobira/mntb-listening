/**
 * 通信チェックの「実測」部分。読み取りだけ（書き込みはしない）・最大4回の読み取りで終わる。
 * 判定は core/connectionCheck.ts（純粋関数）に任せる。
 *
 * 接続先は firebase.ts だけが知っているので、統合版でもリスニング版（別の Firebase プロジェクト）でも
 * このファイルはそのまま使える。
 */
import { collection, getDocsFromServer, limit, query, where } from 'firebase/firestore';
import * as firebaseModule from '../../firebase';
import { auth, db } from '../../firebase';
import { isInAppBrowser } from '../../utils/googleAuth';
import { serverClockOffsetMs } from '../core/serverClock';
import { evaluateConnection, type CheckResult, type ProbeInput } from '../core/connectionCheck';
import { COL_QUEUE, COL_ROOMS } from './battle';

export const PROBE_TIMEOUT_MS = 8_000;

function withTimeout<T>(p: Promise<T>, ms = PROBE_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject({ code: 'timeout' }), ms);
    p.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}
const codeOf = (e: unknown) => String((e as { code?: string } | null)?.code || 'unknown');

/** 接続先のプロジェクトID（報告用。秘密情報ではない） */
export function connectedProjectId(): string {
  return String((db.app.options as { projectId?: string }).projectId || 'unknown');
}

/** 設定済みか（リスニング版の firebase.ts は FIREBASE_CONFIGURED を持つ。統合版は常に設定済み） */
function isConfigured(): boolean {
  const mod = firebaseModule as { FIREBASE_CONFIGURED?: boolean; USE_EMULATORS?: boolean };
  if (mod.USE_EMULATORS) return true;
  return mod.FIREBASE_CONFIGURED ?? true;
}

export async function probeConnection(): Promise<{ input: ProbeInput; results: CheckResult[] }> {
  const input: ProbeInput = {
    online: typeof navigator === 'undefined' ? true : navigator.onLine !== false,
    inAppBrowser: isInAppBrowser(),
    configured: isConfigured(),
    signedIn: Boolean(auth.currentUser),
    read: null,
    indexQuery: null,
    clockOffsetMs: null,
  };
  if (input.online && input.configured) {
    try {
      // battle_rules は誰でも読める（ルールで read: true）。端末の控えではなくサーバーから読む。
      // 1回目は接続を張る時間を含むので、速さは2回目で測る（対戦中の書き込みは張った接続の上で行われるため）。
      const rulesQuery = query(collection(db, 'battle_rules'), limit(1));
      await withTimeout(getDocsFromServer(rulesQuery));
      const t0 = performance.now();
      await withTimeout(getDocsFromServer(rulesQuery));
      input.read = { ok: true, ms: Math.round(performance.now() - t0) };
    } catch (e) { input.read = { ok: false, code: codeOf(e) }; }

    const uid = auth.currentUser?.uid;
    if (input.read?.ok && uid) {
      try {
        // 全国マッチで実際に使う2つの検索（待っている人・自分が入った部屋）を1件だけ読んでみる
        await withTimeout(Promise.all([
          getDocsFromServer(query(collection(db, COL_QUEUE), where('subject', '==', 'english_listening'), limit(1))),
          getDocsFromServer(query(collection(db, COL_ROOMS), where('players', 'array-contains', uid), limit(1))),
        ]));
        input.indexQuery = { ok: true };
      } catch (e) { input.indexQuery = { ok: false, code: codeOf(e) }; }
    }
    const offset = serverClockOffsetMs();
    input.clockOffsetMs = offset === 0 ? null : offset;
  }
  return { input, results: evaluateConnection(input) };
}
