import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.manatobi.listening',
  appName: 'マナトビ',
  webDir: 'dist',
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: true,
      providers: ['apple.com', 'google.com'],
    },
    AdMob: {
      appId: {
        android: 'ca-app-pub-9838177330528377~5499323313',
        ios: 'ca-app-pub-9838177330528377~3742078035'
      }
    },
    // 端末ネイティブのログイン（@capacitor-firebase/authentication）。
    // providers を書かないと、プラグインは「provider is not enabled」でログインを拒否する。
    // skipNativeAuth: true … 端末側では Firebase にログインせず、資格情報（idToken）だけ受け取る。
    //   ログインは JS の Firebase SDK（signInWithCredential）で行い、Web 版と同じ uid にする。
    FirebaseAuthentication: {
      skipNativeAuth: true,
      providers: ['google.com', 'apple.com']
    }
  },
  experimental: {
    ios: {
      spm: {
        // SwiftPM のパッケージ名衝突を避ける（プラグイン README の指示）
        packageOptions: {
          '@capacitor-firebase/authentication': { symlink: true }
        }
      }
    }
  }
};

export default config;
