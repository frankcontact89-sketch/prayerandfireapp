# Prayer & Fire — Apple App Store release checklist

## 1. Build the native iOS app
```bash
npm install
npm run build
npx cap add ios      # only the first time
npx cap sync ios
npx cap open ios
```
> `CAP_DEV_SERVER` must NOT be set. Without it the app loads from the bundled
> `dist/` folder (required by Apple — no remote UI loading).

## 2. Info.plist permissions (required, otherwise the camera crashes)
After `npx cap add ios`, copy the keys from
`docs/ios-info-plist-permissions.xml` into `ios/App/App/Info.plist`:

- `NSCameraUsageDescription`
- `NSPhotoLibraryUsageDescription`
- `NSPhotoLibraryAddUsageDescription`
- `NSMicrophoneUsageDescription`

## 3. Reviewer account
Provide App Store Connect with a working demo account (email + password)
that is already email-confirmed, so the reviewer never hits the
"confirm your email" screen.

## 4. Verified in this pass
- Profile photo: native camera + photo library via Capacitor Camera, with
  permission requests, cancel handling and web fallback. Front camera used
  for selfies.
- Avatar uploads: `avatars` storage bucket is public with per-user RLS
  policies for insert/update/delete.
- Login: email/password with friendly localized errors, resend confirmation,
  forgot password (`/reset-password`) and forgot username.
- No "Coming soon", placeholder or broken-link content in the shipped UI.
- Donations use external browser links only (charitable, allowed by Apple).
