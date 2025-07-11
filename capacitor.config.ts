import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.poc.bio.app',
  appName: 'biometrics-poc-project',
  webDir: 'dist/biometrics-poc-project/browser',
  plugins: {
    CapacitorHttp:{
      enabled: true
    }
  }
};

export default config;
