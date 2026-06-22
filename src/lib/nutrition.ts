// Calorie + macro estimation backed by the owned USDA `foods` table.
// Ingredient lines are parsed in TS (quantities/units), matched to foods by the
// Postgres `match_foods` RPC (trigram fuzzy search over ~7,800 USDA items), then
// portioned to grams and summed. No hardcoded food list — it scales with the DB.

import { supabase } from './supabase'
import { parseIngredient, type ParsedIngredient } from './ingredients'

export interface Nutrition {
  calories: number
  protein: number // g
  carbs: number // g
  fat: number // g
  saturatedFat?: number // g
  fiber?: number // g
  sugar?: number // g
  sodium?: number // mg
  source: 'manual' | 'estimated'
}

// A row returned by match_foods (nutrients per 100 g).
export interface FoodMatch {
  query: string
  food_name: string
  kcal: number; protein: number; carbs: number; fat: number
  sat_fat: number | null; fiber: number | null; sugar: number | null; sodium: number | null
  density_g_per_cup: number | null; grams_per_unit: number | null; score: number
}

export interface EstimateResult {
  perServing: Nutrition
  matched: number
  unmatched: string[]
  matches: { line: string; food: string }[] // what each line resolved to
}

// Unit -> base amount (ml for volume, g for mass). Mirrors ingredients.ts.
const VOLUME_ML: Record<string, number> = {
  cup: 236.588, tbsp: 14.787, tsp: 4.929, floz: 29.574, pint: 473.176,
  quart: 946.353, gallon: 3785.41, ml: 1, l: 1000,
}
const MASS_G: Record<string, number> = { oz: 28.3495, lb: 453.592, g: 1, kg: 1000 }

// Strip a recipe ingredient line down to its core food noun for matching:
// drop the leading quantity/unit (already removed in `rest`), parentheticals,
// trailing prep clauses after a comma, and size/prep adjectives.
const ADJECTIVES = new Set([
  'fresh', 'freshly', 'large', 'small', 'medium', 'extra', 'ripe', 'finely', 'coarsely',
  'chopped', 'diced', 'sliced', 'minced', 'grated', 'shredded', 'melted', 'softened',
  'packed', 'sifted', 'beaten', 'cold', 'warm', 'hot', 'room', 'temperature', 'peeled',
  'cooked', 'uncooked', 'boneless', 'skinless', 'organic', 'unsalted', 'salted', 'plain',
  'whole', 'halved', 'quartered', 'crushed', 'ground', 'of', 'the', 'a', 'an', 'good',
  'quality', 'pure', 'raw', 'about', 'approximately', 'optional', 'lightly', 'roughly',
])

export function cleanIngredientName(rest: string): string {
  let s = (rest || '').toLowerCase()
  s = s.replace(/\([^)]*\)/g, ' ') // drop parentheticals
  s = s.split(',')[0] // keep the head clause ("flour, sifted" -> "flour")
  s = s.replace(/[^a-z\s-]/g, ' ') // strip stray punctuation/digits
  const words = s.split(/\s+/).filter((w) => w && !ADJECTIVES.has(w))
  return words.join(' ').trim()
}

// Convert a parsed ingredient + its matched food to grams of that food.
export function gramsForMatch(p: ParsedIngredient, food: FoodMatch): number | null {
  const qty = p.qty ?? 1
  if (p.unit && MASS_G[p.unit]) return qty * MASS_G[p.unit]
  if (p.unit && VOLUME_ML[p.unit]) {
    const ml = qty * VOLUME_ML[p.unit]
    const gramsPerMl = food.density_g_per_cup != null ? food.density_g_per_cup / 236.588 : 1 // assume water if unknown
    return ml * gramsPerMl
  }
  // no unit: a count ("3 eggs") needs a per-unit weight, else we can't size it
  if (food.grams_per_unit != null) return qty * food.grams_per_unit
  return null
}

const round = (n: number, d = 0) => { const m = 10 ** d; return Math.round(n * m) / m }

// Aggregate nutrition for a recipe given an already-built name -> food map.
// Pure and synchronous, so it's unit-testable and reusable by the backfill.
export function aggregateFromMatches(
  ingredients: string[], matchByName: Map<string, FoodMatch>, servings: number,
): EstimateResult {
  let calories = 0, protein = 0, carbs = 0, fat = 0, satFat = 0, fiber = 0, sugar = 0, sodium = 0
  let matched = 0
  const unmatched: string[] = []
  const matches: { line: string; food: string }[] = []

  for (const raw of ingredients) {
    if (!raw.trim()) continue
    const p = parseIngredient(raw)
    const name = cleanIngredientName(p.rest || raw)
    const food = matchByName.get(name)
    if (!food) { unmatched.push(raw.trim()); continue }
    const grams = gramsForMatch(p, food)
    if (grams == null) { unmatched.push(raw.trim()); continue }
    const f = grams / 100
    matched++
    matches.push({ line: raw.trim(), food: food.food_name })
    calories += food.kcal * f
    protein += food.protein * f
    carbs += food.carbs * f
    fat += food.fat * f
    satFat += (food.sat_fat ?? 0) * f
    fiber += (food.fiber ?? 0) * f
    sugar += (food.sugar ?? 0) * f
    sodium += (food.sodium ?? 0) * f
  }

  const div = Math.max(1, servings)
  const perServing: Nutrition = {
    calories: round(calories / div),
    protein: round(protein / div),
    carbs: round(carbs / div),
    fat: round(fat / div),
    saturatedFat: round(satFat / div, 1),
    fiber: round(fiber / div, 1),
    sugar: round(sugar / div, 1),
    sodium: round(sodium / div),
    source: 'estimated',
  }
  return { perServing, matched, unmatched, matches }
}

// Look up the best food for each cleaned ingredient name via the DB.
export async function matchFoods(names: string[]): Promise<Map<string, FoodMatch>> {
  const unique = [...new Set(names.filter(Boolean))]
  const out = new Map<string, FoodMatch>()
  const CHUNK = 200
  for (let i = 0; i < unique.length; i += CHUNK) {
    const chunk = unique.slice(i, i + CHUNK)
    const { data, error } = await supabase.rpc('match_foods', { names: chunk })
    if (error) throw error
    for (const row of (data ?? []) as FoodMatch[]) {
      const prev = out.get(row.query)
      if (!prev || row.score > prev.score) out.set(row.query, row)
    }
  }
  return out
}

// Estimate per-serving nutrition for one recipe (matches + aggregates).
export async function estimateNutrition(ingredients: string[], servings: number): Promise<EstimateResult> {
  const names = ingredients
    .filter((l) => l.trim())
    .map((l) => cleanIngredientName(parseIngredient(l).rest || l))
  const map = await matchFoods(names)
  return aggregateFromMatches(ingredients, map, servings)
}

// Free-text food search for the editor's food picker.
export interface FoodSearchRow {
  id: number; name: string; category: string | null
  kcal: number; protein: number; carbs: number; fat: number
  sat_fat: number | null; fiber: number | null; sugar: number | null; sodium: number | null
}
export async function searchFoods(q: string, limit = 12): Promise<FoodSearchRow[]> {
  if (!q.trim()) return []
  const { data, error } = await supabase.rpc('search_foods', { q: q.trim(), lim: limit })
  if (error) throw error
  return (data ?? []) as FoodSearchRow[]
}

// % Daily Value reference amounts (FDA 2,000 kcal diet).
export const DAILY_VALUES = { fat: 78, saturatedFat: 20, carbs: 275, fiber: 28, sodium: 2300, protein: 50 }
