import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.megan.vibely',
  appName: 'Vibely',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    hostname: 'music.megan.qzz.io',
    allowNavigation: ['music.megan.qzz.io', 'apis.megan.qzz.io', '*.youtube.com', '*.ytimg.com']
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#06060e',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_vibely',
      iconColor: '#7c3aed'
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;
