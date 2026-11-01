/** Explicitly opted-in ranking metadata only. Private profile documents are never
 * queried for other users. Withdrawal deletes the public projection entirely. */
import { collection, deleteDoc, doc, documentId, getDoc, onSnapshot, query, serverTimestamp, setDoc, where } from './firestoreMetered';
import { auth, db } from '../firebase';
import { normalizeTargetSchool } from './vocabGoal';
import { profileKey } from './userStorageKeys';
import { readStudyTime } from './studyTime';
import { logRejection } from './reportError';
import { requireLocalStorage } from './safeLocalStorage';
import { BADGE_IDS_MAX, OWNED_IDS_MAX, buildWeek, encodeCal, encodeIds, encodeSubjects, intOrNull, lookIdOrEmpty, normalizeBio, normalizeGrade, parseCal, parseIds, parseSubjects, parseWeek, type PublicGrade } from './publicProfileCore';
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
  // ---- 2026-10-26 プロフィールの充実（どれも任意・古い文書には無い） ----
  /** 表示名（無ければ呼び出し側がランキング等の名前を使う） */
  nickname: string;
  grade: PublicGrade;
  bio: string;
  /** 直近7日の学習秒（古い日→今日）。無ければ null */
  week: number[] | null;
  /** 週の記録を書いた日（'YYYY-MM-DD'）。古い週を「今週」と見せないため */
  weekEnd: string;
  streak: number | null;
  solved: number | null;
  badges: number | null;
  /** 身につけている称号の ID */
  title: string;
  look: { pose: string; frame: string; hat: string; glasses: string };
  // ---- D6（2026-10-30）その人のマイページ全体（どれも任意・古い文書には無い） ----
  /** 直近28日の日ごとの学習秒（古い日→calEnd）。無ければ null */
  cal: number[] | null;
  calEnd: string;
  /** 直近28日の教科ごとの合計（'app'＝アプリで計った時間） */
  subjects: { id: string; sec: number }[];
  /** 持っているアイテムのID（きせかえ・マイPDF） */
  owned: string[];
  /** 取った称号のID */
  badgeIds: string[];
}

/** 本人が公開プロフィールに載せる「自分で書く」項目 */
export interface PublicProfileInput {
  targetSchool: string;
  motto: string;
  nickname?: string;
  grade?: string;
  bio?: string;
}

/** 本人の端末から集める「記録」の項目（公開しているときだけ送る） */
export interface PublicProfileStats {
  streak?: number;
  solved?: number;
  badges?: number;
  title?: string;
  look?: { pose?: string; frame?: string; hat?: string; glasses?: string };
  /** D6：直近28日の日ごとの学習秒（古い日→今日）・教科ごとの合計秒・持ち物・取った称号 */
  cal?: number[];
  subjects?: Record<string, number>;
  owned?: string[];
  badgeIds?: string[];
}
/** D6 で足した項目（古い Firestore ルールで拒否されたら、これを外してもう一度保存する） */
const D6_FIELDS = ['cal', 'calEnd', 'subj', 'ownedIds', 'badgeIds'] as const;
const withoutD6 = (o: Record<string, unknown>) => { const c = { ...o }; for (const k of D6_FIELDS) delete c[k]; return c; };
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
    nickname: typeof p.nickname === 'string' ? p.nickname.trim().slice(0, 24) : '',
    grade: normalizeGrade(p.grade),
    bio: normalizeBio(p.bio),
    week: parseWeek(p.week),
    weekEnd: typeof p.weekEnd === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.weekEnd) ? p.weekEnd : '',
    streak: intOrNull(p.streak, 10000),
    solved: intOrNull(p.solved),
    badges: intOrNull(p.badges, 1000),
    title: lookIdOrEmpty(p.title),
    look: { pose: lookIdOrEmpty(p.lookPose), frame: lookIdOrEmpty(p.lookFrame), hat: lookIdOrEmpty(p.lookHat), glasses: lookIdOrEmpty(p.lookGlasses) },
    cal: parseCal(p.cal),
    calEnd: typeof p.calEnd === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.calEnd) ? p.calEnd : '',
    subjects: parseSubjects(p.subj),
    owned: parseIds(p.ownedIds, OWNED_IDS_MAX),
    badgeIds: parseIds(p.badgeIds, BADGE_IDS_MAX),
  };
}

