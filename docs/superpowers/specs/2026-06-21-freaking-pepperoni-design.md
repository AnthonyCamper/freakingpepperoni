# Freaking Pepperoni — Design Doc

**Date:** 2026-06-21
**Status:** Approved — ready for implementation plan

## What we're building

A family recipe website with a strong, distinct personality. Real recipes gathered
from friends and family over 50 years, paired with the stories behind the food.
Deliberately *not* AI slop, and deliberately *not* a polished, fake-friendly SEO
recipe blog. You arrive and you can feel that people have been eating this food for
a long time.

## Personality / voice

The defining word from the original vision is **"unfriendly,"** which means two
specific things here:

- **Attitude / irreverent** — gruff, funny, has a personality. Like a grumpy uncle
  who loves you but won't coddle you. The copy has sass and good jokes.
- **Insider / exclusive** — it feels like a closed family circle you're lucky to
  peek into. Not trying to be welcoming to the whole internet.

It must be **fun, funny, and full of good stories.**

## Core decisions

| Topic | Decision |
|---|---|
| Who posts content | **Dad + a few trusted family editors.** A small handful can post. Not open to the public. |
| Editor tech skill | **Not technical at all.** Posting is a simple form (title, ingredients, steps, optional story, photo, gear) + save. No code, no files, no Markdown. |
| Recipe ↔ story | **Recipe-first; story optional.** The recipe is the main event. A story enriches it when there's one to tell. |
| Layout religion | **Recipe first, no scrolling to reach it. Story is a real second section right below.** The explicit anti-recipe-blog rule. |
| Recipe names | **Have personality.** "Uncle Sal's Bet-Winning Chili," not "Classic Beef Chili." |
| Engagement hook | **Recipe of the Week**, front and center. Plus related recipes to pull people deeper. |
| Monetization | **Affiliate links** as a small in-character **"Recommended Gear"** box *on each recipe page* — not a separate nav section. |

## Visual direction (resolved)

The aesthetic is locked via the Stitch project **"Grumpy Uncle Kitchen"** — an
"Analog Digital" / brutalist index-card look:

- **Colors:** Tomato Red `#b22222` (CTAs, branding heat), Flour White `#faf9f5`
  (canvas), Charcoal ink (text/borders, never pure black), Oil-Stain sepia/brown
  (worn accents). No gradients, no neon, no transparency.
- **Typography:** **Domine** (heavy serif headlines), **Public Sans** (legible body),
  **Courier Prime** (monospaced labels/metadata — cook time, yield).
- **Shapes & depth:** Sharp 0-radius corners; 2px charcoal borders; "offset-border"
  pseudo-shadows (a solid block offset 4px down/right) instead of blurs; horizontal
  rules as ink/tear lines. Circular slightly-irregular "stamp" badges for things like
  "Recipe of the Week."
- **Buttons:** Blocky, tomato red, 2px border; on hover shift up-left to reveal a
  solid black shadow.

**Visual fidelity:** The Stitch project ships finished HTML for Home, Recipe, and
Add-Recipe screens. These are the **exact visual reference** — the React components
must reproduce that layout, spacing, type scale, and copy tone faithfully (down to the
"Hardware / Execution" recipe layout, the stamp badges, and the offset-border cards).
The Stitch HTML/CSS is pulled and used as the source of truth for markup/styling, then
componentized and wired to live data.

## Architecture

- **Frontend:** Vite + React + TypeScript SPA, Tailwind CSS, React Router. Deployed to
  **GitHub Pages** via GitHub Actions. Hash-based routing (or 404 fallback) so deep
  links work on Pages.
- **Backend:** **Supabase** — Postgres (data), Auth (editor login), Storage (photos).
- **Data flow:** Browser talks to Supabase directly via `supabase-js` using the public
  anon key. Public read on published recipes; writes restricted to authenticated
  editors via Row-Level Security + an `editors` allowlist. New recipes appear on
  refresh — no rebuild needed.

## Data model (Postgres)

