import type { CapacitorConfig } from '@capacitor/cli';

// IMPORTANT: For production builds submitted to the App Store, the app MUST
// load from bundled web assets.
// The `server.url` below is enabled ONLY for local development hot-reload
// when the env var `CAP_DEV_SERVER=1` is set. In every other build (including
// TestFlight and the App Store) the app runs from the packaged web assets.
const useDevServer = process.env.CAP_DEV_SERVER === '1';

const config: CapacitorConfig = {
  appId: 'com.frankcontact89.prayerandfiremobile',
  appName: 'Prayer & Fire',
  webDir: 'dist',
  backgroundColor: '#000000',
  ...(useDevServer
    ? {
        server: {
          url: process.env.CAP_DEV_SERVER_URL ?? 'http://localhost:8080',
          cleartext: true,
        },
      }
    : {}),
  ios: {
    contentInset: 'always',
    backgroundColor: '#000000',
    scrollEnabled: true,
  },
  plugins: {
    Camera: {
      iosImagePickerPresentationStyle: 'fullscreen',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;