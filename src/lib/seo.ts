// SEO helpers: document head management + schema.org Recipe structured data.
// The app is a client-rendered SPA, so we set <title>, meta, and a JSON-LD
// <script> at runtime. Google renders JS and reads these, which is what powers
// recipe rich results (the photo + time + rating cards in search).

import type { Nutrition, RecipeWithExtras } from './types'

const SITE_NAME = 'Freaking Pepperoni'
const DEFAULT_DESC = 'A family recipe archive. The good stuff, written down before it gets lost.'

// Parse a human time string ("30 minutes", "1 hr 15 min", "1.5 hours") into an
// ISO-8601 duration ("PT1H15M") for schema.org. Returns null when nothing parses.
export function toISODuration(text: string | null): string | null {
  if (!text) return null
  const t = text.toLowerCase()
  let hours = 0
  let minutes = 0
  const hMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:h\b|hr|hrs|hour)/)
  const mMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:m\b|min)/)
  if (hMatch) hours = parseFloat(hMatch[1])
  if (mMatch) minutes = parseFloat(mMatch[1])
  // bare number with no unit -> assume minutes
  if (!hMatch && !mMatch) {
    const bare = t.match(/(\d+(?:\.\d+)?)/)
    if (bare) minutes = parseFloat(bare[1])
  }
  // fold fractional hours into minutes
  if (hours % 1 !== 0) { minutes += (hours % 1) * 60; hours = Math.floor(hours) }
  minutes = Math.round(minutes)
  if (!hours && !minutes) return null
  return `PT${hours ? `${hours}H` : ''}${minutes ? `${minutes}M` : ''}`
}

function nutritionLd(n: Nutrition) {
  const round = (x?: number) => (x == null ? undefined : String(Math.round(x)))
  return {
    '@type': 'NutritionInformation',
    calories: n.calories ? `${Math.round(n.calories)} calories` : undefined,
    proteinContent: round(n.protein) && `${round(n.protein)} g`,
    carbohydrateContent: round(n.carbs) && `${round(n.carbs)} g`,
    fatContent: round(n.fat) && `${round(n.fat)} g`,
    saturatedFatContent: n.saturatedFat ? `${round(n.saturatedFat)} g` : undefined,
    fiberContent: n.fiber ? `${round(n.fiber)} g` : undefined,
    sugarContent: n.sugar ? `${round(n.sugar)} g` : undefined,
    sodiumContent: n.sodium ? `${round(n.sodium)} mg` : undefined,
  }
}

// Build the schema.org/Recipe JSON-LD object for a recipe.
export function recipeJsonLd(recipe: RecipeWithExtras, url: string): Record<string, unknown> {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.name,
    description: recipe.tagline || recipe.summary || DEFAULT_DESC,
    url,
    author: { '@type': 'Organization', name: SITE_NAME },
    datePublished: recipe.created_at?.slice(0, 10),
    dateModified: recipe.updated_at?.slice(0, 10),
    recipeIngredient: recipe.ingredients,
    recipeInstructions: recipe.steps.map((s, i) => ({
      '@type': 'HowToStep', position: i + 1, text: s,
    })),
  }
  if (recipe.photo_url) ld.image = [recipe.photo_url]
  if (recipe.category) ld.recipeCategory = recipe.category.name
  if (recipe.tags?.length) ld.keywords = recipe.tags.join(', ')
  if (recipe.servings) ld.recipeYield = recipe.servings
  const prep = toISODuration(recipe.prep_time)
  const cook = toISODuration(recipe.cook_time)
  const total = toISODuration(recipe.total_time)
  if (prep) ld.prepTime = prep
  if (cook) ld.cookTime = cook
  if (total) ld.totalTime = total
  if (recipe.nutrition) ld.nutrition = nutritionLd(recipe.nutrition)
  return ld
}

// --- runtime head management ---------------------------------------------

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export interface SeoInput {
  title: string
  description?: string
  image?: string | null
  type?: 'website' | 'article'
  jsonLd?: Record<string, unknown> | null
}

// Apply head tags. Returns a cleanup that removes the JSON-LD block (the rest
// is harmless to leave, and gets overwritten by the next page).
export function applySeo(input: SeoInput): () => void {
  const fullTitle = input.title === SITE_NAME ? SITE_NAME : `${input.title} — ${SITE_NAME}`
  const desc = input.description || DEFAULT_DESC
  document.title = fullTitle

  upsertMeta('name', 'description', desc)
  upsertMeta('property', 'og:site_name', SITE_NAME)
  upsertMeta('property', 'og:title', fullTitle)
  upsertMeta('property', 'og:description', desc)
  upsertMeta('property', 'og:type', input.type || 'website')
  upsertMeta('property', 'og:url', window.location.href)
  upsertMeta('name', 'twitter:card', input.image ? 'summary_large_image' : 'summary')
  upsertMeta('name', 'twitter:title', fullTitle)
  upsertMeta('name', 'twitter:description', desc)
  if (input.image) {
    upsertMeta('property', 'og:image', input.image)
    upsertMeta('name', 'twitter:image', input.image)
  }

  let script: HTMLScriptElement | null = null
  if (input.jsonLd) {
    script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(input.jsonLd)
    document.head.appendChild(script)
  }

  return () => { script?.remove() }
}

export { SITE_NAME, DEFAULT_DESC }
