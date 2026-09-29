#!/usr/bin/env node
/**
 * 旧音源（Kokoro 等・商用根拠なし）を一掃して、残っていないことを確かめる（2026-09-29）
 *
 *   node scripts/purge-legacy-listening-audio.mjs           ← 下見（何も消さない）
 *   node scripts/purge-legacy-listening-audio.mjs --apply   ← 消す
 *
 * ■ 何をするか
 *   1. 台帳（listening_audio_ledger.json）に載っている 374 本の配信音源を、sha256 で全部照合する。
 *      1本でも違えば（＝旧音源で上書きされている）止める。
 *   2. public/listening_audio・listening_q4・listening_q5・listening_q6 の中で、
 *      台帳に載っていない音声ファイルを「旧音源」として一覧に出し、--apply で消す。
 *   3. audio_sources/legacy/（旧音源の保存コピー）を丸ごと消す。
 *   4. 旧音源を作ったときの道具・一時ファイル（Kokoro のモデル・生成物）が残っていないか調べる。
 * ■ 消さないもの
 *   効果音（public/sfx）・アプリBGM（cobblestone_dreams.mp3 / tanjou.mp3）・商用音源の原本（audio_sources/commercial）。
 * ■ git の履歴に残った旧音源
 *   このスクリプトは作業ツリーだけを掃除する。過去のコミットに旧音源が入っている場合、
 *   公開リポジトリなら履歴からも消す必要がある（最後に表示する手順を参照）。
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { execFileSync } from 'node:child_process';

const apply = process.argv.includes('--apply');
const root = process.cwd();
const ledgerPath = ['listening_audio_ledger.json', 'scripts/data/listening_audio_ledger.json'].map(p => join(root, p)).find(existsSync);
if (!ledgerPath) { console.error('台帳 listening_audio_ledger.json が見つかりません。プロジェクト直下で実行してください。'); process.exit(2); }
const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
const sha = f => createHash('sha256').update(readFileSync(f)).digest('hex');
const AUDIO = /\.(mp3|wav|flac|m4a|ogg|aac|opus)$/i;
const walk = d => !existsSync(d) ? [] : readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);

let problems = 0;
// 1. 台帳の照合
const urls = new Set();
for (const r of ledger) {
  urls.add(r.audioUrl);
  const f = join(root, 'public', r.audioUrl);
  if (r.status !== 'replaced') { console.error(`✗ 台帳で商用音源になっていない: ${r.audioUrl}（${r.status}）`); problems++; continue; }
  if (!existsSync(f)) { console.error(`✗ 配信音源が無い: ${r.audioUrl}`); problems++; continue; }
  if (sha(f) !== r.sha256) { console.error(`✗ 台帳と中身が違う（旧音源で上書き？）: ${r.audioUrl}`); problems++; }
}
console.log(`台帳 ${ledger.length} 本を照合。${problems ? problems + ' 件の問題' : '全部一致（商用音源）'}`);

// 2. 台帳外の音声（＝旧音源の残り）
const dirs = ['listening_audio', 'listening_q4', 'listening_q5', 'listening_q6'].map(d => join(root, 'public', d));
const strays = dirs.flatMap(walk).filter(f => AUDIO.test(f)).filter(f => !urls.has('/' + relative(join(root, 'public'), f).split(sep).join('/')));
// 3. 旧音源の保存コピー
const legacyDir = join(root, 'audio_sources/legacy');
const legacyFiles = walk(legacyDir);
// 4. 旧音源の生成物・モデル
const kokoro = ['.tmpwork/kokoro', 'kokoro', 'public/kokoro', 'audio_sources/kokoro'].map(p => join(root, p)).filter(existsSync);

console.log(`台帳外の音声（旧音源の残り）: ${strays.length} 本`);
strays.slice(0, 30).forEach(f => console.log('  - ' + relative(root, f)));
if (strays.length > 30) console.log(`  …ほか ${strays.length - 30} 本`);
console.log(`旧音源の保存コピー audio_sources/legacy: ${legacyFiles.length} ファイル`);
console.log(`旧音源の生成物・モデル: ${kokoro.length ? kokoro.map(p => relative(root, p)).join(', ') : 'なし'}`);

if (apply) {
  strays.forEach(f => rmSync(f));
  if (existsSync(legacyDir)) rmSync(legacyDir, { recursive: true, force: true });
  kokoro.forEach(p => rmSync(p, { recursive: true, force: true }));
  console.log(`→ 削除しました（音声 ${strays.length} 本・保存コピー ${legacyFiles.length} ・生成物 ${kokoro.length}）。`);
} else if (strays.length || legacyFiles.length || kokoro.length) {
  console.log('→ 下見のみ。消すには --apply を付けて実行してください。');
}

// git 履歴の確認（作業ツリーを消しても、公開リポジトリの履歴に残っていれば取り出せてしまう）
try {
  const inHistory = execFileSync('git', ['log', '--all', '--diff-filter=A', '--name-only', '--format=', '--', 'audio_sources/legacy', 'public/listening_audio', 'public/listening_q4', 'public/listening_q5', 'public/listening_q6'], { cwd: root, encoding: 'utf8' })
    .split('\n').filter(Boolean);
  const current = new Set(ledger.map(r => 'public' + r.audioUrl));
  const oldPaths = [...new Set(inHistory)].filter(p => p.startsWith('audio_sources/legacy/') || !current.has(p));
  const touched = execFileSync('git', ['log', '--all', '--format=%h', '--', ...[...current].slice(0, 400)], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean).length;
  console.log(`git 履歴：台帳外の音声パス ${oldPaths.length} 件／配信音源を触ったコミット ${touched} 件`);
  if (touched > 1 || oldPaths.length) {
    console.log('  ※ 履歴に旧音源の中身が残っている可能性があります。リポジトリを公開する前に、旧音源を含まない新しいリポジトリ（履歴なし）で出し直すか、');
    console.log('    git filter-repo で履歴から消してください。作業ツリーの掃除だけでは履歴は消えません。');
  }
} catch { /* git が無い環境では省略 */ }

const leftover = apply ? 0 : strays.length + legacyFiles.length + kokoro.length;
if (problems || leftover) { console.error(`✗ 旧音源が残っている／台帳と合わない（${problems + leftover} 件）`); process.exit(1); }
console.log('✓ 旧音源は残っていません。配信音源 374 本はすべて台帳どおりの商用音源です。');
