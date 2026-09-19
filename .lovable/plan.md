# Community swipe and Message Info improvements

## Goal
Make outgoing-message swipe and Message Info feel natural on iPhone, add audio seeking and ticks, and keep all receipt details accurate and compact.

## Implementation
1. **Smooth outgoing swipe**
   - Replace end-only swipe detection with a directional drag that visibly moves the entire outgoing message row.
   - Lock only after clear horizontal intent, preserve vertical chat scrolling, add resistance, reveal a subtle Info indicator, and snap back after release.
   - Open Message Info around a 60px left-swipe threshold. Keep this behavior sender-only; incoming message actions remain unchanged.
   - Keep long-press/reaction behavior, but cancel it as soon as a drag begins.

2. **Audio interaction and ticks**
   - Make the waveform a dedicated seek surface supporting tap and drag to update playback time.
   - Isolate waveform gestures from row swipe so seeking never opens Message Info; play/pause remains unchanged.
   - Add the same sent/delivered/read ticks used by other outgoing messages to outgoing audio bubbles.

3. **Message Info redesign**
   - Show the actual outgoing message first: text, media/document preview, or compact playable audio with its time and tick state.
   - Replace separate cards with compact Prayer & Fire status sections for Read, Delivered, and Played for audio, plus the server-accepted Sent timestamp.
   - Show current recipient avatar, current name, date, and time beneath each relevant status.
   - When the sender is the only current group member, show one neutral translated line: “No other recipients in this group,” without empty warning cards.

4. **Receipt accuracy**
   - Refresh current group membership when Message Info opens.
   - Exclude the sender and filter delivery, read, and played receipts to current members only, so removed or departed members are not shown.
   - Keep the meanings unchanged: Sent is server acceptance; Delivered is device acknowledgement; Read is opened/read; Played is audio playback.

5. **Localization and validation**
   - Add all new labels and neutral states in English, Spanish, and Portuguese.
   - Run typecheck, lint, and production build; verify the release build number remains unchanged and do not start TestFlight.

## Technical notes
- The drag will use pointer/touch-safe state on the message row with vertical-intent cancellation and a bounded negative transform.
- The waveform will own its pointer sequence and stop propagation so it seeks independently from row swiping.
- No database schema or iOS/TestFlight workflow changes are required.
