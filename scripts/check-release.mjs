import {loadEnv} from 'vite';
import {readFileSync} from 'node:fs';
const audio=JSON.parse(readFileSync(new URL('../COMMERCIAL_AUDIO_STATUS.json',import.meta.url),'utf8'));
if(audio.status!=='approved'){console.error('公開ビルドを中止: 商用音声の差し替え・品質確認が未完了です。COMMERCIAL_AUDIO_MIGRATION.mdを確認してください。');process.exit(1);}
const env={...loadEnv('production',process.cwd(),''),...process.env};
const required=['VITE_FIREBASE_API_KEY','VITE_FIREBASE_PROJECT_ID','VITE_FIREBASE_AUTH_DOMAIN','VITE_FIREBASE_APP_ID'];
const missing=required.filter(k=>!env[k]?.trim());
const projectId=env.VITE_FIREBASE_PROJECT_ID?.trim();
const invalidTarget=env.VITE_USE_EMULATORS==='true' || projectId==='mntb-4ef06' || projectId?.startsWith('demo-');
// Production must never silently publish a guest-only build, including on Vercel.
// Offline verification remains available explicitly through npm run build:demo.
if(invalidTarget || missing.length>0) {
 console.error('公開ビルドを中止: リスニング専用Firebaseの設定が不足・不正です。',missing.join(', '));
 console.error('Vercelでは公開対象（Production / Preview）の環境変数に VITE_FIREBASE_* を設定し、再デプロイしてください。Firebase側の反映を待つだけでは直りません。ゲストのみの検証は npm run build:demo を使ってください。');
 process.exit(1);
}
console.log('Release target: '+projectId);
