/**
 * ほかの人の公開プロフィールを開く窓（2026-10-26）。
 *   ランキング・フレンド一覧の名前を押すと開く。見た目は既存の窓（.game-details-dialog.mt-dialog）と同じ。
 *   ・公開していない人（文書なし）… 「この人はプロフィールを公開していません」
 *   ・ブロックしている人 … 開かない（呼び出し側の一覧からも消えている）
 *   ・窓の右上に「通報・ブロック」（既存の UserSafetyMenu）
 */
import { useEffect, useRef, useState } from 'react';
import { Lock, Swords } from 'lucide-react';
import { fetchPublicStudyProfile, type PublicStudyProfile } from '../../utils/publicStudyProfile';
import { UserSafetyMenu } from '../safety/UserSafetyMenu';
import { isBlocked, type ReportTarget } from '../safety/userSafety';
import { displaySafeNickname, displaySafePublicText } from '../safety/nicknameFilter';
import { PublicProfileView, type PublicBattleStats } from './PublicProfileView';
import { fetchFriendBattleRanking } from '../../battle/data/battleRanking';
import { fetchUserPosts, type StudyPost } from '../studylog/studyFeed';
import { subjectLabel } from '../studylog/manualLogCore';
import { formatStudyTime } from '../../utils/studyTime';

export interface ProfileTarget {
  uid: string;
  /** 一覧に出ている名前（公開文書に名前が無いときに使う） */
  nickname: string;
  where: ReportTarget['where'];
}

export function UserProfileDialog({ target, onClose }: { target: ProfileTarget | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<{ uid: string; profile: PublicStudyProfile | null; loading: boolean; error: boolean }>({ uid: '', profile: null, loading: false, error: false });
  // 対戦成績（ランキングの公開の値）と、フレンドに共有された記録（フレンドでなければルールで読めず空になる）
  const [extra, setExtra] = useState<{ uid: string; battle: PublicBattleStats | null; posts: StudyPost[] }>({ uid: '', battle: null, posts: [] });

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (target && !isBlocked(target.uid)) {
      if (!d.open) d.showModal();
    } else if (d.open) d.close();
  }, [target]);

  useEffect(() => {
    if (!target) return;
    let alive = true;
    setState({ uid: target.uid, profile: null, loading: true, error: false });
    fetchPublicStudyProfile(target.uid)
      .then((profile) => { if (alive) setState({ uid: target.uid, profile, loading: false, error: false }); })
      .catch(() => { if (alive) setState({ uid: target.uid, profile: null, loading: false, error: true }); });
    setExtra({ uid: target.uid, battle: null, posts: [] });
    // 対戦成績・共有記録はおまけ。読めなければ出さないだけ（プロフィール本体は上で別に扱う）
    void Promise.all([
      fetchFriendBattleRanking([target.uid]).then(rows => rows.find(r => r.uid === target.uid) ?? null).catch(() => null),
      fetchUserPosts(target.uid, 3),
    ]).then(([row, posts]) => {
      if (!alive) return;
      const battle = row ? { wins: row.wins || 0, losses: row.losses || 0, draws: row.draws || 0, rating: row.rating || 0 } : null;
      setExtra({ uid: target.uid, battle, posts });
    });
    return () => { alive = false; };
  }, [target]);

  const name = target ? displaySafeNickname(state.profile?.nickname || target.nickname || 'なまえ未設定') : '';

  return (
    <dialog
      ref={dialog}
      className="game-details-dialog mt-dialog"
      aria-labelledby="user-profile-title"
      data-user-profile-dialog
      onClose={onClose}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === dialog.current) onClose(); }}
    >
      <header>
        <h2 id="user-profile-title">{name || 'プロフィール'}{name && <span className="sr-only"> さんのプロフィール</span>}</h2>
        {target && <UserSafetyMenu target={{ uid: target.uid, nickname: name, where: target.where }} />}
        <button type="button" autoFocus onClick={onClose}>閉じる</button>
      </header>
      <div className="game-details-body">
        {!target ? null : state.loading || state.uid !== target.uid ? (
          <div className="mt-loading" role="status"><i aria-hidden="true" />読み込んでいます…</div>
        ) : state.error ? (
          <p role="alert" className="ps-help" data-error>読み込めませんでした。通信を確認して、もう一度開いてください。</p>
        ) : state.profile ? (
          <PublicProfileView profile={state.profile} fallbackName={target.nickname}
            battle={extra.uid === target.uid ? extra.battle : null} posts={extra.uid === target.uid ? extra.posts : []} />
        ) : (
          <div className="pp-view">
            <div className="pp-private" data-profile-private>
              <Lock size={28} aria-hidden="true" />
              <p>この人はプロフィールを公開していません。</p>
              {extra.uid === target.uid && extra.battle && extra.battle.wins + extra.battle.losses + extra.battle.draws > 0 && (
                <p className="pp-tags" data-public-battle>
                  <span><Swords size={14} aria-hidden="true" />対戦 {extra.battle.wins}勝{extra.battle.losses}敗 · レート {extra.battle.rating.toLocaleString()}</span>
                </p>
              )}
            </div>
            {extra.uid === target.uid && extra.posts.length > 0 && (
              <div className="pp-page" data-pp-page="posts">
                <ul className="pp-posts" aria-label="フレンドに共有した学習記録">
                  {extra.posts.map((p) => (
                    <li key={p.id}>
                      <span>
                        <strong>{subjectLabel(p.subject)}{p.materialName ? `・${displaySafePublicText(p.materialName)}` : ''}</strong>
                        {p.comment && <small>{displaySafePublicText(p.comment, 140)}</small>}
                      </span>
                      <b>{formatStudyTime(p.minutes * 60)}</b>
                    </li>
                  ))}
                </ul>
                <p className="ps-help pp-note">フレンドだけに共有された記録です（本人の自己申告）。</p>
              </div>
            )}
          </div>
        )}
      </div>
    </dialog>
  );
}
