import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (p: string) => readFileSync(p, 'utf8');

describe('ホーム・対戦・ランキングの手直し（2026-10-20）', () => {
  it('ホーム：とびら君の札は「マイとびら」。名前とレベルは別の色（別の要素）', () => {
    const home = read('src/components/Home.tsx');
    expect(home).not.toContain('MY TOBIRA');
    expect(home).toContain('my-tobira-name');
    expect(home).toContain('my-tobira-lv');
    expect(read('src/battle/ui/GrowthHomeStrip.tsx')).not.toContain('MY TOBIRA');
    const css = read('src/components/my-tobira-tag.css');
    expect(css).toMatch(/\.my-tobira-name \{[^}]*color: #1f3354/);
    expect(css).toMatch(/\.my-tobira-lv \{[^}]*background: linear-gradient/);
  });
  it('対戦：自分の名前は設定のニックネーム。アカウント名（displayName）は出さない', () => {
    const home = read('src/battle/ui/BattleHome.tsx');
    expect(home).not.toContain('displayName');
    expect(home).toContain('resolveNickname()');
    // ニックネーム未設定でもアカウント名には落とさない
    const lb = read('src/utils/leaderboard.ts');
    const body = lb.slice(lb.indexOf('export function resolveNickname'), lb.indexOf('// ランキングへの参加登録'));
    expect(body).not.toContain('displayName');
  });
  it('対戦：「正解で60点」などのタグは対戦画面から消し、カウントダウン画面に出す', () => {
    expect(read('src/battle/ui/BattleHome.tsx')).not.toContain('<li><Target aria-hidden="true"/>正解で60点</li>');
    expect(read('src/battle/ui/BattleHome.tsx')).not.toContain('arena-rule-chips');
    expect(read('src/battle/ui/BattleLiveParts.tsx')).toContain('<li>正解で60点</li>');
  });
  it('ランキング：下の「この範囲で1位」バーと BATTLE LEAGUES を削除、次のリーグまではグラデーション', () => {
    const lb = read('src/components/Leaderboard.tsx');
    expect(lb).not.toContain('league-footer');
    expect(lb).not.toContain('`この範囲で${');
    expect(lb).not.toContain('BATTLE LEAGUES');
    expect(lb).toContain('league-progress-rich');
    expect(read('src/components/ranking.css')).toMatch(/\.lp-track i \{[^}]*linear-gradient\(90deg, var\(--from\), var\(--to\)\)/);
  });
});
