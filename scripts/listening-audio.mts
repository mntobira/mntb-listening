/**
 * ===================================================================
 * リスニング音源の「一覧・検査・取り込み」ツール（1ファイル完結）
 * ===================================================================
 *
 * ■ これは何？
 *   英語リスニング 364 音源（第1問A〜第6問B）を差し替えるための道具。
 *   録り直した音声フォルダを渡すと、ファイル名から「どの問題の音源か」を
 *   自動で判定し、アプリが読む場所（public/listening_*）へ正しい形式で置く。
 *   ★問題データ（src/data/*.ts / *.json）は書き換えない★
 *     アプリはファイル名で音源を探すので、同じ名前で置き換えるだけで切り替わる。
 *
 * ■ 使い方（すべてプロジェクト直下で実行）
 *   npx tsx scripts/listening-audio.mts list   [--chapter el1_A] [--tsv 出力.tsv]
 *   npx tsx scripts/listening-audio.mts check
 *   npx tsx scripts/listening-audio.mts import <フォルダ>            ← 下見だけ（何も変えない）
 *   npx tsx scripts/listening-audio.mts import <フォルダ> --apply \
 *        --provider "MiniMax Speech 2.8 HD" --license "MiniMax Starter 契約中に生成"
 *   npx tsx scripts/listening-audio.mts status
 *   npx tsx scripts/listening-audio.mts restore <バックアップフォルダ>
 *   npx tsx scripts/listening-audio.mts use-legacy <stem | chapterId | all>   ← 旧音源に戻す
 *   npx tsx scripts/listening-audio.mts receive <受領ファイル…> --batch <名前> [--apply] [--note "…"]
 *        ← 送られてきた原本（まとめ録りも可）をそのまま commercial/<batch>/receipt/ に受領記録つきで保存
 *   npx tsx scripts/listening-audio.mts purge-legacy <stem | chapterId> [--apply]
 *        ← 差し替え済みの問題の旧音源コピー（audio_sources/legacy）を削除（利用者の指示があるときだけ）
 *
 *   --discard-legacy  import 時に旧音源を legacy/ へ保存しない（旧音源を捨てる指示があるとき）
 *
 *   --batch <名前>  新音源の元ファイルの保存フォルダ名（audio_sources/commercial/<名前>/）
 *   --note  <文>    台帳に残す品質メモ
 *
 *   詳しい手順は docs/LISTENING_AUDIO_REPLACE.md。
 *
 * ■ 受け付ける音声の形（2通り。混在してよい）
 *   (A) 完成ファイル：ファイル名 = アプリのファイル名（拡張子は mp3/wav/flac/m4a/ogg 可）
 *         例）el1A_set1_q1.wav → public/listening_audio/el1A_set1_q1.mp3
 *   (B) 発話ごとのファイル：フォルダ名 = アプリのファイル名（拡張子なし）、
 *       中身 = 001.flac, 002.flac … （話す順）
 *         例）segments/el2/el2_set1_q1/001.flac, 002.flac, 003.flac, 004.flac
 *       → 順番に無音をはさんで 1 本に結合して置く。
 *       発話数が問題データの turns の数と違うときは取り込まない（取り違え防止）。
 *
 * ■ 安全のためのルール
 *   - --apply を付けない限り、1バイトも書き換えない（下見の表を出すだけ）。
 *   - ★旧音源と新音源は分けて恒久保存する★（git 管理・アプリの配布物には入らない）
 *       audio_sources/legacy/      旧音源（初回差し替え時に1回だけ保存）→ use-legacy で戻せる
 *       audio_sources/commercial/  新音源の元ファイル（FLAC 等）
 *     さらに作業ごとの一時退避を .tmpwork/audio-backup/<日時>/ に置く（restore 用）。
 *   - どの問題にも当てはまらないファイルは無視して一覧に「対象外」と出す。
 *   - 第4〜6問は音声の長さで制限時間を計算しているので、
 *     取り込み後に src/data/listeningSets/listening-q4-6-durations.json を自動更新する。
 *   - 取り込んだ音源の生成元・商用条件は scripts/data/listening_audio_ledger.json
 *     （音源台帳）に記録する。商用公開できるかの判断はこの台帳で管理する。
 *
 * ■ 必要なもの
 *   ffmpeg / ffprobe（サンドボックスには入っている）。
 */

