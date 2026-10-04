/**
 * マッチングした相手のプロフィール（2026-10-02）。
 * 「対戦相手のプロフィールをマッチングしたときにある程度見えるように」へ対応。
 *
 * 見せるもの：アイコン・名前（全国戦は一部を伏せる）・リーグ・レート、
 *   相手が設定で「プロフィールを公開」にしている場合だけ 志望校・学習時間。
 * 見せないもの：学年・実名・連絡先（App Store 1.2・プライバシーポリシー 3 と同じ範囲）。
 */
import { useEffect, useState } from 'react';
import { GraduationCap, Clock, Flag, Star } from 'lucide-react';
import { leagueOf } from '../core/leagues';
import { maskNickname } from '../../utils/nicknamePrivacy';
import { displaySafeNickname, displaySafePublicText } from '../../features/safety/nicknameFilter';
import { safeAvatarUrl } from '../../features/safety/avatarUrl';
import { watchPublicStudyProfiles, type PublicStudyProfile } from '../../utils/publicStudyProfile';
import { formatStudyTime } from '../../utils/studyTime';
import { FIREBASE_CONFIGURED, USE_EMULATORS } from '../../firebase';
import './opponent-card.css';

export function OpponentCard({ uid, nickname, photoURL, rating, mask = false, isAi = false, aiNote }: {
  uid?: string; nickname: string; photoURL?: string; rating: number; mask?: boolean; isAi?: boolean; aiNote?: string;
}) {
  const [study, setStudy] = useState<PublicStudyProfile | null>(null);
  useEffect(() => {
    if (!uid || isAi || (!FIREBASE_CONFIGURED && !USE_EMULATORS)) return;
    return watchPublicStudyProfiles([uid], (all) => setStudy(all[uid] ?? null));
  }, [uid, isAi]);
  const league = leagueOf(rating);
  const name = mask ? maskNickname(displaySafeNickname(nickname)) : displaySafeNickname(nickname);
  const avatar = safeAvatarUrl(photoURL);
  const school = study ? displaySafePublicText(study.targetSchool) : '';
  const motto = study ? displaySafePublicText(study.motto) : '';
  return (
    <section className="opponent-card" data-opponent-card aria-label="対戦相手のプロフィール" style={{ ['--league' as string]: league.color, ['--league-tint' as string]: league.tint }}>
      <span className="opponent-card-kicker">対戦相手</span>
      <div className="opponent-card-main">
        <span className="opponent-card-avatar">{avatar ? <img src={avatar} alt="" /> : <img src="/mascots/thinking.webp" alt="" />}</span>
        <div className="opponent-card-id">
          <strong>{name}</strong>
          <span className="opponent-card-league">{league.label}<b>{Math.round(rating)}</b></span>
        </div>
      </div>
      {(school || study) && (
        <dl className="opponent-card-facts">
          {school && <div><dt><GraduationCap size={14} aria-hidden />志望校</dt><dd>{school}</dd></div>}
          {study && <div><dt><Clock size={14} aria-hidden />学習時間</dt><dd>{formatStudyTime(study.studySeconds)}</dd></div>}
          {study?.stagesCleared != null && <div><dt><Flag size={14} aria-hidden />達成ステージ</dt><dd>{study.stagesCleared}</dd></div>}
          {study?.level != null && <div><dt><Star size={14} aria-hidden />とびら君</dt><dd>Lv.{study.level}</dd></div>}
        </dl>
      )}
      {motto && <p className="opponent-card-motto" data-opponent-motto>「{motto}」</p>}
      {aiNote && <p className="opponent-card-note">{aiNote}</p>}
    </section>
  );
}
