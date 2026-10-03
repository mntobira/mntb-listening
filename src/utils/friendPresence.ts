import { onAuthStateChanged } from 'firebase/auth';
import { doc, serverTimestamp, updateDoc } from './firestoreMetered';
import { auth, db } from '../firebase';

/**
 * Visible-tab heartbeat; stale sessions expire after 90 seconds. No public user listing.
 *
 * ★書き込みを抑える（利用者が増えたときの負荷対策）★
 *   1回書くたびに、その人をフレンドに持つ全員の画面へ通知が飛ぶ。
 *   以前は30秒ごと＋画面の切り替え・オンライン復帰のたびに書いていたので、
 *   タブを行き来するだけで連続して書き込んでいた。
 *   ・定期の書き込みは45秒ごと（1回遅れても「90秒以内ならオンライン」に収まる）
 *   ・どのきっかけでも、直前の書き込みから20秒以内なら書かない
 */
const PULSE_MS = 45_000;
const MIN_GAP_MS = 20_000;

export function installFriendPresence() {
  let lastAt = 0;
  let lastUid: string | null = null;
  const pulse = () => {
    const uid=auth.currentUser?.uid;
    // Let timestamps expire: a hidden tab must not mark another visible tab offline.
    if(!uid || !navigator.onLine || document.visibilityState !== 'visible')return;
    const now = Date.now();
    if (uid === lastUid && now - lastAt < MIN_GAP_MS) return;
    lastAt = now; lastUid = uid;
    void updateDoc(doc(db,'friend_profiles',uid),{presenceActive:true,presenceAt:serverTimestamp()}).catch(()=>{});
  };
  const off=onAuthStateChanged(auth,()=>{pulse();});
  const timer=setInterval(()=>{if(document.visibilityState==='visible')pulse();},PULSE_MS);
  document.addEventListener('visibilitychange',pulse);window.addEventListener('online',pulse);
  return()=>{off();clearInterval(timer);document.removeEventListener('visibilitychange',pulse);window.removeEventListener('online',pulse);};
}
