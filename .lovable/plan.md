# Phone invitation fallback

## Goal
Keep private direct phone matching unchanged, but replace the unmatched-number dead end with an explicit native text-message invitation.

## Implementation
1. **Safe direct-add states**
   - Continue using the existing protected phone RPC for discoverable, approved accounts.
   - Keep the existing specific already-member result; detect the signed-in user's own saved number locally without exposing anyone else.

2. **SMS invitation fallback**
   - After a privacy-safe unmatched result, offer “Invite by text message” instead of only showing an error.
   - Generate a secure group invite token, build the invite URL, and open the iPhone SMS composer addressed to the normalized number with localized invitation text.
   - Fall back to the device share sheet if the SMS composer cannot be opened; never send automatically.

3. **Clear localized guidance**
   - Explain in EN/ES/PT that direct add works only for eligible discoverable accounts, while text recipients must create/sign in and accept the invite before joining.
   - Keep the +1 default and international country selector.

4. **Validation**
   - Run typecheck, lint, and production build.
   - Keep Build 39/version 1.1 unchanged and do not start TestFlight.

## Technical notes
- No weakening of phone privacy, lookup rate limits, group permissions, or invite-token security.
- Changes are limited to the Community member invitation UI and existing secure invite-link RPC usage.
