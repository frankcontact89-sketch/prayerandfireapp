# Why the iOS build installs but closes instantly — audit findings

No code changed. Findings below come from reading the iOS project, the release workflow, and the app's startup code.

## Most likely cause (confirmed by inspection)

The iOS project never bundles the web app files, so there is nothing for the app to show and it quits at launch.

- `ios/App/App.xcodeproj/project.pbxproj` — the Resources build phase (around lines 131-141) lists only `Assets.xcassets`, `config.xml`, `Main.storyboard`, `LaunchScreen.storyboard`.
- Missing from the file references and from Resources: the `public` folder (the built web app) and `capacitor.config.json`. A standard Capacitor iOS project always references both.
- `ios/.gitignore` correctly ignores `App/App/public` and `App/App/capacitor.config.json` as generated, but generated files still need a reference in the Xcode project; `npx cap sync ios` fills the folder, it does not add missing references.

Effect: the packaged app has no `index.html` and no Capacitor config. Capacitor's view controller treats a missing web directory as a fatal error and the process terminates a fraction of a second after launch — exactly the "installs, opens, closes" symptom.

This alone explains the crash. Everything below is secondary and worth a look once assets are bundled.

## Secondary risks to inspect

1. Offline caching in a packaged app — `vite.config.ts` lines 18-92 enables the PWA/offline service worker. That is a browser concept; inside the native app it is useless and the auto-injected registration code is one more thing running before the first screen. Worth disabling for native builds.
2. Missing native dependency declaration — `src/components/AppDrawer.tsx` lines 3-4 import `@capacitor/core` and `@capacitor/share`, but `package.json` does not list `@capacitor/core` as a dependency. It currently resolves indirectly; a clean install on the build machine could break.
3. Backend keys baked at build time — `.env` is committed and read in `src/integrations/supabase/client.ts` lines 5-11. If those values were ever missing during a CI build, the app would fail at startup with a blank screen. Verify the built files contain the real values.
4. Startup code assuming a browser — `src/pages/Index.tsx` reads saved settings from browser storage at lines 194, 323, 384, 397 before the first screen. Safe inside the WebView, but only once the WebView actually loads; it is a follow-up check, not the cause.
5. Large Bible data files (about 12 MB total in `src/data/bible/`) are loaded on demand in `src/components/BibleScreen.tsx` lines 43-53. Not a launch crash, but a memory risk on older iPhones when opening the Bible.
6. The release workflow already runs a simulator launch smoke test (`.github/workflows/testflight-upload.yml`, the "Smoke-test app launch in iOS Simulator" step). Its result for the last run should be read — with the missing assets it should have failed, which tells us whether that guard is actually working.

## Proposed fix, for a later approved pass

1. Add the `public` folder and `capacitor.config.json` references to the Xcode project and include them in the Resources build phase, matching the standard Capacitor template.
2. Re-run the web build and `npx cap sync ios`, then confirm the built `.app` contains `public/index.html` and `capacitor.config.json`.
3. Turn off the offline/service-worker layer for native builds and add `@capacitor/core` as an explicit dependency.
4. Bump the build number and let the workflow's simulator smoke test confirm the app stays open before uploading.

Nothing will be changed until you approve.
