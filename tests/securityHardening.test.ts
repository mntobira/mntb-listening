import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { sanitizeInlineHtml, escapeHtml, stripHtmlToText } from '../src/utils/sanitizeHtml';
import { escapeCsvCell, buildCsvText } from '../src/utils/studySummaryCsv';
import { safeParseJson, isPlainObject } from '../src/utils/safeLocalStorage';
import { mergeSolvedMaps } from '../src/utils/studySyncCore';
import { isSafeSameOriginPdfPath } from '../src/utils/pdfViewer';
import { safeAvatarUrl } from '../src/features/safety/avatarUrl';
import { isAllowedFeedbackWebhookUrl, buildFeedbackMailto, buildFeedbackPayload } from '../src/utils/feedbackPayload';
import { buildReplyMailto, type AdminFeedbackItem } from '../src/utils/feedbackReply';
import { formatText } from '../src/utils/textFormatter';
import { safeBattlePhotoUrl } from '../src/battle/data/battleShared';
import { mergeOutcomesStores, fromSyncedOutcomesSummary } from '../src/utils/learningOutcomes';

const ROOT = path.resolve(__dirname, '..');

describe('1. XSS / CSS / SVG / Null-Byte サニタイズ防御', () => {
  it('script / img onerror / foreignObject / svg animate を完全に無害化する', () => {
    const dirty = [
      '<script>alert(1)</script>',
      '<img src="x" onerror="alert(2)">',
      '<svg><foreignObject><body onload="alert(3)">evil</body></foreignObject><animate attributeName="href" to="javascript:alert(4)"/><path d="M0 0 L10 10"/></svg>',
      '<a href="javascript:alert(5)" onclick="alert(6)">リンク文字</a>',
    ].join('');
    const out = sanitizeInlineHtml(dirty);
    expect(out).not.toContain('<script');
    expect(out).not.toContain('onerror');
    expect(out).not.toContain('onload');
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('javascript:');
    expect(out).not.toContain('foreignObject');
    expect(out).not.toContain('animate');
    expect(out).toContain('<path d="M0 0 L10 10" />');
    expect(out).toContain('リンク文字');
  });

  it('CSS バックスラッシュエスケープ・image-set・data:・CSS変数上書き（--mt-*）を遮断する', () => {
    expect(sanitizeInlineHtml('<span style="background: \\75\\72\\6c(https://evil.example/x)">A</span>')).toBe('<span>A</span>');
    expect(sanitizeInlineHtml('<span style="background-image: image-set(\'https://evil.example/a.png\' 1x)">B</span>')).toBe('<span>B</span>');
    expect(sanitizeInlineHtml('<span style="--mt-bg: #000000; color: red">C</span>')).toBe('<span>C</span>');
    expect(sanitizeInlineHtml('<span style="background: data:text/html,<script>alert(1)</script>">D</span>')).toBe('<span>D</span>');
    // 正当なインライン数式スタイルは通す
    expect(sanitizeInlineHtml('<span style="vertical-align: -0.2em; font-size: 0.85em">x</span>')).toContain('vertical-align');
  });

  it('SVG 属性（d / viewBox / width / height / xmlns）に不正値が入ったら属性ごと落とす', () => {
    expect(sanitizeInlineHtml('<svg width="100%" viewBox="0 0 400 20"><path d="M0 0 L10 10"/></svg>'))
      .toBe('<svg width="100%" viewBox="0 0 400 20"><path d="M0 0 L10 10" /></svg>');
    expect(sanitizeInlineHtml('<svg width="calc(100vw)" viewBox="javascript:1" xmlns="https://evil.example"><path d="M0 0; alert(1)"/></svg>'))
      .toBe('<svg><path /></svg>');
  });

  it('NULL バイト（\\u0000）混入によるパーサー差分バイパスを除去する', () => {
    expect(sanitizeInlineHtml('<scr\u0000ipt>alert(1)</scr\u0000ipt>safe')).toBe('safe');
    expect(escapeHtml('a\u0000<b>')).toBe('a&lt;b&gt;');
    expect(stripHtmlToText('<p>hel\u0000lo</p>')).toBe('hello');
  });
});

