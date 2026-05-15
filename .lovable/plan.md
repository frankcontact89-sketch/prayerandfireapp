## Prayer & Fire — Global Ministry Community Platform

This is a major repositioning of the app. To do it right (and not break what's already shipped to Apple/Stripe review), I'm proposing a **phased foundation** rather than building all 8 sections at once. Each phase ships working, polished features — no "coming soon" placeholders, no broken buttons.

### Phase 1 — Foundation & Navigation Shell (this round)

Rebrand the app's IA around the new vision without removing existing working screens.

- New bottom nav: **Community · Prayer Rooms · Missions · Media · Profile**
- Keep existing Home/Giving/Store/Courses accessible via Profile → "More" (so nothing breaks)
- New design tokens: deepen dark background, refine Prayer & Fire orange as a single accent, premium card system (rounded-2xl, subtle borders, soft glow on active)
- New landing-to-app transition copy: "Global prayer & missions community"
- Hide (not "coming soon") any section that isn't wired yet

### Phase 2 — Community + Messaging (core chat)

- Tables: `chat_groups`, `chat_group_members` (role: owner/admin/leader/member), `chat_messages` (text/image/voice/video), `message_reactions`, `message_reads`
- Group types: `ministry`, `mission`, `country`, `language`, `men`, `women`, `youth`, `announcement`, `private`
- Realtime via Supabase channels (messages, typing indicators, presence for online/offline)
- Storage buckets: `chat-media` (images/video/voice), with per-group RLS
- UI: group list, group chat view, create group, add/remove members, admin controls, search, reply, reactions, read receipts

### Phase 3 — Prayer Rooms

- Reuse chat infrastructure with a `room_type` flag: `prayer_request`, `live_prayer`, `private_prayer`, `testimony`, `urgent`
- Urgent prayer alerts → push via existing notifications system
- "Praying 🔥" tap counter per request

### Phase 4 — Missions

- Tables: `missions` (region, country, description, image, support_url), `mission_updates`
- Mozambique / Africa / Asia featured regions
- Volunteer signup (simple form → admin inbox)
- Donation links per mission (opens external in new tab, per existing rule)

### Phase 5 — Media Library

- Shared photos / videos / sermon clips / documents
- Tables: `media_items` (type, url, title, group_id nullable for global vs group)
- Reuse storage buckets

### Phase 6 — Calls (architecture only, no UI yet)

- Schema + signaling table prepared (`call_sessions`, `call_participants`)
- Integration recommendation: **LiveKit** or **Daily.co** (WebRTC providers that work in Lovable Cloud edge functions). I'll surface this as a question when we get here — needs an API key from you.

### Phase 7 — Admin / Moderation

- Extend `user_roles` enum: `admin`, `pastor`, `group_leader`, `moderator`, `user`
- Per-group leader permissions
- Message delete/pin, group access control, announcement pinning

### Brand separation

- Prayer & Fire keeps `prayerandfire.app` and current orange/dark identity, refocused on **global prayer + missions community**
- Movement Church stays a separate app (no changes here)
- No cross-contamination of branding

### Technical guardrails

- All new tables: RLS enabled from day one, member-scoped policies
- Guest mode preserved: guests see public announcement channels read-only, prompted to sign in to participate
- Safe fallbacks: empty states with helpful copy, never "Load failed"
- Features not yet built are hidden, not stubbed
- Existing screens (Home, Giving, Store, Courses, Events, Legal) remain functional throughout

---

### What I need from you to start

**Phase 1 is safe to start immediately** (pure UI/IA refactor, no schema risk).

Before I begin, confirm:

1. **Do I keep the current Home/Giving/Store/Courses screens accessible** (moved into Profile → More), or fully remove them from this app?
2. **Should I start with Phase 1 only**, or proceed straight through Phase 2 (chat) after Phase 1 lands?
3. **Bottom nav labels** — OK with: Community / Prayer / Missions / Media / Profile? Or different order/names?

Once you answer, I'll ship Phase 1 immediately.