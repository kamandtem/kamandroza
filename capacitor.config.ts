import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ir.roza.skin',
  appName: 'رزا',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    LocalNotifications: { smallIcon: 'ic_stat_roza', iconColor: '#c98978' },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 0,
      backgroundColor: '#fffaf8',
      showSpinner: false,
    },
  },
  android: { allowMixedContent: false },
};
export default config;