describe('2. URL プロトコル・同一オリジン PDF・アバター・Webhook 境界防御', () => {
  it('PDF パスは同一オリジン相対 .pdf のみ許可し、//evil, .., javascript:, バックスラッシュを拒否する', () => {
    expect(isSafeSameOriginPdfPath('/prints/listening-guide.pdf')).toBe(true);
    expect(isSafeSameOriginPdfPath('//evil.example/p.pdf')).toBe(false);
    expect(isSafeSameOriginPdfPath('/prints/../secret.pdf')).toBe(false);
    expect(isSafeSameOriginPdfPath('javascript:alert(1)//.pdf')).toBe(false);
    expect(isSafeSameOriginPdfPath('https://evil.example/a.pdf')).toBe(false);
    expect(isSafeSameOriginPdfPath('/prints/a\\b.pdf')).toBe(false);
  });

  it('safeAvatarUrl は Google アイコン配信元の https のみ許可し、トラッキング画像・認証情報付きURL・javascript: を拒否する', () => {
    expect(safeAvatarUrl('https://lh3.googleusercontent.com/a/ACg8ocL=s96-c')).toContain('https://lh3.googleusercontent.com/');
    expect(safeAvatarUrl('http://lh3.googleusercontent.com/a/x')).toBe('');
    expect(safeAvatarUrl('https://user:pass@lh3.googleusercontent.com/a/x')).toBe('');
    expect(safeAvatarUrl('https://tracker.evil.example/pixel.png')).toBe('');
    expect(safeAvatarUrl('javascript:alert(1)')).toBe('');
    expect(safeAvatarUrl('data:image/svg+xml,<svg onload=alert(1)>')).toBe('');
  });

  it('Feedback Webhook はビルド時承認URLと完全一致する Google Apps Script HTTPS URL 以外は拒否する', () => {
    const prev = process.env.VITE_FEEDBACK_WEBHOOK_URL;
    const approved = `https://script.google.com/macros/s/${'A'.repeat(40)}/exec`;
    process.env.VITE_FEEDBACK_WEBHOOK_URL = approved;
    try {
      expect(isAllowedFeedbackWebhookUrl(approved)).toBe(true);
      expect(isAllowedFeedbackWebhookUrl(`${approved}/`)).toBe(true);
      expect(isAllowedFeedbackWebhookUrl('https://evil.example/steal')).toBe(false);
      expect(isAllowedFeedbackWebhookUrl(`https://script.google.com/macros/s/${'B'.repeat(40)}/exec`)).toBe(false);
      expect(isAllowedFeedbackWebhookUrl(`http://script.google.com/macros/s/${'A'.repeat(40)}/exec`)).toBe(false);
      expect(isAllowedFeedbackWebhookUrl(`https://user:pass@script.google.com/macros/s/${'A'.repeat(40)}/exec`)).toBe(false);
    } finally {
      if (prev === undefined) delete process.env.VITE_FEEDBACK_WEBHOOK_URL;
      else process.env.VITE_FEEDBACK_WEBHOOK_URL = prev;
    }
  });
});

describe('3. CSV 数式インジェクション（空白前置・改行前置・パイプ DDE バイパス対策）', () => {
  it('= + - @ | や空白・改行前置の数式セルをすべて先頭シングルクォートで無害化する', () => {
    expect(escapeCsvCell('=cmd|\'/C calc\'!A0')).toBe("'=cmd|'/C calc'!A0");
    expect(escapeCsvCell('  =SUM(A1:A2)')).toBe("'  =SUM(A1:A2)");
    expect(escapeCsvCell('\n+HYPERLINK("https://evil.example")')).toBe('"\'\n+HYPERLINK(""https://evil.example"")"');
    expect(escapeCsvCell('|/bin/sh')).toBe("'|/bin/sh");
    expect(escapeCsvCell('山田 太郎')).toBe('山田 太郎');

    const csv = buildCsvText(['名前'], [[' =1+1']], false);
    expect(csv).toBe("名前\r\n' =1+1\r\n");
  });
});

describe('4. プロトタイプ汚染（__proto__ / constructor / prototype）防御', () => {
  it('safeParseJson は __proto__ / constructor / prototype キーを破棄し Object.prototype を汚さない', () => {
    const malicious = '{"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}},"ok":42}';
    const parsed = safeParseJson<Record<string, unknown>>(malicious, {});
    expect(parsed.ok).toBe(42);
    expect(({} as { polluted?: unknown }).polluted).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(parsed, '__proto__')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(parsed, 'constructor')).toBe(false);
    expect(isPlainObject(parsed)).toBe(true);
    expect(isPlainObject(new Date())).toBe(false);
  });

  it('mergeSolvedMaps / mergeOutcomesStores / fromSyncedOutcomesSummary も危険キーを無視する', () => {
    const fakeMap = JSON.parse('{"__proto__": 123, "el1_A::q1": 1000}') as Record<string, number>;
    const merged = mergeSolvedMaps(fakeMap, { 'el1_A::q2': 2000 });
    expect(merged['el1_A::q1']).toBe(1000);
    expect(merged['el1_A::q2']).toBe(2000);
    expect(({} as { polluted?: unknown }).polluted).toBeUndefined();

    const out = mergeOutcomesStores(null, null);
    expect(out.version).toBe(1);
    expect(fromSyncedOutcomesSummary({ v: 1, firstDay: 'bad-date', daily: { '2026-11-01': 5, bad: 99 }, battles: {}, formats: {} })?.firstDay).toBeNull();
  });
});

