import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.31c416da3493411f9e7fbcc4136f4a86',
  appName: 'prayerandfire',
  webDir: 'dist',
  server: {
    url: 'https://31c416da-3493-411f-9e7f-bcc4136f4a86.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'always',
  },
  plugins: {
    Camera: {
      // iOS Info.plist permission strings — required to avoid TestFlight crash
      iosImagePickerPresentationStyle: 'fullscreen',
    },
  },
};

export default config;