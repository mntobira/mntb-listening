/**
 * ===================================================================
 * BattleRaceTrack — 「いま相手はどこにいて、どっちが勝っているか」を1目で
 * ===================================================================
 *
 * ご指摘（原文）：
 *   > 今、相手がどれぐらいの問題の位置にいるかって言うのも消えてない？
 *   > なんか色々バトル画面も消えてるので、もっと面白みが出るようにしてほしい。
 *
 * ■ 何が足りなかったか
 *   対戦中の画面は「名前・レート・合計点・解答済みの緑丸」だけだった。
 *   合計点は分かるが、
 *     ・いま何問目まで進んでいるのか
 *     ・相手はどの問で正解／不正解だったのか
 *     ・点差は開いているのか、詰まっているのか
 *     ・連続正解しているのは誰か
 *   が読めない。数字が 1 つ動くだけの画面は、対戦の「熱」を作れない。
 *
 * ■ 参考にした既存アプリの作り
 *   ・みんはや：問題ごとの ○× が横一列に並ぶ。「あと何問」が常に見える
 *   ・QuizKnock 系・ポケポケの対戦：点差を「あと ○ 点」「○ 点リード」と
 *     1 語で言い切る。数字を 2 つ見比べさせない
 *   ・音ゲー／リズム系：連続成功で炎・COMBO が出る（維持したくなる）
 *   これらの共通点は「状態を全部並べる」のではなく「今いちばん知りたい
 *   1 つを大きく、履歴を小さく」置くこと。
 *
 * ■ この部品が出すもの（上から）
 *   ① 点差の一言 … 「12 点リード」「8 点おくれ」「同点！」を中央に大きく
 *   ② 連続正解   … 3 連続以上で炎アイコン＋「○連続」（自分・相手それぞれ）
 *   ③ レース     … 2 レーン × 問題数ぶんのマス。
 *                    ○ 正解 ／ × 不正解 ／ ◐ いまの問 ／ ・ まだ
 *                    ★相手が「何を答えたか」は出さない★（○× だけ）。
 *                    出すと画面を見せ合える環境で答えを合わせられる。
 *
 * ■ 「相手の位置」の意味
 *   online / AI どちらも「両者が同じ問を同時に解く」進み方なので、
 *   相手が別の問にいることは無い。ここで言う「位置」は
 *   「いまの問で答え終わったか（◐ が点滅→塗り）」と
 *   「これまでの問で ○× がどう並んでいるか」の 2 つで表す。
 *
 * ■ 答え合わせ前の問は隠す（reveal）
 *   いまの問の ○× は、reveal（両者解答済み or 締切）になるまで出さない。
 *   自分が答えた直後に相手のマスが × に変わると「相手は間違えた」と
 *   分かってしまい、自分の答えを変える手がかりになる。
 *   reveal 前は「答えた（塗り）／まだ（点滅）」だけを見せる。
 *
 * ■ online / AI で共有する
 *   どちらも BattlePlayerScore（perQuestion 付き）を渡すだけで同じ絵になる。
 *   画面ごとに別の実装を持つと、片方だけ壊れて気づけない。
 */

import { Flame } from 'lucide-react';
import type { BattlePlayerScore } from '../core/types';
import { AMBER, GOLD, INK, INK_SUB, LINE, WRONG } from './BattleParts';

/** これ以上の連続正解で炎を出す（scoring の STREAK_THRESHOLD と同じ 3） */
const STREAK_FLAME_AT = 3;

/** 各マスの状態 */
type Cell = 'correct' | 'wrong' | 'answered' | 'current' | 'pending';

/**
 * 1 人ぶんのマス列を作る。
 *
 * @param detail      その人の採点（perQuestion を見る）。null なら全部 pending
 * @param total       問題数
 * @param current     いま何問目か（0 始まり）
 * @param answeredNow いまの問に答え終わったか
 * @param reveal      いまの問の答え合わせを見せてよいか
 */
export function buildLane(
  detail: BattlePlayerScore | null | undefined,
  total: number,
  current: number,
  answeredNow: boolean,
  reveal: boolean,
): Cell[] {
  const cells: Cell[] = [];
  for (let i = 0; i < total; i += 1) {
    if (i < current || (i === current && reveal)) {
      // 終わった問（または答え合わせ中の問）は ○× を出す
      const s = detail?.perQuestion.find((p) => p.index === i);
      cells.push(s?.correct ? 'correct' : 'wrong');
    } else if (i === current) {
      // いまの問：答えたか／まだか だけ
      cells.push(answeredNow ? 'answered' : 'current');
    } else {
      cells.push('pending');
    }
  }
  return cells;
}

/** 直近の連続正解数（いまの問を含めるかは reveal 次第） */
export function currentStreak(
  detail: BattlePlayerScore | null | undefined,
  upTo: number,
): number {
  if (!detail) return 0;
  let n = 0;
  for (let i = upTo; i >= 0; i -= 1) {
    const s = detail.perQuestion.find((p) => p.index === i);
    if (!s) break;
    if (!s.correct) break;
    n += 1;
  }
  return n;
}

