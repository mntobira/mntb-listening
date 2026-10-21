import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * CLAUDE.md の UI 原則（文字 12px 以上・タップ 44px 以上）と、
 * 2026-10-18 のご要望で直した画面が、後の変更で元に戻らないための見張り。
 * 実画面の検査は Playwright（/tmp/pw/walk.mjs 相当）で行い、ここでは
 * ソースに「12px 未満の Tailwind 指定」が再び入らないことだけを機械的に見る。
 */
const root = join(__dirname, '..');
const read = (p: string) => readFileSync(join(root, p), 'utf8');
const walk = (dir: string): string[] => readdirSync(join(root, dir)).flatMap((name) => {
  const rel = `${dir}/${name}`;
  return statSync(join(root, rel)).isDirectory() ? walk(rel) : [rel];
});

describe('文字の大きさ（12px 以上）', () => {
  it('src の TSX に text-[9〜11.xpx] の指定が無い', () => {
    const hits = walk('src')
      .filter((f) => f.endsWith('.tsx'))
      .flatMap((f) => [...read(f).matchAll(/text-\[(\d+(?:\.\d+)?)px\]/g)]
        .filter((m) => Number(m[1]) < 12)
        .map((m) => `${f}: ${m[0]}`));
    expect(hits).toEqual([]);
  });

  it('科目選択（listening-home.css）に 12px 未満の font-size が無い', () => {
    const sizes = [...read('src/components/listening-home.css').matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)]
      .map((m) => Number(m[1]));
    expect(sizes.filter((v) => v < 12)).toEqual([]);
  });

  it('学習モード選択（.mode-*）に 12px 未満の font-size が無い', () => {
    const bad = ['src/index.css', ...walk('src/styles').filter((f) => f.endsWith('.css'))].map(read).join('\n').split('\n')
      .filter((l) => /^\s*\.(mode-|mode-desk)/.test(l) || l.includes('.mode-desk '))
      .flatMap((l) => [...l.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].filter((m) => Number(m[1]) < 12).map(() => l.trim().slice(0, 60)));
    expect(bad).toEqual([]);
  });
});

describe('2026-10-18 のご要望（リスニングの資料・フレンド）', () => {
  const materials = read('src/components/ListeningMaterials.tsx');
  it('第4問A：図は横スクロールにせず幅いっぱいで全体を見せ、タップで拡大できる', () => {
    expect(materials).not.toContain('横にスクロールして図全体を確認できます');
    expect(materials).not.toMatch(/style=\{\{\s*minWidth:\s*image\.minWidth/);
    expect(materials).toContain('data-material-zoom');
  });
  it('2026-10-21：図は資料欄に収まる大きさで描き、タップで ○ → × → 消す。拡大は別の 44px ボタン', () => {
    expect(materials).toContain('data-material-figure-tap');
    expect(materials).toMatch(/data-material-zoom-open[\s\S]{0,120}h-11 w-11/);
    expect(materials).toContain('const MARK_HIT = 22;');
    // 図が複数（第6問B）なら枠の形で 2×2 / 4×1 を選ぶ。メモ表は名前ボタン1行
    expect(materials).toContain('function bestColumns(');
    expect(materials).toContain('data-material-memo');
    // 図の高さで枠が伸びない（absolute）＝資料欄からはみ出さない
    expect(materials).toMatch(/className="absolute cursor-crosshair/);
    const pane = read('src/components/quiz/ListeningMaterialPane.tsx');
    expect(pane).toContain('flex min-h-0 flex-1 flex-col overflow-auto');
  });
  it('2026-10-21：資料欄の「状況・場面を確認」と「問18〜21」の見出しは出さない（解答欄の黒い札と重複）', () => {
    const pane = read('src/components/quiz/ListeningMaterialPane.tsx');
    expect(pane).not.toMatch(/<summary[^>]*>状況・場面を確認/);
    expect(pane).not.toContain('{materialTrack.label} · 資料');
    expect(pane).not.toContain(".replace(/^講義（([^）]+)）$/u, '$1')");
  });
  it('2026-10-21：説明ページは全文ではなく 題・説明・状況・配点 だけをゴシックで出す', () => {
    const brief = read('src/components/ListeningBriefing.tsx');
    expect(brief).toContain('parseListeningBriefing(lead)');
    expect(brief).not.toContain('<ExplanationBody');
    expect(brief).toMatch(/data-listening-briefing className="[^"]*font-modern/);
  });
  it('2026-10-21：図の下の「(18) 1st step …」の空欄一覧は出さない（解答欄の札と重複）', () => {
    expect(materials).toContain('material.sections?.filter(section => !isBlankList(section.rows))');
  });
  it('2026-10-21：解説の要点・思考手順・表の英語は数式用セリフ体にしない（prose）', () => {
    const lx = read('src/components/explanation/ListeningCompactAnswers.tsx');
    expect(lx).toContain('formatText(theme, [], { prose: isEnglishChapter })');
    expect(lx).toContain('formatText(step, [], { prose: isEnglishChapter })');
    const body = read('src/components/ExplanationBody.tsx');
    expect(body).not.toMatch(/\{formatText\(cell\)\}/);
    expect(body).toMatch(/<ExplanationTable key=\{`t-\$\{i\}`\} block=\{block\} tone=\{tone\} prose=\{prose\} \/>/);
  });
  it('第4問B：条件表の空欄は ○ → × → 空欄 とタップで切り替えられる（44px）', () => {
    expect(materials).toContain("const NEXT_MARK: Record<string, string> = { '': '○', '○': '×', '×': '' };");
    expect(materials).toMatch(/data-material-mark[\s\S]{0,400}h-11/);
  });
  it('第6問B：長い設問文は小問バーで切らずに全文を出す', () => {
    const answer = read('src/components/AnswerPane.tsx');
    expect(answer).toContain('data-answer-prompt');
    expect(answer).toContain('!isLongBlankHint(cur.blankHint)');
  });
  it('フレンド：外枠はスクロールさせず、一覧だけが残りの高さを使う', () => {
    const friend = read('src/components/FriendPanel.tsx');
    expect(friend).toMatch(/h-full min-h-0 overflow-hidden flex flex-col friend-panel/);
    expect(friend).toMatch(/data-friend-list className="min-h-\[160px\] flex-1/);
  });
  it('通報・ブロック（…）ボタンは 44px 以上', () => {
    // index.css は C-16 で src/styles/*.css に分割された。どこにあっても 44px であること
    const css = ['src/index.css', ...walk('src/styles').filter((f) => f.endsWith('.css'))].map(read).join('\n');
    const rules = [...css.matchAll(/\.user-safety-trigger \{[^}]*\}/g)].map((m) => m[0]);
    expect(rules.length).toBeGreaterThan(0);
    rules.forEach((r) => expect(r).toMatch(/min-width:\s*44px;\s*min-height:\s*44px;/));
  });
});
