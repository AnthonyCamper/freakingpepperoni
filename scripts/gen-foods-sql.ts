// Build the `foods` seed from the USDA FoodData Central SR Legacy dataset.
//
// 1. Download + unzip the public-domain dataset:
//    curl -L -o sr.zip https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip
//    unzip sr.zip -d /tmp/sr
// 2. Run: npx tsx scripts/gen-foods-sql.ts /tmp/sr/FoodData_Central_sr_legacy_food_csv_2018-04
//    -> writes /tmp/foods/batch-*.sql (apply each via the DB).
import { readFileSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import Papa from 'papaparse'

const dir = process.argv[2]
if (!dir) { console.error('Usage: tsx gen-foods-sql.ts <sr-legacy-csv-dir>'); process.exit(1) }

// Per-100g nutrient ids we care about (USDA FoodData Central nutrient.id).
const NUTRIENTS: Record<string, keyof FoodAgg> = {
  '1008': 'kcal', '1003': 'protein', '1004': 'fat', '1005': 'carbs',
  '1079': 'fiber', '2000': 'sugar', '1093': 'sodium', '1258': 'sat_fat',
}
interface FoodAgg {
  kcal?: number; protein?: number; fat?: number; carbs?: number
  fiber?: number; sugar?: number; sodium?: number; sat_fat?: number
}

const read = (f: string) => readFileSync(join(dir, f), 'utf8')
const parse = <T>(csv: string) => Papa.parse<T>(csv, { header: true, skipEmptyLines: true }).data

// --- foods (descriptions + categories) ---
const categories = new Map<string, string>()
for (const r of parse<{ id: string; description: string }>(read('food_category.csv'))) {
  categories.set(r.id, r.description)
}
interface FoodRow { fdc_id: string; description: string; food_category_id: string }
const foods = new Map<string, { name: string; category: string | null } & FoodAgg>()
for (const r of parse<FoodRow>(read('food.csv'))) {
  foods.set(r.fdc_id, { name: r.description, category: categories.get(r.food_category_id) ?? null })
}

// --- nutrients (36MB: stream line-by-line, capture first 4 quoted columns) ---
const fnLines = read('food_nutrient.csv').split('\n')
const rowRe = /^"([^"]*)","([^"]*)","([^"]*)","([^"]*)"/
let nutrientHits = 0
for (let i = 1; i < fnLines.length; i++) {
  const m = rowRe.exec(fnLines[i])
  if (!m) continue
  const [, , fdcId, nutrientId, amount] = m
  const key = NUTRIENTS[nutrientId]
  if (!key) continue
  const food = foods.get(fdcId)
  if (!food) continue
  const val = parseFloat(amount)
  if (Number.isFinite(val)) { food[key] = val; nutrientHits++ }
}

// --- portions (cup density + per-unit weight) ---
// SR Legacy stores the unit as free text in `modifier`, not measure_unit_id.
interface PortionRow { fdc_id: string; amount: string; modifier: string; gram_weight: string }
const VOLUME = /\b(cup|cups|tbsp|tablespoons?|tsp|teaspoons?|fl oz|fluid ounces?|pint|quart|gallon)\b/i
const WEIGHT = /\b(oz|ounces?|lb|lbs|pounds?|g|grams?|kg)\b/i
// grams-per-cup multiplier for non-cup volume units (cups per unit).
const cupsPer = (mod: string): number | null => {
  if (/\bcup/i.test(mod)) return 1
  if (/\b(tbsp|tablespoon)/i.test(mod)) return 16
  if (/\b(tsp|teaspoon)/i.test(mod)) return 48
  if (/\b(fl oz|fluid ounce)/i.test(mod)) return 8
  if (/\bpint/i.test(mod)) return 0.5
  if (/\bquart/i.test(mod)) return 0.25
  return null
}
const density = new Map<string, number>() // grams per cup
const perUnit = new Map<string, number>() // grams for "1 <item>"
for (const r of parse<PortionRow>(read('food_portion.csv'))) {
  const amt = parseFloat(r.amount); const g = parseFloat(r.gram_weight); const mod = r.modifier ?? ''
  if (!Number.isFinite(amt) || !Number.isFinite(g) || amt <= 0 || g <= 0) continue
  const cups = cupsPer(mod)
  if (cups != null) {
    if (!density.has(r.fdc_id)) density.set(r.fdc_id, (g / amt) * cups)
  } else if (amt === 1 && mod && !VOLUME.test(mod) && !WEIGHT.test(mod) && !perUnit.has(r.fdc_id)) {
    perUnit.set(r.fdc_id, g) // a countable "each": piece, slice, egg, medium, serving...
  }
}

// --- emit batched INSERTs ---
const q = (v: string) => `'${v.replace(/'/g, "''")}'`
const n = (v: number | undefined) => (v == null || !Number.isFinite(v) ? 'NULL' : String(Math.round(v * 100) / 100))
const values: string[] = []
for (const [fdcId, f] of foods) {
  if (f.kcal == null) continue // skip foods with no energy data
  values.push(
    `(${fdcId}, ${q(f.name)}, ${f.category ? q(f.category) : 'NULL'}, ` +
    `${n(f.kcal)}, ${n(f.protein)}, ${n(f.carbs)}, ${n(f.fat)}, ${n(f.sat_fat)}, ` +
    `${n(f.fiber)}, ${n(f.sugar)}, ${n(f.sodium)}, ${n(density.get(fdcId))}, ${n(perUnit.get(fdcId))}, 'usda')`,
  )
}

// JSON for the bulk loader (scripts/load-foods.ts).
const jsonRows: Record<string, unknown>[] = []
for (const [fdcId, f] of foods) {
  if (f.kcal == null) continue
  const r = (v: number | undefined) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 100) / 100)
  jsonRows.push({
    fdc_id: Number(fdcId), name: f.name, category: f.category,
    kcal: r(f.kcal), protein: r(f.protein), carbs: r(f.carbs), fat: r(f.fat), sat_fat: r(f.sat_fat),
    fiber: r(f.fiber), sugar: r(f.sugar), sodium: r(f.sodium),
    density_g_per_cup: r(density.get(fdcId)), grams_per_unit: r(perUnit.get(fdcId)),
  })
}

const cols = 'fdc_id, name, category, kcal, protein, carbs, fat, sat_fat, fiber, sugar, sodium, density_g_per_cup, grams_per_unit, source'
const out = '/tmp/foods'
mkdirSync(out, { recursive: true })
writeFileSync(join(out, 'foods.json'), JSON.stringify(jsonRows))
for (const f of readdirSync(out)) if (f.endsWith('.sql')) writeFileSync(join(out, f), '')
const BATCH = 1000
let b = 0
for (let i = 0; i < values.length; i += BATCH) {
  const chunk = values.slice(i, i + BATCH)
  writeFileSync(join(out, `batch-${String(b).padStart(2, '0')}.sql`),
    `insert into public.foods (${cols}) values\n${chunk.join(',\n')}\non conflict (fdc_id) do nothing;\n`)
  b++
}
console.log(`foods=${foods.size} emitted=${values.length} nutrientHits=${nutrientHits} batches=${b} densities=${density.size} perUnit=${perUnit.size}`)