/** 点差の一言。★数字を 2 つ見比べさせない★ */
export function leadLabel(mine: number, theirs: number): { text: string; tone: 'lead' | 'behind' | 'even' } {
  const diff = mine - theirs;
  if (diff === 0) return { text: '同点！', tone: 'even' };
  if (diff > 0) return { text: `${diff} 点リード`, tone: 'lead' };
  return { text: `${-diff} 点おくれ`, tone: 'behind' };
}

function Lane({ cells, accent, label, align }: { cells: Cell[]; accent: string; label: string; align: 'left' | 'right' }) {
  return (
    <div className={`flex items-center gap-1.5 ${align === 'right' ? 'flex-row-reverse' : ''}`} aria-label={label}>
      <div className="flex flex-1 flex-wrap gap-[3px]" style={{ justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
        {cells.map((c, i) => {
          const base = 'h-[12px] w-[12px] rounded-full border-[1.5px]';
          if (c === 'correct') return <span key={i} className={base} style={{ background: accent, borderColor: accent }} aria-label={`${i + 1}問目 正解`} />;
          if (c === 'wrong') return <span key={i} className={`${base} relative`} style={{ background: '#FFFFFF', borderColor: WRONG }} aria-label={`${i + 1}問目 不正解`}>
            <span className="absolute inset-[3px] rounded-full" style={{ background: WRONG }} />
          </span>;
          if (c === 'answered') return <span key={i} className={base} style={{ background: `${accent}88`, borderColor: accent }} aria-label={`${i + 1}問目 解答済み`} />;
          if (c === 'current') return <span key={i} className={`${base} animate-pulse`} style={{ background: '#FFFFFF', borderColor: accent }} aria-label={`${i + 1}問目 いま`} />;
          return <span key={i} className={base} style={{ background: '#FFFFFF', borderColor: LINE }} aria-label={`${i + 1}問目 まだ`} />;
        })}
      </div>
    </div>
  );
}

export function BattleRaceTrack({
  total,
  current,
  me,
  opponent,
  meAnswered,
  opponentAnswered,
  reveal,
  meAccent = AMBER,
  opponentAccent = INK_SUB,
}: {
  total: number;
  current: number;
  me: BattlePlayerScore | null | undefined;
  opponent: BattlePlayerScore | null | undefined;
  meAnswered: boolean;
  opponentAnswered: boolean;
  reveal: boolean;
  meAccent?: string;
  opponentAccent?: string;
}) {
  const myLane = buildLane(me, total, current, meAnswered, reveal);
  const theirLane = buildLane(opponent, total, current, opponentAnswered, reveal);
  // 点差は「確定した問まで」で出す（reveal 前のいまの問は含めない＝答えの手がかりにしない）
  const upTo = reveal ? current : current - 1;
  const sum = (d: BattlePlayerScore | null | undefined) =>
    d ? d.perQuestion.filter((p) => p.index <= upTo).reduce((a, p) => a + p.total, 0) : 0;
  const mine = sum(me);
  const theirs = sum(opponent);
  const lead = leadLabel(mine, theirs);
  const myStreak = currentStreak(me, upTo);
  const theirStreak = currentStreak(opponent, upTo);
  const leadColor = lead.tone === 'lead' ? meAccent : lead.tone === 'behind' ? WRONG : INK_SUB;

  return (
    <section
      id="battle-race"
      className="mb-3 rounded-2xl border-2 px-3 py-2"
      style={{ borderColor: LINE, background: '#FFFFFF' }}
      aria-label="対戦の進み具合"
    >
      {/* ① 点差の一言 ＋ ② 連続正解 */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <Streak n={myStreak} align="left" />
        <p
          className="battle-pop shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-black tabular-nums"
          style={{
            background: lead.tone === 'even' ? `${GOLD}55` : `${leadColor}1A`,
            color: lead.tone === 'even' ? INK : leadColor,
          }}
          data-battle-lead={lead.tone}
        >
          {lead.text}
        </p>
        <Streak n={theirStreak} align="right" />
      </div>

      {/* ③ レース（2 レーン） */}
      <div className="grid gap-1">
        <Lane cells={myLane} accent={meAccent} label="あなたの進み" align="left" />
        <Lane cells={theirLane} accent={opponentAccent} label="あいての進み" align="left" />
      </div>
      <p className="mt-1 text-right text-xs font-bold tabular-nums" style={{ color: INK_SUB }}>
        {Math.min(current + 1, total)} / {total} 問目
      </p>
    </section>
  );
}

function Streak({ n, align }: { n: number; align: 'left' | 'right' }) {
  // 3 連続未満は場所だけ確保して空にする（点差の位置が動かないように）
  return (
    <span
      className={`flex min-w-[4.5rem] items-center gap-1 text-xs font-black ${align === 'right' ? 'justify-end' : ''}`}
      style={{ color: n >= STREAK_FLAME_AT ? '#E67E22' : 'transparent' }}
      aria-hidden={n < STREAK_FLAME_AT}
      data-battle-streak={n}
    >
      {n >= STREAK_FLAME_AT && (
        <>
          <Flame size={12} className="battle-pop" />
          {n}連続
        </>
      )}
    </span>
  );
}
