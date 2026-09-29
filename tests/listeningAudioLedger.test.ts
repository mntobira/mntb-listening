/**
 * リスニング音源台帳の番人テスト（商用音源と旧音源を混ぜないため）
 *
 * - 台帳で replaced（商用の新音源）の public ファイルは、台帳の sha256 と一致すること
 *   （あとから旧音源などで上書きされたら落ちる）
 * - 新音源の元ファイル（audio_sources/commercial/…）が残っていること
 * - 新音源の中身が、旧音源の保存コピー（audio_sources/legacy/…）と同じでないこと
 * - 旧音源の保存コピーは、旧音源のまま（legacy_unverified）の問題にはあってはならない…ではなく、
 *   「差し替え済みの問題の分」しか置かない（legacy は差し替え時にだけ作られる）
 * - 第1問（A・B）は全問が商用の新音源で、旧音源のコピーは利用者の指示で削除済み（2026-09-28）
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(__dirname, '..');
type Row = { audioUrl: string; status: string; sha256: string; masterFiles?: string[]; legacyCopy?: string; legacyDiscardedAt?: string; provider: string; license: string };
const ledger: Row[] = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/data/listening_audio_ledger.json'), 'utf8'));
const sha = (f: string) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const replaced = ledger.filter(r => r.status === 'replaced');

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));
}

describe('リスニング音源台帳（商用音源と旧音源の分離）', () => {
  it('台帳は 374 行で重複なし', () => {
    expect(ledger.length).toBe(374);
    expect(new Set(ledger.map(r => r.audioUrl)).size).toBe(374);
  });

  it('差し替え済みの音は台帳のハッシュと一致し、生成元・商用根拠・元ファイルが記録されている', () => {
    for (const r of replaced) {
      const file = path.join(ROOT, 'public', r.audioUrl);
      expect(fs.existsSync(file), r.audioUrl).toBe(true);
      expect(sha(file), `${r.audioUrl} が台帳と違う（旧音源で上書き？）`).toBe(r.sha256);
      expect(r.provider && r.license, r.audioUrl).toBeTruthy();
      expect(r.masterFiles?.length, r.audioUrl).toBeGreaterThan(0);
      for (const m of r.masterFiles ?? []) {
        expect(m.startsWith('audio_sources/commercial/'), m).toBe(true);
        expect(fs.existsSync(path.join(ROOT, m)), m).toBe(true);
      }
    }
  });

  it('新音源の中身が旧音源コピーと同じではない', () => {
    const legacy = new Set(walk(path.join(ROOT, 'audio_sources/legacy')).filter(f => f.endsWith('.mp3')).map(sha));
    for (const r of replaced) expect(legacy.has(r.sha256), r.audioUrl).toBe(false);
  });

  it('旧音源コピーは差し替え済みの問題の分しかない', () => {
    const replacedUrls = new Set(replaced.map(r => r.audioUrl));
    for (const f of walk(path.join(ROOT, 'audio_sources/legacy')).filter(x => x.endsWith('.mp3'))) {
      const url = '/' + path.relative(path.join(ROOT, 'audio_sources/legacy'), f).split(path.sep).join('/');
      expect(replacedUrls.has(url), url).toBe(true);
    }
  });

  it('第1問 A・B（116本）は全部商用の新音源で、旧音源コピーは削除済み', () => {
    const q1 = ledger.filter(r => /\/el1[AB]_/.test(r.audioUrl));
    expect(q1.length).toBe(116);
    for (const r of q1) {
      expect(r.status, r.audioUrl).toBe('replaced');
      expect(r.legacyCopy, r.audioUrl).toBeUndefined();
      expect(r.legacyDiscardedAt, r.audioUrl).toBeTruthy();
      expect(fs.existsSync(path.join(ROOT, 'audio_sources/legacy', r.audioUrl)), r.audioUrl).toBe(false);
    }
  });

  it('第2問（48本）・第3問（90本）・第4問 A/B（45本）・第6問 A/B（30本）も全部商用の新音源で、旧音源コピーは削除済み', () => {
    const rows = ledger.filter(r => /\/el2_|\/el3_|\/listening_q4\/set\d+_4[AB]|\/listening_q6\/q6set\d+_[AB]/.test(r.audioUrl));
    expect(rows.length).toBe(213);
    for (const r of rows) {
      expect(r.status, r.audioUrl).toBe('replaced');
      expect(r.legacyCopy, r.audioUrl).toBeUndefined();
      expect(r.legacyDiscardedAt, r.audioUrl).toBeTruthy();
    }
  });
});

describe('全音源が商用の新音源（2026-09-29 完了）', () => {
  it('374本すべて replaced。旧音源（legacy_unverified）は1本も残っていない', () => {
    expect(ledger.filter(r => r.status !== 'replaced').map(r => r.audioUrl)).toEqual([]);
  });
  it('第5問45本もすべて旧音源コピーを削除済み', () => {
    const rows = ledger.filter(r => r.audioUrl.startsWith('/listening_q5/'));
    expect(rows.length).toBe(45);
    for (const r of rows) { expect(r.status, r.audioUrl).toBe('replaced'); expect(r.legacyDiscardedAt, r.audioUrl).toBeTruthy(); }
  });
  it('ElevenLabs 有料契約の領収書が同梱されている', () => {
    for (const f of ['README.md', 'elevenlabs_receipt_creator_2026-09-20.png', 'elevenlabs_receipt_starter_2026-09-28.png', 'elevenlabs_receipt_usage_2026-09-29.png'])
      expect(fs.existsSync(path.join(ROOT, 'audio_sources/commercial/license_evidence', f)), f).toBe(true);
  });
});

describe('対戦のリスニング締切と音源の長さ', () => {
  it('対戦に出るリスニング音源は、締切（55秒）までに聞き終えて答える時間（10秒以上）が残る', async () => {
    const { arenaRule } = await import('../src/battle/core/arenaRules');
    const rule = arenaRule({ subject: 'english_listening' } as any);
    const limit = Number((rule as any).timeLimitOverride);
    expect(limit).toBeLessThan(60); // AGENTS.md：締切は60秒未満
    const pool = fs.readFileSync(path.join(ROOT, 'src/battle/data/pool.english_listening.generated.ts'), 'utf8');
    const chapters = new Set([...pool.matchAll(/\["q:(el\w+):/g)].map(m => m[1]));
    const prefix: Record<string, RegExp> = { el1_A: /\/el1A_/, el1_B: /\/el1B_/, el2: /\/el2_/, el3: /\/el3_/ };
    const replacedInPool = replaced.filter(r => [...chapters].some(c => prefix[c]?.test(r.audioUrl)));
    expect(replacedInPool.length).toBeGreaterThan(0);
    for (const r of replacedInPool) {
      const sec = (r as any).durationSec as number;
      expect(sec, `${r.audioUrl} が長すぎて対戦で答える時間が残らない（${sec}秒）`).toBeLessThanOrEqual(limit - 10);
    }
  });
});
