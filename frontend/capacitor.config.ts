import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.partiuinvest.app',
  appName: 'Partiu Invest',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0A1F44',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      backgroundColor: '#0A1F44',
      style: 'DARK',
    },
  },
};

export default config;
