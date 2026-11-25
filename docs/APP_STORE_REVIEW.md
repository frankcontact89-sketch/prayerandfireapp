# Prayer & Fire — App Store review preparation

## 1. Account deletion (Guideline 5.1.1(v))
In the app: **Settings → Delete Account**. It calls the `delete-account` Edge Function,
which verifies the signed-in user from their token (a user can only delete their own
account) and then, with service privileges, removes:

- profile, roles, notifications, favorites, notes, reading-plan progress, RSVPs, purchases
- Community: access request, group memberships, own messages, reactions, read receipts, blocks
- Direct messages involving the deleted account and Prayer Room moderation entries attached to it are removed by foreign-key cascade.
- Storage: everything under the user's folder in `community-media` and `avatars`
- finally the auth user itself

**Retention (documented in the Legal Center):**
- Reports *filed by* the user are deleted. Reports *about* the user are kept for a limited
  safety/audit trail with `reported_user_id` cleared (anonymised) and `action =
  reported_account_deleted`.
- Contact-form submissions are kept for support history with the user link removed.
- Backups may retain deleted rows briefly until they expire.

## 2. Community moderation (Guideline 1.2)

- The mobile client pre-checks text before sending group and private messages.
  Production schema inspection found no database content-filter trigger on
  Community messages. Verify the filtering safeguards before submission.
- Group chat has report and block controls. Prayer Room has report and block
  controls in the participant menu. A block in either direction prevents new
  private messages at the database. Verify report delivery, staff handling
  and the block experience with two ordinary accounts.
- Prayer Room actions are authorized server-side by room. Administrators can
  appoint a moderator for two hours. Removal prevents rejoining for ten
  minutes. Giving the floor sends an invitation to speak and leaves the
  participant in control of the microphone.
- Support and moderation contact: prayerandfireglobal@gmail.com.

## 3. Reviewer access (Guideline 2.1)

Community and its general prayer room require a signed-in account. Private
group conversations and group prayer rooms require group membership.

1. Create and confirm a reviewer account and add it to a dedicated demo group.
2. Verify sign-in, group chat, report and block controls, and prayer-room access
   from that account. Provide a second demo account or a staffed session if
   the reviewer needs to try two-party behavior.
3. Enter credentials only in App Store Connect under App Review Information.
   Keep the backend running throughout the review.

## 4. Microphone, Contacts and privacy (Guidelines 2.5.14 and 5.1.1)

- Confirm on a physical iPhone that iOS presents the microphone permission
  purpose string, that a newly joined room starts muted, and that microphone
  state is clear when a participant is live, in the background or disconnected.
- Confirm that Add Contact opens the iOS contact editor after the user chooses
  the action. The app passes the participant's display name.
- Check that the in-app privacy policy and App Store privacy answers reflect
  voice traffic, push tokens, private messages, and their deletion behavior.