import {existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, copyFileSync} from 'node:fs';
import {basename, dirname, extname, join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {getAllListeningChapters} from '../src/data/englishListeningData';

// ------------------------------------------------------------------
// 定数（ここを変えると全体の挙動が変わる）
// ------------------------------------------------------------------

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = join(ROOT, 'public');
const LEDGER_PATH = join(ROOT, 'scripts/data/listening_audio_ledger.json');
const DURATIONS_PATH = join(ROOT, 'src/data/listeningSets/listening-q4-6-durations.json');
const BACKUP_ROOT = join(ROOT, '.tmpwork/audio-backup');
/**
 * ★旧音源と新音源を分けて恒久保存する場所（git 管理・アプリには入らない）★
 *   audio_sources/legacy/      … 差し替え前の旧音源（商用権未確認）。初めて差し替えるときに1回だけ保存。
 *   audio_sources/commercial/  … 新音源の元ファイル（FLAC 等の高音質マスター）と受領記録。
 *   public/listening_* /       … アプリが実際に鳴らす音（常に1種類だけ）。
 * .tmpwork/audio-backup は作業ごとの一時退避（git 管理外で消えうる）なので、恒久保存は audio_sources 側。
 * public/ の外に置くのは、ビルド（dist）に旧音源を混ぜて配布しないため。
 */
const SOURCES_ROOT = join(ROOT, 'audio_sources');
const LEGACY_ROOT = join(SOURCES_ROOT, 'legacy');
const COMMERCIAL_ROOT = join(SOURCES_ROOT, 'commercial');

/** 取り込める音声の拡張子 */
const AUDIO_EXTS = new Set(['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac']);

/**
 * アプリに置く最終形式。既存の音源（44.1kHz・モノラル・128kbps MP3）に合わせる。
 * 形式をそろえる理由：ブラウザ（特に iPhone Safari）で確実に再生でき、
 * 容量も 364 本で約 190MB に収まるため。
 */
const FFMPEG_OUTPUT_ARGS = ['-ar', '44100', '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '128k'];

/**
 * 発話ファイルを結合するときの「発話と発話のあいだの無音（秒）」。
 *   - el4_B（4人が順に話す）  … 1.2 秒（旧 scripts/concat_listening_audio.sh と同じ）
 *   - 第5問 問32（A→B）       … 0.6 秒（同上）
 *   - それ以外の対話           … 0.35 秒（自然な会話の間）
 * --gap 0.5 のように指定すると全部その値になる。
 */
function defaultGapSec(chapterId: string, stem: string): number {
  if (chapterId === 'el4_B') return 1.2;
  if (/_q32$/.test(stem)) return 0.6;
  return 0.35;
}

// ------------------------------------------------------------------
// 型
// ------------------------------------------------------------------

/** アプリが必要とする音源 1 本ぶんの情報（問題データから自動で作る） */
type Track = {
  stem: string;          // 拡張子なしのファイル名。取り込み時の照合キー（例：el1A_set1_q1）
  audioUrl: string;      // アプリが読むパス（例：/listening_audio/el1A_set1_q1.mp3）
  file: string;          // 実ファイルの絶対パス
  chapterId: string;     // 例：el1_A
  chapterTitle: string;  // 例：第1問 A
  problemId: string;     // 例：q_el1_A_set1
  subId: string;         // 例：q_el1_A_set1_1
  label: string;         // 例：問1
  hint: string;          // 場面メモ（読まない）
  speakers: string[];    // 話す順に出てくる話者（重複なし）
  turnCount: number;     // 発話数（(B) 発話ファイルの枚数チェックに使う）
  script: string;        // 読み上げ本文
};

/** 音源台帳 1 行（scripts/data/listening_audio_ledger.json） */
type LedgerEntry = {
  audioUrl: string;
  /** legacy_unverified = 旧音源（商用権未確認） / replaced = 新しい音源に差し替え済み */
  status: 'legacy_unverified' | 'replaced';
  provider: string;       // 生成したサービス・モデル名
  license: string;        // 商用利用の根拠（契約プラン名など）
  importedAt: string;     // 取り込み日時（ISO）
  sourceFile: string;     // 取り込み元（フォルダからの相対パス）
  sha256: string;         // 置いた mp3 のハッシュ
  durationSec: number;
  /** 旧音源の保存先（audio_sources/legacy/…）。差し替え済みの行だけ */
  legacyCopy?: string;
  /** 新音源の元ファイルの保存先（audio_sources/commercial/…）。差し替え済みの行だけ */
  masterFiles?: string[];
  /** 品質確認のメモ（例：ASR で a/the の聞き分け要確認） */
  note?: string;
  /** 旧音源を利用者の指示で削除した日時（ISO）。削除後は use-legacy で戻せない */
  legacyDiscardedAt?: string;
};

/**
 * ★商用音源と旧音源を混ぜないための番人★
 * 旧音源（legacy_unverified の public ファイル・audio_sources/legacy の保存物）と同じ中身のファイルを
 * 「新音源」として取り込もうとしたら止める。取り違え・旧音源の再混入を防ぐ。
 * ハッシュはデコード前のファイルそのものを比べる（旧音源をコピーしただけのファイルを確実に弾く）。
 */
function legacyHashes(tracks: Track[], ledger: Record<string, LedgerEntry>): Map<string, string> {
  const out = new Map<string, string>();
  for (const t of tracks) {
    if (ledger[t.audioUrl]?.status !== 'replaced' && existsSync(t.file)) out.set(sha256(t.file), 'public' + t.audioUrl);
    const legacy = join(LEGACY_ROOT, t.audioUrl);
    if (existsSync(legacy)) out.set(sha256(legacy), relative(ROOT, legacy));
  }
  return out;
}

// ------------------------------------------------------------------
// 問題データから「必要な音源の一覧」を作る
// ------------------------------------------------------------------

function loadTracks(): Track[] {
  const tracks: Track[] = [];
  for (const chapter of getAllListeningChapters()) {
    for (const problem of chapter.practiceProblems as any[]) {
      for (const t of problem.audioTracks ?? []) {
        if (!t.audioUrl) continue; // 音源なし（ブラウザ読み上げ）の問題は対象外
        const turns: {who: string; text: string}[] = t.turns?.length ? t.turns : [{who: 'solo', text: t.script}];
        tracks.push({
          stem: basename(t.audioUrl, '.mp3'),
          audioUrl: t.audioUrl,
          file: join(PUBLIC_DIR, t.audioUrl),
          chapterId: chapter.id,
          chapterTitle: (chapter as any).abstractTitle ?? chapter.id,
          problemId: problem.id,
          subId: t.subId,
          label: t.label,
          hint: t.hint ?? '',
          speakers: [...new Set(turns.map(x => x.who))],
          turnCount: turns.length,
          script: t.script,
        });
      }
    }
  }
  // ファイル名（stem）で照合するので、重複していたら危険。ここで止める。
  const seen = new Set<string>();
  for (const t of tracks) {
    if (seen.has(t.stem)) throw new Error(`ファイル名が重複しています: ${t.stem}`);
    seen.add(t.stem);
  }
  return tracks;
}

// ------------------------------------------------------------------
// 小さな道具
// ------------------------------------------------------------------

const sha256 = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex');

/** ffprobe で長さ（秒）を取る。壊れたファイルなら null */
function probeDuration(file: string): number | null {
  try {
    const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], {encoding: 'utf8'}).trim();
    const sec = Number(out);
    return Number.isFinite(sec) && sec > 0 ? sec : null;
  } catch {
    return null;
  }
}

