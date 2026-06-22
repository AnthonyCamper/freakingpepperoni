// Ingredient line parsing, serving scaling, and US <-> metric conversion.
// The engine behind the recipe page's serving stepper and unit toggle.
// Everything is best-effort: a line we can't parse is passed through untouched
// so the worst case is "no conversion", never a mangled ingredient.

export type UnitSystem = 'original' | 'us' | 'metric'

export interface ParsedIngredient {
  qty: number | null // numeric quantity, or null when there's no leading number
  unit: string | null // normalized unit key (see UNITS), or null
  unitRaw: string | null // the unit exactly as written, for pass-through
  rest: string // everything after the quantity + unit ("flour, sifted")
  raw: string // the original line, verbatim
}

// Unicode fraction glyphs -> decimal.
const UNICODE_FRACTIONS: Record<string, number> = {
  '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3,
  '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8, '⅙': 1 / 6, '⅚': 5 / 6,
  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
}

// Unit aliases -> canonical key. Canonical keys carry a kind (volume/mass/count)
// and a base-unit factor used for conversion.
interface UnitDef { key: string; kind: 'volume' | 'mass'; toBase: number; system: 'us' | 'metric' }

// Volume base unit: milliliters. Mass base unit: grams.
const UNIT_TABLE: Record<string, UnitDef> = {
  // US volume
  cup: { key: 'cup', kind: 'volume', toBase: 236.588, system: 'us' },
  tbsp: { key: 'tbsp', kind: 'volume', toBase: 14.787, system: 'us' },
  tsp: { key: 'tsp', kind: 'volume', toBase: 4.929, system: 'us' },
  floz: { key: 'floz', kind: 'volume', toBase: 29.574, system: 'us' },
  pint: { key: 'pint', kind: 'volume', toBase: 473.176, system: 'us' },
  quart: { key: 'quart', kind: 'volume', toBase: 946.353, system: 'us' },
  gallon: { key: 'gallon', kind: 'volume', toBase: 3785.41, system: 'us' },
  // Metric volume
  ml: { key: 'ml', kind: 'volume', toBase: 1, system: 'metric' },
  l: { key: 'l', kind: 'volume', toBase: 1000, system: 'metric' },
  // US mass
  oz: { key: 'oz', kind: 'mass', toBase: 28.3495, system: 'us' },
  lb: { key: 'lb', kind: 'mass', toBase: 453.592, system: 'us' },
  // Metric mass
  g: { key: 'g', kind: 'mass', toBase: 1, system: 'metric' },
  kg: { key: 'kg', kind: 'mass', toBase: 1000, system: 'metric' },
}

const UNIT_ALIASES: Record<string, string> = {
  cup: 'cup', cups: 'cup', c: 'cup',
  tablespoon: 'tbsp', tablespoons: 'tbsp', tbsp: 'tbsp', tbsps: 'tbsp', tbs: 'tbsp', tb: 'tbsp', 'tbsp.': 'tbsp',
  teaspoon: 'tsp', teaspoons: 'tsp', tsp: 'tsp', tsps: 'tsp', 'tsp.': 'tsp',
  'fluid ounce': 'floz', 'fluid ounces': 'floz', floz: 'floz', 'fl oz': 'floz', 'fl-oz': 'floz',
  pint: 'pint', pints: 'pint', pt: 'pint',
  quart: 'quart', quarts: 'quart', qt: 'quart',
  gallon: 'gallon', gallons: 'gallon', gal: 'gallon',
  milliliter: 'ml', milliliters: 'ml', millilitre: 'ml', millilitres: 'ml', ml: 'ml',
  liter: 'l', liters: 'l', litre: 'l', litres: 'l', l: 'l',
  ounce: 'oz', ounces: 'oz', oz: 'oz', 'oz.': 'oz',
  pound: 'lb', pounds: 'lb', lb: 'lb', lbs: 'lb', 'lb.': 'lb',
  gram: 'g', grams: 'g', gramme: 'g', grammes: 'g', g: 'g', gr: 'g',
  kilogram: 'kg', kilograms: 'kg', kilo: 'kg', kilos: 'kg', kg: 'kg',
}

