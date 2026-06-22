# Freaking Pepperoni — Design Doc

**Date:** 2026-06-21
**Status:** Design in progress (decisions captured; some sections still open)

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
| Editor tech skill | **Not technical at all.** Posting must be a simple form (title, ingredients, steps, optional story, photo) + save. No code, no files, no Markdown. Build for the least-technical person. |
| Recipe ↔ story | **Recipe-first; story optional.** The recipe is the main event. A story enriches a recipe when there's one to tell, but isn't required. |
| Layout religion | **Recipe first, no scrolling to reach it. Story is a real second section right below.** Land on a recipe → ingredients and steps are immediately usable. Scroll down → the story is waiting, given its due, never in the way. This is the explicit anti-recipe-blog rule. |
| Recipe names | **Have personality.** "Uncle Sal's Bet-Winning Chili," not "Classic Beef Chili." |
| Engagement hook | **Recipe of the Week**, front and center. Plus discovery threads (related recipes) to pull people deeper. |
| Monetization | **Affiliate links**, woven in tastefully and in-character (e.g. "the cast-iron pan Grandpa swore by"). In scope. |

## V1 scope (all non-negotiable)

1. **Browse all recipes** — a scrollable list/grid of recipe cards.
2. **Read a single recipe** — full page: name, photo, ingredients, steps, story,
   related recipes. Layout follows the recipe-first rule above.
3. **Search / filter** — find by name and by category (dinners, desserts,
   family-member collections, etc.).
4. **Editor experience** — trusted editors log in and add/edit recipes via the
   simple form.

Plus: a **Recipe of the Week** feature on the home page, and **related recipes** on
each recipe page to entice deeper browsing.

## Page sketches

- **Home** — "Recipe of the Week" hero front and center; below it a grid of recipe
  cards (photo, personality name, teasing one-liner); search bar + category filters;
  voice with attitude throughout.
- **Single recipe** — personality name → photo → ingredients + steps (immediately
  usable, no scroll) → "The Story" section → tasteful affiliate callouts → related
  recipes at the bottom.
- **Add/Edit recipe (editors)** — dead-simple form: title, photo upload,
  ingredients, steps, optional story, category, big save button.

## Open questions (still to decide)

- **Visual aesthetic specifics** — old-school cookbook / index-card / kitchen-table
  texture vs. cleaner modern. (User is exploring designs via stitch.withgoogle.com.)
- **Tech stack & hosting** — needs: small-set editor auth, a database for recipes,
  image storage, a public site, and a form-based admin. (Supabase is available in
  this environment and is a natural fit for auth + DB + storage; frontend TBD.)
- **Affiliate program details** — which network(s), how links are stored/managed.
- **Where "insider/exclusive" shows up mechanically** — purely tone/copy, or are
  there any gated/earned layers later? (Currently treated as tone only.)

## Notes

- A UI-generation prompt for stitch.withgoogle.com was produced from these decisions
  to explore visual direction.
