/**
 * ===================================================================
 * BattleRanking — 対戦ランキング（全国 / フレンド）
 * ===================================================================
 *
 * ★既存の学習ランキング（leaderboard_*）とは別のコレクションを見る★
 * 既存ランキングは「学習量」を競うもので、対戦の強さとは別の指標。
 * 同じ表に混ぜると、対戦をやらない人の順位が対戦で動いてしまう。
 * 対戦は battle_ranking という独立したコレクションを持ち、
 * 既存ランキングのコード（utils/leaderboard.ts）には一切触らない。
 *
 * ★フレンドタブを先に出す理由★
 * 全国のレート上位は、始めたばかりの人には遠すぎて目標にならない。
 * 知っている相手の中での順位なら、次に誰を追えばよいか分かる。
 *
 * ★全国タブで名前を隠す理由★
 * 既存の全国ランキングと同じ規則（nicknamePrivacy）に合わせる。
 * 片方だけ本名が出ると、利用者から見て一貫していない。
 */

import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowLeft, Crown, Users, Wifi } from 'lucide-react';
import { auth } from '../../firebase';
import { maskNickname } from '../../utils/nicknamePrivacy';
import { fetchFriendUids } from '../../utils/friends';
import {
  fetchBattleRanking,
  fetchFriendBattleRanking,
  ratingTitle,
} from '../data/battleRanking';
import type { BattleRankingRow } from '../data/battleRanking';
import {
  BattleButton,
  BattleLoading,
  BattleShell,
  BattleTitle,
  GOLD,
  INK,
  INK_SUB,
  LINE,
} from './BattleParts';
import { UserSafetyMenu } from '../../features/safety/UserSafetyMenu';
import { useWithoutBlocked } from '../../features/safety/useBlockedFilter';
import { safeAvatarUrl } from '../../features/safety/avatarUrl';
import { displaySafeNickname } from '../../features/safety/nicknameFilter';

type Tab = 'friend' | 'national';

/**
 * 上位3位の色（金・銀・銅）。
 *
 * ★ライト地なので銀を少し濃くしている★
 * #BDC3C7 の上に濃紺の数字を置くのは読めるが、アイボリー地の上で
 * 「地の色」として見ると境目が消える。銀と銅を1段濃めにした。
 */
const MEDALS = ['#F4D03F', '#A9AFB4', '#C0803A'];

