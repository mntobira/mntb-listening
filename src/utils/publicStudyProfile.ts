/** Explicitly opted-in ranking metadata only. Private profile documents are never
 * queried for other users. Withdrawal deletes the public projection entirely. */
import { collection, deleteDoc, doc, documentId, getDoc, onSnapshot, query, serverTimestamp, setDoc, where } from './firestoreMetered';
import { auth, db } from '../firebase';
import { normalizeTargetSchool } from './vocabGoal';
import { profileKey } from './userStorageKeys';
import { readStudyTime } from './studyTime';
export const PUBLIC_STUDY_PROFILES = 'public_study_profiles';
export const MOTTO_MAX = 40;
export interface PublicStudyProfile {
  public: true; targetSchool: string; studySeconds: number;
  /** 志（ひとこと）。2026-10-04 追加・古い文書には無い */
  motto: string;
  /** 一人で学ぶの達成ステージ数（満点3回で達成）。不明なら null */
  stagesCleared: number | null;
  /** とびら君のレベル。不明なら null */
  level: number | null;
}
const intIn = (v: unknown, lo: number, hi: number) => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;
export const normalizeMotto = (v: string) => v.replace(/\s+/g, ' ').trim().slice(0, MOTTO_MAX);
export function parsePublicStudyProfile(value: unknown): PublicStudyProfile | null {
  const p = value as Record<string, unknown> | null;
  if (p?.public !== true || typeof p.targetSchool !== 'string' || p.targetSchool.length > 40 || !intIn(p.studySeconds, 0, 315360000)) return null;
  return {
    public: true, targetSchool: normalizeTargetSchool(p.targetSchool), studySeconds: p.studySeconds as number,
    motto: typeof p.motto === 'string' ? normalizeMotto(p.motto) : '',
    stagesCleared: intIn(p.stagesCleared, 0, 100000) ? p.stagesCleared as number : null,
    level: intIn(p.level, 1, 99) ? p.level as number : null,
  };
}
/** 達成ステージ数・レベルはサーバー（achievements 関数）が全端末を合算して書く。ここでは送らない */
const syncLater = () => { void import('./achievementsSync').then(m => m.syncAchievements()).catch(() => {}); };
export async function readOwnPublicStudyProfile(): Promise<PublicStudyProfile | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  const snapshot = await getDoc(doc(db, PUBLIC_STUDY_PROFILES, uid));
  return snapshot.exists() ? parsePublicStudyProfile(snapshot.data()) : null;
}
export async function savePublicStudyProfile(published: boolean, targetSchool: string, motto = ''): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('公開設定にはGoogleログインが必要です。');
  const ref = doc(db, PUBLIC_STUDY_PROFILES, uid);
  if (!published) { await deleteDoc(ref); return; }
  // merge：サーバーが書いた 達成ステージ数・レベル は残す（ルールで本人の書き換えを禁止している）
  await setDoc(ref, { public: true, targetSchool: normalizeTargetSchool(targetSchool), motto: normalizeMotto(motto),
    studySeconds: Math.min(315360000, readStudyTime(uid).total), updatedAt: serverTimestamp() }, { merge: true });
  syncLater();
}
/** Recheck consent on the server before refreshing: another device may have
 * withdrawn it. Never recreate a deleted projection from a stale local flag. */
export async function refreshPublicStudyTime(): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  let local: Record<string, unknown>;
  try { local = JSON.parse(localStorage.getItem(profileKey(uid)) || '{}'); } catch { return; }
  if (local.profilePublic !== true) return;
  // Updates cannot recreate a missing document; the owner must opt in explicitly.
  const { updateDoc } = await import('./firestoreMetered');
  await updateDoc(doc(db, PUBLIC_STUDY_PROFILES, uid), {
    studySeconds: Math.min(315360000, readStudyTime(uid).total), updatedAt: serverTimestamp(),
  });
  syncLater();
}
export function watchPublicStudyProfiles(uids: string[], receive: (profiles: Record<string, PublicStudyProfile>) => void): () => void {
  const ids = [...new Set(uids)].slice(0, 100);
  const groups: Record<string, PublicStudyProfile>[] = [];
  receive({});
  const unsubscribes = [];
  for (let offset = 0; offset < ids.length; offset += 30) {
    const index = groups.length; groups.push({});
    const q = query(collection(db, PUBLIC_STUDY_PROFILES), where('public', '==', true), where(documentId(), 'in', ids.slice(offset, offset + 30)));
    unsubscribes.push(onSnapshot(q, snapshot => {
      const next: Record<string, PublicStudyProfile> = {};
      snapshot.forEach(document => { const p = parsePublicStudyProfile(document.data()); if (p) next[document.id] = p; });
      groups[index] = next; receive(Object.assign({}, ...groups));
    }, () => { groups[index] = {}; receive(Object.assign({}, ...groups)); }));
  }
  return () => unsubscribes.forEach(stop => stop());
}
