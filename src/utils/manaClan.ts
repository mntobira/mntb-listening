import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { auth, FIREBASE_CONFIGURED, USE_EMULATORS } from '../firebase';
const functions = getFunctions(auth.app, 'asia-northeast1');
if (USE_EMULATORS) connectFunctionsEmulator(functions, '127.0.0.1', 5001);
export type Clan = { id: string; name: string; power: number; members: number; league: string; updatedAt?: number; rank?: number; wins?: number; losses?: number; draws?: number };
export type ClanState = { clan: Clan | null; owner?: boolean; inviteCode?: string; memberNames?: string[]; cooldownUntil?: number };
export type LeagueReward = { id: string; itemId: string; season: string; label: string; rank: number };
export async function clanCall<T>(action: string, input: Record<string, unknown> = {}): Promise<T> {
  if (!FIREBASE_CONFIGURED && !USE_EMULATORS) throw new Error('マナクランにはGoogleログインとオンライン設定が必要です。');
  try { return (await httpsCallable<Record<string, unknown>, T>(functions, 'manaClan')({ action, ...input })).data; }
  catch (e: any) {
    // ★サーバー未設定・停止中は、英語のコード（internal など）をそのまま見せない★
    //   functions/internal は「関数が無い（CORS で弾かれた）」「設定（秘密値）が無い」ときにも返る。
    if (['functions/not-found', 'functions/unavailable', 'functions/internal', 'functions/deadline-exceeded', 'functions/unknown'].includes(e.code)
      || /^(internal|INTERNAL|unknown)$/i.test(String(e.message || '').trim())) {
      throw new Error('マナクランの集計サーバーが未反映、または接続できません。運営者のサーバー設定後に利用できます。');
    }
    if (e.code === 'functions/unauthenticated') throw new Error('マナクランには Google / Apple でのログインが必要です。');
    if (e.code === 'functions/resource-exhausted' && !e.message) throw new Error('操作が多すぎます。1分ほど待ってからもう一度お試しください。');
    throw new Error(e.message || '接続できませんでした。');
  }
}