describe('5. リポジトリ横断のセキュリティ不変条件（noopener・ヘッダー・SW・Rules）', () => {
  it('すべての target="_blank" リンクが rel="noopener noreferrer" を持つ', () => {
    const files = [
      'src/components/Intro.tsx',
      'src/components/PdfViewer.tsx',
      'src/components/UsageMeterPanel.tsx',
      'src/components/explanation/ResultSummary.tsx',
    ];
    for (const rel of files) {
      const src = readFileSync(path.join(ROOT, rel), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      const matches = src.match(/<a\b[^>]*target="_blank"[^>]*>/g) ?? [];
      expect(matches.length).toBeGreaterThan(0);
      for (const tag of matches) {
        expect(tag).toMatch(/rel="noopener noreferrer"/);
      }
    }
  });

  it('公開フローチャート HTML に外部トラッキングスクリプトや innerHTML 代入が残っていない', () => {
    const html = readFileSync(path.join(ROOT, 'public/flowcharts/chem-basic-acid-redox-flowchart.html'), 'utf8');
    expect(html).not.toContain('cloudflareinsights.com');
    expect(html).not.toContain('footer.innerHTML');
  });

  it('vercel.json / public/_headers / firebase.json の CSP が完全一致し、HSTS / XFO / CORP / nosniff が揃っている', () => {
    const vercel = JSON.parse(readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
    const firebaseCfg = JSON.parse(readFileSync(path.join(ROOT, 'firebase.json'), 'utf8'));
    const headersTxt = readFileSync(path.join(ROOT, 'public/_headers'), 'utf8');

    const mainHeaders = vercel.headers[0].headers as Array<{ key: string; value: string }>;
    const byKey = Object.fromEntries(mainHeaders.map((h) => [h.key, h.value]));
    const fbHeaders = firebaseCfg.hosting.headers[0].headers as Array<{ key: string; value: string }>;
    const fbByKey = Object.fromEntries(fbHeaders.map((h) => [h.key, h.value]));
    const cfCspLine = headersTxt.split('\n').find((l) => l.trim().startsWith('Content-Security-Policy:'))!;
    const cfCsp = cfCspLine.split('Content-Security-Policy:')[1]!.trim();

    expect(byKey['Content-Security-Policy']).toContain("default-src 'self'");
    expect(byKey['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(byKey['Content-Security-Policy']).toContain("object-src 'none'");
    expect(byKey['Content-Security-Policy']).not.toContain('unsafe-eval');
    expect(fbByKey['Content-Security-Policy']).toBe(byKey['Content-Security-Policy']);
    expect(cfCsp).toBe(byKey['Content-Security-Policy']);
    expect(byKey['Strict-Transport-Security']).toContain('max-age=63072000');
    expect(byKey['X-Content-Type-Options']).toBe('nosniff');
    expect(byKey['X-Frame-Options']).toBe('DENY');
    expect(byKey['Cross-Origin-Resource-Policy']).toBe('same-origin');
    expect(fbByKey['Cross-Origin-Resource-Policy']).toBe('same-origin');
  });

  it('firestore.rules に isSafePhotoUrl・匿名プロバイダ拒否・退会時匿名化・outcomes.battles 境界が入っている', () => {
    const rules = readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8');
    expect(rules).toContain('function isSafePhotoUrl(url)');
    expect(rules).toContain('function isNotAnonymousAuth()');
    expect(rules).toContain('function battleSelfAnonymize()');
    expect(rules).toContain("data.outcomes.battles.keys().hasOnly(['total', 'toReview', 'toPractice', 'converted'])");
    expect(rules).toContain("request.resource.data.keys().hasOnly(['studentUid', 'teacherUid', 'classId', 'grantedAt'])");
  });

  it('GAS Webhook・デプロイWorkflow・AndroidManifest の運用セキュリティガードが有効である', () => {
    const gas = readFileSync(path.join(ROOT, 'docs/feedback-gas.js'), 'utf8');
    expect(gas).toContain('function safeSheetCell(value, maxLen)');
    expect(gas).toContain('/^[A-Za-z_$][A-Za-z0-9_$.]{0,63}$/');
    expect(gas).not.toContain("status += '\\nmail: ' + (CONFIG.SEND_EMAIL ? 'ON -> ' + CONFIG.NOTIFY_EMAIL");

    const wf = readFileSync(path.join(ROOT, 'docs/deploy-firestore-rules.workflow.yml'), 'utf8');
    expect(wf).toContain('permissions:');
    expect(wf).toContain("mntb-listening");
    expect(wf).toContain('if [ "$FIREBASE_PROJECT_ID" = "mntb-4ef06" ]');

    const manifest = readFileSync(path.join(ROOT, 'android/app/src/main/AndroidManifest.xml'), 'utf8');
    expect(manifest).toContain('android:allowBackup="false"');
  });
});

describe('6. Wave-2 深掘り監査の回帰テスト（状態機械・権限境界・プレースホルダ衝突・mailto 注入）', () => {
  it('formatText は入力中の制御文字（\\u0000 / \\u0001）を入口で除去し、タグ・数式プレースホルダ衝突を起こさない', () => {
    const rendered = formatText('H2O\u00000\u0000\u00010\u0001 **重要**', [], { prose: false });
    expect(rendered).not.toBeNull();
    const html = JSON.stringify(rendered);
    expect(html).not.toContain('\u0000');
    expect(html).not.toContain('\u0001');
    expect(html).toContain('重要');
    expect(formatText('\u0000\u0001')).toBeNull();
  });

  it('buildReplyMailto / buildFeedbackMailto は制御文字・改行・不正宛先（ヘッダー注入）を拒否・無害化する', () => {
    const baseItem: AdminFeedbackItem = {
      docId: 'doc1',
      id: 'fb_1',
      screen: 'title',
      category: 'bug',
      rating: 4,
      message: 'テスト本文',
      uid: null,
      displayName: null,
      authEmail: null,
      contactEmail: 'student@example.com',
      createdAtIso: '2026-11-15T00:00:00.000Z',
      status: 'new',
    };
    expect(buildReplyMailto(baseItem)).toMatch(/^mailto:student%40example\.com\?subject=/);
    expect(buildReplyMailto({ ...baseItem, contactEmail: 'evil@example.com\r\nBcc:victim@example.com' })).toBeNull();
    expect(buildReplyMailto({ ...baseItem, contactEmail: 'evil@example.com?bcc=victim@example.com<>' })).toBeNull();
    expect(buildReplyMailto({ ...baseItem, contactEmail: 'not-an-email' })).toBeNull();

    const payload = buildFeedbackPayload({ screen: 'title', category: 'bug', rating: 5, message: '意見' });
    const fallbackMailto = buildFeedbackMailto(payload, 'evil@example.com?bcc=steal@example.com');
    expect(fallbackMailto).not.toContain('steal%40example.com');
    expect(fallbackMailto).toContain('mntobira%40gmail.com');
  });

  it('safeBattlePhotoUrl は https:// 以外のアイコンURL（http: / javascript: / data: / 空白混入 / 長大文字列）を空文字に落とす', () => {
    expect(safeBattlePhotoUrl('https://lh3.googleusercontent.com/a/avatar=s96-c')).toBe('https://lh3.googleusercontent.com/a/avatar=s96-c');
    expect(safeBattlePhotoUrl('http://lh3.googleusercontent.com/a/avatar')).toBe('');
    expect(safeBattlePhotoUrl('javascript:alert(1)')).toBe('');
    expect(safeBattlePhotoUrl('data:image/png;base64,AAAA')).toBe('');
    expect(safeBattlePhotoUrl(`https://example.com/${'a'.repeat(520)}`)).toBe('');
  });

  it('firestore.rules に Wave-2 の教室・対戦プロフィール・レート表示名更新・閲覧許可の検証が入っている', () => {
    const rules = readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8');
    // 1) battle_rooms の profiles スキーマ検査（コメントだけでなく実体があること）
    expect(rules).toContain('function battleRoomProfileValid(p, playerUid)');
    expect(rules).toContain("p.keys().hasOnly(['uid', 'nickname', 'photoURL', 'rating', 'matchSessionId'])");
    // 2) battle_lobbies 全国マッチ時の profiles 検査
    expect(rules).toContain('lobbyProfileValid(d.profiles[d.players[0]], d.players[0])');
    expect(rules).toContain('lobbyProfileValid(d.profiles[d.players[1]], d.players[1])');
    // 3) battle_ranking の表示名変更専用分岐（syncRankingNickname が死なないこと）
    expect(rules).toContain('function battleIdentityOnlyUpdate()');
    // 4) class_members の受付終了バイパス防止 & 生徒/担任の役割分離
    expect(rules).toContain('get(/databases/$(database)/documents/classrooms/$(request.resource.data.classId)).data.joinOpen == true');
    expect(rules).toContain("request.resource.data.get('rosterName', null) == resource.data.get('rosterName', null)");
    expect(rules).toContain('request.resource.data.displayName == resource.data.displayName');
    // 5) study_access の担任・在籍検証
    expect(rules).toContain('get(/databases/$(database)/documents/classrooms/$(request.resource.data.classId)).data.teacherUid == request.resource.data.teacherUid');
    // 6) classrooms の id 一致・memberCount 上限
    expect(rules).toContain("(!('id' in data) || (data.id is string && data.id == classId))");
    expect(rules).toContain('data.memberCount >= 0 && data.memberCount <= 10000');
  });
});