- **`categories`** — `id`, `slug`, `name`, `sort_order`. Seeded set:
  Appetizers & Snacks, Soups & Stews, Mains, Pasta & Italian, Sides, Breads,
  Desserts, Cookies & Candy, Sauces & Condiments, Everything Else (catch-all).
- **`recipes`** — `id`, `slug`, `name`, `tagline`, `summary`, `servings`,
  `servings_unit`, `prep_time`, `cook_time`, `total_time`, `ingredients text[]`,
  `steps text[]`, `story`, `notes`, `tags text[]`, `category_id`, `photo_url`,
  `is_published bool`, `created_at`, `updated_at`, `created_by`.
- **`recipe_gear`** — `id`, `recipe_id`, `label`, `url`, `blurb`, `sort_order`.
  Powers the per-recipe "Recommended Gear" box.
- **`app_config`** — single row; holds `recipe_of_week_id`.
- **`editors`** — `user_id` (FK → `auth.users`), `name`. Membership grants write access.

**Related recipes** are computed at read time from shared category/tags — no table.

### RLS policy summary
- `recipes`, `categories`, `recipe_gear`, `app_config`: public `SELECT` (recipes only
  where `is_published = true` for anon; editors see all).
- `INSERT`/`UPDATE`/`DELETE` on `recipes`, `recipe_gear`, `app_config`: allowed only
  when `auth.uid()` exists in `editors`.
- Storage `recipe-photos` bucket: public read; uploads restricted to editors.

## Pages

- **Home** — "Recipe of the Week" hero (stamp badge, photo, personality name, teasing
  one-liner, "Get the Recipe"); search bar + category chips; recipe-card grid (photo,
  personality name, teaser); footer with attitude.
- **Browse / Archive** — full grid, category filter + text search.
- **Recipe** — name → tagline → photo → **ingredients + steps immediately usable, no
  scroll** (two-column "Hardware / Execution" layout) → **Recommended Gear** box →
  **The Story** section → related recipes ("Other stuff you might like").
- **Add / Edit recipe** (editors only) — dead-simple form: title, tagline, photo
  upload (→ Storage), ingredients (add/remove lines), steps (add/remove), optional
  story, category dropdown, gear items (label + url + blurb), publish toggle, big
  **Save to the Archive** button.
- **Login** — Supabase email + password; editor-only. Auth guard on Add/Edit.

## Seeding (the 565 real recipes)

A Node script parses `recipes.csv` and loads all rows:
- Split `ingredient_blocks` / `instruction_blocks` into `ingredients[]` / `steps[]`
  (strip leading step numbers, preserve section headers as lines).
- Map `tags` → one `category_id` (best-effort; unmatched → "Everything Else").
- Slugify `name`; carry `summary`, `servings`, times, `notes`, `tags` through.
- `tagline` and `story` start **blank** — editors fill them in over time.
- `is_published = true` for all imported recipes.

## Deliverables ("all the plumbing")

Built and committed now; inert until the Supabase project exists:

1. **`supabase/migrations/`** — schema, RLS policies, storage bucket + policies, seed
   of `categories` and `app_config`.
2. **Seed script** (`scripts/seed.*`) — CSV → recipes, run once against the live project
   with a service-role key.
3. **Frontend app** — all pages above, wired to Supabase via `VITE_SUPABASE_URL` /
   `VITE_SUPABASE_ANON_KEY`, styled to the Grumpy Uncle Kitchen system.
4. **GitHub Actions** workflow — build + deploy to Pages.
5. **`.env.example`** and a **README** with the exact post-creation runbook:
   link project → push migrations → run seed → create editor logins → set the two
   GitHub secrets → enable Pages.

### Out of scope for the user (requires their Supabase project)
Creating the project, real URL/keys, running migrations against the live DB, creating
editor accounts, enabling Pages. Everything is built so this is a short, scripted
runbook.

## Deferred / not in v1

- Auto-generated personality names/taglines for the 565 imports (slop risk; editors do
  this by hand).
- Any gated/earned "insider" mechanics — insider feel is tone/copy only for now.
- A standalone GEAR/equipment catalog — affiliate gear lives per-recipe.
