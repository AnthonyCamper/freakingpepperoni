// Calorie + macro estimation from ingredient lines.
// A compact, transparent food table (per 100 g) plus volume->gram densities
// lets us estimate nutrition without any external API. It is intentionally
// approximate: results are always labelled "estimated" until an editor
// confirms or overrides them.

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

interface Food {
  // per 100 g
  kcal: number; protein: number; carbs: number; fat: number
  satFat?: number; fiber?: number; sugar?: number; sodium?: number // sodium mg/100g
  gramsPerCup?: number // density for volume measures
  gramsPerUnit?: number // weight of one "each" (1 egg, 1 onion)
}

// Keyword -> food. Keys are matched against the ingredient text (longest first),
// so "brown sugar" wins over "sugar". Values are rough USDA-ballpark numbers.
const FOODS: Record<string, Food> = {
  // Fats & oils
  'olive oil': { kcal: 884, protein: 0, carbs: 0, fat: 100, satFat: 14, gramsPerCup: 216, sodium: 2 },
  'vegetable oil': { kcal: 884, protein: 0, carbs: 0, fat: 100, satFat: 15, gramsPerCup: 218 },
  'canola oil': { kcal: 884, protein: 0, carbs: 0, fat: 100, satFat: 7, gramsPerCup: 218 },
  'butter': { kcal: 717, protein: 0.9, carbs: 0.1, fat: 81, satFat: 51, sodium: 11, gramsPerCup: 227 },
  'oil': { kcal: 884, protein: 0, carbs: 0, fat: 100, satFat: 13, gramsPerCup: 218 },
  // Flours, grains, starches
  'all-purpose flour': { kcal: 364, protein: 10, carbs: 76, fat: 1, fiber: 2.7, sugar: 0.3, gramsPerCup: 125 },
  'bread flour': { kcal: 361, protein: 12, carbs: 73, fat: 1.6, fiber: 2.4, gramsPerCup: 127 },
  'flour': { kcal: 364, protein: 10, carbs: 76, fat: 1, fiber: 2.7, gramsPerCup: 125 },
  'rice': { kcal: 365, protein: 7, carbs: 80, fat: 0.7, fiber: 1.3, gramsPerCup: 185 },
  'pasta': { kcal: 371, protein: 13, carbs: 75, fat: 1.5, fiber: 3.2, gramsPerCup: 100 },
  'spaghetti': { kcal: 371, protein: 13, carbs: 75, fat: 1.5, fiber: 3.2, gramsPerCup: 100 },
  'breadcrumbs': { kcal: 395, protein: 14, carbs: 72, fat: 5, fiber: 4.5, sodium: 732, gramsPerCup: 108 },
  'cornmeal': { kcal: 370, protein: 7, carbs: 79, fat: 1.8, fiber: 7, gramsPerCup: 122 },
  'oats': { kcal: 389, protein: 17, carbs: 66, fat: 7, fiber: 11, gramsPerCup: 81 },
  // Sugars & sweeteners
  'brown sugar': { kcal: 380, protein: 0, carbs: 98, fat: 0, sugar: 97, gramsPerCup: 220 },
  'powdered sugar': { kcal: 389, protein: 0, carbs: 100, fat: 0, sugar: 98, gramsPerCup: 120 },
  'sugar': { kcal: 387, protein: 0, carbs: 100, fat: 0, sugar: 100, gramsPerCup: 200 },
  'honey': { kcal: 304, protein: 0.3, carbs: 82, fat: 0, sugar: 82, gramsPerCup: 340 },
  'maple syrup': { kcal: 260, protein: 0, carbs: 67, fat: 0, sugar: 60, gramsPerCup: 322 },
  // Dairy & eggs
  'heavy cream': { kcal: 340, protein: 2.8, carbs: 2.8, fat: 36, satFat: 23, gramsPerCup: 238 },
  'sour cream': { kcal: 198, protein: 2.4, carbs: 4.6, fat: 19, satFat: 11, gramsPerCup: 230 },
  'milk': { kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.3, satFat: 1.9, sodium: 43, gramsPerCup: 244 },
  'parmesan': { kcal: 431, protein: 38, carbs: 4, fat: 29, satFat: 19, sodium: 1529, gramsPerCup: 100 },
  'mozzarella': { kcal: 280, protein: 28, carbs: 3, fat: 17, satFat: 10, sodium: 627, gramsPerCup: 112 },
  'cheddar': { kcal: 403, protein: 25, carbs: 1.3, fat: 33, satFat: 21, sodium: 621, gramsPerCup: 113 },
  'cream cheese': { kcal: 342, protein: 6, carbs: 4, fat: 34, satFat: 19, sodium: 321, gramsPerCup: 232 },
  'ricotta': { kcal: 174, protein: 11, carbs: 3, fat: 13, satFat: 8, sodium: 84, gramsPerCup: 246 },
  'cheese': { kcal: 402, protein: 25, carbs: 1.3, fat: 33, satFat: 21, sodium: 621, gramsPerCup: 113 },
  'egg': { kcal: 143, protein: 13, carbs: 0.7, fat: 9.5, satFat: 3.1, sodium: 142, gramsPerUnit: 50 },
  'yogurt': { kcal: 59, protein: 10, carbs: 3.6, fat: 0.4, sodium: 36, gramsPerCup: 245 },
  // Proteins
  'ground beef': { kcal: 250, protein: 26, carbs: 0, fat: 15, satFat: 6, sodium: 75, gramsPerCup: 225 },
  'beef': { kcal: 250, protein: 26, carbs: 0, fat: 15, satFat: 6, sodium: 72 },
  'chicken': { kcal: 165, protein: 31, carbs: 0, fat: 3.6, satFat: 1, sodium: 74 },
  'pork': { kcal: 242, protein: 27, carbs: 0, fat: 14, satFat: 5, sodium: 62 },
  'sausage': { kcal: 301, protein: 18, carbs: 1, fat: 25, satFat: 9, sodium: 791 },
  'pepperoni': { kcal: 504, protein: 19, carbs: 1.2, fat: 46, satFat: 17, sodium: 1582 },
  'bacon': { kcal: 541, protein: 37, carbs: 1.4, fat: 42, satFat: 14, sodium: 1717 },
  'pancetta': { kcal: 449, protein: 14, carbs: 0, fat: 43, satFat: 15, sodium: 2000 },
  'salmon': { kcal: 208, protein: 20, carbs: 0, fat: 13, satFat: 3, sodium: 59 },
  'shrimp': { kcal: 99, protein: 24, carbs: 0.2, fat: 0.3, sodium: 111 },
  'tuna': { kcal: 132, protein: 28, carbs: 0, fat: 1, sodium: 247 },
  // Legumes & nuts
  'beans': { kcal: 127, protein: 9, carbs: 23, fat: 0.5, fiber: 6, sodium: 1, gramsPerCup: 180 },
  'chickpeas': { kcal: 164, protein: 9, carbs: 27, fat: 2.6, fiber: 8, sodium: 7, gramsPerCup: 164 },
  'lentils': { kcal: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 8, gramsPerCup: 198 },
  'almonds': { kcal: 579, protein: 21, carbs: 22, fat: 50, fiber: 12, gramsPerCup: 143 },
  'walnuts': { kcal: 654, protein: 15, carbs: 14, fat: 65, fiber: 7, gramsPerCup: 117 },
  'peanut butter': { kcal: 588, protein: 25, carbs: 20, fat: 50, satFat: 10, sodium: 426, gramsPerCup: 258 },
  // Vegetables & aromatics
  'onion': { kcal: 40, protein: 1.1, carbs: 9, fat: 0.1, fiber: 1.7, sodium: 4, gramsPerCup: 160, gramsPerUnit: 110 },
  'garlic': { kcal: 149, protein: 6.4, carbs: 33, fat: 0.5, fiber: 2.1, sodium: 17, gramsPerUnit: 3 },
  'tomato': { kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sodium: 5, gramsPerCup: 180, gramsPerUnit: 123 },
  'crushed tomatoes': { kcal: 32, protein: 1.6, carbs: 7, fat: 0.3, fiber: 1.9, sodium: 186, gramsPerCup: 240 },
  'tomato paste': { kcal: 82, protein: 4.3, carbs: 19, fat: 0.5, fiber: 4, sodium: 59, gramsPerCup: 262 },
  'carrot': { kcal: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, sodium: 69, gramsPerCup: 128, gramsPerUnit: 61 },
  'celery': { kcal: 16, protein: 0.7, carbs: 3, fat: 0.2, fiber: 1.6, sodium: 80, gramsPerCup: 101 },
  'potato': { kcal: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.2, sodium: 6, gramsPerUnit: 173 },
  'mushroom': { kcal: 22, protein: 3.1, carbs: 3.3, fat: 0.3, fiber: 1, sodium: 5, gramsPerCup: 70 },
  'spinach': { kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sodium: 79, gramsPerCup: 30 },
  'bell pepper': { kcal: 31, protein: 1, carbs: 6, fat: 0.3, fiber: 2.1, sodium: 4, gramsPerUnit: 119 },
  // Pantry / seasoning
  'salt': { kcal: 0, protein: 0, carbs: 0, fat: 0, sodium: 38758, gramsPerCup: 273 },
  'baking soda': { kcal: 0, protein: 0, carbs: 0, fat: 0, sodium: 27360, gramsPerCup: 220 },
  'baking powder': { kcal: 53, protein: 0, carbs: 28, fat: 0, sodium: 10600, gramsPerCup: 220 },
  'cocoa': { kcal: 228, protein: 20, carbs: 58, fat: 14, fiber: 33, gramsPerCup: 86 },
  'chocolate chips': { kcal: 502, protein: 4.2, carbs: 64, fat: 30, satFat: 18, sugar: 54, gramsPerCup: 170 },
  'vanilla': { kcal: 288, protein: 0.1, carbs: 13, fat: 0.1, gramsPerCup: 208 },
  'wine': { kcal: 83, protein: 0.1, carbs: 2.7, fat: 0, gramsPerCup: 240 },
  'broth': { kcal: 6, protein: 0.9, carbs: 0.4, fat: 0.2, sodium: 343, gramsPerCup: 240 },
  'stock': { kcal: 6, protein: 0.9, carbs: 0.4, fat: 0.2, sodium: 343, gramsPerCup: 240 },
  'water': { kcal: 0, protein: 0, carbs: 0, fat: 0, gramsPerCup: 237 },
}

