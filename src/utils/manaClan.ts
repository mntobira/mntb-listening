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
    if (e.code === 'functions/not-found' || e.code === 'functions/unavailable') throw new Error('マナクランの集計サーバーが未反映、または接続できません。運営者のサーバー設定後に利用できます。');
    throw new Error(e.message || '接続できませんでした。');
  }
}
