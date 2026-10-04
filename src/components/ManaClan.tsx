import { createFriendRoom, abortRoom } from '../battle/data/battle';
import { useEffect, useState } from 'react';
import { Users, Shield, Plus, LogIn, Copy, Swords, RefreshCw } from 'lucide-react';
import { auth } from '../firebase';
import { clanCall, type Clan, type ClanState } from '../utils/manaClan';
import { displaySafeNickname } from '../features/safety/nicknameFilter';

/**
 * マナクラン（2026-10-03 導線を整理）
 *
 * ■ 利用者の指摘「クランとかどこまで導入できているかわからない」
 *   以前は説明文と入力欄が並んでいるだけで、
 *     ・何から始めればいいか（つくる／招待で入る）
 *     ・招待コードをどう仲間に渡すか（コピー手段が無かった）
 *     ・交流戦の合言葉をどこに入れるか（エラー欄に出ていた）
 *   が分からなかった。また集計サーバーが未反映のときも、ただのエラーになっていた。
 *
 * ■ 今の流れ（画面の上から順に、今やることが1つ光る）
 *   ① クランをつくる／招待コードで入る
 *   ② 招待コードをコピーして仲間に送る（20人まで）
 *   ③ リーダーが相手クランの招待コードで交流戦の合言葉を発行 → 両クランの代表が「対戦 → 合言葉で入る」
 */
