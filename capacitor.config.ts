import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.manatobi.listening',
  appName: 'マナトビ',
  webDir: 'dist',
  plugins: {
    AdMob: {
      appId: {
        android: 'ca-app-pub-9838177330528377~5499323313',
        ios: 'ca-app-pub-9838177330528377~3742078035'
      }
    }
  }
};

export default config;
