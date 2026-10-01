import { createFriendRoom, abortRoom } from '../battle/data/battle';
import { useEffect, useState } from 'react';
import { Users, Shield, Plus, LogIn } from 'lucide-react';
import { auth } from '../firebase';
import { clanCall, type Clan, type ClanState } from '../utils/manaClan';
import { displaySafeNickname } from '../features/safety/nicknameFilter';
export function ManaClan() {
  const [mine, setMine] = useState<ClanState | null>(null);
  const [rows, setRows] = useState<Clan[]>([]);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [name, setName] = useState(''); const [code, setCode] = useState('');
  const [form, setForm] = useState<'create' | 'join' | null>(null);
  const [duelCode, setDuelCode] = useState('');
  const load = async () => {
    const data = await clanCall<{ mine: ClanState; ranking: Clan[] }>('overview');
    setMine(data.mine); setRows(data.ranking);
  };
  useEffect(() => { let alive = true; setBusy(true); clanCall<{ mine: ClanState; ranking: Clan[] }>('overview').then(d => { if (alive) { setMine(d.mine); setRows(d.ranking); } }).catch(e => { if (alive) setError(e.message); }).finally(() => { if (alive) setBusy(false); }); return () => { alive = false; }; }, []);
  const run = async (action: string, input = {}) => {
    if (busy) return; setBusy(true); setError('');
    try { await clanCall(action, input); setForm(null); await load(); } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };
  return <div className="clan-content">
    <section className="league-info"><h2><Users size={20}/> マナクラン</h2><p>仲間とひとつのチームに。個人レートをもとに、サーバーがクランパワーを集計します。メンバー別の貢献値・計算式は公開しません。</p></section>
    {error && <p role="alert" className="league-error">{error}<button type="button" disabled={busy} onClick={() => void run('refresh')}>再接続</button></p>}
    {!auth.currentUser ? <p>作成・参加にはGoogleログインが必要です。</p> : mine && <section className="league-info">
      {mine.clan ? <><h2><Shield size={20}/>{displaySafeNickname(mine.clan.name)}</h2><p><strong>{mine.clan.power.toLocaleString()}</strong> パワー · {mine.clan.members} / 20人</p><p>招待コード <strong>{mine.inviteCode}</strong>（公開の順位表には出しません）</p><details><summary>参加メンバー</summary><p>{mine.memberNames?.map(displaySafeNickname).join('・')}</p></details><details><summary>クラン交流戦・脱退</summary><p>リーダーが別クランへ英文法の1対1交流戦を申し込めます。両クランの参加メンバーが代表として対戦してください。交流戦の勝敗は下の戦績に記録されます。</p><p>交流戦：{mine.clan.wins ?? 0}勝 / {mine.clan.losses ?? 0}敗 / {mine.clan.draws ?? 0}分</p><label>相手クランの招待コード<input value={duelCode} maxLength={8} onChange={e => setDuelCode(e.target.value.toUpperCase())}/></label><button type="button" disabled={busy || !mine.owner || !/^[A-F0-9]{8}$/.test(duelCode)} onClick={async () => { setBusy(true); try { const room = await createFriendRoom('english_grammar'); try { await clanCall('challenge', { inviteCode: duelCode, roomId: room.roomId }); } catch (e) { await abortRoom(room.roomId).catch(() => {}); throw e; } setError(`交流戦の合言葉：${room.joinCode}。両クランの参加メンバーが「対戦 → 合言葉で参加」から入ってください。`); } catch (e: any) { setError(e.message); } finally { setBusy(false); } }}>交流戦の合言葉を発行</button><button type="button" disabled={busy} onClick={() => { if (window.confirm('クランを脱退しますか？再参加には24時間待つ必要があります。最後のメンバーならクランは解散します。')) void run('leave'); }}>脱退する</button></details></> : <><p>初心者も歓迎。1人が所属できるクランは1つです。</p><div className="league-actions"><button type="button" onClick={() => setForm('create')}><Plus size={18}/>つくる</button><button type="button" onClick={() => setForm('join')}><LogIn size={18}/>招待で参加</button></div>{form && <form onSubmit={e => { e.preventDefault(); void run(form, form === 'create' ? { name } : { inviteCode: code }); }}><label>{form === 'create' ? 'クラン名（2〜16文字）' : '招待コード'}<input required minLength={form === 'create' ? 2 : 8} maxLength={form === 'create' ? 16 : 8} value={form === 'create' ? name : code} onChange={e => form === 'create' ? setName(e.target.value) : setCode(e.target.value.toUpperCase())}/></label><button type="submit" disabled={busy}>{busy ? '処理中…' : '確定する'}</button></form>}</>}
    </section>}
    <p className="collection-storage">順位表は現在の全メンバーのパワーです。隔週報酬のクラン順位は、その期間に参加中の全国対人戦を3試合以上終えたメンバーで別集計します。</p><h2 className="league-list-title">クランランキング <small>上位50チーム</small></h2>
    {busy && <p role="status">読み込み中…</p>}
    <ol className="league-rows">{rows.map(c => <li key={c.id} data-me={c.id === mine?.clan?.id}><b>{c.rank ?? rows.filter(other => other.power > c.power).length + 1}</b><span><strong>{displaySafeNickname(c.name)}</strong><small>{c.members}人 · マナクラン</small></span><em>{c.power.toLocaleString()}<small>パワー</small></em></li>)}</ol>
    {!busy && !rows.length && !error && <p>まだクランがありません。最初のチームをつくろう。</p>}
  </div>;
}
