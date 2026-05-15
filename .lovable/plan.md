Most of what you listed is already admin-managed — only Home content and Verses are still hardcoded. Plan focuses on closing those two gaps without rebuilding what works.

## Already admin-managed (no work needed)
- **Store products** — `products` table + Admin → Products tab (title, description, image, category, external link, link type Amazon/Etsy/Stripe/External, button label).
- **Courses** — `courses` table + Admin → Courses tab (just shipped).
- **Events / Global Prayer** — `events` table + Admin → Events tab.
- **Connect section** — `app_links` table + Admin → Links tab (Instagram, email, WhatsApp, etc.).
- **Admin gating** — Admin Panel is PIN-locked AND role-checked; normal users never see controls.

The only missing field on Store is "Featured product" — added in step 2.

## What I'll build

### 1. `app_content` table (multilingual key/value)
One row per editable Home text block, with `value_en`, `value_es`, `value_pt`. Seeded with current Home strings:
- `welcome_message`
- `mission_text`
- `missions_support_text`
- `featured_devotional_title` + `_desc`
- `featured_course_title` + `_desc`
- `featured_resource_title` + `_desc`

RLS: public can read; only admins can write.

### 2. `verses` table (multilingual)
Columns: `text_en`, `ref_en`, `text_es`, `ref_es`, `text_pt`, `ref_pt`, `is_active`, `order_index`. Seeded with the 10 existing verses in all 3 languages. Same RLS as above.

### 3. Admin UI
Two new tabs in `AdminPanel.tsx`:
- **Content** (`AdminContent.tsx`) — list of content keys; each row expands to 3 textareas (EN/ES/PT) + Save.
- **Verses** (`AdminVerses.tsx`) — table with add/edit/delete; modal with EN/ES/PT text+reference fields, active toggle, order.

### 4. Wire HomeScreen to DB
- Replace `VERSES_BY_LANG` constant with a Supabase fetch from `verses` (filtered to active, picks one at random).
- Replace hardcoded `t("home_devotional_title")`, `t("home_mission_text")`, etc. with values from `app_content` (lang-aware), falling back to existing translations if a row is missing.

### 5. Featured product flag
Add `is_featured boolean default false` to `products`. Add a checkbox in the Add/Edit Product dialog. (No UI consumer change unless you later want a "Featured" carousel — flag is stored either way.)

## Out of scope (let me know if you want them)
- Translating admin-entered content automatically (admins fill EN/ES/PT manually, which is the safest for App Store review).
- "Welcome screen onboarding" copy — currently lives in `translations.ts`; making it DB-driven would force admins to maintain that too. Keep in translations unless you want it editable.

## Files touched
- New migration (creates `app_content`, `verses`, adds `is_featured` to `products`, seeds rows)
- New: `src/components/admin/AdminContent.tsx`
- New: `src/components/admin/AdminVerses.tsx`
- Edit: `src/components/AdminPanel.tsx` (2 new tabs, grid-cols-7)
- Edit: `src/components/HomeScreen.tsx` (load verses + content from DB with translation fallback)
- Edit: `src/components/admin/AdminProducts.tsx` (featured checkbox)

Approve and I'll implement.