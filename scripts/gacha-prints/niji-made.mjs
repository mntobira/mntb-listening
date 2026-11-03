#!/usr/bin/env node
/**
 * 2次試験ガチャの予想問題を「もう作った大学」の一覧（main ＋ 開いている PR すべて）。
 * 新しい大学を作り始める前に必ず実行する（別の部屋が同じ大学を作っていないかの確認）。
 *
 *   npm run niji:made                     # 一覧を出す
 *   npm run niji:made -- 山口大学 yamaguchi   # その大学がもうあれば「作成済み」と出して終了コード 1
 *
 * 見ている場所：main・開いている PR・手元のブランチの src/data/nijiMockPrints.ts の NIJI_UNIVERSITIES（{ id, name, track }）。
 * 読み取りだけ（git fetch と gh pr list）。push はしない。
 */
import { execFileSync } from 'node:child_process';

const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const FILE = 'src/data/nijiMockPrints.ts';

/** NIJI_UNIVERSITIES の中身を { id, name, track } の配列にする */
export function parseUniversities(src) {
  const block = src.match(/NIJI_UNIVERSITIES\s*=\s*\[([\s\S]*?)\]\s*as const/);
  if (!block) return [];
  const out = [];
  for (const m of block[1].matchAll(/\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*track:\s*'([^']*)'\s*\}/g)) {
    out.push({ id: m[1], name: m[2], track: m[3] });
  }
  return out;
}

function main() {
  const queries = process.argv.slice(2).filter((a) => a !== '--');
  const sources = [{ label: 'main', ref: 'refs/remotes/origin/main' }];
  run('git', ['fetch', '-q', 'origin', 'main']);

  let prs = [];
  try {
    prs = JSON.parse(run('gh', ['pr', 'list', '--state', 'open', '--limit', '100', '--json', 'number,title']));
  } catch {
    console.error('⚠ gh pr list に失敗しました（開いている PR は見ていません）。gh auth status を確認してください。');
  }
  for (const pr of prs) {
    const ref = `refs/remotes/niji-made/pr${pr.number}`;
    try {
      run('git', ['fetch', '-q', 'origin', `+pull/${pr.number}/head:${ref}`]);
      sources.push({ label: `#${pr.number}`, ref, title: pr.title });
    } catch {
      console.error(`⚠ #${pr.number} を取得できませんでした`);
    }
  }

  // まだ push していない手元のブランチも見る（自分が作りかけの大学を二重に作らないため）
  try {
    for (const b of run('git', ['for-each-ref', '--format=%(refname:short)', 'refs/heads/']).split('\n').filter(Boolean)) {
      sources.push({ label: `手元:${b}`, ref: `refs/heads/${b}` });
    }
  } catch {
    /* 手元のブランチが読めなくても、main と PR の確認は続ける */
  }

  /** id → { name, track, where: [...] } */
  const made = new Map();
  for (const s of sources) {
    let src = '';
    try {
      src = run('git', ['show', `${s.ref}:${FILE}`]);
    } catch {
      continue; // そのブランチにはファイルがない
    }
    for (const u of parseUniversities(src)) {
      const e = made.get(u.id) ?? { ...u, where: [] };
      e.where.push(s.label);
      made.set(u.id, e);
    }
  }

  const rows = [...made.values()];
  console.log(`作成済みの大学（main ＋ 開いている PR ${prs.length} 件 ＋ 手元のブランチ）：${rows.length} 系統`);
  for (const r of rows) {
    const shared = r.where.filter((w) => !w.startsWith('手元:'));
    const where = r.where.includes('main') ? 'main' : shared.length ? shared.join(' ') : `${r.where.join(' ')}（未 push）`;
    console.log(`  ${r.id.padEnd(10)} ${r.name}${r.track ? `（${r.track}）` : ''}  … ${where}`);
  }

  if (queries.length) {
    const hits = rows.filter((r) => queries.some((q) => r.id === q || r.name.includes(q) || q.includes(r.name)));
    if (hits.length) {
      console.log(`\n✗ 作成済み：${hits.map((h) => `${h.name}${h.track ? `（${h.track}）` : ''} [${h.where.join(' ')}]`).join('、')}`);
      console.log('  → 作らないでください（別の系統を作る場合も、まず上の PR を確認）。');
      process.exit(1);
    }
    console.log(`\n✓ まだ誰も作っていません：${queries.join('・')}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
