import type { CapacitorConfig } from '@capacitor/cli';

// IMPORTANT: For production builds submitted to the App Store, the app MUST
// load from the bundled `dist/` folder — never from a remote Lovable dev URL.
// Apple rejects apps that fetch their entire UI from an external server.
// The `server.url` below is enabled ONLY for local development hot-reload
// when the env var `CAP_DEV_SERVER=1` is set. In every other build (including
// TestFlight and the App Store) the app runs fully offline-capable from the
// packaged web assets.
const useDevServer = process.env.CAP_DEV_SERVER === '1';

const config: CapacitorConfig = {
  appId: 'app.lovable.31c416da3493411f9e7fbcc4136f4a86',
  appName: 'prayerandfire',
  webDir: 'dist',
  ...(useDevServer
    ? {
        server: {
          url: 'https://31c416da-3493-411f-9e7f-bcc4136f4a86.lovableproject.com?forceHideBadge=true',
          cleartext: true,
        },
      }
    : {}),
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