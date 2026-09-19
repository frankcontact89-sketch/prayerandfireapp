# Community visual polish

## Goal
Bring the existing Community chat and Message Info screens closer to the approved mockup while preserving all current gestures, receipts, localization, privacy, and release settings.

## Implementation
1. **Chat surface and message rhythm**
   - Refine the black chat canvas, header, day markers, message spacing, bubble widths, corner shapes, text hierarchy, and metadata alignment for iPhone.
   - Keep outgoing messages Prayer & Fire orange and incoming messages dark, with stronger contrast and consistent media rounding.

2. **Outgoing audio presentation**
   - Tighten avatar, play/pause button, waveform, elapsed/total time, timestamp, and receipt ticks into one stable layout.
   - Preserve the dedicated waveform seek gesture and keep it isolated from row swiping.

3. **Swipe affordance**
   - Polish the existing left-drag motion, resistance, snap-back, and compact Info reveal without adding destructive swipe actions.
   - Preserve long-press and the existing options sheet.

4. **Message Info sheet**
   - Refine the light full-screen sheet with a centered title, clearer message preview, compact Sent/Read/Delivered/Played hierarchy, and polished recipient rows.
   - Preserve current-member filtering, sender exclusion, exact receipt semantics, and the neutral one-member state.

5. **Validation**
   - Confirm EN/ES/PT labels remain correct, check iPhone-sized rendering where authentication permits, and run typecheck, lint, and production build.
   - Keep build/version 38 unchanged and do not start TestFlight.

## Technical notes
- Changes are limited to Community presentation code and semantic design tokens where needed.
- No database, push, phone lookup, signing, workflow, or release changes.
