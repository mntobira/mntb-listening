// リスニング版：新しい Firebase プロジェクトにつなぐ設定を確かめる（読み取りのみ・何も書き換えない）
//   node scripts/check-firebase-setup.mjs
// 通ったら、表示されるコマンドでルールと索引を反映する。
import { existsSync, readFileSync } from 'node:fs';
import { loadEnv } from 'vite';

const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
const problems = [];
const warn = [];
const need = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID'];
for (const k of need) if (!env[k]?.trim()) problems.push(`${k} が空です（.env.local に Firebase コンソールの値を入れてください）`);
const id = env.VITE_FIREBASE_PROJECT_ID?.trim() || '';
if (id === 'mntb-4ef06') problems.push('統合版の Firebase（mntb-4ef06）が入っています。リスニング専用の新しいプロジェクトを作ってください');
if (id.startsWith('demo-')) problems.push('demo- のプロジェクトIDはローカル試験用です。本番の新しいプロジェクトIDを入れてください');
if (env.VITE_USE_EMULATORS === 'true') problems.push('VITE_USE_EMULATORS=true のままです（本番は false）');
if (env.VITE_FIREBASE_API_KEY && !/^AIza[0-9A-Za-z_-]{30,}$/.test(env.VITE_FIREBASE_API_KEY.trim())) warn.push('APIキーの形が普通と違います（コピー漏れがないか確認）');
if (env.VITE_FIREBASE_AUTH_DOMAIN && !/\.(firebaseapp\.com|web\.app)$/.test(env.VITE_FIREBASE_AUTH_DOMAIN.trim())) warn.push('authDomain が <プロジェクトID>.firebaseapp.com の形ではありません（独自ドメインにしている場合は問題なし）');
if (id && env.VITE_FIREBASE_APP_ID && env.VITE_FIREBASE_MESSAGING_SENDER_ID && !env.VITE_FIREBASE_APP_ID.includes(`:${env.VITE_FIREBASE_MESSAGING_SENDER_ID}:`)) warn.push('appId と messagingSenderId が別のプロジェクトのもののようです');
for (const f of ['firestore.rules', 'firestore.indexes.json']) if (!existsSync(f)) problems.push(`${f} がありません`);
if (existsSync('.firebaserc') && JSON.parse(readFileSync('.firebaserc', 'utf8')).projects?.default === 'mntb-4ef06') problems.push('.firebaserc の既定が統合版です');

console.log(`接続先: ${id || '(未設定)'}`);
for (const w of warn) console.log('△ ' + w);
if (problems.length) { for (const p of problems) console.log('× ' + p); console.log('\n設定を直してから、もう一度実行してください。'); process.exit(1); }
console.log(`✓ .env の設定はそろっています。

次に（初回と、firestore.rules / firestore.indexes.json を変えたとき）:
  npx firebase login
  npx firebase deploy --only firestore:rules,firestore:indexes --project ${id}

Firebase コンソールで確認すること:
  □ Authentication → ログイン方法 → Google を有効
  □ Authentication → 設定 → 承認済みドメイン に 公開URLのドメイン と localhost
  □ Firestore Database を「本番モード」で作成済み（テストモードで公開しない）
  □ Firestore → インデックス が「有効」になるまで待つ（数分）

最後にアプリを開き、対戦メニュー →「つながらないとき（通信チェック）」で全部 ○ になることを確認。`);
