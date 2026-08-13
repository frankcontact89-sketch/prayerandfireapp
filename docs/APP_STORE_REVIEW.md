# Prayer & Fire — App Store review preparation

## 1. Account deletion (Guideline 5.1.1(v))
In the app: **Settings → Delete Account**. It calls the `delete-account` Edge Function,
which verifies the signed-in user from their token (a user can only delete their own
account) and then, with service privileges, removes:

- profile, roles, notifications, favorites, notes, reading-plan progress, RSVPs, purchases
- Community: access request, group memberships, own messages, reactions, read receipts, blocks
- Storage: everything under the user's folder in `community-media` and `avatars`
- finally the auth user itself

**Retention (documented in the Legal Center):**
- Reports *filed by* the user are deleted. Reports *about* the user are kept for a limited
  safety/audit trail with `reported_user_id` cleared (anonymised) and `action =
  reported_account_deleted`.
- Contact-form submissions are kept for support history with the user link removed.
- Backups may retain deleted rows briefly until they expire.

## 2. UGC moderation (Guideline 1.2)
- **Content filter:** enforced in the database (`community_text_blocked` trigger on
  `community_messages` and `community_groups`), with a matching client pre-check for instant
  localized feedback. Religious/prayer vocabulary is not filtered.
- **Report:** message menu → *Report content*, with reasons (harassment, hate, sexual,
  violence/threats, spam/scam, privacy, other) and an optional comment. Self-reporting is
  blocked by a database constraint.
- **Block:** message menu → *Block user*. Blocked senders' messages are hidden by RLS, not
  only in the UI. Self-blocking is blocked by a database constraint.
- **Admin moderation:** Community → shield icon → *Reports & moderation* (owner and
  authorized community admins only, enforced by RLS via `is_community_staff`). Actions:
  dismiss, remove reported content, restrict member from Community. A normal admin cannot
  restrict the owner (database trigger `protect_owner_access`). Every action stores
  `reviewed_by`, `reviewed_at` and `action`.
- **Contact:** prayerandfireglobal@gmail.com (Legal Center + Contact form).

## 3. Reviewer / demo access — owner setup before submitting
Community stays private; no code change opens it up. To let Apple review it:

1. Create a normal account with the reviewer email you will give Apple (e.g.
   `appreview@prayerandfire.app`) using the app's sign-up screen, and confirm it.
2. Sign in as the owner → Community → shield icon → **Access requests** → approve that
   account (have it tap *Request access* once first).
3. Create a dedicated group, e.g. **"App Review Demo"**, and add only the reviewer account
   plus one leader. Do not add the reviewer to real member groups — approval alone does not
   expose other groups, membership does.
4. After the review passes, revoke access: shield icon → set the reviewer's access to
   rejected/restricted, or remove them from the demo group.

**Never** hardcode the reviewer password in the app or in the repository. Put it only in
App Store Connect → App Review Information → Sign-In Required.

### Suggested App Review Notes text
> Prayer & Fire includes a private, approval-based Community (group chat).
> Demo account: <email> / <password> (already approved and added to the "App Review Demo" group).
> UGC safeguards: an automatic content filter, "Report content" and "Block user" in the message
> menu (long-press or the ⋯ button on any message), and a leader-only moderation panel
> (shield icon) where reports are reviewed, content removed and members restricted within 24h.
> Account deletion: Settings → Delete Account permanently deletes the account and its content.
> Support/moderation contact: prayerandfireglobal@gmail.com
> Donations are charitable and open in the external browser (no digital goods).

## 4. Permissions
Camera, photo library and microphone are requested only when the user taps the matching
feature (profile photo, chat attachment, voice message). Push notifications are never
required to use the app.
