# Prayer & Fire — iOS redesign and App Review checklist

Working branch: `improve/community-ui-review-2026-10-27`

## Brand assets (pending)
- Official new logo is the user's burgundy background, gold ring/flame and gold wordmark.
- Do not recreate the official mark with an emoji or a generic flame icon.
- Replace legacy orange brand assets in Home, sign-in, Community, group placeholders, splash, PWA and iOS icon only after source assets are supplied in appropriate sizes.
- Keep group-specific custom photos unchanged.

## App Review access
- Create a dedicated Supabase Auth test user via the normal authentication flow.
- Add that test user to a clearly named, safe demonstration group with pre-approved membership.
- Provide credentials and step-by-step Community navigation in App Store Connect > App Review Information (not in GitHub or source code).
- Verify account can read/write in the demo group without approving its own access.
- Do not bypass RLS, expose private groups, or give the reviewer administrator privileges.
- Verify in a clean iOS installation before resubmitting.

## Regression tests before merge
- Login/logout, session restoration and password reset.
- Community: discover group, join request, pending, reject, approved member access.
- Send/read messages, replies, reactions, images, voice notes, members count, search, archive, mute and notifications.
- Confirm private group content remains inaccessible to nonmembers.
- Confirm owners/admins retain permissions.
- Bible: books, chapters, search, saved items, audio and UI language.
- Profile photo, privacy controls, sign-out and admin panel.
- EN/ES/PT text fit, small iPhone, dynamic type, safe areas, keyboard.
- Native icon and splash checked on device; PWA icon alone is not sufficient.

## Changes already made in this branch
- More flexible Community heading width.
- Singular/plural group member count display.
- Community AccessGate starts burgundy and gold styling.

No database migrations, member data edits or production release are included.
