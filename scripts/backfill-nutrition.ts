// One-time backfill: compute and store per-serving nutrition for every published
// recipe using the owned USDA foods table. Run after foods are loaded:
//   npx tsx scripts/backfill-nutrition.ts
import { readFileSync } from 'node:fs'
import ws from 'ws'
import type { FoodMatch } from '../src/lib/nutrition.ts' // type-only: erased, no runtime load
;(globalThis as { WebSocket?: unknown }).WebSocket ??= ws

// Dynamic imports so the WebSocket shim is in place before supabase-js loads.
const { createClient } = await import('@supabase/supabase-js')
const { aggregateFromMatches, cleanIngredientName } = await import('../src/lib/nutrition.ts')
const { parseIngredient, parseServings } = await import('../src/lib/ingredients.ts')

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const get = (k: string) => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '')
const supabase = createClient(get('VITE_SUPABASE_URL')!, get('VITE_SUPABASE_ANON_KEY')!)

type Row = { id: number; ingredients: string[]; base_servings: number | null; servings: string | null }
const { data: recipes, error } = await supabase
  .from('recipes').select('id, ingredients, base_servings, servings').eq('is_published', true)
if (error) { console.error(error); process.exit(1) }
const rows = (recipes ?? []) as Row[]
console.log(`recipes: ${rows.length}`)

// 1) Collect every unique cleaned ingredient name, match them all in chunks.
const nameOf = (line: string) => cleanIngredientName(parseIngredient(line).rest || line)
const allNames = new Set<string>()
for (const r of rows) for (const line of r.ingredients) { const n = nameOf(line); if (n) allNames.add(n) }
const names = [...allNames]
console.log(`unique ingredient names: ${names.length}`)

const map = new Map<string, FoodMatch>()
const CHUNK = 100
for (let i = 0; i < names.length; i += CHUNK) {
  const { data, error: e } = await supabase.rpc('match_foods', { names: names.slice(i, i + CHUNK) })
  if (e) { console.error(e); process.exit(1) }
  for (const row of (data ?? []) as FoodMatch[]) {
    const prev = map.get(row.query)
    if (!prev || row.score > prev.score) map.set(row.query, row)
  }
  process.stdout.write(`\rmatched ${Math.min(i + CHUNK, names.length)}/${names.length}`)
}
console.log(`\nfoods matched: ${map.size}`)

// 2) Aggregate per recipe and store (skip recipes with too few matches to be useful).
let stored = 0, skipped = 0
for (const r of rows) {
  const servings = r.base_servings || parseServings(r.servings, 4)
  const est = aggregateFromMatches(r.ingredients, map, servings)
  if (est.matched < 2) { skipped++; continue }
  const { error: e } = await supabase.rpc('set_recipe_nutrition', { rid: r.id, n: est.perServing })
  if (e) { console.error('store', r.id, e.message); continue }
  stored++
  if (stored % 50 === 0) process.stdout.write(`\rstored ${stored}`)
}
console.log(`\ndone: stored=${stored} skipped(too few matches)=${skipped}`)
