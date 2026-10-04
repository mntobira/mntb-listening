import './ranking.css';
import { useEffect, useState } from 'react';
import { ArrowLeft, Trophy, RefreshCw, Swords, Shield, Gift } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_CONFIGURED, USE_EMULATORS, auth } from '../firebase';
import { LEAGUES, leagueOf, leagueProgress, seasonAt, type LeagueId } from '../battle/core/leagues';
import { fetchBattleRanking, fetchFriendBattleRanking, fetchMyRankingRow, ensureBattleRankingEntry, type BattleRankingRow } from '../battle/data/battleRanking';
import { fetchFriendUids } from '../utils/friends';
import { displayNicknameForNational } from '../utils/nicknamePrivacy';
import { displaySafeNickname, displaySafePublicText } from '../features/safety/nicknameFilter';
import { useWithoutBlocked } from '../features/safety/useBlockedFilter';
import { UserSafetyMenu } from '../features/safety/UserSafetyMenu';
import { ManaClan } from './ManaClan';
import { clanCall } from '../utils/manaClan';
import { refreshPublicStudyTime, watchPublicStudyProfiles, type PublicStudyProfile } from '../utils/publicStudyProfile';
import { formatStudyTime } from '../utils/studyTime';
interface LeaderboardProps { onBack: () => void; initialTab?: 'national' | 'friend' | 'clan'; onRequireLogin?: () => void; isGuest?: boolean; initialChapterId?: string | null; initialSubject?: string; onBattle?: () => void; onGacha?: () => void; }
export function Leaderboard({ onBack, onBattle, onGacha, initialTab = 'national', onRequireLogin }: LeaderboardProps) {
  const [uid, setUid] = useState(auth.currentUser?.uid ?? '');
  const [tab, setTab] = useState<'national' | 'friend' | 'clan'>(initialTab);
  const [filter, setFilter] = useState<LeagueId | 'all'>('all');
  const [rows, setRows] = useState<BattleRankingRow[]>([]); const [me, setMe] = useState<BattleRankingRow | null>(null);
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const [retry, setRetry] = useState(0);
  const [seasonReady, setSeasonReady] = useState(false);
  useEffect(() => onAuthStateChanged(auth, u => { setUid(u?.uid ?? ''); setMe(null); }), []);
  // ★ゲスト・未設定の環境ではサーバーを呼ばない★（通信エラーをコンソールに出さない・無駄な通信をしない）
  useEffect(() => { if (!uid || (!FIREBASE_CONFIGURED && !USE_EMULATORS)) { setSeasonReady(false); return; } clanCall<{ ready: boolean }>('status').then(r => setSeasonReady(r.ready)).catch(() => setSeasonReady(false)); }, [uid]);
  useEffect(() => {
    if (tab === 'clan') return;
    let alive = true; setLoading(true); setError(''); setRows([]);
    (async () => {
      if (uid) await ensureBattleRankingEntry();
      const range = LEAGUES.find(l => l.id === filter); const next = range && LEAGUES[LEAGUES.indexOf(range) + 1];
      const [list, own] = await Promise.all([
        tab === 'friend' ? fetchFriendBattleRanking(await fetchFriendUids(true)) : fetchBattleRanking(100, range ? { min: range.min, max: next?.min } : undefined),
        uid ? fetchMyRankingRow() : Promise.resolve(null),
      ]);
      if (alive) { setRows(list.filter(r => filter === 'all' || leagueOf(r.rating).id === filter)); setMe(own); }
    })().catch(() => { if (alive) setError('順位表を取得できませんでした。接続を確認して再読み込みしてください。'); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [tab, filter, uid, retry]);
  const visible = useWithoutBlocked<BattleRankingRow>(rows);
  const [profiles, setProfiles] = useState<{viewer: string; data: Record<string, PublicStudyProfile>}>({viewer:'',data:{}});
  const profileIds = visible.map(r=>r.uid).sort().join(',');
  useEffect(() => {
    setProfiles({viewer:uid,data:{}});
    if (!uid || tab === 'clan' || !profileIds) return;
    void refreshPublicStudyTime().catch(()=>{});
    return watchPublicStudyProfiles(profileIds.split(','), data=>setProfiles({viewer:uid,data}));
  }, [uid, tab, profileIds, retry]);
  const rankOf = (row: BattleRankingRow) => rows.filter(r => r.rating > row.rating).length + 1;
  const rating = me?.rating ?? 1500; const league = leagueOf(rating); const progress = leagueProgress(rating);
  const end = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric' }).format(seasonAt().end);
  return <section className="league-hall" data-rating-ranking>
    <header className="league-header"><button type="button" onClick={onBack} aria-label="ホームへ戻る"><ArrowLeft size={20}/></button><div><small>BATTLE LEAGUES</small><h1><Trophy size={23}/>ランキング</h1></div><button type="button" onClick={() => setRetry(n => n + 1)} disabled={loading} aria-label="ランキングを再読み込み"><RefreshCw size={19}/></button></header>
    {onGacha && <nav className="league-actions" aria-label="ガチャとランキング"><button type="button" onClick={onGacha}><Gift size={18}/>ガチャ</button><button type="button" aria-current="page"><Trophy size={18}/>ランキング</button></nav>}
    <div className="league-tabs" role="tablist" aria-label="ランキングの種類">{([['national','全国'],['friend','フレンド'],['clan','マナクラン']] as const).map(([id,label]) => <button role="tab" aria-selected={tab === id} key={id} onClick={() => setTab(id)}>{label}</button>)}</div>
    {tab !== 'clan' && <><section className="league-my-card" style={{ background: league.tint, borderColor: league.color }}><Shield size={28} style={{color:league.color}}/><div><small>{uid ? 'あなたのリーグ' : 'Google連携で公式レートを記録'}</small><strong>{uid ? `${league.label}リーグ` : 'ゲスト・練習モード'}</strong><span>{me ? `${me.wins}勝 ${me.losses}敗 ${me.draws}分` : '初期レート1500・AI戦では変動なし'}</span></div><b>{uid ? rating.toLocaleString() : '—'}<small>レート</small></b></section>
    {uid && <div className="league-progress"><progress value={progress.ratio} max={1} aria-label="次のリーグへの進捗"/><span>{progress.next ? `${progress.next.label}まであと${progress.remain}` : '最高リーグに到達'}</span></div>}
    <label className="league-filter">リーグで見る<select value={filter} onChange={e => setFilter(e.target.value as LeagueId | 'all')}><option value="all">すべてのリーグ</option>{LEAGUES.map(l => <option value={l.id} key={l.id}>{l.label}（{l.min}〜）</option>)}</select></label></>}
    <div className="league-scroll" tabIndex={0} aria-label="ランキング一覧">
      {tab === 'clan' ? <ManaClan key={uid} onRequireLogin={onRequireLogin}/> : <>{loading ? <p role="status">順位表を読み込み中…</p> : error ? <p role="alert" className="league-error">{error}</p> : !rows.length ? <p className="league-empty">{tab === 'friend' && !uid ? 'フレンド順位を見るにはGoogle連携が必要です。' : 'まだこの範囲に対戦記録がありません。'}</p> : <ol className="league-rows">{visible.map(r => { const mine = r.uid === uid; const l = leagueOf(r.rating); const rank = rankOf(r); const profile = profiles.viewer === uid ? profiles.data[r.uid] : undefined; return <li key={r.uid} data-me={mine} data-top={rank <= 3} style={{borderLeftColor:l.color}}><b>{rank <= 3 ? <Trophy size={16} aria-hidden="true"/> : null}{rank}</b><span><strong>{mine ? 'あなた' : displayNicknameForNational(displaySafeNickname(r.nickname), !!profile)}</strong><small style={{color:l.color}}>{l.label} · {r.wins}勝 {r.losses}敗</small>{profile && <small className="league-public-profile" data-public-profile title="公開設定済み・この端末の演習／解説の学習累計（最後に同期した値）">{displaySafePublicText(profile.targetSchool) || '志望校未設定'} · 学習 {formatStudyTime(profile.studySeconds)}{profile.stagesCleared != null ? ` · 達成 ${profile.stagesCleared}` : ''}{profile.level != null ? ` · Lv.${profile.level}` : ''}</small>}{profile?.motto && <small className="league-public-motto" data-public-motto>「{displaySafePublicText(profile.motto)}」</small>}</span>{!mine && <UserSafetyMenu target={{uid:r.uid,nickname:displaySafeNickname(r.nickname),where:'ranking'}}/>}<em>{r.rating.toLocaleString()}<small>レート</small></em></li>; })}</ol>}
      <details className="league-info"><summary>5つのリーグと隔週プレゼント</summary><ul>{LEAGUES.map((l,i) => <li key={l.id} style={{color:l.color}}><strong>{l.label}</strong> {l.min}〜{LEAGUES[i+1] ? LEAGUES[i+1].min-1 : '上限なし'}</li>)}</ul><p>志望校・学習時間は「設定」で公開を選んだ人だけ表示します。学習時間は最後に同期した端末の演習・解説の累計で、対戦レートや聞く力の測定値ではありません。</p><p>得点ではなく対戦レートで順位が決まります。同レートは同順位。表示は上位100名までです。</p><p>{seasonReady ? `隔週月曜0時（日本時間）締切。次回 ${end}。期間中に全国の対人戦3試合以上の各リーグ上位10名へ、限定UR「リーグ・オーロラフレーム」。上位3クランの対象メンバーにも贈ります。同順位は同じ扱いです。` : '隔週のURプレゼントは集計サーバーの反映後に開始します。未稼働の配布は約束しません。'}</p><p>報酬はマイページの「プレゼント」に届きます。集計方法・メンバー別貢献値は非公開です。</p></details></>}
    </div>
    {tab !== 'clan' && <footer className="league-footer"><span>{me && rows.some(r => r.uid === uid) ? `この範囲で${rankOf(me)}位` : me ? '上位表示の圏外／別リーグ' : '公式戦でレートを記録しよう'}</span>{onBattle && <button type="button" onClick={onBattle}><Swords size={18}/>対戦へ</button>}</footer>}
  </section>;
}