const FOOD_KEYS = Object.keys(FOODS).sort((a, b) => b.length - a.length)

// Convert a parsed ingredient to grams of the matched food, when possible.
const VOLUME_ML: Record<string, number> = {
  cup: 236.588, tbsp: 14.787, tsp: 4.929, floz: 29.574, pint: 473.176,
  quart: 946.353, gallon: 3785.41, ml: 1, l: 1000,
}
const MASS_G: Record<string, number> = { oz: 28.3495, lb: 453.592, g: 1, kg: 1000 }

function gramsFor(p: ParsedIngredient, food: Food): number | null {
  const qty = p.qty ?? 1
  if (p.unit && MASS_G[p.unit]) return qty * MASS_G[p.unit]
  if (p.unit && VOLUME_ML[p.unit]) {
    const gramsPerMl = (food.gramsPerCup ?? 240) / 236.588
    return qty * VOLUME_ML[p.unit] * gramsPerMl
  }
  // no unit: "3 eggs", "1 onion" -> per-unit weight, else assume one cup-ish item
  if (food.gramsPerUnit) return qty * food.gramsPerUnit
  return null
}

function matchFood(text: string): string | null {
  const lower = text.toLowerCase()
  for (const key of FOOD_KEYS) {
    if (lower.includes(key)) return key
  }
  return null
}

