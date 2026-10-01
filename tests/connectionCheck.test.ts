import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { describeFirebaseCode, evaluateConnection, reportText, summarizeConnection, type ProbeInput } from '../src/battle/core/connectionCheck';

const base: ProbeInput = { online: true, inAppBrowser: false, configured: true, signedIn: true, read: { ok: true, ms: 120 }, indexQuery: { ok: true }, clockOffsetMs: 300 };
const st = (p: ProbeInput) => Object.fromEntries(evaluateConnection(p).map(r => [r.id, r.status]));

describe('通信チェック（統合版・リスニング版で共通）', () => {
  it('全部通れば「対戦できます」', () => {
    expect(Object.values(st(base)).every(s => s === 'ok')).toBe(true);
    expect(summarizeConnection(evaluateConnection(base)).tone).toBe('ok');
  });
  it('オフラインなら後ろの項目は確かめない', () => {
    const s = st({ ...base, online: false });
    expect(s.network).toBe('fail'); expect(s.firestore).toBe('skip'); expect(s.index).toBe('skip');
  });
  it('Firebase 未設定（リスニング版の初期状態）は運営側の設定漏れとして出す', () => {
    const r = evaluateConnection({ ...base, configured: false, read: null, indexQuery: null });
    const f = r.find(x => x.id === 'firestore')!;
    expect(f.status).toBe('fail'); expect(f.owner).toBe('operator'); expect(f.fix).toContain('VITE_FIREBASE_');
  });
  it('ルール未反映（permission-denied）は「ルール」の行で止まり、deploy の手順を出す', () => {
    const r = evaluateConnection({ ...base, read: { ok: false, code: 'permission-denied' }, indexQuery: null });
    expect(r.find(x => x.id === 'firestore')!.status).toBe('ok');
    const rules = r.find(x => x.id === 'rules')!;
    expect(rules.status).toBe('fail'); expect(rules.fix).toContain('firestore:rules');
    expect(summarizeConnection(r).text).toContain('運営側');
  });
  it('索引不足（failed-precondition）は「索引」の行で出す', () => {
    const r = evaluateConnection({ ...base, indexQuery: { ok: false, code: 'failed-precondition' } });
    const i = r.find(x => x.id === 'index')!;
    expect(i.status).toBe('fail'); expect(i.fix).toContain('firestore:indexes');
  });
  it('電波が悪い・学校Wi-Fiは利用者側の問題として出す', () => {
    for (const code of ['unavailable', 'timeout', 'deadline-exceeded']) expect(describeFirebaseCode(code).owner).toBe('user');
    expect(describeFirebaseCode('auth/unauthorized-domain').fix).toContain('承認済みドメイン');
  });
  it('遅い応答・アプリ内ブラウザ・時計のずれ・未ログインは注意（対戦は止めない）', () => {
    const s = st({ ...base, read: { ok: true, ms: 2500 }, inAppBrowser: true, clockOffsetMs: -60_000, signedIn: false });
    expect(s).toMatchObject({ firestore: 'warn', browser: 'warn', clock: 'warn', auth: 'warn', index: 'skip' });
    expect(Object.values(s)).not.toContain('fail');
  });
  it('運営に送る文に UID やメールを入れない', () => {
    const t = reportText(evaluateConnection(base), { projectId: 'demo-x', appVersion: 'v', userAgent: 'UA' });
    expect(t).toContain('project: demo-x'); expect(t).not.toMatch(/uid|@/i);
  });
  it('読み取りだけ（書き込みはしない）・接続先は firebase.ts に任せる', () => {
    const probe = readFileSync('src/battle/data/connectionProbe.ts', 'utf8');
    expect(probe).not.toMatch(/setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction/);
    expect(probe).not.toMatch(/mntb-4ef06|AIzaSy/);
    expect(readFileSync('src/battle/ui/BattleHome.tsx', 'utf8')).toContain('<ConnectionCheckPanel');
    expect(readFileSync('src/battle/ui/BattleMatching.tsx', 'utf8')).toContain('<ConnectionCheckPanel autoRun');
  });
});
