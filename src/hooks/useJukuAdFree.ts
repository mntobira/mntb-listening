import { useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase';
import { setAdFree } from '../ads/adFree';
import { loadJukuMemberships, saveJukuMemberships, subscribeJukuMemberships } from '../utils/classAssignments';
import { fetchMyMembershipDetails } from '../utils/classroom';
import { isClassroomEnabledFor } from '../config/features';

/**
 * 塾クラスの生徒には広告を出さない（2026-11-04）。
 *   ・判定は端末に覚えている塾クラス（classAssignments.ts の saveJukuMemberships）。Firestore を毎回は読まない。
 *   ・ログインしたとき、クラス機能を使える人だけ在籍を1回読み直して覚え直す
 *     （クラス画面を開かなくても、先生が塾クラスに入れた次の起動から広告が消える／抜けたら戻る）。
 *   ・ログアウト・ゲストは広告ありのまま。
 */
export function useJukuAdFree(): void {
  useEffect(() => {
    let uid = '';
    const apply = () => setAdFree(!!uid && loadJukuMemberships(uid).length > 0);
    const refresh = async (user: User) => {
      if (!isClassroomEnabledFor(user)) return;
      try {
        const rows = await fetchMyMembershipDetails();
        if (uid !== user.uid) return; // 読んでいる間に別の人に切り替わった
        saveJukuMemberships(
          user.uid,
          rows.filter((r) => r.plan === 'juku').map((r) => ({ classId: r.classId, teacherUid: r.teacherUid, className: r.className, subject: r.subject })),
        );
      } catch (error) {
        // 読めなくても、前に覚えた在籍で判断を続ける（広告の出し分けだけなので学習は止めない）
        console.warn('[ads] 塾クラスの在籍を読み直せませんでした', error);
      }
    };
    const offJuku = subscribeJukuMemberships(apply);
    const offAuth = onAuthStateChanged(auth, (user) => {
      uid = user?.uid ?? '';
      apply();
      if (user) void refresh(user);
    });
    return () => {
      offJuku();
      offAuth();
      setAdFree(false);
    };
  }, []);
}