/** 学習時間・直近7日・記録（端末の値）を、公開文書に書く形にする */
function statsFields(uid: string, stats?: PublicProfileStats, now: number = Date.now()): Record<string, unknown> {
  const log = readStudyTime(uid);
  const out: Record<string, unknown> = {
    studySeconds: Math.min(315360000, log.total),
    week: buildWeek(log.days, now),
    weekEnd: localDay(now),
  };
  if (!stats) return out;
  if (typeof stats.streak === 'number') out.streak = Math.max(0, Math.min(10000, Math.floor(stats.streak)));
  if (typeof stats.solved === 'number') out.solved = Math.max(0, Math.min(1_000_000, Math.floor(stats.solved)));
  if (typeof stats.badges === 'number') out.badges = Math.max(0, Math.min(1000, Math.floor(stats.badges)));
  if (stats.title !== undefined) out.title = lookIdOrEmpty(stats.title);
  if (stats.look) {
    out.lookPose = lookIdOrEmpty(stats.look.pose);
    out.lookFrame = lookIdOrEmpty(stats.look.frame);
    out.lookHat = lookIdOrEmpty(stats.look.hat);
    out.lookGlasses = lookIdOrEmpty(stats.look.glasses);
  }
  if (stats.cal) { out.cal = encodeCal(stats.cal); out.calEnd = localDay(now); }
  if (stats.subjects) out.subj = encodeSubjects(stats.subjects);
  if (stats.owned) out.ownedIds = encodeIds(stats.owned, OWNED_IDS_MAX);
  if (stats.badgeIds) out.badgeIds = encodeIds(stats.badgeIds, BADGE_IDS_MAX);
  return out;
}
function localDay(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 端末にある記録を集める（呼び出し側から差し込めるようにして、utils が battle に依存しないようにする） */
let statsProvider: (() => PublicProfileStats) | null = null;
export function setPublicProfileStatsProvider(fn: (() => PublicProfileStats) | null): void { statsProvider = fn; }
function currentStats(): PublicProfileStats | undefined {
  try { return statsProvider?.() ?? undefined; } catch { return undefined; }
}
/** 達成ステージ数・レベルはサーバー（achievements 関数）が全端末を合算して書く。ここでは送らない */
const syncLater = () => { void import('./achievementsSync').then(m => m.syncAchievements()).catch(logRejection('achievements.sync')); };
export async function readOwnPublicStudyProfile(): Promise<PublicStudyProfile | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  const snapshot = await getDoc(doc(db, PUBLIC_STUDY_PROFILES, uid));
  return snapshot.exists() ? parsePublicStudyProfile(snapshot.data()) : null;
}
export async function savePublicStudyProfile(published: boolean, targetSchool: string | PublicProfileInput, motto = ''): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('公開設定にはGoogleログインが必要です。');
  const ref = doc(db, PUBLIC_STUDY_PROFILES, uid);
  if (!published) { await deleteDoc(ref); return; }
  const input: PublicProfileInput = typeof targetSchool === 'string' ? { targetSchool, motto } : targetSchool;
  // merge：サーバーが書いた 達成ステージ数・レベル は残す（ルールで本人の書き換えを禁止している）
  const base = { public: true, targetSchool: normalizeTargetSchool(input.targetSchool),
    studySeconds: Math.min(315360000, readStudyTime(uid).total), updatedAt: serverTimestamp() };
  const rich: Record<string, unknown> = { ...statsFields(uid, currentStats()) };
  if (input.nickname !== undefined) rich.nickname = input.nickname.trim().slice(0, 24);
  if (input.grade !== undefined) rich.grade = normalizeGrade(input.grade);
  if (input.bio !== undefined) rich.bio = normalizeBio(input.bio);
  // 本番の Firestore ルールが古いと、新しい項目付きの保存は拒否される。
  // 公開設定そのものは保存できるよう、段階的に項目を減らして試す（D6 の項目 → プロフィール拡張 → 志）。
  const denied = (e: unknown) => (e as { code?: string })?.code === 'permission-denied';
  const tries: Record<string, unknown>[] = [
    { ...base, motto: normalizeMotto(input.motto), ...rich },
    { ...base, motto: normalizeMotto(input.motto), ...withoutD6(rich) },
    { ...base, motto: normalizeMotto(input.motto) },
    base,
  ];
  for (let i = 0; i < tries.length; i += 1) {
    try { await setDoc(ref, tries[i], { merge: true }); break; }
    catch (e) { if (!denied(e) || i === tries.length - 1) throw e; }
  }
  syncLater();
}
/** Recheck consent on the server before refreshing: another device may have
 * withdrawn it. Never recreate a deleted projection from a stale local flag. */
