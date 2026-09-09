import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.socialcalc',
  appName: 'SocialCalc',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