export function ManaClan({ onRequireLogin }: { onRequireLogin?: () => void; key?: string }) {
  const [mine, setMine] = useState<ClanState | null>(null);
  const [rows, setRows] = useState<Clan[]>([]);
  const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [name, setName] = useState(''); const [code, setCode] = useState('');
  const [form, setForm] = useState<'create' | 'join' | null>(null);
  const [duelCode, setDuelCode] = useState('');
  const [duelJoinCode, setDuelJoinCode] = useState('');
  const signedIn = !!auth.currentUser && !auth.currentUser.isAnonymous;

  const fail = (e: unknown) => {
    const message = (e as Error)?.message || '接続できませんでした。';
    if (/集計サーバー|未反映/.test(message)) setUnavailable(true);
    setError(message);
  };
  const load = async () => {
    const data = await clanCall<{ mine: ClanState; ranking: Clan[] }>('overview');
    setMine(data.mine); setRows(data.ranking); setUnavailable(false); setError('');
  };
  useEffect(() => {
    let alive = true; setBusy(true);
    clanCall<{ mine: ClanState; ranking: Clan[] }>('overview')
      .then(d => { if (alive) { setMine(d.mine); setRows(d.ranking); } })
      .catch(e => { if (alive) fail(e); })
      .finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
  }, []);
  const run = async (action: string, input = {}, done = '') => {
    if (busy) return; setBusy(true); setError(''); setNotice('');
    try { await clanCall(action, input); setForm(null); await load(); if (done) setNotice(done); } catch (e) { fail(e); } finally { setBusy(false); }
  };
  const copy = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); setNotice(`${label}をコピーしました。`); }
    catch { setNotice(`${label}：${text}（長押しでコピーしてください）`); }
  };
  const issueDuel = async () => {
    setBusy(true); setError(''); setNotice('');
    try {
      const room = await createFriendRoom('english_grammar');
      try { await clanCall('challenge', { inviteCode: duelCode, roomId: room.roomId }); }
      catch (e) { await abortRoom(room.roomId).catch(() => {}); throw e; }
      setDuelJoinCode(room.joinCode);
    } catch (e) { fail(e); } finally { setBusy(false); }
  };

  const clan = mine?.clan;
  const step = !signedIn ? 0 : !clan ? 1 : (clan.members < 2 ? 2 : 3);

  return <div className="clan-content">
    <section className="league-info clan-intro">
      <h2><Users size={20} aria-hidden="true"/> マナクラン</h2>
      <p>仲間（最大20人）とチームを組み、メンバーの対戦レートからクランパワーを集計します。クランどうしの交流戦もできます。</p>
      <ol className="clan-steps" aria-label="はじめかた">
        <li data-active={step <= 1 || undefined} data-done={step > 1 || undefined}><b>1</b>クランをつくる／招待コードで入る</li>
        <li data-active={step === 2 || undefined} data-done={step > 2 || undefined}><b>2</b>招待コードを仲間に送る</li>
        <li data-active={step === 3 || undefined}><b>3</b>交流戦・全国対戦でパワーを上げる</li>
      </ol>
    </section>

    {unavailable && <p role="status" className="league-error">マナクランの集計サーバーを準備中です。クランの作成・参加は、運営の設定が終わりしだい使えます（対戦・フレンド対戦はいつも通り使えます）。</p>}
    {error && !unavailable && <p role="alert" className="league-error">{error}<button type="button" disabled={busy} onClick={() => { setBusy(true); load().catch(fail).finally(() => setBusy(false)); }}><RefreshCw size={14} aria-hidden="true"/>再接続</button></p>}
    {notice && <p role="status" className="clan-notice">{notice}</p>}

    {!signedIn ? <section className="league-info">
      <p>クランの作成・参加には Google / Apple でのログインが必要です（ゲストは順位表の閲覧のみ）。</p>
      {onRequireLogin && <div className="league-actions"><button type="button" onClick={onRequireLogin}><LogIn size={18} aria-hidden="true"/>ログインする</button></div>}
    </section> : mine && <section className="league-info">
      {clan ? <>
        <h2><Shield size={20} aria-hidden="true"/>{displaySafeNickname(clan.name)}</h2>
        <p><strong>{clan.power.toLocaleString()}</strong> パワー · {clan.members} / 20人{mine.owner ? ' · あなたはリーダー' : ''}</p>
        <div className="clan-invite">
          <span>招待コード</span><strong>{mine.inviteCode}</strong>
          <button type="button" onClick={() => void copy(`マナトビのクラン「${clan.name}」に入ってね！ 招待コード：${mine.inviteCode}（ランキング → マナクラン → 招待で参加）`, '招待メッセージ')}><Copy size={16} aria-hidden="true"/>コピー</button>
        </div>
        <p className="clan-hint">招待コードは公開の順位表には出ません。仲間には「ランキング → マナクラン → 招待で参加」から入ってもらいます。</p>
        <details><summary>参加メンバー（{clan.members}人）</summary><p>{mine.memberNames?.map(displaySafeNickname).join('・')}</p></details>
        <details open={step === 3 || undefined}><summary><Swords size={16} aria-hidden="true"/>クラン交流戦（英文法・1対1）</summary>
          <p>戦績：{clan.wins ?? 0}勝 / {clan.losses ?? 0}敗 / {clan.draws ?? 0}分</p>
          {mine.owner ? <>
            <p>相手クランのリーダーから招待コードを聞いて入力し、合言葉を発行します。相手クランのメンバーは、フレンドでなくてもこの部屋に入れます。</p>
            <label>相手クランの招待コード（8文字）<input value={duelCode} maxLength={8} inputMode="text" autoCapitalize="characters" onChange={e => setDuelCode(e.target.value.toUpperCase().replace(/[^A-F0-9]/g, ''))}/></label>
            <button type="button" disabled={busy || !/^[A-F0-9]{8}$/.test(duelCode)} onClick={() => void issueDuel()}>交流戦の合言葉を発行</button>
          </> : <p>交流戦の申し込みはリーダーが行います。リーダーから届いた合言葉を「対戦 → フレンド → 合言葉で入る」に入れてください。</p>}
          {duelJoinCode && <div className="clan-invite" data-duel>
            <span>交流戦の合言葉</span><strong>{duelJoinCode}</strong>
            <button type="button" onClick={() => void copy(`マナトビのクラン交流戦！ 合言葉：${duelJoinCode}（対戦 → フレンド → 合言葉で入る）`, '交流戦の合言葉')}><Copy size={16} aria-hidden="true"/>コピー</button>
          </div>}
          {duelJoinCode && <p className="clan-hint">相手クランの代表に送ってください。あなた（またはあなたのクランの代表）は同じ合言葉で「対戦 → フレンド → 合言葉で入る」から入ると対戦できます。</p>}
        </details>
        <details><summary>脱退</summary>
          <p>脱退すると24時間は再参加できません。最後のメンバーが抜けるとクランは解散します。</p>
          <button type="button" disabled={busy} onClick={() => { if (window.confirm('クランを脱退しますか？再参加には24時間待つ必要があります。最後のメンバーならクランは解散します。')) void run('leave', {}, 'クランを脱退しました。'); }}>脱退する</button>
        </details>
      </> : <>
        <p>まだクランに入っていません。1人が所属できるクランは1つです。初心者も歓迎。</p>
        <div className="league-actions">
          <button type="button" aria-pressed={form === 'create'} onClick={() => setForm('create')}><Plus size={18} aria-hidden="true"/>クランをつくる</button>
          <button type="button" aria-pressed={form === 'join'} onClick={() => setForm('join')}><LogIn size={18} aria-hidden="true"/>招待で参加</button>
        </div>
        {form && <form onSubmit={e => { e.preventDefault(); void run(form, form === 'create' ? { name } : { inviteCode: code }, form === 'create' ? 'クランをつくりました。招待コードを仲間に送りましょう。' : 'クランに参加しました。'); }}>
          <label>{form === 'create' ? 'クラン名（2〜16文字・個人情報は入れない）' : '招待コード（8文字の英数字）'}
            <input required minLength={form === 'create' ? 2 : 8} maxLength={form === 'create' ? 16 : 8}
              value={form === 'create' ? name : code}
              onChange={e => form === 'create' ? setName(e.target.value) : setCode(e.target.value.toUpperCase().replace(/[^A-F0-9]/g, ''))}/>
          </label>
          <button type="submit" disabled={busy}>{busy ? '処理中…' : form === 'create' ? 'この名前でつくる' : '参加する'}</button>
        </form>}
      </>}
    </section>}

    <p className="collection-storage">順位表は現在の全メンバーのパワーです。隔週報酬のクラン順位は、その期間に参加中の全国対人戦を3試合以上終えたメンバーで別集計します。</p>
    <h2 className="league-list-title">クランランキング <small>上位50チーム</small></h2>
    {busy && <p role="status">読み込み中…</p>}
    <ol className="league-rows">{rows.map(c => <li key={c.id} data-me={c.id === clan?.id}><b>{c.rank ?? rows.filter(other => other.power > c.power).length + 1}</b><span><strong>{displaySafeNickname(c.name)}</strong><small>{c.members}人 · マナクラン</small></span><em>{c.power.toLocaleString()}<small>パワー</small></em></li>)}</ol>
    {!busy && !rows.length && !error && !unavailable && <p>まだクランがありません。最初のチームをつくろう。</p>}
  </div>;
}