let lastRefresh: { sig: string; at: number } | null = null;
export async function refreshPublicStudyTime(): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  let local: Record<string, unknown>;
  try { local = JSON.parse(requireLocalStorage().getItem(profileKey(uid)) || '{}'); } catch { return; }
  if (local.profilePublic !== true) return;
  // Updates cannot recreate a missing document; the owner must opt in explicitly.
  const { updateDoc } = await import('./firestoreMetered');
  const ref = doc(db, PUBLIC_STUDY_PROFILES, uid);
  const fields = statsFields(uid, currentStats());
  // ★2026-10-30 E8★ ランキングを開くたびに（1回に2か所から）書いていた。中身が前回と同じで10分以内なら書かない
  const sig = `${uid}:${JSON.stringify(fields)}`;
  if (lastRefresh && lastRefresh.sig === sig && Date.now() - lastRefresh.at < 10 * 60_000) return;
  const denied = (e: unknown) => (e as { code?: string })?.code === 'permission-denied';
  try {
    await updateDoc(ref, { ...fields, updatedAt: serverTimestamp() });
    lastRefresh = { sig, at: Date.now() };
  } catch (e) {
    // ルールが古いと D6 の項目・週の記録などは拒否される。減らしてもう一度、最後は学習時間だけ
    if (!denied(e)) throw e;
    try { await updateDoc(ref, { ...withoutD6(fields), updatedAt: serverTimestamp() }); }
    catch (e2) {
      if (!denied(e2)) throw e2;
      await updateDoc(ref, { studySeconds: Math.min(315360000, readStudyTime(uid).total), updatedAt: serverTimestamp() });
    }
  }
  syncLater();
}
/** 1人分の公開プロフィール（プロフィール画面用）。非公開・未作成なら null */
export async function fetchPublicStudyProfile(targetUid: string): Promise<PublicStudyProfile | null> {
  if (!targetUid) return null;
  const snapshot = await getDoc(doc(db, PUBLIC_STUDY_PROFILES, targetUid));
  return snapshot.exists() ? parsePublicStudyProfile(snapshot.data()) : null;
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

/**
 * ★学習時間ランキング（2026-10-11）★
 *   「設定」で公開を選んだ人（public_study_profiles）だけを、学習時間の長い順に並べる。
 *   非公開の人は文書自体が無いので載らない（勝手に順位へ出さない）。
 *   並べ替えの索引（firestore.indexes.json）がまだ無い環境では、上限つきで読んで端末側で並べる。
 */
export interface StudyTimeRow { uid: string; profile: PublicStudyProfile }
export async function fetchStudyTimeRanking(max = 100, onlyUids?: readonly string[]): Promise<StudyTimeRow[]> {
  const { getDocs, orderBy, limit } = await import('./firestoreMetered');
  const col = collection(db, PUBLIC_STUDY_PROFILES);
  const toRows = (docs: { id: string; data: () => unknown }[]) => docs
    .map(d => ({ uid: d.id, profile: parsePublicStudyProfile(d.data()) }))
    .filter((r): r is StudyTimeRow => !!r.profile)
    .sort((a, b) => b.profile.studySeconds - a.profile.studySeconds);
  if (onlyUids) {
    const ids = [...new Set(onlyUids)];
    const out: StudyTimeRow[] = [];
    for (let i = 0; i < ids.length; i += 30) {
      try {
        const snap = await getDocs(query(col, where('public', '==', true), where(documentId(), 'in', ids.slice(i, i + 30))));
        out.push(...toRows(snap.docs));
      } catch { /* 読めた分だけ */ }
    }
    return out.sort((a, b) => b.profile.studySeconds - a.profile.studySeconds).slice(0, max);
  }
  try {
    const snap = await getDocs(query(col, where('public', '==', true), orderBy('studySeconds', 'desc'), limit(max)));
    return toRows(snap.docs);
  } catch {
    const snap = await getDocs(query(col, where('public', '==', true), limit(500)));
    return toRows(snap.docs).slice(0, max);
  }
}