function readLedger(): Record<string, LedgerEntry> {
  if (!existsSync(LEDGER_PATH)) return {};
  const rows = JSON.parse(readFileSync(LEDGER_PATH, 'utf8')) as LedgerEntry[];
  return Object.fromEntries(rows.map(r => [r.audioUrl, r]));
}

function writeLedger(tracks: Track[], ledger: Record<string, LedgerEntry>): void {
  // 問題データの順番で保存する（差分が読みやすいように）
  const rows = tracks.map(t => ledger[t.audioUrl] ?? legacyEntry(t));
  writeFileSync(LEDGER_PATH, JSON.stringify(rows, null, 1) + '\n');
}

function legacyEntry(t: Track): LedgerEntry {
  return {audioUrl: t.audioUrl, status: 'legacy_unverified', provider: '', license: '', importedAt: '', sourceFile: '', sha256: '', durationSec: 0};
}

/** 第4〜6問の長さ JSON を作り直す（制限時間の計算に使われる） */
function refreshDurations(): number {
  const data: Record<string, number> = {};
  for (const dir of ['listening_q4', 'listening_q5', 'listening_q6']) {
    for (const f of readdirSync(join(PUBLIC_DIR, dir)).filter(n => n.endsWith('.mp3')).sort()) {
      const sec = probeDuration(join(PUBLIC_DIR, dir, f));
      if (sec) data[f] = Math.round(sec * 10) / 10;
    }
  }
  // 旧 Python 版（json.dump, indent=1）と同じ見た目で書く：数値は常に小数1桁（26.0 など）。
  // こうしないと、変わっていないファイルまで差分に出てしまう。
  const keys = Object.keys(data).sort();
  const body = keys.map(k => ` ${JSON.stringify(k)}: ${data[k].toFixed(1)}`).join(',\n');
  writeFileSync(DURATIONS_PATH, `{\n${body}\n}`);
  return keys.length;
}

/** フォルダ以下を再帰的に全部見る */
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || name === '__MACOSX') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(p, ...walk(p));
    else out.push(p);
  }
  return out;
}