export function BattleRanking({ onBack }: { onBack: () => void }) {
  const uid = auth.currentUser?.uid || '';
  const [tab, setTab] = useState<Tab>('friend');
  const [rows, setRows] = useState<BattleRankingRow[]>([]);
  const [loading, setLoading] = useState(true);
  // ブロックした人は出さない（App Store 1.2）
  const visibleRows = useWithoutBlocked<BattleRankingRow>(rows);

  const load = useCallback(async (which: Tab) => {
    setLoading(true);
    try {
      if (which === 'national') {
        setRows(await fetchBattleRanking(50));
      } else {
        // 既存のフレンド機能をそのまま使う（自分も含む）
        const friendUids = await fetchFriendUids(true);
        setRows(await fetchFriendBattleRanking(friendUids));
      }
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(tab);
  }, [tab, load]);

  return (
    /*
      ★スマホでは「固定（見出し・タブ・もどる）」と「スクロール（一覧）」を分ける★
      利用者の指示：「ランキング画面も基本一画面に入るでしょ？ 固定されるところと
      スクロールしてるところが明確になってるわけでしょ」
      DOM は変えず、className と id を足して index.css の @media (max-width: 767px)
      だけで切り替える（PC は今までどおり）。
    */
    <BattleShell
      className="battle-ranking"
      footer={
        <BattleButton variant="ghost" onClick={onBack} icon={<ArrowLeft size={18} />}>
          もどる
        </BattleButton>
      }
    >
      <BattleTitle subtitle="対戦ランキング" />

      {/* タブ */}
      <div
        id="battle-ranking-tabs"
        className="mb-3 flex gap-1 rounded-2xl border p-1"
        style={{ background: '#F1EDE4', borderColor: LINE }}
      >
        {(
          [
            { key: 'friend' as Tab, label: 'フレンド', icon: <Users size={13} /> },
            { key: 'national' as Tab, label: '全国', icon: <Wifi size={13} /> },
          ]
        ).map((t) => {
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black transition"
              style={
                on
                  ? { background: GOLD, color: INK, boxShadow: '0 2px 0 #D9A72E' }
                  : { background: 'transparent', color: INK_SUB }
              }
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ここから下がスマホでスクロールする領域（PC では素の div） */}
      <div id="battle-ranking-list" className="flex flex-1 flex-col">
      {loading ? (
        <BattleLoading message="ランキングを読みこんでいます…" />
      ) : rows.length === 0 ? (
        <p
          className="whitespace-pre-line py-12 text-center text-xs font-bold leading-relaxed"
          style={{ color: INK_SUB }}
        >
          {tab === 'friend'
            ? 'フレンドの中に、まだ対戦した人がいません。\n合言葉で1戦すればここに並びます。'
            : 'まだ対戦記録がありません。'}
        </p>
      ) : (
        <ol className="grid gap-1.5">
          {visibleRows.map((row, i) => {
            const isMe = row.uid === uid;
            const title = ratingTitle(row.rating || 1500);
            const medal = MEDALS[i];
            const shown =
              tab === 'national' && !isMe ? maskNickname(displaySafeNickname(row.nickname)) : isMe ? row.nickname || '名前なし' : displaySafeNickname(row.nickname);

            return (
              <li
                key={row.uid}
                className="battle-card-in flex items-center gap-2.5 rounded-2xl border-2 px-3 py-2.5"
                style={
                  {
                    borderColor: isMe ? `${GOLD}AA` : LINE,
                    background: isMe ? `${GOLD}1F` : '#FFFFFF',
                    // ★上から順に立ち上げる（順位表は上から読むもの）★
                    //   1件あたり 24ms。多すぎると待たされるので 10件で止める。
                    '--card-delay': `${Math.min(i, 10) * 0.024}s`,
                  } as CSSProperties
                }
              >
                {/* 順位 */}
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black tabular-nums"
                  style={{
                    background: medal ? medal : '#F1EDE4',
                    color: medal ? INK : INK_SUB,
                  }}
                >
                  {i < 3 ? <Crown size={13} /> : i + 1}
                </span>

                {/* アイコン */}
                {safeAvatarUrl(row.photoURL) ? (
                  <img
                    src={safeAvatarUrl(row.photoURL)}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black"
                    style={{ background: `${title.color}33`, color: title.color }}
                  >
                    {(shown[0] || '?').toUpperCase()}
                  </span>
                )}

                {/* 名前と戦績 */}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-black" style={{ color: INK }}>
                      {shown}
                    </span>
                    {isMe && (
                      <span
                        className="shrink-0 rounded-full px-1.5 py-0.5 text-xs font-black"
                        style={{ background: GOLD, color: INK }}
                      >
                        あなた
                      </span>
                    )}
                  </span>
                  <span className="block text-xs font-bold" style={{ color: INK_SUB }}>
                    {row.wins || 0}勝 {row.losses || 0}敗 {row.draws || 0}分
                  </span>
                </span>

                {!isMe && <UserSafetyMenu target={{ uid: row.uid, nickname: shown, where: 'ranking' }} />}

                {/* レート */}
                <span className="shrink-0 text-right">
                  <span
                    className="block text-base font-black tabular-nums"
                    style={{ color: title.color }}
                  >
                    {row.rating || 1500}
                  </span>
                  <span className="block text-xs font-black" style={{ color: title.color }}>
                    {title.label}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <p
        className="battle-ranking-note mt-auto pt-6 text-center text-xs font-bold leading-relaxed"
        style={{ color: INK_SUB }}
      >
        このランキングは対戦専用です。
        <br />
        学習量のランキングとは別に集計しています。
      </p>
      </div>
    </BattleShell>
  );
}
