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

## Prayer transport capacity

Prayer Room uses a WebRTC full mesh. Each participant maintains one connection
per other participant and transmits a separate audio stream over each active
connection. TURN relays traffic when required and does not mix or forward one
publisher stream to multiple listeners.

| Participants | Connections per participant | Connections in the room | Concurrent local two-peer links that passed |
| ---: | ---: | ---: | ---: |
| 15 | 14 | 105 | 14 of 14 |
| 30 | 29 | 435 | 29 of 29 |
| 50 | 49 | 1,225 | 49 of 49 |
| 100 | 99 | 4,950 | 99 of 99 |

The test uses separate synthetic peer pairs with ICE, DTLS and bidirectional
RTP. Each case models the number of links per participant. It does not join
clients to one room, measure phone battery or bandwidth, or establish a
supported participant limit. Use `PRAYER_TEST_CONCURRENT_LINKS=99` with
`tests/prayer-audio-transport.cjs` and the `werift` dependency to repeat.

A room-level claim requires a full signaling test with the actual client, plus
Wi-Fi and cellular interruptions, relay traffic and sustained device audio.
Test CallKit, screen lock, background audio, Bluetooth, headphones and APNs on
physical iPhones. The App Review account must have access to the room and
Community moderation flows, with the backend available throughout review.