export interface EstimateResult {
  perServing: Nutrition
  total: Nutrition
  matched: number // ingredients we could price
  unmatched: string[] // ingredient lines we skipped
}

const EMPTY = (): Nutrition => ({ calories: 0, protein: 0, carbs: 0, fat: 0, saturatedFat: 0, fiber: 0, sugar: 0, sodium: 0, source: 'estimated' })

// Estimate nutrition for a whole recipe, divided across `servings`.
export function estimateNutrition(ingredients: string[], servings: number): EstimateResult {
  const total = EMPTY()
  let matched = 0
  const unmatched: string[] = []

  for (const raw of ingredients) {
    if (!raw.trim()) continue
    const p = parseIngredient(raw)
    const key = matchFood(p.rest || raw)
    if (!key) { unmatched.push(raw.trim()); continue }
    const food = FOODS[key]
    const grams = gramsFor(p, food)
    if (grams == null) { unmatched.push(raw.trim()); continue }
    const f = grams / 100
    matched++
    total.calories += food.kcal * f
    total.protein += food.protein * f
    total.carbs += food.carbs * f
    total.fat += food.fat * f
    total.saturatedFat = (total.saturatedFat ?? 0) + (food.satFat ?? 0) * f
    total.fiber = (total.fiber ?? 0) + (food.fiber ?? 0) * f
    total.sugar = (total.sugar ?? 0) + (food.sugar ?? 0) * f
    total.sodium = (total.sodium ?? 0) + (food.sodium ?? 0) * f
  }

  const div = Math.max(1, servings)
  const round = (n: number, d = 0) => { const m = 10 ** d; return Math.round(n * m) / m }
  const perServing: Nutrition = {
    calories: round(total.calories / div),
    protein: round(total.protein / div),
    carbs: round(total.carbs / div),
    fat: round(total.fat / div),
    saturatedFat: round((total.saturatedFat ?? 0) / div, 1),
    fiber: round((total.fiber ?? 0) / div, 1),
    sugar: round((total.sugar ?? 0) / div, 1),
    sodium: round((total.sodium ?? 0) / div),
    source: 'estimated',
  }
  return { perServing, total, matched, unmatched }
}

// % Daily Value reference amounts (FDA 2,000 kcal diet).
export const DAILY_VALUES = { fat: 78, saturatedFat: 20, carbs: 275, fiber: 28, sodium: 2300, protein: 50 }