// Longest-first so "fluid ounce" beats "ounce".
const UNIT_PATTERN = Object.keys(UNIT_ALIASES)
  .sort((a, b) => b.length - a.length)
  .map((u) => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|')

// Leading quantity: mixed number "1 1/2", fraction "1/2", unicode "½",
// decimal "1.5", range "2-3" / "2 to 3". Captures the whole quantity text.
const QTY_RE = new RegExp(
  '^\\s*(' +
    '\\d+\\s*[-–]\\s*\\d+' + // range 2-3
    '|\\d+\\s+to\\s+\\d+' + // range 2 to 3
    '|\\d+\\s+\\d+\\/\\d+' + // mixed 1 1/2
    '|\\d+\\/\\d+' + // fraction 1/2
    '|\\d*\\s*[¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]' + // unicode, optional leading int
    '|\\d+(?:\\.\\d+)?' + // decimal / integer
  ')\\s*',
)

const UNIT_RE = new RegExp('^(' + UNIT_PATTERN + ')\\b\\.?\\s*', 'i')

// Turn a matched quantity string into a decimal. Ranges resolve to their
// midpoint for math but we remember the original span for display.
export function quantityToNumber(text: string): number | null {
  const t = text.trim().toLowerCase()
  if (!t) return null
  // range
  const range = t.match(/^(\d+(?:\.\d+)?)\s*(?:[-–]|to)\s*(\d+(?:\.\d+)?)$/)
  if (range) return (parseFloat(range[1]) + parseFloat(range[2])) / 2
  // unicode fraction, possibly with a leading integer ("1½")
  const uni = t.match(/^(\d+)?\s*([¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])$/)
  if (uni) return (uni[1] ? parseInt(uni[1], 10) : 0) + UNICODE_FRACTIONS[uni[2]]
  // mixed number "1 1/2"
  const mixed = t.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixed) return parseInt(mixed[1], 10) + parseInt(mixed[2], 10) / parseInt(mixed[3], 10)
  // simple fraction
  const frac = t.match(/^(\d+)\/(\d+)$/)
  if (frac) return parseInt(frac[1], 10) / parseInt(frac[2], 10)
  // decimal / integer
  const num = parseFloat(t)
  return Number.isFinite(num) ? num : null
}

export function parseIngredient(raw: string): ParsedIngredient {
  const line = raw.trim()
  const qtyMatch = line.match(QTY_RE)
  if (!qtyMatch) return { qty: null, unit: null, unitRaw: null, rest: line, raw }

  const qtyText = qtyMatch[1]
  const isRange = /[-–]|to/.test(qtyText)
  const qty = quantityToNumber(qtyText)
  let afterQty = line.slice(qtyMatch[0].length)

  const unitMatch = afterQty.match(UNIT_RE)
  let unit: string | null = null
  let unitRaw: string | null = null
  if (unitMatch) {
    unitRaw = unitMatch[1]
    unit = UNIT_ALIASES[unitMatch[1].toLowerCase()] ?? null
    afterQty = afterQty.slice(unitMatch[0].length)
  }

  return {
    qty,
    unit,
    unitRaw,
    rest: afterQty.trim(),
    // ranges are scaled but never unit-converted, so flag via raw round-trip
    raw: isRange ? raw : raw,
  }
}

// --- formatting -----------------------------------------------------------

const COMMON_FRACTIONS: [number, string][] = [
  [1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [3 / 8, '⅜'], [1 / 2, '½'],
  [5 / 8, '⅝'], [2 / 3, '⅔'], [3 / 4, '¾'], [7 / 8, '⅞'],
]

// Render a decimal back to a cook-friendly string: whole + nearest nice
// fraction when close, otherwise a trimmed decimal.
export function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) return ''
  if (value === 0) return '0'
  // Large amounts (e.g. converted grams/ml) read better as whole numbers than
  // as fractions: "227 g", not "226¾ g".
  if (value >= 10) return String(Math.round(value))
  const whole = Math.floor(value)
  const frac = value - whole

  if (frac < 0.02) return String(whole)
  for (const [f, glyph] of COMMON_FRACTIONS) {
    if (Math.abs(frac - f) < 0.04) return whole ? `${whole}${glyph}` : glyph
  }
  if (frac > 0.98) return String(whole + 1)
  // fall back to a tidy decimal
  const rounded = Math.round(value * 100) / 100
  return String(rounded)
}

// --- conversion -----------------------------------------------------------

