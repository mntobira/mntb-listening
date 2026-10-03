import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, onSnapshot } from '../utils/firestoreMetered';
import { auth, db } from '../firebase';
import { Users } from 'lucide-react';

type Presence = { active: boolean; at: number } | null;
type FriendState = { uid: string | null; total: number; online: number; known: number; loading: boolean; failed: boolean };
const empty = (uid: string | null): FriendState => ({ uid, total: 0, online: 0, known: 0, loading: !!uid, failed: false });

/** オンライン状況を見に行くフレンドの上限（購読の本数） */
const MAX_WATCHED = 30;

/** Recent visible-tab heartbeats, not an authoritative connection count. */
export function FriendOnlineStrip() {
  const [state, setState] = useState(() => empty(auth.currentUser?.uid ?? null));
  useEffect(() => {
    let disposed = false;
    let generation = 0;
    let revision = 0;
    let owner: string | null = null;
    let loading = true;
    let failed = false;
    let stopList = () => {};
    let stops: (() => void)[] = [];
    let rows = new Map<string, Presence>();
    const publish = () => {
      if (disposed || owner !== (auth.currentUser?.uid ?? null)) return;
      const now = Date.now();
      setState({ uid: owner, total: rows.size, loading, failed,
        known: [...rows.values()].filter(Boolean).length,
        online: [...rows.values()].filter(r => r?.active && now - r.at < 90000 && now >= r.at - 30000).length });
    };
    const off = onAuthStateChanged(auth, user => {
      const token = ++generation;
      stopList(); stops.forEach(stop => stop()); stops = [];
      owner = user?.uid ?? null; rows = new Map(); loading = !!user; failed = false;
      publish();
      if (!user) return;
      const current = () => !disposed && generation === token && auth.currentUser?.uid === user.uid;
      stopList = onSnapshot(collection(db, 'friends', user.uid, 'items'), snap => {
        if (!current()) return;
        const listToken = ++revision;
        stops.forEach(stop => stop()); stops = [];
        rows = new Map(snap.docs.map(d => [d.id, null])); loading = false; failed = false;
        publish();
        // ★購読するフレンドは最大 MAX_WATCHED 人★
        //   1人につき購読が1本開く。上限が無いとフレンドが多い人ほど
        //   接続と読み取りが増え、端末も重くなる（ホーム画面に常に出ている部品なので）。
        //   上限を超えた分は「未確認」として数に入れる。
        for (const friend of snap.docs.slice(0, MAX_WATCHED)) {
          const valid = () => current() && listToken === revision;
          stops.push(onSnapshot(doc(db, 'friend_profiles', friend.id), profile => {
            if (!valid()) return;
            const data = profile.data();
            const at = data?.presenceAt?.toMillis?.();
            rows.set(friend.id, Number.isFinite(at) ? { active: data.presenceActive === true, at } : null);
            publish();
          }, () => { if (valid()) { rows.set(friend.id, null); publish(); } }));
        }
      }, () => {
        if (!current()) return;
        ++revision; stops.forEach(stop => stop()); stops = [];
        rows.clear(); loading = false; failed = true; publish();
      });
    });
    const timer = setInterval(publish, 15000);
    return () => { disposed = true; ++generation; off(); stopList(); stops.forEach(stop => stop()); clearInterval(timer); };
  }, []);
  const current = state.uid === (auth.currentUser?.uid ?? null) ? state : empty(auth.currentUser?.uid ?? null);
  return <p className="arena-friends" aria-live="polite" title="直近90秒以内に画面を開いていたフレンドの目安です。非表示・終了後は最大90秒で期限切れになります。">
    <Users size={14} />
    {!current.uid ? 'ログインするとフレンドのオンライン状況が見られます'
      : current.failed ? 'フレンド状況を取得できませんでした'
      : current.loading ? 'フレンド状況を確認中…'
      : <>フレンド {current.total}人 · <strong>オンライン目安 {current.online}人</strong>{current.known < current.total && <small>（未確認 {current.total - current.known}人）</small>}</>}
  </p>;
}
