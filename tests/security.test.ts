import { describe, expect, it, vi, beforeEach } from 'vitest';
import fs from 'fs';

class MemStorage {
  data = new Map<string, string>();
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) { this.data.set(k, v); }
  removeItem(k: string) { this.data.delete(k); }
}

describe('セキュリティ：フィードバックの連続送信を止める', () => {
  beforeEach(() => { vi.stubGlobal('localStorage', new MemStorage()); });

  it('1分に3回まで。4回目は止め、1分たてばまた送れる', async () => {
    const { takeFeedbackSlot } = await import('../src/utils/feedback');
    const t = 1_800_000_000_000;
    expect([0, 1, 2].map(i => takeFeedbackSlot(t + i))).toEqual([true, true, true]);
    expect(takeFeedbackSlot(t + 10)).toBe(false);
    expect(takeFeedbackSlot(t + 61_000)).toBe(true);
  });

  it('1日に20回まで', async () => {
    const { takeFeedbackSlot } = await import('../src/utils/feedback');
    const t = 1_800_000_000_000;
    for (let i = 0; i < 20; i++) expect(takeFeedbackSlot(t + i * 120_000)).toBe(true);
    expect(takeFeedbackSlot(t + 21 * 120_000)).toBe(false);
  });

  it('壊れた記録が入っていても送信を止めない', async () => {
    localStorage.setItem('feedback_rate_v1', '{broken');
    const { takeFeedbackSlot } = await import('../src/utils/feedback');
    expect(takeFeedbackSlot()).toBe(true);
  });
});

describe('セキュリティ：配信ヘッダーと CSP', () => {
  const headers = fs.readFileSync('public/_headers', 'utf8');
  const csp = headers.split('\n').find(l => l.trim().startsWith('Content-Security-Policy:')) ?? '';

  it('スクリプトに unsafe-inline / unsafe-eval を許可していない', () => {
    const script = csp.split(';').find(d => d.trim().startsWith('script-src')) ?? '';
    expect(script).not.toMatch(/unsafe-inline|unsafe-eval|\*/);
    expect(csp).toMatch(/object-src 'none'/);
    expect(csp).toMatch(/base-uri 'self'/);
    expect(csp).toMatch(/frame-ancestors 'none'/);
  });

  it('Firebase Hosting・Vercel・_headers のすべてで同じ CSP を配信する', () => {
    const value = csp.split('Content-Security-Policy:')[1].trim();
    const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    const v = vercel.headers[0].headers.find((h: any) => h.key === 'Content-Security-Policy').value;
    expect(v).toBe(value);
    const fb = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
    const f = fb.hosting.headers[0].headers.find((h: any) => h.key === 'Content-Security-Policy').value;
    expect(f).toBe(value);
  });

  it('クリックジャッキング・MIME 偽装・HSTS の対策ヘッダーがある', () => {
    for (const h of ['X-Content-Type-Options: nosniff', 'X-Frame-Options: DENY', 'Strict-Transport-Security', 'Referrer-Policy', 'Permissions-Policy']) {
      expect(headers).toContain(h);
    }
  });
});