// Choose a sensible metric unit for a converted base amount so we don't show
// "1500 ml" when "1.5 l" reads better.
function prettifyMetric(baseAmount: number, kind: 'volume' | 'mass'): { qty: number; unit: string } {
  if (kind === 'mass') {
    return baseAmount >= 1000 ? { qty: baseAmount / 1000, unit: 'kg' } : { qty: baseAmount, unit: 'g' }
  }
  return baseAmount >= 1000 ? { qty: baseAmount / 1000, unit: 'l' } : { qty: baseAmount, unit: 'ml' }
}

function prettifyUs(baseAmount: number, kind: 'volume' | 'mass'): { qty: number; unit: string } {
  if (kind === 'mass') {
    const oz = baseAmount / UNIT_TABLE.oz.toBase
    return oz >= 16 ? { qty: oz / 16, unit: 'lb' } : { qty: oz, unit: 'oz' }
  }
  // pick the largest US volume unit that yields qty >= 1
  for (const u of ['gallon', 'quart', 'pint', 'cup', 'tbsp', 'tsp']) {
    const q = baseAmount / UNIT_TABLE[u].toBase
    if (q >= 1 || u === 'tsp') return { qty: q, unit: u }
  }
  return { qty: baseAmount / UNIT_TABLE.tsp.toBase, unit: 'tsp' }
}

const UNIT_LABEL: Record<string, string> = {
  cup: 'cup', tbsp: 'tbsp', tsp: 'tsp', floz: 'fl oz', pint: 'pint', quart: 'quart',
  gallon: 'gallon', ml: 'ml', l: 'l', oz: 'oz', lb: 'lb', g: 'g', kg: 'kg',
}

// Pluralize the spelled-out-ish unit labels that take an 's'.
function unitLabel(unit: string, qty: number): string {
  const base = UNIT_LABEL[unit] ?? unit
  const pluralizes = ['cup', 'pint', 'quart', 'gallon']
  if (pluralizes.includes(unit) && qty > 1) return base + 's'
  return base
}

export interface ConvertResult {
  qty: number | null
  display: string // fully formatted line ready to render
}

// Scale by `factor` and optionally convert to a target unit system.
// Lines without a parseable quantity are returned unchanged.
export function transformIngredient(raw: string, factor: number, system: UnitSystem): string {
  const p = parseIngredient(raw)
  if (p.qty == null) return raw.trim()

  // A range like "2-3 eggs": scale both ends, keep as a range, no unit convert.
  const rangeMatch = raw.trim().match(QTY_RE)
  const isRange = rangeMatch ? /[-–]|to/.test(rangeMatch[1]) : false

  if (isRange) {
    const nums = rangeMatch![1].match(/\d+(?:\.\d+)?/g)!.map(Number)
    const lo = formatQuantity(nums[0] * factor)
    const hi = formatQuantity(nums[1] * factor)
    const tail = raw.trim().slice(rangeMatch![0].length)
    return `${lo}–${hi} ${tail}`.replace(/\s+/g, ' ').trim()
  }

  const scaledQty = p.qty * factor
  const def = p.unit ? UNIT_TABLE[p.unit] : null

  // No convertible unit (count items like "3 eggs", or an unknown unit):
  // just scale the number, keep the rest verbatim.
  if (!def || system === 'original') {
    const unitPart = p.unitRaw ? `${p.unitRaw} ` : ''
    return `${formatQuantity(scaledQty)} ${unitPart}${p.rest}`.replace(/\s+/g, ' ').trim()
  }

  if (system === def.system) {
    // same system: scale, keep the unit as-is
    return `${formatQuantity(scaledQty)} ${unitLabel(p.unit!, scaledQty)} ${p.rest}`.replace(/\s+/g, ' ').trim()
  }

  // cross-system conversion via base unit
  const baseAmount = scaledQty * def.toBase
  const out = system === 'metric' ? prettifyMetric(baseAmount, def.kind) : prettifyUs(baseAmount, def.kind)
  return `${formatQuantity(out.qty)} ${unitLabel(out.unit, out.qty)} ${p.rest}`.replace(/\s+/g, ' ').trim()
}

// Parse a free-text servings field ("4-6 people", "Serves 8") to a number.
export function parseServings(text: string | null, fallback = 4): number {
  if (!text) return fallback
  const m = text.match(/\d+(?:\.\d+)?/)
  return m ? parseFloat(m[0]) : fallback
}
