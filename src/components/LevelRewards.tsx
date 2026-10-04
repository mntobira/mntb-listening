import { Gift, Lock, Check, FileText } from 'lucide-react';
import { LEVEL_REWARD_ITEMS, levelOf, type GrowthProgress } from '../battle/core/growth';

/**
 * レベルの道（2026-10-04 ご要望「レベルを上げるメリット」）
 *   レベルを上げるとここにあるものが自動で手に入る。次にもらえるものを大きく、残りは道の上に並べる。
 *   UR は学習プリント「共通テスト リスニングの聞き方」（Lv.15）。ガチャ・ショップでは手に入らない。
 */
export function LevelRewards({ progress }: { progress: GrowthProgress }) {
  const level = levelOf(progress.xp).level;
  const road = [...LEVEL_REWARD_ITEMS].sort((a, b) => ('level' in a.unlock ? a.unlock.level : 0) - ('level' in b.unlock ? b.unlock.level : 0));
  const next = road.find(i => 'level' in i.unlock && i.unlock.level > level);
  return (
    <section className="level-road" aria-labelledby="level-road-title" data-level-road>
      <h2 id="level-road-title"><Gift size={16} aria-hidden="true" />レベルで手に入るもの</h2>
      {next && 'level' in next.unlock && (
        <p className="level-road-next">あと <b>{next.unlock.level - level}</b> レベル（Lv.{next.unlock.level}）で<strong data-rarity={next.rarity}>{next.rarity} {next.label.replace(/（Lv\.\d+）/, '')}</strong></p>
      )}
      <ol>
        {road.map(item => {
          const lv = 'level' in item.unlock ? item.unlock.level : 0;
          const got = progress.owned.includes(item.id) || level >= lv;
          return (
            <li key={item.id} data-got={got || undefined} data-rarity={item.rarity}>
              <span className="lr-lv">Lv.{lv}</span>
              <span className="lr-icon" aria-hidden="true">{got ? <Check size={14} /> : item.kind === 'print' ? <FileText size={14} /> : <Lock size={14} />}</span>
              <span className="lr-label"><b>{item.rarity}</b>{item.label.replace(/（Lv\.\d+）/, '')}</span>
            </li>
          );
        })}
      </ol>
      <p className="level-road-note">レベルは演習・対戦・復習・ミッションで上がります。手に入ったものは「持ちもの」「マイPDF」に入ります。</p>
    </section>
  );
}
