You asked for a very large scope in one turn. To keep quality high and avoid a half-broken App Store build, I'll ship it in three phases. Phase 1 is what I'll build immediately after you approve. Phases 2 and 3 are follow-up turns — each one is a "reply 'go phase 2'" away.

## Phase 1 — Navigation shell + Store upgrade (this turn)

**Navigation**
- Replace top-right Share icon on Home with a hamburger (☰) in the same spot.
- Left slide-out drawer (shadcn `Sheet` on left side, dark theme, orange accents, safe-area aware).
- Menu items in exact order requested: Home, Bible, Prayer, Favorites, Library, Daily Devotional, Daily Reading Plan, The Five Solas, 50 Greek Words, Store, Share Prayer & Fire, About, Settings.
- Five Solas and 50 Greek Words are collapsible groups inside the drawer (shadcn `Collapsible`).
- Every leaf item routes to a real screen. New content pages (Prayer, Favorites, Library, Daily Devotional, Reading Plan, About, individual Solas pages, individual Greek word pages) render from the DB with an empty state ("Coming soon — content will appear here once added in the Admin Panel"). No 404s, no dead buttons.

**Store upgrades on the existing `products` table**
- Add columns: `is_featured`, `is_published`, `order_index`, `category`, `stock_status` (in_stock/low_stock/out_of_stock), `sku`, `images` (jsonb array for multi-image).
- Admin → Products: toggles for Featured, Publish/Hide, category dropdown, stock status, SKU, drag-to-reorder, multi-image upload.
- Public Store screen: filter by category, search box, hidden items excluded, featured section on top, order respected. External buttons (Amazon/Etsy/Stripe/Shopify) already work — I'll keep those.

**Five Solas + Greek Words data model (seeded, admin-editable)**
- New table `solas` (name, latin, english, explanation, history, verses, application, order_index, all in _en/_es/_pt).
- New table `greek_words` (greek, transliteration, pronunciation, meaning, biblical_usage, references, explanation, order_index, all in _en/_es/_pt).
- Seed 5 Solas with full AI-drafted Reformed content in all 3 languages.
- Seed the first 10 Greek words (Agape, Logos, Christos, Pistis, Charis, Kurios, Ekklesia, Baptizo, Metanoia, Pneuma) so the section isn't empty. Remaining 40 come in Phase 3 to keep this turn shippable.
- Admin tabs to CRUD both.

## Phase 2 — CMS expansion (next turn)

New admin tabs + tables (CRUD, trilingual, RLS admin-write / public-read):
Daily Devotionals, Daily Prayer, Daily Reflection, Reading Plans, Bible Studies, Mission Projects, Hero Banner, Home Cards, Announcements, Product Categories, Donation Campaigns, Media Library (images/videos). Verse of the Day already exists (`verses` table) — I'll surface it in the Verse of the Day slot on Home. Push Notifications, Events, and Store already have admin tabs.

## Phase 3 — Content depth (next turn)

- Remaining 40 Greek words seeded with full trilingual content.
- Any polish on Solas/Devotional copy.

## Out of scope unless you ask

- Rewriting Bible, Events, Notifications, Giving screens (already working).
- Redesigning the visual system.
- Automatic machine translation of admin-entered content (admins fill EN/ES/PT to stay App-Store-safe).

## Files touched in Phase 1

- Migration: alter `products`; create `solas`, `greek_words`; seed rows.
- New: `src/components/AppDrawer.tsx`, `src/components/SolaDetailScreen.tsx`, `src/components/GreekWordDetailScreen.tsx`, `src/components/PrayerScreen.tsx`, `src/components/FavoritesScreen.tsx`, `src/components/LibraryScreen.tsx`, `src/components/DailyDevotionalScreen.tsx`, `src/components/ReadingPlanScreen.tsx`, `src/components/AboutScreen.tsx`, `src/components/SolasListScreen.tsx`, `src/components/GreekWordsListScreen.tsx`.
- New admin: `src/components/admin/AdminSolas.tsx`, `src/components/admin/AdminGreekWords.tsx`.
- Edit: `src/pages/Index.tsx` (hamburger, drawer, new routes), `src/components/AdminPanel.tsx` (new tabs), `src/components/ShoppingScreen.tsx` (search/filter/featured/hidden), `src/components/admin/AdminProducts.tsx` (new fields + reorder).

Reply "approved" (or "go phase 1") and I'll build it. Reply with edits if you want to move something between phases.