import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * 2026-10-19「Pull to Refresh / Skeleton / Toast / Bottom Sheet / Swipe Action / Auto Complete を
 * 必要なものだけ導入」の見張り。入れた2つ（Toast・Skeleton）が外れないことと、
 * 入れなかった判断（確認ダイアログは止めたまま・PTR は付けない）が崩れないことを見る。
 */
const read = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');

describe('Toast：notify はアプリ内のトーストで出す', () => {
  const toast = read('src/components/AppToast.tsx');
  it('AppToast が notify だけを差し替える（confirm は止める確認のまま）', () => {
    expect(toast).toMatch(/setDialogHandlers\(\{\s*notify:/);
    expect(toast).not.toMatch(/confirm\s*:/);
  });
  it('App の最上位に置かれている', () => {
    expect(read('src/App.tsx')).toMatch(/<AppToast \/>/);
  });
  it('読み上げは role="status"、タップで消せる、44px 以上・14px', () => {
    expect(toast).toContain('role="status"');
    expect(toast).toMatch(/onClick=/);
    expect(read('src/styles/system.css')).toMatch(/\.app-toast \{[^}]*font-size: 14px;[^}]*min-height: 44px;/);
  });
});

describe('Skeleton：一覧の読み込み中は行の骨組みを出す', () => {
  it('ランキングの「読み込み中…」の1行は骨組みに置き換わっている', () => {
    const lb = read('src/components/Leaderboard.tsx');
    expect(lb).not.toContain('<p role="status">順位表を読み込み中…</p>');
    expect(lb.match(/<ListSkeleton label="順位表を読み込み中…" \/>/g)?.length).toBe(2);
  });
  it('フレンド一覧は初回だけ骨組み。失敗しても出し続けない（finally で loaded）', () => {
    const fp = read('src/components/FriendPanel.tsx');
    expect(fp).toContain('<ListSkeleton rows={4}');
    expect(fp).toMatch(/finally \{\s*setLoaded\(true\)/);
  });
  it('動きを減らす設定では明滅を止める', () => {
    expect(read('src/styles/system.css')).toMatch(/prefers-reduced-motion: reduce\) \{ \.mt-skeleton-row i \{ animation: none; \} \}/);
  });
});

describe('入れなかったもの', () => {
  it('Pull to Refresh：引っ張り更新は抑止したまま（overscroll-behavior-y: none）', () => {
    expect(read('src/styles/theme-base.css')).toMatch(/overscroll-behavior-y: none/);
  });
});
