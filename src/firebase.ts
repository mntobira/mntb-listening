import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, initializeFirestore, connectFirestoreEmulator, disableNetwork, type Firestore } from 'firebase/firestore';
const env = import.meta.env;
export const FIREBASE_CONFIGURED = Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID && env.VITE_FIREBASE_AUTH_DOMAIN && env.VITE_FIREBASE_APP_ID);
export const USE_EMULATORS = env.VITE_USE_EMULATORS === 'true';
if (env.VITE_FIREBASE_PROJECT_ID === 'mntb-4ef06') throw new Error('統合版のFirebaseには接続できません。リスニング専用プロジェクトを設定してください。');
const projectId = FIREBASE_CONFIGURED ? env.VITE_FIREBASE_PROJECT_ID : 'demo-manatobi-listening';
const app = initializeApp({
  apiKey: FIREBASE_CONFIGURED ? env.VITE_FIREBASE_API_KEY : 'demo-listening-key',
  projectId, authDomain: FIREBASE_CONFIGURED ? env.VITE_FIREBASE_AUTH_DOMAIN : 'demo-manatobi-listening.firebaseapp.com',
  appId: FIREBASE_CONFIGURED ? env.VITE_FIREBASE_APP_ID : '1:123:web:listening',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET, messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
}, 'manatobi-listening');
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
// 統合版と同じ：学校・塾の Wi-Fi などでストリーム通信が詰まる環境だけ、自動でロングポーリングに切り替える
function createDb(): Firestore {
  try { return initializeFirestore(app, { experimentalAutoDetectLongPolling: true }); } catch { return getFirestore(app); }
}
export const db = createDb();
if (USE_EMULATORS) {
  if (!projectId.startsWith('demo-')) throw new Error('Emulator testing requires a demo- project ID.');
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
} else if (!FIREBASE_CONFIGURED) {
  // Guest preview only. Never connect to the integrated app or an unknown backend.
  void disableNetwork(db);
}
