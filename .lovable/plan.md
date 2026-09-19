# Community audit — bugs and missing actions (no code changed)

## About the missing "delete group"

A Delete group action does exist, but only at the very bottom of the full Group info page, below Leave group, and only for the person who created the group (or a community owner). The gear icon at the top of Group info — the thing that looks like "group settings" — opens a small panel with only Name, Description and Save. That is why it looks missing.

Files: `src/pages/CommunityV2.tsx` (`canDeleteGroup`, `deleteGroupNow`, the Group info screen and the `edit` panel).

Confirmed in the database: both existing groups were created by the same account, and the rules do allow that account to delete them. So this is a visibility/placement problem, not a permissions block — unless the person testing is not the group creator.

## Priority 1 — user-visible breakage

1. Delete group is hidden inside the gear "settings" panel's blind spot. Fix: put Delete group in the settings panel itself, clearly separated in red, and keep the row in Group info.
2. Nothing tells the user when an action fails. `deleteGroupNow`, `saveGroup`, `changePhoto`, `leave` and `memberUpdate` ignore errors, so a blocked delete or save looks like a button that does nothing. Fix: check the result and show a success or failure message.
3. The group creator can leave their own group. After that nobody can delete it, because deletion is tied to the creator still being present. Fix: block the creator from leaving unless they hand over ownership or delete the group.
4. Leave group has no confirmation. One accidental tap removes the person from the group. Fix: confirm first, like delete does.
5. Archived conversations vanish forever. The list hides archived groups, but there is no way to archive or un-archive anything. Fix: either add archive/un-archive, or stop hiding them.

## Priority 2 — missing or incomplete actions

6. Regular members cannot see who is in the group. The member list is only reachable through the admin-only "Admins" entry. Fix: a read-only member list for everyone.
7. Favorite/pin a conversation is supported by the data but has no button anywhere.
8. Group avatar can only be changed from the picture on Group info, not from the settings panel where people look for it.
9. Mute is per person and works, but there is no "mute for 8 hours / 1 week" and no visual muted marker on the conversation row.
10. Pending email invitations can be created and cancelled in Add members (`src/components/community/MembersModal.tsx`), but there is no way to re-send one.

## Priority 3 — leftovers and cleanup

11. `src/components/ChatScreen.tsx` is unused demo code with fake conversations ("24H PRAYER & FIRE") and dead phone/video buttons. Nothing imports it. Should be deleted before the next App Store build.
12. Dead filter logic remains in `CommunityV2.tsx` after the tabs were removed: the `filter` state, the unread branch, and the Discover loading it still triggers after a delete. Harmless but confusing.
13. Reporting and blocking work from a message only. There is no way to report or block a person from their profile or from the member list.

## Verified as working

Sending messages, replies, reactions and the reaction detail list, voice messages, media/documents/links section, message search, copy/delete/report/block on a message, unread badges, loading/error/retry and empty states, add members and admin promotion with owner protection.

## Suggested fix order

Priority 1 items in one pass (delete-group placement, error messages, creator-leave protection, leave confirmation, archived state), then Priority 2, then the cleanup. No code will change until you approve.
