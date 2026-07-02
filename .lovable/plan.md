# Phase 1: Content System (Production-Ready)

Focus: Daily Devotional, Reading Plans, and Christian Library — real, fully working, admin-managed, translated (EN/ES/PT). No placeholders.

Later phases (not this one): Prayer Journal, My Notes, Favorites sync, Join Prayer & Fire form, Share page rebuild, Push notifications, AI Assistant, expanded Solas/Greek admin. The hamburger menu will only expose sections that are ready — unfinished items stay hidden per your rule.

---

## 1. Database (one migration)

Three new tables, all trilingual, all RLS-protected, all admin-managed via existing `has_role(auth.uid(), 'admin')`.

**`devotionals`** — one per date
- `date` (unique), `is_published`
- Trilingual fields (EN/ES/PT) for: `title`, `scripture_reference`, `scripture_text`, `context`, `reflection`, `application`, `prayer`, `questions` (text[]), `related_verses` (text[])

**`reading_plans`**
- `slug`, `duration_days`, `order_index`, `is_published`
- Trilingual: `title`, `description`

**`reading_plan_days`**
- FK to plan, `day_number`, trilingual `title` + `passages` (text[])

**`reading_plan_progress`** (per user)
- `user_id`, `plan_id`, `day_number`, `completed_at` — private RLS

**`library_articles`**
- `category` (enum: bible_studies, doctrine, christology, pneumatology, soteriology, hermeneutics, homiletics, church_history, apologetics, leadership, missions, sermons, articles)
- `slug`, `order_index`, `is_published`, `cover_image_url`
- Trilingual: `title`, `summary`, `body` (markdown)

All tables get standard GRANTs, RLS policies (public read where `is_published=true`, admin full write, user-owned progress).

Seed data: 3 starter devotionals (today + past 2 days), 2 reading plans (Gospels in 30 Days, Psalms & Proverbs), 3 library articles across different categories — all trilingual — so nothing ships empty.

## 2. New user screens

- **`DailyDevotionalScreen.tsx`** — pulls today's devotional (or latest published fallback). Renders all fields in current language. Share button (native share API). Save-to-favorites button is hidden this phase.
- **`ReadingPlansScreen.tsx`** — list of published plans with progress %.
- **`ReadingPlanDetailScreen.tsx`** — day-by-day list, "mark complete" toggle, "continue reading" jumps to first incomplete day, links passages to existing BibleScreen.
- **`ChristianLibraryScreen.tsx`** — category grid, hides categories with zero published articles (per your rule).
- **`LibraryArticleScreen.tsx`** — renders markdown body, back to category.

All screens use existing `SimpleScreen` header pattern, safe-area padding, pure black.

## 3. Admin CMS additions

New tabs in `AdminPanel`:
- **Devotionals** — CRUD with trilingual tabs, date picker, publish toggle.
- **Reading Plans** — CRUD plan + nested day-by-day editor.
- **Library** — CRUD articles with category select, markdown body editor, cover image upload to existing `product-images` bucket (or new `library-images` bucket).

Existing admin CRUD pattern (`AdminSolas`, `AdminGreekWords`) is the template.

## 4. Navigation

Update `AppDrawer.tsx` menu order to only include working items this phase:
Home, Bible, Daily Devotional, Reading Plans, Christian Library, The Five Solas, Biblical Languages Library, Store, About, Settings.

Hidden until their phase: Prayer Journal, My Notes, Favorites, Join Prayer & Fire, Share Prayer & Fire (kept as native share for now).

Rename "50 Greek Words" → "Biblical Languages Library" (label only this phase; Hebrew tables come with Phase for Biblical Languages expansion).

## 5. Translations

Add EN/ES/PT strings for all new UI labels to `src/config/translations.ts`. Content itself comes from DB in the selected language with EN fallback.

## What is NOT in Phase 1

Deferred to explicit later phases so nothing ships broken:
- Prayer Journal, My Notes, Favorites sync
- Join Prayer & Fire request form + admin approval workflow
- Rebuilt Share page with editable admin links
- Native push notifications (APNs/FCM) — needs your credentials
- AI Assistant edge function + admin controls
- Hebrew words + Biblical Expressions tables
- Store multi-image, Shopify link, drag-reorder upgrades

After you approve Phase 1, I'll ship it end-to-end (migration → screens → admin → drawer → translations → verify), then we move to Phase 2.