function argValue(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

// ------------------------------------------------------------------
// list：必要な音源の一覧
// ------------------------------------------------------------------

function cmdList(args: string[]): void {
  const tracks = loadTracks();
  const ledger = readLedger();
  const only = argValue(args, '--chapter');
  const rows = tracks.filter(t => !only || t.chapterId === only);
  const header = ['chapterId', '大問', '問', 'ファイル名(stem)', '置き場所', '発話数', '話者', 'ファイル有無', '台帳', '場面メモ'];
  const lines = rows.map(t => [
    t.chapterId, t.chapterTitle, t.label, t.stem, 'public' + t.audioUrl, String(t.turnCount),
    t.speakers.join('/'), existsSync(t.file) ? 'あり' : 'なし', ledger[t.audioUrl]?.status ?? 'legacy_unverified', t.hint,
  ].join('\t'));
  const tsv = [header.join('\t'), ...lines].join('\n') + '\n';
  const out = argValue(args, '--tsv');
  if (out) {
    writeFileSync(resolve(out), tsv);
    console.log(`${rows.length} 件を ${out} に書き出しました。`);
  } else {
    process.stdout.write(tsv);
  }
}

// ------------------------------------------------------------------
// check：全音源が揃っていて再生できるか
// ------------------------------------------------------------------

function cmdCheck(): void {
  const tracks = loadTracks();
  const problems: string[] = [];
  const secOf = new Map<string, number | null>(); // ffprobe は遅いので 1 ファイル 1 回だけ
  for (const t of tracks) {
    if (!existsSync(t.file)) { problems.push(`ファイルがない: public${t.audioUrl}`); continue; }
    const sec = probeDuration(t.file);
    secOf.set(t.file, sec);
    if (!sec) problems.push(`再生できない（壊れている）: public${t.audioUrl}`);
    else if (sec < 0.8) problems.push(`短すぎる（${sec.toFixed(2)}秒）: public${t.audioUrl}`);
  }
  // 長さ JSON が実ファイルと合っているか（ずれると第4〜6問の制限時間が狂う）
  const durations = JSON.parse(readFileSync(DURATIONS_PATH, 'utf8')) as Record<string, number>;
  for (const t of tracks.filter(x => /listening_q[456]/.test(x.audioUrl))) {
    const recorded = durations[basename(t.file)];
    const sec = secOf.get(t.file) ?? null;
    if (sec && (recorded === undefined || Math.abs(recorded - sec) > 0.2)) {
      problems.push(`長さJSONが古い: ${basename(t.file)}（記録 ${recorded ?? 'なし'} / 実際 ${sec.toFixed(1)}）→ import --apply で自動更新、または refresh-durations`);
    }
  }
  const ledger = readLedger();
  // 差し替え済みの音が、あとから旧音源などで上書きされていないか（商用音源と旧音源の混在防止）
  for (const t of tracks) {
    const e = ledger[t.audioUrl];
    if (e?.status !== 'replaced' || !existsSync(t.file)) continue;
    if (sha256(t.file) !== e.sha256) problems.push(`差し替え済みなのに中身が台帳と違う（旧音源などで上書きされた可能性）: public${t.audioUrl}`);
    for (const m of e.masterFiles ?? []) if (!existsSync(join(ROOT, m))) problems.push(`新音源の元ファイルがない: ${m}`);
  }
  const replaced = tracks.filter(t => ledger[t.audioUrl]?.status === 'replaced').length;
  console.log(`音源 ${tracks.length} 本を検査しました。差し替え済み ${replaced} 本 / 旧音源 ${tracks.length - replaced} 本。`);
  if (problems.length) {
    console.log(`\n問題 ${problems.length} 件:`);
    for (const p of problems) console.log('  - ' + p);
    process.exitCode = 1;
  } else {
    console.log('問題なし（全ファイルあり・再生可能・長さJSON一致）。');
  }
}

// ------------------------------------------------------------------
// import：録り直した音源を取り込む
// ------------------------------------------------------------------

type Plan = {track: Track; kind: 'file' | 'segments'; inputs: string[]; note: string};

function cmdImport(args: string[]): void {
  const valued = new Set(['--provider', '--license', '--gap', '--batch', '--note'].map(k => argValue(args, k)).filter(Boolean));
  const src = args.find(a => !a.startsWith('--') && !valued.has(a));
  if (!src || !existsSync(src)) throw new Error('取り込むフォルダを指定してください: import <フォルダ>');
  const apply = args.includes('--apply');
  const discardLegacy = args.includes('--discard-legacy');
  const normalize = args.includes('--normalize');
  const gapOverride = argValue(args, '--gap');
  const provider = argValue(args, '--provider') ?? '';
  const license = argValue(args, '--license') ?? '';
  const note = argValue(args, '--note') ?? '';
  // 元ファイルを保存するフォルダ名（例：elevenlabs_2026-09-19_q1a-set1）。省略時は日付
  const batch = (argValue(args, '--batch') ?? `import_${new Date().toISOString().slice(0, 10)}`).replace(/[^A-Za-z0-9_.-]/g, '_');
  if (apply && (!provider || !license)) {
    throw new Error('--apply のときは --provider（生成サービス名）と --license（商用利用の根拠）が必須です。台帳に記録するためです。');
  }

  const tracks = loadTracks();
  const byStem = new Map(tracks.map(t => [t.stem, t]));
  const srcRoot = resolve(src);
  const all = walk(srcRoot);
  const plans = new Map<string, Plan>();
  const ignored: string[] = [];
  const errors: string[] = [];

  // (B) 発話フォルダ：フォルダ名が stem、中身が 001.xxx, 002.xxx …
  for (const p of all.filter(x => statSync(x).isDirectory())) {
    const track = byStem.get(basename(p));
    if (!track) continue;
    const segs = readdirSync(p).filter(n => /^\d{3}\.[A-Za-z0-9]+$/.test(n) && AUDIO_EXTS.has(extname(n).toLowerCase())).sort();
    if (!segs.length) continue;
    if (segs.length !== track.turnCount) {
      errors.push(`${track.stem}: 発話ファイルが ${segs.length} 個ですが、台本の発話数は ${track.turnCount} です（取り込みません）`);
      continue;
    }
    plans.set(track.stem, {track, kind: 'segments', inputs: segs.map(n => join(p, n)), note: `${segs.length}発話を結合`});
  }

  // (A) 完成ファイル：ファイル名が stem
  for (const p of all.filter(x => statSync(x).isFile())) {
    const ext = extname(p).toLowerCase();
    if (!AUDIO_EXTS.has(ext)) continue;
    if (/^\d{3}$/.test(basename(p, extname(p)))) continue; // 発話ファイルは上で処理済み
    const track = byStem.get(basename(p, extname(p)));
    if (!track) { ignored.push(relative(srcRoot, p)); continue; }
    if (plans.has(track.stem)) {
      errors.push(`${track.stem}: 完成ファイルと発話フォルダの両方があります。どちらか一方にしてください`);
      plans.delete(track.stem);
      continue;
    }
    plans.set(track.stem, {track, kind: 'file', inputs: [p], note: '完成ファイル'});
  }

  // 旧音源の混入チェック（新音源として旧音源そのものを渡していないか）
  const oldHashes = legacyHashes(tracks, readLedger());
  for (const [stem, plan] of [...plans]) {
    const hit = plan.inputs.map(f => oldHashes.get(sha256(f))).find(Boolean);
    if (hit) {
      errors.push(`${stem}: 中身が旧音源（${hit}）と同じです。商用の新音源と混ぜないため取り込みません`);
      plans.delete(stem);
    }
  }

  // 下見の表
  console.log(`取り込み元: ${srcRoot}`);
  console.log(`対象になる音源: ${plans.size} 本 / 全 ${tracks.length} 本\n`);
  for (const plan of [...plans.values()].sort((a, b) => tracks.indexOf(a.track) - tracks.indexOf(b.track))) {
    console.log(`  ${plan.track.chapterTitle}\t${plan.track.label}\t${plan.track.stem}\t← ${plan.note}（${relative(srcRoot, plan.inputs[0])}${plan.inputs.length > 1 ? ' ほか' : ''}）`);
  }
  if (ignored.length) {
    console.log(`\n対象外（ファイル名がどの問題にも一致しない）: ${ignored.length} 件`);
    for (const f of ignored.slice(0, 20)) console.log('  - ' + f);
    if (ignored.length > 20) console.log(`  …ほか ${ignored.length - 20} 件`);
  }
  if (errors.length) {
    console.log(`\n取り込めないもの: ${errors.length} 件`);
    for (const e of errors) console.log('  - ' + e);
  }
  if (!apply) {
    console.log('\n※ 下見のみです。何も変更していません。問題なければ --apply --provider "…" --license "…" を付けて再実行。');
    return;
  }
  if (!plans.size) { console.log('\n取り込む音源がありません。'); return; }

  // ここから実際に書き換える
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = join(BACKUP_ROOT, stamp);
  const work = join(tmpdir(), `listening-audio-${stamp}`);
  mkdirSync(work, {recursive: true});
  const ledger = readLedger();
  let done = 0;
  for (const plan of plans.values()) {
    const {track} = plan;
    const tmpOut = join(work, track.stem + '.mp3');
    try {
      encode(plan, tmpOut, gapOverride ? Number(gapOverride) : defaultGapSec(track.chapterId, track.stem), normalize);
      const sec = probeDuration(tmpOut);
      if (!sec) throw new Error('変換後のファイルが再生できません');
      const prev = ledger[track.audioUrl];
      // (1) 旧音源の恒久保存：まだ旧音源のまま（台帳が replaced でない）なら audio_sources/legacy へ1回だけ保存。
      //     すでに保存済みなら上書きしない（2回目以降の差し替えで新音源を「旧」扱いしないため）。
      const legacyPath = join(LEGACY_ROOT, track.audioUrl);
      if (!discardLegacy && existsSync(track.file) && prev?.status !== 'replaced' && !existsSync(legacyPath)) {
        mkdirSync(dirname(legacyPath), {recursive: true});
        copyFileSync(track.file, legacyPath);
      }
      // (2) 作業ごとの一時退避（restore 用）
      if (existsSync(track.file)) {
        const b = join(backupDir, track.audioUrl);
        mkdirSync(dirname(b), {recursive: true});
        copyFileSync(track.file, b);
      }
      // (3) 新音源の元ファイル（高音質マスター）を audio_sources/commercial/<batch>/ に保存
      const masterDir = join(COMMERCIAL_ROOT, batch, dirname(track.audioUrl.slice(1)));
      mkdirSync(masterDir, {recursive: true});
      const masterFiles = plan.inputs.map((f, i) => {
        const name = plan.kind === 'file' ? track.stem + extname(f).toLowerCase() : `${track.stem}__${String(i + 1).padStart(3, '0')}${extname(f).toLowerCase()}`;
        const dest = join(masterDir, name);
        copyFileSync(f, dest);
        return relative(ROOT, dest);
      });
      // (4) アプリが鳴らす音を置き換える
      mkdirSync(dirname(track.file), {recursive: true});
      copyFileSync(tmpOut, track.file);
      ledger[track.audioUrl] = {
        audioUrl: track.audioUrl, status: 'replaced', provider, license,
        importedAt: new Date().toISOString(), sourceFile: relative(srcRoot, plan.inputs[0]),
        sha256: sha256(track.file), durationSec: Math.round(sec * 100) / 100,
        legacyCopy: existsSync(legacyPath) ? relative(ROOT, legacyPath) : undefined,
        masterFiles, ...(note ? {note} : {}),
        ...(discardLegacy && !existsSync(legacyPath) ? {legacyDiscardedAt: new Date().toISOString()} : prev?.legacyDiscardedAt ? {legacyDiscardedAt: prev.legacyDiscardedAt} : {}),
      };
      done++;
    } catch (e) {
      console.log(`  × ${track.stem}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  writeLedger(tracks, ledger);
  const n = refreshDurations();
  console.log(`\n${done} 本を取り込みました。`);
  console.log(`旧ファイルの退避先: ${relative(ROOT, backupDir)}（戻す: npx tsx scripts/listening-audio.mts restore ${relative(ROOT, backupDir)}）`);
  console.log(`旧音源の恒久保存: audio_sources/legacy/ ／ 新音源の元ファイル: audio_sources/commercial/${batch}/`);
  console.log(`台帳を更新: ${relative(ROOT, LEDGER_PATH)} / 長さJSONを更新: ${n} 件`);
  console.log('次に: npx tsx scripts/listening-audio.mts check  → アプリで数本を試聴 → commit');
}

/** 1 本ぶんを ffmpeg で最終形式の mp3 にする */
function encode(plan: Plan, out: string, gapSec: number, normalize: boolean): void {
  const post = normalize ? ['-af', 'loudnorm=I=-16:TP=-1.5:LRA=11'] : [];
  if (plan.kind === 'file') {
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', plan.inputs[0], ...post, ...FFMPEG_OUTPUT_ARGS, out]);
    return;
  }
  // 発話を順に並べ、最後以外の後ろに無音を足して結合する。
  // aformat でサンプルレート・チャンネルをそろえてから concat する（形式が混ざっても壊れないように）。
  const inputs = plan.inputs.flatMap(f => ['-i', f]);
  const n = plan.inputs.length;
  const parts = plan.inputs.map((_, i) => {
    const pad = i < n - 1 ? `,apad=pad_dur=${gapSec}` : '';
    return `[${i}:a]aformat=sample_rates=44100:channel_layouts=mono${pad}[a${i}]`;
  });
  const concat = `${plan.inputs.map((_, i) => `[a${i}]`).join('')}concat=n=${n}:v=0:a=1${normalize ? ',loudnorm=I=-16:TP=-1.5:LRA=11' : ''}[out]`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', [...parts, concat].join(';'), '-map', '[out]', ...FFMPEG_OUTPUT_ARGS, out]);
}

// ------------------------------------------------------------------
// status：台帳の集計（商用公開できる状態かの確認）
// ------------------------------------------------------------------

function cmdStatus(): void {
  const tracks = loadTracks();
  const ledger = readLedger();
  const byChapter = new Map<string, {title: string; total: number; replaced: number}>();
  for (const t of tracks) {
    const row = byChapter.get(t.chapterId) ?? {title: t.chapterTitle, total: 0, replaced: 0};
    row.total++;
    if (ledger[t.audioUrl]?.status === 'replaced') row.replaced++;
    byChapter.set(t.chapterId, row);
  }
  console.log('大問\t差し替え済み / 全体');
  for (const [id, r] of byChapter) console.log(`${r.title}（${id}）\t${r.replaced} / ${r.total}${r.replaced === r.total ? '  ✓完了' : ''}`);
  const replaced = tracks.filter(t => ledger[t.audioUrl]?.status === 'replaced').length;
  console.log(`\n合計 ${replaced} / ${tracks.length}。${replaced === tracks.length ? '全音源が差し替え済みです。' : '旧音源（商用権未確認）が残っています。公開前に全部差し替えてください。'}`);
  const providers = new Map<string, number>();
  for (const t of tracks) { const e = ledger[t.audioUrl]; if (e?.status === 'replaced') providers.set(`${e.provider} / ${e.license}`, (providers.get(`${e.provider} / ${e.license}`) ?? 0) + 1); }
  for (const [k, v] of providers) console.log(`  生成元: ${k} … ${v} 本`);
  const legacySaved = tracks.filter(t => existsSync(join(LEGACY_ROOT, t.audioUrl))).length;
  console.log(`旧音源の恒久保存（audio_sources/legacy）: ${legacySaved} 本`);
}

// ------------------------------------------------------------------
// restore：バックアップから戻す
// ------------------------------------------------------------------

function cmdRestore(args: string[]): void {
  const dir = args[0];
  if (!dir || !existsSync(dir)) throw new Error('バックアップフォルダを指定してください（.tmpwork/audio-backup/<日時>）');
  const tracks = loadTracks();
  const byUrl = new Map(tracks.map(t => [t.audioUrl, t]));
  const ledger = readLedger();
  let n = 0;
  for (const f of walk(resolve(dir)).filter(p => p.endsWith('.mp3'))) {
    const url = '/' + relative(resolve(dir), f).split('\\').join('/');
    const t = byUrl.get(url);
    if (!t) continue;
    copyFileSync(f, t.file);
    delete ledger[url]; // 旧音源に戻ったので台帳も「未確認」に戻す
    n++;
  }
  writeLedger(tracks, ledger);
  refreshDurations();
  console.log(`${n} 本を戻しました（台帳は legacy_unverified に戻しています。以前の差し替えに戻す場合は再 import してください）。`);
}

// ------------------------------------------------------------------
// use-legacy：audio_sources/legacy に保存した旧音源へ戻す（新音源の元ファイルは残る）
// ------------------------------------------------------------------

function cmdUseLegacy(args: string[]): void {
  const target = args[0];
  if (!target) throw new Error('use-legacy <ファイル名(stem) | chapterId | all> を指定してください');
  const tracks = loadTracks();
  const ledger = readLedger();
  const picked = tracks.filter(t => target === 'all' || t.stem === target || t.chapterId === target);
  let n = 0;
  for (const t of picked) {
    const legacy = join(LEGACY_ROOT, t.audioUrl);
    if (!existsSync(legacy)) continue;
    copyFileSync(legacy, t.file);
    delete ledger[t.audioUrl];
    n++;
  }
  writeLedger(tracks, ledger);
  refreshDurations();
  console.log(`${n} 本を旧音源に戻しました（新音源の元ファイルは audio_sources/commercial/ に残っています。再度使うときは import し直す）。`);
}

// ------------------------------------------------------------------
// receive：送られてきた原本を「商用の受領物」としてそのまま保存する（切り出し前の第一歩）
//   まとめ録り（1ファイルに何問も入っている）でもよい。ここでは切らない・変換しない。
//   旧音源と同じ中身なら受け付けない。
// ------------------------------------------------------------------

function cmdReceive(args: string[]): void {
  const valued = new Set(['--batch', '--note', '--provider', '--license'].map(k => argValue(args, k)).filter(Boolean));
  const files = args.filter(a => !a.startsWith('--') && !valued.has(a));
  const batchArg = argValue(args, '--batch');
  if (!files.length || !batchArg) throw new Error('receive <受領ファイル…> --batch <名前> を指定してください');
  const batch = batchArg.replace(/[^A-Za-z0-9_.-]/g, '_');
  const apply = args.includes('--apply');
  const tracks = loadTracks();
  const oldHashes = legacyHashes(tracks, readLedger());
  const dir = join(COMMERCIAL_ROOT, batch, 'receipt');
  const rows: Record<string, unknown>[] = [];
  for (const f of files) {
    if (!existsSync(f)) throw new Error(`ファイルがない: ${f}`);
    const hash = sha256(f);
    const old = oldHashes.get(hash);
    if (old) { console.log(`  × ${basename(f)}: 旧音源（${old}）と同じ中身。受け付けません`); process.exitCode = 1; continue; }
    rows.push({originalFilename: basename(f), sha256: hash, bytes: statSync(f).size, durationSeconds: probeDuration(f), receivedAtUtc: new Date().toISOString()});
    console.log(`  ✓ ${basename(f)}  ${(probeDuration(f) ?? 0).toFixed(2)}秒  sha256 ${hash.slice(0, 12)}…`);
  }
  if (!apply) { console.log(`\n※ 下見のみ。--apply で ${relative(ROOT, dir)}/ に保存します。`); return; }
  mkdirSync(dir, {recursive: true});
  for (const [i, f] of files.entries()) if (rows.find(r => r.originalFilename === basename(f))) copyFileSync(f, join(dir, basename(f)));
  const receiptPath = join(dir, 'receipt.json');
  const prev = existsSync(receiptPath) ? JSON.parse(readFileSync(receiptPath, 'utf8')) : {};
  writeFileSync(receiptPath, JSON.stringify({
    ...prev, batch, kind: 'commercial', provider: argValue(args, '--provider') ?? prev.provider ?? '',
    license: argValue(args, '--license') ?? prev.license ?? '', note: argValue(args, '--note') ?? prev.note ?? '',
    files: [...(prev.files ?? []).filter((p: any) => !rows.some(r => r.sha256 === p.sha256)), ...rows],
  }, null, 2) + '\n');
  console.log(`\n${rows.length} 件を ${relative(ROOT, dir)}/ に保存しました。次に：切り出し（scripts/listening-split.py）→ import --batch ${batch}`);
}

// ------------------------------------------------------------------
// purge-legacy：旧音源の保存コピーを消す（差し替え済みの問題だけ。利用者の指示があるときに使う）
// ------------------------------------------------------------------

function cmdPurgeLegacy(args: string[]): void {
  const target = args.find(a => !a.startsWith('--'));
  if (!target) throw new Error('purge-legacy <stem | chapterId> を指定してください');
  const apply = args.includes('--apply');
  const tracks = loadTracks();
  const ledger = readLedger();
  const picked = tracks.filter(t => t.stem === target || t.chapterId === target);
  let n = 0;
  for (const t of picked) {
    const e = ledger[t.audioUrl];
    if (e?.status !== 'replaced') { if (picked.length === 1) console.log(`  - ${t.stem}: まだ差し替えていないので消しません`); continue; }
    const legacy = join(LEGACY_ROOT, t.audioUrl);
    if (!existsSync(legacy)) continue;
    if (apply) {
      rmSync(legacy);
      ledger[t.audioUrl] = {...e, legacyCopy: undefined, legacyDiscardedAt: new Date().toISOString()};
    }
    n++;
  }
  if (apply) { writeLedger(tracks, ledger); console.log(`${n} 本の旧音源コピーを削除しました（use-legacy では戻せなくなります）。`); }
  else console.log(`${n} 本が削除対象です。--apply で削除します。`);
}

// ------------------------------------------------------------------
// 入口
// ------------------------------------------------------------------

const [cmd, ...rest] = process.argv.slice(2);
process.chdir(ROOT);
switch (cmd) {
  case 'list': cmdList(rest); break;
  case 'check': cmdCheck(); break;
  case 'import': cmdImport(rest); break;
  case 'status': cmdStatus(); break;
  case 'restore': cmdRestore(rest); break;
  case 'use-legacy': cmdUseLegacy(rest); break;
  case 'receive': cmdReceive(rest); break;
  case 'purge-legacy': cmdPurgeLegacy(rest); break;
  case 'refresh-durations': console.log(`長さJSONを更新: ${refreshDurations()} 件`); break;
  case 'init-ledger': {
    // 台帳が無いときに、全音源を「旧音源（未確認）」として作る。既存の行は保持する。
    const tracks = loadTracks();
    writeLedger(tracks, readLedger());
    console.log(`台帳を作成/補完しました: ${tracks.length} 行`);
    break;
  }
  default:
    console.log('使い方: npx tsx scripts/listening-audio.mts <list|check|import|status|restore|use-legacy|refresh-durations|init-ledger>');
    console.log('詳しくは docs/LISTENING_AUDIO_REPLACE.md');
    process.exitCode = cmd ? 1 : 0;
}
